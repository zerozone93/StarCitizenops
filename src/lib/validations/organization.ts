import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(128),
  tag: z.string().min(2).max(16).regex(/^[A-Z0-9_-]+$/, "Tag must be uppercase letters, numbers, hyphens, or underscores"),
  description: z.string().max(2000).optional(),
  focusType: z.enum(["MILITARY","LOGISTICS","MINING","SALVAGE","PIRACY","SECURITY","EXPLORATION","TRADE","MEDICAL","RACING","MIXED"]).optional(),
  visibility: z.enum(["PUBLIC","PRIVATE"]).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export const addMemberSchema = z.object({
  targetUserId: z.string().cuid(),
  role: z.enum(["OFFICER","COMMANDER","TEAM_LEADER","MEMBER","GUEST"]).optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["OFFICER","COMMANDER","TEAM_LEADER","MEMBER","GUEST"]),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
