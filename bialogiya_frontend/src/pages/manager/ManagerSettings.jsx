import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Building2, CreditCard, BookOpen, Target, Bell, User,
  Lock, Unlock, PieChart, Wallet, Calendar, Users, GraduationCap,
  BookMarked, Plus, X, Pencil, Trash2, Copy, Save, Check, KeyRound,
  Sun, Moon, Palette, AlertCircle, Phone, Smartphone, Banknote
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import PageHeader from '../../components/ui/PageHeader';
import PhoneInput from '../../components/ui/PhoneInput';
import StatusBadge from '../../components/ui/StatusBadge';
import { cleanPhone } from '../../utils/formatPhone';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import ThemeBuilder from '../../components/ui/ThemeBuilder';

const MANAGER_NAV_ITEMS = [
  { id: 'reception_control', label: 'Qabulxona (Reception)',    icon: ShieldCheck },
  { id: 'branch_info',       label: 'Filial ma\'lumotlari',     icon: Building2 },
  { id: 'payments',          label: 'To\'lovlar & Qoidalar',    icon: CreditCard },
  { id: 'lms_rules',         label: 'LMS & Ta\'lim qoidalari',  icon: BookOpen },
  { id: 'crm_leads',         label: 'CRM & Lidlar sozlamasi',   icon: Target },
  { id: 'notifications',     label: 'Bildirishnomalar (SMS)',   icon: Bell },
  { id: 'themes',            label: 'Mavzular & Ko\'rinish',    icon: Palette },
  { id: 'personal',          label: 'Mening hisobim & Parol',   icon: User },
];

function SectionHeader({ kicker, title, subtitle }) {
  return (
    <div className="pb-4 border-b border-[var(--border)]">
      {kicker && <span className="panel-kicker">{kicker}</span>}
      <h2 className="panel-title mt-0.5">{title}</h2>
      {subtitle && <p className="panel-subtitle mt-1">{subtitle}</p>}
    </div>
  );
}

