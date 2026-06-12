export function MissionTimeline({ phases }: { phases?: string | null }) {
  const items = (phases || "").split(">").map((item) => item.trim()).filter(Boolean);

  return (
    <div className="space-y-2">
      {items.length ? (
        items.map((phase, index) => (
          <div key={`${phase}-${index}`} className="rounded-lg border border-cyan-500/20 bg-slate-900/50 p-3 text-sm text-slate-200">
            Phase {index + 1}: {phase}
          </div>
        ))
      ) : (
        <p className="text-sm text-slate-400">No mission phases defined.</p>
      )}
    </div>
  );
}
