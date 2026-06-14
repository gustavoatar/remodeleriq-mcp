// Phase 7C — Gutenberg block renderer
// Takes the structured blocks array from blogDrafter and produces WordPress-ready
// Gutenberg block markup (HTML comments + inner HTML).
//
// Visual style: core blocks with class names. Tweak appearance later by adding
// CSS rules in the WP theme for these class names without re-rendering posts.

export type BlogBlock =
  | { type: "hero"; title: string; subtitle: string; snippet_paragraph: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "stat_callout"; big_number: string; label: string; source: string; date?: string }
  | { type: "comparison_table"; headers: string[]; rows: string[][] }
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

export function renderBlocks(blocks: BlogBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "hero": return renderHero(b);
        case "h2": return renderH2(b);
        case "h3": return renderH3(b);
        case "paragraph": return renderParagraph(b);
        case "stat_callout": return renderStatCallout(b);
        case "comparison_table": return renderComparisonTable(b);
        case "pull_quote": return renderPullQuote(b);
        case "faq": return renderFaq(b);
        case "cta_banner": return renderCtaBanner(b);
        default: return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
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
