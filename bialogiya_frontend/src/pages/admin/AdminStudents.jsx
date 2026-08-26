import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { GraduationCap, Trophy } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { getLevelProgress } from '../../utils/format';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';

export default function AdminStudents() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: students = [], isLoading } = useQuery({ 
    queryKey: ['all-students'], 
    queryFn: () => api.get('/admin/students').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    })
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/toggle`),
    onSuccess: () => { qc.invalidateQueries(['all-students']); toast.success('Holat yangilandi'); },
  });

  const filtered = Array.isArray(students)
    ? students.filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.username?.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div className="dashboard-shell">
      <PageHeader
        title="O'quvchilar"
        subtitle={`Markazdagi barcha ro'yxatdan o'tgan o'quvchilar (${students.length})`}
      />

      <div className="filter-bar mb-1">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="O'quvchi ismi yoki username bo'yicha qidirish..."
        />
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} ta o'quvchi
        </span>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
      ) : filtered.length > 0 ? (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>O'quvchi</th>
                <th>Guruh</th>
                <th>O'qituvchi</th>
                <th>Daraja / XP</th>
                <th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const { level } = getLevelProgress(s.xp || 0);
                return (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar avatar-md">
                          {s.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {s.name}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            @{s.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {s.group?.name || 'Guruhsiz'}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {s.teacher?.name || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-orange text-xs font-semibold">
                        <Trophy size={11} className="mr-1" /> Lv.{level} · {s.xp || 0} XP
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleMutation.mutate(s.id)}
                        className="cursor-pointer transition-transform active:scale-95"
                      >
                        <StatusBadge status={s.isActive ? 'faol' : 'nofaol'} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title={search ? "O'quvchi topilmadi" : "Hozircha o'quvchilar yo'q"}
          description={search ? `"${search}" so'rovi bo'yicha hech qanday o'quvchi topilmadi` : "Guruhlarga o'quvchilar qo'shilishi bilan bu yerda aks etadi"}
        />
      )}
    </div>
  );
}
