import { Clock, Phone, MessageSquare, Users, Calendar } from 'lucide-react';

const TYPE_CONFIG = {
  call:    { icon: Phone,         color: '#10B981', bg: '#ECFDF5', label: "Qo'ng'iroq" },
  note:    { icon: MessageSquare, color: '#3B82F6', bg: '#EFF6FF', label: 'Izoh' },
  meeting: { icon: Users,         color: '#8B5CF6', bg: '#F5F3FF', label: 'Uchrashuv' },
  sms:     { icon: MessageSquare, color: '#F59E0B', bg: '#FFFBEB', label: 'SMS' },
  task:    { icon: Calendar,      color: '#EC4899', bg: '#FDF2F8', label: 'Vazifa' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} kun oldin`;
  if (hours > 0) return `${hours} soat oldin`;
  if (mins > 0) return `${mins} daqiqa oldin`;
  return 'Hozirgina';
}

/**
 * TimelineItem — single activity entry in lead detail
 * Props: activity { id, type, content, createdAt, performedBy? }
 */
export default function TimelineItem({ activity, isLast = false }) {
  const cfg = TYPE_CONFIG[activity.type] || TYPE_CONFIG.note;
  const Icon = cfg.icon;

  return (
    <div className="flex gap-3">
      {/* Timeline line + icon */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: cfg.bg, border: `1.5px solid ${cfg.color}40` }}
        >
          <Icon size={14} style={{ color: cfg.color }} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 mt-1 mb-0.5" style={{ background: 'var(--border)', minHeight: 16 }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
          {activity.performedBy && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              · {activity.performedBy}
            </span>
          )}
          <span className="text-xs ml-auto flex-shrink-0 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Clock size={10} />
            {timeAgo(activity.createdAt)}
          </span>
        </div>
        {activity.content && (
          <div
            className="text-sm rounded-xl p-3 leading-relaxed"
            style={{
              background: 'var(--secondary-background)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            {activity.content}
          </div>
        )}
        {activity.scheduledAt && (
          <div className="mt-1.5 text-xs flex items-center gap-1" style={{ color: 'var(--warning)' }}>
            <Calendar size={11} />
            Keyingi aloqa: {new Date(activity.scheduledAt).toLocaleDateString('uz-UZ')}
          </div>
        )}
      </div>
    </div>
  );
}
