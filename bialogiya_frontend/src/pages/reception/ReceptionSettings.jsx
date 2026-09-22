import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer, CreditCard, ShieldCheck, Bell, User, Palette, Save, Check,
  Volume2, Lock, Eye, Building2, Smartphone, Calendar, Users, GraduationCap,
  BookMarked, PieChart, Wallet, KeyRound, Globe, Moon, Sun, AlertCircle
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import PageHeader from '../../components/ui/PageHeader';
import PhoneInput from '../../components/ui/PhoneInput';
import { cleanPhone } from '../../utils/formatPhone';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';

const RECEPTION_NAV_ITEMS = [
  { id: 'workspace',     label: 'Kassa & Cheklar',          icon: Printer },
  { id: 'permissions',   label: 'Mening huquqlarim',        icon: ShieldCheck },
  { id: 'notifications', label: 'Bildirishnomalar & Ovoz',  icon: Bell },
  { id: 'account',       label: 'Mening profilim & Parol',  icon: User },
  { id: 'appearance',    label: 'Tizim ko\'rinishi',        icon: Palette },
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

export default function ReceptionSettings() {
  const qc = useQueryClient();
  const { user, updateUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTabState] = useState(urlTab || 'workspace');
  const [saved, setSaved] = useState(false);

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  // State for reception-level settings
  const [settings, setSettings] = useState({
    receiptFormat: '80mm',
    autoPrintReceipt: true,
    copyReceiptNumber: true,
    showStaffOnReceipt: true,
    receiptNote: "To'lovingiz uchun tashakkur! O'qishlaringizda muvaffaqiyat tilaymiz. Abdora AI markazi",
    defaultPaymentMethod: 'cash',
    timetableDefaultView: 'room',
    lessonReminderMinutes: 15,
    soundNotifications: true,
    leadSoundAlert: true,
    paymentSoundAlert: true,
    receptionLanguage: 'uz',
  });

  // State for personal profile
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '+998 ',
  });

  // State for password
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirm: '',
  });

  // Fetch center settings and reception permissions
  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ['reception-settings', user?.id, user?.centerId],
    queryFn: () => api.get('/admin/settings').then(r => r.data?.data || {}),
  });

  // Fetch my branch details if assigned
  const { data: myBranches = [] } = useQuery({
    queryKey: ['my-branches'],
    queryFn: () => api.get('/reception/branches').then(r => r.data?.data || r.data || []).catch(() => []),
  });

  useEffect(() => {
    if (serverSettings && typeof serverSettings === 'object') {
      setSettings(prev => ({
        ...prev,
        receiptFormat: serverSettings.receiptFormat || '80mm',
        autoPrintReceipt: serverSettings.autoPrintReceipt ?? true,
        copyReceiptNumber: serverSettings.copyReceiptNumber ?? true,
        showStaffOnReceipt: serverSettings.showStaffOnReceipt ?? true,
        receiptNote: serverSettings.receiptNote || prev.receiptNote,
        defaultPaymentMethod: serverSettings.defaultPaymentMethod || 'cash',
        timetableDefaultView: serverSettings.timetableDefaultView || 'room',
        lessonReminderMinutes: serverSettings.lessonReminderMinutes || 15,
        soundNotifications: serverSettings.soundNotifications ?? true,
        leadSoundAlert: serverSettings.leadSoundAlert ?? true,
        paymentSoundAlert: serverSettings.paymentSoundAlert ?? true,
        receptionLanguage: serverSettings.receptionLanguage || 'uz',
      }));
    }
  }, [serverSettings]);

  const saveMutation = useMutation({
    mutationFn: (d) => api.put('/admin/settings', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reception-settings'] });
      qc.invalidateQueries({ queryKey: ['center-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success('Sozlamalar saqlandi');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xatolik yuz berdi'),
  });

  const profileMutation = useMutation({
    mutationFn: (d) => api.put('/users/profile', { ...d, phone: cleanPhone(d.phone) }),
    onSuccess: ({ data }) => {
      updateUser(data.data);
      toast.success('Profil ma\'lumotlari yangilandi');
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

  const handleSaveWorkspace = () => {
    saveMutation.mutate(settings);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) return toast.error("Barcha maydonlarni to'ldiring");
    if (pwForm.newPassword.length < 6) return toast.error("Yangi parol kamida 6 ta belgidan iborat bo'lsin");
    if (pwForm.newPassword !== pwForm.confirm) return toast.error("Yangi parollar mos kelmadi");
    passwordMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
  };

  const playTestSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
      toast.success('Ovoz signali chalindi');
    } catch (e) {
      toast.error('Ovozni ijro etib bo\'lmadi');
    }
  };

  const permissions = serverSettings?.receptionPermissions || {};

  return (
    <div className="dashboard-shell">
      <PageHeader
        title="Qabulxona sozlamalari"
        subtitle="Kassa cheklari, ish stoli parametrlari, bildirishnomalar va shaxsiy hisob"
        action={
          <button
            onClick={handleSaveWorkspace}
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
          {RECEPTION_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
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

        {/* ── Right Content Panel ── */}
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
              {/* TAB 1: KASSA & CHEKLAR */}
              {activeTab === 'workspace' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Ish stoli"
                    title="Kassa va Chek sozlamalari"
                    subtitle="To'lov qabul qilinganda chiqariladigan kvitansiyalar va kassa parametrlari"
                  />

                  {/* Chek formati */}
                  <div>
                    <label className="form-label mb-2">Standart chek formati</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: '80mm', label: '80mm Termoprinter', desc: 'Standart kassa chek lentasi (Tavsiya qilinadi)' },
                        { id: '58mm', label: '58mm Termoprinter', desc: 'Kichik ixcham kassa printeri' },
                        { id: 'a4', label: 'A4 Shartnoma-chek', desc: 'To\'liq varaqli rasmiy kvitansiya' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => set('receiptFormat', f.id)}
                          className={`p-3.5 rounded-xl border text-left transition-all ${
                            settings.receiptFormat === f.id
                              ? 'border-[var(--primary)] bg-[var(--primary-50)] shadow-sm'
                              : 'border-[var(--border)] hover:bg-[var(--secondary-background)]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[var(--text-primary)]">{f.label}</span>
                            {settings.receiptFormat === f.id && <Check size={14} className="text-[var(--primary)]" />}
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-1">{f.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* To'lov usuli va Jadval */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Standart to'lov usuli</label>
                      <select
                        value={settings.defaultPaymentMethod}
                        onChange={(e) => set('defaultPaymentMethod', e.target.value)}
                        className="input-field"
                      >
                        <option value="cash">Naqd pul</option>
                        <option value="click">Click</option>
                        <option value="payme">Payme</option>
                        <option value="bank">Bank o'tkazma</option>
                      </select>
                      <p className="form-hint">Yangi to'lov oynasi ochilganda birinchi turadigan usul</p>
                    </div>

                    <div>
                      <label className="form-label">Dars jadvalining asosiy ko'rinishi</label>
                      <select
                        value={settings.timetableDefaultView}
                        onChange={(e) => set('timetableDefaultView', e.target.value)}
                        className="input-field"
                      >
                        <option value="room">Xonalar bo'yicha</option>
                        <option value="teacher">O'qituvchilar bo'yicha</option>
                      </select>
                      <p className="form-hint">Qabulxona bosh sahifasidagi jadval filtri</p>
                    </div>
                  </div>

                  {/* Chek matni */}
                  <div>
                    <label className="form-label">Chek ostidagi minnatdorchilik matni</label>
                    <textarea
                      rows={2}
                      value={settings.receiptNote}
                      onChange={(e) => set('receiptNote', e.target.value)}
                      className="input-field"
                      placeholder="Chek oxirida chop etiladigan xabar..."
                    />
                    <p className="form-hint">Chiqarilgan har bir to'lov kvitansiyasining pastida ushbu yozuv chiqadi</p>
                  </div>

                  {/* Avtomatik amallar */}
                  <div className="pt-2">
                    <SettingRow
                      label="To'lov olinganda avtomatik chek chiqarish"
                      hint="To'lov muvaffaqiyatli saqlanganda kvitansiya oynasi avtomatik ochiladi"
                    >
                      <ToggleSwitch
                        checked={settings.autoPrintReceipt}
                        onChange={(v) => set('autoPrintReceipt', v)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Chek raqamini nusxalash tugmasini ko'rsatish"
                      hint="Chek id raqamini 1 bosishda nusxalash imkoniyati"
                    >
                      <ToggleSwitch
                        checked={settings.copyReceiptNumber}
                        onChange={(v) => set('copyReceiptNumber', v)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Chekda qabulxona xodimi ismini ko'rsatish"
                      hint="Chekni rasmiylashtirgan xodim ismi kvitansiyada qayd etiladi"
                      noBorder
                    >
                      <ToggleSwitch
                        checked={settings.showStaffOnReceipt}
                        onChange={(v) => set('showStaffOnReceipt', v)}
                      />
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* TAB 2: MENING HUQUQLARIM */}
              {activeTab === 'permissions' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Xavfsizlik"
                    title="Mening ruxsatlarim va Filial holati"
                    subtitle="Manager va Admin tomonidan ushbu qabulxona hisobiga berilgan vakolatlar"
                  />

                  {/* Filial info card */}
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--secondary-background)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--primary-50)] text-[var(--primary)] flex items-center justify-center">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-muted)]">Biriktirilgan filial</div>
                        <div className="text-sm font-bold text-[var(--text-primary)]">
                          {myBranches[0]?.name || serverSettings?.centerName || 'Markaziy filial'}
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-success text-xs font-semibold">Faol biriktirilgan</span>
                  </div>

                  {/* Ruxsatlar status ko'rinishi */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Joriy ruxsatlar holati (Faqat ko'rish uchun)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'canViewFinance', label: 'Moliya dashboardi va hisobotlar', icon: PieChart },
                        { key: 'canViewCashbox', label: 'Kassa va naqd tushumlar', icon: Wallet },
                        { key: 'canManagePayments', label: "To'lovlarni qabul qilish", icon: CreditCard },
                        { key: 'canManageLeads', label: 'Lidlar (CRM) bilan ishlash', icon: Smartphone },
                        { key: 'canManageTimetable', label: 'Dars jadvali va xonalar', icon: Calendar },
                        { key: 'canManageGroups', label: 'Guruhlar ro\'yxati', icon: Users },
                        { key: 'canManageStudents', label: "O'quvchilar ro'yxati", icon: GraduationCap },
                        { key: 'canManageTeachers', label: "O'qituvchilar ro'yxati", icon: BookMarked },
                      ].map((item) => {
                        const isGranted = permissions[item.key] !== false;
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.key}
                            className="p-3.5 rounded-xl border border-[var(--border)] flex items-center justify-between"
                            style={{ backgroundColor: 'var(--card)' }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: isGranted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                  color: isGranted ? '#10b981' : '#ef4444',
                                }}
                              >
                                <Icon size={16} />
                              </div>
                              <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                                {item.label}
                              </span>
                            </div>
                            <span
                              className={`badge text-[11px] font-semibold flex-shrink-0 ${
                                isGranted ? 'badge-success' : 'badge-danger'
                              }`}
                            >
                              {isGranted ? 'Ruxsat berilgan' : 'Yopiq'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Informational Alert */}
                  <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 flex items-start gap-2.5">
                    <AlertCircle size={17} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                      Qabulxona huquqlari xavfsizlik maqsadida faqat <strong>Markaz rahbari (Admin)</strong> yoki <strong>Filial menejeri</strong> tomonidan sozlanadi. Ruxsatlarni o'zgartirish zarurati bo'lsa, rahbariyatga murojaat qiling.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: BILDIRISHNOMALAR VA OVOZ */}
              {activeTab === 'notifications' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Audio & Xabarlar"
                    title="Bildirishnomalar va Ovozli signallar"
                    subtitle="Qabulxonada yangi murojaatlar va to'lovlar sodir bo'lganda ovozli eslatmalar"
                  />

                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--secondary-background)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Volume2 size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[var(--text-primary)]">Ovozli signallarni sinash</div>
                        <div className="text-xs text-[var(--text-muted)]">Brauzer karnayi sozligini tekshirish</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={playTestSound}
                      className="btn-ghost btn-sm flex items-center gap-1.5"
                    >
                      <Volume2 size={14} /> Sinash
                    </button>
                  </div>

                  <div className="space-y-1">
                    <SettingRow
                      label="Barcha ovozli xabarnomalar"
                      hint="Qabulxona ish jarayonidagi audio eslatmalarni yoqish yoki o'chirish"
                    >
                      <ToggleSwitch
                        checked={settings.soundNotifications}
                        onChange={(v) => set('soundNotifications', v)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Yangi lid kelganda ovozli signal"
                      hint="CRM ga yangi o'quvchi murojaati tushganda audio qo'ng'iroq chalish"
                    >
                      <ToggleSwitch
                        checked={settings.leadSoundAlert && settings.soundNotifications}
                        disabled={!settings.soundNotifications}
                        onChange={(v) => set('leadSoundAlert', v)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="To'lov qabul qilinganda tasdiq ovozi"
                      hint="Muvaffaqiyatli to'lov qayd etilganda ovozli bildirishnoma berish"
                    >
                      <ToggleSwitch
                        checked={settings.paymentSoundAlert && settings.soundNotifications}
                        disabled={!settings.soundNotifications}
                        onChange={(v) => set('paymentSoundAlert', v)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Dars boshlanishiga 15 daqiqa qolganda ogohlantirish"
                      hint="Kunlik rejadagi navbatdagi darslar uchun eslatma"
                      noBorder
                    >
                      <ToggleSwitch
                        checked={settings.lessonReminderMinutes > 0}
                        onChange={(v) => set('lessonReminderMinutes', v ? 15 : 0)}
                      />
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* TAB 4: SHAXSIY PROFIL VA PAROL */}
              {activeTab === 'account' && (
                <div className="space-y-5">
                  {/* Profil ma'lumotlari */}
                  <div className="panel-card space-y-4">
                    <SectionHeader
                      kicker="Profil"
                      title="Qabulxona xodimi ma'lumotlari"
                      subtitle="Ism va aloqa telefon raqamingiz"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">To'liq ismingiz</label>
                        <input
                          value={profileForm.name}
                          onChange={(e) => setProfileForm(f => ({ ...f, name: e.target.value }))}
                          className="input-field"
                          placeholder="Ismingiz"
                        />
                      </div>
                      <div>
                        <label className="form-label">Telefon raqamingiz</label>
                        <PhoneInput
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                          className="input-field font-mono"
                          placeholder="+998 90 123 45 67"
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

                  {/* Parolni o'zgartirish */}
                  <div className="panel-card space-y-4">
                    <SectionHeader
                      kicker="Xavfsizlik"
                      title="Parolni o'zgartirish"
                      subtitle="Tizimga kirish parolini xavfsiz yangilang"
                    />

                    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                      <div>
                        <label className="form-label">Joriy parol</label>
                        <input
                          type="password"
                          value={pwForm.currentPassword}
                          onChange={(e) => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                          className="input-field"
                          placeholder="Eski parolingiz"
                        />
                      </div>
                      <div>
                        <label className="form-label">Yangi parol</label>
                        <input
                          type="password"
                          value={pwForm.newPassword}
                          onChange={(e) => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                          className="input-field"
                          placeholder="Kamida 6 ta belgi"
                        />
                      </div>
                      <div>
                        <label className="form-label">Yangi parolni tasdiqlang</label>
                        <input
                          type="password"
                          value={pwForm.confirm}
                          onChange={(e) => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                          className="input-field"
                          placeholder="Yangi parolni qayta kiriting"
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
                </div>
              )}

              {/* TAB 5: KO'RINISH */}
              {activeTab === 'appearance' && (
                <div className="panel-card space-y-5">
                  <SectionHeader
                    kicker="Dizayn"
                    title="Interfeys ko'rinishi va Til"
                    subtitle="Qabulxona ishchi stolini o'zingizga qulay qilib sozlang"
                  />

                  <div>
                    <label className="form-label mb-2">Tizim mavzusi</label>
                    <div className="grid grid-cols-2 gap-3 max-w-md">
                      <button
                        type="button"
                        onClick={() => theme !== 'light' && toggleTheme()}
                        className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                          theme === 'light'
                            ? 'border-[var(--primary)] bg-[var(--primary-50)] text-[var(--primary)] font-bold'
                            : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--secondary-background)]'
                        }`}
                      >
                        <Sun size={18} />
                        <span className="text-xs">Yorug' (Light)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => theme !== 'dark' && toggleTheme()}
                        className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                          theme === 'dark'
                            ? 'border-[var(--primary)] bg-[var(--primary-50)] text-[var(--primary)] font-bold'
                            : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--secondary-background)]'
                        }`}
                      >
                        <Moon size={18} />
                        <span className="text-xs">Qorong'i (Dark)</span>
                      </button>
                    </div>
                  </div>

                  <div className="max-w-md">
                    <label className="form-label">Tizim tili</label>
                    <select
                      value={settings.receptionLanguage}
                      onChange={(e) => set('receptionLanguage', e.target.value)}
                      className="input-field"
                    >
                      <option value="uz">O'zbekcha</option>
                      <option value="ru">Русский</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
