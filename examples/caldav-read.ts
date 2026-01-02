/**
 * Example: Read events from iCloud calendar using CalDAV
 *
 * Usage:
 *   export ICLOUD_APPLE_ID="your-apple-id@icloud.com"
 *   export ICLOUD_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx"
 *   deno run --allow-net --allow-env examples/caldav-read.ts
 */

import { CalDAVClient } from "../src/mod.ts";

const client = new CalDAVClient({
  appleId: Deno.env.get("ICLOUD_APPLE_ID")!,
  appPassword: Deno.env.get("ICLOUD_APP_PASSWORD")!,
});

console.log("Fetching events for next 7 days...\n");
const events = await client.fetchEvents(7);

if (events.length === 0) {
  console.log("No events found in the next 7 days.");
} else {
  console.log(`Found ${events.length} events:\n`);
  for (const event of events) {
    const date = event.start.split("T")[0];
    const time = event.all_day
      ? "All day"
      : event.start.split("T")[1]?.slice(0, 5) || "Unknown";

    console.log(`📅 ${event.summary}`);
    console.log(`   Calendar: ${event.calendar}`);
    console.log(`   Date: ${date} at ${time}`);
    if (event.location) console.log(`   Location: ${event.location}`);
    if (event.description) {
      console.log(`   Description: ${event.description.slice(0, 100)}...`);
    }
    console.log();
  }
}
