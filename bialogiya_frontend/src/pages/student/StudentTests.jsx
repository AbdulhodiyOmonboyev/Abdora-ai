import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../config/axios';

const TYPE_LABELS = {
  topic: 'Mavzuli test',
  weekly: 'Haftalik test',
  monthly: 'Oylik nazorat',
  mock: 'Katta sinov (Mock)',
};

export default function StudentTests() {
  const { user } = useAuthStore();
  const { data: tests, isLoading } = useQuery({
    queryKey: ['tests', user?.groupId],
    queryFn: () => api.get('/tests').then(r => r.data.data),
  });

  const { data: results } = useQuery({
    queryKey: ['my-results'],
    queryFn: () => api.get('/tests/results').then(r => r.data.data),
  });

  const completedIds = new Set(results?.map(r => String(r.testId?.id || r.testId)));
  const typeColors = {
    topic: 'bg-primary/10 text-primary',
    weekly: 'bg-secondary/10 text-secondary',
    monthly: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    mock: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300',
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Testlar</h1>
      <div className="space-y-3">
        {tests?.map((test, i) => {
          const done = completedIds.has(String(test.id));
          const result = results?.find(r => String(r.testId?.id || r.testId) === String(test.id));
          return (
            <motion.div key={test.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card flex items-center gap-3 sm:gap-4 p-3.5 sm:p-5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm sm:text-base text-gray-800 dark:text-white truncate">{test.title}</div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                  <span className={`badge text-[11px] py-0.2 px-2 whitespace-nowrap ${typeColors[test.type] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                    {TYPE_LABELS[test.type] || test.type}
                  </span>
                  {done && result && (
                    <span className="badge bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-[11px] py-0.2 px-1.5 inline-flex items-center gap-1 whitespace-nowrap">
                      <Check size={11} /> {result.percentage}%
                    </span>
                  )}
                </div>
              </div>
              {!done ? (
                <Link to={`/student/tests/${test.id}/run`} className="btn-primary text-xs py-1.5 sm:py-2 px-2.5 sm:px-3 flex-shrink-0 whitespace-nowrap">Boshlash</Link>
              ) : (
                <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs py-1 px-2 flex-shrink-0 whitespace-nowrap">Yakunlangan</span>
              )}
            </motion.div>
          );
        })}
        {!isLoading && tests?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <FileText size={36} className="mx-auto mb-3 opacity-30" />
            <p>Hozircha testlar mavjud emas</p>
          </div>
        )}
      </div>
    </div>
  );
}
