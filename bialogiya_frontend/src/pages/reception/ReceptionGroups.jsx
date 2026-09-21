import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Users2, ChevronRight, Clock, Calendar, DoorOpen, Building2,
  Pencil, Trash2, ChevronDown, Check, Sparkles
} from 'lucide-react';
import api from '../../config/axios';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PageHeader from '../../components/ui/PageHeader';

const DAYS = [
  { key: 'mon', label: 'Du' }, { key: 'tue', label: 'Se' }, { key: 'wed', label: 'Cho' },
  { key: 'thu', label: 'Pa' }, { key: 'fri', label: 'Ju' }, { key: 'sat', label: 'Sha' },
  { key: 'sun', label: 'Ya' },
];

const formatSchedule = (g) => {
  const parts = [];
  if (g.weekDays) {
    try {
      const days = Array.isArray(g.weekDays) ? g.weekDays : JSON.parse(g.weekDays);
      const labels = days.map(d => DAYS.find(x => x.key === d)?.label).filter(Boolean);
      if (labels.length) parts.push(labels.join(', '));
    } catch {}
  }
  if (g.startTime) parts.push(g.startTime + (g.endTime ? `–${g.endTime}` : ''));
  if (g.room) parts.push(g.room);
  return parts.join(' · ');
};

const EMPTY_FORM = { name: '', subject: 'other', teacherId: '', branchId: '', monthlyFee: '', weekDays: [], startTime: '', endTime: '', room: '', roomId: '', level: '', totalLessons: '' };

const groupToForm = (g) => ({
  name: g.name || '',
  subject: g.subject || 'other',
  teacherId: g.teacher?.id || g.teacherId || '',
  branchId: g.branch?.id || g.branchId || '',
  monthlyFee: g.monthlyFee ? String(g.monthlyFee) : '',
  weekDays: Array.isArray(g.weekDays)
    ? g.weekDays
    : (() => { try { return JSON.parse(g.weekDays || '[]'); } catch { return []; } })(),
  startTime: g.startTime || '',
  endTime: g.endTime || '',
  room: g.room || '',
  roomId: g.roomId || g.roomRel?.id || '',
  level: g.level || '',
  totalLessons: g.totalLessons ? String(g.totalLessons) : '',
});

const TIME_PRESETS = [
  { label: '08:30 — 10:00', start: '08:30', end: '10:00' },
  { label: '10:00 — 11:30', start: '10:00', end: '11:30' },
  { label: '14:00 — 15:30', start: '14:00', end: '15:30' },
  { label: '15:30 — 17:00', start: '15:30', end: '17:00' },
  { label: '17:00 — 18:30', start: '17:00', end: '18:30' },
  { label: '18:30 — 20:00', start: '18:30', end: '20:00' },
];

const TIME_HOURS = Array.from({ length: 15 }, (_, i) => String(i + 8).padStart(2, '0'));
const TIME_MINUTES = ['00', '15', '30', '45'];

