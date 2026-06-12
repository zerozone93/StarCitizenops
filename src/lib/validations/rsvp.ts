import { z } from "zod";

export const setRSVPSchema = z.object({
  status: z.enum(["GOING","MAYBE","DECLINED","STANDBY"]),
  note: z.string().max(500).optional(),
});

export type SetRSVPInput = z.infer<typeof setRSVPSchema>;
