import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCog, Plus, Shield, Users, Pencil, Trash2, Check,
  CheckSquare, Square, AlertCircle, Info, Lock
} from 'lucide-react';
import api from '../../../config/axios';
import toast from 'react-hot-toast';

const DEFAULT_PERMISSIONS = {
  users: { view: true, create: true, edit: false, delete: false },
  groups: { view: true, create: false, edit: false, delete: false },
  payments: { view: false, create: true, edit: false },
  attendance: { view: true, mark: true },
  leads: { view: true, create: true, edit: true },
  branches: { view: true, create: false }, // Filial ochish faqat admin ixtiyorida!
  reports: { view: false, export: false }
};

export default function CustomRolesTab({ selectedCenterId, currentCenter }) {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [baseRole, setBaseRole] = useState('reception');
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);

  // Fetch custom roles for this center
  const { data: customRoles = [], isLoading } = useQuery({
    queryKey: ['custom-roles', selectedCenterId],
    queryFn: () => api.get('/custom-roles', {
      params: { ...(selectedCenterId && { centerId: selectedCenterId }) }
    }).then(r => r.data?.data || []),
    enabled: !!selectedCenterId
  });

  const createRoleMutation = useMutation({
    mutationFn: (d) => api.post('/custom-roles', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-roles', selectedCenterId] });
      setShowModal(false);
      resetForm();
      toast.success("Yangi maxsus rol yaratildi");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Xatolik yuz berdi")
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/custom-roles/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-roles', selectedCenterId] });
      setShowModal(false);
      resetForm();
      toast.success("Rol muvaffaqiyatli yangilandi");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Xatolik yuz berdi")
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => api.delete(`/custom-roles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-roles', selectedCenterId] });
      toast.success("Maxsus rol o'chirildi");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Xatolik yuz berdi")
  });

  const resetForm = () => {
    setEditingRole(null);
    setRoleName('');
    setBaseRole('reception');
    setPermissions(DEFAULT_PERMISSIONS);
  };

  const handleEdit = (r) => {
    setEditingRole(r);
    setRoleName(r.name);
    setBaseRole(r.baseRole || 'reception');
    setPermissions(r.permissions || DEFAULT_PERMISSIONS);
    setShowModal(true);
  };

  const togglePermission = (section, action) => {
    setPermissions(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [action]: !prev[section]?.[action]
      }
    }));
  };

  const handleSave = () => {
    if (!roleName.trim()) return toast.error("Rol nomi kiritilishi shart");
    if (!selectedCenterId) return toast.error("O'quv markaz tanlanmagan");

    const payload = {
      centerId: selectedCenterId,
      name: roleName.trim(),
      baseRole,
      permissions
    };

    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data: payload });
    } else {
      createRoleMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Info ─── */}
      <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <UserCog size={16} className="text-indigo-500" /> Maxsus Markaz Rollari (Custom Roles)
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Mavjud menejer va qabulxona asosida alohida ruxsatlar bilan yangi lavozimlar yarating
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary text-xs flex items-center gap-1.5"
        >
          <Plus size={14} /> Yangi maxsus rol yaratish
        </button>
      </div>

      {/* ─── Roles List ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {customRoles.map((r) => (
          <div
            key={r.id}
            className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">{r.name}</h4>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Asosiy rol: <strong className="capitalize">{r.baseRole}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(r)}
                    className="p-1.5 rounded-lg hover:bg-[var(--secondary-background)] text-[var(--text-muted)]"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`"${r.name}" rolini o'chirishni xohlaysizmi?`)) {
                        deleteRoleMutation.mutate(r.id);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Perms summary tags */}
              <div className="flex flex-wrap gap-1.5 my-3">
                {r.permissions?.users?.view && (
                  <span className="badge badge-outline text-[10px]">O'quvchilar</span>
                )}
                {r.permissions?.groups?.view && (
                  <span className="badge badge-outline text-[10px]">Guruhlar</span>
                )}
                {r.permissions?.payments?.create && (
                  <span className="badge badge-outline text-[10px] text-emerald-600 border-emerald-500/30">To'lov qabuli</span>
                )}
                {r.permissions?.attendance?.mark && (
                  <span className="badge badge-outline text-[10px]">Davomat</span>
                )}
                {r.permissions?.leads?.create && (
                  <span className="badge badge-outline text-[10px]">Lidlar</span>
                )}
                {!r.permissions?.branches?.create && (
                  <span className="badge text-[10px] bg-amber-500/10 text-amber-600 flex items-center gap-1">
                    <Lock size={10} /> Filial ochish cheklangan
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)] flex justify-between items-center">
              <span>Biriktirilgan xodimlar: <strong>{r._count?.users || 0} ta</strong></span>
              <span className={r.isActive ? "text-emerald-500 font-semibold" : "text-rose-500"}>
                {r.isActive ? "Faol" : "Nofaol"}
              </span>
            </div>
          </div>
        ))}

        {customRoles.length === 0 && (
          <div className="md:col-span-2 text-center py-12 p-6 rounded-2xl border border-dashed border-[var(--border)] text-xs text-[var(--text-muted)]">
            Hozircha maxsus rollar yaratilmagan. Yuqoridagi tugma orqali "Qabulxonachi" kabi yangi rollar qo'shishingiz mumkin.
          </div>
        )}
      </div>

      {/* ─── CREATE / EDIT MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                {editingRole ? "Maxsus rolni tahrirlash" : "Yangi maxsus rol yaratish"}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5 rounded-lg text-xs">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium block mb-1">Rol nomi *</label>
                  <input
                    className="input-field"
                    placeholder="Qabulxonachi (Reception)"
                    value={roleName}
                    onChange={e => setRoleName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-medium block mb-1">Asosiy rol shabloni</label>
                  <select
                    className="input-field"
                    value={baseRole}
                    onChange={e => setBaseRole(e.target.value)}
                  >
                    <option value="reception">Qabulxona (Reception)</option>
                    <option value="manager">Menejer (Manager)</option>
                    <option value="teacher">O'qituvchi (Teacher)</option>
                  </select>
                </div>
              </div>

              {/* Fine-grained permissions matrix */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs text-[var(--text-primary)] border-b border-[var(--border)] pb-1.5">
                  Ruxsatlar Matritsasi (Permissions)
                </h4>

                {/* Users section */}
                <div className="p-3 rounded-xl bg-[var(--secondary-background)] space-y-2">
                  <span className="font-semibold text-[var(--text-primary)] block">O'quvchilar & Foydalanuvchilar:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      ['view', "Ko'rish"],
                      ['create', "Qo'shish"],
                      ['edit', "Tahrirlash"],
                      ['delete', "O'chirish"]
                    ].map(([act, label]) => (
                      <label key={act} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!permissions.users?.[act]}
                          onChange={() => togglePermission('users', act)}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Groups section */}
                <div className="p-3 rounded-xl bg-[var(--secondary-background)] space-y-2">
                  <span className="font-semibold text-[var(--text-primary)] block">Guruhlar:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      ['view', "Ko'rish"],
                      ['create', "Guruh ochish"],
                      ['edit', "Tahrirlash"],
                      ['delete', "O'chirish"]
                    ].map(([act, label]) => (
                      <label key={act} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!permissions.groups?.[act]}
                          onChange={() => togglePermission('groups', act)}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Payments section */}
                <div className="p-3 rounded-xl bg-[var(--secondary-background)] space-y-2">
                  <span className="font-semibold text-[var(--text-primary)] block">To'lovlar & Kassa:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.payments?.view}
                        onChange={() => togglePermission('payments', 'view')}
                      />
                      <span>Hisobotlarni ko'rish</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.payments?.create}
                        onChange={() => togglePermission('payments', 'create')}
                      />
                      <span>To'lov qabul qilish</span>
                    </label>
                  </div>
                </div>

                {/* Attendance section */}
                <div className="p-3 rounded-xl bg-[var(--secondary-background)] space-y-2">
                  <span className="font-semibold text-[var(--text-primary)] block">Davomat:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.attendance?.view}
                        onChange={() => togglePermission('attendance', 'view')}
                      />
                      <span>Davomatni ko'rish</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.attendance?.mark}
                        onChange={() => togglePermission('attendance', 'mark')}
                      />
                      <span>Davomat qo'yish</span>
                    </label>
                  </div>
                </div>

                {/* Branch restriction notice */}
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-600 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Lock size={13} /> Yangi filial ochish huquqi:
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Ushbu rol filial yoki yangi o'quv markaz ocha olmaydi. Yangi filial va markazlar faqat Super Admin tomonidan shartnoma asosida ochib beriladi.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button onClick={() => setShowModal(false)} className="btn-ghost text-xs">
                Bekor qilish
              </button>
              <button
                onClick={handleSave}
                disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                className="btn-primary text-xs"
              >
                {createRoleMutation.isPending || updateRoleMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
