import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, ClipboardList, FileText, Trophy,
  Users, GraduationCap, Building2, UserPlus, Wallet, Inbox, Menu,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '../../config/axios';
import { cn } from '../../utils/cn';

// A curated 4-item subset per role for the mobile bottom bar — the full
// list (everything else) stays one tap away behind "Ko'proq", which opens
// the existing sidebar drawer. Keeping this to 4 items is deliberate:
// more than that and labels get too cramped to read on a phone.
const PRIMARY_LINKS = {
  student: [
    { to: '/student/dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { to: '/student/lessons', icon: BookOpen, key: 'lessons' },
    { to: '/student/homework', icon: ClipboardList, key: 'homework' },
    { to: '/student/achievements', icon: Trophy, key: 'achievements' },
  ],
  teacher: [
    { to: '/teacher/dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { to: '/teacher/groups', icon: Users, key: 'groups' },
    { to: '/teacher/lessons', icon: BookOpen, key: 'lessons' },
    { to: '/teacher/homework', icon: ClipboardList, key: 'homework' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { to: '/admin/centers', icon: Building2, key: 'centers', label: "O'quv Markazlar" },
    { to: '/admin/applications', icon: Inbox, key: 'applications', label: 'Arizalar' },
  ],
  manager: [
    { to: '/manager/dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { to: '/manager/groups', icon: Users, key: 'groups' },
    { to: '/manager/students', icon: GraduationCap, key: 'students' },
    { to: '/leads', icon: UserPlus, key: 'leads', label: 'Lidlar' },
  ],
  reception: [
    { to: '/reception/dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { to: '/reception/groups', icon: Users, key: 'groups' },
    { to: '/reception/students', icon: GraduationCap, key: 'students' },
    { to: '/reception/payments', icon: Wallet, key: 'payments' },
  ],
};

export default function MobileBottomNav({ onMoreClick }) {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const { data: serverSettings } = useQuery({
    queryKey: ['center-settings', user?.centerId || user?.id],
    queryFn: () => api.get('/admin/settings').then(r => r.data?.data || {}),
    enabled: !!user && user.role === 'reception',
    staleTime: 30 * 1000,
  });

  const perms = serverSettings?.receptionPermissions || {};

  const receptionPrimaryLinks = useMemo(() => [
    { to: '/reception/dashboard', icon: LayoutDashboard, key: 'dashboard' },
    ...(perms.canManageGroups !== false ? [{ to: '/reception/groups', icon: Users, key: 'groups' }] : []),
    ...(perms.canManageStudents !== false ? [{ to: '/reception/students', icon: GraduationCap, key: 'students' }] : []),
    ...(perms.canManagePayments !== false ? [{ to: '/reception/payments', icon: Wallet, key: 'payments' }] : []),
  ], [perms]);

  const links = user?.role === 'reception' ? receptionPrimaryLinks : (PRIMARY_LINKS[user?.role] || PRIMARY_LINKS.student);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch justify-around border-t"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {links.map(({ to, icon: Icon, key, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
            isActive ? 'text-primary' : ''
          )}
          style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-muted)' })}
        >
          <Icon size={20} />
          <span className="truncate max-w-[64px]">{label || t(key)}</span>
        </NavLink>
      ))}
      <button
        type="button"
        onClick={onMoreClick}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium"
        style={{ color: 'var(--text-muted)' }}
      >
        <Menu size={20} />
        <span>Ko'proq</span>
      </button>
    </nav>
  );
}
