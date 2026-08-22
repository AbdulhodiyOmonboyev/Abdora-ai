import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, MapPin, ShieldCheck, Lock, X, Copy, Edit2 } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function AdminManagerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', gender: '', age: '', address: '' });

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-manager-detail', id],
    queryFn: () => api.get(`/users/${id}`).then((res) => res.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: () => api.put(`/admin/users/${id}/toggle`),
    onSuccess: () => {
      qc.invalidateQueries(['admin-managers']);
      qc.invalidateQueries(['admin-manager-detail', id]);
      toast.success('Holat yangilandi');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Xato'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['admin-managers']);
      toast.success('Manager o‘chirildi');
      navigate('/admin/managers');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Xato'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/users/managers/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-managers']);
      qc.invalidateQueries(['admin-manager-detail', id]);
      setShowEdit(false);
      toast.success('Manager tahrirlandi');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Xato'),
  });

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Nusxalandi!');
  };

  const openEdit = () => {
    setEditForm({
      name: user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      gender: user.gender || '',
      age: user.age || '',
      address: user.address || '',
    });
    setShowEdit(true);
  };

  const submitEdit = () => {
    if (!editForm.name || !editForm.phone) return toast.error('Ism va telefon kiritilishi shart');
    updateMutation.mutate(editForm);
  };

  if (isLoading) {
    return <div className="flex justify-center py-20">Yuklanmoqda...</div>;
  }

  if (!user) {
    return <div className="max-w-3xl mx-auto py-20 text-center text-gray-500">Manager topilmadi.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{user.name}</h1>
            <p className="text-sm text-gray-500">Manager ma'lumotlari va boshqaruv</p>
          </div>
        </div>
        <button onClick={openEdit} className="btn-primary flex items-center gap-2">
          <Edit2 size={16} /> Tahrirlash
        </button>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary grid place-items-center text-2xl font-bold">
              {user.name?.charAt(0)}
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800 dark:text-white">{user.name}</div>
              <div className="text-sm text-gray-500">@{user.username}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirm({
                title: `${user.name}ni o'chirish`,
                message: 'Manager hisobi o‘chirildi va tizimga kira olmaydi.',
                onConfirm: () => deleteMutation.mutate(),
              })}
              className="btn-outline text-red-500"
            >
              O'chirish
            </button>
            <button
              onClick={() => toggleMutation.mutate()}
              className={`badge text-xs ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {user.isActive ? 'Faol' : 'Nofaol'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3 p-4 rounded-3xl bg-gray-50 dark:bg-gray-900">
            <div className="text-xs uppercase tracking-wide text-gray-500">Kontakt</div>
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-primary mt-1" />
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Telefon</div>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  {user.phone || '—'}
                  {user.phone && <button onClick={() => copy(user.phone)} className="text-primary text-xs">Nusxa</button>}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={18} className="text-primary mt-1" />
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Email</div>
                <div className="text-sm text-gray-500">{user.email || '—'}</div>
              </div>
            </div>
          </div>
          <div className="space-y-3 p-4 rounded-3xl bg-gray-50 dark:bg-gray-900">
            <div className="text-xs uppercase tracking-wide text-gray-500">Ma'lumot</div>
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="text-primary mt-1" />
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Rol</div>
                <div className="text-sm text-gray-500">{user.role}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-primary mt-1" />
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Manzil</div>
                <div className="text-sm text-gray-500">{user.address || '—'}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lock size={18} className="text-primary mt-1" />
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Kod</div>
                <div className="text-sm text-gray-500">Telefon oxirgi 4 raqami bilan</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}
          >
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">Managerni tahrirlash</h2>
                  <p className="text-sm text-gray-500">Manager ma'lumotlarini yangilang.</p>
                </div>
                <button onClick={() => setShowEdit(false)} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
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
                  <button onClick={() => setShowEdit(false)} className="btn-ghost flex-1">Bekor</button>
                  <button onClick={submitEdit} className="btn-primary flex-1 disabled:opacity-40" disabled={!editForm.name || !editForm.phone || updateMutation.isLoading}>
                    {updateMutation.isLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
                {updateMutation.error && (
                  <p className="text-xs text-red-500 text-center">{updateMutation.error.response?.data?.message || 'Saqlashda xato yuz berdi'}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
