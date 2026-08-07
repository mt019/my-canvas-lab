import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Check, Copy, MessageCircle, X } from 'lucide-react';
import { pathForLanguage, splitLanguagePath } from '../../lib/siteLanguages';
import BackLink from '../../components/BackLink';
import SiteHomeEyebrow from '../../components/SiteHomeEyebrow';

const BOOKING_URL = import.meta.env.VITE_BOOKING_URL || 'https://cal.com/eva-wang/first';
const DIALOGUE_VARS = { // token-exempt: page-local warm editorial palette
  '--dialogue-paper': '#f7f3ec',
};

const COPY = {
  'zh-Hant-TW': {
    nav: [['中文', 'zh-Hant-TW'], ['Deutsch', 'de'], ['English', 'en']],
    eyebrow: '全中文 · 高階 · 一對一',
    title: '用中文，真正談事情。',
    lead: '這不是初級中文課，也不是照著教材走的口說練習。這是一段只用中文進行的私人對談，給已經會說、但想讓表達更成熟、更自然的人。',
    price: '€69', unit: '50 分鐘', fitPrice: '初次對談：25 分鐘 · €39',
    primary: '預約初次對談', pending: '複製申請內容',
    small: '目前只開放少量長期名額。初次對談同樣付費，不做免費試聊。',
    forTitle: '這適合你，如果你已經能——',
    fits: ['全程以中文討論一個熟悉的議題', '讀懂一般中文文章，並說明自己的看法', '接受直接但不打斷思路的語感與表達回饋'],
    notTitle: '這裡不提供',
    nots: ['零基礎或初級中文教學', '以英文或德文講解系統語法', 'HSK 應試、兒童課程或廉價陪聊'],
    topicsTitle: '不拿空泛題目硬聊',
    topicsLead: '你可以帶著正在讀、正在想或工作上真的遇到的事情來。',
    topics: ['法律與公共議題', '商業與跨文化溝通', '文學、歷史與社會', '中國茶與日常文化', '中國大陸與台灣的詞彙、語氣和語域差異'],
    aboutTitle: '你會和誰談',
    aboutLead: '我是 Eva。比起帶你做一套固定練習，我更擅長聽懂一個複雜想法、繼續追問，並幫你找到更準確、更像你自己的中文說法。',
    about: ['普通話使用者，成長於無錫的江南語言環境，語感清楚而溫和', '曾在台灣生活十年，熟悉簡體、繁體，以及兩岸日常用語的差別', '使用粵語與上海話，對漢語內部的聲音、語域和地域差異敏感', '法律專業背景，也長期閱讀文學、公共議題與茶文化', '英文 advanced；TestDaF 4／4／3／4，曾在維也納、薩爾茨堡與柏林生活，也到訪科隆與埃森'],
    methodTitle: '一場對談怎麼進行',
    method: [['之前', '你選一個真正想談的題目；需要時，可以先傳一篇文章或幾個關鍵詞。'], ['當下', '50 分鐘全中文對談。我會追問、釐清，也讓你把話完整說完。'], ['回饋', '不把每句話切碎糾錯；我會挑出最影響自然度、準確度或語域的表達集中處理。']],
    applyTitle: '先確認我們適不適合',
    applyLead: '預約前，請用中文簡單回答三件事：你的中文使用經驗、最近最想談的三個題目，以及你希望我怎麼回饋。',
    template: '你好，我想申請高階中文私人對談。\n\n1. 我的中文使用經驗：\n2. 最近最想談的三個題目：\n3. 我偏好的回饋方式：',
    copied: '已複製', copy: '複製中文申請格式', bookingSoon: '預約頁會依你的所在地顯示時區；選定時段後即可使用 PayPal 完成付款。',
  },
  de: {
    nav: [['中文', 'zh-Hant-TW'], ['Deutsch', 'de'], ['English', 'en']],
    eyebrow: 'NUR CHINESISCH · FORTGESCHRITTEN · PRIVAT',
    title: 'Auf Chinesisch über das sprechen, was wirklich zählt.',
    lead: 'Kein Anfängerkurs und keine Lektion nach Lehrbuch. Ein privates Gespräch vollständig auf Chinesisch – für Menschen, die bereits sprechen können und präziser, natürlicher und differenzierter werden möchten.',
    price: '69 €', unit: '50 Minuten', fitPrice: 'Erstes Kennenlerngespräch: 25 Minuten · 39 €',
    primary: 'Kennenlerngespräch buchen', pending: 'Anfrage kopieren',
    small: 'Nur wenige Plätze für eine regelmäßige Zusammenarbeit. Auch das erste Gespräch ist bezahlt.',
    forTitle: 'Das passt, wenn Sie bereits …',
    fits: ['ein vertrautes Thema vollständig auf Chinesisch besprechen können', 'allgemeine chinesische Texte lesen und dazu Stellung nehmen können', 'direktes Feedback wünschen, ohne ständig unterbrochen zu werden'],
    notTitle: 'Nicht angeboten werden',
    nots: ['Unterricht für Anfängerinnen und Anfänger', 'systematische Grammatikerklärungen auf Deutsch oder Englisch', 'HSK-Prüfungsvorbereitung, Kinderunterricht oder günstiges Plaudern'],
    topicsTitle: 'Gespräche mit Substanz',
    topicsLead: 'Bringen Sie mit, was Sie gerade lesen, durchdenken oder beruflich tatsächlich beschäftigt.',
    topics: ['Recht und öffentliche Angelegenheiten', 'Wirtschaft und interkulturelle Kommunikation', 'Literatur, Geschichte und Gesellschaft', 'Chinesischer Tee und Alltagskultur', 'Wortwahl, Ton und Register in Festlandchina und Taiwan'],
    aboutTitle: 'Ihre Gesprächspartnerin',
    aboutLead: 'Ich bin Eva. Statt ein festes Übungsprogramm abzuarbeiten, höre ich komplexen Gedanken genau zu, frage weiter und helfe Ihnen, dafür präzisere Formulierungen zu finden, die weiterhin nach Ihnen klingen.',
    about: ['Mandarinsprecherin aus dem Jiangnan-Sprachraum um Wuxi – klar, ruhig und ohne inszenierten Nachrichtensprecher-Ton', 'Zehn Jahre Lebenserfahrung in Taiwan; sicher in Kurz- und Langzeichen sowie im Sprachgebrauch beider Seiten', 'Spricht auch Kantonesisch und Shanghainesisch und hört genau auf Register und regionale Färbungen', 'Juristischer Hintergrund; intensive Beschäftigung mit Literatur, öffentlichem Leben und chinesischer Teekultur', 'Fortgeschrittenes Englisch; TestDaF 4/4/3/4; Aufenthalte in Wien, Salzburg und Berlin sowie Besuche in Köln und Essen'],
    methodTitle: 'So läuft ein Gespräch ab',
    method: [['Vorher', 'Sie wählen ein Thema, das Sie wirklich interessiert, und schicken bei Bedarf einen Text oder einige Stichwörter.'], ['Im Gespräch', '50 Minuten vollständig auf Chinesisch. Ich frage nach, präzisiere und lasse Sie Gedanken zu Ende führen.'], ['Feedback', 'Nicht jeder Satz wird zerlegt. Wir bearbeiten gezielt, was Natürlichkeit, Genauigkeit oder Register am stärksten beeinflusst.']],
    applyTitle: 'Passt dieses Format zu Ihnen?',
    applyLead: 'Antworten Sie vor der Buchung kurz auf Chinesisch: Wie nutzen Sie Chinesisch, welche drei Themen beschäftigen Sie gerade, und welche Art von Feedback wünschen Sie?',
    template: '你好，我想申請高階中文私人對談。\n\n1. 我的中文使用經驗：\n2. 最近最想談的三個題目：\n3. 我偏好的回饋方式：',
    copied: 'Kopiert', copy: 'Anfrage auf Chinesisch kopieren', bookingSoon: 'Die Buchungsseite zeigt Termine in Ihrer Zeitzone an; die Zahlung erfolgt bei der Buchung über PayPal.',
  },
  en: {
    nav: [['中文', 'zh-Hant-TW'], ['Deutsch', 'de'], ['English', 'en']],
    eyebrow: 'ALL CHINESE · ADVANCED · ONE TO ONE',
    title: 'Use Chinese to talk about things that matter.',
    lead: 'Not a beginner course and not a textbook speaking drill. This is a private conversation conducted entirely in Chinese, for people who already speak and want greater precision, range, and ease.',
    price: '€69', unit: '50 minutes', fitPrice: 'First fit conversation: 25 minutes · €39',
    primary: 'Book a fit conversation', pending: 'Copy an application',
    small: 'A small number of places are available for ongoing conversations. The first meeting is paid.',
    forTitle: 'This is for you if you can already—',
    fits: ['discuss a familiar subject entirely in Chinese', 'read a general Chinese article and explain your view', 'take direct feedback without having your train of thought constantly interrupted'],
    notTitle: 'This is not',
    nots: ['beginner or elementary Chinese instruction', 'systematic grammar explanation in English or German', 'HSK preparation, lessons for children, or bargain conversation practice'],
    topicsTitle: 'Conversation with something at stake',
    topicsLead: 'Bring what you are genuinely reading, thinking about, or dealing with at work.',
    topics: ['Law and public affairs', 'Business and cross-cultural communication', 'Literature, history, and society', 'Chinese tea and everyday culture', 'Vocabulary, tone, and register across Mainland China and Taiwan'],
    aboutTitle: 'Who you will speak with',
    aboutLead: 'I’m Eva. Rather than take you through a fixed set of exercises, I listen closely to complex ideas, ask the next useful question, and help you find more precise Chinese that still sounds like you.',
    about: ['A Mandarin speaker raised in the Jiangnan language environment around Wuxi, with a clear and gentle speaking style', 'Ten years living in Taiwan; fluent in simplified and traditional characters and alert to usage on both sides', 'Also speaks Cantonese and Shanghainese, with a close ear for register and regional variation', 'A legal background, alongside sustained interests in literature, public affairs, and Chinese tea culture', 'Advanced English; TestDaF 4/4/3/4; time spent in Vienna, Salzburg, and Berlin, with visits to Cologne and Essen'],
    methodTitle: 'How one dialogue works',
    method: [['Before', 'Choose a subject you actually care about. If useful, send an article or a few key terms in advance.'], ['During', 'Fifty minutes entirely in Chinese. I ask, clarify, and give you room to finish a thought.'], ['Feedback', 'We do not dissect every sentence. We focus on the choices that most affect naturalness, precision, and register.']],
    applyTitle: 'First, check the fit',
    applyLead: 'Before booking, answer three things briefly in Chinese: how you use the language, three subjects you currently want to discuss, and the kind of feedback you prefer.',
    template: '你好，我想申請高階中文私人對談。\n\n1. 我的中文使用經驗：\n2. 最近最想談的三個題目：\n3. 我偏好的回饋方式：',
    copied: 'Copied', copy: 'Copy the Chinese application', bookingSoon: 'The booking page displays appointments in your time zone; payment is collected through PayPal when you book.',
  },
};

