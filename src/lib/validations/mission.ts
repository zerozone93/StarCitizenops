import { z } from "zod";

export const listMissionTemplatesSchema = z.object({
  categoryId: z.string().cuid().optional(),
  difficulty: z.enum(["EASY","MEDIUM","HARD","EXTREME"]).optional(),
  search: z.string().max(256).optional(),
});

export type ListMissionTemplatesInput = z.infer<typeof listMissionTemplatesSchema>;
