import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, Save, Snowflake, Star, Coins } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

const STATUS_INFO = {
  present: { label: 'Bor', color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', icon: Check },
  late: { label: 'Kechikdi', color: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800', icon: Clock },
  absent: { label: 'Yo\'q', color: 'bg-red-100 text-red-600 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', icon: X },
};

const DEFAULT_SETTINGS = {
  minGrade: 1,
  maxGrade: 10,
  coinDeductionEnabled: true,
  deductCoinsOnAbsent: 5,
  deductCoinsOnLowGrade: 3,
  lowGradeThreshold: 4,
  awardCoinsOnHighGrade: 5,
  highGradeThreshold: 8,
};

export default function AttendancePage() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [selectedGroup, setSelectedGroup] = useState('');
  const [date, setDate] = useState(today);
  const [attendance, setAttendance] = useState({});
  const [grades, setGrades] = useState({});

  // Guruhlarni yuklash
  const { data: groups = [] } = useQuery({ 
    queryKey: ['my-groups'], 
    queryFn: () => api.get('/groups').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }) 
  });
  const group = Array.isArray(groups) ? groups.find(g => g.id === selectedGroup) : null;
  const activeStudents = Array.isArray(group?.students) ? group.students.filter(s => !s.isFrozen) : [];

  // Baho va Coin sozlamalarini o'qish (faqat ma'lumot uchun)
  const { data: gradeSettings = DEFAULT_SETTINGS } = useQuery({
    queryKey: ['attendance-settings'],
    queryFn: () => api.get('/attendance/settings').then(r => r.data?.data || DEFAULT_SETTINGS).catch(() => DEFAULT_SETTINGS),
  });

  // Tanlangan sana va guruh bo'yicha davomat hamda baholarni yuklash
  useQuery({
    queryKey: ['attendance', selectedGroup, date],
    queryFn: () => api.get(`/attendance/group/${selectedGroup}?from=${date}&to=${date}`).then(r => {
      const records = r.data.data;
      const dayRecord = Array.isArray(records) ? records[0] : records;
      const map = {};
      const gradeMap = {};

      if (dayRecord?.records?.length) {
        dayRecord.records.forEach(rec => {
          map[rec.studentId] = rec.status;
          if (rec.grade !== undefined && rec.grade !== null && rec.grade !== '') {
            gradeMap[rec.studentId] = rec.grade;
          }
        });
      } else {
        activeStudents.forEach(s => { map[s.id] = 'present'; });
      }

      setAttendance(map);
      setGrades(gradeMap);
      return dayRecord;
    }),
    enabled: !!selectedGroup,
  });

  // Davomat va baholarni saqlash
  const saveMutation = useMutation({
    mutationFn: () => api.post('/attendance', {
      groupId: selectedGroup,
      date,
      records: activeStudents.map(student => ({
        studentId: student.id,
        status: attendance[student.id] || 'present',
        grade: grades[student.id] !== undefined && grades[student.id] !== null && grades[student.id] !== ''
          ? parseInt(grades[student.id], 10)
          : null,
      })),
    }),
    onSuccess: () => {
      qc.invalidateQueries(['attendance']);
      toast.success('Davomat va baholar muvaffaqiyatli saqlandi!');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xatolik yuz berdi'),
  });

  const setAll = (status) => {
    const map = {};
    group?.students?.forEach(s => { map[s.id] = status; });
    setAttendance(map);
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const gradedCount = Object.values(grades).filter(g => g !== undefined && g !== null && g !== '').length;

  const getGradeColor = (g) => {
    if (!g) return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    const num = parseInt(g, 10);
    if (num >= 8) return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
    if (num >= 5) return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
    return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Sarlavha va Sozlamalar tugmasi */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Davomat va Baholash</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            O'quvchilarning darsdagi ishtiroki (bor/yo'q) hamda 1 dan 10 gacha dars baholari
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--text-secondary)] shadow-xs">
          <Coins size={15} className="text-amber-500 flex-shrink-0" />
          <span>Baho: <strong>1–10</strong>. Coin qoidalari <strong>menejer</strong> tomonidan belgilanadi.</span>
        </div>
      </div>

      {/* Guruh va sana tanlash */}
      <div className="card mb-5 p-4 border rounded-xl bg-white dark:bg-gray-900 dark:border-gray-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Guruh</label>
            <select
              value={selectedGroup}
              onChange={e => { setSelectedGroup(e.target.value); setAttendance({}); setGrades({}); }}
              className="input-field w-full p-2.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-sm"
            >
              <option value="">Guruhni tanlang</option>
              {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Dars sanasi</label>
            <input
              type="date"
              value={date}
              max={today}
              onChange={e => setDate(e.target.value)}
              className="input-field w-full p-2.5 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-sm"
            />
          </div>
        </div>
      </div>

      {selectedGroup && group && (
        <>
          {/* Statistika va Tezkor amallar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-300">
              <div>
                Ishtirok: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{presentCount}</span> / {activeStudents.length || 0}
              </div>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
              <div>
                Baholangan: <span className="font-semibold text-primary">{gradedCount}</span> / {activeStudents.length || 0}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 mr-1">Barchasini belgilash:</span>
              {['present', 'late', 'absent'].map(s => (
                <button
                  key={s}
                  onClick={() => setAll(s)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${STATUS_INFO[s].color}`}
                >
                  {STATUS_INFO[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* O'quvchilar ro'yxati */}
          <div className="space-y-2 mb-6">
            {activeStudents.map((student, i) => {
              const currentStatus = attendance[student.id] || 'present';
              const currentGrade = grades[student.id] ?? '';

              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="card flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 border rounded-xl bg-white dark:bg-gray-900 dark:border-gray-800 shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                >
                  {/* Talaba info */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="w-9 h-9 gradient-bg rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {student.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{student.name}</div>
                      {student.isFrozen ? (
                        <div className="text-xs text-blue-600 dark:text-blue-300 flex items-center gap-1">
                          <Snowflake size={12} /> Muzlatilgan
                        </div>
                      ) : (
                        <div className="text-[11px] text-gray-400">
                          {currentStatus === 'absent' ? 'Darsga kelmagan' : currentGrade ? `Baho: ${currentGrade}/10` : 'Baholanmagan'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* O'ng tomon: Davomat (Bor/Yo'q) va Baholash (1-10) */}
                  <div className="flex items-center gap-4 flex-wrap justify-end">
                    {/* Davomat holati tugmalari */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                      {['present', 'late', 'absent'].map(s => {
                        const info = STATUS_INFO[s];
                        const Icon = info.icon;
                        const active = currentStatus === s;
                        return (
                          <button
                            key={s}
                            onClick={() => {
                              setAttendance(a => ({ ...a, [student.id]: s }));
                              // Agar darsga kelmagan deb belgilansa, baho tozalanishi mumkin
                              if (s === 'absent') {
                                setGrades(g => {
                                  const copy = { ...g };
                                  delete copy[student.id];
                                  return copy;
                                });
                              }
                            }}
                            disabled={student.isFrozen}
                            title={info.label}
                            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                              active
                                ? `${info.color} shadow-xs font-semibold`
                                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                            } ${student.isFrozen ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Icon size={13} />
                            <span>{info.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Baho qo'yish (1 dan 10 gacha) */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500 font-medium hidden sm:inline">Baho:</span>
                      <select
                        value={currentGrade}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGrades(g => ({ ...g, [student.id]: val ? parseInt(val, 10) : '' }));
                        }}
                        disabled={student.isFrozen || currentStatus === 'absent'}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-bold transition-all ${getGradeColor(currentGrade)} ${
                          student.isFrozen || currentStatus === 'absent' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <option value="">Baho yo'q</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>
                            {n} ball {n >= 8 ? '(A\'lo)' : n <= 4 ? '(Past)' : ''}
                          </option>
                        ))}
                      </select>

                      {currentGrade && (
                        <button
                          onClick={() => {
                            setGrades(g => {
                              const copy = { ...g };
                              delete copy[student.id];
                              return copy;
                            });
                          }}
                          title="Bahoni o'chirish"
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Saqlash tugmasi */}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <Save size={16} />
            <span>{saveMutation.isPending ? 'Saqlanmoqda...' : 'Davomat va Baholarni Saqlash'}</span>
          </button>
        </>
      )}
    </div>
  );
}
