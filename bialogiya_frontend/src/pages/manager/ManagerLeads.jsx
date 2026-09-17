import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, LayoutGrid, List, TrendingUp, UserPlus,
  Users, ArrowRight, RefreshCw, Check, Filter,
  Camera, Send, UserCheck, Globe, Pin, Target,
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
import Modal from '../../components/ui/Modal';
import KanbanColumn from '../../components/ui/KanbanColumn';
import LeadDetail from '../crm/LeadDetail';
import PhoneInput from '../../components/ui/PhoneInput';
import { cleanPhone } from '../../utils/formatPhone';

const STATUSES = [
  { value: 'new',       label: 'Yangi',          color: '#3B82F6' },
  { value: 'contacted', label: "Bog'lanildi",    color: '#8B5CF6' },
  { value: 'trial',     label: 'Sinov darsi',    color: '#F59E0B' },
  { value: 'enrolled',  label: "O'qishga kirdi", color: '#10B981' },
  { value: 'frozen',    label: 'Muzlatilgan',    color: '#64748B' },
  { value: 'archived',  label: 'Arxiv',          color: '#94A3B8' },
  { value: 'lost',      label: 'Chiqib ketdi',   color: '#EF4444' },
];

const SOURCES = [
  { value: 'instagram', label: 'Instagram',     icon: Camera },
  { value: 'telegram',  label: 'Telegram',      icon: Send },
  { value: 'referral',  label: 'Tanish orqali', icon: Users },
  { value: 'walkin',    label: "O'zi keldi",    icon: UserCheck },
  { value: 'landing',   label: 'Sayt',          icon: Globe },
  { value: 'other',     label: 'Boshqa',        icon: Pin },
];

const emptyForm = () => ({
  name: '', phone: '+998 ', source: 'instagram', interestedIn: '', note: '',
  parentName: '', parentPhone: '+998 ',
});

const LIST_TABS = [
  { key: 'all',       label: 'Hammasi' },
  { key: 'new',       label: 'Yangi' },
  { key: 'contacted', label: "Bog'lanildi" },
  { key: 'trial',     label: 'Sinov' },
  { key: 'enrolled',  label: 'Kirdi' },
  { key: 'frozen',    label: 'Muzlatilgan' },
  { key: 'archived',  label: 'Arxiv' },
  { key: 'lost',      label: 'Chiqib ketgan' },
];

