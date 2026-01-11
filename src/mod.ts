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

// Export ICS generator utilities (for advanced usage)
export { generateICS } from "./caldav/ics-generator.ts";

// Export Google Calendar client
export { GOOGLE_CALENDAR_SCOPES, GoogleCalendarClient } from "./google/client.ts";
export type {
  GoogleCalendarClientConfig,
  GoogleCalendarOAuthConfig,
  GoogleCalendarServiceAccountConfig,
} from "./google/client.ts";

// Export Google Service Account helpers
export {
  getAccessToken as getServiceAccountAccessToken,
  loadServiceAccountCredentials,
  parseServiceAccountCredentials,
} from "./google/service-account.ts";
export type { ServiceAccountConfig, ServiceAccountCredentials } from "./google/service-account.ts";

// Export Google OAuth helpers
export {
  CALENDAR_SCOPES,
  exchangeCodeForTokens,
  generateAuthUrl,
  refreshAccessToken,
  revokeToken,
} from "./google/oauth.ts";
export type { GoogleOAuthConfig } from "./google/oauth.ts";

// TODO: Export unified client when implemented
// export { UnifiedCalendarClient } from "./unified-client.ts";
