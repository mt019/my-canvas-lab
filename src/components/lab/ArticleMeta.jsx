import { Link } from 'react-router-dom';
import { Clock, RefreshCw, Tag } from 'lucide-react';

/*
 * The header line every documentation site and blog carries: when it went up,
 * when it last changed, how long it takes to read, what it is about.
 *
 * The numbers come from the data repo — reading time is counted there from the
 * body itself (Chinese by character, English by word, which is why it differs
 * between the two languages), and a missing tag or reading time fails validation
 * there rather than leaving a hole here.
 *
 * Each tag links to its own page — every other article about the same thing.
 * The slug is language-neutral (keyed on the Chinese label) and comes paired with
 * the tag from the data repo, so `tags[i]` and `tagSlugs[i]` are the same tag; a
 * tag without a slug still renders, just as plain text. `tagBase` is where those
 * links point: each site has its own tag route, so a site that isn't the
 * statistics one passes its own, and a site with no tag pages at all passes no
 * slugs and gets plain chips.
 *
 * A site whose articles all went up on the same day has nothing to say with a
 * date — it passes no `publishedAt` and that slot disappears rather than
 * printing the word 發表 on its own. Anything else the line should carry (a
 * source count, a chapter number) comes in as children and sits at the end.
 */
export default function ArticleMeta({
  publishedAt,
  updatedAt,
  readingMinutes,
  tags = [],
  tagSlugs = [],
  tagBase = '/statistics/tags',
  lang = 'zh',
  children = null,
}) {
  const en = lang === 'en';
  const changed = updatedAt && updatedAt !== publishedAt;
  const tagClass =
    'rounded-token-sm border border-line-soft px-1.5 py-0.5 text-ink-muted transition-colors duration-fast hover:border-accent hover:text-accent';

  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-line-soft py-3 text-token-xs text-ink-faint">
      {publishedAt ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="font-accent">{publishedAt}</span>
          {en ? 'published' : '發表'}
        </span>
      ) : null}

      {changed ? (
        <span className="inline-flex items-center gap-1.5">
          <RefreshCw size={12} />
          <span className="font-accent">{updatedAt}</span>
          {en ? 'updated' : '更新'}
        </span>
      ) : null}

      {readingMinutes ? (
        <span className="inline-flex items-center gap-1.5">
          <Clock size={12} />
          {en ? `${readingMinutes} min read` : `約 ${readingMinutes} 分鐘`}
        </span>
      ) : null}

      {tags.length > 0 ? (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <Tag size={12} />
          {tags.map((t, i) =>
            tagSlugs[i] ? (
              <Link key={t} to={`${tagBase}/${tagSlugs[i]}`} className={tagClass}>
                {t}
              </Link>
            ) : (
              <span key={t} className={tagClass}>
                {t}
              </span>
            ),
          )}
        </span>
      ) : null}

      {children}
    </div>
  );
}
