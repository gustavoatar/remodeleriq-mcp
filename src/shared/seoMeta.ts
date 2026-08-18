// Per-route SEO metadata, shared by the React app and the Worker.
//
// Why this exists: routes that aren't prerendered are served by the Worker's
// SPA-shell fallback, which hands back index.html with its generic [data-default]
// tags. Social scrapers don't run JS, so every one of those routes previewed as
// the homepage. The Worker now rewrites the fallback tags from this map before
// streaming the shell, and PageSEO resolves from the same map on the client, so
// the two can't disagree.
//
// Only list routes whose page resolves its own metadata from here (see PageSEO).
// A route absent from the map keeps index.html's generic defaults — fine for
// /login, /settings, and admin pages, which shouldn't be indexed anyway.
// Prerendered routes don't need entries: Workers Assets serves their built HTML
// directly and the request never reaches the Worker.

export interface SeoMeta {
  title: string;
  description: string;
  keywords?: string;
}

export const SEO_BASE_URL = 'https://remodeleriq.com';
export const SEO_DEFAULT_OG_IMAGE = `${SEO_BASE_URL}/og-image.png`;

/** Browser-tab / SERP title. The homepage title already carries the brand. */
export function seoFullTitle(path: string, title: string): string {
  return path === '/' ? title : `${title} | RemodelerIQ`;
}

export const SEO_META: Record<string, SeoMeta> = {
  '/': {
    title: 'RemodelerIQ - Stop Overpaying for Home Renovations | Free AI Bid Analysis',
    description:
      "Upload your contractor bid and get instant AI analysis. See if you're being overcharged, spot hidden risks, and get expert negotiation scripts. Trusted by 10,000+ homeowners.",
    keywords:
      'contractor bid analysis, home remodeling costs, renovation estimate checker, contractor price comparison, home improvement savings, construction bid review',
  },
  '/how-it-works': {
    title: 'How It Works — Explore a Live Sample Bid Analysis',
    description:
      'Walk through a real RemodelerIQ analysis with every module unlocked: confidence score, red flags, market comparison against BLS and Zonda 2026 data, contractor verification, and negotiation scripts. Then run your own bid free.',
    keywords:
      'how RemodelerIQ works, contractor bid analysis demo, sample bid analysis, AI bid checker walkthrough',
  },
  '/labor-rates': {
    title: 'Contractor Labor Rates by Trade and Location',
    description:
      'Compare contractor labor rates by trade and ZIP code. See what electricians, plumbers, carpenters, and other tradespeople charge in your area based on BLS data.',
    keywords:
      'contractor labor rates, electrician rates, plumber rates, carpenter rates, HVAC rates, construction labor costs',
  },
  '/newsletter': {
    title: 'Subscribe to the RemodelerIQ Newsletter',
    description:
      'Get the free monthly RemodelerIQ brief: real 2026 remodeling cost data by city and the red flags that mean you\'re overpaying. One email a month, unsubscribe anytime.',
    keywords: 'remodeleriq newsletter, remodeling cost newsletter, home renovation email',
  },
  '/labor-cost-index': {
    title: 'Construction Labor Cost Index 2026: BLS Wages by Metro',
    description:
      'What construction labor actually costs across 152 US metros in 2026, from BLS wage data. See the trade-by-trade breakdown, the 2.7x quote-variance spread, and the regression showing metro cost tracks real wages (R²=0.57).',
    keywords:
      'construction labor cost index, contractor labor rates by city, BLS construction wages, remodeling labor cost 2026, trade wages by metro, construction cost data',
  },
  '/trusted-radar': {
    // Dropped a leading "Find " — with the brand suffix this ran 77 chars and
    // truncated in results. seoTagContract.test.ts holds the line at 75.
    title: 'Trusted Contractors Near You | Free License & Review Check',
    description:
      'Look up any contractor by name or search your ZIP code. See verified licenses, Google reviews, and BBB ratings for roofers, plumbers, electricians & more — free.',
    keywords:
      'contractor lookup by name, find local contractors, verified contractors near me, contractor license lookup, contractor reviews, BBB rated contractors, licensed roofers plumbers electricians',
  },
  '/studio': {
    title: 'Free Remodel Cost Calculator | Kitchen, Bathroom & More',
    description:
      'Get instant cost estimates for your kitchen, bathroom, basement, or home addition. Powered by Houzz, Zonda, and BLS data. Adjust for finishes, timeline, and your ZIP code.',
    keywords:
      'remodel cost calculator, kitchen remodel estimate, bathroom renovation cost, home addition calculator, basement finishing cost',
  },
  '/join': {
    // No brand suffix here — seoFullTitle appends "| RemodelerIQ".
    title: 'Pricing & Plans',
    description:
      'Start with 3 free bid analyses. Upgrade to unlimited access with Project Pass ($19.99/mo), Remodeler Pass ($39.99/3mo), or Lifetime Pass ($99.99). No commitment, cancel anytime.',
    keywords:
      'contractor bid analysis pricing, RemodelerIQ plans, home renovation tool subscription',
  },
  '/terms': {
    title: 'Terms of Service - RemodelerIQ User Agreement',
    description:
      "Understand how RemodelerIQ's AI bid analysis works, our confidence scoring methodology, and your rights as a user. Clear, fair terms for homeowners.",
    keywords: 'RemodelerIQ terms, bid analysis terms of service, contractor tool agreement',
  },
  '/privacy': {
    title: 'Privacy Policy - How RemodelerIQ Protects Your Data',
    description:
      'Your contractor bids and personal data are never sold. Learn how RemodelerIQ uses bank-level encryption and strict data policies to keep your renovation plans private.',
    keywords: 'RemodelerIQ privacy, data protection, contractor bid confidentiality',
  },
};

