// Phase 7G — Facebook Page webhook handler
// Meta sends webhook events for: new comments on Page posts, Page mentions,
// and Messenger DMs. Each event lands in unified_inbox, Bella drafts a reply.
//
// Meta webhook setup (one-time, USER):
// 1. Meta App Dashboard → Products → Webhooks
// 2. Edit Page subscription → callback URL:
//    https://remodeleriq.com/api/webhooks/facebook
// 3. Verify token: any string (set as FACEBOOK_WEBHOOK_VERIFY_TOKEN secret)
// 4. Subscribed fields: feed (comments + mentions), messages (DMs)

import { Hono } from "hono";
import type { AppEnv } from "../types";
import { classifyInboxItem } from "../lib/inboxClassifier";
import { getComment } from "../lib/facebookClient";

const app = new Hono<AppEnv>();

// GET /api/webhooks/facebook — Meta verification handshake
app.get("/facebook", async (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");
  const expected = (c.env as unknown as Record<string, string | undefined>).FACEBOOK_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected) {
    return c.text(challenge || "", 200);
  }
  return c.text("forbidden", 403);
});

// Meta webhook event shape (simplified — Meta has many variations)
interface FbWebhookPayload {
  object?: string;            // 'page' for Page events
  entry?: Array<{
    id: string;               // Page ID
    time: number;
    changes?: Array<{
      field: string;          // 'feed' | 'mention' | ...
      value: FbFeedChange;
    }>;
    messaging?: Array<FbMessagingEvent>;
  }>;
}

interface FbFeedChange {
  item?: string;              // 'comment' | 'status' | 'photo' | ...
  verb?: string;              // 'add' | 'edited' | 'remove'
  comment_id?: string;
  post_id?: string;
  parent_id?: string;
  from?: { id: string; name?: string };
  message?: string;
}

interface FbMessagingEvent {
  sender?: { id: string };
  recipient?: { id: string };
  timestamp?: number;
  message?: { mid?: string; text?: string };
}

// POST /api/webhooks/facebook — event handler
app.post("/facebook", async (c) => {
  let payload: FbWebhookPayload;
  try {
    payload = await c.req.json<FbWebhookPayload>();
  } catch {
    return c.json({ error: "invalid json" }, 400);
  }

  // We respond 200 quickly so Meta doesn't retry — process inline since
  // workloads are small
  const env = c.env as unknown as Record<string, string | undefined>;

  for (const entry of payload.entry || []) {
    // Feed changes (new comments, mentions)
    for (const change of entry.changes || []) {
      if (change.field !== "feed") continue;
      const v = change.value;
      if (v.item !== "comment" || v.verb !== "add" || !v.comment_id) continue;

      // Dedupe by external_id
      const externalId = `fb_comment_${v.comment_id}`;
      const existing = await c.env.DB.prepare(
        "SELECT id FROM unified_inbox WHERE external_id = ? LIMIT 1"
      ).bind(externalId).first();
      if (existing) continue;

      // Enrich — the webhook payload may be sparse. Fetch full comment.
      let body = v.message || "";
      let fromName = v.from?.name || "";
      const fromId = v.from?.id || "";
      if (!body) {
        const full = await getComment(env as never, v.comment_id);
        if (full) {
          body = full.message || "";
          fromName = full.from?.name || fromName;
        }
      }
      if (!body) continue;
      // Skip our own page's comments (avoid loop)
      if (fromId && env.FACEBOOK_PAGE_ID && fromId === env.FACEBOOK_PAGE_ID) continue;

      const classification = await classifyInboxItem(env, {
        source: "facebook_page_comment",
        from_handle: fromName || "(unknown FB user)",
        body,
        context: v.post_id ? `Posted on Page post ${v.post_id}` : undefined,
      });

      await c.env.DB.prepare(
        `INSERT INTO unified_inbox
           (source, external_id, from_handle, subject, body, tag, status, proposed_reply, proposed_persona)
         VALUES ('facebook_page_comment', ?, ?, ?, ?, ?, 'new', ?, 'gustavo')`
      )
        .bind(
          externalId,
          fromName || `fb:${fromId}`,
          `Comment on Facebook Page post`,
          `${classification.summary}\n\n---\n\n${body.slice(0, 4000)}`,
          classification.tag,
          classification.proposed_reply
        )
        .run();
    }

    // Messenger DMs
    for (const m of entry.messaging || []) {
      if (!m.message?.text || !m.message?.mid || !m.sender?.id) continue;
      const externalId = `fb_dm_${m.message.mid}`;
      const existing = await c.env.DB.prepare(
        "SELECT id FROM unified_inbox WHERE external_id = ? LIMIT 1"
      ).bind(externalId).first();
      if (existing) continue;

      // Skip messages FROM our own page (echo)
      if (m.sender.id === env.FACEBOOK_PAGE_ID) continue;

      const classification = await classifyInboxItem(env, {
        source: "facebook_messenger",
        from_handle: `fb_user:${m.sender.id}`,
        body: m.message.text,
      });

      await c.env.DB.prepare(
        `INSERT INTO unified_inbox
           (source, external_id, from_handle, subject, body, tag, status, proposed_reply, proposed_persona)
         VALUES ('facebook_messenger', ?, ?, ?, ?, ?, 'new', ?, 'gustavo')`
      )
        .bind(
          externalId,
          `fb_user:${m.sender.id}`,
          `Facebook Messenger DM`,
          `${classification.summary}\n\n---\n\n${m.message.text.slice(0, 4000)}`,
          classification.tag,
          classification.proposed_reply
        )
        .run();
    }
  }

  return c.json({ ok: true });
});

export default app;
