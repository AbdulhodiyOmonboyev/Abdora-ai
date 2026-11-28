import { useState, useRef, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Sparkles, Camera, Save, Download, ArrowLeft,
  Smile, User, CheckCircle2, AlertCircle, RefreshCw,
  Wand2, Volume2, ShieldCheck, Heart, Lock, Unlock, Briefcase, Zap
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import AvatarCreator from '../../components/ui/AvatarCreator';
import { isStudentAvatarEnabled } from '../../utils/format';

export default function AvatarPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const iframeRef = useRef(null);

  // States
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanPreview, setScanPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [downloadPending, setDownloadPending] = useState(false);

  // Fetch current user details
  const { data: me, refetch: refetchMe } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => r.data.data),
  });

  const activeUser = me || user;
  const avatarMeta = useMemo(() => {
    const ap = activeUser?.permissions?.avatarProfile || {};
    return {
      isSaved: Boolean(ap.isSaved || ap.savedAtXp !== undefined || ap.updatedAt),
      name: ap.name || '',
      profession: ap.profession || '',
      savedAtXp: typeof ap.savedAtXp === 'number' ? ap.savedAtXp : 0,
      unlockStepXp: typeof ap.unlockStepXp === 'number' ? ap.unlockStepXp : 200,
      userXp: typeof activeUser?.xp === 'number' ? activeUser?.xp : 0,
      role: activeUser?.role || 'student',
    };
  }, [activeUser]);

  const isMandatoryOnboarding = !avatarMeta.isSaved;

  const { data: serverSettings } = useQuery({
    queryKey: ['center-settings', user?.centerId || user?.id],
    queryFn: () => api.get('/admin/settings').then((r) => r.data?.data || {}),
    enabled: Boolean(user) && String(user.role || '').toLowerCase() === 'student',
    staleTime: 30 * 1000,
  });

  // 3D AI Avatar faqat o'quvchi roli uchun va markazda yoqilgan bo'lsagina mavjud
  if (activeUser && !isStudentAvatarEnabled(activeUser, serverSettings)) {
    return <Navigate to="/student/dashboard" replace />;
  }

  // Handle saving avatar to backend
  const handleAvatarSave = async (dataUrl, config) => {
    const trimmedName = String(config?.name || avatarMeta.name || '').trim();
    const trimmedProfession = String(config?.profession || avatarMeta.profession || '').trim();

    if (trimmedName.length < 2) {
      toast.error("Avval avataringizga ism bering (tepadagi «Ism qo'yish» tugmasini bosing)!");
      setIsSaving(false);
      return;
    }
    if (trimmedProfession.length < 2) {
      toast.error("Avval avataringiz kasbini tanlang («Kasb» tugmasini bosing)!");
      setIsSaving(false);
      return;
    }

    const wasOnboarding = !avatarMeta.isSaved;
    setIsSaving(true);
    try {
      if (config) {
        const cfgRes = await api.post('/users/avatar-config', {
          name: trimmedName,
          profession: trimmedProfession,
          config: { ...config, name: trimmedName, profession: trimmedProfession },
        });
        const updatedCfgUser = cfgRes?.data?.data?.user || cfgRes?.data?.data;
        if (updatedCfgUser && updatedCfgUser.id) {
          useAuthStore.getState().updateUser(updatedCfgUser);
        }
      }

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.png');

      const { data } = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data?.data) {
        useAuthStore.getState().updateUser(data.data);
      }
      await refetchMe();

      if (wasOnboarding) {
        toast.success("Tabriklaymiz! 3D AI do'stingiz tayyor — endi u sayt bo'ylab siz bilan birga yuradi! 🚀");
        navigate('/student/dashboard', { replace: true });
      } else {
        toast.success('3D Avatar profil rasmingiz sifatida saqlandi! 🎉');
      }
    } catch (err) {
      console.error('Avatar saqlash xatosi:', err);
      toast.error(err?.response?.data?.message || "Avatarni saqlashda xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger snapshot from iframe and download as PNG
  const handleDownload = () => {
    setDownloadPending(true);
    iframeRef.current?.contentWindow?.postMessage({ type: 'AVATAR_REQUEST_EXPORT' }, '*');
  };

  // Trigger snapshot from iframe and save to profile
  const handleSaveToProfile = () => {
    setIsSaving(true);
    iframeRef.current?.contentWindow?.postMessage({ type: 'AVATAR_REQUEST_EXPORT' }, '*');
  };

  // When iframe returns snapshot data URL
  const handleExportReady = (dataUrl, config) => {
    if (downloadPending) {
      setDownloadPending(false);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${me?.username || 'abdora'}-3d-avatar.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Avatar rasmi yuklab olindi! 📥');
    } else if (isSaving) {
      handleAvatarSave(dataUrl, config);
    }
  };

  // Trigger interactive actions (wave, jump, bye)
  const triggerAction = (action) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'AVATAR_TRIGGER_ACTION', action },
      '*'
    );
  };

  // Handle selfie file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Iltimos, rasm faylini tanlang.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setScanPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Run AI scan with Gemini Vision
  const handleRunScan = async () => {
    if (!selectedFile) {
      toast.error('Avval selfi rasmini yuklang.');
      return;
    }

    setIsScanning(true);
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const { data } = await api.post('/users/scan-avatar-face', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!data || !data.faceFound) {
        toast.error(
          data?.message || 'Yuz aniq koʻrinmadi. Iltimos, yuzingiz yorugʻ tushgan selfi tanlang.'
        );
        return;
      }

      // Send analysis result to iframe
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'AVATAR_APPLY_SCAN', data },
        '*'
      );

      toast.success('Selfi sunʼiy intellekt orqali muvaffaqiyatli tahlil qilindi! 🎨');
    } catch (err) {
      console.error('AI Scan error:', err);
      toast.error('Skanerlashda xatolik yuz berdi. Ranglarni oʻzingiz tanlashingiz mumkin.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {isMandatoryOnboarding && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 rounded-2xl border-2 border-orange-500/40 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-emerald-500/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="space-y-1">
            <div className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles size={18} className="text-[var(--primary)] shrink-0" />
              <span>Xush kelibsiz! Avval shaxsiy 3D AI do'stingizni yarating (Majburiy qadam)</span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Platformaga kirish uchun 3D qahramoningiz ko'rinishini tanlang, unga <strong>Ism</strong> hamda <strong>Kasb</strong> bering va <strong>«Saqlash»</strong> tugmasini bosing. U oyna ichida yurib, siz o'tgan darslar bo'yicha savol-javob qiladi!
            </p>
          </div>
          <span className="badge badge-orange text-xs whitespace-nowrap self-start sm:self-center">
            1-qadam: Avatar yaratish
          </span>
        </motion.div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {!isMandatoryOnboarding && (
            <button
              onClick={() => navigate(-1)}
              className="btn-ghost p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Orqaga"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                3D Avatar boʻlimi
              </h1>
              <span className="badge badge-orange flex items-center gap-1 text-xs">
                <Sparkles size={12} /> Low-poly 3D
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
              Oʻquv doʻstingiz boʻlgan 3D personajingizni yarating, kiyintiring va profil rasmingizga oʻrnating.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDownload}
            disabled={downloadPending}
            className="btn-secondary flex items-center gap-2 text-xs sm:text-sm px-3.5 py-2 rounded-xl disabled:opacity-50"
            title="Avatarni PNG formatida yuklab olish"
          >
            <Download size={15} />
            {downloadPending ? 'Yuklanmoqda…' : 'PNG yuklab olish'}
          </button>

          <button
            onClick={handleSaveToProfile}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2 text-xs sm:text-sm px-4 py-2 rounded-xl disabled:opacity-50 shadow-md"
            title="Profil rasmi sifatida saqlash"
          >
            <Save size={15} />
            {isSaving ? 'Saqlanmoqda…' : 'Profilga saqlash'}
          </button>
        </div>
      </div>

      {/* Main Grid: 3D Stage on Left, Control Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 3D Interactive Stage (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="card p-2 sm:p-3 relative overflow-hidden bg-[var(--card)] shadow-md">
            <AvatarCreator
              inline={true}
              iframeRef={iframeRef}
              avatarMeta={{ ...avatarMeta, mandatory: isMandatoryOnboarding }}
              onSave={handleAvatarSave}
              onExportReady={handleExportReady}
              className="h-[620px] sm:h-[680px]"
            />
          </div>

          {/* Quick Animation Controls */}
          <div className="card flex items-center justify-between gap-3 p-3 sm:p-4 flex-wrap">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
              <Smile size={16} className="text-[var(--primary)]" />
              <span>Interaktiv harakatlar:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => triggerAction('hello')}
                className="btn-ghost text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary-background)] transition-colors"
              >
                👋 Salom berish
              </button>
              <button
                onClick={() => triggerAction('jump')}
                className="btn-ghost text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary-background)] transition-colors"
              >
                🦘 Sakrash
              </button>
              <button
                onClick={() => triggerAction('bye')}
                className="btn-ghost text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary-background)] transition-colors"
              >
                🙇 Xayrlashish
              </button>
            </div>
          </div>
        </div>

        {/* Right: Sidebar Cards (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Avatar Ma'lumotlari & EXP Qulfi Card */}
          {(() => {
            const needed = avatarMeta.savedAtXp + avatarMeta.unlockStepXp;
            const remaining = Math.max(0, needed - avatarMeta.userXp);
            const gained = Math.max(0, avatarMeta.userXp - avatarMeta.savedAtXp);
            const pct = avatarMeta.isSaved
              ? Math.min(100, Math.round((gained / Math.max(1, avatarMeta.unlockStepXp)) * 100))
              : 100;
            const isUnlocked =
              !avatarMeta.isSaved ||
              avatarMeta.role !== 'student' ||
              avatarMeta.userXp >= needed;

            return (
              <div className="card p-4 sm:p-5 space-y-3.5 border border-[var(--border)] shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    {isUnlocked ? (
                      <Unlock size={16} className="text-green-500" />
                    ) : (
                      <Lock size={16} className="text-[var(--primary)]" />
                    )}
                    <span>Avatar Ma'lumotlari & EXP Qulfi</span>
                  </h3>
                  <span
                    className={`badge text-[10px] ${
                      isUnlocked ? 'badge-success' : 'badge-orange'
                    }`}
                  >
                    {isUnlocked ? 'Ochiq 🔓' : 'Qulflangan 🔒'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-[var(--secondary-background)]/60 border border-[var(--border)]">
                    <div className="text-[10px] text-[var(--text-muted)] mb-0.5">Qahramon ismi</div>
                    <div className="font-semibold text-[var(--text-primary)] truncate">
                      {avatarMeta.name || 'Tanlanmagan'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--secondary-background)]/60 border border-[var(--border)]">
                    <div className="text-[10px] text-[var(--text-muted)] mb-0.5 flex items-center gap-1">
                      <Briefcase size={10} /> Kasb
                    </div>
                    <div className="font-semibold text-[var(--text-primary)] truncate">
                      {avatarMeta.profession || 'Tanlanmagan'}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-secondary)] flex items-center gap-1 font-medium">
                      <Zap size={12} className="text-[var(--primary)]" />
                      Keyingi o'zgartirish (+{avatarMeta.unlockStepXp} XP)
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {avatarMeta.isSaved && avatarMeta.role === 'student'
                        ? `${avatarMeta.userXp} / ${needed} XP`
                        : `${avatarMeta.userXp} XP`}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--secondary-background)] overflow-hidden border border-[var(--border)]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlocked ? 'bg-green-500' : 'bg-[var(--primary)]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-snug">
                    {!avatarMeta.isSaved
                      ? "Birinchi marta saqlashda ism va kasbni erkin tanlashingiz mumkin."
                      : avatarMeta.role !== 'student'
                        ? "Sizning rolingiz uchun ism va kasbni tahrirlash doim ochiq."
                        : avatarMeta.userXp >= needed
                          ? `Tabriklaymiz! ${avatarMeta.unlockStepXp} XP to'pladingiz — ism va kasbni o'zgartirishingiz mumkin! 🔓`
                          : `Ism va kasbni o'zgartirish uchun yana ${remaining} XP to'plang 🔒`}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* AI Face Scanner Card */}
          <div className="card p-4 sm:p-5 space-y-3.5 border border-[var(--border)] shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold">
                <Wand2 size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  AI Yuz Skaneri (Gemini)
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Selfi yuklang, AI yuzingizga moslaydi
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Google Gemini Vision selfi rasmingizdagi teri rangi, soch rangi va turmagi hamda koʻz rangini aniqlab, 3D qahramonga avtomatik kiritadi.
            </p>

            {/* Photo upload area */}
            <div className="space-y-3">
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="selfie-input"
                />
                <div
                  onClick={() => document.getElementById('selfie-input').click()}
                  className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-xl p-4 text-center cursor-pointer transition-colors bg-[var(--secondary-background)]/50"
                >
                  {scanPreview ? (
                    <div className="space-y-2">
                      <img
                        src={scanPreview}
                        alt="Selfie preview"
                        className="w-24 h-24 mx-auto rounded-full object-cover border-2 border-[var(--primary)] shadow-sm"
                      />
                      <span className="text-xs text-[var(--primary)] font-medium block">
                        Boshqa rasm tanlash 🔄
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 py-2">
                      <Camera size={26} className="mx-auto text-[var(--text-muted)]" />
                      <div className="text-xs font-semibold text-[var(--text-primary)]">
                        Selfi rasmini tanlang
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        PNG, JPG yoki WEBM
                      </div>
                    </div>
                  )}
                </div>
              </label>

              <button
                onClick={handleRunScan}
                disabled={!selectedFile || isScanning}
                className="w-full btn-primary text-xs sm:text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>AI tahlil qilmoqda…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Rasmni avatarga moslash</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Current Profile Card */}
          <div className="card p-4 sm:p-5 space-y-3 border border-[var(--border)] shadow-sm">
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <User size={16} className="text-[var(--primary)]" />
              <span>Joriy profil rasmi</span>
            </h3>

            <div className="flex items-center gap-3.5 pt-1">
              {me?.avatar ? (
                <img
                  src={me.avatar}
                  alt={me?.name || 'User avatar'}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[var(--primary)] shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-full gradient-bg text-white font-bold text-xl flex items-center justify-center shadow-md">
                  {(me?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate text-[var(--text-primary)]">
                  {me?.name || user?.name}
                </div>
                <div className="text-xs text-[var(--text-muted)] truncate">
                  @{me?.username || user?.username}
                </div>
                <span className="badge badge-success text-[10px] mt-1 inline-block">
                  {me?.avatar ? '✓ 3D Avatar oʻrnatilgan' : 'Oddiy avatar'}
                </span>
              </div>
            </div>
          </div>

          {/* Helpful Tips Card */}
          <div className="card p-4 space-y-2.5 bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
            <div className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-green-500" />
              <span>Boshqaruv boʻyicha eslatma:</span>
            </div>
            <ul className="space-y-1.5 list-disc pl-4 text-[11px] leading-relaxed">
              <li><b>Aylantirish:</b> 3D sahnani sichqoncha yoki barmoq bilan erkin 360° aylantiring.</li>
              <li><b>Masshtab:</b> Yaqinlashtirish yoki uzoqlashtirish uchun gʻildirakdan foydalaning.</li>
              <li><b>Kiyim va uslub:</b> Oʻng va chap menyulardan kiyim turi, rangi va aksessuarlarni sozlang.</li>
              <li><b>Avto-saqlash:</b> Sozlamalar qurilmangizda avtomatik eslab qolinadi.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
