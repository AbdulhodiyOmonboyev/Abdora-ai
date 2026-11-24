import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Sparkles, X, Check, ArrowRight, Volume2, VolumeX,
  RotateCcw, Trophy, AlertCircle, CheckCircle2, Zap, HelpCircle,
  Award, Play, Flame, Star, ShieldAlert
} from 'lucide-react';
import api from '../../config/axios';
import { useAuthStore } from '../../store/authStore';

// Web Audio API Sound Synthesizer (Works 100% offline, zero lag, no external assets)
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
    // AudioContext blocked by browser policy until user interacts
  }
}

const soundEffects = {
  correct: () => {
    playTone(523.25, 'triangle', 0.12, 0.25); // C5
    setTimeout(() => playTone(659.25, 'triangle', 0.2, 0.25), 90); // E5
  },
  wrong: () => {
    playTone(260, 'sawtooth', 0.18, 0.2);
    setTimeout(() => playTone(196, 'sawtooth', 0.25, 0.2), 120);
  },
  heartLoss: () => {
    playTone(330, 'square', 0.1, 0.15);
    setTimeout(() => playTone(220, 'square', 0.2, 0.15), 80);
  },
  select: () => {
    playTone(440, 'sine', 0.05, 0.08);
  },
  victory: () => {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => playTone(freq, 'triangle', 0.25, 0.3), idx * 110);
    });
  }
};

