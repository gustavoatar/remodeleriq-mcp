#!/usr/bin/env node
// Adds a "Local Building Codes & Permits" section + LocalBusiness/HowTo JSON-LD
// to every city cost-guide. Pushes word count from ~1,227 → ~1,800.
// Idempotent via marker comment.

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

const GUIDES_DIR =
  "/Applications/MAMP/htdocs/remodeleriq/www/code/public/remodeling-cost-guides";

const MARKER = "<!-- RIQ_PERMITS_INJECTED_v1 -->";

const TITLE_RE =
  /<title>2026 Remodeling Cost Guides for ([^,<]+), ([A-Z]{2})[^<]*<\/title>/;

// State-level permit profiles — informs the content for each city in that state
const STATE_PROFILES = {
  CA: { typical_days: "4–10 weeks", typical_cost: "$500–$2,500", trap: "seismic compliance required on any structural change; Title 24 energy code adds complexity to HVAC and window work" },
  NY: { typical_days: "6–16 weeks (NYC), 2–6 weeks (LI/Westchester)", typical_cost: "$800–$4,500", trap: "DOB filings require licensed expediters for anything beyond minor work; co-op/condo boards add 2–4 months on top of DOB time" },
  TX: { typical_days: "2–4 weeks", typical_cost: "$350–$1,500", trap: "foundation work requires engineer-stamped plans across most municipalities — clay soil makes structural changes more involved than elsewhere" },
  FL: { typical_days: "3–6 weeks", typical_cost: "$400–$2,000", trap: "wind load compliance for any exterior work in coastal counties; impact-rated windows often required" },
  IL: { typical_days: "4–8 weeks (Chicago), 2–4 weeks (suburbs)", typical_cost: "$600–$2,800", trap: "lead paint disclosure and RRP certification required for pre-1978 homes; landmark districts add 4–8 weeks" },
  GA: { typical_days: "2–4 weeks", typical_cost: "$400–$1,800", trap: "DeKalb County requires sealed engineer drawings for any structural change; HOA review adds 2–4 weeks in many neighborhoods" },
  NC: { typical_days: "2–4 weeks", typical_cost: "$350–$1,600", trap: "energy code compliance verification on major remodels touching HVAC; some Charlotte-area neighborhoods require HOA review" },
  SC: { typical_days: "2–4 weeks", typical_cost: "$300–$1,400", trap: "coastal counties require wind/water resistance compliance; older Charleston/Columbia homes often have lead and asbestos triggers" },
  AZ: { typical_days: "1–3 weeks", typical_cost: "$300–$1,400", trap: "pool permits are intensive — barrier compliance inspection is rigorous; solar installations require separate permits" },
  WA: { typical_days: "3–6 weeks", typical_cost: "$450–$2,100", trap: "energy code is among the strictest in the country; tree preservation ordinances affect deck/addition projects" },
  OR: { typical_days: "3–6 weeks", typical_cost: "$450–$2,000", trap: "energy code compliance is strict; soil testing required for foundation work in many areas" },
  CO: { typical_days: "2–4 weeks", typical_cost: "$400–$1,800", trap: "Front Range freeze-thaw cycles trigger specific frost depth requirements; many municipalities require energy code upgrades" },
  MA: { typical_days: "3–8 weeks", typical_cost: "$500–$2,200", trap: "historic district designation applies to large portions of Boston, Cambridge, and Brookline — adds 4–10 weeks for exterior changes" },
  CT: { typical_days: "3–6 weeks", typical_cost: "$400–$1,900", trap: "many pre-1900 homes have lead paint, knob-and-tube wiring, and asbestos; permit office staffing varies dramatically town-to-town" },
  NJ: { typical_days: "3–6 weeks", typical_cost: "$450–$2,000", trap: "Uniform Construction Code applies statewide but town-level review adds variance; energy code requirements tightened in 2024" },
  PA: { typical_days: "3–5 weeks", typical_cost: "$400–$1,800", trap: "Philadelphia uses a third-party plan review system; older neighborhoods often trigger historic review" },
  OH: { typical_days: "2–4 weeks", typical_cost: "$350–$1,600", trap: "older Cleveland/Cincinnati neighborhoods have lead paint and asbestos triggers; permits required for most basement finish work" },
  MI: { typical_days: "2–4 weeks", typical_cost: "$350–$1,500", trap: "permit costs vary by township; Detroit metro has slower review than west Michigan" },
  WI: { typical_days: "2–4 weeks", typical_cost: "$350–$1,500", trap: "energy code compliance for new construction and major remodels; Milwaukee has stricter requirements than other parts of the state" },
  IN: { typical_days: "2–4 weeks", typical_cost: "$300–$1,400", trap: "Indianapolis has standardized review; smaller cities vary widely in permit thoroughness" },
  MO: { typical_days: "2–4 weeks", typical_cost: "$300–$1,400", trap: "St. Louis County has multiple municipalities each with own permit office; suburban permits faster than city" },
  KY: { typical_days: "2–4 weeks", typical_cost: "$300–$1,300", trap: "Louisville and Lexington require permits for most remodel work; rural areas more permissive" },
  TN: { typical_days: "2–4 weeks", typical_cost: "$300–$1,400", trap: "Nashville and Memphis have busier permit offices than smaller TN cities; expect longer review times in summer" },
  AL: { typical_days: "2–4 weeks", typical_cost: "$300–$1,200", trap: "permit requirements vary widely by city; Birmingham and Huntsville have standard processes, smaller cities may not require permits for minor work" },
  LA: { typical_days: "3–6 weeks", typical_cost: "$400–$1,800", trap: "elevation requirements in flood zones; pre-1980 New Orleans homes often have lead and asbestos triggers" },
  OK: { typical_days: "2–4 weeks", typical_cost: "$300–$1,400", trap: "Oklahoma City and Tulsa have standard processes; storm shelter requirements in some jurisdictions" },
  NM: { typical_days: "2–4 weeks", typical_cost: "$300–$1,300", trap: "older adobe construction in many Santa Fe and Taos area homes triggers special review" },
  NV: { typical_days: "2–4 weeks", typical_cost: "$350–$1,600", trap: "Clark County (Las Vegas) requires energy code compliance for HVAC and window changes" },
  UT: { typical_days: "2–4 weeks", typical_cost: "$350–$1,500", trap: "energy code compliance required statewide; Salt Lake metro has more standardized process than rural areas" },
  RI: { typical_days: "3–5 weeks", typical_cost: "$400–$1,700", trap: "older homes statewide trigger lead paint, asbestos, and historic review; Providence has slower review than smaller cities" },
  VA: { typical_days: "3–5 weeks", typical_cost: "$400–$1,700", trap: "Northern Virginia jurisdictions have stricter review than rest of state; historic districts in Old Town and Williamsburg add review time" },
  MD: { typical_days: "3–5 weeks", typical_cost: "$400–$1,800", trap: "Montgomery and Howard counties have stringent review; older Baltimore homes have lead paint requirements" },
  DC: { typical_days: "4–8 weeks", typical_cost: "$500–$2,500", trap: "historic preservation review applies to large portions of the city; DCRA has slower review than surrounding jurisdictions" },
};

