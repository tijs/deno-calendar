/**
 * Example: Create an event in iCloud calendar using CalDAV
 *
 * Usage:
 *   export ICLOUD_APPLE_ID="your-apple-id@icloud.com"
 *   export ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx"
 *   deno run --allow-net --allow-env examples/caldav-write.ts
 */

import { CalDAVClient } from "../src/mod.ts";

const client = new CalDAVClient({
  appleId: Deno.env.get("ICLOUD_APPLE_ID")!,
  appPassword: Deno.env.get("ICLOUD_APP_PASSWORD")!,
});

// First, get list of calendars
console.log("Fetching calendars...");
const calendars = await client.fetchCalendars();
console.log(`Found ${calendars.length} calendars:\n`);
calendars.forEach((cal, i) => {
  console.log(`${i + 1}. ${cal.displayName}`);
});

// Use the first calendar
const calendar = calendars[0];
console.log(`\nCreating event in "${calendar.displayName}"...`);

// Create a test event for tomorrow
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(14, 0, 0, 0); // 2 PM

const endTime = new Date(tomorrow);
endTime.setHours(15, 0, 0, 0); // 3 PM

try {
  // Example 1: Simple one-time event
  const result1 = await client.createEvent(calendar.url, {
    summary: "Deno Calendar Test Event",
    start: tomorrow.toISOString(),
    end: endTime.toISOString(),
    location: "Conference Room A",
    description: "This event was created using deno-calendar library!",
  });

  console.log("\n✓ Event 1 created successfully!");
  console.log(`  UID: ${result1.uid}`);
  console.log(`  Type: One-time event`);

  // Example 2: Recurring event - Every Monday
  const nextMonday = new Date();
  nextMonday.setDate(
    nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7),
  );
  nextMonday.setHours(10, 0, 0, 0); // 10 AM

  const mondayEnd = new Date(nextMonday);
  mondayEnd.setHours(11, 0, 0, 0); // 11 AM

  const result2 = await client.createEvent(calendar.url, {
    summary: "Weekly Team Meeting",
    start: nextMonday.toISOString(),
    end: mondayEnd.toISOString(),
    location: "Zoom",
    description: "Recurring weekly team sync",
    recurrence: {
      frequency: "WEEKLY",
      byDay: ["MO"],
    },
  });

  console.log("\n✓ Event 2 created successfully!");
  console.log(`  UID: ${result2.uid}`);
  console.log(`  Type: Recurring weekly (every Monday)`);

  // Example 3: Multiple days per week (Mon/Wed/Fri)
  const result3 = await client.createEvent(calendar.url, {
    summary: "MWF Workout",
    start: nextMonday.toISOString(),
    end: mondayEnd.toISOString(),
    location: "Gym",
    description: "Monday/Wednesday/Friday workout routine",
    recurrence: {
      frequency: "WEEKLY",
      byDay: ["MO", "WE", "FR"],
    },
  });

  console.log("\n✓ Event 3 created successfully!");
  console.log(`  UID: ${result3.uid}`);
  console.log(`  Type: Recurring weekly (Mon/Wed/Fri)`);

  // Example 4: Event with timezone (VTIMEZONE component)
  const result4 = await client.createEvent(calendar.url, {
    summary: "Team Sync (Amsterdam)",
    start: "2025-01-10T10:00:00",
    end: "2025-01-10T11:00:00",
    location: "Video Call",
    description: "Weekly team sync with European office",
    timezone: "Europe/Amsterdam",
  });

  console.log("\n✓ Event 4 created successfully!");
  console.log(`  UID: ${result4.uid}`);
  console.log(`  Type: Timezone-aware (Europe/Amsterdam CET/CEST)`);

  console.log(`\nCheck your calendar for the new events.`);
} catch (error) {
  console.error("\n✗ Failed to create event:");
  console.error(error instanceof Error ? error.message : "Unknown error");
}
