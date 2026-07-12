import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { generateMissionPlan } from "@/lib/ai/provider";
import { getUserFleet } from "@/lib/fleet";

const operationPlanSchema = z.object({
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  numberOfPlayers: z.coerce.number().min(1, "At least 1 player").max(100, "Maximum 100 players"),
  missionFocus: z.string().optional().default(""),
  operationDescription: z.string().min(10, "Description must be at least 10 characters"),
});

// Maps common keywords in the brief to an operation type
function inferFocusFromBrief(desc: string): string {
  const d = desc.toLowerCase();
  if (/bounty|warrant|fugitive|criminal|apprehend/.test(d)) return "BOUNTY_OPERATION";
  if (/cargo|haul|delivery|trade|freight|convoy/.test(d)) return "CARGO_CONVOY";
  if (/mining|mine|rock|ore|claimjump/.test(d)) return "MINING_SECURITY";
  if (/salvage|wreck|debris/.test(d)) return "SALVAGE_OPERATION";
  if (/rescue|medical|medevac|beacon/.test(d)) return "RESCUE_OPERATION";
  if (/patrol|piracy|interdic|escort|protect/.test(d)) return "FLEET_PATROL";
  if (/ground|assault|raid|base|outpost|bunker/.test(d)) return "GROUND_ASSAULT";
  if (/explore|survey|derelict|investigation/.test(d)) return "EXPLORATION_MISSION";
  if (/defend|defense|hold|fortif/.test(d)) return "BASE_DEFENSE";
  return "CUSTOM_OPERATION";
}

