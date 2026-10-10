import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bot, Sparkles, Download, RefreshCw, Cpu, Layers,
  DollarSign, Activity, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import api from '../../../config/axios';
import toast from 'react-hot-toast';

export default function AIUsageTab({ selectedCenterId }) {
  const [page, setPage] = useState(1);
  const [providerFilter, setProviderFilter] = useState('');
  const [useCaseFilter, setUseCaseFilter] = useState('');

  // 1. Fetch Aggregated Statistics
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['ai-usage-stats', selectedCenterId],
    queryFn: () => api.get('/ai-usage/stats', {
      params: { ...(selectedCenterId && { centerId: selectedCenterId }) }
    }).then(r => r.data?.data || null)
  });

  // 2. Fetch Detailed Logs
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['ai-usage-logs', selectedCenterId, page, providerFilter, useCaseFilter],
    queryFn: () => api.get('/ai-usage/logs', {
      params: {
        page,
        limit: 15,
        ...(selectedCenterId && { centerId: selectedCenterId }),
        ...(providerFilter && { provider: providerFilter }),
        ...(useCaseFilter && { useCase: useCaseFilter })
      }
    }).then(r => r.data?.data || { logs: [], pagination: {} })
  });

  const summary = stats?.summary || {
    totalRequests: 0,
    tokensIn: 0,
    tokensOut: 0,
    totalTokens: 0,
    totalCostUsd: 0
  };

  const handleExportCSV = () => {
    const url = `/api/ai-usage/export${selectedCenterId ? `?centerId=${selectedCenterId}` : ''}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* ─── 1. TOP SUMMARY CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel-card p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)] font-medium">Jami Sarflangan Token</div>
              <div className="text-lg font-black text-[var(--text-primary)]">
                {summary.totalTokens?.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-[var(--text-muted)] flex justify-between">
            <span>In: {summary.tokensIn?.toLocaleString()}</span>
            <span>Out: {summary.tokensOut?.toLocaleString()}</span>
          </div>
        </div>

        <div className="panel-card p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Activity size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)] font-medium">Jami AI So'rovlar</div>
              <div className="text-lg font-black text-[var(--text-primary)]">
                {summary.totalRequests?.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-[var(--text-muted)]">
            Barcha faol sessiyalar
          </div>
        </div>

        <div className="panel-card p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)] font-medium">Taxminiy API Xarajat</div>
              <div className="text-lg font-black text-[var(--text-primary)]">
                ${summary.totalCostUsd?.toFixed(4)} USD
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-[var(--text-muted)]">
            ~{((summary.totalCostUsd || 0) * 12800).toFixed(0)} so'm
          </div>
        </div>

        <div className="panel-card p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Cpu size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)] font-medium">Asosiy Model</div>
              <div className="text-base font-bold text-[var(--text-primary)] truncate">
                Gemini Flash
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-emerald-600 font-medium">
            Yuqori tezlik & Tejamkor
          </div>
        </div>
      </div>

      {/* ─── 2. PROVIDERS & USE CASES BREAKDOWN ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Providers */}
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <h4 className="font-bold text-xs text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
            <Layers size={14} className="text-indigo-500" /> Provayderlar bo'yicha taqsimot
          </h4>
          <div className="space-y-2.5">
            {(stats?.providers || []).map((p) => {
              const pct = summary.totalTokens > 0
                ? Math.round((p.tokens / summary.totalTokens) * 100)
                : 0;
              return (
                <div key={p.provider} className="text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold capitalize">{p.provider}</span>
                    <span className="text-[var(--text-secondary)]">
                      {p.tokens?.toLocaleString()} token ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[var(--secondary-background)] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {(!stats?.providers || stats.providers.length === 0) && (
              <div className="text-center py-6 text-xs text-[var(--text-muted)]">
                Ma'lumotlar mavjud emas
              </div>
            )}
          </div>
        </div>

        {/* Use Cases */}
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <h4 className="font-bold text-xs text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
            <Bot size={14} className="text-purple-500" /> Vazifalar bo'yicha sarf (Use-cases)
          </h4>
          <div className="space-y-2.5">
            {(stats?.useCases || []).map((u) => {
              const labelMap = {
                chat: "Dars suhbati (Chattyutor)",
                test_gen: "Test yaratish",
                grading: "Vazifalarni baholash",
                lesson_gen: "Dars konspekti",
                speaking: "Nutqni tahlil qilish"
              };
              const pct = summary.totalTokens > 0
                ? Math.round((u.tokens / summary.totalTokens) * 100)
                : 0;
              return (
                <div key={u.useCase} className="text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">{labelMap[u.useCase] || u.useCase}</span>
                    <span className="text-[var(--text-secondary)]">
                      {u.tokens?.toLocaleString()} token ({u.requests} marta)
                    </span>
                  </div>
                  <div className="w-full bg-[var(--secondary-background)] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {(!stats?.useCases || stats.useCases.length === 0) && (
              <div className="text-center py-6 text-xs text-[var(--text-muted)]">
                Ma'lumotlar mavjud emas
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 3. CENTERS TOKEN USAGE COMPARISON (Super Admin view) ─── */}
      {stats?.centerSubscriptions && stats.centerSubscriptions.length > 0 && (
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <h4 className="font-bold text-xs text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" /> O'quv markazlarining joriy oy token sarfi
          </h4>
          <div className="space-y-3">
            {stats.centerSubscriptions.map(cs => {
              const limit = cs.plan?.aiMonthlyTokenLimit;
              const used = cs.currentMonthTokens || 0;
              const isUnlimited = limit === -1;
              const pct = !isUnlimited && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
              const isDanger = pct >= 90;

              return (
                <div key={cs.id} className="text-xs p-3 rounded-xl bg-[var(--secondary-background)]">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-primary)]">{cs.center?.name}</span>
                      <span className="badge badge-outline text-[10px]">{cs.plan?.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{used.toLocaleString()}</span>
                      <span className="text-[var(--text-muted)]">
                        {isUnlimited ? " / Cheksiz" : limit > 0 ? ` / ${limit.toLocaleString()} token` : ""}
                      </span>
                    </div>
                  </div>

                  {!isUnlimited && limit > 0 && (
                    <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isDanger ? 'bg-rose-500' : 'bg-indigo-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 4. DETAILED LOGS TABLE ─── */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="font-bold text-sm text-[var(--text-primary)]">Jonli AI Chaqiruvlar Tarixi</h4>
            <p className="text-xs text-[var(--text-secondary)]">Har bir generatsiya va chat so'rovining token hisobi</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { refetchStats(); refetchLogs(); }}
              className="btn-outline text-xs flex items-center gap-1"
            >
              <RefreshCw size={12} /> Yangilash
            </button>
            <button
              onClick={handleExportCSV}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Download size={13} /> CSV Eksport
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="pb-2.5 font-semibold">Vaqt</th>
                <th className="pb-2.5 font-semibold">Markaz</th>
                <th className="pb-2.5 font-semibold">Model</th>
                <th className="pb-2.5 font-semibold">Vazifa</th>
                <th className="pb-2.5 font-semibold text-right">In / Out</th>
                <th className="pb-2.5 font-semibold text-right">Jami Token</th>
                <th className="pb-2.5 font-semibold text-right">Taxminiy Narx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(logsData.logs || []).map((l) => (
                <tr key={l.id} className="hover:bg-[var(--secondary-background)] transition-colors">
                  <td className="py-2.5 text-[var(--text-muted)] whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2.5 font-medium text-[var(--text-primary)] whitespace-nowrap">
                    {l.subscription?.center?.name || "Markaz"}
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[var(--secondary-background)]">
                      {l.model}
                    </span>
                  </td>
                  <td className="py-2.5 capitalize">{l.useCase}</td>
                  <td className="py-2.5 text-right text-[var(--text-muted)] whitespace-nowrap">
                    {l.tokensIn} / {l.tokensOut}
                  </td>
                  <td className="py-2.5 text-right font-bold text-[var(--text-primary)] whitespace-nowrap">
                    {l.totalTokens?.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right font-mono text-emerald-600 font-semibold whitespace-nowrap">
                    ${l.costUsd?.toFixed(5)}
                  </td>
                </tr>
              ))}
              {(!logsData.logs || logsData.logs.length === 0) && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-[var(--text-muted)]">
                    Hozircha AI chaqiruvlari jurnali bo'sh
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
