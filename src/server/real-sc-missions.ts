import {
  ExternalUpdateSourceType,
  MissionDifficulty,
  MissionRewardType,
  PrismaClient,
} from "@prisma/client";

type MissionSeed = {
  name: string;
  slug: string;
  summary: string;
  description: string;
  difficulty: MissionDifficulty;
  estimatedDuration: string;
  recommendedPlayersMin: number;
  recommendedPlayersMax: number;
  requiredRoles: string[];
  optionalRoles: string[];
  requiredAssets: string[];
  optionalAssets: string[];
  objectives: string[];
  preparationChecklist: string[];
  executionSteps: string[];
  successConditions: string[];
  failureConditions: string[];
  risks: string[];
  rewardTypes: MissionRewardType[];
  tags: string[];
  aiPromptSeed: string;
};

type CategorySeed = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  templates: MissionSeed[];
};

export const REAL_SC_MISSION_DATA_VERSION = "4.8";

export const REAL_SC_MISSION_SEEDS: CategorySeed[] = [
  {
    name: "Mercenary Contracts",
    slug: "mercenary-contracts",
    description: "Core in-game mercenary contracts regularly available through the mobiGlas Contract Manager.",
    icon: "crosshair",
    templates: [
      {
        name: "A Call to Arms",
        slug: "a-call-to-arms",
        summary: "General combat bonus contract that pays for eliminating wanted hostiles.",
        description:
          "A persistent mercenary bonus contract accepted before combat activities. Grants extra aUEC payouts for lawful kills against hostile targets.",
        difficulty: MissionDifficulty.EASY,
        estimatedDuration: "30m to 180m",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 8,
        requiredRoles: ["Pilot", "Combat operator"],
        optionalRoles: ["Wingman", "Turret gunner"],
        requiredAssets: ["Combat-capable ship"],
        optionalAssets: ["Multi-crew fighter", "Ground loadout"],
        objectives: [
          "Accept contract before engagement",
          "Eliminate lawful hostile targets",
          "Stack payouts with other mission loops",
        ],
        preparationChecklist: [
          "Rearm and repair before sortie",
          "Confirm lawful jurisdiction",
          "Set medbed spawn if available",
        ],
        executionSteps: [
          "Accept A Call to Arms",
          "Run bounties, bunkers, or event combat",
          "Track bonus payouts in mission log",
        ],
        successConditions: ["Consistent hostile kill payouts"],
        failureConditions: ["Mission dropped or timed out during session"],
        risks: ["CrimeStat from accidental friendly fire"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["mercenary", "always-on", "payout-bonus"],
        aiPromptSeed:
          "Build a combat plan that assumes A Call to Arms is active for lawful bonus payouts.",
      },
      {
        name: "Illegal Surveillance Detected",
        slug: "illegal-surveillance-detected",
        summary: "Destroy hidden illegal monitors before the timer expires.",
        description:
          "Mercenary mission requiring quick identification and destruction of three surveillance probes around a comm array area within a limited time window.",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "10m to 20m",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 3,
        requiredRoles: ["Pilot", "Scanner operator"],
        optionalRoles: ["Escort"],
        requiredAssets: ["Fast ship with strong scan visibility"],
        optionalAssets: ["Light fighter escort"],
        objectives: [
          "Reach surveillance zone quickly",
          "Locate all illegal monitors",
          "Destroy all monitors before timeout",
        ],
        preparationChecklist: [
          "Top off quantum fuel",
          "Bind target cycling controls",
          "Configure radar/scan zoom",
        ],
        executionSteps: [
          "Arrive and ping for signatures",
          "Destroy first two monitors rapidly",
          "Sweep final monitor and exfil",
        ],
        successConditions: ["All monitors destroyed within mission timer"],
        failureConditions: ["Timer expires before all objectives complete"],
        risks: ["Hostile NPC spawn", "Low visibility in cluttered space"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["mercenary", "timed", "space-combat"],
        aiPromptSeed:
          "Plan a fast strike route for Illegal Surveillance Detected with strict timer control.",
      },
      {
        name: "Claimjumpers",
        slug: "claimjumpers",
        summary: "Neutralize unauthorized sentry platforms and pirate defenders in asteroid fields.",
        description:
          "Mercenary combat contract involving multiple sentry turrets and hostile ships. Requires target prioritization and survivability management.",
        difficulty: MissionDifficulty.HARD,
        estimatedDuration: "15m to 30m",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 4,
        requiredRoles: ["Combat pilot"],
        optionalRoles: ["Wingman", "Missile support"],
        requiredAssets: ["Medium or heavy combat ship"],
        optionalAssets: ["Support fighter", "Repair-capable ship"],
        objectives: [
          "Destroy all sentry platforms",
          "Eliminate defending hostiles",
          "Exit combat zone safely",
        ],
        preparationChecklist: [
          "Load anti-fighter and anti-structure weapons",
          "Carry extra missiles",
          "Set recovery station nearby",
        ],
        executionSteps: [
          "Prioritize high-threat sentries",
          "Break line of sight with terrain",
          "Clean up remaining defenders",
        ],
        successConditions: ["Sentry network fully destroyed"],
        failureConditions: ["Ship destruction before objective completion"],
        risks: ["High incoming DPS", "Multiple simultaneous targets"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["mercenary", "asteroid", "high-threat"],
        aiPromptSeed:
          "Generate turret-priority tactics for a Claimjumpers contract in dense asteroid cover.",
      },
      {
        name: "Urgent: Boarding Action in Progress",
        slug: "urgent-boarding-action-in-progress",
        summary: "Respond to active ship hijack and clear hostile boarders.",
        description:
          "Time-sensitive FPS/ship-boarding contract where teams breach and secure a disabled vessel while eliminating hostile occupants.",
        difficulty: MissionDifficulty.HARD,
        estimatedDuration: "20m to 40m",
        recommendedPlayersMin: 2,
        recommendedPlayersMax: 8,
        requiredRoles: ["Squad lead", "Boarding team", "Pilot"],
        optionalRoles: ["Medic", "Security overwatch"],
        requiredAssets: ["Transport ship", "FPS gear"],
        optionalAssets: ["Cutlass Red", "Breaching team support"],
        objectives: [
          "Reach disabled ship",
          "Board and clear hostiles",
          "Secure remaining survivors or objective cargo",
        ],
        preparationChecklist: [
          "Synchronize voice comms",
          "Assign breach order",
          "Carry medpens and tractor tool",
        ],
        executionSteps: [
          "Establish external security",
          "Breach in fireteams",
          "Sweep decks and confirm objective",
        ],
        successConditions: ["Hostile boarders neutralized and ship secured"],
        failureConditions: ["Team wipe or objective abandonment"],
        risks: ["Close-quarters ambushes", "Friendly fire in tight corridors"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION, MissionRewardType.LOOT],
        tags: ["mercenary", "boarding", "fps"],
        aiPromptSeed:
          "Create a boarding doctrine for Urgent: Boarding Action in Progress with fireteam sequencing.",
      },
    ],
  },
  {
    name: "Bounty Hunter Contracts",
    slug: "bounty-hunter-contracts",
    description: "Standard bounty progression contracts found under Bounty Hunter and Northrock service lines.",
    icon: "target",
    templates: [
      {
        name: "Bounty Hunter License Certification",
        slug: "bounty-hunter-license-certification",
        summary: "Initial certification contract to unlock bounty mission progression.",
        description:
          "Entry contract that validates combat readiness and unlocks progression into higher bounty tiers.",
        difficulty: MissionDifficulty.EASY,
        estimatedDuration: "10m to 20m",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 2,
        requiredRoles: ["Pilot"],
        optionalRoles: ["Wingman"],
        requiredAssets: ["Combat-capable ship"],
        optionalAssets: ["Interdiction-capable ship"],
        objectives: [
          "Accept certification contract",
          "Eliminate target",
          "Complete unlock chain",
        ],
        preparationChecklist: [
          "Ship weapons loaded",
          "Quantum route set",
          "Ammo and missiles stocked",
        ],
        executionSteps: [
          "Track target marker",
          "Engage and eliminate target",
          "Confirm mission completion",
        ],
        successConditions: ["Certification chain completed"],
        failureConditions: ["Target escapes or player destroyed"],
        risks: ["Unexpected reinforcements"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["bounty", "certification", "progression"],
        aiPromptSeed:
          "Plan a fast and safe route for completing Bounty Hunter License Certification missions.",
      },
      {
        name: "VLRT to ERT Bounty Progression",
        slug: "vlrt-to-ert-bounty-progression",
        summary: "Tiered bounty contracts from Very Low Risk through Extreme Risk Targets.",
        description:
          "Core bounty loop that scales difficulty by target class and escorts. Supports solo to small-wing progression.",
        difficulty: MissionDifficulty.HARD,
        estimatedDuration: "20m to 120m",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 4,
        requiredRoles: ["Pilot", "Combat operator"],
        optionalRoles: ["Turret gunner", "Wingman"],
        requiredAssets: ["Combat ship tuned for sustained dogfights"],
        optionalAssets: ["Heavy fighter escort"],
        objectives: [
          "Clear tiered bounty contracts",
          "Maintain reputation progression",
          "Manage repairs between engagements",
        ],
        preparationChecklist: [
          "Tune loadout by target tier",
          "Set nearest repair station",
          "Track rep gain per provider",
        ],
        executionSteps: [
          "Start with current unlocked tier",
          "Prioritize primary target over escorts when safe",
          "Chain contracts for rep efficiency",
        ],
        successConditions: ["Consistent contract completion with rep gain"],
        failureConditions: ["Repeated losses stall progression"],
        risks: ["High-tier alpha damage", "Multi-target overwhelm"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["bounty", "vlrt", "ert", "combat-loop"],
        aiPromptSeed:
          "Generate a tier-by-tier bounty strategy from VLRT through ERT with loadout swaps.",
      },
      {
        name: "ECN Alert",
        slug: "ecn-alert",
        summary: "Emergency communication network distress response against active attackers.",
        description:
          "Rapid response combat contract where pilots defend civilian/security targets under attack in local space.",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "10m to 25m",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 3,
        requiredRoles: ["Pilot"],
        optionalRoles: ["Escort"],
        requiredAssets: ["Quick-response combat ship"],
        optionalAssets: ["Missile support"],
        objectives: [
          "Respond before target destruction",
          "Eliminate attackers",
          "Preserve defended vessel",
        ],
        preparationChecklist: [
          "High-speed quantum setup",
          "Balanced anti-fighter loadout",
          "Comms open for quick contract chaining",
        ],
        executionSteps: [
          "Quantum to alert location",
          "Draw aggro off defended ship",
          "Finish all hostiles",
        ],
        successConditions: ["Defended ship survives and attackers eliminated"],
        failureConditions: ["Protected vessel destroyed"],
        risks: ["Late arrival", "Missile saturation"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["ecn", "rescue", "space-combat"],
        aiPromptSeed:
          "Design a rapid-response ECN Alert interception plan with priority target logic.",
      },
    ],
  },
  {
    name: "Investigation Contracts",
    slug: "investigation-contracts",
    description: "Canon investigation mission chains focused on missing persons, wrecks, and black-box recovery.",
    icon: "search",
    templates: [
      {
        name: "P.I. Wanted",
        slug: "pi-wanted",
        summary: "Investigate a missing private investigator and recover evidence from a derelict site.",
        description:
          "Investigation chain mission that sends players to probe abandoned locations, collect evidence, and survive possible hostile contacts.",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "20m to 45m",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 3,
        requiredRoles: ["Investigator", "Pilot"],
        optionalRoles: ["Security", "Medic"],
        requiredAssets: ["Ship with cargo space", "FPS kit"],
        optionalAssets: ["Scanner-focused ship"],
        objectives: [
          "Reach target investigation site",
          "Find and collect mission evidence",
          "Deliver findings to contract authority",
        ],
        preparationChecklist: ["Bring tractor beam", "Carry spare medpens", "Set nearest clinic spawn"],
        executionSteps: ["Scan and approach site", "Clear immediate threats", "Recover objective items and exfiltrate"],
        successConditions: ["Evidence delivered and mission closed"],
        failureConditions: ["Evidence lost or player death during extraction"],
        risks: ["Hostile contacts at site", "Low visibility in wreck interiors"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["investigation", "fps", "derelict"],
        aiPromptSeed:
          "Create an investigation playbook for P.I. Wanted emphasizing evidence retrieval and safe extraction.",
      },
      {
        name: "Missing Crew",
        slug: "missing-crew",
        summary: "Locate missing crew members from crashed ships or cave incidents.",
        description:
          "Recurring investigation contract family that requires searching crash zones and cave systems for crew bodies, identifiers, or black-box traces.",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "25m to 60m",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 4,
        requiredRoles: ["Pilot", "Search lead"],
        optionalRoles: ["Medic", "Ground escort"],
        requiredAssets: ["Ship for insertion", "Ground traversal gear"],
        optionalAssets: ["Rescue-capable ship"],
        objectives: [
          "Survey designated search area",
          "Recover required crew evidence or remains",
          "Transmit or deliver contract confirmation",
        ],
        preparationChecklist: ["Load flares and multitool", "Review cave navigation", "Carry food and hydration"],
        executionSteps: ["Insert at search zone", "Systematically sweep route", "Recover mission items and return"],
        successConditions: ["All required crew confirmations completed"],
        failureConditions: ["Search objective timed out or item not recovered"],
        risks: ["Cave disorientation", "Wildlife/hostile encounter"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["investigation", "search-and-recovery", "cave"],
        aiPromptSeed:
          "Generate a Missing Crew search pattern plan with waypoint discipline and extraction contingencies.",
      },
      {
        name: "Black Box Recovery",
        slug: "black-box-recovery",
        summary: "Retrieve and return a crashed vessel black box from hazardous terrain or space debris.",
        description:
          "Investigation and recovery contract chain requiring navigation to wrecks, black-box retrieval, and delivery to authorized terminals.",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "20m to 50m",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 3,
        requiredRoles: ["Pilot", "Recovery specialist"],
        optionalRoles: ["Escort"],
        requiredAssets: ["Ship with cargo room", "Tractor beam"],
        optionalAssets: ["Scout ship"],
        objectives: [
          "Reach crash or debris field",
          "Locate and recover black box",
          "Deliver to contract drop-off",
        ],
        preparationChecklist: ["Check local weather/visibility", "Carry backup armor", "Plan return corridor"],
        executionSteps: ["Approach and scan wreck", "Secure black box", "Return and complete handoff"],
        successConditions: ["Black box safely delivered"],
        failureConditions: ["Black box destroyed or lost"],
        risks: ["Hostiles near wreck", "Atmospheric hazards"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["investigation", "recovery", "wreck"],
        aiPromptSeed:
          "Plan a Black Box Recovery route with low-risk approach vectors and secure return timing.",
      },
    ],
  },
  {
    name: "Delivery Contracts",
    slug: "delivery-contracts",
    description: "Canon delivery mission chains for lawful, timed, and factional courier runs.",
    icon: "package",
    templates: [
      {
        name: "Covalex Evaluation Opportunity",
        slug: "covalex-evaluation-opportunity",
        summary: "Starter delivery chain proving reliability for Covalex-linked logistics work.",
        description:
          "Well-known entry contract line focused on package pickup and delivery to designated outposts and stations.",
        difficulty: MissionDifficulty.EASY,
        estimatedDuration: "10m to 30m",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 2,
        requiredRoles: ["Courier pilot"],
        optionalRoles: ["Escort"],
        requiredAssets: ["Light ship with storage"],
        optionalAssets: ["Fast shuttle"],
        objectives: ["Pick up package", "Travel to destination", "Deliver without package loss"],
        preparationChecklist: ["Route plotted", "Cargo bay clear", "Avoid high-threat zones"],
        executionSteps: ["Collect cargo", "Transit efficiently", "Confirm terminal handoff"],
        successConditions: ["All parcels delivered on contract"],
        failureConditions: ["Package lost or delivery timed out"],
        risks: ["Interdiction", "Misdelivery"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["delivery", "courier", "starter"],
        aiPromptSeed:
          "Create an efficient route plan for Covalex Evaluation Opportunity with low-risk pickup sequencing.",
      },
      {
        name: "Red Wind Delivery",
        slug: "red-wind-delivery",
        summary: "Criminal-leaning delivery chain with stricter timing and higher route risk.",
        description:
          "Personal delivery contract line involving high-risk package movement where route control and evasion matter.",
        difficulty: MissionDifficulty.HARD,
        estimatedDuration: "15m to 45m",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 3,
        requiredRoles: ["Courier pilot"],
        optionalRoles: ["Escort", "Lookout"],
        requiredAssets: ["Fast ship with cargo space"],
        optionalAssets: ["Interdiction counter ship"],
        objectives: ["Collect sensitive package", "Avoid security interception", "Complete drop at instructed site"],
        preparationChecklist: ["Stealth-friendly route set", "No illegal cargo conflicts", "Fuel for diversion jumps"],
        executionSteps: ["Grab package quickly", "Run low-exposure route", "Deliver and exit immediately"],
        successConditions: ["Package delivered before deadline"],
        failureConditions: ["Security seizure or cargo destruction"],
        risks: ["PvP interception", "CrimeStat escalation"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["delivery", "high-risk", "personal-contract"],
        aiPromptSeed:
          "Generate a Red Wind Delivery route that minimizes scan exposure and maximizes timing reliability.",
      },
      {
        name: "Ling Family Delivery",
        slug: "ling-family-delivery",
        summary: "Courier contract chain with multi-stop package handoffs.",
        description:
          "Delivery progression route with faction-flavored parcel jobs often requiring multiple pickup and drop-off points.",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "20m to 50m",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 3,
        requiredRoles: ["Courier", "Navigator"],
        optionalRoles: ["Escort"],
        requiredAssets: ["Cargo-capable starter or medium ship"],
        optionalAssets: ["Fast escort"],
        objectives: ["Complete all package pickups", "Execute multi-stop drop-offs", "Meet route timing"],
        preparationChecklist: ["Sort delivery order", "Set city/station landing plan", "Pre-stage med/food supplies"],
        executionSteps: ["Chain pickups", "Optimize landing sequence", "Close all handoff terminals"],
        successConditions: ["All waypoints delivered without loss"],
        failureConditions: ["Any required drop-off missed"],
        risks: ["Landing delays", "Cargo misplacement"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["delivery", "multi-stop", "route-planning"],
        aiPromptSeed:
          "Plan a Ling Family Delivery loop with waypoint ordering to reduce landing overhead and delays.",
      },
    ],
  },
  {
    name: "Salvage Contracts",
    slug: "salvage-contracts",
    description: "Canon salvage loops including hull scraping, structural breakup, and legal/illegal claim handling.",
    icon: "wrench",
    templates: [
      {
        name: "Salvage Claim",
        slug: "salvage-claim",
        summary: "Recover material from designated legal salvage targets and process for sale.",
        description:
          "Core salvage contract loop for scraping hull material and returning value through refinery or trade terminals.",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "20m to 60m",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 4,
        requiredRoles: ["Salvage pilot"],
        optionalRoles: ["Cargo handler", "Escort"],
        requiredAssets: ["Salvage-capable ship"],
        optionalAssets: ["Cargo hauler"],
        objectives: ["Travel to claim site", "Scrape target hull", "Store and deliver salvage output"],
        preparationChecklist: ["Equip salvage modules", "Reserve cargo space", "Choose sale destination"],
        executionSteps: ["Arrive and secure area", "Run scraping cycle", "Transfer and sell recovered material"],
        successConditions: ["Target salvage quota met and delivered"],
        failureConditions: ["Cargo loss or contract timeout"],
        risks: ["Hostile interruption", "Site depletion"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION, MissionRewardType.LOOT],
        tags: ["salvage", "hull-scraping", "industry"],
        aiPromptSeed:
          "Create a Salvage Claim operation with scrape sequencing, cargo logistics, and risk controls.",
      },
      {
        name: "Illegal Salvage Claim",
        slug: "illegal-salvage-claim",
        summary: "High-risk salvage chain in contested or unlawful areas with stronger interference potential.",
        description:
          "Variant salvage contracts involving restricted/contested claim zones where security or rival contact risk is elevated.",
        difficulty: MissionDifficulty.HARD,
        estimatedDuration: "25m to 75m",
        recommendedPlayersMin: 2,
        recommendedPlayersMax: 6,
        requiredRoles: ["Salvage pilot", "Security escort"],
        optionalRoles: ["Cargo specialist", "Scout"],
        requiredAssets: ["Salvage ship", "Combat escort"],
        optionalAssets: ["Cargo hauler", "Interdiction support"],
        objectives: ["Enter contested salvage zone", "Recover target materials", "Extract before hostile overmatch"],
        preparationChecklist: ["Assign escort pairs", "Set emergency jump points", "Plan fast offload location"],
        executionSteps: ["Secure perimeter", "Execute fast salvage pass", "Extract and process cargo"],
        successConditions: ["Salvage recovered and extracted"],
        failureConditions: ["Ship loss or seizure by hostiles"],
        risks: ["PvP conflict", "CrimeStat escalation", "Ambush near exits"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.LOOT, MissionRewardType.FUN_SOCIAL],
        tags: ["salvage", "high-risk", "contested"],
        aiPromptSeed:
          "Generate an Illegal Salvage Claim plan with escort screen logic and emergency extraction triggers.",
      },
      {
        name: "Panel Salvage Recovery",
        slug: "panel-salvage-recovery",
        summary: "Quick salvage runs targeting hull panels and debris clusters for efficient material yield.",
        description:
          "Routine salvage pattern focused on locating panel fields, maximizing scrape uptime, and minimizing transit dead time.",
        difficulty: MissionDifficulty.EASY,
        estimatedDuration: "15m to 40m",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 3,
        requiredRoles: ["Salvage pilot"],
        optionalRoles: ["Cargo support"],
        requiredAssets: ["Salvage-capable ship"],
        optionalAssets: ["Cargo shuttle"],
        objectives: ["Find dense panel field", "Complete targeted scraping cycle", "Sell recovered RMC efficiently"],
        preparationChecklist: ["Set scan keybinds", "Clear cargo grid", "Choose shortest sale loop"],
        executionSteps: ["Scan and identify panels", "Scrape in shortest reposition loops", "Return and offload"],
        successConditions: ["Consistent profitable runs completed"],
        failureConditions: ["Cargo loss or unusable route timing"],
        risks: ["Competition at high-yield spots", "Long return routes"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["salvage", "panel", "solo-friendly"],
        aiPromptSeed:
          "Build a panel-salvage farming route focused on yield per minute and safe offload timing.",
      },
    ],
  },
  {
    name: "Dynamic Events",
    slug: "dynamic-events",
    description: "Recurring large-scale Star Citizen dynamic events run by CIG.",
    icon: "activity",
    templates: [
      {
        name: "XenoThreat",
        slug: "xenothreat",
        summary: "System-wide PvE event combining fleet combat and cargo logistics under pressure.",
        description:
          "Large-scale event involving anti-Xeno combat, cargo recovery, and coordinated delivery phases with escalating opposition.",
        difficulty: MissionDifficulty.EXTREME,
        estimatedDuration: "60m to 240m",
        recommendedPlayersMin: 8,
        recommendedPlayersMax: 50,
        requiredRoles: ["Fleet command", "Combat pilots", "Cargo pilots", "Turret crews"],
        optionalRoles: ["Medical support", "Escort wing", "Logistics lead"],
        requiredAssets: ["Combat ships", "Cargo haulers"],
        optionalAssets: ["Medical ships", "Refuel/repair support"],
        objectives: [
          "Control combat zones",
          "Recover priority cargo",
          "Complete delivery chain under fire",
        ],
        preparationChecklist: [
          "Form combat and logistics squads",
          "Define VOIP nets by wing",
          "Assign rally and fallback stations",
        ],
        executionSteps: [
          "Secure hostile sector",
          "Run protected cargo extraction",
          "Hold objectives through final wave",
        ],
        successConditions: ["Event objectives completed across all phases"],
        failureConditions: ["Cargo chain collapses or fleet wiped"],
        risks: ["Heavy NPC pressure", "Coordination breakdown at scale"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION, MissionRewardType.ORG_READINESS],
        tags: ["dynamic-event", "fleet", "logistics", "pve"],
        aiPromptSeed:
          "Create a multi-wing XenoThreat operation plan with separate combat and cargo lanes.",
      },
      {
        name: "Nine Tails Lockdown",
        slug: "nine-tails-lockdown",
        summary: "Event focused on breaking or enforcing blockade conditions around major landing zones.",
        description:
          "Dynamic event where players engage in high-intensity blockade scenarios with strong lawful and unlawful participation routes.",
        difficulty: MissionDifficulty.EXTREME,
        estimatedDuration: "45m to 180m",
        recommendedPlayersMin: 6,
        recommendedPlayersMax: 40,
        requiredRoles: ["Strike lead", "Interdiction pilots", "Escort"],
        optionalRoles: ["Recon", "Medical"],
        requiredAssets: ["Combat and interception ships"],
        optionalAssets: ["Support logistics ships"],
        objectives: [
          "Engage blockade assets",
          "Secure transit corridors",
          "Sustain control through event window",
        ],
        preparationChecklist: [
          "Assign lawful/unlawful objective branch",
          "Set interdiction counter-plan",
          "Pre-brief extraction routes",
        ],
        executionSteps: [
          "Establish combat air patrol",
          "Push blockade objectives",
          "Maintain corridor control",
        ],
        successConditions: ["Blockade objectives completed for chosen side"],
        failureConditions: ["Lanes remain uncontested and objectives fail"],
        risks: ["Player opposition", "High attrition"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION, MissionRewardType.ORG_READINESS],
        tags: ["dynamic-event", "blockade", "pvp-pve"],
        aiPromptSeed:
          "Generate a Nine Tails Lockdown doctrine with lane control, interdiction response, and extraction timing.",
      },
      {
        name: "Siege of Orison",
        slug: "siege-of-orison",
        summary: "Large-scale platform assault event focused on coordinated FPS and air support.",
        description:
          "Combined-arms event where teams clear enemy-held platforms, disable command nodes, and complete extraction under pressure.",
        difficulty: MissionDifficulty.EXTREME,
        estimatedDuration: "60m to 180m",
        recommendedPlayersMin: 6,
        recommendedPlayersMax: 30,
        requiredRoles: ["Squad lead", "FPS assault", "Pilot"],
        optionalRoles: ["Medic", "Overwatch", "Transport"],
        requiredAssets: ["Dropship/transport", "FPS kits"],
        optionalAssets: ["Medical transport", "Escort fighter"],
        objectives: [
          "Insert teams onto objectives",
          "Clear hostile platform defenders",
          "Complete command objective and extract",
        ],
        preparationChecklist: [
          "Define insertion order",
          "Set med and ammo staging",
          "Assign pilot extraction timing",
        ],
        executionSteps: [
          "Secure landing zone",
          "Clear objectives in sequence",
          "Extract all squads before timeout",
        ],
        successConditions: ["Final objective complete and squads extracted"],
        failureConditions: ["Objective timeout or squad elimination"],
        risks: ["Heavy FPS resistance", "Missed extraction windows"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION, MissionRewardType.LOOT],
        tags: ["dynamic-event", "fps", "combined-arms"],
        aiPromptSeed:
          "Build a Siege of Orison assault plan with insertion waves and synchronized extraction.",
      },
      {
        name: "Jumptown 2.0",
        slug: "jumptown-2-0",
        summary: "High-conflict event centered on controlling drug production and distribution sites.",
        description:
          "Competitive event where groups contest production points, run contraband logistics, and defend routes against rival players.",
        difficulty: MissionDifficulty.EXTREME,
        estimatedDuration: "60m to 240m",
        recommendedPlayersMin: 4,
        recommendedPlayersMax: 30,
        requiredRoles: ["Site control lead", "Security wing", "Cargo runner"],
        optionalRoles: ["Scout", "Medic", "Ground vehicle support"],
        requiredAssets: ["Combat ships", "Cargo transport"],
        optionalAssets: ["Ground vehicles", "Fast interceptors"],
        objectives: [
          "Secure production location",
          "Extract and move product",
          "Defend routes and holding areas",
        ],
        preparationChecklist: [
          "Assign perimeter sectors",
          "Create convoy timetable",
          "Set fallback hide routes",
        ],
        executionSteps: [
          "Capture and hold production zone",
          "Rotate cargo runs under escort",
          "Disengage on overmatch and regroup",
        ],
        successConditions: ["Sustained control and successful extraction runs"],
        failureConditions: ["Site overrun or repeated convoy losses"],
        risks: ["Heavy player conflict", "Ambush on known routes"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.LOOT, MissionRewardType.FUN_SOCIAL],
        tags: ["dynamic-event", "pvp", "contraband", "logistics"],
        aiPromptSeed:
          "Generate a Jumptown 2.0 control-and-logistics plan with layered security and convoy timing.",
      },
    ],
  },
];

export async function syncRealScMissions(prisma: PrismaClient): Promise<{ categoryCount: number; templateCount: number }> {
  await prisma.missionTemplate.deleteMany({});
  await prisma.missionCategory.deleteMany({});

  for (const category of REAL_SC_MISSION_SEEDS) {
    const createdCategory = await prisma.missionCategory.create({
      data: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
      },
    });

    for (const template of category.templates) {
      await prisma.missionTemplate.create({
        data: {
          categoryId: createdCategory.id,
          name: template.name,
          slug: template.slug,
          summary: template.summary,
          description: template.description,
          difficulty: template.difficulty,
          estimatedDuration: template.estimatedDuration,
          recommendedPlayersMin: template.recommendedPlayersMin,
          recommendedPlayersMax: template.recommendedPlayersMax,
          recommendedOrganizationsMin: 1,
          recommendedOrganizationsMax: 5,
          requiredRoles: template.requiredRoles,
          optionalRoles: template.optionalRoles,
          requiredAssets: template.requiredAssets,
          optionalAssets: template.optionalAssets,
          objectives: template.objectives,
          preparationChecklist: template.preparationChecklist,
          executionSteps: template.executionSteps,
          successConditions: template.successConditions,
          failureConditions: template.failureConditions,
          risks: template.risks,
          rewardTypes: template.rewardTypes,
          tags: template.tags,
          aiPromptSeed: template.aiPromptSeed,
          sourceType: ExternalUpdateSourceType.MANUAL,
          sourceTitle: `Star Citizen ${REAL_SC_MISSION_DATA_VERSION} in-game contracts and dynamic events`,
          addedByMissionIntelligence: false,
          lastVerifiedAt: new Date(),
        },
      });
    }
  }

  const [categoryCount, templateCount] = await Promise.all([
    prisma.missionCategory.count(),
    prisma.missionTemplate.count(),
  ]);

  return { categoryCount, templateCount };
}
