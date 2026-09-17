import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Plus, Search, Pencil, Trash2, X,
  Users, BookOpen, GitBranch, ChevronRight, Loader2,
  Phone, Mail, Globe, User, Lock, Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../config/axios";
import PhoneInput from "../../components/ui/PhoneInput";
import { cleanPhone } from "../../utils/formatPhone";

const emptyCenter = {
  name: "", phone: "+998 ", email: "", address: "", website: "",
  managerName: "", managerPhone: "+998 ",
  managerUsername: "", managerPassword: "",
};

function CenterModal({ initial = emptyCenter, onClose, onSave, loading }) {
  const [form, setForm] = useState(initial);
  const isEdit = !!initial.id;
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--card-background)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--primary-50)" }}>
              <Building2 size={20} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <div className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                {isEdit ? "Markazni tahrirlash" : "Yangi O'quv Markaz"}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {isEdit ? "Ma'lumotlarni o'zgartiring" : "Markaz va manager akkauntini yarating"}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--secondary-background)] transition-colors">
            <X size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[70vh] space-y-5">
          <div>
            <div className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Markaz ma'lumotlari
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Markaz nomi *</label>
                <input className="input-field" placeholder="Masalan: Najot Ta'lim" value={form.name} onChange={e => f("name", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Telefon</label>
                <PhoneInput className="input-field" placeholder="+998 90 123 45 67" value={form.phone} onChange={e => f("phone", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Email</label>
                <input className="input-field" placeholder="info@markaz.uz" value={form.email} onChange={e => f("email", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Veb-sayt</label>
                <input className="input-field" placeholder="https://markaz.uz" value={form.website} onChange={e => f("website", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Manzil</label>
                <input className="input-field" placeholder="Toshkent, Yunusobod tumani..." value={form.address} onChange={e => f("address", e.target.value)} />
              </div>
            </div>
          </div>

          {!isEdit && (
            <div>
              <div className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                Manager akkaunt
              </div>
              <div className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                Bu ma'lumotlar bilan markaz manageri tizimga kiradi
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Manager ismi *</label>
                  <input className="input-field" placeholder="Ism Familiya" value={form.managerName} onChange={e => f("managerName", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Manager telefoni</label>
                  <PhoneInput className="input-field" placeholder="+998 90 000 00 00" value={form.managerPhone} onChange={e => f("managerPhone", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Username *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                    <input className="input-field pl-8" placeholder="manager_username" value={form.managerUsername} onChange={e => f("managerUsername", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Parol *</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                    <input className="input-field pl-8" type="password" placeholder="Kamida 6 belgi" value={form.managerPassword} onChange={e => f("managerPassword", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors hover:bg-[var(--secondary-background)]"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            Bekor qilish
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={loading || !form.name || (!isEdit && (!form.managerUsername || !form.managerPassword || !form.managerName))}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {isEdit ? "Saqlash" : "Yaratish"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CenterCard({ center, onEdit, onDelete }) {
  const colorMap = ["#6366f1", "#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6"];
  const color = colorMap[(center.name?.charCodeAt(0) ?? 0) % colorMap.length];

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden transition-all hover:shadow-lg group"
      style={{ background: "var(--card-background)", border: "1px solid var(--border)" }}>
      <div className="h-2" style={{ background: color }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: color }}>
              {center.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-base leading-tight" style={{ color: "var(--text-primary)" }}>{center.name}</div>
              {center.address && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{center.address}</div>}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(center)} className="p-1.5 rounded-lg hover:bg-[var(--secondary-background)] transition-colors">
              <Pencil size={14} style={{ color: "var(--text-muted)" }} />
            </button>
            <button onClick={() => onDelete(center)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 size={14} className="text-red-400" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: GitBranch, label: "Filiallar", value: center._count?.branches ?? 0 },
            { icon: Users, label: "O'quvchilar", value: center._count?.students ?? 0 },
            { icon: BookOpen, label: "Guruhlar", value: center._count?.groups ?? 0 },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: "var(--secondary-background)" }}>
              <Icon size={14} className="mx-auto mb-1" style={{ color: "var(--text-muted)" }} />
              <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{value}</div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 mb-4">
          {center.phone && <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}><Phone size={12} /> {center.phone}</div>}
          {center.email && <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}><Mail size={12} /> {center.email}</div>}
          {center.website && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
              <Globe size={12} />
              <a href={center.website} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">
                {center.website.replace(/https?:\/\//, "")}
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {center.createdAt ? new Date(center.createdAt).toLocaleDateString("uz-UZ") : ""} da yaratilgan
          </div>
          <Link to={`/admin/centers/${center.id}`}
            className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "var(--primary)" }}>
            Ko'rish <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminCenters() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const { data: centers = [], isLoading } = useQuery({
    queryKey: ["admin-centers"],
    queryFn: () => api.get("/admin/centers").then(r => r.data?.data || r.data || []),
  });

  const createMut = useMutation({
    mutationFn: (d) => api.post("/admin/centers", d),
    onSuccess: () => {
      toast.success("O'quv markaz yaratildi!");
      qc.invalidateQueries({ queryKey: ["admin-centers"] });
      setModalOpen(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Xato yuz berdi"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/admin/centers/${id}`, d),
    onSuccess: () => {
      toast.success("Markaz yangilandi!");
      qc.invalidateQueries({ queryKey: ["admin-centers"] });
      setEditTarget(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Xato yuz berdi"),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/admin/centers/${id}`),
    onSuccess: () => {
      toast.success("O'quv markaz o'chirildi");
      qc.invalidateQueries({ queryKey: ["admin-centers"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Xato yuz berdi"),
  });

  const filtered = centers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.address?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (center) => {
    if (window.confirm(`"${center.name}" markazini o'chirishni xohlaysizmi? Bu jarayon qaytarilmas!`)) {
      deleteMut.mutate(center.id);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: "var(--background)" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>O'quv Markazlar</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Platforma mijozlari — O'quv markazlarni boshqaring</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 shadow-md"
          style={{ background: "var(--primary)" }}>
          <Plus size={16} /> Yangi markaz
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Jami markazlar", value: centers.length, color: "#6366f1" },
          { label: "Jami filiallar", value: centers.reduce((s, c) => s + (c._count?.branches ?? 0), 0), color: "#f59e0b" },
          { label: "Jami o'quvchilar", value: centers.reduce((s, c) => s + (c._count?.students ?? 0), 0), color: "#10b981" },
          { label: "Jami guruhlar", value: centers.reduce((s, c) => s + (c._count?.groups ?? 0), 0), color: "#3b82f6" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: "var(--card-background)", border: "1px solid var(--border)" }}>
            <div className="text-2xl font-bold mb-1" style={{ color }}>{value}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input className="input-field pl-9 text-sm" placeholder="Markaz nomi, email yoki manzil bo'yicha qidiring..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--primary)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Building2 size={48} className="mx-auto mb-4 opacity-20" style={{ color: "var(--text-muted)" }} />
          <div className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            {search ? "Qidiruvga mos markaz topilmadi" : "Hali birorta markaz qo'shilmagan"}
          </div>
          {!search && (
            <button onClick={() => setModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: "var(--primary)" }}>
              <Plus size={14} /> Birinchi markazni yarating
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map(center => (
              <CenterCard key={center.id} center={center} onEdit={c => setEditTarget(c)} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && <CenterModal onClose={() => setModalOpen(false)} onSave={d => createMut.mutate({ ...d, phone: cleanPhone(d.phone), managerPhone: cleanPhone(d.managerPhone) })} loading={createMut.isPending} />}
      </AnimatePresence>
      <AnimatePresence>
        {editTarget && <CenterModal initial={editTarget} onClose={() => setEditTarget(null)} onSave={d => updateMut.mutate({ ...d, phone: cleanPhone(d.phone), managerPhone: cleanPhone(d.managerPhone) })} loading={updateMut.isPending} />}
      </AnimatePresence>
    </div>
  );
}
