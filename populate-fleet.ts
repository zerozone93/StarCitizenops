import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

(async () => {
  const mike = await prisma.user.findUnique({ where: { email: 'mike@starcitizenopps.com' } });
  const org = await prisma.organization.findFirst({ where: { tag: 'AOC' } });
  const orgMembers = await prisma.organizationMember.findMany({
    where: { organizationId: org.id, role: { not: 'OWNER' } },
    include: { user: true }
  });

  const personalShips = [
    { name: 'F7C Hornet', manufacturer: 'Anvil', role: 'FIGHTER', size: 'SMALL', quantity: 2, status: 'AVAILABLE', notes: 'Veteran loadout' },
    { name: 'Sabre', manufacturer: 'Aegis', role: 'FIGHTER', size: 'SMALL', quantity: 1, status: 'AVAILABLE', notes: 'High speed interceptor' },
    { name: 'Gladius', manufacturer: 'Aegis', role: 'FIGHTER', size: 'SMALL', quantity: 1, status: 'AVAILABLE', notes: 'Starter fighter' },
    { name: 'Vanguard Warden', manufacturer: 'Aegis', role: 'HEAVY_FIGHTER', size: 'MEDIUM', quantity: 1, status: 'AVAILABLE', notes: 'Long range patrol' },
    { name: 'Hurricane', manufacturer: 'Anvil', role: 'HEAVY_FIGHTER', size: 'SMALL', quantity: 1, status: 'AVAILABLE', notes: 'Multi-turret gunship' },
    { name: 'Carrack', manufacturer: 'Anvil', role: 'EXPLORATION', size: 'LARGE', quantity: 1, status: 'AVAILABLE', notes: 'Deep space explorer' },
    { name: 'Prospector', manufacturer: 'Consolidated Outland', role: 'MINING', size: 'SMALL', quantity: 1, status: 'AVAILABLE', notes: 'Solo mining rig' },
    { name: 'Cutlass Black', manufacturer: 'Drake', role: 'MULTI_ROLE', size: 'SMALL', quantity: 1, status: 'PLEDGED', notes: 'Cargo/combat versatile' },
    { name: 'Caterpillar', manufacturer: 'Drake', role: 'CARGO', size: 'LARGE', quantity: 1, status: 'AVAILABLE', notes: 'Transport logistics' },
    { name: 'Constellation Aquila', manufacturer: 'Roberts Space Industries', role: 'EXPLORATION', size: 'LARGE', quantity: 1, status: 'AVAILABLE', notes: 'Luxury exploration cruiser' },
  ];

  for (const ship of personalShips) {
    await prisma.ship.create({ data: { userId: mike.id, ...ship } });
  }
  console.log('✓ Added ' + personalShips.length + ' ships to Mikes personal fleet');

  const personalVehicles = [
    { name: 'Cyclone', manufacturer: 'Tumbril', role: 'COMBAT', size: 'SMALL', quantity: 2, status: 'AVAILABLE', notes: 'Light combat vehicle' },
    { name: 'Greycat PTV', manufacturer: 'Greycat', role: 'TRANSPORT', size: 'SMALL', quantity: 1, status: 'AVAILABLE', notes: 'Utility transport' },
  ];

  for (const vehicle of personalVehicles) {
    await prisma.groundVehicle.create({ data: { userId: mike.id, ...vehicle } });
  }
  console.log('✓ Added ' + personalVehicles.length + ' vehicles to Mikes personal fleet');

  const firstOp = await prisma.operation.findFirst({ where: { organizationId: org.id }, select: { id: true } });

  const orgFleetShips = [
    { name: 'F7A Hornet', manufacturer: 'Anvil', role: 'FIGHTER', size: 'SMALL', quantity: 4, notes: 'Squadron 1 fighters' },
    { name: 'Sabre', manufacturer: 'Aegis', role: 'FIGHTER', size: 'SMALL', quantity: 3, notes: 'Interceptor wing' },
    { name: 'Hammerhead', manufacturer: 'Aegis', role: 'CORVETTE', size: 'LARGE', quantity: 1, notes: 'Capital ship fleet command' },
    { name: 'Valkyrie', manufacturer: 'Anvil', role: 'DROPSHIP', size: 'LARGE', quantity: 1, notes: 'Infantry transport' },
    { name: 'Constellation Andromeda', manufacturer: 'Roberts Space Industries', role: 'MULTI_ROLE', size: 'LARGE', quantity: 1, notes: 'Org flagship' },
    { name: 'Crucible', manufacturer: 'Anvil', role: 'REPAIR', size: 'LARGE', quantity: 1, notes: 'Mobile repair platform' },
    { name: 'Starfarer', manufacturer: 'Musashi Industrial & Starflight Concern', role: 'REFUEL', size: 'LARGE', quantity: 1, notes: 'Fuel tanker' },
    { name: 'Eclipse', manufacturer: 'Aegis', role: 'BOMBER', size: 'SMALL', quantity: 2, notes: 'Stealth bombers' },
    { name: 'Redeemer', manufacturer: 'Aegis', role: 'GUNSHIP', size: 'MEDIUM', quantity: 1, notes: 'Armed transport' },
    { name: 'Herald', manufacturer: 'Crusader', role: 'CARGO', size: 'SMALL', quantity: 2, notes: 'Fast cargo runners' },
  ];

  for (const ship of orgFleetShips) {
    await prisma.operationAsset.create({
      data: {
        operationId: firstOp.id,
        ownerOrganizationId: org.id,
        assetType: 'FLEET_SHIP',
        name: ship.name,
        manufacturer: ship.manufacturer,
        role: ship.role,
        size: ship.size,
        quantity: ship.quantity,
        notes: ship.notes
      }
    });
  }
  console.log('✓ Added ' + orgFleetShips.length + ' ships to AOC organization fleet');

  const orgVehicles = [
    { name: 'Cyclone AA', manufacturer: 'Tumbril', role: 'COMBAT', size: 'SMALL', quantity: 4, notes: 'Anti-air combat vehicles' },
    { name: 'Dragonfly', manufacturer: 'Consolidated Outland', role: 'EXPLORATION', size: 'SMALL', quantity: 2, notes: 'Light reconnaissance' },
  ];

  for (const vehicle of orgVehicles) {
    await prisma.operationAsset.create({
      data: {
        operationId: firstOp.id,
        ownerOrganizationId: org.id,
        assetType: 'GROUND_VEHICLE',
        name: vehicle.name,
        manufacturer: vehicle.manufacturer,
        role: vehicle.role,
        size: vehicle.size,
        quantity: vehicle.quantity,
        notes: vehicle.notes
      }
    });
  }
  console.log('✓ Added ' + orgVehicles.length + ' vehicles to AOC organization fleet');

  if (orgMembers.length > 0) {
    const member1 = orgMembers[0];
    const contributedShips1 = [
      { name: 'F8C Lightning', manufacturer: 'Anvil', role: 'HEAVY_FIGHTER', size: 'SMALL', quantity: 1, status: 'AVAILABLE', notes: 'Member contribution' },
      { name: 'Mustang Alpha', manufacturer: 'Consolidated Outland', role: 'MULTI_ROLE', size: 'SMALL', quantity: 2, status: 'AVAILABLE', notes: 'Training ships' },
    ];
    for (const ship of contributedShips1) {
      await prisma.ship.create({ data: { userId: member1.user.id, ...ship } });
    }
    console.log('✓ Added contributed ships to ' + member1.user.name);
  }

  if (orgMembers.length > 1) {
    const member2 = orgMembers[1];
    const contributedShips2 = [
      { name: 'Terrapin', manufacturer: 'Anvil', role: 'SCOUT', size: 'MEDIUM', quantity: 1, status: 'AVAILABLE', notes: 'Recon specialist' },
      { name: 'Nomad', manufacturer: 'Consolidated Outland', role: 'CARGO', size: 'SMALL', quantity: 1, status: 'AVAILABLE', notes: 'Light hauler' },
    ];
    for (const ship of contributedShips2) {
      await prisma.ship.create({ data: { userId: member2.user.id, ...ship } });
    }
    console.log('✓ Added contributed ships to ' + member2.user.name);
  }

  console.log('');
  console.log('✅ Comprehensive fleet populated');
  console.log('');
  console.log('Mikes Private Fleet:');
  console.log('  - 10 combat/explorer starships');
  console.log('  - 3 ground vehicles');
  console.log('');
  console.log('AOC Organization Fleet:');
  console.log('  - 10 starships (combat squadrons, capital, support)');
  console.log('  - 2 ground vehicle types (12 total)');
  console.log('  - Contributions from ' + Math.min(2, orgMembers.length) + ' org members');

  await prisma.$disconnect();
})();
