import { z } from "zod";

// Ported from web PropertyDockFrontend/src/components/auth/schemas.ts.
// Register password/phone rules mirror the backend RegisterDto exactly.

export const LoginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .regex(/^\+?[0-9\s\-()+]+$/, "Enter a valid phone number"),
});

// Second login step for 2FA-enabled accounts (backend Verify2FALoginDto: 6–20 chars).
export const TwoFactorSchema = z.object({
  code: z.string().min(6, "Enter your 6-digit code").max(20),
});

export type Mode = "signin" | "signup";
export type LoginForm = z.infer<typeof LoginSchema>;
export type RegisterForm = z.infer<typeof RegisterSchema>;
export type TwoFactorForm = z.infer<typeof TwoFactorSchema>;
