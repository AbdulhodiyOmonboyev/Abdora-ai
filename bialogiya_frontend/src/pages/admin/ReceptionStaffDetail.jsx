import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Shield, ShieldCheck, ShieldAlert, Lock, Unlock,
  Phone, Mail, Building2, Calendar, Check, X,
  Pencil, RefreshCw, PieChart, Wallet, CreditCard, Target,
  Users as UsersIcon, GraduationCap, BookMarked, Save,
  AlertTriangle, Copy, CheckCircle2, RotateCcw,
} from 'lucide-react';
import api from '../../config/axios';
import { useAuthStore } from '../../store/authStore';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PhoneInput from '../../components/ui/PhoneInput';
import { cleanPhone } from '../../utils/formatPhone';
import toast from 'react-hot-toast';

const FINANCE_PERMISSIONS = [
  {
    key: 'canViewFinance',
    label: "Moliya bo'limi va hisobotlari",
    description: "Markazning umumiy kirim-chiqimlari, sof foyda va moliyaviy hisobotlarini ko'rish",
    icon: PieChart,
    color: '#6366f1',
    sensitive: true,
  },
  {
    key: 'canViewCashbox',
    label: 'Kassa va naqd pul balansi',
    description: "Jonli kassa qoldig'i, naqd pullar aylanmasi va kunlik kassa amallari",
    icon: Wallet,
    color: '#10b981',
    sensitive: true,
  },
  {
    key: 'canManagePayments',
    label: "To'lovlarni qabul qilish",
    description: "O'quvchilardan to'lovlarni qabul qilish, to'lovni tasdiqlash va kvitansiya berish",
    icon: CreditCard,
    color: '#f59e0b',
    sensitive: true,
  },
];

const OPERATIONAL_PERMISSIONS = [
  {
    key: 'canManageLeads',
    label: 'Lidlar va CRM voronkasi',
    description: "Yangi arizalarni qabul qilish, qo'ng'iroqlarni qayd etish va lidlarni guruhlarga taqsimlash",
    icon: Target,
    color: '#ec4899',
  },
  {
    key: 'canManageTimetable',
    label: 'Dars jadvali va xonalar',
    description: "Haftalik dars jadvallarini ko'rish, bo'sh xonalar va dars vaqtlarini nazorat qilish",
    icon: Calendar,
    color: '#06b6d4',
  },
  {
    key: 'canManageGroups',
    label: "Guruhlar ro'yxati",
    description: "Mavjud guruhlar tarkibi, dars kunlari va guruh o'quvchilari ro'yxatini ko'rish",
    icon: UsersIcon,
    color: '#3b82f6',
  },
  {
    key: 'canManageStudents',
    label: "O'quvchilar ro'yxati",
    description: "O'quvchilar profillari, shaxsiy ma'lumotlari, qarzdorlik va davomatini ko'rish",
    icon: GraduationCap,
    color: '#8b5cf6',
  },
  {
    key: 'canManageTeachers',
    label: "O'qituvchilar ro'yxati",
    description: "O'qituvchilar ma'lumotlari, ularning biriktirilgan guruhlari va dars jadvallari",
    icon: BookMarked,
    color: '#14b8a6',
  },
];

