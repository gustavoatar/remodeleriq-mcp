// Phase 7C v2 — Featured image generation
// Generates a hero image via Gemini Imagen, then uploads to WordPress media library
// and sets it as the post's featured_media.
//
// Visual style brief (baked into every Imagen prompt):
//   - Editorial / magazine quality
//   - Renovation, contracting, or home-finance subject matter
//   - Cinematic lighting (warm overhead or natural daylight)
//   - 16:9 aspect ratio for blog hero use
//   - Subtle desaturation, slate-and-emerald accent palette where it reads natural
//   - Photorealistic, NEVER illustration / cartoon / AI-looking
//   - NO contractors looking villainous, NO over-stressed homeowners — empathetic, not preachy

import { GoogleGenAI } from "@google/genai";
import { wpFetch, looksLikeSgCaptcha } from "./sgcaptcha";

export type Persona = "bella" | "gustavo";

interface FeatImgEnv {
  GEMINI_API_KEY?: string;
  WORDPRESS_USER_BELLA?: string;
  WORDPRESS_PASS_BELLA?: string;
  WORDPRESS_USER_GUSTAVO?: string;
  WORDPRESS_PASS_GUSTAVO?: string;
}

const WP_MEDIA_URL = "https://intelligence.remodeleriq.com/wp-json/wp/v2/media";

const WP_BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "application/json",
};

function credsFor(persona: Persona, env: FeatImgEnv): { user: string; pass: string } | null {
  if (persona === "bella") {
    if (!env.WORDPRESS_USER_BELLA || !env.WORDPRESS_PASS_BELLA) return null;
    return { user: env.WORDPRESS_USER_BELLA, pass: env.WORDPRESS_PASS_BELLA };
  }
  if (!env.WORDPRESS_USER_GUSTAVO || !env.WORDPRESS_PASS_GUSTAVO) return null;
  return { user: env.WORDPRESS_USER_GUSTAVO, pass: env.WORDPRESS_PASS_GUSTAVO };
}

const BRAND_STYLE_PROMPT_SUFFIX = `Editorial-magazine quality, photorealistic, 16:9 aspect ratio. Cinematic warm natural lighting (overhead or daylight through windows). Subtle slate-blue and forest-green color grading. Real-looking textures — wood, drywall, paint, tile, blueprints, contractor paperwork. Avoid: cartoon, illustration style, AI-generated look, stock-photo cliché, overly stressed homeowners, villainous contractors. Aim: a magazine cover for a thoughtful homeowner finance publication.`;

// Hard timeout helper — image gen can hang and we must never block the post creation
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) =>
      setTimeout(() => {
        console.error(`${label} timed out after ${ms}ms`);
        resolve(null);
      }, ms)
    ),
  ]);
}

// Candidate model names — Gemini's "nano banana" image generator has shipped under
// several names. Try each in order until one works.
const IMAGE_MODEL_CANDIDATES = [
  "gemini-3.1-flash-image-preview",
  "gemini-2.5-flash-image",
  "gemini-3-pro-image",
  "gemini-2.0-flash-exp-image-generation",
];

// Generate a hero image via Gemini's native image generation.
// Each model call is wrapped in a 18s timeout. Returns null on any failure
// so the calling code can proceed without an image gracefully.
export async function generateFeaturedImage(
  env: FeatImgEnv,
  promptSubject: string
): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  if (!env.GEMINI_API_KEY) return null;

  const fullPrompt = `${promptSubject}\n\n${BRAND_STYLE_PROMPT_SUFFIX}\n\nReturn exactly one image. 16:9 horizontal composition.`;
  const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

  for (const model of IMAGE_MODEL_CANDIDATES) {
    const result = await withTimeout(
      (async () => {
        const response = await client.models.generateContent({
          model,
          contents: fullPrompt,
          config: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        });

        const candidate = response.candidates?.[0];
        const parts = candidate?.content?.parts || [];
        for (const part of parts) {
          const inline = (part as { inlineData?: { mimeType?: string; data?: string } }).inlineData;
          if (inline?.data) {
            const binary = atob(inline.data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            console.log(`Image gen success via model=${model}`);
            return { bytes, mimeType: inline.mimeType || "image/png" };
          }
        }
        return null;
      })(),
      18000,
      `Image gen (${model})`
    ).catch((err) => {
      console.error(`Image gen model=${model} failed:`, err);
      return null;
    });

    if (result) return result;
  }

  console.error("All image gen models failed — proceeding without image");
  return null;
}

// Upload generated image to WordPress media library, return the media ID
export async function uploadFeaturedImage(
  env: FeatImgEnv,
  persona: Persona,
  imageBytes: Uint8Array,
  mimeType: string,
  filename: string,
  alt: string
): Promise<number | null> {
  const creds = credsFor(persona, env);
  if (!creds) return null;

  const auth = "Basic " + btoa(`${creds.user}:${creds.pass}`);

  // First upload — POST raw bytes with Content-Disposition naming the file.
  // wpFetch transparently clears a passive SiteGround sgcaptcha challenge + replays.
  const { res: uploadRes, text: uploadText } = await wpFetch(
    WP_MEDIA_URL,
    {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
      body: imageBytes,
    },
    WP_BROWSER_HEADERS
  );

  if (looksLikeSgCaptcha(uploadRes.headers.get("content-type"), uploadText)) {
    console.error("WP media upload blocked by SiteGround sgcaptcha (could not clear) — skipping image");
    return null;
  }
  if (!uploadRes.ok) {
    console.error(`WP media upload failed: ${uploadRes.status} ${uploadText.slice(0, 300)}`);
    return null;
  }

  // The WP media endpoint normally returns JSON, but shared hosting / WAF layers
  // occasionally answer a binary POST with an HTML page (block page, PHP error,
  // "just a moment" challenge) carrying a 200. Guard the parse so a flaky upload
  // degrades to "no image" instead of throwing and killing the whole blog draft.
  let mediaJson: { id?: number; source_url?: string };
  try {
    mediaJson = JSON.parse(uploadText) as { id?: number; source_url?: string };
  } catch {
    console.error(
      `WP media upload returned non-JSON (content-type=${uploadRes.headers.get("content-type")}). First 200 chars: ${uploadText.slice(0, 200)}`
    );
    return null;
  }
  const mediaId = mediaJson.id;
  if (!mediaId) return null;

  // Second pass — set alt text on the media item
  try {
    await fetch(`${WP_MEDIA_URL}/${mediaId}`, {
      method: "POST",
      headers: {
        ...WP_BROWSER_HEADERS,
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ alt_text: alt, caption: alt }),
    });
  } catch (err) {
    console.error("Failed to set alt text on media:", err);
    // Not fatal; the image is still uploaded
  }

  return mediaId;
}

// Convenience wrapper — generate + upload in one call
export async function createFeaturedImage(
  env: FeatImgEnv,
  persona: Persona,
  imagenPrompt: string,
  postTitle: string
): Promise<number | null> {
  const generated = await generateFeaturedImage(env, imagenPrompt);
  if (!generated) return null;

  // Build a filename from the post title
  const slug = postTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const ext = generated.mimeType === "image/jpeg" ? "jpg" : "png";
  const filename = `${slug}-${Date.now()}.${ext}`;

  return await uploadFeaturedImage(
    env,
    persona,
    generated.bytes,
    generated.mimeType,
    filename,
    postTitle
  );
}
