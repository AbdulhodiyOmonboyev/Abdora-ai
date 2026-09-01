const sanitizePhoneUsername = (phone) => {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length >= 7) {
    return `+${digits}`;
  }
  return String(phone).trim();
};

const sanitizeName = (name) => {
  const clean = String(name || '')
    .trim()
    .split(/\s+/)[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return clean || 'user';
};

const getPhoneCode = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : null;
};

const generateUsername = (name, phone) => {
  const phoneUser = sanitizePhoneUsername(phone);
  if (phoneUser) return phoneUser;

  const base = sanitizeName(name);
  const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
  return `${base}_${randomCode}`;
};

const generatePassword = (phone, customPassword) => {
  if (customPassword && customPassword.trim().length >= 4) {
    return customPassword.trim();
  }
  const phoneCode = getPhoneCode(phone);
  if (phoneCode) return phoneCode;
  return Math.floor(1000 + Math.random() * 9000).toString();
};

module.exports = { sanitizeName, sanitizePhoneUsername, getPhoneCode, generateUsername, generatePassword };
