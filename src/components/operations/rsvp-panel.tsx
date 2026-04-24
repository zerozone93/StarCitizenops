"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, HelpCircle, XCircle } from "lucide-react"

interface RSVPPanelProps {
  operationId: string
  currentStatus?: string | null
}

const statusOptions = [
  { value: "ATTENDING", label: "Attending", icon: CheckCircle, className: "border-green-500/40 text-green-400 hover:bg-green-500/10" },
  { value: "MAYBE", label: "Maybe", icon: HelpCircle, className: "border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10" },
  { value: "DECLINED", label: "Declined", icon: XCircle, className: "border-red-500/40 text-red-400 hover:bg-red-500/10" },
]

export function RSVPPanel({ operationId, currentStatus }: RSVPPanelProps) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  async function handleRSVP(newStatus: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/operations/${operationId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) setStatus(newStatus)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Your RSVP</p>
      <div className="flex gap-2">
        {statusOptions.map((opt) => {
          const isActive = status === opt.value
          return (
            <Button
              key={opt.value}
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => handleRSVP(opt.value)}
              className={`flex-1 gap-1.5 ${isActive ? opt.className + " bg-opacity-20" : ""}`}
            >
              <opt.icon className="h-3.5 w-3.5" />
              <span className="text-xs">{opt.label}</span>
            </Button>
          )
        })}
      </div>
      {status && <p className="text-xs text-muted-foreground text-center">You are marked as: <span className="text-foreground">{status}</span></p>}
    </div>
  )
}
