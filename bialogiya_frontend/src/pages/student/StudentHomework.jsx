import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ClipboardList, CheckCircle, AlertCircle, Clock, Sparkles, Heart } from 'lucide-react';
import api from '../../config/axios';
import { formatDate } from '../../utils/format';
import StudentAcademicTabs from '../../components/student/StudentAcademicTabs';

export default function StudentHomework() {
  const { data: homework = [], isLoading } = useQuery({
    queryKey: ['student-homework'],
    queryFn: () => api.get('/homework/student').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
  });

  const pending = Array.isArray(homework) ? homework.filter(h => !h.submissions?.[0]) : [];
  const submitted = Array.isArray(homework) ? homework.filter(h => h.submissions?.[0]) : [];

  const HWCard = ({ hw, i }) => {
    const sub = hw.submissions?.[0];
    const isLate = new Date() > new Date(hw.dueDate) && !sub;
    const isTushun = hw.description && (hw.description.includes('TUSHUN') || hw.description.includes('Missiya') || hw.description.includes('Teskari Dars'));

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
        className="card flex items-center gap-3 sm:gap-4 p-3.5 sm:p-5 hover:shadow-soft transition-all">
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
          sub ? 'bg-green-50 dark:bg-green-950/30' : isLate ? 'bg-red-50 dark:bg-red-950/30' : 'bg-primary/10'
        }`}>
          {sub ? <CheckCircle size={18} className="text-green-500" /> : isLate ? <AlertCircle size={18} className="text-red-500" /> : isTushun ? <Sparkles size={18} className="text-primary" /> : <ClipboardList size={18} className="text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm sm:text-base text-gray-800 dark:text-white truncate">{hw.title}</span>
            {isTushun && (
              <span className="badge text-[10px] bg-primary/15 text-primary font-bold py-0.5 px-1.5 hidden sm:inline-flex">
                Kreativ Missiya
              </span>
            )}
          </div>
          <div className="text-[11px] sm:text-xs text-gray-400 flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
            <span className="flex items-center gap-1 whitespace-nowrap"><Clock size={11} /> Muddat: {formatDate(hw.dueDate)}</span>
            {sub?.finalScore !== null && sub?.finalScore !== undefined ? (
              <span className="badge bg-primary/10 text-primary py-0.2 px-1.5 whitespace-nowrap font-bold">Baho: {sub.finalScore}/{hw.maxScore}</span>
            ) : (
              <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-500 py-0.2 px-1.5 whitespace-nowrap">{hw.maxScore} ball</span>
            )}
            {isLate && <span className="badge bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 py-0.2 px-1.5 whitespace-nowrap">Kechikkan</span>}
          </div>
        </div>
        {!sub ? (
          <Link to={`/student/homework/${hw.id}/submit`} className="btn-primary text-xs py-1.5 sm:py-2 px-3 sm:px-4 flex-shrink-0 whitespace-nowrap font-semibold">
            Bajarish
          </Link>
        ) : (
          <span className="badge bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 text-xs py-1.5 px-3 flex-shrink-0 whitespace-nowrap font-semibold">
            Topshirilgan
          </span>
        )}
      </motion.div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <StudentAcademicTabs active="homework" />
      {/* Encouraging Header */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-orange-500/10 border border-primary/20 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Uy vazifalari va Missiyalar <Sparkles size={20} className="text-primary" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Har bir topshiriq — bu o'z iqtidoringni erkin namoyon etish imkoniyati. Xatolardan qo'rqma!
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 shadow-sm hidden sm:flex">
          <Heart size={24} className="fill-primary" />
        </div>
      </div>

      {pending.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>Kutilmoqda ({pending.length})</span>
          </h2>
          <div className="space-y-3">{pending.map((hw, i) => <HWCard key={hw.id} hw={hw} i={i} />)}</div>
        </div>
      )}

      {submitted.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>Topshirilgan ({submitted.length})</span>
          </h2>
          <div className="space-y-3">{submitted.map((hw, i) => <HWCard key={hw.id} hw={hw} i={i} />)}</div>
        </div>
      )}

      {!isLoading && homework?.length === 0 && (
        <div className="text-center py-16 text-gray-400 card">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-30 text-primary" />
          <p className="font-medium text-sm">Hozircha yangi uy vazifasi yo'q. Darslarni takrorlab turishingiz mumkin!</p>
        </div>
      )}
    </div>
  );
}
