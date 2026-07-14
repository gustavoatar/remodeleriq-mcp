// Phase 7C — Blog publish API
// Admin-gated. Endpoints:
//   POST /draft               — manual: take {brief, forcePersona?, forcePillar?} → WP draft + inbox row
//   POST /from-queue          — picks oldest unfulfilled blog_brief from content_drafts, drafts it
//   POST /:draftId/publish    — flips WP draft to publish + updates content_drafts.published_url
//   POST /:draftId/kill       — kills the draft (deletes from WP, updates content_drafts)
//   GET  /recent              — recent blog drafts with status

import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { type AppEnv, SESSION_COOKIE_NAME } from "../types";
import {
  generateBlogDraft,
  type BlogDraft,
  type ContentFormat,
  type Pillar,
} from "../lib/blogDrafter";
import {
  renderBlocks,
  buildFaqJsonLd,
  buildArticleJsonLd,
  extractImagenPrompts,
  type BlogBlock,
  type ImageResolution,
} from "../lib/wordpressBlocks";
import {
  createWpDraft,
  publishWpDraft,
  findOrCreateCategory,
  setPostCategories,
  getWpPost,
  updateWpPostContent,
} from "../lib/wordpressClient";
import { PILLAR_TO_WP_CATEGORY, VISUAL_STORY_PATTERN } from "../lib/blogDrafter";
import { createPagePost } from "../lib/facebookClient";
import {
  generateFeaturedImage,
  uploadFeaturedImage,
  createFeaturedImage,
} from "../lib/featuredImage";

const app = new Hono<AppEnv>();

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

// Max inline images generated per post. Runs inside the queue consumer (15-min
// wall time), so we can afford the full visual_story spread. Generated
// SEQUENTIALLY — not Promise.all — so we never burst WordPress with parallel
// media uploads (which can re-trip SiteGround Anti-Bot even with sgcaptcha).
const MAX_INLINE_IMAGES = 6;

async function resolveInlineImages(
  env: AppEnv["Bindings"],
  persona: "bella" | "gustavo",
  prompts: string[],
  postTitle: string
): Promise<Map<string, ImageResolution>> {
  const resolutions = new Map<string, ImageResolution>();
  if (prompts.length === 0) return resolutions;

  // De-dupe identical prompts (never generate/place the same image twice on a
  // page), then cap. Distinct prompts → distinct images.
  const uniquePrompts = Array.from(new Set(prompts)).slice(0, MAX_INLINE_IMAGES);
  const slug = postTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  let idx = 0;
  for (const prompt of uniquePrompts) {
    idx++;
    try {
      const generated = await generateFeaturedImage(env as never, prompt);
      if (!generated) continue;
      const ext = generated.mimeType === "image/jpeg" ? "jpg" : "png";
      const filename = `${slug}-inline-${idx}-${Date.now()}.${ext}`;
      const mediaId = await uploadFeaturedImage(
        env as never,
        persona,
        generated.bytes,
        generated.mimeType,
        filename,
        prompt.slice(0, 100)
      );
      if (!mediaId) continue;
      const src = `https://intelligence.remodeleriq.com/wp-json/wp/v2/media/${mediaId}`;
      // Fetch the media to get the real source_url
      try {
        const auth =
          "Basic " +
          btoa(
            `${persona === "bella" ? (env as unknown as Record<string, string>).WORDPRESS_USER_BELLA : (env as unknown as Record<string, string>).WORDPRESS_USER_GUSTAVO}:${persona === "bella" ? (env as unknown as Record<string, string>).WORDPRESS_PASS_BELLA : (env as unknown as Record<string, string>).WORDPRESS_PASS_GUSTAVO}`
          );
        const mediaRes = await fetch(src, {
          headers: { Authorization: auth, "User-Agent": "Mozilla/5.0", Accept: "application/json" },
        });
        if (mediaRes.ok) {
          const mediaJson = (await mediaRes.json()) as { source_url?: string };
          if (mediaJson.source_url) {
            resolutions.set(prompt, { src: mediaJson.source_url, mediaId });
            continue;
          }
        }
      } catch (err) {
        console.error(`Inline image source_url fetch failed:`, err);
      }
      resolutions.set(prompt, { src, mediaId });
    } catch (err) {
      console.error(`Inline image gen failed for prompt "${prompt.slice(0, 50)}":`, err);
    }
  }

  return resolutions;
}

