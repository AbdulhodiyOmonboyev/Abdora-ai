import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, X, User, Phone, MapPin, Trash2, Edit2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import { formatUzPhone } from '../../utils/formatPhone';

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

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/users/create-manager', data),
    onSuccess: ({ data }) => {
      qc.invalidateQueries(['admin-managers']);
      setNewCreds(data.data.credentials);
      setForm(EMPTY_FORM);
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
      toast.success('Manager tahrirlandi');
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
      toast.success('Manager o\'chirildi');
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
      message: 'Manager hisobi tizimdan o\'chiriladi va tizimga kira olmaydi.',
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
    <div className="dashboard-shell max-w-5xl mx-auto">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
      <header className="dashboard-header dashboard-header-plain">
        <div>
          <span className="dashboard-badge"><User size={12} /> Admin</span>
          <h1>Managerlar</h1>
          <p>Managerlar va ularga biriktirilgan markazlar</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Manager qo'shish
        </button>
      </header>

      <div className="panel-card overflow-hidden p-0">
        {managers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="dashboard-table w-full text-left text-sm">
              <thead><tr><th>Manager</th><th>Telefon</th><th>Markaz</th><th>Holat</th><th className="text-right">Amallar</th></tr></thead>
              <tbody>
                {managers.map((manager, index) => (
                  <motion.tr key={manager.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }}>
                    <td className="cursor-pointer" onClick={() => navigate(`/admin/managers/${manager.id}`)}><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full gradient-bg text-white grid place-items-center text-xs font-semibold">{manager.name?.charAt(0)}</div><div><div className="font-semibold text-[var(--text-primary)]">{manager.name}</div><div className="text-xs text-[var(--text-muted)]">@{manager.username}</div></div></div></td>
                    <td className="text-[var(--text-secondary)]">{manager.phone || '—'}</td>
                    <td className="text-[var(--text-muted)]">{manager.address || '—'}</td>
                    <td><button onClick={() => toggleMutation.mutate(manager.id)} className={`badge text-xs ${manager.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{manager.isActive ? 'Faol' : 'Nofaol'}</button></td>
                    <td><div className="flex justify-end gap-1"><button onClick={() => openEdit(manager)} className="btn-ghost p-2 rounded-lg text-blue-400" title="Tahrirlash"><Edit2 size={14} /></button><button onClick={() => openDelete(manager)} className="btn-ghost p-2 rounded-lg text-red-400" title="O'chirish"><Trash2 size={14} /></button></div></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="text-center py-16 dark:text-slate-400"><User size={36} className="mx-auto mb-3 opacity-30" /><p>Hozircha managerlar yo'q.</p></div>}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Manager qo'shish</h2>
                <button onClick={closeModal} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
              </div>

              {newCreds ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl mb-2">✅</div>
                    <h3 className="font-bold text-lg">Manager yaratildi</h3>
                    <p className="text-sm text-gray-500">Quyidagi login ma'lumotlarini saqlang.</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                    {[['Login', newCreds.username], ['Parol', newCreds.password]].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs text-gray-500">{label}</div>
                          <div className="font-mono font-semibold">{value}</div>
                        </div>
                        <button onClick={() => copy(value)} className="btn-ghost p-1.5 rounded-lg"><Copy size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={closeModal} className="btn-primary w-full">Yopish</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Ismi *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="input-field w-full"
                      placeholder="To'liq ismi"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Telefon *</label>
                      <input
                        value={form.phone || '+998 '}
                        onChange={(e) => setForm((prev) => ({ ...prev, phone: formatUzPhone(e.target.value) }))}
                        onFocus={(e) => { if (!form.phone || form.phone.trim() === '+998') setForm((prev) => ({ ...prev, phone: '+998 ' })); }}
                        className="input-field w-full font-mono"
                        placeholder="+998 (90) 123-45-67"
                        type="tel"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Markaz</label>
                      <select
                        value={form.branchId}
                        onChange={(e) => setForm((prev) => ({ ...prev, branchId: e.target.value }))}
                        className="input-field w-full"
                      >
                        <option value="">Tanlang</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id} disabled={!!branch.managerId}>
                            {branch.name}{branch.managerId ? ' (band)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Jinsi</label>
                      <select
                        value={form.gender}
                        onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                        className="input-field w-full"
                      >
                        <option value="">Tanlang</option>
                        <option value="male">Erkak</option>
                        <option value="female">Ayol</option>
                        <option value="other">Boshqa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="input-field w-full"
                        placeholder="email@example.com"
                        type="email"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Manzili</label>
                    <input
                      value={form.address}
                      onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                      className="input-field w-full"
                      placeholder="Tuman, ko'cha, uy raqami"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={closeModal} className="btn-ghost flex-1">Bekor</button>
                    <button
                      onClick={submitForm}
                      disabled={!form.name || !form.phone || createMutation.isPending}
                      className="btn-primary flex-1 disabled:opacity-40">
                      {createMutation.isPending ? 'Saqlanmoqda...' : 'Yaratish'}
                    </button>
                  </div>
                  {createMutation.error && (
                    <p className="text-xs text-red-500 text-center">{friendlyAiErrorMessage(createMutation.error)}</p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEdit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeEditModal()}>
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Managerni tahrirlash</h2>
                <button onClick={closeEditModal} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ismi *</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="input-field w-full"
                    placeholder="To'liq ismi"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefon *</label>
                    <input
                      value={editForm.phone}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="input-field w-full"
                      placeholder="+998 90 123 45 67"
                      type="tel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      value={editForm.email}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="input-field w-full"
                      placeholder="email@example.com"
                      type="email"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Jinsi</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, gender: e.target.value }))}
                      className="input-field w-full"
                    >
                      <option value="">Tanlang</option>
                      <option value="male">Erkak</option>
                      <option value="female">Ayol</option>
                      <option value="other">Boshqa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Yoshi</label>
                    <input
                      value={editForm.age}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, age: e.target.value }))}
                      className="input-field w-full"
                      placeholder="Yosh"
                      type="number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Manzili</label>
                  <input
                    value={editForm.address}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Tuman, ko'cha, uy raqami"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={closeEditModal} className="btn-ghost flex-1">Bekor</button>
                  <button
                    onClick={submitEditForm}
                    disabled={!editForm.name || !editForm.phone || updateMutation.isPending}
                    className="btn-primary flex-1 disabled:opacity-40">
                    {updateMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
                {updateMutation.error && (
                  <p className="text-xs text-red-500 text-center">{friendlyAiErrorMessage(updateMutation.error)}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
