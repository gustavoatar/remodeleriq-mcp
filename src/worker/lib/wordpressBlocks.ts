// Phase 7C — Gutenberg block renderer
// Takes the structured blocks array from blogDrafter and produces WordPress-ready
// Gutenberg block markup (HTML comments + inner HTML).
//
// Visual style: core blocks with class names. Tweak appearance later by adding
// CSS rules in the WP theme for these class names without re-rendering posts.

import {
  renderBarChartSvg,
  renderComparisonBarsSvg,
  renderDonutSvg,
  type BarChartData,
  type ComparisonBarsData,
  type DonutData,
} from "./chartSvg";

export type BlogBlock =
  | { type: "hero"; title: string; subtitle: string; snippet_paragraph: string }
  | { type: "section_cover"; title: string; body: string; theme?: "dark" | "light" | "gray" | "emerald" | "amber" }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "stat_callout"; big_number: string; label: string; source: string; date?: string }
  | { type: "comparison_table"; headers: string[]; rows: string[][] }
  | {
      type: "two_column";
      left_heading: string;
      left_body: string;
      left_items?: string[];     // Optional bulleted list (preferred over inline HTML)
      right_heading: string;
      right_body: string;
      right_items?: string[];    // Optional bulleted list
      left_theme?: "ok" | "warning";
      right_theme?: "ok" | "warning";
    }
  | { type: "three_column"; items: { heading: string; body: string; icon_emoji?: string }[] }
  | {
      type: "image";
      imagen_prompt: string;
      caption: string;
      alt: string;
      /** Optional magazine layout — paragraph text rendered beside the image */
      body?: string;
      /** Optional kicker — small all-caps label above the caption (e.g., "FIELD NOTE") */
      kicker?: string;
    }
  | {
      type: "chart";
      chart_type: "bar" | "comparison_bars" | "donut";
      data: BarChartData | ComparisonBarsData | DonutData;
    }
  | {
      type: "cta_button_group";
      heading?: string;
      buttons: { label: string; url: string; style?: "primary" | "secondary" }[];
    }
  | { type: "pull_quote"; text: string; attribution: string }
  | { type: "faq"; items: { q: string; a: string }[] }
  | {
      type: "cta_banner";
      /** Small all-caps kicker rendered in a green pill above the headline (e.g., "DATA BEATS GUT FEELINGS") */
      kicker?: string;
      /** Large bold headline (e.g., "Negotiate Like a Pro.") */
      headline?: string;
      /** Body sentence — supports {brand} placeholder which renders as styled inline link */
      text: string;
      button_label: string;
      button_url: string;
    }
  | {
      /** Bold "the short version" box — large text, brand-green left border, light tint.
       * Renders the standalone 40-60 word answer/verdict. */
      type: "verdict_callout";
      /** Small all-caps label above the text (defaults to "THE SHORT VERSION") */
      label?: string;
      text: string;
    }
  | {
      /** Amber/red warning card for a red-flag warning. */
      type: "red_flag_callout";
      title: string;
      body: string;
      /** Small uppercase pill (defaults to "⚠ RED FLAG") */
      tag?: string;
    }
  | {
      /** Numbered "ask your contractor this" script cards. */
      type: "talk_track";
      /** Section heading (defaults to "The Talk Track") */
      heading?: string;
      scripts: { prompt: string; why?: string }[];
    }
  | {
      /** Breathing-room gallery — a responsive grid of images (great for trend/style
       * posts). Each image resolves its src from an explicit `src` OR a generated
       * Imagen prompt (via the imageResolutions map). Images that resolve to nothing
       * are skipped so the page never shows a broken image. */
      type: "gallery";
      images: { imagen_prompt?: string; src?: string; caption?: string; alt?: string }[];
      /** Desktop column count (default 2). */
      columns?: 2 | 3;
    };

function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Robust edge-to-edge full-bleed: breaks a block out of the centered content
// column to the full viewport width. Uses the calc(50% - 50vw) margin technique
// (works regardless of column width as long as the column is centered) with
// !important so block-theme margin rules can't override it. The `alignfull`
// class is also added on elements so themes that natively support it cooperate.
const FULLBLEED =
  "width:100vw;max-width:100vw;margin-left:calc(50% - 50vw)!important;margin-right:calc(50% - 50vw)!important;box-sizing:border-box;";

