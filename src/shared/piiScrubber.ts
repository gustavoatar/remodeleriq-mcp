// PII scrubber for bid text before corpus storage.
// For MCP callers, raw text is never retained — only the document_fingerprint
// (used for deduplication) and structured extraction are stored.
// The scrubber is exported for use by the corpus write path in Phase 1.

export const SCRUB_VERSION = "v1";

// Patterns applied in order. Most-specific first to avoid partial matches.
const PII_PATTERNS: Array<{ re: RegExp; replacement: string }> = [
  // Email addresses
  { re: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, replacement: "[EMAIL]" },
  // URLs (http / https / www)
  { re: /https?:\/\/[^\s"',)]+|www\.[^\s"',)]+/g, replacement: "[URL]" },
  // US phone numbers: (xxx) xxx-xxxx | xxx-xxx-xxxx | xxx.xxx.xxxx | xxxxxxxxxx
  { re: /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}\b/g, replacement: "[PHONE]" },
  // Street addresses: number + street name + suffix
  {
    re: /\b\d{1,5}\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3}\s+(?:Street|Avenue|Boulevard|Road|Drive|Lane|Court|Place|Way|Circle|Trail|St|Ave|Blvd|Rd|Dr|Ln|Ct|Pl|Cir|Trl)\.?\b/gi,
    replacement: "[ADDRESS]",
  },
];

// Contractor license numbers: letter prefix (optional) + 5–12 digits + optional suffix.
// We hash these rather than remove them so we can measure compliance rates without
// retaining the actual identifier.
const LICENSE_RE = /\b([A-Z]{1,6}\d{4,12}[A-Z]{0,3})\b/g;

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Stable fingerprint for deduplication. Normalizes whitespace and case before hashing.
export async function generateDocumentFingerprint(rawText: string): Promise<string> {
  const normalized = rawText.toLowerCase().replace(/\s+/g, " ").trim();
  return sha256Hex(normalized);
}

export async function scrubBidText(
  rawText: string,
  salt = "riq-v1"
): Promise<{ scrubbed: string; scrubVersion: string }> {
  let scrubbed = rawText;

  // Hash license numbers first (before other patterns can fragment them).
  const licMatches = [...rawText.matchAll(LICENSE_RE)];
  for (const match of licMatches) {
    const licNum = match[1];
    const hash = (await sha256Hex(licNum + salt)).slice(0, 8);
    // Replace all occurrences of this exact license string
    scrubbed = scrubbed.split(licNum).join(`[LIC-${hash}]`);
  }

  for (const { re, replacement } of PII_PATTERNS) {
    scrubbed = scrubbed.replace(re, replacement);
  }

  return { scrubbed, scrubVersion: SCRUB_VERSION };
}
