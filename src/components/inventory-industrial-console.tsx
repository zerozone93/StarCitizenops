"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type InventoryOrganizationScope = {
  organizationId: string;
  name: string;
  tag: string;
  role: string;
};

type DashboardPayload = {
  organizationId: string;
  organization: InventoryOrganizationScope;
  totals: {
    locations: number;
    items: number;
    quantityOnHand: number;
    jobsOpen: number;
    refineryActive: number;
    ticketsOpen: number;
  };
  locations: Array<{
    id: string;
    name: string;
  }>;
  items: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    location: { id: string; name: string } | null;
  }>;
  jobs: Array<{
    id: string;
    title: string;
    jobType: string;
    status: "PLANNED" | "ACTIVE" | "BLOCKED" | "COMPLETED" | "CANCELLED";
    priority: number;
    targetItem: { id: string; name: string; unit: string } | null;
  }>;
  refineryRuns: Array<{
    id: string;
    intakeQuantity: number;
    outputQuantity: number | null;
    status: "INTAKE" | "PROCESSING" | "READY_FOR_OUTPUT" | "COMPLETED" | "CANCELLED";
    startedAt: string;
    inputItem: { id: string; name: string; unit: string };
    outputItem: { id: string; name: string; unit: string } | null;
  }>;
  tickets: Array<{
    id: string;
    ticketNumber: string;
    quantity: number;
    unit: string;
    type: "ISSUE" | "RETURN" | "ADJUSTMENT";
    status: "OPEN" | "APPROVED" | "FULFILLED" | "CANCELLED";
    reason: string;
    createdAt: string;
    item: { id: string; name: string; unit: string };
  }>;
};

type ApiErrorShape = {
  error?: string | { message?: string };
};

const itemCategories = [
  "RAW_ORE",
  "REFINED_MATERIAL",
  "COMPONENT",
  "CONSUMABLE",
  "AMMUNITION",
  "FUEL",
  "SALVAGE",
  "CARGO",
  "OTHER",
] as const;

const jobTypes = ["MINING", "REFINING", "SALVAGE", "MANUFACTURING", "HAULING", "TRADE", "OTHER"] as const;
const jobStatuses = ["PLANNED", "ACTIVE", "BLOCKED", "COMPLETED", "CANCELLED"] as const;
const refineryStatuses = ["INTAKE", "PROCESSING", "READY_FOR_OUTPUT", "COMPLETED", "CANCELLED"] as const;
const ticketTypes = ["ISSUE", "RETURN", "ADJUSTMENT"] as const;
const ticketStatuses = ["OPEN", "APPROVED", "FULFILLED", "CANCELLED"] as const;

function parseApiError(payload: ApiErrorShape | null, fallback: string) {
  if (!payload?.error) return fallback;
  if (typeof payload.error === "string") return payload.error;
  return payload.error.message || fallback;
}

