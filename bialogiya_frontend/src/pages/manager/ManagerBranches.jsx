import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Building2, MapPin, ArrowRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../config/axios';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';

export default function ManagerBranches() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', studentCapacity: '' });
  const [localSearch, setLocalSearch] = useState('');
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search')?.trim().toLowerCase() || '';
  const search = localSearch.trim().toLowerCase() || urlSearch;

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['manager-branches'],
    queryFn: () => api.get('/users/manager/branches').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/branches', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager-branches'] });
      qc.invalidateQueries({ queryKey: ['manager-stats'] });
      setShowCreate(false);
      setForm({ name: '', address: '', studentCapacity: '' });
      toast.success('Filial muvaffaqiyatli yaratildi');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Filial yaratilmadi'),
  });

  const filteredBranches = Array.isArray(branches) ? (search
    ? branches.filter((branch) =>
        branch.name?.toLowerCase().includes(search)
        || branch.address?.toLowerCase().includes(search)
      )
    : branches) : [];

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
    <div className="dashboard-shell">
      <PageHeader
        title="Filiallar"
        subtitle="Markazingizga qarashli barcha o'quv filiallari"
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} /> Filial qo'shish
          </button>
        }
      />

      <div className="filter-bar mb-1">
        <SearchInput
          value={localSearch}
          onChange={setLocalSearch}
          placeholder="Filial nomi yoki manzil bo'yicha qidirish..."
        />
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          {filteredBranches.length} ta filial
        </span>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
      ) : filteredBranches.length > 0 ? (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Filial</th>
                <th>Manzil</th>
                <th>O'qituvchilar</th>
                <th>O'quvchilar</th>
                <th>Guruhlar</th>
                <th>Holat</th>
                <th className="text-right">Amal</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map((branch, index) => (
                <motion.tr
                  key={branch.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => navigate(`/manager/branches/${branch.id}`)}
                  className="cursor-pointer"
                >
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(240, 100, 19, 0.1)', border: '1px solid rgba(240, 100, 19, 0.18)' }}
                      >
                        <Building2 size={14} style={{ color: 'var(--primary)' }} />
                      </div>
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {branch.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {branch.address ? (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                        {branch.address}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <span className="font-semibold text-sm">{branch._count?.teachers || 0}</span>
                  </td>
                  <td>
                    <span className="font-semibold text-sm">{branch.studentsCount || 0}</span>
                  </td>
                  <td>
                    <span className="font-semibold text-sm">{branch.groups?.length || 0}</span>
                  </td>
                  <td>
                    <StatusBadge status="faol" />
                  </td>
                  <td>
                    <div className="flex justify-end">
                      <span className="btn-icon">
                        <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title={search ? "Filial topilmadi" : "Hozircha filiallar yo'q"}
          description={search ? `"${search}" qidiruvi bo'yicha filiallar mavjud emas` : "Markazingizga yangi filial qo'shing"}
          action={!search && (
            <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm">
              <Plus size={14} /> Filial qo'shish
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
                    <Building2 size={20} style={{ color: 'var(--primary)' }} />
                  </div>
                  <h2 className="modal-title">Filial qo'shish</h2>
                  <p className="modal-subtitle">Yangi o'quv filiali ma'lumotlarini kiriting</p>
                </div>
                <button onClick={closeModal} className="btn-icon flex-shrink-0">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Filial nomi *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                    placeholder="Masalan: Chilonzor filiali"
                  />
                </div>
                <div>
                  <label className="form-label">Manzil</label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="input-field"
                    placeholder="Tuman, ko'cha, mo'ljal"
                  />
                </div>
                <div>
                  <label className="form-label">O'quvchi sig'imi</label>
                  <input
                    type="number"
                    value={form.studentCapacity}
                    onChange={(e) => setForm((prev) => ({ ...prev, studentCapacity: e.target.value }))}
                    className="input-field"
                    placeholder="Jami o'quvchi o'rni"
                  />
                </div>

                {createMutation.error && (
                  <p className="form-error text-center">{createMutation.error.response?.data?.message || 'Filial yaratilmadi'}</p>
                )}

                <div className="modal-footer">
                  <button onClick={closeModal} className="btn-ghost">Bekor qilish</button>
                  <button
                    onClick={submitForm}
                    disabled={!form.name || createMutation.isPending}
                    className="btn-primary"
                  >
                    {createMutation.isPending ? 'Saqlanmoqda...' : 'Yaratish'}
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
