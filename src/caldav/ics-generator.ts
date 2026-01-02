/**
 * ICS Generator
 * Generates iCalendar (RFC 5545) format for event creation/update
 */

import type { CalendarEventInput } from "../types.ts";

/**
 * Generate ICS format from event object
 */
export function generateICS(event: CalendarEventInput): string {
  // Use provided UID (for updates) or generate new one (for creates)
  const uid = event.uid || generateUID();
  const dtstamp = formatICSDateTime(new Date());

  // Determine if this is an all-day event
  const isAllDay = event.start.length === 10 && event.end.length === 10;

  const dtstart = isAllDay ? formatICSDate(event.start) : formatICSDateTime(new Date(event.start));

  const dtend = isAllDay ? formatICSDate(event.end) : formatICSDateTime(new Date(event.end));

  // Build ICS content
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Deno Calendar//CalDAV Client//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART${isAllDay ? ";VALUE=DATE" : ""}:${dtstart}`,
    `DTEND${isAllDay ? ";VALUE=DATE" : ""}:${dtend}`,
    `SUMMARY:${escapeICSValue(event.summary)}`,
  ];

  // Add optional fields
  if (event.description) {
    ics.push(`DESCRIPTION:${escapeICSValue(event.description)}`);
  }

  if (event.location) {
    ics.push(`LOCATION:${escapeICSValue(event.location)}`);
  }

  // Add recurrence rule if provided
  if (event.recurrence) {
    const rrule = generateRRule(event.recurrence);
    ics.push(`RRULE:${rrule}`);
  }

  ics.push("END:VEVENT", "END:VCALENDAR");

  return ics.join("\r\n") + "\r\n";
}

/**
 * Generate unique ID for event
 */
function generateUID(): string {
  // Generate UUID v4-like ID
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}@deno-calendar`;
}

/**
 * Format date for ICS (all-day events)
 * Format: YYYYMMDD
 */
function formatICSDate(dateStr: string): string {
  // Input: YYYY-MM-DD
  const date = new Date(dateStr + "T00:00:00Z");
  const year = date.getUTCFullYear().toString();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Format datetime for ICS (timed events)
 * Format: YYYYMMDDTHHMMSSZ (UTC)
 */
function formatICSDateTime(date: Date): string {
  const year = date.getUTCFullYear().toString();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  const hour = date.getUTCHours().toString().padStart(2, "0");
  const minute = date.getUTCMinutes().toString().padStart(2, "0");
  const second = date.getUTCSeconds().toString().padStart(2, "0");
  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

/**
 * Escape special characters in ICS values
 */
function escapeICSValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\") // Backslash
    .replace(/;/g, "\\;") // Semicolon
    .replace(/,/g, "\\,") // Comma
    .replace(/\n/g, "\\n"); // Newline
}

/**
 * Generate RRULE string from recurrence object
 */
function generateRRule(recurrence: CalendarEventInput["recurrence"]): string {
  if (!recurrence) return "";

  const parts = [`FREQ=${recurrence.frequency}`];

  if (recurrence.interval && recurrence.interval > 1) {
    parts.push(`INTERVAL=${recurrence.interval}`);
  }

  if (recurrence.byDay && recurrence.byDay.length > 0) {
    parts.push(`BYDAY=${recurrence.byDay.join(",")}`);
  }

  if (recurrence.until) {
    // Format UNTIL date
    const untilDate = new Date(recurrence.until);
    const until = formatICSDateTime(untilDate);
    parts.push(`UNTIL=${until}`);
  }

  return parts.join(";");
}
