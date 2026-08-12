import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { onSessionExpired } from "@/lib/auth-events";
import { config } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/storage";
import type { AgencyMembership } from "@/types/api";

const BASE = config.apiUrl;

// ─── Errors (ported from web AuthContext) ──────────────────────────────────────

/** Thrown by login() when the backend rejects with EMAIL_NOT_VERIFIED (403). */
export class EmailNotVerifiedError extends Error {
  constructor(public readonly email: string) {
    super("Please verify your email address before signing in.");
    this.name = "EmailNotVerifiedError";
  }
}

/**
 * Thrown by login() when the account has 2FA enabled. Carries the short-lived
 * (5m) challenge token — the UI shows a code screen and calls verifyTwoFactor().
 */
export class TwoFactorRequiredError extends Error {
  constructor(public readonly challengeToken: string) {
    super("Two-factor authentication required.");
    this.name = "TwoFactorRequiredError";
  }
}

/** Field-specific validation errors (422) / duplicate (409). */
export class FieldValidationError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors: Record<string, string>,
  ) {
    super(message);
    this.name = "FieldValidationError";
  }
}

function toFieldValidationError(
  status: number,
  body: { message?: string; errors?: Record<string, string[] | string> },
): FieldValidationError | null {
  // 422 — Zod: { errors: { email: ["..."], phone: ["..."] } }
  if (body.errors && typeof body.errors === "object") {
    const fieldErrors: Record<string, string> = {};
    for (const [field, msgs] of Object.entries(body.errors)) {
      fieldErrors[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
    }
    if (Object.keys(fieldErrors).length > 0) {
      return new FieldValidationError(body.message ?? "Validation error", fieldErrors);
    }
  }
  // 409 — Prisma unique constraint: message names the duplicate field.
  if (status === 409 && typeof body.message === "string") {
    const msg = body.message.toLowerCase();
    const field = msg.includes("email") ? "email" : msg.includes("phone") ? "phone" : null;
    if (field) return new FieldValidationError(body.message, { [field]: body.message });
  }
  return null;
}

// ─── JWT decode (self-contained base64 — no atob dependency) ────────────────────

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function base64Decode(input: string): string {
  const str = input.replace(/=+$/, "");
  let output = "";
  let bc = 0;
  let bs = 0;
  for (let i = 0; i < str.length; i++) {
    const buffer = B64.indexOf(str[i]);
    if (buffer === -1) continue;
    bs = bc % 4 ? bs * 64 + buffer : buffer;
    if (bc++ % 4) output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
  }
  return output;
}

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(base64Decode(b64));
  } catch {
    return null;
  }
}

// ─── Two-layer model ────────────────────────────────────────────────────────────

/** Layer 1: identity decoded from the access JWT. */
export interface AuthUser {
  userId: string;
  email: string;
}

/**
 * Layer 2: the profile from GET /api/users/me. On this backend the base User
 * carries the profile fields directly (no separate GeneralUser model — see
 * MOBILE_PLAN.md §3). agencyMemberships is optional/forward-compatible.
 */
