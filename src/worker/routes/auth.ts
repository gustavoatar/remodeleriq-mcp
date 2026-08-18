import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import Stripe from "stripe";
import { getBetaUserByEmail } from "@/shared/betaUsers";
import { authMiddleware } from "../middleware/auth";
import {
  type AppEnv,
  type GoogleTokenResponse,
  type GoogleUserInfo,
  type UserProfile,
  SESSION_COOKIE_NAME,
  generateSessionToken,
  getOAuthRedirectUri,
} from "../types";

const app = new Hono<AppEnv>();

const OAUTH_STATE_COOKIE = "riq_oauth_state";

// ============================================
// AUTH ENDPOINTS (Custom Google OAuth)
// ============================================

// Get Google OAuth redirect URL
app.get("/oauth/google/redirect_url", async (c) => {
  const clientId = (c.env as any).GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    return c.json({ error: "Google OAuth not configured" }, 500);
  }

  const redirectUri = getOAuthRedirectUri();

  // CSRF guard: bind this login attempt to the browser via a state nonce.
  // Google echoes it back on the callback; /sessions verifies it against the
  // cookie so an attacker can't complete a login with an injected code.
  const state = generateSessionToken();
  setCookie(c, OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
    maxAge: 10 * 60, // one login attempt
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return c.json({ redirectUrl }, 200);
});

// Exchange OAuth code for session token
app.post("/sessions", async (c) => {
  const body = await c.req.json();
  const { code, state } = body;

  if (!code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  // Verify the state nonce set by /oauth/google/redirect_url. Tolerate a
  // missing cookie only when no state was issued (in-flight logins from
  // before this deploy); reject any mismatch outright.
  const expectedState = getCookie(c, OAUTH_STATE_COOKIE);
  if (expectedState && state !== expectedState) {
    return c.json({ error: "Invalid sign-in state. Please try signing in again." }, 400);
  }
  setCookie(c, OAUTH_STATE_COOKIE, "", {
    httpOnly: true, path: "/", sameSite: "lax", secure: true, maxAge: 0,
  });

  const clientId = (c.env as any).GOOGLE_CLIENT_ID;
  const clientSecret = (c.env as any).GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return c.json({ error: "Google OAuth not configured" }, 500);
  }

  const redirectUri = getOAuthRedirectUri();

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange error:', errorData);
      return c.json({ error: "Failed to exchange code for token" }, 400);
    }

    const tokens = await tokenResponse.json() as GoogleTokenResponse;

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return c.json({ error: "Failed to get user info" }, 400);
    }

    const googleUser = await userInfoResponse.json() as GoogleUserInfo;

    if (!googleUser.verified_email) {
      return c.json({ error: "Please verify your Google account email before signing in." }, 400);
    }

    const db = c.env.DB;

    // Find or create user profile
    let userProfile = await db.prepare(
      'SELECT * FROM user_profiles WHERE email = ?'
    ).bind(googleUser.email).first<UserProfile>();

    if (!userProfile) {
      // Create new user profile - use google_id as user_id for compatibility
      await db.prepare(
        `INSERT INTO user_profiles (user_id, email, name, google_id, google_picture, is_premium, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, 0, datetime("now"), datetime("now"))`
      ).bind(
        `google_${googleUser.id}`,
        googleUser.email,
        googleUser.name || null,
        googleUser.id,
        googleUser.picture || null
      ).run();

      userProfile = await db.prepare(
        'SELECT * FROM user_profiles WHERE email = ?'
      ).bind(googleUser.email).first<UserProfile>();
    } else {
      // Update existing profile with latest Google info
      await db.prepare(
        `UPDATE user_profiles SET 
         name = COALESCE(?, name),
         google_id = ?,
         google_picture = ?,
         updated_at = datetime("now")
         WHERE email = ?`
      ).bind(
        googleUser.name || null,
        googleUser.id,
        googleUser.picture || null,
        googleUser.email
      ).run();
    }

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60); // 60 days

    await db.prepare(
      `INSERT INTO user_sessions (user_id, session_token, expires_at, created_at) 
       VALUES (?, ?, ?, datetime("now"))`
    ).bind(userProfile!.id, sessionToken, expiresAt.toISOString()).run();

    // Set session cookie
    setCookie(c, SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 24 * 60 * 60, // 60 days
    });

    // Track login for usage analytics
    try {
      await db.prepare(
        `INSERT INTO usage_tracking (user_id, action_type, ip_address, user_agent, created_at, updated_at)
         VALUES (?, 'login', ?, ?, datetime('now'), datetime('now'))`
      ).bind(
        userProfile!.id,
        c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
        c.req.header('User-Agent') || 'unknown'
      ).run();
    } catch (e) {
      console.error('Failed to track login:', e);
    }

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error('OAuth error:', error);
    return c.json({ error: "Authentication failed" }, 500);
  }
});

