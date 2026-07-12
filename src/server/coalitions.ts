import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { canManageCoalition } from "@/server/permissions";
import type { CreateCoalitionInput } from "@/lib/validations/coalition";

export async function createCoalition(userId: string, input: CreateCoalitionInput) {
  return prisma.coalition.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      operationId: input.operationId ?? null,
      commandNotes: input.commandNotes ?? null,
      createdById: userId,
    },
  });
}

export async function updateCoalition(userId: string, coalitionId: string, input: Partial<CreateCoalitionInput>) {
  if (!(await canManageCoalition(userId, coalitionId))) throw new ForbiddenError();
  return prisma.coalition.update({
    where: { id: coalitionId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.commandNotes !== undefined && { commandNotes: input.commandNotes }),
    },
  });
}

export async function listCoalitions(filters?: { search?: string }) {
  return prisma.coalition.findMany({
    where: filters?.search ? { name: { contains: filters.search, mode: "insensitive" } } : undefined,
    include: {
      members: { include: { organization: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCoalitionById(id: string) {
  const coalition = await prisma.coalition.findUnique({
    where: { id },
    include: { members: { include: { organization: true } }, createdBy: true },
  });
  if (!coalition) throw new NotFoundError("Coalition not found");
  return coalition;
}

export async function addCoalitionMember(actorUserId: string, coalitionId: string, organizationId: string, responsibility?: string) {
  if (!(await canManageCoalition(actorUserId, coalitionId))) throw new ForbiddenError();
  return prisma.coalitionMember.upsert({
    where: { coalitionId_organizationId: { coalitionId, organizationId } },
    create: { coalitionId, organizationId, responsibility: responsibility ?? null },
    update: { responsibility: responsibility ?? null },
  });
}

export async function removeCoalitionMember(actorUserId: string, coalitionId: string, organizationId: string) {
  if (!(await canManageCoalition(actorUserId, coalitionId))) throw new ForbiddenError();
  return prisma.coalitionMember.delete({
    where: { coalitionId_organizationId: { coalitionId, organizationId } },
  });
}
