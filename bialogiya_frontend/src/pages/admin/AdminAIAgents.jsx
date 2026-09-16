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

/* ─── Provider & Model SVG Icons ─────────────────────────────── */
const GeminiIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2C14 2 8.5 8.5 8.5 14C8.5 19.5 14 26 14 26C14 26 19.5 19.5 19.5 14C19.5 8.5 14 2 14 2Z" fill="url(#gemini_a)"/>
    <path d="M2 14C2 14 8.5 8.5 14 8.5C19.5 8.5 26 14 26 14C26 14 19.5 19.5 14 19.5C8.5 19.5 2 14 2 14Z" fill="url(#gemini_b)"/>
    <defs>
      <linearGradient id="gemini_a" x1="14" y1="2" x2="14" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4285F4"/>
        <stop offset="0.5" stopColor="#9B72CB"/>
        <stop offset="1" stopColor="#EA4335"/>
      </linearGradient>
      <linearGradient id="gemini_b" x1="2" y1="14" x2="26" y2="14" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34A853"/>
        <stop offset="0.5" stopColor="#4285F4"/>
        <stop offset="1" stopColor="#FBBC05"/>
      </linearGradient>
    </defs>
  </svg>
);

// Gemini Flash model: Lightning Fast AI
const GeminiFlashIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1C12 7.075 7.075 12 1 12C7.075 12 12 16.925 12 23C12 16.925 16.925 12 23 12C16.925 12 12 7.075 12 1Z" fill="url(#gem_flash_grad)"/>
    <path d="M13.5 6L8.5 13.5H12.5L10.5 18L15.5 10.5H11.5L13.5 6Z" fill="#FFF275" stroke="#E65100" strokeWidth="0.5"/>
    <defs>
      <linearGradient id="gem_flash_grad" x1="1" y1="1" x2="23" y2="23" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4285F4"/>
        <stop offset="0.6" stopColor="#5460E6"/>
        <stop offset="1" stopColor="#9B42E3"/>
      </linearGradient>
    </defs>
  </svg>
);

// Gemini Pro model: Advanced reasoning & deep tasks
const GeminiProIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" fill="url(#gem_pro_grad)"/>
    <circle cx="12" cy="12" r="3" fill="#FFFFFF" fillOpacity="0.9"/>
    <path d="M12 6V18M6 12H18" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8"/>
    <defs>
      <linearGradient id="gem_pro_grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1BA1E3"/>
        <stop offset="0.5" stopColor="#6C5CE7"/>
        <stop offset="1" stopColor="#FD79A8"/>
      </linearGradient>
    </defs>
  </svg>
);

// Gemini TTS: Speech generation & Audio
const GeminiTtsIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="8" width="3" height="8" rx="1.5" fill="#4285F4"/>
    <rect x="7" y="4" width="3" height="16" rx="1.5" fill="#5460E6"/>
    <rect x="12" y="1" width="3" height="22" rx="1.5" fill="#9B72CB"/>
    <rect x="17" y="5" width="3" height="14" rx="1.5" fill="#D96570"/>
    <rect x="22" y="9" width="2.5" height="6" rx="1.25" fill="#EA4335"/>
  </svg>
);

// Gemini Live: Real-time speaking practice
const GeminiLiveIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="4" fill="#34A853"/>
    <path d="M7.76 7.76C5.42 10.1 5.42 13.9 7.76 16.24" stroke="#4285F4" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16.24 7.76C18.58 10.1 18.58 13.9 16.24 16.24" stroke="#EA4335" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4.93 4.93C1.03 8.83 1.03 15.17 4.93 19.07" stroke="#9B72CB" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M19.07 4.93C22.97 8.83 22.97 15.17 19.07 19.07" stroke="#FBBC05" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const OpenAIIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.843-3.372 2.02-1.164a.08.08 0 0 1 .071 0l4.83 2.786a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.402-.677zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" fill="#10A37F"/>
  </svg>
);

const AnthropicIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017L3.674 20H0L6.57 3.52zm4.132 9.959L8.453 7.687 6.205 13.48h4.496z" fill="#CC9B6D"/>
  </svg>
);

const CustomIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* Helper to render the matching SVG icon for any model ID */
const ModelIcon = ({ modelId, providerKey, size = 13 }) => {
  if (!modelId) return null;
  const id = modelId.toLowerCase();
  if (id.includes('tts') || id.includes('whisper')) return <GeminiTtsIcon size={size} />;
  if (id.includes('live')) return <GeminiLiveIcon size={size} />;
  if (id.includes('flash')) return <GeminiFlashIcon size={size} />;
  if (id.includes('pro') || id.includes('opus')) return <GeminiProIcon size={size} />;
  if (providerKey === 'openai' || id.startsWith('gpt') || id.startsWith('dall')) return <OpenAIIcon size={size} />;
  if (providerKey === 'anthropic' || id.startsWith('claude')) return <AnthropicIcon size={size} />;
  return <GeminiIcon size={size} />;
};

