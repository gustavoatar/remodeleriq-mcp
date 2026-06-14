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
  | { type: "section_cover"; title: string; body: string; theme?: "dark" | "emerald" | "amber" }
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
    };

function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
<div class="wp-block-cover riq-hero" style="background-color:#0f172a;min-height:380px;padding:56px 32px;">
  <span aria-hidden="true" class="wp-block-cover__background has-background-dim-0" style="background-color:#0f172a"></span>
  <div class="wp-block-cover__inner-container">
    <!-- wp:heading {"level":1,"textColor":"white","className":"riq-hero-title"} -->
    <h1 class="riq-hero-title has-white-color has-text-color" style="color:#ffffff;font-size:3rem;font-weight:800;letter-spacing:-0.025em;line-height:1.1;margin:0 0 16px;">${esc(b.title)}</h1>
    <!-- /wp:heading -->
    <!-- wp:paragraph {"textColor":"white","className":"riq-hero-subtitle"} -->
    <p class="riq-hero-subtitle has-white-color has-text-color" style="color:#e2e8f0;font-size:1.25rem;line-height:1.5;margin:0;">${esc(b.subtitle)}</p>
    <!-- /wp:paragraph -->
  </div>
</div>
<!-- /wp:cover -->

<!-- wp:paragraph {"className":"riq-snippet"} -->
<p class="riq-snippet" style="font-size:1.2rem;line-height:1.8;color:#0f172a;margin:56px 0 40px;font-weight:400;"><span class="riq-dropcap-letter">${esc(firstLetter)}</span><span class="riq-dropcap-word-tail">${esc(firstWordTail)}</span>${esc(rest)}</p>
<!-- /wp:paragraph -->`;
}

function renderH2(b: Extract<BlogBlock, { type: "h2" }>): string {
  return `<!-- wp:heading {"level":2,"className":"riq-h2"} -->
<h2 class="riq-h2" style="font-size:2rem;font-weight:800;color:#0f172a;letter-spacing:-0.02em;margin:48px 0 16px;line-height:1.2;">${esc(b.text)}</h2>
<!-- /wp:heading -->`;
}

function renderH3(b: Extract<BlogBlock, { type: "h3" }>): string {
  return `<!-- wp:heading {"level":3,"className":"riq-h3"} -->
<h3 class="riq-h3" style="font-size:1.4rem;font-weight:700;color:#0f172a;margin:32px 0 12px;line-height:1.3;">${esc(b.text)}</h3>
<!-- /wp:heading -->`;
}

function renderParagraph(b: Extract<BlogBlock, { type: "paragraph" }>): string {
  return `<!-- wp:paragraph -->
<p style="font-size:1.05rem;line-height:1.7;color:#1e293b;margin:0 0 18px;">${esc(b.text)}</p>
<!-- /wp:paragraph -->`;
}

function renderStatCallout(b: Extract<BlogBlock, { type: "stat_callout" }>): string {
  const dateSuffix = b.date ? ` (${esc(b.date)})` : "";
  return `<!-- wp:group {"className":"riq-stat-callout"} -->
<div class="wp-block-group riq-stat-callout" style="background-color:#1F9C4C;color:#ffffff;padding:32px 28px;border-radius:12px;margin:32px 0;text-align:center;">
  <!-- wp:heading {"level":3,"className":"riq-stat-number"} -->
  <h3 class="riq-stat-number" style="color:#ffffff;font-size:3rem;font-weight:800;letter-spacing:-0.02em;line-height:1;margin:0 0 8px;">${esc(b.big_number)}</h3>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"className":"riq-stat-label"} -->
  <p class="riq-stat-label" style="color:#ffffff;font-size:1.05rem;font-weight:600;margin:0 0 6px;line-height:1.4;">${esc(b.label)}</p>
  <!-- /wp:paragraph -->
  <!-- wp:paragraph {"className":"riq-stat-source"} -->
  <p class="riq-stat-source" style="color:#d1fae5;font-size:0.8rem;margin:0;font-style:italic;">Source: ${esc(b.source)}${dateSuffix}</p>
  <!-- /wp:paragraph -->
</div>
<!-- /wp:group -->`;
}

function renderComparisonTable(b: Extract<BlogBlock, { type: "comparison_table" }>): string {
  const headerCellStyle = "padding:14px 16px;text-align:left;font-family:'Inter',sans-serif;font-size:0.78rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#ffffff;background:#1F9C4C;border:none;";
  const bodyCellStyle = "padding:14px 16px;text-align:left;font-family:'Inter',sans-serif;font-size:0.98rem;font-weight:400;color:#1e293b;line-height:1.5;border-bottom:1px solid #e2e8f0;vertical-align:top;";
  const firstColStyle = "font-weight:700;color:#0f172a;";

  const headers = b.headers.map((h) => `<th style="${headerCellStyle}">${esc(h)}</th>`).join("");
  const body = (b.rows || [])
    .map((row, rowIdx) => {
      const zebra = rowIdx % 2 === 1 ? "background:#f8fafc;" : "background:#ffffff;";
      const cells = row.map((c, colIdx) => {
        const extra = colIdx === 0 ? firstColStyle : "";
        return `<td style="${bodyCellStyle}${extra}">${esc(c)}</td>`;
      }).join("");
      return `      <tr style="${zebra}">${cells}</tr>`;
    })
    .join("\n");

  return `<!-- wp:html -->
