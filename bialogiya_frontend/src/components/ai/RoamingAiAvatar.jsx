import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, MessageSquare, Volume2, VolumeX, Play, Pause,
  Compass, X, Send, Heart, Flame, Zap, Smile, ChevronRight,
  Move, HelpCircle, Moon, SunMedium, Bot
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

// Web Audio API tactile interaction sound
function playAvatarPop(pitch = 540) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Audio Context might be restricted until user gesture
  }
}

// Web Speech API for Uzbek Voice
function speakUzbekVoice(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uz-UZ';
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech error
  }
}

// Contextual helpful tips based on URL route
const ROUTE_TIPS = {
  '/student/lessons': [
    "Darslarni ketma-ketlikda o'zlashtirib, marra kubogiga qarab yuring! 🏆",
    "Har bir dars yakunida AI bilan 4-bosqichli mustahkamlash darsi kutmoqda! 🚀",
    "Barcha kataklarni yakunlab, yangi bosqich sertifikatiga ega bo'ling! 🎓",
  ],
  '/student/homework': [
    "Topshiriqlarni vaqtida yuboring, AI xatolaringizni birma-bir ko'rsatib beradi! 📝",
    "Uyga vazifalarni muvaffaqiyatli topshirish qo'shimcha tanga va XP beradi! 💰",
  ],
  '/student/tests': [
    "Diqqatni jamlang, har bir to'g'ri javob reytingingizni oshiradi! 🧠✨",
    "Xato qilgan savollaringizni AI tahlil orqali qayta o'rganishingiz mumkin! 🔍",
  ],
  '/student/shop': [
    "Do'kondan qahramoningiz uchun yangi kiyim va aksessuarlar tanlang! 🦊🛍️",
  ],
  '/student/dashboard': [
    "Bugungi o'quv rejangiz bilan tanishing va seriya (streak) kunlarini yo'qotmang! 🔥",
    "Har kuni ozgina o'rganish — buyuk marralar kalitidir! 💡",
  ],
  '/teacher': [
    "O'quvchilar yangi darslar va topshiriqlarni intizorlik bilan kutishmoqda! 👨‍🏫",
    "AI yordamida testlar va interaktiv darsliklarni bir necha soniyada yarata olasiz! ⚡",
  ],
  '/manager': [
    "O'quv markaz ko'rsatkichlari, tushumlar va guruhlarni monitoring qilib boring! 📊",
  ],
};

const GENERAL_TIPS = [
  "Bilasizmi? Inson miyasi taxminan 86 milliard neyrondan iborat! 🧠",
  "Biologiya — tiriklik mo'jizasini o'rganuvchi eng qiziqarli fan! 🧬🌿",
  "Agar savolingiz bo'lsa, ustimga bosing, sizga bajonidil yordam beraman! 🦊",
  "Bugun ajoyib kun! Bilim olishda davom eting! ✨",
  "Har kuni yangi bilim o'rganish xotirani 3 barobar kuchaytiradi! 🚀",
];

