import Link from "next/link";
import { AppShell } from "@/components/app-shell";

const sections = [
  {
    title: "Dashboard",
    href: "/dashboard",
    overview: "Your command center for upcoming operations, alerts, approvals, and quick actions.",
    howItWorks: [
      "Shows your assigned operations and key readiness signals.",
      "Surfaces recent alerts, calendar events, and social updates.",
      "Gives direct shortcuts to create operations and open planning tools.",
    ],
  },
  {
    title: "Operations",
    href: "/operations",
    overview: "Where missions become executable operation plans.",
    howItWorks: [
      "Create operations with objective, schedule, threat level, and logistics.",
      "Track participants and status as planning moves to execution.",
      "Use operation detail pages for updates, edits, and coordination.",
    ],
  },
  {
    title: "My Org and Organizations",
    href: "/organizations/my",
    overview: "Manage your own org membership and discover or create organizations.",
    howItWorks: [
      "My Org shows your current organization details and member workflow.",
      "Find Org helps you browse organizations and submit join applications.",
      "Leaders can review applicants and manage org setup and privileges.",
    ],
  },
  {
    title: "Fleet",
    href: "/fleet",
    overview: "Track ships and assets that support operations.",
    howItWorks: [
      "Add and edit assets in your roster.",
      "Mark availability and readiness for planning.",
      "Use fleet data to align operations with actual resources.",
    ],
  },
  {
    title: "Missions",
    href: "/missions",
    overview: "Mission library for templates and planning references.",
    howItWorks: [
      "Browse mission categories and mission records.",
      "Use mission context when creating operation plans.",
      "Keep planning consistent by reusing known mission structures.",
    ],
  },
  {
    title: "Social",
    href: "/social",
    overview: "Team communication hub with channels, messages, and forum discussions.",
    howItWorks: [
      "Conversation channels support ongoing team coordination.",
      "Forum posts capture broader discussions and shared updates.",
      "Online member status is based on active, non-expired sessions.",
    ],
  },
  {
    title: "AI Planner",
    href: "/ai-planner",
    overview: "Generates operation drafts to speed up planning.",
    howItWorks: [
      "Create structured plan options from mission inputs.",
      "Review generated options and pick the best fit.",
      "Send selected output into operation creation with less manual writing.",
    ],
  },
  {
    title: "Coalitions",
    href: "/coalitions",
    overview: "Coordinate cross-organization planning and collaboration.",
    howItWorks: [
      "Create and review coalition entries.",
      "Track shared participation between groups.",
      "Use coalition context when planning multi-org operations.",
    ],
  },
  {
    title: "Notifications",
    href: "/notifications",
    overview: "Central inbox for updates that need attention.",
    howItWorks: [
      "Collects operation and org-related alerts.",
      "Lets you review unread activity quickly.",
      "Helps prevent missed updates during active planning cycles.",
    ],
  },
  {
    title: "Profile and Account",
    href: "/profile",
    overview: "Manage personal identity, account settings, and credentials.",
    howItWorks: [
      "Profile stores your display and Star Citizen identity details.",
      "Account handles password updates and account-level controls.",
      "Accurate profile data improves org onboarding and coordination.",
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    overview: "Configure platform behavior, timezone, and security preferences.",
    howItWorks: [
      "Set timezone so operation times appear correctly.",
      "Manage security options, including 2FA flows.",
      "Configure integrations such as Discord when available.",
    ],
  },
  {
    title: "Tools: Item Finder",
    href: "/tools/item-finder",
    overview: "Fast lookup utility for in-app data exploration.",
    howItWorks: [
      "Search and filter item data quickly.",
      "Use categorized views to narrow results.",
      "Apply tool output while planning loadouts and mission prep.",
    ],
  },
];

const quickStart = [
  "Create an account and sign in.",
  "Set timezone and profile basics.",
  "Join or create an organization.",
  "Review mission templates and available fleet assets.",
  "Build an operation manually or with AI Planner.",
  "Use Social and Notifications to coordinate execution.",
];

export default function UserGuidePage() {
  return (
    <AppShell title="User Guide" subtitle="Simple overview of each app section">
      <section className="rounded-2xl border border-orange-300/25 bg-slate-900/60 p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/85">Overview</p>
        <h3 className="mt-2 text-2xl font-semibold text-orange-50">How StarCitizenOps works</h3>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">
          StarCitizenOps helps teams move from planning to execution: set up your profile, organize people and assets,
          build operations, and keep communication in one place.
        </p>
      </section>

      <section className="rounded-2xl border border-cyan-300/20 bg-slate-900/60 p-5">
        <h4 className="text-lg font-semibold text-cyan-100">Quick start path</h4>
        <ol className="mt-3 ml-5 list-decimal space-y-1.5 text-sm text-slate-300">
          {quickStart.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4">
        {sections.map((section) => (
          <article key={section.title} className="rounded-2xl border border-slate-300/20 bg-slate-900/55 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-lg font-semibold text-slate-100">{section.title}</h4>
              <Link
                href={section.href}
                className="inline-flex w-fit rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/20"
              >
                Open section
              </Link>
            </div>
            <p className="mt-2 text-sm text-slate-300">{section.overview}</p>
            <ul className="mt-3 ml-5 list-disc space-y-1.5 text-sm text-slate-300">
              {section.howItWorks.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
