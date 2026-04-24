"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Crosshair, Loader2 } from "lucide-react"

const OP_TYPES = [
  "FLEET_PATROL","GROUND_ASSAULT","BOUNTY_OPERATION","CARGO_CONVOY","MINING_SECURITY",
  "SALVAGE_OPERATION","RESCUE_OPERATION","MEDICAL_SUPPORT","EXPLORATION_MISSION",
  "BASE_DEFENSE","JOINT_FLEET_EXERCISE","COMBINED_ARMS_ASSAULT","PIRACY_INTERDICTION",
  "ANTI_PIRACY_ESCORT","CUSTOM"
]

export default function NewOperationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    title: "", type: "CUSTOM", description: "", objective: "", location: "",
    threatLevel: "MEDIUM", organizationId: "", startTime: "",
    missionBrief: "", rulesOfEngagement: "", contingencyPlans: "",
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to create operation")
      } else {
        router.push(`/operations/${data.id}`)
      }
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Crosshair className="h-6 w-6 text-cyan-400" /> Plan New Operation
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Define your mission parameters</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="cyber-border bg-slate-900">
          <CardHeader><CardTitle className="text-base">Mission Identity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Operation Title *</Label>
              <Input id="title" name="title" placeholder="Operation Iron Dawn" value={form.title} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OP_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Threat Level</Label>
                <Select value={form.threatLevel} onValueChange={(v) => setForm({ ...form, threatLevel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["LOW","MEDIUM","HIGH","CRITICAL"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="Stanton System – Hurston" value={form.location} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time (UTC)</Label>
              <Input id="startTime" name="startTime" type="datetime-local" value={form.startTime} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationId">Organization ID *</Label>
              <Input id="organizationId" name="organizationId" placeholder="Enter your organization ID" value={form.organizationId} onChange={handleChange} required />
              <p className="text-xs text-muted-foreground">Find your org ID on the Organizations page</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cyber-border bg-slate-900">
          <CardHeader><CardTitle className="text-base">Mission Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Brief overview of the operation" value={form.description} onChange={handleChange} className="min-h-[80px]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="objective">Primary Objective</Label>
              <Textarea id="objective" name="objective" placeholder="Main goal of this operation" value={form.objective} onChange={handleChange} className="min-h-[80px]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="missionBrief">Mission Brief</Label>
              <Textarea id="missionBrief" name="missionBrief" placeholder="Full mission briefing..." value={form.missionBrief} onChange={handleChange} className="min-h-[120px]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rulesOfEngagement">Rules of Engagement</Label>
              <Textarea id="rulesOfEngagement" name="rulesOfEngagement" placeholder="ROE for this operation" value={form.rulesOfEngagement} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contingencyPlans">Contingency Plans</Label>
              <Textarea id="contingencyPlans" name="contingencyPlans" placeholder="Backup plans and fallback procedures" value={form.contingencyPlans} onChange={handleChange} />
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-3">{error}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" className="bg-cyan-500 text-slate-900 hover:bg-cyan-400" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {loading ? "Creating..." : "Create Operation"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
