import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, X, UserCheck, Pencil, Trash2, Save, Users, GraduationCap, Phone, BookOpen, ShieldCheck, Eye, ArrowUpRight, Wallet } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useAuthStore } from '../../store/authStore';
import { formatUzPhone, cleanPhone } from '../../utils/formatPhone';
import PhoneInput from '../../components/ui/PhoneInput';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';

const SHARE_PRESETS = [
  { share: 30, label: '30%' },
  { share: 40, label: '40%' },
  { share: 50, label: '50% (standart)' },
  { share: 60, label: '60%' },
  { share: 70, label: '70%' },
];

const FIXED_PRESETS = [
  { amount: 3000000, label: '3 mln' },
  { amount: 5000000, label: '5 mln' },
  { amount: 7000000, label: '7 mln' },
  { amount: 10000000, label: '10 mln' },
];

const HOURLY_PRESETS = [
  { rate: 50000, label: '50 000' },
  { rate: 80000, label: '80 000' },
  { rate: 100000, label: '100 000' },
  { rate: 150000, label: '150 000' },
];

export default function AdminTeachers() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '+998 ',
    email: '',
    language: 'uz',
    branchId: '',
    salaryType: 'percent',
    salaryShare: 50,
    fixedSalary: '',
    hourlyRate: '',
  });
  const [newCreds, setNewCreds] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const { user } = useAuthStore();
  const baseRole = user?.role === 'manager' ? 'manager' : location.pathname.startsWith('/admin') ? 'admin' : 'reception';

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
      setForm({
        name: '',
        phone: '+998 ',
        email: '',
        language: 'uz',
        branchId: '',
        salaryType: 'percent',
        salaryShare: 50,
        fixedSalary: '',
        hourlyRate: '',
      });
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
    setEditForm({
      name: t.name,
      phone: t.phone || '+998 ',
      email: t.email || '',
      salaryType: t.salaryType || 'percent',
      salaryShare: t.salaryShare ?? 50,
      fixedSalary: t.fixedSalary || '',
      hourlyRate: t.hourlyRate || '',
    });
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
                <th>Maosh sharti</th>
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
                      <td colSpan={7} className="p-4">
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
                              <PhoneInput
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

                          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                <Wallet size={13} style={{ color: 'var(--primary)' }} />
                                Maosh hisoblash sharti
                              </span>
                              <div className="flex items-center gap-1">
                                {[
                                  { id: 'percent', label: 'Foiz' },
                                  { id: 'fixed', label: 'Qat\'iy' },
                                  { id: 'hourly', label: 'Soatbay' },
                                ].map(m => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setEditForm(f => ({ ...f, salaryType: m.id }))}
                                    className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                                      editForm.salaryType === m.id
                                        ? 'border-[var(--primary)] bg-[var(--primary-50)] text-[var(--primary)] font-bold'
                                        : 'border-[var(--border)] text-[var(--text-secondary)]'
                                    }`}
                                  >
                                    {m.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {editForm.salaryType === 'percent' && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <label className="text-xs text-[var(--text-secondary)] whitespace-nowrap">Ulush (%):</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={editForm.salaryShare}
                                  onChange={e => setEditForm(f => ({ ...f, salaryShare: e.target.value }))}
                                  className="input-field py-1 font-bold text-xs max-w-[80px]"
                                />
                                <div className="flex gap-1">
                                  {[30, 40, 50, 60, 70].map(s => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => setEditForm(f => ({ ...f, salaryShare: s }))}
                                      className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                        Number(editForm.salaryShare) === s
                                          ? 'border-[var(--primary)] text-[var(--primary)] font-bold'
                                          : 'border-[var(--border)] text-[var(--text-muted)]'
                                      }`}
                                    >
                                      {s}%
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {editForm.salaryType === 'fixed' && (
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-[var(--text-secondary)] whitespace-nowrap">Oylik summa:</label>
                                <input
                                  type="number"
                                  step="100000"
                                  value={editForm.fixedSalary}
                                  onChange={e => setEditForm(f => ({ ...f, fixedSalary: e.target.value }))}
                                  className="input-field py-1 font-bold text-xs max-w-[160px]"
                                  placeholder="Masalan: 5000000"
                                />
                                <span className="text-xs text-[var(--text-muted)]">so'm/oy</span>
                              </div>
                            )}

                            {editForm.salaryType === 'hourly' && (
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-[var(--text-secondary)] whitespace-nowrap">Soatlik stavka:</label>
                                <input
                                  type="number"
                                  step="10000"
                                  value={editForm.hourlyRate}
                                  onChange={e => setEditForm(f => ({ ...f, hourlyRate: e.target.value }))}
                                  className="input-field py-1 font-bold text-xs max-w-[160px]"
                                  placeholder="Masalan: 100000"
                                />
                                <span className="text-xs text-[var(--text-muted)]">so'm/soat</span>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setEditingId(null)} className="btn-ghost btn-sm">Bekor qilish</button>
                            <button
                              onClick={() => editForm.name && updateMutation.mutate({
                                id: t.id,
                                data: {
                                  ...editForm,
                                  phone: cleanPhone(editForm.phone),
                                  salaryShare: editForm.salaryType === 'percent' ? Number(editForm.salaryShare || 50) : undefined,
                                  fixedSalary: editForm.salaryType === 'fixed' && editForm.fixedSalary ? Number(editForm.fixedSalary) : null,
                                  hourlyRate: editForm.salaryType === 'hourly' && editForm.hourlyRate ? Number(editForm.hourlyRate) : null,
                                },
                              })}
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
                        onClick={() => navigate(`/${baseRole}/teachers/${t.id}`)}
                        className="flex items-center gap-3 text-left group cursor-pointer"
                        title="O'qituvchi profilini ochish"
                      >
                        <div className="avatar avatar-md group-hover:scale-105 transition-transform">
                          {t.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm group-hover:text-[var(--primary)] transition-colors flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                            <span>{t.name}</span>
                            <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--primary)]" />
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
                      <span
                        className="badge badge-gray text-xs font-semibold flex items-center gap-1 w-fit cursor-pointer hover:border-[var(--primary)] transition-colors"
                        title="Maosh shartlarini ko'rish va boshqarish"
                        onClick={() => navigate(`/${baseRole}/teachers/${t.id}`)}
                      >
                        <Wallet size={11} style={{ color: 'var(--primary)' }} />
                        {t.salaryType === 'fixed'
                          ? `${Number(t.fixedSalary || 0).toLocaleString()} so'm/oy`
                          : t.salaryType === 'hourly'
                          ? `${Number(t.hourlyRate || 0).toLocaleString()} so'm/soat`
                          : `${t.salaryShare ?? 50}% ulush`}
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
                          onClick={() => navigate(`/${baseRole}/teachers/${t.id}`)}
                          className="btn-icon"
                          title="Profil va to'lovlar tarixi"
                        >
                          <Eye size={14} style={{ color: 'var(--primary)' }} />
                        </button>
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

                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--secondary-background)' }}>
                  <div className="flex items-center gap-2.5">
                    <Wallet size={15} style={{ color: 'var(--primary)' }} />
                    <div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Maosh sharti</div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {selectedTeacher.salaryType === 'fixed'
                          ? `${Number(selectedTeacher.fixedSalary || 0).toLocaleString()} so'm/oy`
                          : selectedTeacher.salaryType === 'hourly'
                          ? `${Number(selectedTeacher.hourlyRate || 0).toLocaleString()} so'm/soat`
                          : `${selectedTeacher.salaryShare ?? 50}% ulush (to'lovlardan)`}
                      </div>
                    </div>
                  </div>
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
                onClick={() => {
                  const role = user?.role === 'manager' ? 'manager' : location.pathname.startsWith('/admin') ? 'admin' : 'reception';
                  navigate(`/${role}/teachers/${selectedTeacher.id}`);
                }}
                className="btn-primary w-full justify-center text-xs py-2.5 mb-2 gap-2"
              >
                <Eye size={15} />
                To'liq profil va to'lovlar sahifasi
                <ArrowUpRight size={14} />
              </button>

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
              className="modal-panel max-w-lg max-h-[90vh] flex flex-col p-5"
            >
              <div className="modal-header flex-shrink-0">
                <div>
                  <h2 className="modal-title">O'qituvchi qo'shish</h2>
                  <p className="modal-subtitle">Yangi o'qituvchi hisobi va maosh shartlarini belgilash</p>
                </div>
                <button onClick={() => { setShowCreate(false); setNewCreds(null); }} className="btn-icon flex-shrink-0">
                  <X size={18} />
                </button>
              </div>

              {newCreds ? (
                <div className="space-y-4 overflow-y-auto pr-1">
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                    <ShieldCheck size={36} className="mx-auto mb-2" style={{ color: 'var(--success)' }} />
                    <h3 className="font-bold text-base" style={{ color: 'var(--success)' }}>O'qituvchi qo'shildi!</h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Ushbu kirish ma'lumotlarini o'qituvchiga taqdim eting.</p>
                  </div>

                  <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
                    {[
                      ['Login', newCreds.username],
                      ['Parol', newCreds.password],
                      ['Filial', branches?.find(b => b.id === form.branchId)?.name || 'Standart filial'],
                      [
                        'Maosh sharti',
                        form.salaryType === 'fixed'
                          ? `${Number(form.fixedSalary || 0).toLocaleString()} so'm/oy`
                          : form.salaryType === 'hourly'
                          ? `${Number(form.hourlyRate || 0).toLocaleString()} so'm/soat`
                          : `${form.salaryShare || 50}% ulush (to'lovlardan)`,
                      ],
                    ].map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between">
                        <div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
                          <div className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{val}</div>
                        </div>
                        {['Login', 'Parol'].includes(label) && (
                          <button onClick={() => copy(val)} className="btn-icon" title="Nusxalash">
                            <Copy size={14} style={{ color: 'var(--primary)' }} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        setNewCreds(null);
                        setForm({
                          name: '',
                          phone: '+998 ',
                          email: '',
                          language: 'uz',
                          branchId: '',
                          salaryType: 'percent',
                          salaryShare: 50,
                          fixedSalary: '',
                          hourlyRate: '',
                        });
                      }}
                      className="btn-ghost w-full justify-center"
                    >
                      Yana qo'shish
                    </button>
                    <button
                      onClick={() => {
                        setNewCreds(null);
                        setShowCreate(false);
                      }}
                      className="btn-primary w-full justify-center"
                    >
                      Tushunarli
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                  <div>
                    <label className="form-label">To'liq ismi *</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="O'qituvchi ismi va familiyasi"
                      className="input-field"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Telefon raqami</label>
                      <PhoneInput
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        className="input-field font-mono"
                        placeholder="+998 90 123 45 67"
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {branches?.length > 0 ? (
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
                    ) : (
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
                    )}
                    {branches?.length > 0 && (
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
                    )}
                  </div>

                  {/* Maosh shartlari bo'limi */}
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--secondary-background)] space-y-3 mt-1">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--border)]">
                      <div className="w-7 h-7 rounded-lg bg-[var(--primary-50)] text-[var(--primary)] flex items-center justify-center flex-shrink-0">
                        <Wallet size={15} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>Maosh hisoblash shartlari</h4>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>O'qituvchiga qanday tartibda maosh hisoblanadi</p>
                      </div>
                    </div>

                    <div>
                      <label className="form-label mb-1.5">Hisoblash usuli</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'percent', label: 'Foiz (Ulush)' },
                          { id: 'fixed', label: 'Qat\'iy oylik' },
                          { id: 'hourly', label: 'Soatbay' },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, salaryType: m.id }))}
                            className={`p-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                              form.salaryType === m.id
                                ? 'border-[var(--primary)] bg-[var(--primary-50)] text-[var(--primary)] shadow-sm'
                                : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--card)]'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {form.salaryType === 'percent' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="form-label mb-0">O'quvchi to'lovidan o'qituvchi ulushi (%)</label>
                          <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>{form.salaryShare}%</span>
                        </div>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={form.salaryShare}
                          onChange={(e) => setForm((f) => ({ ...f, salaryShare: e.target.value }))}
                          className="input-field font-mono font-bold"
                          placeholder="50"
                        />
                        <div className="grid grid-cols-5 gap-1.5">
                          {SHARE_PRESETS.map((p) => (
                            <button
                              key={p.share}
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, salaryShare: p.share }))}
                              className={`p-1.5 rounded-lg text-xs border text-center transition-all ${
                                Number(form.salaryShare) === p.share
                                  ? 'border-[var(--primary)] bg-[var(--primary-50)] text-[var(--primary)] font-bold'
                                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--card)]'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          O'quvchilar to'lagan har bir oylik badalning {form.salaryShare || 50}% qismi avtomatik o'qituvchining maosh hisobiga yoziladi.
                        </p>
                      </div>
                    )}

                    {form.salaryType === 'fixed' && (
                      <div className="space-y-2">
                        <label className="form-label mb-0">Oylik qat'iy maosh summasi (so'm)</label>
                        <input
                          type="number"
                          min="0"
                          step="100000"
                          value={form.fixedSalary}
                          onChange={(e) => setForm((f) => ({ ...f, fixedSalary: e.target.value }))}
                          className="input-field font-mono font-bold"
                          placeholder="Masalan: 5 000 000"
                        />
                        <div className="grid grid-cols-4 gap-1.5">
                          {FIXED_PRESETS.map((p) => (
                            <button
                              key={p.amount}
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, fixedSalary: p.amount }))}
                              className={`p-1.5 rounded-lg text-xs border text-center transition-all ${
                                Number(form.fixedSalary) === p.amount
                                  ? 'border-[var(--primary)] bg-[var(--primary-50)] text-[var(--primary)] font-bold'
                                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--card)]'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          Har oy o'quvchilar sonidan qat'i nazar o'qituvchiga belgilangan qat'iy summa hisoblanadi.
                        </p>
                      </div>
                    )}

                    {form.salaryType === 'hourly' && (
                      <div className="space-y-2">
                        <label className="form-label mb-0">Bir soatlik dars stavkasi (so'm)</label>
                        <input
                          type="number"
                          min="0"
                          step="10000"
                          value={form.hourlyRate}
                          onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))}
                          className="input-field font-mono font-bold"
                          placeholder="Masalan: 100 000"
                        />
                        <div className="grid grid-cols-4 gap-1.5">
                          {HOURLY_PRESETS.map((p) => (
                            <button
                              key={p.rate}
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, hourlyRate: p.rate }))}
                              className={`p-1.5 rounded-lg text-xs border text-center transition-all ${
                                Number(form.hourlyRate) === p.rate
                                  ? 'border-[var(--primary)] bg-[var(--primary-50)] text-[var(--primary)] font-bold'
                                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--card)]'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          O'qituvchi o'tgan har 1 soatlik dars mashg'uloti uchun ushbu summa hisoblanadi.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="modal-footer pt-3 border-t border-[var(--border)] flex-shrink-0">
                    <button onClick={() => setShowCreate(false)} className="btn-ghost">Bekor qilish</button>
                    <button
                      onClick={() => {
                        if (!form.name) return;
                        createMutation.mutate({
                          ...form,
                          phone: cleanPhone(form.phone),
                          salaryShare: form.salaryType === 'percent' ? Number(form.salaryShare || 50) : undefined,
                          fixedSalary: form.salaryType === 'fixed' && form.fixedSalary ? Number(form.fixedSalary) : null,
                          hourlyRate: form.salaryType === 'hourly' && form.hourlyRate ? Number(form.hourlyRate) : null,
                        });
                      }}
                      disabled={!form.name || createMutation.isPending}
                      className="btn-primary"
                    >
                      {createMutation.isPending ? 'Qo\'shilmoqda...' : 'O\'qituvchi qo\'shish'}
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
