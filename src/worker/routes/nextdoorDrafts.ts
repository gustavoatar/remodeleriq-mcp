// Nextdoor Drafts API
// Powers /admin/nextdoor UI — manual Nextdoor posting queue.
// Surfaces pre-seeded standalone image+text post drafts + per-row status control.
//
// Admin-gated identical to redditDrafts.ts.

import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { type AppEnv, SESSION_COOKIE_NAME } from "../types";

const app = new Hono<AppEnv>();

export const VALID_NEXTDOOR_STATUSES = ["pending", "posted", "skipped"] as const;

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
// LIST — all nextdoor drafts, pending first then posted then skipped, by id.
// ====================================================================
app.get("/", async (c) => {
  const drafts = await c.env.DB.prepare(
    `SELECT id, post_type, text, image_url, status, created_at, posted_at
     FROM nextdoor_drafts
     ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'posted' THEN 1 ELSE 2 END,
              id`
  ).all();

  return c.json({ drafts: drafts.results || [] });
});

// ====================================================================
// STATUS — mark a draft posted / skipped / reset to pending.
// ====================================================================
app.post("/:id/status", async (c) => {
  const id = parseInt(c.req.param("id"));
  const { status } = await c.req.json<{ status: string }>();

  if (!VALID_NEXTDOOR_STATUSES.includes(status as (typeof VALID_NEXTDOOR_STATUSES)[number])) {
    return c.json({ error: "Invalid status" }, 400);
  }

  if (status === "posted") {
    await c.env.DB.prepare(
      `UPDATE nextdoor_drafts
       SET status = ?, posted_at = datetime('now')
       WHERE id = ?`
    )
      .bind(status, id)
      .run();
  } else {
    await c.env.DB.prepare(
      `UPDATE nextdoor_drafts
       SET status = ?, posted_at = NULL
       WHERE id = ?`
    )
      .bind(status, id)
      .run();
  }

  return c.json({ success: true });
});

export default app;
