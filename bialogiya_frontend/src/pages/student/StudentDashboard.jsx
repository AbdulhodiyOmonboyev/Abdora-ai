import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy, Sparkles, TrendingUp, Calendar, ClipboardList, BookOpen,
  Library, FileCheck2, Brain, Flame, Coins, Zap, ChevronRight,
  ShoppingBag, ArrowRight, Bell, GraduationCap, CheckCircle2, FileText,
  Users, Award, Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../config/axios';
import { useAuthStore } from '../../store/authStore';
import { getLevelProgress, formatDate } from '../../utils/format';

const MOTIVATIONS = [
  "Har bir dars — kelajagingizga bitta qadam!",
  "Bilim — eng kuchli qurol! Davom eting!",
  "Bugungi harakatingiz ertangi muvaffaqiyatingiz!",
  "Hech qachon o'rganishni to'xtatmang!",
  "Siz bunga qodirsiz! Oldinga!",
];

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 1. Analytics & Score History
  const { data: analytics = {} } = useQuery({
    queryKey: ['student-analytics'],
    queryFn: () => api.get('/analytics/student').then(r => r.data?.data || r.data || {}),
  });

  // 2. Homework data
  const { data: homeworkData = [] } = useQuery({
    queryKey: ['student-homework'],
    queryFn: () => api.get('/homework/student').then(r => r.data?.data || []),
  });

  // 3. Tests data
  const { data: testsData = [] } = useQuery({
    queryKey: ['student-tests'],
    queryFn: () => api.get('/tests').then(r => r.data?.data || []),
  });

  // 4. Recent lessons
  const { data: lessonsData = [] } = useQuery({
    queryKey: ['student-lessons-recent'],
    queryFn: () => api.get('/lessons').then(r => r.data?.data || []),
  });

  // 5. Shop items
  const { data: shopItems = [] } = useQuery({
    queryKey: ['shop-items-student'],
    queryFn: () => api.get('/shop/items').then(r => r.data?.data || []),
  });

  // Gamification stats
  const safeCoins = user?.coins ?? 0;
  const safeXp = user?.xp ?? 0;
  const { level, progress, nextLevelXP } = getLevelProgress(safeXp);
  const streak = user?.streak || 1;
  const motivation = MOTIVATIONS[new Date().getDay() % MOTIVATIONS.length];

  const pendingHW = Array.isArray(homeworkData) ? homeworkData.filter(h => !h.submissions?.[0]).slice(0, 3) : [];
  const upcomingTests = Array.isArray(testsData) ? testsData.slice(0, 3) : [];
  const recentLessons = Array.isArray(lessonsData) ? lessonsData.slice(0, 4) : [];
  const scoreHistory = Array.isArray(analytics?.scoreHistory) ? analytics.scoreHistory : [];

  const chartData = scoreHistory.map(r => ({
    name: formatDate(r.date).split(' ').slice(0, 2).join(' '),
    score: r.score,
  })).slice(-7);

  const displayName = user?.name || "O'quvchi";
  const initial = displayName[0]?.toUpperCase() || 'A';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* ========================================================
          1. TOP PROFILE CARD — (Mobil ilovadagi yuqori profil paneli)
          ======================================================== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-[#101827] border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={displayName}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-primary/20 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-primary to-orange-400 text-white font-black text-xl flex items-center justify-center shadow-md shadow-primary/20">
                {initial}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#101827]" />
          </div>

          {/* User info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                {displayName}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wide">
                O'quvchi
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <span>@{user?.username || 'student'}</span>
              <span>•</span>
              <span className="truncate text-gray-600 dark:text-gray-300 font-medium">
                {user?.group?.name ? `Guruh: ${user.group.name}` : "Guruh biriktirilgan"}
              </span>
              {user?.center?.name && (
                <>
                  <span>•</span>
                  <span className="truncate">{user.center.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right action badges */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Daily streak (Olovcha) */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-orange-600 dark:text-orange-400 font-bold text-xs shadow-xs"
            title="Kunlik ketma-ketlik faolligi"
          >
            <Flame size={16} className="text-orange-500 fill-orange-500 animate-pulse" />
            <span>{streak} kun faol</span>
          </div>

          {/* Quick results link */}
          <Link
            to="/student/results"
            className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Trophy size={14} className="text-primary" />
            <span>Natijalar</span>
          </Link>
        </div>
      </motion.div>

      {/* ========================================================
          2. COIN & EXP CARDS — (Yonma-yon bosiluvchi kartalar)
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {/* Tangalar kartasi */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          onClick={() => navigate('/student/shop')}
          className="group cursor-pointer rounded-2xl p-4 sm:p-5 border border-amber-300/40 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 dark:to-transparent hover:shadow-lg hover:border-amber-400 transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500 shadow-inner">
              <Coins size={22} className="text-amber-500" />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold group-hover:bg-amber-500/20 transition-colors">
              <span>Do'kon</span>
              <ChevronRight size={13} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {safeCoins.toLocaleString()} <span className="text-sm font-bold text-amber-600 dark:text-amber-400">tanga</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
              Topshiriq va testlardan to'plangan mukofotlar
            </div>
          </div>
        </motion.div>

        {/* EXP va Daraja kartasi */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate('/student/leaderboard')}
          className="group cursor-pointer rounded-2xl p-4 sm:p-5 border border-indigo-300/40 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-500/15 dark:to-transparent hover:shadow-lg hover:border-indigo-400 transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-500 shadow-inner">
              <Zap size={22} className="text-indigo-500 fill-indigo-500" />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold group-hover:bg-indigo-500/20 transition-colors">
              <span>Reyting</span>
              <ChevronRight size={13} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Level {level}
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {safeXp.toLocaleString()} XP
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700/60 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 flex justify-between">
              <span>Keyingi darajagacha:</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {Math.max(0, nextLevelXP - safeXp)} XP
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ========================================================
          3. "FOYDALI" — (Mobil ilovadagi 6 ta interaktiv karta)
          ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            Foydali bo'limlar
          </h2>
          <span className="text-xs text-gray-400">Tezkor o'tish</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {/* 1. Mening guruhim */}
          <Link
            to="/student/attendance"
            className="group rounded-2xl p-4 bg-white dark:bg-[#101827] border border-emerald-200/60 dark:border-emerald-900/40 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users size={20} />
              </div>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Mening guruhim
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                Guruhdoshlar & davomat
              </div>
            </div>
          </Link>

          {/* 2. Imtihonlarim */}
          <Link
            to="/student/tests"
            className="group rounded-2xl p-4 bg-white dark:bg-[#101827] border border-blue-200/60 dark:border-blue-900/40 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileCheck2 size={20} />
              </div>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Imtihonlarim
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                Testlar va sinovlar
              </div>
            </div>
          </Link>

          {/* 3. Kutubxona */}
          <Link
            to="/student/resources"
            className="group rounded-2xl p-4 bg-white dark:bg-[#101827] border border-amber-200/60 dark:border-amber-900/40 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Library size={20} />
              </div>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-amber-500 transition-colors" />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Kutubxona
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                Darsliklar & PDF resurslar
              </div>
            </div>
          </Link>

          {/* 4. Lug'atlar & AI */}
          <Link
            to="/student/lessons"
            className="group rounded-2xl p-4 bg-white dark:bg-[#101827] border border-pink-200/60 dark:border-pink-900/40 hover:border-pink-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/15 text-pink-600 dark:text-pink-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Brain size={20} />
              </div>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-pink-500 transition-colors" />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                Lug'atlar & AI
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                Flashcardlar & mnemonika
              </div>
            </div>
          </Link>

          {/* 5. Uyga vazifa */}
          <Link
            to="/student/homework"
            className="group rounded-2xl p-4 bg-white dark:bg-[#101827] border border-purple-200/60 dark:border-purple-900/40 hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ClipboardList size={20} />
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pendingHW.length > 0 ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' : 'text-gray-400'}`}>
                {pendingHW.length > 0 ? `${pendingHW.length} ta kutilmoqda` : 'Faol'}
              </span>
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Uyga vazifa
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                Vazifalarni topshirish
              </div>
            </div>
          </Link>

          {/* 6. Reyting & Mukofotlar */}
          <Link
            to="/student/leaderboard"
            className="group rounded-2xl p-4 bg-white dark:bg-[#101827] border border-yellow-200/60 dark:border-yellow-900/40 hover:border-yellow-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Award size={20} />
              </div>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-yellow-500 transition-colors" />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                Reyting & Do'kon
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                Yetakchilar va sovrinlar
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ========================================================
          4. "DO'KON" — (Mobil ilovadagi kabi gorizontal mahsulotlar)
          ======================================================== */}
      {shopItems.length > 0 && (
        <div className="rounded-2xl p-5 bg-white dark:bg-[#101827] border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-amber-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sovg'alar do'koni</h2>
            </div>
            <Link to="/student/shop" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>Barchasi</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {shopItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                onClick={() => navigate('/student/shop')}
                className="group cursor-pointer rounded-xl p-3 border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:border-amber-300 dark:hover:border-amber-600/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-square rounded-lg bg-gray-200 dark:bg-gray-700/60 overflow-hidden mb-2.5 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <ShoppingBag size={28} className="text-gray-400" />
                    )}
                  </div>
                  <div className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                    {item.name}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Coins size={13} />
                    <span>{item.coinPrice || item.price || 0}</span>
                  </div>
                  <span className="text-[10px] text-primary font-semibold group-hover:underline">Olish</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          5. "SO'NGGI DARSLAR" — (Recent Lessons)
          ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">So'nggi darslar</h2>
          </div>
          <Link to="/student/lessons" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>Barchasi</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {recentLessons.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {recentLessons.map((lesson) => (
              <Link
                key={lesson.id}
                to={`/student/lessons/${lesson.id}`}
                className="group rounded-2xl p-4.5 bg-white dark:bg-[#101827] border border-gray-200 dark:border-gray-800 hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase">
                      {lesson.subject || 'Dars'}
                    </span>
                    {lesson.aiEnabled && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                        <Sparkles size={10} /> AI materiallar
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                    {lesson.title}
                  </h3>
                  {lesson.content && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {lesson.content.replace(/<[^>]*>/g, '')}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Eye size={13} />
                    <span>{lesson.views || 0} ko'rish</span>
                  </div>
                  <span className="text-primary font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Darsni ochish <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl p-8 text-center bg-white dark:bg-[#101827] border border-gray-200 dark:border-gray-800 text-gray-400 text-sm">
            <BookOpen size={28} className="mx-auto mb-2 opacity-40" />
            Hozircha darslar mavjud emas
          </div>
        )}
      </div>

      {/* ========================================================
          6. VAZIFALAR & TESTLAR (Pending tasks)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Uyga vazifalar */}
        <div className="rounded-2xl p-5 bg-white dark:bg-[#101827] border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-purple-500" />
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Topshiriladigan vazifalar</h3>
            </div>
            <Link to="/student/homework" className="text-xs font-semibold text-primary hover:underline">
              Barchasi
            </Link>
          </div>

          <div className="space-y-2.5">
            {pendingHW.length > 0 ? (
              pendingHW.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-xs text-gray-900 dark:text-white truncate">{item.title}</div>
                    <div className="text-[11px] text-gray-400">{item.subject || 'Fan'}</div>
                  </div>
                  <Link
                    to={`/student/homework/${item.id}/submit`}
                    className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-primary text-white text-[11px] font-semibold hover:bg-primary-dark transition-colors"
                  >
                    Topshirish
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>Barcha vazifalar topshirilgan! Yangi vazifa yo'q.</span>
              </div>
            )}
          </div>
        </div>

        {/* Yaqinlashayotgan testlar */}
        <div className="rounded-2xl p-5 bg-white dark:bg-[#101827] border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileCheck2 size={18} className="text-blue-500" />
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Bilimni sinash (Testlar)</h3>
            </div>
            <Link to="/student/tests" className="text-xs font-semibold text-primary hover:underline">
              Barchasi
            </Link>
          </div>

          <div className="space-y-2.5">
            {upcomingTests.length > 0 ? (
              upcomingTests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-xs text-gray-900 dark:text-white truncate">{test.title}</div>
                    <div className="text-[11px] text-gray-400">{test.questions?.length || 0} ta savol • {test.timeLimit || 20} daqiqa</div>
                  </div>
                  <Link
                    to={`/student/tests/${test.id}/run`}
                    className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Boshlash
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-gray-400">
                <span>Hozircha rejalashtirilgan testlar yo'q.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
