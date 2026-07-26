import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';

const SHOW_AFTER = 560;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const scrollingDown = currentY > lastY.current;
        setVisible(currentY > SHOW_AFTER && scrollingDown);
        lastY.current = currentY;
        frame = 0;
      });
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const returnToTop = () => {
    setVisible(false);
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={returnToTop}
      aria-label="回到頁首"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      title="回到頁首"
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper/90 text-ink-faint shadow-sm backdrop-blur-sm transition-[opacity,transform,color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:right-6 ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <ArrowUp aria-hidden="true" size={16} strokeWidth={1.8} />
    </button>
  );
}
