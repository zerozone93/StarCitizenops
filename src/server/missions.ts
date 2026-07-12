import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { MissionDifficulty } from "@prisma/client";

export async function listMissionCategories() {
  return prisma.missionCategory.findMany({
    include: { _count: { select: { templates: true } } },
    orderBy: { name: "asc" },
  });
}

export async function listMissionTemplates(filters?: { categoryId?: string; difficulty?: string; search?: string }) {
  return prisma.missionTemplate.findMany({
    where: {
      ...(filters?.categoryId && { categoryId: filters.categoryId }),
      ...(filters?.difficulty && { difficulty: filters.difficulty as MissionDifficulty }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { summary: { contains: filters.search, mode: "insensitive" } },
          { tags: { has: filters.search } },
        ],
      }),
    },
    include: { category: true },
    orderBy: { name: "asc" },
  });
}

export async function getMissionTemplateById(id: string) {
  const template = await prisma.missionTemplate.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!template) throw new NotFoundError("Mission template not found");
  return template;
}

export async function getMissionTemplateBySlug(slug: string) {
  const template = await prisma.missionTemplate.findFirst({
    where: { slug },
    include: { category: true },
  });
  if (!template) throw new NotFoundError("Mission template not found");
  return template;
}

export async function recommendMissionTemplatesForOrg(focusType: string) {
  const focusToCategory: Record<string, string[]> = {
    MILITARY: ["Combat Operations", "Fleet Operations", "Ground Operations"],
    LOGISTICS: ["Cargo and Logistics"],
    MINING: ["Mining Operations", "Industrial Operations"],
    SALVAGE: ["Salvage Operations"],
    PIRACY: ["Piracy and Counter-Piracy"],
    SECURITY: ["Security and Escort"],
    EXPLORATION: ["Exploration and Recon"],
    TRADE: ["Cargo and Logistics"],
    MEDICAL: ["Medical and Rescue"],
    RACING: ["Racing and Training"],
    MIXED: [],
  };

  const preferredCategories = focusToCategory[focusType] ?? [];

  if (preferredCategories.length === 0) {
    return listMissionTemplates();
  }

  const categories = await prisma.missionCategory.findMany({
    where: { name: { in: preferredCategories } },
  });

  return listMissionTemplates({ categoryId: categories[0]?.id });
}
