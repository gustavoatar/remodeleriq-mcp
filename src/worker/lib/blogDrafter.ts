// Phase 7C — Blog post drafter
// Takes a blog brief (topic), classifies it into one of 4 content pillars,
// picks a persona using pillar-weighted Bella/Gustavo ratios, then calls
// Gemini with the appropriate longform voice brief.
//
// Returns a structured BlogDraft suitable for the wordpressBlocks renderer.

import { GoogleGenAI } from "@google/genai";
import { VOICE_BRIEF_BELLA_LONGFORM, VOICE_BRIEF_GUSTAVO_LONGFORM } from "../routes/contentSwarm";
import type { BlogBlock } from "./wordpressBlocks";

export type Pillar = "cost_data" | "contract_risk" | "scope_negotiation" | "regional";
export type Persona = "bella" | "gustavo";

// Phase 7-Pillars — hub-and-spoke content architecture.
// Each pillar has one definitive HUB, many SPOKES that link up to it, plus
// COMPARISON pieces (highest AI-citation format) and quarterly DATA_REPORTS.
export type ContentFormat = "hub" | "spoke" | "comparison" | "data_report";

const FORMAT_DIRECTIVES: Record<ContentFormat, string> = {
  hub: `CONTENT FORMAT: PILLAR HUB — the definitive, evergreen guide for this pillar.
- Target length: ~3,200-3,800 words. This is the cornerstone page; depth is the point.
- Open with a 40-60 word standalone answer to the title's core question (featured-snippet bait).
- Cover the full pillar with 6-9 H2 sections, each with a stat callout + supporting paragraphs.
- Include at least ONE comparison table and ONE pull quote.
- End with a 6-question FAQ section (renders as FAQPage schema).
- Add a "Related deep-dives" section near the end listing 3-5 subtopics a reader should explore next (these are the spokes — describe them by topic; do not invent URLs).
- Authoritative, comprehensive tone. This page should read as THE reference on the topic.`,
  spoke: `CONTENT FORMAT: SPOKE — a focused deep-dive on one subtopic of the pillar.
- Target length: ~1,500-2,000 words. Tight and specific, not exhaustive.
- Open with a 40-60 word standalone answer to the title's question.
- 3-5 H2 sections, each with a stat callout.
- Include one comparison table OR one structured callout box.
- End with a 4-question FAQ section.
- IMPORTANT: include one early paragraph that references the pillar's overarching guide so the reader can zoom out (the worker injects the actual hub link — write the sentence naturally, e.g. "This is one piece of the bigger picture — for the full breakdown, see our complete guide to {PILLAR}.").`,
  comparison: `CONTENT FORMAT: COMPARISON — an "X vs Y(vs Z)" head-to-head. This is the single highest-value format for AI-engine citations.
- Target length: ~1,600-2,200 words.
- Open with a 40-60 word verdict-style answer ("If you're choosing between X and Y, here's the short version...").
- The CENTERPIECE must be a detailed comparison table contrasting the options across 5-8 dimensions with specific numbers/sources.
- One H2 per option explaining when each wins, plus an H2 on how to decide.
- End with a 5-question FAQ section.
- Neutral, analytical tone — let the data pick the winner, don't shill.`,
  data_report: `CONTENT FORMAT: DATA REPORT — original research from RemodelerIQ's aggregate analyzer data. The strongest AI-citation magnet possible.
- Target length: ~3,500-4,200 words.
- Open with a 40-60 word headline finding ("Across 800+ bids we analyzed this quarter, X...").
- Present 10+ proprietary statistics, each as a stat callout with a one-line methodology note.
- At least TWO comparison tables (e.g. by trade, by region, by tier).
- A "Methodology" H2 near the end so the numbers are citable/credible.
- End with a 6-question FAQ section.
- Journalistic, data-as-hero tone. Every claim is a quotable, attributable stat.`,
};

// Phase 7-Pillars — LAYOUT TEMPLATE VARIETY.
// Each post is assigned ONE of these layout templates so posts stop coming out
// in one identical skeleton. The template dictates the block SEQUENCE + density
// + feel; it's injected into the user prompt so Gemini follows it for THIS post.
export type LayoutTemplate = "data_dashboard" | "narrative_editorial" | "scannable_listicle" | "head_to_head";

