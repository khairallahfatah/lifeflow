/* ============================================================
   LifeFlow — Google Drive AppData Cloud Sync Engine
   Silent debounced backup + Auto-restore on startup + AES-GCM
   ============================================================ */

import { db, STORES } from './db.js';
import cryptoEngine from './crypto.js';
import auth from './auth.js';
import { toast } from '../ui/toast.js';

const BACKUP_FILENAME = 'lifeflow_backup.enc';
const KEY_FILENAME = 'lifeflow_key.json';
const DEBOUNCE_MS = 5000;

let syncTimer = null;
let isSyncing = false;
let syncStatus = 'idle'; // 'idle' | 'syncing' | 'synced' | 'offline' | 'auth-required' | 'error'
let lastSyncAt = localStorage.getItem('lf.sync.lastSyncAt') || null;
const statusListeners = new Set();

function updateStatus(newStatus) {
  syncStatus = newStatus;
  statusListeners.forEach((cb) => {
    try {
      cb({
        status: syncStatus,
        lastSyncAt,
        isOnline: navigator.onLine,
        signedIn: auth.isSignedIn()
      });
    } catch (e) {
      console.error(e);
    }
  });
}

function getAuthHeaders() {
  const token = auth.getToken();
  if (!token) throw new Error('Google authentication required');
  return {
    Authorization: `Bearer ${token}`
  };
}

/**
 * Locate a file inside Google Drive appDataFolder
 */
async function findAppDataFile(filename) {
  const q = encodeURIComponent(`name='${filename}' and 'appDataFolder' in parents and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&spaces=appDataFolder&fields=files(id,name,modifiedTime)`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    if (res.status === 401) {
      auth.signOut();
      updateStatus('auth-required');
    }
    throw new Error(`Drive list error: ${res.status}`);
  }

  const json = await res.json();
  return (json.files && json.files[0]) || null;
}

/**
 * Upload text/binary payload to Drive appDataFolder
 */
