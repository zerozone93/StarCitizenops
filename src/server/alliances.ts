import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

export async function createAlliance(userId: string, input: { name: string; description?: string }) {
  return prisma.alliance.create({
    data: { name: input.name, description: input.description ?? null, createdById: userId },
  });
}

export async function updateAlliance(userId: string, allianceId: string, input: { name?: string; description?: string }) {
  const alliance = await prisma.alliance.findUnique({ where: { id: allianceId } });
  if (!alliance) throw new NotFoundError("Alliance not found");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (alliance.createdById !== userId && user?.siteRole !== "SITE_ADMIN") throw new ForbiddenError();
  return prisma.alliance.update({
    where: { id: allianceId },
    data: { ...(input.name && { name: input.name }), ...(input.description !== undefined && { description: input.description }) },
  });
}

export async function listAlliances(filters?: { search?: string }) {
  return prisma.alliance.findMany({
    where: filters?.search ? { name: { contains: filters.search, mode: "insensitive" } } : undefined,
    include: { members: { include: { organization: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllianceById(id: string) {
  const alliance = await prisma.alliance.findUnique({
    where: { id },
    include: { members: { include: { organization: true } }, createdBy: true },
  });
  if (!alliance) throw new NotFoundError("Alliance not found");
  return alliance;
}

export async function addAllianceMember(actorUserId: string, allianceId: string, organizationId: string) {
  const alliance = await prisma.alliance.findUnique({ where: { id: allianceId } });
  if (!alliance) throw new NotFoundError("Alliance not found");
  const user = await prisma.user.findUnique({ where: { id: actorUserId } });
  if (alliance.createdById !== actorUserId && user?.siteRole !== "SITE_ADMIN") throw new ForbiddenError();
  return prisma.allianceMember.upsert({
    where: { allianceId_organizationId: { allianceId, organizationId } },
    create: { allianceId, organizationId },
    update: {},
  });
}

export async function removeAllianceMember(actorUserId: string, allianceId: string, organizationId: string) {
  const alliance = await prisma.alliance.findUnique({ where: { id: allianceId } });
  if (!alliance) throw new NotFoundError("Alliance not found");
  const user = await prisma.user.findUnique({ where: { id: actorUserId } });
  if (alliance.createdById !== actorUserId && user?.siteRole !== "SITE_ADMIN") throw new ForbiddenError();
  return prisma.allianceMember.delete({
    where: { allianceId_organizationId: { allianceId, organizationId } },
  });
}
