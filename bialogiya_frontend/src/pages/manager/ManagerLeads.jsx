import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Phone, UserPlus, Snowflake, Archive, TrendingUp, Trash2
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { RowSkeleton } from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import SearchInput from '../../components/ui/SearchInput';
import EmptyState from '../../components/ui/EmptyState';

const STATUSES = [
  { value: 'new', label: 'Yangi' },
  { value: 'contacted', label: "Bog'lanildi" },
  { value: 'trial', label: 'Sinov darsi' },
  { value: 'enrolled', label: "O'qishga kirdi" },
  { value: 'frozen', label: 'Muzlatilgan' },
  { value: 'archived', label: 'Arxiv' },
  { value: 'lost', label: 'Chiqib ketdi' },
];

const SOURCES = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'referral', label: 'Tanish orqali' },
  { value: 'walkin', label: "O'zi keldi" },
  { value: 'landing', label: 'Sayt' },
  { value: 'other', label: 'Boshqa' },
];

const sourceLabel = (value) => SOURCES.find(s => s.value === value)?.label || value;

const TABS = [
  { key: 'all', label: 'Hammasi' },
  { key: 'new', label: 'Yangi' },
  { key: 'contacted', label: "Bog'lanildi" },
  { key: 'trial', label: 'Sinov' },
  { key: 'enrolled', label: 'Kirdi' },
  { key: 'frozen', label: 'Muzlatilgan' },
  { key: 'archived', label: 'Arxiv' },
  { key: 'lost', label: 'Chiqib ketgan' },
];

const emptyForm = () => ({ name: '', phone: '', source: 'instagram', interestedIn: '', note: '' });

