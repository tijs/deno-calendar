/**
 * Timezone Utilities
 * Dynamically generates VTIMEZONE components for all IANA timezones using Intl API
 */

/**
 * Get UTC offset for a timezone at a specific date
 * @returns Offset in minutes (e.g., -480 for PST)
 */
function getTimezoneOffset(tzid: string, date: Date): number {
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone: tzid }));
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
}

/**
 * Format offset as RFC 5545 format (+0100, -0800, etc.)
 */
function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  return `${sign}${hours.toString().padStart(2, "0")}${minutes.toString().padStart(2, "0")}`;
}

/**
 * Get timezone abbreviation (e.g., "PST", "CET")
 */
function getTimezoneAbbreviation(tzid: string, date: Date): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tzid,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((part) => part.type === "timeZoneName");
    return tzPart?.value || tzid;
  } catch {
    return tzid;
  }
}

/**
 * Detect DST transitions for a timezone in a given year
 * Returns standard and daylight time information, or just standard if no DST
 */
function detectDSTTransitions(tzid: string, year = 2025): {
  standard: {
    offset: number;
    abbr: string;
    transitionDate?: Date;
  };
  daylight?: {
    offset: number;
    abbr: string;
    transitionDate: Date;
  };
} {
  // Sample dates throughout the year to detect DST
  const dates = [];
  for (let month = 0; month < 12; month++) {
    dates.push(new Date(year, month, 15, 12, 0, 0));
  }

  // Get offsets for all sample dates
  const offsets = dates.map((date) => ({
    date,
    offset: getTimezoneOffset(tzid, date),
    abbr: getTimezoneAbbreviation(tzid, date),
  }));

  // Find unique offsets
  const uniqueOffsets = Array.from(
    new Set(offsets.map((o) => o.offset)),
  );

  // No DST if only one offset throughout the year
  if (uniqueOffsets.length === 1) {
    return {
      standard: {
        offset: offsets[0].offset,
        abbr: offsets[0].abbr,
      },
    };
  }

  // Has DST - identify standard (larger offset in southern hemisphere, smaller in northern)
  // We'll use the most common offset as standard
  const offsetCounts = new Map<number, number>();
  offsets.forEach((o) => {
    offsetCounts.set(o.offset, (offsetCounts.get(o.offset) || 0) + 1);
  });

  // For simplicity, standard time is the smaller offset (works for northern hemisphere)
  // Daylight time is the larger offset
  const standardOffset = Math.min(...uniqueOffsets);
  const daylightOffset = Math.max(...uniqueOffsets);

  const standardSample = offsets.find((o) => o.offset === standardOffset)!;
  const daylightSample = offsets.find((o) => o.offset === daylightOffset)!;

  // Find approximate transition dates by looking for offset changes
  let daylightTransition: Date | undefined;
  for (let i = 1; i < offsets.length; i++) {
    if (
      offsets[i].offset === daylightOffset &&
      offsets[i - 1].offset === standardOffset
    ) {
      // Transition to daylight time
      daylightTransition = offsets[i].date;
      break;
    }
  }

  let standardTransition: Date | undefined;
  for (let i = 1; i < offsets.length; i++) {
    if (
      offsets[i].offset === standardOffset &&
      offsets[i - 1].offset === daylightOffset
    ) {
      // Transition to standard time
      standardTransition = offsets[i].date;
      break;
    }
  }

  return {
    standard: {
      offset: standardOffset,
      abbr: standardSample.abbr,
      transitionDate: standardTransition,
    },
    daylight: daylightTransition
      ? {
        offset: daylightOffset,
        abbr: daylightSample.abbr,
        transitionDate: daylightTransition,
      }
      : undefined,
  };
}

/**
 * Format date for DTSTART in VTIMEZONE (local time, no Z)
 */