// Sanitize inline body text: Gemini sometimes wraps phrases in stray inline HTML
// (e.g. <span class="riq-cursive-accent">Red flag alert:</span>) which then shows
// as a LITERAL tag when escaped. Keep a small allowlist of safe inline tags
// (a/strong/em/b/i/br) and DROP every other tag while preserving its inner text.
// Anchors are href-validated to http(s)/relative. Loose < and & are then escaped.
function sanitizeInline(s: string): string {
  if (!s) return "";
  // STRIP disallowed inline tags entirely (keep their inner text) so stray markup
  // like <span class="riq-cursive-accent">honest truth</span> becomes just
  // "honest truth" — never a literal tag. A tiny allowlist (a/strong/em/b/i/br) is
  // protected via private-use placeholders, the rest of the text is escaped, then
  // the allowlisted tags are restored.
  const keep: string[] = [];
  const L = String.fromCharCode(0xe000);
  const R = String.fromCharCode(0xe001);
  let out = s.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (full, tag: string, attrs: string) => {
    const t = tag.toLowerCase();
    const closing = full.startsWith("</");
    let rebuilt = "";
    if (t === "strong" || t === "em" || t === "b" || t === "i" || t === "br") {
      rebuilt = closing ? `</${t}>` : `<${t}>`;
    } else if (t === "a") {
      if (closing) rebuilt = "</a>";
      else {
        const href = (attrs.match(/href\s*=\s*["']([^"']*)["']/i) || [])[1] || "";
        rebuilt = /^(https?:\/\/|\/)/i.test(href) ? `<a href="${href.replace(/"/g, "&quot;")}">` : "";
      }
    } else {
      return ""; // disallowed tag -> strip, keep surrounding text
    }
    if (!rebuilt) return "";
    keep.push(rebuilt);
    return L + (keep.length - 1) + R;
  });
  out = out.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  out = out.replace(new RegExp(L + "(\\d+)" + R, "g"), (_m: string, i: string) => keep[Number(i)] || "");
  return out;
}

// Strong-consonant words that look great as a giant cursive drop cap.
// If Bella opens the snippet with an article ("The", "A", "An"), we promote
// the first real noun/verb to the start by reshuffling — or detect & note.
const WEAK_OPENING_WORDS = new Set(["the", "a", "an", "in", "on", "at", "of", "to", "for", "with"]);

function rewriteOpeningForDropCap(snippet: string): string {
  // If the snippet starts with a weak word (article/preposition), the drop cap
  // would land on something like "T" of "The" — that's what we want to avoid.
  // Strategy: capitalize-promote the second word OR add a brief lead-in.
  // Simpler heuristic: just return as-is, and let Bella's brief enforce a
  // strong opening word. This function is a safety net for edge cases.
  const trimmed = snippet.trim();
  if (!trimmed) return snippet;
  const firstWord = trimmed.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, "");
  if (!WEAK_OPENING_WORDS.has(firstWord)) return trimmed;
  // Weak opening detected — drop the article so the next word becomes the start.
  // "The bathroom remodel..." → "Bathroom remodel..."
  // "A common red flag..." → "Common red flag..."
  const words = trimmed.split(/\s+/);
  if (words.length < 3) return trimmed;
  words.shift();
  // Capitalize the new first word
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(" ");
}

function renderHero(b: Extract<BlogBlock, { type: "hero" }>): string {
  const snippet = rewriteOpeningForDropCap(b.snippet_paragraph || "");
  // Find the index where the first word ends — drop cap applies to that whole word
  const firstSpaceIdx = snippet.indexOf(" ");
  const firstWord = firstSpaceIdx === -1 ? snippet : snippet.slice(0, firstSpaceIdx);
  const rest = firstSpaceIdx === -1 ? "" : snippet.slice(firstSpaceIdx);
  const firstLetter = firstWord.charAt(0);
  const firstWordTail = firstWord.slice(1);

  return `<!-- wp:html -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Allura&family=Inter:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500;1,700&family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,900&display=swap');
.riq-snippet { font-family: 'Inter', system-ui, sans-serif; }
.riq-snippet .riq-dropcap-letter {
  font-family: 'Allura', 'Pinyon Script', cursive;
  font-size: 12rem;
  line-height: 0.7;
  font-weight: 400;
  color: #1F9C4C;
  float: left;
  padding: 26px 10px 0 0;
  margin: 0;
}
.riq-snippet .riq-dropcap-word-tail {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 700;
  font-size: 3rem;
  color: #0f172a;
  letter-spacing: -0.02em;
}
.riq-cursive-accent { font-family: 'Allura', cursive; color: #1F9C4C; font-weight: 400; font-size: 1.6em; line-height: 1; }
.riq-magazine-caption { font-family: 'Inter', sans-serif; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #475569; margin-top: 12px; }
.riq-pull-quote p { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; }
</style>
<!-- /wp:html -->

<!-- wp:cover {"customOverlayColor":"#0f172a","minHeight":380,"className":"riq-hero"} -->
<div class="wp-block-cover riq-hero" style="background-color:#0f172a;min-height:380px;padding:88px 32px;">
  <span aria-hidden="true" class="wp-block-cover__background has-background-dim-0" style="background-color:#0f172a"></span>
  <div class="wp-block-cover__inner-container">
    <!-- wp:heading {"level":1,"textColor":"white","className":"riq-hero-title"} -->
    <h1 class="riq-hero-title has-white-color has-text-color" style="color:#ffffff;font-size:3rem;font-weight:800;letter-spacing:-0.025em;line-height:1.1;margin:0 0 16px;">${sanitizeInline(b.title)}</h1>
    <!-- /wp:heading -->
    <!-- wp:paragraph {"textColor":"white","className":"riq-hero-subtitle"} -->
    <p class="riq-hero-subtitle has-white-color has-text-color" style="color:#e2e8f0;font-size:1.25rem;line-height:1.5;margin:0;">${sanitizeInline(b.subtitle)}</p>
    <!-- /wp:paragraph -->
  </div>
</div>
<!-- /wp:cover -->

<!-- wp:paragraph {"className":"riq-snippet"} -->
<p class="riq-snippet" style="font-size:1.2rem;line-height:1.8;color:#0f172a;margin:72px 0 48px;font-weight:400;"><span class="riq-dropcap-letter">${esc(firstLetter)}</span><span class="riq-dropcap-word-tail">${sanitizeInline(firstWordTail)}</span>${sanitizeInline(rest)}</p>
<!-- /wp:paragraph -->`;
}

