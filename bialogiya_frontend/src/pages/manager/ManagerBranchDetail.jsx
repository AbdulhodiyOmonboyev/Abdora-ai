import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Building2, Users, BookOpen, User, MapPin, Pencil, X, Wallet } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';

export default function ManagerBranchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', address: '', studentCapacity: '' });

  const { data: branch = {}, isLoading, error } = useQuery({
    queryKey: ['manager-branch-detail', id],
    queryFn: () => api.get(`/admin/branches/${id}`).then(r => {
      const data = r.data?.data || r.data || {};
      return typeof data === 'object' ? data : {};
    }),
  });

  const updateBranchMutation = useMutation({
    mutationFn: (data) => api.put(`/admin/branches/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['manager-branch-detail', id]);
      setShowEdit(false);
      toast.success('Filial maʼlumotlari yangilandi');
    },
    onError: (err) => toast.error(friendlyAiErrorMessage(err)),
  });

  const submitEdit = () => {
    if (!editForm.name.trim()) return toast.error('Filial nomi kiritilishi kerak');
    updateBranchMutation.mutate({
      name: editForm.name.trim(),
      address: editForm.address.trim() || null,
      studentCapacity: editForm.studentCapacity ? Number(editForm.studentCapacity) : null,
    });
  };

  const openEditModal = () => {
    if (!branch) return;
    setEditForm({
      name: branch.name || '',
      address: branch.address || '',
      studentCapacity: branch.studentCapacity ? String(branch.studentCapacity) : '',
    });
    setShowEdit(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/manager/branches')}
          className="flex items-center gap-2 text-primary mb-6 hover:underline"
        >
          <ArrowLeft size={16} /> Orqaga
        </button>
        <div className="text-center py-16">Yuklanmoqda...</div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/manager/branches')}
          className="flex items-center gap-2 text-primary mb-6 hover:underline"
        >
          <ArrowLeft size={16} /> Orqaga
        </button>
        <div className="text-center py-16 text-red-500">
          {error ? friendlyAiErrorMessage(error) : 'Filial topilmadi'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/manager/branches')}
        className="flex items-center gap-2 text-primary mb-6 hover:underline"
      >
        <ArrowLeft size={16} /> Orqaga
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-16 h-16 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <Building2 size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{branch.name}</h1>
                {branch.address && (
                  <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1 text-sm">
                    <MapPin size={14} /> {branch.address}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
              <span>Sig'im: {branch.studentCapacity ?? 'Belgilanmagan'} o'quvchi</span>
              <span>Reception: {branch.reception?.name || 'Yoʻq'}</span>
            </div>
          </div>
          <button
            onClick={openEditModal}
            className="btn-outline inline-flex items-center gap-2 self-start"
          >
            <Pencil size={16} /> Tahrirlash
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
              <BookOpen size={18} />
              <span className="font-semibold">Guruhlari</span>
            </div>
            <div className="text-3xl font-bold text-blue-700">{branch.groups?.length || 0}</div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
              <Users size={18} />
              <span className="font-semibold">O'qituvchilari</span>
            </div>
            <div className="text-3xl font-bold text-green-700">{branch.teachers?.length || 0}</div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
              <User size={18} />
              <span className="font-semibold">O'quvchilari</span>
            </div>
            <div className="text-3xl font-bold text-purple-700">{branch.studentsCount || 0}</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Bugalteriya</h2>
            <p className="text-sm text-gray-500">Filialning oylik hisobi va jami daromad taxmini.</p>
          </div>
          <Wallet size={22} className="text-primary" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4">
            <div className="text-sm text-slate-500 mb-2">Jami guruh</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-white">{branch.groups?.length || 0}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4">
            <div className="text-sm text-slate-500 mb-2">Oylik taxminiy daromad</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-white">
              {new Intl.NumberFormat('uz-UZ').format(
                (branch.groups || []).reduce((sum, group) => sum + ((group.monthlyFee || 0) * (group._count?.students || 0)), 0)
              )} so'm
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4">
            <div className="text-sm text-slate-500 mb-2">Faol o'quvchilar</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-white">{branch.studentsCount || 0}</div>
          </div>
        </div>

        <div className="space-y-3">
          {(branch.groups || []).map((group) => (
            <div key={group.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <div className="font-semibold text-gray-800 dark:text-white">{group.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{group.subject} • {group._count?.students || 0} o'quvchi</div>
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300">
                {group.monthlyFee ? `${new Intl.NumberFormat('uz-UZ').format(group.monthlyFee)} so'm/oy` : 'To‘lov belgilanmagan'}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Teachers */}
      {Array.isArray(branch.teachers) && branch.teachers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
        >
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Users size={20} /> O'qituvchilari ({branch.teachers.length})
          </h2>
          <div className="space-y-2">
            {branch.teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold">
                  {teacher.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-800 dark:text-white">{teacher.name}</div>
                  <div className="text-xs text-gray-500">@{teacher.username}</div>
                </div>
                {teacher.phone && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">{teacher.phone}</div>
                )}
                <div
                  className={`badge text-xs ${
                    teacher.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {teacher.isActive ? 'Faol' : 'Nofaol'}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Groups */}
      {Array.isArray(branch.groups) && branch.groups.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen size={20} /> Guruhlari ({branch.groups.length})
          </h2>
          <div className="space-y-3">
            {branch.groups.map((group) => (
              <div
                key={group.id}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">{group.name}</h3>
                    <p className="text-xs text-gray-500">
                      {group.subject} • O'qituvchi: {group.teacher?.name}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                  {group.monthlyFee && (
                    <span>To'lov: {group.monthlyFee} so'm</span>
                  )}
                  <span>{group._count?.students || 0} o'quvchi</span>
                  {group.startTime && group.endTime && (
                    <span>
                      {group.startTime} - {group.endTime}
                    </span>
                  )}
                  {group.room && <span>Xona: {group.room}</span>}
                  {group.weekDays && (
                    <span>{group.weekDays}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

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
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-lg text-gray-800 dark:text-white">Filialni tahrirlash</h2>
                  <p className="text-sm text-gray-500">Filial nomi, manzili va sig'imni yangilash.</p>
                </div>
                <button onClick={() => setShowEdit(false)} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Filial nomi *</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Filial nomi"
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
                  <label className="block text-sm font-medium mb-1">O'quvchi sig'imi</label>
                  <input
                    type="number"
                    value={editForm.studentCapacity}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, studentCapacity: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Jami o'quvchi soni"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowEdit(false)} className="btn-ghost flex-1">Bekor</button>
                  <button
                    onClick={submitEdit}
                    disabled={updateBranchMutation.isPending}
                    className="btn-primary flex-1 disabled:opacity-40"
                  >
                    {updateBranchMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
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
