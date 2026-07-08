import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle2, MailCheck } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "@/components/screen";
import { Button, Text } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useThemeTokens } from "@/theme/theme-provider";

/**
 * Post-registration landing: tells the user to verify their email and owns the
 * resend flow (POST /api/auth/resend-verification). Reached from AuthScreen with
 * the registered email as a route param.
 */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const tokens = useThemeTokens();
  const { resendVerification } = useAuth();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendError, setResendError] = useState("");

  async function onResend() {
    if (!email) return;
    setResendState("sending");
    setResendError("");
    try {
      await resendVerification(email);
      setResendState("sent");
    } catch (err) {
      setResendState("error");
      setResendError(err instanceof Error ? err.message : "Failed to resend. Please try again.");
    }
  }

  return (
    <Screen scroll contentClassName="justify-center px-6 py-10">
      <View className="mx-auto w-full max-w-md items-center gap-3">
        <MailCheck size={44} color={tokens.brand} />
        <Text className="text-center text-3xl font-jakarta-extrabold text-brand">
          Verify your email
        </Text>
        <Text className="text-center text-base text-muted-foreground">
          We sent a verification link to{" "}
          {email ? (
            <Text className="text-base font-jakarta-semibold text-foreground">{email}</Text>
          ) : (
            "your email address"
          )}
          . Check your inbox (and spam folder) and tap the link to activate your account, then sign
          in.
        </Text>

        {resendState === "sent" ? (
          <View className="mt-2 flex-row items-center gap-1.5">
            <CheckCircle2 size={16} color="#16a34a" />
            <Text className="text-sm font-jakarta-medium text-green-700 dark:text-green-400">
              Verification email sent — check your inbox.
            </Text>
          </View>
        ) : (
          <>
            {email ? (
              <Button
                variant="outline"
                className="mt-2 w-full"
                loading={resendState === "sending"}
                onPress={onResend}
              >
                Resend verification email
              </Button>
            ) : null}
            {resendState === "error" ? (
              <Text className="text-sm text-destructive">{resendError}</Text>
            ) : null}
          </>
        )}

        <Button variant="brand" className="mt-1 w-full" onPress={() => router.replace("/auth")}>
          Back to sign in
        </Button>
      </View>
    </Screen>
  );
}
