"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  addGroundVehicleInputSchema,
  addShipInputSchema,
  updateGroundVehicleInputSchema,
  updateShipInputSchema,
} from "@/lib/validators";
import {
  clampQuantity,
  calculateOrgFleetReadiness,
  getUserFleet,
  toAssetStatus,
  toShipRole,
  toShipSize,
  toVehicleRole,
  toVehicleSize,
} from "@/lib/fleet";

function normalizeNotes(notes: string | null | undefined) {
  return (notes || "").trim();
}

export async function addShipForUser(userId: string, input: unknown) {
  const parsed = addShipInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid ship input");
  }

  const data = parsed.data;
  const quantity = clampQuantity(data.quantity);
  const notes = normalizeNotes(data.notes);

  const existing = await prisma.ship.findFirst({
    where: {
      userId,
      name: data.name,
      manufacturer: data.manufacturer,
      role: toShipRole(data.role),
      size: toShipSize(data.size),
      status: toAssetStatus(data.status),
      notes,
    },
  });

  if (existing) {
    const updated = await prisma.ship.update({
      where: { id: existing.id },
      data: {
        quantity: clampQuantity(existing.quantity + quantity),
      },
    });

    return {
      action: "updated" as const,
      ship: updated,
      message: `Updated ${updated.name} quantity to ${updated.quantity}.`,
    };
  }

  const ship = await prisma.ship.create({
    data: {
      userId,
      name: data.name,
      manufacturer: data.manufacturer,
      role: toShipRole(data.role),
      size: toShipSize(data.size),
      quantity,
      status: toAssetStatus(data.status),
      notes,
    },
  });

  return {
    action: "created" as const,
    ship,
    message: `Added ${quantity}x ${ship.name} to your fleet.`,
  };
}

export async function addGroundVehicleForUser(userId: string, input: unknown) {
  const parsed = addGroundVehicleInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid vehicle input");
  }

  const data = parsed.data;
  const quantity = clampQuantity(data.quantity);
  const notes = normalizeNotes(data.notes);

  const existing = await prisma.groundVehicle.findFirst({
    where: {
      userId,
      name: data.name,
      manufacturer: data.manufacturer,
      role: toVehicleRole(data.role),
      size: toVehicleSize(data.size),
      status: toAssetStatus(data.status),
      notes,
    },
  });

  if (existing) {
    const updated = await prisma.groundVehicle.update({
      where: { id: existing.id },
      data: {
        quantity: clampQuantity(existing.quantity + quantity),
      },
    });

    return {
      action: "updated" as const,
      vehicle: updated,
      message: `Updated ${updated.name} quantity to ${updated.quantity}.`,
    };
  }

  const vehicle = await prisma.groundVehicle.create({
    data: {
      userId,
      name: data.name,
      manufacturer: data.manufacturer,
      role: toVehicleRole(data.role),
      size: toVehicleSize(data.size),
      quantity,
      status: toAssetStatus(data.status),
      notes,
    },
  });

  return {
    action: "created" as const,
    vehicle,
    message: `Added ${quantity}x ${vehicle.name} to your fleet.`,
  };
}

export async function updateShipForUser(userId: string, input: unknown) {
  const parsed = updateShipInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid ship update input");
  }

  const record = await prisma.ship.findUnique({ where: { id: parsed.data.id } });
  if (!record || record.userId !== userId) {
    throw new Error("Not found");
  }

  return prisma.ship.update({
    where: { id: record.id },
    data: {
      name: parsed.data.name,
      manufacturer: parsed.data.manufacturer,
      role: toShipRole(parsed.data.role),
      size: toShipSize(parsed.data.size),
      quantity: clampQuantity(parsed.data.quantity),
      status: toAssetStatus(parsed.data.status),
      notes: normalizeNotes(parsed.data.notes),
    },
  });
}

export async function updateGroundVehicleForUser(userId: string, input: unknown) {
  const parsed = updateGroundVehicleInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid vehicle update input");
  }

  const record = await prisma.groundVehicle.findUnique({ where: { id: parsed.data.id } });
  if (!record || record.userId !== userId) {
    throw new Error("Not found");
  }

  return prisma.groundVehicle.update({
    where: { id: record.id },
    data: {
      name: parsed.data.name,
      manufacturer: parsed.data.manufacturer,
      role: toVehicleRole(parsed.data.role),
      size: toVehicleSize(parsed.data.size),
      quantity: clampQuantity(parsed.data.quantity),
      status: toAssetStatus(parsed.data.status),
      notes: normalizeNotes(parsed.data.notes),
    },
  });
}

export async function deleteShipForUser(userId: string, shipId: string) {
  const ship = await prisma.ship.findUnique({ where: { id: shipId } });
  if (!ship || ship.userId !== userId) {
    throw new Error("Not found");
  }

  await prisma.ship.delete({ where: { id: ship.id } });
}

export async function deleteGroundVehicleForUser(userId: string, vehicleId: string) {
  const vehicle = await prisma.groundVehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.userId !== userId) {
    throw new Error("Not found");
  }

  await prisma.groundVehicle.delete({ where: { id: vehicle.id } });
}

export async function getUserFleetData(userId: string) {
  return getUserFleet(userId);
}

export async function getOrganizationFleetReadiness(organizationId: string) {
  return calculateOrgFleetReadiness(organizationId);
}

export async function revalidateFleetPages() {
  revalidatePath("/fleet");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
}
