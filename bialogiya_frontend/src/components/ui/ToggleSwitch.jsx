/**
 * Reusable ToggleSwitch component
 * Props: checked, onChange, disabled, size ('sm' | 'md')
 */
export default function ToggleSwitch({ checked, onChange, disabled = false, size = 'md', label, hint }) {
  const track = size === 'sm'
    ? 'h-5 w-9'
    : 'h-6 w-11';
  const thumb = size === 'sm'
    ? 'h-4 w-4'
    : 'h-5 w-5';
  const translate = size === 'sm'
    ? (checked ? 'translate-x-4' : 'translate-x-0.5')
    : (checked ? 'translate-x-5' : 'translate-x-0.5');

  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      className={`relative inline-flex flex-shrink-0 ${track} cursor-pointer rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ backgroundColor: checked ? 'var(--primary)' : 'var(--border)' }}
    >
      <span
        className={`pointer-events-none inline-block ${thumb} transform rounded-full bg-white shadow ring-0 
          transition duration-200 ease-in-out ${translate}`}
      />
    </button>
  );

  if (!label) return toggle;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
        {hint && <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{hint}</div>}
      </div>
      {toggle}
    </div>
  );
}
