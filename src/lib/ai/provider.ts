import "server-only";

import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const GEMINI_RETRYABLE_PATTERNS = [
  "503",
  "service unavailable",
  "high demand",
  "resource exhausted",
  "temporarily unavailable",
];

function readNumericStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;

  const candidate = error as {
    status?: unknown;
    statusCode?: unknown;
    response?: { status?: unknown };
    cause?: { status?: unknown; statusCode?: unknown; response?: { status?: unknown } };
  };

  const values = [
    candidate.status,
    candidate.statusCode,
    candidate.response?.status,
    candidate.cause?.status,
    candidate.cause?.statusCode,
    candidate.cause?.response?.status,
  ];

  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const status = readNumericStatus(error);

  if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }

  return GEMINI_RETRYABLE_PATTERNS.some((pattern) => message.includes(pattern));
}

type ProviderName = "gemini" | "groq" | "openrouter" | "openai";

type GenerateMissionPlanInput = {
  userId: string;
  organizationName: string;
  numberOfPlayers: number;
  missionFocus?: string;
  operationDescription: string;
  fleetContext?: string;
};

type GeneratedMissionPlan = {
  id: string;
  result: string;
  provider: ProviderName;
  model: string;
};

const CONTRACTS_BY_OPERATION_TYPE: Record<string, string[]> = {
  FLEET_PATROL: [
    "A Call to Arms",
    "Illegal Monitors Detected",
    "Unauthorized Surveillance Detected",
  ],
  GROUND_ASSAULT: [
    "Evict Illegal Occupants",
    "Protect Site",
    "Clear Criminal Nest",
  ],
  BOUNTY_OPERATION: [
    "Tracker Training Permit",
    "Suspect Apprehension Certification",
    "Northrock Group Warrant",
  ],
  CARGO_CONVOY: [
    "Covalex Evaluation Shipment",
    "Ling Family Delivery",
    "Red Wind Delivery",
  ],
  MINING_SECURITY: [
    "Remove Claimjumpers",
    "Claimjumper Threat",
    "Protect Site",
  ],
  SALVAGE_OPERATION: [
    "Clean Up Crew",
    "Salvage Claim",
    "Illegal Salvage Detected",
  ],
  RESCUE_OPERATION: [
    "Search and Rescue",
    "Missing Crew",
    "890 Jump Boarding Action",
  ],
  MEDICAL_SUPPORT_OPERATION: [
    "Medical Beacon",
    "Critical Medical Beacon",
    "Urgent Medical Extraction",
  ],
  EXPLORATION_MISSION: [
    "Investigation Mission",
    "Missing Person Investigation",
    "Derelict Site Survey",
  ],
  BASE_DEFENSE: [
    "Protect Site",
    "Defend Occupants",
    "Hold Position",
  ],
  JOINT_FLEET_EXERCISE: [
    "A Call to Arms",
    "Unauthorized Surveillance Detected",
    "Illegal Monitors Detected",
  ],
  COMBINED_ARMS_ASSAULT: [
    "Evict Illegal Occupants",
    "890 Jump Boarding Action",
    "Protect Site",
  ],
  PIRACY_INTERDICTION: [
    "Seize Contraband",
    "Stop Illegal Surveillance",
    "Interdict Smuggling Route",
  ],
  ANTI_PIRACY_ESCORT: [
    "A Call to Arms",
    "Covalex Evaluation Shipment",
    "Protect Site",
  ],
  CUSTOM_OPERATION: [
    "A Call to Arms",
    "Medical Beacon",
    "Protect Site",
  ],
};

const CONTRACT_ALIGNMENT_HINT = Object.entries(CONTRACTS_BY_OPERATION_TYPE)
  .map(([type, contracts]) => `- ${type}: ${contracts.join(", ")}`)
  .join("\n");

