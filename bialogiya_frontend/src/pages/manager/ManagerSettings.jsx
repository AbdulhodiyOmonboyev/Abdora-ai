import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Shield, Building2, CreditCard, BookOpen, Target, Bell, User,
  Lock, Unlock, PieChart, Wallet, Calendar, Users, GraduationCap,
  BookMarked, Plus, X, Pencil, Trash2, Copy, Save, Check, KeyRound,
  Sun, Moon, Palette, AlertCircle, Phone, Smartphone, Banknote, ChevronRight,
  Sparkles, ShoppingBag, Tag, Gift, Shirt, Package, Clock, CheckCircle2, Coins,
  Bot, RefreshCw
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import PageHeader from '../../components/ui/PageHeader';
import PhoneInput from '../../components/ui/PhoneInput';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { cleanPhone } from '../../utils/formatPhone';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import ThemeBuilder from '../../components/ui/ThemeBuilder';

const MANAGER_NAV_ITEMS = [
  { id: 'reception_control', label: 'Qabulxona (Reception)',       icon: ShieldCheck },
  { id: 'features_control',  label: 'Markaz imkoniyatlari (AI)',    icon: Sparkles },
  { id: 'branch_info',       label: 'Filial ma\'lumotlari',        icon: Building2 },
  { id: 'payments',          label: 'To\'lovlar & Qoidalar',       icon: CreditCard },
  { id: 'lms_rules',         label: 'LMS & Ta\'lim qoidalari',     icon: BookOpen },
  { id: 'crm_leads',         label: 'CRM & Lidlar sozlamasi',      icon: Target },
  { id: 'coin_shop',         label: 'Online Do\'kon (Coin Shop)',  icon: ShoppingBag },
  { id: 'notifications',     label: 'Bildirishnomalar (SMS)',      icon: Bell },
  { id: 'themes',            label: 'Mavzular & Ko\'rinish',       icon: Palette },
  { id: 'personal',          label: 'Mening hisobim & Parol',      icon: User },
];

const DEFAULT_LEAD_STAGES = [
  { id: 'new', name: 'Yangi murojaat', color: '#3B82F6' },
  { id: 'contacted', name: "Aloqa o'rnatildi", color: '#8B5CF6' },
  { id: 'trial', name: 'Sinov darsiga yozildi', color: '#F59E0B' },
  { id: 'attended', name: 'Sinov darsida qatnashdi', color: '#06B6D4' },
  { id: 'payment_pending', name: "To'lov kutilmoqda", color: '#EC4899' },
  { id: 'enrolled', name: "Guruhga qo'shildi", color: '#10B981' },
];

const DEFAULT_LEAD_SOURCES = [
  'Instagram', 'Telegram', 'Facebook', 'Tashqi banner', "Do'st tavsiyasi", 'Web sayt'
];

const PRESET_STAGE_COLORS = [
  '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#06B6D4', '#6366F1', '#EF4444'
];

const SHOP_ICON_MAP = {
  Shirt,
  Sparkles,
  BookOpen,
  Tag,
  Pencil,
  Gift,
  Package,
};

function SectionHeader({ kicker, title, subtitle }) {
  return (
    <div className="pb-4 border-b border-[var(--border)]">
      {kicker && <span className="panel-kicker">{kicker}</span>}
      <h2 className="panel-title mt-0.5">{title}</h2>
      {subtitle && <p className="panel-subtitle mt-1">{subtitle}</p>}
    </div>
  );
}

