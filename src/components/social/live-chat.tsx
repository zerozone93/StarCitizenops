"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Sender = {
  id: string;
  name: string | null;
  email: string | null;
  starCitizenHandle: string | null;
};

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  sender: Sender;
  reactionSummary: Record<string, number>;
  myReactions: string[];
};

export type ChatMember = {
  id: string;
  name: string | null;
  starCitizenHandle: string | null;
};

type LiveChatProps = {
  conversationId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  members?: ChatMember[];
};

const REACTIONS = ["🔥", "🫡", "✅", "👀", "💬"];

function renderBody(body: string) {
  // Split on @handle tokens and highlight them
  const parts = body.split(/(@\w+)/g);
  return parts.map((part, i) =>
    /^@\w+$/.test(part) ? (
      <span key={i} className="font-semibold text-cyan-300">{part}</span>
    ) : (
      part
    )
  );
}

export function LiveChat({ conversationId, currentUserId, initialMessages, members = [] }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtered mention suggestions
  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return members
      .filter((m) => {
        const handle = (m.starCitizenHandle || "").toLowerCase();
        const name = (m.name || "").toLowerCase();
        return handle.includes(q) || name.includes(q);
      })
      .slice(0, 8);
  }, [mentionQuery, members]);

  const handleDraftChange = useCallback((value: string, cursorPos: number) => {
    setDraft(value);
    // Detect if cursor is inside an @word
    const textBefore = value.slice(0, cursorPos);
    const match = /@(\w*)$/.exec(textBefore);
    if (match) {
      setMentionQuery(match[1]);
      setMentionStart(match.index);
    } else {
      setMentionQuery(null);
    }
  }, []);

  const insertMention = useCallback((handle: string) => {
    const before = draft.slice(0, mentionStart);
    const after = draft.slice(inputRef.current?.selectionStart ?? draft.length);
    const newDraft = `${before}@${handle} ${after}`;
    setDraft(newDraft);
    setMentionQuery(null);
    // Restore focus
    setTimeout(() => {
      if (inputRef.current) {
        const pos = before.length + handle.length + 2;
        inputRef.current.setSelectionRange(pos, pos);
        inputRef.current.focus();
      }
    }, 0);
  }, [draft, mentionStart]);

  const refreshMessages = useCallback(async () => {
    const response = await fetch(`/api/social/conversations/${conversationId}/messages`, {
      cache: "no-store",
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { messages: ChatMessage[] };
    setMessages(payload.messages);
  }, [conversationId]);

  useEffect(() => {
    const timer = setInterval(() => {
      void refreshMessages();
    }, 2000);

    return () => clearInterval(timer);
  }, [refreshMessages]);

  const submitMessage = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/social/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });

      if (response.ok) {
        const payload = (await response.json()) as { messages: ChatMessage[] };
        setMessages(payload.messages);
        setDraft("");
      }
    } finally {
      setSending(false);
    }
  }, [conversationId, draft, sending]);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const response = await fetch(`/api/social/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        await refreshMessages();
      }
    },
    [refreshMessages]
  );

  const lastUpdated = useMemo(() => {
    if (!messages.length) return "No messages yet";
    const latest = messages[messages.length - 1];
    return `Last update ${new Date(latest.createdAt).toLocaleTimeString()}`;
  }, [messages]);

  return (
    <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-cyan-100">Live Command Chat</h3>
        <p className="text-xs text-slate-400">{lastUpdated}</p>
      </div>

      <div className="max-h-[420px] space-y-2 overflow-auto rounded-lg border border-cyan-500/20 bg-slate-950/60 p-3">
        {messages.map((message) => {
          const mine = message.sender.id === currentUserId;
          return (
            <article key={message.id} className={`rounded-lg border p-3 ${mine ? "border-cyan-500/40 bg-cyan-500/10" : "border-slate-700 bg-slate-900/70"}`}>
              <p className="text-xs text-slate-400">
                {message.sender.starCitizenHandle || message.sender.name || message.sender.email || "Operator"} · {new Date(message.createdAt).toLocaleTimeString()}
              </p>
              <p className="mt-1 text-sm text-slate-200">{renderBody(message.body)}</p>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {REACTIONS.map((emoji) => {
                  const count = message.reactionSummary[emoji] || 0;
                  const active = message.myReactions.includes(emoji);
                  return (
                    <button
                      key={`${message.id}-${emoji}`}
                      type="button"
                      onClick={() => void toggleReaction(message.id, emoji)}
                      className={`rounded-md border px-2 py-1 text-xs ${active ? "border-cyan-300 bg-cyan-400/20 text-cyan-100" : "border-slate-600 bg-slate-800/80 text-slate-200"}`}
                    >
                      {emoji} {count ? count : ""}
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
        {!messages.length ? <p className="text-sm text-slate-400">Conversation is quiet. Start the thread.</p> : null}
      </div>

      <div className="relative mt-3 flex gap-2">
        {mentionSuggestions.length > 0 && (
          <ul className="absolute bottom-full left-0 z-20 mb-1 w-60 rounded-lg border border-cyan-500/30 bg-slate-900 py-1 shadow-xl">
            {mentionSuggestions.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); insertMention(member.starCitizenHandle || member.name || member.id); }}
                  className="w-full px-3 py-1.5 text-left text-sm text-cyan-100 hover:bg-cyan-500/20"
                >
                  <span className="font-medium">@{member.starCitizenHandle || member.name || "unknown"}</span>
                  {member.name && member.starCitizenHandle ? (
                    <span className="ml-2 text-xs text-slate-400">{member.name}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => handleDraftChange(event.target.value, event.target.selectionStart ?? draft.length)}
          onKeyDown={(event) => {
            if (event.key === "Escape") { setMentionQuery(null); return; }
            if (event.key === "Enter" && !event.shiftKey && mentionSuggestions.length === 0) {
              event.preventDefault();
              void submitMessage();
            }
          }}
          className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
          placeholder="Post live update — type @ to mention someone"
          maxLength={2000}
        />
        <button
          type="button"
          onClick={() => void submitMessage()}
          disabled={sending}
          className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Sending" : "Send"}
        </button>
      </div>
    </section>
  );
}