function renderH2(b: Extract<BlogBlock, { type: "h2" }>): string {
  return `<!-- wp:heading {"level":2,"className":"riq-h2"} -->
<h2 class="riq-h2" style="font-size:2rem;font-weight:800;color:#0f172a;letter-spacing:-0.02em;margin:64px 0 20px;line-height:1.2;">${sanitizeInline(b.text)}</h2>
<!-- /wp:heading -->`;
}

function renderH3(b: Extract<BlogBlock, { type: "h3" }>): string {
  return `<!-- wp:heading {"level":3,"className":"riq-h3"} -->
<h3 class="riq-h3" style="font-size:1.4rem;font-weight:700;color:#0f172a;margin:40px 0 14px;line-height:1.3;">${sanitizeInline(b.text)}</h3>
<!-- /wp:heading -->`;
}

function renderParagraph(b: Extract<BlogBlock, { type: "paragraph" }>): string {
  return `<!-- wp:paragraph -->
<p style="font-size:1.05rem;line-height:1.8;color:#1e293b;margin:24px 0;max-width:68ch;">${sanitizeInline(b.text)}</p>
<!-- /wp:paragraph -->`;
}

function renderStatCallout(b: Extract<BlogBlock, { type: "stat_callout" }>): string {
  // No filled box — just a huge brand-green number as a typographic moment,
  // label + source beneath in dark/muted. Reads like an Apple stat band.
  const dateSuffix = b.date ? ` (${esc(b.date)})` : "";
  return `<!-- wp:group {"className":"riq-stat-callout"} -->
<div class="wp-block-group riq-stat-callout" style="text-align:center;margin:72px auto;padding:0;max-width:620px;">
  <!-- wp:heading {"level":3,"className":"riq-stat-number"} -->
  <h3 class="riq-stat-number" style="color:#1F9C4C;font-family:'Fraunces','Cormorant Garamond',Georgia,serif;font-size:5.5rem;font-weight:800;letter-spacing:-0.04em;line-height:0.92;margin:0 0 14px;">${esc(b.big_number)}</h3>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"className":"riq-stat-label"} -->
  <p class="riq-stat-label" style="color:#0f172a;font-size:1.3rem;font-weight:600;margin:0 auto 10px;line-height:1.4;max-width:520px;">${sanitizeInline(b.label)}</p>
  <!-- /wp:paragraph -->
  <!-- wp:paragraph {"className":"riq-stat-source"} -->
  <p class="riq-stat-source" style="color:#94a3b8;font-size:0.82rem;margin:0;font-style:italic;">Source: ${esc(b.source)}${dateSuffix}</p>
  <!-- /wp:paragraph -->
</div>
<!-- /wp:group -->`;
}

function renderComparisonTable(b: Extract<BlogBlock, { type: "comparison_table" }>): string {
  const headerCellStyle = "padding:14px 16px;text-align:left;font-family:'Inter',sans-serif;font-size:0.78rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#ffffff;background:#1F9C4C;border:none;";
  const bodyCellStyle = "padding:14px 16px;text-align:left;font-family:'Inter',sans-serif;font-size:0.98rem;font-weight:400;color:#1e293b;line-height:1.5;border-bottom:1px solid #e2e8f0;vertical-align:top;";
  const firstColStyle = "font-weight:700;color:#0f172a;";

  const headers = b.headers.map((h) => `<th style="${headerCellStyle}">${sanitizeInline(h)}</th>`).join("");
  const body = (b.rows || [])
    .map((row, rowIdx) => {
      const zebra = rowIdx % 2 === 1 ? "background:#f8fafc;" : "background:#ffffff;";
      const cells = row.map((c, colIdx) => {
        const extra = colIdx === 0 ? firstColStyle : "";
        return `<td style="${bodyCellStyle}${extra}">${sanitizeInline(c)}</td>`;
      }).join("");
      return `      <tr style="${zebra}">${cells}</tr>`;
    })
    .join("\n");

  return `<!-- wp:html -->
<figure class="wp-block-table riq-comparison-table" style="margin:48px 0;overflow:hidden;border-radius:10px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(15,23,42,0.04);">
  <table style="border-collapse:collapse;width:100%;font-family:'Inter',sans-serif;background:#ffffff;">
    <thead>
      <tr>${headers}</tr>
    </thead>
    <tbody>
${body}
    </tbody>
  </table>
</figure>
<!-- /wp:html -->`;
}

