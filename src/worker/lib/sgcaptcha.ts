// SiteGround Anti-Bot AI ("sgcaptcha") passive-challenge solver.
//
// When SiteGround decides a request looks bot-like it answers with an HTTP-200
// HTML page (instead of running the request):
//   <html><head>...<meta http-equiv="refresh"
//      content="0;/.well-known/sgcaptcha/?r=<orig>&y=<token>"></meta></head></html>
// A browser follows that meta-refresh; the sgcaptcha endpoint validates and hands
// back a clearance cookie, after which the original request succeeds.
//
// This module reproduces that handshake from a Cloudflare Worker: detect the
// challenge, follow the refresh URL (capturing Set-Cookie at each hop), then let
// the caller replay the original request with the obtained cookie. This clears the
// PASSIVE (cookie-handshake) challenge. If SiteGround escalates to a JavaScript /
// interactive challenge, no cookie is returned and the caller fails gracefully.

// Module-level cookie jar (per isolate). Once a challenge is cleared we reuse the
// cookie on later WP requests in the same invocation so we don't re-solve for the
// media upload AND the post create. A stale cookie simply re-triggers a solve.
let cachedCookie: string | null = null;

export function getCachedSgCookie(): string | null {
  return cachedCookie;
}

export function setCachedSgCookie(cookie: string | null): void {
  cachedCookie = cookie;
}

// Does this response body look like the SiteGround challenge page?
export function looksLikeSgCaptcha(contentType: string | null, body: string): boolean {
  const ct = (contentType || "").toLowerCase();
  if (!ct.includes("text/html")) return false;
  return /sgcaptcha|\.well-known\/sgcaptcha/i.test(body);
}

// Pull the meta-refresh target out of the challenge HTML.
function extractRefreshUrl(origin: string, body: string): string | null {
  const m = body.match(/http-equiv=["']refresh["'][^>]*content=["']\s*\d+\s*;\s*([^"']+)["']/i);
  if (!m) return null;
  let url = m[1].trim().replace(/&amp;/g, "&");
  if (url.startsWith("/")) url = origin + url;
  return url;
}

// Workers expose all Set-Cookie values via getSetCookie(); fall back to a single.
function readSetCookies(res: Response): string[] {
  const h = res.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof h.getSetCookie === "function") return h.getSetCookie();
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

// Collapse Set-Cookie header values into a "name=value; name2=value2" Cookie header,
// keeping the last value seen for each cookie name.
function toCookieHeader(setCookies: string[]): string {
  const jar = new Map<string, string>();
  for (const sc of setCookies) {
    const pair = sc.split(";")[0].trim();
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
  return Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
}

// Follow the challenge handshake and return a Cookie header string, or null if we
// couldn't obtain a clearance cookie (e.g. an interactive/JS challenge).
export async function solveSgCaptcha(
  origin: string,
  challengeBody: string,
  baseHeaders: Record<string, string>
): Promise<string | null> {
  const first = extractRefreshUrl(origin, challengeBody);
  if (!first) {
    console.warn("sgcaptcha: could not parse refresh URL from challenge page");
    return null;
  }
  let url: string = first;

  const collected: string[] = [];
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...baseHeaders,
        ...(collected.length ? { Cookie: toCookieHeader(collected) } : {}),
      },
      redirect: "manual",
    });
    const sc = readSetCookies(res);
    if (sc.length) collected.push(...sc);
    const body = res.headers.get("content-type")?.includes("text/html") ? await res.text() : "";
    // Note: SiteGround's challenge is a JavaScript proof-of-work (the page carries
    // an `sgchallenge` token + a visual-CAPTCHA fallback), NOT a passive cookie
    // handshake — so this solver only clears the rare passive variant. The proper
    // fix is excluding /wp-json/ from Anti-Bot AI in SiteGround Site Tools.
    console.log(
      `sgcaptcha hop ${hop}: status=${res.status} ct=${res.headers.get("content-type")} ` +
        `setCookies=${sc.length} loc=${res.headers.get("location") || "-"}` +
        (body && /sgchallenge|BD_Captcha/.test(body) ? " [JS proof-of-work / CAPTCHA challenge]" : "")
    );

    // Another nested challenge page → follow its refresh.
    if (body && looksLikeSgCaptcha(res.headers.get("content-type"), body)) {
      const next = extractRefreshUrl(origin, body);
      if (next) { url = next; continue; }
    }
    // HTTP redirect → follow Location.
    const loc = res.headers.get("location");
    if (loc) { url = loc.startsWith("/") ? origin + loc : loc; continue; }
    break;
  }

  const cookie = toCookieHeader(collected);
  if (!cookie) {
    console.warn("sgcaptcha: handshake produced no clearance cookie (likely a JS/interactive challenge)");
    return null;
  }
  cachedCookie = cookie;
  console.log(`sgcaptcha: cleared — using ${cookie.split(";").length} cookie(s) on replay`);
  return cookie;
}

// Drop-in fetch for WordPress requests that transparently clears a passive
// sgcaptcha challenge and replays. Returns the final Response plus its body text
// (already read once, so callers must not call res.text()/json() again).
export async function wpFetch(
  url: string,
  init: RequestInit,
  baseHeaders: Record<string, string>
): Promise<{ res: Response; text: string }> {
  const origin = new URL(url).origin;
  const run = async (cookie: string | null) => {
    const headers: Record<string, string> = {
      ...baseHeaders,
      ...((init.headers as Record<string, string>) || {}),
    };
    if (cookie) headers.Cookie = cookie;
    const res = await fetch(url, { ...init, headers });
    const text = await res.text();
    return { res, text };
  };

  // First try with any cookie we already cleared this isolate.
  let out = await run(getCachedSgCookie());
  if (!looksLikeSgCaptcha(out.res.headers.get("content-type"), out.text)) return out;

  // Challenged → solve + replay (up to 2 solve attempts).
  for (let attempt = 0; attempt < 2; attempt++) {
    const cookie = await solveSgCaptcha(origin, out.text, baseHeaders);
    if (!cookie) break;
    out = await run(cookie);
    if (!looksLikeSgCaptcha(out.res.headers.get("content-type"), out.text)) return out;
    // Cookie didn't stick — clear cache and try solving fresh once more.
    setCachedSgCookie(null);
  }
  return out; // still challenged; caller handles the error
}
