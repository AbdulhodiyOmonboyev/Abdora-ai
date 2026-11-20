import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Phone, Globe, KeyRound, Save, Flame, Trophy, Users, BookOpen, Building2 } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { getLevelProgress } from '../../utils/format';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import { useTranslation } from 'react-i18next';
import ThemeBuilder from '../../components/ui/ThemeBuilder';
import PhoneInput from '../../components/ui/PhoneInput';
import { cleanPhone } from '../../utils/formatPhone';
import { setLanguage } from '../../config/i18n';
import AvatarCreator from '../../components/ui/AvatarCreator';

const roleLabel = (role) => ({
  student: "O'quvchi", teacher: "O'qituvchi", reception: 'Qabulxona', manager: 'Manager', admin: 'Admin',
}[role] || role);

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ name: '', phone: '+998 ', language: 'uz', studyLocation: '', residence: '', alternativeWorkplace: '', birthDate: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => r.data.data),
  });

  useEffect(() => {
    if (me) setForm({ name: me.name || '', phone: me.phone || '+998 ', language: me.language || 'uz', studyLocation: me.studyLocation || '', residence: me.residence || '', alternativeWorkplace: me.alternativeWorkplace || '', birthDate: me.birthDate ? me.birthDate.slice(0, 10) : '' });
  }, [me]);

  const saveMutation = useMutation({
    mutationFn: (d) => api.put('/users/profile', { ...d, phone: cleanPhone(d.phone) }),
    onSuccess: ({ data }) => {
      updateUser(data.data);
      if (data.data?.language) {
        setLanguage(data.data.language);
      }
      toast.success(t('save') ? `${t('profile')} ${t('save')}` : 'Profil yangilandi');
    },
    onError: (err) => toast.error(friendlyAiErrorMessage(err)),
  });

  const pwMutation = useMutation({
    mutationFn: (d) => api.post('/users/change-password', d),
    onSuccess: () => {
      toast.success("Parol o'zgartirildi");
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (err) => toast.error(friendlyAiErrorMessage(err)),
  });

  const submitPassword = () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) return toast.error("Barcha maydonlarni to'ldiring");
    if (pwForm.newPassword.length < 6) return toast.error("Yangi parol kamida 6 ta belgidan iborat bo'lsin");
    if (pwForm.newPassword !== pwForm.confirm) return toast.error("Yangi parollar mos kelmadi");
    pwMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
  };

  const handleAvatarSave = async (dataUrl, config) => {
    setAvatarUploading(true);
    try {
      // Convert dataUrl to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.png');

      const { data } = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.data);
      toast.success('3D Avatar saqlandi! 🎉');
    } catch (err) {
      toast.error("Avatar saqlanmadi. Keyinroq urinib ko'ring.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const { level, progress } = getLevelProgress(me?.xp || 0);

  return (
    <div className="max-w-5xl mx-auto space-y-5 px-4 sm:px-6 lg:px-8">
      {/* Header card */}
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-shrink-0">
          {me?.avatar ? (
            <img
              src={me.avatar}
              alt={me?.name}
              className="w-16 h-16 rounded-full object-cover shadow-glow border-2 border-[var(--primary)]"
            />
          ) : (
            <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-glow">
              {me?.name?.charAt(0) || <User size={24} />}
            </div>
          )}
          <button
            onClick={() => setAvatarOpen(true)}
            disabled={avatarUploading}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-md hover:bg-[var(--primary-dark)] transition-colors text-xs"
            title="3D Avatar yaratish"
          >
            {avatarUploading ? '⟳' : '✏️'}
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg text-gray-800 dark:text-white truncate">{me?.name}</div>
          <div className="text-sm text-gray-400">@{me?.username}</div>
          <span className="badge text-xs bg-primary/10 text-primary mt-1">{t(me?.role) || roleLabel(me?.role)}</span>
        </div>
      </div>

      {/* 3D Avatar Card */}
      <div className="card flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="text-3xl flex-shrink-0">🎮</div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-gray-800 dark:text-white">3D Avatar boʻlimi</div>
            <div className="text-xs text-gray-400 mt-0.5">Oʻzingizga oʻxshash 3D qahramon yarating yoki sunʼiy intellekt orqali selfi moslang</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate('/avatar')}
            className="btn-secondary text-xs sm:text-sm px-3.5 py-2 rounded-xl flex items-center gap-1.5"
          >
            <span>Boʻlimga oʻtish</span>
            <span>➔</span>
          </button>
          <button
            onClick={() => setAvatarOpen(true)}
            disabled={avatarUploading}
            className="btn-primary text-xs sm:text-sm px-3.5 py-2 rounded-xl disabled:opacity-50"
          >
            {avatarUploading ? 'Saqlanmoqda...' : me?.avatar ? 'Tezkor tahrirlash' : 'Yaratish'}
          </button>
        </div>
      </div>

      {/* Student stats */}
      {me?.role === 'student' && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="card text-center py-3 px-1 sm:px-3">
            <Trophy size={18} className="mx-auto mb-1 text-amber-500" />
            <div className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">{level}</div>
            <div className="text-[11px] sm:text-xs text-gray-400 whitespace-nowrap">{t('level') || 'Daraja'}</div>
          </div>
          <div className="card text-center py-3 px-1 sm:px-3">
            <Flame size={18} className="mx-auto mb-1 text-orange-500" />
            <div className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">{me?.streakCurrent ?? me?.streak?.current ?? 0} {t('days') || 'kun'}</div>
            <div className="text-[11px] sm:text-xs text-gray-400 whitespace-nowrap">{t('streak') || 'Ketma-ketlik'}</div>
          </div>
          <div className="card text-center py-3 px-1 sm:px-3">
            <BookOpen size={18} className="mx-auto mb-1 text-primary" />
            <div className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">{me?.xp || 0}</div>
            <div className="text-[11px] sm:text-xs text-gray-400 whitespace-nowrap">XP</div>
          </div>
        </div>
      )}
      {me?.role === 'student' && (me?.group || me?.teacher) && (
        <div className="card flex items-center gap-3 sm:gap-4 text-xs sm:text-sm flex-wrap p-3 sm:p-4">
          {me?.group && <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><Users size={14} className="text-gray-400 shrink-0" /> {me.group.name}</div>}
          {me?.teacher && <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><User size={14} className="text-gray-400 shrink-0" /> {me.teacher.name}</div>}
        </div>
      )}
      {me?.role === 'reception' && (
        <div className="grid grid-cols-1 gap-3">
          <div className="card flex items-center gap-3 py-3">
            <Building2 size={16} className="text-primary flex-shrink-0" />
            <span className="text-sm text-gray-500">Markazlaringizni "O'quv markazlar" bo'limidan boshqaring</span>
          </div>
        </div>
      )}

      {/* Edit form */}
      <div className="card">
        <h2 className="font-bold text-sm mb-4 text-gray-800 dark:text-white">{t('personal_info') || "Shaxsiy ma'lumotlar"}</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('full_name') || "To'liq ismi"}</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1"><Phone size={11} /> {t('phone_number') || 'Telefon raqami'}</label>
            <PhoneInput value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1"><Globe size={11} /> {t('language') || 'Til'}</label>
            <select
              value={form.language}
              onChange={e => {
                const newLang = e.target.value;
                setForm(f => ({ ...f, language: newLang }));
                setLanguage(newLang);
                updateUser({ language: newLang });
                api.patch('/users/language', { language: newLang }).catch(() => {});
              }}
              className="input-field"
            >
              <option value="uz">O'zbek</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
          {me?.role === 'student' && (
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['studyLocation', "O'qish joyi"],
                ['residence', 'Yashash manzili'],
                ['alternativeWorkplace', 'Muqobil ish joyi'],
                ['birthDate', "Tug'ilgan sana"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
                  <input type={key === 'birthDate' ? 'date' : 'text'} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="input-field" />
                </div>
              ))}
            </div>
          )}
          <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}
            className="btn-primary flex items-center gap-2 disabled:opacity-50">
            <Save size={14} /> {saveMutation.isPending ? (t('loading') || 'Saqlanmoqda...') : (t('save') || 'Saqlash')}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <h2 className="font-bold text-sm mb-4 text-gray-800 dark:text-white flex items-center gap-2">
          <KeyRound size={14} className="text-primary" /> {t('change_password') || "Kodni o'zgartirish"}
        </h2>
        <div className="space-y-3">
          <input type="password" placeholder={t('current_password') || 'Joriy kod'} value={pwForm.currentPassword}
            onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} className="input-field" />
          <input type="password" placeholder={t('new_password') || 'Yangi kod'} value={pwForm.newPassword}
            onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} className="input-field" />
          <input type="password" placeholder={t('confirm_password') || 'Yangi kodni tasdiqlang'} value={pwForm.confirm}
            onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} className="input-field" />
          <button onClick={submitPassword} disabled={pwMutation.isPending}
            className="btn-primary flex items-center gap-2 disabled:opacity-50">
            <KeyRound size={14} /> {pwMutation.isPending ? "O'zgartirilmoqda..." : "Kodni o'zgartirish"}
          </button>
        </div>
      </div>

      <ThemeBuilder />

      {/* 3D Avatar Creator */}
      <AvatarCreator
        isOpen={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        onSave={handleAvatarSave}
      />
    </div>
  );
}
