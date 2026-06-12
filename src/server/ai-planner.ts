import { prisma } from "@/lib/prisma";
import { generateMissionPlan } from "@/lib/ai/provider";
import { getUserFleet } from "@/server/fleet";
import { requireUser } from "@/server/auth";
import type { GeneratePlanInput } from "@/lib/validations/ai";

export async function generateAndSavePlan(input: GeneratePlanInput) {
  const user = await requireUser();

  // Build fleet context
  const { ships, vehicles } = await getUserFleet(user.id);
  const fleetLines: string[] = [];
  for (const s of ships) {
    fleetLines.push(`- ${s.name} (ship) x${s.quantity} | Role: ${s.role} | Size: ${s.size} | Status: ${s.status}`);
  }
  for (const v of vehicles) {
    fleetLines.push(`- ${v.name} (vehicle) x${v.quantity} | Role: ${v.role} | Size: ${v.size} | Status: ${v.status}`);
  }
  const fleetContext = fleetLines.length > 0
    ? `\n\n## User Fleet\n${fleetLines.join("\n")}\nKeep fleet composition suggestions grounded in these actual quantities. Do not suggest more of a ship than is owned.`
    : "";

  // Get mission template context
  let templateContext = "";
  if (input.missionTemplateId) {
    const template = await prisma.missionTemplate.findUnique({ where: { id: input.missionTemplateId } });
    if (template) {
      templateContext = `\n\n## Mission Template: ${template.name}\n${template.description ?? template.summary ?? ""}`;
    }
  }

  const prompt = [
    `Operation Title: ${input.operationTitle}`,
    input.operationType ? `Type: ${input.operationType}` : null,
    input.objective ? `Objective: ${input.objective}` : null,
    input.location ? `Location: ${input.location}` : null,
    input.threatLevel ? `Threat Level: ${input.threatLevel}` : null,
    input.description ? `\nDescription: ${input.description}` : null,
    input.additionalContext ? `\nAdditional Context: ${input.additionalContext}` : null,
    fleetContext,
    templateContext,
  ].filter(Boolean).join("\n");

  const generated = await generateMissionPlan({
    userId: user.id,
    organizationName: "User Organization",
    numberOfPlayers: 1,
    operationDescription: prompt,
    fleetContext,
  });

  return { plan: generated, result: generated.result };
}
