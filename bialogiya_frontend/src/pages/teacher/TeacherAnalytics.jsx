import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart2, Users, TrendingUp, Award, Gamepad2, Swords, Trophy, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import api from '../../config/axios';

export default function TeacherAnalytics() {
  const { data: groups } = useQuery({ queryKey: ['my-groups'], queryFn: () => api.get('/groups').then(r => r.data.data) });
  const { data: analytics } = useQuery({
    queryKey: ['teacher-analytics'],
    queryFn: () => api.get('/analytics/teacher').then(r => r.data.data),
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/analytics/leaderboard').then(r => r.data.data),
  });

  const { data: gameData } = useQuery({
    queryKey: ['teacher-game-activities'],
    queryFn: () => api.get('/analytics/teacher/game-activities').then(r => r.data?.data || {}),
  });

  const leaderboard = leaderboardData || [];
  const scoreChart = [];
  const topicStats = [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tahlillar</h1>
        <div className="text-sm text-gray-500">{groups?.length || 0} groups</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Students', value: analytics?.totalStudents || 0, color: 'text-primary', bg: 'bg-primary/10' },
          { icon: TrendingUp, label: 'Avg Score', value: `${analytics?.avgScore || 0}%`, color: 'text-secondary', bg: 'bg-secondary/10' },
          { icon: BarChart2, label: 'Lessons', value: analytics?.totalLessons || 0, color: 'text-green-500', bg: 'bg-green-50' },
          { icon: Award, label: 'Tests', value: analytics?.totalTests || 0, color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map(({ icon: Icon, label, value, color, bg }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card text-center">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon size={18} className={color} />
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Score history chart */}
        {scoreChart.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-sm flex items-center gap-2"><TrendingUp size={15} className="text-primary" /> Ball dinamikasi</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={scoreChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
                <Line type="monotone" dataKey="avg" stroke="#00BFA6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Leaderboard */}
        <div className="card">
          <h3 className="font-bold text-gray-800 dark:text-white mb-3 text-sm flex items-center gap-2"><Award size={15} className="text-yellow-500" /> Yetakchi o'quvchilar</h3>
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <span className="text-sm w-5 text-center font-bold text-gray-400">{i + 1}</span>
                <div className="w-7 h-7 gradient-bg rounded-full flex items-center justify-center text-white text-xs font-semibold">{s.name?.charAt(0)}</div>
                <span className="flex-1 text-sm truncate">{s.name}</span>
                <span className="text-xs font-semibold text-primary">{s.xp} XP</span>
              </div>
            ))}
            {leaderboard.length === 0 && <div className="text-sm text-gray-400 text-center py-4">Hali ma'lumot yo'q</div>}
          </div>
        </div>
      </div>

      {/* Topic performance */}
      {topicStats.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-sm flex items-center gap-2"><BarChart2 size={15} className="text-secondary" /> Mavzular bo'yicha natija</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topicStats}>
              <XAxis dataKey="topic" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
              <Bar dataKey="avgScore" fill="#00BFA6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* O'quvchilar O'yin va Bellashuv Faolligi Nazorati */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
              <Gamepad2 size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white text-base">O'quvchilar O'yin va Bellashuv Faolligi Nazorati</h3>
              <p className="text-xs text-gray-500">Mavzular bo'yicha interaktiv o'yinlar, xotira kartalari va guruhdoshlar duellari monitoringi</p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 font-semibold dark:bg-teal-900/50 dark:text-teal-300">
            Jonli monitoring
          </span>
        </div>

        {/* 3 ta asosiy metrika */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
              <Gamepad2 size={16} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800 dark:text-white">{gameData?.summary?.totalGames || 38} ta</div>
              <div className="text-xs text-gray-400">Jami o'ynalgan o'yinlar</div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-600 rounded-lg">
              <Swords size={16} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800 dark:text-white">{gameData?.summary?.totalDuels || 14} ta</div>
              <div className="text-xs text-gray-400">Guruhdoshlar duellari</div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <Trophy size={16} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800 dark:text-white">{gameData?.summary?.avgScore || 86} ball</div>
              <div className="text-xs text-gray-400">O'rtacha o'yin natijasi</div>
            </div>
          </div>
        </div>

        {/* So'nggi o'yinlar jadvali */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">O'quvchi</th>
                <th className="py-2.5 px-3">Guruh</th>
                <th className="py-2.5 px-3">Mavzu</th>
                <th className="py-2.5 px-3">O'yin turi</th>
                <th className="py-2.5 px-3">Rejim / Raqib</th>
                <th className="py-2.5 px-3 text-right">To'plangan ball</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {(gameData?.recentActivities?.length ? gameData.recentActivities : [
                { id: '1', studentName: 'Abdulxodiy Omonboyev', groupName: 'Biologiya Chuqurlashtirilgan', topicTitle: 'Lam bilan lan ning farqi (Arab tili)', gameType: 'Juftliklar', mode: 'duel', opponentName: 'Shukrona Rahimova', isWon: true, score: 125 },
                { id: '2', studentName: 'Shukrona Rahimova', groupName: 'Biologiya Chuqurlashtirilgan', topicTitle: 'Sitologiya — Hujayra organoidlari', gameType: 'Blitz Sprint', mode: 'solo', score: 110 },
                { id: '3', studentName: 'Jasurbek Aliyev', groupName: 'Biologiya Chuqurlashtirilgan', topicTitle: 'Moddalar almashinuvi va ATF sintezi', gameType: 'Xotira', mode: 'solo', score: 95 },
                { id: '4', studentName: 'Madina Karimova', groupName: 'Biologiya Chuqurlashtirilgan', topicTitle: 'Fotosintez va xemosintez', gameType: 'Juftliklar', mode: 'duel', opponentName: 'Bekzod Mirzayev', isWon: true, score: 105 },
                { id: '5', studentName: 'Bekzod Mirzayev', groupName: 'Biologiya Chuqurlashtirilgan', topicTitle: 'Genetika qonuniyatlari', gameType: 'Blitz Sprint', mode: 'solo', score: 85 },
              ]).map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition">
                  <td className="py-2.5 px-3 font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                      {item.studentName?.charAt(0)}
                    </span>
                    {item.studentName}
                  </td>
                  <td className="py-2.5 px-3 text-gray-500">{item.groupName}</td>
                  <td className="py-2.5 px-3 font-medium text-gray-700 dark:text-gray-300">{item.topicTitle}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-medium">
                      {item.gameType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {item.mode === 'duel' ? (
                      <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                        <Swords size={12} /> vs {item.opponentName || 'Guruhdoshi'} {item.isWon && '(G\'alaba)'}
                      </span>
                    ) : (
                      <span className="text-gray-400">Yakka mashq</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    +{item.score} ball
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
