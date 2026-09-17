/**
 * Formats phone input to Uzbekistan phone format: +998 XX XXX XX XX
 * Auto-prefixes +998 and formats digits naturally as the user types.
 */
export function formatUzPhone(input) {
  if (!input) return '+998 ';
  
  let str = String(input);
  let digits = str.replace(/\D/g, '');

  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }

  digits = digits.slice(0, 9);

  if (digits.length === 0) return '+998 ';

  let res = '+998 ';
  res += digits.slice(0, 2);
  if (digits.length > 2) {
    res += ' ' + digits.slice(2, 5);
  }
  if (digits.length > 5) {
    res += ' ' + digits.slice(5, 7);
  }
  if (digits.length > 7) {
    res += ' ' + digits.slice(7, 9);
  }

  return res;
}

/**
 * Returns cleaned phone string or empty string if only country code was entered.
 */
export function cleanPhone(input) {
  if (!input) return '';
  const digits = String(input).replace(/\D/g, '');
  if (digits.length < 5 || digits === '998') return '';
  return input.trim();
}
