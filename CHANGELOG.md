# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Unified client abstraction for multi-provider usage (v2.0.0)
- Microsoft Outlook/Office 365 support via Microsoft Graph API (v2.0.0)

## [1.3.0] - 2026-01-14

### Added

- **Recurring event original date tracking** - CalendarEvent now includes `originalStart` and
  `isRecurring` fields
  - `originalStart` preserves the base date before recurrence adjustment
  - `isRecurring` flag indicates if the event has a recurrence rule
  - Enables reliable event lookup by original creation date for update/delete operations

### Fixed

- Calendar update/delete can now find recurring events by their original start date, not just the
  next occurrence date

## [1.2.0] - 2026-01-11

### Added

- **Google Service Account authentication** - Alternative to OAuth for server-to-server access
  - `ServiceAccountCredentials` interface for JSON key file contents
  - `GoogleCalendarServiceAccountConfig` for service account configuration
  - `getServiceAccountAccessToken()` for obtaining access tokens from service account
  - `loadServiceAccountCredentials()` to load credentials from file
  - `parseServiceAccountCredentials()` to parse credentials from string or object
  - JWT-based authentication with RS256 signing
  - Automatic token caching with refresh before expiry
  - Support for domain-wide delegation via `subject` parameter
- `GOOGLE_CALENDAR_SCOPES` constant object for calendar API scopes
- Comprehensive service account test suite (9 new tests)

### Changed

- `GoogleCalendarClientConfig` is now a union type accepting either OAuth or service account config
- `GoogleCalendarClient` constructor accepts both OAuth config (with `accessToken`) or service
  account config (with `serviceAccountCredentials`)
- Request authentication now uses async `getToken()` method for both auth types

### Benefits

- Service accounts don't require user OAuth consent or token refresh handling
- Credentials from JSON key file never expire (until revoked)
- Ideal for server-to-server calendar access (e.g., ROCI agent)
- No more token expiration issues with long-running services
- Backward compatible - existing OAuth code continues to work unchanged

## [1.1.0] - 2026-01-02

### Added

- **Attendance status tracking** - Google Calendar events now include user's response status
  - `attendance_status` field added to CalendarEvent interface
  - Values: "accepted", "declined", "tentative", "needs_action", or undefined
  - GoogleCalendarClient now accepts optional `userEmail` to extract attendance from attendees list
  - Enables filtering/annotating events based on user's attendance response
  - Particularly useful for identifying declined meetings that won't be attended

### Changed

- GoogleCalendarClientConfig interface expanded with optional `userEmail?: string` field
- mapGoogleEventToCalendarEvent() now accepts optional `userEmail` parameter
- Attendance status automatically extracted by matching user's email in attendees list

### Benefits

- Users can see at a glance which meetings they've declined
- Enables smarter calendar filtering (show only accepted meetings)
- Reduces confusion about which events actually need attention

## [1.0.0] - 2026-01-02

### Added

- **Google Calendar support** - Full REST API client with OAuth 2.0
  - GoogleCalendarClient with CRUD operations (create, read, update, delete)
  - OAuth 2.0 helper utilities (generateAuthUrl, exchangeCodeForTokens, refreshAccessToken)
  - Automatic token refresh when access token expires
  - Full mapping between Google Calendar JSON and CalendarEvent types
  - Support for recurring events via RRULE
  - Support for all-day events and timezone-aware events
- Google Calendar examples (OAuth flow + CRUD operations)
- Comprehensive Google Calendar test suite (11 new tests, 49 total passing)
- OAuth scopes constants for fine-grained permissions

### Changed

- Updated README to showcase both CalDAV and Google Calendar providers
- Updated provider comparison table to show production status
- Library now truly multi-provider (iCloud + Google Calendar)

### Benefits

- Users can choose between iCloud (CalDAV) and Google Calendar (REST API)
- Same CalendarEvent interface works across both providers
- OAuth 2.0 flow helpers simplify Google Calendar authentication
- Production-ready for both providers

## [0.4.0] - 2026-01-02

### Added

