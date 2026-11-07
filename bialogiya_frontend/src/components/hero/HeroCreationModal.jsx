import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Check, ArrowRight, ArrowLeft, Wand2, Award, Search,
  X, Dices, Sliders, User, Briefcase, Ruler, Weight, Palette, Scissors
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import HeroAvatar2D from './HeroAvatar2D';

export default function HeroCreationModal({ isOpen, onClose, onHeroCreated, availableRaces = [] }) {
  const [step, setStep] = useState(1); // 1: Race, 2: Body/Appearance, 3: Career & Name

  // Customization State
  const [selectedRace, setSelectedRace] = useState('race_111_inson_robotik_jarroh');
  const [height, setHeight] = useState(175); // 140 - 200 cm
  const [weight, setWeight] = useState(70);  // 40 - 120 kg
  const [skinTone, setSkinTone] = useState('#ffd1b3');
  const [hairStyle, setHairStyle] = useState('short');
  const [hairColor, setHairColor] = useState('#1e293b');
  const [dreamJob, setDreamJob] = useState('robotic_surgeon');
  const [heroName, setHeroName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Catalog State
  const [allRaces, setAllRaces] = useState(availableRaces || []);
  const [categories, setCategories] = useState([]);
  const [careersList, setCareersList] = useState([]);
  const [activeCategory, setActiveCategory] = useState('human_civilization');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch full catalog
  useEffect(() => {
    if (!isOpen) return;
    const fetchCatalog = async () => {
      try {
        const res = await api.get('/student/hero/races');
        const data = res.data?.data;
        if (data && Array.isArray(data.races)) {
          setAllRaces(data.races);
          setCategories(data.categories || []);
          if (Array.isArray(data.careers) && data.careers.length > 0) {
            setCareersList(data.careers);
          }
        }
      } catch (err) {
        console.warn('Could not load races catalog', err);
      }
    };
    fetchCatalog();
  }, [isOpen]);

  // Skin tone palette options
  const skinTones = [
    { id: 'fair', color: '#ffd1b3', label: 'Tabiiy oq' },
    { id: 'tan', color: '#d89b6b', label: 'Bug\'doyrang' },
    { id: 'bronze', color: '#8d5524', label: 'Bronza' },
    { id: 'elf_ivory', color: '#ffe8df', label: 'Elf nilufar' },
    { id: 'cyber_silver', color: '#cfd8dc', label: 'Kiber po\'lat' },
    { id: 'ocean_aqua', color: '#70c1b3', label: 'Okean firuza' },
  ];

  // Hair colors
  const hairColors = [
    { id: 'dark', color: '#1e293b', label: 'Qora' },
    { id: 'gold', color: '#f59e0b', label: 'Oltin' },
    { id: 'silver', color: '#e2e8f0', label: 'Kumush' },
    { id: 'neon_cyan', color: '#06b6d4', label: 'Kiber Moviy' },
    { id: 'emerald', color: '#10b981', label: 'Zumrad' },
    { id: 'crimson', color: '#ef4444', label: 'Olovrang' },
  ];

  // Hair styles
  const hairStyles = [
    { id: 'short', label: 'Klassik Zamonaviy' },
    { id: 'flowing', label: 'Uzun Oqimli' },
    { id: 'fade', label: 'Kiber-Feyd' },
  ];

  // Helper: Build description label
  const getBuildLabel = (w) => {
    if (w < 55) return 'Ozg\'in / Nozik';
    if (w <= 75) return 'Atletik / O\'rtacha';
    if (w <= 95) return 'Baquvvat';
    return 'Semiz / Gigant';
  };

  const getHeightLabel = (h) => {
    if (h < 155) return 'Past bo\'yli';
    if (h <= 178) return 'O\'rtacha bo\'yli';
    return 'Baland bo\'yli';
  };

  // Find currently selected race & job objects
  const selectedRaceObj = useMemo(() => {
    return allRaces.find((r) => r.id === selectedRace) || allRaces[0] || {
      id: 'race_111_inson_robotik_jarroh',
      name: 'Inson: Shifokor va Robotik Jarroh',
      primaryName: 'Inson: Robotik Jarroh',
      categoryId: 'human_civilization',
      category: 'Insoniyat va Real Kasblar',
      passiveBonus: 'Anatomiya va fiziologiya darslarida +20% qo\'shimcha XP',
    };
  }, [allRaces, selectedRace]);

  // Filtered races for Step 1
  const displayRaces = useMemo(() => {
    let list = allRaces;
    if (activeCategory !== 'all') {
      list = list.filter((r) => r.categoryId === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q) ||
          r.abilities?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allRaces, activeCategory, searchQuery]);

  // Fallback Modern Careers
  const defaultCareers = [
    { id: 'robotic_surgeon', title: 'Robotik Jarroh & Shifokor', icon: '🩺', roomTitle: 'Robotik Jarrohlik Markazi', keyTools: 'da Vinci Xi, 3-Tesla MRT, Ultratovush skalpel' },
    { id: 'genetic_engineer', title: 'Genetik Muhandis & Biotexnolog', icon: '🧬', roomTitle: 'Genetika & DNK Laboratoriyasi', keyTools: 'CRISPR-Cas9, Illumina sekvenator, RT-PCR' },
    { id: 'ai_engineer', title: "Sun'iy Intellekt & Dasturchi", icon: '💻', roomTitle: 'Kiber & AI Texnoparki', keyTools: 'NVIDIA H100 klasteri, 128GB ish stansiyasi' },
    { id: 'cyber_security', title: 'Kiberxavfsizlik Mutaxassisi (Hacker)', icon: '🛡️', roomTitle: 'Kiberxavfsizlik Markazi', keyTools: 'Flipper Zero, Wireshark, YubiKey' },
    { id: 'aerospace_engineer', title: 'Aviakosmik & Astrobiolog', icon: '🚀', roomTitle: 'Aviakosmik Angar & Observatoriya', keyTools: '3D metall printer, Fazoviy teleskop' },
    { id: 'smart_agronomist', title: 'Smart-Agronom & Agro-Dron Uchuvchisi', icon: '🌾', roomTitle: 'Aqlli Agrobiologik Issiqxona', keyTools: 'DJI Agras droni, Multispektral kamera' },
    { id: 'neuroscientist', title: 'Neyromuhandis & Radiolog', icon: '🧠', roomTitle: 'Neyro-interfeys Laboratoriyasi', keyTools: 'BCI neyro-interfeys, 3-Tesla MRT, EEG' },
    { id: 'green_ecologist', title: 'Yashil Energetika & Ekolog', icon: '🌱', roomTitle: 'Biosfera & Tabiiy Issiqxona', keyTools: 'FLIR termovizor droni, Gaz-xromatograf' },
    { id: 'rescue_hero', title: 'Favqulodda Qutqaruvchi (FVV & EMT)', icon: '🚒', roomTitle: 'Favqulodda Qutqaruv Maskani', keyTools: '50t gidravlik keskich, Seysmik mikrofon' },
  ];
  const effectiveCareers = careersList.length > 0 ? careersList : defaultCareers;
  const selectedJobObj = effectiveCareers.find((c) => c.id === dreamJob) || effectiveCareers[0];

  // Randomize button
  const handleRandomize = () => {
    if (allRaces.length > 0) {
      const randomR = allRaces[Math.floor(Math.random() * allRaces.length)];
      setSelectedRace(randomR.id);
      setActiveCategory(randomR.categoryId || 'all');
    }
    setHeight(Math.floor(Math.random() * (195 - 150 + 1)) + 150);
    setWeight(Math.floor(Math.random() * (95 - 50 + 1)) + 50);
    setSkinTone(skinTones[Math.floor(Math.random() * skinTones.length)].color);
    setHairColor(hairColors[Math.floor(Math.random() * hairColors.length)].color);
    setHairStyle(hairStyles[Math.floor(Math.random() * hairStyles.length)].id);
    const randomJob = effectiveCareers[Math.floor(Math.random() * effectiveCareers.length)];
    setDreamJob(randomJob.id);
    toast.success('Tasodifiy qahramon parametrlari tanlandi! 🎲');
  };

  const handleSubmit = async () => {
    if (!heroName.trim()) {
      return toast.error('Iltimos, qahramoningizga ism bering!');
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/student/hero/setup', {
        race: selectedRace,
        name: heroName.trim(),
        dreamJob,
        interests: [dreamJob, 'biologiya', 'zamonaviy_kasblar'],
        customAppearance: {
          height,
          weight,
          skinTone,
          hairStyle,
          hairColor,
        },
      });

      toast.success("Qahramoningiz muvaffaqiyatli jonlantirildi! +50 XP berildi 🎉");
      if (onHeroCreated) onHeroCreated(res.data?.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Qahramon yaratishda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#060a12]/90 backdrop-blur-xl animate-fade-in overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-6xl h-[94vh] bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ── Top Header ────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--secondary-background)]/60 z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl gradient-bg flex items-center justify-center text-white shadow-soft">
              <Wand2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                  Qahramon Ustaxonasi
                </h2>
                <span className="badge text-[10px] py-0.5 px-2 bg-primary/20 text-primary font-bold">
                  2D Avatar Studio
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                O'z 2D qahramoningni noldan loyihalashtir, bo'y-bastini o'lcha va kelajakdagi orzuingni biriktir!
              </p>
            </div>
          </div>

          {/* Stepper Tabs */}
          <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
            <button
              onClick={() => setStep(1)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                step === 1 ? 'bg-primary text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>1</span> <span>Irq & Zot</span>
            </button>
            <button
              onClick={() => setStep(2)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                step === 2 ? 'bg-primary text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>2</span> <span>Bo'y & Gavda</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                step === 3 ? 'bg-primary text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>3</span> <span>Kasb & Ism</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRandomize}
              className="btn-ghost p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-primary"
              title="Tasodifiy qahramon yaratish"
            >
              <Dices size={16} />
              <span className="hidden md:inline">Tasodifiy</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--secondary-background)] transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Main Workspace (Split View) ─────────────────────────── */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* ◄ LEFT PANE: The 2D Holographic Character Stage ► */}
          <div className="w-full lg:w-[45%] h-[320px] lg:h-full bg-gradient-to-b from-[#0f172a]/70 via-[#090d16] to-[#030712] border-b lg:border-b-0 lg:border-r border-[var(--border)] relative flex flex-col items-center justify-between p-4 overflow-hidden flex-shrink-0">
            {/* Top Live Attribute Badges */}
            <div className="w-full flex items-center justify-between gap-2 z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge text-[11px] py-1 px-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold flex items-center gap-1">
                  <Ruler size={12} /> {height} sm ({getHeightLabel(height)})
                </span>
                <span className="badge text-[11px] py-1 px-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                  <Weight size={12} /> {weight} kg ({getBuildLabel(weight)})
                </span>
              </div>
              <span className="badge text-[11px] py-1 px-2.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold">
                {selectedRaceObj.primaryName || selectedRaceObj.name}
              </span>
            </div>

            {/* Height Ruler on Left Border */}
            <div className="absolute left-3 top-16 bottom-16 w-10 flex flex-col justify-between items-center text-[10px] text-slate-500 select-none pointer-events-none hidden sm:flex">
              <span className="font-mono text-cyan-400 font-bold">200cm</span>
              <div className="w-full border-t border-slate-700/60" />
              <span>180cm</span>
              <div className="w-full border-t border-slate-700/60" />
              <span className="font-bold text-emerald-400 font-mono">170cm</span>
              <div className="w-full border-t border-slate-700/60" />
              <span>160cm</span>
              <div className="w-full border-t border-slate-700/60" />
              <span>140cm</span>
            </div>

            {/* 2D Vector Character Component */}
            <div className="flex-1 flex items-center justify-center relative w-full">
              <HeroAvatar2D
                height={height}
                weight={weight}
                skinTone={skinTone}
                hairStyle={hairStyle}
                hairColor={hairColor}
                raceCategory={selectedRaceObj.categoryId}
                raceId={selectedRaceObj.id}
                dreamJob={dreamJob}
                size={340}
              />
            </div>

            {/* Stage Bottom Summary */}
            <div className="w-full z-10 text-center py-2 px-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <span>{selectedJobObj.icon}</span>
                <span>{selectedJobObj.title}</span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="text-cyan-400">{selectedJobObj.roomTitle}</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                {selectedRaceObj.passiveBonus}
              </p>
            </div>
          </div>

          {/* ► RIGHT PANE: Customizer Controls (Tabs) ◄ */}
          <div className="flex-1 flex flex-col min-h-0 bg-[var(--card)] p-4 sm:p-6 overflow-hidden">
            {/* STEP 1: Race & Category Selector */}
            {step === 1 && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      1-Qadam: Irq va Zotni Tanlash (Insoniyat & Hayolot)
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Real zamonaviy inson mutaxassisi yoki 110 ta hayolot irqidan birini tanlang.
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-primary">1 / 3</span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Qidirish: Inson, Jarroh, Elf, Bo'ri, Ajdaho, Kiber, Titan..."
                    className="input-field text-xs pl-9 pr-3 py-2.5 w-full rounded-2xl bg-[var(--secondary-background)]"
                  />
                </div>

                {/* Categories Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    className={`text-[11px] px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                      activeCategory === 'all'
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-[var(--secondary-background)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                    }`}
                  >
                    Barchasi ({allRaces.length || 120})
                  </button>
                  {categories.map((c) => {
                    const isHumanCat = c.id === 'human_civilization';
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setActiveCategory(c.id)}
                        className={`text-[11px] px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                          activeCategory === c.id
                            ? isHumanCat
                              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                              : 'bg-primary text-white shadow-xs ring-2 ring-primary/30'
                            : isHumanCat
                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30 hover:bg-blue-500/20'
                            : 'bg-[var(--secondary-background)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                        }`}
                      >
                        <span>{c.icon}</span>
                        <span>{c.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Races List Grid */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[360px]">
                  {displayRaces.map((r) => {
                    const isSelected = selectedRace === r.id;
                    const isHuman = r.categoryId === 'human_civilization';
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRace(r.id)}
                        className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3.5 relative ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20'
                            : isHuman
                            ? 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50'
                            : 'border-[var(--border)] bg-[var(--secondary-background)] hover:border-primary/40'
                        }`}
                      >
                        <span className="text-3xl p-2 rounded-2xl bg-[var(--card)] shadow-xs flex-shrink-0 flex items-center justify-center border border-[var(--border)]">
                          {r.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-sm text-[var(--text-primary)] truncate">
                              {r.number ? `#${r.number} ` : ''}{r.name}
                            </span>
                            <span className={`badge text-[10px] py-0.5 px-2 font-bold flex-shrink-0 ${
                              isHuman ? 'bg-blue-500/20 text-blue-500' : 'bg-primary/20 text-primary'
                            }`}>
                              {r.category?.split(' ')[0] || r.badge}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-1.5 line-clamp-2">
                            {r.description || r.abilities}
                          </p>
                          {r.passiveBonus && (
                            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Sparkles size={12} className="flex-shrink-0" />
                              <span className="truncate">{r.passiveBonus}</span>
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <span className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                            <Check size={12} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Footer Navigation */}
                <div className="pt-2 border-t border-[var(--border)] flex justify-end flex-shrink-0">
                  <button
                    onClick={() => setStep(2)}
                    className="btn-primary py-3 px-6 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md"
                  >
                    Bo'y & Gavdani Sozlash <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Body Proportions (Semizlik, Og'irlik, Bo'y-basti) & Appearance */}
            {step === 2 && (
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                <div className="flex items-center justify-between flex-shrink-0">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      2-Qadam: Bo'y-Basti, Semizlik va Tashqi Ko'rinish
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Slayderlar orqali qahramoning bo'y-basti, semizlik/og'irlik darajasi va ranglarini o'zingga moslashtir.
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-primary">2 / 3</span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[380px]">
                  {/* Height Slider */}
                  <div className="p-4 rounded-2xl bg-[var(--secondary-background)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                      <span className="flex items-center gap-1.5">
                        <Ruler size={16} className="text-cyan-500" /> Bo'y-basti (Height)
                      </span>
                      <span className="text-cyan-500 font-mono text-sm">{height} sm ({getHeightLabel(height)})</span>
                    </div>
                    <input
                      type="range"
                      min="140"
                      max="200"
                      step="1"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
                      <span>140 sm (Ixcham)</span>
                      <span>170 sm (Standart)</span>
                      <span>200 sm (Baland bo'yli)</span>
                    </div>
                  </div>

                  {/* Weight / Bulk Slider */}
                  <div className="p-4 rounded-2xl bg-[var(--secondary-background)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                      <span className="flex items-center gap-1.5">
                        <Weight size={16} className="text-emerald-500" /> Semizlik & Gavda og'irligi (Body Build)
                      </span>
                      <span className="text-emerald-500 font-mono text-sm">{weight} kg ({getBuildLabel(weight)})</span>
                    </div>
                    <input
                      type="range"
                      min="45"
                      max="115"
                      step="1"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
                      <span>45 kg (Ozg'in)</span>
                      <span>70 kg (Atletik)</span>
                      <span>115 kg (Baquvvat / Semiz)</span>
                    </div>
                  </div>

                  {/* Skin Tone Selector */}
                  <div className="p-4 rounded-2xl bg-[var(--secondary-background)] border border-[var(--border)] space-y-2">
                    <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Palette size={16} className="text-amber-500" /> Teri / Gavda Tusi
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {skinTones.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setSkinTone(st.color)}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                            skinTone === st.color
                              ? 'border-primary ring-2 ring-primary/40 bg-[var(--card)]'
                              : 'border-[var(--border)] hover:border-slate-500'
                          }`}
                        >
                          <span className="w-6 h-6 rounded-full shadow-inner border border-black/20" style={{ backgroundColor: st.color }} />
                          <span className="text-[10px] text-[var(--text-secondary)] font-medium truncate w-full text-center">
                            {st.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hair Style & Color */}
                  <div className="p-4 rounded-2xl bg-[var(--secondary-background)] border border-[var(--border)] space-y-3">
                    <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Scissors size={16} className="text-purple-500" /> Soch Turmagi va Rangi
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {hairStyles.map((hs) => (
                        <button
                          key={hs.id}
                          type="button"
                          onClick={() => setHairStyle(hs.id)}
                          className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                            hairStyle === hs.id
                              ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30'
                              : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--card)]'
                          }`}
                        >
                          {hs.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
                      {hairColors.map((hc) => (
                        <button
                          key={hc.id}
                          type="button"
                          onClick={() => setHairColor(hc.color)}
                          className={`w-7 h-7 rounded-full border-2 transition-all flex-shrink-0 ${
                            hairColor === hc.color ? 'border-primary ring-2 ring-primary/40 scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: hc.color }}
                          title={hc.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Navigation */}
                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between flex-shrink-0">
                  <button
                    onClick={() => setStep(1)}
                    className="btn-ghost py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-[var(--text-muted)]"
                  >
                    <ArrowLeft size={16} /> Irqni O'zgartirish
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="btn-primary py-3 px-6 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md"
                  >
                    Kasb & Ism Tanlash <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Modern Career & Hero Name */}
            {step === 3 && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3.5">
                <div className="flex items-center justify-between flex-shrink-0">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      3-Qadam: Orzudagi Kasb va Qahramon Ismi
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Kelajakdagi orzuingdagi ilg'or kasbni tanlang — shunga mos 2D kastyum va shaxsiy xona beriladi.
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-primary">3 / 3</span>
                </div>

                {/* Hero Name Input */}
                <div className="flex-shrink-0">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Qahramoningga qanday ism qo'yasan?
                  </label>
                  <input
                    type="text"
                    value={heroName}
                    onChange={(e) => setHeroName(e.target.value)}
                    placeholder="Masalan: Dr. Temur, Malika, Kiber-Sher, Alfiya..."
                    className="input-field text-sm font-bold w-full rounded-2xl bg-[var(--secondary-background)] py-2.5"
                    maxLength={30}
                    autoFocus
                  />
                </div>

                {/* Career Selector Grid */}
                <div className="flex-1 min-h-0 flex flex-col">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex-shrink-0">
                    Zamonaviy Texnologik Kasblar (9 ta Ilg'or Yo'nalish):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1 max-h-[220px]">
                    {effectiveCareers.map((job) => {
                      const isSelected = dreamJob === job.id;
                      const toolsText = job.equipment
                        ? (Array.isArray(job.equipment) ? job.equipment.map(e => typeof e === 'string' ? e : e.name).slice(0, 2).join(', ') : '')
                        : (job.keyTools || '');

                      return (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => setDreamJob(job.id)}
                          className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 relative ${
                            isSelected
                              ? 'border-primary bg-primary/10 font-semibold ring-2 ring-primary/20 shadow-xs'
                              : 'border-[var(--border)] bg-[var(--secondary-background)] hover:border-primary/40'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-2xl p-1.5 rounded-xl bg-[var(--card)] shadow-xs flex-shrink-0 border border-[var(--border)]">
                              {job.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs text-[var(--text-primary)] font-bold block truncate">
                                {job.title}
                              </span>
                              <span className="text-[10px] text-primary font-semibold block truncate">
                                {job.roomTitle || job.category}
                              </span>
                            </div>
                          </div>
                          {toolsText && (
                            <span className="text-[10px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                              🔧 {toolsText}
                            </span>
                          )}
                          {isSelected && (
                            <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                              <Check size={10} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Welcome Bonus Notice */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2.5 flex-shrink-0">
                  <Award size={18} className="flex-shrink-0" />
                  <span>
                    Qahramoningni jonlantirish bilan senga <b>+50 XP</b> beriladi va <b>{selectedJobObj.roomTitle}</b> shaxsiy xonang ochiladi!
                  </span>
                </div>

                {/* Footer Navigation */}
                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn-ghost py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-[var(--text-muted)]"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft size={16} /> Bo'y & Gavda
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !heroName.trim()}
                    className="btn-primary py-3 px-8 rounded-2xl font-extrabold text-sm shadow-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Qahramon jonlantirilmoqda...</span>
                    ) : (
                      <>
                        <Wand2 size={16} /> Qahramonni Jonlantirish! ✨
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
