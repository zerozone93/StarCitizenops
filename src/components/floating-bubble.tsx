"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function FloatingBubble() {
  const [counts, setCounts] = useState({ notifications: 0, messages: 0 });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"notifications" | "messages">("notifications");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch("/api/notifications/counts");
        if (res.ok) setCounts(await res.json());
      } catch {}
    }
    fetchCounts();
    const id = setInterval(fetchCounts, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    async function loadNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) setNotifications(await res.json());
      } catch {}
    }
    loadNotifications();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setCounts((c) => ({ ...c, notifications: 0 }));
  }

  const total = counts.notifications + counts.messages;

  return (
    <div ref={ref} className="fixed right-5 top-4 z-[9999]">
      {/* Bubble button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-orange-300/40 bg-slate-900/90 shadow-lg shadow-black/40 backdrop-blur-md transition hover:border-orange-300/60 hover:bg-slate-800/90"
        aria-label="Notifications and messages"
      >
        {/* Bell icon */}
        <svg className="h-5 w-5 text-orange-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {total > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-sm">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-13 mt-2 w-80 rounded-2xl border border-orange-300/25 bg-slate-950/95 shadow-2xl shadow-black/60 backdrop-blur-md">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-slate-700/60 px-4 pt-3 pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => setTab("notifications")}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition ${tab === "notifications" ? "bg-orange-500/20 text-orange-200" : "text-slate-400 hover:text-slate-200"}`}
              >
                Alerts
                {counts.notifications > 0 && (
                  <span className="ml-1.5 rounded-full bg-orange-500 px-1.5 py-px text-[10px] text-white">{counts.notifications}</span>
                )}
              </button>
              <button
                onClick={() => setTab("messages")}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition ${tab === "messages" ? "bg-cyan-500/20 text-cyan-200" : "text-slate-400 hover:text-slate-200"}`}
              >
                Messages
                {counts.messages > 0 && (
                  <span className="ml-1.5 rounded-full bg-cyan-500 px-1.5 py-px text-[10px] text-white">{counts.messages}</span>
                )}
              </button>
            </div>
            {tab === "notifications" && counts.notifications > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-slate-400 hover:text-slate-200">
                Mark all read
              </button>
            )}
          </div>

          {tab === "notifications" && (
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-slate-500">No notifications</p>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <div key={n.id} className={`flex gap-3 border-b border-slate-800/60 px-4 py-3 transition hover:bg-slate-800/40 ${n.read ? "opacity-60" : ""}`}>
                    <div className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-orange-400"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-100">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{n.body}</p>}
                      {n.link && (
                        <Link href={n.link} onClick={() => setOpen(false)} className="mt-1 text-[10px] text-cyan-400 hover:text-cyan-300">
                          View →
                        </Link>
                      )}
                    </div>
                    <time className="flex-shrink-0 text-[10px] text-slate-500">
                      {new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </time>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "messages" && (
            <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
              <svg className="h-8 w-8 text-cyan-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {counts.messages > 0 ? (
                <>
                  <p className="text-sm text-slate-300">{counts.messages} new message{counts.messages > 1 ? "s" : ""}</p>
                  <Link href="/social" onClick={() => setOpen(false)} className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/30">
                    Open Sosial Forum →
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-500">No new messages in the last hour</p>
                  <Link href="/social" onClick={() => setOpen(false)} className="mt-1 text-xs text-cyan-400 hover:text-cyan-300">
                    Go to Sosial Forum →
                  </Link>
                </>
              )}
            </div>
          )}

          <div className="border-t border-slate-700/60 px-4 py-2.5 text-right">
            <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-slate-200">
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
