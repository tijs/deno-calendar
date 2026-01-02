/**
 * CalDAV Client
 * Deno-native iCloud CalDAV integration using native fetch
 */

import { parseICS } from "./ics-parser.ts";
import type { Calendar, CalendarEvent } from "../types.ts";

export interface CalDAVClientConfig {
  appleId: string;
  appPassword: string;
  cacheTtlMs?: number;
  /**
   * Default timezone for interpreting local times and creating events
   * IANA timezone identifier (e.g., "America/Los_Angeles", "Europe/Amsterdam")
   * Defaults to "UTC" if not specified
   */
  timezone?: string;
}

interface CalendarCache {
  events: CalendarEvent[] | null;
  calendars: Calendar[] | null;
  lastFetch: number | null;
  ttlMs: number;
  cacheKey?: string | null;
}

export class CalDAVClient {
  private baseUrl = "https://caldav.icloud.com";
  private principalUrl: string | null = null;
  private cache: CalendarCache;

  constructor(private config: CalDAVClientConfig) {
    this.cache = {
      events: null,
      calendars: null,
      lastFetch: null,
      ttlMs: config.cacheTtlMs || 5 * 60 * 1000, // 5 minutes default
      cacheKey: null,
    };
  }

  /**
   * Get Basic Auth header value
   */
  private getAuthHeader(): string {
    const credentials = `${this.config.appleId}:${this.config.appPassword}`;
    return `Basic ${btoa(credentials)}`;
  }

