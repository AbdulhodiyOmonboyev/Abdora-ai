import { getSubjectIcon, getSubjectBadgeClass, getSubjectLabel } from '../../utils/subjects';
import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Brain, Lightbulb, BookOpen, Repeat, FileText, Map, Volume2, VolumeX,
  MessageSquare, Users, ArrowLeft, RefreshCw, ChevronLeft, ChevronRight,
  Send, Loader2, Play, Pause, Square, Check, X, Download, Clapperboard, Mic,
  Sparkles, HelpCircle, Layers, Award, CheckCircle, Clock, Flame,
  ArrowRight, Trophy, ThumbsUp, AlertTriangle, CheckCircle2, AlertCircle, ShieldCheck, Pencil, Trash2, Plus
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import StoryAudioPlayer from '../../components/ai/StoryAudioPlayer';
import ExplainerVideoPlayer from '../../components/ai/ExplainerVideoPlayer';
import SpeakingPractice from '../../components/ai/SpeakingPractice';


const TABS = [
  { id: 'overview', icon: BookOpen, key: 'overview', label: 'Overview' },
  { id: 'explain', icon: Brain, key: 'ai_explanation', label: 'AI Explain' },
  { id: 'tricks', icon: Lightbulb, key: 'memory_tricks', label: 'Mnemonics' },
  { id: 'story', icon: FileText, key: 'story_mode', label: 'Story' },
  { id: 'examples', icon: Repeat, key: 'real_examples', label: 'Examples' },
  { id: 'quiz', icon: Check, key: 'ai_quiz', label: 'Quiz' },
  { id: 'flashcards', icon: Repeat, key: 'flashcards', label: 'Flashcards' },
  { id: 'summary', icon: FileText, key: 'summary', label: 'Summary' },
  { id: 'mindmap', icon: Map, key: 'mind_map', label: 'Mind Map' },
  { id: 'voice', icon: Volume2, key: 'voice_teacher', label: 'Voice' },
  { id: 'video', icon: Clapperboard, key: 'explainer_video', label: 'Video' },
  { id: 'speaking', icon: Mic, key: 'speaking_practice', label: 'Speaking' },
  { id: 'chat', icon: MessageSquare, key: 'ai_chat', label: 'AI Chat' },
];

const CHAT_STYLES = [
  { id: 'normal', label: 'Normal' },
  { id: 'like_im_10', label: "Like I'm 10" },
  { id: 'emoji', label: 'With Emojis' },
  { id: 'step_by_step', label: 'Step by Step' },
  { id: 'with_examples', label: 'With Examples' },
];

// Flashcard component
function FlashcardDeck({ cards }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  if (!cards?.length) return <div className="text-gray-400 text-center py-10">Fleshkartalar mavjud emas</div>;
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-sm text-gray-500">{idx + 1} / {cards.length}</div>
      <div className="cursor-pointer w-full max-w-lg" style={{ perspective: '1000px' }} onClick={() => setFlipped(!flipped)}>
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5 }}
          style={{ transformStyle: 'preserve-3d', position: 'relative', height: '220px' }}
        >
          <div style={{ backfaceVisibility: 'hidden' }}
            className="absolute inset-0 gradient-bg rounded-3xl flex items-center justify-center p-8 text-white text-center">
            <div>
              <div className="text-xs uppercase tracking-wider opacity-70 mb-3">Savol</div>
              <p className="text-lg font-semibold">{cards[idx]?.front}</p>
            </div>
          </div>
          <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            className="absolute inset-0 bg-white dark:bg-gray-900 border-2 border-primary/30 rounded-3xl flex items-center justify-center p-8 text-center shadow-soft">
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-3">Javob</div>
              <p className="text-gray-800 dark:text-white font-medium">{cards[idx]?.back}</p>
            </div>
          </div>
        </motion.div>
      </div>
      <p className="text-xs text-gray-400">Ag'darish uchun kartani bosing</p>
      <div className="flex items-center gap-3">
        <button onClick={() => { setIdx(Math.max(0, idx - 1)); setFlipped(false); }}
          disabled={idx === 0} className="btn-ghost p-2 disabled:opacity-40">
          <ChevronLeft size={20} />
        </button>
        <div className="flex gap-1">
          {cards.map((_, i) => (
            <button key={i} onClick={() => { setIdx(i); setFlipped(false); }}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-primary w-4' : 'bg-gray-200'}`} />
          ))}
        </div>
        <button onClick={() => { setIdx(Math.min(cards.length - 1, idx + 1)); setFlipped(false); }}
          disabled={idx === cards.length - 1} className="btn-ghost p-2 disabled:opacity-40">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

