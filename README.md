# Deno Calendar

> Multi-provider calendar client for Deno with CalDAV and Google Calendar support

[![JSR](https://jsr.io/badges/@tijs/deno-calendar)](https://jsr.io/@tijs/deno-calendar)
[![CI](https://github.com/tijs/deno-calendar/workflows/CI/badge.svg)](https://github.com/tijs/deno-calendar/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- 🦕 **Deno-native** - No npm dependencies, uses native fetch
- 📅 **Multi-provider** - iCloud (CalDAV) + Google Calendar (REST API)
- ✍️ **Full CRUD** - Read, create, update, delete events
- 🔄 **Recurring events** - DAILY, WEEKLY, MONTHLY with RRULE support
- 🔐 **Secure** - OAuth 2.0 for Google, app-specific passwords for iCloud
- 🎯 **Type-safe** - Full TypeScript support
- 🧪 **Well-tested** - Comprehensive test suite

## Quick Start

### Installation

```bash
deno add @tijs/deno-calendar
```

### Read Events (iCloud)

```typescript
import { CalDAVClient } from "@tijs/deno-calendar";

const client = new CalDAVClient({
  appleId: "user@icloud.com",
  appPassword: "xxxx-xxxx-xxxx-xxxx",
  timezone: "America/Los_Angeles", // Optional: default timezone
});

const events = await client.fetchEvents(7); // Next 7 days
console.log(events);
// Events with TZID will have timezone property set
```

### Create Event (Google Calendar)

```typescript
import { GoogleCalendarClient } from "@tijs/deno-calendar";

const client = new GoogleCalendarClient({
  refreshToken: "...",
  clientId: "...",
  clientSecret: "...",
});

await client.createEvent("primary", {
  summary: "Team Meeting",
  start: "2025-01-10T14:00:00Z",
  end: "2025-01-10T15:00:00Z",
  location: "Conference Room A",
});
```

### Unified Client (Multi-Provider)

```typescript
import { UnifiedCalendarClient } from "@tijs/deno-calendar";

const client = UnifiedCalendarClient.create("icloud", {
  appleId: "user@icloud.com",
  appPassword: "...",
});

// Same API for both providers
const events = await client.fetchEvents({ days: 7 });
await client.createEvent("Work", eventData);
```

## Timezone Handling

### Reading Events

When reading events, the library preserves timezone information from the ICS data:

```typescript
const events = await client.fetchEvents(7);

for (const event of events) {
  console.log(event.summary);
  console.log(event.start); // ISO string (e.g., "2025-01-10T14:00:00")
  console.log(event.timezone); // IANA timezone if present (e.g., "America/Los_Angeles")
}
```

- **UTC events**: `start` ends with `Z` (e.g., `"2025-01-10T14:00:00Z"`)
- **Local time with TZID**: `timezone` field contains IANA identifier
- **Local time without TZID**: No `timezone` field (interpret as configured timezone or UTC)

### Writing Events

Currently, all events are written in UTC format. Provide times as ISO strings:

```typescript
await client.createEvent(calendarUrl, {
  summary: "Team Meeting",
  start: "2025-01-10T22:00:00Z", // UTC
  end: "2025-01-10T23:00:00Z",
});
```

**Note**: Full timezone support with VTIMEZONE components is planned for v1.0.0.

## Documentation

- [CalDAV Setup](docs/caldav.md) - iCloud configuration
- [Google Calendar Setup](docs/google-calendar.md) - OAuth 2.0 guide
- [API Reference](https://jsr.io/@tijs/deno-calendar/doc)
- [Examples](examples/)

## Supported Providers

| Provider        | Protocol   | Read | Write | Recurring Events |
| --------------- | ---------- | ---- | ----- | ---------------- |
| iCloud          | CalDAV     | ✅   | ✅    | ✅               |
| Google Calendar | REST API   | ✅   | ✅    | ✅               |
| Outlook         | ⏳ Planned |      |       |                  |

## Development

```bash
# Run tests
deno task test

# Run tests with coverage
deno task test:coverage

# Format code
deno task fmt

# Lint code
deno task lint

# Type check
deno task check
```

## Contributing

Contributions welcome! See [CONTRIBUTING.md](docs/contributing.md)

## License

MIT © [Tijs Teulings](https://github.com/tijs)

## Acknowledgments

Built with inspiration from:

- [tsdav](https://github.com/natelindev/tsdav) - Node.js CalDAV client
- [RFC 4791](https://www.ietf.org/rfc/rfc4791.txt) - CalDAV specification
