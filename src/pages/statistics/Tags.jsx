import { Navigate } from 'react-router-dom';

/*
 * The tags overview lives in the Statistics Lab hub's 標籤 tab, next to 文章 and
 * 術語表. This route stays only to send the old URL — and anything still linking
 * to it — to that tab. It is kept out of prerender and the sitemap
 * (scripts/routes.mjs), so there is no duplicate of the tab's content here.
 */
export default function Tags() {
  return <Navigate to="/statisticslab?tab=tags" replace />;
}
