// Phase 7A — Unified Inbox API
// Powers /admin/inbox UI. Surfaces drafts pending review, inbound emails,
// platform replies on published drafts, and engagement events in one list.
//
// Admin-gated identical to contentDrafts.ts.

import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { type AppEnv, SESSION_COOKIE_NAME } from "../types";

const app = new Hono<AppEnv>();

// Inbox statuses kept as constant for any future validation use
export const VALID_INBOX_STATUSES = ["new", "actioned", "archived"] as const;

function isAdminEmail(email: string, env: unknown): boolean {
  const adminList = ((env as Record<string, unknown>).ADMIN_EMAILS as string | undefined ||
    "gustavo.atar@gmail.com,gustavo@remodeleriq.com")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return adminList.includes(email.toLowerCase());
}

app.use("*", async (c, next) => {
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

// ====================================================================
// LIST — returns inbox items + counts. Frontend kanban builds tabs from these.
// ====================================================================
app.get("/", async (c) => {
  const tab = c.req.query("tab") || "all";  // 'drafts' | 'inbound' | 'engagement' | 'killed' | 'all'

  // Drafts pending review (live join with content_drafts)
  const drafts = await c.env.DB.prepare(
    `SELECT id, cycle_id, platform, source_url, source_excerpt, source_author,
            source_subreddit_or_hood, pillar_tags, draft_reddit, draft_nextdoor,
            blog_brief, feature_ticket, status, persona, gustavo_notes,
            created_at, updated_at, approved_at, published_at, published_url
     FROM content_drafts
     WHERE status = 'in_review'
     ORDER BY updated_at DESC
     LIMIT 100`
  ).all();

  // Inbound + engagement from unified_inbox
  const inboxRows = await c.env.DB.prepare(
    `SELECT id, source, external_id, from_handle, subject, body, related_draft_id,
            tag, status, proposed_reply, proposed_persona, received_at, actioned_at
     FROM unified_inbox
     WHERE status != 'archived'
     ORDER BY received_at DESC
     LIMIT 200`
  ).all();

  // Killed drafts (last 30 days)
  const killed = await c.env.DB.prepare(
    `SELECT id, cycle_id, platform, source_excerpt, source_author, source_subreddit_or_hood,
            killed_reason, persona, updated_at
     FROM content_drafts
     WHERE status = 'killed' AND datetime(updated_at) > datetime('now', '-30 days')
     ORDER BY updated_at DESC
     LIMIT 50`
  ).all();

  // Aggregated tab counts
  const counts = {
    drafts: drafts.results?.length || 0,
    inbound: (inboxRows.results || []).filter(
      (r) => ["email_gustavo", "email_help", "reddit_reply", "nextdoor_comment", "facebook_page_comment", "facebook_messenger"].includes((r as { source: string }).source)
        && ["lead", "question"].includes((r as { tag?: string }).tag || "")
    ).length,
    engagement: (inboxRows.results || []).filter(
      (r) => (r as { tag?: string }).tag === "engagement"
    ).length,
    killed: killed.results?.length || 0,
  };

  // Tab-filtered payload
  let inboxFiltered: unknown[] = inboxRows.results || [];
  if (tab === "inbound") {
    inboxFiltered = (inboxRows.results || []).filter(
      (r) => ["lead", "question"].includes((r as { tag?: string }).tag || "")
    );
  } else if (tab === "engagement") {
    inboxFiltered = (inboxRows.results || []).filter(
      (r) => (r as { tag?: string }).tag === "engagement"
    );
  } else if (tab === "drafts" || tab === "killed") {
    inboxFiltered = [];
  }

  return c.json({
    drafts: tab === "drafts" || tab === "all" ? drafts.results || [] : [],
    inbox: inboxFiltered,
    killed: tab === "killed" || tab === "all" ? killed.results || [] : [],
    counts,
  });
});

// ====================================================================
// Single inbox item details
// ====================================================================
app.get("/inbox-item/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const row = await c.env.DB.prepare("SELECT * FROM unified_inbox WHERE id = ?").bind(id).first();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ item: row });
});

// ====================================================================
// Action on inbox item — archive, approve proposed reply, etc.
// ====================================================================
app.post("/inbox-item/:id/action", async (c) => {
  const id = parseInt(c.req.param("id"));
  const { action, note } = await c.req.json<{ action: string; note?: string }>();

  if (action === "archive") {
    await c.env.DB.prepare(
      "UPDATE unified_inbox SET status = 'archived', actioned_at = datetime('now') WHERE id = ?"
    ).bind(id).run();
    return c.json({ success: true });
  }

  if (action === "actioned") {
    await c.env.DB.prepare(
      "UPDATE unified_inbox SET status = 'actioned', actioned_at = datetime('now') WHERE id = ?"
    ).bind(id).run();
    return c.json({ success: true });
  }

  if (action === "retag") {
    await c.env.DB.prepare(
      "UPDATE unified_inbox SET tag = ?, actioned_at = datetime('now') WHERE id = ?"
    ).bind(note || "internal", id).run();
    return c.json({ success: true });
  }

  return c.json({ error: "Unknown action" }, 400);
});

// ====================================================================
// Bulk operations: approve all today's drafts, kill all, etc.
// ====================================================================
app.post("/bulk/approve-all", async (c) => {
  const result = await c.env.DB.prepare(
    `UPDATE content_drafts
     SET status = 'approved', approved_at = datetime('now'), updated_at = datetime('now')
     WHERE status = 'in_review'`
  ).run();
  return c.json({ success: true, approved: result.meta.changes || 0 });
});

app.post("/bulk/kill-all", async (c) => {
  const { reason } = await c.req.json<{ reason?: string }>();
  const killedReason = reason || "bulk kill — no reason given";
  const result = await c.env.DB.prepare(
    `UPDATE content_drafts
     SET status = 'killed', killed_reason = ?, updated_at = datetime('now')
     WHERE status = 'in_review'`
  ).bind(killedReason).run();

  // Learning loop: log the bulk kill as a high-priority guardrail signal
  if ((result.meta.changes || 0) > 0) {
    await c.env.DB.prepare(
      "INSERT INTO content_voice_guardrails (rule, source_kill_id) VALUES (?, ?)"
    ).bind(
      `BULK KILL ${new Date().toISOString().slice(0, 10)}: ${killedReason}. Review what changed in voice this cycle.`,
      null
    ).run();
  }

  return c.json({ success: true, killed: result.meta.changes || 0 });
});

// ====================================================================
// 90-MINUTE STOP OVERRIDE — called by reply parser OR signed-link click
// ====================================================================
app.post("/override", async (c) => {
  const { digest_cycle_id, action, draft_ids, source } = await c.req.json<{
    digest_cycle_id: string;
    action: "stop" | "kill";
    draft_ids?: string;
    source: "email_reply" | "ui_click" | "sms";
  }>();

  if (!digest_cycle_id || !action) {
    return c.json({ error: "Missing required fields" }, 400);
  }
  if (!["stop", "kill"].includes(action)) {
    return c.json({ error: "Invalid action" }, 400);
  }

  await c.env.DB.prepare(
    "INSERT INTO cycle_overrides (digest_cycle_id, action, draft_ids, source) VALUES (?, ?, ?, ?)"
  )
    .bind(digest_cycle_id, action, draft_ids || null, source)
    .run();

  // If action is 'kill', immediately flip the specified drafts
  if (action === "kill" && draft_ids) {
    const ids = draft_ids
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
    if (ids.length > 0) {
      const placeholders = ids.map(() => "?").join(",");
      await c.env.DB.prepare(
        `UPDATE content_drafts SET status = 'killed', killed_reason = 'override', updated_at = datetime('now') WHERE id IN (${placeholders}) AND status = 'in_review'`
      ).bind(...ids).run();
    }
  }

  return c.json({ success: true });
});

// ====================================================================
// Current digest cycle status (used by UI to show "publishes at 8:30 ET unless STOP")
// ====================================================================
app.get("/digest-status", async (c) => {
  const todayUtc = new Date().toISOString().slice(0, 10);
  const pendingDrafts = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM content_drafts WHERE status = 'in_review'`
  ).first<{ count: number }>();

  const lastOverride = await c.env.DB.prepare(
    `SELECT digest_cycle_id, action, draft_ids, received_at FROM cycle_overrides
     WHERE date(received_at) = ?
     ORDER BY received_at DESC LIMIT 1`
  ).bind(todayUtc).first();

  return c.json({
    pendingDrafts: pendingDrafts?.count || 0,
    lastOverride: lastOverride || null,
    publishCronUtc: "13:30",  // 8:30am ET
  });
});

export default app;