function renderPullQuote(b: Extract<BlogBlock, { type: "pull_quote" }>): string {
  // Editorial pull quote — large bold serif statement, NOT italic-thin. Reads
  // as a typographic moment, not a decorative quote. Brand-green left bar
  // accent. No attribution sign-off per Gustavo's direction.
  // Uses Fraunces variable font (or system serif) for that chunky-elegant
  // editorial display feel.
  return `<!-- wp:quote {"className":"riq-pull-quote"} -->
<blockquote class="wp-block-quote riq-pull-quote" style="border:none;background:transparent;padding:0;margin:64px 0;position:relative;">
  <span aria-hidden="true" style="position:absolute;left:-8px;top:-32px;font-family:'Fraunces','Cormorant Garamond',Georgia,serif;font-size:8rem;line-height:1;color:#1F9C4C;font-weight:900;opacity:0.18;">&ldquo;</span>
  <p style="font-family:'Fraunces','Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:2.1rem;font-weight:600;color:#0f172a;line-height:1.25;margin:0;letter-spacing:-0.02em;font-style:normal;padding-left:8px;border-left:4px solid #1F9C4C;padding:0 0 0 24px;">${sanitizeInline(b.text)}</p>
</blockquote>
<!-- /wp:quote -->`;
}

function renderFaq(b: Extract<BlogBlock, { type: "faq" }>): string {
  const items = b.items
    .map((item) => `<!-- wp:heading {"level":3,"className":"riq-faq-q"} -->
<h3 class="riq-faq-q" style="font-size:1.2rem;font-weight:700;color:#0f172a;margin:24px 0 8px;line-height:1.35;">${sanitizeInline(item.q)}</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"riq-faq-a"} -->
<p class="riq-faq-a" style="font-size:1rem;line-height:1.65;color:#334155;margin:0 0 12px;">${sanitizeInline(item.a)}</p>
<!-- /wp:paragraph -->`)
    .join("\n\n");

  return `<!-- wp:heading {"level":2,"className":"riq-faq-heading"} -->
<h2 class="riq-faq-heading" style="font-size:2rem;font-weight:800;color:#0f172a;margin:64px 0 20px;letter-spacing:-0.02em;">Frequently Asked Questions</h2>
<!-- /wp:heading -->

<!-- wp:group {"className":"riq-faq-block"} -->
<div class="wp-block-group riq-faq-block" style="background:#f8fafc;padding:40px;border-radius:12px;margin:20px 0 48px;">
${items}
</div>
<!-- /wp:group -->`;
}

function renderSectionCover(b: Extract<BlogBlock, { type: "section_cover" }>): string {
  // Full-bleed color band (breaks out of the content column to 100vw) — an
  // immersive Apple-style "moment". Themes: dark / gray / light / brand / amber.
  const themes: Record<string, { bg: string; title: string; body: string }> = {
    dark: { bg: "#0f172a", title: "#ffffff", body: "#cbd5e1" },
    light: { bg: "#ffffff", title: "#0f172a", body: "#475569" },
    gray: { bg: "#f1f5f9", title: "#0f172a", body: "#475569" },
    emerald: { bg: "#1F9C4C", title: "#ffffff", body: "#ecfdf5" },
    amber: { bg: "#b45309", title: "#ffffff", body: "#fef3c7" },
  };
  const t = themes[b.theme || "dark"] || themes.dark;
  return `<!-- wp:html -->
<section class="riq-section-band alignfull" style="${FULLBLEED}margin-top:88px;margin-bottom:88px;background:${t.bg};padding:104px 24px;">
  <div style="max-width:760px;margin:0 auto;text-align:center;">
    <h2 style="color:${t.title};font-family:'Fraunces','Cormorant Garamond',Georgia,serif;font-size:2.6rem;font-weight:700;letter-spacing:-0.02em;line-height:1.15;margin:0 0 18px;">${sanitizeInline(b.title)}</h2>
    <p style="color:${t.body};font-size:1.2rem;line-height:1.65;margin:0;">${sanitizeInline(b.body)}</p>
  </div>
</section>
<!-- /wp:html -->`;
}

