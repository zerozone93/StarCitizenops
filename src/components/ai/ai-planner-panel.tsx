"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Brain, Loader2, Copy, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AIPlannerPanel() {
  const [prompt, setPrompt] = useState("")
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    if (!prompt.trim()) return
    setLoading(true)
    setResult("")
    try {
      const res = await fetch("/api/ai-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data.result)
      } else {
        setResult(`Error: ${data.error ?? "Failed to generate plan"}`)
      }
    } catch {
      setResult("Error: Network request failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <Card className="cyber-border bg-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-cyan-400" />
            Operation Brief
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Describe your operation. For example:\n\n"We have 3 Hammerheads, 6 fighters, 2 Cutlass Reds. We need to escort a cargo convoy from Hurston to microTech through contested space. Expect pirate interdiction. We have 15 players total."`}
            className="min-h-[160px] resize-none font-mono text-sm"
          />
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full bg-cyan-500 text-slate-900 hover:bg-cyan-400"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating Plan...</>
            ) : (
              <><Brain className="h-4 w-4 mr-2" /> Generate Operation Plan</>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="cyber-border bg-slate-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-cyan-400">▶</span> Generated Plan
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-mono leading-relaxed overflow-auto max-h-[600px] scrollbar-thin">
              {result}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