  /**
   * Make a CalDAV request
   */
  private async request(
    url: string,
    method: string,
    body?: string,
    headers: Record<string, string> = {},
  ): Promise<Response> {
    const requestHeaders: Record<string, string> = {
      "Authorization": this.getAuthHeader(),
      "Content-Type": "application/xml; charset=utf-8",
      "Depth": "0",
      ...headers,
    };

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body,
    });

    return response;
  }

  /**
   * Discover the user's principal URL
   */
  private async discoverPrincipal(): Promise<string> {
    if (this.principalUrl) return this.principalUrl;

    const propfindBody = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:current-user-principal />
  </d:prop>
</d:propfind>`;

    const response = await this.request(
      this.baseUrl,
      "PROPFIND",
      propfindBody,
      { "Depth": "0" },
    );

    if (!response.ok) {
      throw new Error(
        `Principal discovery failed: ${response.status} ${response.statusText}`,
      );
    }

    const xml = await response.text();

    // Extract principal URL from XML response
    // iCloud returns: <current-user-principal xmlns="DAV:"><href xmlns="DAV:">/88111979/principal/</href></current-user-principal>
    // We need to find the href INSIDE current-user-principal, not the response href
    let match = xml.match(
      /<current-user-principal[^>]*>\s*<href[^>]*>([^<]+)<\/href>\s*<\/current-user-principal>/,
    );
    if (!match) {
      // Try with d: namespace in wrapper
      match = xml.match(
        /<d:current-user-principal[^>]*>\s*<d:href>([^<]+)<\/d:href>\s*<\/d:current-user-principal>/,
      );
    }
    if (!match) {
      // Try with d: namespace and no namespace on href
      match = xml.match(
        /<d:current-user-principal[^>]*>\s*<href>([^<]+)<\/href>\s*<\/d:current-user-principal>/,
      );
    }

    if (!match || !match[1]) {
      console.error("[CalDAVClient] Full XML response:", xml);
      throw new Error("Could not find principal URL in response");
    }

    this.principalUrl = match[1];
    console.log("[CalDAVClient] Discovered principal:", this.principalUrl);

    return this.principalUrl;
  }

  /**
   * Discover calendar home URL
   */
  private async discoverCalendarHome(): Promise<string> {
    const principal = await this.discoverPrincipal();
    const principalUrl = `${this.baseUrl}${principal}`;

    const propfindBody = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <c:calendar-home-set />
  </d:prop>
</d:propfind>`;

    const response = await this.request(
      principalUrl,
      "PROPFIND",
      propfindBody,
      { "Depth": "0" },
    );

    if (!response.ok) {
      throw new Error(`Calendar home discovery failed: ${response.status}`);
    }

    const xml = await response.text();

    // Extract calendar home URL - find href INSIDE calendar-home-set
    let match = xml.match(
      /<calendar-home-set[^>]*>\s*<href[^>]*>([^<]+)<\/href>\s*<\/calendar-home-set>/,
    );
    if (!match) {
      // Try with c: namespace on calendar-home-set
      match = xml.match(
        /<c:calendar-home-set[^>]*>\s*<href[^>]*>([^<]+)<\/href>\s*<\/c:calendar-home-set>/,
      );
    }
    if (!match) {
      // Try with d: namespace on href
      match = xml.match(
        /<calendar-home-set[^>]*>\s*<d:href>([^<]+)<\/d:href>\s*<\/calendar-home-set>/,
      );
    }
    if (!match) {
      // Try with c: namespace on calendar-home-set and d: on href
      match = xml.match(
        /<c:calendar-home-set[^>]*>\s*<d:href>([^<]+)<\/d:href>\s*<\/c:calendar-home-set>/,
      );
    }

    if (!match || !match[1]) {
      console.error("[CalDAVClient] Full calendar home XML response:", xml);
      throw new Error("Could not find calendar home URL");
    }

    const calendarHome = match[1];
    console.log("[CalDAVClient] Calendar home:", calendarHome);

    return calendarHome;
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(cacheKey: string): boolean {
    if (!this.cache.lastFetch) return false;
    const age = Date.now() - this.cache.lastFetch;
    return age < this.cache.ttlMs &&
      this.cache[cacheKey as keyof CalendarCache] !== null;
  }

  /**
   * Fetch all calendars
   */
  async fetchCalendars(): Promise<Calendar[]> {
    if (this.isCacheValid("calendars") && this.cache.calendars) {
      return this.cache.calendars;
    }

    const calendarHome = await this.discoverCalendarHome();
    // iCloud returns absolute URLs, not relative paths
    const calendarHomeUrl = calendarHome.startsWith("http://") ||
        calendarHome.startsWith("https://")
      ? calendarHome
      : `${this.baseUrl}${calendarHome}`;

    const propfindBody = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:displayname />
    <d:resourcetype />
    <c:calendar-description />
  </d:prop>
</d:propfind>`;

    const response = await this.request(
      calendarHomeUrl,
      "PROPFIND",
      propfindBody,
      { "Depth": "1" },
    );

    if (!response.ok) {
      throw new Error(`Calendar list failed: ${response.status}`);
    }

    const xml = await response.text();

    // Parse calendar entries
    const calendars: Calendar[] = [];
    // iCloud uses unprefixed namespaces, so match both <d:response> and <response>
    const responseMatches = xml.matchAll(
      /<response[^>]*>([\s\S]*?)<\/response>/g,
    );

    for (const match of responseMatches) {
      const responseXml = match[1];

      // Check if this is a calendar (not the parent collection)
      const isCalendar = responseXml.includes("<c:calendar") ||
        responseXml.includes('<calendar xmlns="urn:ietf:params:xml:ns:caldav"');
      if (!isCalendar) continue;

      // Extract href - try both prefixed and unprefixed
      let hrefMatch = responseXml.match(/<d:href>([^<]+)<\/d:href>/);
      if (!hrefMatch) {
        hrefMatch = responseXml.match(/<href[^>]*>([^<]+)<\/href>/);
      }

      // Extract displayname - try both prefixed and unprefixed
      let nameMatch = responseXml.match(
        /<d:displayname>([^<]+)<\/d:displayname>/,
      );
      if (!nameMatch) {
        nameMatch = responseXml.match(/<displayname[^>]*>([^<]+)<\/displayname>/);
      }

      if (hrefMatch && nameMatch) {
        calendars.push({
          url: hrefMatch[1],
          displayName: nameMatch[1],
        });
      }
    }

    this.cache.calendars = calendars;
    console.log(`[CalDAVClient] Found ${calendars.length} calendars`);

    return calendars;
  }

  /**
   * Fetch events from a calendar
   */
  async fetchEvents(
    days = 7,
    calendarFilter: string | null = null,
  ): Promise<CalendarEvent[]> {
    // Generate cache key based on parameters
    const cacheKey = `events_${days}_${calendarFilter || "all"}`;

    // Return cached if valid
    if (
      this.isCacheValid("events") && this.cache.cacheKey === cacheKey &&
      this.cache.events
    ) {
      console.log("[CalDAVClient] Returning cached events");
      return this.cache.events;
    }

    const calendars = await this.fetchCalendars();
    const allEvents: CalendarEvent[] = [];

    const now = new Date();
    const end = new Date();
    end.setDate(end.getDate() + Math.min(days, 30)); // Max 30 days

    const startISO = now.toISOString().replace(/\.\d{3}Z$/, "Z");
    const endISO = end.toISOString().replace(/\.\d{3}Z$/, "Z");

    for (const calendar of calendars) {
      // Skip if filtering and doesn't match
      if (calendarFilter && calendar.displayName !== calendarFilter) {
        continue;
      }

      try {
        // iCloud returns absolute URLs, not relative paths
        const calendarUrl = calendar.url.startsWith("http://") ||
            calendar.url.startsWith("https://")
          ? calendar.url
          : `${this.baseUrl}${calendar.url}`;

        // CalDAV calendar-query REPORT
        const reportBody = `<?xml version="1.0" encoding="UTF-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag />
    <c:calendar-data />
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${startISO}" end="${endISO}"/>
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;

        const response = await this.request(
          calendarUrl,
          "REPORT",
          reportBody,
          { "Depth": "1" },
        );

        if (!response.ok) {
          console.warn(
            `[CalDAVClient] Failed to fetch from ${calendar.displayName}: ${response.status}`,
          );
          continue;
        }

        const xml = await response.text();

        // Parse calendar data from response
        const calendarDataMatches = xml.matchAll(
          /<calendar-data[^>]*>([\s\S]*?)<\/calendar-data>/g,
        );

        for (const match of calendarDataMatches) {
          const icsData = match[1]
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'");

          const event = parseICS(icsData, calendar.displayName);
          if (event) {
            allEvents.push(event);
          }
        }
      } catch (calError) {
        console.warn(
          `[CalDAVClient] Error fetching from ${calendar.displayName}:`,
          calError instanceof Error ? calError.message : "Unknown error",
        );
        // Continue with other calendars
      }
    }

    // Sort by start time
    allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    // Update cache
    this.cache.events = allEvents;
    this.cache.cacheKey = cacheKey;
    this.cache.lastFetch = Date.now();

    console.log(
      `[CalDAVClient] Fetched ${allEvents.length} events from ${calendars.length} calendars`,
    );

    return allEvents;
  }

  /**
   * Create a new event in a calendar
   */
  async createEvent(
    calendarUrl: string,
    event: import("../types.ts").CalendarEventInput,
  ): Promise<import("../types.ts").CreateEventResult> {
    const { generateICS } = await import("./ics-generator.ts");
    const icsData = generateICS(event);

    // Generate a unique filename for the event
    const uid = icsData.match(/UID:([^\r\n]+)/)?.[1] || crypto.randomUUID();
    const eventUrl = `${calendarUrl}${uid}.ics`;

    // Ensure calendarUrl is absolute
    const absoluteEventUrl = eventUrl.startsWith("http://") ||
        eventUrl.startsWith("https://")
      ? eventUrl
      : `${this.baseUrl}${eventUrl}`;

    // PUT with If-None-Match: * (create only if doesn't exist)
    const response = await this.request(
      absoluteEventUrl,
      "PUT",
      icsData,
      {
        "Content-Type": "text/calendar; charset=utf-8",
        "If-None-Match": "*",
      },
    );

    if (!response.ok) {
      if (response.status === 412) {
        throw new Error(
          "Event already exists (precondition failed). Use updateEvent to modify existing events.",
        );
      }
      throw new Error(
        `Failed to create event: ${response.status} ${response.statusText}`,
      );
    }

    // Extract ETag from response
    const etag = response.headers.get("ETag") || undefined;

    // Invalidate cache since we added an event
    this.invalidateCache();

    return { uid, etag };
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    eventUrl: string,
    event: import("../types.ts").CalendarEventInput,
    etag: string,
  ): Promise<import("../types.ts").UpdateEventResult> {
    const { generateICS } = await import("./ics-generator.ts");
    const icsData = generateICS(event);

    // Ensure eventUrl is absolute
    const absoluteEventUrl = eventUrl.startsWith("http://") ||
        eventUrl.startsWith("https://")
      ? eventUrl
      : `${this.baseUrl}${eventUrl}`;

    // PUT with If-Match: etag (update only if ETag matches)
    const response = await this.request(
      absoluteEventUrl,
      "PUT",
      icsData,
      {
        "Content-Type": "text/calendar; charset=utf-8",
        "If-Match": etag,
      },
    );

    if (!response.ok) {
      if (response.status === 412) {
        throw new Error(
          "Event was modified by another client (ETag mismatch). Fetch the latest version and try again.",
        );
      }
      if (response.status === 404) {
        throw new Error("Event not found. It may have been deleted.");
      }
      throw new Error(
        `Failed to update event: ${response.status} ${response.statusText}`,
      );
    }

    // Get new ETag
    const newEtag = response.headers.get("ETag") || etag;

    // Invalidate cache
    this.invalidateCache();

    return { etag: newEtag };
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventUrl: string, etag: string): Promise<void> {
    // Ensure eventUrl is absolute
    const absoluteEventUrl = eventUrl.startsWith("http://") ||
        eventUrl.startsWith("https://")
      ? eventUrl
      : `${this.baseUrl}${eventUrl}`;

    // DELETE with If-Match: etag
    const response = await this.request(
      absoluteEventUrl,
      "DELETE",
      undefined,
      { "If-Match": etag },
    );

    if (!response.ok) {
      if (response.status === 412) {
        throw new Error(
          "Event was modified by another client (ETag mismatch). Fetch the latest version and try again.",
        );
      }
      if (response.status === 404) {
        throw new Error("Event not found. It may have already been deleted.");
      }
      throw new Error(
        `Failed to delete event: ${response.status} ${response.statusText}`,
      );
    }

    // Invalidate cache
    this.invalidateCache();
  }

  /**
   * Invalidate cache (call when credentials change)
   */
  invalidateCache(): void {
    this.cache.events = null;
    this.cache.calendars = null;
    this.cache.lastFetch = null;
    this.cache.cacheKey = null;
  }

  /**
   * Get list of available calendar names
   */
  async getCalendarNames(): Promise<string[]> {
    const calendars = await this.fetchCalendars();
    return calendars.map((c) => c.displayName);
  }
}
