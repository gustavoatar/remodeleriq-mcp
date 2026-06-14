import { Hono } from "hono";

type AppEnv = { Bindings: Env };

const app = new Hono<AppEnv>();

const NEXTDOOR_AUTHORIZE = "https://auth.nextdoor.com/v3/authorize";
const NEXTDOOR_TOKEN = "https://auth.nextdoor.com/v3/token";
const REDIRECT_URI = "https://remodeleriq.com/api/auth/nextdoor/callback";
const SCOPES = "openid post:write post:read";

function newState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Start OAuth — redirects the user to Nextdoor's consent screen.
app.get("/auth/nextdoor/start", async (c) => {
  const clientId = (c.env as unknown as Record<string, string | undefined>).NEXTDOOR_CLIENT_ID;
  if (!clientId) return c.json({ error: "Nextdoor OAuth not configured" }, 500);

  const state = newState();
  await c.env.DB.prepare(
    "INSERT INTO oauth_states (state, provider, return_to) VALUES (?, 'nextdoor', ?)"
  ).bind(state, c.req.query("return_to") || "/admin/content").run();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
    state,
  });
  return c.redirect(`${NEXTDOOR_AUTHORIZE}?${params.toString()}`);
});

// OAuth callback — Nextdoor sends ?code=...&state=... here.
app.get("/auth/nextdoor/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");

  if (error) return c.json({ error: `Nextdoor returned: ${error}` }, 400);
  if (!code || !state) return c.json({ error: "Missing code or state" }, 400);

  const stateRow = await c.env.DB.prepare(
    "SELECT return_to FROM oauth_states WHERE state = ? AND provider = 'nextdoor'"
  ).bind(state).first<{ return_to: string | null }>();
  if (!stateRow) return c.json({ error: "Invalid or expired state" }, 400);
  await c.env.DB.prepare("DELETE FROM oauth_states WHERE state = ?").bind(state).run();

  const env = c.env as unknown as Record<string, string | undefined>;
  const clientId = env.NEXTDOOR_CLIENT_ID;
  const clientSecret = env.NEXTDOOR_CLIENT_SECRET;
  if (!clientId || !clientSecret) return c.json({ error: "Nextdoor OAuth not configured" }, 500);

  const tokenRes = await fetch(NEXTDOOR_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error("Nextdoor token exchange failed:", tokenRes.status, body);
    return c.json({ error: "Token exchange failed", detail: body }, 502);
  }

  const token = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    scope?: string;
    expires_in?: number;
  };

  const expiresAt = token.expires_in
    ? new Date(Date.now() + token.expires_in * 1000).toISOString()
    : null;

  await c.env.DB.prepare(
    `INSERT INTO oauth_tokens (provider, account_handle, access_token, refresh_token, token_type, scope, expires_at, raw_response)
     VALUES ('nextdoor', ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(provider, account_handle) DO UPDATE SET
       access_token = excluded.access_token,
       refresh_token = COALESCE(excluded.refresh_token, oauth_tokens.refresh_token),
       token_type = excluded.token_type,
       scope = excluded.scope,
       expires_at = excluded.expires_at,
       raw_response = excluded.raw_response,
       updated_at = datetime('now')`
  ).bind(
    "default",
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