// Phase 7-Pillars — find the published hub URL for a pillar so spokes can link up.
async function lookupHubUrl(
  env: AppEnv["Bindings"],
  pillar: string | null
): Promise<string | undefined> {
  if (!pillar) return undefined;
  const hub = await env.DB.prepare(
    `SELECT published_url FROM content_drafts
     WHERE wp_pillar = ? AND content_format = 'hub'
       AND published_url IS NOT NULL
     ORDER BY published_at DESC LIMIT 1`
  )
    .bind(pillar)
    .first<{ published_url: string }>();
  return hub?.published_url || undefined;
}

// Shared helper: take a generated BlogDraft and push it to WordPress as a draft
// + create the unified_inbox approval row, link back to content_drafts.
async function publishDraftToWp(
  env: AppEnv["Bindings"],
  draft: BlogDraft,
  contentDraftId: number | null,
  replaceWpPostId?: number
): Promise<{ wpPostId: number; wpLink: string; featuredMediaId: number | null }> {
  const blocks = draft.blocks as BlogBlock[];

  // ===== Phase 7C v2 — visual upgrade =====
  // Image generation is best-effort and must NEVER abort the draft. This whole
  // helper runs in a ctx.waitUntil() background task (see runBlogDraftJob), so it
  // is no longer bound by the synchronous request budget — which means we don't
  // need to race the two legs to beat a timeout. We run them SEQUENTIALLY so we
  // never fire two concurrent binary uploads at the shared WordPress host (that
  // tripped a WAF/HTML-block response). Each leg is independently guarded so a
  // failure degrades to "no image" rather than killing the post.
  const imagenPrompts = extractImagenPrompts(blocks);
  const featuredPrompt = draft.featured_image_prompt || draft.featured_image_brief || draft.title;
  const featuredAlt = draft.featured_image_alt || draft.title;

  let imageResolutions = new Map<string, ImageResolution>();
  try {
    imageResolutions = await resolveInlineImages(env, draft.persona, imagenPrompts, draft.title);
  } catch (err) {
    console.error("Inline image pipeline failed (continuing without inline images):", err);
  }

  let featuredMediaId: number | null = null;
  try {
    featuredMediaId = await createFeaturedImage(env as never, draft.persona, featuredPrompt, featuredAlt);
  } catch (err) {
    console.error("Featured image pipeline failed (continuing without hero image):", err);
  }

  // Step 3: Render blocks with resolved image URLs
  const blockHtml = renderBlocks(blocks, imageResolutions);

  // Build JSON-LD schema for FAQ + Article (Article needs published_at — use draft creation time)
  const now = new Date().toISOString();
  const articleSchema = buildArticleJsonLd({
    title: draft.title,
    description: draft.meta_description,
    url: "", // not yet published; will update after publish
    author: draft.persona,
    datePublished: now,
    dateModified: now,
  });
  const faqSchema = buildFaqJsonLd(blocks);
  const schemaInjection = [articleSchema, faqSchema].filter(Boolean).join("\n");

  // ===== In-place REFRESH path — update an existing published post's content
  // (and hero image) with freshly-rendered HTML using current renderers. Keeps
  // the URL; does NOT create a new post / content_drafts row / inbox row.
  // Trend/style posts (visual_story) live in the reader-facing "Trends" category;
  // everything else lands in its pillar category.
  const categoryName = draft.template === "visual_story" ? "Trends" : draft.category;

  if (replaceWpPostId) {
    const contentWithSchema = schemaInjection ? `${blockHtml}\n\n${schemaInjection}` : blockHtml;
    await updateWpPostContent(env as never, draft.persona, replaceWpPostId, contentWithSchema, featuredMediaId);
    // Keep the category correct on refresh too (never leave it Uncategorized).
    try {
      const catId = await findOrCreateCategory(env as never, draft.persona, categoryName);
      if (catId) await setPostCategories(env as never, draft.persona, replaceWpPostId, [catId]);
    } catch (err) {
      console.error("Refresh category assignment failed (non-fatal):", err);
    }
    await env.DB.prepare(
      "UPDATE content_drafts SET updated_at = datetime('now') WHERE wp_post_id = ?"
    ).bind(replaceWpPostId).run();
    return { wpPostId: replaceWpPostId, wpLink: "", featuredMediaId };
  }

  // Resolve WP category by name, creating it if missing (never Uncategorized).
  const categoryId = await findOrCreateCategory(env as never, draft.persona, categoryName);

  const wpResp = await createWpDraft(env as never, {
    persona: draft.persona,
    title: draft.title,
    content: blockHtml,
    excerpt: draft.meta_description,
    categories: categoryId ? [categoryId] : undefined,
    featured_media: featuredMediaId || undefined,
    status: "draft",
    jsonLdHtmlInjection: schemaInjection,
  });

  // Update or create the corresponding content_drafts row
  if (contentDraftId) {
    await env.DB.prepare(
      `UPDATE content_drafts SET
         wp_post_id = ?,
         wp_pillar = ?,
         persona = ?,
         status = 'in_review',
         blog_drafted_at = datetime('now'),
         updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(wpResp.id, draft.pillar, draft.persona, contentDraftId)
      .run();
  } else {
    // Standalone manual draft — create a fresh content_drafts row for tracking
    await env.DB.prepare(
      `INSERT INTO content_drafts
         (cycle_id, platform, source_url, source_excerpt, blog_brief,
          persona, wp_post_id, wp_pillar, status, blog_drafted_at)
       VALUES (?, 'blog', ?, ?, ?, ?, ?, ?, 'in_review', datetime('now'))`
    )
      .bind(
        `blog-manual-${Date.now()}`,
        wpResp.link,
        `Blog post: ${draft.title}`,
        draft.title,
        draft.persona,
        wpResp.id,
        draft.pillar
      )
      .run();
  }

  // Drop an approval row into unified_inbox so it appears in /admin/inbox
  await env.DB.prepare(
    `INSERT INTO unified_inbox
       (source, external_id, from_handle, subject, body, related_draft_id,
        tag, status, proposed_persona)
     VALUES ('draft_pending', ?, ?, ?, ?, ?, 'approval', 'new', ?)`
  )
    .bind(
      `wp-${wpResp.id}`,
      draft.persona,
      `[BLOG DRAFT] ${draft.title}`,
      `Pillar: ${draft.category}\nPreview: ${wpResp.link}?preview=true\nMeta: ${draft.meta_description}\n\nFirst block:\n${blocks[0] && blocks[0].type === "hero" ? (blocks[0] as { snippet_paragraph: string }).snippet_paragraph : draft.meta_description}`,
      contentDraftId,
      draft.persona
    )
    .run();

  return { wpPostId: wpResp.id, wpLink: wpResp.link, featuredMediaId };
}

// Sentinel status used to "claim" a content_drafts row while its draft + images
// are being generated in the background. Both the manual /from-queue selector and
// the Sunday cron selector exclude rows in this state so a second trigger can't
// pick up a brief that's already mid-flight.
export const BLOG_DRAFTING_STATUS = "blog_drafting";

// Queue message shape for offloading the heavy draft+image pipeline. The HTTP
// endpoints and the Sunday cron are PRODUCERS (claim the row, enqueue, return);
// the queue CONSUMER (see processBlogDraftMessage + the `queue` handler in
// index.ts) runs the pipeline in its own invocation with a full budget. A
// request handler's ctx.waitUntil() is capped at ~30s after the response is sent
// — too short for a hub/data_report-length post (Gemini text gen + 2 Imagen
// calls + WP create runs ~35-45s), which is exactly why we route through a queue.
export interface BlogDraftJobMessage {
  brief: string;
  format: ContentFormat;
  hubUrl?: string;
  forcePersona?: "bella" | "gustavo";
  forcePillar?: Pillar;
  contentDraftId: number | null;
  /** Status to restore if the job fails (only used when contentDraftId is set). */
  priorStatus?: string | null;
  /** When set, refresh this existing WP post's content in place (no new post). */
  replaceWpPostId?: number;
}

// Full text + image pipeline as one call: classify/generate the draft via Gemini,
// run the heavy image pipeline, push the WP draft, and drop the unified_inbox row.
export async function generateAndPublishBlog(
  env: AppEnv["Bindings"],
  apiKey: string,
  opts: {
    brief: string;
    format: ContentFormat;
    hubUrl?: string;
    forcePersona?: "bella" | "gustavo";
    forcePillar?: Pillar;
    contentDraftId: number | null;
    /** When set, update this existing WP post in place instead of creating a new one. */
    replaceWpPostId?: number;
  }
): Promise<{
  wpPostId: number;
  wpLink: string;
  title: string;
  persona: "bella" | "gustavo";
  pillar: Pillar;
  format: ContentFormat;
}> {
  const draft = await generateBlogDraft(apiKey, opts.brief, {
    forcePersona: opts.forcePersona,
    forcePillar: opts.forcePillar,
    format: opts.format,
    hubUrl: opts.hubUrl,
  });
  const result = await publishDraftToWp(env, draft, opts.contentDraftId, opts.replaceWpPostId);
  return {
    wpPostId: result.wpPostId,
    wpLink: result.wpLink,
    title: draft.title,
    persona: draft.persona,
    pillar: draft.pillar,
    format: draft.format,
  };
}

// Background-safe wrapper for generateAndPublishBlog. Designed to be handed to
// ctx.waitUntil() so the heavy Gemini text gen + Imagen pipeline (which blows past
// the synchronous request budget on hub/data_report-length posts) runs detached
// from the client connection. On failure it RELEASES the claim by restoring the
// row's prior status, so the brief becomes eligible again on the next trigger.
export async function runBlogDraftJob(
  env: AppEnv["Bindings"],
  apiKey: string,
  opts: {
    brief: string;
    format: ContentFormat;
    hubUrl?: string;
    forcePersona?: "bella" | "gustavo";
    forcePillar?: Pillar;
    contentDraftId: number | null;
    /** Status to restore if the job fails (only used when contentDraftId is set). */
    priorStatus?: string | null;
    /** When set, refresh this existing WP post in place (no new post). */
    replaceWpPostId?: number;
  }
): Promise<void> {
  try {
    const result = await generateAndPublishBlog(env, apiKey, opts);
    console.log(
      `Blog draft job complete: ${result.persona} / ${result.pillar} / WP #${result.wpPostId}` +
        (opts.contentDraftId ? ` (content_draft ${opts.contentDraftId})` : "")
    );
  } catch (err) {
    console.error("Blog draft job failed:", err);
    // Release the claim so the brief can be retried. Guard on the sentinel so we
    // never clobber a status set by a concurrent/later run.
    if (opts.contentDraftId != null) {
      try {
        await env.DB.prepare(
          `UPDATE content_drafts SET status = ?, updated_at = datetime('now')
           WHERE id = ? AND status = ?`
        )
          .bind(opts.priorStatus ?? "blog_brief", opts.contentDraftId, BLOG_DRAFTING_STATUS)
          .run();
      } catch (releaseErr) {
        console.error("Failed to release blog draft claim:", releaseErr);
      }
    }
  }
}

