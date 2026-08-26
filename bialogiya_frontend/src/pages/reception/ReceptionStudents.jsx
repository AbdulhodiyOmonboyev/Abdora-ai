import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, X, GraduationCap, Trash2, Search, Phone, Users } from 'lucide-react';
import api from '../../config/axios';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { getLevelProgress } from '../../utils/format';

import { formatUzPhone } from '../../utils/formatPhone';

export default function ReceptionStudents() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', groupId: '', phone: '+998 ', language: 'uz' });
  const [newCreds, setNewCreds] = useState(null);
  const [branchFilter, setBranchFilter] = useState('');
  const [filterGroupId, setFilterGroupId] = useState('');
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);

  const { data: branches = [] } = useQuery({
    queryKey: ['reception-branches-for-filter'],
    queryFn: () => api.get('/reception/branches').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['reception-groups'],
    queryFn: () => api.get('/reception/groups').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
  });

  const visibleGroups = branchFilter
    ? (Array.isArray(groups) ? groups.filter(g => g.branch?.id === branchFilter) : [])
    : groups;

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['reception-students', branchFilter, filterGroupId],
    queryFn: () => api.get('/admin/students', {
      params: {
        ...(branchFilter && { branchId: branchFilter }),
        ...(filterGroupId && { groupId: filterGroupId }),
      }
    }).then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/users/create-student', d),
    onSuccess: ({ data }) => {
      qc.invalidateQueries(['reception-students']);
      qc.invalidateQueries(['reception-group-detail']);
      qc.invalidateQueries(['reception-groups']);
      qc.invalidateQueries(['all-students']);
      setNewCreds(data.data.credentials);
      setForm({ name: '', groupId: form.groupId || '', phone: '', language: 'uz' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['reception-students']);
      qc.invalidateQueries(['reception-group-detail']);
      qc.invalidateQueries(['reception-groups']);
      qc.invalidateQueries(['all-students']);
    },
  });

  const copy = (text) => navigator.clipboard.writeText(text);

  const handleDelete = (s) => {
    setConfirm({
      title: `"${s.name}"ni o'chirish`,
      message: "O'quvchi tizimdan to'liq o'chiriladi.",
      onConfirm: () => deleteMutation.mutate(s.id),
    });
  };

  const filteredStudents = Array.isArray(students) ? students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.username?.toLowerCase().includes(q) || s.phone?.includes(q);
  }) : [];

  return (
    <div className="dashboard-shell max-w-4xl mx-auto">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />

      <header className="dashboard-header dashboard-header-plain">
        <div>
          <span className="dashboard-badge"><GraduationCap size={12} /> Reception</span>
          <h1>O'quvchilar</h1>
          <p>O'quvchilarni boshqarish va yangi o'quvchi qo'shish</p>
        </div>
        <button
          onClick={() => { setForm(f => ({ ...f, groupId: filterGroupId })); setShowCreate(true); }}
          className="btn-primary flex items-center gap-2">
          <Plus size={15} /> O'quvchi qo'shish
        </button>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ismi yoki nik bilan qidirish..."
            className="input-field pl-10 text-sm"
          />
        </div>

        {branches?.length > 1 ? (
          <select
            value={branchFilter}
            onChange={e => { setBranchFilter(e.target.value); setFilterGroupId(''); }}
            className="input-field text-sm">
            <option value="">Barcha markazlar</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        ) : <div />}

        <select
          value={filterGroupId}
          onChange={e => setFilterGroupId(e.target.value)}
          className="input-field text-sm">
          <option value="">Barcha guruhlar</option>
          {visibleGroups?.map(g => <option key={g.id} value={g.id}>{g.name}{g.branch ? ` — ${g.branch.name}` : ''}</option>)}
        </select>
      </div>

      {/* Student List */}
      <div className="space-y-2">
        {filteredStudents.map((s, i) => {
          const { level } = getLevelProgress(s.xp || 0);
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="panel-card flex items-center gap-3">
              <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {s.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <span>{s.name}</span>
                  <span className="badge bg-primary/10 text-primary text-[11px] font-medium">Lv.{level}</span>
                </div>
                <div className="text-xs text-[var(--text-muted)] flex items-center gap-2 flex-wrap mt-0.5">
                  <span>@{s.username}</span>
                  {s.group ? (
                    <span className="flex items-center gap-1 text-primary">
                      <Users size={11} /> {s.group.name}
                    </span>
                  ) : <span className="italic text-amber-500">Guruhsiz</span>}
                  {s.phone && (
                    <span className="flex items-center gap-0.5">
                      <Phone size={10} /> {s.phone}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => handleDelete(s)} className="btn-ghost p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10" title="O'chirish">
                <Trash2 size={14} />
              </button>
            </motion.div>
          );
        })}

        {filteredStudents.length === 0 && (
          <div className="text-center py-16 text-[var(--text-muted)]">
            <GraduationCap size={36} className="mx-auto mb-3 opacity-30" />
            <p>{isLoading ? 'Yuklanmoqda...' : search ? 'Qidiruv bo\'yicha o\'quvchi topilmadi.' : 'Hali o\'quvchilar yo\'q.'}</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-[var(--card)] dark:bg-gray-900 border border-[var(--border)] dark:border-transparent rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-gray-800 dark:text-white">O'quvchi qo'shish</h2>
                <button onClick={() => { setShowCreate(false); setNewCreds(null); }} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
              </div>

              {newCreds ? (
                <div>
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🎉</div>
                    <h3 className="font-bold text-green-600">O'quvchi qo'shildi!</h3>
                    <p className="text-sm text-gray-500 mt-1">Bu ma'lumotlarni o'quvchiga taqdim eting</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                    {[['Login', newCreds.username], ['Parol', newCreds.password]].map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500">{label}</div>
                          <div className="font-mono font-bold text-sm">{val}</div>
                        </div>
                        <button onClick={() => copy(val)} className="btn-ghost p-1.5 rounded-lg"><Copy size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setNewCreds(null)} className="btn-primary w-full mt-4">Yana qo'shish</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">To'liq ismi *</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="O'quvchi ismi familiyasi"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Guruh</label>
                    <select
                      value={form.groupId}
                      onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}
                      className="input-field">
                      <option value="">Guruhsiz (Filial o'quvchisi)</option>
                      {visibleGroups?.map(g => <option key={g.id} value={g.id}>{g.name}{g.branch ? ` — ${g.branch.name}` : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Telefon raqami (Ixtiyoriy)</label>
                    <input
                      value={form.phone || '+998 '}
                      onChange={e => setForm(f => ({ ...f, phone: formatUzPhone(e.target.value) }))}
                      onFocus={e => { if (!form.phone || form.phone.trim() === '+998') setForm(f => ({ ...f, phone: '+998 ' })); }}
                      placeholder="+998 (90) 200-20-20"
                      type="tel"
                      className="input-field font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Til</label>
                    <select
                      value={form.language}
                      onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                      className="input-field">
                      <option value="uz">O'zbek</option>
                      <option value="ru">Русский</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Bekor</button>
                    <button
                      onClick={() => form.name && createMutation.mutate(form)}
                      disabled={!form.name || createMutation.isPending}
                      className="btn-primary flex-1 disabled:opacity-40">
                      {createMutation.isPending ? "Qo'shilmoqda..." : "Qo'shish"}
                    </button>
                  </div>
                  {createMutation.isError && (
                    <p className="text-xs text-red-500 text-center">{friendlyAiErrorMessage(createMutation.error)}</p>
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
