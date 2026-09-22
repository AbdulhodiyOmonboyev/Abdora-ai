import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Bot, Clock, Sparkles } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { getScoreColor, formatDateTime, formatDeadlineOffset } from '../../utils/format';

export default function GradeSubmissions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [grades, setGrades] = useState({});

  const { data: hw } = useQuery({ queryKey: ['hw', id], queryFn: () => api.get(`/homework/${id}`).then(r => r.data.data) });
  const { data: submissions, isLoading } = useQuery({ queryKey: ['submissions', id], queryFn: () => api.get(`/homework/${id}/submissions`).then(r => r.data.data) });

  const gradeMutation = useMutation({
    mutationFn: ({ subId, score, comment }) => api.put(`/homework/submissions/${subId}/grade`, { score, feedback: comment }),
    onSuccess: () => { qc.invalidateQueries(['submissions', id]); toast.success('Grade saved!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Topshiriqlarni baholash</h1>
          <p className="text-sm text-gray-500">{hw?.title}</p>
        </div>
      </div>

      {hw?.dueDate && (
        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
          <Clock size={12} /> Topshirish muddati: {formatDateTime(hw.dueDate)}
        </p>
      )}

      <div className="space-y-4">
        {submissions?.map((sub, i) => {
          const submittedAt = sub.submittedAt || sub.createdAt;
          const offset = formatDeadlineOffset(submittedAt, sub.homework?.dueDate || hw?.dueDate);
          return (
          <motion.div key={sub.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 gradient-bg rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {sub.student?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{sub.student?.name}</div>
                <div className="text-xs text-gray-400">@{sub.student?.username}</div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Clock size={11} /> {formatDateTime(submittedAt)}
                  </span>
                  {offset && (
                    <span className={offset.late ? 'text-red-500' : 'text-green-600'}>{offset.label}</span>
                  )}
                  {sub.updatedAt && sub.submittedAt && new Date(sub.submittedAt) - new Date(sub.createdAt) > 60000 && (
                    <span className="text-gray-400">qayta yuborilgan</span>
                  )}
                </div>
              </div>
              {sub.finalScore !== undefined && (
                <div className={`badge font-bold ${getScoreColor(sub.finalScore)}`}>{sub.finalScore}/{hw?.maxScore}</div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-300 mb-3">
              {sub.answerText || <span className="text-gray-400 italic">Matnli javob yo'q</span>}
            </div>

            {sub.aiGrade && (
              <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-3.5 mb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-400 font-semibold">
                    <Bot size={14} className="text-purple-600" />
                    <span>AI xulosasi va taklif qilingan ball:</span>
                    <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                      {sub.aiGrade.score} / {hw?.maxScore}
                    </span>
                  </div>
                  {sub.status !== 'teacher_reviewed' && (
                    <button
                      type="button"
                      onClick={() => {
                        setGrades(g => ({
                          ...g,
                          [sub.id]: {
                            score: sub.aiGrade.score,
                            comment: sub.aiGrade.feedback || ''
                          }
                        }));
                        toast.success("AI bali va izohi maydonlarga ko'chirildi");
                      }}
                      className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Sparkles size={12} />
                      AI bahosini qabul qilish
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  {sub.aiGrade.feedback}
                </p>

                {sub.aiGrade.keyMissingConcepts?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-purple-500/10">
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Yetishmayotgan tushunchalar:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {sub.aiGrade.keyMissingConcepts.map((concept, cIdx) => (
                        <span key={cIdx} className="text-[11px] bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {sub.aiGrade.suggestions?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-purple-500/10">
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">AI tavsiyalari:</span>
                    <ul className="list-disc list-inside text-[11px] text-gray-600 dark:text-gray-400 mt-0.5 space-y-0.5">
                      {sub.aiGrade.suggestions.map((sug, sIdx) => (
                        <li key={sIdx}>{sug}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {sub.status !== 'teacher_reviewed' ? (
              <div className="flex flex-col sm:flex-row gap-2.5 mt-1">
                <div className="w-full sm:w-32">
                  <input type="number" min={0} max={hw?.maxScore || 100}
                    placeholder={`Ball (max ${hw?.maxScore})`}
                    value={grades[sub.id]?.score ?? (sub.aiGrade?.score || '')}
                    onChange={e => setGrades(g => ({ ...g, [sub.id]: { ...g[sub.id], score: +e.target.value } }))}
                    className="input-field text-sm" />
                </div>
                <div className="flex-1">
                  <input placeholder="O'qituvchi izohi (ixtiyoriy)"
                    value={grades[sub.id]?.comment ?? (grades[sub.id]?.comment === undefined && sub.aiGrade?.feedback ? sub.aiGrade.feedback : '')}
                    onChange={e => setGrades(g => ({ ...g, [sub.id]: { ...g[sub.id], comment: e.target.value } }))}
                    className="input-field text-sm" />
                </div>
                <button
                  disabled={gradeMutation.isPending}
                  onClick={() => gradeMutation.mutate({
                    subId: sub.id,
                    score: grades[sub.id]?.score ?? sub.aiGrade?.score ?? 0,
                    comment: grades[sub.id]?.comment ?? sub.aiGrade?.feedback ?? ''
                  })}
                  className="btn-primary px-4 py-2 flex items-center justify-center gap-1.5 whitespace-nowrap text-sm">
                  <CheckCircle size={15} /> Tasdiqlash va Saqlash
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 bg-green-50/60 dark:bg-green-950/20 border border-green-200/60 dark:border-green-800/40 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium">
                  <CheckCircle size={15} className="text-green-600 flex-shrink-0" />
                  <div>
                    <span>O'qituvchi tomonidan tasdiqlangan: <strong>{sub.teacherGrade?.score}/{hw?.maxScore}</strong></span>
                    {sub.teacherGrade?.feedback && (
                      <p className="text-gray-600 dark:text-gray-400 font-normal mt-0.5">{sub.teacherGrade.feedback}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setGrades(g => ({
                    ...g,
                    [sub.id]: { score: sub.teacherGrade?.score, comment: sub.teacherGrade?.feedback || '' }
                  }))}
                  className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline ml-2 whitespace-nowrap"
                >
                  O'zgartirish
                </button>
              </div>
            )}
          </motion.div>
          );
        })}
        {!isLoading && submissions?.length === 0 && (
          <div className="text-center py-12 text-gray-400">Hali topshiriq yo'q</div>
        )}
      </div>
    </div>
  );
}
