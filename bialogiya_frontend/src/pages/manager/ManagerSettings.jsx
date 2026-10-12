import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Shield, Building2, CreditCard, BookOpen, Target, Bell, User,
  Lock, Unlock, PieChart, Wallet, Calendar, Users, GraduationCap,
  BookMarked, Plus, X, Pencil, Trash2, Copy, Save, Check, KeyRound,
  Palette, Smartphone, Banknote, ChevronRight,
  Sparkles, ShoppingBag, Tag, Gift, Shirt, Package, Clock, CheckCircle2, Coins,
  RefreshCw, AlertCircle, Layers, Bot, Key, Eye, EyeOff, Cpu
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import PageHeader from '../../components/ui/PageHeader';
import PhoneInput from '../../components/ui/PhoneInput';
import Modal from '../../components/ui/Modal';
import { cleanPhone } from '../../utils/formatPhone';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import ThemeBuilder from '../../components/ui/ThemeBuilder';

const MANAGER_NAV_ITEMS = [
  { id: 'reception_control', label: 'Qabulxona (Reception)',         icon: ShieldCheck },
  { id: 'branch_info',       label: 'Filial ma\'lumotlari',          icon: Building2 },
  { id: 'payments',          label: 'To\'lovlar & Qoidalar',         icon: CreditCard },
  { id: 'lms_rules',         label: 'LMS & Baholash (Coin)',         icon: BookOpen },
  { id: 'course_levels',     label: 'Kurs Darajalari (Mahsulotlar)',   icon: Layers },
  { id: 'ai_agent',          label: 'AI Sozlamalari & Model',        icon: Bot },
  { id: 'crm_leads',         label: 'CRM & Lidlar sozlamasi',        icon: Target },
  { id: 'coin_shop',         label: 'Online Do\'kon (Coin Shop)',    icon: ShoppingBag },
  { id: 'notifications',     label: 'Bildirishnomalar (SMS)',        icon: Bell },
  { id: 'themes',            label: 'Mavzular & Ko\'rinish',         icon: Palette },
  { id: 'personal',          label: 'Mening hisobim & Parol',        icon: User },
];

