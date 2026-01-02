/**
 * Example: Google Calendar OAuth 2.0 flow
 *
 * This example shows how to obtain OAuth tokens for Google Calendar API.
 * You'll need to create a Google Cloud project and OAuth credentials first.
 *
 * Setup:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing
 * 3. Enable Google Calendar API
 * 4. Create OAuth 2.0 credentials (Desktop app type)
 * 5. Download credentials and set environment variables
 *
 * Usage:
 *   export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
 *   export GOOGLE_CLIENT_SECRET="your-client-secret"
 *   deno run --allow-net --allow-env examples/google-oauth.ts
 */

import { CALENDAR_SCOPES, exchangeCodeForTokens, generateAuthUrl } from "../src/mod.ts";

const config = {
  clientId: Deno.env.get("GOOGLE_CLIENT_ID")!,
  clientSecret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
  redirectUri: "urn:ietf:wg:oauth:2.0:oob", // For desktop apps
};

// Step 1: Generate authorization URL
console.log("=== Google Calendar OAuth Flow ===\n");
console.log("Step 1: Visit this URL to authorize:");
console.log("");

const authUrl = generateAuthUrl(config, CALENDAR_SCOPES.FULL_ACCESS);
console.log(authUrl);
console.log("");

// Step 2: User authorizes and gets code
console.log("Step 2: After authorizing, copy the authorization code");
console.log("Step 3: Run this script again with the code:");
console.log("");
console.log("  deno run --allow-net --allow-env examples/google-oauth.ts <code>");
console.log("");

// If code provided, exchange for tokens
const code = Deno.args[0];
if (code) {
  try {
    console.log("Exchanging code for tokens...\n");
    const tokens = await exchangeCodeForTokens(config, code);

    console.log("✓ Successfully obtained tokens!\n");
    console.log("Access Token:", tokens.access_token);
    console.log("Refresh Token:", tokens.refresh_token || "(not provided)");
    console.log("Expires In:", tokens.expires_in, "seconds");
    console.log("");
    console.log("Save these tokens securely!");
    console.log("");
    console.log("Example usage:");
    console.log('  export GOOGLE_ACCESS_TOKEN="' + tokens.access_token + '"');
    console.log(
      '  export GOOGLE_REFRESH_TOKEN="' + (tokens.refresh_token || "") + '"',
    );
  } catch (error) {
    console.error("✗ Failed to exchange code:");
    console.error(error instanceof Error ? error.message : "Unknown error");
  }
}
