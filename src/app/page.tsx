import Link from "next/link"
import { Shield, Crosshair, Brain, Users, Building2, ChevronRight, Zap, Lock, Globe } from "lucide-react"
import { ItemFinderSection } from "@/components/home/item-finder-section"
import { Button } from "@/components/ui/button"

const features = [
  { icon: Crosshair, title: "Operation Planning", description: "Create and manage complex multi-stage operations with full mission briefs, ROE, and phase timelines." },
  { icon: Building2, title: "Organizations", description: "Manage your org, members, roles, and assets. Support for alliances and cross-org operations." },
  { icon: Users, title: "Coalition Ops", description: "Coordinate joint operations across multiple organizations with coalition command structures." },
  { icon: Brain, title: "AI Operations Planner", description: "Generate comprehensive operation plans instantly using AI with full tactical structure." },
  { icon: Lock, title: "Role-Based Access", description: "Granular permissions for commanders, officers, and crew. Keep sensitive ops classified." },
  { icon: Globe, title: "Real-Time Coordination", description: "RSVP system, assignment tracking, and live activity feeds keep your crew in sync." },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background tactical-grid">
      <header className="border-b border-border bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-cyan-400" />
            <span className="font-bold tracking-widest text-cyan-400 text-sm glow-cyan">STARCITIZENOPS</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" className="bg-cyan-500 text-slate-900 hover:bg-cyan-400" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-mono mb-8">
          <Zap className="h-3 w-3" />
          <span>TACTICAL OPERATIONS PLATFORM</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          <span className="text-foreground">Command Your</span>
          <br />
          <span className="text-cyan-400 glow-cyan">Fleet Operations</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          The professional operations platform for Star Citizen organizations. Plan missions,
          coordinate fleets, and execute tactical operations with military precision.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" className="bg-cyan-500 text-slate-900 hover:bg-cyan-400 w-full sm:w-auto" asChild>
            <Link href="/register">
              Launch Platform <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
            <Link href="/login">Sign In to Dashboard</Link>
          </Button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-2">Full-Stack Tactical Operations</h2>
          <p className="text-muted-foreground">Everything your organization needs to coordinate at scale</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div key={feature.title} className="cyber-border rounded-lg bg-slate-900 p-6 hover:border-cyan-500/40 transition-all">
              <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                <feature.icon className="h-5 w-5 text-cyan-400" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <ItemFinderSection />

      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="cyber-border rounded-xl bg-slate-900 p-12">
          <Shield className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Ready to Deploy?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join your organization and start planning your next major operation today.
          </p>
          <Button size="lg" className="bg-cyan-500 text-slate-900 hover:bg-cyan-400" asChild>
            <Link href="/register">Create Your Account</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border bg-slate-900/50 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-muted-foreground font-mono">STARCITIZENOPS v0.1.0</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Not affiliated with Cloud Imperium Games. Star Citizen® is a registered trademark.
          </p>
        </div>
      </footer>
    </div>
  )
}
