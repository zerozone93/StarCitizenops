"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Loader2 } from "lucide-react"

const FOCUS_TYPES = ["MILITARY","LOGISTICS","MINING","SALVAGE","PIRACY","SECURITY","EXPLORATION","TRADE","MEDICAL","RACING","MIXED"]

export default function NewOrganizationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "", tag: "", description: "", focusType: "MIXED", visibility: "PUBLIC",
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to create organization")
      } else {
        router.push(`/organizations/${data.id}`)
      }
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-cyan-400" /> Found Organization
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Establish a new organization on the platform</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="cyber-border bg-slate-900">
          <CardHeader><CardTitle className="text-base">Organization Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input id="name" name="name" placeholder="Iron Wolves PMC" value={form.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag">Tag *</Label>
              <Input id="tag" name="tag" placeholder="IWPMC" value={form.tag} onChange={handleChange} required maxLength={10} className="uppercase" />
              <p className="text-xs text-muted-foreground">Short identifier (max 10 chars)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Tell the verse about your organization..." value={form.description} onChange={handleChange} className="min-h-[100px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Focus Type</Label>
                <Select value={form.focusType} onValueChange={(v) => setForm({ ...form, focusType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FOCUS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-3">{error}</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-cyan-500 text-slate-900 hover:bg-cyan-400" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {loading ? "Creating..." : "Found Organization"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