function List({ items, negative = false }) {
  const Icon = negative ? X : Check;
  return <ul className="space-y-3">{items.map((item) => <li key={item} className="flex gap-3 text-[15px] leading-7 text-stone-700"><Icon className={`mt-1.5 h-4 w-4 shrink-0 ${negative ? 'text-stone-400' : 'text-amber-800'}`} />{item}</li>)}</ul>;
}

export default function Dialogue() {
  const { pathname } = useLocation();
  const { language, basePath } = splitLanguagePath(pathname);
  const text = COPY[language] || COPY['zh-Hant-TW'];
  const [copied, setCopied] = useState(false);
  const copyApplication = async () => {
    await navigator.clipboard.writeText(text.template);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="min-h-screen bg-[var(--dialogue-paper)] text-stone-900" style={DIALOGUE_VARS}>
      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:px-12">
        <nav className="flex items-center justify-between border-b border-stone-300/80 pb-5">
          <div className="flex items-center gap-4"><BackLink /><SiteHomeEyebrow className="font-serif text-sm tracking-[.16em] text-stone-700">PHENOM</SiteHomeEyebrow></div>
          <div className="flex gap-1 rounded-full border border-stone-300 bg-white/40 p-1">
            {text.nav.map(([label, lang]) => <Link key={lang} to={pathForLanguage(basePath, lang)} lang={lang === 'zh-Hant-TW' ? 'zh-Hant' : lang} className={`rounded-full px-3 py-1.5 text-xs ${language === lang ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-white'}`}>{label}</Link>)}
          </div>
        </nav>

        <section className="grid gap-10 border-b border-stone-300 py-16 md:grid-cols-[1fr_18rem] md:items-end lg:py-24">
          <div>
            <p className="mb-5 text-xs font-semibold tracking-[.22em] text-amber-900">{text.eyebrow}</p>
            <h1 className="max-w-4xl font-serif text-5xl leading-[1.06] tracking-[-.035em] sm:text-6xl lg:text-7xl">{text.title}</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-650">{text.lead}</p>
          </div>
          <aside className="border-l-2 border-amber-800 pl-6">
            <div className="font-serif text-4xl">{text.price}</div><div className="mt-1 text-sm text-stone-600">{text.unit}</div>
            <div className="mt-5 text-sm font-medium">{text.fitPrice}</div>
            {BOOKING_URL ? <a href={BOOKING_URL} className="mt-6 flex items-center justify-between rounded-sm bg-stone-900 px-5 py-4 text-sm text-white hover:bg-amber-950">{text.primary}<ArrowRight className="h-4 w-4" /></a> : <button onClick={copyApplication} className="mt-6 flex w-full items-center justify-between rounded-sm bg-stone-900 px-5 py-4 text-sm text-white hover:bg-amber-950">{copied ? text.copied : text.pending}{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button>}
            <p className="mt-4 text-xs leading-5 text-stone-500">{text.small}</p>
          </aside>
        </section>

        <section className="grid gap-12 border-b border-stone-300 py-14 md:grid-cols-2">
          <div><h2 className="mb-7 font-serif text-2xl">{text.forTitle}</h2><List items={text.fits} /></div>
          <div><h2 className="mb-7 font-serif text-2xl">{text.notTitle}</h2><List items={text.nots} negative /></div>
        </section>

        <section className="grid gap-10 border-b border-stone-300 py-14 lg:grid-cols-[.8fr_1.2fr]">
          <div><h2 className="font-serif text-3xl">{text.topicsTitle}</h2><p className="mt-4 max-w-sm leading-7 text-stone-600">{text.topicsLead}</p></div>
          <div className="grid gap-px overflow-hidden border border-stone-300 bg-stone-300 sm:grid-cols-2">{text.topics.map((topic) => <div key={topic} className="bg-[var(--dialogue-paper)] p-5 text-sm leading-6">{topic}</div>)}</div>
        </section>

        <section className="grid gap-10 border-b border-stone-300 py-14 lg:grid-cols-[.8fr_1.2fr]">
          <div><h2 className="font-serif text-3xl">{text.aboutTitle}</h2><p className="mt-4 max-w-sm leading-7 text-stone-600">{text.aboutLead}</p></div><List items={text.about} />
        </section>

        <section className="py-14">
          <h2 className="font-serif text-3xl">{text.methodTitle}</h2>
          <div className="mt-9 grid gap-8 md:grid-cols-3">{text.method.map(([label, body], index) => <div key={label} className="border-t border-stone-400 pt-5"><div className="mb-4 text-xs font-semibold tracking-[.18em] text-amber-900">0{index + 1} · {label}</div><p className="text-[15px] leading-7 text-stone-700">{body}</p></div>)}</div>
        </section>

        <section className="mb-10 grid gap-8 bg-stone-900 p-7 text-stone-50 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><MessageCircle className="mb-5 h-6 w-6 text-amber-300"/><h2 className="font-serif text-3xl">{text.applyTitle}</h2><p className="mt-4 max-w-2xl leading-7 text-stone-300">{text.applyLead}</p><p className="mt-3 text-xs leading-5 text-stone-500">{text.bookingSoon}</p></div>
          {BOOKING_URL ? <a href={BOOKING_URL} className="flex min-w-56 items-center justify-between bg-[var(--dialogue-paper)] px-5 py-4 text-sm text-stone-900">{text.primary}<ArrowRight className="h-4 w-4" /></a> : <button onClick={copyApplication} className="flex min-w-56 items-center justify-between bg-[var(--dialogue-paper)] px-5 py-4 text-sm text-stone-900">{copied ? text.copied : text.copy}{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button>}
        </section>
      </div>
    </main>
  );
}
