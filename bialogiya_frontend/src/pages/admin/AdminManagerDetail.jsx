import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, MapPin, ShieldCheck, Lock, X, Copy } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function AdminManagerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(null);

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

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Nusxalandi!');
  };

  if (isLoading) {
    return <div className="flex justify-center py-20">Loading...</div>;
  }

  if (!user) {
    return <div className="max-w-3xl mx-auto py-20 text-center text-gray-500">Manager topilmadi.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{user.name}</h1>
          <p className="text-sm text-gray-500">Manager ma'lumotlari va boshqaruv</p>
        </div>
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
    </div>
  );
}
