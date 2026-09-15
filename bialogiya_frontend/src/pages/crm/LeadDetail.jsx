import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, User, Tag, MapPin, Calendar, Clock, Snowflake,
  Archive, UserPlus, MessageSquare, ChevronDown, RefreshCw,
  Edit3, Check, X, Trash2, Plus, UserCheck, TrendingUp,
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import TimelineItem from '../../components/ui/TimelineItem';
import { RowSkeleton } from '../../components/ui/Skeleton';

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
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'telegram',  label: 'Telegram',  icon: '✈️' },
  { value: 'referral',  label: 'Tanish orqali', icon: '👥' },
  { value: 'walkin',    label: "O'zi keldi",    icon: '🚶' },
  { value: 'landing',   label: 'Sayt',          icon: '🌐' },
  { value: 'other',     label: 'Boshqa',        icon: '📌' },
];

const ACTIVITY_TYPES = [
  { value: 'call',    label: "Qo'ng'iroq", icon: '📞' },
  { value: 'note',    label: 'Izoh',       icon: '📝' },
  { value: 'meeting', label: 'Uchrashuv',  icon: '🤝' },
  { value: 'sms',     label: 'SMS',        icon: '💬' },
];

/**
 * LeadDetail - Drawer form bilan lid batafsil sahifasi
 * Props: leadId, open, onClose, onConvert
 */
