/**
 * ChartCard — Wrapper for Recharts charts with consistent header styling.
 * Props: title, kicker, tag, action (ReactNode), children, minHeight
 */
export default function ChartCard({ title, kicker, tag, action, children, minHeight = 240, className = '' }) {
  return (
    <div className={`chart-card ${className}`}>
      <div className="panel-header">
        <div>
          {kicker && <span className="panel-kicker">{kicker}</span>}
          <h2 className="panel-title">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {tag && <span className="tag-pill">{tag}</span>}
          {action}
        </div>
      </div>
      <div className="chart-box" style={{ minHeight }}>
        {children}
      </div>
    </div>
  );
}
