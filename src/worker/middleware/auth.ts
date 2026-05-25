import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { SESSION_COOKIE_NAME, PUBLISHED_APP_URL, type AppEnv, type UserSession, type UserProfile } from "../types";

// Helper to generate a secure session token
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// For OAuth, always use the published URL to match Google Cloud Console config
export function getOAuthRedirectUri(): string {
  return `${PUBLISHED_APP_URL}/auth/callback`;
}

/**
 * Auth middleware for protected routes
 * Validates session token and attaches user to context
 */
export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
  
  if (!sessionToken) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const db = c.env.DB;
  const session = await db.prepare(
    'SELECT * FROM user_sessions WHERE session_token = ? AND expires_at > datetime("now")'
  ).bind(sessionToken).first<UserSession>();

  if (!session) {
    return c.json({ error: "Session expired" }, 401);
  }

  // Get user profile
  const user = await db.prepare(
    'SELECT * FROM user_profiles WHERE id = ?'
  ).bind(session.user_id).first<UserProfile>();

  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  c.set("user", user);
  c.set("session", session);
  await next();
}
