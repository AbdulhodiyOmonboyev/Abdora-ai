import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, GraduationCap } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { getLevelProgress } from '../../utils/format';

export default function AdminStudents() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: students = [] } = useQuery({ 
    queryKey: ['all-students'], 
    queryFn: () => api.get('/admin/students').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    })
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/toggle`),
    onSuccess: () => { qc.invalidateQueries(['all-students']); toast.success('Status updated'); },
  });

  const filtered = Array.isArray(students) ? students.filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.username?.toLowerCase().includes(search.toLowerCase())) : [];

  return (
    <div className="dashboard-shell max-w-5xl mx-auto">
      <header className="dashboard-header">
        <div>
          <span className="dashboard-badge"><GraduationCap size={12} /> Abdora AI</span>
          <h1>Students ({students?.length || 0})</h1>
          <p>O'quvchilar ro'yxati va statuslari ma'lum qiladi.</p>
        </div>
      </header>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..."
          className="input-field pl-10" />
      </div>

      <div className="panel-card overflow-hidden p-0">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="dashboard-table w-full text-left text-sm">
              <thead><tr><th>O'quvchi</th><th>Guruh</th><th>O'qituvchi</th><th>Daromad</th><th>Holat</th></tr></thead>
              <tbody>
                {filtered.map((s, i) => {
                  const { level } = getLevelProgress(s.xp);
                  return <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                    <td><div className="flex items-center gap-2.5"><div className="w-8 h-8 gradient-bg rounded-full text-white grid place-items-center text-xs font-semibold">{s.name?.charAt(0)}</div><div><div className="font-semibold text-[var(--text-primary)]">{s.name}</div><div className="text-xs text-[var(--text-muted)]">@{s.username}</div></div></div></td>
                    <td className="dark:text-slate-300">{s.group?.name || 'No group'}</td>
                    <td className="dark:text-slate-400">{s.teacher?.name || '-'}</td>
                    <td className="dark:text-slate-300">Lv.{level} · {s.xp || 0} XP</td>
                    <td><button onClick={() => toggleMutation.mutate(s.id)} className={`badge text-xs ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.isActive ? 'Active' : 'Inactive'}</button></td>
                  </motion.tr>;
                })}
              </tbody>
            </table>
          </div>
        ) : <div className="text-center py-16 dark:text-slate-400"><GraduationCap size={36} className="mx-auto mb-3 opacity-30" /><p>{search ? 'No students match your search' : 'No students yet'}</p></div>}
      </div>
    </div>
  );
}
