import { useMemo, useState } from 'react';
import HoverCard from '../../components/lab/HoverCard';
import view from '../../data/chenYinke/liu-rushi-edition/pilot-view.json';
import styles from './LiuRushiEdition.module.css';

// The reading surface stays quiet; each documentary layer appears only when the
// reader asks for it. Defaults are all off — the point is the text first.
const LAYERS = [
  { id: 'sources', label: '材料來源', hint: '在引文上方標出出處' },
  { id: 'cases', label: '寅恪案', hint: '標出陳寅恪自己的判斷' },
  { id: 'questions', label: '開放問題', hint: '標出「俟考」未決之處' },
  { id: 'xref', label: '跨章', hint: '標出通往其他章的線索' },
  { id: 'people', label: '人物', hint: '標出人物與其別名' },
  { id: 'context', label: '編者脈絡', hint: '顯示分段標題與判斷語氣' },
];

const CERTAINTY = {
  explicit: '明示',
  argued: '論證',
  inferred: '推論',
  'open-question': '存疑',
};

function EntityCard({ entity }) {
  const others = (entity.aliases || []).filter((a) => a !== entity.label);
  return (
    <div className={styles.entityCard}>
      <span className={styles.entityCardName}>{entity.label}</span>
      {others.length ? <span className={styles.entityCardAliases}>{others.join('・')}</span> : null}
      {entity.gloss ? <p className={styles.entityCardGloss}>{entity.gloss}</p> : null}
    </div>
  );
}

function useEntityMatcher(enabled) {
  return useMemo(() => {
    if (!enabled) return null;
    const map = [];
    for (const ent of view.entities) {
      for (const alias of [ent.label, ...(ent.aliases || [])]) {
        if (alias && alias.length >= 2) map.push([alias, ent]);
      }
    }
    // Longest alias first so 顧云美 wins over 云美 at the same position.
    map.sort((a, b) => b[0].length - a[0].length);
    const seen = new Set();
    const alts = map.filter(([a]) => (seen.has(a) ? false : seen.add(a)));
    const pattern = new RegExp(`(${alts.map(([a]) => a).join('|')})`, 'g');
    const canonical = new Map(alts);
    return { pattern, canonical };
  }, [enabled]);
}

function renderText(text, matcher, keyBase) {
  if (!matcher) return text;
  const out = [];
  let last = 0;
  let i = 0;
  matcher.pattern.lastIndex = 0;
  let m;
  while ((m = matcher.pattern.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const ent = matcher.canonical.get(m[0]);
    out.push(
      <HoverCard
        key={`${keyBase}-${i++}`}
        className={styles.entity}
        label={ent.label}
        card={<EntityCard entity={ent} />}
      >
        {m[0]}
      </HoverCard>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Segments({ segments, matcher, idBase }) {
  return segments.map((seg, i) =>
    seg.kind === 'note' ? (
      <span key={`${idBase}-n${i}`} className={styles.interlinear}>
        {seg.text}
      </span>
    ) : (
      <span key={`${idBase}-t${i}`}>{renderText(seg.text, matcher, `${idBase}-t${i}`)}</span>
    ),
  );
}

function Block({ block, layers, matcher }) {
  const inner = <Segments segments={block.segments} matcher={matcher} idBase={block.id} />;

  if (block.role === 'source') {
    return (
      <div className={styles.source}>
        {layers.sources && block.sourceRef ? (
          <span className={styles.sourceTag}>
            {[block.sourceRef.author, block.sourceRef.work, block.sourceRef.locator]
              .filter(Boolean)
              .join(' ')}
            {block.sourceRef.item ? `・${block.sourceRef.item}` : ''}
          </span>
        ) : null}
        <p>{inner}</p>
      </div>
    );
  }

  const isCase = block.role === 'yinke-case';
  const flagQuestion = layers.questions && block.openQuestion;
  const cls = [
    styles.prose,
    isCase ? styles.case : '',
    isCase && layers.cases ? styles.caseOn : '',
    flagQuestion ? styles.question : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <p className={cls}>
      {isCase ? <span className={styles.caseMark}>寅恪案</span> : null}
      {inner}
      {flagQuestion ? <span className={styles.questionMark}>俟考</span> : null}
      {layers.xref && block.crossReference ? (
        <span className={styles.xref} title={`「${block.crossReference.sourceText}」`}>
          ⇒ {block.crossReference.target}
        </span>
      ) : null}
    </p>
  );
}

function UnitContext({ unit }) {
  if (!unit.note && (!unit.claims || unit.claims.length === 0)) return null;
  return (
    <aside className={styles.context}>
      <span className={styles.contextTitle}>{unit.title}</span>
      {unit.note ? <p>{unit.note}</p> : null}
      {unit.claims?.length ? (
        <ul className={styles.claims}>
          {unit.claims.map((c, i) => (
            <li key={i}>
              <span className={styles.certainty} data-c={c.certainty}>
                {CERTAINTY[c.certainty] ?? c.certainty}
              </span>
              {c.text}
            </li>
          ))}
        </ul>
      ) : null}
      {unit.witnesses?.length ? (
        <p className={styles.witnesses}>
          異本：{unit.witnesses.join('、')}
          {unit.preferredWitness ? `（以${unit.preferredWitness}為善）` : ''}
        </p>
      ) : null}
    </aside>
  );
}

export default function LiuRushiEdition() {
  const [active, setActive] = useState({});
  const matcher = useEntityMatcher(active.people);

  const counts = useMemo(() => {
    let sources = 0;
    let cases = 0;
    let questions = 0;
    let xref = 0;
    for (const u of view.units)
      for (const b of u.blocks) {
        if (b.role === 'source' && b.sourceRef) sources += 1;
        if (b.role === 'yinke-case') cases += 1;
        if (b.openQuestion) questions += 1;
        if (b.crossReference) xref += 1;
      }
    return { sources, cases, questions, xref };
  }, []);

  const toggle = (id) => setActive((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <p className={styles.eyebrow}>細讀樣章</p>
        <h2 className={styles.chapter}>{view.chapter}</h2>
        <p className={styles.lede}>
          陳寅恪由三種顧苓的材料，一步步推回《河東君傳》的可信度與缺口。正文保持安靜；材料出處、
          陳寅恪的判斷、未決的疑問與跨章線索，都只在你按下時才顯現。
        </p>
        <p className={styles.locator}>
          來源定位：{view.chapter.slice(0, 3)} · {view.scope.sourceFile.replace('OEBPS/', '')} ·{' '}
          {view.scope.fromBlock}–{view.scope.toBlock} · 共 {view.scope.blockCount} 段
        </p>
      </div>

      <div className={styles.toolbar} role="group" aria-label="顯影層">
        <span className={styles.toolbarLabel}>顯影</span>
        {LAYERS.map((layer) => {
          const n = counts[layer.id];
          return (
            <button
              key={layer.id}
              type="button"
              className={styles.chip}
              aria-pressed={!!active[layer.id]}
              onClick={() => toggle(layer.id)}
              title={layer.hint}
            >
              {layer.label}
              {n ? <span className={styles.chipCount}>{n}</span> : null}
            </button>
          );
        })}
      </div>

      <div className={styles.reading}>
        {view.units.map((unit) => (
          <section key={unit.id} className={styles.unit}>
            {active.context ? <UnitContext unit={unit} /> : null}
            {unit.blocks.map((block) => (
              <Block key={block.id} block={block} layers={active} matcher={matcher} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
