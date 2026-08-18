// Owned-channel email newsletter: list capture (double opt-in), AI generation
// reusing the content-swarm voice/persona machinery, and an autonomous send with
// the same STOP-override circuit breaker as autoPublishApproved. See migration
// 0036_newsletter.sql and the plan for the design.
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { GoogleGenAI } from "@google/genai";
import { type AppEnv, SESSION_COOKIE_NAME } from "../types";
import { sendEmail, type EmailParams } from "../lib/email";
import {
  generateToken,
  emailTemplate,
  emailHeader,
  emailBody,
  emailFooter,
} from "./magicLink";
import { VOICE_BRIEF_NEWSLETTER } from "./contentSwarm";

type Env = AppEnv["Bindings"];

const REVIEW_WINDOW_HOURS = 24; // in_review issues auto-send after this unless killed
const APP_ORIGIN = "https://remodeleriq.com";
const OPERATOR_EMAIL = "gustavo@remodeleriq.com";
// CAN-SPAM requires a physical postal address in every marketing email.
// Set BUSINESS_POSTAL_ADDRESS as a worker var; this is only the fallback text.
const FALLBACK_ADDRESS = "RemodelerIQ, Roswell, GA";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isAdminEmail(email: string, env: unknown): boolean {
  const adminList = (
    ((env as Record<string, unknown>).ADMIN_EMAILS as string | undefined) ||
    "gustavo.atar@gmail.com,gustavo@remodeleriq.com"
  )
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return adminList.includes(email.toLowerCase());
}

function currentCycleId(): string {
  // One issue per calendar month, e.g. 'newsletter-2026-08'. Note: Date is
  // available in the request/cron runtime (only build-time workflow scripts ban it).
  const d = new Date();
  return `newsletter-${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function postalAddress(env: Env): string {
  return (
    ((env as unknown as Record<string, unknown>).BUSINESS_POSTAL_ADDRESS as string | undefined) ||
    FALLBACK_ADDRESS
  );
}

// ============================================================
// Shared render + send helpers
// ============================================================

/** Wrap issue sections into the branded email shell, with per-recipient
 *  unsubscribe link + CAN-SPAM postal address. */
function renderIssueHtml(
  env: Env,
  issue: { subject: string; html_body: string },
  unsubToken: string
): string {
  const unsubUrl = `${APP_ORIGIN}/api/newsletter/unsubscribe?token=${unsubToken}`;
  return emailTemplate(`
    ${emailHeader(issue.subject)}
    ${emailBody(issue.html_body)}
    ${emailFooter(
      `You're receiving this because you subscribed at remodeleriq.com.<br/>` +
        `<a href="${unsubUrl}">Unsubscribe</a> · ${postalAddress(env)}`
    )}
  `);
}

/** Resend batch send (≤100/call, ~2 req/s). Returns count sent. */
async function sendIssueToList(
  env: Env,
  issue: { id: number; subject: string; html_body: string; text_body: string | null }
): Promise<number> {
  const subs = await env.DB.prepare(
    "SELECT email, unsubscribe_token FROM newsletter_subscribers WHERE status = 'active'"
  ).all<{ email: string; unsubscribe_token: string }>();
  const list = subs.results || [];
  let sent = 0;
  for (const s of list) {
    const unsubUrl = `${APP_ORIGIN}/api/newsletter/unsubscribe?token=${s.unsubscribe_token}`;
    const params: EmailParams = {
      to: s.email,
      subject: issue.subject,
      html_body: renderIssueHtml(env, issue, s.unsubscribe_token),
      text_body: issue.text_body || undefined,
      broadcast: true,
      // One-click unsubscribe (Gmail/Yahoo bulk-sender requirement).
      headers: {
        "List-Unsubscribe": `<${unsubUrl}>, <mailto:unsubscribe@remodeleriq.com>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };
    const res = await sendEmail(env, params);
    if (res.success) sent++;
    // gentle pacing for Resend's 2 req/s default
    await new Promise((r) => setTimeout(r, 120));
  }
  return sent;
}

// ============================================================
// Generation (reuses the content-swarm Gemini + guardrail pattern)
// ============================================================

