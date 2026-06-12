import { z } from "zod";

export const approveSuggestionSchema = z.object({
  adminNotes: z.string().max(2000).optional(),
});

export const rejectSuggestionSchema = z.object({
  adminNotes: z.string().min(1).max(2000),
});

export const editSuggestionSchema = z.object({
  suggestedTemplateName: z.string().max(256).optional(),
  suggestedCategoryName: z.string().max(256).optional(),
  suggestedSummary: z.string().max(2000).optional(),
  suggestedDescription: z.string().max(10000).optional(),
  suggestedDifficulty: z.string().optional(),
  adminNotes: z.string().max(2000).optional(),
});
