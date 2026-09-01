import { motion } from 'framer-motion';

/**
 * PageHeader — Standard top section for every page.
 * Props: title, subtitle, actions (ReactNode), breadcrumb (ReactNode)
 */
export default function PageHeader({ title, subtitle, actions, breadcrumb, className = '' }) {
  return (
    <div className={`page-header ${className}`}>
      <div className="min-w-0">
        {breadcrumb && (
          <div className="breadcrumb mb-2">{breadcrumb}</div>
        )}
        <motion.h1
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="page-header-title"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, delay: 0.05 }}
            className="page-header-subtitle"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      {actions && (
        <div className="page-header-actions">
          {actions}
        </div>
      )}
    </div>
  );
}
