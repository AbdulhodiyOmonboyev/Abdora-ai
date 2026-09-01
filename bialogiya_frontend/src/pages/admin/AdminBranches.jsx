import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Building2, MapPin, Trash2, Edit2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import BranchLocationPicker from '../../components/ui/BranchLocationPicker';
import { geocodeSuggestions } from '../../utils/geocode';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import SearchInput from '../../components/ui/SearchInput';
import EmptyState from '../../components/ui/EmptyState';

const EMPTY_FORM = { name: '', address: '', studentCapacity: '', latitude: null, longitude: null };

// Reusable modal shell
function BranchModal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="modal-backdrop"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="modal-panel"
          >
            <div className="modal-header">
              <div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: 'rgba(240, 100, 19, 0.1)', border: '1px solid rgba(240, 100, 19, 0.18)' }}
                >
                  <Building2 size={20} style={{ color: 'var(--primary)' }} />
                </div>
                <h2 className="modal-title">{title}</h2>
              </div>
              <button onClick={onClose} className="btn-icon flex-shrink-0">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Address field with geocode suggestions
function AddressField({ value, onChange, suggestions, showSuggestions, onFocus, onBlur, onSelectSuggestion, geocoding }) {
  return (
    <div className="relative">
      <label className="form-label">
        Manzil
        {geocoding && <span className="form-hint ml-1">(qidirilmoqda...)</span>}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className="input-field"
        placeholder="Tuman, ko'cha, uy raqami"
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-[1100] mt-1 w-full max-h-56 overflow-auto rounded-xl border shadow-lg text-sm"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => onSelectSuggestion(s)}
                className="dropdown-item w-full"
              >
                <MapPin size={13} style={{ color: 'var(--text-muted)' }} className="flex-shrink-0 mt-0.5" />
                <span>{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
  const [localSearch, setLocalSearch] = useState('');
  const markerMovedRef = useRef(false);
  const editMarkerMovedRef = useRef(false);

  useEffect(() => {
    if (!showCreate || markerMovedRef.current || !form.address || form.address.trim().length < 4) {
      setSuggestions([]); return undefined;
    }
    setGeocoding(true);
    const t = setTimeout(async () => {
      const results = await geocodeSuggestions(form.address, 5);
      setGeocoding(false);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      if (results[0]) setForm(prev => ({ ...prev, latitude: results[0].lat, longitude: results[0].lng }));
    }, 500);
    return () => { clearTimeout(t); setGeocoding(false); };
  }, [form.address, showCreate]);

  useEffect(() => {
    if (!showEdit || editMarkerMovedRef.current || !editForm.address || editForm.address.trim().length < 4) {
      setEditSuggestions([]); return undefined;
    }
    setEditGeocoding(true);
    const t = setTimeout(async () => {
      const results = await geocodeSuggestions(editForm.address, 5);
      setEditGeocoding(false);
      setEditSuggestions(results);
      setShowEditSuggestions(results.length > 0);
      if (results[0]) setEditForm(prev => ({ ...prev, latitude: results[0].lat, longitude: results[0].lng }));
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
  const urlSearch = searchParams.get('search')?.trim().toLowerCase() || '';
  const activeSearch = localSearch.trim().toLowerCase() || urlSearch;

  const filteredBranches = Array.isArray(branches) ? (activeSearch
    ? branches.filter(b =>
        b.name?.toLowerCase().includes(activeSearch)
        || b.address?.toLowerCase().includes(activeSearch)
        || b.reception?.name?.toLowerCase().includes(activeSearch)
      )
    : branches) : [];

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/branches', data),
    onSuccess: () => { qc.invalidateQueries(['admin-branches']); setShowCreate(false); setForm(EMPTY_FORM); toast.success('Filial yaratildi'); },
    onError: (error) => toast.error(friendlyAiErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/admin/branches/${editingBranch.id}`, data),
    onSuccess: () => { qc.invalidateQueries(['admin-branches']); setShowEdit(false); setEditingBranch(null); setEditForm(EMPTY_FORM); toast.success('Filial tahrirlandi'); },
    onError: (error) => toast.error(friendlyAiErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/branches/${id}`),
    onSuccess: () => { qc.invalidateQueries(['admin-branches']); toast.success("Filial o'chirildi"); },
    onError: (error) => toast.error(friendlyAiErrorMessage(error)),
  });

  const closeModal = () => { setShowCreate(false); setForm(EMPTY_FORM); markerMovedRef.current = false; setSuggestions([]); setShowSuggestions(false); };
  const closeEditModal = () => { setShowEdit(false); setEditingBranch(null); setEditForm(EMPTY_FORM); editMarkerMovedRef.current = false; setEditSuggestions([]); setShowEditSuggestions(false); };

  const openEdit = (branch) => {
    editMarkerMovedRef.current = !!(branch.latitude && branch.longitude);
    setEditingBranch(branch);
    setEditForm({ name: branch.name, address: branch.address || '', studentCapacity: branch.studentCapacity || '', latitude: branch.latitude ?? null, longitude: branch.longitude ?? null });
    setEditSuggestions([]); setShowEditSuggestions(false); setShowEdit(true);
  };

  const openDelete = (branch) => {
    setConfirm({
      title: `"${branch.name}" filialini o'chirish`,
      message: "Filial va uning barcha guruhlari tizimdan o'chiriladi.",
      onConfirm: () => deleteMutation.mutate(branch.id),
    });
  };

  const handleSelectCreateSuggestion = (s) => {
    markerMovedRef.current = true;
    setForm(p => ({ ...p, address: s.label, latitude: s.lat, longitude: s.lng }));
    setShowSuggestions(false);
  };

  const handleSelectEditSuggestion = (s) => {
    editMarkerMovedRef.current = true;
    setEditForm(p => ({ ...p, address: s.label, latitude: s.lat, longitude: s.lng }));
    setShowEditSuggestions(false);
  };

  return (
    <div className="dashboard-shell">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />

      {/* Header */}
      <PageHeader
        title="Markazlar"
        subtitle="Barcha markazlarni boshqaring"
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} /> Markaz qo'shish
          </button>
        }
      />

      {/* Filters */}
      <div className="filter-bar mb-1">
        <SearchInput
          value={localSearch}
          onChange={setLocalSearch}
          placeholder="Markaz nomi bo'yicha qidirish..."
        />
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          {filteredBranches.length} ta markaz
        </span>
      </div>

      {/* Table */}
      {filteredBranches.length > 0 ? (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Markaz</th>
                <th>Manzil</th>
                <th>Manager</th>
                <th>O'qituvchi</th>
                <th>O'quvchi</th>
                <th>Holat</th>
                <th className="text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map((branch, i) => (
                <motion.tr
                  key={branch.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <td>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/branches/${branch.id}`)}
                      className="flex items-center gap-2.5 text-left"
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(240, 100, 19, 0.1)', border: '1px solid rgba(240, 100, 19, 0.18)' }}
                      >
                        <Building2 size={14} style={{ color: 'var(--primary)' }} />
                      </div>
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {branch.name}
                      </span>
                    </button>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {branch.address ? (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                        {branch.address}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {branch.manager?.name || branch.reception?.name || '—'}
                  </td>
                  <td>
                    <span className="font-semibold">{branch._count?.teachers || 0}</span>
                  </td>
                  <td>
                    <span className="font-semibold">{branch.studentsCount || 0}</span>
                  </td>
                  <td>
                    <StatusBadge status={branch.isActive === false ? 'nofaol' : 'faol'} />
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        onClick={() => openEdit(branch)}
                        className="btn-icon"
                        title="Tahrirlash"
                      >
                        <Edit2 size={14} style={{ color: 'var(--secondary)' }} />
                      </button>
                      <button
                        onClick={() => openDelete(branch)}
                        className="btn-icon"
                        title="O'chirish"
                      >
                        <Trash2 size={14} style={{ color: 'var(--error)' }} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title={activeSearch ? "Qidiruv bo'yicha markaz topilmadi" : "Hozircha markazlar yo'q"}
          description={activeSearch ? `"${activeSearch}" uchun hech narsa topilmadi` : "Birinchi markazni qo'shing"}
          action={!activeSearch && (
            <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm">
              <Plus size={14} /> Markaz qo'shish
            </button>
          )}
        />
      )}

      {/* Create Modal */}
      <BranchModal open={showCreate} onClose={closeModal} title="Markaz qo'shish">
        <div className="space-y-4">
          <div>
            <label className="form-label">Markaz nomi *</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="input-field"
              placeholder="Markaz nomi"
            />
          </div>

          <AddressField
            value={form.address}
            onChange={v => { markerMovedRef.current = false; setForm(p => ({ ...p, address: v })); }}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onSelectSuggestion={handleSelectCreateSuggestion}
            geocoding={geocoding}
          />

          <div>
            <label className="form-label">O'quvchi kapasiteti</label>
            <input
              value={form.studentCapacity}
              onChange={e => setForm(p => ({ ...p, studentCapacity: e.target.value }))}
              className="input-field"
              placeholder="Jami o'quvchi soni"
              type="number"
            />
          </div>

          <div>
            <label className="form-label">
              Markaz joylashuvi
              {form.latitude && <span className="form-hint ml-1"> (xaritada bosing yoki markerni suring)</span>}
            </label>
            <BranchLocationPicker
              value={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : null}
              onChange={({ lat, lng }) => setForm(p => ({ ...p, latitude: lat, longitude: lng }))}
              onManualChange={() => { markerMovedRef.current = true; }}
            />
            {!form.latitude && (
              <p className="form-hint mt-1">Manzilni yozing yoki xaritada nuqtani belgilang.</p>
            )}
          </div>
        </div>

        {createMutation.error && (
          <p className="form-error text-center mt-2">{friendlyAiErrorMessage(createMutation.error)}</p>
        )}
        <div className="modal-footer">
          <button onClick={closeModal} className="btn-ghost">Bekor qilish</button>
          <button
            onClick={() => { if (!form.name) return; createMutation.mutate(form); }}
            disabled={!form.name || createMutation.isPending}
            className="btn-primary"
          >
            {createMutation.isPending ? 'Saqlanmoqda...' : 'Yaratish'}
          </button>
        </div>
      </BranchModal>

      {/* Edit Modal */}
      <BranchModal open={showEdit} onClose={closeEditModal} title="Markaz tahrirlash">
        <div className="space-y-4">
          <div>
            <label className="form-label">Markaz nomi *</label>
            <input
              value={editForm.name}
              onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
              className="input-field"
              placeholder="Markaz nomi"
            />
          </div>

          <AddressField
            value={editForm.address}
            onChange={v => { editMarkerMovedRef.current = false; setEditForm(p => ({ ...p, address: v })); }}
            suggestions={editSuggestions}
            showSuggestions={showEditSuggestions}
            onFocus={() => { if (editSuggestions.length) setShowEditSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowEditSuggestions(false), 150)}
            onSelectSuggestion={handleSelectEditSuggestion}
            geocoding={editGeocoding}
          />

          <div>
            <label className="form-label">O'quvchi kapasiteti</label>
            <input
              value={editForm.studentCapacity}
              onChange={e => setEditForm(p => ({ ...p, studentCapacity: e.target.value }))}
              className="input-field"
              placeholder="Jami o'quvchi soni"
              type="number"
            />
          </div>

          <div>
            <label className="form-label">
              Markaz joylashuvi
              {editForm.latitude && <span className="form-hint ml-1"> (xaritada bosing yoki markerni suring)</span>}
            </label>
            <BranchLocationPicker
              value={editForm.latitude && editForm.longitude ? { lat: editForm.latitude, lng: editForm.longitude } : null}
              onChange={({ lat, lng }) => setEditForm(p => ({ ...p, latitude: lat, longitude: lng }))}
              onManualChange={() => { editMarkerMovedRef.current = true; }}
            />
            {!editForm.latitude && (
              <p className="form-hint mt-1">Manzilni yozing yoki xaritada nuqtani belgilang.</p>
            )}
          </div>
        </div>

        {updateMutation.error && (
          <p className="form-error text-center mt-2">{friendlyAiErrorMessage(updateMutation.error)}</p>
        )}
        <div className="modal-footer">
          <button onClick={closeEditModal} className="btn-ghost">Bekor qilish</button>
          <button
            onClick={() => { if (!editForm.name) return; updateMutation.mutate(editForm); }}
            disabled={!editForm.name || updateMutation.isPending}
            className="btn-primary"
          >
            {updateMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </BranchModal>
    </div>
  );
}
