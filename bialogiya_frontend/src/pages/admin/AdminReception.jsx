import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Copy, X, UserCog, Phone, Trash2, Pencil, Building2, CheckCircle2,
  Shield, ShieldCheck, Lock, Unlock, ChevronDown, ChevronUp, PieChart,
  Wallet, CreditCard, Target, Calendar, Users as UsersIcon, GraduationCap,
  BookMarked, SlidersHorizontal, Check,
} from 'lucide-react';
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
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newCreds, setNewCreds] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [showPermsDetails, setShowPermsDetails] = useState(false);

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
      qc.invalidateQueries(['admin-reception']);
      setNewCreds(data.data.credentials);
      setForm(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/reception/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-reception']);
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/reception/${id}`),
    onSuccess: () => qc.invalidateQueries(['admin-reception']),
  });

  const copy = (text) => navigator.clipboard.writeText(text);

  const closeModal = () => {
    setShowCreate(false);
    setEditingId(null);
    setNewCreds(null);
    setForm(EMPTY_FORM);
  };

  const openEdit = (u) => {
    setEditingId(u.id);
    setForm({ name: u.name, phone: u.phone || '+998 ', email: u.email || '', language: 'uz', branchId: u.branchId || '' });
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
    <div className="max-w-3xl mx-auto">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Qabulxona</h1>
          <p className="text-sm text-gray-500 mt-0.5">Faqat siz qabulxona hisoblarini yaratishingiz mumkin</p>
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
            className="mb-6 p-5 rounded-2xl border transition-all"
            style={{
              background: isFinanceCashboxBlocked
                ? 'rgba(239, 68, 68, 0.04)'
                : 'rgba(16, 185, 129, 0.04)',
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
                    <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                      Qabulxona huquqlari
                    </h2>
                    <span className={`badge text-xs ${isFinanceCashboxBlocked ? 'badge-danger' : 'badge-success'}`}>
                      {isFinanceCashboxBlocked ? 'Moliya va Kassa yopiq (Qabulxona ko\'ra olmaydi)' : 'Moliya va Kassa ochiq'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {isFinanceCashboxBlocked
                      ? 'Qabulxona xodimlari Moliya dashboardi, hisobotlar va Kassaga kira olmaydi.'
                      : 'Qabulxona xodimlariga Moliya va Kassa bo\'limlariga kirish ruxsati berilgan.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
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

                <button
                  type="button"
                  onClick={() => setShowPermsDetails(!showPermsDetails)}
                  className="btn-outline px-3 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
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
                  className="mt-4 pt-4 border-t overflow-hidden"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-3">
                    Barcha bo'limlar bo'yicha qabulxona ruxsatlari:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                          className="p-3 rounded-xl border flex items-center justify-between gap-2 text-xs"
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

      <div className="space-y-2">
        {users?.map((u, i) => (
          <motion.div key={u.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="card flex items-center gap-3">
            <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {u.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-800 dark:text-white">{u.name}</div>
              <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                <span>@{u.username}</span>
                {u.phone && <span className="flex items-center gap-0.5"><Phone size={10} /> {u.phone}</span>}
                <span className="flex items-center gap-0.5"><Building2 size={10} /> {u._count?.branches || 0} filial</span>
              </div>
            </div>
            <span className={`badge text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {u.isActive ? 'Faol' : 'Nofaol'}
            </span>
            <button onClick={() => openEdit(u)} className="btn-ghost p-2 rounded-lg" title="Tahrirlash">
              <Pencil size={14} />
            </button>
            <button onClick={() => handleDelete(u)} className="btn-ghost p-2 rounded-lg text-red-400 hover:bg-red-50" title="O'chirish">
              <Trash2 size={14} />
            </button>
          </motion.div>
        ))}
        {users?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <UserCog size={36} className="mx-auto mb-3 opacity-30" />
            <p>Hali qabulxona hisoblari yo'q.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && closeModal()}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="creator-modal bg-white rounded-[28px] p-7 w-full max-w-xl shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-xl dark:text-slate-900">{editingId ? "Hisobni tahrirlash" : "Qabulxona hisobi qo'shish"}</h2>
                <button onClick={closeModal} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              {newCreds ? (
                <div>
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-950/40 text-green-600 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 size={26} />
                    </div>
                    <h3 className="font-bold text-green-600">Hisob yaratildi!</h3>
                    <p className="text-sm text-gray-500 mt-1">Bu ma'lumotlarni xodimga bering</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                    {[['Login', newCreds.username], ['Parol', newCreds.password]].map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500">{label}</div>
                          <div className="font-mono font-bold">{val}</div>
                        </div>
                        <button onClick={() => copy(val)} className="btn-ghost p-1.5 rounded-lg"><Copy size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={closeModal} className="btn-primary w-full mt-4">Yopish</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="creator-label block text-sm font-medium mb-1.5">To'liq ismi *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Xodim ismi" className="creator-field input-field" />
                  </div>
                  <div>
                    <label className="creator-label block text-sm font-medium mb-1.5">Telefon raqami</label>
                    <PhoneInput value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+998 90 123 45 67" className="creator-field input-field font-mono" />
                  </div>
                  <div>
                    <label className="creator-label block text-sm font-medium mb-1.5">Email</label>
                    <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="email@example.com" type="email" className="creator-field input-field" />
                  </div>
                  <div>
                    <label className="creator-label block text-sm font-medium mb-1.5">Filial</label>
                    <select
                      value={form.branchId}
                      onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
                      className="creator-field input-field"
                    >
                      <option value="">Tanlang</option>
                      {branches.filter((branch) => !branch.receptionId).map((branch) => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                    <p className="creator-hint text-xs mt-1">Agar filial tanlangan bo'lsa, bu qabulxona shu filialga bog'lanadi.</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={closeModal} className="btn-ghost flex-1">Bekor</button>
                    <button
                      onClick={submit}
                      disabled={!form.name || isSaving}
                      className="creator-submit btn-primary flex-1 disabled:opacity-40">
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
