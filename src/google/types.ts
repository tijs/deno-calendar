/**
 * Google Calendar API Types
 * Based on Google Calendar API v3
 * Reference: https://developers.google.com/calendar/api/v3/reference
 */

/**
 * Google Calendar event from API
 */
export interface GoogleEvent {
  kind?: string;
  id?: string;
  etag?: string;
  status?: "confirmed" | "tentative" | "cancelled";
  summary?: string;
  description?: string;
  location?: string;
  start: GoogleEventDateTime;
  end: GoogleEventDateTime;
  recurrence?: string[]; // RRULE, EXRULE, RDATE, EXDATE lines
  recurringEventId?: string;
  attendees?: GoogleAttendee[];
  organizer?: GooglePerson;
  reminders?: GoogleReminders;
  colorId?: string;
}

/**
 * Google Calendar event date/time
 */
export interface GoogleEventDateTime {
  date?: string; // yyyy-mm-dd for all-day events
  dateTime?: string; // RFC3339 timestamp for timed events
  timeZone?: string; // IANA timezone
}

/**
 * Google Calendar attendee
 */
export interface GoogleAttendee {
  email: string;
  displayName?: string;
  organizer?: boolean;
  responseStatus?: "needsAction" | "accepted" | "declined" | "tentative";
}

/**
 * Google Calendar person (organizer/creator)
 */
export interface GooglePerson {
  email: string;
  displayName?: string;
  self?: boolean;
}

/**
 * Google Calendar reminders
 */
export interface GoogleReminders {
  useDefault?: boolean;
  overrides?: GoogleReminderOverride[];
}

/**
 * Google Calendar reminder override
 */
export interface GoogleReminderOverride {
  method: "email" | "popup";
  minutes: number;
}

/**
 * Google Calendar list
 */
export interface GoogleCalendar {
  kind?: string;
  id: string;
  summary: string;
  description?: string;
  location?: string;
  timeZone?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: string;
}

/**
 * Google Calendar list response
 */
export interface GoogleCalendarListResponse {
  kind: string;
  etag: string;
  items: GoogleCalendar[];
}

/**
 * Google Calendar events list response
 */
export interface GoogleEventsListResponse {
  kind: string;
  etag: string;
  summary: string;
  items: GoogleEvent[];
  nextPageToken?: string;
}

/**
 * Google OAuth token response
 */
export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}
