/**
 * ICS Parser
 * Parses iCalendar (RFC 5545) format
 */

import type { CalendarEvent } from "../types.ts";

/**
 * Parse ICS data into structured event
 */
export function parseICS(
  icsData: string,
  calendarName: string,
): CalendarEvent | null {
  try {
    const summary = extractICSField(icsData, "SUMMARY") || "Untitled";
    const rrule = extractICSField(icsData, "RRULE");

    const event: CalendarEvent = {
      calendar: calendarName,
      summary,
      start: parseICSDate(extractICSField(icsData, "DTSTART")),
      end: parseICSDate(extractICSField(icsData, "DTEND")),
      location: extractICSField(icsData, "LOCATION") || null,
      description: extractICSField(icsData, "DESCRIPTION") || null,
      uid: extractICSField(icsData, "UID") || "",
    };

    // Skip events without valid start time
    if (!event.start) return null;

    // Detect all-day events (date without time)
    event.all_day = event.start.length === 10; // YYYY-MM-DD format

    // Handle recurring events
    if (rrule) {
      const nextOccurrence = calculateNextOccurrence(event.start, rrule);
      if (nextOccurrence) {
        event.start = nextOccurrence;
        // Adjust end time if it exists
        if (event.end) {
          const duration = calculateDuration(
            extractICSField(icsData, "DTSTART"),
            extractICSField(icsData, "DTEND"),
          );
          event.end = addDuration(nextOccurrence, duration);
        }
      }
    }

    return event;
  } catch (error) {
    console.warn(
      "[ICSParser] Parse error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return null;
  }
}

/**
 * Extract field from ICS data
 */
export function extractICSField(icsData: string, field: string): string | null {
  const lines = icsData.split(/\r?\n/);

  for (const line of lines) {
    if (line.startsWith(field + ":") || line.startsWith(field + ";")) {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;

      let value = line.substring(colonIndex + 1);

      // Unescape ICS values
      value = value
        .replace(/\\n/g, "\n")
        .replace(/\\,/g, ",")
        .replace(/\\\\/g, "\\")
        .trim();

      return value;
    }
  }
  return null;
}

/**
 * Parse ICS date format to ISO string
 */
export function parseICSDate(dateStr: string | null): string {
  if (!dateStr) return "";

  // Remove any timezone parameters that might be prepended
  const cleanDate = dateStr.replace(/^[^0-9]*/, "");

  if (cleanDate.length === 8) {
    // All-day event: YYYYMMDD
    const year = cleanDate.slice(0, 4);
    const month = cleanDate.slice(4, 6);
    const day = cleanDate.slice(6, 8);
    return `${year}-${month}-${day}`;
  }

  if (cleanDate.length >= 15) {
    // YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
    const year = cleanDate.slice(0, 4);
    const month = cleanDate.slice(4, 6);
    const day = cleanDate.slice(6, 8);
    const hour = cleanDate.slice(9, 11);
    const minute = cleanDate.slice(11, 13);
    const second = cleanDate.slice(13, 15);

    const isUTC = cleanDate.endsWith("Z");

    if (isUTC) {
      return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    }
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }

  return "";
}

/**
 * Calculate next occurrence of a recurring event
 */
function calculateNextOccurrence(
  originalStart: string,
  rrule: string,
): string | null {
  try {
    const now = new Date();
    const startDate = new Date(originalStart);

    // Parse RRULE
    const rules = rrule.split(";").reduce((acc, rule) => {
      const [key, value] = rule.split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const freq = rules["FREQ"];
    const interval = parseInt(rules["INTERVAL"] || "1");
    const until = rules["UNTIL"] ? new Date(rules["UNTIL"]) : null;

    // If event is in the future, return it as-is
    if (startDate > now) {
      return originalStart;
    }

    // Calculate next occurrence based on frequency
    let nextDate = new Date(startDate);

    switch (freq) {
      case "WEEKLY": {
        const dayDiff = Math.ceil(
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        const weeksPassed = Math.floor(dayDiff / 7);
        const weeksToAdd = Math.ceil(weeksPassed / interval) * interval;
        nextDate = new Date(
          startDate.getTime() + weeksToAdd * 7 * 24 * 60 * 60 * 1000,
        );

        // If that's still in the past, add another interval
        if (nextDate <= now) {
          nextDate = new Date(
            nextDate.getTime() + interval * 7 * 24 * 60 * 60 * 1000,
          );
        }
        break;
      }
      case "DAILY": {
        const daysDiff = Math.ceil(
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        const daysToAdd = Math.ceil(daysDiff / interval) * interval;
        nextDate = new Date(
          startDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000,
        );

        if (nextDate <= now) {
          nextDate = new Date(
            nextDate.getTime() + interval * 24 * 60 * 60 * 1000,
          );
        }
        break;
      }
      case "MONTHLY": {
        const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 +
          (now.getMonth() - startDate.getMonth());
        const monthsToAdd = Math.ceil(monthsDiff / interval) * interval;
        nextDate = new Date(startDate);
        nextDate.setMonth(startDate.getMonth() + monthsToAdd);

        if (nextDate <= now) {
          nextDate.setMonth(nextDate.getMonth() + interval);
        }
        break;
      }
      default:
        return originalStart; // Unknown frequency, return original
    }

    // Check if beyond UNTIL date
    if (until && nextDate > until) {
      return null; // Series has ended
    }

    // Convert back to ISO format
    if (originalStart.length === 10) {
      // All-day event
      return nextDate.toISOString().split("T")[0];
    } else {
      return nextDate.toISOString();
    }
  } catch (error) {
    console.warn("[ICSParser] RRULE parsing error:", error);
    return originalStart; // Fall back to original start
  }
}

/**
 * Calculate duration between two ICS dates (in milliseconds)
 */
function calculateDuration(
  dtstart: string | null,
  dtend: string | null,
): number {
  if (!dtstart || !dtend) return 0;

  const start = new Date(parseICSDate(dtstart));
  const end = new Date(parseICSDate(dtend));

  return end.getTime() - start.getTime();
}

/**
 * Add duration (in milliseconds) to a date string
 */
function addDuration(dateStr: string, durationMs: number): string {
  const date = new Date(dateStr);
  date.setTime(date.getTime() + durationMs);

  if (dateStr.length === 10) {
    // All-day event
    return date.toISOString().split("T")[0];
  } else {
    return date.toISOString();
  }
}
