import { useState } from 'react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, UserCheck, UserPlus, ShieldCheck, Lock, Trash2, Edit, Save, X } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

const ROLE_LABELS = {
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
};

export default function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', groupId: '' });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => api.get('/users').then((r) => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['admin-groups'],
    queryFn: () => api.get('/admin/groups').then((r) => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/users/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries(['all-users']);
      toast.success('User updated');
      setEditingUser(null);
    },
    onError: () => toast.error('Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['all-users']);
      toast.success('User deactivated');
    },
    onError: () => toast.error('Delete failed'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/toggle`),
    onSuccess: () => {
      qc.invalidateQueries(['all-users']);
      toast.success('Status toggled');
    },
    onError: () => toast.error('Toggle failed'),
  });

  const freezeMutation = useMutation({
    mutationFn: (id) => api.patch(`/users/${id}/freeze`),
    onSuccess: () => {
      qc.invalidateQueries(['all-users']);
      toast.success('Freeze status updated');
    },
    onError: () => toast.error('Action failed'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id) => api.post(`/users/${id}/reset-password`),
    onSuccess: ({ data }) => {
      toast.success(`New password: ${data.data.newPassword}`);
    },
    onError: () => toast.error('Password reset failed'),
  });

  const filteredUsers = Array.isArray(users) ? users.filter((user) => {
    const matchRole = roleFilter === 'all' ? true : user.role === roleFilter;
    const term = search.trim().toLowerCase();
    const matchSearch = !term || [user.name, user.username, user.email, user.role].some((field) => field?.toLowerCase().includes(term));
    return matchRole && matchSearch;
  }) : [];

  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      groupId: user.groupId || '',
    });
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditForm({ name: '', email: '', phone: '', groupId: '' });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Foydalanuvchilarni boshqarish</h1>
          <p className="text-sm text-gray-500">Admin platformadagi barcha foydalanuvchilarni boshqarishi mumkin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost gap-2 text-sm">
            <UserCheck size={16} /> {users?.length || 0} ta foydalanuvchi
          </button>
          <button onClick={() => setRoleFilter('all')} className={`btn-ghost text-sm ${roleFilter === 'all' ? 'bg-primary/10 text-primary' : ''}`}>Barchasi</button>
          <button onClick={() => setRoleFilter('admin')} className={`btn-ghost text-sm ${roleFilter === 'admin' ? 'bg-primary/10 text-primary' : ''}`}>Adminlar</button>
          <button onClick={() => setRoleFilter('teacher')} className={`btn-ghost text-sm ${roleFilter === 'teacher' ? 'bg-primary/10 text-primary' : ''}`}>O'qituvchilar</button>
          <button onClick={() => setRoleFilter('student')} className={`btn-ghost text-sm ${roleFilter === 'student' ? 'bg-primary/10 text-primary' : ''}`}>O'quvchilar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, login, email yoki rol bo'yicha qidirish..."
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="grid gap-3">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className="card p-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl gradient-bg flex items-center justify-center text-white text-lg font-semibold">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-white">{user.name || 'Ism yo\'q'}</div>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                    <span>@{user.username}</span>
                    <span>{user.email || 'Email yo\'q'}</span>
                    <span className="badge bg-surface dark:bg-gray-800">{ROLE_LABELS[user.role] || user.role}</span>
                    {user.isFrozen && <span className="badge bg-orange-100 text-orange-700">Muzlatilgan</span>}
                    {!user.isActive && <span className="badge bg-gray-100 text-gray-500">Faol emas</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center text-sm text-gray-500">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-[0.1em]">Guruh</div>
                  <div>{user.group?.name || '-'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-[0.1em]">O'qituvchi</div>
                  <div>{user.teacher?.name || '-'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-[0.1em]">Qo'shilgan sana</div>
                  <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => toggleActiveMutation.mutate(user.id)}
                className={`badge text-xs ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {user.isActive ? 'Faol' : 'Faol emas'}
              </button>
              <button
                onClick={() => freezeMutation.mutate(user.id)}
                className={`badge text-xs ${user.isFrozen ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {user.isFrozen ? 'Muzlatishni bekor qilish' : 'Muzlatish'}
              </button>
              <button
                onClick={() => resetPasswordMutation.mutate(user.id)}
                className="badge text-xs bg-blue-100 text-blue-700"
              >
                <Lock size={12} /> Parolni tiklash
              </button>
              <button
                onClick={() => openEdit(user)}
                className="badge text-xs bg-surface dark:bg-gray-800 text-gray-600"
              >
                <Edit size={12} /> Tahrirlash
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(user.id);
                }}
                className="badge text-xs bg-red-100 text-red-700"
              >
                <Trash2 size={12} /> Faolsizlantirish
              </button>
            </div>
          </motion.div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <UserPlus size={40} className="mx-auto mb-3" />
            <p>Foydalanuvchilar topilmadi.</p>
          </div>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tahrirlash: {editingUser.name || editingUser.username}</h2>
                <p className="text-sm text-gray-500">Foydalanuvchi ma'lumotlarini yangilang va saqlang.</p>
              </div>
              <button onClick={closeEdit} className="btn-ghost p-2 rounded-full"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Ism</label>
                <input value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Telefon</label>
                <input value={editForm.phone} onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))} className="input-field" />
              </div>
              {editingUser.role === 'student' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Guruh</label>
                  <select value={editForm.groupId} onChange={(e) => setEditForm((prev) => ({ ...prev, groupId: e.target.value }))} className="input-field">
                    <option value="">Guruh yo'q</option>
                    {groups?.map((group) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3 justify-end">
              <button onClick={closeEdit} className="btn-ghost">Bekor qilish</button>
              <button
                onClick={() => updateMutation.mutate({ id: editingUser.id, payload: editForm })}
                disabled={updateMutation.isPending}
                className="btn-primary"
              >
                {updateMutation.isPending ? 'Saqlanmoqda...' : 'O\'zgarishlarni saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
