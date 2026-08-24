import Math from '../../components/lab/Math';

/*
 * 帶行內 LaTeX 的一段文字。arXiv 的摘要原文就夾著 $\theta_0$ 這種記法，照純文字印
 * 出來就是錢字號原樣掛在句子裡；這裡把 $…$ 段交給 KaTeX（與全站同一條產線），
 * 其餘照印。只認行內式——摘要裡沒有 display math，$$ 也不該在一行摘要裡出現。
 */
export default function MathText({ text }) {
  if (typeof text !== 'string' || !text.includes('$')) return text ?? null;
  const parts = text.split(/\$([^$]+)\$/);
  if (parts.length === 1) return text;
  return parts.map((seg, i) => (i % 2 === 1 ? <Math key={i} tex={seg} /> : seg));
}
