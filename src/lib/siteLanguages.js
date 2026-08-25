// Indexable language variants live here, once. Runtime routing, language
// switches, sitemap generation, and SEO metadata all consume this manifest.
// Chinese keeps the established URL; translated pages receive locale prefixes.
//
// 2026-08-25 起是空的：唯一有英文版的六條路由屬統計站，隨它退役刪除，
// 現役副本在 stat.phenomcanvas.com。表空著時語言切換鈕不出現，sitemap 也不產
// /en/ 那一組；某頁要有英文版就在這裡加一行。
const ROUTE_LANGUAGES = new Map([]);

export const DEFAULT_LANGUAGE = 'zh-Hant-TW';
export const ENGLISH_LANGUAGE = 'en';
const PREFIX_LANGUAGES = new Set([ENGLISH_LANGUAGE]);

export function splitLanguagePath(pathname) {
  const path = pathname || '/';
  const match = path.match(/^\/(en)(?:\/|$)/);
  if (!match) return { language: DEFAULT_LANGUAGE, basePath: path };
  const language = match[1];
  const basePath = path.slice(language.length + 1) || '/';
  return { language, basePath };
}

export function hasLanguageVersion(pathname, language) {
  const { basePath } = splitLanguagePath(pathname);
  return ROUTE_LANGUAGES.get(basePath)?.includes(language) ?? false;
}

export function hasEnglishVersion(pathname) {
  return hasLanguageVersion(pathname, ENGLISH_LANGUAGE);
}

export function pathForLanguage(pathname, language) {
  const { basePath } = splitLanguagePath(pathname);
  if (PREFIX_LANGUAGES.has(language) && hasLanguageVersion(basePath, language)) {
    return `/${language}${basePath}`;
  }
  return basePath;
}

export function languageAlternates(pathname) {
  const { basePath } = splitLanguagePath(pathname);
  const variants = ROUTE_LANGUAGES.get(basePath);
  if (!variants?.length) return [];
  return [
    { hreflang: 'zh-Hant-TW', path: basePath },
    ...variants.map((language) => ({ hreflang: language, path: `/${language}${basePath}` })),
    { hreflang: 'x-default', path: basePath },
  ];
}

export function localizedPathsForRoute(pathname) {
  const { basePath } = splitLanguagePath(pathname);
  return (ROUTE_LANGUAGES.get(basePath) ?? []).map((language) => ({
    language,
    path: `/${language}${basePath}`,
  }));
}

export function localizedIndexRoutes(baseRoutes) {
  const routes = [...baseRoutes];
  for (const route of baseRoutes) {
    for (const { path } of localizedPathsForRoute(route)) routes.push(path);
  }
  return [...new Set(routes)].sort();
}
