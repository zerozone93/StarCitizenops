import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(64).optional(),
  starCitizenHandle: z.string().min(2).max(64).optional().or(z.literal("")),
  bio: z.string().max(1000).optional().or(z.literal("")),
  timezone: z.string().max(64).optional().or(z.literal("")),
  availability: z.string().max(256).optional().or(z.literal("")),
  preferredRoles: z.array(z.string()).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
