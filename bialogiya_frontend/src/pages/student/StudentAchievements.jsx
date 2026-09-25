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
  const { level, progress, xp } = getLevelProgress(user?.xp || 0);
  const currentStreak = user?.streakCurrent ?? user?.streak?.current ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Yutuqlar va Nishonlar</h1>

      {/* Level & XP card */}
      <div className="gradient-bg rounded-3xl p-6 text-white shadow-soft">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Trophy size={30} className="text-yellow-300" />
          </div>
          <div className="flex-1">
            <div className="text-white/80 text-sm">Sizning darajangiz</div>
            <div className="text-3xl font-black">{level}-daraja</div>
            <div className="flex items-center gap-4 mt-1 text-sm text-white/80">
              <span className="flex items-center gap-1"><Zap size={14} /> {xp} XP</span>
              <span className="flex items-center gap-1"><Flame size={14} /> {currentStreak} kunlik ketma-ketlik</span>
              <span className="flex items-center gap-1"><Star size={14} /> {user?.coins || 0} tanga</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/70 mb-1 font-medium">
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {SAMPLE_BADGES.map((badge, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className={`card text-center p-4 transition-all hover:shadow-soft ${!badge.earned ? 'opacity-40 grayscale' : ''}`}>
            <div className={`w-14 h-14 bg-gradient-to-br ${RARITY_COLORS[badge.rarity]} rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-soft`}>
              <badge.icon size={26} />
            </div>
            <div className="font-semibold text-sm text-gray-800 dark:text-white">{badge.name}</div>
            <div className="text-xs text-gray-400 mt-1 min-h-[32px]">{badge.desc}</div>
            <div className={`badge mt-2 mx-auto text-xs bg-gradient-to-r ${RARITY_COLORS[badge.rarity]} text-white capitalize`}>
              {badge.rarity}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
