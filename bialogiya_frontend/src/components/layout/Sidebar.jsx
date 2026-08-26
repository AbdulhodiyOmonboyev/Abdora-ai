import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  X, LayoutDashboard, BookOpen, ClipboardList, FileText, BarChart2,
  Users, FolderOpen, Calendar, Trophy, Star, Settings,
  GraduationCap, BookMarked, UserCheck, Upload, Mic, Wallet, UserCog, Inbox, Building2,
  PieChart, Receipt, UserPlus, LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import { cn } from '../../utils/cn';
import { getLevelProgress } from '../../utils/format';

const studentLinks = [
  { to: '/student/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/student/lessons', icon: BookOpen, key: 'lessons' },
  { to: '/student/homework', icon: ClipboardList, key: 'homework' },
  { to: '/student/tests', icon: FileText, key: 'tests' },
  { to: '/student/results', icon: BarChart2, key: 'results' },
  { to: '/student/resources', icon: FolderOpen, key: 'resources' },
  { to: '/student/attendance', icon: UserCheck, key: 'attendance' },
  { to: '/student/achievements', icon: Trophy, key: 'achievements' },
  { to: '/student/leaderboard', icon: Star, key: 'leaderboard' },
  { to: '/student/analytics', icon: BarChart2, key: 'analytics' },
];

const teacherLinks = [
  { to: '/teacher/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/teacher/groups', icon: Users, key: 'groups' },
  { to: '/teacher/students', icon: GraduationCap, key: 'students' },
  { to: '/teacher/lessons', icon: BookOpen, key: 'lessons' },
  { to: '/teacher/homework', icon: ClipboardList, key: 'homework' },
  { to: '/teacher/tests', icon: FileText, key: 'tests' },
  { to: '/teacher/attendance', icon: Calendar, key: 'attendance' },
  { to: '/teacher/resources', icon: Upload, key: 'resources' },
  { to: '/teacher/voice', icon: Mic, key: 'voice' },
  { to: '/teacher/analytics', icon: BarChart2, key: 'analytics' },
];

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/admin/applications', icon: Inbox, key: 'applications' },
  { to: '/admin/branches', icon: Building2, key: 'branches' },
  { to: '/admin/managers', icon: UserCheck, key: 'managers' },
  { to: '/admin/settings', icon: Settings, key: 'settings' },
];

const managerLinks = [
  { to: '/manager/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/leads', icon: UserPlus, key: 'leads', label: 'Lidlar' },
  { to: '/manager/branches', icon: Building2, key: 'branches', label: 'Filiallar' },
  { to: '/manager/reception', icon: UserCog, key: 'reception' },
  { to: '/manager/teachers', icon: BookMarked, key: 'teachers' },
  { to: '/manager/groups', icon: Users, key: 'groups' },
  { to: '/manager/students', icon: GraduationCap, key: 'students' },
  { to: '/finance', icon: PieChart, key: 'finance', label: 'Moliya' },
  { to: '/finance/payroll', icon: Receipt, key: 'payroll', label: 'Ish haqi' },
  { to: '/manager/settings', icon: Settings, key: 'settings' },
];

const receptionLinks = [
  { to: '/reception/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/reception/teachers', icon: BookMarked, key: 'teachers' },
  { to: '/reception/groups', icon: Users, key: 'groups' },
  { to: '/reception/students', icon: GraduationCap, key: 'students' },
  { to: '/reception/payments', icon: Wallet, key: 'payments' },
  { to: '/finance', icon: PieChart, key: 'finance', label: 'Moliya' },
  { to: '/leads', icon: UserPlus, key: 'leads', label: 'Lidlar' },
  { to: '/reception/settings', icon: Settings, key: 'settings' },
];

const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  reception: 'Qabulxona',
  teacher: "O'qituvchi",
  student: "O'quvchi",
};