const FALLBACK_TEMPLATES: Record<string, {
  titleSuffix: string; type: string; inGameContract: string; location: string;
  threatLevel: string; requiredShips: string; requiredGroundVehicles: string;
  missionPhases: string; commsPlan: string; rulesOfEngagement: string;
  rallyPoints: string; extractionPlan: string; contingencyPlans: string; requiredSupplies: string;
}> = {
  BOUNTY_OPERATION: {
    titleSuffix: "Warrant Hunt", type: "BOUNTY_OPERATION", inGameContract: "Suspect Apprehension Certification",
    location: "Stanton system — contested zones near Hurston and MicroTech",
    threatLevel: "HIGH", requiredShips: "Aegis Gladius, Drake Cutlass Black, MISC Reliant Tana",
    requiredGroundVehicles: "", missionPhases: "Briefing > Target Lock > Intercept > Apprehension > Extraction",
    commsPlan: "Command tracks contact list; hunting pairs report on dedicated channel.",
    rulesOfEngagement: "Engage only confirmed targets; civilian ships are off limits.",
    rallyPoints: "Everus Harbor (primary), CRU-L1 (fallback).",
    extractionPlan: "All callsigns form up at rally point after target is secured or KIA.",
    contingencyPlans: "If target escapes to restricted zone, abort and reassign to secondary warrant.",
    requiredSupplies: "Ammo restock, medpens, EMP charges, tractor beam for recovery",
  },
  CARGO_CONVOY: {
    titleSuffix: "Convoy Run", type: "CARGO_CONVOY", inGameContract: "Covalex Evaluation Shipment",
    location: "Stanton trade lanes",
    threatLevel: "MODERATE", requiredShips: "MISC Freelancer MAX, RSI Zeus, Anvil Arrow",
    requiredGroundVehicles: "", missionPhases: "Route Brief > Staggered Departure > Mid-Route Checkpoint > Final Approach > Delivery",
    commsPlan: "Convoy lead controls cadence; escorts report contacts every 3 minutes or on event.",
    rulesOfEngagement: "Avoid unnecessary pursuit; maintain protective envelope around cargo vessels.",
    rallyPoints: "Baijini Point (primary), CRU-L5 (fallback).",
    extractionPlan: "After delivery confirmation, escorts disengage in pairs to nearest service hub.",
    contingencyPlans: "If convoy split occurs, priority is lead cargo ship and medical regroup.",
    requiredSupplies: "Quantum fuel margin, cargo manifests, tractor support, repair stock",
  },
  MINING_SECURITY: {
    titleSuffix: "Mining Shield", type: "MINING_SECURITY", inGameContract: "Remove Claimjumpers",
    location: "Yela asteroid belt and Daymar surface fields",
    threatLevel: "MODERATE", requiredShips: "MISC Prospector, Anvil Arrow, RSI Constellation",
    requiredGroundVehicles: "Tumbril Cyclone", missionPhases: "Site Selection > Security Screen > Active Mining > Threat Response > Extraction",
    commsPlan: "Miners on logistics net; security on combat net; command bridges both.",
    rulesOfEngagement: "Warn approachees; escalate on confirmed claimjumper or hostile intent.",
    rallyPoints: "Designated extraction site, fallback at nearest orbital platform.",
    extractionPlan: "Miners depart first under escort; security covers rear and departs last.",
    contingencyPlans: "If site is contested by multiple parties, evacuate and reassign to secondary site.",
    requiredSupplies: "Mining heads, refined storage, repair drones, defensive ammo",
  },
  SALVAGE_OPERATION: {
    titleSuffix: "Salvage Sweep", type: "SALVAGE_OPERATION", inGameContract: "Clean Up Crew",
    location: "Derelict sites near Crusader and Yela",
    threatLevel: "MODERATE", requiredShips: "Drake Vulture, MISC Hull C, Anvil Arrow",
    requiredGroundVehicles: "", missionPhases: "Site Survey > Security Setup > Active Salvage > Load-Out > Extraction",
    commsPlan: "Salvage lead tracks cargo totals; security maintains overwatch channel.",
    rulesOfEngagement: "Avoid occupied wrecks; clear site of threats before salvage begins.",
    rallyPoints: "Nearest trade port or station.",
    extractionPlan: "Cargo holds confirmed full then group QT to trade port for sale.",
    contingencyPlans: "If hostile salvagers contest the site, fall back and request reinforcement.",
    requiredSupplies: "Salvage heads, tractor beams, cargo pallets, repair materials",
  },
  RESCUE_OPERATION: {
    titleSuffix: "Search & Rescue", type: "RESCUE_OPERATION", inGameContract: "Search and Rescue",
    location: "Stanton system distress beacon coordinates",
    threatLevel: "MODERATE", requiredShips: "Drake Cutlass Red, Aegis Avenger, RSI Constellation",
    requiredGroundVehicles: "", missionPhases: "Beacon Lock > Transit > Scene Assessment > Extraction > Medical Handoff",
    commsPlan: "Medical lead on dedicated channel; security overwatch on tactical net.",
    rulesOfEngagement: "Non-combatant priority; return fire only if medical ships are threatened.",
    rallyPoints: "Area General Hospital or nearest medical station.",
    extractionPlan: "All survivors loaded before QT; medical ship departs first under escort.",
    contingencyPlans: "If site is hostile, request combat support before entering beacon zone.",
    requiredSupplies: "Med crates, trauma kits, traction splints, backup oxygen",
  },
  FLEET_PATROL: {
    titleSuffix: "Vanguard Sweep", type: "FLEET_PATROL", inGameContract: "Illegal Monitors Detected",
    location: "Hurston orbit and nearby Lagrange corridors",
    threatLevel: "MODERATE", requiredShips: "Anvil Arrow, Aegis Gladius, RSI Constellation",
    requiredGroundVehicles: "", missionPhases: "Briefing > Rally > Patrol Sweep Alpha > Patrol Sweep Bravo > Debrief",
    commsPlan: "Primary on Org Fleet Net, backup on Local Channel 2.",
    rulesOfEngagement: "Challenge unknown contacts first, escalate only on confirmed hostile behavior.",
    rallyPoints: "Everus Harbor (primary), ARC-L1 (secondary).",
    extractionPlan: "Break to nearest orbital station by wing pair after sweep completion.",
    contingencyPlans: "If contact volume spikes, collapse to defensive screen and call reserve wing.",
    requiredSupplies: "Fuel reserves, ammo restock, medpens, ship repair budget",
  },
  GROUND_ASSAULT: {
    titleSuffix: "Strike Force", type: "GROUND_ASSAULT", inGameContract: "Evict Illegal Occupants",
    location: "MicroTech outpost perimeter",
    threatLevel: "HIGH", requiredShips: "Anvil Valkyrie, Aegis Vanguard, Drake Cutlass Red",
    requiredGroundVehicles: "Anvil Spartan, Tumbril Cyclone", missionPhases: "Briefing > Insertion > Perimeter Control > Objective Action > Extraction",
    commsPlan: "Air and ground split nets with command bridge monitoring both.",
    rulesOfEngagement: "Positive ID required; protect transport and medical at all times.",
    rallyPoints: "Primary LZ at designated ridge, fallback on southern flats.",
    extractionPlan: "Ground withdraws in two waves with air escort until all callsigns check in.",
    contingencyPlans: "If LZ compromised, shift to fallback LZ and deploy smoke.",
    requiredSupplies: "Vehicle ammo, med crates, spare armor, beacon kits",
  },
  EXPLORATION_MISSION: {
    titleSuffix: "Survey Op", type: "EXPLORATION_MISSION", inGameContract: "Derelict Site Survey",
    location: "Outer system derelict sites and jump points",
    threatLevel: "LOW", requiredShips: "Origin 600i Explorer, Anvil Arrow, MISC Reliant Sen",
    requiredGroundVehicles: "", missionPhases: "Route Planning > Transit > Site Survey > Data Collection > Return",
    commsPlan: "Scout net for discovery reports; command on backup channel.",
    rulesOfEngagement: "Avoid engagement unless survival requires; prioritize data integrity.",
    rallyPoints: "Closest port with data terminal.",
    extractionPlan: "All data cached locally; QT to port after site survey complete.",
    contingencyPlans: "If hostile presence detected, withdraw immediately and relay site coordinates.",
    requiredSupplies: "Scanning equipment, long-range fuel, survival gear, data chips",
  },
  BASE_DEFENSE: {
    titleSuffix: "Fortress Hold", type: "BASE_DEFENSE", inGameContract: "Protect Site",
    location: "Org-controlled surface installation",
    threatLevel: "HIGH", requiredShips: "Aegis Hammerhead, Anvil Arrow, Drake Cutlass Black",
    requiredGroundVehicles: "Tumbril Nova, Anvil Spartan", missionPhases: "Perimeter Setup > Watch Rotation > Threat Response > Counterattack > After Action",
    commsPlan: "Ground defense net plus orbital watch channel; command monitors both.",
    rulesOfEngagement: "Fire on confirmed hostiles entering the defended perimeter.",
    rallyPoints: "Main structure (primary), secondary bunker (fallback).",
    extractionPlan: "Non-combatants evacuate first; defense holds until all clear confirmed.",
    contingencyPlans: "If perimeter breached, fall back to inner ring and call orbital fire support.",
    requiredSupplies: "Fortification charges, ammo caches, med stations, repair bots",
  },
  CUSTOM_OPERATION: {
    titleSuffix: "Special Operation", type: "CUSTOM_OPERATION", inGameContract: "A Call to Arms",
    location: "Stanton system — location TBD per brief",
    threatLevel: "MODERATE", requiredShips: "Multi-role loadout per brief requirements",
    requiredGroundVehicles: "", missionPhases: "Briefing > Transit > Objective > Extraction > Debrief",
    commsPlan: "Dedicated org channel; report by phase transition.",
    rulesOfEngagement: "Per commander's orders at briefing.",
    rallyPoints: "Nearest major station to objective area.",
    extractionPlan: "All callsigns form on extraction point; command confirms headcount.",
    contingencyPlans: "If objective fails, abort and extract under cover.",
    requiredSupplies: "Mission-specific as outlined in briefing",
  },
};

