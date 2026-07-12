"use client";

import { STAR_CITIZEN_VEHICLES } from "@/data/starCitizenVehicles";

export function VehicleDropdown({
  onSelect,
  name = "vehiclePreset",
}: {
  onSelect: (selected: {
    name: string;
    manufacturer: string;
    role: string;
    size: string;
  }) => void;
  name?: string;
}) {
  return (
    <select
      name={name}
      className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm text-cyan-100"
      defaultValue=""
      onChange={(event) => {
        const index = Number(event.target.value);
        if (Number.isNaN(index) || index < 0) return;
        const vehicle = STAR_CITIZEN_VEHICLES[index];
        if (!vehicle) return;
        onSelect({
          name: vehicle.name,
          manufacturer: vehicle.manufacturer,
          role: vehicle.role,
          size: vehicle.size,
        });
      }}
    >
      <option value="">Select known ground vehicle</option>
      {STAR_CITIZEN_VEHICLES.map((vehicle, index) => (
        <option key={`${vehicle.manufacturer}-${vehicle.name}`} value={index}>
          {vehicle.name} ({vehicle.manufacturer})
        </option>
      ))}
    </select>
  );
}
