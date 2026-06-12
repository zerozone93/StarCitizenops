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

type ConversationItem = {
  id: string;
  title: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  isChannel: boolean;
  organization: { id: string; name: string; tag: string } | null;
  messages: Array<{ id: string; body: string; createdAt: string }>;
};

type ConversationsPayload = {
  userId: string;
  conversations: ConversationItem[];
};

type OpenWindow = {
  conversationId: string;
  minimized: boolean;
  x: number;
  y: number;
};

type ToastNotice = {
  id: string;
  conversationId: string;
  title: string;
};

const REACTIONS = ["FIRE", "YES", "EYES", "CHAT"];
const MAX_WINDOWS = 3;
const WINDOW_WIDTH = 320;
const SIDEBAR_OFFSET = 320;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function getDefaultWindowPosition(index: number) {
  if (typeof window === "undefined") {
    return { x: 340, y: 120 };
  }

  const x = SIDEBAR_OFFSET + 16 + index * 24;
  const y = 110 + index * 24;

  return {
    x: clamp(x, 8, window.innerWidth - WINDOW_WIDTH - 8),
    y: clamp(y, 8, window.innerHeight - 56),
  };
}

type OnlineMember = {
  id: string;
  name: string | null;
  email: string | null;
  starCitizenHandle: string | null;
};

function playNotificationTone() {
  if (typeof window === "undefined") return;

  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;

  const ctx = new AudioContextCtor();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 880;
  gain.gain.value = 0.0001;
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  osc.start(now);
  osc.stop(now + 0.24);
  osc.onended = () => {
    void ctx.close();
  };
}

