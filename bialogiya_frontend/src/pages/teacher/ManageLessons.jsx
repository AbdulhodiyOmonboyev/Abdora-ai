import { getSubjectIcon } from '../../utils/subjects';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Trash2, RefreshCw, Pencil, Eye, Search, X, Check, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { useState } from 'react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

export default function ManageLessons() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const { data: lessons, isLoading } = useQuery({ queryKey: ['my-lessons'], queryFn: () => api.get('/lessons').then(r => r.data.data) });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/lessons/${id}`),
    onSuccess: () => { qc.invalidateQueries(['my-lessons']); toast.success('Lesson deleted'); },
  });

  const regenMutation = useMutation({
    mutationFn: (id) => api.post(`/lessons/${id}/regenerate-ai`),
    onSuccess: () => { qc.invalidateQueries(['my-lessons']); toast.success('AI regeneration started'); },
  });

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'done':
        return <span className="badge text-xs bg-primary/10 text-primary inline-flex items-center gap-1"><Check size={11} /> AI Ready</span>;
      case 'generating':
        return <span className="badge text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 inline-flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Generating</span>;
      case 'error':
        return <span className="badge text-xs bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 inline-flex items-center gap-1"><AlertTriangle size={11} /> Error</span>;
      case 'disabled':
        return <span className="badge text-xs bg-gray-100 text-gray-500">AI o'chirilgan</span>;
      case 'pending':
      default:
        return <span className="badge text-xs bg-gray-100 text-gray-500 inline-flex items-center gap-1"><Clock size={11} /> Pending</span>;
    }
  };

  const query = search.trim().toLowerCase();
  const filtered = (lessons || []).filter(l => !query
    || [l.title, l.group?.name].some(f => String(f || '').toLowerCase().includes(query)));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Darslar</h1>
        <Link to="/teacher/lessons/create" className="btn-primary flex items-center gap-2"><Plus size={15} /> Yangi dars</Link>
      </div>
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Dars nomi yoki guruh bo'yicha qidiring..." className="input-field pl-9 pr-9" />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>
        )}
      </div>
      <div className="space-y-3">
        {filtered.map((l, i) => (
          <motion.div key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            className="card flex items-center gap-3">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-xl flex-shrink-0">
              {getSubjectIcon(l.subject)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-800 dark:text-white truncate">{l.title}</div>
              <div className="flex items-center gap-2 mt-0.5">
                {renderStatusBadge(l.aiContent?.status)}
                <span className="text-xs text-gray-400">{l.group?.name}</span>
                <span className="text-xs text-gray-400">{l.views} views</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link to={`/teacher/lessons/${l.id}`} className="btn-ghost p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10" title="Darsni ko'rish"><Eye size={14} /></Link>
              <Link to={`/teacher/lessons/${l.id}/edit`} className="btn-ghost p-1.5 rounded-lg text-primary hover:bg-primary/10" title="Darsni tahrirlash"><Pencil size={14} /></Link>
              {l.aiEnabled !== false && (l.aiContent?.status === 'error' || l.aiContent?.status === 'pending') && (
                <button onClick={() => regenMutation.mutate(l.id)} className="btn-ghost p-1.5 rounded-lg text-secondary hover:text-secondary"><RefreshCw size={14} /></button>
              )}
              <button onClick={() => { deleteMutation.mutate(l.id); }}
                className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
            </div>
          </motion.div>
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
            {lessons?.length > 0
              ? <p>Qidiruv bo'yicha dars topilmadi.</p>
              : <p>Hali dars yo'q. <Link to="/teacher/lessons/create" className="text-primary hover:underline">Birinchisini yarating</Link></p>}
          </div>
        )}
      </div>
    </div>
  );
}
