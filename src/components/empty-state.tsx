type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-orange-300/35 bg-slate-900/55 p-8 text-center">
      <p className="text-xs uppercase tracking-[0.22em] text-orange-100/80">Awaiting Orders</p>
      <h3 className="mt-2 text-lg font-semibold text-orange-50">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </div>
  );
}
