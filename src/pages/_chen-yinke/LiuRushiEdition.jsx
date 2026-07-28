import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HoverCard from '../../components/lab/HoverCard';
import ArticleLayout from '../../components/lab/ArticleLayout';
import BookTree from '../../components/lab/BookTree';
import readingView from '../../data/chenYinke/liu-rushi-edition/reading-view.json';
import styles from './LiuRushiEdition.module.css';
import { CHEN_SELECTION_PATH } from '../../lib/chenYinkeSeo';

const candidateLayers = [
  { id: 'sources', label: '材料來源', hint: '在引文上方標出出處' },
  { id: 'cases', label: '寅恪案', hint: '標出陳寅恪自己的判斷' },
  { id: 'questions', label: '開放問題', hint: '標出「俟考」未決之處' },
  { id: 'xref', label: '跨章', hint: '標出通往其他章的線索' },
  { id: 'people', label: '人物', hint: '標出人物與其別名' },
  { id: 'context', label: '編者解讀', hint: '顯示明確標示的編者分段、說明與解讀' },
];
const BOOK_ITEMS = readingView.selections.map((selection) => ({
  id: selection.id,
  title: selection.label.replace(/^(卷前|第[一二三四五]章)・/, ''),
  group: readingView.workProgress.sections
    .find((section) => section.id === selection.sectionId)?.title.split('　')[0],
}));

// The data contract withholds every unreviewed editorial layer. The frontend
// only offers controls for apparatus that is actually present in the public
// snapshot; it never tries to reconstruct research metadata.
export function availableLayers(view) {
  const hasLayer = {
    sources: view.units.some((u) => u.blocks.some((b) => b.sourceRef)),
    cases: view.units.some((u) => u.blocks.some((b) => b.role === 'yinke-case')),
    questions: view.units.some((u) => u.blocks.some((b) => b.openQuestion)),
    xref: view.units.some((u) => u.blocks.some((b) => b.crossReference)),
    people: (view.entities?.length ?? 0) > 0,
    context: view.units.some((u) => u.annotationIds?.length),
  };
  return candidateLayers.filter((layer) => hasLayer[layer.id]);
}

// Layer badge counts, shared by the reading face and the legend so the numbers
// on both stay in step with the data.
export function computeCounts(v) {
  let sources = 0;
  let cases = 0;
  let questions = 0;
  let xref = 0;
  for (const u of v.units)
    for (const b of u.blocks) {
      if (b.role === 'source' && b.sourceRef) sources += 1;
      if (b.role === 'yinke-case') cases += 1;
      if (b.openQuestion) questions += 1;
      if (b.crossReference) xref += 1;
    }
  return { sources, cases, questions, xref };
}

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
      <span className={styles.entityCardMeta}>原文稱謂索引</span>
      {entity.gloss ? <p className={styles.entityCardGloss}>{entity.gloss}</p> : null}
    </div>
  );
}

export function useEntityMatcher(view, enabled) {
  return useMemo(() => {
    if (!enabled) return null;
    const map = [];
    for (const ent of view.entities ?? []) {
      for (const alias of new Set((ent.mentions || []).map((mention) => mention.matchedText))) {
        if (alias && alias.length >= 2) map.push([alias, ent]);
      }
    }
    // Longest alias first so 顧云美 wins over 云美 at the same position.
    map.sort((a, b) => b[0].length - a[0].length);
    const seen = new Set();
    const alts = map.filter(([a]) => (seen.has(a) ? false : seen.add(a)));
    if (!alts.length) return null;
    const pattern = new RegExp(`(${alts.map(([a]) => a).join('|')})`, 'g');
    const canonical = new Map(alts);
    return { pattern, canonical };
  }, [view, enabled]);
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
    seg.kind === 'author-marker' ? (
      <span key={`${idBase}-m${i}`} className={styles.caseMark}>
        {seg.text}
      </span>
    ) : seg.kind === 'note' ? (
      <span key={`${idBase}-n${i}`} className={styles.interlinear}>
        {renderText(seg.text, matcher, `${idBase}-n${i}`)}
      </span>
    ) : seg.kind === 'inline-glyph' ? (
      <img key={`${idBase}-g${i}`} className={styles.inlineGlyph} src={seg.asset} alt={seg.alt} />
    ) : (
      <span key={`${idBase}-t${i}`}>{renderText(seg.text, matcher, `${idBase}-t${i}`)}</span>
    ),
  );
}

