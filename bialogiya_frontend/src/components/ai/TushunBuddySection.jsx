import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Compass, Smile, Award, CheckCircle2, MessageCircle, Shield, Volume2 } from 'lucide-react';

const MOODS = [
  {
    id: 'sher',
    label: 'Jasur Sher',
    emoji: '🦁',
    feeling: 'Kuchga to\'laman, bugun yangi mavzuni yorib tashlaymiz!',
    bgColor: 'from-amber-500/10 to-orange-500/10 border-orange-500/30',
    buddyReply: 'Sening shiddating menga ham katta quvvat berdi! Kel, bugun bu darsdagi eng qiziq sirlarni birgalikda zabt etamiz! 🚀',
  },
  {
    id: 'panda',
    label: 'Charchagan Panda',
    emoji: '🐼',
    feeling: 'Biroz charchaganman, sekin-asta o\'rganamiz',
    bgColor: 'from-blue-500/10 to-indigo-500/10 border-blue-500/30',
    buddyReply: 'Hechqisi yo\'q, aziz do\'stim! Bizga bugun shoshilish shart emas. Kichik-kichik qadamlar bilan, sekin va rohatlanib tushunib olamiz. Charchasang, bemalol dam ol! 🍵',
  },
  {
    id: 'robot',
    label: 'Qiziquvchan Robot',
    emoji: '🤖',
    feeling: 'Ko\'p yangi va ajoyib narsalarni bilishni xohlayman',
    bgColor: 'from-purple-500/10 to-pink-500/10 border-purple-500/30',
    buddyReply: 'Zo\'r qiziqish! Aynan senga o\'xshagan izlanuvchan do\'stlar yangi kashfiyotlar qilishadi. Qani, eng qiziq savollarga tayyormisan? 💡',
  },
  {
    id: 'quyon',
    label: 'Uyatchan Quyoncha',
    emoji: '🐰',
    feeling: 'Xato qilib qo\'yishdan biroz xavotirdaman',
    bgColor: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30',
    buddyReply: 'Kel, avval bir narsani kelishib olamiz: bu yerda "xato" degan narsa yo\'q! Har bir yanglishish — to\'g\'ri yo\'lni topishdagi eng muhim qadam. Men doim yoningdaman! 🤝',
  },
];

