import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

// Do not fall back to a third-party domain. Set VITE_SITE_URL in production
// when a fixed public URL is needed; local previews use their current origin.
const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');

// The homepage keeps one quiet site card. Individual pages intentionally do
// not advertise a large image: their title and description should be enough.
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
const LOGO = `${SITE_URL}/phenom-ring.svg`;
const SITE_NAME = 'Phenom Canvas Lab';
const SITE_DESC = '憲法法庭、稅務訴訟、陳寅恪、朱家驊、司法院外國法譯本、統計，以及幾個自己在用的工具。';

// Publisher/author node, referenced by @id from every page so answer engines
// resolve one consistent entity for the site rather than an anonymous string.
const PUBLISHER = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#org`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: { '@type': 'ImageObject', url: LOGO },
};

function setMeta(attribute, key, content) {
  let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}

function removeMeta(attribute, key) {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove();
}

function setLink(rel, href) {
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', rel);
    document.head.appendChild(node);
  }
  node.setAttribute('href', href);
}

/** Keeps route identity, sharing metadata, and schema.org in one place.
 * The JSON-LD describes only visible page content: page identity, the site's
 * own directory (itemList, passed only where those links are on screen), and
 * the publishing organisation. It does not invent FAQs, ratings, or dates. */
export default function SeoHead({ page, itemList }) {
  const { pathname } = useLocation();
  const url = `${SITE_URL}${pathname === '/' ? '/' : pathname}`;
  const ogImage = page?.image || (pathname === '/' ? DEFAULT_OG_IMAGE : null);
  const metadata = useMemo(() => ({
    title: page?.title || 'Phenom Canvas Lab',
    description: page?.description || '憲法法庭、稅務訴訟、陳寅恪、朱家驊、司法院外國法譯本、統計，以及幾個自己在用的工具。',
    type: page?.type || 'WebPage',
    indexable: page?.indexable !== false,
    name: page?.name,
    keywords: page?.keywords,
    parent: page?.parent,
    buildSchema: page?.buildSchema,
  }), [page]);

  useEffect(() => {
    document.title = metadata.title;
    document.documentElement.lang = 'zh-Hant-TW';
    setMeta('name', 'description', metadata.description);
    setMeta('name', 'robots', metadata.indexable ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' : 'noindex,nofollow');
    setMeta('property', 'og:type', metadata.type === 'Article' ? 'article' : 'website');
    setMeta('property', 'og:locale', 'zh_TW');
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:title', metadata.title);
    setMeta('property', 'og:description', metadata.description);
    setMeta('property', 'og:url', url);
    if (ogImage) {
      setMeta('property', 'og:image', ogImage);
      setMeta('property', 'og:image:type', 'image/png');
      setMeta('property', 'og:image:width', '1200');
      setMeta('property', 'og:image:height', '630');
      setMeta('property', 'og:image:alt', `${metadata.name || metadata.title} — ${SITE_NAME}`);
      setMeta('name', 'twitter:image', ogImage);
    } else {
      ['og:image', 'og:image:type', 'og:image:width', 'og:image:height', 'og:image:alt']
        .forEach((key) => removeMeta('property', key));
      removeMeta('name', 'twitter:image');
    }
    setMeta('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', metadata.title);
    setMeta('name', 'twitter:description', metadata.description);
    // Set-or-remove, never just set: under SPA navigation the previous page's
    // keywords would otherwise linger on pages that declare none.
    if (metadata.keywords) setMeta('name', 'keywords', metadata.keywords);
    else removeMeta('name', 'keywords');
    setLink('canonical', url);

    const isArticle = metadata.type === 'Article';
    const primary = {
      '@type': metadata.type,
      '@id': `${url}#webpage`,
      url,
      name: metadata.title,
      description: metadata.description,
      inLanguage: 'zh-Hant-TW',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      ...(ogImage ? { primaryImageOfPage: ogImage } : {}),
      ...(isArticle ? {
        headline: metadata.name || metadata.title,
        ...(ogImage ? { image: ogImage } : {}),
        author: { '@id': `${SITE_URL}/#org` },
        publisher: { '@id': `${SITE_URL}/#org` },
        mainEntityOfPage: url,
      } : {}),
    };

    const graph = [
      PUBLISHER,
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: SITE_NAME, inLanguage: 'zh-Hant-TW', description: SITE_DESC, publisher: { '@id': `${SITE_URL}/#org` } },
      primary,
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
        // Optional middle crumb: a tab page sits under its section (e.g. the
        // Constitutional Court archive) rather than directly under the site.
        ...(metadata.parent ? [{ '@type': 'ListItem', position: 2, name: metadata.parent.name, item: `${SITE_URL}${metadata.parent.path}` }] : []),
        ...(pathname === '/' ? [] : [{ '@type': 'ListItem', position: metadata.parent ? 3 : 2, name: metadata.name || metadata.title, item: url }]),
      ] },
    ];

    // Page-supplied extra schema nodes (e.g. the archive Dataset). The function
    // receives the resolved origin and page URL so it can emit absolute @ids.
    if (typeof metadata.buildSchema === 'function') {
      const extra = metadata.buildSchema(SITE_URL, url);
      if (Array.isArray(extra)) graph.push(...extra);
    }

    // Only emit an ItemList when the caller hands one in — it mirrors a list of
    // links actually rendered on the page (the homepage directory), never a
    // synthesised one.
    if (Array.isArray(itemList) && itemList.length) {
      graph.push({
        '@type': 'ItemList',
        '@id': `${url}#directory`,
        name: metadata.title,
        numberOfItems: itemList.length,
        itemListElement: itemList.map((it, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: it.name,
          description: it.description,
          url: `${SITE_URL}${it.path}`,
        })),
      });
    }

    let script = document.head.querySelector('script[data-seo-schema]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoSchema = 'true';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  }, [metadata, pathname, url, ogImage, itemList]);

  return null;
}
