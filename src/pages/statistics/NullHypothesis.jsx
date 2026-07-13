import { useMemo } from 'react';
import PageShell from '../../components/PageShell';
import FontSizeControl, { useFontScale } from '../../components/FontSizeControl';
import Prose from '../../components/lab/Prose';
import HoverCite from '../../components/lab/HoverCite';
import Article from '../../content/statistics/null-hypothesis.mdx';
import data from '../../data/statistics-null-hypothesis.json';
import LadyTastingTea from './_figures/LadyTastingTea';
import PUnderNull from './_figures/PUnderNull';
import TwoLogics from './_figures/TwoLogics';
import PHacking from './_figures/PHacking';
import SampleSizeAndEffect from './_figures/SampleSizeAndEffect';
import PositivePredictiveValue from './_figures/PositivePredictiveValue';
import Misreadings from './_figures/Misreadings';
import Timeline from './_figures/Timeline';

/*
 * The article shell. It owns three things the .mdx does not: which figures exist,
 * what parameters they run with, and where the citations come from. The prose
 * file stays plain markdown — <LadyTastingTea /> with no import and no props —
 * so writing the next article means writing prose, not wiring components.
 */
export default function NullHypothesis() {
  const { meta, figures, sources, misreadings, timeline } = data;
  const [scale, setScale] = useFontScale();

  const params = useMemo(
    () => Object.fromEntries(Object.entries(figures ?? {}).map(([id, f]) => [id, f.params ?? {}])),
    [figures],
  );

  const components = useMemo(() => ({
    LadyTastingTea: () => <LadyTastingTea {...params['lady-tasting-tea']} />,
    PUnderNull: () => <PUnderNull {...params['p-under-null']} />,
    TwoLogics: () => <TwoLogics {...params['two-logics']} />,
    PHacking: () => <PHacking {...params['p-hacking']} />,
    SampleSizeAndEffect: () => <SampleSizeAndEffect {...params['n-and-effect']} />,
    PPV: () => <PositivePredictiveValue {...params['ppv-2x2']} />,
    Misreadings: () => <Misreadings items={misreadings ?? []} />,
    Timeline: () => <Timeline items={timeline ?? []} />,
    // <Cite id="fisher1935">…</Cite> — the id is checked against sources.json in
    // the data repo, so a citation with no source cannot reach the page.
    Cite: ({ id, children }) => <HoverCite source={sources?.[id]}>{children}</HoverCite>,
  }), [params, sources, misreadings, timeline]);

  return (
    <PageShell
      title={meta.title}
      eyebrow="統計學實驗室"
      width="prose"
      backHref="/statisticslab"
      fontScale={scale}
      controls={<FontSizeControl scale={scale} onChange={setScale} />}
    >
      <p className="mb-10 text-token-sm leading-relaxed text-ink-muted">{meta.summary}</p>
      <Prose components={components}>
        <Article />
      </Prose>
    </PageShell>
  );
}