export function InventoryIndustrialConsole() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationDescription, setNewLocationDescription] = useState("");

  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<(typeof itemCategories)[number]>("OTHER");
  const [newItemQuantity, setNewItemQuantity] = useState(0);
  const [newItemUnit, setNewItemUnit] = useState("units");
  const [newItemSku, setNewItemSku] = useState("");
  const [newItemLocationId, setNewItemLocationId] = useState("");

  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobType, setNewJobType] = useState<(typeof jobTypes)[number]>("MINING");
  const [newJobPriority, setNewJobPriority] = useState(3);
  const [newJobTargetItemId, setNewJobTargetItemId] = useState("");

  const [newRefineryInputItemId, setNewRefineryInputItemId] = useState("");
  const [newRefineryOutputItemId, setNewRefineryOutputItemId] = useState("");
  const [newRefineryIntakeQty, setNewRefineryIntakeQty] = useState(0);
  const [newRefineryNotes, setNewRefineryNotes] = useState("");

  const [newTicketItemId, setNewTicketItemId] = useState("");
  const [newTicketQuantity, setNewTicketQuantity] = useState(0);
  const [newTicketType, setNewTicketType] = useState<(typeof ticketTypes)[number]>("ISSUE");
  const [newTicketReason, setNewTicketReason] = useState("");
  const [newTicketNotes, setNewTicketNotes] = useState("");

  const selectedOrganization = useMemo(() => dashboard?.organization ?? null, [dashboard]);

  const refreshDashboard = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/tools/inventory-industrial/dashboard", { method: "GET" });
      const payload = (await response.json()) as DashboardPayload | ApiErrorShape;
      if (!response.ok) throw new Error(parseApiError(payload as ApiErrorShape, "Failed to load dashboard"));
      setDashboard(payload as DashboardPayload);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load dashboard");
      setDashboard(null);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  async function postJson(url: string, payload: Record<string, unknown>) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as ApiErrorShape;
    if (!response.ok) throw new Error(parseApiError(data, "Request failed"));
  }

  async function patchJson(url: string, payload: Record<string, unknown>) {
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as ApiErrorShape;
    if (!response.ok) throw new Error(parseApiError(data, "Request failed"));
  }

  async function runAndRefresh(action: () => Promise<void>, fallback: string) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refreshDashboard();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : fallback);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-orange-300/20 bg-[linear-gradient(145deg,rgba(249,115,22,0.12),rgba(8,15,23,0.92)_38%,rgba(6,182,212,0.08))] p-5 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-orange-100/80">Integrated Module</p>
            <h3 className="text-3xl font-semibold text-orange-50">Inventory & Industrial Ops Console</h3>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">
              Restored refinery intake/output workflows and resource take-out ticket tracking for your organization.
            </p>
          </div>
          {selectedOrganization ? (
            <div className="rounded-xl border border-cyan-300/20 bg-slate-950/80 px-3 py-2 text-sm text-cyan-100">
              {selectedOrganization.name} [{selectedOrganization.tag}] ({selectedOrganization.role})
            </div>
          ) : null}
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

      {dashboard ? (
        <>
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <article className="rounded-2xl border border-cyan-300/20 bg-slate-950/55 p-4"><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Locations</p><p className="mt-2 text-2xl font-semibold text-cyan-100">{dashboard.totals.locations}</p></article>
            <article className="rounded-2xl border border-cyan-300/20 bg-slate-950/55 p-4"><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Items</p><p className="mt-2 text-2xl font-semibold text-cyan-100">{dashboard.totals.items}</p></article>
            <article className="rounded-2xl border border-cyan-300/20 bg-slate-950/55 p-4"><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">On Hand</p><p className="mt-2 text-2xl font-semibold text-cyan-100">{dashboard.totals.quantityOnHand}</p></article>
            <article className="rounded-2xl border border-cyan-300/20 bg-slate-950/55 p-4"><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Jobs Open</p><p className="mt-2 text-2xl font-semibold text-cyan-100">{dashboard.totals.jobsOpen}</p></article>
            <article className="rounded-2xl border border-cyan-300/20 bg-slate-950/55 p-4"><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Refinery Active</p><p className="mt-2 text-2xl font-semibold text-cyan-100">{dashboard.totals.refineryActive}</p></article>
            <article className="rounded-2xl border border-cyan-300/20 bg-slate-950/55 p-4"><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Tickets Open</p><p className="mt-2 text-2xl font-semibold text-cyan-100">{dashboard.totals.ticketsOpen}</p></article>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <article className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Create Location</p>
              <div className="mt-3 space-y-2">
                <input value={newLocationName} onChange={(event) => setNewLocationName(event.target.value)} placeholder="Location name" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
                <input value={newLocationDescription} onChange={(event) => setNewLocationDescription(event.target.value)} placeholder="Description (optional)" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
                <button type="button" disabled={busy} onClick={() => void runAndRefresh(async () => {
                  await postJson("/api/tools/inventory-industrial/locations", { name: newLocationName, description: newLocationDescription || undefined });
                  setNewLocationName("");
                  setNewLocationDescription("");
                }, "Failed to create location")} className="w-full rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-3 py-2 text-sm font-medium text-cyan-100 disabled:opacity-60">Add Location</button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 xl:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Create Inventory Item</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                <input value={newItemName} onChange={(event) => setNewItemName(event.target.value)} placeholder="Item name" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
                <select value={newItemCategory} onChange={(event) => setNewItemCategory(event.target.value as (typeof itemCategories)[number])} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">{itemCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
                <input type="number" min={0} value={newItemQuantity} onChange={(event) => setNewItemQuantity(Number(event.target.value || 0))} placeholder="Quantity" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
                <input value={newItemUnit} onChange={(event) => setNewItemUnit(event.target.value)} placeholder="Unit" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
                <input value={newItemSku} onChange={(event) => setNewItemSku(event.target.value)} placeholder="SKU (optional)" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
                <select value={newItemLocationId} onChange={(event) => setNewItemLocationId(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"><option value="">No location</option>{dashboard.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select>
                <button type="button" disabled={busy} onClick={() => void runAndRefresh(async () => {
                  await postJson("/api/tools/inventory-industrial/items", { name: newItemName, category: newItemCategory, quantity: newItemQuantity, unit: newItemUnit, sku: newItemSku || undefined, locationId: newItemLocationId || undefined });
                  setNewItemName("");
                  setNewItemQuantity(0);
                  setNewItemSku("");
                }, "Failed to create item")} className="rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-3 py-2 text-sm font-medium text-cyan-100 disabled:opacity-60 md:col-span-2 xl:col-span-3">Add Inventory Item</button>
              </div>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Refinery Intake / Output</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <select value={newRefineryInputItemId} onChange={(event) => setNewRefineryInputItemId(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"><option value="">Input resource</option>{dashboard.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <select value={newRefineryOutputItemId} onChange={(event) => setNewRefineryOutputItemId(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"><option value="">Output resource (optional)</option>{dashboard.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <input type="number" min={1} value={newRefineryIntakeQty} onChange={(event) => setNewRefineryIntakeQty(Number(event.target.value || 0))} placeholder="Intake quantity" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
                <input value={newRefineryNotes} onChange={(event) => setNewRefineryNotes(event.target.value)} placeholder="Refinery notes" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
                <button type="button" disabled={busy} onClick={() => void runAndRefresh(async () => {
                  await postJson("/api/tools/inventory-industrial/refinery", { inputItemId: newRefineryInputItemId, outputItemId: newRefineryOutputItemId || undefined, intakeQuantity: newRefineryIntakeQty, notes: newRefineryNotes || undefined });
                  setNewRefineryInputItemId("");
                  setNewRefineryOutputItemId("");
                  setNewRefineryIntakeQty(0);
                  setNewRefineryNotes("");
                }, "Failed to create refinery run")} className="rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-3 py-2 text-sm font-medium text-cyan-100 disabled:opacity-60 md:col-span-2">Create Refinery Intake</button>
              </div>
              <div className="mt-4 space-y-2">
                {dashboard.refineryRuns.length === 0 ? <p className="text-sm text-slate-400">No refinery runs yet.</p> : dashboard.refineryRuns.map((run) => (
                  <div key={run.id} className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-3">
                    <p className="font-medium text-slate-100">{run.inputItem.name} intake {run.intakeQuantity} {run.inputItem.unit}</p>
                    <p className="text-xs text-slate-400">Output: {run.outputItem?.name || "Not set"} · Produced: {run.outputQuantity ?? 0}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {refineryStatuses.map((status) => (
                        <button key={status} type="button" disabled={busy || run.status === status} onClick={() => void runAndRefresh(() => patchJson(`/api/tools/inventory-industrial/refinery/${run.id}`, { status }), "Failed to update refinery status")} className={`rounded-lg border px-2 py-1 text-xs ${run.status === status ? "border-cyan-300/40 bg-cyan-400/20 text-cyan-100" : "border-slate-600 text-slate-300"}`}>{status}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Resource Take-Out Tickets</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <select value={newTicketItemId} onChange={(event) => setNewTicketItemId(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"><option value="">Ticket item</option>{dashboard.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <select value={newTicketType} onChange={(event) => setNewTicketType(event.target.value as (typeof ticketTypes)[number])} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">{ticketTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
                <input type="number" min={1} value={newTicketQuantity} onChange={(event) => setNewTicketQuantity(Number(event.target.value || 0))} placeholder="Quantity" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
                <input value={newTicketReason} onChange={(event) => setNewTicketReason(event.target.value)} placeholder="Reason" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
                <input value={newTicketNotes} onChange={(event) => setNewTicketNotes(event.target.value)} placeholder="Notes" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 md:col-span-2" />
                <button type="button" disabled={busy} onClick={() => void runAndRefresh(async () => {
                  await postJson("/api/tools/inventory-industrial/tickets", { itemId: newTicketItemId, quantity: newTicketQuantity, type: newTicketType, reason: newTicketReason, notes: newTicketNotes || undefined });
                  setNewTicketItemId("");
                  setNewTicketQuantity(0);
                  setNewTicketReason("");
                  setNewTicketNotes("");
                }, "Failed to create ticket")} className="rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-3 py-2 text-sm font-medium text-cyan-100 disabled:opacity-60 md:col-span-2">Create Ticket</button>
              </div>
              <div className="mt-4 space-y-2">
                {dashboard.tickets.length === 0 ? <p className="text-sm text-slate-400">No resource tickets yet.</p> : dashboard.tickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-3">
                    <p className="font-medium text-slate-100">{ticket.ticketNumber} · {ticket.item.name} ({ticket.quantity} {ticket.unit})</p>
                    <p className="text-xs text-slate-400">{ticket.type} · {ticket.reason}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ticketStatuses.map((status) => (
                        <button key={status} type="button" disabled={busy || ticket.status === status} onClick={() => void runAndRefresh(() => patchJson(`/api/tools/inventory-industrial/tickets/${ticket.id}`, { status }), "Failed to update ticket status")} className={`rounded-lg border px-2 py-1 text-xs ${ticket.status === status ? "border-cyan-300/40 bg-cyan-400/20 text-cyan-100" : "border-slate-600 text-slate-300"}`}>{status}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Industrial Jobs</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              <input value={newJobTitle} onChange={(event) => setNewJobTitle(event.target.value)} placeholder="Job title" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
              <select value={newJobType} onChange={(event) => setNewJobType(event.target.value as (typeof jobTypes)[number])} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">{jobTypes.map((jobType) => <option key={jobType} value={jobType}>{jobType}</option>)}</select>
              <input type="number" min={1} max={5} value={newJobPriority} onChange={(event) => setNewJobPriority(Number(event.target.value || 3))} placeholder="Priority" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
              <select value={newJobTargetItemId} onChange={(event) => setNewJobTargetItemId(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"><option value="">Target item</option>{dashboard.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
              <button type="button" disabled={busy} onClick={() => void runAndRefresh(async () => {
                await postJson("/api/tools/inventory-industrial/jobs", { title: newJobTitle, jobType: newJobType, priority: newJobPriority, targetItemId: newJobTargetItemId || undefined });
                setNewJobTitle("");
                setNewJobTargetItemId("");
              }, "Failed to create job")} className="rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-3 py-2 text-sm font-medium text-cyan-100 disabled:opacity-60 md:col-span-2 xl:col-span-4">Create Job</button>
            </div>
            <div className="mt-4 space-y-2">
              {dashboard.jobs.length === 0 ? <p className="text-sm text-slate-400">No industrial jobs yet.</p> : dashboard.jobs.map((job) => (
                <div key={job.id} className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-3">
                  <p className="font-medium text-slate-100">{job.title}</p>
                  <p className="text-xs text-slate-400">{job.jobType} · Priority {job.priority}{job.targetItem ? ` · ${job.targetItem.name}` : ""}</p>
                  <div className="mt-2 flex flex-wrap gap-2">{jobStatuses.map((status) => (
                    <button key={status} type="button" disabled={busy || job.status === status} onClick={() => void runAndRefresh(() => patchJson(`/api/tools/inventory-industrial/jobs/${job.id}`, { status }), "Failed to update job status")} className={`rounded-lg border px-2 py-1 text-xs ${job.status === status ? "border-cyan-300/40 bg-cyan-400/20 text-cyan-100" : "border-slate-600 text-slate-300"}`}>{status}</button>
                  ))}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : busy ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-sm text-slate-300">Loading inventory and industrial data...</div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-sm text-slate-300">No organization scope found. Join an organization to use this module.</div>
      )}
    </section>
  );
}
