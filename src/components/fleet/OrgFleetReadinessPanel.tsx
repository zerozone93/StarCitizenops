import { FleetCapabilityBadges } from "@/components/fleet/FleetCapabilityBadges";

export function OrgFleetReadinessPanel({
  readiness,
}: {
  readiness: {
    totalShips: number;
    totalVehicles: number;
    availableAssetCount: number;
    capabilityCounts: Record<string, number>;
    missingCapabilities: string[];
    recommendedMissionTypes: string[];
  };
}) {
  return (
    <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
      <h3 className="text-lg font-semibold text-cyan-100">Organization Fleet Readiness</h3>
      <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-3">
        <p>Total Ships: {readiness.totalShips}</p>
        <p>Total Vehicles: {readiness.totalVehicles}</p>
        <p>Available Assets: {readiness.availableAssetCount}</p>
      </div>

      <div className="mt-3">
        <FleetCapabilityBadges capabilityCounts={readiness.capabilityCounts} />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-amber-300">Missing Capabilities</h4>
          <p className="text-xs text-slate-300">
            {readiness.missingCapabilities.length
              ? readiness.missingCapabilities.join(", ")
              : "None"}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-cyan-100">Recommended Mission Types</h4>
          <p className="text-xs text-slate-300">
            {readiness.recommendedMissionTypes.length
              ? readiness.recommendedMissionTypes.join(", ")
              : "No recommendations yet"}
          </p>
        </div>
      </div>
    </section>
  );
}
