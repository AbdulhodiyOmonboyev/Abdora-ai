import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, ArrowLeft, Save, Bot, Cpu, Key, Eye, EyeOff,
  DollarSign, Smartphone, BookOpen, Coins, ShieldCheck,
  CreditCard, Sparkles, CheckCircle2, AlertCircle, Loader2,
  FileText, Check, Settings2, Receipt, Users, HelpCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../config/axios";
import ToggleSwitch from "../../components/ui/ToggleSwitch";

/* ─── Modullar va Ruxsatlar toifalari ────────────────────────── */
const PERMISSION_GROUPS = [
  {
    title: "Moliya va To'lovlar",
    description: "Markaz moliyasi, kassa, to'lovlar va oylik hisob-kitoblar ruxsati",
    icon: DollarSign,
    color: "#10b981",
    permissions: [
      { key: "financeEnabled",  label: "Moliya tahlili",         hint: "Umumiy daromad va moliyaviy hisobotlar bo'limi" },
      { key: "cashboxEnabled",  label: "Kassa tizimi",           hint: "Filial kassasi va xarajatlarni (chiqim) kiritish" },
      { key: "paymentsEnabled", label: "To'lovlar qabuli",       hint: "O'quvchilardan to'lovlarni qabul qilish va kvitansiya" },
      { key: "payrollEnabled",  label: "O'qituvchilar maoshi",   hint: "O'qituvchilar oylik hisob-kitobi (Payroll)" },
    ],
  },
  {
    title: "CRM va Kommunikatsiya",
    description: "Lidlar oqimi, yangi mijozlar va xabarnomalar",
    icon: Smartphone,
    color: "#3b82f6",
    permissions: [
      { key: "leadsEnabled", label: "CRM Lidlar voronkasi", hint: "Lidlarni qabul qilish, statuslar va talabaga aylantirish" },
      { key: "smsEnabled",   label: "SMS xabarnomalar",     hint: "To'lov va dars eslatmalari bo'yicha SMS yuborish" },
    ],
  },
  {
    title: "O'quv jarayoni (LMS)",
    description: "Darslar, topshiriqlar, testlar va davomat",
    icon: BookOpen,
    color: "#6366f1",
    permissions: [
      { key: "lessonsEnabled",      label: "Darslar va materiallar", hint: "O'qituvchilar dars materiallari yuklashi va yuritishi" },
      { key: "homeworkEnabled",     label: "Uy vazifalari",          hint: "Uy vazifasi berish va talabalar topshirishi" },
      { key: "testsEnabled",        label: "Testlar va imtihonlar",  hint: "MCQ testlar yaratish va avtomatik tekshirish" },
      { key: "timetableEnabled",    label: "Dars jadvali va xonalar", hint: "Xonalar boshqaruvi va haftalik dars jadvali" },
      { key: "attendanceEnabled",   label: "Davomat tizimi",         hint: "Darsga keldi/ketdi davomati va jurnal" },
      { key: "certificatesEnabled", label: "Sertifikatlar",          hint: "Kursni tugatganlarga avtomatik sertifikat berish" },
    ],
  },
  {
    title: "Gamifikatsiya va Do'kon",
    description: "Talabalar motivatsiyasi va rag'batlantirish",
    icon: Coins,
    color: "#f59e0b",
    permissions: [
      { key: "coinsEnabled", label: "Tangalar (Coins) & XP", hint: "Faollik uchun tangalar, darajalar va umumiy reyting" },
      { key: "shopEnabled",  label: "Tangalar do'koni",      hint: "O'quvchilar tangalarini mahsulotlarga almashtirishi" },
    ],
  },
  {
    title: "Sun'iy intellekt (AI) modullari",
    description: "Markazda qaysi AI funksiyalari ishlashi mumkinligini aniq belgilash",
    icon: Bot,
    color: "#8b5cf6",
    permissions: [
      { key: "aiEnabled",         label: "Bosh AI ruxsati",           hint: "Markaz uchun AI tizimining umumiy yoqilishi (Master switch)" },
      { key: "aiLessonGenEnabled",label: "AI dars tayyorlash",        hint: "Mavzu bo'yicha AI dars matni, xotira usullari va reja yaratish" },
      { key: "aiChatEnabled",     label: "AI virtual assistent",      hint: "Dars sahifasida talaba uchun AI bilan savol-javob" },
      { key: "aiSpeakingEnabled", label: "AI jonli speaking mashqi",  hint: "Gemini Live orqali real-vaqt ovozli gaplashuv mashqi" },
      { key: "aiGradingEnabled",  label: "AI avtomatik baholash",     hint: "Uy vazifalarini AI orqali tekshirish va baholash" },
      { key: "aiTestGenEnabled",  label: "AI test generatsiyasi",     hint: "PDF va darsliklardan avtomatik test savollari tuzish" },
      { key: "aiTtsEnabled",      label: "AI audio va ovozli dars",   hint: "Dars matnini ovozga aylantirish (TTS)" },
      { key: "aiImageEnabled",    label: "AI slayd rasmlari",         hint: "Dars slaydlari uchun AI illyustratsiya chizish" },
    ],
  },
];

