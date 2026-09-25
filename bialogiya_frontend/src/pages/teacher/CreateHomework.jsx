import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, Send, Sparkles, X, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

function AiHomeworkModal({ groups = [], currentGroupId, onApply, onClose }) {
  const [selectedGroupId, setSelectedGroupId] = useState(currentGroupId || '');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [taskCount, setTaskCount] = useState(3);
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
      toast.success('AI vazifa va namunaviy javoblarni tayyorladi!');
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
    });
  };

  const handleApply = () => {
    if (!generatedData) return;
    let fullDescription = (generatedData.description || '').trim();
    if (Array.isArray(generatedData.tasks) && generatedData.tasks.length > 0) {
      fullDescription += '\n\nTopshiriqlar ro\'yxati:\n' + generatedData.tasks.map(t => (
        `${t.number}. [${t.type === 'theory' ? 'Nazariya' : t.type === 'analysis' ? 'Tahlil' : 'Amaliyot'}] ${t.question} (${t.points} ball)\n- Baholash mezoni: ${t.criteria || 'To\'liq va asosli javob'}`
      )).join('\n\n');
    }
    if (generatedData.gradingRubric) {
      fullDescription += '\n\nUmumiy baholash mezoni: ' + generatedData.gradingRubric;
    }

    onApply({
      title: generatedData.title || '',
      description: fullDescription.trim(),
      maxScore: generatedData.maxScore || 100,
      groupId: selectedGroupId || currentGroupId,
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
              <p className="text-xs text-gray-400">Mavzu bo'yicha topshiriqlar va to'g'ri javoblar etalonini oling</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-xl text-gray-400"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
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
              placeholder="Masalan: Mitoz va meyoz jarayonlarini taqqoslash..."
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
              <label className="block text-xs font-medium text-gray-500 mb-1">Topshiriqlar soni</label>
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
              <><Sparkles size={14} /> Vazifani shakllantirish</>
            )}
          </button>

          {/* Generated Result Preview for Teacher Verification */}
          {generatedData && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-primary flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> AI taklif qilgan vazifa: {generatedData.title}
                </span>
                <span className="badge text-[11px] bg-primary/20 text-primary">Maksimal: {generatedData.maxScore} ball</span>
              </div>

              <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded-xl border border-primary/20">
                {generatedData.description}
              </div>

              {/* Tasks and Model Answers for Teacher Checking */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  O'qituvchi tekshiruvi uchun namunaviy to'g'ri javoblar:
                </div>
                {generatedData.tasks?.map((t, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-[var(--border)] text-xs space-y-1">
                    <div className="font-semibold text-gray-800 dark:text-gray-100 flex items-center justify-between">
                      <span>{t.number}. {t.question}</span>
                      <span className="text-primary font-bold">{t.points} ball</span>
                    </div>
                    {t.sampleAnswer && (
                      <div className="text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-2 rounded-lg">
                        <span className="font-semibold">Namunaviy to'g'ri javob: </span>{t.sampleAnswer}
                      </div>
                    )}
                    {t.criteria && (
                      <div className="text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Mezon: </span>{t.criteria}
                      </div>
                    )}
                  </div>
                ))}
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
  const [form, setForm] = useState({ title: '', description: '', groupId: '', dueDate: '', maxScore: 100 });
  const [files, setFiles] = useState([]);

  const { data: groups } = useQuery({ queryKey: ['my-groups'], queryFn: () => api.get('/groups').then(r => r.data.data) });

  const createMutation = useMutation({
    mutationFn: (fd) => api.post('/homework', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { toast.success('Vazifa yaratildi va talabalarga yuborildi!'); navigate('/teacher/homework'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xatolik yuz berdi'),
  });

  const handleSubmit = () => {
    if (!form.title || !form.groupId || !form.dueDate) return toast.error('Sarlavha, guruh va muddat kiritilishi shart');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    files.forEach(f => fd.append('files', f));
    createMutation.mutate(fd);
  };

  const handleApplyAi = ({ title, description, maxScore, groupId }) => {
    setForm(prev => ({
      ...prev,
      title: title || prev.title,
      description: description || prev.description,
      maxScore: maxScore || prev.maxScore,
      groupId: groupId || prev.groupId,
    }));
    toast.success('AI vazifasi formaga joylashtirildi. Ko\'rib chiqib, muddatni belgilang.');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Uy vazifasi yaratish</h1>
            <p className="text-xs text-gray-400">Guruh uchun topshiriq tayinlang yoki AI orqali shakllantiring</p>
          </div>
        </div>
        <button
          onClick={() => setShowAiModal(true)}
          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
        >
          <Sparkles size={14} /> AI bilan tuzish
        </button>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Sarlavha *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Uy vazifasi nomi" className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Guruh *</label>
            <select value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))} className="input-field">
              <option value="">Guruhni tanlang</option>
              {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Muddat *</label>
            <input type="datetime-local" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Maksimal ball</label>
          <input type="number" value={form.maxScore} onChange={e => setForm(f => ({ ...f, maxScore: +e.target.value }))} className="input-field" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium">Tavsif / Ko'rsatmalar</label>
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Sparkles size={12} /> AI taklifi olish
            </button>
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Uy vazifasi haqida yozing..." rows={6} className="input-field resize-none text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Ilovalar</label>
          <label className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer hover:border-primary/40 text-center block text-sm text-gray-400">
            <Upload size={18} className="mx-auto mb-1" /> Fayllarni yuklash
            <input type="file" multiple className="hidden" onChange={e => setFiles(Array.from(e.target.files))} />
          </label>
          {files.map((f, i) => <div key={i} className="text-xs mt-1 text-gray-500">{f.name}</div>)}
        </div>
        <button onClick={handleSubmit} disabled={createMutation.isPending} className="btn-primary w-full flex items-center justify-center gap-2">
          <Send size={15} /> {createMutation.isPending ? 'Yaratilmoqda...' : 'Vazifani e\'lon qilish & Talabalarga yuborish'}
        </button>
      </div>

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

