import "dotenv/config";
import { PrismaClient, AssetStatus, AssetType, NotificationType, OperationStatus, OperationType, OrganizationFocusType, OrganizationMemberRole, OrganizationVisibility, RSVPStatus, ThreatLevel, MissionDifficulty, MissionRewardType, ShipRole, ShipSize, VehicleRole, VehicleSize } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";
import { syncRealScMissions } from "../scripts/lib/real-sc-missions";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

function assertSeedTargetAllowed() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required before running the seed script.");
  }

  const isLocalDatabase = /(localhost|127\.0\.0\.1|postgres:postgres@db|postgres:postgres@localhost)/i.test(databaseUrl);
  const allowRemoteSeed = process.env.ALLOW_REMOTE_SEED === "true";

  if (!isLocalDatabase && !allowRemoteSeed) {
    throw new Error(
      "Refusing to run destructive seed against a non-local database. Set ALLOW_REMOTE_SEED=true only for an intentional staging/test seed.",
    );
  }
}

async function main() {
  assertSeedTargetAllowed();

  await prisma.messageReaction.deleteMany();
  await prisma.commentReaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.rSVP.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.afterActionReport.deleteMany();
  await prisma.operationAsset.deleteMany();
  await prisma.operationParticipant.deleteMany();
  await prisma.roleAssignment.deleteMany();
  await prisma.operation.deleteMany();
  await prisma.coalitionMember.deleteMany();
  await prisma.coalition.deleteMany();
  await prisma.allianceMember.deleteMany();
  await prisma.alliance.deleteMany();
  await prisma.organizationJoinRequest.deleteMany();
  await prisma.organizationInvite.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.activityFeedItem.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.ship.deleteMany();
  await prisma.groundVehicle.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = hashSync("password123", 10);

  const commander = await prisma.user.create({
    data: {
      name: "Aegis Command",
      email: "commander@starcitizenops.local",
      passwordHash,
      starCitizenHandle: "AegisCmdr",
      bio: "Fleet operations commander focused on coordinated strikes.",
      timezone: "UTC",
      availability: "Weeknights 19:00-23:00 UTC",
      preferredRoles: ["Commander", "Pilot", "Security"],
    },
  });

  const pilot = await prisma.user.create({
    data: {
      name: "Valkyrie Wing",
      email: "pilot@starcitizenops.local",
      passwordHash,
      starCitizenHandle: "ValkyrieWing",
      bio: "Escort and strike pilot with logistics backup capability.",
      timezone: "UTC-5",
      availability: "Weekends",
      preferredRoles: ["Fighter pilot", "Dropship pilot", "Scout/recon"],
    },
  });

  const medic = await prisma.user.create({
    data: {
      name: "Medivac One",
      email: "medic@starcitizenops.local",
      passwordHash,
      starCitizenHandle: "MedivacOne",
      bio: "Combat medic and rescue specialist.",
      timezone: "UTC+1",
      availability: "Flexible",
      preferredRoles: ["Medic", "Engineer"],
    },
  });

  const recon = await prisma.user.create({
    data: {
      name: "Ghost Vector",
      email: "recon@starcitizenops.local",
      passwordHash,
      starCitizenHandle: "GhostVector",
      bio: "Recon and forward observer for hostile-zone insertions.",
      timezone: "UTC+2",
      availability: "Most evenings",
      preferredRoles: ["Recon", "Scanner", "Navigator"],
    },
  });

  const logistics = await prisma.user.create({
    data: {
      name: "Cargo Monarch",
      email: "logistics@starcitizenops.local",
      passwordHash,
      starCitizenHandle: "CargoMonarch",
      bio: "Supply chain lead for fuel, ammo, and extraction cargo.",
      timezone: "UTC-3",
      availability: "Weeknights",
      preferredRoles: ["Logistics", "Cargo", "Support"],
    },
  });

  const marine = await prisma.user.create({
    data: {
      name: "Titan Breach",
      email: "marine@starcitizenops.local",
      passwordHash,
      starCitizenHandle: "TitanBreach",
      bio: "Boarding and bunker assault specialist.",
      timezone: "UTC+0",
      availability: "Flexible",
      preferredRoles: ["Infantry", "Breach", "Defense"],
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: "Aegis Vanguard",
      tag: "AEGV",
      description: "Combined-arms org for tactical fleet and ground ops.",
      focusType: OrganizationFocusType.MILITARY,
      visibility: OrganizationVisibility.PUBLIC,
      ownerId: commander.id,
      members: {
        create: [
          { userId: commander.id, role: OrganizationMemberRole.OWNER, title: "Commander" },
          { userId: pilot.id, role: OrganizationMemberRole.OFFICER, title: "Wing Lead" },
          { userId: medic.id, role: OrganizationMemberRole.MEMBER, title: "Medical Officer" },
          { userId: recon.id, role: OrganizationMemberRole.TEAM_LEADER, title: "Recon Lead" },
          { userId: logistics.id, role: OrganizationMemberRole.MEMBER, title: "Logistics Officer" },
          { userId: marine.id, role: OrganizationMemberRole.MEMBER, title: "Strike Marine" },
        ],
      },
    },
  });

  const partnerOrg = await prisma.organization.create({
    data: {
      name: "Atlas Freight Group",
      tag: "ATFG",
      description: "Industrial logistics org supporting coalition deployments.",
      focusType: OrganizationFocusType.LOGISTICS,
      visibility: OrganizationVisibility.PUBLIC,
      ownerId: logistics.id,
      members: {
        create: [{ userId: logistics.id, role: OrganizationMemberRole.OWNER, title: "Guildmaster" }],
      },
    },
  });

  const loadTestUsersInput = Array.from({ length: 30 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");

    return {
      name: `Load Test User ${number}`,
      email: `loadtest+${number}@starcitizenops.local`,
      passwordHash,
      starCitizenHandle: `LoadPilot${number}`,
      bio: "Automated load-test profile for validating live messaging behavior.",
      timezone: "UTC",
      availability: "Daily",
      preferredRoles: ["Pilot", "Support", "Recon"],
    };
  });

  await prisma.user.createMany({
    data: loadTestUsersInput,
  });

  const loadTestUsers = await prisma.user.findMany({
    where: {
      email: {
        in: loadTestUsersInput.map((user) => user.email),
      },
    },
    orderBy: {
      email: "asc",
    },
  });

  await prisma.organizationMember.createMany({
    data: loadTestUsers.map((user, index) => ({
      organizationId: org.id,
      userId: user.id,
      role: index < 4 ? OrganizationMemberRole.TEAM_LEADER : OrganizationMemberRole.MEMBER,
      title: index < 4 ? `Load Team Lead ${index + 1}` : `Load Operator ${index + 1}`,
    })),
  });

  const loadTestConversation = await prisma.conversation.create({
    data: {
      title: "Live Messaging Load Test",
      description: "High-traffic seeded channel for validating live chat behavior.",
      isChannel: true,
      organizationId: org.id,
      createdById: commander.id,
      participants: {
        create: [
          { userId: commander.id },
          ...loadTestUsers.map((user) => ({ userId: user.id })),
        ],
      },
    },
  });

  const loadTestMessages = Array.from({ length: 180 }, (_, index) => {
    const sender = loadTestUsers[index % loadTestUsers.length];
    const wave = Math.floor(index / loadTestUsers.length) + 1;

    return {
      conversationId: loadTestConversation.id,
      senderId: sender.id,
      body: `[Wave ${wave}] ${sender.starCitizenHandle}: systems check ${index + 1} complete.`,
    };
  });

  await prisma.message.createMany({
    data: loadTestMessages,
  });

  for (let i = 0; i < 10; i += 1) {
    const first = loadTestUsers[i * 2];
    const second = loadTestUsers[i * 2 + 1];

    const squadConversation = await prisma.conversation.create({
      data: {
        title: `Load Squad ${String(i + 1).padStart(2, "0")}`,
        description: "Seeded squad channel for multi-thread message testing.",
        organizationId: org.id,
        createdById: commander.id,
        participants: {
          create: [
            { userId: commander.id },
            { userId: first.id },
            { userId: second.id },
          ],
        },
      },
    });

    await prisma.message.createMany({
      data: [
        {
          conversationId: squadConversation.id,
          senderId: commander.id,
          body: `Load squad ${i + 1} check-in started.`,
        },
        {
          conversationId: squadConversation.id,
          senderId: first.id,
          body: `${first.starCitizenHandle} online and standing by.`,
        },
        {
          conversationId: squadConversation.id,
          senderId: second.id,
          body: `${second.starCitizenHandle} online and synced to voice.`,
        },
        {
          conversationId: squadConversation.id,
          senderId: commander.id,
          body: "Maintain live updates every five minutes.",
        },
      ],
    });
  }

  await prisma.alliance.create({
    data: {
      name: "UEE Fringe Defense Accord",
      description: "Tactical mutual-defense pact for system security operations.",
      createdById: commander.id,
      members: {
        create: [
          { organizationId: org.id },
          { organizationId: partnerOrg.id },
        ],
      },
    },
  });

  await prisma.coalition.create({
    data: {
      name: "Iron Convoy Shield",
      description: "Joint strike and logistics umbrella for dynamic event windows.",
      createdById: commander.id,
      commandNotes: "Aegis provides spearhead assault. Atlas handles extraction chain.",
      members: {
        create: [
          { organizationId: org.id, responsibility: "Assault and perimeter" },
          { organizationId: partnerOrg.id, responsibility: "Cargo and recovery" },
        ],
      },
    },
  });

  await prisma.ship.createMany({
    data: [
      {
        userId: commander.id,
        name: "Hammerhead",
        manufacturer: "Aegis",
        role: ShipRole.CORVETTE,
        size: ShipSize.LARGE,
        quantity: 1,
        status: AssetStatus.AVAILABLE,
      },
      {
        userId: pilot.id,
        name: "Gladius",
        manufacturer: "Aegis",
        role: ShipRole.FIGHTER,
        size: ShipSize.SMALL,
        quantity: 2,
        status: AssetStatus.AVAILABLE,
      },
      {
        userId: pilot.id,
        name: "Cutlass Black",
        manufacturer: "Drake",
        role: ShipRole.MULTI_ROLE,
        size: ShipSize.MEDIUM,
        quantity: 1,
        status: AssetStatus.AVAILABLE,
      },
      {
        userId: logistics.id,
        name: "C2 Hercules",
        manufacturer: "Crusader",
        role: ShipRole.CARGO,
        size: ShipSize.LARGE,
        quantity: 1,
        status: AssetStatus.AVAILABLE,
      },
      {
        userId: medic.id,
        name: "Cutlass Red",
        manufacturer: "Drake",
        role: ShipRole.MEDICAL,
        size: ShipSize.MEDIUM,
        quantity: 1,
        status: AssetStatus.AVAILABLE,
      },
    ],
  });

  await prisma.groundVehicle.createMany({
    data: [
      {
        userId: pilot.id,
        name: "Ursa Rover",
        manufacturer: "RSI",
        role: VehicleRole.TRANSPORT,
        size: VehicleSize.MEDIUM,
        quantity: 2,
        status: AssetStatus.AVAILABLE,
      },
      {
        userId: medic.id,
        name: "Cyclone RN",
        manufacturer: "Tumbril",
        role: VehicleRole.SUPPORT,
        size: VehicleSize.SMALL,
        quantity: 1,
        status: AssetStatus.AVAILABLE,
      },
      {
        userId: marine.id,
        name: "Ballista",
        manufacturer: "Anvil",
        role: VehicleRole.COMBAT,
        size: VehicleSize.LARGE,
        quantity: 1,
        status: AssetStatus.AVAILABLE,
      },
    ],
  });

  const operation = await prisma.operation.create({
    data: {
      title: "Operation Iron Lantern",
      type: OperationType.COMBINED_ARMS_ASSAULT,
      description: "Secure derelict outpost and extract strategic cargo.",
      objective: "Capture the outpost and hold until extraction is complete.",
      location: "Daymar - Nuen Waste Management",
      threatLevel: ThreatLevel.HIGH,
      status: OperationStatus.PLANNED,
      visibility: OrganizationVisibility.PUBLIC,
      commanderId: commander.id,
      organizationId: org.id,
      missionBrief: "Command element secures LZ, strike wing suppresses hostiles, logistics extracts cargo.",
      commsPlan: "Command channel + team channels Alpha/Beta/Medical.",
      rulesOfEngagement: "Engage confirmed hostiles threatening objective. Avoid non-combatant assets.",
      rallyPoints: "Rally A: Orbital marker. Rally B: Outpost south ridge.",
      extractionPlan: "C2 airlift once cargo secured.",
      contingencyPlans: "Fallback to Rally A if AA pressure exceeds threshold.",
      requiredSupplies: "Medpens, ammo, tractor beams, repair kits.",
      requiredShips: "2 escorts, 1 dropship, 1 cargo transport",
      requiredGroundVehicles: "1 medical rover, 1 logistics rover",
      requiredPersonnel: "20 operators",
      missionPhases: "Insertion > Secure perimeter > Cargo extraction > Defensive hold > Exit",
      participants: {
        create: [
          { userId: commander.id, organizationId: org.id, assignedRole: "Commander", team: "Command", status: RSVPStatus.GOING },
          { userId: pilot.id, organizationId: org.id, assignedRole: "Fighter pilot", team: "Air", status: RSVPStatus.GOING },
          { userId: medic.id, organizationId: org.id, assignedRole: "Medic", team: "Ground", status: RSVPStatus.MAYBE },
          { userId: recon.id, organizationId: org.id, assignedRole: "Recon", team: "Recon", status: RSVPStatus.GOING },
          { userId: logistics.id, organizationId: org.id, assignedRole: "Logistics", team: "Support", status: RSVPStatus.GOING },
          { userId: marine.id, organizationId: org.id, assignedRole: "Marine", team: "Strike", status: RSVPStatus.GOING },
        ],
      },
      assets: {
        create: [
          { ownerUserId: commander.id, ownerOrganizationId: org.id, assetType: AssetType.FLEET_SHIP, name: "Hammerhead", category: "Fleet ship", quantity: 1 },
          { ownerUserId: pilot.id, ownerOrganizationId: org.id, assetType: AssetType.FIGHTER, name: "Gladius", category: "Fighter", quantity: 2 },
          { ownerUserId: logistics.id, ownerOrganizationId: org.id, assetType: AssetType.CARGO_SHIP, name: "C2 Hercules", category: "Cargo", quantity: 1 },
          { ownerUserId: medic.id, ownerOrganizationId: org.id, assetType: AssetType.GROUND_VEHICLE, name: "Cyclone RN", category: "Ground vehicle", quantity: 1 },
        ],
      },
      rsvps: {
        create: [
          { userId: commander.id, status: RSVPStatus.GOING, note: "Confirmed command presence." },
          { userId: pilot.id, status: RSVPStatus.GOING, note: "Air escort ready." },
          { userId: medic.id, status: RSVPStatus.MAYBE, note: "Awaiting roster confirmation." },
          { userId: recon.id, status: RSVPStatus.GOING, note: "Long-range scan package ready." },
          { userId: logistics.id, status: RSVPStatus.GOING, note: "Cargo lanes staged." },
          { userId: marine.id, status: RSVPStatus.GOING, note: "Strike team loaded." },
        ],
      },
    },
  });

  const commandComment = await prisma.comment.create({
    data: {
      operationId: operation.id,
      userId: commander.id,
      body: "Briefing starts 30 minutes before launch.",
    },
  });

  const pilotComment = await prisma.comment.create({
    data: {
      operationId: operation.id,
      userId: pilot.id,
      body: "Requesting one additional fighter escort if available.",
    },
  });

  await prisma.commentReaction.createMany({
    data: [
      { commentId: commandComment.id, userId: pilot.id, emoji: "🫡" },
      { commentId: commandComment.id, userId: marine.id, emoji: "✅" },
      { commentId: pilotComment.id, userId: commander.id, emoji: "🔥" },
    ],
  });

  await prisma.afterActionReport.create({
    data: {
      operationId: operation.id,
      authorId: commander.id,
      summary: "Dry-run operation completed with high readiness and clean extraction.",
      whatWentWell: "Command clarity and role discipline across all teams.",
      whatWentWrong: "Delayed medivac lane handoff by 4 minutes.",
      lessonsLearned: "Pre-assign backup escort for medivac convoy.",
      recommendations: "Lock mission-phase acknowledgements before launch.",
    },
  });

  await prisma.activityFeedItem.createMany({
    data: [
      {
        type: "organization_bulletin",
        title: "Iron Lantern Warmup Complete",
        body: "All wings passed readiness checks. Final launch call at 20:00 UTC.",
        organizationId: org.id,
        userId: commander.id,
        operationId: operation.id,
      },
      {
        type: "organization_member_joined",
        title: "Titan Breach joined Aegis Vanguard",
        body: "Strike marine assignment confirmed.",
        organizationId: org.id,
        userId: marine.id,
      },
    ],
  });

  await prisma.userFollow.createMany({
    data: [
      { followerId: commander.id, followingId: pilot.id },
      { followerId: commander.id, followingId: recon.id },
      { followerId: pilot.id, followingId: commander.id },
      { followerId: medic.id, followingId: commander.id },
      { followerId: logistics.id, followingId: commander.id },
      { followerId: marine.id, followingId: commander.id },
    ],
  });

  const commandNet = await prisma.conversation.create({
    data: {
      title: "Aegis Command Net",
      organizationId: org.id,
      createdById: commander.id,
      participants: {
        create: [
          { userId: commander.id },
          { userId: pilot.id },
          { userId: medic.id },
          { userId: recon.id },
          { userId: logistics.id },
          { userId: marine.id },
        ],
      },
    },
  });

  const msg1 = await prisma.message.create({
    data: {
      conversationId: commandNet.id,
      senderId: commander.id,
      body: "Command net online. Post readiness checks every 10 minutes.",
    },
  });

  const msg2 = await prisma.message.create({
    data: {
      conversationId: commandNet.id,
      senderId: pilot.id,
      body: "Air wing green. Escort slots Alpha and Bravo are fueled.",
    },
  });

  await prisma.message.create({
    data: {
      conversationId: commandNet.id,
      senderId: logistics.id,
      body: "Cargo train staged. Spare med supplies loaded for pickup.",
    },
  });

  await prisma.messageReaction.createMany({
    data: [
      { messageId: msg1.id, userId: pilot.id, emoji: "🫡" },
      { messageId: msg1.id, userId: marine.id, emoji: "✅" },
      { messageId: msg2.id, userId: commander.id, emoji: "🔥" },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: commander.id,
        type: NotificationType.AI_PLAN_GENERATED,
        title: "AI brief generated",
        body: "A new AI plan draft is ready for Operation Iron Lantern.",
        link: `/operations/${operation.id}`,
      },
      {
        userId: pilot.id,
        type: NotificationType.OP_ASSIGNMENT,
        title: "Assigned to operation",
        body: "You are assigned as Fighter Pilot for Operation Iron Lantern.",
        link: `/operations/${operation.id}`,
      },
      {
        userId: medic.id,
        type: NotificationType.OP_UPDATE,
        title: "Operation updated",
        body: "Medical extraction sequence changed in operation timeline.",
        link: `/operations/${operation.id}`,
      },
      {
        userId: commander.id,
        type: NotificationType.SYSTEM,
        title: "Social channels active",
        body: "Aegis Command Net is ready for live testing.",
        link: "/social",
      },
    ],
  });

  console.info("Seeded load test messaging users: 30");
  console.info("Load test login pattern: loadtest+01@starcitizenops.local to loadtest+30@starcitizenops.local");
  console.info("Load test password: password123");
}