export default function LeadDetail({ leadId, open, onClose, onConverted }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState('info'); // info | activities
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [activityForm, setActivityForm] = useState({ type: 'call', content: '', scheduledAt: '' });
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertForm, setConvertForm] = useState({ groupId: '', startDate: '' });
  const [showStatus, setShowStatus] = useState(false);

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead-detail', leadId],
    queryFn: () => api.get(`/leads/${leadId}`).then(r => r.data?.data),
    enabled: !!leadId && open,
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: () => api.get(`/leads/${leadId}/activities`).then(r => r.data?.data || []),
    enabled: !!leadId && open && tab === 'activities',
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups-list'],
    queryFn: () => api.get('/groups').then(r => r.data?.data || []).catch(() => []),
    enabled: convertOpen,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['lead-detail', leadId] });
    qc.invalidateQueries({ queryKey: ['leads'] });
    qc.invalidateQueries({ queryKey: ['lead-stats'] });
  };

  const updateMutation = useMutation({
    mutationFn: (d) => api.put(`/leads/${leadId}`, d),
    onSuccess: () => { invalidate(); toast.success('Yangilandi'); setEditing(false); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const activityMutation = useMutation({
    mutationFn: (d) => api.post(`/leads/${leadId}/activities`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead-activities', leadId] });
      toast.success('Faoliyat qo\'shildi');
      setActivityForm({ type: 'call', content: '', scheduledAt: '' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const convertMutation = useMutation({
    mutationFn: (d) => api.post(`/leads/${leadId}/convert`, d),
    onSuccess: (res) => {
      invalidate();
      toast.success("Talabaga aylantirildi!");
      setConvertOpen(false);
      onConverted?.(res.data?.data);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const startEditing = () => {
    setEditForm({
      name: lead?.name || '',
      phone: lead?.phone || '',
      source: lead?.source || 'other',
      interestedIn: lead?.interestedIn || '',
      note: lead?.note || '',
    });
    setEditing(true);
  };

  const currentStatus = STATUSES.find(s => s.value === lead?.status);
  const currentSource = SOURCES.find(s => s.value === lead?.source);

  const TABS = [
    { key: 'info',       label: "Ma'lumotlar" },
    { key: 'activities', label: 'Faoliyat tarixi', badge: activities.length },
  ];

  return (
    <>
      <Drawer
        open={open && !!leadId}
        onClose={onClose}
        title={isLoading ? 'Yuklanmoqda...' : (lead?.name || 'Lid')}
        subtitle={isLoading ? '' : (currentSource?.icon + ' ' + currentSource?.label)}
        width="520px"
        footer={
          lead?.status !== 'enrolled' ? (
            <button
              onClick={() => setConvertOpen(true)}
              className="btn-primary w-full justify-center"
            >
              <UserPlus size={15} />
              Talabaga aylantirish
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
              <UserCheck size={16} />
              Bu lid o'quvchiga aylangan
            </div>
          )
        }
      >
        {isLoading ? (
          <div className="space-y-3"><RowSkeleton count={5} /></div>
        ) : !lead ? (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Lid topilmadi</div>
        ) : (
          <div className="space-y-5">
            {/* Status bar */}
            <div className="relative">
              <button
                onClick={() => setShowStatus(s => !s)}
                className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 transition-all"
                style={{
                  borderColor: currentStatus?.color || 'var(--border)',
                  background: currentStatus?.color + '10',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: currentStatus?.color }} />
                  <span className="font-semibold text-sm" style={{ color: currentStatus?.color }}>
                    {currentStatus?.label}
                  </span>
                </div>
                <ChevronDown size={16} style={{ color: currentStatus?.color }} />
              </button>
              <AnimatePresence>
                {showStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    className="absolute top-full left-0 right-0 z-10 mt-1 rounded-xl overflow-hidden shadow-lg"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                  >
                    {STATUSES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => {
                          updateMutation.mutate({ status: s.value });
                          setShowStatus(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--secondary-background)] transition-colors text-left"
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{s.label}</span>
                        {s.value === lead.status && <Check size={14} className="ml-auto" style={{ color: s.color }} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tabs */}
            <div className="flex gap-0.5 p-1 rounded-xl" style={{ background: 'var(--secondary-background)' }}>
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all"
                  style={tab === t.key
                    ? { background: 'var(--card)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-xs)' }
                    : { color: 'var(--text-muted)' }
                  }
                >
                  {t.label}
                  {t.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={tab === t.key
                        ? { background: 'var(--primary)', color: 'white' }
                        : { background: 'var(--border)', color: 'var(--text-muted)' }
                      }>
                      {t.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── INFO TAB ── */}
            {tab === 'info' && (
              <div className="space-y-4">
                {editing ? (
                  /* Edit Form */
                  <div className="space-y-3">
                    <div>
                      <label className="form-label">Ism *</label>
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className="input-field" />
                    </div>
                    <div>
                      <label className="form-label">Telefon *</label>
                      <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                        className="input-field" />
                    </div>
                    <div>
                      <label className="form-label">Manba</label>
                      <select value={editForm.source} onChange={e => setEditForm(f => ({ ...f, source: e.target.value }))}
                        className="input-field">
                        {SOURCES.map(s => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Qiziqtiradigan soha</label>
                      <input value={editForm.interestedIn} onChange={e => setEditForm(f => ({ ...f, interestedIn: e.target.value }))}
                        className="input-field" placeholder="Ingliz tili, Matematika..." />
                    </div>
                    <div>
                      <label className="form-label">Izoh</label>
                      <textarea value={editForm.note} onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))}
                        className="input-field resize-none" rows={3} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(false)} className="btn-ghost flex-1">Bekor qilish</button>
                      <button
                        onClick={() => updateMutation.mutate(editForm)}
                        disabled={updateMutation.isPending}
                        className="btn-primary flex-1"
                      >
                        {updateMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                        Saqlash
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div className="flex justify-end">
                      <button onClick={startEditing} className="btn-ghost text-xs">
                        <Edit3 size={13} /> Tahrirlash
                      </button>
                    </div>

                    <div className="space-y-0 divide-y" style={{ borderColor: 'var(--border)' }}>
                      {[
                        { icon: User,   label: 'Ism',      value: lead.name },
                        { icon: Phone,  label: 'Telefon',  value: <a href={`tel:${lead.phone}`} className="hover:underline" style={{ color: 'var(--primary)' }}>{lead.phone}</a> },
                        { icon: Tag,    label: 'Manba',    value: (currentSource?.icon + ' ' + currentSource?.label) },
                        { icon: TrendingUp, label: 'Qiziqish', value: lead.interestedIn || '—' },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-start gap-3 py-3">
                          <Icon size={15} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
                            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {lead.note && (
                      <div className="p-3 rounded-xl" style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
                        <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Izoh</div>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{lead.note}</div>
                      </div>
                    )}

                    {lead.frozenUntil && (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                        style={{ background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}>
                        <Snowflake size={14} />
                        {new Date(lead.frozenUntil).toLocaleDateString('uz-UZ')} gacha muzlatilgan
                      </div>
                    )}

                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Calendar size={11} className="inline mr-1" />
                      Qo'shilgan: {new Date(lead.createdAt).toLocaleDateString('uz-UZ')}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── ACTIVITIES TAB ── */}
            {tab === 'activities' && (
              <div className="space-y-4">
                {/* Add activity form */}
                <div className="p-4 rounded-xl space-y-3"
                  style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <Plus size={14} className="inline mr-1" />
                    Yangi faoliyat
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {ACTIVITY_TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setActivityForm(f => ({ ...f, type: t.value }))}
                        className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                          activityForm.type === t.value
                            ? 'border-transparent text-white'
                            : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/40'
                        }`}
                        style={activityForm.type === t.value ? { background: 'var(--primary)' } : {}}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={activityForm.content}
                    onChange={e => setActivityForm(f => ({ ...f, content: e.target.value }))}
                    className="input-field resize-none"
                    rows={2}
                    placeholder="Nima gaplashildi yoki nima eslatma..."
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="form-label text-xs">Keyingi aloqa sanasi</label>
                      <input type="date" value={activityForm.scheduledAt}
                        onChange={e => setActivityForm(f => ({ ...f, scheduledAt: e.target.value }))}
                        className="input-field" />
                    </div>
                    <button
                      onClick={() => activityMutation.mutate(activityForm)}
                      disabled={activityMutation.isPending || !activityForm.content.trim()}
                      className="btn-primary self-end"
                    >
                      {activityMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                      Qo'shish
                    </button>
                  </div>
                </div>

                {/* Activities list */}
                {activitiesLoading ? (
                  <div className="space-y-2"><RowSkeleton count={3} /></div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                    Hali faoliyat yozilmagan
                  </div>
                ) : (
                  <div>
                    {activities.map((act, idx) => (
                      <TimelineItem
                        key={act.id}
                        activity={act}
                        isLast={idx === activities.length - 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ── Convert to Student Modal ── */}
      <Modal
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        title="Talabaga aylantirish"
        subtitle={`${lead?.name} ni talaba sifatida ro'yxatdan o'tkazish`}
        size="sm"
        footer={
          <>
            <button onClick={() => setConvertOpen(false)} className="btn-ghost">Bekor</button>
            <button
              onClick={() => convertMutation.mutate(convertForm)}
              disabled={convertMutation.isPending || !convertForm.groupId}
              className="btn-primary"
            >
              {convertMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Aylantirish
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3.5 rounded-xl"
            style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-100)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ background: 'var(--primary)', color: 'white' }}>
              {lead?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{lead?.name}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{lead?.phone}</div>
            </div>
          </div>

          <div>
            <label className="form-label">Guruhni tanlang *</label>
            <select value={convertForm.groupId}
              onChange={e => setConvertForm(f => ({ ...f, groupId: e.target.value }))}
              className="input-field">
              <option value="">— Guruh tanlang —</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} {g.teacher?.name ? `(${g.teacher.name})` : ''} {g.monthlyFee ? `— ${g.monthlyFee.toLocaleString()} so'm` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Boshlash sanasi</label>
            <input type="date" value={convertForm.startDate}
              onChange={e => setConvertForm(f => ({ ...f, startDate: e.target.value }))}
              className="input-field" />
          </div>

          <div className="p-3 rounded-xl text-xs"
            style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            ✅ Talaba avtomatik login va parol oladi<br />
            ✅ Lid statusi "O'qishga kirdi" ga o'tadi<br />
            ✅ Talaba tanlangan guruhga qo'shiladi
          </div>
        </div>
      </Modal>
    </>
  );
}
