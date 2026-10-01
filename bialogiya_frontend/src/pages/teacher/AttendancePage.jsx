import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, Save, Snowflake, Settings, Star, Coins, AlertCircle } from 'lucide-react';
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
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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

  // Baho va Coin sozlamalarini yuklash
  const { data: gradeSettings = DEFAULT_SETTINGS } = useQuery({
    queryKey: ['attendance-settings'],
    queryFn: () => api.get('/attendance/settings').then(r => r.data?.data || DEFAULT_SETTINGS).catch(() => DEFAULT_SETTINGS),
  });

  // Sozlamalarni saqlash
  const [localSettings, setLocalSettings] = useState(null);
  const settingsToUse = localSettings || gradeSettings;

  const saveSettingsMutation = useMutation({
    mutationFn: (newSettings) => api.put('/attendance/settings', newSettings),
    onSuccess: (res) => {
      qc.invalidateQueries(['attendance-settings']);
      setLocalSettings(res.data?.data || null);
      toast.success('Baho va coin sozlamalari saqlandi!');
      setShowSettingsModal(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Sozlamalarni saqlashda xatolik'),
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
        <button
          onClick={() => {
            setLocalSettings({ ...gradeSettings });
            setShowSettingsModal(true);
          }}
          className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Settings size={15} />
          <span>Baho & Coin sozlamalari</span>
        </button>
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

      {/* Baho va Coin Sozlamalari Modali */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Coins size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Baho va Coin Sozlamalari</h2>
                    <p className="text-xs text-gray-500">1 dan 10 gacha baholash va tangalarni taqsimlash qoidalari</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 py-4 text-sm">
                {/* Coin ayirish funksiyasi kaliti (Switch) */}
                <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Coins size={16} className="text-amber-500" />
                      <span>Tangalarni ayirish tizimi</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      O'quvchi darsga kelmaganda yoki past baho olganda hisobidan tanga ayirish
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsToUse.coinDeductionEnabled}
                      onChange={(e) => setLocalSettings({ ...settingsToUse, coinDeductionEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Darsga kelmaganda ayiriladigan tangalar */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Darsga kelmaganda (Yo'q) ayiriladigan tanga:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={settingsToUse.deductCoinsOnAbsent}
                    onChange={(e) => setLocalSettings({ ...settingsToUse, deductCoinsOnAbsent: parseInt(e.target.value, 10) || 0 })}
                    className="input-field w-full p-2.5 rounded-lg border text-sm"
                    disabled={!settingsToUse.coinDeductionEnabled}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Masalan: 5 tanga ayirilsin</p>
                </div>

                {/* Past baho chegarasi va ayiriladigan tangalar */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Past bahoda ayirish (-):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={settingsToUse.deductCoinsOnLowGrade}
                      onChange={(e) => setLocalSettings({ ...settingsToUse, deductCoinsOnLowGrade: parseInt(e.target.value, 10) || 0 })}
                      className="input-field w-full p-2.5 rounded-lg border text-sm"
                      disabled={!settingsToUse.coinDeductionEnabled}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Past baho chegarasi (≤):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={settingsToUse.lowGradeThreshold}
                      onChange={(e) => setLocalSettings({ ...settingsToUse, lowGradeThreshold: parseInt(e.target.value, 10) || 4 })}
                      className="input-field w-full p-2.5 rounded-lg border text-sm"
                      disabled={!settingsToUse.coinDeductionEnabled}
                    />
                  </div>
                </div>

                {/* Yuqori a'lo baho uchun mukofot tangalar */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      A'lo bahoda berish (+):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={settingsToUse.awardCoinsOnHighGrade}
                      onChange={(e) => setLocalSettings({ ...settingsToUse, awardCoinsOnHighGrade: parseInt(e.target.value, 10) || 0 })}
                      className="input-field w-full p-2.5 rounded-lg border text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Yuqori baho chegarasi (≥):
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="10"
                      value={settingsToUse.highGradeThreshold}
                      onChange={(e) => setLocalSettings({ ...settingsToUse, highGradeThreshold: parseInt(e.target.value, 10) || 8 })}
                      className="input-field w-full p-2.5 rounded-lg border text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-xl text-xs">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    Baholash shkalasi <strong>1 dan 10 gacha</strong> qat'iy standartda ishlaydi. Tangalar faqat davomat saqlanganda avtomatik hisoblanadi va o'quvchi profilida aks etadi.
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="btn-secondary flex-1 py-2.5 rounded-xl border text-sm"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={() => saveSettingsMutation.mutate(settingsToUse)}
                  disabled={saveSettingsMutation.isPending}
                  className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
                >
                  <Save size={15} />
                  <span>{saveSettingsMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
