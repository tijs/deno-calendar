/**
 * Basic smoke tests for deno-calendar exports
 */
import { assertEquals } from "jsr:@std/assert@1";
import { CalDAVClient, generateICS, parseICS } from "../src/mod.ts";

Deno.test("CalDAVClient exports correctly", () => {
  assertEquals(typeof CalDAVClient, "function");
});

Deno.test("generateICS exports correctly", () => {
  assertEquals(typeof generateICS, "function");
});

Deno.test("parseICS exports correctly", () => {
  assertEquals(typeof parseICS, "function");
});

Deno.test("generateICS creates valid VCALENDAR", () => {
  const ics = generateICS({
    summary: "Test Event",
    start: "2025-01-10T14:00:00Z",
    end: "2025-01-10T15:00:00Z",
    description: "Test description",
    location: "Test location",
  });

  // Check structure
  assertEquals(ics.includes("BEGIN:VCALENDAR"), true);
  assertEquals(ics.includes("VERSION:2.0"), true);
  assertEquals(ics.includes("BEGIN:VEVENT"), true);
  assertEquals(ics.includes("SUMMARY:Test Event"), true);
  assertEquals(ics.includes("DESCRIPTION:Test description"), true);
  assertEquals(ics.includes("LOCATION:Test location"), true);
  assertEquals(ics.includes("END:VEVENT"), true);
  assertEquals(ics.includes("END:VCALENDAR"), true);
});

Deno.test("generateICS handles all-day events", () => {
  const ics = generateICS({
    summary: "All Day Event",
    start: "2025-01-10",
    end: "2025-01-11",
  });

  // All-day events should use VALUE=DATE
  assertEquals(ics.includes("DTSTART;VALUE=DATE:20250110"), true);
  assertEquals(ics.includes("DTEND;VALUE=DATE:20250111"), true);
});

Deno.test("generateICS handles recurring events", () => {
  const ics = generateICS({
    summary: "Weekly Meeting",
    start: "2025-01-10T14:00:00Z",
    end: "2025-01-10T15:00:00Z",
    recurrence: {
      frequency: "WEEKLY",
      interval: 2,
      until: "2025-03-31T00:00:00Z",
    },
  });

  // INTERVAL=1 is optional (default), so we use interval=2 to test it appears
  // UNTIL should be formatted as DATE-TIME when provided
  assertEquals(ics.includes("RRULE:FREQ=WEEKLY;INTERVAL=2;UNTIL=20250331T000000Z"), true);
});

Deno.test("parseICS parses basic event", () => {
  const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:test-123
DTSTART:20250110T140000Z
DTEND:20250110T150000Z
SUMMARY:Test Event
LOCATION:Test Location
DESCRIPTION:Test Description
END:VEVENT
END:VCALENDAR`;

  const event = parseICS(icsData, "Test Calendar");

  assertEquals(event?.summary, "Test Event");
  assertEquals(event?.location, "Test Location");
  assertEquals(event?.description, "Test Description");
  assertEquals(event?.calendar, "Test Calendar");
  assertEquals(event?.uid, "test-123");
});

Deno.test("parseICS handles all-day events", () => {
  const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:test-allday
DTSTART;VALUE=DATE:20250110
DTEND;VALUE=DATE:20250111
SUMMARY:All Day Event
END:VEVENT
END:VCALENDAR`;

  const event = parseICS(icsData, "Test Calendar");

  assertEquals(event?.summary, "All Day Event");
  assertEquals(event?.all_day, true);
  assertEquals(event?.start, "2025-01-10");
});