const SYSTEM_PROMPT = `You are the StarCitizenOps AI Operations Planner.

Your job is to help Star Citizen organizations plan structured operations involving fleet, ground, air, logistics, medical, recon, engineering, and command elements.

You MUST respond with a valid JSON array of exactly 3 operation plan objects. No markdown, no explanation, no code fences — just the raw JSON array starting with [ and ending with ].

Each object must have these exact keys:
- title: string (operation name)
- type: one of FLEET_PATROL, GROUND_ASSAULT, BOUNTY_OPERATION, CARGO_CONVOY, MINING_SECURITY, SALVAGE_OPERATION, RESCUE_OPERATION, MEDICAL_SUPPORT_OPERATION, EXPLORATION_MISSION, BASE_DEFENSE, JOINT_FLEET_EXERCISE, COMBINED_ARMS_ASSAULT, PIRACY_INTERDICTION, ANTI_PIRACY_ESCORT, CUSTOM_OPERATION
- inGameContract: string (must be a real in-game contract that matches type)
- location: string
- objective: string (1-2 sentences)
- description: string (2-3 sentences overview)
- threatLevel: one of LOW, MODERATE, HIGH, CRITICAL
- requiredShips: string (comma-separated ship names)
- requiredGroundVehicles: string (comma-separated vehicle names, or empty string)
- requiredPersonnel: string (e.g. "8-12 pilots, 4 gunners")
- missionPhases: string (phases separated by " > ")
- commsPlan: string
- rulesOfEngagement: string
- rallyPoints: string
- extractionPlan: string
- contingencyPlans: string
- requiredSupplies: string

Important:
- Keep operations fictional and roleplay-oriented
- Limited to Star Citizen gameplay only
- Do not generate real-world violence guidance
- Make the 3 plans distinct from each other with different approaches or strategies
- Make reasonable assumptions about resources and threat levels
- If the request asks for contracts, use only real in-game contracts and ensure contract matches operation type based on this mapping:
${CONTRACT_ALIGNMENT_HINT}`;

function chooseContract(type: string, index: number): string {
  const allowed = CONTRACTS_BY_OPERATION_TYPE[type] ?? CONTRACTS_BY_OPERATION_TYPE.CUSTOM_OPERATION;
  return allowed[index % allowed.length];
}

function normalizeJsonArray(raw: string) {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function enforceContractAlignment(raw: string, operationDescription: string): string {
  const wantsContracts = /\bcontract|contracts|bounty|beacon|delivery|mercenary|salvage|rescue\b/i.test(operationDescription);
  if (!wantsContracts) return raw;

  try {
    const parsed = normalizeJsonArray(raw);
    if (!Array.isArray(parsed)) return raw;

    const fixed = parsed.map((item, index) => {
      if (!item || typeof item !== "object") return item;
      const entry = { ...(item as Record<string, unknown>) };
      const type = String(entry.type || "CUSTOM_OPERATION");
      const allowed = CONTRACTS_BY_OPERATION_TYPE[type] ?? CONTRACTS_BY_OPERATION_TYPE.CUSTOM_OPERATION;
      const currentContract = typeof entry.inGameContract === "string" ? entry.inGameContract : "";
      const contract = allowed.includes(currentContract) ? currentContract : chooseContract(type, index);

      entry.inGameContract = contract;

      const objective = typeof entry.objective === "string" ? entry.objective : "";
      if (!objective.toLowerCase().includes(contract.toLowerCase())) {
        entry.objective = `Contract focus: ${contract}. ${objective}`.trim();
      }

      const description = typeof entry.description === "string" ? entry.description : "";
      if (!description.toLowerCase().includes(contract.toLowerCase())) {
        entry.description = `${description} Contract reference: ${contract}.`.trim();
      }

      return entry;
    });

    return JSON.stringify(fixed);
  } catch {
    return raw;
  }
}

function resolveProviderFromEnv(): ProviderName {
  const configuredProvider = process.env.AI_PROVIDER?.toLowerCase();

  if (configuredProvider === "gemini") return "gemini";
  if (configuredProvider === "groq") return "groq";
  if (configuredProvider === "openrouter") return "openrouter";
  if (configuredProvider === "openai") return "openai";

  if (configuredProvider && configuredProvider.length > 0) {
    throw new Error(
      `Invalid AI_PROVIDER value \"${configuredProvider}\". Supported values: gemini, groq, openrouter, openai.`
    );
  }

  // Local default order when AI_PROVIDER is not explicitly set.
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.OPENAI_API_KEY) return "openai";

  throw new Error(
    "No AI provider configured. Set AI_PROVIDER or provide one of: GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY."
  );
}

