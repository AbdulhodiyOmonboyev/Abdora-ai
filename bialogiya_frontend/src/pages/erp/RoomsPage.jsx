import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Building2, Users, Pencil, Trash2, Check,
  RefreshCw, Monitor, Wifi, Volume2, Coffee, Car,
  ChevronRight, X, LayoutGrid,
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { RowSkeleton } from '../../components/ui/Skeleton';

const AMENITY_OPTIONS = [
  { key: 'projector',  label: 'Proyektor',   icon: Monitor },
  { key: 'wifi',       label: 'Wi-Fi',       icon: Wifi },
  { key: 'speaker',    label: 'Dinamik',     icon: Volume2 },
  { key: 'whiteboard', label: 'Doska',       icon: LayoutGrid },
  { key: 'ac',         label: 'Konditioner', icon: Coffee },
  { key: 'parking',    label: 'Avtoturargoh',icon: Car },
];

const DAY_SHORT = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha', 'Yak'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 - 21:00

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#EF4444', '#EC4899', '#14B8A6', '#F97316',
];

function RoomCard({ room, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="panel-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
            style={{ background: room.color || 'var(--primary)' }}
          >
            {room.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {room.name}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Users size={11} /> {room.capacity} kishi
              </span>
              {room.floor && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  · {room.floor}-qavat
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button className="btn-icon" onClick={() => onEdit(room)} title="Tahrirlash">
            <Pencil size={14} />
          </button>
          <button className="btn-icon" onClick={() => onDelete(room)} title="O'chirish"
            style={{ color: 'var(--error)' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Amenities */}
      {room.amenities?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {room.amenities.map(key => {
            const opt = AMENITY_OPTIONS.find(a => a.key === key);
            if (!opt) return null;
            const Icon = opt.icon;
            return (
              <span
                key={key}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: 'var(--secondary-background)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                <Icon size={10} /> {opt.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Weekly schedule mini */}
      {room.schedule && room.schedule.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 text-xs font-medium"
            style={{ color: 'var(--primary)' }}
          >
            <LayoutGrid size={12} />
            Haftalik jadval ({room.schedule.length} slot)
            <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-2"
              >
                <div className="space-y-1">
                  {room.schedule.map((slot, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg"
                      style={{ background: 'var(--secondary-background)' }}>
                      <span className="w-6 text-center font-semibold" style={{ color: 'var(--text-muted)' }}>
                        {DAY_SHORT[slot.day]}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {slot.startTime}–{slot.endTime}
                      </span>
                      {slot.groupName && (
                        <span className="ml-auto font-medium truncate" style={{ color: 'var(--primary)' }}>
                          {slot.groupName}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

const emptyRoom = () => ({
  name: '', capacity: 20, floor: '', color: COLORS[0], amenities: [], branchId: '',
});

export default function RoomsPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState(emptyRoom());
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('');

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-list'],
    queryFn: () => api.get(
      user?.role === 'admin' ? '/admin/branches' : '/reception/branches'
    ).then(r => r.data?.data || r.data || []).catch(() => []),
  });

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms', selectedBranch],
    queryFn: () => api.get('/rooms', { params: { branchId: selectedBranch || undefined } })
      .then(r => r.data?.data || []),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['rooms'] });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/rooms', d),
    onSuccess: () => { invalidate(); toast.success("Xona qo'shildi"); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/rooms/${id}`, data),
    onSuccess: () => { invalidate(); toast.success('Xona yangilandi'); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/rooms/${id}`),
    onSuccess: () => { invalidate(); toast.success("Xona o'chirildi"); setDeleteConfirm(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const openCreate = () => {
    setForm({ ...emptyRoom(), branchId: selectedBranch || branches[0]?.id || '' });
    setEditingRoom(null);
    setModalOpen(true);
  };

  const openEdit = (room) => {
    setForm({ ...room });
    setEditingRoom(room);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingRoom(null); };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error('Xona nomi kiritilmagan');
    if (!form.capacity || form.capacity < 1) return toast.error("Sig'im kamida 1 bo'lishi kerak");
    if (editingRoom) {
      updateMutation.mutate({ id: editingRoom.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleAmenity = (key) => {
    const arr = form.amenities || [];
    setF('amenities', arr.includes(key) ? arr.filter(k => k !== key) : [...arr, key]);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Group rooms by branch for display
  const roomsByBranch = branches.reduce((acc, b) => {
    acc[b.id] = rooms.filter(r => r.branchId === b.id);
    return acc;
  }, {});
  const unassigned = rooms.filter(r => !r.branchId);

  return (
    <div className="dashboard-shell max-w-5xl">
      <PageHeader
        title="Xonalar (Auditoriyalar)"
        subtitle="O'quv xonalarini boshqarish va bandligini kuzatish"
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={15} /> Yangi xona
          </button>
        }
      />

      {/* Branch filter */}
      {branches.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-5">
          <button
            onClick={() => setSelectedBranch('')}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={!selectedBranch
              ? { background: 'var(--primary)', color: 'white' }
              : { background: 'var(--secondary-background)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
          >
            Barcha filiallar
          </button>
          {branches.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBranch(b.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={selectedBranch === b.id
                ? { background: 'var(--primary)', color: 'white' }
                : { background: 'var(--secondary-background)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3"><RowSkeleton count={4} /></div>
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Xonalar yo'q"
          subtitle="O'quv xonalarini qo'shing va haftalik bandligini kuzating"
          action={<button onClick={openCreate} className="btn-primary"><Plus size={15} /> Xona qo'shish</button>}
        />
      ) : (
        <div className="space-y-6">
          {/* Per-branch groups */}
          {branches.map(branch => {
            const bRooms = roomsByBranch[branch.id] || [];
            if (bRooms.length === 0 && selectedBranch && selectedBranch !== branch.id) return null;
            return (
              <div key={branch.id}>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 size={15} style={{ color: 'var(--text-muted)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {branch.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: 'var(--primary)', color: 'white' }}>
                    {bRooms.length}
                  </span>
                </div>
                {bRooms.length === 0 ? (
                  <div className="text-xs py-4 text-center rounded-xl"
                    style={{ color: 'var(--text-muted)', background: 'var(--secondary-background)', border: '1px dashed var(--border)' }}>
                    Bu filialda xona yo'q
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <AnimatePresence>
                      {bRooms.map(room => (
                        <RoomCard
                          key={room.id}
                          room={room}
                          onEdit={openEdit}
                          onDelete={setDeleteConfirm}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            );
          })}

          {/* Unassigned rooms */}
          {unassigned.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                Filial belgilanmagan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <AnimatePresence>
                  {unassigned.map(room => (
                    <RoomCard key={room.id} room={room} onEdit={openEdit} onDelete={setDeleteConfirm} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingRoom ? 'Xonani tahrirlash' : 'Yangi xona qo\'shish'}
        size="md"
        footer={
          <>
            <button onClick={closeModal} className="btn-ghost">Bekor</button>
            <button onClick={handleSubmit} disabled={isPending} className="btn-primary">
              {isPending ? <><RefreshCw size={14} className="animate-spin" />Saqlanmoqda...</> : <><Check size={14} />Saqlash</>}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Xona nomi *</label>
              <input value={form.name} onChange={e => setF('name', e.target.value)}
                className="input-field" placeholder="201-xona, Sinf A..." />
            </div>
            <div>
              <label className="form-label">Sig'imi (kishi) *</label>
              <input type="number" min={1} max={500} value={form.capacity}
                onChange={e => setF('capacity', +e.target.value)} className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Qavat</label>
              <input value={form.floor} onChange={e => setF('floor', e.target.value)}
                className="input-field" placeholder="1, 2, 3..." />
            </div>
            <div>
              <label className="form-label">Filial</label>
              <select value={form.branchId} onChange={e => setF('branchId', e.target.value)} className="input-field">
                <option value="">— Tanlang —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Rang</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setF('color', c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    background: c,
                    borderColor: form.color === c ? 'var(--text-primary)' : 'transparent',
                    transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Jihozlar va imkoniyatlar</label>
            <div className="grid grid-cols-3 gap-2">
              {AMENITY_OPTIONS.map(({ key, label, icon: Icon }) => {
                const on = (form.amenities || []).includes(key);
                return (
                  <button key={key} type="button" onClick={() => toggleAmenity(key)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      on ? 'border-[var(--primary)] bg-[var(--primary-50)] text-[var(--primary)]'
                         : 'border-[var(--border)] text-[var(--text-secondary)]'
                    }`}>
                    <Icon size={13} />
                    {label}
                    {on && <Check size={11} className="ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Xonani o'chirish"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteConfirm(null)} className="btn-ghost">Bekor</button>
            <button onClick={() => deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
              className="btn-primary" style={{ backgroundColor: 'var(--error)' }}>
              {deleteMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
              O'chirish
            </button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm?.name}</strong> xonasini o'chirmoqchimisiz?
          Bu xonaga biriktirilgan jadval ma'lumotlari ham o'chiriladi.
        </p>
      </Modal>
    </div>
  );
}
