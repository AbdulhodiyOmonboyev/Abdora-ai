import { ArrowRight, BarChart3, BookOpen, FileText, GraduationCap, MessageCircle, PlayCircle, Trophy, Users, Zap, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogoIcon } from '../../components/ui/Logo';
import './public.css';
import './home.css';

const stats = [
  ['10K+', 'Foydalanuvchilar', Users],
  ['50K+', 'O‘zlashtirilgan darslar', BookOpen],
  ['98%', 'Qoniqish darajasi', Trophy],
  ['24/7', 'Qo‘llab-quvvatlash', Zap],
];

const features = [
  [BookOpen, 'Interaktiv darslar', 'Mavzular bo‘yicha tushunarli darslar va amaliy misollar.'],
  [FileText, 'Hujjatlar va konspektlar', 'PDF, darsliklar va qo‘shimcha materiallar bazasi.'],
  [PlayCircle, 'Video darslar', 'Sifatli video darslar va ko‘rgazmali tushuntirishlar.'],
  [MessageCircle, 'Savol-javob va muloqot', 'Ustozlar va o‘quvchilar o‘rtasida tezkor aloqa.'],
  [Trophy, 'Test va baholash tizimi', 'Bilimingizni sinab, natijalarni monitoring qiling.'],
  [BarChart3, 'Statistika va reyting', 'O‘qish dinamikasi va shaxsiy o‘sish ko‘rsatkichlari.'],
];

function DashboardPreview() {
  return (
    <motion.div className="dashboard-wrap" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .15 }}>
      <div className="dashboard-preview">
        <div className="dashboard-top">
          <span className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-sm">
            <LogoIcon size={30} /> Abdora
          </span>
          <em className="font-medium">Faol tizim</em>
        </div>
        <div className="dashboard-body">
          <aside>
            <small>MENYU</small>
            <strong>Darslar</strong>
            <span>Hujjatlar</span>
            <span>Testlar</span>
            <span>Statistika</span>
          </aside>
          <div className="dashboard-main">
            <small>Bugungi progress</small>
            <div className="dashboard-number text-gray-900 dark:text-white">84% <BarChart3 size={20} /></div>
            <div className="bars"><i /><i /><i /><i /><i /></div>
            <div className="ai-note"><CheckCircle2 size={16} /> O‘quv kursi faol</div>
          </div>
        </div>
      </div>
      <div className="floating-card floating-file"><FileText size={20} /></div>
      <div className="floating-card floating-cap"><GraduationCap size={20} /></div>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <main>
      <section className="home-hero public-container">
        <div className="hero-copy">
          <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="hero-badge">
            <GraduationCap size={15} /> O‘quv markazlari va talabalar uchun zamonaviy ta'lim
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .08 }}
            className="public-title text-gray-900 dark:text-white"
          >
            Har bir o‘quvchi uchun <span>mukammal ta'lim tizimi</span>
          </motion.h1>
          <p className="public-lede text-gray-600 dark:text-gray-300">
            Abdora — darslarni o‘zlashtirish, testlar topshirish va natijalarni tizimli tahlil qilish uchun yagona innovatsion platforma.
          </p>
          <div className="hero-actions">
            <Link className="public-button primary" to="/contact">
              Ariza qoldirish <ArrowRight size={16} />
            </Link>
            <a className="public-button text-gray-900 dark:text-white" href="#imkoniyatlar">
              Imkoniyatlarni ko‘rish <ArrowRight size={16} />
            </a>
          </div>
        </div>
        <DashboardPreview />
      </section>

      <section className="home-stats-grid public-container">
        {stats.map(([value, label, Icon]) => (
          <div className="public-card home-stat-card" key={label}>
            <Icon size={20} />
            <strong className="text-gray-900 dark:text-white">{value}</strong>
            <span className="text-gray-600 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </section>

      <section id="imkoniyatlar" className="public-container section-block">
        <div className="section-heading">
          <span className="public-eyebrow">Platforma</span>
          <h2 className="text-gray-900 dark:text-white">Nima qila oladi?</h2>
          <p className="text-gray-600 dark:text-gray-300">Barcha kerakli o‘quv vositalari — bitta tizimda.</p>
        </div>
        <div className="feature-grid">
          {features.map(([Icon, title, text], index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * .05 }}
              className="public-card feature-card"
            >
              <span className="feature-icon"><Icon size={20} /></span>
              <h3 className="text-gray-900 dark:text-white">{title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="nega" className="public-container benefit-block">
        <div>
          <span className="public-eyebrow">Nega aynan Abdora?</span>
          <h2 className="text-gray-900 dark:text-white">O‘rganish jarayoni endi sizning qo‘lingizda.</h2>
        </div>
        <div className="benefits">
          <div>
            <b>01</b>
            <h3 className="text-gray-900 dark:text-white">Vaqtni tejaydi</h3>
            <p className="text-gray-600 dark:text-gray-300">Darslarni rejalashtirish va tahlil qilish vaqtini qisqartiradi.</p>
          </div>
          <div>
            <b>02</b>
            <h3 className="text-gray-900 dark:text-white">Sifatli natija</h3>
            <p className="text-gray-600 dark:text-gray-300">Aniq va tizimli tushuntirishlar orqali yuqori ko‘rsatkichga erishing.</p>
          </div>
          <div>
            <b>03</b>
            <h3 className="text-gray-900 dark:text-white">Har doim yoningizda</h3>
            <p className="text-gray-600 dark:text-gray-300">Istalgan qurilmadan 24/7 qulay foydalanish imkoniyati.</p>
          </div>
        </div>
      </section>

      <section className="public-container home-cta">
        <div>
          <span className="public-eyebrow">Abdora bilan boshlang</span>
          <h2>Boshlashga tayyormiz?</h2>
          <p>Imkoniyatlardan foydalanish uchun ma’lumotlaringizni qoldiring, biz siz bilan bog‘lanamiz.</p>
        </div>
        <Link className="public-button dark-button" to="/contact">
          Ariza qoldirish <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  );
}
