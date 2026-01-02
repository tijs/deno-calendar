/**
 * RRULE Tests
 * Comprehensive tests for recurrence rule generation with BYDAY parameter
 */

import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { generateICS } from "../src/caldav/ics-generator.ts";
import type { CalendarEventInput } from "../src/types.ts";

Deno.test("RRULE - Weekly with single BYDAY (Monday)", () => {
  const event: CalendarEventInput = {
    summary: "Weekly Monday Meeting",
    start: "2026-01-05T10:00:00Z", // Monday
    end: "2026-01-05T11:00:00Z",
    recurrence: {
      frequency: "WEEKLY",
      byDay: ["MO"],
    },
  };

  const ics = generateICS(event);

  assertStringIncludes(ics, "RRULE:FREQ=WEEKLY;BYDAY=MO");
  assertStringIncludes(ics, "SUMMARY:Weekly Monday Meeting");
});

Deno.test("RRULE - Weekly with multiple BYDAY (Mon/Wed/Fri)", () => {
  const event: CalendarEventInput = {
    summary: "MWF Workout",
    start: "2026-01-05T07:00:00Z",
    end: "2026-01-05T08:00:00Z",
    recurrence: {
      frequency: "WEEKLY",
      byDay: ["MO", "WE", "FR"],
    },
  };

  const ics = generateICS(event);

  assertStringIncludes(ics, "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR");
});

Deno.test("RRULE - Monthly with first Friday", () => {
  const event: CalendarEventInput = {
    summary: "First Friday Happy Hour",
    start: "2026-01-02T17:00:00Z",
    end: "2026-01-02T19:00:00Z",
    recurrence: {
      frequency: "MONTHLY",
      byDay: ["1FR"],
    },
  };

  const ics = generateICS(event);

  assertStringIncludes(ics, "RRULE:FREQ=MONTHLY;BYDAY=1FR");
});

Deno.test("RRULE - Monthly with last Sunday", () => {
  const event: CalendarEventInput = {
    summary: "Last Sunday of Month",
    start: "2026-01-25T14:00:00Z",
    end: "2026-01-25T15:00:00Z",
    recurrence: {
      frequency: "MONTHLY",
      byDay: ["-1SU"],
    },
  };

  const ics = generateICS(event);

  assertStringIncludes(ics, "RRULE:FREQ=MONTHLY;BYDAY=-1SU");
});

Deno.test("RRULE - Weekly with BYDAY and INTERVAL", () => {
  const event: CalendarEventInput = {
    summary: "Bi-weekly Thursday Check-in",
    start: "2026-01-08T15:00:00Z",
    end: "2026-01-08T15:30:00Z",
    recurrence: {
      frequency: "WEEKLY",
      interval: 2,
      byDay: ["TH"],
    },
  };

  const ics = generateICS(event);

  assertStringIncludes(ics, "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TH");
});

Deno.test("RRULE - Weekly with BYDAY and UNTIL", () => {
  const event: CalendarEventInput = {
    summary: "Tuesday Training (Limited Series)",
    start: "2026-01-06T09:00:00Z",
    end: "2026-01-06T10:00:00Z",
    recurrence: {
      frequency: "WEEKLY",
      byDay: ["TU"],
      until: "2026-03-31",
    },
  };

  const ics = generateICS(event);

  assertStringIncludes(ics, "FREQ=WEEKLY");
  assertStringIncludes(ics, "BYDAY=TU");
  assertStringIncludes(ics, "UNTIL=20260331T");
});

Deno.test("RRULE - Weekly with BYDAY, INTERVAL, and UNTIL", () => {
  const event: CalendarEventInput = {
    summary: "Complete RRULE",
    start: "2026-01-05T10:00:00Z",
    end: "2026-01-05T11:00:00Z",
    recurrence: {
      frequency: "WEEKLY",
      interval: 2,
      byDay: ["MO"],
      until: "2026-12-31",
    },
  };

  const ics = generateICS(event);

  // Verify all RRULE components are present
  assertStringIncludes(ics, "FREQ=WEEKLY");
  assertStringIncludes(ics, "INTERVAL=2");
  assertStringIncludes(ics, "BYDAY=MO");
  assertStringIncludes(ics, "UNTIL=20261231T");
});

Deno.test("RRULE - Monthly with second Tuesday and third Thursday", () => {
  const event: CalendarEventInput = {
    summary: "Multiple Monthly Days",
    start: "2026-01-13T14:00:00Z", // Second Tuesday
    end: "2026-01-13T15:00:00Z",
    recurrence: {
      frequency: "MONTHLY",
      byDay: ["2TU", "3TH"],
    },
  };

  const ics = generateICS(event);

  assertStringIncludes(ics, "RRULE:FREQ=MONTHLY;BYDAY=2TU,3TH");
});

Deno.test("RRULE - Weekly without BYDAY (backward compatible)", () => {
  const event: CalendarEventInput = {
    summary: "Simple Weekly Event",
    start: "2026-01-05T10:00:00Z",
    end: "2026-01-05T11:00:00Z",
    recurrence: {
      frequency: "WEEKLY",
    },
  };

  const ics = generateICS(event);

  // Should generate RRULE without BYDAY
  assertStringIncludes(ics, "RRULE:FREQ=WEEKLY");
  assertEquals(ics.includes("BYDAY"), false, "Should not include BYDAY when not specified");
});

Deno.test("RRULE - Daily without BYDAY (backward compatible)", () => {
  const event: CalendarEventInput = {
    summary: "Daily Standup",
    start: "2026-01-05T09:00:00Z",
    end: "2026-01-05T09:15:00Z",
    recurrence: {
      frequency: "DAILY",
    },
  };

  const ics = generateICS(event);

  assertStringIncludes(ics, "RRULE:FREQ=DAILY");
  assertEquals(ics.includes("BYDAY"), false, "Should not include BYDAY for daily events");
});

Deno.test("RRULE - Empty byDay array is ignored", () => {
  const event: CalendarEventInput = {
    summary: "Event with empty byDay",
    start: "2026-01-05T10:00:00Z",
    end: "2026-01-05T11:00:00Z",
    recurrence: {
      frequency: "WEEKLY",
      byDay: [],
    },
  };

  const ics = generateICS(event);

  assertStringIncludes(ics, "RRULE:FREQ=WEEKLY");
  assertEquals(ics.includes("BYDAY"), false, "Should not include BYDAY when array is empty");
});

Deno.test("RRULE - All weekdays", () => {
  const event: CalendarEventInput = {
    summary: "Weekday Event",
    start: "2026-01-05T09:00:00Z",
    end: "2026-01-05T17:00:00Z",
    recurrence: {
      frequency: "WEEKLY",
      byDay: ["MO", "TU", "WE", "TH", "FR"],
    },
  };

  const ics = generateICS(event);

  assertStringIncludes(ics, "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR");
});

Deno.test("RRULE - Weekend only", () => {
  const event: CalendarEventInput = {
    summary: "Weekend Activity",
    start: "2026-01-03T10:00:00Z",
    end: "2026-01-03T12:00:00Z",
    recurrence: {
      frequency: "WEEKLY",
      byDay: ["SA", "SU"],
    },
  };

  const ics = generateICS(event);

  assertStringIncludes(ics, "RRULE:FREQ=WEEKLY;BYDAY=SA,SU");
});
