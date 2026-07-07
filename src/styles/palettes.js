/*
 * 色票庫（PaletteLab 的資料層＋全站配色機制）。
 *
 * 鐵律（2026-07-07 使用者裁定）：色票管裝飾與框架，正文閱讀面永遠近白。
 * 每套色票的 `paper` 是大段文字底下的紙面，只准帶極輕微的色傾向；
 * 有色的 `surface` 只能用在邊框、側欄、卡片、badge 等鉻件上。
 *
 * 選定的色票經 applySitePalette() 寫到 :root 的 --c-* token 上，
 * 全站吃全域 token 的頁面即時跟著換；各頁自己的 *_VARS 識別色不受影響。
 */

// token-exempt: 本檔通篇是色票資料，hex 即內容本身。

/*
 * 金箔效果：真正的「金」是金屬漸層＋流光，不是一個單色。
 * 配合 index.css 的 .foil（background-size 200% + 緩慢 sheen 動畫）使用；
 * 只准出現在 accent 元件（按鈕、badge、kicker），禁止當底色或正文色。
 */
export const GOLD_FOIL =
  'linear-gradient(115deg, #8a6a1c 0%, #c9a227 18%, #f3d565 38%, #fdf0b0 50%, #f3d565 62%, #c9a227 82%, #8a6a1c 100%)';
export const GOLD_FOIL_INK = '#3a2d10'; // 金箔上的深褐字色

/*
 * vars 角色說明：
 * paper＝閱讀紙面（強制近白）；surface＝框架鉻件；accent/accent2＝主副強調；
 * pop（可選）＝撞色——一個畫面最多出現一處（badge、標記點），給版面一個亮點；
 * accentGradient（可選）＝金屬質感漸層，取代 accent 用於按鈕/badge 的 bling 效果。
 */
