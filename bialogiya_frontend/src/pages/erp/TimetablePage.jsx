import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, Users, ChevronLeft, ChevronRight, Filter, GraduationCap, Building2, Clock, X } from 'lucide-react';
import api from '../../config/axios';
import PageHeader from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
const DAY_SHORT = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha', 'Yak'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8–21

const GROUP_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#EF4444', '#EC4899', '#14B8A6', '#F97316',
  '#06B6D4', '#84CC16', '#A855F7', '#F43F5E',
];

function timeToDecimal(timeStr) {
  if (!timeStr) return 0;
  const [h, m = '0'] = timeStr.split(':');
  return parseInt(h) + parseInt(m) / 60;
}

function SlotBlock({ slot, color, isConflict, onClick }) {
  const top = (timeToDecimal(slot.startTime) - 8) * 60;
  const height = (timeToDecimal(slot.endTime) - timeToDecimal(slot.startTime)) * 60;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => onClick?.(slot)}
      className="absolute left-1 right-1 rounded-lg px-2 py-1 cursor-pointer overflow-hidden"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        background: isConflict ? '#FEF2F2' : color + '20',
        border: `1.5px solid ${isConflict ? '#EF4444' : color}`,
        zIndex: 5,
      }}
      whileHover={{ scale: 1.02 }}
    >
      {isConflict && (
        <AlertTriangle size={10} className="text-red-500 mb-0.5" />
      )}
      <div className="text-[10px] font-semibold leading-tight truncate"
        style={{ color: isConflict ? '#EF4444' : color }}>
        {slot.groupName || slot.teacherName || '—'}
      </div>
      <div className="text-[9px] leading-tight" style={{ color: isConflict ? '#EF4444' : color + 'BB' }}>
        {slot.startTime}–{slot.endTime}
      </div>
    </motion.div>
  );
}

