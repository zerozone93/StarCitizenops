import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";
import { canEditOrganization } from "@/server/permissions";
import type { CreateOrganizationInput, UpdateOrganizationInput } from "@/lib/validations/organization";
import type { OrganizationFocusType, OrganizationVisibility } from "@prisma/client";
import { verifyStarCitizenOrganizationByTag } from "@/lib/star-citizen-org";

export async function createOrganization(userId: string, input: CreateOrganizationInput) {
  const existing = await prisma.organization.findUnique({ where: { tag: input.tag } });
  if (existing) throw new ConflictError("Organization tag already taken");

  const verification = await verifyStarCitizenOrganizationByTag(input.tag);

  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: input.name,
        tag: input.tag,
        description: input.description,
        starCitizenVerified: verification.verified,
        starCitizenVerificationCheckedAt: verification.checkedAt,
        focusType: (input.focusType as OrganizationFocusType) ?? "MIXED",
        visibility: (input.visibility as OrganizationVisibility) ?? "PUBLIC",
        logoUrl: input.logoUrl || null,
        bannerUrl: input.bannerUrl || null,
        ownerId: userId,
      },
    });
    await tx.organizationMember.create({
      data: { userId, organizationId: org.id, role: "OWNER" },
    });
    return org;
  });
}

export async function updateOrganization(actorId: string, organizationId: string, input: UpdateOrganizationInput) {
  if (!(await canEditOrganization(actorId, organizationId))) throw new ForbiddenError();
  return prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.focusType && { focusType: input.focusType as OrganizationFocusType }),
      ...(input.visibility && { visibility: input.visibility as OrganizationVisibility }),
      ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl || null }),
      ...(input.bannerUrl !== undefined && { bannerUrl: input.bannerUrl || null }),
    },
  });
}

export async function deleteOrganization(actorId: string, organizationId: string) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new NotFoundError("Organization not found");
  const actor = await prisma.user.findUnique({ where: { id: actorId } });
  if (org.ownerId !== actorId && actor?.siteRole !== "SITE_ADMIN") throw new ForbiddenError();
  return prisma.organization.delete({ where: { id: organizationId } });
}

export async function getOrganizationById(id: string) {
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      members: { include: { user: true } },
      owner: true,
    },
  });
  if (!org) throw new NotFoundError("Organization not found");
  return org;
}

export async function listOrganizations(filters?: { focusType?: string; search?: string }) {
  return prisma.organization.findMany({
    where: {
      visibility: "PUBLIC",
      ...(filters?.focusType && { focusType: filters.focusType as OrganizationFocusType }),
      ...(filters?.search && { name: { contains: filters.search, mode: "insensitive" } }),
    },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function addOrganizationMember(actorUserId: string, organizationId: string, targetUserId: string, role = "MEMBER") {
  if (!(await canEditOrganization(actorUserId, organizationId))) throw new ForbiddenError();
  const existing = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId } },
  });
  if (existing) throw new ConflictError("User is already a member");
  return prisma.organizationMember.create({
    data: { userId: targetUserId, organizationId, role: role as "MEMBER" },
  });
}

export async function updateOrganizationMemberRole(actorUserId: string, organizationId: string, memberId: string, role: string) {
  if (!(await canEditOrganization(actorUserId, organizationId))) throw new ForbiddenError();
  const member = await prisma.organizationMember.findUnique({ where: { id: memberId } });
  if (!member) throw new NotFoundError("Member not found");
  if (member.role === "OWNER") throw new ForbiddenError("Cannot change owner role");
  return prisma.organizationMember.update({
    where: { id: memberId },
    data: { role: role as "MEMBER" },
  });
}

export async function removeOrganizationMember(actorUserId: string, organizationId: string, memberId: string) {
  if (!(await canEditOrganization(actorUserId, organizationId))) throw new ForbiddenError();
  const member = await prisma.organizationMember.findUnique({ where: { id: memberId } });
  if (!member) throw new NotFoundError("Member not found");
  if (member.role === "OWNER") throw new ForbiddenError("Cannot remove owner");
  return prisma.organizationMember.delete({ where: { id: memberId } });
}

export async function getUserOrganizations(userId: string) {
  return prisma.organizationMember.findMany({
    where: { userId },
    include: { organization: true },
  });
}

export async function calculateOrgFleetReadiness(organizationId: string) {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: { user: { include: { ships: true, groundVehicles: true } } },
  });

  const ships = members.flatMap((m) => m.user.ships);
  const vehicles = members.flatMap((m) => m.user.groundVehicles);
  const available = [...ships, ...vehicles].filter((a) => a.status === "AVAILABLE");

  return {
    totalShips: ships.reduce((s, sh) => s + sh.quantity, 0),
    totalVehicles: vehicles.reduce((s, v) => s + v.quantity, 0),
    availableAssets: available.length,
    memberCount: members.length,
  };
}
