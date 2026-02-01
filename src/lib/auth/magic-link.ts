/**
 * Stateless magic link implementation for demo purposes.
 * Encodes email and expiry directly in the token (no database needed).
 *
 * For production, you would store tokens in a database to:
 * - Track usage (prevent reuse)
 * - Allow revocation
 * - Add rate limiting
 */

const MAGIC_LINK_EXPIRY_MINUTES = 15;
const SECRET_KEY = process.env.MAGIC_LINK_SECRET || 'demo-secret-key-change-in-production';

interface TokenPayload {
  email: string;
  exp: number; // expiry timestamp
  iat: number; // issued at timestamp
}

/**
 * Simple encoding/decoding using base64 with a signature
 * For production, use a proper JWT library
 */
function encodeToken(payload: TokenPayload): string {
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr).toString('base64url');

  // Simple HMAC-like signature (for demo - use crypto.subtle in production)
  const signatureData = `${payloadB64}.${SECRET_KEY}`;
  const signature = Buffer.from(signatureData).toString('base64url').slice(0, 16);

  return `${payloadB64}.${signature}`;
}

function decodeToken(token: string): TokenPayload | null {
  try {
    const [payloadB64, signature] = token.split('.');

    if (!payloadB64 || !signature) {
      return null;
    }

    // Verify signature
    const expectedSignatureData = `${payloadB64}.${SECRET_KEY}`;
    const expectedSignature = Buffer.from(expectedSignatureData).toString('base64url').slice(0, 16);

    if (signature !== expectedSignature) {
      return null;
    }

    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    return JSON.parse(payloadStr) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Generate a magic link for passwordless authentication
 * @param email - The email address to send the magic link to
 * @param baseUrl - The base URL for the magic link (from request headers)
 * @returns The token and full URL for the magic link
 */
export function generateMagicLink(email: string, baseUrl?: string): { token: string; url: string } {
  const now = Date.now();
  const exp = now + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000;

  const payload: TokenPayload = {
    email: email.toLowerCase().trim(),
    exp,
    iat: now,
  };

  const token = encodeToken(payload);

  // Use provided baseUrl, or fall back to env var, or default to localhost
  const finalBaseUrl = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const url = `${finalBaseUrl}/auth/verify?token=${encodeURIComponent(token)}`;

  return { token, url };
}

/**
 * Verify a magic link token and return the email
 * @param token - The magic link token to verify
 * @returns The email if valid, null otherwise
 */
export function verifyMagicLink(token: string): { email: string; name: string } | null {
  const payload = decodeToken(token);

  if (!payload) {
    return null;
  }

  // Check expiry
  if (Date.now() > payload.exp) {
    return null;
  }

  // Return email and derive name from it
  return {
    email: payload.email,
    name: payload.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  };
}

/**
 * Check if a magic link token is valid without consuming it
 * @param token - The magic link token to check
 * @returns True if the token is valid, false otherwise
 */
export function isValidMagicLink(token: string): boolean {
  const payload = decodeToken(token);

  if (!payload) {
    return false;
  }

  return Date.now() <= payload.exp;
}
