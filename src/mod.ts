/**
 * Deno Calendar
 * Multi-provider calendar client for Deno with CalDAV and Google Calendar support
 *
 * @module
 */

// Export types
export type {
  Calendar,
  CalendarEvent,
  CalendarEventInput,
  CalendarProvider,
  CreateEventResult,
  FetchEventsOptions,
  RecurrenceRule,
  UpdateEventResult,
} from "./types.ts";

// Export CalDAV client
export { CalDAVClient } from "./caldav/client.ts";
export type { CalDAVClientConfig } from "./caldav/client.ts";

// Export ICS parser utilities (for advanced usage)
export { extractICSField, parseICS, parseICSDate } from "./caldav/ics-parser.ts";

// TODO: Export Google Calendar client when implemented
// export { GoogleCalendarClient } from "./google/client.ts";
// export type { GoogleCalendarClientConfig } from "./google/client.ts";

// TODO: Export unified client when implemented
// export { UnifiedCalendarClient } from "./unified-client.ts";