const AI_MODEL_OPTIONS = [
  { group: "Google Gemini (Tavsiya)", options: [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Tezkor va standart tavsiya)", badge: "Tavsiya" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Chuqur fikrlash va katta kontekst)" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Tez va yengil)" },
  ]},
  { group: "OpenAI", options: [
    { value: "gpt-4o", label: "GPT-4o (Omni — Asosiy model)", badge: "Tavsiya" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini (Tezkor va tejamkor)" },
    { value: "o3-mini", label: "o3-mini (Murakkab fikrlash)" },
  ]},
  { group: "Anthropic Claude", options: [
    { value: "claude-3-7-sonnet", label: "Claude 3.7 Sonnet (Eng so'nggi flagman)", badge: "Yangi" },
    { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet (A'lo darajada matn va kod)" },
    { value: "claude-3-5-haiku", label: "Claude 3.5 Haiku (Tezkor)" },
  ]},
];

const DEFAULT_COURSE_LEVELS = [
  { id: 'level_beginner', name: "Boshlang'ich (Beginner)", description: "Boshlang'ich bilim va poydevor darajasi", defaultFee: 400000, teacherIds: [] },
  { id: 'level_elementary', name: "O'rta (Intermediate)", description: "Asosiy o'rta daraja, chuqurlashtirilgan bilimlar", defaultFee: 450000, teacherIds: [] },
  { id: 'level_advanced', name: "Yuqori (Advanced)", description: "Yuqori murakkablikdagi bosqich", defaultFee: 500000, teacherIds: [] },
  { id: 'level_dtm', name: "DTM / Imtihonga tayyorlov", description: "OTM kirish imtihonlari va testlariga tayyorlov", defaultFee: 550000, teacherIds: [] },
  { id: 'level_cert', name: "Milliy sertifikat / CEFR", description: "Milliy sertifikat va xalqaro imtihonlar", defaultFee: 600000, teacherIds: [] },
  { id: 'level_intensive', name: "Intensiv / Tezlashtirilgan", description: "Qisqa muddatli tezkor darslar", defaultFee: 650000, teacherIds: [] },
];

const DEFAULT_GRADE_SETTINGS = {
  minGrade: 1,
  maxGrade: 10,
  coinDeductionEnabled: true,
  deductCoinsOnAbsent: 5,
  deductCoinsOnLowGrade: 3,
  lowGradeThreshold: 4,
  awardCoinsOnHighGrade: 5,
  highGradeThreshold: 8,
  coinsPerGrade: {
    1: -5,
    2: -4,
    3: -3,
    4: -2,
    5: 0,
    6: 1,
    7: 2,
    8: 3,
    9: 4,
    10: 5,
  },
};

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
    courseLevels: DEFAULT_COURSE_LEVELS,
    aiConfig: {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      liveModel: 'gemini-2.5-flash-native-audio-preview',
      agentId: '',
      apiKey: '',
      customPrompt: '',
    },
  });

  // Query settings
  const { data: serverSettings } = useQuery({
    queryKey: ['manager-settings', user?.id, user?.centerId],
    queryFn: () => api.get('/admin/settings').then(r => r.data?.data || {}),
  });

  // Query reception accounts
  const { data: receptionUsers = [] } = useQuery({
    queryKey: ['admin-reception'],
    queryFn: () => api.get('/admin/reception').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }).catch(() => []),
  });

  // Query branches
  const { data: branches = [] } = useQuery({
    queryKey: ['manager-branches-list'],
    queryFn: () => api.get('/admin/branches').then(r => r.data?.data || r.data || []).catch(() => []),
  });

  // Query teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['all-teachers'],
    queryFn: () => api.get('/admin/teachers').then(r => r.data?.data || r.data || []).catch(() => []),
  });

  // Query groups
  const { data: groups = [] } = useQuery({
    queryKey: ['manager-groups', user?.centerId],
    queryFn: () => api.get('/groups/all').then(r => r.data?.data || r.data || []).catch(() => []),
  });

  // Course Levels state & handlers
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [levelForm, setLevelForm] = useState({
    id: '',
    name: '',
    description: '',
    defaultFee: 400000,
    teacherIds: [],
  });

  const openCreateLevel = () => {
    setEditingLevel(null);
    setLevelForm({
      id: `level_${Date.now()}`,
      name: '',
      description: '',
      defaultFee: 450000,
      teacherIds: [],
    });
    setShowLevelModal(true);
  };

  const openEditLevel = (lvl) => {
    setEditingLevel(lvl);
    setLevelForm({
      id: lvl.id || `level_${Date.now()}`,
      name: lvl.name || '',
      description: lvl.description || '',
      defaultFee: lvl.defaultFee || 400000,
      teacherIds: Array.isArray(lvl.teacherIds) ? [...lvl.teacherIds] : [],
    });
    setShowLevelModal(true);
  };

  const handleSaveLevel = (e) => {
    e.preventDefault();
    if (!levelForm.name.trim()) return toast.error("Daraja nomini kiriting");
    const currentList = Array.isArray(settings.courseLevels) && settings.courseLevels.length > 0
      ? settings.courseLevels
      : DEFAULT_COURSE_LEVELS;
    let nextList;
    if (editingLevel) {
      nextList = currentList.map(l => (l.id === editingLevel.id || l.name === editingLevel.name) ? { ...levelForm, name: levelForm.name.trim() } : l);
    } else {
      nextList = [...currentList, { ...levelForm, name: levelForm.name.trim() }];
    }
    set('courseLevels', nextList);
    api.put('/admin/settings', { courseLevels: nextList })
      .then(() => {
        qc.invalidateQueries({ queryKey: ['manager-settings'] });
        qc.invalidateQueries({ queryKey: ['center-settings'] });
        qc.invalidateQueries({ queryKey: ['admin-settings'] });
        toast.success("Kurs darajasi saqlandi");
      })
      .catch(() => toast.error("Saqlashda xatolik yuz berdi"));
    setShowLevelModal(false);
    setEditingLevel(null);
  };

  const handleDeleteLevel = (lvl) => {
    if (!window.confirm(`"${lvl.name}" darajasini o'chirishni tasdiqlaysizmi?`)) return;
    const currentList = Array.isArray(settings.courseLevels) && settings.courseLevels.length > 0
      ? settings.courseLevels
      : DEFAULT_COURSE_LEVELS;
    const nextList = currentList.filter(l => l.id !== lvl.id && l.name !== lvl.name);
    set('courseLevels', nextList);
    api.put('/admin/settings', { courseLevels: nextList })
      .then(() => {
        qc.invalidateQueries({ queryKey: ['manager-settings'] });
        qc.invalidateQueries({ queryKey: ['center-settings'] });
        qc.invalidateQueries({ queryKey: ['admin-settings'] });
        toast.success("Daraja o'chirildi");
      })
      .catch(() => toast.error("O'chirishda xatolik yuz berdi"));
  };

  // AI Agents state & queries
  const { data: aiAgents = [], refetch: refetchAiAgents } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: () => api.get('/admin/ai-agents').then(r => r.data?.data || []).catch(() => []),
  });
  const [showAiApiKey, setShowAiApiKey] = useState(false);
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [newAgentForm, setNewAgentForm] = useState({
    name: '',
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-2.5-flash',
  });

  const createAgentMutation = useMutation({
    mutationFn: (data) => api.post('/admin/ai-agents', data),
    onSuccess: (res) => {
      const newAgent = res.data?.data;
      toast.success("Yangi AI Agent yaratildi va biriktirildi!");
      qc.invalidateQueries({ queryKey: ['ai-agents'] });
      if (newAgent?.id) {
        const nextAiConfig = {
          ...(settings.aiConfig || {}),
          agentId: newAgent.id,
          provider: newAgent.provider || 'gemini',
          model: newAgent.model || 'gemini-2.5-flash',
          apiKey: newAgent.apiKey || '',
        };
        set('aiConfig', nextAiConfig);
        api.put('/admin/settings', { aiConfig: nextAiConfig })
          .then(() => {
            qc.invalidateQueries({ queryKey: ['manager-settings'] });
            qc.invalidateQueries({ queryKey: ['center-settings'] });
          })
          .catch(() => {});
      }
      setShowCreateAgentModal(false);
      setNewAgentForm({ name: '', provider: 'gemini', apiKey: '', model: 'gemini-2.5-flash' });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Agent yaratishda xatolik yuz berdi"),
  });

  const handleSelectAgent = (agentId) => {
    const selected = aiAgents.find(a => a.id === agentId);
    let nextAiConfig;
    if (selected) {
      nextAiConfig = {
        ...(settings.aiConfig || {}),
        agentId,
        provider: selected.provider || 'gemini',
        model: selected.model || settings.aiConfig?.model || 'gemini-2.5-flash',
        apiKey: selected.apiKey || settings.aiConfig?.apiKey || '',
      };
    } else {
      nextAiConfig = {
        ...(settings.aiConfig || {}),
        agentId: '',
      };
    }
    set('aiConfig', nextAiConfig);
    api.put('/admin/settings', { aiConfig: nextAiConfig })
      .then(() => {
        qc.invalidateQueries({ queryKey: ['manager-settings'] });
        qc.invalidateQueries({ queryKey: ['center-settings'] });
        toast.success(agentId ? "AI Agent markazga biriktirildi!" : "Shaxsiy sozlamalarga o'tildi");
      })
      .catch(() => toast.error("Sozlamani saqlashda xatolik yuz berdi"));
  };

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

  // Baho va Coin (Tangalar) sozlamalari (Faqat Manager va Admin uchun)
  const { data: serverGradeSettings = DEFAULT_GRADE_SETTINGS } = useQuery({
    queryKey: ['attendance-settings'],
    queryFn: () => api.get('/attendance/settings').then(r => r.data?.data || DEFAULT_GRADE_SETTINGS).catch(() => DEFAULT_GRADE_SETTINGS),
  });

  const [gradeSettings, setGradeSettings] = useState(DEFAULT_GRADE_SETTINGS);

  useEffect(() => {
    if (serverGradeSettings) {
      setGradeSettings({
        ...DEFAULT_GRADE_SETTINGS,
        ...serverGradeSettings,
        coinsPerGrade: {
          ...DEFAULT_GRADE_SETTINGS.coinsPerGrade,
          ...(serverGradeSettings.coinsPerGrade || {}),
        },
      });
    }
  }, [serverGradeSettings]);

  const saveGradeSettingsMutation = useMutation({
    mutationFn: (newSettings) => api.put('/attendance/settings', newSettings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-settings'] });
      toast.success('Baho va coin qoidalari muvaffaqiyatli saqlandi');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Sozlamalarni saqlashda xatolik yuz berdi'),
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
        courseLevels: Array.isArray(serverSettings.courseLevels) && serverSettings.courseLevels.length > 0
          ? serverSettings.courseLevels
          : prev.courseLevels || DEFAULT_COURSE_LEVELS,
        aiConfig: {
          ...prev.aiConfig,
          ...(serverSettings.aiConfig || {}),
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
    mutationFn: (d) => api.post('/admin/reception', d),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['admin-reception'] });
      qc.invalidateQueries({ queryKey: ['reception-users'] });
      setNewReceptionCreds(data.data?.credentials);
      setReceptionForm({ name: '', phone: '+998 ', branchId: '', password: '' });
      toast.success('Qabulxona hisobi yaratildi');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xatolik'),
  });

  const toggleReceptionStatusMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/reception/${id}/toggle-status`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reception'] });
      qc.invalidateQueries({ queryKey: ['reception-users'] });
    },
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
                <div className="space-y-5">
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

                  {/* Baho va Coinlarni tenglashtirish qoidalari (Faqat Menejer uchun) */}
                  <div className="panel-card space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
                      <div>
                        <span className="panel-kicker text-amber-600 dark:text-amber-400">Gamifikatsiya & Iqtisodiyot</span>
                        <h2 className="panel-title mt-0.5 flex items-center gap-2">
                          <Coins className="w-5 h-5 text-amber-500" />
                          <span>Baho va Tangalarni (Coin) Tenglash Qoidalari</span>
                        </h2>
                        <p className="panel-subtitle mt-1">
                          O'qituvchilar darsda qo'yadigan 1 dan 10 gacha baholarga tanga berish yoki ayirish me'yorlarini belgilang
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => saveGradeSettingsMutation.mutate(gradeSettings)}
                        disabled={saveGradeSettingsMutation.isPending}
                        className="btn-primary text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm self-start sm:self-auto"
                      >
                        <Save className="w-4 h-4" />
                        <span>{saveGradeSettingsMutation.isPending ? "Saqlanmoqda..." : "Coin qoidalarini saqlash"}</span>
                      </button>
                    </div>

                    {/* Tangalarni ayirish tizimi (Global Switch) */}
                    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                          <Coins className="w-4 h-4 text-amber-500" />
                          <span>Davomatda tangalarni hisoblash va ayirish tizimi</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          Agar yoqilgan bo'lsa, darsga kelmagan yoki past baho olgan o'quvchilardan tanga ayriladi, a'lo baholarga esa tanga qo'shiladi. O'chirilsa, faqat musbat tangalar beriladi.
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={gradeSettings.coinDeductionEnabled}
                        onChange={(v) => setGradeSettings(prev => ({ ...prev, coinDeductionEnabled: v }))}
                      />
                    </div>

                    {/* Umumiy chegara me'yorlari */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                        <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                          Darsga kelmaganda (Yo'q) ayirish:
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-red-500">-</span>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={gradeSettings.deductCoinsOnAbsent ?? 5}
                            disabled={!gradeSettings.coinDeductionEnabled}
                            onChange={(e) => setGradeSettings(prev => ({ ...prev, deductCoinsOnAbsent: Number(e.target.value) || 0 }))}
                            className="input-field font-mono font-bold text-sm"
                          />
                          <span className="text-xs text-[var(--text-secondary)]">tanga</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-1.5">Sababsiz qoldirilgan dars uchun jazo</p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                        <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                          Past baho chegarasi (≤):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={gradeSettings.lowGradeThreshold ?? 4}
                            disabled={!gradeSettings.coinDeductionEnabled}
                            onChange={(e) => setGradeSettings(prev => ({ ...prev, lowGradeThreshold: Number(e.target.value) || 4 }))}
                            className="input-field font-mono font-bold text-sm"
                          />
                          <span className="text-xs text-[var(--text-secondary)]">baho</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-1.5">Shu baho va undan pastida tanga ayriladi</p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                        <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                          A'lo baho chegarasi (≥):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="6"
                            max="10"
                            value={gradeSettings.highGradeThreshold ?? 8}
                            onChange={(e) => setGradeSettings(prev => ({ ...prev, highGradeThreshold: Number(e.target.value) || 8 }))}
                            className="input-field font-mono font-bold text-sm"
                          />
                          <span className="text-xs text-[var(--text-secondary)]">baho</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-1.5">Shu baho va undan yuqorisiga rag'bat beriladi</p>
                      </div>
                    </div>

                    {/* 1 dan 10 gacha har bir bahoni coinga tenglashtirish jadvali */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center justify-between">
                        <span>1 dan 10 gacha har bir bahoga beriladigan / ayiriladigan tangalar</span>
                        <span className="text-[11px] font-normal normal-case text-amber-600 dark:text-amber-400">Musbat (+) tanga beradi, Manfiy (-) tanga ayiradi</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                          const currentVal = gradeSettings.coinsPerGrade?.[num] !== undefined
                            ? gradeSettings.coinsPerGrade[num]
                            : (num <= 4 ? -(5 - num) : num >= 8 ? (num - 5) : 0);
                          const isNegative = currentVal < 0;
                          const isPositive = currentVal > 0;

                          return (
                            <div
                              key={num}
                              className={`p-3 rounded-xl border transition-all ${
                                isPositive
                                  ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20'
                                  : isNegative
                                  ? 'border-red-200 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20'
                                  : 'border-[var(--border)] bg-[var(--card)]'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]">
                                  {num} baho
                                </span>
                                <span className={`text-[11px] font-semibold ${
                                  isPositive ? 'text-emerald-600 dark:text-emerald-400' : isNegative ? 'text-red-500' : 'text-gray-400'
                                }`}>
                                  {isPositive ? `+${currentVal}` : currentVal}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="-50"
                                  max="50"
                                  value={currentVal}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10) || 0;
                                    setGradeSettings(prev => ({
                                      ...prev,
                                      coinsPerGrade: {
                                        ...(prev.coinsPerGrade || {}),
                                        [num]: val,
                                      },
                                    }));
                                  }}
                                  className="input-field text-center font-mono font-bold text-xs py-1 px-2"
                                />
                                <span className="text-[11px] text-[var(--text-secondary)]">coin</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <div>
                        <strong>Eslatma:</strong> O'qituvchi o'z kabinetida faqat davomatni belgilaydi va 1 dan 10 gacha baho qo'yadi. Ushbu qoidalarni o'zgartirish huquqi <strong>faqat markaz menejeri</strong> uchun ochiq.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: KURS DARAJALARI VA MAHSULOTLAR */}
              {activeTab === 'course_levels' && (
                <div className="space-y-5">
                  {/* Header & Statistika */}
                  <div className="panel-card space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
                      <div>
                        <span className="panel-kicker text-indigo-600 dark:text-indigo-400">O'quv Mahsulotlari</span>
                        <h2 className="panel-title mt-0.5 flex items-center gap-2">
                          <Layers className="w-5 h-5 text-indigo-500" />
                          <span>Markaz Kurs Darajalari va Mahsulotlari</span>
                        </h2>
                        <p className="panel-subtitle mt-1">
                          Guruhlar ochishda ishlatiladigan bosqichlar, tavsiya etilgan oylik to'lovlar va har bir darajaga biriktirilgan o'qituvchilar
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={openCreateLevel}
                        className="btn-primary text-xs px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 self-start sm:self-auto shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Yangi daraja qo'shish</span>
                      </button>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                          <Layers size={20} />
                        </div>
                        <div>
                          <div className="text-xl font-extrabold text-[var(--text-primary)]">
                            {(settings.courseLevels || DEFAULT_COURSE_LEVELS).length} ta
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">Faol kurs darajalari</div>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                          <Users size={20} />
                        </div>
                        <div>
                          <div className="text-xl font-extrabold text-[var(--text-primary)]">
                            {teachers.length} nafar
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">Markaz o'qituvchilari</div>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <div className="text-xl font-extrabold text-[var(--text-primary)]">
                            {groups.length} ta
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">Mavjud guruhlar</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Levels Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(settings.courseLevels || DEFAULT_COURSE_LEVELS).map((lvl) => {
                      const assignedTeachers = teachers.filter(t => (lvl.teacherIds || []).includes(t.id));
                      const activeGroupsCount = groups.filter(g => g.level?.toLowerCase() === lvl.name?.toLowerCase()).length;
                      return (
                        <div
                          key={lvl.id || lvl.name}
                          className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-indigo-400/40 transition-all space-y-3 relative group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                <Layers size={18} />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
                                  {lvl.name}
                                </h3>
                                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                  {lvl.defaultFee ? `${Number(lvl.defaultFee).toLocaleString()} so'm / oy` : "To'lov belgilanmagan"}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditLevel(lvl)}
                                className="btn-ghost p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                title="Tahrirlash"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLevel(lvl)}
                                className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                                title="O'chirish"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {lvl.description && (
                            <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                              {lvl.description}
                            </p>
                          )}

                          {/* Assigned teachers info */}
                          <div className="pt-2 border-t border-[var(--border)] text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-medium">
                              <span>Dars beruvchi o'qituvchilar:</span>
                              <span className="font-semibold text-[var(--text-primary)]">{activeGroupsCount} ta guruh faol</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {assignedTeachers.length > 0 ? (
                                assignedTeachers.map(t => (
                                  <span
                                    key={t.id}
                                    className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold flex items-center gap-1"
                                  >
                                    <User size={10} />
                                    {t.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-[var(--text-muted)] italic">
                                  Barcha o'qituvchilar dars berishi mumkin
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: AI SOZLAMALARI VA MODEL */}
              {activeTab === 'ai_agent' && (
                <div className="space-y-5">
                  <div className="panel-card space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
                      <div>
                        <span className="panel-kicker text-purple-600 dark:text-purple-400">Sun'iy Intellekt Dvigateli</span>
                        <h2 className="panel-title mt-0.5 flex items-center gap-2">
                          <Bot className="w-5 h-5 text-purple-500" />
                          <span>AI Sozlamalari & Model</span>
                        </h2>
                        <p className="panel-subtitle mt-1">
                          Markazingiz darslari, topshiriqlari va testlari uchun AI modeli hamda shaxsiy API kalitini boshqaring
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCreateAgentModal(true)}
                        className="btn-primary text-xs px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 self-start sm:self-auto shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Yangi AI Agent qo'shish</span>
                      </button>
                    </div>

                    {/* Markaz doirasi haqida eslatma */}
                    <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                        <Sparkles size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {settings.centerName || "Markaz"} uchun maxsus AI sozlamasi
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          Ushbu markaz umumiy tizim modelidan emas, siz tanlagan shaxsiy AI Agenti yoki kiritgan API kalitingizdan mustaqil foydalanadi.
                        </div>
                      </div>
                    </div>

                    {/* Master Switch: AI ni yoqish / o'chirish */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                      <div>
                        <div className="text-xs font-semibold text-[var(--text-primary)]">
                          AI funksiyalarini markaz uchun faollashtirish
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          Yoqilgan bo'lsa, o'qituvchilar dars va test yaratishda AI yordamchisidan foydalana oladilar
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={settings.features?.aiEnabled !== false}
                        onChange={() => {
                          const next = settings.features?.aiEnabled === false;
                          const updated = { ...(settings.features || {}), aiEnabled: next };
                          set('features', updated);
                          api.put('/admin/settings', { features: updated })
                            .then(() => toast.success(next ? "AI tizimi yoqildi" : "AI tizimi o'chirildi"))
                            .catch(() => {});
                        }}
                      />
                    </div>

                    {/* 1. Tizimdagi AI Agentni biriktirish */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-semibold text-[var(--text-primary)] block">
                        Tizim AI Agenti bilan bog'lash (Tavsiya)
                      </label>
                      <select
                        className="input-field text-sm"
                        value={settings.aiConfig?.agentId || ""}
                        onChange={e => handleSelectAgent(e.target.value)}
                      >
                        <option value="">Shaxsiy model tanlash (quyidagi ro'yxatdan)</option>
                        {aiAgents.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.provider?.toUpperCase()} — {a.model || "Standart"})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Agar agent tanlansa, o'sha agentning API kaliti va modeli ushbu markazga avtomatik tatbiq qilinadi va boshqa ortiqcha qatorlar yashiriladi.
                      </p>
                    </div>

                    {/* Agar AI Agent tanlangan bo'lsa, qolgan qatorlar yashiriladi va faol agent kartochkasi ko'rsatiladi */}
                    {(() => {
                      const selectedAgent = aiAgents.find(a => a.id === settings.aiConfig?.agentId);
                      if (settings.aiConfig?.agentId && selectedAgent) {
                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 sm:p-5 rounded-2xl border transition-all"
                            style={{
                              background: "rgba(16, 185, 129, 0.04)",
                              borderColor: "rgba(16, 185, 129, 0.3)",
                            }}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                                  style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}
                                >
                                  <Bot size={24} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                                      {selectedAgent.name}
                                    </h3>
                                    <span className="badge text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold">
                                      AI Agent Faol
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Markaz barcha AI vazifalari uchun aynan shu shaxsiy agent kaliti va modelidan foydalanadi
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSelectAgent("")}
                                className="btn-outline text-xs px-3 py-1.5 rounded-xl self-start sm:self-center"
                                title="Agentni uzish va qo'lda kiritish"
                              >
                                Qo'lda sozlashga o'tish
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-3 border-t border-[var(--border)]">
                              <div className="p-3 rounded-xl bg-white dark:bg-gray-800/80 border border-[var(--border)]">
                                <span className="text-gray-400 block text-[11px] mb-0.5">AI Provayder</span>
                                <span className="font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
                                  {selectedAgent.provider || "GEMINI"}
                                </span>
                              </div>

                              <div className="p-3 rounded-xl bg-white dark:bg-gray-800/80 border border-[var(--border)]">
                                <span className="text-gray-400 block text-[11px] mb-0.5">Model</span>
                                <span className="font-bold text-primary font-mono truncate block">
                                  {selectedAgent.model || "Standart model"}
                                </span>
                              </div>

                              <div className="p-3 rounded-xl bg-white dark:bg-gray-800/80 border border-[var(--border)]">
                                <span className="text-gray-400 block text-[11px] mb-0.5">API Kalit Holati</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <ShieldCheck size={14} /> Agent kaliti ishlatiladi
                                </span>
                              </div>
                            </div>

                            <div className="mt-3.5 p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                              <CheckCircle2 size={15} className="flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <span>
                                Qo'lda API kalit va model kiritish shart emas — barcha darslar, savol-javoblar va testlar aynan ushbu shaxsiy AI agentingiz orqali amalga oshiriladi.
                              </span>
                            </div>
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4 pt-1"
                        >
                          {/* 2. Aniq AI Modelni tanlash (Dropdown select) */}
                          <div>
                            <label className="text-xs font-semibold mb-1 block text-[var(--text-primary)]">
                              Ishlatiladigan AI Model (Select) *
                            </label>
                            <select
                              className="input-field text-sm font-semibold cursor-pointer"
                              value={settings.aiConfig?.model || "gemini-2.5-flash"}
                              onChange={e => set('aiConfig', { ...(settings.aiConfig || {}), model: e.target.value })}
                            >
                              {AI_MODEL_OPTIONS.map(group => (
                                <optgroup key={group.group} label={group.group}>
                                  {group.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label} {opt.badge ? `[${opt.badge}]` : ""}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                              <option value="custom">Boshqa maxsus model kiritish...</option>
                            </select>

                            {settings.aiConfig?.model === "custom" && (
                              <input
                                className="input-field text-sm mt-2 font-mono"
                                placeholder="Model identifikatorini kiriting (masalan: gemini-2.5-flash)"
                                onChange={e => set('aiConfig', { ...(settings.aiConfig || {}), model: e.target.value })}
                              />
                            )}
                            <div className="text-[11px] mt-1.5 flex items-center gap-1.5 text-[var(--text-muted)]">
                              <CheckCircle2 size={13} className="text-emerald-500" />
                              Tanlangan model barcha dars va test generatsiyalari uchun ishlatiladi.
                            </div>
                          </div>

                          {/* 3. API Kalit kiritish */}
                          <div>
                            <label className="text-xs font-semibold mb-1 block text-[var(--text-primary)]">
                              Markazning Shaxsiy API Kaliti (ixtiyoriy)
                            </label>
                            <div className="relative">
                              <input
                                type={showAiApiKey ? "text" : "password"}
                                className="input-field text-sm font-mono pr-10"
                                placeholder="AIzaSy... yoki sk-..."
                                value={settings.aiConfig?.apiKey || ""}
                                onChange={e => set('aiConfig', { ...(settings.aiConfig || {}), apiKey: e.target.value })}
                              />
                              <button
                                type="button"
                                onClick={() => setShowAiApiKey(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                              >
                                {showAiApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                            <p className="text-[11px] mt-1 text-[var(--text-muted)]">
                              Agar bo'sh qoldirilsa, serverdagi faol AI Agent kaliti avtomatik ishlatiladi.
                            </p>
                          </div>
                        </motion.div>
                      );
                    })()}
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

      {/* ── Kurs Darajasi Modal (Yaratish / Tahrirlash) ── */}
      <Modal
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        title={editingLevel ? "Kurs darajasini tahrirlash" : "Yangi kurs darajasi qo'shish"}
        subtitle="Guruh yaratishda tanlanadigan ta'lim bosqichi, to'lovi va unga biriktirilgan o'qituvchilar"
      >
        <form onSubmit={handleSaveLevel} className="space-y-4">
          <div>
            <label className="form-label">Daraja / Bosqich nomi *</label>
            <input
              type="text"
              required
              value={levelForm.name}
              onChange={e => setLevelForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Masalan: Boshlang'ich (Beginner) yoki DTM tayyorlov"
              className="input-field text-sm font-semibold"
            />
          </div>

          <div>
            <label className="form-label">Standart oylik to'lov (so'm)</label>
            <input
              type="number"
              value={levelForm.defaultFee || ''}
              onChange={e => setLevelForm(f => ({ ...f, defaultFee: Number(e.target.value) || 0 }))}
              placeholder="450000"
              className="input-field text-sm font-mono"
            />
            <p className="form-hint">Yangi guruh ochilganda ushbu narx avtomatik to'ldiriladi</p>
          </div>

          <div>
            <label className="form-label">Tavsif (ixtiyoriy)</label>
            <input
              type="text"
              value={levelForm.description}
              onChange={e => setLevelForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Ushbu bosqichda o'quvchilar nimalarni o'rganadi..."
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="form-label">Ushbu daraja o'qituvchilari</label>
            <p className="text-[11px] text-[var(--text-muted)] mb-2">
              Qaysi o'qituvchilar ushbu darajada dars berishini belgilang (Guruh yaratishda tanlash oson bo'ladi):
            </p>
            {teachers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                {teachers.map(t => {
                  const isAssigned = (levelForm.teacherIds || []).includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-all text-xs ${
                        isAssigned
                          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--card)]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={e => {
                          const checked = e.target.checked;
                          setLevelForm(f => ({
                            ...f,
                            teacherIds: checked
                              ? [...(f.teacherIds || []), t.id]
                              : (f.teacherIds || []).filter(id => id !== t.id)
                          }));
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="truncate">{t.name}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-[var(--text-muted)] italic">Hozircha markazda o'qituvchilar yo'q</div>
            )}
          </div>

          <div className="pt-3 border-t border-[var(--border)] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowLevelModal(false)}
              className="btn-ghost px-4 py-2 text-xs font-semibold"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5"
            >
              <Save size={14} />
              <span>Saqlash</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Yangi AI Agent Modal ── */}
      <Modal
        isOpen={showCreateAgentModal}
        onClose={() => setShowCreateAgentModal(false)}
        title="Yangi AI Agent yaratish"
        subtitle="Markazingiz uchun shaxsiy AI agenti va API kalitini kiritish"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newAgentForm.name.trim()) return toast.error("Agent nomini kiriting");
            if (!newAgentForm.apiKey.trim()) return toast.error("API kalitni kiriting");
            createAgentMutation.mutate({
              name: newAgentForm.name.trim(),
              provider: newAgentForm.provider,
              apiKey: newAgentForm.apiKey.trim(),
              model: newAgentForm.model,
              enabledModels: [newAgentForm.model],
              isActive: true,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="form-label">Agent nomi *</label>
            <input
              type="text"
              required
              value={newAgentForm.name}
              onChange={(e) => setNewAgentForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Masalan: Bizning Markaz AI Agenti"
              className="input-field text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">AI Provayder *</label>
              <select
                value={newAgentForm.provider}
                onChange={(e) => setNewAgentForm(f => ({
                  ...f,
                  provider: e.target.value,
                  model: e.target.value === 'openai' ? 'gpt-4o' : 'gemini-2.5-flash',
                }))}
                className="input-field text-sm"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
              </select>
            </div>

            <div>
              <label className="form-label">Asosiy Model *</label>
              <select
                value={newAgentForm.model}
                onChange={(e) => setNewAgentForm(f => ({ ...f, model: e.target.value }))}
                className="input-field text-sm font-mono"
              >
                {newAgentForm.provider === 'openai' ? (
                  <>
                    <option value="gpt-4o">gpt-4o (Omni)</option>
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="o3-mini">o3-mini</option>
                  </>
                ) : newAgentForm.provider === 'anthropic' ? (
                  <>
                    <option value="claude-3-7-sonnet">claude-3-7-sonnet</option>
                    <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
                    <option value="claude-3-5-haiku">claude-3-5-haiku</option>
                  </>
                ) : (
                  <>
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Standart)</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                    <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">API Kalit (API Key) *</label>
            <input
              type="password"
              required
              value={newAgentForm.apiKey}
              onChange={(e) => setNewAgentForm(f => ({ ...f, apiKey: e.target.value }))}
              placeholder={newAgentForm.provider === 'openai' ? "sk-..." : "AIzaSy..."}
              className="input-field text-sm font-mono"
            />
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Kalit xavfsiz saqlanadi va faqat markazingiz so'rovlariga xizmat qiladi.
            </p>
          </div>

          <div className="pt-3 border-t border-[var(--border)] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateAgentModal(false)}
              className="btn-ghost px-4 py-2 text-xs font-semibold"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={createAgentMutation.isPending}
              className="btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5"
            >
              {createAgentMutation.isPending ? "Yaratilmoqda..." : "Yaratish & Biriktirish"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
