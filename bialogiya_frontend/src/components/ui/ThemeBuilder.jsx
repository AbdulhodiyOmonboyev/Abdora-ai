import { useEffect, useMemo, useState } from 'react';
import {
  Palette,
  Sparkles,
  Check,
  Copy,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Eye,
  Sliders,
  Sun,
  Moon,
  Search,
  CheckCircle2,
  Layers,
  LayoutGrid,
  Type,
  ShieldCheck,
  X,
  CreditCard,
  Users,
  TrendingUp,
  FileCode,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useThemeStore } from '../../store/themeStore';
import { themePresets, applyThemeVars } from '../../utils/themeUtils';

// O'zbekcha nomlar xaritasi (tayyor mavzular uchun)
const PRESET_DISPLAY_NAMES = {
  'preset-light': "Yorug' (Klassik)",
  'preset-dark': "Tungi (To'q ko'k)",
  'preset-amoled': "AMOLED (Chuqur qora)",
  'preset-telegram': "Telegram Moviy",
  'preset-blue-ocean': "Moviy Ummon (Ocean)",
  'preset-purple-neon': "Binafsha Neon (Purple)",
  'preset-emerald': "Zumrad Yashil (Emerald)",
  'preset-sunset': "Quyosh botishi (Sunset)",
  'preset-rose': "Pushti Nafis (Rose)",
  'preset-cyberpunk': "Kiberpank (Cyberpunk)",
  'preset-minimal-gray': "Minimalist Kulrang",
};

// Ranglar guruhlari (O'zbekcha professional tavsiflar bilan)
const COLOR_GROUPS = [
  {
    id: 'brand',
    title: 'Asosiy brend ranglari',
    description: "Tizimning asosiy brend uslubi, urg'u va harakat tugmalari",
    icon: Sparkles,
    fields: [
      { key: 'primaryColor', label: 'Asosiy brend rangi', hint: 'Asosiy tugmalar, faol havolalar va nishonlar' },
      { key: 'secondaryColor', label: "Qo'shimcha rang", hint: 'Grafiklar, filtrlar va ikkinchi darajali elementlar' },
      { key: 'accentColor', label: "Urg'u rangi (Accent)", hint: "Diqqat jalb qiluvchi maxsus elementlar va bayroqchalar" },
      { key: 'buttonColor', label: 'Asosiy tugma rangi', hint: "Harakat tugmalari (Saqlash, Qo'shish)" },
      { key: 'buttonHover', label: 'Tugma hover holati', hint: 'Sichqoncha kursor borgandagi rang' },
      { key: 'buttonText', label: 'Tugma matni rangi', hint: 'Tugma ichidagi yozuv rangi' },
    ],
  },
  {
    id: 'surfaces',
    title: 'Fon va interfeys panellari',
    description: 'Sahifa foni, kartochkalar, yon menyu va yuqori panel',
    icon: LayoutGrid,
    fields: [
      { key: 'background', label: 'Umumiy sahifa foni', hint: 'Barcha sahifalarning asosiy foni' },
      { key: 'secondaryBackground', label: 'Yordamchi fon', hint: 'Bloklar va jadvallarning ichki foni' },
      { key: 'cardBackground', label: 'Kartochka foni (Card)', hint: "Statistika va ma'lumot kartalari foni" },
      { key: 'surfaceColor', label: 'Panel foni (Surface)', hint: 'Ichki modallar va ajratilgan hududlar' },
      { key: 'navbarBackground', label: 'Yuqori panel foni (Navbar)', hint: 'Qidiruv va profil paneli foni' },
      { key: 'sidebarBackground', label: 'Yon menyu foni (Sidebar)', hint: 'Asosiy navigatsiya paneli' },
      { key: 'footerBackground', label: 'Pastki qism foni (Footer)', hint: 'Sahifaning pastki qismi foni' },
    ],
  },
  {
    id: 'typography',
    title: 'Matn, chegaralar va formalar',
    description: 'Yozuvlar kontrasti, chegara chiziqlari va kiritish maydonlari',
    icon: Type,
    fields: [
      { key: 'textPrimary', label: 'Asosiy matn rangi', hint: "Sarlavhalar va asosiy ma'lumotlar matni" },
      { key: 'textSecondary', label: 'Ikkinchi darajali matn', hint: 'Tavsiflar, yorliqlar va hisobotlar matni' },
      { key: 'textMuted', label: 'Xira matn rangi', hint: 'Sana, vaqt va yordamchi matnlar' },
      { key: 'borderColor', label: 'Asosiy chegara (Border)', hint: 'Kartochkalar va bloklar chegarasi' },
      { key: 'dividerColor', label: 'Ajratuvchi chiziq (Divider)', hint: "Bo'limlar orasidagi chiziq" },
      { key: 'inputBackground', label: 'Kiritish maydoni foni', hint: 'Input va formalar foni' },
      { key: 'inputBorder', label: 'Kiritish maydoni chegarasi', hint: 'Input va formalar atrofi' },
    ],
  },
  {
    id: 'status',
    title: 'Holat va tizim bildirishnomalari',
    description: "Muvaffaqiyat, ogohlantirish, xatolik va axborot ko'rsatkichlari",
    icon: ShieldCheck,
    fields: [
      { key: 'successColor', label: 'Muvaffaqiyat (Yashil)', hint: "To'langan, faol va tasdiqlangan amallar" },
      { key: 'warningColor', label: 'Ogohlantirish (Sariq)', hint: 'Qarz, kechikish va ogohlantirishlar' },
      { key: 'errorColor', label: 'Xatolik (Qizil)', hint: "To'xtatilgan, rad etilgan yoki xato" },
      { key: 'infoColor', label: "Axborot (Ko'k)", hint: 'Eslatmalar, yangiliklar va maslahatlar' },
    ],
  },
];

