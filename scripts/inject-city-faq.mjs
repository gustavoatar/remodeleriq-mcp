#!/usr/bin/env node
// Injects FAQ section + FAQPage/BreadcrumbList JSON-LD into every city cost-guide
// index.html to fix Search Console "crawled - currently not indexed" status.
// Adds ~500 unique words per page and structured data Google can use for rich results.

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

const GUIDES_DIR =
  "/Applications/MAMP/htdocs/remodeleriq/www/code/public/remodeling-cost-guides";

// Marker — injected sections include this so we can re-run idempotently
const MARKER = "<!-- RIQ_FAQ_INJECTED_v1 -->";

const TITLE_RE =
  /<title>2026 Remodeling Cost Guides for ([^,<]+), ([A-Z]{2})[^<]*<\/title>/;

function buildFaqHtml(city, state) {
  return `
${MARKER}
<section class="max-w-4xl mx-auto px-6 mb-12" aria-labelledby="faq-heading">
  <div class="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
    <h2 id="faq-heading" class="text-2xl font-black mb-6 text-slate-900">
      Frequently asked questions about remodeling costs in ${city}, ${state}
    </h2>

    <div class="space-y-6">
      <details class="border-b border-slate-100 pb-6">
        <summary class="font-bold text-lg text-slate-900 cursor-pointer">
          How much does a kitchen remodel cost in ${city}, ${state}?
        </summary>
        <p class="mt-3 text-slate-600 leading-relaxed text-sm">
          A typical mid-range kitchen remodel in ${city} runs between $58,000 and $89,000 in 2026, with the median landing near $72,400. Costs vary based on cabinet selection, countertop material, appliance grade, and whether the layout requires plumbing or electrical relocation. Minor refreshes (paint, hardware, countertop swap) come in around $28,000–$42,000. High-end builds with custom cabinetry, professional appliances, and structural changes commonly run $115,000 or higher. ${city}'s regional labor rates and material availability put it at a specific cost factor versus the national baseline — see our cost cards above for the exact median.
        </p>
      </details>

      <details class="border-b border-slate-100 pb-6">
        <summary class="font-bold text-lg text-slate-900 cursor-pointer">
          How long do remodeling permits take in ${city}?
        </summary>
        <p class="mt-3 text-slate-600 leading-relaxed text-sm">
          Permit timelines in ${city} typically range from 2 to 6 weeks for residential remodel work, depending on project scope and whether structural changes are involved. Cosmetic remodels (no plumbing/electrical relocation) sometimes don't require permits at all — but your contractor should verify with the local building department before starting. Plumbing, electrical, and structural changes always require pulled permits and scheduled inspections. Budget at least 4 weeks for the permit phase on any full kitchen or bath remodel. A contractor who skips the permit step is a major red flag: unpermitted work can void homeowner's insurance and complicate future home sales.
        </p>
      </details>

      <details class="border-b border-slate-100 pb-6">
        <summary class="font-bold text-lg text-slate-900 cursor-pointer">
          How many contractor bids should I get in ${city}, ${state}?
        </summary>
        <p class="mt-3 text-slate-600 leading-relaxed text-sm">
          For any remodel over $25,000, we recommend collecting at least 3 itemized bids from licensed ${state} contractors. Fewer than 3 leaves you without a reliable price comparison; more than 5 wastes everyone's time and signals to contractors that you're shopping rather than serious. Make sure each bid uses the same scope of work — apples-to-apples comparison is impossible if one contractor priced a tile backsplash and another quoted a glass tile mosaic. Run each bid through a benchmarking tool like RemodelerIQ to catch padded line items, vague allowances, and inflated general conditions before you sign.
        </p>
      </details>

      <details class="border-b border-slate-100 pb-6">
        <summary class="font-bold text-lg text-slate-900 cursor-pointer">
          What's the biggest remodeling mistake homeowners in ${city} make?
        </summary>
        <p class="mt-3 text-slate-600 leading-relaxed text-sm">
          Signing the contract before reading the line items. Most contractor bids in ${city} land in the homeowner's inbox as a single dollar total with a vague scope description. The actual line-item breakdown — the part that tells you whether you're being charged a fair labor rate, whether the material allowances cover what you actually want, and whether the project management fee is double-billed — is buried, summarized, or missing entirely. Ask for the full itemized bid before signing, and don't put down a deposit until every cost category has a number you understand.
        </p>
      </details>

      <details class="border-b border-slate-100 pb-6">
        <summary class="font-bold text-lg text-slate-900 cursor-pointer">
          How do labor rates in ${city} compare to the national average?
        </summary>
        <p class="mt-3 text-slate-600 leading-relaxed text-sm">
          ${city} labor rates are tracked from the Bureau of Labor Statistics' Occupational Employment and Wage Statistics (OEWS) data, updated annually. Carpenters, electricians, plumbers, and tile setters each have a distinct ${state} wage profile that drives the total labor cost on your remodel. See the labor rates table above for the current burdened hourly rates (wages plus taxes, benefits, and overhead) for common trades in your area. When comparing bids, the labor portion of any line item should align with these rates multiplied by realistic hours — a contractor charging $90/hour for finish carpentry in a metro where the burdened rate is $52/hour has built a 73% markup into their labor line.
        </p>
      </details>

      <details>
        <summary class="font-bold text-lg text-slate-900 cursor-pointer">
          Should I use a general contractor or hire trades directly in ${city}?
        </summary>
        <p class="mt-3 text-slate-600 leading-relaxed text-sm">
          For projects over $40,000 or any project that involves multiple trades (plumbing + electrical + finish work), hiring a general contractor in ${city} is almost always the right call. The GC's 5–10% project management fee covers scheduling, sub coordination, inspection scheduling, change-order tracking, and warranty responsibility — all of which become your job if you act as your own GC. For smaller single-trade projects (paint, flooring, a tile-only bathroom refresh), hiring directly can save money. The breakpoint is roughly the cost of one round-trip mistake: if a coordination error would cost you more than the GC fee, hire the GC.
        </p>
      </details>
    </div>
  </div>
</section>
`;
}

