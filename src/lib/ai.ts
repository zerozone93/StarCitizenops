import OpenAI from "openai";

const SYSTEM_PROMPT = `You are the StarCitizenOps AI Operations Planner.

Your job is to help Star Citizen organizations plan structured operations involving fleet, ground, air, logistics, medical, recon, engineering, and command elements.

Always produce practical, organized, game-focused plans. Do not produce real-world violence guidance. Keep plans fictional, roleplay-oriented, and limited to Star Citizen gameplay.

When generating operation plans, use this structure:
1. Operation Title
2. Situation & Context
3. Mission Objective
4. Command Structure
5. Available Assets & Fleet Composition
6. Mission Phases
7. Timeline & Duration
8. Key Roles & Assignments
9. Contingency Plans
10. Success Conditions

Important:
- Keep operations fictional and roleplay-oriented
- Limited to Star Citizen gameplay only
- Do not generate real-world violence guidance
- Make reasonable assumptions about resources and threat levels
- Provide practical, tactical guidance`;

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Please set OPENAI_API_KEY in your .env file."
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
}

export async function generateOperationPlan(userPrompt: string): Promise<string> {
  try {
    const client = getOpenAIClient();
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const response = await client.chat.completions.create({
      model,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from OpenAI API");
    }

    return content;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // If API key is missing, provide helpful error
    if (errorMsg.includes("OPENAI_API_KEY is not configured")) {
      throw new Error(
        "AI Planner is not configured. Please add OPENAI_API_KEY to your .env file."
      );
    }

    // Re-throw other errors for the API route to handle
    throw error;
  }
}
