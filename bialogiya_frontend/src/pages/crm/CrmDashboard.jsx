import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, TrendingUp, UserPlus, ArrowRight, Target,
  Phone, MessageSquare, Calendar,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, Cell, PieChart, Pie,
} from 'recharts';
import api from '../../config/axios';
import { useThemeStore } from '../../store/themeStore';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

const STATUS_ORDER = ['new', 'contacted', 'trial', 'enrolled'];
const STATUS_LABELS = {
  new:       { label: 'Yangi',          color: '#3B82F6' },
  contacted: { label: "Bog'lanildi",    color: '#8B5CF6' },
  trial:     { label: 'Sinov darsi',    color: '#F59E0B' },
  enrolled:  { label: "O'qishga kirdi", color: '#10B981' },
  frozen:    { label: 'Muzlatilgan',    color: '#64748B' },
  archived:  { label: 'Arxiv',          color: '#94A3B8' },
  lost:      { label: 'Chiqib ketdi',   color: '#EF4444' },
};

const SOURCE_LABELS = {
  instagram: { label: 'Instagram', icon: '📸', color: '#E4405F' },
  telegram:  { label: 'Telegram',  icon: '✈️', color: '#2AABEE' },
  referral:  { label: 'Tanish',    icon: '👥', color: '#10B981' },
  walkin:    { label: "O'zi keldi",icon: '🚶', color: '#F59E0B' },
  landing:   { label: 'Sayt',      icon: '🌐', color: '#8B5CF6' },
  other:     { label: 'Boshqa',    icon: '📌', color: '#64748B' },
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      borderRadius: 10, background: 'var(--card)',
      border: '1px solid var(--border)', color: 'var(--text-primary)',
      padding: '0.5rem 0.875rem', fontSize: '0.8rem', boxShadow: 'var(--shadow-md)',
    }}>
      <div className="font-semibold mb-1" style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill || p.color, display: 'inline-block' }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function CrmDashboard() {
  const { theme } = useThemeStore();
  const axisColor = theme === 'dark' ? '#4B5563' : '#E5E7EB';
  const labelColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';

  const { data: stats, isLoading } = useQuery({
    queryKey: ['lead-stats'],
    queryFn: () => api.get('/leads/stats').then(r => r.data?.data),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-all'],
    queryFn: () => api.get('/leads').then(r => r.data?.data || []),
  });

  // Source breakdown
  const sourceData = Object.entries(
    leads.reduce((acc, l) => {
      acc[l.source] = (acc[l.source] || 0) + 1;
      return acc;
    }, {})
  ).map(([key, count]) => ({
    name: SOURCE_LABELS[key]?.label || key,
    icon: SOURCE_LABELS[key]?.icon || '📌',
    color: SOURCE_LABELS[key]?.color || '#64748B',
    count,
  })).sort((a, b) => b.count - a.count);

  // Funnel data
  const funnelData = STATUS_ORDER.map(s => ({
    name: STATUS_LABELS[s].label,
    value: stats?.counts?.[s] || 0,
    fill: STATUS_LABELS[s].color,
  }));

  // Weekly new leads (last 7 days)
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const count = leads.filter(l => l.createdAt?.slice(0, 10) === dateStr).length;
    return {
      day: ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha'][d.getDay()],
      count,
    };
  });

  if (isLoading) {
    return (
      <div className="dashboard-shell max-w-6xl space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="panel-card h-24"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-7 w-16" /></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell max-w-6xl">
      <header className="dashboard-header">
        <div>
          <span className="dashboard-badge"><Target size={12} /> CRM</span>
          <h1>CRM Dashboard</h1>
          <p>Lidlar va konversiya ko'rsatkichlari</p>
        </div>
        <Link to="/leads" className="btn-primary">
          Lidlar ro'yxati <ArrowRight size={15} />
        </Link>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users}      label="Jami lidlar"  value={stats?.total || 0}
          iconColor="var(--primary)"   iconBg="rgba(240,100,19,0.1)" />
        <StatCard icon={TrendingUp} label="Faol lidlar"  value={stats?.active || 0}
          iconColor="var(--secondary)" iconBg="rgba(37,99,235,0.1)" />
        <StatCard icon={UserPlus}   label="Bu hafta"     value={stats?.thisWeek || 0}
          iconColor="var(--success)"   iconBg="rgba(22,163,74,0.1)" />
        <StatCard icon={Target}     label="Konversiya"   value={`${stats?.conversionRate || 0}%`}
          iconColor="var(--accent)"    iconBg="rgba(124,58,237,0.1)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Weekly chart */}
        <div className="panel-card lg:col-span-2">
          <div className="mb-4">
            <span className="panel-kicker">Haftalik</span>
            <h2 className="panel-title">Yangi lidlar (so'nggi 7 kun)</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekData} barSize={32}>
              <XAxis dataKey="day" tick={{ fill: labelColor, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: labelColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: axisColor + '50' }} />
              <Bar dataKey="count" name="Yangi lid" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source breakdown */}
        <div className="panel-card">
          <div className="mb-4">
            <span className="panel-kicker">Manba bo'yicha</span>
            <h2 className="panel-title">Qayerdan kelishgan</h2>
          </div>
          {sourceData.length === 0 ? (
            <EmptyState icon={Phone} title="Ma'lumot yo'q" />
          ) : (
            <div className="space-y-2.5">
              {sourceData.map(({ name, icon, color, count }) => {
                const total = leads.length || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span style={{ color: 'var(--text-secondary)' }}>{icon} {name}</span>
                      <span className="font-semibold" style={{ color }}>{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status Funnel */}
      <div className="panel-card">
        <div className="mb-5">
          <span className="panel-kicker">Konversiya voronkasi</span>
          <h2 className="panel-title">Lidlardan o'quvchigacha</h2>
          <p className="panel-subtitle">Har bir bosqichda qancha lid qolmoqda</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATUS_ORDER.map((s, i) => {
            const count = stats?.counts?.[s] || 0;
            const prevCount = i === 0 ? (stats?.total || 1) : (stats?.counts?.[STATUS_ORDER[i - 1]] || 1);
            const dropPct = i > 0 && prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : null;
            const cfg = STATUS_LABELS[s];
            return (
              <motion.div
                key={s}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="relative p-4 rounded-2xl text-center"
                style={{ background: cfg.color + '12', border: `1px solid ${cfg.color}30` }}
              >
                <div className="text-3xl font-bold mb-1" style={{ color: cfg.color }}>{count}</div>
                <div className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</div>
                {dropPct !== null && (
                  <div className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    {dropPct > 0 ? `↓ ${dropPct}% tushdi` : 'Hammasi o\'tdi'}
                  </div>
                )}
                {/* Arrow connector */}
                {i < STATUS_ORDER.length - 1 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full z-10 px-0.5"
                    style={{ color: 'var(--text-muted)' }}>
                    <ArrowRight size={14} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Other statuses */}
        <div className="flex flex-wrap gap-3 mt-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          {['frozen', 'archived', 'lost'].map(s => {
            const cfg = STATUS_LABELS[s];
            const count = stats?.counts?.[s] || 0;
            return (
              <div key={s} className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{cfg.label}:</span>
                <span className="font-semibold" style={{ color: cfg.color }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
