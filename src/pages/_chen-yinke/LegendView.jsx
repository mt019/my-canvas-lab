import { ArrowRight } from 'lucide-react';
import readingView from '../../data/chenYinke/liu-rushi-edition/reading-view.json';
import { availableLayers, Block, UnitContext, useEntityMatcher, computeCounts } from './LiuRushiEdition';
import edStyles from './LiuRushiEdition.module.css';
import styles from './Legend.module.css';

// Every example here is a real passage from 第三章, rendered by the same
// components as the reading face — so the legend can never drift from what the
// 細讀面 actually shows. Long blocks are clipped to a snippet.
const view = readingView.selections.find((selection) => selection.id === 'chapter-3-opening-chronology');
const layers = availableLayers(view);
const annotationById = new Map(view.publicAnnotations.map((annotation) => [annotation.id, annotation]));
const byId = {};
const unitById = {};
for (const u of view.units) {
  unitById[u.id] = u;
  for (const b of u.blocks) byId[b.id] = b;
}

function clip(block, n) {
  const text = block.segments.map((s) => s.text).join('');
  const short = text.length > n ? `${text.slice(0, n)}……` : text;
  return { ...block, segments: [{ kind: 'text', text: short }] };
}

const counts = computeCounts(view);

export default function LegendView({ onOpenReading }) {
  const matcher = useEntityMatcher(view, true);

  // One example per layer, keyed by layer id.
  const examples = {
    sources: <Block block={clip(byId['lrs-f156-b0019'], 40)} layers={{ sources: true }} matcher={null} />,
    cases: <Block block={clip(byId['lrs-f156-b0017'], 40)} layers={{ cases: true }} matcher={null} />,
    questions: <Block block={byId['lrs-f156-b0013']} layers={{ questions: true }} matcher={null} />,
    xref: <Block block={clip(byId['lrs-f156-b0010'], 22)} layers={{ xref: true }} matcher={null} />,
    people: <Block block={clip(byId['lrs-f156-b0003'], 24)} layers={{}} matcher={matcher} />,
    context: <UnitContext unit={unitById['lrs-pilot-01']} annotationById={annotationById} />,
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <p className={styles.eyebrow}>圖例</p>
        <h2 className={styles.title}>怎麼讀這個細讀面</h2>
        <p className={styles.lede}>
          「細讀原文」只顯示公開資料中確實存在的原文標記。你可以逐項關掉，或按「全關」只讀原文。
          這裡以第三章的實際段落示範；按鈕上的數字，是該標記在目前連續細讀範圍出現的次數。
        </p>
      </div>

      <div className={styles.rows}>
        {layers.map((layer) => (
          <section key={layer.id} className={styles.row}>
            <div className={styles.rowHead}>
              <span className={edStyles.chip} aria-pressed="true">
                {layer.label}
                {counts[layer.id] ? <span className={edStyles.chipCount}>{counts[layer.id]}</span> : null}
              </span>
              <p className={styles.hint}>{layer.hint}</p>
            </div>
            <div className={styles.example}>{examples[layer.id]}</div>
          </section>
        ))}
      </div>

      {onOpenReading ? (
        <div className={styles.footer}>
          <button type="button" className={styles.openLink} onClick={onOpenReading}>
            回細讀原文自己開關 <ArrowRight size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
