import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Building2, MapPin, Pencil, Trash2 } from 'lucide-react';
import api from '../../config/axios';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function ReceptionBranches() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', address: '' });
  const [confirm, setConfirm] = useState(null);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => r.data.data),
  });

  const { data: branches } = useQuery({
    queryKey: ['reception-branches'],
    queryFn: () => api.get('/reception/branches').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/reception/branches', d),
    onSuccess: () => {
      qc.invalidateQueries(['reception-branches']);
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/reception/branches/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['reception-branches']);
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/reception/branches/${id}`),
    onSuccess: () => qc.invalidateQueries(['reception-branches']),
  });

  const maxBranches = me?.maxBranches ?? 3;
  const count = branches?.length || 0;
  const atLimit = count >= maxBranches;

  const closeModal = () => {
    setShowCreate(false);
    setEditingId(null);
    setForm({ name: '', address: '' });
  };

  const openEdit = (b) => {
    setEditingId(b.id);
    setForm({ name: b.name, address: b.address || '' });
    setShowCreate(true);
  };

  const submit = () => {
    if (!form.name) return;
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  };

  const handleDelete = (b) => {
    setConfirm({
      title: `"${b.name}"ni o'chirish`,
      message: b._count?.groups > 0
        ? `Bu filialda ${b._count.groups} ta guruh bor. Filial o'chirilsa, guruhlar filialsiz qoladi.`
        : "Bu filial ro'yxatdan olib tashlanadi.",
      onConfirm: () => deleteMutation.mutate(b.id),
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  return (
    <div className="dashboard-shell max-w-3xl mx-auto">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />

      <header className="dashboard-header dashboard-header-plain">
        <div>
          <span className="dashboard-badge"><Building2 size={12} /> Reception</span>
          <h1>Filiallar</h1>
          <p>{count} / {maxBranches} filial ochilgan</p>
        </div>
        <button onClick={() => setShowCreate(true)} disabled={atLimit} className="btn-primary flex items-center gap-2 disabled:opacity-40">
          <Plus size={15} /> Filial qo'shish
        </button>
      </header>

      {atLimit && (
        <p className="text-xs text-amber-500 mb-2 text-center">
          Sizga ko'pi bilan {maxBranches} ta filial ochish ruxsat etilgan. Ko'proq kerak bo'lsa, administratorga murojaat qiling.
        </p>
      )}

      <div className="space-y-2">
        {branches?.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="panel-card flex items-center gap-3">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <Building2 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-[var(--text-primary)]">{b.name}</div>
              {b.address && <div className="text-xs text-[var(--text-muted)] flex items-center gap-1"><MapPin size={10} /> {b.address}</div>}
            </div>
            <span className="badge text-xs bg-primary/10 text-primary whitespace-nowrap">{b._count?.groups || 0} guruh</span>
            <button onClick={() => openEdit(b)} className="btn-ghost p-2 rounded-lg" title="Tahrirlash">
              <Pencil size={14} />
            </button>
            <button onClick={() => handleDelete(b)} className="btn-ghost p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10" title="O'chirish">
              <Trash2 size={14} />
            </button>
          </motion.div>
        ))}
        {branches?.length === 0 && (
          <div className="text-center py-16 text-[var(--text-muted)]">
            <Building2 size={36} className="mx-auto mb-3 opacity-30" />
            <p>Hali filial ochilmagan.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && closeModal()}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-[var(--card)] dark:bg-gray-900 border border-[var(--border)] dark:border-transparent rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-[var(--text-primary)]">{editingId ? 'Filialni tahrirlash' : "Filial qo'shish"}</h2>
                <button onClick={closeModal} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Filial nomi *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Masalan: Chilonzor filiali" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Manzil</label>
                  <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Ko'cha, uy raqami" className="input-field" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={closeModal} className="btn-ghost flex-1">Bekor</button>
                  <button
                    onClick={submit}
                    disabled={!form.name || isSaving}
                    className="btn-primary flex-1 disabled:opacity-40">
                    {isSaving ? 'Saqlanmoqda...' : editingId ? 'Saqlash' : "Qo'shish"}
                  </button>
                </div>
                {saveError && (
                  <p className="text-xs text-red-500 text-center">{friendlyAiErrorMessage(saveError)}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
