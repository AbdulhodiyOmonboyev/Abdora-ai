import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, CreditCard, Bot, Smartphone, UserCog, Sparkles,
  ChevronRight, RefreshCw, Check, Save, Plus, Layers,
  BarChart3, Shield, Settings2, Globe, Key, Zap,
  CheckCircle2, XCircle, AlertTriangle, Clock, TrendingUp,
  Users, GitBranch, BookOpen, ShoppingBag, Target, Banknote,
  Eye, EyeOff, Lock, Pencil, Trash2, Copy, X, Info,
  Activity, DollarSign, Cpu, Package, Star, Award,
  ArrowUpRight, ToggleLeft, ToggleRight, CheckSquare, Square,
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import PlansTab from './settings/PlansTab';
import AIUsageTab from './settings/AIUsageTab';
import SMSMonitorTab from './settings/SMSMonitorTab';
import CustomRolesTab from './settings/CustomRolesTab';

/* ─── ADMIN (Platforma egasi) navigation — faqat SaaS boshqaruv ─── */
const NAV_GROUPS = [
  {
    group: 'Platforma Boshqaruvi',
    items: [
      { id: 'overview',      label: 'Umumiy ko\'rinish',        icon: BarChart3,   badge: 'Dashboard' },
      { id: 'plans',         label: 'Tariflar & Obuna',          icon: CreditCard,  badge: 'SaaS' },
      { id: 'modules',       label: 'Modullar & Ruxsatlar',      icon: Layers,      badge: 'Litsenziya' },
    ]
  },
  {
    group: 'Monitoring',
    items: [
      { id: 'ai_usage',      label: 'AI Token Sarfi',            icon: Bot,         badge: 'Analytics' },
      { id: 'sms_monitor',   label: 'SMS Xabarnomalar',          icon: Smartphone,  badge: 'Sarf' },
    ]
  },
  {
    group: 'Tizim Sozlamalari',
    items: [
      { id: 'custom_roles',  label: 'Maxsus Rollar',             icon: UserCog,     badge: 'Ruxsat' },
      { id: 'platform',      label: 'Platforma Sozlamalari',     icon: Settings2 },
      { id: 'security',      label: 'Xavfsizlik & API',          icon: Shield },
    ]
  }
];

// Modullar — Admin markaz uchun yoqib/o'chiradi
const MODULE_DEFINITIONS = [
  {
    id: 'lms',
    icon: BookOpen,
    color: 'blue',
    name: 'LMS (O\'quv Tizimi)',
    description: 'Darslar, uy vazifasi, testlar, davomat, baholash, sertifikatlar',
    subModules: [
      { key: 'lessons',       label: 'Darslar & Materiallar' },
      { key: 'homework',      label: 'Uy Vazifalari' },
      { key: 'tests',         label: 'Testlar & Imtihonlar' },
      { key: 'attendance',    label: 'Davomat Nazorati' },
      { key: 'timetable',     label: 'Dars Jadvali' },
      { key: 'certificates',  label: 'Sertifikatlar' },
    ]
  },
  {
    id: 'ai',
    icon: Bot,
    color: 'purple',
    name: 'AI (Sun\'iy Intellekt)',
    description: 'Gemini, GPT-4o, Claude — dars generatsiya, grading, speaking, chat',
    subModules: [
      { key: 'aiChat',         label: 'AI Tyutor Chat' },
      { key: 'aiLessonGen',    label: 'Dars Generatsiya' },
      { key: 'aiGrading',     label: 'Avtomatik Baholash' },
      { key: 'aiTestGen',     label: 'Test Generatsiya' },
      { key: 'aiSpeaking',    label: 'Speaking Trenajyor' },
    ]
  },
  {
    id: 'crm',
    icon: Users,
    color: 'emerald',
    name: 'CRM (Mijozlar Boshqaruvi)',
    description: 'Lidlar, funnel bosqichlari, manba tahlili, follow-up eslatmalar',
    subModules: [
      { key: 'leads',          label: 'Lid Boshqaruvi' },
      { key: 'leadFunnel',    label: 'Funnel & Bosqichlar' },
      { key: 'leadReports',   label: 'CRM Hisobotlar' },
    ]
  },
  {
    id: 'finance',
    icon: Banknote,
    color: 'amber',
    name: 'ERP / Moliya Tizimi',
    description: 'Kassa, to\'lovlar, maosh, qarzdorlik, moliyaviy hisobotlar',
    subModules: [
      { key: 'payments',       label: 'To\'lovlar Qabuli' },
      { key: 'cashbox',        label: 'Kassa Boshqaruvi' },
      { key: 'payroll',        label: 'Maosh Hisoblash' },
      { key: 'finReports',    label: 'Moliyaviy Hisobotlar' },
    ]
  },
  {
    id: 'gamification',
    icon: Star,
    color: 'orange',
    name: 'Gamifikatsiya & Do\'kon',
    description: 'Tangalar (coins), XP, liderlar jadvali, online do\'kon',
    subModules: [
      { key: 'coins',          label: 'Tangalar (Coins) Tizimi' },
      { key: 'leaderboard',   label: 'Liderlar Jadvali' },
      { key: 'shop',          label: 'Online Do\'kon' },
    ]
  },
  {
    id: 'sms',
    icon: Smartphone,
    color: 'sky',
    name: 'SMS Xabarnomalar',
    description: 'Davomat SMS, to\'lov eslatmasi, ota-onalarga avtomatik xabar',
    subModules: [
      { key: 'smsAttendance',  label: 'Davomat SMS' },
      { key: 'smsPayment',    label: 'To\'lov Eslatmasi' },
      { key: 'smsBulk',       label: 'Ommaviy SMS' },
    ]
  },
];

