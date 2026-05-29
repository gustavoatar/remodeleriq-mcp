// Content Swarm — auto-runner + Reddit Scout
// Wires the editor-in-chief kanban to actual draft generation via Gemini 2.5 Flash.
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { GoogleGenAI } from "@google/genai";
import { type AppEnv, SESSION_COOKIE_NAME } from "../types";

const app = new Hono<AppEnv>();

// ====================================================================
// Auth middleware — same shape as contentDrafts.ts
// ====================================================================
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

// ====================================================================
// The canonical RemodelerIQ Assistant voice brief — fed to Gemini as system prompt
// ====================================================================
const VOICE_BRIEF = `You are the RemodelerIQ Assistant — an expert general contractor and fierce homeowner advocate. Your job is to draft Reddit and Nextdoor replies for Gustavo Atar (the founder) that help homeowners spot risk in contractor bids.

PERSONA: highly experienced contractor friend. Deeply enthusiastic about remodels, ruthlessly protective of the homeowner's wallet. Confident, never condescending. Empathetic to financial stress.

VOICE METRICS:
- Strictly 7th-grade reading level
- Punchy, accessible, zero jargon (or explain inline if used)
- Witty, sharp, direct — do not mince words on facts
- 100% non-salesy — earn trust first

THREE PILLARS (answer skeleton — hit at least 2 per reply, proportional to the question):
1. Contract Risk (40%) — payment terms, missing protections, red flags
2. Price Check (30%) — labor + material vs. BLS / FRED / Zonda benchmarks
3. Scope Completeness (30%) — vague allowances, change-order traps

SIGNATURE PHRASES (use AT LEAST ONE per reply, rotate, never twice in a row):
- "Here's what I'd do if this were my house..."
- "The honest truth is..."
- "Red flag alert:"
- "Most homeowners don't know this, but..."
- "This is negotiable—here's how..."

FOUNDER ORIGIN — compressed, one line, used in ~1 of 3 replies only:
"Built RemodelerIQ to protect homeowners — primarily myself, as I started doing projects. What was once a spreadsheet turned into this tool."

CTA RANDOMIZATION:
- CTA presence on replies is ~50/50 RANDOM. Some replies are pure helpful advice, no link.
- When CTA is used, frame as PROTECTION not sale. Canonical template:
  "Check out RemodelerIQ.com — I built this site and its tools so homeowners could be in the know of things like this before they sign."
- Never lead with "first 3 free" — only secondary.

NEVER (hard kill rules):
- Specific legal advice
- Naming individual contractors as recs
- Guaranteeing exact pricing (always use ranges $X–$Y)
- Advising skipping permits
- Leading with a link
- Mentioning RemodelerIQ.com more than once per reply

LENGTH CAPS:
- Reddit: 4-6 sentences, ~120 words MAX
- Nextdoor: 2-3 sentences, ~80 words MAX

HOOK PRINCIPLE: Tease where the value is ("three line items hide $3-8k each") without revealing the exact percentages or scripts. Make the reader curious enough to click profile or visit RemodelerIQ.com.

OUTPUT FORMAT: Return ONLY valid JSON matching this exact schema:
{
  "draft_reddit": "string or null — Reddit reply if applicable to question type",
  "draft_nextdoor": "string or null — Nextdoor reply if applicable",
  "pillar_tags": "comma-separated subset of: contract_risk,price_check,scope",
  "blog_brief": "string or null — brief if this question is a high-volume search candidate",
  "feature_ticket": "string or null — one-line ticket if question reveals analyzer gap",
  "rationale": "string — one sentence explaining the voice choices you made"
}`;

// ====================================================================
// SCOUT — fetches new Reddit posts and queues them as 'queued' source rows
// ====================================================================
const SUBREDDITS = [
  "HomeImprovement",
  "Renovations",
  "HomeRenovations",
];

