import { getSubjectBadgeClass } from '../../utils/subjects';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, BookOpen, ClipboardList, FileText } from 'lucide-react';
import api from '../../config/axios';

export default function TeacherDashboard() {

  const { data: groups = [] } = useQuery({ 
    queryKey: ['my-groups'], 
    queryFn: () => api.get('/groups').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }) 
  });
  const { data: lessons = [] } = useQuery({ 
    queryKey: ['my-lessons'], 
    queryFn: () => api.get('/lessons').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }) 
  });
  const { data: tests = [] } = useQuery({ 
    queryKey: ['my-tests'], 
    queryFn: () => api.get('/tests').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }) 
  });
  const { data: homework = [] } = useQuery({ 
    queryKey: ['my-homework'], 
    queryFn: () => api.get('/homework/my').then(r => {
      const data = r.data?.data || r.data || [];
      return Array.isArray(data) ? data : [];
    }) 
  });
  const { data: teacherAnalytics = {} } = useQuery({ 
    queryKey: ['teacher-analytics'], 
    queryFn: () => api.get('/analytics/teacher').then(r => {
      const data = r.data?.data || r.data || {};
      return typeof data === 'object' ? data : {};
    }) 
  });

  const month = new Date().toISOString().slice(0, 7);
  const groupIds = Array.isArray(groups) ? groups.map((g) => g.id).join(',') : '';
  const { data: earningsData } = useQuery({
    queryKey: ['teacher-earnings', month, groupIds],
    queryFn: async () => {
      if (!groups?.length) return { totalEarned: 0, totalPaidStudents: 0 };
      const summaries = await Promise.all(groups.map(async (g) => {
        const rawData = await api.get(`/payments/group/${g.id}?month=${month}`).then((r) => r.data?.data || r.data || {});
        const data = typeof rawData === 'object' ? rawData : {};
        const students = Array.isArray(data.students) ? data.students : [];
        const paidStudents = students.filter((s) => s.isPaid).length;
        return { paidStudents, monthlyFee: data.monthlyFee || 0 };
      }));
      return {
        totalEarned: summaries.reduce((sum, item) => sum + item.paidStudents * item.monthlyFee, 0),
        totalPaidStudents: summaries.reduce((sum, item) => sum + item.paidStudents, 0),
      };
    },
    enabled: !!groupIds,
  });

  const totalStudents = (teacherAnalytics?.totalStudents ?? groups?.reduce((sum, g) => sum + (g.students?.length || 0), 0)) || 0;
  const aiReadyLessons = Array.isArray(lessons) ? lessons.filter((l) => l.aiContent?.status === 'done').length : 0;
  const totalEarnings = earningsData?.totalEarned || 0;
  const avgScore = teacherAnalytics?.avgScore ?? 0;
  const totalTests = teacherAnalytics?.totalTests ?? 0;
  const totalLessons = (teacherAnalytics?.totalLessons ?? lessons?.length) || 0;

  const stats = [
    { icon: Users, label: 'Total Students', value: totalStudents, color: 'text-primary', bg: 'bg-primary/10', link: '/teacher/students' },
    { icon: BookOpen, label: 'Lessons', value: lessons?.length || 0, color: 'text-secondary', bg: 'bg-secondary/10', link: '/teacher/lessons' },
    { icon: ClipboardList, label: 'Homework', value: homework?.length || 0, color: 'text-green-500', bg: 'bg-green-50', link: '/teacher/homework' },
    { icon: FileText, label: 'Tests', value: tests?.length || 0, color: 'text-purple-500', bg: 'bg-purple-50', link: '/teacher/tests' },
  ];

  return (
    <div className="dashboard-shell max-w-6xl mx-auto">
      <header className="dashboard-header">
        <div>
          <span className="dashboard-badge"><Users size={12} /> Abdora AI</span>
          <h1>O'qituvchi dashboard</h1>
          <p>Mavjud o'quvchilar, bu oy yig'ilgan daromad va o'z natijalaringiz.</p>
        </div>
        <div className="dashboard-header-actions">
          <span className="header-status">Live</span>
          <Link to="/teacher/groups" className="header-button">Guruhlar</Link>
        </div>
      </header>

      <section className="stats-grid">
        {stats.map(({ icon: Icon, label, value, color, bg, link }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={link} className="dashboard-stat-card">
              <div className="stat-icon-wrap">
                <Icon size={18} className={color} />
              </div>
              <div className="stat-copy">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
              <div className="stat-trend"><BookOpen size={14} /></div>
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="panel-card chart-card">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Overview</span>
              <h2>Umumiy natijalar</h2>
            </div>
            <span className="tag-pill">Oy</span>
          </div>
          <div className="mini-metrics">
            <div className="mini-metric orange">
              <span>O‘rtacha</span>
              <strong>{avgScore}%</strong>
            </div>
            <div className="mini-metric blue">
              <span>Testlar</span>
              <strong>{totalTests}</strong>
            </div>
            <div className="mini-metric teal">
              <span>Darslar</span>
              <strong>{totalLessons}</strong>
            </div>
          </div>
        </div>

        <div className="panel-card side-card">
          <div className="panel-header compact">
            <div>
              <span className="panel-kicker">Daromad</span>
              <h2>Bu oy</h2>
            </div>
          </div>
          <div className="mini-metrics">
            <div className="mini-metric orange">
              <span>So‘m</span>
              <strong>{new Intl.NumberFormat('uz-UZ').format(totalEarnings)}</strong>
            </div>
            <div className="mini-metric blue">
              <span>O‘quvchi</span>
              <strong>{totalStudents}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Groups</span>
              <h2>Mening guruhlarim</h2>
            </div>
            <Link to="/teacher/groups" className="panel-link">Boshqarish</Link>
          </div>
          <div className="branch-list">
            {groups?.slice(0, 4).map(g => (
              <div key={g.id} className="branch-row">
                <div className="branch-main">
                  <div className="branch-dot">{g.icon || '📚'}</div>
                  <div className="branch-copy">
                    <strong>{g.name}</strong>
                    <span>{g.students?.length || 0} o'quvchi</span>
                  </div>
                </div>
                <div className="branch-meta">
                  <span>{g.subject}</span>
                </div>
              </div>
            ))}
            {groups?.length === 0 && <div className="empty-state">Hali guruh yo‘q.</div>}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">AI</span>
              <h2>Darslar holati</h2>
            </div>
            <Link to="/teacher/lessons" className="panel-link">Barchasi</Link>
          </div>
          <div className="branch-list">
            {lessons?.slice(0, 5).map(l => (
              <div key={l.id} className="branch-row">
                <div className="branch-main">
                  <div className="branch-dot"><BookOpen size={14} /></div>
                  <div className="branch-copy">
                    <strong>{l.title}</strong>
                    <span>{l.aiContent?.status || 'draft'}</span>
                  </div>
                </div>
                <div className="branch-meta">
                  <span>{l.aiContent?.status === 'done' ? 'Ready' : 'In progress'}</span>
                </div>
              </div>
            ))}
            {!lessons?.length && <div className="empty-state">Hali darslar yo‘q.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
