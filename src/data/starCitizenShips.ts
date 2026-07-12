import { ShipRole, ShipSize } from "@prisma/client";

export type StarCitizenShip = {
  name: string;
  manufacturer: string;
  role: ShipRole;
  size: ShipSize;
};

export const STAR_CITIZEN_SHIP_DATA_VERSION = "4.9";

export const STAR_CITIZEN_SHIPS: StarCitizenShip[] = [
  // Aegis
  { name: "Avenger Titan", manufacturer: "Aegis", role: ShipRole.MULTI_ROLE, size: ShipSize.SMALL },
  { name: "Avenger Stalker", manufacturer: "Aegis", role: ShipRole.TRANSPORT, size: ShipSize.SMALL },
  { name: "Avenger Warlock", manufacturer: "Aegis", role: ShipRole.INTERCEPTOR, size: ShipSize.SMALL },
  { name: "Gladius", manufacturer: "Aegis", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "Sabre", manufacturer: "Aegis", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "Vanguard Warden", manufacturer: "Aegis", role: ShipRole.HEAVY_FIGHTER, size: ShipSize.MEDIUM },
  { name: "Vanguard Sentinel", manufacturer: "Aegis", role: ShipRole.HEAVY_FIGHTER, size: ShipSize.MEDIUM },
  { name: "Vanguard Harbinger", manufacturer: "Aegis", role: ShipRole.BOMBER, size: ShipSize.MEDIUM },
  { name: "Vanguard Hoplite", manufacturer: "Aegis", role: ShipRole.DROPSHIP, size: ShipSize.MEDIUM },
  { name: "Retaliator", manufacturer: "Aegis", role: ShipRole.BOMBER, size: ShipSize.LARGE },
  { name: "Hammerhead", manufacturer: "Aegis", role: ShipRole.CORVETTE, size: ShipSize.LARGE },
  { name: "Reclaimer", manufacturer: "Aegis", role: ShipRole.SALVAGE, size: ShipSize.LARGE },
  { name: "Redeemer", manufacturer: "Aegis", role: ShipRole.GUNSHIP, size: ShipSize.MEDIUM },
  { name: "Eclipse", manufacturer: "Aegis", role: ShipRole.BOMBER, size: ShipSize.SMALL },
  { name: "Idris", manufacturer: "Aegis", role: ShipRole.CAPITAL, size: ShipSize.CAPITAL },
  { name: "Javelin", manufacturer: "Aegis", role: ShipRole.CAPITAL, size: ShipSize.CAPITAL },

  // Anvil
  { name: "Arrow", manufacturer: "Anvil", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "F7C Hornet", manufacturer: "Anvil", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "F7A Hornet", manufacturer: "Anvil", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "F8C Lightning", manufacturer: "Anvil", role: ShipRole.HEAVY_FIGHTER, size: ShipSize.SMALL },
  { name: "Tiburon", manufacturer: "Anvil", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "Hawk", manufacturer: "Anvil", role: ShipRole.INTERCEPTOR, size: ShipSize.SMALL },
  { name: "Gladiator", manufacturer: "Anvil", role: ShipRole.BOMBER, size: ShipSize.SMALL },
  { name: "Hurricane", manufacturer: "Anvil", role: ShipRole.HEAVY_FIGHTER, size: ShipSize.SMALL },
  { name: "Terrapin", manufacturer: "Anvil", role: ShipRole.SCOUT, size: ShipSize.MEDIUM },
  { name: "Valkyrie", manufacturer: "Anvil", role: ShipRole.DROPSHIP, size: ShipSize.LARGE },
  { name: "Carrack", manufacturer: "Anvil", role: ShipRole.EXPLORATION, size: ShipSize.LARGE },
  { name: "Crucible", manufacturer: "Anvil", role: ShipRole.REPAIR, size: ShipSize.LARGE },
  { name: "Liberator", manufacturer: "Anvil", role: ShipRole.TRANSPORT, size: ShipSize.LARGE },

  // Aopoa
  { name: "Khartu-al", manufacturer: "Aopoa", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "San'tok.yai", manufacturer: "Aopoa", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "Nox", manufacturer: "Aopoa", role: ShipRole.RACING, size: ShipSize.SNUB },
  { name: "Nox Kue", manufacturer: "Aopoa", role: ShipRole.RACING, size: ShipSize.SNUB },

  // Argo
  { name: "MPUV Cargo", manufacturer: "Argo", role: ShipRole.CARGO, size: ShipSize.SNUB },
  { name: "MPUV Personnel", manufacturer: "Argo", role: ShipRole.TRANSPORT, size: ShipSize.SNUB },
  { name: "RAFT", manufacturer: "Argo", role: ShipRole.CARGO, size: ShipSize.MEDIUM },
  { name: "MOLE", manufacturer: "Argo", role: ShipRole.MINING, size: ShipSize.LARGE },
  { name: "SRV", manufacturer: "Argo", role: ShipRole.SUPPORT, size: ShipSize.MEDIUM },

  // Banu
  { name: "Defender", manufacturer: "Banu", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "Merchantman", manufacturer: "Banu", role: ShipRole.CARGO, size: ShipSize.CAPITAL },

  // Consolidated Outland
  { name: "Mustang Alpha", manufacturer: "Consolidated Outland", role: ShipRole.MULTI_ROLE, size: ShipSize.SMALL },
  { name: "Mustang Beta", manufacturer: "Consolidated Outland", role: ShipRole.EXPLORATION, size: ShipSize.SMALL },
  { name: "Mustang Gamma", manufacturer: "Consolidated Outland", role: ShipRole.RACING, size: ShipSize.SMALL },
  { name: "Mustang Delta", manufacturer: "Consolidated Outland", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "Mustang Omega", manufacturer: "Consolidated Outland", role: ShipRole.RACING, size: ShipSize.SMALL },
  { name: "Nomad", manufacturer: "Consolidated Outland", role: ShipRole.CARGO, size: ShipSize.SMALL },
  { name: "Pioneer", manufacturer: "Consolidated Outland", role: ShipRole.SUPPORT, size: ShipSize.CAPITAL },

  // Crusader
  { name: "Ares Star Fighter Inferno", manufacturer: "Crusader", role: ShipRole.HEAVY_FIGHTER, size: ShipSize.SMALL },
  { name: "Ares Star Fighter Ion", manufacturer: "Crusader", role: ShipRole.HEAVY_FIGHTER, size: ShipSize.SMALL },
  { name: "Mercury Star Runner", manufacturer: "Crusader", role: ShipRole.CARGO, size: ShipSize.MEDIUM },
  { name: "C1 Spirit", manufacturer: "Crusader", role: ShipRole.CARGO, size: ShipSize.MEDIUM },
  { name: "A1 Spirit", manufacturer: "Crusader", role: ShipRole.BOMBER, size: ShipSize.MEDIUM },
  { name: "E1 Spirit", manufacturer: "Crusader", role: ShipRole.TRANSPORT, size: ShipSize.MEDIUM },
  { name: "C2 Hercules", manufacturer: "Crusader", role: ShipRole.CARGO, size: ShipSize.LARGE },
  { name: "M2 Hercules", manufacturer: "Crusader", role: ShipRole.TRANSPORT, size: ShipSize.LARGE },
  { name: "A2 Hercules", manufacturer: "Crusader", role: ShipRole.BOMBER, size: ShipSize.LARGE },
  { name: "Genesis Starliner", manufacturer: "Crusader", role: ShipRole.TRANSPORT, size: ShipSize.LARGE },

  // Drake
  { name: "Cutter", manufacturer: "Drake", role: ShipRole.MULTI_ROLE, size: ShipSize.SMALL },
  { name: "Cutter Scout", manufacturer: "Drake", role: ShipRole.SCOUT, size: ShipSize.SMALL },
  { name: "Cutter Rambler", manufacturer: "Drake", role: ShipRole.EXPLORATION, size: ShipSize.SMALL },
  { name: "Buccaneer", manufacturer: "Drake", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "Herald", manufacturer: "Drake", role: ShipRole.SCOUT, size: ShipSize.SMALL },
  { name: "Cutlass Black", manufacturer: "Drake", role: ShipRole.MULTI_ROLE, size: ShipSize.MEDIUM },
  { name: "Cutlass Blue", manufacturer: "Drake", role: ShipRole.INTERCEPTOR, size: ShipSize.MEDIUM },
  { name: "Cutlass Red", manufacturer: "Drake", role: ShipRole.MEDICAL, size: ShipSize.MEDIUM },
  { name: "Corsair", manufacturer: "Drake", role: ShipRole.EXPLORATION, size: ShipSize.LARGE },
  { name: "Caterpillar", manufacturer: "Drake", role: ShipRole.CARGO, size: ShipSize.LARGE },
  { name: "Ironclad", manufacturer: "Drake", role: ShipRole.CARGO, size: ShipSize.LARGE },
  { name: "Ironclad Assault", manufacturer: "Drake", role: ShipRole.GUNSHIP, size: ShipSize.LARGE },
  { name: "Dragonfly", manufacturer: "Drake", role: ShipRole.RACING, size: ShipSize.SNUB },
  { name: "Kraken", manufacturer: "Drake", role: ShipRole.CAPITAL, size: ShipSize.CAPITAL },
  { name: "Vulture", manufacturer: "Drake", role: ShipRole.SALVAGE, size: ShipSize.SMALL },

  // Esperia
  { name: "Blade", manufacturer: "Esperia", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "Talon", manufacturer: "Esperia", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "Talon Shrike", manufacturer: "Esperia", role: ShipRole.BOMBER, size: ShipSize.SMALL },
  { name: "Prowler", manufacturer: "Esperia", role: ShipRole.DROPSHIP, size: ShipSize.MEDIUM },

  // MISC / Mirai
  { name: "Reliant Kore", manufacturer: "MISC", role: ShipRole.CARGO, size: ShipSize.SMALL },
  { name: "Reliant Tana", manufacturer: "MISC", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "Reliant Sen", manufacturer: "MISC", role: ShipRole.SUPPORT, size: ShipSize.SMALL },
  { name: "Reliant Mako", manufacturer: "MISC", role: ShipRole.SCOUT, size: ShipSize.SMALL },
  { name: "Freelancer", manufacturer: "MISC", role: ShipRole.CARGO, size: ShipSize.MEDIUM },
  { name: "Freelancer MAX", manufacturer: "MISC", role: ShipRole.CARGO, size: ShipSize.MEDIUM },
  { name: "Freelancer MIS", manufacturer: "MISC", role: ShipRole.BOMBER, size: ShipSize.MEDIUM },
  { name: "Freelancer DUR", manufacturer: "MISC", role: ShipRole.EXPLORATION, size: ShipSize.MEDIUM },
  { name: "Prospector", manufacturer: "MISC", role: ShipRole.MINING, size: ShipSize.SMALL },
  { name: "Hull A", manufacturer: "MISC", role: ShipRole.CARGO, size: ShipSize.SMALL },
  { name: "Hull B", manufacturer: "MISC", role: ShipRole.CARGO, size: ShipSize.MEDIUM },
  { name: "Hull C", manufacturer: "MISC", role: ShipRole.CARGO, size: ShipSize.LARGE },
  { name: "Hull D", manufacturer: "MISC", role: ShipRole.CARGO, size: ShipSize.LARGE },
  { name: "Hull E", manufacturer: "MISC", role: ShipRole.CARGO, size: ShipSize.CAPITAL },
  { name: "Starfarer", manufacturer: "MISC", role: ShipRole.REFUEL, size: ShipSize.LARGE },
  { name: "Starfarer Gemini", manufacturer: "MISC", role: ShipRole.REFUEL, size: ShipSize.LARGE },
  { name: "Razor", manufacturer: "Mirai", role: ShipRole.RACING, size: ShipSize.SNUB },
  { name: "Razor EX", manufacturer: "Mirai", role: ShipRole.RACING, size: ShipSize.SNUB },
  { name: "Razor LX", manufacturer: "Mirai", role: ShipRole.RACING, size: ShipSize.SNUB },
  { name: "Fury", manufacturer: "Mirai", role: ShipRole.FIGHTER, size: ShipSize.SNUB },
  { name: "Fury MX", manufacturer: "Mirai", role: ShipRole.BOMBER, size: ShipSize.SNUB },
  { name: "Fury LX", manufacturer: "Mirai", role: ShipRole.RACING, size: ShipSize.SNUB },
  { name: "Odyssey", manufacturer: "MISC", role: ShipRole.EXPLORATION, size: ShipSize.CAPITAL },
  { name: "Expanse", manufacturer: "MISC", role: ShipRole.SUPPORT, size: ShipSize.MEDIUM },

  // Origin
  { name: "85X", manufacturer: "Origin", role: ShipRole.TRANSPORT, size: ShipSize.SNUB },
  { name: "100i", manufacturer: "Origin", role: ShipRole.MULTI_ROLE, size: ShipSize.SMALL },
  { name: "125a", manufacturer: "Origin", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "135c", manufacturer: "Origin", role: ShipRole.CARGO, size: ShipSize.SMALL },
  { name: "300i", manufacturer: "Origin", role: ShipRole.MULTI_ROLE, size: ShipSize.SMALL },
  { name: "315p", manufacturer: "Origin", role: ShipRole.EXPLORATION, size: ShipSize.SMALL },
  { name: "325a", manufacturer: "Origin", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "350r", manufacturer: "Origin", role: ShipRole.RACING, size: ShipSize.SMALL },
  { name: "400i", manufacturer: "Origin", role: ShipRole.EXPLORATION, size: ShipSize.MEDIUM },
  { name: "600i Explorer", manufacturer: "Origin", role: ShipRole.EXPLORATION, size: ShipSize.LARGE },
  { name: "600i Touring", manufacturer: "Origin", role: ShipRole.TRANSPORT, size: ShipSize.LARGE },
  { name: "890 Jump", manufacturer: "Origin", role: ShipRole.TRANSPORT, size: ShipSize.CAPITAL },
  { name: "M50", manufacturer: "Origin", role: ShipRole.RACING, size: ShipSize.SNUB },
  { name: "X1", manufacturer: "Origin", role: ShipRole.RACING, size: ShipSize.SNUB },
  { name: "X1 Force", manufacturer: "Origin", role: ShipRole.RACING, size: ShipSize.SNUB },
  { name: "X1 Velocity", manufacturer: "Origin", role: ShipRole.RACING, size: ShipSize.SNUB },

  // RSI
  { name: "Aurora ES", manufacturer: "RSI", role: ShipRole.MULTI_ROLE, size: ShipSize.SMALL },
  { name: "Aurora MR", manufacturer: "RSI", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "Aurora CL", manufacturer: "RSI", role: ShipRole.CARGO, size: ShipSize.SMALL },
  { name: "Aurora LN", manufacturer: "RSI", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "Aurora LX", manufacturer: "RSI", role: ShipRole.EXPLORATION, size: ShipSize.SMALL },
  { name: "Constellation Andromeda", manufacturer: "RSI", role: ShipRole.MULTI_ROLE, size: ShipSize.LARGE },
  { name: "Constellation Aquila", manufacturer: "RSI", role: ShipRole.EXPLORATION, size: ShipSize.LARGE },
  { name: "Constellation Phoenix", manufacturer: "RSI", role: ShipRole.TRANSPORT, size: ShipSize.LARGE },
  { name: "Constellation Taurus", manufacturer: "RSI", role: ShipRole.CARGO, size: ShipSize.LARGE },
  { name: "Mantis", manufacturer: "RSI", role: ShipRole.INTERCEPTOR, size: ShipSize.SMALL },
  { name: "Apollo Triage", manufacturer: "RSI", role: ShipRole.MEDICAL, size: ShipSize.MEDIUM },
  { name: "Apollo Medivac", manufacturer: "RSI", role: ShipRole.MEDICAL, size: ShipSize.MEDIUM },
  { name: "Polaris", manufacturer: "RSI", role: ShipRole.CAPITAL, size: ShipSize.CAPITAL },
  { name: "Perseus", manufacturer: "RSI", role: ShipRole.CORVETTE, size: ShipSize.LARGE },
  { name: "Galaxy", manufacturer: "RSI", role: ShipRole.SUPPORT, size: ShipSize.LARGE },
  { name: "Zeus Mk II CL", manufacturer: "RSI", role: ShipRole.CARGO, size: ShipSize.MEDIUM },
  { name: "Zeus Mk II ES", manufacturer: "RSI", role: ShipRole.EXPLORATION, size: ShipSize.MEDIUM },
  { name: "Zeus Mk II MR", manufacturer: "RSI", role: ShipRole.MULTI_ROLE, size: ShipSize.MEDIUM },
  { name: "Scorpius", manufacturer: "RSI", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "Scorpius Antares", manufacturer: "RSI", role: ShipRole.FIGHTER, size: ShipSize.SMALL },
  { name: "Lynx Rover", manufacturer: "RSI", role: ShipRole.TRANSPORT, size: ShipSize.SNUB },
  { name: "Ursa Rover", manufacturer: "RSI", role: ShipRole.TRANSPORT, size: ShipSize.SNUB },
  { name: "Ursa Medivac", manufacturer: "RSI", role: ShipRole.MEDICAL, size: ShipSize.SNUB },

  // Tumbril
  { name: "Cyclone", manufacturer: "Tumbril", role: ShipRole.TRANSPORT, size: ShipSize.SNUB },
  { name: "Cyclone TR", manufacturer: "Tumbril", role: ShipRole.GUNSHIP, size: ShipSize.SNUB },
  { name: "Cyclone RC", manufacturer: "Tumbril", role: ShipRole.RACING, size: ShipSize.SNUB },
  { name: "Cyclone RN", manufacturer: "Tumbril", role: ShipRole.MEDICAL, size: ShipSize.SNUB },
  { name: "Cyclone AA", manufacturer: "Tumbril", role: ShipRole.GUNSHIP, size: ShipSize.SNUB },
  { name: "Nova Tank", manufacturer: "Tumbril", role: ShipRole.GUNSHIP, size: ShipSize.SMALL },
  { name: "Ranger CV", manufacturer: "Tumbril", role: ShipRole.TRANSPORT, size: ShipSize.SNUB },
  { name: "Ranger TR", manufacturer: "Tumbril", role: ShipRole.GUNSHIP, size: ShipSize.SNUB },
  { name: "Ranger RC", manufacturer: "Tumbril", role: ShipRole.RACING, size: ShipSize.SNUB },
  { name: "Storm", manufacturer: "Tumbril", role: ShipRole.GUNSHIP, size: ShipSize.SMALL },
];
