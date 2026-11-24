import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Brain, Sparkles, Clapperboard, Video, CheckCircle2,
  Volume2, VolumeX, Play, Pause, ChevronRight, ChevronLeft,
  X, RotateCcw, Award, Lightbulb, Compass, Globe, Heart,
  Flame, HelpCircle, Check, ArrowRight, ShieldCheck, Zap,
  Layers, Smile, MessageSquare
} from 'lucide-react';
import AvatarMiniMeeting from './AvatarMiniMeeting';
import toast from 'react-hot-toast';
import api from '../../config/axios';
import { useAuthStore } from '../../store/authStore';

// Web Audio synthesizer
function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.2) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {}
}

const sounds = {
  click: () => playTone(440, 'sine', 0.06, 0.1),
  correct: () => {
    playTone(523.25, 'triangle', 0.1, 0.2);
    setTimeout(() => playTone(659.25, 'triangle', 0.18, 0.2), 80);
  },
  wrong: () => {
    playTone(260, 'sawtooth', 0.15, 0.15);
    setTimeout(() => playTone(196, 'sawtooth', 0.2, 0.15), 100);
  },
  stageComplete: () => {
    playTone(523.25, 'triangle', 0.1, 0.2);
    setTimeout(() => playTone(659.25, 'triangle', 0.1, 0.2), 90);
    setTimeout(() => playTone(783.99, 'triangle', 0.2, 0.25), 180);
  }
};

// Text-to-speech
function speakText(text, onEnd) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return null;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'uz-UZ';
  utterance.rate = 0.95;
  utterance.pitch = 1.05;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);
  return utterance;
}

