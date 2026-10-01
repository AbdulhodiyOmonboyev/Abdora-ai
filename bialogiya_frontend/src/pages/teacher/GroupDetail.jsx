import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, CreditCard, ChevronLeft, ChevronRight,
  BookOpen, Snowflake, Phone, Plus, KeyRound, Copy, Check,
  Trash2, ExternalLink, Calendar, Clock, DoorOpen, Building2,
  TrendingUp, Wallet, Banknote, Smartphone, Search, RefreshCw,
  UserCheck, AlertCircle, ShieldCheck
} from 'lucide-react';
import api from '../../config/axios';
import { getSubjectLabel } from '../../utils/subjects';
import { useAuthStore } from '../../store/authStore';
import { cleanPhone } from '../../utils/formatPhone';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PhoneInput from '../../components/ui/PhoneInput';
import toast from 'react-hot-toast';

const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

const DAYS = [
  { key: 'mon', label: 'Dushanba' },
  { key: 'tue', label: 'Seshanba' },
  { key: 'wed', label: 'Chorshanba' },
  { key: 'thu', label: 'Payshanba' },
  { key: 'fri', label: 'Juma' },
  { key: 'sat', label: 'Shanba' },
  { key: 'sun', label: 'Yakshanba' },
];

const PAYMENT_METHODS = [
  { key: 'cash',  label: 'Naqd pul', icon: Banknote,   color: '#10B981' },
  { key: 'click', label: 'Click',    icon: Smartphone, color: '#3B82F6' },
  { key: 'payme', label: 'Payme',    icon: CreditCard, color: '#8B5CF6' },
  { key: 'bank',  label: 'Bank',     icon: Building2,  color: '#F59E0B' },
  { key: 'other', label: 'Boshqa',   icon: Wallet,     color: '#64748B' },
];

function getMonthStr(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 7);
}

function parseMonth(str) {
  if (!str) return '';
  const [y, m] = str.split('-');
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}

