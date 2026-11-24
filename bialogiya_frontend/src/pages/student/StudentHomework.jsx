import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ClipboardList, CheckCircle, AlertCircle, Clock, Sparkles, Heart,
  Headphones, BookOpen, Mic, PenTool, CheckCircle2, Bot, Award, ChevronRight
} from 'lucide-react';
import api from '../../config/axios';
import { formatDate } from '../../utils/format';
import StudentAcademicTabs from '../../components/student/StudentAcademicTabs';

export const getHomeworkCategory = (hw) => {
  if (hw?.category) {
    const c = String(hw.category).toLowerCase();
    if (['listening', 'reading', 'speaking', 'writing'].includes(c)) return c;
  }
  const text = `${hw?.title || ''} ${hw?.description || ''}`.toLowerCase();
  const hasAudioAttachment = Array.isArray(hw?.attachments) && hw.attachments.some(a => {
    const name = (a.name || a.url || a.filename || '').toLowerCase();
    const type = (a.type || a.mimeType || '').toLowerCase();
    return type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(name);
  });

  if (hasAudioAttachment || text.includes('listening') || text.includes('tinglash') || text.includes('eshitish') || text.includes('audio dars')) {
    return 'listening';
  }
  if (text.includes('speaking') || text.includes('nutq') || text.includes('gapirish') || text.includes('og\'zaki') || text.includes('sehrli ovoz')) {
    return 'speaking';
  }
  if (text.includes('reading') || text.includes('o\'qish') || text.includes('matn') || text.includes('passage') || text.includes('read aloud') || text.includes('hikoya')) {
    return 'reading';
  }
  return 'writing';
};

export const CATEGORY_CONFIG = {
  listening: {
    key: 'listening',
    label: 'Tinglash',
    emoji: '🎧',
    icon: Headphones,
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    accentBg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
  },
  reading: {
    key: 'reading',
    label: 'O\'qish',
    emoji: '📖',
    icon: BookOpen,
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
  },
  speaking: {
    key: 'speaking',
    label: 'Nutq',
    emoji: '🗣️',
    icon: Mic,
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    accentBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
  },
  writing: {
    key: 'writing',
    label: 'Yozma',
    emoji: '📝',
    icon: PenTool,
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
    accentBg: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400',
  },
};

