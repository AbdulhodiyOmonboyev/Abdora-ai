import { useState } from 'react';
import { ChevronDown, Download, FileText } from 'lucide-react';
import './public.css';

const documents = [
  ['Foydalanuvchi qo‘llanmasi', 'Platformaning asosiy imkoniyatlari va boshlash bosqichlari.'],
  ['AI dars generatori bo‘yicha qo‘llanma', 'Dars yaratish va natijani o‘quvchiga moslashtirish.'],
  ['Hujjat yuklash qo‘llanmasi', 'PDF va Word materiallari bilan ishlash bo‘yicha yo‘riqnoma.'],
  ['Video darslar qo‘llanmasi', 'Video va hikoya rejimlaridan foydalanish.'],
  ['Test va baholash qo‘llanmasi', 'Test tuzish, topshirish va natijalarni ko‘rish.'],
  ['Maxfiylik siyosati', 'Ma’lumotlaringizni qanday himoya qilishimiz haqida.'],
  ['Foydalanish shartlari', 'Platformadan foydalanish qoidalari va shartlari.'],
];

export default function DocumentsPage() {
  const [open, setOpen] = useState(0);
  return <main className="public-container"><div className="public-page-heading"><span className="public-eyebrow">Bilim markazi</span><h1 className="public-title">Hujjatlar</h1><p className="public-lede">Platformadan foydalanish bo‘yicha barcha kerakli hujjatlar va qo‘llanmalar bilan tanishing.</p></div><div className="document-list">{documents.map(([title, text], index) => <article className={`public-card document-item ${open === index ? 'is-open' : ''}`} key={title}><button type="button" onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index}><span className="document-title"><span className="document-icon"><FileText size={17} /></span><span><strong>{title}</strong><small>{text}</small></span></span><ChevronDown size={18} /></button>{open === index && <div className="document-body"><div className="document-preview"><FileText size={28} /><div><strong>{title}</strong><p>{text} Batafsil ma’lumotni ushbu hujjatda ko‘rishingiz mumkin.</p></div></div><button type="button" className="public-button primary"><Download size={15} /> Yuklab olish (PDF)</button></div>}</article>)}</div><style>{`.document-list{max-width:850px;display:grid;gap:10px}.document-item{overflow:hidden}.document-item button{width:100%;border:0;background:transparent;color:var(--text);cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:18px 20px;text-align:left}.document-item button>svg{color:var(--muted);transition:transform .25s}.document-item.is-open button>svg{transform:rotate(180deg);color:var(--orange)}.document-title{display:flex;align-items:center;gap:13px}.document-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:rgba(255,120,0,.11);color:var(--orange)}.document-title strong{display:block;font-size:14px}.document-title small{display:block;color:var(--muted);font-size:11px;margin-top:5px}.document-body{padding:0 20px 20px;display:flex;align-items:center;gap:15px;justify-content:space-between}.document-preview{display:flex;gap:13px;align-items:center;min-width:0;color:var(--orange)}.document-preview strong{color:var(--text);font-size:13px}.document-preview p{color:var(--secondary);font-size:11px;line-height:1.5;margin:5px 0 0}.document-body .public-button{white-space:nowrap}@media(max-width:600px){.document-body{align-items:flex-start;flex-direction:column}.document-body .public-button{width:100%;justify-content:center}}`}</style></main>;
}
