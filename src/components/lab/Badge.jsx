/*
 * Small text chip. Tone names are the semantic color slots from tokens.css —
 * a caller can pick a meaning (danger, success) or a categorical slot
 * (cat-1 … cat-8), and never a raw color.
 */
const TONES = new Set([
  'danger', 'warning', 'success', 'info', 'neutral',
  'cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6', 'cat-7', 'cat-8',
]);

function vars(tone) {
  const prefix = tone.startsWith('cat-') ? tone : `status-${tone}`;
  return { color: `var(--${prefix}-tx)`, background: `var(--${prefix}-bg)` };
}

export default function Badge({ tone = 'neutral', children, className = '' }) {
  const safe = TONES.has(tone) ? tone : 'neutral';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-token-xs leading-tight ${className}`}
      style={vars(safe)}
    >
      {children}
    </span>
  );
}
