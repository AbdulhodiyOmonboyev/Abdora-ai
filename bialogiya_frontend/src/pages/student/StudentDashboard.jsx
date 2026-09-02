import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import {
  BookOpen, ClipboardList, Trophy, Zap, Flame, Star,
  TrendingUp, Calendar, Bell, ChevronRight, Brain, Target,
  Sparkles, FileText
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../config/axios';
import { getLevelProgress, formatDate, getScoreBg } from '../../utils/format';
import StatCard from '../../components/ui/StatCard';

const MOTIVATIONS = [
  "Har bir dars — kelajagingizga bitta qadam! 🚀",
  "Bilim — eng kuchli qurol! Davom eting! 💪",
  "Bugungi harakatingiz ertangi muvaffaqiyatingiz! ⭐",
  "Hech qachon o'rganishni to'xtatmang! 🧠",
  "Siz bunga qodirсiz! Oldinga! 🎯",
];

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();

  const { data: analytics = {} } = useQuery({
    queryKey: ['student-analytics'],
    queryFn: () => api.get('/analytics/student').then(r => {
      const data = r.data?.data || r.data || {};
      return typeof data === 'object' ? data : {};
    }),
  });

  const { data: homeworkData = [] } = useQuery({
    queryKey: ['student-homework'],
    queryFn: () => api.get('/homework/student').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
  });

  const { data: testsData = [] } = useQuery({
    queryKey: ['student-tests'],
    queryFn: () => api.get('/tests').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }),
  });

  const { level, progress } = getLevelProgress(user?.xp || 0);
  const motivation = MOTIVATIONS[new Date().getDay() % MOTIVATIONS.length];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('good_morning');
    if (h < 17) return t('good_afternoon');
    return t('good_evening');
  };

  const pendingHW = Array.isArray(homeworkData) ? homeworkData.filter(h => !h.submissions?.[0]).slice(0, 3) : [];
  const upcomingTests = Array.isArray(testsData) ? testsData.slice(0, 3) : [];
  const scoreHistory = Array.isArray(analytics?.scoreHistory) ? analytics.scoreHistory : [];

  const chartData = scoreHistory.map(r => ({
    name: formatDate(r.date).split(' ').slice(0, 2).join(' '),
    score: r.score,
  })).slice(-7);

  return (
    <div className="dashboard-shell max-w-6xl mx-auto">
      <header className="dashboard-header">
        <div>
          <span className="dashboard-badge"><Sparkles size={12} /> Abdora AI</span>
          <h1>{getGreeting()}, {user?.name}</h1>
          <p>{motivation}</p>
        </div>
        <div className="dashboard-header-actions">
          <span className="header-status">Live</span>
          <Link to="/student/results" className="header-button">Natijalar</Link>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard icon={TrendingUp} label={t('avg_score')} value={`${analytics?.stats?.avgScore || 0}%`} color="text-primary" bg="bg-primary/10" delay={0.05} />
        <StatCard icon={ClipboardList} label={t('homework')} value={`${analytics?.stats?.homeworkCompleted || 0}/${analytics?.stats?.totalHomework || 0}`} color="text-secondary" bg="bg-secondary/10" delay={0.1} />
        <StatCard icon={Calendar} label={t('attendance')} value={`${analytics?.stats?.attendanceRate || 100}%`} color="text-green-500" bg="bg-green-50" delay={0.15} />
        <StatCard icon={Trophy} label={t('level')} value={`${level}`} color="text-yellow-500" bg="bg-yellow-50" delay={0.2} />
      </section>

      <section className="dashboard-grid">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="panel-card chart-card">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Progress</span>
              <h2>{t('weekly_stats')}</h2>
            </div>
            <span className="tag-pill">7 kun</span>
          </div>
          {chartData.length > 0 ? (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={{ borderRadius: '14px', background: '#0f172a', border: '1px solid rgba(148,163,184,0.24)', color: '#e2e8f0' }} />
                  <Line type="monotone" dataKey="score" stroke="#f97316" strokeWidth={2.5} dot={{ fill: '#f97316', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">Natija ma’lumotlari hali yo‘q.</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="panel-card side-card">
          <div className="panel-header compact">
            <div>
              <span className="panel-kicker">AI</span>
              <h2>{t('ai_recommendations')}</h2>
            </div>
          </div>
          {analytics?.weakTopics?.length > 0 ? (
            <div className="mini-metrics">
              {analytics.weakTopics.slice(0, 3).map((topic, i) => (
                <div key={i} className="mini-metric orange">
                  <span>Weak topic</span>
                  <strong>{topic}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">AI tavsiyalar uchun testlar yechilsin.</div>
          )}
        </motion.div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="panel-card">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Homework</span>
              <h2>Kelayotgan vazifalar</h2>
            </div>
            <Link to="/student/homework" className="panel-link">Barchasi</Link>
          </div>
          <div className="branch-list">
            {pendingHW.length > 0 ? pendingHW.map((item) => (
              <div key={item.id} className="branch-row">
                <div className="branch-main">
                  <div className="branch-dot"><ClipboardList size={14} /></div>
                  <div className="branch-copy">
                    <strong>{item.title}</strong>
                    <span>{item.subject || 'Fan'}</span>
                  </div>
                </div>
                <div className="branch-meta">
                  <span>{item.deadline ? new Date(item.deadline).toLocaleDateString('uz-UZ') : 'Today'}</span>
                </div>
              </div>
            )) : <div className="empty-state">Vazifa yo‘q.</div>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="panel-card">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Tests</span>
              <h2>Keyingi testlar</h2>
            </div>
            <Link to="/student/tests" className="panel-link">Barchasi</Link>
          </div>
          <div className="branch-list">
            {upcomingTests.length > 0 ? upcomingTests.map((test) => (
              <div key={test.id} className="branch-row">
                <div className="branch-main">
                  <div className="branch-dot"><FileText size={14} /></div>
                  <div className="branch-copy">
                    <strong>{test.title}</strong>
                    <span>{test.subject || 'Test'}</span>
                  </div>
                </div>
                <div className="branch-meta">
                  <span>{test.questions?.length || 0} savol</span>
                </div>
              </div>
            )) : <div className="empty-state">Testlar yo‘q.</div>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
