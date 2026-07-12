import type { OperationAsset } from "@prisma/client";

export function AssetList({ assets }: { assets: OperationAsset[] }) {
  return (
    <ul className="space-y-2">
      {assets.map((asset) => (
        <li key={asset.id} className="rounded-lg border border-cyan-500/20 bg-slate-900/50 p-3 text-sm text-slate-200">
          {asset.name} ({asset.assetType.replaceAll("_", " ")}) x{asset.quantity}
        </li>
      ))}
      {assets.length === 0 ? <li className="text-sm text-slate-400">No assets added yet.</li> : null}
    </ul>
  );
}
