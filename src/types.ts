/**
 * Shared types for deno-calendar
 */

/**
 * Calendar event representation
 */
export interface CalendarEvent {
  calendar: string;
  summary: string;
  start: string;
  end: string | null;
  location: string | null;
  description: string | null;
  uid: string;
  all_day?: boolean;
  timezone?: string; // IANA timezone (e.g., "America/Los_Angeles") if present in ICS
}

/**
 * Calendar representation
 */
export interface Calendar {
  url: string;
  displayName: string;
}

/**
 * Calendar provider type
 */
export type CalendarProvider = "icloud" | "google";

/**
 * Recurrence rule
 */
export interface RecurrenceRule {
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  interval?: number;
  until?: string;
}

/**
 * Event input for creation/update
 */
export interface CalendarEventInput {
  summary: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  recurrence?: RecurrenceRule;
}

/**
 * Fetch events options
 */
export interface FetchEventsOptions {
  days?: number;
  calendar?: string | null;
}

/**
 * Result type for created events
 */
export interface CreateEventResult {
  uid: string;
  etag?: string;
}

/**
 * Result type for updated events
 */
export interface UpdateEventResult {
  etag: string;
}
