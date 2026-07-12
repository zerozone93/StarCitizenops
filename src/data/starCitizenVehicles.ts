import { VehicleRole, VehicleSize } from "@prisma/client";

export type StarCitizenVehicle = {
  name: string;
  manufacturer: string;
  role: VehicleRole;
  size: VehicleSize;
};

export const STAR_CITIZEN_VEHICLES: StarCitizenVehicle[] = [
  { name: "RSI Ursa Rover", manufacturer: "RSI", role: VehicleRole.TRANSPORT, size: VehicleSize.MEDIUM },
  { name: "RSI Ursa Medivac", manufacturer: "RSI", role: VehicleRole.SUPPORT, size: VehicleSize.MEDIUM },
  { name: "RSI Lynx Rover", manufacturer: "RSI", role: VehicleRole.TRANSPORT, size: VehicleSize.MEDIUM },
  { name: "Tumbril Cyclone", manufacturer: "Tumbril", role: VehicleRole.TRANSPORT, size: VehicleSize.SMALL },
  { name: "Tumbril Cyclone TR", manufacturer: "Tumbril", role: VehicleRole.COMBAT, size: VehicleSize.SMALL },
  { name: "Tumbril Cyclone RC", manufacturer: "Tumbril", role: VehicleRole.RACING, size: VehicleSize.SMALL },
  { name: "Tumbril Cyclone RN", manufacturer: "Tumbril", role: VehicleRole.SUPPORT, size: VehicleSize.SMALL },
  { name: "Tumbril Cyclone AA", manufacturer: "Tumbril", role: VehicleRole.COMBAT, size: VehicleSize.SMALL },
  { name: "Tumbril Nova Tank", manufacturer: "Tumbril", role: VehicleRole.COMBAT, size: VehicleSize.LARGE },
  { name: "Tumbril Ranger CV", manufacturer: "Tumbril", role: VehicleRole.TRANSPORT, size: VehicleSize.SMALL },
  { name: "Tumbril Ranger TR", manufacturer: "Tumbril", role: VehicleRole.COMBAT, size: VehicleSize.SMALL },
  { name: "Tumbril Ranger RC", manufacturer: "Tumbril", role: VehicleRole.RACING, size: VehicleSize.SMALL },
  { name: "Tumbril Storm", manufacturer: "Tumbril", role: VehicleRole.COMBAT, size: VehicleSize.MEDIUM },
  { name: "Greycat PTV", manufacturer: "Greycat", role: VehicleRole.TRANSPORT, size: VehicleSize.SMALL },
  { name: "Greycat ROC", manufacturer: "Greycat", role: VehicleRole.MINING, size: VehicleSize.SMALL },
  { name: "Greycat ROC-DS", manufacturer: "Greycat", role: VehicleRole.MINING, size: VehicleSize.MEDIUM },
  { name: "Drake Mule", manufacturer: "Drake", role: VehicleRole.CARGO, size: VehicleSize.SMALL },
  { name: "Origin X1", manufacturer: "Origin", role: VehicleRole.RACING, size: VehicleSize.SMALL },
  { name: "Origin X1 Force", manufacturer: "Origin", role: VehicleRole.RACING, size: VehicleSize.SMALL },
  { name: "Origin X1 Velocity", manufacturer: "Origin", role: VehicleRole.RACING, size: VehicleSize.SMALL },
  { name: "Aopoa Nox", manufacturer: "Aopoa", role: VehicleRole.RACING, size: VehicleSize.SMALL },
  { name: "Aopoa Nox Kue", manufacturer: "Aopoa", role: VehicleRole.RACING, size: VehicleSize.SMALL },
  { name: "Drake Dragonfly", manufacturer: "Drake", role: VehicleRole.RACING, size: VehicleSize.SMALL },
  { name: "Drake Dragonfly Yellowjacket", manufacturer: "Drake", role: VehicleRole.RACING, size: VehicleSize.SMALL },
];
