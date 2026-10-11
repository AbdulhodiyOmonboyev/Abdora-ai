import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCog, Plus, Shield, Users, Pencil, Trash2, Check,
  CheckSquare, Square, AlertCircle, Info, Lock,
  GraduationCap, BookOpen, Award, Calendar, CreditCard,
  Sparkles, Sliders, Layers
} from 'lucide-react';
import api from '../../../config/axios';
import toast from 'react-hot-toast';

const DEFAULT_PERMISSIONS = {
  users: { view: true, create: true, edit: false, delete: false },
  teachers: { view: true, manage: false },
  groups: { view: true, create: false, edit: false, delete: false },
  exams: { view: true, create: false, grade: false },
  attendance: { view: true, mark: true },
  lessons: { view: true, create: false },
  payments: { view: false, create: true },
  leads: { view: true, manage: true },
  branches: { view: true, create: false }, // Filial ochish faqat admin ixtiyorida!
  reports: { view: false, export: false }
};

const PRESETS = {
  reception: {
    label: "Qabulxona (Reception)",
    defaultName: "Qabulxonachi (Reception)",
    permissions: {
      users: { view: true, create: true, edit: true, delete: false },
      teachers: { view: true, manage: false },
      groups: { view: true, create: true, edit: false, delete: false },
      exams: { view: true, create: false, grade: false },
      attendance: { view: true, mark: true },
      lessons: { view: true, create: false },
      payments: { view: false, create: true },
      leads: { view: true, manage: true },
      branches: { view: true, create: false },
      reports: { view: false, export: false }
    }
  },
  manager: {
    label: "Menejer (Manager)",
    defaultName: "Menejer (Manager)",
    permissions: {
      users: { view: true, create: true, edit: true, delete: true },
      teachers: { view: true, manage: true },
      groups: { view: true, create: true, edit: true, delete: true },
      exams: { view: true, create: true, grade: true },
      attendance: { view: true, mark: true },
      lessons: { view: true, create: true },
      payments: { view: true, create: true },
      leads: { view: true, manage: true },
      branches: { view: true, create: false },
      reports: { view: true, export: true }
    }
  },
  teacher: {
    label: "O'qituvchi (Teacher)",
    defaultName: "O'qituvchi (Teacher)",
    permissions: {
      users: { view: true, create: false, edit: false, delete: false },
      teachers: { view: false, manage: false },
      groups: { view: true, create: false, edit: false, delete: false },
      exams: { view: true, create: true, grade: true },
      attendance: { view: true, mark: true },
      lessons: { view: true, create: true },
      payments: { view: false, create: false },
      leads: { view: false, manage: false },
      branches: { view: false, create: false },
      reports: { view: false, export: false }
    }
  },
  mock_examiner: {
    label: "Mock Examiner (Imtihon nazoratchisi)",
    defaultName: "Mock Examiner (Imtihon oluvchi)",
    permissions: {
      users: { view: true, create: false, edit: false, delete: false },
      teachers: { view: true, manage: false },
      groups: { view: true, create: false, edit: false, delete: false },
      exams: { view: true, create: true, grade: false },
      attendance: { view: false, mark: false },
      lessons: { view: true, create: false },
      payments: { view: false, create: false },
      leads: { view: false, manage: false },
      branches: { view: false, create: false },
      reports: { view: false, export: false }
    }
  },
  other: {
    label: "Boshqa (Maxsus rol)",
    defaultName: "",
    permissions: {
      users: { view: true, create: false, edit: false, delete: false },
      teachers: { view: true, manage: false },
      groups: { view: true, create: false, edit: false, delete: false },
      exams: { view: false, create: false, grade: false },
      attendance: { view: false, mark: false },
      lessons: { view: false, create: false },
      payments: { view: false, create: false },
      leads: { view: false, manage: false },
      branches: { view: false, create: false },
      reports: { view: false, export: false }
    }
  }
};

