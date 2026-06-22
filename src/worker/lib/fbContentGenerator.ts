// Phase 7G — Weekly Facebook auto-generator
// Generates brand-voice standalone Facebook Page posts with branded images and
// schedules them out across the coming week (every other day).
//
// Reuses:
//   - generateFeaturedImage() (Gemini native image gen, best-effort, returns null)
//   - createPagePost() (Graph API /photos or /feed, supports scheduled_publish_time)
//   - R2_BUCKET + R2_PUBLIC_URL for hosting the generated image
//
// NOTE: this module never calls Date.now()/new Date() — the caller passes
// `nowSeconds` in, since those are unavailable in some worker contexts.

import { GoogleGenAI } from "@google/genai";
import { generateFeaturedImage } from "./featuredImage";
import { createPagePost } from "./facebookClient";

interface FbGenEnv {
  GEMINI_API_KEY?: string;
  R2_BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;
  FACEBOOK_PAGE_ID?: string;
  FACEBOOK_PAGE_ACCESS_TOKEN?: string;
}

const FB_BATCH_SYSTEM_PROMPT = `You generate standalone Facebook Page posts for RemodelerIQ — an AI tool that checks contractor bids against real BLS labor wages, FRED material indices, and Zonda 2026 cost data. Audience: US homeowners about to remodel. TWO voices: BELLA (data-first, journalistic, warm expert, third-person/'we', cites sources, openers like 'Here's what the data actually says...' / 'Most homeowners don't realize this, but...') and GUSTAVO (first-person founder, conversational, 'Here's what I'd do if this were my house...', 'Red flag alert:', built the tool to protect homeowners — primarily himself). RULES: NEVER use 'Gustavo Atar' or the word 'founder'. NO hashtags. 80-150 words. Open each post with ONE topic-matched emoji then a scroll-stopping hook (a question, a specific number, or 'Most homeowners don't know...'). Line breaks every 1-2 sentences for mobile. ~half the posts end with a soft CTA framed as PROTECTION not sale, MATCHED TO THE POST'S TOPIC: cost/price/regional posts → invite them to estimate their own project ('See what your kitchen should really cost in your city — free at RemodelerIQ', the cost guides/estimator); bid/contract/red-flag/deposit posts → 'Run your bid through RemodelerIQ before you sign' (the analyzer). The other half are pure value with no CTA. Use specific-sounding numbers with sources. Mix ~75% Bella / 25% Gustavo. Vary topics: red flags, cost reality-checks, questions to ask, regional insights, deposit/payment warnings, founder takes, myth-busters. Also give each post a short 'image_prompt' describing a photorealistic editorial remodeling scene for its branded image. Output ONLY JSON.`;

interface FbGenPost {
  persona: string;
  type: string;
  text: string;
  image_prompt: string;
}

export interface FbBatchResult {
  scheduled: number;
  failed: number;
  details: Array<{
    persona: string;
    type: string;
    whenHoursAhead: number;
    ok: boolean;
    fbPostId?: string;
    error?: string;
  }>;
}

// Defensive JSON parse — strips ```json fences then JSON.parse with a fallback.
function parsePosts(raw: string): FbGenPost[] {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(cleaned) as { posts?: FbGenPost[] };
    if (Array.isArray(parsed.posts)) return parsed.posts;
  } catch {
    // fall through
  }
  return [];
}

export async function generateAndScheduleFbBatch(
  env: FbGenEnv,
  nowSeconds: number,
  count = 4
): Promise<FbBatchResult> {
  const result: FbBatchResult = { scheduled: 0, failed: 0, details: [] };

  if (!env.GEMINI_API_KEY) {
    console.error("FB batch: GEMINI_API_KEY missing");
    return result;
  }

  // 1. Generate `count` standalone post objects via Gemini
  const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const userPrompt = `Generate exactly ${count} Facebook Page posts now. Output ONLY this JSON shape: {"posts":[{"persona":"bella|gustavo","type":"short label","text":"full post text with \\n line breaks (starts with an emoji)","image_prompt":"photo scene description"}]}`;

  let posts: FbGenPost[] = [];
  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: FB_BATCH_SYSTEM_PROMPT,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    posts = parsePosts(response.text || "{}");
  } catch (err) {
    console.error("FB batch: generation failed:", err);
    return result;
  }

  if (posts.length === 0) {
    console.error("FB batch: no posts parsed from Gemini output");
    return result;
  }

  // 2 + 3. For each post, best-effort image + schedule — SEQUENTIALLY to avoid
  // bursting the FB photo endpoint.
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const persona = post.persona || "bella";
    const type = post.type || "post";
    const whenHoursAhead = (i + 1) * 2 * 24; // +2, +4, +6, +8 days
    const sched = nowSeconds + (i + 1) * 2 * 86400;

    let imageUrl: string | undefined;
    try {
      // a. Best-effort image generation
      const img = await generateFeaturedImage(env as never, post.image_prompt);
      // b. If we got an image, upload it to R2 and build a public URL
      if (img) {
        const ext = img.mimeType === "image/jpeg" ? "jpg" : "png";
        const key = `fb/auto/${nowSeconds}-${i}.${ext}`;
        await env.R2_BUCKET.put(key, img.bytes, {
          httpMetadata: { contentType: img.mimeType },
        });
        imageUrl = `${env.R2_PUBLIC_URL}/${key}`;
      }

      // c + d. Schedule the post (text-only if no image)
      const fbResp = await createPagePost(
        env as never,
        imageUrl
          ? { message: post.text, image_url: imageUrl, scheduled_publish_time: sched }
          : { message: post.text, scheduled_publish_time: sched }
      );

      result.scheduled++;
      result.details.push({
        persona,
        type,
        whenHoursAhead,
        ok: true,
        fbPostId: fbResp.id,
      });
    } catch (err) {
      result.failed++;
      result.details.push({
        persona,
        type,
        whenHoursAhead,
        ok: false,
        error: err instanceof Error ? err.message : "schedule failed",
      });
    }
  }

  // 4. Return the summary
  return result;
}
