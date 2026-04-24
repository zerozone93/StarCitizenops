"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "", starCitizenHandle: "", bio: "", timezone: "", availability: "", preferredRoles: "",
  })

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setForm({
            name: data.name ?? "",
            starCitizenHandle: data.starCitizenHandle ?? "",
            bio: data.bio ?? "",
            timezone: data.timezone ?? "",
            availability: data.availability ?? "",
            preferredRoles: (data.preferredRoles ?? []).join(", "),
          })
        }
      })
      .finally(() => setFetching(false))
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          preferredRoles: form.preferredRoles.split(",").map(r => r.trim()).filter(Boolean),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to update profile")
      } else {
        router.push("/profile")
      }
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="text-muted-foreground text-sm">Loading...</div>

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Edit Profile</h1>
      <form onSubmit={handleSubmit}>
        <Card className="cyber-border bg-slate-900">
          <CardHeader><CardTitle className="text-base">Pilot Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input name="name" value={form.name} onChange={handleChange} placeholder="Admiral Chen" />
            </div>
            <div className="space-y-2">
              <Label>Star Citizen Handle</Label>
              <Input name="starCitizenHandle" value={form.starCitizenHandle} onChange={handleChange} placeholder="YourRSIHandle" />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Tell your org about yourself..." className="min-h-[100px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input name="timezone" value={form.timezone} onChange={handleChange} placeholder="UTC-5" />
              </div>
              <div className="space-y-2">
                <Label>Availability</Label>
                <Input name="availability" value={form.availability} onChange={handleChange} placeholder="Weekends, Evenings" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preferred Roles</Label>
              <Input name="preferredRoles" value={form.preferredRoles} onChange={handleChange} placeholder="Pilot, Gunner, Command" />
              <p className="text-xs text-muted-foreground">Comma-separated roles</p>
            </div>
            {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-3">{error}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-cyan-500 text-slate-900 hover:bg-cyan-400" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {loading ? "Saving..." : "Save Profile"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
