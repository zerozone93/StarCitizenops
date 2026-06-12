"use client";

import { STAR_CITIZEN_SHIPS } from "@/data/starCitizenShips";

export function ShipDropdown({
  onSelect,
  name = "shipPreset",
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
        const ship = STAR_CITIZEN_SHIPS[index];
        if (!ship) return;
        onSelect({
          name: ship.name,
          manufacturer: ship.manufacturer,
          role: ship.role,
          size: ship.size,
        });
      }}
    >
      <option value="">Select known ship</option>
      {STAR_CITIZEN_SHIPS.map((ship, index) => (
        <option key={`${ship.manufacturer}-${ship.name}`} value={index}>
          {ship.name} ({ship.manufacturer})
        </option>
      ))}
    </select>
  );
}
