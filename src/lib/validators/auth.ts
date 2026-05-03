import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10, "Password must be at least 10 characters."),
  locale: z.enum(["en", "fr"]).default("fr")
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional()
});

export const profileSchema = z.object({
  first_name: z.string().trim().min(1),
  last_name: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  instagram_handle: z.string().trim().optional(),
  date_of_birth: z.string().optional(),
  emergency_contact_name: z.string().trim().optional(),
  emergency_contact_phone: z.string().trim().optional(),
  guardian_name: z.string().trim().optional(),
  guardian_email: z.string().trim().email().optional().or(z.literal("")),
  guardian_phone: z.string().trim().optional(),
  language_pref: z.enum(["en", "fr"]).default("fr")
});

export type ProfileInput = z.infer<typeof profileSchema>;
