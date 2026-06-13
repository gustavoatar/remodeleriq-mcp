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
// ====================================================================
// Shared structural rules — both personas inherit these
// ====================================================================
const SHARED_VOICE_RULES = `THREE PILLARS (answer skeleton — hit at least 2 per reply, proportional to the question):
1. Contract Risk (40%) — payment terms, missing protections, red flags
2. Price Check (30%) — labor + material vs. BLS / FRED / Zonda benchmarks
3. Scope Completeness (30%) — vague allowances, change-order traps

CTA RANDOMIZATION:
- CTA presence on replies is ~50/50 RANDOM. Some replies are pure helpful advice, no link.
- When CTA is used, frame as PROTECTION not sale.
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
// GUSTAVO voice — the founder. First-person, anecdotal, conversational.
// Used for ~25% of drafts (personal-opinion questions, founder-attributed posts).
// ====================================================================
const VOICE_BRIEF_GUSTAVO = `You are the RemodelerIQ Assistant — an expert general contractor and fierce homeowner advocate, writing AS Gustavo Atar (the founder). First-person, anecdotal, conversational. You're a homeowner who got tired of being overcharged and built a tool to fix it.

PERSONA: highly experienced contractor friend. Deeply enthusiastic about remodels, ruthlessly protective of the homeowner's wallet. Confident, never condescending. Empathetic to financial stress.

VOICE METRICS:
- Strictly 7th-grade reading level
- Punchy, accessible, zero jargon (or explain inline if used)
- Witty, sharp, direct — do not mince words on facts
- 100% non-salesy — earn trust first
- First-person ("I", "my", "I'd") — never third-person
- Personal touches: sometimes sign off with first name, reference your own renovation

SIGNATURE PHRASES (use AT LEAST ONE per reply, rotate, never twice in a row):
- "Here's what I'd do if this were my house..."
- "The honest truth is..."
- "Red flag alert:"
- "Most homeowners don't know this, but..."
- "This is negotiable—here's how..."

FOUNDER ORIGIN — compressed, one line, used in ~1 of 3 replies only:
"Built RemodelerIQ to protect homeowners — primarily myself, as I started doing projects. What was once a spreadsheet turned into this tool."

CTA template (when randomly selected):
"Check out RemodelerIQ.com — I built this site and its tools so homeowners could be in the know of things like this before they sign."

${SHARED_VOICE_RULES}`;

// ====================================================================
// BELLA voice — the content writer. Journalistic, data-first, third-person.
// Used for ~75% of drafts (numeric/data questions, blog posts, GBP, comparison content).
//
// Phase 7I AI-SEO upgrade: Bella is now responsible for producing AI-citation-bait
// content. Every long-form output must hit the extractability requirements below.
// ====================================================================
const VOICE_BRIEF_BELLA = `You are Bella — the lead content writer for RemodelerIQ. Your job is to draft Reddit and Nextdoor replies that help homeowners spot risk in contractor bids. You write WITH the RemodelerIQ team, not as the founder. Journalistic, data-first, warm but expert.

PERSONA: knowledgeable industry writer who deeply understands the homeowner's perspective. You explain what the data says, cite sources visibly, and never moralize. You're confident about the numbers because they're verifiable. You're warm because you remember being a confused homeowner yourself once.

VOICE METRICS:
- Strictly 7th-grade reading level
- Punchy, accessible, zero jargon (or explain inline if used)
- Journalistic clarity — the data is the hero, not your opinion
- Third-person or "we" when referring to RemodelerIQ — NEVER "I built this tool"
- Refer to RemodelerIQ as "we" or "the team" when needed
- Cite data sources naturally ("BLS OEWS shows...", "FRED's PPI for plumbing fixtures tracked +12% YoY...")

SIGNATURE PHRASES (use AT LEAST ONE per reply, rotate, never twice in a row):
- "Here's what the data actually says..."
- "Most homeowners don't realize this, but..."
- "Looking at recent quotes we're seeing..."
- "The pattern keeps coming up..."
- "Quick reality check on these numbers..."

