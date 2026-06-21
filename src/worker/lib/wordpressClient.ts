// Phase 7C — WordPress REST API client
// Uses Basic Auth with application passwords already stored as Cloudflare secrets:
//   WORDPRESS_USER_BELLA / WORDPRESS_PASS_BELLA
//   WORDPRESS_USER_GUSTAVO / WORDPRESS_PASS_GUSTAVO
// The persona on the draft picks which user authors the post (WP's `author` field
// resolves automatically from the authenticated user).

import { wpFetch, looksLikeSgCaptcha } from "./sgcaptcha";

const WP_BASE = "https://intelligence.remodeleriq.com/wp-json/wp/v2";

export type Persona = "bella" | "gustavo";

interface WpCredentials {
  user: string;
  pass: string;
}

interface WpEnv {
  WORDPRESS_USER_BELLA?: string;
  WORDPRESS_PASS_BELLA?: string;
  WORDPRESS_USER_GUSTAVO?: string;
  WORDPRESS_PASS_GUSTAVO?: string;
}

function credsFor(persona: Persona, env: WpEnv): WpCredentials | null {
  if (persona === "bella") {
    if (!env.WORDPRESS_USER_BELLA || !env.WORDPRESS_PASS_BELLA) return null;
    return { user: env.WORDPRESS_USER_BELLA, pass: env.WORDPRESS_PASS_BELLA };
  }
  if (!env.WORDPRESS_USER_GUSTAVO || !env.WORDPRESS_PASS_GUSTAVO) return null;
  return { user: env.WORDPRESS_USER_GUSTAVO, pass: env.WORDPRESS_PASS_GUSTAVO };
}

function basicAuth(creds: WpCredentials): string {
  // WP application passwords use Basic Auth; spaces in the password are tolerated.
  // btoa is available in Workers runtime.
  return "Basic " + btoa(`${creds.user}:${creds.pass}`);
}

// SiteGround anti-bot CAPTCHA challenges unknown User-Agents on the WP REST API.
// We send a real browser UA + Accept header to get past their first-line filter.
const WP_FETCH_HEADERS_BASE = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

export interface CreateDraftParams {
  persona: Persona;
  title: string;
  content: string;             // Gutenberg block HTML
  excerpt?: string;            // meta description / excerpt
  slug?: string;
  categories?: number[];       // WP category IDs
  tags?: number[];             // WP tag IDs
  status?: "draft" | "publish" | "pending";
  featured_media?: number;     // WP media ID of the hero image
  meta?: Record<string, unknown>;
  jsonLdHtmlInjection?: string;  // optional Article/FAQ schema injected at end of content
}

export interface WpPostResponse {
  id: number;
  status: string;
  link: string;
  slug: string;
  title: { rendered: string };
  date: string;
  modified: string;
}

export async function createWpDraft(
  env: WpEnv,
  params: CreateDraftParams
): Promise<WpPostResponse> {
  const creds = credsFor(params.persona, env);
  if (!creds) {
    throw new Error(`WordPress credentials missing for persona=${params.persona}`);
  }

  const contentWithSchema = params.jsonLdHtmlInjection
    ? `${params.content}\n\n${params.jsonLdHtmlInjection}`
    : params.content;

  const body: Record<string, unknown> = {
    title: params.title,
    content: contentWithSchema,
    status: params.status || "draft",
  };
  if (params.excerpt) body.excerpt = params.excerpt;
  if (params.slug) body.slug = params.slug;
  if (params.categories) body.categories = params.categories;
  if (params.tags) body.tags = params.tags;
  if (params.featured_media) body.featured_media = params.featured_media;
  if (params.meta) body.meta = params.meta;

  // wpFetch transparently clears a passive SiteGround sgcaptcha challenge (follow
  // the /.well-known/sgcaptcha/ handshake → clearance cookie → replay).
  const { res, text } = await wpFetch(
    `${WP_BASE}/posts`,
    {
      method: "POST",
      headers: {
        Authorization: basicAuth(creds),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    WP_FETCH_HEADERS_BASE
  );

  const contentType = res.headers.get("content-type");

  if (looksLikeSgCaptcha(contentType, text)) {
    // Surface the challenge token — it embeds the egress IP + epoch SiteGround
    // logged (e.g. y=ipc:<ip>:<epoch>), which their support needs to correlate.
    const token = text.match(/y=ip[a-z]:[^"'&\s]+/i)?.[0] || text.slice(0, 200).replace(/\s+/g, " ");
    throw new Error(
      `WP draft create blocked by SiteGround anti-bot — sgcaptcha challenge could not be cleared. ` +
        `Challenge token: ${token}. Exclude /wp-json/ from Anti-Bot AI in SiteGround Site Tools.`
    );
  }
  if (!res.ok) {
    throw new Error(`WP draft create failed: ${res.status} ${text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(text) as WpPostResponse;
  } catch {
    throw new Error(
      `WP returned 200 but body is not JSON. content-type=${contentType}. First 300 chars: ${text.slice(0, 300)}`
    );
  }
}

// Flip an existing draft to publish (used when Gustavo approves via inbox)
export async function publishWpDraft(
  env: WpEnv,
  persona: Persona,
  postId: number
): Promise<WpPostResponse> {
  const creds = credsFor(persona, env);
  if (!creds) throw new Error(`WordPress credentials missing for persona=${persona}`);

  const res = await fetch(`${WP_BASE}/posts/${postId}`, {
    method: "POST",
    headers: {
      ...WP_FETCH_HEADERS_BASE,
      Authorization: basicAuth(creds),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "publish" }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WP publish failed: ${res.status} ${text.slice(0, 300)}`);
  }

  return (await res.json()) as WpPostResponse;
}

// Fetch a post — for preview URL generation or sanity checks
export async function getWpPost(
  env: WpEnv,
  persona: Persona,
  postId: number
): Promise<WpPostResponse> {
  const creds = credsFor(persona, env);
  if (!creds) throw new Error(`WordPress credentials missing for persona=${persona}`);

  const res = await fetch(`${WP_BASE}/posts/${postId}?context=edit`, {
    headers: { ...WP_FETCH_HEADERS_BASE, Authorization: basicAuth(creds) },
  });
  if (!res.ok) throw new Error(`WP fetch failed: ${res.status}`);
  return (await res.json()) as WpPostResponse;
}

// Update an existing post's content in place (used to surgically clean already-
// published posts without regenerating them — preserves URL, images, FB links).
export async function updateWpPostContent(
  env: WpEnv,
  persona: Persona,
  postId: number,
  content: string
): Promise<void> {
  const creds = credsFor(persona, env);
  if (!creds) throw new Error(`WordPress credentials missing for persona=${persona}`);
  const res = await fetch(`${WP_BASE}/posts/${postId}`, {
    method: "POST",
    headers: { ...WP_FETCH_HEADERS_BASE, Authorization: basicAuth(creds), "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WP content update failed: ${res.status} ${text.slice(0, 300)}`);
  }
}

// Look up category/tag IDs by slug — caches via a simple in-memory map per request.
export async function findCategoryIdBySlug(
  env: WpEnv,
  persona: Persona,
  slug: string
): Promise<number | null> {
  const creds = credsFor(persona, env);
  if (!creds) return null;
  try {
    const res = await fetch(`${WP_BASE}/categories?slug=${encodeURIComponent(slug)}`, {
      headers: { ...WP_FETCH_HEADERS_BASE, Authorization: basicAuth(creds) },
    });
    if (!res.ok) return null;
    const arr = (await res.json()) as Array<{ id: number; slug: string }>;
    return arr.length > 0 ? arr[0].id : null;
  } catch {
    return null;
  }
}