export default function TushunBuddySection({ lesson, ai, isTeacher }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});

  const tushun = ai?.tushunPedagogy || {};
  const currentMoodObj = MOODS.find(m => m.id === selectedMood);

  const toggleStep = (idx) => {
    setCompletedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const quest = tushun.interactiveQuest || {
    title: `Sehrli Orol Kvesti: ${lesson?.title || 'Mavzu bo\'yicha sarguzasht'}`,
    mission: 'Ushbu darsdagi asosiy g\'oyalarni amalda o\'yin orqali sinab ko\'rish',
    steps: [
      '1-qadam: Ko\'zgu yoki ovoz orqali yangi so\'zlarni talaffuz qilib ko\'ring',
      '2-qadam: Do\'stingiz yoki sherigingizga eng qiziq 1 ta faktni aytib bering',
      '3-qadam: O\'zingiz mustaqil ravishda mini-topshiriqni uddalang',
    ],
  };

  const stepsList = Array.isArray(quest.steps) ? quest.steps : [
    '1-qadam: Ko\'zguga qarab harakatlarni takrorlash',
    '2-qadam: Juftlikda kichik detektiv o\'yinini o\'ynash',
    '3-qadam: Uddalaydigan mini-vazifani tanlash',
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-orange-500/10 border border-primary/20 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
          <Heart size={20} className="fill-primary text-primary" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            TUSHUN Do'sti: Sening Xavfsiz Makoning <Sparkles size={16} className="text-primary" />
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
            Bu yerda sen qattiq nazorat ostida emassan. Biz har qanday hissiyotingni tushunamiz,
            xatolaring uchun koyimaymiz va har bir kichik harakatingni olqishlaymiz!
          </p>
        </div>
      </div>

      {/* 2. Mood Check-in Detektori */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smile size={16} className="text-primary" />
            <h3 className="font-bold text-sm text-gray-800 dark:text-white">
              {tushun.moodCheckQuestion || 'Bugun ushbu darsni qanday kayfiyatda boshlaymiz?'}
            </h3>
          </div>
          <span className="text-[11px] text-gray-400">Qahramoningizni tanlang:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {MOODS.map(m => {
            const isSelected = selectedMood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMood(m.id)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  isSelected
                    ? `border-primary bg-primary/15 shadow-sm scale-[1.02]`
                    : `border-[var(--border)] bg-[var(--secondary-background)] hover:border-primary/40`
                }`}
              >
                <div className="text-2xl">{m.emoji}</div>
                <div>
                  <div className="font-bold text-xs text-gray-800 dark:text-white">{m.label}</div>
                  <div className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{m.feeling}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Buddy Response */}
        <AnimatePresence mode="wait">
          {currentMoodObj && (
            <motion.div
              key={currentMoodObj.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`p-3.5 rounded-xl border bg-gradient-to-r ${currentMoodObj.bgColor} text-xs flex items-start gap-2.5`}
            >
              <div className="text-xl flex-shrink-0 mt-0.5">{currentMoodObj.emoji}</div>
              <div>
                <span className="font-bold text-gray-800 dark:text-white">Do'sting Abdora: </span>
                <span className="text-gray-700 dark:text-gray-200">{currentMoodObj.buddyReply}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Sehrli Ko'zgu va Recast (Yashirin to'g'rilash) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card space-y-3 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/20">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            <Shield size={16} />
            <span>Sehrli Ko'zgu & Recast Qoidasi</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Bizda xatoni yuzga solib, "Noto'g'ri, qaytar!" deb uyaltirish yo'q.
            To'g'ri shakli tabiiy ravishda jumlada takrorlanadi va ko'zgu orqali og'iz mimikasi o'rganiladi.
          </p>
          <div className="p-3 rounded-xl bg-white dark:bg-gray-800/80 border border-indigo-500/20 text-xs space-y-1.5">
            <div className="font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
              <Sparkles size={13} /> O'qituvchi va Ota-onalar uchun tavsiya:
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              {tushun.recastTips || 'Agar bola xato qilsa, uni to\'xtatmasdan, to\'g\'ri shaklini ohista va iliq jumlada aks ettiring.'}
            </p>
          </div>
        </div>

        {/* 4. Do'stona Ruhlantirish Maktubi */}
        <div className="card space-y-3 bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Award size={16} />
            <span>Harakatni Maqtash (Do'stingdan Maktub)</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Natija necha ball bo'lishi muhim emas. Muhimi — sen bugun yangi narsani o'rganishga jur'at qilding!
          </p>
          <div className="p-3 rounded-xl bg-white dark:bg-gray-800/80 border border-primary/20 text-xs">
            <p className="italic text-gray-700 dark:text-gray-200">
              "{tushun.friendPraise || 'Sen bu darsni ochib o\'rganayotganingning o\'zi katta jasorat! Har bir kichik qadaming bilan faxrlanaman!'}"
            </p>
          </div>
        </div>
      </div>

      {/* 5. 15 Daqiqalik Interaktiv Kvest Missiyasi */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass size={17} className="text-primary" />
            <div>
              <h3 className="font-bold text-sm text-gray-800 dark:text-white">
                {quest.title}
              </h3>
              <p className="text-xs text-gray-400">{quest.mission}</p>
            </div>
          </div>
          <span className="badge text-[11px] bg-primary/10 text-primary font-bold py-1 px-2.5">
            15 daqiqalik missiya
          </span>
        </div>

        <div className="space-y-2">
          {stepsList.map((step, idx) => {
            const isDone = !!completedSteps[idx];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleStep(idx)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                  isDone
                    ? 'bg-green-50/80 dark:bg-green-950/20 border-green-500/30 text-green-800 dark:text-green-300'
                    : 'bg-[var(--secondary-background)] border-[var(--border)] text-gray-700 dark:text-gray-200 hover:border-primary/40'
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                    isDone ? 'bg-green-500 text-white' : 'border border-gray-400 text-gray-400'
                  }`}>
                    {isDone ? <CheckCircle2 size={13} /> : idx + 1}
                  </div>
                  <span className={isDone ? 'line-through opacity-80' : ''}>{step}</span>
                </div>
                <span className="text-[11px] text-gray-400 flex-shrink-0">
                  {isDone ? 'Bajarildi! ⭐' : 'Belgilash'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
