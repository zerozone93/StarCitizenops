export function LoadingState({ label = "Loading tactical data..." }: { label?: string }) {
  return (
    <div className="animate-pulse rounded-xl border border-cyan-400/20 bg-slate-900/40 p-6 text-slate-300">
      {label}
    </div>
  );
}
