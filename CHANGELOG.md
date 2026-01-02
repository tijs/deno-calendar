# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Google Calendar API client with OAuth 2.0 (v2.0.0)
- Unified client abstraction for multi-provider usage (v2.0.0)
- Full VTIMEZONE support for event creation (v0.4.0)

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

[Unreleased]: https://github.com/tijs/deno-calendar/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/tijs/deno-calendar/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/tijs/deno-calendar/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/tijs/deno-calendar/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/tijs/deno-calendar/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tijs/deno-calendar/releases/tag/v0.1.0
