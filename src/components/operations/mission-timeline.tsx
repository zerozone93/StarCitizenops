interface Phase {
  phase: number
  title: string
  description: string
  duration?: string
}

interface MissionTimelineProps {
  phases: Phase[]
}

export function MissionTimeline({ phases }: MissionTimelineProps) {
  return (
    <div className="space-y-0">
      {phases.map((phase, idx) => (
        <div key={idx} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-bold shrink-0">
              {phase.phase}
            </div>
            {idx < phases.length - 1 && (
              <div className="w-px flex-1 bg-border my-1" />
            )}
          </div>
          <div className="pb-6">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">{phase.title}</h4>
              {phase.duration && (
                <span className="text-xs text-muted-foreground bg-slate-800 px-2 py-0.5 rounded-full">
                  {phase.duration}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{phase.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
