/**
 * Timezone Tests
 * Comprehensive tests for VTIMEZONE generation and timezone handling
 */

import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { generateICS } from "../src/caldav/ics-generator.ts";
import { parseICS } from "../src/caldav/ics-parser.ts";
import type { CalendarEventInput } from "../src/types.ts";
import {
  generateVTIMEZONE,
  getSupportedTimezones,
  isSupportedTimezone,
} from "../src/utils/timezone.ts";

// Test VTIMEZONE generation for Europe/Amsterdam
Deno.test("VTIMEZONE - Europe/Amsterdam generates correctly", () => {
  const vtimezone = generateVTIMEZONE("Europe/Amsterdam");

  assertEquals(
    vtimezone !== null,
    true,
    "Should generate VTIMEZONE for Europe/Amsterdam",
  );
  assertStringIncludes(vtimezone!, "BEGIN:VTIMEZONE");
  assertStringIncludes(vtimezone!, "TZID:Europe/Amsterdam");
  assertStringIncludes(vtimezone!, "BEGIN:STANDARD");
  assertStringIncludes(vtimezone!, "TZOFFSETTO:+0100");
  assertStringIncludes(vtimezone!, "TZNAME:"); // Has some timezone name
  assertStringIncludes(vtimezone!, "BEGIN:DAYLIGHT");
  assertStringIncludes(vtimezone!, "TZOFFSETTO:+0200");
  assertStringIncludes(vtimezone!, "END:VTIMEZONE");
});

// Test VTIMEZONE generation for America/Los_Angeles
Deno.test("VTIMEZONE - America/Los_Angeles generates correctly", () => {
  const vtimezone = generateVTIMEZONE("America/Los_Angeles");

  assertEquals(vtimezone !== null, true);
  assertStringIncludes(vtimezone!, "TZID:America/Los_Angeles");
  assertStringIncludes(vtimezone!, "TZNAME:PST");
  assertStringIncludes(vtimezone!, "TZNAME:PDT");
  assertStringIncludes(vtimezone!, "TZOFFSETTO:-0800");
  assertStringIncludes(vtimezone!, "TZOFFSETTO:-0700");
});

// Test VTIMEZONE for timezone without DST (Asia/Tokyo)
Deno.test("VTIMEZONE - Asia/Tokyo (no DST) generates correctly", () => {
  const vtimezone = generateVTIMEZONE("Asia/Tokyo");

  assertEquals(vtimezone !== null, true);
  assertStringIncludes(vtimezone!, "TZID:Asia/Tokyo");
  assertStringIncludes(vtimezone!, "BEGIN:STANDARD");
  assertStringIncludes(vtimezone!, "TZOFFSETTO:+0900");
  assertStringIncludes(vtimezone!, "TZNAME:"); // Has some timezone name
  assertEquals(
    vtimezone!.includes("BEGIN:DAYLIGHT"),
    false,
    "Should not have daylight component",
  );
});

// Test unsupported timezone returns null
Deno.test("VTIMEZONE - Unsupported timezone returns null", () => {
  const vtimezone = generateVTIMEZONE("Invalid/Timezone");
  assertEquals(vtimezone, null);
});

// Test event with timezone includes VTIMEZONE component
Deno.test("Event with timezone - Includes VTIMEZONE in ICS", () => {
  const event: CalendarEventInput = {
    summary: "Meeting in Amsterdam",
    start: "2026-01-05T14:00:00",
    end: "2026-01-05T15:00:00",
    timezone: "Europe/Amsterdam",
  };

  const ics = generateICS(event);

  assertStringIncludes(ics, "BEGIN:VTIMEZONE");
  assertStringIncludes(ics, "TZID:Europe/Amsterdam");
  assertStringIncludes(ics, "END:VTIMEZONE");
});

