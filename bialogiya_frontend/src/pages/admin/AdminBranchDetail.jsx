import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Building2, Users, BookOpen, User, Search, Plus, X, UserPlus, GraduationCap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';

const EMPTY_MANAGER_FORM = { name: '', phone: '', email: '', password: '', gender: '', address: '' };

export default function AdminBranchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreateManager, setShowCreateManager] = useState(false);
  const [managerForm, setManagerForm] = useState(EMPTY_MANAGER_FORM);

  const { data: branch = {}, isLoading, error } = useQuery({
    queryKey: ['admin-branch-detail', id],
    queryFn: () => api.get(`/admin/branches/${id}`).then(r => {
      const data = r.data?.data || r.data || {};
      return typeof data === 'object' ? data : {};
    }),
  });

  const { data: managers = [] } = useQuery({
    queryKey: ['admin-branch-managers', id, search],
    queryFn: () => api.get('/users', { params: { role: 'manager', branchId: id, search } }).then((r) => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
    enabled: !!id,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['admin-branch-students', id],
    queryFn: () => api.get('/admin/students', { params: { branchId: id } }).then((r) => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
    enabled: !!id,
  });

  const { data: leadStats } = useQuery({
    queryKey: ['admin-branch-lead-stats', id],
    queryFn: () => api.get('/leads/stats', { params: { branchId: id } }).then((r) => r.data?.data),
    enabled: !!id,
  });

  const createManagerMutation = useMutation({
    mutationFn: (data) => api.post('/users/create-manager', data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-branch-managers', id, search]);
      setManagerForm(EMPTY_MANAGER_FORM);
      setShowCreateManager(false);
      toast.success('Manager yaratildi');
    },
    onError: (err) => toast.error(friendlyAiErrorMessage(err)),
  });

  const submitCreateManager = () => {
    if (!managerForm.name || !managerForm.phone) return toast.error('Ism va telefon kiritilishi shart');
    createManagerMutation.mutate({ ...managerForm, branchId: id });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/admin/branches')}
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
          onClick={() => navigate('/admin/branches')}
          className="flex items-center gap-2 text-primary mb-6 hover:underline"
        >
          <ArrowLeft size={16} /> Orqaga
        </button>
        <div className="text-center py-16 text-red-500">
          {error ? friendlyAiErrorMessage(error) : 'Markaz topilmadi'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/admin/branches')}
        className="flex items-center gap-2 text-primary mb-6 hover:underline"
      >
        <ArrowLeft size={16} /> Orqaga
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-lg bg-primary/10 text-primary grid place-items-center">
            <Building2 size={32} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{branch.name}</h1>
            {branch.address && (
              <p className="text-gray-600 dark:text-gray-300">{branch.address}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

          <a href="#branch-students" className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 hover:opacity-90 transition-opacity">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
              <User size={18} />
              <span className="font-semibold">O'quvchilari</span>
            </div>
            <div className="text-3xl font-bold text-purple-700">{branch.studentsCount || 0}</div>
          </a>

          <Link
            to={`/leads?branchId=${id}&branchName=${encodeURIComponent(branch.name || '')}`}
            className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
              <UserPlus size={18} />
              <span className="font-semibold">Lidlar</span>
            </div>
            <div className="text-3xl font-bold text-orange-700">{leadStats?.active ?? leadStats?.total ?? 0}</div>
          </Link>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ism, login yoki telefon bo'yicha qidirish"
              className="input-field w-full pl-10"
            />
          </div>
          <button
            onClick={() => setShowCreateManager(true)}
            disabled={!!branch.manager}
            className="btn-primary flex items-center gap-2 disabled:opacity-40"
          >
            <Plus size={16} /> Manager yaratish
          </button>
        </div>
        {branch.manager && (
          <div className="mt-3 text-sm text-gray-500">
            Bu filiala manager allaqachon biriktirilgan: <button
              onClick={() => navigate(`/admin/managers/${branch.manager.id}`)}
              className="text-primary hover:underline"
            >{branch.manager.name}</button>.
          </div>
        )}

        {branch.reception && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">QABUL XONASI</h3>
            <p className="font-semibold text-gray-800 dark:text-white">{branch.reception.name}</p>
          </div>
        )}
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Managerlar</h2>
            <p className="text-sm text-gray-500">Faqat shu markazdagi managerlar.</p>
          </div>
          <button onClick={() => setShowCreateManager(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Manager yaratish
          </button>
        </div>

        <div className="space-y-3">
          {managers.map((manager) => (
            <div
              key={manager.id}
              onClick={() => navigate(`/admin/managers/${manager.id}`)}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold">
                {manager.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-800 dark:text-white">{manager.name}</div>
                <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                  <span>@{manager.username}</span>
                  {manager.phone && <span>{manager.phone}</span>}
                </div>
              </div>
            </div>
          ))}
          {managers.length === 0 && (
            <div className="text-center py-10 text-gray-400">Bu markaz uchun managerlar topilmadi.</div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showCreateManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreateManager(false)}
          >
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">Manager yaratish</h2>
                  <p className="text-sm text-gray-500">Bu markaz uchun yangi manager yaratish.</p>
                </div>
                <button onClick={() => setShowCreateManager(false)} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ismi *</label>
                  <input
                    value={managerForm.name}
                    onChange={(e) => setManagerForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="input-field w-full"
                    placeholder="To'liq ismi"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefon *</label>
                    <input
                      value={managerForm.phone}
                      onChange={(e) => setManagerForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="input-field w-full"
                      placeholder="+998 90 123 45 67"
                      type="tel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Kod</label>
                    <input
                      value={managerForm.password}
                      onChange={(e) => setManagerForm((prev) => ({ ...prev, password: e.target.value }))}
                      className="input-field w-full"
                      placeholder="Telefon oxirgi 4 raqami"
                      type="text"
                    />
                    <p className="text-xs text-gray-400 mt-1">Agar bo'sh qoldirilsa, kod telefon oxirgi 4 raqamidan olinadi.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Jinsi</label>
                    <select
                      value={managerForm.gender}
                      onChange={(e) => setManagerForm((prev) => ({ ...prev, gender: e.target.value }))}
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
                      value={managerForm.email}
                      onChange={(e) => setManagerForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="input-field w-full"
                      placeholder="email@example.com"
                      type="email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Manzili</label>
                  <input
                    value={managerForm.address}
                    onChange={(e) => setManagerForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Tuman, ko'cha, uy raqami"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowCreateManager(false)} className="btn-ghost flex-1">Bekor</button>
                  <button
                    onClick={submitCreateManager}
                    disabled={createManagerMutation.isLoading}
                    className="btn-primary flex-1 disabled:opacity-40"
                  >
                    {createManagerMutation.isLoading ? 'Saqlanmoqda...' : 'Yaratish'}
                  </button>
                </div>
                {createManagerMutation.error && (
                  <p className="text-xs text-red-500 text-center">{friendlyAiErrorMessage(createManagerMutation.error)}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Groups */}
      {Array.isArray(branch.groups) && branch.groups.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
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
                  <span>{group._count.students} o'quvchi</span>
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

      {/* Students */}
      <motion.div
        id="branch-students"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card mt-6"
      >
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <GraduationCap size={20} /> O'quvchilari ({students.length})
        </h2>
        <div className="space-y-2">
          {students.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold">
                {s.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-800 dark:text-white">{s.name}</div>
                <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                  <span>@{s.username}</span>
                  {s.group?.name && <span>{s.group.name}</span>}
                  {s.teacher?.name && <span>O'qituvchi: {s.teacher.name}</span>}
                </div>
              </div>
              {s.phone && <div className="text-xs text-gray-600 dark:text-gray-400">{s.phone}</div>}
              <div className={`badge text-xs ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {s.isActive ? 'Faol' : 'Nofaol'}
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <div className="text-center py-10 text-gray-400">Bu markaz uchun o'quvchilar topilmadi.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
