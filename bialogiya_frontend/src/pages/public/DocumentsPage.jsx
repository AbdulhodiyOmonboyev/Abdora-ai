import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, ChevronDown, Lock, Handshake } from 'lucide-react';
import usePublicTheme from '../../hooks/usePublicTheme';
import PublicShell from '../../components/public/PublicShell';
import PublicNav from '../../components/public/PublicNav';
import PublicFooter from '../../components/public/PublicFooter';

const DOCUMENTS = [
  {
    icon: FileText,
    title: 'Foydalanish shartlari',
    updated: '2026-yil, avgust',
    paragraphs: [
      "Ushbu shartlar Abdora AI platformasidan (\"Platforma\") foydalanadigan barcha shaxs va tashkilotlarga (\"Foydalanuvchi\") taalluqlidir. Platformadan ro'yxatdan o'tish yoki foydalanish orqali siz ushbu shartlarga rozilik bildirasiz.",
      "Platforma o'quv markazlariga o'quvchi, o'qituvchi, guruh va moliyaviy jarayonlarni boshqarish, shuningdek sun'iy intellekt yordamida o'quv materiallari yaratish imkonini beradi.",
      "Foydalanuvchi o'z hisob ma'lumotlarining maxfiyligini ta'minlashga, tizimga faqat qonuniy maqsadlarda kirishga va boshqa foydalanuvchilarning huquqlarini buzmaslikka majburdir.",
      "Abdora AI xizmat sifatini yaxshilash maqsadida platformaga o'zgartirish kiritish huquqini o'zida saqlab qoladi. Muhim o'zgarishlar haqida foydalanuvchilar oldindan xabardor qilinadi.",
      "Nizolar yuzaga kelgan taqdirda, tomonlar avval muzokaralar yo'li bilan, imkon bo'lmagan taqdirda esa O'zbekiston Respublikasi qonunchiligiga muvofiq hal qiladilar.",
    ],
  },
  {
    icon: Lock,
    title: 'Maxfiylik siyosati',
    updated: '2026-yil, avgust',
    paragraphs: [
      "Abdora AI foydalanuvchilarning shaxsiy ma'lumotlarini himoya qilishni muhim vazifa deb biladi. Ushbu siyosat qanday ma'lumotlar to'planishi va ulardan qanday foydalanilishini tushuntiradi.",
      "Biz ism, telefon raqami, elektron pochta, o'quv markazi ma'lumotlari va tizimdan foydalanish statistikasini to'playmiz — bu ma'lumotlar faqat xizmat ko'rsatish va sifatni oshirish uchun ishlatiladi.",
      "Foydalanuvchi ma'lumotlari uchinchi shaxslarga foydalanuvchining roziligisiz sotilmaydi yoki uzatilmaydi, qonun talab qilgan hollar bundan mustasno.",
      "Barcha ma'lumotlar shifrlangan kanallar orqali uzatiladi va zamonaviy xavfsizlik standartlariga muvofiq saqlanadi.",
      "Foydalanuvchi istalgan vaqtda o'z ma'lumotlarini ko'rish, tahrirlash yoki o'chirishni administratordan so'rashi mumkin.",
    ],
  },
  {
    icon: Handshake,
    title: 'Ommaviy oferta',
    updated: '2026-yil, avgust',
    paragraphs: [
      "Ushbu hujjat Abdora AI xizmatlaridan foydalanish bo'yicha ommaviy oferta bo'lib, O'zbekiston Respublikasi Fuqarolik kodeksining tegishli qoidalariga asosan tuzilgan.",
      "Xizmat narxlari va tarif rejalari markaz hajmi, o'quvchilar soni va tanlangan imkoniyatlar to'plamiga qarab individual tarzda belgilanadi.",
      "To'lov amalga oshirilgandan so'ng xizmat ko'rsatish belgilangan muddatda boshlanadi. To'lov shartlari va muddatlari shartnomada aniq ko'rsatiladi.",
      "Xizmatdan voz kechish yoki bekor qilish shartlari alohida kelishuv asosida belgilanadi.",
    ],
  },
];

export default function DocumentsPage() {
  const [dark, setDark] = usePublicTheme();
  const [open, setOpen] = useState(0);

  return (
    <PublicShell dark={dark}>
      <PublicNav dark={dark} setDark={setDark} />

      <section className="relative z-10 max-w-3xl mx-auto px-6 pt-12 pb-10 md:pt-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="display-font text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight">
            Hujjatlar
          </h1>
          <p className="text-[#2B1B10]/60 dark:text-white/60 text-lg mt-5 leading-relaxed">
            Platformadan foydalanish bilan bog'liq rasmiy hujjatlar. Savollaringiz bo'lsa, biz bilan bog'lanishdan tortinmang.
          </p>
        </motion.div>
      </section>

      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-24 space-y-4">
        {DOCUMENTS.map((doc, i) => {
          const Icon = doc.icon;
          const isOpen = open === i;
          return (
            <motion.div key={doc.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="abdora-milk border border-black/[0.06] dark:border-white/10 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full flex items-center gap-4 p-5 sm:p-6 text-left"
              >
                <div className="w-10 h-10 abdora-gradient rounded-xl flex items-center justify-center text-white flex-shrink-0">
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base">{doc.title}</h3>
                  <p className="text-xs text-[#2B1B10]/40 dark:text-white/40 mt-0.5">Yangilangan: {doc.updated}</p>
                </div>
                <ChevronDown size={18} className={`text-[#2B1B10]/40 dark:text-white/40 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-5 sm:px-6 pb-6 -mt-1 space-y-3">
                  {doc.paragraphs.map((p, pi) => (
                    <p key={pi} className="text-sm text-[#2B1B10]/60 dark:text-white/60 leading-relaxed">{p}</p>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </section>

      <PublicFooter />
    </PublicShell>
  );
}
