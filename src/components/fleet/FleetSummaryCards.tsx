import { FleetSummary } from "@/lib/fleet";

export function FleetSummaryCards({ summary }: { summary: FleetSummary }) {
  const cardClass = "rounded-2xl border bg-slate-900/60 p-4";

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div className={`${cardClass} border-orange-300/20`}>
        <p className="text-xs uppercase tracking-wide text-orange-200/80">Total ships</p>
        <p className="text-2xl font-semibold text-orange-50">{summary.totalShips}</p>
      </div>
      <div className={`${cardClass} border-cyan-300/20`}>
        <p className="text-xs uppercase tracking-wide text-cyan-200/80">Total ground vehicles</p>
        <p className="text-2xl font-semibold text-cyan-100">{summary.totalVehicles}</p>
      </div>
      <div className={`${cardClass} border-amber-300/20`}>
        <p className="text-xs uppercase tracking-wide text-amber-200/80">Combat assets</p>
        <p className="text-2xl font-semibold text-amber-100">{summary.combatShipCount}</p>
      </div>
      <div className={`${cardClass} border-emerald-300/20`}>
        <p className="text-xs uppercase tracking-wide text-emerald-200/80">Available assets</p>
        <p className="text-2xl font-semibold text-emerald-100">{summary.availableAssetCount}</p>
      </div>
      <div className={`${cardClass} border-cyan-300/20`}>
        <p className="text-xs uppercase tracking-wide text-cyan-200/80">Cargo/Logistics</p>
        <p className="text-2xl font-semibold text-cyan-100">{summary.cargoLogisticsCount}</p>
      </div>
      <div className={`${cardClass} border-violet-300/20`}>
        <p className="text-xs uppercase tracking-wide text-violet-200/80">Industrial</p>
        <p className="text-2xl font-semibold text-violet-100">{summary.industrialCount}</p>
      </div>
      <div className={`${cardClass} border-slate-300/25 md:col-span-2 xl:col-span-2`}>
        <p className="text-xs uppercase tracking-wide text-slate-300">Medical/Support</p>
        <p className="text-2xl font-semibold text-slate-100">{summary.medicalSupportCount}</p>
      </div>
    </section>
  );
}
