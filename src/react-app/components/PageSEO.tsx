import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { stripDefaultMeta } from '@/react-app/lib/stripDefaultMeta';
import {
  SEO_BASE_URL,
  SEO_DEFAULT_OG_IMAGE,
  seoForPath,
  seoFullTitle,
} from '@/shared/seoMeta';

interface PageSEOProps {
  /** Omit for routes listed in SEO_META — the shared map supplies it. */
  title?: string;
  /** Omit for routes listed in SEO_META — the shared map supplies it. */
  description?: string;
  path: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
}

const BASE_URL = SEO_BASE_URL;
const DEFAULT_OG_IMAGE = SEO_DEFAULT_OG_IMAGE;

export default function PageSEO({
  title: titleProp,
  description: descriptionProp,
  path,
  keywords: keywordsProp,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
}: PageSEOProps) {
  // Routes the Worker also renders resolve from the shared map, so the tags it
  // streams into the SPA shell and the tags Helmet swaps in can't diverge.
  // Explicit props still win, for pages not worth adding to the map.
  const fromMap = seoForPath(path);
  const title = titleProp ?? fromMap?.title ?? '';
  const description = descriptionProp ?? fromMap?.description ?? '';
  const keywords = keywordsProp ?? fromMap?.keywords;

  const fullUrl = `${BASE_URL}${path}`;
  const fullTitle = seoFullTitle(path, title);
  // Social scrapers require absolute og:image URLs.
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`;

  // Clear index.html's static fallbacks once Helmet has injected this page's
  // tags, so JS-executing crawlers don't see two of each. Deferred a microtask
  // because Helmet commits in its own effect, which may not have run yet.
  useEffect(() => {
    queueMicrotask(stripDefaultMeta);
  }, [fullTitle, description, fullUrl]);

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content="RemodelerIQ" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@RemodelerIQ" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
    </Helmet>
  );
}
