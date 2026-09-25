import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

const TYPES = ['topic', 'weekly', 'monthly', 'mock'];
const DIFFS = ['easy', 'medium', 'hard'];

const emptyQ = () => ({ text: '', type: 'mcq', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }], difficulty: 'medium', points: 1, explanation: '' });

export default function CreateTest() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', type: 'topic', groupId: '', timeLimit: 30, questions: [emptyQ()] });

  const { data: groups } = useQuery({ queryKey: ['my-groups'], queryFn: () => api.get('/groups').then(r => r.data.data) });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/tests', d),
    onSuccess: () => { toast.success('Test muvaffaqiyatli yaratildi!'); navigate('/teacher/tests'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xatolik yuz berdi'),
  });

  const setQ = (qi, field, val) => setForm(f => ({ ...f, questions: f.questions.map((q, i) => i === qi ? { ...q, [field]: val } : q) }));
  const setOpt = (qi, oi, val) => setForm(f => ({ ...f, questions: f.questions.map((q, i) => i === qi ? { ...q, options: q.options.map((o, j) => j === oi ? { ...o, text: val } : o) } : q) }));
  const setCorrect = (qi, oi) => setForm(f => ({ ...f, questions: f.questions.map((q, i) => i === qi ? { ...q, options: q.options.map((o, j) => ({ ...o, isCorrect: j === oi })) } : q) }));

  const handleSubmit = () => {
    if (!form.title || !form.groupId) return toast.error('Test sarlavhasi va guruhni tanlash shart');
    if (form.questions.some(q => !q.text)) return toast.error('Barcha savollar matni to\'ldirilishi kerak');
    createMutation.mutate(form);
  };

  const TYPE_NAMES = {
    topic: 'Mavzuli test',
    weekly: 'Haftalik test',
    monthly: 'Oylik nazorat',
    mock: 'Katta sinov (Mock)',
  };

  const DIFF_NAMES = {
    easy: 'Oson',
    medium: "O'rta",
    hard: 'Qiyin',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Yangi test yaratish</h1>
          <p className="text-xs text-gray-500">Guruh o'quvchilari uchun qo'lda yoki mavzuli savollar to'plamini tuzing</p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Test sarlavhasi *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Masalan: 1-chorak oraliq nazorati" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Test turi</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-field">
              {TYPES.map(t => <option key={t} value={t}>{TYPE_NAMES[t] || t}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Guruh *</label>
            <select value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))} className="input-field">
              <option value="">Guruhni tanlang</option>
              {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Vaqt chegarasi (daqiqa)</label>
            <input type="number" min={5} max={180} value={form.timeLimit} onChange={e => setForm(f => ({ ...f, timeLimit: +e.target.value }))} className="input-field" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {form.questions.map((q, qi) => (
          <motion.div key={qi} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{qi + 1}-savol</span>
              {form.questions.length > 1 && (
                <button onClick={() => setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== qi) }))}
                  className="btn-ghost p-1 rounded-lg text-red-400 hover:text-red-600" title="Savolni o'chirish">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <textarea value={q.text} onChange={e => setQ(qi, 'text', e.target.value)}
              placeholder="Savol matnini kiriting..." rows={2} className="input-field resize-none mb-3 text-sm" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
              {q.options.map((opt, oi) => (
                <div key={oi} className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer ${opt.isCorrect ? 'border-primary/50 bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                  onClick={() => setCorrect(qi, oi)}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${opt.isCorrect ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                    {opt.isCorrect && <Check size={10} className="text-white" />}
                  </div>
                  <input value={opt.text} onChange={e => setOpt(qi, oi, e.target.value)}
                    placeholder={`Variant ${String.fromCharCode(65 + oi)}`} onClick={e => e.stopPropagation()}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-100" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <select value={q.difficulty} onChange={e => setQ(qi, 'difficulty', e.target.value)} className="input-field text-xs py-2">
                  {DIFFS.map(d => <option key={d} value={d}>{DIFF_NAMES[d] || d}</option>)}
                </select>
              </div>
              <div className="w-28">
                <input type="number" min={1} value={q.points} onChange={e => setQ(qi, 'points', +e.target.value)}
                  placeholder="Ball" className="input-field text-xs py-2" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={() => setForm(f => ({ ...f, questions: [...f.questions, emptyQ()] }))}
          className="btn-outline flex-1 flex items-center justify-center gap-2 py-2.5"><Plus size={15} /> Savol qo'shish</button>
        <button onClick={handleSubmit} disabled={createMutation.isPending} className="btn-primary flex-1 py-2.5">
          {createMutation.isPending ? 'Yaratilmoqda...' : `Testni e'lon qilish (${form.questions.length} ta savol)`}
        </button>
      </div>
    </div>
  );
    </div>
  );
}
