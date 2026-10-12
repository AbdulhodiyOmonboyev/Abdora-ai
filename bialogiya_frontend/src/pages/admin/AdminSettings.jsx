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
  Plus, Trash2, Pencil, UserCog, Copy, Sliders, Layers, UserCheck, CheckSquare, Key, Settings2,
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
import PlansTab from './settings/PlansTab';
import AIUsageTab from './settings/AIUsageTab';
import SMSMonitorTab from './settings/SMSMonitorTab';
import CustomRolesTab from './settings/CustomRolesTab';

/* ─── Sidebar nav items (SaaS Super Admin view) ──────────────── */
const NAV_ITEMS = [
  // ── SaaS Sotuv & Konstruktor ──
  { id: 'plans',        label: 'Tariflar & Paketlar (SaaS)', icon: CreditCard,  badge: 'Asosiy',   group: 'SaaS Sotuv & Paketlar' },
  { id: 'features',     label: 'Markaz Modullari (Sotuv)',  icon: Sparkles,    badge: 'Ruxsat',   group: null },
  { id: 'custom_roles', label: 'Maxsus Rollar',             icon: UserCog,     badge: 'Yangi',    group: null },

  // ── Sarf & Monitoring ──
  { id: 'ai_usage',     label: 'AI Token Monitoring',       icon: Bot,         badge: 'Live',     group: 'Sarf & Tahlil' },
  { id: 'sms_monitor',  label: 'SMS Sarfi & Monitoring',    icon: Smartphone,  badge: 'Sarf',     group: null },

  // ── Global Tizim ──
  { id: 'integrations', label: 'Platforma API Kalitlari',   icon: Key,         badge: 'Global',   group: 'Global Tizim' },
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
    const initial = urlTab || localStorage.getItem('admin_settings_tab') || 'plans';
    return initial === 'roles' || initial === 'limits' ? 'plans' : initial;
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

  // Load all centers directly
  const { data: directCenters = [] } = useQuery({
    queryKey: ['admin-centers'],
    queryFn: () => api.get('/admin/centers').then(r => r.data?.data || r.data || []),
    enabled: user?.role === 'admin',
  });

  // Load settings with active center context
  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ['admin-settings', user?.id, selectedCenterId],
    queryFn: () => api.get('/admin/settings', {
      params: selectedCenterId ? { centerId: selectedCenterId } : {}
    }).then(r => r.data?.data),
    enabled: !!user,
  });

  const centers = (directCenters && directCenters.length > 0) ? directCenters : (serverSettings?.centers || []);
  const currentCenter = centers.find(c => c.id === (selectedCenterId || serverSettings?.centerId)) || centers[0] || null;

  useEffect(() => {
    if (!selectedCenterId && currentCenter?.id) {
      setSelectedCenterId(currentCenter.id);
    }
  }, [currentCenter, selectedCenterId]);

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

  return (
    <div className="dashboard-shell max-w-6xl w-full mx-auto">
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
                {currentCenter && (
                  <Link
                    to={`/admin/centers/${currentCenter.id}/settings`}
                    className="btn-primary btn-xs flex items-center gap-1"
                    title="Ushbu markazning alohida sozlamalar sahifasini ochish"
                  >
                    <Settings2 size={13} /> Markaz sahifasi
                  </Link>
                )}
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
          {NAV_ITEMS.map(({ id, label, icon: Icon, badge, group }) => {
            const isActive = activeTab === id;
            return (
              <div key={id}>
                {group && (
                  <div className="px-2 pt-3 pb-1 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{group}</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  </div>
                )}
                <button
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
              </div>
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

              {/* ═══════════════ TARIFLAR & OBUNA ═══════════════ */}
              {activeTab === 'plans' && (
                <PlansTab selectedCenterId={selectedCenterId} currentCenter={currentCenter} />
              )}

              {/* ═══════════════ AI TOKEN MONITORING ═══════════════ */}
              {activeTab === 'ai_usage' && (
                <AIUsageTab selectedCenterId={selectedCenterId} />
              )}

              {/* ═══════════════ SMS MONITORING & SOZLAMALAR ═══════════════ */}
              {activeTab === 'sms_monitor' && (
                <SMSMonitorTab selectedCenterId={selectedCenterId} />
              )}

              {/* ═══════════════ MAXSUS ROLLAR (CUSTOM ROLES) ═══════════════ */}
              {activeTab === 'custom_roles' && (
                currentCenter ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl border border-indigo-500/25 bg-indigo-500/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold">
                        <Building2 size={16} className="text-indigo-600 flex-shrink-0" />
                        <span>Hozirda <strong>"{currentCenter.name}"</strong> markazining maxsus rollari sozlanmoqda.</span>
                      </div>
                      <Link to={`/admin/centers/${currentCenter.id}/settings`} className="btn-outline btn-xs flex items-center gap-1 bg-[var(--card)]">
                        <Settings2 size={12} /> Markaz sahifasida ochish
                      </Link>
                    </div>
                    <CustomRolesTab selectedCenterId={currentCenter.id} currentCenter={currentCenter} />
                  </div>
                ) : (
                  <div className="panel-card text-center py-12 space-y-3">
                    <Building2 size={40} className="mx-auto text-amber-500 opacity-60" />
                    <h3 className="font-bold text-base text-[var(--text-primary)]">Maxsus rollar uchun o'quv markaz tanlanmagan</h3>
                    <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                      Maxsus rollar (Mock Examiner, Reception va boshqalar) umumiy emas, har bir markazga alohida biriktiriladi. Avval yuqoridagi ro'yxatdan markazni tanlang.
                    </p>
                    <Link to="/admin/centers" className="btn-primary btn-sm inline-flex items-center gap-1.5">
                      <Plus size={14} /> Yangi markaz qo'shish
                    </Link>
                  </div>
                )
              )}

              {/* ═══════════════ 2. MARKAZ MODULLARI & SOTUV (FEATURES) ═══════════════ */}
              {activeTab === 'features' && (
                <div className="panel-card space-y-6">
                  <SectionHeader
                    kicker="SaaS Modullar Paketi"
                    title="Markazga Sotilgan Xizmatlar & Ruxsatlar"
                    subtitle="Tanlangan o'quv markaz uchun sotilgan modullarni (AI, CRM, LMS, ERP, Kassa, SMS) boshqaring. O'chirilgan tizimlar o'quv markaz uchun butunlay yopiladi."
                  />

                  {currentCenter ? (
                    <div className="p-3.5 rounded-xl border border-indigo-500/25 bg-indigo-500/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold">
                        <Building2 size={16} className="text-indigo-600 flex-shrink-0" />
                        <span>Hozirda tanlangan: <strong>"{currentCenter.name}"</strong>. Modullarni saqlash faqat ushbu markazga amal qiladi.</span>
                      </div>
                      <Link to={`/admin/centers/${currentCenter.id}/settings`} className="btn-outline btn-xs flex items-center gap-1 bg-[var(--card)]">
                        <Settings2 size={12} /> Markaz sahifasida ochish
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <Building2 size={24} className="text-amber-500 flex-shrink-0" />
                        <div>
                          <div className="font-bold text-sm text-[var(--text-primary)]">O'quv markaz tanlanmagan</div>
                          <div className="text-[var(--text-secondary)] mt-0.5">Ushbu modullar umumiy emas, aynan tanlangan markazga bog'lanadi. Avval markaz tanlang.</div>
                        </div>
                      </div>
                      <Link to="/admin/centers" className="btn-primary btn-xs">
                        Markazlar ro'yxati
                      </Link>
                    </div>
                  )}

                  {/* SaaS Sales Info Alert */}
                  <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-start gap-3">
                    <Sparkles size={18} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-[var(--text-primary)]">SaaS Sotuv Nazorati:</div>
                      <div className="text-[var(--text-secondary)] leading-relaxed">
                        Agar markaz faqat <b>CRM</b> sotib olgan bo'lsa, pastdagi <b>AI</b> va <b>LMS</b> modullarini o'chirib qo'yishingiz mumkin.
                        Ushbu o'quv markaz xodimlari va talabalari faqat siz yoqib bergan bo'limlardan foydalana oladilar.
                      </div>
                    </div>
                  </div>

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

              {/* ═══════════════ 3. CHEKLOVLAR & LIMITLAR (LIMITS) ═══════════════ */}
              {activeTab === 'limits' && (
                <div className="panel-card space-y-6">
                  <SectionHeader
                    kicker="Tarif va Miqdorlar"
                    title="Markaz cheklovlari va kvotalari"
                    subtitle="Markaz sig'imi, filiallar va oylik AI so'rovlar limitini belgilang. (0 kiritilsa cheksiz hisoblanadi)"
                  />

                  {currentCenter ? (
                    <div className="p-3.5 rounded-xl border border-indigo-500/25 bg-indigo-500/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold">
                        <Building2 size={16} className="text-indigo-600 flex-shrink-0" />
                        <span>Hozirda tanlangan markaz: <strong>"{currentCenter.name}"</strong>. Limitlar faqat ushbu markaz uchun belgilanadi.</span>
                      </div>
                      <Link to={`/admin/centers/${currentCenter.id}/settings`} className="btn-outline btn-xs flex items-center gap-1 bg-[var(--card)]">
                        <Settings2 size={12} /> Markaz sahifasida ochish
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <Building2 size={24} className="text-amber-500 flex-shrink-0" />
                        <div>
                          <div className="font-bold text-sm text-[var(--text-primary)]">O'quv markaz tanlanmagan</div>
                          <div className="text-[var(--text-secondary)] mt-0.5">Kvotalar va limitlar har bir markazga alohida belgilanadi. Avval markaz tanlang.</div>
                        </div>
                      </div>
                      <Link to="/admin/centers" className="btn-primary btn-xs">
                        Markazlar ro'yxati
                      </Link>
                    </div>
                  )}

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



              {/* ═══════════════ PLATFORMA GLOBAL API KALITLARI (INTEGRATIONS) ═══════════════ */}
              {activeTab === 'integrations' && (
                <div className="panel-card space-y-6">
                  <SectionHeader
                    kicker="SaaS Global Tizim"
                    title="Platforma API Kalitlari & Konfiguratsiyasi"
                    subtitle="Butun Abdora AI tizimining asosiy Gemini API kaliti, SMS shlyuzi va neyrotarmoq modellari. Bu sozlamalar tizim darajasida global ishlaydi."
                  />

                  {/* 1. Google Gemini AI Config */}
                  <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                          <Bot size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[var(--text-primary)]">Google Gemini AI (Asosiy Fikrlovchi Dvigatel)</h4>
                          <p className="text-[11px] text-[var(--text-secondary)]">Dars yaratish, testlar, avtomatik baholash va 24/7 AI Tyutor uchun</p>
                        </div>
                      </div>
                      <span className="badge badge-success text-[10px] py-0.5 px-2">Faol Tizim</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormGroup label="Gemini API Kaliti (Global)" hint="Google AI Studio dan olingan asosiy kalit">
                        <div className="relative">
                          <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                          <input
                            value={settings.geminiApiKey || ''}
                            onChange={e => set('geminiApiKey', e.target.value)}
                            className="input-field pl-9 font-mono"
                            type="password"
                            placeholder="AIzaSy••••••••••••••••••••"
                          />
                        </div>
                      </FormGroup>

                      <FormGroup label="Asosiy AI Model" hint="Matn, konspekt va savol-javoblar uchun">
                        <select
                          value={settings.aiModel || 'gemini-3.8-flash'}
                          onChange={e => set('aiModel', e.target.value)}
                          className="input-field"
                        >
                          <option value="gemini-3.8-flash">Google Gemini 3.8 Flash (Tavsiya / Eng tezkor & aqlli)</option>
                          <option value="gemini-3.5-flash">Google Gemini 3.5 Flash</option>
                          <option value="gemini-2.5-flash">Google Gemini 2.5 Flash</option>
                          <option value="gemini-2.5-pro">Google Gemini 2.5 Pro (Chuqur tahlil)</option>
                          <option value="gpt-4o">OpenAI GPT-4o (Omni)</option>
                          <option value="claude-3-7-sonnet">Anthropic Claude 3.7 Sonnet</option>
                        </select>
                      </FormGroup>

                      <div className="sm:col-span-2">
                        <FormGroup label="Real-vaqt ovozli model (Speaking & Voice)" hint="Talabalar bilan jonli ingliz tili speaking mashqlari uchun">
                          <select
                            value={settings.aiLiveModel || 'gemini-2.5-flash-native-audio-preview'}
                            onChange={e => set('aiLiveModel', e.target.value)}
                            className="input-field"
                          >
                            <option value="gemini-2.5-flash-native-audio-preview">Gemini Native Audio Preview (Past kechikish & Ovoz)</option>
                            <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp</option>
                          </select>
                        </FormGroup>
                      </div>
                    </div>
                  </div>

                  {/* 2. SMS Provayder */}
                  <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          <Smartphone size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[var(--text-primary)]">SMS Provayder (Platforma Bosh Kaliti)</h4>
                          <p className="text-[11px] text-[var(--text-secondary)]">Eskiz.uz yoki Playmobile orqali butun O'zbekiston bo'yicha SMS jo'natish</p>
                        </div>
                      </div>
                      <span className="badge text-[10px] py-0.5 px-2 bg-emerald-500/10 text-emerald-600">Eskiz.uz</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormGroup label="Eskiz SMS Email">
                        <input
                          value={settings.smsEmail || ''}
                          onChange={e => set('smsEmail', e.target.value)}
                          className="input-field"
                          placeholder="eskiz@example.com"
                        />
                      </FormGroup>

                      <FormGroup label="Eskiz SMS Token (Bearer Token)">
                        <input
                          value={settings.smsToken || ''}
                          onChange={e => set('smsToken', e.target.value)}
                          className="input-field font-mono"
                          type="password"
                          placeholder="eyJ0eXAiOiJKV1QiLC..."
                        />
                      </FormGroup>
                    </div>
                  </div>

                  {/* 3. Telegram Bot */}
                  <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                          <Bell size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[var(--text-primary)]">Telegram Bot Integratsiyasi</h4>
                          <p className="text-[11px] text-[var(--text-secondary)]">O'quvchilar va ota-onalarga bot orqali bildirishnoma yuborish</p>
                        </div>
                      </div>
                      <span className="badge text-[10px] py-0.5 px-2 bg-[var(--secondary-background)] text-[var(--text-muted)]">Ixtiyoriy</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          placeholder="@abdora_ai_bot"
                        />
                      </FormGroup>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
