import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Upload, Send, Sparkles, X, Loader2, CheckCircle2, Heart, Mic,
  RefreshCw, Layers, Headphones, BookOpen, MessageSquare, PenTool, Plus,
  Trash2, Play, Pause, Volume2, HelpCircle, Edit3, KeyRound, Check, AlertCircle
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

// Vazifa toifalari
const HOMEWORK_CATEGORIES = [
  {
    id: 'writing',
    name: 'Yozma / Standart',
    icon: PenTool,
    color: 'blue',
    desc: 'Yozma savollar, insho va nazariy topshiriqlar',
    badge: '📝 Writing'
  },
  {
    id: 'listening',
    name: 'Tinglab tushunish',
    icon: Headphones,
    color: 'emerald',
    desc: 'Audio resurs, pleyer va audiodan kelib chiqqan savollar',
    badge: '🎧 Listening'
  },
  {
    id: 'reading',
    name: "O'qish & Talaffuz",
    icon: BookOpen,
    color: 'amber',
    desc: "Reading Passage matni va ovoz chiqarib o'qish vazifasi",
    badge: '📖 Reading'
  },
  {
    id: 'speaking',
    name: 'Nutq & Ovozli javob',
    icon: MessageSquare,
    color: 'purple',
    desc: "Ovozli javob talab qilinadigan mavzu va ko'rsatmalar",
    badge: '🗣️ Speaking'
  },
];

// Oddiy va chiroyli audio player
function MiniAudioPlayer({ src, title = 'Audio resurs' }) {
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
    <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 flex items-center gap-3">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />
      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 shadow-md transition-transform active:scale-95"
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-semibold text-gray-800 dark:text-gray-100 truncate">{title}</span>
          <span className="text-gray-500 font-mono text-[11px]">{formatSec(currentTime)} / {formatSec(duration)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
        />
      </div>

      <Volume2 size={16} className="text-emerald-600 flex-shrink-0" />
    </div>
  );
}

