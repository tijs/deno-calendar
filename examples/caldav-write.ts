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
  const result = await client.createEvent(calendar.url, {
    summary: "Deno Calendar Test Event",
    start: tomorrow.toISOString(),
    end: endTime.toISOString(),
    location: "Conference Room A",
    description: "This event was created using deno-calendar library!",
  });

  console.log("\n✓ Event created successfully!");
  console.log(`  UID: ${result.uid}`);
  console.log(`  ETag: ${result.etag || "N/A"}`);
  console.log(`\nCheck your calendar for the new event.`);
} catch (error) {
  console.error("\n✗ Failed to create event:");
  console.error(error instanceof Error ? error.message : "Unknown error");
}
