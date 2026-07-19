import { Navigate } from 'react-router-dom';

/*
 * The standalone glossary page was folded into the Statistics Lab hub's 術語表
 * tab: same keyline entries, same groups, now with a search box. This route
 * stays only to send the old URL — and anything still linking to it — straight
 * to that tab. It is kept out of prerender and the sitemap (scripts/routes.mjs),
 * so there is no duplicate of the tab's content under this path.
 */
export default function Glossary() {
  return <Navigate to="/statisticslab?tab=glossary" replace />;
}