export interface MeUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string | null;
  isActive: boolean;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  settings?: unknown;
  agencyMemberships?: AgencyMembership[];
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: { uri: string; name: string; type: string } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  /** GET /api/users/me profile (layer 2). */
  profile: MeUser | null;
  /** Web-compat alias of `profile` (the "GeneralUser" layer) used by AuthGate. */
  generalUser: MeUser | null;
  agencyMemberships: AgencyMembership[];
  isLoading: boolean;
  /** Returns true if the user has a profile. Throws TwoFactorRequiredError / EmailNotVerifiedError. */
  login: (email: string, password: string) => Promise<boolean>;
  /** Completes login after a 2FA challenge. Returns true if the user has a profile. */
  verifyTwoFactor: (challengeToken: string, code: string) => Promise<boolean>;
  register: (data: RegisterPayload) => Promise<string>;
  logout: () => Promise<void>;
  createGeneralProfile: (bio?: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(accessToken: string): Promise<MeUser | null> {
  try {
    const res = await fetch(`${BASE}/api/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return (body.data ?? null) as MeUser | null;
  } catch {
    return null;
  }
}

/**
 * Outcome of spending the stored refresh token. The three cases must stay
 * distinct: only an outright rejection means the session is over. A network
 * failure must NOT sign the user out, or launching the app offline would end a
 * perfectly good session.
 */
type RefreshOutcome =
  | { status: "ok"; accessToken: string }
  | { status: "rejected" }
  | { status: "unavailable" };

/**
 * Exchanges the stored refresh token for a fresh pair.
 *
 * Access tokens live 15 minutes (JWT_ACCESS_EXPIRES_IN); the refresh token is
 * what actually carries the session — the backend gives it a 30-day idle window
 * (SESSION_IDLE_DAYS) and rolls that deadline forward on every refresh. So an
 * expired access token at launch says nothing about whether the user is still
 * signed in, and must trigger a refresh rather than a logout.
 */
async function refreshSession(): Promise<RefreshOutcome> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return { status: "rejected" };

  let res: Response;
  try {
    res = await fetch(`${BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return { status: "unavailable" }; // offline / server unreachable
  }

  // 401 is the backend saying the idle window elapsed or the token was revoked.
  if (res.status === 401) return { status: "rejected" };
  if (!res.ok) return { status: "unavailable" }; // 5xx — transient, keep the tokens

  try {
    const body = await res.json();
    const tokens = body.data ?? body;
    if (!tokens?.accessToken || !tokens?.refreshToken) return { status: "unavailable" };
    await setTokens(tokens.accessToken, tokens.refreshToken);
    return { status: "ok", accessToken: tokens.accessToken as string };
  } catch {
    return { status: "unavailable" };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<MeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from secure-store on launch (splash held until this resolves).
  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();

        // 1. Access token still valid — use it as-is.
        if (token) {
          const payload = decodeJwt(token);
          if (payload && (payload.exp as number) * 1000 > Date.now()) {
            setUser({ userId: payload.userId as string, email: payload.email as string });
            setProfile(await fetchProfile(token));
            return;
          }
        }

        // 2. Access token missing or older than 15 minutes. This used to call
        //    clearTokens() and sign the user out — which threw away a refresh
        //    token good for another 30 idle days, so reopening the app after a
        //    short break logged them out. Spend the refresh token instead.
        const outcome = await refreshSession();

        if (outcome.status === "ok") {
          const payload = decodeJwt(outcome.accessToken);
          if (payload) {
            setUser({ userId: payload.userId as string, email: payload.email as string });
            setProfile(await fetchProfile(outcome.accessToken));
            return;
          }
        }

        // 3. Server unreachable: keep the tokens and carry on with the identity
        //    from the (expired) access token, so an offline launch isn't a logout.
        //    The axios 401 interceptor refreshes once connectivity returns.
        if (outcome.status === "unavailable") {
          const payload = token ? decodeJwt(token) : null;
          if (payload) {
            setUser({ userId: payload.userId as string, email: payload.email as string });
          }
          return;
        }

        // 4. Refresh genuinely rejected — 30 idle days elapsed, or it was revoked.
        await clearTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // The axios layer clears tokens when a refresh fails, but it can't touch React
  // state. Until this existed, `user` stayed set afterwards: the app looked signed
  // in, the persisted query cache kept rendering the previous session's data, and
  // every request went out with no Authorization header. Tear the session down so
  // the route guard sends them to sign in instead.
  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null);
        setProfile(null);
        // Drop cached authenticated data (saved properties, inquiries, chat) so it
        // can't be acted on — a stale row would only produce another 401.
        queryClient.clear();
      }),
    [],
  );

  /** Shared: persist tokens, set identity from the JWT, bootstrap the profile. */
  const establishSession = useCallback(async (accessToken: string, refreshToken: string) => {
    await setTokens(accessToken, refreshToken);
    const payload = decodeJwt(accessToken);
    if (payload) setUser({ userId: payload.userId as string, email: payload.email as string });
    const p = await fetchProfile(accessToken);
    setProfile(p);
    return p !== null;
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        if (body.errorCode === "EMAIL_NOT_VERIFIED") throw new EmailNotVerifiedError(email);
        throw new Error(body.message ?? "Login failed");
      }

      const data = body.data ?? body;
      // 2FA gate — password ok, code still required.
      if (data.twoFactorRequired) throw new TwoFactorRequiredError(data.challengeToken as string);
      if (!data.accessToken) throw new Error(body.message ?? "Login failed");

      return establishSession(data.accessToken, data.refreshToken);
    },
    [establishSession],
  );

  const verifyTwoFactor = useCallback(
    async (challengeToken: string, code: string): Promise<boolean> => {
      const res = await fetch(`${BASE}/api/auth/2fa/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken, code }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw toFieldValidationError(res.status, body) ?? new Error(body.message ?? "Invalid code");
      }
      const data = body.data ?? body;
      return establishSession(data.accessToken, data.refreshToken);
    },
    [establishSession],
  );

  const register = useCallback(async (payload: RegisterPayload): Promise<string> => {
    // multipart/form-data — do NOT set Content-Type (the runtime adds the boundary).
    const fd = new FormData();
    fd.append("email", payload.email);
    fd.append("password", payload.password);
    fd.append("firstName", payload.firstName);
    fd.append("lastName", payload.lastName);
    fd.append("phone", payload.phone);
    if (payload.avatar) fd.append("avatar", payload.avatar as unknown as Blob);

    const res = await fetch(`${BASE}/api/auth/register`, { method: "POST", body: fd });
    const body = await res.json();
    if (!res.ok) {
      throw toFieldValidationError(res.status, body) ?? new Error(body.message ?? "Registration failed");
    }
    return body.message as string;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        await fetch(`${BASE}/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // ignore — clear local state regardless
      }
    }
    await clearTokens();
    setUser(null);
    setProfile(null);
    // Same reasoning as the session-expiry path: the query cache is persisted to
    // AsyncStorage, so without this the next person to sign in on this device
    // would briefly see the previous user's saved properties and chats.
    queryClient.clear();
  }, []);

  const createGeneralProfile = useCallback(async (bio?: string) => {
    const token = await getAccessToken();
    // NOTE: endpoint gap flagged in MOBILE_PLAN.md §3/§4 — verify backend route.
    const res = await fetch(`${BASE}/general-users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ bio: bio ?? "" }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? body.message ?? "Failed to create profile");
    if (token) setProfile(await fetchProfile(token));
  }, []);

  const resendVerification = useCallback(async (email: string): Promise<void> => {
    const res = await fetch(`${BASE}/api/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message ?? "Failed to resend verification email");
  }, []);

  // Memoize so consumers don't re-render unless auth state actually changes.
  // The callbacks are already stable (useCallback), so identity only shifts on
  // user / profile / isLoading changes.
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      generalUser: profile,
      agencyMemberships: profile?.agencyMemberships ?? [],
      isLoading,
      login,
      verifyTwoFactor,
      register,
      logout,
      createGeneralProfile,
      resendVerification,
    }),
    [user, profile, isLoading, login, verifyTwoFactor, register, logout, createGeneralProfile, resendVerification],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
