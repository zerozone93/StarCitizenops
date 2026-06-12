import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import type { RSVPStatus } from "@prisma/client";
import { isSiteAdmin } from "@/server/permissions";

const ALLOWED_STATUSES: RSVPStatus[] = ["GOING", "MAYBE", "DECLINED", "STANDBY"];

export async function setOperationRSVP(
  userId: string,
  operationId: string,
  input: {
    status: string;
    note?: string;
    preferredRole?: string;
    team?: string;
  }
) {
  const operation = await prisma.operation.findUnique({
    where: { id: operationId },
    select: { id: true, organizationId: true },
  });
  if (!operation) throw new NotFoundError("Operation not found");

  const status = input.status as RSVPStatus;
  if (!ALLOWED_STATUSES.includes(status)) {
    throw new ValidationError("Invalid RSVP status");
  }

  const isAdmin = await isSiteAdmin(userId);
  if (!isAdmin) {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: operation.organizationId,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenError("Only organization members can RSVP to this event");
    }
  }

  const note = input.note?.trim() || null;
  const preferredRole = input.preferredRole?.trim() || null;
  const team = input.team?.trim() || null;

  return prisma.$transaction(async (tx) => {
    const rsvp = await tx.rSVP.upsert({
      where: { operationId_userId: { operationId, userId } },
      create: { operationId, userId, status, note },
      update: { status, note },
    });

    await tx.operationParticipant.upsert({
      where: { operationId_userId: { operationId, userId } },
      create: {
        operationId,
        userId,
        organizationId: operation.organizationId,
        status,
        assignedRole: preferredRole,
        team,
      },
      update: {
        status,
        assignedRole: preferredRole,
        team,
      },
    });

    return rsvp;
  });
}

export async function setRSVP(userId: string, operationId: string, status: string, note?: string) {
  return setOperationRSVP(userId, operationId, { status, note });
}

export async function getRSVPsForOperation(operationId: string) {
  return prisma.rSVP.findMany({
    where: { operationId },
    include: { user: { select: { id: true, name: true, image: true, starCitizenHandle: true } } },
    orderBy: { createdAt: "asc" },
  });
}
