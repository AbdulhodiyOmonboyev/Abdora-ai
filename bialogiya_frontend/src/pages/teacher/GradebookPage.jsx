import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, BookOpen, Check, X, Download, RefreshCw,
  ChevronLeft, ChevronRight, TrendingUp, Star,
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';

function ScoreCell({ score, attended }) {
  if (score === undefined || score === null) {
    if (attended === false) {
      return (
        <div className="flex items-center justify-center h-full">
          <span className="text-xs font-bold" style={{ color: '#EF4444' }}>G</span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
      </div>
    );
  }
  const bg = score >= 86 ? '#ECFDF5' : score >= 70 ? '#FFFBEB' : score >= 50 ? '#FFF7ED' : '#FEF2F2';
  const color = score >= 86 ? '#10B981' : score >= 70 ? '#F59E0B' : score >= 50 ? '#F97316' : '#EF4444';
  const grade = score >= 86 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D';
  return (
    <div className="flex flex-col items-center justify-center h-full gap-0.5" style={{ background: bg }}>
      <span className="text-xs font-bold" style={{ color }}>{score}</span>
      <span className="text-[8px] font-semibold" style={{ color }}>{grade}</span>
    </div>
  );
}

export default function GradebookPage() {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['teacher-groups'],
    queryFn: () => api.get('/groups').then(r => r.data?.data || []).catch(() => []),
  });

  const { data: gradebook, isLoading: gradeLoading } = useQuery({
    queryKey: ['gradebook', selectedGroup, month],
    queryFn: () => api.get(`/groups/${selectedGroup}/gradebook`, { params: { month } })
      .then(r => r.data?.data).catch(() => null),
    enabled: !!selectedGroup,
  });

  const students = gradebook?.students || [];
  const lessons  = gradebook?.lessons  || [];

  const getAvg = (studentId) => {
    const scores = lessons
      .map(l => {
        const entry = l.grades?.find(g => g.studentId === studentId);
        return entry?.score;
      })
      .filter(s => s !== undefined && s !== null);
    if (!scores.length) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const rows = students.map(st => {
        const row = { "Talaba": st.name };
        lessons.forEach(l => {
          const entry = l.grades?.find(g => g.studentId === st.id);
          row[l.title || l.topic || `Dars ${l.orderIndex}`] = entry?.score ?? '';
        });
        row['O\'rtacha'] = getAvg(st.id) ?? '';
        return row;
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Jurnal');
      XLSX.writeFile(wb, `jurnal-${selectedGroup}-${month}.xlsx`);
      toast.success('Excel fayl yuklab olindi');
    } catch {
      toast.error('Excel yuklab olinmadi');
    }
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });

  return (
    <div className="dashboard-shell max-w-full">
      <PageHeader
        title="Akademik Jurnal (Gradebook)"
        subtitle="Talabalar baholari va davomati matritsasi"
        actions={
          selectedGroup && (
            <button onClick={exportExcel} className="btn-outline">
              <Download size={15} /> Excel
            </button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 p-4 rounded-2xl"
        style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
        <div className="flex-1 min-w-48">
          <label className="form-label text-xs mb-1">Guruh *</label>
          {groupsLoading ? (
            <Skeleton className="h-10 rounded-xl" />
          ) : (
            <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="input-field">
              <option value="">— Guruh tanlang —</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} {g.subject ? `(${g.subject})` : ''} {g.level ? `· ${g.level}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="form-label text-xs mb-1">Oy</label>
          <select value={month} onChange={e => setMonth(e.target.value)} className="input-field">
            {monthOptions.map(m => (
              <option key={m} value={m}>
                {new Date(m + '-01').toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedGroup ? (
        <div className="panel-card text-center py-16">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Guruh tanlang</div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Baholash jurnalini ko'rish uchun guruhni tanlang
          </p>
        </div>
      ) : gradeLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : !gradebook || students.length === 0 ? (
        <div className="panel-card text-center py-10">
          <div className="text-3xl mb-2">📚</div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Bu oyda ma'lumot yo'q</div>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap gap-3 mb-3 text-xs">
            {[
              { label: "A'lo (86–100)", color: '#10B981', bg: '#ECFDF5' },
              { label: 'Yaxshi (70–85)', color: '#F59E0B', bg: '#FFFBEB' },
              { label: 'Qoniqarli (50–69)', color: '#F97316', bg: '#FFF7ED' },
              { label: 'Yomon (0–49)', color: '#EF4444', bg: '#FEF2F2' },
              { label: 'G — Kelmagan', color: '#EF4444', bg: 'transparent' },
              { label: '— — Kirilmagan', color: 'var(--text-muted)', bg: 'transparent' },
            ].map(({ label, color, bg }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
                  style={{ background: bg || 'var(--secondary-background)', color, border: '1px solid var(--border)' }}>
                  {label.charAt(0)}
                </div>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
            <table className="border-collapse" style={{ minWidth: '100%' }}>
              <thead>
                <tr style={{ background: 'var(--secondary-background)' }}>
                  {/* Student name column header */}
                  <th className="sticky left-0 z-10 text-left px-4 py-3 text-xs font-semibold w-48 min-w-48"
                    style={{ color: 'var(--text-secondary)', background: 'var(--secondary-background)', borderRight: '2px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <Users size={13} /> Talaba
                    </div>
                  </th>
                  {/* Lesson columns */}
                  {lessons.map((l, i) => (
                    <th key={l.id} className="text-center px-2 py-2 text-[10px] font-medium min-w-14 w-14"
                      style={{ color: 'var(--text-secondary)', borderLeft: '1px solid var(--border)' }}>
                      <div className="flex flex-col items-center gap-0.5">
                        <BookOpen size={11} style={{ color: 'var(--text-muted)' }} />
                        <span>{i + 1}</span>
                        <span className="font-normal text-[9px] max-w-12 truncate"
                          style={{ color: 'var(--text-muted)' }}>
                          {l.title || l.topic || `Dars ${i + 1}`}
                        </span>
                      </div>
                    </th>
                  ))}
                  {/* Average column */}
                  <th className="text-center px-3 py-3 text-xs font-semibold min-w-16"
                    style={{ color: 'var(--text-secondary)', borderLeft: '2px solid var(--border)', background: 'var(--secondary-background)' }}>
                    <div className="flex flex-col items-center gap-0.5">
                      <Star size={12} />O'rtacha
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, rowIdx) => {
                  const avg = getAvg(student.id);
                  return (
                    <tr
                      key={student.id}
                      style={{
                        background: rowIdx % 2 === 0 ? 'var(--card)' : 'var(--secondary-background)',
                      }}
                    >
                      {/* Student name */}
                      <td className="sticky left-0 z-10 px-4 py-2 text-sm font-medium"
                        style={{
                          color: 'var(--text-primary)',
                          background: rowIdx % 2 === 0 ? 'var(--card)' : 'var(--secondary-background)',
                          borderRight: '2px solid var(--border)',
                        }}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                            style={{ background: 'var(--primary)', color: 'white' }}>
                            {student.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="truncate max-w-28">{student.name}</span>
                        </div>
                      </td>
                      {/* Score cells */}
                      {lessons.map(l => {
                        const entry = l.grades?.find(g => g.studentId === student.id);
                        return (
                          <td key={l.id} className="p-0 text-center"
                            style={{ borderLeft: '1px solid var(--border)', height: 44, padding: 0 }}>
                            <ScoreCell
                              score={entry?.score}
                              attended={entry?.attended}
                            />
                          </td>
                        );
                      })}
                      {/* Average */}
                      <td className="text-center p-2" style={{ borderLeft: '2px solid var(--border)' }}>
                        {avg !== null ? (
                          <span className="text-sm font-bold"
                            style={{ color: avg >= 86 ? '#10B981' : avg >= 70 ? '#F59E0B' : avg >= 50 ? '#F97316' : '#EF4444' }}>
                            {avg}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary row */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <div className="panel-card flex-1 min-w-32">
              <div style={{ color: 'var(--text-muted)' }}>Jami talabalar</div>
              <div className="text-lg font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{students.length}</div>
            </div>
            <div className="panel-card flex-1 min-w-32">
              <div style={{ color: 'var(--text-muted)' }}>Jami darslar</div>
              <div className="text-lg font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{lessons.length}</div>
            </div>
            <div className="panel-card flex-1 min-w-32">
              <div style={{ color: 'var(--text-muted)' }}>O'rtacha baho</div>
              <div className="text-lg font-bold mt-1" style={{ color: '#10B981' }}>
                {students.length > 0
                  ? Math.round(students.reduce((s, st) => s + (getAvg(st.id) || 0), 0) / students.filter(st => getAvg(st.id) !== null).length || 0)
                  : 0}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