// Claim a content_drafts row for background drafting by flipping it to the
// BLOG_DRAFTING_STATUS sentinel. Guarded on wp_post_id IS NULL + sentinel-free so
// two concurrent triggers can't both win the same row. Returns true if claimed.
export async function claimBlogDraftRow(
  env: AppEnv["Bindings"],
  contentDraftId: number
): Promise<boolean> {
  const res = await env.DB.prepare(
    `UPDATE content_drafts SET status = ?, updated_at = datetime('now')
     WHERE id = ? AND wp_post_id IS NULL AND (status IS NULL OR status != ?)`
  )
    .bind(BLOG_DRAFTING_STATUS, contentDraftId, BLOG_DRAFTING_STATUS)
    .run();
  return (res.meta.changes || 0) > 0;
}

// Queue consumer entry point — process one BlogDraftJobMessage. Idempotent on
// redelivery: if the row already has a wp_post_id (a prior attempt succeeded), we
// skip rather than create a duplicate WP draft. runBlogDraftJob handles its own
// errors + claim release, so this never throws on a logical drafting failure.
export async function processBlogDraftMessage(
  env: AppEnv["Bindings"],
  apiKey: string,
  msg: BlogDraftJobMessage
): Promise<void> {
  if (msg.contentDraftId != null) {
    const existing = await env.DB.prepare(
      "SELECT wp_post_id FROM content_drafts WHERE id = ?"
    )
      .bind(msg.contentDraftId)
      .first<{ wp_post_id: number | null }>();
    if (existing?.wp_post_id) {
      console.log(
        `Blog draft message for content_draft ${msg.contentDraftId} skipped — wp_post_id ${existing.wp_post_id} already set`
      );
      return;
    }
  }
  await runBlogDraftJob(env, apiKey, msg);
}

