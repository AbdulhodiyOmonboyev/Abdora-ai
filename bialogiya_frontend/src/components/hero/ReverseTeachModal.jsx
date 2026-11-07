import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mic, Send, Loader2, CheckCircle2, Award, X, Volume2 } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

export default function ReverseTeachModal({ isOpen, onClose, lessonTitle, lessonId, hero, onCompleted }) {
  const [explanation, setExplanation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const heroName = hero?.name || 'Sehrgar Do\'st';
  const raceIcon = hero?.raceIcon || '🧝';

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return toast.error('Brauzeringiz ovozli yozishni qo\'llab-quvvatlamaydi. Matn yozishingiz mumkin.');
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'uz-UZ';
      recognition.interimResults = false;
      recognition.continuous = false;

      setIsRecording(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setExplanation(prev => (prev ? prev + ' ' + transcript : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (e) {
      setIsRecording(false);
      toast.error('Mikrofonni ishga tushirib bo\'lmadi');
    }
  };

  const handleSubmit = async () => {
    if (!explanation.trim()) {
      return toast.error('Iltimos, o\'z so\'zlaringiz bilan tushuntirib bering!');
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/student/hero/reverse-teach', {
        lessonId,
        lessonTitle,
        studentExplanation: explanation.trim(),
      });

      setResult(res.data?.data);
      if (onCompleted) {
        onCompleted(res.data?.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    setResult(null);
    setExplanation('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 15 }}
        className="w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-red-500 p-1.5 rounded-xl hover:bg-[var(--secondary-background)]"
        >
          <X size={16} />
        </button>

        {!result ? (
          <div className="space-y-4">
            {/* Header: Buddy asks question */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <span className="text-4xl p-2 rounded-2xl bg-[var(--card)] shadow-xs flex-shrink-0">
                {raceIcon}
              </span>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm text-primary mb-1">
                  <span>{heroName}</span>
                  <span className="badge text-[10px] py-0 px-2 bg-primary/20 text-primary">Do'sting</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  "Voy do'stim! <b>{lessonTitle}</b> mavzusida men bir narsani unutib qo'ydim... Bu mavzuning asosiy g'oyasini menga o'z so'zlaring bilan tushuntirib bera olasanmi?"
                </p>
              </div>
            </div>

            {/* Explanation Input Area */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center justify-between">
                <span>Sening tushuntirishing:</span>
                <span className="text-[11px] text-[var(--text-muted)] font-normal">
                  Yozing yoki ovoz bilan ayting 🎙️
                </span>
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Masalan: Bu mavzuda biz DNK nimaligini ko'rdik, u xuddi tanamizning xotirasi va retsept kitobiga o'xshaydi..."
                rows={4}
                className="input-field text-sm font-medium w-full resize-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={startVoiceInput}
                className={`btn-ghost text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 border border-[var(--border)] ${
                  isRecording ? 'text-red-500 animate-pulse border-red-500 font-bold' : 'text-[var(--text-secondary)]'
                }`}
                title="Ovoz bilan aytish"
              >
                <Mic size={15} />
                <span>{isRecording ? 'Tinglamoqda...' : 'Ovoz bilan aytish'}</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !explanation.trim()}
                className="btn-primary py-2.5 px-5 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Do'sting tushunmoqda...
                  </>
                ) : (
                  <>
                    <Send size={15} /> Tushuntirishni yuborish
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Result feedback */
          <div className="text-center space-y-4 py-2">
            <div className="w-16 h-16 rounded-full gradient-bg text-white flex items-center justify-center mx-auto shadow-glow text-3xl">
              {raceIcon}
            </div>

            <div>
              <h3 className="font-bold text-base text-[var(--text-primary)] mb-1">
                {heroName} xursand bo'ldi! 🎉
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed bg-[var(--secondary-background)] p-3.5 rounded-2xl border border-[var(--border)]">
                "{result.feedback}"
              </p>
            </div>

            <div className="inline-flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Award size={18} />
              <span>+{result.awardedXp || 50} XP va +{result.awardedCoins || 10} tanga mukofot!</span>
            </div>

            <div className="pt-2">
              <button
                onClick={handleFinish}
                className="btn-primary w-full py-3 rounded-xl font-bold text-sm shadow-md"
              >
                Davom etish (Yakuniy Testga o'tish) →
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
