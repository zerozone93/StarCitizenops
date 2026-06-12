import type { ReactNode } from "react";
import { FleetAsset } from "@/lib/fleet";

export function FleetAssetCard({
  asset,
  editHref,
  onDelete,
}: {
  asset: FleetAsset;
  editHref: string;
  onDelete?: ReactNode;
}) {
  return (
    <article className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4 text-sm text-slate-300">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold text-cyan-100">{asset.name} x{asset.quantity}</h4>
        <span className="rounded bg-slate-800 px-2 py-1 text-xs uppercase tracking-wide text-slate-300">
          {asset.status}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-400">{asset.manufacturer} • {asset.role} • {asset.size}</p>
      {asset.notes ? <p className="mt-2 text-xs text-slate-400">{asset.notes}</p> : null}
      <div className="mt-3 flex items-center gap-3">
        <a href={editHref} className="rounded-md bg-cyan-500/20 px-3 py-1.5 text-xs text-cyan-100">
          Edit
        </a>
        {onDelete}
      </div>
    </article>
  );
}