// ====================================================================
// POST /draft — manual draft from a topic string
// ====================================================================
app.post("/draft", async (c) => {
  const { brief, forcePersona, forcePillar, format, contentDraftId } = await c.req.json<{
    brief: string;
    forcePersona?: "bella" | "gustavo";
    forcePillar?: "cost_data" | "contract_risk" | "scope_negotiation" | "regional";
    format?: "hub" | "spoke" | "comparison" | "data_report";
    contentDraftId?: number;
  }>();

  if (!brief || brief.length < 20) {
    return c.json({ error: "Brief must be at least 20 chars" }, 400);
  }

  const apiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
  if (!apiKey) return c.json({ error: "GEMINI_API_KEY missing" }, 500);

  try {
    const fmt = format || "spoke";
    const hubUrl = fmt === "spoke" ? await lookupHubUrl(c.env, forcePillar || null) : undefined;

    // If this maps to an existing queued brief, claim it so a concurrent
    // /from-queue or the Sunday cron can't grab it while we draft in the background.
    let priorStatus: string | null = null;
    if (contentDraftId) {
      const existing = await c.env.DB.prepare(
        "SELECT status FROM content_drafts WHERE id = ?"
      )
        .bind(contentDraftId)
        .first<{ status: string | null }>();
      priorStatus = existing?.status ?? null;
      await claimBlogDraftRow(c.env, contentDraftId);
    }

    // Heavy work (Gemini text gen + Imagen pipeline + WP create) is offloaded to a
    // queue consumer with a full invocation budget — a request handler's
    // ctx.waitUntil() is capped at ~30s, too short for a hub-length post. The WP
    // draft + inbox row land when the consumer finishes.
    await c.env.BLOG_QUEUE.send({
      brief,
      format: fmt,
      hubUrl,
      forcePersona,
      forcePillar,
      contentDraftId: contentDraftId || null,
      priorStatus,
    } satisfies BlogDraftJobMessage);

    return c.json(
      {
        status: "drafting",
        contentDraftId: contentDraftId || null,
        linkedHub: hubUrl || null,
        message:
          "Draft + images are generating in the background. The WP draft and inbox approval row will appear when complete (wp_post_id gets set on the content_drafts row).",
      },
      202
    );
  } catch (err) {
    console.error("Blog draft scheduling failed:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Blog draft scheduling failed" },
      500
    );
  }
});