const getThemeList = (savedThemes) => [...themePresets, ...savedThemes];

export default function ThemeBuilder({ embedded = false }) {
  const {
    savedThemes,
    activeThemeId,
    applyTheme,
    createCustomTheme,
    updateTheme,
    renameTheme,
    duplicateTheme,
    deleteTheme,
    resetTheme,
    importTheme,
    exportTheme,
  } = useThemeStore();

  const themes = useMemo(() => getThemeList(savedThemes), [savedThemes]);
  const activeTheme = useMemo(
    () => themes.find((theme) => theme.id === activeThemeId) || themes[0],
    [themes, activeThemeId]
  );

  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'customizer' | 'preview'
  const [activeColorGroup, setActiveColorGroup] = useState('brand');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'light' | 'dark' | 'custom'
  const [searchQuery, setSearchQuery] = useState('');
  const [editingValues, setEditingValues] = useState(activeTheme.values);
  const [themeName, setThemeName] = useState(activeTheme.name);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonMode, setJsonMode] = useState('export'); // 'export' | 'import'

  const isCustom = activeTheme.type === 'custom';

  useEffect(() => {
    setEditingValues(activeTheme.values);
    setThemeName(activeTheme.name);
  }, [activeTheme.id, activeTheme.values, activeTheme.name]);

  useEffect(() => {
    if (activeTab === 'customizer') {
      applyThemeVars(editingValues, activeTheme.mode);
    }
  }, [editingValues, activeTheme.mode, activeTab]);

  const handleSelectTheme = (id) => {
    applyTheme(id);
    const found = themes.find((t) => t.id === id);
    if (found) {
      setEditingValues(found.values);
      setThemeName(found.name);
      toast.success(`"${PRESET_DISPLAY_NAMES[id] || found.name}" mavzusi tanlandi`);
    }
  };

  const handleFieldChange = (key, value) => {
    const normalized = value.startsWith('#') ? value : `#${value}`;
    setEditingValues((prev) => ({ ...prev, [key]: normalized }));
  };

  const handleSaveTheme = () => {
    if (!themeName.trim()) {
      toast.error('Mavzu nomini kiriting');
      return;
    }
    if (isCustom) {
      updateTheme(activeTheme.id, editingValues);
      renameTheme(activeTheme.id, themeName.trim());
      toast.success("Mavzu o'zgarishlari saqlandi");
    } else {
      createCustomTheme(themeName.trim() || 'Mening mavzum', editingValues, activeTheme.mode);
      toast.success("Yangi maxsus mavzu yaratildi va saqlandi");
    }
  };

  const handleDuplicateTheme = (themeId = activeTheme.id) => {
    duplicateTheme(themeId);
    setActiveTab('customizer');
    toast.success("Mavzudan nusxa olindi. Endi uni o'zingizga moslashingiz mumkin.");
  };

  const handleDeleteTheme = (themeId = activeTheme.id) => {
    if (window.confirm("Rostdan ham ushbu maxsus mavzuni o'chirmoqchimisiz?")) {
      deleteTheme(themeId);
      toast.success("Mavzu o'chirildi");
    }
  };

  const handleReset = () => {
    if (window.confirm("Barcha rang sozlamalarini standart holatga qaytarmoqchimisiz?")) {
      resetTheme();
      toast.success("Mavzular standart holatga qaytarildi");
    }
  };

  const openExportModal = () => {
    const raw = exportTheme(activeTheme.id);
    setJsonText(raw);
    setJsonMode('export');
    setShowJsonModal(true);
  };

  const openImportModal = () => {
    setJsonText('');
    setJsonMode('import');
    setShowJsonModal(true);
  };

  const handleImportSubmit = () => {
    try {
      const parsed = JSON.parse(jsonText);
      importTheme(parsed);
      setShowJsonModal(false);
      setJsonText('');
      toast.success("Mavzu muvaffaqiyatli import qilindi va qo'llandi");
    } catch {
      toast.error("JSON format noto'g'ri. Iltimos, to'g'ri JSON kodini kiriting.");
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText);
    toast.success("JSON kod buferga nusxalandi");
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(activeTheme.name || 'theme').toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Mavzu fayli yuklab olindi");
  };

  // Filtered themes
  const filteredThemes = useMemo(() => {
    return themes.filter((t) => {
      const displayName = PRESET_DISPLAY_NAMES[t.id] || t.name;
      const matchesSearch = displayName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filterMode === 'light') return t.mode === 'light';
      if (filterMode === 'dark') return t.mode === 'dark' || t.mode === 'amoled';
      if (filterMode === 'custom') return t.type === 'custom';
      return true;
    });
  }, [themes, searchQuery, filterMode]);

  return (
    <div className={`w-full space-y-6 ${embedded ? '' : 'card p-4 sm:p-6'}`}>
      {/* ── Yuqori sarlavha va tezkor harakatlar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <Palette size={18} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              Mavzular va Tizim Ko'rinishi
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Tayyor dizayn mavzularini tanlang, o'zingizga mos ranglar palitrasini yarating yoki sozlang.
          </p>
        </div>

        {/* Tugmalar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openImportModal}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            title="Mavzu JSON kodini import qilish"
          >
            <Upload size={14} /> Import
          </button>
          <button
            type="button"
            onClick={openExportModal}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            title="Mavzu JSON kodini eksport qilish"
          >
            <Download size={14} /> Eksport
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="btn-ghost text-xs py-2 px-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5"
            title="Barcha ranglarni standartga qaytarish"
          >
            <RotateCcw size={14} /> Tiklash
          </button>
        </div>
      </div>

      {/* ── Bo'lim navigatsiyasi (Sub-tabs) ── */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[var(--secondary-background)] border border-[var(--border)] max-w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'presets'
              ? 'bg-[var(--card)] text-[var(--primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sparkles size={15} /> Tayyor mavzular ({themes.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('customizer')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'customizer'
              ? 'bg-[var(--card)] text-[var(--primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sliders size={15} /> Ranglar konstruktori
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'preview'
              ? 'bg-[var(--card)] text-[var(--primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Eye size={15} /> Jonli ko'rinish
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          1. TAYYOR MAVZULAR (PRESETS)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'presets' && (
        <div className="space-y-4">
          {/* Filtr va Qidiruv */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Rejim filtrlari */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'Barchasi', icon: Layers },
                { id: 'light', label: "Yorug'", icon: Sun },
                { id: 'dark', label: "Tungi / Qorong'u", icon: Moon },
                { id: 'custom', label: 'Mening mavzularim', icon: Palette },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilterMode(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    filterMode === id
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]'
                      : 'bg-[var(--card)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--secondary-background)]'
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            {/* Qidiruv */}
            <div className="relative w-full sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Mavzuni qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-8 py-1.5 text-xs w-full"
              />
            </div>
          </div>

          {/* Mavzular gridi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredThemes.map((theme) => {
              const isCurrent = theme.id === activeThemeId;
              const displayName = PRESET_DISPLAY_NAMES[theme.id] || theme.name;
              const modeLabel =
                theme.mode === 'amoled'
                  ? 'AMOLED'
                  : theme.mode === 'dark'
                  ? "Qorong'u"
                  : "Yorug'";

              return (
                <div
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`relative cursor-pointer rounded-2xl border p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between gap-3 ${
                    isCurrent
                      ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20 bg-[var(--card)]'
                      : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  {/* Tepa qator: Nomi va Holat nishoni */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-sm text-[var(--text-primary)] truncate">
                        {displayName}
                      </span>
                      {theme.type === 'custom' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-[var(--primary)]/15 text-[var(--primary)]">
                          Maxsus
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] bg-[var(--secondary-background)]">
                        {modeLabel}
                      </span>
                      {isCurrent && (
                        <span className="w-5 h-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ranglar palitrasi (Pills) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      {[
                        { key: 'background', title: 'Fon' },
                        { key: 'cardBackground', title: 'Kartochka' },
                        { key: 'primaryColor', title: 'Asosiy' },
                        { key: 'secondaryColor', title: "Qo'shimcha" },
                        { key: 'accentColor', title: "Urg'u" },
                      ].map(({ key, title }) => (
                        <div
                          key={key}
                          title={`${title}: ${theme.values[key]}`}
                          className="h-6 flex-1 rounded-md border border-[var(--border)] shadow-xs transition-transform hover:scale-105"
                          style={{ backgroundColor: theme.values[key] }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Interaktiv namunaviy minikarta */}
                  <div
                    className="p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors"
                    style={{
                      backgroundColor: theme.values.secondaryBackground || theme.values.background,
                      borderColor: theme.values.borderColor,
                    }}
                  >
                    <span style={{ color: theme.values.textPrimary }} className="font-medium text-[11px]">
                      Namunaviy tugma:
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold shadow-xs"
                      style={{
                        backgroundColor: theme.values.buttonColor || theme.values.primaryColor,
                        color: theme.values.buttonText || '#ffffff',
                      }}
                    >
                      Boshlash
                    </span>
                  </div>

                  {/* Pastki amallar paneli */}
                  <div className="flex items-center justify-between pt-1 border-t border-[var(--border)] gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTheme(theme.id);
                      }}
                      className={`text-xs font-semibold py-1 px-2.5 rounded-lg transition-colors flex items-center gap-1 ${
                        isCurrent
                          ? 'text-[var(--primary)] font-bold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--primary)]'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <CheckCircle2 size={13} /> Faol mavzu
                        </>
                      ) : (
                        'Mavzuni qo‘llash'
                      )}
                    </button>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleDuplicateTheme(theme.id)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--secondary-background)] transition-colors"
                        title="Ushbu mavzudan nusxa olib tahrirlash"
                      >
                        <Copy size={13} />
                      </button>

                      {theme.type === 'custom' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTheme(theme.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                          title="Maxsus mavzuni o'chirish"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredThemes.length === 0 && (
            <div className="text-center py-10 border border-dashed border-[var(--border)] rounded-2xl p-6">
              <Palette size={32} className="mx-auto text-[var(--text-muted)] mb-2" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Hech qanday mavzu topilmadi</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Qidiruv so'zini o'zgartirib ko'ring yoki boshqa filtrni tanlang.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          2. RANGLAR KONSTRUKTORI (CUSTOMIZER)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'customizer' && (
        <div className="space-y-5">
          {/* Mavzu nomini boshqarish va saqlash */}
          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--secondary-background)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Maxsus mavzu nomi
              </label>
              <input
                type="text"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="Mavzu nomini kiriting (masalan: Markaz Yashil)"
                className="input-field w-full font-semibold text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSaveTheme}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 font-semibold"
              >
                <Check size={14} /> {isCustom ? "O'zgarishlarni saqlash" : 'Yangi mavzu sifatida saqlash'}
              </button>

              <button
                type="button"
                onClick={() => handleDuplicateTheme(activeTheme.id)}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                title="Mavzudan nusxa olish"
              >
                <Copy size={14} /> Nusxalash
              </button>

              {isCustom && (
                <button
                  type="button"
                  onClick={() => handleDeleteTheme(activeTheme.id)}
                  className="btn-ghost text-xs py-2 px-3 text-red-500 hover:bg-red-500/10 flex items-center gap-1.5"
                  title="Ushbu mavzuni o'chirish"
                >
                  <Trash2 size={14} /> O'chirish
                </button>
              )}
            </div>
          </div>

          {/* Kategoriya tablari */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-2">
            {COLOR_GROUPS.map((group) => {
              const Icon = group.icon;
              const isActive = activeColorGroup === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveColorGroup(group.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[var(--primary)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--secondary-background)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon size={14} /> {group.title}
                </button>
              );
            })}
          </div>

          {/* Tanlangan ranglar guruhining sozlamalari */}
          {COLOR_GROUPS.filter((g) => g.id === activeColorGroup).map((group) => (
            <div key={group.id} className="space-y-3">
              <div className="text-xs text-[var(--text-secondary)]">
                {group.description}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {group.fields.map((field) => {
                  const currentValue = editingValues[field.key] || '#000000';
                  return (
                    <div
                      key={field.key}
                      className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-between gap-3 transition-colors hover:border-[var(--primary)]/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {field.label}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] truncate">
                          {field.hint}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Native Rang tanlash maydoni */}
                        <div className="relative w-9 h-9 rounded-xl border border-[var(--border)] overflow-hidden shadow-xs cursor-pointer">
                          <input
                            type="color"
                            value={currentValue}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer opacity-0"
                          />
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: currentValue }}
                          />
                        </div>

                        {/* Hex kod matni */}
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="input-field text-xs uppercase font-mono w-24 text-center py-1.5"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          3. JONLI KO'RINISh (LIVE PREVIEW MOCKUP)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Tizim elementlari hozirgi faol ranglarda qanday ko'rinishini tekshiring:</span>
            <span className="font-semibold text-[var(--primary)]">Jonli sinxronizatsiya</span>
          </div>

          {/* Mini Interfeys Simulatori */}
          <div
            className="rounded-3xl border shadow-lg overflow-hidden transition-all duration-300"
            style={{
              backgroundColor: editingValues.background,
              borderColor: editingValues.borderColor,
            }}
          >
            {/* Mockup Yuqori menyu (Navbar) */}
            <div
              className="p-3 px-4 border-b flex items-center justify-between transition-colors"
              style={{
                backgroundColor: editingValues.navbarBackground,
                borderColor: editingValues.dividerColor,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                  style={{
                    backgroundColor: editingValues.primaryColor,
                    color: editingValues.buttonText || '#ffffff',
                  }}
                >
                  N
                </div>
                <span
                  className="text-xs font-bold"
                  style={{ color: editingValues.textPrimary }}
                >
                  Neyron Ta'lim Markazi
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className="px-3 py-1 rounded-lg text-[11px] border"
                  style={{
                    backgroundColor: editingValues.inputBackground,
                    borderColor: editingValues.inputBorder,
                    color: editingValues.textSecondary,
                  }}
                >
                  Qidirish...
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border"
                  style={{
                    backgroundColor: editingValues.surfaceColor,
                    color: editingValues.primaryColor,
                    borderColor: editingValues.borderColor,
                  }}
                >
                  A
                </div>
              </div>
            </div>

            {/* Asosiy qism (Sidebar + Content) */}
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] min-h-[300px]">
              {/* Mockup Yon menyu */}
              <div
                className="p-3 border-r hidden md:block space-y-1.5 transition-colors"
                style={{
                  backgroundColor: editingValues.sidebarBackground,
                  borderColor: editingValues.dividerColor,
                }}
              >
                <div
                  className="text-[10px] font-semibold uppercase px-2 py-1"
                  style={{ color: editingValues.textMuted }}
                >
                  Menyu
                </div>
                {[
                  { label: 'Bosh sahifa', active: true },
                  { label: 'Guruhlar', active: false },
                  { label: "O'quvchilar", active: false },
                  { label: "To'lovlar", active: false },
                  { label: 'Sozlamalar', active: false },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: item.active
                        ? `${editingValues.primaryColor}20`
                        : 'transparent',
                      color: item.active
                        ? editingValues.primaryColor
                        : editingValues.textSecondary,
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Mockup Kontent paneli */}
              <div className="p-4 space-y-4">
                {/* Statistika kartalari */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { title: "Faol o'quvchilar", value: '348 nafar', icon: Users, color: editingValues.primaryColor },
                    { title: "Oylik tushum", value: '42.5 mln', icon: CreditCard, color: editingValues.successColor },
                    { title: "O'rtacha davomat", value: '96.4%', icon: TrendingUp, color: editingValues.accentColor },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl border shadow-xs transition-colors"
                      style={{
                        backgroundColor: editingValues.cardBackground,
                        borderColor: editingValues.borderColor,
                      }}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span style={{ color: editingValues.textSecondary }}>{stat.title}</span>
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${stat.color}15`,
                            color: stat.color,
                          }}
                        >
                          <stat.icon size={13} />
                        </div>
                      </div>
                      <div
                        className="text-sm font-bold"
                        style={{ color: editingValues.textPrimary }}
                      >
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Namuna amallar bloki */}
                <div
                  className="p-4 rounded-2xl border space-y-3"
                  style={{
                    backgroundColor: editingValues.cardBackground,
                    borderColor: editingValues.borderColor,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="font-bold text-xs"
                      style={{ color: editingValues.textPrimary }}
                    >
                      Amallar va Tugmalar ko'rinishi
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold"
                      style={{
                        backgroundColor: `${editingValues.successColor}20`,
                        color: editingValues.successColor,
                      }}
                    >
                      Muvaffaqiyatli
                    </span>
                  </div>

                  <p
                    className="text-xs"
                    style={{ color: editingValues.textSecondary }}
                  >
                    Ushbu ranglar kombinatsiyasi matn o'qilishi va kontrast bo'yicha standartlarga to'liq mos keladi.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs"
                      style={{
                        backgroundColor: editingValues.buttonColor || editingValues.primaryColor,
                        color: editingValues.buttonText || '#ffffff',
                      }}
                    >
                      Asosiy tugma
                    </button>

                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border"
                      style={{
                        backgroundColor: editingValues.secondaryBackground,
                        color: editingValues.textPrimary,
                        borderColor: editingValues.borderColor,
                      }}
                    >
                      Yordamchi tugma
                    </button>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ color: editingValues.accentColor }}
                    >
                      Urg'u havolasi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── JSON Import / Eksport Modali ── */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <FileCode size={18} className="text-[var(--primary)]" />
                <h4 className="text-base font-bold text-[var(--text-primary)]">
                  {jsonMode === 'export' ? 'Mavzu JSON kodini eksport qilish' : 'Mavzu JSON faylini import qilish'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              {jsonMode === 'export'
                ? "Ushbu JSON kod orqali mavzuni boshqa qurilmalarga o'tkazish yoki saqlab qo'yish mumkin."
                : "Ilgari eksport qilingan mavzu JSON matnini shu yerga joylashtiring va tasdiqlang."}
            </p>

            <textarea
              rows={8}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              readOnly={jsonMode === 'export'}
              placeholder={jsonMode === 'import' ? '{\n  "name": "Mening mavzum",\n  "values": { ... }\n}' : ''}
              className="input-field w-full font-mono text-xs resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              {jsonMode === 'export' ? (
                <>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
                  >
                    <Copy size={14} /> Nusxa olish
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                  >
                    <Download size={14} /> Faylni yuklash (.json)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowJsonModal(false)}
                    className="btn-ghost text-xs py-2 px-3.5"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    onClick={handleImportSubmit}
                    className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                  >
                    <Upload size={14} /> Import qilish va qo'llash
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
