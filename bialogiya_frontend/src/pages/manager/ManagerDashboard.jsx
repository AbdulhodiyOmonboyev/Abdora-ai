import { useQuery } from '@tanstack/react-query';
import { Users, GraduationCap, BookOpen, BarChart2, ArrowRight, ArrowUpRight, UserPlus, Receipt, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../config/axios';
import { useThemeStore } from '../../store/themeStore';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import ChartCard from '../../components/ui/ChartCard';
import EmptyState from '../../components/ui/EmptyState';

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

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { data, isLoading } = useQuery({
    queryKey: ['manager-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data.data)
  });

  const stats = [
    {
      icon: Users,
      label: "O'qituvchilar",
      value: data?.totalTeachers ?? 0,
      iconColor: 'var(--primary)',
      iconBg: 'rgba(240, 100, 19, 0.1)',
      path: '/manager/teachers'
    },
    {
      icon: GraduationCap,
      label: "O'quvchilar",
      value: data?.totalStudents ?? 0,
      iconColor: 'var(--secondary)',
      iconBg: 'rgba(37, 99, 235, 0.1)',
      path: '/manager/students'
    },
    {
      icon: BookOpen,
      label: 'Guruhlar',
      value: data?.totalGroups ?? 0,
      iconColor: 'var(--success)',
      iconBg: 'rgba(22, 163, 74, 0.1)',
      path: '/manager/groups'
    },
    {
      icon: BarChart2,
      label: 'Bugun faol',
      value: data?.activeToday ?? 0,
      iconColor: 'var(--accent)',
      iconBg: 'rgba(124, 58, 237, 0.1)',
      path: '/manager/students'
    },
  ];

  const chartData = data?.dailyActivity || [];

  const lineColorOrange = theme === 'dark' ? '#FF6A00' : '#F06413';
  const lineColorBlue = theme === 'dark' ? '#4D8DFF' : '#2563EB';
  const gridColor = theme === 'dark' ? 'rgba(34,48,71,0.8)' : 'rgba(229,231,235,0.8)';
  const tickColor = theme === 'dark' ? '#64748B' : '#98A2B3';

  return (
    <div className="dashboard-shell">
      <PageHeader
        title="Manager paneli"
        subtitle="Markazingizning kundalik faoliyatini bir joydan boshqaring"
        actions={
          <div className="flex items-center gap-2">
            <span className="header-status">Live</span>
            <Link to="/manager/branches" className="btn-primary btn-sm">
              Filiallarni ko'rish <ArrowUpRight size={14} />
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
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

      {/* Charts & Quick Insights */}
      <section className="dashboard-grid">
        <ChartCard
          kicker="Faollik"
          title="Kunlik faollik"
          tag="7 kun"
          minHeight={260}
        >
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
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
              description="Hozircha faollik ma'lumotlari kuzatilmagan"
            />
          )}
        </ChartCard>

        {/* Side Panel: Quick Actions & Summary */}
        <div className="panel-card flex flex-col justify-between">
          <div>
            <div className="panel-header">
              <div>
                <span className="panel-kicker">Tezkor</span>
                <h2 className="panel-title">Amallar & Ko'rsatkichlar</h2>
              </div>
            </div>

            <div className="mini-metrics mb-4">
              <div className="mini-metric">
                <span className="mini-metric-label">Bu hafta yangi</span>
                <span className="mini-metric-value" style={{ color: 'var(--primary)' }}>
                  {isLoading ? '—' : data?.newThisWeek ?? 0}
                </span>
              </div>
              <div className="mini-metric">
                <span className="mini-metric-label">Arizalar & Lidlar</span>
                <span className="mini-metric-value" style={{ color: 'var(--secondary)' }}>
                  {isLoading ? '—' : data?.pendingApplications ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              Tezkor bo'limlar
            </p>
            {[
              { label: 'Lidlar CRM', path: '/leads', icon: UserPlus },
              { label: 'Guruhlar jadvali', path: '/manager/groups', icon: BookOpen },
              { label: 'Qabulxona', path: '/manager/reception', icon: Calendar },
              { label: 'Moliya hisoboti', path: '/finance', icon: Receipt },
            ].map(l => (
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
                <div className="flex items-center gap-2">
                  <l.icon size={15} style={{ color: 'var(--primary)' }} />
                  <span className="text-sm font-medium">{l.label}</span>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
