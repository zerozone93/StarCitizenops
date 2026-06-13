"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primaryNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/operations", label: "Operations" },
  { href: "/organizations/my", label: "My Org" },
  { href: "/fleet", label: "Fleet" },
  { href: "/chat", label: "Chat" },
];

const secondaryNavItems = [
  { href: "/organizations", label: "Find Org" },
  { href: "/organizations/new", label: "New Org" },
  { href: "/social", label: "Forum" },
  { href: "/profile", label: "Profile" },
  { href: "/missions", label: "Mission Library" },
  { href: "/coalitions", label: "Coalitions" },
  { href: "/ai-planner", label: "AI Planner" },
  { href: "/tools/item-finder", label: "Item Finder" },
  { href: "/notifications", label: "Notifications" },
  { href: "/account", label: "Account" },
  { href: "/settings", label: "Settings" },
];

const helpItems = [
  { href: "/user-guide", label: "📖 User Guide" },
];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/organizations/my") {
      return pathname === "/organizations" || pathname.startsWith("/organizations/");
    }

    return pathname.startsWith(href);
  };

  return (
    <aside className="flex w-full shrink-0 flex-col rounded-3xl border border-orange-300/20 bg-slate-950/75 p-4 sm:p-5 lg:fixed lg:bottom-5 lg:left-6 lg:top-5 lg:w-72 lg:overflow-y-auto">
      <Link href="/dashboard" className="mb-5 block rounded-2xl border border-orange-300/25 bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-cyan-400/10 p-4">
        <p className="text-[11px] uppercase tracking-[0.3em] text-orange-100/90">StarCitizenOps</p>
        <h1 className="mt-2 text-xl font-semibold text-orange-50 sm:text-2xl">Command Deck</h1>
        <p className="mt-1 text-xs text-orange-100/75">Quick access to your core mission tools</p>
      </Link>
      <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">Main navigation</p>
      <nav className="grid gap-1.5">
        {primaryNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-xl border px-3 py-2.5 text-sm transition ${
              isActive(item.href)
                ? "border-orange-300/45 bg-orange-400/15 font-semibold text-orange-50"
                : "border-transparent text-slate-200 hover:border-cyan-300/30 hover:bg-cyan-300/10"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <details className="mt-4 rounded-xl border border-slate-700/60 bg-slate-900/40 p-2" open>
        <summary className="cursor-pointer list-none rounded-lg px-2 py-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
          More tools
        </summary>
        <nav className="mt-2 grid gap-1.5">
          {secondaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl border px-3 py-2.5 text-sm transition ${
                isActive(item.href)
                  ? "border-orange-300/45 bg-orange-400/15 font-semibold text-orange-50"
                  : "border-transparent text-slate-200 hover:border-cyan-300/30 hover:bg-cyan-300/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </details>

      <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-900/40 p-2">
        <p className="px-2 py-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">Help</p>
        <nav className="mt-2 grid gap-1.5">
          {helpItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl border border-transparent px-3 py-2.5 text-sm text-slate-200 hover:border-cyan-300/30 hover:bg-cyan-300/10 transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
