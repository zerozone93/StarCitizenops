"use client";

import { useMemo, useState } from "react";
import { DateTimePickerFormField } from "@/components/ui/date-time-picker-form-field";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  location: string | null;
  status: string;
  threatLevel: string;
  attendeeSummary: {
    attending: number;
    maybe: number;
    declined: number;
    standby: number;
  };
};

type EventAction = (formData: FormData) => void | Promise<void>;

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

function toDateTimeLocalValue(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function defaultCreateValueForDate(dayKey: string) {
  return `${dayKey}T19:00`;
}

export function OrganizationEventCalendar({
  organizationId,
  events,
  canCreateEvents,
  canManageEvents,
  canRSVPEvents,
  createEventAction,
  updateEventAction,
  deleteEventAction,
  userTimezone,
}: {
  organizationId: string;
  events: CalendarEvent[];
  canCreateEvents: boolean;
  canManageEvents: boolean;
  canRSVPEvents: boolean;
  createEventAction: EventAction;
  updateEventAction: EventAction;
  deleteEventAction: EventAction;
  userTimezone?: string | null;
}) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<"GOING" | "MAYBE" | "DECLINED" | "STANDBY">("MAYBE");
  const [preferredRole, setPreferredRole] = useState("");
  const [rsvpNote, setRsvpNote] = useState("");
  const [savingRSVP, setSavingRSVP] = useState(false);
  const [rsvpMessage, setRsvpMessage] = useState<string | null>(null);
  const [prefilledStartTime, setPrefilledStartTime] = useState<string>("");
  const [rsvpSummaryByEvent, setRsvpSummaryByEvent] = useState<Record<string, CalendarEvent["attendeeSummary"]>>({});

  const monthLabel = monthCursor.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  const calendarCells = useMemo(
    () => buildCalendarCells(monthCursor.getFullYear(), monthCursor.getMonth()),
    [monthCursor]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const start = new Date(event.startTime);
      if (Number.isNaN(start.getTime())) continue;
      const key = dateKey(start);
      const existing = map.get(key) || [];
      existing.push(event);
      map.set(key, existing);
    }
    for (const groupedEvents of map.values()) {
      groupedEvents.sort((a, b) => {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });
    }
    return map;
  }, [events]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || null,
    [events, selectedEventId]
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
      attendeeSummary?: CalendarEvent["attendeeSummary"];
    };

    if (!payload.attendeeSummary) return;

    setRsvpSummaryByEvent((prev) => ({
      ...prev,
      [operationId]: payload.attendeeSummary as CalendarEvent["attendeeSummary"],
    }));
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
        attendeeSummary?: CalendarEvent["attendeeSummary"];
      };

      if (payload.attendeeSummary && selectedEvent) {
        setRsvpSummaryByEvent((prev) => ({
          ...prev,
          [selectedEvent.id]: payload.attendeeSummary as CalendarEvent["attendeeSummary"],
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

  function handleDayClick(dayKey: string, inCurrentMonth: boolean, dayEvents: CalendarEvent[]) {
    if (canCreateEvents && inCurrentMonth) {
      setPrefilledStartTime(defaultCreateValueForDate(dayKey));
      return;
    }

    if (!canCreateEvents && dayEvents.length) {
      setSelectedEventId(dayEvents[0].id);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-cyan-100">Event calendar</h3>
        <div className="flex items-center gap-2">
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

      {canCreateEvents ? (
        <form action={createEventAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input type="hidden" name="organizationId" value={organizationId} />
          <input type="hidden" name="redirectTo" value={`/organizations/${organizationId}`} />
          {canManageEvents && prefilledStartTime ? (
            <p className="text-xs text-cyan-200 md:col-span-2">
              Creating from selected date: {new Date(prefilledStartTime).toLocaleString()}
            </p>
          ) : null}
          <input
            required
            name="title"
            placeholder="Event title"
            className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm md:col-span-2"
          />
          <DateTimePickerFormField
            name="startTime"
            required
            label="Start time"
            initialValue={prefilledStartTime}
            onValueChange={setPrefilledStartTime}
          />
          <DateTimePickerFormField name="endTime" label="End time" />
          <select
            name="recurrence"
            defaultValue="NONE"
            className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
          >
            <option value="NONE">Does not repeat</option>
            <option value="DAILY">Repeat daily</option>
            <option value="WEEKLY">Repeat weekly</option>
            <option value="MONTHLY">Repeat monthly</option>
          </select>
          <input
            type="number"
            name="recurrenceCount"
            min={1}
            max={52}
            defaultValue={1}
            className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
            placeholder="Occurrences"
          />
          <textarea
            name="description"
            placeholder="Event details, plan notes, or agenda"
            className="min-h-24 rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm md:col-span-2"
          />
          <button
            type="submit"
            className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 md:col-span-2 md:justify-self-start"
          >
            Create event
          </button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-slate-400">Only organization leadership can create events.</p>
      )}

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
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
              onClick={() => handleDayClick(cell.key, cell.inCurrentMonth, dayEvents)}
              className={`min-h-20 rounded border p-1 text-left ${
                cell.inCurrentMonth
                  ? "border-cyan-500/20 bg-slate-950/40"
                  : "border-slate-700/50 bg-slate-950/20 text-slate-600"
              } ${canCreateEvents && cell.inCurrentMonth ? "cursor-pointer" : !canCreateEvents && dayEvents.length ? "cursor-pointer" : ""}`}
            >
              <p className="text-xs text-slate-300">{cell.date.getDate()}</p>
              {canCreateEvents && cell.inCurrentMonth ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPrefilledStartTime(defaultCreateValueForDate(cell.key));
                  }}
                  className="mt-1 rounded border border-cyan-400/30 px-1 py-0.5 text-[10px] text-cyan-100"
                >
                  + create
                </button>
              ) : null}
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      setSelectedEventId(event.id);
                    }}
                    className="w-full truncate rounded bg-cyan-500/20 px-1 py-0.5 text-left text-[10px] text-cyan-100"
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 2 ? (
                  <button
                    type="button"
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      setSelectedEventId(dayEvents[2].id);
                    }}
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
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70">
          <div className="h-full w-full max-w-lg overflow-y-auto border-l border-cyan-500/30 bg-slate-900 p-5">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-lg font-semibold text-cyan-100">{selectedEvent.title}</h4>
              <button
                type="button"
                onClick={() => setSelectedEventId(null)}
                className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="mt-3 space-y-1 text-sm text-slate-300">
              <p>Starts: {new Intl.DateTimeFormat(undefined, { timeZone: userTimezone ?? undefined, year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(new Date(selectedEvent.startTime))}</p>
              <p>
                Ends: {selectedEvent.endTime ? new Intl.DateTimeFormat(undefined, { timeZone: userTimezone ?? undefined, year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(new Date(selectedEvent.endTime)) : "Not set"}
              </p>
              <p>Status: {selectedEvent.status.replaceAll("_", " ")}</p>
              <p>Threat: {selectedEvent.threatLevel.replaceAll("_", " ")}</p>
              <div className="mt-2 text-xs font-medium">
                <span className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-100">Attending {selectedEventSummary?.attending ?? 0}</span>
                <span className="ml-1 rounded bg-yellow-500/20 px-2 py-1 text-yellow-100">Maybe {selectedEventSummary?.maybe ?? 0}</span>
                <span className="ml-1 rounded bg-red-500/20 px-2 py-1 text-red-100">Declined {selectedEventSummary?.declined ?? 0}</span>
                <span className="ml-1 rounded bg-slate-500/20 px-2 py-1 text-slate-100">Standby {selectedEventSummary?.standby ?? 0}</span>
              </div>
              {selectedEvent.location ? <p className="mt-1">Location: {selectedEvent.location}</p> : null}
            </div>

            {selectedEvent.description ? (
              <p className="mt-3 rounded-md border border-cyan-500/20 bg-slate-950/60 p-3 text-sm text-slate-300">
                {selectedEvent.description}
              </p>
            ) : null}

            {canRSVPEvents ? (
              <div className="mt-4 space-y-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
                <h5 className="text-sm font-semibold text-cyan-100">RSVP to this event</h5>
                <div className="grid gap-2 md:grid-cols-2">
                  <select
                    value={rsvpStatus}
                    onChange={(event) =>
                      setRsvpStatus(
                        event.target.value as "GOING" | "MAYBE" | "DECLINED" | "STANDBY"
                      )
                    }
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
                  className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingRSVP ? "Saving..." : "Save RSVP"}
                </button>
                {rsvpMessage ? <p className="text-xs text-slate-300">{rsvpMessage}</p> : null}
              </div>
            ) : null}

            {canManageEvents ? (
              <div className="mt-4 space-y-4 rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
                <h5 className="text-sm font-semibold text-orange-100">Manage event</h5>

                <form action={updateEventAction} className="space-y-2">
                  <input type="hidden" name="organizationId" value={organizationId} />
                  <input type="hidden" name="eventId" value={selectedEvent.id} />
                  <input type="hidden" name="redirectTo" value={`/organizations/${organizationId}`} />
                  <input
                    required
                    name="title"
                    defaultValue={selectedEvent.title}
                    className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                  />
                  <DateTimePickerFormField
                    name="startTime"
                    required
                    label="Start time"
                    initialValue={toDateTimeLocalValue(selectedEvent.startTime)}
                  />
                  <DateTimePickerFormField
                    name="endTime"
                    label="End time"
                    initialValue={selectedEvent.endTime ? toDateTimeLocalValue(selectedEvent.endTime) : ""}
                  />
                  <textarea
                    name="description"
                    defaultValue={selectedEvent.description || ""}
                    className="min-h-24 w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
                    placeholder="Event details"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950"
                  >
                    Save changes
                  </button>
                </form>

                <form
                  action={deleteEventAction}
                  onSubmit={(event) => {
                    if (!window.confirm("Delete this organization event?")) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="organizationId" value={organizationId} />
                  <input type="hidden" name="eventId" value={selectedEvent.id} />
                  <input type="hidden" name="redirectTo" value={`/organizations/${organizationId}`} />
                  <button
                    type="submit"
                    className="rounded-md bg-rose-500/20 px-3 py-2 text-sm font-semibold text-rose-100"
                  >
                    Delete event
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
