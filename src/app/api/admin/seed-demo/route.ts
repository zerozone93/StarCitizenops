import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  AssetStatus,
  AssetType,
  NotificationType,
  OperationStatus,
  OperationType,
  OrganizationFocusType,
  OrganizationMemberRole,
  OrganizationVisibility,
  RSVPStatus,
  ThreatLevel,
  ShipRole,
  ShipSize,
  VehicleRole,
  VehicleSize,
  SiteRole,
  SocialPostType,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = process.env.DEMO_SEED_TOKEN;

  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Safety: only allow if explicit flag is set
  if (process.env.ALLOW_DEMO_SEED !== "true") {
    return NextResponse.json({ error: "Demo seed not enabled. Set ALLOW_DEMO_SEED=true in Vercel env." }, { status: 403 });
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
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
    await prisma.organizationMemberAppPrivilege.deleteMany();
    await prisma.organizationMember.deleteMany();
    await prisma.activityFeedItem.deleteMany();
    await prisma.socialPostReply.deleteMany();
    await prisma.socialPost.deleteMany();
    await prisma.socialCategory.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.ship.deleteMany();
    await prisma.groundVehicle.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();

    const demoPassword = hashSync("StarOps!Demo2026", 10);
    const memberPassword = hashSync("Member!2026", 10);

    const mike = await prisma.user.create({ data: { name: "Mike Commander", email: "mike@starcitizenopps.com", passwordHash: demoPassword, starCitizenHandle: "ZeroZone93", bio: "Founder of Vanguard Collective. Combat veteran, fleet strategist, and org builder. Built StarCitizenOps to give players the command tools they deserve.", timezone: "UTC", availability: "Evenings & Weekends", preferredRoles: ["Commander", "Fleet Lead", "Strategist"], siteRole: SiteRole.SITE_ADMIN, termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" } });
    const jax = await prisma.user.create({ data: { name: "Jax Volkov", email: "jax@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "JaxVolkov", bio: "Fighter ace and wing commander. Prefers aggressive intercept tactics.", timezone: "UTC-5", availability: "Weeknights", preferredRoles: ["Fighter Pilot", "Wing Commander"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" } });
    const nova = await prisma.user.create({ data: { name: "Nova Sinclair", email: "nova@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "NovaSinclair", bio: "Logistics and supply chain specialist. Keeps the fleet fueled and armed.", timezone: "UTC+1", availability: "Flexible", preferredRoles: ["Logistics", "Cargo"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" } });
    const ryker = await prisma.user.create({ data: { name: "Ryker Ash", email: "ryker@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "RykerAsh", bio: "Recon and forward observer. Electronic warfare and long-range scanning.", timezone: "UTC+2", availability: "Most evenings", preferredRoles: ["Recon", "Scanner"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" } });
    const sera = await prisma.user.create({ data: { name: "Sera Vance", email: "sera@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "SeraVance", bio: "Combat medic and rescue pilot. No one gets left behind.", timezone: "UTC-3", availability: "Weekends", preferredRoles: ["Medic", "Rescue Pilot"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" } });
    const ghost = await prisma.user.create({ data: { name: "Ghost Six", email: "ghost@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "GhostSix", bio: "Special operations insertion lead. Silent approach, decisive strike.", timezone: "UTC", availability: "Late nights", preferredRoles: ["Infiltration", "Boarding"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" } });
    const titan = await prisma.user.create({ data: { name: "Titan Rex", email: "titan@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "TitanRex", bio: "Heavy assault and breach specialist.", timezone: "UTC", availability: "Weeknights & Weekends", preferredRoles: ["Infantry", "Breach"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" } });
    const echo = await prisma.user.create({ data: { name: "Echo Station", email: "echo@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "EchoStation", bio: "Mining and salvage expert. Finds value where others see wreckage.", timezone: "UTC+3", availability: "Most days", preferredRoles: ["Mining", "Salvage"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" } });
    const vex = await prisma.user.create({ data: { name: "Vex Calloway", email: "vex@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "VexCalloway", bio: "Freelance pilot looking for a real home.", timezone: "UTC", availability: "Weekends", preferredRoles: ["Pilot"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" } });
    const lia = await prisma.user.create({ data: { name: "Lia Storm", email: "lia@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "LiaStorm", bio: "Hauler turned combat pilot. Still learning.", timezone: "UTC-6", availability: "Evenings", preferredRoles: ["Cargo", "Pilot"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" } });
    const atlasOwner = await prisma.user.create({ data: { name: "Atlas Prime", email: "atlas@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "AtlasPrime", bio: "Industrial logistics corp CEO.", timezone: "UTC-4", availability: "Business hours + evenings", preferredRoles: ["Logistics", "Trade"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" } });
    const horizonOwner = await prisma.user.create({ data: { name: "Horizon Lead", email: "horizon@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "HorizonLead", bio: "Exploration org lead. Deep space is where we live.", timezone: "UTC+7", availability: "Evenings", preferredRoles: ["Explorer", "Navigation"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" } });

    const org = await prisma.organization.create({ data: { name: "Vanguard Collective", tag: "VGRD", description: "Elite combined-arms organization built for tactical fleet operations, ground assaults, and coordinated multi-org campaigns. Founded by ZeroZone93 for serious players who want real military-style coordination.", focusType: OrganizationFocusType.MILITARY, visibility: OrganizationVisibility.PUBLIC, ownerId: mike.id } });

    const jaxM = await prisma.organizationMember.create({ data: { userId: mike.id, organizationId: org.id, role: OrganizationMemberRole.OWNER, title: "Commander-in-Chief" } });
    const jaxMb = await prisma.organizationMember.create({ data: { userId: jax.id, organizationId: org.id, role: OrganizationMemberRole.OFFICER, title: "Wing Commander" } });
    const novaMb = await prisma.organizationMember.create({ data: { userId: nova.id, organizationId: org.id, role: OrganizationMemberRole.OFFICER, title: "Logistics Director" } });
    const rykerMb = await prisma.organizationMember.create({ data: { userId: ryker.id, organizationId: org.id, role: OrganizationMemberRole.COMMANDER, title: "Recon Commander" } });
    const seraMb = await prisma.organizationMember.create({ data: { userId: sera.id, organizationId: org.id, role: OrganizationMemberRole.COMMANDER, title: "Medical Lead" } });
    const ghostMb = await prisma.organizationMember.create({ data: { userId: ghost.id, organizationId: org.id, role: OrganizationMemberRole.TEAM_LEADER, title: "Special Ops Lead" } });
    const titanMb = await prisma.organizationMember.create({ data: { userId: titan.id, organizationId: org.id, role: OrganizationMemberRole.TEAM_LEADER, title: "Ground Strike Lead" } });
    const echoMb = await prisma.organizationMember.create({ data: { userId: echo.id, organizationId: org.id, role: OrganizationMemberRole.TEAM_LEADER, title: "Industrial Lead" } });
    await prisma.organizationMember.createMany({ data: [{ userId: vex.id, organizationId: org.id, role: OrganizationMemberRole.MEMBER, title: "Operator" }, { userId: lia.id, organizationId: org.id, role: OrganizationMemberRole.MEMBER, title: "Operator" }] });

    await prisma.organizationMemberAppPrivilege.createMany({ data: [
      { organizationMemberId: jaxMb.id, inviteMembers: true, createOperation: true, editOperation: true, assignRoles: true, viewPrivateOperations: true, postAfterActionReports: true, manageChannels: true },
      { organizationMemberId: novaMb.id, editOrganization: true, inviteMembers: true, createOperation: true, editOperation: true, inviteOrganizations: true, viewPrivateOperations: true, postAfterActionReports: true, manageChannels: true },
      { organizationMemberId: rykerMb.id, createOperation: true, editOperation: true, viewPrivateOperations: true, postAfterActionReports: true },
      { organizationMemberId: seraMb.id, viewPrivateOperations: true, postAfterActionReports: true },
      { organizationMemberId: ghostMb.id, createOperation: true, viewPrivateOperations: true },
      { organizationMemberId: titanMb.id, postAfterActionReports: true },
    ] });

    const atlasOrg = await prisma.organization.create({ data: { name: "Atlas Freight Corp", tag: "ATFC", description: "Industrial logistics powerhouse. Coalition partners for supply chain operations.", focusType: OrganizationFocusType.LOGISTICS, visibility: OrganizationVisibility.PUBLIC, ownerId: atlasOwner.id, members: { create: [{ userId: atlasOwner.id, role: OrganizationMemberRole.OWNER, title: "CEO" }, { userId: nova.id, role: OrganizationMemberRole.OFFICER, title: "Joint Liaison" }] } } });
    const horizonOrg = await prisma.organization.create({ data: { name: "Horizon Deep Space", tag: "HRZN", description: "Exploration and cartography organization. Provides strategic intelligence to allied combat orgs.", focusType: OrganizationFocusType.EXPLORATION, visibility: OrganizationVisibility.PUBLIC, ownerId: horizonOwner.id, members: { create: [{ userId: horizonOwner.id, role: OrganizationMemberRole.OWNER, title: "Chief Navigator" }, { userId: ryker.id, role: OrganizationMemberRole.OFFICER, title: "Tactical Recon Liaison" }] } } });

    // Mike's fleet
    await prisma.ship.createMany({ data: [
      { userId: mike.id, name: "Javelin Destroyer", manufacturer: "Aegis", role: ShipRole.CAPITAL, size: ShipSize.CAPITAL, quantity: 1, status: AssetStatus.PLEDGED, notes: "Flagship. Command operations only." },
      { userId: mike.id, name: "Idris-P Frigate", manufacturer: "Aegis", role: ShipRole.CAPITAL, size: ShipSize.CAPITAL, quantity: 1, status: AssetStatus.PLEDGED, notes: "Operations planning vessel." },
      { userId: mike.id, name: "Hammerhead", manufacturer: "Aegis", role: ShipRole.CORVETTE, size: ShipSize.LARGE, quantity: 2, status: AssetStatus.AVAILABLE, notes: "Fleet escort and anti-ship." },
      { userId: mike.id, name: "Gladius", manufacturer: "Aegis", role: ShipRole.FIGHTER, size: ShipSize.SMALL, quantity: 3, status: AssetStatus.AVAILABLE },
      { userId: mike.id, name: "Sabre", manufacturer: "Aegis", role: ShipRole.FIGHTER, size: ShipSize.SMALL, quantity: 2, status: AssetStatus.AVAILABLE, notes: "Stealth strike wing." },
      { userId: mike.id, name: "Eclipse", manufacturer: "Aegis", role: ShipRole.BOMBER, size: ShipSize.MEDIUM, quantity: 1, status: AssetStatus.AVAILABLE, notes: "Stealth bomber." },
      { userId: mike.id, name: "Vanguard Harbinger", manufacturer: "Aegis", role: ShipRole.BOMBER, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE, notes: "Anti-capital strike." },
      { userId: mike.id, name: "F7C-M Super Hornet", manufacturer: "Anvil", role: ShipRole.HEAVY_FIGHTER, size: ShipSize.SMALL, quantity: 4, status: AssetStatus.AVAILABLE, notes: "Main fighter squadron." },
      { userId: mike.id, name: "Hurricane", manufacturer: "Anvil", role: ShipRole.HEAVY_FIGHTER, size: ShipSize.MEDIUM, quantity: 2, status: AssetStatus.AVAILABLE },
      { userId: mike.id, name: "Arrow", manufacturer: "Anvil", role: ShipRole.INTERCEPTOR, size: ShipSize.SMALL, quantity: 3, status: AssetStatus.AVAILABLE, notes: "Fast intercept." },
      { userId: mike.id, name: "Valkyrie", manufacturer: "Anvil", role: ShipRole.DROPSHIP, size: ShipSize.LARGE, quantity: 2, status: AssetStatus.AVAILABLE, notes: "Infantry assault dropship." },
      { userId: mike.id, name: "M2 Hercules Starlifter", manufacturer: "Crusader", role: ShipRole.DROPSHIP, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE, notes: "Armed heavy transport." },
      { userId: mike.id, name: "C2 Hercules Starlifter", manufacturer: "Crusader", role: ShipRole.CARGO, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: mike.id, name: "Constellation Andromeda", manufacturer: "RSI", role: ShipRole.MULTI_ROLE, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: mike.id, name: "Cutlass Black", manufacturer: "Drake", role: ShipRole.MULTI_ROLE, size: ShipSize.MEDIUM, quantity: 2, status: AssetStatus.AVAILABLE },
      { userId: mike.id, name: "Crucible", manufacturer: "Anvil", role: ShipRole.REPAIR, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE, notes: "Field repair platform." },
      { userId: mike.id, name: "Reclaimer", manufacturer: "Aegis", role: ShipRole.SALVAGE, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: mike.id, name: "Vulture", manufacturer: "Drake", role: ShipRole.SALVAGE, size: ShipSize.SMALL, quantity: 2, status: AssetStatus.IN_GAME_PURCHASED },
      { userId: mike.id, name: "Carrack", manufacturer: "Anvil", role: ShipRole.EXPLORATION, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.PLEDGED, notes: "Deep space expedition." },
      { userId: mike.id, name: "Terrapin", manufacturer: "Anvil", role: ShipRole.SCOUT, size: ShipSize.SMALL, quantity: 1, status: AssetStatus.AVAILABLE, notes: "Armored recon." },
      { userId: mike.id, name: "Mole", manufacturer: "MISC", role: ShipRole.MINING, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: mike.id, name: "Prospector", manufacturer: "MISC", role: ShipRole.MINING, size: ShipSize.SMALL, quantity: 2, status: AssetStatus.IN_GAME_PURCHASED },
      { userId: mike.id, name: "Apollo Triage", manufacturer: "RSI", role: ShipRole.MEDICAL, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.PLEDGED },
      { userId: mike.id, name: "C8R Pisces Medic", manufacturer: "Anvil", role: ShipRole.MEDICAL, size: ShipSize.SNUB, quantity: 2, status: AssetStatus.AVAILABLE },
      // Other users' ships
      { userId: jax.id, name: "F7C-M Super Hornet", manufacturer: "Anvil", role: ShipRole.HEAVY_FIGHTER, size: ShipSize.SMALL, quantity: 2, status: AssetStatus.AVAILABLE },
      { userId: jax.id, name: "Gladius", manufacturer: "Aegis", role: ShipRole.FIGHTER, size: ShipSize.SMALL, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: nova.id, name: "C2 Hercules Starlifter", manufacturer: "Crusader", role: ShipRole.CARGO, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: nova.id, name: "Caterpillar", manufacturer: "Drake", role: ShipRole.CARGO, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: ryker.id, name: "Terrapin", manufacturer: "Anvil", role: ShipRole.SCOUT, size: ShipSize.SMALL, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: sera.id, name: "Cutlass Red", manufacturer: "Drake", role: ShipRole.MEDICAL, size: ShipSize.MEDIUM, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: ghost.id, name: "Sabre", manufacturer: "Aegis", role: ShipRole.FIGHTER, size: ShipSize.SMALL, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: titan.id, name: "Valkyrie", manufacturer: "Anvil", role: ShipRole.DROPSHIP, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: echo.id, name: "Mole", manufacturer: "MISC", role: ShipRole.MINING, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.IN_GAME_PURCHASED },
      { userId: echo.id, name: "Vulture", manufacturer: "Drake", role: ShipRole.SALVAGE, size: ShipSize.SMALL, quantity: 1, status: AssetStatus.IN_GAME_PURCHASED },
    ] });

    await prisma.groundVehicle.createMany({ data: [
      { userId: mike.id, name: "Ballista", manufacturer: "Anvil", role: VehicleRole.COMBAT, size: VehicleSize.LARGE, quantity: 2, status: AssetStatus.AVAILABLE },
      { userId: mike.id, name: "Cyclone AA", manufacturer: "Tumbril", role: VehicleRole.COMBAT, size: VehicleSize.SMALL, quantity: 4, status: AssetStatus.AVAILABLE },
      { userId: mike.id, name: "Ursa Rover", manufacturer: "RSI", role: VehicleRole.TRANSPORT, size: VehicleSize.MEDIUM, quantity: 3, status: AssetStatus.AVAILABLE },
      { userId: mike.id, name: "ROC Mining Drill", manufacturer: "Greycat", role: VehicleRole.MINING, size: VehicleSize.SMALL, quantity: 2, status: AssetStatus.IN_GAME_PURCHASED },
      { userId: titan.id, name: "Cyclone RN", manufacturer: "Tumbril", role: VehicleRole.SUPPORT, size: VehicleSize.SMALL, quantity: 2, status: AssetStatus.AVAILABLE },
      { userId: sera.id, name: "Ursa Rover", manufacturer: "RSI", role: VehicleRole.SUPPORT, size: VehicleSize.MEDIUM, quantity: 1, status: AssetStatus.AVAILABLE },
    ] });

    const now = new Date();
    const in2d = new Date(now.getTime() + 2 * 864e5);
    const in5d = new Date(now.getTime() + 5 * 864e5);
    const in10d = new Date(now.getTime() + 10 * 864e5);
    const in14d = new Date(now.getTime() + 14 * 864e5);
    const yday = new Date(now.getTime() - 864e5);
    const lastWk = new Date(now.getTime() - 7 * 864e5);

    const op1 = await prisma.operation.create({ data: { title: "Operation Red Horizon", type: OperationType.COMBINED_ARMS_ASSAULT, description: "Multi-stage assault on a Vanduul-occupied waystation near Caliban. Vanguard leads the breach, Atlas secures the extraction corridor.", objective: "Neutralize all hostile contacts and recover captured UEE equipment from outpost cargo bays.", location: "Caliban System — Waystation KR-7", threatLevel: ThreatLevel.CRITICAL, startTime: in2d, status: OperationStatus.BRIEFING, visibility: OrganizationVisibility.PUBLIC, commanderId: mike.id, organizationId: org.id, missionBrief: "Three-phase assault. Phase 1: Hammerhead suppresses perimeter turrets while fighters engage escort craft. Phase 2: Valkyrie insertion, Ghost leads breach into cargo bay Alpha. Phase 3: Atlas freight train extracts cargo while air wing holds perimeter.", commsPlan: "CMD: Command Net. AIR: Alpha Air. GROUND: Bravo Ground. MEDEVAC: Medical channel.", rulesOfEngagement: "Weapons free on all confirmed Vanduul contacts. Protect cargo containers at all costs.", rallyPoints: "Rally Alpha: 500km above waystation. Rally Bravo: docking ring C.", extractionPlan: "C2 Hercules extraction from cargo bay once Ghost confirms clear.", contingencyPlans: "If AA exceeds threshold: withdraw to Rally Alpha and request Javelin support.", requiredShips: "2x Hammerhead, 4x Fighters, 2x Valkyries, 1x C2 Hercules, 1x Medical ship", requiredPersonnel: "24 operators minimum", missionPhases: "Phase 1: Air suppression (30m) > Phase 2: Breach and clear (45m) > Phase 3: Extraction (20m) > Phase 4: Exfil",
      participants: { create: [
        { userId: mike.id, organizationId: org.id, assignedRole: "Commander", team: "Command", status: RSVPStatus.GOING },
        { userId: jax.id, organizationId: org.id, assignedRole: "Wing Commander", team: "Air Wing Alpha", status: RSVPStatus.GOING },
        { userId: nova.id, organizationId: org.id, assignedRole: "Logistics Lead", team: "Supply", status: RSVPStatus.GOING },
        { userId: ryker.id, organizationId: org.id, assignedRole: "Forward Observer", team: "Recon", status: RSVPStatus.GOING },
        { userId: sera.id, organizationId: org.id, assignedRole: "Medical Lead", team: "Medevac", status: RSVPStatus.GOING },
        { userId: ghost.id, organizationId: org.id, assignedRole: "Breach Lead", team: "Strike Alpha", status: RSVPStatus.GOING },
        { userId: titan.id, organizationId: org.id, assignedRole: "Heavy Assault", team: "Strike Alpha", status: RSVPStatus.GOING },
        { userId: vex.id, organizationId: org.id, assignedRole: "Escort Pilot", team: "Air Wing Alpha", status: RSVPStatus.GOING },
        { userId: atlasOwner.id, organizationId: atlasOrg.id, assignedRole: "Freight Lead", team: "Supply", status: RSVPStatus.GOING },
      ] },
      assets: { create: [
        { ownerUserId: mike.id, ownerOrganizationId: org.id, assetType: AssetType.FLEET_SHIP, name: "Hammerhead", manufacturer: "Aegis", role: "Fleet suppression", quantity: 2 },
        { ownerUserId: jax.id, ownerOrganizationId: org.id, assetType: AssetType.FIGHTER, name: "F7C-M Super Hornet", manufacturer: "Anvil", role: "Air escort", quantity: 3 },
        { ownerUserId: mike.id, ownerOrganizationId: org.id, assetType: AssetType.DROPSHIP, name: "Valkyrie", manufacturer: "Anvil", role: "Infantry insertion", quantity: 2 },
        { ownerUserId: nova.id, ownerOrganizationId: org.id, assetType: AssetType.CARGO_SHIP, name: "C2 Hercules", manufacturer: "Crusader", role: "Cargo extraction", quantity: 1 },
        { ownerUserId: sera.id, ownerOrganizationId: org.id, assetType: AssetType.MEDICAL_SHIP, name: "Cutlass Red", manufacturer: "Drake", role: "Medevac", quantity: 1 },
      ] },
      rsvps: { create: [
        { userId: mike.id, status: RSVPStatus.GOING, note: "Full command element confirmed." },
        { userId: jax.id, status: RSVPStatus.GOING, note: "Air wing ready. 4 pilots confirmed." },
        { userId: nova.id, status: RSVPStatus.GOING, note: "Supply train staged at Rally Alpha." },
        { userId: ryker.id, status: RSVPStatus.GOING, note: "Advance scan complete. 12 Vanduul contacts. Intel forwarded to Command." },
        { userId: sera.id, status: RSVPStatus.GOING, note: "Medical team ready." },
        { userId: ghost.id, status: RSVPStatus.GOING, note: "Breach kit loaded. Entry route confirmed." },
        { userId: titan.id, status: RSVPStatus.GOING, note: "Strike team ready." },
      ] },
    } });

    const op2 = await prisma.operation.create({ data: { title: "Operation Deep Vein", type: OperationType.MINING_SECURITY, description: "Quantanium mining expedition to Yela asteroid belt with full security escort. High yield target identified by Horizon recon.", objective: "Extract maximum quantanium yield while maintaining perimeter security.", location: "Yela Asteroid Belt — Sector Q-12", threatLevel: ThreatLevel.MODERATE, startTime: in5d, status: OperationStatus.PLANNED, visibility: OrganizationVisibility.PUBLIC, commanderId: echo.id, organizationId: org.id, missionBrief: "Echo leads mining element. Jax runs security wing. Ryker scouts for pirate activity.", requiredShips: "2x Mole, 3x Prospector, 1x Hull C, 4x Fighters", requiredPersonnel: "12 operators",
      participants: { create: [
        { userId: echo.id, organizationId: org.id, assignedRole: "Mining Lead", team: "Extraction", status: RSVPStatus.GOING },
        { userId: jax.id, organizationId: org.id, assignedRole: "Security Lead", team: "Security", status: RSVPStatus.GOING },
        { userId: ryker.id, organizationId: org.id, assignedRole: "Scout", team: "Recon", status: RSVPStatus.GOING },
        { userId: nova.id, organizationId: org.id, assignedRole: "Hauler", team: "Logistics", status: RSVPStatus.MAYBE },
      ] },
      rsvps: { create: [
        { userId: echo.id, status: RSVPStatus.GOING, note: "Rich vein confirmed in Q-12." },
        { userId: jax.id, status: RSVPStatus.GOING, note: "Security wing online." },
      ] },
    } });

    const op3 = await prisma.operation.create({ data: { title: "Operation Pale Light", type: OperationType.RESCUE_OPERATION, description: "Emergency response to damaged UEE transport reporting distress beacon near Crusader. Crew aboard, multiple casualties confirmed.", objective: "Reach disabled transport, stabilize crew, extract wounded, tow to Port Olisar.", location: "Crusader Orbit — 8,000km from Port Olisar", threatLevel: ThreatLevel.LOW, startTime: yday, status: OperationStatus.ACTIVE, visibility: OrganizationVisibility.PUBLIC, commanderId: sera.id, organizationId: org.id, missionBrief: "Sera leads medical team. Jax provides escort. Mike's Crucible handles hull repairs. Time critical — 6 casualties aboard.",
      participants: { create: [
        { userId: sera.id, organizationId: org.id, assignedRole: "Medical Lead", team: "Medical", status: RSVPStatus.GOING },
        { userId: mike.id, organizationId: org.id, assignedRole: "Repair Lead", team: "Engineering", status: RSVPStatus.GOING },
        { userId: jax.id, organizationId: org.id, assignedRole: "Escort", team: "Security", status: RSVPStatus.GOING },
      ] },
      rsvps: { create: [
        { userId: sera.id, status: RSVPStatus.GOING, note: "En route. ETA 12 minutes." },
        { userId: mike.id, status: RSVPStatus.GOING, note: "Crucible launched." },
      ] },
    } });

    const op4 = await prisma.operation.create({ data: { title: "Operation Ghost Wreck", type: OperationType.SALVAGE_OPERATION, description: "Large-scale salvage of a derelict Bengal carrier discovered by Horizon scouts near the Pyro jump point.", objective: "Extract maximum salvage value from the wreck including hull panels, components, and intact cargo.", location: "Aaron Halo — Derelict Bengal XC-7", threatLevel: ThreatLevel.HIGH, startTime: in10d, status: OperationStatus.PLANNED, visibility: OrganizationVisibility.PUBLIC, commanderId: echo.id, organizationId: org.id, missionBrief: "Reclaimer leads heavy salvage. Two Vultures strip outer hull. Ghost leads internal access for high-value components. Hammerhead provides overwatch.",
      participants: { create: [
        { userId: echo.id, organizationId: org.id, assignedRole: "Salvage Lead", team: "Salvage", status: RSVPStatus.GOING },
        { userId: ghost.id, organizationId: org.id, assignedRole: "Internal Access Lead", team: "Breach", status: RSVPStatus.GOING },
        { userId: mike.id, organizationId: org.id, assignedRole: "Overwatch", team: "Security", status: RSVPStatus.STANDBY },
      ] },
      rsvps: { create: [{ userId: echo.id, status: RSVPStatus.GOING, note: "Reclaimer staged. Horizon provided full scan." }] },
    } });

    const op5 = await prisma.operation.create({ data: { title: "Operation Iron Lantern", type: OperationType.FLEET_PATROL, description: "Multi-system patrol to assert presence and deter piracy along Stanton trade routes.", objective: "Complete 4-system patrol loop without significant friendly casualties.", location: "Stanton System — Full patrol circuit", threatLevel: ThreatLevel.MODERATE, startTime: lastWk, endTime: new Date(lastWk.getTime() + 4 * 3600000), status: OperationStatus.COMPLETED, visibility: OrganizationVisibility.PUBLIC, commanderId: mike.id, organizationId: org.id,
      participants: { create: [
        { userId: mike.id, organizationId: org.id, assignedRole: "Fleet Lead", team: "Command", status: RSVPStatus.GOING },
        { userId: jax.id, organizationId: org.id, assignedRole: "Wing Lead", team: "Air Wing", status: RSVPStatus.GOING },
        { userId: ryker.id, organizationId: org.id, assignedRole: "Scanner", team: "Recon", status: RSVPStatus.GOING },
        { userId: vex.id, organizationId: org.id, assignedRole: "Escort Pilot", team: "Air Wing", status: RSVPStatus.GOING },
      ] },
    } });

    const op6 = await prisma.operation.create({ data: { title: "Operation Trident Shield", type: OperationType.JOINT_FLEET_EXERCISE, description: "Large-scale joint fleet exercise involving all three coalition organizations. Practice coordinated engagement and fleet communication protocols.", objective: "Test inter-org communication, fleet maneuvering, and logistics chain under simulated combat conditions.", location: "Lagrange Point — L3 Stanton", threatLevel: ThreatLevel.LOW, startTime: in14d, status: OperationStatus.PLANNED, visibility: OrganizationVisibility.PUBLIC, commanderId: mike.id, organizationId: org.id, missionBrief: "Vanguard runs combat element. Atlas handles supply and support. Horizon runs EW and scanning simulations.", requiredPersonnel: "30+ operators across all orgs",
      participants: { create: [
        { userId: mike.id, organizationId: org.id, assignedRole: "Exercise Commander", team: "Command", status: RSVPStatus.GOING },
        { userId: jax.id, organizationId: org.id, assignedRole: "Red Team Lead", team: "Red Force", status: RSVPStatus.GOING },
        { userId: atlasOwner.id, organizationId: atlasOrg.id, assignedRole: "Blue Team Support", team: "Blue Support", status: RSVPStatus.GOING },
        { userId: horizonOwner.id, organizationId: horizonOrg.id, assignedRole: "EW Lead", team: "Intel", status: RSVPStatus.MAYBE },
      ] },
      rsvps: { create: [
        { userId: mike.id, status: RSVPStatus.GOING, note: "Full fleet exercise. Bring everything." },
        { userId: jax.id, status: RSVPStatus.GOING, note: "Red team will not hold back." },
        { userId: atlasOwner.id, status: RSVPStatus.GOING, note: "Atlas bringing 5 ships." },
      ] },
    } });

    const c1 = await prisma.comment.create({ data: { operationId: op1.id, userId: jax.id, body: "Air wing prepped. Request staging at Rally Alpha 1 hour before insertion for formation practice." } });
    const c2 = await prisma.comment.create({ data: { operationId: op1.id, userId: ryker.id, body: "Pre-op scan complete. 12 Vanduul contacts — mix of fighters and medium platform near docking ring B. Sending full report to Command Net." } });
    const c3 = await prisma.comment.create({ data: { operationId: op1.id, userId: mike.id, body: "Good work Ryker. Jax — adjust ingress vector to approach from the station's shadow. Ghost — confirm breach kit for secondary entry on ring B." } });
    await prisma.comment.create({ data: { operationId: op1.id, userId: ghost.id, body: "Confirmed. Secondary breach kit loaded. Can hit ring A and B simultaneously if you want to split the teams." } });
    await prisma.comment.create({ data: { operationId: op2.id, userId: echo.id, body: "Horizon scan shows 85% quantanium concentration in Q-12. This is going to be a good run." } });
    await prisma.comment.create({ data: { operationId: op3.id, userId: sera.id, body: "Update: 4 of 6 casualties stabilized. Two critical still aboard. Crucible has patched hull breach." } });
    await prisma.comment.create({ data: { operationId: op5.id, userId: mike.id, body: "Patrol complete. Clean run — zero significant contacts. The deterrence effect is working." } });

    await prisma.commentReaction.createMany({ data: [
      { commentId: c1.id, userId: mike.id, emoji: "✅" },
      { commentId: c2.id, userId: mike.id, emoji: "🔍" },
      { commentId: c2.id, userId: jax.id, emoji: "👀" },
      { commentId: c3.id, userId: jax.id, emoji: "🫡" },
    ] });

    await prisma.afterActionReport.create({ data: { operationId: op5.id, authorId: mike.id, summary: "Stanton patrol circuit completed in 4h 12m. Zero friendly losses. Two pirate contacts deterred without engagement.", whatWentWell: "Formation discipline was excellent. Comms were clear. Ryker's scanner work gave advance notice on both contacts.", whatWentWrong: "Minor fuel miscalculation on leg 3 — one Hammerhead diverted for refuel. Added 15 minutes.", lessonsLearned: "Calculate fuel for full circuit plus 20% buffer. Pre-stage fuel at L1 and L3.", recommendations: "Pre-stage tankers at L3 for future patrols. Add designated fuel coordinator role." } });

    await prisma.coalition.create({ data: { name: "Iron Trident Accord", description: "Combined operations pact. Mutual defense, intelligence sharing, and joint operational planning.", createdById: mike.id, commandNotes: "Vanguard: combat lead. Atlas: logistics. Horizon: intel and recon.", members: { create: [{ organizationId: org.id, responsibility: "Combat operations, fleet command" }, { organizationId: atlasOrg.id, responsibility: "Logistics, cargo extraction" }, { organizationId: horizonOrg.id, responsibility: "Intelligence, scanning" }] } } });
    await prisma.alliance.create({ data: { name: "UEE Outer Rim Defense Pact", description: "Formal mutual-defense agreement for UEE system security operations.", createdById: mike.id, members: { create: [{ organizationId: org.id }, { organizationId: atlasOrg.id }] } } });

    const tacCat = await prisma.socialCategory.create({ data: { name: "Tactics & Strategy", slug: "tactics-strategy", description: "Fleet tactics, ground ops, combat theory.", createdById: mike.id } });
    const gearCat = await prisma.socialCategory.create({ data: { name: "Ships & Loadouts", slug: "ships-loadouts", description: "Ship reviews, weapon loadouts, build guides.", createdById: mike.id } });
    const newsCat = await prisma.socialCategory.create({ data: { name: "Star Citizen News", slug: "sc-news", description: "Game updates, PTU patches, dev news.", createdById: mike.id } });
    const orgCat = await prisma.socialCategory.create({ data: { name: "Org Announcements", slug: "org-announcements", description: "Official Vanguard Collective announcements.", createdById: mike.id } });

    const post1 = await prisma.socialPost.create({ data: { title: "Operation Red Horizon — Final Briefing Notes", body: "All members in Red Horizon — review the updated breach plan. Ghost has identified a secondary entry point on ring B. Full briefing in Command Net. Be at Rally Alpha 60 minutes before op start.\n\n— Commander ZeroZone93", type: SocialPostType.TOPIC, pinned: true, authorId: mike.id, categoryId: orgCat.id, organizationId: org.id } });
    await prisma.socialPost.create({ data: { title: "Hammerhead vs Polaris — Which is Better for Our Ops?", body: "Been thinking about our fleet composition after last patrol. Hammerhead is incredible for anti-fighter work but Polaris has that torpedo battery for capital engagements. With the Vanduul threat growing, should we be looking at more capital-busting firepower?", type: SocialPostType.QUESTION, authorId: jax.id, categoryId: gearCat.id, organizationId: org.id } });
    await prisma.socialPost.create({ data: { title: "Quantum Travel Formation — Tips for Keeping the Fleet Together", body: "After last patrol's fuel incident, here are quantum travel formation best practices:\n\n1. Designate a formation lead — everyone sets quantum target on lead ship\n2. Use 'hold' comms before entering quantum so stragglers can catch up\n3. Pre-plot waypoints for better control\n4. Assign a sweep ship at rear to ensure no one gets left behind", type: SocialPostType.GUIDELINE, authorId: ryker.id, categoryId: tacCat.id, organizationId: org.id } });
    await prisma.socialPost.create({ data: { title: "Patch Notes Summary — What Changed That Affects Our Operations", body: "Key changes this patch:\n\n- Cargo refactor live. All cargo uses grid-based loading. Nova's C2 run needs adjusted procedures.\n- Medical gameplay expanded. Sera's Cutlass Red now supports advanced trauma care.\n- Vanduul AI improved — expect Red Horizon contacts to be more aggressive.\n\nMike has updated the op plan. Check Command Net for details.", type: SocialPostType.TOPIC, authorId: nova.id, categoryId: newsCat.id } });

    await prisma.socialPostReply.createMany({ data: [
      { postId: post1.id, authorId: jax.id, body: "Confirmed. Air wing briefing tonight 20:00 UTC. All pilots must attend." },
      { postId: post1.id, authorId: ghost.id, body: "Breach plan updated. Ring B entry requires breach charges — everyone on my team confirm they have them loaded." },
      { postId: post1.id, authorId: sera.id, body: "Medical plan filed. Medevac channel standing by from op start. Any casualties: call MEDEVAC and your grid." },
      { postId: post1.id, authorId: nova.id, body: "Supply train staged. 60 medpens, 4x ammo, 8x repair kits loaded at Rally Alpha." },
    ] });

    const commandNet = await prisma.conversation.create({ data: { title: "Command Net", description: "Encrypted command channel for op planning and officer coordination.", isChannel: true, organizationId: org.id, createdById: mike.id, participants: { create: [{ userId: mike.id }, { userId: jax.id }, { userId: nova.id }, { userId: ryker.id }, { userId: sera.id }, { userId: ghost.id }, { userId: titan.id }, { userId: echo.id }] } } });
    const general = await prisma.conversation.create({ data: { title: "General — Vanguard", description: "All-members general channel.", isChannel: true, organizationId: org.id, createdById: mike.id, participants: { create: [{ userId: mike.id }, { userId: jax.id }, { userId: nova.id }, { userId: ryker.id }, { userId: sera.id }, { userId: ghost.id }, { userId: titan.id }, { userId: echo.id }, { userId: vex.id }, { userId: lia.id }] } } });

    const m1 = await prisma.message.create({ data: { conversationId: commandNet.id, senderId: mike.id, body: "Red Horizon briefing in 48 hours. Officers: post readiness checks here by tomorrow 18:00 UTC." } });
    const m2 = await prisma.message.create({ data: { conversationId: commandNet.id, senderId: ryker.id, body: "Recon complete. 12 Vanduul contacts confirmed. Full scan packet ready. Recommend revised ingress via station shadow." } });
    const m3 = await prisma.message.create({ data: { conversationId: commandNet.id, senderId: jax.id, body: "Air wing: 4 confirmed pilots. All ships fueled and armed. Shadow ingress works — lower detection risk." } });
    await prisma.message.create({ data: { conversationId: commandNet.id, senderId: nova.id, body: "Supply train: 60 medpens, 4x ammo, 8x repair kits staged at Rally Alpha. Waiting on final headcount." } });
    await prisma.message.create({ data: { conversationId: commandNet.id, senderId: ghost.id, body: "Strike team: 6 confirmed. Breach kit for ring A and B loaded. Requesting 5 min early insertion for quiet approach." } });
    await prisma.message.create({ data: { conversationId: commandNet.id, senderId: mike.id, body: "Granted Ghost. Ingress 5 min early, mark positions on grid before main element arrives. Good hunting everyone." } });
    await prisma.message.create({ data: { conversationId: general.id, senderId: mike.id, body: "Welcome to Vanguard Collective. Big op coming up — check the ops board. More ops planned after Red Horizon." } });
    await prisma.message.create({ data: { conversationId: general.id, senderId: jax.id, body: "If anyone needs fighter practice before Red Horizon hit me up for wing drills." } });
    const lm = await prisma.message.create({ data: { conversationId: general.id, senderId: vex.id, body: "Excited for my first op! What should I bring?" } });
    await prisma.message.create({ data: { conversationId: general.id, senderId: jax.id, body: "Full loadout, extra ammo, medpens. See you at Rally Alpha." } });

    await prisma.messageReaction.createMany({ data: [
      { messageId: m1.id, userId: jax.id, emoji: "🫡" },
      { messageId: m1.id, userId: nova.id, emoji: "✅" },
      { messageId: m2.id, userId: mike.id, emoji: "🔍" },
      { messageId: m3.id, userId: mike.id, emoji: "🔥" },
      { messageId: lm.id, userId: jax.id, emoji: "💪" },
    ] });

    await prisma.notification.createMany({ data: [
      { userId: mike.id, type: NotificationType.OP_UPDATE, title: "Op Red Horizon — Briefing Stage", body: "Operation Red Horizon has entered briefing phase. 2 days to launch.", link: `/operations/${op1.id}`, read: false },
      { userId: mike.id, type: NotificationType.SYSTEM, title: "Coalition Exercise Confirmed", body: "Horizon Deep Space confirmed for Operation Trident Shield.", link: `/operations/${op6.id}`, read: false },
      { userId: jax.id, type: NotificationType.OP_ASSIGNMENT, title: "Assigned: Wing Commander — Red Horizon", body: "You are assigned as Wing Commander for Operation Red Horizon.", link: `/operations/${op1.id}`, read: false },
      { userId: nova.id, type: NotificationType.OP_ASSIGNMENT, title: "Assigned: Logistics Director — Red Horizon", body: "You are assigned as Logistics Director for Operation Red Horizon.", link: `/operations/${op1.id}`, read: false },
      { userId: ryker.id, type: NotificationType.OP_UPDATE, title: "Intel submission acknowledged", body: "Your pre-op scan for Red Horizon has been acknowledged by Command.", link: `/operations/${op1.id}`, read: true },
      { userId: sera.id, type: NotificationType.OP_ASSIGNMENT, title: "Assigned: Medical Lead — Pale Light", body: "You are assigned as Medical Lead for Operation Pale Light.", link: `/operations/${op3.id}`, read: false },
      { userId: ghost.id, type: NotificationType.OP_UPDATE, title: "Breach plan updated — Red Horizon", body: "Commander has updated the breach plan. Review required.", link: `/operations/${op1.id}`, read: false },
      { userId: echo.id, type: NotificationType.OP_ASSIGNMENT, title: "Mining Op Confirmed — Deep Vein", body: "Operation Deep Vein confirmed. You are leading the mining element.", link: `/operations/${op2.id}`, read: false },
    ] });

    await prisma.activityFeedItem.createMany({ data: [
      { type: "organization_bulletin", title: "Red Horizon enters briefing phase", body: "Operation Red Horizon has reached briefing stage. All participants notified.", organizationId: org.id, userId: mike.id, operationId: op1.id },
      { type: "operation_created", title: "Operation Deep Vein posted", body: "Echo Station posted mining expedition to Yela Q-12.", organizationId: org.id, userId: echo.id, operationId: op2.id },
      { type: "operation_created", title: "Operation Ghost Wreck planned", body: "New salvage operation targeting derelict Bengal. High threat, exceptional reward.", organizationId: org.id, userId: echo.id, operationId: op4.id },
      { type: "operation_completed", title: "Operation Iron Lantern complete", body: "Stanton patrol completed. Zero losses. Excellent work Vanguard.", organizationId: org.id, userId: mike.id, operationId: op5.id },
      { type: "organization_bulletin", title: "Coalition exercise scheduled", body: "Operation Trident Shield — largest exercise yet. All three coalition orgs.", organizationId: org.id, userId: mike.id, operationId: op6.id },
    ] });

    await prisma.userFollow.createMany({ data: [
      { followerId: jax.id, followingId: mike.id },
      { followerId: nova.id, followingId: mike.id },
      { followerId: ryker.id, followingId: mike.id },
      { followerId: sera.id, followingId: mike.id },
      { followerId: ghost.id, followingId: mike.id },
      { followerId: titan.id, followingId: mike.id },
      { followerId: echo.id, followingId: mike.id },
      { followerId: mike.id, followingId: jax.id },
      { followerId: mike.id, followingId: ryker.id },
      { followerId: vex.id, followingId: mike.id },
    ] });

    return NextResponse.json({
      success: true,
      message: "Demo seed complete",
      accounts: {
        leader: { email: "mike@starcitizenopps.com", password: "StarOps!Demo2026", role: "SITE_ADMIN / Org Commander" },
        officers: [
          { email: "jax@starcitizenopps.com", password: "Member!2026", role: "Officer - Wing Commander" },
          { email: "nova@starcitizenopps.com", password: "Member!2026", role: "Officer - Logistics Director" },
        ],
        commanders: [
          { email: "ryker@starcitizenopps.com", password: "Member!2026", role: "Commander - Recon" },
          { email: "sera@starcitizenopps.com", password: "Member!2026", role: "Commander - Medical Lead" },
        ],
        teamLeaders: [
          { email: "ghost@starcitizenopps.com", password: "Member!2026", role: "Team Leader - Special Ops" },
          { email: "titan@starcitizenopps.com", password: "Member!2026", role: "Team Leader - Ground Strike" },
          { email: "echo@starcitizenopps.com", password: "Member!2026", role: "Team Leader - Industrial" },
        ],
        members: [
          { email: "vex@starcitizenopps.com", password: "Member!2026", role: "Member" },
          { email: "lia@starcitizenopps.com", password: "Member!2026", role: "Member" },
        ],
      },
      stats: { ships: 35, operations: 6, users: 13, organizations: 3 },
    });
  } catch (err) {
    console.error("Demo seed error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