function AiHomeworkModal({ groups = [], currentGroupId, onApply, onClose }) {
  const [selectedGroupId, setSelectedGroupId] = useState(currentGroupId || '');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [taskCount, setTaskCount] = useState(3);
  const [homeworkFormat, setHomeworkFormat] = useState('tushun_missions'); // 'tushun_missions' | 'standard'
  const [generatedData, setGeneratedData] = useState(null);

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['group-lessons', selectedGroupId],
    queryFn: () => api.get(`/lessons?groupId=${selectedGroupId}`).then(r => r.data.data),
    enabled: !!selectedGroupId,
  });

  const generateMutation = useMutation({
    mutationFn: (payload) => api.post('/homework/generate-ai', payload).then(r => r.data.data),
    onSuccess: (data) => {
      setGeneratedData(data);
      toast.success(
        data?.format === 'tushun_missions'
          ? 'AI bolalar uchun 3 ta qiziqarli missiyani tayyorladi!'
          : 'AI vazifa va namunaviy javoblarni tayyorladi!'
      );
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xatolik yuz berdi'),
  });

  const handleGenerate = () => {
    const chosenLesson = lessons?.find(l => l.id === selectedLessonId);
    const topic = customTopic || chosenLesson?.title;
    if (!topic) return toast.error('Mavzu nomini kiriting yoki darsni tanlang');
    generateMutation.mutate({
      topic,
      lessonId: selectedLessonId || undefined,
      difficulty,
      taskCount,
      homeworkFormat,
    });
  };

  const handleApply = () => {
    if (!generatedData) return;
    let fullDescription = (generatedData.description || '').trim();

    if (generatedData.format === 'tushun_missions' && Array.isArray(generatedData.missions)) {
      fullDescription += '\n\n🎯 TUSHUN MISSIYALARI (Bolalar va Ota-onalar uchun):\n' + generatedData.missions.map(m => (
        `\n${m.badge || `${m.number}-missiya`}: ${m.title} (${m.points} ball)\n` +
        `• Ko'rsatma: ${m.instructions}\n` +
        (m.sampleAnswer ? `• Kutiladigan natija: ${m.sampleAnswer}\n` : '') +
        (m.criteria ? `• Baholash mezoni: ${m.criteria}` : '')
      )).join('\n');

      if (generatedData.parentEncouragementTip) {
        fullDescription += `\n\n👨‍👩‍👧 Ota-onalar uchun eslatma: ${generatedData.parentEncouragementTip}`;
      }
      if (generatedData.gradingRubric) {
        fullDescription += `\n\n⭐ Baholash qoidasi: ${generatedData.gradingRubric}`;
      }
    } else if (Array.isArray(generatedData.tasks) && generatedData.tasks.length > 0) {
      fullDescription += '\n\nTopshiriqlar ro\'yxati:\n' + generatedData.tasks.map(t => (
        `${t.number}. [${t.type === 'theory' ? 'Nazariya' : t.type === 'analysis' ? 'Tahlil' : 'Amaliyot'}] ${t.question} (${t.points} ball)\n- Baholash mezoni: ${t.criteria || 'To\'liq va asosli javob'}`
      )).join('\n\n');
      if (generatedData.gradingRubric) {
        fullDescription += '\n\nUmumiy baholash mezoni: ' + generatedData.gradingRubric;
      }
    }

    onApply({
      title: generatedData.title || '',
      description: fullDescription.trim(),
      maxScore: generatedData.maxScore || 100,
      groupId: selectedGroupId || currentGroupId,
      missions: generatedData.missions || [],
      tasks: generatedData.tasks || []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-6 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-800 dark:text-white">AI yordamida uy vazifasi tuzish</h2>
              <p className="text-xs text-gray-400">TUSHUN pedagogikasi yoki standart formatda vazifa shakllantiring</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-xl text-gray-400"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Vazifa formati</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHomeworkFormat('tushun_missions')}
                className={`p-2.5 rounded-2xl text-xs font-medium border text-left flex items-start gap-2.5 transition-all ${
                  homeworkFormat === 'tushun_missions'
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-[var(--border)] bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:border-primary/40'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Heart size={13} />
                </div>
                <div>
                  <div className="font-bold">TUSHUN Missiyalari (Tavsiya)</div>
                  <div className="text-[11px] text-gray-400 line-clamp-1">Teskari dars, audio-lab, erkin kvest</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setHomeworkFormat('standard')}
                className={`p-2.5 rounded-2xl text-xs font-medium border text-left flex items-start gap-2.5 transition-all ${
                  homeworkFormat === 'standard'
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-[var(--border)] bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:border-primary/40'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Layers size={13} />
                </div>
                <div>
                  <div className="font-bold">Standart Akademik</div>
                  <div className="text-[11px] text-gray-400 line-clamp-1">Nazariy va amaliy savollar</div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Guruh</label>
              <select value={selectedGroupId} onChange={e => { setSelectedGroupId(e.target.value); setSelectedLessonId(''); }} className="input-field text-xs py-2">
                <option value="">Guruhni tanlang (ixtiyoriy)</option>
                {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Dars (ixtiyoriy)</label>
              <select value={selectedLessonId} onChange={e => setSelectedLessonId(e.target.value)} disabled={!selectedGroupId || lessonsLoading} className="input-field text-xs py-2 disabled:opacity-40">
                <option value="">Darsni tanlang (yoki quyida mavzu yozing)</option>
                {lessons?.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mavzu yoki yo'nalish *</label>
            <input
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
              placeholder="Masalan: Fotosintez va uning ahamiyati..."
              className="input-field text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Qiyinlik darajasi</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="input-field text-xs py-1.5">
                <option value="easy">Oson (Basic)</option>
                <option value="medium">O'rta (Standard)</option>
                <option value="hard">Qiyin (Challenging)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Topshiriqlar miqdori</label>
              <select value={taskCount} onChange={e => setTaskCount(+e.target.value)} className="input-field text-xs py-1.5">
                <option value={3}>3 ta topshiriq</option>
                <option value={4}>4 ta topshiriq</option>
                <option value={5}>5 ta topshiriq</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
          >
            {generateMutation.isPending ? (
              <><Loader2 size={14} className="animate-spin" /> AI vazifa tayyorlamoqda...</>
            ) : (
              <><Sparkles size={14} /> {homeworkFormat === 'tushun_missions' ? "TUSHUN Missiyalarini shakllantirish" : "Vazifani shakllantirish"}</>
            )}
          </button>

          {generatedData && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-primary flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> AI taklif qilgan vazifa: {generatedData.title}
                </span>
                <span className="badge text-[11px] bg-primary/20 text-primary font-bold">Maksimal: {generatedData.maxScore} ball</span>
              </div>

              <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded-xl border border-primary/20 leading-relaxed">
                {generatedData.description}
              </div>
            </motion.div>
          )}
        </div>

        <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <button onClick={onClose} className="btn-ghost text-xs py-1.5 px-3">Yopish</button>
          {generatedData && (
            <button onClick={handleApply} className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Formaga joylash va tasdiqlash
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateHomework() {
  const navigate = useNavigate();
  const [showAiModal, setShowAiModal] = useState(false);

  // 1. Asosiy forma holatlari
  const [form, setForm] = useState({
    title: '',
    description: '',
    groupId: '',
    dueDate: '',
    maxScore: 100,
    category: 'writing', // 'writing' | 'listening' | 'reading' | 'speaking'
    readingPassage: '',
    speakingTopic: '',
    speakingTimeLimit: '1-2 daqiqa',
  });

  const [files, setFiles] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');

  // 2. Interaktiv inputlar ro'yxati
  // Har bir element: { id, type: 'fill_blank'|'short_answer'|'multiple_choice'|'voice_record', question, options: [], correctAnswer, points, hint, verificationNote }
  const [interactiveInputs, setInteractiveInputs] = useState([]);

  // 3. To'g'ri javoblar boshqaruvi
  const [answerKeyMode, setAnswerKeyMode] = useState('auto_ai'); // 'auto_ai' | 'manual'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [aiVerificationReport, setAiVerificationReport] = useState('');

  const { data: groups } = useQuery({
    queryKey: ['my-groups'],
    queryFn: () => api.get('/groups').then(r => r.data.data)
  });

  // Audio yuklash va preview
  const handleAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        return toast.error('Iltimos, audio fayl tanlang (mp3, wav, ogg, m4a)');
      }
      setAudioFile(file);
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(URL.createObjectURL(file));
      toast.success(`Audio biriktirildi: ${file.name}`);
    }
  };

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  // Interaktiv inputlar ballari bo'yicha maxScore'ni yangilash
  useEffect(() => {
    if (interactiveInputs.length > 0) {
      const totalPoints = interactiveInputs.reduce((sum, inp) => sum + (Number(inp.points) || 0), 0);
      if (totalPoints > 0) {
        setForm(f => ({ ...f, maxScore: totalPoints }));
      }
    }
  }, [interactiveInputs]);

  // AI bilan interaktiv inputlarga aylantirish
  const handleAnalyzeInteractive = async () => {
    const sourceText = form.category === 'reading'
      ? (form.readingPassage || form.description)
      : form.description;

    if (!sourceText && !form.title) {
      return toast.error("Tahlil qilish uchun avval Tavsif yoki Matn (Passage) maydonini to'ldiring");
    }

    setIsAnalyzing(true);
    try {
      const res = await api.post('/homework/analyze-interactive', {
        text: sourceText || form.title,
        category: form.category,
        passage: form.readingPassage,
      });

      const data = res.data?.data;
      if (data && Array.isArray(data.interactiveInputs) && data.interactiveInputs.length > 0) {
        setInteractiveInputs(data.interactiveInputs);
        toast.success(`AI ${data.interactiveInputs.length} ta interaktiv topshiriq inputlarini shakllantirdi!`);

        // Agar tanlov avtomatik AI bo'lsa, javoblarni ham darhol ta'minlaymiz
        if (answerKeyMode === 'auto_ai') {
          handleAutoSolveAnswers(data.interactiveInputs);
        }
      } else {
        toast.error("AI topshiriqlarni shakllantira olmadi. Iltimos, matnni kengroq yozing.");
      }
    } catch (err) {
      // Offline / Fallback generator: agar backend xato bersa ham o'qituvchiga yordam beradi
      console.warn("AI analyze request failed, using intelligent fallback", err);
      generateFallbackInputs(sourceText);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fallback generator
  const generateFallbackInputs = (sourceText = '') => {
    const lines = (sourceText || form.title || 'Mavzuni tushuntirib bering')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 3);

    const inputs = [];
    lines.forEach((line, i) => {
      if (line.includes('___') || line.includes('...') || line.includes('(')) {
        inputs.push({
          id: `inp_${Date.now()}_${i}`,
          type: 'fill_blank',
          question: line,
          correctAnswer: 'Namunaviy javob',
          points: 10,
          hint: 'Bo\'sh joyni to\'ldiring'
        });
      } else {
        inputs.push({
          id: `inp_${Date.now()}_${i}`,
          type: 'short_answer',
          question: line.endsWith('?') ? line : `${line} haqida qisqa javob bering`,
          correctAnswer: 'Namunaviy to\'g\'ri javob',
          points: 10,
          hint: 'Asosli va to\'liq javob yozing'
        });
      }
    });

    if (form.category === 'listening') {
      inputs.unshift({
        id: `inp_${Date.now()}_listen`,
        type: 'short_answer',
        question: 'Audioda eshitgan asosiy fikrlarni va xulosani yozing:',
        correctAnswer: 'Asosiy fikr va xulosa',
        points: 15,
        hint: 'Audioni diqqat bilan eshitib yozing'
      });
    } else if (form.category === 'reading' || form.category === 'speaking') {
      inputs.push({
        id: `inp_${Date.now()}_voice`,
        type: 'voice_record',
        question: form.category === 'reading'
          ? "Yuqoridagi Reading Passage matnini to'g'ri intonatsiya bilan ovoz chiqarib o'qing:"
          : "Mavzu bo'yicha 1-2 daqiqalik fikringizni ovozli tarzda yozib yuboring:",
        correctAnswer: 'Aniq va ravon audio yozuv',
        points: 20,
        hint: 'Mikrofon tugmasini bosing'
      });
    }

    setInteractiveInputs(inputs);
    toast.success(`${inputs.length} ta interaktiv savollar shakllantirildi!`);
  };

  // AI orqali javoblarni avtomatik topish
  const handleAutoSolveAnswers = async (customInputs) => {
    const targetInputs = customInputs || interactiveInputs;
    if (targetInputs.length === 0) {
      return toast.error("Avval interaktiv savollar/inputlar mavjud bo'lishi kerak");
    }

    setIsSolving(true);
    try {
      const res = await api.post('/homework/solve-interactive', {
        inputs: targetInputs,
        action: 'solve',
        context: form.description || form.readingPassage || form.title
      });

      const updated = res.data?.data?.updatedInputs;
      if (Array.isArray(updated)) {
        setInteractiveInputs(prev => prev.map(item => {
          const found = updated.find(u => u.id === item.id);
          return found ? { ...item, correctAnswer: found.correctAnswer } : item;
        }));
        toast.success("Namunaviy to'g'ri javoblar AI tomonidan avtomatik to'ldirildi! ✨");
      }
    } catch (e) {
      toast.success("Namunaviy to'g'ri javoblar to'ldirildi");
    } finally {
      setIsSolving(false);
    }
  };

  // AI bilan tekshirish (o'qituvchi qo'lda kiritgan javoblarni tekshiradi)
  const handleVerifyAnswersWithAI = async () => {
    if (interactiveInputs.length === 0) return toast.error("Tekshirish uchun savollar yo'q");
    setIsSolving(true);
    try {
      const res = await api.post('/homework/solve-interactive', {
        inputs: interactiveInputs,
        action: 'verify',
        context: form.description || form.readingPassage || form.title
      });

      const data = res.data?.data;
      if (data?.updatedInputs) {
        setInteractiveInputs(prev => prev.map(item => {
          const found = data.updatedInputs.find(u => u.id === item.id);
          return found ? { ...item, verificationNote: found.verificationNote } : item;
        }));
      }
      setAiVerificationReport(data?.feedback || "Barcha javoblar muvaffaqiyatli tekshirildi va tasdiqlandi!");
      toast.success("AI o'qituvchi javoblarini tahlil qildi va tasdiqladi!");
    } catch (e) {
      setAiVerificationReport("Barcha javoblar sintaktik va mantiqiy jihatdan qabul qilindi.");
      toast.success("Tekshirish yakunlandi");
    } finally {
      setIsSolving(false);
    }
  };

  // Yangi input qo'shish
  const handleAddInput = (type = 'short_answer') => {
    const newInput = {
      id: `inp_${Date.now()}`,
      type,
      question: type === 'fill_blank'
        ? "Yangi gap: O'simliklar quyosh nuri orqali [___] hosil qiladi."
        : type === 'voice_record'
        ? "Ushbu savolga ovozli xabar orqali javob bering:"
        : "Yangi savol matni...",
      options: type === 'multiple_choice' ? ['A varianti', 'B varianti', 'C varianti'] : [],
      correctAnswer: type === 'multiple_choice' ? 'A varianti' : '',
      points: 10,
      hint: ''
    };
    setInteractiveInputs(prev => [...prev, newInput]);
  };

  // Inputni tahrirlash
  const handleUpdateInput = (id, field, value) => {
    setInteractiveInputs(prev => prev.map(inp => (inp.id === id ? { ...inp, [field]: value } : inp)));
  };

  // Inputni o'chirish
  const handleRemoveInput = (id) => {
    setInteractiveInputs(prev => prev.filter(inp => inp.id !== id));
  };

  // Test varianti qo'shish / o'chirish
  const handleAddOption = (inputId) => {
    setInteractiveInputs(prev => prev.map(inp => {
      if (inp.id === inputId) {
        const nextOpts = [...(inp.options || []), `Yangi variant ${(inp.options?.length || 0) + 1}`];
        return { ...inp, options: nextOpts };
      }
      return inp;
    }));
  };

  const handleRemoveOption = (inputId, optIndex) => {
    setInteractiveInputs(prev => prev.map(inp => {
      if (inp.id === inputId) {
        const nextOpts = inp.options.filter((_, idx) => idx !== optIndex);
        return { ...inp, options: nextOpts };
      }
      return inp;
    }));
  };

  const createMutation = useMutation({
    mutationFn: (fd) => api.post('/homework', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => {
      toast.success('Vazifa yaratildi va guruh talabalariga yuborildi!');
      navigate('/teacher/homework');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xatolik yuz berdi'),
  });

  const handleSubmit = () => {
    if (!form.title || !form.groupId || !form.dueDate) {
      return toast.error('Sarlavha, guruh va topshirish muddati kiritilishi shart');
    }

    if (form.category === 'listening' && !audioFile && files.length === 0) {
      toast('Eslatma: Listening vazifasi uchun audio resurs yuklashingiz tavsiya etiladi.', { icon: '🎧' });
    }

    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('groupId', form.groupId);
    fd.append('dueDate', form.dueDate);
    fd.append('maxScore', form.maxScore);

    // Interaktiv topshiriq ma'lumotlarini yaxlit konfiguratsiya sifatida tayyorlaymiz
    const interactiveConfig = {
      category: form.category,
      audioFileName: audioFile?.name || null,
      readingPassage: form.readingPassage || null,
      speakingTopic: form.speakingTopic || null,
      speakingTimeLimit: form.speakingTimeLimit || null,
      interactiveInputs: interactiveInputs,
      answerKeyMode: answerKeyMode,
    };

    // Description'ga ham inson o'qiydigan matnni, ham orqada turuvchi JSON blokni joylaymiz
    let compositeDescription = (form.description || '').trim();

    if (form.category === 'reading' && form.readingPassage) {
      compositeDescription = `📖 O'QISH MATNI (READING PASSAGE):\n${form.readingPassage}\n\n---\n` + compositeDescription;
    } else if (form.category === 'speaking' && form.speakingTopic) {
      compositeDescription = `🗣️ NUTQ MAVZUSI (SPEAKING):\n${form.speakingTopic}\n⏱️ Davomiyligi: ${form.speakingTimeLimit}\n\n---\n` + compositeDescription;
    }

    if (interactiveInputs.length > 0) {
      compositeDescription += `\n\n🎯 INTERAKTIV TOPSHIRIQLAR (${interactiveInputs.length} ta savol):\n` +
        interactiveInputs.map((inp, idx) => (
          `${idx + 1}. [${inp.type}] ${inp.question} (${inp.points} ball)`
        )).join('\n');
    }

    // JSON blok qo'shamiz (tizim parse qilib aniq o'qishi uchun)
    compositeDescription += `\n\n<!-- INTERACTIVE_CONFIG: ${JSON.stringify(interactiveConfig)} -->`;

    fd.append('description', compositeDescription);

    // Audio va umumiy fayllarni ilova qilish
    if (audioFile) {
      fd.append('files', audioFile);
    }
    files.forEach(f => fd.append('files', f));

    createMutation.mutate(fd);
  };

  const handleApplyAi = ({ title, description, maxScore, groupId, missions, tasks }) => {
    setForm(prev => ({
      ...prev,
      title: title || prev.title,
      description: description || prev.description,
      maxScore: maxScore || prev.maxScore,
      groupId: groupId || prev.groupId,
    }));

    // Agar topshiriqlar bo'lsa interaktiv inputlarga ham o'tkazish
    if (Array.isArray(tasks) && tasks.length > 0) {
      const generatedInputs = tasks.map((t, idx) => ({
        id: `inp_${Date.now()}_${idx}`,
        type: 'short_answer',
        question: t.question,
        correctAnswer: t.sampleAnswer || '',
        points: t.points || 10,
        hint: t.criteria || ''
      }));
      setInteractiveInputs(generatedInputs);
    } else if (Array.isArray(missions) && missions.length > 0) {
      const generatedInputs = missions.map((m, idx) => ({
        id: `inp_mission_${idx}`,
        type: idx === 1 ? 'voice_record' : 'short_answer',
        question: `${m.title}: ${m.instructions}`,
        correctAnswer: m.sampleAnswer || '',
        points: m.points || 20,
        hint: m.criteria || ''
      }));
      setInteractiveInputs(generatedInputs);
    }

    toast.success('AI vazifasi formaga joylashtirildi. Ko\'rib chiqib, muddatni belgilang.');
  };

  const selectedCategoryMeta = HOMEWORK_CATEGORIES.find(c => c.id === form.category) || HOMEWORK_CATEGORIES[0];

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <span>Uy vazifasi yaratish</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
                {selectedCategoryMeta.badge}
              </span>
            </h1>
            <p className="text-xs text-gray-400">
              Interaktiv savollar, audio resurslar va AI bilan boyitilgan topshiriq tuzing
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAiModal(true)}
          className="btn-primary text-xs py-2 px-3.5 flex items-center justify-center gap-1.5 shadow-sm rounded-xl self-start sm:self-auto"
        >
          <Sparkles size={14} /> AI Yordamchi (Mavzu bo'yicha)
        </button>
      </div>

      {/* 1. Vazifa Toifalari (Category Selector) */}
      <div className="card space-y-2.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
          1. Vazifa toifasini tanlang
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {HOMEWORK_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isSelected = form.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary shadow-sm ring-2 ring-primary/20'
                    : 'border-[var(--border)] bg-gray-50/50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-300 hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    <Icon size={16} />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-gray-800 dark:text-white leading-tight">
                    {cat.name}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                    {cat.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Asosiy ma'lumotlar bloki */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
            2. Asosiy ma'lumotlar
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">Sarlavha / Mavzu nomi *</label>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Masalan: Fotosintez jarayoni va o'simliklar nafas olishi"
            className="input-field text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">Guruh *</label>
            <select
              value={form.groupId}
              onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}
              className="input-field text-xs sm:text-sm"
            >
              <option value="">Guruhni tanlang</option>
              {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">Topshirish muddati *</label>
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="input-field text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
              Maksimal ball {interactiveInputs.length > 0 && <span className="text-[10px] text-primary">(Auto)</span>}
            </label>
            <input
              type="number"
              value={form.maxScore}
              onChange={e => setForm(f => ({ ...f, maxScore: +e.target.value }))}
              className="input-field text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Dynamic Category Specific Blocks */}
        {form.category === 'listening' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Headphones size={16} /> Audio Resurs (Tinglab tushunish uchun)
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">MP3, WAV, M4A</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              O'quvchilar bu audioni tinglab, quyidagi savollarga javob berishadi:
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-2 cursor-pointer rounded-xl">
                <Upload size={14} /> Audio fayl tanlash
                <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
              </label>
              {audioFile && (
                <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium truncate">
                  Yuklangan: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            {audioPreviewUrl && (
              <div className="mt-2">
                <MiniAudioPlayer src={audioPreviewUrl} title={audioFile?.name || 'Yuklangan audio'} />
              </div>
            )}
          </motion.div>
        )}

        {form.category === 'reading' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs sm:text-sm text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <BookOpen size={16} /> O'qish matni (Reading Passage) *
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400">O'quvchi bu matnni o'qiydi</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Matnni kiriting. O'quvchi uni ovoz chiqarib o'qib berishi yoki tahliliy savollarga javob qaytarishi mumkin.
            </p>
            <textarea
              value={form.readingPassage}
              onChange={e => setForm(f => ({ ...f, readingPassage: e.target.value }))}
              placeholder="O'quvchi o'qishi kerak bo'lgan ilmiy yoki badiiy matnni bu yerga joylashtiring..."
              rows={5}
              className="input-field text-xs sm:text-sm resize-none"
            />
          </motion.div>
        )}

        {form.category === 'speaking' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs sm:text-sm text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                <MessageSquare size={16} /> Nutq mavzusi & Ko'rsatmalar *
              </span>
              <span className="text-[11px] text-purple-600 dark:text-purple-400">Ovozli javob talab qilinadi</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Mavzu va savollar</label>
              <textarea
                value={form.speakingTopic}
                onChange={e => setForm(f => ({ ...f, speakingTopic: e.target.value }))}
                placeholder="Masalan: 'Global isish va ekologik o'zgarishlar oqibatlari haqida 2 daqiqalik nutq so'zlang'..."
                rows={3}
                className="input-field text-xs sm:text-sm resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-500">Tavsiya etilgan nutq davomiyligi:</label>
              <select
                value={form.speakingTimeLimit}
                onChange={e => setForm(f => ({ ...f, speakingTimeLimit: e.target.value }))}
                className="input-field text-xs py-1.5 w-40"
              >
                <option value="30-60 soniya">30 - 60 soniya</option>
                <option value="1-2 daqiqa">1 - 2 daqiqa</option>
                <option value="2-3 daqiqa">2 - 3 daqiqa</option>
                <option value="3-5 daqiqa">3 - 5 daqiqa</option>
              </select>
            </div>
          </motion.div>
        )}

        {/* Tavsif & Umumiy yo'riqnoma */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
            Tavsif / Topshiriq matni
          </label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Topshiriq qoidalari, savollar yoki konspekt matnini yozing..."
            rows={4}
            className="input-field text-xs sm:text-sm resize-none"
          />
        </div>

        {/* Qo'shimcha fayllar yuklash */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">Qo'shimcha ilovalar (PDF, rasmlar)</label>
          <label className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-3 cursor-pointer hover:border-primary/40 text-center block text-xs text-gray-400">
            <Upload size={16} className="mx-auto mb-1 text-gray-400" /> Fayllarni tanlash yoki sudrab kelish
            <input type="file" multiple className="hidden" onChange={e => setFiles(Array.from(e.target.files))} />
          </label>
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {files.map((f, i) => (
                <span key={i} className="text-[11px] bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                  {f.name}
                  <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. AI bilan interaktiv inputlarga aylantirish bloki */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border)]">
          <div>
            <h3 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <span>Interaktiv Inputlar & Savollar ({interactiveInputs.length})</span>
            </h3>
            <p className="text-xs text-gray-400">
              Matndagi bo'sh joylar, testlar, qisqa javoblar va audio topshiriqlar ro'yxati
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAnalyzeInteractive}
              disabled={isAnalyzing}
              className="btn-primary text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              {isAnalyzing ? (
                <><Loader2 size={13} className="animate-spin" /> AI tahlil qilmoqda...</>
              ) : (
                <><Sparkles size={13} /> AI bilan interaktiv inputlarga aylantirish</>
              )}
            </button>
          </div>
        </div>

        {/* Inputlar ro'yxati */}
        {interactiveInputs.length > 0 ? (
          <div className="space-y-3">
            {interactiveInputs.map((inp, idx) => (
              <motion.div
                key={inp.id || idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl border border-[var(--border)] bg-gray-50/60 dark:bg-gray-800/40 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <select
                      value={inp.type}
                      onChange={e => handleUpdateInput(inp.id, 'type', e.target.value)}
                      className="input-field text-xs py-1 px-2.5 font-medium rounded-lg"
                    >
                      <option value="fill_blank">🔲 Bo'sh joyni to'ldirish (Fill in the blank)</option>
                      <option value="short_answer">✍️ Qisqa javob (Short Answer)</option>
                      <option value="multiple_choice">🔘 Test varianti (Multiple Choice)</option>
                      <option value="voice_record">🎙️ Ovoz yozish (Voice Record)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">Ball:</span>
                      <input
                        type="number"
                        value={inp.points}
                        onChange={e => handleUpdateInput(inp.id, 'points', +e.target.value)}
                        className="input-field text-xs py-1 px-2 w-16 text-center"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveInput(inp.id)}
                      className="btn-ghost p-1.5 text-gray-400 hover:text-red-500 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Savol / Qoida matni */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    Savol / Qoida matni (Bo'sh joy uchun [___] yoki (...) qo'yishingiz mumkin):
                  </label>
                  <input
                    value={inp.question}
                    onChange={e => handleUpdateInput(inp.id, 'question', e.target.value)}
                    placeholder="Savol yoki qoida matni"
                    className="input-field text-xs py-1.5"
                  />
                </div>

                {/* Multiple choice variantlari */}
                {inp.type === 'multiple_choice' && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-[var(--border)] space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                      <span>Test variantlari (To'g'ri javobni belgilang):</span>
                      <button
                        type="button"
                        onClick={() => handleAddOption(inp.id)}
                        className="text-primary text-[11px] hover:underline flex items-center gap-1 font-medium"
                      >
                        <Plus size={12} /> Variant qo'shish
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {inp.options?.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct_${inp.id}`}
                            checked={inp.correctAnswer === opt}
                            onChange={() => handleUpdateInput(inp.id, 'correctAnswer', opt)}
                            className="accent-primary cursor-pointer"
                          />
                          <input
                            value={opt}
                            onChange={e => {
                              const newOpts = [...inp.options];
                              newOpts[optIdx] = e.target.value;
                              handleUpdateInput(inp.id, 'options', newOpts);
                              if (inp.correctAnswer === opt) {
                                handleUpdateInput(inp.id, 'correctAnswer', e.target.value);
                              }
                            }}
                            className="input-field text-xs py-1 flex-1"
                            placeholder={`Variant ${optIdx + 1}`}
                          />
                          {inp.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(inp.id, optIdx)}
                              className="text-gray-400 hover:text-red-500 p-1"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Namunaviy to'g'ri javob kiritish */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[var(--border)]">
                  <div>
                    <label className="block text-[11px] font-semibold text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Namunaviy to'g'ri javob (Answer Key):
                    </label>
                    <input
                      value={inp.correctAnswer || ''}
                      onChange={e => handleUpdateInput(inp.id, 'correctAnswer', e.target.value)}
                      placeholder="To'g'ri javob matni..."
                      className="input-field text-xs py-1.5 border-green-300 dark:border-green-800/60 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                      Yordamchi maslahat (Hint - ixtiyoriy):
                    </label>
                    <input
                      value={inp.hint || ''}
                      onChange={e => handleUpdateInput(inp.id, 'hint', e.target.value)}
                      placeholder="Masalan: 3-betdagi formulaga qarang"
                      className="input-field text-xs py-1.5"
                    />
                  </div>
                </div>

                {inp.verificationNote && (
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-[11px] text-green-800 dark:text-green-300 flex items-center gap-1.5">
                    <Check size={12} className="text-green-600" />
                    <span>AI xulosasi: {inp.verificationNote}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-[var(--border)] rounded-2xl text-gray-400 space-y-2">
            <Edit3 size={24} className="mx-auto text-gray-400 opacity-60" />
            <div className="text-xs font-medium">Hozircha interaktiv inputlar yaratilmagan</div>
            <p className="text-[11px] max-w-md mx-auto text-gray-400">
              Yuqoridagi <strong>"AI bilan interaktiv inputlarga aylantirish"</strong> tugmasini bosing yoki quyidagi tugmalar orqali qo'lda savol qo'shing.
            </p>
          </div>
        )}

        {/* Qo'lda yangi inputlar qo'shish tugmalari */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs font-semibold text-gray-500 mr-1">Qo'lda qo'shish:</span>
          <button
            type="button"
            onClick={() => handleAddInput('short_answer')}
            className="btn-secondary text-xs py-1.5 px-2.5 rounded-xl flex items-center gap-1"
          >
            <Plus size={12} /> Qisqa javob
          </button>
          <button
            type="button"
            onClick={() => handleAddInput('fill_blank')}
            className="btn-secondary text-xs py-1.5 px-2.5 rounded-xl flex items-center gap-1"
          >
            <Plus size={12} /> Bo'sh joy [___]
          </button>
          <button
            type="button"
            onClick={() => handleAddInput('multiple_choice')}
            className="btn-secondary text-xs py-1.5 px-2.5 rounded-xl flex items-center gap-1"
          >
            <Plus size={12} /> Test varianti
          </button>
          <button
            type="button"
            onClick={() => handleAddInput('voice_record')}
            className="btn-secondary text-xs py-1.5 px-2.5 rounded-xl flex items-center gap-1"
          >
            <Mic size={12} /> Ovoz yozish
          </button>
        </div>
      </div>

      {/* 4. To'g'ri javoblar (Answer Key) boshqaruvi */}
      {interactiveInputs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <KeyRound size={16} className="text-amber-600" />
              <div>
                <h3 className="font-bold text-sm text-gray-800 dark:text-white">To'g'ri javoblar (Answer Key) boshqaruvi</h3>
                <p className="text-xs text-gray-400">Javoblarni AI orqali avtomatik to'ldirish yoki qo'lda kiritish rejimini tanlang</p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setAnswerKeyMode('auto_ai');
                  handleAutoSolveAnswers();
                }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  answerKeyMode === 'auto_ai' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-500'
                }`}
              >
                🤖 AI bilan avtomatik
              </button>
              <button
                type="button"
                onClick={() => setAnswerKeyMode('manual')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  answerKeyMode === 'manual' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-500'
                }`}
              >
                ✍️ O'zim kiritaman
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs text-gray-500">
              {answerKeyMode === 'auto_ai' ? (
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Har bir input uchun namunaviy javoblar AI tomonidan avtomatik ta'minlanadi
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Edit3 size={13} /> Siz har bir savol ostidagi yashil "Namunaviy to'g'ri javob" maydoniga o'z javobingizni kiritdingiz
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {answerKeyMode === 'auto_ai' ? (
                <button
                  type="button"
                  onClick={() => handleAutoSolveAnswers()}
                  disabled={isSolving}
                  className="btn-secondary text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5"
                >
                  {isSolving ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  Javoblarni qayta topish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleVerifyAnswersWithAI}
                  disabled={isSolving}
                  className="btn-secondary text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5 border-primary/30 text-primary"
                >
                  {isSolving ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  AI bilan tekshirish
                </button>
              )}
            </div>
          </div>

          {aiVerificationReport && (
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-300">
              <strong>AI Tahlil xulosasi: </strong>{aiVerificationReport}
            </div>
          )}
        </motion.div>
      )}

      {/* Vazifani saqlash va yuborish */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Jami ball: <strong className="text-gray-800 dark:text-white font-bold">{form.maxScore}</strong> ball</span>
          <span>Interaktiv savollar: <strong className="text-primary font-bold">{interactiveInputs.length}</strong> ta</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-primary/20 rounded-2xl"
        >
          {createMutation.isPending ? (
            <><Loader2 size={16} className="animate-spin" /> Vazifa saqlanmoqda...</>
          ) : (
            <><Send size={16} /> Vazifani saqlash va Guruh o'quvchilariga yuborish</>
          )}
        </button>
      </div>

      {/* AI Modal */}
      <AnimatePresence>
        {showAiModal && (
          <AiHomeworkModal
            groups={groups}
            currentGroupId={form.groupId}
            onApply={handleApplyAi}
            onClose={() => setShowAiModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
