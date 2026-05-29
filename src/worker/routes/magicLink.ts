import { Hono } from "hono";
import { setCookie, getCookie } from "hono/cookie";
import { type AppEnv, getAppOrigin, SESSION_COOKIE_NAME } from "../types";

import { sendEmail } from "../lib/email";
// Constants
const TOKEN_EXPIRY_MINUTES = 30;
const SESSION_EXPIRY_DAYS = 60;

// Per-email rate limiter for magic-link requests (max 5 per 10 minutes per email)
// NOTE: This rate limiter is per-Worker-isolate. Cloudflare runs many isolates in parallel,
// so the effective limit per user is declared_limit × number_of_isolates.
// For production-grade rate limiting, replace with Cloudflare KV or Durable Objects.
const magicLinkRateLimit = new Map<string, { count: number; resetAt: number }>();
const MAGIC_LINK_MAX_ATTEMPTS = 5;
const MAGIC_LINK_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// Generate secure random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Email template helpers
const emailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 40px 20px; background-color: #f4f4f5; font-family: Arial, Helvetica, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
    ${content}
  </div>
</body>
</html>
`;

const emailHeader = (title: string) => `
<div style="padding: 32px 40px 24px 40px; border-bottom: 1px solid #e4e4e7;">
  <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #18181b;">${title}</h1>
</div>
`;

const emailBody = (content: string) => `
<div style="padding: 32px 40px;">
  ${content}
</div>
`;

const emailFooter = (text: string) => `
<div style="padding: 24px 40px; border-top: 1px solid #e4e4e7;">
  <p style="margin: 0; font-size: 12px; color: #71717a; text-align: center;">${text}</p>
</div>
`;

const app = new Hono<AppEnv>();

// ============================================
// MAGIC LINK AUTHENTICATION ENDPOINTS
// ============================================

// Request a magic link - sends email with login link
app.post("/auth/magic-link/request", async (c) => {
  const { email } = await c.req.json();
  
  if (!email || typeof email !== 'string') {
    return c.json({ error: "Email is required" }, 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return c.json({ error: "Invalid email format" }, 400);
  }

  // Per-email rate limit: max 5 requests per 10 minutes
  const now = Date.now();
  let rl = magicLinkRateLimit.get(normalizedEmail);
  if (!rl || rl.resetAt < now) {
    rl = { count: 0, resetAt: now + MAGIC_LINK_WINDOW_MS };
    magicLinkRateLimit.set(normalizedEmail, rl);
  }
  rl.count++;
  if (rl.count > MAGIC_LINK_MAX_ATTEMPTS) {
    return c.json({ error: "Too many sign-in attempts. Please wait 10 minutes and try again." }, 429);
  }

  const db = c.env.DB;
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate any existing unused tokens for this email
  await db.prepare(
    'UPDATE magic_link_tokens SET is_used = 1, updated_at = datetime("now") WHERE email = ? AND is_used = 0'
  ).bind(normalizedEmail).run();

  // Store new token in database
  await db.prepare(
    'INSERT INTO magic_link_tokens (email, token, expires_at, created_at, updated_at) VALUES (?, ?, ?, datetime("now"), datetime("now"))'
  ).bind(normalizedEmail, token, expiresAt.toISOString()).run();

  // Build magic link URL
  const origin = getAppOrigin(c);
  const magicLink = `${origin}/auth/verify?token=${token}`;

  // Send email
  try {
    console.log(`Attempting to send magic link to ${normalizedEmail}`);
    
    const result = await sendEmail(c.env, {
      to: normalizedEmail,
      subject: "Sign in to RemodelerIQ",
      html_body: emailTemplate(`
        ${emailHeader("Sign in to RemodelerIQ")}
        ${emailBody(`
          <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #3f3f46;">
            Click the button below to sign in to your RemodelerIQ account. This link will expire in ${TOKEN_EXPIRY_MINUTES} minutes.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${magicLink}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Sign In to RemodelerIQ
            </a>
          </div>
          <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #71717a;">
            If you didn't request this link, you can safely ignore this email.
          </p>
        `)}
        ${emailFooter("— The RemodelerIQ Team")}
      `),
      text_body: `Sign in to RemodelerIQ\n\nClick this link to sign in: ${magicLink}\n\nThis link expires in ${TOKEN_EXPIRY_MINUTES} minutes.\n\nIf you didn't request this link, you can safely ignore this email.\n\n— The RemodelerIQ Team`,
    });

    console.log(`Email send result for ${normalizedEmail}:`, JSON.stringify(result));

    if (result && result.success === true) {
      console.log(`Magic link sent successfully to ${normalizedEmail}, message_id: ${result.message_id}`);
      return c.json({ success: true, message: "Check your email for a sign-in link" });
    } else {
      const errorMsg = result?.error || 'Unknown error - email service did not confirm delivery';
      console.error(`Failed to send magic link to ${normalizedEmail}:`, errorMsg);
      return c.json({ error: "Unable to send email. Please try Google sign-in or contact support." }, 500);
    }
  } catch (err: any) {
    console.error(`Error sending magic link to ${normalizedEmail}:`, err?.message || err);
    return c.json({ error: "Unable to send email. Please try Google sign-in or contact support." }, 500);
  }
});

