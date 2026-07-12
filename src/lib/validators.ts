import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2).max(64),
  starCitizenHandle: z.string().max(64).optional(),
  bio: z.string().max(1000).optional(),
  timezone: z.string().max(64).optional(),
  availability: z.string().max(256).optional(),
  preferredRoles: z.array(z.string()).optional(),
});

export const organizationSchema = z.object({
  name: z.string().min(2).max(100),
  tag: z.string().min(2).max(10),
  description: z.string().max(2000).optional(),
  focusType: z.string(),
  visibility: z.string(),
});

export const organizationInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "OFFICER", "COMMANDER", "TEAM_LEADER", "MEMBER", "GUEST"]),
  message: z.string().max(1000).optional(),
});

export const organizationJoinRequestSchema = z.object({
  applicantHandle: z.string().trim().min(2).max(64),
  preferredRole: z.string().trim().min(2).max(80),
  weeklyAvailability: z.string().trim().min(2).max(120),
  reasonToJoin: z.string().trim().min(10).max(600),
  message: z.string().max(1000).optional(),
});

export const organizationBulletinSchema = z.object({
  title: z.string().min(2).max(120),
  body: z.string().min(2).max(4000),
});

export const operationSchema = z.object({
  title: z.string().min(2).max(120),
  type: z.string(),
  startTime: z.string().min(1),
  location: z.string().max(120).optional(),
  objective: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  threatLevel: z.string(),
  organizationId: z.string().min(1),
  missionPhases: z.string().optional(),
  requiredShips: z.string().optional(),
  requiredGroundVehicles: z.string().optional(),
  requiredPersonnel: z.string().optional(),
  commsPlan: z.string().optional(),
  rulesOfEngagement: z.string().optional(),
  rallyPoints: z.string().optional(),
  extractionPlan: z.string().optional(),
  contingencyPlans: z.string().optional(),
  requiredSupplies: z.string().optional(),
});

const quantitySchema = z.coerce.number().int().min(1).max(999);

export const addShipInputSchema = z.object({
  name: z.string().min(1).max(120),
  manufacturer: z.string().min(1).max(120),
  role: z.string().min(1),
  size: z.string().min(1),
  quantity: quantitySchema,
  status: z.string().min(1),
  notes: z.string().max(2000).optional(),
});

export const updateShipInputSchema = addShipInputSchema.extend({
  id: z.string().min(1),
});

export const addGroundVehicleInputSchema = z.object({
  name: z.string().min(1).max(120),
  manufacturer: z.string().min(1).max(120),
  role: z.string().min(1),
  size: z.string().min(1),
  quantity: quantitySchema,
  status: z.string().min(1),
  notes: z.string().max(2000).optional(),
});

export const updateGroundVehicleInputSchema =
  addGroundVehicleInputSchema.extend({
    id: z.string().min(1),
  });
