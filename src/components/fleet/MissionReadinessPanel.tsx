export function MissionReadinessPanel({
  readiness,
}: {
  readiness: {
    readyStatus: string;
    readinessScore: number;
    matchingAssets: string[];
    missingRequiredAssets: string[];
    missingOptionalAssets: string[];
    recommendedSubstitutes: string[];
  };
}) {
  return (
    <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
      <h3 className="text-lg font-semibold text-cyan-100">Mission Readiness</h3>
      <p className="mt-2 text-sm text-slate-300">
        Status: <span className="text-cyan-200">{readiness.readyStatus}</span> • Score: {readiness.readinessScore}%
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-cyan-100">Matching Assets</h4>
          <ul className="mt-1 space-y-1 text-xs text-slate-300">
            {readiness.matchingAssets.map((item) => (
              <li key={item}>{item}</li>
            ))}
            {!readiness.matchingAssets.length ? <li className="text-slate-500">None</li> : null}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-amber-300">Missing Required</h4>
          <ul className="mt-1 space-y-1 text-xs text-slate-300">
            {readiness.missingRequiredAssets.map((item) => (
              <li key={item}>{item}</li>
            ))}
            {!readiness.missingRequiredAssets.length ? <li className="text-slate-500">None</li> : null}
          </ul>
        </div>
      </div>
    </section>
  );
}
