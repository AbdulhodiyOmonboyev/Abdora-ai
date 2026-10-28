import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen, Clock, Sparkles, Loader2, Search, X, RefreshCw,
  LayoutGrid, List, ArrowRight, Eye, Paperclip, Play, CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../config/axios';
import { formatDate } from '../../utils/format';
import { getSubjectIcon, getSubjectLabel, getSubjectBadgeClass } from '../../utils/subjects';
import StudentAcademicTabs from '../../components/student/StudentAcademicTabs';

export default function StudentLessons() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [onlyAiReady, setOnlyAiReady] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const {
    data: lessons = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['lessons', user?.groupId],
    queryFn: async () => {
      const res = await api.get('/lessons');
      const list = res.data?.data || res.data || [];
      return Array.isArray(list) ? list : [];
    },
    enabled: !!user?.groupId,
  });

  // Mavjud fanlarni dinamik ajratib olish
  const availableSubjects = useMemo(() => {
    const subjects = new Set();
    lessons.forEach((l) => {
      if (l.subject) subjects.add(l.subject);
    });
    return Array.from(subjects);
  }, [lessons]);

  // Qidiruv va filtrlash
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      // 1. Qidiruv so'zi
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (lesson.title || '').toLowerCase().includes(q);
        const contentMatch = (lesson.content || '').toLowerCase().includes(q);
        const teacherMatch = (lesson.teacher?.name || '').toLowerCase().includes(q);
        if (!titleMatch && !contentMatch && !teacherMatch) return false;
      }

      // 2. Fan bo'yicha filtr
      if (selectedSubject !== 'all' && lesson.subject !== selectedSubject) {
        return false;
      }

      // 3. Faqat AI tayyor bo'lganlar
      if (onlyAiReady && lesson.aiContent?.status !== 'done') {
        return false;
      }

      return true;
    });
  }, [lessons, searchQuery, selectedSubject, onlyAiReady]);

  // Guruh biriktirilmagan holat
  if (!user?.groupId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <StudentAcademicTabs active="lessons" />
        <div
          className="p-8 sm:p-12 rounded-3xl text-center max-w-lg mx-auto"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
          >
            <BookOpen size={30} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Guruh biriktirilmagan
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            Darslar va topshiriqlarni ko'rish uchun o'quv markazingiz yoki o'qituvchingizdan sizni tegishli guruhga qo'shishni so'rang.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* ── 1. Bo'limlar o'tkazgichi (Darslar, Uyga vazifa, Imtihonlar) — Mobil ilova bilan bir xil ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <StudentAcademicTabs active="lessons" />

        {/* Tezkor yangilash va ko'rinish rejimi */}
        <div className="flex items-center gap-2 mb-6 sm:mb-0">
          <div
            className="p-1 rounded-xl flex items-center gap-1"
            style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}
          >
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-card text-primary shadow-xs' : 'text-muted hover:text-primary'
              }`}
              title="Katak ko'rinishi (Grid)"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-card text-primary shadow-xs' : 'text-muted hover:text-primary'
              }`}
              title="Ro'yxat ko'rinishi (List)"
            >
              <List size={16} />
            </button>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-secondary text-xs sm:text-sm py-2 px-3 flex items-center gap-1.5"
            title="Qayta yuklash"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin text-primary' : ''} />
            <span className="hidden sm:inline">Yangilash</span>
          </button>
        </div>
      </div>

      {/* ── 2. Sahifa sarlavhasi va statistikasi ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Mening Darslarim
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {filteredLessons.length} ta dars mavjud • Sun'iy intellekt va amaliy tahlillar bilan
          </p>
        </div>
      </div>

      {/* ── 3. Qidiruv va Filtrlar paneli — Mobil ilova uslubida ── */}
      <div
        className="p-4 sm:p-5 rounded-2xl space-y-4"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Qidiruv maydoni */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Dars nomi yoki mavzuni qidiring..."
            className="input-field pl-10 pr-10 w-full"
            style={{ height: '2.75rem', fontSize: '0.875rem' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Fanlar va Holatlar bo'yicha filtr chiplari */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedSubject === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'text-secondary hover:text-primary hover:bg-secondary-background'
            }`}
            style={{
              background: selectedSubject === 'all' ? 'var(--primary)' : 'var(--secondary-background)',
              border: '1px solid var(--border)',
            }}
          >
            Barchasi ({lessons.length})
          </button>

          {availableSubjects.map((sub) => {
            const count = lessons.filter((l) => l.subject === sub).length;
            const isSel = selectedSubject === sub;
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSel
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondary hover:text-primary'
                }`}
                style={{
                  background: isSel ? 'var(--primary)' : 'var(--secondary-background)',
                  border: '1px solid var(--border)',
                  color: isSel ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                {getSubjectIcon(sub, { size: 14, className: isSel ? 'text-white' : 'text-primary' })}
                <span>{getSubjectLabel(sub)}</span>
                <span className="opacity-75 text-[10px]">({count})</span>
              </button>
            );
          })}

          {/* AI Tayyor filtri */}
          <button
            onClick={() => setOnlyAiReady(!onlyAiReady)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ml-auto ${
              onlyAiReady
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-secondary hover:text-emerald-600'
            }`}
            style={{
              background: onlyAiReady ? '#10b981' : 'var(--secondary-background)',
              border: '1px solid var(--border)',
              color: onlyAiReady ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            <Sparkles size={13} className={onlyAiReady ? 'text-white' : 'text-emerald-500'} />
            <span>Faqat AI tayyor</span>
          </button>
        </div>
      </div>

      {/* ── 4. Darslar ro'yxati yoki Kataklar — Mobil ilova kartochkalari bilan bir xil ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl animate-pulse"
              style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}
            />
          ))}
        </div>
      ) : filteredLessons.length === 0 ? (
        // ── Bo'sh holat — Mobil ilovadagi kabi toza va do'stona ──
        <div
          className="p-10 sm:p-14 rounded-3xl text-center max-w-md mx-auto"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}
          >
            <BookOpen size={28} />
          </div>
          <h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Darslar topilmadi
          </h3>
          <p className="text-xs sm:text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            {searchQuery || selectedSubject !== 'all' || onlyAiReady
              ? "Qidiruv yoki tanlangan filtrlar bo'yicha hech qanday dars topilmadi."
              : "Hozircha darslar mavjud emas. Yangilash uchun quyidagi tugmani bosing."}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSubject('all');
              setOnlyAiReady(false);
              refetch();
            }}
            className="btn-primary text-xs sm:text-sm py-2 px-4 inline-flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Qayta yuklash
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        // ── Katak ko'rinishi (Grid Mode) — App GlassCard dizayni bilan bir xil ──
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {filteredLessons.map((lesson, idx) => {
              const hasVideo = !!lesson.videoUrl;
              const hasAttachments = lesson.attachments && lesson.attachments.length > 0;
              const isAiReady = lesson.aiContent?.status === 'done';
              const isGenerating = lesson.aiContent?.status === 'generating';
              const lessonOrder = lesson.order !== undefined && lesson.order !== null ? lesson.order + 1 : idx + 1;

              return (
                <motion.div
                  key={lesson.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                >
                  <Link
                    to={`/student/lessons/${lesson.id}`}
                    className="card group flex flex-col justify-between h-full p-4 sm:p-5 rounded-2xl transition-all hover:border-primary/40 hover:shadow-md cursor-pointer block relative overflow-hidden"
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      {/* Yuqori qator: Dars tartibi + Fan + AI Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 tracking-wide"
                          style={{
                            background: 'rgba(59, 130, 246, 0.12)',
                            color: 'var(--primary)',
                          }}
                        >
                          {lessonOrder}-Dars
                        </span>

                        <div className="flex items-center gap-1.5">
                          {lesson.subject && (
                            <span className={`badge text-[10px] py-0.5 px-2 flex items-center gap-1 ${getSubjectBadgeClass(lesson.subject)}`}>
                              {getSubjectIcon(lesson.subject, { size: 12 })}
                              <span>{getSubjectLabel(lesson.subject)}</span>
                            </span>
                          )}

                          {isAiReady ? (
                            <span
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              title="Multimodal AI Tayyor"
                            >
                              <Sparkles size={11} />
                              AI Tayyor
                            </span>
                          ) : isGenerating ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <Loader2 size={11} className="animate-spin" />
                              Jarayonda
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Dars nomi */}
                      <h3
                        className="font-bold text-base sm:text-lg mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {lesson.title}
                      </h3>

                      {/* Dars matni / tavsifi */}
                      <p
                        className="text-xs sm:text-sm line-clamp-2 leading-relaxed mb-4"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {lesson.content && lesson.content.trim()
                          ? lesson.content
                          : "Mavzu bo'yicha batafsil darslik, AI yordamchi va interaktiv amaliyotlar."}
                      </p>
                    </div>

                    {/* Pastki qism: Meta ma'lumotlar va 'O'rganish' tugmasi — App bilan bir xil */}
                    <div className="pt-3 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center justify-between text-[11px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} />
                          {formatDate(lesson.createdAt)}
                        </span>
                        <div className="flex items-center gap-2">
                          {hasVideo && (
                            <span className="flex items-center gap-0.5 text-sky-500 font-medium" title="Video dars mavjud">
                              <Play size={12} /> Video
                            </span>
                          )}
                          {hasAttachments && (
                            <span className="flex items-center gap-0.5 text-muted font-medium" title="Fayllar biriktirilgan">
                              <Paperclip size={12} /> {lesson.attachments.length}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye size={12} />
                            {lesson.views || 0}
                          </span>
                        </div>
                      </div>

                      {/* 'O'rganish' tugmasi — Mobil ilovadagi kabi to'liq kenglikda */}
                      <div
                        className="w-full py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all group-hover:bg-primary group-hover:text-white"
                        style={{
                          background: 'rgba(59, 130, 246, 0.08)',
                          color: 'var(--primary)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                        }}
                      >
                        <span>O'rganish</span>
                        <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        // ── Ro'yxat ko'rinishi (List Mode) ──
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredLessons.map((lesson, idx) => {
              const isAiReady = lesson.aiContent?.status === 'done';
              const lessonOrder = lesson.order !== undefined && lesson.order !== null ? lesson.order + 1 : idx + 1;

              return (
                <motion.div
                  key={lesson.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15, delay: idx * 0.02 }}
                >
                  <Link
                    to={`/student/lessons/${lesson.id}`}
                    className="card group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl gap-4 hover:border-primary/40 hover:shadow-sm transition-all"
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      {/* Tartib belgisi */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: 'var(--primary)',
                        }}
                      >
                        {lessonOrder}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3
                            className="font-bold text-sm sm:text-base group-hover:text-primary transition-colors truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {lesson.title}
                          </h3>

                          {lesson.subject && (
                            <span className={`badge text-[10px] py-0.5 px-2 flex items-center gap-1 ${getSubjectBadgeClass(lesson.subject)}`}>
                              {getSubjectIcon(lesson.subject, { size: 11 })}
                              <span>{getSubjectLabel(lesson.subject)}</span>
                            </span>
                          )}

                          {isAiReady && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                              <Sparkles size={11} /> AI
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span className="flex items-center gap-1 text-muted">
                            <Clock size={11} /> {formatDate(lesson.createdAt)}
                          </span>
                          <span className="flex items-center gap-1 text-muted">
                            <Eye size={11} /> {lesson.views || 0} ko'rildi
                          </span>
                          {lesson.teacher?.name && (
                            <span className="text-muted hidden md:inline">
                              O'qituvchi: <strong style={{ color: 'var(--text-primary)' }}>{lesson.teacher.name}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end flex-shrink-0">
                      <div
                        className="py-2 px-4 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all group-hover:bg-primary group-hover:text-white"
                        style={{
                          background: 'rgba(59, 130, 246, 0.08)',
                          color: 'var(--primary)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                        }}
                      >
                        <span>O'rganish</span>
                        <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