<figure class="wp-block-table riq-comparison-table" style="margin:32px 0;overflow:hidden;border-radius:10px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(15,23,42,0.04);">
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
  <p style="font-family:'Fraunces','Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:2.1rem;font-weight:600;color:#0f172a;line-height:1.25;margin:0;letter-spacing:-0.02em;font-style:normal;padding-left:8px;border-left:4px solid #1F9C4C;padding:0 0 0 24px;">${esc(b.text)}</p>
</blockquote>
<!-- /wp:quote -->`;
}

function renderFaq(b: Extract<BlogBlock, { type: "faq" }>): string {
  const items = b.items
    .map((item) => `<!-- wp:heading {"level":3,"className":"riq-faq-q"} -->
<h3 class="riq-faq-q" style="font-size:1.2rem;font-weight:700;color:#0f172a;margin:24px 0 8px;line-height:1.35;">${esc(item.q)}</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"riq-faq-a"} -->
<p class="riq-faq-a" style="font-size:1rem;line-height:1.65;color:#334155;margin:0 0 12px;">${esc(item.a)}</p>
<!-- /wp:paragraph -->`)
    .join("\n\n");

  return `<!-- wp:heading {"level":2,"className":"riq-faq-heading"} -->
<h2 class="riq-faq-heading" style="font-size:2rem;font-weight:800;color:#0f172a;margin:48px 0 16px;letter-spacing:-0.02em;">Frequently Asked Questions</h2>
<!-- /wp:heading -->

<!-- wp:group {"className":"riq-faq-block"} -->
<div class="wp-block-group riq-faq-block" style="background:#f8fafc;padding:32px;border-radius:12px;margin:16px 0 32px;">
${items}
</div>
<!-- /wp:group -->`;
}

function renderSectionCover(b: Extract<BlogBlock, { type: "section_cover" }>): string {
  // Themes use explicit inline backgrounds and #ffffff text (NOT theme color
  // presets) so we don't depend on the WP theme defining "emerald" etc.
  const themes: Record<string, { bg: string }> = {
    dark: { bg: "#0f172a" },
    emerald: { bg: "#1F9C4C" }, // brand green
    amber: { bg: "#b45309" },
  };
  const t = themes[b.theme || "dark"];
  return `<!-- wp:cover {"customOverlayColor":"${t.bg}","minHeight":260,"className":"riq-section-cover"} -->
<div class="wp-block-cover riq-section-cover" style="background-color:${t.bg};min-height:260px;padding:48px 32px;margin:40px 0;border-radius:12px;overflow:hidden;">
  <span aria-hidden="true" class="wp-block-cover__background has-background-dim-0" style="background-color:${t.bg}"></span>
  <div class="wp-block-cover__inner-container">
    <!-- wp:heading {"level":2,"className":"riq-section-cover-title"} -->
    <h2 class="riq-section-cover-title" style="color:#ffffff;font-size:2rem;font-weight:800;letter-spacing:-0.02em;line-height:1.2;margin:0 0 14px;">${esc(b.title)}</h2>
    <!-- /wp:heading -->
    <!-- wp:paragraph {"className":"riq-section-cover-body"} -->
    <p class="riq-section-cover-body" style="color:#e2e8f0;font-size:1.1rem;line-height:1.55;margin:0;">${esc(b.body)}</p>
    <!-- /wp:paragraph -->
  </div>
</div>
<!-- /wp:cover -->`;
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
    <ul style="padding-left:20px;margin:0;font-size:0.98rem;line-height:1.6;color:#1e293b;">${side.items.map((it) => `<li style="margin-bottom:8px;">${esc(it)}</li>`).join("")}</ul>
    <!-- /wp:list -->`
      : `<!-- wp:paragraph -->
    <p style="font-size:1rem;line-height:1.6;color:#1e293b;margin:0;">${esc(side.text)}</p>
    <!-- /wp:paragraph -->`;
    return `  <!-- wp:column -->
  <div class="wp-block-column" style="background:${themeBg(theme)};border-left:4px solid ${themeBorder(theme)};padding:24px;border-radius:0 8px 8px 0;">
    <!-- wp:heading {"level":3,"className":"riq-col-heading"} -->
    <h3 class="riq-col-heading" style="margin:0 0 14px;font-weight:700;font-size:1.25rem;color:#0f172a;letter-spacing:-0.01em;">${esc(heading)}</h3>
    <!-- /wp:heading -->
    ${bodyOrList}
  </div>
  <!-- /wp:column -->`;
  };

  return `<!-- wp:columns {"className":"riq-two-column"} -->
<div class="wp-block-columns riq-two-column" style="gap:16px;margin:32px 0;">
${renderSide(b.left_heading, left, b.left_theme)}

${renderSide(b.right_heading, right, b.right_theme)}
</div>
<!-- /wp:columns -->`;
}