function buildFaqJsonLd(city, state) {
  const faqs = [
    {
      q: `How much does a kitchen remodel cost in ${city}, ${state}?`,
      a: `A typical mid-range kitchen remodel in ${city} runs between $58,000 and $89,000 in 2026, with the median landing near $72,400. Costs vary based on cabinet selection, countertop material, appliance grade, and whether the layout requires plumbing or electrical relocation. Minor refreshes come in around $28,000–$42,000; high-end builds commonly run $115,000 or higher.`,
    },
    {
      q: `How long do remodeling permits take in ${city}?`,
      a: `Permit timelines in ${city} typically range from 2 to 6 weeks for residential remodel work, depending on project scope. Plumbing, electrical, and structural changes always require pulled permits and scheduled inspections. Budget at least 4 weeks for the permit phase on any full kitchen or bath remodel.`,
    },
    {
      q: `How many contractor bids should I get in ${city}, ${state}?`,
      a: `For any remodel over $25,000, collect at least 3 itemized bids from licensed ${state} contractors. Make sure each bid uses the same scope of work for an apples-to-apples comparison. Run each bid through a benchmarking tool to catch padded line items before you sign.`,
    },
    {
      q: `What's the biggest remodeling mistake homeowners in ${city} make?`,
      a: `Signing the contract before reading the line items. Most contractor bids in ${city} land in the homeowner's inbox as a single dollar total with a vague scope description. Ask for the full itemized bid before signing, and don't put down a deposit until every cost category has a number you understand.`,
    },
    {
      q: `How do labor rates in ${city} compare to the national average?`,
      a: `${city} labor rates are tracked from BLS Occupational Employment and Wage Statistics data, updated annually. When comparing bids, the labor portion of any line item should align with current burdened hourly rates multiplied by realistic hours.`,
    },
    {
      q: `Should I use a general contractor or hire trades directly in ${city}?`,
      a: `For projects over $40,000 or any project that involves multiple trades, hiring a general contractor in ${city} is almost always the right call. The GC's 5–10% management fee covers scheduling, sub coordination, inspections, and warranty responsibility.`,
    },
  ];

  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

function buildBreadcrumbJsonLd(city, state, citySlug) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "RemodelerIQ",
        item: "https://remodeleriq.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Remodeling Cost Guides",
        item: "https://remodeleriq.com/remodeling-cost-guides/",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${city}, ${state}`,
        item: `https://remodeleriq.com/remodeling-cost-guides/${citySlug}-remodeling-cost-guide/`,
      },
    ],
  };
  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

async function processCity(dir) {
  const indexPath = join(GUIDES_DIR, dir, "index.html");
  let html;
  try {
    html = await readFile(indexPath, "utf8");
  } catch {
    return { dir, skipped: "no index.html" };
  }

  if (html.includes(MARKER)) {
    return { dir, skipped: "already injected" };
  }

  const m = html.match(TITLE_RE);
  if (!m) {
    return { dir, skipped: "title parse failed" };
  }
  const city = m[1].trim();
  const state = m[2].trim();
  const citySlug = dir.replace(/-remodeling-cost-guide$/, "");

  const faqHtml = buildFaqHtml(city, state);
  const faqLd = buildFaqJsonLd(city, state);
  const breadcrumbLd = buildBreadcrumbJsonLd(city, state, citySlug);

  // Inject FAQ HTML before the footer disclaimer
  const disclaimerRe =
    /<p class="mt-12 text-center text-slate-400 text-xs max-w-lg mx-auto leading-relaxed">/;
  if (!disclaimerRe.test(html)) {
    return { dir, skipped: "disclaimer anchor not found" };
  }
  html = html.replace(disclaimerRe, `${faqHtml}\n$&`);

  // Inject JSON-LD before </head>
  html = html.replace("</head>", `${faqLd}${breadcrumbLd}</head>`);

  await writeFile(indexPath, html, "utf8");
  return { dir, city, state, injected: true };
}

async function main() {
  const entries = await readdir(GUIDES_DIR);
  const cityDirs = [];
  for (const e of entries) {
    if (
      e.endsWith("-remodeling-cost-guide") &&
      (await stat(join(GUIDES_DIR, e))).isDirectory()
    ) {
      cityDirs.push(e);
    }
  }

  console.log(`Processing ${cityDirs.length} city directories...`);
  const results = await Promise.all(cityDirs.map(processCity));

  const injected = results.filter((r) => r.injected).length;
  const skipped = results.filter((r) => r.skipped).length;
  console.log(`Done: ${injected} injected, ${skipped} skipped`);

  const failed = results.filter(
    (r) => r.skipped && r.skipped !== "already injected"
  );
  if (failed.length) {
    console.log("\nSkipped (needs attention):");
    failed.forEach((f) => console.log(`  ${f.dir}: ${f.skipped}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
