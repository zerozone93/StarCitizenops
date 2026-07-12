"use client";

import { AssetStatus, ShipRole, ShipSize, VehicleRole, VehicleSize } from "@prisma/client";
import { updateFleetAsset } from "@/app/fleet/edit/[id]/actions";

export function EditFleetAssetForm({
  kind,
  initial,
}: {
  kind: "ship" | "vehicle";
  initial: {
    id: string;
    name: string;
    manufacturer: string;
    role: string;
    size: string;
    quantity: number;
    status: string;
    notes: string | null;
  };
}) {
  const roleOptions = kind === "ship" ? Object.values(ShipRole) : Object.values(VehicleRole);
  const sizeOptions = kind === "ship" ? Object.values(ShipSize) : Object.values(VehicleSize);

  return (
    <form action={updateFleetAsset} className="space-y-3 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
      <input type="hidden" name="id" value={initial.id} />
      <input type="hidden" name="assetType" value={kind} />
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="name"
          required
          defaultValue={initial.name}
          placeholder="Name"
          className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
        />
        <input
          name="manufacturer"
          required
          defaultValue={initial.manufacturer}
          placeholder="Manufacturer"
          className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
        />
        <select
          name="role"
          required
          defaultValue={initial.role}
          className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <select
          name="size"
          required
          defaultValue={initial.size}
          className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
        >
          {sizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <select
          name="status"
          required
          defaultValue={initial.status}
          className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
        >
          {Object.values(AssetStatus).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="quantity"
          min={1}
          max={999}
          step={1}
          required
          defaultValue={initial.quantity}
          className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
        />
      </div>
      <textarea
        name="notes"
        defaultValue={initial.notes || ""}
        placeholder="Notes"
        className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
      />
      <button type="submit" className="rounded-md bg-cyan-500 px-4 py-2 font-semibold text-slate-950">
        Save Fleet Asset
      </button>
    </form>
  );
}
