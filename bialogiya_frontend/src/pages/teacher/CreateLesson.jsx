import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Brain, Sparkles, Lock, Trash2, Paperclip, BookOpen, X, CheckCircle2 } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { SUBJECTS, SUBJECT_LABELS } from '../../utils/subjects';

export default function CreateLesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', content: '', subject: 'other', groupId: '', order: 0 });
  const [files, setFiles] = useState([]);
  const [aiEnabled, setAiEnabled] = useState(true);

  const { data: groups } = useQuery({ queryKey: ['my-groups'], queryFn: () => api.get('/groups').then(r => r.data.data) });
  const { data: lesson, refetch: refetchLesson } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => api.get(`/lessons/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (lesson) {
      setForm(prev => {
        const next = {
          title: lesson.title || '',
          content: lesson.content || '',
          subject: lesson.subject || 'biology',
          groupId: lesson.groupId || '',
          order: lesson.order || 0,
        };
        return (prev.title === next.title && prev.content === next.content && prev.subject === next.subject && prev.groupId === next.groupId && prev.order === next.order) ? prev : next;
      });
      setAiEnabled(lesson.aiEnabled !== false);
    }
  }, [lesson]);

  const createMutation = useMutation({
    mutationFn: (fd) => api.post('/lessons', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { toast.success('Dars yaratildi! AI materiallarni tayyorlamoqda...'); navigate('/teacher/lessons'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Dars yaratishda xatolik yuz berdi'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => api.put(`/lessons/${id}`, payload),
    onSuccess: () => { toast.success('Dars muvaffaqiyatli yangilandi'); navigate('/teacher/lessons'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Darsni yangilashda xatolik yuz berdi'),
  });

  const removeAttachment = useMutation({
    mutationFn: (attachmentId) => api.delete(`/lessons/${id}/attachments/${attachmentId}`),
    onSuccess: () => { toast.success('Fayl o\'chirildi'); refetchLesson(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xatolik'),
  });

  const hasResourceFiles = files.some(f => f.name.match(/\.(pdf|docx|doc|txt)$/i)) ||
    (lesson?.attachments?.some(a => a.name?.match(/\.(pdf|docx|doc|txt)$/i)));

  const handleSubmit = () => {
    if (!form.title || !form.groupId) return toast.error('Dars nomi va guruhni kiritish shart');

    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('content', form.content);
    fd.append('subject', form.subject);
    fd.append('order', form.order);
    fd.append('groupId', form.groupId);
    fd.append('aiEnabled', String(aiEnabled));
    files.forEach(f => fd.append('files', f));

    if (id) updateMutation.mutate(fd);
    else createMutation.mutate(fd);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">{id ? 'Darsni tahrirlash' : 'Yangi dars yaratish'}</h1>
          <p className="text-xs text-gray-500">AI dars uchun tushuntirishlar, testlar va o'quv materiallarini tayyorlaydi</p>
        </div>
      </div>

      {/* AI banner */}
      <div className={`rounded-2xl p-4 flex items-start gap-3 transition-colors ${aiEnabled ? 'gradient-bg text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}>
        {aiEnabled ? <Brain size={24} className="flex-shrink-0 mt-0.5" /> : <Lock size={24} className="flex-shrink-0 mt-0.5 text-gray-400" />}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">
            {aiEnabled ? 'AI intellektual dars generatsiyasi' : 'AI o\'chirilgan'}
          </div>
          <div className={`text-xs mt-0.5 ${aiEnabled ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
            {aiEnabled
              ? 'Sodda tushuntirish, mnemonika (eslab qolish), hikoya, test, kartochkalar va aql xaritasi — siz yuklagan PDF yoki kiritgan matn asosida avtomatik tayyorlanadi.'
              : 'Faqat siz yozgan matn va yuklagan fayllar ko\'rsatiladi.'}
          </div>
          <div className={`text-xs mt-1.5 font-medium ${aiEnabled ? 'text-white/95' : 'text-gray-600 dark:text-gray-300'}`}>
            Sizning dars matningiz va biriktirilgan darsliklaringiz doimo saqlanib qoladi.
          </div>
        </div>
        <button type="button" onClick={() => setAiEnabled(v => !v)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors ${aiEnabled ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
          {aiEnabled ? 'O\'chirish' : 'Yoqish'}
        </button>
      </div>

      <div className="card space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Dars sarlavhasi *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Masalan: Fotosintez jarayoni, Hujayra tuzilishi..." className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Fan *</label>
            <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="input-field">
              {SUBJECTS.map(s => (
                <option key={s} value={s}>{SUBJECT_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Guruh *</label>
            <select value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))} className="input-field">
              <option value="">Guruhni tanlang</option>
              {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>

        {/* Resurs fayllar yuklash (PDF darslik, DOCX, rasmlar) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium">O'quv materiallari va darsliklar (PDF, Word, Rasm)</label>
            <span className="text-xs text-primary font-medium flex items-center gap-1">
              <Sparkles size={12} /> AI o'qiy oladi
            </span>
          </div>

          <div className="p-3 mb-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2.5">
            <BookOpen size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              <strong>PDF yoki Word darslik yuklasangiz:</strong> AI uning ichidagi barcha ma'lumotlarni, atamalarni va qoidalarni to'liq o'qib chiqib, darsni aynan shu kitob/resurs faktlari asosida mukammal generatsiya qiladi!
            </div>
          </div>

          {lesson?.attachments?.length > 0 && (
            <div className="mb-3 space-y-1.5">
              <span className="text-xs text-gray-500 font-medium">Avval yuklangan fayllar:</span>
              {lesson.attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
                  <Paperclip size={13} className="text-gray-400 flex-shrink-0" />
                  <span className="flex-1 truncate text-gray-700 dark:text-gray-200 font-medium">{att.name}</span>
                  <button type="button" onClick={() => removeAttachment.mutate(att.id)} disabled={removeAttachment.isPending}
                    className="text-red-400 hover:text-red-500 disabled:opacity-40 flex-shrink-0 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/50" title="O'chirish">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all block">
            <Upload size={24} className="mx-auto mb-1.5 text-primary" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 block">PDF, DOCX yoki rasmlarni tanlang</span>
            <span className="text-xs text-gray-400 block mt-0.5">Maksimal 5 ta fayl. AI avtomatik matnni o'rganib chiqadi</span>
            <input type="file" multiple accept=".pdf,.docx,.doc,.txt,image/*" className="hidden"
              onChange={e => {
                const newSelected = Array.from(e.target.files);
                setFiles(prev => [...prev, ...newSelected]);
                e.target.value = null;
              }} />
          </label>
          {id && <p className="text-xs text-gray-400 mt-1">Yangi yuklangan fayllar avvalgilariga qo'shiladi.</p>}

          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              <span className="text-xs text-gray-500 font-medium">Biriktirilgan yangi fayllar ({files.length}):</span>
              {files.map((f, i) => {
                const isPdf = f.name.toLowerCase().endsWith('.pdf');
                const isDoc = f.name.toLowerCase().match(/\.(docx|doc)$/);
                const isImg = f.type.startsWith('image/');
                return (
                  <div key={i} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isPdf ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' :
                        isDoc ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' :
                        isImg ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {isPdf ? 'PDF' : isDoc ? 'DOCX' : isImg ? 'IMG' : 'TXT'}
                      </span>
                      <span className="truncate text-gray-700 dark:text-gray-200 max-w-[200px] sm:max-w-[280px] font-medium">{f.name}</span>
                      <span className="text-[11px] text-gray-400">({(f.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(isPdf || isDoc) && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium hidden sm:inline">
                          AI o'qiydi
                        </span>
                      )}
                      <button type="button" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors" title="Bekor qilish">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium">Dars matni / Konspekt</label>
            {hasResourceFiles && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                <CheckCircle2 size={12} /> PDF/fayl yuklandi (matn ixtiyoriy)
              </span>
            )}
          </div>
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder={hasResourceFiles ? "PDF darslik yuklandi. Agar qo'shimcha konspekt yoki maxsus ko'rsatma bo'lsa, shu yerga yozishingiz mumkin..." : "Dars matnini shu yerga yozing yoki nusxa oling. Yoki yuqorida PDF darslik yuklang..."}
            rows={7} className="input-field resize-none text-sm" />
          <p className="text-xs text-gray-400 mt-1">Maslahat: AI siz yozgan matn va yuklangan PDF fayllarni birga o'rganib chiqib, to'liq o'quv materiallarini tayyorlaydi.</p>
        </div>

        <button onClick={handleSubmit} disabled={id ? updateMutation.isPending : createMutation.isPending}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 shadow-lg shadow-primary/20">
          {(id ? updateMutation.isPending : createMutation.isPending) ? (
            <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> {id ? 'Saqlanmoqda...' : 'Yaratilmoqda...'}</>
          ) : (
            <>
              <Sparkles size={16} />
              {id
                ? 'Darsni saqlash'
                : (aiEnabled
                    ? (hasResourceFiles ? '📚 Dars yaratish va PDF darslikdan AI generatsiya qilish' : 'Dars yaratish va AI materiallarni tayyorlash')
                    : 'Dars yaratish')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
