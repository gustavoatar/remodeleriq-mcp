import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { type AppEnv, SESSION_COOKIE_NAME } from "../types";

const app = new Hono<AppEnv>();

const VALID_STATUSES = ["queued", "drafted", "in_review", "approved", "killed", "published"] as const;
type DraftStatus = (typeof VALID_STATUSES)[number];

function isAdminEmail(email: string, env: unknown): boolean {
  const adminList = ((env as Record<string, unknown>).ADMIN_EMAILS as string | undefined ||
    "gustavo.atar@gmail.com,gustavo@remodeleriq.com")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return adminList.includes(email.toLowerCase());
}

// Middleware: every route here requires admin
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

// LIST drafts grouped by status (kanban view)
app.get("/", async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT id, cycle_id, platform, source_url, source_excerpt, source_author,
            source_subreddit_or_hood, pillar_tags, draft_reddit, draft_nextdoor,
            blog_brief, feature_ticket, status, gustavo_notes, killed_reason,
            created_at, updated_at, approved_at, published_at, published_url
     FROM content_drafts
     WHERE status != 'killed' OR datetime(updated_at) > datetime('now', '-30 days')
     ORDER BY updated_at DESC
     LIMIT 200`
  ).all();
  return c.json({ drafts: result.results || [] });
});

// GET single draft
app.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const draft = await c.env.DB.prepare("SELECT * FROM content_drafts WHERE id = ?")
    .bind(id)
    .first();
  if (!draft) return c.json({ error: "Not found" }, 404);
  return c.json({ draft });
});

// CREATE draft (used by swarm Scout)
app.post("/", async (c) => {
  const body = await c.req.json();
  const {
    cycle_id,
    platform,
    source_url,
    source_excerpt,
    source_author,
    source_subreddit_or_hood,
    pillar_tags,
    draft_reddit,
    draft_nextdoor,
    blog_brief,
    feature_ticket,
    status = "queued",
  } = body;
  if (!cycle_id || !platform || !source_url || !source_excerpt) {
    return c.json({ error: "Missing required fields" }, 400);
  }
  const res = await c.env.DB.prepare(
    `INSERT INTO content_drafts
     (cycle_id, platform, source_url, source_excerpt, source_author,
      source_subreddit_or_hood, pillar_tags, draft_reddit, draft_nextdoor,
      blog_brief, feature_ticket, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      cycle_id,
      platform,
      source_url,
      source_excerpt,
      source_author || null,
      source_subreddit_or_hood || null,
      pillar_tags || null,
      draft_reddit || null,
      draft_nextdoor || null,
      blog_brief || null,
      feature_ticket || null,
      status
    )
    .run();
  return c.json({ id: res.meta.last_row_id });
});

// UPDATE draft (edit content + notes)
app.patch("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  const allowed = [
    "draft_reddit",
    "draft_nextdoor",
    "blog_brief",
    "feature_ticket",
    "gustavo_notes",
    "killed_reason",
    "pillar_tags",
    "published_url",
  ];
  for (const k of allowed) {
    if (k in body) {
      fields.push(`${k} = ?`);
      values.push(body[k]);
    }
  }
  if (!fields.length) return c.json({ error: "Nothing to update" }, 400);
  fields.push(`updated_at = datetime('now')`);
  values.push(id);
  await c.env.DB.prepare(`UPDATE content_drafts SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
  return c.json({ success: true });
});

// TRANSITION status (kanban column move)
app.post("/:id/transition", async (c) => {
  const id = parseInt(c.req.param("id"));
  const { to_status, note } = await c.req.json<{ to_status: DraftStatus; note?: string }>();
  if (!VALID_STATUSES.includes(to_status)) {
    return c.json({ error: "Invalid status" }, 400);
  }
  const setStamps: string[] = [`status = ?`, `updated_at = datetime('now')`];
  const values: (string | number | null)[] = [to_status];
  if (to_status === "approved") setStamps.push(`approved_at = datetime('now')`);
  if (to_status === "published") setStamps.push(`published_at = datetime('now')`);
  if (to_status === "killed" && note) {
    setStamps.push(`killed_reason = ?`);
    values.push(note);
  }
  if (note && to_status !== "killed") {
    setStamps.push(`gustavo_notes = ?`);
    values.push(note);
  }
  values.push(id);
  await c.env.DB.prepare(`UPDATE content_drafts SET ${setStamps.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
  return c.json({ success: true });
});

// STATS for header (counts by status, this-cycle progress)
app.get("/stats/summary", async (c) => {
  const counts = await c.env.DB.prepare(
    `SELECT status, COUNT(*) as count FROM content_drafts
     WHERE datetime(created_at) > datetime('now', '-90 days')
     GROUP BY status`
  ).all<{ status: string; count: number }>();
  const totalPublished = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM content_drafts WHERE status = 'published'`
  ).first<{ count: number }>();
  return c.json({
    byStatus: counts.results || [],
    totalPublished: totalPublished?.count || 0,
  });
});

// CYCLE REQUEST: dashboard "Request new cycle" button writes here
app.post("/request-cycle", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const note = (body as { note?: string }).note || null;
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
  let requestedBy: string | null = null;
  if (sessionToken) {
    const session = await c.env.DB.prepare(
      'SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > datetime("now")'
    )
      .bind(sessionToken)
      .first<{ user_id: number }>();
    if (session) {
      const u = await c.env.DB.prepare("SELECT email FROM user_profiles WHERE id = ?")
        .bind(session.user_id)
        .first<{ email: string }>();
      requestedBy = u?.email || null;
    }
  }
  const res = await c.env.DB.prepare(
    "INSERT INTO cycle_requests (requested_by, note) VALUES (?, ?)"
  )
    .bind(requestedBy, note)
    .run();
  return c.json({ id: res.meta.last_row_id, requested_at: new Date().toISOString() });
});

// CYCLE REQUEST: show recent requests (for dashboard "last requested" indicator)
app.get("/cycle-requests/recent", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT id, requested_at, requested_by, status, fulfilled_at, cycle_id FROM cycle_requests ORDER BY id DESC LIMIT 5"
  ).all();
  return c.json({ requests: result.results || [] });
});

// GUARDRAILS: list active voice rules (read by swarm copywriter)
app.get("/guardrails/list", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT id, rule, created_at FROM content_voice_guardrails WHERE active = 1 ORDER BY id DESC LIMIT 50"
  ).all();
  return c.json({ guardrails: result.results || [] });
});

// GUARDRAILS: add a new rule (used by learning loop)
app.post("/guardrails", async (c) => {
  const { rule, source_kill_id } = await c.req.json<{ rule: string; source_kill_id?: number }>();
  if (!rule) return c.json({ error: "Missing rule" }, 400);
  const res = await c.env.DB.prepare(
    "INSERT INTO content_voice_guardrails (rule, source_kill_id) VALUES (?, ?)"
  )
    .bind(rule, source_kill_id || null)
    .run();
  return c.json({ id: res.meta.last_row_id });
});

export default app;
