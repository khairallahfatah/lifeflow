/* ============================================================
   LifeFlow — Instant Offline Backup & Restore Engine
   One-Click Zero-Friction AES-GCM-256 Encrypted Local Backups
   ============================================================ */

import { db, STORES } from './db.js';
import cryptoEngine from './crypto.js';
import driveSync from './drive-sync.js';
import { toast } from '../ui/toast.js';

// Internal application-level secret for frictionless one-click encrypted backups
const INSTANT_BACKUP_SECRET = 'LifeFlow-Instant-Vault-AES256-Key-2026-ZeroFriction';

/**
 * Dump all database records across all 34 IndexedDB stores + legacy state
 * @returns {Promise<Object>}
 */
export async function collectFullBackupPayload() {
  await db.open();

  const payload = {
    app: 'LifeFlow',
    format: 'LifeFlow-FullBackup',
    version: 2,
    exportedAt: new Date().toISOString(),
    stores: {},
    legacy: null,
    prefs: {}
  };

  // 1. Collect all 34 IndexedDB stores
  for (const store of STORES) {
    try {
      payload.stores[store] = await db.list(store, { all: true });
    } catch (e) {
      payload.stores[store] = [];
    }
  }

  // 2. Collect legacy accounts/data if available
  if (typeof window !== 'undefined' && window.LF && window.LF.db && typeof window.LF.db.exportUser === 'function') {
    try {
      const legacyData = await window.LF.db.exportUser();
      payload.legacy = {
        data: legacyData,
        settings: window.LF.store ? window.LF.store.settings : {}
      };
    } catch (err) {
      console.warn('[Instant Backup] Legacy dump skipped:', err);
    }
  }

  // 3. Collect preferences from localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      payload.prefs = {
        theme: localStorage.getItem('lf.theme') || localStorage.getItem('lf.prefs'),
        activeWorkspace: localStorage.getItem('lf.activeWorkspace')
      };
    } catch (e) {
      // Ignore
    }
  }

  return payload;
}

/**
 * Trigger Instant Encrypted Backup Download (.lfb file)
 * Zero friction, 100% encrypted with AES-GCM-256
 */
export async function exportInstantEncryptedBackup() {
  try {
    toast.info('جارٍ تجهيز وتشفير النسخة الاحتياطية...');
    const payload = await collectFullBackupPayload();

    // Encrypt with AES-GCM-256 + PBKDF2
    const encryptedBundle = await cryptoEngine.encrypt(payload, INSTANT_BACKUP_SECRET);

    // Count total records
    let totalRecords = 0;
    for (const store of Object.keys(payload.stores)) {
      totalRecords += (payload.stores[store] || []).length;
    }

    // Format filename with readable timestamp
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `lifeflow-backup-encrypted-${dateStr}-${timeStr}.lfb`;

    // Download file
    const jsonStr = JSON.stringify(encryptedBundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/octet-stream;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast.ok(`تم تنزيل النسخة المشفرة بنجاح (${totalRecords} سجل) 📥`);
    return { success: true, filename, totalRecords };
  } catch (err) {
    console.error('[Instant Backup Error]', err);
    toast.error('فشل تصدير النسخة الاحتياطية: ' + err.message);
    throw err;
  }
}

/**
 * Restore from a backup JSON string or encrypted bundle
 * @param {string|Object} rawData 
 * @param {string} [customPassword] 
 */
export async function restoreFromBackupData(rawData, customPassword = '') {
  let bundle = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

  let payload = bundle;

  // Handle encrypted bundles
  if (bundle.encrypted && bundle.ciphertext) {
    let decrypted = null;
    // 1. Try with instant backup secret first (one-click default)
    try {
      decrypted = await cryptoEngine.decrypt(bundle, INSTANT_BACKUP_SECRET);
    } catch (e1) {
      // 2. If user supplied a custom password
      if (customPassword) {
        decrypted = await cryptoEngine.decrypt(bundle, customPassword);
      } else {
        // 3. Try legacy encryption key if from monolith
        if (typeof window !== 'undefined' && window.LF && window.LF.data && window.LF.data.decryptBackup) {
          try {
            decrypted = await window.LF.data.decryptBackup(bundle, customPassword || 'lifeflow');
          } catch (e2) {
            // Needs password prompt
            const pwd = prompt('هذه النسخة محمية بكلمة مرور خاصة. يرجى إدخال كلمة المرور:');
            if (!pwd) throw new Error('تم إلغاء عملية الاستعادة.');
            decrypted = await cryptoEngine.decrypt(bundle, pwd);
          }
        } else {
          const pwd = prompt('هذه النسخة محمية بكلمة مرور خاصة. يرجى إدخال كلمة المرور:');
          if (!pwd) throw new Error('تم إلغاء عملية الاستعادة.');
          decrypted = await cryptoEngine.decrypt(bundle, pwd);
        }
      }
    }
    payload = decrypted;
  }

  // Restore into IndexedDB
  await db.open();
  let restoredCount = 0;

  if (payload.stores) {
    for (const store of Object.keys(payload.stores)) {
      if (!STORES.includes(store)) continue;
      const records = payload.stores[store] || [];
      for (const rec of records) {
        await db.put(store, rec, { all: true });
        restoredCount++;
      }
    }
  }

  // Restore legacy state if present
  if (payload.legacy && typeof window !== 'undefined' && window.LF && window.LF.data && window.LF.data.restoreBackup) {
    try {
      await window.LF.data.restoreBackup(payload.legacy);
    } catch (err) {
      console.warn('[Instant Restore] Legacy restore error:', err);
    }
  } else if (payload.data && typeof window !== 'undefined' && window.LF && window.LF.data && window.LF.data.restoreBackup) {
    try {
      await window.LF.data.restoreBackup(payload);
    } catch (err) {
      console.warn('[Instant Restore] Monolith backup restore error:', err);
    }
  }

  // Notify drive sync and storage
  driveSync.notifyDataChanged();

  // Update last restore timestamp
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('lf.sync.lastSyncAt', new Date().toISOString());
  }

  return { success: true, restoredCount };
}

/**
 * Open file picker and immediately restore backup on file selection
 * @returns {Promise<boolean>}
 */
export function promptAndRestoreFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.lfb,.json,application/json,text/plain';
    input.style.display = 'none';

    input.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) {
        resolve(false);
        return;
      }

      toast.info('جارٍ قراءة واستعادة ملف النسخة الاحتياطية...');
      try {
        const text = await file.text();
        const res = await restoreFromBackupData(text);
        toast.ok(`تمت استعادة كافة البيانات بنجاح (${res.restoredCount} سجل)! 🚀`);
        
        // Refresh the active view if available
        if (typeof window !== 'undefined' && window.LF && window.LF.router && typeof window.LF.router.go === 'function') {
          const current = window.LF.router.current || 'dashboard';
          window.LF.router.go(current);
        } else if (typeof window !== 'undefined' && window.location) {
          setTimeout(() => window.location.reload(), 1200);
        }

        resolve(true);
      } catch (err) {
        console.error('[Instant Restore File Error]', err);
        toast.error('فشل استعادة الملف: ' + err.message);
        resolve(false);
      } finally {
        input.remove();
      }
    };

    document.body.appendChild(input);
    input.click();
  });
}

export default {
  exportInstantEncryptedBackup,
  restoreFromBackupData,
  promptAndRestoreFile,
  collectFullBackupPayload
};