function SettingRow({ label, hint, children, noBorder = false }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-3.5 ${!noBorder ? 'border-b border-[var(--border)]' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--text-primary)]">{label}</div>
        {hint && <div className="text-xs mt-0.5 text-[var(--text-secondary)]">{hint}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-[var(--primary)]' : 'bg-gray-300 dark:bg-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function ManagerSettings() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTabState] = useState(urlTab || 'reception_control');
  const [saved, setSaved] = useState(false);

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  // Reception user modals
  const [showAddReception, setShowAddReception] = useState(false);
  const [receptionForm, setReceptionForm] = useState({ name: '', phone: '+998 ', branchId: '', password: '' });
  const [newReceptionCreds, setNewReceptionCreds] = useState(null);
  const [editingReception, setEditingReception] = useState(null);

  // Profile and password state
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '+998 ' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  // Manager settings state
  const [settings, setSettings] = useState({
    centerName: '',
    centerAddress: '',
    centerPhone: '',
    centerWorkingHours: '08:00 — 20:00',
    lessonDurationMinutes: 90,
    maxStudentsPerGroup: 16,
    minAttendancePercent: 80,
    passingScorePercent: 60,
    allowInstallments: true,
    paymentDueDay: 5,
    enabledPaymentMethods: ['cash', 'click', 'payme'],
    smsOnAbsence: true,
    smsOnPayment: true,
    smsPaymentReminder: true,
    features: {
      aiEnabled: true,
      coinsEnabled: true,
      shopEnabled: true,
      smsEnabled: true,
    },
    leadStages: DEFAULT_LEAD_STAGES,
    leadSources: DEFAULT_LEAD_SOURCES,
    freeTrialEnabled: true,
    requireLeadPhone: true,
    autoAssignLeads: true,
    inactiveLeadDays: 14,
    receptionPermissions: {
      canViewFinance: false,
      canViewCashbox: false,
      canManagePayments: true,
      canManageLeads: true,
      canManageTimetable: true,
      canManageGroups: true,
      canManageStudents: true,
      canManageTeachers: true,
    },
  });

  // Query settings
  const { data: serverSettings } = useQuery({
    queryKey: ['manager-settings', user?.id, user?.centerId],
    queryFn: () => api.get('/admin/settings').then(r => r.data?.data || {}),
  });

  // Query reception accounts
  const { data: receptionUsers = [] } = useQuery({
    queryKey: ['reception-users'],
    queryFn: () => api.get('/admin/reception-users').then(r => r.data?.data || []).catch(() => []),
  });

  // Query branches
  const { data: branches = [] } = useQuery({
    queryKey: ['manager-branches-list'],
    queryFn: () => api.get('/admin/branches').then(r => r.data?.data || r.data || []).catch(() => []),
  });

  // CRM Leads interactive local state
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#3B82F6');
  const [newSourceName, setNewSourceName] = useState('');

  // Coin Shop state & queries
  const [shopSubTab, setShopSubTab] = useState('items'); // 'items' | 'orders'
  const [showShopModal, setShowShopModal] = useState(false);
  const [editingShopItem, setEditingShopItem] = useState(null);
  const [shopForm, setShopForm] = useState({
    title: '',
    description: '',
    priceCoins: 50,
    category: 'merch',
    stock: '',
    icon: 'Gift',
    isActive: true,
  });

  const { data: shopItems = [], isLoading: isShopItemsLoading } = useQuery({
    queryKey: ['shop-items'],
    queryFn: () => api.get('/shop/items').then(r => r.data?.data || []),
  });

  const { data: shopOrders = [], isLoading: isShopOrdersLoading } = useQuery({
    queryKey: ['shop-orders-manager'],
    queryFn: () => api.get('/shop/orders').then(r => r.data?.data || []),
  });

  const createShopItemMutation = useMutation({
    mutationFn: (d) => api.post('/shop/items', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop-items'] });
      toast.success("Mahsulot muvaffaqiyatli qo'shildi");
      setShowShopModal(false);
      setEditingShopItem(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Mahsulot qo'shib bo'lmadi"),
  });

  const updateShopItemMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/shop/items/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop-items'] });
      toast.success("Mahsulot ma'lumotlari yangilandi");
      setShowShopModal(false);
      setEditingShopItem(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Yangilab bo'lmadi"),
  });

  const deleteShopItemMutation = useMutation({
    mutationFn: (id) => api.delete(`/shop/items/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop-items'] });
      toast.success("Mahsulot o'chirildi");
    },
    onError: (e) => toast.error(e.response?.data?.message || "O'chirib bo'lmadi"),
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/shop/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop-orders-manager'] });
      qc.invalidateQueries({ queryKey: ['shop-orders-student'] });
      toast.success("Buyurtma holati yangilandi");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Xatolik yuz berdi"),
  });

  useEffect(() => {
    if (serverSettings && typeof serverSettings === 'object') {
      setSettings(prev => ({
        ...prev,
        ...serverSettings,
        features: {
          ...prev.features,
          ...(serverSettings.features || {}),
        },
        leadStages: Array.isArray(serverSettings.leadStages) && serverSettings.leadStages.length > 0
          ? serverSettings.leadStages
          : prev.leadStages,
        leadSources: Array.isArray(serverSettings.leadSources) && serverSettings.leadSources.length > 0
          ? serverSettings.leadSources
          : prev.leadSources,
        receptionPermissions: {
          ...prev.receptionPermissions,
          ...(serverSettings.receptionPermissions || {}),
        },
      }));
    }
  }, [serverSettings]);

  const saveMutation = useMutation({
    mutationFn: (d) => api.put('/admin/settings', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager-settings'] });
      qc.invalidateQueries({ queryKey: ['center-settings'] });
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success('Sozlamalar saqlandi');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xatolik yuz berdi'),
  });

  const createReceptionMutation = useMutation({
    mutationFn: (d) => api.post('/admin/reception-users', d),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['reception-users'] });
      setNewReceptionCreds(data.data?.credentials);
      setReceptionForm({ name: '', phone: '+998 ', branchId: '', password: '' });
      toast.success('Qabulxona hisobi yaratildi');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xatolik'),
  });

  const toggleReceptionStatusMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reception-users'] }),
  });

  const profileMutation = useMutation({
    mutationFn: (d) => api.put('/users/profile', { ...d, phone: cleanPhone(d.phone) }),
    onSuccess: ({ data }) => {
      updateUser(data.data);
      toast.success('Profil ma\'lumotlari saqlandi');
    },
    onError: (err) => toast.error(friendlyAiErrorMessage(err)),
  });

  const passwordMutation = useMutation({
    mutationFn: (d) => api.post('/users/change-password', d),
    onSuccess: () => {
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (err) => toast.error(friendlyAiErrorMessage(err)),
  });

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  const togglePerm = (permKey) => {
    const updated = {
      ...(settings.receptionPermissions || {}),
      [permKey]: !settings.receptionPermissions?.[permKey],
    };
    set('receptionPermissions', updated);
    api.put('/admin/settings', { receptionPermissions: updated })
      .then(() => {
        qc.invalidateQueries({ queryKey: ['manager-settings'] });
        qc.invalidateQueries({ queryKey: ['center-settings'] });
      })
      .catch(() => {});
    toast.success("Ruxsat holati yangilandi");
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Nusxalandi!');
  };

  const isFinanceBlocked =
    settings.receptionPermissions?.canViewFinance === false &&
    settings.receptionPermissions?.canViewCashbox === false;

  const toggleFinanceCashboxBlock = () => {
    const nextBlocked = !isFinanceBlocked;
    const updated = {
      ...(settings.receptionPermissions || {}),
      canViewFinance: !nextBlocked,
      canViewCashbox: !nextBlocked,
    };
    set('receptionPermissions', updated);
    api.put('/admin/settings', { receptionPermissions: updated })
      .then(() => {
        qc.invalidateQueries({ queryKey: ['manager-settings'] });
        qc.invalidateQueries({ queryKey: ['center-settings'] });
      })
      .catch(() => {});
    toast.success(nextBlocked ? "Moliya va Kassa qabulxona uchun bloklandi!" : "Moliya va Kassa qabulxona uchun ochildi!");
  };

  const togglePaymentMethod = (key) => {
    const cur = settings.enabledPaymentMethods || [];
    const next = cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key];
    set('enabledPaymentMethods', next);
  };

  const toggleFeature = (featKey) => {
    const nextVal = !settings.features?.[featKey];
    const updatedFeatures = {
      ...(settings.features || {}),
      [featKey]: nextVal,
    };
    set('features', updatedFeatures);
    api.put('/admin/settings', { features: updatedFeatures })
      .then(() => {
        qc.invalidateQueries({ queryKey: ['manager-settings'] });
        qc.invalidateQueries({ queryKey: ['center-settings'] });
      })
      .catch(() => {});
    toast.success("Imkoniyat holati yangilandi");
  };

  const handleAddStage = () => {
    if (!newStageName.trim()) return toast.error("Bosqich nomini kiriting");
    const id = 'stage_' + Date.now();
    const nextStages = [...(settings.leadStages || []), { id, name: newStageName.trim(), color: newStageColor }];
    set('leadStages', nextStages);
    setNewStageName('');
    toast.success("Yangi bosqich qo'shildi");
  };

  const handleDeleteStage = (stageId) => {
    const nextStages = (settings.leadStages || []).filter(s => (s.id || s.value || s.name) !== stageId);
    set('leadStages', nextStages);
    toast.success("Bosqich o'chirildi");
  };

  const handleAddSource = () => {
    if (!newSourceName.trim()) return toast.error("Manba nomini kiriting");
    const cur = settings.leadSources || [];
    if (cur.includes(newSourceName.trim())) return toast.error("Bu manba allaqachon mavjud");
    set('leadSources', [...cur, newSourceName.trim()]);
    setNewSourceName('');
    toast.success("Yangi manba qo'shildi");
  };

  const handleDeleteSource = (src) => {
    set('leadSources', (settings.leadSources || []).filter(s => s !== src));
    toast.success("Manba o'chirildi");
  };

  const openAddShopModal = () => {
    setEditingShopItem(null);
    setShopForm({
      title: '',
      description: '',
      priceCoins: 50,
      category: 'merch',
      stock: '',
      icon: 'Gift',
      isActive: true,
    });
    setShowShopModal(true);
  };

  const openEditShopModal = (item) => {
    setEditingShopItem(item);
    setShopForm({
      title: item.title,
      description: item.description || '',
      priceCoins: item.priceCoins,
      category: item.category || 'merch',
      stock: item.stock !== null && item.stock !== undefined ? item.stock : '',
      icon: item.icon || 'Gift',
      isActive: item.isActive !== false,
    });
    setShowShopModal(true);
  };

  const handleShopSubmit = (e) => {
    e.preventDefault();
    if (!shopForm.title.trim()) return toast.error("Mahsulot nomini kiriting");
    const coins = parseInt(shopForm.priceCoins, 10);
    if (isNaN(coins) || coins <= 0) return toast.error("Tanga narxi to'g'ri kiritilishi lozim");

    const payload = {
      ...shopForm,
      priceCoins: coins,
      stock: shopForm.stock !== '' && shopForm.stock !== null ? Math.max(0, parseInt(shopForm.stock, 10)) : null,
    };

    if (editingShopItem) {
      updateShopItemMutation.mutate({ id: editingShopItem.id, data: payload });
    } else {
      createShopItemMutation.mutate(payload);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) return toast.error("Barcha maydonlarni to'ldiring");
    if (pwForm.newPassword.length < 6) return toast.error("Yangi parol kamida 6 ta belgidan iborat bo'lsin");
    if (pwForm.newPassword !== pwForm.confirm) return toast.error("Yangi parollar mos kelmadi");
    passwordMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
  };

  return (
    <div className="dashboard-shell">
      <PageHeader
        title="Menejer sozlamalari"
        subtitle="Qabulxona boshqaruvi, filial operatsiyalari, to'lovlar va o'quv jarayoni"
        action={
          <button
            onClick={() => saveMutation.mutate(settings)}
            disabled={saveMutation.isPending}
            className="btn-primary"
          >
            {saved ? (
              <><Check size={16} /> Saqlandi!</>
            ) : saveMutation.isPending ? (
              'Saqlanmoqda...'
            ) : (
              <><Save size={16} /> Saqlash</>
            )}
          </button>
        }
      />

      <div className="settings-shell">
        {/* ── Left Navigation ── */}
        <nav className="settings-nav space-y-0.5">
          {MANAGER_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`settings-nav-item w-full ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                <span className="flex-1 text-left text-sm">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Right Content ── */}
        <div className="min-w-0 space-y-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              {/* TAB 1: QABULXONA (RECEPTION) NAZORATI */}
              {activeTab === 'reception_control' && (
                <div className="space-y-5">
                  {/* 1-Bosishda bloklash banneri */}
                  <div
                    className="p-5 rounded-2xl border transition-all"
                    style={{
                      background: isFinanceBlocked
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)'
                        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
                      borderColor: isFinanceBlocked
                        ? 'rgba(239, 68, 68, 0.25)'
                        : 'rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isFinanceBlocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isFinanceBlocked ? '#ef4444' : '#10b981',
                          }}
                        >
                          {isFinanceBlocked ? <Lock size={22} /> : <Unlock size={22} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-[var(--text-primary)]">
                              Moliya va Kassa xavfsizligi
                            </h3>
                            <span className={`badge text-xs ${isFinanceBlocked ? 'badge-danger' : 'badge-success'}`}>
                              {isFinanceBlocked ? 'Moliya va Kassa yopiq (Bloklangan)' : 'Moliya va Kassa ochiq'}
                            </span>
                          </div>
                          <p className="text-xs mt-1 text-[var(--text-secondary)]">
                            {isFinanceBlocked
                              ? "Qabulxona xodimlari Moliya dashboardi, hisobotlar va Kassani ko'ra olmaydi."
                              : "Qabulxona xodimlariga Moliya va Kassa menyusi va sahifalari ochiq."}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={toggleFinanceCashboxBlock}
                        className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors flex-shrink-0 ${
                          isFinanceBlocked
                            ? 'btn-primary'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                      >
                        {isFinanceBlocked ? (
                          <><Unlock size={16} /> Moliya va Kassaga ruxsat berish</>
                        ) : (
                          <><Lock size={16} /> 1 bosishda bloklash</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Aniq ruxsatlar paneli */}
                  <div className="panel-card space-y-4">
                    <SectionHeader
                      kicker="Ruxsatlar"
                      title="Qabulxona xodimlarining aniq ruxsatlari"
                      subtitle="Har bir amal va bo'lim bo'yicha mustaqil nazorat"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { key: 'canViewFinance', label: 'Moliya sahifasi va hisobotlari', hint: 'Moliya dashboardi, sof daromad, oylik statistika', icon: PieChart, color: '#6366f1' },
                        { key: 'canViewCashbox', label: 'Kassa va naqd tushumlar', hint: 'Kassa qoldig\'i, kirim-chiqimlar va kassa jurnali', icon: Wallet, color: '#10b981' },
                        { key: 'canManagePayments', label: "To'lovlarni qabul qilish", hint: "O'quvchilardan to'lov olish va kvitansiya chiqarish", icon: CreditCard, color: '#f59e0b' },
                        { key: 'canManageLeads', label: 'Lidlar (CRM) bilan ishlash', hint: "Yangi murojaatlarni kiritish, qo'ng'iroqlar va statuslar", icon: Target, color: '#ec4899' },
                        { key: 'canManageTimetable', label: 'Dars jadvali va xonalar', hint: "O'quv xonalari va dars jadvallarini ko'rish", icon: Calendar, color: '#06b6d4' },
                        { key: 'canManageGroups', label: 'Guruhlar ro\'yxati', hint: "Guruhlar, dars kunlari va guruh tarkibini ko'rish", icon: Users, color: '#3b82f6' },
                        { key: 'canManageStudents', label: "O'quvchilar ro'yxati", hint: "O'quvchilar ma'lumotlari va profilini ko'rish", icon: GraduationCap, color: '#8b5cf6' },
                        { key: 'canManageTeachers', label: "O'qituvchilar ro'yxati", hint: "O'qituvchilar va ularning guruhlarini ko'rish", icon: BookMarked, color: '#14b8a6' },
                      ].map((perm) => {
                        const isChecked = settings.receptionPermissions?.[perm.key] !== false;
                        const Icon = perm.icon;
                        return (
                          <div
                            key={perm.key}
                            className="p-3.5 rounded-xl border border-[var(--border)] flex items-center justify-between gap-3"
                            style={{ backgroundColor: 'var(--card)' }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: `${perm.color}15`,
                                  color: perm.color,
                                }}
                              >
                                <Icon size={18} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                                  {perm.label}
                                </div>
                                <div className="text-[11px] text-[var(--text-secondary)] truncate">
                                  {perm.hint}
                                </div>
                              </div>
                            </div>
                            <ToggleSwitch
                              checked={isChecked}
                              onChange={() => togglePerm(perm.key)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Qabulxona xodimlari ro'yxati */}
                  <div className="panel-card space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-[var(--text-primary)]">Qabulxona hisoblari</h3>
                        <p className="text-xs text-[var(--text-secondary)]">Filialingizdagi reception xodimlari</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddReception(true)}
                        className="btn-primary btn-sm flex items-center gap-1.5"
                      >
                        <Plus size={14} /> Hisob qo'shish
                      </button>
                    </div>

                    <div className="table-shell">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Xodim</th>
                            <th>Telefon</th>
                            <th>Filial</th>
                            <th>Holati</th>
                            <th className="text-right">Amal va Sozlamalar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receptionUsers.map((u) => {
                            const isBlocked = !u.isActive || u.isFrozen;
                            return (
                              <tr
                                key={u.id}
                                onClick={() => navigate(`/manager/reception/${u.id}`)}
                                className="cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                              >
                                <td>
                                  <div className="font-semibold text-xs text-[var(--text-primary)] hover:text-primary transition-colors flex items-center gap-1.5">
                                    <span>{u.name}</span>
                                    <ChevronRight size={13} className="text-gray-400" />
                                  </div>
                                  <div className="text-[11px] text-[var(--text-muted)]">@{u.username}</div>
                                </td>
                                <td className="text-xs font-mono text-[var(--text-secondary)]">
                                  {u.phone || '—'}
                                </td>
                                <td className="text-xs text-[var(--text-secondary)]">
                                  {u.branch?.name || (u.branches?.length > 0 ? u.branches.map(b => b.name).join(', ') : 'Umumiy')}
                                </td>
                                <td>
                                  <span className={`badge text-[10px] font-bold px-2 py-0.5 ${isBlocked ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                                    {isBlocked ? 'Bloklangan' : 'Faol'}
                                  </span>
                                </td>
                                <td className="text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/manager/reception/${u.id}`)}
                                      className="btn-outline btn-xs flex items-center gap-1 text-[11px]"
                                      title="Shaxsiy ruxsatlar va profil"
                                    >
                                      <Shield size={12} className="text-primary" />
                                      <span>Profil & Ruxsatlar</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => toggleReceptionStatusMutation.mutate(u.id)}
                                      className={`btn-xs rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${isBlocked ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300'}`}
                                    >
                                      {isBlocked ? 'Faollashtirish' : 'Bloklash'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {receptionUsers.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-xs text-[var(--text-muted)]">
                                Hozircha qabulxona hisoblari mavjud emas. Yuqoridagi "+ Hisob qo'shish" tugmasi orqali yangi hisob yarating.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: MARKAZ IMKONIYATLARI (AI, TANGALAR, DO'KON) */}
              {activeTab === 'features_control' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Imkoniyatlar"
                    title="O'quv markazi imkoniyatlari va modullari"
                    subtitle="Markaz darajasida sun'iy intellekt, tangalar, do'kon va SMS xabarnomalarni yoqing yoki o'chiring"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        key: 'aiEnabled',
                        label: "Sun'iy intellekt (AI) tizimi",
                        hint: "AI dars rejalari, testlar generatsiyasi, uy vazifalarini baholash va AI assistent",
                        icon: Bot,
                        color: '#6366f1',
                      },
                      {
                        key: 'coinsEnabled',
                        label: "Tangalar (Coins) & Gamifikatsiya",
                        hint: "Darslar, testlar va faollik uchun tangalar berish va reyting jadvali",
                        icon: Coins,
                        color: '#f59e0b',
                      },
                      {
                        key: 'shopEnabled',
                        label: "Online Do'kon (Coin Shop)",
                        hint: "O'quvchilar tangalarini markaz esdalik sovg'alari va chegirmalarga almashtirishi",
                        icon: ShoppingBag,
                        color: '#10b981',
                      },
                      {
                        key: 'smsEnabled',
                        label: "Avtomatik SMS xabarnomalar",
                        hint: "Ota-onalar va o'quvchilarga to'lov, dars va eslatmalar bo'yicha SMS yuborish",
                        icon: Smartphone,
                        color: '#3b82f6',
                      },
                    ].map(({ key, label, hint, icon: Icon, color }) => {
                      const isEnabled = settings.features?.[key] !== false;
                      return (
                        <div
                          key={key}
                          className="p-4 rounded-2xl border transition-all flex items-start justify-between gap-4"
                          style={{
                            borderColor: 'var(--border)',
                            backgroundColor: isEnabled ? 'var(--card)' : 'var(--secondary-background)',
                            opacity: isEnabled ? 1 : 0.75,
                          }}
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{
                                backgroundColor: `${color}15`,
                                color: color,
                              }}
                            >
                              <Icon size={20} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-[var(--text-primary)]">
                                {label}
                              </div>
                              <div className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                                {hint}
                              </div>
                              <div className="mt-2.5">
                                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                  isEnabled ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                }`}>
                                  {isEnabled ? 'Faollashtirilgan' : 'O\'chirilgan'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <ToggleSwitch
                            checked={isEnabled}
                            onChange={() => toggleFeature(key)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: FILIAL MA'LUMOTLARI */}
              {activeTab === 'branch_info' && (
                <div className="panel-card space-y-4">
                  <SectionHeader
                    kicker="Filial"
                    title="Filial va Markaz ma'lumotlari"
                    subtitle="Filial manzili, aloqa raqamlari va ish tartibi"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Filial / Markaz nomi</label>
                      <input
                        value={settings.centerName || ''}
                        onChange={(e) => set('centerName', e.target.value)}
                        className="input-field"
                        placeholder="Masalan: Abdora Chilonzor filiali"
                      />
                    </div>

                    <div>
                      <label className="form-label">Aloqa telefoni</label>
                      <PhoneInput
                        value={settings.centerPhone || ''}
                        onChange={(e) => set('centerPhone', e.target.value)}
                        className="input-field font-mono"
                        placeholder="+998 90 123 45 67"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Filial manzili va mo'ljal</label>
                    <input
                      value={settings.centerAddress || ''}
                      onChange={(e) => set('centerAddress', e.target.value)}
                      className="input-field"
                      placeholder="Masalan: Toshkent sh., Chilonzor tumani, 5-mavze, 12-uy"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Ish kunlari va vaqtlari</label>
                      <input
                        value={settings.centerWorkingHours || ''}
                        onChange={(e) => set('centerWorkingHours', e.target.value)}
                        className="input-field"
                        placeholder="Masalan: Dush-Shanba 08:00 — 20:00"
                      />
                    </div>

                    <div>
                      <label className="form-label">Standart dars davomiyligi (daqiqa)</label>
                      <input
                        type="number"
                        min="30"
                        max="240"
                        value={settings.lessonDurationMinutes || 90}
                        onChange={(e) => set('lessonDurationMinutes', Number(e.target.value))}
                        className="input-field font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TO'LOVLAR & QOIDALAR */}
              {activeTab === 'payments' && (
                <div className="panel-card space-y-4">
                  <SectionHeader
                    kicker="Moliya"
                    title="To'lov usullari va Qoidalar"
                    subtitle="Markazda qabul qilinadigan to'lov turlari va to'lov muddati qoidalari"
                  />

                  <div>
                    <label className="form-label mb-2">Qabul qilinadigan to'lov usullari</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { key: 'cash', label: 'Naqd pul', icon: Banknote },
                        { key: 'click', label: 'Click', icon: Smartphone },
                        { key: 'payme', label: 'Payme', icon: CreditCard },
                        { key: 'bank', label: 'Bank o\'tkazmasi', icon: Building2 },
                      ].map((m) => {
                        const Icon = m.icon;
                        const isEnabled = (settings.enabledPaymentMethods || []).includes(m.key);
                        return (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => togglePaymentMethod(m.key)}
                            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                              isEnabled
                                ? 'border-[var(--primary)] bg-[var(--primary-50)] text-[var(--primary)] font-bold'
                                : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--secondary-background)]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon size={16} />
                              <span className="text-xs">{m.label}</span>
                            </div>
                            {isEnabled && <Check size={14} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="form-label">Har oylik to'lov muddati sanasi</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={settings.paymentDueDay || 5}
                        onChange={(e) => set('paymentDueDay', Number(e.target.value))}
                        className="input-field font-mono font-bold"
                        placeholder="5"
                      />
                      <p className="form-hint">Har oyning qaysi sanasigacha o'quvchi to'lov qilishi lozim</p>
                    </div>

                    <div className="pt-2">
                      <SettingRow
                        label="Bo'lib to'lashga ruxsat berish"
                        hint="O'quvchilarga oylik to'lovni 2 yoki 3 ga bo'lib to'lashga ruxsat"
                        noBorder
                      >
                        <ToggleSwitch
                          checked={settings.allowInstallments ?? true}
                          onChange={(v) => set('allowInstallments', v)}
                        />
                      </SettingRow>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LMS & TA'LIM QOIDALARI */}
              {activeTab === 'lms_rules' && (
                <div className="panel-card space-y-4">
                  <SectionHeader
                    kicker="Ta'lim"
                    title="LMS va Dars jarayoni qoidalari"
                    subtitle="Guruh sig'imi, davomat va imtihon me'yorlari"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">Guruhdagi maksimal sig'im</label>
                      <input
                        type="number"
                        min="5"
                        max="40"
                        value={settings.maxStudentsPerGroup || 16}
                        onChange={(e) => set('maxStudentsPerGroup', Number(e.target.value))}
                        className="input-field font-mono font-bold"
                      />
                      <p className="form-hint">Bir guruhga biriktiriladigan maksimal o'quvchilar soni</p>
                    </div>

                    <div>
                      <label className="form-label">Minimal davomat talabi (%)</label>
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={settings.minAttendancePercent || 80}
                        onChange={(e) => set('minAttendancePercent', Number(e.target.value))}
                        className="input-field font-mono font-bold"
                      />
                      <p className="form-hint">Sertifikat berish yoki darajadan o'tish uchun zarur davomat</p>
                    </div>

                    <div>
                      <label className="form-label">Imtihon o'tish bali (%)</label>
                      <input
                        type="number"
                        min="40"
                        max="100"
                        value={settings.passingScorePercent || 60}
                        onChange={(e) => set('passingScorePercent', Number(e.target.value))}
                        className="input-field font-mono font-bold"
                      />
                      <p className="form-hint">Test va oraliq imtihonlardan o'tish minimal chegarasi</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: CRM & LIDLAR */}
              {activeTab === 'crm_leads' && (
                <div className="space-y-5">
                  {/* Bosqichlar (Stages) boshqaruvi */}
                  <div className="panel-card space-y-4">
                    <SectionHeader
                      kicker="CRM Bosqichlari"
                      title="Lid bosqichlari (Funnel / Voronka)"
                      subtitle="Potentsial o'quvchilarning yangi murojaatdan guruhga qo'shilishigacha bo'lgan bosqichlarini sozlang"
                    />

                    <div>
                      <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                        Mavjud bosqichlar ({settings.leadStages?.length || 0})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {(settings.leadStages || DEFAULT_LEAD_STAGES).map((stage, idx) => {
                          const stageId = stage.id || stage.value || stage.name;
                          return (
                            <div
                              key={stageId}
                              className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-between gap-2 shadow-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: stage.color || '#3B82F6' }}
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                                    {stage.name || stage.label}
                                  </div>
                                  <div className="text-[10px] text-[var(--text-muted)] font-mono">
                                    Bosqich #{idx + 1}
                                  </div>
                                </div>
                              </div>

                              {(settings.leadStages?.length || 0) > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStage(stageId)}
                                  className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                  title="Bosqichni o'chirish"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Yangi bosqich qo'shish */}
                    <div className="p-4 rounded-2xl bg-[var(--secondary-background)] border border-[var(--border)] space-y-3">
                      <div className="text-xs font-bold text-[var(--text-primary)]">
                        Yangi bosqich qo'shish
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <input
                          type="text"
                          value={newStageName}
                          onChange={(e) => setNewStageName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddStage();
                            }
                          }}
                          placeholder="Yangi bosqich nomi (masalan: Taklif yuborildi)"
                          className="input-field text-xs flex-1"
                        />

                        {/* Color Selector */}
                        <div className="flex items-center gap-1.5 self-center sm:self-auto">
                          {PRESET_STAGE_COLORS.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewStageColor(c)}
                              className={`w-6 h-6 rounded-full transition-transform ${newStageColor === c ? 'scale-125 ring-2 ring-offset-2 ring-primary' : 'hover:scale-110'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={handleAddStage}
                          className="btn-primary btn-sm whitespace-nowrap flex items-center justify-center gap-1.5"
                        >
                          <Plus size={14} /> Qo'shish
                        </button>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            set('leadStages', DEFAULT_LEAD_STAGES);
                            toast.success("Standart bosqichlar qaytarildi");
                          }}
                          className="text-[11px] text-[var(--text-secondary)] hover:text-primary underline"
                        >
                          Standart bosqichlarga qaytarish
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lid manbalari boshqaruvi */}
                  <div className="panel-card space-y-4">
                    <SectionHeader
                      kicker="Marketing"
                      title="Lid manbalari (Kelib tushish kanallari)"
                      subtitle="Murojaatlarning qaysi reklama va ijtimoiy tarmoqlar orqali kelayotganini tahlil qilish kanallari"
                    />

                    <div>
                      <label className="form-label mb-2">Faol manbalar ro'yxati</label>
                      <div className="flex flex-wrap gap-2">
                        {(settings.leadSources || DEFAULT_LEAD_SOURCES).map((src) => (
                          <div
                            key={src}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--secondary-background)] border border-[var(--border)] text-[var(--text-primary)] shadow-xs"
                          >
                            <span>{src}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSource(src)}
                              className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                              title="Manbani o'chirish"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Yangi manba qo'shish */}
                    <div className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        value={newSourceName}
                        onChange={(e) => setNewSourceName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSource();
                          }
                        }}
                        placeholder="Yangi kanal (masalan: TikTok, Maktab aksiyasi)"
                        className="input-field text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddSource}
                        className="btn-outline btn-sm whitespace-nowrap flex items-center gap-1.5"
                      >
                        <Plus size={14} /> Qo'shish
                      </button>
                    </div>
                  </div>

                  {/* CRM qoidalari va avtomatlashtirish */}
                  <div className="panel-card space-y-4">
                    <SectionHeader
                      kicker="Avtomatlashtirish"
                      title="CRM Qoidalari va tartibi"
                      subtitle="Lidlar bilan ishlashda majburiy talablar va eslatmalar"
                    />

                    <div className="space-y-0 divide-y divide-[var(--border)]">
                      <SettingRow
                        label="Telefon raqam kiritish majburiy"
                        hint="Yangi lid qo'shilayotganda telefon raqami kiritilishi shart"
                      >
                        <ToggleSwitch
                          checked={settings.requireLeadPhone ?? true}
                          onChange={(v) => set('requireLeadPhone', v)}
                        />
                      </SettingRow>

                      <SettingRow
                        label="Bepul sinov darsi taklif qilish"
                        hint="Lid profilida avtomatik sinov darsini rejalashtirish imkoniyati"
                      >
                        <ToggleSwitch
                          checked={settings.freeTrialEnabled ?? true}
                          onChange={(v) => set('freeTrialEnabled', v)}
                        />
                      </SettingRow>

                      <SettingRow
                        label="Lidlarni avtomatik taqsimlash"
                        hint="Yangi kelib tushgan lidlarni mavjud menejerlar o'rtasida teng navbat bilan taqsimlash"
                      >
                        <ToggleSwitch
                          checked={settings.autoAssignLeads ?? true}
                          onChange={(v) => set('autoAssignLeads', v)}
                        />
                      </SettingRow>

                      <SettingRow
                        label="Faolsiz (sovuq) lid muddati (kun)"
                        hint="Ushbu muddat davomida aloqa o'rnatilmagan lidlar avtomatik faolsiz statusiga o'tadi"
                        noBorder
                      >
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={settings.inactiveLeadDays ?? 14}
                          onChange={(e) => set('inactiveLeadDays', Number(e.target.value))}
                          className="input-field w-24 font-mono font-bold text-center"
                        />
                      </SettingRow>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ONLINE DO'KON (COIN SHOP) */}
              {activeTab === 'coin_shop' && (
                <div className="space-y-5">
                  <div className="panel-card space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
                      <div>
                        <span className="panel-kicker">Gamifikatsiya & Tijorat</span>
                        <h2 className="panel-title mt-0.5">Online Do'kon (Coin Shop)</h2>
                        <p className="panel-subtitle mt-1">
                          O'quvchilar yig'ilgan tangalar evaziga sovg'alar va vaucherlar sotib olishi mumkin bo'lgan do'kon
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={openAddShopModal}
                        className="btn-primary flex items-center gap-1.5 self-start sm:self-auto text-xs py-2 px-3.5"
                      >
                        <Plus size={15} /> Yangi mahsulot qo'shish
                      </button>
                    </div>

                    {/* Sub-tab switcher */}
                    <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
                      <button
                        type="button"
                        onClick={() => setShopSubTab('items')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          shopSubTab === 'items'
                            ? 'bg-[var(--primary)] text-white shadow-xs'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--secondary-background)]'
                        }`}
                      >
                        <ShoppingBag size={14} /> Mahsulotlar katalogi ({shopItems.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setShopSubTab('orders')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          shopSubTab === 'orders'
                            ? 'bg-[var(--primary)] text-white shadow-xs'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--secondary-background)]'
                        }`}
                      >
                        <Package size={14} /> O'quvchilar buyurtmalari ({shopOrders.length})
                      </button>
                    </div>

                    {/* Mahsulotlar ro'yxati */}
                    {shopSubTab === 'items' && (
                      <div>
                        {isShopItemsLoading ? (
                          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                            <RefreshCw size={20} className="animate-spin mx-auto mb-2 opacity-50" />
                            Mahsulotlar yuklanmoqda...
                          </div>
                        ) : shopItems.length === 0 ? (
                          <div className="py-12 text-center space-y-2">
                            <ShoppingBag size={36} className="mx-auto text-[var(--text-muted)] opacity-50" />
                            <div className="text-sm font-semibold text-[var(--text-primary)]">Do'konda mahsulot yo'q</div>
                            <p className="text-xs text-[var(--text-secondary)]">
                              Yuqoridagi "Yangi mahsulot qo'shish" tugmasini bosib mahsulotlar kiriting.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                            {shopItems.map((item) => {
                              const Icon = SHOP_ICON_MAP[item.icon] || Gift;
                              return (
                                <div
                                  key={item.id}
                                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                                    item.isActive !== false ? 'border-[var(--border)] bg-[var(--card)]' : 'border-[var(--border)] bg-gray-50/50 dark:bg-gray-900/40 opacity-70'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                      <div className="w-10 h-10 rounded-xl bg-[var(--primary-50)] text-[var(--primary)] flex items-center justify-center flex-shrink-0">
                                        <Icon size={20} />
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className={`badge text-[10px] font-bold px-2 py-0.5 ${
                                          item.isActive !== false ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                          {item.isActive !== false ? 'Faol' : 'Nofaol'}
                                        </span>
                                      </div>
                                    </div>

                                    <h4 className="font-bold text-sm text-[var(--text-primary)] mb-1">
                                      {item.title}
                                    </h4>
                                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">
                                      {item.description || 'Tavsif kiritilmagan'}
                                    </p>
                                  </div>

                                  <div className="pt-3 border-t border-[var(--border)] space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-[var(--text-secondary)]">Narxi:</span>
                                      <span className="font-black text-amber-500 flex items-center gap-1">
                                        <Coins size={14} /> {item.priceCoins} tanga
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-[var(--text-secondary)]">Zaxirada:</span>
                                      <span className="font-semibold text-[var(--text-primary)]">
                                        {item.stock !== null && item.stock !== undefined ? `${item.stock} dona` : 'Cheksiz'}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-end gap-1.5 pt-2">
                                      <button
                                        type="button"
                                        onClick={() => openEditShopModal(item)}
                                        className="btn-outline btn-xs flex items-center gap-1 text-[11px]"
                                        title="Tahrirlash"
                                      >
                                        <Pencil size={12} /> Tahrirlash
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm(`"${item.title}" mahsulotini o'chirishni tasdiqlaysizmi?`)) {
                                            deleteShopItemMutation.mutate(item.id);
                                          }
                                        }}
                                        className="btn-ghost btn-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1 text-[11px]"
                                        title="O'chirish"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Buyurtmalar jurnali */}
                    {shopSubTab === 'orders' && (
                      <div>
                        {isShopOrdersLoading ? (
                          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                            <RefreshCw size={20} className="animate-spin mx-auto mb-2 opacity-50" />
                            Buyurtmalar yuklanmoqda...
                          </div>
                        ) : shopOrders.length === 0 ? (
                          <div className="py-12 text-center space-y-2">
                            <Package size={36} className="mx-auto text-[var(--text-muted)] opacity-50" />
                            <div className="text-sm font-semibold text-[var(--text-primary)]">Hali buyurtmalar yo'q</div>
                            <p className="text-xs text-[var(--text-secondary)]">
                              O'quvchilar tangalar evaziga biror mahsulot sotib olganda, bu yerda aks etadi.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
                                  <th className="py-3 px-3">O'quvchi</th>
                                  <th className="py-3 px-3">Mahsulot</th>
                                  <th className="py-3 px-3">Narxi</th>
                                  <th className="py-3 px-3">Sana</th>
                                  <th className="py-3 px-3">Holat</th>
                                  <th className="py-3 px-3 text-right">Amallar</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border)]">
                                {shopOrders.map((ord) => {
                                  const isPending = ord.status === 'pending';
                                  const isFulfilled = ord.status === 'fulfilled';
                                  const isCancelled = ord.status === 'cancelled';

                                  return (
                                    <tr key={ord.id} className="hover:bg-[var(--secondary-background)] transition-colors">
                                      <td className="py-3 px-3">
                                        <div className="font-bold text-[var(--text-primary)]">
                                          {ord.studentName || 'Noma\'lum o\'quvchi'}
                                        </div>
                                        <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                                          {ord.studentPhone || `@${ord.studentUsername || 'student'}`}
                                        </div>
                                      </td>
                                      <td className="py-3 px-3 font-semibold text-[var(--text-primary)]">
                                        {ord.itemTitle}
                                      </td>
                                      <td className="py-3 px-3">
                                        <span className="font-black text-amber-500 flex items-center gap-1">
                                          <Coins size={13} /> {ord.priceCoins}
                                        </span>
                                      </td>
                                      <td className="py-3 px-3 text-[var(--text-secondary)]">
                                        {new Date(ord.createdAt).toLocaleDateString('uz-UZ', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </td>
                                      <td className="py-3 px-3">
                                        {isPending && (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800">
                                            <Clock size={12} /> Kutilmoqda
                                          </span>
                                        )}
                                        {isFulfilled && (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
                                            <CheckCircle2 size={12} /> Topshirildi
                                          </span>
                                        )}
                                        {isCancelled && (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800">
                                            <X size={12} /> Bekor qilingan
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-3 px-3 text-right">
                                        {isPending && (
                                          <div className="flex items-center justify-end gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => updateOrderStatusMutation.mutate({ id: ord.id, status: 'fulfilled' })}
                                              className="btn-xs rounded-lg px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold flex items-center gap-1"
                                            >
                                              <Check size={12} /> Topshirildi
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (window.confirm("Buyurtmani bekor qilish va tangalarni o'quvchiga qaytarishni tasdiqlaysizmi?")) {
                                                  updateOrderStatusMutation.mutate({ id: ord.id, status: 'cancelled' });
                                                }
                                              }}
                                              className="btn-xs rounded-lg px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 font-medium"
                                            >
                                              Bekor qilish
                                            </button>
                                          </div>
                                        )}
                                        {isFulfilled && (
                                          <span className="text-[11px] text-emerald-600 font-medium">Topshirilgan</span>
                                        )}
                                        {isCancelled && (
                                          <span className="text-[11px] text-rose-500 font-medium">Tangalar qaytarilgan</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: BILDIRISHNOMALAR (SMS) */}
              {activeTab === 'notifications' && (
                <div className="panel-card space-y-4">
                  <SectionHeader
                    kicker="SMS"
                    title="Avtomatik SMS xabarnomalar tartibi"
                    subtitle="Ota-onalar va o'quvchilarga boradigan eslatmalar"
                  />

                  <div className="space-y-1">
                    <SettingRow
                      label="O'quvchi dars qoldirganda avtomatik SMS"
                      hint="Davomatda 'kelmadi' deb belgilanganda ota-ona telefoniga xabar yuborish"
                    >
                      <ToggleSwitch
                        checked={settings.smsOnAbsence ?? true}
                        onChange={(v) => set('smsOnAbsence', v)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="To'lov olinganda SMS kvitansiya"
                      hint="Har bir to'lov amalga oshirilganda tasdiq SMS-chek yuborish"
                    >
                      <ToggleSwitch
                        checked={settings.smsOnPayment ?? true}
                        onChange={(v) => set('smsOnPayment', v)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Oylik to'lov muddati yaqinlashganda eslatma"
                      hint="To'lov muddatiga 2 kun qolganda eslatuvchi SMS yuborish"
                      noBorder
                    >
                      <ToggleSwitch
                        checked={settings.smsPaymentReminder ?? true}
                        onChange={(v) => set('smsPaymentReminder', v)}
                      />
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* TAB 7: MENING HISOBIM & KO'RINISH */}
              {activeTab === 'personal' && (
                <div className="space-y-5">
                  <div className="panel-card space-y-4">
                    <SectionHeader
                      kicker="Profil"
                      title="Menejer shaxsiy ma'lumotlari"
                      subtitle="Ism va aloqa telefoningizni boshqaring"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">To'liq ismingiz</label>
                        <input
                          value={profileForm.name}
                          onChange={(e) => setProfileForm(f => ({ ...f, name: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="form-label">Telefon raqamingiz</label>
                        <PhoneInput
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                          className="input-field font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => profileMutation.mutate(profileForm)}
                        disabled={profileMutation.isPending}
                        className="btn-primary btn-sm"
                      >
                        {profileMutation.isPending ? 'Saqlanmoqda...' : 'Profilni saqlash'}
                      </button>
                    </div>
                  </div>

                  {/* Parol o'zgartirish */}
                  <div className="panel-card space-y-4">
                    <SectionHeader
                      kicker="Xavfsizlik"
                      title="Menejer parolini yangilash"
                      subtitle="Tizim xavfsizligini ta'minlash uchun kuchli parol belgilang"
                    />

                    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                      <div>
                        <label className="form-label">Joriy parol</label>
                        <input
                          type="password"
                          value={pwForm.currentPassword}
                          onChange={(e) => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="form-label">Yangi parol</label>
                        <input
                          type="password"
                          value={pwForm.newPassword}
                          onChange={(e) => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="form-label">Yangi parolni tasdiqlang</label>
                        <input
                          type="password"
                          value={pwForm.confirm}
                          onChange={(e) => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                          className="input-field"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={passwordMutation.isPending}
                        className="btn-primary btn-sm flex items-center gap-1.5"
                      >
                        <KeyRound size={14} />
                        {passwordMutation.isPending ? 'Yangilanmoqda...' : 'Parolni yangilash'}
                      </button>
                    </form>
                  </div>

                  {/* Tezkor mavzu sozlamasi */}
                  <div className="panel-card space-y-3">
                    <SectionHeader
                      kicker="Interfeys"
                      title="Tizim ko'rinishi va Mavzular"
                      subtitle="Ranglar palitrasi va tayyor dizayn mavzularini tanlash"
                    />
                    <p className="text-xs text-[var(--text-secondary)]">
                      Tizim mavzusi va ranglarini to'liq moslashtirish uchun maxsus "Mavzular & Ko'rinish" bo'limiga o'tishingiz mumkin.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('themes')}
                      className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-2 max-w-fit"
                    >
                      <Palette size={14} /> Mavzular bo'limiga o'tish
                    </button>
                  </div>
                </div>
              )}

              {/* ═══════════════ MAVZULAR & KO'RINISH ═══════════════ */}
              {activeTab === 'themes' && (
                <div className="panel-card space-y-6">
                  <SectionHeader
                    kicker="Interfeys & Dizayn"
                    title="Mavzular va Ko'rinish sozlamalari"
                    subtitle="Tizim mavzulari, ranglar konstruktori va interfeys moslashuvi"
                  />
                  <ThemeBuilder embedded />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* MODAL: CREATE RECEPTION ACCOUNT */}
      <AnimatePresence>
        {showAddReception && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && setShowAddReception(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="modal-panel max-w-md p-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Qabulxona xodimi qo'shish</h3>
                <button
                  type="button"
                  onClick={() => { setShowAddReception(false); setNewReceptionCreds(null); }}
                  className="btn-icon"
                >
                  <X size={16} />
                </button>
              </div>

              {newReceptionCreds ? (
                <div className="space-y-4 pt-4">
                  <div className="p-4 rounded-xl text-center bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                    <Check size={32} className="mx-auto text-emerald-500 mb-1.5" />
                    <h4 className="font-bold text-sm text-emerald-700 dark:text-emerald-300">Qabulxona hisobi yaratildi!</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Ushbu login va parolni xodimga taqdim eting.</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--secondary-background)] space-y-2.5">
                    {[
                      ['Login', newReceptionCreds.username],
                      ['Parol', newReceptionCreds.password],
                    ].map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between">
                        <div>
                          <div className="text-[11px] text-[var(--text-muted)]">{label}</div>
                          <div className="font-mono font-bold text-sm text-[var(--text-primary)]">{val}</div>
                        </div>
                        <button onClick={() => copy(val)} className="btn-icon" title="Nusxalash">
                          <Copy size={14} className="text-[var(--primary)]" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setShowAddReception(false); setNewReceptionCreds(null); }}
                    className="btn-primary w-full justify-center"
                  >
                    Tushunarli
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="form-label">Xodim ismi *</label>
                    <input
                      value={receptionForm.name}
                      onChange={(e) => setReceptionForm(f => ({ ...f, name: e.target.value }))}
                      className="input-field"
                      placeholder="Masalan: Malika Karimova"
                    />
                  </div>

                  <div>
                    <label className="form-label">Telefon raqami</label>
                    <PhoneInput
                      value={receptionForm.phone}
                      onChange={(e) => setReceptionForm(f => ({ ...f, phone: e.target.value }))}
                      className="input-field font-mono"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>

                  {branches.length > 0 && (
                    <div>
                      <label className="form-label">Biriktiriladigan filial</label>
                      <select
                        value={receptionForm.branchId}
                        onChange={(e) => setReceptionForm(f => ({ ...f, branchId: e.target.value }))}
                        className="input-field"
                      >
                        <option value="">Standart filial</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setShowAddReception(false)}
                      className="btn-ghost btn-sm"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="button"
                      disabled={!receptionForm.name || createReceptionMutation.isPending}
                      onClick={() => createReceptionMutation.mutate({
                        ...receptionForm,
                        phone: cleanPhone(receptionForm.phone),
                      })}
                      className="btn-primary btn-sm"
                    >
                      {createReceptionMutation.isPending ? 'Yaratilmoqda...' : 'Yaratish'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Shop Item Add/Edit Modal ── */}
      <Modal
        open={showShopModal}
        onClose={() => {
          setShowShopModal(false);
          setEditingShopItem(null);
        }}
        title={editingShopItem ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
        subtitle="Tangalarga almashtiriladigan mahsulot ma'lumotlarini kiriting"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setShowShopModal(false);
                setEditingShopItem(null);
              }}
              className="btn-ghost"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleShopSubmit}
              disabled={createShopItemMutation.isPending || updateShopItemMutation.isPending || !shopForm.title.trim()}
              className="btn-primary flex items-center gap-1.5"
            >
              <Check size={14} />
              {editingShopItem ? 'Saqlash' : 'Qo\'shish'}
            </button>
          </>
        }
      >
        <form onSubmit={handleShopSubmit} className="space-y-4">
          <div>
            <label className="form-label">Mahsulot nomi *</label>
            <input
              type="text"
              value={shopForm.title}
              onChange={(e) => setShopForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Masalan: Abdora AI Futbolkasi"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="form-label">Qisqacha tavsifi</label>
            <textarea
              value={shopForm.description}
              onChange={(e) => setShopForm(f => ({ ...f, description: e.target.value }))}
              placeholder="O'lchamlari, rangi va boshqa xususiyatlari..."
              className="input-field resize-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Narxi (tangada) *</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={shopForm.priceCoins}
                  onChange={(e) => setShopForm(f => ({ ...f, priceCoins: e.target.value }))}
                  className="input-field font-mono font-bold pr-14"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] font-semibold">
                  tanga
                </span>
              </div>
            </div>

            <div>
              <label className="form-label">Ombordagi miqdor (zaxira)</label>
              <input
                type="number"
                min="0"
                value={shopForm.stock}
                onChange={(e) => setShopForm(f => ({ ...f, stock: e.target.value }))}
                placeholder="Bo'sh qolsa — cheksiz"
                className="input-field font-mono"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Bo'sh qoldirilsa zaxira cheksiz bo'ladi</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Kategoriya</label>
              <select
                value={shopForm.category}
                onChange={(e) => setShopForm(f => ({ ...f, category: e.target.value }))}
                className="input-field"
              >
                <option value="merch">Brendli buyumlar (Merch)</option>
                <option value="book">Kitoblar & Darsliklar</option>
                <option value="discount">Chegirma vaucheri</option>
                <option value="other">Boshqa sovg'alar</option>
              </select>
            </div>

            <div>
              <label className="form-label">Belgisi (Icon)</label>
              <select
                value={shopForm.icon}
                onChange={(e) => setShopForm(f => ({ ...f, icon: e.target.value }))}
                className="input-field"
              >
                <option value="Shirt">Futbolka / Kiyim (Shirt)</option>
                <option value="BookOpen">Kitob / Qo'llanma (BookOpen)</option>
                <option value="Sparkles">Stiker / Yaltiroq (Sparkles)</option>
                <option value="Tag">Chegirma vaucheri (Tag)</option>
                <option value="Pencil">Ruchka / Bloknot (Pencil)</option>
                <option value="Gift">Umumiy sovg'a (Gift)</option>
                <option value="Package">Quti / To'plam (Package)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <SettingRow
              label="Sotuvda faol"
              hint="O'quvchilar bu mahsulotni ko'rishi va xarid qilishi mumkin"
              noBorder
            >
              <ToggleSwitch
                checked={shopForm.isActive}
                onChange={(v) => setShopForm(f => ({ ...f, isActive: v }))}
              />
            </SettingRow>
          </div>
        </form>
      </Modal>
    </div>
  );
}