export default function CustomRolesTab({ selectedCenterId, currentCenter }) {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [baseRole, setBaseRole] = useState('reception');
  const [customBaseRole, setCustomBaseRole] = useState('');
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
    setCustomBaseRole('');
    setPermissions(PRESETS.reception.permissions);
  };

  const handleEdit = (r) => {
    setEditingRole(r);
    setRoleName(r.name || '');
    const knownKeys = ['reception', 'manager', 'teacher', 'mock_examiner'];
    if (knownKeys.includes(r.baseRole)) {
      setBaseRole(r.baseRole);
      setCustomBaseRole('');
    } else {
      setBaseRole('other');
      setCustomBaseRole(r.baseRole || '');
    }
    setPermissions(r.permissions || DEFAULT_PERMISSIONS);
    setShowModal(true);
  };

  const handleBaseRoleChange = (val) => {
    setBaseRole(val);
    if (PRESETS[val]) {
      const allDefaultNames = Object.values(PRESETS).map(p => p.defaultName).filter(Boolean);
      if (!roleName || allDefaultNames.includes(roleName)) {
        if (PRESETS[val].defaultName) {
          setRoleName(PRESETS[val].defaultName);
        }
      }
      if (!editingRole) {
        setPermissions(PRESETS[val].permissions);
      }
    }
  };

  const applyPreset = (presetKey) => {
    if (PRESETS[presetKey]) {
      setPermissions(PRESETS[presetKey].permissions);
      if (PRESETS[presetKey].defaultName && (!roleName || Object.values(PRESETS).some(p => p.defaultName === roleName))) {
        setRoleName(PRESETS[presetKey].defaultName);
      }
      if (presetKey !== 'other') {
        setBaseRole(presetKey);
      }
      toast.success(`${PRESETS[presetKey].label} ruxsatlari qo'llandi`);
    }
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

    const finalBaseRole = baseRole === 'other'
      ? (customBaseRole.trim() || 'custom')
      : baseRole;

    const payload = {
      centerId: selectedCenterId,
      name: roleName.trim(),
      baseRole: finalBaseRole,
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
            Mavjud menejer, qabulxona, mock examiner yoki erkin lavozimlar asosida alohida ruxsatlar bilan yangi rollar yarating
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
                    title="Tahrirlash"
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
                    title="O'chirish"
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
                {r.permissions?.teachers?.view && (
                  <span className="badge badge-outline text-[10px] text-purple-600 border-purple-500/30">O'qituvchilar</span>
                )}
                {r.permissions?.groups?.view && (
                  <span className="badge badge-outline text-[10px]">Guruhlar</span>
                )}
                {r.permissions?.exams?.view && (
                  <span className={`badge badge-outline text-[10px] ${
                    r.permissions?.exams?.grade ? 'text-amber-600 border-amber-500/30' : 'text-blue-600 border-blue-500/30'
                  }`}>
                    Imtihonlar {r.permissions?.exams?.grade ? '(Baho qo\'yish)' : '(Bahosiz)'}
                  </span>
                )}
                {r.permissions?.attendance?.mark ? (
                  <span className="badge badge-outline text-[10px] text-cyan-600 border-cyan-500/30">Davomat qo'yish</span>
                ) : r.permissions?.attendance?.view ? (
                  <span className="badge badge-outline text-[10px]">Davomat (ko'rish)</span>
                ) : null}
                {r.permissions?.payments?.create && (
                  <span className="badge badge-outline text-[10px] text-emerald-600 border-emerald-500/30">To'lov qabuli</span>
                )}
                {r.permissions?.lessons?.view && (
                  <span className="badge badge-outline text-[10px]">Darslar</span>
                )}
                {r.permissions?.leads?.manage && (
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
            Hozircha maxsus rollar yaratilmagan. Yuqoridagi tugma orqali "Mock Examiner", "Qabulxonachi" kabi yangi rollar qo'shishingiz mumkin.
          </div>
        )}
      </div>

      {/* ─── CREATE / EDIT MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  {editingRole ? "Maxsus rolni tahrirlash" : "Yangi maxsus rol yaratish"}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Xodim uchun aniq vakolatlarni belgilang (masalan: Mock examiner faqat ko'radi, baho va davomat qo'ya olmaydi)
                </p>
              </div>
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
                    placeholder="Masalan: Mock Examiner, Qabulxona..."
                    value={roleName}
                    onChange={e => setRoleName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-medium block mb-1">Asosiy rol shabloni</label>
                  <select
                    className="input-field"
                    value={baseRole}
                    onChange={e => handleBaseRoleChange(e.target.value)}
                  >
                    <option value="reception">Qabulxona (Reception)</option>
                    <option value="manager">Menejer (Manager)</option>
                    <option value="teacher">O'qituvchi (Teacher)</option>
                    <option value="mock_examiner">Mock Examiner (Imtihon oluvchi)</option>
                    <option value="other">Boshqa (Maxsus / O'zim kiritaman)</option>
                  </select>
                </div>

                {/* When "Boshqa" is selected: custom input appears */}
                {baseRole === 'other' && (
                  <div className="sm:col-span-2 p-3.5 rounded-2xl bg-[var(--secondary-background)] border border-dashed border-indigo-500/40 space-y-1">
                    <label className="font-bold block text-xs text-[var(--text-primary)]">
                      Boshqa rol / lavozim nomi yoki kaliti *
                    </label>
                    <input
                      className="input-field bg-[var(--card)]"
                      placeholder="Masalan: mock_examiner, kurator, metodist, hisobchi, nazoratchi..."
                      value={customBaseRole}
                      onChange={e => setCustomBaseRole(e.target.value)}
                    />
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Ushbu yangi rol uchun mustaqil nom kiriting. Quyidagi matritsa orqali uning barcha vakolatlarini o'zingiz sozlang.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Presets Bar */}
              <div className="p-3 rounded-2xl bg-[var(--secondary-background)] border border-[var(--border)] space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)]">
                  <Sliders size={13} className="text-indigo-500" /> Tezkor ruxsatlar shabloni:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('mock_examiner')}
                    className="btn-outline btn-xs py-1 px-2.5 text-[11px] hover:border-indigo-500 hover:text-indigo-600 bg-[var(--card)]"
                  >
                    🎯 Mock Examiner (O'quvchi & guruhlarni ko'radi, baho va davomat yo'q)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('reception')}
                    className="btn-outline btn-xs py-1 px-2.5 text-[11px] bg-[var(--card)]"
                  >
                    Qabulxona
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('teacher')}
                    className="btn-outline btn-xs py-1 px-2.5 text-[11px] bg-[var(--card)]"
                  >
                    O'qituvchi
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('manager')}
                    className="btn-outline btn-xs py-1 px-2.5 text-[11px] bg-[var(--card)]"
                  >
                    Menejer
                  </button>
                </div>
              </div>

              {/* Fine-grained permissions matrix */}
              <div className="space-y-3 pt-1">
                <h4 className="font-bold text-xs text-[var(--text-primary)] border-b border-[var(--border)] pb-1.5 flex items-center justify-between">
                  <span>Ruxsatlar Matritsasi (Permissions)</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-normal">
                    Kerakli vakolatlarni belgilang yoki o'chiring
                  </span>
                </h4>

                {/* 1. O'quvchilar section */}
                <div className="p-3.5 rounded-2xl bg-[var(--secondary-background)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                      <GraduationCap size={15} className="text-purple-500" /> O'quvchilar & Foydalanuvchilar:
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">Talabalar ro'yxati</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      ['view', "Ko'rish (Ro'yxat)"],
                      ['create', "Qo'shish"],
                      ['edit', "Tahrirlash"],
                      ['delete', "O'chirish"]
                    ].map(([act, label]) => (
                      <label key={act} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--card)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!permissions.users?.[act]}
                          onChange={() => togglePermission('users', act)}
                          className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-medium text-[var(--text-primary)]">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 2. O'qituvchilar section */}
                <div className="p-3.5 rounded-2xl bg-[var(--secondary-background)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                      <Users size={15} className="text-blue-500" /> O'qituvchilar (Ustozlar):
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">O'qituvchilar bilan ishlash</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--card)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.teachers?.view}
                        onChange={() => togglePermission('teachers', 'view')}
                        className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-[var(--text-primary)]">O'qituvchilarni ko'rish</span>
                    </label>
                    <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--card)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.teachers?.manage}
                        onChange={() => togglePermission('teachers', 'manage')}
                        className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-[var(--text-primary)]">O'qituvchi qo'shish / boshqarish</span>
                    </label>
                  </div>
                </div>

                {/* 3. Guruhlar section */}
                <div className="p-3.5 rounded-2xl bg-[var(--secondary-background)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                      <Layers size={15} className="text-emerald-500" /> Guruhlar:
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">Dars guruhlari</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      ['view', "Ko'rish"],
                      ['create', "Guruh ochish"],
                      ['edit', "Tahrirlash"],
                      ['delete', "O'chirish"]
                    ].map(([act, label]) => (
                      <label key={act} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--card)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!permissions.groups?.[act]}
                          onChange={() => togglePermission('groups', act)}
                          className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-medium text-[var(--text-primary)]">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 4. Imtihonlar & Baholash section (Mock exam) */}
                <div className="p-3.5 rounded-2xl bg-[var(--secondary-background)] space-y-2.5 border border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                      <Award size={15} className="text-amber-500" /> Imtihonlar & Baholash (Mock Exam / Tests):
                    </span>
                    <span className="text-[10px] text-amber-600 font-medium">Mock Examiner nazorati</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--card)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.exams?.view}
                        onChange={() => togglePermission('exams', 'view')}
                        className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-[var(--text-primary)]">Imtihon & Natijalarni ko'rish</span>
                    </label>

                    <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--card)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.exams?.create}
                        onChange={() => togglePermission('exams', 'create')}
                        className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-[var(--text-primary)]">Imtihon / Mock test yaratish</span>
                    </label>

                    <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--card)] cursor-pointer bg-amber-500/5 border border-amber-500/20">
                      <input
                        type="checkbox"
                        checked={!!permissions.exams?.grade}
                        onChange={() => togglePermission('exams', 'grade')}
                        className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-bold text-[var(--text-primary)] block">Baho / Ball qo'yish</span>
                        <span className="text-[10px] text-[var(--text-secondary)]">O'chirilsa: faqat ko'radi, baholay olmaydi</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 5. Davomat section */}
                <div className="p-3.5 rounded-2xl bg-[var(--secondary-background)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                      <Calendar size={15} className="text-cyan-500" /> Davomat:
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">O'quvchilar davomati</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--card)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.attendance?.view}
                        onChange={() => togglePermission('attendance', 'view')}
                        className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-[var(--text-primary)]">Davomatni ko'rish</span>
                    </label>

                    <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--card)] cursor-pointer bg-cyan-500/5 border border-cyan-500/20">
                      <input
                        type="checkbox"
                        checked={!!permissions.attendance?.mark}
                        onChange={() => togglePermission('attendance', 'mark')}
                        className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-bold text-[var(--text-primary)] block">Davomat qo'yish / belgilash</span>
                        <span className="text-[10px] text-[var(--text-secondary)]">O'chirilsa: davomat qila olmaydi</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 6. Darslar & Materiallar section */}
                <div className="p-3.5 rounded-2xl bg-[var(--secondary-background)] space-y-2.5">
                  <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                    <BookOpen size={15} className="text-rose-500" /> Darslar & Materiallar (LMS):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--card)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.lessons?.view}
                        onChange={() => togglePermission('lessons', 'view')}
                        className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-[var(--text-primary)]">Materiallarni ko'rish</span>
                    </label>
                    <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--card)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.lessons?.create}
                        onChange={() => togglePermission('lessons', 'create')}
                        className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-[var(--text-primary)]">Dars / material yuklash</span>
                    </label>
                  </div>
                </div>

                {/* 7. To'lovlar & Kassa section */}
                <div className="p-3.5 rounded-2xl bg-[var(--secondary-background)] space-y-2.5">
                  <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                    <CreditCard size={15} className="text-emerald-600" /> To'lovlar & Kassa:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--card)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.payments?.view}
                        onChange={() => togglePermission('payments', 'view')}
                        className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-[var(--text-primary)]">Hisobotlarni ko'rish</span>
                    </label>
                    <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--card)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.payments?.create}
                        onChange={() => togglePermission('payments', 'create')}
                        className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-[var(--text-primary)]">To'lov qabul qilish (Kassa)</span>
                    </label>
                  </div>
                </div>

                {/* 8. CRM & Lidlar section */}
                <div className="p-3.5 rounded-2xl bg-[var(--secondary-background)] space-y-2.5">
                  <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                    <Sparkles size={15} className="text-amber-500" /> Lidlar & CRM:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--card)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.leads?.view}
                        onChange={() => togglePermission('leads', 'view')}
                        className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-[var(--text-primary)]">Lidlarni ko'rish</span>
                    </label>
                    <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--card)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.leads?.manage}
                        onChange={() => togglePermission('leads', 'manage')}
                        className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-[var(--text-primary)]">Lidlar bilan ishlash</span>
                    </label>
                  </div>
                </div>

                {/* Branch restriction notice */}
                <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-amber-600 space-y-1">
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
