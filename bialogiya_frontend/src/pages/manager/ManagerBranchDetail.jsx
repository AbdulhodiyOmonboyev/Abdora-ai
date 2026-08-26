import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Building2, Users, BookOpen, GraduationCap, MapPin, Edit2, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';

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
      qc.invalidateQueries({ queryKey: ['manager-branch-detail', id] });
      qc.invalidateQueries({ queryKey: ['manager-branches'] });
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
    return <div className="dashboard-shell py-20 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>;
  }

  if (error || !branch?.id) {
    return (
      <div className="dashboard-shell py-20 text-center text-sm" style={{ color: 'var(--error)' }}>
        {error ? friendlyAiErrorMessage(error) : 'Filial topilmadi'}
      </div>
    );
  }

  const kpis = [
    { icon: Users, label: "O'qituvchilar", value: branch._count?.teachers || branch.teachers?.length || 0, iconColor: 'var(--primary)', iconBg: 'rgba(240, 100, 19, 0.1)' },
    { icon: GraduationCap, label: "O'quvchilar", value: branch.studentsCount || 0, iconColor: 'var(--secondary)', iconBg: 'rgba(37, 99, 235, 0.1)' },
    { icon: BookOpen, label: 'Guruhlar', value: branch.groups?.length || 0, iconColor: 'var(--success)', iconBg: 'rgba(22, 163, 74, 0.1)' },
  ];

  return (
    <div className="dashboard-shell">
      <PageHeader
        breadcrumb={
          <div className="flex items-center gap-2">
            <Link to="/manager/branches" className="hover:underline" style={{ color: 'var(--text-muted)' }}>Filiallar</Link>
            <span style={{ color: 'var(--border)' }}>/</span>
            <span style={{ color: 'var(--text-primary)' }}>{branch.name}</span>
          </div>
        }
        title={branch.name}
        subtitle="Filial parametrlari, guruhlar va o'qituvchilar tarkibi"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/manager/branches')} className="btn-ghost btn-sm">
              <ArrowLeft size={14} /> Orqaga
            </button>
            <button onClick={openEditModal} className="btn-primary btn-sm">
              <Edit2 size={14} /> Tahrirlash
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <section className="stats-grid">
        {kpis.map((kpi, i) => (
          <StatCard
            key={kpi.label}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            iconColor={kpi.iconColor}
            iconBg={kpi.iconBg}
            delay={i * 0.05}
          />
        ))}
      </section>

      {/* Branch Info & Teachers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Branch Info */}
        <div className="panel-card space-y-4">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Tafsilot</span>
              <h2 className="panel-title">Filial ma'lumotlari</h2>
            </div>
            <StatusBadge status="faol" />
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--secondary-background)' }}>
              <MapPin size={16} className="mt-0.5" style={{ color: 'var(--primary)' }} />
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Manzil</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {branch.address || "Manzil ko'rsatilmagan"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--secondary-background)' }}>
              <Building2 size={16} className="mt-0.5" style={{ color: 'var(--secondary)' }} />
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>O'quvchi sig'imi</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {branch.studentCapacity ? `${branch.studentCapacity} o'rin` : "Cheklanmagan"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Groups in Branch */}
        <div className="panel-card space-y-4">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Guruhlar</span>
              <h2 className="panel-title">Filial guruhlari</h2>
            </div>
            <Link to="/manager/groups" className="panel-link">
              Barchasi
            </Link>
          </div>

          {Array.isArray(branch.groups) && branch.groups.length > 0 ? (
            <div className="space-y-2">
              {branch.groups.slice(0, 5).map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between p-3 rounded-xl transition-colors"
                  style={{ backgroundColor: 'var(--secondary-background)' }}
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {g.name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {g.subject || "Fan ko'rsatilmagan"}
                    </div>
                  </div>
                  <span className="badge badge-gray text-xs">
                    {g._count?.students || 0} o'quvchi
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="Guruhlar yo'q"
              description="Ushbu filialda hozircha faol guruhlar mavjud emas"
            />
          )}
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
                  <h2 className="modal-title">Filialni tahrirlash</h2>
                  <p className="modal-subtitle">Filial ma'lumotlarini o'zgartirish</p>
                </div>
                <button onClick={() => setShowEdit(false)} className="btn-icon flex-shrink-0">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Filial nomi *</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                    placeholder="Filial nomi"
                  />
                </div>
                <div>
                  <label className="form-label">Manzil</label>
                  <input
                    value={editForm.address}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="input-field"
                    placeholder="Tuman, ko'cha, uy raqami"
                  />
                </div>
                <div>
                  <label className="form-label">O'quvchi sig'imi</label>
                  <input
                    type="number"
                    value={editForm.studentCapacity}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, studentCapacity: e.target.value }))}
                    className="input-field"
                    placeholder="Jami o'quvchi soni"
                  />
                </div>

                {updateBranchMutation.error && (
                  <p className="form-error text-center">{friendlyAiErrorMessage(updateBranchMutation.error)}</p>
                )}

                <div className="modal-footer">
                  <button onClick={() => setShowEdit(false)} className="btn-ghost">Bekor qilish</button>
                  <button
                    onClick={submitEdit}
                    disabled={!editForm.name || updateBranchMutation.isPending}
                    className="btn-primary"
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