interface GeneratedIssue {
  subject: string;
  preview_text: string;
  sections: { header: string; body: string }[];
  cta_label: string;
  cta_url: string;
}

const ISSUE_SCHEMA = `Return ONLY JSON:
{
  "subject": "string <55 chars",
  "preview_text": "string <90 chars",
  "sections": [ { "header": "string", "body": "string (2-4 sentences)" } ],
  "cta_label": "string",
  "cta_url": "one of the allowed RemodelerIQ URLs"
}`;

/** Pull recent published content + live data as source material. */
async function gatherSources(env: Env): Promise<string> {
  const posts = await env.DB.prepare(
    `SELECT topic, published_url FROM content_drafts
     WHERE status = 'published' AND published_url IS NOT NULL
       AND datetime(COALESCE(published_at, updated_at)) > datetime('now','-35 days')
     ORDER BY COALESCE(published_at, updated_at) DESC LIMIT 6`
  ).all<{ topic: string | null; published_url: string }>();
  const lines: string[] = [];
  for (const p of posts.results || []) {
    lines.push(`- Recent post: ${p.topic || "(untitled)"} — ${p.published_url}`);
  }
  // Evergreen data anchors the newsletter can always cite.
  lines.push(
    "- Data asset: 2026 Construction Labor Cost Index — core-trade labor ~$54/hr nationally, $46 (cheapest metro) to $81 (priciest); within-trade wages span 2.6-2.8x from 10th to 90th percentile. https://remodeleriq.com/labor-cost-index"
  );
  lines.push(
    "- Tool: free AI bid analysis (first 3 free) at https://remodeleriq.com/?view=upload"
  );
  return lines.join("\n");
}

/** Draft this month's issue into newsletter_issues (idempotent per cycle). */
export async function generateNewsletterIssue(
  env: Env
): Promise<{ created: boolean; issueId?: number; reason?: string }> {
  const cycleId = currentCycleId();
  const existing = await env.DB.prepare(
    "SELECT id FROM newsletter_issues WHERE issue_cycle_id = ?"
  )
    .bind(cycleId)
    .first<{ id: number }>();
  if (existing) return { created: false, reason: "issue already exists for cycle" };

  const apiKey = (env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
  if (!apiKey) return { created: false, reason: "GEMINI_API_KEY not configured" };

  const guardrails = await env.DB.prepare(
    "SELECT rule FROM content_voice_guardrails WHERE active = 1 ORDER BY id"
  ).all<{ rule: string }>();
  const guardrailsText = (guardrails.results || [])
    .map((g, i) => `${i + 1}. ${g.rule}`)
    .join("\n");

  const sources = await gatherSources(env);
  const prompt = `Write the ${cycleId.replace("newsletter-", "")} RemodelerIQ newsletter.

SOURCE MATERIAL (only use numbers/links that appear here):
${sources}

${guardrailsText ? `ACTIVE VOICE RULES (highest priority):\n${guardrailsText}\n` : ""}
${ISSUE_SCHEMA}`;

  const client = new GoogleGenAI({ apiKey });
  let gen: GeneratedIssue | null = null;
  for (let attempt = 1; attempt <= 2 && !gen; attempt++) {
    try {
      const resp = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
          systemInstruction: VOICE_BRIEF_NEWSLETTER,
        },
      });
      gen = JSON.parse(resp.text || "{}") as GeneratedIssue;
      if (!gen.subject || !gen.sections?.length) gen = null;
    } catch (e) {
      console.error(`Newsletter gen attempt ${attempt} failed:`, e);
    }
  }
  if (!gen) return { created: false, reason: "generation failed" };

  // Render sections to email HTML + plain text.
  const htmlBody = gen.sections
    .map(
      (s) =>
        `<h2 style="font-size:18px;font-weight:600;color:#18181b;margin:24px 0 8px;">${escapeHtml(
          s.header
        )}</h2><p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#3f3f46;">${escapeHtml(
          s.body
        )}</p>`
    )
    .join("\n") +
    `<div style="text-align:center;margin:28px 0;"><a href="${escapeAttr(
      gen.cta_url
    )}" style="display:inline-block;background:#1F9C4C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">${escapeHtml(
      gen.cta_label
    )}</a></div>`;
  const textBody =
    gen.sections.map((s) => `${s.header}\n${s.body}`).join("\n\n") +
    `\n\n${gen.cta_label}: ${gen.cta_url}\n\n— Bella and the RemodelerIQ team`;

  const recipientCount = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM newsletter_subscribers WHERE status = 'active'"
  ).first<{ n: number }>();

  const res = await env.DB.prepare(
    `INSERT INTO newsletter_issues
       (issue_cycle_id, subject, preview_text, html_body, text_body, persona, source_summary, status, recipient_count)
     VALUES (?, ?, ?, ?, ?, 'bella', ?, 'in_review', ?)`
  )
    .bind(
      cycleId,
      gen.subject,
      gen.preview_text,
      htmlBody,
      textBody,
      JSON.stringify({ sources: sources.split("\n").length }),
      recipientCount?.n || 0
    )
    .run();
  return { created: true, issueId: res.meta.last_row_id as number };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