/** Metadata for a path, ignoring query/hash and a trailing slash. */
export function seoForPath(pathname: string): SeoMeta | undefined {
  const clean = pathname.replace(/[?#].*$/, '');
  return (
    SEO_META[clean] ??
    (clean.length > 1 ? SEO_META[clean.replace(/\/+$/, '')] : undefined)
  );
}

// ---- index.html [data-default] tag contract ---------------------------------
// The Worker rewrites index.html's fallback tags in place before streaming the
// SPA shell. Each tag is addressed by the key below — "title" for the title
// element, otherwise "<attr>=<value>" of whichever of name/property/rel it
// carries. seoTagContract.test.ts fails if a [data-default] tag that PageSEO
// also emits is missing from both tables, which is the drift that would
// otherwise ship a generic value to scrapers with no test going red.

/** Identity of a head tag, shared by the Worker, the client strip, and the test. */
export function seoTagKey(
  tag: string,
  attrs: { name?: string | null; property?: string | null; rel?: string | null }
): string {
  if (tag.toLowerCase() === 'title') return 'title';
  if (attrs.name) return `name=${attrs.name}`;
  if (attrs.property) return `property=${attrs.property}`;
  return `rel=${attrs.rel ?? ''}`;
}

/**
 * Fallback tags that stay generic on purpose — they say the same thing on every
 * page, so there is nothing per-route to substitute.
 */
export const SEO_INTENTIONALLY_GENERIC = new Set([
  'property=og:image',
  'property=og:type',
  'property=og:site_name',
  'name=twitter:card',
  'name=twitter:site',
  'name=twitter:image',
]);

export interface SeoTagOverride {
  value: string;
  /** Where the value goes: an attribute name, or the element's text. */
  attr: 'content' | 'href' | 'text';
}

/** Per-route replacements for index.html's [data-default] tags. */
export function seoTagOverrides(
  pathname: string,
  meta: SeoMeta
): Map<string, SeoTagOverride> {
  const canonical = `${SEO_BASE_URL}${pathname}`;
  const out = new Map<string, SeoTagOverride>([
    ['title', { value: seoFullTitle(pathname, meta.title), attr: 'text' }],
    ['rel=canonical', { value: canonical, attr: 'href' }],
    ['property=og:url', { value: canonical, attr: 'content' }],
    ['property=og:title', { value: meta.title, attr: 'content' }],
    ['name=twitter:title', { value: meta.title, attr: 'content' }],
    ['name=description', { value: meta.description, attr: 'content' }],
    ['property=og:description', { value: meta.description, attr: 'content' }],
    ['name=twitter:description', { value: meta.description, attr: 'content' }],
  ]);
  if (meta.keywords) out.set('name=keywords', { value: meta.keywords, attr: 'content' });
  return out;
}

/** Keys seoTagOverrides can personalize, independent of any one route's data. */
export const SEO_PERSONALIZED_TAGS: ReadonlySet<string> = new Set(
  seoTagOverrides('/x', { title: 't', description: 'd', keywords: 'k' }).keys()
);