function buildLocalFallbackPlans(input: {
  organizationName: string;
  numberOfPlayers: number;
  missionFocus?: string;
  operationDescription: string;
}) {
  const roster = Math.max(4, input.numberOfPlayers);
  const support = Math.max(1, Math.floor(roster / 4));
  const strike = Math.max(2, Math.floor(roster / 3));
  const brief = input.operationDescription;

  // Resolve focus: explicit selection > inferred from brief text > CUSTOM
  const focus = input.missionFocus && input.missionFocus.length > 0
    ? input.missionFocus
    : inferFocusFromBrief(brief);

  // Build 3 variants: primary focus + 2 supporting alternatives
  const focusKeys = [focus, ...Object.keys(FALLBACK_TEMPLATES).filter(k => k !== focus)].slice(0, 3);

  return focusKeys.map((key, i) => {
    const t = FALLBACK_TEMPLATES[key] ?? FALLBACK_TEMPLATES.CUSTOM_OPERATION;
    const variantLabel = i === 0 ? "Primary" : i === 1 ? "Alternative Alpha" : "Alternative Bravo";
    return {
      title: `${input.organizationName} ${t.titleSuffix} — ${variantLabel}`,
      type: t.type,
      inGameContract: t.inGameContract,
      location: t.location,
      objective: `Org directive: "${brief.slice(0, 200)}". Execute ${t.inGameContract} to fulfil this goal.`,
      description: `${variantLabel} plan responding directly to org brief: "${brief.slice(0, 300)}". ${t.type.replace(/_/g, " ").toLowerCase()} approach with ${roster} crew.`,
      threatLevel: t.threatLevel,
      requiredShips: t.requiredShips,
      requiredGroundVehicles: t.requiredGroundVehicles,
      requiredPersonnel: `${roster} total (${strike} combat roles, ${support} support, ${Math.max(1, roster - strike - support)} command/logistics)`,
      missionPhases: t.missionPhases,
      commsPlan: t.commsPlan,
      rulesOfEngagement: t.rulesOfEngagement,
      rallyPoints: t.rallyPoints,
      extractionPlan: t.extractionPlan,
      contingencyPlans: t.contingencyPlans,
      requiredSupplies: t.requiredSupplies,
    };
  });
}

