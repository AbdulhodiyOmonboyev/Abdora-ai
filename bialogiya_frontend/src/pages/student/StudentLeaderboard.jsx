import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Medal, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../config/axios';
import { getLevelProgress } from '../../utils/format';

export default function StudentLeaderboard() {
  const { user } = useAuthStore();
  const { data } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/analytics/leaderboard').then(r => r.data.data),
  });

  const leaderboard = data || [];

  const renderRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
          <Trophy size={15} />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-sm">
          <Medal size={15} />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center shadow-sm">
          <Medal size={15} />
        </div>
      );
    }
    return <span className="text-gray-400 font-bold text-sm">#{rank}</span>;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
        <Trophy size={24} className="text-yellow-500" /> Yetakchilar reytingi (Leaderboard)
      </h1>

      {/* Top 3 podium */}
      {leaderboard.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((p, i) => {
            const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const heights = ['h-24', 'h-32', 'h-20'];
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`flex-1 flex flex-col items-center ${heights[i]}`}>
                <div className="mb-1">{renderRankBadge(rank)}</div>
                <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center text-white font-bold text-sm mb-1">
                  {p.name?.charAt(0)}
                </div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center truncate w-full px-1">{p.name}</div>
                <div className={`w-full gradient-bg rounded-t-xl mt-2 flex items-center justify-center ${heights[i]}`}>
                  <div className="text-white text-xs font-bold">{p.xp} XP</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="space-y-2">
        {leaderboard.map((player, i) => {
          const { level } = getLevelProgress(player.xp);
          const isMe = String(player.id) === String(user?.id);
          return (
            <motion.div key={player.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className={`card flex items-center gap-3 py-3 ${isMe ? 'border-primary/30 bg-primary/5' : ''}`}>
              <div className="w-8 flex items-center justify-center font-bold text-sm">
                {renderRankBadge(i + 1)}
              </div>
              <div className="w-9 h-9 gradient-bg rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                {player.name?.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-800 dark:text-white">
                  {player.name} {isMe && <span className="text-xs text-primary font-bold">(Siz)</span>}
                </div>
                <div className="text-xs text-gray-400">{level}-daraja</div>
              </div>
              <div className="flex items-center gap-1 font-bold text-primary text-sm">
                <Zap size={13} /> {player.xp} XP
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
