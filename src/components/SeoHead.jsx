import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_SITE_URL = 'https://phenom.design';
const SITE_URL = (import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');

function setMeta(attribute, key, content) {
  let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
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
 * The JSON-LD describes only visible page content; it does not invent FAQs. */
export default function SeoHead({ page }) {
  const { pathname } = useLocation();
  const url = `${SITE_URL}${pathname === '/' ? '/' : pathname}`;
  const metadata = useMemo(() => ({
    title: page?.title || 'Phenom Canvas Lab｜研究、法政與創作工具',
    description: page?.description || 'Phenom Canvas Lab 集合可操作的音樂工具，以及法律、財稅、公共政策的資料研究地圖。',
    type: page?.type || 'WebPage',
    indexable: page?.indexable !== false,
  }), [page]);

  useEffect(() => {
    document.title = metadata.title;
    document.documentElement.lang = 'zh-Hant-TW';
    setMeta('name', 'description', metadata.description);
    setMeta('name', 'robots', metadata.indexable ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' : 'noindex,nofollow');
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:locale', 'zh_TW');
    setMeta('property', 'og:site_name', 'Phenom Canvas Lab');
    setMeta('property', 'og:title', metadata.title);
    setMeta('property', 'og:description', metadata.description);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:card', 'summary');
    setMeta('name', 'twitter:title', metadata.title);
    setMeta('name', 'twitter:description', metadata.description);
    setLink('canonical', url);

    const graph = [
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: 'Phenom Canvas Lab', inLanguage: 'zh-Hant-TW', description: '研究、法政解析與創作工具的互動實驗場。' },
      { '@type': metadata.type, '@id': `${url}#webpage`, url, name: metadata.title, description: metadata.description, inLanguage: 'zh-Hant-TW', isPartOf: { '@id': `${SITE_URL}/#website` } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Phenom Canvas Lab', item: `${SITE_URL}/` },
        ...(pathname === '/' ? [] : [{ '@type': 'ListItem', position: 2, name: page?.name || metadata.title, item: url }]),
      ] },
    ];
    let script = document.head.querySelector('script[data-seo-schema]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoSchema = 'true';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  }, [metadata, page?.name, pathname, url]);

  return null;
}
