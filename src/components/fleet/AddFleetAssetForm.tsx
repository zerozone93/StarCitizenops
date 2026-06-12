"use client";

import { useMemo, useState } from "react";
import { AssetStatus, ShipRole, ShipSize, VehicleRole, VehicleSize } from "@prisma/client";
import { ShipDropdown } from "@/components/fleet/ShipDropdown";
import { VehicleDropdown } from "@/components/fleet/VehicleDropdown";
import { addFleetAsset } from "@/app/fleet/add/actions";

type AssetTypeValue = "ship" | "vehicle";

export function AddFleetAssetForm() {
  const [assetType, setAssetType] = useState<AssetTypeValue>("ship");
  const [isCustom, setIsCustom] = useState(false);
  const [prefill, setPrefill] = useState({
    name: "",
    manufacturer: "",
    role: "",
    size: "",
  });

  const roleOptions = useMemo(
    () => (assetType === "ship" ? Object.values(ShipRole) : Object.values(VehicleRole)),
    [assetType]
  );

  const sizeOptions = useMemo(
    () => (assetType === "ship" ? Object.values(ShipSize) : Object.values(VehicleSize)),
    [assetType]
  );

  return (
    <form action={addFleetAsset} className="space-y-3 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-300">Asset type</label>
          <select
            name="assetType"
            value={assetType}
            onChange={(event) => {
              const nextType = event.target.value as AssetTypeValue;
              setAssetType(nextType);
              setPrefill({ name: "", manufacturer: "", role: "", size: "" });
            }}
            className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm text-cyan-100"
          >
            <option value="ship">Ship</option>
            <option value="vehicle">Ground Vehicle</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-300">Status</label>
          <select
            name="status"
            defaultValue={AssetStatus.AVAILABLE}
            className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm text-cyan-100"
          >
            {Object.values(AssetStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" checked={isCustom} onChange={(event) => setIsCustom(event.target.checked)} />
        Custom asset entry
      </label>

      {!isCustom ? (
        assetType === "ship" ? (
          <ShipDropdown onSelect={(ship) => setPrefill(ship)} />
        ) : (
          <VehicleDropdown onSelect={(vehicle) => setPrefill(vehicle)} />
        )
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <input
          required
          name="name"
          value={prefill.name}
          onChange={(event) => setPrefill((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Name"
          className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
        />
        <input
          required
          name="manufacturer"
          value={prefill.manufacturer}
          onChange={(event) => setPrefill((prev) => ({ ...prev, manufacturer: event.target.value }))}
          placeholder="Manufacturer"
          className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
        />
        <select
          name="role"
          value={prefill.role}
          onChange={(event) => setPrefill((prev) => ({ ...prev, role: event.target.value }))}
          required
          className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
        >
          <option value="">Select role</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <select
          name="size"
          value={prefill.size}
          onChange={(event) => setPrefill((prev) => ({ ...prev, size: event.target.value }))}
          required
          className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
        >
          <option value="">Select size</option>
          {sizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          type="number"
          name="quantity"
          min={1}
          max={999}
          step={1}
          required
          defaultValue={1}
          className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
          placeholder="Quantity"
        />
        <input
          type="text"
          name="notes"
          className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
          placeholder="Notes (optional)"
        />
      </div>

      <button type="submit" className="rounded-md bg-cyan-500 px-4 py-2 font-semibold text-slate-950">
        Add to Fleet
      </button>
    </form>
  );
}