// Text-to-speech helper
function speakText(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'uz-UZ';
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

// Fallback steps generator from lesson content - 4 balanced stages (total 50 XP)
export function generateDuolingoSteps(lesson) {
  if (!lesson) return [];
  const ai = lesson.aiContent || {};
  if (Array.isArray(ai.duolingoSteps) && ai.duolingoSteps.length === 4) {
    return ai.duolingoSteps;
  }

  // 1. Nazariya / Asosiy tushuncha (Concept step - +10 XP)
  const explanation = ai.simpleExplanation || lesson.content || '';
  const firstSentence = explanation ? (explanation.split('. ')[0] + '.') : `${lesson.title || 'Mavzu'} biologiyaning muhim qismidir.`;
  const keyTakeaway = ai.summary?.split('\n')?.[0] || 'Darsning asosiy mazmunini o\'rganing va tushunib oling.';
  const step1 = {
    type: 'concept',
    id: 'step_concept_1',
    title: lesson.title || 'Mavzuni tushunish',
    conceptBadge: '1-Bosqich: Asosiy Tushuncha',
    text: firstSentence,
    keyTakeaway: keyTakeaway.replace(/^[•\-\*]\s*/, ''),
    explanation: explanation ? (explanation.slice(0, 320) + (explanation.length > 320 ? '...' : '')) : "Ushbu darsning asosiy mazmunini o'rganing va yodda saqlang.",
    xp: 10,
  };

  // 2. Savol-Javob va Test (Multiple choice step - +15 XP)
  const quiz = Array.isArray(ai.quizQuestions) ? ai.quizQuestions : [];
  let step2;
  if (quiz.length > 0) {
    const q = quiz[0];
    const opts = (q.options || []).map(o => typeof o === 'string' ? o : o.text);
    const correctIdx = (q.options || []).findIndex(o => typeof o === 'object' ? o.isCorrect : false);
    step2 = {
      type: 'multiple_choice',
      id: 'step_mc_0',
      question: q.text || q.question || 'To\'g\'ri javobni tanlang',
      options: opts.length ? opts : ['To\'g\'ri javob', 'Noto\'g\'ri variant 1', 'Noto\'g\'ri variant 2', 'Noto\'g\'ri variant 3'],
      correctIndex: correctIdx >= 0 ? correctIdx : 0,
      explanation: q.explanation || `To'g'ri javob: ${opts[correctIdx >= 0 ? correctIdx : 0] || 'birinchi variant'}`,
      conceptBadge: '2-Bosqich: Tezkor Test',
      xp: 15,
    };
  } else {
    step2 = {
      type: 'multiple_choice',
      id: 'step_mc_fallback',
      question: `${lesson.title || 'Mavzu'} bo'yicha qaysi xulosa to'g'ri?`,
      options: [
        `${lesson.title || 'Dars'} tirik organizmlarning biologik jarayonlariga tegishlidir`,
        `Bu mavzuning tirik organizmlarga hech qanday aloqasi yo'q`,
        `Faqat laboratoriyada sun'iy tarzda hosil bo'ladi`,
        `Organik olamda bunday tushuncha mavjud emas`
      ],
      correctIndex: 0,
      explanation: `${lesson.title || 'Mavzu'} biologiyaning ajralmas qismidir.`,
      conceptBadge: '2-Bosqich: Tezkor Test',
      xp: 15,
    };
  }

  // 3. Juftlikni Bog'lash yoki Bo'shliqni To'ldirish (Match pairs or Fill in the blank - +15 XP)
  const flashcards = Array.isArray(ai.flashcards) ? ai.flashcards : [];
  let step3;
  if (flashcards.length >= 2) {
    const pairs = flashcards.slice(0, 4).map((fc, i) => ({
      id: `pair_${i}`,
      left: fc.front || `Atama ${i + 1}`,
      right: fc.back || `Ta'rif ${i + 1}`,
    }));
    step3 = {
      type: 'match_pairs',
      id: 'step_match_1',
      prompt: 'Atamalarni to\'g\'ri ta\'riflari bilan juftlang:',
      pairs,
      conceptBadge: '3-Bosqich: Atamalar Juftligi',
      xp: 15,
    };
  } else {
    const mnemonics = ai.mnemonics || '';
    const rawSentence = mnemonics ? mnemonics.split('.')[0] : (explanation ? (explanation.split('.')[1] || explanation.split('.')[0]) : `${lesson.title || 'Biologiya'} tirik organizmlar tizimidir`);
    const words = rawSentence.replace(/[^\w\s\u0400-\u04FF\']/gi, '').trim().split(/\s+/).filter(w => w.length > 4);
    const targetWord = words.length > 0 ? words[0] : (lesson.title ? lesson.title.split(' ')[0] : 'organizm');
    const sentenceParts = rawSentence.split(new RegExp(`\\b${targetWord}\\b`, 'i'));
    step3 = {
      type: 'fill_blank',
      id: 'step_blank_1',
      sentenceBefore: (sentenceParts[0] || 'Tiriklikning asosi bu ').trim(),
      blankPlaceholder: '______',
      sentenceAfter: (sentenceParts.length > 1 ? sentenceParts.slice(1).join(targetWord).trim() : ' bo\'lib hisoblanadi.'),
      correctWord: targetWord,
      wordBank: [targetWord, 'hujayra', 'genetika', 'ferment'].slice(0, 4).sort(() => Math.random() - 0.5),
      explanation: `To'g'ri so'z: "${targetWord}" edi.`,
      conceptBadge: '3-Bosqich: Bo\'shliqni To\'ldirish',
      xp: 15,
    };
  }

  // 4. So'z Tartibi yoki Yakuniy Mustahkamlash (Word order or Quiz 2 - +10 XP)
  const samplePhrase = lesson.title ? `${lesson.title} biologik jarayonlarning muhim asosidir` : "Biologiya tirik organizmlarni o'rganuvchi asosiy fandir";
  const phraseWords = samplePhrase.split(/\s+/).filter(Boolean);
  let step4;
  if (phraseWords.length >= 4) {
    step4 = {
      type: 'word_order',
      id: 'step_order_1',
      prompt: 'Jumlani to\'g\'ri so\'z tartibida tuzing:',
      targetWords: phraseWords,
      targetSentence: samplePhrase,
      explanation: samplePhrase,
      conceptBadge: '4-Bosqich: So\'z Tartibi',
      xp: 10,
    };
  } else if (quiz.length > 1) {
    const q2 = quiz[1];
    const opts = (q2.options || []).map(o => typeof o === 'string' ? o : o.text);
    const correctIdx = (q2.options || []).findIndex(o => typeof o === 'object' ? o.isCorrect : false);
    step4 = {
      type: 'multiple_choice',
      id: 'step_mc_1',
      question: q2.text || q2.question || 'Mavzuni mustahkamlovchi savol',
      options: opts.length ? opts : ['To\'g\'ri xulosa', 'Noto\'g\'ri fikr 1', 'Noto\'g\'ri fikr 2', 'Noto\'g\'ri fikr 3'],
      correctIndex: correctIdx >= 0 ? correctIdx : 0,
      explanation: q2.explanation || `To'g'ri javob: ${opts[correctIdx >= 0 ? correctIdx : 0] || 'birinchi variant'}`,
      conceptBadge: '4-Bosqich: Mustahkamlash',
      xp: 10,
    };
  } else {
    step4 = {
      type: 'concept',
      id: 'step_summary_4',
      title: 'Yakuniy Xulosa',
      conceptBadge: '4-Bosqich: Yakuniy Xulosa',
      text: ai.summary || `${lesson.title || 'Dars'} bo'yicha barcha asosiy qoidalar muvaffaqiyatli o'rganildi.`,
      keyTakeaway: 'Darsni muvaffaqiyatli yakunladingiz! Bilimlaringizni sinovdan o\'tkazishda davom eting.',
      xp: 10,
    };
  }

  return [step1, step2, step3, step4];
}

export default function DuolingoLessonStepper({ lesson, onClose, onComplete }) {
  const steps = useMemo(() => generateDuolingoSteps(lesson), [lesson]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [earnedXp, setEarnedXp] = useState(0);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [stepStatus, setStepStatus] = useState('idle'); // 'idle' | 'correct' | 'wrong'
  const [isGameOver, setIsGameOver] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Per-step answer states
  const [selectedOption, setSelectedOption] = useState(null); // for multiple_choice
  const [placedBlankWord, setPlacedBlankWord] = useState(null); // for fill_blank
  const [placedOrderWords, setPlacedOrderWords] = useState([]); // for word_order
  const [remainingOrderWords, setRemainingOrderWords] = useState([]); // for word_order
  
  // match_pairs state
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [matchedPairIds, setMatchedPairIds] = useState(new Set());
  const [shuffledPairs, setShuffledPairs] = useState({ left: [], right: [] });
  const [wrongPairShake, setWrongPairShake] = useState(false);

  // Refs for tracking backend step submission & timing
  const stepStartTimeRef = useRef(Date.now());
  const correctStepsCountRef = useRef(0);

  // Backend API: POST /api/lessons/:id/step-submit
  const sendStepSubmit = async (isCorrect, stepType) => {
    if (!lesson?.id) return;
    const now = Date.now();
    const timeSpent = Math.max(1, Math.round((now - stepStartTimeRef.current) / 1000));
    stepStartTimeRef.current = now;
    if (isCorrect) {
      correctStepsCountRef.current += 1;
    }
    try {
      const res = await api.post(`/lessons/${lesson.id}/step-submit`, {
        isCorrect,
        stepType: stepType || currentStep?.type || 'interactive_step',
        timeSpent,
        stepIndex: currentStepIdx + 1,
      });
      const data = res.data?.data;
      if (data?.newXP && useAuthStore.getState()?.user) {
        useAuthStore.setState((prev) => ({
          user: { ...prev.user, xp: data.newXP, level: data.level ?? prev.user.level }
        }));
      }
      return data;
    } catch (err) {
      console.error('Error submitting step:', err);
    }
  };

  // Backend API: POST /api/lessons/:id/quiz-finish
  const sendQuizFinish = async (score, total) => {
    if (!lesson?.id) return;
    try {
      const res = await api.post(`/lessons/${lesson.id}/quiz-finish`, {
        score,
        totalQuestions: total,
        xp: earnedXp,
      });
      const data = res.data?.data;
      if (data?.newXP && useAuthStore.getState()?.user) {
        useAuthStore.setState((prev) => ({
          user: { ...prev.user, xp: data.newXP, level: data.level ?? prev.user.level }
        }));
      }
      return data;
    } catch (err) {
      console.error('Error finishing quiz:', err);
    }
  };

  const currentStep = steps[currentStepIdx] || steps[0];
  const totalSteps = steps.length;
  const progressPercent = Math.min(100, Math.round(((currentStepIdx) / totalSteps) * 100));

  // Reset step-specific state on step change
  useEffect(() => {
    stepStartTimeRef.current = Date.now();
    setStepStatus('idle');
    setSelectedOption(null);
    setPlacedBlankWord(null);
    setSelectedLeft(null);
    setSelectedRight(null);
    setWrongPairShake(false);

    if (currentStep?.type === 'word_order') {
      const words = [...(currentStep.targetWords || [])].sort(() => Math.random() - 0.5);
      setRemainingOrderWords(words);
      setPlacedOrderWords([]);
    } else if (currentStep?.type === 'match_pairs') {
      const pairs = currentStep.pairs || [];
      const leftItems = pairs.map(p => ({ id: p.id, text: p.left })).sort(() => Math.random() - 0.5);
      const rightItems = pairs.map(p => ({ id: p.id, text: p.right })).sort(() => Math.random() - 0.5);
      setShuffledPairs({ left: leftItems, right: rightItems });
      setMatchedPairIds(new Set());
    }
  }, [currentStepIdx, currentStep]);

  // Handle heart loss
  const handleMistake = () => {
    soundEffects.heartLoss();
    setMistakesCount(m => m + 1);
    setHearts(prev => {
      const next = Math.max(0, prev - 1);
      if (next === 0) {
        setIsGameOver(true);
      }
      return next;
    });
  };

  // Check the answer for the current step
  const handleCheckAnswer = () => {
    if (!currentStep) return;

    if (currentStep.type === 'concept') {
      // Concept cards are automatically correct upon acknowledge
      soundEffects.correct();
      setStepStatus('correct');
      setEarnedXp(x => x + (currentStep.xp || 10));
      sendStepSubmit(true, 'concept');
      return;
    }

    if (currentStep.type === 'multiple_choice') {
      if (selectedOption === null) return;
      const isCorrect = selectedOption === currentStep.correctIndex;
      if (isCorrect) {
        soundEffects.correct();
        setStepStatus('correct');
        setEarnedXp(x => x + (currentStep.xp || 15));
      } else {
        soundEffects.wrong();
        setStepStatus('wrong');
        handleMistake();
      }
      sendStepSubmit(isCorrect, 'multiple_choice');
      return;
    }

    if (currentStep.type === 'fill_blank') {
      if (!placedBlankWord) return;
      const isCorrect = placedBlankWord.trim().toLowerCase() === String(currentStep.correctWord).trim().toLowerCase();
      if (isCorrect) {
        soundEffects.correct();
        setStepStatus('correct');
        setEarnedXp(x => x + (currentStep.xp || 15));
      } else {
        soundEffects.wrong();
        setStepStatus('wrong');
        handleMistake();
      }
      sendStepSubmit(isCorrect, 'fill_blank');
      return;
    }

    if (currentStep.type === 'word_order') {
      if (placedOrderWords.length === 0) return;
      const userSentence = placedOrderWords.join(' ').trim().toLowerCase();
      const targetSentence = (currentStep.targetWords || []).join(' ').trim().toLowerCase();
      const isCorrect = userSentence === targetSentence;
      if (isCorrect) {
        soundEffects.correct();
        setStepStatus('correct');
        setEarnedXp(x => x + (currentStep.xp || 20));
      } else {
        soundEffects.wrong();
        setStepStatus('wrong');
        handleMistake();
      }
      sendStepSubmit(isCorrect, 'word_order');
      return;
    }

    if (currentStep.type === 'match_pairs') {
      const totalPairs = (currentStep.pairs || []).length;
      if (matchedPairIds.size === totalPairs) {
        soundEffects.correct();
        setStepStatus('correct');
        setEarnedXp(x => x + (currentStep.xp || 20));
        sendStepSubmit(true, 'match_pairs');
      }
    }
  };

  // Match pairs interaction handler
  const handleSelectPairItem = (side, item) => {
    soundEffects.select();
    if (side === 'left') {
      if (selectedRight) {
        // Evaluate pair
        if (selectedRight.id === item.id) {
          soundEffects.correct();
          const nextMatched = new Set(matchedPairIds).add(item.id);
          setMatchedPairIds(nextMatched);
          setSelectedLeft(null);
          setSelectedRight(null);
          if (nextMatched.size === (currentStep.pairs || []).length) {
            setStepStatus('correct');
            setEarnedXp(x => x + (currentStep.xp || 20));
            sendStepSubmit(true, 'match_pairs');
          }
        } else {
          soundEffects.wrong();
          setWrongPairShake(true);
          handleMistake();
          sendStepSubmit(false, 'match_pairs');
          setTimeout(() => {
            setSelectedLeft(null);
            setSelectedRight(null);
            setWrongPairShake(false);
          }, 600);
        }
      } else {
        setSelectedLeft(item);
      }
    } else {
      if (selectedLeft) {
        // Evaluate pair
        if (selectedLeft.id === item.id) {
          soundEffects.correct();
          const nextMatched = new Set(matchedPairIds).add(item.id);
          setMatchedPairIds(nextMatched);
          setSelectedLeft(null);
          setSelectedRight(null);
          if (nextMatched.size === (currentStep.pairs || []).length) {
            setStepStatus('correct');
            setEarnedXp(x => x + (currentStep.xp || 20));
            sendStepSubmit(true, 'match_pairs');
          }
        } else {
          soundEffects.wrong();
          setWrongPairShake(true);
          handleMistake();
          sendStepSubmit(false, 'match_pairs');
          setTimeout(() => {
            setSelectedLeft(null);
            setSelectedRight(null);
            setWrongPairShake(false);
          }, 600);
        }
      } else {
        setSelectedRight(item);
      }
    }
  };

  // Move to the next step
  const handleNextStep = () => {
    if (currentStepIdx + 1 < totalSteps) {
      setCurrentStepIdx(idx => idx + 1);
    } else {
      soundEffects.victory();
      setIsFinished(true);
      const accuracy = Math.max(0, Math.round(((totalSteps - mistakesCount) / totalSteps) * 100));
      const score = Math.max(0, Math.min(totalSteps, correctStepsCountRef.current || (totalSteps - mistakesCount)));
      sendQuizFinish(score, totalSteps);
      if (onComplete) {
        onComplete({ xp: earnedXp, accuracy, mistakes: mistakesCount, score, totalQuestions: totalSteps });
      }
    }
  };

  // Can check button be clicked?
  const isCheckReady = useMemo(() => {
    if (!currentStep) return false;
    if (currentStep.type === 'concept') return true;
    if (currentStep.type === 'multiple_choice') return selectedOption !== null;
    if (currentStep.type === 'fill_blank') return placedBlankWord !== null;
    if (currentStep.type === 'word_order') return placedOrderWords.length > 0;
    if (currentStep.type === 'match_pairs') return matchedPairIds.size === (currentStep.pairs || []).length;
    return false;
  }, [currentStep, selectedOption, placedBlankWord, placedOrderWords, matchedPairIds]);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--background)] flex flex-col overflow-hidden select-none">
      {/* Top Navigation Bar */}
      <header className="w-full max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-6 border-b border-[var(--border)]">
        {/* Close Button */}
        <button
          onClick={() => setShowExitConfirm(true)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex-shrink-0"
          title="Darsni yopish"
        >
          <X size={22} />
        </button>

        {/* Animated Progress Bar */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400">
            <span>Bosqich {currentStepIdx + 1} / {totalSteps}</span>
            <span className="text-emerald-500 flex items-center gap-1 font-bold">
              <Zap size={12} className="fill-emerald-500 text-emerald-500" /> +{earnedXp} XP
            </span>
          </div>
          <div className="w-full h-3.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-300/30 dark:border-gray-700">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full shadow-sm"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(5, progressPercent)}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Hearts Life Meter */}
        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-2xl border border-rose-200 dark:border-rose-900/50 flex-shrink-0">
          <Heart className={`w-5 h-5 text-rose-500 fill-rose-500 transition-transform ${hearts <= 1 ? 'animate-ping' : ''}`} />
          <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
            {hearts}
          </span>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 overflow-y-auto flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* 1. CONCEPT STEP */}
          {currentStep?.type === 'concept' && (
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2">
                <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5">
                  <Sparkles size={14} /> {currentStep.conceptBadge || 'Yangi qoida'}
                </span>
                <button
                  onClick={() => speakText(`${currentStep.title}. ${currentStep.text}`)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Ovozli eshitish"
                >
                  <Volume2 size={18} />
                </button>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  {currentStep.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg mt-3 leading-relaxed">
                  {currentStep.text}
                </p>
              </div>

              {currentStep.keyTakeaway && (
                <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/20 space-y-1.5">
                  <div className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Award size={14} /> Muhim eslatma
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    "{currentStep.keyTakeaway}"
                  </p>
                </div>
              )}

              {currentStep.explanation && (
                <div className="text-xs text-gray-500 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-[var(--border)]">
                  {currentStep.explanation}
                </div>
              )}
            </motion.div>
          )}

          {/* 2. MULTIPLE CHOICE STEP */}
          {currentStep?.type === 'multiple_choice' && (
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              className="space-y-6"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge bg-primary/10 text-primary font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5">
                    <Sparkles size={14} /> {currentStep.conceptBadge || '2-Bosqich: Savol-Javob'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mt-1 leading-snug">
                  {currentStep.question}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {currentStep.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const letter = String.fromCharCode(65 + idx);

                  return (
                    <button
                      key={idx}
                      disabled={stepStatus !== 'idle'}
                      onClick={() => {
                        soundEffects.select();
                        setSelectedOption(idx);
                      }}
                      className={`group relative w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-3.5
                        ${isSelected
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-md ring-2 ring-primary/30 translate-y-0.5'
                          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 hover:border-primary/40 hover:bg-gray-50 dark:hover:bg-gray-800/60 border-b-4 active:border-b-2 active:translate-y-1'
                        }
                        ${stepStatus === 'correct' && isSelected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600' : ''}
                        ${stepStatus === 'wrong' && isSelected ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-600' : ''}
                      `}
                    >
                      <div className={`w-8 h-8 rounded-xl font-extrabold text-sm flex items-center justify-center flex-shrink-0 transition-colors
                        ${isSelected
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 group-hover:bg-primary/10 group-hover:text-primary'
                        }
                      `}>
                        {letter}
                      </div>
                      <span className="flex-1 text-sm sm:text-base leading-snug">
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 3. MATCH PAIRS STEP */}
          {currentStep?.type === 'match_pairs' && (
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              className="space-y-5"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge bg-primary/10 text-primary font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5">
                    <Sparkles size={14} /> {currentStep.conceptBadge || "3-Bosqich: Juftlash O'yini"}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                  {currentStep.prompt || 'Atamalarni o\'zaro moslashtiring'}
                </h2>
              </div>

              <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${wrongPairShake ? 'animate-shake' : ''}`}>
                {/* Left Column */}
                <div className="space-y-3">
                  {shuffledPairs.left.map((item) => {
                    const isMatched = matchedPairIds.has(item.id);
                    const isSelected = selectedLeft?.id === item.id;

                    return (
                      <button
                        key={item.id}
                        disabled={isMatched}
                        onClick={() => handleSelectPairItem('left', item)}
                        className={`w-full p-3.5 sm:p-4 rounded-2xl border-2 text-center text-xs sm:text-sm font-semibold transition-all min-h-[70px] flex items-center justify-center
                          ${isMatched
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 opacity-60 cursor-default'
                            : isSelected
                            ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/40 shadow-sm'
                            : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:border-primary/40 border-b-4 active:border-b-2 active:translate-y-1'
                          }
                        `}
                      >
                        {item.text}
                        {isMatched && <Check size={14} className="ml-1.5 text-emerald-500 flex-shrink-0 inline" />}
                      </button>
                    );
                  })}
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  {shuffledPairs.right.map((item) => {
                    const isMatched = matchedPairIds.has(item.id);
                    const isSelected = selectedRight?.id === item.id;

                    return (
                      <button
                        key={item.id}
                        disabled={isMatched}
                        onClick={() => handleSelectPairItem('right', item)}
                        className={`w-full p-3.5 sm:p-4 rounded-2xl border-2 text-center text-xs sm:text-sm font-semibold transition-all min-h-[70px] flex items-center justify-center
                          ${isMatched
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 opacity-60 cursor-default'
                            : isSelected
                            ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/40 shadow-sm'
                            : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:border-primary/40 border-b-4 active:border-b-2 active:translate-y-1'
                          }
                        `}
                      >
                        {item.text}
                        {isMatched && <Check size={14} className="ml-1.5 text-emerald-500 flex-shrink-0 inline" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* 4. FILL IN THE BLANK STEP */}
          {currentStep?.type === 'fill_blank' && (
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              className="space-y-6"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge bg-primary/10 text-primary font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5">
                    <Sparkles size={14} /> {currentStep.conceptBadge || "3-Bosqich: Bo'shliqni To'ldirish"}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-1">
                  Jumladagi nuqtalar o'rniga mos so'zni qo'ying:
                </h2>
              </div>

              {/* Sentence Card with Slot */}
              <div className="p-6 rounded-3xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm text-base sm:text-lg text-gray-800 dark:text-gray-100 leading-relaxed">
                <span>{currentStep.sentenceBefore} </span>
                {placedBlankWord ? (
                  <button
                    onClick={() => {
                      soundEffects.select();
                      setPlacedBlankWord(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 mx-1 rounded-xl bg-primary text-white font-bold shadow-xs hover:bg-primary/90 transition-all border-b-2 border-primary/50"
                  >
                    <span>{placedBlankWord}</span>
                    <X size={14} />
                  </button>
                ) : (
                  <span className="inline-block px-4 py-1 mx-1 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 text-primary font-bold min-w-[90px] text-center">
                    {currentStep.blankPlaceholder || '______'}
                  </span>
                )}
                <span> {currentStep.sentenceAfter}</span>
              </div>

              {/* Word Bank */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-400">So'zlar banki:</span>
                <div className="flex flex-wrap gap-2.5">
                  {(currentStep.wordBank || []).map((word, idx) => {
                    const isUsed = placedBlankWord === word;
                    return (
                      <button
                        key={idx}
                        disabled={isUsed || stepStatus !== 'idle'}
                        onClick={() => {
                          soundEffects.select();
                          setPlacedBlankWord(word);
                        }}
                        className={`px-4 py-2.5 rounded-2xl border-2 font-bold text-sm transition-all
                          ${isUsed
                            ? 'border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/40 text-transparent opacity-40 cursor-default'
                            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:border-primary/50 border-b-4 active:border-b-2 active:translate-y-1'
                          }
                        `}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* 5. WORD ORDER STEP */}
          {currentStep?.type === 'word_order' && (
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              className="space-y-6"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge bg-primary/10 text-primary font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5">
                    <Sparkles size={14} /> {currentStep.conceptBadge || "4-Bosqich: So'z Tartibi"}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {currentStep.prompt || 'So\'zlarni to\'g\'ri ketma-ketlikda joylashtiring:'}
                </h2>
              </div>

              {/* Placed Words Canvas */}
              <div className="min-h-[110px] p-4 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex flex-wrap gap-2 items-center">
                {placedOrderWords.length === 0 ? (
                  <span className="text-gray-400 text-xs italic mx-auto">
                    Quyidagi so'zlarni bosib jumlani shakllantiring...
                  </span>
                ) : (
                  placedOrderWords.map((word, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        soundEffects.select();
                        setPlacedOrderWords(prev => prev.filter((_, i) => i !== idx));
                        setRemainingOrderWords(prev => [...prev, word]);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow-xs border-b-2 border-primary/50 flex items-center gap-1.5 hover:bg-primary/90 transition-all"
                    >
                      <span>{word}</span>
                    </button>
                  ))
                )}
              </div>

              {/* Available Word Chips */}
              <div className="flex flex-wrap gap-2.5 justify-center pt-2">
                {remainingOrderWords.map((word, idx) => (
                  <button
                    key={idx}
                    disabled={stepStatus !== 'idle'}
                    onClick={() => {
                      soundEffects.select();
                      setPlacedOrderWords(prev => [...prev, word]);
                      setRemainingOrderWords(prev => prev.filter((_, i) => i !== idx));
                    }}
                    className="px-4 py-2.5 rounded-2xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-bold text-sm border-b-4 hover:border-primary/50 active:border-b-2 active:translate-y-1 transition-all"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Drawer (Duolingo Style) */}
      <footer className="w-full border-t border-[var(--border)] bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-5">
          <AnimatePresence mode="wait">
            {stepStatus === 'correct' ? (
              <motion.div
                key="correct"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-400"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <CheckCircle2 size={26} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-emerald-800 dark:text-emerald-300">
                      Ajoyib! To'g'ri javob! 🎉
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      +{currentStep?.xp || 15} XP qo'shildi. Zo'r ketmoqdasiz!
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleNextStep}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm sm:text-base border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>DAVOM ETISH</span>
                  <ArrowRight size={18} />
                </button>
              </motion.div>
            ) : stepStatus === 'wrong' ? (
              <motion.div
                key="wrong"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-400"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <X size={26} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-base text-rose-800 dark:text-rose-300">
                      Noto'g'ri javob (-1 ❤️)
                    </h3>
                    {currentStep?.explanation && (
                      <p className="text-xs text-rose-700 dark:text-rose-400 max-w-lg leading-relaxed">
                        {currentStep.explanation}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleNextStep}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-sm sm:text-base border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>TUSHUNDIM</span>
                  <ArrowRight size={18} />
                </button>
              </motion.div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                  <HelpCircle size={15} />
                  <span>Javobingizni tanlang va tekshirishni bosing</span>
                </div>

                <button
                  disabled={!isCheckReady}
                  onClick={handleCheckAnswer}
                  className={`w-full sm:w-auto sm:ml-auto px-10 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-2
                    ${isCheckReady
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 shadow-lg shadow-emerald-500/20 cursor-pointer'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed border-b-4 border-gray-300 dark:border-gray-700'
                    }
                  `}
                >
                  <span>{currentStep?.type === 'concept' ? 'TUSHUNDIM' : 'TEKSHIRISH'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </footer>

      {/* GAME OVER MODAL (Hearts = 0) */}
      <AnimatePresence>
        {isGameOver && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card max-w-md w-full p-6 text-center space-y-4 bg-white dark:bg-gray-900 border-2 border-rose-400 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-500 mx-auto flex items-center justify-center text-3xl shadow-sm">
                💔
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                  Jonlaringiz tugadi!
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
                  Xatolar - eng yaxshi o'qituvchi. Jonlarni to'ldiring va mashqni davom ettiring!
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    setHearts(5);
                    setIsGameOver(false);
                    setStepStatus('idle');
                  }}
                  className="w-full btn-primary py-3 rounded-2xl flex items-center justify-center gap-2 font-bold border-b-4 border-primary/50"
                >
                  <RotateCcw size={16} />
                  <span>❤️ Jonlarni to'ldirish va davom etish</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full btn-ghost py-2.5 rounded-2xl text-xs text-gray-500 hover:text-gray-700"
                >
                  Darsga qaytish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VICTORY MODAL */}
      <AnimatePresence>
        {isFinished && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              className="card max-w-md w-full p-6 sm:p-8 text-center space-y-6 bg-white dark:bg-gray-900 border-2 border-emerald-400 shadow-2xl"
            >
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-green-400 text-white flex items-center justify-center shadow-lg">
                  <Trophy size={40} />
                </div>
              </div>

              <div>
                <span className="badge badge-success text-xs font-bold uppercase tracking-wider px-3 py-1">
                  🎉 G'alaba!
                </span>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">
                  Dars muvaffaqiyatli yakunlandi!
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Siz interaktiv Duolingo mashg'ulotini a'lo darajada o'zlashtirdingiz.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-center">
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                    +{earnedXp}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-gray-500 mt-0.5">
                    XP Ball
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center">
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {Math.max(0, Math.round(((totalSteps - mistakesCount) / totalSteps) * 100))}%
                  </div>
                  <div className="text-[10px] uppercase font-bold text-gray-500 mt-0.5">
                    Aniqlik
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center">
                  <div className="text-lg font-black text-rose-600 dark:text-rose-400">
                    {hearts}/5
                  </div>
                  <div className="text-[10px] uppercase font-bold text-gray-500 mt-0.5">
                    Jonlar
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-base border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 shadow-lg shadow-emerald-500/25 transition-all"
              >
                DAVOM ETISH
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EXIT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card max-w-sm w-full p-6 text-center space-y-4 bg-white dark:bg-gray-900 shadow-2xl border border-[var(--border)]"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-gray-900 dark:text-white">
                  Darsni tark etmoqchimisiz?
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Hozir chiqsangiz, to'plangan XP ballaringiz va joriy progress saqlanmasligi mumkin.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 btn-primary py-2.5 rounded-xl text-xs font-bold"
                >
                  Mashqda qolish
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
