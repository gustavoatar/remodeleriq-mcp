// Reddit Scout (RSS-based) — Reddit closed its JSON API but left RSS feeds open.
// We fetch the search RSS for bid-question keywords, parse it, filter to real
// homeowner bid questions, and draft a tailored, link-free, karma-safe reply for
// each via Gemini. Results land in reddit_drafts (source='scout') with the DIRECT
// post permalink, so the admin clicks straight through to the thread and pastes.
//
// RSS is rate-limited (HTTP 429) under bursts, so we fetch a small number of feeds
// SEQUENTIALLY with a retry/backoff and bail gracefully — a daily run that makes a
// couple of requests almost always gets through.

import { GoogleGenAI } from "@google/genai";

interface ScoutEnv {
  DB: D1Database;
  GEMINI_API_KEY?: string;
}

const FEEDS = [
  { sub: "HomeImprovement", q: "quote OR estimate OR bid OR contractor" },
  { sub: "Renovations", q: "quote OR estimate OR bid OR cost" },
  { sub: "HomeImprovement", q: "deposit OR overcharging OR fair OR red flag" },
];

const UA = "RemodelerIQ Scout/1.0 (homeowner bid advocacy; contact admin@remodeleriq.com)";

const BID_PATTERNS = [
  /\b(quote|bid|estimate)\b/i,
  /is\s+this\s+(fair|reasonable|normal|too\s+(high|low)|right)/i,
  /how\s+much\s+(should|would|is)/i,
  /contractor\s+(quoted|wants|charging|asking|said)/i,
  /\b(deposit|upfront|down\s*payment)\b/i,
  /\b(change\s*order|allowance|overcharg|red\s*flag|too\s+good\s+to\s+be\s+true)\b/i,
  /\$\s?\d[\d,]*/,
];

interface RssEntry {
  title: string;
  url: string;
  author: string;
  body: string;
  id: string;
}

// Decode the handful of XML/HTML entities Reddit emits, strip tags for a clean excerpt.
function decode(s: string): string {
  return (s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&#x?[0-9a-f]+;/gi, " ")
    .replace(/\s+/g, " ").trim();
}

// Regex-parse the Atom feed (Workers have no XML DOM). Reddit's RSS is consistent.
function parseRss(xml: string): RssEntry[] {
  const out: RssEntry[] = [];
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  for (const e of entries) {
    const title = decode((e.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "");
    const url = (e.match(/<link[^>]*href="([^"]+)"/) || [])[1] || "";
    const author = decode((e.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/) || [])[1] || "");
    const id = (e.match(/<id>([\s\S]*?)<\/id>/) || [])[1] || url;
    const body = decode((e.match(/<content[^>]*>([\s\S]*?)<\/content>/) || [])[1] || "");
    if (title && url) out.push({ title, url, author, body, id });
  }
  return out;
}

async function fetchFeed(sub: string, q: string): Promise<RssEntry[]> {
  const url = `https://www.reddit.com/r/${sub}/search.rss?q=${encodeURIComponent(q)}&restrict_sr=1&sort=new&limit=25`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/atom+xml" } });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return [];
      const xml = await res.text();
      return parseRss(xml);
    } catch {
      return [];
    }
  }
  return [];
}

function looksLikeBidQuestion(e: RssEntry): boolean {
  const text = `${e.title}\n${e.body}`;
  const hits = BID_PATTERNS.filter((p) => p.test(text)).length;
  return hits >= 2; // needs at least two signals to qualify
}

const DRAFT_SYSTEM = `You write a single Reddit comment that a sharp, generous, contractor-savvy homeowner would post to genuinely HELP the person in the post. STRICT: NO links, NO brand names, NO "I built a tool", never mention RemodelerIQ, zero self-promotion. Sound like a real helpful redditor — casual, contractions, direct, specific to THEIR post. 4-7 sentences. Give ONE concrete actionable thing they can do or ask, and where it fits, ONE data anchor (e.g. "most states cap deposits ~10%", "BLS puts carpenters $28-45/hr by metro", "GC overhead+profit is usually 15-25%"). Empathetic, no fluff, end helpfully (not with a CTA). Output ONLY JSON {"comment":"..."}.`;

async function draftReply(apiKey: string, e: RssEntry): Promise<string | null> {
  try {
    const client = new GoogleGenAI({ apiKey });
    const res = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `REDDIT POST TITLE: ${e.title}\n\nPOST BODY: ${e.body.slice(0, 1500)}\n\nWrite the helpful reply per the system rules.`,
      config: { responseMimeType: "application/json", systemInstruction: DRAFT_SYSTEM, thinkingConfig: { thinkingBudget: 0 } },
    });
    const raw = (res.text || "").trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(raw) as { comment?: string };
    return parsed.comment || null;
  } catch {
    return null;
  }
}

// Run the scout. Returns counts. Best-effort throughout.
export async function scoutRedditRss(
  env: ScoutEnv,
  nowIso: string,
  maxDrafts = 6
): Promise<{ scanned: number; candidates: number; drafted: number }> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return { scanned: 0, candidates: 0, drafted: 0 };

  // Collect entries from the feeds (sequential, throttled).
  const all: RssEntry[] = [];
  for (const f of FEEDS) {
    const entries = await fetchFeed(f.sub, f.q);
    all.push(...entries);
    await new Promise((r) => setTimeout(r, 1200));
  }

  // Dedupe within this run by post URL.
  const seen = new Set<string>();
  const unique = all.filter((e) => (seen.has(e.url) ? false : (seen.add(e.url), true)));
  const candidates = unique.filter((e) => looksLikeBidQuestion(e) && e.body.length > 40);

  // Dedupe against already-stored scout drafts.
  const existing = await env.DB.prepare(
    "SELECT post_url FROM reddit_drafts WHERE post_url IS NOT NULL"
  ).all<{ post_url: string }>();
  const existingUrls = new Set((existing.results || []).map((r) => r.post_url));
  const fresh = candidates.filter((e) => !existingUrls.has(e.url)).slice(0, maxDrafts);

  let drafted = 0;
  for (const e of fresh) {
    const comment = await draftReply(apiKey, e);
    if (!comment) continue;
    const sub = (e.url.match(/reddit\.com\/r\/([^/]+)/) || [])[1] || "";
    try {
      await env.DB.prepare(
        `INSERT INTO reddit_drafts
           (scenario, comment, target_subs, status, source, post_url, post_title, post_excerpt, found_at, created_at)
         VALUES (?, ?, ?, 'pending', 'scout', ?, ?, ?, ?, ?)`
      )
        .bind(
          e.title.slice(0, 140),
          comment,
          sub ? `r/${sub}` : "",
          e.url,
          e.title.slice(0, 300),
          e.body.slice(0, 1500),
          nowIso,
          nowIso
        )
        .run();
      drafted++;
    } catch {
      // ignore individual insert failures
    }
  }

  return { scanned: all.length, candidates: candidates.length, drafted };
}
