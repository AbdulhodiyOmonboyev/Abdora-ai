import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, MapPin, ShieldCheck, X, Edit2, Trash2 } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';

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
      toast.success("Manager o'chirildi");
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
      toast.success('Manager maʼlumotlari yangilandi');
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
    return <div className="dashboard-shell py-20 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>;
  }

  if (!user) {
    return <div className="dashboard-shell py-20 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Manager topilmadi.</div>;
  }

  return (
    <div className="dashboard-shell max-w-4xl">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
      
      <PageHeader
        breadcrumb={
          <div className="flex items-center gap-2">
            <Link to="/admin/managers" className="hover:underline" style={{ color: 'var(--text-muted)' }}>Managerlar</Link>
            <span style={{ color: 'var(--border)' }}>/</span>
            <span style={{ color: 'var(--text-primary)' }}>{user.name}</span>
          </div>
        }
        title={user.name}
        subtitle="Manager shaxsiy profili va markaz biriktirmasi"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/admin/managers')} className="btn-ghost btn-sm">
              <ArrowLeft size={14} /> Orqaga
            </button>
            <button onClick={openEdit} className="btn-primary btn-sm">
              <Edit2 size={14} /> Tahrirlash
            </button>
          </div>
        }
      />

      {/* Main card */}
      <div className="panel-card space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-4">
            <div className="avatar avatar-xl">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{user.name}</h2>
              <div className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>@{user.username}</div>
              <div className="mt-1">
                <StatusBadge status={user.isActive ? 'faol' : 'nofaol'} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleMutation.mutate()}
              className="btn-ghost btn-sm"
            >
              {user.isActive ? 'Nofaol qilish' : 'Faollashtirish'}
            </button>
            <button
              onClick={() => setConfirm({
                title: `${user.name}ni o'chirish`,
                message: "Manager hisobi o'chiriladi va tizimga kira olmaydi.",
                onConfirm: () => deleteMutation.mutate(),
              })}
              className="btn-danger btn-sm"
            >
              <Trash2 size={14} /> O'chirish
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
            <span className="panel-kicker">Aloqa ma'lumotlari</span>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(240, 100, 19, 0.1)' }}>
                <Phone size={15} style={{ color: 'var(--primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Telefon</div>
                <div className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  {user.phone || '—'}
                  {user.phone && (
                    <button onClick={() => copy(user.phone)} className="text-xs hover:underline" style={{ color: 'var(--primary)' }}>
                      Nusxa
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)' }}>
                <Mail size={15} style={{ color: 'var(--secondary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Email</div>
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {user.email || '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
            <span className="panel-kicker">Tizim ma'lumotlari</span>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)' }}>
                <ShieldCheck size={15} style={{ color: 'var(--success)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Rol</div>
                <div className="text-sm font-semibold uppercase" style={{ color: 'var(--text-primary)' }}>
                  {user.role}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)' }}>
                <MapPin size={15} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Yashash manzili</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {user.address || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}
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
                  <p className="modal-subtitle">Profil ma'lumotlarini yangilang</p>
                </div>
                <button onClick={() => setShowEdit(false)} className="btn-icon flex-shrink-0">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Ismi *</label>
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
                  <p className="form-error text-center">{updateMutation.error.response?.data?.message || 'Saqlashda xato yuz berdi'}</p>
                )}

                <div className="modal-footer">
                  <button onClick={() => setShowEdit(false)} className="btn-ghost">Bekor qilish</button>
                  <button
                    onClick={submitEdit}
                    className="btn-primary"
                    disabled={!editForm.name || !editForm.phone || updateMutation.isPending}
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