const BID_QUESTION_PATTERNS = [
  /is\s+this\s+(quote|bid|estimate)\s+(fair|reasonable|normal|too\s+high|too\s+low)/i,
  /how\s+much\s+(should|would)\s+(this|a|an|my)/i,
  /what\s+would\s+(this|a|you|reasonable)/i,
  /got\s+a\s+(quote|bid|estimate)/i,
  /contractor\s+(quoted|wants|charging|asking)/i,
  /(red\s+flag|too\s+good\s+to\s+be\s+true)/i,
  /(deposit|down\s+payment|upfront)/i,
  /(change\s+order|scope\s+creep)/i,
  /\$\d[\d,]*\s+for\s+(a|the|my|kitchen|bath|basement|deck|roof)/i,
];

interface RedditPost {
  url: string;
  title: string;
  selftext: string;
  author: string;
  subreddit: string;
  created_utc: number;
  ups: number;
  num_comments: number;
  id: string;
}

async function fetchRedditNew(subreddit: string, limit = 25): Promise<RedditPost[]> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "RemodelerIQ Scout/1.0 (homeowner advocacy)" },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: { children: { data: RedditPost }[] } };
    return (json.data?.children || []).map((c) => c.data);
  } catch (err) {
    console.error(`Reddit fetch failed for r/${subreddit}:`, err);
    return [];
  }
}

function looksLikeBidQuestion(post: RedditPost): boolean {
  const text = `${post.title}\n${post.selftext || ""}`;
  return BID_QUESTION_PATTERNS.some((p) => p.test(text));
}

// Run the Scout — fetches Reddit, filters, queues
app.post("/scout", async (c) => {
  return await runScout(c.env);
});

export async function runScout(env: AppEnv["Bindings"]): Promise<Response> {
  const allPosts: RedditPost[] = [];
  for (const sub of SUBREDDITS) {
    const posts = await fetchRedditNew(sub, 25);
    allPosts.push(...posts);
  }

  // Filter — keep only bid-question-shaped posts under 24h old
  const cutoff = Math.floor(Date.now() / 1000) - 24 * 3600;
  const candidates = allPosts.filter(
    (p) => p.created_utc > cutoff && looksLikeBidQuestion(p) && (p.selftext || "").length > 80
  );

  // Dedupe against existing rows (by source_url)
  const existing = await env.DB.prepare(
    "SELECT source_url FROM content_drafts WHERE source_url LIKE 'https://www.reddit.com/%' OR source_url LIKE 'https://reddit.com/%'"
  ).all<{ source_url: string }>();
  const existingUrls = new Set((existing.results || []).map((r) => r.source_url));

  const fresh = candidates.filter((p) => {
    const fullUrl = `https://www.reddit.com${p.url || ""}`;
    return !existingUrls.has(fullUrl) && !existingUrls.has(p.url);
  });

  // Cap to 15 per scout run so we don't flood
  const toQueue = fresh.slice(0, 15);

  const cycleId = `scout-${Date.now()}`;
  let queued = 0;
  for (const p of toQueue) {
    const fullUrl = `https://www.reddit.com${p.url}`;
    const excerpt = (p.selftext || p.title).slice(0, 1200);
    try {
      await env.DB.prepare(
        `INSERT INTO content_drafts
         (cycle_id, platform, source_url, source_excerpt, source_author,
          source_subreddit_or_hood, status)
         VALUES (?, 'reddit', ?, ?, ?, ?, 'queued')`
      )
        .bind(cycleId, fullUrl, `${p.title}\n\n${excerpt}`, `u/${p.author}`, `r/${p.subreddit}`)
        .run();
      queued++;
    } catch (err) {
      console.error("Scout insert failed:", err);
    }
  }

  return Response.json({
    success: true,
    scanned: allPosts.length,
    candidates: candidates.length,
    queued,
    cycleId,
  });
}

// ====================================================================
// RUN-CYCLE — drains queued rows, runs Gemini against each, writes drafts back
// ====================================================================
app.post("/run-cycle", async (c) => {
  return await runCycle(c.env, "manual");
});