export default function RoamingAiAvatar() {
  const { user } = useAuthStore();
  const location = useLocation();

  // Settings & States
  const [isRoaming, setIsRoaming] = useState(() => {
    try {
      const saved = localStorage.getItem('abdora_ai_roaming');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [speechBubble, setSpeechBubble] = useState(null);
  const [facingDirection, setFacingDirection] = useState('right'); // 'left' | 'right'
  const [isWalking, setIsWalking] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatReply, setChatReply] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Current Position coordinates on screen (px)
  const [position, setPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      return {
        x: Math.max(40, window.innerWidth - 130),
        y: Math.max(120, window.innerHeight - 200),
      };
    }
    return { x: 300, y: 400 };
  });

  // Keep inside screen bounds when window resizes
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(Math.max(40, prev.x), window.innerWidth - 110),
        y: Math.min(Math.max(80, prev.y), window.innerHeight - 150),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save roaming preference
  const toggleRoaming = useCallback(() => {
    setIsRoaming(prev => {
      const next = !prev;
      try { localStorage.setItem('abdora_ai_roaming', String(next)); } catch {}
      return next;
    });
  }, []);

  // Pick random location inside safe screen margins
  const pickRandomDestination = useCallback(() => {
    if (typeof window === 'undefined') return { x: 200, y: 300 };
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Favor edges/margins so it doesn't stay dead center blocking forms
    const zones = [
      // Bottom-right quadrant
      { minX: w * 0.65, maxX: w - 110, minY: h * 0.55, maxY: h - 140 },
      // Bottom-left quadrant
      { minX: 60, maxX: Math.max(90, w * 0.35), minY: h * 0.6, maxY: h - 140 },
      // Mid-right margin
      { minX: w * 0.75, maxX: w - 100, minY: 120, maxY: h * 0.6 },
      // Top-right area
      { minX: Math.max(100, w * 0.6), maxX: w - 120, minY: 90, maxY: 240 },
      // Mid-left margin
      { minX: 60, maxX: Math.max(90, w * 0.3), minY: 140, maxY: h * 0.55 },
    ];

    const chosenZone = zones[Math.floor(Math.random() * zones.length)];
    const targetX = Math.round(chosenZone.minX + Math.random() * (chosenZone.maxX - chosenZone.minX));
    const targetY = Math.round(chosenZone.minY + Math.random() * (chosenZone.maxY - chosenZone.minY));
    return { x: targetX, y: targetY };
  }, []);

  // Move avatar to a new random location
  const wanderToNewSpot = useCallback(() => {
    if (!isRoaming || isMinimized || isOpenMenu) return;

    const nextDest = pickRandomDestination();
    setPosition(prev => {
      if (nextDest.x < prev.x) {
        setFacingDirection('left');
      } else {
        setFacingDirection('right');
      }
      return nextDest;
    });

    setIsWalking(true);
    setTimeout(() => {
      setIsWalking(false);
      // Once arrived, 35% chance to show a cute bubble thought
      if (Math.random() < 0.45) {
        triggerContextTip();
      }
    }, 2800);
  }, [isRoaming, isMinimized, isOpenMenu, pickRandomDestination]);

  // Periodic autonomous roaming timer (moves every 14-22 seconds)
  useEffect(() => {
    if (!isRoaming || isMinimized || isOpenMenu) return;

    const interval = setInterval(() => {
      wanderToNewSpot();
    }, 16000 + Math.random() * 8000);

    return () => clearInterval(interval);
  }, [isRoaming, isMinimized, isOpenMenu, wanderToNewSpot]);

  // Trigger contextual tip on route change or when requested
  const triggerContextTip = useCallback((forceText = null) => {
    let tip = forceText;
    if (!tip) {
      const path = location.pathname;
      const matchedKey = Object.keys(ROUTE_TIPS).find(k => path.startsWith(k));
      const pool = matchedKey ? ROUTE_TIPS[matchedKey] : GENERAL_TIPS;
      tip = pool[Math.floor(Math.random() * pool.length)];
    }

    setSpeechBubble(tip);
    if (voiceEnabled) {
      speakUzbekVoice(tip);
    }

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setSpeechBubble(curr => (curr === tip ? null : curr));
    }, 6000);
  }, [location.pathname, voiceEnabled]);

  // Trigger a greeting when navigating to a new page
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isMinimized && !isOpenMenu) {
        triggerContextTip();
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Handle avatar click
  const handleAvatarClick = (e) => {
    e.stopPropagation();
    playAvatarPop(620);
    setSpeechBubble(null);
    setIsOpenMenu(prev => !prev);
  };

  // Mini AI question answer handler
  const handleAskAi = async () => {
    const q = chatInput.trim();
    if (!q) return;

    setIsThinking(true);
    setChatReply('');
    setChatInput('');

    try {
      // Natural responsive answers for in-app assistant
      const qLower = q.toLowerCase();
      let reply = '';

      if (qLower.includes('dars') || qLower.includes('marra') || qLower.includes('yo\'l')) {
        reply = "O'quv yo'lidagi barcha kataklar sizning bosqichingiz bo'yicha rejalashtirilgan. Har bir darsni bosqichma-bosqich o'rganib marra kubogiga erishing!";
      } else if (qLower.includes('vazifa') || qLower.includes('uyga')) {
        reply = "Uyga vazifani 'Uy vazifasi' bo'limidan yuklashingiz mumkin. AI uni bir necha soniyada tekshirib, izoh beradi.";
      } else if (qLower.includes('tanga') || qLower.includes('xp') || qLower.includes('ball')) {
        reply = "Har bir yakunlangan dars va to'g'ri test javoblari sizga +50 XP va +10 tanga beradi. Tangalarni do'konda sarflang!";
      } else if (qLower.includes('salom') || qLower.includes('qale') || qLower.includes('ishlar')) {
        reply = "Salom! Men sizning Abdora AI o'quv yordamchingizman. Darslarni o'rganishda sizga yo'l ko'rsatishdan xursandman!";
      } else {
        reply = `"${q}" mavzusida: barcha o'quv materiallari, darslar va interaktiv testlar Abdora tizimida to'liq tayyorlangan. Qaysi fandan boshlaymiz?`;
      }

      setTimeout(() => {
        setIsThinking(false);
        setChatReply(reply);
        if (voiceEnabled) speakUzbekVoice(reply);
      }, 700);
    } catch {
      setIsThinking(false);
      setChatReply("Kechirasiz, ma'lumot olishda kichik uzilish bo'ldi. Qaytadan urinib ko'ring.");
    }
  };

  // If minimized to sleep corner icon
  if (isMinimized) {
    return (
      <motion.button
        type="button"
        onClick={() => {
          setIsMinimized(false);
          playAvatarPop(580);
          triggerContextTip("Men yana uyg'ondim! Qayerga boramiz? 🚀");
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 right-4 z-50 p-2.5 rounded-full bg-slate-900/90 text-white border-2 border-emerald-500 shadow-xl flex items-center gap-2 backdrop-blur-md cursor-pointer group"
        title="AI Avatar yordamchisini uyg'otish"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-lg shadow-inner">
          🦊
        </div>
        <div className="text-left pr-1 hidden sm:block">
          <div className="text-[11px] font-black text-emerald-400 flex items-center gap-1">
            <span>Abdora AI</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-[10px] text-slate-300">Uyg'otish ✨</div>
        </div>
      </motion.button>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none">
      {/* ── DRAGGABLE & ROAMING AI AVATAR CONTAINER ── */}
      <motion.div
        drag
        dragMomentum={false}
        animate={{
          x: position.x,
          y: position.y,
        }}
        transition={{
          type: 'spring',
          damping: 24,
          stiffness: 45,
          mass: 1.2,
        }}
        onDragEnd={(_, info) => {
          setPosition(prev => ({
            x: Math.min(Math.max(30, prev.x + info.offset.x), window.innerWidth - 120),
            y: Math.min(Math.max(60, prev.y + info.offset.y), window.innerHeight - 150),
          }));
        }}
        className="absolute top-0 left-0 pointer-events-auto flex flex-col items-center cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        {/* ── 1. AVATAR NAFAS OLISH & GAPIRISH BULUTI (Speech Bubble) ── */}
        <AnimatePresence>
          {speechBubble && !isOpenMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.85 }}
              transition={{ duration: 0.25 }}
              className="absolute -top-20 left-1/2 -translate-x-1/2 z-40 max-w-[240px] sm:max-w-[280px]"
            >
              <div
                className="px-3.5 py-2 rounded-2xl shadow-xl text-xs font-bold relative text-center leading-snug backdrop-blur-md"
                style={{
                  background: 'var(--card, #ffffff)',
                  border: '2px solid #10b981',
                  color: 'var(--text-primary, #0f172a)',
                  boxShadow: '0 12px 30px -5px rgba(16, 185, 129, 0.35)',
                }}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-500 fill-amber-500" /> Abdora AI
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSpeechBubble(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs p-0.5"
                  >
                    ×
                  </button>
                </div>

                <p className="text-[11px] font-semibold">{speechBubble}</p>

                {/* Pastga yo'nalgan nutq ko'rsatkichi / Speech triangle */}
                <div
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                  style={{
                    background: 'var(--card, #ffffff)',
                    borderRight: '2px solid #10b981',
                    borderBottom: '2px solid #10b981',
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 2. MASCOT / 3D AVATAR MODEL (Animated Character) ── */}
        <div
          onClick={handleAvatarClick}
          className="relative flex flex-col items-center group transition-transform"
        >
          {/* Harakatlanish paytidagi nur halqasi */}
          <div
            className={`absolute -inset-2 rounded-full blur-md transition-opacity pointer-events-none ${
              isWalking ? 'bg-emerald-400/35 opacity-100 animate-pulse' : 'bg-primary/20 opacity-40 group-hover:opacity-80'
            }`}
          />

          {/* Qahramon tanasi va animatsiyasi */}
          <motion.div
            animate={{
              y: isWalking ? [0, -10, 0, -6, 0] : [0, -6, 0],
              rotate: isWalking ? (facingDirection === 'left' ? [-3, 3, -3] : [3, -3, 3]) : [0, 1.5, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: isWalking ? 0.7 : 2.6,
              ease: 'easeInOut',
            }}
            style={{
              transform: facingDirection === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
            }}
            className="relative"
          >
            {/* Mascot Container */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 shadow-2xl relative flex items-center justify-center cursor-pointer select-none bg-gradient-to-tr from-emerald-500 via-teal-500 to-amber-400 hover:scale-105 active:scale-95 transition-all">
              <div className="w-full h-full rounded-full bg-slate-900 border-2 border-white/80 overflow-hidden flex items-center justify-center relative shadow-inner">
                {/* Agar o'quvchining o'z avatari bo'lsa */}
                {user?.avatar ? (
                  <img src={user.avatar} alt="AI Avatar" className="w-full h-full object-cover" />
                ) : (
                  // Abdora Aqlli Tulki / Fox AI Mascot SVG
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="foxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F97316" />
                        <stop offset="100%" stopColor="#EA580C" />
                      </linearGradient>
                      <linearGradient id="earInner" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FED7AA" />
                        <stop offset="100%" stopColor="#FDBA74" />
                      </linearGradient>
                    </defs>

                    {/* Quloqlar */}
                    <polygon points="22,12 38,36 14,38" fill="url(#foxGrad)" stroke="#C2410C" strokeWidth="2" />
                    <polygon points="22,18 34,35 18,36" fill="url(#earInner)" />

                    <polygon points="78,12 62,36 86,38" fill="url(#foxGrad)" stroke="#C2410C" strokeWidth="2" />
                    <polygon points="78,18 66,35 82,36" fill="url(#earInner)" />

                    {/* Bosh va tana */}
                    <ellipse cx="50" cy="54" rx="36" ry="32" fill="url(#foxGrad)" />

                    {/* Oq yanoqlar */}
                    <path d="M18 56 Q50 82 82 56 Q72 80 50 82 Q28 80 18 56" fill="#FFFFFF" />

                    {/* Ko'zlar (Miltillovchi animatsiya) */}
                    <ellipse cx="36" cy="48" rx="4.5" ry="5.5" fill="#1E293B">
                      <animate attributeName="ry" values="5.5;0.8;5.5" dur="3.5s" repeatCount="indefinite" />
                    </ellipse>
                    <circle cx="37.5" cy="46" r="1.8" fill="#FFFFFF" />

                    <ellipse cx="64" cy="48" rx="4.5" ry="5.5" fill="#1E293B">
                      <animate attributeName="ry" values="5.5;0.8;5.5" dur="3.5s" repeatCount="indefinite" />
                    </ellipse>
                    <circle cx="65.5" cy="46" r="1.8" fill="#FFFFFF" />

                    {/* Qoshlar / Smart Headband */}
                    <rect x="26" y="36" width="48" height="5" rx="2.5" fill="#3B82F6" />
                    <circle cx="50" cy="38.5" r="3.5" fill="#FACC15" />

                    {/* Buruncha */}
                    <ellipse cx="50" cy="62" rx="4" ry="3" fill="#0F172A" />

                    {/* Tabassum */}
                    <path d="M43 67 Q50 74 57 67" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Qizil yonoqlar */}
                    <circle cx="28" cy="60" r="4.5" fill="#FB7185" opacity="0.6" />
                    <circle cx="72" cy="60" r="4.5" fill="#FB7185" opacity="0.6" />
                  </svg>
                )}

                {/* AI Faollik chirog'i (Green online indicator) */}
                <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 shadow-sm" />
              </div>
            </div>

            {/* Yurish paytidagi kichik oyoqchalar / Stepping paws */}
            {isWalking && (
              <div className="flex justify-center gap-4 -mt-1 pointer-events-none">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.3 }}
                  className="w-3.5 h-2 rounded-full bg-orange-600 shadow-xs"
                />
                <motion.div
                  animate={{ y: [-4, 0, -4] }}
                  transition={{ repeat: Infinity, duration: 0.3 }}
                  className="w-3.5 h-2 rounded-full bg-orange-600 shadow-xs"
                />
              </div>
            )}
          </motion.div>

          {/* Pastdagi dinamik soya (Dynamic soft shadow) */}
          <motion.div
            animate={{
              scale: isWalking ? [0.9, 1.2, 0.9] : [1, 0.8, 1],
              opacity: [0.35, 0.15, 0.35],
            }}
            transition={{
              repeat: Infinity,
              duration: isWalking ? 0.7 : 2.6,
              ease: 'easeInOut',
            }}
            className="w-12 h-2.5 rounded-full bg-black/40 blur-xs mt-1 pointer-events-none"
          />

          {/* Kichik status nishoni (Harakat holatida "Yurmoqda 🐾") */}
          <div className="mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-md border border-white/20 shadow-md flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{isWalking ? "Yurmoqda 🐾" : "Abdora AI"}</span>
          </div>
        </div>

        {/* ── 3. INTERAKTIV BOSHQARUV VA AI BILAN SUHBAT MENYUSI (Popup Menu) ── */}
        <AnimatePresence>
          {isOpenMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="absolute -top-[360px] left-1/2 -translate-x-1/2 w-72 sm:w-80 rounded-3xl p-4 shadow-2xl z-50 text-left select-text"
              style={{
                background: 'var(--card, #ffffff)',
                border: '2px solid var(--border, #e2e8f0)',
                color: 'var(--text-primary, #0f172a)',
                boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.3)',
              }}
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-sm shadow-sm">
                    🦊
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs flex items-center gap-1 text-primary">
                      <span>Abdora AI Qahramoni</span>
                      <Sparkles size={12} className="text-amber-500 fill-amber-500" />
                    </h4>
                    <p className="text-[10px] text-muted">Sayt bo'ylab jonli AI hamrohingiz</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpenMenu(false)}
                  className="p-1 rounded-xl text-muted hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Sozlamalar va Holatlar */}
              <div className="grid grid-cols-2 gap-2 my-3">
                <button
                  type="button"
                  onClick={toggleRoaming}
                  className={`p-2 rounded-xl text-left border text-[11px] font-bold flex items-center gap-2 transition-all ${
                    isRoaming
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500'
                  }`}
                >
                  <Compass size={14} />
                  <span>{isRoaming ? "Aylanib yurish: ON" : "To'xtatilgan"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVoiceEnabled(prev => !prev)}
                  className={`p-2 rounded-xl text-left border text-[11px] font-bold flex items-center gap-2 transition-all ${
                    voiceEnabled
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-600 dark:text-sky-400'
                      : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500'
                  }`}
                >
                  {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  <span>{voiceEnabled ? "Ovoz: Yoqiq" : "Ovoz: O'chiq"}</span>
                </button>
              </div>

              {/* Tezkor maslahat va harakat tugmalari */}
              <div className="space-y-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    wanderToNewSpot();
                    triggerContextTip();
                  }}
                  className="w-full py-1.5 px-3 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Move size={12} /> Boshqa joyga yurish 🐾
                  </span>
                  <ChevronRight size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => triggerContextTip()}
                  className="w-full py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white text-xs font-bold transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={12} /> Foydali maslahat berish 💡
                  </span>
                  <ChevronRight size={13} />
                </button>
              </div>

              {/* AI Chat / Savol-Javob */}
              <div className="pt-2 border-t border-border/80 space-y-2">
                <div className="text-[11px] font-bold text-muted flex items-center gap-1">
                  <Bot size={12} /> Qahramondan savol so'rang:
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                    placeholder="Masalan: Uyga vazifa qayerda?..."
                    className="flex-1 py-1.5 px-2.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAskAi}
                    disabled={isThinking || !chatInput.trim()}
                    className="p-1.5 rounded-xl bg-primary text-white disabled:opacity-50 hover:bg-primary/90 transition-all"
                  >
                    <Send size={13} />
                  </button>
                </div>

                {isThinking && (
                  <div className="text-[11px] text-primary animate-pulse font-medium flex items-center gap-1">
                    <Sparkles size={11} /> Javob o'ylanmoqda...
                  </div>
                )}

                {chatReply && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-border text-[11px] leading-relaxed font-medium text-slate-700 dark:text-slate-200 max-h-24 overflow-y-auto">
                    {chatReply}
                  </div>
                )}
              </div>

              {/* Pastki: Uxlatish / Minimallashtirish */}
              <div className="pt-2.5 mt-2 border-t border-border flex items-center justify-between text-[10px] text-muted">
                <span>Istalgan joyga sudrab olib boring</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsMinimized(true);
                    setIsOpenMenu(false);
                  }}
                  className="text-primary hover:underline font-bold flex items-center gap-1"
                >
                  <Moon size={11} /> Uxlatish (Zzz)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
