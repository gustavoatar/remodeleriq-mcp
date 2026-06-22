import { Hono } from "hono";
import Stripe from "stripe";
import { authMiddleware } from "../middleware/auth";
import { type AppEnv, getAppOrigin } from "../types";
import { generateToken } from "./magicLink";

import { sendEmail } from "../lib/email";
const TOKEN_EXPIRY_MINUTES = 60; // Magic link expires in 1 hour for welcome emails

// Subscription tier types
type SubscriptionTier = 'free' | 'project' | 'remodeler' | 'lifetime';
type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'expired';

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

// Get plan display name
function getPlanDisplayName(tier: SubscriptionTier): string {
  switch (tier) {
    case 'project': return 'Project Pass';
    case 'remodeler': return 'Remodeler Pass';
    case 'lifetime': return 'Lifetime Pass';
    default: return 'Premium';
  }
}

// Get tier price for owner notification display
function getTierPrice(tier: SubscriptionTier): string {
  switch (tier) {
    case 'project': return '$19.99/month';
    case 'remodeler': return '$39.99/quarter';
    case 'lifetime': return '$99.99 one-time';
    default: return '';
  }
}

// Send internal owner alert on any new premium conversion
async function sendOwnerPremiumAlert(
  env: AppEnv['Bindings'],
  customerEmail: string,
  customerName: string | null,
  tier: SubscriptionTier,
  isGuest: boolean,
  origin: string
) {
  const planName = getPlanDisplayName(tier);
  const price = getTierPrice(tier);
  const displayName = customerName || customerEmail.split('@')[0];
  const adminUrl = `${origin}/admin`;
  const now = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' });

  try {
    await sendEmail(env, {
      to: 'gustavo@remodeleriq.com',
      subject: `🎉 New Premium: ${displayName} — ${planName} (${price})`,
      html_body: emailTemplate(`
        ${emailHeader('🎉 New Premium Signup')}
        ${emailBody(`
          <table style="width: 100%; border-collapse: collapse; font-size: 15px; color: #3f3f46;">
            <tr><td style="padding: 8px 0; font-weight: 600; width: 140px;">Customer</td><td style="padding: 8px 0;">${displayName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Email</td><td style="padding: 8px 0;">${customerEmail}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Plan</td><td style="padding: 8px 0;">${planName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Price</td><td style="padding: 8px 0;">${price}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Account type</td><td style="padding: 8px 0;">${isGuest ? 'Guest checkout (no login)' : 'Registered user'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Time</td><td style="padding: 8px 0;">${now} ET</td></tr>
          </table>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${adminUrl}" style="display: inline-block; background-color: #1F9C4C; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
              View Admin Dashboard
            </a>
          </div>
          <p style="font-size: 13px; color: #71717a; text-align: center; margin: 0;">
            Reply to <a href="mailto:${customerEmail}" style="color: #10b981;">${customerEmail}</a> to send a personal thank-you.
          </p>
        `)}
        ${emailFooter('RemodelerIQ — internal notification')}
      `),
      text_body: `New premium signup!\n\nCustomer: ${displayName}\nEmail: ${customerEmail}\nPlan: ${planName} (${price})\nAccount: ${isGuest ? 'Guest checkout' : 'Registered user'}\nTime: ${now} ET\n\nDashboard: ${adminUrl}`,
    });
  } catch (err) {
    console.error('Owner premium alert failed:', err);
    // Non-critical — don't let this block the webhook response
  }
}

// Get billing period description
function getBillingPeriod(tier: SubscriptionTier): string {
  switch (tier) {
    case 'project': return 'monthly';
    case 'remodeler': return 'every 3 months';
    case 'lifetime': return 'one-time purchase';
    default: return '';
  }
}

// Send subscription welcome email with magic link for easy sign-in
async function sendSubscriptionWelcomeEmail(
  env: AppEnv['Bindings'],
  email: string,
  firstName: string,
  tier: SubscriptionTier,
  periodEnd: Date,
  origin: string
) {
  const formattedDate = periodEnd.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const planName = getPlanDisplayName(tier);
  const billingPeriod = getBillingPeriod(tier);

  // Generate magic link token for easy sign-in
  const token = generateToken();
  const tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);
  
  // Store token in database
  await env.DB.prepare(
    'INSERT INTO magic_link_tokens (email, token, expires_at, created_at, updated_at) VALUES (?, ?, ?, datetime("now"), datetime("now"))'
  ).bind(email.toLowerCase().trim(), token, tokenExpiresAt.toISOString()).run();
  
  const magicLink = `${origin}/auth/verify?token=${token}&welcome=true`;

  const result = await sendEmail(env, {
    to: email,
    subject: `Welcome to RemodelerIQ ${planName}! 🔑`,
    html_body: emailTemplate(`
      ${emailHeader(`Welcome ${firstName} to RemodelerIQ ${planName}! 🔑`)}
      ${emailBody(`
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #3f3f46;">
          Hello ${firstName},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #3f3f46;">
          Thanks for subscribing to RemodelerIQ ${planName}!
        </p>
        <p style="margin: 0 0 12px 0; font-size: 16px; line-height: 24px; color: #3f3f46; font-weight: 600;">
          You have unlocked:
        </p>
        <ul style="margin: 0 0 24px 0; padding-left: 24px; font-size: 16px; line-height: 28px; color: #3f3f46;">
          <li>Unlimited Bid Analyses</li>
          <li>Full AI-Powered Insights</li>
          <li>Priority Support</li>
        </ul>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${origin}/?view=upload" style="display: inline-block; background-color: #1F9C4C; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Analyze Bids
          </a>
        </div>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #3f3f46;">
          Your subscription is active now. Next billing date: <strong>${formattedDate}</strong> (billed ${billingPeriod}).
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${magicLink}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Sign In & Get Started
          </a>
        </div>
        <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 20px; color: #71717a; text-align: center;">
          This sign-in link expires in 1 hour.
        </p>
        <p style="margin: 24px 0 0 0; font-size: 16px; line-height: 24px; color: #3f3f46;">
          If you have any questions, feel free to email us at <a href="mailto:help@remodeleriq.com" style="color: #10b981;">help@remodeleriq.com</a>
        </p>
      `)}
      ${emailFooter("— The RemodelerIQ Team")}
    `),
    text_body: `Hello ${firstName},\n\nThanks for subscribing to RemodelerIQ ${planName}!\n\nYou have unlocked:\n• Unlimited Bid Analyses\n• Full AI-Powered Insights\n• Priority Support\n\nYour subscription is active now. Next billing date: ${formattedDate} (billed ${billingPeriod}).\n\nSign in here: ${magicLink}\n(This link expires in 1 hour)\n\nIf you have any questions, feel free to email us at help@remodeleriq.com\n\n— The RemodelerIQ Team`,
  });

  return result;
}

// Legacy: Send premium welcome email (for backward compatibility)
async function sendPremiumWelcomeEmail(
  env: AppEnv['Bindings'],
  email: string,
  firstName: string,
  premiumEndsAt: Date,
  origin: string
) {
  return sendSubscriptionWelcomeEmail(env, email, firstName, 'project', premiumEndsAt, origin);
}

// Send lifetime pass welcome email
async function sendLifetimeWelcomeEmail(
  env: AppEnv['Bindings'],
  email: string,
  firstName: string,
  origin: string
) {
  // Generate magic link token for easy sign-in
  const token = generateToken();
  const tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);
  
  // Store token in database
  await env.DB.prepare(
    'INSERT INTO magic_link_tokens (email, token, expires_at, created_at, updated_at) VALUES (?, ?, ?, datetime("now"), datetime("now"))'
  ).bind(email.toLowerCase().trim(), token, tokenExpiresAt.toISOString()).run();
  
  const magicLink = `${origin}/auth/verify?token=${token}&welcome=true`;

  const result = await sendEmail(env, {
    to: email,
    subject: `Welcome to RemodelerIQ Lifetime Pass! 🎉`,
    html_body: emailTemplate(`
      ${emailHeader(`Welcome ${firstName} to RemodelerIQ Lifetime Pass! 🎉`)}
      ${emailBody(`
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #3f3f46;">
          Hello ${firstName},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #3f3f46;">
          Thank you for becoming a Lifetime member! You now have <strong>permanent access</strong> to all RemodelerIQ features.
        </p>
        <p style="margin: 0 0 12px 0; font-size: 16px; line-height: 24px; color: #3f3f46; font-weight: 600;">
          Your Lifetime Pass includes:
        </p>
        <ul style="margin: 0 0 24px 0; padding-left: 24px; font-size: 16px; line-height: 28px; color: #3f3f46;">
          <li>Unlimited Bid Analyses — forever</li>
          <li>All Premium Tools & Features</li>
          <li>Sneak Peek Access to New Tools</li>
          <li>Beta Program Invites</li>
          <li>Launch Party Invitations</li>
          <li>Priority Support</li>
        </ul>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${origin}/?view=upload" style="display: inline-block; background-color: #1F9C4C; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Start Analyzing Bids
          </a>
        </div>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #3f3f46;">
          No renewal needed — your access never expires!
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${magicLink}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Sign In & Get Started
          </a>
        </div>
        <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 20px; color: #71717a; text-align: center;">
          This sign-in link expires in 1 hour.
        </p>
        <p style="margin: 24px 0 0 0; font-size: 16px; line-height: 24px; color: #3f3f46;">
          Questions? Email us at <a href="mailto:help@remodeleriq.com" style="color: #10b981;">help@remodeleriq.com</a>
        </p>
      `)}
      ${emailFooter("— The RemodelerIQ Team")}
    `),
    text_body: `Hello ${firstName},\n\nThank you for becoming a Lifetime member! You now have permanent access to all RemodelerIQ features.\n\nYour Lifetime Pass includes:\n• Unlimited Bid Analyses — forever\n• All Premium Tools & Features\n• Sneak Peek Access to New Tools\n• Beta Program Invites\n• Launch Party Invitations\n• Priority Support\n\nNo renewal needed — your access never expires!\n\nSign in here: ${magicLink}\n(This link expires in 1 hour)\n\nQuestions? Email us at help@remodeleriq.com\n\n— The RemodelerIQ Team`,
  });

  return result;
}

const app = new Hono<AppEnv>();

// ============================================
// STRIPE PAYMENT ENDPOINTS
// ============================================

// Create subscription checkout - Project Pass ($19.99/month)
app.post("/subscription/project-pass", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const stripeKey = (c.env as unknown as Record<string, unknown>).STRIPE_SECRET_KEY as string | undefined;
  const projectPassPriceId = (c.env as unknown as Record<string, unknown>).STRIPE_PROJECT_PASS as string | undefined;
  
  if (!stripeKey) {
    console.error('Stripe checkout error: STRIPE_SECRET_KEY not configured');
    return c.json({ error: "Payment processing not configured. Please contact support." }, 500);
  }
  if (!projectPassPriceId) {
    console.error('Stripe checkout error: STRIPE_PROJECT_PASS price ID not configured');
    return c.json({ error: "Product not configured. Please contact support." }, 500);
  }

  console.log('Creating Project Pass subscription for user:', user.id, user.email);

  const stripe = new Stripe(stripeKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });

  try {
    const origin = getAppOrigin(c);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: projectPassPriceId, quantity: 1 }],
      success_url: `${origin}/settings?payment=success&plan=project`,
      cancel_url: `${origin}/join?payment=cancelled`,
      customer_email: user.email,
      metadata: {
        userId: user.id.toString(),
        userEmail: user.email,
        tier: 'project',
      },
    });

    console.log('Project Pass checkout session created:', session.id);
    return c.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err?.message || err);
    return c.json({ error: `Failed to create checkout session: ${err?.message || 'Unknown error'}` }, 500);
  }
});

