import { z } from "zod";

// Mirrors backend CreateInquiryDto: name(≥2), email, phone optional, message 10–1000.
export const InquirySchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.email("Enter a valid email address"),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()+]*$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message is too long"),
});

export type InquiryForm = z.infer<typeof InquirySchema>;
