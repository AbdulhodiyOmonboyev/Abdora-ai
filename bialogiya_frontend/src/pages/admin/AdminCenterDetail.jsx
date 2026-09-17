import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, ArrowLeft, GitBranch, Users, BookOpen, UserCheck,
  Phone, Mail, Globe, MapPin, Pencil, Trash2, Check, X,
  Loader2, Shield, Calendar, User, Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../config/axios";
import StatusBadge from "../../components/ui/StatusBadge";
import PhoneInput from "../../components/ui/PhoneInput";
import { cleanPhone } from "../../utils/formatPhone";

export default function AdminCenterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

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
          { label: "Filiallar", value: center.branches?.length ?? center._count?.branches ?? 0, icon: GitBranch, color: "#6366f1" },
          { label: "O'quvchilar", value: center.studentsCount ?? 0, icon: Users, color: "#10b981" },
          { label: "O'qituvchilar", value: center.teachersCount ?? 0, icon: BookOpen, color: "#f59e0b" },
          { label: "Guruhlar", value: center._count?.groups ?? 0, icon: UserCheck, color: "#3b82f6" },
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
        {/* Left 2 cols: Details & Edit */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="panel-card space-y-4">
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              🏢 Markaz ma'lumotlari
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

          {/* Filiallar (Branches) Table */}
          <div className="panel-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                📍 Markazga qarashli filiallar ({center.branches?.length || 0})
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
                        <td className="font-semibold" style={{ color: "var(--text-primary)" }}>
                          {b.name}
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>{b.address || "—"}</td>
                        <td>{b._count?.groups || 0}</td>
                        <td>{b._count?.teachers || 0}</td>
                        <td>
                          <StatusBadge status={b.isActive ? "faol" : "nofaol"} />
                        </td>
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

        {/* Right col: Manager Accounts */}
        <div className="space-y-6">
          <div className="panel-card space-y-4">
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              👤 Boshqaruvchi (Manager) akkaunt
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
            <div className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
              ℹ️ SaaS Boshqaruvi haqida
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