// ============================================================
// Send with circuit breaker
// ============================================================

async function operatorDigest(env: Env, issue: { id: number; subject: string; preview_text: string | null; recipient_count: number | null }) {
  const reviewUrl = `${APP_ORIGIN}/admin/newsletter`;
  await sendEmail(env, {
    to: OPERATOR_EMAIL,
    subject: `[Newsletter] Draft ready — sends in ${REVIEW_WINDOW_HOURS}h unless killed`,
    html_body: emailTemplate(`
      ${emailHeader("Newsletter draft ready")}
      ${emailBody(
        `<p><strong>${escapeHtml(issue.subject)}</strong></p>` +
          `<p style="color:#71717a">${escapeHtml(issue.preview_text || "")}</p>` +
          `<p>Recipients: ${issue.recipient_count ?? 0}. This issue auto-sends in ${REVIEW_WINDOW_HOURS} hours unless you edit or kill it.</p>` +
          `<p><a href="${reviewUrl}">Review / edit / kill →</a></p>`
      )}
      ${emailFooter("RemodelerIQ operator notification")}
    `),
  });
}

/** The monthly cron entry point: generate if needed, then send any issue whose
 *  review window has elapsed and wasn't stopped. Idempotent + status-guarded. */
export async function runNewsletterCron(env: Env): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};

  // 1. Generate this month's issue if it doesn't exist, and notify the operator.
  const gen = await generateNewsletterIssue(env);
  out.generate = gen;
  if (gen.created && gen.issueId) {
    const issue = await env.DB.prepare(
      "SELECT id, subject, preview_text, recipient_count FROM newsletter_issues WHERE id = ?"
    )
      .bind(gen.issueId)
      .first<{ id: number; subject: string; preview_text: string | null; recipient_count: number | null }>();
    if (issue) await operatorDigest(env, issue);
  }

  // 2. Send-check: any in_review issue past its window, not STOPped.
  const due = await env.DB.prepare(
    `SELECT id, issue_cycle_id, subject, html_body, text_body FROM newsletter_issues
     WHERE status = 'in_review'
       AND datetime(created_at) < datetime('now', ?)`
  )
    .bind(`-${REVIEW_WINDOW_HOURS} hours`)
    .all<{ id: number; issue_cycle_id: string; subject: string; html_body: string; text_body: string | null }>();

  const sends: unknown[] = [];
  for (const issue of due.results || []) {
    // STOP override scoped to THIS issue's cycle id (never the global content STOP).
    const stopped = await env.DB.prepare(
      "SELECT id FROM cycle_overrides WHERE action = 'stop' AND digest_cycle_id = ? LIMIT 1"
    )
      .bind(issue.issue_cycle_id)
      .first();
    if (stopped) {
      sends.push({ id: issue.id, held: true });
      continue;
    }
    // Interlock: claim by flipping to 'sending' so an overlapping run can't double-send.
    const claim = await env.DB.prepare(
      "UPDATE newsletter_issues SET status = 'sending', updated_at = datetime('now') WHERE id = ? AND status = 'in_review'"
    )
      .bind(issue.id)
      .run();
    if ((claim.meta.changes || 0) === 0) continue; // someone else claimed it
    const sent = await sendIssueToList(env, issue);
    await env.DB.prepare(
      "UPDATE newsletter_issues SET status = 'sent', sent_count = ?, sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
    )
      .bind(sent, issue.id)
      .run();
    sends.push({ id: issue.id, sent });
  }
  out.sends = sends;
  return out;
}

