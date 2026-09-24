import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Copy, X, UserCog, Phone, Trash2, Pencil, Building2, CheckCircle2,
  Shield, ShieldCheck, Lock, Unlock, ChevronDown, ChevronUp, PieChart,
  Wallet, CreditCard, Target, Calendar, Users as UsersIcon, GraduationCap,
  BookMarked, SlidersHorizontal, Check, ChevronRight, Search,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../config/axios';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import PhoneInput from '../../components/ui/PhoneInput';
import { cleanPhone } from '../../utils/formatPhone';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', phone: '+998 ', email: '', language: 'uz', branchId: '' };

export default function AdminReception() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newCreds, setNewCreds] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [showPermsDetails, setShowPermsDetails] = useState(false);
  const [search, setSearch] = useState('');

  const { data: serverSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then(r => r.data?.data || {}),
  });

  const receptionPerms = serverSettings?.receptionPermissions || {
    canViewFinance: false,
    canViewCashbox: false,
    canManagePayments: true,
    canManageLeads: true,
    canManageTimetable: true,
    canManageGroups: true,
    canManageStudents: true,
    canManageTeachers: true,
  };

  const updatePermsMutation = useMutation({
    mutationFn: (newPerms) => api.put('/admin/settings', { receptionPermissions: newPerms }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['center-settings'] });
      toast.success('Qabulxona ruxsatlari saqlandi');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-reception'],
    queryFn: () => api.get('/admin/reception').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: () => api.get('/admin/branches').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/admin/reception', d),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['admin-reception'] });
      qc.invalidateQueries({ queryKey: ['admin-branches'] });
      setNewCreds(data.data.credentials);
      setForm(EMPTY_FORM);
      toast.success("Qabulxona hisobi muvaffaqiyatli yaratildi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/reception/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reception'] });
      qc.invalidateQueries({ queryKey: ['admin-branches'] });
      closeModal();
      toast.success("Qabulxona ma'lumotlari yangilandi");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/reception/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reception'] });
      qc.invalidateQueries({ queryKey: ['admin-branches'] });
      toast.success("Qabulxona hisobi o'chirildi");
    },
  });

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Nusxalandi");
  };

  const closeModal = () => {
    setShowCreate(false);
    setEditingId(null);
    setNewCreds(null);
    setForm(EMPTY_FORM);
  };

  const openEdit = (u) => {
    setEditingId(u.id);
    setForm({
      name: u.name,
      phone: u.phone || '+998 ',
      email: u.email || '',
      language: 'uz',
      branchId: u.branches?.[0]?.id || u.branchId || ''
    });
    setShowCreate(true);
  };

  const submit = () => {
    if (!form.name) return;
    const phone = cleanPhone(form.phone);
    if (editingId) updateMutation.mutate({ id: editingId, data: { name: form.name, phone, email: form.email, branchId: form.branchId || null } });
    else createMutation.mutate({ ...form, phone });
  };

  const handleDelete = (u) => {
    setConfirm({
      title: `"${u.name}"ni o'chirish`,
      message: "Qabulxona xodimi tizimga kira olmaydi.",
      onConfirm: () => deleteMutation.mutate(u.id),
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  return (
    <div className="max-w-4xl mx-auto px-1 sm:px-0">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Qabulxona</h1>
          <p className="text-sm text-gray-500 mt-0.5">Qabulxona hisoblari, shaxsiy ruxsatlar va faoliyat nazorati</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Hisob qo'shish
        </button>
      </div>

      {/* ── Qabulxona huquqlari & 1-bosishda Moliya/Kassani bloklash ── */}
      {(() => {
        const isFinanceCashboxBlocked = !receptionPerms.canViewFinance && !receptionPerms.canViewCashbox;
        return (
          <div
            className="mb-6 p-4 sm:p-5 rounded-2xl border transition-all overflow-hidden w-full"
            style={{
              background: isFinanceCashboxBlocked
                ? 'rgba(239, 68, 68, 0.04)'
                : 'rgba(16, 185, 129, 0.04)',
              borderColor: isFinanceCashboxBlocked
                ? 'rgba(239, 68, 68, 0.25)'
                : 'rgba(16, 185, 129, 0.25)',
            }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isFinanceCashboxBlocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: isFinanceCashboxBlocked ? '#ef4444' : '#10b981',
                  }}
                >
                  {isFinanceCashboxBlocked ? <Lock size={22} /> : <Unlock size={22} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                      Qabulxona huquqlari
                    </h2>
                    <span className={`badge text-xs ${isFinanceCashboxBlocked ? 'badge-danger' : 'badge-success'}`}>
                      {isFinanceCashboxBlocked ? "Moliya & Kassa yopiq" : "Moliya & Kassa ochiq"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 break-words">
                    {isFinanceCashboxBlocked
                      ? "Qabulxona xodimlari Moliya va Kassaga kira olmaydi. Har bir xodim profilida alohida ruxsat berish mumkin."
                      : "Qabulxona xodimlariga Moliya va Kassa bo'limlariga umumiy ruxsat berilgan."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={updatePermsMutation.isPending}
                  onClick={() => {
                    const newBlocked = !isFinanceCashboxBlocked;
                    const newPerms = {
                      ...receptionPerms,
                      canViewFinance: !newBlocked,
                      canViewCashbox: !newBlocked,
                    };
                    updatePermsMutation.mutate(newPerms);
                  }}
                  className={`px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors flex-shrink-0 ${
                    isFinanceCashboxBlocked
                      ? 'btn-primary'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {isFinanceCashboxBlocked ? (
                    <>
                      <Unlock size={15} /> Moliya & Kassani ochish
                    </>
                  ) : (
                    <>
                      <Lock size={15} /> 1 bosishda bloklash
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPermsDetails(!showPermsDetails)}
                  className="btn-outline px-3 py-2.5 rounded-xl text-xs flex items-center gap-1.5 flex-shrink-0"
                  title="Qo'shimcha ruxsatlar"
                >
                  <SlidersHorizontal size={14} />
                  <span>Ruxsatlar</span>
                  {showPermsDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Granular switches dropdown / collapsible panel */}
            <AnimatePresence>
              {showPermsDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 pt-4 border-t overflow-hidden w-full"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-3">
                    Markaziy standart ruxsatlar (har bir xodim profilida individual o'zgartirish mumkin):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                    {[
                      { key: 'canViewFinance', label: 'Moliya sahifasi va hisobotlari', icon: PieChart, color: '#6366f1' },
                      { key: 'canViewCashbox', label: 'Kassa va naqd tushumlar', icon: Wallet, color: '#10b981' },
                      { key: 'canManagePayments', label: "To'lovlarni qabul qilish", icon: CreditCard, color: '#f59e0b' },
                      { key: 'canManageLeads', label: 'Lidlar (CRM) bilan ishlash', icon: Target, color: '#ec4899' },
                      { key: 'canManageTimetable', label: 'Dars jadvali va xonalar', icon: Calendar, color: '#06b6d4' },
                      { key: 'canManageGroups', label: "Guruhlar ro'yxati", icon: UsersIcon, color: '#3b82f6' },
                      { key: 'canManageStudents', label: "O'quvchilar ro'yxati", icon: GraduationCap, color: '#8b5cf6' },
                      { key: 'canManageTeachers', label: "O'qituvchilar ro'yxati", icon: BookMarked, color: '#14b8a6' },
                    ].map(({ key, label, icon: Icon, color }) => {
                      const isChecked = receptionPerms[key] ?? (key === 'canViewFinance' || key === 'canViewCashbox' ? false : true);
                      return (
                        <div
                          key={key}
                          className="p-3 rounded-xl border flex items-center justify-between gap-2 text-xs overflow-hidden"
                          style={{
                            background: isChecked ? 'var(--card)' : 'var(--secondary-background)',
                            borderColor: 'var(--border)',
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: `${color}15`, color }}
                            >
                              <Icon size={14} />
                            </div>
                            <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                              {label}
                            </span>
                          </div>
                          <ToggleSwitch
                            size="sm"
                            checked={isChecked}
                            onChange={(val) => {
                              const newPerms = { ...receptionPerms, [key]: val };
                              updatePermsMutation.mutate(newPerms);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })()}

      {/* ── Search & Counter Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Jami xodimlar: <span className="font-semibold text-gray-800 dark:text-gray-200">{users.length} ta</span>
          <span className="hidden sm:inline ml-2 text-gray-400">— Profil va ruxsatlarni ko'rish uchun xodim ustiga bosing</span>
        </div>

        {users.length > 0 && (
          <div className="search-input-wrap w-full sm:w-64">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ism, login yoki telefon..."
              className="input-field text-xs py-2"
            />
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        {users
          ?.filter(u => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
              u.name?.toLowerCase().includes(q) ||
              u.username?.toLowerCase().includes(q) ||
              u.phone?.toLowerCase().includes(q)
            );
          })
          .map((u, i) => {
            const isBlocked = !u.isActive || u.isFrozen;
            const targetUrl = user?.role === 'manager' ? `/manager/reception/${u.id}` : `/admin/reception/${u.id}`;
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(targetUrl)}
                className="card flex items-center gap-3 p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="w-11 h-11 gradient-bg rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                  {u.name?.charAt(0)?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-800 dark:text-white group-hover:text-primary transition-colors">
                      {u.name}
                    </span>
                    {isBlocked ? (
                      <span className="badge text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold">
                        Bloklangan
                      </span>
                    ) : (
                      <span className="badge text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold">
                        Faol
                      </span>
                    )}
                    {u.permissions?.canViewFinance && (
                      <span className="badge text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                        Moliya ochiq
                      </span>
                    )}
                    {u.permissions?.canViewCashbox && (
                      <span className="badge text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        Kassa ochiq
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-400 flex items-center gap-2.5 flex-wrap mt-1">
                    <span>@{u.username}</span>
                    {u.phone && (
                      <span className="flex items-center gap-0.5 font-mono">
                        <Phone size={10} /> {u.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                      <Building2 size={11} />
                      {u.branches?.[0]?.name ? u.branches[0].name : (u.branches?.length > 1 ? `${u.branches.length} filial` : "Filial biriktirilmagan")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => navigate(targetUrl)}
                    className="btn-outline px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 text-primary hover:bg-primary/5 transition-colors hidden sm:flex"
                    title="Shaxsiy profil va ruxsatlar"
                  >
                    <Shield size={13} />
                    <span>Profil & Ruxsatlar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(u)}
                    className="btn-ghost p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    title="Tahrirlash"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(u)}
                    className="btn-ghost p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                    title="O'chirish"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(targetUrl)}
                    className="pl-1 text-gray-400 group-hover:text-primary transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        {users?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <UserCog size={36} className="mx-auto mb-3 opacity-30" />
            <p>Hali qabulxona hisoblari yo'q.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={e => e.target === e.currentTarget && closeModal()}
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
                    {editingId ? "Hisobni tahrirlash" : "Qabulxona hisobi qo'shish"}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {editingId ? "Qabulxona xodimi ma'lumotlarini yangilash" : "Yangi qabulxona hisobini yaratish"}
                  </p>
                </div>
                <button onClick={closeModal} className="btn-icon flex-shrink-0" aria-label="Yopish">
                  <X size={18} />
                </button>
              </div>

              {newCreds ? (
                <div>
                  <div className="text-center mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2.5">
                      <CheckCircle2 size={26} />
                    </div>
                    <h3 className="font-bold text-base text-emerald-600 dark:text-emerald-400">Hisob muvaffaqiyatli yaratildi!</h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Ushbu kirish ma'lumotlarini xodimga taqdim eting</p>
                  </div>
                  <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
                    {[['Login', newCreds.username], ['Parol', newCreds.password]].map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between">
                        <div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
                          <div className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{val}</div>
                        </div>
                        <button onClick={() => copy(val)} className="btn-icon" title="Nusxalash"><Copy size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={closeModal} className="btn-primary w-full mt-5">Yopish</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>To'liq ismi *</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Xodim ismi"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Telefon raqami</label>
                    <PhoneInput
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+998 90 123 45 67"
                      className="input-field font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Email</label>
                    <input
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="email@example.com"
                      type="email"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Filial</label>
                    <select
                      value={form.branchId}
                      onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Tanlang</option>
                      {branches.filter((branch) => !branch.receptionId || branch.receptionId === editingId).map((branch) => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                    <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Agar filial tanlangan bo'lsa, bu qabulxona shu filialga bog'lanadi.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeModal} className="btn-ghost flex-1">Bekor</button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={!form.name || isSaving}
                      className="btn-primary flex-1 disabled:opacity-40"
                    >
                      {isSaving ? "Saqlanmoqda..." : editingId ? 'Saqlash' : "Qo'shish"}
                    </button>
                  </div>
                  {saveError && (
                    <p className="text-xs text-red-500 text-center">{friendlyAiErrorMessage(saveError)}</p>
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
