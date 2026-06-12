import { z } from "zod";

export const createCoalitionSchema = z.object({
  name: z.string().min(2).max(128),
  description: z.string().max(2000).optional(),
  operationId: z.string().cuid().optional(),
  commandNotes: z.string().max(5000).optional(),
});

export const updateCoalitionSchema = createCoalitionSchema.partial();

export const addCoalitionMemberSchema = z.object({
  organizationId: z.string().cuid(),
  responsibility: z.string().max(512).optional(),
});

export type CreateCoalitionInput = z.infer<typeof createCoalitionSchema>;
