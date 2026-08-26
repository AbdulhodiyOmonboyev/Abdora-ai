import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Inbox, Phone, MessageSquare, Trash2, Check, X, PhoneCall, Calendar } from 'lucide-react';
import api from '../../config/axios';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';

const FILTERS = [
  { key: '', label: 'Hammasi' },
  { key: 'new', label: 'Yangi' },
  { key: 'contacted', label: "Bog'lanildi" },
  { key: 'converted', label: "O'qishga yozildi" },
  { key: 'rejected', label: 'Rad etildi' },
];

export default function AdminApplications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [confirm, setConfirm] = useState(null);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications', filter],
    queryFn: () => api.get('/applications', { params: filter ? { status: filter } : {} }).then(r => r.data?.data || []),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.put(`/applications/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries(['applications']),
  });

  const deleteApp = useMutation({
    mutationFn: (id) => api.delete(`/applications/${id}`),
    onSuccess: () => qc.invalidateQueries(['applications']),
  });

  const handleDelete = (a) => {
    setConfirm({
      title: `"${a.name}" arizasini o'chirish`,
      message: "Bu ariza ro'yxatdan butunlay o'chiriladi.",
      onConfirm: () => deleteApp.mutate(a.id),
    });
  };

  return (
    <div className="dashboard-shell max-w-4xl">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />

      <PageHeader
        title="Arizalar"
        subtitle="Landing sahifasi orqali yuborilgan murojaatlar va arizalar"
      />

      {/* Tabs */}
      <div className="tab-bar mb-2">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`tab-item ${filter === f.key ? 'active' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
      ) : applications?.length > 0 ? (
        <div className="space-y-3">
          {applications.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="panel-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="avatar avatar-md flex-shrink-0">
                    {a.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {a.name}
                      </span>
                      <StatusBadge status={a.status === 'converted' ? 'yozildi' : a.status === 'contacted' ? 'boglanildi' : a.status === 'rejected' ? 'rad' : 'yangi'} />
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <a href={`tel:${a.phone}`} className="flex items-center gap-1 font-medium hover:underline" style={{ color: 'var(--primary)' }}>
                        <Phone size={12} /> {a.phone}
                      </a>
                      <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <Calendar size={12} /> {new Date(a.createdAt).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {a.message && (
                      <div className="mt-2.5 p-2.5 rounded-lg text-xs flex items-start gap-2" style={{ backgroundColor: 'var(--secondary-background)', color: 'var(--text-secondary)' }}>
                        <MessageSquare size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                        <span className="leading-relaxed">{a.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(a)}
                    className="btn-icon"
                    title="O'chirish"
                  >
                    <Trash2 size={15} style={{ color: 'var(--error)' }} />
                  </button>
                </div>
              </div>

              {a.status !== 'converted' && a.status !== 'rejected' && (
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  {a.status === 'new' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: a.id, status: 'contacted' })}
                      className="btn-ghost btn-sm"
                      style={{ color: 'var(--info)' }}
                    >
                      <PhoneCall size={13} /> Bog'lanildi
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus.mutate({ id: a.id, status: 'converted' })}
                    className="btn-ghost btn-sm"
                    style={{ color: 'var(--success)' }}
                  >
                    <Check size={13} /> O'qishga yozildi
                  </button>
                  <button
                    onClick={() => updateStatus.mutate({ id: a.id, status: 'rejected' })}
                    className="btn-ghost btn-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={13} /> Rad etish
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Inbox}
          title="Hozircha arizalar yo'q"
          description={filter ? "Bu toifada arizalar topilmadi" : "Landing sahifadan kelgan arizalar shu yerda ko'rinadi"}
        />
      )}
    </div>
  );
}
