import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Wand2, BookOpen, Video, Mic, Trophy, Building2, ArrowRight, CheckCircle2,
  Users, BarChart3, ShieldCheck,
} from 'lucide-react';
import usePublicTheme from '../../hooks/usePublicTheme';
import PublicShell from '../../components/public/PublicShell';
import PublicNav from '../../components/public/PublicNav';
import PublicFooter from '../../components/public/PublicFooter';

const SERVICES = [
  {
    icon: Wand2,
    title: 'AI dars generatsiyasi',
    text: "Mavzu nomini kiriting — sun'iy intellekt tushuntirish, misollar, test va flashcard'larni bir necha soniyada yaratadi.",
    points: ["Har qanday fan va daraja uchun", "Avtomatik test va flashcard", "Tahrirlash imkoniyati"],
  },
  {
    icon: Video,
    title: 'Video va hikoya darslar',
    text: 'Mavzular slayd, rasm va ovozli video darsga, yoki qiziqarli hikoyaga aylanadi — yodda qolishi osonlashadi.',
    points: ["AI ovozli izoh", "Slayd va rasm generatsiyasi", "Hikoya rejimi"],
  },
  {
    icon: Mic,
    title: 'Jonli speaking mashqi',
    text: "O'quvchi AI bilan real vaqtda gaplashadi, AI xatolarni darhol, ammo hurmat bilan tuzatadi.",
    points: ["Real vaqtli suhbat", "Talaffuz tahlili", "Har bir daraja uchun mos"],
  },
  {
    icon: Trophy,
    title: 'Gamifikatsiya',
    text: "XP, daraja va ketma-ketlik (streak) tizimi o'quvchini har kuni qaytib kelishga undaydi.",
    points: ["XP va darajalar", "Kunlik streak", "Reyting jadvali"],
  },
  {
    icon: Building2,
    title: 'Markaz va guruh boshqaruvi',
    text: "Bir nechta markaz, guruh jadvali, to'lovlar va o'qituvchilarni bitta panelda boshqaring.",
    points: ["Ko'p markazli boshqaruv", "Guruh jadvali", "To'lov va hisob-kitob"],
  },
  {
    icon: BarChart3,
    title: 'Moliya va hisobotlar',
    text: "Har bir markaz, guruh va o'qituvchi bo'yicha tushum, xarajat va foyda hisobotlarini avtomatik ko'ring.",
    points: ["Oylik hisobotlar", "Excel'ga eksport", "Guruh bo'yicha tahlil"],
  },
];

const AUDIENCE = [
  { icon: Users, title: 'O\'quv markazlari', text: 'Bir nechta filialni bitta tizimdan boshqaring, har bir markazning holatini real vaqtda kuzating.' },
  { icon: BookOpen, title: 'O\'qituvchilar', text: 'Dars tayyorlashga sarflanadigan vaqtni qisqartiring, AI yordamida sifatli material yarating.' },
  { icon: ShieldCheck, title: 'Ota-onalar', text: 'Farzandingizning davomati, natijalari va rivojlanishini istalgan vaqtda kuzatib boring.' },
];

export default function ServicesPage() {
  const [dark, setDark] = usePublicTheme();

  return (
    <PublicShell dark={dark}>
      <PublicNav dark={dark} setDark={setDark} />

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-16 md:pt-16 md:pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
          <h1 className="display-font text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight">
            Xizmatlarimiz
          </h1>
          <p className="text-[#2B1B10]/60 dark:text-white/60 text-lg mt-5 leading-relaxed">
            Abdora AI — o'quv markazingizni AI yordamida raqamlashtiradigan to'liq platforma. Har bir xizmat mustaqil
            ishlaydi, lekin birgalikda markazingiz uchun yagona ekotizimni tashkil qiladi.
          </p>
        </motion.div>
      </section>

      {/* Services grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20 border-t border-black/5 dark:border-white/5 pt-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="abdora-milk border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 hover:border-[#FF7A1A]/40 transition-colors flex flex-col">
                <div className="w-10 h-10 abdora-gradient rounded-xl flex items-center justify-center mb-4 text-white">
                  <Icon size={18} />
                </div>
                <h3 className="font-semibold text-base mb-1.5">{s.title}</h3>
                <p className="text-sm text-[#2B1B10]/50 dark:text-white/50 leading-relaxed mb-4">{s.text}</p>
                <ul className="mt-auto space-y-1.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs text-[#2B1B10]/60 dark:text-white/60">
                      <CheckCircle2 size={13} className="text-[#FF7A1A] flex-shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Who it's for */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-black/5 dark:border-white/5">
        <div className="max-w-xl mb-14">
          <h2 className="display-font text-3xl sm:text-4xl font-semibold tracking-tight">Kimlar uchun</h2>
          <p className="text-[#2B1B10]/50 dark:text-white/50 mt-3">Platforma har bir tomon uchun o'zining foydasini beradi.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {AUDIENCE.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div key={a.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="text-center px-4">
                <div className="w-12 h-12 mx-auto abdora-gradient rounded-2xl flex items-center justify-center mb-4 text-white abdora-glow">
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-base mb-1.5">{a.title}</h3>
                <p className="text-sm text-[#2B1B10]/50 dark:text-white/50 leading-relaxed">{a.text}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <div className="abdora-gradient rounded-3xl p-10 sm:p-14 text-center text-white abdora-glow">
          <h2 className="display-font text-3xl sm:text-4xl font-semibold tracking-tight mb-3">Boshlashga tayyormisiz?</h2>
          <p className="text-white/85 max-w-lg mx-auto mb-8">Markazingiz uchun ariza qoldiring — jamoamiz siz bilan bog'lanadi va tizimni sozlashda yordam beradi.</p>
          <Link to="/aloqa" className="inline-flex items-center gap-2 bg-white text-[#FF7A1A] font-semibold text-sm rounded-2xl px-6 py-3.5 hover:opacity-90 transition-opacity">
            Biz bilan bog'laning <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </PublicShell>
  );
}