// ============================================================
// Routes
// ============================================================

const app = new Hono<AppEnv>();

// ---- Public: subscribe / confirm / unsubscribe ----

app.post("/subscribe", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = String(body.email || "").toLowerCase().trim();
  const source = String(body.source || "unknown").slice(0, 40);
  // Honeypot: bots fill hidden fields. If 'company' is present, pretend success.
  if (body.company) return c.json({ success: true });
  if (!email || !EMAIL_RE.test(email)) {
    return c.json({ error: "Please enter a valid email." }, 400);
  }

  const existing = await c.env.DB.prepare(
    "SELECT id, status FROM newsletter_subscribers WHERE lower(email) = ?"
  )
    .bind(email)
    .first<{ id: number; status: string }>();

  if (existing) {
    if (existing.status === "active") return c.json({ success: true, already: true });
    // pending or unsubscribed → re-send a confirm and reset to pending
    const confirm = generateToken();
    await c.env.DB.prepare(
      "UPDATE newsletter_subscribers SET status = 'pending', confirm_token = ?, updated_at = datetime('now') WHERE id = ?"
    )
      .bind(confirm, existing.id)
      .run();
    await sendConfirmEmail(c.env as unknown as Env, email, confirm);
    return c.json({ success: true });
  }

  const unsub = generateToken();
  const confirm = generateToken();
  await c.env.DB.prepare(
    "INSERT INTO newsletter_subscribers (email, source, status, unsubscribe_token, confirm_token) VALUES (?, ?, 'pending', ?, ?)"
  )
    .bind(email, source, unsub, confirm)
    .run();
  await sendConfirmEmail(c.env as unknown as Env, email, confirm);
  return c.json({ success: true });
});

