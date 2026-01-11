/**
 * Service Account Authentication Tests
 */

import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import {
  clearTokenCache,
  parseServiceAccountCredentials,
  type ServiceAccountCredentials,
} from "../src/google/service-account.ts";
import { GOOGLE_CALENDAR_SCOPES, GoogleCalendarClient } from "../src/google/client.ts";

// Mock service account credentials for testing
const mockCredentials: ServiceAccountCredentials = {
  type: "service_account",
  project_id: "test-project",
  private_key_id: "key123",
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7JHoJfg6yNzLM
kv6rLgGxlZJjYb2K5l8hJK3QD7PQ5PnCvDq0b4GpPp5UwOlPJKlHJKlPKH5IpKlP
KH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlP
KH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlP
KH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlP
KH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlPKH5IpKlP
KH5IpKlPKH5IpKlPAgMBAAECggEABoJ/1bJ6z6v8Nz9J8z6J8z6J8z6J8z6J8z6J
8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J
8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J
8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J
8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J
8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J8z6J
8z6J8z6J8QKBgQDogJHKJLJ8JLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJK
JLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJK
JLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJK
JLJKJLJKJQKBgQDN7JLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJ
KJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJ
KJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJ
KJLJKwKBgQDOJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJK
JLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJK
JLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJK
JLJKJQKBgFJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJL
JKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJL
JKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJL
JKJLJKJLAoGASJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJK
JLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJK
JLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJKJLJK
JLJK
-----END PRIVATE KEY-----`,
  client_email: "test@test-project.iam.gserviceaccount.com",
  client_id: "123456789",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/test",
};

// Clear token cache between tests
Deno.test({
  name: "Service Account - Setup",
  fn() {
    clearTokenCache();
  },
});

// Test parsing credentials from object
Deno.test("Service Account - parseServiceAccountCredentials from object", () => {
  const parsed = parseServiceAccountCredentials(mockCredentials);
  assertEquals(parsed.type, "service_account");
  assertEquals(parsed.client_email, "test@test-project.iam.gserviceaccount.com");
  assertEquals(parsed.project_id, "test-project");
});

// Test parsing credentials from JSON string
Deno.test("Service Account - parseServiceAccountCredentials from string", () => {
  const jsonString = JSON.stringify(mockCredentials);
  const parsed = parseServiceAccountCredentials(jsonString);
  assertEquals(parsed.type, "service_account");
  assertEquals(parsed.client_email, "test@test-project.iam.gserviceaccount.com");
});

// Test invalid credentials type
Deno.test("Service Account - parseServiceAccountCredentials rejects invalid type", () => {
  const invalidCreds = { ...mockCredentials, type: "oauth" };
  try {
    parseServiceAccountCredentials(invalidCreds as unknown as ServiceAccountCredentials);
    throw new Error("Should have thrown");
  } catch (e) {
    assertStringIncludes((e as Error).message, 'expected type "service_account"');
  }
});

// Test missing private key
Deno.test("Service Account - parseServiceAccountCredentials rejects missing private_key", () => {
  const invalidCreds = { ...mockCredentials, private_key: "" };
  try {
    parseServiceAccountCredentials(invalidCreds);
    throw new Error("Should have thrown");
  } catch (e) {
    assertStringIncludes((e as Error).message, "missing private_key or client_email");
  }
});

// Test GoogleCalendarClient constructor with service account
Deno.test("Service Account - GoogleCalendarClient constructor accepts service account config", () => {
  const client = new GoogleCalendarClient({
    serviceAccountCredentials: mockCredentials,
    scopes: [GOOGLE_CALENDAR_SCOPES.READONLY],
    subject: "user@example.com",
  });
  // Constructor should not throw
  assertEquals(typeof client, "object");
});

// Test GoogleCalendarClient constructor with string credentials
Deno.test("Service Account - GoogleCalendarClient constructor accepts JSON string credentials", () => {
  const client = new GoogleCalendarClient({
    serviceAccountCredentials: JSON.stringify(mockCredentials),
    scopes: [GOOGLE_CALENDAR_SCOPES.READONLY],
  });
  assertEquals(typeof client, "object");
});

// Test GOOGLE_CALENDAR_SCOPES export
Deno.test("Service Account - GOOGLE_CALENDAR_SCOPES are correctly defined", () => {
  assertEquals(
    GOOGLE_CALENDAR_SCOPES.READONLY,
    "https://www.googleapis.com/auth/calendar.readonly",
  );
  assertEquals(GOOGLE_CALENDAR_SCOPES.READWRITE, "https://www.googleapis.com/auth/calendar");
  assertEquals(GOOGLE_CALENDAR_SCOPES.EVENTS, "https://www.googleapis.com/auth/calendar.events");
  assertEquals(
    GOOGLE_CALENDAR_SCOPES.EVENTS_READONLY,
    "https://www.googleapis.com/auth/calendar.events.readonly",
  );
});

// Test that OAuth config still works
Deno.test("Service Account - OAuth config still works", () => {
  const client = new GoogleCalendarClient({
    accessToken: "test-token",
    refreshToken: "refresh-token",
    clientId: "client-id",
    clientSecret: "client-secret",
  });
  assertEquals(typeof client, "object");
});
