import axios, { isAxiosError, type InternalAxiosRequestConfig } from "axios";
import { emitSessionExpired } from "@/lib/auth-events";
import { config } from "@/lib/config";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/storage";

// Mobile port of PropertyDockFrontend/src/lib/api.ts.
// Differences from web (MOBILE_PLAN.md §1):
//   - tokens live in expo-secure-store, so the interceptors are ASYNC
//   - no `window`/`localStorage`
const BASE = config.apiUrl;

const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach the access token to every request.
api.interceptors.request.use(async (cfg) => {
  const token = await getAccessToken();
  if (token) {
    cfg.headers.set("Authorization", `Bearer ${token}`);
  }
  return cfg;
});

// On 401 — try a refresh, then retry the original request once.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const refresh = await getRefreshToken();
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE}/api/auth/refresh`, {
            refreshToken: refresh,
          });
          const tokens = data.data ?? data;
          await setTokens(tokens.accessToken, tokens.refreshToken);
          original.headers.set("Authorization", `Bearer ${tokens.accessToken}`);
          return api(original);
        } catch (refreshError) {
          // Only a definitive rejection ends the session. A network blip or a 5xx
          // must NOT — otherwise a moment of bad connectivity signs the user out
          // despite the refresh token still being valid for weeks.
          const status = isAxiosError(refreshError) ? refreshError.response?.status : undefined;
          if (status === 401 || status === 403) {
            // Clearing tokens alone left `user` set in AuthContext, so the app kept
            // rendering persisted data and sending header-less requests. Announce
            // it so auth state and the cached data get torn down together.
            await clearTokens();
            emitSessionExpired();
          }
        }
      } else {
        // A 401 with no refresh token means the session is already gone (e.g. it
        // was cleared by an earlier failed refresh). Recover instead of staying
        // stuck in that state forever.
        await clearTokens();
        emitSessionExpired();
      }
    }

    const msg =
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message ??
      "Request failed";
    return Promise.reject(new Error(msg));
  },
);

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const { data } = await api.get<T>(path);
  return data;
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  const { data } = await api.post<T>(path, body);
  return data;
}

export async function apiPostFormData<T = unknown>(path: string, formData: FormData): Promise<T> {
  const { data } = await api.post<T>(path, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function apiPut<T = unknown>(path: string, body: unknown): Promise<T> {
  const { data } = await api.put<T>(path, body);
  return data;
}

export async function apiPatch<T = unknown>(path: string, body: unknown): Promise<T> {
  const { data } = await api.patch<T>(path, body);
  return data;
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  const { data } = await api.delete<T>(path);
  return data;
}

export default api;
