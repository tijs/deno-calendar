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
 * 5. Add authorized redirect URI: http://localhost:8080
 * 6. Download credentials and set environment variables
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
  redirectUri: "http://localhost:8080", // Localhost redirect for desktop apps
};

// Step 1: Generate authorization URL
console.log("=== Google Calendar OAuth Flow ===\n");
console.log("Step 1: Starting local server on http://localhost:8080");
console.log("Step 2: Visit this URL to authorize:\n");

const authUrl = generateAuthUrl(config, CALENDAR_SCOPES.FULL_ACCESS);
console.log(authUrl);
console.log("\nStep 3: Waiting for authorization callback...\n");

// Start local HTTP server to capture OAuth callback
const server = Deno.serve({ port: 8080, hostname: "localhost" }, async (req) => {
  const url = new URL(req.url);

  // Handle OAuth callback
  if (url.pathname === "/" && url.searchParams.has("code")) {
    const code = url.searchParams.get("code")!;

    try {
      console.log("✓ Authorization code received, exchanging for tokens...\n");
      const tokens = await exchangeCodeForTokens(config, code);

      console.log("✓ Successfully obtained tokens!\n");
      console.log("Access Token:", tokens.access_token);
      console.log("Refresh Token:", tokens.refresh_token || "(not provided)");
      console.log("Expires In:", tokens.expires_in, "seconds");
      console.log("\nSave these tokens securely!");
      console.log("\nFor roci, add to /etc/roci/secrets.conf:");
      console.log(`GOOGLE_CLIENT_ID="${config.clientId}"`);
      console.log(`GOOGLE_CLIENT_SECRET="${config.clientSecret}"`);
      console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token || ""}"`);

      // Shut down server
      setTimeout(() => {
        server.shutdown();
        Deno.exit(0);
      }, 100);

      // Return success page
      return new Response(
        "✓ Authorization successful! You can close this window and return to the terminal.",
        { headers: { "Content-Type": "text/plain" } },
      );
    } catch (error) {
      console.error("✗ Failed to exchange code:");
      console.error(error instanceof Error ? error.message : "Unknown error");

      server.shutdown();
      Deno.exit(1);
    }
  }

  // Handle root (in case user visits directly)
  return new Response("Waiting for OAuth callback...", {
    headers: { "Content-Type": "text/plain" },
  });
});
