/*
 * Kicker line above a page or section title. This is the only place the
 * accent (typewriter) font is allowed by default — large, sparse, decorative.
 */
export default function Eyebrow({ children, className = '' }) {
  return (
    <div
      className={`font-accent text-token-sm uppercase tracking-[0.22em] text-ink-faint ${className}`.trim()}
    >
      {children}
    </div>
  );
}
