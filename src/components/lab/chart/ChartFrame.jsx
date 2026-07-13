import { createContext, useContext } from 'react';

/*
 * The outer shell of every chart: viewBox, margins, a caption, and the
 * horizontal scroll container that keeps a wide chart from pushing the page
 * sideways (html has overflow-x: clip site-wide, so a chart that overflows is
 * simply unreachable — it must scroll inside its own box).
 *
 * Axes and marks read the geometry from context instead of taking six props
 * each.
 */
const FrameContext = createContext(null);

export function useFrame() {
  const frame = useContext(FrameContext);
  if (!frame) throw new Error('chart marks must be rendered inside <ChartFrame>');
  return frame;
}

export default function ChartFrame({
  width = 560,
  height = 260,
  margin = { top: 12, right: 12, bottom: 30, left: 44 },
  minWidth = 480,
  title,
  caption,
  children,
}) {
  const inner = {
    x0: margin.left,
    x1: width - margin.right,
    y0: height - margin.bottom,
    y1: margin.top,
    get w() { return this.x1 - this.x0; },
    get h() { return this.y0 - this.y1; },
  };

  return (
    <figure className="my-6">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          style={{ minWidth, maxWidth: width }}
          role="img"
          aria-label={title ?? caption}
        >
          <FrameContext.Provider value={{ width, height, margin, inner }}>
            {children}
          </FrameContext.Provider>
        </svg>
      </div>
      {caption ? (
        <figcaption className="mt-2 text-token-xs leading-relaxed text-ink-faint">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
