import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users2, GraduationCap, BookOpen, ChevronRight, Building2,
  Phone, Mail, Calendar, Wallet, TrendingUp, CheckCircle2, Coins, CreditCard,
  Settings2, Plus, Copy, X, Clock, AlertCircle, ShieldCheck, Check, Edit3,
  ArrowUpRight, DollarSign, UserCheck
} from 'lucide-react';
import api from '../../config/axios';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { formatDate, formatDateTime, formatRelativeTime } from '../../utils/format';
import { formatSum, formatMonth, PAYMENT_METHODS } from '../../utils/finance';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';

const TABS = [
  { key: 'finance', label: "Moliya & To'lovlar", icon: Wallet },
  { key: 'groups', label: 'Guruhlar', icon: Users2 },
  { key: 'students', label: "O'quvchilar", icon: GraduationCap },
  { key: 'lessons', label: 'Darslar', icon: BookOpen },
];

const SHARE_PRESETS = [
  { share: 33, label: '1/3', hint: "O'qituvchi 33%, markaz 67%" },
  { share: 50, label: '50/50', hint: "Teng bo'linadi (50%)" },
  { share: 60, label: '60/40', hint: "O'qituvchi 60%, markaz 40%" },
  { share: 67, label: '2/3', hint: "O'qituvchi 67%, markaz 33%" },
  { share: 70, label: '70/30', hint: "O'qituvchi 70%, markaz 30%" },
];

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function ReceptionTeacherDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isReception = user?.role === 'reception';
  const initialTab = searchParams.get('tab') || 'finance';
  const [tab, setTab] = useState(TABS.some(t => t.key === initialTab) ? initialTab : 'finance');

  // Modals
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Payout Form State
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    method: 'cash',
    month: currentMonth(),
    note: '',
    date: new Date().toISOString().slice(0, 10),
  });

  // Salary Terms Form State
  const [termsForm, setTermsForm] = useState({
    salaryType: 'percent',
    salaryShare: 50,
    fixedSalary: '',
    hourlyRate: '',
  });

  const { data = {}, isLoading, refetch } = useQuery({
    queryKey: ['teacher-overview', id],
    queryFn: () => api.get(`/admin/teachers/${id}/overview`).then(r => r.data?.data || {}),
  });

  // Payout Mutation
  const payoutMutation = useMutation({
    mutationFn: (payload) => api.post(`/admin/teachers/${id}/payout`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-overview', id] });
      qc.invalidateQueries({ queryKey: ['cashbox'] });
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast.success("O'qituvchiga to'lov muvaffaqiyatli amalga oshirildi!");
      setShowPayoutModal(false);
      setPayoutForm({
        amount: '',
        method: 'cash',
        month: currentMonth(),
        note: '',
        date: new Date().toISOString().slice(0, 10),
      });
    },
    onError: (e) => toast.error(e.response?.data?.message || "To'lovni saqlab bo'lmadi"),
  });

  // Salary Terms Mutation
  const termsMutation = useMutation({
    mutationFn: (payload) => api.put(`/admin/teachers/${id}/salary-terms`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-overview', id] });
      toast.success("Maosh shartlari muvaffaqiyatli yangilandi!");
      setShowTermsModal(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Shartlarni saqlab bo'lmadi"),
  });

  // Toggle Active Status Mutation
  const toggleMutation = useMutation({
    mutationFn: () => api.put(`/admin/users/${id}/toggle`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-overview', id] });
      qc.invalidateQueries({ queryKey: ['all-teachers'] });
      toast.success("O'qituvchi holati yangilandi");
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const copy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Nusxalandi!');
  };

  const handleOpenPayout = (suggestedAmount) => {
    setPayoutForm((prev) => ({
      ...prev,
      amount: suggestedAmount !== undefined && suggestedAmount > 0 ? String(suggestedAmount) : prev.amount,
    }));
    setShowPayoutModal(true);
  };

  const handleOpenTerms = () => {
    const fin = data?.financials || {};
    const t = data?.teacher || {};
    setTermsForm({
      salaryType: t.salaryType || fin.salaryType || 'percent',
      salaryShare: t.salaryShare ?? fin.salaryShare ?? 50,
      fixedSalary: t.fixedSalary || fin.fixedSalary || '',
      hourlyRate: t.hourlyRate || fin.hourlyRate || '',
    });
    setShowTermsModal(true);
  };

  const submitPayout = (e) => {
    e.preventDefault();
    const amountNum = Number(payoutForm.amount);
    if (!amountNum || amountNum <= 0) {
      return toast.error("To'g'ri summa kiriting");
    }
    payoutMutation.mutate({
      ...payoutForm,
      amount: amountNum,
    });
  };

  const submitTerms = (e) => {
    e.preventDefault();
    termsMutation.mutate({
      salaryType: termsForm.salaryType,
      salaryShare: Number(termsForm.salaryShare) || 50,
      fixedSalary: termsForm.fixedSalary ? Number(termsForm.fixedSalary) : null,
      hourlyRate: termsForm.hourlyRate ? Number(termsForm.hourlyRate) : null,
    });
  };

  if (isLoading) {
    return <div className="p-12"><Loader /></div>;
  }

  const teacher = data?.teacher || {};
  const groups = data?.groups || [];
  const students = data?.students || [];
  const lessons = data?.lessons || [];
  const financials = data?.financials || {};
  const payouts = data?.payouts || [];

  const balance = financials.balance ?? 0;
  const totalEarned = financials.totalEarned ?? 0;
  const totalPaid = financials.totalPaid ?? 0;
  const thisMonthEarned = financials.thisMonthEarned ?? 0;
  const totalCollected = financials.totalCollected ?? 0;

  return (
    <div className="dashboard-shell max-w-6xl mx-auto space-y-5 pb-16">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-ghost btn-sm flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          <span>O'qituvchilar ro'yxatiga qaytish</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenTerms}
            className="btn-ghost btn-sm flex items-center gap-1.5"
            title="Maosh shartlarini sozlash"
          >
            <Settings2 size={14} />
            <span className="hidden sm:inline">Maosh shartlari</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenPayout(balance > 0 ? balance : undefined)}
            className="btn-primary btn-sm flex items-center gap-1.5"
          >
            <CreditCard size={14} />
            <span>Oylik to'lash</span>
          </button>
        </div>
      </div>

      {/* Teacher Hero Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel-card p-5 sm:p-6 relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl gradient-bg flex items-center justify-center text-white text-2xl sm:text-3xl font-bold flex-shrink-0 shadow-md">
              {teacher.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] truncate">
                  {teacher.name}
                </h1>
                <StatusBadge status={teacher.isActive ? 'faol' : 'nofaol'} />
                <span className="badge badge-primary text-xs font-semibold">
                  {teacher.shareLabel || '50% ulush'}
                </span>
              </div>

              <div className="text-xs text-[var(--text-secondary)] font-mono">
                @{teacher.username}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)] pt-1">
                {teacher.phone && (
                  <button
                    type="button"
                    onClick={() => copy(teacher.phone)}
                    className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors group"
                    title="Nusxalash"
                  >
                    <Phone size={13} className="text-[var(--primary)]" />
                    <span>{teacher.phone}</span>
                    <Copy size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}

                {teacher.branch && (
                  <div className="flex items-center gap-1">
                    <Building2 size={13} className="text-[var(--text-muted)]" />
                    <span>{teacher.branch.name}</span>
                  </div>
                )}

                {/* Qachon qo'shilgan */}
                <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <Calendar size={13} className="text-[var(--primary)]" />
                  <span>
                    Qo'shilgan: <strong className="font-semibold text-[var(--text-primary)]">{formatDate(teacher.createdAt)}</strong>
                    {' '}({formatRelativeTime(teacher.createdAt)})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick status toggle button */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={() => toggleMutation.mutate()}
              disabled={toggleMutation.isPending}
              className={`btn-sm border text-xs font-medium rounded-xl px-3 py-1.5 transition-all ${
                teacher.isActive
                  ? 'border-[var(--border)] text-[var(--text-secondary)] hover:border-red-500 hover:text-red-500 bg-transparent'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              <UserCheck size={13} className="inline mr-1" />
              {teacher.isActive ? 'Hisobni muzlatish / nofaol qilish' : 'Hisobni faollashtirish'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Financial KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="panel-card p-4 flex flex-col justify-between border-l-4 border-l-[var(--primary)] relative overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">O'qituvchi hisobida (Balans)</span>
              <div className="w-8 h-8 rounded-xl bg-[var(--primary-50)] text-[var(--primary)] flex items-center justify-center">
                <Wallet size={16} />
              </div>
            </div>
            <div className={`text-xl font-bold mt-2 font-mono ${balance > 0 ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>
              {formatSum(balance)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>To'lanishi kerak bo'lgan qoldiq</span>
            {balance > 0 && (
              <button
                type="button"
                onClick={() => handleOpenPayout(balance)}
                className="text-[var(--primary)] font-semibold hover:underline"
              >
                To'lash →
              </button>
            )}
          </div>
        </motion.div>

        {/* Total Earned */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="panel-card p-4 flex flex-col justify-between border-l-4 border-l-blue-500"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Jami hisoblangan maosh</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="text-xl font-bold mt-2 font-mono text-[var(--text-primary)]">
              {formatSum(totalEarned)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)]">
            O'quvchilar to'lovlaridan ulushi
          </div>
        </motion.div>

        {/* Total Paid Out */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="panel-card p-4 flex flex-col justify-between border-l-4 border-l-emerald-500"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">To'lab berilgan (Jami)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="text-xl font-bold mt-2 font-mono text-emerald-600 dark:text-emerald-400">
              {formatSum(totalPaid)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)]">
            Kassadan olingan maoshlar soni: {payouts.length} ta
          </div>
        </motion.div>

        {/* This Month's Earned / Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="panel-card p-4 flex flex-col justify-between border-l-4 border-l-purple-500"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Ushbu oygi hisob</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Coins size={16} />
              </div>
            </div>
            <div className="text-xl font-bold mt-2 font-mono text-purple-600 dark:text-purple-400">
              {formatSum(thisMonthEarned)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)]">
            Guruhlar tushumi: {formatSum(financials.thisMonthCollected || 0)}
          </div>
        </motion.div>
      </section>

      {/* Tabs Menu */}
      <div className="flex gap-2 overflow-x-auto border-b border-[var(--border)] pb-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          const count =
            t.key === 'finance'
              ? payouts.length
              : t.key === 'groups'
              ? groups.length
              : t.key === 'students'
              ? students.length
              : lessons.length;

          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[var(--primary)] text-white shadow-md'
                  : 'bg-[var(--card)] hover:bg-[var(--secondary-background)] text-[var(--text-secondary)] border border-[var(--border)]'
              }`}
            >
              <Icon size={15} />
              <span>{t.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--secondary-background)] text-[var(--text-muted)]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: FINANCE & PAYOUTS */}
      {tab === 'finance' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">O'qituvchiga to'lovlar tarixi (Payroll)</h2>
              <p className="text-xs text-[var(--text-secondary)]">Qachon qancha oylik to'langanligi va kassa hisoboti</p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenPayout(balance > 0 ? balance : undefined)}
              className="btn-primary btn-sm flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>To'lov qayd etish</span>
            </button>
          </div>

          {payouts.length === 0 ? (
            <div className="panel-card p-8 text-center">
              <Wallet size={36} className="mx-auto mb-2 text-[var(--text-muted)] opacity-40" />
              <div className="font-semibold text-sm text-[var(--text-primary)]">Hozircha to'lovlar tarixi mavjud emas</div>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                O'qituvchiga oylik maosh to'langanda "To'lov qayd etish" tugmasini bosing.
              </p>
            </div>
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>To'lov sanasi</th>
                    <th>Summa</th>
                    <th>To'lov usuli</th>
                    <th>Izoh / Tafsilot</th>
                    <th>To'lovchi</th>
                    <th className="text-right">Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p, idx) => {
                    const methodLabel = PAYMENT_METHODS.find((m) => m.value === p.method)?.label || p.method || 'Naqd';
                    return (
                      <tr key={p.id || idx}>
                        <td>
                          <div className="flex items-center gap-1.5 font-medium text-xs text-[var(--text-primary)]">
                            <Clock size={13} className="text-[var(--primary)] flex-shrink-0" />
                            <span>{formatDateTime(p.date || p.createdAt)}</span>
                          </div>
                        </td>
                        <td>
                          <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                            {formatSum(p.amount)}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-gray text-[11px] font-medium uppercase">
                            {methodLabel}
                          </span>
                        </td>
                        <td>
                          <div className="text-xs text-[var(--text-primary)] max-w-xs truncate" title={p.note || p.title}>
                            {p.note?.replace(/\[TEACHER:[^\]]+\]\s*/g, '') || p.title || 'Oylik maosh'}
                          </div>
                        </td>
                        <td>
                          <div className="text-xs text-[var(--text-secondary)]">
                            {p.createdBy?.name || "Admin/Kassa"}
                          </div>
                        </td>
                        <td className="text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <Check size={11} /> To'langan
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Groups Summary for Earnings */}
          <div className="panel-card p-5 mt-4 space-y-3">
            <h3 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Users2 size={16} className="text-[var(--primary)]" />
              Guruhlar bo'yicha tushum va o'qituvchi ulushi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--secondary-background)] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--text-primary)] truncate">{g.name}</span>
                    <span className="badge badge-primary text-[10px]">{g._count?.students || 0} o'quvchi</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border)] text-[var(--text-secondary)]">
                    <span>Oylik to'lov:</span>
                    <span className="font-mono font-semibold text-[var(--text-primary)]">{formatSum(g.monthlyFee || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>Dars vaqti:</span>
                    <span className="text-[11px] text-[var(--text-muted)] truncate">{g.lessonTime || 'Belgilanmagan'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 2: GROUPS */}
      {tab === 'groups' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {groups.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(isReception ? `/reception/groups/${g.id}` : `/manager/groups/${g.id}`)}
              className="panel-card flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow p-4"
            >
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white flex-shrink-0">
                <Users2 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-[var(--text-primary)]">{g.name}</div>
                <div className="text-xs text-[var(--text-secondary)] flex flex-wrap items-center gap-2 mt-0.5">
                  <span>{g._count?.students || 0} o'quvchi</span>
                  <span>·</span>
                  <span>{formatSum(g.monthlyFee || 0)}/oy</span>
                  {g.room && (
                    <>
                      <span>·</span>
                      <span>Xona: {g.room.name}</span>
                    </>
                  )}
                  {g.lessonTime && (
                    <>
                      <span>·</span>
                      <span>{g.lessonTime}</span>
                    </>
                  )}
                  {g.branch && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Building2 size={11} /> {g.branch.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-[var(--text-muted)] flex-shrink-0" />
            </motion.div>
          ))}
          {groups.length === 0 && (
            <EmptyState title="Guruhlar yo'q" description="Ushbu o'qituvchiga hali birorta guruh biriktirilmagan." />
          )}
        </motion.div>
      )}

      {/* TAB 3: STUDENTS */}
      {tab === 'students' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {students.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => navigate(isReception ? `/reception/students/${s.id}` : `/users/${s.id}`)}
              className="panel-card flex items-center gap-3.5 p-3.5 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="avatar avatar-md flex-shrink-0">
                {s.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-[var(--text-primary)] truncate">{s.name}</div>
                <div className="text-xs text-[var(--text-secondary)] flex flex-wrap items-center gap-2">
                  <span>@{s.username}</span>
                  {s.phone && <span>· {s.phone}</span>}
                  {s.group && <span className="badge badge-gray text-[10px]">{s.group.name}</span>}
                </div>
              </div>
              <div className="text-right text-xs">
                <span className="font-semibold text-[var(--primary)]">{s.xp || 0} XP</span>
                <div className="text-[11px] text-[var(--text-muted)]">{s.level || 1}-daraja</div>
              </div>
              <ChevronRight size={15} className="text-[var(--text-muted)] flex-shrink-0" />
            </motion.div>
          ))}
          {students.length === 0 && (
            <EmptyState title="O'quvchilar yo'q" description="Ushbu o'qituvchida hozircha o'quvchi ro'yxatdan o'tmagan." />
          )}
        </motion.div>
      )}

      {/* TAB 4: LESSONS */}
      {tab === 'lessons' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {lessons.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="panel-card flex items-center gap-3 p-3.5"
            >
              <div className="w-10 h-10 bg-[var(--primary-50)] text-[var(--primary)] rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-[var(--text-primary)] truncate">{l.title}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {l.group?.name || "Guruhsiz"} · {formatDate(l.createdAt)}
                  {l.views !== undefined && ` · ${l.views} ta ko'rish`}
                </div>
              </div>
            </motion.div>
          ))}
          {lessons.length === 0 && (
            <EmptyState title="Darslar yo'q" description="O'qituvchi tomonidan qo'shilgan darslar mavjud emas." />
          )}
        </motion.div>
      )}

      {/* MODAL 1: PAYOUT SALARY */}
      <AnimatePresence>
        {showPayoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && setShowPayoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="modal-panel max-w-md p-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CreditCard size={17} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-primary)]">O'qituvchiga to'lov qilish</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">{teacher.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="btn-icon"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={submitPayout} className="space-y-4 pt-4">
                {/* Balance Helper */}
                <div className="p-3 rounded-xl bg-[var(--secondary-background)] flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Hisobdagi to'lanmagan qoldiq:</span>
                  <span className="font-mono font-bold text-[var(--primary)]">{formatSum(balance)}</span>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="form-label">To'lov summasi (so'm) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1000"
                    required
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="Masalan: 2000000"
                    className="input-field font-mono font-semibold"
                  />
                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {balance > 0 && (
                      <button
                        type="button"
                        onClick={() => setPayoutForm((f) => ({ ...f, amount: String(balance) }))}
                        className="px-2 py-1 rounded-lg text-[11px] bg-[var(--primary-50)] text-[var(--primary)] font-semibold hover:opacity-80"
                      >
                        Qoldiq: {formatSum(balance)}
                      </button>
                    )}
                    {[500000, 1000000, 2000000, 3000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setPayoutForm((f) => ({ ...f, amount: String(amt) }))}
                        className="px-2 py-1 rounded-lg text-[11px] border border-[var(--border)] hover:bg-[var(--secondary-background)] text-[var(--text-secondary)] font-mono"
                      >
                        +{amt / 1000}k
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="form-label">To'lov usuli *</label>
                  <select
                    value={payoutForm.method}
                    onChange={(e) => setPayoutForm((f) => ({ ...f, method: e.target.value }))}
                    className="input-field"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month & Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Qaysi oy uchun</label>
                    <input
                      type="month"
                      value={payoutForm.month}
                      onChange={(e) => setPayoutForm((f) => ({ ...f, month: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="form-label">Berilgan sana</label>
                    <input
                      type="date"
                      value={payoutForm.date}
                      onChange={(e) => setPayoutForm((f) => ({ ...f, date: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="form-label">Izoh (ixtiyoriy)</label>
                  <input
                    value={payoutForm.note}
                    onChange={(e) => setPayoutForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="Masalan: Avans, to'liq oylik yoki mukofot"
                    className="input-field"
                  />
                </div>

                {/* Submit button */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(false)}
                    className="btn-ghost btn-sm"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={payoutMutation.isPending}
                    className="btn-primary btn-sm flex items-center gap-1.5"
                  >
                    {payoutMutation.isPending ? 'To\'lanmoqda...' : 'To\'lovni tasdiqlash'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: SALARY TERMS */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && setShowTermsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="modal-panel max-w-md p-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Settings2 size={17} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-primary)]">Maosh shartlarini sozlash</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">{teacher.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="btn-icon"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={submitTerms} className="space-y-4 pt-4">
                {/* Type selector */}
                <div>
                  <label className="form-label">Hisoblash usuli</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'percent', label: 'Foiz (Ulush)' },
                      { id: 'fixed', label: 'Qat\'iy (Fixed)' },
                      { id: 'hourly', label: 'Soatbay' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setTermsForm((f) => ({ ...f, salaryType: m.id }))}
                        className={`p-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                          termsForm.salaryType === m.id
                            ? 'border-[var(--primary)] bg-[var(--primary-50)] text-[var(--primary)] shadow-sm'
                            : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--secondary-background)]'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {termsForm.salaryType === 'percent' && (
                  <div>
                    <label className="form-label">O'qituvchi ulushi foizda (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={termsForm.salaryShare}
                      onChange={(e) => setTermsForm((f) => ({ ...f, salaryShare: e.target.value }))}
                      className="input-field font-mono font-bold"
                      placeholder="50"
                    />
                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      {SHARE_PRESETS.map((p) => (
                        <button
                          key={p.share}
                          type="button"
                          onClick={() => setTermsForm((f) => ({ ...f, salaryShare: p.share }))}
                          className={`p-1.5 rounded-lg text-xs border text-center transition-all ${
                            Number(termsForm.salaryShare) === p.share
                              ? 'border-[var(--primary)] bg-[var(--primary-50)] text-[var(--primary)] font-bold'
                              : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--secondary-background)]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {termsForm.salaryType === 'fixed' && (
                  <div>
                    <label className="form-label">Oylik qat'iy summa (so'm)</label>
                    <input
                      type="number"
                      min="0"
                      step="100000"
                      value={termsForm.fixedSalary}
                      onChange={(e) => setTermsForm((f) => ({ ...f, fixedSalary: e.target.value }))}
                      className="input-field font-mono font-bold"
                      placeholder="Masalan: 5000000"
                    />
                  </div>
                )}

                {termsForm.salaryType === 'hourly' && (
                  <div>
                    <label className="form-label">Bir soatlik stavka (so'm)</label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={termsForm.hourlyRate}
                      onChange={(e) => setTermsForm((f) => ({ ...f, hourlyRate: e.target.value }))}
                      className="input-field font-mono font-bold"
                      placeholder="Masalan: 100000"
                    />
                  </div>
                )}

                {/* Submit buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(false)}
                    className="btn-ghost btn-sm"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={termsMutation.isPending}
                    className="btn-primary btn-sm"
                  >
                    {termsMutation.isPending ? 'Saqlanmoqda...' : 'Shartlarni saqlash'}
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
