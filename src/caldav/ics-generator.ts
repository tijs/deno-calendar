/**
 * ICS Generator
 * Generates iCalendar (RFC 5545) format for event creation/update
 */

import type { CalendarEventInput } from "../types.ts";
import { generateVTIMEZONE } from "../utils/timezone.ts";

/**
 * Generate ICS format from event object
 */
export function generateICS(event: CalendarEventInput): string {
  // Use provided UID (for updates) or generate new one (for creates)
  const uid = event.uid || generateUID();
  const dtstamp = formatICSDateTime(new Date());

  // Determine if this is an all-day event
  const isAllDay = event.start.length === 10 && event.end.length === 10;

  // Build ICS content
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Deno Calendar//CalDAV Client//EN",
  ];

  // Add VTIMEZONE component if timezone is specified
  if (event.timezone && !isAllDay) {
    const vtimezone = generateVTIMEZONE(event.timezone);
    if (vtimezone) {
      ics.push(vtimezone);
    }
  }

  ics.push("BEGIN:VEVENT");
  ics.push(`UID:${uid}`);
  ics.push(`DTSTAMP:${dtstamp}`);

  // Format dates based on timezone
  if (isAllDay) {
    ics.push(`DTSTART;VALUE=DATE:${formatICSDate(event.start)}`);
    ics.push(`DTEND;VALUE=DATE:${formatICSDate(event.end)}`);
  } else if (event.timezone) {
    // Use TZID parameter for timezone-aware events
    const vtimezone = generateVTIMEZONE(event.timezone);
    if (vtimezone) {
      ics.push(`DTSTART;TZID=${event.timezone}:${formatICSDateTimeLocal(new Date(event.start))}`);
      ics.push(`DTEND;TZID=${event.timezone}:${formatICSDateTimeLocal(new Date(event.end))}`);
    } else {
      // Fallback to UTC if timezone not supported
      ics.push(`DTSTART:${formatICSDateTime(new Date(event.start))}`);
      ics.push(`DTEND:${formatICSDateTime(new Date(event.end))}`);
    }
  } else {
    // Default to UTC
    ics.push(`DTSTART:${formatICSDateTime(new Date(event.start))}`);
    ics.push(`DTEND:${formatICSDateTime(new Date(event.end))}`);
  }

  ics.push(`SUMMARY:${escapeICSValue(event.summary)}`);

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
 * Format datetime for ICS (local time with TZID)
 * Format: YYYYMMDDTHHMMSS (no Z suffix)
 */
function formatICSDateTimeLocal(date: Date): string {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");
  const second = date.getSeconds().toString().padStart(2, "0");
  return `${year}${month}${day}T${hour}${minute}${second}`;
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
