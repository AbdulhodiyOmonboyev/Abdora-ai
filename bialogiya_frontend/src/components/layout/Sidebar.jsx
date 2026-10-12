import { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  X, LayoutDashboard, BookOpen, ClipboardList, FileText, BarChart2,
  Users, FolderOpen, Calendar, Trophy, Star, Settings,
  GraduationCap, BookMarked, UserCheck, Upload, Mic, Wallet, UserCog, Inbox, Building2,
  PieChart, Receipt, UserPlus, LogOut, Bot, ChevronLeft, ShoppingBag,
  Flame, Coins, Award, Sparkles, TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../config/axios';
import { cn } from '../../utils/cn';
import { getLevelProgress } from '../../utils/format';

export const studentSections = [
  {
    title: "O'quv jarayoni",
    key: 'section_learning',
    items: [
      { to: '/student/dashboard', icon: LayoutDashboard, key: 'dashboard', label: 'Bosh sahifa' },
      { to: '/student/lessons', icon: BookOpen, key: 'lessons', label: 'Darslar' },
      { to: '/student/homework', icon: ClipboardList, key: 'homework', label: 'Uy vazifasi', badgeKey: 'homework' },
      { to: '/student/tests', icon: FileText, key: 'tests', label: 'Testlar', badgeKey: 'tests' },
      { to: '/student/resources', icon: FolderOpen, key: 'resources', label: 'Kutubxona' },
    ],
  },
  {
    title: 'Natijalar & Davomat',
    key: 'section_results',
    items: [
      { to: '/student/attendance', icon: UserCheck, key: 'attendance', label: 'Davomat' },
      { to: '/student/results', icon: BarChart2, key: 'results', label: 'Natijalar' },
      { to: '/student/progress', icon: TrendingUp, key: 'progress', label: 'Progress' },
      { to: '/student/certificates', icon: Award, key: 'certificates', label: 'Sertifikatlar' },
    ],
  },
  {
    title: 'Faollik & Mukofotlar',
    key: 'section_gamification',
    items: [
      { to: '/student/shop', icon: ShoppingBag, key: 'shop', label: "Sovg'alar do'koni", badgeKey: 'shop' },
      { to: '/student/leaderboard', icon: Trophy, key: 'leaderboard', label: 'Reyting' },
      { to: '/student/achievements', icon: Sparkles, key: 'achievements', label: 'Yutuqlar' },
    ],
  },
  {
    title: 'Tizim',
    key: 'section_system',
    items: [
      { to: '/student/settings', icon: Settings, key: 'settings', label: 'Sozlamalar' },
    ],
  },
];

const studentLinks = studentSections.flatMap(section => section.items);

const teacherLinks = [
  { to: '/teacher/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/teacher/groups', icon: Users, key: 'groups' },
  { to: '/teacher/students', icon: GraduationCap, key: 'students' },
  { to: '/teacher/lessons', icon: BookOpen, key: 'lessons' },
  { to: '/teacher/homework', icon: ClipboardList, key: 'homework' },
  { to: '/teacher/tests', icon: FileText, key: 'tests' },
  { to: '/teacher/attendance', icon: Calendar, key: 'attendance' },
  { to: '/teacher/gradebook', icon: FileText, key: 'gradebook' },
  { to: '/teacher/resources', icon: Upload, key: 'resources' },
  { to: '/teacher/voice', icon: Mic, key: 'voice' },
  { to: '/teacher/analytics', icon: BarChart2, key: 'analytics' },
];

const adminLinks = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, key: 'dashboard' },
  { to: '/admin/centers',      icon: Building2,       key: 'centers' },
  { to: '/admin/applications', icon: Inbox,           key: 'applications' },
  { to: '/admin/ai-agents',    icon: Bot,             key: 'aiAgents' },
  { to: '/admin/settings',     icon: Settings,        key: 'settings' },
];

