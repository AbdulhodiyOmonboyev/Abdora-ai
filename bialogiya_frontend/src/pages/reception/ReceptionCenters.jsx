import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Building2, MapPin, Users, ClipboardList } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../../config/axios';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function ReceptionCenters() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', studentCapacity: '' });
  const [confirm, setConfirm] = useState(null);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => r.data.data),
  });

  const [searchParams] = useSearchParams();
  const search = searchParams.get('search')?.trim().toLowerCase() || '';

  const { data: centers } = useQuery({
    queryKey: ['reception-branches'],
    queryFn: () => api.get('/reception/branches').then(r => r.data.data),
  });

  const filteredCenters = search
    ? centers.filter((center) =>
        center.name?.toLowerCase().includes(search)
        || center.address?.toLowerCase().includes(search)
      )
    : centers;

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/reception/branches', data),
    onSuccess: () => { qc.invalidateQueries(['reception-branches']); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/reception/branches/${id}`, data),
    onSuccess: () => { qc.invalidateQueries(['reception-branches']); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/reception/branches/${id}`),
    onSuccess: () => qc.invalidateQueries(['reception-branches']),
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', address: '', studentCapacity: '' });
  };

  const openEdit = (center) => {
    setEditingId(center.id);
    setForm({
      name: center.name,
      address: center.address || '',
      studentCapacity: center.studentCapacity ? String(center.studentCapacity) : '',
    });
    setShowForm(true);
  };

  const submit = () => {
    if (!form.name) return;
    const payload = {
      name: form.name,
      address: form.address,
      studentCapacity: form.studentCapacity ? Number(form.studentCapacity) : undefined,
    };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const handleDelete = (center) => {
    setConfirm({
      title: `"${center.name}" markazini o'chirish`,
      message: center._count?.groups > 0
        ? `Bu markazda ${center._count.groups} ta guruh bor. Markaz o'chirilsa, guruhlar markazsiz qoladi.`
        : "Bu markaz tizimdan olib tashlanadi.",
      onConfirm: () => deleteMutation.mutate(center.id),
    });
  };

  const count = centers?.length || 0;
  const limit = me?.maxBranches ?? 3;
  const atLimit = count >= limit;
  const saving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  return (
    <div className="max-w-3xl mx-auto">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">O'quv markazlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Har bir markaz uchun nom, manzil va o'quvchi sig'imi belgilang.</p>
          <p className="text-sm text-gray-500 mt-2">{count} / {limit} markaz ochilgan</p>
        </div>
        <button onClick={() => setShowForm(true)} disabled={atLimit} className="btn-primary flex items-center gap-2 disabled:opacity-40">
          <Plus size={15} /> Markaz qo'shish
        </button>
      </div>

      {atLimit && (
        <p className="text-xs text-amber-500 mb-4 text-center">
          Sizga ko'pi bilan {limit} ta markaz ochish ruxsat etilgan. Ko'proq kerak bo'lsa, administrator bilan bog'laning.
        </p>
      )}

      <div className="space-y-3">
        {filteredCenters?.map((center, index) => (
          <motion.div key={center.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
            className="card flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-3xl flex items-center justify-center text-primary flex-shrink-0">
              <Building2 size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base text-gray-800 dark:text-white">{center.name}</div>
              <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-2">
                {center.address && (
                  <span className="inline-flex items-center gap-1"><MapPin size={12} />{center.address}</span>
                )}
                <span>{center.studentCapacity ? `${center.studentCapacity} ta o'quvchi` : "Sig'im belgilanmagan"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
              <span className="badge bg-primary/10 text-primary">{center._count?.teachers || 0} o'qituvchi</span>
              <span className="badge bg-secondary/10 text-secondary">{center._count?.groups || 0} guruh</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={() => openEdit(center)} className="btn-ghost p-2 rounded-lg" title="Tahrirlash">Tahrirlash</button>
              <button onClick={() => handleDelete(center)} className="btn-ghost p-2 rounded-lg text-red-400 hover:bg-red-50" title="O'chirish">O'chirish</button>
            </div>
          </motion.div>
        ))}

        {filteredCenters?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Building2 size={36} className="mx-auto mb-3 opacity-30" />
            <p>{search ? "Qidiruv bo'yicha hech qanday markaz topilmadi." : 'Hali markaz yaratilmagan.'}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && closeForm()}>
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">{editingId ? "Markazni tahrirlash" : "Markaz qo'shish"}</h2>
                <button onClick={closeForm} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Markaz nomi *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Masalan: Chilonzor o'quv markazi" className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Manzil</label>
                  <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Ko'cha, uy raqami" className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">O'quvchi sig'imi</label>
                  <input value={form.studentCapacity} onChange={e => setForm(f => ({ ...f, studentCapacity: e.target.value.replace(/\D/g, '') }))}
                    placeholder="Masalan: 120" inputMode="numeric" className="input-field w-full" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={closeForm} className="btn-ghost flex-1">Bekor</button>
                  <button onClick={submit} disabled={!form.name || saving} className="btn-primary flex-1 disabled:opacity-40">
                    {saving ? 'Saqlanmoqda...' : editingId ? 'Saqlash' : 'Yaratish'}
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
