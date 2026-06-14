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
      right_heading: string;
      right_body: string;
      left_theme?: "ok" | "warning";
      right_theme?: "ok" | "warning";
    }
  | { type: "three_column"; items: { heading: string; body: string; icon_emoji?: string }[] }
  | {
      type: "image";
      imagen_prompt: string;
      caption: string;
      alt: string;
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
  | { type: "cta_banner"; text: string; button_label: string; button_url: string };

function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderHero(b: Extract<BlogBlock, { type: "hero" }>): string {
  return `<!-- wp:cover {"customOverlayColor":"#0f172a","minHeight":380,"className":"riq-hero"} -->
<div class="wp-block-cover riq-hero" style="background-color:#0f172a;min-height:380px;padding:48px 32px;">
  <span aria-hidden="true" class="wp-block-cover__background has-background-dim-0" style="background-color:#0f172a"></span>
  <div class="wp-block-cover__inner-container">
    <!-- wp:heading {"level":1,"textColor":"white","className":"riq-hero-title"} -->
    <h1 class="riq-hero-title has-white-color has-text-color" style="color:#ffffff;font-size:2.75rem;font-weight:800;letter-spacing:-0.025em;line-height:1.15;margin:0 0 16px;">${esc(b.title)}</h1>
    <!-- /wp:heading -->
    <!-- wp:paragraph {"textColor":"white","className":"riq-hero-subtitle"} -->
    <p class="riq-hero-subtitle has-white-color has-text-color" style="color:#e2e8f0;font-size:1.25rem;line-height:1.5;margin:0;">${esc(b.subtitle)}</p>
    <!-- /wp:paragraph -->
  </div>
</div>
<!-- /wp:cover -->

<!-- wp:paragraph {"className":"riq-snippet","style":{"typography":{"firstLetter":true}}} -->
<p class="riq-snippet" style="font-size:1.2rem;line-height:1.7;color:#0f172a;margin:32px 0;font-weight:500;"><span style="float:left;font-size:5rem;line-height:0.85;font-weight:800;color:#1F9C4C;padding:6px 12px 0 0;font-family:Georgia,serif;">${esc(b.snippet_paragraph.charAt(0))}</span>${esc(b.snippet_paragraph.slice(1))}</p>
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
  const headers = b.headers.map((h) => `<th>${esc(h)}</th>`).join("");
  const body = b.rows
    .map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
    .join("\n");
  return `<!-- wp:table {"hasFixedLayout":true,"className":"riq-comparison-table"} -->
<figure class="wp-block-table riq-comparison-table">
  <table>
    <thead><tr>${headers}</tr></thead>
    <tbody>
${body}
    </tbody>
  </table>
</figure>
<!-- /wp:table -->`;
}

function renderPullQuote(b: Extract<BlogBlock, { type: "pull_quote" }>): string {
  // Use wp:quote (not wp:pullquote) — themes apply cursive/script fonts to pullquote
  // by default. wp:quote with explicit inline styling stays clean serif.
  return `<!-- wp:quote {"className":"riq-pull-quote"} -->
<blockquote class="wp-block-quote riq-pull-quote" style="border-left:4px solid #1F9C4C;background:#f8fafc;padding:24px 28px;margin:32px 0;border-radius:0 8px 8px 0;font-style:normal;">
  <p style="font-size:1.35rem;font-weight:600;color:#0f172a;line-height:1.4;margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;">"${esc(b.text)}"</p>
  <cite style="font-size:0.95rem;color:#475569;font-style:normal;font-weight:500;">— ${esc(b.attribution)}</cite>
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

function renderTwoColumn(b: Extract<BlogBlock, { type: "two_column" }>): string {
  const themeBg = (theme: "ok" | "warning" | undefined) =>
    theme === "warning" ? "#fef2f2" : theme === "ok" ? "#ecfdf5" : "#f8fafc";
  const themeBorder = (theme: "ok" | "warning" | undefined) =>
    theme === "warning" ? "#dc2626" : theme === "ok" ? "#1F9C4C" : "#cbd5e1";

  return `<!-- wp:columns {"className":"riq-two-column"} -->
<div class="wp-block-columns riq-two-column">
  <!-- wp:column -->
  <div class="wp-block-column" style="background:${themeBg(b.left_theme)};border-left:4px solid ${themeBorder(b.left_theme)};padding:24px;border-radius:8px;">
    <!-- wp:heading {"level":3,"className":"riq-col-heading"} -->
    <h3 class="riq-col-heading" style="margin-top:0;font-weight:700;">${esc(b.left_heading)}</h3>
    <!-- /wp:heading -->
    <!-- wp:paragraph -->
    <p>${esc(b.left_body)}</p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:column -->

  <!-- wp:column -->
  <div class="wp-block-column" style="background:${themeBg(b.right_theme)};border-left:4px solid ${themeBorder(b.right_theme)};padding:24px;border-radius:8px;">
    <!-- wp:heading {"level":3,"className":"riq-col-heading"} -->
    <h3 class="riq-col-heading" style="margin-top:0;font-weight:700;">${esc(b.right_heading)}</h3>
    <!-- /wp:heading -->
    <!-- wp:paragraph -->
    <p>${esc(b.right_body)}</p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:column -->
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

// Renders an <img> with an Imagen-generated URL. The URL is filled in by the publisher
// AFTER the image is generated + uploaded to WP media library. Until then the alt
// + caption render but the src is a placeholder data attribute the publisher swaps.
function renderImageBlock(
  b: Extract<BlogBlock, { type: "image" }>,
  resolvedSrc?: string,
  resolvedMediaId?: number
): string {
  if (!resolvedSrc) {
    // Placeholder for the publisher to replace post-upload
    return `<!-- wp:image {"className":"riq-inline-image","data-imagen-prompt":"${esc(b.imagen_prompt)}"} -->
<figure class="wp-block-image riq-inline-image" data-imagen-prompt="${esc(b.imagen_prompt)}">
  <!-- IMAGE_PLACEHOLDER: ${esc(b.imagen_prompt)} -->
  <figcaption><em>${esc(b.caption)}</em></figcaption>
</figure>
<!-- /wp:image -->`;
  }
  return `<!-- wp:image {"id":${resolvedMediaId || 0},"sizeSlug":"large","className":"riq-inline-image"} -->
<figure class="wp-block-image size-large riq-inline-image">
  <img src="${esc(resolvedSrc)}" alt="${esc(b.alt)}"${resolvedMediaId ? ` class="wp-image-${resolvedMediaId}"` : ""}/>
  <figcaption><em>${esc(b.caption)}</em></figcaption>
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
  return `<!-- wp:group {"className":"riq-cta-banner"} -->
<div class="wp-block-group riq-cta-banner" style="background-color:#1F9C4C;color:#ffffff;padding:40px 32px;border-radius:12px;margin:40px 0;text-align:center;">
  <!-- wp:paragraph {"className":"riq-cta-banner-text"} -->
  <p class="riq-cta-banner-text" style="color:#ffffff;font-size:1.35rem;font-weight:700;line-height:1.4;margin:0 0 20px;">${esc(b.text)}</p>
  <!-- /wp:paragraph -->
  <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-buttons" style="display:flex;justify-content:center;">
    <!-- wp:button {"className":"riq-cta-button"} -->
    <div class="wp-block-button riq-cta-button">
      <a class="wp-block-button__link" href="${esc(url)}" style="background:#ffffff;color:#1F9C4C;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;display:inline-block;">${esc(b.button_label)}</a>
    </div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->
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