// Create subscription checkout - Remodeler Pass ($39.99/3 months)
app.post("/subscription/remodeler-pass", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const stripeKey = (c.env as unknown as Record<string, unknown>).STRIPE_SECRET_KEY as string | undefined;
  const remodelerPassPriceId = (c.env as unknown as Record<string, unknown>).STRIPE_REMODELER_PASS as string | undefined;
  
  if (!stripeKey) {
    console.error('Stripe checkout error: STRIPE_SECRET_KEY not configured');
    return c.json({ error: "Payment processing not configured. Please contact support." }, 500);
  }
  if (!remodelerPassPriceId) {
    console.error('Stripe checkout error: STRIPE_REMODELER_PASS price ID not configured');
    return c.json({ error: "Product not configured. Please contact support." }, 500);
  }

  console.log('Creating Remodeler Pass subscription for user:', user.id, user.email);

  const stripe = new Stripe(stripeKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });

  try {
    const origin = getAppOrigin(c);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: remodelerPassPriceId, quantity: 1 }],
      success_url: `${origin}/settings?payment=success&plan=remodeler`,
      cancel_url: `${origin}/join?payment=cancelled`,
      customer_email: user.email,
      metadata: {
        userId: user.id.toString(),
        userEmail: user.email,
        tier: 'remodeler',
      },
    });

    console.log('Remodeler Pass checkout session created:', session.id);
    return c.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err?.message || err);
    return c.json({ error: `Failed to create checkout session: ${err?.message || 'Unknown error'}` }, 500);
  }
});

