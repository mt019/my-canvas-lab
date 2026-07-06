// DATA — synced from the private Translation repository via Skripte/generate_canvas_manifest.py
import React, { useMemo } from 'react';
import {
  BookOpen, FileText, Lock, ExternalLink, Library, Layers, Download,
} from 'lucide-react';
import manifest from '../data/translationProjects.json';

const TA_VARS = { // token-exempt
  '--ta-bg': '#fbf8f9',
  '--ta-line': '#eadde2',
  '--ta-ink': '#3f3339',
  '--ta-heading': '#332b30',
  '--ta-eyebrow': '#a77b89',
  '--ta-body-text': '#74636a',
  '--ta-topic-text': '#8a7a80',
  '--ta-placeholder': '#c2b5ba',
  '--ta-work-muted': '#a89ba0',
  '--ta-row-border': '#eee2e5',
  '--ta-public-bg': '#dde8c8',
  '--ta-public-text': '#386838',
  '--ta-restricted-bg': '#e8dcdc',
  '--ta-restricted-text': '#7a5a5a',
  '--ta-pdf-bg': '#f3f8ea',
  '--ta-pdf-border': '#c9d9b4',
  '--ta-pdf-hover-bg': '#e7f0d8',
  '--ta-stat-icon-bg': '#f0e4ea',
  '--ta-stat-icon': '#8f6071',
};

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / 1024 / 1024;
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${mb.toFixed(1)} MB`;
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function RightsBadge({ rights }) {
  if (rights === 'public') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ta-public-bg)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--ta-public-text)]">
        <Download size={11} strokeWidth={2.4} /> 公版全文可下載
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ta-restricted-bg)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--ta-restricted-text)]">
      <Lock size={11} strokeWidth={2.4} /> 僅列 metadata
    </span>
  );
}

function WorkRow({ work, rights }) {
  const isPublic = rights === 'public' && work.pdf;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--ta-row-border)] py-2 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className={`truncate text-[12.5px] font-semibold ${isPublic ? 'text-[var(--ta-ink)]' : 'text-[var(--ta-work-muted)]'}`}>
          {work.title}
        </div>
        <div className="text-[10.5px] text-[var(--ta-work-muted)]">
          {formatBytes(work.sizeBytes)}
          {work.mtime ? ` · 更新於 ${formatDate(work.mtime)}` : ''}
        </div>
      </div>
      {isPublic ? (
        <a
          href={work.pdf}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--ta-pdf-border)] bg-[var(--ta-pdf-bg)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--ta-public-text)] transition-colors hover:bg-[var(--ta-pdf-hover-bg)]"
        >
          <FileText size={12} strokeWidth={2.2} /> PDF <ExternalLink size={10} strokeWidth={2.2} />
        </a>
      ) : (
        <span className="shrink-0 text-[10.5px] font-medium text-[var(--ta-placeholder)]">僅存檔，不公開</span>
      )}
    </div>
  );
}

function ProjectCard({ project }) {
  const hasWorks = project.works.length > 0;
  return (
    <div className="rounded-xl border border-[var(--ta-line)] bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold leading-snug text-[var(--ta-heading)]">{project.name}</h3>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--ta-topic-text)]">{project.topic}</p>
        </div>
        <div className="shrink-0"><RightsBadge rights={project.rights} /></div>
      </div>
      {hasWorks ? (
        <div className="mt-3">
          {project.works.map((w, i) => (
            <WorkRow key={`${project.id}-${i}`} work={w} rights={project.rights} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[11.5px] italic text-[var(--ta-placeholder)]">尚無成品 PDF——子專案籌備中</p>
      )}
    </div>
  );
}

function StatTile({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--ta-line)] bg-white px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--ta-stat-icon-bg)]">
        <Icon size={17} className="text-[var(--ta-stat-icon)]" strokeWidth={2.2} />
      </div>
      <div>
        <div className="text-[18px] font-bold leading-tight text-[var(--ta-heading)]">{value}</div>
        <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--ta-eyebrow)]">{label}</div>
      </div>
    </div>
  );
}

export default function TranslationAtlas() {
  const { projectCount, workCount, downloadableCount } = useMemo(() => {
    const projects = manifest.projects ?? [];
    const works = projects.flatMap((p) => p.works);
    const downloadable = works.filter((w) => w.pdf).length;
    return {
      projectCount: projects.length,
      workCount: works.length,
      downloadableCount: downloadable,
    };
  }, []);

  const projects = manifest.projects ?? [];

  return (
    <div
      className="min-h-screen bg-[var(--ta-bg)] px-4 font-sans text-[var(--ta-ink)] sm:px-6"
      style={{ ...TA_VARS, paddingTop: 46, paddingBottom: 64 }}
    >
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 border-b border-[var(--ta-line)] pb-7">
          <p className="mb-4 font-accent text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--ta-eyebrow)]">
            Phenom&nbsp;&nbsp;·&nbsp;&nbsp;Translation Atlas
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight text-[var(--ta-heading)] sm:text-4xl">
            翻譯工程總覽
          </h1>
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-[var(--ta-body-text)]">
            德語法律判決、文學選譯與英文書籍的中文全譯成果地圖。公版或官方文書作品附全文
            PDF，仍受著作權保護的原作僅列出成品 metadata，不公開全文。
          </p>
        </header>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile icon={Library} label="子專案數" value={projectCount} />
          <StatTile icon={Layers} label="作品數" value={workCount} />
          <StatTile icon={BookOpen} label="可下載全文" value={downloadableCount} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {manifest.generatedAt && (
          <p className="mt-8 text-center text-[10.5px] text-[var(--ta-placeholder)]">
            manifest 產生於 {formatDate(manifest.generatedAt)}
          </p>
        )}
      </div>
    </div>
  );
}
