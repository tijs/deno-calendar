/**
 * Timezone Utilities
 * Provides VTIMEZONE component generation for common timezones
 */

/**
 * VTIMEZONE component data structure
 */
interface TimezoneComponent {
  tzid: string;
  standard: {
    dtstart: string;
    rrule?: string;
    tzoffsetfrom: string;
    tzoffsetto: string;
    tzname: string;
  };
  daylight?: {
    dtstart: string;
    rrule?: string;
    tzoffsetfrom: string;
    tzoffsetto: string;
    tzname: string;
  };
}

/**
 * Timezone database with VTIMEZONE components for common timezones
 * Based on IANA timezone database and RFC 5545 specification
 */
const TIMEZONE_DATA: Record<string, TimezoneComponent> = {
  // Europe/Amsterdam (CET/CEST)
  "Europe/Amsterdam": {
    tzid: "Europe/Amsterdam",
    standard: {
      dtstart: "19701025T030000",
      rrule: "FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
      tzoffsetfrom: "+0200",
      tzoffsetto: "+0100",
      tzname: "CET",
    },
    daylight: {
      dtstart: "19700329T020000",
      rrule: "FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
      tzoffsetfrom: "+0100",
      tzoffsetto: "+0200",
      tzname: "CEST",
    },
  },

  // America/Los_Angeles (PST/PDT)
  "America/Los_Angeles": {
    tzid: "America/Los_Angeles",
    standard: {
      dtstart: "19701101T020000",
      rrule: "FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
      tzoffsetfrom: "-0700",
      tzoffsetto: "-0800",
      tzname: "PST",
    },
    daylight: {
      dtstart: "19700308T020000",
      rrule: "FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
      tzoffsetfrom: "-0800",
      tzoffsetto: "-0700",
      tzname: "PDT",
    },
  },

  // America/New_York (EST/EDT)
  "America/New_York": {
    tzid: "America/New_York",
    standard: {
      dtstart: "19701101T020000",
      rrule: "FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
      tzoffsetfrom: "-0400",
      tzoffsetto: "-0500",
      tzname: "EST",
    },
    daylight: {
      dtstart: "19700308T020000",
      rrule: "FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
      tzoffsetfrom: "-0500",
      tzoffsetto: "-0400",
      tzname: "EDT",
    },
  },

  // Europe/London (GMT/BST)
  "Europe/London": {
    tzid: "Europe/London",
    standard: {
      dtstart: "19701025T020000",
      rrule: "FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
      tzoffsetfrom: "+0100",
      tzoffsetto: "+0000",
      tzname: "GMT",
    },
    daylight: {
      dtstart: "19700329T010000",
      rrule: "FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
      tzoffsetfrom: "+0000",
      tzoffsetto: "+0100",
      tzname: "BST",
    },
  },

  // Asia/Tokyo (JST - no DST)
  "Asia/Tokyo": {
    tzid: "Asia/Tokyo",
    standard: {
      dtstart: "19700101T000000",
      tzoffsetfrom: "+0900",
      tzoffsetto: "+0900",
      tzname: "JST",
    },
  },

  // Australia/Sydney (AEDT/AEST)
  "Australia/Sydney": {
    tzid: "Australia/Sydney",
    standard: {
      dtstart: "19700405T030000",
      rrule: "FREQ=YEARLY;BYMONTH=4;BYDAY=1SU",
      tzoffsetfrom: "+1100",
      tzoffsetto: "+1000",
      tzname: "AEST",
    },
    daylight: {
      dtstart: "19701004T020000",
      rrule: "FREQ=YEARLY;BYMONTH=10;BYDAY=1SU",
      tzoffsetfrom: "+1000",
      tzoffsetto: "+1100",
      tzname: "AEDT",
    },
  },
};

/**
 * Generate VTIMEZONE component for a given timezone
 * @param tzid IANA timezone identifier (e.g., "Europe/Amsterdam")
 * @returns VTIMEZONE component string or null if timezone not found
 */
export function generateVTIMEZONE(tzid: string): string | null {
  const tz = TIMEZONE_DATA[tzid];
  if (!tz) {
    return null;
  }

  const lines: string[] = [
    "BEGIN:VTIMEZONE",
    `TZID:${tz.tzid}`,
  ];

  // Add STANDARD component
  lines.push("BEGIN:STANDARD");
  lines.push(`DTSTART:${tz.standard.dtstart}`);
  if (tz.standard.rrule) {
    lines.push(`RRULE:${tz.standard.rrule}`);
  }
  lines.push(`TZOFFSETFROM:${tz.standard.tzoffsetfrom}`);
  lines.push(`TZOFFSETTO:${tz.standard.tzoffsetto}`);
  lines.push(`TZNAME:${tz.standard.tzname}`);
  lines.push("END:STANDARD");

  // Add DAYLIGHT component if exists
  if (tz.daylight) {
    lines.push("BEGIN:DAYLIGHT");
    lines.push(`DTSTART:${tz.daylight.dtstart}`);
    if (tz.daylight.rrule) {
      lines.push(`RRULE:${tz.daylight.rrule}`);
    }
    lines.push(`TZOFFSETFROM:${tz.daylight.tzoffsetfrom}`);
    lines.push(`TZOFFSETTO:${tz.daylight.tzoffsetto}`);
    lines.push(`TZNAME:${tz.daylight.tzname}`);
    lines.push("END:DAYLIGHT");
  }

  lines.push("END:VTIMEZONE");

  return lines.join("\r\n");
}

/**
 * Check if a timezone is supported
 * @param tzid IANA timezone identifier
 * @returns true if timezone is supported
 */
export function isSupportedTimezone(tzid: string): boolean {
  return tzid in TIMEZONE_DATA;
}

/**
 * Get list of all supported timezones
 * @returns Array of supported IANA timezone identifiers
 */
export function getSupportedTimezones(): string[] {
  return Object.keys(TIMEZONE_DATA);
}