// ====================================================================
// POST /from-queue — auto-pick oldest blog_brief and draft it
// ====================================================================
app.post("/from-queue", async (c) => {
  const apiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
  if (!apiKey) return c.json({ error: "GEMINI_API_KEY missing" }, 500);

  // Find next brief — hubs first (so spokes have a hub to link to), then
  // data reports, comparisons, spokes; oldest within a tier.
  const row = await c.env.DB.prepare(
    `SELECT id, blog_brief, persona, content_format, wp_pillar, status FROM content_drafts
     WHERE blog_brief IS NOT NULL
       AND length(blog_brief) > 30
       AND wp_post_id IS NULL
       AND (status IS NULL OR status != ?)
     ORDER BY
       CASE content_format
         WHEN 'hub' THEN 0 WHEN 'data_report' THEN 1
         WHEN 'comparison' THEN 2 ELSE 3 END,
       id ASC
     LIMIT 1`
  )
    .bind(BLOG_DRAFTING_STATUS)
    .first<{ id: number; blog_brief: string; persona: string | null; content_format: string | null; wp_pillar: string | null; status: string | null }>();

  if (!row) return c.json({ message: "No queued blog briefs" });

  try {
    // Claim the row before backgrounding so a second trigger (or the Sunday cron)
    // can't pick up the same brief while it's mid-flight.
    const claimed = await claimBlogDraftRow(c.env, row.id);
    if (!claimed) {
      // Lost the race — another trigger grabbed it between SELECT and UPDATE.
      return c.json({ message: "Brief already being drafted", contentDraftId: row.id }, 409);
    }

    const fmt = (row.content_format || "spoke") as ContentFormat;
    const hubUrl = fmt === "spoke" ? await lookupHubUrl(c.env, row.wp_pillar) : undefined;

    // Offload the heavy text gen + image pipeline to the queue consumer — see /draft.
    await c.env.BLOG_QUEUE.send({
      brief: row.blog_brief,
      format: fmt,
      hubUrl,
      forcePillar: (row.wp_pillar as Pillar | null) || undefined,
      contentDraftId: row.id,
      priorStatus: row.status ?? "blog_brief",
    } satisfies BlogDraftJobMessage);

    return c.json(
      {
        status: "drafting",
        contentDraftId: row.id,
        linkedHub: hubUrl || null,
        message:
          "Draft + images are generating in the background. wp_post_id will be set on the content_drafts row and an inbox approval row created when complete.",
      },
      202
    );
  } catch (err) {
    console.error("Blog from-queue failed:", err);
    // Best-effort release of the claim so the brief isn't stuck.
    try {
      await c.env.DB.prepare(
        `UPDATE content_drafts SET status = ?, updated_at = datetime('now')
         WHERE id = ? AND status = ?`
      )
        .bind(row.status ?? "blog_brief", row.id, BLOG_DRAFTING_STATUS)
        .run();
    } catch { /* ignore */ }
    return c.json(
      { error: err instanceof Error ? err.message : "Blog from-queue failed" },
      500
    );
  }
});

