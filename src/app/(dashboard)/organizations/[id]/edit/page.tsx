"use client"
import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

const FOCUS_TYPES = ["MILITARY","LOGISTICS","MINING","SALVAGE","PIRACY","SECURITY","EXPLORATION","TRADE","MEDICAL","RACING","MIXED"]

export default function EditOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ name: "", tag: "", description: "", focusType: "MIXED", visibility: "PUBLIC" })

  useEffect(() => {
    fetch(`/api/organizations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setForm({ name: data.name, tag: data.tag, description: data.description ?? "", focusType: data.focusType, visibility: data.visibility })
      })
      .finally(() => setFetching(false))
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? "Failed to update")
      else router.push(`/organizations/${id}`)
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="text-muted-foreground text-sm">Loading...</div>

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Edit Organization</h1>
      <form onSubmit={handleSubmit}>
        <Card className="cyber-border bg-slate-900">
          <CardHeader><CardTitle className="text-base">Update Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label>Tag</Label>
              <Input name="tag" value={form.tag} onChange={handleChange} required maxLength={10} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea name="description" value={form.description} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Focus Type</Label>
                <Select value={form.focusType} onValueChange={(v) => setForm({ ...form, focusType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FOCUS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
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
            {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-3">{error}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-cyan-500 text-slate-900 hover:bg-cyan-400" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
