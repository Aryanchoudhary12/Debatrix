import { z } from "zod";
export const profileSchema = z.object({
  tagline: z
    .string()
    .max(100, "Tagline must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  interests: z
    .array(z.string().min(2, "Interest must be at least 2 characters"))
    .min(1, "Please add at least one interest")
    .max(10, "You can add a maximum of 10 interests"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;