"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Shield, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", password: "", handle: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Registration failed")
      } else {
        router.push("/login?registered=1")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background tactical-grid flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Shield className="h-8 w-8 text-cyan-400" />
            <span className="font-bold tracking-widest text-cyan-400 glow-cyan">STARCITIZENOPS</span>
          </Link>
        </div>
        <Card className="cyber-border bg-slate-900">
          <CardHeader>
            <CardTitle className="text-xl">Enlist</CardTitle>
            <CardDescription>Create your operations platform account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" name="name" placeholder="Admiral Chen" value={form.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="handle">Star Citizen Handle</Label>
                <Input id="handle" name="handle" placeholder="ChEN_RSI" value={form.handle} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="pilot@verse.com" value={form.email} onChange={handleChange} required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required autoComplete="new-password" minLength={8} />
              </div>
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-2">{error}</p>
              )}
              <Button type="submit" className="w-full bg-cyan-500 text-slate-900 hover:bg-cyan-400" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already enlisted?{" "}
              <Link href="/login" className="text-cyan-400 hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
