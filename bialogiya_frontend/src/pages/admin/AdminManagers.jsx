import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, X, User, Trash2, Edit2, ShieldCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import { formatUzPhone } from '../../utils/formatPhone';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';

const EMPTY_FORM = { name: '', phone: '', email: '', language: 'uz', gender: '', age: '', address: '', branchId: '' };
const EMPTY_EDIT_FORM = { name: '', phone: '', email: '', gender: '', age: '', address: '' };

export default function AdminManagers() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [newCreds, setNewCreds] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['admin-managers'],
    queryFn: () => api.get('/users').then(r => {
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

  const managers = Array.isArray(users)
    ? users.filter((u) => u.role === 'manager' && u.isActive !== false)
    : [];

  const filteredManagers = managers.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.username?.toLowerCase().includes(search.toLowerCase()) ||
    m.phone?.toLowerCase().includes(search.toLowerCase()) ||
    m.branch?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/users/create-manager', data),
    onSuccess: ({ data }) => {
      qc.invalidateQueries(['admin-managers']);
      setNewCreds(data.data.credentials);
      setForm(EMPTY_FORM);
      toast.success('Manager muvaffaqiyatli yaratildi');
    },
    onError: (error) => toast.error(friendlyAiErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/users/managers/${editingManager.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-managers']);
      setShowEdit(false);
      setEditingManager(null);
      setEditForm(EMPTY_EDIT_FORM);
      toast.success('Manager maʼlumotlari yangilandi');
    },
    onError: (error) => toast.error(friendlyAiErrorMessage(error)),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries(['admin-managers']),
    onError: (error) => toast.error(friendlyAiErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/managers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['admin-managers']);
      toast.success("Manager o'chirildi");
    },
    onError: (error) => toast.error(friendlyAiErrorMessage(error)),
  });

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Nusxalandi!');
  };

  const closeModal = () => {
    setShowCreate(false);
    setForm(EMPTY_FORM);
    setNewCreds(null);
  };

  const closeEditModal = () => {
    setShowEdit(false);
    setEditingManager(null);
    setEditForm(EMPTY_EDIT_FORM);
  };

  const openEdit = (manager) => {
    setEditingManager(manager);
    setEditForm({
      name: manager.name,
      phone: manager.phone || '',
      email: manager.email || '',
      gender: manager.gender || '',
      age: manager.age || '',
      address: manager.address || '',
    });
    setShowEdit(true);
  };

  const openDelete = (manager) => {
    setConfirm({
      title: `"${manager.name}"ni o'chirish`,
      message: "Manager hisobi tizimdan o'chiriladi va tizimga kira olmaydi.",
      onConfirm: () => deleteMutation.mutate(manager.id),
    });
  };

  const submitForm = () => {
    if (!form.name || !form.phone) return;
    createMutation.mutate(form);
  };

  const submitEditForm = () => {
    if (!editForm.name || !editForm.phone) return;
    updateMutation.mutate(editForm);
  };

  return (
    <div className="dashboard-shell">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
      
      <PageHeader
        title="Managerlar"
        subtitle="Markaz managerlari va ularga biriktirilgan filiallar"
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} /> Manager qo'shish
          </button>
        }
      />

      <div className="filter-bar mb-1">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Ism, telefon yoki markaz bo'yicha qidirish..."
        />
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          {filteredManagers.length} ta manager
        </span>
      </div>

      {filteredManagers.length > 0 ? (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Manager</th>
                <th>Telefon</th>
                <th>Markaz / Manzil</th>
                <th>Holat</th>
                <th className="text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredManagers.map((manager, index) => (
                <motion.tr
                  key={manager.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <td>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/managers/${manager.id}`)}
                      className="flex items-center gap-3 text-left group"
                    >
                      <div className="avatar avatar-md">
                        {manager.name?.charAt(0)?.toUpperCase() || 'M'}
                      </div>
                      <div>
                        <div className="font-semibold text-sm group-hover:text-primary transition-colors" style={{ color: 'var(--text-primary)' }}>
                          {manager.name}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          @{manager.username}
                        </div>
                      </div>
                    </button>
                  </td>
                  <td>
                    <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {manager.phone || '—'}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {manager.branch?.name || manager.address || '—'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleMutation.mutate(manager.id)}
                      className="cursor-pointer transition-transform active:scale-95"
                    >
                      <StatusBadge status={manager.isActive ? 'faol' : 'nofaol'} />
                    </button>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(manager)}
                        className="btn-icon"
                        title="Tahrirlash"
                      >
                        <Edit2 size={14} style={{ color: 'var(--secondary)' }} />
                      </button>
                      <button
                        onClick={() => openDelete(manager)}
                        className="btn-icon"
                        title="O'chirish"
                      >
                        <Trash2 size={14} style={{ color: 'var(--error)' }} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={User}
          title={search ? "Qidiruv bo'yicha manager topilmadi" : "Hozircha managerlar yo'q"}
          description={search ? `"${search}" so'rovi bo'yicha hech qanday natija mavjud emas` : "Tizimga yangi manager qo'shing"}
          action={!search && (
            <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm">
              <Plus size={14} /> Manager qo'shish
            </button>
          )}
        />
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ scale: 0.96, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 8, opacity: 0 }}
              className="modal-panel"
            >
              <div className="modal-header">
                <div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: 'rgba(240, 100, 19, 0.1)', border: '1px solid rgba(240, 100, 19, 0.18)' }}
                  >
                    <User size={20} style={{ color: 'var(--primary)' }} />
                  </div>
                  <h2 className="modal-title">Yangi Manager</h2>
                  <p className="modal-subtitle">Manager hisobi va kirish ma'lumotlarini yaratish</p>
                </div>
                <button onClick={closeModal} className="btn-icon flex-shrink-0">
                  <X size={18} />
                </button>
              </div>

              {newCreds ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                    <ShieldCheck size={36} className="mx-auto mb-2" style={{ color: 'var(--success)' }} />
                    <h3 className="font-bold text-base" style={{ color: 'var(--success)' }}>Manager yaratildi</h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Quyidagi login ma'lumotlarini saqlab oling va managerga yuboring.</p>
                  </div>
                  
                  <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
                    {[['Login', newCreds.username], ['Parol', newCreds.password]].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
                          <div className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{value}</div>
                        </div>
                        <button onClick={() => copy(value)} className="btn-icon" title="Nusxalash">
                          <Copy size={15} style={{ color: 'var(--primary)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button onClick={closeModal} className="btn-primary w-full">
                    Tushundim, yopish
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Ism va familiya *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="input-field"
                      placeholder="Masalan: Aziz Rahimov"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Telefon raqam *</label>
                      <input
                        value={form.phone || '+998 '}
                        onChange={(e) => setForm((prev) => ({ ...prev, phone: formatUzPhone(e.target.value) }))}
                        onFocus={() => { if (!form.phone || form.phone.trim() === '+998') setForm((prev) => ({ ...prev, phone: '+998 ' })); }}
                        className="input-field font-mono"
                        placeholder="+998 (90) 123-45-67"
                        type="tel"
                      />
                    </div>
                    <div>
                      <label className="form-label">Markaz (filial)</label>
                      <select
                        value={form.branchId}
                        onChange={(e) => setForm((prev) => ({ ...prev, branchId: e.target.value }))}
                        className="input-field"
                      >
                        <option value="">Tanlang</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id} disabled={!!branch.managerId}>
                            {branch.name}{branch.managerId ? ' (biriktirilgan)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Jinsi</label>
                      <select
                        value={form.gender}
                        onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                        className="input-field"
                      >
                        <option value="">Tanlang</option>
                        <option value="male">Erkak</option>
                        <option value="female">Ayol</option>
                        <option value="other">Boshqa</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Email</label>
                      <input
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="input-field"
                        placeholder="manager@abdora.ai"
                        type="email"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Yashash manzili</label>
                    <input
                      value={form.address}
                      onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                      className="input-field"
                      placeholder="Toshkent sh., Yunusobod tumani..."
                    />
                  </div>

                  {createMutation.error && (
                    <p className="form-error text-center">{friendlyAiErrorMessage(createMutation.error)}</p>
                  )}

                  <div className="modal-footer">
                    <button onClick={closeModal} className="btn-ghost">Bekor qilish</button>
                    <button
                      onClick={submitForm}
                      disabled={!form.name || !form.phone || createMutation.isPending}
                      className="btn-primary"
                    >
                      {createMutation.isPending ? 'Saqlanmoqda...' : 'Yaratish'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && closeEditModal()}
          >
            <motion.div
              initial={{ scale: 0.96, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 8, opacity: 0 }}
              className="modal-panel"
            >
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">Managerni tahrirlash</h2>
                  <p className="modal-subtitle">Profil ma'lumotlarini o'zgartirish</p>
                </div>
                <button onClick={closeEditModal} className="btn-icon flex-shrink-0">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Ism va familiya *</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                    placeholder="To'liq ismi"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Telefon *</label>
                    <input
                      value={editForm.phone}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="input-field font-mono"
                      placeholder="+998 90 123 45 67"
                      type="tel"
                    />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      value={editForm.email}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="input-field"
                      placeholder="email@example.com"
                      type="email"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Jinsi</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, gender: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Tanlang</option>
                      <option value="male">Erkak</option>
                      <option value="female">Ayol</option>
                      <option value="other">Boshqa</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Yoshi</label>
                    <input
                      value={editForm.age}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, age: e.target.value }))}
                      className="input-field"
                      placeholder="Yosh"
                      type="number"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Manzili</label>
                  <input
                    value={editForm.address}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="input-field"
                    placeholder="Tuman, ko'cha, uy raqami"
                  />
                </div>

                {updateMutation.error && (
                  <p className="form-error text-center">{friendlyAiErrorMessage(updateMutation.error)}</p>
                )}

                <div className="modal-footer">
                  <button onClick={closeEditModal} className="btn-ghost">Bekor qilish</button>
                  <button
                    onClick={submitEditForm}
                    disabled={!editForm.name || !editForm.phone || updateMutation.isPending}
                    className="btn-primary"
                  >
                    {updateMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
