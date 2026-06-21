// Phase 7G — Facebook Page publishing endpoints (admin-gated)
// Manual + cron-triggered posting flows.

import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { GoogleGenAI } from "@google/genai";
import { type AppEnv, SESSION_COOKIE_NAME } from "../types";
import { createPagePost, verifyToken, replyToComment } from "../lib/facebookClient";
import { generateAndScheduleFbBatch } from "../lib/fbContentGenerator";

const app = new Hono<AppEnv>();

function isAdminEmail(email: string, env: unknown): boolean {
  const list = ((env as Record<string, unknown>).ADMIN_EMAILS as string | undefined ||
    "gustavo.atar@gmail.com,gustavo@remodeleriq.com")
    .split(",").map((e) => e.trim().toLowerCase());
  return list.includes(email.toLowerCase());
}

app.use("*", async (c, next) => {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
  if (!sessionToken) return c.json({ error: "Unauthorized" }, 401);
  const session = await c.env.DB.prepare(
    'SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > datetime("now")'
  ).bind(sessionToken).first<{ user_id: number }>();
  if (!session) return c.json({ error: "Unauthorized" }, 401);
  const user = await c.env.DB.prepare("SELECT email FROM user_profiles WHERE id = ?")
    .bind(session.user_id).first<{ email: string }>();
  if (!user || !isAdminEmail(user.email, c.env)) return c.json({ error: "Forbidden" }, 403);
  await next();
});

const FB_CAPTION_BRIEF = `You are Bella writing a Facebook Page post for RemodelerIQ. Compress the blog post into a scroll-stopping Facebook caption.

CONSTRAINTS:
- 80-160 words (Facebook truncates after ~250 chars but the full text is in the "See more")
- Open with a hook — a question, a stat, a "Most homeowners don't realize..." pattern
- Front-load the most provocative or specific data point
- Use line breaks every 1-2 sentences for mobile scannability
- One soft CTA at the end pointing readers to the full post
- NO hashtags (Facebook deprioritizes them on Page posts)
- Match RemodelerIQ voice: warm, expert, data-as-hero, never marketing-speak

Return ONLY this JSON: {"caption": "the facebook post text"}`;

// GET /verify-token — health check the Page Access Token
app.get("/verify-token", async (c) => {
  const result = await verifyToken(c.env as never);
  return c.json(result);
});

// POST /from-blog/:contentDraftId — cross-post an existing blog post to Facebook
// Body: { schedule_hours_ahead?: number } — optional, default = publish now
app.post("/from-blog/:contentDraftId", async (c) => {
  const contentDraftId = parseInt(c.req.param("contentDraftId"));
  const body = await c.req.json<{ schedule_hours_ahead?: number }>().catch(() => ({} as { schedule_hours_ahead?: number }));
  const schedule_hours_ahead = body.schedule_hours_ahead;

  // Look up the WordPress URL + title from content_drafts
  const row = await c.env.DB.prepare(
    `SELECT id, persona, source_excerpt, published_url, wp_post_id, blog_brief
     FROM content_drafts
     WHERE id = ? AND wp_post_id IS NOT NULL`
  ).bind(contentDraftId).first<{
    id: number;
    persona: string | null;
    source_excerpt: string;
    published_url: string | null;
    wp_post_id: number | null;
    blog_brief: string | null;
  }>();

  if (!row) return c.json({ error: "Blog post not found or not published" }, 404);
  if (!row.published_url) return c.json({ error: "Blog post not yet published to WP" }, 400);

  const apiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
  if (!apiKey) return c.json({ error: "GEMINI_API_KEY missing" }, 500);

  // Generate Facebook caption via Gemini
  const client = new GoogleGenAI({ apiKey });
  const userPrompt = `BLOG TITLE: ${row.source_excerpt}\nBLOG BRIEF: ${row.blog_brief || ""}\nBLOG URL: ${row.published_url}\n\nWrite the Facebook caption per the system rules.`;
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userPrompt,
    config: { responseMimeType: "application/json", systemInstruction: FB_CAPTION_BRIEF, thinkingConfig: { thinkingBudget: 0 } },
  });

  let caption = "";
  try {
    const raw = response.text || "{}";
    let cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(cleaned) as { caption?: string };
    caption = parsed.caption || "";
  } catch {
    return c.json({ error: "Caption generation failed" }, 500);
  }
  if (!caption) return c.json({ error: "Empty caption" }, 500);

  try {
    const scheduled = schedule_hours_ahead
      ? Math.floor(Date.now() / 1000) + schedule_hours_ahead * 3600
      : undefined;
    const post = await createPagePost(c.env as never, {
      message: caption,
      link: row.published_url,
      scheduled_publish_time: scheduled,
    });
    return c.json({
      success: true,
      fb_post_id: post.id,
      caption,
      link: row.published_url,
      scheduled_unix: scheduled,
    });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Page post failed" }, 500);
  }
});

// POST /custom — publish a manual Facebook post (admin-composed)
app.post("/custom", async (c) => {
  const { message, link, image_url, schedule_hours_ahead } = await c.req.json<{
    message: string;
    link?: string;
    image_url?: string;
    schedule_hours_ahead?: number;
  }>();
  if (!message) return c.json({ error: "message required" }, 400);

  try {
    const scheduled = schedule_hours_ahead
      ? Math.floor(Date.now() / 1000) + schedule_hours_ahead * 3600
      : undefined;
    const post = await createPagePost(c.env as never, {
      message,
      link,
      image_url,
      scheduled_publish_time: scheduled,
    });
    return c.json({ success: true, fb_post_id: post.id, scheduled_unix: scheduled });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Page post failed" }, 500);
  }
});

// POST /generate-batch — generate a weekly batch of brand-voice posts with branded
// images and schedule them out (+2/+4/+6/+8 days). Body: { count?: number } (default 4).
app.post("/generate-batch", async (c) => {
  const body = await c.req.json<{ count?: number }>().catch(() => ({} as { count?: number }));
  const count = body.count && body.count > 0 ? body.count : 4;
  const nowSeconds = Math.floor(Date.now() / 1000);
  try {
    const summary = await generateAndScheduleFbBatch(c.env as never, nowSeconds, count);
    return c.json(summary);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Batch generation failed" }, 500);
  }
});

// POST /reply-comment/:inboxId — approve + send the proposed_reply for a facebook_page_comment row
app.post("/reply-comment/:inboxId", async (c) => {
  const inboxId = parseInt(c.req.param("inboxId"));
  const reqBody = await c.req.json<{ message?: string }>().catch(() => ({} as { message?: string }));
  const message = reqBody.message;

  const row = await c.env.DB.prepare(
    `SELECT id, source, external_id, proposed_reply FROM unified_inbox
     WHERE id = ? AND source = 'facebook_page_comment'`
  ).bind(inboxId).first<{ id: number; external_id: string; proposed_reply: string | null }>();
  if (!row) return c.json({ error: "Inbox row not found or not a FB comment" }, 404);

  // The external_id is 'fb_comment_{comment_id}' — extract the comment_id
  const commentId = row.external_id.replace(/^fb_comment_/, "");
  const replyMessage = message || row.proposed_reply;
  if (!replyMessage) return c.json({ error: "No message to send" }, 400);

  try {
    const result = await replyToComment(c.env as never, commentId, replyMessage);
    await c.env.DB.prepare(
      "UPDATE unified_inbox SET status = 'actioned', actioned_at = datetime('now') WHERE id = ?"
    ).bind(inboxId).run();
    return c.json({ success: true, fb_reply_id: result.id });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Reply failed" }, 500);
  }
});

export default app;