// Get current user
app.get("/users/me", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  // Check if premium is active (either is_premium=1 OR premium_ends_at is in the future)
  const now = new Date().toISOString();
  const isPremiumActive = user.is_premium === 1 || 
    (user.premium_ends_at && user.premium_ends_at > now);

  // Check if this is a beta user (lifetime premium)
  const betaUser = getBetaUserByEmail(user.email);
  const isBeta = !!betaUser;

  return c.json({
    id: user.id,
    email: user.email,
    google_user_data: {
      email: user.email,
      name: user.name,
      picture: user.google_picture,
      given_name: user.name?.split(' ')[0],
    },
    profile: {
      isPremium: isPremiumActive || isBeta,
      isBetaUser: isBeta,
      betaFirstName: betaUser?.firstName,
      premiumPurchasedAt: user.premium_purchased_at,
      premiumEndsAt: user.premium_ends_at,
      name: user.name,
    }
  });
});

// Logout. Accepts POST (the client's method) and GET (legacy). GET-only
// logout was CSRF-able via a hostile <img src="/api/logout">.
app.on(["GET", "POST"], "/logout", async (c) => {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);

  if (sessionToken) {
    const db = c.env.DB;
    await db.prepare('DELETE FROM user_sessions WHERE session_token = ?').bind(sessionToken).run();
  }

  setCookie(c, SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// ============================================
// USER PROFILE ENDPOINTS
// ============================================

// Update user profile
app.patch("/users/profile", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const body = await c.req.json();
  const { name } = body;

  const db = c.env.DB;
  await db.prepare(
    'UPDATE user_profiles SET name = ?, updated_at = datetime("now") WHERE id = ?'
  ).bind(name, user.id).run();

  return c.json({ success: true });
});

// Delete account
app.delete("/users/account", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const db = c.env.DB;
  const stripeKey = (c.env as unknown as Record<string, unknown>).STRIPE_SECRET_KEY as string | undefined;

  // Cancel active Stripe subscription before deleting
  const userProfile = await db.prepare(
    'SELECT stripe_subscription_id, stripe_customer_id, email FROM user_profiles WHERE id = ?'
  ).bind(user.id).first<{ stripe_subscription_id: string | null; stripe_customer_id: string | null; email: string }>();

  if (stripeKey && userProfile?.stripe_subscription_id) {
    try {
      const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });
      await stripe.subscriptions.update(userProfile.stripe_subscription_id, { cancel_at_period_end: true });
    } catch (e) {
      console.error('Failed to cancel Stripe subscription on account delete:', e);
      // Continue with deletion even if Stripe cancel fails
    }
  }

  const userEmail = userProfile?.email || user.email;

  // Delete all related data atomically
  await db.batch([
    db.prepare('DELETE FROM user_sessions WHERE user_id = ?').bind(user.id),
    db.prepare('DELETE FROM usage_tracking WHERE user_id = ?').bind(user.id),
    db.prepare('UPDATE magic_link_tokens SET is_used = 1 WHERE email = ?').bind(userEmail),
    db.prepare('DELETE FROM user_profiles WHERE id = ?').bind(user.id),
  ]);

  setCookie(c, SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true });
});

export default app;