export const PALETTES = [
  // ── 站內現用 ──
  {
    id: 'rose',
    name: '藕粉玫瑰',
    story: '首頁與翻譯工程現用。藕粉作框、灰褐墨、深玫瑰點染。',
    origin: '站內',
    vars: { paper: '#fdfbfc', surface: '#f7eef1', ink: '#332b30', inkMuted: '#74636a', inkFaint: '#a89ba0', line: '#eadde2', accent: '#8f6071', accent2: '#a77b89' , pop: '#6b7d5a' },
  },
  {
    id: 'terracotta',
    name: '陶土粉',
    story: '空氣污染費頁現用。暖陶粉作框、褐墨、一抹霧藍。',
    origin: '站內',
    vars: { paper: '#fdfaf9', surface: '#f5eceb', ink: '#5a4b48', inkMuted: '#8a7a78', inkFaint: '#c5b4b2', line: '#e8d3d1', accent: '#b08060', accent2: '#4a6880' },
  },
  {
    id: 'indigo-copper',
    name: '靛藍銅',
    story: 'Manus–Meta 頁現用。冷靛藍為主、銅棕作對比點。',
    origin: '站內',
    vars: { paper: '#fcfdfe', surface: '#eef1f8', ink: '#2f3e52', inkMuted: '#66738c', inkFaint: '#9aa5bc', line: '#dde2ef', accent: '#3b4f78', accent2: '#b87333' },
  },
  {
    id: 'cool-teal',
    name: '冷灰茶青',
    story: '國際稅法研究桌現用。冷白工作台、淡淡的灰綠。',
    origin: '站內',
    vars: { paper: '#fbfcfd', surface: '#f0f4f5', ink: '#23262b', inkMuted: '#66707b', inkFaint: '#9aa3ad', line: '#e2e7eb', accent: '#4c7971', accent2: '#61799d' },
  },
  {
    id: 'neutral-interim',
    name: '過渡中性',
    story: '選定前的安全牌：冷白、近黑、壓灰的深藍。',
    origin: '站內',
    vars: { paper: '#fdfdfc', surface: '#f6f7f8', ink: '#1f2328', inkMuted: '#57606a', inkFaint: '#848d97', line: '#d1d9e0', accent: '#3d5a80', accent2: '#4a6d8c' },
  },
  // ── 名畫・器物 ──
  {
    id: 'morandi',
    name: 'Morandi 靜物',
    story: '喬治·莫蘭迪的瓶罐：粉塵般的灰調，彩度壓到將熄未熄。',
    origin: '名畫',
    vars: { paper: '#fbfaf8', surface: '#eeebe4', ink: '#46413a', inkMuted: '#7d766c', inkFaint: '#a49c90', line: '#dcd5c9', accent: '#9c7f6d', accent2: '#7e8a93' },
  },
  {
    id: 'monet',
    name: 'Monet 睡蓮',
    story: '橘園美術館那一圈水面：霧藍、水綠、一點薰衣草。',
    origin: '名畫',
    vars: { paper: '#fbfcfc', surface: '#e9f0ee', ink: '#35434a', inkMuted: '#5f7276', inkFaint: '#8fa0a2', line: '#cfdedb', accent: '#6a8caf', accent2: '#8ba081' , pop: '#9188c2' },
  },
  {
    id: 'wheatfield',
    name: 'Van Gogh 麥田',
    story: '麥田群鴉的金與那條土路：暖金壓灰，藍只留天際一線。',
    origin: '名畫',
    vars: { paper: '#fdfbf5', surface: '#f2ecd9', ink: '#4a4234', inkMuted: '#7a6f58', inkFaint: '#a89c80', line: '#e3d9bd', accent: '#a8862e', accent2: '#5b7290' , pop: '#b5443a' },
  },
  {
    id: 'klimt',
    name: 'Klimt 金衣',
    story: '《吻》的金箔與深褐：金屬流光作點，草地的堇紫作撞色。',
    origin: '名畫',
    vars: { paper: '#fcfaf5', surface: '#efe7d6', ink: '#3d3226', inkMuted: '#6f6250', inkFaint: '#9c8d76', line: '#e2d7bf', accent: '#c9a227', accent2: '#7c5a43', pop: '#8a5f9e' },
    accentGradient: GOLD_FOIL,
  },
  {
    id: 'hammershoi',
    name: 'Hammershøi 室內',
    story: '哥本哈根的灰色房間：光從窗簾漏進來的那種安靜。',
    origin: '名畫',
    vars: { paper: '#fbfbfa', surface: '#e9e9e7', ink: '#3a3d40', inkMuted: '#6b7074', inkFaint: '#989c9e', line: '#d4d6d5', accent: '#6e7b85', accent2: '#8a8577' },
  },
  {
    id: 'ru-ware',
    name: '汝窯天青',
    story: '「雨過天青雲破處」：宋瓷的青，釉下開片的淡金線。',
    origin: '器物',
    vars: { paper: '#fbfcfc', surface: '#e9efed', ink: '#2f3b3a', inkMuted: '#5c6f6d', inkFaint: '#8ba09d', line: '#ccd9d6', accent: '#6f9c93', accent2: '#a89078' },
  },
  // ── 水果 ──
  {
    id: 'mango',
    name: '芒果奶昔',
    story: '熟芒果的金黃打成霧，配一片葉子綠。',
    origin: '水果',
    vars: { paper: '#fefdf9', surface: '#fdf3dd', ink: '#4a4232', inkMuted: '#8a7a58', inkFaint: '#bfae88', line: '#f0e2bd', accent: '#e0a13d', accent2: '#7ba05b' , pop: '#d4527e' },
  },
  {
    id: 'white-peach',
    name: '白桃烏龍',
    story: '白桃的粉、茶湯的暖：甜而不膩的那一杯。',
    origin: '水果',
    vars: { paper: '#fefcfb', surface: '#fdeee9', ink: '#4d3a3a', inkMuted: '#8a6f6c', inkFaint: '#c0a5a0', line: '#f2dcd4', accent: '#dd8f78', accent2: '#9db08a' },
  },
  {
    id: 'greengage',
    name: '青梅',
    story: '梅子未熟的青與釀成之後的琥珀黃。',
    origin: '水果',
    vars: { paper: '#fcfdfa', surface: '#eff5e4', ink: '#3d4634', inkMuted: '#6e7c5f', inkFaint: '#a0ad8d', line: '#dde6cb', accent: '#7f9e54', accent2: '#cf9f45' , pop: '#c94f6d' },
  },
  {
    id: 'mikan',
    name: '蜜柑',
    story: '冬天窗台上那顆蜜柑：橙皮的暖、葉梗的綠。',
    origin: '水果',
    vars: { paper: '#fefdfb', surface: '#fcefe0', ink: '#4c4036', inkMuted: '#8b7461', inkFaint: '#bfa78f', line: '#f0dfc8', accent: '#d98a3f', accent2: '#5f7d6d' , pop: '#4e6e8e' },
  },
  // ── 中國色 ──
  {
    id: 'dai-blue',
    name: '黛藍月白',
    story: '黛色遠山、月白宣紙：一點緗黃收筆。',
    origin: '中國色',
    vars: { paper: '#fbfcfd', surface: '#e8edf2', ink: '#2b3a4a', inkMuted: '#5d6f80', inkFaint: '#91a1b0', line: '#d2dce4', accent: '#45617e', accent2: '#b28e5a' , pop: '#b3452e' },
  },
  {
    id: 'yanzhi',
    name: '胭脂素絹',
    story: '胭脂壓灰、素絹作底，竹青一線提神。',
    origin: '中國色',
    vars: { paper: '#fdfbfa', surface: '#f5e9e7', ink: '#45302f', inkMuted: '#7d6260', inkFaint: '#b09692', line: '#e8d5d1', accent: '#a44a4a', accent2: '#6b7d6a' },
  },
  {
    id: 'zhu-yue',
    name: '竹月藕荷',
    story: '竹影裡的月色綠，配一點藕荷的紫灰。',
    origin: '中國色',
    vars: { paper: '#fcfcfb', surface: '#ecefe9', ink: '#37403a', inkMuted: '#687568', inkFaint: '#99a498', line: '#d6ddd3', accent: '#5e7d6f', accent2: '#9a7f96' },
  },
];

/*
 * 紙面材質。全部程式生成（SVG 噪聲／CSS 漸層），無外部素材、無授權問題；
 * 透明度壓到 2–4%，只在近看時給紙一點手感，不搶正文。
 */
