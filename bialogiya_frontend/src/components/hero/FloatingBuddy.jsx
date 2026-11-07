import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageCircle, Heart, X, Stethoscope, Microscope, TreePine } from 'lucide-react';
import HeroAvatar2D from './HeroAvatar2D';

export default function FloatingBuddy({ hero, onOpenRoom, onOpenChat }) {
  const [isOpen, setIsOpen] = useState(false);
  const [bubbleText, setBubbleText] = useState('');

  const heroName = hero?.name || "Sehrgar Do'st";
  const dreamJob = hero?.dreamJob || 'robotic_surgeon';
  const custom = hero?.customAppearance || {};

  const friendlyPhrases = [
    `Salom, do'stim! Bugun qaysi mavzuni birgalikda o'rganamiz?`,
    `Sen bilan biologiya va zamonaviy fanni o'rganish juda qiziqarli!`,
    `Do'stim, tushunmagan mavzung bo'lsa, uni menga tushuntirib ber, birga mustahkamlaymiz! 🌟`,
    `Harakat qilsang, kelajakda eng kuchli mutaxassis bo'lasan!`,
    `Darslarni a'lo topshirsang, bizning laboratoriyamizga yangi jihozlar qo'shiladi! 🚀`,
  ];

  useEffect(() => {
    const randomPhrase = friendlyPhrases[Math.floor(Math.random() * friendlyPhrases.length)];
    setBubbleText(randomPhrase);
  }, [hero]);

  if (!hero || !hero.isSetupCompleted) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end pointer-events-auto">
      {/* Speech bubble */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-3 mr-1 p-3.5 bg-[var(--card)] border border-primary/30 rounded-3xl shadow-2xl max-w-xs text-xs text-[var(--text-primary)] relative overflow-hidden"
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2.5 right-2.5 text-[var(--text-muted)] hover:text-red-500 p-1 rounded-lg"
            >
              <X size={13} />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-primary/40 overflow-hidden flex items-center justify-center shadow-xs flex-shrink-0">
                <HeroAvatar2D
                  height={custom.height || 170}
                  weight={custom.weight || 65}
                  skinTone={custom.skinTone || '#ffd1b3'}
                  hairStyle={custom.hairStyle || 'short'}
                  hairColor={custom.hairColor || '#1e293b'}
                  raceCategory={hero.category}
                  raceId={hero.race}
                  dreamJob={hero.dreamJob}
                  size={55}
                  showPedestal={false}
                />
              </div>
              <div>
                <div className="font-extrabold text-xs text-primary leading-tight">
                  {heroName}
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  {hero.raceName || 'Inson Hamroh'}
                </div>
              </div>
            </div>

            <p className="leading-relaxed text-[11px] text-[var(--text-secondary)] mb-2.5 bg-[var(--secondary-background)] p-2.5 rounded-xl border border-[var(--border)]">
              "{bubbleText}"
            </p>

            <div className="flex items-center gap-1.5 pt-1">
              {onOpenRoom && (
                <button
                  onClick={() => { setIsOpen(false); onOpenRoom(); }}
                  className="btn-primary text-[10px] py-1.5 px-3 rounded-xl flex items-center gap-1 font-bold"
                >
                  <Sparkles size={11} /> Xonamni ko'rish
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Buddy Trigger Pill */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 bg-[var(--card)] hover:bg-[var(--secondary-background)] border-2 border-primary/40 rounded-full shadow-2xl transition-all group relative"
      >
        <div className="w-8 h-8 rounded-full bg-slate-900 border border-primary/50 overflow-hidden flex items-center justify-center flex-shrink-0 relative shadow-inner">
          <HeroAvatar2D
            height={custom.height || 170}
            weight={custom.weight || 65}
            skinTone={custom.skinTone || '#ffd1b3'}
            hairStyle={custom.hairStyle || 'short'}
            hairColor={custom.hairColor || '#1e293b'}
            raceCategory={hero.category}
            raceId={hero.race}
            dreamJob={hero.dreamJob}
            size={48}
            showPedestal={false}
          />
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-black animate-pulse" />
        </div>

        <div className="text-left hidden sm:block pr-1">
          <div className="text-[11px] font-bold text-[var(--text-primary)] leading-tight group-hover:text-primary transition-colors">
            {heroName}
          </div>
          <div className="text-[9px] text-[var(--text-muted)] leading-tight">
            Level {hero.stats?.teachingSkill || 1} Hamroh
          </div>
        </div>
      </motion.button>
    </div>
  );
}
