import { useEffect, useRef, useState } from 'react';
import { Palette } from 'lucide-react';
import {
  PALETTES,
  TEXTURES,
  getSitePaletteId,
  setSitePalette,
  getSiteTextureId,
  setSiteTexture,
} from '../styles/palettes.js';

/*
 * Colour and paper, behind one button.
 *
 * These two settings already existed and were already global (they live in
 * localStorage and are applied at boot), but they could only be reached from
 * /palettelab — so in practice nobody changed them while reading. They belong
 * where the reading happens.
 *
 * They are behind a button rather than laid out along the toolbar because a
 * reading page can afford exactly one row of chrome. A palette strip and a
 * texture strip permanently visible above an essay is more interface than text.
 *
 * The palette swatches show the accent, not the paper: every paper in the set is
 * near-white by rule (a tinted reading surface is banned), so a row of paper
 * swatches would be a row of identical white squares.
 */
export default function AppearanceMenu({ lang = 'zh' }) {
  const en = lang === 'en';
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(getSitePaletteId);
  const [texture, setTexture] = useState(getSiteTextureId);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choosePalette = (id) => { setSitePalette(id); setPalette(id); };
  const chooseTexture = (id) => { setSiteTexture(id); setTexture(id); };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="inline-flex items-center gap-1.5 rounded-token-sm border border-line-soft px-2 py-1 text-token-xs text-ink-muted transition-colors duration-fast hover:border-line hover:text-ink"
      >
        <Palette size={13} />
        {en ? 'Appearance' : '外觀'}
      </button>

      {open ? (
        <div
          className="absolute right-0 z-50 mt-1.5 w-[17rem] rounded-token-md border border-line-soft bg-paper p-3 shadow-token-sm"
          role="menu"
        >
          <p className="mb-2 font-accent text-token-xs uppercase tracking-[0.12em] text-ink-faint">
            {en ? 'Colour' : '色票'}
          </p>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => choosePalette(p.id)}
                title={p.name}
                aria-label={p.name}
                aria-pressed={palette === p.id}
                className="h-6 w-6 rounded-full border transition-transform duration-fast hover:scale-110"
                style={{
                  backgroundColor: p.vars.accent,
                  borderColor: palette === p.id ? 'var(--c-ink)' : 'var(--c-line-soft)',
                  borderWidth: palette === p.id ? '2px' : '1px',
                }}
              />
            ))}
          </div>

          <p className="mb-2 font-accent text-token-xs uppercase tracking-[0.12em] text-ink-faint">
            {en ? 'Paper' : '紙紋'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TEXTURES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => chooseTexture(t.id)}
                title={t.story}
                aria-pressed={texture === t.id}
                className="rounded-token-sm border px-2 py-1 text-token-xs transition-colors duration-fast"
                style={{
                  borderColor: texture === t.id ? 'var(--c-ink)' : 'var(--c-line-soft)',
                  color: texture === t.id ? 'var(--c-ink)' : 'var(--c-ink-faint)',
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
