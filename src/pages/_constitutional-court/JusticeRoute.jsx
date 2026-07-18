import { useParams } from 'react-router-dom';
import data from '../../data/constitutionalCourt.json';
import SeoHead from '../../components/SeoHead';
import ConstitutionalCourt from '../ConstitutionalCourt';
import { justiceSeo } from './seo';

// Clean, indexable URL for a single justice (/constitutionalcourt/justices/<姓名>).
// Lazy-loaded from App.jsx so the archive's JSON never enters the main bundle.
// It owns this route's <head> (title, description, Person schema) and hands the
// rendering to ConstitutionalCourt, which reads the name from the path param and
// shows that justice's detail view.
export default function JusticeRoute() {
  const { justiceName } = useParams();
  const name = decodeURIComponent(justiceName ?? '');
  const j = data.大法官.find((x) => x.姓名 === name);
  const page = j
    ? justiceSeo(j)
    : {
        name,
        title: `${name}｜憲法法庭案例庫`,
        description: '名冊裡查無此人。',
        indexable: false,
        parent: { name: '歷任大法官', path: '/constitutionalcourt/justices' },
      };
  return (
    <>
      <SeoHead page={page} />
      <ConstitutionalCourt />
    </>
  );
}
