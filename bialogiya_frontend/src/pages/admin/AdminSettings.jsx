import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Globe, Bot, Shield, CreditCard, BookOpen, Building2,
  Bell, Palette, Upload, Phone, MapPin, Mail, Clock, Users,
  ChevronRight, Check, AlertCircle, RefreshCw, Image, FileText, X,
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import ToggleSwitch from '../../components/ui/ToggleSwitch';

/* ─── Sidebar nav items ─────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'center',    label: 'Markaz ma\'lumotlari', icon: Building2 },
  { id: 'platform',  label: 'Platforma',            icon: Globe },
  { id: 'payments',  label: 'To\'lovlar',            icon: CreditCard },
  { id: 'lms',       label: 'LMS Sozlamalari',      icon: BookOpen },
  { id: 'ai',        label: 'AI Funksiyalari',       icon: Bot },
  { id: 'notifications', label: 'Bildirishnomalar', icon: Bell },
  { id: 'security',  label: 'Xavfsizlik',           icon: Shield },
  { id: 'appearance',label: 'Ko\'rinish',            icon: Palette },
];

/* ─── Reusable sub-components ─────────────────────────────────── */
function SectionHeader({ kicker, title, subtitle }) {
  return (
    <div className="pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
      {kicker && <span className="panel-kicker">{kicker}</span>}
      <h2 className="panel-title mt-0.5">{title}</h2>
      {subtitle && <p className="panel-subtitle mt-1">{subtitle}</p>}
    </div>
  );
}

