import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart2, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../config/axios';
import { formatDate, getScoreBg } from '../../utils/format';
import TestAnalysis from '../../components/ui/TestAnalysis';

export default function StudentResults() {
  const { data: results, isLoading } = useQuery({
    queryKey: ['my-results'],
    queryFn: () => api.get('/tests/results').then(r => r.data.data),
  });

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Mening natijalarim</h1>
      <div className="space-y-4">
        {results?.map((result, i) => (
          <motion.div key={result.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white">{result.test?.title || 'Test'}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(result.completedAt)} • {Math.round((result.timeTaken || 0) / 60)} daqiqa</p>
              </div>
              <div className={`text-2xl font-black px-3 py-1 rounded-xl ${getScoreBg(result.percentage)}`}>
                {result.percentage}%
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              {result.passed ? (
                <span className="badge bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300"><CheckCircle size={12} /> O'tdi</span>
              ) : (
                <span className="badge bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">Muvaffaqiyatsiz</span>
              )}
              <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{result.score} ball</span>
            </div>
            {result.aiAnalysis?.weakTopics?.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mt-2">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-semibold mb-1.5">
                  <AlertTriangle size={12} /> AI Tavsiyalari
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.aiAnalysis.weakTopics.map((t, idx) => (
                    <span key={idx} className="badge bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs">Qayta takrorlash: {t}</span>
                  ))}
                </div>
              </div>
            )}
            <TestAnalysis answers={result.answers} />
          </motion.div>
        ))}
        {!isLoading && results?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <BarChart2 size={36} className="mx-auto mb-3 opacity-30" />
            <p>Hali test natijalari mavjud emas. Birinchi testingizni topshiring!</p>
          </div>
        )}
      </div>
    </div>
  );
}