function renderThreeColumn(b: Extract<BlogBlock, { type: "three_column" }>): string {
  const cols = b.items
    .map(
      (item) => `  <!-- wp:column -->
  <div class="wp-block-column" style="background:#f8fafc;padding:28px 20px;border-radius:10px;text-align:center;border:1px solid #e2e8f0;">
    ${item.icon_emoji ? `<!-- wp:paragraph {"className":"riq-col-icon"} --><p class="riq-col-icon" style="font-size:1.75rem;line-height:1;margin:0 auto 14px;width:52px;height:52px;display:flex;align-items:center;justify-content:center;background:#ffffff;border:1px solid #d1fae5;border-radius:50%;">${esc(item.icon_emoji)}</p><!-- /wp:paragraph -->` : ""}
    <!-- wp:heading {"level":3,"className":"riq-col-heading"} -->
    <h3 class="riq-col-heading" style="margin:0 0 8px;font-weight:700;font-size:1.05rem;color:#0f172a;letter-spacing:-0.01em;">${esc(item.heading)}</h3>
    <!-- /wp:heading -->
    <!-- wp:paragraph -->
    <p style="font-size:0.95rem;line-height:1.55;color:#475569;margin:0;">${esc(item.body)}</p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:column -->`
    )
    .join("\n");
  return `<!-- wp:columns {"className":"riq-three-column"} -->
<div class="wp-block-columns riq-three-column" style="gap:16px;margin:32px 0;">
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
  // Metadata-style caption block — kicker rendered as small all-caps brand-green
  // label, caption text below in tight small-caps slate. Mirrors the
  // editorial "LOCATION — COORDINATES" treatment.
  const renderMetaBlock = (extraStyle: string = "") => `
    <div class="riq-image-meta" style="display:flex;align-items:baseline;gap:14px;border-top:1px solid #e2e8f0;padding-top:10px;margin-top:14px;${extraStyle}">
      ${b.kicker ? `<span style="font-family:'Inter',sans-serif;font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#1F9C4C;flex-shrink:0;">${esc(b.kicker)}</span>` : ""}
      <span class="riq-magazine-caption" style="font-family:'Inter',sans-serif;font-size:0.78rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#475569;margin:0;line-height:1.4;">${esc(b.caption)}</span>
    </div>`;

  // Body-side magazine layout — 55/45 tight pairing. Image gets dramatic
  // dark border-radius, body sits in serif italic with tight measure.
  if (b.body && b.body.trim().length > 0 && resolvedSrc) {
    return `<!-- wp:columns {"className":"riq-image-magazine","verticalAlignment":"top"} -->
<div class="wp-block-columns riq-image-magazine" style="gap:40px;margin:56px 0;align-items:flex-start;">
  <!-- wp:column {"width":"55%"} -->
  <div class="wp-block-column" style="flex-basis:55%;">
    <figure class="wp-block-image" style="margin:0;">
      <img src="${esc(resolvedSrc)}" alt="${esc(b.alt)}" style="width:100%;height:auto;display:block;border-radius:6px;box-shadow:0 12px 40px rgba(15,23,42,0.18);"${resolvedMediaId ? ` class="wp-image-${resolvedMediaId}"` : ""}/>
    </figure>
    ${renderMetaBlock()}
  </div>
  <!-- /wp:column -->
  <!-- wp:column {"width":"45%"} -->
  <div class="wp-block-column" style="flex-basis:45%;padding-top:16px;">
    <p style="font-family:'Fraunces','Cormorant Garamond',Georgia,serif;font-size:1.5rem;line-height:1.4;color:#0f172a;font-style:normal;font-weight:500;margin:0;letter-spacing:-0.01em;">${esc(b.body)}</p>
  </div>
  <!-- /wp:column -->
</div>
<!-- /wp:columns -->`;
  }

  // Standalone image — large dramatic with caption metadata block below
  if (!resolvedSrc) {
    return `<!-- wp:html -->
<figure style="margin:56px 0;">
  <!-- IMAGE_PLACEHOLDER: ${esc(b.imagen_prompt)} -->
  ${renderMetaBlock()}
</figure>
<!-- /wp:html -->`;
  }

  return `<!-- wp:image {"id":${resolvedMediaId || 0},"sizeSlug":"large","className":"riq-magazine-image"} -->
<figure class="wp-block-image size-large riq-magazine-image" style="margin:56px 0;">
  <img src="${esc(resolvedSrc)}" alt="${esc(b.alt)}" style="width:100%;height:auto;display:block;border-radius:6px;box-shadow:0 12px 40px rgba(15,23,42,0.18);"${resolvedMediaId ? ` class="wp-image-${resolvedMediaId}"` : ""}/>
  ${renderMetaBlock()}
</figure>
<!-- /wp:image -->`;
}

function renderChartBlock(b: Extract<BlogBlock, { type: "chart" }>): string {
  let svg = "";
  if (b.chart_type === "bar") svg = renderBarChartSvg(b.data as BarChartData);
  else if (b.chart_type === "comparison_bars") svg = renderComparisonBarsSvg(b.data as ComparisonBarsData);
  else if (b.chart_type === "donut") svg = renderDonutSvg(b.data as DonutData);
  if (!svg) return "";

  // Wrap in a WP HTML block so Gutenberg leaves the SVG alone
  return `<!-- wp:html -->
<div class="riq-chart-wrap" style="margin:32px 0;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
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
    <a class="wp-block-button__link" href="${esc(url)}" style="${buttonStyles}">${esc(btn.label)}</a>
  </div>
  <!-- /wp:button -->`;
      }
    )
    .join("\n");

  return `${b.heading ? `<!-- wp:heading {"level":3,"className":"riq-cta-group-heading"} -->
<h3 class="riq-cta-group-heading" style="text-align:center;margin:40px 0 16px;font-size:1.4rem;font-weight:700;color:#0f172a;">${esc(b.heading)}</h3>
<!-- /wp:heading -->\n\n` : ""}<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"className":"riq-cta-group"} -->
<div class="wp-block-buttons riq-cta-group" style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:16px 0 32px;">
${buttons}
</div>
<!-- /wp:buttons -->`;
}

function renderCtaBanner(b: Extract<BlogBlock, { type: "cta_banner" }>): string {
  const url = sanitizeUrl(b.button_url);
  // Body text supports {brand} placeholder — renders as bold underlined inline link to RemodelerIQ
  const bodyText = (b.text || "").replace(
    /\{brand\}/g,
    `<a href="https://remodeleriq.com" style="color:#1F9C4C;font-weight:700;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px;">RemodelerIQ</a>`
  );
  const kicker = b.kicker || "DATA BEATS GUT FEELINGS";
  const headline = b.headline || "Negotiate Like a Pro.";

  return `<!-- wp:group {"className":"riq-cta-banner"} -->
