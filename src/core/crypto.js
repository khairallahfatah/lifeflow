/* ============================================================
   LifeFlow — Cryptographic Security Engine
   Web Crypto API: AES-GCM-256 + PBKDF2-SHA-256 (210,000 iterations)
   ============================================================ */

const ITERATIONS = 210000;
const KEY_LENGTH = 256;

// Base64 helpers
function bytesToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive an AES-GCM-256 key from a user passphrase using PBKDF2-SHA-256
 * @param {string} passphrase - User password
 * @param {Uint8Array} salt - 16-byte random salt
 * @returns {Promise<CryptoKey>}
 */
export async function deriveKeyFromPassphrase(passphrase, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a cryptographically random 256-bit AES-GCM key
 * @returns {Promise<CryptoKey>}
 */
export async function generateRandomAESKey() {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export a CryptoKey to a Base64 string
 */
export async function exportRawKey(cryptoKey) {
  const raw = await crypto.subtle.exportKey('raw', cryptoKey);
  return bytesToBase64(new Uint8Array(raw));
}

/**
 * Import a CryptoKey from a Base64 string
 */
export async function importRawKey(base64Key) {
  const rawBytes = base64ToBytes(base64Key);
  return crypto.subtle.importKey(
    'raw',
    rawBytes,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt arbitrary JSON data with AES-GCM-256
 * @param {any} data - Object or array to encrypt
 * @param {string|CryptoKey} keyOrPassphrase - Password or CryptoKey
 * @returns {Promise<Object>} Secure backup bundle
 */
export async function encryptData(data, keyOrPassphrase) {
  const jsonStr = JSON.stringify(data);
  const plainBytes = new TextEncoder().encode(jsonStr);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  let key;
  let salt = null;

  if (typeof keyOrPassphrase === 'string') {
    salt = crypto.getRandomValues(new Uint8Array(16));
    key = await deriveKeyFromPassphrase(keyOrPassphrase, salt);
  } else {
    key = keyOrPassphrase;
  }

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plainBytes
  );

  return {
    app: 'LifeFlow',
    format: 'LifeFlow-SecureBackup',
    version: 2,
    encrypted: true,
    algorithm: 'AES-GCM-256',
    kdf: salt ? 'PBKDF2-SHA-256' : 'DIRECT-AES-GCM',
    iterations: salt ? ITERATIONS : null,
    salt: salt ? bytesToBase64(salt) : null,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(cipherBuffer)),
    exportedAt: new Date().toISOString()
  };
}

/**
 * Decrypt a LifeFlow secure bundle
 * @param {Object} bundle - The encrypted JSON bundle
 * @param {string|CryptoKey} keyOrPassphrase - Password or CryptoKey
 * @returns {Promise<any>} Decrypted JSON data
 */
export async function decryptData(bundle, keyOrPassphrase) {
  if (!bundle || !bundle.encrypted || !bundle.ciphertext || !bundle.iv) {
    throw new Error('Invalid or corrupted encrypted bundle format.');
  }

  const iv = base64ToBytes(bundle.iv);
  const cipherBytes = base64ToBytes(bundle.ciphertext);

  let key;
  if (typeof keyOrPassphrase === 'string') {
    if (!bundle.salt) {
      throw new Error('Bundle is missing derivation salt.');
    }
    const salt = base64ToBytes(bundle.salt);
    key = await deriveKeyFromPassphrase(keyOrPassphrase, salt);
  } else {
    key = keyOrPassphrase;
  }

  try {
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBytes
    );

    const decoded = new TextDecoder().decode(plainBuffer);
    return JSON.parse(decoded);
  } catch (err) {
    throw new Error('Decryption failed. Please verify the password or key.');
  }
}

export default {
  deriveKey: deriveKeyFromPassphrase,
  generateKey: generateRandomAESKey,
  exportKey: exportRawKey,
  importKey: importRawKey,
  encrypt: encryptData,
  decrypt: decryptData
};