/* ─── AI Modellar Ro'yxati (Dropdown Select) ─────────────────── */
const AI_MODEL_OPTIONS = [
  { group: "Google Gemini (Tavsiya)", options: [
    { value: "gemini-3.8-flash", label: "Gemini 3.8 Flash (Eng yangi, tez va kuchli)", badge: "Yangi / Tavsiya" },
    { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash (Tezkor va arzon)", badge: "Yangi" },
    { value: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite (Eng yengil)" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Standart ishonchli)" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Chuqur mantiq va murakkab vazifalar)" },
  ]},
  { group: "OpenAI", options: [
    { value: "gpt-4o", label: "GPT-4o (Omni — Asosiy model)", badge: "Tavsiya" },
    { value: "gpt-4.1", label: "GPT-4.1 (Yangi kod va logika modeli)", badge: "Yangi" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini (Tezkor va tejamkor)" },
    { value: "o3-mini", label: "o3-mini (Murakkab fikrlash)" },
  ]},
  { group: "Anthropic Claude", options: [
    { value: "claude-3-7-sonnet", label: "Claude 3.7 Sonnet (Eng so'nggi flagman)", badge: "Yangi" },
    { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet (A'lo darajada matn va kod)" },
    { value: "claude-3-5-haiku", label: "Claude 3.5 Haiku (Tezkor)" },
  ]},
];

const TABS = [
  { id: "permissions", label: "Modullar va Ruxsatlar", icon: Settings2 },
  { id: "ai",          label: "AI Model Dvigateli",     icon: Cpu },
  { id: "reception",   label: "Qabulxona Huquqlari",    icon: ShieldCheck },
  { id: "receipts",    label: "Kvitansiya va To'lov",   icon: Receipt },
];

export default function AdminCenterSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("permissions");
  const [showApiKey, setShowApiKey] = useState(false);

  // Features state
  const [features, setFeatures] = useState({
    financeEnabled: true,
    cashboxEnabled: true,
    paymentsEnabled: true,
    payrollEnabled: true,
    leadsEnabled: true,
    smsEnabled: true,
    lessonsEnabled: true,
    homeworkEnabled: true,
    testsEnabled: true,
    timetableEnabled: true,
    attendanceEnabled: true,
    certificatesEnabled: true,
    coinsEnabled: true,
    shopEnabled: true,
    aiEnabled: true,
    aiLessonGenEnabled: true,
    aiChatEnabled: true,
    aiSpeakingEnabled: true,
    aiGradingEnabled: true,
    aiTestGenEnabled: true,
    aiTtsEnabled: true,
    aiImageEnabled: true,
  });

  // AI Configuration state
  const [aiConfig, setAiConfig] = useState({
    provider: "gemini",
    model: "gemini-3.8-flash",
    liveModel: "gemini-2.5-flash-native-audio-preview",
    agentId: "",
    apiKey: "",
    customPrompt: "",
  });

  // Reception permissions state
  const [receptionPermissions, setReceptionPermissions] = useState({
    canViewFinance: false,
    canViewCashbox: false,
    canManagePayments: true,
    canManageLeads: true,
    canManageTimetable: true,
    canManageGroups: true,
    canManageStudents: true,
    canManageTeachers: true,
  });

  // Receipts and Payment settings
  const [receiptSettings, setReceiptSettings] = useState({
    receiptHeader: "",
    receiptFooter: "Xizmatimizdan foydalanganingiz uchun rahmat!",
    enabledPaymentMethods: ["cash", "click", "payme"],
    autoReceiptOnPayment: true,
  });

  // Fetch Center Data
  const { data: center, isLoading } = useQuery({
    queryKey: ["admin-center", id],
    queryFn: () => api.get(`/admin/centers/${id}`).then(r => r.data?.data || r.data),
    enabled: !!id,
  });

  // Fetch Available AI Agents
  const { data: aiAgents = [] } = useQuery({
    queryKey: ["ai-agents"],
    queryFn: () => api.get("/admin/ai-agents").then(r => r.data?.data || []),
  });

  useEffect(() => {
    if (center) {
      const s = center.settings || {};
      const f = s.features || {};
      const ai = s.aiConfig || {};
      const rp = s.receptionPermissions || {};

      setFeatures({
        financeEnabled:     f.financeEnabled     !== false,
        cashboxEnabled:     f.cashboxEnabled     !== false,
        paymentsEnabled:    f.paymentsEnabled    !== false,
        payrollEnabled:     f.payrollEnabled     !== false,
        leadsEnabled:       f.leadsEnabled       !== false,
        smsEnabled:         f.smsEnabled         !== false,
        lessonsEnabled:     f.lessonsEnabled     !== false,
        homeworkEnabled:    f.homeworkEnabled    !== false,
        testsEnabled:       f.testsEnabled       !== false,
        timetableEnabled:   f.timetableEnabled   !== false,
        attendanceEnabled:  f.attendanceEnabled  !== false,
        certificatesEnabled:f.certificatesEnabled!== false,
        coinsEnabled:       f.coinsEnabled       !== false,
        shopEnabled:        f.shopEnabled        !== false,
        aiEnabled:          f.aiEnabled          !== false,
        aiLessonGenEnabled: f.aiLessonGenEnabled !== false,
        aiChatEnabled:      f.aiChatEnabled      !== false,
        aiSpeakingEnabled:  f.aiSpeakingEnabled  !== false,
        aiGradingEnabled:   f.aiGradingEnabled   !== false,
        aiTestGenEnabled:   f.aiTestGenEnabled   !== false,
        aiTtsEnabled:       f.aiTtsEnabled       !== false,
        aiImageEnabled:     f.aiImageEnabled     !== false,
      });

      setAiConfig({
        provider:     ai.provider     || "gemini",
        model:        ai.model        || "gemini-3.8-flash",
        liveModel:    ai.liveModel    || "gemini-2.5-flash-native-audio-preview",
        agentId:      ai.agentId      || "",
        apiKey:       ai.apiKey       || "",
        customPrompt: ai.customPrompt || "",
      });

      setReceptionPermissions({
        canViewFinance:    rp.canViewFinance    === true,
        canViewCashbox:    rp.canViewCashbox    === true,
        canManagePayments: rp.canManagePayments !== false,
        canManageLeads:    rp.canManageLeads    !== false,
        canManageTimetable:rp.canManageTimetable!== false,
        canManageGroups:   rp.canManageGroups   !== false,
        canManageStudents: rp.canManageStudents !== false,
        canManageTeachers: rp.canManageTeachers !== false,
      });

      setReceiptSettings({
        receiptHeader: s.receiptHeader || center.name || "",
        receiptFooter: s.receiptFooter || "Xizmatimizdan foydalanganingiz uchun rahmat!",
        enabledPaymentMethods: Array.isArray(s.enabledPaymentMethods) ? s.enabledPaymentMethods : ["cash", "click", "payme"],
        autoReceiptOnPayment: s.autoReceiptOnPayment !== false,
      });
    }
  }, [center]);

  // Save Settings Mutation
  const saveMutation = useMutation({
    mutationFn: () =>
      api.put(`/admin/centers/${id}`, {
        settings: {
          ...(center?.settings || {}),
          features,
          aiConfig,
          receptionPermissions,
          receiptHeader: receiptSettings.receiptHeader,
          receiptFooter: receiptSettings.receiptFooter,
          enabledPaymentMethods: receiptSettings.enabledPaymentMethods,
          autoReceiptOnPayment: receiptSettings.autoReceiptOnPayment,
        },
      }),
    onSuccess: () => {
      toast.success("Markazning barcha sozlamalari muvaffaqiyatli saqlandi!");
      qc.invalidateQueries({ queryKey: ["admin-center", id] });
      qc.invalidateQueries({ queryKey: ["admin-centers"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Xatolik yuz berdi"),
  });

  const toggleFeature = (key) => setFeatures(p => ({ ...p, [key]: !p[key] }));
  const toggleReception = (key) => setReceptionPermissions(p => ({ ...p, [key]: !p[key] }));

  const handleSelectAgent = (agentId) => {
    setAiConfig(prev => {
      const selected = aiAgents.find(a => a.id === agentId);
      if (selected) {
        return {
          ...prev,
          agentId,
          provider: selected.provider || "gemini",
          model: selected.model || prev.model,
        };
      }
      return { ...prev, agentId };
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} />
      </div>
    );
  }

  if (!center) {
    return (
      <div className="p-6 text-center py-20">
        <Building2 size={48} className="mx-auto mb-3 opacity-30 text-gray-400" />
        <p className="text-gray-500 mb-4">O'quv markaz topilmadi</p>
        <Link to="/admin/centers" className="btn-primary">
          <ArrowLeft size={16} /> Markazlar ro'yxatiga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6 max-w-6xl mx-auto" style={{ background: "var(--background)" }}>
      {/* ── Top Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/admin/centers/${id}`)}
            className="p-2.5 rounded-xl border transition-colors hover:bg-[var(--secondary-background)]"
            style={{ borderColor: "var(--border)" }}
            title="Markaz sahifasiga qaytish"
          >
            <ArrowLeft size={18} style={{ color: "var(--text-secondary)" }} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {center.name} — Sozlamalar
              </h1>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Markazning barcha ruxsatlari, cheklovlari va AI model dvigatelini sozlash sahifasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/admin/centers/${id}`}
            className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors hover:bg-[var(--secondary-background)]"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            Markaz sahifasi
          </Link>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 font-bold shadow-md"
          >
            {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Sozlamalarni saqlash
          </button>
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl border"
        style={{ borderColor: "var(--border)", background: "var(--secondary-background)" }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive
                  ? "bg-[var(--card)] shadow-xs"
                  : "opacity-70 hover:opacity-100"
              }`}
              style={{
                color: isActive ? "var(--primary)" : "var(--text-primary)",
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: MODULLAR VA RUXSATLAR */}
        {activeTab === "permissions" && (
          <motion.div
            key="permissions"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="panel-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border)" }}>
                <div>
                  <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                    Markaz modullarini cheklash va ruxsat berish
                  </h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Har bir modulni o'chirib qo'ysangiz, markaz boshqaruvchisi va xodimlari undan foydalana olmaydi.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {PERMISSION_GROUPS.map(group => {
                  const GroupIcon = group.icon;
                  return (
                    <div key={group.title} className="p-4 rounded-2xl border space-y-3"
                      style={{ borderColor: "var(--border)", background: "var(--secondary-background)" }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${group.color}20`, color: group.color }}>
                          <GroupIcon size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                            {group.title}
                          </div>
                          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {group.description}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {group.permissions.map(perm => {
                          const isAllowed = features[perm.key] !== false;
                          return (
                            <div
                              key={perm.key}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                                isAllowed
                                  ? "border-emerald-500/30 bg-[var(--card)]"
                                  : "border-[var(--border)] opacity-60 bg-[var(--card)]"
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                                  {perm.label}
                                </div>
                                <div className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>
                                  {perm.hint}
                                </div>
                              </div>
                              <ToggleSwitch
                                checked={isAllowed}
                                onChange={() => toggleFeature(perm.key)}
                                size="sm"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: AI MODEL DVIGATELI */}
        {activeTab === "ai" && (
          <motion.div
            key="ai"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="panel-card space-y-5 border-2"
              style={{ borderColor: "var(--primary)", background: "var(--card-background)" }}>
              <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--primary-50)", color: "var(--primary)" }}>
                  <Cpu size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                    Markaz Shaxsiy AI Modeli va Kaliti
                  </h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Ushbu markaz dasturdagi umumiy AI dan emas, siz tanlagan maxsus model va API kalitdan foydalanadi
                  </p>
                </div>
              </div>

              {/* 1. Tizimdagi AI Agentni biriktirish */}
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-primary)" }}>
                  Tizim AI Agenti bilan bog'lash (Tavsiya)
                </label>
                <select
                  className="input-field text-sm"
                  value={aiConfig.agentId || ""}
                  onChange={e => handleSelectAgent(e.target.value)}
                >
                  <option value="">Shaxsiy model tanlash (quyidagi ro'yxatdan)</option>
                  {aiAgents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.provider.toUpperCase()} — {a.model || "Default"})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                  Agar biriktirilsa, o'sha agentning API kaliti va modeli ushbu markazga tatbiq qilinadi.
                </p>
              </div>

              {/* 2. Aniq AI Modelni tanlash (Dropdown select) */}
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-primary)" }}>
                  Ishlatiladigan AI Model (Select) *
                </label>
                <select
                  className="input-field text-sm font-semibold cursor-pointer"
                  value={aiConfig.model}
                  onChange={e => setAiConfig(p => ({ ...p, model: e.target.value }))}
                >
                  {AI_MODEL_OPTIONS.map(group => (
                    <optgroup key={group.group} label={group.group}>
                      {group.options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} {opt.badge ? `[${opt.badge}]` : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="custom">Boshqa maxsus model kiritish...</option>
                </select>

                {aiConfig.model === "custom" && (
                  <input
                    className="input-field text-sm mt-2 font-mono"
                    placeholder="Model identifikatorini kiriting (masalan: gemini-3.8-flash)"
                    onChange={e => setAiConfig(p => ({ ...p, model: e.target.value }))}
                  />
                )}
                <div className="text-[11px] mt-1.5 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  Dasturga yozilgan standart model o'rniga aynan shu tanlangan model ishlaydi!
                </div>
              </div>

              {/* 3. Jonli Speaking Modeli */}
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-primary)" }}>
                  Jonli Ovozli Muloqot Modeli (Speaking Practice)
                </label>
                <input
                  className="input-field text-sm font-mono"
                  value={aiConfig.liveModel || "gemini-2.5-flash-native-audio-preview"}
                  onChange={e => setAiConfig(p => ({ ...p, liveModel: e.target.value }))}
                  placeholder="gemini-2.5-flash-native-audio-preview"
                />
              </div>

              {/* 4. Markazning Shaxsiy API Kaliti */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                    Markaz Shaxsiy API Kaliti (Ixtiyoriy)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-xs flex items-center gap-1"
                    style={{ color: "var(--primary)" }}
                  >
                    {showApiKey ? <EyeOff size={12} /> : <Eye size={12} />}
                    {showApiKey ? "Yashirish" : "Ko'rish"}
                  </button>
                </div>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    type={showApiKey ? "text" : "password"}
                    className="input-field pl-9 font-mono text-xs"
                    placeholder="Agar bo'sh qoldirilsa, tizim asosiy kaliti ishlatiladi"
                    value={aiConfig.apiKey || ""}
                    onChange={e => setAiConfig(p => ({ ...p, apiKey: e.target.value }))}
                  />
                </div>
                <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                  Markaz o'zining shaxsiy API kalitini kiritsa, barcha dars va testlar o'sha kalit orqali ishlaydi.
                </p>
              </div>

              {/* 5. Markaz uchun Maxsus AI Prompt */}
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-primary)" }}>
                  Markazga xos AI ko'rsatmasi (System Prompt)
                </label>
                <textarea
                  className="input-field text-xs resize-none"
                  rows={3}
                  placeholder="Masalan: Ushbu markaz biologiya va tibbiyotga yo'naltirilgan, har bir javobda tibbiy atamalar bilan boyiting..."
                  value={aiConfig.customPrompt || ""}
                  onChange={e => setAiConfig(p => ({ ...p, customPrompt: e.target.value }))}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: QABULXONA (RECEPTION) HUQUQLARI */}
        {activeTab === "reception" && (
          <motion.div
            key="reception"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="panel-card space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  Qabulxona (Reception) xodimlari huquqlari
                </h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Ushbu markaz qabulxonachilari nimalarni ko'rishi va boshqarishi mumkinligini belgilang.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "canViewFinance",    label: "Moliyani ko'rish",        hint: "Umumiy markaz daromadlarini ko'rish (Odatiy: O'chiq)" },
                { key: "canViewCashbox",    label: "Kassani ko'rish",         hint: "Kassa qoldig'i va chiqimlarni ko'rish (Odatiy: O'chiq)" },
                { key: "canManagePayments", label: "To'lovlar qabuli",        hint: "O'quvchilardan to'lovlarni qabul qilish va kvitansiya" },
                { key: "canManageLeads",    label: "Lidlar va CRM",           hint: "Yangi mijozlar, murojaatlar va lidlarni yuritish" },
                { key: "canManageTimetable",label: "Dars jadvali va xonalar", hint: "Xonalar bandligini va dars jadvallarini boshqarish" },
                { key: "canManageGroups",   label: "Guruhlar ro'yxati",       hint: "Guruhlarni ko'rish va o'quvchilarni taqsimlash" },
                { key: "canManageStudents", label: "O'quvchilar ro'yxati",     hint: "O'quvchilar ma'lumotlarini kiritish va tahrirlash" },
                { key: "canManageTeachers", label: "O'qituvchilar ro'yxati",   hint: "O'qituvchilar kontaktlari va guruhlarini ko'rish" },
              ].map(item => {
                const isChecked = receptionPermissions[item.key] === true;
                return (
                  <div
                    key={item.key}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isChecked
                        ? "border-emerald-500/30 bg-[var(--secondary-background)]"
                        : "border-[var(--border)] opacity-60 bg-[var(--card)]"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                        {item.label}
                      </div>
                      <div className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>
                        {item.hint}
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={isChecked}
                      onChange={() => toggleReception(item.key)}
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* TAB 4: KVITANSIYA VA TO'LOV */}
        {activeTab === "receipts" && (
          <motion.div
            key="receipts"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="panel-card space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  To'lov kvitansiyasi va To'lov usullari
                </h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Chop etiladigan to'lov kvitansiyasidagi matnlar va markaz qabul qiladigan to'lov turlari
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-primary)" }}>
                  Kvitansiya yuqori sarlavhasi (Header)
                </label>
                <input
                  className="input-field text-sm"
                  placeholder="Markaz nomi yoki shiori..."
                  value={receiptSettings.receiptHeader}
                  onChange={e => setReceiptSettings(p => ({ ...p, receiptHeader: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-primary)" }}>
                  Kvitansiya pastki qismi (Footer xabari)
                </label>
                <input
                  className="input-field text-sm"
                  placeholder="Xizmatimizdan foydalanganingiz uchun rahmat!"
                  value={receiptSettings.receiptFooter}
                  onChange={e => setReceiptSettings(p => ({ ...p, receiptFooter: e.target.value }))}
                />
              </div>

              <div className="p-3.5 rounded-xl border flex items-center justify-between"
                style={{ borderColor: "var(--border)", background: "var(--secondary-background)" }}>
                <div>
                  <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                    To'lov amalga oshganda avtomatik kvitansiya chiqarish
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Kassada to'lov saqlangach, printer kvitansiyasini avtomatik ochish
                  </div>
                </div>
                <ToggleSwitch
                  checked={receiptSettings.autoReceiptOnPayment}
                  onChange={v => setReceiptSettings(p => ({ ...p, autoReceiptOnPayment: v }))}
                  size="sm"
                />
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Bottom Floating Save Bar ──────────────────────────── */}
      <div className="flex items-center justify-between p-4 rounded-2xl border"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <CheckCircle2 size={16} className="text-emerald-500" />
          Kiritilgan sozlamalar saqlangandan so'ng darhol kuchga kiradi.
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 font-bold shadow-md"
        >
          {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Barcha sozlamalarni saqlash
        </button>
      </div>
    </div>
  );
}
