import { Search } from 'lucide-react';

/**
 * SearchInput — Reusable search input
 * Props: value, onChange, placeholder, className, style
 */
export default function SearchInput({ value, onChange, placeholder = 'Qidirish...', className = '', style }) {
  return (
    <div className={`search-input-wrap ${className}`} style={style}>
      <Search size={16} className="search-icon" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
        style={{ minWidth: 220, height: '2.25rem', fontSize: '0.8125rem' }}
      />
    </div>
  );
}