const COLOR_MAP = {
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-500',    ring: 'ring-blue-500/30',    badge: 'bg-blue-500' },
  purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-500',  ring: 'ring-purple-500/30',  badge: 'bg-purple-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', ring: 'ring-emerald-500/30', badge: 'bg-emerald-500' },
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-500',   ring: 'ring-amber-500/30',   badge: 'bg-amber-500' },
  orange:  { bg: 'bg-orange-500/10',  text: 'text-orange-500',  ring: 'ring-orange-500/30',  badge: 'bg-orange-500' },
  sky:     { bg: 'bg-sky-500/10',     text: 'text-sky-500',     ring: 'ring-sky-500/30',     badge: 'bg-sky-500' },
};

/* ─── Main Component ──────────────────────────────────────────── */
export default function AdminSettings() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const urlCenterId = searchParams.get('centerId');

  const [activeTab, setActiveTabState] = useState(() => urlTab || 'overview');
  const [selectedCenterId, setSelectedCenterId] = useState(urlCenterId || '');
  const [saved, setSaved] = useState(false);
  const [platformForm, setPlatformForm] = useState({
    platformName: 'Abdora AI',
    supportEmail: '',
    defaultCurrency: 'UZS',
    defaultLanguage: 'uz',
    defaultTimezone: 'Asia/Tashkent',
    maxTrialDays: 14,
    gracePeriodDays: 7,
    suspendAfterDays: 14,
  });

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('tab', tabId);
      return p;
    }, { replace: true });
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

  // Load centers list + stats
  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ['admin-settings', user?.id, selectedCenterId],
    queryFn: () => api.get('/admin/settings', {
      params: selectedCenterId ? { centerId: selectedCenterId } : {}
    }).then(r => r.data?.data),
    enabled: !!user,
  });

  const centers = serverSettings?.centers || [];
  const currentCenter = centers.find(c => c.id === (selectedCenterId || serverSettings?.centerId)) || null;

  // Load overall platform stats
  const { data: platformStats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data?.data).catch(() => null),
    enabled: activeTab === 'overview',
  });

  // Features (modules) for selected center
  const [features, setFeatures] = useState({});
  useEffect(() => {
    if (serverSettings?.features) setFeatures(serverSettings.features);
  }, [serverSettings]);

  const saveFeaturesMutation = useMutation({
    mutationFn: (f) => api.put('/admin/settings', {
      centerId: selectedCenterId || undefined,
      features: f
    }),
    onSuccess: () => {
      toast.success('Modul sozlamalari saqlandi!');
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const toggleFeature = (key, val) => {
    setFeatures(f => ({ ...f, [key]: val }));
  };

  /* ── Overview stats cards ── */
  const statCards = [
    { label: 'Jami Markazlar', value: centers.length, icon: Building2, color: 'blue', sub: 'Faol hisob' },
    { label: 'Faol Obunalar', value: centers.filter(c => c.subscription?.status === 'active').length, icon: CheckCircle2, color: 'emerald', sub: 'To\'langan' },
    { label: 'Trial Davri', value: centers.filter(c => c.subscription?.status === 'trial').length, icon: Clock, color: 'amber', sub: 'Sinov davri' },
    { label: 'Muammo Bor', value: centers.filter(c => ['grace','suspended','cancelled'].includes(c.subscription?.status)).length, icon: AlertTriangle, color: 'red', sub: 'Grace / Suspended' },
  ];

  return (
    <div className="dashboard-shell max-w-7xl w-full mx-auto">
      <PageHeader
        title="Platforma Sozlamalari"
        subtitle="Abdora AI SaaS — O'quv markazlarni boshqarish, tariflar, modullar va monitoring"
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/centers" className="btn-outline btn-sm flex items-center gap-1.5">
              <Plus size={14} /> Yangi markaz
            </Link>
          </div>
        }
      />

      {/* ─── Center Switcher Bar ─── */}
      {centers.length > 0 && (
        <div className="p-4 rounded-2xl border mb-5 flex flex-wrap items-center justify-between gap-3"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <div>
              <div className="text-[11px] text-[var(--text-muted)] font-medium">Sozlanayotgan markaz:</div>
              <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                {currentCenter?.name || 'Barcha markazlar'}
                {currentCenter?.subscription?.status && (
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                    currentCenter.subscription.status === 'active' ? 'bg-emerald-500/15 text-emerald-600' :
                    currentCenter.subscription.status === 'trial' ? 'bg-amber-500/15 text-amber-600' :
                    'bg-red-500/15 text-red-500'
                  }`}>
                    {currentCenter.subscription.status.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedCenterId}
              onChange={(e) => handleCenterChange(e.target.value)}
              className="input-field text-xs py-1.5 px-3 min-w-[220px]"
            >
              <option value="">— Barcha markazlar —</option>
              {centers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.subscription?.plan?.name ? `[${c.subscription.plan.name}]` : ''}
                </option>
              ))}
            </select>
            {currentCenter && (
              <Link
                to={`/admin/centers`}
                className="btn-outline btn-xs flex items-center gap-1"
              >
                <Eye size={13} /> Ko'rish
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="settings-shell">
        {/* ── Left Nav ── */}
        <nav className="settings-nav space-y-4">
          {NAV_GROUPS.map(({ group, items }) => (
            <div key={group}>
              <div className="text-[10px] font-bold tracking-widest uppercase mb-1.5 px-3"
                style={{ color: 'var(--text-muted)' }}>
                {group}
              </div>
              <div className="space-y-0.5">
                {items.map(({ id, label, icon: Icon, badge }) => {
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
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-[var(--primary)] text-white' : 'bg-[var(--secondary-background)] text-[var(--text-muted)]'
                        }`}>
                          {badge}
                        </span>
                      )}
                      {isActive && <ChevronRight size={14} style={{ color: 'var(--primary)' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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

              {/* ═══════════════ OVERVIEW ═══════════════ */}
              {activeTab === 'overview' && (
                <OverviewTab
                  centers={centers}
                  statCards={statCards}
                  platformStats={platformStats}
                  isLoading={isLoading}
                  onNavigate={setActiveTab}
                  onSelectCenter={handleCenterChange}
                />
              )}

              {/* ═══════════════ TARIFLAR ═══════════════ */}
              {activeTab === 'plans' && (
                <PlansTab selectedCenterId={selectedCenterId} currentCenter={currentCenter} />
              )}

              {/* ═══════════════ MODULLAR ═══════════════ */}
              {activeTab === 'modules' && (
                <ModulesTab
                  features={features}
                  onToggle={toggleFeature}
                  onSave={() => saveFeaturesMutation.mutate(features)}
                  isSaving={saveFeaturesMutation.isPending}
                  saved={saved}
                  currentCenter={currentCenter}
                  selectedCenterId={selectedCenterId}
                />
              )}

              {/* ═══════════════ AI TOKEN MONITORING ═══════════════ */}
              {activeTab === 'ai_usage' && (
                <AIUsageTab selectedCenterId={selectedCenterId} />
              )}

              {/* ═══════════════ SMS MONITORING ═══════════════ */}
              {activeTab === 'sms_monitor' && (
                <SMSMonitorTab selectedCenterId={selectedCenterId} />
              )}

              {/* ═══════════════ MAXSUS ROLLAR ═══════════════ */}
              {activeTab === 'custom_roles' && (
                <CustomRolesTab selectedCenterId={selectedCenterId} currentCenter={currentCenter} />
              )}

              {/* ═══════════════ PLATFORMA SOZLAMALARI ═══════════════ */}
              {activeTab === 'platform' && (
                <PlatformSettingsTab form={platformForm} setForm={setPlatformForm} />
              )}

              {/* ═══════════════ XAVFSIZLIK & API ═══════════════ */}
              {activeTab === 'security' && (
                <SecurityTab />
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   OVERVIEW TAB — Platforma boshqaruv paneli
══════════════════════════════════════════════════════════════ */
function OverviewTab({ centers, statCards, platformStats, isLoading, onNavigate, onSelectCenter }) {
  const statusConfig = {
    active:    { label: 'Faol',      cls: 'bg-emerald-500/15 text-emerald-600' },
    trial:     { label: 'Trial',     cls: 'bg-amber-500/15 text-amber-600' },
    grace:     { label: 'Grace',     cls: 'bg-orange-500/15 text-orange-500' },
    suspended: { label: 'Suspended', cls: 'bg-red-500/15 text-red-500' },
    cancelled: { label: 'Bekor',     cls: 'bg-gray-500/15 text-gray-500' },
  };

  return (
    <div className="space-y-5">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const colors = COLOR_MAP[card.color] || COLOR_MAP.blue;
          const Icon = card.icon;
          return (
            <div key={card.label} className="panel-card p-4 rounded-2xl border"
              style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors.bg} ${colors.text}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                {isLoading ? '...' : card.value}
              </div>
              <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{card.label}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => onNavigate('plans')}
          className="p-4 rounded-2xl border flex items-center gap-3 hover:border-[var(--primary)] transition-all text-left group"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
            <CreditCard size={20} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Tariflarni boshqarish</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Starter, Pro, Pro Max</div>
          </div>
          <ArrowUpRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--primary)' }} />
        </button>

        <button onClick={() => onNavigate('modules')}
          className="p-4 rounded-2xl border flex items-center gap-3 hover:border-[var(--primary)] transition-all text-left group"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Modullarni sozlash</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>AI, LMS, CRM, ERP, SMS</div>
          </div>
          <ArrowUpRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--primary)' }} />
        </button>

        <button onClick={() => onNavigate('ai_usage')}
          className="p-4 rounded-2xl border flex items-center gap-3 hover:border-[var(--primary)] transition-all text-left group"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <BarChart3 size={20} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>AI / SMS monitoring</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Token va SMS sarflar</div>
          </div>
          <ArrowUpRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--primary)' }} />
        </button>
      </div>

      {/* Centers table */}
      <div className="panel-card rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>O'quv Markazlar Ro'yxati</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Barcha faol va sinov davridagi markazlar</p>
          </div>
          <Link to="/admin/centers" className="btn-outline btn-xs flex items-center gap-1">
            <Eye size={12} /> Barchasi
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--secondary-background)' }}>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--text-muted)' }}>Markaz</th>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--text-muted)' }}>Tarif</th>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--text-muted)' }}>Holati</th>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--text-muted)' }}>Modullar</th>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--text-muted)' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {centers.slice(0, 8).map((center) => {
                const sub = center.subscription;
                const sc = statusConfig[sub?.status] || { label: 'Tarif yo\'q', cls: 'bg-gray-500/15 text-gray-400' };
                // Count enabled modules
                const f = serverSettings?.features || {};
                const enabledCount = ['aiEnabled','financeEnabled','leadsEnabled','smsEnabled','coinsEnabled','lessonsEnabled']
                  .filter(k => f[k]).length;
                return (
                  <tr key={center.id} className="hover:bg-[var(--secondary-background)] transition-colors cursor-pointer"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onClick={() => onSelectCenter(center.id)}>
                    <td className="px-4 py-3">
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{center.name}</div>
                      <div style={{ color: 'var(--text-muted)' }}>{center.phone || center.email || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ color: 'var(--text-secondary)' }}>{sub?.plan?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.cls}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {sub?.plan?.features?.lms && <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[9px] font-bold">LMS</span>}
                        {sub?.plan?.features?.ai_chat && <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-500 rounded text-[9px] font-bold">AI</span>}
                        {sub?.plan?.features?.crm && <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-bold">CRM</span>}
                        {sub?.plan?.features?.finance && <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded text-[9px] font-bold">ERP</span>}
                        {sub?.plan?.features?.sms && <span className="px-1.5 py-0.5 bg-sky-500/10 text-sky-500 rounded text-[9px] font-bold">SMS</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectCenter(center.id); }}
                        className="btn-outline btn-xs"
                      >
                        Sozla
                      </button>
                    </td>
                  </tr>
                );
              })}
              {centers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    Hali markazlar yo'q. <Link to="/admin/centers" className="text-[var(--primary)]">Yangi markaz qo'shing</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODULES TAB — Litsenziya / Modul boshqaruvi
══════════════════════════════════════════════════════════════ */
function ModulesTab({ features, onToggle, onSave, isSaving, saved, currentCenter, selectedCenterId }) {
  // Map module definition sub-keys to feature keys
  const featureKeyMap = {
    // LMS
    lessons: 'lessonsEnabled', homework: 'homeworkEnabled', tests: 'testsEnabled',
    attendance: 'attendanceEnabled', timetable: 'timetableEnabled', certificates: 'certificatesEnabled',
    // AI
    aiChat: 'aiChatEnabled', aiLessonGen: 'aiLessonGenEnabled', aiGrading: 'aiGradingEnabled',
    aiTestGen: 'aiTestGenEnabled', aiSpeaking: 'aiSpeakingEnabled',
    // CRM
    leads: 'leadsEnabled', leadFunnel: 'leadsEnabled', leadReports: 'leadsEnabled',
    // Finance/ERP
    payments: 'paymentsEnabled', cashbox: 'cashboxEnabled', payroll: 'payrollEnabled', finReports: 'financeEnabled',
    // Gamification
    coins: 'coinsEnabled', leaderboard: 'leaderboardEnabled', shop: 'shopEnabled',
    // SMS
    smsAttendance: 'smsEnabled', smsPayment: 'smsEnabled', smsBulk: 'smsEnabled',
  };

  const moduleMainKeyMap = {
    lms: 'lessonsEnabled', ai: 'aiEnabled', crm: 'leadsEnabled',
    finance: 'financeEnabled', gamification: 'coinsEnabled', sms: 'smsEnabled',
  };

  const isModuleEnabled = (modId) => features[moduleMainKeyMap[modId]] !== false;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="panel-card p-5 rounded-2xl border flex items-start justify-between gap-4"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mt-0.5">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Modullar & Litsenziya Boshqaruvi
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {currentCenter
                ? `«${currentCenter.name}» markaziga qaysi modullar ochilganini boshqaring`
                : 'Markaz tanlang yoki tarif orqali modullarni bering'}
            </p>
          </div>
        </div>
        <button
          onClick={onSave}
          disabled={isSaving || !selectedCenterId}
          className="btn-primary flex items-center gap-1.5 text-xs whitespace-nowrap"
        >
          {isSaving ? <RefreshCw size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Save size={13} />}
          {isSaving ? 'Saqlanmoqda...' : saved ? 'Saqlandi!' : 'Saqlash'}
        </button>
      </div>

      {!selectedCenterId && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          Yuqoridagi markaz tanlash menyusidan o'quv markazni tanlang. Modullar tanlangan markaz uchun qo'llaniladi.
        </div>
      )}

      {/* Module cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODULE_DEFINITIONS.map((mod) => {
          const colors = COLOR_MAP[mod.color];
          const Icon = mod.icon;
          const enabled = isModuleEnabled(mod.id);

          return (
            <div key={mod.id}
              className={`rounded-2xl border transition-all ${enabled ? `ring-2 ${colors.ring}` : 'opacity-70'}`}
              style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              {/* Module header */}
              <div className={`p-4 rounded-t-2xl flex items-center justify-between ${enabled ? colors.bg : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg} ${colors.text}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{mod.name}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{mod.description}</div>
                  </div>
                </div>
                {/* Toggle */}
                <button
                  onClick={() => onToggle(moduleMainKeyMap[mod.id], !enabled)}
                  className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${enabled ? 'bg-[var(--primary)]' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${enabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Sub modules */}
              {enabled && (
                <div className="p-3 space-y-1.5">
                  {mod.subModules.map((sub) => {
                    const featureKey = featureKeyMap[sub.key];
                    const subEnabled = features[featureKey] !== false;
                    return (
                      <div key={sub.key}
                        className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-[var(--secondary-background)] cursor-pointer transition-colors"
                        onClick={() => featureKey && onToggle(featureKey, !subEnabled)}>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sub.label}</span>
                        <div className={`w-4 h-4 rounded flex items-center justify-center ${subEnabled ? `${colors.bg} ${colors.text}` : 'bg-gray-100 dark:bg-gray-700'}`}>
                          {subEnabled ? <Check size={10} strokeWidth={3} /> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!enabled && (
                <div className="px-4 pb-3">
                  <div className="text-[11px] italic" style={{ color: 'var(--text-muted)' }}>
                    Bu modul o'chirilgan — markaz uchun yoqish uchun yuqoridagi toggle ni bosing
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PLATFORM SETTINGS TAB
══════════════════════════════════════════════════════════════ */
function PlatformSettingsTab({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="panel-card p-5 rounded-2xl border space-y-5" style={{ borderColor: 'var(--border)' }}>
        <div className="pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="panel-kicker">Platforma</span>
          <h2 className="panel-title mt-0.5">Umumiy Sozlamalar</h2>
          <p className="panel-subtitle mt-1">SaaS platformasi nomi, valyuta va til parametrlari</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="form-label">Platforma Nomi</label>
            <input className="input-field" value={form.platformName}
              onChange={e => set('platformName', e.target.value)} placeholder="Abdora AI" />
          </div>
          <div className="space-y-1.5">
            <label className="form-label">Texnik Qo'llab-quvvatlash Email</label>
            <input className="input-field" type="email" value={form.supportEmail}
              onChange={e => set('supportEmail', e.target.value)} placeholder="support@abdora.uz" />
          </div>
          <div className="space-y-1.5">
            <label className="form-label">Asosiy Valyuta</label>
            <select className="input-field" value={form.defaultCurrency} onChange={e => set('defaultCurrency', e.target.value)}>
              <option value="UZS">So'm (UZS)</option>
              <option value="USD">Dollar (USD)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="form-label">Asosiy Til</label>
            <select className="input-field" value={form.defaultLanguage} onChange={e => set('defaultLanguage', e.target.value)}>
              <option value="uz">O'zbekcha</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="panel-kicker mb-3">Obuna Davrlari</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="form-label">Standart Trial (kun)</label>
              <input className="input-field" type="number" value={form.maxTrialDays}
                onChange={e => set('maxTrialDays', Number(e.target.value))} />
              <p className="form-hint">Yangi markaz ochilganda sinov davri</p>
            </div>
            <div className="space-y-1.5">
              <label className="form-label">Grace Period (kun)</label>
              <input className="input-field" type="number" value={form.gracePeriodDays}
                onChange={e => set('gracePeriodDays', Number(e.target.value))} />
              <p className="form-hint">To'lov kechiksa qancha kutiladi</p>
            </div>
            <div className="space-y-1.5">
              <label className="form-label">Suspended (kun)</label>
              <input className="input-field" type="number" value={form.suspendAfterDays}
                onChange={e => set('suspendAfterDays', Number(e.target.value))} />
              <p className="form-hint">Grace tugaganda tizim to'xtatiladi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECURITY TAB — BYOK & API Keys management info
══════════════════════════════════════════════════════════════ */
function SecurityTab() {
  const [showKey, setShowKey] = useState(false);
  const encKey = import.meta.env.VITE_ENCRYPTION_KEY ? '••••••••••••••••••••••••••••••••' : 'O\'rnatilmagan';

  const secItems = [
    { icon: Key, color: 'purple', title: 'AES-256-GCM Shifrlash', desc: 'Barcha BYOK va BYOS API kalitlari AES-256-GCM bilan shifrlanib, IV alohida saqlanadi', status: 'Faol' },
    { icon: Shield, color: 'blue', title: 'JWT Autentifikatsiya', desc: 'Access token (15 daqiqa) + Refresh token (30 kun). Bearer header orqali', status: 'Faol' },
    { icon: Activity, color: 'emerald', title: 'Subscription Guard', desc: 'Har bir so\'rovda markaz obuna holati tekshiriladi. Grace/Suspended da cheklash', status: 'Faol' },
    { icon: Zap, color: 'amber', title: 'Rate Limiting', desc: 'Umumiy: 500 req/15 min. Auth: 30/15 min. AI: 60/15 min', status: 'Faol' },
  ];

  return (
    <div className="space-y-4">
      <div className="panel-card p-5 rounded-2xl border space-y-4" style={{ borderColor: 'var(--border)' }}>
        <div className="pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="panel-kicker">Xavfsizlik</span>
          <h2 className="panel-title mt-0.5">Tizim Xavfsizlik Holati</h2>
          <p className="panel-subtitle mt-1">Platforma xavfsizlik mexanizmlari monitoringi</p>
        </div>

        <div className="space-y-3">
          {secItems.map((item) => {
            const colors = COLOR_MAP[item.color];
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'var(--secondary-background)' }}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0">
                  {item.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel-card p-5 rounded-2xl border space-y-4" style={{ borderColor: 'var(--border)' }}>
        <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>API Kalitlar (Server .env)</div>
        <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          {[
            { key: 'ENCRYPTION_KEY', desc: 'AES-256 shifrlash kaliti (64 hex char)', req: true },
            { key: 'JWT_SECRET', desc: 'JWT token imzolash kaliti', req: true },
            { key: 'DATABASE_URL', desc: 'PostgreSQL (Neon) ulanish URL', req: true },
            { key: 'GEMINI_API_KEY', desc: 'Google Gemini AI kaliti (platformaning default)', req: false },
            { key: 'SMS_ESKIZ_EMAIL', desc: 'Eskiz.uz email (platformaning SMS)', req: false },
            { key: 'SMS_ESKIZ_KEY', desc: 'Eskiz.uz API token', req: false },
          ].map(({ key, desc, req }) => (
            <div key={key} className="flex items-center justify-between gap-3 p-2.5 rounded-lg"
              style={{ background: 'var(--secondary-background)' }}>
              <div>
                <code className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{key}</code>
                <span className="ml-2" style={{ color: 'var(--text-muted)' }}>{desc}</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${req ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-400'}`}>
                {req ? 'Majburiy' : 'Ixtiyoriy'}
              </span>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs flex items-start gap-2"
          style={{ color: 'var(--text-secondary)' }}>
          <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
          Kalit o'zgartirishdan oldin barcha markazlardagi shifrlangan ma'lumotlar (BYOK/BYOS) eski kalit bilan dekript qiling, so'ng yangi kalit bilan qayta shifrlang.
        </div>
      </div>
    </div>
  );
}