export default function ManagerLeads() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const branchId = searchParams.get('branchId') || undefined;
  const branchName = searchParams.get('branchName') || '';
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const statsQuery = useQuery({
    queryKey: ['lead-stats', branchId],
    queryFn: () => api.get('/leads/stats', { params: { branchId } }).then(r => r.data.data),
  });

  const leadsQuery = useQuery({
    queryKey: ['leads', tab, search, branchId],
    queryFn: () => api.get('/leads', { params: { status: tab, search: search.trim() || undefined, branchId } })
      .then(r => r.data.data),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['leads'] });
    qc.invalidateQueries({ queryKey: ['lead-stats'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/leads', { ...payload, branchId }),
    onSuccess: () => {
      invalidate();
      toast.success("Lid muvaffaqiyatli qo'shildi");
      setModalOpen(false);
      setForm(emptyForm());
    },
    onError: (e) => toast.error(e.response?.data?.message || "Qo'shib bo'lmadi"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/leads/${id}`, { status }),
    onSuccess: () => { invalidate(); toast.success('Status yangilandi'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/leads/${id}`),
    onSuccess: () => { invalidate(); toast.success("Lid o'chirildi"); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Ismni kiriting');
    if (!form.phone.trim()) return toast.error('Telefon raqamni kiriting');
    createMutation.mutate({ ...form, name: form.name.trim(), phone: form.phone.trim() });
  };

  const stats = statsQuery.data;
  const leads = leadsQuery.data || [];

  return (
    <div className="dashboard-shell">
      <PageHeader
        title="Lidlar CRM"
        subtitle={branchName ? `${branchName} filiali lidlari` : "Yangi mijozlar, murojaatlar va konversiya nazorati"}
        actions={
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> Lid qo'shish
          </button>
        }
      />

      {/* KPI Cards */}
      <section className="stats-grid">
        <StatCard
          icon={TrendingUp}
          label="Bu hafta keldi"
          value={stats?.thisWeek ?? 0}
          iconColor="var(--primary)"
          iconBg="rgba(240, 100, 19, 0.1)"
          trend="up"
        />
        <StatCard
          icon={UserPlus}
          label="Faol lidlar"
          value={stats?.active ?? 0}
          iconColor="var(--secondary)"
          iconBg="rgba(37, 99, 235, 0.1)"
        />
        <StatCard
          icon={Snowflake}
          label="Muzlatilgan"
          value={stats?.counts?.frozen ?? 0}
          iconColor="var(--accent)"
          iconBg="rgba(124, 58, 237, 0.1)"
        />
        <StatCard
          icon={Archive}
          label="Arxiv / Chiqib ketgan"
          value={(stats?.counts?.archived || 0) + (stats?.counts?.lost || 0)}
          iconColor="var(--text-muted)"
          iconBg="var(--secondary-background)"
          trendValue={stats?.conversionRate > 0 ? `${stats.conversionRate}% konversiya` : null}
        />
      </section>

      {/* Filter and Search */}
      <div className="space-y-3">
        <div className="filter-bar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Ism yoki telefon bo'yicha qidirish..."
          />
        </div>

        {/* Tab List */}
        <div className="tab-bar">
          {TABS.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`tab-item ${tab === t.key ? 'active' : ''}`}
            >
              {t.label}
              {stats && t.key !== 'all' && stats.counts[t.key] > 0 && (
                <span className="ml-1.5 opacity-70">({stats.counts[t.key]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {leadsQuery.isError && <ErrorState error={leadsQuery.error} onRetry={leadsQuery.refetch} />}
      {leadsQuery.isLoading && <div className="space-y-2"><RowSkeleton count={4} /></div>}

      {!leadsQuery.isLoading && !leadsQuery.isError && leads.length === 0 && (
        <EmptyState
          icon={UserPlus}
          title={search ? 'Lid topilmadi' : 'Bu bo\'limda lidlar mavjud emas'}
          description={search
            ? 'Boshqa ism yoki raqam bilan qidirib ko\'ring.'
            : 'Yangi mijozlar qo\'ng\'iroq qilganda shu yerga qo\'shib boring.'}
          action={!search && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-primary btn-sm"
            >
              <Plus size={14} /> Birinchi lidni qo'shish
            </button>
          )}
        />
      )}

      {/* Leads list */}
      <div className="space-y-3">
        {leads.map((lead, i) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.2 }}
            className="panel-card"
          >
            <div className="flex flex-wrap items-start gap-3">
              <div className="avatar avatar-md flex-shrink-0">
                {lead.name?.charAt(0)?.toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {lead.name}
                  </span>
                  <StatusBadge status={lead.status} />
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center gap-1 font-medium hover:underline"
                    style={{ color: 'var(--primary)' }}
                  >
                    <Phone size={11} /> {lead.phone}
                  </a>
                  <span className="badge badge-gray text-[10px]">{sourceLabel(lead.source)}</span>
                  {lead.interestedIn && <span>• {lead.interestedIn}</span>}
                  <span style={{ color: 'var(--text-muted)' }}>• {new Date(lead.createdAt).toLocaleDateString('uz-UZ')}</span>
                </div>

                {lead.note && (
                  <p className="mt-2 p-2 rounded-lg text-xs" style={{ backgroundColor: 'var(--secondary-background)', color: 'var(--text-secondary)' }}>
                    {lead.note}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => deleteMutation.mutate(lead.id)}
                disabled={deleteMutation.isPending}
                className="btn-icon"
                title="O'chirish"
              >
                <Trash2 size={14} style={{ color: 'var(--error)' }} />
              </button>
            </div>

            {/* Change Status Fast Buttons */}
            <div className="mt-3 flex flex-wrap gap-1.5 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              {STATUSES.filter(s => s.value !== lead.status).map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => statusMutation.mutate({ id: lead.id, status: s.value })}
                  disabled={statusMutation.isPending}
                  className="btn-ghost btn-sm text-xs py-1 px-2.5"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={e => e.target === e.currentTarget && setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 8, opacity: 0 }}
              className="modal-panel"
            >
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">Yangi lid qo'shish</h2>
                  <p className="modal-subtitle">Mijoz ma'lumotlarini to'ldiring</p>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-icon flex-shrink-0">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="form-label">Ism *</label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ali Valiyev"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">Telefon *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+998 90 123 45 67"
                    className="input-field font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Kelish manbai</label>
                    <select
                      value={form.source}
                      onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                      className="input-field"
                    >
                      {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Qiziqqan yo'nalish</label>
                    <input
                      value={form.interestedIn}
                      onChange={e => setForm(f => ({ ...f, interestedIn: e.target.value }))}
                      placeholder="Masalan: IELTS, Matematika"
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Izoh / Eslatma</label>
                  <textarea
                    rows={2}
                    value={form.note}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="Kechki guruh qiziqtirmoqda..."
                    className="input-field resize-none"
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">Bekor qilish</button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="btn-primary"
                  >
                    {createMutation.isPending ? 'Saqlanmoqda...' : 'Qo\'shish'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
