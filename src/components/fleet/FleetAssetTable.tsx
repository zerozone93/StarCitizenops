import type { ReactNode } from "react";
import { FleetAsset } from "@/lib/fleet";

export function FleetAssetTable({
  title,
  assets,
  renderActions,
}: {
  title: string;
  assets: FleetAsset[];
  renderActions?: (asset: FleetAsset) => ReactNode;
}) {
  return (
    <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
      <h3 className="mb-3 text-lg font-semibold text-cyan-100">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead>
            <tr className="border-b border-cyan-500/20 text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2">Asset</th>
              <th className="py-2">Manufacturer</th>
              <th className="py-2">Role</th>
              <th className="py-2">Size</th>
              <th className="py-2">Status</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Notes</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-b border-cyan-500/10">
                <td className="py-2 font-medium text-cyan-100">{asset.name} x{asset.quantity}</td>
                <td className="py-2">{asset.manufacturer}</td>
                <td className="py-2">{asset.role}</td>
                <td className="py-2">{asset.size}</td>
                <td className="py-2">{asset.status}</td>
                <td className="py-2">{asset.quantity}</td>
                <td className="py-2">{asset.notes || "-"}</td>
                <td className="py-2">{renderActions ? renderActions(asset) : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!assets.length ? <p className="text-sm text-slate-400">No assets found.</p> : null}
    </section>
  );
}
