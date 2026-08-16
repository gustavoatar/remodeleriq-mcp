// Guards the three-way contract between index.html's [data-default] fallback
// tags, the tags PageSEO emits via Helmet, and the Worker's per-route override
// table in seoMeta.ts.
//
// The failure this exists to catch: add a tag to BOTH index.html and PageSEO
// but forget the override table, and non-prerendered routes silently serve the
// generic homepage value to scrapers. Nothing throws, no page looks broken, and
// the only symptom is a wrong link preview nobody checks. So assert it instead.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  SEO_INTENTIONALLY_GENERIC,
  SEO_PERSONALIZED_TAGS,
  SEO_META,
  seoForPath,
  seoFullTitle,
  seoTagOverrides,
} from '@/shared/seoMeta';

const ROOT = join(__dirname, '..', '..');
const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf8');
const pageSeoSrc = readFileSync(
  join(ROOT, 'src', 'react-app', 'components', 'PageSEO.tsx'),
  'utf8'
);

/** Key a raw tag string the same way seoTagKey keys a live element. */
function keyOf(tag: string): string {
  if (/^<title\b/i.test(tag)) return 'title';
  for (const attr of ['name', 'property', 'rel'] as const) {
    const m = tag.match(new RegExp(`${attr}=["']([^"']+)["']`));
    if (m) return `${attr}=${m[1]}`;
  }
  return tag;
}

/** Tags in index.html marked as overridable fallbacks. */
const defaultTags = new Set(
  (indexHtml.match(/<(?:title|meta|link)\b[^>]*\bdata-default\b[^>]*>/gi) ?? []).map(keyOf)
);

/** Tags PageSEO renders inside <Helmet>. */
const helmetTags = new Set(
  (pageSeoSrc
    .slice(pageSeoSrc.indexOf('<Helmet>'), pageSeoSrc.indexOf('</Helmet>'))
    .match(/<(?:title|meta|link)\b[^>]*>/gi) ?? []).map(keyOf)
);

describe('index.html [data-default] tags', () => {
  it('are actually present (the Worker selector depends on them)', () => {
    expect(defaultTags.size).toBeGreaterThan(10);
    expect(defaultTags.has('title')).toBe(true);
    expect(defaultTags.has('rel=canonical')).toBe(true);
  });

  it('are each either personalized per route or generic on purpose', () => {
    const unaccounted = [...defaultTags].filter(
      (k) => !SEO_PERSONALIZED_TAGS.has(k) && !SEO_INTENTIONALLY_GENERIC.has(k)
    );
    expect(
      unaccounted,
      `These index.html [data-default] tags are neither overridden per route nor ` +
        `listed in SEO_INTENTIONALLY_GENERIC, so non-prerendered routes serve the ` +
        `homepage value: ${unaccounted.join(', ')}. Add them to seoTagOverrides() ` +
        `or to SEO_INTENTIONALLY_GENERIC in src/shared/seoMeta.ts.`
    ).toEqual([]);
  });

  it('cover every tag PageSEO emits, so no page ships a stale generic', () => {
    // A Helmet tag with no fallback is fine for JS clients but invisible to
    // scrapers on non-prerendered routes. noindex/robots is conditional, so skip.
    const missing = [...helmetTags].filter(
      (k) => !defaultTags.has(k) && k !== 'name=robots'
    );
    expect(
      missing,
      `PageSEO emits these but index.html has no [data-default] counterpart, so ` +
        `scrapers never see them on non-prerendered routes: ${missing.join(', ')}.`
    ).toEqual([]);
  });
});

describe('seoTagOverrides', () => {
  it('personalizes every tag PageSEO also personalizes', () => {
    const gap = [...helmetTags].filter(
      (k) =>
        !SEO_PERSONALIZED_TAGS.has(k) &&
        !SEO_INTENTIONALLY_GENERIC.has(k) &&
        k !== 'name=robots'
    );
    expect(
      gap,
      `PageSEO varies these per page but the Worker does not, so the no-JS and ` +
        `JS views disagree: ${gap.join(', ')}.`
    ).toEqual([]);
  });

  it('emits the same title the client would render', () => {
    for (const [path, meta] of Object.entries(SEO_META)) {
      expect(seoTagOverrides(path, meta).get('title')?.value).toBe(
        seoFullTitle(path, meta.title)
      );
    }
  });

  it('points canonical and og:url at the requested route', () => {
    const o = seoTagOverrides('/labor-rates', SEO_META['/labor-rates']);
    expect(o.get('rel=canonical')?.value).toBe('https://remodeleriq.com/labor-rates');
    expect(o.get('property=og:url')?.value).toBe('https://remodeleriq.com/labor-rates');
  });
});

describe('SEO_META entries', () => {
  it('never carry a brand suffix the title builder already appends', () => {
    for (const [path, meta] of Object.entries(SEO_META)) {
      if (path === '/') continue; // homepage title legitimately carries the brand
      expect(meta.title, `${path} would render "… | RemodelerIQ | RemodelerIQ"`)
        .not.toMatch(/\|\s*RemodelerIQ\s*$/);
    }
  });

  it('resolve through seoForPath with and without a trailing slash', () => {
    expect(seoForPath('/studio')?.title).toBe(SEO_META['/studio'].title);
    expect(seoForPath('/studio/')?.title).toBe(SEO_META['/studio'].title);
    expect(seoForPath('/studio?utm_source=x')?.title).toBe(SEO_META['/studio'].title);
    expect(seoForPath('/not-a-route')).toBeUndefined();
  });

  it('stay within the lengths Google renders', () => {
    for (const [path, meta] of Object.entries(SEO_META)) {
      expect(seoFullTitle(path, meta.title).length, `${path} title`).toBeLessThanOrEqual(75);
      expect(meta.description.length, `${path} description`).toBeLessThanOrEqual(320);
    }
  });
});
