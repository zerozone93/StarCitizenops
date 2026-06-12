"use client";

/**
 * LocalTime — displays an ISO date string in the given IANA timezone.
 * Falls back to the browser's local timezone when none is supplied.
 */

type LocalTimeProps = {
  isoDate: string | null | undefined;
  timezone?: string | null;
  fallback?: string;
};

export function LocalTime({ isoDate, timezone, fallback = "TBD" }: LocalTimeProps) {
  if (!isoDate) return <span>{fallback}</span>;

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return <span>{fallback}</span>;

  const tz = timezone && timezone.trim() ? timezone.trim() : undefined;
  let formatted = date.toLocaleString();
  let title: string | undefined;

  try {
    formatted = new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(date);
    title = `UTC: ${date.toUTCString()}`;
  } catch {
    // Invalid timezone string — fall back to locale default.
  }

  return title ? <time dateTime={isoDate} title={title}>{formatted}</time> : <time dateTime={isoDate}>{formatted}</time>;
}
