import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Building2, ArrowLeft, GitBranch, Users, BookOpen, UserCheck,
  Phone, MapPin, Pencil, Trash2, Check,
  Loader2, User, Info,
  Bot, Coins, ShoppingBag, Smartphone, Settings2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../config/axios";
import StatusBadge from "../../components/ui/StatusBadge";
import PhoneInput from "../../components/ui/PhoneInput";
import { cleanPhone } from "../../utils/formatPhone";
import ToggleSwitch from "../../components/ui/ToggleSwitch";

const FEATURE_LIST = [
  {
    key: "aiEnabled",
    label: "Sun'iy intellekt (AI) tizimi",
    hint: "AI dars rejalari, testlar, uy vazifalarini baholash va AI assistent",
    icon: Bot,
    color: "#6366f1",
  },
  {
    key: "coinsEnabled",
    label: "Tangalar (Coins) va Gamifikatsiya",
    hint: "Darslar va faollik uchun tangalar, daraja va reyting jadvali",
    icon: Coins,
    color: "#f59e0b",
  },
  {
    key: "shopEnabled",
    label: "Online Do'kon (Coin Shop)",
    hint: "O'quvchilar tangalarini sovg'alar va chegirmalarga almashtirishi",
    icon: ShoppingBag,
    color: "#10b981",
  },
  {
    key: "smsEnabled",
    label: "Avtomatik SMS xabarnomalar",
    hint: "To'lov, dars va eslatmalar bo'yicha ota-onalarga SMS yuborish",
    icon: Smartphone,
    color: "#3b82f6",
  },
];

export default function AdminCenterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [features, setFeatures] = useState({
    aiEnabled: true,
    coinsEnabled: true,
    shopEnabled: true,
    smsEnabled: true,
  });

  const { data: center, isLoading } = useQuery({
    queryKey: ["admin-center", id],
    queryFn: () => api.get(`/admin/centers/${id}`).then(r => r.data?.data || r.data),
    enabled: !!id,
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
      // Load features from center settings
      const s = center.settings || {};
      const f = s.features || {};
      setFeatures({
        aiEnabled:     f.aiEnabled     !== false,
        coinsEnabled:  f.coinsEnabled  !== false,
        shopEnabled:   f.shopEnabled   !== false,
        smsEnabled:    f.smsEnabled    !== false,
      });
    }
  }, [center]);

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

  const saveFeaturesMutation = useMutation({
    mutationFn: (newFeatures) =>
      api.put(`/admin/centers/${id}`, {
        settings: {
          ...(center?.settings || {}),
          features: newFeatures,
        },
      }),
    onSuccess: () => {
      toast.success("Markaz ruxsatlari saqlandi!");
      qc.invalidateQueries({ queryKey: ["admin-center", id] });
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

  const handleSave = () => {
    if (!editForm.name?.trim()) return toast.error("Markaz nomi kiritilishi shart");
    updateMutation.mutate({
      ...editForm,
      phone: cleanPhone(editForm.phone),
    });
  };

  const toggleFeature = (key) => {
    const updated = { ...features, [key]: !features[key] };
    setFeatures(updated);
    saveFeaturesMutation.mutate(updated);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "var(--primary)" }}
              >
                {updateMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Saqlash
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Filiallar",     value: center.branches?.length ?? center._count?.branches ?? 0, icon: GitBranch, color: "#6366f1" },
          { label: "O'quvchilar",   value: center.studentsCount ?? 0,                                icon: Users,     color: "#10b981" },
          { label: "O'qituvchilar", value: center.teachersCount ?? 0,                                icon: BookOpen,  color: "#f59e0b" },
          { label: "Guruhlar",      value: center._count?.groups ?? 0,                               icon: UserCheck, color: "#3b82f6" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-4"
            style={{ background: "var(--card-background)", border: "1px solid var(--border)" }}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="panel-card space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Building2 size={18} className="text-primary" /> Markaz ma'lumotlari
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
                      className="text-primary hover:underline font-medium">
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

          {/* ══════════ MARKAZ SOZLAMALARI ══════════ */}
          <div className="panel-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Settings2 size={18} className="text-primary" /> Markaz sozlamalari
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Ushbu markaz uchun modullarni yoqing yoki o'chiring
                </p>
              </div>
              {saveFeaturesMutation.isPending && (
                <Loader2 size={16} className="animate-spin" style={{ color: "var(--primary)" }} />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURE_LIST.map(({ key, label, hint, icon: Icon, color }) => {
                const isEnabled = features[key] !== false;
                return (
                  <motion.div
                    key={key}
                    layout
                    className="p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all"
                    style={{
                      borderColor: isEnabled ? color + "40" : "var(--border)",
                      background: isEnabled ? color + "08" : "var(--secondary-background)",
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}15`, color }}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                          {label}
                        </div>
                        <div className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--text-secondary)" }}>
                          {hint}
                        </div>
                        <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 ${
                          isEnabled
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                        }`}>
                          {isEnabled ? "Faol" : "O'chiq"}
                        </span>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={isEnabled}
                      onChange={() => toggleFeature(key)}
                      disabled={saveFeaturesMutation.isPending}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Filiallar Table */}
          <div className="panel-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <MapPin size={18} className="text-primary" /> Markazga qarashli filiallar ({center.branches?.length || 0})
              </h2>
            </div>
            {center.branches && center.branches.length > 0 ? (
              <div className="table-shell">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Filial nomi</th>
                      <th>Manzil</th>
                      <th>Guruhlar</th>
                      <th>O'qituvchilar</th>
                      <th>Holat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {center.branches.map(b => (
                      <tr key={b.id}>
                        <td className="font-semibold" style={{ color: "var(--text-primary)" }}>{b.name}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{b.address || "—"}</td>
                        <td>{b._count?.groups || 0}</td>
                        <td>{b._count?.teachers || 0}</td>
                        <td><StatusBadge status={b.isActive ? "faol" : "nofaol"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
                Hozircha bu markazda filiallar ochilmagan. Markaz manageri o'z panelidan filial qo'shishi mumkin.
              </div>
            )}
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-6">
          <div className="panel-card space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <User size={18} className="text-primary" /> Boshqaruvchi (Manager) akkaunt
            </h2>
            {center.users && center.users.length > 0 ? (
              <div className="space-y-3">
                {center.users.map(u => (
                  <div key={u.id} className="p-3.5 rounded-xl border"
                    style={{ background: "var(--secondary-background)", borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
                        style={{ background: "var(--primary)" }}>
                        {u.name?.[0]?.toUpperCase() || "M"}
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{u.name}</div>
                        <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>@{u.username}</div>
                      </div>
                    </div>
                    {u.phone && (
                      <div className="text-xs flex items-center gap-1.5 mt-1" style={{ color: "var(--text-secondary)" }}>
                        <Phone size={12} /> {u.phone}
                      </div>
                    )}
                    <div className="text-[11px] mt-2 pt-2 border-t" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                      Yaratilgan: {new Date(u.createdAt).toLocaleDateString("uz-UZ")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
                Manager biriktirilmagan
              </div>
            )}
          </div>

          <div className="panel-card p-4 space-y-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <div className="font-semibold text-sm mb-1 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Info size={16} className="text-primary" /> SaaS Boshqaruvi haqida
            </div>
            <p>
              Siz platforma egasi (SuperAdmin) sifatida yangi o'quv markaz ochasiz va ularga manager hisobi taqdim etasiz.
            </p>
            <p>
              O'quvchilar, o'qituvchilar, dars jadvallari va filiallar boshqaruvi to'liq markaz managerining vakolatida bo'ladi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