function SettingRow({ label, hint, children, noBorder = false }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-3.5 ${!noBorder ? 'border-b' : ''}`}
      style={{ borderColor: 'var(--border)' }}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
        {hint && <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{hint}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function FormGroup({ label, hint, children, required }) {
  return (
    <div className="space-y-1.5">
      <label className="form-label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="form-hint">{hint}</p>}
    </div>
  );
}

const PAYMENT_METHODS = [
  { key: 'cash',  label: 'Naqd pul',  icon: '💵' },
  { key: 'click', label: 'Click',     icon: '📱' },
  { key: 'payme', label: 'Payme',     icon: '💳' },
  { key: 'bank',  label: 'Bank o\'tkazma', icon: '🏦' },
  { key: 'other', label: 'Boshqa',    icon: '📌' },
];

const LANGUAGES = [
  { value: 'uz', label: "O'zbekcha" },
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

const TIMEZONES = [
  { value: 'Asia/Tashkent',    label: 'Toshkent (UTC+5)' },
  { value: 'Asia/Almaty',      label: 'Olmaota (UTC+6)' },
  { value: 'Europe/Moscow',    label: 'Moskva (UTC+3)' },
  { value: 'Europe/Istanbul',  label: 'Istanbul (UTC+3)' },
];

const CURRENCIES = [
  { value: 'UZS', label: "So'm (UZS)" },
  { value: 'USD', label: 'Dollar (USD)' },
  { value: 'EUR', label: 'Yevro (EUR)' },
  { value: 'RUB', label: 'Rubl (RUB)' },
];

const SUBJECTS = [
  'Ingliz tili', 'Matematika', 'Rus tili', 'Fizika', 'Kimyo', 'Biologiya',
  'Informatika', 'Tarix', 'Geografiya', 'Adabiyot', "O'zbek tili", 'Boshqa',
];

const LEVEL_OPTIONS = [
  'Starter', 'Elementary', 'Pre-Intermediate', 'Intermediate',
  'Upper-Intermediate', 'Advanced', 'Proficiency',
];

/* ─── Default settings ─────────────────────────────────────── */
const DEFAULT_SETTINGS = {
  // Center
  centerName: 'Abdora AI Markazi',
  centerAddress: '',
  centerPhone: '',
  centerEmail: '',
  centerWebsite: '',
  centerDescription: '',
  centerLogo: '',
  receiptHeader: '',
  receiptFooter: 'Xizmatimizdan foydalanganingiz uchun rahmat!',

  // Platform
  defaultLanguage: 'uz',
  timezone: 'Asia/Tashkent',
  currency: 'UZS',
  dateFormat: 'DD.MM.YYYY',

  // Payments
  enabledPaymentMethods: ['cash', 'click', 'payme'],
  autoReceiptOnPayment: true,
  paymentDueDayOfMonth: 5,
  lateFeeEnabled: false,
  lateFeePercent: 5,
  requireNoteOnPartialPayment: true,

  // LMS
  maxGroupSize: 30,
  passingScore: 60,
  enabledSubjects: SUBJECTS,
  enabledLevels: LEVEL_OPTIONS,
  xpPerLesson: 10,
  xpPerHomework: 15,
  xpPerTest: 20,
  certificatesEnabled: true,
  lessonProgressTracking: true,

  // AI
  aiEnabled: true,
  aiLessonGeneration: true,
  aiTestGeneration: true,
  aiGrading: true,
  aiSpeakingPractice: true,
  aiFinanceAdvice: true,
  aiChatEnabled: true,

  // Notifications
  notifyOnPayment: true,
  notifyOnHomework: true,
  notifyOnTest: true,
  notifyOnAttendance: false,
  notifyLeadFollowUp: true,
  notifyPayrollReady: true,

  // Security
  registrationOpen: false,
  sessionTimeoutMinutes: 480,
  requireStrongPassword: false,
  maxLoginAttempts: 5,

  // Appearance
  theme: 'light',
  sidebarCompact: false,
};

/* ─── Main Component ──────────────────────────────────────────── */
export default function AdminSettings() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('center');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  // Load settings from backend
  useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then(r => r.data?.data),
    onSuccess: (data) => {
      if (data && typeof data === 'object') {
        setSettings(prev => ({ ...prev, ...data }));
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: (d) => api.put('/admin/settings', d),
    onSuccess: () => {
      toast.success('Sozlamalar muvaffaqiyatli saqlandi!');
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  const togglePaymentMethod = (key) => {
    const arr = settings.enabledPaymentMethods;
    set('enabledPaymentMethods',
      arr.includes(key) ? arr.filter(k => k !== key) : [...arr, key]
    );
  };

  const toggleArrayItem = (field, item) => {
    const arr = settings[field] || [];
    set(field, arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  return (
    <div className="dashboard-shell max-w-6xl">
      <PageHeader
        title="Sozlamalar"
        subtitle="Tizimning barcha parametrlarini boshqarish"
        actions={
          <button
            onClick={() => saveMutation.mutate(settings)}
            disabled={saveMutation.isPending}
            className="btn-primary"
          >
            {saveMutation.isPending ? (
              <><RefreshCw size={14} className="animate-spin" /> Saqlanmoqda...</>
            ) : saved ? (
              <><Check size={14} /> Saqlandi</>
            ) : (
              <><Save size={14} /> Saqlash</>
            )}
          </button>
        }
      />

      <div className="settings-shell">
        {/* ── Left Nav ── */}
        <nav className="settings-nav space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`settings-nav-item w-full ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} className={isActive ? 'text-primary' : ''} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                <span className="flex-1 text-left text-sm">{label}</span>
                {isActive && <ChevronRight size={14} style={{ color: 'var(--primary)' }} />}
              </button>
            );
          })}
        </nav>

        {/* ── Right Content ── */}
        <div className="min-w-0 space-y-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >

              {/* ═══════════════ MARKAZ MA'LUMOTLARI ═══════════════ */}
              {activeTab === 'center' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Tashkilot"
                    title="Markaz ma'lumotlari"
                    subtitle="Kvitansiya, sertifikat va tizim sarlavhasida ko'rinadigan ma'lumotlar"
                  />

                  {/* Logo upload area */}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ background: 'var(--secondary-background)', border: '2px dashed var(--border)' }}
                    >
                      {settings.centerLogo ? (
                        <img src={settings.centerLogo} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Image size={28} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Markaz logotipi</div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>PNG, JPG, SVG — maks. 2MB</div>
                      <div className="flex gap-2">
                        <label className="btn-outline text-xs cursor-pointer">
                          <Upload size={13} /> Yuklash
                          <input type="file" accept="image/*" className="hidden" onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = ev => set('centerLogo', ev.target.result);
                            reader.readAsDataURL(file);
                          }} />
                        </label>
                        {settings.centerLogo && (
                          <button className="btn-ghost text-xs text-red-500" onClick={() => set('centerLogo', '')}>
                            O'chirish
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormGroup label="Markaz nomi" required>
                      <input value={settings.centerName} onChange={e => set('centerName', e.target.value)}
                        className="input-field" placeholder="Abdora AI Markazi" />
                    </FormGroup>
                    <FormGroup label="Telefon raqami">
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                        <input value={settings.centerPhone} onChange={e => set('centerPhone', e.target.value)}
                          className="input-field pl-9" placeholder="+998 90 123 45 67" />
                      </div>
                    </FormGroup>
                    <FormGroup label="Email manzil">
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                        <input value={settings.centerEmail} onChange={e => set('centerEmail', e.target.value)}
                          className="input-field pl-9" placeholder="info@markaz.uz" type="email" />
                      </div>
                    </FormGroup>
                    <FormGroup label="Veb-sayt">
                      <div className="relative">
                        <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                        <input value={settings.centerWebsite} onChange={e => set('centerWebsite', e.target.value)}
                          className="input-field pl-9" placeholder="https://markaz.uz" />
                      </div>
                    </FormGroup>
                  </div>

                  <FormGroup label="Manzil">
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                      <input value={settings.centerAddress} onChange={e => set('centerAddress', e.target.value)}
                        className="input-field pl-9" placeholder="Toshkent, Chilonzor tumani, 7-mavze..." />
                    </div>
                  </FormGroup>

                  <FormGroup label="Markaz haqida qisqacha" hint="Sayt va sertifikatlarda ko'rinadi">
                    <textarea value={settings.centerDescription} onChange={e => set('centerDescription', e.target.value)}
                      className="input-field resize-none" rows={3}
                      placeholder="Zamonaviy ta'lim markazi..." />
                  </FormGroup>

                  <div className="space-y-3">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      <FileText size={15} className="inline mr-1.5" />
                      Kvitansiya / Chek sozlamalari
                    </div>
                    <FormGroup label="Kvitansiya sarlavhasi" hint="To'lov chekining yuqori qismi">
                      <input value={settings.receiptHeader} onChange={e => set('receiptHeader', e.target.value)}
                        className="input-field" placeholder="Abdora AI Ta'lim Markazi" />
                    </FormGroup>
                    <FormGroup label="Kvitansiya izoh (pastki qism)">
                      <input value={settings.receiptFooter} onChange={e => set('receiptFooter', e.target.value)}
                        className="input-field" placeholder="Xizmatimizdan foydalanganingiz uchun rahmat!" />
                    </FormGroup>
                  </div>
                </div>
              )}

              {/* ═══════════════ PLATFORMA ═══════════════ */}
              {activeTab === 'platform' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Asosiy konfiguratsiya"
                    title="Platforma sozlamalari"
                    subtitle="Til, vaqt mintaqasi va valyuta"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormGroup label="Standart til">
                      <select value={settings.defaultLanguage} onChange={e => set('defaultLanguage', e.target.value)} className="input-field">
                        {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </FormGroup>
                    <FormGroup label="Vaqt mintaqasi">
                      <select value={settings.timezone} onChange={e => set('timezone', e.target.value)} className="input-field">
                        {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </FormGroup>
                    <FormGroup label="Valyuta">
                      <select value={settings.currency} onChange={e => set('currency', e.target.value)} className="input-field">
                        {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </FormGroup>
                    <FormGroup label="Sana formati">
                      <select value={settings.dateFormat} onChange={e => set('dateFormat', e.target.value)} className="input-field">
                        <option value="DD.MM.YYYY">DD.MM.YYYY (31.12.2026)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
                      </select>
                    </FormGroup>
                  </div>
                </div>
              )}

              {/* ═══════════════ TO'LOVLAR ═══════════════ */}
              {activeTab === 'payments' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Moliya"
                    title="To'lov sozlamalari"
                    subtitle="Ruxsat etilgan to'lov usullari va avtomatik jarayonlar"
                  />

                  <div>
                    <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                      Ruxsat etilgan to'lov usullari
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PAYMENT_METHODS.map(({ key, label, icon }) => {
                        const enabled = settings.enabledPaymentMethods.includes(key);
                        return (
                          <button
                            key={key}
                            onClick={() => togglePaymentMethod(key)}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                              enabled ? 'border-[var(--primary)] bg-[var(--primary-50)]' : 'border-[var(--border)] hover:border-[var(--primary)]/40'
                            }`}
                            style={{ color: enabled ? 'var(--primary)' : 'var(--text-secondary)' }}
                          >
                            <span className="text-lg">{icon}</span>
                            {label}
                            {enabled && <Check size={14} className="ml-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-0 divide-y" style={{ borderColor: 'var(--border)' }}>
                    <SettingRow
                      label="To'lovda avtomatik kvitansiya"
                      hint="Har bir to'lov yozilganda avtomatik chek raqami beriladi"
                    >
                      <ToggleSwitch checked={settings.autoReceiptOnPayment}
                        onChange={v => set('autoReceiptOnPayment', v)} />
                    </SettingRow>
                    <SettingRow
                      label="Qisman to'lovda izoh talab qilish"
                      hint="To'lov to'liq bo'lmasa, izoh yozish majburiy bo'ladi"
                    >
                      <ToggleSwitch checked={settings.requireNoteOnPartialPayment}
                        onChange={v => set('requireNoteOnPartialPayment', v)} />
                    </SettingRow>
                    <SettingRow
                      label="Kechikish uchun jarima"
                      hint="To'lov muddatidan kech to'langanda avtomatik jarima"
                      noBorder
                    >
                      <ToggleSwitch checked={settings.lateFeeEnabled}
                        onChange={v => set('lateFeeEnabled', v)} />
                    </SettingRow>
                  </div>

                  {settings.lateFeeEnabled && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl space-y-3"
                      style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
                      <FormGroup label="Jarima foizi (%)" hint="Kechikkan summa ustiga qo'shiladigan foiz">
                        <input type="number" min={0} max={50} value={settings.lateFeePercent}
                          onChange={e => set('lateFeePercent', +e.target.value)}
                          className="input-field w-32" />
                      </FormGroup>
                      <FormGroup label="To'lov muddati (oyning necha-kuni)">
                        <input type="number" min={1} max={28} value={settings.paymentDueDayOfMonth}
                          onChange={e => set('paymentDueDayOfMonth', +e.target.value)}
                          className="input-field w-32" />
                      </FormGroup>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ═══════════════ LMS ═══════════════ */}
              {activeTab === 'lms' && (
                <div className="space-y-5">
                  <div className="panel-card space-y-5">
                    <SectionHeader
                      kicker="O'quv jarayoni"
                      title="LMS Sozlamalari"
                      subtitle="Guruh sig'imi, baholash tizimi va gamifikatsiya"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormGroup label="Maksimal guruh sig'imi" hint="Bitta guruhga necha talaba kiritilishi mumkin">
                        <div className="flex items-center gap-2">
                          <Users size={15} style={{ color: 'var(--text-muted)' }} />
                          <input type="number" min={1} max={200} value={settings.maxGroupSize}
                            onChange={e => set('maxGroupSize', +e.target.value)} className="input-field" />
                        </div>
                      </FormGroup>
                      <FormGroup label="O'tish bali (%)" hint="Testdan o'tish uchun minimal foiz">
                        <input type="number" min={0} max={100} value={settings.passingScore}
                          onChange={e => set('passingScore', +e.target.value)} className="input-field" />
                      </FormGroup>
                    </div>

                    <div className="space-y-0 divide-y" style={{ borderColor: 'var(--border)' }}>
                      <SettingRow label="Dars progress kuzatuvi" hint="Talabalar darslarni tugatganini belgilashlari mumkin">
                        <ToggleSwitch checked={settings.lessonProgressTracking}
                          onChange={v => set('lessonProgressTracking', v)} />
                      </SettingRow>
                      <SettingRow label="Sertifikatlar" hint="Kursni tugatganlarga sertifikat berish imkoniyati" noBorder>
                        <ToggleSwitch checked={settings.certificatesEnabled}
                          onChange={v => set('certificatesEnabled', v)} />
                      </SettingRow>
                    </div>

                    <div>
                      <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>XP (Tajriba ball) tizimi</div>
                      <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Har bir faoliyat uchun beriluvchi XP miqdori</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Dars uchun XP', key: 'xpPerLesson', icon: '📚' },
                          { label: 'Vazifa uchun XP', key: 'xpPerHomework', icon: '📝' },
                          { label: 'Test uchun XP', key: 'xpPerTest', icon: '🎯' },
                        ].map(({ label, key, icon }) => (
                          <div key={key} className="p-3 rounded-xl" style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
                            <div className="text-lg mb-1">{icon}</div>
                            <div className="text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</div>
                            <input type="number" min={0} max={1000} value={settings[key]}
                              onChange={e => set(key, +e.target.value)}
                              className="input-field text-sm py-1.5" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Fanlar */}
                  <div className="panel-card space-y-4">
                    <SectionHeader title="Fanlar (Subjects)" subtitle="Guruhlar uchun tanlash mumkin bo'lgan fanlar" />
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(settings.enabledSubjects || []).map(subj => (
                        <div key={subj} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: 'var(--primary)' }}>
                          {subj}
                          <button onClick={() => toggleArrayItem('enabledSubjects', subj)} className="hover:text-red-200 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        id="newSubjectInput"
                        placeholder="Yangi fan nomi (masalan: Arab tili)" 
                        className="input-field text-sm"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            e.preventDefault();
                            if (!settings.enabledSubjects.includes(e.target.value.trim())) {
                              set('enabledSubjects', [...settings.enabledSubjects, e.target.value.trim()]);
                            }
                            e.target.value = '';
                          }
                        }}
                      />
                      <button 
                        type="button" 
                        className="btn-outline text-sm whitespace-nowrap"
                        onClick={() => {
                          const input = document.getElementById('newSubjectInput');
                          if (input.value.trim() && !settings.enabledSubjects.includes(input.value.trim())) {
                            set('enabledSubjects', [...settings.enabledSubjects, input.value.trim()]);
                            input.value = '';
                          }
                        }}
                      >
                        Qo'shish
                      </button>
                    </div>
                  </div>

                  {/* Darajalar */}
                  <div className="panel-card space-y-4">
                    <SectionHeader title="Kurs darajalari" subtitle="Guruhlar uchun mavjud daraja nomlari" />
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(settings.enabledLevels || []).map(lvl => (
                        <div key={lvl} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: 'var(--secondary)' }}>
                          {lvl}
                          <button onClick={() => toggleArrayItem('enabledLevels', lvl)} className="hover:text-red-200 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        id="newLevelInput"
                        placeholder="Yangi daraja (masalan: B2)" 
                        className="input-field text-sm"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            e.preventDefault();
                            if (!settings.enabledLevels.includes(e.target.value.trim())) {
                              set('enabledLevels', [...settings.enabledLevels, e.target.value.trim()]);
                            }
                            e.target.value = '';
                          }
                        }}
                      />
                      <button 
                        type="button" 
                        className="btn-outline text-sm whitespace-nowrap"
                        onClick={() => {
                          const input = document.getElementById('newLevelInput');
                          if (input.value.trim() && !settings.enabledLevels.includes(input.value.trim())) {
                            set('enabledLevels', [...settings.enabledLevels, input.value.trim()]);
                            input.value = '';
                          }
                        }}
                      >
                        Qo'shish
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════ AI FUNKSIYALARI ═══════════════ */}
              {activeTab === 'ai' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Sun'iy intellekt"
                    title="AI Funksiyalari"
                    subtitle="Platformada ishlatiladigan AI imkoniyatlarini yoqing yoki o'chiring"
                  />

                  <div
                    className="flex items-start gap-3 p-4 rounded-xl"
                    style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-100)' }}
                  >
                    <AlertCircle size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
                    <div className="text-xs" style={{ color: 'var(--primary-600)' }}>
                      AI agentlarni qo'shish va API tokenlarni boshqarish uchun{' '}
                      <a href="/admin/ai-agents" className="font-semibold underline">AI Agentlar sahifasiga</a> o'ting.
                      Bu yerda faqat funksiyalarni yoqish/o'chirish mumkin.
                    </div>
                  </div>

                  <div className="space-y-0 divide-y" style={{ borderColor: 'var(--border)' }}>
                    {[
                      { key: 'aiEnabled',          label: 'AI umumiy',             hint: 'Barcha AI funksiyalarni bir vaqtda yoqish/o\'chirish' },
                      { key: 'aiLessonGeneration',  label: 'Dars generatsiyasi',    hint: 'O\'qituvchilar uchun AI dars rejalari va matnlar' },
                      { key: 'aiTestGeneration',    label: 'Test generatsiyasi',    hint: 'Mavzu bo\'yicha avtomatik test savollar' },
                      { key: 'aiGrading',           label: 'AI baholash',           hint: 'Uy vazifalari va testlarni AI orqali baholash' },
                      { key: 'aiSpeakingPractice',  label: 'Speaking practice',     hint: 'Talabalar uchun AI bilan og\'zaki muloqot mashqlari' },
                      { key: 'aiFinanceAdvice',     label: 'Moliyaviy maslahat',    hint: 'AI orqali daromad va xarajatlar bo\'yicha tavsiyalar' },
                      { key: 'aiChatEnabled',       label: 'AI suhbat (Chat)',       hint: 'Darslar bo\'yicha AI-chat yordamchisi', noBorder: true },
                    ].map(({ key, label, hint, noBorder }) => (
                      <SettingRow key={key} label={label} hint={hint} noBorder={noBorder}>
                        <ToggleSwitch
                          checked={key === 'aiEnabled' ? settings.aiEnabled : (settings.aiEnabled && settings[key])}
                          disabled={key !== 'aiEnabled' && !settings.aiEnabled}
                          onChange={v => set(key, v)}
                        />
                      </SettingRow>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════════════ BILDIRISHNOMALAR ═══════════════ */}
              {activeTab === 'notifications' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Xabarlar"
                    title="Bildirishnoma sozlamalari"
                    subtitle="Qaysi hodisalarda tizim bildirishnomalar yuborishi kerak"
                  />
                  <div className="space-y-0 divide-y" style={{ borderColor: 'var(--border)' }}>
                    {[
                      { key: 'notifyOnPayment',    label: 'To\'lov qilinganda',       hint: 'Har bir to\'lov amalga oshganda xabardor qilish' },
                      { key: 'notifyOnHomework',   label: 'Uy vazifa topshirilganda', hint: 'Talaba vazifa topshirganda o\'qituvchiga xabar' },
                      { key: 'notifyOnTest',       label: 'Test yakunlanganda',       hint: 'Talaba test tugatganda o\'qituvchiga xabar' },
                      { key: 'notifyOnAttendance', label: 'Davomat belgilanganida',   hint: 'O\'qituvchi davomat yozganda xabar' },
                      { key: 'notifyLeadFollowUp', label: 'Lid eslatmasi',           hint: 'Belgilangan follow-up sana kelganda xabar' },
                      { key: 'notifyPayrollReady', label: 'Ish haqi tayyor',          hint: 'Oylik ish haqi hisoblanganda manager xabardor bo\'ladi', noBorder: true },
                    ].map(({ key, label, hint, noBorder }) => (
                      <SettingRow key={key} label={label} hint={hint} noBorder={noBorder}>
                        <ToggleSwitch checked={settings[key]} onChange={v => set(key, v)} />
                      </SettingRow>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════════════ XAVFSIZLIK ═══════════════ */}
              {activeTab === 'security' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Xavfsizlik"
                    title="Kirish va Xavfsizlik"
                    subtitle="Foydalanuvchi autentifikatsiyasi va kirish cheklovlari"
                  />
                  <div className="space-y-0 divide-y" style={{ borderColor: 'var(--border)' }}>
                    <SettingRow
                      label="Ochiq ro'yxatdan o'tish"
                      hint="Foydalanuvchilar admin taklifsiz mustaqil ro'yxatdan o'ta olishlari"
                    >
                      <ToggleSwitch checked={settings.registrationOpen}
                        onChange={v => set('registrationOpen', v)} />
                    </SettingRow>
                    <SettingRow
                      label="Kuchli parol talab qilish"
                      hint="Kamida 8 ta belgi, katta/kichik harf va raqam"
                    >
                      <ToggleSwitch checked={settings.requireStrongPassword}
                        onChange={v => set('requireStrongPassword', v)} />
                    </SettingRow>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormGroup label="Sessiya muddati (daqiqada)" hint="Faol bo'lmasa necha daqiqadan keyin chiqariladi">
                      <div className="flex items-center gap-2">
                        <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                        <input type="number" min={15} max={10080} value={settings.sessionTimeoutMinutes}
                          onChange={e => set('sessionTimeoutMinutes', +e.target.value)} className="input-field" />
                      </div>
                    </FormGroup>
                    <FormGroup label="Maks. noto'g'ri urinishlar" hint="Bloklanishdan oldin necha marta noto'g'ri parol kiritish mumkin">
                      <input type="number" min={3} max={20} value={settings.maxLoginAttempts}
                        onChange={e => set('maxLoginAttempts', +e.target.value)} className="input-field" />
                    </FormGroup>
                  </div>
                </div>
              )}

              {/* ═══════════════ KO'RINISH ═══════════════ */}
              {activeTab === 'appearance' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Interfeys"
                    title="Ko'rinish sozlamalari"
                    subtitle="Standart mavzu va interfeys opsiyalari"
                  />
                  <div>
                    <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Standart mavzu</div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'Yorug\'', preview: '#F6F7F9', card: '#FFFFFF' },
                        { value: 'dark',  label: 'Qorong\'u', preview: '#080D17', card: '#101827' },
                        { value: 'auto',  label: 'Tizim',   preview: 'linear-gradient(135deg,#F6F7F9 50%,#080D17 50%)', card: '' },
                      ].map(({ value, label, preview, card }) => {
                        const active = settings.theme === value;
                        return (
                          <button
                            key={value}
                            onClick={() => set('theme', value)}
                            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                              active ? 'border-[var(--primary)]' : 'border-[var(--border)]'
                            }`}
                          >
                            <div className="w-full h-12 rounded-lg mb-2 overflow-hidden"
                              style={{ background: preview, border: '1px solid var(--border)' }}>
                              {card && (
                                <div className="m-2 h-4 rounded" style={{ background: card }} />
                              )}
                            </div>
                            <div style={{ color: active ? 'var(--primary)' : 'var(--text-secondary)' }}>{label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <SettingRow label="Ixcham sidebar" hint="Sidebar ikonalari kichikroq ko'rsatiladi" noBorder>
                    <ToggleSwitch checked={settings.sidebarCompact} onChange={v => set('sidebarCompact', v)} />
                  </SettingRow>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
