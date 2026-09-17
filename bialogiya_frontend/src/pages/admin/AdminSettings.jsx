import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Globe, Bot, Shield, CreditCard, BookOpen, Building2,
  Bell, Palette, Upload, Phone, MapPin, Mail, Clock, Users,
  ChevronRight, Check, AlertCircle, RefreshCw, Image, FileText, X,
  Coins, Smartphone, Target, ShoppingBag, Award, Sparkles, MessageCircle,
  Banknote, Wallet, CheckCircle2, FileEdit,
  ShieldCheck, Lock, Unlock, PieChart, GraduationCap, BookMarked, Calendar,
  Plus, Trash2, Pencil, UserCog, Copy,
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import { useSearchParams } from 'react-router-dom';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import PhoneInput from '../../components/ui/PhoneInput';
import { cleanPhone } from '../../utils/formatPhone';

/* ─── Sidebar nav items ─────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'center',          label: 'Markaz ma\'lumotlari',     icon: Building2 },
  { id: 'platform',        label: 'Platforma',                icon: Globe },
  { id: 'reception_perms', label: 'Qabulxona (Reception)',    icon: ShieldCheck, roles: ['admin', 'manager'] },
  { id: 'payments',        label: 'To\'lovlar',                icon: CreditCard },
  { id: 'lms',             label: 'LMS Sozlamalari',          icon: BookOpen },
  { id: 'gamification',    label: 'Tangalar (Coins) & Gamifikatsiya', icon: Coins },
  { id: 'crm_settings',    label: 'CRM Konfiguratsiyasi',      icon: Target },
  { id: 'integrations',    label: 'SMS va Telegram',           icon: Smartphone },
  { id: 'ai',              label: 'AI Funksiyalari',           icon: Bot },
  { id: 'notifications',   label: 'Bildirishnomalar',         icon: Bell },
  { id: 'security',        label: 'Xavfsizlik',               icon: Shield },
  { id: 'appearance',      label: 'Ko\'rinish',                icon: Palette },
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
  { key: 'cash',  label: 'Naqd pul',      icon: Banknote },
  { key: 'click', label: 'Click',         icon: Smartphone },
  { key: 'payme', label: 'Payme',         icon: CreditCard },
  { key: 'bank',  label: 'Bank o\'tkazma', icon: Building2 },
  { key: 'other', label: 'Boshqa',        icon: Wallet },
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

  // Qabulxona (Reception) huquqlari
  receptionPermissions: {
    canViewFinance: false,       // Odatiy: Moliya yopiq
    canViewCashbox: false,       // Odatiy: Kassa yopiq
    canManagePayments: true,     // To'lovlarni qabul qilish
    canManageLeads: true,        // Lidlar va CRM
    canManageTimetable: true,    // Jadval va xonalar
    canManageGroups: true,       // Guruhlar ro'yxati
    canManageStudents: true,     // O'quvchilar ro'yxati
    canManageTeachers: true,     // O'qituvchilar ro'yxati
  },

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

  // Tangalar (Coins) & Gamifikatsiya
  coinsEnabled: true,
  coinsPerLesson: 5,
  coinsPerHomework: 10,
  coinsPerTest: 15,
  coinsPerStreakDay: 3,
  coinExchangeRate: 100, // 1 tanga = 100 so'm
  allowCoinsForPayment: true,
  maxCoinPaymentPercent: 20,
  coinShopEnabled: true,
  leaderboardPublic: true,

  // CRM Konfiguratsiyasi
  leadSources: ['Instagram', 'Telegram', 'Tavsiya', 'Ko\'cha reklama', 'Veb-sayt', 'Boshqa'],
  freeTrialEnabled: true,
  autoAssignLeads: true,
  inactiveLeadDays: 14,
  requireLeadPhone: true,

  // Integratsiyalar (SMS & Telegram)
  smsProvider: 'eskiz',
  smsEmail: '',
  smsToken: '',
  smsSenderName: '4546',
  telegramBotToken: '',
  telegramBotUsername: '',
  autoSmsOnAbsence: false,
  autoSmsOnPaymentDue: true,
  autoSmsOnPaymentSuccess: true,

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
  const { user } = useAuthStore();
  const applyTheme = useThemeStore(s => s.applyTheme);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTabState] = useState(() => {
    return urlTab || localStorage.getItem('admin_settings_tab') || 'center';
  });

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
    try {
      localStorage.setItem('admin_settings_tab', tabId);
    } catch (e) {}
  };

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  // Load settings strictly isolated for this specific user & center
  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ['admin-settings', user?.id, user?.centerId],
    queryFn: () => api.get('/admin/settings').then(r => r.data?.data),
    enabled: !!user,
  });

  useEffect(() => {
    if (serverSettings && typeof serverSettings === 'object' && Object.keys(serverSettings).length > 0) {
      setSettings(prev => ({ ...DEFAULT_SETTINGS, ...serverSettings }));
    }
  }, [serverSettings]);

  const saveMutation = useMutation({
    mutationFn: (d) => api.put('/admin/settings', d),
    onSuccess: (res) => {
      toast.success('Sozlamalar muvaffaqiyatli saqlandi!');
      qc.invalidateQueries({ queryKey: ['admin-settings', user?.id, user?.centerId] });
      if (res?.data?.data) {
        setSettings(prev => ({ ...DEFAULT_SETTINGS, ...res.data.data }));
      }
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

  const handleSave = () => {
    saveMutation.mutate({
      ...settings,
      centerPhone: cleanPhone(settings.centerPhone),
    });
  };

  // ─── Reception Management in Settings ───
  const EMPTY_RECEPTION_FORM = { name: '', phone: '+998 ', email: '', language: 'uz', branchId: '' };
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [editingReceptionId, setEditingReceptionId] = useState(null);
  const [receptionForm, setReceptionForm] = useState(EMPTY_RECEPTION_FORM);
  const [receptionNewCreds, setReceptionNewCreds] = useState(null);
  const [receptionConfirm, setReceptionConfirm] = useState(null);

  const { data: receptionUsers = [], isLoading: isReceptionLoading } = useQuery({
    queryKey: ['admin-reception'],
    queryFn: () => api.get('/admin/reception').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
    enabled: activeTab === 'reception_perms',
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: () => api.get('/admin/branches').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
    enabled: activeTab === 'reception_perms',
  });

  const createReceptionMutation = useMutation({
    mutationFn: (d) => api.post('/admin/reception', d),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['admin-reception'] });
      qc.invalidateQueries({ queryKey: ['admin-branches'] });
      setReceptionNewCreds(data?.data?.credentials || null);
      setReceptionForm(EMPTY_RECEPTION_FORM);
      toast.success("Qabulxona hisobi muvaffaqiyatli yaratildi");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Xatolik yuz berdi");
    }
  });

  const updateReceptionMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/reception/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reception'] });
      qc.invalidateQueries({ queryKey: ['admin-branches'] });
      closeReceptionModal();
      toast.success("Qabulxona ma'lumotlari muvaffaqiyatli yangilandi");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Xatolik yuz berdi");
    }
  });

  const deleteReceptionMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/reception/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reception'] });
      qc.invalidateQueries({ queryKey: ['admin-branches'] });
      toast.success("Qabulxona hisobi o'chirildi");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Xatolik yuz berdi");
    }
  });

  const openReceptionEdit = (u) => {
    setEditingReceptionId(u.id);
    setReceptionForm({
      name: u.name || '',
      phone: u.phone || '+998 ',
      email: u.email || '',
      language: 'uz',
      branchId: u.branches?.[0]?.id || u.branchId || '',
    });
    setReceptionNewCreds(null);
    setShowReceptionModal(true);
  };

  const closeReceptionModal = () => {
    setShowReceptionModal(false);
    setEditingReceptionId(null);
    setReceptionNewCreds(null);
    setReceptionForm(EMPTY_RECEPTION_FORM);
  };

  const handleReceptionSubmit = () => {
    if (!receptionForm.name) return;
    const phone = cleanPhone(receptionForm.phone);
    if (editingReceptionId) {
      updateReceptionMutation.mutate({
        id: editingReceptionId,
        data: {
          name: receptionForm.name,
          phone,
          email: receptionForm.email || undefined,
          branchId: receptionForm.branchId || null
        }
      });
    } else {
      createReceptionMutation.mutate({
        ...receptionForm,
        phone,
      });
    }
  };

  const handleDeleteReception = (u) => {
    setReceptionConfirm({
      title: `"${u.name}"ni o'chirish`,
      message: "Qabulxona xodimi tizimga kira olmaydi.",
      onConfirm: () => deleteReceptionMutation.mutate(u.id),
    });
  };

  return (
    <div className="dashboard-shell max-w-6xl w-full mx-auto">
      <ConfirmDialog confirm={receptionConfirm} onClose={() => setReceptionConfirm(null)} />
      <PageHeader
        title="Sozlamalar"
        subtitle="Tizimning barcha parametrlarini boshqarish"
        actions={
          <button
            onClick={handleSave}
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
          {NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role)).map(({ id, label, icon: Icon }) => {
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
                        <PhoneInput value={settings.centerPhone} onChange={e => set('centerPhone', e.target.value)}
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

              {/* ═══════════════ QABULXONA HUQUQLARI ═══════════════ */}
              {activeTab === 'reception_perms' && (
                <div className="panel-card space-y-6">
                  <SectionHeader
                    kicker="Xavfsizlik va kirish huquqlari"
                    title="Qabulxona (Reception) huquqlari"
                    subtitle="Qabulxona xodimlariga qaysi bo'limlar ko'rinishi va qaysi amallarni bajara olishini boshqaring"
                  />

                  {/* 1-bosishda Moliya va Kassani bloklash / ochish banneri */}
                  {(() => {
                    const isFinanceCashboxBlocked = !settings.receptionPermissions?.canViewFinance && !settings.receptionPermissions?.canViewCashbox;
                    return (
                      <div
                        className="p-5 rounded-2xl border transition-all"
                        style={{
                          background: isFinanceCashboxBlocked
                            ? 'rgba(239, 68, 68, 0.05)'
                            : 'rgba(16, 185, 129, 0.05)',
                          borderColor: isFinanceCashboxBlocked
                            ? 'rgba(239, 68, 68, 0.25)'
                            : 'rgba(16, 185, 129, 0.25)',
                        }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{
                                background: isFinanceCashboxBlocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: isFinanceCashboxBlocked ? '#ef4444' : '#10b981',
                              }}
                            >
                              {isFinanceCashboxBlocked ? <Lock size={22} /> : <Unlock size={22} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  Moliya va Kassa xavfsizligi
                                </h3>
                                <span className={`badge text-xs ${isFinanceCashboxBlocked ? 'badge-danger' : 'badge-success'}`}>
                                  {isFinanceCashboxBlocked ? 'Moliya va Kassa yopiq (Bloklangan)' : 'Moliya va Kassa ochiq'}
                                </span>
                              </div>
                              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                {isFinanceCashboxBlocked
                                  ? 'Qabulxona xodimlari Moliya dashboardi, hisobotlar va Kassani ko\'ra olmaydi.'
                                  : 'Qabulxona xodimlariga Moliya va Kassa bo\'limlari ko\'rinib turibdi.'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const newBlocked = !isFinanceCashboxBlocked;
                              const updatedPerms = {
                                ...(settings.receptionPermissions || {}),
                                canViewFinance: !newBlocked,
                                canViewCashbox: !newBlocked,
                              };
                              set('receptionPermissions', updatedPerms);
                              api.put('/admin/settings', { receptionPermissions: updatedPerms })
                                .then(() => {
                                  qc.invalidateQueries({ queryKey: ['admin-settings'] });
                                  qc.invalidateQueries({ queryKey: ['center-settings'] });
                                })
                                .catch(() => {});
                              toast.success(newBlocked ? 'Moliya va Kassa qabulxona uchun yopildi!' : 'Moliya va Kassa qabulxona uchun ochildi!');
                            }}
                            className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors flex-shrink-0 ${
                              isFinanceCashboxBlocked
                                ? 'btn-primary'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          >
                            {isFinanceCashboxBlocked ? (
                              <>
                                <Unlock size={16} /> Moliya va Kassaga ruxsat berish
                              </>
                            ) : (
                              <>
                                <Lock size={16} /> 1 bosishda bloklash
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Barcha ruxsatlar bo'yicha batafsil sozlamalar */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Qabulxona xodimlarining aniq ruxsatlari
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        {
                          key: 'canViewFinance',
                          label: 'Moliya sahifasi va hisobotlari',
                          hint: 'Moliya dashboardi, sof daromad, oylik statistika',
                          icon: PieChart,
                          color: '#6366f1',
                        },
                        {
                          key: 'canViewCashbox',
                          label: 'Kassa va naqd tushumlar',
                          hint: 'Kassa qoldig\'i, kirim-chiqimlar va kassa jurnali',
                          icon: Wallet,
                          color: '#10b981',
                        },
                        {
                          key: 'canManagePayments',
                          label: "To'lovlarni qabul qilish",
                          hint: "O'quvchilardan to'lov olish va kvitansiya chiqarish",
                          icon: CreditCard,
                          color: '#f59e0b',
                        },
                        {
                          key: 'canManageLeads',
                          label: 'Lidlar (CRM) bilan ishlash',
                          hint: "Yangi murojaatlarni kiritish, qo'ng'iroqlar va statuslar",
                          icon: Target,
                          color: '#ec4899',
                        },
                        {
                          key: 'canManageTimetable',
                          label: 'Dars jadvali va xonalar',
                          hint: "O'quv xonalari va dars jadvallarini ko'rish",
                          icon: Calendar,
                          color: '#06b6d4',
                        },
                        {
                          key: 'canManageGroups',
                          label: 'Guruhlar ro\'yxati',
                          hint: "Guruhlar, dars kunlari va guruh tarkibini ko'rish",
                          icon: Users,
                          color: '#3b82f6',
                        },
                        {
                          key: 'canManageStudents',
                          label: "O'quvchilar ro'yxati",
                          hint: "O'quvchilar ma'lumotlari va profilini ko'rish",
                          icon: GraduationCap,
                          color: '#8b5cf6',
                        },
                        {
                          key: 'canManageTeachers',
                          label: "O'qituvchilar ro'yxati",
                          hint: "O'qituvchilar va ularning guruhlarini ko'rish",
                          icon: BookMarked,
                          color: '#14b8a6',
                        },
                      ].map(({ key, label, hint, icon: Icon, color }) => {
                        const isChecked = settings.receptionPermissions?.[key] ?? (key === 'canViewFinance' || key === 'canViewCashbox' ? false : true);
                        return (
                          <div
                            key={key}
                            className="p-4 rounded-xl border flex items-center justify-between gap-3 transition-colors"
                            style={{
                              borderColor: 'var(--border)',
                              background: isChecked ? 'var(--card)' : 'var(--secondary-background)',
                              opacity: isChecked ? 1 : 0.75,
                            }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: `${color}15`, color }}
                              >
                                <Icon size={18} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium leading-snug truncate" style={{ color: 'var(--text-primary)' }}>
                                  {label}
                                </div>
                                <div className="text-xs leading-tight line-clamp-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                  {hint}
                                </div>
                              </div>
                            </div>
                            <ToggleSwitch
                              checked={isChecked}
                              onChange={(val) => {
                                const updatedPerms = {
                                  ...(settings.receptionPermissions || {}),
                                  [key]: val,
                                };
                                set('receptionPermissions', updatedPerms);
                                api.put('/admin/settings', { receptionPermissions: updatedPerms })
                                  .then(() => {
                                    qc.invalidateQueries({ queryKey: ['admin-settings'] });
                                    qc.invalidateQueries({ queryKey: ['center-settings'] });
                                  })
                                  .catch(() => {});
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Qabulxona xodimlari ro'yxati ── */}
                  <div className="pt-6 border-t space-y-4" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                          Qabulxona xodimlari ro'yxati
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          Filiallarga biriktirilgan qabulxona hisoblari va ularning kirish ma'lumotlari
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReceptionId(null);
                          setReceptionForm(EMPTY_RECEPTION_FORM);
                          setReceptionNewCreds(null);
                          setShowReceptionModal(true);
                        }}
                        className="btn-primary flex items-center gap-2 self-start sm:self-auto text-xs py-2 px-3.5"
                      >
                        <Plus size={15} /> Hisob qo'shish
                      </button>
                    </div>

                    {isReceptionLoading ? (
                      <div className="py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                        <RefreshCw size={18} className="animate-spin mx-auto mb-2 opacity-50" />
                        Yuklanmoqda...
                      </div>
                    ) : receptionUsers.length > 0 ? (
                      <div className="space-y-2.5">
                        {receptionUsers.map((u) => {
                          const branchName = u.branches?.[0]?.name || u.branch?.name;
                          return (
                            <div
                              key={u.id}
                              className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                  {u.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                      {u.name}
                                    </span>
                                    <span className={`badge text-[11px] ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                                      {u.isActive ? 'Faol' : 'Nofaol'}
                                    </span>
                                  </div>
                                  <div className="text-xs flex items-center gap-3 flex-wrap mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    <span className="font-medium text-primary-600 dark:text-primary-400">@{u.username}</span>
                                    {u.phone && (
                                      <span className="flex items-center gap-1 font-mono">
                                        <Phone size={11} /> {u.phone}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                      <Building2 size={11} />
                                      {branchName ? branchName : (u._count?.branches > 0 ? `${u._count.branches} ta filial` : 'Filial biriktirilmagan')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openReceptionEdit(u)}
                                  className="btn-ghost p-2 rounded-lg"
                                  title="Tahrirlash"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReception(u)}
                                  className="btn-ghost p-2 rounded-lg text-red-500 hover:bg-red-500/10"
                                  title="O'chirish"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        className="text-center py-10 rounded-2xl border border-dashed"
                        style={{ borderColor: 'var(--border)', background: 'var(--secondary-background)' }}
                      >
                        <UserCog size={36} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Hali qabulxona hisoblari yo'q
                        </p>
                        <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
                          Markazingiz filiali uchun yangi qabulxona xodimini qo'shing. Ular o'quvchilar va darslarni boshqaradilar.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReceptionId(null);
                            setReceptionForm(EMPTY_RECEPTION_FORM);
                            setReceptionNewCreds(null);
                            setShowReceptionModal(true);
                          }}
                          className="btn-primary text-xs py-2 px-4 mt-3.5 inline-flex items-center gap-1.5"
                        >
                          <Plus size={14} /> Yangi hisob qo'shish
                        </button>
                      </div>
                    )}
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
                      {PAYMENT_METHODS.map(({ key, label, icon: Icon }) => {
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
                            <Icon size={18} className="flex-shrink-0" />
                            <span>{label}</span>
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
                          { label: 'Dars uchun XP', key: 'xpPerLesson', icon: BookOpen },
                          { label: 'Vazifa uchun XP', key: 'xpPerHomework', icon: FileEdit },
                          { label: 'Test uchun XP', key: 'xpPerTest', icon: Target },
                        ].map(({ label, key, icon: Icon }) => (
                          <div key={key} className="p-3 rounded-xl" style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
                            <div className="mb-1 text-[var(--primary)]"><Icon size={20} /></div>
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

              {/* ═══════════════ GAMIFIKATSIYA & TANGALAR ═══════════════ */}
              {activeTab === 'gamification' && (
                <div className="space-y-4">
                  <div className="panel-card space-y-5">
                    <SectionHeader
                      kicker="Gamifikatsiya"
                      title="Tanga va mukofot tizimi"
                      subtitle="O'quvchilarni rag'batlantirish uchun tanga (coin) va ball tizimini sozlang"
                    />
                    <SettingRow label="Tanga tizimini yoqish" hint="O'quvchilar faollik uchun tanga to'playdi">
                      <ToggleSwitch checked={settings.coinsEnabled} onChange={v => set('coinsEnabled', v)} />
                    </SettingRow>
                    {settings.coinsEnabled && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <FormGroup label="Dars uchun tanga" hint="Har bir o'tilgan dars uchun">
                          <input type="number" min={0} max={100} value={settings.coinsPerLesson}
                            onChange={e => set('coinsPerLesson', +e.target.value)} className="input-field w-32" />
                        </FormGroup>
                        <FormGroup label="Uy vazifasi uchun tanga" hint="Topshirilgan har bir uy vazifasi uchun">
                          <input type="number" min={0} max={100} value={settings.coinsPerHomework}
                            onChange={e => set('coinsPerHomework', +e.target.value)} className="input-field w-32" />
                        </FormGroup>
                        <FormGroup label="Test uchun tanga" hint="Har bir tugatilgan test uchun">
                          <input type="number" min={0} max={100} value={settings.coinsPerTest}
                            onChange={e => set('coinsPerTest', +e.target.value)} className="input-field w-32" />
                        </FormGroup>
                        <FormGroup label="Streak uchun tanga/kun" hint="Ketma-ket kelish uchun qo'shimcha bonus">
                          <input type="number" min={0} max={50} value={settings.coinsPerStreakDay}
                            onChange={e => set('coinsPerStreakDay', +e.target.value)} className="input-field w-32" />
                        </FormGroup>
                        <FormGroup label="Tanga kursi (so'm)" hint="1 tanga = necha so'm (to'lovda ishlatish uchun)">
                          <input type="number" min={1} value={settings.coinExchangeRate}
                            onChange={e => set('coinExchangeRate', +e.target.value)} className="input-field w-36" />
                        </FormGroup>
                        <FormGroup label="Maksimal tanga foizi" hint="To'lovda tangalar bilan to'lash mumkin bo'lgan maksimal foiz">
                          <div className="flex items-center gap-2">
                            <input type="number" min={0} max={100} value={settings.maxCoinPaymentPercent}
                              onChange={e => set('maxCoinPaymentPercent', +e.target.value)} className="input-field w-24" />
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>%</span>
                          </div>
                        </FormGroup>
                      </motion.div>
                    )}
                  </div>
                  {settings.coinsEnabled && (
                    <div className="panel-card space-y-4">
                      <SectionHeader title="Qo'shimcha optsiyalar" subtitle="Tangalar bilan bog'liq qo'shimcha imkoniyatlar" />
                      <div className="space-y-0 divide-y" style={{ borderColor: 'var(--border)' }}>
                        <SettingRow label="To'lovda tanga ishlatish" hint="O'quvchilar yig'gan tangani o'quv to'loviga hisoblay oladi">
                          <ToggleSwitch checked={settings.allowCoinsForPayment} onChange={v => set('allowCoinsForPayment', v)} />
                        </SettingRow>
                        <SettingRow label="Tanga do'koni" hint="O'quvchilar tangaga sovg'a, chegirma va imtiyozlar sotib olishi">
                          <ToggleSwitch checked={settings.coinShopEnabled} onChange={v => set('coinShopEnabled', v)} />
                        </SettingRow>
                        <SettingRow label="Ochiq liderlar jadvali" hint="O'quvchilar bir-birining reytingini ko'rishi mumkin" noBorder>
                          <ToggleSwitch checked={settings.leaderboardPublic} onChange={v => set('leaderboardPublic', v)} />
                        </SettingRow>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════ CRM SOZLAMALARI ═══════════════ */}
              {activeTab === 'crm_settings' && (
                <div className="space-y-4">
                  <div className="panel-card space-y-5">
                    <SectionHeader
                      kicker="CRM"
                      title="CRM konfiguratsiyasi"
                      subtitle="Lidlar (potentsial o'quvchilar) boshqaruvi qoidalari va sozlamalari"
                    />
                    <div className="space-y-0 divide-y" style={{ borderColor: 'var(--border)' }}>
                      <SettingRow label="Bepul sinov darsini yoqish" hint="Yangi lidlarga bepul sinov darsi taklif qilish imkoniyati">
                        <ToggleSwitch checked={settings.freeTrialEnabled} onChange={v => set('freeTrialEnabled', v)} />
                      </SettingRow>
                      <SettingRow label="Lidlarni avtomatik belgilash" hint="Yangi lid kelib tushganda, mavjud menejerlar orasida avtomatik taqsimlash">
                        <ToggleSwitch checked={settings.autoAssignLeads} onChange={v => set('autoAssignLeads', v)} />
                      </SettingRow>
                      <SettingRow label="Telefon raqam majburiy" hint="Lid qo'shishda telefon raqam kiritmasdan bo'lmaydi" noBorder>
                        <ToggleSwitch checked={settings.requireLeadPhone} onChange={v => set('requireLeadPhone', v)} />
                      </SettingRow>
                    </div>
                    <FormGroup label="Faolsiz lid muddati (kun)" hint="Necha kundan keyin lid 'sovuq' deb belgilanadi">
                      <input type="number" min={1} max={90} value={settings.inactiveLeadDays}
                        onChange={e => set('inactiveLeadDays', +e.target.value)} className="input-field w-32" />
                    </FormGroup>
                  </div>
                  <div className="panel-card space-y-4">
                    <SectionHeader title="Lid manbalari" subtitle="Qaysi kanallardan kelgan lidlar tizimda qayd etiladi" />
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(settings.leadSources || []).map(src => (
                        <div key={src} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: 'var(--primary)' }}>
                          {src}
                          <button onClick={() => set('leadSources', settings.leadSources.filter(s => s !== src))}
                            className="hover:text-red-200 transition-colors ml-1">
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" id="newLeadSourceInput" placeholder="Yangi manba (masalan: Radio)" className="input-field text-sm"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            e.preventDefault();
                            if (!(settings.leadSources || []).includes(e.target.value.trim())) {
                              set('leadSources', [...(settings.leadSources || []), e.target.value.trim()]);
                            }
                            e.target.value = '';
                          }
                        }}
                      />
                      <button className="btn-primary btn-sm whitespace-nowrap"
                        onClick={() => {
                          const input = document.getElementById('newLeadSourceInput');
                          if (input.value.trim() && !(settings.leadSources || []).includes(input.value.trim())) {
                            set('leadSources', [...(settings.leadSources || []), input.value.trim()]);
                            input.value = '';
                          }
                        }}>
                        Qo'shish
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════ INTEGRATSIYALAR ═══════════════ */}
              {activeTab === 'integrations' && (
                <div className="space-y-4">
                  <div className="panel-card space-y-5">
                    <SectionHeader
                      kicker="SMS"
                      title="SMS xabar tizimi"
                      subtitle="Eskiz yoki SmsPro orqali avtomatik SMS yuborish sozlamalari"
                    />
                    <FormGroup label="SMS provayder" hint="Qaysi SMS xizmati orqali yuboriladi">
                      <select className="input-field" value={settings.smsProvider}
                        onChange={e => set('smsProvider', e.target.value)}>
                        <option value="eskiz">Eskiz.uz</option>
                        <option value="smspro">SmsPro.uz</option>
                        <option value="none">O'chirilgan</option>
                      </select>
                    </FormGroup>
                    {settings.smsProvider !== 'none' && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormGroup label="Login / Email" hint="Eskiz yoki SmsPro akkaunt emaili">
                          <input className="input-field" placeholder="email@eskiz.uz" value={settings.smsEmail}
                            onChange={e => set('smsEmail', e.target.value)} />
                        </FormGroup>
                        <FormGroup label="API Token" hint="Provayder API kaliti (maxfiy)">
                          <input className="input-field" type="password" placeholder="••••••••••••••" value={settings.smsToken}
                            onChange={e => set('smsToken', e.target.value)} />
                        </FormGroup>
                        <FormGroup label="Yuboruvchi nomi (Sender)" hint="SMS da ko'rinuvchi nom (odatda 4-11 belgi)">
                          <input className="input-field" placeholder="ABDORA" value={settings.smsSenderName}
                            onChange={e => set('smsSenderName', e.target.value)} />
                        </FormGroup>
                      </motion.div>
                    )}
                    {settings.smsProvider !== 'none' && (
                      <div className="space-y-0 divide-y" style={{ borderColor: 'var(--border)' }}>
                        <SettingRow label="Davomat qoldirilganda SMS" hint="O'quvchi darsga kelmasa, ota-onaga avtomatik SMS">
                          <ToggleSwitch checked={settings.autoSmsOnAbsence} onChange={v => set('autoSmsOnAbsence', v)} />
                        </SettingRow>
                        <SettingRow label="To'lov muddati kelganda SMS" hint="O'quv haqi to'lash muddati yaqinlashsa xabar">
                          <ToggleSwitch checked={settings.autoSmsOnPaymentDue} onChange={v => set('autoSmsOnPaymentDue', v)} />
                        </SettingRow>
                        <SettingRow label="To'lov qilinganda SMS" hint="To'lov muvaffaqiyatli qilingandan keyin tasdiqlash xabari" noBorder>
                          <ToggleSwitch checked={settings.autoSmsOnPaymentSuccess} onChange={v => set('autoSmsOnPaymentSuccess', v)} />
                        </SettingRow>
                      </div>
                    )}
                  </div>
                  <div className="panel-card space-y-5">
                    <SectionHeader
                      kicker="Telegram"
                      title="Telegram Bot integratsiyasi"
                      subtitle="Markaz uchun Telegram bot orqali bildirishnomalar va o'quvchilar bilan muloqot"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormGroup label="Bot Token" hint="@BotFather dan olingan token">
                        <input className="input-field" type="password" placeholder="1234567890:AAABBB..." value={settings.telegramBotToken}
                          onChange={e => set('telegramBotToken', e.target.value)} />
                      </FormGroup>
                      <FormGroup label="Bot username" hint="Bot nomi (@belgisisiz)">
                        <input className="input-field" placeholder="abdora_bot" value={settings.telegramBotUsername}
                          onChange={e => set('telegramBotUsername', e.target.value)} />
                      </FormGroup>
                    </div>
                    {settings.telegramBotToken && (
                      <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
                        style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                        <CheckCircle2 size={14} className="flex-shrink-0 text-green-600" />
                        <span>Bot sozlangan: @{settings.telegramBotUsername || 'bot'}</span>
                      </div>
                    )}
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
                            onClick={() => {
                              set('theme', value);
                              if (value === 'dark') applyTheme('preset-dark');
                              else if (value === 'light') applyTheme('preset-light');
                            }}
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

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl border"
            style={{ background: 'var(--card-background)', borderColor: 'var(--border)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              O'zgarishlar kiritilganidan so'ng saqlash tugmasini bosing
            </span>
            <button
              onClick={handleSave}
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
          </div>
        </div>
      </div>

      {/* ── Reception Create/Edit Modal ── */}
      <AnimatePresence>
        {showReceptionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && closeReceptionModal()}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 8, opacity: 0 }}
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              className="rounded-3xl border p-6 sm:p-7 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                    {editingReceptionId ? "Hisobni tahrirlash" : "Qabulxona hisobi qo'shish"}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {editingReceptionId ? "Qabulxona xodimi ma'lumotlarini yangilash" : "Yangi qabulxona hisobini yaratish"}
                  </p>
                </div>
                <button onClick={closeReceptionModal} className="btn-icon flex-shrink-0" aria-label="Yopish">
                  <X size={18} />
                </button>
              </div>

              {receptionNewCreds ? (
                <div>
                  <div className="text-center mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2.5">
                      <CheckCircle2 size={26} />
                    </div>
                    <h3 className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                      Hisob muvaffaqiyatli yaratildi!
                    </h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Ushbu kirish ma'lumotlarini xodimga taqdim eting
                    </p>
                  </div>
                  <div
                    className="rounded-2xl p-4 space-y-3"
                    style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}
                  >
                    {[
                      ['Login', receptionNewCreds.username],
                      ['Parol', receptionNewCreds.password],
                    ].map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between">
                        <div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {label}
                          </div>
                          <div className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {val}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(val);
                            toast.success(`${label} nusxalandi!`);
                          }}
                          className="btn-icon"
                          title="Nusxalash"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={closeReceptionModal} className="btn-primary w-full mt-5">
                    Yopish
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      To'liq ismi *
                    </label>
                    <input
                      value={receptionForm.name}
                      onChange={(e) => setReceptionForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Xodim ismi"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      Telefon raqami
                    </label>
                    <PhoneInput
                      value={receptionForm.phone}
                      onChange={(e) => setReceptionForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+998 90 123 45 67"
                      className="input-field font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      Email (ixtiyoriy)
                    </label>
                    <input
                      value={receptionForm.email}
                      onChange={(e) => setReceptionForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="reception@example.com"
                      type="email"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      Filial
                    </label>
                    <select
                      value={receptionForm.branchId}
                      onChange={(e) => setReceptionForm((f) => ({ ...f, branchId: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Filial biriktirmaslik</option>
                      {branches
                        .filter((b) => !b.receptionId || b.receptionId === editingReceptionId)
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Agar filial tanlangan bo'lsa, bu qabulxona shu filialga biriktiriladi.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeReceptionModal} className="btn-ghost flex-1">
                      Bekor
                    </button>
                    <button
                      type="button"
                      onClick={handleReceptionSubmit}
                      disabled={
                        !receptionForm.name ||
                        createReceptionMutation.isPending ||
                        updateReceptionMutation.isPending
                      }
                      className="btn-primary flex-1 disabled:opacity-40"
                    >
                      {createReceptionMutation.isPending || updateReceptionMutation.isPending
                        ? "Saqlanmoqda..."
                        : editingReceptionId
                        ? 'Saqlash'
                        : "Qo'shish"}
                    </button>
                  </div>
                  {(createReceptionMutation.error || updateReceptionMutation.error) && (
                    <p className="text-xs text-red-500 text-center">
                      {friendlyAiErrorMessage(
                        createReceptionMutation.error || updateReceptionMutation.error
                      )}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
