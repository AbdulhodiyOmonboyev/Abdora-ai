import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, AlertTriangle, Filter, GraduationCap, Building2, Clock,
  ArrowUpRight, Users, X
} from 'lucide-react';
import api from '../../config/axios';
import { Skeleton } from '../ui/Skeleton';

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
const DAY_SHORT = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha', 'Yak'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 to 21:00

const GROUP_COLORS = [
  '#F06413', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#EF4444', '#EC4899', '#14B8A6', '#06B6D4', '#84CC16',
  '#A855F7', '#F43F5E',
];

function timeToDecimal(timeStr) {
  if (!timeStr) return 0;
  const [h, m = '0'] = timeStr.split(':');
  return parseInt(h, 10) + parseInt(m, 10) / 60;
}

function computeDayLayout(slots) {
  if (!slots || slots.length === 0) return [];
  const sorted = [...slots].sort((a, b) => timeToDecimal(a.startTime) - timeToDecimal(b.startTime));

  const clusters = [];
  let currentCluster = [];
  let clusterEnd = 0;

  sorted.forEach((slot) => {
    const start = timeToDecimal(slot.startTime);
    const end = timeToDecimal(slot.endTime);
    if (currentCluster.length === 0 || start < clusterEnd) {
      currentCluster.push(slot);
      clusterEnd = Math.max(clusterEnd, end);
    } else {
      clusters.push(currentCluster);
      currentCluster = [slot];
      clusterEnd = end;
    }
  });
  if (currentCluster.length > 0) clusters.push(currentCluster);

  const layouted = [];
  clusters.forEach((cluster) => {
    const totalCols = cluster.length;
    cluster.forEach((slot, colIdx) => {
      layouted.push({
        slot,
        colIdx,
        totalCols,
      });
    });
  });

  return layouted;
}

function SlotBlock({ item, color, isConflict, onClick }) {
  const { slot, colIdx, totalCols } = item;
  const top = (timeToDecimal(slot.startTime) - 8) * 60;
  const height = Math.max(28, (timeToDecimal(slot.endTime) - timeToDecimal(slot.startTime)) * 60);

  const widthPct = 100 / totalCols;
  const leftPct = colIdx * widthPct;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => onClick?.(slot)}
      className="absolute rounded-lg px-2 py-1 cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        background: isConflict ? 'rgba(239, 68, 68, 0.12)' : color + '1F',
        border: `1.5px solid ${isConflict ? '#EF4444' : color}`,
        zIndex: 5,
      }}
      whileHover={{ scale: 1.02 }}
    >
      {isConflict && (
        <AlertTriangle size={11} className="text-red-500 mb-0.5" />
      )}
      <div
        className="text-[11px] font-bold leading-tight truncate"
        style={{ color: isConflict ? '#EF4444' : color }}
      >
        {slot.groupName || slot.teacherName || 'Guruh'}
      </div>
      <div
        className="text-[10px] font-medium leading-tight mt-0.5"
        style={{ color: isConflict ? '#EF4444' : 'var(--text-secondary)' }}
      >
        {slot.startTime}–{slot.endTime}
      </div>
      {slot.roomName && (
        <div className="text-[9px] text-[var(--text-muted)] truncate mt-0.5">
          {slot.roomName}
        </div>
      )}
    </motion.div>
  );
}