const ROLE_COLORS = {
  admin: 'badge-orange',
  manager: 'badge-info',
  reception: 'badge-success',
  teacher: 'badge-purple',
  student: 'badge-gray',
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, clearAuth } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const links = user?.role === 'student' ? studentLinks
    : user?.role === 'teacher' ? teacherLinks
    : user?.role === 'reception' ? receptionLinks
    : user?.role === 'manager' ? managerLinks
    : adminLinks;

  const { level, progress } = getLevelProgress(user?.xp || 0);

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => { clearAuth(); navigate('/login'); },
    onError: () => { clearAuth(); navigate('/login'); },
  });

  const initials = (user?.name || 'U').charAt(0).toUpperCase();

  return (
    <>
      {/* Sidebar panel */}
      <aside
        style={{ backgroundColor: 'var(--sidebar-background)', borderColor: 'var(--border)', width: 'var(--sidebar-width, 256px)' }}
        className={cn(
          'flex-shrink-0 border-r flex flex-col h-full overflow-hidden',
          'fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out',
          'md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* ── Logo ── */}
        <div style={{ borderColor: 'var(--border)' }} className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="w-8 h-8 gradient-bg rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white font-bold text-sm font-['Space_Grotesk']">A</span>
            </div>
            <div className="min-w-0">
              <div
                style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}
                className="font-bold text-sm leading-tight"
              >
                Abdora AI
              </div>
              <span
                className={cn('badge badge-dot text-[10px] mt-0.5', ROLE_COLORS[user?.role] || 'badge-gray')}
              >
                {ROLE_LABELS[user?.role] || user?.role}
              </span>
            </div>
          </div>
          {/* Mobile close */}
          <button
            onClick={onClose}
            className="btn-icon md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {/* Section label for admin */}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <p
              style={{ color: 'var(--text-muted)' }}
              className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 mb-1"
            >
              Asosiy
            </p>
          )}

          {links.map(({ to, icon: Icon, key, label }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            >
              <NavLink
                to={to}
                end={to === '/finance' || to === '/leads'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn('sidebar-link', isActive && 'active')
                }
              >
                <Icon size={17} className="link-icon flex-shrink-0" />
                <span className="truncate">
                  {label || (user?.role === 'manager' && key === 'branches' ? 'Filiallar' : t(key))}
                </span>
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* ── User / Bottom ── */}
        <div style={{ borderColor: 'var(--border)' }} className="p-3 border-t flex-shrink-0">
          {/* Student XP bar */}
          {user?.role === 'student' && (
            <div className="mb-3 px-2">
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: 'var(--text-secondary)' }}>Level {level}</span>
                <span className="font-semibold" style={{ color: 'var(--primary)' }}>{user?.xp || 0} XP</span>
              </div>
              <div style={{ backgroundColor: 'var(--border)' }} className="h-1.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full gradient-bg rounded-full"
                />
              </div>
            </div>
          )}

          {/* Student streak/coins */}
          {user?.role === 'student' && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div style={{ backgroundColor: 'var(--secondary-background)', borderColor: 'var(--border)' }} className="rounded-xl p-2 text-center border">
                <div className="font-bold text-sm" style={{ color: 'var(--primary)' }}>{user?.streak?.current || 0}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t('streak')}</div>
              </div>
              <div style={{ backgroundColor: 'var(--secondary-background)', borderColor: 'var(--border)' }} className="rounded-xl p-2 text-center border">
                <div className="font-bold text-sm" style={{ color: 'var(--secondary)' }}>{user?.coins || 0}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t('coins')}</div>
              </div>
            </div>
          )}

          {/* User info row */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl group">
            <div className="avatar avatar-sm flex-shrink-0" style={{ width: '2.1rem', height: '2.1rem', fontSize: '0.78rem' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-semibold truncate leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {user?.name}
              </div>
              <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                @{user?.username}
              </div>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              className="btn-icon flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Chiqish"
              disabled={logoutMutation.isPending}
            >
              <LogOut size={15} style={{ color: 'var(--error)' }} />
            </button>
          </div>

          <div className="text-center mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
            © 2026 Abdora AI
          </div>
        </div>
      </aside>
    </>
  );
}
