import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Trophy, Plus, X, Phone, Users, ShieldCheck, Copy,
  Trash2, Building2, BookOpen, Filter, Search
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { getLevelProgress } from '../../utils/format';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PhoneInput from '../../components/ui/PhoneInput';
import { cleanPhone } from '../../utils/formatPhone';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import { useAuthStore } from '../../store/authStore';

const EMPTY_STUDENT_FORM = {
  name: '',
  groupId: '',
  branchId: '',
  phone: '+998 ',
  parentPhone: '+998 ',
  parentName: '',
  age: '',
  gender: '',
  language: 'uz',
};

export default function AdminStudents() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_STUDENT_FORM);
  const [newCreds, setNewCreds] = useState(null);
  const [confirm, setConfirm] = useState(null);

  // Queries
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['all-students'],
    queryFn: () => api.get('/admin/students').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['all-groups'],
    queryFn: () => api.get('/groups/all').then(r => r.data?.data || r.data || []),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-list'],
    queryFn: () => api.get(user?.role === 'reception' ? '/reception/branches' : '/admin/branches')
      .then(r => r.data?.data || r.data || [])
      .catch(() => []),
  });

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/toggle`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-students'] });
      toast.success('Holat yangilandi');
    },
    onError: (e) => toast.error(friendlyAiErrorMessage(e)),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/users/create-student', {
      name: d.name?.trim(),
      groupId: d.groupId || undefined,
      branchId: d.branchId || undefined,
      phone: cleanPhone(d.phone),
      parentPhone: cleanPhone(d.parentPhone) || undefined,
      parentName: d.parentName?.trim() || undefined,
      age: d.age ? Number(d.age) : undefined,
      gender: d.gender || undefined,
      language: d.language || 'uz',
    }),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['all-students'] });
      qc.invalidateQueries({ queryKey: ['all-groups'] });
      qc.invalidateQueries({ queryKey: ['manager-groups'] });
      qc.invalidateQueries({ queryKey: ['reception-students'] });
      setNewCreds(data?.data?.credentials || null);
      setForm(EMPTY_STUDENT_FORM);
      toast.success("O'quvchi muvaffaqiyatli qo'shildi");
    },
    onError: (e) => toast.error(friendlyAiErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-students'] });
      qc.invalidateQueries({ queryKey: ['all-groups'] });
      toast.success("O'quvchi o'chirildi");
    },
    onError: (e) => toast.error(friendlyAiErrorMessage(e)),
  });

  const handleDelete = (s) => {
    setConfirm({
      title: `"${s.name}"ni o'chirish`,
      message: "O'quvchi tizimdan to'liq o'chiriladi va hisobi yopiladi.",
      confirmText: "O'chirish",
      confirmVariant: "danger",
      onConfirm: () => deleteMutation.mutate(s.id),
    });
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Nusxalandi");
  };

  const closeModal = () => {
    setShowCreate(false);
    setNewCreds(null);
    setForm(EMPTY_STUDENT_FORM);
  };

  const submitCreate = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("O'quvchi ismi kiritilishi shart");
    const phone = cleanPhone(form.phone);
    if (!phone || phone.replace(/\D/g, '').length < 9) {
      return toast.error("Telefon raqami to'liq kiritilishi shart (+998...)");
    }
    createMutation.mutate(form);
  };

  const filtered = Array.isArray(students)
    ? students.filter(s => {
        if (branchFilter && s.group?.branch?.id !== branchFilter && s.branch?.id !== branchFilter) return false;
        if (groupFilter && s.group?.id !== groupFilter) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          s.name?.toLowerCase().includes(q) ||
          s.username?.toLowerCase().includes(q) ||
          s.phone?.includes(q) ||
          s.group?.name?.toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <div className="dashboard-shell">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />

      <PageHeader
        title="O'quvchilar"
        subtitle={`Markazdagi barcha o'quvchilar (${filtered.length} / ${students.length})`}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> O'quvchi qo'shish
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="O'quvchi ismi, username, telefon yoki guruh..."
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {branches.length > 1 && (
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="input-field text-xs py-2 w-44"
            >
              <option value="">Barcha filiallar</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}

          {groups.length > 0 && (
            <select
              value={groupFilter}
              onChange={e => setGroupFilter(e.target.value)}
              className="input-field text-xs py-2 w-44"
            >
              <option value="">Barcha guruhlar</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
      ) : filtered.length > 0 ? (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>O'quvchi</th>
                <th>Telefon</th>
                <th>Guruh</th>
                <th>O'qituvchi</th>
                <th>Daraja / XP</th>
                <th>Holat</th>
                <th className="text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const { level } = getLevelProgress(s.xp || 0);
                return (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.015 }}
                  >
                    <td>
                      <Link to={`/users/${s.id}`} className="flex items-center gap-3 group">
                        <div className="avatar avatar-md group-hover:scale-105 transition-transform flex-shrink-0">
                          {s.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm group-hover:text-primary transition-colors truncate" style={{ color: 'var(--text-primary)' }}>
                            {s.name}
                          </div>
                          <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            @{s.username}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td>
                      <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {s.phone || '—'}
                      </span>
                    </td>
                    <td>
                      {s.group ? (
                        <span className="badge text-[11px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                          {s.group.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Guruhsiz</span>
                      )}
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {s.teacher?.name || s.group?.teacher?.name || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-orange text-xs font-semibold">
                        <Trophy size={11} className="mr-1" /> Lv.{level} · {s.xp || 0} XP
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleMutation.mutate(s.id)}
                        className="cursor-pointer transition-transform active:scale-95"
                        title="Statusni o'zgartirish"
                      >
                        <StatusBadge status={s.isActive ? 'faol' : 'nofaol'} />
                      </button>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDelete(s)}
                        className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                        title="O'chirish"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title={search ? "O'quvchi topilmadi" : "Hozircha o'quvchilar yo'q"}
          description={search ? `"${search}" so'rovi bo'yicha hech qanday o'quvchi topilmadi` : "Markazga birinchi o'quvchini qo'shish uchun quyidagi tugmani bosing."}
          action={
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-3 flex items-center gap-2">
              <Plus size={16} /> Birinchi o'quvchini qo'shish
            </button>
          }
        />
      )}

      {/* ── CREATE STUDENT MODAL ── */}
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
              <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    O'quvchi qo'shish
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Yangi o'quvchi profili va guruh biriktirish
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-icon p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={18} />
                </button>
              </div>

              {newCreds ? (
                <div className="space-y-4 pt-5">
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                    <ShieldCheck size={36} className="mx-auto mb-2" style={{ color: 'var(--success)' }} />
                    <h4 className="font-bold text-base" style={{ color: 'var(--success)' }}>O'quvchi qo'shildi!</h4>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Ushbu login va parolni o'quvchiga yoki ota-onaga taqdim eting.</p>
                  </div>

                  <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
                    {[
                      ['Login', newCreds.username],
                      ['Parol', newCreds.password],
                    ].map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between">
                        <div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
                          <div className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{val}</div>
                        </div>
                        <button onClick={() => copy(val)} className="btn-icon" title="Nusxalash">
                          <Copy size={14} style={{ color: 'var(--primary)' }} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={closeModal}
                    className="btn-primary w-full justify-center mt-3"
                  >
                    Tushunarli
                  </button>
                </div>
              ) : (
                <form onSubmit={submitCreate} className="space-y-4 pt-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                      O'quvchi F.I.SH <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="input-field text-sm"
                      placeholder="Masalan: Sardor Rustamov"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                        Telefon raqami <span className="text-red-500">*</span>
                      </label>
                      <PhoneInput
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e?.target?.value !== undefined ? e.target.value : String(e || '') }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                        Ota-onasi telefoni
                      </label>
                      <PhoneInput
                        value={form.parentPhone}
                        onChange={e => setForm(f => ({ ...f, parentPhone: e?.target?.value !== undefined ? e.target.value : String(e || '') }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Ota-onasi ismi
                    </label>
                    <input
                      type="text"
                      value={form.parentName}
                      onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))}
                      className="input-field text-sm"
                      placeholder="Masalan: Dilshod Rustamov"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                        Guruh
                      </label>
                      <select
                        value={form.groupId}
                        onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}
                        className="input-field text-sm"
                      >
                        <option value="">Guruhsiz</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                        Filial
                      </label>
                      <select
                        value={form.branchId}
                        onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
                        className="input-field text-sm"
                      >
                        <option value="">Filial tanlang</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                        Yoshi
                      </label>
                      <input
                        type="number"
                        min="6"
                        max="80"
                        value={form.age}
                        onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                        className="input-field text-sm"
                        placeholder="Masalan: 16"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                        Jinsi
                      </label>
                      <select
                        value={form.gender}
                        onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                        className="input-field text-sm"
                      >
                        <option value="">Tanlang</option>
                        <option value="male">Erkak</option>
                        <option value="female">Ayol</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="btn-ghost px-4 py-2.5 text-xs sm:text-sm font-semibold"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="btn-primary px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2"
                    >
                      {createMutation.isPending ? "Saqlanmoqda..." : "O'quvchi qo'shish"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
