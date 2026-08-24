import { ArrowRight, BarChart3, BookOpen, Brain, FileText, GraduationCap, MessageCircle, PlayCircle, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './public.css';
import './home.css';

const stats = [['10K+', 'Foydalanuvchilar', Users], ['50K+', 'Yaratilgan darslar', BookOpen], ['98%', 'Qoniqish darajasi', Trophy], ['24/7', 'Yordam xizmati', Zap]];
const features = [[Brain, 'AI dars generatori', 'Mavzuga mos darslarni avtomatik yarating.'], [FileText, 'Hujjatlar yuklash', 'PDF, Word va boshqa hujjatlarni tahlil qiling.'], [PlayCircle, 'Video darslar', 'Tushunarli video darslar va misollar.'], [MessageCircle, 'Jonli savol-javob', 'Savollaringizga tez va aniq javob oling.'], [Trophy, 'Test va baholash', 'Bilimingizni tekshirib, natijani ko‘ring.'], [BarChart3, 'Statistika va progress', 'O‘qish jarayoningizni kuzatib boring.']];

function DashboardPreview() {
  return <motion.div className="dashboard-wrap" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .15 }}>
    <div className="dashboard-preview">
      <div className="dashboard-top"><span><b>A</b> Abdora AI</span><em>AI faol</em></div>
      <div className="dashboard-body">
        <aside><small>MENU</small><strong>Darslar</strong><span>Hujjatlar</span><span>Testlar</span><span>Statistika</span></aside>
        <div className="dashboard-main"><small>Bugungi progress</small><div className="dashboard-number">84% <BarChart3 size={20} /></div><div className="bars"><i /><i /><i /><i /><i /></div><div className="ai-note"><Brain size={16} /> AI yordamchi tayyor</div></div>
      </div>
    </div>
    <div className="floating-card floating-file"><FileText size={20} /></div><div className="floating-card floating-cap"><GraduationCap size={20} /></div>
  </motion.div>;
}

export default function LandingPage() {
  return <main>
    <section className="home-hero public-container"><div className="hero-copy"><motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="hero-badge"><Sparkles size={14} /> AI yordamida o‘quvchilar uchun maksimal platforma</motion.span><motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }} className="public-title">Har bir o‘quvchi uchun <span>intelligent yordamchi</span></motion.h1><p className="public-lede">Abdora AI — darslarni yaratadi, savollaringizga javob beradi va o‘qish jarayonini yengillashtiradi.</p><div className="hero-actions"><Link className="public-button primary" to="/contact">Ariza qoldirish <ArrowRight size={16} /></Link><a className="public-button" href="#imkoniyatlar">Imkoniyatlarni ko‘rish <ArrowRight size={16} /></a></div></div><DashboardPreview /></section>
    <section className="stats-grid public-container">{stats.map(([value, label, Icon]) => <div className="public-card stat-card" key={label}><Icon size={19} /><strong>{value}</strong><span>{label}</span></div>)}</section>
    <section id="imkoniyatlar" className="public-container section-block"><div className="section-heading"><span className="public-eyebrow">Platforma</span><h2>Nima qila oladi?</h2><p>Barcha kerakli vositalar — bitta platformada.</p></div><div className="feature-grid">{features.map(([Icon, title, text], index) => <motion.article key={title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .05 }} className="public-card feature-card"><span className="feature-icon"><Icon size={20} /></span><h3>{title}</h3><p>{text}</p></motion.article>)}</div></section>
    <section id="nega" className="public-container benefit-block"><div><span className="public-eyebrow">Nega aynan Abdora AI?</span><h2>O‘rganish jarayoni endi sizning qo‘lingizda.</h2></div><div className="benefits"><div><b>01</b><h3>Vaqtni tejaydi</h3><p>Dars tayyorlashga ketadigan vaqtingizni kamaytiradi.</p></div><div><b>02</b><h3>Sifatli natija</h3><p>AI bilan aniq va tushunarli natijalar oling.</p></div><div><b>03</b><h3>Har doim yoningizda</h3><p>24/7 yordam va qo‘llab-quvvatlash.</p></div></div></section>
    <section className="public-container home-cta"><div><span className="public-eyebrow">Abdora AI bilan boshlang</span><h2>Boshlashga tayyormiz?</h2><p>Imkoniyatlardan foydalanish uchun ma’lumotlaringizni qoldiring, biz siz bilan bog‘lanamiz.</p></div><Link className="public-button dark-button" to="/contact">Ariza qoldirish <ArrowRight size={16} /></Link></section>
  </main>;
}
