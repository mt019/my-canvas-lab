import { useParams } from 'react-router-dom';
import data from '../../data/constitutionalCourt.json';
import SeoHead from '../../components/SeoHead';
import ConstitutionalCourt from '../ConstitutionalCourt';
import { caseSeo } from './seo';

// Clean, indexable URL for a single case (/constitutionalcourt/case/<字號>).
// Lazy-loaded from App.jsx so the archive JSON stays out of the main bundle. It
// owns this route's <head> (title, description, Legislation schema) and hands
// rendering to ConstitutionalCourt, which reads the 字號 from the path param and
// shows that case as the main view.
export default function CaseRoute() {
  const { caseNo } = useParams();
  const 字號 = decodeURIComponent(caseNo ?? '');
  const doc = data.文件.find((x) => x.字號 === 字號);
  const page = doc
    ? caseSeo(doc)
    : {
        name: 字號,
        title: `${字號}｜憲法法庭案例庫`,
        description: '案例庫查無此件。',
        indexable: false,
        parent: { name: '憲法法庭案例庫', path: '/constitutionalcourt' },
      };
  return (
    <>
      <SeoHead page={page} />
      <ConstitutionalCourt />
    </>
  );
}
