import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Shield, ShieldCheck, ShieldAlert, Lock, Unlock,
  Phone, Mail, Building2, Calendar, Clock, User, Check, X,
  Pencil, RefreshCw, PieChart, Wallet, CreditCard, Target,
  Users as UsersIcon, GraduationCap, BookMarked, Save,
  AlertTriangle, Copy, ChevronRight, CheckCircle2,
} from 'lucide-react';
import api from '../../config/axios';
import { useAuthStore } from '../../store/authStore';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PhoneInput from '../../components/ui/PhoneInput';
import { cleanPhone } from '../../utils/formatPhone';
import toast from 'react-hot-toast';

const PERMISSION_CONFIG = [
  {
    key: 'canViewFinance',
    label: "Moliya bo'limi va hisobotlari",
    description: "Moliya dashboardi, oylik kirim-chiqimlar va moliyaviy hisobotlarni ko'rish",
    icon: PieChart,
    color: '#6366f1',
    sensitive: true,
  },
  {
    key: 'canViewCashbox',
    label: 'Kassa va naqd pul balansi',
    description: "Jonli kassa balansi, naqd tushumlar va kunlik kassa amallari",
    icon: Wallet,
    color: '#10b981',
    sensitive: true,
  },
  {
    key: 'canManagePayments',
    label: "To'lovlarni qabul qilish",
    description: "O'quvchilardan to'lov olish, to'lovni tasdiqlash va kvitansiya chop etish",
    icon: CreditCard,
    color: '#f59e0b',
  },
  {
    key: 'canManageLeads',
    label: 'Lidlar va CRM voronkasi',
    description: "Yangi lidlarni qabul qilish, qo'ng'iroq qilish va guruhlarga taqsimlash",
    icon: Target,
    color: '#ec4899',
  },
  {
    key: 'canManageTimetable',
    label: 'Dars jadvali va xonalar',
    description: "Haftalik dars jadvalini ko'rish, xonalar bandligini boshqarish",
    icon: Calendar,
    color: '#06b6d4',
  },
  {
    key: 'canManageGroups',
    label: "Guruhlar ro'yxati",
    description: "Guruhlar jadvali, dars kunlari va guruh o'quvchilarini ko'rish",
    icon: UsersIcon,
    color: '#3b82f6',
  },
  {
    key: 'canManageStudents',
    label: "O'quvchilar ro'yxati",
    description: "O'quvchilar ma'lumotlari, profillari va davomatini ko'rish",
    icon: GraduationCap,
    color: '#8b5cf6',
  },
  {
    key: 'canManageTeachers',
    label: "O'qituvchilar ro'yxati",
    description: "O'qituvchilar ma'lumotlari va dars jadvallarini ko'rish",
    icon: BookMarked,
    color: '#14b8a6',
  },
];

