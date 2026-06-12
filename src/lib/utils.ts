import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTimeLocalValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function formatDateTimeLocalValueInTimeZone(input: string | Date, timeZone?: string | null) {
  const date = typeof input === "string" ? new Date(input) : input
  if (Number.isNaN(date.getTime())) return ""
  if (!timeZone) return formatDateTimeLocalValue(date)

  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date)

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value])) as Record<string, string>
    return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`
  } catch {
    return formatDateTimeLocalValue(date)
  }
}

export function convertISOToDateTimeLocal(isoString: string): string {
  if (!isoString) return ""
  try {
    return formatDateTimeLocalValue(new Date(isoString))
  } catch {
    return ""
  }
}
