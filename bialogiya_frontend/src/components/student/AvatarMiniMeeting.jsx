import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, VolumeX,
  Sparkles, CheckCircle2, Trophy, Award, MessageSquare, Send,
  ThumbsUp, Heart, Flame, Smile, RefreshCw, X, ShieldCheck, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

// Web Audio API Sound Synthesizer for meeting chimes & fanfare
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
  } catch (err) {
    // Ignore autoplay restriction if not interacted
  }
}

const meetingSounds = {
  join: () => {
    playTone(440, 'sine', 0.1, 0.15);
    setTimeout(() => playTone(660, 'sine', 0.2, 0.2), 80);
  },
  leave: () => {
    playTone(550, 'sine', 0.1, 0.15);
    setTimeout(() => playTone(330, 'sine', 0.25, 0.2), 80);
  },
  pop: () => {
    playTone(800, 'sine', 0.08, 0.1);
  },
  praise: () => {
    playTone(523.25, 'triangle', 0.12, 0.2);
    setTimeout(() => playTone(659.25, 'triangle', 0.15, 0.2), 80);
    setTimeout(() => playTone(783.99, 'triangle', 0.25, 0.25), 160);
  },
  victory: () => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => playTone(freq, 'triangle', 0.25, 0.25), idx * 110);
    });
  }
};

// Text-to-Speech Helper
function speakUzbek(text, onEnd) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'uz-UZ';
  utterance.rate = 0.98;
  utterance.pitch = 1.05;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);
}