export default function ReceptionStaffDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const [confirm, setConfirm] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', branchId: '' });
  const [localPermissions, setLocalPermissions] = useState({});
  const [hasUnsavedPerms, setHasUnsavedPerms] = useState(false);

  // 1. Fetch Receptionist Details
  const { data, isLoading, isError } = useQuery({
    queryKey: ['reception-staff-detail', id],
    queryFn: () => api.get(`/admin/reception/${id}`).then(r => r.data?.data),
    enabled: !!id,
  });

  const staff = data?.user;
  const stats = data?.stats;

  // 2. Fetch Branches for assignment modal
  const { data: branches = [] } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: () => api.get('/admin/branches').then(r => r.data?.data || r.data || []),
  });

  // Sync local permissions when server data arrives
  useEffect(() => {
    if (staff?.effectivePermissions) {
      setLocalPermissions(staff.effectivePermissions);
      setHasUnsavedPerms(false);
    }
    if (staff) {
      setEditForm({
        name: staff.name || '',
        phone: staff.phone || '+998 ',
        email: staff.email || '',
        branchId: staff.branches?.[0]?.id || staff.branchId || '',
      });
    }
  }, [staff]);

  // 3. Mutations
  const updatePermsMutation = useMutation({
    mutationFn: (newPerms) => api.put(`/admin/reception/${id}/permissions`, { permissions: newPerms }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['reception-staff-detail', id] });
      qc.invalidateQueries({ queryKey: ['admin-reception'] });
      qc.invalidateQueries({ queryKey: ['center-settings'] });
      toast.success("Xodim ruxsatlari muvaffaqiyatli saqlandi");
      setHasUnsavedPerms(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (newFrozen) => api.put(`/admin/reception/${id}/toggle-status`, { isFrozen: newFrozen }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['reception-staff-detail', id] });
      qc.invalidateQueries({ queryKey: ['admin-reception'] });
      const frozen = res.data?.data?.isFrozen;
      toast.success(frozen ? "Qabulxona hisobi bloklandi" : "Qabulxona hisobi faollashtirildi");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Statusni o\'zgartirib bo\'lmadi');
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => api.put(`/admin/reception/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reception-staff-detail', id] });
      qc.invalidateQueries({ queryKey: ['admin-reception'] });
      setShowEditModal(false);
      toast.success("Xodim ma'lumotlari yangilandi");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  // Handlers
  const handleTogglePerm = (key, val) => {
    setLocalPermissions(prev => {
      const next = { ...prev, [key]: val };
      setHasUnsavedPerms(true);
      return next;
    });
  };

  const handleSavePermissions = () => {
    updatePermsMutation.mutate(localPermissions);
  };

  const handleQuickFinanceToggle = () => {
    const isBothBlocked = !localPermissions.canViewFinance && !localPermissions.canViewCashbox;
    const nextPerms = {
      ...localPermissions,
      canViewFinance: isBothBlocked,
      canViewCashbox: isBothBlocked,
    };
    setLocalPermissions(nextPerms);
    updatePermsMutation.mutate(nextPerms);
  };

  const handleGrantAll = () => {
    const allTrue = {};
    PERMISSION_CONFIG.forEach(p => { allTrue[p.key] = true; });
    setLocalPermissions(allTrue);
    setHasUnsavedPerms(true);
  };

  const handleResetDefaults = () => {
    const centerDefault = staff?.center?.settings?.receptionPermissions || {};
    const resetPerms = {
      canViewFinance: false,
      canViewCashbox: false,
      canManagePayments: true,
      canManageLeads: true,
      canManageTimetable: true,
      canManageGroups: true,
      canManageStudents: true,
      canManageTeachers: true,
      ...centerDefault,
    };
    setLocalPermissions(resetPerms);
    setHasUnsavedPerms(true);
  };

  const handleToggleFreeze = () => {
    const nextFrozen = !(staff?.isFrozen || !staff?.isActive);
    setConfirm({
      title: nextFrozen ? "Hisobni bloklash" : "Hisobni faollashtirish",
      message: nextFrozen
        ? `"${staff?.name}" hisobini bloklamoqchimisiz? Xodim tizimga kira olmaydi va barcha amallari to'xtatiladi.`
        : `"${staff?.name}" hisobini qayta faollashtirmoqchimisiz? Xodim yana tizimga kira oladi.`,
      confirmText: nextFrozen ? "Bloklash" : "Faollashtirish",
      confirmVariant: nextFrozen ? "danger" : "primary",
      onConfirm: () => toggleStatusMutation.mutate(nextFrozen),
    });
  };

  const handleCopy = (text, msg = "Nusxalandi") => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return toast.error("Ism kiritilishi shart");
    updateProfileMutation.mutate({
      name: editForm.name,
      phone: cleanPhone(editForm.phone),
      email: editForm.email || null,
      branchId: editForm.branchId || null,
    });
  };

  const backUrl = currentUser?.role === 'manager' ? '/manager/reception' : '/admin/reception';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <RefreshCw size={28} className="animate-spin text-primary" />
          <p className="text-sm font-medium">Qabulxona ma'lumotlari yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (isError || !staff) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Qabulxona xodimi topilmadi</h2>
        <p className="text-sm text-gray-500 mb-6">Ushbu xodim o'chirilgan yoki sizda unga kirish huquqi yo'q.</p>
        <button onClick={() => navigate(backUrl)} className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Qabulxonaga qaytish
        </button>
      </div>
    );
  }

  const isBlocked = !staff.isActive || staff.isFrozen;
  const isFinanceBlocked = !localPermissions.canViewFinance && !localPermissions.canViewCashbox;
  const branch = staff.branches?.[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />

      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(backUrl)}
          className="btn-ghost flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft size={16} /> Qabulxona ro'yxatiga qaytish
        </button>

        <div className="flex items-center gap-2">
          <span className={`badge text-xs px-2.5 py-1 ${isBlocked ? 'badge-danger' : 'badge-success'}`}>
            {isBlocked ? 'Hisob bloklangan' : 'Hisob faol'}
          </span>
        </div>
      </div>

      {/* ── 1. Hero Profile Card ── */}
      <div
        className="card p-6 sm:p-7 relative overflow-hidden border"
        style={{
          borderColor: isBlocked ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)',
          background: isBlocked ? 'rgba(239, 68, 68, 0.02)' : 'var(--card)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white text-2xl font-bold shadow-md flex-shrink-0">
              {staff.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {staff.name}
                </h1>
                <span className="badge text-xs bg-primary/10 text-primary font-medium">
                  Qabulxona Xodimi
                </span>
                {isBlocked && (
                  <span className="badge text-xs bg-red-100 dark:bg-red-950/40 text-red-600 font-semibold flex items-center gap-1">
                    <Lock size={12} /> Bloklangan
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                <span className="font-mono text-gray-600 dark:text-gray-300">@{staff.username}</span>
                {staff.phone && (
                  <button
                    type="button"
                    onClick={() => handleCopy(staff.phone, "Telefon raqam nusxalandi")}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <Phone size={12} /> {staff.phone}
                  </button>
                )}
                {staff.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={12} /> {staff.email}
                  </span>
                )}
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Building2 size={12} />
                  {branch?.name ? branch.name : "Filial biriktirilmagan"}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleToggleFreeze}
              disabled={toggleStatusMutation.isPending}
              className={`px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all flex-shrink-0 ${
                isBlocked
                  ? 'btn-primary'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {isBlocked ? (
                <>
                  <Unlock size={16} /> Blokdan chiqarish
                </>
              ) : (
                <>
                  <Lock size={16} /> Hisobni bloklash
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="btn-outline px-3.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 flex-shrink-0"
            >
              <Pencil size={15} /> Tahrirlash
            </button>
          </div>
        </div>

        {/* Account status note banner */}
        <div
          className="mt-5 p-3.5 rounded-xl border flex items-center gap-3 text-xs"
          style={{
            background: isBlocked ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.06)',
            borderColor: isBlocked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: isBlocked ? '#ef4444' : '#10b981',
          }}
        >
          {isBlocked ? <ShieldAlert size={18} className="flex-shrink-0" /> : <ShieldCheck size={18} className="flex-shrink-0" />}
          <div className="text-gray-700 dark:text-gray-300">
            {isBlocked
              ? "Ushbu hisob hozirda nofaol (bloklangan). Xodim tizimga kira olmaydi, uning login sessiyalari to'xtatilgan."
              : "Ushbu hisob faol ishlamoqda. Xodim faqatgina quyida unga alohida ajratilgan ruxsatlar doirasida tizimdan foydalana oladi."}
          </div>
        </div>
      </div>

      {/* ── 2. Individual Permissions Matrix ── */}
      <div className="card p-6 sm:p-7 border" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="flex items-center gap-2">
              <Shield size={20} className="text-primary" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Shaxsiy Huquqlar va Ruxsatlar
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Aynan <span className="font-semibold text-gray-700 dark:text-gray-200">"{staff.name}"</span> uchun alohida ruxsatlar. Ushbu sozlamalar markazning umumiy qoidalaridan ustun turadi.
            </p>
          </div>

          {/* Quick presets & save */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleQuickFinanceToggle}
              className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isFinanceBlocked ? 'btn-primary' : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {isFinanceBlocked ? <Unlock size={14} /> : <Lock size={14} />}
              {isFinanceBlocked ? "Moliya & Kassani ochish" : "Moliya & Kassani yopish"}
            </button>

            <button
              type="button"
              onClick={handleGrantAll}
              className="btn-outline px-3 py-2 rounded-xl text-xs flex items-center gap-1.5"
            >
              <Check size={14} /> Barchasini ochish
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="btn-outline px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 text-gray-500"
              title="Markazning standart qoidalariga qaytarish"
            >
              <RefreshCw size={14} /> Standart holat
            </button>
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-5">
          {PERMISSION_CONFIG.map(({ key, label, description, icon: Icon, color, sensitive }) => {
            const isChecked = localPermissions[key] ?? (sensitive ? false : true);
            return (
              <div
                key={key}
                className="p-4 rounded-2xl border flex items-start justify-between gap-3.5 transition-all overflow-hidden"
                style={{
                  background: isChecked ? 'var(--card)' : 'var(--secondary-background)',
                  borderColor: isChecked ? 'var(--border)' : 'var(--border)',
                  boxShadow: isChecked ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${color}15`, color }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">
                        {label}
                      </span>
                      {sensitive && (
                        <span className="badge text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                          Moliya
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {description}
                    </p>
                  </div>
                </div>

                <div className="pt-0.5 flex-shrink-0">
                  <ToggleSwitch
                    size="sm"
                    checked={isChecked}
                    onChange={(val) => handleTogglePerm(key, val)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Bar */}
        <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs text-gray-500">
            {hasUnsavedPerms ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                <AlertTriangle size={14} /> Saqlanmagan o'zgarishlar mavjud. Saqlash tugmasini bosing.
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Barcha ruxsatlar saqlangan
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!hasUnsavedPerms || updatePermsMutation.isPending}
            onClick={handleSavePermissions}
            className={`btn-primary px-5 py-2.5 flex items-center justify-center gap-2 text-sm ${
              !hasUnsavedPerms ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {updatePermsMutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            Ruxsatlarni saqlash
          </button>
        </div>
      </div>

      {/* ── 3. Branch & Activity Statistics ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 border" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs text-gray-400 mb-1">Biriktirilgan Filial</div>
          <div className="font-bold text-base text-gray-800 dark:text-white flex items-center gap-1.5 truncate">
            <Building2 size={16} className="text-primary flex-shrink-0" />
            {branch?.name || "Filial biriktirilmagan"}
          </div>
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
            {branch?.address || "Filial manzili ko'rsatilmagan"}
          </p>
        </div>

        <div className="card p-5 border" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs text-gray-400 mb-1">Filial O'quvchilari</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap size={22} className="text-emerald-500" />
            {stats?.studentsCount ?? 0}
          </div>
          <p className="text-xs text-gray-500 mt-1">Ushbu filialda tahsil olayotgan o'quvchilar</p>
        </div>

        <div className="card p-5 border" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs text-gray-400 mb-1">Filial Guruhlari</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UsersIcon size={22} className="text-indigo-500" />
            {stats?.groupsCount ?? 0}
          </div>
          <p className="text-xs text-gray-500 mt-1">Faoliyat yuritayotgan o'quv guruhlari</p>
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={e => e.target === e.currentTarget && setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 8, opacity: 0 }}
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              className="rounded-3xl border p-6 sm:p-7 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Xodim ma'lumotlarini tahrirlash
                </h3>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-ghost p-1.5 rounded-xl text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 pt-4">
                <div>
                  <label className="label">F.I.SH (To'liq ism) *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="input"
                    placeholder="Masalan: Azizbek Rahimov"
                  />
                </div>

                <div>
                  <label className="label">Telefon raqami</label>
                  <PhoneInput
                    value={editForm.phone}
                    onChange={v => setEditForm(f => ({ ...f, phone: v }))}
                  />
                </div>

                <div>
                  <label className="label">Elektron pochta (ixtiyoriy)</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    className="input"
                    placeholder="email@markaz.uz"
                  />
                </div>

                <div>
                  <label className="label">Biriktirilgan filial</label>
                  <select
                    value={editForm.branchId}
                    onChange={e => setEditForm(f => ({ ...f, branchId: e.target.value }))}
                    className="input"
                  >
                    <option value="">Filial tanlanmagan</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn-ghost px-4 py-2.5 text-sm"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
                  >
                    {updateProfileMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
                    Saqlash
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
