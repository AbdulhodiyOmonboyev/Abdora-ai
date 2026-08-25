import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Users, GraduationCap, UserCheck, BarChart2, Building2, Inbox, MapPin, ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../config/axios';
import { useAuthStore } from '../../store/authStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data } = useQuery({ queryKey: ['admin-stats', user?.role, user?.centerId], queryFn: () => api.get('/admin/stats').then(r => r.data.data) });

  const role = user?.role || 'admin';
  const baseRole = role === 'manager' ? 'manager' : role === 'reception' ? 'reception' : 'admin';

  const title = role === 'reception' ? 'Qabulxona paneli' : role === 'manager' ? 'Menejer paneli' : 'Admin Paneli';
  const subtitle = role === 'reception' ? 'Abdora AI — Qabulxona umumiy ko\'rinishi' : role === 'manager' ? 'Abdora AI — Filial ko\'rinishi' : 'Abdora AI — Platform Overview';

  const stats = [
    ...(baseRole === 'admin' ? [
      { icon: Building2, label: 'Markazlar', value: data?.totalBranches || 0, color: 'text-orange-500', bg: 'bg-orange-50', path: '/admin/branches' },
      { icon: UserCheck, label: 'Managerlar', value: data?.totalManagers || 0, color: 'text-violet-500', bg: 'bg-violet-50', path: '/admin/managers' },
      { icon: GraduationCap, label: 'O\'quvchilar', value: data?.totalStudents || 0, color: 'text-blue-500', bg: 'bg-blue-50', path: '/admin/students' },
      { icon: BarChart2, label: 'Bugun faol', value: data?.activeToday || 0, color: 'text-emerald-500', bg: 'bg-emerald-50', path: '/admin/students' },
    ] : [
      { icon: Users, label: 'O\'qituvchilar', value: data?.totalTeachers || 0, color: 'text-orange-500', bg: 'bg-orange-50', path: `/${baseRole}/teachers` },
      { icon: GraduationCap, label: 'O\'quvchilar', value: data?.totalStudents || 0, color: 'text-blue-500', bg: 'bg-blue-50', path: `/${baseRole}/students` },
      { icon: BarChart2, label: 'Bugun faol', value: data?.activeToday || 0, color: 'text-emerald-500', bg: 'bg-emerald-50', path: `/${baseRole}/students` },
      { icon: UserCheck, label: 'Bu hafta yangi', value: data?.newThisWeek || 0, color: 'text-violet-500', bg: 'bg-violet-50', path: `/${baseRole}/students` },
    ])];

  const visibleStats = stats.slice(0, 4);
  const chartData = data?.dailyActivity || [];

  return (
    <div className="dashboard-shell dashboard-page-admin max-w-6xl mx-auto">
      <header className="dashboard-header dashboard-header-plain">
        <div>
          <span className="dashboard-badge"><Sparkles size={12} /> Abdora AI</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="dashboard-header-actions">
          <span className="header-status">Live</span>
          <button type="button" onClick={() => navigate(`/${baseRole}/dashboard`)} className="header-button">Barcha ma’lumotlar</button>
        </div>
      </header>

      <section className="stats-grid">
        {visibleStats.map(({ icon: Icon, label, value, color, bg, path }, i) => (
          <motion.button
            key={`${label}-${i}`}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(path)}
            className="dashboard-stat-card"
          >
            <div className="stat-icon-wrap">
              <Icon size={18} className={color} />
            </div>
            <div className="stat-copy">
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
            <div className="stat-trend"><TrendingUp size={14} /></div>
          </motion.button>
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="panel-card chart-card">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Faollik</span>
              <h2>Kunlik faollik</h2>
            </div>
            <span className="tag-pill">7 kun</span>
          </div>
          {chartData.length > 0 ? (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={{ borderRadius: '14px', background: '#0f172a', border: '1px solid rgba(148,163,184,0.24)', color: '#e2e8f0' }} />
                  <Line type="monotone" dataKey="students" stroke="#f97316" strokeWidth={2.5} name="O'quvchilar" dot={{ r: 3, fill: '#f97316' }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="teachers" stroke="#38bdf8" strokeWidth={2.5} name="O'qituvchilar" dot={{ r: 3, fill: '#38bdf8' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">Faollik ma’lumotlari yo‘q.</div>
          )}
        </div>

        <div className="panel-card side-card">
          <div className="panel-header compact">
            <div>
              <span className="panel-kicker">Tezkor</span>
              <h2>Umumiy ko‘rsatkichlar</h2>
            </div>
          </div>
          <div className="mini-metrics">
            <div className="mini-metric orange">
              <span>Bugun</span>
              <strong>{data?.activeToday || 0}</strong>
            </div>
            <div className="mini-metric blue">
              <span>Yangi</span>
              <strong>{data?.newThisWeek || 0}</strong>
            </div>
            <div className="mini-metric teal">
              <span>Arizalar</span>
              <strong>{data?.pendingApplications || 0}</strong>
            </div>
          </div>
        </div>
      </section>

      {baseRole === 'admin' && (
        <section className="panel-card table-card">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Markazlar</span>
              <h2>Markazlar ro‘yxati</h2>
            </div>
            <Link to="/admin/branches" className="panel-link">Barchasi <ArrowRight size={13} /></Link>
          </div>

          {Array.isArray(data?.branches) && data.branches.length > 0 ? (
            <div className="branch-list">
              {data.branches.map((b) => (
                <button key={b.id} type="button" onClick={() => navigate(`/admin/branches/${b.id}`)} className="branch-row">
                  <div className="branch-main">
                    <div className="branch-dot"><Building2 size={14} /></div>
                    <div className="branch-copy">
                      <strong>{b.name}</strong>
                      <span>{b.address || 'Manzil ko’rsatilmagan'}</span>
                    </div>
                  </div>
                  <div className="branch-meta">
                    <span>{b.teachersCount || 0} o‘qituvchilar</span>
                    <span>{b.studentsCount || 0} o‘quvchilar</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">Hali markazlar qo‘shilmagan.</div>
          )}
        </section>
      )}
    </div>
  );
}
