"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type OrgMembership = {
  orgTag: string;
  role: string;
};

type SenderBadge = {
  key: string;
  label: string;
  tone: "cyan" | "amber" | "emerald" | "rose";
  hint: string;
};

type Sender = {
  id: string;
  name: string | null;
  email: string | null;
  starCitizenHandle: string | null;
  orgMemberships?: OrgMembership[];
  badges?: SenderBadge[];
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
  title?: string;
  subtitle?: string;
  placeholder?: string;
  emptyMessage?: string;
  organizationId?: string | null;
};

const EMOJI_QUICK = ["🔥", "🫡", "✅", "👀", "💬", "❤️", "👍", "😂", "🚀", "⚡"];
const EMOJI_PICKER = [
  "🔥","🫡","✅","👀","💬","❤️","👍","👎","😂","😮","😢","😡","🚀","⚡","💥","🎯","📡",
  "🌌","🛸","💎","🏆","⭐","🎉","🤝","🫶","👏","💪","🙏","⚔️","🛡️","🎖️",
];

function renderBody(body: string) {
  const parts = body.split(/(@\w+)/g);
  return parts.map((part, i) =>
    /^@\w+$/.test(part) ? (
      <span key={i} className="font-semibold text-sky-300">{part}</span>
    ) : (
      part
    )
  );
}

function getSenderDisplay(sender: Sender) {
  return sender.starCitizenHandle || sender.name || sender.email || "Operator";
}

function getSenderInitials(label: string) {
  return (
    label.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("") || "OP"
  );
}

function EmojiPopover({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-full right-0 z-30 mb-1 w-64 rounded-lg border border-slate-700 bg-[#1e1f22] p-2 shadow-xl">
      <div className="grid grid-cols-8 gap-0.5">
        {EMOJI_PICKER.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onPick(emoji); onClose(); }}
            className="rounded px-0.5 py-0.5 text-base hover:bg-slate-700"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}


const ROLE_COLORS: Record<string, string> = {
  OWNER: "text-rose-300 border-rose-500/30 bg-rose-500/10",
  OFFICER: "text-orange-300 border-orange-500/30 bg-orange-500/10",
  COMMANDER: "text-blue-300 border-blue-500/30 bg-blue-500/10",
  TEAM_LEADER: "text-cyan-300 border-cyan-500/30 bg-cyan-500/10",
  MEMBER: "text-slate-300 border-slate-500/30 bg-slate-700/30",
  GUEST: "text-gray-400 border-gray-600/30 bg-gray-700/20",
};

const BADGE_TONE_STYLES: Record<string, string> = {
  cyan: "border-sky-300/35 bg-sky-400/15 text-sky-100",
  amber: "border-amber-300/35 bg-amber-400/15 text-amber-100",
  emerald: "border-emerald-300/35 bg-emerald-400/15 text-emerald-100",
  rose: "border-rose-300/35 bg-rose-400/15 text-rose-100",
};

export function LiveChat({
  conversationId,
  currentUserId,
  initialMessages,
  members = [],
  title = "Live Command Chat",
  subtitle,
  placeholder = "Post live update — type @ to mention someone",
  emptyMessage = "Conversation is quiet. Start the thread.",
  organizationId,
}: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const [pickerOpenFor, setPickerOpenFor] = useState<string | null>(null);
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
    <section className="rounded-xl border border-slate-700 bg-[#2b2d31] p-3">
      <div className="mb-2 flex items-center justify-between gap-3 border-b border-slate-700/70 pb-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-100">{title}</h3>
          {subtitle ? <p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p> : null}
        </div>
        <p className="shrink-0 text-[11px] text-slate-500">{lastUpdated}</p>
      </div>

      <div className="max-h-[520px] space-y-1 overflow-auto rounded-lg bg-[#313338] p-2">
        {messages.map((message) => {
          const mine = message.sender.id === currentUserId;
          const senderLabel =
            message.sender.starCitizenHandle || message.sender.name || message.sender.email || "Operator";
          const relevantOrg = message.sender.orgMemberships?.find(
            (m) => organizationId ? m.orgTag === message.sender.orgMemberships?.find((o) => o.orgTag)?.orgTag : false
          ) || message.sender.orgMemberships?.[0];
          const senderBadges = message.sender.badges ?? [];
          return (
            <article
              key={message.id}
              className={`rounded-md px-2 py-2 transition ${mine ? "bg-slate-700/50" : "hover:bg-slate-800/65"}`}
            >
              <div className="flex gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[11px] font-semibold text-slate-100">
                  {(senderLabel[0] || "O").toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-100">{senderLabel}</span>
                    {relevantOrg ? (
                      <span className={`rounded border px-1 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ROLE_COLORS[relevantOrg.role] ?? ROLE_COLORS.MEMBER}`}>
                        [{relevantOrg.orgTag}] {relevantOrg.role.replace("_", " ")}
                      </span>
                    ) : null}
                    {senderBadges.map((badge) => (
                      <span
                        key={badge.key}
                        title={badge.hint}
                        className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] ${BADGE_TONE_STYLES[badge.tone] ?? BADGE_TONE_STYLES.cyan}`}
                      >
                        {badge.label}
                      </span>
                    ))}
                    <span className="text-[11px] text-slate-500">{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-200">{renderBody(message.body)}</p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {/* Active reactions */}
                    {[...new Set([...EMOJI_QUICK, ...Object.keys(message.reactionSummary)])].map((emoji) => {
                      const count = message.reactionSummary[emoji] || 0;
                      const active = message.myReactions.includes(emoji);
                      if (!count && !active) return null;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => void toggleReaction(message.id, emoji)}
                          className={`rounded-md border px-1.5 py-0.5 text-xs transition ${active ? "border-sky-400/60 bg-sky-500/20 text-sky-100" : "border-slate-600 bg-slate-800/70 text-slate-300 hover:border-slate-500"}`}
                        >
                          {emoji} {count}
                        </button>
                      );
                    })}
                    {/* + picker */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setPickerOpenFor((cur) => cur === message.id ? null : message.id)}
                        className="rounded-md border border-slate-700 bg-slate-800/60 px-1.5 py-0.5 text-xs text-slate-400 hover:text-slate-200"
                      >
                        +
                      </button>
                      {pickerOpenFor === message.id ? (
                        <EmojiPopover
                          onPick={(emoji) => void toggleReaction(message.id, emoji)}
                          onClose={() => setPickerOpenFor(null)}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        {!messages.length ? <p className="p-4 text-sm text-slate-400">{emptyMessage}</p> : null}
      </div>

      <div className="relative mt-3 flex gap-2 rounded-lg bg-[#383a40] p-2">
        {mentionSuggestions.length > 0 && (
          <ul className="absolute bottom-full left-0 z-20 mb-1 w-60 rounded-lg border border-slate-700 bg-[#1e1f22] py-1 shadow-xl">
            {mentionSuggestions.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); insertMention(member.starCitizenHandle || member.name || member.id); }}
                  className="w-full px-3 py-1.5 text-left text-sm text-slate-100 hover:bg-slate-700"
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
          className="w-full rounded-md border border-slate-600 bg-[#1f2127] px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400"
          placeholder={placeholder}
          maxLength={2000}
        />
        <button
          type="button"
          onClick={() => void submitMessage()}
          disabled={sending}
          className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Sending" : "Send"}
        </button>
      </div>
    </section>
  );
}
