import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Building2, Users, BookOpen, MapPin, Trash2, Edit2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import BranchLocationPicker from '../../components/ui/BranchLocationPicker';
import { geocodeSuggestions } from '../../utils/geocode';

const EMPTY_FORM = { name: '', address: '', studentCapacity: '', latitude: null, longitude: null };

export default function AdminBranches() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [confirm, setConfirm] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [editGeocoding, setEditGeocoding] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [editSuggestions, setEditSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);
  const markerMovedRef = useRef(false);
  const editMarkerMovedRef = useRef(false);

  // As the address is typed (debounced), fetch a handful of matching
  // address suggestions from OpenStreetMap and pin the map to the best
  // match — without requiring the user to press any "search" button.
  useEffect(() => {
    if (!showCreate || markerMovedRef.current || !form.address || form.address.trim().length < 4) {
      setSuggestions([]);
      return undefined;
    }
    setGeocoding(true);
    const t = setTimeout(async () => {
      const results = await geocodeSuggestions(form.address, 5);
      setGeocoding(false);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      if (results[0]) setForm((prev) => ({ ...prev, latitude: results[0].lat, longitude: results[0].lng }));
    }, 500);
    return () => { clearTimeout(t); setGeocoding(false); };
  }, [form.address, showCreate]);

  useEffect(() => {
    if (!showEdit || editMarkerMovedRef.current || !editForm.address || editForm.address.trim().length < 4) {
      setEditSuggestions([]);
      return undefined;
    }
    setEditGeocoding(true);
    const t = setTimeout(async () => {
      const results = await geocodeSuggestions(editForm.address, 5);
      setEditGeocoding(false);
      setEditSuggestions(results);
      setShowEditSuggestions(results.length > 0);
      if (results[0]) setEditForm((prev) => ({ ...prev, latitude: results[0].lat, longitude: results[0].lng }));
    }, 500);
    return () => { clearTimeout(t); setEditGeocoding(false); };
  }, [editForm.address, showEdit]);

  const { data: branches = [] } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: () => api.get('/admin/branches').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
  });

  const [searchParams] = useSearchParams();
  const search = searchParams.get('search')?.trim().toLowerCase() || '';
  const filteredBranches = Array.isArray(branches) ? (search
    ? branches.filter((branch) =>
        branch.name?.toLowerCase().includes(search)
        || branch.address?.toLowerCase().includes(search)
        || branch.reception?.name?.toLowerCase().includes(search)
      )
    : branches) : [];

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/branches', data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-branches']);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      toast.success('Filial yaratildi');
    },
    onError: (error) => toast.error(friendlyAiErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/admin/branches/${editingBranch.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-branches']);
      setShowEdit(false);
      setEditingBranch(null);
      setEditForm(EMPTY_FORM);
      toast.success('Filial tahrirlandi');
    },
    onError: (error) => toast.error(friendlyAiErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/branches/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['admin-branches']);
      toast.success('Filial o\'chirildi');
    },
    onError: (error) => toast.error(friendlyAiErrorMessage(error)),
  });

  const closeModal = () => {
    setShowCreate(false);
    setForm(EMPTY_FORM);
    markerMovedRef.current = false;
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const closeEditModal = () => {
    setShowEdit(false);
    setEditingBranch(null);
    setEditForm(EMPTY_FORM);
    editMarkerMovedRef.current = false;
    setEditSuggestions([]);
    setShowEditSuggestions(false);
  };

  const openEdit = (branch) => {
    editMarkerMovedRef.current = !!(branch.latitude && branch.longitude);
    setEditingBranch(branch);
    setEditForm({
      name: branch.name,
      address: branch.address || '',
      studentCapacity: branch.studentCapacity || '',
      latitude: branch.latitude ?? null,
      longitude: branch.longitude ?? null,
    });
    setEditSuggestions([]);
    setShowEditSuggestions(false);
    setShowEdit(true);
  };

  const selectSuggestion = (s) => {
    markerMovedRef.current = true;
    setForm((prev) => ({ ...prev, address: s.label, latitude: s.lat, longitude: s.lng }));
    setShowSuggestions(false);
  };

  const selectEditSuggestion = (s) => {
    editMarkerMovedRef.current = true;
    setEditForm((prev) => ({ ...prev, address: s.label, latitude: s.lat, longitude: s.lng }));
    setShowEditSuggestions(false);
  };

  const openDelete = (branch) => {
    setConfirm({
      title: `"${branch.name}" filialini o'chirish`,
      message: 'Filial va uning barcha guruhlari tizimdan o\'chiriladi.',
      onConfirm: () => deleteMutation.mutate(branch.id),
    });
  };

  const submitForm = () => {
    if (!form.name) return;
    createMutation.mutate(form);
  };

  const submitEditForm = () => {
    if (!editForm.name) return;
    updateMutation.mutate(editForm);
  };

  return (
    <div className="dashboard-shell max-w-6xl mx-auto">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
      <header className="dashboard-header dashboard-header-plain">
        <div>
          <span className="dashboard-badge"><Building2 size={12} /> Admin</span>
          <h1>Markazlar</h1>
          <p>Barсha markazlarni boshqarish</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Markaz qo'shish
        </button>
      </header>

      <div className="panel-card overflow-hidden p-0">
        {filteredBranches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="dashboard-table w-full text-left text-sm">
              <thead><tr><th>Markaz</th><th>Manzil</th><th>Manager</th><th>O'qituvchi</th><th>O'quvchi</th><th>Holat</th><th className="text-right">Amallar</th></tr></thead>
              <tbody>
                {filteredBranches.map((branch, index) => (
                  <motion.tr key={branch.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.04 }}>
                    <td className="cursor-pointer font-semibold text-white" onClick={() => navigate(`/admin/branches/${branch.id}`)}>{branch.name}</td>
                    <td className="text-slate-400">{branch.address || '—'}</td>
                    <td className="text-slate-300">{branch.manager?.name || branch.reception?.name || '—'}</td>
                    <td className="text-slate-300">{branch._count?.teachers || 0}</td>
                    <td className="text-slate-300">{branch.studentsCount || 0}</td>
                    <td><span className="tag-pill">Faol</span></td>
                    <td><div className="flex justify-end gap-1"><button onClick={() => openEdit(branch)} className="btn-ghost p-2 rounded-lg text-blue-400" title="Tahrirlash"><Edit2 size={14} /></button><button onClick={() => openDelete(branch)} className="btn-ghost p-2 rounded-lg text-red-400" title="O'chirish"><Trash2 size={14} /></button></div></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400"><Building2 size={48} className="mx-auto mb-3 opacity-30" /><p>{search ? "Qidiruv bo'yicha hech qanday markaz topilmadi." : "Hozircha markazlar yo'q."}</p></div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Markaz qo'shish</h2>
                <button onClick={closeModal} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Markaz nomi *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Markaz nomi"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Manzil</label>
                  <input
                    value={form.address}
                    onChange={(e) => { markerMovedRef.current = false; setForm((prev) => ({ ...prev, address: e.target.value })); }}
                    onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    className="input-field w-full"
                    placeholder="Tuman, ko'cha, uy raqami"
                    autoComplete="off"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-[1100] mt-1 w-full max-h-56 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg text-sm">
                      {suggestions.map((s, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectSuggestion(s)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-start gap-2"
                          >
                            <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
                            <span>{s.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">O'quvchi kapasiteti</label>
                  <input
                    value={form.studentCapacity}
                    onChange={(e) => setForm((prev) => ({ ...prev, studentCapacity: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Jami o'quvchi soni"
                    type="number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Markaz joylashuvi {geocoding ? <span className="text-gray-400 font-normal">(manzil bo'yicha qidirilmoqda...)</span> : form.latitude && <span className="text-gray-400 font-normal">(xaritada bosing yoki markerni suring)</span>}
                  </label>
                  <BranchLocationPicker
                    value={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : null}
                    onChange={({ lat, lng }) => setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
                    onManualChange={() => { markerMovedRef.current = true; }}
                  />
                  {!form.latitude && (
                    <p className="text-xs text-gray-400 mt-1">Manzilni yozing yoki xaritada nuqtani belgilang.</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={closeModal} className="btn-ghost flex-1">
                    Bekor
                  </button>
                  <button
                    onClick={submitForm}
                    disabled={!form.name || createMutation.isPending}
                    className="btn-primary flex-1 disabled:opacity-40"
                  >
                    {createMutation.isPending ? 'Saqlanmoqda...' : 'Yaratish'}
                  </button>
                </div>
                {createMutation.error && (
                  <p className="text-xs text-red-500 text-center">
                    {friendlyAiErrorMessage(createMutation.error)}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeEditModal()}
          >
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Markaz tahrirlash</h2>
                <button onClick={closeEditModal} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Markaz nomi *</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Markaz nomi"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Manzil</label>
                  <input
                    value={editForm.address}
                    onChange={(e) => { editMarkerMovedRef.current = false; setEditForm((prev) => ({ ...prev, address: e.target.value })); }}
                    onFocus={() => { if (editSuggestions.length) setShowEditSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowEditSuggestions(false), 150)}
                    className="input-field w-full"
                    placeholder="Tuman, ko'cha, uy raqami"
                    autoComplete="off"
                  />
                  {showEditSuggestions && editSuggestions.length > 0 && (
                    <ul className="absolute z-[1100] mt-1 w-full max-h-56 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg text-sm">
                      {editSuggestions.map((s, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectEditSuggestion(s)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-start gap-2"
                          >
                            <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
                            <span>{s.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">O'quvchi kapasiteti</label>
                  <input
                    value={editForm.studentCapacity}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, studentCapacity: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Jami o'quvchi soni"
                    type="number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Markaz joylashuvi {editGeocoding ? <span className="text-gray-400 font-normal">(manzil bo'yicha qidirilmoqda...)</span> : editForm.latitude && <span className="text-gray-400 font-normal">(xaritada bosing yoki markerni suring)</span>}
                  </label>
                  <BranchLocationPicker
                    value={editForm.latitude && editForm.longitude ? { lat: editForm.latitude, lng: editForm.longitude } : null}
                    onChange={({ lat, lng }) => setEditForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
                    onManualChange={() => { editMarkerMovedRef.current = true; }}
                  />
                  {!editForm.latitude && (
                    <p className="text-xs text-gray-400 mt-1">Manzilni yozing yoki xaritada nuqtani belgilang.</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={closeEditModal} className="btn-ghost flex-1">
                    Bekor
                  </button>
                  <button
                    onClick={submitEditForm}
                    disabled={!editForm.name || updateMutation.isPending}
                    className="btn-primary flex-1 disabled:opacity-40"
                  >
                    {updateMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
                {updateMutation.error && (
                  <p className="text-xs text-red-500 text-center">
                    {friendlyAiErrorMessage(updateMutation.error)}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