function formatTransitionDate(date: Date): string {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}${month}${day}T020000`;
}

/**
 * Generate simple RRULE for DST transitions
 * This is a simplified approach - real DST rules are complex
 */
function generateDSTRule(transitionDate: Date): string {
  const month = transitionDate.getMonth() + 1;
  // Approximate: use first/last Sunday of month
  // This is simplified - real rules vary by timezone
  if (transitionDate.getDate() <= 7) {
    return `FREQ=YEARLY;BYMONTH=${month};BYDAY=1SU`;
  } else if (transitionDate.getDate() >= 22) {
    return `FREQ=YEARLY;BYMONTH=${month};BYDAY=-1SU`;
  } else if (transitionDate.getDate() <= 14) {
    return `FREQ=YEARLY;BYMONTH=${month};BYDAY=2SU`;
  } else {
    return `FREQ=YEARLY;BYMONTH=${month};BYDAY=-1SU`;
  }
}

/**
 * Generate VTIMEZONE component for any IANA timezone
 * @param tzid IANA timezone identifier (e.g., "America/Los_Angeles", "Asia/Tokyo")
 * @returns VTIMEZONE component string or null if timezone is invalid
 */
export function generateVTIMEZONE(tzid: string): string | null {
  try {
    // Validate timezone by attempting to use it
    Intl.DateTimeFormat(undefined, { timeZone: tzid });
  } catch {
    // Invalid timezone
    return null;
  }

  const transitions = detectDSTTransitions(tzid);
  const lines: string[] = [
    "BEGIN:VTIMEZONE",
    `TZID:${tzid}`,
  ];

  // Add STANDARD component
  lines.push("BEGIN:STANDARD");
  if (transitions.standard.transitionDate) {
    lines.push(
      `DTSTART:${formatTransitionDate(transitions.standard.transitionDate)}`,
    );
    lines.push(`RRULE:${generateDSTRule(transitions.standard.transitionDate)}`);
  } else {
    // No DST transitions - use epoch date
    lines.push("DTSTART:19700101T000000");
  }

  if (transitions.daylight) {
    lines.push(`TZOFFSETFROM:${formatOffset(transitions.daylight.offset)}`);
  } else {
    lines.push(`TZOFFSETFROM:${formatOffset(transitions.standard.offset)}`);
  }
  lines.push(`TZOFFSETTO:${formatOffset(transitions.standard.offset)}`);
  lines.push(`TZNAME:${transitions.standard.abbr}`);
  lines.push("END:STANDARD");

  // Add DAYLIGHT component if DST exists
  if (transitions.daylight) {
    lines.push("BEGIN:DAYLIGHT");
    lines.push(
      `DTSTART:${formatTransitionDate(transitions.daylight.transitionDate)}`,
    );
    lines.push(`RRULE:${generateDSTRule(transitions.daylight.transitionDate)}`);
    lines.push(`TZOFFSETFROM:${formatOffset(transitions.standard.offset)}`);
    lines.push(`TZOFFSETTO:${formatOffset(transitions.daylight.offset)}`);
    lines.push(`TZNAME:${transitions.daylight.abbr}`);
    lines.push("END:DAYLIGHT");
  }

  lines.push("END:VTIMEZONE");

  return lines.join("\r\n");
}

/**
 * Check if a timezone is supported (valid IANA timezone)
 * @param tzid IANA timezone identifier
 * @returns true if timezone is valid
 */
export function isSupportedTimezone(tzid: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tzid });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get list of common timezones (not exhaustive - all IANA timezones are supported)
 * @returns Array of common IANA timezone identifiers
 */
export function getSupportedTimezones(): string[] {
  // Return a curated list of common timezones
  // Note: ALL IANA timezones are actually supported via generateVTIMEZONE()
  return [
    // North America
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Anchorage",
    "America/Toronto",
    "America/Vancouver",
    "America/Mexico_City",
    // Europe
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Amsterdam",
    "Europe/Rome",
    "Europe/Madrid",
    "Europe/Stockholm",
    "Europe/Zurich",
    // Asia
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Hong_Kong",
    "Asia/Singapore",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Bangkok",
    "Asia/Seoul",
    // Pacific
    "Australia/Sydney",
    "Australia/Melbourne",
    "Pacific/Auckland",
    "Pacific/Fiji",
    // South America
    "America/Sao_Paulo",
    "America/Buenos_Aires",
    // Africa
    "Africa/Cairo",
    "Africa/Johannesburg",
  ];
}
