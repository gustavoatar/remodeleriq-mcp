// Phase 7G — Facebook Page Graph API client
// Wraps the Meta Graph API for Page posting + comment management.
//
// Uses long-lived Page Access Tokens (~60 day lifetime). Token refresh is
// handled by calling /me?fields=id,name once a week — if it fails with 190/463,
// we surface a clear error to the inbox so Gustavo can regenerate the token.

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface FbEnv {
  FACEBOOK_PAGE_ID?: string;
  FACEBOOK_PAGE_ACCESS_TOKEN?: string;
}

export interface FbPostParams {
  message: string;        // The body of the post
  link?: string;          // Optional URL to attach (preview thumbnail auto-pulled)
  image_url?: string;     // Optional image to attach via /photos endpoint
  scheduled_publish_time?: number; // Unix timestamp for scheduled posts
}

export interface FbPostResponse {
  id: string;             // {page_id}_{post_id} format
  permalink?: string;
}

export interface FbCommentResponse {
  id: string;
  message?: string;
  from?: { id: string; name: string };
  created_time?: string;
}

function authParams(env: FbEnv): URLSearchParams | null {
  if (!env.FACEBOOK_PAGE_ACCESS_TOKEN) return null;
  const p = new URLSearchParams();
  p.set("access_token", env.FACEBOOK_PAGE_ACCESS_TOKEN);
  return p;
}

// Create a feed post on the Page. Supports plain text, text+link, or
// text+image. For image posts we use /photos (the Page Posts API doesn't
// take image attachments directly — Meta wants you to /photos with caption).
export async function createPagePost(
  env: FbEnv,
  params: FbPostParams
): Promise<FbPostResponse> {
  if (!env.FACEBOOK_PAGE_ID) throw new Error("FACEBOOK_PAGE_ID missing");
  const auth = authParams(env);
  if (!auth) throw new Error("FACEBOOK_PAGE_ACCESS_TOKEN missing");

  const pageId = env.FACEBOOK_PAGE_ID;

  // Image post path — uses /photos with caption (becomes the post body)
  if (params.image_url) {
    const body = new URLSearchParams(auth);
    body.set("url", params.image_url);
    body.set("caption", params.message);
    if (params.scheduled_publish_time) {
      body.set("scheduled_publish_time", String(params.scheduled_publish_time));
      body.set("published", "false");
    }
    const res = await fetch(`${GRAPH_BASE}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const json = (await res.json()) as { id?: string; post_id?: string; error?: { message: string; code: number } };
    if (!res.ok || json.error) {
      throw new Error(`FB photo post failed: ${json.error?.message || res.status}`);
    }
    return { id: json.post_id || json.id || "" };
  }

  // Text or text+link path — uses /feed
  const body = new URLSearchParams(auth);
  body.set("message", params.message);
  if (params.link) body.set("link", params.link);
  if (params.scheduled_publish_time) {
    body.set("scheduled_publish_time", String(params.scheduled_publish_time));
    body.set("published", "false");
  }
  const res = await fetch(`${GRAPH_BASE}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const json = (await res.json()) as { id?: string; error?: { message: string; code: number } };
  if (!res.ok || json.error) {
    throw new Error(`FB feed post failed: ${json.error?.message || res.status}`);
  }
  return { id: json.id || "" };
}

// Reply to a comment on a Page post (used by the engagement auto-reply flow)
export async function replyToComment(
  env: FbEnv,
  commentId: string,
  message: string
): Promise<{ id: string }> {
  const auth = authParams(env);
  if (!auth) throw new Error("FACEBOOK_PAGE_ACCESS_TOKEN missing");
  const body = new URLSearchParams(auth);
  body.set("message", message);
  const res = await fetch(`${GRAPH_BASE}/${commentId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const json = (await res.json()) as { id?: string; error?: { message: string } };
  if (!res.ok || json.error) {
    throw new Error(`FB comment reply failed: ${json.error?.message || res.status}`);
  }
  return { id: json.id || "" };
}

// Fetch a comment by ID (used to enrich webhook events that only give us the comment_id)
export async function getComment(env: FbEnv, commentId: string): Promise<FbCommentResponse | null> {
  const auth = authParams(env);
  if (!auth) return null;
  const url = `${GRAPH_BASE}/${commentId}?fields=id,message,from,created_time,parent&${auth.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return (await res.json()) as FbCommentResponse;
}

// Health check — verify the token still works. Returns true if valid.
export async function verifyToken(env: FbEnv): Promise<{ ok: boolean; pageName?: string; error?: string }> {
  if (!env.FACEBOOK_PAGE_ID || !env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    return { ok: false, error: "credentials missing" };
  }
  const auth = authParams(env)!;
  const res = await fetch(`${GRAPH_BASE}/me?fields=id,name&${auth.toString()}`);
  const json = (await res.json()) as { name?: string; error?: { message: string; code: number } };
  if (!res.ok || json.error) {
    return { ok: false, error: json.error?.message || `HTTP ${res.status}` };
  }
  return { ok: true, pageName: json.name };
}

// Fetch new comments on Page posts within the last 24h (for engagement tracker)
export async function getRecentPageComments(
  env: FbEnv,
  sinceUnix: number
): Promise<Array<{ comment_id: string; post_id: string; from_name: string; from_id: string; message: string; created_unix: number }>> {
  if (!env.FACEBOOK_PAGE_ID) return [];
  const auth = authParams(env);
  if (!auth) return [];

  const url = `${GRAPH_BASE}/${env.FACEBOOK_PAGE_ID}/feed?fields=id,comments{id,from,message,created_time}&since=${sinceUnix}&${auth.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: Array<{
        id: string;
        comments?: {
          data?: Array<{ id: string; from?: { id: string; name: string }; message?: string; created_time?: string }>;
        };
      }>;
    };
    const out: Array<{ comment_id: string; post_id: string; from_name: string; from_id: string; message: string; created_unix: number }> = [];
    for (const post of json.data || []) {
      for (const c of post.comments?.data || []) {
        if (!c.id || !c.message) continue;
        out.push({
          comment_id: c.id,
          post_id: post.id,
          from_name: c.from?.name || "",
          from_id: c.from?.id || "",
          message: c.message,
          created_unix: c.created_time ? Math.floor(new Date(c.created_time).getTime() / 1000) : 0,
        });
      }
    }
    return out;
  } catch (err) {
    console.error("FB recent comments fetch failed:", err);
    return [];
  }
}
