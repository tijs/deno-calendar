/**
 * Google OAuth 2.0 Helper Utilities
 * Provides helpers for OAuth flow - library users manage their own tokens
 */

/**
 * Google OAuth configuration
 */
export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * OAuth scopes for Google Calendar API
 */
export const CALENDAR_SCOPES = {
  /** Read/write access to calendars */
  FULL_ACCESS: "https://www.googleapis.com/auth/calendar",
  /** Read-only access to calendars */
  READONLY: "https://www.googleapis.com/auth/calendar.readonly",
  /** Access to calendar events only */
  EVENTS: "https://www.googleapis.com/auth/calendar.events",
  /** Read-only access to calendar events */
  EVENTS_READONLY: "https://www.googleapis.com/auth/calendar.events.readonly",
} as const;

/**
 * Generate OAuth authorization URL for user consent
 * @param config OAuth configuration
 * @param scope OAuth scope (default: FULL_ACCESS)
 * @param state Optional state parameter for CSRF protection
 * @returns Authorization URL to redirect user to
 *
 * @example
 * ```ts
 * const authUrl = generateAuthUrl({
 *   clientId: "your-client-id",
 *   clientSecret: "your-client-secret",
 *   redirectUri: "http://localhost:3000/callback"
 * });
 * // Redirect user to authUrl, they'll be redirected back with code
 * ```
 */
export function generateAuthUrl(
  config: GoogleOAuthConfig,
  scope: string = CALENDAR_SCOPES.FULL_ACCESS,
  state?: string,
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope,
    access_type: "offline", // Request refresh token
    prompt: "consent", // Force consent screen to get refresh token
  });

  if (state) {
    params.set("state", state);
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/**
 * Exchange authorization code for access token and refresh token
 * @param config OAuth configuration
 * @param code Authorization code from OAuth callback
 * @returns Token response with access_token and refresh_token
 *
 * @example
 * ```ts
 * // After user authorizes and returns with code
 * const tokens = await exchangeCodeForTokens({
 *   clientId: "your-client-id",
 *   clientSecret: "your-client-secret",
 *   redirectUri: "http://localhost:3000/callback"
 * }, code);
 *
 * // Save tokens.access_token and tokens.refresh_token securely
 * ```
 */
export async function exchangeCodeForTokens(
  config: GoogleOAuthConfig,
  code: string,
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OAuth token exchange failed: ${error}`);
  }

  return await response.json();
}

/**
 * Refresh access token using refresh token
 * @param config OAuth configuration
 * @param refreshToken Refresh token from initial authorization
 * @returns New access token
 *
 * @example
 * ```ts
 * // When access token expires, refresh it
 * const newToken = await refreshAccessToken({
 *   clientId: "your-client-id",
 *   clientSecret: "your-client-secret",
 *   redirectUri: "http://localhost:3000/callback"
 * }, storedRefreshToken);
 * ```
 */
export async function refreshAccessToken(
  config: GoogleOAuthConfig,
  refreshToken: string,
): Promise<{
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OAuth token refresh failed: ${error}`);
  }

  return await response.json();
}

/**
 * Revoke access token or refresh token
 * @param token Access token or refresh token to revoke
 *
 * @example
 * ```ts
 * // Revoke user's access (logout)
 * await revokeToken(accessToken);
 * ```
 */
export async function revokeToken(token: string): Promise<void> {
  const response = await fetch(
    `https://oauth2.googleapis.com/revoke?token=${token}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OAuth token revocation failed: ${error}`);
  }
}
