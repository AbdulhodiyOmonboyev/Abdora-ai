import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, ArrowLeft, GitBranch, Users, BookOpen, UserCheck,
  Phone, MapPin, Pencil, Trash2, Check, X,
  Loader2, User, Info, Save,
  Bot, Coins, ShoppingBag, Smartphone, Settings2,
  DollarSign, CreditCard, Wallet, Calendar, ShieldAlert,
  GraduationCap, ClipboardCheck, Sparkles, Key, Eye, EyeOff,
  Cpu, Layers, MessageSquare, Mic, FileText, CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../config/axios";
import StatusBadge from "../../components/ui/StatusBadge";
import PhoneInput from "../../components/ui/PhoneInput";
import { cleanPhone } from "../../utils/formatPhone";
import ToggleSwitch from "../../components/ui/ToggleSwitch";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

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
    title: "Sun'iy intellekt (AI) ruxsatlari",
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

/* ─── AI Modellar Ro'yxati ───────────────────────────────────── */
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

export default function AdminCenterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showApiKey, setShowApiKey] = useState(false);

  // Features state (Markaz huquqlari)
  const [features, setFeatures] = useState({
    // Moliya
    financeEnabled: true,
    cashboxEnabled: true,
    paymentsEnabled: true,
    payrollEnabled: true,
    // CRM
    leadsEnabled: true,
    smsEnabled: true,
    // LMS
    lessonsEnabled: true,
    homeworkEnabled: true,
    testsEnabled: true,
    timetableEnabled: true,
    attendanceEnabled: true,
    certificatesEnabled: true,
    // Gamifikatsiya
    coinsEnabled: true,
    shopEnabled: true,
    // AI
    aiEnabled: true,
    aiLessonGenEnabled: true,
    aiChatEnabled: true,
    aiSpeakingEnabled: true,
    aiGradingEnabled: true,
    aiTestGenEnabled: true,
    aiTtsEnabled: true,
    aiImageEnabled: true,
  });

  // AI Configuration state (Markaz AI Sozlamalari)
  const [aiConfig, setAiConfig] = useState({
    provider: "gemini",
    model: "gemini-3.8-flash",
    liveModel: "gemini-2.5-flash-native-audio-preview",
    agentId: "",
    apiKey: "",
    customPrompt: "",
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
      setEditForm({
        name: center.name || "",
        phone: center.phone || "+998 ",
        email: center.email || "",
        address: center.address || "",
        website: center.website || "",
        isActive: center.isActive ?? true,
      });

      const s = center.settings || {};
      const f = s.features || {};
      const ai = s.aiConfig || {};

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
    }
  }, [center]);

  // Center basic info update
  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/admin/centers/${id}`, data),
    onSuccess: () => {
      toast.success("O'quv markaz ma'lumotlari yangilandi!");
      qc.invalidateQueries({ queryKey: ["admin-center", id] });
      qc.invalidateQueries({ queryKey: ["admin-centers"] });
      setIsEditing(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Xatolik yuz berdi"),
  });

  // Save Settings (Features + AI Config)
  const saveSettingsMutation = useMutation({
    mutationFn: () =>
      api.put(`/admin/centers/${id}`, {
        settings: {
          ...(center?.settings || {}),
          features,
          aiConfig,
        },
      }),
    onSuccess: () => {
      toast.success("Markaz ruxsatlari va AI model sozlamalari muvaffaqiyatli saqlandi!");
      qc.invalidateQueries({ queryKey: ["admin-center", id] });
      qc.invalidateQueries({ queryKey: ["admin-centers"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Xatolik yuz berdi"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/admin/centers/${id}`),
    onSuccess: () => {
      toast.success("O'quv markaz o'chirildi!");
      qc.invalidateQueries({ queryKey: ["admin-centers"] });
      navigate("/admin/centers");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Xatolik yuz berdi"),
  });

  const [confirmDelete, setConfirmDelete] = useState(null);

  const cleanupBranchesMutation = useMutation({
    mutationFn: () => api.post(`/admin/centers/${id}/cleanup-branches`),
    onSuccess: (res) => {
      toast.success(res.data?.message || "Bo'sh filiallar tozalandi!");
      qc.invalidateQueries({ queryKey: ["admin-center", id] });
      qc.invalidateQueries({ queryKey: ["admin-centers"] });
      setConfirmDelete(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Xatolik yuz berdi"),
  });

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

  const handleDelete = () => {
    if (window.confirm(`"${center.name}" markazini o'chirishni xohlaysizmi? Markaz nofaol holatga o'tkaziladi.`)) {
      deleteMutation.mutate();
    }
  };

  const handleSaveInfo = () => {
    if (!editForm.name?.trim()) return toast.error("Markaz nomi kiritilishi shart");
    updateMutation.mutate({
      ...editForm,
      phone: cleanPhone(editForm.phone),
    });
  };

  const toggleFeature = (key) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // If selecting a predefined AIAgent from DB, autofill its model and provider
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

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6" style={{ background: "var(--background)" }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/centers"
            className="p-2.5 rounded-xl border transition-colors hover:bg-[var(--secondary-background)]"
            style={{ borderColor: "var(--border)" }}
          >
            <ArrowLeft size={18} style={{ color: "var(--text-secondary)" }} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {center.name}
              </h1>
              <StatusBadge status={center.isActive ? "faol" : "nofaol"} />
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              ID: {center.id} • {new Date(center.createdAt).toLocaleDateString("uz-UZ")} da ro'yxatdan o'tgan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => {
                  setEditForm({
                    name: center.name || "",
                    phone: center.phone || "",
                    email: center.email || "",
                    address: center.address || "",
                    website: center.website || "",
                    isActive: center.isActive ?? true,
                  });
                  setIsEditing(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:bg-[var(--secondary-background)]"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                <Pencil size={15} /> Tahrirlash
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 border border-red-200 transition-all hover:bg-red-50"
              >
                <Trash2 size={15} /> O'chirish
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium border"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveInfo}
                disabled={updateMutation.isPending}
                className="btn-primary"
              >
                {updateMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Saqlash
              </button>
            </>
          )}

          {/* Master Save for Permissions and AI */}
          <button
            onClick={() => saveSettingsMutation.mutate()}
            disabled={saveSettingsMutation.isPending}
            className="btn-primary flex items-center gap-2 px-5 py-2"
          >
            {saveSettingsMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Barcha sozlamalarni saqlash
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Filiallar",     value: center.branches?.length ?? center._count?.branches ?? 0, icon: GitBranch, color: "#6366f1" },
          { label: "O'quvchilar",   value: center.studentsCount ?? 0,                                icon: Users,     color: "#10b981" },
          { label: "O'qituvchilar", value: center.teachersCount ?? 0,                                icon: BookOpen,  color: "#f59e0b" },
          { label: "Guruhlar",      value: center._count?.groups ?? 0,                               icon: UserCheck, color: "#3b82f6" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="panel-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, color }}>
                <Icon size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Main Layout: Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Modullar va Ruxsatlar + Filiallar */}
        <div className="lg:col-span-2 space-y-6">

          {/* ══════════════════════════════════════════════════
              1. MARKAZ RUXSATLARI VA CHEKLOVLARI (MODULES)
             ══════════════════════════════════════════════════ */}
          <div className="panel-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b"
              style={{ borderColor: "var(--border)" }}>
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Settings2 size={20} style={{ color: "var(--primary)" }} /> Markaz ruxsatlari va modullarini cheklash
                </h2>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Ushbu markaz boshqaruvchisi va xodimlari nimalardan foydalana olishini to'liq belgilang
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: "var(--secondary-background)", color: "var(--text-secondary)" }}>
                Har bir modulni alohida yoqish/o'chirish
              </span>
            </div>

            <div className="space-y-6">
              {PERMISSION_GROUPS.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.title} className="p-4 rounded-2xl border"
                    style={{ borderColor: "var(--border)", background: "var(--secondary-background)" }}>
                    {/* Group Header */}
                    <div className="flex items-center gap-2.5 mb-3">
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

                    {/* Permission switches grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {group.permissions.map((perm) => {
                        const isAllowed = features[perm.key] !== false;
                        return (
                          <div
                            key={perm.key}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                              isAllowed
                                ? "border-emerald-500/30 bg-[var(--card)] shadow-xs"
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

          {/* ══════════════════════════════════════════════════
              2. MARKAZNING ASOSIY MA'LUMOTLARI
             ══════════════════════════════════════════════════ */}
          <div className="panel-card space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Building2 size={18} style={{ color: "var(--primary)" }} /> Markaz ma'lumotlari
            </h2>

            {!isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs block" style={{ color: "var(--text-muted)" }}>Markaz nomi</span>
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{center.name}</span>
                </div>
                <div>
                  <span className="text-xs block" style={{ color: "var(--text-muted)" }}>Telefon</span>
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>{center.phone || "—"}</span>
                </div>
                <div>
                  <span className="text-xs block" style={{ color: "var(--text-muted)" }}>Email</span>
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>{center.email || "—"}</span>
                </div>
                <div>
                  <span className="text-xs block" style={{ color: "var(--text-muted)" }}>Veb-sayt</span>
                  {center.website ? (
                    <a href={center.website} target="_blank" rel="noopener noreferrer"
                      className="hover:underline font-medium" style={{ color: "var(--primary)" }}>
                      {center.website}
                    </a>
                  ) : "—"}
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs block" style={{ color: "var(--text-muted)" }}>Manzil</span>
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>{center.address || "—"}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Markaz nomi *</label>
                  <input className="input-field" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Telefon</label>
                  <PhoneInput className="input-field" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Email</label>
                  <input className="input-field" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Veb-sayt</label>
                  <input className="input-field" value={editForm.website} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Manzil</label>
                  <input className="input-field" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} />
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════
              3. FILIALLAR RO'YXATI
             ══════════════════════════════════════════════════ */}
          <div className="panel-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <MapPin size={18} style={{ color: "var(--primary)" }} /> Markaz filiallari ({center.branches?.length || 0})
              </h2>
              {center.branches && center.branches.length > 1 && (
                <button
                  onClick={() => {
                    setConfirmDelete({
                      title: "Bo'sh filiallarni tozalash",
                      message: "Ushbu markazga tegishli barcha bo'sh va ortiqcha test filiallari o'chiriladi. Asosiy filial saqlanadi.",
                      onConfirm: () => cleanupBranchesMutation.mutate(),
                    });
                  }}
                  disabled={cleanupBranchesMutation.isPending}
                  className="btn-ghost btn-sm text-xs flex items-center gap-1.5 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                >
                  <Trash2 size={13} /> Bo'sh filiallarni tozalash
                </button>
              )}
            </div>

            {center.branches && center.branches.length > 0 ? (
              <div className="table-shell">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Filial nomi</th>
                      <th>Manzil</th>
                      <th>Guruhlar</th>
                      <th>Holat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {center.branches.map(b => (
                      <tr key={b.id}>
                        <td className="font-semibold" style={{ color: "var(--text-primary)" }}>{b.name}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{b.address || "—"}</td>
                        <td>{b._count?.groups ?? 0} ta guruh</td>
                        <td><StatusBadge status={b.isActive ? "faol" : "nofaol"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>Filiallar yo'q</p>
            )}
          </div>

        </div>

        {/* Right 1 Col: AI Dvigateli & Model sozlamalari */}
        <div className="space-y-6">

          {/* ══════════════════════════════════════════════════
              AI MODEL TANLASH VA ENGINE SOZLAMALARI
             ══════════════════════════════════════════════════ */}
          <div className="panel-card space-y-5 border-2"
            style={{ borderColor: "var(--primary)", background: "var(--card-background)" }}>
            <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--primary-50)", color: "var(--primary)" }}>
                <Cpu size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  Markaz AI Dvigateli
                </h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Qaysi AI model va kalitdan foydalanishi kerak
                </p>
              </div>
            </div>

            {/* 1. Tizimdagi AI Agentni biriktirish (ixtiyoriy) */}
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-primary)" }}>
                Tizim AI Agenti bilan bog'lash (Tavsiya)
              </label>
              <select
                className="input-field text-sm"
                value={aiConfig.agentId || ""}
                onChange={e => handleSelectAgent(e.target.value)}
              >
                <option value="">Standart / Shaxsiy model tanlash</option>
                {aiAgents.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.provider.toUpperCase()} — {a.model || "Default"})
                  </option>
                ))}
              </select>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                Admin AI Agentlar bo'limidagi tayyor agentni biriktirishingiz mumkin.
              </p>
            </div>

            {/* 2. Aniq AI Modelni tanlash */}
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-primary)" }}>
                Ishlatiladigan AI Model *
              </label>
              <select
                className="input-field text-sm font-medium"
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
                Dasturdagi standart model o'rniga aynan shu tanlangan model ishlaydi!
              </div>
            </div>

            {/* 3. Jonli Speaking Mashqi Modeli */}
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-primary)" }}>
                Jonli Ovozli Suhbat (Speaking Model)
              </label>
              <input
                className="input-field text-sm font-mono"
                value={aiConfig.liveModel || "gemini-2.5-flash-native-audio-preview"}
                onChange={e => setAiConfig(p => ({ ...p, liveModel: e.target.value }))}
                placeholder="gemini-2.5-flash-native-audio-preview"
              />
              <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                Gemini Live real-vaqt ovozli mashg'ulot modeli
              </p>
            </div>

            {/* 4. Markazning Shaxsiy API Kaliti (Ixtiyoriy) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  Markaz uchun Shaxsiy API Kalit (Ixtiyoriy)
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

            {/* 5. Markaz uchun Maxsus AI Prompt (Ixtiyoriy) */}
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-primary)" }}>
                Markazga xos AI ko'rsatmasi (System Prompt)
              </label>
              <textarea
                className="input-field text-xs resize-none"
                rows={3}
                placeholder="Masalan: Ushbu markaz xususiyatiga ko'ra talabalarga darslarni tibbiy atamalar va amaliy biologiya misollari bilan tushuntir..."
                value={aiConfig.customPrompt || ""}
                onChange={e => setAiConfig(p => ({ ...p, customPrompt: e.target.value }))}
              />
            </div>

            {/* Save Button for Right Panel */}
            <button
              onClick={() => saveSettingsMutation.mutate()}
              disabled={saveSettingsMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 font-bold shadow-md"
            >
              {saveSettingsMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Sozlamalarni saqlash
            </button>
          </div>

          {/* Quick Help Card */}
          <div className="p-4 rounded-2xl border"
            style={{ borderColor: "var(--border)", background: "var(--secondary-background)" }}>
            <div className="flex items-center gap-2 text-xs font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              <Sparkles size={14} style={{ color: "var(--primary)" }} /> Muhim ma'lumot
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Siz tanlagan model va o'rnatilgan cheklovlar bir zumda kuchga kiradi. Agar markazda biror modul (masalan, Moliya yoki AI Speaking) o'chirilsa, markaz xodimlari va o'quvchilari ushbu imkoniyatdan foydalana olmaydi.
            </p>
          </div>

        </div>

      </div>

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          open={!!confirmDelete}
          title={confirmDelete.title}
          message={confirmDelete.message}
          confirmText="Ha, tozalash"
          cancelText="Bekor qilish"
          onConfirm={confirmDelete.onConfirm}
          onCancel={() => setConfirmDelete(null)}
          loading={cleanupBranchesMutation.isPending}
        />
      )}
    </div>
  );
}
