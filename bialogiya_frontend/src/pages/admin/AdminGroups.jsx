import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, BookOpen, User, Plus, X, Pencil, Trash2, Clock, Calendar,
  DoorOpen, Building2, Wallet, Check, Search, Filter, Sparkles
} from 'lucide-react';
import api from '../../config/axios';
import { getSubjectLabel, getSubjectBadgeClass } from '../../utils/subjects';
import { useAuthStore } from '../../store/authStore';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import toast from 'react-hot-toast';

const DAYS = [
  { key: 'mon', label: 'Du' },
  { key: 'tue', label: 'Se' },
  { key: 'wed', label: 'Cho' },
  { key: 'thu', label: 'Pa' },
  { key: 'fri', label: 'Ju' },
  { key: 'sat', label: 'Sha' },
  { key: 'sun', label: 'Ya' },
];

const TIME_PRESETS = [
  { label: '08:30 — 10:00', start: '08:30', end: '10:00' },
  { label: '10:00 — 11:30', start: '10:00', end: '11:30' },
  { label: '14:00 — 15:30', start: '14:00', end: '15:30' },
  { label: '15:30 — 17:00', start: '15:30', end: '17:00' },
  { label: '17:00 — 18:30', start: '17:00', end: '18:30' },
  { label: '18:30 — 20:00', start: '18:30', end: '20:00' },
];

const SUBJECTS = [
  { key: 'biology', label: 'Biologiya' },
  { key: 'chemistry', label: 'Kimyo' },
  { key: 'math', label: 'Matematika' },
  { key: 'physics', label: 'Fizika' },
  { key: 'english', label: 'Ingliz tili' },
  { key: 'russian', label: 'Rus tili' },
  { key: 'uzbek', label: 'Ona tili' },
  { key: 'history', label: 'Tarix' },
  { key: 'it', label: 'Dasturlash / IT' },
  { key: 'other', label: 'Boshqa' },
];

const EMPTY_FORM = {
  name: '',
  subject: 'biology',
  teacherId: '',
  branchId: '',
  monthlyFee: '',
  weekDays: ['mon', 'wed', 'fri'],
  startTime: '14:00',
  endTime: '15:30',
  room: '',
  roomId: '',
  level: '',
  totalLessons: '',
};

const formatSchedule = (g) => {
  const parts = [];
  if (g.weekDays) {
    try {
      const days = Array.isArray(g.weekDays) ? g.weekDays : JSON.parse(g.weekDays);
      const labels = days.map(d => DAYS.find(x => x.key === d)?.label).filter(Boolean);
      if (labels.length) parts.push(labels.join(', '));
    } catch {}
  }
  if (g.startTime) parts.push(g.startTime + (g.endTime ? `–${g.endTime}` : ''));
  if (g.room) parts.push(g.room);
  return parts.join(' · ');
};

