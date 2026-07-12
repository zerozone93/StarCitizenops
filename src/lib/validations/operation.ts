import { z } from "zod";

const operationTypes = ["FLEET_PATROL","GROUND_ASSAULT","BOUNTY_OPERATION","CARGO_CONVOY","MINING_SECURITY","SALVAGE_OPERATION","RESCUE_OPERATION","MEDICAL_SUPPORT_OPERATION","EXPLORATION_MISSION","BASE_DEFENSE","JOINT_FLEET_EXERCISE","COMBINED_ARMS_ASSAULT","PIRACY_INTERDICTION","ANTI_PIRACY_ESCORT","CUSTOM_OPERATION"] as const;
const threatLevels = ["LOW","MODERATE","HIGH","CRITICAL"] as const;
const statuses = ["DRAFT","PLANNED","BRIEFING","ACTIVE","COMPLETED","CANCELLED"] as const;

export const createOperationSchema = z.object({
  title: z.string().min(2).max(256),
  type: z.enum(operationTypes),
  description: z.string().max(5000).optional(),
  objective: z.string().max(2000).optional(),
  location: z.string().max(256).optional(),
  threatLevel: z.enum(threatLevels).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  status: z.enum(statuses).optional(),
  visibility: z.enum(["PUBLIC","PRIVATE"]).optional(),
  organizationId: z.string().cuid(),
  coalitionId: z.string().cuid().optional(),
  missionTemplateId: z.string().cuid().optional(),
  missionBrief: z.string().max(10000).optional(),
  commsPlan: z.string().max(5000).optional(),
  rulesOfEngagement: z.string().max(5000).optional(),
  rallyPoints: z.string().max(2000).optional(),
  extractionPlan: z.string().max(5000).optional(),
  contingencyPlans: z.string().max(5000).optional(),
  requiredSupplies: z.string().max(2000).optional(),
});

export const updateOperationSchema = createOperationSchema.partial().omit({ organizationId: true });

export const addParticipantSchema = z.object({
  userId: z.string().cuid(),
  organizationId: z.string().cuid().optional(),
  assignedRole: z.string().max(128).optional(),
  team: z.string().max(128).optional(),
});

export const addOperationAssetSchema = z.object({
  assetType: z.enum(["FLEET_SHIP","FIGHTER","DROPSHIP","CARGO_SHIP","MEDICAL_SHIP","SALVAGE_SHIP","MINING_SHIP","GROUND_VEHICLE","SUPPORT_VEHICLE","INFANTRY_SQUAD","LOGISTICS_PACKAGE","OTHER"]),
  name: z.string().min(1).max(128),
  manufacturer: z.string().max(128).optional(),
  role: z.string().max(64).optional(),
  size: z.string().max(64).optional(),
  quantity: z.number().int().min(1).max(999).optional(),
  assignedTo: z.string().max(256).optional(),
  notes: z.string().max(1000).optional(),
  ownerUserId: z.string().cuid().optional(),
  ownerOrganizationId: z.string().cuid().optional(),
});

export type CreateOperationInput = z.infer<typeof createOperationSchema>;
export type UpdateOperationInput = z.infer<typeof updateOperationSchema>;
