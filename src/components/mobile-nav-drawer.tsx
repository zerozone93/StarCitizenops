"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/sign-out-button";

const primaryNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/operations", label: "Operations" },
  { href: "/organizations/my", label: "My Org" },
  { href: "/fleet", label: "Fleet" },
  { href: "/chat", label: "Chat" },
];

const secondaryNavItems = [
  { href: "/operations/new", label: "New Operation" },
  { href: "/ai-planner", label: "AI Planner" },
  { href: "/organizations", label: "Find Org" },
  { href: "/organizations/new", label: "New Org" },
  { href: "/social", label: "Forum" },
  { href: "/profile", label: "Profile" },
  { href: "/notifications", label: "Notifications" },
  { href: "/account", label: "Account" },
  { href: "/settings", label: "Settings" },
];

export function MobileNavDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-sm text-cyan-100 hover:bg-cyan-300/20 lg:hidden"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
      >
        Menu
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside
            id="mobile-nav-drawer"
            className="absolute right-0 top-0 h-full w-[88vw] max-w-sm overflow-y-auto border-l border-orange-300/20 bg-slate-950 p-4 shadow-[0_25px_80px_-35px_rgba(0,0,0,0.85)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-orange-300/20 pb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-orange-100/90">StarCitizenOps</p>
                <h2 className="mt-1 text-xl font-semibold text-orange-50">Navigation</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">Primary</p>
                <nav className="grid gap-2">
                  {primaryNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">Quick access</p>
                <nav className="grid gap-2">
                  {secondaryNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 transition hover:border-orange-300/30 hover:bg-orange-300/10"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="border-t border-slate-700/70 pt-4">
                <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">Account</p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100"
                  >
                    Dashboard
                  </Link>
                  <SignOutButton className="rounded-lg border border-orange-300/35 bg-orange-400/10 px-3 py-2 text-sm text-orange-100" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
