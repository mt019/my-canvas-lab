import { ArrowRight, BookOpenText, Search } from 'lucide-react';
import data from '../data/chenYinke.json';
import PageShell from '../components/PageShell';
import FontSizeControl, { useFontScale } from '../components/FontSizeControl';
import Tabs, { useTabParam } from '../components/lab/Tabs';
import LiuRushiEdition from './_chen-yinke/LiuRushiEdition';
import LegendView from './_chen-yinke/LegendView';
import styles from './ChenYinke.module.css';

const TABS = [
  { id: 'edition', label: '細讀原文' },
  { id: 'legend', label: '圖例' },
  { id: 'liurushi', label: '柳如是別傳' },
  { id: 'people', label: '人物' },
  { id: 'reading', label: '讀法' },
  { id: 'collection', label: '七冊文集' },
];

function SectionTitle({ number, children, note }) {
  return (
    <div className={styles.sectionTitle}>
      <span>{number}</span>
      <div>
        <h2>{children}</h2>
        {note ? <p>{note}</p> : null}
      </div>
    </div>
  );
}

export default function ChenYinke({ forcedSelection }) {
  const [fontScale, setFontScale] = useFontScale();
  const [tab, setTab] = useTabParam('read', 'edition');
  const spotlight = data.spotlight;

  return (
    <PageShell
      title={data.project.title}
      eyebrow="中國中古史 · 明清之際 · 詩文證史"
      width="wide"
      fontScale={fontScale}
      manageDocumentTitle={false}
      controls={<FontSizeControl scale={fontScale} onChange={setFontScale} />}
    >
      <p className={styles.dek}>{data.project.subtitle}</p>

      <Tabs
        items={TABS}
        value={tab}
        onChange={setTab}
        variant="underline"
        label="陳寅恪文集"
        className={styles.tabs}
      />

      {tab === 'edition' && <LiuRushiEdition initialSelectionId={forcedSelection} />}

      {tab === 'legend' && <LegendView onOpenReading={() => setTab('edition')} />}

      {tab === 'liurushi' && (
        <div className={styles.body}>
          <section className={styles.opening}>
            <div className={styles.bookNumber}>第七冊</div>
            <div>
              <p className={styles.overline}>目前從這裡讀起</p>
              <h2>{spotlight.title}</h2>
              <p>{spotlight.introduction}</p>
            </div>
          </section>

          <section>
            <SectionTitle number="01" note="四個問題構成第一輪閱讀的骨架">進入全書</SectionTitle>
            <ol className={styles.questionList}>
              {spotlight.questions.map((question, index) => (
                <li key={question}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{question}</p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <SectionTitle number="02" note="由人物關係進入詩文與歷史">先辨認四個位置</SectionTitle>
            <div className={styles.peopleIndex}>
              {spotlight.people.map((person) => (
                <article key={person.name}>
                  <h3>{person.name}</h3>
                  <p className={styles.role}>{person.role}</p>
                  <p>{person.note}</p>
                </article>
              ))}
            </div>
            <button type="button" className={styles.textAction} onClick={() => setTab('people')}>
              展開人物線索 <ArrowRight size={16} />
            </button>
          </section>
        </div>
      )}

      {tab === 'people' && (
        <div className={styles.body}>
          <SectionTitle number="人物" note="先看每個人在全書中的位置，再追索彼此的交往與分歧">
            四條人物線
          </SectionTitle>
          <div className={styles.personRows}>
            {spotlight.people.map((person, index) => (
              <article key={person.name}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h2>{person.name}</h2>
                <p className={styles.role}>{person.role}</p>
                <p>{person.note}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === 'reading' && (
        <div className={styles.body}>
          <SectionTitle number="讀法" note="四個入口依序推進，也可以各自成為一條閱讀線">
            怎麼讀《柳如是別傳》
          </SectionTitle>
          <ol className={styles.routeList}>
            {spotlight.readingRoutes.map((route, index) => (
              <li key={route.title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{route.title}</h3>
                  <p>{route.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className={styles.nextReading}>
            <BookOpenText size={20} />
            <div>
              <h3>下一輪閱讀</h3>
              <ul>
                {data.immediateNextWork.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === 'collection' && (
        <div className={styles.body}>
          <SectionTitle number="七冊" note="《柳如是別傳》是閱讀中心；其餘六冊提供陳寅恪史學的參照">
            文集全貌
          </SectionTitle>
          <div className={styles.collectionHead}>
            <span>冊次</span><span>書名與性質</span><span>可以從哪裡進入</span>
          </div>
          <ol className={styles.volumeRows}>
            {[...data.volumes].reverse().map((volume) => (
              <li key={volume.id} className={volume.id === 'liu-rushi' ? styles.priority : ''}>
                <span>{String(volume.order).padStart(2, '0')}</span>
                <div>
                  <h3>{volume.title}</h3>
                  <p>{volume.kind}</p>
                </div>
                <p>{volume.lens}</p>
              </li>
            ))}
          </ol>
          <p className={styles.searchNote}><Search size={15} /> 篇章次序與卷次核對完成後，這裡會加入全文目錄搜尋。</p>
        </div>
      )}
    </PageShell>
  );
}
