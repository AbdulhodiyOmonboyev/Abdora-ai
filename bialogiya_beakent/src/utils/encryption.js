const crypto = require('crypto');

// Generate or read 32-byte key from env
const getEncryptionKey = () => {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey) {
    if (envKey.length === 64) {
      return Buffer.from(envKey, 'hex');
    }
    return crypto.createHash('sha256').update(envKey).digest();
  }
  // Default deterministic key for development/test if not set
  return crypto.createHash('sha256').update('abdora-ai-default-secure-encryption-key-2026').digest();
};

/**
 * Encrypt plain text using AES-256-GCM
 * @param {string} text
 * @returns {{ encrypted: string, iv: string }}
 */
function encrypt(text) {
  if (!text) return { encrypted: null, iv: null };
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted + ':' + authTag.toString('hex'),
    iv: iv.toString('hex')
  };
}

/**
 * Decrypt text using AES-256-GCM
 * @param {string} encryptedWithTag
 * @param {string} ivHex
 * @returns {string|null}
 */
function decrypt(encryptedWithTag, ivHex) {
  if (!encryptedWithTag || !ivHex) return null;
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const parts = encryptedWithTag.split(':');
    if (parts.length !== 2) return null;
    
    const [encryptedHex, authTagHex] = parts;
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return null;
  }
}

module.exports = {
  encrypt,
  decrypt
};
