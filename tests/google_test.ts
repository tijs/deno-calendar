/**
 * Google Calendar Client Tests
 * Tests for Google Calendar API integration
 */

import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import {
  mapCalendarEventToGoogleEvent,
  mapGoogleEventToCalendarEvent,
  parseRRuleToRecurrence,
} from "../src/google/mapper.ts";
import { generateAuthUrl } from "../src/google/oauth.ts";
import type { CalendarEventInput } from "../src/types.ts";
import type { GoogleEvent } from "../src/google/types.ts";

// Test OAuth URL generation
Deno.test("Google OAuth - generateAuthUrl creates valid URL", () => {
  const authUrl = generateAuthUrl({
    clientId: "test-client-id",
    clientSecret: "test-secret",
    redirectUri: "http://localhost:3000/callback",
  });

  assertStringIncludes(authUrl, "https://accounts.google.com/o/oauth2/v2/auth");
  assertStringIncludes(authUrl, "client_id=test-client-id");
  assertStringIncludes(authUrl, "redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback");
  assertStringIncludes(authUrl, "response_type=code");
  assertStringIncludes(authUrl, "access_type=offline");
});

// Test mapping CalendarEventInput to GoogleEvent
Deno.test("Mapper - CalendarEventInput to GoogleEvent (basic)", () => {
  const input: CalendarEventInput = {
    summary: "Test Event",
    start: "2026-01-10T14:00:00Z",
    end: "2026-01-10T15:00:00Z",
    location: "Office",
    description: "Test description",
  };

  const googleEvent = mapCalendarEventToGoogleEvent(input);

  assertEquals(googleEvent.summary, "Test Event");
  assertEquals(googleEvent.start.dateTime, "2026-01-10T14:00:00Z");
  assertEquals(googleEvent.end.dateTime, "2026-01-10T15:00:00Z");
  assertEquals(googleEvent.location, "Office");
  assertEquals(googleEvent.description, "Test description");
});

// Test mapping all-day events
Deno.test("Mapper - CalendarEventInput to GoogleEvent (all-day)", () => {
  const input: CalendarEventInput = {
    summary: "All Day Event",
    start: "2026-01-10",
    end: "2026-01-11",
  };

  const googleEvent = mapCalendarEventToGoogleEvent(input);

  assertEquals(googleEvent.start.date, "2026-01-10");
  assertEquals(googleEvent.end.date, "2026-01-11");
  assertEquals(googleEvent.start.dateTime, undefined);
  assertEquals(googleEvent.end.dateTime, undefined);
});

// Test mapping with timezone
Deno.test("Mapper - CalendarEventInput to GoogleEvent (with timezone)", () => {
  const input: CalendarEventInput = {
    summary: "Timezone Event",
    start: "2026-01-10T14:00:00",
    end: "2026-01-10T15:00:00",
    timezone: "Europe/Amsterdam",
  };

  const googleEvent = mapCalendarEventToGoogleEvent(input);

  assertEquals(googleEvent.start.timeZone, "Europe/Amsterdam");
  assertEquals(googleEvent.end.timeZone, "Europe/Amsterdam");
});

// Test mapping with recurrence
Deno.test("Mapper - CalendarEventInput to GoogleEvent (with recurrence)", () => {
  const input: CalendarEventInput = {
    summary: "Weekly Meeting",
    start: "2026-01-10T14:00:00Z",
    end: "2026-01-10T15:00:00Z",
    recurrence: {
      frequency: "WEEKLY",
      byDay: ["MO", "WE", "FR"],
    },
  };

  const googleEvent = mapCalendarEventToGoogleEvent(input);

  assertEquals(googleEvent.recurrence?.length, 1);
  assertEquals(googleEvent.recurrence?.[0], "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR");
});

// Test mapping GoogleEvent to CalendarEvent
Deno.test("Mapper - GoogleEvent to CalendarEvent", () => {
  const googleEvent: GoogleEvent = {
    id: "event123",
    summary: "Test Event",
    description: "Description",
    location: "Office",
    start: {
      dateTime: "2026-01-10T14:00:00Z",
    },
    end: {
      dateTime: "2026-01-10T15:00:00Z",
    },
    etag: "etag123",
  };

  const calEvent = mapGoogleEventToCalendarEvent(googleEvent, "Test Calendar");

  assertEquals(calEvent.uid, "event123");
  assertEquals(calEvent.summary, "Test Event");
  assertEquals(calEvent.start, "2026-01-10T14:00:00Z");
  assertEquals(calEvent.end, "2026-01-10T15:00:00Z");
  assertEquals(calEvent.location, "Office");
  assertEquals(calEvent.description, "Description");
  assertEquals(calEvent.calendar, "Test Calendar");
  assertEquals(calEvent.etag, "etag123");
  assertEquals(calEvent.all_day, false);
});

// Test parsing RRULE to RecurrenceRule
Deno.test("Mapper - parseRRuleToRecurrence (weekly)", () => {
  const rrules = ["RRULE:FREQ=WEEKLY;BYDAY=MO"];
  const recurrence = parseRRuleToRecurrence(rrules);

  assertEquals(recurrence?.frequency, "WEEKLY");
  assertEquals(recurrence?.byDay, ["MO"]);
});

// Test parsing RRULE with interval and until
Deno.test("Mapper - parseRRuleToRecurrence (complex)", () => {
  const rrules = ["RRULE:FREQ=MONTHLY;INTERVAL=2;BYDAY=1FR;UNTIL=20261231"];
  const recurrence = parseRRuleToRecurrence(rrules);

  assertEquals(recurrence?.frequency, "MONTHLY");
  assertEquals(recurrence?.interval, 2);
  assertEquals(recurrence?.byDay, ["1FR"]);
  assertEquals(recurrence?.until, "2026-12-31");
});

// Test parsing empty RRULE
Deno.test("Mapper - parseRRuleToRecurrence (empty)", () => {
  const recurrence = parseRRuleToRecurrence([]);
  assertEquals(recurrence, undefined);
});

// Test GoogleEvent with all-day
Deno.test("Mapper - GoogleEvent to CalendarEvent (all-day)", () => {
  const googleEvent: GoogleEvent = {
    id: "event123",
    summary: "All Day",
    start: {
      date: "2026-01-10",
    },
    end: {
      date: "2026-01-11",
    },
  };

  const calEvent = mapGoogleEventToCalendarEvent(googleEvent, "Calendar");

  assertEquals(calEvent.start, "2026-01-10");
  assertEquals(calEvent.end, "2026-01-11");
  assertEquals(calEvent.all_day, true);
});

// Test GoogleEvent with timezone
Deno.test("Mapper - GoogleEvent to CalendarEvent (with timezone)", () => {
  const googleEvent: GoogleEvent = {
    id: "event123",
    summary: "TZ Event",
    start: {
      dateTime: "2026-01-10T14:00:00",
      timeZone: "America/New_York",
    },
    end: {
      dateTime: "2026-01-10T15:00:00",
      timeZone: "America/New_York",
    },
  };

  const calEvent = mapGoogleEventToCalendarEvent(googleEvent, "Calendar");

  assertEquals(calEvent.timezone, "America/New_York");
});
