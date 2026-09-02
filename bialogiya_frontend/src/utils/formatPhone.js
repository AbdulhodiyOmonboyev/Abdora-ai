export function formatUzPhone(input) {
  if (!input) return '+998 ';
  
  let digits = String(input).replace(/\D/g, '');

  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }

  digits = digits.slice(0, 9);

  if (digits.length === 0) return '+998 ';

  let res = '+998 ';
  if (digits.length > 0) {
    res += `(${digits.slice(0, 2)}`;
  }
  if (digits.length >= 2) {
    res += `) ${digits.slice(2, 5)}`;
  } else {
    return res;
  }
  if (digits.length > 5) {
    res += `-${digits.slice(5, 7)}`;
  }
  if (digits.length > 7) {
    res += `-${digits.slice(7, 9)}`;
  }

  return res;
}
