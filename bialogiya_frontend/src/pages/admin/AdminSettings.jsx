import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Globe, Bot, Shield, CreditCard, BookOpen, Building2,
  Bell, Palette, Upload, Phone, MapPin, Mail, Clock, Users,
  ChevronRight, Check, AlertCircle, RefreshCw, Image, FileText, X,
  Coins, Smartphone, Target, ShoppingBag, Sparkles,
  Banknote, Wallet, CheckCircle2, FileEdit,
  ShieldCheck, Lock, Unlock, PieChart, GraduationCap, BookMarked, Calendar,
  Plus, Trash2, Pencil, UserCog, Copy, Sliders, Layers, UserCheck, CheckSquare,
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import PhoneInput from '../../components/ui/PhoneInput';
import { cleanPhone } from '../../utils/formatPhone';
import ThemeBuilder from '../../components/ui/ThemeBuilder';

/* ─── Sidebar nav items ─────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'center',        label: "Markaz sozlamalari",             icon: Building2,   badge: 'Asosiy' },
  { id: 'features',      label: "Markaz imkoniyatlari",           icon: Sparkles,    badge: 'Modullar' },
  { id: 'roles',         label: "Rollar va ruxsatlar",            icon: ShieldCheck, badge: 'Muhim' },
  { id: 'limits',        label: "Cheklovlar & Limitlar",          icon: Target },
  { id: 'payments',      label: "To'lovlar & Kassa",              icon: CreditCard },
  { id: 'lms',           label: "LMS Sozlamalari",                icon: BookOpen },
  { id: 'gamification',  label: "Tangalar (Coins) & Gamifikatsiya", icon: Coins },
  { id: 'crm_settings',  label: "CRM & Lidlar",                   icon: Users },
  { id: 'integrations',  label: "SMS va Telegram",                icon: Smartphone },
  { id: 'ai',            label: "AI Konfiguratsiyasi",            icon: Bot },
  { id: 'appearance',    label: "Mavzular & Ko'rinish",           icon: Palette },
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
  { key: 'bank',  label: "Bank o'tkazma", icon: Building2 },
  { key: 'other', label: 'Boshqa',        icon: Wallet },
];

const LANGUAGES = [
  { value: 'uz', label: "O'zbekcha" },
  { value: 'ru', label: "Русский" },
  { value: 'en', label: "English" },
];

const TIMEZONES = [
  { value: 'Asia/Tashkent',    label: 'Toshkent (UTC+5)' },
  { value: 'Asia/Almaty',      label: 'Olmaota (UTC+6)' },
  { value: 'Europe/Moscow',    label: 'Moskva (UTC+3)' },
  { value: 'Europe/Istanbul',  label: 'Istanbul (UTC+3)' },
];

const CURRENCIES = [
  { value: 'UZS', label: "So'm (UZS)" },
  { value: 'USD', label: "Dollar (USD)" },
  { value: 'EUR', label: "Yevro (EUR)" },
  { value: 'RUB', label: "Rubl (RUB)" },
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
  centerId: null,
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

  // Markaz imkoniyatlari (Features Matrix)
  features: {
    aiEnabled: true,
    aiLessonGenEnabled: true,
    aiChatEnabled: true,
    aiSpeakingEnabled: true,
    aiGradingEnabled: true,
    aiTestGenEnabled: true,
    financeEnabled: true,
    cashboxEnabled: true,
    paymentsEnabled: true,
    payrollEnabled: true,
    lessonsEnabled: true,
    homeworkEnabled: true,
    testsEnabled: true,
    timetableEnabled: true,
    attendanceEnabled: true,
    certificatesEnabled: true,
    leadsEnabled: true,
    smsEnabled: true,
    coinsEnabled: true,
    shopEnabled: true,
    leaderboardEnabled: true,
  },

  // Markaz ichidagi rollar (Roles Enablement)
  roles: {
    manager: {
      enabled: true,
      label: "Menejer (Boshqaruvchi)",
      description: "Filiallarni nazorat qilish, xodimlar va to'lovlar monitoringi",
      permissions: {
        canManageBranches: true,
        canManageStaff: true,
        canManageSalaries: true,
        canViewReports: true,
        canManageLeads: true,
        canManageTimetable: true,
        canExportData: true,
      }
    },
    reception: {
      enabled: true,
      label: "Qabulxona (Reception)",
      description: "Mijozlarni qabul qilish, lidlar va to'lovlar qabuli",
      permissions: {
        canViewFinance: false,
        canViewCashbox: false,
        canManagePayments: true,
        canManageLeads: true,
        canManageTimetable: true,
        canManageGroups: true,
        canManageStudents: true,
        canManageTeachers: true,
      }
    },
    teacher: {
      enabled: true,
      label: "O'qituvchi",
      description: "Dars o'tish, dars materiallari, uy vazifasi va davomat",
      permissions: {
        canCreateLessons: true,
        canUseAI: true,
        canManageHomework: true,
        canManageTests: true,
        canMarkAttendance: true,
        canAwardCoins: true,
        canViewOwnSalary: true,
      }
    },
    student: {
      enabled: true,
      label: "O'quvchi",
      description: "Darslar, AI tyutor, topshiriqlar, testlar va do'kon",
      permissions: {
        canAccessAIChat: true,
        canSubmitHomework: true,
        canTakeTests: true,
        canAccessShop: true,
        canViewLeaderboard: true,
        canViewAttendance: true,
      }
    }
  },

  // Cheklovlar & Kengaytirish (Limits)
  limits: {
    maxBranches: 5,
    maxStudents: 500,
    maxGroups: 50,
    maxTeachers: 30,
    aiRequestsPerMonth: 1000,
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
  coinsPerLesson: 5,
  coinsPerHomework: 10,
  coinsPerTest: 15,
  coinsPerStreakDay: 3,
  coinExchangeRate: 100,
  allowCoinsForPayment: true,
  maxCoinPaymentPercent: 20,
  coinShopEnabled: true,
  leaderboardPublic: true,

  // CRM Konfiguratsiyasi
  leadSources: ['Instagram', 'Telegram', 'Tavsiya', "Ko'cha reklama", 'Veb-sayt', 'Boshqa'],
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
  aiModel: 'gemini-3.8-flash',
  aiLiveModel: 'gemini-2.5-flash-native-audio-preview',

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
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const urlCenterId = searchParams.get('centerId');

  const [activeTab, setActiveTabState] = useState(() => {
    return urlTab || localStorage.getItem('admin_settings_tab') || 'center';
  });

  const [selectedCenterId, setSelectedCenterId] = useState(urlCenterId || '');

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('tab', tabId);
      return p;
    }, { replace: true });
    try {
      localStorage.setItem('admin_settings_tab', tabId);
    } catch (e) {}
  };

  const handleCenterChange = (centerId) => {
    setSelectedCenterId(centerId);
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      if (centerId) p.set('centerId', centerId);
      else p.delete('centerId');
      return p;
    }, { replace: true });
  };

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  // Load settings with active center context
  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ['admin-settings', user?.id, selectedCenterId],
    queryFn: () => api.get('/admin/settings', {
      params: selectedCenterId ? { centerId: selectedCenterId } : {}
    }).then(r => r.data?.data),
    enabled: !!user,
  });

  const centers = serverSettings?.centers || [];
  const currentCenter = centers.find(c => c.id === (selectedCenterId || serverSettings?.centerId)) || null;

  useEffect(() => {
    if (serverSettings && typeof serverSettings === 'object') {
      if (serverSettings.centerId && !selectedCenterId) {
        setSelectedCenterId(serverSettings.centerId);
      }
      setSettings(prev => ({
        ...DEFAULT_SETTINGS,
        ...serverSettings,
        features: {
          ...DEFAULT_SETTINGS.features,
          ...(serverSettings.features || {}),
        },
        roles: {
          manager: { ...DEFAULT_SETTINGS.roles.manager, ...(serverSettings.roles?.manager || {}) },
          reception: { ...DEFAULT_SETTINGS.roles.reception, ...(serverSettings.roles?.reception || {}) },
          teacher: { ...DEFAULT_SETTINGS.roles.teacher, ...(serverSettings.roles?.teacher || {}) },
          student: { ...DEFAULT_SETTINGS.roles.student, ...(serverSettings.roles?.student || {}) },
        },
        limits: {
          ...DEFAULT_SETTINGS.limits,
          ...(serverSettings.limits || {}),
        },
      }));
    }
  }, [serverSettings]);

  const saveMutation = useMutation({
    mutationFn: (d) => api.put('/admin/settings', {
      ...d,
      centerId: selectedCenterId || undefined,
    }),
    onSuccess: (res) => {
      toast.success('Sozlamalar muvaffaqiyatli saqlandi!');
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['admin-centers'] });
      if (res?.data?.data) {
        setSettings(prev => ({
          ...prev,
          ...res.data.data,
          features: { ...prev.features, ...(res.data.data.features || {}) },
          roles: { ...prev.roles, ...(res.data.data.roles || {}) },
          limits: { ...prev.limits, ...(res.data.data.limits || {}) },
        }));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  const setFeature = (featKey, val) => {
    setSettings(s => ({
      ...s,
      features: {
        ...(s.features || {}),
        [featKey]: val,
      }
    }));
  };

  const setRoleEnabled = (roleKey, enabled) => {
    setSettings(s => ({
      ...s,
      roles: {
        ...(s.roles || {}),
        [roleKey]: {
          ...(s.roles?.[roleKey] || {}),
          enabled,
        }
      }
    }));
  };

  const setRolePermission = (roleKey, permKey, val) => {
    setSettings(s => ({
      ...s,
      roles: {
        ...(s.roles || {}),
        [roleKey]: {
          ...(s.roles?.[roleKey] || {}),
          permissions: {
            ...(s.roles?.[roleKey]?.permissions || {}),
            [permKey]: val,
          }
        }
      }
    }));
  };

  const setLimit = (limitKey, val) => {
    const num = val === '' ? '' : Number(val);
    setSettings(s => ({
      ...s,
      limits: {
        ...(s.limits || {}),
        [limitKey]: num,
      }
    }));
  };

  const applyLimitPreset = (preset) => {
    const presets = {
      starter: { maxBranches: 1, maxStudents: 100, maxGroups: 10, maxTeachers: 5, aiRequestsPerMonth: 300 },
      pro: { maxBranches: 3, maxStudents: 500, maxGroups: 40, maxTeachers: 20, aiRequestsPerMonth: 1500 },
      enterprise: { maxBranches: 10, maxStudents: 2000, maxGroups: 150, maxTeachers: 80, aiRequestsPerMonth: 5000 },
      unlimited: { maxBranches: 0, maxStudents: 0, maxGroups: 0, maxTeachers: 0, aiRequestsPerMonth: 0 },
    };
    if (presets[preset]) {
      setSettings(s => ({
        ...s,
        limits: { ...presets[preset] }
      }));
      toast.success(`${preset.toUpperCase()} limiti qo'llandi`);
    }
  };

  const togglePaymentMethod = (key) => {
    const arr = settings.enabledPaymentMethods || [];
    set('enabledPaymentMethods',
      arr.includes(key) ? arr.filter(k => k !== key) : [...arr, key]
    );
  };

  const handleSave = () => {
    saveMutation.mutate({
      ...settings,
      centerPhone: cleanPhone(settings.centerPhone),
    });
  };

  // ─── Reception Accounts in Settings ───
  const EMPTY_RECEPTION_FORM = { name: '', phone: '+998 ', email: '', language: 'uz', branchId: '' };
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [editingReceptionId, setEditingReceptionId] = useState(null);
  const [receptionForm, setReceptionForm] = useState(EMPTY_RECEPTION_FORM);
  const [receptionNewCreds, setReceptionNewCreds] = useState(null);
  const [receptionConfirm, setReceptionConfirm] = useState(null);

  const { data: receptionUsers = [] } = useQuery({
    queryKey: ['admin-reception', selectedCenterId],
    queryFn: () => api.get('/admin/reception').then(r => {
      const d = r.data?.data || r.data || [];
      return Array.isArray(d) ? d : [];
    }),
    enabled: activeTab === 'roles',
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['admin-branches', selectedCenterId],
    queryFn: () => api.get('/admin/branches').then(r => {
      const d = r.data?.data || r.data || [];
      return Array.isArray(d) ? d : [];
    }),
    enabled: activeTab === 'roles',
  });

  const createReceptionMutation = useMutation({
    mutationFn: (d) => api.post('/admin/reception', d),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['admin-reception'] });
      setReceptionNewCreds(data?.data?.credentials || null);
      setReceptionForm(EMPTY_RECEPTION_FORM);
      toast.success("Qabulxona hisobi yaratildi");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Xatolik yuz berdi"),
  });

  const updateReceptionMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/reception/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reception'] });
      setShowReceptionModal(false);
      setEditingReceptionId(null);
      toast.success("Qabulxona ma'lumotlari yangilandi");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Xatolik yuz berdi"),
  });

  const deleteReceptionMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/reception/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reception'] });
      toast.success("Qabulxona hisobi o'chirildi");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Xatolik yuz berdi"),
  });

  return (
    <div className="dashboard-shell max-w-6xl w-full mx-auto">
      <ConfirmDialog confirm={receptionConfirm} onClose={() => setReceptionConfirm(null)} />
      <PageHeader
        title="Sozlamalar"
        subtitle="Markaz imkoniyatlarini kengaytirish, cheklash va rollarni boshqarish"
        actions={
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || isLoading}
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

      {/* ─── Super Admin Center Switcher Bar ─── */}
      {user?.role === 'admin' && (
        <div className="p-4 rounded-2xl border mb-6 bg-[var(--card)] border-[var(--border)] shadow-sm">
          {centers.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[var(--primary)] flex items-center justify-center font-bold">
                  <Building2 size={20} />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-secondary)] font-medium">Sozlanayotgan o'quv markaz:</div>
                  <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    {currentCenter?.name || settings.centerName || "Markaz"}
                    <span className="badge badge-success text-[10px] py-0 px-2">Faol</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--text-muted)] font-medium hidden sm:inline">Markazni tanlang:</label>
                <select
                  value={selectedCenterId || currentCenter?.id || ''}
                  onChange={(e) => handleCenterChange(e.target.value)}
                  className="input-field text-xs py-1.5 px-3 min-w-[200px]"
                >
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.address ? `(${c.address})` : ''}
                    </option>
                  ))}
                </select>
                <Link to="/admin/centers" className="btn-outline btn-xs flex items-center gap-1">
                  <Plus size={13} /> Yangi markaz
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Building2 size={24} className="text-amber-500" />
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Tizimda faol o'quv markazlar yo'q</h4>
                  <p className="text-xs text-[var(--text-secondary)]">Markaz imkoniyatlarini sozlash uchun avval yangi markaz yarating.</p>
                </div>
              </div>
              <Link to="/admin/centers" className="btn-primary btn-sm flex items-center gap-1.5">
                <Plus size={14} /> Markaz qo'shish
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="settings-shell">
        {/* ── Left Nav ── */}
        <nav className="settings-nav space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon, badge }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`settings-nav-item w-full ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                <span className="flex-1 text-left text-sm font-medium">{label}</span>
                {badge && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-[var(--primary)] text-white' : 'bg-[var(--secondary-background)] text-[var(--text-muted)]'
                  }`}>
                    {badge}
                  </span>
                )}
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

              {/* ═══════════════ 1. MARKAZ SOZLAMALARI ═══════════════ */}
              {activeTab === 'center' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Asosiy Profil"
                    title="Markaz ma'lumotlari"
                    subtitle="Markaz nomi, logotipi, aloqa vositalari va kvitansiya sozlamalari"
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
                        className="input-field pl-9" placeholder="Toshkent shahri, Yunusobod tumani..." />
                    </div>
                  </FormGroup>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <FormGroup label="Asosiy valyuta">
                      <select value={settings.currency} onChange={e => set('currency', e.target.value)} className="input-field">
                        {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </FormGroup>
                    <FormGroup label="Vaqt mintaqasi">
                      <select value={settings.timezone} onChange={e => set('timezone', e.target.value)} className="input-field">
                        {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </FormGroup>
                    <FormGroup label="Sana formati">
                      <select value={settings.dateFormat} onChange={e => set('dateFormat', e.target.value)} className="input-field">
                        <option value="DD.MM.YYYY">DD.MM.YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </FormGroup>
                  </div>

                  <div className="pt-3 border-t border-[var(--border)]">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                      <FileText size={16} className="text-[var(--primary)]" /> Kvitansiya matnlari
                    </h3>
                    <div className="space-y-3">
                      <FormGroup label="Kvitansiya yuqori sarlavhasi (Header)">
                        <input value={settings.receiptHeader} onChange={e => set('receiptHeader', e.target.value)}
                          className="input-field" placeholder="Masalan: Abdora AI O'quv Markazi — Kvitansiya" />
                      </FormGroup>
                      <FormGroup label="Kvitansiya ostki xabari (Footer)">
                        <input value={settings.receiptFooter} onChange={e => set('receiptFooter', e.target.value)}
                          className="input-field" placeholder="Xizmatimizdan foydalanganingiz uchun rahmat!" />
                      </FormGroup>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════ 2. MARKAZ IMKONIYATLARI (FEATURES) ═══════════════ */}
              {activeTab === 'features' && (
                <div className="panel-card space-y-6">
                  <SectionHeader
                    kicker="Modullar va Ruxsatlar"
                    title="Markaz imkoniyatlarini cheklash va kengaytirish"
                    subtitle="Ushbu markaz foydalanuvchilari uchun qaysi xizmatlar va tizimlar ochiq bo'lishini boshqaring."
                  />

                  {/* AI Capabilities */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <Bot size={18} className="text-purple-500" />
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Sun'iy Intellekt (AI Modullari)</h3>
                      </div>
                      <span className="text-xs text-[var(--text-muted)] font-medium">
                        {settings.features?.aiEnabled !== false ? "Yoqilgan" : "O'chirilgan"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {[
                        { key: 'aiEnabled', label: "Bosh AI Ruxsati (Master Switch)", hint: "Barcha AI xizmatlarining umumiy kaliti", icon: Bot, color: '#8b5cf6' },
                        { key: 'aiLessonGenEnabled', label: "AI Dars va Reja Yaratish", hint: "Mavzu bo'yicha AI dars konspekti va xotira usullarini yaratish", icon: BookOpen, color: '#6366f1' },
                        { key: 'aiChatEnabled', label: "AI Virtual Assistent (Tyutor)", hint: "Talabalar uchun 24/7 savol-javob AI chat tyutori", icon: Sparkles, color: '#ec4899' },
                        { key: 'aiSpeakingEnabled', label: "AI Jonli Speaking Mashqi", hint: "Gemini Realtime audio orqali ovozli suhbat mashqlari", icon: Smartphone, color: '#3b82f6' },
                        { key: 'aiGradingEnabled', label: "AI Avtomatik Baholash", hint: "Topshiriq va uy vazifalarini AI tekshirib ball qo'yishi", icon: CheckSquare, color: '#10b981' },
                        { key: 'aiTestGenEnabled', label: "AI Testlar Generatsiyasi", hint: "Darslik matnidan avtomatik MCQ testlar tuzish", icon: Target, color: '#f59e0b' },
                      ].map(({ key, label, hint, icon: Icon, color }) => {
                        const isChecked = settings.features?.[key] !== false;
                        return (
                          <div key={key} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${color}18`, color }}>
                                <Icon size={16} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[var(--text-primary)]">{label}</div>
                                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">{hint}</div>
                              </div>
                            </div>
                            <ToggleSwitch checked={isChecked} onChange={(v) => setFeature(key, v)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Finance & Cashbox */}
                  <div className="space-y-3 pt-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                      <CreditCard size={18} className="text-emerald-500" />
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">Moliya va Kassa Tizimi</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {[
                        { key: 'financeEnabled', label: "Moliya va Daromadlar Tahlili", hint: "Umumiy tushum, xarajatlar va moliyaviy grafiklar bo'limi", icon: PieChart, color: '#10b981' },
                        { key: 'cashboxEnabled', label: "Kassa va Xarajatlar Yuritish", hint: "Filial kassasi, chiqimlarni kiritish va kassa balansi", icon: Banknote, color: '#059669' },
                        { key: 'paymentsEnabled', label: "To'lovlar Qabuli & Kvitansiya", hint: "Talabalardan to'lov olish va avtomatik kvitansiya chiqarish", icon: Wallet, color: '#14b8a6' },
                        { key: 'payrollEnabled', label: "O'qituvchilar Maoshi (Payroll)", hint: "Oylik, foizli yoki soatbay maoshlarni hisoblash tizimi", icon: Users, color: '#0d9488' },
                      ].map(({ key, label, hint, icon: Icon, color }) => {
                        const isChecked = settings.features?.[key] !== false;
                        return (
                          <div key={key} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${color}18`, color }}>
                                <Icon size={16} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[var(--text-primary)]">{label}</div>
                                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">{hint}</div>
                              </div>
                            </div>
                            <ToggleSwitch checked={isChecked} onChange={(v) => setFeature(key, v)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* LMS & Education */}
                  <div className="space-y-3 pt-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                      <BookOpen size={18} className="text-blue-500" />
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">O'quv Jarayoni (LMS)</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {[
                        { key: 'lessonsEnabled', label: "Darslar va Materiallar", hint: "O'qituvchilar dars materiallari yuklashi va ko'rsatishi", icon: BookMarked, color: '#2563eb' },
                        { key: 'homeworkEnabled', label: "Uy Vazifalari Tizimi", hint: "Vazifalar topshirish, fayl yuklash va baholash portali", icon: FileEdit, color: '#3b82f6' },
                        { key: 'testsEnabled', label: "Onlayn Testlar va Imtihonlar", hint: "Vaqtga belgilangan testlar va avtomatik natijalar", icon: Target, color: '#60a5fa' },
                        { key: 'timetableEnabled', label: "Dars Jadvali va Xonalar", hint: "Haftalik dars jadvali, bandlik va xonalar taqvimi", icon: Calendar, color: '#4f46e5' },
                        { key: 'attendanceEnabled', label: "Davomat Jurnali", hint: "Har dars talabalar davomatini qayd etish", icon: CheckCircle2, color: '#16a34a' },
                        { key: 'certificatesEnabled', label: "Avtomatik Sertifikatlar", hint: "Kursni tamomlagan o'quvchilarga QR-kodli sertifikat berish", icon: GraduationCap, color: '#9333ea' },
                      ].map(({ key, label, hint, icon: Icon, color }) => {
                        const isChecked = settings.features?.[key] !== false;
                        return (
                          <div key={key} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${color}18`, color }}>
                                <Icon size={16} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[var(--text-primary)]">{label}</div>
                                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">{hint}</div>
                              </div>
                            </div>
                            <ToggleSwitch checked={isChecked} onChange={(v) => setFeature(key, v)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CRM & Gamification */}
                  <div className="space-y-3 pt-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                      <Coins size={18} className="text-amber-500" />
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">CRM, Aloqa & Gamifikatsiya</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {[
                        { key: 'leadsEnabled', label: "CRM Lidlar Voronkasi", hint: "Murojaatlarni yig'ish, holatlar bo'yicha siljitish va tahlil", icon: Users, color: '#f59e0b' },
                        { key: 'smsEnabled', label: "SMS Bildirishnomalar", hint: "To'lov, davomat va eslatmalar bo'yicha SMS jo'natish", icon: Smartphone, color: '#0284c7' },
                        { key: 'coinsEnabled', label: "Tangalar (Coins) & XP", hint: "Faollik uchun o'quvchilarga rag'bat tangalari berish", icon: Coins, color: '#d97706' },
                        { key: 'shopEnabled', label: "Tangalar Do'koni (Coin Shop)", hint: "O'quvchilar tangalarini sovg'alarga almashtirish do'koni", icon: ShoppingBag, color: '#b45309' },
                      ].map(({ key, label, hint, icon: Icon, color }) => {
                        const isChecked = settings.features?.[key] !== false;
                        return (
                          <div key={key} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${color}18`, color }}>
                                <Icon size={16} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[var(--text-primary)]">{label}</div>
                                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">{hint}</div>
                              </div>
                            </div>
                            <ToggleSwitch checked={isChecked} onChange={(v) => setFeature(key, v)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════ 3. ROLLAR VA RUXSATLAR (ROLES) ═══════════════ */}
              {activeTab === 'roles' && (
                <div className="panel-card space-y-6">
                  <SectionHeader
                    kicker="Foydalanuvchi Rollari"
                    title="Markaz ichidagi rollarni yoqish yoki o'chirish"
                    subtitle="Markazda qaysi rollar mavjud bo'lishi va har bir roldagi xodimlarning aniq vakolatlarini belgilang."
                  />

                  {/* 1. MANAGER ROLE */}
                  <div className="p-5 rounded-2xl border transition-all" style={{
                    borderColor: 'var(--border)',
                    backgroundColor: settings.roles?.manager?.enabled ? 'var(--card)' : 'var(--secondary-background)',
                    opacity: settings.roles?.manager?.enabled ? 1 : 0.85,
                  }}>
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                          <UserCheck size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-[var(--text-primary)]">Menejer (Manager) roli</h3>
                            <span className={`badge text-[10px] py-0.5 px-2 ${
                              settings.roles?.manager?.enabled ? 'badge-success' : 'badge-error'
                            }`}>
                              {settings.roles?.manager?.enabled ? "Markazda bor (Faol)" : "Markazda yo'q (O'chirilgan)"}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Filiallarni nazorat qilish, xodimlar, guruhlar va to'lovlar monitoringi
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">
                          {settings.roles?.manager?.enabled ? "Rol yoqilgan" : "Rol o'chirilgan"}
                        </span>
                        <ToggleSwitch
                          checked={settings.roles?.manager?.enabled !== false}
                          onChange={(v) => setRoleEnabled('manager', v)}
                        />
                      </div>
                    </div>

                    {settings.roles?.manager?.enabled !== false ? (
                      <div className="pt-4 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          Menejer ruxsatlari (Vakolatlari):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[
                            { key: 'canManageBranches', label: "Filiallarni boshqarish" },
                            { key: 'canManageStaff', label: "Xodimlarni boshqarish" },
                            { key: 'canManageSalaries', label: "O'qituvchilar maosh shartlari" },
                            { key: 'canViewReports', label: "Moliyaviy hisobotlarni ko'rish" },
                            { key: 'canManageLeads', label: "Lidlar voronkasi bilan ishlash" },
                            { key: 'canManageTimetable', label: "Dars jadvali va xonalar" },
                            { key: 'canExportData', label: "Ma'lumotlarni eksport qilish" },
                          ].map(({ key, label }) => {
                            const isChecked = settings.roles?.manager?.permissions?.[key] !== false;
                            return (
                              <label key={key} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[var(--secondary-background)] cursor-pointer text-xs">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => setRolePermission('manager', key, e.target.checked)}
                                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                                />
                                <span className="text-[var(--text-primary)] font-medium">{label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                        <AlertCircle size={15} /> Ushbu markazda Menejer hisoblari o'chirilgan. Menejerlar tizimga kira olmaydi.
                      </div>
                    )}
                  </div>

                  {/* 2. RECEPTION ROLE */}
                  <div className="p-5 rounded-2xl border transition-all" style={{
                    borderColor: 'var(--border)',
                    backgroundColor: settings.roles?.reception?.enabled ? 'var(--card)' : 'var(--secondary-background)',
                    opacity: settings.roles?.reception?.enabled ? 1 : 0.85,
                  }}>
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                          <ShieldCheck size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-[var(--text-primary)]">Qabulxona (Reception) roli</h3>
                            <span className={`badge text-[10px] py-0.5 px-2 ${
                              settings.roles?.reception?.enabled ? 'badge-success' : 'badge-error'
                            }`}>
                              {settings.roles?.reception?.enabled ? "Markazda bor (Faol)" : "Markazda yo'q (O'chirilgan)"}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Mijozlarni qabul qilish, lidlar va to'lovlar qabuli
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">
                          {settings.roles?.reception?.enabled ? "Rol yoqilgan" : "Rol o'chirilgan"}
                        </span>
                        <ToggleSwitch
                          checked={settings.roles?.reception?.enabled !== false}
                          onChange={(v) => setRoleEnabled('reception', v)}
                        />
                      </div>
                    </div>

                    {settings.roles?.reception?.enabled !== false ? (
                      <div className="pt-4 space-y-4">
                        {/* Quick 1-click Toggle for Finance & Cashbox */}
                        {(() => {
                          const isBlocked = !settings.roles?.reception?.permissions?.canViewFinance && !settings.roles?.reception?.permissions?.canViewCashbox;
                          return (
                            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--secondary-background)] flex items-center justify-between gap-4">
                              <div>
                                <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                  {isBlocked ? <Lock size={13} className="text-emerald-500" /> : <Unlock size={13} className="text-amber-500" />}
                                  Moliya va Kassani bloklash
                                </div>
                                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                                  {isBlocked ? "Moliya va kassa qabulxona uchun yopiq (Tavsiya)" : "Qabulxona moliya va kassa bo'limlarini ko'ra oladi"}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = isBlocked;
                                  setRolePermission('reception', 'canViewFinance', next);
                                  setRolePermission('reception', 'canViewCashbox', next);
                                  toast.success(next ? "Moliya va Kassa ochildi" : "Moliya va Kassa bloklandi");
                                }}
                                className={`btn-xs ${isBlocked ? 'btn-outline' : 'btn-primary'}`}
                              >
                                {isBlocked ? "Ochish" : "Bloklash"}
                              </button>
                            </div>
                          );
                        })()}

                        <div className="space-y-2">
                          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                            Qabulxona ruxsatlari:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                              { key: 'canViewFinance', label: "Moliya tahlili" },
                              { key: 'canViewCashbox', label: "Kassa va chiqimlar" },
                              { key: 'canManagePayments', label: "To'lovlar qabuli" },
                              { key: 'canManageLeads', label: "Lidlar voronkasi" },
                              { key: 'canManageTimetable', label: "Dars jadvali" },
                              { key: 'canManageGroups', label: "Guruhlar" },
                              { key: 'canManageStudents', label: "Talabalar" },
                              { key: 'canManageTeachers', label: "O'qituvchilar" },
                            ].map(({ key, label }) => {
                              const isChecked = Boolean(settings.roles?.reception?.permissions?.[key]);
                              return (
                                <label key={key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--secondary-background)] cursor-pointer text-xs">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => setRolePermission('reception', key, e.target.checked)}
                                    className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                                  />
                                  <span className="text-[var(--text-primary)] font-medium">{label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Reception accounts list */}
                        <div className="pt-3 border-t border-[var(--border)]">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-[var(--text-primary)]">
                              Markazdagi Qabulxona xodimlari ({receptionUsers.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingReceptionId(null);
                                setReceptionForm(EMPTY_RECEPTION_FORM);
                                setShowReceptionModal(true);
                              }}
                              className="btn-outline btn-xs flex items-center gap-1"
                            >
                              <Plus size={13} /> Yangi xodim
                            </button>
                          </div>

                          {receptionUsers.length > 0 ? (
                            <div className="space-y-2">
                              {receptionUsers.map(u => (
                                <div key={u.id} className="p-3 rounded-xl border border-[var(--border)] flex items-center justify-between text-xs">
                                  <div>
                                    <div className="font-bold text-[var(--text-primary)]">{u.name}</div>
                                    <div className="text-[11px] text-[var(--text-secondary)]">{u.phone} · {u.username}</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReceptionConfirm({
                                        title: `"${u.name}"ni o'chirish`,
                                        message: "Ushbu xodim hisobi o'chiriladi.",
                                        onConfirm: () => deleteReceptionMutation.mutate(u.id),
                                      });
                                    }}
                                    className="btn-ghost btn-xs text-red-500"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-[var(--text-muted)] py-2">Qabulxona xodimlari mavjud emas.</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                        <AlertCircle size={15} /> Ushbu markazda Qabulxona roli o'chirilgan.
                      </div>
                    )}
                  </div>

                  {/* 3. TEACHER ROLE */}
                  <div className="p-5 rounded-2xl border transition-all" style={{
                    borderColor: 'var(--border)',
                    backgroundColor: settings.roles?.teacher?.enabled ? 'var(--card)' : 'var(--secondary-background)',
                    opacity: settings.roles?.teacher?.enabled ? 1 : 0.85,
                  }}>
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          <Users size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-[var(--text-primary)]">O'qituvchi (Teacher) roli</h3>
                            <span className={`badge text-[10px] py-0.5 px-2 ${
                              settings.roles?.teacher?.enabled ? 'badge-success' : 'badge-error'
                            }`}>
                              {settings.roles?.teacher?.enabled ? "Markazda bor (Faol)" : "Markazda yo'q (O'chirilgan)"}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Dars o'tish, dars materiallari, uy vazifasi va davomat
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">
                          {settings.roles?.teacher?.enabled ? "Rol yoqilgan" : "Rol o'chirilgan"}
                        </span>
                        <ToggleSwitch
                          checked={settings.roles?.teacher?.enabled !== false}
                          onChange={(v) => setRoleEnabled('teacher', v)}
                        />
                      </div>
                    </div>

                    {settings.roles?.teacher?.enabled !== false ? (
                      <div className="pt-4 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          O'qituvchi ruxsatlari:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {[
                            { key: 'canCreateLessons', label: "Dars va materiallar" },
                            { key: 'canUseAI', label: "AI dars yaratuvchi" },
                            { key: 'canManageHomework', label: "Uy vazifalari berish" },
                            { key: 'canManageTests', label: "Test savollari tuzish" },
                            { key: 'canMarkAttendance', label: "Davomat belgilash" },
                            { key: 'canAwardCoins', label: "Tanga (coin) berish" },
                            { key: 'canViewOwnSalary', label: "Maosh hisobini ko'rish" },
                          ].map(({ key, label }) => {
                            const isChecked = settings.roles?.teacher?.permissions?.[key] !== false;
                            return (
                              <label key={key} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[var(--secondary-background)] cursor-pointer text-xs">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => setRolePermission('teacher', key, e.target.checked)}
                                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                                />
                                <span className="text-[var(--text-primary)] font-medium">{label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                        <AlertCircle size={15} /> Ushbu markazda O'qituvchi roli o'chirilgan.
                      </div>
                    )}
                  </div>

                  {/* 4. STUDENT ROLE */}
                  <div className="p-5 rounded-2xl border transition-all" style={{
                    borderColor: 'var(--border)',
                    backgroundColor: settings.roles?.student?.enabled ? 'var(--card)' : 'var(--secondary-background)',
                    opacity: settings.roles?.student?.enabled ? 1 : 0.85,
                  }}>
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                          <GraduationCap size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-[var(--text-primary)]">O'quvchi (Student) roli</h3>
                            <span className={`badge text-[10px] py-0.5 px-2 ${
                              settings.roles?.student?.enabled ? 'badge-success' : 'badge-error'
                            }`}>
                              {settings.roles?.student?.enabled ? "Markazda bor (Faol)" : "Markazda yo'q (O'chirilgan)"}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Darslar, AI tyutor, topshiriqlar, testlar va do'kon
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">
                          {settings.roles?.student?.enabled ? "Rol yoqilgan" : "Rol o'chirilgan"}
                        </span>
                        <ToggleSwitch
                          checked={settings.roles?.student?.enabled !== false}
                          onChange={(v) => setRoleEnabled('student', v)}
                        />
                      </div>
                    </div>

                    {settings.roles?.student?.enabled !== false ? (
                      <div className="pt-4 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          O'quvchi kabineti ruxsatlari:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[
                            { key: 'canAccessAIChat', label: "AI Tyutor suhbati" },
                            { key: 'canSubmitHomework', label: "Uy vazifasi topshirish" },
                            { key: 'canTakeTests', label: "Onlayn testlarni yechish" },
                            { key: 'canAccessShop', label: "Tangalar do'koni" },
                            { key: 'canViewLeaderboard', label: "Liderlar reytingi" },
                            { key: 'canViewAttendance', label: "Davomat va baholar tarixi" },
                          ].map(({ key, label }) => {
                            const isChecked = settings.roles?.student?.permissions?.[key] !== false;
                            return (
                              <label key={key} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[var(--secondary-background)] cursor-pointer text-xs">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => setRolePermission('student', key, e.target.checked)}
                                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                                />
                                <span className="text-[var(--text-primary)] font-medium">{label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                        <AlertCircle size={15} /> Ushbu markazda O'quvchi kabineti o'chirilgan.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══════════════ 4. CHEKLOVLAR & LIMITLAR (LIMITS) ═══════════════ */}
              {activeTab === 'limits' && (
                <div className="panel-card space-y-6">
                  <SectionHeader
                    kicker="Tarif va Miqdorlar"
                    title="Markaz cheklovlari va kvotalari"
                    subtitle="Markaz sig'imi, filiallar va oylik AI so'rovlar limitini belgilang. (0 kiritilsa cheksiz hisoblanadi)"
                  />

                  {/* Presets */}
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--secondary-background)]">
                    <div className="text-xs font-bold text-[var(--text-primary)] mb-2.5 flex items-center gap-2">
                      <Sliders size={14} className="text-[var(--primary)]" /> Tezkor tarif shablonlari:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button type="button" onClick={() => applyLimitPreset('starter')} className="btn-outline btn-xs justify-center py-2">
                        Starter (1 filial)
                      </button>
                      <button type="button" onClick={() => applyLimitPreset('pro')} className="btn-outline btn-xs justify-center py-2">
                        Pro (3 filial)
                      </button>
                      <button type="button" onClick={() => applyLimitPreset('enterprise')} className="btn-outline btn-xs justify-center py-2">
                        Enterprise (10 filial)
                      </button>
                      <button type="button" onClick={() => applyLimitPreset('unlimited')} className="btn-primary btn-xs justify-center py-2">
                        Cheksiz (Unlimited)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormGroup label="Maksimal filiallar soni" hint="0 = Cheksiz filiallar">
                      <input
                        type="number"
                        min="0"
                        value={settings.limits?.maxBranches ?? ''}
                        onChange={(e) => setLimit('maxBranches', e.target.value)}
                        className="input-field font-mono"
                        placeholder="Masalan: 5"
                      />
                    </FormGroup>

                    <FormGroup label="Maksimal o'quvchilar sig'imi" hint="0 = Cheksiz talabalar">
                      <input
                        type="number"
                        min="0"
                        value={settings.limits?.maxStudents ?? ''}
                        onChange={(e) => setLimit('maxStudents', e.target.value)}
                        className="input-field font-mono"
                        placeholder="Masalan: 500"
                      />
                    </FormGroup>

                    <FormGroup label="Maksimal guruhlar soni" hint="0 = Cheksiz guruhlar">
                      <input
                        type="number"
                        min="0"
                        value={settings.limits?.maxGroups ?? ''}
                        onChange={(e) => setLimit('maxGroups', e.target.value)}
                        className="input-field font-mono"
                        placeholder="Masalan: 50"
                      />
                    </FormGroup>

                    <FormGroup label="Maksimal o'qituvchilar soni" hint="0 = Cheksiz ustozlar">
                      <input
                        type="number"
                        min="0"
                        value={settings.limits?.maxTeachers ?? ''}
                        onChange={(e) => setLimit('maxTeachers', e.target.value)}
                        className="input-field font-mono"
                        placeholder="Masalan: 30"
                      />
                    </FormGroup>

                    <div className="sm:col-span-2">
                      <FormGroup label="Oylik AI so'rovlar limiti" hint="Markaz bo'yicha oyiga nechta dars/chat/test so'rovi mumkinligi (0 = Cheksiz)">
                        <input
                          type="number"
                          min="0"
                          value={settings.limits?.aiRequestsPerMonth ?? ''}
                          onChange={(e) => setLimit('aiRequestsPerMonth', e.target.value)}
                          className="input-field font-mono"
                          placeholder="Masalan: 1000"
                        />
                      </FormGroup>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════ 5. TO'LOVLAR & KASSA (PAYMENTS) ═══════════════ */}
              {activeTab === 'payments' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Moliya"
                    title="To'lovlar & Kassa sozlamalari"
                    subtitle="Qabul qilinadigan to'lov usullari va to'lov muddati shartlari"
                  />

                  <div className="space-y-3">
                    <label className="form-label">Qabul qilinadigan to'lov usullari</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {PAYMENT_METHODS.map(({ key, label, icon: Icon }) => {
                        const checked = (settings.enabledPaymentMethods || []).includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => togglePaymentMethod(key)}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-all ${
                              checked
                                ? 'bg-orange-500/10 border-orange-500 text-[var(--primary)]'
                                : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--secondary-background)]'
                            }`}
                          >
                            <Icon size={20} />
                            <span>{label}</span>
                            {checked && <Check size={13} className="text-[var(--primary)]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <FormGroup label="Oylik to'lov muddati (Oyning kuni)" hint="Har oyning nechanchi kunigacha to'lanishi kerak">
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={settings.paymentDueDayOfMonth || 5}
                        onChange={e => set('paymentDueDayOfMonth', Number(e.target.value))}
                        className="input-field"
                      />
                    </FormGroup>

                    <FormGroup label="Kechikish jarimasi foizi" hint="Muddatdan kechikkan har oy uchun qo'shiladigan foiz">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.lateFeePercent || 0}
                        onChange={e => set('lateFeePercent', Number(e.target.value))}
                        className="input-field"
                      />
                    </FormGroup>
                  </div>

                  <div className="space-y-3 pt-2">
                    <SettingRow
                      label="To'lov qabul qilinganda avtomatik kvitansiya chiqarish"
                      hint="Kassir to'lovni tasdiqlashi bilan chop etish oynasi ochiladi"
                    >
                      <ToggleSwitch
                        checked={settings.autoReceiptOnPayment !== false}
                        onChange={v => set('autoReceiptOnPayment', v)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Qisman to'lovda izoh kiritishni majburiy qilish"
                      hint="To'liq to'lanmagan summalarda sababini yozish talab etiladi"
                    >
                      <ToggleSwitch
                        checked={settings.requireNoteOnPartialPayment !== false}
                        onChange={v => set('requireNoteOnPartialPayment', v)}
                      />
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* ═══════════════ 6. LMS SOZLAMALARI (LMS) ═══════════════ */}
              {activeTab === 'lms' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="O'quv jarayoni"
                    title="LMS Sozlamalari"
                    subtitle="Guruh sig'imi, o'tish ballari va fanlar konfiguratsiyasi"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormGroup label="Maksimal guruh sig'imi (o'quvchi)" hint="Bitta guruhga qo'shish mumkin bo'lgan me'yor">
                      <input
                        type="number"
                        min="1"
                        value={settings.maxGroupSize || 30}
                        onChange={e => set('maxGroupSize', Number(e.target.value))}
                        className="input-field"
                      />
                    </FormGroup>

                    <FormGroup label="Imtihon o'tish balli (%)" hint="Sertifikat olish uchun talab qilinadigan foiz">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={settings.passingScore || 60}
                        onChange={e => set('passingScore', Number(e.target.value))}
                        className="input-field"
                      />
                    </FormGroup>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <FormGroup label="Dars uchun XP ball">
                      <input
                        type="number"
                        value={settings.xpPerLesson || 10}
                        onChange={e => set('xpPerLesson', Number(e.target.value))}
                        className="input-field"
                      />
                    </FormGroup>
                    <FormGroup label="Vazifa uchun XP ball">
                      <input
                        type="number"
                        value={settings.xpPerHomework || 15}
                        onChange={e => set('xpPerHomework', Number(e.target.value))}
                        className="input-field"
                      />
                    </FormGroup>
                    <FormGroup label="Test uchun XP ball">
                      <input
                        type="number"
                        value={settings.xpPerTest || 20}
                        onChange={e => set('xpPerTest', Number(e.target.value))}
                        className="input-field"
                      />
                    </FormGroup>
                  </div>
                </div>
              )}

              {/* ═══════════════ 7. GAMIFIKATSIYA (GAMIFICATION) ═══════════════ */}
              {activeTab === 'gamification' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Motivatsiya"
                    title="Tangalar (Coins) & Gamifikatsiya"
                    subtitle="O'quvchilar faolligi uchun tangalar va tangalar kursi"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormGroup label="Dars uchun tanga">
                      <input
                        type="number"
                        value={settings.coinsPerLesson || 5}
                        onChange={e => set('coinsPerLesson', Number(e.target.value))}
                        className="input-field"
                      />
                    </FormGroup>
                    <FormGroup label="Uy vazifasi uchun tanga">
                      <input
                        type="number"
                        value={settings.coinsPerHomework || 10}
                        onChange={e => set('coinsPerHomework', Number(e.target.value))}
                        className="input-field"
                      />
                    </FormGroup>
                    <FormGroup label="Test uchun tanga">
                      <input
                        type="number"
                        value={settings.coinsPerTest || 15}
                        onChange={e => set('coinsPerTest', Number(e.target.value))}
                        className="input-field"
                      />
                    </FormGroup>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <FormGroup label="1 tanga kursi (so'mda)" hint="Do'konda mahsulot sotib olishdagi ekvivalent">
                      <input
                        type="number"
                        value={settings.coinExchangeRate || 100}
                        onChange={e => set('coinExchangeRate', Number(e.target.value))}
                        className="input-field"
                      />
                    </FormGroup>

                    <FormGroup label="To'lovda tanga bilan to'lash chegarasi (%)" hint="Oylik to'lovning necha foizini tanga bilan to'lash mumkin">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.maxCoinPaymentPercent || 20}
                        onChange={e => set('maxCoinPaymentPercent', Number(e.target.value))}
                        className="input-field"
                      />
                    </FormGroup>
                  </div>
                </div>
              )}

              {/* ═══════════════ 8. CRM & LIDLAR (CRM_SETTINGS) ═══════════════ */}
              {activeTab === 'crm_settings' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Mijozlar oqimi"
                    title="CRM & Lidlar sozlamalari"
                    subtitle="Lidlarni qabul qilish va manbalar ro'yxati"
                  />

                  <div className="space-y-3">
                    <SettingRow
                      label="Bepul sinov darsiga yozish"
                      hint="Lidlar uchun bepul sinov darsi opsiyasi faollashtiriladi"
                    >
                      <ToggleSwitch
                        checked={settings.freeTrialEnabled !== false}
                        onChange={v => set('freeTrialEnabled', v)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Lidlarni avtomatik biriktirish"
                      hint="Yangi murojaatlarni navbat bilan qabulxona xodimlariga taqsimlash"
                    >
                      <ToggleSwitch
                        checked={settings.autoAssignLeads !== false}
                        onChange={v => set('autoAssignLeads', v)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Lid telefon raqamini majburiy qilish"
                      hint="Telefon kiritilmagan lidlarni qabul qilmaslik"
                    >
                      <ToggleSwitch
                        checked={settings.requireLeadPhone !== false}
                        onChange={v => set('requireLeadPhone', v)}
                      />
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* ═══════════════ 9. INTEGRATSIYALAR (INTEGRATIONS) ═══════════════ */}
              {activeTab === 'integrations' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Tashqi Aloqa"
                    title="SMS va Telegram integratsiyalari"
                    subtitle="Eskiz.uz SMS shlyuzi va Telegram bot konfiguratsiyasi"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormGroup label="Eskiz SMS Email">
                      <input
                        value={settings.smsEmail || ''}
                        onChange={e => set('smsEmail', e.target.value)}
                        className="input-field"
                        placeholder="eskiz@example.com"
                      />
                    </FormGroup>

                    <FormGroup label="Eskiz SMS Token">
                      <input
                        value={settings.smsToken || ''}
                        onChange={e => set('smsToken', e.target.value)}
                        className="input-field font-mono"
                        type="password"
                        placeholder="••••••••••••••••"
                      />
                    </FormGroup>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <FormGroup label="Telegram Bot Token">
                      <input
                        value={settings.telegramBotToken || ''}
                        onChange={e => set('telegramBotToken', e.target.value)}
                        className="input-field font-mono"
                        placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                      />
                    </FormGroup>

                    <FormGroup label="Telegram Bot Username">
                      <input
                        value={settings.telegramBotUsername || ''}
                        onChange={e => set('telegramBotUsername', e.target.value)}
                        className="input-field"
                        placeholder="@abdora_center_bot"
                      />
                    </FormGroup>
                  </div>
                </div>
              )}

              {/* ═══════════════ 10. AI SOZLAMALARI (AI) ═══════════════ */}
              {activeTab === 'ai' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Neyrotarmoqlar"
                    title="Sun'iy Intellekt Konfiguratsiyasi"
                    subtitle="Platformaning asosiy fikrlovchi modellari va Gemini Live preview sozlamalari"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormGroup label="Asosiy AI Model">
                      <select
                        value={settings.aiModel || 'gemini-3.8-flash'}
                        onChange={e => set('aiModel', e.target.value)}
                        className="input-field"
                      >
                        <option value="gemini-3.8-flash">Google Gemini 3.8 Flash (Tavsiya / Tezkor)</option>
                        <option value="gemini-3.5-flash">Google Gemini 3.5 Flash</option>
                        <option value="gemini-2.5-pro">Google Gemini 2.5 Pro (Chuqur mantiq)</option>
                        <option value="gpt-4o">OpenAI GPT-4o (Omni)</option>
                        <option value="claude-3-7-sonnet">Anthropic Claude 3.7 Sonnet</option>
                      </select>
                    </FormGroup>

                    <FormGroup label="Real-vaqt ovozli model (Speaking)">
                      <select
                        value={settings.aiLiveModel || 'gemini-2.5-flash-native-audio-preview'}
                        onChange={e => set('aiLiveModel', e.target.value)}
                        className="input-field"
                      >
                        <option value="gemini-2.5-flash-native-audio-preview">Gemini Native Audio Preview</option>
                        <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp</option>
                      </select>
                    </FormGroup>
                  </div>
                </div>
              )}

              {/* ═══════════════ 11. MAVZULAR (APPEARANCE) ═══════════════ */}
              {activeTab === 'appearance' && (
                <div className="space-y-4">
                  <ThemeBuilder embedded />
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Reception Modal ─── */}
      <AnimatePresence>
        {showReceptionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setShowReceptionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              onClick={e => e.stopPropagation()}
              className="modal-panel max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  {editingReceptionId ? "Qabulxona hisobini tahrirlash" : "Yangi Qabulxona hisobi"}
                </h3>
                <button onClick={() => setShowReceptionModal(false)} className="btn-icon">
                  <X size={16} />
                </button>
              </div>

              {receptionNewCreds ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-center">
                    <CheckCircle2 size={28} className="mx-auto text-emerald-600 mb-1" />
                    <div className="font-bold text-sm text-emerald-700 dark:text-emerald-300">Hisob yaratildi!</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">Ushbu ma'lumotlarni xodimga taqdim eting:</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--secondary-background)] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Login:</span>
                      <span className="font-mono font-bold">{receptionNewCreds.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Parol:</span>
                      <span className="font-mono font-bold">{receptionNewCreds.password}</span>
                    </div>
                  </div>

                  <button onClick={() => { setShowReceptionModal(false); setReceptionNewCreds(null); }} className="btn-primary w-full">
                    Yopish
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <FormGroup label="To'liq ismi" required>
                    <input
                      value={receptionForm.name}
                      onChange={e => setReceptionForm(f => ({ ...f, name: e.target.value }))}
                      className="input-field"
                      placeholder="Xodim ismi"
                    />
                  </FormGroup>

                  <FormGroup label="Telefon raqami" required>
                    <PhoneInput
                      value={receptionForm.phone}
                      onChange={e => setReceptionForm(f => ({ ...f, phone: e.target.value }))}
                      className="input-field"
                      placeholder="+998 90 123 45 67"
                    />
                  </FormGroup>

                  <FormGroup label="Email">
                    <input
                      value={receptionForm.email}
                      onChange={e => setReceptionForm(f => ({ ...f, email: e.target.value }))}
                      className="input-field"
                      placeholder="reception@example.com"
                    />
                  </FormGroup>

                  <FormGroup label="Biriktirilgan filial">
                    <select
                      value={receptionForm.branchId}
                      onChange={e => setReceptionForm(f => ({ ...f, branchId: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Filial biriktirmaslik</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </FormGroup>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowReceptionModal(false)} className="btn-ghost">
                      Bekor qilish
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!receptionForm.name) return toast.error("Ism kiritilishi shart");
                        const payload = {
                          ...receptionForm,
                          phone: cleanPhone(receptionForm.phone),
                        };
                        if (editingReceptionId) {
                          updateReceptionMutation.mutate({ id: editingReceptionId, data: payload });
                        } else {
                          createReceptionMutation.mutate(payload);
                        }
                      }}
                      disabled={createReceptionMutation.isPending || updateReceptionMutation.isPending}
                      className="btn-primary"
                    >
                      {createReceptionMutation.isPending || updateReceptionMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
