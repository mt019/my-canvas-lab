import React, { useEffect } from 'react';
import {
  ArrowLeft,
  Database,
  Globe2,
  Layers3,
  Radar,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const stats = [
  { label: '分類軸', value: '6', icon: Layers3 },
  { label: '來源', value: '12', icon: Database },
  { label: '前沿觀察', value: '8', icon: Radar },
];

const lanes = [
  '規範命題',
  '實然運作',
  '趨勢訊號',
  '未來發展',
  '研究熱點',
  '學者生態',
  '資料證據',
  '爭議焦點',
];

export default function InternationalTaxOps() {
  useEffect(() => {
    document.title = '國際稅法研究桌 · Canvas Lab';
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f7f8] text-[#172026] px-4 py-5 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="rounded-lg border border-[#dfe4ea] bg-[#111922] text-white">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-md border border-white/15 bg-white/8 text-[#8bd8d0]">
                <Globe2 size={23} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8bd8d0]">
                  Canvas Gateway
                </p>
                <h1 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">
                  國際稅法研究桌
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
                  Canvas 保持總入口；研究資料、來源清單、更新紀錄與設計草稿集中在同一資料夾。
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-white/15 px-3 text-xs font-black text-white transition hover:bg-white/10"
              >
                <ArrowLeft size={15} />
                回總入口
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-lg border border-[#dfe4ea] bg-white p-4">
              <Icon size={18} className="text-[#1f6f69]" />
              <div className="mt-4 text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</div>
              <div className="mt-1 text-2xl font-black">{value}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-4">
          <div className="rounded-lg border border-[#dfe4ea] bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-black">研究分類面板</h2>
              <ShieldCheck size={18} className="text-[#1f6f69]" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {lanes.map((lane) => (
                <div key={lane} className="rounded-md border border-[#e7ebef] bg-[#fafbfc] px-3 py-2 text-sm font-bold text-slate-700">
                  {lane}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