// Guest subscription checkout - Project Pass (no auth required)
app.post("/subscription/guest/project-pass", async (c) => {
  const stripeKey = (c.env as unknown as Record<string, unknown>).STRIPE_SECRET_KEY as string | undefined;
  const projectPassPriceId = (c.env as unknown as Record<string, unknown>).STRIPE_PROJECT_PASS as string | undefined;
  
  if (!stripeKey || !projectPassPriceId) {
    return c.json({ error: "Payment processing not configured." }, 500);
  }

  const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });

  try {
    const origin = getAppOrigin(c);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: projectPassPriceId, quantity: 1 }],
      success_url: `${origin}/settings?payment=success&plan=project&guest=true`,
      cancel_url: `${origin}/join?payment=cancelled`,
      metadata: { guestCheckout: "true", tier: 'project' },
    });

    return c.json({ url: session.url });
  } catch (err: any) {
    return c.json({ error: `Failed to create checkout session: ${err?.message || 'Unknown error'}` }, 500);
  }
});

// Guest subscription checkout - Remodeler Pass (no auth required)
app.post("/subscription/guest/remodeler-pass", async (c) => {
  const stripeKey = (c.env as unknown as Record<string, unknown>).STRIPE_SECRET_KEY as string | undefined;
  const remodelerPassPriceId = (c.env as unknown as Record<string, unknown>).STRIPE_REMODELER_PASS as string | undefined;
  
  if (!stripeKey || !remodelerPassPriceId) {
    return c.json({ error: "Payment processing not configured." }, 500);
  }

  const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });

  try {
    const origin = getAppOrigin(c);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: remodelerPassPriceId, quantity: 1 }],
      success_url: `${origin}/settings?payment=success&plan=remodeler&guest=true`,
      cancel_url: `${origin}/join?payment=cancelled`,
      metadata: { guestCheckout: "true", tier: 'remodeler' },
    });

    return c.json({ url: session.url });
  } catch (err: any) {
    return c.json({ error: `Failed to create checkout session: ${err?.message || 'Unknown error'}` }, 500);
  }
});

