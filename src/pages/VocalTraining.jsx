import { useEffect } from 'react';
import AppearanceMenu from '../components/AppearanceMenu';
import FontSizeControl, { useFontScale } from '../components/FontSizeControl';
import DashboardLayout from '../components/lab/DashboardLayout';
import { useTabParams } from '../components/lab/Tabs';
import NowView from './_vocal-training/NowView';
import PiecesView from './_vocal-training/PiecesView';
import MethodView from './_vocal-training/MethodView';
import SourcesView from './_vocal-training/SourcesView';
import { meta, exercises, byId, positionOf } from './_vocal-training/shared';
import { VT_TITLE } from './_vocal-training/seo';

/*
 * 我的聲樂訓練。教材是 Vaccai《義大利歌唱實用法》（1832），二十二首以 Metastasio 詩句
 * 寫成的短練習。
 *
 * 資料來自分離的資料層（`src/data/vocalTraining.json`，同步產物），這一頁只負責顯示——
 * 包括「現在練哪一首」也是資料說了算（`meta.currentExercise`），前端不寫死曲號。
 * **倉庫名、同步方式這些作業細節只准留在註解與工程文件，不准出現在畫面上的文字**
 * （HANDOFF 開頭的全站硬規則）。
 *
 * 分頁維度有兩個（主分頁＋二十二首那頁的技術分類篩選），所以用 useTabParams 一次寫：
 * 兩個 useTabParam 各自關住自己那份查詢字串快照，同一次點擊寫兩個鍵會掉一個。
 */
export default function VocalTraining() {
  const [scale, setScale] = useFontScale();
  const [{ tab, family }, setTabs] = useTabParams({ tab: 'now', family: 'all' });
  const current = byId[meta.currentExercise];
  const verifiedCount = exercises.filter((ex) => ex.source.verified).length;

  useEffect(() => {
    // 用 SEO 那份常量，別在這裡另寫一份短標題——它會蓋掉 SeoHead 設好的 <title>
    document.title = VT_TITLE;
  }, []);

  return (
    <DashboardLayout
      scale={scale}
      back={{ href: '/', label: '回首頁' }}
      headerRight={
        <>
          <FontSizeControl scale={scale} onChange={setScale} />
          <AppearanceMenu />
        </>
      }
      eyebrow="Vaccai 1832 · Metastasio"
      title="聲樂訓練・Vaccai 練習本"
      summary={`Nicola Vaccai 的《義大利歌唱實用法》把技術練習寫成二十二首帶詞的小曲，詞全部取自 Metastasio 的劇本。這裡放我練到哪、每一首在練什麼、以及那些句子原本是誰在什麼處境下唱的。目前在練：${current.incipit}（${positionOf(current)}）。`}
      tabs={{
        label: '看哪一面',
        value: tab,
        onChange: (next) => setTabs({ tab: next, family: 'all' }, { scroll: 'top' }),
        items: [
          { id: 'now', label: '現在練這首' },
          { id: 'pieces', label: '二十二首', count: 22 },
          { id: 'method', label: '這本教材' },
          { id: 'sources', label: '出處與考證' },
        ],
      }}
      refreshKey={`${tab}-${family}`}
    >
      {tab === 'now' ? <NowView /> : null}
      {tab === 'pieces' ? (
        <PiecesView family={family} onFamilyChange={(next) => setTabs({ family: next })} />
      ) : null}
      {tab === 'method' ? <MethodView /> : null}
      {tab === 'sources' ? <SourcesView /> : null}

      {/* 這一行寫給讀者：涵蓋範圍與更新日。倉庫名、同步方式那些是作業細節，不上站
          （HANDOFF 開頭的全站硬規則）。 */}
      <p className="mt-12 border-t border-line-soft pt-5 text-token-xs leading-relaxed text-ink-muted">
        二十二首的義大利文原詞與中譯全部收錄；詞句在 Metastasio 劇本裡的原始場景已考證 {verifiedCount} 首、
        {22 - verifiedCount} 首待查，逐首標在各曲底下。更新日 {meta.updated}。
      </p>
    </DashboardLayout>
  );
}
