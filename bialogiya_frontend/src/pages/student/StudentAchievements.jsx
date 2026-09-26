import { motion } from 'framer-motion';
import { Trophy, Zap, Flame, Star, Target, GraduationCap, BookOpen, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getLevelProgress } from '../../utils/format';

const SAMPLE_BADGES = [
  { icon: Target, name: 'Birinchi dars', desc: 'Birinchi darsni muvaffaqiyatli yakunladingiz', earned: true, rarity: 'oddiy' },
  { icon: Trophy, name: 'Test ustasi', desc: 'Testdan 100% natija qayd etdingiz', earned: false, rarity: 'noyob' },
  { icon: Flame, name: 'Haftalik seriya', desc: '7 kunlik to\'xtovsiz ta\'lim seriyasi', earned: false, rarity: 'epif' },
  { icon: Zap, name: 'Tezkor o\'quvchi', desc: 'Bir kunda 5 ta darsni o\'zlashtirdingiz', earned: false, rarity: 'noyob' },
  { icon: GraduationCap, name: 'Fan mutaxassisi', desc: 'Fandagi barcha mavzularni tugatdingiz', earned: false, rarity: 'afsonaviy' },
  { icon: BookOpen, name: 'Kitobsevar', desc: '20 xil dars materialini o\'rgandingiz', earned: false, rarity: 'afsonaviy' },
  { icon: ShieldCheck, name: 'Vazifa qahramoni', desc: '10 ta vazifani o\'z vaqtida topshirdingiz', earned: true, rarity: 'oddiy' },
  { icon: Star, name: 'Mukammal natija', desc: 'Imtihondan maksimal ball to\'pladingiz', earned: false, rarity: 'epif' },
];

const RARITY_COLORS = {
  oddiy: 'from-gray-400 to-gray-500',
  noyob: 'from-blue-400 to-blue-600',
  epif: 'from-purple-400 to-purple-600',
  afsonaviy: 'from-yellow-400 to-orange-500',
};

export default function StudentAchievements() {
  const { user } = useAuthStore();
  const xp = user?.xp || 0;
  const { level, progress } = getLevelProgress(xp);
  const currentStreak = user?.streakCurrent ?? user?.streak?.current ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Yutuqlar va Nishonlar</h1>

      {/* Level & XP card */}
      <div className="gradient-bg rounded-3xl p-4 sm:p-6 text-white shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <Trophy size={28} className="text-yellow-300" />
            </div>
            <div>
              <div className="text-white/80 text-xs sm:text-sm">Sizning darajangiz</div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight">{level}-daraja</div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 sm:gap-3 sm:ml-auto text-xs sm:text-sm text-white/95">
            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl backdrop-blur-sm whitespace-nowrap font-medium">
              <Zap size={14} className="shrink-0 text-yellow-300" /> {xp} XP
            </span>
            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl backdrop-blur-sm whitespace-nowrap font-medium">
              <Flame size={14} className="shrink-0 text-orange-300" /> {currentStreak} kun ketma-ketlik
            </span>
            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl backdrop-blur-sm whitespace-nowrap font-medium">
              <Star size={14} className="shrink-0 text-yellow-300" /> {user?.coins || 0} tanga
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/15">
          <div className="flex justify-between text-xs text-white/80 mb-1.5 font-medium">
            <span>{level}-daraja</span>
            <span>{level + 1}-daraja</span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.5 }}
              className="h-full bg-white rounded-full" />
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {SAMPLE_BADGES.map((badge, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className={`card text-center p-3.5 sm:p-4 transition-all hover:shadow-soft flex flex-col justify-between ${!badge.earned ? 'opacity-40 grayscale' : ''}`}>
            <div>
              <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${RARITY_COLORS[badge.rarity]} rounded-2xl flex items-center justify-center mx-auto mb-2.5 text-white shadow-soft`}>
                <badge.icon size={24} />
              </div>
              <div className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-white leading-snug">{badge.name}</div>
              <div className="text-[11px] sm:text-xs text-gray-400 mt-1 line-clamp-2 min-h-[30px]">{badge.desc}</div>
            </div>
            <div className={`badge mt-2.5 mx-auto text-[10px] sm:text-xs px-2.5 py-0.5 bg-gradient-to-r ${RARITY_COLORS[badge.rarity]} text-white capitalize`}>
              {badge.rarity}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
