/**
 * Google Calendar API Mapper
 * Maps between Google Calendar JSON and our CalendarEvent types
 */

import type { CalendarEvent, CalendarEventInput, RecurrenceRule } from "../types.ts";
import type { GoogleEvent, GoogleEventDateTime } from "./types.ts";

/**
 * Map Google Event to CalendarEvent
 */
export function mapGoogleEventToCalendarEvent(
  googleEvent: GoogleEvent,
  calendarName: string,
  userEmail?: string,
): CalendarEvent {
  const { start, end } = parseGoogleDateTime(
    googleEvent.start,
    googleEvent.end,
  );
  const isAllDay = !!googleEvent.start.date;

  // Extract user's attendance status if available
  let attendanceStatus:
    | "accepted"
    | "declined"
    | "tentative"
    | "needs_action"
    | undefined;

  if (userEmail && googleEvent.attendees) {
    const userAttendee = googleEvent.attendees.find((attendee) =>
      attendee.email.toLowerCase() === userEmail.toLowerCase()
    );

    if (userAttendee?.responseStatus) {
      // Map Google's camelCase to our snake_case
      attendanceStatus = userAttendee.responseStatus === "needsAction"
        ? "needs_action"
        : userAttendee.responseStatus;
    }
  }

  return {
    calendar: calendarName,
    summary: googleEvent.summary || "",
    start,
    end,
    location: googleEvent.location || null,
    description: googleEvent.description || null,
    uid: googleEvent.id!,
    all_day: isAllDay,
    timezone: googleEvent.start.timeZone,
    etag: googleEvent.etag,
    attendance_status: attendanceStatus,
  };
}

/**
 * Map CalendarEventInput to Google Event
 */
export function mapCalendarEventToGoogleEvent(
  event: CalendarEventInput,
): GoogleEvent {
  const isAllDay = event.start.length === 10 && event.end.length === 10;

  const googleEvent: GoogleEvent = {
    summary: event.summary,
    start: isAllDay ? { date: event.start } : {
      dateTime: event.start,
      timeZone: event.timezone,
    },
    end: isAllDay ? { date: event.end } : {
      dateTime: event.end,
      timeZone: event.timezone,
    },
  };

  if (event.location) {
    googleEvent.location = event.location;
  }

  if (event.description) {
    googleEvent.description = event.description;
  }

  if (event.recurrence) {
    googleEvent.recurrence = mapRecurrenceToRRule(event.recurrence);
  }

  return googleEvent;
}

/**
 * Parse Google DateTime to ISO strings
 */
function parseGoogleDateTime(
  start: GoogleEventDateTime,
  end: GoogleEventDateTime,
): { start: string; end: string } {
  // All-day event
  if (start.date && end.date) {
    return {
      start: start.date,
      end: end.date,
    };
  }

  // Timed event
  return {
    start: start.dateTime || "",
    end: end.dateTime || "",
  };
}

/**
 * Map RecurrenceRule to RRULE string array
 */
function mapRecurrenceToRRule(recurrence: RecurrenceRule): string[] {
  const parts = [`FREQ=${recurrence.frequency}`];

  if (recurrence.interval && recurrence.interval > 1) {
    parts.push(`INTERVAL=${recurrence.interval}`);
  }

  if (recurrence.byDay && recurrence.byDay.length > 0) {
    parts.push(`BYDAY=${recurrence.byDay.join(",")}`);
  }

  if (recurrence.until) {
    // Convert to YYYYMMDD format for UNTIL
    const untilDate = new Date(recurrence.until);
    const year = untilDate.getUTCFullYear();
    const month = (untilDate.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = untilDate.getUTCDate().toString().padStart(2, "0");
    parts.push(`UNTIL=${year}${month}${day}`);
  }

  return [`RRULE:${parts.join(";")}`];
}

/**
 * Parse RRULE string array to RecurrenceRule
 */
export function parseRRuleToRecurrence(
  rruleStrings?: string[],
): RecurrenceRule | undefined {
  if (!rruleStrings || rruleStrings.length === 0) {
    return undefined;
  }

  // Find RRULE line
  const rruleLine = rruleStrings.find((line) => line.startsWith("RRULE:"));
  if (!rruleLine) {
    return undefined;
  }

  // Parse RRULE components
  const rruleContent = rruleLine.substring(6); // Remove "RRULE:"
  const parts = rruleContent.split(";");

  const recurrence: RecurrenceRule = {
    frequency: "DAILY" as RecurrenceRule["frequency"],
  };

  for (const part of parts) {
    const [key, value] = part.split("=");

    switch (key) {
      case "FREQ":
        recurrence.frequency = value as RecurrenceRule["frequency"];
        break;
      case "INTERVAL":
        recurrence.interval = parseInt(value, 10);
        break;
      case "BYDAY":
        recurrence.byDay = value.split(",");
        break;
      case "UNTIL": {
        // Parse YYYYMMDD to ISO date
        const year = value.substring(0, 4);
        const month = value.substring(4, 6);
        const day = value.substring(6, 8);
        recurrence.until = `${year}-${month}-${day}`;
        break;
      }
    }
  }

  return recurrence;
}
