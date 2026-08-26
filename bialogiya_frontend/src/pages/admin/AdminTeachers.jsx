import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, X, UserCheck, Pencil, Trash2, Save, Users, GraduationCap, Phone, BookOpen, ShieldCheck } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useAuthStore } from '../../store/authStore';
import { formatUzPhone } from '../../utils/formatPhone';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';

export default function AdminTeachers() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', language: 'uz' });
  const [newCreds, setNewCreds] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const { user } = useAuthStore();

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['all-teachers'],
    queryFn: () => api.get('/admin/teachers').then(r => r.data?.data || []),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-list'],
    queryFn: () => api.get(user?.role === 'reception' ? '/reception/branches' : '/admin/branches')
      .then(r => r.data?.data || r.data || [])
      .catch(() => []),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/admin/teachers', d),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['all-teachers'] });
      setNewCreds(data.data.credentials);
      setForm({ name: '', phone: '', email: '', language: 'uz', branchId: '' });
      toast.success("O'qituvchi muvaffaqiyatli qo'shildi");
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/teachers/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-teachers'] });
      toast.success("O'qituvchi ma'lumotlari yangilandi");
      setEditingId(null);
      setSelectedTeacher(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/teachers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-teachers'] });
      toast.success("O'qituvchi o'chirildi");
      setSelectedTeacher(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-teachers'] }),
  });

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Nusxalandi!'); };

  const openEdit = (t) => {
    setEditingId(t.id);
    setEditForm({ name: t.name, phone: t.phone || '', email: t.email || '' });
    setSelectedTeacher(null);
  };

  const handleDelete = (t) => {
    setConfirm({
      title: `"${t.name}"ni o'chirish`,
      message: "O'qituvchi hisobi to'liq yashiriladi va tizimga kira olmaydi.",
      warning: "Guruhlarni oldin boshqa o'qituvchiga biriktiring.",
      onConfirm: () => deleteMutation.mutate(t.id),
    });
  };

  const filteredTeachers = (Array.isArray(teachers) ? teachers : []).filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.username?.toLowerCase().includes(search.toLowerCase()) ||
    t.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-shell">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />

      <PageHeader
        title="O'qituvchilar"
        subtitle="Markaz o'qituvchilari, ularning guruhlari va dars faoliyati"
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} /> O'qituvchi qo'shish
          </button>
        }
      />

      <div className="filter-bar mb-1">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Ism, username yoki telefon bo'yicha qidirish..."
        />
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          {filteredTeachers.length} ta o'qituvchi
        </span>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
      ) : filteredTeachers.length > 0 ? (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>O'qituvchi</th>
                <th>Telefon</th>
                <th>Guruhlar</th>
                <th>O'quvchilar</th>
                <th>Holat</th>
                <th className="text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((t, index) => {
                const isEditing = editingId === t.id;
                if (isEditing) {
                  return (
                    <tr key={t.id} style={{ backgroundColor: 'var(--secondary-background)' }}>
                      <td colSpan={6} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm" style={{ color: 'var(--primary)' }}>Tahrirlash: {t.name}</span>
                            <button onClick={() => setEditingId(null)} className="btn-icon">
                              <X size={15} />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="form-label">Ismi *</label>
                              <input
                                value={editForm.name}
                                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                className="input-field"
                                placeholder="To'liq ismi"
                              />
                            </div>
                            <div>
                              <label className="form-label">Telefon</label>
                              <input
                                value={editForm.phone}
                                onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                                className="input-field font-mono"
                                placeholder="+998 90 123 45 67"
                              />
                            </div>
                            <div>
                              <label className="form-label">Email</label>
                              <input
                                value={editForm.email}
                                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                                className="input-field"
                                placeholder="email@example.com"
                                type="email"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setEditingId(null)} className="btn-ghost btn-sm">Bekor qilish</button>
                            <button
                              onClick={() => editForm.name && updateMutation.mutate({ id: t.id, data: editForm })}
                              disabled={!editForm.name || updateMutation.isPending}
                              className="btn-primary btn-sm"
                            >
                              <Save size={13} /> {updateMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedTeacher(t)}
                        className="flex items-center gap-3 text-left group"
                      >
                        <div className="avatar avatar-md">
                          {t.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm group-hover:text-primary transition-colors" style={{ color: 'var(--text-primary)' }}>
                            {t.name}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            @{t.username}
                          </div>
                        </div>
                      </button>
                    </td>
                    <td>
                      <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {t.phone || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="font-semibold text-sm">
                        {t._count?.taughtGroups || 0}
                      </span>
                    </td>
                    <td>
                      <span className="font-semibold text-sm">
                        {t._count?.students || 0}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleMutation.mutate(t.id)}
                        className="cursor-pointer transition-transform active:scale-95"
                      >
                        <StatusBadge status={t.isActive ? 'faol' : 'nofaol'} />
                      </button>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          className="btn-icon"
                          title="Tahrirlash"
                        >
                          <Pencil size={14} style={{ color: 'var(--secondary)' }} />
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          className="btn-icon"
                          title="O'chirish"
                        >
                          <Trash2 size={14} style={{ color: 'var(--error)' }} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={UserCheck}
          title={search ? "O'qituvchi topilmadi" : "Hozircha o'qituvchilar yo'q"}
          description={search ? `"${search}" bo'yicha hech qanday o'qituvchi mavjud emas` : "Tizimga yangi o'qituvchi qo'shing"}
          action={!search && (
            <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm">
              <Plus size={14} /> O'qituvchi qo'shish
            </button>
          )}
        />
      )}

      {/* Teacher detail modal */}
      <AnimatePresence>
        {selectedTeacher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={e => e.target === e.currentTarget && setSelectedTeacher(null)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 8, opacity: 0 }}
              className="modal-panel max-w-sm"
            >
              <div className="modal-header">
                <h2 className="modal-title">O'qituvchi ma'lumoti</h2>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(selectedTeacher)} className="btn-icon" title="Tahrirlash">
                    <Pencil size={14} style={{ color: 'var(--secondary)' }} />
                  </button>
                  <button onClick={() => handleDelete(selectedTeacher)} className="btn-icon" title="O'chirish">
                    <Trash2 size={14} style={{ color: 'var(--error)' }} />
                  </button>
                  <button onClick={() => setSelectedTeacher(null)} className="btn-icon">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center mb-5 text-center">
                <div className="avatar avatar-xl mb-2.5">
                  {selectedTeacher.name?.charAt(0)?.toUpperCase()}
                </div>
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{selectedTeacher.name}</h3>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>@{selectedTeacher.username}</span>
                <div className="mt-2">
                  <StatusBadge status={selectedTeacher.isActive ? 'faol' : 'nofaol'} />
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--secondary-background)' }}>
                  <div className="flex items-center gap-2.5">
                    <Phone size={15} style={{ color: 'var(--primary)' }} />
                    <div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Telefon</div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedTeacher.phone || '—'}</div>
                    </div>
                  </div>
                  {selectedTeacher.phone && (
                    <button onClick={() => copy(selectedTeacher.phone)} className="btn-icon" title="Nusxalash">
                      <Copy size={13} style={{ color: 'var(--primary)' }} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      const role = user?.role === 'manager' ? 'manager' : location.pathname.startsWith('/admin') ? 'admin' : 'reception';
                      navigate(`/${role}/teachers/${selectedTeacher.id}?tab=groups`);
                    }}
                    className="p-3 rounded-xl text-center transition-colors"
                    style={{ backgroundColor: 'var(--secondary-background)' }}
                  >
                    <Users size={16} className="mx-auto mb-1" style={{ color: 'var(--primary)' }} />
                    <div className="font-bold text-base" style={{ color: 'var(--primary)' }}>{selectedTeacher._count?.taughtGroups || 0}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Guruh</div>
                  </button>
                  <button
                    onClick={() => {
                      const role = user?.role === 'manager' ? 'manager' : location.pathname.startsWith('/admin') ? 'admin' : 'reception';
                      navigate(`/${role}/teachers/${selectedTeacher.id}?tab=students`);
                    }}
                    className="p-3 rounded-xl text-center transition-colors"
                    style={{ backgroundColor: 'var(--secondary-background)' }}
                  >
                    <GraduationCap size={16} className="mx-auto mb-1" style={{ color: 'var(--secondary)' }} />
                    <div className="font-bold text-base" style={{ color: 'var(--secondary)' }}>{selectedTeacher._count?.students || 0}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>O'quvchi</div>
                  </button>
                  <button
                    onClick={() => {
                      const role = user?.role === 'manager' ? 'manager' : location.pathname.startsWith('/admin') ? 'admin' : 'reception';
                      navigate(`/${role}/teachers/${selectedTeacher.id}?tab=lessons`);
                    }}
                    className="p-3 rounded-xl text-center transition-colors"
                    style={{ backgroundColor: 'var(--secondary-background)' }}
                  >
                    <BookOpen size={16} className="mx-auto mb-1" style={{ color: 'var(--success)' }} />
                    <div className="font-bold text-base" style={{ color: 'var(--success)' }}>{selectedTeacher._count?.lessons || 0}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Dars</div>
                  </button>
                </div>
              </div>

              <button
                onClick={() => { toggleMutation.mutate(selectedTeacher.id); setSelectedTeacher(null); }}
                className="btn-ghost w-full justify-center text-xs"
                style={{ border: '1px solid var(--border)' }}
              >
                {selectedTeacher.isActive ? 'Hisobni nofaol qilish' : 'Hisobni faollashtirish'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create teacher modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={e => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 8, opacity: 0 }}
              className="modal-panel max-w-md"
            >
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">O'qituvchi qo'shish</h2>
                  <p className="modal-subtitle">Yangi o'qituvchi hisobini yaratish</p>
                </div>
                <button onClick={() => { setShowCreate(false); setNewCreds(null); }} className="btn-icon flex-shrink-0">
                  <X size={18} />
                </button>
              </div>

              {newCreds ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                    <ShieldCheck size={36} className="mx-auto mb-2" style={{ color: 'var(--success)' }} />
                    <h3 className="font-bold text-base" style={{ color: 'var(--success)' }}>O'qituvchi qo'shildi!</h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Ushbu kirish ma'lumotlarini o'qituvchiga taqdim eting.</p>
                  </div>
                  
                  <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
                    {[['Login', newCreds.username], ['Parol', newCreds.password]].map(([label, val]) => (
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
                  
                  <button onClick={() => setNewCreds(null)} className="btn-primary w-full">
                    Yana qo'shish
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="form-label">To'liq ismi *</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="O'qituvchi ismi va familiyasi"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="form-label">Telefon raqami</label>
                    <input
                      value={form.phone || '+998 '}
                      onChange={e => setForm(f => ({ ...f, phone: formatUzPhone(e.target.value) }))}
                      onFocus={() => { if (!form.phone || form.phone.trim() === '+998') setForm(f => ({ ...f, phone: '+998 ' })); }}
                      placeholder="+998 (90) 200-20-20"
                      type="tel"
                      className="input-field font-mono"
                    />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="email@example.com"
                      type="email"
                      className="input-field"
                    />
                  </div>
                  {branches?.length > 0 && (
                    <div>
                      <label className="form-label">Markaz (Filial)</label>
                      <select
                        value={form.branchId || ''}
                        onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
                        className="input-field"
                      >
                        <option value="">Standart filial</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="form-label">Til</label>
                    <select
                      value={form.language}
                      onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                      className="input-field"
                    >
                      <option value="uz">O'zbek</option>
                      <option value="ru">Русский</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div className="modal-footer">
                    <button onClick={() => setShowCreate(false)} className="btn-ghost">Bekor qilish</button>
                    <button
                      onClick={() => form.name && createMutation.mutate(form)}
                      disabled={!form.name || createMutation.isPending}
                      className="btn-primary"
                    >
                      {createMutation.isPending ? 'Qo\'shilmoqda...' : 'Qo\'shish'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
