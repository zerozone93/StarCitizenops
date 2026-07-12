import { FleetSummary } from "@/lib/fleet";

export function FleetReadinessPanel({ summary }: { summary: FleetSummary }) {
  return (
    <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
      <h3 className="text-lg font-semibold text-cyan-100">Fleet Readiness</h3>
      <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
        <p>Total Ships: {summary.totalShips}</p>
        <p>Total Vehicles: {summary.totalVehicles}</p>
        <p>Combat Ships: {summary.combatShipCount}</p>
        <p>Cargo/Logistics: {summary.cargoLogisticsCount}</p>
        <p>Industrial: {summary.industrialCount}</p>
        <p>Medical/Support: {summary.medicalSupportCount}</p>
      </div>
    </section>
  );
}
