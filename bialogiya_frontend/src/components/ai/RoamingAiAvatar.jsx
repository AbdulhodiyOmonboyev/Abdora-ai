import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Volume2, VolumeX, Compass, X, Send, ChevronRight,
  Move, Moon, Bot, Mic, MicOff, BookOpen, HelpCircle, CheckCircle2, RotateCcw
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../config/axios';
import { resolveMediaUrl, hasStudentCreatedAvatar, isStudentAvatarEnabled } from '../../utils/format';
import MiniWalkingAvatar3D from './MiniWalkingAvatar3D';

function playAvatarPop(pitch = 540) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    gain.gain.setValueAtTime(0.11, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  } catch {
    // AudioContext requires prior user gesture
  }
}

function speakUzbekFallback(text, onStart, onEnd) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uz-UZ';
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    onStart?.();
    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd?.();
  }
}

function getSavedAvatarConfig(user) {
  let localConfig = null;
  let localName = '';
  let localProfession = '';
  try {
    const rawCfg = localStorage.getItem('abdoraAvatarConfig');
    localConfig = rawCfg ? JSON.parse(rawCfg) : null;
    localName = localStorage.getItem('avatarName') || '';
    localProfession = localStorage.getItem('avatarProfession') || '';
  } catch {
    // ignore storage errors
  }

  const profile = user?.permissions?.avatarProfile || {};
  const profileCfg = profile?.config && typeof profile.config === 'object' ? profile.config : {};
  const merged = { ...(localConfig || {}), ...profileCfg, ...profile };

  const avatarName =
    profile.name ||
    merged.name ||
    localName ||
    'Mening Avatarim';

  const avatarProfession =
    profile.profession ||
    merged.profession ||
    localProfession ||
    "O'quv do'sti";

  return {
    config: merged,
    avatarName,
    avatarProfession,
  };
}