- **VTIMEZONE component generation** - Full RFC 5545 timezone support for ALL IANA timezones
  - `timezone` field added to CalendarEventInput interface
  - Dynamic VTIMEZONE generation using Intl API (supports 500+ IANA timezones)
  - DTSTART/DTEND use TZID parameters when timezone specified
  - No hardcoded timezone data - works with any valid IANA timezone identifier
- Comprehensive timezone test suite (16 new test cases, 38 total passing)
- Timezone utilities: `generateVTIMEZONE()`, `isSupportedTimezone()`, `getSupportedTimezones()`
- DST (Daylight Saving Time) transitions automatically detected with RRULE support

### Changed

- CalendarEventInput interface expanded with optional `timezone?: string` field
- ICS generator now creates VTIMEZONE components when timezone is specified
- DTSTART/DTEND format with TZID parameter instead of UTC when timezone provided
- Backward compatible - events without timezone continue to use UTC format

### Benefits

- Proper timezone handling for calendar events
- Correct display times in user's local timezone
- Full RFC 5545 compliance for VTIMEZONE components
- Fixes timezone display issues in calendar clients

## [0.3.0] - 2026-01-02

### Added

- **BYDAY parameter support** - Enables complex recurring event patterns
  - `byDay` field added to RecurrenceRule interface
  - Supports weekday patterns: ["MO"], ["MO", "WE", "FR"]
  - Supports nth day of month: ["1FR"] (first Friday), ["-1SU"] (last Sunday)
  - Supports multiple patterns: ["2TU", "3TH"] (second Tuesday and third Thursday)
- Comprehensive RRULE test suite (13 new test cases)
- Updated caldav-write.ts example with BYDAY usage patterns

### Changed

- RecurrenceRule interface expanded with optional `byDay?: string[]` field
- ICS generator now includes BYDAY in RRULE when specified
- Backward compatible - existing code without BYDAY continues to work

### Benefits

- Enables "every Monday" type recurring events
- Fixes calendar specialist agent date calculations
- Full RFC 5545 BYDAY compliance for CalDAV

## [0.2.2] - 2026-01-02

### Fixed

- **Critical: UID preservation for updates** - Fixed updateEvent() creating duplicates instead of
  updating existing events
- generateICS() now accepts optional `uid` parameter to preserve UID when updating
- Added `uid` field to CalendarEventInput interface
- Fixes issue where updates would generate new UID and create duplicate events in CalDAV

## [0.2.1] - 2026-01-02

### Fixed

- **ETag extraction**: Fixed updateEvent() ETag conflicts by properly parsing ETags from REPORT
  responses
- Added `etag` field to CalendarEvent interface for optimistic concurrency control
- Events now include their ETag when fetched, eliminating "Event was modified by another client"
  errors

## [0.2.0] - 2026-01-02

### Added

- Basic timezone configuration support
- `timezone` config option for CalDAVClient (IANA timezone identifier)
- `timezone` property on CalendarEvent to preserve TZID from ICS data
- `extractTimezone()` function to parse TZID parameter from ICS
- Test coverage for timezone extraction
- Comprehensive timezone documentation in README

### Changed

- CalendarEvent interface now includes optional `timezone` field
- README updated with timezone handling guide

### Note

- Event writing still uses UTC format (VTIMEZONE generation planned for v1.0.0)
- Timezone config is primarily for reading/preserving timezone information

## [0.1.0] - 2026-01-02

### Added

- CalDAV client with full iCloud support
- Support for recurring events (DAILY, WEEKLY, MONTHLY)
- Event CRUD operations (Create, Read, Update, Delete)
- Comprehensive test suite
- TypeScript types for all APIs
- Examples for common use cases
- CI/CD pipeline with automated JSR publishing

### Security

- Secure credential management
- ETag-based optimistic concurrency control

[Unreleased]: https://github.com/tijs/deno-calendar/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/tijs/deno-calendar/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/tijs/deno-calendar/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/tijs/deno-calendar/compare/v0.4.0...v1.0.0
[0.4.0]: https://github.com/tijs/deno-calendar/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/tijs/deno-calendar/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/tijs/deno-calendar/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/tijs/deno-calendar/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/tijs/deno-calendar/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tijs/deno-calendar/releases/tag/v0.1.0
