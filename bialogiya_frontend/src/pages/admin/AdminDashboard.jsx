import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Users, GraduationCap, UserCheck, BarChart2, Building2, Inbox, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import api from '../../config/axios';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import ChartCard from '../../components/ui/ChartCard';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';

// Theme-aware chart tooltip
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        borderRadius: 12,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
        padding: '0.6rem 0.875rem',
        boxShadow: 'var(--shadow-md)',
        fontSize: '0.8rem',
      }}
    >
      <div className="font-semibold mb-1" style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme } = useThemeStore();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats', user?.role, user?.centerId],
    queryFn: () => api.get('/admin/stats').then(r => r.data.data),
  });

  const role = user?.role || 'admin';
  const baseRole = role === 'manager' ? 'manager' : role === 'reception' ? 'reception' : 'admin';

  const title = role === 'reception' ? 'Qabulxona paneli'
    : role === 'manager' ? 'Menejer paneli'
    : 'Admin Paneli';
  const subtitle = role === 'reception' ? "Abdora AI — Qabulxona umumiy ko'rinishi"
    : role === 'manager' ? "Abdora AI — Filial ko'rinishi"
    : 'Platforma bo\'yicha umumiy ko\'rsatkichlar';

  const stats = [
    ...(baseRole === 'admin' ? [
      {
        icon: Building2, label: 'Markazlar', value: data?.totalBranches ?? 0,
        iconColor: 'var(--primary)', iconBg: 'rgba(240, 100, 19, 0.1)',
        path: '/admin/branches',
      },
      {
        icon: UserCheck, label: 'Managerlar', value: data?.totalManagers ?? 0,
        iconColor: 'var(--accent)', iconBg: 'rgba(124, 58, 237, 0.1)',
        path: '/admin/managers',
      },
      {
        icon: GraduationCap, label: "O'quvchilar", value: data?.totalStudents ?? 0,
        iconColor: 'var(--secondary)', iconBg: 'rgba(37, 99, 235, 0.1)',
        path: '/admin/students',
      },
      {
        icon: BarChart2, label: 'Bugun faol', value: data?.activeToday ?? 0,
        iconColor: 'var(--success)', iconBg: 'rgba(22, 163, 74, 0.1)',
        path: '/admin/students',
      },
    ] : [
      {
        icon: Users, label: "O'qituvchilar", value: data?.totalTeachers ?? 0,
        iconColor: 'var(--primary)', iconBg: 'rgba(240, 100, 19, 0.1)',
        path: `/${baseRole}/teachers`,
      },
      {
        icon: GraduationCap, label: "O'quvchilar", value: data?.totalStudents ?? 0,
        iconColor: 'var(--secondary)', iconBg: 'rgba(37, 99, 235, 0.1)',
        path: `/${baseRole}/students`,
      },
      {
        icon: BarChart2, label: 'Bugun faol', value: data?.activeToday ?? 0,
        iconColor: 'var(--success)', iconBg: 'rgba(22, 163, 74, 0.1)',
        path: `/${baseRole}/students`,
      },
      {
        icon: Inbox, label: 'Bu hafta yangi', value: data?.newThisWeek ?? 0,
        iconColor: 'var(--accent)', iconBg: 'rgba(124, 58, 237, 0.1)',
        path: `/${baseRole}/students`,
      },
    ]),
  ];

  const chartData = data?.dailyActivity || [];

  // Chart colors adapt to theme
  const lineColorOrange = theme === 'dark' ? '#FF6A00' : '#F06413';
  const lineColorBlue = theme === 'dark' ? '#4D8DFF' : '#2563EB';
  const gridColor = theme === 'dark' ? 'rgba(34,48,71,0.8)' : 'rgba(229,231,235,0.8)';
  const tickColor = theme === 'dark' ? '#64748B' : '#98A2B3';

  return (
    <div className="dashboard-shell">
      {/* Header */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2">
            <span className="header-status">Live</span>
            <button
              type="button"
              onClick={() => navigate(`/${baseRole}/dashboard`)}
              className="btn-ghost btn-sm"
            >
              Barcha ma'lumotlar
            </button>
          </div>
        }
      />

      {/* KPI Stats */}
      <section className="stats-grid">
        {stats.map(({ icon, label, value, iconColor, iconBg, path }, i) => (
          <StatCard
            key={label}
            icon={icon}
            label={label}
            value={isLoading ? '—' : value}
            trend="up"
            iconColor={iconColor}
            iconBg={iconBg}
            onClick={() => navigate(path)}
            delay={i * 0.05}
          />
        ))}
      </section>

      {/* Analytics Grid */}
      <section className="dashboard-grid">
        {/* Chart */}
        <ChartCard
          kicker="Faollik"
          title="Kunlik faollik"
          tag="7 kun"
        >
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke={lineColorOrange}
                  strokeWidth={2.5}
                  name="O'quvchilar"
                  dot={{ r: 3, fill: lineColorOrange, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="teachers"
                  stroke={lineColorBlue}
                  strokeWidth={2.5}
                  name="O'qituvchilar"
                  dot={{ r: 3, fill: lineColorBlue, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              title="Faollik ma'lumotlari yo'q"
              description="Hozircha kunlik faollik kuzatilmagan"
            />
          )}
        </ChartCard>

        {/* Side panel */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Tezkor</span>
              <h2 className="panel-title">Umumiy ko'rsatkichlar</h2>
            </div>
          </div>
          <div className="mini-metrics">
            <div className="mini-metric">
              <span className="mini-metric-label">Bugun faol</span>
              <span className="mini-metric-value" style={{ color: 'var(--primary)' }}>
                {isLoading ? '—' : data?.activeToday ?? 0}
              </span>
            </div>
            <div className="mini-metric">
              <span className="mini-metric-label">Bu hafta yangi</span>
              <span className="mini-metric-value" style={{ color: 'var(--secondary)' }}>
                {isLoading ? '—' : data?.newThisWeek ?? 0}
              </span>
            </div>
            <div className="mini-metric">
              <span className="mini-metric-label">Arizalar</span>
              <span className="mini-metric-value" style={{ color: 'var(--success)' }}>
                {isLoading ? '—' : data?.pendingApplications ?? 0}
              </span>
            </div>
            {baseRole === 'admin' && (
              <div className="mini-metric">
                <span className="mini-metric-label">Jami o'qituvchilar</span>
                <span className="mini-metric-value" style={{ color: 'var(--accent)' }}>
                  {isLoading ? '—' : data?.totalTeachers ?? 0}
                </span>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="mt-4 space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              Tezkor havolalar
            </p>
            {[
              { label: 'Arizalar', path: '/admin/applications', show: baseRole === 'admin' },
              { label: 'Markazlar', path: '/admin/branches', show: baseRole === 'admin' },
              { label: 'Managerlar', path: '/admin/managers', show: baseRole === 'admin' },
              { label: "O'qituvchilar", path: `/${baseRole}/teachers` },
              { label: "O'quvchilar", path: `/${baseRole}/students` },
            ].filter(l => l.show !== false).map(l => (
              <Link
                key={l.path}
                to={l.path}
                className="flex items-center justify-between px-3 py-2 rounded-xl transition-colors group"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'var(--secondary-background)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <span className="text-sm font-medium">{l.label}</span>
                <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Centers Table (Admin only) */}
      {baseRole === 'admin' && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.25 }}
          className="panel-card"
        >
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Markazlar</span>
              <h2 className="panel-title">Markazlar ro'yxati</h2>
            </div>
            <Link to="/admin/branches" className="panel-link">
              Barchasi <ArrowRight size={13} />
            </Link>
          </div>

          {Array.isArray(data?.branches) && data.branches.length > 0 ? (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Markaz</th>
                    <th>Manzil</th>
                    <th>O'qituvchilar</th>
                    <th>O'quvchilar</th>
                    <th>Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {data.branches.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => navigate(`/admin/branches/${b.id}`)}
                      style={{ cursor: 'pointer' }}
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
                            {b.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {b.address || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="font-medium text-sm">{b.teachersCount || 0}</span>
                      </td>
                      <td>
                        <span className="font-medium text-sm">{b.studentsCount || 0}</span>
                      </td>
                      <td>
                        <StatusBadge status={b.isActive === false ? 'nofaol' : 'faol'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Building2}
              title="Hali markazlar qo'shilmagan"
              description="Birinchi markazni qo'shish uchun Markazlar sahifasiga o'ting"
              action={
                <Link to="/admin/branches" className="btn-primary btn-sm">
                  Markaz qo'shish
                </Link>
              }
            />
          )}
        </motion.section>
      )}
    </div>
  );
}
