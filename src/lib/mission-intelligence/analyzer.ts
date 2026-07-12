export type AnalyzedItem = {
  suggestedCategoryName: string;
  suggestedTemplateName: string;
  suggestedSummary: string;
  suggestedDifficulty: string;
  suggestedTags: string[];
  suggestedObjectives: string[];
  confidenceScore: number;
  isRelevant: boolean;
};

const KEYWORD_MAP: Record<string, { category: string; tags: string[] }> = {
  bounty: { category: "Combat Operations", tags: ["bounty","combat"] },
  mercenary: { category: "Combat Operations", tags: ["mercenary","combat"] },
  combat: { category: "Combat Operations", tags: ["combat"] },
  hostile: { category: "Combat Operations", tags: ["combat","hostile"] },
  interdiction: { category: "Combat Operations", tags: ["piracy","combat"] },
  assault: { category: "Ground Operations", tags: ["assault","ground"] },
  defense: { category: "Combat Operations", tags: ["defense"] },
  bunker: { category: "Ground Operations", tags: ["bunker","ground"] },
  outpost: { category: "Ground Operations", tags: ["outpost","ground"] },
  raid: { category: "Combat Operations", tags: ["raid","combat"] },
  patrol: { category: "Fleet Operations", tags: ["patrol","fleet"] },
  cargo: { category: "Cargo and Logistics", tags: ["cargo","logistics"] },
  hauling: { category: "Cargo and Logistics", tags: ["hauling","logistics"] },
  freight: { category: "Cargo and Logistics", tags: ["freight","logistics"] },
  delivery: { category: "Cargo and Logistics", tags: ["delivery","logistics"] },
  logistics: { category: "Cargo and Logistics", tags: ["logistics"] },
  supply: { category: "Cargo and Logistics", tags: ["supply","logistics"] },
  transport: { category: "Cargo and Logistics", tags: ["transport"] },
  convoy: { category: "Cargo and Logistics", tags: ["convoy","logistics"] },
  mining: { category: "Mining Operations", tags: ["mining"] },
  refinery: { category: "Mining Operations", tags: ["mining","refinery"] },
  ore: { category: "Mining Operations", tags: ["mining","resources"] },
  extraction: { category: "Mining Operations", tags: ["mining","extraction"] },
  asteroid: { category: "Mining Operations", tags: ["mining","space"] },
  salvage: { category: "Salvage Operations", tags: ["salvage"] },
  wreck: { category: "Salvage Operations", tags: ["salvage","wreck"] },
  derelict: { category: "Salvage Operations", tags: ["salvage"] },
  medical: { category: "Medical and Rescue", tags: ["medical"] },
  rescue: { category: "Medical and Rescue", tags: ["rescue"] },
  beacon: { category: "Medical and Rescue", tags: ["rescue","beacon"] },
  evacuation: { category: "Medical and Rescue", tags: ["rescue","evacuation"] },
  exploration: { category: "Exploration and Recon", tags: ["exploration"] },
  scout: { category: "Exploration and Recon", tags: ["recon","scout"] },
  recon: { category: "Exploration and Recon", tags: ["recon"] },
  survey: { category: "Exploration and Recon", tags: ["survey","exploration"] },
  racing: { category: "Racing and Training", tags: ["racing"] },
  training: { category: "Racing and Training", tags: ["training"] },
  event: { category: "Dynamic Event Operations", tags: ["event"] },
  "dynamic event": { category: "Dynamic Event Operations", tags: ["dynamic","event"] },
  incursion: { category: "Dynamic Event Operations", tags: ["event","combat"] },
  escort: { category: "Security and Escort", tags: ["escort","security"] },
  security: { category: "Security and Escort", tags: ["security"] },
  piracy: { category: "Piracy and Counter-Piracy", tags: ["piracy"] },
};

export function analyzeItem(title: string, content: string): AnalyzedItem {
  const text = (title + " " + content).toLowerCase();
  const matchedCategories: Record<string, number> = {};
  const allTags = new Set<string>();

  for (const [keyword, meta] of Object.entries(KEYWORD_MAP)) {
    if (text.includes(keyword)) {
      matchedCategories[meta.category] = (matchedCategories[meta.category] ?? 0) + 1;
      meta.tags.forEach((t) => allTags.add(t));
    }
  }

  if (Object.keys(matchedCategories).length === 0) {
    return {
      suggestedCategoryName: "Custom Operations",
      suggestedTemplateName: title.slice(0, 128),
      suggestedSummary: content.slice(0, 500),
      suggestedDifficulty: "MEDIUM",
      suggestedTags: ["star-citizen"],
      suggestedObjectives: [],
      confidenceScore: 0.2,
      isRelevant: false,
    };
  }

  const topCategory = Object.entries(matchedCategories).sort((a, b) => b[1] - a[1])[0][0];
  const score = Math.min(Object.keys(matchedCategories).length * 0.15 + 0.3, 0.95);

  return {
    suggestedCategoryName: topCategory,
    suggestedTemplateName: title.slice(0, 128),
    suggestedSummary: content.slice(0, 500),
    suggestedDifficulty: "MEDIUM",
    suggestedTags: Array.from(allTags).slice(0, 10),
    suggestedObjectives: [],
    confidenceScore: score,
    isRelevant: score >= 0.3,
  };
}