// Seed mission categories and templates
async function seedMissions() {
  // Delete existing data
  await prisma.missionTemplate.deleteMany();
  await prisma.missionCategory.deleteMany();

  // Combat Operations
  const combatOps = await prisma.missionCategory.create({
    data: {
      name: "Combat Operations",
      slug: "combat-operations",
      description: "Offensive, defensive, and security-focused operations involving ship combat, FPS combat, or combined arms engagements.",
      icon: "⚔️",
    },
  });

  await prisma.missionTemplate.createMany({
    data: [
      {
        categoryId: combatOps.id,
        name: "Bounty Hunt",
        slug: "bounty-hunt",
        summary: "Locate and eliminate a high-value target",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "1h",
        recommendedPlayersMin: 2,
        recommendedPlayersMax: 6,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["Leader", "Combat pilot", "Scanner operator"],
        optionalRoles: ["Medic", "Ground support"],
        requiredAssets: ["Fighter ships"],
        optionalAssets: ["Scanning ship"],
        objectives: ["Locate target", "Close to engagement range", "Eliminate target", "Secure drop pod/corpse if applicable"],
        preparationChecklist: ["Confirm target location", "Load combat loadout", "Fuel check", "Comms check"],
        executionSteps: ["Scan designated sector", "Identify target", "Engage and eliminate", "Confirm elimination"],
        successConditions: ["Target eliminated", "Team survives"],
        failureConditions: ["Target escapes", "Friendly casualties exceed 50%"],
        risks: ["Escort response", "Friendly fire", "Server lag"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["combat", "pvp", "solo-friendly"],
        aiPromptSeed:
          "Generate a Star Citizen bounty hunt operation. Include target profile, engagement tactics, escape routes, and contingency plans.",
      },
      {
        categoryId: combatOps.id,
        name: "Combat Assistance Beacon",
        slug: "combat-assistance-beacon",
        summary: "Respond to a player distress beacon and provide combat support",
        difficulty: MissionDifficulty.HARD,
        estimatedDuration: "30m to 2h",
        recommendedPlayersMin: 3,
        recommendedPlayersMax: 12,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 2,
        requiredRoles: ["Combat pilot", "Leader", "Support"],
        optionalRoles: ["Medic", "Recon"],
        requiredAssets: ["Fighters", "Support ships"],
        optionalAssets: [],
        objectives: ["Locate distress beacon", "Assess threat", "Engage hostiles", "Extract ally"],
        preparationChecklist: ["Comms check", "Weapons loaded", "Medical supplies", "Escape route planned"],
        executionSteps: ["Jump to beacon", "Scan for friendlies", "Engage threats", "Extract and extract"],
        successConditions: ["Ally extracted safely", "Threats neutralized"],
        failureConditions: ["Ally lost", "Team wipe"],
        risks: ["Multiple hostile contacts", "Ambush", "Low fuel"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["combat", "rescue", "pvp"],
        aiPromptSeed:
          "Generate a Star Citizen combat assistance beacon response. Include threat assessment, tactics, and extraction plan.",
      },
      {
        categoryId: combatOps.id,
        name: "Mercenary Contract",
        slug: "mercenary-contract",
        summary: "Complete a paid combat contract for an NPC faction",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "1h to 3h",
        recommendedPlayersMin: 2,
        recommendedPlayersMax: 20,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 3,
        requiredRoles: ["Combat pilot", "Leader", "Logistics"],
        optionalRoles: ["Medic", "Intelligence"],
        requiredAssets: ["Combat ships"],
        optionalAssets: ["Support ships"],
        objectives: ["Accept contract", "Locate target", "Eliminate target", "Extract or defend"],
        preparationChecklist: ["Contract details reviewed", "Loadout confirmed", "Fuel/ammo checked", "Team briefed"],
        executionSteps: ["Brief team on objectives", "Traverse to location", "Engage targets", "Extract"],
        successConditions: ["Objective complete", "Majority survive"],
        failureConditions: ["Objective failed", "Heavy casualties"],
        risks: ["Counter-mercenaries", "Faction retaliation"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["combat", "mercenary", "group"],
        aiPromptSeed:
          "Generate a Star Citizen mercenary contract. Include target profile, opposition strength, extraction strategy, and payment terms.",
      },
      {
        categoryId: combatOps.id,
        name: "Bunker Assault",
        slug: "bunker-assault",
        summary: "Storm and clear a hostile bunker",
        difficulty: MissionDifficulty.HARD,
        estimatedDuration: "1h to 2h",
        recommendedPlayersMin: 4,
        recommendedPlayersMax: 12,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 2,
        requiredRoles: ["Ground commander", "Squad lead", "Rifleman", "Support"],
        optionalRoles: ["Medic", "Specialist"],
        requiredAssets: ["Ground vehicles", "Armor", "Weapons"],
        optionalAssets: ["Air support", "Logistics"],
        objectives: ["Establish perimeter", "Clear bunker sections", "Eliminate hostiles", "Secure objective"],
        preparationChecklist: ["Armor equipped", "Ammo loaded", "Medical supplied", "Comms functional", "Infiltration route planned"],
        executionSteps: ["Deploy to bunker", "Clear room by room", "Secure sensitive areas", "Hold and defend"],
        successConditions: ["Bunker cleared", "Objective secured", "Team survives"],
        failureConditions: ["Bunker retaken", "Retreat forced", "Objective lost"],
        risks: ["Ambush", "Reinforcements", "Close quarters combat"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.LOOT, MissionRewardType.ORG_READINESS],
        tags: ["ground-combat", "fps", "team-based"],
        aiPromptSeed:
          "Generate a Star Citizen bunker assault operation. Include entry routes, room-clearing tactics, defensive positions, and extraction.",
      },
      {
        categoryId: combatOps.id,
        name: "Outpost Assault",
        slug: "outpost-assault",
        summary: "Assault and capture a hostile outpost",
        difficulty: MissionDifficulty.EXTREME,
        estimatedDuration: "2h to 4h",
        recommendedPlayersMin: 8,
        recommendedPlayersMax: 30,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 5,
        requiredRoles: ["Commander", "Pilot", "Ground lead", "Squad member"],
        optionalRoles: ["Medic", "Engineer", "Support"],
        requiredAssets: ["Combat ships", "Dropships", "Ground vehicles", "Infantry squads"],
        optionalAssets: ["Air support", "Logistics", "Heavy armor"],
        objectives: ["Suppress air defense", "Insert ground team", "Clear objectives", "Establish control", "Hold and defend"],
        preparationChecklist: ["Intel confirmed", "Loadouts optimized", "Medical ready", "Fuel checked", "Fallback route ready"],
        executionSteps: ["Launch air strike", "Insert ground team", "Clear bunkers", "Establish defensive position"],
        successConditions: ["Outpost captured", "Command post secure", "Majority survive"],
        failureConditions: ["Ground team wiped", "Air element destroyed", "Objective retaken"],
        risks: ["Heavy opposition", "Reinforcements", "Anti-air defense"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION, MissionRewardType.LOOT],
        tags: ["large-scale", "combined-arms", "challenging"],
        aiPromptSeed:
          "Generate a Star Citizen outpost assault. Include air strike plan, insertion tactics, objective priorities, and defensive strategy.",
      },
    ],
  });

  // Fleet Operations
  const fleetOps = await prisma.missionCategory.create({
    data: {
      name: "Fleet Operations",
      slug: "fleet-operations",
      description:
        "Multi-ship coordinated operations involving patrols, escorts, interdiction, capital ship support, carrier-style coordination, and fleet command.",
      icon: "🚀",
    },
  });

  await prisma.missionTemplate.createMany({
    data: [
      {
        categoryId: fleetOps.id,
        name: "Fleet Patrol",
        slug: "fleet-patrol",
        summary: "Conduct a coordinated multi-ship patrol mission",
        difficulty: MissionDifficulty.EASY,
        estimatedDuration: "1h to 2h",
        recommendedPlayersMin: 3,
        recommendedPlayersMax: 12,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 2,
        requiredRoles: ["Fleet lead", "Pilot", "Scanner operator"],
        optionalRoles: ["Medic", "Engineer"],
        requiredAssets: ["Patrol ships", "Multi-role ships"],
        optionalAssets: ["Support ship"],
        objectives: ["Patrol sector", "Scan for anomalies", "Report contacts", "Respond to threats"],
        preparationChecklist: ["Fleet formation confirmed", "Comms check", "Fuel verified", "Patrol route briefed"],
        executionSteps: ["Form up", "Begin patrol", "Scan regularly", "Report findings"],
        successConditions: ["Patrol complete", "No losses", "All intel reported"],
        failureConditions: ["Fleet scattered", "Major contact fought"],
        risks: ["Pirate contact", "Server lag"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["multi-ship", "patrol", "beginner"],
        aiPromptSeed: "Generate a Star Citizen fleet patrol. Include patrol sector, formation tactics, scanning procedures, and threat response.",
      },
      {
        categoryId: fleetOps.id,
        name: "Multi-Ship Escort",
        slug: "multi-ship-escort",
        summary: "Escort a high-value target through hostile space",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "1h to 2h",
        recommendedPlayersMin: 4,
        recommendedPlayersMax: 12,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 2,
        requiredRoles: ["Escort lead", "Combat pilot", "Target pilot"],
        optionalRoles: ["Medic", "Support"],
        requiredAssets: ["Fighters", "Cargo ship or VIP transport"],
        optionalAssets: ["Support ship"],
        objectives: ["Protect target", "Maintain formation", "Respond to threats", "Reach destination"],
        preparationChecklist: ["Route briefed", "Threat assessment done", "Comms functional"],
        executionSteps: ["Form up", "Jump to route", "Maintain screen", "Defend if attacked"],
        successConditions: ["Target safe", "Destination reached"],
        failureConditions: ["Target destroyed", "Escort lost"],
        risks: ["Pirate interdict", "Formation breakup"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["escort", "protection", "team-based"],
        aiPromptSeed:
          "Generate a Star Citizen multi-ship escort. Include route intel, threat level, escort screen formation, and contingency plans.",
      },
      {
        categoryId: fleetOps.id,
        name: "Carrier Group Operation",
        slug: "carrier-group-operation",
        summary: "Execute a large-scale carrier group deployment",
        difficulty: MissionDifficulty.EXTREME,
        estimatedDuration: "3h to 5h",
        recommendedPlayersMin: 15,
        recommendedPlayersMax: 50,
        recommendedOrganizationsMin: 2,
        recommendedOrganizationsMax: 5,
        requiredRoles: ["Fleet commander", "Carrier captain", "Air boss", "Pilot", "Logistics"],
        optionalRoles: ["Medic", "Engineer", "Intelligence"],
        requiredAssets: ["Capital ship", "Fighter wing", "Support ships", "Logistics"],
        optionalAssets: ["Air defense", "Electronic warfare"],
        objectives: ["Launch air ops", "Maintain formation", "Respond to threats", "Complete mission", "Recover aircraft"],
        preparationChecklist: ["Carrier prepped", "Aircraft ready", "Pilots briefed", "Logistics ready", "Comms verified"],
        executionSteps: ["Launch air wing", "Patrol sector", "Respond to contacts", "Recover aircraft"],
        successConditions: ["Objectives complete", "Most aircraft recovered", "Carrier safe"],
        failureConditions: ["Carrier hit", "Air wing wiped", "Mission failed"],
        risks: ["Major combat", "Server stability", "Coordination issues"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.ORG_READINESS],
        tags: ["large-scale", "capital-ships", "challenging"],
        aiPromptSeed:
          "Generate a Star Citizen carrier group deployment. Include air operations orders, flight patterns, threat response, and recovery procedures.",
      },
    ],
  });

  // Ground Operations
  const groundOps = await prisma.missionCategory.create({
    data: {
      name: "Ground Operations",
      slug: "ground-operations",
      description: "FPS, vehicle, bunker, outpost, cave, and planetary surface operations.",
      icon: "🎯",
    },
  });

  await prisma.missionTemplate.createMany({
    data: [
      {
        categoryId: groundOps.id,
        name: "Bunker Clear",
        slug: "bunker-clear",
        summary: "Clear a bunker of all hostiles",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "1h to 1.5h",
        recommendedPlayersMin: 3,
        recommendedPlayersMax: 8,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["Squad lead", "Rifleman"],
        optionalRoles: ["Medic", "Heavy support"],
        requiredAssets: ["Armor", "Weapons", "Medical supplies"],
        optionalAssets: ["Grenades", "Explosives"],
        objectives: ["Enter bunker", "Clear sections", "Eliminate all hostiles", "Secure"],
        preparationChecklist: ["Armor equipped", "Weapons loaded", "Medical checked"],
        executionSteps: ["Stack at entrance", "Clear room by room", "Check for survivors"],
        successConditions: ["All hostiles eliminated", "Bunker secure"],
        failureConditions: ["Squad wiped", "Objective lost"],
        risks: ["Ambush", "Grenades", "Group tactics"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.TRAINING],
        tags: ["ground-combat", "fps", "indoor"],
        aiPromptSeed:
          "Generate a Star Citizen bunker clear operation. Include room-by-room tactics, estimated enemy strength, and extraction.",
      },
      {
        categoryId: groundOps.id,
        name: "Cave Sweep",
        slug: "cave-sweep",
        summary: "Explore and clear a cave system",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "1h to 2h",
        recommendedPlayersMin: 3,
        recommendedPlayersMax: 8,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["Scout", "Rifleman", "Navigator"],
        optionalRoles: ["Medic"],
        requiredAssets: ["Armor", "Weapons", "Lights", "Mapping gear"],
        optionalAssets: ["Explosives"],
        objectives: ["Enter cave", "Map passages", "Neutralize threats", "Search for objectives"],
        preparationChecklist: ["Lights working", "Weapons ready", "Comms functional"],
        executionSteps: ["Enter cave", "Scout ahead", "Engage threats", "Map and search"],
        successConditions: ["Cave cleared", "Objectives found"],
        failureConditions: ["Squad wiped", "Lost in cave"],
        risks: ["Multiple hostiles", "Get lost", "Ambush"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.RESOURCES],
        tags: ["exploration", "ground-combat", "caves"],
        aiPromptSeed: "Generate a Star Citizen cave sweep. Include cave layout, expected contacts, and resource locations.",
      },
    ],
  });

  // Cargo and Logistics
  const cargoOps = await prisma.missionCategory.create({
    data: {
      name: "Cargo and Logistics",
      slug: "cargo-and-logistics",
      description: "Freight movement, convoy planning, supply runs, hauling contracts, loading operations, and logistics support.",
      icon: "📦",
    },
  });

  await prisma.missionTemplate.createMany({
    data: [
      {
        categoryId: cargoOps.id,
        name: "Cargo Hauling Contract",
        slug: "cargo-hauling-contract",
        summary: "Complete a commercial cargo hauling contract",
        difficulty: MissionDifficulty.EASY,
        estimatedDuration: "1h to 2h",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 4,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 2,
        requiredRoles: ["Pilot"],
        optionalRoles: ["Logistics support"],
        requiredAssets: ["Cargo ship"],
        optionalAssets: ["Escort ship"],
        objectives: ["Load cargo", "Travel to destination", "Unload cargo", "Confirm delivery"],
        preparationChecklist: ["Cargo secured", "Route planned", "Fuel checked"],
        executionSteps: ["Load at origin", "Jump to destination", "Unload"],
        successConditions: ["Cargo delivered", "No losses"],
        failureConditions: ["Cargo destroyed", "Ship lost"],
        risks: ["Pirates", "Server lag", "Fuel"],
        rewardTypes: [MissionRewardType.aUEC],
        tags: ["trading", "solo-friendly", "beginner"],
        aiPromptSeed:
          "Generate a Star Citizen cargo hauling contract. Include cargo type, route, estimated time, and potential hazards.",
      },
      {
        categoryId: cargoOps.id,
        name: "Trade Route Run",
        slug: "trade-route-run",
        summary: "Execute a multi-stop trading route",
        difficulty: MissionDifficulty.EASY,
        estimatedDuration: "2h to 3h",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 3,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["Trader", "Pilot"],
        optionalRoles: ["Navigator"],
        requiredAssets: ["Cargo ship"],
        optionalAssets: [],
        objectives: ["Pick up commodity", "Deliver", "Repeat", "Profit"],
        preparationChecklist: ["Market researched", "Capital available", "Route safe"],
        executionSteps: ["Buy commodity", "Jump to next location", "Sell", "Repeat"],
        successConditions: ["Profit made", "Route completed"],
        failureConditions: ["Prices inverted", "Market crashed"],
        risks: ["Market volatility", "Long haul"],
        rewardTypes: [MissionRewardType.aUEC],
        tags: ["trading", "solo", "lucrative"],
        aiPromptSeed:
          "Generate a Star Citizen trade route. Include profitable commodity chains, best routes, timing considerations, and risks.",
      },
      {
        categoryId: cargoOps.id,
        name: "Convoy Supply Operation",
        slug: "convoy-supply-operation",
        summary: "Lead a multi-ship cargo convoy to supply an outpost",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "1.5h to 2.5h",
        recommendedPlayersMin: 4,
        recommendedPlayersMax: 12,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 2,
        requiredRoles: ["Convoy lead", "Cargo pilot", "Escort", "Logistics"],
        optionalRoles: ["Medic"],
        requiredAssets: ["Cargo ships", "Escort fighters"],
        optionalAssets: ["Supply ship"],
        objectives: ["Assemble convoy", "Travel to outpost", "Deliver supplies", "Return"],
        preparationChecklist: ["Cargo manifest verified", "Escorts assigned", "Route briefed", "Comms functional"],
        executionSteps: ["Rally convoy", "Form up", "Jump to destination", "Deliver supplies"],
        successConditions: ["Supplies delivered", "Convoy intact"],
        failureConditions: ["Cargo lost", "Convoy scattered"],
        risks: ["Pirates", "Formation issues"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["logistics", "group", "supply"],
        aiPromptSeed:
          "Generate a Star Citizen supply convoy. Include supply manifest, ideal convoy composition, threat assessment, and delivery timeline.",
      },
    ],
  });

  // Mining Operations
  const miningOps = await prisma.missionCategory.create({
    data: {
      name: "Mining Operations",
      slug: "mining-operations",
      description: "Resource scouting, hand mining, ROC mining, ship mining, refinery logistics, and mining security.",
      icon: "⛏️",
    },
  });

  await prisma.missionTemplate.createMany({
    data: [
      {
        categoryId: miningOps.id,
        name: "Hand Mining Run",
        slug: "hand-mining-run",
        summary: "Conduct individual hand mining operations",
        difficulty: MissionDifficulty.EASY,
        estimatedDuration: "1h to 2h",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 3,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["Miner"],
        optionalRoles: ["Support"],
        requiredAssets: ["EVA suit", "Mining tool"],
        optionalAssets: ["Scanner"],
        objectives: ["Travel to mining site", "Find asteroids", "Mine rocks", "Collect ore"],
        preparationChecklist: ["EVA suit ready", "Mining tool charged", "Oxygen filled"],
        executionSteps: ["Fly to location", "Locate rocks", "Mine", "Collect"],
        successConditions: ["Ore collected", "Return safely"],
        failureConditions: ["Lost in space", "Tool failure"],
        risks: ["Oxygen depletion", "Radiation"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.RESOURCES],
        tags: ["mining", "solo", "peaceful"],
        aiPromptSeed:
          "Generate a Star Citizen hand mining operation. Include optimal mining sites, asteroid types, yield estimates, and safety procedures.",
      },
      {
        categoryId: miningOps.id,
        name: "ROC Mining Expedition",
        slug: "roc-mining-expedition",
        summary: "Deploy ground vehicle for surface mining",
        difficulty: MissionDifficulty.EASY,
        estimatedDuration: "1h to 1.5h",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 2,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["ROC operator"],
        optionalRoles: ["Driver"],
        requiredAssets: ["ROC", "Ore storage"],
        optionalAssets: ["Support vehicle"],
        objectives: ["Deploy to mining site", "Locate deposits", "Extract ore", "Return"],
        preparationChecklist: ["ROC fueled", "Drills ready"],
        executionSteps: ["Deploy ROC", "Scout area", "Drill rocks", "Return to ship"],
        successConditions: ["Ore collected", "ROC returned"],
        failureConditions: ["ROC damaged", "Crew stranded"],
        risks: ["Terrain", "Hazards", "Mechanical failure"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.RESOURCES],
        tags: ["mining", "vehicles", "surface"],
        aiPromptSeed:
          "Generate a Star Citizen ROC mining expedition. Include terrain assessment, best mining locations, yield, and time estimates.",
      },
      {
        categoryId: miningOps.id,
        name: "Prospector Mining Run",
        slug: "prospector-mining-run",
        summary: "Operate a Prospector for ship-based asteroid mining",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "1.5h to 2h",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 2,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["Prospector pilot"],
        optionalRoles: ["Turret operator"],
        requiredAssets: ["Prospector", "Cargo hold"],
        optionalAssets: ["Storage container"],
        objectives: ["Fly to asteroid field", "Scan rocks", "Mine high-yield asteroids", "Return"],
        preparationChecklist: ["Prospector fueled", "Cargo clear", "Scanner ready"],
        executionSteps: ["Jump to field", "Scan asteroids", "Target best rocks", "Mine"],
        successConditions: ["Cargo full", "Return safe"],
        failureConditions: ["Prospector destroyed", "Empty cargo"],
        risks: ["Asteroid collision", "Tractor malfunction"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.RESOURCES],
        tags: ["mining", "ships", "industrial"],
        aiPromptSeed:
          "Generate a Star Citizen Prospector mining run. Include asteroid field locations, scan procedures, best yield nodes, and safety tips.",
      },
      {
        categoryId: miningOps.id,
        name: "Mole Mining Crew Operation",
        slug: "mole-mining-crew-operation",
        summary: "Operate a Mole with full crew for maximum efficiency",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "2h to 3h",
        recommendedPlayersMin: 3,
        recommendedPlayersMax: 5,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["Pilot", "Turret 1 operator", "Turret 2 operator"],
        optionalRoles: ["Engineer"],
        requiredAssets: ["Mole mining ship"],
        optionalAssets: ["Support escort"],
        objectives: ["Travel to field", "Mine asteroids", "Manage turrets", "Fill cargo", "Return"],
        preparationChecklist: ["Mole prepped", "Crew briefed", "Cargo clear"],
        executionSteps: ["Form crew", "Jump to field", "Begin mining operations", "Coordinate turrets"],
        successConditions: ["Cargo full", "All return safe"],
        failureConditions: ["Mole destroyed", "Crew loss"],
        risks: ["Pirate attack", "Equipment failure"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.RESOURCES, MissionRewardType.ORG_READINESS],
        tags: ["mining", "group", "industrial", "teamwork"],
        aiPromptSeed:
          "Generate a Star Citizen Mole mining operation. Include crew assignments, mining site selection, turret coordination, and output projections.",
      },
    ],
  });

  // Salvage Operations
  const salvageOps = await prisma.missionCategory.create({
    data: {
      name: "Salvage Operations",
      slug: "salvage-operations",
      description: "Wreck discovery, hull scraping, component recovery, salvage security, cargo recovery, and cleanup operations.",
      icon: "♻️",
    },
  });

  await prisma.missionTemplate.createMany({
    data: [
      {
        categoryId: salvageOps.id,
        name: "Solo Salvage Run",
        slug: "solo-salvage-run",
        summary: "Solo salvage wreckage for components and materials",
        difficulty: MissionDifficulty.EASY,
        estimatedDuration: "1h to 1.5h",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 1,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["Salvager"],
        optionalRoles: [],
        requiredAssets: ["Small salvage ship", "Tool kit"],
        optionalAssets: [],
        objectives: ["Locate wreck", "Extract components", "Collect materials", "Sell or store"],
        preparationChecklist: ["Wreck location known", "Tools ready", "Cargo space available"],
        executionSteps: ["Travel to wreck", "Survey", "Salvage components"],
        successConditions: ["Components collected", "Return safe"],
        failureConditions: ["Wreck empty", "Lost"],
        risks: ["Environmental hazards", "Hostile contacts"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.RESOURCES],
        tags: ["salvage", "solo", "scavenging"],
        aiPromptSeed:
          "Generate a Star Citizen solo salvage mission. Include wreck locations, component types, estimated value, and hazards.",
      },
      {
        categoryId: salvageOps.id,
        name: "Multi-Crew Reclaimer Operation",
        slug: "multi-crew-reclaimer-operation",
        summary: "Operate a Reclaimer with full crew for large-scale salvage",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "2h to 3h",
        recommendedPlayersMin: 3,
        recommendedPlayersMax: 8,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 2,
        requiredRoles: ["Pilot", "Salvage operator", "Security"],
        optionalRoles: ["Engineer", "Scanner operator"],
        requiredAssets: ["Reclaimer ship"],
        optionalAssets: ["Escort ship", "Tug"],
        objectives: ["Locate large wreck", "Salvage hull", "Extract components", "Transport cargo"],
        preparationChecklist: ["Reclaimer fueled", "Crew assigned", "Salvage plan ready"],
        executionSteps: ["Navigate to wreck", "Begin salvage operations", "Load cargo", "Return"],
        successConditions: ["Cargo full", "Team intact"],
        failureConditions: ["Ship unable to move", "Major components lost"],
        risks: ["Radiation", "Structural collapse", "Salvage tool failure"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.RESOURCES, MissionRewardType.ORG_READINESS],
        tags: ["salvage", "group", "industrial"],
        aiPromptSeed:
          "Generate a Star Citizen Reclaimer salvage operation. Include wreck assessment, salvage sequence, safety protocols, and profit estimates.",
      },
      {
        categoryId: salvageOps.id,
        name: "Wreck Recovery",
        slug: "wreck-recovery",
        summary: "Recover and transport a damaged ship or large structure",
        difficulty: MissionDifficulty.HARD,
        estimatedDuration: "2h to 3h",
        recommendedPlayersMin: 2,
        recommendedPlayersMax: 6,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 2,
        requiredRoles: ["Pilot", "Tug operator"],
        optionalRoles: ["Engineer", "Support"],
        requiredAssets: ["Tug or Caterpillar", "Tractor beam"],
        optionalAssets: ["Escort"],
        objectives: ["Locate wreck", "Assess damage", "Secure tractor beam", "Transport to destination"],
        preparationChecklist: ["Wreck location confirmed", "Salvage path planned"],
        executionSteps: ["Travel to wreck", "Engage tractor beam", "Navigate carefully", "Deliver safely"],
        successConditions: ["Wreck delivered", "Minimal damage"],
        failureConditions: ["Wreck lost", "Tug damaged"],
        risks: ["Equipment strain", "Environmental", "Navigation hazards"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["salvage", "recovery", "teamwork"],
        aiPromptSeed:
          "Generate a Star Citizen wreck recovery operation. Include wreck type, condition, best transport route, and special handling requirements.",
      },
    ],
  });

  // Medical and Rescue
  const medicalOps = await prisma.missionCategory.create({
    data: {
      name: "Medical and Rescue",
      slug: "medical-and-rescue",
      description: "Rescue beacons, battlefield medicine, casualty evacuation, emergency recovery, search and rescue, and hospital ship support.",
      icon: "🏥",
    },
  });

  await prisma.missionTemplate.createMany({
    data: [
      {
        categoryId: medicalOps.id,
        name: "Medical Beacon Response",
        slug: "medical-beacon-response",
        summary: "Respond to a distress beacon and provide medical aid",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "1h to 2h",
        recommendedPlayersMin: 2,
        recommendedPlayersMax: 6,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 2,
        requiredRoles: ["Medical officer", "Pilot"],
        optionalRoles: ["Security", "Engineer"],
        requiredAssets: ["Medical ship", "Medical supplies"],
        optionalAssets: ["Escort"],
        objectives: ["Locate beacon", "Assess patient condition", "Administer care", "Transport to hospital"],
        preparationChecklist: ["Medical supplies stocked", "Ship prepped", "Comms ready"],
        executionSteps: ["Jump to beacon", "Provide initial care", "Transport"],
        successConditions: ["Patient saved", "Hospital reached"],
        failureConditions: ["Patient expired", "Ship lost"],
        risks: ["Environmental hazards", "Complications"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["rescue", "medical", "pvp-friendly"],
        aiPromptSeed:
          "Generate a Star Citizen medical rescue beacon response. Include patient profile, medical needs, transport route, and hospital destination.",
      },
      {
        categoryId: medicalOps.id,
        name: "Search and Rescue",
        slug: "search-and-rescue",
        summary: "Search for survivors and conduct rescue operations",
        difficulty: MissionDifficulty.HARD,
        estimatedDuration: "1.5h to 3h",
        recommendedPlayersMin: 3,
        recommendedPlayersMax: 10,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 2,
        requiredRoles: ["Search coordinator", "Pilot", "Medical"],
        optionalRoles: ["Security", "Scanner"],
        requiredAssets: ["Search and rescue ship", "Helicopters or shuttles"],
        optionalAssets: ["Escort", "Support"],
        objectives: ["Search scene", "Locate survivors", "Extract", "Transport to safety"],
        preparationChecklist: ["Search area mapped", "Medical ready", "Extraction plan ready"],
        executionSteps: ["Begin search", "Locate survivors", "Extract carefully"],
        successConditions: ["Survivors rescued", "All safety returned"],
        failureConditions: ["Survivors not found", "Rescue team loss"],
        risks: ["Hazardous terrain", "Environmental conditions", "Complications"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["rescue", "search", "challenging"],
        aiPromptSeed:
          "Generate a Star Citizen search and rescue operation. Include incident type, survivor count, location hazards, and extraction strategy.",
      },
      {
        categoryId: medicalOps.id,
        name: "Combat Medic Support",
        slug: "combat-medic-support",
        summary: "Provide medical support during combat operations",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "1h to 2h",
        recommendedPlayersMin: 4,
        recommendedPlayersMax: 12,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 2,
        requiredRoles: ["Combat medic", "Front-line combatant", "Logistics"],
        optionalRoles: ["Commander"],
        requiredAssets: ["Medical supplies", "Combat gear"],
        optionalAssets: ["Medical vehicle"],
        objectives: ["Establish medical post", "Treat casualties", "Support combat operations"],
        preparationChecklist: ["Medical supplies loaded", "Communication confirmed", "Team briefed"],
        executionSteps: ["Deploy medics", "Set up stations", "Treat and evacuate"],
        successConditions: ["Mission complete", "Casualties minimized"],
        failureConditions: ["Medic lost", "Objectives failed"],
        risks: ["Incoming fire", "Multiple simultaneous casualties"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.TRAINING, MissionRewardType.ORG_READINESS],
        tags: ["medical", "combat", "teamwork"],
        aiPromptSeed:
          "Generate a Star Citizen combat medic operation. Include medical capabilities needed, casualty projections, and treatment priorities.",
      },
    ],
  });

  // Exploration and Recon
  const explorationOps = await prisma.missionCategory.create({
    data: {
      name: "Exploration and Recon",
      slug: "exploration-and-recon",
      description: "Scouting, survey flights, route discovery, jump point support, stealth reconnaissance, and location verification.",
      icon: "🔭",
    },
  });

  await prisma.missionTemplate.createMany({
    data: [
      {
        categoryId: explorationOps.id,
        name: "Planetary Survey",
        slug: "planetary-survey",
        summary: "Survey a planet for resources and points of interest",
        difficulty: MissionDifficulty.EASY,
        estimatedDuration: "1h to 2h",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 4,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["Scout", "Pilot"],
        optionalRoles: ["Scientist"],
        requiredAssets: ["Scout ship", "Scanning equipment"],
        optionalAssets: [],
        objectives: ["Reach planet", "Survey surface", "Map resources", "Log findings"],
        preparationChecklist: ["Scanners working", "Map prepared"],
        executionSteps: ["Fly to planet", "Begin survey", "Log findings"],
        successConditions: ["Survey complete", "Data collected"],
        failureConditions: ["Survey incomplete"],
        risks: ["Atmospheric hazards", "Navigation errors"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["exploration", "survey", "peaceful"],
        aiPromptSeed:
          "Generate a Star Citizen planetary survey. Include planet characteristics, resource types, notable locations, and survey route.",
      },
      {
        categoryId: explorationOps.id,
        name: "Route Scouting",
        slug: "route-scouting",
        summary: "Scout and verify a new trade or travel route",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "1h to 2h",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 3,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["Navigator", "Pilot"],
        optionalRoles: ["Scout"],
        requiredAssets: ["Scout ship", "Navigation equipment"],
        optionalAssets: [],
        objectives: ["Travel proposed route", "Document hazards", "Verify jump points", "Report findings"],
        preparationChecklist: ["Route planned", "Equipment ready"],
        executionSteps: ["Follow route planned", "Document details", "Verify safety"],
        successConditions: ["Route verified", "Data collated"],
        failureConditions: ["Route blocked", "Data incomplete"],
        risks: ["Hazards", "Pirates", "Navigation error"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["exploration", "routes", "trading"],
        aiPromptSeed:
          "Generate a Star Citizen route scouting mission. Include route nodes, expected travel time, hazards, and profitability assessment.",
      },
      {
        categoryId: explorationOps.id,
        name: "Stealth Reconnaissance",
        slug: "stealth-reconnaissance",
        summary: "Conduct covert reconnaissance without being detected",
        difficulty: MissionDifficulty.HARD,
        estimatedDuration: "1.5h to 2.5h",
        recommendedPlayersMin: 1,
        recommendedPlayersMax: 4,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["Recon operative", "Pilot"],
        optionalRoles: ["Tech specialist"],
        requiredAssets: ["Stealth-capable ship", "Surveillance equipment"],
        optionalAssets: [],
        objectives: ["Approach target area undetected", "Gather intelligence", "Remain undetected", "Extract"],
        preparationChecklist: ["Stealth operational", "Comms encrypted"],
        executionSteps: ["Approach quietly", "Gather data", "Depart unseen"],
        successConditions: ["Intelligence gathered", "Undetected exit"],
        failureConditions: ["Detected", "Data not collected"],
        risks: ["Detection", "Interception"],
        rewardTypes: [MissionRewardType.REPUTATION, MissionRewardType.LOOT],
        tags: ["reconnaissance", "stealth", "covert"],
        aiPromptSeed:
          "Generate a Star Citizen stealth reconnaissance mission. Include target intel, approach vectors, observation points, and exiftration.",
      },
    ],
  });

  // Security and Escort
  const securityOps = await prisma.missionCategory.create({
    data: {
      name: "Security and Escort",
      slug: "security-and-escort",
      description:
        "Anti-piracy escorts, convoy protection, VIP transport, mining protection, perimeter defense, and overwatch.",
      icon: "🛡️",
    },
  });

  await prisma.missionTemplate.createMany({
    data: [
      {
        categoryId: securityOps.id,
        name: "Cargo Convoy Escort",
        slug: "cargo-convoy-escort-mission",
        summary: "Escort a cargo convoy to its destination",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "1h to 2h",
        recommendedPlayersMin: 3,
        recommendedPlayersMax: 12,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 2,
        requiredRoles: ["Convoy lead", "Fighter pilot", "Cargo pilot"],
        optionalRoles: ["Medic", "Support"],
        requiredAssets: ["Cargo ships", "Fighter escorts"],
        optionalAssets: ["Support ship"],
        objectives: ["Form convoy", "Travel route", "Defend if attacked", "Reach destination"],
        preparationChecklist: ["Cargo manifest verified", "Route briefed", "Comms checked"],
        executionSteps: ["Rally at start", "Brief route", "Begin travel", "Maintain vigilance"],
        successConditions: ["Cargo delivered", "Convoy intact"],
        failureConditions: ["Cargo lost", "Convoy scattered"],
        risks: ["Pirates", "Ambush"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["escort", "cargo", "security"],
        aiPromptSeed:
          "Generate a Star Citizen cargo convoy escort. Include convoy composition, route hazards, expected threats, and contingency plans.",
      },
      {
        categoryId: securityOps.id,
        name: "VIP Escort",
        slug: "vip-escort",
        summary: "Protect a high-value individual or diplomat",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "1h to 1.5h",
        recommendedPlayersMin: 3,
        recommendedPlayersMax: 8,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["Security lead", "VIP transport pilot", "Close protection"],
        optionalRoles: ["Medic"],
        requiredAssets: ["VIP transport", "Security escorts"],
        optionalAssets: [],
        objectives: ["Pick up VIP", "Transport safely", "Maintain security", "Deliver"],
        preparationChecklist: ["VIP profile known", "Route secured", "Security briefed"],
        executionSteps: ["Pick up VIP", "Secure transport", "Travel to destination"],
        successConditions: ["VIP safe", "Destination reached"],
        failureConditions: ["VIP captured or killed", "Transport destroyed"],
        risks: ["Assassination attempt", "Ambush"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION, MissionRewardType.DIPLOMACY],
        tags: ["protection", "vip", "diplomatic"],
        aiPromptSeed:
          "Generate a Star Citizen VIP escort operation. Include VIP profile, threat assessment, security protocols, and contingency plans.",
      },
      {
        categoryId: securityOps.id,
        name: "Mining Protection",
        slug: "mining-protection",
        summary: "Protect mining operations from hostile interference",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "2h to 3h",
        recommendedPlayersMin: 2,
        recommendedPlayersMax: 6,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["Combat pilot", "Scanner operator"],
        optionalRoles: ["Medical support"],
        requiredAssets: ["Fighter ships", "Scanning ship"],
        optionalAssets: [],
        objectives: ["Patrol mining zone", "Deter pirates", "Respond to threats"],
        preparationChecklist: ["Patrol route planned", "Comms functional"],
        executionSteps: ["Begin patrol", "Monitor miners", "Respond to threats"],
        successConditions: ["Mining uninterrupted", "Threats neutralized"],
        failureConditions: ["Miners attacked", "Guards lost"],
        risks: ["Pirate attack", "Multiple hostiles"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION],
        tags: ["security", "mining", "protection"],
        aiPromptSeed:
          "Generate a Star Citizen mining protection operation. Include mining site, threat assessment, patrol patterns, and response tactics.",
      },
    ],
  });

  // Industrial Operations
  const industrialOps = await prisma.missionCategory.create({
    data: {
      name: "Industrial Operations",
      slug: "industrial-operations",
      description: "Multi-role industrial work involving mining, salvage, hauling, repair, refueling, and support crews.",
      icon: "🏭",
    },
  });

  await prisma.missionTemplate.createMany({
    data: [
      {
        categoryId: industrialOps.id,
        name: "Mining and Hauling Operation",
        slug: "mining-and-hauling",
        summary: "Mine resources and haul to a processing facility",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "2h to 3h",
        recommendedPlayersMin: 3,
        recommendedPlayersMax: 8,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["Miner", "Hauler", "Logistics coordinator"],
        optionalRoles: ["Security"],
        requiredAssets: ["Mining ship", "Cargo hauler", "Storage"],
        optionalAssets: [],
        objectives: ["Mine resources", "Load cargo", "Transport to facility", "Unload"],
        preparationChecklist: ["Mining site confirmed", "Haul route planned"],
        executionSteps: ["Begin mining", "Fill cargo", "Transport", "Unload"],
        successConditions: ["Cargo delivered", "Team intact"],
        failureConditions: ["Cargo lost", "Equipment failure"],
        risks: ["Equipment breakdown", "Pirates"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.RESOURCES],
        tags: ["industrial", "mining", "hauling", "teamwork"],
        aiPromptSeed:
          "Generate a Star Citizen mining and hauling operation. Include mining location, haul route, facility destination, and profit projections.",
      },
    ],
  });

  // Racing and Training
  const racingOps = await prisma.missionCategory.create({
    data: {
      name: "Racing and Training",
      slug: "racing-and-training",
      description: "Racing events, pilot training, formation flying, combat drills, boarding drills, medical drills, and org readiness exercises.",
      icon: "🏁",
    },
  });

  await prisma.missionTemplate.createMany({
    data: [
      {
        categoryId: racingOps.id,
        name: "Formation Flying Training",
        slug: "formation-flying-training",
        summary: "Practice formation flying and coordination",
        difficulty: MissionDifficulty.EASY,
        estimatedDuration: "1h",
        recommendedPlayersMin: 3,
        recommendedPlayersMax: 8,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["Lead pilot", "Wing pilot"],
        optionalRoles: ["Instructor"],
        requiredAssets: ["Multi-role ships"],
        optionalAssets: [],
        objectives: ["Form up", "Practice formations", "Execute maneuvers"],
        preparationChecklist: ["Pilots briefed"],
        executionSteps: ["Brief formation types", "Practice each", "Debrief"],
        successConditions: ["All formations mastered"],
        failureConditions: ["Formation broken"],
        risks: ["Collision"],
        rewardTypes: [MissionRewardType.TRAINING, MissionRewardType.ORG_READINESS],
        tags: ["training", "formation", "drills"],
        aiPromptSeed:
          "Generate a Star Citizen formation flying training exercise. Include formations to practice, flight patterns, and progression difficulty.",
      },
      {
        categoryId: racingOps.id,
        name: "Combat Drills",
        slug: "combat-drills",
        summary: "Practice combat tactics and skills",
        difficulty: MissionDifficulty.MEDIUM,
        estimatedDuration: "1.5h",
        recommendedPlayersMin: 2,
        recommendedPlayersMax: 8,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["Combat pilot", "Instructor"],
        optionalRoles: ["Support"],
        requiredAssets: ["Fighter ships"],
        optionalAssets: [],
        objectives: ["Practice maneuvers", "Run scenarios", "Improve accuracy"],
        preparationChecklist: ["Range cleared"],
        executionSteps: ["Briefing", "Run drills", "Debrief"],
        successConditions: ["Skills improved"],
        failureConditions: ["Training not completed"],
        risks: ["Friendly fire"],
        rewardTypes: [MissionRewardType.TRAINING, MissionRewardType.ORG_READINESS],
        tags: ["training", "combat", "pvp"],
        aiPromptSeed:
          "Generate a Star Citizen combat training drill. Include combat scenarios, targets, objective types, and evaluation criteria.",
      },
    ],
  });

  // Social and Community Events
  const socialOps = await prisma.missionCategory.create({
    data: {
      name: "Social and Community Events",
      slug: "social-community-events",
      description: "Org meetups, ship shows, recruitment events, tours, ceremonies, screenshots, and community operations.",
      icon: "🎉",
    },
  });

  await prisma.missionTemplate.createMany({
    data: [
      {
        categoryId: socialOps.id,
        name: "Org Recruitment Event",
        slug: "org-recruitment-event",
        summary: "Organize a recruitment event to attract new members",
        difficulty: MissionDifficulty.EASY,
        estimatedDuration: "1h to 2h",
        recommendedPlayersMin: 3,
        recommendedPlayersMax: 20,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 1,
        requiredRoles: ["Host", "Recruiter", "Organizer"],
        optionalRoles: ["Guide"],
        requiredAssets: ["Meeting location", "Ships for display"],
        optionalAssets: [],
        objectives: ["Host event", "Showcase org", "Recruit new members"],
        preparationChecklist: ["Event time announced", "Venue ready"],
        executionSteps: ["Welcome participants", "Give tour", "Discuss org", "Recruit"],
        successConditions: ["Event successful", "New recruits"],
        failureConditions: ["No attendees"],
        risks: ["Griefers"],
        rewardTypes: [MissionRewardType.RECRUITMENT, MissionRewardType.FUN_SOCIAL],
        tags: ["social", "recruitment", "community"],
        aiPromptSeed:
          "Generate a Star Citizen org recruitment event plan. Include event structure, talking points, recruitment strategy, and follow-up.",
      },
      {
        categoryId: socialOps.id,
        name: "Fleet Photo Event",
        slug: "fleet-photo-event",
        summary: "Gather the org fleet for group photos",
        difficulty: MissionDifficulty.EASY,
        estimatedDuration: "1h",
        recommendedPlayersMin: 5,
        recommendedPlayersMax: 50,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 2,
        requiredRoles: ["Photographer", "Fleet organizer"],
        optionalRoles: ["Pilot"],
        requiredAssets: ["All org ships"],
        optionalAssets: [],
        objectives: ["Form fleet", "Create photo compositions", "Capture memories"],
        preparationChecklist: ["Photo location scouted"],
        executionSteps: ["Gather fleet", "Formation up", "Photo shoots"],
        successConditions: ["Great photos taken"],
        failureConditions: ["Fleet doesn't form"],
        risks: ["Crashes"],
        rewardTypes: [MissionRewardType.FUN_SOCIAL, MissionRewardType.ROLEPLAY],
        tags: ["social", "photography", "fun"],
        aiPromptSeed:
          "Generate a Star Citizen fleet photography event plan. Include locations, formation ideas, and composition suggestions.",
      },
    ],
  });

  // Dynamic Event Operations
  const dynamicOps = await prisma.missionCategory.create({
    data: {
      name: "Dynamic Event Operations",
      slug: "dynamic-event-operations",
      description: "Large-scale server events, global events, time-limited missions, faction events, and narrative operations.",
      icon: "⚡",
    },
  });

  await prisma.missionTemplate.createMany({
    data: [
      {
        categoryId: dynamicOps.id,
        name: "Server Event Response",
        slug: "server-event-response",
        summary: "Respond to and participate in server-wide events",
        difficulty: MissionDifficulty.HARD,
        estimatedDuration: "1h to 4h",
        recommendedPlayersMin: 5,
        recommendedPlayersMax: 100,
        recommendedOrganizationsMin: 1,
        recommendedOrganizationsMax: 10,
        requiredRoles: ["Event lead", "Pilot", "Ground trooper"],
        optionalRoles: ["Medical", "Logistics"],
        requiredAssets: ["All available org assets"],
        optionalAssets: [],
        objectives: ["Respond to event", "Complete objectives", "Earn rewards"],
        preparationChecklist: ["Event details studied", "Org briefed"],
        executionSteps: ["Assemble team", "Join event", "Complete objectives"],
        successConditions: ["Event objectives met", "Rewards earned"],
        failureConditions: ["Event failed", "Org eliminated"],
        risks: ["Server instability", "Overwhelming opposition"],
        rewardTypes: [MissionRewardType.aUEC, MissionRewardType.REPUTATION, MissionRewardType.LOOT],
        tags: ["events", "dynamic", "large-scale"],
        aiPromptSeed:
          "Generate a Star Citizen server event response operation. Include event details, objectives, opposition, and strategic recommendations.",
      },
    ],
  });

  // Custom Operations
  await prisma.missionCategory.create({
    data: {
      name: "Custom Operations",
      slug: "custom-operations",
      description: "Flexible user-created templates for unique org goals.",
      icon: "✨",
    },
  });
}

main()
  .then(async () => {
    await seedMissions();
    const missionSyncResult = await syncRealScMissions(prisma);
    console.info(
      `Replaced default mission templates with curated in-game contracts: ${missionSyncResult.categoryCount} categories, ${missionSyncResult.templateCount} templates.`
    );
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

