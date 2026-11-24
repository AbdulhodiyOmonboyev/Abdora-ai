import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Flame, Zap, Star, Lock, Crown, Play, Check, CheckCircle2,
  Sparkles, ArrowRight, BookOpen
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getSubjectIcon, getSubjectLabel } from '../../utils/subjects';

// Web Audio API tactile 3D button pop sound
function playPopTone(pitch = 520) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // AudioContext might be blocked until user gesture
  }
}

// 8-step winding snake horizontal offsets in px (creates serpentine wave)
const SNAKE_OFFSETS = [0, 56, 88, 56, 0, -56, -88, -56];

export default function DuolingoPathView({
  lessons = [],
  onSelectLesson,
  completedLessonIds = [],
  groupStageInfo = null,
  lessonMastery = {},
}) {
  const { user } = useAuthStore();
  const [lockedTooltipIdx, setLockedTooltipIdx] = useState(null);

  // Set of completed lesson IDs
  const completedSet = useMemo(() => {
    return new Set(Array.isArray(completedLessonIds) ? completedLessonIds : []);
  }, [completedLessonIds]);

  // Determine planned total lessons from groupStageInfo, user's group, or default 12
  const plannedCurriculumCount = useMemo(() => {
    const raw = groupStageInfo?.totalLessons || user?.group?.totalLessons || 12;
    const num = Number(raw);
    return isNaN(num) || num < 1 ? 12 : num;
  }, [groupStageInfo, user]);

  const targetTotalCount = Math.max(lessons.length, plannedCurriculumCount);

  // Generate full course learning path nodes (actual lessons + upcoming planned stage lessons)
  const displayLessons = useMemo(() => {
    const list = [...lessons];
    const defaultSubject = lessons[0]?.subject || groupStageInfo?.subject || 'biologiya';

    while (list.length < targetTotalCount) {
      const nextIndex = list.length;
      const lessonNum = nextIndex + 1;
      list.push({
        id: `planned-placeholder-${lessonNum}`,
        isPlaceholder: true,
        order: nextIndex,
        title: `${lessonNum}-Dars • Rejalashtirilgan Mavzu`,
        subject: defaultSubject,
        content: "Ushbu dars o'quv dasturi asosida tez kunda taqdim etiladi.",
        status: 'locked',
      });
    }
    return list;
  }, [lessons, targetTotalCount, groupStageInfo]);

  // Determine active lesson index (first uncompleted real lesson)
  const activeIndex = useMemo(() => {
    if (!lessons.length) return 0;
    const idx = lessons.findIndex((l) => !completedSet.has(l.id));
    return idx === -1 ? lessons.length : idx;
  }, [lessons, completedSet]);

  // Overall statistics
  const totalLessons = displayLessons.length;
  const completedCount = useMemo(() => {
    return lessons.filter((l) => completedSet.has(l.id)).length;
  }, [lessons, completedSet]);

  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const currentStreak = user?.streakCurrent ?? user?.streak?.current ?? 0;
  const userXp = user?.xp ?? 0;
  const userCoins = user?.coins ?? 0;
  const groupStage = groupStageInfo?.level || user?.group?.level || "Boshlang'ich";

  // Calculate SVG pathway dimensions
  const NODE_VERTICAL_STEP = 140;
  const SVG_HEIGHT = Math.max(400, (displayLessons.length + 1) * NODE_VERTICAL_STEP);
  const SVG_WIDTH = 420;
  const CENTER_X = SVG_WIDTH / 2;

  // Compute (x, y) coordinates for each lesson circle
  const nodeCoords = useMemo(() => {
    return displayLessons.map((_, i) => {
      const xOffset = SNAKE_OFFSETS[i % SNAKE_OFFSETS.length];
      const x = CENTER_X + xOffset;
      const y = 70 + i * NODE_VERTICAL_STEP;
      return { x, y, xOffset };
    });
  }, [displayLessons, CENTER_X, NODE_VERTICAL_STEP]);

  // Build SVG smooth cubic bezier path string through all lessons to the trophy
  const svgPathData = useMemo(() => {
    if (nodeCoords.length === 0) return '';
    let d = `M ${nodeCoords[0].x} ${nodeCoords[0].y}`;
    for (let i = 0; i < nodeCoords.length - 1; i++) {
      const p1 = nodeCoords[i];
      const p2 = nodeCoords[i + 1];
      const midY = (p1.y + p2.y) / 2;
      d += ` C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`;
    }
    // Connect the last node down to the Finish Trophy
    const last = nodeCoords[nodeCoords.length - 1];
    const trophyY = last.y + 110;
    const midY = (last.y + trophyY) / 2;
    d += ` C ${last.x} ${midY}, ${CENTER_X} ${midY}, ${CENTER_X} ${trophyY}`;
    return d;
  }, [nodeCoords, CENTER_X]);

  // Build completed path data up to active index
  const completedSvgPathData = useMemo(() => {
    const limit = Math.min(activeIndex, nodeCoords.length - 1);
    if (limit <= 0 || nodeCoords.length <= 1) return '';
    let d = `M ${nodeCoords[0].x} ${nodeCoords[0].y}`;
    for (let i = 0; i < limit; i++) {
      const p1 = nodeCoords[i];
      const p2 = nodeCoords[i + 1];
      const midY = (p1.y + p2.y) / 2;
      d += ` C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`;
    }
    if (completedCount === totalLessons && nodeCoords.length > 0) {
      const last = nodeCoords[nodeCoords.length - 1];
      const trophyY = last.y + 110;
      const midY = (last.y + trophyY) / 2;
      d += ` C ${last.x} ${midY}, ${CENTER_X} ${midY}, ${CENTER_X} ${trophyY}`;
    }
    return d;
  }, [nodeCoords, activeIndex, completedCount, totalLessons, CENTER_X]);

  // Handle lesson circle click
  const handleNodeClick = (lesson, status, index) => {
    playPopTone(status === 'completed' ? 680 : status === 'active' ? 580 : 320);

    if (lesson.isPlaceholder) {
      setLockedTooltipIdx(index);
      setTimeout(() => setLockedTooltipIdx(null), 2500);
      return;
    }

    if (status === 'locked') {
      setLockedTooltipIdx(index);
      setTimeout(() => setLockedTooltipIdx(null), 2500);
      return;
    }

    if (onSelectLesson) {
      onSelectLesson(lesson);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-6 pb-20 select-none">
      {/* ── 1. Guruh Bosqichi va Duolingo Banneri (Header Widget) ── */}
      <div
        className="w-full rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
        }}
      >
        {/* Orqa fon bezak doiralari */}
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -left-6 -bottom-6 w-32 h-32 rounded-full bg-emerald-400/20 blur-lg pointer-events-none" />

        <div className="relative z-10 space-y-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-white/20 backdrop-blur-md text-emerald-50 mb-1.5">
                <Crown size={13} className="text-amber-300" />
                <span>Bosqich: {groupStage}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                O'quv Yo'li (Winding Path)
              </h2>
              <p className="text-xs sm:text-sm text-emerald-50/90 font-medium">
                Darslarni ketma-ketlikda o'zlashtiring va yangi bilimlarni oching
              </p>
            </div>

            {/* Gamifikatsiya ko'rsatkichlari (XP, Streak, Tangalar) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-black/20 backdrop-blur-md text-xs font-bold border border-white/15" title="XP Ballar">
                <Zap size={14} className="text-amber-300 fill-amber-300" />
                <span>{userXp} XP</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-black/20 backdrop-blur-md text-xs font-bold border border-white/15" title="Seriya kunlari">
                <Flame size={14} className="text-orange-300 fill-orange-300" />
                <span>{currentStreak} kun</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-black/20 backdrop-blur-md text-xs font-bold border border-white/15" title="Tangalar">
                <Star size={14} className="text-yellow-300 fill-yellow-300" />
                <span>{userCoins}</span>
              </div>
            </div>
          </div>

          {/* Darslar o'tish progressi */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <BookOpen size={14} />
                Darslar: {completedCount}/{totalLessons} o'tildi
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-black/25 rounded-full p-0.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-400 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Serpantin / To'lqinsimon O'quv Yo'li (Winding Snake Learning Path) ── */}
      <div className="relative w-full flex flex-col items-center min-h-[500px] pt-4">
        {/* SVG Fon bog'lovchi yo'l chiziqlari */}
        <div className="absolute inset-0 pointer-events-none flex justify-center overflow-hidden">
          <svg
            className="w-full max-w-[420px] h-full"
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            fill="none"
            preserveAspectRatio="xMidYMin meet"
          >
            <defs>
              {/* O'tilgan yo'l uchun yashil gradient */}
              <linearGradient id="duoPathCompleted" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>

            {/* Asosiy kulrang tosh yo'li (Base road) */}
            {svgPathData && (
              <>
                <path
                  d={svgPathData}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Toshlar/chiziqlar (Stepping stones) */}
                <path
                  d={svgPathData}
                  stroke="currentColor"
                  className="text-slate-300 dark:text-slate-700"
                  strokeWidth="4"
                  strokeDasharray="6 14"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* O'tilgan aktiv yo'l (Completed road glow) */}
            {completedSvgPathData && (
              <path
                d={completedSvgPathData}
                stroke="url(#duoPathCompleted)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>

        {/* ── Dars Dumaloq Tugmalari (Circular 3D Pushable Buttons) ── */}
        <div className="relative z-10 w-full flex flex-col items-center">
          {displayLessons.map((lesson, idx) => {
            const isPlaceholder = !!lesson.isPlaceholder;
            const isCompleted = !isPlaceholder && completedSet.has(lesson.id);
            const isActive = !isPlaceholder && !isCompleted && idx === activeIndex;
            const status = isCompleted ? 'completed' : isActive ? 'active' : 'locked';

            const lessonOrder = lesson.order !== undefined && lesson.order !== null ? lesson.order + 1 : idx + 1;
            const coords = nodeCoords[idx] || { xOffset: 0 };
            const isAiReady = !isPlaceholder && lesson.aiContent?.status === 'done';

            const masteryInfo = !isPlaceholder ? (lessonMastery[lesson.id] || lesson.masteryInfo || lesson.aiContent?.mastery) : null;
            const masteryPercent = masteryInfo?.mastery !== undefined
              ? masteryInfo.mastery
              : (isCompleted ? 100 : null);
            const starsCount = masteryInfo?.stars !== undefined
              ? masteryInfo.stars
              : (masteryPercent !== null ? (masteryPercent >= 90 ? 3 : masteryPercent >= 60 ? 2 : masteryPercent > 0 ? 1 : 0) : 0);

            return (
              <div
                key={lesson.id}
                className="flex flex-col items-center justify-center w-full"
                style={{ height: `${NODE_VERTICAL_STEP}px` }}
              >
                {/* Serpantin xOffset siljishi */}
                <div
                  className="relative flex flex-col items-center"
                  style={{
                    transform: `translateX(${coords.xOffset}px)`,
                    transition: 'transform 0.3s ease',
                  }}
                >
                  {/* ── AKTIV DARS USTIDAGI TALABA AVATARI & SPEECH BUBBLE ── */}
                  {isActive && (
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
                      <div
                        className="px-3 py-1.5 rounded-2xl flex items-center gap-2 shadow-lg backdrop-blur-md relative"
                        style={{
                          background: 'var(--card)',
                          border: '2px solid #10b981',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {/* Talabaning avatari yoki tulkicha/mascot */}
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-400">
                          {user?.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-black text-emerald-600">
                              {user?.name ? user.name.slice(0, 1).toUpperCase() : '🦊'}
                            </span>
                          )}
                        </div>

                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          Boshlaymizmi? 🚀
                        </span>

                        {/* Pastga yo'naltirilgan uchburchak / Speech triangle */}
                        <div
                          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                          style={{
                            background: 'var(--card)',
                            borderRight: '2px solid #10b981',
                            borderBottom: '2px solid #10b981',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ── Qulflangan holatda xabar (Tooltip) ── */}
                  <AnimatePresence>
                    {lockedTooltipIdx === idx && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.9 }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-xl text-xs font-bold bg-slate-900 text-white shadow-xl whitespace-nowrap pointer-events-none border border-slate-700"
                      >
                        {isPlaceholder
                          ? "Ushbu dars o'quv dasturi bo'yicha tez kunda ochiladi 🔒"
                          : "Oldingi darsni yakunlang 🔒"}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── 3D PUSHABLE CIRCULAR BUTTON (Duolingo Style) ── */}
                  <div className="relative">
                    <motion.button
                      type="button"
                      onClick={() => handleNodeClick(lesson, status, idx)}
                      aria-label={`${lessonOrder}-dars: ${lesson.title}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={isActive ? { scale: [1, 1.03, 1] } : undefined}
                      transition={isActive ? { repeat: Infinity, duration: 2.2, ease: 'easeInOut' } : undefined}
                      className={`
                        w-20 h-20 sm:w-[86px] sm:h-[86px] rounded-full flex flex-col items-center justify-center relative cursor-pointer
                        transition-all duration-150 ease-out select-none outline-none
                        ${
                          isCompleted
                            ? 'bg-[#58cc02] text-white hover:bg-[#4eb302] border-b-[7px] border-[#3f8f02] active:border-b-[2px] active:translate-y-[5px] shadow-lg shadow-emerald-500/25'
                            : isActive
                            ? 'bg-[#10b981] text-white hover:bg-[#059669] border-b-[7px] border-[#047857] active:border-b-[2px] active:translate-y-[5px] ring-4 ring-emerald-400/60 ring-offset-4 ring-offset-[var(--card)] shadow-xl shadow-emerald-500/40'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-b-[7px] border-slate-300 dark:border-slate-900 hover:bg-slate-300/80 dark:hover:bg-slate-750 active:border-b-[7px]'
                        }
                      `}
                    >
                      {/* Dars ikonkasi va mazmuni */}
                      {isCompleted ? (
                        <div className="flex flex-col items-center justify-center">
                          <Crown size={28} className="text-yellow-300 fill-yellow-300 drop-shadow-sm" />
                          <span className="text-[11px] font-black tracking-wider text-emerald-100 mt-0.5">
                            {lessonOrder}
                          </span>
                        </div>
                      ) : isActive ? (
                        <div className="flex flex-col items-center justify-center">
                          <Play size={30} className="text-white fill-white ml-1 drop-shadow-md" />
                          <span className="text-[11px] font-black tracking-wider text-emerald-100 mt-0.5">
                            {lessonOrder}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <Lock size={26} className="text-slate-400 dark:text-slate-500" />
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                            {lessonOrder}
                          </span>
                        </div>
                      )}

                      {/* Tugallangan belgisi (Oltin yulduzcha mini badge) */}
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 border-2 border-white text-amber-950 flex items-center justify-center shadow-md">
                          <Check size={14} strokeWidth={3.5} />
                        </div>
                      )}
                    </motion.button>
                  </div>

                  {/* ⭐ Talaba yulduzchalari (Stars display under button) */}
                  <div className="flex items-center justify-center gap-1 mt-1.5 h-4">
                    {[1, 2, 3].map((starNum) => {
                      const isFilled = starNum <= starsCount;
                      return (
                        <Star
                          key={starNum}
                          size={13}
                          className={
                            isFilled
                              ? "text-amber-400 fill-amber-400 drop-shadow-[0_1px_2px_rgba(245,158,11,0.5)]"
                              : isCompleted || isActive
                              ? "text-slate-300 dark:text-slate-700"
                              : "text-slate-200 dark:text-slate-800"
                          }
                        />
                      );
                    })}
                  </div>

                  {/* ── Dars nomi va ma'lumot qutisi (Lesson Badge / Pill) ── */}
                  <div
                    onClick={() => handleNodeClick(lesson, status, idx)}
                    className={`
                      mt-1.5 px-3 py-1.5 rounded-xl text-center max-w-[210px] cursor-pointer transition-all
                      border backdrop-blur-xs
                      ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-sm'
                          : 'bg-[var(--card)] border-[var(--border)] hover:border-emerald-400'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {lessonOrder}-DARS
                      </span>
                      {lesson.subject && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
                          • {getSubjectIcon(lesson.subject, { size: 10 })} {getSubjectLabel(lesson.subject)}
                        </span>
                      )}
                      {isAiReady && (
                        <Sparkles size={11} className="text-emerald-500" title="Multimodal AI Tayyor" />
                      )}
                    </div>

                    <h4
                      className={`font-bold text-xs truncate leading-tight ${isPlaceholder ? 'opacity-75' : ''}`}
                      style={{ color: 'var(--text-primary)' }}
                      title={lesson.title}
                    >
                      {lesson.title}
                    </h4>

                    {/* Holat va Mastery foizi */}
                    <div className="mt-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold">
                      {isPlaceholder ? (
                        <span className="text-slate-400 dark:text-slate-500 flex items-center gap-0.5 text-[10px]">
                          <Lock size={10} /> Rejalashtirilgan
                        </span>
                      ) : masteryPercent !== null ? (
                        <div className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
                          <Sparkles size={10} className="text-amber-500 fill-amber-500" />
                          <span>{masteryPercent}% O'zlashtirildi</span>
                        </div>
                      ) : isCompleted ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 size={12} /> 100% O'zlashtirildi
                        </span>
                      ) : isActive ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 group-hover:underline">
                          Boshlash <ArrowRight size={11} />
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-0.5">
                          <Lock size={10} /> Qulflangan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Yo'l yakunidagi G'alaba shoxi / Finish Trophy ── */}
        {displayLessons.length > 0 && (
          <div className="mt-10 flex flex-col items-center text-center space-y-2 relative z-10 pb-8">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 flex items-center justify-center shadow-lg border-b-[6px] border-amber-600">
              <Trophy size={32} />
            </div>
            <div>
              <h4 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                {groupStage} Bosqichi Marrasi
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">
                Barcha {totalLessons} ta darsni tugatib, keyingi bosqich sertifikatiga ega bo'ling!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
