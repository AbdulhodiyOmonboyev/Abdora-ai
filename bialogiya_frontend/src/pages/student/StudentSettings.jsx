import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Palette, User, Shield, Check, Plus, X, Bot, Brain,
  Sliders, MessageSquare, Send, Loader2, ArrowRight, RefreshCw,
  KeyRound, Save, Phone, Globe, Layers, BookOpen, Heart, Zap,
  CheckCircle2, Compass, Cpu, HelpCircle, AlertCircle
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { setLanguage } from '../../config/i18n';
import ThemeBuilder from '../../components/ui/ThemeBuilder';
import PhoneInput from '../../components/ui/PhoneInput';
import { cleanPhone } from '../../utils/formatPhone';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';

const PRESET_INTERESTS = [
  'Dasturlash va IT',
  'Kosmos va Astronomiya',
  'Tibbiyot va Anatomiya',
  'Genetika va Biotexnologiya',
  'Sport va Salomatlik',
  'Hayvonot olami va Zoologiya',
  'O\'simliklar va Botanika',
  'Fizika va Kimyo',
  'Robototexnika va AI',
  'Kiberxavfsizlik',
  'Tarix va Arxeologiya',
  'Matematika va Mantiq',
  'San\'at va Tasviriy san\'at',
  'Avtomobillar va Texnika',
  'Biznes va Startaplar',
  'Psixologiya va Rivojlanish',
];

const STYLE_OPTIONS = [
  {
    id: 'normal',
    title: 'Oddiy va tushunarli',
    desc: 'Barcha mavzularni ravon, sodda va professional tilda bayon qiladi',
    badge: 'Klassik',
  },
  {
    id: 'like_im_10',
    title: '10 yoshli boladek sodda',
    desc: 'Qiyin atamalardan qochib, eng oddiy va qiziqarli o\'xshatishlar bilan tushuntiradi',
    badge: 'Eng sodda',
  },
  {
    id: 'step_by_step',
    title: 'Qadamma-qadam tahlil',
    desc: 'Har bir jarayonni bosqichma-bosqich, raqamlangan mantiqiy ketma-ketlikda yoritadi',
    badge: 'Mantiqiy',
  },
  {
    id: 'with_examples',
    title: 'Hayotiy misollar bilan',
    desc: 'Har bir qoida va hodisani real kundalik hayotdagi voqealar bilan bog\'laydi',
    badge: 'Amaliy',
  },
  {
    id: 'academic',
    title: 'Akademik va chuqur ilmiy',
    desc: 'Olimpiada, DTM va oliygoh darajasidagi mukammal ilmiy tushuntirish beradi',
    badge: 'Chuqur',
  },
];

const DIFFICULTY_LEVELS = [
  { id: 'easy', label: 'Boshlang\'ich (Sodda tushunchalar)', desc: 'Asosiy tushunchalarni o\'zlashtirish uchun' },
  { id: 'medium', label: 'O\'rta (Maktab va litsey standarti)', desc: 'Darsliklar va imtihonlar talabiga mos' },
  { id: 'hard', label: 'Ilg\'or (Olimpiada va DTM chuqurlashtirilgan)', desc: 'Murakkab masalalar va ilmiy tahlil uchun' },
];

const PROMPT_TEMPLATES = [
  {
    label: 'Dasturlash va Algoritmlar',
    text: 'Menga biologik tizimlarni kompyuter dasturlash, algoritmlar va ma\'lumotlar tuzilmasi bilan taqqoslab tushuntirib ber.',
  },
  {
    label: 'Kosmos va Koinot',
    text: 'Biologiya mavzularini koinot, sayyoralar va astrofizika bilan bog\'lab, qiziqarli olam analogiyalari orqali bayon et.',
  },
  {
    label: 'Sport va Inson Tanasi',
    text: 'Biologik jarayonlarni sport mashg\'ulotlari, inson mushaklari, quvvat va sog\'lom turmush tarzi bilan bog\'lab tushuntir.',
  },
  {
    label: 'Qisqa va Faktlarga Boy',
    text: 'Javoblarni ortiqcha kiritishlarsiz, eng asosiy 3-4 muhim faktga ajratib, o\'qishga juda qulay qilib ber.',
  },
];