const LAYOUT_TEMPLATES: Record<LayoutTemplate, string> = {
  data_dashboard: `TEMPLATE: DATA DASHBOARD — feel: a research briefing you could screenshot. Numbers wall-to-wall, minimal prose. NO image blocks anywhere.
Block sequence (follow this order and density): hero → verdict_callout → h2 → paragraph → stat_callout → stat_callout → stat_callout → chart → h2 → comparison_table → h2 → three_column (stat cards) → section_cover (theme: "dark") → h2 → paragraph → comparison_table → talk_track → faq → cta_banner.
Use ONLY these block types; this template defines your sequence and density — do not fall back to a generic skeleton.`,
  narrative_editorial: `TEMPLATE: NARRATIVE EDITORIAL — feel: a first-person essay with a few visual breaths. The story carries it; data plays a supporting role.
Block sequence (follow this order and density): hero → h2 → paragraph → paragraph → pull_quote → h2 → paragraph → image (with "body" for a magazine split) → h2 → paragraph → stat_callout → talk_track → h2 → paragraph → pull_quote → image → faq → cta_button_group.
End with a SOFT CTA (cta_button_group), NOT the loud cta_banner — this fits Gustavo's no-hard-CTA rule.
Use ONLY these block types; this template defines your sequence and density — do not fall back to a generic skeleton.`,
  scannable_listicle: `TEMPLATE: SCANNABLE LISTICLE — feel: skimmable, repeating titled cards ("N red flags", "N traps", "N moves").
Block sequence (follow this order and density): hero → verdict_callout → h2 → paragraph → three_column (3 cards) → section_cover (theme: "amber") → red_flag_callout → red_flag_callout → red_flag_callout → stat_callout → h2 → two_column (do-this / not-that) → pull_quote → cta_button_group.
Use ONLY these block types; this template defines your sequence and density — do not fall back to a generic skeleton.`,
  head_to_head: `TEMPLATE: HEAD TO HEAD — feel: a verdict plus a scorecard. One big table IS the hero.
Block sequence (follow this order and density): hero → verdict_callout → h2 (the verdict) → paragraph → comparison_table (the centerpiece) → chart (chart_type: "comparison_bars") → h2 → two_column (Option A vs Option B) → stat_callout → red_flag_callout → pull_quote → h2 → paragraph → faq → cta_banner.
Use ONLY these block types; this template defines your sequence and density — do not fall back to a generic skeleton.`,
};

/**
 * Assign a layout template for a post. First match wins.
 */
export function pickTemplate(format: ContentFormat, persona: Persona, brief: string): LayoutTemplate {
  if (format === "data_report") return "data_dashboard";
  if (format === "comparison") return "head_to_head";
  if (persona === "gustavo") return "narrative_editorial";
  if (/red flag|traps?|mistakes?|\bways\b|\bthings\b|\btips\b|\d+\s+(red|ways|things|traps|signs|reasons|steps)/i.test(brief)) {
    return "scannable_listicle";
  }
  if (format === "hub") return "data_dashboard";
  return "narrative_editorial";
}

// Pillar-specific Bella/Gustavo ratios (from the content strategy section in the plan)
const PILLAR_BELLA_RATIOS: Record<Pillar, number> = {
  cost_data: 0.9,           // Cost Data — 90% Bella (data-heavy)
  contract_risk: 0.6,       // Contract Risk — 60% Bella, 40% Gustavo (founder stories fit)
  scope_negotiation: 0.65,  // Scope & Negotiation — 65% Bella
  regional: 0.8,            // Regional — 80% Bella
};

// Keyword classifiers — first match wins. Order matters.
const PILLAR_KEYWORDS: Array<{ pillar: Pillar; patterns: RegExp[] }> = [
  {
    pillar: "regional",
    patterns: [
      /\b(atlanta|phoenix|dallas|chicago|new york|los angeles|seattle|boston|charlotte|denver|miami|nashville|portland)\b/i,
      /\b(metro|county|zip code|state|by city|by region|regional|local)\b/i,
      /\bpermit/i,
    ],
  },
  {
    pillar: "contract_risk",
    patterns: [
      /\b(deposit|upfront|payment schedule|red flag|liability|insurance|contract|change order|change-order)\b/i,
      /\b(too good to be true|scam|bait and switch|misleading)\b/i,
    ],
  },
  {
    pillar: "cost_data",
    patterns: [
      /\b(cost|price|pricing|\$\d|sqft|square foot|per sqft|labor rate|wages?|bls|fred|zonda|benchmark|index)\b/i,
      /\b(average|median|typical)\b.*\b(cost|price)/i,
    ],
  },
  {
    pillar: "scope_negotiation",
    patterns: [
      /\b(scope|line item|allowance|negotiate|push back|breakdown|estimate|quote)\b/i,
      /\b(how to read|how to evaluate|decipher|what should|what to look for)/i,
    ],
  },
];