const managerLinks = [
  { to: '/manager/dashboard',  icon: LayoutDashboard, key: 'dashboard' },
  { to: '/crm/dashboard',      icon: Bot,             key: 'crmDashboard' },
  { to: '/leads',              icon: UserPlus,        key: 'leads' },
  { to: '/manager/branches',   icon: Building2,       key: 'branches' },
  { to: '/erp/rooms',          icon: BookOpen,        key: 'rooms' },
  { to: '/erp/timetable',      icon: Calendar,        key: 'timetable' },
  { to: '/manager/reception',  icon: UserCog,         key: 'reception' },
  { to: '/manager/teachers',   icon: BookMarked,      key: 'teachers' },
  { to: '/manager/groups',     icon: Users,           key: 'groups' },
  { to: '/manager/students',   icon: GraduationCap,   key: 'students' },
  { to: '/manager/payments',   icon: Wallet,          key: 'payments' },
  { to: '/finance',            icon: PieChart,        key: 'finance' },
  { to: '/erp/cashbox',        icon: Wallet,          key: 'cashbox' },
  { to: '/finance/payroll',    icon: Receipt,         key: 'payroll' },
  { to: '/manager/settings',   icon: Settings,        key: 'settings' },
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
  const qc = useQueryClient();

  const { data: serverSettings } = useQuery({
    queryKey: ['center-settings', user?.centerId || user?.id],
    queryFn: () => api.get('/admin/settings').then(r => r.data?.data || {}),
    enabled: !!user && user.role === 'reception',
    staleTime: 30 * 1000,
  });

  const { data: homeworkData = [] } = useQuery({
    queryKey: ['student-homework'],
    queryFn: () => api.get('/homework/student').then(r => r.data?.data || r.data || []),
    enabled: !!user && user.role === 'student',
    staleTime: 60 * 1000,
  });

  const { data: testsData = [] } = useQuery({
    queryKey: ['student-tests'],
    queryFn: () => api.get('/tests').then(r => r.data?.data || []),
    enabled: !!user && user.role === 'student',
    staleTime: 60 * 1000,
  });

  const pendingHomeworkCount = useMemo(() => {
    if (!Array.isArray(homeworkData)) return 0;
    return homeworkData.filter(h => h && typeof h === 'object' && !h.submissions?.[0]).length;
  }, [homeworkData]);

  const activeTestsCount = useMemo(() => {
    if (!Array.isArray(testsData)) return 0;
    return testsData.length;
  }, [testsData]);

  const activeReceptionLinks = useMemo(() => {
    const perms = serverSettings?.receptionPermissions || {};
    return [
      { to: '/reception/dashboard', icon: LayoutDashboard, key: 'dashboard' },
      ...(perms.canManageLeads !== false ? [
        { to: '/crm/dashboard', icon: Bot, key: 'crmDashboard' },
        { to: '/leads', icon: UserPlus, key: 'leads' },
      ] : []),
      ...(perms.canManageTimetable !== false ? [
        { to: '/erp/rooms', icon: BookOpen, key: 'rooms' },
        { to: '/erp/timetable', icon: Calendar, key: 'timetable' },
      ] : []),
      ...(perms.canManageTeachers !== false ? [
        { to: '/reception/teachers', icon: BookMarked, key: 'teachers' },
      ] : []),
      ...(perms.canManageGroups !== false ? [
        { to: '/reception/groups', icon: Users, key: 'groups' },
      ] : []),
      ...(perms.canManageStudents !== false ? [
        { to: '/reception/students', icon: GraduationCap, key: 'students' },
      ] : []),
      ...(perms.canManagePayments !== false ? [
        { to: '/reception/payments', icon: Wallet, key: 'payments' },
      ] : []),
      ...(perms.canViewFinance === true ? [
        { to: '/finance', icon: PieChart, key: 'finance' },
      ] : []),
      ...(perms.canViewCashbox === true ? [
        { to: '/erp/cashbox', icon: Wallet, key: 'cashbox' },
      ] : []),
      { to: '/reception/settings', icon: Settings, key: 'settings' },
    ];
  }, [serverSettings?.receptionPermissions]);

  const links = user?.role === 'student' ? studentLinks
    : user?.role === 'teacher' ? teacherLinks
    : user?.role === 'reception' ? activeReceptionLinks
    : user?.role === 'manager' ? managerLinks
    : adminLinks;

  const safeCoins = Number(user?.coins) || 0;
  const safeXp = Number(user?.xp) || 0;
  const { level = 1, progress = 0 } = getLevelProgress(safeXp) || {};
  const streakCount = (typeof user?.streak === 'number' ? user.streak : user?.streakCurrent) || 0;
  const studentGroupName = user?.group?.name || (typeof user?.group === 'string' ? user.group : null);

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => { qc.clear(); clearAuth(); navigate('/login'); },
    onError: () => { qc.clear(); clearAuth(); navigate('/login'); },
  });

  const initials = (user?.name || 'U').charAt(0).toUpperCase();

  return (
    <>
      {/* Sidebar panel */}
      <aside
        style={{
          backgroundColor: 'var(--sidebar-background)',
          borderColor: 'var(--border)',
        }}
        className={cn(
          'flex-shrink-0 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out',
          'fixed inset-y-0 left-0 z-40',
          'md:relative',
          isOpen
            ? 'w-[280px] md:w-[var(--sidebar-width,256px)] translate-x-0 border-r opacity-100 shadow-2xl md:shadow-none'
            : 'w-0 -translate-x-full md:translate-x-0 border-r-0 opacity-0 md:w-0 pointer-events-none'
        )}
      >
        {/* ── Logo ── */}
        <div style={{ borderColor: 'var(--border)' }} className="px-4 py-3.5 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
            {/* Logo mark */}
            <div className="w-8 h-8 gradient-bg rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white font-bold text-sm font-['Space_Grotesk']">A</span>
            </div>
            <div className="min-w-0 flex-1">
              <div
                style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}
                className="font-bold text-sm leading-tight truncate"
              >
                Abdora AI
              </div>
              <span
                className={cn('badge badge-dot text-[10px] mt-0.5 whitespace-nowrap', ROLE_COLORS[user?.role] || 'badge-gray')}
              >
                {ROLE_LABELS[user?.role] || user?.role}
              </span>
            </div>
          </div>
          {/* Close / Collapse button */}
          <button
            onClick={onClose}
            className="btn-icon text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors flex-shrink-0 p-1"
            aria-label="Sidebarni yopish"
            title="Sidebarni yopish"
          >
            <X size={18} className="md:hidden" />
            <ChevronLeft size={18} className="hidden md:block" />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-thin">
          {user?.role === 'student' ? (
            <div className="space-y-4">
              {studentSections.map((section, sIdx) => (
                <div key={section.title || sIdx} className="space-y-1">
                  <div className="flex items-center justify-between px-3 py-1">
                    <span
                      style={{ color: 'var(--text-muted)' }}
                      className="text-[10px] font-bold uppercase tracking-wider font-mono"
                    >
                      {t(section.key) || section.title}
                    </span>
                    <span className="text-[10px] opacity-40 font-mono" style={{ color: 'var(--text-muted)' }}>
                      {section.items.length}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {section.items.map(({ to, icon: Icon, key, label, badgeKey }, i) => (
                      <motion.div
                        key={to}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (sIdx * 3 + i) * 0.02, duration: 0.18 }}
                      >
                        <NavLink
                          to={to}
                          end={to === '/student/dashboard'}
                          onClick={() => {
                            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                              onClose?.();
                            }
                          }}
                          className={({ isActive }) =>
                            cn(
                              'sidebar-link relative group flex items-center justify-between',
                              isActive && 'active shadow-xs font-semibold'
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Icon
                                  size={17}
                                  className={cn(
                                    'link-icon flex-shrink-0 transition-transform group-hover:scale-110',
                                    isActive && 'text-primary'
                                  )}
                                />
                                <span className="truncate">
                                  {t(key) || label || key}
                                </span>
                              </div>

                              {/* Badges */}
                              {badgeKey === 'homework' && pendingHomeworkCount > 0 && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs"
                                  title={`${pendingHomeworkCount} ta topshirilmagan vazifa`}
                                >
                                  {pendingHomeworkCount}
                                </span>
                              )}

                              {badgeKey === 'tests' && activeTestsCount > 0 && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 shadow-xs"
                                  title={`${activeTestsCount} ta test`}
                                >
                                  {activeTestsCount}
                                </span>
                              )}

                              {badgeKey === 'shop' && safeCoins > 0 && (
                                <span
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center gap-1 border border-yellow-500/20"
                                  title={`${safeCoins} ta tanga`}
                                >
                                  <Coins size={10} className="text-yellow-500 fill-yellow-500/30" />
                                  <span>{safeCoins}</span>
                                </span>
                              )}

                              {/* Active indicator bar */}
                              {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary" />
                              )}
                            </>
                          )}
                        </NavLink>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Section label for admin/manager */}
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <p
                  style={{ color: 'var(--text-muted)' }}
                  className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 mb-1"
                >
                  {t('main_menu') || 'Asosiy'}
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
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 768) {
                        onClose?.();
                      }
                    }}
                    className={({ isActive }) =>
                      cn('sidebar-link', isActive && 'active')
                    }
                  >
                    <Icon size={17} className="link-icon flex-shrink-0" />
                    <span className="truncate">
                      {t(key) || label || (user?.role === 'manager' && key === 'branches' ? (t('branches') || 'Filiallar') : key)}
                    </span>
                  </NavLink>
                </motion.div>
              ))}
            </>
          )}
        </nav>

        {/* ── User / Bottom ── */}
        <div style={{ borderColor: 'var(--border)' }} className="p-3 border-t flex-shrink-0">
          {/* Student Gamification Box */}
          {user?.role === 'student' && (
            <div
              className="mb-3 p-3 rounded-2xl border transition-all duration-200 relative overflow-hidden group/card shadow-xs"
              style={{
                background: 'linear-gradient(135deg, rgba(240, 100, 19, 0.05) 0%, rgba(245, 158, 11, 0.04) 100%)',
                borderColor: 'var(--border)',
              }}
            >
              {/* Level & XP row */}
              <div className="flex items-center justify-between text-xs mb-2">
                <NavLink
                  to="/student/leaderboard"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 768) onClose?.();
                  }}
                  className="flex items-center gap-1.5 font-bold hover:opacity-85 transition-opacity"
                  style={{ color: 'var(--text-primary)' }}
                  title="Reytingni ko'rish"
                >
                  <span className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-xs">
                    {level}
                  </span>
                  <span className="text-[11px] font-semibold">{level}-{t('level') || 'daraja'}</span>
                </NavLink>

                <span className="font-bold text-[11px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/15">
                  {safeXp} XP
                </span>
              </div>

              {/* XP Progress bar */}
              <div className="relative mb-2.5">
                <div style={{ backgroundColor: 'var(--border)' }} className="h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 rounded-full"
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] mt-1 text-gray-500 dark:text-gray-400 font-medium">
                  <span>{Math.round(progress)}% bajarildi</span>
                  <span>{user?.xp || 0} XP</span>
                </div>
              </div>

              {/* Interactive Quick Stats: Streak & Coins */}
              <div className="grid grid-cols-2 gap-2">
                <NavLink
                  to="/student/attendance"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 768) onClose?.();
                  }}
                  title="Davomat va kunlik streak"
                  className="flex items-center gap-2 p-2 rounded-xl border border-orange-500/15 bg-white/60 dark:bg-gray-800/60 hover:bg-orange-500/10 dark:hover:bg-orange-500/15 transition-all group/streak cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-orange-500/15 text-orange-500 flex items-center justify-center flex-shrink-0 group-hover/streak:scale-110 transition-transform">
                    <Flame size={15} className="fill-orange-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs leading-none" style={{ color: 'var(--text-primary)' }}>
                      {streakCount}
                    </div>
                    <div className="text-[9px] leading-tight mt-0.5 truncate font-medium" style={{ color: 'var(--text-muted)' }}>
                      {t('streak') || 'Ketma-ketlik'}
                    </div>
                  </div>
                </NavLink>

                <NavLink
                  to="/student/shop"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 768) onClose?.();
                  }}
                  title="Sovg'alar do'koni"
                  className="flex items-center gap-2 p-2 rounded-xl border border-amber-500/15 bg-white/60 dark:bg-gray-800/60 hover:bg-amber-500/10 dark:hover:bg-amber-500/15 transition-all group/coins cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center flex-shrink-0 group-hover/coins:scale-110 transition-transform">
                    <Coins size={15} className="fill-amber-500/30" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs leading-none" style={{ color: 'var(--text-primary)' }}>
                      {safeCoins}
                    </div>
                    <div className="text-[9px] leading-tight mt-0.5 truncate font-medium" style={{ color: 'var(--text-muted)' }}>
                      {t('coins') || 'Tangalar'}
                    </div>
                  </div>
                </NavLink>
              </div>
            </div>
          )}

          {/* User info row */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl group hover:bg-gray-500/5 transition-colors">
            <div className="relative flex-shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || ''}
                  className="w-8 h-8 rounded-full object-cover border border-primary/20"
                />
              ) : (
                <div
                  className="avatar avatar-sm font-bold flex items-center justify-center rounded-full gradient-bg text-white shadow-xs"
                  style={{ width: '2rem', height: '2rem', fontSize: '0.78rem' }}
                >
                  {initials}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
            </div>

            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-semibold truncate leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {user?.name}
              </div>
              <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {studentGroupName ? `Guruh: ${studentGroupName}` : `@${user?.username}`}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <NavLink
                to={user?.role === 'student' ? '/student/settings' : `/${user?.role || 'admin'}/settings`}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 768) onClose?.();
                }}
                className="btn-icon p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                title={t('settings') || 'Sozlamalar'}
              >
                <Settings size={15} />
              </NavLink>

              <button
                onClick={() => logoutMutation.mutate()}
                className="btn-icon p-1 text-red-500/70 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all"
                title={t('logout') || 'Chiqish'}
                disabled={logoutMutation.isPending}
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>

          <div className="text-center mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
            © 2026 Abdora AI
          </div>
        </div>
      </aside>
    </>
  );
}