const THEME_PALETTES = [
  { id: 'emerald', name: 'Zumrad (Yashil)', primary: '#10b981', gradient: 'from-emerald-500 to-teal-700' },
  { id: 'sapphire', name: 'Safir (Moviy)', primary: '#3b82f6', gradient: 'from-blue-500 to-indigo-700' },
  { id: 'violet', name: 'Binafsha (Neon)', primary: '#8b5cf6', gradient: 'from-purple-500 to-indigo-800' },
  { id: 'amber', name: 'Qahrabo (Iliq)', primary: '#f59e0b', gradient: 'from-amber-500 to-orange-700' },
  { id: 'rose', name: 'Yoqut (Qizil)', primary: '#f43f5e', gradient: 'from-rose-500 to-pink-700' },
  { id: 'cyan', name: 'Moviy okean', primary: '#06b6d4', gradient: 'from-cyan-500 to-blue-700' },
];

export default function StudentSettings() {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const { applyTheme, activeThemeId } = useThemeStore();

  const [activeTab, setActiveTab] = useState('ai'); // 'ai' | 'appearance' | 'profile'

  // AI Preferences state
  const [interests, setInterests] = useState([]);
  const [customInterest, setCustomInterest] = useState('');
  const [style, setStyle] = useState('normal');
  const [difficulty, setDifficulty] = useState('medium');
  const [customPrompt, setCustomPrompt] = useState('');

  // Sandbox AI state
  const [testQuestion, setTestQuestion] = useState('Fotosintez jarayoni nima va u qanday kechadi?');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '+998 ',
    language: 'uz',
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirm: '',
  });

  // Load user data
  const { data: me, refetch: refetchMe } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data),
  });

  useEffect(() => {
    if (me) {
      setProfileForm({
        name: me.name || '',
        phone: me.phone || '+998 ',
        language: me.language || 'uz',
      });

      const aiPrefs = me.permissions?.aiPreferences || {};
      if (Array.isArray(aiPrefs.interests)) {
        setInterests(aiPrefs.interests);
      }
      if (aiPrefs.style) setStyle(aiPrefs.style);
      if (aiPrefs.difficulty) setDifficulty(aiPrefs.difficulty);
      if (aiPrefs.customPrompt) setCustomPrompt(aiPrefs.customPrompt);
    }
  }, [me]);

  // Save AI preferences mutation
  const saveAiMutation = useMutation({
    mutationFn: (aiPrefs) => api.put('/users/profile', { aiPreferences: aiPrefs }),
    onSuccess: ({ data }) => {
      updateUser(data.data);
      refetchMe();
      toast.success('AI sozlamalari muvaffaqiyatli saqlandi');
    },
    onError: (err) => {
      toast.error(friendlyAiErrorMessage(err));
    },
  });

  const handleSaveAiPreferences = () => {
    saveAiMutation.mutate({
      interests,
      style,
      difficulty,
      customPrompt: customPrompt.trim(),
    });
  };

  // Toggle interest
  const toggleInterest = (interest) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  // Add custom interest
  const handleAddCustomInterest = (e) => {
    e?.preventDefault();
    const trimmed = customInterest.trim();
    if (!trimmed) return;
    if (interests.includes(trimmed)) {
      toast.error('Bu qiziqish ro\'yxatda mavjud');
      return;
    }
    setInterests((prev) => [...prev, trimmed]);
    setCustomInterest('');
  };

  // Remove interest
  const handleRemoveInterest = (interest) => {
    setInterests((prev) => prev.filter((i) => i !== interest));
  };

  // Run AI sandbox test
  const handleRunAiTest = async (questionToAsk) => {
    const q = questionToAsk || testQuestion;
    if (!q?.trim()) {
      toast.error('Sinov savolini kiriting');
      return;
    }

    setIsTesting(true);
    setTestResponse('');
    try {
      const res = await api.post('/users/ai-test', {
        message: q.trim(),
        aiPreferences: {
          interests,
          style,
          difficulty,
          customPrompt: customPrompt.trim(),
          language: profileForm.language || 'uz',
        },
      });
      setTestResponse(res.data?.data?.reply || 'Javob olindi');
    } catch (err) {
      toast.error(friendlyAiErrorMessage(err));
    } finally {
      setIsTesting(false);
    }
  };

  // Save profile info mutation
  const saveProfileMutation = useMutation({
    mutationFn: (data) => api.put('/users/profile', { ...data, phone: cleanPhone(data.phone) }),
    onSuccess: ({ data }) => {
      updateUser(data.data);
      if (data.data?.language) {
        setLanguage(data.data.language);
      }
      refetchMe();
      toast.success(t('save') ? `${t('profile')} ${t('save')}` : 'Profil ma\'lumotlari yangilandi');
    },
    onError: (err) => toast.error(friendlyAiErrorMessage(err)),
  });

  // Change password mutation
  const pwMutation = useMutation({
    mutationFn: (data) => api.post('/users/change-password', data),
    onSuccess: () => {
      toast.success('Parol muvaffaqiyatli yangilandi');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (err) => toast.error(friendlyAiErrorMessage(err)),
  });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      return toast.error('Barcha maydonlarni to\'ldiring');
    }
    if (pwForm.newPassword.length < 6) {
      return toast.error('Yangi parol kamida 6 belgidan iborat bo\'lsin');
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      return toast.error('Yangi parollar mos kelmadi');
    }
    pwMutation.mutate({
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="card bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/20 p-5 sm:p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sliders size={13} />
              <span>O'quvchi kabineti</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
              Sozlamalar
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl">
              Platformaning tashqi ko'rinishi, ranglar va Abdora AI suhbatdoshini o'zingizning qiziqishlaringiz hamda xohishingizga moslashtiring.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs text-[var(--text-secondary)] bg-[var(--card)] px-3 py-1.5 rounded-xl border border-[var(--border)] font-medium">
              ID: {me?.username || user?.username || 'O\'quvchi'}
            </span>
          </div>
        </div>

        {/* Tab Buttons (100% width, No scroll on any screen) */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-5 p-1 bg-[var(--card)] sm:bg-[var(--secondary-background)] rounded-2xl border border-[var(--border)] w-full">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'ai'
                ? 'bg-primary text-white shadow-soft shadow-primary/20'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card)]'
            }`}
          >
            <Sparkles size={15} className="flex-shrink-0" />
            <span className="sm:hidden font-medium">AI</span>
            <span className="hidden sm:inline">{t('ai_personalization') || "AI Shaxsiylashtirish"}</span>
            {interests.length > 0 && (
              <span className={`hidden md:inline-block px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'ai' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                {interests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'appearance'
                ? 'bg-primary text-white shadow-soft shadow-primary/20'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card)]'
            }`}
          >
            <Palette size={15} className="flex-shrink-0" />
            <span className="sm:hidden font-medium">{t('themes_and_colors')?.split(' ')[0] || "Ranglar"}</span>
            <span className="hidden sm:inline">{t('themes_and_colors') || "Ranglar va Mavzular"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'profile'
                ? 'bg-primary text-white shadow-soft shadow-primary/20'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card)]'
            }`}
          >
            <User size={15} className="flex-shrink-0" />
            <span className="sm:hidden font-medium">{t('profile') || "Profil"}</span>
            <span className="hidden sm:inline">{t('profile_and_security') || "Profil va Xavfsizlik"}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: AI Shaxsiylashtirish */}
      {activeTab === 'ai' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Section 1: Interests */}
          <div className="card p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Heart size={18} className="text-primary" />
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    Sevimli sohalar va qiziqishlaringiz
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                  Qiziqqan sohalaringizni tanlang. Abdora AI darslarni tushuntirganda siz yaxshi ko'rgan mavzulardan qiyosiy misollar keltiradi.
                </p>
              </div>
              <div className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg self-start">
                Tanlangan: {interests.length} ta
              </div>
            </div>

            {/* Selected interests tags */}
            {interests.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Faol qiziqishlaringiz:
                </span>
                <div className="flex flex-wrap gap-2">
                  {interests.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary text-white text-xs font-semibold shadow-xs"
                    >
                      <Check size={12} />
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(item)}
                        className="hover:bg-white/20 p-0.5 rounded-full transition-colors ml-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Available standard categories chips */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Tavsiya etilgan qiziqishlar (bosib tanlang yoki o'chiring):
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_INTERESTS.map((interest) => {
                  const isSelected = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-primary/15 border-primary text-primary font-semibold'
                          : 'bg-[var(--secondary-background)] border-[var(--border)] text-[var(--text-primary)] hover:border-primary/50'
                      }`}
                    >
                      {isSelected ? <Check size={13} className="text-primary" /> : <Plus size={13} className="text-[var(--text-secondary)]" />}
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add Custom Interest input */}
            <form onSubmit={handleAddCustomInterest} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-md">
              <input
                type="text"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                placeholder="Boshqa qiziqishingiz (masalan: Shaxmat, Futbol...)"
                className="input-field text-xs sm:text-sm flex-1"
              />
              <button
                type="submit"
                disabled={!customInterest.trim()}
                className="btn-secondary text-xs sm:text-sm py-2 px-4 flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <Plus size={14} />
                Qo'shish
              </button>
            </form>
          </div>

          {/* Section 2: AI Style & Depth */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Style Selector */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                <Brain size={18} className="text-primary" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Muloqot uslubi
                </h3>
              </div>

              <div className="space-y-2.5">
                {STYLE_OPTIONS.map((opt) => {
                  const active = style === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setStyle(opt.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        active
                          ? 'border-primary bg-primary/5 shadow-xs'
                          : 'border-[var(--border)] bg-[var(--card)] hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${active ? 'border-primary bg-primary' : 'border-gray-400'}`}>
                            {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="font-semibold text-xs sm:text-sm text-[var(--text-primary)]">
                            {opt.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--secondary-background)] text-[var(--text-secondary)]">
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1.5 pl-6">
                        {opt.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Difficulty / Depth */}
            <div className="card p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                  <Compass size={18} className="text-primary" />
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Tushuntirish chuqurligi va daraja
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Darslardagi savollaringizga AI qanday darajada javob qaytarishini belgilang.
                </p>

                <div className="space-y-3 mt-4">
                  {DIFFICULTY_LEVELS.map((lvl) => {
                    const active = difficulty === lvl.id;
                    return (
                      <div
                        key={lvl.id}
                        onClick={() => setDifficulty(lvl.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          active
                            ? 'border-primary bg-primary/5 shadow-xs'
                            : 'border-[var(--border)] bg-[var(--card)] hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${active ? 'border-primary bg-primary' : 'border-gray-400'}`}>
                            {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="font-semibold text-xs sm:text-sm text-[var(--text-primary)]">
                            {lvl.label}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 pl-6">
                          {lvl.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status card */}
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs space-y-1 mt-4">
                <div className="flex items-center gap-1.5 text-primary font-bold">
                  <CheckCircle2 size={14} />
                  <span>Avtomatik qo'llanish</span>
                </div>
                <p className="text-[var(--text-secondary)]">
                  Ushbu sozlamalar har bir darsdagi AI Chat, Fleshkartalar va AI tushuntirish bo'limlarida doimiy inobatga olinadi.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Custom Prompt Instructions */}
          <div className="card p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-primary" />
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    Abdora AI uchun shaxsiy ko'rsatmalar va sevimli narsalaringiz
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                  AI sizga javob berayotganda nimalarga e'tibor qaratishini xohlaysiz? O'zingiz yoqtirgan uslub yoki qoidalarni yozib qo'ying.
                </p>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                Tayyor namunalar (ustiga bosib qo'shishingiz mumkin):
              </span>
              <div className="flex flex-wrap gap-2">
                {PROMPT_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCustomPrompt((prev) =>
                        prev ? `${prev}\n${tmpl.text}` : tmpl.text
                      );
                      toast.success('Namuna kiritildi');
                    }}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[var(--secondary-background)] border border-[var(--border)] text-[var(--text-primary)] hover:border-primary/50 transition-colors"
                  >
                    + {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt Textarea */}
            <div className="space-y-2">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={4}
                maxLength={600}
                placeholder="Masalan: Men dasturlashga va kosmosga juda qiziqaman. Biologiyani tushuntirayotganingizda kompyuter algoritmlari yoki koinot bilan qiyoslab tushuntirib bering. Javoblaringiz qisqa, aniq va hayotiy misollarga boy bo'lsin..."
                className="input-field text-xs sm:text-sm leading-relaxed"
              />
              <div className="flex justify-between items-center text-[11px] text-[var(--text-secondary)]">
                <span>Maksimal 600 ta belgi</span>
                <span>{customPrompt.length} / 600</span>
              </div>
            </div>

            {/* Save AI Preferences Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
              <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                <Sparkles size={13} className="text-primary flex-shrink-0" />
                <span>O'zgarishlar saqlanganidan so'ng barcha darslarda darhol ishga tushadi.</span>
              </div>
              <button
                type="button"
                onClick={handleSaveAiPreferences}
                disabled={saveAiMutation.isPending}
                className="btn-primary w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-soft"
              >
                {saveAiMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                <span>AI Sozlamalarini Saqlash</span>
              </button>
            </div>
          </div>

          {/* Section 4: Live AI Test Sandbox */}
          <div className="card p-5 sm:p-6 space-y-4 border-2 border-primary/20 bg-gradient-to-b from-primary/[0.03] to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-primary" />
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    Abdora AI Jonli Sinov Qutisi
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                  Yuqorida belgilagan qiziqishlaringiz va yo'riqnomangiz qanday ishlashini shu yerning o'zida tekshirib ko'ring.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 self-start">
                Sinov maydoni
              </span>
            </div>

            {/* Quick Test Chips */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-[var(--text-secondary)] self-center mr-1">Tezkor savollar:</span>
              {[
                'Fotosintez nima va u qanday kechadi?',
                'DNK qanday tuzilgan va qanday ishlaydi?',
                'Inson yuragi qanday qilib qon haydaydi?',
                'Immunitet tizimi viruslarga qanday javob qaytaradi?',
              ].map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTestQuestion(q);
                    handleRunAiTest(q);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--secondary-background)] hover:border-primary/50 border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Question Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={testQuestion}
                onChange={(e) => setTestQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isTesting && handleRunAiTest()}
                placeholder="Sinash uchun istalgan savolni yozing..."
                className="input-field text-xs sm:text-sm flex-1"
              />
              <button
                type="button"
                onClick={() => handleRunAiTest()}
                disabled={isTesting || !testQuestion.trim()}
                className="btn-primary px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5 disabled:opacity-40 flex-shrink-0"
              >
                {isTesting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                <span>Sinab ko'rish</span>
              </button>
            </div>

            {/* AI Response Display */}
            {isTesting && (
              <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span>Abdora AI sizning qiziqishlaringiz bo'yicha javob tayyorlamoqda...</span>
              </div>
            )}

            {testResponse && !isTesting && (
              <div className="p-4 rounded-xl bg-[var(--card)] border border-primary/30 space-y-2">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-bold">
                      A
                    </div>
                    <span className="font-bold text-xs text-[var(--text-primary)]">
                      Abdora AI Javobi
                    </span>
                  </div>
                  <span className="text-[10px] text-primary font-medium">
                    Moslashtirilgan javob
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                  {testResponse}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab 2: Ranglar va Dizayn */}
      {activeTab === 'appearance' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Quick theme picker card */}
          <div className="card p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <Palette size={18} className="text-primary" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                  Tezkor rang sxemalari
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  O'zingizga yoqqan rang mavzusini tanlang va butun tizim bir zumda o'zgaradi.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {THEME_PALETTES.map((pal) => {
                const isActive = activeThemeId === pal.id;
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => applyTheme(pal.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                        : 'border-[var(--border)] hover:border-primary/40 bg-[var(--card)]'
                    }`}
                  >
                    <div className={`h-8 rounded-lg bg-gradient-to-r ${pal.gradient} mb-2 shadow-xs`} />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {pal.name.split(' ')[0]}
                      </span>
                      {isActive && <Check size={12} className="text-primary flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full ThemeBuilder integration */}
          <div className="card p-4 sm:p-6">
            <ThemeBuilder embedded={true} />
          </div>
        </motion.div>
      )}

      {/* Tab 3: Profil va Xavfsizlik */}
      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Details */}
            <div className="card p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                <User size={18} className="text-primary" />
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Shaxsiy ma'lumotlar
                </h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                    To'liq ism-familiya
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="input-field text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                    Telefon raqam
                  </label>
                  <PhoneInput
                    value={profileForm.phone}
                    onChange={(phone) => setProfileForm({ ...profileForm, phone })}
                    className="input-field text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                    Platforma tili
                  </label>
                  <select
                    value={profileForm.language}
                    onChange={(e) => {
                      const newLang = e.target.value;
                      setProfileForm((prev) => ({ ...prev, language: newLang }));
                      setLanguage(newLang);
                      updateUser({ language: newLang });
                      api.patch('/users/language', { language: newLang }).catch(() => {});
                    }}
                    className="input-field text-xs sm:text-sm"
                  >
                    <option value="uz">O'zbek tili</option>
                    <option value="ru">Русский язык</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => saveProfileMutation.mutate(profileForm)}
                    disabled={saveProfileMutation.isPending}
                    className="btn-primary w-full py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    {saveProfileMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    <span>Ma'lumotlarni saqlash</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Password Change */}
            <div className="card p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                <KeyRound size={18} className="text-primary" />
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Parolni o'zgartirish
                </h2>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                    Joriy parol
                  </label>
                  <input
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    className="input-field text-xs sm:text-sm"
                    placeholder="Eski parolingizni kiriting"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                    Yangi parol
                  </label>
                  <input
                    type="password"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    className="input-field text-xs sm:text-sm"
                    placeholder="Kamida 6 ta belgi"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                    Yangi parolni tasdiqlang
                  </label>
                  <input
                    type="password"
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                    className="input-field text-xs sm:text-sm"
                    placeholder="Yangi parolni qayta kiriting"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={pwMutation.isPending}
                    className="btn-secondary w-full py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    {pwMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Shield size={15} />}
                    <span>Parolni yangilash</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