const FIBER_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")`;

export const TEXTURES = [
  { id: 'none', name: '無', story: '素面，最乾淨。', css: 'none' },
  { id: 'fiber', name: '手工紙', story: '纖維噪點，宣紙的手感。', css: FIBER_SVG },
  {
    id: 'laid',
    name: '簾紋',
    story: '古法抄紙的簾線，橫向細紋。',
    css: 'repeating-linear-gradient(0deg, rgba(60,50,40,0.022) 0px, rgba(60,50,40,0.022) 1px, transparent 1px, transparent 4px)',
  },
  {
    id: 'linen',
    name: '布紋',
    story: '亞麻的十字織理，極淡。',
    css: 'repeating-linear-gradient(0deg, rgba(60,55,45,0.016) 0px, rgba(60,55,45,0.016) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(90deg, rgba(60,55,45,0.016) 0px, rgba(60,55,45,0.016) 1px, transparent 1px, transparent 3px)',
  },
  {
    id: 'grain',
    name: '細點',
    story: '版畫紙的細顆粒。',
    css: 'radial-gradient(rgba(60,50,40,0.035) 0.5px, transparent 0.5px)',
    size: '7px 7px',
  },
];

export const DEFAULT_PALETTE_ID = 'neutral-interim';
export const DEFAULT_TEXTURE_ID = 'none';
const STORAGE_KEY = 'canvaslab:palette';
const TEXTURE_KEY = 'canvaslab:texture';

// palette 角色 → 全站 token。line-soft 與 accent-soft 由 surface 代位（同為鉻件淡色）。
const ROLE_TO_TOKEN = {
  paper: '--c-paper',
  surface: '--c-surface',
  ink: '--c-ink',
  inkMuted: '--c-ink-muted',
  inkFaint: '--c-ink-faint',
  line: '--c-line',
  accent: '--c-accent',
  accent2: '--c-info',
};

export function getPalette(id) {
  return PALETTES.find((p) => p.id === id) ?? null;
}

export function applySitePalette(id) {
  const root = document.documentElement;
  const extras = ['--c-line-soft', '--c-accent-soft', '--c-pop', '--c-accent-grad'];
  if (!id || id === DEFAULT_PALETTE_ID) {
    Object.values(ROLE_TO_TOKEN).forEach((t) => root.style.removeProperty(t));
    extras.forEach((t) => root.style.removeProperty(t));
    return;
  }
  const p = getPalette(id);
  if (!p) return;
  Object.entries(ROLE_TO_TOKEN).forEach(([role, token]) => {
    root.style.setProperty(token, p.vars[role]);
  });
  root.style.setProperty('--c-line-soft', p.vars.surface);
  root.style.setProperty('--c-accent-soft', p.vars.surface);
  if (p.vars.pop) root.style.setProperty('--c-pop', p.vars.pop);
  else root.style.removeProperty('--c-pop');
  if (p.accentGradient) root.style.setProperty('--c-accent-grad', p.accentGradient);
  else root.style.removeProperty('--c-accent-grad');
}

export function getSitePaletteId() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && getPalette(saved)) return saved;
  } catch { /* ignore */ }
  return DEFAULT_PALETTE_ID;
}

export function setSitePalette(id) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch { /* ignore */ }
  applySitePalette(id);
}

export function getTexture(id) {
  return TEXTURES.find((t) => t.id === id) ?? null;
}

export function applySiteTexture(id) {
  const root = document.documentElement;
  const t = getTexture(id);
  if (!t || t.id === 'none') {
    root.style.removeProperty('--paper-texture');
    root.style.removeProperty('--paper-texture-size');
    return;
  }
  root.style.setProperty('--paper-texture', t.css);
  root.style.setProperty('--paper-texture-size', t.size ?? 'auto');
}

export function getSiteTextureId() {
  try {
    const saved = localStorage.getItem(TEXTURE_KEY);
    if (saved && getTexture(saved)) return saved;
  } catch { /* ignore */ }
  return DEFAULT_TEXTURE_ID;
}

export function setSiteTexture(id) {
  try {
    localStorage.setItem(TEXTURE_KEY, id);
  } catch { /* ignore */ }
  applySiteTexture(id);
}

/** 開站時套用使用者選過的全站色票與紙面材質（main.jsx 呼叫，early、避免閃色）。 */
export function bootSitePalette() {
  applySitePalette(getSitePaletteId());
  applySiteTexture(getSiteTextureId());
}

export function tokensSnippet(p) {
  const lines = Object.entries(ROLE_TO_TOKEN).map(([role, token]) => `  ${token}: ${p.vars[role]};`);
  if (p.vars.pop) lines.push(`  --c-pop: ${p.vars.pop};`);
  if (p.accentGradient) lines.push(`  --c-accent-grad: ${p.accentGradient};`);
  return `/* palette: ${p.name} (${p.id}) — from PaletteLab */\n:root {\n${lines.join('\n')}\n  --c-line-soft: ${p.vars.surface};\n  --c-accent-soft: ${p.vars.surface};\n}`;
}
