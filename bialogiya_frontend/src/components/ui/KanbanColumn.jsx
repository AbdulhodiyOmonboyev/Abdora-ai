import { useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import KanbanCard from './KanbanCard';

const STATUS_CONFIG = {
  new:       { label: 'Yangi',          color: '#3B82F6', headerBg: '#DBEAFE' },
  contacted: { label: "Bog'lanildi",    color: '#8B5CF6', headerBg: '#EDE9FE' },
  trial:     { label: 'Sinov darsi',    color: '#F59E0B', headerBg: '#FEF3C7' },
  enrolled:  { label: "O'qishga kirdi", color: '#10B981', headerBg: '#D1FAE5' },
  frozen:    { label: 'Muzlatilgan',    color: '#64748B', headerBg: '#E2E8F0' },
  archived:  { label: 'Arxiv',          color: '#94A3B8', headerBg: '#F1F5F9' },
  lost:      { label: 'Chiqib ketdi',   color: '#EF4444', headerBg: '#FEE2E2' },
};

/**
 * KanbanColumn
 * Props:
 *  status     - string (e.g. 'new')
 *  leads      - array
 *  onCardClick - fn(lead)
 *  count      - number (total in this column)
 */
export default function KanbanColumn({ status, leads = [], onCardClick, count }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#64748B', headerBg: '#F1F5F9' };

  return (
    <div
      className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden"
      style={{
        width: 272,
        minWidth: 272,
        background: 'var(--secondary-background)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Column header */}
      <div
        className="px-4 py-3 flex items-center justify-between gap-2 flex-shrink-0"
        style={{ background: cfg.headerBg + 'CC', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
          <span className="text-sm font-semibold" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: cfg.color, color: 'white' }}
        >
          {count ?? leads.length}
        </span>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[120px]" style={{ maxHeight: 'calc(100vh - 260px)' }}>
        <AnimatePresence initial={false}>
          {leads.length === 0 ? (
            <div className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
              Bu ustunda lid yo'q
            </div>
          ) : (
            leads.map(lead => (
              <KanbanCard
                key={lead.id}
                lead={lead}
                onClick={onCardClick}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
