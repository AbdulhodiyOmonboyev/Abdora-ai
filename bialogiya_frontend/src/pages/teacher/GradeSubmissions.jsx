import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle, Bot, Clock, Sparkles, Play, Pause, Volume2,
  Download, FileText, CheckCircle2, XCircle, AlertCircle, HelpCircle,
  Headphones, BookOpen, MessageSquare, PenTool, Edit3, Check
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { getScoreColor, formatDateTime, formatDeadlineOffset } from '../../utils/format';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const FILE_BASE_URL = API_BASE_URL.replace('/api', '');

// Chiroyli va funksional audio pleyer (Play/Pause, vaqt, progress, yuklab olish)
function SubmissionAudioPlayer({ audioUrl, fileName = 'ovozli_javob.webm' }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatSec = (sec) => {
    if (isNaN(sec) || !isFinite(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20 shadow-sm space-y-2">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-purple-600/10 text-purple-600 flex items-center justify-center">
            <Volume2 size={15} />
          </span>
          <div>
            <div className="text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
              <span>O'quvchi ovozli yozuvi</span>
              <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded font-mono">
                {formatSec(duration)}
              </span>
            </div>
            <div className="text-[10px] text-gray-400 truncate max-w-xs">{fileName}</div>
          </div>
        </div>

        <a
          href={audioUrl}
          download={fileName}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 p-1.5 rounded-lg hover:bg-purple-100/50 dark:hover:bg-purple-900/30 flex items-center gap-1 transition-colors"
          title="Audioni yuklab olish"
        >
          <Download size={14} />
          <span className="hidden sm:inline text-[11px] font-medium">Yuklab olish</span>
        </a>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center flex-shrink-0 shadow-md transition-transform active:scale-95"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>

        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
        </div>

        <span className="text-[11px] font-mono text-gray-500 whitespace-nowrap">
          {formatSec(currentTime)} / {formatSec(duration)}
        </span>
      </div>
    </div>
  );
}

export default function GradeSubmissions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [grades, setGrades] = useState({});

  const { data: hw } = useQuery({
    queryKey: ['hw', id],
    queryFn: () => api.get(`/homework/${id}`).then(r => r.data.data)
  });

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions', id],
    queryFn: () => api.get(`/homework/${id}/submissions`).then(r => r.data.data)
  });

  // Homework tavsifidan interaktiv konfiguratsiyani ajratib olish
  const interactiveConfig = useMemo(() => {
    if (!hw?.description) return null;
    const match = hw.description.match(/<!-- INTERACTIVE_CONFIG:\s*([\s\S]*?)\s*-->/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.warn('Failed to parse interactiveConfig from description', e);
      }
    }
    return null;
  }, [hw?.description]);

  const gradeMutation = useMutation({
    mutationFn: ({ subId, score, comment }) => api.put(`/homework/submissions/${subId}/grade`, { score, feedback: comment }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries(['submissions', id]);
      if (variables?.subId) {
        setGrades(g => {
          const next = { ...g };
          delete next[variables.subId];
          return next;
        });
      }
      toast.success('Baholandi va saqlandi!');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xatolik yuz berdi'),
  });

  // Submissiondan audio fayllarni ajratish
  const getAudioFilesFromSubmission = (sub) => {
    const list = [];
    const rawFiles = Array.isArray(sub.filePaths) ? sub.filePaths : [];

    rawFiles.forEach((fileItem) => {
      if (typeof fileItem === 'string') {
        const isAudio = /\.(webm|mp3|wav|ogg|m4a|aac)$/i.test(fileItem) || fileItem.includes('ovozli');
        if (isAudio) {
          const fullUrl = fileItem.startsWith('http') ? fileItem : `${FILE_BASE_URL}/${fileItem.replace(/^\//, '')}`;
          list.push({ url: fullUrl, name: fileItem.split('/').pop() || 'Audio yozuv' });
        }
      } else if (fileItem && typeof fileItem === 'object') {
        const isAudio = fileItem.type?.startsWith('audio/') || /\.(webm|mp3|wav|ogg|m4a)$/i.test(fileItem.name || '');
        if (isAudio) {
          const fullUrl = fileItem.id ? `${API_BASE_URL}/files/${fileItem.id}` : fileItem.url;
          list.push({ url: fullUrl, name: fileItem.name || 'Audio yozuv' });
        }
      }
    });

    return list;
  };

  // O'quvchi javoblarini interaktiv inputlar bilan taqqoslash parseri
  const parseStudentAnswers = (sub) => {
    if (!interactiveConfig?.interactiveInputs || interactiveConfig.interactiveInputs.length === 0) {
      return null;
    }

    let parsedAnsMap = {};
    const text = sub.answerText || '';

    // 1. JSON parse tekshiruvi
    const jsonMatch = text.match(/<!-- STUDENT_ANSWERS:\s*([\s\S]*?)\s*-->/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const rawJson = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        parsedAnsMap = rawJson.answers || rawJson;
      } catch (_) {}
    }

    // 2. Taqqoslash ro'yxatini tuzish
    return interactiveConfig.interactiveInputs.map((input, idx) => {
      let studentAns = parsedAnsMap[input.id] || parsedAnsMap[idx] || '';

      // Agar JSON topilmagan bo'lsa, matndan qatorlar orqali topishga urinish
      if (!studentAns && text) {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines[idx]) {
          studentAns = lines[idx].replace(/^\d+[\.\)]\s*/, '');
        }
      }

      const correctAns = (input.correctAnswer || '').trim();
      const isVoice = input.type === 'voice_record';

      // To'g'ri / Noto'g'ri tekshiruvi (matnli va testlar uchun)
      let isCorrect = false;
      if (!isVoice && studentAns && correctAns) {
        const normStudent = studentAns.toLowerCase().replace(/[.,!?'"]/g, '').trim();
        const normCorrect = correctAns.toLowerCase().replace(/[.,!?'"]/g, '').trim();
        isCorrect = normStudent === normCorrect || normStudent.includes(normCorrect) || normCorrect.includes(normStudent);
      }

      return {
        input,
        studentAns,
        correctAns,
        isVoice,
        isCorrect: isVoice ? null : (studentAns ? isCorrect : false),
      };
    });
  };

  const categoryMeta = {
    listening: { name: 'Tinglab tushunish', icon: Headphones, color: 'text-emerald-600 bg-emerald-50' },
    reading: { name: "O'qish & Talaffuz", icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
    speaking: { name: 'Nutq & Ovozli javob', icon: MessageSquare, color: 'text-purple-600 bg-purple-50' },
    writing: { name: 'Yozma / Standart', icon: PenTool, color: 'text-blue-600 bg-blue-50' },
  }[interactiveConfig?.category || 'writing'] || { name: 'Standart', icon: PenTool, color: 'text-blue-600 bg-blue-50' };

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white">
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
              Topshiriqlarni tekshirish va baholash
            </h1>
            {interactiveConfig?.category && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${categoryMeta.color}`}>
                {categoryMeta.name}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {hw?.title || 'Vazifa'} (Maksimal: {hw?.maxScore || 100} ball)
          </p>
        </div>
      </div>

      {hw?.dueDate && (
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <Clock size={13} /> Topshirish muddati: <strong>{formatDateTime(hw.dueDate)}</strong>
        </div>
      )}

      {/* Submissions List */}
      <div className="space-y-5">
        {submissions?.map((sub, i) => {
          const submittedAt = sub.submittedAt || sub.createdAt;
          const offset = formatDeadlineOffset(submittedAt, sub.homework?.dueDate || hw?.dueDate);
          const isReviewed = sub.status === 'graded' || sub.status === 'teacher_reviewed';
          const isEditing = !!grades[sub.id]?.editing;

          const audioFiles = getAudioFilesFromSubmission(sub);
          const comparisonItems = parseStudentAnswers(sub);

          return (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card space-y-4"
            >
              {/* Talaba profili va topshirilgan vaqt */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 gradient-bg rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm">
                    {sub.student?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm sm:text-base text-gray-800 dark:text-white">
                      {sub.student?.name}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                      <span>@{sub.student?.username}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {formatDateTime(submittedAt)}
                      </span>
                      {offset && (
                        <span className={`font-semibold ${offset.late ? 'text-red-500' : 'text-green-600'}`}>
                          ({offset.label})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {sub.finalScore !== undefined && sub.finalScore !== null && (
                  <div className={`badge px-3 py-1 text-sm font-bold rounded-xl ${getScoreColor(sub.finalScore)}`}>
                    {sub.finalScore} / {hw?.maxScore}
                  </div>
                )}
              </div>

              {/* 1. O'quvchi to'ldirgan interaktiv inputlar va to'g'ri javoblar taqqoslanishi */}
              {comparisonItems && comparisonItems.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-primary" />
                      Interaktiv javoblar tahlili ({comparisonItems.length} ta savol):
                    </span>
                    <span className="text-[11px] font-normal text-gray-400">
                      Yashil - to'g'ri, Qizil - noto'g'ri
                    </span>
                  </div>

                  <div className="space-y-2">
                    {comparisonItems.map((item, idx) => (
                      <div
                        key={item.input.id || idx}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                          item.isVoice
                            ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/40'
                            : item.isCorrect
                            ? 'bg-green-50/60 dark:bg-green-950/25 border-green-200 dark:border-green-800/50'
                            : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                            {item.isVoice ? (
                              <MessageSquare size={13} className="text-purple-600 flex-shrink-0" />
                            ) : item.isCorrect ? (
                              <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />
                            ) : (
                              <XCircle size={14} className="text-red-500 flex-shrink-0" />
                            )}
                            <span>{idx + 1}. {item.input.question}</span>
                          </div>
                          <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">
                            {item.input.points} ball
                          </span>
                        </div>

                        {/* O'quvchi javobi */}
                        <div className="pl-5 space-y-1">
                          <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                            <span className="font-medium text-gray-500 text-[11px]">O'quvchi javobi:</span>
                            <span className={`font-semibold ${item.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-400'}`}>
                              {item.studentAns || (item.isVoice ? "Quyidagi audio pleyerda" : "Javob berilmagan")}
                            </span>
                          </div>

                          {/* Namunaviy to'g'ri javob */}
                          {item.correctAns && (
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                              <span className="font-medium">To'g'ri javob (Answer Key):</span>
                              <span className="text-green-700 dark:text-green-400 font-mono">
                                {item.correctAns}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Agar oddiy matnli javob bo'lsa */
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Topshirilgan matnli javob:
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed border border-[var(--border)]">
                    {sub.answerText || <span className="text-gray-400 italic">Matnli javob kiritilmagan</span>}
                  </div>
                </div>
              )}

              {/* 2. Audio pleyer bloki (reading / speaking yoki audio yuklangan bo'lsa) */}
              {audioFiles.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <Headphones size={14} />
                    <span>O'quvchining audio javoblari ({audioFiles.length} ta yozuv):</span>
                  </div>
                  <div className="space-y-2">
                    {audioFiles.map((af, aIdx) => (
                      <SubmissionAudioPlayer key={aIdx} audioUrl={af.url} fileName={af.name} />
                    ))}
                  </div>
                </div>
              )}

              {/* 3. AI qo'ygan dastlabki ball va izoh */}
              {sub.aiGrade && (
                <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-4 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-600 flex items-center justify-center">
                        <Bot size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                          <span>AI dastlabki bahosi va xulosasi:</span>
                          <span className="bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                            {sub.aiGrade.score} / {hw?.maxScore} ball
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI bahosini bitta bosishda tasdiqlash tugmasi */}
                    {(!isReviewed || isEditing) && (
                      <button
                        type="button"
                        onClick={() => {
                          setGrades(g => ({
                            ...g,
                            [sub.id]: {
                              score: sub.aiGrade.score,
                              comment: sub.aiGrade.feedback || "AI xulosasi asosida tasdiqlandi"
                            }
                          }));
                          toast.success("AI bali va izohi maydonlarga kiritildi!");
                        }}
                        className="btn-secondary text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5 text-purple-600 dark:text-purple-300 border-purple-300 dark:border-purple-800 font-semibold"
                      >
                        <Sparkles size={13} />
                        AI bahosini qabul qilish
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-white/60 dark:bg-gray-800/60 p-2.5 rounded-xl border border-purple-500/10">
                    {sub.aiGrade.feedback}
                  </p>

                  {/* Yetishmayotgan tushunchalar */}
                  {Array.isArray(sub.aiGrade.keyMissingConcepts) && sub.aiGrade.keyMissingConcepts.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        Yetishmayotgan tushunchalar:
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {sub.aiGrade.keyMissingConcepts.map((concept, cIdx) => (
                          <span key={cIdx} className="text-[11px] bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI tavsiyalari */}
                  {Array.isArray(sub.aiGrade.suggestions) && sub.aiGrade.suggestions.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">AI tavsiyalari:</span>
                      <ul className="list-disc list-inside text-[11px] text-gray-600 dark:text-gray-400 mt-0.5 space-y-0.5">
                        {sub.aiGrade.suggestions.map((sug, sIdx) => (
                          <li key={sIdx}>{sug}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* 4. O'qituvchi baholash paneli */}
              {(!isReviewed || isEditing) ? (
                <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-[var(--border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                      <Edit3 size={14} className="text-primary" /> Yakuniy bahoni qo'yish:
                    </span>
                    {sub.aiGrade && (
                      <button
                        type="button"
                        onClick={() => {
                          gradeMutation.mutate({
                            subId: sub.id,
                            score: sub.aiGrade.score,
                            comment: sub.aiGrade.feedback || 'AI bahosi o\'qituvchi tomonidan tasdiqlandi'
                          });
                        }}
                        disabled={gradeMutation.isPending}
                        className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
                      >
                        <Check size={13} /> AI bahosini to'g'ridan-to'g'ri tasdiqlash
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="w-full sm:w-36">
                      <label className="block text-[11px] text-gray-500 mb-1">Ball (maks. {hw?.maxScore || 100}):</label>
                      <input
                        type="number"
                        min={0}
                        max={hw?.maxScore || 100}
                        placeholder={`Maks ${hw?.maxScore}`}
                        value={grades[sub.id]?.score ?? (sub.teacherGrade?.score ?? sub.finalScore ?? sub.aiGrade?.score ?? '')}
                        onChange={e => setGrades(g => ({ ...g, [sub.id]: { ...g[sub.id], score: +e.target.value } }))}
                        className="input-field text-sm font-bold"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="block text-[11px] text-gray-500 mb-1">O'qituvchi izohi / Feedback:</label>
                      <input
                        placeholder="Masalan: Barakalla! Savollarga juda to'g'ri javob berilgan."
                        value={grades[sub.id]?.comment ?? (sub.teacherGrade?.feedback ?? (grades[sub.id]?.comment === undefined && sub.aiGrade?.feedback ? sub.aiGrade.feedback : ''))}
                        onChange={e => setGrades(g => ({ ...g, [sub.id]: { ...g[sub.id], comment: e.target.value } }))}
                        className="input-field text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setGrades(g => {
                          const next = { ...g };
                          delete next[sub.id];
                          return next;
                        })}
                        className="btn-ghost px-3 py-2 text-xs text-gray-500 rounded-xl"
                      >
                        Bekor qilish
                      </button>
                    )}

                    <button
                      disabled={gradeMutation.isPending}
                      onClick={() => gradeMutation.mutate({
                        subId: sub.id,
                        score: grades[sub.id]?.score ?? sub.teacherGrade?.score ?? sub.finalScore ?? sub.aiGrade?.score ?? 0,
                        comment: grades[sub.id]?.comment ?? sub.teacherGrade?.feedback ?? sub.aiGrade?.feedback ?? ''
                      })}
                      className="btn-primary px-4 py-2 flex items-center gap-1.5 text-xs sm:text-sm font-bold rounded-xl"
                    >
                      <CheckCircle size={15} />
                      Tasdiqlash va Saqlash
                    </button>
                  </div>
                </div>
              ) : (
                /* Allaqachon baholangan holat */
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-green-50/70 dark:bg-green-950/25 border border-green-200 dark:border-green-800/50 rounded-2xl gap-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-green-800 dark:text-green-300">
                        Baholangan: {sub.teacherGrade?.score ?? sub.finalScore} / {hw?.maxScore} ball
                      </div>
                      {sub.teacherGrade?.feedback && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                          <strong>Izoh: </strong>{sub.teacherGrade.feedback}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setGrades(g => ({
                      ...g,
                      [sub.id]: {
                        score: sub.teacherGrade?.score ?? sub.finalScore,
                        comment: sub.teacherGrade?.feedback || '',
                        editing: true
                      }
                    }))}
                    className="btn-secondary text-xs py-1.5 px-3 rounded-xl text-gray-600 dark:text-gray-300 self-end sm:self-center"
                  >
                    Bahoni o'zgartirish
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}

        {!isLoading && submissions?.length === 0 && (
          <div className="text-center py-16 card border-dashed space-y-2 text-gray-400">
            <Clock size={32} className="mx-auto opacity-50" />
            <div className="font-semibold text-sm">Hali birorta o'quvchi topshiriq yuklamagan</div>
            <p className="text-xs">O'quvchilar javob yuborganda ular shu yerda ko'rinadi.</p>
          </div>
        )}
      </div>
    </div>
  );
}
