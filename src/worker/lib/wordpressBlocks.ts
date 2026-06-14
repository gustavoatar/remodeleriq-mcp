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
<div class="wp-block-cover riq-hero" style="background-color:#0f172a;min-height:380px">
  <span aria-hidden="true" class="wp-block-cover__background has-background-dim" style="background-color:#0f172a"></span>
  <div class="wp-block-cover__inner-container">
    <!-- wp:heading {"level":1,"textColor":"white"} -->
    <h1 class="has-white-color has-text-color">${esc(b.title)}</h1>
    <!-- /wp:heading -->
    <!-- wp:paragraph {"textColor":"white","fontSize":"large"} -->
    <p class="has-white-color has-text-color has-large-font-size">${esc(b.subtitle)}</p>
    <!-- /wp:paragraph -->
  </div>
</div>
<!-- /wp:cover -->

<!-- wp:paragraph {"className":"riq-snippet","fontSize":"medium"} -->
<p class="riq-snippet has-medium-font-size"><strong>${esc(b.snippet_paragraph)}</strong></p>
<!-- /wp:paragraph -->`;
}

function renderH2(b: Extract<BlogBlock, { type: "h2" }>): string {
  return `<!-- wp:heading {"level":2,"className":"riq-h2"} -->
<h2 class="riq-h2">${esc(b.text)}</h2>
<!-- /wp:heading -->`;
}

function renderH3(b: Extract<BlogBlock, { type: "h3" }>): string {
  return `<!-- wp:heading {"level":3,"className":"riq-h3"} -->
<h3 class="riq-h3">${esc(b.text)}</h3>
<!-- /wp:heading -->`;
}

function renderParagraph(b: Extract<BlogBlock, { type: "paragraph" }>): string {
  return `<!-- wp:paragraph -->
<p>${esc(b.text)}</p>
<!-- /wp:paragraph -->`;
}

function renderStatCallout(b: Extract<BlogBlock, { type: "stat_callout" }>): string {
  const dateSuffix = b.date ? ` (${esc(b.date)})` : "";
  return `<!-- wp:group {"className":"riq-stat-callout","backgroundColor":"emerald","textColor":"white"} -->
<div class="wp-block-group riq-stat-callout has-emerald-background-color has-white-color has-background has-text-color">
  <!-- wp:heading {"level":3,"className":"riq-stat-number","textColor":"white"} -->
  <h3 class="riq-stat-number has-white-color has-text-color">${esc(b.big_number)}</h3>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"className":"riq-stat-label","textColor":"white"} -->
  <p class="riq-stat-label has-white-color has-text-color"><strong>${esc(b.label)}</strong></p>
  <!-- /wp:paragraph -->
  <!-- wp:paragraph {"className":"riq-stat-source","fontSize":"small","textColor":"white"} -->
  <p class="riq-stat-source has-white-color has-text-color has-small-font-size">Source: ${esc(b.source)}${dateSuffix}</p>
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
  return `<!-- wp:pullquote {"className":"riq-pull-quote"} -->
<figure class="wp-block-pullquote riq-pull-quote">
  <blockquote>
    <p>${esc(b.text)}</p>
    <cite>${esc(b.attribution)}</cite>
  </blockquote>
</figure>
<!-- /wp:pullquote -->`;
}

function renderFaq(b: Extract<BlogBlock, { type: "faq" }>): string {
  const items = b.items
    .map((item) => `<!-- wp:heading {"level":3,"className":"riq-faq-q"} -->
<h3 class="riq-faq-q">${esc(item.q)}</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"riq-faq-a"} -->
<p class="riq-faq-a">${esc(item.a)}</p>
<!-- /wp:paragraph -->`)
    .join("\n\n");

  return `<!-- wp:heading {"level":2,"className":"riq-faq-heading"} -->
<h2 class="riq-faq-heading">Frequently Asked Questions</h2>
<!-- /wp:heading -->

<!-- wp:group {"className":"riq-faq-block"} -->
<div class="wp-block-group riq-faq-block">
${items}
</div>
<!-- /wp:group -->`;
}

