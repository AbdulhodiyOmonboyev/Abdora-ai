import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, MessageSquare, User, ArrowRight, Loader2, CheckCircle2, Send } from 'lucide-react';
import api from '../../config/axios';
import usePublicTheme from '../../hooks/usePublicTheme';
import PublicShell from '../../components/public/PublicShell';
import PublicNav from '../../components/public/PublicNav';
import PublicFooter from '../../components/public/PublicFooter';

const CONTACT_INFO = [
  { icon: Phone, label: 'Telefon', value: '+998 90 123 45 67', href: 'tel:+998901234567' },
  { icon: Mail, label: 'Email', value: 'info@abdora.ai', href: 'mailto:info@abdora.ai' },
  { icon: MapPin, label: 'Manzil', value: 'Toshkent shahri, O\'zbekiston', href: null },
];

export default function ContactPage() {
  const [dark, setDark] = usePublicTheme();
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setStatus('sending');
    try {
      await api.post('/applications', form);
      setStatus('sent');
      setForm({ name: '', phone: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <PublicShell dark={dark}>
      <PublicNav dark={dark} setDark={setDark} />

      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-16 md:pt-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mb-14">
          <h1 className="display-font text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight">
            Biz bilan bog'laning
          </h1>
          <p className="text-[#2B1B10]/60 dark:text-white/60 text-lg mt-5 leading-relaxed">
            Savolingiz bormi yoki markazingiz uchun demo ko'rishni xohlaysizmi? Quyidagi shakl orqali yozing —
            jamoamiz tez orada siz bilan bog'lanadi.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Contact info */}
          <div className="md:col-span-2 space-y-4">
            {CONTACT_INFO.map((c, i) => {
              const Icon = c.icon;
              const Wrapper = c.href ? 'a' : 'div';
              return (
                <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}>
                  <Wrapper
                    {...(c.href ? { href: c.href } : {})}
                    className="flex items-center gap-4 abdora-milk border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 hover:border-[#FF7A1A]/40 transition-colors"
                  >
                    <div className="w-11 h-11 abdora-gradient rounded-xl flex items-center justify-center text-white flex-shrink-0">
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="text-xs text-[#2B1B10]/40 dark:text-white/40">{c.label}</div>
                      <div className="font-semibold text-sm mt-0.5">{c.value}</div>
                    </div>
                  </Wrapper>
                </motion.div>
              );
            })}

            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="abdora-gradient rounded-2xl p-6 text-white abdora-glow">
              <Send size={20} className="mb-3 opacity-90" />
              <h3 className="font-semibold text-base mb-1.5">Tez javob olasiz</h3>
              <p className="text-sm text-white/80 leading-relaxed">Odatda arizalarga bir ish kuni ichida javob beramiz.</p>
            </motion.div>
          </div>

          {/* Form */}
          <div className="md:col-span-3">
            {status === 'sent' ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-[#FF7A1A]/10 border border-[#FF7A1A]/25 rounded-3xl p-10 text-center h-full flex flex-col items-center justify-center">
                <CheckCircle2 size={40} className="text-[#FF7A1A] mx-auto mb-4" />
                <h3 className="font-semibold text-xl mb-1.5">Xabaringiz qabul qilindi!</h3>
                <p className="text-[#2B1B10]/60 dark:text-white/60 text-sm">Tez orada siz bilan bog'lanamiz.</p>
              </motion.div>
            ) : (
              <form onSubmit={submit} className="abdora-milk border border-black/[0.06] dark:border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#2B1B10]/50 dark:text-white/50 mb-1.5 flex items-center gap-1.5"><User size={12} /> Ism-familiya *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ismingiz" required
                    className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm placeholder-[#2B1B10]/30 dark:placeholder-white/30 focus:outline-none focus:border-[#FF7A1A]/60 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#2B1B10]/50 dark:text-white/50 mb-1.5 flex items-center gap-1.5"><Phone size={12} /> Telefon raqami *</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+998 90 123 45 67" required type="tel"
                    className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm placeholder-[#2B1B10]/30 dark:placeholder-white/30 focus:outline-none focus:border-[#FF7A1A]/60 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#2B1B10]/50 dark:text-white/50 mb-1.5 flex items-center gap-1.5"><MessageSquare size={12} /> Xabar</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Savolingiz yoki markazingiz haqida qisqacha ma'lumot" rows={5}
                    className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm placeholder-[#2B1B10]/30 dark:placeholder-white/30 focus:outline-none focus:border-[#FF7A1A]/60 transition-colors resize-none" />
                </div>
                <button type="submit" disabled={status === 'sending'}
                  className="w-full abdora-gradient rounded-xl py-3.5 font-semibold text-sm text-white flex items-center justify-center gap-2 abdora-glow hover:opacity-90 transition-opacity disabled:opacity-50">
                  {status === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {status === 'sending' ? 'Yuborilmoqda...' : 'Xabarni yuborish'}
                </button>
                {status === 'error' && (
                  <p className="text-xs text-red-500 dark:text-red-400 text-center">Xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring.</p>
                )}
              </form>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </PublicShell>
  );
}