export function classifyPillar(brief: string): Pillar {
  const text = brief.toLowerCase();
  for (const { pillar, patterns } of PILLAR_KEYWORDS) {
    if (patterns.some((p) => p.test(text))) return pillar;
  }
  // Default fallback — scope_negotiation is the broadest pillar
  return "scope_negotiation";
}

export function pickBlogPersona(pillar: Pillar): Persona {
  return Math.random() < PILLAR_BELLA_RATIOS[pillar] ? "bella" : "gustavo";
}

const PILLAR_TO_WP_CATEGORY: Record<Pillar, string> = {
  cost_data: "Cost Data",
  contract_risk: "Contract Risk",
  scope_negotiation: "Scope & Negotiation",
  regional: "Regional",
};

export interface BlogDraft {
  title: string;
  meta_description: string;
  category: string;
  tags: string[];
  /** Phase 7C v1 legacy field name — Gemini still emits "featured_image_brief" in some runs */
  featured_image_brief?: string;
  /** Phase 7C v2 — Imagen 3 prompt for the post hero image */
  featured_image_prompt?: string;
  /** Phase 7C v2 — alt text for the hero image */
  featured_image_alt?: string;
  last_updated: string;
  blocks: BlogBlock[];
  persona: Persona;
  pillar: Pillar;
  format: ContentFormat;
  template: LayoutTemplate;
}

export async function generateBlogDraft(
  geminiApiKey: string,
  brief: string,
  options?: {
    forcePersona?: Persona;
    forcePillar?: Pillar;
    format?: ContentFormat;
    /** Override the auto-picked layout template. */
    template?: LayoutTemplate;
    /** Published URL of this pillar's hub page — injected into spoke drafts for internal linking. */
    hubUrl?: string;
  }
): Promise<BlogDraft> {
  const pillar = options?.forcePillar ?? classifyPillar(brief);
  const persona = options?.forcePersona ?? pickBlogPersona(pillar);
  const format = options?.format ?? "spoke";
  const template = options?.template ?? pickTemplate(format, persona, brief);
  const voiceBrief = persona === "bella" ? VOICE_BRIEF_BELLA_LONGFORM : VOICE_BRIEF_GUSTAVO_LONGFORM;

  const client = new GoogleGenAI({ apiKey: geminiApiKey });

  // Internal-linking instruction: spokes link UP to the pillar hub when we know its URL.
  let linkDirective = "";
  if (format === "spoke" && options?.hubUrl) {
    linkDirective = `\n\nINTERNAL LINK: In one early paragraph, link to this pillar's complete guide using this exact URL: ${options.hubUrl} — anchor it on natural text like "our complete guide to ${PILLAR_TO_WP_CATEGORY[pillar].toLowerCase()}". Use a real <a href> in the paragraph block.`;
  }

  const userPrompt = `BLOG BRIEF:
${brief}

PILLAR: ${PILLAR_TO_WP_CATEGORY[pillar]}
TARGET DATE for "last_updated": ${new Date().toISOString().slice(0, 10)}

${FORMAT_DIRECTIVES[format]}${linkDirective}

LAYOUT TEMPLATE:
${LAYOUT_TEMPLATES[template]}

TASK: Write a long-form blog post matching the brief above and the CONTENT FORMAT rules. Apply the voice and structure rules from the system prompt. Set the "category" field to "${PILLAR_TO_WP_CATEGORY[pillar]}". Return ONLY the JSON object — no preamble, no markdown wrapping.`;

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userPrompt,
    config: {
      responseMimeType: "application/json",
      systemInstruction: voiceBrief,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const rawText = response.text || "";

  let parsed: Omit<BlogDraft, "persona" | "pillar" | "template">;
  try {
    // Gemini sometimes wraps JSON in markdown code fences despite responseMimeType
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();
    parsed = JSON.parse(cleaned || "{}");
  } catch (err) {
    throw new Error(
      `Blog drafter JSON parse failed: ${err instanceof Error ? err.message : "unknown"}. Raw response started with: ${rawText.slice(0, 200)}`
    );
  }

  // Validate the minimum required fields
  if (!parsed.title || !parsed.blocks || !Array.isArray(parsed.blocks) || parsed.blocks.length === 0) {
    throw new Error("Blog drafter returned malformed JSON (missing title or blocks)");
  }

  return {
    ...parsed,
    persona,
    pillar,
    template,
  };
}
