import { useRef } from 'react';
import Eyebrow from '../Eyebrow';
import Tabs from './Tabs';
import TableOfContents from './TableOfContents';
import SubOutline from './SubOutline';

/*
 * 儀表板版的三欄殼——`/brief` 手刻過，抽到這裡讓別的儀表板頁共用（DESIGN.md 元件表）。
 *
 * 跟文章版（ArticleLayout）是姊妹不是同一個：文章版有固定閱讀寬度（44rem）、兩欄都是整份
 * 目次，服務的是一篇長文；儀表板要的是**滿寬的內容欄**放一批批密集列，加一條**吸頂的分頁列**
 * 切「看哪一期／哪個視圖」，左欄只列區（h2），右欄是比左欄深一層的 SubOutline（跟著捲動、
 * 永遠攤開當前那一區）。兩種意圖不同，所以是兩個殼，不是一個殼硬吃兩種版型。
 *
 * header 會被捲走，分頁列吸在最上面永遠看得到——不像埋在正文一千多像素下面的舊版。兩側欄在
 * lg 以下收起：手機塞側欄比沒有側欄更糟（ArticleLayout 同此）。
 *
 * 頁面自己提供的：抬頭那一句、分頁項目、左欄目次上方那條（如緊急提醒）、內容。殼只負責版型
 * 與把 TOC／SubOutline 接到內容容器上。
 */
export default function DashboardLayout({
  scale,
  back,
  headerRight,
  eyebrow,
  title,
  summary,
  tabs,
  leftRailTop,
  tocLabel = '本頁區塊',
  refreshKey,
  children,
}) {
  const bodyRef = useRef(null);

  return (
    <main className="min-h-screen bg-paper paper-texture text-ink" style={{ '--reader-scale': scale }}>
      {/* 抬頭：捲走的那一段。返回、識別、一句話說明這頁是什麼。控制項收在右上。
          字級只放大識別那一塊（reader-scale），返回／控制項那一列固定不動；殼的
          max-w-6xl 框在 zoom 之外，所以放大字級不會動到左右邊界。 */}
      <header className="border-b border-line-soft">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            {back ? (
              <a href={back.href} className="text-token-sm text-ink-faint transition-colors duration-fast hover:text-accent">
                ← {back.label}
              </a>
            ) : (
              <span />
            )}
            {headerRight ? <div className="flex items-center gap-2">{headerRight}</div> : null}
          </div>
          <div className="reader-scale">
            {eyebrow ? <Eyebrow className="mb-2">{eyebrow}</Eyebrow> : null}
            <h1 className="font-display text-token-2xl leading-tight sm:text-token-3xl">{title}</h1>
            {summary ? (
              <p className="mt-3 max-w-3xl text-token-sm leading-relaxed text-ink-muted">{summary}</p>
            ) : null}
          </div>
        </div>
      </header>

      {/* 吸頂的分頁列：永遠看得到。底線由 Tabs 的 underline variant 自己畫，這層只負責吸頂與
          遮住捲到底下的內容。 */}
      <div className="sticky top-0 z-20 bg-paper">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Tabs
            variant="underline"
            label={tabs.label}
            value={tabs.value}
            onChange={tabs.onChange}
            items={tabs.items}
          />
        </div>
      </div>

      {/* 左欄目錄（區）＋寬內容欄＋右欄深一層（區底下的細目）。兩欄都在 lg 以下收起。 */}
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[12rem_minmax(0,1fr)_12rem] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-14 max-h-[calc(100vh-4.5rem)] overflow-y-auto border-r border-line-soft pb-10 pr-5">
            {leftRailTop}
            <TableOfContents containerRef={bodyRef} label={tocLabel} refreshKey={refreshKey} levels={[2]} />
          </div>
        </aside>

        <div ref={bodyRef} className="reader-scale">{children}</div>

        <aside className="hidden lg:block">
          <div className="sticky top-14 max-h-[calc(100vh-4.5rem)] overflow-y-auto pb-10 pl-5">
            <SubOutline containerRef={bodyRef} refreshKey={refreshKey} />
          </div>
        </aside>
      </div>
    </main>
  );
}
