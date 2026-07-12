"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DashboardEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string | null;
  status: string;
  threatLevel: string;
  organizationName: string | null;
  organizationTag: string | null;
  objective: string | null;
  description: string | null;
  attendeeSummary: {
    attending: number;
    maybe: number;
    declined: number;
    standby: number;
  };
};

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildCalendarCells(year: number, monthIndex: number) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const firstWeekday = firstOfMonth.getDay();
  const start = new Date(year, monthIndex, 1 - firstWeekday);

  return Array.from({ length: 42 }, (_, offset) => {
    const current = new Date(start);
    current.setDate(start.getDate() + offset);
    return {
      date: current,
      inCurrentMonth: current.getMonth() === monthIndex,
      key: dateKey(current),
    };
  });
}

export function DashboardEventCalendar({ events, userTimezone }: { events: DashboardEvent[]; userTimezone?: string | null }) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "today" | "week">("all");
  const [rsvpStatus, setRsvpStatus] = useState<"GOING" | "MAYBE" | "DECLINED" | "STANDBY">("MAYBE");
  const [preferredRole, setPreferredRole] = useState("");
  const [rsvpNote, setRsvpNote] = useState("");
  const [savingRSVP, setSavingRSVP] = useState(false);
  const [rsvpMessage, setRsvpMessage] = useState<string | null>(null);
  const [rsvpSummaryByEvent, setRsvpSummaryByEvent] = useState<Record<string, DashboardEvent["attendeeSummary"]>>({});

  const dateWindows = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const dayOfWeek = startOfToday.getDay();
    const weekStart = new Date(startOfToday);
    weekStart.setDate(weekStart.getDate() - dayOfWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return {
      startOfToday,
      startOfTomorrow,
      weekStart,
      weekEnd,
    };
  }, []);

  const filterCounts = useMemo(() => {
    const today = events.filter((event) => {
      const start = new Date(event.startTime);
      return start >= dateWindows.startOfToday && start < dateWindows.startOfTomorrow;
    }).length;

    const week = events.filter((event) => {
      const start = new Date(event.startTime);
      return start >= dateWindows.weekStart && start < dateWindows.weekEnd;
    }).length;

    return {
      all: events.length,
      today,
      week,
    };
  }, [dateWindows, events]);

  const filteredEvents = useMemo(() => {
    if (filterMode === "all") {
      return events;
    }

    if (filterMode === "today") {
      return events.filter((event) => {
        const start = new Date(event.startTime);
        return start >= dateWindows.startOfToday && start < dateWindows.startOfTomorrow;
      });
    }

    return events.filter((event) => {
      const start = new Date(event.startTime);
      return start >= dateWindows.weekStart && start < dateWindows.weekEnd;
    });
  }, [dateWindows, events, filterMode]);

  const monthLabel = monthCursor.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  const calendarCells = useMemo(
    () => buildCalendarCells(monthCursor.getFullYear(), monthCursor.getMonth()),
    [monthCursor]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, DashboardEvent[]>();
    for (const event of filteredEvents) {
      const start = new Date(event.startTime);
      if (Number.isNaN(start.getTime())) continue;
      const key = dateKey(start);
      const grouped = map.get(key) || [];
      grouped.push(event);
      map.set(key, grouped);
    }

    for (const grouped of map.values()) {
      grouped.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }

    return map;
  }, [filteredEvents]);

  const selectedEvent = useMemo(
    () => filteredEvents.find((event) => event.id === selectedEventId) || null,
    [filteredEvents, selectedEventId]
  );
  const selectedEventSummary = selectedEvent
    ? rsvpSummaryByEvent[selectedEvent.id] || selectedEvent.attendeeSummary
    : null;

  const refreshAttendeeSummary = async (operationId: string) => {
    const response = await fetch(`/api/operations/${operationId}/rsvp`, {
      cache: "no-store",
    });

    if (!response.ok) return;

    const payload = (await response.json()) as {
      attendeeSummary?: DashboardEvent["attendeeSummary"];
    };

    if (!payload.attendeeSummary) return;

    setRsvpSummaryByEvent((prev) => ({
      ...prev,
      [operationId]: payload.attendeeSummary as DashboardEvent["attendeeSummary"],
    }));
  };

  const openEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setRsvpStatus("MAYBE");
    setPreferredRole("");
    setRsvpNote("");
    setRsvpMessage(null);
  };

  async function submitRSVP() {
    if (!selectedEvent || savingRSVP) return;

    setSavingRSVP(true);
    setRsvpMessage(null);
    try {
      const response = await fetch(`/api/operations/${selectedEvent.id}/rsvp`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: rsvpStatus,
          note: rsvpNote,
          preferredRole,
        }),
      });

      if (!response.ok) {
        setRsvpMessage("Unable to update RSVP right now.");
        return;
      }

      const payload = (await response.json()) as {
        attendeeSummary?: DashboardEvent["attendeeSummary"];
      };

      if (payload.attendeeSummary && selectedEvent) {
        setRsvpSummaryByEvent((prev) => ({
          ...prev,
          [selectedEvent.id]: payload.attendeeSummary as DashboardEvent["attendeeSummary"],
        }));
      }

      if (selectedEvent) {
        setTimeout(() => {
          void refreshAttendeeSummary(selectedEvent.id);
        }, 1200);
      }

      setRsvpMessage("RSVP updated.");
    } catch {
      setRsvpMessage("Unable to update RSVP right now.");
    } finally {
      setSavingRSVP(false);
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-cyan-300/20 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-cyan-100">Operations calendar</h3>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-md border border-slate-600/60 bg-slate-950/70 p-1 sm:flex">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`rounded px-2 py-1 text-[11px] ${filterMode === "all" ? "bg-cyan-500 text-slate-950" : "text-slate-300"}`}
            >
              All ({filterCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("today")}
              className={`rounded px-2 py-1 text-[11px] ${filterMode === "today" ? "bg-cyan-500 text-slate-950" : "text-slate-300"}`}
            >
              Today ({filterCounts.today})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("week")}
              className={`rounded px-2 py-1 text-[11px] ${filterMode === "week" ? "bg-cyan-500 text-slate-950" : "text-slate-300"}`}
            >
              This Week ({filterCounts.week})
            </button>
          </div>
          <button
            type="button"
            onClick={() =>
              setMonthCursor((previous) =>
                new Date(previous.getFullYear(), previous.getMonth() - 1, 1)
              )
            }
            className="rounded-md border border-cyan-500/30 px-2 py-1 text-xs text-cyan-100"
          >
            Prev
          </button>
          <p className="min-w-32 text-center text-xs text-slate-400">{monthLabel}</p>
          <button
            type="button"
            onClick={() =>
              setMonthCursor((previous) =>
                new Date(previous.getFullYear(), previous.getMonth() + 1, 1)
              )
            }
            className="rounded-md border border-cyan-500/30 px-2 py-1 text-xs text-cyan-100"
          >
            Next
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-md border border-slate-600/60 bg-slate-950/70 p-1 sm:hidden">
        <button
          type="button"
          onClick={() => setFilterMode("all")}
          className={`rounded px-2 py-1 text-[11px] ${filterMode === "all" ? "bg-cyan-500 text-slate-950" : "text-slate-300"}`}
        >
          All ({filterCounts.all})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode("today")}
          className={`rounded px-2 py-1 text-[11px] ${filterMode === "today" ? "bg-cyan-500 text-slate-950" : "text-slate-300"}`}
        >
          Today ({filterCounts.today})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode("week")}
          className={`rounded px-2 py-1 text-[11px] ${filterMode === "week" ? "bg-cyan-500 text-slate-950" : "text-slate-300"}`}
        >
          This Week ({filterCounts.week})
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
          <div key={weekday} className="py-1 font-semibold uppercase tracking-wide text-slate-500">
            {weekday}
          </div>
        ))}

        {calendarCells.map((cell) => {
          const dayEvents = eventsByDay.get(cell.key) || [];
          return (
            <div
              key={cell.key}
              className={`min-h-20 rounded border p-1 text-left ${
                cell.inCurrentMonth
                  ? "border-cyan-500/20 bg-slate-950/40"
                  : "border-slate-700/50 bg-slate-950/20 text-slate-600"
              }`}
            >
              <p className="text-xs text-slate-300">{cell.date.getDate()}</p>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => openEvent(event.id)}
                    className="w-full truncate rounded bg-cyan-500/20 px-1 py-0.5 text-left text-[10px] text-cyan-100"
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 2 ? (
                  <button
                    type="button"
                    onClick={() => openEvent(dayEvents[2].id)}
                    className="text-[10px] text-slate-400"
                  >
                    +{dayEvents.length - 2} more
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {selectedEvent ? (
        <article className="rounded-xl border border-orange-300/25 bg-orange-500/5 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h4 className="text-base font-semibold text-orange-100">{selectedEvent.title}</h4>
            <button
              type="button"
              onClick={() => setSelectedEventId(null)}
              className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200"
            >
              Collapse
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-300">
            Starts {new Intl.DateTimeFormat(undefined, { timeZone: userTimezone ?? undefined, year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(new Date(selectedEvent.startTime))}
            {selectedEvent.endTime ? ` | Ends ${new Intl.DateTimeFormat(undefined, { timeZone: userTimezone ?? undefined, year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(new Date(selectedEvent.endTime))}` : ""}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {selectedEvent.organizationName
              ? `${selectedEvent.organizationName}${selectedEvent.organizationTag ? ` (${selectedEvent.organizationTag})` : ""}`
              : "Independent operation"}
            {` | ${selectedEvent.status.replaceAll("_", " ")} | Threat ${selectedEvent.threatLevel.replaceAll("_", " ")}`}
          </p>
          <p className="mt-2 text-sm text-slate-300">
            {selectedEvent.objective || selectedEvent.description || "No additional operation notes."}
          </p>
          <div className="mt-2 text-xs font-medium">
            <span className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-100">Attending {selectedEventSummary?.attending ?? 0}</span>
            <span className="ml-1 rounded bg-yellow-500/20 px-2 py-1 text-yellow-100">Maybe {selectedEventSummary?.maybe ?? 0}</span>
            <span className="ml-1 rounded bg-red-500/20 px-2 py-1 text-red-100">Declined {selectedEventSummary?.declined ?? 0}</span>
            <span className="ml-1 rounded bg-slate-500/20 px-2 py-1 text-slate-100">Standby {selectedEventSummary?.standby ?? 0}</span>
          </div>
          <div className="mt-3 space-y-2 rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-3">
            <p className="text-xs uppercase tracking-wide text-cyan-200">RSVP</p>
            <div className="grid gap-2 md:grid-cols-2">
              <select
                value={rsvpStatus}
                onChange={(event) => setRsvpStatus(event.target.value as "GOING" | "MAYBE" | "DECLINED" | "STANDBY")}
                className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
              >
                <option value="GOING">Attending</option>
                <option value="MAYBE">Maybe</option>
                <option value="DECLINED">Not attending</option>
                <option value="STANDBY">Standby</option>
              </select>
              <input
                value={preferredRole}
                onChange={(event) => setPreferredRole(event.target.value)}
                placeholder="Role you want to play"
                className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
              />
            </div>
            <textarea
              value={rsvpNote}
              onChange={(event) => setRsvpNote(event.target.value)}
              placeholder="Optional note"
              className="min-h-20 w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void submitRSVP()}
              disabled={savingRSVP}
              className="rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingRSVP ? "Saving..." : "Save RSVP"}
            </button>
            {rsvpMessage ? <p className="text-xs text-slate-300">{rsvpMessage}</p> : null}
          </div>
          <Link
            href={`/operations/${selectedEvent.id}`}
            className="mt-3 inline-flex rounded-md border border-cyan-300/40 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100"
          >
            Open operation
          </Link>
        </article>
      ) : (
        <p className="text-xs text-slate-500">Click a marked event to expand operation details.</p>
      )}
    </section>
  );
}
