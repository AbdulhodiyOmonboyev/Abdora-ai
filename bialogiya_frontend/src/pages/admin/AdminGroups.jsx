import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, BookOpen } from 'lucide-react';
import api from '../../config/axios';
import { getSubjectLabel, getSubjectBadgeClass } from '../../utils/subjects';
import { useAuthStore } from '../../store/authStore';

export default function AdminGroups() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryKey = user?.role === 'manager' ? ['manager-groups', user.centerId] : ['all-groups'];
  const { data: groups = [] } = useQuery({
    queryKey,
    queryFn: () => api.get('/groups/all').then(r => r.data.data),
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Guruhlar ({groups.length})</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups?.map((g, i) => (
          <motion.div key={g.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card hover:shadow-soft transition-all cursor-pointer"
            onClick={() => navigate(`/${user?.role === 'manager' ? 'manager' : 'admin'}/groups/${g.id}`)}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-11 h-11 gradient-bg rounded-2xl flex items-center justify-center text-2xl">{g.icon || '📚'}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 dark:text-white truncate">{g.name}</h3>
                <span className={`badge text-xs ${getSubjectBadgeClass(g.subject)}`}>
                  {getSubjectLabel(g.subject)}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-gray-500">
              <div className="flex items-center gap-1.5"><Users size={12} /> {g._count?.students || g.students?.length || 0} o'quvchi</div>
              <div className="flex items-center gap-1.5"><BookOpen size={12} /> O'qituvchi: {g.teacher?.name || 'Biriktirilmagan'}</div>
            </div>
          </motion.div>
        ))}
        {groups?.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p>Hali guruh yaratilmagan</p>
          </div>
        )}
      </div>
    </div>
  );
}