export default function RoamingAiAvatar() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: serverSettings } = useQuery({
    queryKey: ['center-settings', user?.centerId || user?.id],
    queryFn: () => api.get('/admin/settings').then((r) => r.data?.data || {}),
    enabled: Boolean(user) && String(user.role || '').toLowerCase() === 'student',
    staleTime: 30 * 1000,
  });

  const isEligibleStudent =
    isStudentAvatarEnabled(user, serverSettings) &&
    hasStudentCreatedAvatar(user, serverSettings);

  const { config: avatarConfig, avatarName, avatarProfession } = useMemo(
    () => getSavedAvatarConfig(user),
    [user]
  );

  const resolvedAvatarUrl = useMemo(() => resolveMediaUrl(user?.avatar), [user?.avatar]);
  const badgeLabel = avatarProfession ? `${avatarName} • ${avatarProfession}` : avatarName;

  // Fetch student's completed lessons context from backend so avatar ONLY knows studied lessons
  const { data: lessonContext } = useQuery({
    queryKey: ['avatar-lesson-context', user?.id, location.pathname, user?.xp],
    queryFn: () => api.get('/ai/avatar-context').then((r) => r.data?.data || null).catch(() => null),
    enabled: isEligibleStudent,
    staleTime: 15000,
  });

  const rawCompletedLessons = lessonContext?.completedLessons;
  const completedCount = lessonContext?.completedCount ?? 0;
  const completedLessons = useMemo(
    () => (Array.isArray(rawCompletedLessons) ? rawCompletedLessons : []),
    [rawCompletedLessons]
  );
  const nextLesson = lessonContext?.nextLesson || null;

  const [isRoaming, setIsRoaming] = useState(() => {
    try {
      const saved = localStorage.getItem('abdora_ai_roaming');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [speechBubble, setSpeechBubble] = useState(null);
  const [bubbleIsQuizOffer, setBubbleIsQuizOffer] = useState(false);

  // Walking physics state
  const [isWalking, setIsWalking] = useState(false);
  const [walkDuration, setWalkDuration] = useState(3.2);
  const [walkVector, setWalkVector] = useState({ dx: -1, dy: 0 });
  const [position, setPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      return {
        x: Math.max(40, window.innerWidth - 185),
        y: Math.max(120, window.innerHeight - 230),
      };
    }
    return { x: 300, y: 380 };
  });

  // Voice & Mutual Q&A state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatReply, setChatReply] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [lastEvalCorrect, setLastEvalCorrect] = useState(null);
  const [celebrateSignal, setCelebrateSignal] = useState(0);

  const posRef = useRef(position);
  useEffect(() => {
    posRef.current = position;
  }, [position]);
  const walkStopTimerRef = useRef(null);
  const nextWalkTimerRef = useRef(null);
  const bubbleTimerRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const recognitionRef = useRef(null);
  const stepCounterRef = useRef(0);

  const stopCurrentAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = '';
      } catch {}
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      try {
        URL.revokeObjectURL(audioUrlRef.current);
      } catch {}
      audioUrlRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCurrentAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
      if (nextWalkTimerRef.current) clearTimeout(nextWalkTimerRef.current);
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    };
  }, [stopCurrentAudio]);

  const toggleRoaming = () => {
    setIsRoaming((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('abdora_ai_roaming', String(next));
      } catch {}
      if (!next) {
        setIsWalking(false);
        if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
        if (nextWalkTimerRef.current) clearTimeout(nextWalkTimerRef.current);
      }
      return next;
    });
  };

  const toggleVoice = () => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      if (!next) stopCurrentAudio();
      return next;
    });
  };

  const avatarGender = avatarConfig?.gender;

  const speakText = useCallback(
    async (text) => {
      if (!voiceEnabled || !text) return;
      stopCurrentAudio();

      try {
        const res = await api.post(
          '/ai/avatar-tts',
          { text, gender: avatarGender },
          { responseType: 'blob' }
        );

        const blob = res.data;
        if (!blob || blob.size === 0) {
          throw new Error('Fallback to Web Speech');
        }

        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          if (audioUrlRef.current === url) {
            URL.revokeObjectURL(url);
            audioUrlRef.current = null;
          }
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          if (audioUrlRef.current === url) {
            URL.revokeObjectURL(url);
            audioUrlRef.current = null;
          }
          speakUzbekFallback(text, () => setIsSpeaking(true), () => setIsSpeaking(false));
        };

        setIsSpeaking(true);
        await audio.play();
      } catch {
        speakUzbekFallback(text, () => setIsSpeaking(true), () => setIsSpeaking(false));
      }
    },
    [voiceEnabled, avatarGender, stopCurrentAudio]
  );

  const showBubble = useCallback((text, duration = 7500, isQuizPrompt = false) => {
    setSpeechBubble(text);
    setBubbleIsQuizOffer(isQuizPrompt);
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => {
      setSpeechBubble((curr) => (curr === text ? null : curr));
    }, duration);
  }, []);

  const triggerLessonAwarePrompt = useCallback(
    (shouldSpeak = false) => {
      if (completedCount > 0 && completedLessons.length > 0) {
        const randomLesson = completedLessons[Math.floor(Math.random() * completedLessons.length)];
        const prompts = [
          `Biz «${randomLesson.title}» darsini o'tganmiz! Keling, shu mavzuda savol-javob qilamizmi? 🎯`,
          `«${randomLesson.title}» mavzusidan sizga bitta qiziqarli savolim bor! Sinab ko'ramizmi? 🧠`,
          `O'tilgan ${completedCount} ta dars bo'yicha xohlasangiz siz savol bering, xohlasangiz men so'rayman! ✨`,
        ];
        const chosen = prompts[Math.floor(Math.random() * prompts.length)];
        showBubble(chosen, 8500, true);
        if (shouldSpeak && voiceEnabled) speakText(chosen);
      } else {
        const nextTitle = nextLesson?.title ? `«${nextLesson.title}»` : 'birinchi';
        const msg = `Men faqat siz o'tgan darslarni bilaman! «Darslar» bo'limidan ${nextTitle} darsni tugating, keyin savol-javob qilamiz! 📚`;
        showBubble(msg, 7500, false);
        if (shouldSpeak && voiceEnabled) speakText(msg);
      }
    },
    [completedCount, completedLessons, nextLesson, showBubble, voiceEnabled, speakText]
  );

  // Pick a natural walking destination inside the browser window
  const pickNextWalkDestination = useCallback((curr) => {
    if (typeof window === 'undefined') return { x: 240, y: 320 };
    const minX = 36;
    const maxX = Math.max(120, window.innerWidth - 155);
    const minY = 86;
    const maxY = Math.max(180, window.innerHeight - 205);

    for (let attempt = 0; attempt < 6; attempt++) {
      const x = Math.round(minX + Math.random() * (maxX - minX));
      const y = Math.round(minY + Math.random() * (maxY - minY));
      const dist = Math.hypot(x - curr.x, y - curr.y);
      if (dist >= 140 && dist <= 520) {
        return { x, y };
      }
    }
    return {
      x: Math.round(minX + Math.random() * (maxX - minX)),
      y: Math.round(minY + Math.random() * (maxY - minY)),
    };
  }, []);

  // Walk smoothly at constant human-like speed across the window
  const walkToSpot = useCallback(
    (customDest = null) => {
      if (isMinimized || isOpenMenu || isThinking || isListening) return;

      const curr = posRef.current;
      const dest = customDest || pickNextWalkDestination(curr);
      const dx = dest.x - curr.x;
      const dy = dest.y - curr.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const speedPxPerSec = 82; // steady walking pace
      const durationSec = Math.min(6.8, Math.max(2.0, dist / speedPxPerSec));

      setWalkVector({ dx: dx / dist, dy: dy / dist });
      setWalkDuration(durationSec);
      setIsWalking(true);
      setPosition(dest);

      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
      walkStopTimerRef.current = setTimeout(() => {
        setIsWalking(false);
        stepCounterRef.current += 1;
        if (stepCounterRef.current % 3 === 0 && !isOpenMenu && !isSpeaking) {
          triggerLessonAwarePrompt(false);
        }
      }, durationSec * 1000);

      return durationSec;
    },
    [isMinimized, isOpenMenu, isThinking, isListening, isSpeaking, pickNextWalkDestination, triggerLessonAwarePrompt]
  );

  // Continuous autonomous strolling loop around the window
  useEffect(() => {
    if (!isEligibleStudent || !isRoaming || isMinimized || isOpenMenu || isSpeaking || isListening || isThinking) {
      setIsWalking(false);
      return;
    }

    let cancelled = false;
    const scheduleWalkCycle = (initialDelayMs) => {
      nextWalkTimerRef.current = setTimeout(() => {
        if (cancelled) return;
        const durSec = walkToSpot() || 3.2;
        const restMs = 4500 + Math.random() * 3800; // pause 4.5s - 8.3s, then walk again
        scheduleWalkCycle(durSec * 1000 + restMs);
      }, initialDelayMs);
    };

    scheduleWalkCycle(2200);

    return () => {
      cancelled = true;
      if (nextWalkTimerRef.current) clearTimeout(nextWalkTimerRef.current);
      if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
    };
  }, [isEligibleStudent, isRoaming, isMinimized, isOpenMenu, isSpeaking, isListening, isThinking, walkToSpot]);

  // Keep avatar inside viewport on window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => {
      setPosition((prev) => ({
        x: Math.min(Math.max(30, prev.x), Math.max(80, window.innerWidth - 155)),
        y: Math.min(Math.max(80, prev.y), Math.max(150, window.innerHeight - 205)),
      }));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Ask Avatar to quiz the student from completed lessons (Avatar -> Student Q&A)
  const handleRequestAvatarQuestion = useCallback(
    async (specificLessonId = null) => {
      if (isThinking) return;
      setIsWalking(false);
      setIsThinking(true);
      setLastEvalCorrect(null);
      setSpeechBubble(null);

      try {
        const res = await api.post('/ai/avatar-chat', {
          mode: 'ask_student',
          lessonId: specificLessonId,
          history: chatHistory.slice(-8),
          avatarName,
          avatarProfession,
        });

        const payload = res.data?.data || {};
        const questionReply = payload.reply || "Keling, o'tilgan darslardan savol-javob qilamiz!";
        setActiveQuiz(payload.activeQuiz || null);
        setChatReply(questionReply);
        setChatHistory((prev) => [...prev.slice(-8), { role: 'assistant', content: questionReply }]);
        showBubble(questionReply, 11000, false);

        if (voiceEnabled) {
          speakText(questionReply);
        }
      } catch {
        const errMsg = "Savol tayyorlashda kichik uzilish bo'ldi. Yana bir bor bosing!";
        setChatReply(errMsg);
        showBubble(errMsg, 5000, false);
      } finally {
        setIsThinking(false);
      }
    },
    [isThinking, chatHistory, avatarName, avatarProfession, voiceEnabled, showBubble, speakText]
  );

  // Student answers Avatar's question OR Student asks Avatar a question
  const handleSendMessage = useCallback(
    async (overrideText = null) => {
      const q = (typeof overrideText === 'string' ? overrideText : chatInput).trim();
      if (!q || isThinking) return;

      setIsWalking(false);
      setIsThinking(true);
      setChatReply('');
      if (typeof overrideText !== 'string') {
        setChatInput('');
      }

      const wasCheckingQuiz = Boolean(activeQuiz?.question);
      const nextHistory = [...chatHistory.slice(-8), { role: 'user', content: q }];

      try {
        const res = await api.post('/ai/avatar-chat', {
          mode: wasCheckingQuiz ? 'check_answer' : 'chat',
          message: q,
          activeQuiz: wasCheckingQuiz ? activeQuiz : null,
          history: chatHistory.slice(-8),
          avatarName,
          avatarProfession,
        });

        const payload = res.data?.data || {};
        const reply =
          payload.reply ||
          res.data?.reply ||
          "Javobingiz qabul qilindi! Keling, o'tilgan darslarimiz bo'yicha davom etamiz.";

        if (wasCheckingQuiz) {
          setActiveQuiz(null);
          setLastEvalCorrect(typeof payload.isCorrect === 'boolean' ? payload.isCorrect : null);
          if (payload.isCorrect) {
            playAvatarPop(780);
            setCelebrateSignal((c) => c + 1);
          }
        } else {
          setLastEvalCorrect(null);
        }

        setChatReply(reply);
        setChatHistory([...nextHistory, { role: 'assistant', content: reply }]);
        showBubble(reply, 9000, false);

        if (voiceEnabled) {
          speakText(reply);
        }
      } catch {
        const fallbackReply = "Aloqa uzildi, iltimos qayta yozib yoki gapirib ko'ring!";
        setChatReply(fallbackReply);
        showBubble(fallbackReply, 5000, false);
      } finally {
        setIsThinking(false);
      }
    },
    [chatInput, isThinking, activeQuiz, chatHistory, avatarName, avatarProfession, voiceEnabled, showBubble, speakText]
  );

  // Uzbek SpeechRecognition (uz-UZ)
  const handleVoiceListen = useCallback(() => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      const msg = "Brauzeringiz ovozli kiritishni qo'llab-quvvatlamaydi. Matn orqali yozing!";
      setChatReply(msg);
      showBubble(msg, 5000, false);
      return;
    }

    try {
      stopCurrentAudio();
      setIsWalking(false);
      const recognition = new SpeechRecognition();
      recognition.lang = 'uz-UZ';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        playAvatarPop(700);
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim();
        setIsListening(false);
        if (transcript) {
          setChatInput(transcript);
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }, [isListening, stopCurrentAudio, showBubble, handleSendMessage]);

  // 3D AI Avatar ONLY renders for students who have created their avatar
  if (!isEligibleStudent) {
    return null;
  }

  if (isMinimized) {
    return (
      <motion.button
        onClick={() => {
          setIsMinimized(false);
          playAvatarPop(580);
          triggerLessonAwarePrompt(false);
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/90 text-white border-2 border-emerald-500 shadow-xl flex items-center gap-2 backdrop-blur-md cursor-pointer"
        title="3D AI Avatarni uyg'otish"
      >
        {resolvedAvatarUrl ? (
          <img
            src={resolvedAvatarUrl}
            alt={avatarName}
            className="w-9 h-9 object-contain drop-shadow-[0_4px_8px_rgba(16,185,129,0.45)]"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-sm font-bold">
            3D
          </div>
        )}
        <div className="text-left pr-1 hidden sm:block">
          <div className="text-[11px] font-black text-emerald-400 flex items-center gap-1">
            <span className="truncate max-w-[110px]">{avatarName}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-[10px] text-slate-300">Uyg'otish ✨</div>
        </div>
      </motion.button>
    );
  }

  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const isBubbleNearRight = position.x > viewportW - 250;
  const isBubbleNearLeft = position.x < 185;
  const isBubbleNearTop = position.y < 175;
  const isMenuNearRight = position.x > viewportW - 320;
  const isMenuNearLeft = position.x < 230;
  const isMenuNearTop = position.y < viewportH * 0.48;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden select-none">
      <motion.div
        drag
        dragMomentum={false}
        animate={{
          x: position.x,
          y: position.y,
        }}
        transition={
          isWalking
            ? { duration: walkDuration, ease: 'linear' }
            : { type: 'spring', damping: 24, stiffness: 180 }
        }
        onDragStart={() => {
          setIsWalking(false);
          if (walkStopTimerRef.current) clearTimeout(walkStopTimerRef.current);
        }}
        onDragEnd={(_, info) => {
          setPosition((prev) => ({
            x: Math.min(Math.max(30, prev.x + info.offset.x), window.innerWidth - 145),
            y: Math.min(Math.max(75, prev.y + info.offset.y), window.innerHeight - 195),
          }));
        }}
        className="absolute top-0 left-0 pointer-events-auto flex flex-col items-center cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        {/* ── 1. SPEECH BUBBLE ── */}
        <AnimatePresence>
          {speechBubble && !isOpenMenu && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.88 }}
              transition={{ duration: 0.22 }}
              className={`absolute z-30 w-[235px] sm:w-[270px] max-w-[calc(100vw-24px)] ${
                isBubbleNearTop ? 'top-full mt-2' : 'bottom-full mb-2'
              } ${
                isBubbleNearRight
                  ? 'right-0'
                  : isBubbleNearLeft
                  ? 'left-0'
                  : 'left-1/2 -translate-x-1/2'
              }`}
            >
              <div
                className="px-3.5 py-2.5 rounded-2xl shadow-xl text-xs font-bold relative text-left leading-snug backdrop-blur-md"
                style={{
                  background: 'var(--card, #ffffff)',
                  border: '2px solid #10b981',
                  color: 'var(--text-primary, #0f172a)',
                  boxShadow: '0 12px 30px -5px rgba(16, 185, 129, 0.35)',
                }}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate">
                    <Sparkles size={11} className="text-amber-500 fill-amber-500 shrink-0" />
                    <span className="truncate">{avatarName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSpeechBubble(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs p-0.5 leading-none shrink-0"
                  >
                    ×
                  </button>
                </div>

                <p className="text-[11px] font-semibold line-clamp-5">{speechBubble}</p>

                {bubbleIsQuizOffer && completedCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpenMenu(true);
                      handleRequestAvatarQuestion();
                    }}
                    className="mt-2 w-full py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-extrabold hover:opacity-95 transition-opacity flex items-center justify-center gap-1"
                  >
                    <HelpCircle size={12} /> Savol ber, javob beraman! 🎯
                  </button>
                )}

                {completedCount === 0 && location.pathname !== '/student/lessons' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSpeechBubble(null);
                      navigate('/student/lessons');
                    }}
                    className="mt-2 w-full py-1.5 px-2.5 rounded-xl bg-primary text-white text-[10px] font-extrabold hover:opacity-95 transition-opacity flex items-center justify-center gap-1"
                  >
                    <BookOpen size={12} /> 1-darsni boshlash 📚
                  </button>
                )}

                <div
                  className={`absolute w-3 h-3 rotate-45 ${
                    isBubbleNearTop ? '-top-1.5' : '-bottom-1.5'
                  } ${
                    isBubbleNearRight
                      ? 'right-7'
                      : isBubbleNearLeft
                      ? 'left-7'
                      : 'left-1/2 -translate-x-1/2'
                  }`}
                  style={{
                    background: 'var(--card, #ffffff)',
                    ...(isBubbleNearTop
                      ? { borderLeft: '2px solid #10b981', borderTop: '2px solid #10b981' }
                      : { borderRight: '2px solid #10b981', borderBottom: '2px solid #10b981' }),
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 2. REAL 3D WALKING CHARACTER ── */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            playAvatarPop(620);
            setIsWalking(false);
            setSpeechBubble(null);
            setIsOpenMenu((prev) => !prev);
          }}
          className="relative flex flex-col items-center group"
        >
          <div className="relative transition-transform group-hover:scale-105 active:scale-95">
            <MiniWalkingAvatar3D
              config={avatarConfig}
              fallbackImageUrl={resolvedAvatarUrl}
              avatarName={avatarName}
              isWalking={isWalking}
              walkDirX={walkVector.dx}
              walkDirY={walkVector.dy}
              isSpeaking={isSpeaking}
              isListening={isListening}
              celebrateSignal={celebrateSignal}
            />

            {/* Status dot */}
            <div
              className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                isListening
                  ? 'bg-rose-500 animate-ping'
                  : isSpeaking
                  ? 'bg-sky-400 animate-pulse'
                  : activeQuiz
                  ? 'bg-amber-400 animate-bounce'
                  : 'bg-emerald-400'
              }`}
            />
          </div>

          {/* Ground shadow */}
          <motion.div
            animate={{
              scale: isWalking ? [0.85, 1.15, 0.85] : [1, 0.9, 1],
              opacity: isWalking ? [0.38, 0.2, 0.38] : [0.32, 0.22, 0.32],
            }}
            transition={{
              repeat: Infinity,
              duration: isWalking ? 0.65 : 2.4,
              ease: 'easeInOut',
            }}
            className="w-14 h-2.5 rounded-full bg-black/40 blur-xs -mt-2 pointer-events-none"
          />

          {/* Name & state badge */}
          <div className="mt-1 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black tracking-wide bg-slate-900/85 text-white backdrop-blur-md border border-white/20 shadow-md flex items-center gap-1.5 max-w-[185px]">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isListening
                  ? 'bg-rose-400 animate-ping'
                  : isSpeaking
                  ? 'bg-sky-400 animate-ping'
                  : activeQuiz
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span className="truncate">
              {isListening
                ? 'Tinglayapman... 🎙️'
                : isSpeaking
                ? 'Gapiryapman 🔊'
                : activeQuiz
                ? 'Javobingizni kutyapman 🎯'
                : isWalking
                ? `${avatarName} • Yurmoqda 🚶`
                : badgeLabel}
            </span>
          </div>
        </div>

        {/* ── 3. MUTUAL Q&A & VOICE CHAT PANEL ── */}
        <AnimatePresence>
          {isOpenMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              className={`absolute w-80 sm:w-[340px] max-w-[calc(100vw-24px)] max-h-[min(460px,calc(100vh-64px))] overflow-y-auto rounded-3xl p-4 shadow-2xl z-30 text-left select-text ${
                isMenuNearTop ? 'top-full mt-2' : 'bottom-full mb-2'
              } ${
                isMenuNearRight
                  ? 'right-0'
                  : isMenuNearLeft
                  ? 'left-0'
                  : 'left-1/2 -translate-x-1/2'
              }`}
              style={{
                background: 'var(--card, #ffffff)',
                border: '2px solid var(--border, #e2e8f0)',
                color: 'var(--text-primary, #0f172a)',
                boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.32)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-border/80">
                <div className="flex items-center gap-2 min-w-0">
                  {resolvedAvatarUrl ? (
                    <img
                      src={resolvedAvatarUrl}
                      alt={avatarName}
                      className="w-9 h-9 object-contain shrink-0 drop-shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-black shrink-0">
                      3D
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs flex items-center gap-1 text-primary truncate">
                      <span className="truncate">{avatarName}</span>
                      <Sparkles size={12} className="text-amber-500 fill-amber-500 shrink-0" />
                    </h4>
                    <p className="text-[10px] text-muted truncate">
                      {avatarProfession} • O'zaro savol-javob do'stingiz
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpenMenu(false)}
                  className="p-1 rounded-xl text-muted hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Completed Lessons Knowledge Scope Badge */}
              <div className="mt-2.5 p-2.5 rounded-2xl bg-emerald-500/8 border border-emerald-500/25 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <BookOpen size={12} /> Men biladigan darslar:
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
                    {completedCount} ta o'tilgan
                  </span>
                </div>

                {completedCount > 0 ? (
                  <div className="flex flex-wrap gap-1 max-h-14 overflow-y-auto pt-0.5">
                    {completedLessons.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => handleRequestAvatarQuestion(l.id)}
                        title={`«${l.title}» darsidan savol so'rash`}
                        className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800 border border-emerald-500/20 text-[10px] font-semibold text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary transition-colors truncate max-w-[145px]"
                      >
                        🎯 {l.title}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                    Hali dars tugatmagansiz. Men faqat siz tugatgan darslarni bilaman — avval 1-darsni o'qib yakunlang!
                  </p>
                )}
              </div>

              {/* Settings Toggles */}
              <div className="grid grid-cols-2 gap-2 my-2.5">
                <button
                  type="button"
                  onClick={toggleRoaming}
                  className={`p-2 rounded-xl text-left border text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                    isRoaming
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500'
                  }`}
                >
                  <Compass size={13} className="shrink-0" />
                  <span className="truncate">{isRoaming ? 'Yurish: Yoqiq' : "To'xtatilgan"}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`p-2 rounded-xl text-left border text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                    voiceEnabled
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-600 dark:text-sky-400'
                      : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500'
                  }`}
                >
                  {voiceEnabled ? <Volume2 size={13} className="shrink-0" /> : <VolumeX size={13} className="shrink-0" />}
                  <span className="truncate">{voiceEnabled ? 'Ovoz: Yoqiq' : "Ovoz: O'chiq"}</span>
                </button>
              </div>

              {/* Mutual Q&A Action Buttons */}
              <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                <button
                  type="button"
                  disabled={isThinking}
                  onClick={() => handleRequestAvatarQuestion()}
                  className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white text-[11px] font-extrabold shadow-sm hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <HelpCircle size={13} className="shrink-0" />
                  <span className="truncate">Menga savol ber 🎯</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpenMenu(false);
                    walkToSpot();
                  }}
                  className="py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Move size={13} className="shrink-0 text-primary" />
                  <span className="truncate">Yurib kelish 🚶</span>
                </button>
              </div>

              {/* Active Quiz Question Card (when Avatar asked Student a question) */}
              {activeQuiz && (
                <div className="mb-2.5 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/35 space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-300">
                    <span className="truncate">🎯 Savol: «{activeQuiz.lessonTitle}»</span>
                    <button
                      type="button"
                      onClick={() => handleSendMessage('Bilmayman, tushuntirib ber')}
                      className="underline hover:opacity-80 shrink-0"
                    >
                      Javobni ayt 💡
                    </button>
                  </div>
                  <p className="text-[11px] font-semibold leading-snug">
                    {activeQuiz.question}
                  </p>
                </div>
              )}

              {/* Chat & Answer Input */}
              <div className="pt-2 border-t border-border/80 space-y-2">
                <div className="text-[11px] font-bold text-muted flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Bot size={12} />
                    {activeQuiz ? 'Javobingizni ayting yoki yozing:' : `${avatarName}dan so'rang:`}
                  </span>
                  {isSpeaking && (
                    <span className="text-[10px] text-emerald-500 font-bold animate-pulse">
                      🔊 Gapirmoqda
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={
                      isListening
                        ? 'Gapiring...'
                        : activeQuiz
                        ? 'Savolga javobingizni yozing...'
                        : "O'tilgan darsdan savol bering..."
                    }
                    className="flex-1 py-1.5 px-2.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleVoiceListen}
                    title="🎙️ Ovoz orqali savol/javob"
                    className={`p-1.5 rounded-xl transition-all ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                    }`}
                  >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={isThinking || !chatInput.trim()}
                    className="p-1.5 rounded-xl bg-primary text-white disabled:opacity-50 hover:bg-primary/90 transition-all"
                  >
                    <Send size={14} />
                  </button>
                </div>

                {isThinking && (
                  <div className="text-[11px] text-primary animate-pulse font-medium flex items-center gap-1">
                    <Sparkles size={11} /> O'ylanmoqda...
                  </div>
                )}

                {chatReply && !activeQuiz && (
                  <div
                    className={`p-2.5 rounded-xl border text-[11px] leading-relaxed font-medium max-h-28 overflow-y-auto ${
                      lastEvalCorrect === true
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-border text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-1.5">
                      {lastEvalCorrect === true && (
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      )}
                      <span>{chatReply}</span>
                    </div>
                    {completedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRequestAvatarQuestion()}
                        className="mt-2 text-[10px] font-extrabold text-primary hover:underline flex items-center gap-1"
                      >
                        <RotateCcw size={10} /> Yana bitta savol so'ra
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-2 mt-2 border-t border-border flex items-center justify-between text-[10px] text-muted">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenMenu(false);
                    navigate('/student/avatar');
                  }}
                  className="hover:text-primary font-semibold flex items-center gap-0.5"
                >
                  3D Avatarni sozlash <ChevronRight size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCurrentAudio();
                    setIsWalking(false);
                    setIsMinimized(true);
                    setIsOpenMenu(false);
                  }}
                  className="text-primary hover:underline font-bold flex items-center gap-1"
                >
                  <Moon size={11} /> Uxlatish
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
