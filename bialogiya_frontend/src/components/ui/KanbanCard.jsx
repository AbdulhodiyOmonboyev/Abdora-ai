import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';
import { Camera, Send, Users, UserCheck, Globe, Pin, Phone, Target, Snowflake } from 'lucide-react';

const STATUS_CONFIG = {
  new:       { label: 'Yangi',          color: '#3B82F6', bg: '#EFF6FF' },
  contacted: { label: "Bog'lanildi",    color: '#8B5CF6', bg: '#F5F3FF' },
  trial:     { label: 'Sinov darsi',    color: '#F59E0B', bg: '#FFFBEB' },
  enrolled:  { label: "O'qishga kirdi", color: '#10B981', bg: '#ECFDF5' },
  frozen:    { label: 'Muzlatilgan',    color: '#64748B', bg: '#F8FAFC' },
  archived:  { label: 'Arxiv',          color: '#94A3B8', bg: '#F1F5F9' },
  lost:      { label: 'Chiqib ketdi',   color: '#EF4444', bg: '#FEF2F2' },
};

const SOURCE_ICONS = {
  instagram: Camera,
  telegram:  Send,
  referral:  Users,
  walkin:    UserCheck,
  landing:   Globe,
  other:     Pin,
};

function daysSince(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * KanbanCard — bitta lid uchun karta
 * Props: lead, onClick, onStatusChange, statusOptions
 */
export default function KanbanCard({ lead, onClick, statusOptions = [] }) {
  const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
  const days = daysSince(lead.createdAt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={() => onClick?.(lead)}
      className="cursor-pointer rounded-xl p-3.5 transition-shadow hover:shadow-md"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Name + source */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="font-semibold text-sm leading-tight line-clamp-1" style={{ color: 'var(--text-primary)' }}>
          {lead.name}
        </div>
        <span className="text-muted flex-shrink-0" title={lead.source}>
          {(() => {
            const Icon = SOURCE_ICONS[lead.source] || Pin;
            return <Icon size={14} />;
          })()}
        </span>
      </div>

      {/* Phone */}
      <a
        href={`tel:${lead.phone}`}
        onClick={e => e.stopPropagation()}
        className="flex items-center gap-1.5 text-xs mb-2.5 hover:underline"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Phone size={12} style={{ color: 'var(--primary)' }} />
        <span>{lead.phone}</span>
      </a>

      {/* interestedIn */}
      {lead.interestedIn && (
        <div className="flex items-center gap-1.5 text-xs mb-2.5 truncate" style={{ color: 'var(--text-muted)' }}>
          <Target size={12} className="text-amber-500 flex-shrink-0" />
          <span className="truncate">{lead.interestedIn}</span>
        </div>
      )}

      {/* Footer: days + status badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
          {days === 0 ? 'Bugun' : `${days} kun oldin`}
        </span>
        {lead.frozenUntil && lead.status === 'frozen' && (
          <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <Snowflake size={11} className="text-sky-500" /> {new Date(lead.frozenUntil).toLocaleDateString('uz-UZ')}
          </span>
        )}
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}
        >
          {cfg.label}
        </span>
      </div>
    </motion.div>
  );
}
