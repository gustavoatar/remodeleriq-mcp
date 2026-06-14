import { Hono } from "hono";

type AppEnv = { Bindings: Env };

const app = new Hono<AppEnv>();

const REDDIT_AUTHORIZE = "https://www.reddit.com/api/v1/authorize";
const REDDIT_TOKEN = "https://www.reddit.com/api/v1/access_token";
const REDIRECT_URI = "https://remodeleriq.com/api/auth/reddit/callback";
const USER_AGENT = "web:com.remodeleriq:v1.0 (by /u/remodeleriq)";
const SCOPES = "identity read submit edit history mysubreddits";

function newState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

app.get("/auth/reddit/start", async (c) => {
  const clientId = (c.env as unknown as Record<string, string | undefined>).REDDIT_CLIENT_ID;
  if (!clientId) return c.json({ error: "Reddit OAuth not configured" }, 500);

  const state = newState();
  await c.env.DB.prepare(
    "INSERT INTO oauth_states (state, provider, return_to) VALUES (?, 'reddit', ?)"
  ).bind(state, c.req.query("return_to") || "/admin/content").run();

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    state,
    redirect_uri: REDIRECT_URI,
    duration: "permanent",
    scope: SCOPES,
  });
  return c.redirect(`${REDDIT_AUTHORIZE}?${params.toString()}`);
});

app.get("/auth/reddit/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");

  if (error) return c.json({ error: `Reddit returned: ${error}` }, 400);
  if (!code || !state) return c.json({ error: "Missing code or state" }, 400);

  const stateRow = await c.env.DB.prepare(
    "SELECT return_to FROM oauth_states WHERE state = ? AND provider = 'reddit'"
  ).bind(state).first<{ return_to: string | null }>();
  if (!stateRow) return c.json({ error: "Invalid or expired state" }, 400);
  await c.env.DB.prepare("DELETE FROM oauth_states WHERE state = ?").bind(state).run();

  const env = c.env as unknown as Record<string, string | undefined>;
  const clientId = env.REDDIT_CLIENT_ID;
  const clientSecret = env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return c.json({ error: "Reddit OAuth not configured" }, 500);

  const basic = btoa(`${clientId}:${clientSecret}`);
  const tokenRes = await fetch(REDDIT_TOKEN, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
      "User-Agent": USER_AGENT,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error("Reddit token exchange failed:", tokenRes.status, body);
    return c.json({ error: "Token exchange failed", detail: body }, 502);
  }

  const token = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    scope?: string;
    expires_in?: number;
  };

  // Best-effort: fetch the username so we can store account_handle.
  let handle = "default";
  try {
    const meRes = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "User-Agent": USER_AGENT,
      },
    });
    if (meRes.ok) {
      const me = await meRes.json() as { name?: string };
      if (me.name) handle = me.name;
    }
  } catch (err) {
    console.error("Reddit /me lookup failed:", err);
  }

  const expiresAt = token.expires_in
    ? new Date(Date.now() + token.expires_in * 1000).toISOString()
    : null;

  await c.env.DB.prepare(
    `INSERT INTO oauth_tokens (provider, account_handle, access_token, refresh_token, token_type, scope, expires_at, raw_response)
     VALUES ('reddit', ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(provider, account_handle) DO UPDATE SET
       access_token = excluded.access_token,
       refresh_token = COALESCE(excluded.refresh_token, oauth_tokens.refresh_token),
       token_type = excluded.token_type,
       scope = excluded.scope,
       expires_at = excluded.expires_at,
       raw_response = excluded.raw_response,
       updated_at = datetime('now')`
  ).bind(
    handle,
    token.access_token,
    token.refresh_token || null,
    token.token_type || "bearer",
    token.scope || SCOPES,
    expiresAt,
    JSON.stringify(token)
  ).run();

  return c.redirect(stateRow.return_to || "/admin/content");
});

export default app;