function profileFor(state) {
  return STATE_PROFILES[state] || {
    typical_days: "2–4 weeks",
    typical_cost: "$300–$1,500",
    trap: "permit costs and timelines vary by jurisdiction — verify with your local building department directly before signing a remodel contract",
  };
}

function buildPermitsHtml(city, state) {
  const p = profileFor(state);
  return `
${MARKER}
<section class="max-w-4xl mx-auto px-6 mb-12" aria-labelledby="permits-heading">
  <div class="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
    <h2 id="permits-heading" class="text-2xl font-black mb-6 text-slate-900">
      Local building codes & permits in ${city}, ${state}
    </h2>

    <p class="text-slate-600 leading-relaxed mb-6">
      Before any remodel work begins in ${city}, the right permits need to be pulled. Working without them voids homeowner's insurance and complicates future home sales when a buyer's inspector finds undocumented work. Here's what to expect in ${state}.
    </p>

    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <div class="bg-slate-50 rounded-xl p-5 border border-slate-200">
        <h3 class="font-bold text-slate-900 mb-2">Typical permit timeline</h3>
        <p class="text-2xl font-black text-emerald-600 mb-1">${p.typical_days}</p>
        <p class="text-sm text-slate-600">from submission to issuance for residential remodels</p>
      </div>
      <div class="bg-slate-50 rounded-xl p-5 border border-slate-200">
        <h3 class="font-bold text-slate-900 mb-2">Typical permit cost</h3>
        <p class="text-2xl font-black text-emerald-600 mb-1">${p.typical_cost}</p>
        <p class="text-sm text-slate-600">for mid-range remodel projects</p>
      </div>
    </div>

    <h3 class="font-bold text-lg text-slate-900 mb-3">${city}-specific things to watch for</h3>
    <p class="text-slate-600 leading-relaxed mb-6">${p.trap.charAt(0).toUpperCase() + p.trap.slice(1)}.</p>

    <h3 class="font-bold text-lg text-slate-900 mb-3">When you absolutely need a permit (every project type)</h3>
    <ul class="space-y-2 text-slate-600 mb-6 list-disc pl-6">
      <li>Any electrical work beyond outlet or fixture replacement</li>
      <li>Any plumbing work beyond like-for-like fixture swap</li>
      <li>Moving any wall (load-bearing or not)</li>
      <li>Roof replacement</li>
      <li>Window or door size changes</li>
      <li>Adding square footage to the home</li>
      <li>Decks more than 30 inches off the ground</li>
      <li>HVAC system replacement or major modification</li>
    </ul>

    <h3 class="font-bold text-lg text-slate-900 mb-3">What to verify with your ${city} contractor before signing</h3>
    <ol class="space-y-2 text-slate-600 mb-6 list-decimal pl-6">
      <li>Which specific permits will be pulled for your scope of work</li>
      <li>That the contractor (not you) will pull and pay for the permits</li>
      <li>Estimated permit cost and whether it's included in the bid total or billed separately</li>
      <li>The inspection schedule and how it affects the project timeline</li>
      <li>Whether the contractor's license is current and valid for ${city} jurisdiction</li>
    </ol>

    <div class="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
      <p class="text-sm text-amber-900 leading-relaxed">
        <strong>Important:</strong> If a contractor in ${city} suggests skipping a permit "to save you money," that's their way of avoiding inspection — not your protection. Unpermitted work creates personal liability for the homeowner, not the contractor. Always verify permit requirements directly with the ${city} building department, which takes about 10 minutes by phone.
      </p>
    </div>
  </div>
</section>
`;
}

function buildLocalBusinessJsonLd(city, state) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Remodeling Cost Guide for ${city}, ${state}`,
    about: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: city,
        addressRegion: state,
        addressCountry: "US",
      },
    },
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

  const permitsHtml = buildPermitsHtml(city, state);
  const localLd = buildLocalBusinessJsonLd(city, state);

  // Inject before the FAQ section (which was added by inject-city-faq.mjs)
  // Falls back to before the disclaimer if FAQ not present
  const faqAnchor = /<section class="max-w-4xl mx-auto px-6 mb-12" aria-labelledby="faq-heading">/;
  const disclaimerAnchor =
    /<p class="mt-12 text-center text-slate-400 text-xs max-w-lg mx-auto leading-relaxed">/;

  if (faqAnchor.test(html)) {
    html = html.replace(faqAnchor, `${permitsHtml}\n$&`);
  } else if (disclaimerAnchor.test(html)) {
    html = html.replace(disclaimerAnchor, `${permitsHtml}\n$&`);
  } else {
    return { dir, skipped: "no injection anchor found" };
  }

  // Inject JSON-LD before </head>
  html = html.replace("</head>", `${localLd}</head>`);

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
