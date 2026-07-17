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
  /*
   * 預設外觀跟 FontSizeControl 與 AppearanceMenu 是同一套：髮絲框、不填底、同圓角、同字級。
   * 這三顆永遠並排在同一列工具列上，而閱讀頁只付得起一排鉻件——三種邊框、三種底色、三種
   * 字級排在標題上面，是三個框在吵架，不是三個控制項。
   *
   * 帶自己外殼色的頁（FiscalEnforcementRisk 的深色 masthead）照樣傳 className 覆寫。
   */
  const base =
    className ??
    'inline-flex items-center rounded-token-sm border border-line-soft text-token-xs text-ink-muted transition-colors duration-fast hover:border-line';
  const btn =
    buttonClassName ?? 'px-2 py-1 transition-colors duration-fast hover:text-ink';
  const active = activeClassName ?? 'text-ink';

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
      {/* 兩格之間一條髮絲線，跟 FontSizeControl 同一個做法：兩顆鍵在同一個框裡，靠線分開，
          不靠各自的底色。帶自己外殼色的頁傳了 buttonClassName，那條線就不畫——它有自己的分法。 */}
      <button
        type="button"
        className={`${btn} ${buttonClassName ? '' : 'border-l border-line-soft'} ${lang === 'en' ? active : ''}`.trim()}
        aria-pressed={lang === 'en'}
        onClick={() => onChange('en')}
      >
        EN
      </button>
    </div>
  );
}
