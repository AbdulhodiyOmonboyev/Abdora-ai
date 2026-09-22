import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, FileText, Clock, Trash2, BarChart2, Upload, X, Loader2, Sparkles, FileCheck, AlertTriangle, Image as ImageIcon, Paperclip, Eye, Pencil, Check, CheckCircle2 } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

const TYPE_COLORS = { topic: 'bg-blue-100 text-blue-700', weekly: 'bg-green-100 text-green-700', monthly: 'bg-purple-100 text-purple-700', mock: 'bg-orange-100 text-orange-700' };

function TestQuestionsModal({ testId, onClose }) {
  const qc = useQueryClient();
  const [editingQId, setEditingQId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newQ, setNewQ] = useState({
    text: '',
    difficulty: 'medium',
    explanation: '',
    points: 1,
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  });

  const { data: test, isLoading } = useQuery({
    queryKey: ['test', testId],
    queryFn: () => api.get(`/tests/${testId}`).then(r => r.data.data),
    enabled: !!testId,
  });

  const updateQMutation = useMutation({
    mutationFn: ({ qId, data }) => api.put(`/tests/${testId}/questions/${qId}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['test', testId]);
      qc.invalidateQueries(['my-tests']);
      toast.success('Savol yangilandi');
      setEditingQId(null);
      setEditForm(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xatolik yuz berdi'),
  });

  const deleteQMutation = useMutation({
    mutationFn: (qId) => api.delete(`/tests/${testId}/questions/${qId}`),
    onSuccess: () => {
      qc.invalidateQueries(['test', testId]);
      qc.invalidateQueries(['my-tests']);
      toast.success('Savol o\'chirildi');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xatolik yuz berdi'),
  });

  const addQMutation = useMutation({
    mutationFn: (data) => api.post(`/tests/${testId}/questions`, data),
    onSuccess: () => {
      qc.invalidateQueries(['test', testId]);
      qc.invalidateQueries(['my-tests']);
      toast.success('Yangi savol qo\'shildi');
      setIsAdding(false);
      setNewQ({
        text: '',
        difficulty: 'medium',
        explanation: '',
        points: 1,
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xatolik yuz berdi'),
  });

  const questions = test?.questions || [];

  const startEdit = (q) => {
    setEditingQId(q.id);
    setEditForm({
      text: q.text,
      difficulty: q.difficulty || 'medium',
      explanation: q.explanation || '',
      points: q.points || 1,
      options: Array.isArray(q.options) ? JSON.parse(JSON.stringify(q.options)) : [],
    });
  };

  const handleSaveEdit = (qId) => {
    if (!editForm.text) return toast.error('Savol matnini kiriting');
    if (editForm.options?.some(o => !o.text)) return toast.error('Barcha variantlarni to\'ldiring');
    if (!editForm.options?.some(o => o.isCorrect)) return toast.error('Bitta to\'g\'ri variantni tanlang');
    updateQMutation.mutate({ qId, data: editForm });
  };

  const handleAddSubmit = () => {
    if (!newQ.text) return toast.error('Savol matnini kiriting');
    if (newQ.options?.some(o => !o.text)) return toast.error('Barcha variantlarni to\'ldiring');
    if (!newQ.options?.some(o => o.isCorrect)) return toast.error('To\'g\'ri variantni tanlang');
    addQMutation.mutate(newQ);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-6 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge bg-primary/10 text-primary text-xs font-semibold">Test savollari tekshiruvi</span>
              {test?.source === 'ai_file' && <span className="badge bg-blue-100 text-blue-700 text-xs">AI tuzgan</span>}
            </div>
            <h2 className="font-bold text-lg text-gray-800 dark:text-white mt-1">{test?.title || 'Test savollari'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Guruh: {test?.group?.name} • {questions.length} ta savol • {test?.timeLimit} daqiqa</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 size={28} className="animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-gray-400">Savollar yuklanmoqda...</p>
            </div>
          ) : (
            <>
              {isAdding && (
                <div className="p-4 rounded-2xl border-2 border-primary/40 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-primary">Yangi savol qo'shish</span>
                    <button onClick={() => setIsAdding(false)} className="btn-ghost p-1 text-gray-400"><X size={14} /></button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Savol matni *</label>
                    <input value={newQ.text} onChange={e => setNewQ(q => ({ ...q, text: e.target.value }))}
                      placeholder="Savol matnini kiriting..." className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Variantlar (To'g'risini tanlang) *</label>
                    <div className="space-y-2">
                      {newQ.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input type="radio" name="modal_newQ_correct" checked={opt.isCorrect}
                            onChange={() => setNewQ(q => ({ ...q, options: q.options.map((o, j) => ({ ...o, isCorrect: j === oi })) }))}
                            className="w-4 h-4 text-primary" />
                          <span className="text-xs font-semibold w-5">{String.fromCharCode(65 + oi)})</span>
                          <input value={opt.text} onChange={e => setNewQ(q => ({ ...q, options: q.options.map((o, j) => j === oi ? { ...o, text: e.target.value } : o) }))}
                            placeholder={`Variant ${String.fromCharCode(65 + oi)}`} className="input-field text-xs py-1.5 flex-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Qiyinlik darajasi</label>
                      <select value={newQ.difficulty} onChange={e => setNewQ(q => ({ ...q, difficulty: e.target.value }))} className="input-field text-xs py-1.5">
                        <option value="easy">Oson</option>
                        <option value="medium">O'rta</option>
                        <option value="hard">Qiyin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Tushuntirish</label>
                      <input value={newQ.explanation} onChange={e => setNewQ(q => ({ ...q, explanation: e.target.value }))}
                        placeholder="To'g'ri javob sababi..." className="input-field text-xs py-1.5" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button onClick={() => setIsAdding(false)} className="btn-ghost text-xs py-1.5 px-3">Bekor</button>
                    <button onClick={handleAddSubmit} disabled={addQMutation.isPending} className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1">
                      {addQMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Qo'shish
                    </button>
                  </div>
                </div>
              )}

              {questions.length === 0 && !isAdding && (
                <div className="text-center py-10 text-gray-400">
                  <FileText size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Ushbu testda hali savollar yo'q</p>
                </div>
              )}

              {questions.map((q, qi) => {
                const isEditing = editingQId === q.id;

                if (isEditing) {
                  return (
                    <div key={q.id} className="p-4 rounded-2xl border-2 border-primary/40 bg-white dark:bg-gray-800 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-primary">Savol {qi + 1} ni tahrirlash</span>
                        <button onClick={() => { setEditingQId(null); setEditForm(null); }} className="btn-ghost p-1 text-gray-400"><X size={14} /></button>
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
                              <input type="radio" name={`modal_editQ_${q.id}_correct`} checked={opt.isCorrect}
                                onChange={() => setEditForm(f => ({ ...f, options: f.options.map((o, j) => ({ ...o, isCorrect: j === oi })) }))}
                                className="w-4 h-4 text-primary" />
                              <span className="text-xs font-semibold w-5">{String.fromCharCode(65 + oi)})</span>
                              <input value={opt.text} onChange={e => setEditForm(f => ({ ...f, options: f.options.map((o, j) => j === oi ? { ...o, text: e.target.value } : o) }))}
                                className="input-field text-xs py-1.5 flex-1" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Qiyinlik darajasi</label>
                          <select value={editForm.difficulty} onChange={e => setEditForm(f => ({ ...f, difficulty: e.target.value }))} className="input-field text-xs py-1.5">
                            <option value="easy">Oson</option>
                            <option value="medium">O'rta</option>
                            <option value="hard">Qiyin</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Tushuntirish</label>
                          <input value={editForm.explanation || ''} onChange={e => setEditForm(f => ({ ...f, explanation: e.target.value }))}
                            className="input-field text-xs py-1.5" />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <button onClick={() => { setEditingQId(null); setEditForm(null); }} className="btn-ghost text-xs py-1.5 px-3">Bekor</button>
                        <button onClick={() => handleSaveEdit(q.id)} disabled={updateQMutation.isPending}
                          className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1">
                          {updateQMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Saqlash
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={q.id} className="p-4 rounded-2xl border border-[var(--border)] bg-gray-50/50 dark:bg-gray-800/40 hover:border-primary/30 transition-all space-y-2.5">
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
                        <button onClick={() => startEdit(q)} className="btn-ghost p-1.5 rounded-lg text-primary hover:bg-primary/10" title="Savolni tahrirlash">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteQMutation.mutate(q.id)} disabled={deleteQMutation.isPending}
                          className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30" title="O'chirish">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {Array.isArray(q.options) && q.options.map((opt, oi) => (
                        <div key={oi} className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${opt.isCorrect ? 'bg-green-50/80 dark:bg-green-950/20 border-green-300 dark:border-green-800 text-green-800 dark:text-green-300 font-medium' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
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

                    {q.explanation && (
                      <div className="text-xs bg-white dark:bg-gray-800 rounded-xl p-2.5 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                        <span className="font-semibold text-primary">Tushuntirish: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between flex-shrink-0">
          {!isAdding ? (
            <button onClick={() => setIsAdding(true)} className="btn-ghost text-xs border border-primary/30 text-primary py-1.5 px-3 flex items-center gap-1.5">
              <Plus size={14} /> Yangi savol qo'shish
            </button>
          ) : <div />}
          <button onClick={onClose} className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Tasdiqlash va Yopish
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageTests() {
  const qc = useQueryClient();
  const [inspectingTestId, setInspectingTestId] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfGroupId, setPdfGroupId] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');
  const [useAI, setUseAI] = useState(true);
  const fileRef = useRef();

  const { data: tests, isLoading } = useQuery({
    queryKey: ['my-tests'],
    queryFn: () => api.get('/tests').then(r => r.data.data),
    // AI generation finishes after the upload response, so keep polling while
    // any test is still being written.
    refetchInterval: (query) => (query.state.data?.some(t => t.aiStatus === 'generating') ? 3000 : false),
  });
  const { data: groups } = useQuery({ queryKey: ['my-groups'], queryFn: () => api.get('/groups').then(r => r.data.data) });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tests/${id}`),
    onSuccess: () => { qc.invalidateQueries(['my-tests']); toast.success('Test o\'chirildi'); },
  });

  const pdfMutation = useMutation({
    mutationFn: (formData) => api.post('/lessons/generate-test-from-pdf', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: (res) => {
      qc.invalidateQueries(['my-tests']);
      // 202 = row created, AI still writing the questions in the background.
      if (res.status === 202) {
        toast.success('Yuklandi. AI savollarni tayyorlamoqda — ro\'yxatda kuzating.');
      } else {
        toast.success(res.data.message || 'Test yaratildi');
        (res.data.data?.warnings || []).forEach(w => toast(w));
      }
      setShowPdfModal(false);
      setPdfFile(null);
      setPdfGroupId('');
      setPdfTitle('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const handlePdfSubmit = () => {
    if (!pdfFile || !pdfGroupId) return toast.error('Fayl va guruhni tanlang');
    const fd = new FormData();
    fd.append('pdf', pdfFile);
    fd.append('groupId', pdfGroupId);
    fd.append('useAI', String(useAI));
    if (pdfTitle) fd.append('title', pdfTitle);
    pdfMutation.mutate(fd);
  };

  const renderFileIcon = (file) => {
    if (!file) return null;
    if (file.type === 'application/pdf') return <FileText size={32} className="text-red-500 mx-auto" />;
    if (file.type.startsWith('image/')) return <ImageIcon size={32} className="text-blue-500 mx-auto" />;
    if (file.type.includes('word')) return <FileText size={32} className="text-blue-600 mx-auto" />;
    return <Paperclip size={32} className="text-gray-500 mx-auto" />;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Testlar</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPdfModal(true)} className="btn-ghost flex items-center gap-2 text-sm border border-primary/30 text-primary hover:bg-primary/5">
            <Upload size={14} /> Fayldan yaratish
          </button>
          <Link to="/teacher/tests/create" className="btn-primary flex items-center gap-2"><Plus size={15} /> Test yaratish</Link>
        </div>
      </div>

      {/* PDF modal */}
      <AnimatePresence>
        {showPdfModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowPdfModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <FileText size={20} className="text-primary" /> Fayldan test yaratish
                </h2>
                <button onClick={() => setShowPdfModal(false)} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Guruh *</label>
                  <select value={pdfGroupId} onChange={e => setPdfGroupId(e.target.value)} className="input-field">
                    <option value="">Guruhni tanlang</option>
                    {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">AI aralashsinmi?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setUseAI(true)}
                      className={`rounded-2xl border-2 p-3 text-left transition-all ${useAI ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                      <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <Sparkles size={13} className={useAI ? 'text-primary' : 'text-gray-400'} /> Ha, AI tuzsin
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Fayldan o'qib, 15 ta yangi savol yaratadi</div>
                    </button>
                    <button type="button" onClick={() => setUseAI(false)}
                      className={`rounded-2xl border-2 p-3 text-left transition-all ${!useAI ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                      <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <FileCheck size={13} className={!useAI ? 'text-primary' : 'text-gray-400'} /> Yo'q, aralashmasin
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Fayldagi savollar o'zgartirilmasdan olinadi</div>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Test nomi (ixtiyoriy)</label>
                  <input value={pdfTitle} onChange={e => setPdfTitle(e.target.value)}
                    placeholder={useAI ? 'AI avtomatik nom beradi' : 'Masalan: Kimyo 1-dars'} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Fayl *</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                      ${pdfFile ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}`}>
                    {pdfFile ? (
                      <div>
                        <div className="mb-1">{renderFileIcon(pdfFile)}</div>
                        <div className="text-sm font-medium text-primary">{pdfFile.name}</div>
                        <div className="text-xs text-gray-400">{(pdfFile.size / 1024 / 1024).toFixed(1)} MB</div>
                        <button onClick={e => { e.stopPropagation(); setPdfFile(null); }}
                          className="text-xs text-red-400 mt-1 hover:underline">O'chirish</button>
                      </div>
                    ) : (
                      <div>
                        <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                        <div className="text-sm text-gray-500">Faylni yuklash uchun bosing yoki tashlang</div>
                        <div className="text-xs text-gray-400 mt-1">PDF, Word (.docx), TXT, Rasm (JPG, PNG)</div>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file"
                    accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/*"
                    className="hidden" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
                </div>
                {useAI ? (
                  <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    AI faylni o'qib, undagi ma'lumotlardan 15 ta test savoli yaratadi va guruhga tayinlaydi. Rasmlar uchun Gemini Vision ishlatiladi.
                    Yuklangandan keyin kutib turish shart emas — test ro'yxatida tayyor bo'lishini kuzatasiz.
                  </p>
                ) : (
                  <div className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-1.5">
                    <p className="text-gray-500 dark:text-gray-300 font-medium">Fayldagi savollar aynan o'zi olinadi. Format:</p>
                    <pre className="font-mono text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{`1. Savol matni?
A) birinchi variant
*B) to'g'ri variant
C) uchinchi variant
D) to'rtinchi variant`}</pre>
                    <p>To'g'ri javobni <span className="font-mono">*</span> bilan, yoki savol ostida <span className="font-mono">Javob: B</span> deb, yoki fayl oxirida <span className="font-mono">Javoblar: 1-B 2-A</span> ro'yxati bilan belgilashingiz mumkin.</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowPdfModal(false)} className="btn-ghost flex-1">Bekor</button>
                <button onClick={handlePdfSubmit} disabled={!pdfFile || !pdfGroupId || pdfMutation.isPending}
                  className="btn-primary flex-1 disabled:opacity-40 flex items-center justify-center gap-2">
                  {pdfMutation.isPending
                    ? (<><Loader2 size={14} className="animate-spin" /> Yuklanmoqda...</>)
                    : (useAI ? 'Test yaratish' : 'Savollarni olish')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="space-y-3">
        {tests?.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            className="card flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              {t.aiStatus === 'generating'
                ? <Loader2 size={18} className="text-primary animate-spin" />
                : <FileText size={18} className="text-primary" />}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800 dark:text-white">{t.title}</div>
              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-400">
                <span className={`badge ${TYPE_COLORS[t.type] || 'bg-gray-100 text-gray-600'}`}>{t.type}</span>
                <span>{t.group?.name}</span>
                <span className="flex items-center gap-1"><Clock size={11} /> {t.timeLimit} min</span>
                {t.aiStatus === 'generating' ? (
                  <span className="badge bg-blue-100 text-blue-700">AI yozmoqda...</span>
                ) : t.aiStatus === 'error' ? (
                  <span className="badge bg-red-100 text-red-600 flex items-center gap-1" title={t.aiError || ''}>
                    <AlertTriangle size={10} /> AI xato
                  </span>
                ) : (
                  <span>{t._count?.questions || 0} questions</span>
                )}
                {t.source === 'file_import' && <span className="badge bg-gray-100 text-gray-600">fayldan</span>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setInspectingTestId(t.id)} className="btn-ghost p-1.5 rounded-lg text-primary hover:bg-primary/10" title="Savollarni ko'rish va tekshirish">
                <Eye size={15} />
              </button>
              <Link to={`/teacher/tests/${t.id}/results`} className="btn-ghost p-1.5 rounded-lg text-secondary" title="Natijalar"><BarChart2 size={15} /></Link>
              <button onClick={() => { deleteMutation.mutate(t.id); }}
                className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-50" title="O'chirish"><Trash2 size={14} /></button>
            </div>
          </motion.div>
        ))}
        {!isLoading && tests?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <FileText size={36} className="mx-auto mb-3 opacity-30" />
            <p>Hali test yo'q. <Link to="/teacher/tests/create" className="text-primary hover:underline">Birinchi testni yarating</Link></p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {inspectingTestId && (
          <TestQuestionsModal testId={inspectingTestId} onClose={() => setInspectingTestId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
