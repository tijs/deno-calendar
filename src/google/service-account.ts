/**
 * Google Service Account Authentication
 * JWT-based authentication for Google APIs using service account credentials
 */

/**
 * Service account credentials from JSON key file
 */
export interface ServiceAccountCredentials {
  type: "service_account";
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain?: string;
}

/**
 * Configuration for service account authentication
 */
export interface ServiceAccountConfig {
  /** Service account credentials (parsed JSON key file) */
  credentials: ServiceAccountCredentials;
  /** OAuth scopes to request */
  scopes: string[];
  /** Optional: Subject email for domain-wide delegation */
  subject?: string;
}

/**
 * Token response from Google OAuth
 */
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Cached token with expiration
 */
interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

// Token cache per service account email
const tokenCache = new Map<string, CachedToken>();

/**
 * Get an access token using service account credentials.
 * Tokens are cached and automatically refreshed when expired.
 *
 * @param config Service account configuration
 * @returns Access token string
 */
export async function getAccessToken(config: ServiceAccountConfig): Promise<string> {
  const cacheKey = config.credentials.client_email;

  // Check cache first (with 5 minute buffer before expiry)
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cached.accessToken;
  }

  // Create and sign JWT
  const jwt = await createSignedJwt(config);

  // Exchange JWT for access token
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${response.status} ${error}`);
  }

  const data: TokenResponse = await response.json();

  // Cache the token
  tokenCache.set(cacheKey, {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });

  return data.access_token;
}

/**
 * Create a signed JWT for service account authentication
 */
async function createSignedJwt(config: ServiceAccountConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  // JWT header
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: config.credentials.private_key_id,
  };

  // JWT claims
  const claims: Record<string, string | number> = {
    iss: config.credentials.client_email,
    scope: config.scopes.join(" "),
    aud: config.credentials.token_uri,
    iat: now,
    exp: expiry,
  };

  // Add subject for domain-wide delegation if specified
  if (config.subject) {
    claims.sub = config.subject;
  }

  // Encode header and claims
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaims = base64UrlEncode(JSON.stringify(claims));
  const unsignedToken = `${encodedHeader}.${encodedClaims}`;

  // Sign with private key
  const signature = await signWithRSA(unsignedToken, config.credentials.private_key);

  return `${unsignedToken}.${signature}`;
}

/**
 * Sign data with RSA-SHA256 using the private key
 */
async function signWithRSA(data: string, privateKeyPem: string): Promise<string> {
  // Import the private key
  const key = await importPrivateKey(privateKeyPem);

  // Sign the data
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    key,
    encoder.encode(data),
  );

  return base64UrlEncode(signature);
}

/**
 * Import a PEM-encoded RSA private key
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // Extract the base64 content from PEM format
  const pemContents = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  // Decode base64 to ArrayBuffer
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Import as PKCS8
  return await crypto.subtle.importKey(
    "pkcs8",
    bytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/**
 * Base64 URL encode (RFC 4648)
 */
function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64: string;

  if (typeof data === "string") {
    base64 = btoa(data);
  } else {
    // ArrayBuffer
    const bytes = new Uint8Array(data);
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    base64 = btoa(binary);
  }

  // Convert to URL-safe base64
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Parse service account credentials from JSON string or object
 */
export function parseServiceAccountCredentials(
  input: string | ServiceAccountCredentials,
): ServiceAccountCredentials {
  const credentials = typeof input === "string" ? JSON.parse(input) : input;

  if (credentials.type !== "service_account") {
    throw new Error(
      `Invalid credentials: expected type "service_account", got "${credentials.type}"`,
    );
  }

  if (!credentials.private_key || !credentials.client_email) {
    throw new Error("Invalid credentials: missing private_key or client_email");
  }

  return credentials;
}

/**
 * Load service account credentials from a file path
 */
export async function loadServiceAccountCredentials(
  filePath: string,
): Promise<ServiceAccountCredentials> {
  const content = await Deno.readTextFile(filePath);
  return parseServiceAccountCredentials(content);
}

/**
 * Clear the token cache (useful for testing)
 */
export function clearTokenCache(): void {
  tokenCache.clear();
}
