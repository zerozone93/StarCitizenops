import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { AddShipInput, UpdateShipInput, AddVehicleInput, UpdateVehicleInput } from "@/lib/validations/fleet";
import type { ShipRole, ShipSize, AssetStatus, VehicleRole, VehicleSize } from "@prisma/client";

export async function getUserFleet(userId: string) {
  const [ships, vehicles] = await Promise.all([
    prisma.ship.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.groundVehicle.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);
  return { ships, vehicles };
}

export async function addShip(userId: string, input: AddShipInput) {
  const existing = await prisma.ship.findFirst({
    where: {
      userId,
      name: input.name,
      manufacturer: input.manufacturer ?? "Unknown",
      role: (input.role as ShipRole) ?? "OTHER",
      size: (input.size as ShipSize) ?? "SMALL",
      status: (input.status as AssetStatus) ?? "AVAILABLE",
    },
  });

  if (existing) {
    const addQty = input.quantity ?? 1;
    return prisma.ship.update({
      where: { id: existing.id },
      data: { quantity: Math.min(existing.quantity + addQty, 999) },
    });
  }

  return prisma.ship.create({
    data: {
      userId,
      name: input.name,
      manufacturer: input.manufacturer ?? "Unknown",
      role: (input.role as ShipRole) ?? "OTHER",
      size: (input.size as ShipSize) ?? "SMALL",
      quantity: Math.min(input.quantity ?? 1, 999),
      status: (input.status as AssetStatus) ?? "AVAILABLE",
      notes: input.notes ?? null,
    },
  });
}

export async function updateShip(userId: string, shipId: string, input: UpdateShipInput) {
  const ship = await prisma.ship.findUnique({ where: { id: shipId } });
  if (!ship) throw new NotFoundError("Ship not found");
  if (ship.userId !== userId) throw new ForbiddenError();
  return prisma.ship.update({
    where: { id: shipId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.manufacturer !== undefined && { manufacturer: input.manufacturer }),
      ...(input.role && { role: input.role as ShipRole }),
      ...(input.size && { size: input.size as ShipSize }),
      ...(input.quantity !== undefined && { quantity: Math.min(Math.max(input.quantity, 1), 999) }),
      ...(input.status && { status: input.status as AssetStatus }),
      ...(input.notes !== undefined && { notes: input.notes || null }),
    },
  });
}

export async function deleteShip(userId: string, shipId: string) {
  const ship = await prisma.ship.findUnique({ where: { id: shipId } });
  if (!ship) throw new NotFoundError("Ship not found");
  if (ship.userId !== userId) throw new ForbiddenError();
  return prisma.ship.delete({ where: { id: shipId } });
}

export async function addGroundVehicle(userId: string, input: AddVehicleInput) {
  const existing = await prisma.groundVehicle.findFirst({
    where: {
      userId,
      name: input.name,
      manufacturer: input.manufacturer ?? "Unknown",
      role: (input.role as VehicleRole) ?? "OTHER",
      size: (input.size as VehicleSize) ?? "SMALL",
      status: (input.status as AssetStatus) ?? "AVAILABLE",
    },
  });

  if (existing) {
    const addQty = input.quantity ?? 1;
    return prisma.groundVehicle.update({
      where: { id: existing.id },
      data: { quantity: Math.min(existing.quantity + addQty, 999) },
    });
  }

  return prisma.groundVehicle.create({
    data: {
      userId,
      name: input.name,
      manufacturer: input.manufacturer ?? "Unknown",
      role: (input.role as VehicleRole) ?? "OTHER",
      size: (input.size as VehicleSize) ?? "SMALL",
      quantity: Math.min(input.quantity ?? 1, 999),
      status: (input.status as AssetStatus) ?? "AVAILABLE",
      notes: input.notes ?? null,
    },
  });
}

export async function updateGroundVehicle(userId: string, vehicleId: string, input: UpdateVehicleInput) {
  const vehicle = await prisma.groundVehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new NotFoundError("Vehicle not found");
  if (vehicle.userId !== userId) throw new ForbiddenError();
  return prisma.groundVehicle.update({
    where: { id: vehicleId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.manufacturer !== undefined && { manufacturer: input.manufacturer }),
      ...(input.role && { role: input.role as VehicleRole }),
      ...(input.size && { size: input.size as VehicleSize }),
      ...(input.quantity !== undefined && { quantity: Math.min(Math.max(input.quantity, 1), 999) }),
      ...(input.status && { status: input.status as AssetStatus }),
      ...(input.notes !== undefined && { notes: input.notes || null }),
    },
  });
}

export async function deleteGroundVehicle(userId: string, vehicleId: string) {
  const vehicle = await prisma.groundVehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new NotFoundError("Vehicle not found");
  if (vehicle.userId !== userId) throw new ForbiddenError();
  return prisma.groundVehicle.delete({ where: { id: vehicleId } });
}
