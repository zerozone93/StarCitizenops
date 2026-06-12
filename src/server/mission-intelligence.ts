import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { hashContent } from "@/lib/mission-intelligence/hash";
import { analyzeItem } from "@/lib/mission-intelligence/analyzer";
import { fetchRSICommLink, fetchRSIPatchNotes, fetchRSIDevTracker } from "@/lib/mission-intelligence/fetchers";
import { canAccessAdminMissionIntelligence } from "@/server/permissions";
import type { MissionDifficulty } from "@prisma/client";

const fetcherMap: Record<string, () => Promise<{ externalId?: string; url?: string; title?: string; summary?: string; rawContent?: string; publishedAt?: Date }[]>> = {
  RSI_COMM_LINK: fetchRSICommLink,
  RSI_PATCH_NOTES: fetchRSIPatchNotes,
  RSI_DEV_TRACKER: fetchRSIDevTracker,
};

export async function runMissionIntelligence() {
  const run = await prisma.missionIntelligenceRun.create({
    data: { status: "RUNNING" },
  });

  let sourcesChecked = 0;
  let itemsFound = 0;
  let newItemsCreated = 0;
  let suggestionsCreated = 0;
  const errors: string[] = [];

  try {
    const sources = await prisma.externalUpdateSource.findMany({ where: { enabled: true } });

    for (const source of sources) {
      sourcesChecked++;

      try {
        const fetcher = fetcherMap[source.sourceType];
        if (!fetcher) continue;

        const items = await fetcher();
        itemsFound += items.length;

        await prisma.externalUpdateSource.update({
          where: { id: source.id },
          data: { lastCheckedAt: new Date() },
        });

        for (const item of items) {
          if (!item.title && !item.url) continue;

          const contentHash = hashContent(item.rawContent ?? item.summary ?? item.title ?? "");

          // Dedup checks
          const existingByIdOrUrl = item.externalId
            ? await prisma.externalUpdateItem.findFirst({
                where: { sourceId: source.id, externalId: item.externalId },
              })
            : item.url
            ? await prisma.externalUpdateItem.findFirst({
                where: { sourceId: source.id, url: item.url },
              })
            : null;

          const existingByHash = await prisma.externalUpdateItem.findFirst({
            where: { sourceId: source.id, contentHash },
          });

          if (existingByIdOrUrl || existingByHash) continue;

          const created = await prisma.externalUpdateItem.create({
            data: {
              sourceId: source.id,
              externalId: item.externalId ?? null,
              url: item.url ?? null,
              title: item.title ?? null,
              summary: item.summary ?? null,
              rawContent: item.rawContent ?? null,
              publishedAt: item.publishedAt ?? null,
              contentHash,
              status: "NEW",
            },
          });
          newItemsCreated++;

          // Analyze and create suggestion
          const analysis = analyzeItem(item.title ?? "", item.summary ?? item.rawContent ?? "");
          if (analysis.isRelevant) {
            await prisma.missionSuggestion.create({
              data: {
                externalUpdateItemId: created.id,
                suggestedCategoryName: analysis.suggestedCategoryName,
                suggestedTemplateName: analysis.suggestedTemplateName,
                suggestedSummary: analysis.suggestedSummary,
                suggestedDifficulty: analysis.suggestedDifficulty,
                suggestedTags: analysis.suggestedTags,
                suggestedObjectives: analysis.suggestedObjectives,
                confidenceScore: analysis.confidenceScore,
                reviewStatus: "PENDING",
              },
            });
            suggestionsCreated++;

            await prisma.externalUpdateItem.update({
              where: { id: created.id },
              data: { status: "PROCESSED" },
            });
          }
        }

        await prisma.externalUpdateSource.update({
          where: { id: source.id },
          data: { lastSuccessfulCheckAt: new Date() },
        });
      } catch (e) {
        errors.push(`Source ${source.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    await prisma.missionIntelligenceRun.update({
      where: { id: run.id },
      data: {
        completedAt: new Date(),
        status: errors.length > 0 ? "PARTIAL_SUCCESS" : "SUCCESS",
        sourcesChecked,
        itemsFound,
        newItemsCreated,
        suggestionsCreated,
        errors: errors as unknown as Parameters<typeof prisma.missionIntelligenceRun.update>[0]["data"]["errors"],
      },
    });

    return { sourcesChecked, itemsFound, newItemsCreated, suggestionsCreated, errors };
  } catch (e) {
    await prisma.missionIntelligenceRun.update({
      where: { id: run.id },
      data: {
        completedAt: new Date(),
        status: "FAILED",
        errors: [e instanceof Error ? e.message : String(e)] as unknown as Parameters<typeof prisma.missionIntelligenceRun.update>[0]["data"]["errors"],
      },
    });
    throw e;
  }
}

export async function runMissionIntelligenceNow(adminUserId: string) {
  if (!(await canAccessAdminMissionIntelligence(adminUserId))) throw new ForbiddenError();
  return runMissionIntelligence();
}

export async function approveMissionSuggestion(adminUserId: string, suggestionId: string, adminNotes?: string) {
  if (!(await canAccessAdminMissionIntelligence(adminUserId))) throw new ForbiddenError();
  const suggestion = await prisma.missionSuggestion.findUnique({ where: { id: suggestionId } });
  if (!suggestion) throw new NotFoundError("Suggestion not found");

  const categoryName = suggestion.suggestedCategoryName ?? "Custom Operations";
  const category = await prisma.missionCategory.upsert({
    where: { name: categoryName },
    create: { name: categoryName, slug: slugify(categoryName), description: null },
    update: {},
  });

  const templateName = suggestion.suggestedTemplateName ?? "New Mission";
  const slug = slugify(templateName) + "-" + Date.now();

  const template = await prisma.missionTemplate.create({
    data: {
      categoryId: category.id,
      name: templateName,
      slug,
      summary: suggestion.suggestedSummary ?? null,
      description: suggestion.suggestedDescription ?? null,
      difficulty: (suggestion.suggestedDifficulty as MissionDifficulty) ?? "MEDIUM",
      estimatedDuration: suggestion.suggestedDuration ?? null,
      recommendedPlayersMin: suggestion.suggestedPlayersMin ?? 1,
      recommendedPlayersMax: suggestion.suggestedPlayersMax ?? 20,
      recommendedOrganizationsMin: suggestion.suggestedOrganizationsMin ?? 1,
      recommendedOrganizationsMax: suggestion.suggestedOrganizationsMax ?? 3,
      requiredRoles: suggestion.suggestedRequiredRoles,
      optionalRoles: suggestion.suggestedOptionalRoles,
      requiredAssets: Array.isArray(suggestion.suggestedRequiredAssets)
        ? suggestion.suggestedRequiredAssets.map(String)
        : [],
      optionalAssets: Array.isArray(suggestion.suggestedOptionalAssets)
        ? suggestion.suggestedOptionalAssets.map(String)
        : [],
      objectives: suggestion.suggestedObjectives,
      preparationChecklist: suggestion.suggestedPreparationChecklist,
      executionSteps: suggestion.suggestedExecutionSteps,
      successConditions: suggestion.suggestedSuccessConditions,
      failureConditions: suggestion.suggestedFailureConditions,
      risks: suggestion.suggestedRisks,
      tags: suggestion.suggestedTags,
      aiPromptSeed: suggestion.suggestedAiPromptSeed ?? null,
      addedByMissionIntelligence: true,
      lastVerifiedAt: new Date(),
    },
  });

  await prisma.missionSuggestion.update({
    where: { id: suggestionId },
    data: {
      reviewStatus: "APPROVED",
      reviewedById: adminUserId,
      reviewedAt: new Date(),
      adminNotes: adminNotes ?? null,
      createdMissionTemplateId: template.id,
    },
  });

  await prisma.activityFeedItem.create({
    data: {
      type: "MISSION_TEMPLATE_ADDED",
      title: `New mission template approved: ${template.name}`,
      body: template.summary ?? null,
    },
  });

  return template;
}

export async function rejectMissionSuggestion(adminUserId: string, suggestionId: string, adminNotes: string) {
  if (!(await canAccessAdminMissionIntelligence(adminUserId))) throw new ForbiddenError();
  return prisma.missionSuggestion.update({
    where: { id: suggestionId },
    data: { reviewStatus: "REJECTED", reviewedById: adminUserId, reviewedAt: new Date(), adminNotes },
  });
}

export async function editMissionSuggestion(adminUserId: string, suggestionId: string, input: Partial<{
  suggestedTemplateName: string; suggestedCategoryName: string; suggestedSummary: string;
  suggestedDescription: string; suggestedDifficulty: string; adminNotes: string;
}>) {
  if (!(await canAccessAdminMissionIntelligence(adminUserId))) throw new ForbiddenError();
  return prisma.missionSuggestion.update({
    where: { id: suggestionId },
    data: { ...input, reviewStatus: "NEEDS_EDIT" },
  });
}

export async function ignoreExternalUpdateItem(adminUserId: string, itemId: string) {
  if (!(await canAccessAdminMissionIntelligence(adminUserId))) throw new ForbiddenError();
  return prisma.externalUpdateItem.update({
    where: { id: itemId },
    data: { status: "IGNORED" },
  });
}

export async function listMissionSuggestions(status?: string) {
  return prisma.missionSuggestion.findMany({
    where: status ? { reviewStatus: status as "PENDING" } : undefined,
    include: { externalUpdateItem: true },
    orderBy: { createdAt: "desc" },
  });
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