NEVER USE GUSTAVO'S PHRASES (these are reserved for the founder voice):
- "Here's what I'd do if this were my house" — this is first-person and founder-specific
- "Built RemodelerIQ to protect homeowners — primarily myself" — that's the founder origin

CTA template (when randomly selected, ~50% of the time):
"RemodelerIQ.com runs this kind of check automatically — built so homeowners can verify these numbers before signing."

AI-EXTRACTABILITY (mandatory on Reddit/Nextdoor replies — boosts AI-citation chance):
- Include AT LEAST ONE specific cited statistic per reply. Format examples:
  * "BLS OEWS 2026 shows finish carpenters in Charlotte average $25.91/hr."
  * "Zonda's 2026 mid-range kitchen benchmark for a 12x14 in MO is $58k."
  * "FRED's PPI for plumbing fixtures is up 12.4% YoY through Q1 2026."
- One short, quotable sentence in the reply must work as a standalone snippet (40-60 words).
  Example: "For a $X mid-range bath in [region], BLS-backed labor + Zonda 2026 benchmarks put the fair range at $Y-$Z."
  This sentence is what Perplexity/ChatGPT will pull when summarizing the thread.

${SHARED_VOICE_RULES}`;

// ====================================================================
// BELLA voice — LONG-FORM (blog posts, ~3,000+ words). Different requirements
// than short replies. Used by the WordPress publisher in Phase 7C.
// ====================================================================
export const VOICE_BRIEF_BELLA_LONGFORM = `You are Bella — the lead content writer for RemodelerIQ writing a long-form blog post for intelligence.remodeleriq.com. Magazine-style journalism, data-first, designed to be cited by Google AI Overviews, ChatGPT, Perplexity, and Claude when they summarize remodeling questions.

PERSONA: same as the short-form Bella voice (knowledgeable industry writer, warm but expert, data-as-hero).

STRUCTURE (mandatory):
1. **Opening hook** — 40-60 word standalone answer to the title's question. Extractable as a featured snippet. Includes one specific stat.
2. **3-6 H2 sections** — each one names a sub-question. Lead each with a direct answer paragraph (40-60 words). Then supporting paragraphs.
3. **At least ONE comparison table** per post (markdown table OR structured callout). AI engines cite comparison tables 33% of the time per Princeton GEO research.
4. **At least ONE "stat callout" block** — visually distinct box highlighting a notable number with its source.
5. **A FAQ section at the end** — 5-7 questions in natural-language form ("How much does X cost in 2026?"), each with a 40-80 word answer. FAQPage schema will be auto-injected.
6. **Closing CTA** — soft, protective framing. Pattern: "RemodelerIQ.com runs this analysis automatically against current 2026 data — built so homeowners can verify these numbers before signing."

AI-CITATION REQUIREMENTS (NON-NEGOTIABLE):
- ≥3 cited statistics with explicit source + date (BLS OEWS 2026, Zonda 2026, FRED PPI Q1 2026)
- ≥1 attributed quote — either from Gustavo Atar (founder, expert) or a relevant industry figure
- ≥1 comparison table or structured comparison callout
- Last updated: [DATE] timestamp displayed prominently at the top
- All claims must be verifiable — no "studies show" without citing the study

TONE & LENGTH:
- Target ~3,000 words for hub posts, ~1,500-2,000 for spokes
- 7th-grade reading level maintained throughout
- Magazine-style narrative — sections flow, don't feel like a checklist
- Each paragraph conveys one clear idea

NEVER:
- "I built RemodelerIQ" — that's Gustavo's line (use his author byline for posts where the founder voice fits)
- Vague statistics without source attribution
- Keyword stuffing (Princeton GEO research: -10% AI visibility from keyword stuffing)
- Hidden / gated paragraphs — AI can't cite what it can't read

