// 全站日期「顯示層」的單一格式化來源。
//
// 資料層一律以 ISO 8601 為正典儲存值（YYYY／YYYY-MM／YYYY-MM-DD），因為可排序、可解析；
// 凡是要「顯示給人看」的日期一律過這裡，避免各頁各印各的，也避免 ISO 內部連字號與範圍分隔符
// 糊成一排橫槓（例：`2015-10-01 – 2023-09-30` 分不清哪個是日期內、哪個是起訖）。
//
// 精度自適應：只到年就只印年，只到月就印到月。跟語言走：中文出「2015年10月1日」，
// 英文出「Oct 1, 2015」。匯出（BibTeX／CSV）與檔名時間戳仍用 ISO，不走這裡。

const EN_MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 單一日期：ISO → 人類可讀。非 ISO 字串原樣返回（不猜、不報錯）。
export function formatDate(iso, lang = 'zh') {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  if (!m) return String(iso);
  const y = m[1];
  const mo = m[2] ? Number(m[2]) : null;
  const d = m[3] ? Number(m[3]) : null;
  if (lang === 'en') {
    if (!mo) return y;
    if (!d) return `${EN_MONTH[mo - 1]} ${y}`;
    return `${EN_MONTH[mo - 1]} ${d}, ${y}`;
  }
  let out = `${y}年`;
  if (mo) out += `${mo}月`;
  if (d) out += `${d}日`;
  return out;
}

// 日期範圍：起訖各自 formatDate 後用「有間距的 en dash」連接。年月日內已無連字號，範圍分隔清楚。
// end 為 null／空＝進行中，用 openLabel（預設中文「現任」、英文 present）。
export function formatDateRange(start, end, { lang = 'zh', openLabel } = {}) {
  const open = openLabel ?? (lang === 'en' ? 'present' : '現任');
  return `${formatDate(start, lang)} – ${end ? formatDate(end, lang) : open}`;
}