export default function AdminGroups() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirm, setConfirm] = useState(null);

  // Queries
  const queryKey = user?.role === 'manager' ? ['manager-groups', user.centerId] : ['all-groups'];
  const { data: groups = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get('/groups/all').then(r => r.data?.data || r.data || []),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['all-teachers'],
    queryFn: () => api.get('/admin/teachers').then(r => r.data?.data || r.data || []),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-list'],
    queryFn: () => api.get(user?.role === 'reception' ? '/reception/branches' : '/admin/branches')
      .then(r => r.data?.data || r.data || [])
      .catch(() => []),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms-list', form.branchId],
    queryFn: () => api.get('/rooms', { params: { branchId: form.branchId || undefined } })
      .then(r => r.data?.data || r.data || [])
      .catch(() => []),
  });

  const toPayload = (d) => ({
    ...d,
    monthlyFee: d.monthlyFee ? Number(d.monthlyFee) : null,
    totalLessons: d.totalLessons ? Number(d.totalLessons) : null,
    level: d.level?.trim() || null,
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/groups', toPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['all-groups'] });
      qc.invalidateQueries({ queryKey: ['reception-groups'] });
      closeModal();
      toast.success('Guruh muvaffaqiyatli yaratildi');
    },
    onError: (e) => toast.error(friendlyAiErrorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/groups/${id}`, toPayload(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['all-groups'] });
      qc.invalidateQueries({ queryKey: ['reception-groups'] });
      closeModal();
      toast.success('Guruh ma\'lumotlari yangilandi');
    },
    onError: (e) => toast.error(friendlyAiErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/groups/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['all-groups'] });
      qc.invalidateQueries({ queryKey: ['reception-groups'] });
      toast.success('Guruh o\'chirildi');
    },
    onError: (e) => toast.error(friendlyAiErrorMessage(e)),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingGroup(null);
    setForm(EMPTY_FORM);
  };

  const openCreate = () => {
    setEditingGroup(null);
    setForm({
      ...EMPTY_FORM,
      branchId: branches?.[0]?.id || '',
      teacherId: teachers?.[0]?.id || '',
    });
    setShowModal(true);
  };

  const openEdit = (e, g) => {
    e.stopPropagation();
    setEditingGroup(g);
    let parsedDays = ['mon', 'wed', 'fri'];
    if (g.weekDays) {
      try {
        parsedDays = Array.isArray(g.weekDays) ? g.weekDays : JSON.parse(g.weekDays);
      } catch {}
    }
    setForm({
      name: g.name || '',
      subject: g.subject || 'biology',
      teacherId: g.teacher?.id || g.teacherId || '',
      branchId: g.branch?.id || g.branchId || '',
      monthlyFee: g.monthlyFee ? String(g.monthlyFee) : '',
      weekDays: parsedDays,
      startTime: g.startTime || '14:00',
      endTime: g.endTime || '15:30',
      room: g.room || '',
      roomId: g.roomId || '',
      level: g.level || '',
      totalLessons: g.totalLessons ? String(g.totalLessons) : '',
    });
    setShowModal(true);
  };

  const handleDelete = (e, g) => {
    e.stopPropagation();
    setConfirm({
      title: `"${g.name}" guruhini o'chirish`,
      message: "Guruh nofaol holatga o'tkaziladi. O'quvchilari guruhsiz qolishi mumkin.",
      confirmText: "O'chirish",
      confirmVariant: "danger",
      onConfirm: () => deleteMutation.mutate(g.id),
    });
  };

  const toggleDay = (key) => {
    setForm(prev => {
      const exists = prev.weekDays.includes(key);
      const nextDays = exists
        ? prev.weekDays.filter(d => d !== key)
        : [...prev.weekDays, key];
      return { ...prev, weekDays: nextDays };
    });
  };

  const submitForm = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Guruh nomi kiritilishi shart');
    if (!form.teacherId) return toast.error('O\'qituvchi tanlanishi shart');

    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filteredGroups = Array.isArray(groups) ? groups.filter(g => {
    if (branchFilter && g.branch?.id !== branchFilter && g.branchId !== branchFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.name?.toLowerCase().includes(q) ||
      g.teacher?.name?.toLowerCase().includes(q) ||
      g.room?.toLowerCase().includes(q)
    );
  }) : [];

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="dashboard-shell">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />

      <PageHeader
        title="Guruhlar"
        subtitle={`Markazning barcha o'quv guruhlari (${filteredGroups.length} / ${groups.length})`}
        actions={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Guruh yaratish
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Guruh, o'qituvchi yoki xona bo'yicha qidirish..."
          />
        </div>

        {branches.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-400" />
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="input-field text-xs py-2 w-48"
            >
              <option value="">Barcha filiallar</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
      ) : filteredGroups?.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((g, i) => {
            const scheduleText = formatSchedule(g);
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="panel-card cursor-pointer group hover:border-[var(--primary)] hover:shadow-md transition-all relative flex flex-col justify-between"
                onClick={() => navigate(`/${user?.role === 'manager' ? 'manager' : 'admin'}/groups/${g.id}`)}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                        <BookOpen size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm group-hover:text-primary transition-colors truncate" style={{ color: 'var(--text-primary)' }}>
                          {g.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <span className={`badge text-[11px] ${getSubjectBadgeClass(g.subject)}`}>
                            {getSubjectLabel(g.subject)}
                          </span>
                          {g.level && (
                            <span className="badge text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">
                              {g.level}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={e => openEdit(e, g)}
                        className="btn-ghost p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title="Tahrirlash"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={e => handleDelete(e, g)}
                        className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                        title="O'chirish"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {scheduleText && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3 bg-gray-50 dark:bg-gray-850 px-2.5 py-1.5 rounded-lg">
                      <Clock size={12} className="text-primary flex-shrink-0" />
                      <span className="truncate">{scheduleText}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-3 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      <User size={13} style={{ color: 'var(--secondary)' }} /> O'qituvchi:
                    </span>
                    <span className="font-semibold truncate max-w-[140px]" style={{ color: 'var(--text-primary)' }}>
                      {g.teacher?.name || 'Biriktirilmagan'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      <Users size={13} style={{ color: 'var(--primary)' }} /> O'quvchilar:
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {g._count?.students || g.students?.length || 0} nafar
                    </span>
                  </div>

                  {g.monthlyFee > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                        <Wallet size={13} className="text-amber-500" /> To'lov:
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {Number(g.monthlyFee).toLocaleString()} so'm/oy
                      </span>
                    </div>
                  )}

                  {g.branch?.name && (
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Building2 size={11} /> {g.branch.name}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title={search ? "Guruh topilmadi" : "Guruhlar mavjud emas"}
          description={search ? `"${search}" so'rovi bo'yicha guruh topilmadi` : "Hozircha tizimda faol o'quv guruhlari yo'q. Yangi guruh qo'shish uchun tugmani bosing."}
          action={
            <button onClick={openCreate} className="btn-primary mt-3 flex items-center gap-2">
              <Plus size={16} /> Birinchi guruhni yaratish
            </button>
          }
        />
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      <AnimatePresence>
        {showModal && (
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
              className="rounded-3xl border p-6 sm:p-7 w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingGroup ? "Guruhni tahrirlash" : "Yangi guruh yaratish"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Guruh nomi, o'qituvchisi, dars jadvali va shartlarini belgilang
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

              <form onSubmit={submitForm} className="space-y-4 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Guruh nomi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="input-field text-sm"
                      placeholder="Masalan: Biologiya PRO-1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Fani <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      className="input-field text-sm"
                    >
                      {SUBJECTS.map(s => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                      O'qituvchi <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={form.teacherId}
                      onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
                      className="input-field text-sm"
                    >
                      <option value="">O'qituvchini tanlang</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Filial (bino)
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

                {/* Weekdays */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Haftalik dars kunlari
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {DAYS.map(d => {
                      const active = form.weekDays.includes(d.key);
                      return (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => toggleDay(d.key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            active
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lesson Time */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Dars vaqti (boshlanishi — tugashi)
                    </label>
                    <div className="text-[11px] text-gray-400">
                      Masalan: 14:00 - 15:30
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                      className="input-field text-sm"
                    />
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                      className="input-field text-sm"
                    />
                  </div>

                  {/* Quick time presets */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {TIME_PRESETS.map(p => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, startTime: p.start, endTime: p.end }))}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Room, Monthly Fee, Level */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Xona
                    </label>
                    {rooms.length > 0 ? (
                      <select
                        value={form.roomId || ''}
                        onChange={e => {
                          const r = rooms.find(x => x.id === e.target.value);
                          setForm(f => ({ ...f, roomId: e.target.value, room: r?.name || '' }));
                        }}
                        className="input-field text-sm"
                      >
                        <option value="">Tanlang</option>
                        {rooms.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.room}
                        onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                        placeholder="Masalan: 204-xona"
                        className="input-field text-sm"
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Oylik to'lov (so'm)
                    </label>
                    <input
                      type="number"
                      value={form.monthlyFee}
                      onChange={e => setForm(f => ({ ...f, monthlyFee: e.target.value }))}
                      placeholder="400000"
                      className="input-field text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Daraja / Bosqich
                    </label>
                    <input
                      type="text"
                      value={form.level}
                      onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                      placeholder="Boshlang'ich"
                      className="input-field text-sm"
                    />
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
                    disabled={isSaving}
                    className="btn-primary px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2"
                  >
                    {isSaving ? "Saqlanmoqda..." : editingGroup ? "O'zgarishlarni saqlash" : "Guruh yaratish"}
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
