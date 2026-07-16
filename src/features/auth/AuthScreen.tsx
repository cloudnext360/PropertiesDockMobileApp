import { zodResolver } from "@hookform/resolvers/zod";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  MailWarning,
  ShieldCheck,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { BackHandler, Keyboard, Platform, Pressable, TextInput, View } from "react-native";

import { KeyboardAvoidingView } from "@/components/keyboard-avoiding-view";

import { Screen } from "@/components/screen";
import { Button, Input, Label, Text } from "@/components/ui";
import { PHONE_PLACEHOLDER } from "@/constants/locale";
import {
  EmailNotVerifiedError,
  FieldValidationError,
  TwoFactorRequiredError,
  useAuth,
} from "@/context/AuthContext";
import {
  LoginSchema,
  RegisterSchema,
  TwoFactorSchema,
  type LoginForm,
  type Mode,
  type RegisterForm,
} from "@/features/auth/schemas";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { useThemeTokens } from "@/theme/theme-provider";

// ─── Small building blocks (RN port of web components/auth/*) ───────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}

/** Input row with a show/hide toggle — visually matches the ui/Input styles. */
function PasswordInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  const tokens = useThemeTokens();
  const [show, setShow] = useState(false);
  return (
    <View className="h-11 flex-row items-center rounded-md border border-input bg-background px-3">
      <TextInput
        className="h-full flex-1 text-base text-foreground"
        placeholder={placeholder ?? "Password"}
        placeholderTextColor={tokens.mutedForeground}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoComplete="password"
        value={value}
        onChangeText={onChangeText}
      />
      <Pressable
        onPress={() => setShow((s) => !s)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={show ? "Hide password" : "Show password"}
      >
        {show ? (
          <EyeOff size={18} color={tokens.mutedForeground} />
        ) : (
          <Eye size={18} color={tokens.mutedForeground} />
        )}
      </Pressable>
    </View>
  );
}

