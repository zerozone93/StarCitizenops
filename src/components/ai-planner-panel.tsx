"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";

type OperationOption = {
  title: string;
  type: string;
  inGameContract?: string;
  location: string;
  objective: string;
  description: string;
  threatLevel: string;
  requiredShips: string;
  requiredGroundVehicles: string;
  requiredPersonnel: string;
  missionPhases: string;
  commsPlan: string;
  rulesOfEngagement: string;
  rallyPoints: string;
  extractionPlan: string;
  contingencyPlans: string;
  requiredSupplies: string;
};

type AIPlannerPanelProps = {
  organizationName?: string;
  operationId?: string;
};

const THREAT_COLORS: Record<string, string> = {
  LOW: "text-green-400 border-green-500/30 bg-green-950/20",
  MODERATE: "text-yellow-400 border-yellow-500/30 bg-yellow-950/20",
  HIGH: "text-orange-400 border-orange-500/30 bg-orange-950/20",
  CRITICAL: "text-rose-400 border-rose-500/30 bg-rose-950/20",
};

function parseOperationOptions(raw: string): OperationOption[] | null {
  try {
    // Strip possible markdown code fences
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as OperationOption[];
    }
  } catch {
    // not parseable JSON
  }
  return null;
}

function buildUseThisPlanUrl(option: OperationOption, startTime?: string): string {
  const params = new URLSearchParams();
  params.set("ai_title", option.title);
  params.set("ai_type", option.type);
  if (option.inGameContract) params.set("ai_inGameContract", option.inGameContract);
  params.set("ai_location", option.location);
  params.set("ai_objective", option.objective);
  params.set("ai_description", option.description);
  params.set("ai_threatLevel", option.threatLevel);
  params.set("ai_requiredShips", option.requiredShips);
  params.set("ai_requiredGroundVehicles", option.requiredGroundVehicles);
  params.set("ai_requiredPersonnel", option.requiredPersonnel);
  params.set("ai_missionPhases", option.missionPhases);
  params.set("ai_commsPlan", option.commsPlan);
  params.set("ai_rulesOfEngagement", option.rulesOfEngagement);
  params.set("ai_rallyPoints", option.rallyPoints);
  params.set("ai_extractionPlan", option.extractionPlan);
  params.set("ai_contingencyPlans", option.contingencyPlans);
  params.set("ai_requiredSupplies", option.requiredSupplies);
  if (startTime) params.set("ai_startTime", startTime);
  return `/operations/new?${params.toString()}`;
}