export async function runCycle(env: AppEnv["Bindings"], trigger: "manual" | "cron"): Promise<Response> {
  const apiKey = (env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  // Load active voice guardrails
  const guardrails = await env.DB.prepare(
    "SELECT rule FROM content_voice_guardrails WHERE active = 1 ORDER BY id"
  ).all<{ rule: string }>();
  const guardrailsText = (guardrails.results || [])
    .map((g, i) => `${i + 1}. ${g.rule}`)
    .join("\n");

  // Get queued source posts (cap to 8 per cycle so we don't burn budget)
  const queuedRows = await env.DB.prepare(
    "SELECT id, platform, source_url, source_excerpt, source_author, source_subreddit_or_hood FROM content_drafts WHERE status = 'queued' ORDER BY id LIMIT 8"
  ).all<{
    id: number;
    platform: string;
    source_url: string;
    source_excerpt: string;
    source_author: string | null;
    source_subreddit_or_hood: string | null;
  }>();

  const queued = queuedRows.results || [];
  if (queued.length === 0) {
    return Response.json({ success: true, drafted: 0, message: "No queued posts" });
  }

  const client = new GoogleGenAI({ apiKey });
  const cycleId = `${trigger}-${Date.now()}`;
  let drafted = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of queued) {
    const userPrompt = `${guardrailsText ? `LEARNED GUARDRAILS FROM PRIOR CYCLES (highest priority — apply before anything else):\n${guardrailsText}\n\n` : ""}SOURCE POST:
Platform: ${row.platform}
${row.source_subreddit_or_hood ? `Channel: ${row.source_subreddit_or_hood}\n` : ""}${row.source_author ? `Author: ${row.source_author}\n` : ""}URL: ${row.source_url}

Question / content:
${row.source_excerpt}

TASK: Draft a reply for this post. ${row.platform === "reddit" ? "Reddit primary; include Nextdoor adaptation only if the topic is generally appealing to a hyperlocal audience." : "Nextdoor primary; include Reddit version only if topic generalizes well."} Apply Three Pillars, signature phrases, length caps, hook principle. Decide on CTA presence per the 50/50 random rule. Return ONLY the JSON.`;

    try {
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: VOICE_BRIEF,
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      let parsed: {
        draft_reddit?: string | null;
        draft_nextdoor?: string | null;
        pillar_tags?: string | null;
        blog_brief?: string | null;
        feature_ticket?: string | null;
        rationale?: string | null;
      };
      try {
        parsed = JSON.parse(response.text || "{}");
      } catch {
        failed++;
        errors.push(`Row ${row.id}: parse error`);
        continue;
      }

      await env.DB.prepare(
        `UPDATE content_drafts SET
           cycle_id = ?,
           draft_reddit = ?,
           draft_nextdoor = ?,
           pillar_tags = ?,
           blog_brief = ?,
           feature_ticket = ?,
           status = 'in_review',
           updated_at = datetime('now')
         WHERE id = ?`
      )
        .bind(
          cycleId,
          parsed.draft_reddit || null,
          parsed.draft_nextdoor || null,
          parsed.pillar_tags || null,
          parsed.blog_brief || null,
          parsed.feature_ticket || null,
          row.id
        )
        .run();
      drafted++;
    } catch (err) {
      failed++;
      errors.push(`Row ${row.id}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  // Mark any pending cycle requests as fulfilled
  await env.DB.prepare(
    "UPDATE cycle_requests SET status = 'fulfilled', fulfilled_at = datetime('now'), cycle_id = ? WHERE status = 'pending'"
  )
    .bind(cycleId)
    .run();

  return Response.json({
    success: true,
    cycleId,
    drafted,
    failed,
    errors: errors.slice(0, 5),
    trigger,
  });
}

// ====================================================================
// ENGAGEMENT TRACKER — polls published Reddit URLs for upvotes/comments
// ====================================================================
export async function trackEngagement(env: AppEnv["Bindings"]): Promise<{ updated: number }> {
  // Get published drafts with Reddit URLs less than 14 days old
  const published = await env.DB.prepare(
    `SELECT id, published_url FROM content_drafts
     WHERE status = 'published' AND published_url IS NOT NULL
       AND published_url LIKE '%reddit.com%'
       AND datetime(published_at) > datetime('now', '-14 days')
     LIMIT 50`
  ).all<{ id: number; published_url: string }>();

  let updated = 0;
  for (const row of published.results || []) {
    try {
      // Convert any Reddit URL to JSON endpoint
      const jsonUrl = row.published_url.replace(/\/?$/, "") + ".json";
      const res = await fetch(jsonUrl, {
        headers: { "User-Agent": "RemodelerIQ Scout/1.0" },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as Array<{ data: { children: Array<{ data: { ups?: number; score?: number; num_comments?: number } }> } }>;
      const post = data[0]?.data?.children?.[0]?.data;
      if (!post) continue;
      const ups = post.score ?? post.ups ?? 0;
      const comments = post.num_comments ?? 0;
      // Save metrics in gustavo_notes as a JSON suffix (simple approach without new table)
      await env.DB.prepare(
        `UPDATE content_drafts SET
           gustavo_notes = COALESCE(gustavo_notes, '') || char(10) || ?,
           updated_at = datetime('now')
         WHERE id = ?`
      )
        .bind(`[metric ${new Date().toISOString().slice(0, 16)}] ups=${ups} comments=${comments}`, row.id)
        .run();
      updated++;
    } catch (err) {
      console.error(`Engagement track failed for ${row.id}:`, err);
    }
  }

  return { updated };
}

app.post("/track-engagement", async (c) => {
  const result = await trackEngagement(c.env);
  return c.json(result);
});

// ====================================================================
// EMAIL DIGEST — 7am ET morning summary of drafts awaiting review
// ====================================================================
export async function sendMorningDigest(env: AppEnv["Bindings"]): Promise<{ sent: boolean }> {
  const apiKey = (env as unknown as Record<string, unknown>).RESEND_API_KEY as string | undefined;
  if (!apiKey) return { sent: false };

  const counts = await env.DB.prepare(
    `SELECT
       SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) as in_review,
       SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
       SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued
     FROM content_drafts`
  ).first<{ in_review: number; approved: number; queued: number }>();

  const inReview = counts?.in_review || 0;
  if (inReview === 0) return { sent: false }; // nothing to ping about

  const topDrafts = await env.DB.prepare(
    `SELECT id, platform, source_author, source_subreddit_or_hood, source_excerpt
     FROM content_drafts WHERE status = 'in_review' ORDER BY id DESC LIMIT 5`
  ).all<{ id: number; platform: string; source_author: string; source_subreddit_or_hood: string; source_excerpt: string }>();

  const draftsList = (topDrafts.results || [])
    .map(
      (d, i) =>
        `${i + 1}. <strong>${d.platform}/${d.source_subreddit_or_hood || ""}</strong> — ${d.source_author || ""}<br/><span style="color:#71717a;font-size:13px;">${d.source_excerpt.slice(0, 140).replace(/\n/g, " ")}…</span>`
    )
    .join("<br/><br/>");

  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:24px;max-width:600px;margin:0 auto;">
    <h2 style="color:#1F9C4C;">☀️ Content Engine — Morning Digest</h2>
    <p style="font-size:16px;"><strong>${inReview}</strong> draft${inReview === 1 ? "" : "s"} awaiting your review<br/>
    <strong>${counts?.approved || 0}</strong> already approved, ready to paste<br/>
    <strong>${counts?.queued || 0}</strong> in the scout queue</p>
    <p style="margin-top:24px;font-size:14px;color:#3f3f46;">Top drafts:</p>
    <p style="font-size:14px;color:#3f3f46;line-height:1.5;">${draftsList}</p>
    <p style="margin-top:32px;"><a href="https://remodeleriq.com/admin/content" style="background:#1F9C4C;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Open Dashboard</a></p>
  </body></html>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "RemodelerIQ <noreply@remodeleriq.com>",
        to: ["gustavo@remodeleriq.com"],
        subject: `☀️ ${inReview} draft${inReview === 1 ? "" : "s"} awaiting review`,
        html,
      }),
    });
    return { sent: true };
  } catch (err) {
    console.error("Digest send failed:", err);
    return { sent: false };
  }
}

app.post("/send-digest", async (c) => {
  const result = await sendMorningDigest(c.env);
  return c.json(result);
});

export default app;
