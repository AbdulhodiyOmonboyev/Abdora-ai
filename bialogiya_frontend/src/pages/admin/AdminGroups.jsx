import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, BookOpen, User } from 'lucide-react';
import api from '../../config/axios';
import { getSubjectLabel, getSubjectBadgeClass } from '../../utils/subjects';
import { useAuthStore } from '../../store/authStore';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';

export default function AdminGroups() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryKey = user?.role === 'manager' ? ['manager-groups', user.centerId] : ['all-groups'];
  const { data: groups = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get('/groups/all').then(r => r.data.data || []),
  });

  return (
    <div className="dashboard-shell">
      <PageHeader
        title="Guruhlar"
        subtitle={`Markazning barcha faol guruhlari (${groups.length})`}
      />

      {isLoading ? (
        <div className="py-20 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
      ) : groups?.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="panel-card cursor-pointer group hover:border-[var(--primary)] transition-all"
              onClick={() => navigate(`/${user?.role === 'manager' ? 'manager' : 'admin'}/groups/${g.id}`)}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {g.icon || '📚'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                      {g.name}
                    </h3>
                    <div className="mt-1">
                      <span className={`badge text-[11px] ${getSubjectBadgeClass(g.subject)}`}>
                        {getSubjectLabel(g.subject)}
                      </span>
                    </div>
                  </div>
                </div>
                <StatusBadge status="faol" />
              </div>

              <div className="space-y-2 pt-3 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Users size={13} style={{ color: 'var(--primary)' }} /> O'quvchilar:
                  </span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {g._count?.students || g.students?.length || 0} nafar
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <User size={13} style={{ color: 'var(--secondary)' }} /> O'qituvchi:
                  </span>
                  <span className="font-semibold truncate max-w-[140px]" style={{ color: 'var(--text-primary)' }}>
                    {g.teacher?.name || 'Biriktirilmagan'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="Guruhlar mavjud emas"
          description="Hozircha tizimda faol o'quv guruhlari yaratilmagan"
        />
      )}
    </div>
  );
}
