import { AIPlannerPanel } from "@/components/ai/ai-planner-panel"
import { Brain, Zap, Shield, Users } from "lucide-react"
import { requireAuth } from "@/lib/auth-utils"

export default async function AIPlannerPage() {
  await requireAuth()

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-cyan-400" /> AI Operations Planner
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate comprehensive operation plans powered by AI
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        {[
          { icon: Zap, label: "Instant Planning", desc: "Full tactical plans in seconds" },
          { icon: Shield, label: "Military Structure", desc: "20-section operation format" },
          { icon: Users, label: "Multi-Org Support", desc: "Coalition operation planning" },
        ].map((item) => (
          <div key={item.label} className="cyber-border rounded-lg bg-slate-900 p-3 text-center">
            <item.icon className="h-4 w-4 text-cyan-400 mx-auto mb-2" />
            <p className="font-medium">{item.label}</p>
            <p className="text-muted-foreground mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>

      <AIPlannerPanel />
    </div>
  )
}