async function uploadToAppData(filename, content, mimeType = 'application/json') {
  const boundary = 'lf_boundary_' + Math.random().toString(16).slice(2);
  const metadata = JSON.stringify({
    name: filename,
    parents: ['appDataFolder'],
    mimeType: mimeType
  });

  const payload =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`;

  const existingFile = await findAppDataFile(filename);
  const url = existingFile
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  const method = existingFile ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      ...getAuthHeaders(),
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: payload
  });

  if (!res.ok) throw new Error(`Drive upload failed (${res.status})`);
  return res.json();
}

/**
 * Download raw file contents from Drive appDataFolder
 */
async function downloadFromAppData(filename) {
  const file = await findAppDataFile(filename);
  if (!file) return null;

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) throw new Error(`Drive download error: ${res.status}`);
  return res.text();
}

/**
 * Retrieve or generate the device-independent AES-GCM-256 cloud encryption key
 */
async function getOrCreateCloudKey() {
  const rawKeyData = await downloadFromAppData(KEY_FILENAME);
  if (rawKeyData) {
    try {
      const parsed = JSON.parse(rawKeyData);
      return await cryptoEngine.importKey(parsed.key);
    } catch (e) {
      console.warn('[LifeFlow Sync] Failed to parse existing cloud key, generating new one.');
    }
  }

  // Generate new AES-GCM-256 key and save it securely in appDataFolder
  const newKey = await cryptoEngine.generateKey();
  const base64Key = await cryptoEngine.exportKey(newKey);
  await uploadToAppData(KEY_FILENAME, JSON.stringify({ version: 1, key: base64Key }), 'application/json');
  return newKey;
}

/**
 * Gather a complete JSON dump of all 29 IndexedDB stores
 */
export async function dumpDatabase() {
  await db.open();
  const backup = {
    app: 'LifeFlow',
    version: 2,
    exportedAt: new Date().toISOString(),
    stores: {}
  };

  for (const store of STORES) {
    try {
      backup.stores[store] = await db.list(store, { all: true });
    } catch (err) {
      backup.stores[store] = [];
    }
  }

  return backup;
}

/**
 * Restore database dump into IndexedDB
 */
export async function restoreDatabase(backupData) {
  if (!backupData || !backupData.stores) {
    throw new Error('Invalid backup schema');
  }

  await db.open();
  for (const store of Object.keys(backupData.stores)) {
    if (!STORES.includes(store)) continue;
    const records = backupData.stores[store] || [];
    for (const record of records) {
      await db.put(store, record, { all: true });
    }
  }

  return true;
}

/**
 * Perform manual or scheduled upload of encrypted database to Google Drive
 */
export async function syncNow() {
  if (!navigator.onLine) {
    updateStatus('offline');
    return false;
  }

  if (!auth.isSignedIn()) {
    updateStatus('auth-required');
    return false;
  }

  if (isSyncing) return false;
  isSyncing = true;
  updateStatus('syncing');

  try {
    const key = await getOrCreateCloudKey();
    const dbDump = await dumpDatabase();
    const encryptedBundle = await cryptoEngine.encrypt(dbDump, key);

    await uploadToAppData(BACKUP_FILENAME, JSON.stringify(encryptedBundle), 'application/json');

    lastSyncAt = new Date().toISOString();
    localStorage.setItem('lf.sync.lastSyncAt', lastSyncAt);

    updateStatus('synced');
    console.log('[LifeFlow Sync] ☁️ Cloud sync completed successfully at', lastSyncAt);
    return true;
  } catch (err) {
    console.error('[LifeFlow Sync] Sync error:', err);
    updateStatus('error');
    return false;
  } finally {
    isSyncing = false;
  }
}

/**
 * Debounced automatic cloud sync (called whenever data changes)
 */
export function scheduleAutoSync() {
  if (!auth.isSignedIn() || !navigator.onLine) return;

  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncNow();
  }, DEBOUNCE_MS);
}

/**
 * Auto-restore check on startup
 * If cloud has newer backup (or local DB is empty), restores automatically
 */
export async function checkAndAutoRestore() {
  if (!navigator.onLine || !auth.isSignedIn()) return false;

  try {
    const cloudFile = await findAppDataFile(BACKUP_FILENAME);
    if (!cloudFile) return false;

    // Check local task count to detect empty device
    const localTasksCount = await db.count('tasks');
    const cloudModified = new Date(cloudFile.modifiedTime).getTime();
    const localLastSync = lastSyncAt ? new Date(lastSyncAt).getTime() : 0;

    // Restore if local is empty or cloud is clearly newer
    if (localTasksCount === 0 || cloudModified > localLastSync + 5000) {
      console.log('[LifeFlow Sync] 📥 Newer cloud backup found. Initiating auto-restore...');
      updateStatus('syncing');

      const rawEncrypted = await downloadFromAppData(BACKUP_FILENAME);
      if (!rawEncrypted) return false;

      const key = await getOrCreateCloudKey();
      const bundle = JSON.parse(rawEncrypted);
      const restoredData = await cryptoEngine.decrypt(bundle, key);

      await restoreDatabase(restoredData);

      lastSyncAt = cloudFile.modifiedTime;
      localStorage.setItem('lf.sync.lastSyncAt', lastSyncAt);
      updateStatus('synced');
      toast.ok('تمت استعادة بياناتك السحابية تلقائياً بنجاح! ☁️');
      return true;
    }
  } catch (err) {
    console.warn('[LifeFlow Sync] Auto-restore check failed:', err);
  }

  return false;
}

/**
 * Initialize Cloud Sync Listeners (visibilitychange, online, auth changes)
 */
export function initCloudSync() {
  // 1. Sync immediately when user leaves tab / locks screen
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && auth.isSignedIn() && navigator.onLine) {
      syncNow();
    }
  });

  // 2. Resume sync when network returns
  window.addEventListener('online', () => {
    if (auth.isSignedIn()) {
      syncNow();
    } else {
      updateStatus('auth-required');
    }
  });

  window.addEventListener('offline', () => {
    updateStatus('offline');
  });

  // 3. React to Google Auth changes
  auth.onChange(({ signedIn }) => {
    if (signedIn) {
      checkAndAutoRestore();
    } else {
      updateStatus('auth-required');
    }
  });

  // Initial status
  updateStatus(auth.isSignedIn() ? 'synced' : 'auth-required');
}

/**
 * Subscribe to sync status changes
 */
export function onSyncStatusChange(callback) {
  statusListeners.add(callback);
  callback({
    status: syncStatus,
    lastSyncAt,
    isOnline: navigator.onLine,
    signedIn: auth.isSignedIn()
  });
  return () => statusListeners.delete(callback);
}

export const notifyDataChanged = scheduleAutoSync;

export default {
  init: initCloudSync,
  sync: syncNow,
  schedule: scheduleAutoSync,
  notifyDataChanged: scheduleAutoSync,
  autoRestore: checkAndAutoRestore,
  dump: dumpDatabase,
  restore: restoreDatabase,
  onChange: onSyncStatusChange,
  getStatus: () => syncStatus,
  getLastSyncAt: () => lastSyncAt
};