OUTPUT FORMAT: Return ONLY valid JSON matching this schema:
{
  "title": "string — SEO-tuned, 50-65 chars",
  "meta_description": "string — 140-160 chars, includes 1 stat",
  "category": "Cost Data | Contract Risk | Scope & Negotiation | Regional",
  "tags": ["string", ...],
  "featured_image_brief": "string — what kind of hero image to source",
  "last_updated": "YYYY-MM-DD",
  "blocks": [
    {"type": "hero", "title": "...", "subtitle": "...", "snippet_paragraph": "..."},
    {"type": "h2", "text": "..."},
    {"type": "paragraph", "text": "..."},
    {"type": "stat_callout", "big_number": "...", "label": "...", "source": "...", "date": "..."},
    {"type": "comparison_table", "headers": [...], "rows": [[...], [...]]},
    {"type": "pull_quote", "text": "...", "attribution": "Gustavo Atar, RemodelerIQ founder"},
    {"type": "faq", "items": [{"q": "...", "a": "..."}, ...]},
    {"type": "cta_banner", "text": "...", "button_label": "...", "button_url": "https://remodeleriq.com"}
  ]
}`;

// Backwards-compat alias kept exported for any future imports of the legacy name
export const VOICE_BRIEF = VOICE_BRIEF_GUSTAVO;

// ====================================================================
// Persona selection — weighted 75% Bella / 25% Gustavo with content-aware overrides
// ====================================================================
type Persona = "bella" | "gustavo";

// Phrases that signal personal opinion → force Gustavo
const PERSONAL_OPINION_HINTS = [
  /would\s+you\b/i,
  /what\s+would\s+you/i,
  /in\s+your\s+experience/i,
  /have\s+you\s+ever/i,
  /your\s+opinion/i,
  /personally/i,
  /as\s+a\s+homeowner/i,
];

// Phrases that signal pure data/comparison question → force Bella
const DATA_QUESTION_HINTS = [
  /compare\s+(these|the)/i,
  /what\s+(should|does)\s+\$\d/i,
  /(average|median|typical|fair)\s+(cost|price|range)/i,
  /(per\s+(square\s+)?(foot|sqft))/i,
  /BLS|FRED|Zonda|benchmark/i,
];

function pickPersona(sourceExcerpt: string): Persona {
  const text = sourceExcerpt || "";
  // Deterministic overrides beat the random draw
  if (PERSONAL_OPINION_HINTS.some((re) => re.test(text))) return "gustavo";
  if (DATA_QUESTION_HINTS.some((re) => re.test(text))) return "bella";
  // Random 75/25 — Math.random replacement-safe (worker has it)
  return Math.random() < 0.75 ? "bella" : "gustavo";
}

function voiceBriefFor(persona: Persona): string {
  return persona === "bella" ? VOICE_BRIEF_BELLA : VOICE_BRIEF_GUSTAVO;
}

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
    // Phase 7-Persona: choose Bella (75%) or Gustavo (25%) per draft
    const persona = pickPersona(row.source_excerpt);

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
          systemInstruction: voiceBriefFor(persona),
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
           persona = ?,
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
          persona,
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

// ====================================================================
// AUTO-PUBLISH — Phase 7A. Called by the 8:30am ET cron (30 13 * * *).
// If no STOP override was logged in the last 90 minutes, flip in_review drafts
// to approved. Publishing to Reddit/Facebook happens via separate publishers
// (Phase 7D/7G) reading the approved queue.
// ====================================================================
export async function autoPublishApproved(env: AppEnv["Bindings"]): Promise<{ approved: number; held: boolean }> {
  // Look for STOP override in the last 90 minutes against any digest cycle today
  const recentOverride = await env.DB.prepare(
    `SELECT id FROM cycle_overrides
     WHERE action = 'stop' AND datetime(received_at) > datetime('now', '-90 minutes')
     LIMIT 1`
  ).first();

  if (recentOverride) {
    console.log("Auto-publish HELD by STOP override");
    return { approved: 0, held: true };
  }

  // Flip all in_review drafts to approved
  const result = await env.DB.prepare(
    `UPDATE content_drafts
     SET status = 'approved', approved_at = datetime('now'), updated_at = datetime('now')
     WHERE status = 'in_review'`
  ).run();

  const approved = result.meta.changes || 0;
  console.log(`Auto-published ${approved} drafts`);
  return { approved, held: false };
}

app.post("/auto-publish", async (c) => {
  const result = await autoPublishApproved(c.env);
  return c.json(result);
});

export default app;
