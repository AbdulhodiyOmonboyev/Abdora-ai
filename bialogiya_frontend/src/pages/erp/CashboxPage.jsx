import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
  Calendar, Filter, Plus, Check, RefreshCw, AlertCircle,
  Banknote, Smartphone, CreditCard, Building2,
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';

const METHOD_CONFIG = {
  cash:  { label: 'Naqd pul', icon: Banknote,   color: '#10B981', bg: '#ECFDF5' },
  click: { label: 'Click',    icon: Smartphone, color: '#3B82F6', bg: '#EFF6FF' },
  payme: { label: 'Payme',    icon: CreditCard, color: '#8B5CF6', bg: '#F5F3FF' },
  bank:  { label: 'Bank',     icon: Building2,  color: '#F59E0B', bg: '#FFFBEB' },
  other: { label: 'Boshqa',   icon: Wallet,     color: '#64748B', bg: '#F8FAFC' },
};

const TX_TYPES = [
  { value: 'income',  label: 'Kirim',  icon: ArrowUpRight,   color: '#10B981' },
  { value: 'expense', label: 'Chiqim', icon: ArrowDownLeft,  color: '#EF4444' },
];

function formatSum(n) {
  return Number(n || 0).toLocaleString('uz-UZ') + ' so\'m';
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthOptions() {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });
}

function BalanceCard({ method, balance, income, expense }) {
  const cfg = METHOD_CONFIG[method] || METHOD_CONFIG.other;
  const Icon = cfg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel-card"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            <Icon size={18} />
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{cfg.label}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Kassa</div>
          </div>
        </div>
      </div>
      <div className="text-2xl font-bold mb-3" style={{ color: cfg.color }}>
        {formatSum(balance)}
      </div>
      <div className="flex gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex-1">
          <div className="flex items-center gap-1 text-xs mb-0.5" style={{ color: '#10B981' }}>
            <TrendingUp size={10} /> Kirim
          </div>
          <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatSum(income)}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1 text-xs mb-0.5" style={{ color: '#EF4444' }}>
            <TrendingDown size={10} /> Chiqim
          </div>
          <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatSum(expense)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const emptyTx = () => ({
  type: 'income',
  method: 'cash',
  amount: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
});