function ConversationWindow({
  conversation,
  currentUserId,
  onClose,
  onMinimize,
  onMove,
  unreadCount,
  minimized,
}: {
  conversation: ConversationItem;
  currentUserId: string;
  onClose: () => void;
  onMinimize: () => void;
  onMove: (x: number, y: number) => void;
  unreadCount: number;
  minimized: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const dragRef = useRef<{ pointerOffsetX: number; pointerOffsetY: number; active: boolean }>({
    pointerOffsetX: 0,
    pointerOffsetY: 0,
    active: false,
  });

  const refreshMessages = useCallback(async () => {
    const response = await fetch(`/api/social/conversations/${conversation.id}/messages`, {
      cache: "no-store",
    });

    if (!response.ok) return;
    const payload = (await response.json()) as { messages: ChatMessage[] };
    setMessages(payload.messages);
  }, [conversation.id]);

  useEffect(() => {
    const initial = setTimeout(() => {
      void refreshMessages();
    }, 0);

    const timer = setInterval(() => {
      if (!minimized) {
        void refreshMessages();
      }
    }, 2000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [refreshMessages, minimized]);

  const submitMessage = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/social/conversations/${conversation.id}/messages`, {
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
  }, [conversation.id, draft, sending]);

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

  const displayTitle = useMemo(() => {
    if (conversation.organization) {
      return `${conversation.title} (${conversation.organization.tag})`;
    }
    return conversation.title;
  }, [conversation]);

  return (
    <div className="w-[320px] rounded-t-xl border border-cyan-400/35 bg-slate-950/95 shadow-2xl shadow-black/60 backdrop-blur-md">
      <div
        className="flex cursor-move items-center justify-between border-b border-cyan-500/20 px-3 py-2"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          const target = event.currentTarget.parentElement;
          if (!target) return;

          const rect = target.getBoundingClientRect();
          dragRef.current = {
            active: true,
            pointerOffsetX: event.clientX - rect.left,
            pointerOffsetY: event.clientY - rect.top,
          };

          const move = (moveEvent: PointerEvent) => {
            if (!dragRef.current.active) return;
            const nextX = clamp(moveEvent.clientX - dragRef.current.pointerOffsetX, 8, window.innerWidth - WINDOW_WIDTH - 8);
            const nextY = clamp(moveEvent.clientY - dragRef.current.pointerOffsetY, 8, window.innerHeight - 56);
            onMove(nextX, nextY);
          };

          const end = () => {
            dragRef.current.active = false;
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", end);
          };

          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", end, { once: true });
        }}
      >
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-cyan-200">{displayTitle}</p>
          <p className="truncate text-[11px] text-slate-400">
            {conversation.visibility} channel {unreadCount > 0 ? `• ${unreadCount} unread` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMinimize}
            className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            {minimized ? "Open" : "Min"}
          </button>
          {unreadCount > 0 ? (
            <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-bold text-slate-950">
              {unreadCount}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/20"
          >
            Close
          </button>
        </div>
      </div>

      {!minimized ? (
        <>
          <div className="max-h-[300px] min-h-[220px] space-y-2 overflow-auto p-3">
            {messages.map((message) => {
              const mine = message.sender.id === currentUserId;
              const senderName =
                message.sender.starCitizenHandle ||
                message.sender.name ||
                message.sender.email ||
                "Operator";

              return (
                <article
                  key={message.id}
                  className={`rounded-lg border p-2 ${mine ? "border-cyan-500/40 bg-cyan-500/10" : "border-slate-700 bg-slate-900/70"}`}
                >
                  <p className="text-[11px] text-slate-400">
                    {senderName} · {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                  <p className="mt-1 text-sm text-slate-200">{message.body}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {REACTIONS.map((emoji) => {
                      const count = message.reactionSummary[emoji] || 0;
                      const active = message.myReactions.includes(emoji);
                      return (
                        <button
                          key={`${message.id}-${emoji}`}
                          type="button"
                          onClick={() => void toggleReaction(message.id, emoji)}
                          className={`rounded border px-2 py-0.5 text-[10px] ${active ? "border-cyan-300 bg-cyan-400/20 text-cyan-100" : "border-slate-600 bg-slate-800/80 text-slate-200"}`}
                        >
                          {emoji} {count ? count : ""}
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}
            {!messages.length ? <p className="text-xs text-slate-500">No messages yet.</p> : null}
          </div>

          <div className="border-t border-cyan-500/20 p-2">
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submitMessage();
                  }
                }}
                className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                placeholder="Type a message"
                maxLength={2000}
              />
              <button
                type="button"
                onClick={() => void submitMessage()}
                disabled={sending}
                className="rounded-md bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60"
              >
                Send
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function ChatDock() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<ConversationsPayload | null>(null);
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
  const [latestMessageByConversation, setLatestMessageByConversation] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);

  const pushToast = useCallback((conversationId: string, title: string) => {
    const id = `${conversationId}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, conversationId, title }].slice(-4));
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const markConversationRead = useCallback((conversationId: string) => {
    setUnreadByConversation((prev) => {
      if (!prev[conversationId]) return prev;
      return { ...prev, [conversationId]: 0 };
    });
  }, []);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/social/conversations", { cache: "no-store" });
      if (!response.ok) {
        setPayload(null);
        return;
      }
      const data = (await response.json()) as ConversationsPayload;

      const seenWindows = new Map(windows.map((window) => [window.conversationId, window]));
      const newMessageConversations: Array<{ id: string; title: string }> = [];

      for (const conversation of data.conversations) {
        const latestMessageId = conversation.messages[0]?.id;
        if (!latestMessageId) continue;

        const previousMessageId = latestMessageByConversation[conversation.id];
        if (!previousMessageId) continue;
        if (previousMessageId === latestMessageId) continue;

        const openWindow = seenWindows.get(conversation.id);
        const activeAndVisible = Boolean(openWindow && !openWindow.minimized);

        if (!activeAndVisible) {
          newMessageConversations.push({ id: conversation.id, title: conversation.title });
        }
      }

      if (newMessageConversations.length) {
        playNotificationTone();
        setUnreadByConversation((prev) => {
          const next = { ...prev };
          for (const item of newMessageConversations) {
            next[item.id] = (next[item.id] || 0) + 1;
          }
          return next;
        });
        for (const item of newMessageConversations) {
          pushToast(item.id, item.title);
        }
      }

      const latestMap: Record<string, string> = {};
      for (const conversation of data.conversations) {
        if (conversation.messages[0]?.id) {
          latestMap[conversation.id] = conversation.messages[0].id;
        }
      }

      setPayload(data);
      setLatestMessageByConversation((prev) => ({ ...prev, ...latestMap }));
    } finally {
      setLoading(false);
    }
  }, [latestMessageByConversation, pushToast, windows]);

  const loadOnlineMembers = useCallback(async () => {
    const response = await fetch("/api/social/online-members", { cache: "no-store" });
    if (!response.ok) {
      setOnlineMembers([]);
      return;
    }

    const payload = (await response.json()) as { members: OnlineMember[] };
    setOnlineMembers(payload.members);
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => {
      void loadConversations();
      void loadOnlineMembers();
    }, 0);

    const timer = setInterval(() => {
      void loadConversations();
      void loadOnlineMembers();
    }, 8000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [loadConversations, loadOnlineMembers]);

  const openConversation = useCallback((conversationId: string) => {
    setWindows((prev) => {
      const existing = prev.find((item) => item.conversationId === conversationId);
      if (existing) {
        markConversationRead(conversationId);
        return prev.map((item) =>
          item.conversationId === conversationId ? { ...item, minimized: false } : item
        );
      }

      const base = getDefaultWindowPosition(prev.length);
      markConversationRead(conversationId);
      const next = [{ conversationId, minimized: false, x: base.x, y: base.y }, ...prev].slice(0, MAX_WINDOWS);
      return next;
    });
  }, [markConversationRead]);

  const startDirectMessage = useCallback(async (targetUserId: string) => {
    const response = await fetch("/api/social/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { conversation: { id: string } };
    await loadConversations();
    openConversation(payload.conversation.id);
    setOpen(false);
  }, [loadConversations, openConversation]);

  const closeConversation = useCallback((conversationId: string) => {
    setWindows((prev) => prev.filter((item) => item.conversationId !== conversationId));
  }, []);

  const toggleMinimize = useCallback((conversationId: string) => {
    setWindows((prev) =>
      prev.map((item) =>
        item.conversationId === conversationId
          ? { ...item, minimized: !item.minimized }
          : item
      )
    );
    const target = windows.find((item) => item.conversationId === conversationId);
    if (target?.minimized) {
      markConversationRead(conversationId);
    }
  }, [markConversationRead, windows]);

  const moveWindow = useCallback((conversationId: string, x: number, y: number) => {
    setWindows((prev) =>
      prev.map((item) =>
        item.conversationId === conversationId
          ? { ...item, x, y }
          : item
      )
    );
  }, []);

  const conversations = payload?.conversations || [];
  const totalUnread = Object.values(unreadByConversation).reduce((sum, value) => sum + value, 0);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[9998]">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-full border border-cyan-300/40 bg-slate-900/95 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-xl shadow-black/50 backdrop-blur-md hover:bg-slate-800"
          >
            Chat {totalUnread > 0 ? `(${totalUnread})` : ""}
          </button>

          {open ? (
            <div className="absolute bottom-12 right-0 w-80 rounded-xl border border-cyan-400/30 bg-slate-950/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-cyan-200">Channels</p>
                <button
                  type="button"
                  onClick={() => {
                    void loadConversations();
                    void loadOnlineMembers();
                  }}
                  className="rounded px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
                >
                  Refresh
                </button>
              </div>

              {loading ? <p className="text-xs text-slate-400">Loading channels...</p> : null}

              <div className="max-h-80 space-y-2 overflow-auto">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => openConversation(conversation.id)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/70 p-2 text-left hover:border-cyan-400/50 hover:bg-slate-800"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-cyan-100">{conversation.title}</p>
                      {unreadByConversation[conversation.id] ? (
                        <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                          {unreadByConversation[conversation.id]}
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-[11px] text-slate-400">
                      {conversation.organization
                        ? `${conversation.organization.name} (${conversation.organization.tag})`
                        : "Direct conversation"}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-slate-500">
                      {conversation.messages[0]?.body || "No messages yet"}
                    </p>
                  </button>
                ))}
                {!loading && !conversations.length ? (
                  <p className="text-xs text-slate-500">No channels available.</p>
                ) : null}
              </div>

              <div className="mt-3 border-t border-cyan-500/20 pt-3">
                <p className="text-xs uppercase tracking-wide text-cyan-200">Online members</p>
                <div className="mt-2 max-h-44 space-y-1.5 overflow-auto">
                  {onlineMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => void startDirectMessage(member.id)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1.5 text-left hover:border-cyan-400/50 hover:bg-slate-800"
                    >
                      <p className="truncate text-xs font-semibold text-cyan-100">
                        {member.starCitizenHandle ? `@${member.starCitizenHandle}` : member.name || member.email || "Operator"}
                      </p>
                      <p className="text-[11px] text-slate-500">Click to DM</p>
                    </button>
                  ))}
                  {!onlineMembers.length ? <p className="text-xs text-slate-500">No online members detected.</p> : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-0 z-[9997] pointer-events-none">
        {windows
          .map((window) => {
            const conversation = conversations.find((item) => item.id === window.conversationId);
            if (!conversation || !payload?.userId) return null;

            return (
              <div
                key={window.conversationId}
                className="pointer-events-auto fixed"
                style={{ left: window.x, top: window.y }}
              >
                <ConversationWindow
                  conversation={conversation}
                  currentUserId={payload.userId}
                  minimized={window.minimized}
                  unreadCount={unreadByConversation[window.conversationId] || 0}
                  onClose={() => closeConversation(window.conversationId)}
                  onMinimize={() => toggleMinimize(window.conversationId)}
                  onMove={(x, y) => moveWindow(window.conversationId, x, y)}
                />
              </div>
            );
          })
          .filter(Boolean)}
      </div>

      <div className="fixed bottom-20 right-4 z-[9999] space-y-2">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => openConversation(toast.conversationId)}
            className="block w-72 rounded-lg border border-cyan-400/30 bg-slate-950/95 p-3 text-left shadow-xl shadow-black/50 backdrop-blur-md hover:bg-slate-900"
          >
            <p className="text-xs uppercase tracking-wide text-cyan-200">New message</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-100">{toast.title}</p>
            <p className="mt-1 text-xs text-slate-400">Click to open chat window</p>
          </button>
        ))}
      </div>
    </>
  );
}
