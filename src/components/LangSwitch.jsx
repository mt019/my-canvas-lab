import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'canvaslab:lang';

/*
 * Shared bilingual (zh/en) convention, extracted from FiscalEnforcementRisk:
 * dictionaries use the Chinese source string as the key, so zh renders at
 * zero cost and untranslated strings fall back to the original.
 */
export function useLang(dict = {}) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'zh' || saved === 'en') return saved;
    } catch { /* private mode etc. */ }
    return 'zh';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch { /* ignore */ }
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant';
  }, [lang]);

  const t = useCallback(
    (text) => (lang !== 'en' ? text : dict[text] ?? text),
    [lang, dict],
  );

  return { lang, setLang, t };
}

export default function LangSwitch({
  lang,
  onChange,
  className,
  buttonClassName,
  activeClassName,
}) {
  const base =
    className ??
    'inline-flex items-center gap-1 rounded-token-md border border-line bg-surface p-1';
  const btn =
    buttonClassName ??
    'rounded-token-sm px-2 py-0.5 text-token-sm text-ink-muted transition-colors duration-fast';
  const active =
    activeClassName ?? 'bg-surface-raised text-ink shadow-token-sm';

  return (
    <div className={base} role="group" aria-label="Language switch">
      <button
        type="button"
        className={`${btn} ${lang === 'zh' ? active : ''}`.trim()}
        aria-pressed={lang === 'zh'}
        onClick={() => onChange('zh')}
      >
        中文
      </button>
      <button
        type="button"
        className={`${btn} ${lang === 'en' ? active : ''}`.trim()}
        aria-pressed={lang === 'en'}
        onClick={() => onChange('en')}
      >
        EN
      </button>
    </div>
  );
}
