"use client";

import { useEffect, useMemo, useState } from "react";
import { STAR_CITIZEN_SHIPS } from "@/data/starCitizenShips";

type ShipCatalogResponse = {
  ships?: Array<{
    name: string;
    manufacturer: string;
    role: string;
    size: string;
  }>;
};

const REQUIRED_SHIPS = [
  {
    name: "Ironclad",
    manufacturer: "Drake",
    role: "CARGO",
    size: "LARGE",
  },
  {
    name: "Ironclad Assault",
    manufacturer: "Drake",
    role: "GUNSHIP",
    size: "LARGE",
  },
] as const;

function withRequiredShips(
  ships: Array<{ name: string; manufacturer: string; role: string; size: string }>
) {
  const map = new Map(ships.map((ship) => [ship.name.toLowerCase(), ship]));
  for (const required of REQUIRED_SHIPS) {
    if (!map.has(required.name.toLowerCase())) {
      map.set(required.name.toLowerCase(), required);
    }
  }

  const merged = Array.from(map.values());
  const pinned = merged.filter((ship) => REQUIRED_SHIPS.some((required) => required.name === ship.name));
  const others = merged
    .filter((ship) => !REQUIRED_SHIPS.some((required) => required.name === ship.name))
    .sort((a, b) => {
      const m = a.manufacturer.localeCompare(b.manufacturer);
      if (m !== 0) return m;
      return a.name.localeCompare(b.name);
    });

  return [...pinned, ...others];
}

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
  const [ships, setShips] = useState(withRequiredShips(STAR_CITIZEN_SHIPS));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const response = await fetch("/api/fleet/ships/catalog", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as ShipCatalogResponse;
        if (!cancelled && payload.ships?.length) {
          setShips(withRequiredShips(payload.ships));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(() => withRequiredShips(ships), [ships]);

  return (
    <div className="space-y-1">
      <select
        name={name}
        className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm text-cyan-100"
        defaultValue=""
        onChange={(event) => {
          const index = Number(event.target.value);
          if (Number.isNaN(index) || index < 0) return;
          const ship = options[index];
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
        {options.map((ship, index) => (
          <option key={`${ship.manufacturer}-${ship.name}`} value={index}>
            {ship.name} ({ship.manufacturer})
          </option>
        ))}
      </select>
      <p className="text-[11px] text-slate-500">
        {loading ? "Updating ship catalog..." : `Catalog loaded with ${options.length} ships (auto-refreshed every 14 days).`}
      </p>
    </div>
  );
}