export default function ManagerLeads() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const branchId = searchParams.get('branchId') || undefined;

  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  /* ── Queries ── */
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

  /* ── Mutations ── */
  const createMutation = useMutation({
    mutationFn: (d) => api.post('/leads', { ...d, phone: cleanPhone(d.phone), parentPhone: cleanPhone(d.parentPhone), branchId }),
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

  /* ── Grouped data for kanban ── */
  const leads = Array.isArray(leadsQuery.data) ? leadsQuery.data : [];
  const stats = statsQuery.data;

  const kanbanGroups = STATUSES.reduce((acc, s) => {
    acc[s.value] = leads.filter(l => l.status === s.value);
    return acc;
  }, {});

  /* ── Filtered leads for list view ── */
  const filteredLeads = tab === 'all' ? leads : leads.filter(l => l.status === tab);

  const sourceLabel = (v) => SOURCES.find(s => s.value === v)?.label || v;
  const sourceIcon  = (v) => SOURCES.find(s => s.value === v)?.icon || Pin;
  const statusCfg   = (v) => STATUSES.find(s => s.value === v) || { label: v, color: '#64748B' };

  return (
    <div className="dashboard-shell max-w-full">
      <PageHeader
        title="Lidlar (CRM)"
        subtitle="Potentsial o'quvchilarni boshqarish"
        actions={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setViewMode('kanban')}
                className="px-3 py-2 flex items-center gap-1.5 text-sm transition-colors"
                style={{
                  background: viewMode === 'kanban' ? 'var(--primary)' : 'var(--card)',
                  color: viewMode === 'kanban' ? 'white' : 'var(--text-secondary)',
                }}
              >
                <LayoutGrid size={15} /> Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="px-3 py-2 flex items-center gap-1.5 text-sm transition-colors"
                style={{
                  background: viewMode === 'list' ? 'var(--primary)' : 'var(--card)',
                  color: viewMode === 'list' ? 'white' : 'var(--text-secondary)',
                }}
              >
                <List size={15} /> Ro'yxat
              </button>
            </div>
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              <Plus size={15} /> Yangi lid
            </button>
          </div>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Users} label="Jami lidlar" value={stats.total}
            iconColor="var(--primary)" iconBg="rgba(240,100,19,0.1)" />
          <StatCard icon={TrendingUp} label="Faol lidlar" value={stats.active}
            iconColor="var(--secondary)" iconBg="rgba(37,99,235,0.1)" />
          <StatCard icon={UserPlus} label="Bu hafta" value={stats.thisWeek}
            iconColor="var(--success)" iconBg="rgba(22,163,74,0.1)" />
          <StatCard icon={ArrowRight} label="Konversiya" value={`${stats.conversionRate}%`}
            iconColor="var(--accent)" iconBg="rgba(124,58,237,0.1)" />
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Ism yoki telefon bo'yicha qidirish..." />
      </div>

      {leadsQuery.isError && (
        <ErrorState error={leadsQuery.error} onRetry={() => qc.invalidateQueries({ queryKey: ['leads'] })} />
      )}

      {/* ═══════ KANBAN VIEW ═══════ */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          {leadsQuery.isLoading ? (
            <div className="flex gap-4">
              {STATUSES.map(s => (
                <div key={s.value} className="flex-shrink-0 w-64 h-64 rounded-2xl"
                  style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }} />
              ))}
            </div>
          ) : (
            <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
              {STATUSES.map(s => (
                <KanbanColumn
                  key={s.value}
                  status={s.value}
                  leads={kanbanGroups[s.value] || []}
                  count={stats?.counts?.[s.value] ?? (kanbanGroups[s.value]?.length || 0)}
                  onCardClick={(lead) => setSelectedLeadId(lead.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════ LIST VIEW ═══════ */}
      {viewMode === 'list' && (
        <div>
          {/* Status tabs */}
          <div className="flex gap-1 flex-wrap mb-4">
            {LIST_TABS.map(t => {
              const count = t.key === 'all' ? leads.length : (stats?.counts?.[t.key] ?? 0);
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={tab === t.key
                    ? { background: 'var(--primary)', color: 'white' }
                    : { background: 'var(--secondary-background)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                  }
                >
                  {t.label}
                  {count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={tab === t.key
                        ? { background: 'rgba(255,255,255,0.25)', color: 'white' }
                        : { background: 'var(--border)', color: 'var(--text-muted)' }
                      }>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {leadsQuery.isLoading ? (
            <div className="space-y-2"><RowSkeleton count={6} /></div>
          ) : filteredLeads.length === 0 ? (
            <EmptyState icon={Users} title="Lid topilmadi" subtitle="Yangi lid qo'shing yoki filterlarni o'zgartiring" />
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {filteredLeads.map(lead => {
                  const sc = statusCfg(lead.status);
                  return (
                    <motion.div
                      key={lead.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="panel-card flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedLeadId(lead.id)}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                        style={{ background: sc.color + '15', color: sc.color }}>
                        {lead.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{lead.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{lead.phone}</div>
                      </div>
                      {lead.interestedIn && (
                        <div className="hidden sm:flex items-center gap-1 text-xs truncate max-w-32" style={{ color: 'var(--text-muted)' }}>
                          <Target size={12} className="text-amber-500 flex-shrink-0" />
                          <span className="truncate">{lead.interestedIn}</span>
                        </div>
                      )}
                      <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {(() => {
                          const Icon = sourceIcon(lead.source);
                          return <Icon size={13} className="flex-shrink-0" />;
                        })()}
                        <span>{sourceLabel(lead.source)}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                        style={{ background: sc.color + '15', color: sc.color }}>
                        {sc.label}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ── Lead Detail Drawer ── */}
      <LeadDetail
        leadId={selectedLeadId}
        open={!!selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onConverted={() => {
          setSelectedLeadId(null);
          invalidate();
        }}
      />

      {/* ── Create Lead Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setForm(emptyForm()); }}
        title="Yangi lid qo'shish"
        subtitle="Potentsial o'quvchi ma'lumotlarini kiriting"
        size="md"
        footer={
          <>
            <button onClick={() => { setModalOpen(false); setForm(emptyForm()); }} className="btn-ghost">
              Bekor qilish
            </button>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.name.trim() || !form.phone.trim()}
              className="btn-primary"
            >
              {createMutation.isPending
                ? <><RefreshCw size={14} className="animate-spin" />Qo'shilmoqda...</>
                : <><Check size={14} />Qo'shish</>
              }
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Ism *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input-field" placeholder="Abdulloh Karimov" />
            </div>
            <div>
              <label className="form-label">Telefon *</label>
              <PhoneInput value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Ota-ona ismi</label>
              <input value={form.parentName} onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))}
                className="input-field" placeholder="Karim Karimov" />
            </div>
            <div>
              <label className="form-label">Ota-ona telefoni</label>
              <PhoneInput value={form.parentPhone} onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))}
                className="input-field" />
            </div>
          </div>

          <div>
            <label className="form-label">Manba</label>
            <div className="grid grid-cols-3 gap-2">
              {SOURCES.map(s => {
                const Icon = s.icon;
                return (
                  <button key={s.value} type="button"
                    onClick={() => setForm(f => ({ ...f, source: s.value }))}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      form.source === s.value ? 'border-[var(--primary)] bg-[var(--primary-50)] text-[var(--primary)]' : 'border-[var(--border)] text-[var(--text-secondary)]'
                    }`}>
                    <Icon size={14} />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="form-label">Qiziqish yo'nalishi</label>
            <input value={form.interestedIn} onChange={e => setForm(f => ({ ...f, interestedIn: e.target.value }))}
              className="input-field" placeholder="Ingliz tili, Matematika..." />
          </div>

          <div>
            <label className="form-label">Izoh</label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="input-field resize-none" rows={2}
              placeholder="Qo'shimcha ma'lumot..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}
