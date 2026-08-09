import { useEffect } from 'react';
import AppearanceMenu from '../components/AppearanceMenu';
import FontSizeControl, { useFontScale } from '../components/FontSizeControl';
import DashboardLayout from '../components/lab/DashboardLayout';
import { useTabParams } from '../components/lab/Tabs';
import OverviewView from './_tax-litigation/OverviewView';
import VerdictScopeView from './_tax-litigation/VerdictScopeView';
import MethodsView from './_tax-litigation/MethodsView';
import CrossStraitView from './_tax-litigation/CrossStraitView';
import ForeignCourtsView from './_tax-litigation/ForeignCourtsView';
import data from '../data/taxLitigation.json';

/*
 * Each tab button is one research line, not a content-kind bucket — the
 * convention every tabbed research page here follows. 撤銷範圍's numbers still move
 * still move under active research work (see its own "資料仍在擴充" badge) and
 * 兩岸港澳／外國法院 are still exploratory (their own "探索中" badge) — all
 * three are visible tabs regardless, because the badge on the page itself is
 * the honest signal, not whether the button exists.
 */
export default function TaxLitigation() {
  const [scale, setScale] = useFontScale();
  const [{ tab }, setTabs] = useTabParams({ tab: 'overview' });

  useEffect(() => {
    document.title = '稅務訴訟計量研究｜Canvas Lab';
  }, []);

  return (
    <DashboardLayout
      scale={scale}
      headerRight={
        <>
          <FontSizeControl scale={scale} onChange={setScale} />
          <AppearanceMenu />
        </>
      }
      eyebrow="Tax Litigation Research"
      title="稅務訴訟計量研究"
      summary="把司法院公開的稅務訴訟判決逐件讀，量法院實際怎麼判——租稅協定被援引時，法院是自己解釋條文還是回頭套用國內法令；判決寫「撤銷原處分」時，撤的究竟是最初的核定還是後來的復查決定。"
      tabs={{
        label: '看哪一條線',
        value: tab,
        onChange: (v) => setTabs({ tab: v }, { scroll: 'top' }),
        items: [
          { id: 'overview', label: '頭號結論' },
          { id: 'verdict-scope', label: '撤銷範圍' },
          { id: 'cross-strait', label: '兩岸港澳' },
          { id: 'foreign-courts', label: '外國法院' },
          { id: 'methods', label: '方法與資料' },
        ],
      }}
      refreshKey={tab}
    >
      {tab === 'overview' ? <OverviewView decisive={data.decisive} /> : null}
      {tab === 'verdict-scope' ? <VerdictScopeView verdictScope={data.verdictScope} /> : null}
      {tab === 'cross-strait' ? <CrossStraitView crossStrait={data.crossStrait} /> : null}
      {tab === 'foreign-courts' ? <ForeignCourtsView foreignCourts={data.foreignCourts} /> : null}
      {tab === 'methods' ? <MethodsView population={data.population} methods={data.methods} /> : null}
    </DashboardLayout>
  );
}