function shouldUseLocalFallback(errorMessage: string) {
  const m = errorMessage.toLowerCase();
  return (
    m.includes("no ai provider configured") ||
    m.includes("is required") ||
    m.includes("is missing") ||
    m.includes("503") ||
    m.includes("high demand") ||
    m.includes("service unavailable") ||
    m.includes("temporarily overloaded")
  );
}


export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized: Please log in to use the AI planner" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = operationPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      const fleet = await getUserFleet(session.user.id);
      const fleetSummaryLines: string[] = [];
      if (fleet.assets.length > 0) {
        fleetSummaryLines.push("User's fleet inventory (quantity-aware):");
        for (const asset of fleet.assets) {
          fleetSummaryLines.push(
            `  - ${asset.name} (${asset.kind}) x${asset.quantity} | Role: ${asset.role} | Size: ${asset.size} | Status: ${asset.status}`
          );
        }
        fleetSummaryLines.push(`Total ships: ${fleet.summary.totalShips}, Total vehicles: ${fleet.summary.totalVehicles}, Available assets: ${fleet.summary.availableAssetCount}`);
      } else {
        fleetSummaryLines.push("User has no fleet assets on record yet.");
      }

      const plan = await generateMissionPlan({
        userId: session.user.id,
        organizationName: parsed.data.organizationName,
        numberOfPlayers: parsed.data.numberOfPlayers,
        missionFocus: parsed.data.missionFocus,
        operationDescription: parsed.data.operationDescription,
        fleetContext: fleetSummaryLines.join("\n"),
      });

      return NextResponse.json({
        success: true,
        plan: {
          id: plan.id,
          result: plan.result,
          provider: plan.provider,
          model: plan.model,
        },
      });
    } catch (aiError) {
      const errorMessage =
        aiError instanceof Error ? aiError.message : "AI generation failed";

      if (shouldUseLocalFallback(errorMessage)) {
        const fallbackPlans = buildLocalFallbackPlans(parsed.data);
        return NextResponse.json({
          success: true,
          plan: {
            id: "local-fallback",
            result: JSON.stringify(fallbackPlans),
            provider: "local-fallback",
            model: "rule-based-v1",
          },
          warning:
            "Primary AI provider is unavailable or overloaded. Returned local fallback plan options.",
        });
      }

      return NextResponse.json(
        { error: `AI Generation Error: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("AI Planner Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
