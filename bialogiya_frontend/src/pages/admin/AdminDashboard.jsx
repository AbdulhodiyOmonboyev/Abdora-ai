import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Users, GraduationCap, UserCheck, BookOpen, BarChart2, Bot, Building2, Inbox, MapPin, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../config/axios';
import { useAuthStore } from '../../store/authStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data } = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.get('/admin/stats').then(r => r.data.data) });

  const role = user?.role || 'admin';
  const baseRole = role === 'manager' ? 'manager' : role === 'reception' ? 'reception' : 'admin';

  const title = role === 'reception' ? 'Qabulxona paneli' : role === 'manager' ? 'Menejer paneli' : 'Admin Paneli';
  const subtitle = role === 'reception' ? 'Abdora AI — Qabulxona umumiy ko\'rinishi' : role === 'manager' ? 'Abdora AI — Filial ko\'rinishi' : 'Abdora AI — Platform Overview';

  const stats = [
    { icon: Users, label: 'O\'qituvchilar', value: data?.totalTeachers || 0, color: 'text-primary', bg: 'bg-primary/10', path: `/${baseRole}/teachers` },
    { icon: GraduationCap, label: 'O\'quvchilar', value: data?.totalStudents || 0, color: 'text-secondary', bg: 'bg-secondary/10', path: `/${baseRole}/students` },
    { icon: BookOpen, label: 'Guruhlar', value: data?.totalGroups || 0, color: 'text-green-500', bg: 'bg-green-50', path: baseRole === 'admin' ? '/admin/branches' : `/${baseRole}/groups` },
    { icon: Bot, label: 'AI Darslar', value: data?.aiLessons || 0, color: 'text-purple-500', bg: 'bg-purple-50', path: baseRole === 'admin' ? '/admin/branches' : `/${baseRole}/groups` },
    { icon: BarChart2, label: 'Bugun faol', value: data?.activeToday || 0, color: 'text-orange-500', bg: 'bg-orange-50', path: `/${baseRole}/students` },
    { icon: UserCheck, label: 'Bu hafta yangi', value: data?.newThisWeek || 0, color: 'text-teal-500', bg: 'bg-teal-50', path: `/${baseRole}/students` },
    ...(baseRole === 'admin' ? [
      { icon: Building2, label: 'Markazlar', value: data?.totalBranches || 0, color: 'text-blue-500', bg: 'bg-blue-50', path: '/admin/branches' },
      { icon: UserCheck, label: 'Managerlar', value: data?.totalManagers || 0, color: 'text-indigo-500', bg: 'bg-indigo-50', path: '/admin/managers' },
      { icon: Inbox, label: 'Yangi arizalar', value: data?.pendingApplications || 0, color: 'text-rose-500', bg: 'bg-rose-50', path: '/admin/applications' },
    ] : []),
  ].filter((tile) => baseRole !== 'admin' || !tile.path.endsWith('/teachers') && !tile.path.endsWith('/students'));

  const chartData = data?.dailyActivity || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="gradient-bg rounded-3xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="text-white/80 text-sm mt-1">{subtitle}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ icon: Icon, label, value, color, bg, path }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(path)}
            className="card flex items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Branches list */}
      {baseRole === 'admin' && Array.isArray(data?.branches) && data.branches.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Building2 size={16} className="text-primary" /> Markazlar ({data.branches.length})
            </h3>
            <Link to="/admin/branches" className="text-xs text-primary hover:underline flex items-center gap-1">
              Barchasi <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {data.branches.map((b) => (
              <div
                key={b.id}
                onClick={() => navigate(`/admin/branches/${b.id}`)}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold flex-shrink-0">
                  <Building2 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-800 dark:text-white truncate">{b.name}</div>
                  <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {b.address && (
                      <span className="flex items-center gap-1 truncate max-w-[220px]"><MapPin size={10} /> {b.address}</span>
                    )}
                    <span>{b.manager?.name ? `Manager: ${b.manager.name}` : 'Manager biriktirilmagan'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                  <span className="badge bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400">{b.teachersCount} o'qit.</span>
                  <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">{b.studentsCount} o'quv.</span>
                  <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">{b.groupsCount} guruh</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-primary" /> Kunlik faollik
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Line type="monotone" dataKey="students" stroke="#00BFA6" strokeWidth={2} name="O'quvchilar" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="teachers" stroke="#0099FF" strokeWidth={2} name="O'qituvchilar" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent users */}
      {data?.recentUsers?.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-800 dark:text-white mb-3">Yaqinda qo'shilganlar</h3>
          <div className="space-y-2">
            {data.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center text-white text-xs font-semibold">{u.name?.charAt(0)}</div>
                <div className="flex-1 text-sm min-w-0">
                  <span className="font-medium text-gray-800 dark:text-white truncate block">{u.name}</span>
                  <span className="text-gray-400 text-xs">@{u.username}</span>
                </div>
                <span className={`badge text-xs capitalize ${u.role === 'teacher' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>{u.role === 'teacher' ? 'O\'qituvchi' : u.role === 'student' ? 'O\'quvchi' : u.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
