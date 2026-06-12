import { prisma } from "@/lib/prisma";
import { OrganizationFocusType, MissionDifficulty } from "@prisma/client";

/**
 * Recommends mission templates based on organization characteristics
 */
export async function recommendMissionTemplatesForOrg(
  focusType: OrganizationFocusType,
  memberCount: number
) {
  const templates = await prisma.missionTemplate.findMany({
    where: {
      recommendedPlayersMin: { lte: memberCount },
      recommendedPlayersMax: { gte: memberCount },
    },
    include: {
      category: true,
    },
  });

  // Filter based on org focus type
  const focusTypeToCategories: Record<OrganizationFocusType, string[]> = {
    [OrganizationFocusType.MILITARY]: ["combat-operations", "fleet-operations", "ground-operations"],
    [OrganizationFocusType.LOGISTICS]: ["cargo-and-logistics", "industrial-operations"],
    [OrganizationFocusType.MINING]: ["mining-operations", "industrial-operations"],
    [OrganizationFocusType.SALVAGE]: ["salvage-operations", "industrial-operations"],
    [OrganizationFocusType.PIRACY]: [
      "combat-operations",
      "piracy-and-counter-piracy",
    ],
    [OrganizationFocusType.SECURITY]: ["security-and-escort", "combat-operations"],
    [OrganizationFocusType.EXPLORATION]: ["exploration-and-recon"],
    [OrganizationFocusType.TRADE]: ["cargo-and-logistics"],
    [OrganizationFocusType.MEDICAL]: ["medical-and-rescue"],
    [OrganizationFocusType.RACING]: ["racing-and-training"],
    [OrganizationFocusType.MIXED]: [
      "combat-operations",
      "cargo-and-logistics",
      "mining-operations",
      "salvage-operations",
      "medical-and-rescue",
      "exploration-and-recon",
    ],
  };

  const recommendedCategorySlugs = focusTypeToCategories[focusType] || [];

  return templates.filter((template) => {
    return recommendedCategorySlugs.includes(template.category.slug);
  });
}

/**
 * Gets mission templates by difficulty
 */
export async function getMissionsByDifficulty(difficulty: MissionDifficulty) {
  return prisma.missionTemplate.findMany({
    where: { difficulty },
    include: { category: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Gets mission templates by category slug
 */
export async function getMissionsByCategory(categorySlug: string) {
  return prisma.missionTemplate.findMany({
    where: {
      category: { slug: categorySlug },
    },
    include: { category: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Gets all mission categories with their template counts
 */
export async function getAllCategoriesWithCounts() {
  const categories = await prisma.missionCategory.findMany({
    include: { templates: { select: { id: true } } },
    orderBy: { name: "asc" },
  });

  return categories.map((cat) => ({
    ...cat,
    templateCount: cat.templates.length,
  }));
}

/**
 * Searches missions by name, description, or tags
 */
export async function searchMissions(query: string) {
  const lowerQuery = query.toLowerCase();

  return prisma.missionTemplate.findMany({
    where: {
      OR: [
        { name: { contains: lowerQuery, mode: "insensitive" } },
        { summary: { contains: lowerQuery, mode: "insensitive" } },
        { description: { contains: lowerQuery, mode: "insensitive" } },
        {
          tags: {
            hasSome: [query],
          },
        },
      ],
    },
    include: { category: true },
  });
}

/**
 * Gets featured missions (shuffled, limited number)
 */
export async function getFeaturedMissions(limit: number = 6) {
  const allTemplates = await prisma.missionTemplate.findMany({
    include: { category: true },
  });

  // Shuffle and return limited set
  return allTemplates
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}

/**
 * Gets recently used mission templates for a user
 */
export async function getRecentlyUsedMissions(userId: string) {
  const recentOps = await prisma.operation.findMany({
    where: {
      missionTemplateId: { not: null },
      participants: {
        some: { userId },
      },
    },
    include: {
      missionTemplate: { include: { category: true } },
    },
    distinct: ["missionTemplateId"],
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return recentOps
    .filter((op) => op.missionTemplate !== null)
    .map((op) => op.missionTemplate)
    .filter((t): t is NonNullable<typeof t> => t !== null);
}

/**
 * Gets recommended mission templates based on organization data
 */
export async function getRecommendedMissionsForOrg(
  focusType: OrganizationFocusType,
  memberCount: number
) {
  return recommendMissionTemplatesForOrg(focusType, memberCount);
}
