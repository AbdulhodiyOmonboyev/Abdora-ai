import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Plus, Trash2, Eye, EyeOff, Check, X, RefreshCw,
  Sparkles, Key, Cpu, ShieldCheck, ChevronDown, AlertCircle,
  ExternalLink, Copy, Settings2,
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import { RowSkeleton } from '../../components/ui/Skeleton';

/* ─── Available AI Providers ─────────────────────────────────── */
const PROVIDERS = [
  {
    key: 'gemini',
    name: 'Google Gemini',
    icon: '✨',
    color: '#4285F4',
    bg: '#EBF3FF',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    description: 'Gemini 2.5 Flash, Pro, TTS, Live modellar',
    models: [
      { id: 'gemini-2.5-flash',   label: 'Gemini 2.5 Flash',   use: 'Asosiy AI (tez)',   recommended: true },
      { id: 'gemini-2.5-pro',     label: 'Gemini 2.5 Pro',     use: 'Murakkab topshiriqlar' },
      { id: 'gemini-2.0-flash',   label: 'Gemini 2.0 Flash',   use: 'Tez generatsiya' },
      { id: 'gemini-tts',         label: 'Gemini TTS',          use: 'Ovozli dars (Audio)' },
      { id: 'gemini-live',        label: 'Gemini Live',         use: 'Speaking practice' },
    ],
  },
  {
    key: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    color: '#10A37F',
    bg: '#F0FFF8',
    docsUrl: 'https://platform.openai.com/api-keys',
    description: 'GPT-4o, GPT-4 Turbo, DALL-E 3, Whisper',
    models: [
      { id: 'gpt-4o',             label: 'GPT-4o',              use: 'Asosiy AI', recommended: true },
      { id: 'gpt-4-turbo',        label: 'GPT-4 Turbo',         use: 'Katta kontekst' },
      { id: 'gpt-3.5-turbo',      label: 'GPT-3.5 Turbo',       use: 'Tez va arzon' },
      { id: 'dall-e-3',           label: 'DALL·E 3',            use: 'Rasm generatsiyasi' },
      { id: 'whisper-1',          label: 'Whisper',             use: 'Audio transkripsiya' },
      { id: 'tts-1',              label: 'TTS-1',               use: 'Matndan ovoz' },
    ],
  },
  {
    key: 'anthropic',
    name: 'Anthropic Claude',
    icon: '🧠',
    color: '#CC9B6D',
    bg: '#FFF9F2',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Claude 3.5 Sonnet, Haiku, Opus',
    models: [
      { id: 'claude-3-5-sonnet',  label: 'Claude 3.5 Sonnet',  use: 'Asosiy AI', recommended: true },
      { id: 'claude-3-5-haiku',   label: 'Claude 3.5 Haiku',   use: 'Tez va arzon' },
      { id: 'claude-3-opus',      label: 'Claude 3 Opus',       use: 'Eng kuchli' },
    ],
  },
  {
    key: 'custom',
    name: 'Custom / Boshqa',
    icon: '🔧',
    color: '#7C3AED',
    bg: '#F5F0FF',
    docsUrl: null,
    description: 'OpenAI API-compatible endpoint (Ollama, Together, Groq...)',
    models: [],
  },
];

/* ─── Empty form ─────────────────────────────────────────────── */
const emptyAgent = () => ({
  name: '',
  provider: 'gemini',
  apiKey: '',
  baseUrl: '',
  isActive: true,
  enabledModels: [],
  usedFor: [],
  notes: '',
});

const USE_CASES = [
  { key: 'lesson_generation',  label: 'Dars generatsiyasi' },
  { key: 'test_generation',    label: 'Test yaratish' },
  { key: 'grading',            label: 'AI baholash' },
  { key: 'speaking',           label: 'Speaking practice' },
  { key: 'tts',                label: 'TTS / Audio' },
  { key: 'finance_advice',     label: 'Moliyaviy maslahat' },
  { key: 'chat',               label: 'AI Chat' },
];

