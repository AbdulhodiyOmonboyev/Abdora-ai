/**
 * StatusBadge — Reusable themed status badge.
 * Props:
 *   status - one of: 'active'|'inactive'|'faol'|'nofaol'|'yangi'|'boglanildi'|
 *            'yozildi'|'rad'|'pending'|'paid'|'unpaid'|'frozen'|string
 *   label  - optional override label
 *   dot    - show dot indicator (default true)
 */

const STATUS_MAP = {
  // Generic
  active:     { cls: 'badge-success', label: 'Faol' },
  inactive:   { cls: 'badge-gray',    label: 'Nofaol' },
  faol:       { cls: 'badge-success', label: 'Faol' },
  nofaol:     { cls: 'badge-gray',    label: 'Nofaol' },
  frozen:     { cls: 'badge-info',    label: 'Muzlatilgan' },

  // Applications
  yangi:       { cls: 'badge-orange', label: 'Yangi' },
  boglanildi:  { cls: 'badge-info',   label: "Bog'lanildi" },
  yozildi:     { cls: 'badge-success',label: "O'qishga yozildi" },
  rad:         { cls: 'badge-error',  label: 'Rad etildi' },

  // Leads
  new:         { cls: 'badge-orange', label: 'Yangi' },
  contacted:   { cls: 'badge-info',   label: "Bog'lanildi" },
  trial:       { cls: 'badge-purple', label: 'Sinov' },
  enrolled:    { cls: 'badge-success',label: 'Kirdi' },
  paused:      { cls: 'badge-warning',label: 'Muzlatilgan' },
  archived:    { cls: 'badge-gray',   label: 'Arxiv' },
  left:        { cls: 'badge-error',  label: 'Chiqib ketgan' },

  // Finance / payments
  paid:        { cls: 'badge-success',label: "To'langan" },
  unpaid:      { cls: 'badge-error',  label: "To'lanmagan" },
  partial:     { cls: 'badge-warning',label: 'Qisman' },
  pending:     { cls: 'badge-warning',label: 'Kutilmoqda' },

  // Users
  admin:   { cls: 'badge-orange',  label: 'Admin' },
  manager: { cls: 'badge-info',    label: 'Manager' },
  teacher: { cls: 'badge-purple',  label: "O'qituvchi" },
  student: { cls: 'badge-gray',    label: "O'quvchi" },
  reception: { cls: 'badge-success', label: 'Qabulxona' },
};

export default function StatusBadge({ status, label, dot = true }) {
  const key = (status || '').toLowerCase();
  const config = STATUS_MAP[key] || { cls: 'badge-gray', label: status || '—' };
  const text = label ?? config.label;

  return (
    <span className={`badge ${config.cls} ${dot ? 'badge-dot' : ''}`}>
      {text}
    </span>
  );
}
