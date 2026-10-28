import { Link, useLocation } from 'react-router-dom';
import { BookOpen, ClipboardList, GraduationCap } from 'lucide-react';

export default function StudentAcademicTabs({ active = 'lessons' }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const tabs = [
    {
      id: 'lessons',
      to: '/student/lessons',
      label: 'Darslar',
      icon: BookOpen,
      isActive: active === 'lessons' || currentPath.startsWith('/student/lessons'),
    },
    {
      id: 'homework',
      to: '/student/homework',
      label: 'Uyga vazifa',
      icon: ClipboardList,
      isActive: active === 'homework' || currentPath.startsWith('/student/homework'),
    },
    {
      id: 'tests',
      to: '/student/tests',
      label: 'Imtihonlar',
      icon: GraduationCap,
      isActive: active === 'tests' || currentPath.startsWith('/student/tests'),
    },
  ];

  return (
    <div
      className="p-1 rounded-2xl inline-flex max-w-full overflow-x-auto gap-1 mb-6"
      style={{
        background: 'var(--secondary-background)',
        border: '1px solid var(--border)',
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isCurrent = tab.isActive;

        return (
          <Link
            key={tab.id}
            to={tab.to}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              isCurrent
                ? 'bg-primary text-white shadow-sm font-bold'
                : 'text-secondary hover:text-primary hover:bg-card'
            }`}
            style={{
              color: isCurrent ? 'var(--button-text, #ffffff)' : 'var(--text-secondary)',
            }}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