export function Block({ block, layers, matcher }) {
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

export function UnitContext({ unit, annotationById }) {
  const annotations = (unit.annotationIds ?? []).map((id) => annotationById.get(id)).filter(Boolean);
  if (!annotations.length) return null;
  const heading = annotations.find((annotation) => annotation.target.placement === 'heading');
  const notes = annotations.filter((annotation) => annotation.target.placement === 'note');
  const interpretations = annotations.filter((annotation) => annotation.target.placement === 'interpretation');
  return (
    <aside className={styles.context}>
      {heading ? (
        <span className={styles.contextTitle}>
          <span className={styles.certainty}>{heading.displayLabel}</span>
          {heading.text}
        </span>
      ) : null}
      {notes.map((annotation) => (
        <p key={annotation.id}>
          <span className={styles.certainty}>{annotation.displayLabel}</span>
          {annotation.text}
        </p>
      ))}
      {interpretations.length ? (
        <ul className={styles.claims}>
          {interpretations.map((annotation) => (
            <li key={annotation.id}>
              <span className={styles.certainty} data-c={annotation.sourceStance}>
                {annotation.displayLabel}
                {annotation.sourceStance ? `・${CERTAINTY[annotation.sourceStance] ?? annotation.sourceStance}` : ''}
              </span>
              {annotation.text}
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

export default function LiuRushiEdition({ initialSelectionId }) {
  const navigate = useNavigate();
  const initialId = readingView.selections.some((selection) => selection.id === initialSelectionId)
    ? initialSelectionId
    : readingView.selections[0].id;
  const [selectionId, setSelectionId] = useState(initialId);
  const view = readingView.selections.find((selection) => selection.id === selectionId);
  const layers = useMemo(() => availableLayers(view), [view]);
  const allOn = useMemo(() => Object.fromEntries(layers.map((layer) => [layer.id, true])), [layers]);
  const [active, setActive] = useState(() => ({ ...allOn }));
  const matcher = useEntityMatcher(view, active.people);
  const annotationById = useMemo(
    () => new Map((view.publicAnnotations ?? []).map((annotation) => [annotation.id, annotation])),
    [view],
  );

  const counts = useMemo(() => computeCounts(view), [view]);

  useEffect(() => {
    if (initialSelectionId && initialSelectionId !== selectionId) {
      setSelectionId(initialSelectionId);
      const next = readingView.selections.find((selection) => selection.id === initialSelectionId);
      setActive(Object.fromEntries(availableLayers(next).map((layer) => [layer.id, true])));
    }
  }, [initialSelectionId, selectionId]);

  const toggle = (id) => setActive((s) => ({ ...s, [id]: !s[id] }));
  const anyOn = layers.some((l) => active[l.id]);
  const setAll = () => setActive(anyOn ? {} : { ...allOn });
  const select = (id) => {
    const next = readingView.selections.find((selection) => selection.id === id);
    setSelectionId(id);
    setActive(Object.fromEntries(availableLayers(next).map((layer) => [layer.id, true])));
    navigate(CHEN_SELECTION_PATH(id));
  };
  const attributionKind = view.textAttribution.representation === 'publisher-preface'
    ? '出版社說明'
    : '作者正文';
  const progressSummary = readingView.workProgress.summary
    .filter((group) => group.sections.length)
    .map((group) => `${group.label}：${group.sections.join('、')}`)
    .join('；');
  const meta = (
    <div>
      <p className={styles.locator}>
        文字責任：{view.textAttribution.displayLabel}（{attributionKind}）
      </p>
      <p className={styles.locator}>
        來源定位：{view.section.slice(0, 3)} · {view.scope.sourceFile.replace('OEBPS/', '')} ·{' '}
        {view.scope.contentFromBlock}–{view.scope.toBlock} · 共 {view.scope.blockCount} 段
      </p>
      <p className={styles.locator}>
        已整理原書區塊 {readingView.workProgress.selectedBlocks.toLocaleString()}／
        {readingView.workProgress.totalBlocks.toLocaleString()}；{progressSummary}
      </p>
    </div>
  );

  return (
    <ArticleLayout
      title={view.section}
      eyebrow="全書順序細讀"
      summary="以下依原書次序呈現；編者文字另行標示，關掉全部顯影後只留下逐字原文。"
      meta={meta}
      nav={(
        <BookTree
          items={BOOK_ITEMS}
          activeId={selectionId}
          label="原書次序"
          searchPlaceholder="搜尋選段…"
          onSelect={select}
        />
      )}
      hideToc
      compactReading
      mobileNavLabel="原書次序"
      scaleContent={false}
    >
      <div className={styles.wrap}>

        <div className={styles.toolbar} role="group" aria-label="顯影層">
        <span className={styles.toolbarLabel}>顯影</span>
        {layers.map((layer) => {
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
        <button
          type="button"
          className={styles.allToggle}
          onClick={setAll}
          title={anyOn ? '一鍵關掉所有顯影' : '一鍵開啟所有顯影'}
        >
          {anyOn ? '全關' : '全開'}
        </button>
        </div>

      {/* prose-body（全域）：重排本的正文是整段連續閱讀的面，吃灰階字體平滑，
          與 .mdx 長文同一條規則（見 src/index.css 與 DESIGN.md）。 */}
        <div className={`${styles.reading} prose-body`}>
        {view.units.map((unit) => (
          <section key={unit.id} className={styles.unit}>
            {active.context ? <UnitContext unit={unit} annotationById={annotationById} /> : null}
            {unit.blocks.map((block) => (
              <Block key={block.id} block={block} layers={active} matcher={matcher} />
            ))}
          </section>
        ))}
        </div>
      </div>
    </ArticleLayout>
  );
}
