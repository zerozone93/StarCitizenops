import { z } from "zod";

const shipRoles = ["FIGHTER","HEAVY_FIGHTER","BOMBER","INTERCEPTOR","GUNSHIP","CORVETTE","CAPITAL","CARGO","MEDICAL","REFUEL","REPAIR","SALVAGE","MINING","EXPLORATION","SCOUT","DROPSHIP","TRANSPORT","RACING","SUPPORT","MULTI_ROLE","OTHER"] as const;
const shipSizes = ["SNUB","SMALL","MEDIUM","LARGE","CAPITAL"] as const;
const assetStatuses = ["AVAILABLE","UNAVAILABLE","LOANER","IN_GAME_RENTAL","IN_GAME_PURCHASED","PLEDGED","UNKNOWN"] as const;
const vehicleRoles = ["COMBAT","TRANSPORT","MINING","EXPLORATION","RACING","SUPPORT","CARGO","OTHER"] as const;
const vehicleSizes = ["SMALL","MEDIUM","LARGE"] as const;

export const addShipSchema = z.object({
  name: z.string().min(1).max(128),
  manufacturer: z.string().min(1).max(128).optional(),
  role: z.enum(shipRoles).optional(),
  size: z.enum(shipSizes).optional(),
  quantity: z.number().int().min(1).max(999).optional(),
  status: z.enum(assetStatuses).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateShipSchema = addShipSchema.partial();

export const addVehicleSchema = z.object({
  name: z.string().min(1).max(128),
  manufacturer: z.string().min(1).max(128).optional(),
  role: z.enum(vehicleRoles).optional(),
  size: z.enum(vehicleSizes).optional(),
  quantity: z.number().int().min(1).max(999).optional(),
  status: z.enum(assetStatuses).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateVehicleSchema = addVehicleSchema.partial();

export type AddShipInput = z.infer<typeof addShipSchema>;
export type UpdateShipInput = z.infer<typeof updateShipSchema>;
export type AddVehicleInput = z.infer<typeof addVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
