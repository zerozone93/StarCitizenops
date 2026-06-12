"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError, ForbiddenError, NotFoundError } from "@/lib/errors";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.siteRole !== "SITE_ADMIN") throw new ForbiddenError("Admin access required");
  return user;
}

export async function requireOrgRole(organizationId: string, roles: string[]) {
  const user = await requireUser();
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
  });
  if (!membership && user.siteRole !== "SITE_ADMIN") {
    throw new ForbiddenError("Insufficient organization role");
  }
  if (membership && !roles.includes(membership.role) && user.siteRole !== "SITE_ADMIN") {
    throw new ForbiddenError("Insufficient organization role");
  }
  return user;
}

export async function canEditOrganization(userId: string, organizationId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.siteRole === "SITE_ADMIN") return true;
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  return membership ? ["OWNER","OFFICER"].includes(membership.role) : false;
}

export async function canEditOperation(userId: string, operationId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.siteRole === "SITE_ADMIN") return true;
  const op = await prisma.operation.findUnique({ where: { id: operationId } });
  if (!op) throw new NotFoundError("Operation not found");
  if (op.commanderId === userId) return true;
  return canEditOrganization(userId, op.organizationId);
}