export default function AvatarMiniMeeting({
  lesson = {},
  studentUser = {},
  onFinish,
  onClose,
  earnedXp = 50,
  earnedCoins = 10
}) {
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recognitionRef = useRef(null);

  // States
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [studentInput, setStudentInput] = useState('');
  const [reactions, setReactions] = useState([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [aiSpeechText, setAiSpeechText] = useState('');
  const [conversationStep, setConversationStep] = useState(0); // 0: greeting/question1, 1: response1, 2: question2, 3: completed
  const [isCompleted, setIsCompleted] = useState(false);

  const studentName = studentUser?.name || "O'quvchi";
  const lessonTitle = lesson?.title || "Dars mavzusi";

  // Dynamic conversation questions based on lesson content
  const dialogSteps = useRef([
    {
      aiText: `Salom, ${studentName}! Bugungi "${lessonTitle}" mavzusi bo'yicha darsimiz juda maroqli o'tdi. Keling, 1 daqiqa ichida o'rganganlaringizni umumlashtirib olaylik. Bu mavzudan o'zingiz uchun eng qiziq yoki yangilik bo'lgan narsani aytib bera olasizmi?`,
      smartSuggestions: [
        "Mavzuning asosiy mazmuni va qoidalari juda qiziq bo'ldi.",
        "Hayotdagi misollar va amaliy tadbiqini yaxshi tushundim.",
        "Formulalar va yangi atamalar esda qolarli bo'ldi."
      ]
    },
    {
      aiText: `Ofarin, ${studentName}! Juda to'g'ri fikr bildirdingiz. Siz aytgan jihatlar ushbu mavzuning eng muhim poydevori hisoblanadi. Sizningcha, bularni kundalik hayotimizda qanday qo'llash mumkin?`,
      smartSuggestions: [
        "Kundalik turmushda sog'lom turmush tarzi va tabiatni asrashda kerak bo'ladi.",
        "Texnologiya va zamonaviy tadqiqotlarda keng qo'llanadi.",
        "Kelajakdagi kasbim va imtihonlarda yordam beradi."
      ]
    },
    {
      aiText: `Ajoyib javob! Siz ushbu darsni 100% mukammal o'zlashtirdingiz. Siz kabi intiluvchan o'quvchi bilan ishlash men uchun katta quvonch. Tabriklayman, dars to'liq yakunlandi!`,
      smartSuggestions: []
    }
  ]);

  // Timer
  useEffect(() => {
    meetingSounds.join();
    const interval = setInterval(() => {
      setMeetingDuration(sec => sec + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      cleanupMedia();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Cleanup media streams
  const cleanupMedia = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
  }, []);

  // AI Speech Trigger for current step
  const triggerAiSpeech = useCallback((text) => {
    setAiSpeechText(text);
    if (!soundEnabled) return;
    setIsAiSpeaking(true);
    speakUzbek(text, () => {
      setIsAiSpeaking(false);
    });
  }, [soundEnabled]);

  // Initial greeting
  useEffect(() => {
    const initialDialog = dialogSteps.current[0];
    const timer = setTimeout(() => {
      triggerAiSpeech(initialDialog.aiText);
    }, 700);
    return () => clearTimeout(timer);
  }, [triggerAiSpeech]);

  // Camera Toggle
  const toggleCamera = async () => {
    if (cameraActive) {
      cleanupMedia();
      setCameraActive(false);
      toast('Kamera o\'chirildi', { icon: '📷' });
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
        toast.success('Kamera muvaffaqiyatli yoqildi! 📹');
      } catch (err) {
        console.warn('Camera access denied or unavailable:', err);
        toast.error('Kameraga ruxsat berilmadi yoki kamera mavjud emas.');
        setCameraActive(false);
      }
    }
  };

  useEffect(() => {
    if (cameraActive && videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [cameraActive]);

  // Microphone (Speech Recognition) Toggle
  const toggleMicrophone = () => {
    const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechRecognition) {
      toast.error('Brauzeringizda ovozni aniqlash (Speech Recognition) qo\'llab-quvvatlanmaydi. Iltimos matn orqali javob bering.');
      return;
    }

    if (micActive) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setMicActive(false);
      toast('Mikrofon o\'chirildi', { icon: '🎙️' });
    } else {
      try {
        const rec = new SpeechRecognition();
        rec.lang = 'uz-UZ';
        rec.interimResults = true;
        rec.continuous = false;

        rec.onstart = () => {
          setMicActive(true);
          toast.success('Mikrofon yoqildi. Gapirishingiz mumkin! 🎙️');
        };

        rec.onresult = (e) => {
          const transcript = Array.from(e.results)
            .map(res => res[0].transcript)
            .join(' ');
          setStudentInput(transcript);
        };

        rec.onerror = (err) => {
          console.warn('Speech recognition error:', err);
          setMicActive(false);
        };

        rec.onend = () => {
          setMicActive(false);
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.error('Mic start error:', err);
        toast.error('Mikrofonni ishga tushirib bo\'lmadi.');
        setMicActive(false);
      }
    }
  };

  // Add reaction animation
  const addReaction = (emoji) => {
    meetingSounds.pop();
    const id = Date.now() + Math.random();
    setReactions(prev => [...prev, { id, emoji, x: Math.random() * 70 + 15 }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 2200);
  };

  // Format MM:SS
  const formatMeetingTime = (totalSec) => {
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Handle student submitting response to AI
  const handleStudentSubmit = (answerText) => {
    const textToSubmit = (answerText || studentInput || '').trim();
    if (!textToSubmit) {
      toast.error('Iltimos, javobingizni ayting yoki yozing!');
      return;
    }

    meetingSounds.praise();
    setStudentInput('');

    if (conversationStep === 0) {
      setConversationStep(1);
      const nextDialog = dialogSteps.current[1];
      triggerAiSpeech(nextDialog.aiText);
    } else {
      // Final step -> Complete meeting
      setConversationStep(2);
      const finalDialog = dialogSteps.current[2];
      triggerAiSpeech(finalDialog.aiText);
      setTimeout(() => {
        setIsCompleted(true);
        meetingSounds.victory();
      }, 1500);
    }
  };

  const handleFinishLesson = () => {
    meetingSounds.leave();
    cleanupMedia();
    if (onFinish) {
      onFinish({ earnedXp, earnedCoins });
    }
    if (onClose) {
      onClose();
    }
  };

  const currentStepData = dialogSteps.current[conversationStep] || dialogSteps.current[dialogSteps.current.length - 1];

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0F19] text-white flex flex-col overflow-hidden select-none">
      {/* Floating Reactions Canvas */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        <AnimatePresence>
          {reactions.map(r => (
            <motion.div
              key={r.id}
              initial={{ opacity: 1, y: '85vh', x: `${r.x}vw`, scale: 0.8 }}
              animate={{ opacity: 0, y: '20vh', scale: 1.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="absolute text-3xl sm:text-4xl"
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* TOP HEADER: Google Meet / Zoom style */}
      <header className="h-14 sm:h-16 px-4 sm:px-6 bg-[#111827]/80 backdrop-blur-md border-b border-gray-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Mini-Meeting</span>
          </div>

          <div className="hidden sm:block h-4 w-px bg-gray-700" />

          <h2 className="text-xs sm:text-sm font-semibold truncate text-gray-200">
            {lessonTitle} • Jonli Xulosa
          </h2>
        </div>

        {/* Meeting Timer & Top Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-3 py-1 rounded-xl bg-gray-800/80 border border-gray-700 text-xs font-mono text-gray-300">
            ⏱️ {formatMeetingTime(meetingDuration)}
          </div>

          <button
            onClick={() => {
              setSoundEnabled(s => !s);
              if (soundEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
            }`}
            title={soundEnabled ? "AI ovozini o'chirish" : "AI ovozini yoqish"}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Yopish"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* MAIN MEETING GRID: Dual Screen (Left: AI Avatar, Right: Student) */}
      <main className="flex-1 p-3 sm:p-5 flex flex-col md:flex-row gap-3 sm:gap-4 overflow-hidden relative">
        {/* ========================================================
            TILE 1: AI AVATAR PARTICIPANT
            ======================================================== */}
        <div className="flex-1 bg-gradient-to-b from-[#1E293B] to-[#0F172A] rounded-2xl sm:rounded-3xl border border-gray-800/80 shadow-2xl relative flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden min-h-[220px]">
          {/* Glowing Aura Ring when AI is speaking */}
          <div
            className={`absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full transition-all duration-700 pointer-events-none ${
              isAiSpeaking
                ? 'bg-primary/20 blur-3xl scale-125 animate-pulse'
                : 'bg-indigo-500/10 blur-2xl scale-90'
            }`}
          />

          {/* AI Avatar Visual (Animated Stylized Character) */}
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              animate={{
                y: isAiSpeaking ? [0, -6, 0] : [0, -2, 0],
                scale: isAiSpeaking ? [1, 1.04, 1] : 1
              }}
              transition={{ repeat: Infinity, duration: isAiSpeaking ? 1.4 : 3, ease: 'easeInOut' }}
              className="relative"
            >
              <div
                className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1.5 shadow-2xl transition-all ${
                  isAiSpeaking
                    ? 'ring-4 ring-primary shadow-primary/40'
                    : 'ring-2 ring-indigo-500/40'
                }`}
                style={{ background: 'linear-gradient(135deg, #F06413, #7C3AED, #2563EB)' }}
              >
                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden relative">
                  {/* High Quality Stylized AI Avatar SVG Face */}
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Face Base */}
                    <circle cx="50" cy="50" r="44" fill="#FDE047" />
                    {/* Hair / Headband */}
                    <path d="M12 40 Q50 10 88 40 Q50 25 12 40" fill="#3B82F6" />
                    {/* Glasses */}
                    <rect x="22" y="38" width="22" height="18" rx="6" fill="#1E293B" stroke="#0284C7" strokeWidth="2.5" />
                    <rect x="56" y="38" width="22" height="18" rx="6" fill="#1E293B" stroke="#0284C7" strokeWidth="2.5" />
                    <line x1="44" y1="47" x2="56" y2="47" stroke="#0284C7" strokeWidth="2.5" />
                    {/* Eyes inside glasses */}
                    <circle cx="33" cy="47" r="4" fill="#FFFFFF" />
                    <circle cx="67" cy="47" r="4" fill="#FFFFFF" />
                    {/* Cheeks */}
                    <circle cx="23" cy="62" r="6" fill="#F43F5E" opacity="0.4" />
                    <circle cx="77" cy="62" r="6" fill="#F43F5E" opacity="0.4" />
                    {/* Animated Mouth */}
                    {isAiSpeaking ? (
                      <ellipse cx="50" cy="68" rx="8" ry="6" fill="#881337">
                        <animate attributeName="ry" values="2;7;3;8;2" dur="0.3s" repeatCount="indefinite" />
                      </ellipse>
                    ) : (
                      <path d="M38 65 Q50 76 62 65" fill="none" stroke="#881337" strokeWidth="3" strokeLinecap="round" />
                    )}
                    {/* Sparkle badge */}
                    <polygon points="76,22 79,29 86,30 81,35 82,42 76,38 70,42 71,35 66,30 73,29" fill="#F59E0B" />
                  </svg>
                </div>
              </div>

              {/* Status Indicator Icon */}
              <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 border-2 border-gray-900 text-[10px] font-black uppercase text-white shadow-md flex items-center gap-1">
                <Sparkles size={10} />
                <span>AI</span>
              </div>
            </motion.div>

            {/* Speaking Audio Waveform Animation */}
            {isAiSpeaking && (
              <div className="flex items-center gap-1 mt-3">
                {[12, 24, 16, 28, 14, 22, 10].map((h, i) => (
                  <motion.span
                    key={i}
                    animate={{ height: [8, h, 8] }}
                    transition={{ repeat: Infinity, duration: 0.5 + i * 0.1 }}
                    className="w-1 bg-primary rounded-full"
                  />
                ))}
              </div>
            )}
          </div>

          {/* AI SPEECH SUBTITLE BUBBLE */}
          <div className="w-full max-w-md mt-4 z-10 px-2">
            <motion.div
              key={aiSpeechText}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 sm:p-4 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 text-xs sm:text-sm text-gray-100 shadow-xl leading-relaxed text-center"
            >
              <div className="flex items-center justify-center gap-1.5 text-primary text-[11px] font-bold mb-1">
                <Sparkles size={12} />
                <span>AI Ustoz Gapirmoqda:</span>
              </div>
              <p className="line-clamp-4">
                "{aiSpeechText || currentStepData.aiText}"
              </p>
            </motion.div>
          </div>

          {/* AI Tile Name Tag */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-gray-200">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Bilimdon (Ustoz)</span>
            {isAiSpeaking && <Volume2 size={12} className="text-primary animate-bounce" />}
          </div>
        </div>

        {/* ========================================================
            TILE 2: STUDENT PARTICIPANT
            ======================================================== */}
        <div className="flex-1 bg-gradient-to-b from-[#1A1F2E] to-[#0A0D14] rounded-2xl sm:rounded-3xl border border-gray-800/80 shadow-2xl relative flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden min-h-[220px]">
          {/* Active Webcam Feed */}
          {cameraActive ? (
            <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            </div>
          ) : (
            /* Student Avatar Placeholder when camera is OFF */
            <div className="flex flex-col items-center text-center z-10">
              <div className="relative mb-3">
                {studentUser?.avatar ? (
                  <img
                    src={studentUser.avatar}
                    alt={studentName}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-primary/40 shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-black text-3xl sm:text-4xl flex items-center justify-center shadow-xl border-4 border-white/20">
                    {studentName.charAt(0).toUpperCase()}
                  </div>
                )}
                {micActive && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-gray-900 flex items-center justify-center animate-ping" />
                )}
              </div>

              <h3 className="font-bold text-sm sm:text-base text-gray-200">
                {studentName}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {cameraActive ? "Kamera faol" : "Kamera o'chiq • Avataringiz ko'rinmoqda"}
              </p>
            </div>
          )}

          {/* Student Live Speech or Input Bubble */}
          {studentInput && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-4 inset-x-4 z-20 p-3 rounded-2xl bg-primary/90 text-white text-xs sm:text-sm font-medium shadow-2xl backdrop-blur-md text-center border border-white/20"
            >
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-0.5">
                Sizning javobingiz:
              </div>
              "{studentInput}"
            </motion.div>
          )}

          {/* Student Name Tag & Mic Badge */}
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-gray-200">
            <span>{studentName} (Siz)</span>
            {micActive ? (
              <span className="flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                <Mic size={12} className="animate-pulse" /> Tinglanmoqda...
              </span>
            ) : (
              <span className="text-gray-500">
                <MicOff size={12} />
              </span>
            )}
          </div>
        </div>
      </main>

      {/* SMART QUICK SUGGESTIONS DRAWER */}
      {!isCompleted && currentStepData.smartSuggestions?.length > 0 && (
        <div className="px-4 py-2 bg-[#111827]/90 border-t border-gray-800 flex items-center gap-2 overflow-x-auto no-scrollbar z-20">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
            <Zap size={12} className="text-amber-400" /> Tezkor javoblar:
          </span>
          {currentStepData.smartSuggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleStudentSubmit(sug)}
              className="text-xs py-1 px-3 rounded-xl bg-gray-800 hover:bg-primary/20 hover:border-primary/50 border border-gray-700 text-gray-200 hover:text-primary transition-all whitespace-nowrap flex-shrink-0"
            >
              💬 {sug}
            </button>
          ))}
        </div>
      )}

      {/* BOTTOM CONTROLS BAR: Google Meet Style */}
      <footer className="h-18 sm:h-20 px-4 sm:px-6 bg-[#0D131F] border-t border-gray-800/80 flex items-center justify-between z-20 gap-2 sm:gap-4">
        {/* Left: Quick reactions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {['👏', '❤️', '🔥', '👍'].map(emoji => (
            <button
              key={emoji}
              onClick={() => addReaction(emoji)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-800 hover:bg-gray-700 text-base sm:text-lg flex items-center justify-center transition-transform hover:scale-115 active:scale-95"
              title={`${emoji} Reaksiya yuborish`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Center: Main AV controls & Student Text Input */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl justify-center">
          {/* Mic Toggle Button */}
          <button
            onClick={toggleMicrophone}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-bold transition-all shadow-md ${
              micActive
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white ring-4 ring-emerald-500/30'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
            title={micActive ? "Mikrofonni o'chirish" : "Mikrofon orqali gapirish"}
          >
            {micActive ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {/* Camera Toggle Button */}
          <button
            onClick={toggleCamera}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-bold transition-all shadow-md ${
              cameraActive
                ? 'bg-blue-600 hover:bg-blue-700 text-white ring-4 ring-blue-500/30'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
            title={cameraActive ? "Kamerani o'chirish" : "Kamerani yoqish"}
          >
            {cameraActive ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {/* Text Input for Typing Answers */}
          <div className="flex-1 hidden sm:flex items-center relative">
            <input
              type="text"
              value={studentInput}
              onChange={(e) => setStudentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStudentSubmit()}
              placeholder="O'z fikringizni yozing yoki mikrofondan foydalaning..."
              className="w-full py-2.5 pl-3.5 pr-10 rounded-xl bg-gray-800/90 border border-gray-700 text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary"
            />
            <button
              onClick={() => handleStudentSubmit()}
              disabled={!studentInput.trim()}
              className="absolute right-2 p-1.5 rounded-lg text-primary hover:text-white disabled:opacity-40 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Right: End Meeting & Complete */}
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <button
              onClick={handleFinishLesson}
              className="px-4 sm:px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105 active:scale-95"
            >
              <Trophy size={16} />
              <span>Darsni Yakunlash</span>
            </button>
          ) : (
            <button
              onClick={() => handleStudentSubmit()}
              className="px-3.5 sm:px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-primary/25 transition-transform hover:scale-105"
            >
              <Send size={14} />
              <span>Javob berish</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-600 text-rose-400 hover:text-white flex items-center justify-center transition-colors"
            title="Uchrashuvdan chiqish"
          >
            <PhoneOff size={18} />
          </button>
        </div>
      </footer>

      {/* VICTORY CELEBRATION MODAL OVERLAY */}
      <AnimatePresence>
        {isCompleted && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="max-w-md w-full bg-[#111827] border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
              {/* Background celebration glow */}
              <div className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/30 rounded-full animate-ping" />
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-green-400 text-white flex items-center justify-center shadow-lg">
                  <Trophy size={40} />
                </div>
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  🎉 Ajoyib Muvaffaqiyat!
                </span>
                <h2 className="text-2xl font-extrabold text-white mt-2">
                  Dars To'liq O'zlashtirildi!
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 leading-relaxed">
                  AI Avatar bilan jonli suhbat muvaffaqiyatli yakunlandi. Siz darsni barcha 4 bosqichini a'lo bajardingiz!
                </p>
              </div>

              {/* Reward stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                  <div className="text-2xl font-black text-amber-400">+{earnedXp} XP</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">
                    Tajriba Balli
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <div className="text-2xl font-black text-emerald-400">+{earnedCoins} Tanga</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">
                    Mukofot Tangalari
                  </div>
                </div>
              </div>

              <button
                onClick={handleFinishLesson}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-base border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                <span>Natijani Saqlash va Darsga Qaytish</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