function addMinutesToTime(timeStr, minutesToAdd) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '';
  const totalMin = h * 60 + m + minutesToAdd;
  const newH = Math.floor(totalMin / 60) % 24;
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function TimeRangePicker({ startTime = '', endTime = '', onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const [startH, startM] = (startTime || '14:00').split(':');
  const [endH, endM] = (endTime || '15:30').split(':');

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleStartChange = (h, m) => {
    const newStart = `${h || startH || '14'}:${m || startM || '00'}`;
    const newEnd = endTime || addMinutesToTime(newStart, 90);
    onChange({ startTime: newStart, endTime: newEnd });
  };

  const handleEndChange = (h, m) => {
    const newEnd = `${h || endH || '15'}:${m || endM || '30'}`;
    onChange({ startTime: startTime || '14:00', endTime: newEnd });
  };

  const applyPreset = (preset) => {
    onChange({ startTime: preset.start, endTime: preset.end });
  };

  const applyDuration = (mins) => {
    const base = startTime || '14:00';
    const newEnd = addMinutesToTime(base, mins);
    onChange({ startTime: base, endTime: newEnd });
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange({ startTime: '', endTime: '' });
  };

  const isPresetActive = (p) => startTime === p.start && endTime === p.end;

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <div
        onClick={() => setOpen(o => !o)}
        className={`input-field text-xs py-1.5 flex items-center justify-between cursor-pointer select-none transition-all ${
          open ? 'ring-2 ring-[var(--primary)] border-transparent' : 'hover:border-[var(--primary)]'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Clock size={12} className="text-[var(--primary)] flex-shrink-0" />
          {startTime ? (
            <span className="font-semibold text-xs text-[var(--text-primary)] truncate">
              {startTime} <span className="text-gray-400 font-normal">—</span> {endTime || '--:--'}
            </span>
          ) : (
            <span className="text-gray-400 text-xs truncate">Vaqtni tanlang (masalan: 14:00 — 15:30)</span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {startTime && (
            <button
              type="button"
              onClick={clear}
              className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              title="Tozalash"
            >
              <X size={11} />
            </button>
          )}
          <ChevronDown
            size={12}
            className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Popover */}
      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 w-[280px] sm:w-[320px] rounded-2xl p-3 shadow-2xl border border-[var(--border)] bg-white dark:bg-gray-900 animate-in fade-in zoom-in-95 duration-150"
          style={{ boxShadow: '0 12px 36px -6px rgba(0, 0, 0, 0.45)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-1 text-xs font-bold text-[var(--text-primary)]">
              <Sparkles size={12} className="text-[var(--primary)]" />
              <span>Dars vaqtini tanlang</span>
            </div>
            {startTime && endTime && (
              <span className="text-[11px] font-semibold text-[var(--primary)] px-1.5 py-0.5 rounded bg-[var(--primary)]/10">
                {startTime} — {endTime}
              </span>
            )}
          </div>

          {/* 1. Quick Presets */}
          <div className="mb-2.5">
            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Mashhur vaqtlar:
            </div>
            <div className="grid grid-cols-2 gap-1">
              {TIME_PRESETS.map((p) => {
                const active = isPresetActive(p);
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`py-1 px-1.5 rounded-lg text-xs font-medium text-center transition-all flex items-center justify-between ${
                      active
                        ? 'gradient-bg text-white shadow-sm font-semibold'
                        : 'bg-gray-50 dark:bg-gray-800 text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-700 border border-[var(--border)]'
                    }`}
                  >
                    <span>{p.label}</span>
                    {active && <Check size={11} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Custom Time Selector */}
          <div className="mb-2.5 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-[var(--border)]">
            <div className="grid grid-cols-2 gap-2">
              {/* Start Time */}
              <div>
                <div className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1">Boshlanish:</div>
                <div className="flex items-center gap-1">
                  <select
                    value={startH || '14'}
                    onChange={(e) => handleStartChange(e.target.value, startM || '00')}
                    className="input-field text-xs py-1 px-1 text-center font-semibold flex-1 bg-white dark:bg-gray-900"
                  >
                    {TIME_HOURS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-gray-400 font-bold">:</span>
                  <select
                    value={startM || '00'}
                    onChange={(e) => handleStartChange(startH || '14', e.target.value)}
                    className="input-field text-xs py-1 px-1 text-center font-semibold flex-1 bg-white dark:bg-gray-900"
                  >
                    {TIME_MINUTES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* End Time */}
              <div>
                <div className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1">Tugash:</div>
                <div className="flex items-center gap-1">
                  <select
                    value={endH || '15'}
                    onChange={(e) => handleEndChange(e.target.value, endM || '30')}
                    className="input-field text-xs py-1 px-1 text-center font-semibold flex-1 bg-white dark:bg-gray-900"
                  >
                    {TIME_HOURS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-gray-400 font-bold">:</span>
                  <select
                    value={endM || '30'}
                    onChange={(e) => handleEndChange(endH || '15', e.target.value)}
                    className="input-field text-xs py-1 px-1 text-center font-semibold flex-1 bg-white dark:bg-gray-900"
                  >
                    {TIME_MINUTES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Duration Adders */}
            <div className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)]">Davomiyligi:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyDuration(60)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 hover:bg-[var(--primary)] hover:text-white border border-[var(--border)] transition-colors font-medium"
                >
                  1 soat
                </button>
                <button
                  type="button"
                  onClick={() => applyDuration(90)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 hover:bg-[var(--primary)] hover:text-white border border-[var(--border)] transition-colors font-medium text-[var(--primary)]"
                >
                  1.5 soat
                </button>
                <button
                  type="button"
                  onClick={() => applyDuration(120)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 hover:bg-[var(--primary)] hover:text-white border border-[var(--border)] transition-colors font-medium"
                >
                  2 soat
                </button>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-primary py-1 px-3 text-xs rounded-lg font-medium flex items-center gap-1"
            >
              <Check size={11} /> Tayyor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReceptionGroups() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null); // null = create mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [customRoomMode, setCustomRoomMode] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const { data: groups = [] } = useQuery({ 
    queryKey: ['reception-groups'], 
    queryFn: () => api.get('/reception/groups').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }) 
  });
  const { data: teachers = [] } = useQuery({ 
    queryKey: ['reception-teachers'], 
    queryFn: () => api.get('/admin/teachers').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }) 
  });
  const { data: branches = [] } = useQuery({ 
    queryKey: ['reception-branches'], 
    queryFn: () => api.get('/reception/branches').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }) 
  });
  const { data: rooms = [] } = useQuery({ 
    queryKey: ['reception-rooms', form.branchId], 
    queryFn: () => api.get('/rooms', { params: { branchId: form.branchId || undefined } }).then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }).catch(() => [])
  });

  const closeModal = () => { setShowModal(false); setEditingGroup(null); setForm(EMPTY_FORM); setCustomRoomMode(false); };

  const toPayload = (d) => ({
    ...d,
    monthlyFee: d.monthlyFee ? Number(d.monthlyFee) : null,
    totalLessons: d.totalLessons ? Number(d.totalLessons) : null,
    level: d.level?.trim() || null,
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/groups', toPayload(d)),
    onSuccess: () => { qc.invalidateQueries(['reception-groups']); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/groups/${id}`, toPayload(data)),
    onSuccess: () => { qc.invalidateQueries(['reception-groups']); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/groups/${id}`),
    onSuccess: () => qc.invalidateQueries(['reception-groups']),
  });

  const openCreate = () => { setEditingGroup(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (e, g) => { e.stopPropagation(); setEditingGroup(g); setForm(groupToForm(g)); setShowModal(true); };
  const handleDelete = (e, g) => {
    e.stopPropagation();
    setConfirm({
      title: `"${g.name}"ni o'chirish`,
      message: "Guruh yashiriladi, o'quvchilari boshqa guruhga o'tkazilmaguncha guruhsiz qoladi.",
      warning: g._count?.students > 0 ? `Bu guruhda ${g._count.students} ta o'quvchi bor.` : undefined,
      onConfirm: () => deleteMutation.mutate(g.id),
    });
  };

  const toggleDay = (day) => setForm(f => ({
    ...f, weekDays: f.weekDays.includes(day) ? f.weekDays.filter(d => d !== day) : [...f.weekDays, day],
  }));

  const submit = () => {
    if (editingGroup) updateMutation.mutate({ id: editingGroup.id, data: form });
    else createMutation.mutate(form);
  };

  const saving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;
  const canSubmit = form.name && form.teacherId && !saving;

  return (
    <div className="dashboard-shell max-w-5xl mx-auto">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />

      <PageHeader
        title="Guruhlar"
        subtitle="Guruh yarating, jadval va xona belgilang."
        actions={
          <>
            <span className="header-status">Live</span>
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus size={14} /> Guruh yaratish
            </button>
          </>
        }
      />

      <div className="space-y-3">
        {groups?.map((g, i) => (
          <motion.div key={g.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            onClick={() => navigate(`/reception/groups/${g.id}`)}
            className="panel-card flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <Users2 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-800 dark:text-white">{g.name}</div>
              <div className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap">
                <span>{g.teacher?.name || "O'qituvchi biriktirilmagan"}</span>
                <span>·</span>
                <span>{g._count?.students || 0} o'quvchi</span>
                {g.branch && <><span>·</span><span className="flex items-center gap-0.5"><Building2 size={10} />{g.branch.name}</span></>}
              </div>
              {formatSchedule(g) && (
                <div className="text-xs text-primary/80 mt-0.5 flex items-center gap-1">
                  <Calendar size={10} />
                  {formatSchedule(g)}
                </div>
              )}
              {g.progress?.percent !== null && g.progress?.percent !== undefined && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 max-w-[140px] overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className={`h-full rounded-full ${
                      g.progress.percent >= 70 ? 'bg-red-500'
                        : g.progress.percent >= 40 ? 'bg-amber-400' : 'bg-green-500'}`}
                      style={{ width: `${g.progress.percent}%` }} />
                  </div>
                  <span className="text-xs text-gray-400">
                    {g.level ? `${g.level} · ` : ''}{g.progress.percent}% o'tildi
                  </span>
                </div>
              )}
            </div>
            {g.monthlyFee > 0 && (
              <span className="badge text-xs bg-primary/10 text-primary whitespace-nowrap">
                {new Intl.NumberFormat('uz-UZ').format(g.monthlyFee)} so'm/oy
              </span>
            )}
            <button onClick={(e) => openEdit(e, g)} className="btn-ghost p-2 rounded-lg flex-shrink-0" title="Tahrirlash">
              <Pencil size={14} />
            </button>
            <button onClick={(e) => handleDelete(e, g)} className="btn-ghost p-2 rounded-lg text-red-400 hover:bg-red-50 flex-shrink-0" title="O'chirish">
              <Trash2 size={14} />
            </button>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </motion.div>
        ))}
        {groups?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Users2 size={36} className="mx-auto mb-3 opacity-30" />
            <p>Hali guruh yaratilmagan.</p>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={e => e.target === e.currentTarget && closeModal()}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 w-full max-w-lg shadow-2xl border border-[var(--border)] max-h-[92vh] flex flex-col my-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)] flex-shrink-0">
                <div>
                  <h2 className="font-bold text-base sm:text-lg text-[var(--text-primary)]">
                    {editingGroup ? "Guruhni tahrirlash" : "Guruh yaratish"}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">Guruh parametrlari va dars vaqtlarini belgilang</p>
                </div>
                <button onClick={closeModal} className="btn-ghost p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X size={18} />
                </button>
              </div>

              {/* Form body */}
              <div className="overflow-y-auto pr-1 flex-1 space-y-3">
                {/* Row 1: Name & Teacher */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Guruh nomi *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Masalan: Biologiya-1A" className="input-field text-sm py-1.5" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">O'qituvchi *</label>
                    <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))} className="input-field text-sm py-1.5">
                      <option value="">Tanlang</option>
                      {teachers?.map(t => <option key={t.id} value={t.id}>{t.name}{t.branch ? ` (${t.branch.name})` : ''}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 2: Branch & Monthly fee */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {branches?.length > 0 ? (
                    <div>
                      <label className="block text-xs font-semibold mb-1 flex items-center gap-1 text-[var(--text-secondary)]">
                        <Building2 size={12} /> Markaz / Filial
                      </label>
                      <select value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))} className="input-field text-sm py-1.5">
                        <option value="">Tanlanmagan</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  ) : null}
                  <div className={branches?.length > 0 ? '' : 'sm:col-span-2'}>
                    <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Oylik to'lov (so'm)</label>
                    <input value={form.monthlyFee} onChange={e => setForm(f => ({ ...f, monthlyFee: e.target.value.replace(/\D/g, '') }))}
                      placeholder="Masalan: 500000" inputMode="numeric" className="input-field text-sm py-1.5" />
                  </div>
                </div>

                {/* Row 3: Week days */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1 text-[var(--text-secondary)]">
                    <Calendar size={12} /> Hafta kunlari
                  </label>
                  <div className="flex gap-1.5">
                    {DAYS.map(d => (
                      <button key={d.key} type="button"
                        onClick={() => toggleDay(d.key)}
                        className={`flex-1 h-8 rounded-lg text-xs font-semibold transition-colors ${
                          form.weekDays.includes(d.key)
                            ? 'gradient-bg text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 4: Time & Room */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Time */}
                  <div>
                    <label className="block text-xs font-semibold mb-1 flex items-center gap-1 text-[var(--text-secondary)]">
                      <Clock size={12} /> Dars vaqti
                    </label>
                    <TimeRangePicker
                      startTime={form.startTime}
                      endTime={form.endTime}
                      onChange={({ startTime, endTime }) => setForm(f => ({ ...f, startTime, endTime }))}
                    />
                  </div>

                  {/* Room */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold flex items-center gap-1 text-[var(--text-secondary)]">
                        <DoorOpen size={12} /> Xona
                      </label>
                      <button
                        type="button"
                        onClick={() => setCustomRoomMode(m => !m)}
                        className="text-[11px] text-[var(--primary)] hover:underline font-medium"
                      >
                        {customRoomMode ? "Tanlash" : "+ Boshqa"}
                      </button>
                    </div>

                    {customRoomMode ? (
                      <input
                        value={form.room}
                        onChange={e => setForm(f => ({ ...f, room: e.target.value, roomId: '' }))}
                        placeholder="Masalan: 3-xona"
                        className="input-field text-sm py-1.5"
                        autoFocus
                      />
                    ) : (
                      <select
                        value={form.roomId || (rooms.find(r => r.name === form.room)?.id || (form.room ? `name:${form.room}` : ''))}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '__custom__') {
                            setCustomRoomMode(true);
                            return;
                          }
                          if (val.startsWith('name:')) {
                            const customName = val.replace('name:', '');
                            setForm(f => ({ ...f, roomId: '', room: customName }));
                            return;
                          }
                          const selectedRoom = rooms.find(r => r.id === val);
                          setForm(f => ({
                            ...f,
                            roomId: val,
                            room: selectedRoom ? selectedRoom.name : '',
                          }));
                        }}
                        className="input-field text-sm py-1.5"
                      >
                        <option value="">Xona tanlang</option>
                        {rooms.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.name} {r.capacity ? `(${r.capacity} k)` : ''}
                          </option>
                        ))}
                        {rooms.length === 0 && ['1-xona', '2-xona', '3-xona', '4-xona', '5-xona'].map(name => (
                          <option key={name} value={`name:${name}`}>{name}</option>
                        ))}
                        <option value="__custom__">+ Boshqa xona yozish...</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Row 5: Level & Total lessons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Daraja</label>
                    <input value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                      placeholder="Masalan: Boshlang'ich" className="input-field text-sm py-1.5" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Jami darslar</label>
                    <input value={form.totalLessons} onChange={e => setForm(f => ({ ...f, totalLessons: e.target.value.replace(/\D/g, '') }))}
                      placeholder="Masalan: 48" inputMode="numeric" className="input-field text-sm py-1.5" />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 mt-3 border-t border-[var(--border)] flex-shrink-0 flex gap-2.5">
                <button onClick={closeModal} className="btn-ghost flex-1 py-2 text-sm">Bekor</button>
                <button onClick={() => canSubmit && submit()}
                  disabled={!canSubmit}
                  className="btn-primary flex-1 py-2 text-sm disabled:opacity-40 font-medium">
                  {saving ? 'Saqlanmoqda...' : editingGroup ? 'Saqlash' : 'Guruh yaratish'}
                </button>
              </div>
              {saveError && (
                <p className="text-xs text-red-500 text-center mt-1.5 flex-shrink-0">{friendlyAiErrorMessage(saveError)}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