async function sendConfirmEmail(env: Env, email: string, confirmToken: string) {
  const url = `${APP_ORIGIN}/api/newsletter/confirm?token=${confirmToken}`;
  await sendEmail(env, {
    to: email,
    subject: "Confirm your RemodelerIQ subscription",
    html_body: emailTemplate(`
      ${emailHeader("Confirm your subscription")}
      ${emailBody(
        `<p>Tap below to confirm you'd like the monthly RemodelerIQ newsletter — real remodeling cost data and how to not get overcharged.</p>` +
          `<div style="text-align:center;margin:28px 0;"><a href="${url}" style="display:inline-block;background:#1F9C4C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Confirm subscription</a></div>` +
          `<p style="font-size:13px;color:#71717a">If you didn't request this, you can ignore this email — you won't be subscribed.</p>`
      )}
      ${emailFooter(postalAddress(env))}
    `),
  });
}

app.get("/confirm", async (c) => {
  const token = c.req.query("token") || "";
  if (!token) return c.html(confirmPage("Invalid confirmation link.", false));
  const row = await c.env.DB.prepare(
    "SELECT id FROM newsletter_subscribers WHERE confirm_token = ?"
  )
    .bind(token)
    .first<{ id: number }>();
  if (!row) return c.html(confirmPage("This link is invalid or already used.", false));
  await c.env.DB.prepare(
    "UPDATE newsletter_subscribers SET status = 'active', confirmed_at = datetime('now'), confirm_token = NULL, updated_at = datetime('now') WHERE id = ?"
  )
    .bind(row.id)
    .run();
  return c.html(confirmPage("You're subscribed. Talk soon.", true));
});

app.on(["GET", "POST"], "/unsubscribe", async (c) => {
  const token = c.req.query("token") || "";
  if (token) {
    await c.env.DB.prepare(
      "UPDATE newsletter_subscribers SET status = 'unsubscribed', unsubscribed_at = datetime('now'), updated_at = datetime('now') WHERE unsubscribe_token = ?"
    )
      .bind(token)
      .run();
  }
  return c.html(confirmPage("You've been unsubscribed. You won't receive further newsletters.", true));
});

function confirmPage(message: string, ok: boolean): string {
  return emailTemplate(`
    ${emailHeader(ok ? "RemodelerIQ" : "Something went wrong")}
    ${emailBody(
      `<p style="font-size:16px;">${message}</p><p><a href="${APP_ORIGIN}/">Back to RemodelerIQ →</a></p>`
    )}
    ${emailFooter("RemodelerIQ")}
  `);
}

// ---- Admin (session + allowlist) ----

app.use("/admin/*", async (c, next) => {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
  if (!sessionToken) return c.json({ error: "Unauthorized" }, 401);
  const session = await c.env.DB.prepare(
    'SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > datetime("now")'
  )
    .bind(sessionToken)
    .first<{ user_id: number }>();
  if (!session) return c.json({ error: "Unauthorized" }, 401);
  const user = await c.env.DB.prepare("SELECT email FROM user_profiles WHERE id = ?")
    .bind(session.user_id)
    .first<{ email: string }>();
  if (!user || !isAdminEmail(user.email, c.env)) return c.json({ error: "Forbidden" }, 403);
  await next();
});

app.get("/admin/stats", async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT status, COUNT(*) AS n FROM newsletter_subscribers GROUP BY status"
  ).all<{ status: string; n: number }>();
  const counts: Record<string, number> = {};
  for (const r of rows.results || []) counts[r.status] = r.n;
  return c.json({ subscribers: counts });
});

app.get("/admin/issues", async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id, issue_cycle_id, subject, preview_text, status, recipient_count, sent_count, created_at, sent_at FROM newsletter_issues ORDER BY id DESC LIMIT 24"
  ).all();
  return c.json({ issues: rows.results || [] });
});

app.get("/admin/issues/:id", async (c) => {
  const row = await c.env.DB.prepare("SELECT * FROM newsletter_issues WHERE id = ?")
    .bind(c.req.param("id"))
    .first();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ issue: row });
});

app.post("/admin/generate", async (c) => {
  const result = await generateNewsletterIssue(c.env as unknown as Env);
  return c.json(result);
});

// Approve-now: send immediately (bypass the review window), still status-guarded.
app.post("/admin/issues/:id/send-now", async (c) => {
  const id = c.req.param("id");
  const issue = await c.env.DB.prepare(
    "SELECT id, subject, html_body, text_body, status FROM newsletter_issues WHERE id = ?"
  )
    .bind(id)
    .first<{ id: number; subject: string; html_body: string; text_body: string | null; status: string }>();
  if (!issue) return c.json({ error: "Not found" }, 404);
  if (issue.status !== "in_review" && issue.status !== "approved") {
    return c.json({ error: `Cannot send an issue in status '${issue.status}'` }, 400);
  }
  const claim = await c.env.DB.prepare(
    "UPDATE newsletter_issues SET status = 'sending', updated_at = datetime('now') WHERE id = ? AND status IN ('in_review','approved')"
  )
    .bind(id)
    .run();
  if ((claim.meta.changes || 0) === 0) return c.json({ error: "Already sending/sent" }, 409);
  const sent = await sendIssueToList(c.env as unknown as Env, issue);
  await c.env.DB.prepare(
    "UPDATE newsletter_issues SET status = 'sent', sent_count = ?, sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
  )
    .bind(sent, id)
    .run();
  return c.json({ success: true, sent });
});

app.post("/admin/issues/:id/kill", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  await c.env.DB.prepare(
    "UPDATE newsletter_issues SET status = 'killed', killed_reason = ?, updated_at = datetime('now') WHERE id = ? AND status IN ('queued','drafted','in_review','approved')"
  )
    .bind(String(body.reason || "killed by operator").slice(0, 200), id)
    .run();
  return c.json({ success: true });
});

app.patch("/admin/issues/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  // Allow editing subject / preview / html before send.
  await c.env.DB.prepare(
    "UPDATE newsletter_issues SET subject = COALESCE(?, subject), preview_text = COALESCE(?, preview_text), html_body = COALESCE(?, html_body), updated_at = datetime('now') WHERE id = ? AND status = 'in_review'"
  )
    .bind(body.subject ?? null, body.preview_text ?? null, body.html_body ?? null, id)
    .run();
  return c.json({ success: true });
});

export default app;
