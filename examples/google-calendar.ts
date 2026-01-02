/**
 * Example: Google Calendar CRUD operations
 *
 * This example demonstrates reading and writing events with Google Calendar API.
 *
 * Prerequisites:
 * 1. Run google-oauth.ts to obtain access token
 * 2. Set GOOGLE_ACCESS_TOKEN environment variable
 *
 * Usage:
 *   export GOOGLE_ACCESS_TOKEN="your-access-token"
 *   deno run --allow-net --allow-env examples/google-calendar.ts
 */

import { GoogleCalendarClient } from "../src/mod.ts";

const accessToken = Deno.env.get("GOOGLE_ACCESS_TOKEN");
if (!accessToken) {
  console.error("Error: GOOGLE_ACCESS_TOKEN environment variable not set");
  console.error("Run google-oauth.ts first to obtain token");
  Deno.exit(1);
}

const client = new GoogleCalendarClient({ accessToken });

try {
  // List calendars
  console.log("=== Fetching Calendars ===\n");
  const calendars = await client.fetchCalendars();
  console.log(`Found ${calendars.length} calendars:\n`);
  calendars.forEach((cal, i) => {
    console.log(`${i + 1}. ${cal.displayName} (${cal.url})`);
  });

  // Fetch upcoming events
  console.log("\n=== Fetching Upcoming Events (next 7 days) ===\n");
  const events = await client.fetchEvents({ days: 7, calendar: "primary" });
  console.log(`Found ${events.length} events:\n`);
  events.slice(0, 5).forEach((event) => {
    console.log(`- ${event.summary}`);
    console.log(`  ${event.start} → ${event.end}`);
    if (event.location) console.log(`  📍 ${event.location}`);
  });

  // Create a test event
  console.log("\n=== Creating Test Event ===\n");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const endTime = new Date(tomorrow);
  endTime.setHours(15, 0, 0, 0);

  const result1 = await client.createEvent("primary", {
    summary: "Deno Calendar Test (Google)",
    start: tomorrow.toISOString(),
    end: endTime.toISOString(),
    location: "Virtual Meeting",
    description: "Created using deno-calendar with Google Calendar API",
  });

  console.log("✓ Event created successfully!");
  console.log(`  Event ID: ${result1.uid}`);

  // Create recurring event
  console.log("\n=== Creating Recurring Event ===\n");

  const nextMonday = new Date();
  nextMonday.setDate(
    nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7),
  );
  nextMonday.setHours(10, 0, 0, 0);

  const mondayEnd = new Date(nextMonday);
  mondayEnd.setHours(11, 0, 0, 0);

  const result2 = await client.createEvent("primary", {
    summary: "Weekly Standup (Google)",
    start: nextMonday.toISOString(),
    end: mondayEnd.toISOString(),
    description: "Recurring weekly meeting created via deno-calendar",
    recurrence: {
      frequency: "WEEKLY",
      byDay: ["MO"],
    },
  });

  console.log("✓ Recurring event created successfully!");
  console.log(`  Event ID: ${result2.uid}`);

  // Create timezone-aware event
  console.log("\n=== Creating Timezone-Aware Event ===\n");

  const result3 = await client.createEvent("primary", {
    summary: "Team Sync (Europe)",
    start: "2026-01-10T10:00:00",
    end: "2026-01-10T11:00:00",
    timezone: "Europe/Amsterdam",
    description: "Event with specific timezone",
  });

  console.log("✓ Timezone-aware event created successfully!");
  console.log(`  Event ID: ${result3.uid}`);
  console.log(`  Timezone: Europe/Amsterdam`);

  console.log("\n✓ All examples completed! Check your Google Calendar.");
} catch (error) {
  console.error("\n✗ Error:");
  console.error(error instanceof Error ? error.message : "Unknown error");

  if (error instanceof Error && error.message.includes("401")) {
    console.error(
      "\nYour access token may have expired. Run google-oauth.ts again.",
    );
  }
}