// Test event with timezone uses TZID parameter
Deno.test("Event with timezone - Uses TZID parameter in DTSTART/DTEND", () => {
  const event: CalendarEventInput = {
    summary: "Meeting in LA",
    start: "2026-01-05T10:00:00",
    end: "2026-01-05T11:00:00",
    timezone: "America/Los_Angeles",
  };

  const ics = generateICS(event);

  assertStringIncludes(ics, "DTSTART;TZID=America/Los_Angeles:");
  assertStringIncludes(ics, "DTEND;TZID=America/Los_Angeles:");
  // Check that the VEVENT section uses TZID (not UTC with Z suffix)
  // Extract VEVENT section to avoid matching VTIMEZONE's DTSTART lines
  const veventStart = ics.indexOf("BEGIN:VEVENT");
  const veventEnd = ics.indexOf("END:VEVENT");
  const vevent = ics.substring(veventStart, veventEnd);
  const hasUTCFormat = /DTSTART:\d{8}T\d{6}Z/.test(vevent);
  assertEquals(
    hasUTCFormat,
    false,
    "VEVENT should not use UTC format with Z suffix",
  );
});

// Test event without timezone uses UTC (backward compatible)
Deno.test("Event without timezone - Uses UTC format (backward compatible)", () => {
  const event: CalendarEventInput = {
    summary: "Meeting",
    start: "2026-01-05T10:00:00Z",
    end: "2026-01-05T11:00:00Z",
  };

  const ics = generateICS(event);

  assertStringIncludes(ics, "DTSTART:20260105T100000Z");
  assertStringIncludes(ics, "DTEND:20260105T110000Z");
  assertEquals(
    ics.includes("BEGIN:VTIMEZONE"),
    false,
    "Should not include VTIMEZONE",
  );
  assertEquals(ics.includes("TZID"), false, "Should not use TZID parameter");
});

// Test all-day event does not include VTIMEZONE
Deno.test("All-day event - Does not include VTIMEZONE even with timezone", () => {
  const event: CalendarEventInput = {
    summary: "All Day Event",
    start: "2026-01-05",
    end: "2026-01-06",
    timezone: "Europe/Amsterdam",
  };

  const ics = generateICS(event);

  assertEquals(
    ics.includes("BEGIN:VTIMEZONE"),
    false,
    "All-day events should not have VTIMEZONE",
  );
  assertStringIncludes(ics, "DTSTART;VALUE=DATE:20260105");
  assertStringIncludes(ics, "DTEND;VALUE=DATE:20260106");
});

// Test recurring event with timezone
Deno.test("Recurring event with timezone - Includes both VTIMEZONE and RRULE", () => {
  const event: CalendarEventInput = {
    summary: "Weekly Team Meeting",
    start: "2026-01-05T10:00:00",
    end: "2026-01-05T11:00:00",
    timezone: "America/New_York",
    recurrence: {
      frequency: "WEEKLY",
      byDay: ["MO"],
    },
  };

  const ics = generateICS(event);

  assertStringIncludes(ics, "BEGIN:VTIMEZONE");
  assertStringIncludes(ics, "TZID:America/New_York");
  assertStringIncludes(ics, "DTSTART;TZID=America/New_York:");
  assertStringIncludes(ics, "RRULE:FREQ=WEEKLY;BYDAY=MO");
});

// Test unsupported timezone falls back to UTC
Deno.test("Unsupported timezone - Falls back to UTC", () => {
  const event: CalendarEventInput = {
    summary: "Meeting",
    start: "2026-01-05T10:00:00Z",
    end: "2026-01-05T11:00:00Z",
    timezone: "Invalid/Timezone",
  };

  const ics = generateICS(event);

  assertEquals(
    ics.includes("BEGIN:VTIMEZONE"),
    false,
    "Should not include VTIMEZONE for unsupported timezone",
  );
  assertStringIncludes(
    ics,
    "DTSTART:20260105T100000Z",
    "Should fall back to UTC",
  );
});

// Test round-trip: generate with timezone → parse → verify
Deno.test("Round-trip - Generate with timezone and parse back", () => {
  const originalEvent: CalendarEventInput = {
    summary: "London Meeting",
    start: "2026-01-05T14:00:00",
    end: "2026-01-05T15:00:00",
    timezone: "Europe/London",
    location: "Office",
    description: "Important meeting",
  };

  const ics = generateICS(originalEvent);
  const parsed = parseICS(ics, "Test Calendar");

  assertEquals(parsed !== null, true, "Should parse successfully");
  assertEquals(parsed!.summary, "London Meeting");
  assertEquals(parsed!.timezone, "Europe/London");
  assertEquals(parsed!.location, "Office");
  assertEquals(parsed!.description, "Important meeting");
});

