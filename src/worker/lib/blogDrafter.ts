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
}

export async function generateBlogDraft(
  geminiApiKey: string,
  brief: string,
  options?: { forcePersona?: Persona; forcePillar?: Pillar }
): Promise<BlogDraft> {
  const pillar = options?.forcePillar ?? classifyPillar(brief);
  const persona = options?.forcePersona ?? pickBlogPersona(pillar);
  const voiceBrief = persona === "bella" ? VOICE_BRIEF_BELLA_LONGFORM : VOICE_BRIEF_GUSTAVO_LONGFORM;

  const client = new GoogleGenAI({ apiKey: geminiApiKey });

  const userPrompt = `BLOG BRIEF:
${brief}

PILLAR: ${PILLAR_TO_WP_CATEGORY[pillar]}
TARGET DATE for "last_updated": ${new Date().toISOString().slice(0, 10)}

TASK: Write a long-form blog post matching the brief above. Apply the voice and structure rules from the system prompt. Set the "category" field to "${PILLAR_TO_WP_CATEGORY[pillar]}". Return ONLY the JSON object — no preamble, no markdown wrapping.`;

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

  let parsed: Omit<BlogDraft, "persona" | "pillar">;
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
  };
}