// Verify magic link token and create session
app.get("/auth/magic-link/verify", async (c) => {
  const token = c.req.query("token");
  
  if (!token) {
    return c.json({ error: "Token is required" }, 400);
  }

  const db = c.env.DB;

  // Find token
  const tokenRecord = await db.prepare(
    'SELECT * FROM magic_link_tokens WHERE token = ?'
  ).bind(token).first() as { id: number; email: string; expires_at: string; is_used: number } | null;

  if (!tokenRecord) {
    return c.json({ error: "Invalid or expired link" }, 400);
  }

  // Check if already used
  if (tokenRecord.is_used) {
    return c.json({ error: "This link has already been used or a newer link was requested. Please check for a more recent email." }, 400);
  }

  // Check expiration
  if (new Date(tokenRecord.expires_at) < new Date()) {
    return c.json({ error: "This link has expired. Please request a new one." }, 400);
  }

  const email = tokenRecord.email;

  // Mark token as used
  await db.prepare(
    'UPDATE magic_link_tokens SET is_used = 1, updated_at = datetime("now") WHERE id = ?'
  ).bind(tokenRecord.id).run();

  // Find or create user profile
  let userProfile = await db.prepare(
    'SELECT * FROM user_profiles WHERE email = ?'
  ).bind(email).first() as { id: number; email: string; name: string | null; is_premium: number; premium_ends_at: string | null } | null;

  if (!userProfile) {
    // Create new user profile
    const result = await db.prepare(
      'INSERT INTO user_profiles (email, user_id, created_at, updated_at) VALUES (?, ?, datetime("now"), datetime("now"))'
    ).bind(email, `magic_${Date.now()}`).run();
    
    userProfile = await db.prepare(
      'SELECT * FROM user_profiles WHERE id = ?'
    ).bind(result.meta.last_row_id).first() as typeof userProfile;
  }

  if (!userProfile) {
    return c.json({ error: "Failed to create user profile" }, 500);
  }

  // Create session
  const sessionToken = generateToken();
  const sessionExpiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await db.prepare(
    'INSERT INTO user_sessions (user_id, session_token, expires_at, created_at) VALUES (?, ?, ?, datetime("now"))'
  ).bind(userProfile.id, sessionToken, sessionExpiresAt.toISOString()).run();

  // Set session cookie
  setCookie(c, SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
  });

  // Track login for usage analytics
  try {
    await db.prepare(
      `INSERT INTO usage_tracking (user_id, action_type, ip_address, user_agent, created_at, updated_at)
       VALUES (?, 'login', ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      userProfile.id,
      c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
      c.req.header('User-Agent') || 'unknown'
    ).run();
  } catch (e) {
    console.error('Failed to track login:', e);
  }

  // Return user info — session is set as httpOnly cookie above (web clients use the cookie)
  return c.json({
    success: true,
    user: {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      isPremium: userProfile.is_premium === 1,
      premiumEndsAt: userProfile.premium_ends_at,
    }
  });
});

// Get current user from magic link session
app.get("/auth/me", async (c) => {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
  
  if (!sessionToken) {
    return c.json({ user: null });
  }

  const db = c.env.DB;

  // Find valid session
  const session = await db.prepare(
    'SELECT * FROM user_sessions WHERE session_token = ? AND expires_at > datetime("now")'
  ).bind(sessionToken).first() as { user_id: number } | null;

  if (!session) {
    // Clear invalid cookie
    setCookie(c, SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
      maxAge: 0,
    });
    return c.json({ user: null });
  }

  // Get user profile
  const userProfile = await db.prepare(
    'SELECT * FROM user_profiles WHERE id = ?'
  ).bind(session.user_id).first() as { id: number; email: string; name: string | null; is_premium: number; premium_ends_at: string | null } | null;

  if (!userProfile) {
    return c.json({ user: null });
  }

  return c.json({ 
    user: {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      isPremium: userProfile.is_premium === 1,
      premiumEndsAt: userProfile.premium_ends_at,
    }
  });
});

// Logout - clear session and invalidate pending magic-link tokens
app.post("/auth/logout", async (c) => {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);

  if (sessionToken) {
    const db = c.env.DB;

    // Get user email before deleting the session
    const session = await db.prepare(
      'SELECT up.email FROM user_sessions us JOIN user_profiles up ON us.user_id = up.id WHERE us.session_token = ?'
    ).bind(sessionToken).first() as { email: string } | null;

    await db.prepare('DELETE FROM user_sessions WHERE session_token = ?').bind(sessionToken).run();

    // Invalidate any pending magic-link tokens for this user
    if (session?.email) {
      await db.prepare(
        'UPDATE magic_link_tokens SET is_used = 1, updated_at = datetime("now") WHERE email = ? AND is_used = 0'
      ).bind(session.email).run();
    }
  }

  // Clear cookie
  setCookie(c, SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true });
});

// Diagnostic test endpoint - sends a simple test email (admin only)
app.get("/auth/test-email", async (c) => {
  const adminSecret = (c.env as unknown as Record<string, unknown>).ADMIN_SECRET as string | undefined;
  const providedSecret = c.req.query("secret");
  if (!adminSecret || !providedSecret || providedSecret !== adminSecret) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const email = c.req.query("email");

  if (!email) {
    return c.json({ error: "Add ?email=your@email.com to test" }, 400);
  }

  try {
    console.log(`[TEST] Sending test email to: ${email}`);
    
    const result = await sendEmail(c.env, {
      to: email,
      subject: "RemodelerIQ Email Test",
      html_body: emailTemplate(`
        ${emailHeader("Email Test Successful! ✓")}
        ${emailBody(`
          <p style="font-size: 16px; color: #3f3f46;">
            If you're reading this, email is working correctly for <strong>${email}</strong>.
          </p>
          <p style="font-size: 14px; color: #71717a; margin-top: 16px;">
            Sent at: ${new Date().toISOString()}
          </p>
        `)}
        ${emailFooter("— RemodelerIQ Email Test")}
      `),
      text_body: `Email test successful! If you're reading this, email is working correctly for ${email}. Sent at: ${new Date().toISOString()}`,
    });

    console.log(`[TEST] Email result:`, JSON.stringify(result));

    return c.json({
      success: result?.success === true,
      message_id: result?.message_id,
      raw_result: result,
      tested_email: email,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error(`[TEST] Email error:`, err?.message || err);
    return c.json({
      success: false,
      error: err?.message || "Unknown error",
      tested_email: email,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

export default app;
export { generateToken, emailTemplate, emailHeader, emailBody, emailFooter };
