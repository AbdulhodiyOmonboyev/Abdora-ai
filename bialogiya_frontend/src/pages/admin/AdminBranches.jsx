import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Building2, Users, BookOpen, MapPin, Trash2, Edit2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';

const EMPTY_FORM = { name: '', address: '', studentCapacity: '' };

export default function AdminBranches() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [confirm, setConfirm] = useState(null);

  const { data: branches = [] } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: () => api.get('/admin/branches').then(r => r.data.data),
  });

  const [searchParams] = useSearchParams();
  const search = searchParams.get('search')?.trim().toLowerCase() || '';
  const filteredBranches = search
    ? branches.filter((branch) =>
        branch.name?.toLowerCase().includes(search)
        || branch.address?.toLowerCase().includes(search)
        || branch.reception?.name?.toLowerCase().includes(search)
      )
    : branches;

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/branches', data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-branches']);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      toast.success('Filial yaratildi');
    },
    onError: (error) => toast.error(friendlyAiErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/admin/branches/${editingBranch.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-branches']);
      setShowEdit(false);
      setEditingBranch(null);
      setEditForm(EMPTY_FORM);
      toast.success('Filial tahrirlandi');
    },
    onError: (error) => toast.error(friendlyAiErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/branches/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['admin-branches']);
      toast.success('Filial o\'chirildi');
    },
    onError: (error) => toast.error(friendlyAiErrorMessage(error)),
  });

  const closeModal = () => {
    setShowCreate(false);
    setForm(EMPTY_FORM);
  };

  const closeEditModal = () => {
    setShowEdit(false);
    setEditingBranch(null);
    setEditForm(EMPTY_FORM);
  };

  const openEdit = (branch) => {
    setEditingBranch(branch);
    setEditForm({
      name: branch.name,
      address: branch.address || '',
      studentCapacity: branch.studentCapacity || '',
    });
    setShowEdit(true);
  };

  const openDelete = (branch) => {
    setConfirm({
      title: `"${branch.name}" filialini o'chirish`,
      message: 'Filial va uning barcha guruhlari tizimdan o\'chiriladi.',
      onConfirm: () => deleteMutation.mutate(branch.id),
    });
  };

  const submitForm = () => {
    if (!form.name) return;
    createMutation.mutate(form);
  };

  const submitEditForm = () => {
    if (!editForm.name) return;
    updateMutation.mutate(editForm);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Markazlar</h1>
          <p className="text-sm text-gray-500 mt-1">O'quv markazlarni boshqarish.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Markaz qo'shish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBranches.map((branch, index) => (
          <motion.div
            key={branch.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/admin/branches/${branch.id}`)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <Building2 size={24} />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(branch); }}
                  className="btn-ghost p-1.5 rounded-lg text-blue-500 hover:bg-blue-50"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openDelete(branch); }}
                  className="btn-ghost p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{branch.name}</h3>
            
            {branch.address && (
              <div className="text-xs text-gray-500 flex items-start gap-1 mb-3">
                <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                <span>{branch.address}</span>
              </div>
            )}

            <div className="flex gap-3 text-xs text-gray-600">
              {branch._count && (
                <>
                  <div className="flex items-center gap-1">
                    <BookOpen size={12} />
                    <span>{branch._count.groups} guruh</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    <span>{branch._count.teachers} o'qituvchi</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        ))}

        {filteredBranches.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Building2 size={48} className="mx-auto mb-3 opacity-30" />
            <p>{search ? "Qidiruv bo'yicha hech qanday markaz topilmadi." : "Hozircha markazlar yo'q."}</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
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
                <h2 className="font-bold text-lg">Markaz qo'shish</h2>
                <button onClick={closeModal} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Markaz nomi *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Markaz nomi"
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
                  <label className="block text-sm font-medium mb-1">O'quvchi kapasiteti</label>
                  <input
                    value={form.studentCapacity}
                    onChange={(e) => setForm((prev) => ({ ...prev, studentCapacity: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Jami o'quvchi soni"
                    type="number"
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={closeModal} className="btn-ghost flex-1">
                    Bekor
                  </button>
                  <button
                    onClick={submitForm}
                    disabled={!form.name || createMutation.isPending}
                    className="btn-primary flex-1 disabled:opacity-40"
                  >
                    {createMutation.isPending ? 'Saqlanmoqda...' : 'Yaratish'}
                  </button>
                </div>
                {createMutation.error && (
                  <p className="text-xs text-red-500 text-center">
                    {friendlyAiErrorMessage(createMutation.error)}
                  </p>
                )}
              </div>
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
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeEditModal()}
          >
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Markaz tahrirlash</h2>
                <button onClick={closeEditModal} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Markaz nomi *</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Markaz nomi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Manzil</label>
                  <input
                    value={editForm.address}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Tuman, ko'cha, uy raqami"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">O'quvchi kapasiteti</label>
                  <input
                    value={editForm.studentCapacity}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, studentCapacity: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Jami o'quvchi soni"
                    type="number"
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={closeEditModal} className="btn-ghost flex-1">
                    Bekor
                  </button>
                  <button
                    onClick={submitEditForm}
                    disabled={!editForm.name || updateMutation.isPending}
                    className="btn-primary flex-1 disabled:opacity-40"
                  >
                    {updateMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
                {updateMutation.error && (
                  <p className="text-xs text-red-500 text-center">
                    {friendlyAiErrorMessage(updateMutation.error)}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
