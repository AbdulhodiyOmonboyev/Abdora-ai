import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Smartphone, Send, Settings, CheckCircle2, XCircle,
  Clock, DollarSign, RefreshCw, Key, ShieldCheck, ChevronLeft, ChevronRight, FileText
} from 'lucide-react';
import api from '../../../config/axios';
import toast from 'react-hot-toast';
import PhoneInput from '../../../components/ui/PhoneInput';
import { cleanPhone } from '../../../utils/formatPhone';

export default function SMSMonitorTab({ selectedCenterId }) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [testPhone, setTestPhone] = useState('+998 ');
  const [testMessage, setTestMessage] = useState('Salom, bu Abdora AI SMS tizimidan sinov xabari.');

  // SMS Provider config state
  const [smsProvider, setSmsProvider] = useState('platform');
  const [smsApiKey, setSmsApiKey] = useState('');
  const [smsSenderName, setSmsSenderName] = useState('Abdora');

  // Templates state
  const [templates, setTemplates] = useState({
    attendance_missed: "Hurmatli ota-ona! Farzandingiz {studentName} bugun {groupName} guruhidagi darsga qatnashmadi.",
    payment_reminder: "Hurmatli {parentName}! Farzandingiz {studentName} ning oylik to'lovi muddati yaqinlashmoqda.",
    subscription_due: "Diqqat: O'quv markazingiz Abdora SaaS obuna to'lovi muddati {daysLeft} kun qoldi."
  });

  // 1. Fetch SMS Stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['sms-stats', selectedCenterId],
    queryFn: () => api.get('/sms/stats', {
      params: { ...(selectedCenterId && { centerId: selectedCenterId }) }
    }).then(r => r.data?.data || null)
  });

  // 2. Fetch SMS Logs
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['sms-logs', selectedCenterId, page],
    queryFn: () => api.get('/sms/logs', {
      params: {
        page,
        limit: 15,
        ...(selectedCenterId && { centerId: selectedCenterId })
      }
    }).then(r => r.data?.data || { logs: [], pagination: {} })
  });

  // 3. Fetch SMS Templates
  const { data: loadedTemplates } = useQuery({
    queryKey: ['sms-templates', selectedCenterId],
    queryFn: () => api.get('/sms/templates', {
      params: { ...(selectedCenterId && { centerId: selectedCenterId }) }
    }).then(r => {
      if (r.data?.data) {
        setTemplates(r.data.data);
      }
      return r.data?.data;
    })
  });

  // Send Test SMS mutation
  const sendTestMutation = useMutation({
    mutationFn: (d) => api.post('/sms/send', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sms-stats', selectedCenterId] });
      qc.invalidateQueries({ queryKey: ['sms-logs', selectedCenterId] });
      toast.success("Sinov SMS muvaffaqiyatli yuborildi");
    },
    onError: (err) => toast.error(err.response?.data?.message || "SMS yuborishda xatolik yuz berdi")
  });

  // Save BYOS settings mutation
  const saveByosMutation = useMutation({
    mutationFn: (d) => api.post(`/subscriptions/${selectedCenterId || ''}/byos`, d),
    onSuccess: () => {
      toast.success("SMS provayder sozlamalari saqlandi");
      setSmsApiKey('');
    },
    onError: (err) => toast.error(err.response?.data?.message || "Xatolik yuz berdi")
  });

  // Save Templates mutation
  const saveTemplatesMutation = useMutation({
    mutationFn: (d) => api.put('/sms/templates', { centerId: selectedCenterId, templates: d }),
    onSuccess: () => toast.success("SMS shablonlari yangilandi"),
    onError: (err) => toast.error(err.response?.data?.message || "Xatolik yuz berdi")
  });

  const handleSendTest = () => {
    const raw = cleanPhone(testPhone);
    if (!raw) return toast.error("Telefon raqam kiritilishi shart");
    if (!testMessage.trim()) return toast.error("Xabar matni kiritilishi shart");

    sendTestMutation.mutate({
      centerId: selectedCenterId,
      toPhone: raw,
      message: testMessage,
      trigger: 'test'
    });
  };

  return (
    <div className="space-y-6">
      {/* ─── 1. SMS TOP STATS CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel-card p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Smartphone size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)] font-medium">Jami Yuborilgan SMS</div>
              <div className="text-lg font-black text-[var(--text-primary)]">
                {stats?.total?.toLocaleString() || 0}
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-[var(--text-muted)]">
            Barcha xabarnomalar
          </div>
        </div>

        <div className="panel-card p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)] font-medium">Yetkazildi (Sent)</div>
              <div className="text-lg font-black text-emerald-600">
                {stats?.sent?.toLocaleString() || 0}
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-[var(--text-muted)]">
            Muvaffaqiyatli jo'natildi
          </div>
        </div>

        <div className="panel-card p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <XCircle size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)] font-medium">Yetkazilmadi (Failed)</div>
              <div className="text-lg font-black text-rose-500">
                {stats?.failed?.toLocaleString() || 0}
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-[var(--text-muted)]">
            Noto'g'ri raqam yoki limit
          </div>
        </div>

        <div className="panel-card p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)] font-medium">Jami Sarflangan Summa</div>
              <div className="text-lg font-black text-[var(--text-primary)]">
                {stats?.totalCostUzs?.toLocaleString() || 0} so'm
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-[var(--text-muted)]">
            O'rtacha 85-110 so'm / SMS
          </div>
        </div>
      </div>

      {/* ─── 2. PROVIDER CONFIG & TEST SMS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* SMS Provider Settings */}
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Settings size={16} className="text-indigo-500" /> SMS Provayder Sozlamalari
          </h4>
          <p className="text-xs text-[var(--text-secondary)]">
            Markaz Abdora shartnomasidagi platforma SMS xizmatidan yoki o'z shaxsiy API kalitidan (BYOS) foydalanishi mumkin:
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-medium block mb-1">Xizmat turi</label>
              <select
                className="input-field"
                value={smsProvider}
                onChange={e => setSmsProvider(e.target.value)}
              >
                <option value="platform">Abdora Platformasi (Eskiz / Playmobile orqali avtomatik)</option>
                <option value="byos">Shaxsiy SMS Shartnomasi (BYOS - o'z API kalitini kiritish)</option>
              </select>
            </div>

            {smsProvider === 'byos' && (
              <>
                <div>
                  <label className="font-medium block mb-1">Shaxsiy SMS API Kaliti (AES-256 shifrlanadi)</label>
                  <div className="relative">
                    <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="password"
                      className="input-field pl-8 font-mono"
                      placeholder="Eskiz token yoki Playmobile login:parol..."
                      value={smsApiKey}
                      onChange={e => setSmsApiKey(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="font-medium block mb-1">Sender ID (Yuboruvchi nomi)</label>
                  <input
                    className="input-field"
                    placeholder="Masalan: NajotTalim yoki 4546"
                    value={smsSenderName}
                    onChange={e => setSmsSenderName(e.target.value)}
                  />
                </div>
              </>
            )}

            <button
              onClick={() => saveByosMutation.mutate({
                provider: smsProvider,
                apiKey: smsApiKey,
                senderName: smsSenderName
              })}
              disabled={saveByosMutation.isPending}
              className="btn-primary text-xs w-full mt-2"
            >
              {saveByosMutation.isPending ? "Saqlanmoqda..." : "Provayder sozlamalarini saqlash"}
            </button>
          </div>
        </div>

        {/* Test SMS Sender */}
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Send size={16} className="text-emerald-500" /> Sinov (Test) SMS Yuborish
          </h4>
          <p className="text-xs text-[var(--text-secondary)]">
            SMS ulanishini tekshirish uchun istalgan telefon raqamga sinov xabarini yuboring:
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-medium block mb-1">Qabul qiluvchi telefon raqami *</label>
              <PhoneInput
                value={testPhone}
                onChange={setTestPhone}
                className="input-field font-mono"
                placeholder="+998 90 123 45 67"
              />
            </div>

            <div>
              <label className="font-medium block mb-1">Xabar matni *</label>
              <textarea
                className="input-field h-20"
                value={testMessage}
                onChange={e => setTestMessage(e.target.value)}
                placeholder="Sinov xabari matni..."
              />
            </div>

            <button
              onClick={handleSendTest}
              disabled={sendTestMutation.isPending}
              className="btn-primary text-xs w-full flex items-center justify-center gap-1.5"
            >
              <Send size={13} /> {sendTestMutation.isPending ? "Yuborilmoqda..." : "Sinov SMS yuborish"}
            </button>
          </div>
        </div>
      </div>

      {/* ─── 3. SMS TEMPLATES CONFIG ─── */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <FileText size={16} className="text-purple-500" /> SMS Shablonlari
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">
              Avtomatik hodisalarda ota-onalar va xodimlarga yuboriladigan SMS matnlari:
            </p>
          </div>
          <button
            onClick={() => saveTemplatesMutation.mutate(templates)}
            disabled={saveTemplatesMutation.isPending}
            className="btn-primary text-xs"
          >
            {saveTemplatesMutation.isPending ? "Saqlanmoqda..." : "Shablonlarni saqlash"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold block mb-1">Davomat qoldirilganda (Ota-onaga)</label>
            <textarea
              className="input-field h-24"
              value={templates.attendance_missed}
              onChange={e => setTemplates(t => ({ ...t, attendance_missed: e.target.value }))}
            />
            <span className="text-[10px] text-[var(--text-muted)] block mt-1">Teglar: {`{studentName}, {groupName}`}</span>
          </div>

          <div>
            <label className="font-semibold block mb-1">Oylik to'lov eslatmasi (Ota-onaga)</label>
            <textarea
              className="input-field h-24"
              value={templates.payment_reminder}
              onChange={e => setTemplates(t => ({ ...t, payment_reminder: e.target.value }))}
            />
            <span className="text-[10px] text-[var(--text-muted)] block mt-1">Teglar: {`{parentName}, {studentName}`}</span>
          </div>

          <div>
            <label className="font-semibold block mb-1">Obuna to'lovi eslatmasi (Managerga)</label>
            <textarea
              className="input-field h-24"
              value={templates.subscription_due}
              onChange={e => setTemplates(t => ({ ...t, subscription_due: e.target.value }))}
            />
            <span className="text-[10px] text-[var(--text-muted)] block mt-1">Teglar: {`{daysLeft}, {centerName}`}</span>
          </div>
        </div>
      </div>

      {/* ─── 4. SMS LOGS TABLE ─── */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-sm text-[var(--text-primary)]">SMS Yuborish Jurnali</h4>
            <p className="text-xs text-[var(--text-secondary)]">Oxirgi yuborilgan barcha SMS xabarnomalar</p>
          </div>
          <button
            onClick={() => { refetchStats(); refetchLogs(); }}
            className="btn-outline text-xs flex items-center gap-1"
          >
            <RefreshCw size={12} /> Yangilash
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="pb-2.5 font-semibold">Vaqt</th>
                <th className="pb-2.5 font-semibold">Qabul qiluvchi</th>
                <th className="pb-2.5 font-semibold">Turi</th>
                <th className="pb-2.5 font-semibold">Trigger</th>
                <th className="pb-2.5 font-semibold">Xabar matni</th>
                <th className="pb-2.5 font-semibold">Status</th>
                <th className="pb-2.5 font-semibold text-right">Narxi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(logsData.logs || []).map((l) => (
                <tr key={l.id} className="hover:bg-[var(--secondary-background)] transition-colors">
                  <td className="py-2.5 text-[var(--text-muted)] whitespace-nowrap">
                    {new Date(l.sentAt || l.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 font-mono font-medium text-[var(--text-primary)] whitespace-nowrap">
                    {l.toPhone}
                  </td>
                  <td className="py-2.5 capitalize">{l.recipientType}</td>
                  <td className="py-2.5">
                    <span className="badge badge-outline text-[10px]">
                      {l.trigger}
                    </span>
                  </td>
                  <td className="py-2.5 max-w-[240px] truncate text-[var(--text-secondary)]" title={l.messageText}>
                    {l.messageText}
                  </td>
                  <td className="py-2.5">
                    {l.status === 'sent' ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Yetkazildi
                      </span>
                    ) : (
                      <span className="text-rose-500 font-semibold flex items-center gap-1" title={l.errorMessage}>
                        <XCircle size={12} /> Xato
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-[var(--text-primary)] whitespace-nowrap">
                    {l.cost ? `${l.cost} so'm` : '0'}
                  </td>
                </tr>
              ))}
              {(!logsData.logs || logsData.logs.length === 0) && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-[var(--text-muted)]">
                    Hozircha SMS xabarnomalar jurnali bo'sh
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logsData.pagination?.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] mt-2">
            <span className="text-xs text-[var(--text-muted)]">
              Sahifa {logsData.pagination.page} / {logsData.pagination.totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="btn-outline p-1.5 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page >= logsData.pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="btn-outline p-1.5 rounded-lg disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