function parseWeekDays(raw) {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

function formatSum(n) {
  return Number(n || 0).toLocaleString('uz-UZ') + " so'm";
}

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const [monthOffset, setMonthOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'paid' | 'unpaid' | 'frozen'
  const [confirm, setConfirm] = useState(null);

  // Modals
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phone: '+998 ', language: 'uz' });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    studentName: '',
    amount: '',
    method: 'cash',
    note: '',
  });

  const [credsData, setCredsData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const month = getMonthStr(monthOffset);

  // Queries
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => api.get(`/groups/${id}`).then(r => r.data?.data || r.data || {}),
    enabled: !!id,
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['group-payments', id, month],
    queryFn: () => api.get(`/payments/group/${id}?month=${month}`).then(r => r.data?.data || r.data || {}),
    enabled: !!id,
  });

  const students = group?.students || [];
  const paymentsList = Array.isArray(paymentsData?.students) ? paymentsData.students : [];
  const paymentMap = useMemo(() => {
    const map = {};
    paymentsList.forEach(p => { map[p.id] = p; });
    return map;
  }, [paymentsList]);

  const monthlyFee = group?.monthlyFee || paymentsData?.monthlyFee || 0;

  // Mutations
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['group', id] });
    qc.invalidateQueries({ queryKey: ['group-payments', id, month] });
    qc.invalidateQueries({ queryKey: ['cashbox'] });
  };

  const recordPaymentMutation = useMutation({
    mutationFn: (d) => api.post('/payments', {
      studentId: d.studentId,
      month,
      amount: Number(d.amount),
      method: d.method,
      note: d.note,
      isPaid: Number(d.amount) >= monthlyFee,
    }),
    onSuccess: () => {
      invalidateAll();
      setShowPaymentModal(false);
      toast.success("To'lov muvaffaqiyatli qabul qilindi");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "To'lovni saqlashda xatolik");
    },
  });

  const addStudentMutation = useMutation({
    mutationFn: (d) => api.post('/users/create-student', {
      name: d.name,
      phone: cleanPhone(d.phone),
      language: d.language,
      groupId: id,
    }),
    onSuccess: ({ data }) => {
      invalidateAll();
      setShowAddStudent(false);
      setAddForm({ name: '', phone: '+998 ', language: 'uz' });
      setCredsData(data.data?.credentials || null);
      toast.success("O'quvchi muvaffaqiyatli qo'shildi");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "O'quvchi qo'shishda xatolik");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (studentId) => api.post(`/users/${studentId}/reset-password`, {}),
    onSuccess: ({ data }) => {
      setCredsData(data.data);
      toast.success("Parol tiklandi");
    },
    onError: () => toast.error("Parolni tiklashda xatolik"),
  });

  const toggleFreezeMutation = useMutation({
    mutationFn: (studentId) => api.patch(`/users/${studentId}/freeze`),
    onSuccess: ({ data }) => {
      invalidateAll();
      toast.success(data.data?.isFrozen ? "O'quvchi muzlatildi" : "O'quvchi faollashtirildi");
    },
    onError: () => toast.error("Muzlatish holatini o'zgartirishda xatolik"),
  });

  const removeStudentMutation = useMutation({
    mutationFn: (studentId) => api.delete(`/groups/${id}/students/${studentId}`),
    onSuccess: () => {
      invalidateAll();
      toast.success("O'quvchi guruhdan chiqarildi");
    },
    onError: () => toast.error("Guruhdan chiqarishda xatolik"),
  });

  const openPaymentForStudent = (s) => {
    const p = paymentMap[s.id];
    const remaining = p?.debt !== undefined ? p.debt : (monthlyFee || 0);
    setPaymentForm({
      studentId: s.id,
      studentName: s.name,
      amount: remaining > 0 ? remaining : (monthlyFee || 0),
      method: 'cash',
      note: '',
    });
    setShowPaymentModal(true);
  };

  const copyCreds = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast.success("Nusxalandi");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        s.name?.toLowerCase().includes(q) ||
        s.username?.toLowerCase().includes(q) ||
        s.phone?.includes(q);

      if (!matchSearch) return false;

      const p = paymentMap[s.id];
      const isPaid = p?.isPaid || false;
      const isFrozen = s.isFrozen || false;

      if (statusFilter === 'paid') return isPaid && !isFrozen;
      if (statusFilter === 'unpaid') return !isPaid && !isFrozen;
      if (statusFilter === 'frozen') return isFrozen;
      return true;
    });
  }, [students, searchQuery, statusFilter, paymentMap]);

  // Totals calculations
  const totalStudents = students.length;
  const paidCount = students.filter(s => paymentMap[s.id]?.isPaid).length;
  const unpaidCount = students.filter(s => !paymentMap[s.id]?.isPaid && !s.isFrozen).length;
  const frozenCount = students.filter(s => s.isFrozen).length;

  const totalCollected = paymentsList.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
  const totalExpected = paymentsList.reduce((sum, p) => sum + (Number(p.expectedAmount) || (monthlyFee || 0)), 0);

  const backUrl = user?.role === 'manager' ? '/manager/groups' : '/teacher/groups';
  const weekDays = parseWeekDays(group?.weekDays);

  if (groupLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="dashboard-shell max-w-6xl mx-auto space-y-6 pb-20">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />

      {/* ── Top Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(backUrl)}
              className="btn-ghost p-2 rounded-xl flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft size={16} /> Guruhlar
            </button>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
              style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
              {getSubjectLabel(group?.subject)}
            </span>
            {group?.isActive === false && (
              <span className="badge bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-md">
                Nofaol
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', boxShadow: 'var(--shadow-sm)' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {group?.name}
              </h1>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                {group?.teacher?.name ? `${group.teacher.name} (O'qituvchi)` : "O'qituvchi biriktirilmagan"}
              </p>
            </div>
          </div>

          {/* Badges bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {weekDays.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ background: 'var(--secondary-background)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                <Calendar size={13} className="text-primary" />
                {weekDays.map(d => DAYS.find(x => x.key === d)?.label).filter(Boolean).join(', ')}
              </span>
            )}

            {group?.startTime && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ background: 'var(--secondary-background)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                <Clock size={13} className="text-primary" />
                {group.startTime}{group.endTime ? ` – ${group.endTime}` : ''}
              </span>
            )}

            {group?.room && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ background: 'var(--secondary-background)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                <DoorOpen size={13} className="text-primary" />
                {group.room}
              </span>
            )}

            {group?.branch?.name && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ background: 'var(--secondary-background)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                <Building2 size={13} className="text-primary" />
                {group.branch.name}
              </span>
            )}

            {monthlyFee > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold"
                style={{ background: 'var(--primary-50)', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                <Wallet size={13} />
                {formatSum(monthlyFee)} / oy
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setShowAddStudent(true)}
            className="btn-primary flex items-center gap-2 py-2 px-4 text-xs font-semibold rounded-xl"
          >
            <Plus size={16} /> O'quvchi qo'shish
          </button>
        </div>
      </header>

      {/* ── Monthly Payment Bar & Statistics ── */}
      <section className="p-5 rounded-2xl space-y-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <CreditCard size={18} className="text-primary" />
            <span className="font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
              Oylik to'lovlar monitoringi
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setMonthOffset(o => o - 1)}
              className="btn-ghost p-1.5 rounded-lg border border-[var(--border)]"
              title="Oldingi oy"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs sm:text-sm font-semibold min-w-[130px] text-center"
              style={{ color: 'var(--text-primary)' }}>
              {parseMonth(month)}
            </span>
            <button
              onClick={() => setMonthOffset(o => o + 1)}
              disabled={monthOffset >= 0}
              className="btn-ghost p-1.5 rounded-lg border border-[var(--border)] disabled:opacity-30"
              title="Keyingi oy"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Stat cards grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">To'laganlar</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {paidCount} ta
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-1">
              {totalStudents > 0 ? Math.round((paidCount / totalStudents) * 100) : 0}% o'quvchi
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5">
            <div className="text-xs font-medium text-rose-600 dark:text-rose-400">Qarzdorlar</div>
            <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {unpaidCount} ta
            </div>
            <div className="text-[11px] text-rose-600/80 mt-1">
              To'lov qilmaganlar
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Yig'ilgan summa</div>
            <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5 truncate">
              {formatSum(totalCollected)}
            </div>
            <div className="text-[11px] text-blue-600/80 mt-1">
              Ushbu oy tushumi
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--secondary-background)]">
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Kutilayotgan summa</div>
            <div className="text-lg sm:text-xl font-bold mt-0.5 truncate" style={{ color: 'var(--text-primary)' }}>
              {formatSum(totalExpected)}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Jami {totalStudents} o'quvchidan
            </div>
          </div>
        </div>
      </section>

      {/* ── Students List & Management ── */}
      <section className="p-5 rounded-2xl space-y-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              O'quvchilar ro'yxati
            </h2>
            <span className="badge font-bold text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
              {students.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Ism, telefon, login..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field pl-9 py-1.5 text-xs w-full"
              />
            </div>

            {/* Filter tags */}
            <div className="flex items-center gap-1 p-1 rounded-xl"
              style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Barchasi ({students.length})
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'paid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                To'lagan ({paidCount})
              </button>
              <button
                onClick={() => setStatusFilter('unpaid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === 'unpaid'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                To'lamagan ({unpaidCount})
              </button>
              {frozenCount > 0 && (
                <button
                  onClick={() => setStatusFilter('frozen')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === 'frozen'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Muzlatilgan ({frozenCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Student items */}
        <div className="space-y-2.5">
          {filteredStudents.map((s, i) => {
            const payment = paymentMap[s.id] || {};
            const isPaid = payment.isPaid;
            const paidAmount = payment.paidAmount || 0;
            const debt = payment.debt || (isPaid ? 0 : (monthlyFee || 0));
            const paidAt = payment.payment?.paidAt ? new Date(payment.payment.paidAt).toLocaleDateString('uz-UZ') : null;

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="p-3.5 sm:p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
                style={{
                  background: 'var(--secondary-background)',
                  border: '1px solid var(--border)',
                }}
              >
                {/* Left: Avatar & Identity */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                    s.isFrozen ? 'bg-blue-500' : 'bg-primary'
                  }`}>
                    {s.isFrozen ? <Snowflake size={18} /> : s.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {s.name}
                      </span>
                      {s.isFrozen && (
                        <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Muzlatilgan
                        </span>
                      )}
                    </div>
                    <div className="text-xs flex flex-wrap items-center gap-2 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      <span>@{s.username}</span>
                      <span>·</span>
                      <span>Lv.{s.level || 1} ({s.xp || 0} XP)</span>
                      {s.phone && (
                        <>
                          <span>·</span>
                          <span className="font-mono">{s.phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Payment status */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  <span className={`px-2.5 py-1 rounded-full font-semibold text-xs flex items-center gap-1 ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : paidAmount > 0
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {isPaid ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                    {isPaid ? "To'landi" : paidAmount > 0 ? "Qisman to'landi" : "To'lanmadi"}
                  </span>

                  <div className="text-[11px] space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                    <div>
                      To'langan: <strong style={{ color: 'var(--text-primary)' }}>{formatSum(paidAmount)}</strong>
                      {debt > 0 && <span className="text-rose-600 dark:text-rose-400 ml-1.5">(Qarz: {formatSum(debt)})</span>}
                    </div>
                    {paidAt && <div>Oxirgi to'lov: {paidAt}</div>}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-1.5 self-end md:self-center">
                  <button
                    onClick={() => openPaymentForStudent(s)}
                    className="btn-primary btn-sm flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg"
                    title="To'lov qabul qilish"
                  >
                    <Wallet size={13} />
                    <span>To'lov olish</span>
                  </button>

                  <button
                    onClick={() => navigate(`/users/${s.id}`)}
                    className="btn-ghost btn-sm flex items-center gap-1 text-xs py-1.5 px-2.5 rounded-lg border border-[var(--border)]"
                    title="O'quvchi profiliga o'tish"
                  >
                    <ExternalLink size={13} />
                    <span>Profil</span>
                  </button>

                  <button
                    onClick={() => resetPasswordMutation.mutate(s.id)}
                    disabled={resetPasswordMutation.isPending}
                    className="btn-ghost btn-sm flex items-center gap-1 text-xs py-1.5 px-2.5 rounded-lg border border-[var(--border)]"
                    title="Parolni tiklash"
                  >
                    <KeyRound size={13} />
                    <span>Parol</span>
                  </button>

                  <button
                    onClick={() => toggleFreezeMutation.mutate(s.id)}
                    disabled={toggleFreezeMutation.isPending}
                    className="btn-ghost btn-sm flex items-center gap-1 text-xs py-1.5 px-2.5 rounded-lg border border-[var(--border)]"
                    title={s.isFrozen ? "Muzlatishdan chiqarish" : "Muzlatish"}
                  >
                    <Snowflake size={13} className={s.isFrozen ? 'text-blue-500' : ''} />
                    <span>{s.isFrozen ? 'Eritish' : 'Muzlatish'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setConfirm({
                        title: "Guruhdan chiqarish",
                        message: `${s.name} ni ushbu guruhdan chiqarishni tasdiqlaysizmi?`,
                        onConfirm: () => removeStudentMutation.mutate(s.id),
                      });
                    }}
                    className="btn-ghost btn-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg"
                    title="Guruhdan chiqarish"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}

          {filteredStudents.length === 0 && (
            <div className="text-center py-12 rounded-xl border border-dashed border-[var(--border)]"
              style={{ color: 'var(--text-muted)' }}>
              <Users size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">O'quvchilar topilmadi</p>
              <p className="text-xs mt-1">Qidiruv parametrlarini o'zgartiring yoki yangi o'quvchi qo'shing</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Quick Payment Modal ── */}
      <Modal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="To'lov qabul qilish"
        subtitle={`${paymentForm.studentName} — ${parseMonth(month)} oyi uchun to'lov`}
        size="sm"
        footer={
          <>
            <button onClick={() => setShowPaymentModal(false)} className="btn-ghost">
              Bekor
            </button>
            <button
              onClick={() => recordPaymentMutation.mutate(paymentForm)}
              disabled={recordPaymentMutation.isPending || !paymentForm.amount || Number(paymentForm.amount) <= 0}
              className="btn-primary"
            >
              {recordPaymentMutation.isPending ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Saqlanmoqda...
                </>
              ) : (
                <>
                  <Check size={14} /> To'lovni saqlash
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">To'lov summasi (so'm) *</label>
            <input
              type="number"
              min={0}
              value={paymentForm.amount}
              onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
              className="input-field"
              placeholder="Masalan: 500000"
            />
            {monthlyFee > 0 && (
              <div className="flex items-center justify-between text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                <span>Oylik to'lov: {formatSum(monthlyFee)}</span>
                <button
                  type="button"
                  onClick={() => setPaymentForm(f => ({ ...f, amount: monthlyFee }))}
                  className="text-primary hover:underline font-medium"
                >
                  To'liq to'lovni belgilash
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="form-label">To'lov usuli</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PAYMENT_METHODS.map(m => {
                const Icon = m.icon;
                const isSelected = paymentForm.method === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setPaymentForm(f => ({ ...f, method: m.key }))}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary-50)] text-[var(--primary)]'
                        : 'border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <Icon size={18} style={{ color: isSelected ? 'var(--primary)' : m.color }} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="form-label">Izoh (ixtiyoriy)</label>
            <input
              type="text"
              value={paymentForm.note}
              onChange={e => setPaymentForm(f => ({ ...f, note: e.target.value }))}
              className="input-field"
              placeholder="To'lov izohi..."
            />
          </div>

          <div className="p-3 rounded-xl text-xs flex items-center gap-2"
            style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <Wallet size={14} className="text-primary flex-shrink-0" />
            <span>To'lov avtomatik tarzda kassa va moliya bo'limiga kirim qilinadi.</span>
          </div>
        </div>
      </Modal>

      {/* ── Add Student Modal ── */}
      <Modal
        open={showAddStudent}
        onClose={() => setShowAddStudent(false)}
        title="Yangi o'quvchi qo'shish"
        subtitle={`Guruh: ${group?.name}`}
        size="sm"
        footer={
          <>
            <button onClick={() => setShowAddStudent(false)} className="btn-ghost">
              Bekor
            </button>
            <button
              onClick={() => addStudentMutation.mutate(addForm)}
              disabled={addStudentMutation.isPending || !addForm.name.trim()}
              className="btn-primary"
            >
              {addStudentMutation.isPending ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Yaratilmoqda...
                </>
              ) : (
                <>
                  <Plus size={14} /> Qo'shish
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">To'liq ismi *</label>
            <input
              type="text"
              value={addForm.name}
              onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
              className="input-field"
              placeholder="Masalan: Sardor Aliyev"
            />
          </div>

          <div>
            <label className="form-label">Telefon raqami</label>
            <PhoneInput
              value={addForm.phone}
              onChange={v => setAddForm(f => ({ ...f, phone: v }))}
            />
          </div>

          <div>
            <label className="form-label">Til</label>
            <select
              value={addForm.language}
              onChange={e => setAddForm(f => ({ ...f, language: e.target.value }))}
              className="input-field"
            >
              <option value="uz">O'zbekcha</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="p-3 rounded-xl text-xs space-y-1"
            style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <div className="flex items-center gap-1.5 font-medium text-primary">
              <UserCheck size={13} />
              <span>Avtomatik hisob ma'lumotlari:</span>
            </div>
            <p>Login va parol avtomatik shakllanadi va saqlangandan so'ng ekranda ko'rsatiladi.</p>
          </div>
        </div>
      </Modal>

      {/* ── Credentials Modal ── */}
      <Modal
        open={!!credsData}
        onClose={() => setCredsData(null)}
        title="Hisob ma'lumotlari"
        subtitle="O'quvchi tizimga kirishi uchun login va parol"
        size="sm"
        footer={
          <button onClick={() => setCredsData(null)} className="btn-primary w-full justify-center">
            Tushundim
          </button>
        }
      >
        <div className="space-y-3">
          <div className="p-4 rounded-xl space-y-3"
            style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
            <div>
              <div className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>Foydalanuvchi nomi (Login)</div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {credsData?.username}
                </span>
                <button
                  type="button"
                  onClick={() => copyCreds(credsData?.username)}
                  className="btn-ghost p-1.5 rounded-lg text-primary"
                  title="Nusxalash"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>Parol</div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono font-bold text-sm text-primary">
                  {credsData?.password}
                </span>
                <button
                  type="button"
                  onClick={() => copyCreds(credsData?.password)}
                  className="btn-ghost p-1.5 rounded-lg text-primary"
                  title="Nusxalash"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => copyCreds(`Login: ${credsData?.username}\nParol: ${credsData?.password}`)}
            className="w-full btn-secondary text-xs flex items-center justify-center gap-2 py-2.5 rounded-xl"
          >
            {copiedKey ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>Hammasini nusxalash</span>
          </button>
        </div>
      </Modal>
    </div>
  );
}
