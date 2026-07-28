import { ArrowUpRight, Download } from 'lucide-react';
import FontSizeControl, { useFontScale } from '../../components/FontSizeControl';
import AppearanceMenu from '../../components/AppearanceMenu';
import DashboardLayout from '../../components/lab/DashboardLayout';
import data from '../../data/userscripts.json';

/*
 * 一支腳本的落地頁。三支共用這一個，各自的路由檔只傳 id 進來——三頁的骨架完全一樣
 * （做什麼、要什麼權限、怎麼裝、改過什麼），差別全在 userscripts.json 的那一筆。
 *
 * 權限那一節不是裝飾。使用者腳本在它跑到的頁面裡有完整的執行權限，而 @match 與 @grant
 * 是唯一能事前判斷「它到得了哪裡、做得到什麼」的東西——尤其 fjud 那條萬用 @match 涵蓋
 * 所有網站。所以每一條 @match 與 @grant 都逐條印出來並附一句為什麼，不摺進手風琴、也不
 * 推給「詳見原始碼」。
 *
 * SEO 走 PAGE_META（`_userscripts/seo.js`），這裡不自己掛 SeoHead——那會變成同一頁有兩個
 * 地方寫 title。
 */
export default function ScriptPage({ id }) {
  const [scale, setScale] = useFontScale();
  const entry = data.scripts.find((s) => s.id === id);
  const install = `/scripts/${entry.file}`;

  return (
    <DashboardLayout
      scale={scale}
      headerRight={
        <>
          <FontSizeControl scale={scale} onChange={setScale} />
          <AppearanceMenu />
        </>
      }
      eyebrow={data.site.eyebrow}
      title={entry.name}
      summary={entry.summary}
      tocLabel="本頁區塊"
    >
      <p className="font-accent text-token-xs text-ink-muted">
        {entry.latin} · v{entry.version} · MIT
      </p>

      <section className="mt-8">
        <h2 id="what" className="font-display text-token-lg text-ink">這支腳本做什麼</h2>
        <div className="mt-3 space-y-4">
          {entry.body.map((para, i) => (
            <p key={i} className="max-w-3xl text-token-base leading-relaxed text-ink">{para}</p>
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 id="permissions" className="font-display text-token-lg text-ink">它跑在哪裡、要什麼權限</h2>
        <p className="mt-3 max-w-3xl text-token-base leading-relaxed text-ink">{entry.grantNote}</p>

        <h3 id="matches" className="mt-8 font-display text-token-base text-ink">執行的頁面（@match）</h3>
        <dl className="mt-3 space-y-3">
          {entry.matches.map((m) => (
            <div key={m.pattern}>
              <dt className="break-all font-mono text-token-sm text-ink">{m.pattern}</dt>
              <dd className="mt-1 max-w-3xl text-token-sm leading-relaxed text-ink-muted">{m.why}</dd>
            </div>
          ))}
        </dl>

        {entry.grants.length > 0 ? (
          <>
            <h3 id="grants" className="mt-8 font-display text-token-base text-ink">要的腳本管理器權限（@grant）</h3>
            <dl className="mt-3 space-y-3">
              {entry.grants.map((g) => (
                <div key={g.name}>
                  <dt className="font-mono text-token-sm text-ink">{g.name}</dt>
                  <dd className="mt-1 max-w-3xl text-token-sm leading-relaxed text-ink-muted">{g.why}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 id="install" className="font-display text-token-lg text-ink">安裝</h2>
        <ol className="mt-3 max-w-3xl space-y-2 text-token-base leading-relaxed text-ink">
          <li>1. 先裝 Tampermonkey 或 Violentmonkey 這類腳本管理器。</li>
          <li>2. 點下面這個連結，管理器會跳出安裝畫面。</li>
          {entry.shortcut ? (
            <li>3. 裝好之後，Mac 按 {entry.shortcut.mac}，Windows 與 Linux 按 {entry.shortcut.other}。</li>
          ) : (
            <li>3. 開啟或重新整理 {entry.targetLabel} 的頁面。</li>
          )}
        </ol>

        {/* 靜態檔，不走 react-router：<a> 讓瀏覽器整頁請求它，腳本管理器才攔得到。 */}
        <a
          href={install}
          className="mt-6 inline-flex items-center gap-2 rounded-token-sm border border-accent px-4 py-2 text-token-sm text-accent transition-colors duration-fast hover:bg-accent hover:text-paper"
        >
          <Download size={15} className="shrink-0" />
          安裝 {entry.file}
        </a>

        <p className="mt-4 max-w-3xl text-token-sm leading-relaxed text-ink-muted">
          這個網址同時是腳本宣告的更新來源，裝好的副本從此固定查它。原始碼在{' '}
          <a
            href={entry.repo}
            className="underline decoration-line decoration-dotted underline-offset-[4px] transition-colors duration-fast hover:text-accent"
          >
            GitHub
            <ArrowUpRight size={13} className="ml-0.5 inline-block align-[-1px]" />
          </a>
          ，也可以先讀完再裝。
        </p>
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 id="changelog" className="font-display text-token-lg text-ink">版本紀錄</h2>
        <div className="mt-4 space-y-6">
          {entry.changelog.map((rel) => (
            <div key={rel.version}>
              <p className="font-accent text-token-xs tabular-nums text-ink-muted">
                v{rel.version} · {rel.date}
              </p>
              <ul className="mt-2 space-y-1.5">
                {rel.notes.map((note, i) => (
                  <li key={i} className="max-w-3xl text-token-sm leading-relaxed text-ink">{note}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
