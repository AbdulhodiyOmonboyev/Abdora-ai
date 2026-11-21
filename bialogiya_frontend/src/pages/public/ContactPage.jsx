import { useState } from 'react';
import { ArrowLeft, Check, Clock3, Mail, MapPin, Phone, Send, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import PhoneInput from '../../components/ui/PhoneInput';
import { cleanPhone } from '../../utils/formatPhone';
import './public.css';

const contacts = [
  {
    icon: Phone,
    title: 'Telefon',
    value: '+998 90 625 35 39',
    href: 'tel:+998906253539',
    hint: 'Qo‘ng‘iroq qilish',
  },
  {
    icon: Mail,
    title: 'Email',
    value: 'oyatilloomonboyev6@gmail.com',
    href: 'mailto:oyatilloomonboyev6@gmail.com',
    hint: 'Xat yuborish',
  },
  {
    icon: MapPin,
    title: 'Manzil',
    value: 'Andijon viloyati, Oltinko‘l tumani',
    href: 'https://maps.google.com/?q=Andijon,Oltinkol',
    hint: 'Xaritada ko‘rish',
  },
  {
    icon: Clock3,
    title: 'Ish vaqti',
    value: '24/7 — Har doim siz bilan',
    href: null,
    hint: 'Dam olish kunlarisiz',
  },
];

export default function ContactPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '+998 ', message: '' });
  const [status, setStatus] = useState('idle');

  const submit = async (event) => {
    event.preventDefault();
    setStatus('sending');
    try {
      await api.post('/applications', { ...form, phone: cleanPhone(form.phone) });
      navigate('/contact/success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="public-container">
      <div className="public-page-heading mb-10">
        <span className="public-eyebrow">Aloqa</span>
        <h1 className="public-title">Biz bilan bog‘laning</h1>
        <p className="public-lede">
          Savollaringiz bormi yoki platforma bo‘yicha konsultatsiya olmoqchimisiz? Biz bilan to‘g‘ridan-to‘g‘ri bog‘laning yoki ariza qoldiring.
        </p>
      </div>

      <div className="contact-grid">
        <div className="contact-info">
          {contacts.map(({ icon: Icon, title, value, href, hint }) => {
            const Content = (
              <div className="public-card contact-card group hover:border-orange-500 transition-all duration-200">
                <span className="service-icon group-hover:scale-110 transition-transform">
                  <Icon size={20} className="text-orange-500" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <small className="text-xs text-gray-500 dark:text-gray-400 font-medium">{title}</small>
                    {href && <ExternalLink size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                  <strong className="text-sm font-semibold text-gray-900 dark:text-white truncate block mt-0.5">
                    {value}
                  </strong>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 block mt-0.5">{hint}</span>
                </div>
              </div>
            );

            return href ? (
              <a
                key={title}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="block no-underline"
              >
                {Content}
              </a>
            ) : (
              <div key={title}>{Content}</div>
            );
          })}
        </div>

        <form className="public-card contact-form public-form" onSubmit={submit}>
          <div className="form-row">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ism Familiya
              <input
                className="public-field"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ismingizni kiriting"
              />
            </label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email manzilingiz
              <input
                className="public-field"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
              />
            </label>
          </div>

          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Telefon raqam
            <PhoneInput
              className="public-field"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>

          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Xabar yoki taklif
            <textarea
              className="public-field"
              rows="4"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Savol yoki taklifingizni qoldiring..."
            />
          </label>

          <button className="public-button primary w-full justify-center text-sm font-semibold py-3" disabled={status === 'sending'} type="submit">
            <Send size={16} />
            {status === 'sending' ? 'Yuborilmoqda...' : 'Xabarni yuborish'}
          </button>

          {status === 'error' && (
            <p className="form-error text-red-500 text-xs text-center mt-2">
              Xatolik yuz berdi. Iltimos, birozdan so‘ng qayta urinib ko‘ring.
            </p>
          )}
        </form>
      </div>

      <style>{`
        .contact-grid {
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 24px;
          align-items: start;
        }
        .contact-info {
          display: grid;
          gap: 12px;
        }
        .contact-card {
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .contact-card .service-icon {
          flex: none;
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: rgba(255, 120, 0, 0.1);
        }
        .contact-form {
          padding: 28px;
        }
        .contact-form label {
          display: grid;
          gap: 7px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media(max-width: 768px) {
          .contact-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

export function ContactSuccessPage() {
  return (
    <main className="public-container success-page">
      <div className="success-mark">
        <Check size={38} />
      </div>
      <span className="public-eyebrow">Muvaffaqiyatli</span>
      <h1 className="public-title">Xabaringiz qabul qilindi!</h1>
      <p className="public-lede">
        Tez orada siz bilan bog‘lanamiz. Bizga ishonchingiz uchun rahmat!
      </p>
      <a className="public-button primary" href="/">
        <ArrowLeft size={16} /> Bosh sahifaga qaytish
      </a>
      <style>{`
        .success-page {
          text-align: center;
          display: flex;
          align-items: center;
          flex-direction: column;
          justify-content: center;
          min-height: 600px;
        }
        .success-page .public-title {
          font-size: clamp(2.2rem, 5vw, 4rem);
        }
        .success-page .public-lede {
          margin-bottom: 28px;
        }
        .success-mark {
          display: grid;
          place-items: center;
          width: 82px;
          height: 82px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--orange), var(--orange-2));
          color: #fff;
          box-shadow: 0 0 0 12px rgba(255, 120, 0, 0.1), 0 0 45px rgba(255, 120, 0, 0.3);
          margin-bottom: 24px;
          animation: success-pop 0.55s ease both;
        }
        @keyframes success-pop {
          from { opacity: 0; transform: scale(0.6); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </main>
  );
}