// Strip HTML-looking content that Gemini sometimes embeds in body strings,
// converting common patterns into clean plain-text or extracted bullet items.
function stripBodyHtml(body: string): { text: string; items: string[] } {
  if (!body) return { text: "", items: [] };
  // If the body contains <li> tags, extract them as bullet items
  const liMatches = body.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  if (liMatches && liMatches.length > 0) {
    const items = liMatches.map((m) =>
      m.replace(/<li[^>]*>/i, "").replace(/<\/li>/i, "").replace(/<[^>]+>/g, "").trim().replace(/^["']|["']$/g, "")
    ).filter(Boolean);
    return { text: "", items };
  }
  // Otherwise just strip all HTML and return as text
  return { text: body.replace(/<[^>]+>/g, "").trim(), items: [] };
}

function renderTwoColumn(b: Extract<BlogBlock, { type: "two_column" }>): string {
  const themeBg = (theme: "ok" | "warning" | undefined) =>
    theme === "warning" ? "#fef2f2" : theme === "ok" ? "#ecfdf5" : "#f8fafc";
  const themeBorder = (theme: "ok" | "warning" | undefined) =>
    theme === "warning" ? "#dc2626" : theme === "ok" ? "#1F9C4C" : "#cbd5e1";

  // Resolve body OR items for each column. Strip any HTML Gemini snuck in.
  const left = b.left_items?.length
    ? { text: "", items: b.left_items }
    : stripBodyHtml(b.left_body || "");
  const right = b.right_items?.length
    ? { text: "", items: b.right_items }
    : stripBodyHtml(b.right_body || "");

  const renderSide = (heading: string, side: { text: string; items: string[] }, theme: "ok" | "warning" | undefined) => {
    const bodyOrList = side.items.length > 0
      ? `<!-- wp:list -->
    <ul style="padding-left:20px;margin:0;font-size:0.98rem;line-height:1.6;color:#1e293b;">${side.items.map((it) => `<li style="margin-bottom:8px;">${sanitizeInline(it)}</li>`).join("")}</ul>
    <!-- /wp:list -->`
      : `<!-- wp:paragraph -->
    <p style="font-size:1rem;line-height:1.6;color:#1e293b;margin:0;">${sanitizeInline(side.text)}</p>
    <!-- /wp:paragraph -->`;
    return `  <!-- wp:column -->
  <div class="wp-block-column" style="background:${themeBg(theme)};border-left:4px solid ${themeBorder(theme)};padding:30px;border-radius:0 8px 8px 0;">
    <!-- wp:heading {"level":3,"className":"riq-col-heading"} -->
    <h3 class="riq-col-heading" style="margin:0 0 14px;font-weight:700;font-size:1.25rem;color:#0f172a;letter-spacing:-0.01em;">${sanitizeInline(heading)}</h3>
    <!-- /wp:heading -->
    ${bodyOrList}
  </div>
  <!-- /wp:column -->`;
  };

  return `<!-- wp:columns {"className":"riq-two-column"} -->
<div class="wp-block-columns riq-two-column" style="gap:16px;margin:48px 0;">
${renderSide(b.left_heading, left, b.left_theme)}

${renderSide(b.right_heading, right, b.right_theme)}
</div>
<!-- /wp:columns -->`;
}

function renderThreeColumn(b: Extract<BlogBlock, { type: "three_column" }>): string {
  const cols = b.items
    .map(
      (item) => `  <!-- wp:column -->
  <div class="wp-block-column" style="background:#f8fafc;padding:34px 26px;border-radius:10px;text-align:center;border:1px solid #e2e8f0;">
    ${item.icon_emoji ? `<!-- wp:paragraph {"className":"riq-col-icon"} --><p class="riq-col-icon" style="font-size:1.75rem;line-height:1;margin:0 auto 14px;width:52px;height:52px;display:flex;align-items:center;justify-content:center;background:#ffffff;border:1px solid #d1fae5;border-radius:50%;">${esc(item.icon_emoji)}</p><!-- /wp:paragraph -->` : ""}
    <!-- wp:heading {"level":3,"className":"riq-col-heading"} -->
    <h3 class="riq-col-heading" style="margin:0 0 8px;font-weight:700;font-size:1.05rem;color:#0f172a;letter-spacing:-0.01em;">${sanitizeInline(item.heading)}</h3>
    <!-- /wp:heading -->
    <!-- wp:paragraph -->
    <p style="font-size:0.95rem;line-height:1.55;color:#475569;margin:0;">${sanitizeInline(item.body)}</p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:column -->`
    )
    .join("\n");
  return `<!-- wp:columns {"className":"riq-three-column"} -->
<div class="wp-block-columns riq-three-column" style="gap:16px;margin:48px 0;">
${cols}
</div>
<!-- /wp:columns -->`;
}

// Magazine-style image rendering — heavy editorial feel inspired by Tubik
// Studio's satellite-image-as-art reference. Caption renders as a structured
// metadata block (kicker + caption text) anchored bottom-right of the figure
// when standalone, or as a tight info column when paired with side body text.
function renderImageBlock(
  b: Extract<BlogBlock, { type: "image" }>,
  resolvedSrc?: string,
  resolvedMediaId?: number
): string {
  // No resolved src — render NOTHING rather than a broken/placeholder figure.
  if (!resolvedSrc) return "";

  // Full-bleed editorial image — edge-to-edge (100vw), ~half-viewport tall,
  // NO caption. The image IS the moment (Apple Newsroom style). An optional
  // `body` becomes a centered serif lead BELOW the image, re-constrained.
  const cls = resolvedMediaId ? ` class="wp-image-${resolvedMediaId}"` : "";
  const lead =
    b.body && b.body.trim().length > 0
      ? `<div style="max-width:720px;margin:0 auto;padding:0 24px;"><p style="font-family:'Fraunces','Cormorant Garamond',Georgia,serif;font-size:1.6rem;line-height:1.45;color:#0f172a;font-weight:500;text-align:center;margin:40px auto 0;letter-spacing:-0.01em;">${sanitizeInline(b.body)}</p></div>`
      : "";
  return `<!-- wp:html -->
<figure class="riq-fullbleed-image alignfull" style="${FULLBLEED}margin-top:80px;margin-bottom:80px;padding:0;">
  <img src="${esc(resolvedSrc)}" alt="${esc(b.alt)}" loading="lazy" style="width:100%;height:54vh;min-height:360px;object-fit:cover;display:block;margin:0;"${cls}/>
  ${lead}
</figure>
<!-- /wp:html -->`;
}

function renderChartBlock(b: Extract<BlogBlock, { type: "chart" }>): string {
  let svg = "";
  if (b.chart_type === "bar") svg = renderBarChartSvg(b.data as BarChartData);
  else if (b.chart_type === "comparison_bars") svg = renderComparisonBarsSvg(b.data as ComparisonBarsData);
  else if (b.chart_type === "donut") svg = renderDonutSvg(b.data as DonutData);
  if (!svg) return "";

  // Wrap in a WP HTML block so Gutenberg leaves the SVG alone
  return `<!-- wp:html -->
<div class="riq-chart-wrap" style="margin:48px 0;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
${svg}
</div>
<!-- /wp:html -->`;
}

// Real internal URLs allowed for CTA buttons. Anything else gets rewritten to /
const VALID_INTERNAL_URLS = new Set([
  "https://remodeleriq.com",
  "https://remodeleriq.com/",
  "https://remodeleriq.com/how-we-score",
  "https://remodeleriq.com/labor-rates",
  "https://remodeleriq.com/trusted-radar",
  "https://remodeleriq.com/glossary",
  "https://remodeleriq.com/premium",
  "https://remodeleriq.com/remodeling-cost-guides/",
  "https://remodeleriq.com/studio",
  "https://intelligence.remodeleriq.com",
  "https://intelligence.remodeleriq.com/",
]);

function sanitizeUrl(url: string): string {
  const trimmed = (url || "").trim();
  if (!trimmed) return "https://remodeleriq.com";
  // External URLs (other domains): allow as-is
  if (/^https?:\/\//i.test(trimmed) && !trimmed.includes("remodeleriq.com")) return trimmed;
  // Internal URLs: must be in the whitelist OR a remodeling-cost-guides subpath
  if (VALID_INTERNAL_URLS.has(trimmed)) return trimmed;
  if (/^https:\/\/remodeleriq\.com\/remodeling-cost-guides\/[a-z0-9-]+-remodeling-cost-guide\/?$/i.test(trimmed)) return trimmed;
  if (/^https:\/\/intelligence\.remodeleriq\.com\/[a-z0-9-]+\/?$/i.test(trimmed)) return trimmed;
  // Fall back to homepage rather than 404 — Bella invented this URL
  return "https://remodeleriq.com";
}

function renderCtaButtonGroup(b: Extract<BlogBlock, { type: "cta_button_group" }>): string {
  const buttons = b.buttons
    .map(
      (btn) => {
        const url = sanitizeUrl(btn.url);
        const style = btn.style || "primary";
        const buttonStyles = style === "secondary"
          ? "background:#ffffff;border:2px solid #1F9C4C;color:#1F9C4C;padding:13px 28px;border-radius:8px;font-weight:600;text-decoration:none;font-size:1rem;display:inline-block;"
          : "background:#1F9C4C;color:#ffffff;padding:14px 28px;border-radius:8px;font-weight:600;text-decoration:none;font-size:1rem;display:inline-block;border:2px solid #1F9C4C;";
        return `  <!-- wp:button {"className":"riq-cta-btn-${style}"} -->
  <div class="wp-block-button riq-cta-btn-${style}" style="margin:6px;">
    <a class="wp-block-button__link" href="${esc(url)}" style="${buttonStyles}">${sanitizeInline(btn.label)}</a>
  </div>
  <!-- /wp:button -->`;
      }
    )
    .join("\n");

  return `${b.heading ? `<!-- wp:heading {"level":3,"className":"riq-cta-group-heading"} -->
<h3 class="riq-cta-group-heading" style="text-align:center;margin:40px 0 16px;font-size:1.4rem;font-weight:700;color:#0f172a;">${sanitizeInline(b.heading)}</h3>
<!-- /wp:heading -->\n\n` : ""}<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"className":"riq-cta-group"} -->
<div class="wp-block-buttons riq-cta-group" style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:24px 0 48px;">
${buttons}
</div>
<!-- /wp:buttons -->`;
}

function renderCtaBanner(b: Extract<BlogBlock, { type: "cta_banner" }>): string {
  const url = sanitizeUrl(b.button_url);
  // Body text supports {brand} placeholder — renders as bold underlined inline link to RemodelerIQ
  const bodyText = sanitizeInline(b.text || "").replace(
    /\{brand\}/g,
    `<a href="https://remodeleriq.com" style="color:#1F9C4C;font-weight:700;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px;">RemodelerIQ</a>`
  );
  const kicker = b.kicker || "DATA BEATS GUT FEELINGS";
  const headline = b.headline || "Negotiate Like a Pro.";

  return `<!-- wp:group {"className":"riq-cta-banner"} -->
<div class="wp-block-group riq-cta-banner" style="background:#ffffff;padding:64px 32px 72px;margin:64px 0 32px;text-align:center;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
  <!-- wp:html -->
  <span class="riq-cta-kicker" style="display:inline-block;background:#dcfce7;color:#1F9C4C;font-family:'Inter',sans-serif;font-size:0.78rem;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;padding:8px 22px;border-radius:999px;margin-bottom:24px;">${sanitizeInline(kicker)}</span>
  <!-- /wp:html -->

  <!-- wp:heading {"level":2,"className":"riq-cta-headline"} -->
  <h2 class="riq-cta-headline" style="font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:3.5rem;font-weight:900;color:#0f172a;letter-spacing:-0.035em;line-height:1.05;margin:0 auto 24px;max-width:780px;">${sanitizeInline(headline)}</h2>
  <!-- /wp:heading -->

  <!-- wp:paragraph {"className":"riq-cta-body"} -->
  <p class="riq-cta-body" style="font-family:'Inter',sans-serif;font-size:1.2rem;line-height:1.55;color:#475569;margin:0 auto 40px;max-width:680px;font-weight:400;">${bodyText}</p>
  <!-- /wp:paragraph -->

  <!-- wp:html -->
  <p style="margin:0;"><a href="${esc(url)}" class="riq-cta-mega-btn" style="display:inline-flex;align-items:center;gap:14px;background:#1F9C4C;color:#ffffff;padding:22px 44px;border-radius:999px;font-family:'Inter',sans-serif;font-weight:800;font-size:1.05rem;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;box-shadow:0 6px 16px rgba(31,156,76,0.25);transition:transform 0.15s ease;">${sanitizeInline(b.button_label)} <span style="display:inline-block;font-size:1.3rem;font-weight:400;">&rarr;</span></a></p>
  <!-- /wp:html -->
</div>
<!-- /wp:group -->`;
}

function renderVerdictCallout(b: Extract<BlogBlock, { type: "verdict_callout" }>): string {
  const label = b.label || "THE SHORT VERSION";
  return `<!-- wp:html -->
<div class="riq-verdict-callout" style="background:#ecfdf5;border-left:6px solid #1F9C4C;padding:40px 40px 42px;margin:56px 0;border-radius:0 12px 12px 0;">
  <span style="display:block;font-family:'Inter',sans-serif;font-size:0.78rem;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#1F9C4C;margin:0 0 14px;">${sanitizeInline(label)}</span>
  <p style="font-family:'Inter',sans-serif;font-size:1.45rem;line-height:1.5;font-weight:600;color:#0f172a;margin:0;letter-spacing:-0.01em;">${sanitizeInline(b.text)}</p>
</div>
<!-- /wp:html -->`;
}

function renderRedFlagCallout(b: Extract<BlogBlock, { type: "red_flag_callout" }>): string {
  const tag = b.tag || "⚠ RED FLAG";
  return `<!-- wp:html -->
<div class="riq-red-flag-callout" style="background:#fef2f2;border:1px solid #fecaca;border-left:6px solid #dc2626;padding:34px 34px 36px;margin:48px 0;border-radius:0 12px 12px 0;">
  <span style="display:inline-block;background:#dc2626;color:#ffffff;font-family:'Inter',sans-serif;font-size:0.72rem;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;padding:6px 16px;border-radius:999px;margin:0 0 16px;">${sanitizeInline(tag)}</span>
  <h3 class="riq-red-flag-title" style="font-family:'Inter',sans-serif;font-size:1.3rem;font-weight:700;color:#0f172a;letter-spacing:-0.01em;line-height:1.3;margin:0 0 10px;">${sanitizeInline(b.title)}</h3>
  <p style="font-family:'Inter',sans-serif;font-size:1.02rem;line-height:1.65;color:#1e293b;margin:0;">${sanitizeInline(b.body)}</p>
</div>
<!-- /wp:html -->`;
}

function renderTalkTrack(b: Extract<BlogBlock, { type: "talk_track" }>): string {
  const heading = b.heading || "The Talk Track";
  const cards = (b.scripts || [])
    .map(
      (s, idx) => `  <div class="riq-talk-track-card" style="display:flex;gap:18px;align-items:flex-start;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:28px 30px;margin:0 0 16px;">
    <span style="flex-shrink:0;width:38px;height:38px;display:flex;align-items:center;justify-content:center;background:#1F9C4C;color:#ffffff;font-family:'Inter',sans-serif;font-size:1.1rem;font-weight:800;border-radius:50%;line-height:1;">${idx + 1}</span>
    <div style="flex:1;">
      <p style="font-family:'Inter',sans-serif;font-size:1.12rem;line-height:1.45;font-weight:700;color:#0f172a;margin:0;letter-spacing:-0.01em;">&ldquo;${sanitizeInline(s.prompt)}&rdquo;</p>
      ${s.why ? `<p style="font-family:'Inter',sans-serif;font-size:0.92rem;line-height:1.55;color:#475569;margin:10px 0 0;"><span style="font-weight:700;color:#1F9C4C;">Why:</span> ${sanitizeInline(s.why)}</p>` : ""}
    </div>
  </div>`
    )
    .join("\n");

  return `<!-- wp:html -->
<div class="riq-talk-track" style="margin:56px 0;">
  <h3 class="riq-talk-track-heading" style="font-family:'Inter',sans-serif;font-size:1.4rem;font-weight:800;color:#0f172a;letter-spacing:-0.02em;margin:0 0 18px;">${sanitizeInline(heading)}</h3>
${cards}
</div>
<!-- /wp:html -->`;
}

// Breathing-room gallery — a responsive CSS grid of images. This is an airy,
// magazine-style block: generous gap + margin, rounded corners, consistent 4/3
// crop. Image sources resolve from explicit `src` OR a generated Imagen prompt;
// any image that resolves to nothing is skipped so the page never shows a broken
// <img>. If zero images resolve, the whole block renders nothing.
function renderGallery(
  b: Extract<BlogBlock, { type: "gallery" }>,
  imageResolutions?: Map<string, ImageResolution>
): string {
  const srcs = (b.images || [])
    .map((img) => {
      let src = img.src;
      if (!src && img.imagen_prompt) src = imageResolutions?.get(img.imagen_prompt)?.src;
      return src;
    })
    .filter((s): s is string => Boolean(s));

  if (srcs.length === 0) return "";

  // Full-bleed mosaic — large edge-to-edge tiles, NO captions, tight seams.
  const cols = Math.min(srcs.length, b.columns || 2);
  const cells = srcs
    .map(
      (src) =>
        `  <img src="${esc(src)}" alt="" loading="lazy" style="width:100%;height:46vh;min-height:300px;object-fit:cover;display:block;margin:0;"/>`
    )
    .join("\n");

  return `<!-- wp:html -->
<div class="riq-gallery alignfull" style="${FULLBLEED}margin-top:80px;margin-bottom:80px;display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;">
${cells}
</div>
<!-- /wp:html -->`;
}

export interface ImageResolution {
  src: string;
  mediaId: number;
}

export function renderBlocks(
  blocks: BlogBlock[],
  imageResolutions?: Map<string, ImageResolution>
): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "hero": return renderHero(b);
        case "section_cover": return renderSectionCover(b);
        case "h2": return renderH2(b);
        case "h3": return renderH3(b);
        case "paragraph": return renderParagraph(b);
        case "stat_callout": return renderStatCallout(b);
        case "comparison_table": return renderComparisonTable(b);
        case "two_column": return renderTwoColumn(b);
        case "three_column": return renderThreeColumn(b);
        case "image": {
          const resolved = imageResolutions?.get(b.imagen_prompt);
          return renderImageBlock(b, resolved?.src, resolved?.mediaId);
        }
        case "chart": return renderChartBlock(b);
        case "cta_button_group": return renderCtaButtonGroup(b);
        case "pull_quote": return renderPullQuote(b);
        case "faq": return renderFaq(b);
        case "cta_banner": return renderCtaBanner(b);
        case "verdict_callout": return renderVerdictCallout(b);
        case "red_flag_callout": return renderRedFlagCallout(b);
        case "talk_track": return renderTalkTrack(b);
        case "gallery": return renderGallery(b, imageResolutions);
        default: return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

// Helper: extract all imagen_prompt strings from image blocks so the publisher
// can resolve them in parallel before render.
export function extractImagenPrompts(blocks: BlogBlock[]): string[] {
  const prompts: string[] = [];
  for (const b of blocks) {
    if (b.type === "image") {
      prompts.push(b.imagen_prompt);
    } else if (b.type === "gallery") {
      for (const img of b.images || []) {
        if (img.imagen_prompt) prompts.push(img.imagen_prompt);
      }
    }
  }
  return prompts;
}

// Build the FAQPage JSON-LD schema from the FAQ block (injected separately into <head>)
export function buildFaqJsonLd(blocks: BlogBlock[]): string | null {
  const faq = blocks.find((b): b is Extract<BlogBlock, { type: "faq" }> => b.type === "faq");
  if (!faq || !faq.items.length) return null;
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

// Build an Article schema for the post itself
export function buildArticleJsonLd(opts: {
  title: string;
  description: string;
  url: string;
  author: "bella" | "gustavo";
  datePublished: string;
  dateModified: string;
}): string {
  const authorName = opts.author === "bella" ? "Bella" : "Gustavo";
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    url: opts.url,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    author: { "@type": "Person", name: authorName },
    publisher: {
      "@type": "Organization",
      name: "RemodelerIQ",
      url: "https://remodeleriq.com",
    },
  };
  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}
