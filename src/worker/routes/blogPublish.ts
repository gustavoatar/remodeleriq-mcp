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
  findCategoryIdBySlug,
} from "../lib/wordpressClient";
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

// Resolve inline image blocks. Caps at 1 image to stay within Workers' 30s wall-time
// limit when combined with the featured image. Extra images are dropped — Bella can
// always request another generation pass post-creation if desired.
async function resolveInlineImages(
  env: AppEnv["Bindings"],
  persona: "bella" | "gustavo",
  prompts: string[],
  postTitle: string
): Promise<Map<string, ImageResolution>> {
  const resolutions = new Map<string, ImageResolution>();
  if (prompts.length === 0) return resolutions;

  // Cap to 1 inline image per draft to keep total Worker wall time bounded
  const capped = prompts.slice(0, 1);

  await Promise.all(
    capped.map(async (prompt, idx) => {
      try {
        const generated = await generateFeaturedImage(env as never, prompt);
        if (!generated) return;
        const slug = postTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40);
        const ext = generated.mimeType === "image/jpeg" ? "jpg" : "png";
        const filename = `${slug}-inline-${idx + 1}-${Date.now()}.${ext}`;
        const mediaId = await uploadFeaturedImage(
          env as never,
          persona,
          generated.bytes,
          generated.mimeType,
          filename,
          prompt.slice(0, 100)
        );
        if (!mediaId) return;
        // Build the WP CDN URL the renderer can <img src> to
        const src = `https://intelligence.remodeleriq.com/wp-json/wp/v2/media/${mediaId}`;
        // Fetch the media to get the real source_url
        try {
          const auth =
            "Basic " +
            btoa(
              `${persona === "bella" ? (env as unknown as Record<string, string>).WORDPRESS_USER_BELLA : (env as unknown as Record<string, string>).WORDPRESS_USER_GUSTAVO}:${persona === "bella" ? (env as unknown as Record<string, string>).WORDPRESS_PASS_BELLA : (env as unknown as Record<string, string>).WORDPRESS_PASS_GUSTAVO}`
            );
          const mediaRes = await fetch(src, {
            headers: {
              Authorization: auth,
              "User-Agent": "Mozilla/5.0",
              Accept: "application/json",
            },
          });
          if (mediaRes.ok) {
            const mediaJson = (await mediaRes.json()) as { source_url?: string };
            if (mediaJson.source_url) {
              resolutions.set(prompt, { src: mediaJson.source_url, mediaId });
              return;
            }
          }
        } catch (err) {
          console.error(`Inline image source_url fetch failed:`, err);
        }
        resolutions.set(prompt, { src, mediaId });
      } catch (err) {
        console.error(`Inline image gen failed for prompt "${prompt.slice(0, 50)}":`, err);
      }
    })
  );

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
  contentDraftId: number | null
): Promise<{ wpPostId: number; wpLink: string; featuredMediaId: number | null }> {
  const blocks = draft.blocks as BlogBlock[];

  // ===== Phase 7C v2 — visual upgrade =====
  // Generate inline + featured (hero) images CONCURRENTLY. Each underlying Imagen
  // call already carries its own 18s per-model timeout (see featuredImage.ts), and
  // inline images are capped to 1, so running both legs in parallel keeps total
  // image wall-time to a single ~18s window instead of stacking them. This whole
  // helper runs in a ctx.waitUntil() background task (see runBlogDraftJob), so it
  // is no longer bound by the synchronous request budget either way.
  const imagenPrompts = extractImagenPrompts(blocks);
  const featuredPrompt = draft.featured_image_prompt || draft.featured_image_brief || draft.title;
  const featuredAlt = draft.featured_image_alt || draft.title;
  const [imageResolutions, featuredMediaId] = await Promise.all([
    resolveInlineImages(env, draft.persona, imagenPrompts, draft.title),
    createFeaturedImage(env as never, draft.persona, featuredPrompt, featuredAlt),
  ]);

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

  // Resolve WP category ID by category name
  const categorySlug = draft.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const categoryId = await findCategoryIdBySlug(
    env as never,
    draft.persona,
    categorySlug
  );

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
  const result = await publishDraftToWp(env, draft, opts.contentDraftId);
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

    // Heavy work (Gemini text gen + Imagen pipeline + WP create) runs detached from
    // the request so a hub/data_report-length post can't blow the request budget and
    // drop the connection mid-flight. The WP draft + inbox row land when it finishes.
    c.executionCtx.waitUntil(
      runBlogDraftJob(c.env, apiKey, {
        brief,
        format: fmt,
        hubUrl,
        forcePersona,
        forcePillar,
        contentDraftId: contentDraftId || null,
        priorStatus,
      })
    );

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
    `SELECT id, blog_brief, persona, content_format, wp_pillar FROM content_drafts
     WHERE blog_brief IS NOT NULL
       AND length(blog_brief) > 30
       AND wp_post_id IS NULL
     ORDER BY
       CASE content_format
         WHEN 'hub' THEN 0 WHEN 'data_report' THEN 1
         WHEN 'comparison' THEN 2 ELSE 3 END,
       id ASC
     LIMIT 1`
  ).first<{ id: number; blog_brief: string; persona: string | null; content_format: string | null; wp_pillar: string | null }>();

  if (!row) return c.json({ message: "No queued blog briefs" });

  try {
    const fmt = (row.content_format || "spoke") as "hub" | "spoke" | "comparison" | "data_report";
    const hubUrl = fmt === "spoke" ? await lookupHubUrl(c.env, row.wp_pillar) : undefined;
    const draft = await generateBlogDraft(apiKey, row.blog_brief, {
      format: fmt,
      hubUrl,
      forcePillar: (row.wp_pillar as "cost_data" | "contract_risk" | "scope_negotiation" | "regional" | null) || undefined,
    });
    const result = await publishDraftToWp(c.env, draft, row.id);
    return c.json({
      success: true,
      contentDraftId: row.id,
      persona: draft.persona,
      pillar: draft.pillar,
      format: draft.format,
      linkedHub: hubUrl || null,
      title: draft.title,
      wpPostId: result.wpPostId,
      wpDraftPreview: `${result.wpLink}?preview=true`,
    });
  } catch (err) {
    console.error("Blog from-queue failed:", err);
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
        // Brief caption — full Gemini caption gen happens via /from-blog/:id manual trigger
        const fallbackCaption = `New on the RemodelerIQ blog.\n\n${resp.link}`;
        const fbPost = await createPagePost(fbEnv as never, {
          message: fallbackCaption,
          link: resp.link,
        });
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

export default app;