export default function StudentHomework() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: homework = [], isLoading } = useQuery({
    queryKey: ['student-homework'],
    queryFn: () => api.get('/homework/student').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
  });

  const filteredHomework = useMemo(() => {
    if (!Array.isArray(homework)) return [];
    if (selectedCategory === 'all') return homework;
    return homework.filter(h => getHomeworkCategory(h) === selectedCategory);
  }, [homework, selectedCategory]);

  const pending = filteredHomework.filter(h => !h.submissions?.[0]);
  const submitted = filteredHomework.filter(h => h.submissions?.[0]);

  const counts = useMemo(() => {
    const res = { all: homework.length, listening: 0, reading: 0, speaking: 0, writing: 0 };
    homework.forEach(h => {
      const cat = getHomeworkCategory(h);
      if (res[cat] !== undefined) res[cat]++;
    });
    return res;
  }, [homework]);

  const HWCard = ({ hw, i }) => {
    const sub = hw.submissions?.[0];
    const isLate = new Date() > new Date(hw.dueDate) && !sub;
    const isTushun = hw.description && (
      hw.description.includes('TUSHUN') ||
      hw.description.includes('Missiya') ||
      hw.description.includes('Teskari Dars')
    );

    const catKey = getHomeworkCategory(hw);
    const cat = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.writing;
    const CatIcon = cat.icon;

    // Submission status badge configuration
    const isGradedByTeacher = sub && (sub.status === 'graded' || sub.teacherGrade || (sub.finalScore !== null && sub.finalScore !== undefined && sub.status !== 'ai_graded'));
    const isAiGraded = sub && (sub.status === 'ai_graded' || (sub.aiGrade && !isGradedByTeacher));
    const isSubmittedPending = sub && !isGradedByTeacher && !isAiGraded;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.04 }}
        className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 hover:shadow-soft transition-all border border-[var(--border)]"
      >
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          {/* Category Icon Avatar */}
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${cat.accentBg}`}>
            <CatIcon size={20} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-gray-800 dark:text-white truncate">
                {hw.title}
              </span>

              {/* Category Badge */}
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cat.badgeClass}`}>
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </span>

              {isTushun && (
                <span className="badge text-[10px] bg-primary/15 text-primary font-bold py-0.5 px-2">
                  Kreativ Missiya
                </span>
              )}
            </div>

            {/* Sub-info / Metadata */}
            <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Clock size={12} className="text-gray-400" />
                <span>Muddat: {formatDate(hw.dueDate)}</span>
              </span>

              <span className="text-gray-300 dark:text-gray-700">•</span>

              <span className="font-medium text-gray-600 dark:text-gray-300">
                Maksimal: {hw.maxScore || 100} ball
              </span>

              {isLate && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                  <AlertCircle size={11} /> Kechikkan
                </span>
              )}
            </div>

            {/* Evaluation Status Badge */}
            {sub && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {isGradedByTeacher && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Ustoz baholadi: {sub.finalScore ?? sub.teacherGrade?.score ?? 0}/{hw.maxScore} ball</span>
                  </span>
                )}

                {isAiGraded && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                    <Bot size={13} className="text-purple-600" />
                    <span>AI tekshiruvi: {sub.aiGrade?.score ?? sub.finalScore ?? 0}/{hw.maxScore} ball (Ustoz tasdig'i kutilmoqda)</span>
                  </span>
                )}

                {isSubmittedPending && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                    <Clock size={13} className="text-amber-600" />
                    <span>Topshirilgan (Tekshiruv kutilmoqda)</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--border)] flex-shrink-0">
          {!sub ? (
            <Link
              to={`/student/homework/${hw.id}/submit`}
              className="btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 font-bold shadow-soft hover:shadow-md transition-all"
            >
              <span>Bajarish</span>
              <ChevronRight size={14} />
            </Link>
          ) : (
            <Link
              to={`/student/homework/${hw.id}/submit`}
              className="btn-secondary text-xs py-1.5 px-3.5 rounded-xl flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-200 hover:text-primary transition-all"
            >
              <span>Ko'rib chiqish</span>
              <ChevronRight size={13} />
            </Link>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <StudentAcademicTabs active="homework" />

      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-orange-500/10 border border-primary/20 flex items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
            Interaktiv Uy Vazifalari <Sparkles size={22} className="text-primary" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            Tinglash, o'qish, erkin nutq va yozma topshiriqlarni bajaring, AI va ustozi xulosasini darhol oling!
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 shadow-sm hidden sm:flex">
          <Heart size={24} className="fill-primary" />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            selectedCategory === 'all'
              ? 'bg-primary text-white shadow-soft'
              : 'bg-white dark:bg-gray-800 border border-[var(--border)] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
          }`}
        >
          <span>Barchasi</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
            {counts.all}
          </span>
        </button>

        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const isSelected = selectedCategory === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-white dark:bg-gray-800 border border-[var(--border)] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
              }`}
            >
              <span>{config.emoji}</span>
              <span>{config.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                {counts[key] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pending Homework */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Bajarilishi kerak bo'lgan vazifalar ({pending.length})</span>
          </h2>
          <div className="space-y-3">
            {pending.map((hw, i) => <HWCard key={hw.id} hw={hw} i={i} />)}
          </div>
        </div>
      )}

      {/* Submitted Homework */}
      {submitted.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Topshirilgan vazifalar ({submitted.length})</span>
          </h2>
          <div className="space-y-3">
            {submitted.map((hw, i) => <HWCard key={hw.id} hw={hw} i={i} />)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredHomework.length === 0 && (
        <div className="text-center py-16 text-gray-400 card border border-dashed border-[var(--border)]">
          <ClipboardList size={44} className="mx-auto mb-3 opacity-30 text-primary" />
          <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">
            {selectedCategory === 'all'
              ? "Hozircha yangi uy vazifasi yo'q."
              : `Tanlangan toifada (${CATEGORY_CONFIG[selectedCategory]?.label || ''}) vazifa topilmadi.`}
          </p>
          <p className="text-xs text-gray-400 mt-1">Darslarni takrorlab, yangi materiallarni ko'rib turishingiz mumkin!</p>
        </div>
      )}
    </div>
  );
}