/* ─── AgentCard ─────────────────────────────────────────────── */
function AgentCard({ agent, onEdit, onDelete, onToggle }) {
  const provider = PROVIDERS.find(p => p.key === agent.provider) || PROVIDERS[PROVIDERS.length - 1];
  const [showKey, setShowKey] = useState(false);
  const maskedKey = agent.apiKey
    ? agent.apiKey.slice(0, 6) + '•'.repeat(Math.min(24, agent.apiKey.length - 6)) + agent.apiKey.slice(-4)
    : '—';

  const copyKey = () => {
    navigator.clipboard.writeText(agent.apiKey || '');
    toast.success('API kalit nusxalandi');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="panel-card"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: provider.bg, border: `1px solid ${provider.color}22` }}>
            {provider.icon}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
              {agent.name}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {provider.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ToggleSwitch size="sm" checked={agent.isActive} onChange={() => onToggle(agent)} />
          <button className="btn-icon" onClick={() => onEdit(agent)} title="Tahrirlash">
            <Settings2 size={15} />
          </button>
          <button className="btn-icon" onClick={() => onDelete(agent)} title="O'chirish"
            style={{ color: 'var(--error)' }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* API Key */}
      <div className="mb-3 p-3 rounded-xl flex items-center gap-2"
        style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
        <Key size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <code className="flex-1 text-xs truncate font-mono" style={{ color: 'var(--text-secondary)' }}>
          {showKey ? (agent.apiKey || '—') : maskedKey}
        </code>
        <button className="btn-icon" onClick={() => setShowKey(s => !s)}>
          {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
        {agent.apiKey && (
          <button className="btn-icon" onClick={copyKey}>
            <Copy size={13} />
          </button>
        )}
      </div>

      {/* Enabled models */}
      {agent.enabledModels?.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
            <Cpu size={11} className="inline mr-1" />
            Yoqilgan modellar
          </div>
          <div className="flex flex-wrap gap-1.5">
            {agent.enabledModels.map(m => (
              <span key={m} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: provider.bg, color: provider.color, border: `1px solid ${provider.color}33` }}>
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Use cases */}
      {agent.usedFor?.length > 0 && (
        <div>
          <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
            <Sparkles size={11} className="inline mr-1" />
            Qo'llaniladi
          </div>
          <div className="flex flex-wrap gap-1.5">
            {agent.usedFor.map(u => {
              const uc = USE_CASES.find(x => x.key === u);
              return (
                <span key={u} className="px-2 py-0.5 rounded-full text-[10px] font-medium border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  {uc?.label || u}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Inactive warning */}
      {!agent.isActive && (
        <div className="mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
          style={{ background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning-border)' }}>
          <AlertCircle size={12} />
          Bu agent hozir o'chirilgan — funksiyalar ishlashini to'xtatishi mumkin
        </div>
      )}
    </motion.div>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function AdminAIAgents() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [form, setForm] = useState(emptyAgent());
  const [showKey, setShowKey] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: () => api.get('/admin/ai-agents').then(r => r.data?.data || []),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['ai-agents'] });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/admin/ai-agents', d),
    onSuccess: () => { invalidate(); toast.success('AI agent qo\'shildi'); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/ai-agents/${id}`, data),
    onSuccess: () => { invalidate(); toast.success('Agent yangilandi'); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/ai-agents/${id}`),
    onSuccess: () => { invalidate(); toast.success('Agent o\'chirildi'); setDeleteConfirm(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => api.put(`/admin/ai-agents/${id}`, { isActive: !isActive }),
    onSuccess: () => invalidate(),
  });

  const openCreate = () => { setForm(emptyAgent()); setEditingAgent(null); setShowKey(false); setModalOpen(true); };
  const openEdit = (agent) => { setForm({ ...agent }); setEditingAgent(agent); setShowKey(false); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingAgent(null); };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error('Agent nomi kiritilmagan');
    if (!form.apiKey.trim()) return toast.error('API kalit kiritilmagan');
    if (editingAgent) {
      updateMutation.mutate({ id: editingAgent.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleModel = (modelId) => {
    const arr = form.enabledModels || [];
    setF('enabledModels', arr.includes(modelId) ? arr.filter(m => m !== modelId) : [...arr, modelId]);
  };

  const toggleUseCase = (key) => {
    const arr = form.usedFor || [];
    setF('usedFor', arr.includes(key) ? arr.filter(k => k !== key) : [...arr, key]);
  };

  const currentProvider = PROVIDERS.find(p => p.key === form.provider) || PROVIDERS[0];
  const isPending = createMutation.isPending || updateMutation.isPending;

  const activeCount = agents.filter(a => a.isActive).length;

  return (
    <div className="dashboard-shell max-w-5xl">
      <PageHeader
        title="AI Agentlar"
        subtitle="Tizimda ishlatiladigan AI provayderlar va modellarni boshqarish"
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={15} /> Yangi agent
          </button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Jami agentlar', value: agents.length, icon: Bot, color: 'var(--primary)' },
          { label: 'Faol agentlar', value: activeCount, icon: ShieldCheck, color: 'var(--success)' },
          { label: 'O\'chirilgan', value: agents.length - activeCount, icon: AlertCircle, color: 'var(--warning)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="panel-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: color + '15' }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Provider docs links */}
      <div className="mb-5 flex flex-wrap gap-2">
        {PROVIDERS.filter(p => p.docsUrl).map(p => (
          <a key={p.key} href={p.docsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
            style={{ background: p.bg, color: p.color, border: `1px solid ${p.color}33` }}>
            <span>{p.icon}</span>
            {p.name} API kaliti olish
            <ExternalLink size={11} />
          </a>
        ))}
      </div>

      {/* Agents grid */}
      {isLoading ? (
        <div className="space-y-3"><RowSkeleton count={3} /></div>
      ) : agents.length === 0 ? (
        <div className="panel-card text-center py-16">
          <div className="text-4xl mb-3">🤖</div>
          <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Hali AI agent qo'shilmagan
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            AI funksiyalardan foydalanish uchun kamida bitta agent qo'shing
          </p>
          <button onClick={openCreate} className="btn-primary">
            <Plus size={15} /> Birinchi agentni qo'shish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {agents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={openEdit}
                onDelete={(a) => setDeleteConfirm(a)}
                onToggle={(a) => toggleMutation.mutate({ id: a.id, isActive: a.isActive })}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Create/Edit Modal ── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingAgent ? 'Agentni tahrirlash' : 'Yangi AI agent qo\'shish'}
        subtitle="API kalit va model sozlamalarini kiriting"
        size="lg"
        footer={
          <>
            <button onClick={closeModal} className="btn-ghost">Bekor qilish</button>
            <button onClick={handleSubmit} disabled={isPending} className="btn-primary">
              {isPending ? <><RefreshCw size={14} className="animate-spin" />Saqlanmoqda...</> : <><Check size={14} />Saqlash</>}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Agent name */}
          <div>
            <label className="form-label">Agent nomi *</label>
            <input
              value={form.name}
              onChange={e => setF('name', e.target.value)}
              className="input-field"
              placeholder="Masalan: Asosiy Gemini, OpenAI Backup..."
            />
          </div>

          {/* Provider selection */}
          <div>
            <label className="form-label">AI provayder *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROVIDERS.map(p => {
                const active = form.provider === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => { setF('provider', p.key); setF('enabledModels', []); }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      active ? 'border-[var(--primary)]' : 'border-[var(--border)] hover:border-[var(--primary)]/40'
                    }`}
                  >
                    <div className="text-xl mb-1">{p.icon}</div>
                    <div className="text-xs font-medium" style={{ color: active ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {p.name}
                    </div>
                  </button>
                );
              })}
            </div>
            {currentProvider.description && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                {currentProvider.description}
              </p>
            )}
          </div>

          {/* API Key */}
          <div>
            <label className="form-label">API Kalit (Token) *</label>
            <div className="relative">
              <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type={showKey ? 'text' : 'password'}
                value={form.apiKey}
                onChange={e => setF('apiKey', e.target.value)}
                className="input-field pl-9 pr-10 font-mono text-sm"
                placeholder={
                  form.provider === 'gemini' ? 'AIza...' :
                  form.provider === 'openai' ? 'sk-...' :
                  form.provider === 'anthropic' ? 'sk-ant-...' : 'API kalit...'
                }
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon"
                onClick={() => setShowKey(s => !s)}>
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {currentProvider.docsUrl && (
              <a href={currentProvider.docsUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 mt-1.5 hover:underline"
                style={{ color: 'var(--primary)' }}>
                <ExternalLink size={11} /> {currentProvider.name} da API kalit olish
              </a>
            )}
          </div>

          {/* Custom base URL */}
          {form.provider === 'custom' && (
            <div>
              <label className="form-label">Base URL</label>
              <input
                value={form.baseUrl}
                onChange={e => setF('baseUrl', e.target.value)}
                className="input-field font-mono text-sm"
                placeholder="https://api.together.xyz/v1"
              />
              <p className="form-hint">OpenAI-compatible endpoint manzili</p>
            </div>
          )}

          {/* Enabled models */}
          {currentProvider.models.length > 0 && (
            <div>
              <label className="form-label">Yoqilgan modellar</label>
              <p className="form-hint mb-2">Bu markaz ishlatishi mumkin bo'lgan modellar</p>
              <div className="space-y-2">
                {currentProvider.models.map(m => {
                  const enabled = (form.enabledModels || []).includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleModel(m.id)}
                      className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border transition-all text-left ${
                        enabled ? 'border-[var(--primary)] bg-[var(--primary-50)]' : 'border-[var(--border)] hover:border-[var(--primary)]/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: enabled ? 'var(--primary)' : 'var(--text-primary)' }}>
                            {m.label}
                          </span>
                          {m.recommended && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{ background: 'var(--primary)', color: 'white' }}>
                              Tavsiya
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.use}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        enabled ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-[var(--border)]'
                      }`}>
                        {enabled && <Check size={11} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Use cases */}
          <div>
            <label className="form-label">Qo'llanish sohalari</label>
            <p className="form-hint mb-2">Bu agent qaysi funksiyalar uchun ishlatilsin</p>
            <div className="flex flex-wrap gap-2">
              {USE_CASES.map(({ key, label }) => {
                const on = (form.usedFor || []).includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleUseCase(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      on ? 'text-white border-transparent' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/50'
                    }`}
                    style={on ? { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' } : {}}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Agentni faollashtirish</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>O'chirilgan agent hech qayerda ishlatilmaydi</div>
            </div>
            <ToggleSwitch checked={form.isActive} onChange={v => setF('isActive', v)} />
          </div>

          {/* Notes */}
          <div>
            <label className="form-label">Izoh (ixtiyoriy)</label>
            <textarea
              value={form.notes}
              onChange={e => setF('notes', e.target.value)}
              className="input-field resize-none"
              rows={2}
              placeholder="Bu agent haqida qo'shimcha ma'lumot..."
            />
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Agentni o'chirish"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteConfirm(null)} className="btn-ghost">Bekor qilish</button>
            <button
              onClick={() => deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
              className="btn-primary"
              style={{ backgroundColor: 'var(--error)' }}
            >
              {deleteMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
              O'chirish
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)' }}>
            <AlertCircle size={18} style={{ color: 'var(--error)' }} />
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              <strong>{deleteConfirm?.name}</strong> agentini o'chirmoqchimisiz?
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Bu agent bilan bog'liq funksiyalar ishlamay qolishi mumkin. Bu amalni ortga qaytarib bo'lmaydi.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
