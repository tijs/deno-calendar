/**
 * Google Calendar API Client
 * REST API client for Google Calendar v3
 */

import type {
  Calendar,
  CalendarEvent,
  CalendarEventInput,
  CreateEventResult,
  FetchEventsOptions,
  UpdateEventResult,
} from "../types.ts";
import type { GoogleCalendarListResponse, GoogleEvent, GoogleEventsListResponse } from "./types.ts";
import { mapCalendarEventToGoogleEvent, mapGoogleEventToCalendarEvent } from "./mapper.ts";

/**
 * Google Calendar client configuration
 */
export interface GoogleCalendarClientConfig {
  accessToken: string;
  /** Optional: Auto-refresh token when expired (requires refresh token) */
  refreshToken?: string;
  /** Optional: Client credentials for token refresh */
  clientId?: string;
  clientSecret?: string;
}

/**
 * Google Calendar API Client
 */
export class GoogleCalendarClient {
  private accessToken: string;
  private refreshToken?: string;
  private clientId?: string;
  private clientSecret?: string;
  private baseUrl = "https://www.googleapis.com/calendar/v3";

  constructor(config: GoogleCalendarClientConfig) {
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  /**
   * Fetch list of calendars
   * @returns Array of calendars accessible to the user
   */
  async fetchCalendars(): Promise<Calendar[]> {
    const response = await this.request<GoogleCalendarListResponse>(
      "/users/me/calendarList",
    );

    return response.items.map((cal) => ({
      url: cal.id,
      displayName: cal.summary,
    }));
  }

  /**
   * Fetch events from a calendar
   * @param options Fetch options (days, calendar filter)
   * @returns Array of calendar events
   */
  async fetchEvents(options: FetchEventsOptions = {}): Promise<CalendarEvent[]> {
    const { days = 30, calendar = "primary" } = options;

    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    const params = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
    });

    const response = await this.request<GoogleEventsListResponse>(
      `/calendars/${encodeURIComponent(calendar!)}/events?${params}`,
    );

    // Get calendar name
    const calendarName = calendar === "primary" ? "Primary" : calendar!;

    return response.items.map((event) => mapGoogleEventToCalendarEvent(event, calendarName));
  }

  /**
   * Create a new event
   * @param calendarId Calendar ID (use "primary" for primary calendar)
   * @param event Event data
   * @returns Created event result with ID
   */
  async createEvent(
    calendarId: string,
    event: CalendarEventInput,
  ): Promise<CreateEventResult> {
    const googleEvent = mapCalendarEventToGoogleEvent(event);

    const created = await this.request<GoogleEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        body: JSON.stringify(googleEvent),
      },
    );

    return {
      uid: created.id!,
      etag: created.etag,
    };
  }

  /**
   * Update an existing event
   * @param calendarId Calendar ID
   * @param eventId Event ID to update
   * @param event Updated event data
   * @returns Updated event result
   */
  async updateEvent(
    calendarId: string,
    eventId: string,
    event: CalendarEventInput,
  ): Promise<UpdateEventResult> {
    const googleEvent = mapCalendarEventToGoogleEvent(event);

    const updated = await this.request<GoogleEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: "PUT",
        body: JSON.stringify(googleEvent),
      },
    );

    return {
      etag: updated.etag!,
    };
  }

  /**
   * Delete an event
   * @param calendarId Calendar ID
   * @param eventId Event ID to delete
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    await this.request(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: "DELETE",
      },
    );
  }

  /**
   * Make authenticated request to Google Calendar API
   */
  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && this.refreshToken) {
      await this.refreshAccessToken();
      // Retry request with new token
      return this.request<T>(path, options);
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Google Calendar API error (${response.status}): ${error}`,
      );
    }

    // DELETE returns 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken || !this.clientId || !this.clientSecret) {
      throw new Error(
        "Cannot refresh token: missing refreshToken, clientId, or clientSecret",
      );
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh access token");
    }

    const data = await response.json();
    this.accessToken = data.access_token;
  }

  /**
   * Update access token (useful when managing tokens externally)
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }
}
