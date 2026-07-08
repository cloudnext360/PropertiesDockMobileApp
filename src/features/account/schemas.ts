import { z } from "zod";

export const EditProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()+]*$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  bio: z.string().max(500, "Bio is too long (max 500)").optional().or(z.literal("")),
});

export type EditProfileForm = z.infer<typeof EditProfileSchema>;
