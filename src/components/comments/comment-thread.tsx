"use client"
import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatRelativeTime } from "@/lib/utils"
import { Send } from "lucide-react"

interface Comment {
  id: string
  body: string
  createdAt: Date
  user: { name?: string | null; email?: string | null }
}

interface CommentThreadProps {
  comments: Comment[]
  operationId: string
}

export function CommentThread({ comments, operationId }: CommentThreadProps) {
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [localComments, setLocalComments] = useState(comments)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/operations/${operationId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      })
      if (res.ok) {
        const newComment = await res.json()
        setLocalComments([...localComments, newComment])
        setBody("")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin pr-1">
        {localComments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first.</p>
        )}
        {localComments.map((comment) => {
          const initials = (comment.user.name ?? comment.user.email ?? "?")
            .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
          return (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-slate-800 rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">{comment.user.name ?? comment.user.email}</span>
                  <span className="text-[10px] text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{comment.body}</p>
              </div>
            </div>
          )
        })}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[60px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) handleSubmit(e as unknown as React.FormEvent)
          }}
        />
        <Button type="submit" size="icon" disabled={submitting || !body.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
