import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { canEditOperation } from "@/server/permissions";
import type { CreateOperationInput, UpdateOperationInput } from "@/lib/validations/operation";
import type { OperationType, OperationStatus, ThreatLevel, OrganizationVisibility } from "@prisma/client";

export async function createOperation(userId: string, input: CreateOperationInput) {
  return prisma.operation.create({
    data: {
      title: input.title,
      type: input.type as OperationType,
      description: input.description ?? null,
      objective: input.objective ?? null,
      location: input.location ?? null,
      threatLevel: (input.threatLevel as ThreatLevel) ?? "MODERATE",
      startTime: input.startTime ? new Date(input.startTime) : null,
      endTime: input.endTime ? new Date(input.endTime) : null,
      status: (input.status as OperationStatus) ?? "PLANNED",
      visibility: (input.visibility as OrganizationVisibility) ?? "PUBLIC",
      commanderId: userId,
      organizationId: input.organizationId,
      coalitionId: input.coalitionId ?? null,
      missionTemplateId: input.missionTemplateId ?? null,
      missionBrief: input.missionBrief ?? null,
      commsPlan: input.commsPlan ?? null,
      rulesOfEngagement: input.rulesOfEngagement ?? null,
      rallyPoints: input.rallyPoints ?? null,
      extractionPlan: input.extractionPlan ?? null,
      contingencyPlans: input.contingencyPlans ?? null,
      requiredSupplies: input.requiredSupplies ?? null,
    },
  });
}

export async function updateOperation(userId: string, operationId: string, input: UpdateOperationInput) {
  if (!(await canEditOperation(userId, operationId))) throw new ForbiddenError();
  return prisma.operation.update({
    where: { id: operationId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.type && { type: input.type as OperationType }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.objective !== undefined && { objective: input.objective }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.threatLevel && { threatLevel: input.threatLevel as ThreatLevel }),
      ...(input.startTime && { startTime: new Date(input.startTime) }),
      ...(input.endTime && { endTime: new Date(input.endTime) }),
      ...(input.status && { status: input.status as OperationStatus }),
      ...(input.visibility && { visibility: input.visibility as OrganizationVisibility }),
      ...(input.missionBrief !== undefined && { missionBrief: input.missionBrief }),
      ...(input.commsPlan !== undefined && { commsPlan: input.commsPlan }),
      ...(input.rulesOfEngagement !== undefined && { rulesOfEngagement: input.rulesOfEngagement }),
      ...(input.rallyPoints !== undefined && { rallyPoints: input.rallyPoints }),
      ...(input.extractionPlan !== undefined && { extractionPlan: input.extractionPlan }),
      ...(input.contingencyPlans !== undefined && { contingencyPlans: input.contingencyPlans }),
      ...(input.requiredSupplies !== undefined && { requiredSupplies: input.requiredSupplies }),
    },
  });
}

export async function deleteOperation(userId: string, operationId: string) {
  if (!(await canEditOperation(userId, operationId))) throw new ForbiddenError();
  return prisma.operation.delete({ where: { id: operationId } });
}

export async function getOperationById(id: string) {
  const op = await prisma.operation.findUnique({
    where: { id },
    include: {
      commander: true,
      organization: true,
      coalition: true,
      missionTemplate: true,
      participants: { include: { user: true } },
      assets: { include: { ownerUser: true, ownerOrganization: true } },
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
      rsvps: { include: { user: true } },
      aiPlans: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!op) throw new NotFoundError("Operation not found");
  return op;
}

export async function listOperations(filters?: { organizationId?: string; status?: string; userId?: string }) {
  return prisma.operation.findMany({
    where: {
      ...(filters?.organizationId && { organizationId: filters.organizationId }),
      ...(filters?.status && { status: filters.status as OperationStatus }),
      ...(filters?.userId && { commanderId: filters.userId }),
    },
    include: {
      commander: { select: { id: true, name: true, image: true } },
      organization: { select: { id: true, name: true, tag: true } },
      _count: { select: { participants: true, rsvps: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function addOperationParticipant(actorId: string, operationId: string, input: { userId: string; organizationId?: string; assignedRole?: string; team?: string }) {
  if (!(await canEditOperation(actorId, operationId))) throw new ForbiddenError();
  return prisma.operationParticipant.upsert({
    where: { operationId_userId: { operationId, userId: input.userId } },
    create: { operationId, ...input },
    update: { assignedRole: input.assignedRole, team: input.team },
  });
}

export async function addOperationAsset(userId: string, operationId: string, input: {
  assetType: string; name: string; manufacturer?: string; role?: string; size?: string;
  quantity?: number; assignedTo?: string; notes?: string; ownerUserId?: string; ownerOrganizationId?: string;
}) {
  if (!(await canEditOperation(userId, operationId))) throw new ForbiddenError();

  // Validate quantity against owned fleet
  if (input.ownerUserId && input.name) {
    const ship = await prisma.ship.findFirst({
      where: { userId: input.ownerUserId, name: input.name },
    });
    const vehicle = !ship ? await prisma.groundVehicle.findFirst({
      where: { userId: input.ownerUserId, name: input.name },
    }) : null;
    const owned = ship ?? vehicle;
    if (owned && input.quantity && input.quantity > owned.quantity) {
      throw new ForbiddenError(`Cannot assign more than owned quantity (${owned.quantity})`);
    }
  }

  return prisma.operationAsset.create({
    // @ts-expect-error assetType enum mismatch handled at runtime
    data: { operationId, ...input, quantity: input.quantity ?? 1 },
  });
}

export async function createOperationFromMissionTemplate(userId: string, missionTemplateId: string, input: Omit<CreateOperationInput, "missionTemplateId">) {
  const template = await prisma.missionTemplate.findUnique({ where: { id: missionTemplateId } });
  if (!template) throw new NotFoundError("Mission template not found");

  return createOperation(userId, {
    ...input,
    missionTemplateId,
    description: input.description ?? template.summary ?? undefined,
    objective: input.objective ?? (template.objectives[0] ?? undefined),
  });
}