// ====================================================================
// POST /:contentDraftId/publish — flip WP draft to publish
// ====================================================================
app.post("/:contentDraftId/publish", async (c) => {
  const contentDraftId = parseInt(c.req.param("contentDraftId"));
  const row = await c.env.DB.prepare(
    "SELECT id, wp_post_id, persona FROM content_drafts WHERE id = ?"
  )
    .bind(contentDraftId)
    .first<{ id: number; wp_post_id: number | null; persona: string | null }>();

  if (!row || !row.wp_post_id) {
    return c.json({ error: "No WordPress draft tracked for this content_drafts row" }, 404);
  }
  const persona = (row.persona || "bella") as "bella" | "gustavo";

  try {
    const resp = await publishWpDraft(c.env as never, persona, row.wp_post_id);
    await c.env.DB.prepare(
      `UPDATE content_drafts SET
         status = 'published',
         published_url = ?,
         published_at = datetime('now'),
         updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(resp.link, contentDraftId)
      .run();

    // Mark the inbox row as actioned
    await c.env.DB.prepare(
      "UPDATE unified_inbox SET status = 'actioned', actioned_at = datetime('now') WHERE external_id = ?"
    )
      .bind(`wp-${row.wp_post_id}`)
      .run();

    // Phase 7G — Cross-post to Facebook Page (best-effort, never fails the WP publish)
    let fbResult: { posted: boolean; fb_post_id?: string; error?: string } = { posted: false };
    try {
      const fbEnv = c.env as unknown as Record<string, string | undefined>;
      if (fbEnv.FACEBOOK_PAGE_ID && fbEnv.FACEBOOK_PAGE_ACCESS_TOKEN) {
        // Pull the article's title + featured image so the share shows the REAL
        // hero image (not the site logo that FB pulls as the og:image on a bare
        // link). Post as a photo with an emoji caption + the link in the body.
        let imageUrl: string | undefined;
        let title = "";
        try {
          const wpRes = await fetch(
            `https://intelligence.remodeleriq.com/wp-json/wp/v2/posts/${row.wp_post_id}?_fields=title&_embed=wp:featuredmedia`,
            { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } }
          );
          if (wpRes.ok) {
            const wp = (await wpRes.json()) as {
              title?: { rendered?: string };
              _embedded?: { "wp:featuredmedia"?: Array<{ source_url?: string }> };
            };
            title = (wp.title?.rendered || "")
              .replace(/&amp;/g, "&").replace(/&#8217;|&#039;|&rsquo;/g, "'").replace(/&#8211;|&ndash;/g, "–");
            imageUrl = wp._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
          }
        } catch { /* fall back to a plain link share */ }

        const hook = title ? `📐 ${title}` : "📐 New on the RemodelerIQ blog";
        const caption = `${hook}\n\nThe full breakdown — with the real numbers — is on the blog 👇\n${resp.link}`;
        const fbPost = await createPagePost(
          fbEnv as never,
          imageUrl ? { message: caption, image_url: imageUrl } : { message: caption, link: resp.link }
        );
        fbResult = { posted: true, fb_post_id: fbPost.id };
      }
    } catch (fbErr) {
      console.warn("FB cross-post failed (non-fatal):", fbErr);
      fbResult = { posted: false, error: fbErr instanceof Error ? fbErr.message : "unknown" };
    }

    return c.json({ success: true, link: resp.link, status: resp.status, facebook: fbResult });
  } catch (err) {
    console.error("Blog publish failed:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Blog publish failed" },
      500
    );
  }
});

