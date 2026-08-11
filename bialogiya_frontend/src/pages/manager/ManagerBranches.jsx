import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Building2, Users, BookOpen, MapPin, ArrowRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../config/axios';

export default function ManagerBranches() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', studentCapacity: '' });
  const [confirm, setConfirm] = useState(null);
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search')?.trim().toLowerCase() || '';

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['manager-branches'],
    queryFn: () => api.get('/users/manager/branches').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/branches', data),
    onSuccess: () => {
      qc.invalidateQueries(['manager-branches']);
      setShowCreate(false);
      setForm({ name: '', address: '', studentCapacity: '' });
      toast.success('Filial yaratildi');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Filial yaratilmadi'),
  });

  const filteredBranches = search
    ? branches.filter((branch) =>
        branch.name?.toLowerCase().includes(search)
        || branch.address?.toLowerCase().includes(search)
      )
    : branches;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Filiallar</h1>
        <div className="text-center py-16">Yuklanmoqda...</div>
      </div>
    );
  }

  const closeModal = () => {
    setShowCreate(false);
    setForm({ name: '', address: '', studentCapacity: '' });
  };

  const submitForm = () => {
    if (!form.name) return;
    createMutation.mutate({
      name: form.name,
      address: form.address,
      studentCapacity: form.studentCapacity,
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Filiallar</h1>
          <p className="text-sm text-gray-500 mt-1">Barcha filiallar va ular ichidagi turli xil ta'lim jarayonlari.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Filial qo'shish
        </button>
      </div>

      <div className="space-y-3">
        {filteredBranches.map((branch, index) => (
          <motion.div
            key={branch.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <button
              onClick={() => navigate(`/manager/branches/${branch.id}`)}
              className="card w-full text-left hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary grid place-items-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Building2 size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-white group-hover:text-primary transition-colors">{branch.name}</h3>
                    {branch.address && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin size={12} /> {branch.address}
                      </p>
                    )}
                    <div className="flex gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1 text-blue-600">
                        <BookOpen size={14} />
                        <span>{branch.groups?.length || 0} guruh</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <Users size={14} />
                        <span>{branch._count?.teachers || 0} o'qituvchi</span>
                      </div>
                      <div className="flex items-center gap-1 text-purple-600">
                        <Users size={14} />
                        <span>{branch.studentsCount || 0} o'quvchi</span>
                      </div>
                    </div>
                  </div>
                </div>
                <ArrowRight
                  size={20}
                  className="text-gray-400 group-hover:text-primary transition-colors flex-shrink-0 mt-1 group-hover:translate-x-1 transition-transform"
                />
              </div>
            </button>
          </motion.div>
        ))}

        {filteredBranches.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Building2 size={48} className="mx-auto mb-3 opacity-30" />
            <p>{search ? "Qidiruv bo'yicha hech qanday filial topilmadi." : "Hozircha filiallar yo'q."}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Filial qo'shish</h2>
                <button onClick={closeModal} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Filial nomi *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Filial nomi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Manzil</label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Tuman, ko'cha, uy raqami"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">O'quvchi sig'imi</label>
                  <input
                    type="number"
                    value={form.studentCapacity}
                    onChange={(e) => setForm((prev) => ({ ...prev, studentCapacity: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Jami o'quvchi soni"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="btn-ghost flex-1">Bekor</button>
                  <button
                    onClick={submitForm}
                    disabled={!form.name || createMutation.isPending}
                    className="btn-primary flex-1 disabled:opacity-40"
                  >
                    {createMutation.isPending ? 'Saqlanmoqda...' : 'Yaratish'}
                  </button>
                </div>
                {createMutation.error && (
                  <p className="text-xs text-red-500 text-center">{createMutation.error.message}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