/** Web AuthModeToggle — a two-segment pill. */
function ModeToggle({ mode, onSwitch }: { mode: Mode; onSwitch: (m: Mode) => void }) {
  return (
    <View className="mb-6 flex-row rounded-full bg-muted p-1">
      {(["signin", "signup"] as const).map((m) => (
        <Pressable
          key={m}
          onPress={() => onSwitch(m)}
          accessibilityRole="button"
          className={cn("flex-1 items-center rounded-full py-2.5", mode === m && "bg-brand")}
        >
          <Text
            className={cn(
              "text-sm font-jakarta-semibold",
              mode === m ? "text-brand-foreground" : "text-foreground/70",
            )}
          >
            {m === "signin" ? "Sign in" : "Sign up"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function PasswordHint({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Text className={cn("text-xs", ok ? "text-green-600" : "text-muted-foreground")}>
      {ok ? "✓" : "○"} {label}
    </Text>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────────

/**
 * Sign in / Sign up (RN port of web AuthPageComponent).
 * Two-step login: password → optional 2FA code. Handles EMAIL_NOT_VERIFIED with
 * an inline resend banner. On success routes to the tab shell (or
 * /complete-profile when the profile bootstrap fails — mirrors AuthGate).
 */
export function AuthScreen() {
  const router = useRouter();
  const tokens = useThemeTokens();
  const { login, verifyTwoFactor, register, resendVerification } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  // Email-not-verified banner state (web parity)
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendError, setResendError] = useState("");

  // 2FA challenge step — set when login() throws TwoFactorRequiredError
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  // Android hardware back. AuthGate lands here via replace(), leaving auth as
  // the only route in the stack — default back would exit the app. Pop when
  // there is history; otherwise go Home. On the 2FA step, back returns to the
  // sign-in form (mirrors the "Back to sign in" button).
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;

      const onBackPress = () => {
        if (challengeToken) {
          setChallengeToken(null);
          setServerError("");
          return true;
        }
        if (router.canGoBack()) return false;
        router.replace("/(tabs)");
        return true;
      };

      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => sub.remove();
    }, [challengeToken, router]),
  );

  const signinForm = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });
  const signupForm = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", phone: "" },
  });

  function resetFeedback() {
    setServerError("");
    setUnverifiedEmail("");
    setResendState("idle");
    setResendError("");
  }

  function switchMode(next: Mode) {
    setMode(next);
    resetFeedback();
    signinForm.clearErrors();
    signupForm.clearErrors();
  }

  function finishLogin(hasProfile: boolean) {
    haptics.success();
    router.replace(hasProfile ? "/(tabs)" : "/complete-profile");
  }

  /** Maps server-side FieldValidationError entries onto the active form. */
  function applyFieldErrors(err: FieldValidationError, form: "signin" | "signup") {
    const target = form === "signin" ? signinForm : signupForm;
    for (const [field, message] of Object.entries(err.fieldErrors)) {
      target.setError(field as keyof LoginForm & keyof RegisterForm, {
        type: "server",
        message,
      });
    }
  }

  const onSignIn = signinForm.handleSubmit(async (values) => {
    resetFeedback();
    setIsSubmitting(true);
    try {
      const hasProfile = await login(values.email, values.password);
      finishLogin(hasProfile);
    } catch (err) {
      haptics.warning();
      if (err instanceof EmailNotVerifiedError) {
        setUnverifiedEmail(err.email);
      } else if (err instanceof TwoFactorRequiredError) {
        setChallengeToken(err.challengeToken);
        setTwoFactorCode("");
      } else if (err instanceof FieldValidationError) {
        applyFieldErrors(err, "signin");
      } else {
        setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  const onSignUp = signupForm.handleSubmit(async (values) => {
    resetFeedback();
    setIsSubmitting(true);
    try {
      await register(values);
      haptics.success();
      signupForm.reset();
      // Finish sign-up on the verify-email screen (it owns the resend flow).
      router.push({ pathname: "/verify-email", params: { email: values.email } });
    } catch (err) {
      haptics.warning();
      if (err instanceof FieldValidationError) {
        applyFieldErrors(err, "signup");
      } else {
        setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  async function onVerifyTwoFactor() {
    const v = TwoFactorSchema.safeParse({ code: twoFactorCode.trim() });
    if (!v.success) {
      setServerError(v.error.issues[0].message);
      return;
    }
    if (!challengeToken) return;
    setServerError("");
    setIsSubmitting(true);
    try {
      const hasProfile = await verifyTwoFactor(challengeToken, v.data.code);
      finishLogin(hasProfile);
    } catch (err) {
      haptics.warning();
      setServerError(err instanceof Error ? err.message : "Invalid code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onResend() {
    setResendState("sending");
    setResendError("");
    try {
      await resendVerification(unverifiedEmail);
      setResendState("sent");
    } catch (err) {
      setResendState("error");
      setResendError(err instanceof Error ? err.message : "Failed to resend. Please try again.");
    }
  }

  // ── 2FA challenge step (second half of the two-step login) ──
  if (challengeToken) {
    return (
      <Screen scroll contentClassName="justify-center px-6 py-10">
        <View className="mx-auto w-full max-w-md items-center gap-2">
          <ShieldCheck size={40} color={tokens.brand} />
          <Text className="text-2xl font-jakarta-extrabold text-brand">Two-factor code</Text>
          <Text className="mb-4 text-center text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app to finish signing in.
          </Text>

          {serverError ? (
            <View className="mb-2 w-full rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
              <Text className="text-sm text-destructive">{serverError}</Text>
            </View>
          ) : null}

          <Input
            placeholder="123456"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textAlign="center"
            maxLength={20}
            className="w-full text-lg tracking-[8px]"
            value={twoFactorCode}
            onChangeText={setTwoFactorCode}
          />
          <Button
            variant="brand"
            className="mt-2 w-full"
            loading={isSubmitting}
            onPress={onVerifyTwoFactor}
          >
            Verify code
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onPress={() => {
              setChallengeToken(null);
              setServerError("");
            }}
          >
            Back to sign in
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll contentClassName="px-6 py-4">
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <Pressable
          onPress={() => {
            // dismissTo pops back to the still-mounted tab shell when it's in
            // history (push from Saved/chat) — replace() remounted the whole
            // shell, which lagged. Falls back to replace on cold entry (AuthGate).
            Keyboard.dismiss();
            router.dismissTo("/(tabs)");
          }}
          accessibilityRole="button"
          className="mb-6 flex-row items-center gap-2 self-start py-2"
        >
          <ArrowLeft size={18} color={tokens.mutedForeground} />
          <Text className="text-sm font-jakarta-bold text-muted-foreground">Back to home</Text>
        </Pressable>

        <View className="mx-auto w-full max-w-md flex-1 justify-center pb-10">
          <ModeToggle mode={mode} onSwitch={switchMode} />

          {/* Header (web AuthFormHeader) */}
          <Text className="text-3xl font-jakarta-extrabold text-brand">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </Text>
          <Text className="mb-6 mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to manage your properties, saved homes and inquiries."
              : "Join PropertiesDock to list properties, save homes and send inquiries."}
          </Text>

          {/* Server error (web AuthFeedback) */}
          {serverError ? (
            <View className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
              <Text className="text-sm text-destructive">{serverError}</Text>
            </View>
          ) : null}

          {/* Email-not-verified banner */}
          {unverifiedEmail ? (
            <View className="mb-4 rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3.5 dark:border-amber-500/30 dark:bg-amber-500/10">
              <View className="flex-row items-start gap-3">
                <MailWarning size={16} color="#d97706" style={{ marginTop: 2 }} />
                <View className="flex-1 gap-2">
                  <Text className="text-sm font-jakarta-medium text-amber-800 dark:text-amber-300">
                    Email not verified
                  </Text>
                  <Text className="text-xs text-amber-700 dark:text-amber-400">
                    We sent a verification link to{" "}
                    <Text className="text-xs font-jakarta-semibold text-amber-700 dark:text-amber-400">
                      {unverifiedEmail}
                    </Text>
                    . Check your inbox (and spam folder) and tap the link to activate your account.
                  </Text>
                  {resendState === "sent" ? (
                    <View className="flex-row items-center gap-1.5">
                      <CheckCircle2 size={14} color="#16a34a" />
                      <Text className="text-xs font-jakarta-medium text-green-700 dark:text-green-400">
                        Verification email sent — check your inbox.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Pressable
                        onPress={onResend}
                        disabled={resendState === "sending"}
                        accessibilityRole="button"
                      >
                        <Text className="text-xs font-jakarta-semibold text-amber-800 underline dark:text-amber-300">
                          {resendState === "sending" ? "Sending…" : "Resend verification email"}
                        </Text>
                      </Pressable>
                      {resendState === "error" ? (
                        <Text className="text-xs text-destructive">{resendError}</Text>
                      ) : null}
                    </>
                  )}
                </View>
              </View>
            </View>
          ) : null}

          {mode === "signin" ? (
            // ── Sign in ──
            // key: force a full remount when switching modes. Without keys React
            // matches these branches by position and REUSES same-type children —
            // e.g. sign-in Password's Controller became sign-up Email's Controller
            // with control/name swapped, leaving a stale value subscription that
            // wiped the email text on every keystroke.
            <View key="signin" className="gap-4">
              <Field label="Email" error={signinForm.formState.errors.email?.message}>
                <Controller
                  control={signinForm.control}
                  name="email"
                  render={({ field }) => (
                    <Input
                      placeholder="you@example.com"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={field.value}
                      onChangeText={field.onChange}
                    />
                  )}
                />
              </Field>

              <Field label="Password" error={signinForm.formState.errors.password?.message}>
                <Controller
                  control={signinForm.control}
                  name="password"
                  render={({ field }) => (
                    <PasswordInput value={field.value} onChangeText={field.onChange} />
                  )}
                />
              </Field>

              <Button variant="brand" className="mt-2" loading={isSubmitting} onPress={onSignIn}>
                Sign in
              </Button>
            </View>
          ) : (
            // ── Sign up ──
            <View key="signup" className="gap-4">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Field label="First name" error={signupForm.formState.errors.firstName?.message}>
                    <Controller
                      control={signupForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <Input
                          placeholder="First name"
                          value={field.value}
                          onChangeText={field.onChange}
                        />
                      )}
                    />
                  </Field>
                </View>
                <View className="flex-1">
                  <Field label="Last name" error={signupForm.formState.errors.lastName?.message}>
                    <Controller
                      control={signupForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <Input
                          placeholder="Last name"
                          value={field.value}
                          onChangeText={field.onChange}
                        />
                      )}
                    />
                  </Field>
                </View>
              </View>

              <Field label="Email" error={signupForm.formState.errors.email?.message}>
                <Controller
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <Input
                      // "(v3)" is a TEMP canary to prove the device runs current code —
                      // remove once the clear-on-type bug is resolved.
                      placeholder="you@example.com (v3)"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={field.value}
                      onChangeText={field.onChange}
                    />
                  )}
                />
              </Field>

              <Field label="Phone" error={signupForm.formState.errors.phone?.message}>
                <Controller
                  control={signupForm.control}
                  name="phone"
                  render={({ field }) => (
                    <Input
                      placeholder={PHONE_PLACEHOLDER}
                      keyboardType="phone-pad"
                      value={field.value}
                      onChangeText={field.onChange}
                    />
                  )}
                />
              </Field>

              <Field label="Password" error={signupForm.formState.errors.password?.message}>
                <Controller
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    // Read the value here (inside the field) instead of a top-level
                    // useWatch — the top-level subscription re-rendered the whole form
                    // and reset the other controlled inputs as you typed.
                    <View className="gap-1.5">
                      <PasswordInput
                        value={field.value}
                        onChangeText={field.onChange}
                        placeholder="Min 8 chars, 1 uppercase, 1 number"
                      />
                      {field.value.length > 0 ? (
                        <View className="gap-0.5 pl-1">
                          <PasswordHint ok={field.value.length >= 8} label="At least 8 characters" />
                          <PasswordHint ok={/[A-Z]/.test(field.value)} label="One uppercase letter" />
                          <PasswordHint ok={/[0-9]/.test(field.value)} label="One number" />
                        </View>
                      ) : null}
                    </View>
                  )}
                />
              </Field>

              <Button variant="brand" className="mt-2" loading={isSubmitting} onPress={onSignUp}>
                Create account
              </Button>
            </View>
          )}

          {/* Mode switch footer */}
          <View className="mt-6 flex-row items-center justify-center gap-1">
            <Text className="text-sm text-muted-foreground">
              {mode === "signin" ? "New here?" : "Already have an account?"}
            </Text>
            <Pressable
              onPress={() => switchMode(mode === "signin" ? "signup" : "signin")}
              accessibilityRole="button"
            >
              <Text className="text-sm font-jakarta-semibold text-brand">
                {mode === "signin" ? "Create an account" : "Sign in"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
