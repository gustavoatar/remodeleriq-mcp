// Phase 7B — Resend inbound webhook handler
// Receives forwarded emails from gustavo@remodeleriq.com and help@remodeleriq.com
// via Resend's inbound webhook, classifies via Gemini, lands in unified_inbox.
//
// Resend setup (USER, one-time):
// 1. Configure remodeleriq.com MX records to point at Resend's inbound:
//    Resend dashboard → Inbound → Add domain → follow MX instructions
// 2. Add forwarding rules: gustavo@/help@ → webhook
// 3. Webhook URL: https://remodeleriq.com/api/webhooks/inbound-email
// 4. Webhook signing secret: stored as RESEND_INBOUND_SECRET in Cloudflare
//
// Resend posts a JSON payload with: from, to, subject, text, html, message-id, headers
// See https://resend.com/docs/dashboard/inbound/getting-started

import { Hono } from "hono";
import type { AppEnv } from "../types";
import { classifyInboxItem } from "../lib/inboxClassifier";

const app = new Hono<AppEnv>();

// Resend webhook signature verification (svix-style HMAC SHA256)
async function verifyResendSignature(
  secret: string,
  msgId: string,
  timestamp: string,
  body: string,
  signatureHeader: string
): Promise<boolean> {
  if (!signatureHeader) return false;
  try {
    const signedContent = `${msgId}.${timestamp}.${body}`;
    const cleanSecret = secret.replace(/^whsec_/, "");
    const secretBytes = Uint8Array.from(atob(cleanSecret), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(signedContent)
    );
    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
    // signatureHeader format: "v1,base64sig v1,base64sig" (space-separated, multiple signatures supported)
    const sigs = signatureHeader.split(" ").map((s) => s.replace(/^v1,/, ""));
    return sigs.includes(expectedSig);
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

interface ResendInboundEvent {
  type?: string;       // 'inbound.email.received' or similar
  created_at?: string;
  data?: {
    from?: { email?: string; name?: string };
    to?: Array<{ email?: string }>;
    subject?: string;
    text?: string;
    html?: string;
    headers?: Record<string, string>;
    message_id?: string;
  };
}

// POST /api/webhooks/inbound-email
app.post("/inbound-email", async (c) => {
  const body = await c.req.text();
  const env = c.env as unknown as Record<string, string | undefined>;
  const secret = env.RESEND_INBOUND_SECRET;

  // Verify signature if secret is configured
  if (secret) {
    const msgId = c.req.header("svix-id") || c.req.header("webhook-id") || "";
    const timestamp = c.req.header("svix-timestamp") || c.req.header("webhook-timestamp") || "";
    const sig = c.req.header("svix-signature") || c.req.header("webhook-signature") || "";
    const valid = await verifyResendSignature(secret, msgId, timestamp, body, sig);
    if (!valid) {
      console.error("Resend webhook: invalid signature");
      return c.json({ error: "Invalid signature" }, 401);
    }
  }

  let payload: ResendInboundEvent;
  try {
    payload = JSON.parse(body) as ResendInboundEvent;
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const data = payload.data;
  if (!data) return c.json({ ok: true, note: "no data field" });

  const fromEmail = data.from?.email || "";
  const fromName = data.from?.name || "";
  const fromHandle = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
  const toEmail = (data.to?.[0]?.email || "").toLowerCase();
  const subject = data.subject || "";
  const textBody = data.text || (data.html ? stripHtml(data.html) : "");
  const messageId = data.message_id || data.headers?.["message-id"] || `inbound-${Date.now()}`;

  // Determine source — which mailbox received this
  let source: string = "email_help";
  if (toEmail.includes("gustavo@")) source = "email_gustavo";
  else if (toEmail.includes("help@")) source = "email_help";

  // Dedupe — if we already have this message_id, skip
  const existing = await c.env.DB.prepare(
    "SELECT id FROM unified_inbox WHERE external_id = ? LIMIT 1"
  ).bind(messageId).first();
  if (existing) {
    return c.json({ ok: true, deduped: true });
  }

  // Classify + draft reply
  const classification = await classifyInboxItem(env, {
    source,
    from_handle: fromHandle,
    subject,
    body: textBody,
  });

  // Insert into inbox
  const res = await c.env.DB.prepare(
    `INSERT INTO unified_inbox
       (source, external_id, from_handle, subject, body, tag, status, proposed_reply, proposed_persona)
     VALUES (?, ?, ?, ?, ?, ?, 'new', ?, 'gustavo')`
  ).bind(
    source,
    messageId,
    fromHandle,
    subject,
    `${classification.summary}\n\n---\n\n${textBody.slice(0, 4000)}`,
    classification.tag,
    classification.proposed_reply
  ).run();

  return c.json({
    ok: true,
    inbox_id: res.meta.last_row_id,
    tag: classification.tag,
    priority: classification.priority,
    has_draft: !!classification.proposed_reply,
  });
});

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default app;
