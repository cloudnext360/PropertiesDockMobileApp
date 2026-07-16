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
  // Backend omanPhone rule: 968 country code required, +/00 optional,
  // formatting characters ignored (the server strips them before storing).
  phone: z
    .string()
    .refine(
      (v) => /^(\+|00)?968[279]\d{7}$/.test(v.replace(/[\s\-()]/g, "")),
      "Enter a valid Omani number with the 968 country code (e.g. +96891234567)",
    ),
});

// Second login step for 2FA-enabled accounts (backend Verify2FALoginDto: 6–20 chars).
export const TwoFactorSchema = z.object({
  code: z.string().min(6, "Enter your 6-digit code").max(20),
});

export type Mode = "signin" | "signup";
export type LoginForm = z.infer<typeof LoginSchema>;
export type RegisterForm = z.infer<typeof RegisterSchema>;
export type TwoFactorForm = z.infer<typeof TwoFactorSchema>;
