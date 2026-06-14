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
import { generateBlogDraft, type BlogDraft } from "../lib/blogDrafter";
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

// Shared helper: take a generated BlogDraft and push it to WordPress as a draft
// + create the unified_inbox approval row, link back to content_drafts.
async function publishDraftToWp(
  env: AppEnv["Bindings"],
  draft: BlogDraft,
  contentDraftId: number | null
): Promise<{ wpPostId: number; wpLink: string; featuredMediaId: number | null }> {
  const blocks = draft.blocks as BlogBlock[];

  // ===== Phase 7C v2 — visual upgrade =====
  // Step 1: Generate ALL inline image blocks in parallel
  const imagenPrompts = extractImagenPrompts(blocks);
  const imageResolutions = await resolveInlineImages(env, draft.persona, imagenPrompts, draft.title);

  // Step 2: Generate the featured (hero) image
  const featuredPrompt = draft.featured_image_prompt || draft.featured_image_brief || draft.title;
  const featuredAlt = draft.featured_image_alt || draft.title;
  const featuredMediaId = await createFeaturedImage(
    env as never,
    draft.persona,
    featuredPrompt,
    featuredAlt
  );

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

// ====================================================================
// POST /draft — manual draft from a topic string
// ====================================================================
app.post("/draft", async (c) => {
  const { brief, forcePersona, forcePillar, contentDraftId } = await c.req.json<{
    brief: string;
    forcePersona?: "bella" | "gustavo";
    forcePillar?: "cost_data" | "contract_risk" | "scope_negotiation" | "regional";
    contentDraftId?: number;
  }>();

  if (!brief || brief.length < 20) {
    return c.json({ error: "Brief must be at least 20 chars" }, 400);
  }

  const apiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
  if (!apiKey) return c.json({ error: "GEMINI_API_KEY missing" }, 500);

  try {
    const draft = await generateBlogDraft(apiKey, brief, { forcePersona, forcePillar });
    const result = await publishDraftToWp(c.env, draft, contentDraftId || null);
    return c.json({
      success: true,
      persona: draft.persona,
      pillar: draft.pillar,
      title: draft.title,
      wpPostId: result.wpPostId,
      wpDraftPreview: `${result.wpLink}?preview=true`,
    });
  } catch (err) {
    console.error("Blog draft failed:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Blog draft failed" },
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

  // Find oldest unfulfilled blog brief
  const row = await c.env.DB.prepare(
    `SELECT id, blog_brief, persona FROM content_drafts
     WHERE blog_brief IS NOT NULL
       AND length(blog_brief) > 30
       AND wp_post_id IS NULL
     ORDER BY id ASC LIMIT 1`
  ).first<{ id: number; blog_brief: string; persona: string | null }>();

  if (!row) return c.json({ message: "No queued blog briefs" });

  try {
    const draft = await generateBlogDraft(apiKey, row.blog_brief);
    const result = await publishDraftToWp(c.env, draft, row.id);
    return c.json({
      success: true,
      contentDraftId: row.id,
      persona: draft.persona,
      pillar: draft.pillar,
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

    return c.json({ success: true, link: resp.link, status: resp.status });
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