// Test isSupportedTimezone utility
Deno.test("isSupportedTimezone - Returns true for all valid IANA timezones", () => {
  // Test common timezones
  assertEquals(isSupportedTimezone("Europe/Amsterdam"), true);
  assertEquals(isSupportedTimezone("America/Los_Angeles"), true);
  assertEquals(isSupportedTimezone("Asia/Tokyo"), true);

  // Test less common but valid timezones
  assertEquals(isSupportedTimezone("Pacific/Auckland"), true);
  assertEquals(isSupportedTimezone("Africa/Cairo"), true);
  assertEquals(isSupportedTimezone("America/Sao_Paulo"), true);
  assertEquals(isSupportedTimezone("Asia/Kolkata"), true);

  // Test invalid timezone
  assertEquals(isSupportedTimezone("Invalid/Timezone"), false);
});

// Test getSupportedTimezones utility
Deno.test("getSupportedTimezones - Returns list of common timezones", () => {
  const timezones = getSupportedTimezones();

  assertEquals(
    timezones.length > 0,
    true,
    "Should return at least one timezone",
  );
  assertEquals(timezones.includes("Europe/Amsterdam"), true);
  assertEquals(timezones.includes("America/Los_Angeles"), true);
  assertEquals(timezones.includes("Asia/Tokyo"), true);
});

// Test dynamic generation for various timezones
Deno.test("VTIMEZONE - Supports all IANA timezones dynamically", () => {
  const testTimezones = [
    "Pacific/Auckland",
    "Africa/Cairo",
    "America/Sao_Paulo",
    "Asia/Kolkata",
    "Europe/Paris",
    "America/Chicago",
  ];

  for (const tz of testTimezones) {
    const vtimezone = generateVTIMEZONE(tz);
    assertEquals(
      vtimezone !== null,
      true,
      `Should generate VTIMEZONE for ${tz}`,
    );
    assertStringIncludes(vtimezone!, "BEGIN:VTIMEZONE");
    assertStringIncludes(vtimezone!, `TZID:${tz}`);
    assertStringIncludes(vtimezone!, "END:VTIMEZONE");
  }
});

// Test DST transitions with RRULE
Deno.test("VTIMEZONE - DST transitions include RRULE", () => {
  const vtimezone = generateVTIMEZONE("America/New_York");

  assertEquals(vtimezone !== null, true);
  // Check that RRULE is present for both transitions (exact pattern may vary by year)
  const rruleCount = (vtimezone!.match(/RRULE:FREQ=YEARLY/g) || []).length;
  assertEquals(
    rruleCount,
    2,
    "Should have RRULE for both standard and daylight transitions",
  );
  assertStringIncludes(vtimezone!, "BYMONTH="); // Has month specification
  assertStringIncludes(vtimezone!, "BYDAY="); // Has day specification
});

// Test VTIMEZONE component order (should be after PRODID, before VEVENT)
Deno.test("VTIMEZONE - Correct position in ICS structure", () => {
  const event: CalendarEventInput = {
    summary: "Test Event",
    start: "2026-01-05T10:00:00",
    end: "2026-01-05T11:00:00",
    timezone: "Europe/Amsterdam",
  };

  const ics = generateICS(event);
  const lines = ics.split("\r\n");

  const prodidIndex = lines.findIndex((line) => line.startsWith("PRODID:"));
  const vtimezoneIndex = lines.findIndex((line) => line === "BEGIN:VTIMEZONE");
  const veventIndex = lines.findIndex((line) => line === "BEGIN:VEVENT");

  assertEquals(prodidIndex > -1, true, "Should have PRODID");
  assertEquals(
    vtimezoneIndex > prodidIndex,
    true,
    "VTIMEZONE should be after PRODID",
  );
  assertEquals(
    veventIndex > vtimezoneIndex,
    true,
    "VEVENT should be after VTIMEZONE",
  );
});
