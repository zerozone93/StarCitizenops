import { prisma } from "@/lib/prisma";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import { UpdateProfileInput } from "@/lib/validations/profile";

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      orgMemberships: {
        include: { organization: true },
      },
    },
  });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function updateProfile(userId: string, actorId: string, input: UpdateProfileInput) {
  if (userId !== actorId) {
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (actor?.siteRole !== "SITE_ADMIN") throw new ForbiddenError();
  }
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.starCitizenHandle !== undefined && { starCitizenHandle: input.starCitizenHandle || null }),
      ...(input.bio !== undefined && { bio: input.bio || null }),
      ...(input.timezone !== undefined && { timezone: input.timezone || null }),
      ...(input.availability !== undefined && { availability: input.availability || null }),
      ...(input.preferredRoles !== undefined && { preferredRoles: input.preferredRoles }),
    },
  });
}