const ALL_PERMISSIONS = [...FINANCE_PERMISSIONS, ...OPERATIONAL_PERMISSIONS];

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
  const { data, isLoading, isError, refetch } = useQuery({
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reception-staff-detail', id] });
      qc.invalidateQueries({ queryKey: ['admin-reception'] });
      qc.invalidateQueries({ queryKey: ['center-settings'] });
      toast.success("Xodim shaxsiy ruxsatlari muvaffaqiyatli saqlandi");
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

  const handleCancelPermissions = () => {
    if (staff?.effectivePermissions) {
      setLocalPermissions(staff.effectivePermissions);
      setHasUnsavedPerms(false);
      toast.info("O'zgarishlar bekor qilindi");
    }
  };

  const handleQuickFinanceToggle = () => {
    const isAnyFinanceActive = !!(localPermissions.canViewFinance || localPermissions.canViewCashbox || localPermissions.canManagePayments);
    const nextPerms = {
      ...localPermissions,
      canViewFinance: !isAnyFinanceActive,
      canViewCashbox: !isAnyFinanceActive,
      canManagePayments: !isAnyFinanceActive,
    };
    setLocalPermissions(nextPerms);
    setHasUnsavedPerms(true);
  };

  const handleGrantAll = () => {
    const allTrue = {};
    ALL_PERMISSIONS.forEach(p => { allTrue[p.key] = true; });
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
        : `"${staff?.name}" hisobini qayta faollashtirmoqchimisiz? Xodim yana tizimga kirib ishlashi mumkin.`,
      confirmText: nextFrozen ? "Bloklash" : "Faollashtirish",
      confirmVariant: nextFrozen ? "danger" : "primary",
      onConfirm: () => toggleStatusMutation.mutate(nextFrozen),
    });
  };

  const handleCopy = (text, msg = "Nusxalandi") => {
    if (!text) return;
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
          <p className="text-sm font-medium">Qabulxona xodimi ma'lumotlari yuklanmoqda...</p>
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
          <ArrowLeft size={16} /> Qabulxona ro'yxatiga qaytish
        </button>
      </div>
    );
  }

  const isBlocked = !staff.isActive || staff.isFrozen;
  const isFinanceBlocked = !localPermissions.canViewFinance && !localPermissions.canViewCashbox && !localPermissions.canManagePayments;
  const activeCount = ALL_PERMISSIONS.filter(p => !!localPermissions[p.key]).length;
  const branch = staff.branches?.[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />

      {/* ── Breadcrumb & Top Bar ── */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(backUrl)}
          className="btn-ghost flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Qabulxonalar ro'yxatiga qaytish
        </button>

        <button
          onClick={() => refetch()}
          className="btn-ghost p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          title="Yangilash"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ── 1. INSTANT STATUS BANNER (Bir qarashda tushunarli) ── */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isBlocked
            ? 'bg-red-50/90 dark:bg-red-950/30 border-red-300 dark:border-red-900/60'
            : 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900/60'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                isBlocked
                  ? 'bg-red-500 text-white'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {isBlocked ? <ShieldAlert size={26} /> : <ShieldCheck size={26} />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Hisob Holati
                </span>
                <span
                  className={`badge text-xs font-bold px-2.5 py-0.5 ${
                    isBlocked
                      ? 'bg-red-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isBlocked ? 'BLOKLANGAN — TIZIMGA KIRA OLMAYDI' : 'FAOL — TIZIMDA ISHLAMOQDA'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1">
                {isBlocked
                  ? "Ushbu qabulxona xodimi bloklangan. Tizimga login qila olmaydi va uning barcha amallari cheklangan."
                  : "Xodim faol holatda. Quyida unga aynan qaysi bo'limlarga ruxsat berilgani va qaysilari taqiqlanganini boshqarishingiz mumkin."}
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleFreeze}
              disabled={toggleStatusMutation.isPending}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                isBlocked
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {toggleStatusMutation.isPending ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : isBlocked ? (
                <>
                  <Unlock size={16} /> Blokdan chiqarish
                </>
              ) : (
                <>
                  <Lock size={16} /> Hisobni bloklash
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. HERO PROFILE CARD ── */}
      <div className="card p-6 sm:p-7 border" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white text-2xl font-bold shadow-md flex-shrink-0">
                {staff.name?.charAt(0)?.toUpperCase()}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
                  isBlocked ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                title={isBlocked ? 'Bloklangan' : 'Faol'}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {staff.name}
                </h1>
                <span className="badge text-xs bg-primary/10 text-primary font-semibold">
                  Qabulxona Xodimi
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md text-gray-700 dark:text-gray-300">
                  @{staff.username}
                </span>

                {staff.phone && (
                  <button
                    type="button"
                    onClick={() => handleCopy(staff.phone, "Telefon raqami nusxalandi")}
                    className="flex items-center gap-1 hover:text-primary transition-colors bg-gray-50 dark:bg-gray-800/60 px-2 py-0.5 rounded-md"
                    title="Nusxalash"
                  >
                    <Phone size={12} className="text-primary" />
                    <span>{staff.phone}</span>
                    <Copy size={10} className="text-gray-400 ml-0.5" />
                  </button>
                )}

                {staff.email && (
                  <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/60 px-2 py-0.5 rounded-md">
                    <Mail size={12} className="text-blue-500" />
                    <span>{staff.email}</span>
                  </span>
                )}

                <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  <Building2 size={12} />
                  <span>{branch?.name ? branch.name : "Filial biriktirilmagan"}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="btn-outline px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 flex-shrink-0"
            >
              <Pencil size={15} /> Ma'lumotlarni tahrirlash
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. AT-A-GLANCE STATS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Permission overview card */}
        <div className="card p-5 border" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Faol Ruxsatlar</span>
            <Shield size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {activeCount} <span className="text-xs font-normal text-gray-400">/ {ALL_PERMISSIONS.length} ta</span>
          </div>
          <div className="mt-2 text-xs">
            {isFinanceBlocked ? (
              <span className="badge badge-success text-[10px] font-semibold">
                Moliya to'liq yopiq (Xavfsiz)
              </span>
            ) : (
              <span className="badge badge-warning text-[10px] font-semibold">
                Moliya bo'limi ochiq
              </span>
            )}
          </div>
        </div>

        {/* Branch students card */}
        <div className="card p-5 border" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Filial O'quvchilari</span>
            <GraduationCap size={18} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {stats?.studentsCount ?? 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            {branch?.name || "Filial biriktirilmagan"}
          </p>
        </div>

        {/* Branch groups card */}
        <div className="card p-5 border" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Filial Guruhlari</span>
            <UsersIcon size={18} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {stats?.groupsCount ?? 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Faoliyatdagi o'quv guruhlari
          </p>
        </div>
      </div>

      {/* ── 4. SHAXSIY HUQUQLAR VA RUXSATLAR (Clear grouping) ── */}
      <div className="card p-6 sm:p-7 border" style={{ borderColor: 'var(--border)' }}>
        {/* Header & Quick Action Presets */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="flex items-center gap-2">
              <Shield size={22} className="text-primary" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Shaxsiy Huquqlar va Ruxsatlar
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Aynan <span className="font-semibold text-gray-800 dark:text-gray-200">"{staff.name}"</span> uchun alohida ruxsatlar matritsasi. Ushbu sozlamalar markazning standart qoidalaridan ustun turadi.
            </p>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleQuickFinanceToggle}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isFinanceBlocked
                  ? 'btn-primary'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isFinanceBlocked ? <Unlock size={14} /> : <Lock size={14} />}
              {isFinanceBlocked ? "Moliya & Kassani ochish" : "Moliya & Kassani yopish"}
            </button>

            <button
              type="button"
              onClick={handleGrantAll}
              className="btn-outline px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Check size={14} /> Barchasini ochish
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="btn-outline px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-gray-600 dark:text-gray-400"
              title="Standart holatga qaytarish"
            >
              <RotateCcw size={14} /> Standart holat
            </button>
          </div>
        </div>

        {/* SECTION A: MOLIYA VA KASSA (Sensitive) */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                1. Moliya va Kassa Bo'limi (Xavfsizlik)
              </h3>
            </div>
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full">
              Diqqat talab qiladi
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Ushbu bo'limlar markaz hisobotlari, oylik tushumlar va naqd pul bilan bog'liq. Faqat ishonchli xodimlarga yoqilishi tavsiya etiladi.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {FINANCE_PERMISSIONS.map(({ key, label, description, icon: Icon, color }) => {
              const isChecked = !!localPermissions[key];
              return (
                <div
                  key={key}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isChecked
                      ? 'bg-amber-500/5 border-amber-300 dark:border-amber-900/60 shadow-sm'
                      : 'bg-gray-50/60 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}18`, color }}
                      >
                        <Icon size={18} />
                      </div>
                      <span
                        className={`badge text-[10px] font-bold px-2 py-0.5 ${
                          isChecked
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {isChecked ? 'RUXSAT ETILGAN' : 'TAQIQLANGAN'}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-snug">
                      {label}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {description}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-gray-200/60 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {isChecked ? "Kirish ochiq" : "Kirish yopiq"}
                    </span>
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
        </div>

        {/* SECTION B: KUNDALIK OPERATSIYALAR & CRM */}
        <div className="pt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                2. Kundalik Operatsiyalar & CRM (Asosiy Vazifalar)
              </h3>
            </div>
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full">
              Qabulxona faoliyati
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            O'quvchilar, lidlar, dars jadvallari va guruhlar bilan kundalik ishlash bo'limlari.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {OPERATIONAL_PERMISSIONS.map(({ key, label, description, icon: Icon, color }) => {
              const isChecked = !!localPermissions[key];
              return (
                <div
                  key={key}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isChecked
                      ? 'bg-blue-500/5 border-blue-200 dark:border-blue-900/50 shadow-sm'
                      : 'bg-gray-50/60 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}18`, color }}
                      >
                        <Icon size={18} />
                      </div>
                      <span
                        className={`badge text-[10px] font-bold px-2 py-0.5 ${
                          isChecked
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {isChecked ? 'RUXSAT ETILGAN' : 'TAQIQLANGAN'}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-snug">
                      {label}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {description}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-gray-200/60 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {isChecked ? "Kirish ochiq" : "Kirish yopiq"}
                    </span>
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
        </div>

        {/* In-Card Save Bar */}
        <div className="mt-8 pt-5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs">
            {hasUnsavedPerms ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle size={15} /> Ruxsatlarga o'zgartirish kiritildi! Kuchga kirishi uchun saqlang.
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 size={15} /> Barcha ruxsatlar saqlangan holatda
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasUnsavedPerms && (
              <button
                type="button"
                onClick={handleCancelPermissions}
                className="btn-ghost px-4 py-2.5 text-xs font-semibold"
              >
                Bekor qilish
              </button>
            )}

            <button
              type="button"
              disabled={!hasUnsavedPerms || updatePermsMutation.isPending}
              onClick={handleSavePermissions}
              className={`btn-primary px-5 py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold shadow-sm ${
                !hasUnsavedPerms ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {updatePermsMutation.isPending ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
              Ruxsatlarni saqlash
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. FLOATING STICKY UNSAVED CHANGES BANNER ── */}
      <AnimatePresence>
        {hasUnsavedPerms && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl shadow-2xl rounded-2xl p-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900 flex items-center justify-between gap-3 border border-gray-700 dark:border-gray-200"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              <p className="text-xs sm:text-sm font-semibold truncate">
                Ruxsatlar o'zgartirildi! Saqlashni unutmang.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleCancelPermissions}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white dark:text-gray-600 dark:hover:text-gray-900"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={updatePermsMutation.isPending}
                className="btn-primary px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                {updatePermsMutation.isPending ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                Saqlash
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 6. EDIT PROFILE MODAL (FIXED & HIGH-PRECISION UI) ── */}
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
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Xodim ma'lumotlarini tahrirlash
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Ism, telefon raqami va biriktirilgan filialni yangilash
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-icon p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Yopish"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 pt-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                    F.I.SH (To'liq ism) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="Masalan: Azizbek Rahimov"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Telefon raqami
                  </label>
                  <PhoneInput
                    value={editForm.phone}
                    onChange={v => setEditForm(f => ({ ...f, phone: v }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Elektron pochta (ixtiyoriy)
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="reception@markaz.uz"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Biriktirilgan filial
                  </label>
                  <select
                    value={editForm.branchId}
                    onChange={e => setEditForm(f => ({ ...f, branchId: e.target.value }))}
                    className="input-field text-sm cursor-pointer"
                  >
                    <option value="">Filial tanlanmagan</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Qabulxona shu filialning o'quvchilari va dars jadvallari bilan ishlaydi.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn-ghost px-4 py-2.5 text-xs sm:text-sm font-semibold"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="btn-primary px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2"
                  >
                    {updateProfileMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
                    O'zgarishlarni saqlash
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