// Create checkout - Lifetime Pass ($99.99 one-time)
app.post("/subscription/lifetime-pass", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const stripeKey = (c.env as unknown as Record<string, unknown>).STRIPE_SECRET_KEY as string | undefined;
  const lifetimePassPriceId = (c.env as unknown as Record<string, unknown>).STRIPE_LIFETIME_PASS as string | undefined;
  
  if (!stripeKey) {
    console.error('Stripe checkout error: STRIPE_SECRET_KEY not configured');
    return c.json({ error: "Payment processing not configured. Please contact support." }, 500);
  }
  if (!lifetimePassPriceId) {
    console.error('Stripe checkout error: STRIPE_LIFETIME_PASS price ID not configured');
    return c.json({ error: "Product not configured. Please contact support." }, 500);
  }

  console.log('Creating Lifetime Pass checkout for user:', user.id, user.email);

  const stripe = new Stripe(stripeKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });

  try {
    const origin = getAppOrigin(c);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: lifetimePassPriceId, quantity: 1 }],
      success_url: `${origin}/settings?payment=success&plan=lifetime`,
      cancel_url: `${origin}/join?payment=cancelled`,
      customer_email: user.email,
      metadata: {
        userId: user.id.toString(),
        userEmail: user.email,
        tier: 'lifetime',
      },
    });

    console.log('Lifetime Pass checkout session created:', session.id);
    return c.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err?.message || err);
    return c.json({ error: `Failed to create checkout session: ${err?.message || 'Unknown error'}` }, 500);
  }
});

// Guest checkout - Lifetime Pass (no auth required)
app.post("/subscription/guest/lifetime-pass", async (c) => {
  const stripeKey = (c.env as unknown as Record<string, unknown>).STRIPE_SECRET_KEY as string | undefined;
  const lifetimePassPriceId = (c.env as unknown as Record<string, unknown>).STRIPE_LIFETIME_PASS as string | undefined;
  
  if (!stripeKey || !lifetimePassPriceId) {
    return c.json({ error: "Payment processing not configured." }, 500);
  }

  const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });

  try {
    const origin = getAppOrigin(c);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: lifetimePassPriceId, quantity: 1 }],
      success_url: `${origin}/settings?payment=success&plan=lifetime&guest=true`,
      cancel_url: `${origin}/join?payment=cancelled`,
      metadata: { guestCheckout: "true", tier: 'lifetime' },
    });

    return c.json({ url: session.url });
  } catch (err: any) {
    return c.json({ error: `Failed to create checkout session: ${err?.message || 'Unknown error'}` }, 500);
  }
});

// /premium/checkout and /premium/guest-checkout removed — use /api/subscription/project-pass or /api/subscription/remodeler-pass

