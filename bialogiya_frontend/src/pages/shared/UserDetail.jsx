import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Phone, Mail, MapPin, ShieldCheck, CalendarCheck, Building2,
  GraduationCap, Users, Clock, Flame, Snowflake, Coins, Star, Trophy,
  CreditCard, CheckCircle2, XCircle, AlertCircle, Plus, Trash2, Edit3,
  Sparkles, CheckSquare, X, Calendar, Award, FileText, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/axios';
import { useAuthStore } from '../../store/authStore';
import Loader from '../../components/ui/Loader';
import ErrorState from '../../components/ui/ErrorState';
import { formatDate, formatDateTime, getLevelProgress } from '../../utils/format';

const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  reception: 'Qabulxona',
  teacher: "O'qituvchi",
  student: "O'quvchi",
};

const GENDER_LABELS = { male: 'Erkak', female: 'Ayol' };

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Naqd pul' },
  { value: 'click', label: 'Click' },
  { value: 'payme', label: 'Payme' },
  { value: 'bank', label: "Bank o'tkazmasi" },
  { value: 'other', label: 'Boshqa' },
];

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState('groups');

  // Modals state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');

  const [showCoinModal, setShowCoinModal] = useState(false);
  const [coinForm, setCoinForm] = useState({ coins: 10, xp: 30, reason: '' });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    amount: '',
    method: 'cash',
    note: '',
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'male',
    address: '',
    groupId: '',
  });

  // Query: Student History
  const {
    data: historyData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['student-history', id],
    queryFn: () => api.get(`/users/${id}/history`).then((res) => res.data.data),
    enabled: Boolean(id),
    retry: false,
  });

  // Query: Groups (for edit modal assignment)
  const { data: groupsData } = useQuery({
    queryKey: ['groups-list-detail'],
    queryFn: () => api.get('/groups').then((r) => r.data.data || []),
    enabled: showEditModal,
  });

  // Mutations
  const addNoteMutation = useMutation({
    mutationFn: (text) => api.post(`/users/${id}/notes`, { text }),
    onSuccess: () => {
      qc.invalidateQueries(['student-history', id]);
      toast.success("Eslatma qo'shildi");
      setNoteText('');
      setShowNoteModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Eslatmani saqlab bo'lmadi");
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId) => api.delete(`/users/${id}/notes/${noteId}`),
    onSuccess: () => {
      qc.invalidateQueries(['student-history', id]);
      toast.success("Eslatma o'chirildi");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "O'chirib bo'lmadi");
    },
  });

  const awardCoinsMutation = useMutation({
    mutationFn: (data) => api.post(`/users/${id}/award-coins`, data),
    onSuccess: () => {
      qc.invalidateQueries(['student-history', id]);
      toast.success('Tangalar va XP muvaffaqiyatli hisoblandi');
      setShowCoinModal(false);
      setCoinForm({ coins: 10, xp: 30, reason: '' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Tangalarni berib bo'lmadi");
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data) => api.post('/payments', data),
    onSuccess: () => {
      qc.invalidateQueries(['student-history', id]);
      toast.success("To'lov muvaffaqiyatli saqlandi");
      setShowPaymentModal(false);
      setPaymentForm({
        month: new Date().toISOString().slice(0, 7),
        amount: '',
        method: 'cash',
        note: '',
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "To'lovni saqlab bo'lmadi");
    },
  });

  const freezeMutation = useMutation({
    mutationFn: () => api.patch(`/users/${id}/freeze`),
    onSuccess: (res) => {
      qc.invalidateQueries(['student-history', id]);
      toast.success(res.data?.data?.isFrozen ? "O'quvchi muzlatildi" : "O'quvchi faollashtirildi");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Holatni o'zgartirib bo'lmadi");
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['student-history', id]);
      toast.success("Ma'lumotlar saqlandi");
      setShowEditModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Yangilab bo'lmadi");
    },
  });

  const openEditModal = (targetUser) => {
    setEditForm({
      name: targetUser.name || '',
      phone: targetUser.phone || '',
      age: targetUser.age || '',
      gender: targetUser.gender || 'male',
      address: targetUser.address || '',
      groupId: targetUser.groupId || '',
    });
    setShowEditModal(true);
  };

  const openPaymentModal = (fee) => {
    setPaymentForm({
      month: new Date().toISOString().slice(0, 7),
      amount: fee ? String(fee) : '',
      method: 'cash',
      note: '',
    });
    setShowPaymentModal(true);
  };

  const back = (
    <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl" aria-label="Orqaga">
      <ArrowLeft size={18} />
    </button>
  );

  if (isLoading) return <Loader />;

  if (isError || !historyData) {
    return (
      <div className="dashboard-shell max-w-6xl mx-auto">
        <div className="mb-6">{back}</div>
        <ErrorState
          error={error}
          onRetry={refetch}
          title={error?.response?.status === 404 ? 'Foydalanuvchi topilmadi' : "Ma'lumotni yuklab bo'lmadi"}
        />
      </div>
    );
  }

  const {
    student,
    group,
    payments = [],
    attendance = [],
    tests = [],
    homework = [],
    coinHistory = [],
    notes = [],
    summary = {},
  } = historyData;

  const roleLabel = ROLE_LABELS[student.role] || student.role;
  const isStudent = student.role === 'student';
  const { level, progress } = getLevelProgress(student.xp || 0);

  const canManage = ['admin', 'manager', 'reception'].includes(currentUser?.role);
  const isTeacher = currentUser?.role === 'teacher';

  return (
    <div className="dashboard-shell max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <header className="dashboard-header flex-wrap gap-4 justify-between items-center mb-6">
        <div className="flex items-center gap-3 min-w-0">
          {back}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="dashboard-badge flex items-center gap-1">
                <GraduationCap size={13} /> {roleLabel} profili
              </span>
              {student.isFrozen && (
                <span className="badge text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 inline-flex items-center gap-1">
                  <Snowflake size={11} /> Muzlatilgan
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold truncate mt-0.5">{student.name || student.username}</h1>
            <p className="text-xs text-[var(--text-muted)] truncate">
              {group?.name ? `Guruh: ${group.name}` : 'Guruhsiz'} {student.phone ? `· ${student.phone}` : ''}
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isStudent && (
            <>
              <button
                onClick={() => openPaymentModal(summary.monthlyFee)}
                className="btn-primary text-sm flex items-center gap-1.5 py-2 px-3.5 shadow-sm"
              >
                <CreditCard size={15} /> To'lov qilish
              </button>

              <button
                onClick={() => setShowCoinModal(true)}
                className="btn-ghost text-sm flex items-center gap-1.5 py-2 px-3 border border-[var(--border)]"
                title="Tanga / XP berish"
              >
                <Sparkles size={15} className="text-amber-500" /> Tanga berish
              </button>
            </>
          )}

          {canManage && (
            <button
              onClick={() => openEditModal(student)}
              className="btn-ghost text-sm flex items-center gap-1.5 py-2 px-3 border border-[var(--border)]"
            >
              <Edit3 size={15} /> Tahrirlash
            </button>
          )}

          {(canManage || isTeacher) && isStudent && (
            <button
              onClick={() => freezeMutation.mutate()}
              disabled={freezeMutation.isPending}
              className={`text-sm flex items-center gap-1.5 py-2 px-3 rounded-xl border transition-all ${
                student.isFrozen
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                  : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800'
              }`}
            >
              <Snowflake size={14} />
              {student.isFrozen ? 'Faollashtirish' : 'Muzlatish'}
            </button>
          )}
        </div>
      </header>

      {/* Main Grid: Left Profile Card + Right Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Student Details & Notes */}
        <div className="lg:col-span-4 space-y-5">
          {/* Main Card */}
          <div className="panel-card space-y-5">
            {/* Avatar & Identifiers */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-[var(--border)]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-orange-400 text-white grid place-items-center text-2xl font-bold shadow-md flex-shrink-0">
                {(student.name || student.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold truncate text-[var(--text-primary)]">
                  {student.name || "Noma'lum"}
                </div>
                <div className="text-xs text-[var(--text-muted)] truncate">@{student.username}</div>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="badge text-[11px] font-semibold bg-primary/10 text-primary">
                    Lv.{level}
                  </span>
                  <span className={`badge text-[11px] ${student.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-500'}`}>
                    {student.isActive ? 'Faol' : 'Nofaol'}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Status Box (For Student) */}
            {isStudent && (
              <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Moliyaviy holat</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    summary.totalDebt > 0
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}>
                    {summary.totalDebt > 0 ? 'Qarzdor' : 'To\'langan'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <div className="text-[11px] text-[var(--text-muted)]">Jami to'langan</div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {(summary.totalPaid || 0).toLocaleString()} so'm
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--text-muted)]">Qarzdorlik</div>
                    <div className={`text-sm font-bold ${summary.totalDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text-primary)]'}`}>
                      {(summary.totalDebt || 0).toLocaleString()} so'm
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border)]/60 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Oylik to'lov:</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {(summary.monthlyFee || 0).toLocaleString()} so'm
                  </span>
                </div>
              </div>
            )}

            {/* Gamification Stats */}
            {isStudent && (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center flex-shrink-0">
                    <Coins size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {student.coins || 0}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">Tangalar</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary grid place-items-center flex-shrink-0">
                    <Star size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {student.xp || 0} XP
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">Tajriba (XP)</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 grid place-items-center flex-shrink-0">
                    <Flame size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {student.streak?.current || 0} kun
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">Streak</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 grid place-items-center flex-shrink-0">
                    <Trophy size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {Math.round(progress)}%
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">Daraja o'sishi</div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact & Personal Information */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Shaxsiy ma'lumotlar
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <Phone size={13} /> Telefon:
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">{student.phone || '—'}</span>
                </div>

                {student.email && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                      <Mail size={13} /> Email:
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] truncate max-w-[180px]">{student.email}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <Calendar size={13} /> Yosh / Jins:
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {[student.age && `${student.age} yosh`, GENDER_LABELS[student.gender]].filter(Boolean).join(', ') || '—'}
                  </span>
                </div>

                {student.address && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                      <MapPin size={13} /> Manzil:
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] text-right">{student.address}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <Building2 size={13} /> Filial:
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {group?.branch?.name || student.branch?.name || 'Asosiy filial'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <CalendarCheck size={13} /> Qo'shilgan sana:
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {student.createdAt ? formatDate(student.createdAt) : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes / Reminders Card (matches reference screenshot) */}
          <div className="panel-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Eslatma</h3>
                <span className="badge text-[11px] bg-primary/10 text-primary">{notes.length}</span>
              </div>
              <button
                onClick={() => setShowNoteModal(true)}
                className="btn-ghost text-xs flex items-center gap-1 py-1 px-2.5 rounded-lg border border-[var(--border)] text-primary hover:bg-primary/10"
              >
                <Plus size={13} /> Qo'shish
              </button>
            </div>

            <div className="space-y-2">
              {notes.length > 0 ? (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-start justify-between gap-2 group transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-medium">
                        {n.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[var(--text-muted)] flex-wrap">
                        <span className="font-semibold text-primary">{n.authorName}</span>
                        <span>·</span>
                        <span>{formatDateTime(n.createdAt)}</span>
                      </div>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => deleteNoteMutation.mutate(n.id)}
                        disabled={deleteNoteMutation.isPending}
                        className="btn-ghost p-1.5 rounded-lg text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-opacity"
                        title="O'chirish"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-2xl p-4">
                  <FileText size={22} className="mx-auto mb-1.5 opacity-30" />
                  <p>Hozircha eslatmalar yo'q</p>
                  <button
                    onClick={() => setShowNoteModal(true)}
                    className="mt-2 text-[11px] text-primary hover:underline font-semibold"
                  >
                    + Yangi eslatma yozish
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Views */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tabs Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[var(--border)] scrollbar-none">
            {[
              { id: 'groups', label: 'Guruhlar', icon: Users, count: group ? 1 : 0 },
              { id: 'payments', label: "To'lovlar", icon: CreditCard, count: payments.length },
              { id: 'attendance', label: 'Davomat', icon: CalendarCheck, count: attendance.length },
              { id: 'coins', label: 'Tanga / Kristal', icon: Coins, count: coinHistory.length },
              { id: 'tests', label: 'Imtihonlar', icon: Award, count: tests.length },
              { id: 'homework', label: 'Mashqlar', icon: CheckSquare, count: homework.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: GURUHLAR */}
          {activeTab === 'groups' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {group ? (
                <div className="panel-card space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary grid place-items-center">
                        <Users size={22} />
                      </div>
                      <div>
                        <div className="text-base font-bold text-[var(--text-primary)]">{group.name}</div>
                        <div className="text-xs text-[var(--text-muted)]">
                          Fan: {group.subject || 'Biologiya'} {group.level ? `· ${group.level}` : ''}
                        </div>
                      </div>
                    </div>

                    <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold">
                      O'qiyapti (Faol)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                      <div className="text-[var(--text-muted)] mb-1">O'qituvchi</div>
                      <div className="font-bold text-[var(--text-primary)]">
                        {group.teacher?.name || student.teacher?.name || 'Biriktirilmagan'}
                      </div>
                      {group.teacher?.phone && (
                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{group.teacher.phone}</div>
                      )}
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                      <div className="text-[var(--text-muted)] mb-1">Dars jadvali</div>
                      <div className="font-bold text-[var(--text-primary)]">
                        {group.weekDays ? group.weekDays.join(', ') : 'Belgilanmagan'}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {group.startTime || '14:00'} - {group.endTime || '16:00'}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                      <div className="text-[var(--text-muted)] mb-1">Xona va Filial</div>
                      <div className="font-bold text-[var(--text-primary)]">
                        {group.room ? `Xona: ${group.room}` : 'Xona ko\'rsatilmagan'}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {group.branch?.name || 'Bosh bino'}
                      </div>
                    </div>
                  </div>

                  {/* Attendance Performance within this group */}
                  <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--text-primary)]">Darslarga qatnashish ko'rsatkichi</span>
                      <span className="font-bold text-primary">{summary.attendanceRate ?? 100}%</span>
                    </div>
                    <div className="w-full bg-[var(--border)] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${summary.attendanceRate ?? 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1">
                      <span>Jami darslar: {summary.totalLessons || 0} ta</span>
                      <span>Kelgan: {summary.presentCount || 0} ta</span>
                      <span>Kelmagan: {summary.absentCount || 0} ta</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="panel-card text-center py-12 space-y-3">
                  <Users size={36} className="mx-auto opacity-30 text-[var(--text-muted)]" />
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    O'quvchi hozirda hech qaysi guruhga biriktirilmagan
                  </div>
                  {canManage && (
                    <button onClick={() => openEditModal(student)} className="btn-primary text-xs mx-auto">
                      Guruhga biriktirish
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: TO'LOVLAR */}
          {activeTab === 'payments' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Financial Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Jami to'langan</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {(summary.totalPaid || 0).toLocaleString()} so'm
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Qarzdorlik</div>
                  <div className={`text-lg font-bold ${summary.totalDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text-primary)]'}`}>
                    {(summary.totalDebt || 0).toLocaleString()} so'm
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Oylik to'lov narxi</div>
                  <div className="text-lg font-bold text-[var(--text-primary)]">
                    {(summary.monthlyFee || 0).toLocaleString()} so'm
                  </div>
                </div>
              </div>

              {/* Transactions Header */}
              <div className="panel-card space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">To'lovlar tarixi</h3>
                  <button
                    onClick={() => openPaymentModal(summary.monthlyFee)}
                    className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
                  >
                    <Plus size={13} /> To'lov kiritish
                  </button>
                </div>

                {payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                          <th className="py-2.5 px-3">Oy</th>
                          <th className="py-2.5 px-3">To'langan miqdor</th>
                          <th className="py-2.5 px-3">Kutilgan</th>
                          <th className="py-2.5 px-3">Usul</th>
                          <th className="py-2.5 px-3">Holat</th>
                          <th className="py-2.5 px-3">Sana / Izoh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {payments.map((p) => {
                          const isPaid = p.status === 'paid';
                          const isPartial = p.status === 'partial';
                          return (
                            <tr key={p.id} className="hover:bg-[var(--surface)]/50 transition-colors">
                              <td className="py-3 px-3 font-semibold text-[var(--text-primary)]">
                                {p.month}
                              </td>
                              <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                                {(p.amount || 0).toLocaleString()} so'm
                              </td>
                              <td className="py-3 px-3 text-[var(--text-muted)]">
                                {(p.expectedAmount || 0).toLocaleString()} so'm
                              </td>
                              <td className="py-3 px-3 capitalize text-[var(--text-secondary)]">
                                {p.method || 'Naqd'}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    isPaid
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                      : isPartial
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                  }`}
                                >
                                  {isPaid ? "To'liq to'langan" : isPartial ? 'Qisman' : "To'lanmagan"}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-[var(--text-muted)]">
                                <div>{p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}</div>
                                {p.note && <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{p.note}</div>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-xs text-[var(--text-muted)]">
                    <CreditCard size={28} className="mx-auto mb-2 opacity-30" />
                    <p>Hozircha hech qanday to'lovlar mavjud emas</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: DAVOMAT */}
          {activeTab === 'attendance' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Attendance Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center">
                  <div className="text-[11px] text-[var(--text-muted)]">Jami darslar</div>
                  <div className="text-base font-bold text-[var(--text-primary)]">{summary.totalLessons || 0}</div>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center">
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Kelgan</div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{summary.presentCount || 0}</div>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center">
                  <div className="text-[11px] text-rose-600 dark:text-rose-400">Kelmagan</div>
                  <div className="text-base font-bold text-rose-600 dark:text-rose-400">{summary.absentCount || 0}</div>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center">
                  <div className="text-[11px] text-amber-600 dark:text-amber-400">Kech qolgan</div>
                  <div className="text-base font-bold text-amber-600 dark:text-amber-400">{summary.lateCount || 0}</div>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-primary">Davomat %</div>
                  <div className="text-base font-bold text-primary">{summary.attendanceRate ?? 100}%</div>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="panel-card space-y-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)] pb-2 border-b border-[var(--border)]">
                  Davomat jurnali
                </h3>

                {attendance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                          <th className="py-2.5 px-3">Sana</th>
                          <th className="py-2.5 px-3">Guruh</th>
                          <th className="py-2.5 px-3">Holat</th>
                          <th className="py-2.5 px-3">Izoh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {attendance.map((a, idx) => {
                          const isPresent = a.status === 'present';
                          const isAbsent = a.status === 'absent';
                          const isLate = a.status === 'late';
                          const isExcused = a.status === 'excused';

                          return (
                            <tr key={idx} className="hover:bg-[var(--surface)]/50 transition-colors">
                              <td className="py-3 px-3 font-medium text-[var(--text-primary)]">
                                {formatDate(a.date)}
                              </td>
                              <td className="py-3 px-3 text-[var(--text-secondary)]">
                                {a.groupName || group?.name || '—'}
                              </td>
                              <td className="py-3 px-3">
                                {isPresent && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    <CheckCircle2 size={12} /> Kelgan
                                  </span>
                                )}
                                {isAbsent && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                                    <XCircle size={12} /> Kelmagan
                                  </span>
                                )}
                                {isLate && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                    <Clock size={12} /> Kech qolgan
                                  </span>
                                )}
                                {isExcused && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                    <AlertCircle size={12} /> Sababli
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-[var(--text-muted)]">
                                {a.note || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-xs text-[var(--text-muted)]">
                    <CalendarCheck size={28} className="mx-auto mb-2 opacity-30" />
                    <p>Davomat yozuvlari mavjud emas</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 4: TANGA / KRISTAL HISOBOTI */}
          {activeTab === 'coins' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Gamification Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center">
                    <Coins size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)]">Joriy tangalar</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">{student.coins || 0} ta</div>
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary grid place-items-center">
                    <Star size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)]">Jami to'plangan XP</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">{student.xp || 0} XP</div>
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 grid place-items-center">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)]">Joriy daraja</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">Daraja {level}</div>
                  </div>
                </div>
              </div>

              {/* Transactions Log */}
              <div className="panel-card space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Harakatlar va mukofotlar xronologiyasi</h3>
                  <button
                    onClick={() => setShowCoinModal(true)}
                    className="btn-ghost text-xs flex items-center gap-1.5 py-1.5 px-3 border border-[var(--border)] text-primary hover:bg-primary/10"
                  >
                    <Plus size={13} /> Tanga berish / ayirish
                  </button>
                </div>

                {coinHistory.length > 0 ? (
                  <div className="divide-y divide-[var(--border)]">
                    {coinHistory.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-xl grid place-items-center flex-shrink-0 ${
                            item.type === 'test'
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                              : item.type === 'homework'
                              ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}>
                            {item.type === 'test' ? <Award size={15} /> : item.type === 'homework' ? <CheckSquare size={15} /> : <Sparkles size={15} />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[var(--text-primary)] truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                              <span>{formatDateTime(item.date)}</span>
                              {item.authorName && (
                                <>
                                  <span>·</span>
                                  <span className="text-primary font-medium">{item.authorName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          {item.coins !== 0 && (
                            <span className={`font-bold px-2 py-0.5 rounded-lg text-xs ${
                              item.coins > 0
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                            }`}>
                              {item.coins > 0 ? `+${item.coins}` : item.coins} tanga
                            </span>
                          )}

                          {item.xp !== 0 && (
                            <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg text-xs">
                              +{item.xp} XP
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-xs text-[var(--text-muted)]">
                    <Coins size={28} className="mx-auto mb-2 opacity-30" />
                    <p>Hozircha tanga yoki XP harakatlari qayd etilmagan</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 5: IMTIHONLAR (TESTS) */}
          {activeTab === 'tests' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Topshirilgan testlar</div>
                  <div className="text-lg font-bold text-[var(--text-primary)]">{tests.length} ta</div>
                </div>

                <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Muvaffaqiyatli</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {summary.passedTests || 0} ta
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)] mb-1">O'rtacha natija</div>
                  <div className="text-lg font-bold text-primary">
                    {tests.length > 0
                      ? Math.round(tests.reduce((s, t) => s + (t.percentage || 0), 0) / tests.length)
                      : 0}%
                  </div>
                </div>
              </div>

              <div className="panel-card space-y-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)] pb-2 border-b border-[var(--border)]">
                  Test natijalari
                </h3>

                {tests.length > 0 ? (
                  <div className="divide-y divide-[var(--border)]">
                    {tests.map((t) => (
                      <div key={t.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm text-[var(--text-primary)]">
                            {t.test?.title || 'Sinov testi'}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                            Sana: {formatDateTime(t.completedAt)} {t.timeSpent ? `· ${Math.round(t.timeSpent / 60)} daqiqa` : ''}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-bold text-sm text-[var(--text-primary)]">
                              {t.score || 0} / {t.totalPoints || t.test?.totalPoints || 100} ball
                            </div>
                            <div className="text-[11px] text-primary font-medium">{t.percentage}%</div>
                          </div>

                          <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold ${
                            t.passed
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          }`}>
                            {t.passed ? "O'tdi" : "Yiqildi"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-xs text-[var(--text-muted)]">
                    <Award size={28} className="mx-auto mb-2 opacity-30" />
                    <p>Hech qanday test topshirilmagan</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 6: MASHQLAR (HOMEWORK) */}
          {activeTab === 'homework' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Topshirilgan vazifalar</div>
                  <div className="text-lg font-bold text-[var(--text-primary)]">{homework.length} ta</div>
                </div>

                <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Baholangan</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {homework.filter((h) => h.status === 'graded').length} ta
                  </div>
                </div>
              </div>

              <div className="panel-card space-y-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)] pb-2 border-b border-[var(--border)]">
                  Vazifalar jurnali
                </h3>

                {homework.length > 0 ? (
                  <div className="divide-y divide-[var(--border)]">
                    {homework.map((h) => (
                      <div key={h.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm text-[var(--text-primary)]">
                            {h.homework?.title || 'Uy vazifasi'}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                            Topshirildi: {formatDateTime(h.submittedAt)}
                          </div>
                          {h.feedback && (
                            <div className="text-[11px] text-[var(--text-secondary)] mt-1 italic">
                              "{h.feedback}"
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-bold text-sm text-[var(--text-primary)]">
                              {h.score !== null && h.score !== undefined ? `${h.score} ball` : 'Tekshirilmoqda'}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)]">
                              Maks: {h.homework?.maxScore || 100} ball
                            </div>
                          </div>

                          <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold ${
                            h.status === 'graded'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}>
                            {h.status === 'graded' ? 'Baholandi' : 'Kutilmoqda'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-xs text-[var(--text-muted)]">
                    <CheckSquare size={28} className="mx-auto mb-2 opacity-30" />
                    <p>Uy vazifalari topshirilmagan</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD NOTE */}
      <AnimatePresence>
        {showNoteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={(e) => e.target === e.currentTarget && setShowNoteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-primary" />
                  <h3 className="font-bold text-base text-[var(--text-primary)]">Eslatma yozish</h3>
                </div>
                <button onClick={() => setShowNoteModal(false)} className="btn-ghost p-1.5 rounded-xl">
                  <X size={16} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Eslatma matni
                </label>
                <textarea
                  rows={4}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Masalan: 21.09 da to'lov qiladi, ota-onasi bilan gaplashildi..."
                  className="input-field w-full text-xs"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setShowNoteModal(false)} className="btn-ghost text-xs py-2 px-4">
                  Bekor qilish
                </button>
                <button
                  onClick={() => addNoteMutation.mutate(noteText)}
                  disabled={!noteText.trim() || addNoteMutation.isPending}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <Check size={14} /> Saqlash
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: AWARD COINS */}
      <AnimatePresence>
        {showCoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={(e) => e.target === e.currentTarget && setShowCoinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins size={18} className="text-amber-500" />
                  <h3 className="font-bold text-base text-[var(--text-primary)]">Tanga va XP berish / yechish</h3>
                </div>
                <button onClick={() => setShowCoinModal(false)} className="btn-ghost p-1.5 rounded-xl">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Tanga miqdori
                  </label>
                  <input
                    type="number"
                    value={coinForm.coins}
                    onChange={(e) => setCoinForm({ ...coinForm, coins: Number(e.target.value) })}
                    className="input-field w-full text-xs"
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">Manfiy kiritilsa yechiladi</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    XP miqdori
                  </label>
                  <input
                    type="number"
                    value={coinForm.xp}
                    onChange={(e) => setCoinForm({ ...coinForm, xp: Number(e.target.value) })}
                    className="input-field w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Sabab / Izoh
                </label>
                <input
                  type="text"
                  value={coinForm.reason}
                  onChange={(e) => setCoinForm({ ...coinForm, reason: e.target.value })}
                  placeholder="Masalan: Olimpiada g'olibi, faol ishtirok..."
                  className="input-field w-full text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setShowCoinModal(false)} className="btn-ghost text-xs py-2 px-4">
                  Bekor qilish
                </button>
                <button
                  onClick={() => awardCoinsMutation.mutate(coinForm)}
                  disabled={awardCoinsMutation.isPending}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <Sparkles size={14} /> Hisoblash
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 3: QUICK PAYMENT */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={(e) => e.target === e.currentTarget && setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-primary" />
                  <h3 className="font-bold text-base text-[var(--text-primary)]">To'lov kiritish</h3>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="btn-ghost p-1.5 rounded-xl">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Oy (YYYY-MM)
                  </label>
                  <input
                    type="month"
                    value={paymentForm.month}
                    onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })}
                    className="input-field w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    To'lov usuli
                  </label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    className="input-field w-full text-xs"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  To'lov summasi (so'm)
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder={String(summary.monthlyFee || 400000)}
                  className="input-field w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Izoh (agar qisman to'lansa sababini yozing)
                </label>
                <input
                  type="text"
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  placeholder="Izoh yoki chek raqami..."
                  className="input-field w-full text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setShowPaymentModal(false)} className="btn-ghost text-xs py-2 px-4">
                  Bekor qilish
                </button>
                <button
                  onClick={() =>
                    recordPaymentMutation.mutate({
                      studentId: student.id,
                      month: paymentForm.month,
                      amount: Number(paymentForm.amount) || 0,
                      expectedAmount: summary.monthlyFee || 0,
                      method: paymentForm.method,
                      note: paymentForm.note,
                    })
                  }
                  disabled={recordPaymentMutation.isPending}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <Check size={14} /> To'lovni saqlash
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 4: EDIT STUDENT */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 size={18} className="text-primary" />
                  <h3 className="font-bold text-base text-[var(--text-primary)]">O'quvchi ma'lumotlarini tahrirlash</h3>
                </div>
                <button onClick={() => setShowEditModal(false)} className="btn-ghost p-1.5 rounded-xl">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    F.I.SH. (Ism familiya) *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input-field w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Telefon raqami
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+998 90 123 45 67"
                    className="input-field w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Yoshi
                  </label>
                  <input
                    type="number"
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    placeholder="16"
                    className="input-field w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Jinsi
                  </label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="input-field w-full text-xs"
                  >
                    <option value="male">Erkak</option>
                    <option value="female">Ayol</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Guruh
                  </label>
                  <select
                    value={editForm.groupId}
                    onChange={(e) => setEditForm({ ...editForm, groupId: e.target.value })}
                    className="input-field w-full text-xs"
                  >
                    <option value="">Guruhsiz</option>
                    {groupsData?.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Manzil
                  </label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="Toshkent sh., Chilonzor tumani..."
                    className="input-field w-full text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setShowEditModal(false)} className="btn-ghost text-xs py-2 px-4">
                  Bekor qilish
                </button>
                <button
                  onClick={() => updateProfileMutation.mutate(editForm)}
                  disabled={updateProfileMutation.isPending || !editForm.name.trim()}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <Check size={14} /> Saqlash
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
