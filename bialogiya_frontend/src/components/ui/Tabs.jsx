import { cn } from '../../utils/cn';

/**
 * Universal Tabs component
 * Props:
 *  tabs     - [{ key, label, icon?: LucideIcon, badge?: number }]
 *  active   - string (active key)
 *  onChange - fn(key)
 *  variant  - 'pill' | 'underline' | 'card'  (default 'pill')
 *  size     - 'sm' | 'md'  (default 'md')
 *  fullWidth - boolean
 */
export default function Tabs({ tabs = [], active, onChange, variant = 'pill', size = 'md', fullWidth = false }) {
  if (variant === 'underline') {
    return (
      <div className="flex gap-0 border-b" style={{ borderColor: 'var(--border)' }}>
        {tabs.map(({ key, label, icon: Icon, badge }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              onClick={() => onChange?.(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                size === 'sm' ? 'px-3 py-2 text-xs' : '',
                fullWidth ? 'flex-1 justify-center' : '',
                isActive
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              {Icon && <Icon size={size === 'sm' ? 13 : 15} />}
              {label}
              {badge != null && badge > 0 && (
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                  isActive ? 'bg-[var(--primary)] text-white' : 'bg-[var(--border)] text-[var(--text-secondary)]'
                )}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ backgroundColor: 'var(--secondary-background)' }}
      >
        {tabs.map(({ key, label, icon: Icon, badge }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              onClick={() => onChange?.(key)}
              className={cn(
                'flex items-center gap-2 rounded-lg transition-all font-medium',
                size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
                fullWidth ? 'flex-1 justify-center' : '',
                isActive
                  ? 'bg-[var(--card)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )}
            >
              {Icon && <Icon size={size === 'sm' ? 13 : 15} />}
              {label}
              {badge != null && badge > 0 && (
                <span className="rounded-full bg-[var(--primary)] text-white px-1.5 py-0.5 text-[10px] font-bold leading-none">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: pill
  return (
    <div className={cn('flex flex-wrap gap-1', fullWidth ? 'w-full' : '')}>
      {tabs.map(({ key, label, icon: Icon, badge }) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            onClick={() => onChange?.(key)}
            className={cn(
              'flex items-center gap-1.5 rounded-full font-medium transition-all',
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm',
              fullWidth ? 'flex-1 justify-center' : '',
              isActive
                ? 'text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
            )}
            style={isActive ? { backgroundColor: 'var(--primary)' } : {}}
          >
            {Icon && <Icon size={size === 'sm' ? 12 : 14} />}
            {label}
            {badge != null && badge > 0 && (
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                isActive ? 'bg-white/25 text-white' : 'bg-[var(--border)] text-[var(--text-secondary)]'
              )}>
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
