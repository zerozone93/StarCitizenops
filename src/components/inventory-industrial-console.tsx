"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type OrganizationScope = {
  organizationId: string;
  name: string;
  tag: string;
  role: string;
  visibility: "PUBLIC" | "PRIVATE";
};

type DashboardPayload = {
  organizationId: string;
  totals: {
    locations: number;
    items: number;
    quantityOnHand: number;
    jobsOpen: number;
  };
  locations: Array<{
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    owner: { id: string; name: string | null; starCitizenHandle: string | null };
  }>;
  items: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    sku: string | null;
    notes: string | null;
    updatedAt: string;
    location: { id: string; name: string } | null;
    owner: { id: string; name: string | null; starCitizenHandle: string | null };
    lastUpdatedBy: { id: string; name: string | null; starCitizenHandle: string | null };
  }>;
  jobs: Array<{
    id: string;
    title: string;
    jobType: string;
    status: "PLANNED" | "ACTIVE" | "BLOCKED" | "COMPLETED" | "CANCELLED";
    priority: number;
    quantityTarget: number | null;
    quantityCompleted: number;
    dueAt: string | null;
    notes: string | null;
    updatedAt: string;
    targetItem: { id: string; name: string; unit: string } | null;
    createdBy: { id: string; name: string | null; starCitizenHandle: string | null };
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

function parseApiError(payload: ApiErrorShape | null, fallback: string) {
  if (!payload?.error) {
    return fallback;
  }

  if (typeof payload.error === "string") {
    return payload.error;
  }

  return payload.error.message || fallback;
}

export function InventoryIndustrialConsole() {
  const [organizations, setOrganizations] = useState<OrganizationScope[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
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
  const [newJobTargetQuantity, setNewJobTargetQuantity] = useState<number | "">("");
  const [newJobDueAt, setNewJobDueAt] = useState("");

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.organizationId === selectedOrganizationId) ?? null,
    [organizations, selectedOrganizationId]
  );

  const refreshDashboard = useCallback(async (organizationId: string) => {
    if (!organizationId) {
      setDashboard(null);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/tools/inventory-industrial/dashboard?organizationId=${organizationId}`, {
        method: "GET",
      });
      const payload = (await response.json()) as DashboardPayload | ApiErrorShape;

      if (!response.ok) {
        throw new Error(parseApiError(payload as ApiErrorShape, "Failed to load dashboard"));
      }

      setDashboard(payload as DashboardPayload);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to load dashboard";
      setError(message);
      setDashboard(null);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadOrganizations() {
      setBusy(true);
      setError(null);
      try {
        const response = await fetch("/api/tools/inventory-industrial/organizations", { method: "GET" });
        const payload = (await response.json()) as { organizations: OrganizationScope[] } | ApiErrorShape;
        if (!response.ok) {
          throw new Error(parseApiError(payload as ApiErrorShape, "Failed to load organizations"));
        }

        if (!active) {
          return;
        }

        const nextOrganizations = (payload as { organizations: OrganizationScope[] }).organizations;
        setOrganizations(nextOrganizations);

        if (nextOrganizations.length > 0) {
          const nextId = nextOrganizations[0].organizationId;
          setSelectedOrganizationId(nextId);
          void refreshDashboard(nextId);
        }
      } catch (caughtError) {
        if (!active) {
          return;
        }
        const message = caughtError instanceof Error ? caughtError.message : "Failed to load organizations";
        setError(message);
      } finally {
        if (active) {
          setBusy(false);
        }
      }
    }

    void loadOrganizations();

    return () => {
      active = false;
    };
  }, [refreshDashboard]);

  async function postJson(url: string, payload: Record<string, unknown>) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ApiErrorShape;
    if (!response.ok) {
      throw new Error(parseApiError(data, "Request failed"));
    }
  }

  async function patchJson(url: string, payload: Record<string, unknown>) {
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ApiErrorShape;
    if (!response.ok) {
      throw new Error(parseApiError(data, "Request failed"));
    }
  }

  async function handleCreateLocation() {
    if (!selectedOrganizationId || !newLocationName.trim()) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await postJson("/api/tools/inventory-industrial/locations", {
        organizationId: selectedOrganizationId,
        name: newLocationName,
        description: newLocationDescription || undefined,
      });

      setNewLocationName("");
      setNewLocationDescription("");
      await refreshDashboard(selectedOrganizationId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to create location");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateItem() {
    if (!selectedOrganizationId || !newItemName.trim()) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await postJson("/api/tools/inventory-industrial/items", {
        organizationId: selectedOrganizationId,
        name: newItemName,
        category: newItemCategory,
        quantity: newItemQuantity,
        unit: newItemUnit,
        sku: newItemSku || undefined,
        locationId: newItemLocationId || undefined,
      });

      setNewItemName("");
      setNewItemQuantity(0);
      setNewItemSku("");
      await refreshDashboard(selectedOrganizationId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to create item");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateJob() {
    if (!selectedOrganizationId || !newJobTitle.trim()) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await postJson("/api/tools/inventory-industrial/jobs", {
        organizationId: selectedOrganizationId,
        title: newJobTitle,
        jobType: newJobType,
        priority: newJobPriority,
        targetItemId: newJobTargetItemId || undefined,
        quantityTarget: newJobTargetQuantity === "" ? undefined : newJobTargetQuantity,
        dueAt: newJobDueAt || undefined,
      });

      setNewJobTitle("");
      setNewJobTargetItemId("");
      setNewJobTargetQuantity("");
      setNewJobDueAt("");
      await refreshDashboard(selectedOrganizationId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to create job");
    } finally {
      setBusy(false);
    }
  }

  async function handleSetJobStatus(jobId: string, status: (typeof jobStatuses)[number]) {
    setBusy(true);
    setError(null);

    try {
      await patchJson(`/api/tools/inventory-industrial/jobs/${jobId}`, { status });
      await refreshDashboard(selectedOrganizationId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to update job status");
    } finally {
      setBusy(false);
    }
  }

  async function handleAdjustQuantity(itemId: string, currentQuantity: number, delta: number) {
    const nextQuantity = Math.max(currentQuantity + delta, 0);
    setBusy(true);
    setError(null);

    try {
      await patchJson(`/api/tools/inventory-industrial/items/${itemId}`, { quantity: nextQuantity });
      await refreshDashboard(selectedOrganizationId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to adjust quantity");
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
              Native StarCitizenOps inventory and industrial tracking is now wired to the database. Manage stock, storage locations, and production jobs by organization.
            </p>
          </div>
          <div className="flex min-w-[260px] flex-col gap-2">
            <label htmlFor="inventory-org" className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Organization Scope
            </label>
            <select
              id="inventory-org"
              value={selectedOrganizationId}
              onChange={(event) => {
                const nextId = event.target.value;
                setSelectedOrganizationId(nextId);
                void refreshDashboard(nextId);
              }}
              className="rounded-xl border border-cyan-300/20 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
            >
              {organizations.map((organization) => (
                <option key={organization.organizationId} value={organization.organizationId}>
                  {organization.name} [{organization.tag}] ({organization.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
      ) : null}

      {dashboard ? (
        <>
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-cyan-300/20 bg-slate-950/55 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Locations</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-100">{dashboard.totals.locations}</p>
            </article>
            <article className="rounded-2xl border border-cyan-300/20 bg-slate-950/55 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Items</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-100">{dashboard.totals.items}</p>
            </article>
            <article className="rounded-2xl border border-cyan-300/20 bg-slate-950/55 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Quantity On Hand</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-100">{dashboard.totals.quantityOnHand}</p>
            </article>
            <article className="rounded-2xl border border-cyan-300/20 bg-slate-950/55 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Open Jobs</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-100">{dashboard.totals.jobsOpen}</p>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <article className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Create Location</p>
              <div className="mt-3 space-y-2">
                <input
                  value={newLocationName}
                  onChange={(event) => setNewLocationName(event.target.value)}
                  placeholder="Location name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                />
                <input
                  value={newLocationDescription}
                  onChange={(event) => setNewLocationDescription(event.target.value)}
                  placeholder="Description (optional)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => void handleCreateLocation()}
                  disabled={busy}
                  className="w-full rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-3 py-2 text-sm font-medium text-cyan-100 disabled:opacity-60"
                >
                  Add Location
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 xl:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Create Inventory Item</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                <input
                  value={newItemName}
                  onChange={(event) => setNewItemName(event.target.value)}
                  placeholder="Item name"
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                />
                <select
                  value={newItemCategory}
                  onChange={(event) => setNewItemCategory(event.target.value as (typeof itemCategories)[number])}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                >
                  {itemCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  value={newItemQuantity}
                  onChange={(event) => setNewItemQuantity(Number(event.target.value || 0))}
                  placeholder="Quantity"
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                />
                <input
                  value={newItemUnit}
                  onChange={(event) => setNewItemUnit(event.target.value)}
                  placeholder="Unit"
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                />
                <input
                  value={newItemSku}
                  onChange={(event) => setNewItemSku(event.target.value)}
                  placeholder="SKU (optional)"
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                />
                <select
                  value={newItemLocationId}
                  onChange={(event) => setNewItemLocationId(event.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="">No location</option>
                  {dashboard.locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void handleCreateItem()}
                  disabled={busy}
                  className="rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-3 py-2 text-sm font-medium text-cyan-100 disabled:opacity-60 md:col-span-2 xl:col-span-3"
                >
                  Add Inventory Item
                </button>
              </div>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <article className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 xl:col-span-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Inventory Items</p>
                <p className="text-xs text-slate-500">{selectedOrganization?.name || ""}</p>
              </div>
              <div className="mt-3 space-y-2">
                {dashboard.items.length === 0 ? (
                  <p className="text-sm text-slate-400">No inventory items yet.</p>
                ) : (
                  dashboard.items.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-slate-100">{item.name}</p>
                          <p className="text-xs text-slate-400">
                            {item.category} · {item.location?.name || "Unassigned location"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-200"
                            onClick={() => void handleAdjustQuantity(item.id, item.quantity, -1)}
                            disabled={busy}
                          >
                            -1
                          </button>
                          <span className="min-w-24 text-center text-sm text-cyan-100">
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            type="button"
                            className="rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-200"
                            onClick={() => void handleAdjustQuantity(item.id, item.quantity, 1)}
                            disabled={busy}
                          >
                            +1
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Create Industrial Job</p>
              <div className="mt-3 space-y-2">
                <input
                  value={newJobTitle}
                  onChange={(event) => setNewJobTitle(event.target.value)}
                  placeholder="Job title"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                />
                <select
                  value={newJobType}
                  onChange={(event) => setNewJobType(event.target.value as (typeof jobTypes)[number])}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                >
                  {jobTypes.map((jobType) => (
                    <option key={jobType} value={jobType}>
                      {jobType}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={newJobPriority}
                  onChange={(event) => setNewJobPriority(Number(event.target.value || 3))}
                  placeholder="Priority 1-5"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                />
                <select
                  value={newJobTargetItemId}
                  onChange={(event) => setNewJobTargetItemId(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="">No target item</option>
                  {dashboard.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  value={newJobTargetQuantity}
                  onChange={(event) => {
                    const raw = event.target.value;
                    setNewJobTargetQuantity(raw === "" ? "" : Number(raw));
                  }}
                  placeholder="Target quantity"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                />
                <input
                  type="datetime-local"
                  value={newJobDueAt}
                  onChange={(event) => setNewJobDueAt(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => void handleCreateJob()}
                  disabled={busy}
                  className="w-full rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-3 py-2 text-sm font-medium text-cyan-100 disabled:opacity-60"
                >
                  Create Job
                </button>
              </div>
            </article>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Industrial Jobs</p>
            <div className="mt-3 space-y-2">
              {dashboard.jobs.length === 0 ? (
                <p className="text-sm text-slate-400">No industrial jobs yet.</p>
              ) : (
                dashboard.jobs.map((job) => (
                  <div key={job.id} className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-3">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-medium text-slate-100">{job.title}</p>
                        <p className="text-xs text-slate-400">
                          {job.jobType} · Priority {job.priority}
                          {job.targetItem ? ` · Target ${job.targetItem.name}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {jobStatuses.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => void handleSetJobStatus(job.id, status)}
                            disabled={busy || job.status === status}
                            className={`rounded-lg border px-2 py-1 text-xs ${
                              job.status === status
                                ? "border-cyan-300/40 bg-cyan-400/20 text-cyan-100"
                                : "border-slate-600 text-slate-300"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      ) : busy ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-sm text-slate-300">Loading inventory and industrial data...</div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-sm text-slate-300">
          No organization scope found. Join an organization to use this module.
        </div>
      )}
    </section>
  );
}