export default function TimetableWidget({ showHeaderLink = true, maxHeight = '540px' }) {
  const [viewMode, setViewMode] = useState('room'); // 'room' | 'teacher'
  const [filterRoom, setFilterRoom] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Queries
  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms-widget'],
    queryFn: () => api.get('/rooms').then((r) => r.data?.data || []).catch(() => []),
  });

  const { data: schedule = [], isLoading } = useQuery({
    queryKey: ['timetable-widget', filterRoom, filterTeacher],
    queryFn: () =>
      api
        .get('/schedule', {
          params: {
            roomId: filterRoom || undefined,
            teacherId: filterTeacher || undefined,
          },
        })
        .then((r) => r.data?.data || [])
        .catch(() => []),
  });

  // Color mapping
  const groupColorMap = {};
  let colorIdx = 0;
  const getGroupColor = (key) => {
    if (!groupColorMap[key]) {
      groupColorMap[key] = GROUP_COLORS[colorIdx % GROUP_COLORS.length];
      colorIdx++;
    }
    return groupColorMap[key];
  };

  // Conflict detection
  const conflictIds = new Set();
  for (let i = 0; i < schedule.length; i++) {
    for (let j = i + 1; j < schedule.length; j++) {
      const a = schedule[i];
      const b = schedule[j];
      const sameRoom = a.roomId && a.roomId === b.roomId;
      const sameTeacher = a.teacherId && a.teacherId === b.teacherId;
      const sameDay = a.dayOfWeek === b.dayOfWeek;
      if ((sameRoom || sameTeacher) && sameDay) {
        const aStart = timeToDecimal(a.startTime);
        const aEnd = timeToDecimal(a.endTime);
        const bStart = timeToDecimal(b.startTime);
        const bEnd = timeToDecimal(b.endTime);
        if (aStart < bEnd && bStart < aEnd) {
          conflictIds.add(a.id);
          conflictIds.add(b.id);
        }
      }
    }
  }

  // Get current day index (0 = Mon, ..., 6 = Sun)
  const currentDayIdx = (new Date().getDay() + 6) % 7;

  // Extract unique teachers for filter
  const teachersMap = {};
  schedule.forEach((s) => {
    if (s.teacherId && s.teacherName) {
      teachersMap[s.teacherId] = s.teacherName;
    }
  });
  const teachersList = Object.entries(teachersMap).map(([id, name]) => ({ id, name }));

  return (
    <div className="panel-card space-y-4">
      {/* Widget Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary grid place-items-center flex-shrink-0">
            <Calendar size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Dars jadvali</h2>
              <span className="badge text-[10px] bg-primary/10 text-primary font-semibold">
                Haftalik
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Guruhlar va xonalar bo'yicha dars taqvimi
            </p>
          </div>
        </div>

        {/* Filters and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter select */}
          {viewMode === 'room' ? (
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="input-field text-xs py-1.5 px-2.5 w-auto"
            >
              <option value="">Barcha xonalar</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.capacity ? `(${r.capacity} kishi)` : ''}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="input-field text-xs py-1.5 px-2.5 w-auto"
            >
              <option value="">Barcha o'qituvchilar</option>
              {teachersList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}

          {/* View mode toggle */}
          <div className="flex rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-0.5 text-xs">
            <button
              onClick={() => {
                setViewMode('room');
                setFilterTeacher('');
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'room'
                  ? 'bg-[var(--card)] text-primary shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Xona bo'yicha
            </button>
            <button
              onClick={() => {
                setViewMode('teacher');
                setFilterRoom('');
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'teacher'
                  ? 'bg-[var(--card)] text-primary shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              O'qituvchi
            </button>
          </div>

          {showHeaderLink && (
            <Link
              to="/erp/timetable"
              className="btn-ghost text-xs flex items-center gap-1 py-1.5 px-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--text-primary)]"
              title="To'liq jadval sahifasiga o'tish"
            >
              <span>To'liq</span>
              <ArrowUpRight size={13} />
            </Link>
          )}
        </div>
      </div>

      {/* Conflict Alert if any */}
      {conflictIds.size > 0 && (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300 border border-red-200 dark:border-red-900/40 text-xs">
          <AlertTriangle size={14} className="flex-shrink-0" />
          <span>
            {Math.round(conflictIds.size / 2)} ta dars vaqtida to'qnashuv aniqlandi! Qizil rang bilan belgilangan.
          </span>
        </div>
      )}

      {/* Timetable Scrollable Grid */}
      {isLoading ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : schedule.length === 0 ? (
        <div className="text-center py-12 text-xs text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-2xl p-6">
          <Calendar size={32} className="mx-auto mb-2 opacity-30" />
          <div className="font-semibold text-sm text-[var(--text-primary)]">Jadvalda darslar yo'q</div>
          <p className="mt-0.5">Guruhlarga dars vaqtlari biriktirilgach bu yerda aks etadi</p>
        </div>
      ) : (
        <div
          className="rounded-2xl border border-[var(--border)] overflow-auto scrollbar-thin relative bg-[var(--card)]"
          style={{ maxHeight }}
        >
          <div style={{ minWidth: 720 }}>
            {/* Header row: Days of the week */}
            <div
              className="grid sticky top-0 z-20 bg-[var(--card)] border-b border-[var(--border)] shadow-xs"
              style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}
            >
              <div className="p-2 text-center text-[11px] font-semibold text-[var(--text-muted)] flex items-center justify-center">
                <Clock size={13} />
              </div>
              {DAYS.map((day, i) => {
                const isToday = i === currentDayIdx;
                return (
                  <div
                    key={i}
                    className={`py-2 px-1 text-center border-l border-[var(--border)] transition-colors ${
                      isToday ? 'bg-primary/5 font-bold' : ''
                    }`}
                  >
                    <div
                      className={`text-xs font-bold ${
                        isToday ? 'text-primary' : i >= 5 ? 'text-amber-500' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {DAY_SHORT[i]}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] leading-tight truncate">
                      {day}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="grid relative" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
              {/* Hour markers */}
              <div className="flex flex-col bg-[var(--card)] z-10 select-none">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    style={{ height: 60 }}
                    className="border-b border-[var(--border)]/60 flex items-start justify-end pr-2 pt-1"
                  >
                    <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                      {h}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* 7 Day Columns */}
              {Array.from({ length: 7 }, (_, dayIdx) => {
                const daySlots = schedule.filter((s) => s.dayOfWeek === dayIdx);
                const layouted = computeDayLayout(daySlots);
                const isToday = dayIdx === currentDayIdx;

                return (
                  <div
                    key={dayIdx}
                    className={`relative border-l border-[var(--border)] ${
                      isToday ? 'bg-primary/[0.02]' : dayIdx >= 5 ? 'bg-[var(--surface)]/30' : ''
                    }`}
                    style={{ height: HOURS.length * 60 }}
                  >
                    {/* Horizontal hour guide lines */}
                    {HOURS.map((h, i) => (
                      <div
                        key={h}
                        style={{
                          position: 'absolute',
                          top: i * 60,
                          left: 0,
                          right: 0,
                          height: 1,
                          backgroundColor: 'var(--border)',
                          opacity: 0.5,
                        }}
                      />
                    ))}

                    {/* Lesson Slots */}
                    {layouted.map((item) => (
                      <SlotBlock
                        key={item.slot.id}
                        item={item}
                        color={getGroupColor(item.slot.groupId || item.slot.id)}
                        isConflict={conflictIds.has(item.slot.id)}
                        onClick={setSelectedSlot}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Selected Slot Floating Detail Modal */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-3xl shadow-2xl max-w-xs w-full bg-[var(--card)] border border-[var(--border)] backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-2 mb-3 pb-2 border-b border-[var(--border)]">
              <div>
                <div className="font-bold text-sm text-[var(--text-primary)] leading-tight">
                  {selectedSlot.groupName || 'Dars'}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {DAYS[selectedSlot.dayOfWeek]}
                </div>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="btn-ghost p-1 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Clock size={13} className="text-primary flex-shrink-0" />
                <span className="font-semibold text-[var(--text-primary)]">
                  {selectedSlot.startTime} – {selectedSlot.endTime}
                </span>
              </div>

              {selectedSlot.teacherName && (
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <GraduationCap size={13} className="text-primary flex-shrink-0" />
                  <span>{selectedSlot.teacherName}</span>
                </div>
              )}

              {selectedSlot.roomName && (
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Building2 size={13} className="text-primary flex-shrink-0" />
                  <span>{selectedSlot.roomName}</span>
                </div>
              )}

              {conflictIds.has(selectedSlot.id) && (
                <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold pt-1 border-t border-[var(--border)]">
                  <AlertTriangle size={13} />
                  <span>Vaqt to'qnashuvi bor!</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
