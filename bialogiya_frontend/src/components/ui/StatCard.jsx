import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * StatCard — KPI / metric card used on all dashboards
 * Props:
 *   icon       - Lucide icon component
 *   label      - string
 *   value      - number | string
 *   trend      - 'up' | 'down' | 'neutral' | null
 *   trendValue - string (e.g. '+12%')
 *   iconColor  - CSS color string
 *   iconBg     - CSS background string
 *   onClick    - function
 *   delay      - animation delay (default 0)
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  trend = null,
  trendValue,
  iconColor,
  iconBg,
  onClick,
  delay = 0,
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.22, ease: 'easeOut' }}
      className="stat-card w-full text-left"
    >
      <div className="stat-card-top">
        {/* Icon */}
        <div
          className="stat-card-icon"
          style={{ backgroundColor: iconBg || 'rgba(240, 100, 19, 0.10)', border: '1px solid rgba(240, 100, 19, 0.18)' }}
        >
          {Icon && <Icon size={18} style={{ color: iconColor || 'var(--primary)' }} />}
        </div>

        {/* Trend */}
        {trend && (
          <div className={`stat-card-trend ${trend}`}>
            <TrendIcon size={11} />
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}
        {!trend && (
          <div className="stat-card-trend neutral">
            <Minus size={11} />
          </div>
        )}
      </div>

      <div>
        <div className="stat-card-value">
          {value ?? '—'}
        </div>
        <div className="stat-card-label">{label}</div>
      </div>
    </motion.button>
  );
}
