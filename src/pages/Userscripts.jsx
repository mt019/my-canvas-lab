import { Link } from 'react-router-dom';
import { ArrowRight, Download } from 'lucide-react';
import FontSizeControl, { useFontScale } from '../components/FontSizeControl';
import AppearanceMenu from '../components/AppearanceMenu';
import DashboardLayout from '../components/lab/DashboardLayout';
import data from '../data/userscripts.json';

/*
 * 使用者腳本的總覽頁：三支各一列，一句話、跑在哪、版號，以及兩條路——讀說明或直接裝。
 *
 * 一列上有兩個可點的東西（整列去落地頁、安裝鈕直接下載），所以整列不能是 <Link> 再把
 * <a> 包進去（巢狀連結，HTML 不合法，行為看瀏覽器心情）。改成整列一個 grid，標題那一格
 * 是連結、右側安裝鈕是另一個連結，兩者平行。
 */
export default function Userscripts() {
  const [scale, setScale] = useFontScale();
  const { site, scripts } = data;

  return (
    <DashboardLayout
      scale={scale}
      headerRight={
        <>
          <FontSizeControl scale={scale} onChange={setScale} />
          <AppearanceMenu />
        </>
      }
      eyebrow={site.eyebrow}
      title={site.title}
      summary={site.intro}
      tocLabel="本頁區塊"
    >
      <div className="divide-y divide-line-soft border-y border-line-soft">
        {scripts.map((s) => (
          <ScriptRow key={s.id} script={s} />
        ))}
      </div>

      <div className="mt-10 border-t border-line-soft pt-5">
        <p className="max-w-3xl text-token-sm leading-relaxed text-ink-muted">{site.note}</p>
      </div>
    </DashboardLayout>
  );
}

function ScriptRow({ script }) {
  return (
    <section className="py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <h2 id={script.id}>
            <Link
              to={`/userscripts/${script.id}`}
              className="group inline-flex items-baseline gap-2 font-display text-token-lg text-ink transition-colors duration-fast hover:text-accent"
            >
              {script.name}
              <ArrowRight
                size={15}
                className="shrink-0 translate-y-px text-ink-faint transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-accent"
              />
            </Link>
          </h2>
          <p className="mt-2 max-w-3xl text-token-sm leading-relaxed text-ink">{script.summary}</p>
          <p className="mt-2 font-accent text-token-xs text-ink-muted">
            {script.latin} · v{script.version} · {script.targetLabel}
          </p>
        </div>

        {/* 靜態檔，不走 react-router：<a> 讓瀏覽器整頁請求它，腳本管理器才攔得到。 */}
        <a
          href={`/scripts/${script.file}`}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-token-sm border border-line-soft px-3 py-1.5 text-token-sm text-ink-muted transition-colors duration-fast hover:border-accent hover:text-accent"
        >
          <Download size={14} className="shrink-0" />
          安裝
        </a>
      </div>
    </section>
  );
}