export default function FourStageLessonModal({
  lesson = {},
  studentUser = {},
  isOpen = true,
  onClose,
  onComplete
}) {
  const [currentStage, setCurrentStage] = useState(1); // 1, 2, 3, 4
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [totalEarnedXp, setTotalEarnedXp] = useState(0);

  // STAGE 1 STATES (O'qib berish)
  const [isReading, setIsReading] = useState(false);
  const [currentReadingSentenceIdx, setCurrentReadingSentenceIdx] = useState(0);

  // STAGE 2 STATES (Qoidalar & Hayotda qo'llanilishi)
  const [exploredCards, setExploredCards] = useState(new Set());
  const [activeLifeTab, setActiveLifeTab] = useState('daily'); // 'daily' | 'nature' | 'tech'

  // STAGE 3 STATES (Video / Slaydlar)
  const [slideIdx, setSlideIdx] = useState(0);
  const [isSlidePlaying, setIsSlidePlaying] = useState(false);

  // STAGE 4 STATES (Tezkor Savollar -> Mini-Meeting)
  const [stage4Phase, setStage4Phase] = useState('quiz'); // 'quiz' | 'meeting'
  const [quizQuestionIdx, setQuizQuestionIdx] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState(null);
  const [quizAnswerStatus, setQuizAnswerStatus] = useState('idle'); // 'idle' | 'correct' | 'wrong'

  // Refs for tracking backend step submission & timings
  const stageStartTimeRef = useRef(Date.now());
  const submittedStagesRef = useRef(new Set());
  const correctAnswersCountRef = useRef(0);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      isReadingRef.current = false;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Backend API: POST /api/lessons/:id/step-submit
  const sendStepSubmit = async (stepType, isCorrect = true, customTime = null, stepIndex = null) => {
    if (!lesson?.id) return;
    const now = Date.now();
    const timeSpent = customTime !== null ? customTime : Math.max(1, Math.round((now - stageStartTimeRef.current) / 1000));
    stageStartTimeRef.current = now;
    try {
      const res = await api.post(`/lessons/${lesson.id}/step-submit`, {
        isCorrect,
        stepType,
        timeSpent,
        stepIndex: stepIndex ?? currentStage,
      });
      const data = res.data?.data;
      if (data?.newXP && useAuthStore.getState()?.user) {
        useAuthStore.setState((prev) => ({
          user: { ...prev.user, xp: data.newXP, level: data.level ?? prev.user.level }
        }));
      }
      return data;
    } catch (err) {
      console.error('Error submitting lesson step:', err);
    }
  };

  // Backend API: POST /api/lessons/:id/quiz-finish
  const sendQuizFinish = async (score, total) => {
    if (!lesson?.id) return;
    const now = Date.now();
    const timeSpent = Math.max(1, Math.round((now - stageStartTimeRef.current) / 1000));
    stageStartTimeRef.current = now;
    try {
      const res = await api.post(`/lessons/${lesson.id}/quiz-finish`, {
        score,
        totalQuestions: total,
        xp: totalEarnedXp,
        timeSpent,
      });
      const data = res.data?.data;
      if (data?.newXP && useAuthStore.getState()?.user) {
        useAuthStore.setState((prev) => ({
          user: { ...prev.user, xp: data.newXP, level: data.level ?? prev.user.level }
        }));
      }
      return data;
    } catch (err) {
      console.error('Error finishing lesson quiz:', err);
    }
  };

  // Backend API: POST /api/lessons/:id/complete (Meeting yakunlanganda to'liq yakunlash)
  const handleMeetingFinish = async ({ earnedXp, earnedCoins }) => {
    const finalXp = earnedXp || (totalEarnedXp + 50);
    const finalCoins = earnedCoins || 10;
    let backendResult = null;
    if (lesson?.id) {
      try {
        const res = await api.post(`/lessons/${lesson.id}/complete`, {
          xp: finalXp,
          coins: finalCoins,
        });
        backendResult = res.data?.data;
        if (backendResult?.newXP && useAuthStore.getState()?.user) {
          useAuthStore.setState((prev) => ({
            user: { ...prev.user, xp: backendResult.newXP, level: backendResult.level ?? prev.user.level }
          }));
        }
        toast.success(`Dars muvaffaqiyatli yakunlandi! +${backendResult?.xpGained ?? finalXp} XP! 🎉`);
      } catch (err) {
        console.error('Error completing lesson:', err);
      }
    }
    if (onComplete) {
      onComplete({ earnedXp: finalXp, earnedCoins: finalCoins, backendResult });
    }
    onClose();
  };

  const title = lesson?.title || "Dars Mavzusi";
  const ai = lesson?.aiContent || {};

  // ========================================================
  // CONTENT PARSING & FALLBACK PREPARATION
  // ========================================================
  const readingParagraphs = useMemo(() => {
    const raw = ai.simpleExplanation || ai.story || lesson.content ||
      `${title} biologiya fanining eng qiziqarli va muhim mavzularidan biridir. Tirik tabiatdagi barcha jarayonlar bir-biri bilan uzviy bog'langan. Har bir tirik hujayra o'z vazifasini mukammal bajaradi va organizmning yashashini ta'minlaydi.`;
    return raw.split(/(?<=[.?!])\s+/).filter(Boolean);
  }, [ai, lesson, title]);

  const analogyText = useMemo(() => {
    return ai.mnemonics || ai.analogies ||
      `Tasavvur qiling: Har bir tirik hujayra - bu o'zining hokimiyati, fabrikalari va transport tizimiga ega bo'lgan ulkan va tartibli zamonaviy shahar kabi ishlaydi!`;
  }, [ai]);

  const keyRule = useMemo(() => {
    return ai.formula || ai.summary?.split('\n')?.[0] ||
      `Asosiy Qoida: Barcha tirik organizmlarning eng kichik tuzilish va vazifaviy birligi hujayra hisoblanadi.`;
  }, [ai]);

  // Real-life application cards data
  const lifeApplications = useMemo(() => [
    {
      id: 'daily',
      title: 'Kundalik Hayotda',
      icon: '🏠',
      badge: 'Turmush va Sog\'lik',
      color: 'from-amber-500 to-orange-500',
      description: 'Oshxonadagi mahsulotlar (achitqi, yogurt), shaxsiy gigiyena, to\'g\'ri ovqatlanish va tanamizning har kuni qanday energiya sarflashini tushunishda yordam beradi.',
      example: 'Masalan: Oziq-ovqatlarni muzlatgichda saqlash bakteriyalar ko\'payishini sekinlashtiradi.'
    },
    {
      id: 'nature',
      title: 'Tabiatda va Atrof-muhitda',
      icon: '🌿',
      badge: 'Ekologiya va Olam',
      color: 'from-emerald-500 to-teal-500',
      description: 'O\'simliklarning quyosh nuri orqali toza kislorod ishlab chiqarishi (fotosintez), fasllar almashinuvi va hayvonlarning o\'zaro ekotizim muvozanatini saqlashida ishlaydi.',
      example: 'Masalan: Bitta katta chinor daraxti 3 kishining 1 yillik kislorod ehtiyojini qoplaydi.'
    },
    {
      id: 'tech',
      title: 'Texnologiya va Kelajakda',
      icon: '🚀',
      badge: 'Tibbiyot va Biotexnologiya',
      color: 'from-blue-500 to-indigo-500',
      description: 'Biomimikriya — insonlar tabiatdan o\'rganib tezyurar poyezdlar, samolyotlar va yangi dori-darmonlarni yaratmoqda. Sun\'iy intellekt esa genlarni tahlil qilishda yordam bermoqda.',
      example: 'Masalan: Yaponiyadagi Shinkansen poyezdi tumshug\'i baliqchi qush (kingfisher) tumshug\'idan andoza olingan.'
    }
  ], []);

  // Video / Slides data
  const explainerSlides = useMemo(() => {
    if (Array.isArray(ai.slides) && ai.slides.length > 0) return ai.slides;
    return [
      {
        title: `${title}: Asosiy Mohiyat`,
        narration: `Ushbu dars orqali biz ${title}ning tirik tabiatdagi o'rni va asosiy tushunchalarini kashf etamiz.`,
        icon: '🔬',
        bg: 'from-indigo-600 to-blue-700',
        bullets: [
          'Mavzuning fanga kirib kelishi va ahamiyati',
          'Tirik organizmlardagi asosiy rollari',
          'Kundalik kuzatishlarda qayerda uchraydi'
        ]
      },
      {
        title: 'Tuzilishi va Ishlash Mexanizmi',
        narration: 'Har bir element o\'zining aniq vazifasiga ega bo\'lib, birgalikda mukammal tizimni hosil qiladi.',
        icon: '⚙️',
        bg: 'from-emerald-600 to-teal-700',
        bullets: [
          'Tarkibiy qismlarining o\'zaro uyg\'unligi',
          'Energiya almashinuvi va signallar uzatish',
          'Tashqi muhit omillarining ta\'siri'
        ]
      },
      {
        title: 'Tabiatdagi Qonuniyatlar',
        narration: 'Tabiatdagi hech bir narsa tasodif emas. Barcha qonunlar muvozanatni saqlashga xizmat qiladi.',
        icon: '🌱',
        bg: 'from-amber-600 to-orange-700',
        bullets: [
          'Ekotizim zanjirining uzilmas qismi',
          'Tiriklikning barqarorligini ta\'minlash',
          'Biologik xilma-xillikni asrash'
        ]
      },
      {
        title: 'Xulosa va Amaliy Bilim',
        narration: 'Endi siz ushbu mavzuni to\'liq bilib oldingiz va savollarga javob berishga tayyorsiz!',
        icon: '🏆',
        bg: 'from-purple-600 to-pink-700',
        bullets: [
          'Mavzuning eng asosiy xulosalari',
          'Test va jonli savol-javobga tayyorgarlik',
          'AI Avatar bilan mini-uchrashuvga start'
        ]
      }
    ];
  }, [ai, title]);

  // Stage 4 Quick Quiz Questions (2-3 questions)
  const quizQuestions = useMemo(() => {
    if (Array.isArray(ai.quizQuestions) && ai.quizQuestions.length > 0) {
      return ai.quizQuestions.slice(0, 3).map((q, i) => {
        const opts = (q.options || []).map(o => typeof o === 'string' ? o : o.text);
        const correctIdx = (q.options || []).findIndex(o => typeof o === 'object' ? o.isCorrect : false);
        return {
          id: `q_${i}`,
          question: q.text || q.question || `${title} bo'yicha to'g'ri javobni toping:`,
          options: opts.length >= 2 ? opts : ['Asosiy qonuniyat', 'Noto\'g\'ri ta\'rif', 'Qo\'shimcha variant', 'Hech biri'],
          correctIndex: correctIdx >= 0 ? correctIdx : 0,
          explanation: q.explanation || 'Barakalla, to\'g\'ri javob!'
        };
      });
    }
    return [
      {
        id: 'q_default_1',
        question: `Bugungi darsda "${title}" mavzusining asosiy maqsadi nima edi?`,
        options: [
          'Tirik tabiat qonuniyatlari va tuzilishini o\'rganish',
          'Faqat formulalarni yodlash',
          'Tabiatdan butunlay chetda qolish',
          'Javob mavjud emas'
        ],
        correctIndex: 0,
        explanation: 'Juda to\'g\'ri! Asosiy maqsad — tirik tabiat qonuniyatlarini chuqur tushunishdir.'
      },
      {
        id: 'q_default_2',
        question: 'Ushbu mavzu hayotda qayerda ko\'proq qo\'llaniladi?',
        options: [
          'Kundalik turmush, tabiatni asrash va zamonaviy tibbiyotda',
          'Hech qayerda qo\'llanilmaydi',
          'Faqat qadimgi kitoblarda',
          'Faqat kompyuter o\'yinlarida'
        ],
        correctIndex: 0,
        explanation: 'To\'ppa-to\'g\'ri! Biologiya bevosita bizning har kungi hayotimiz va salomatligimiz bilan bog\'liq.'
      }
    ];
  }, [ai, title]);

  // Cleanup speech synthesis on change or unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentStage]);

  // ========================================================
  const isReadingRef = useRef(false);

  // STAGE 1: READING & CONCEPT STORY CONTROLS
  // ========================================================
  const stopReading = () => {
    isReadingRef.current = false;
    setIsReading(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const startReading = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast('Matnni o\'zingiz o\'qib chiqishingiz mumkin', { icon: '📖' });
      return;
    }

    if (isReading) {
      stopReading();
      return;
    }

    isReadingRef.current = true;
    setIsReading(true);
    let sIdx = 0;

    const readNextSentence = () => {
      if (!isReadingRef.current) return;
      if (sIdx >= readingParagraphs.length) {
        isReadingRef.current = false;
        setIsReading(false);
        setCurrentReadingSentenceIdx(0);
        sounds.stageComplete();
        toast.success("Mavzu to'liq o'qib berildi! Keyingi bosqichga o'tilmoqda... 🚀");
        if (!submittedStagesRef.current.has('stage_1_reading')) {
          submittedStagesRef.current.add('stage_1_reading');
          sendStepSubmit('stage_1_reading', true, null, 1);
        }
        // Avtomatik 2-bosqichga (Qoidalar & Hayotiy qo'llanilishi) o'tish
        setTimeout(() => {
          setCurrentStage(2);
        }, 1200);
        return;
      }
      setCurrentReadingSentenceIdx(sIdx);
      speakText(readingParagraphs[sIdx], () => {
        if (!isReadingRef.current) return;
        sIdx++;
        readNextSentence();
      });
    };

    readNextSentence();
  };

  // Dars ochilganda 1-bosqichni avtomatik ovozli o'qish bilan boshlash
  useEffect(() => {
    if (currentStage === 1 && isOpen) {
      const timer = setTimeout(() => {
        if (!isReadingRef.current) {
          startReading();
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ========================================================
  // STAGE 2: CARDS EXPLORATION
  // ========================================================
  const exploreCard = (cardId) => {
    sounds.click();
    setActiveLifeTab(cardId);
    setExploredCards(prev => {
      const next = new Set(prev);
      next.add(cardId);
      if (next.size === lifeApplications.length) {
        sounds.stageComplete();
        toast.success("Barcha hayotiy sohalarni o'rganib chiqdingiz! 🌟");
        if (!submittedStagesRef.current.has('stage_2_rules_and_life')) {
          submittedStagesRef.current.add('stage_2_rules_and_life');
          sendStepSubmit('stage_2_rules_and_life', true, null, 2);
        }
      }
      return next;
    });
  };

  // ========================================================
  // STAGE 3: VIDEO / SLIDES
  // ========================================================
  const slidePlayingRef = useRef(false);

  const handlePlaySlideAudio = (idx) => {
    if (isSlidePlaying) {
      slidePlayingRef.current = false;
      window.speechSynthesis.cancel();
      setIsSlidePlaying(false);
      return;
    }
    const currentSlide = explainerSlides[idx];
    if (!currentSlide) return;

    slidePlayingRef.current = true;
    setIsSlidePlaying(true);
    speakText(currentSlide.narration, () => {
      if (!slidePlayingRef.current) return;
      setIsSlidePlaying(false);
      if (idx < explainerSlides.length - 1) {
        setSlideIdx(idx + 1);
        setTimeout(() => {
          handlePlaySlideAudio(idx + 1);
        }, 600);
      } else {
        if (!submittedStagesRef.current.has('stage_3_slides_video')) {
          submittedStagesRef.current.add('stage_3_slides_video');
          sendStepSubmit('stage_3_slides_video', true, null, 3);
        }
        sounds.stageComplete();
        toast.success("Video slaydlar yakunlandi! Endi sinov va meeting! 🚀");
        setTimeout(() => {
          setCurrentStage(4);
        }, 1200);
      }
    });
  };

  // 3-bosqichga kelganda video/slaydlarni avtomatik ijro etish
  useEffect(() => {
    if (currentStage === 3 && isOpen) {
      const timer = setTimeout(() => {
        handlePlaySlideAudio(0);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [currentStage, isOpen]);

  // ========================================================
  // STAGE 4: QUIZ CONTROLS
  // ========================================================
  const handleCheckQuizOption = (optionIdx) => {
    if (quizAnswerStatus !== 'idle') return;
    setSelectedQuizOption(optionIdx);
    const currQ = quizQuestions[quizQuestionIdx];
    const isCorrect = optionIdx === currQ.correctIndex;

    if (isCorrect) {
      correctAnswersCountRef.current += 1;
      sounds.correct();
      setQuizAnswerStatus('correct');
      setTotalEarnedXp(x => x + 15);
      toast.success("To'g'ri javob! +15 XP 🎯");
    } else {
      sounds.wrong();
      setQuizAnswerStatus('wrong');
      toast.error("Xato, qayta urinib ko'ring!");
    }

    sendStepSubmit('stage_4_quiz_question', isCorrect, null, 4);
  };

  const handleNextQuizQuestion = () => {
    sounds.click();
    setQuizAnswerStatus('idle');
    setSelectedQuizOption(null);

    if (quizQuestionIdx < quizQuestions.length - 1) {
      setQuizQuestionIdx(idx => idx + 1);
    } else {
      // Completed all questions -> Transition to live meeting & submit quiz results
      sounds.stageComplete();
      sendQuizFinish(correctAnswersCountRef.current, quizQuestions.length);
      setStage4Phase('meeting');
      toast.success("Barcha savollarga javob berildi! AI Avatar bilan jonli uchrashuv boshlanmoqda... 📹");
    }
  };

  // Stage Navigation
  const goToNextStage = () => {
    sounds.click();
    window.speechSynthesis?.cancel();
    setIsReading(false);
    setIsSlidePlaying(false);

    // Backend step submission on transitioning stages
    if (currentStage === 1 && !submittedStagesRef.current.has('stage_1_reading')) {
      submittedStagesRef.current.add('stage_1_reading');
      sendStepSubmit('stage_1_reading', true, null, 1);
    } else if (currentStage === 2 && !submittedStagesRef.current.has('stage_2_rules_and_life')) {
      submittedStagesRef.current.add('stage_2_rules_and_life');
      sendStepSubmit('stage_2_rules_and_life', true, null, 2);
    } else if (currentStage === 3 && !submittedStagesRef.current.has('stage_3_slides_video')) {
      submittedStagesRef.current.add('stage_3_slides_video');
      sendStepSubmit('stage_3_slides_video', true, null, 3);
    }

    if (currentStage < 4) {
      setCurrentStage(s => s + 1);
      setTotalEarnedXp(x => x + 10);
    }
  };

  const goToPrevStage = () => {
    sounds.click();
    window.speechSynthesis?.cancel();
    if (currentStage > 1) {
      setCurrentStage(s => s - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        className="w-full max-w-5xl bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[96vh]"
      >
        {/* ========================================================
            MODAL HEADER: 4-STAGE STEPPER & PROGRESS
            ======================================================== */}
        <header className="px-4 sm:px-6 py-3.5 bg-gray-50/80 dark:bg-[#131D31] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-orange-400 text-white flex items-center justify-center font-black shadow-md shadow-primary/20 flex-shrink-0">
              <Sparkles size={20} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {currentStage}-Bosqich
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                  {lesson.subject ? `${lesson.subject} • ` : ''}Darslik & AI Avatar
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white truncate">
                {title}
              </h2>
            </div>
          </div>

          {/* Stepper Progress Badges (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {[
              { num: 1, label: "1. O'qib berish", icon: BookOpen },
              { num: 2, label: "2. Qoidalar & Hayot", icon: Compass },
              { num: 3, label: "3. Video Slaydlar", icon: Clapperboard },
              { num: 4, label: "4. Test & Mini-Meeting", icon: Video },
            ].map(st => {
              const isActive = currentStage === st.num;
              const isPassed = currentStage > st.num;
              const Icon = st.icon;
              return (
                <div
                  key={st.num}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : isPassed
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}
                >
                  <Icon size={14} />
                  <span>{st.label}</span>
                  {isPassed && <Check size={12} className="stroke-[3]" />}
                </div>
              );
            })}
          </div>

          {/* Close & Sound Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSoundEnabled(s => !s);
                if (soundEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  setIsReading(false);
                  setIsSlidePlaying(false);
                }
              }}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              title={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              onClick={() => setShowExitConfirm(true)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-rose-500 hover:text-white text-gray-500 transition-colors"
              title="Darsdan chiqish"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-orange-400"
            animate={{ width: `${(currentStage / 4) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* ========================================================
            STAGE BODY (1 of 4)
            ======================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[420px]">
          {/* ========================================================
              STAGE 1: O'QIB BERISH VA TUSHUNTIRISH (AI Avatar Reading)
              ======================================================== */}
          {currentStage === 1 && (
            <motion.div
              key="stage1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              {/* Top Banner: AI Avatar with Book & Speech Bubble */}
              <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-primary/10 border border-orange-200/40 dark:border-orange-500/20 flex flex-col sm:flex-row items-center gap-5">
                {/* Animated AI Avatar holding book */}
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-primary to-amber-500 p-1 shadow-lg shadow-primary/20">
                    <div className="w-full h-full rounded-2xl bg-gray-900 flex items-center justify-center overflow-hidden relative">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle cx="50" cy="46" r="38" fill="#FDE047" />
                        <rect x="24" y="36" width="20" height="15" rx="5" fill="#1E293B" stroke="#0284C7" strokeWidth="2" />
                        <rect x="56" y="36" width="20" height="15" rx="5" fill="#1E293B" stroke="#0284C7" strokeWidth="2" />
                        <line x1="44" y1="43" x2="56" y2="43" stroke="#0284C7" strokeWidth="2" />
                        <circle cx="34" cy="43" r="3.5" fill="#FFFFFF" />
                        <circle cx="66" cy="43" r="3.5" fill="#FFFFFF" />
                        {isReading ? (
                          <ellipse cx="50" cy="62" rx="7" ry="5" fill="#881337">
                            <animate attributeName="ry" values="2;6;3;7;2" dur="0.25s" repeatCount="indefinite" />
                          </ellipse>
                        ) : (
                          <path d="M40 60 Q50 70 60 60" fill="none" stroke="#881337" strokeWidth="3" strokeLinecap="round" />
                        )}
                        {/* Book in hands */}
                        <path d="M26 78 Q50 70 74 78 L74 94 Q50 86 26 94 Z" fill="#3B82F6" />
                        <line x1="50" y1="74" x2="50" y2="90" stroke="#FFFFFF" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </div>
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-black uppercase shadow-sm">
                    AI O'qituvchi
                  </span>
                </div>

                {/* Speech Bubble / Story Prompt */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
                    <Sparkles size={13} />
                    <span>1-bosqich: O'qib berish va Tushuntirish</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
                    AI Avatar siz bilan birga darslikni o'rganadi!
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    Quyidagi tugmani bosing, avatarcha mavzuni sodda va tushunarli ohangda o'qib beradi hamda qiziqarli o'xshatishlar bilan izohlaydi.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
                    <button
                      onClick={startReading}
                      className="btn-primary py-2.5 px-5 rounded-2xl flex items-center gap-2 font-bold text-xs sm:text-sm shadow-md shadow-primary/20"
                    >
                      {isReading ? <Pause size={16} /> : <Play size={16} />}
                      <span>{isReading ? "O'qishni to'xtatish" : "Ovozli o'qib berish"}</span>
                    </button>
                    {isReading && (
                      <span className="text-xs font-semibold text-primary animate-pulse flex items-center gap-1">
                        <Volume2 size={14} /> AI O'qimoqda...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Darslik Sahifasi (Digital Book Reading View) */}
              <div className="p-5 sm:p-7 rounded-3xl bg-amber-50/40 dark:bg-[#162032] border border-amber-200/60 dark:border-gray-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200/50 dark:border-gray-700/60 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <BookOpen size={16} />
                    <span>Darslik Sahifasi: {title}</span>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">
                    {readingParagraphs.length} ta jumla
                  </span>
                </div>

                {/* Sentences with reading highlight */}
                <div className="space-y-2.5 text-sm sm:text-base leading-relaxed font-serif text-gray-800 dark:text-gray-200">
                  {readingParagraphs.map((sentence, idx) => {
                    const isHighlighted = isReading && currentReadingSentenceIdx === idx;
                    return (
                      <p
                        key={idx}
                        className={`transition-all duration-300 p-2 rounded-xl ${
                          isHighlighted
                            ? 'bg-primary/15 text-primary font-semibold ring-1 ring-primary/30'
                            : 'hover:bg-amber-100/40 dark:hover:bg-gray-800/40'
                        }`}
                      >
                        {sentence}
                      </p>
                    );
                  })}
                </div>
              </div>

              {/* Analogy & Metaphor Callout Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wide">
                    💡 O'xshatish va Hayotiy Tasavvur:
                  </h4>
                  <p className="text-xs sm:text-sm text-indigo-800 dark:text-indigo-300 mt-1 leading-relaxed">
                    {analogyText}
                  </p>
                </div>
              </div>

              {/* Bottom Proceed Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={goToNextStage}
                  className="btn-primary py-3 px-6 rounded-2xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-primary/25"
                >
                  <span>2-Bosqich: Qoidalar & Hayotda qo'llanilishi</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================
              STAGE 2: QOIDALAR VA HAYOTDA QO'LLANILISHI (Rules & Real Life)
              ======================================================== */}
          {currentStage === 2 && (
            <motion.div
              key="stage2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              {/* Header Box */}
              <div className="text-center max-w-xl mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold mb-2">
                  <Compass size={13} />
                  <span>2-bosqich: Qoidalar va Hayotda qo'llanilishi</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                  Bu qoidalarni hayotda qayerda ko'ramiz?
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Har bir kartani bosing va ushbu bilim qayerlarda ishlatilishini bilib oling!
                </p>
              </div>

              {/* Key Rule / Formula Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-primary/15 border-2 border-amber-300/60 dark:border-amber-600/30 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md flex-shrink-0">
                  <Award size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Oltin Qoida & Asosiy Formula
                  </span>
                  <p className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white mt-0.5">
                    {keyRule}
                  </p>
                </div>
              </div>

              {/* Interactive 3 Real-Life Category Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lifeApplications.map(card => {
                  const isExplored = exploredCards.has(card.id);
                  const isSelected = activeLifeTab === card.id;

                  return (
                    <motion.div
                      key={card.id}
                      onClick={() => exploreCard(card.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-5 rounded-3xl cursor-pointer border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white dark:bg-gray-800 border-primary shadow-xl ring-2 ring-primary/20'
                          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {/* Explored Check badge */}
                      {isExplored && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
                          <Check size={14} className="stroke-[3]" />
                        </div>
                      )}

                      <div>
                        <div className="text-3xl mb-3">{card.icon}</div>
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {card.badge}
                        </span>
                        <h4 className="font-extrabold text-base text-gray-900 dark:text-white mt-2">
                          {card.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                          {card.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-[11px] font-medium text-primary">
                        {card.example}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Exploration Progress Badge */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs">
                <span className="font-semibold text-gray-600 dark:text-gray-300">
                  O'rganish darajasi: {exploredCards.size} / {lifeApplications.length} ta soha ko'rildi
                </span>
                <span className="font-bold text-emerald-500">
                  {exploredCards.size === lifeApplications.length ? "✓ Tayyorsiz!" : "Kartalarni bosing"}
                </span>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={goToPrevStage}
                  className="btn-ghost py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5"
                >
                  <ChevronLeft size={16} />
                  <span>1-bosqichga qaytish</span>
                </button>

                <button
                  onClick={goToNextStage}
                  className="btn-primary py-3 px-6 rounded-2xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-primary/25"
                >
                  <span>3-Bosqich: Video Dars (Slaydlar)</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================
              STAGE 3: VIDEO DARS (Explainer Video / Slaydlar)
              ======================================================== */}
          {currentStage === 3 && (
            <motion.div
              key="stage3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold mb-1">
                    <Clapperboard size={13} />
                    <span>3-bosqich: Video Dars & Illyustratsiyalar</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                    Ko'rgazmali Slaydlar va Audio Tushuntirish
                  </h3>
                </div>

                {/* Slide indicator dots */}
                <div className="flex items-center gap-2">
                  {explainerSlides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlideIdx(i)}
                      className={`h-2 rounded-full transition-all ${
                        i === slideIdx
                          ? 'w-6 bg-primary'
                          : 'w-2 bg-gray-300 dark:bg-gray-700'
                      }`}
                      title={`Slayd ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Main Explainer Video Screen Tile */}
              {(() => {
                const currentSlide = explainerSlides[slideIdx] || explainerSlides[0];
                return (
                  <div className="rounded-3xl bg-gradient-to-br from-gray-900 via-slate-900 to-black border-2 border-gray-800 shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden min-h-[320px] flex flex-col justify-between">
                    {/* Background visual glow */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Top slide bar */}
                    <div className="flex items-center justify-between z-10">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                        <span className="text-2xl">{currentSlide.icon || '🔬'}</span>
                        <span>Slayd {slideIdx + 1} / {explainerSlides.length}</span>
                      </div>

                      <button
                        onClick={() => handlePlaySlideAudio(slideIdx)}
                        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all"
                      >
                        {isSlidePlaying ? <Pause size={14} /> : <Play size={14} />}
                        <span>{isSlidePlaying ? "To'xtatish" : "Audio Tushuntirish"}</span>
                      </button>
                    </div>

                    {/* Main Slide Content */}
                    <div className="my-6 z-10 space-y-4">
                      <h4 className="text-2xl sm:text-3xl font-black text-white">
                        {currentSlide.title}
                      </h4>
                      <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-medium">
                        "{currentSlide.narration}"
                      </p>

                      {/* Bullet points */}
                      {currentSlide.bullets?.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                          {currentSlide.bullets.map((b, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-200 flex items-center gap-2"
                            >
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                              <span>{b}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Slide Navigation Controls */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10 z-10">
                      <button
                        onClick={() => setSlideIdx(Math.max(0, slideIdx - 1))}
                        disabled={slideIdx === 0}
                        className="btn-ghost py-2 px-3 text-xs text-gray-300 disabled:opacity-30 flex items-center gap-1"
                      >
                        <ChevronLeft size={16} /> Oldingi Slayd
                      </button>

                      <button
                        onClick={() => {
                          if (slideIdx < explainerSlides.length - 1) {
                            setSlideIdx(s => s + 1);
                          } else {
                            goToNextStage();
                          }
                        }}
                        className="btn-primary py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                      >
                        <span>{slideIdx < explainerSlides.length - 1 ? "Keyingi Slayd" : "4-Bosqichga o'tish"}</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={goToPrevStage}
                  className="btn-ghost py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5"
                >
                  <ChevronLeft size={16} />
                  <span>2-bosqichga qaytish</span>
                </button>

                <button
                  onClick={goToNextStage}
                  className="btn-primary py-3 px-6 rounded-2xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-primary/25"
                >
                  <span>4-Bosqich: Test & AI Mini-Meeting</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================
              STAGE 4: TEST & AI AVATAR BILAN MINI-MEETING
              ======================================================== */}
          {currentStage === 4 && (
            <motion.div
              key="stage4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              {stage4Phase === 'quiz' ? (
                /* PART A: 2-3 TA TEZKOR INTERAKTIV SAVOLLAR */
                <div className="space-y-6">
                  <div className="text-center max-w-xl mx-auto">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-xs font-bold mb-2">
                      <HelpCircle size={13} />
                      <span>4-bosqich: Tezkor Sinov ({quizQuestionIdx + 1}/{quizQuestions.length})</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                      O'rganganlaringizni tekshiring!
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Ushbu 2-3 ta savoldan so'ng AI Avatar bilan jonli mini-meeting boshlanadi.
                    </p>
                  </div>

                  {/* Question Box */}
                  {(() => {
                    const currentQ = quizQuestions[quizQuestionIdx] || quizQuestions[0];
                    return (
                      <div className="p-6 sm:p-8 rounded-3xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                          <span>Savol {quizQuestionIdx + 1} / {quizQuestions.length}</span>
                          <span className="text-amber-500">+15 XP</span>
                        </div>

                        <h4 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white leading-relaxed">
                          {currentQ.question}
                        </h4>

                        {/* Options */}
                        <div className="space-y-3">
                          {currentQ.options.map((opt, oIdx) => {
                            const isSelected = selectedQuizOption === oIdx;
                            const isCorrect = oIdx === currentQ.correctIndex;
                            let btnStyle = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary/50 text-gray-800 dark:text-gray-200';

                            if (quizAnswerStatus !== 'idle') {
                              if (isCorrect) {
                                btnStyle = 'bg-emerald-500 text-white border-emerald-600 shadow-md';
                              } else if (isSelected && !isCorrect) {
                                btnStyle = 'bg-rose-500 text-white border-rose-600';
                              }
                            }

                            return (
                              <button
                                key={oIdx}
                                onClick={() => handleCheckQuizOption(oIdx)}
                                disabled={quizAnswerStatus !== 'idle'}
                                className={`w-full p-4 rounded-2xl border-2 text-left text-xs sm:text-sm font-semibold transition-all flex items-center justify-between ${btnStyle}`}
                              >
                                <span>{opt}</span>
                                {quizAnswerStatus !== 'idle' && isCorrect && (
                                  <CheckCircle2 size={18} className="text-white" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Feedback & Continue */}
                        {quizAnswerStatus !== 'idle' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {currentQ.explanation}
                            </div>
                            <button
                              onClick={handleNextQuizQuestion}
                              className="btn-primary py-2.5 px-6 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-primary/25"
                            >
                              <span>{quizQuestionIdx < quizQuestions.length - 1 ? "Keyingi Savol" : "Mini-Meetingga o'tish"}</span>
                              <ChevronRight size={16} />
                            </button>
                          </motion.div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* PART B: AVATAR MINI-MEETING (Zoom / Meet Style) */
                <div className="rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
                  <AvatarMiniMeeting
                    lesson={lesson}
                    studentUser={studentUser}
                    earnedXp={totalEarnedXp + 50}
                    earnedCoins={10}
                    onFinish={handleMeetingFinish}
                    onClose={onClose}
                  />
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* EXIT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-sm w-full p-6 text-center space-y-4 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center font-bold">
                ⚠️
              </div>
              <div>
                <h4 className="font-extrabold text-base text-gray-900 dark:text-white">
                  Darsni tark etmoqchimisiz?
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Siz allaqachon {currentStage}-bosqichdasiz. Hozir chiqsangiz, ushbu sessiya ballari saqlanmasligi mumkin.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 btn-primary py-2.5 rounded-xl text-xs font-bold"
                >
                  Davom etish
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    onClose();
                  }}
                  className="btn-ghost py-2.5 px-3 rounded-xl text-xs text-rose-500 hover:bg-rose-50"
                >
                  Chiqish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