function SettingRow({ label, hint, children, noBorder = false }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-3.5 ${!noBorder ? 'border-b border-[var(--border)]' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--text-primary)]">{label}</div>
        {hint && <div className="text-xs mt-0.5 text-[var(--text-secondary)]">{hint}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-[var(--primary)]' : 'bg-gray-300 dark:bg-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function ManagerSettings() {
  const qc = useQueryClient();
  const { user, updateUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTabState] = useState(urlTab || 'reception_control');
  const [saved, setSaved] = useState(false);

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  // Reception user modals
  const [showAddReception, setShowAddReception] = useState(false);
  const [receptionForm, setReceptionForm] = useState({ name: '', phone: '+998 ', branchId: '', password: '' });
  const [newReceptionCreds, setNewReceptionCreds] = useState(null);
  const [editingReception, setEditingReception] = useState(null);

  // Profile and password state
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '+998 ' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  // Manager settings state
  const [settings, setSettings] = useState({
    centerName: '',
    centerAddress: '',
    centerPhone: '',
    centerWorkingHours: '08:00 — 20:00',
    lessonDurationMinutes: 90,
    maxStudentsPerGroup: 16,
    minAttendancePercent: 80,
    passingScorePercent: 60,
    allowInstallments: true,
    paymentDueDay: 5,
    enabledPaymentMethods: ['cash', 'click', 'payme'],
    smsOnAbsence: true,
    smsOnPayment: true,
    smsPaymentReminder: true,
    receptionPermissions: {
      canViewFinance: false,
      canViewCashbox: false,
      canManagePayments: true,
      canManageLeads: true,
      canManageTimetable: true,
      canManageGroups: true,
      canManageStudents: true,
      canManageTeachers: true,
    },
  });

  // Query settings
  const { data: serverSettings } = useQuery({
    queryKey: ['manager-settings', user?.id, user?.centerId],
    queryFn: () => api.get('/admin/settings').then(r => r.data?.data || {}),
  });

  // Query reception accounts
  const { data: receptionUsers = [] } = useQuery({
    queryKey: ['reception-users'],
    queryFn: () => api.get('/admin/reception-users').then(r => r.data?.data || []).catch(() => []),
  });

  // Query branches
  const { data: branches = [] } = useQuery({
    queryKey: ['manager-branches-list'],
    queryFn: () => api.get('/admin/branches').then(r => r.data?.data || r.data || []).catch(() => []),
  });

  useEffect(() => {
    if (serverSettings && typeof serverSettings === 'object') {
      setSettings(prev => ({
        ...prev,
        ...serverSettings,
        receptionPermissions: {
          ...prev.receptionPermissions,
          ...(serverSettings.receptionPermissions || {}),
        },
      }));
    }
  }, [serverSettings]);

  const saveMutation = useMutation({
    mutationFn: (d) => api.put('/admin/settings', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager-settings'] });
      qc.invalidateQueries({ queryKey: ['center-settings'] });
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success('Sozlamalar saqlandi');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xatolik yuz berdi'),
  });

  const createReceptionMutation = useMutation({
    mutationFn: (d) => api.post('/admin/reception-users', d),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['reception-users'] });
      setNewReceptionCreds(data.data?.credentials);
      setReceptionForm({ name: '', phone: '+998 ', branchId: '', password: '' });
      toast.success('Qabulxona hisobi yaratildi');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xatolik'),
  });

  const toggleReceptionStatusMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reception-users'] }),
  });

  const profileMutation = useMutation({
    mutationFn: (d) => api.put('/users/profile', { ...d, phone: cleanPhone(d.phone) }),
    onSuccess: ({ data }) => {
      updateUser(data.data);
      toast.success('Profil ma\'lumotlari saqlandi');
    },
    onError: (err) => toast.error(friendlyAiErrorMessage(err)),
  });

  const passwordMutation = useMutation({
    mutationFn: (d) => api.post('/users/change-password', d),
    onSuccess: () => {
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (err) => toast.error(friendlyAiErrorMessage(err)),
  });

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  const togglePerm = (permKey) => {
    const updated = {
      ...(settings.receptionPermissions || {}),
      [permKey]: !settings.receptionPermissions?.[permKey],
    };
    set('receptionPermissions', updated);
    api.put('/admin/settings', { receptionPermissions: updated })
      .then(() => {
        qc.invalidateQueries({ queryKey: ['manager-settings'] });
        qc.invalidateQueries({ queryKey: ['center-settings'] });
      })
      .catch(() => {});
    toast.success("Ruxsat holati yangilandi");
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Nusxalandi!');
  };

  const isFinanceBlocked =
    settings.receptionPermissions?.canViewFinance === false &&
    settings.receptionPermissions?.canViewCashbox === false;

  const toggleFinanceCashboxBlock = () => {
    const nextBlocked = !isFinanceBlocked;
    const updated = {
      ...(settings.receptionPermissions || {}),
      canViewFinance: !nextBlocked,
      canViewCashbox: !nextBlocked,
    };
    set('receptionPermissions', updated);
    api.put('/admin/settings', { receptionPermissions: updated })
      .then(() => {
        qc.invalidateQueries({ queryKey: ['manager-settings'] });
        qc.invalidateQueries({ queryKey: ['center-settings'] });
      })
      .catch(() => {});
    toast.success(nextBlocked ? "Moliya va Kassa qabulxona uchun bloklandi!" : "Moliya va Kassa qabulxona uchun ochildi!");
  };

  const togglePaymentMethod = (key) => {
    const cur = settings.enabledPaymentMethods || [];
    const next = cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key];
    set('enabledPaymentMethods', next);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) return toast.error("Barcha maydonlarni to'ldiring");
    if (pwForm.newPassword.length < 6) return toast.error("Yangi parol kamida 6 ta belgidan iborat bo'lsin");
    if (pwForm.newPassword !== pwForm.confirm) return toast.error("Yangi parollar mos kelmadi");
    passwordMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
  };

  return (
    <div className="dashboard-shell">
      <PageHeader
        title="Menejer sozlamalari"
        subtitle="Qabulxona boshqaruvi, filial operatsiyalari, to'lovlar va o'quv jarayoni"
        action={
          <button
            onClick={() => saveMutation.mutate(settings)}
            disabled={saveMutation.isPending}
            className="btn-primary"
          >
            {saved ? (
              <><Check size={16} /> Saqlandi!</>
            ) : saveMutation.isPending ? (
              'Saqlanmoqda...'
            ) : (
              <><Save size={16} /> Saqlash</>
            )}
          </button>
        }
      />

      <div className="settings-shell">
        {/* ── Left Navigation ── */}
        <nav className="settings-nav space-y-0.5">
          {MANAGER_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`settings-nav-item w-full ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                <span className="flex-1 text-left text-sm">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Right Content ── */}
        <div className="min-w-0 space-y-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              {/* TAB 1: QABULXONA (RECEPTION) NAZORATI */}
              {activeTab === 'reception_control' && (
                <div className="space-y-5">
                  {/* 1-Bosishda bloklash banneri */}
                  <div
                    className="p-5 rounded-2xl border transition-all"
                    style={{
                      background: isFinanceBlocked
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)'
                        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
                      borderColor: isFinanceBlocked
                        ? 'rgba(239, 68, 68, 0.25)'
                        : 'rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isFinanceBlocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isFinanceBlocked ? '#ef4444' : '#10b981',
                          }}
                        >
                          {isFinanceBlocked ? <Lock size={22} /> : <Unlock size={22} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-[var(--text-primary)]">
                              Moliya va Kassa xavfsizligi
                            </h3>
                            <span className={`badge text-xs ${isFinanceBlocked ? 'badge-danger' : 'badge-success'}`}>
                              {isFinanceBlocked ? 'Moliya va Kassa yopiq (Bloklangan)' : 'Moliya va Kassa ochiq'}
                            </span>
                          </div>
                          <p className="text-xs mt-1 text-[var(--text-secondary)]">
                            {isFinanceBlocked
                              ? "Qabulxona xodimlari Moliya dashboardi, hisobotlar va Kassani ko'ra olmaydi."
                              : "Qabulxona xodimlariga Moliya va Kassa menyusi va sahifalari ochiq."}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={toggleFinanceCashboxBlock}
                        className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors flex-shrink-0 ${
                          isFinanceBlocked
                            ? 'btn-primary'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                      >
                        {isFinanceBlocked ? (
                          <><Unlock size={16} /> Moliya va Kassaga ruxsat berish</>
                        ) : (
                          <><Lock size={16} /> 1 bosishda bloklash</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Aniq ruxsatlar paneli */}
                  <div className="panel-card space-y-4">
                    <SectionHeader
                      kicker="Ruxsatlar"
                      title="Qabulxona xodimlarining aniq ruxsatlari"
                      subtitle="Har bir amal va bo'lim bo'yicha mustaqil nazorat"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { key: 'canViewFinance', label: 'Moliya sahifasi va hisobotlari', hint: 'Moliya dashboardi, sof daromad, oylik statistika', icon: PieChart, color: '#6366f1' },
                        { key: 'canViewCashbox', label: 'Kassa va naqd tushumlar', hint: 'Kassa qoldig\'i, kirim-chiqimlar va kassa jurnali', icon: Wallet, color: '#10b981' },
                        { key: 'canManagePayments', label: "To'lovlarni qabul qilish", hint: "O'quvchilardan to'lov olish va kvitansiya chiqarish", icon: CreditCard, color: '#f59e0b' },
                        { key: 'canManageLeads', label: 'Lidlar (CRM) bilan ishlash', hint: "Yangi murojaatlarni kiritish, qo'ng'iroqlar va statuslar", icon: Target, color: '#ec4899' },
                        { key: 'canManageTimetable', label: 'Dars jadvali va xonalar', hint: "O'quv xonalari va dars jadvallarini ko'rish", icon: Calendar, color: '#06b6d4' },
                        { key: 'canManageGroups', label: 'Guruhlar ro\'yxati', hint: "Guruhlar, dars kunlari va guruh tarkibini ko'rish", icon: Users, color: '#3b82f6' },
                        { key: 'canManageStudents', label: "O'quvchilar ro'yxati", hint: "O'quvchilar ma'lumotlari va profilini ko'rish", icon: GraduationCap, color: '#8b5cf6' },
                        { key: 'canManageTeachers', label: "O'qituvchilar ro'yxati", hint: "O'qituvchilar va ularning guruhlarini ko'rish", icon: BookMarked, color: '#14b8a6' },
                      ].map((perm) => {
                        const isChecked = settings.receptionPermissions?.[perm.key] !== false;
                        const Icon = perm.icon;
                        return (
                          <div
                            key={perm.key}
                            className="p-3.5 rounded-xl border border-[var(--border)] flex items-center justify-between gap-3"
                            style={{ backgroundColor: 'var(--card)' }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: `${perm.color}15`,
                                  color: perm.color,
                                }}
                              >
                                <Icon size={18} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                                  {perm.label}
                                </div>
                                <div className="text-[11px] text-[var(--text-secondary)] truncate">
                                  {perm.hint}
                                </div>
                              </div>
                            </div>
                            <ToggleSwitch
                              checked={isChecked}
                              onChange={() => togglePerm(perm.key)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Qabulxona xodimlari ro'yxati */}
                  <div className="panel-card space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-[var(--text-primary)]">Qabulxona hisoblari</h3>
                        <p className="text-xs text-[var(--text-secondary)]">Filialingizdagi reception xodimlari</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddReception(true)}
                        className="btn-primary btn-sm flex items-center gap-1.5"
                      >
                        <Plus size={14} /> Hisob qo'shish
                      </button>
                    </div>

                    <div className="table-shell">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Xodim</th>
                            <th>Telefon</th>
                            <th>Filial</th>
                            <th>Holati</th>
                            <th className="text-right">Amal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receptionUsers.map((u) => (
                            <tr key={u.id}>
                              <td>
                                <div className="font-semibold text-xs text-[var(--text-primary)]">{u.name}</div>
                                <div className="text-[11px] text-[var(--text-muted)]">@{u.username}</div>
                              </td>
                              <td className="text-xs font-mono text-[var(--text-secondary)]">
                                {u.phone || '—'}
                              </td>
                              <td className="text-xs text-[var(--text-secondary)]">
                                {u.branch?.name || (u.branches?.length > 0 ? u.branches.map(b => b.name).join(', ') : 'Umumiy')}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => toggleReceptionStatusMutation.mutate(u.id)}
                                  className="cursor-pointer active:scale-95"
                                >
                                  <StatusBadge status={u.isActive ? 'faol' : 'nofaol'} />
                                </button>
                              </td>
                              <td className="text-right">
                                <button
                                  type="button"
                                  onClick={() => toggleReceptionStatusMutation.mutate(u.id)}
                                  className="btn-ghost btn-xs"
                                >
                                  {u.isActive ? 'Muzlatish' : 'Faollashtirish'}
                                </button>
                              </td>
                            </tr>
                          ))}
                          {receptionUsers.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-xs text-[var(--text-muted)]">
                                Hozircha qabulxona hisoblari mavjud emas. Yuqoridagi "+ Hisob qo'shish" tugmasi orqali yangi hisob yarating.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FILIAL MA'LUMOTLARI */}
              {activeTab === 'branch_info' && (
                <div className="panel-card space-y-4">
                  <SectionHeader
                    kicker="Filial"
                    title="Filial va Markaz ma'lumotlari"
                    subtitle="Filial manzili, aloqa raqamlari va ish tartibi"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Filial / Markaz nomi</label>
                      <input
                        value={settings.centerName || ''}
                        onChange={(e) => set('centerName', e.target.value)}
                        className="input-field"
                        placeholder="Masalan: Abdora Chilonzor filiali"
                      />
                    </div>

                    <div>
                      <label className="form-label">Aloqa telefoni</label>
                      <PhoneInput
                        value={settings.centerPhone || ''}
                        onChange={(e) => set('centerPhone', e.target.value)}
                        className="input-field font-mono"
                        placeholder="+998 90 123 45 67"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Filial manzili va mo'ljal</label>
                    <input
                      value={settings.centerAddress || ''}
                      onChange={(e) => set('centerAddress', e.target.value)}
                      className="input-field"
                      placeholder="Masalan: Toshkent sh., Chilonzor tumani, 5-mavze, 12-uy"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Ish kunlari va vaqtlari</label>
                      <input
                        value={settings.centerWorkingHours || ''}
                        onChange={(e) => set('centerWorkingHours', e.target.value)}
                        className="input-field"
                        placeholder="Masalan: Dush-Shanba 08:00 — 20:00"
                      />
                    </div>

                    <div>
                      <label className="form-label">Standart dars davomiyligi (daqiqa)</label>
                      <input
                        type="number"
                        min="30"
                        max="240"
                        value={settings.lessonDurationMinutes || 90}
                        onChange={(e) => set('lessonDurationMinutes', Number(e.target.value))}
                        className="input-field font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TO'LOVLAR & QOIDALAR */}
              {activeTab === 'payments' && (
                <div className="panel-card space-y-4">
                  <SectionHeader
                    kicker="Moliya"
                    title="To'lov usullari va Qoidalar"
                    subtitle="Markazda qabul qilinadigan to'lov turlari va to'lov muddati qoidalari"
                  />

                  <div>
                    <label className="form-label mb-2">Qabul qilinadigan to'lov usullari</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { key: 'cash', label: 'Naqd pul', icon: Banknote },
                        { key: 'click', label: 'Click', icon: Smartphone },
                        { key: 'payme', label: 'Payme', icon: CreditCard },
                        { key: 'bank', label: 'Bank o\'tkazmasi', icon: Building2 },
                      ].map((m) => {
                        const Icon = m.icon;
                        const isEnabled = (settings.enabledPaymentMethods || []).includes(m.key);
                        return (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => togglePaymentMethod(m.key)}
                            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                              isEnabled
                                ? 'border-[var(--primary)] bg-[var(--primary-50)] text-[var(--primary)] font-bold'
                                : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--secondary-background)]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon size={16} />
                              <span className="text-xs">{m.label}</span>
                            </div>
                            {isEnabled && <Check size={14} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="form-label">Har oylik to'lov muddati sanasi</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={settings.paymentDueDay || 5}
                        onChange={(e) => set('paymentDueDay', Number(e.target.value))}
                        className="input-field font-mono font-bold"
                        placeholder="5"
                      />
                      <p className="form-hint">Har oyning qaysi sanasigacha o'quvchi to'lov qilishi lozim</p>
                    </div>

                    <div className="pt-2">
                      <SettingRow
                        label="Bo'lib to'lashga ruxsat berish"
                        hint="O'quvchilarga oylik to'lovni 2 yoki 3 ga bo'lib to'lashga ruxsat"
                        noBorder
                      >
                        <ToggleSwitch
                          checked={settings.allowInstallments ?? true}
                          onChange={(v) => set('allowInstallments', v)}
                        />
                      </SettingRow>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LMS & TA'LIM QOIDALARI */}
              {activeTab === 'lms_rules' && (
                <div className="panel-card space-y-4">
                  <SectionHeader
                    kicker="Ta'lim"
                    title="LMS va Dars jarayoni qoidalari"
                    subtitle="Guruh sig'imi, davomat va imtihon me'yorlari"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">Guruhdagi maksimal sig'im</label>
                      <input
                        type="number"
                        min="5"
                        max="40"
                        value={settings.maxStudentsPerGroup || 16}
                        onChange={(e) => set('maxStudentsPerGroup', Number(e.target.value))}
                        className="input-field font-mono font-bold"
                      />
                      <p className="form-hint">Bir guruhga biriktiriladigan maksimal o'quvchilar soni</p>
                    </div>

                    <div>
                      <label className="form-label">Minimal davomat talabi (%)</label>
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={settings.minAttendancePercent || 80}
                        onChange={(e) => set('minAttendancePercent', Number(e.target.value))}
                        className="input-field font-mono font-bold"
                      />
                      <p className="form-hint">Sertifikat berish yoki darajadan o'tish uchun zarur davomat</p>
                    </div>

                    <div>
                      <label className="form-label">Imtihon o'tish bali (%)</label>
                      <input
                        type="number"
                        min="40"
                        max="100"
                        value={settings.passingScorePercent || 60}
                        onChange={(e) => set('passingScorePercent', Number(e.target.value))}
                        className="input-field font-mono font-bold"
                      />
                      <p className="form-hint">Test va oraliq imtihonlardan o'tish minimal chegarasi</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: CRM & LIDLAR */}
              {activeTab === 'crm_leads' && (
                <div className="panel-card space-y-4">
                  <SectionHeader
                    kicker="CRM"
                    title="Lidlar (Talabgorlar) sozlamalari"
                    subtitle="Lid bosqichlari va kelib tushish manbalari"
                  />

                  <div>
                    <label className="form-label mb-2">Faol lid bosqichlari</label>
                    <div className="flex flex-wrap gap-2">
                      {['Yangi murojaat', 'Aloqa o\'rnatildi', 'Sinov darsiga yozildi', 'Sinov darsida qatnashdi', 'To\'lov kutilmoqda', 'Guruhga qo\'shildi'].map((s) => (
                        <span key={s} className="badge badge-primary py-1.5 px-3 text-xs font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="form-label mb-2">Asosiy lid manbalari</label>
                    <div className="flex flex-wrap gap-2">
                      {['Instagram', 'Telegram', 'Facebook', 'Tashqi banner', 'Do\'st tavsiyasi', 'Web sayt'].map((src) => (
                        <span key={src} className="badge badge-gray py-1.5 px-3 text-xs font-semibold">
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: BILDIRISHNOMALAR (SMS) */}
              {activeTab === 'notifications' && (
                <div className="panel-card space-y-4">
                  <SectionHeader
                    kicker="SMS"
                    title="Avtomatik SMS xabarnomalar tartibi"
                    subtitle="Ota-onalar va o'quvchilarga boradigan eslatmalar"
                  />

                  <div className="space-y-1">
                    <SettingRow
                      label="O'quvchi dars qoldirganda avtomatik SMS"
                      hint="Davomatda 'kelmadi' deb belgilanganda ota-ona telefoniga xabar yuborish"
                    >
                      <ToggleSwitch
                        checked={settings.smsOnAbsence ?? true}
                        onChange={(v) => set('smsOnAbsence', v)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="To'lov olinganda SMS kvitansiya"
                      hint="Har bir to'lov amalga oshirilganda tasdiq SMS-chek yuborish"
                    >
                      <ToggleSwitch
                        checked={settings.smsOnPayment ?? true}
                        onChange={(v) => set('smsOnPayment', v)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Oylik to'lov muddati yaqinlashganda eslatma"
                      hint="To'lov muddatiga 2 kun qolganda eslatuvchi SMS yuborish"
                      noBorder
                    >
                      <ToggleSwitch
                        checked={settings.smsPaymentReminder ?? true}
                        onChange={(v) => set('smsPaymentReminder', v)}
                      />
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* TAB 7: MENING HISOBIM & KO'RINISH */}
              {activeTab === 'personal' && (
                <div className="space-y-5">
                  <div className="panel-card space-y-4">
                    <SectionHeader
                      kicker="Profil"
                      title="Menejer shaxsiy ma'lumotlari"
                      subtitle="Ism va aloqa telefoningizni boshqaring"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">To'liq ismingiz</label>
                        <input
                          value={profileForm.name}
                          onChange={(e) => setProfileForm(f => ({ ...f, name: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="form-label">Telefon raqamingiz</label>
                        <PhoneInput
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                          className="input-field font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => profileMutation.mutate(profileForm)}
                        disabled={profileMutation.isPending}
                        className="btn-primary btn-sm"
                      >
                        {profileMutation.isPending ? 'Saqlanmoqda...' : 'Profilni saqlash'}
                      </button>
                    </div>
                  </div>

                  {/* Parol o'zgartirish */}
                  <div className="panel-card space-y-4">
                    <SectionHeader
                      kicker="Xavfsizlik"
                      title="Menejer parolini yangilash"
                      subtitle="Tizim xavfsizligini ta'minlash uchun kuchli parol belgilang"
                    />

                    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                      <div>
                        <label className="form-label">Joriy parol</label>
                        <input
                          type="password"
                          value={pwForm.currentPassword}
                          onChange={(e) => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="form-label">Yangi parol</label>
                        <input
                          type="password"
                          value={pwForm.newPassword}
                          onChange={(e) => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="form-label">Yangi parolni tasdiqlang</label>
                        <input
                          type="password"
                          value={pwForm.confirm}
                          onChange={(e) => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                          className="input-field"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={passwordMutation.isPending}
                        className="btn-primary btn-sm flex items-center gap-1.5"
                      >
                        <KeyRound size={14} />
                        {passwordMutation.isPending ? 'Yangilanmoqda...' : 'Parolni yangilash'}
                      </button>
                    </form>
                  </div>

                  {/* Tezkor mavzu sozlamasi */}
                  <div className="panel-card space-y-3">
                    <SectionHeader
                      kicker="Interfeys"
                      title="Tizim ko'rinishi va Mavzular"
                      subtitle="Ranglar palitrasi va tayyor dizayn mavzularini tanlash"
                    />
                    <p className="text-xs text-[var(--text-secondary)]">
                      Tizim mavzusi va ranglarini to'liq moslashtirish uchun maxsus "Mavzular & Ko'rinish" bo'limiga o'tishingiz mumkin.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('themes')}
                      className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-2 max-w-fit"
                    >
                      <Palette size={14} /> Mavzular bo'limiga o'tish
                    </button>
                  </div>
                </div>
              )}

              {/* ═══════════════ MAVZULAR & KO'RINISH ═══════════════ */}
              {activeTab === 'themes' && (
                <div className="panel-card space-y-6">
                  <SectionHeader
                    kicker="Interfeys & Dizayn"
                    title="Mavzular va Ko'rinish sozlamalari"
                    subtitle="Tizim mavzulari, ranglar konstruktori va interfeys moslashuvi"
                  />
                  <ThemeBuilder embedded />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* MODAL: CREATE RECEPTION ACCOUNT */}
      <AnimatePresence>
        {showAddReception && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && setShowAddReception(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="modal-panel max-w-md p-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Qabulxona xodimi qo'shish</h3>
                <button
                  type="button"
                  onClick={() => { setShowAddReception(false); setNewReceptionCreds(null); }}
                  className="btn-icon"
                >
                  <X size={16} />
                </button>
              </div>

              {newReceptionCreds ? (
                <div className="space-y-4 pt-4">
                  <div className="p-4 rounded-xl text-center bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                    <Check size={32} className="mx-auto text-emerald-500 mb-1.5" />
                    <h4 className="font-bold text-sm text-emerald-700 dark:text-emerald-300">Qabulxona hisobi yaratildi!</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Ushbu login va parolni xodimga taqdim eting.</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--secondary-background)] space-y-2.5">
                    {[
                      ['Login', newReceptionCreds.username],
                      ['Parol', newReceptionCreds.password],
                    ].map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between">
                        <div>
                          <div className="text-[11px] text-[var(--text-muted)]">{label}</div>
                          <div className="font-mono font-bold text-sm text-[var(--text-primary)]">{val}</div>
                        </div>
                        <button onClick={() => copy(val)} className="btn-icon" title="Nusxalash">
                          <Copy size={14} className="text-[var(--primary)]" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setShowAddReception(false); setNewReceptionCreds(null); }}
                    className="btn-primary w-full justify-center"
                  >
                    Tushunarli
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="form-label">Xodim ismi *</label>
                    <input
                      value={receptionForm.name}
                      onChange={(e) => setReceptionForm(f => ({ ...f, name: e.target.value }))}
                      className="input-field"
                      placeholder="Masalan: Malika Karimova"
                    />
                  </div>

                  <div>
                    <label className="form-label">Telefon raqami</label>
                    <PhoneInput
                      value={receptionForm.phone}
                      onChange={(e) => setReceptionForm(f => ({ ...f, phone: e.target.value }))}
                      className="input-field font-mono"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>

                  {branches.length > 0 && (
                    <div>
                      <label className="form-label">Biriktiriladigan filial</label>
                      <select
                        value={receptionForm.branchId}
                        onChange={(e) => setReceptionForm(f => ({ ...f, branchId: e.target.value }))}
                        className="input-field"
                      >
                        <option value="">Standart filial</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setShowAddReception(false)}
                      className="btn-ghost btn-sm"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="button"
                      disabled={!receptionForm.name || createReceptionMutation.isPending}
                      onClick={() => createReceptionMutation.mutate({
                        ...receptionForm,
                        phone: cleanPhone(receptionForm.phone),
                      })}
                      className="btn-primary btn-sm"
                    >
                      {createReceptionMutation.isPending ? 'Yaratilmoqda...' : 'Yaratish'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
