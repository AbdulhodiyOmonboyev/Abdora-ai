import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, GraduationCap, BookOpen, BarChart2, UserCheck, ArrowUpRight, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../config/axios';

export default function ManagerDashboard() {
  const { data } = useQuery({ queryKey: ['manager-stats'], queryFn: () => api.get('/admin/stats').then(r => r.data.data) });

  const stats = [
    { icon: Users, label: 'Jami o\'qituvchilar', value: data?.totalTeachers || 0, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: GraduationCap, label: 'Jami o\'quvchilar', value: data?.totalStudents || 0, color: 'text-secondary', bg: 'bg-secondary/10' },
    { icon: BookOpen, label: 'Jami guruhlar', value: data?.totalGroups || 0, color: 'text-green-500', bg: 'bg-green-50' },
    { icon: BarChart2, label: 'Bugun faol', value: data?.activeToday || 0, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  const chartData = data?.dailyActivity || [];

  return (
    <div className="dashboard-shell dashboard-page-manager max-w-6xl mx-auto">
      <header className="dashboard-header dashboard-header-plain">
        <div>
          <span className="dashboard-badge"><Sparkles size={12} /> Abdora AI</span>
          <h1>Menejer paneli</h1>
          <p>Markazingizning kundalik faoliyatini bir joydan boshqaring.</p>
        </div>
        <div className="dashboard-header-actions">
          <span className="header-status">Live</span>
          <Link to="/manager/branches" className="header-button">Filiallarni ko‘rish <ArrowUpRight size={14} /></Link>
        </div>
      </header>

      <section className="stats-grid">
        {stats.map(({ icon: Icon, label, value, color, bg }, i) => (
          <motion.button
            key={`${label}-${i}`}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
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

      </section>
    </div>
  );
}