function OperationOptionCard({ option, index, startTime }: { option: OperationOption; index: number; startTime?: string }) {
  const threatClass = THREAT_COLORS[option.threatLevel] ?? "text-slate-300 border-slate-500/30 bg-slate-950/20";

  const fields: { label: string; value: string }[] = [
    { label: "Type", value: option.type.replace(/_/g, " ") },
    { label: "In-Game Contract", value: option.inGameContract || "" },
    { label: "Location", value: option.location },
    { label: "Objective", value: option.objective },
    { label: "Description", value: option.description },
    { label: "Required Ships", value: option.requiredShips },
    { label: "Ground Vehicles", value: option.requiredGroundVehicles || "None" },
    { label: "Personnel", value: option.requiredPersonnel },
    { label: "Mission Phases", value: option.missionPhases },
    { label: "Comms Plan", value: option.commsPlan },
    { label: "Rules of Engagement", value: option.rulesOfEngagement },
    { label: "Rally Points", value: option.rallyPoints },
    { label: "Extraction Plan", value: option.extractionPlan },
    { label: "Contingency Plans", value: option.contingencyPlans },
    { label: "Required Supplies", value: option.requiredSupplies },
  ];

  return (
    <div className="rounded-lg border border-cyan-500/20 bg-slate-900/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest">Option {index + 1}</span>
          <h5 className="text-sm font-semibold text-cyan-100">{option.title}</h5>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${threatClass}`}>
          {option.threatLevel}
        </span>
      </div>
      <div className="p-4 space-y-2">
        {fields.map(({ label, value }) =>
          value ? (
            <div key={label} className="grid grid-cols-[140px_1fr] gap-2 text-xs">
              <span className="text-slate-500 font-medium pt-0.5">{label}</span>
              <span className="text-slate-200 leading-relaxed">{value}</span>
            </div>
          ) : null
        )}
      </div>
      <div className="px-4 pb-4">
        <a
          href={buildUseThisPlanUrl(option, startTime)}
          className="inline-block rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 px-4 py-2 text-xs font-semibold text-cyan-200 transition-colors"
        >
          Use This Plan →
        </a>
      </div>
    </div>
  );
}

export function AIPlannerPanel({ organizationName }: AIPlannerPanelProps) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<OperationOption[] | null>(null);
  const [rawResult, setRawResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [plannedStartTime, setPlannedStartTime] = useState<string>(new Date().toISOString());

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOptions(null);
    setRawResult("");

    try {
      const formData = new FormData(e.currentTarget);
      const payload = {
        organizationName: formData.get("organizationName"),
        numberOfPlayers: formData.get("numberOfPlayers"),
        missionFocus: formData.get("missionFocus") || "",
        operationDescription: formData.get("operationDescription"),
      };

      // Call the secure backend API (API key never leaves server)
      const response = await fetch("/api/ai-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate operation plans");
        return;
      }

      const resultText = data.plan?.result || "";
      const parsed = parseOperationOptions(resultText);
      if (parsed) {
        setOptions(parsed);
      } else {
        setRawResult(resultText || "No result returned");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
      <div>
        <h3 className="text-lg font-semibold text-cyan-100">AI Operation Generator</h3>
        <p className="text-xs text-slate-400 mt-1">
          Fill in four fields, get three structured options, then send one into the create form.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-300 mb-1 block">
              Organization Name
            </label>
            <input
              required
              name="organizationName"
              placeholder="e.g., Aegis Vanguard"
              defaultValue={organizationName || ""}
              className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm text-cyan-100 placeholder-slate-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 mb-1 block">
              Crew Size
            </label>
            <input
              required
              name="numberOfPlayers"
              type="number"
              min="1"
              max="100"
              placeholder="e.g., 8"
              className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm text-cyan-100 placeholder-slate-500"
            />
          </div>

          <div className="md:col-span-2">
            <DateTimePicker
              value={plannedStartTime}
              onChange={setPlannedStartTime}
              label="Planned Start Date & Time"
            />
            <p className="text-xs text-slate-500 mt-1">This will pre-fill the start time on each generated operation option.</p>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-300 mb-1 block">
            Mission Focus
          </label>
          <select
            name="missionFocus"
            className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm text-cyan-100"
          >
            <option value="">— Let AI decide —</option>
            <option value="FLEET_PATROL">Fleet Patrol</option>
            <option value="BOUNTY_OPERATION">Bounty Hunting</option>
            <option value="CARGO_CONVOY">Cargo &amp; Convoy</option>
            <option value="GROUND_ASSAULT">Ground Assault</option>
            <option value="COMBINED_ARMS_ASSAULT">Combined Arms</option>
            <option value="MINING_SECURITY">Mining &amp; Security</option>
            <option value="SALVAGE_OPERATION">Salvage</option>
            <option value="RESCUE_OPERATION">Rescue</option>
            <option value="MEDICAL_SUPPORT_OPERATION">Medical Support</option>
            <option value="EXPLORATION_MISSION">Exploration</option>
            <option value="BASE_DEFENSE">Base Defense</option>
            <option value="ANTI_PIRACY_ESCORT">Anti-Piracy Escort</option>
            <option value="PIRACY_INTERDICTION">Piracy Interdiction</option>
            <option value="JOINT_FLEET_EXERCISE">Fleet Exercise</option>
            <option value="CUSTOM_OPERATION">Custom / Other</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">Select your org&apos;s preferred operation type to guide AI generation.</p>
        </div>

        <div>
          <label className="text-xs text-slate-300 mb-1 block">
            Mission Brief
          </label>
          <textarea
            required
            name="operationDescription"
            placeholder="Describe what your org wants to accomplish. Include goals, preferred tactics, specific contracts, target locations, or any context. Example: We want to run bounty hunting in Stanton targeting Ninetails using fighters and a support ship."
            rows={4}
            className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm text-cyan-100 placeholder-slate-500"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-500/30 hover:bg-cyan-500/40 disabled:opacity-50"
        >
          {loading ? "Generating Operations..." : "Generate Operation Ideas"}
        </Button>
      </form>

      {error && (
        <div className="rounded-md border border-rose-500/20 bg-rose-950/30 p-3">
          <p className="text-sm text-rose-200">{error}</p>
        </div>
      )}

      {options && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-cyan-100">Generated Operation Options:</h4>
          {options.map((option, i) => (
            <OperationOptionCard key={i} option={option} index={i} startTime={plannedStartTime} />
          ))}
        </div>
      )}

      {rawResult && !options && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-cyan-100">Generated Operations:</h4>
          <div className="max-h-96 overflow-auto rounded-md border border-cyan-500/20 bg-slate-950/50 p-4">
            <pre className="whitespace-pre-wrap text-xs text-slate-200 font-mono leading-relaxed">
              {rawResult}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
