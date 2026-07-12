/**
 * Demo seed script — creates a fully populated demo environment for showcasing the app.
 * Run with: ALLOW_REMOTE_SEED=true npx ts-node scripts/seed-demo.ts
 *
 * DEMO LEADER LOGIN:
 *   Email:    mike@starcitizenopps.com
 *   Password: StarOps!Demo2026
 */
import "dotenv/config";
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

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function assertAllowed() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required.");
  const isLocal = /(localhost|127\.0\.0\.1|postgres:postgres@db|postgres:postgres@localhost)/i.test(url);
  const allowRemote = process.env.ALLOW_REMOTE_SEED === "true";
  if (!isLocal && !allowRemote) {
    throw new Error("Refusing to seed non-local database. Set ALLOW_REMOTE_SEED=true to proceed.");
  }
}

async function main() {
  assertAllowed();

  console.log("🗑️  Clearing existing data...");

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

  console.log("👤 Creating users...");

  // ─── DEMO LEADER (Mike) ─────────────────────────────────────────────────────
  const mike = await prisma.user.create({
    data: {
      name: "Mike Commander",
      email: "mike@starcitizenopps.com",
      passwordHash: demoPassword,
      starCitizenHandle: "ZeroZone93",
      bio: "Founder of Vanguard Collective. Combat veteran, fleet strategist, and org builder. Built StarCitizenOps to give players the command tools they deserve.",
      timezone: "UTC",
      availability: "Evenings & Weekends",
      preferredRoles: ["Commander", "Fleet Lead", "Strategist"],
      siteRole: SiteRole.SITE_ADMIN,
      termsAcceptedAt: new Date(),
      termsAcceptedVersion: "1.0",
    },
  });

  // ─── OFFICERS ────────────────────────────────────────────────────────────────
  const jax = await prisma.user.create({
    data: {
      name: "Jax Volkov",
      email: "jax@starcitizenopps.com",
      passwordHash: memberPassword,
      starCitizenHandle: "JaxVolkov",
      bio: "Fighter ace and wing commander. Prefers aggressive intercept tactics.",
      timezone: "UTC-5",
      availability: "Weeknights",
      preferredRoles: ["Fighter Pilot", "Wing Commander", "Intercept Lead"],
      termsAcceptedAt: new Date(),
      termsAcceptedVersion: "1.0",
    },
  });

  const nova = await prisma.user.create({
    data: {
      name: "Nova Sinclair",
      email: "nova@starcitizenopps.com",
      passwordHash: memberPassword,
      starCitizenHandle: "NovaSinclair",
      bio: "Logistics and supply chain specialist. Keeps the fleet fueled and armed.",
      timezone: "UTC+1",
      availability: "Flexible",
      preferredRoles: ["Logistics", "Cargo", "Supply"],
      termsAcceptedAt: new Date(),
      termsAcceptedVersion: "1.0",
    },
  });

  const ryker = await prisma.user.create({
    data: {
      name: "Ryker Ash",
      email: "ryker@starcitizenopps.com",
      passwordHash: memberPassword,
      starCitizenHandle: "RykerAsh",
      bio: "Recon and forward observer. Specializes in electronic warfare and long-range scanning.",
      timezone: "UTC+2",
      availability: "Most evenings",
      preferredRoles: ["Recon", "Scanner", "EW Operator"],
      termsAcceptedAt: new Date(),
      termsAcceptedVersion: "1.0",
    },
  });

  const sera = await prisma.user.create({
    data: {
      name: "Sera Vance",
      email: "sera@starcitizenopps.com",
      passwordHash: memberPassword,
      starCitizenHandle: "SeraVance",
      bio: "Combat medic and rescue pilot. No one gets left behind on her watch.",
      timezone: "UTC-3",
      availability: "Weekends",
      preferredRoles: ["Medic", "Rescue Pilot", "Support"],
      termsAcceptedAt: new Date(),
      termsAcceptedVersion: "1.0",
    },
  });

  // ─── TEAM LEADERS ────────────────────────────────────────────────────────────
  const ghost = await prisma.user.create({
    data: {
      name: "Ghost Six",
      email: "ghost@starcitizenopps.com",
      passwordHash: memberPassword,
      starCitizenHandle: "GhostSix",
      bio: "Special operations insertion lead. Silent approach, decisive strike.",
      timezone: "UTC",
      availability: "Late nights",
      preferredRoles: ["Infiltration", "Boarding", "FPS Combat"],
      termsAcceptedAt: new Date(),
      termsAcceptedVersion: "1.0",
    },
  });

  const titan = await prisma.user.create({
    data: {
      name: "Titan Rex",
      email: "titan@starcitizenopps.com",
      passwordHash: memberPassword,
      starCitizenHandle: "TitanRex",
      bio: "Heavy assault and breach specialist. Runs the ground strike element.",
      timezone: "UTC",
      availability: "Weeknights & Weekends",
      preferredRoles: ["Infantry", "Breach", "Heavy Assault"],
      termsAcceptedAt: new Date(),
      termsAcceptedVersion: "1.0",
    },
  });

  const echo = await prisma.user.create({
    data: {
      name: "Echo Station",
      email: "echo@starcitizenopps.com",
      passwordHash: memberPassword,
      starCitizenHandle: "EchoStation",
      bio: "Mining and salvage expert. Finds value where others see wreckage.",
      timezone: "UTC+3",
      availability: "Most days",
      preferredRoles: ["Mining", "Salvage", "Engineer"],
      termsAcceptedAt: new Date(),
      termsAcceptedVersion: "1.0",
    },
  });

  // ─── REGULAR MEMBERS ─────────────────────────────────────────────────────────
  const members = await Promise.all([
    prisma.user.create({ data: { name: "Vex Calloway", email: "vex@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "VexCalloway", bio: "Freelance pilot looking for a real home.", timezone: "UTC", availability: "Weekends", preferredRoles: ["Pilot"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" } }),
    prisma.user.create({ data: { name: "Lia Storm", email: "lia@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "LiaStorm", bio: "Hauler turned combat pilot. Still learning.", timezone: "UTC-6", availability: "Evenings", preferredRoles: ["Cargo", "Pilot"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" } }),
    prisma.user.create({ data: { name: "Dax Winters", email: "dax@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "DaxWinters", bio: "Long-time Star Citizen vet. Love the game, love the community.", timezone: "UTC+1", availability: "Flexible", preferredRoles: ["Multi-role"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" } }),
    prisma.user.create({ data: { name: "Kira Nox", email: "kira@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "KiraNox", bio: "Racing pilot moonlighting as fighter escort.", timezone: "UTC+9", availability: "Weekends", preferredRoles: ["Racing", "Scout"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" } }),
    prisma.user.create({ data: { name: "Orion Blake", email: "orion@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "OrionBlake", bio: "Exploration and cartography nerd. The 'verse is too big not to map.", timezone: "UTC+5", availability: "Mornings", preferredRoles: ["Explorer", "Scout", "Science"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" } }),
  ]);

  // ─── PARTNER ORG USERS ───────────────────────────────────────────────────────
  const atlasOwner = await prisma.user.create({
    data: { name: "Atlas Prime", email: "atlas@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "AtlasPrime", bio: "Industrial logistics corp CEO.", timezone: "UTC-4", availability: "Business hours + evenings", preferredRoles: ["Logistics", "Trade", "Management"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" },
  });

  const horizonOwner = await prisma.user.create({
    data: { name: "Horizon Lead", email: "horizon@starcitizenopps.com", passwordHash: memberPassword, starCitizenHandle: "HorizonLead", bio: "Exploration org lead. Deep space is where we live.", timezone: "UTC+7", availability: "Evenings", preferredRoles: ["Explorer", "Science", "Navigation"], termsAcceptedAt: new Date(), termsAcceptedVersion: "1.0" },
  });

  console.log("🏛️  Creating organizations...");

  // ─── MAIN ORG: VANGUARD COLLECTIVE ───────────────────────────────────────────
  const org = await prisma.organization.create({
    data: {
      name: "Vanguard Collective",
      tag: "VGRD",
      description: "Elite combined-arms organization built for tactical fleet operations, ground assaults, and coordinated multi-org campaigns. Founded by ZeroZone93 for serious players who want real military-style coordination without the drama.",
      focusType: OrganizationFocusType.MILITARY,
      visibility: OrganizationVisibility.PUBLIC,
      ownerId: mike.id,
    },
  });

  // Create members with varied privileges
  const mikeOrgMember = await prisma.organizationMember.create({ data: { userId: mike.id, organizationId: org.id, role: OrganizationMemberRole.OWNER, title: "Commander-in-Chief" } });
  const jaxOrgMember = await prisma.organizationMember.create({ data: { userId: jax.id, organizationId: org.id, role: OrganizationMemberRole.OFFICER, title: "Wing Commander" } });
  const novaOrgMember = await prisma.organizationMember.create({ data: { userId: nova.id, organizationId: org.id, role: OrganizationMemberRole.OFFICER, title: "Logistics Director" } });
  const rykerOrgMember = await prisma.organizationMember.create({ data: { userId: ryker.id, organizationId: org.id, role: OrganizationMemberRole.COMMANDER, title: "Recon Commander" } });
  const seraOrgMember = await prisma.organizationMember.create({ data: { userId: sera.id, organizationId: org.id, role: OrganizationMemberRole.COMMANDER, title: "Medical Lead" } });
  const ghostOrgMember = await prisma.organizationMember.create({ data: { userId: ghost.id, organizationId: org.id, role: OrganizationMemberRole.TEAM_LEADER, title: "Special Ops Lead" } });
  const titanOrgMember = await prisma.organizationMember.create({ data: { userId: titan.id, organizationId: org.id, role: OrganizationMemberRole.TEAM_LEADER, title: "Ground Strike Lead" } });
  const echoOrgMember = await prisma.organizationMember.create({ data: { userId: echo.id, organizationId: org.id, role: OrganizationMemberRole.TEAM_LEADER, title: "Industrial Lead" } });
  const memberEntries = await Promise.all(
    members.map((m) => prisma.organizationMember.create({ data: { userId: m.id, organizationId: org.id, role: OrganizationMemberRole.MEMBER, title: "Operator" } }))
  );

  // App privileges for officers
  await prisma.organizationMemberAppPrivilege.createMany({
    data: [
      { organizationMemberId: jaxOrgMember.id, editOrganization: false, inviteMembers: true, createOperation: true, editOperation: true, assignRoles: true, inviteOrganizations: false, viewPrivateOperations: true, postAfterActionReports: true, manageChannels: true },
      { organizationMemberId: novaOrgMember.id, editOrganization: true, inviteMembers: true, createOperation: true, editOperation: true, assignRoles: false, inviteOrganizations: true, viewPrivateOperations: true, postAfterActionReports: true, manageChannels: true },
      { organizationMemberId: rykerOrgMember.id, editOrganization: false, inviteMembers: false, createOperation: true, editOperation: true, assignRoles: false, inviteOrganizations: false, viewPrivateOperations: true, postAfterActionReports: true, manageChannels: false },
      { organizationMemberId: seraOrgMember.id, editOrganization: false, inviteMembers: false, createOperation: false, editOperation: false, assignRoles: false, inviteOrganizations: false, viewPrivateOperations: true, postAfterActionReports: true, manageChannels: false },
      { organizationMemberId: ghostOrgMember.id, editOrganization: false, inviteMembers: false, createOperation: true, editOperation: false, assignRoles: false, inviteOrganizations: false, viewPrivateOperations: true, postAfterActionReports: false, manageChannels: false },
      { organizationMemberId: titanOrgMember.id, editOrganization: false, inviteMembers: false, createOperation: false, editOperation: false, assignRoles: false, inviteOrganizations: false, viewPrivateOperations: false, postAfterActionReports: true, manageChannels: false },
    ],
  });

  // ─── PARTNER ORG: ATLAS FREIGHT ──────────────────────────────────────────────
  const atlasOrg = await prisma.organization.create({
    data: {
      name: "Atlas Freight Corp",
      tag: "ATFC",
      description: "Industrial logistics powerhouse. We move everything from food rations to capitol ship parts. Coalition partners for supply chain operations.",
      focusType: OrganizationFocusType.LOGISTICS,
      visibility: OrganizationVisibility.PUBLIC,
      ownerId: atlasOwner.id,
      members: { create: [{ userId: atlasOwner.id, role: OrganizationMemberRole.OWNER, title: "CEO" }, { userId: nova.id, role: OrganizationMemberRole.OFFICER, title: "Joint Liaison" }, { userId: echo.id, role: OrganizationMemberRole.MEMBER, title: "Field Agent" }] },
    },
  });

  // ─── PARTNER ORG: HORIZON EXPLORERS ──────────────────────────────────────────
  const horizonOrg = await prisma.organization.create({
    data: {
      name: "Horizon Deep Space",
      tag: "HRZN",
      description: "Exploration and cartography organization dedicated to mapping the unknown. Also provides strategic intelligence to allied combat orgs.",
      focusType: OrganizationFocusType.EXPLORATION,
      visibility: OrganizationVisibility.PUBLIC,
      ownerId: horizonOwner.id,
      members: { create: [{ userId: horizonOwner.id, role: OrganizationMemberRole.OWNER, title: "Chief Navigator" }, { userId: ryker.id, role: OrganizationMemberRole.OFFICER, title: "Tactical Recon Liaison" }] },
    },
  });

  console.log("🚀 Creating fleet (Mike's ships)...");

  // ─── MIKE'S BIG FLEET ────────────────────────────────────────────────────────
  await prisma.ship.createMany({
    data: [
      // Capital & large warships
      { userId: mike.id, name: "Javelin Destroyer", manufacturer: "Aegis", role: ShipRole.CAPITAL, size: ShipSize.CAPITAL, quantity: 1, status: AssetStatus.PLEDGED, notes: "Flagship. Command operations only." },
      { userId: mike.id, name: "Hammerhead", manufacturer: "Aegis", role: ShipRole.CORVETTE, size: ShipSize.LARGE, quantity: 2, status: AssetStatus.AVAILABLE, notes: "Fleet escort and anti-ship." },
      { userId: mike.id, name: "Idris-P Frigate", manufacturer: "Aegis", role: ShipRole.CAPITAL, size: ShipSize.CAPITAL, quantity: 1, status: AssetStatus.PLEDGED, notes: "Operations planning vessel." },
      // Fighters
      { userId: mike.id, name: "Gladius", manufacturer: "Aegis", role: ShipRole.FIGHTER, size: ShipSize.SMALL, quantity: 3, status: AssetStatus.AVAILABLE, notes: "Light intercept wing." },
      { userId: mike.id, name: "Sabre", manufacturer: "Aegis", role: ShipRole.FIGHTER, size: ShipSize.SMALL, quantity: 2, status: AssetStatus.AVAILABLE, notes: "Stealth strike wing." },
      { userId: mike.id, name: "Vanguard Harbinger", manufacturer: "Aegis", role: ShipRole.BOMBER, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE, notes: "Anti-capital strike." },
      { userId: mike.id, name: "Eclipse", manufacturer: "Aegis", role: ShipRole.BOMBER, size: ShipSize.MEDIUM, quantity: 1, status: AssetStatus.AVAILABLE, notes: "Stealth bomber." },
      { userId: mike.id, name: "F7C-M Super Hornet", manufacturer: "Anvil", role: ShipRole.HEAVY_FIGHTER, size: ShipSize.SMALL, quantity: 4, status: AssetStatus.AVAILABLE, notes: "Main fighter squadron." },
      { userId: mike.id, name: "Hurricane", manufacturer: "Anvil", role: ShipRole.HEAVY_FIGHTER, size: ShipSize.MEDIUM, quantity: 2, status: AssetStatus.AVAILABLE, notes: "Heavy dogfighter." },
      { userId: mike.id, name: "Arrow", manufacturer: "Anvil", role: ShipRole.INTERCEPTOR, size: ShipSize.SMALL, quantity: 3, status: AssetStatus.AVAILABLE, notes: "Fast intercept." },
      // Multi-role
      { userId: mike.id, name: "Constellation Andromeda", manufacturer: "RSI", role: ShipRole.MULTI_ROLE, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE, notes: "Multi-crew ops and trade." },
      { userId: mike.id, name: "Cutlass Black", manufacturer: "Drake", role: ShipRole.MULTI_ROLE, size: ShipSize.MEDIUM, quantity: 2, status: AssetStatus.AVAILABLE, notes: "Versatile crew ship." },
      { userId: mike.id, name: "Freelancer MAX", manufacturer: "MISC", role: ShipRole.CARGO, size: ShipSize.MEDIUM, quantity: 1, status: AssetStatus.AVAILABLE, notes: "Light cargo and crew." },
      // Dropships & transport
      { userId: mike.id, name: "Valkyrie", manufacturer: "Anvil", role: ShipRole.DROPSHIP, size: ShipSize.LARGE, quantity: 2, status: AssetStatus.AVAILABLE, notes: "Infantry assault dropship." },
      { userId: mike.id, name: "C2 Hercules Starlifter", manufacturer: "Crusader", role: ShipRole.CARGO, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE, notes: "Heavy cargo lift." },
      { userId: mike.id, name: "M2 Hercules Starlifter", manufacturer: "Crusader", role: ShipRole.DROPSHIP, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE, notes: "Armed heavy transport." },
      // Repair & support
      { userId: mike.id, name: "Crucible", manufacturer: "Anvil", role: ShipRole.REPAIR, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE, notes: "Field repair platform." },
      { userId: mike.id, name: "Vulture", manufacturer: "Drake", role: ShipRole.SALVAGE, size: ShipSize.SMALL, quantity: 2, status: AssetStatus.IN_GAME_PURCHASED, notes: "Fast salvage sweep." },
      { userId: mike.id, name: "Reclaimer", manufacturer: "Aegis", role: ShipRole.SALVAGE, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE, notes: "Large salvage operations." },
      // Recon & exploration
      { userId: mike.id, name: "Terrapin", manufacturer: "Anvil", role: ShipRole.SCOUT, size: ShipSize.SMALL, quantity: 1, status: AssetStatus.AVAILABLE, notes: "Armored recon." },
      { userId: mike.id, name: "Carrack", manufacturer: "Anvil", role: ShipRole.EXPLORATION, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.PLEDGED, notes: "Deep space expedition." },
      { userId: mike.id, name: "Aquila", manufacturer: "RSI", role: ShipRole.EXPLORATION, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE, notes: "Long range exploration." },
      // Mining
      { userId: mike.id, name: "Prospector", manufacturer: "MISC", role: ShipRole.MINING, size: ShipSize.SMALL, quantity: 2, status: AssetStatus.IN_GAME_PURCHASED, notes: "Solo mining." },
      { userId: mike.id, name: "Mole", manufacturer: "MISC", role: ShipRole.MINING, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE, notes: "Multi-crew mining." },
      // Medical
      { userId: mike.id, name: "C8R Pisces Medic", manufacturer: "Anvil", role: ShipRole.MEDICAL, size: ShipSize.SNUB, quantity: 2, status: AssetStatus.AVAILABLE, notes: "Quick response medevac." },
      { userId: mike.id, name: "Apollo Triage", manufacturer: "RSI", role: ShipRole.MEDICAL, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.PLEDGED, notes: "Mobile hospital." },
    ],
  });

  // Other users' ships
  await prisma.ship.createMany({
    data: [
      { userId: jax.id, name: "Gladius", manufacturer: "Aegis", role: ShipRole.FIGHTER, size: ShipSize.SMALL, quantity: 2, status: AssetStatus.AVAILABLE },
      { userId: jax.id, name: "F7C-M Super Hornet", manufacturer: "Anvil", role: ShipRole.HEAVY_FIGHTER, size: ShipSize.SMALL, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: jax.id, name: "Buccaneer", manufacturer: "Drake", role: ShipRole.FIGHTER, size: ShipSize.SMALL, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: nova.id, name: "C2 Hercules Starlifter", manufacturer: "Crusader", role: ShipRole.CARGO, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: nova.id, name: "Caterpillar", manufacturer: "Drake", role: ShipRole.CARGO, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: nova.id, name: "Hull C", manufacturer: "MISC", role: ShipRole.CARGO, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.PLEDGED },
      { userId: ryker.id, name: "Terrapin", manufacturer: "Anvil", role: ShipRole.SCOUT, size: ShipSize.SMALL, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: ryker.id, name: "Sabre", manufacturer: "Aegis", role: ShipRole.FIGHTER, size: ShipSize.SMALL, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: sera.id, name: "Cutlass Red", manufacturer: "Drake", role: ShipRole.MEDICAL, size: ShipSize.MEDIUM, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: sera.id, name: "C8R Pisces Medic", manufacturer: "Anvil", role: ShipRole.MEDICAL, size: ShipSize.SNUB, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: ghost.id, name: "Sabre", manufacturer: "Aegis", role: ShipRole.FIGHTER, size: ShipSize.SMALL, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: ghost.id, name: "Cutlass Black", manufacturer: "Drake", role: ShipRole.MULTI_ROLE, size: ShipSize.MEDIUM, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: titan.id, name: "Valkyrie", manufacturer: "Anvil", role: ShipRole.DROPSHIP, size: ShipSize.LARGE, quantity: 1, status: AssetStatus.AVAILABLE },
      { userId: echo.id, name: "Prospector", manufacturer: "MISC", role: ShipRole.MINING, size: ShipSize.SMALL, quantity: 1, status: AssetStatus.IN_GAME_PURCHASED },
      { userId: echo.id, name: "Vulture", manufacturer: "Drake", role: ShipRole.SALVAGE, size: ShipSize.SMALL, quantity: 1, status: AssetStatus.IN_GAME_PURCHASED },
    ],
  });

  // Ground vehicles
  await prisma.groundVehicle.createMany({
    data: [
      { userId: mike.id, name: "Nomad", manufacturer: "Consolidated Outland", role: VehicleRole.SUPPORT, size: VehicleSize.MEDIUM, quantity: 2, status: AssetStatus.AVAILABLE },
      { userId: mike.id, name: "Ursa Rover", manufacturer: "RSI", role: VehicleRole.TRANSPORT, size: VehicleSize.MEDIUM, quantity: 3, status: AssetStatus.AVAILABLE },
      { userId: mike.id, name: "Ballista", manufacturer: "Anvil", role: VehicleRole.COMBAT, size: VehicleSize.LARGE, quantity: 2, status: AssetStatus.AVAILABLE },
      { userId: mike.id, name: "Cyclone AA", manufacturer: "Tumbril", role: VehicleRole.COMBAT, size: VehicleSize.SMALL, quantity: 4, status: AssetStatus.AVAILABLE },
      { userId: mike.id, name: "ROC Mining Drill", manufacturer: "Greycat", role: VehicleRole.MINING, size: VehicleSize.SMALL, quantity: 2, status: AssetStatus.IN_GAME_PURCHASED },
      { userId: titan.id, name: "Cyclone RN", manufacturer: "Tumbril", role: VehicleRole.SUPPORT, size: VehicleSize.SMALL, quantity: 2, status: AssetStatus.AVAILABLE },
      { userId: sera.id, name: "Ursa Rover", manufacturer: "RSI", role: VehicleRole.SUPPORT, size: VehicleSize.MEDIUM, quantity: 1, status: AssetStatus.AVAILABLE },
    ],
  });

  console.log("📋 Creating operations...");

  const now = new Date();
  const in2days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const in5days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const in10days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const in14days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // ─── OP 1: UPCOMING ASSAULT (BRIEFING) ───────────────────────────────────────
  const op1 = await prisma.operation.create({
    data: {
      title: "Operation Red Horizon",
      type: OperationType.COMBINED_ARMS_ASSAULT,
      description: "Multi-stage assault on a Vanduul-occupied waystation near Caliban. Vanguard leads the breach, Atlas secures the extraction corridor.",
      objective: "Neutralize all hostile contacts and recover captured UEE equipment from the outpost cargo bays.",
      location: "Caliban System — Waystation KR-7",
      threatLevel: ThreatLevel.CRITICAL,
      startTime: in2days,
      status: OperationStatus.BRIEFING,
      visibility: OrganizationVisibility.PUBLIC,
      commanderId: mike.id,
      organizationId: org.id,
      missionBrief: "Three-phase assault. Phase 1: Hammerhead suppresses perimeter turrets while fighters engage escort craft. Phase 2: Valkyrie insertion, Ghost Six leads breach team into cargo bay Alpha. Phase 3: Atlas freight train extracts cargo while air wing holds perimeter.",
      commsPlan: "CMD: Command Net (encrypted). AIR: Alpha Air (open). GROUND: Bravo Ground (open). MEDEVAC: Medical channel (restricted).",
      rulesOfEngagement: "Weapons free on all confirmed Vanduul contacts. Hold fire on UEE markings. Protect the cargo containers at all costs.",
      rallyPoints: "Rally Alpha: 500km above waystation. Rally Bravo: waystation docking ring C.",
      extractionPlan: "C2 Hercules extraction from cargo bay once Ghost confirms clear. Fighters hold perimeter during load. Depart on Commander's mark.",
      contingencyPlans: "If AA becomes unmanageable: withdraw to Rally Alpha and request Javelin support. If cargo bay compromised: abort extraction and report coordinates.",
      requiredShips: "2x Hammerhead, 4x Fighters, 2x Valkyries, 1x C2 Hercules, 1x Medical ship",
      requiredGroundVehicles: "2x Cyclone AA, 1x Ursa",
      requiredPersonnel: "24 operators minimum",
      requiredSupplies: "Medpens x60, ammo resupply x4, repair kits x8",
      missionPhases: "Phase 1: Air suppression (30 min) > Phase 2: Breach and clear (45 min) > Phase 3: Extraction (20 min) > Phase 4: Exfil",
      participants: {
        create: [
          { userId: mike.id, organizationId: org.id, assignedRole: "Commander", team: "Command", status: RSVPStatus.GOING },
          { userId: jax.id, organizationId: org.id, assignedRole: "Wing Commander", team: "Air Wing Alpha", status: RSVPStatus.GOING },
          { userId: nova.id, organizationId: org.id, assignedRole: "Logistics Lead", team: "Supply", status: RSVPStatus.GOING },
          { userId: ryker.id, organizationId: org.id, assignedRole: "Forward Observer", team: "Recon", status: RSVPStatus.GOING },
          { userId: sera.id, organizationId: org.id, assignedRole: "Medical Lead", team: "Medevac", status: RSVPStatus.GOING },
          { userId: ghost.id, organizationId: org.id, assignedRole: "Breach Lead", team: "Strike Alpha", status: RSVPStatus.GOING },
          { userId: titan.id, organizationId: org.id, assignedRole: "Heavy Assault", team: "Strike Alpha", status: RSVPStatus.GOING },
          { userId: members[0].id, organizationId: org.id, assignedRole: "Escort Pilot", team: "Air Wing Alpha", status: RSVPStatus.GOING },
          { userId: members[1].id, organizationId: org.id, assignedRole: "Cargo Crew", team: "Supply", status: RSVPStatus.MAYBE },
          { userId: atlasOwner.id, organizationId: atlasOrg.id, assignedRole: "Freight Lead", team: "Supply", status: RSVPStatus.GOING },
        ],
      },
      assets: {
        create: [
          { ownerUserId: mike.id, ownerOrganizationId: org.id, assetType: AssetType.FLEET_SHIP, name: "Hammerhead", manufacturer: "Aegis", role: "Fleet suppression", quantity: 2 },
          { ownerUserId: jax.id, ownerOrganizationId: org.id, assetType: AssetType.FIGHTER, name: "F7C-M Super Hornet", manufacturer: "Anvil", role: "Air escort", quantity: 3 },
          { ownerUserId: mike.id, ownerOrganizationId: org.id, assetType: AssetType.DROPSHIP, name: "Valkyrie", manufacturer: "Anvil", role: "Infantry insertion", quantity: 2 },
          { ownerUserId: nova.id, ownerOrganizationId: org.id, assetType: AssetType.CARGO_SHIP, name: "C2 Hercules", manufacturer: "Crusader", role: "Cargo extraction", quantity: 1 },
          { ownerUserId: sera.id, ownerOrganizationId: org.id, assetType: AssetType.MEDICAL_SHIP, name: "Cutlass Red", manufacturer: "Drake", role: "Medevac", quantity: 1 },
          { ownerUserId: mike.id, ownerOrganizationId: org.id, assetType: AssetType.GROUND_VEHICLE, name: "Cyclone AA", manufacturer: "Tumbril", role: "AA defense", quantity: 2 },
        ],
      },
      rsvps: {
        create: [
          { userId: mike.id, status: RSVPStatus.GOING, note: "Full command element confirmed." },
          { userId: jax.id, status: RSVPStatus.GOING, note: "Air wing ready. 4 pilots confirmed." },
          { userId: nova.id, status: RSVPStatus.GOING, note: "Supply train staged at Rally Alpha." },
          { userId: ryker.id, status: RSVPStatus.GOING, note: "Advance scan package complete. Forwarded intel to command." },
          { userId: sera.id, status: RSVPStatus.GOING, note: "Medical team ready. 60 medpens loaded." },
          { userId: ghost.id, status: RSVPStatus.GOING, note: "Breach kit loaded. Entry route confirmed." },
          { userId: titan.id, status: RSVPStatus.GOING, note: "Strike team ready." },
          { userId: members[1].id, status: RSVPStatus.MAYBE, note: "Real life conflict, will know by day before." },
        ],
      },
    },
  });

  // ─── OP 2: MINING EXPEDITION (PLANNED) ───────────────────────────────────────
  const op2 = await prisma.operation.create({
    data: {
      title: "Operation Deep Vein",
      type: OperationType.MINING_SECURITY,
      description: "Coordinated quantanium mining expedition to the Yela asteroid belt with full security escort. High yield target identified by Horizon recon.",
      objective: "Extract maximum quantanium yield while maintaining perimeter security against pirate interdiction.",
      location: "Yela Asteroid Belt — Sector Q-12",
      threatLevel: ThreatLevel.MODERATE,
      startTime: in5days,
      status: OperationStatus.PLANNED,
      visibility: OrganizationVisibility.PUBLIC,
      commanderId: echo.id,
      organizationId: org.id,
      missionBrief: "Echo leads mining element with 2x Mole and 3x Prospectors. Jax runs security wing with 4 fighters. Ryker scouts ahead for pirate activity. Nova handles hauling once cargo capacity reached.",
      commsPlan: "Mining channel for Echo's element. Security channel for Jax. Combined on command net.",
      rulesOfEngagement: "Engage confirmed pirate threats. Avoid scanner contact with civilian vessels.",
      rallyPoints: "Rally: Yela Station parking orbit.",
      extractionPlan: "Hull C extraction when Moles reach capacity. Fighters escort to station.",
      contingencyPlans: "Pirate swarm: fighters engage, miners retreat to Rally point. If outnumbered: emergency cargo dump, all ships withdraw.",
      requiredShips: "2x Mole, 3x Prospector, 1x Hull C, 4x Fighters",
      requiredPersonnel: "12 operators",
      participants: {
        create: [
          { userId: echo.id, organizationId: org.id, assignedRole: "Mining Lead", team: "Extraction", status: RSVPStatus.GOING },
          { userId: jax.id, organizationId: org.id, assignedRole: "Security Lead", team: "Security", status: RSVPStatus.GOING },
          { userId: ryker.id, organizationId: org.id, assignedRole: "Scout", team: "Recon", status: RSVPStatus.GOING },
          { userId: nova.id, organizationId: org.id, assignedRole: "Hauler", team: "Logistics", status: RSVPStatus.MAYBE },
          { userId: members[2].id, organizationId: org.id, assignedRole: "Mole Co-Pilot", team: "Extraction", status: RSVPStatus.GOING },
          { userId: members[4].id, organizationId: org.id, assignedRole: "Prospector Pilot", team: "Extraction", status: RSVPStatus.GOING },
        ],
      },
      assets: {
        create: [
          { ownerUserId: echo.id, ownerOrganizationId: org.id, assetType: AssetType.MINING_SHIP, name: "Mole", manufacturer: "MISC", role: "Heavy mining", quantity: 1 },
          { ownerUserId: mike.id, ownerOrganizationId: org.id, assetType: AssetType.MINING_SHIP, name: "Prospector", manufacturer: "MISC", role: "Solo mining", quantity: 2 },
          { ownerUserId: nova.id, ownerOrganizationId: org.id, assetType: AssetType.CARGO_SHIP, name: "Hull C", manufacturer: "MISC", role: "Ore transport", quantity: 1 },
          { ownerUserId: jax.id, ownerOrganizationId: org.id, assetType: AssetType.FIGHTER, name: "Gladius", manufacturer: "Aegis", role: "Security escort", quantity: 2 },
        ],
      },
      rsvps: {
        create: [
          { userId: echo.id, status: RSVPStatus.GOING, note: "Mining kit prepped. Scanned Q-12 — rich vein confirmed." },
          { userId: jax.id, status: RSVPStatus.GOING, note: "Security wing online." },
          { userId: nova.id, status: RSVPStatus.MAYBE, note: "Checking schedule." },
        ],
      },
    },
  });

  // ─── OP 3: RESCUE OPERATION (ACTIVE) ─────────────────────────────────────────
  const op3 = await prisma.operation.create({
    data: {
      title: "Operation Pale Light",
      type: OperationType.RESCUE_OPERATION,
      description: "Emergency response to a damaged UEE transport reporting distress beacon near Crusader. Crew aboard, multiple casualties confirmed.",
      objective: "Reach disabled transport, stabilize crew, extract wounded, and tow ship to Port Olisar.",
      location: "Crusader Orbit — 8,000km from Port Olisar",
      threatLevel: ThreatLevel.LOW,
      startTime: yesterday,
      status: OperationStatus.ACTIVE,
      visibility: OrganizationVisibility.PUBLIC,
      commanderId: sera.id,
      organizationId: org.id,
      missionBrief: "Sera leads medical team. Jax provides fighter escort in case of pirate follow-up. Mike's Crucible handles hull repairs on-site. Time critical — 6 casualties aboard.",
      commsPlan: "Medical channel primary. Escort on secondary. Command on tertiary.",
      rulesOfEngagement: "Defensive only. Protect the rescue operation. Engage only on hostile intent.",
      extractionPlan: "Apollo triage carries wounded. Crucible tows damaged ship hull.",
      requiredShips: "1x Medical ship, 1x Repair ship, 2x Fighters",
      participants: {
        create: [
          { userId: sera.id, organizationId: org.id, assignedRole: "Medical Lead", team: "Medical", status: RSVPStatus.GOING },
          { userId: mike.id, organizationId: org.id, assignedRole: "Repair Lead", team: "Engineering", status: RSVPStatus.GOING },
          { userId: jax.id, organizationId: org.id, assignedRole: "Escort", team: "Security", status: RSVPStatus.GOING },
          { userId: members[0].id, organizationId: org.id, assignedRole: "Co-Pilot", team: "Medical", status: RSVPStatus.GOING },
        ],
      },
      rsvps: {
        create: [
          { userId: sera.id, status: RSVPStatus.GOING, note: "En route. ETA 12 minutes." },
          { userId: mike.id, status: RSVPStatus.GOING, note: "Crucible launched." },
          { userId: jax.id, status: RSVPStatus.GOING, note: "Escort in formation." },
        ],
      },
    },
  });

  // ─── OP 4: SALVAGE OPERATION (PLANNED) ───────────────────────────────────────
  const op4 = await prisma.operation.create({
    data: {
      title: "Operation Ghost Wreck",
      type: OperationType.SALVAGE_OPERATION,
      description: "Large-scale salvage of a derelict Bengal carrier discovered by Horizon Deep Space scouts near the Pyro system jump point.",
      objective: "Extract maximum salvage value including hull panels, components, and any intact cargo from the wreck.",
      location: "Aaron Halo — Derelict Bengal XC-7",
      threatLevel: ThreatLevel.HIGH,
      startTime: in10days,
      status: OperationStatus.PLANNED,
      visibility: OrganizationVisibility.PUBLIC,
      commanderId: echo.id,
      organizationId: org.id,
      missionBrief: "Reclaimer leads the heavy salvage. Two Vultures strip the outer hull. Ghost Six's team handles internal access for high-value components. Hammerhead provides overwatch given known pirate interest in the wreck.",
      commsPlan: "Salvage channel for Reclaimer crew. Assault channel for Ghost team. Security on command net.",
      rulesOfEngagement: "Engage pirates on sight — they've been using this wreck as a base. Clear internal sections before salvaging.",
      requiredShips: "1x Reclaimer, 2x Vulture, 1x Hammerhead, 1x Cargo transport",
      participants: {
        create: [
          { userId: echo.id, organizationId: org.id, assignedRole: "Salvage Lead", team: "Salvage", status: RSVPStatus.GOING },
          { userId: ghost.id, organizationId: org.id, assignedRole: "Breach Team Lead", team: "Internal Access", status: RSVPStatus.GOING },
          { userId: mike.id, organizationId: org.id, assignedRole: "Overwatch", team: "Security", status: RSVPStatus.STANDBY },
          { userId: members[3].id, organizationId: org.id, assignedRole: "Vulture Pilot", team: "Salvage", status: RSVPStatus.GOING },
        ],
      },
      rsvps: {
        create: [
          { userId: echo.id, status: RSVPStatus.GOING, note: "Horizon provided full scan of the wreck. Reclaimer staged." },
          { userId: ghost.id, status: RSVPStatus.GOING, note: "Internal breach loadout prepped." },
          { userId: mike.id, status: RSVPStatus.STANDBY, note: "Available if needed but OP 1 prep takes priority." },
        ],
      },
    },
  });

  // ─── OP 5: COMPLETED (HISTORICAL) ────────────────────────────────────────────
  const op5 = await prisma.operation.create({
    data: {
      title: "Operation Iron Lantern",
      type: OperationType.FLEET_PATROL,
      description: "Multi-system patrol to assert presence and deter piracy along the Stanton to Pyro trade routes.",
      objective: "Complete 4-system patrol loop without significant friendly casualties.",
      location: "Stanton System — Full patrol circuit",
      threatLevel: ThreatLevel.MODERATE,
      startTime: lastWeek,
      endTime: new Date(lastWeek.getTime() + 4 * 60 * 60 * 1000),
      status: OperationStatus.COMPLETED,
      visibility: OrganizationVisibility.PUBLIC,
      commanderId: mike.id,
      organizationId: org.id,
      missionBrief: "4-hour patrol. Two Hammerheads with fighter escort running Stanton patrol circuit.",
      participants: {
        create: [
          { userId: mike.id, organizationId: org.id, assignedRole: "Fleet Lead", team: "Command", status: RSVPStatus.GOING },
          { userId: jax.id, organizationId: org.id, assignedRole: "Wing Lead", team: "Air Wing", status: RSVPStatus.GOING },
          { userId: ryker.id, organizationId: org.id, assignedRole: "Scanner", team: "Recon", status: RSVPStatus.GOING },
          { userId: members[0].id, organizationId: org.id, assignedRole: "Escort Pilot", team: "Air Wing", status: RSVPStatus.GOING },
          { userId: members[1].id, organizationId: org.id, assignedRole: "Gunner", team: "Command", status: RSVPStatus.GOING },
        ],
      },
    },
  });

  // ─── OP 6: COALITION JOINT EXERCISE (PLANNED) ────────────────────────────────
  const op6 = await prisma.operation.create({
    data: {
      title: "Operation Trident Shield",
      type: OperationType.JOINT_FLEET_EXERCISE,
      description: "Large-scale joint fleet exercise involving all three coalition member organizations. Practice coordinated engagement and fleet communication protocols.",
      objective: "Test inter-org communication, fleet maneuvering, and logistics chain under simulated combat conditions.",
      location: "Lagrange Point — L3 Stanton",
      threatLevel: ThreatLevel.LOW,
      startTime: in14days,
      status: OperationStatus.PLANNED,
      visibility: OrganizationVisibility.PUBLIC,
      commanderId: mike.id,
      organizationId: org.id,
      missionBrief: "Vanguard runs the combat element. Atlas handles supply and support. Horizon runs electronic warfare and scanning simulations. Exercise referee will run from Idris command deck.",
      commsPlan: "All-org combined net. Org-specific tactical channels. Referee channel (command only).",
      requiredShips: "All available fleet ships encouraged. Minimum: 6 combat, 2 support, 1 command",
      requiredPersonnel: "30+ operators across all orgs",
      participants: {
        create: [
          { userId: mike.id, organizationId: org.id, assignedRole: "Exercise Commander", team: "Command", status: RSVPStatus.GOING },
          { userId: jax.id, organizationId: org.id, assignedRole: "Red Team Lead", team: "Red Force", status: RSVPStatus.GOING },
          { userId: nova.id, organizationId: org.id, assignedRole: "Supply Lead", team: "Logistics", status: RSVPStatus.GOING },
          { userId: atlasOwner.id, organizationId: atlasOrg.id, assignedRole: "Blue Team Support", team: "Blue Support", status: RSVPStatus.GOING },
          { userId: horizonOwner.id, organizationId: horizonOrg.id, assignedRole: "EW Lead", team: "Intel", status: RSVPStatus.MAYBE },
          { userId: ryker.id, organizationId: org.id, assignedRole: "Blue Recon Lead", team: "Recon", status: RSVPStatus.GOING },
        ],
      },
      rsvps: {
        create: [
          { userId: mike.id, status: RSVPStatus.GOING, note: "Full fleet exercise. Bring everything." },
          { userId: jax.id, status: RSVPStatus.GOING, note: "Red team will not hold back." },
          { userId: atlasOwner.id, status: RSVPStatus.GOING, note: "Atlas is bringing 5 ships to the exercise." },
          { userId: horizonOwner.id, status: RSVPStatus.MAYBE, note: "Checking crew availability." },
        ],
      },
    },
  });

  // Comments on ops
  const c1 = await prisma.comment.create({ data: { operationId: op1.id, userId: jax.id, body: "Air wing is prepped. Request we stage at Rally Alpha 1 hour before insertion to allow formation practice." } });
  const c2 = await prisma.comment.create({ data: { operationId: op1.id, userId: ryker.id, body: "Pre-op scan complete. I'm picking up 12 Vanduul contacts, mix of fighters and a medium platform near docking ring B. Sending full report to Command Net." } });
  const c3 = await prisma.comment.create({ data: { operationId: op1.id, userId: mike.id, body: "Good work Ryker. Jax — adjust ingress vector to approach from the station's shadow. Ghost — confirm breach kit for secondary entry point on ring B." } });
  const c4 = await prisma.comment.create({ data: { operationId: op1.id, userId: ghost.id, body: "Confirmed. Secondary breach kit loaded. We can hit ring A and B simultaneously if you want to split the teams." } });
  await prisma.comment.create({ data: { operationId: op2.id, userId: echo.id, body: "Horizon's scan shows an 85% quantanium concentration in Q-12. This is going to be a good run." } });
  await prisma.comment.create({ data: { operationId: op2.id, userId: jax.id, body: "Last time we ran Yela there were 3 pirate ships lurking near the exit lane. Flying with full loadout." } });
  await prisma.comment.create({ data: { operationId: op3.id, userId: sera.id, body: "Update: 4 of 6 casualties stabilized. Two critical still aboard. Crucible has patched hull breach." } });
  await prisma.comment.create({ data: { operationId: op5.id, userId: mike.id, body: "Patrol complete. Clean run — no significant contacts. The deterrence effect is working." } });

  await prisma.commentReaction.createMany({
    data: [
      { commentId: c1.id, userId: mike.id, emoji: "✅" },
      { commentId: c2.id, userId: mike.id, emoji: "🔍" },
      { commentId: c2.id, userId: jax.id, emoji: "👀" },
      { commentId: c3.id, userId: jax.id, emoji: "🫡" },
      { commentId: c3.id, userId: ghost.id, emoji: "🫡" },
      { commentId: c4.id, userId: mike.id, emoji: "💡" },
    ],
  });

  // AAR on completed operation
  await prisma.afterActionReport.create({
    data: {
      operationId: op5.id,
      authorId: mike.id,
      summary: "Stanton patrol circuit completed in 4h 12m. Zero friendly losses. Two pirate contacts deterred without engagement — they broke off on approach.",
      whatWentWell: "Formation discipline was excellent throughout. Comms were clear and concise. Ryker's scanner work gave us advance notice on both contacts.",
      whatWentWrong: "Minor fuel miscalculation on leg 3 — one Hammerhead needed to divert briefly for refuel. Added 15 minutes to circuit.",
      lessonsLearned: "Calculate fuel for full circuit plus 20% buffer. Pre-stage fuel at L1 and L3 for extended patrols.",
      recommendations: "Pre-stage tankers at L3 for future patrols. Add a designated fuel coordinator role.",
    },
  });

  console.log("🤝 Creating coalitions and alliances...");

  const coalition = await prisma.coalition.create({
    data: {
      name: "Iron Trident Accord",
      description: "Combined operations pact between Vanguard Collective, Atlas Freight Corp, and Horizon Deep Space. Mutual defense, intelligence sharing, and joint operational planning.",
      createdById: mike.id,
      commandNotes: "Vanguard: combat lead. Atlas: logistics chain. Horizon: intel and recon. All ops require 48h coordination window.",
      members: {
        create: [
          { organizationId: org.id, responsibility: "Combat operations, fleet command, ground assault" },
          { organizationId: atlasOrg.id, responsibility: "Logistics, cargo extraction, supply chain" },
          { organizationId: horizonOrg.id, responsibility: "Intelligence, scanning, exploration support" },
        ],
      },
    },
  });

  await prisma.alliance.create({
    data: {
      name: "UEE Outer Rim Defense Pact",
      description: "Formal mutual-defense agreement for UEE system security operations. Activated only for large-scale hostile incursions.",
      createdById: mike.id,
      members: {
        create: [{ organizationId: org.id }, { organizationId: atlasOrg.id }],
      },
    },
  });

  console.log("💬 Creating social content...");

  const tacCategory = await prisma.socialCategory.create({ data: { name: "Tactics & Strategy", slug: "tactics-strategy", description: "Fleet tactics, ground ops, combat theory.", createdById: mike.id } });
  const gearCategory = await prisma.socialCategory.create({ data: { name: "Ships & Loadouts", slug: "ships-loadouts", description: "Ship reviews, weapon loadouts, build guides.", createdById: mike.id } });
  const newsCategory = await prisma.socialCategory.create({ data: { name: "Star Citizen News", slug: "sc-news", description: "Game updates, PTU patches, dev news.", createdById: mike.id } });
  const orgCategory = await prisma.socialCategory.create({ data: { name: "Org Announcements", slug: "org-announcements", description: "Official Vanguard Collective announcements.", createdById: mike.id } });

  const post1 = await prisma.socialPost.create({
    data: {
      title: "Operation Red Horizon — Final Briefing Notes",
      body: "All members participating in Red Horizon — please review the updated breach plan. Ghost Six has identified a secondary entry point on ring B which gives us a real advantage. Full briefing in the Command Net channel. Be at Rally Alpha 60 minutes before op start. Questions? Post them here or in Command Net.\n\n— Commander ZeroZone93",
      type: SocialPostType.TOPIC,
      pinned: true,
      authorId: mike.id,
      categoryId: orgCategory.id,
      organizationId: org.id,
    },
  });

  await prisma.socialPost.create({
    data: {
      title: "Hammerhead vs Polaris — Which is Better for Our Ops?",
      body: "Been thinking about our fleet composition after last week's patrol. The Hammerhead is incredible for anti-fighter work but the Polaris has that torpedo battery for capital engagements. With the Vanduul threat growing, should we be looking at more capital-busting firepower?\n\nFor reference: Hammerhead has 6 manned turrets, great against small ships. Polaris has fewer turrets but the torpedo salvo can gut a capital ship. What does everyone think for Red Horizon specifically?",
      type: SocialPostType.QUESTION,
      authorId: jax.id,
      categoryId: gearCategory.id,
      organizationId: org.id,
    },
  });

  await prisma.socialPost.create({
    data: {
      title: "Quantum Travel Formation — Tips for Keeping Fleet Together",
      body: "After last patrol's fuel incident I've been researching quantum travel formation best practices. Here's what I found:\n\n1. Designate a formation lead — everyone sets their quantum target marker on the lead ship\n2. Use 'hold' comms before entering quantum so stragglers can catch up\n3. Pre-plot waypoints rather than direct-to-destination jumps for better control\n4. Assign a sweep ship to tag along at rear and ensure no one gets left behind\n\nThought this would be useful ahead of Op Red Horizon which involves multi-stage jumps.",
      type: SocialPostType.GUIDELINE,
      authorId: ryker.id,
      categoryId: tacCategory.id,
      organizationId: org.id,
    },
  });

  await prisma.socialPost.create({
    data: {
      title: "New 3.24 Patch — What Changed That Affects Our Operations",
      body: "Patch 3.24 dropped some significant changes:\n\n- Cargo refactor is live. All cargo now uses grid-based loading. Nova's C2 run will need adjusted loading procedures.\n- Medical gameplay expanded — Sera's Cutlass Red now supports advanced trauma care without hospital ship.\n- Quantum travel fuel consumption slightly increased across all ships.\n- Vanduul AI improved — expect Red Horizon contacts to be more aggressive and tactical.\n\nMike has already updated the op plan to account for the Vanduul AI change. Check Command Net for details.",
      type: SocialPostType.TOPIC,
      authorId: nova.id,
      categoryId: newsCategory.id,
    },
  });

  await prisma.socialPostReply.createMany({
    data: [
      { postId: post1.id, authorId: jax.id, body: "Confirmed. Air wing briefing tonight at 20:00 UTC. All pilots must attend." },
      { postId: post1.id, authorId: ghost.id, body: "Breach plan updated. Ring B entry requires breach charges — everyone on my team needs to confirm they have them loaded before op start." },
      { postId: post1.id, authorId: sera.id, body: "Medical plan filed. Medevac channel will be standing by from op start. Any casualties: call MEDEVAC and your grid. We will come to you." },
      { postId: post1.id, authorId: nova.id, body: "Supply train staged at Rally Alpha. 60 medpens, 4x ammo resupply, 8x repair kits loaded." },
    ],
  });

  console.log("🔔 Creating notifications...");

  await prisma.notification.createMany({
    data: [
      { userId: mike.id, type: NotificationType.OP_UPDATE, title: "Op Red Horizon — Briefing Stage", body: "Operation Red Horizon has entered briefing phase. 2 days to launch.", link: `/operations/${op1.id}`, read: false },
      { userId: mike.id, type: NotificationType.SYSTEM, title: "Coalition Exercise Confirmed", body: "Horizon Deep Space has confirmed participation in Operation Trident Shield.", link: `/operations/${op6.id}`, read: false },
      { userId: jax.id, type: NotificationType.OP_ASSIGNMENT, title: "Assigned: Wing Commander — Red Horizon", body: "You are assigned as Wing Commander for Operation Red Horizon.", link: `/operations/${op1.id}`, read: false },
      { userId: jax.id, type: NotificationType.COMMENT_MENTION, title: "Commander replied to your comment", body: "Mike Commander replied to your comment on Operation Red Horizon.", link: `/operations/${op1.id}`, read: true },
      { userId: nova.id, type: NotificationType.OP_ASSIGNMENT, title: "Assigned: Logistics Director — Red Horizon", body: "You are assigned as Logistics Director for Operation Red Horizon.", link: `/operations/${op1.id}`, read: false },
      { userId: ryker.id, type: NotificationType.OP_UPDATE, title: "Intel submission acknowledged", body: "Your pre-op scan report for Red Horizon has been acknowledged by Command.", link: `/operations/${op1.id}`, read: true },
      { userId: sera.id, type: NotificationType.OP_ASSIGNMENT, title: "Assigned: Medical Lead — Pale Light", body: "You are assigned as Medical Lead for Operation Pale Light.", link: `/operations/${op3.id}`, read: false },
      { userId: ghost.id, type: NotificationType.OP_UPDATE, title: "Breach plan updated — Red Horizon", body: "Commander has updated the breach plan for Operation Red Horizon. Review required.", link: `/operations/${op1.id}`, read: false },
      { userId: echo.id, type: NotificationType.OP_ASSIGNMENT, title: "Mining Op Confirmed — Deep Vein", body: "Operation Deep Vein is confirmed. You are leading the mining element.", link: `/operations/${op2.id}`, read: false },
      { userId: titan.id, type: NotificationType.OP_ASSIGNMENT, title: "Assigned: Heavy Assault — Red Horizon", body: "You are part of Strike Alpha team for Operation Red Horizon.", link: `/operations/${op1.id}`, read: false },
      { userId: members[0].id, type: NotificationType.ORG_INVITE, title: "Welcome to Vanguard Collective", body: "You have been added to Vanguard Collective as an Operator.", link: `/organizations/${org.id}`, read: true },
    ],
  });

  console.log("📡 Creating conversations and messages...");

  const commandNet = await prisma.conversation.create({
    data: {
      title: "Command Net",
      description: "Encrypted command channel for op planning and officer coordination.",
      isChannel: true,
      organizationId: org.id,
      createdById: mike.id,
      participants: {
        create: [
          { userId: mike.id }, { userId: jax.id }, { userId: nova.id },
          { userId: ryker.id }, { userId: sera.id }, { userId: ghost.id }, { userId: titan.id }, { userId: echo.id },
        ],
      },
    },
  });

  const generalChannel = await prisma.conversation.create({
    data: {
      title: "General — Vanguard",
      description: "All-members general channel.",
      isChannel: true,
      organizationId: org.id,
      createdById: mike.id,
      participants: {
        create: [
          { userId: mike.id }, { userId: jax.id }, { userId: nova.id }, { userId: ryker.id },
          { userId: sera.id }, { userId: ghost.id }, { userId: titan.id }, { userId: echo.id },
          ...members.map((m) => ({ userId: m.id })),
        ],
      },
    },
  });

  const msg1 = await prisma.message.create({ data: { conversationId: commandNet.id, senderId: mike.id, body: "Red Horizon briefing in 48 hours. Officers: post readiness checks here by tomorrow 18:00 UTC." } });
  const msg2 = await prisma.message.create({ data: { conversationId: commandNet.id, senderId: ryker.id, body: "Recon complete. 12 Vanduul contacts confirmed. Full scan packet attached. Recommend revised ingress via station shadow." } });
  const msg3 = await prisma.message.create({ data: { conversationId: commandNet.id, senderId: jax.id, body: "Air wing: 4 confirmed pilots. All ships fueled and armed. Shadow ingress works for us — lower detection risk." } });
  await prisma.message.create({ data: { conversationId: commandNet.id, senderId: nova.id, body: "Supply train: 60 medpens, 4x ammo, 8x repair kits staged at Rally Alpha. Waiting on final headcount for cargo bay 2 load." } });
  await prisma.message.create({ data: { conversationId: commandNet.id, senderId: ghost.id, body: "Strike team: 6 confirmed. Breach kit for ring A and B loaded. Requesting permission to insert 5 minutes ahead of main element for quiet approach." } });
  await prisma.message.create({ data: { conversationId: commandNet.id, senderId: mike.id, body: "Granted Ghost. Ingress 5 min early, mark positions on grid before main element arrives. Good hunting everyone." } });

  await prisma.message.create({ data: { conversationId: generalChannel.id, senderId: mike.id, body: "Welcome to Vanguard Collective everyone. Big op coming up — check the ops board. More ops planned after Red Horizon including the coalition joint exercise." } });
  await prisma.message.create({ data: { conversationId: generalChannel.id, senderId: jax.id, body: "If anyone needs fighter practice before Red Horizon hit me up for wing drills." } });
  await prisma.message.create({ data: { conversationId: generalChannel.id, senderId: members[0].id, body: "Excited for my first real op with the org! What should I bring?" } });
  const lastMsg = await prisma.message.create({ data: { conversationId: generalChannel.id, senderId: jax.id, body: "Full loadout, extra ammo, and don't forget your medpens. See you at Rally Alpha." } });

  await prisma.messageReaction.createMany({
    data: [
      { messageId: msg1.id, userId: jax.id, emoji: "🫡" },
      { messageId: msg1.id, userId: nova.id, emoji: "✅" },
      { messageId: msg1.id, userId: ghost.id, emoji: "✅" },
      { messageId: msg2.id, userId: mike.id, emoji: "🔍" },
      { messageId: msg2.id, userId: jax.id, emoji: "👀" },
      { messageId: msg3.id, userId: mike.id, emoji: "🔥" },
      { messageId: lastMsg.id, userId: members[0].id, emoji: "💪" },
    ],
  });

  console.log("📊 Creating activity feed...");

  await prisma.activityFeedItem.createMany({
    data: [
      { type: "organization_bulletin", title: "Red Horizon enters briefing phase", body: "Operation Red Horizon has reached briefing stage. All participants have been notified.", organizationId: org.id, userId: mike.id, operationId: op1.id },
      { type: "operation_created", title: "Operation Deep Vein posted", body: "Echo Station has posted Operation Deep Vein — mining expedition to Yela Q-12.", organizationId: org.id, userId: echo.id, operationId: op2.id },
      { type: "operation_created", title: "Operation Ghost Wreck planned", body: "New salvage operation targeting derelict Bengal. High threat but exceptional reward.", organizationId: org.id, userId: echo.id, operationId: op4.id },
      { type: "organization_member_joined", title: "Vex Calloway joined Vanguard Collective", body: "New operator assigned.", organizationId: org.id, userId: members[0].id },
      { type: "organization_member_joined", title: "Lia Storm joined Vanguard Collective", body: "New operator assigned.", organizationId: org.id, userId: members[1].id },
      { type: "operation_completed", title: "Operation Iron Lantern complete", body: "Stanton patrol circuit completed. Zero losses. Excellent work Vanguard.", organizationId: org.id, userId: mike.id, operationId: op5.id },
      { type: "organization_bulletin", title: "Coalition exercise scheduled", body: "Operation Trident Shield will bring all three coalition orgs together for the biggest exercise yet.", organizationId: org.id, userId: mike.id, operationId: op6.id },
    ],
  });

  await prisma.userFollow.createMany({
    data: [
      { followerId: jax.id, followingId: mike.id },
      { followerId: nova.id, followingId: mike.id },
      { followerId: ryker.id, followingId: mike.id },
      { followerId: sera.id, followingId: mike.id },
      { followerId: ghost.id, followingId: mike.id },
      { followerId: titan.id, followingId: mike.id },
      { followerId: echo.id, followingId: mike.id },
      { followerId: mike.id, followingId: jax.id },
      { followerId: mike.id, followingId: ryker.id },
      { followerId: mike.id, followingId: ghost.id },
      { followerId: jax.id, followingId: ryker.id },
      { followerId: members[0].id, followingId: mike.id },
      { followerId: members[1].id, followingId: jax.id },
    ],
  });

  console.log("\n✅ Demo seed complete!\n");
  console.log("═══════════════════════════════════════════════════");
  console.log("  DEMO LOGIN DETAILS");
  console.log("═══════════════════════════════════════════════════");
  console.log("  Role: Site Admin / Org Commander");
  console.log("  Email:    mike@starcitizenopps.com");
  console.log("  Password: StarOps!Demo2026");
  console.log("───────────────────────────────────────────────────");
  console.log("  Other accounts (password: Member!2026):");
  console.log("  jax@starcitizenopps.com     (Officer - Wing Commander)");
  console.log("  nova@starcitizenopps.com    (Officer - Logistics Director)");
  console.log("  ryker@starcitizenopps.com   (Commander - Recon)");
  console.log("  sera@starcitizenopps.com    (Commander - Medical Lead)");
  console.log("  ghost@starcitizenopps.com   (Team Leader - Special Ops)");
  console.log("  titan@starcitizenopps.com   (Team Leader - Ground Strike)");
  console.log("  echo@starcitizenopps.com    (Team Leader - Industrial)");
  console.log("  vex@starcitizenopps.com     (Member)");
  console.log("═══════════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
