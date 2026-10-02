import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Building2, ArrowLeft, GitBranch, Users, BookOpen, UserCheck,
  Phone, MapPin, Pencil, Trash2, Check,
  Loader2, User, Globe, Mail,
  Settings2, ChevronRight, Sparkles, Cpu, ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../config/axios";
import StatusBadge from "../../components/ui/StatusBadge";
import PhoneInput from "../../components/ui/PhoneInput";
import { cleanPhone } from "../../utils/formatPhone";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

export default function AdminCenterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Fetch Center Data
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

  const aiModelName = center.settings?.aiConfig?.model || "Standart";

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6 max-w-6xl mx-auto" style={{ background: "var(--background)" }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: "var(--border)" }}>
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
          {/* Main Action: Go to Settings Page */}
          <Link
            to={`/admin/centers/${id}/settings`}
            className="btn-primary flex items-center gap-2 px-5 py-2 font-bold shadow-sm"
          >
            <Settings2 size={16} /> Markaz sozlamalari
          </Link>

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

      {/* ── Center Settings Banner Callout ─────────────────── */}
      <div
        className="p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
        style={{
          background: "linear-gradient(135deg, rgba(240, 100, 19, 0.06) 0%, rgba(99, 102, 241, 0.06) 100%)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--primary-50)", color: "var(--primary)" }}>
            <Settings2 size={24} />
          </div>
          <div>
            <div className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              Markaz sozlamalari va imkoniyatlari
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--primary)" }}>
                Model: {aiModelName}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Markaz modullarini cheklash (Moliya, CRM, LMS, Tangalar), AI model dvigateli va qabulxona ruxsatlarini alohida sozlamalar sahifasida boshqaring.
            </p>
          </div>
        </div>

        <Link
          to={`/admin/centers/${id}/settings`}
          className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 font-bold flex-shrink-0 text-sm whitespace-nowrap"
        >
          <Settings2 size={16} /> Sozlamalar sahifasiga o'tish <ChevronRight size={15} />
        </Link>
      </div>

      {/* ── Main Layout: Info + Branches ───────────────────── */}
      <div className="space-y-6">

        {/* 1. Markaz ma'lumotlari */}
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

        {/* 2. Filiallar Ro'yxati */}
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

        {/* 3. Markaz Managerlari */}
        {center.managers && center.managers.length > 0 && (
          <div className="panel-card space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <UserCheck size={18} style={{ color: "var(--primary)" }} /> Markaz boshqaruvchilari ({center.managers.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {center.managers.map(m => (
                <div key={m.id} className="p-3.5 rounded-xl border flex items-center gap-3"
                  style={{ borderColor: "var(--border)", background: "var(--secondary-background)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                    style={{ background: "var(--primary-50)", color: "var(--primary)" }}>
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                      {m.name}
                    </div>
                    <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      @{m.username}
                    </div>
                    {m.phone && (
                      <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        {m.phone}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
