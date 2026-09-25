import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

export default function TestRunner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime] = useState(Date.now());

  const { data: test, isLoading } = useQuery({
    queryKey: ['test', id],
    queryFn: () => api.get(`/tests/${id}`).then(r => r.data.data),
  });

  useEffect(() => {
    if (test?.timeLimit) {
      setTimeLeft(test.timeLimit * 60);
    }
  }, [test]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const submitMutation = useMutation({
    mutationFn: (data) => api.post(`/tests/${id}/submit`, data),
    onSuccess: ({ data }) => {
      toast.success(`Test yakunlandi! Natija: ${data.data?.percentage || 0}%`);
      navigate('/student/results');
    },
    onError: (err) => toast.error(err.response?.data?.message || "Testni yuborishda xatolik yuz berdi"),
  });

  const handleSubmit = useCallback(() => {
    if (!test?.questions) return;
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const formattedAnswers = Object.keys(answers).map(qi => {
      const question = test.questions[parseInt(qi)];
      const optionIndex = answers[qi];
      return {
        questionId: question.id,
        answer: question.options?.[optionIndex]?.text,
      };
    });
    submitMutation.mutate({ answers: formattedAnswers, timeTaken });
  }, [answers, test, startTime, submitMutation]);

  useEffect(() => {
    if (test?.timeLimit) {
      setTimeLeft(test.timeLimit * 60);
    }
  }, [test]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setInterval(() => setTimeLeft(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [timeLeft, handleSubmit]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const questions = test?.questions || [];
  const q = questions[current];
  const answered = Object.keys(answers).length;

  const difficultyLabels = {
    easy: 'Oson',
    medium: "O'rta",
    hard: 'Qiyin',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-lg text-gray-800 dark:text-white truncate max-w-md">{test?.title}</h1>
        {timeLeft !== null && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm ${timeLeft < 60 ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400' : 'bg-primary/10 text-primary'}`}>
            <Clock size={14} /> {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{questions.length} tadan {current + 1}-savol</span>
          <span>{answered} ta javob berildi</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full gradient-bg rounded-full transition-all duration-300" style={{ width: `${((current + 1) / (questions.length || 1)) * 100}%` }} />
        </div>
      </div>

      {/* Question dots */}
      <div className="flex gap-1.5 flex-wrap">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
              i === current
                ? 'gradient-bg text-white shadow-sm'
                : answers[i] !== undefined
                ? 'bg-primary/20 text-primary font-bold'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className={`badge text-xs ${
              q?.difficulty === 'easy'
                ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300'
                : q?.difficulty === 'hard'
                ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                : 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300'
            }`}>
              {difficultyLabels[q?.difficulty] || q?.difficulty}
            </span>
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-5 leading-relaxed">{q?.text}</h3>
          <div className="space-y-2.5">
            {q?.options?.map((opt, i) => (
              <button
                key={i}
                onClick={() => setAnswers(a => ({ ...a, [current]: i }))}
                className={`w-full text-left p-3.5 rounded-xl border-2 transition-all text-sm ${
                  answers[current] === i
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/40 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100'
                }`}
              >
                <span className="font-semibold mr-2 text-gray-400">{String.fromCharCode(65 + i)}.</span> {opt.text}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          className="btn-ghost flex items-center gap-1 disabled:opacity-40"
        >
          <ChevronLeft size={16} /> Oldingi
        </button>

        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent(current + 1)}
            className="btn-primary flex items-center gap-1"
          >
            Keyingi <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            <Send size={15} /> {submitMutation.isPending ? 'Yuborilmoqda...' : 'Testni yakunlash'}
          </button>
        )}
      </div>
    </div>
  );
}