function renderSectionCover(b: Extract<BlogBlock, { type: "section_cover" }>): string {
  const themes: Record<string, { bg: string; text: string; accent: string }> = {
    dark: { bg: "#0f172a", text: "white", accent: "emerald" },
    emerald: { bg: "#047857", text: "white", accent: "white" },
    amber: { bg: "#92400e", text: "white", accent: "amber" },
  };
  const t = themes[b.theme || "dark"];
  return `<!-- wp:cover {"customOverlayColor":"${t.bg}","minHeight":280,"className":"riq-section-cover"} -->
<div class="wp-block-cover riq-section-cover" style="background-color:${t.bg};min-height:280px;padding:48px 32px;">
  <span aria-hidden="true" class="wp-block-cover__background has-background-dim-0" style="background-color:${t.bg}"></span>
  <div class="wp-block-cover__inner-container">
    <!-- wp:heading {"level":2,"textColor":"${t.text}","className":"riq-section-cover-title"} -->
    <h2 class="riq-section-cover-title has-${t.text}-color has-text-color" style="font-weight:800;letter-spacing:-0.02em;">${esc(b.title)}</h2>
    <!-- /wp:heading -->
    <!-- wp:paragraph {"textColor":"${t.text}","fontSize":"large"} -->
    <p class="has-${t.text}-color has-text-color has-large-font-size" style="line-height:1.55;">${esc(b.body)}</p>
    <!-- /wp:paragraph -->
  </div>
</div>
<!-- /wp:cover -->`;
}

function renderTwoColumn(b: Extract<BlogBlock, { type: "two_column" }>): string {
  const themeBg = (theme: "ok" | "warning" | undefined) =>
    theme === "warning" ? "#fef2f2" : theme === "ok" ? "#ecfdf5" : "#f8fafc";
  const themeBorder = (theme: "ok" | "warning" | undefined) =>
    theme === "warning" ? "#ef4444" : theme === "ok" ? "#10b981" : "#cbd5e1";

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
  <div class="wp-block-column" style="background:#f8fafc;padding:24px;border-radius:8px;text-align:center;">
    ${item.icon_emoji ? `<!-- wp:paragraph {"fontSize":"x-large"} --><p class="has-x-large-font-size" style="font-size:48px;margin:0 0 8px;">${esc(item.icon_emoji)}</p><!-- /wp:paragraph -->` : ""}
    <!-- wp:heading {"level":3,"className":"riq-col-heading"} -->
    <h3 class="riq-col-heading" style="margin-top:0;font-weight:700;font-size:1.2rem;">${esc(item.heading)}</h3>
    <!-- /wp:heading -->
    <!-- wp:paragraph -->
    <p>${esc(item.body)}</p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:column -->`
    )
    .join("\n");
  return `<!-- wp:columns {"className":"riq-three-column"} -->
<div class="wp-block-columns riq-three-column">
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

function renderCtaButtonGroup(b: Extract<BlogBlock, { type: "cta_button_group" }>): string {
  const buttons = b.buttons
    .map(
      (btn) => `  <!-- wp:button {"className":"riq-cta-btn-${btn.style || "primary"}"} -->
  <div class="wp-block-button riq-cta-btn-${btn.style || "primary"}">
    <a class="wp-block-button__link" href="${esc(btn.url)}" style="${btn.style === "secondary" ? "background:transparent;border:2px solid #10b981;color:#10b981;" : "background:#10b981;color:white;"}padding:14px 32px;border-radius:8px;font-weight:600;text-decoration:none;">${esc(btn.label)}</a>
  </div>
  <!-- /wp:button -->`
    )
    .join("\n");

  return `${b.heading ? `<!-- wp:heading {"level":3,"className":"riq-cta-group-heading"} -->
<h3 class="riq-cta-group-heading" style="text-align:center;margin-top:32px;">${esc(b.heading)}</h3>
<!-- /wp:heading -->\n\n` : ""}<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"className":"riq-cta-group"} -->
<div class="wp-block-buttons riq-cta-group" style="justify-content:center;gap:12px;margin:24px 0;">
${buttons}
</div>
<!-- /wp:buttons -->`;
}

function renderCtaBanner(b: Extract<BlogBlock, { type: "cta_banner" }>): string {
  return `<!-- wp:group {"className":"riq-cta-banner","backgroundColor":"emerald","textColor":"white","layout":{"type":"constrained"}} -->
<div class="wp-block-group riq-cta-banner has-emerald-background-color has-white-color has-background has-text-color">
  <!-- wp:paragraph {"textColor":"white","fontSize":"large"} -->
  <p class="has-white-color has-text-color has-large-font-size"><strong>${esc(b.text)}</strong></p>
  <!-- /wp:paragraph -->
  <!-- wp:buttons -->
  <div class="wp-block-buttons">
    <!-- wp:button {"backgroundColor":"white","textColor":"emerald","className":"riq-cta-button"} -->
    <div class="wp-block-button riq-cta-button">
      <a class="wp-block-button__link has-emerald-color has-white-background-color has-text-color has-background" href="${esc(b.button_url)}">${esc(b.button_label)}</a>
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
  const authorName = opts.author === "bella" ? "Bella" : "Gustavo Atar";
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
