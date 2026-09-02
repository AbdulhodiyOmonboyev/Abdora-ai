import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Upload, Send } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

export default function CreateHomework() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', groupId: '', dueDate: '', maxScore: 100 });
  const [files, setFiles] = useState([]);

  const { data: groups } = useQuery({ queryKey: ['my-groups'], queryFn: () => api.get('/groups').then(r => r.data.data) });

  const createMutation = useMutation({
    mutationFn: (fd) => api.post('/homework', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { toast.success('Homework created! Students notified.'); navigate('/teacher/homework'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const handleSubmit = () => {
    if (!form.title || !form.groupId || !form.dueDate) return toast.error('Fill all required fields');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    files.forEach(f => fd.append('files', f));
    createMutation.mutate(fd);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Uy vazifasi yaratish</h1>
      </div>
      <div className="card space-y-4">
        <div><label className="block text-sm font-medium mb-1.5">Sarlavha *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Uy vazifasi nomi" className="input-field" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1.5">Guruh *</label>
            <select value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))} className="input-field">
              <option value="">Guruhni tanlang</option>
              {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select></div>
          <div><label className="block text-sm font-medium mb-1.5">Muddat *</label>
            <input type="datetime-local" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="input-field" /></div>
        </div>
        <div><label className="block text-sm font-medium mb-1.5">Maksimal ball</label>
          <input type="number" value={form.maxScore} onChange={e => setForm(f => ({ ...f, maxScore: +e.target.value }))} className="input-field" /></div>
        <div><label className="block text-sm font-medium mb-1.5">Tavsif / Ko'rsatmalar</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Uy vazifasi haqida yozing..." rows={5} className="input-field resize-none" /></div>
        <div><label className="block text-sm font-medium mb-1.5">Ilovalar</label>
          <label className="border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary/40 text-center block text-sm text-gray-400">
            <Upload size={18} className="mx-auto mb-1" /> Upload files
            <input type="file" multiple className="hidden" onChange={e => setFiles(Array.from(e.target.files))} />
          </label>
          {files.map((f, i) => <div key={i} className="text-xs mt-1 text-gray-500">{f.name}</div>)}
        </div>
        <button onClick={handleSubmit} disabled={createMutation.isPending} className="btn-primary w-full flex items-center justify-center gap-2">
          <Send size={15} /> {createMutation.isPending ? 'Creating...' : 'Create & Notify Students'}
        </button>
      </div>
    </div>
  );
}