// Teacher Quiz Review Component
function TeacherQuizReview({ questions = [], onSaveQuestions }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newQ, setNewQ] = useState({
    text: '',
    difficulty: 'medium',
    explanation: '',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  });

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditForm(JSON.parse(JSON.stringify(questions[index])));
  };

  const handleSaveEdit = () => {
    if (!editForm.text) return toast.error('Savol matnini kiriting');
    if (editForm.options?.some(o => !o.text)) return toast.error('Barcha variantlarni to\'ldiring');
    if (!editForm.options?.some(o => o.isCorrect)) return toast.error('Bitta to\'g\'ri variantni tanlang');

    const updated = [...questions];
    updated[editingIndex] = editForm;
    onSaveQuestions(updated);
    setEditingIndex(null);
    setEditForm(null);
    toast.success('Savol saqlandi');
  };

  const handleDelete = (index) => {
    if (questions.length <= 1) return toast.error('Kamida bitta savol qolishi kerak');
    const updated = questions.filter((_, i) => i !== index);
    onSaveQuestions(updated);
    toast.success('Savol o\'chirildi');
  };

  const handleAdd = () => {
    if (!newQ.text) return toast.error('Savol matnini kiriting');
    if (newQ.options?.some(o => !o.text)) return toast.error('Barcha variantlarni to\'ldiring');
    const updated = [...questions, newQ];
    onSaveQuestions(updated);
    setIsAdding(false);
    setNewQ({
      text: '',
      difficulty: 'medium',
      explanation: '',
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    });
    toast.success('Yangi savol qo\'shildi');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div>
          <h3 className="font-bold text-base text-gray-800 dark:text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" /> AI Test savollari ({questions.length} ta)
          </h3>
          <p className="text-xs text-gray-500">To'g'ri va noto'g'ri javoblarni tekshiring, xatolarni to'g'rilang</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
            <Plus size={14} /> Savol qo'shish
          </button>
        )}
      </div>

      {isAdding && (
        <div className="p-4 rounded-2xl border-2 border-primary/40 bg-primary/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-primary">Yangi savol qo'shish</span>
            <button onClick={() => setIsAdding(false)} className="btn-ghost p-1 text-gray-400"><X size={14} /></button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Savol matni *</label>
            <input value={newQ.text} onChange={e => setNewQ(q => ({ ...q, text: e.target.value }))}
              placeholder="Masalan: Fotosintez qaysi organoidda amalga oshadi?" className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Variantlar (To'g'risini belgilang) *</label>
            <div className="space-y-2">
              {newQ.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input type="radio" name="newQ_correct" checked={opt.isCorrect}
                    onChange={() => setNewQ(q => ({ ...q, options: q.options.map((o, j) => ({ ...o, isCorrect: j === oi })) }))}
                    className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold w-5">{String.fromCharCode(65 + oi)})</span>
                  <input value={opt.text} onChange={e => setNewQ(q => ({ ...q, options: q.options.map((o, j) => j === oi ? { ...o, text: e.target.value } : o) }))}
                    placeholder={`Variant ${String.fromCharCode(65 + oi)}`} className="input-field text-xs py-1.5 flex-1" />
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Qiyinlik darajasi</label>
              <select value={newQ.difficulty} onChange={e => setNewQ(q => ({ ...q, difficulty: e.target.value }))} className="input-field text-xs py-1.5">
                <option value="easy">Oson (Easy)</option>
                <option value="medium">O'rta (Medium)</option>
                <option value="hard">Qiyin (Hard)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tushuntirish (ixtiyoriy)</label>
              <input value={newQ.explanation} onChange={e => setNewQ(q => ({ ...q, explanation: e.target.value }))}
                placeholder="Nega aynan shu javob to'g'ri?" className="input-field text-xs py-1.5" />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setIsAdding(false)} className="btn-ghost text-xs py-1.5 px-3">Bekor qilish</button>
            <button onClick={handleAdd} className="btn-primary text-xs py-1.5 px-4">Qo'shish</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {questions.map((q, qi) => {
          const isEditing = editingIndex === qi;

          if (isEditing) {
            return (
              <div key={qi} className="p-4 rounded-2xl border-2 border-primary/40 bg-white dark:bg-gray-900 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-primary">Savol {qi + 1} ni tahrirlash</span>
                  <button onClick={() => { setEditingIndex(null); setEditForm(null); }} className="btn-ghost p-1 text-gray-400"><X size={14} /></button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Savol matni</label>
                  <textarea value={editForm.text} onChange={e => setEditForm(f => ({ ...f, text: e.target.value }))}
                    className="input-field text-sm resize-none" rows={2} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Variantlar (To'g'risini tanlang)</label>
                  <div className="space-y-2">
                    {editForm.options?.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`editQ_${qi}_correct`} checked={opt.isCorrect}
                          onChange={() => setEditForm(f => ({ ...f, options: f.options.map((o, j) => ({ ...o, isCorrect: j === oi })) }))}
                          className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold w-5">{String.fromCharCode(65 + oi)})</span>
                        <input value={opt.text} onChange={e => setEditForm(f => ({ ...f, options: f.options.map((o, j) => j === oi ? { ...o, text: e.target.value } : o) }))}
                          className="input-field text-xs py-1.5 flex-1" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Qiyinlik darajasi</label>
                    <select value={editForm.difficulty} onChange={e => setEditForm(f => ({ ...f, difficulty: e.target.value }))} className="input-field text-xs py-1.5">
                      <option value="easy">Oson (Easy)</option>
                      <option value="medium">O'rta (Medium)</option>
                      <option value="hard">Qiyin (Hard)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tushuntirish</label>
                    <input value={editForm.explanation || ''} onChange={e => setEditForm(f => ({ ...f, explanation: e.target.value }))}
                      className="input-field text-xs py-1.5" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button onClick={() => { setEditingIndex(null); setEditForm(null); }} className="btn-ghost text-xs py-1.5 px-3">Bekor</button>
                  <button onClick={handleSaveEdit} className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1">
                    <Check size={13} /> Saqlash
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={qi} className="p-4 rounded-2xl border border-[var(--border)] bg-white dark:bg-gray-900/60 hover:border-primary/30 transition-all space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 flex-1">
                  <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {qi + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{q.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge text-[11px] py-0 px-2 ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300' : q.difficulty === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300'}`}>
                        {q.difficulty}
                      </span>
                      {q.points && <span className="text-[11px] text-gray-400">{q.points} ball</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(qi)} className="btn-ghost p-1.5 rounded-lg text-primary hover:bg-primary/10" title="Savolni tahrirlash">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(qi)} className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30" title="O'chirish">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Options display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {q.options?.map((opt, oi) => (
                  <div key={oi} className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${opt.isCorrect ? 'bg-green-50/80 dark:bg-green-950/20 border-green-300 dark:border-green-800 text-green-800 dark:text-green-300 font-medium' : 'bg-gray-50/50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400'}`}>
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold opacity-75">{String.fromCharCode(65 + oi)}.</span>
                      <span className="truncate">{opt.text}</span>
                    </div>
                    {opt.isCorrect && (
                      <span className="badge text-[10px] bg-green-200/70 dark:bg-green-900/60 text-green-800 dark:text-green-200 flex items-center gap-1 flex-shrink-0">
                        <Check size={10} /> To'g'ri
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div className="text-xs bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800">
                  <span className="font-semibold text-primary">Tushuntirish: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Quiz component
function QuizSection({ questions = [], isTeacher = false, onSaveQuestions }) {
  const [viewMode, setViewMode] = useState(isTeacher ? 'review' : 'play');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!questions?.length) return <div className="text-gray-400 text-center py-10">No quiz questions available</div>;

  return (
    <div>
      {isTeacher && (
        <div className="flex items-center justify-end gap-1 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit ml-auto">
          <button
            onClick={() => setViewMode('review')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${viewMode === 'review' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary font-semibold' : 'text-gray-500'}`}
          >
            O'qituvchi tekshiruvi ({questions.length})
          </button>
          <button
            onClick={() => { setViewMode('play'); setAnswers({}); setCurrent(0); setSubmitted(false); }}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${viewMode === 'play' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary font-semibold' : 'text-gray-500'}`}
          >
            O'quvchi rejimi (Test)
          </button>
        </div>
      )}

      {isTeacher && viewMode === 'review' ? (
        <TeacherQuizReview questions={questions} onSaveQuestions={onSaveQuestions} />
      ) : submitted ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
          <div className="flex justify-center mb-4">
            {Object.keys(answers).filter(i => questions[parseInt(i)]?.options?.[answers[i]]?.isCorrect).length >= questions.length * 0.8 ? (
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center">
                <Trophy size={36} />
              </div>
            ) : Object.keys(answers).filter(i => questions[parseInt(i)]?.options?.[answers[i]]?.isCorrect).length >= questions.length * 0.6 ? (
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center">
                <ThumbsUp size={36} />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center">
                <BookOpen size={36} />
              </div>
            )}
          </div>
          <h3 className="text-2xl font-bold gradient-text">
            {Object.keys(answers).filter(i => questions[parseInt(i)]?.options?.[answers[i]]?.isCorrect).length}/{questions.length}
          </h3>
          <p className="text-gray-500 mt-2">
            {Math.round((Object.keys(answers).filter(i => questions[parseInt(i)]?.options?.[answers[i]]?.isCorrect).length / questions.length) * 100)}% to'g'ri
          </p>
          <div className="mt-6 space-y-3 text-left max-w-xl mx-auto">
            {questions.map((qi, i) => {
              const isCorrect = qi.options?.[answers[i]]?.isCorrect;
              const correctIdx = qi.options?.findIndex(o => o.isCorrect);
              return (
                <div key={i} className={`p-3 rounded-xl border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="text-sm font-medium">{qi.text}</div>
                  {!isCorrect && (
                    <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check size={12} /> <span>{qi.options?.[correctIdx]?.text}</span>
                    </div>
                  )}
                  {qi.explanation && <div className="text-xs text-gray-500 mt-1">{qi.explanation}</div>}
                </div>
              );
            })}
          </div>
          <button onClick={() => { setAnswers({}); setCurrent(0); setSubmitted(false); }} className="btn-primary mt-6">
            Qaytadan sinash
          </button>
        </motion.div>
      ) : (
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Savol {current + 1}/{questions.length}</span>
            <span className={`badge text-xs ${questions[current]?.difficulty === 'easy' ? 'bg-green-100 text-green-700' : questions[current]?.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {questions[current]?.difficulty}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full mb-6">
            <div className="h-full gradient-bg rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{questions[current]?.text}</h3>
          <div className="space-y-3">
            {questions[current]?.options?.map((opt, i) => (
              <button key={i} onClick={() => setAnswers(a => ({ ...a, [current]: i }))}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all text-sm ${answers[current] === i ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-gray-100 hover:border-gray-200 bg-white dark:bg-gray-900'}`}>
                <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span> {opt.text}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-6">
            <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}
              className="btn-ghost disabled:opacity-40">← Oldingi</button>
            {current < questions.length - 1 ? (
              <button onClick={() => setCurrent(current + 1)} disabled={answers[current] === undefined}
                className="btn-primary disabled:opacity-40">Keyingi →</button>
            ) : (
              <button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < questions.length}
                className="btn-primary disabled:opacity-40">Testni topshirish</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// MindMap simple SVG renderer
function MindMap({ data }) {
  if (!data?.nodes?.length) return <div className="text-gray-400 text-center py-10">Fikr xaritasi mavjud emas</div>;
  const center = data.nodes.find(n => n.type === 'center') || data.nodes[0];
  const others = data.nodes.filter(n => n.id !== center.id);
  const cx = 400, cy = 200;
  return (
    <div className="overflow-x-auto">
      <svg viewBox="0 0 800 400" className="w-full max-w-2xl mx-auto">
        {data.edges?.map((e, i) => {
          const src = data.nodes.find(n => n.id === e.source);
          const tgt = data.nodes.find(n => n.id === e.target);
          if (!src || !tgt) return null;
          const sx = src.x || cx, sy = src.y || cy;
          const tx = tgt.x || cx, ty = tgt.y || cy;
          return <line key={i} x1={sx} y1={sy} x2={tx} y2={ty} stroke="#00BFA620" strokeWidth="2" />;
        })}
        {data.nodes.map((node, i) => {
          const x = node.x || (i === 0 ? cx : cx + (i % 2 === 0 ? -180 : 180) * (Math.ceil(i / 2) * 0.6));
          const y = node.y || (i === 0 ? cy : cy + (i % 3 - 1) * 100);
          const isCenter = node.type === 'center' || i === 0;
          return (
            <g key={node.id}>
              <ellipse cx={x} cy={y} rx={isCenter ? 70 : 55} ry={isCenter ? 28 : 22}
                fill={isCenter ? '#00BFA6' : '#EAF4F4'} stroke={isCenter ? '#009985' : '#00BFA640'} strokeWidth="2" />
              <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize={isCenter ? 13 : 11} fontWeight={isCenter ? '700' : '500'}
                fill={isCenter ? 'white' : '#374151'}>
                {(node.label || '').length > 14 ? node.label.slice(0, 12) + '…' : node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Voice player - Gemini TTS (fixed voice, always good Uzbek pronunciation),
// same caching pattern as StoryAudioPlayer. Replaces the old browser
// speechSynthesis version, which depended on whatever voices happened to be
// installed on the device and often had no decent Uzbek voice at all.
function VoiceSection({ lessonId, title }) {
  const audioRef = useRef(null);
  const objectUrlRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | playing | error

  useEffect(() => {
    return () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); };
  }, []);

  const speak = async () => {
    if (audioRef.current && objectUrlRef.current) {
      audioRef.current.play();
      setStatus('playing');
      return;
    }
    setStatus('loading');
    try {
      const res = await api.get(`/lessons/${lessonId}/ai/voice-audio`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      objectUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setStatus('idle');
      await audio.play();
      setStatus('playing');
    } catch (err) {
      console.error(err);
      toast.error("Ovozni yuklab bo'lmadi");
      setStatus('error');
    }
  };

  const stop = () => { audioRef.current?.pause(); setStatus('idle'); };
  const playing = status === 'playing';
  const loading = status === 'loading';

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 gradient-bg rounded-full mx-auto mb-4 flex items-center justify-center shadow-glow">
        <Volume2 size={36} className="text-white" />
      </div>
      <h3 className="font-bold text-gray-800 dark:text-white mb-2">AI ovozli o'qituvchi</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">Darsni ovozli tinglang — o'zbekcha AI narratsiya.</p>

      <div className="flex items-center justify-center gap-3">
        {!playing ? (
          <button onClick={speak} disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {loading ? 'Yuklanmoqda...' : 'Tinglashni boshlash'}
          </button>
        ) : (
          <button onClick={stop} className="btn-outline flex items-center gap-2">
            <Square size={16} /> To'xtatish
          </button>
        )}
      </div>

      {playing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex items-center justify-center gap-1">
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div key={i} animate={{ scaleY: [1, 2, 1] }} transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
              className="w-1.5 h-4 bg-primary rounded-full" />
          ))}
        </motion.div>
      )}
    </div>
  );
}

// AI Chat section
function AIChatSection({ lessonId, i18nLanguage }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [style, setStyle] = useState('normal');
  const [lang, setLang] = useState(i18nLanguage || 'uz');
  const bottomRef = useRef(null);

  const { data: history, isLoading: histLoading } = useQuery({
    queryKey: ['ai-chat-history', lessonId],
    queryFn: () => api.get(`/lessons/${lessonId}/ai-chat/history`).then(r => r.data.data?.messages || []),
  });

  useEffect(() => {
    if (history) setMessages(history);
  }, [history]);

  const sendMsg = useMutation({
    mutationFn: (data) => api.post(`/lessons/${lessonId}/ai-chat`, data),
    onMutate: ({ message }) => {
      setMessages(prev => [...prev, { role: 'user', content: message, timestamp: new Date() }]);
      setInput('');
    },
    onSuccess: ({ data }) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }]);
    },
    onError: () => toast.error('AI is unavailable. Try again.'),
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="flex flex-col h-[500px]">
      {/* Controls */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <select value={style} onChange={e => setStyle(e.target.value)} className="input-field text-xs py-1.5 flex-1 min-w-[140px]">
          {CHAT_STYLES.map(s => <option key={s.id} value={s.id}>{t(`explain_${s.id === 'normal' ? 'normal' : s.id === 'like_im_10' ? 'kid' : s.id === 'emoji' ? 'emoji' : s.id === 'step_by_step' ? 'steps' : 'examples'}`)}</option>)}
        </select>
        <select value={lang} onChange={e => setLang(e.target.value)} className="input-field text-xs py-1.5 flex-1 min-w-[100px]">
          <option value="uz">O'zbek</option>
          <option value="ru">Русский</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Ushbu dars haqida Abdora AI'dan istalgan narsani so'rang</p>
          </div>
        )}
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 gradient-bg rounded-full flex items-center justify-center text-white text-xs mr-2 flex-shrink-0 mt-0.5">N</div>
            )}
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
              m.role === 'user'
                ? 'gradient-bg text-white rounded-br-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-sm'
            }`}>
              {m.content}
            </div>
          </motion.div>
        ))}
        {sendMsg.isPending && (
          <div className="flex gap-2">
            <div className="w-7 h-7 gradient-bg rounded-full flex items-center justify-center text-white text-xs">N</div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, delay: i * 0.15, repeat: Infinity }}
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && input.trim() && sendMsg.mutate({ message: input.trim(), style, language: lang })}
          placeholder={t('ask_ai')}
          className="input-field flex-1 text-sm"
          disabled={sendMsg.isPending}
        />
        <button
          onClick={() => input.trim() && sendMsg.mutate({ message: input.trim(), style, language: lang })}
          disabled={!input.trim() || sendMsg.isPending}
          className="btn-primary px-3 py-2.5 disabled:opacity-40"
        >
          {sendMsg.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function LessonDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => api.get(`/lessons/${id}`).then(r => r.data.data),
    refetchInterval: (data) => data?.aiContent?.status === 'generating' ? 3000 : false,
  });

  const regenerateMutation = useMutation({
    mutationFn: () => api.post(`/lessons/${id}/regenerate-ai`, { language: i18n.language }),
    onSuccess: () => { toast.success('AI regeneration started'); queryClient.invalidateQueries(['lesson', id]); },
  });

  const downloadAtt = useMutation({
    mutationFn: async (att) => {
      const res = await api.get(`/files/${att.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.name || 'file';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    onError: () => toast.error('Faylni yuklab bo‘lmadi'),
  });

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const [editingField, setEditingField] = useState(null);
  const [editText, setEditText] = useState('');

  const updateAiMutation = useMutation({
    mutationFn: (payload) => api.put(`/lessons/${id}/ai`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['lesson', id]);
      toast.success("AI ma'lumotlari muvaffaqiyatli saqlandi");
      setEditingField(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xatolik yuz berdi'),
  });

  const handleStartEditText = (field, currentVal) => {
    setEditingField(field);
    setEditText(typeof currentVal === 'string' ? currentVal : '');
  };

  const handleSaveText = (field) => {
    updateAiMutation.mutate({ [field]: editText });
  };

  const ai = lesson?.aiContent;
  const isGenerating = ai?.status === 'generating';
  const isDone = ai?.status === 'done';
  const isError = ai?.status === 'error';

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Dars yuklanmoqda...</p>
      </div>
    </div>
  );

  return (
    <div className="dashboard-shell max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <header className="dashboard-header">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <Link to={user?.role === 'teacher' ? '/teacher/lessons' : '/student/lessons'} className="header-button flex-shrink-0">
              <ArrowLeft size={16} /> Orqaga
            </Link>
            <span className="dashboard-badge"><BookOpen size={12} /> Abdora AI</span>
          </div>
          <h1>{lesson?.title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`badge ${getSubjectBadgeClass(lesson?.subject)}`}>
              {getSubjectIcon(lesson?.subject)} {getSubjectLabel(lesson?.subject)}
            </span>
            <span className={`badge ${isDone ? 'bg-primary/10 text-primary' : isGenerating ? 'bg-yellow-100 text-yellow-700' : isError ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
              {isDone ? (
                <span className="inline-flex items-center gap-1"><Check size={12} /> AI Ready</span>
              ) : isGenerating ? (
                <span className="inline-flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Generating...</span>
              ) : isError ? (
                <span className="inline-flex items-center gap-1"><AlertTriangle size={12} /> Error</span>
              ) : (
                '• Pending'
              )}
            </span>
            {isTeacher && isDone && (
              <span className={`badge text-xs ${ai?.isVerifiedByTeacher ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                {ai?.isVerifiedByTeacher ? (
                  <span className="inline-flex items-center gap-1"><ShieldCheck size={12} /> O'qituvchi tasdiqlagan</span>
                ) : (
                  <span className="inline-flex items-center gap-1"><AlertCircle size={12} /> Tekshiruv kutilmoqda</span>
                )}
              </span>
            )}
          </div>
        </div>
        {(isError || isDone) && (
          <button onClick={() => regenerateMutation.mutate()} disabled={regenerateMutation.isPending}
            className="header-button">
            <RefreshCw size={16} className={regenerateMutation.isPending ? 'animate-spin' : ''} />
          </button>
        )}
      </header>

      {/* Teacher AI Verification Bar */}
      {isTeacher && isDone && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${ai?.isVerifiedByTeacher ? 'bg-green-50/80 dark:bg-green-950/20 border-green-200 dark:border-green-800/60' : 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ai?.isVerifiedByTeacher ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'}`}>
              {ai?.isVerifiedByTeacher ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-2">
                {ai?.isVerifiedByTeacher ? "O'qituvchi tomonidan tasdiqlangan" : "AI materiallari tekshiruv kutilmoqda"}
                {ai?.isVerifiedByTeacher && <span className="badge text-[10px] bg-green-200 text-green-800">To'g'ri</span>}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {ai?.isVerifiedByTeacher
                  ? "Darsdagi barcha AI tushuntirishlari va test savollari tekshirildi va tasdiqlandi."
                  : "AI tuzgan testlar va tushuntirishlarni ko'rib chiqing. Hammasi to'g'ri bo'lsa, tasdiqlang."}
              </div>
            </div>
          </div>
          {!ai?.isVerifiedByTeacher ? (
            <button
              onClick={() => updateAiMutation.mutate({ isVerifiedByTeacher: true })}
              disabled={updateAiMutation.isPending}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 flex-shrink-0 shadow-sm"
            >
              <CheckCircle2 size={15} /> Hammasini to'g'ri deb tasdiqlash
            </button>
          ) : (
            <button
              onClick={() => updateAiMutation.mutate({ isVerifiedByTeacher: false })}
              disabled={updateAiMutation.isPending}
              className="btn-ghost text-xs py-1.5 px-3 rounded-lg text-gray-500 hover:text-gray-700 flex-shrink-0"
            >
              Qayta tekshirish holatiga o'tkazish
            </button>
          )}
        </div>
      )}

      {/* AI Generating banner */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="gradient-bg rounded-2xl p-4 text-white flex items-center gap-3">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
              <Brain size={20} />
            </motion.div>
            <div>
              <div className="font-semibold text-sm">AI ushbu dars uchun kontent yaratmoqda...</div>
              <div className="text-white/70 text-xs">Tushuntirishlar, testlar, fleshkartalar va boshqalar tez orada tayyor bo'ladi</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content + section navigator */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="panel-card"
          >
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-lg font-bold mb-4">{lesson?.title}</h2>
              <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {lesson?.content || <span className="text-gray-400 italic">Ushbu dars uchun kontent kiritilmagan.</span>}
              </div>
              {lesson?.attachments?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-200">Ilovalar</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {lesson.attachments.map((att, i) => (
                      <button key={i} onClick={() => downloadAtt.mutate(att)} disabled={downloadAtt.isPending}
                        className="flex items-center gap-2 p-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors text-sm text-left">
                        <Download size={16} className="flex-shrink-0" />
                        <span className="truncate flex-1">{att.name}</span>
                        {downloadAtt.isPending && downloadAtt.variables === att && <Loader2 size={14} className="animate-spin" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'explain' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold gradient-text">Oddiy tushuntirish</h2>
                {isTeacher && editingField !== 'simpleExplanation' && (
                  <button onClick={() => handleStartEditText('simpleExplanation', ai?.simpleExplanation)}
                    className="btn-ghost text-xs px-2.5 py-1 rounded-lg text-primary hover:bg-primary/10 flex items-center gap-1.5">
                    <Pencil size={13} /> Tahrirlash
                  </button>
                )}
              </div>
              {editingField === 'simpleExplanation' ? (
                <div className="space-y-3">
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={7} className="input-field text-sm" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingField(null)} className="btn-ghost text-xs py-1.5 px-3">Bekor</button>
                    <button onClick={() => handleSaveText('simpleExplanation')} disabled={updateAiMutation.isPending}
                      className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5">
                      <Check size={14} /> Saqlash
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{ai?.simpleExplanation}</div>
              )}
            </div>
          )}
          {activeTab === 'tricks' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold gradient-text">Xotira usullari va mnemonika</h2>
                {isTeacher && editingField !== 'mnemonics' && (
                  <button onClick={() => handleStartEditText('mnemonics', ai?.mnemonics)}
                    className="btn-ghost text-xs px-2.5 py-1 rounded-lg text-primary hover:bg-primary/10 flex items-center gap-1.5">
                    <Pencil size={13} /> Tahrirlash
                  </button>
                )}
              </div>
              {editingField === 'mnemonics' ? (
                <div className="space-y-3">
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={7} className="input-field text-sm" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingField(null)} className="btn-ghost text-xs py-1.5 px-3">Bekor</button>
                    <button onClick={() => handleSaveText('mnemonics')} disabled={updateAiMutation.isPending}
                      className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5">
                      <Check size={14} /> Saqlash
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{ai?.mnemonics}</div>
              )}
            </div>
          )}
          {activeTab === 'story' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold gradient-text flex items-center gap-2">Hikoya rejimi <BookOpen size={18} className="text-primary inline" /></h2>
                {isTeacher && editingField !== 'storyMode' && (
                  <button onClick={() => handleStartEditText('storyMode', ai?.storyMode)}
                    className="btn-ghost text-xs px-2.5 py-1 rounded-lg text-primary hover:bg-primary/10 flex items-center gap-1.5">
                    <Pencil size={13} /> Tahrirlash
                  </button>
                )}
              </div>
              {ai?.storyMode && <div className="mb-4"><StoryAudioPlayer lessonId={id} /></div>}
              {editingField === 'storyMode' ? (
                <div className="space-y-3">
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={7} className="input-field text-sm" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingField(null)} className="btn-ghost text-xs py-1.5 px-3">Bekor</button>
                    <button onClick={() => handleSaveText('storyMode')} disabled={updateAiMutation.isPending}
                      className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5">
                      <Check size={14} /> Saqlash
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{ai?.storyMode}</div>
              )}
            </div>
          )}
          {activeTab === 'examples' && (
            <div>
              <h2 className="text-lg font-bold mb-4 gradient-text">Hayotiy misollar</h2>
              {Array.isArray(ai?.realLifeExamples) ? (
                <div className="space-y-3">
                  {ai.realLifeExamples.map((ex, i) => {
                    // Some older lessons have plain strings in the array
                    // instead of {category, example} objects - handle both.
                    const isObj = ex && typeof ex === 'object';
                    const category = isObj ? ex.category : null;
                    const text = isObj ? ex.example : ex;
                    if (!text) return null;
                    return (
                      <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                        {category && <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-1.5">{category}</div>}
                        <div className="text-gray-700 dark:text-gray-300 leading-relaxed">{text}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Lessons generated before this format change still have a plain string - show as-is.
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{ai?.realLifeExamples}</div>
              )}
            </div>
          )}
          {activeTab === 'quiz' && (
            <QuizSection
              questions={ai?.quizQuestions}
              isTeacher={isTeacher}
              onSaveQuestions={(newQuestions) => updateAiMutation.mutate({ quizQuestions: newQuestions })}
            />
          )}
          {activeTab === 'flashcards' && <FlashcardDeck cards={ai?.flashcards} />}
          {activeTab === 'summary' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold gradient-text">AI xulosasi</h2>
                {isTeacher && editingField !== 'summary' && (
                  <button onClick={() => handleStartEditText('summary', ai?.summary)}
                    className="btn-ghost text-xs px-2.5 py-1 rounded-lg text-primary hover:bg-primary/10 flex items-center gap-1.5">
                    <Pencil size={13} /> Tahrirlash
                  </button>
                )}
              </div>
              {editingField === 'summary' ? (
                <div className="space-y-3">
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={7} className="input-field text-sm" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingField(null)} className="btn-ghost text-xs py-1.5 px-3">Bekor</button>
                    <button onClick={() => handleSaveText('summary')} disabled={updateAiMutation.isPending}
                      className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5">
                      <Check size={14} /> Saqlash
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{ai?.summary}</div>
              )}
            </div>
          )}
          {activeTab === 'mindmap' && <MindMap data={ai?.mindMapData} />}
          {activeTab === 'voice' && <VoiceSection lessonId={id} title={lesson?.title} />}
          {activeTab === 'video' && <ExplainerVideoPlayer lessonId={id} />}
          {activeTab === 'speaking' && <SpeakingPractice lessonId={id} topic={lesson?.title} />}
          {activeTab === 'chat' && <AIChatSection lessonId={id} i18nLanguage={i18n.language} />}
          </motion.div>
        </AnimatePresence>

        {/* Section navigator — vertical stepper through the same tabs */}
        <div className="panel-card">
          <span className="panel-kicker">Bo'lim</span>
          <h3 className="panel-title mb-3">{lesson?.title || getSubjectLabel(lesson?.subject)}</h3>
          <div className="relative">
            <div className="absolute right-[5px] top-3 bottom-3 w-px bg-[var(--border)]" />
            <div className="space-y-2">
              {TABS.map((tab, i) => {
                const locked = tab.id !== 'overview' && !isDone;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    disabled={locked}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <span className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all
                      ${active ? 'bg-primary/10 border-primary/40 text-primary font-semibold' : 'border-[var(--border)] text-[var(--text-secondary)]'}
                      ${locked ? 'opacity-40 cursor-not-allowed' : 'hover:border-primary/30'}`}
                    >
                      <span className={`text-xs font-bold ${active ? 'text-primary' : 'text-[var(--text-muted)]'}`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {tab.label}
                    </span>
                    <span className={`relative z-10 w-2.5 h-2.5 rounded-full flex-shrink-0 ${active ? 'bg-primary' : 'bg-[var(--border)]'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
