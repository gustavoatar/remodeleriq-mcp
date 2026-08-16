// index.html ships static SEO fallbacks marked [data-default] for routes that
// aren't prerendered, where crawlers get no JS and those tags are all they get.
// Once Helmet mounts it adds the page's own tags but never removes the static
// ones, so the live DOM carries two of each — and because the two families land
// in opposite orders, a JS-executing crawler reads the title off Helmet's tag
// but the og:* preview off the generic fallback.
//
// scripts/prerender.mjs does exactly this at build time for prerendered routes;
// this is the runtime half, covering every other route. Removal is permanent for
// the session, which is what we want — client-side navigation keeps Helmet's
// tags in sync from here on, and there is nothing left to collide with.

/** Identity of a head tag for duplicate detection — mirrors prerender.mjs. */
function idOf(el: Element): string {
  if (el.tagName === 'TITLE') return 'title';
  const attr = el.getAttribute('name')
    ? 'name'
    : el.getAttribute('property')
      ? 'property'
      : 'rel';
  return `${attr}=${el.getAttribute(attr) ?? ''}`;
}

/**
 * Drop every [data-default] head tag that Helmet has since superseded.
 * Idempotent and safe to call on each navigation.
 */
export function stripDefaultMeta(): void {
  if (typeof document === 'undefined') return;

  const all = Array.from(document.head.querySelectorAll('title, meta, link'));
  const superseded = new Set(
    all.filter((el) => !el.hasAttribute('data-default')).map(idOf)
  );

  for (const el of all) {
    if (el.hasAttribute('data-default') && superseded.has(idOf(el))) {
      el.remove();
    }
  }
}
