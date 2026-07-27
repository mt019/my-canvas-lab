import { useEffect } from 'react';
import { Dices, ExternalLink, X } from 'lucide-react';

// 頁內 PDF 檢視彈窗，取代開新分頁。src 需為可內嵌 iframe 的 URL——本站 /api/pdf 代理
// 已設 Content-Disposition: inline，故 Release 上的 PDF 都能頁內看；外站原檔（會被 X-Frame
// 擋、或不在本倉）仍應由呼叫端走新分頁，不要傳進來。
//
// roll（選配）＝「隨機翻閱」脈絡：threads 是往下讀的跳點（{label, run}，如同作者／同一出處），
// onReroll 換一篇。跳點不加標題字樣，label 本身（「陳弘毅 另 2 篇」）已經說得夠清楚。
// 這組脈絡最早長在司法院外國法譯本頁的閱讀器上，抽成共用元件供中研院出版品頁一同使用。
export default function PdfViewer({ src, title, subtitle, onClose, roll }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const threads = (roll?.threads || []).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/70 px-3 pb-3 pt-2 sm:px-8 sm:pb-6 sm:pt-2" onClick={onClose}>
      <div
        className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-token-lg border border-line bg-paper shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line-soft px-4 py-1.5">
          <div className="min-w-0 flex-1 truncate">
            <span className="text-token-sm font-semibold text-ink">{title}</span>
            {subtitle ? <span className="ml-2 text-token-xs text-ink-muted">{subtitle}</span> : null}
          </div>
          {/* 順藤摸瓜跳點：桌機併進標題列，省下一整條橫槓的垂直空間；窄螢幕塞不下，另起一列（見下） */}
          {threads.length ? (
            <div className="hidden shrink-0 items-center gap-2.5 border-l border-line-soft pl-3 text-token-xs text-ink-muted lg:flex">
              {threads.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={t.run}
                  className="whitespace-nowrap transition-colors duration-fast hover:text-accent"
                >
                  {t.label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex shrink-0 items-center gap-1.5">
            {roll?.onReroll ? (
              <button
                type="button"
                onClick={roll.onReroll}
                title="換一篇（隨機）"
                className="inline-flex items-center gap-1 rounded-token-md border border-line px-2 py-1 text-token-xs font-semibold text-ink-muted transition-colors duration-fast hover:border-accent hover:text-accent"
              >
                <Dices size={12} /> 換一篇
              </button>
            ) : null}
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              title="新分頁開啟"
              className="inline-flex items-center gap-1 rounded-token-md border border-line px-2 py-1 text-token-xs font-semibold text-ink-muted transition-colors duration-fast hover:border-accent hover:text-accent"
            >
              新分頁 <ExternalLink size={12} />
            </a>
            <button
              type="button"
              onClick={onClose}
              title="關閉（Esc）"
              className="inline-flex items-center gap-1 rounded-token-md border border-line px-2 py-1 text-token-xs font-semibold text-ink-muted transition-colors duration-fast hover:border-accent hover:text-accent"
            >
              關閉 <X size={12} />
            </button>
          </div>
        </div>
        {threads.length ? (
          <div className="flex items-center gap-3 overflow-x-auto border-b border-line-soft px-4 py-1.5 text-token-xs text-ink-muted lg:hidden">
            {threads.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={t.run}
                className="shrink-0 whitespace-nowrap transition-colors duration-fast hover:text-accent"
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}
        <iframe title={title} src={src} className="min-h-0 flex-1 bg-surface" />
      </div>
    </div>
  );
}
