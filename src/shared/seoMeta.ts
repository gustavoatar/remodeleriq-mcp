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
  '/trusted-radar': {
    title: 'Find Trusted Contractors Near You | Free License & Review Check',
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