export default function CashboxPage() {
  const qc = useQueryClient();
  const [month, setMonth] = useState(currentMonth());
  const [filterMethod, setFilterMethod] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyTx());

  const { data: cashData, isLoading } = useQuery({
    queryKey: ['cashbox', month, filterMethod, filterType],
    queryFn: () => api.get('/finance/cashbox', {
      params: { month, method: filterMethod || undefined, type: filterType || undefined }
    }).then(r => r.data?.data).catch(() => null),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['cashbox'] });

  const addTxMutation = useMutation({
    mutationFn: (d) => api.post('/finance/cashbox/transaction', d),
    onSuccess: () => { invalidate(); toast.success('Tranzaksiya qo\'shildi'); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const closeModal = () => { setModalOpen(false); setForm(emptyTx()); };
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const balances = cashData?.balances || {};
  const transactions = cashData?.transactions || [];
  const totalBalance = Object.values(balances).reduce((s, b) => s + (b?.balance || 0), 0);

  return (
    <div className="dashboard-shell max-w-5xl">
      <PageHeader
        title="Kassa va Hisob Qoldiqlari"
        subtitle="To'lov usullari bo'yicha balanslar va tranzaksiyalar"
        actions={
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={15} /> Kirim/Chiqim
          </button>
        }
      />

      {/* Total balance hero */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-6 rounded-2xl text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white' }}
      >
        <div className="text-sm font-medium opacity-80 mb-1">Umumiy kassa qoldig'i</div>
        <div className="text-4xl font-bold mb-1">
          {isLoading ? '...' : formatSum(totalBalance)}
        </div>
        <div className="text-xs opacity-70">{new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' })}</div>
      </motion.div>

      {/* Balance cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {Object.keys(METHOD_CONFIG).map(k => (
            <div key={k} className="panel-card h-32"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-7 w-28" /></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {Object.entries(METHOD_CONFIG).map(([method]) => (
            <BalanceCard
              key={method}
              method={method}
              balance={balances[method]?.balance || 0}
              income={balances[method]?.income || 0}
              expense={balances[method]?.expense || 0}
            />
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-4 rounded-2xl"
        style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />

        <select value={month} onChange={e => setMonth(e.target.value)} className="input-field w-auto text-sm">
          {monthOptions().map(m => (
            <option key={m} value={m}>
              {new Date(m + '-01').toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' })}
            </option>
          ))}
        </select>

        <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className="input-field w-auto text-sm">
          <option value="">Barcha usullar</option>
          {Object.entries(METHOD_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field w-auto text-sm">
          <option value="">Hammasi</option>
          <option value="income">Kirim</option>
          <option value="expense">Chiqim</option>
        </select>
      </div>

      {/* Transactions list */}
      <div className="space-y-2">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="panel-card flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
              <Skeleton className="h-5 w-24" />
            </div>
          ))
        ) : transactions.length === 0 ? (
          <div className="panel-card text-center py-10">
            <CreditCard size={36} className="mx-auto mb-2 text-gray-400" />
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Bu oy tranzaksiyalar yo'q</div>
          </div>
        ) : (
          transactions.map((tx, i) => {
            const mc = METHOD_CONFIG[tx.method] || METHOD_CONFIG.other;
            const Icon = mc.icon;
            const isIncome = tx.type === 'income';
            return (
              <motion.div
                key={tx.id || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="panel-card flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: mc.bg, color: mc.color }}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {tx.description || (isIncome ? 'Kirim' : 'Chiqim')}
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    <span>{mc.label}</span>
                    <span>·</span>
                    <span>{new Date(tx.date || tx.createdAt).toLocaleDateString('uz-UZ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-sm flex-shrink-0"
                  style={{ color: isIncome ? '#10B981' : '#EF4444' }}>
                  {isIncome ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {isIncome ? '+' : '-'}{formatSum(tx.amount)}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Transaction Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Kirim / Chiqim qo'shish"
        size="sm"
        footer={
          <>
            <button onClick={closeModal} className="btn-ghost">Bekor</button>
            <button
              onClick={() => addTxMutation.mutate(form)}
              disabled={addTxMutation.isPending || !form.amount || !form.description.trim()}
              className="btn-primary"
            >
              {addTxMutation.isPending ? <><RefreshCw size={14} className="animate-spin" />...</> : <><Check size={14} />Qo'shish</>}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Type toggle */}
          <div>
            <label className="form-label">Tur</label>
            <div className="grid grid-cols-2 gap-2">
              {TX_TYPES.map(({ value, label, icon: Icon, color }) => (
                <button key={value} type="button" onClick={() => setF('type', value)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${
                    form.type === value ? 'border-transparent text-white' : 'border-[var(--border)]'
                  }`}
                  style={form.type === value ? { background: color, color: 'white' } : { color: 'var(--text-secondary)' }}>
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">To'lov usuli</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(METHOD_CONFIG).map(([k, v]) => {
                const Icon = v.icon;
                return (
                  <button key={k} type="button" onClick={() => setF('method', k)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      form.method === k ? 'border-[var(--primary)] bg-[var(--primary-50)] text-[var(--primary)]' : 'border-[var(--border)] text-[var(--text-secondary)]'
                    }`}>
                    <Icon size={18} style={{ color: form.method === k ? 'var(--primary)' : v.color }} />
                    <span>{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="form-label">Summa (so'm) *</label>
            <input type="number" min={0} value={form.amount}
              onChange={e => setF('amount', e.target.value)}
              className="input-field" placeholder="100 000" />
          </div>

          <div>
            <label className="form-label">Izoh *</label>
            <input value={form.description} onChange={e => setF('description', e.target.value)}
              className="input-field" placeholder="Oylik to'lov, xarajat nomi..." />
          </div>

          <div>
            <label className="form-label">Sana</label>
            <input type="date" value={form.date} onChange={e => setF('date', e.target.value)}
              className="input-field" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
