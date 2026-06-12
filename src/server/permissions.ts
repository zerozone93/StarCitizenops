import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

export async function isSiteAdmin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.siteRole === "SITE_ADMIN";
}

export async function isOrganizationOwner(userId: string, organizationId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  return membership?.role === "OWNER";
}

export async function isOrganizationOfficer(userId: string, organizationId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  return membership ? ["OWNER","OFFICER"].includes(membership.role) : false;
}

export async function isOrganizationCommander(userId: string, organizationId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  return membership ? ["OWNER","OFFICER","COMMANDER"].includes(membership.role) : false;
}

export async function canManageOrganization(userId: string, organizationId: string) {
  if (await isSiteAdmin(userId)) return true;
  return isOrganizationOfficer(userId, organizationId);
}

export async function canEditOrganization(userId: string, organizationId: string) {
  return canManageOrganization(userId, organizationId);
}

export async function canCreateOperation(userId: string, organizationId: string) {
  if (await isSiteAdmin(userId)) return true;
  return isOrganizationCommander(userId, organizationId);
}

export async function canEditOperation(userId: string, operationId: string) {
  if (await isSiteAdmin(userId)) return true;
  const op = await prisma.operation.findUnique({ where: { id: operationId } });
  if (!op) throw new NotFoundError("Operation not found");
  if (op.commanderId === userId) return true;
  return isOrganizationOfficer(userId, op.organizationId);
}

export async function canManageOperationAssets(userId: string, operationId: string) {
  return canEditOperation(userId, operationId);
}

export async function canViewPrivateOperation(userId: string, operationId: string) {
  if (await isSiteAdmin(userId)) return true;
  const op = await prisma.operation.findUnique({ where: { id: operationId } });
  if (!op) throw new NotFoundError("Operation not found");
  if (op.visibility === "PUBLIC") return true;
  if (op.commanderId === userId) return true;
  const participant = await prisma.operationParticipant.findUnique({
    where: { operationId_userId: { operationId, userId } },
  });
  if (participant) return true;
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: op.organizationId } },
  });
  return !!membership;
}

export async function canManageCoalition(userId: string, coalitionId: string) {
  if (await isSiteAdmin(userId)) return true;
  const coalition = await prisma.coalition.findUnique({ where: { id: coalitionId } });
  if (!coalition) throw new NotFoundError("Coalition not found");
  return coalition.createdById === userId;
}

export async function canAccessAdminMissionIntelligence(userId: string) {
  return isSiteAdmin(userId);
}

export async function requirePermission(condition: boolean | Promise<boolean>, errorMsg?: string) {
  const result = await Promise.resolve(condition);
  if (!result) throw new ForbiddenError(errorMsg ?? "Forbidden");
}