<div class="wp-block-group riq-cta-banner" style="background:#ffffff;padding:64px 32px 72px;margin:64px 0 32px;text-align:center;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
  <!-- wp:html -->
  <span class="riq-cta-kicker" style="display:inline-block;background:#dcfce7;color:#1F9C4C;font-family:'Inter',sans-serif;font-size:0.78rem;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;padding:8px 22px;border-radius:999px;margin-bottom:24px;">${esc(kicker)}</span>
  <!-- /wp:html -->

  <!-- wp:heading {"level":2,"className":"riq-cta-headline"} -->
  <h2 class="riq-cta-headline" style="font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:3.5rem;font-weight:900;color:#0f172a;letter-spacing:-0.035em;line-height:1.05;margin:0 auto 24px;max-width:780px;">${esc(headline)}</h2>
  <!-- /wp:heading -->

  <!-- wp:paragraph {"className":"riq-cta-body"} -->
  <p class="riq-cta-body" style="font-family:'Inter',sans-serif;font-size:1.2rem;line-height:1.55;color:#475569;margin:0 auto 40px;max-width:680px;font-weight:400;">${bodyText}</p>
  <!-- /wp:paragraph -->

  <!-- wp:html -->
  <p style="margin:0;"><a href="${esc(url)}" class="riq-cta-mega-btn" style="display:inline-flex;align-items:center;gap:14px;background:#1F9C4C;color:#ffffff;padding:22px 44px;border-radius:999px;font-family:'Inter',sans-serif;font-weight:800;font-size:1.05rem;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;box-shadow:0 6px 16px rgba(31,156,76,0.25);transition:transform 0.15s ease;">${esc(b.button_label)} <span style="display:inline-block;font-size:1.3rem;font-weight:400;">&rarr;</span></a></p>
  <!-- /wp:html -->
</div>
<!-- /wp:group -->`;
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
        default: return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

// Helper: extract all imagen_prompt strings from image blocks so the publisher
// can resolve them in parallel before render.
export function extractImagenPrompts(blocks: BlogBlock[]): string[] {
  return blocks
    .filter((b): b is Extract<BlogBlock, { type: "image" }> => b.type === "image")
    .map((b) => b.imagen_prompt);
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
