const { v4: uuidv4 } = require('uuid');

const sanitizeName = (name) => {
  return String(name || '')
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '')
    .replace(/^\.+|\.+$/g, '');
};

const getPhoneCode = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : null;
};

const generateUsername = (name, phone) => {
  const base = sanitizeName(name) || 'user';
  const suffix = getPhoneCode(phone) || Math.floor(1000 + Math.random() * 9000);
  return `${base}_${suffix}`;
};

const generatePassword = (length = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

module.exports = { generateUsername, generatePassword, getPhoneCode };