// ====================================================================
// GET /recent — list recent blog drafts (with WP IDs)
// ====================================================================
app.get("/recent", async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT id, persona, wp_pillar, wp_post_id, status, published_url,
            substr(blog_brief, 1, 200) as brief_preview,
            blog_drafted_at, published_at
     FROM content_drafts
     WHERE wp_post_id IS NOT NULL
     ORDER BY blog_drafted_at DESC LIMIT 50`
  ).all();
  return c.json({ posts: rows.results || [] });
});

// ====================================================================
// POST /:wpPostId/strip-spans — surgically remove leaked escaped <span> markup
// from an ALREADY-PUBLISHED post's stored content, in place. Keeps the inner
// text, URL, images, and FB cross-post intact (no regeneration).
// ====================================================================
app.post("/:wpPostId/strip-spans", async (c) => {
  const wpPostId = parseInt(c.req.param("wpPostId"));
  if (!wpPostId) return c.json({ error: "bad wpPostId" }, 400);

  // Persona drives which WP credentials can edit the post.
  const row = await c.env.DB.prepare(
    "SELECT persona FROM content_drafts WHERE wp_post_id = ? LIMIT 1"
  ).bind(wpPostId).first<{ persona: string | null }>();
  const persona = (row?.persona || "bella") as "bella" | "gustavo";

  try {
    const post = await getWpPost(c.env as never, persona, wpPostId);
    const pc = (post as unknown as { content?: { raw?: string; rendered?: string } }).content;
    const raw = pc?.raw ?? pc?.rendered ?? "";
    if (!raw) return c.json({ error: "no content" }, 404);

    // Strip ONLY escaped span markers (Gemini leaks). Raw renderer spans
    // (dropcap, inline-styled) are untouched. Handles single + double escaping.
    const before = (raw.match(/&(?:amp;)?lt;\/?span/gi) || []).length;
    const cleaned = raw
      .replace(/&(?:amp;)?lt;span\b[^&]*?&(?:amp;)?gt;/gi, "")
      .replace(/&(?:amp;)?lt;\/span&(?:amp;)?gt;/gi, "");

    if (before === 0) return c.json({ success: true, stripped: 0, note: "already clean" });

    await updateWpPostContent(c.env as never, persona, wpPostId, cleaned);
    return c.json({ success: true, stripped: before, persona });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "strip failed" }, 500);
  }
});

// POST /:wpPostId/strip-broken-chart — surgically remove any chart block whose
// bars rendered at zero (width="0" / "0.0%") — a data-less block that shipped
// before the chartHasData() guard existed. Leaves valid charts and all other
// content untouched. In-place, no regeneration.
// ====================================================================
app.post("/:wpPostId/strip-broken-chart", async (c) => {
  const wpPostId = parseInt(c.req.param("wpPostId"));
  if (!wpPostId) return c.json({ error: "bad wpPostId" }, 400);

  const row = await c.env.DB.prepare(
    "SELECT persona FROM content_drafts WHERE wp_post_id = ? LIMIT 1"
  ).bind(wpPostId).first<{ persona: string | null }>();
  const persona = (row?.persona || "bella") as "bella" | "gustavo";

  try {
    const post = await getWpPost(c.env as never, persona, wpPostId);
    const pc = (post as unknown as { content?: { raw?: string; rendered?: string } }).content;
    const raw = pc?.raw ?? pc?.rendered ?? "";
    if (!raw) return c.json({ error: "no content" }, 404);

    let removed = 0;
    // Match the chart wrapper (with or without its wp:html comment wrapper) and
    // drop it only when it contains a zero-width bar — the broken-chart signature.
    const cleaned = raw
      .replace(
        /(?:<!-- wp:html -->\s*)?<div class="riq-chart-wrap"[\s\S]*?<\/div>(?:\s*<!-- \/wp:html -->)?/g,
        (m) => {
          if (/width="0"/.test(m)) { removed++; return ""; }
          return m;
        }
      )
      .replace(/\n{3,}/g, "\n\n");

    if (removed === 0) return c.json({ success: true, removed: 0, note: "no broken chart found" });

    await updateWpPostContent(c.env as never, persona, wpPostId, cleaned);
    return c.json({ success: true, removed, persona });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "strip failed" }, 500);
  }
});

// ====================================================================
// POST /:wpPostId/refresh — regenerate an existing published post's content
// with the CURRENT renderers (fixes chart clipping, span leaks, layout, etc.)
// and update it IN PLACE — same URL, no duplicate. Heavy work runs via the queue.
// ====================================================================
app.post("/:wpPostId/refresh", async (c) => {
  const wpPostId = parseInt(c.req.param("wpPostId"));
  if (!wpPostId) return c.json({ error: "bad wpPostId" }, 400);

  const row = await c.env.DB.prepare(
    `SELECT blog_brief, wp_pillar, persona, content_format
     FROM content_drafts WHERE wp_post_id = ? LIMIT 1`
  ).bind(wpPostId).first<{
    blog_brief: string | null;
    wp_pillar: string | null;
    persona: string | null;
    content_format: string | null;
  }>();
  if (!row?.blog_brief) return c.json({ error: "no brief tracked for this post" }, 404);

  const fmt = (row.content_format || "spoke") as ContentFormat;
  const hubUrl = fmt === "spoke" ? await lookupHubUrl(c.env, row.wp_pillar) : undefined;

  await c.env.BLOG_QUEUE.send({
    brief: row.blog_brief,
    format: fmt,
    hubUrl,
    forcePersona: (row.persona as "bella" | "gustavo" | null) || undefined,
    forcePillar: (row.wp_pillar as Pillar | null) || undefined,
    contentDraftId: null, // null → skips the "already has wp_post_id" idempotency guard
    replaceWpPostId: wpPostId,
  } satisfies BlogDraftJobMessage);

  return c.json(
    { status: "refreshing", wpPostId, message: "Regenerating content in place with current renderers." },
    202
  );
});

// ====================================================================
// POST /:wpPostId/fix-category — assign the correct pillar category to an
// already-published post (creating the category if needed). Lightweight: no
// regeneration, just moves it out of Uncategorized.
// ====================================================================
app.post("/:wpPostId/fix-category", async (c) => {
  const wpPostId = parseInt(c.req.param("wpPostId"));
  if (!wpPostId) return c.json({ error: "bad wpPostId" }, 400);

  const row = await c.env.DB.prepare(
    "SELECT persona, wp_pillar, content_format, blog_brief FROM content_drafts WHERE wp_post_id = ? LIMIT 1"
  ).bind(wpPostId).first<{ persona: string | null; wp_pillar: string | null; content_format: string | null; blog_brief: string | null }>();
  if (!row) return c.json({ error: "post not tracked" }, 404);

  const persona = (row.persona || "bella") as "bella" | "gustavo";
  const pillar = (row.wp_pillar || "scope_negotiation") as keyof typeof PILLAR_TO_WP_CATEGORY;
  // Trend/style posts → "Trends"; otherwise the pillar category.
  const isTrend = VISUAL_STORY_PATTERN.test(row.blog_brief || "");
  const categoryName = isTrend ? "Trends" : (PILLAR_TO_WP_CATEGORY[pillar] || "Remodeling Guide");

  try {
    const catId = await findOrCreateCategory(c.env as never, persona, categoryName);
    if (!catId) return c.json({ error: "could not resolve/create category" }, 500);
    await setPostCategories(c.env as never, persona, wpPostId, [catId]);
    return c.json({ success: true, wpPostId, category: categoryName, categoryId: catId });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "fix-category failed" }, 500);
  }
});

export default app;