/* ─── Available AI Providers ─────────────────────────────────── */
const PROVIDERS = [
  {
    key: 'gemini',
    name: 'Google Gemini',
    Icon: GeminiIcon,
    color: '#4285F4',
    bg: '#EBF3FF',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    description: 'Gemini 2.5 Flash, Pro, TTS, Live modellar',
    models: [
      { id: 'gemini-2.5-flash',   label: 'Gemini 2.5 Flash',   use: 'Asosiy AI (tez)',   recommended: true, Icon: GeminiFlashIcon },
      { id: 'gemini-2.5-pro',     label: 'Gemini 2.5 Pro',     use: 'Murakkab topshiriqlar', Icon: GeminiProIcon },
      { id: 'gemini-2.0-flash',   label: 'Gemini 2.0 Flash',   use: 'Tez generatsiya', Icon: GeminiFlashIcon },
      { id: 'gemini-tts',         label: 'Gemini TTS',          use: 'Ovozli dars (Audio)', Icon: GeminiTtsIcon },
      { id: 'gemini-live',        label: 'Gemini Live',         use: 'Speaking practice', Icon: GeminiLiveIcon },
    ],
  },
  {
    key: 'openai',
    name: 'OpenAI',
    Icon: OpenAIIcon,
    color: '#10A37F',
    bg: '#F0FFF8',
    docsUrl: 'https://platform.openai.com/api-keys',
    description: 'GPT-4o, GPT-4 Turbo, DALL-E 3, Whisper',
    models: [
      { id: 'gpt-4o',             label: 'GPT-4o',              use: 'Asosiy AI', recommended: true, Icon: OpenAIIcon },
      { id: 'gpt-4-turbo',        label: 'GPT-4 Turbo',         use: 'Katta kontekst', Icon: OpenAIIcon },
      { id: 'gpt-3.5-turbo',      label: 'GPT-3.5 Turbo',       use: 'Tez va arzon', Icon: OpenAIIcon },
      { id: 'dall-e-3',           label: 'DALL·E 3',            use: 'Rasm generatsiyasi', Icon: OpenAIIcon },
      { id: 'whisper-1',          label: 'Whisper',             use: 'Audio transkripsiya', Icon: GeminiTtsIcon },
      { id: 'tts-1',              label: 'TTS-1',               use: 'Matndan ovoz', Icon: GeminiTtsIcon },
    ],
  },
  {
    key: 'anthropic',
    name: 'Anthropic Claude',
    Icon: AnthropicIcon,
    color: '#CC9B6D',
    bg: '#FFF9F2',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Claude 3.5 Sonnet, Haiku, Opus',
    models: [
      { id: 'claude-3-5-sonnet',  label: 'Claude 3.5 Sonnet',  use: 'Asosiy AI', recommended: true, Icon: AnthropicIcon },
      { id: 'claude-3-5-haiku',   label: 'Claude 3.5 Haiku',   use: 'Tez va arzon', Icon: AnthropicIcon },
      { id: 'claude-3-opus',      label: 'Claude 3 Opus',       use: 'Eng kuchli', Icon: AnthropicIcon },
    ],
  },
  {
    key: 'custom',
    name: 'Custom / Boshqa',
    Icon: CustomIcon,
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
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: provider.bg, border: `1px solid ${provider.color}22` }}>
            <provider.Icon size={22} />
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
              <span key={m} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: provider.bg, color: provider.color, border: `1px solid ${provider.color}33` }}>
                <ModelIcon modelId={m} providerKey={agent.provider} size={12} />
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
            <p.Icon size={14} />
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
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
            style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
            <Bot size={28} style={{ color: 'var(--text-muted)' }} />
          </div>
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
          <div className="w-8 h-8 flex items-center justify-center mb-1">
                      <p.Icon size={26} />
                    </div>
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
                  const Icon = m.Icon || currentProvider.Icon || GeminiIcon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleModel(m.id)}
                      className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border transition-all text-left ${
                        enabled ? 'border-[var(--primary)] bg-[var(--primary-50)]' : 'border-[var(--border)] hover:border-[var(--primary)]/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: enabled ? 'white' : 'var(--secondary-background)', border: '1px solid var(--border)' }}>
                          <Icon size={18} />
                        </div>
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
