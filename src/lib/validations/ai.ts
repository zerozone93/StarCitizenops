import { z } from "zod";

export const generatePlanSchema = z.object({
  operationTitle: z.string().min(1).max(256),
  operationType: z.string().optional(),
  description: z.string().max(5000).optional(),
  objective: z.string().max(2000).optional(),
  location: z.string().max(256).optional(),
  threatLevel: z.string().optional(),
  organizationId: z.string().cuid().optional(),
  operationId: z.string().cuid().optional(),
  missionTemplateId: z.string().cuid().optional(),
  additionalContext: z.string().max(5000).optional(),
});

export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;
