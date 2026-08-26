import { motion } from 'framer-motion';
import { InboxIcon } from 'lucide-react';

/**
 * EmptyState — Reusable empty / no-data state
 * Props: icon, title, description, action (ReactNode)
 */
export default function EmptyState({
  icon: Icon = InboxIcon,
  title = "Ma'lumot yo'q",
  description,
  action,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="empty-state"
    >
      <div className="empty-state-icon">
        <Icon size={22} />
      </div>
      <div>
        <p className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>{title}</p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </motion.div>
  );
}
