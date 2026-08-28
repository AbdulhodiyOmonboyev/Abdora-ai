import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Users, CreditCard, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../../config/axios';
import { getSubjectLabel, getSubjectBadgeClass } from '../../utils/subjects';
import { useAuthStore } from '../../store/authStore';

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

function getMonthStr(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 7);
}

function parseMonth(str) {
  const [y, m] = str.split('-');
  return `${MONTHS[parseInt(m) - 1]} ${y}`;
}

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const month = getMonthStr(monthOffset);

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => api.get(`/groups/${id}`).then(r => {
      const data = r.data?.data || r.data || {};
      return typeof data === 'object' ? data : {};
    }),
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['group-payments', id, month],
    queryFn: () => api.get(`/payments/group/${id}?month=${month}`).then(r => {
      const data = r.data?.data || r.data || {};
      return typeof data === 'object' ? data : {};
    }),
    enabled: !!id,
  });
  const payments = Array.isArray(paymentsData?.students) ? paymentsData.students : [];

  const paymentMap = {};
  (payments || []).forEach(p => { paymentMap[p.id] = p; });

  const students = group?.students || [];

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="dashboard-shell max-w-5xl mx-auto">
      <header className="dashboard-header">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => navigate(`/${user?.role === 'manager' ? 'manager' : 'teacher'}/groups`)} className="header-button flex-shrink-0">
              <ArrowLeft size={16} /> Back
            </button>
            <span className="dashboard-badge"><Users size={12} /> Abdora AI</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center text-2xl shadow-glow flex-shrink-0">
              {group?.icon || '📚'}
            </div>
            <div className="min-w-0">
              <h1>{group?.name}</h1>
              <p>{getSubjectLabel(group?.subject)}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Payment month selector */}
      <div className="panel-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-primary" />
            <span className="font-semibold text-gray-800 dark:text-white">Oylik to'lov</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMonthOffset(o => o - 1)} className="btn-ghost p-1.5 rounded-lg">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
              {parseMonth(month)}
            </span>
            <button onClick={() => setMonthOffset(o => o + 1)} disabled={monthOffset >= 0} className="btn-ghost p-1.5 rounded-lg disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        {payments && (
          <div className="flex gap-3 mb-4">
            <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-green-600">{payments.filter(p => p.isPaid).length}</div>
              <div className="text-xs text-green-600">To'lagan</div>
            </div>
            <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-red-500">{payments.filter(p => !p.isPaid).length}</div>
              <div className="text-xs text-red-500">To'lamagan</div>
            </div>
            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-gray-600">{students.length}</div>
              <div className="text-xs text-gray-500">Jami</div>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500">
          O'quvchini pastdan tanlang — u yerda oylik to'lov, muzlatish va parolni reset qilish bir joyda ko'rinadi.
        </div>
      </div>

      {/* Student list with freeze/actions */}
      <div className="panel-card">
        <h2 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Users size={17} className="text-primary" />
          O'quvchilar ro'yxati
          <span className="badge bg-primary/10 text-primary ml-1">{students.length}</span>
        </h2>

        <div className="space-y-2">
          {students.map((s, i) => {
            const payment = paymentMap[s.id] || {};
            const isPaid = payment.isPaid;
            const paidAt = payment.payment?.paidAt ? new Date(payment.payment.paidAt).toLocaleDateString() : null;
            const isSelected = selectedStudentId === s.id;
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`rounded-xl border transition-all ${isSelected ? 'border-primary/40 bg-primary/5' : 'border-[var(--border)] dark:border-slate-800 bg-[var(--surface)] dark:bg-slate-900/40'}`}>
                <button type="button" onClick={() => setSelectedStudentId(isSelected ? null : s.id)}
                  className="w-full text-left p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0
                    ${s.isFrozen ? 'bg-blue-400' : 'gradient-bg'}`}>
                    {s.isFrozen ? '❄️' : s.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 dark:text-white">{s.name}</div>
                    <div className="text-xs text-[var(--text-muted)] dark:text-slate-400 flex flex-wrap gap-2">
                      <span>@{s.username}</span>
                      <span>Lv.{s.level}</span>
                      <span>{s.xp} XP</span>
                      {s.phone && <span>📞 {s.phone}</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 items-center text-xs">
                      <span className={`px-2 py-1 rounded-full ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {isPaid ? "To'landi" : "To'lanmadi"}
                      </span>
                      {paidAt && <span className="text-[var(--text-muted)] dark:text-slate-400">Oxirgi to'lov: {paidAt}</span>}
                    </div>
                  </div>
                </button>
                {isSelected && (
                  <div className="mt-3 rounded-3xl border border-[var(--border)] dark:border-slate-800 bg-[var(--surface)] dark:bg-slate-950/80 p-4 text-sm text-[var(--text-primary)] dark:text-slate-200 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="text-sm font-semibold text-[var(--text-primary)] dark:text-white">{s.name} haqida ma'lumot</div>
                        <div className="text-xs text-[var(--text-muted)] dark:text-slate-400">To'lov va profil holati</div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {isPaid ? "To'landi" : "To'lanmadi"}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] dark:text-slate-400">Login</div>
                        <div className="rounded-2xl border border-[var(--border)] dark:border-slate-800 bg-[var(--surface)] dark:bg-slate-900 px-3 py-2 text-[var(--text-primary)] dark:text-slate-200">@{s.username}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] dark:text-slate-400">Telefon</div>
                        <div className="rounded-2xl border border-[var(--border)] dark:border-slate-800 bg-[var(--surface)] dark:bg-slate-900 px-3 py-2 text-[var(--text-primary)] dark:text-slate-200">{s.phone || "Noma'lum"}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] dark:text-slate-400">Daraja</div>
                        <div className="rounded-2xl border border-[var(--border)] dark:border-slate-800 bg-[var(--surface)] dark:bg-slate-900 px-3 py-2 text-[var(--text-primary)] dark:text-slate-200">Lv.{s.level}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] dark:text-slate-400">XP</div>
                        <div className="rounded-2xl border border-[var(--border)] dark:border-slate-800 bg-[var(--surface)] dark:bg-slate-900 px-3 py-2 text-[var(--text-primary)] dark:text-slate-200">{s.xp} XP</div>
                      </div>
                    </div>
                    {paidAt && (
                      <div className="mt-4 rounded-2xl border border-[var(--border)] dark:border-slate-800 bg-[var(--surface)] dark:bg-slate-900 px-3 py-2 text-xs text-[var(--text-muted)] dark:text-slate-400">
                        Oxirgi to'lov: {paidAt}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
          {students.length === 0 && (
            <div className="text-center py-10 text-[var(--text-muted)] dark:text-slate-400">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Hali o'quvchilar yo'q. Birinchi o'quvchini qo'shing!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
