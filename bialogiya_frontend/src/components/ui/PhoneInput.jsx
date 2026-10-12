import React, { useRef } from 'react';
import { formatUzPhone } from '../../utils/formatPhone';

export default function PhoneInput({
  value,
  onChange,
  onFocus,
  onKeyDown,
  className = 'input-field',
  placeholder = '+998 90 123 45 67',
  type = 'tel',
  ...props
}) {
  const inputRef = useRef(null);

  // Safely extract string if value is passed as syntheticEvent or object
  const normalizedValue = typeof value === 'object' && value !== null
    ? (value.target?.value ?? value.value ?? '')
    : value;

  // Always ensure +998 is present
  const displayValue = normalizedValue !== undefined && normalizedValue !== null && normalizedValue !== ''
    ? (String(normalizedValue).startsWith('+998') ? String(normalizedValue) : formatUzPhone(normalizedValue))
    : '+998 ';

  const handleChange = (e) => {
    const raw = e.target.value;
    const formatted = formatUzPhone(raw);
    
    // Create synthetic event compatible with both event and value consumers
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: formatted,
        name: e.target?.name || props.name || '',
      },
      currentTarget: {
        ...e.currentTarget,
        value: formatted,
        name: e.currentTarget?.name || props.name || '',
      },
      toString: () => formatted,
      valueOf: () => formatted,
    };

    if (onChange) {
      onChange(syntheticEvent);
    }
  };

  const handleFocus = (e) => {
    if (!value || String(value).trim() === '+998' || String(value).trim() === '') {
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: '+998 ', name: e.target?.name || props.name || '' },
      };
      if (onChange) onChange(syntheticEvent);
    }
    if (onFocus) onFocus(e);
  };

  const handleKeyDown = (e) => {
    // Never allow backspacing away the '+998 ' prefix
    if (e.key === 'Backspace') {
      const selStart = e.target.selectionStart;
      const selEnd = e.target.selectionEnd;
      if (displayValue === '+998 ' || displayValue === '+998') {
        e.preventDefault();
        return;
      }
      if (selStart <= 5 && selEnd <= 5) {
        e.preventDefault();
        return;
      }
    }
    if (onKeyDown) onKeyDown(e);
  };

  return (
    <input
      ref={inputRef}
      type={type}
      className={className}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}