export default function TimetablePage() {
  const [viewMode, setViewMode] = useState('room'); // 'room' | 'teacher' | 'group'
  const [selectedBranch, setSelectedBranch] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-list'],
    queryFn: () => api.get('/admin/branches').then(r => r.data?.data || []).catch(() => []),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms', selectedBranch],
    queryFn: () => api.get('/rooms', { params: { branchId: selectedBranch || undefined } })
      .then(r => r.data?.data || []).catch(() => []),
  });

  const { data: schedule = [], isLoading } = useQuery({
    queryKey: ['timetable', selectedBranch, filterRoom, filterTeacher],
    queryFn: () => api.get('/schedule', {
      params: { branchId: selectedBranch || undefined, roomId: filterRoom || undefined, teacherId: filterTeacher || undefined }
    }).then(r => r.data?.data || []).catch(() => []),
  });

  // Detect conflicts: same room + same day + overlapping time
  const conflictIds = new Set();
  for (let i = 0; i < schedule.length; i++) {
    for (let j = i + 1; j < schedule.length; j++) {
      const a = schedule[i], b = schedule[j];
      const sameRoom = a.roomId && a.roomId === b.roomId;
      const sameTeacher = a.teacherId && a.teacherId === b.teacherId;
      const sameDay = a.dayOfWeek === b.dayOfWeek;
      if ((sameRoom || sameTeacher) && sameDay) {
        const aStart = timeToDecimal(a.startTime), aEnd = timeToDecimal(a.endTime);
        const bStart = timeToDecimal(b.startTime), bEnd = timeToDecimal(b.endTime);
        if (aStart < bEnd && bStart < aEnd) {
          conflictIds.add(a.id);
          conflictIds.add(b.id);
        }
      }
    }
  }

  // Group by entity (room or teacher) and day
  const groupColorMap = {};
  let colorIdx = 0;

  const entities = viewMode === 'room'
    ? (filterRoom ? rooms.filter(r => r.id === filterRoom) : rooms)
    : [];

  const getSlotsByEntityAndDay = (entityId, day) => {
    return schedule.filter(s => {
      if (viewMode === 'room') return s.roomId === entityId && s.dayOfWeek === day;
      return true;
    });
  };

  const getGroupColor = (groupId) => {
    if (!groupColorMap[groupId]) {
      groupColorMap[groupId] = GROUP_COLORS[colorIdx % GROUP_COLORS.length];
      colorIdx++;
    }
    return groupColorMap[groupId];
  };

  const conflictCount = conflictIds.size / 2;

  return (
    <div className="dashboard-shell max-w-full">
      <PageHeader
        title="Haftalik Jadval (Timetable)"
        subtitle="Guruhlar, xonalar va o'qituvchilar jadvalini ko'rish"
      />

      {/* Conflict Alert */}
      {conflictCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444' }}
        >
          <AlertTriangle size={18} />
          <div>
            <div className="font-semibold text-sm">
              {conflictCount} ta to'qnashuv aniqlandi!
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#DC2626' }}>
              Qizil belgilangan darslar bir xona yoki o'qituvchiga to'qnashmoqda. Iltimos, jadval o'zgartiring.
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-4 rounded-2xl"
        style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
        <Filter size={15} style={{ color: 'var(--text-muted)' }} />

        {branches.length > 0 && (
          <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="input-field w-auto text-sm">
            <option value="">Barcha filiallar</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}

        <select value={filterRoom} onChange={e => setFilterRoom(e.target.value)} className="input-field w-auto text-sm">
          <option value="">Barcha xonalar</option>
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>

        {/* View mode toggle */}
        <div className="ml-auto flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          {[
            { key: 'room',    label: 'Xona bo\'yicha' },
            { key: 'teacher', label: 'O\'qituvchi' },
          ].map(m => (
            <button
              key={m.key}
              onClick={() => setViewMode(m.key)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: viewMode === m.key ? 'var(--primary)' : 'var(--card)',
                color: viewMode === m.key ? 'white' : 'var(--text-secondary)',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timetable Grid */}
      {isLoading ? (
        <div className="space-y-3"><Skeleton className="h-64 rounded-2xl" /></div>
      ) : schedule.length === 0 && rooms.length === 0 ? (
        <div className="panel-card text-center py-16">
          <Calendar size={40} className="mx-auto mb-3 text-gray-400" />
          <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Jadval bo'sh</div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Guruhlar va xonalar qo'shilgandan so'ng jadval bu yerda ko'rinadi
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
          <div style={{ minWidth: 800 }}>
            {/* Header row */}
            <div className="grid sticky top-0 z-10" style={{
              gridTemplateColumns: `64px repeat(7, 1fr)`,
              background: 'var(--card)',
              borderBottom: '2px solid var(--border)',
            }}>
              <div className="p-3" />
              {DAYS.map((day, i) => (
                <div key={i} className="p-3 text-center text-xs font-semibold"
                  style={{ color: i >= 5 ? 'var(--primary)' : 'var(--text-primary)', borderLeft: '1px solid var(--border)' }}>
                  <div>{DAY_SHORT[i]}</div>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 10 }}>{day}</div>
                </div>
              ))}
            </div>

            {/* Time slots grid */}
            <div className="relative" style={{ background: 'var(--card)' }}>
              {/* Rooms/Teachers as "row groups" */}
              {(filterRoom ? rooms.filter(r => r.id === filterRoom) : rooms).map(room => (
                <div key={room.id}>
                  {/* Room label */}
                  <div className="px-3 py-2 text-xs font-semibold flex items-center gap-2"
                    style={{
                      background: (room.color || 'var(--primary)') + '15',
                      borderTop: '1px solid var(--border)',
                      color: room.color || 'var(--primary)',
                    }}>
                    <span className="w-3 h-3 rounded-full" style={{ background: room.color || 'var(--primary)' }} />
                    {room.name}
                    <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>
                      · {room.capacity} kishi
                    </span>
                  </div>

                  {/* Grid rows (hours) */}
                  <div className="grid relative" style={{ gridTemplateColumns: `64px repeat(7, 1fr)` }}>
                    {/* Hour labels */}
                    <div className="flex flex-col">
                      {HOURS.map(h => (
                        <div key={h} style={{ height: 60, borderTop: '1px solid var(--border)' }}
                          className="flex items-start justify-end pr-2 pt-1">
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{h}:00</span>
                        </div>
                      ))}
                    </div>

                    {/* Day columns */}
                    {Array.from({ length: 7 }, (_, dayIdx) => {
                      const daySlots = schedule.filter(s => s.roomId === room.id && s.dayOfWeek === dayIdx);
                      return (
                        <div key={dayIdx} className="relative"
                          style={{
                            height: HOURS.length * 60,
                            borderLeft: '1px solid var(--border)',
                            background: dayIdx >= 5 ? 'rgba(240,100,19,0.03)' : 'transparent',
                          }}>
                          {/* Hour lines */}
                          {HOURS.map(h => (
                            <div key={h} style={{ position: 'absolute', top: (h - 8) * 60, left: 0, right: 0, height: 1, background: 'var(--border)', opacity: 0.5 }} />
                          ))}

                          {/* Slot blocks */}
                          {daySlots.map(slot => (
                            <SlotBlock
                              key={slot.id}
                              slot={slot}
                              color={getGroupColor(slot.groupId || slot.id)}
                              isConflict={conflictIds.has(slot.id)}
                              onClick={setSelectedSlot}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* No rooms filtered but schedule exists */}
              {rooms.length === 0 && schedule.length > 0 && (
                <div className="grid relative" style={{ gridTemplateColumns: `64px repeat(7, 1fr)` }}>
                  <div className="flex flex-col">
                    {HOURS.map(h => (
                      <div key={h} style={{ height: 60, borderTop: '1px solid var(--border)' }}
                        className="flex items-start justify-end pr-2 pt-1">
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{h}:00</span>
                      </div>
                    ))}
                  </div>
                  {Array.from({ length: 7 }, (_, dayIdx) => {
                    const daySlots = schedule.filter(s => s.dayOfWeek === dayIdx);
                    return (
                      <div key={dayIdx} className="relative"
                        style={{ height: HOURS.length * 60, borderLeft: '1px solid var(--border)' }}>
                        {HOURS.map(h => (
                          <div key={h} style={{ position: 'absolute', top: (h - 8) * 60, left: 0, right: 0, height: 1, background: 'var(--border)', opacity: 0.5 }} />
                        ))}
                        {daySlots.map(slot => (
                          <SlotBlock
                            key={slot.id}
                            slot={slot}
                            color={getGroupColor(slot.groupId || slot.id)}
                            isConflict={conflictIds.has(slot.id)}
                            onClick={setSelectedSlot}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slot detail modal */}
      {selectedSlot && (
        <div
          className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-lg max-w-xs"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {selectedSlot.groupName || selectedSlot.teacherName || 'Guruh'}
            </div>
            <button className="btn-icon" onClick={() => setSelectedSlot(null)} title="Yopish">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {selectedSlot.teacherName && (
              <div className="flex items-center gap-1.5"><GraduationCap size={13} className="text-primary" /> <span>{selectedSlot.teacherName}</span></div>
            )}
            {selectedSlot.roomName && (
              <div className="flex items-center gap-1.5"><Building2 size={13} className="text-primary" /> <span>{selectedSlot.roomName}</span></div>
            )}
            <div className="flex items-center gap-1.5"><Calendar size={13} className="text-primary" /> <span>{DAYS[selectedSlot.dayOfWeek]}</span></div>
            <div className="flex items-center gap-1.5"><Clock size={13} className="text-primary" /> <span>{selectedSlot.startTime} – {selectedSlot.endTime}</span></div>
            {conflictIds.has(selectedSlot.id) && (
              <div className="flex items-center gap-1.5 text-red-500 font-medium mt-2">
                <AlertTriangle size={12} />
                To'qnashuv aniqlandi!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
