import "dotenv/config";
import {
  AssetStatus,
  AssetType,
  MissionDifficulty,
  MissionRewardType,
  NotificationType,
  OperationStatus,
  OperationType,
  OrganizationFocusType,
  OrganizationMemberRole,
  OrganizationVisibility,
  PrismaClient,
  RSVPStatus,
  ShipRole,
  ShipSize,
  ThreatLevel,
  VehicleRole,
  VehicleSize,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";
import { syncRealScMissions } from "../src/server/real-sc-missions";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const OWNER_EMAIL = "zerozone1@live.com";
const OWNER_PASSWORD = "James=on90";
const ORG_NAME = "StarOP4";
const ORG_TAG = "SOP4";
const MEMBER_COUNT = 30;

function pickRole(index: number): OrganizationMemberRole {
  if (index === 0) return OrganizationMemberRole.OWNER;
  if (index <= 3) return OrganizationMemberRole.OFFICER;
  if (index <= 7) return OrganizationMemberRole.COMMANDER;
  if (index <= 11) return OrganizationMemberRole.TEAM_LEADER;
  return OrganizationMemberRole.MEMBER;
}

function pickTitle(index: number): string {
  if (index === 0) return "Org Owner";
  if (index <= 3) return `Operations Officer ${index}`;
  if (index <= 7) return `Division Commander ${index - 3}`;
  if (index <= 11) return `Team Lead ${index - 7}`;
  return `Operator ${index}`;
}

async function ensureMemberUsers(passwordHash: string) {
  const users: Array<{ id: string; email: string; name: string; handle: string }> = [];

  for (let i = 1; i <= MEMBER_COUNT; i += 1) {
    const idx = String(i).padStart(2, "0");
    const email = i === 1 ? OWNER_EMAIL : `starop4.member${idx}@starcitizenops.local`;
    const name = i === 1 ? "Zero Zone" : `StarOP4 Member ${idx}`;
    const handle = i === 1 ? "ZeroZoneOne" : `SOP4Handle${idx}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        passwordHash,
        starCitizenHandle: handle,
        bio: i === 1 ? "Founder and strategic lead of StarOP4." : "StarOP4 operational member profile.",
        timezone: "UTC",
        availability: "Daily 18:00-23:00 UTC",
        preferredRoles:
          i <= 5
            ? ["Commander", "Pilot", "Security"]
            : i <= 10
              ? ["Logistics", "Engineer", "Support"]
              : i <= 15
                ? ["Mining", "Salvage", "Cargo"]
                : ["Infantry", "Recon", "Escort"],
      },
      create: {
        name,
        email,
        passwordHash,
        starCitizenHandle: handle,
        bio: i === 1 ? "Founder and strategic lead of StarOP4." : "StarOP4 operational member profile.",
        timezone: "UTC",
        availability: "Daily 18:00-23:00 UTC",
        preferredRoles:
          i <= 5
            ? ["Commander", "Pilot", "Security"]
            : i <= 10
              ? ["Logistics", "Engineer", "Support"]
              : i <= 15
                ? ["Mining", "Salvage", "Cargo"]
                : ["Infantry", "Recon", "Escort"],
      },
      select: {
        id: true,
        email: true,
        name: true,
        starCitizenHandle: true,
      },
    });

    users.push({
      id: user.id,
      email: user.email ?? email,
      name: user.name ?? name,
      handle: user.starCitizenHandle ?? handle,
    });
  }

  return users;
}

async function main() {
  const passwordHash = hashSync(OWNER_PASSWORD, 10);
  const members = await ensureMemberUsers(passwordHash);
  const owner = members[0];

  const org = await prisma.organization.upsert({
    where: { tag: ORG_TAG },
    update: {
      name: ORG_NAME,
      description:
        "StarOP4 is a full-spectrum Star Citizen organization covering command, logistics, mining, salvage, medical, and combined-arms operations.",
      focusType: OrganizationFocusType.MIXED,
      visibility: OrganizationVisibility.PUBLIC,
      logoUrl: "https://robertsspaceindustries.com/media/logo.png",
      bannerUrl: "https://robertsspaceindustries.com/media/banner.jpg",
      starCitizenVerified: true,
      starCitizenVerificationCheckedAt: new Date(),
      ownerId: owner.id,
    },
    create: {
      name: ORG_NAME,
      tag: ORG_TAG,
      description:
        "StarOP4 is a full-spectrum Star Citizen organization covering command, logistics, mining, salvage, medical, and combined-arms operations.",
      focusType: OrganizationFocusType.MIXED,
      visibility: OrganizationVisibility.PUBLIC,
      logoUrl: "https://robertsspaceindustries.com/media/logo.png",
      bannerUrl: "https://robertsspaceindustries.com/media/banner.jpg",
      starCitizenVerified: true,
      starCitizenVerificationCheckedAt: new Date(),
      ownerId: owner.id,
    },
    select: { id: true, name: true, tag: true },
  });

  await prisma.organizationMember.deleteMany({ where: { organizationId: org.id } });

  await prisma.organizationMember.createMany({
    data: members.map((member, index) => ({
      organizationId: org.id,
      userId: member.id,
      role: pickRole(index),
      title: pickTitle(index),
    })),
  });

  const orgMembers = await prisma.organizationMember.findMany({
    where: { organizationId: org.id },
    orderBy: { joinedAt: "asc" },
    select: { id: true, userId: true, role: true },
  });

  await prisma.organizationMemberAppPrivilege.deleteMany({
    where: { organizationMemberId: { in: orgMembers.map((m) => m.id) } },
  });

  const privileged = orgMembers.filter(
    (m) => m.role === OrganizationMemberRole.OWNER || m.role === OrganizationMemberRole.OFFICER || m.role === OrganizationMemberRole.COMMANDER
  );

  await prisma.organizationMemberAppPrivilege.createMany({
    data: privileged.map((m) => ({
      organizationMemberId: m.id,
      editOrganization: true,
      inviteMembers: true,
      createOperation: true,
      editOperation: true,
      assignRoles: true,
      inviteOrganizations: true,
      viewPrivateOperations: true,
      postAfterActionReports: true,
      manageChannels: true,
    })),
  });

  const missionSyncResult = await syncRealScMissions(prisma);
  console.info(
    `Restored mission library with ${missionSyncResult.categoryCount} categories and ${missionSyncResult.templateCount} templates.`
  );

  const missionCategory = await prisma.missionCategory.upsert({
    where: { slug: "starop4-combined-arms" },
    update: {
      name: "StarOP4 Combined Arms",
      description: "Organization-specific mission category for StarOP4.",
      icon: "Crosshair",
    },
    create: {
      name: "StarOP4 Combined Arms",
      slug: "starop4-combined-arms",
      description: "Organization-specific mission category for StarOP4.",
      icon: "Crosshair",
    },
  });

  const missionTemplate = await prisma.missionTemplate.upsert({
    where: { categoryId_slug: { categoryId: missionCategory.id, slug: "starop4-system-control" } },
    update: {
      name: "System Control Operation",
      summary: "Secure strategic locations while running synchronized logistics and security lanes.",
      difficulty: MissionDifficulty.HARD,
      requiredRoles: ["Commander", "Pilot", "Logistics", "Security", "Medic"],
      objectives: [
        "Establish orbital security perimeter",
        "Secure ground LZ and bunker",
        "Run protected cargo and fuel convoy",
      ],
      tags: ["starop4", "combined-arms", "security", "logistics"],
      rewardTypes: [MissionRewardType.aUEC, MissionRewardType.ORG_READINESS, MissionRewardType.REPUTATION],
    },
    create: {
      categoryId: missionCategory.id,
      name: "System Control Operation",
      slug: "starop4-system-control",
      summary: "Secure strategic locations while running synchronized logistics and security lanes.",
      description: "Multi-phase org mission template including fleet command, extraction, and sustainment loops.",
      difficulty: MissionDifficulty.HARD,
      estimatedDuration: "120m",
      recommendedPlayersMin: 20,
      recommendedPlayersMax: 60,
      recommendedOrganizationsMin: 1,
      recommendedOrganizationsMax: 3,
      requiredRoles: ["Commander", "Pilot", "Logistics", "Security", "Medic"],
      optionalRoles: ["Recon", "Engineer", "Salvage", "Mining"],
      requiredAssets: ["Gunship", "Cargo hauler", "Medical ship"],
      optionalAssets: ["Mining vessel", "Salvage vessel", "Ground armor"],
      objectives: [
        "Establish orbital security perimeter",
        "Secure ground LZ and bunker",
        "Run protected cargo and fuel convoy",
      ],
      preparationChecklist: ["Brief all wings", "Assign command net", "Stage medical assets"],
      executionSteps: ["Phase 1: Recon", "Phase 2: Strike", "Phase 3: Logistics", "Phase 4: Extraction"],
      successConditions: ["Convoy reaches destination", "LZ held until extraction", "Casualties stabilized"],
      failureConditions: ["Command ship disabled", "Supply chain collapse", "Extraction window missed"],
      risks: ["Hostile interception", "Ground AA concentrations", "Medical overload"],
      rewardTypes: [MissionRewardType.aUEC, MissionRewardType.ORG_READINESS, MissionRewardType.REPUTATION],
      tags: ["starop4", "combined-arms", "security", "logistics"],
      aiPromptSeed: "Generate a high-discipline combined-arms operation plan for StarOP4.",
      sourceType: "MANUAL",
      sourceTitle: "StarOP4 Command Doctrine",
      addedByMissionIntelligence: true,
      lastVerifiedAt: new Date(),
    },
  });

  await prisma.operation.deleteMany({ where: { organizationId: org.id } });

  const operation = await prisma.operation.create({
    data: {
      title: "StarOP4: Stanton Stabilization",
      type: OperationType.COMBINED_ARMS_ASSAULT,
      description: "Flagship operation seeded for full org readiness and planning workflows.",
      objective: "Control strategic lane and complete protected logistics cycle.",
      location: "Stanton - Hurston Corridor",
      threatLevel: ThreatLevel.HIGH,
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 26),
      status: OperationStatus.PLANNED,
      visibility: OrganizationVisibility.PUBLIC,
      commanderId: owner.id,
      organizationId: org.id,
      missionTemplateId: missionTemplate.id,
      missionBrief: "Combined-arms execution across orbital, ground, and logistics lanes.",
      commsPlan: "Primary VOIP Net A, backup Net C, emergency beacon code SOP4-RED.",
      rulesOfEngagement: "Defensive-first posture with escalation authority at command tier.",
      rallyPoints: "Everus Harbor, ArcCorp L1, Hurston OM-4",
      extractionPlan: "Medical fallback to Cutlass Red and C8R chain.",
      contingencyPlans: "Re-route convoy and redeploy fighters to anti-interdiction pattern.",
      requiredSupplies: "Medpens, ammo packs, repair kits, fuel reserves",
      requiredShips: "Gunships, heavy fighters, cargo haulers, medevac",
      requiredGroundVehicles: "Spartan APC, Ballista, ROC support",
      requiredPersonnel: "Command, recon, medics, logistics handlers",
      missionPhases: "Recon -> Breach -> Hold -> Convoy -> Extract",
    },
  });

  await prisma.operationParticipant.createMany({
    data: orgMembers.map((member, index) => ({
      operationId: operation.id,
      userId: member.userId,
      organizationId: org.id,
      assignedRole: index < 5 ? "Command" : index < 15 ? "Flight Wing" : "Ground and Logistics",
      team: index < 10 ? "Alpha" : index < 20 ? "Bravo" : "Charlie",
      status: index < 20 ? RSVPStatus.GOING : RSVPStatus.MAYBE,
    })),
  });

  await prisma.roleAssignment.createMany({
    data: orgMembers.slice(0, 12).map((member, index) => ({
      operationId: operation.id,
      userId: member.userId,
      role: index < 3 ? "Command Staff" : index < 6 ? "Strike Leader" : "Support Lead",
      team: index < 4 ? "Alpha" : index < 8 ? "Bravo" : "Charlie",
      notes: "Seeded assignment for org readiness.",
    })),
  });

  await prisma.operationAsset.createMany({
    data: [
      {
        operationId: operation.id,
        ownerOrganizationId: org.id,
        assetType: AssetType.FLEET_SHIP,
        name: "Hammerhead Command",
        manufacturer: "Aegis",
        role: "Command Gunship",
        size: "LARGE",
        category: "Combat",
        quantity: 1,
        assignedTo: "Alpha",
        notes: "Primary command hull",
      },
      {
        operationId: operation.id,
        ownerOrganizationId: org.id,
        assetType: AssetType.CARGO_SHIP,
        name: "C2 Hercules",
        manufacturer: "Crusader",
        role: "Heavy Logistics",
        size: "LARGE",
        category: "Logistics",
        quantity: 2,
        assignedTo: "Charlie",
      },
      {
        operationId: operation.id,
        ownerOrganizationId: org.id,
        assetType: AssetType.MEDICAL_SHIP,
        name: "Cutlass Red",
        manufacturer: "Drake",
        role: "Medical Support",
        size: "MEDIUM",
        category: "Medical",
        quantity: 2,
        assignedTo: "Bravo",
      },
      {
        operationId: operation.id,
        ownerOrganizationId: org.id,
        assetType: AssetType.GROUND_VEHICLE,
        name: "Spartan APC",
        manufacturer: "Anvil",
        role: "Ground Transport",
        size: "MEDIUM",
        category: "Ground",
        quantity: 4,
        assignedTo: "Charlie",
      },
    ],
  });

  const shipOwners = members.slice(0, 8);
  for (const [index, member] of shipOwners.entries()) {
    await prisma.ship.create({
      data: {
        userId: member.id,
        name: index % 2 === 0 ? "Gladius" : "Constellation Andromeda",
        manufacturer: index % 2 === 0 ? "Aegis" : "RSI",
        role: index % 2 === 0 ? ShipRole.FIGHTER : ShipRole.MULTI_ROLE,
        size: index % 2 === 0 ? ShipSize.SMALL : ShipSize.LARGE,
        quantity: 1,
        status: AssetStatus.AVAILABLE,
        notes: "StarOP4 seeded fleet asset",
      },
    });
  }

  const vehicleOwners = members.slice(8, 14);
  for (const member of vehicleOwners) {
    await prisma.groundVehicle.create({
      data: {
        userId: member.id,
        name: "Cyclone",
        manufacturer: "Tumbril",
        role: VehicleRole.COMBAT,
        size: VehicleSize.SMALL,
        quantity: 1,
        status: AssetStatus.AVAILABLE,
        notes: "StarOP4 seeded ground vehicle",
      },
    });
  }

  await prisma.comment.createMany({
    data: [
      {
        operationId: operation.id,
        userId: owner.id,
        body: "Command brief published. Confirm attendance and loadouts.",
      },
      {
        operationId: operation.id,
        userId: members[2].id,
        body: "Wing assignments acknowledged. Fuel and ordnance checks underway.",
      },
      {
        operationId: operation.id,
        userId: members[6].id,
        body: "Medical corridor and triage fallback points configured.",
      },
    ],
  });

  await prisma.aIGeneratedPlan.create({
    data: {
      operationId: operation.id,
      userId: owner.id,
      prompt: "Generate a full-spectrum battle rhythm and contingency matrix for StarOP4.",
      result:
        "Phase-sequenced plan with command cadence, logistics checkpoints, and fallback contingencies was generated and approved.",
      provider: "OpenAI",
      model: "gpt-5.3-codex",
    },
  });

  await prisma.afterActionReport.create({
    data: {
      operationId: operation.id,
      authorId: owner.id,
      summary: "Seeded reference report for command workflows.",
      whatWentWell: "Cross-wing comms discipline and logistics pacing were strong.",
      whatWentWrong: "Ground extraction timing slipped under heavy interdiction.",
      lessonsLearned: "Pre-stage reserve medics and redundant escort lanes.",
      casualtiesOrLosses: "Minor hull damage across escort wing.",
      recommendations: "Increase recon lead time by 10 minutes and add one backup hauler.",
    },
  });

  await prisma.rSVP.createMany({
    data: orgMembers.slice(0, 20).map((m) => ({
      operationId: operation.id,
      userId: m.userId,
      status: RSVPStatus.GOING,
      note: "Ready for deployment.",
    })),
  });

  await prisma.activityFeedItem.createMany({
    data: [
      {
        type: "ORG_UPDATE",
        title: "StarOP4 org profile fully configured",
        body: "Branding, focus, privileges, and member roster were synchronized.",
        userId: owner.id,
        organizationId: org.id,
      },
      {
        type: "OPERATION_CREATED",
        title: "Stanton Stabilization planned",
        body: "Command operation seeded with full structure and participants.",
        userId: owner.id,
        organizationId: org.id,
        operationId: operation.id,
      },
    ],
  });

  const commandChannel = await prisma.conversation.create({
    data: {
      title: "StarOP4 Command Net",
      description: "Primary command and operations channel.",
      isChannel: true,
      organizationId: org.id,
      createdById: owner.id,
      participants: {
        create: orgMembers.map((m) => ({ userId: m.userId })),
      },
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: commandChannel.id,
        senderId: owner.id,
        body: "Welcome to StarOP4 command net. This org is fully configured and mission ready.",
      },
      {
        conversationId: commandChannel.id,
        senderId: members[3].id,
        body: "Officer corps confirms member assignments and privilege matrix.",
      },
      {
        conversationId: commandChannel.id,
        senderId: members[7].id,
        body: "Logistics confirms supply and fuel lanes are operational.",
      },
    ],
  });

  const socialCategory = await prisma.socialCategory.upsert({
    where: { slug: "starop4-command-briefs" },
    update: {
      name: "StarOP4 Command Briefs",
      description: "Official strategy and directive channel for StarOP4.",
      createdById: owner.id,
    },
    create: {
      name: "StarOP4 Command Briefs",
      slug: "starop4-command-briefs",
      description: "Official strategy and directive channel for StarOP4.",
      createdById: owner.id,
    },
  });

  const socialPost = await prisma.socialPost.create({
    data: {
      title: "StarOP4 Operational Doctrine v1",
      body: "This is the seeded full doctrine post covering command, logistics, mining, and security execution standards.",
      type: "GUIDELINE",
      pinned: true,
      authorId: owner.id,
      categoryId: socialCategory.id,
      organizationId: org.id,
    },
  });

  await prisma.socialPostReply.createMany({
    data: [
      {
        postId: socialPost.id,
        authorId: members[4].id,
        body: "Doctrine acknowledged by flight command.",
      },
      {
        postId: socialPost.id,
        authorId: members[9].id,
        body: "Logistics branch confirms compliance and staging timeline.",
      },
    ],
  });

  const invitedUser = await prisma.user.upsert({
    where: { email: "starop4.guest@starcitizenops.local" },
    update: {
      name: "StarOP4 Guest",
      passwordHash,
      preferredRoles: ["Guest", "Observer"],
    },
    create: {
      name: "StarOP4 Guest",
      email: "starop4.guest@starcitizenops.local",
      passwordHash,
      preferredRoles: ["Guest", "Observer"],
    },
  });

  await prisma.organizationInvite.create({
    data: {
      organizationId: org.id,
      inviterId: owner.id,
      invitedUserId: invitedUser.id,
      email: invitedUser.email!,
      role: OrganizationMemberRole.GUEST,
      message: "You are invited to observe StarOP4 operations.",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  await prisma.organizationJoinRequest.create({
    data: {
      organizationId: org.id,
      userId: invitedUser.id,
      applicantHandle: "starop4.guest",
      preferredRole: "Guest Observer",
      weeklyAvailability: "Weekends",
      reasonToJoin: "Learn StarOP4 procedures and contribute as a support observer.",
      message: "Requesting guest access to learn StarOP4 procedures.",
      status: "PENDING",
    },
  });

  const partnerOrg = await prisma.organization.upsert({
    where: { tag: "SOP4X" },
    update: {
      name: "StarOP4 Expeditionary",
      ownerId: owner.id,
      focusType: OrganizationFocusType.EXPLORATION,
      visibility: OrganizationVisibility.PUBLIC,
    },
    create: {
      name: "StarOP4 Expeditionary",
      tag: "SOP4X",
      description: "Partner wing supporting StarOP4 external operations.",
      ownerId: owner.id,
      focusType: OrganizationFocusType.EXPLORATION,
      visibility: OrganizationVisibility.PUBLIC,
    },
  });

  const alliance = await prisma.alliance.create({
    data: {
      name: "StarOP4 Defense Accord",
      description: "Mutual support pact for security, logistics, and rapid response.",
      createdById: owner.id,
      members: {
        create: [{ organizationId: org.id }, { organizationId: partnerOrg.id }],
      },
    },
  });

  await prisma.coalition.create({
    data: {
      name: "StarOP4 Joint Command",
      description: "Coalition framework seeded for inter-org mission execution.",
      operationId: operation.id,
      createdById: owner.id,
      commandNotes: "StarOP4 primary, Expeditionary as recon and support.",
      members: {
        create: [
          { organizationId: org.id, responsibility: "Primary command and execution" },
          { organizationId: partnerOrg.id, responsibility: "Recon and support" },
        ],
      },
    },
  });

  await prisma.notification.createMany({
    data: orgMembers.slice(0, 20).map((m) => ({
      userId: m.userId,
      type: NotificationType.SYSTEM,
      title: "StarOP4 bootstrap complete",
      body: "Your organization profile, channels, operations, and role privileges have been provisioned.",
      link: `/organizations/${org.id}`,
    })),
  });

  console.log("StarOP4 bootstrap complete:");
  console.log(`- Owner login: ${OWNER_EMAIL}`);
  console.log(`- Owner password: ${OWNER_PASSWORD}`);
  console.log(`- Organization: ${ORG_NAME} (${ORG_TAG})`);
  console.log(`- Members provisioned: ${MEMBER_COUNT}`);
  console.log(`- Alliance: ${alliance.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