function buildPrompt(input: Omit<GenerateMissionPlanInput, "userId">): string {
  const fleetSection = input.fleetContext
    ? `\n\n${input.fleetContext}\nKeep fleet composition suggestions grounded in these actual quantities. Identify any asset shortfalls clearly.`
    : "";

  const focusSection = input.missionFocus
    ? `\nPreferred Mission Focus: ${input.missionFocus} — all 3 plans should be variations of this type unless the org brief strongly suggests otherwise.`
    : "";

  return `Generate 3 distinct Star Citizen operation plans for the following scenario:

Organization: ${input.organizationName}
Number of Players: ${input.numberOfPlayers}${focusSection}
Org Brief / Goals: ${input.operationDescription}${fleetSection}

Respond ONLY with a raw JSON array of 3 objects. No markdown code fences, no explanation — just the JSON array. Each object must have all required keys as specified.`;
}

async function generateWithOpenAICompatible(
  provider: "groq" | "openrouter" | "openai",
  prompt: string
): Promise<{ text: string; model: string }> {
  let apiKey = "";
  let model = "";
  let baseURL: string | undefined;

  if (provider === "groq") {
    apiKey = process.env.GROQ_API_KEY || "";
    model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    baseURL = "https://api.groq.com/openai/v1";
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is required when AI_PROVIDER=groq.");
    }
  }

  if (provider === "openrouter") {
    apiKey = process.env.OPENROUTER_API_KEY || "";
    model = process.env.OPENROUTER_MODEL || "openrouter/free";
    baseURL = "https://openrouter.ai/api/v1";
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is required when AI_PROVIDER=openrouter.");
    }
  }

  if (provider === "openai") {
    apiKey = process.env.OPENAI_API_KEY || "";
    model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    baseURL = process.env.OPENAI_BASE_URL || undefined;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai.");
    }
  }

  const client = new OpenAI({
    apiKey,
    baseURL,
  });

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
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error(`${provider} returned an empty response.`);
  }

  return { text: content, model };
}

async function generateWithGemini(prompt: string): Promise<{ text: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const maxRetries = Number.parseInt(process.env.GEMINI_MAX_RETRIES ?? "2", 10);

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required when AI_PROVIDER=gemini.");
  }

  const client = new GoogleGenerativeAI(apiKey);
  const generativeModel = client.getGenerativeModel({ model });

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await generativeModel.generateContent(
        `${SYSTEM_PROMPT}\n\nUser request:\n${prompt}`
      );

      const text = response.response.text()?.trim();
      if (!text) {
        throw new Error("Gemini returned an empty response.");
      }

      return { text, model };
    } catch (error) {
      lastError = error;
      const retryable = isRetryableGeminiError(error);
      const canRetry = retryable && attempt < maxRetries;

      if (!canRetry) {
        break;
      }

      // Exponential backoff with a short cap for interactive UX.
      const jitterMs = Math.floor(Math.random() * 250);
      const backoffMs = Math.min(6000, 1200 * 2 ** attempt) + jitterMs;
      await sleep(backoffMs);
    }
  }

  if (isRetryableGeminiError(lastError)) {
    throw new Error(
      "Gemini is temporarily overloaded (503/high demand). Local fallback plans are available; please retry shortly."
    );
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function generateMissionPlan(
  input: GenerateMissionPlanInput
): Promise<GeneratedMissionPlan> {
  const provider = resolveProviderFromEnv();
  const prompt = buildPrompt({
    organizationName: input.organizationName,
    numberOfPlayers: input.numberOfPlayers,
    missionFocus: input.missionFocus,
    operationDescription: input.operationDescription,
    fleetContext: input.fleetContext,
  });

  let output: { text: string; model: string };

  if (provider === "gemini") {
    output = await generateWithGemini(prompt);
  } else {
    output = await generateWithOpenAICompatible(provider, prompt);
  }

  const alignedResult = enforceContractAlignment(output.text, input.operationDescription);

  const plan = await prisma.aIGeneratedPlan.create({
    data: {
      userId: input.userId,
      prompt,
      result: alignedResult,
    },
  });

  return {
    id: plan.id,
    result: plan.result,
    provider,
    model: output.model,
  };
}
