import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Trophy, Star, BookOpen, AlertTriangle } from 'lucide-react';
import api from '../../config/axios';
import PageHeader from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';

function ScoreBar({ label, score, max = 100, color = 'var(--primary)' }) {
  const pct = Math.min(100, Math.max(0, (score / max) * 100));
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1.5 font-medium">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color }}>{score} / {max}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

export default function StudentProgress() {
  const { data: progress, isLoading } = useQuery({
    queryKey: ['student-progress'],
    queryFn: () => api.get('/student/progress').then(r => r.data?.data).catch(() => null),
  });

  if (isLoading) {
    return (
      <div className="dashboard-shell max-w-4xl space-y-4">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="dashboard-shell max-w-4xl text-center py-10">
        <div className="text-4xl mb-3">📈</div>
        <div className="font-semibold text-lg mb-1">Progressingiz topilmadi</div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Hali o'quv guruhlarida faol bo'lmagansiz.</p>
      </div>
    );
  }

  const { overall, subjects = [], recentGrades = [], attendance = 0 } = progress;

  return (
    <div className="dashboard-shell max-w-4xl">
      <PageHeader
        title="O'quv Progressi"
        subtitle="Sizning o'zlashtirish va davomat ko'rsatkichlaringiz"
      />

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="panel-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--secondary)' }}>
            <Target size={18} />
          </div>
          <div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>O'rtacha baho</div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{overall}%</div>
          </div>
        </div>
        <div className="panel-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>
            <TrendingUp size={18} />
          </div>
          <div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Davomat</div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{attendance}%</div>
          </div>
        </div>
        <div className="panel-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
            <Trophy size={18} />
          </div>
          <div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Guruhda</div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Top 3</div>
          </div>
        </div>
        <div className="panel-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
            <Star size={18} />
          </div>
          <div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Sertifikatlar</div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>2 ta</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subjects Progress */}
        <div className="panel-card">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen size={16} style={{ color: 'var(--primary)' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Fanlar bo'yicha</h3>
          </div>
          
          {subjects.length === 0 ? (
            <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              Fanlar bo'yicha baholar yo'q
            </div>
          ) : (
            <div>
              {subjects.map(s => (
                <ScoreBar key={s.name} label={s.name} score={s.score} color={s.score > 85 ? '#10B981' : s.score > 60 ? '#F59E0B' : '#EF4444'} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Grades */}
        <div className="panel-card">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} style={{ color: 'var(--secondary)' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>So'nggi baholar</h3>
          </div>
          
          {recentGrades.length === 0 ? (
            <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              Baholar topilmadi
            </div>
          ) : (
            <div className="space-y-3">
              {recentGrades.map((g, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border text-sm"
                  style={{ background: 'var(--secondary-background)', borderColor: 'var(--border)' }}>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{g.topic || 'Dars'}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{g.subject} · {new Date(g.date).toLocaleDateString()}</div>
                  </div>
                  <div className="font-bold text-lg"
                    style={{ color: g.score >= 86 ? '#10B981' : g.score >= 70 ? '#F59E0B' : g.score >= 50 ? '#F97316' : '#EF4444' }}>
                    {g.score}
                  </div>
                </div>
              ))}
            </div>
          )}

          {attendance < 50 && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-xl text-xs font-medium"
              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
              <AlertTriangle size={14} />
              Davomatingiz past! Darslarga qoldirmasdan keling.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