// Stripe webhook handler - supports subscriptions
app.post("/webhooks/stripe", async (c) => {
  const stripeKey = (c.env as unknown as Record<string, unknown>).STRIPE_SECRET_KEY as string | undefined;
  const webhookSecret = (c.env as unknown as Record<string, unknown>).STRIPE_WEBHOOK_SECRET as string | undefined;
  
  if (!stripeKey || !webhookSecret) {
    console.error('Stripe keys not configured');
    return c.text("Webhook not configured", 500);
  }

  const stripe = new Stripe(stripeKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });
  const body = await c.req.text();
  const sig = c.req.header("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return c.text("Invalid signature", 400);
  }

  const db = c.env.DB;
  const origin = getAppOrigin(c);

  console.log(`Webhook received: ${event.type}`);

  // Idempotency: skip already-processed events
  const existing = await db.prepare('SELECT id FROM stripe_event_ids WHERE event_id = ?').bind(event.id).first();
  if (existing) {
    console.log(`Webhook duplicate skipped: ${event.id}`);
    return c.json({ received: true });
  }
  await db.prepare('INSERT OR IGNORE INTO stripe_event_ids (event_id, created_at) VALUES (?, datetime("now"))').bind(event.id).run();

  // Fire-and-forget: clean up events older than 30 days
  c.executionCtx?.waitUntil(
    db.prepare("DELETE FROM stripe_event_ids WHERE created_at < datetime('now', '-30 days')").run()
  );

  // Helper to activate subscription for a user
  async function activateSubscription(
    email: string,
    name: string | null,
    subscriptionId: string,
    tier: SubscriptionTier,
    periodEnd: Date,
    isGuest: boolean = false
  ) {
    const existingUser = await db.prepare('SELECT id FROM user_profiles WHERE email = ?').bind(email).first();
    
    if (existingUser) {
      await db.prepare(`
        UPDATE user_profiles SET 
          is_premium = 1, 
          subscription_tier = ?,
          subscription_status = 'active',
          stripe_subscription_id = ?,
          current_period_end = ?,
          premium_purchased_at = datetime("now"),
          updated_at = datetime("now")
        WHERE email = ?
      `).bind(tier, subscriptionId, periodEnd.toISOString(), email).run();
      console.log(`Updated user ${email} to ${tier} subscription`);
    } else if (isGuest) {
      const guestUserId = `guest_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const guestName = name || email.split('@')[0];
      await db.prepare(`
        INSERT INTO user_profiles (user_id, email, name, is_premium, subscription_tier, subscription_status, stripe_subscription_id, current_period_end, premium_purchased_at, created_at, updated_at) 
        VALUES (?, ?, ?, 1, ?, 'active', ?, ?, datetime("now"), datetime("now"), datetime("now"))
      `).bind(guestUserId, email, guestName, tier, subscriptionId, periodEnd.toISOString()).run();
      console.log(`Created guest user ${email} with ${tier} subscription`);
    }
    
    // Send welcome email
    try {
      const firstName = (name?.split(' ')[0] || email.split('@')[0].split(/[._0-9]/)[0]);
      const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      const emailResult = await sendSubscriptionWelcomeEmail(c.env, email, capitalizedName, tier, periodEnd, origin);
      if (emailResult.success) {
        console.log(`Welcome email sent to ${email}`);
      }
    } catch (emailErr) {
      console.error(`Failed to send welcome email:`, emailErr);
    }
  }

  // Handle checkout.session.completed (new subscriptions)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (session.mode === 'subscription' && session.subscription) {
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
      const tier = (session.metadata?.tier || 'project') as SubscriptionTier;
      const customerEmail = session.metadata?.userEmail || session.customer_details?.email;
      const customerName = session.customer_details?.name;
      const isGuest = session.metadata?.guestCheckout === 'true';
      
      if (customerEmail) {
        // Fetch subscription details for period end
        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
        const periodEnd = new Date((subscription as any).current_period_end * 1000);

        await activateSubscription(customerEmail, customerName || null, subscriptionId, tier, periodEnd, isGuest);

        // Notify owner of new premium conversion (fire-and-forget)
        c.executionCtx.waitUntil(
          sendOwnerPremiumAlert(c.env, customerEmail, customerName || null, tier, isGuest, origin)
        );
      }
    } else if (session.mode === 'payment') {
      // One-time payment handling (Lifetime Pass or legacy)
      const userId = session.metadata?.userId;
      const userEmail = session.metadata?.userEmail;
      const tier = session.metadata?.tier;
      const isGuestCheckout = session.metadata?.guestCheckout === "true";
      const customerEmail = userEmail || session.customer_details?.email;
      const customerName = session.customer_details?.name;
      
      // Handle Lifetime Pass purchases
      if (tier === 'lifetime' && customerEmail) {
        const lifetimeEnd = new Date('2099-12-31');
        
        const existingUser = await db.prepare('SELECT id FROM user_profiles WHERE email = ?').bind(customerEmail).first();
        
        if (existingUser) {
          await db.prepare(`
            UPDATE user_profiles SET 
              is_premium = 1,
              subscription_tier = 'lifetime',
              subscription_status = 'active',
              current_period_end = ?,
              premium_purchased_at = datetime("now"),
              stripe_session_id = ?,
              updated_at = datetime("now")
            WHERE email = ?
          `).bind(lifetimeEnd.toISOString(), session.id, customerEmail).run();
          console.log(`Updated user ${customerEmail} to lifetime pass`);
        } else {
          const guestUserId = `guest_${customerEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          const guestName = customerName || customerEmail.split('@')[0];
          await db.prepare(`
            INSERT INTO user_profiles (user_id, email, name, is_premium, subscription_tier, subscription_status, current_period_end, premium_purchased_at, stripe_session_id, created_at, updated_at) 
            VALUES (?, ?, ?, 1, 'lifetime', 'active', ?, datetime("now"), ?, datetime("now"), datetime("now"))
          `).bind(guestUserId, customerEmail, guestName, lifetimeEnd.toISOString(), session.id).run();
          console.log(`Created user ${customerEmail} with lifetime pass`);
        }
        
        // Send lifetime welcome email + owner alert
        try {
          const firstName = (customerName?.split(' ')[0] || customerEmail.split('@')[0].split(/[._0-9]/)[0]);
          const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
          const emailResult = await sendLifetimeWelcomeEmail(c.env, customerEmail, capitalizedName, origin);
          if (emailResult.success) {
            console.log(`Lifetime welcome email sent to ${customerEmail}`);
          }
        } catch (emailErr) {
          console.error(`Failed to send lifetime welcome email:`, emailErr);
        }

        // Notify owner of new lifetime conversion (fire-and-forget)
        c.executionCtx.waitUntil(
          sendOwnerPremiumAlert(c.env, customerEmail, customerName || null, 'lifetime', isGuestCheckout, origin)
        );
      } else if (userId && userEmail) {
        const premiumEndsAt = new Date();
        premiumEndsAt.setFullYear(premiumEndsAt.getFullYear() + 1);
        
        await db.prepare(
          'UPDATE user_profiles SET is_premium = 1, subscription_status = ?, subscription_tier = ?, premium_purchased_at = datetime("now"), premium_ends_at = ?, stripe_session_id = ?, updated_at = datetime("now") WHERE id = ?'
        ).bind('active', 'premium', premiumEndsAt.toISOString(), session.id, parseInt(userId)).run();
        
        const firstName = userEmail.split('@')[0].split(/[._0-9]/)[0];
        const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
        await sendPremiumWelcomeEmail(c.env, userEmail, capitalizedName, premiumEndsAt, origin);
      } else if (isGuestCheckout && customerEmail) {
        const premiumEndsAt = new Date();
        premiumEndsAt.setFullYear(premiumEndsAt.getFullYear() + 1);
        
        const existingUser = await db.prepare('SELECT id FROM user_profiles WHERE email = ?').bind(customerEmail).first();
        
        if (existingUser) {
          await db.prepare(
            'UPDATE user_profiles SET is_premium = 1, subscription_status = ?, subscription_tier = ?, premium_purchased_at = datetime("now"), premium_ends_at = ?, stripe_session_id = ?, updated_at = datetime("now") WHERE email = ?'
          ).bind('active', 'premium', premiumEndsAt.toISOString(), session.id, customerEmail).run();
        } else {
          const guestUserId = `guest_${customerEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          const guestName = customerName || customerEmail.split('@')[0];
          await db.prepare(
            'INSERT INTO user_profiles (user_id, email, name, is_premium, subscription_status, subscription_tier, premium_purchased_at, premium_ends_at, stripe_session_id, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?, datetime("now"), ?, ?, datetime("now"), datetime("now"))'
          ).bind(guestUserId, customerEmail, guestName, 'active', 'premium', premiumEndsAt.toISOString(), session.id).run();
        }
        
        const firstName = (customerName?.split(' ')[0] || customerEmail.split('@')[0].split(/[._0-9]/)[0]);
        const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
        await sendPremiumWelcomeEmail(c.env, customerEmail, capitalizedName, premiumEndsAt, origin);
      }
    }
  }
  
  // Handle invoice.paid (subscription renewals)
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as any;
    
    if (invoice.subscription && invoice.customer_email) {
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
      const periodEnd = new Date(subscription.current_period_end * 1000);
      
      await db.prepare(`
        UPDATE user_profiles SET
          is_premium = 1,
          subscription_status = 'active',
          current_period_end = ?,
          updated_at = datetime("now")
        WHERE stripe_subscription_id = ?
      `).bind(periodEnd.toISOString(), subscriptionId).run();

      console.log(`Subscription ${subscriptionId} renewed, new period end: ${periodEnd.toISOString()}`);
    }
  }
  
  // Handle invoice.payment_failed
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as any;
    
    if (invoice.subscription) {
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
      
      await db.prepare(`
        UPDATE user_profiles SET 
          subscription_status = 'past_due',
          updated_at = datetime("now")
        WHERE stripe_subscription_id = ?
      `).bind(subscriptionId).run();
      
      console.log(`Payment failed for subscription ${subscriptionId}`);
    }
  }
  
  // Handle customer.subscription.deleted (cancellation)
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    await db.prepare(`
      UPDATE user_profiles SET
        is_premium = 0,
        subscription_tier = NULL,
        subscription_status = 'cancelled',
        updated_at = datetime("now")
      WHERE stripe_subscription_id = ?
    `).bind(subscription.id).run();
    
    console.log(`Subscription ${subscription.id} cancelled`);
  }
  
  // Handle customer.subscription.updated (status changes)
  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as any;
    const periodEnd = new Date(subscription.current_period_end * 1000);
    
    let status: SubscriptionStatus = 'active';
    if (subscription.status === 'past_due') status = 'past_due';
    else if (subscription.status === 'canceled' || subscription.status === 'unpaid') status = 'cancelled';
    else if (subscription.status === 'active' || subscription.status === 'trialing') status = 'active';
    
    const isPremium = status === 'active' ? 1 : 0;
    
    await db.prepare(`
      UPDATE user_profiles SET 
        is_premium = ?,
        subscription_status = ?,
        current_period_end = ?,
        updated_at = datetime("now")
      WHERE stripe_subscription_id = ?
    `).bind(isPremium, status, periodEnd.toISOString(), subscription.id).run();
    
    console.log(`Subscription ${subscription.id} updated: status=${status}`);
  }

  return c.text("ok", 200);
});

// Test endpoint to send welcome email (for testing purposes)
app.post("/test-welcome-email", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const { email, firstName } = await c.req.json();
  const targetEmail = email || "gustavo@remodeleriq.com";
  const targetName = firstName || "Gustavo";
  const origin = getAppOrigin(c);
  
  const premiumEndsAt = new Date();
  premiumEndsAt.setFullYear(premiumEndsAt.getFullYear() + 1);

  try {
    const result = await sendPremiumWelcomeEmail(c.env, targetEmail, targetName, premiumEndsAt, origin);
    
    if (result.success) {
      return c.json({ success: true, message_id: result.message_id, sentTo: targetEmail });
    } else {
      return c.json({ error: result.error }, 500);
    }
  } catch (err: any) {
    return c.json({ error: err?.message || 'Unknown error' }, 500);
  }
});

// send-test-email endpoint removed — unauthenticated email sending is a security risk

// Webhook diagnostic endpoint - JSON for React page
app.get("/webhook-status-json", async (c) => {
  const stripeKey = (c.env as unknown as Record<string, unknown>).STRIPE_SECRET_KEY as string | undefined;
  const webhookSecret = (c.env as unknown as Record<string, unknown>).STRIPE_WEBHOOK_SECRET as string | undefined;
  
  const stripeKeyMode = stripeKey 
    ? (stripeKey.startsWith('sk_live_') ? 'LIVE' : stripeKey.startsWith('sk_test_') ? 'TEST' : 'UNKNOWN')
    : 'NOT SET';
  const webhookPrefix = webhookSecret ? webhookSecret.substring(0, 10) + '...' : 'NOT SET';
  
  return c.json({
    stripeKeyConfigured: !!stripeKey,
    stripeKeyMode,
    webhookSecretConfigured: !!webhookSecret,
    webhookSecretPrefix: webhookPrefix
  });
});

// Webhook diagnostic endpoint - checks Stripe configuration (HTML fallback)
app.get("/webhook-status", async (c) => {
  const stripeKey = (c.env as unknown as Record<string, unknown>).STRIPE_SECRET_KEY as string | undefined;
  const webhookSecret = (c.env as unknown as Record<string, unknown>).STRIPE_WEBHOOK_SECRET as string | undefined;
  
  const stripeKeyMode = stripeKey 
    ? (stripeKey.startsWith('sk_live_') ? 'LIVE' : stripeKey.startsWith('sk_test_') ? 'TEST' : 'UNKNOWN')
    : 'NOT SET';
  const webhookPrefix = webhookSecret ? webhookSecret.substring(0, 10) + '...' : 'NOT SET';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RemodelerIQ Webhook Status</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    h1 { color: #10b981; margin-bottom: 24px; }
    .status-card { background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .status-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #334155; }
    .status-row:last-child { border-bottom: none; }
    .label { color: #94a3b8; }
    .value { font-weight: 600; }
    .value.ok { color: #10b981; }
    .value.error { color: #ef4444; }
    .notes { background: #1e293b; border-radius: 12px; padding: 24px; }
    .notes h2 { margin-top: 0; font-size: 16px; color: #94a3b8; }
    .notes ul { margin: 0; padding-left: 20px; }
    .notes li { margin-bottom: 8px; color: #cbd5e1; }
    code { background: #334155; padding: 2px 8px; border-radius: 4px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔧 Webhook Status</h1>
    <div class="status-card">
      <div class="status-row">
        <span class="label">Stripe Key</span>
        <span class="value ${stripeKey ? 'ok' : 'error'}">${stripeKey ? '✓ Configured' : '✗ Missing'}</span>
      </div>
      <div class="status-row">
        <span class="label">Key Mode</span>
        <span class="value ${stripeKeyMode === 'LIVE' ? 'ok' : ''}">${stripeKeyMode}</span>
      </div>
      <div class="status-row">
        <span class="label">Webhook Secret</span>
        <span class="value ${webhookSecret ? 'ok' : 'error'}">${webhookSecret ? '✓ Configured' : '✗ Missing'}</span>
      </div>
      <div class="status-row">
        <span class="label">Secret Prefix</span>
        <span class="value">${webhookPrefix}</span>
      </div>
    </div>
    <div class="notes">
      <h2>Expected Webhook URL:</h2>
      <p><code>https://remodeleriq.com/api/webhooks/stripe</code></p>
      <h2>Notes:</h2>
      <ul>
        <li>Ensure your Stripe Dashboard webhook points to the URL above</li>
        <li>Webhook secret should start with <code>whsec_</code></li>
        <li>Live mode and test mode have separate webhook secrets</li>
      </ul>
    </div>
  </div>
</body>
</html>`;
  
  return c.html(html);
});

// simulate-guest-purchase endpoint removed — unauthenticated premium grant is a security risk

// Test checkout - creates a $0.01 charge for testing payment flow
app.post("/test-checkout", async (c) => {
  const stripeKey = (c.env as unknown as Record<string, unknown>).STRIPE_SECRET_KEY as string | undefined;
  if (!stripeKey) {
    console.error('Stripe test checkout error: STRIPE_SECRET_KEY not configured');
    return c.json({ error: "Payment processing not configured." }, 500);
  }

  console.log('Creating TEST checkout session');
  console.log('Stripe key mode:', stripeKey.startsWith('sk_live_') ? 'LIVE' : stripeKey.startsWith('sk_test_') ? 'TEST' : 'UNKNOWN');

  const stripe = new Stripe(stripeKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });

  try {
    const origin = getAppOrigin(c);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: "RemodelerIQ Test Payment",
              description: "Test transaction - $0.50 charge to verify payment integration"
            },
            unit_amount: 50, // $0.50 in cents (Stripe minimum)
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/test-payment?status=success`,
      cancel_url: `${origin}/test-payment?status=cancelled`,
      metadata: {
        testPayment: "true",
      },
    });

    console.log('Test checkout session created:', session.id);
    return c.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe test checkout error:', err?.message || err);
    return c.json({ error: `Failed to create test checkout: ${err?.message || 'Unknown error'}` }, 500);
  }
});

// Cancel subscription
app.post("/subscription/cancel", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const stripeKey = (c.env as unknown as Record<string, unknown>).STRIPE_SECRET_KEY as string | undefined;
  if (!stripeKey) {
    return c.json({ error: "Payment processing not configured." }, 500);
  }

  const db = c.env.DB;
  
  // Get user's subscription ID
  const profile = await db.prepare(
    'SELECT stripe_subscription_id, current_period_end FROM user_profiles WHERE id = ?'
  ).bind(user.id).first<{ stripe_subscription_id: string | null; current_period_end: string | null }>();
  
  if (!profile?.stripe_subscription_id) {
    return c.json({ error: "No active subscription found" }, 400);
  }

  const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });

  try {
    // Cancel at period end (user keeps access until billing period ends)
    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
    
    // Update local status
    await db.prepare(`
      UPDATE user_profiles SET 
        subscription_status = 'cancelled',
        updated_at = datetime("now")
      WHERE id = ?
    `).bind(user.id).run();

    console.log(`Subscription ${profile.stripe_subscription_id} scheduled for cancellation`);
    
    return c.json({ 
      success: true, 
      message: "Your subscription will be cancelled at the end of your billing period",
      accessUntil: profile.current_period_end
    });
  } catch (err: any) {
    console.error('Subscription cancellation error:', err);
    return c.json({ error: `Failed to cancel subscription: ${err?.message}` }, 500);
  }
});

// Legacy cancel endpoint (kept for backward compatibility)
app.post("/premium/cancel", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const db = c.env.DB;
  
  // Check if user has a Stripe subscription
  const profile = await db.prepare(
    'SELECT stripe_subscription_id FROM user_profiles WHERE id = ?'
  ).bind(user.id).first<{ stripe_subscription_id: string | null }>();
  
  if (profile?.stripe_subscription_id) {
    // Redirect to new subscription cancel
    return c.json({ error: "Please use /api/subscription/cancel for subscriptions" }, 400);
  }
  
  // Legacy one-time payment cancellation
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + 30);
  const endsAtStr = endsAt.toISOString();
  
  await db.prepare(
    'UPDATE user_profiles SET is_premium = 0, premium_ends_at = ?, updated_at = datetime("now") WHERE id = ?'
  ).bind(endsAtStr, user.id).run();

  return c.json({ success: true, premiumEndsAt: endsAtStr });
});

// Get subscription status
app.get("/subscription/status", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const db = c.env.DB;
  const profile = await db.prepare(`
    SELECT is_premium, subscription_tier, subscription_status, current_period_end, stripe_subscription_id
    FROM user_profiles WHERE id = ?
  `).bind(user.id).first<{
    is_premium: number;
    subscription_tier: string | null;
    subscription_status: string | null;
    current_period_end: string | null;
    stripe_subscription_id: string | null;
  }>();

  if (!profile) {
    return c.json({ tier: 'free', status: null, periodEnd: null, hasSubscription: false });
  }

  return c.json({
    tier: profile.subscription_tier || (profile.is_premium ? 'legacy' : 'free'),
    status: profile.subscription_status,
    periodEnd: profile.current_period_end,
    hasSubscription: !!profile.stripe_subscription_id,
    isPremium: profile.is_premium === 1,
  });
});

export default app;
