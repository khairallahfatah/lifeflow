/* ============================================================
   LifeFlow — Core Database & Storage Persistence Layer
   IndexedDB Schema + Storage Persist Engine (Anti-Eviction)
   ============================================================ */

const DB_NAME = 'lifeflow';
const DB_VERSION = 3;

export const STORE_DEFS = {
  users: { scope: false, idx: [] },
  settings: { scope: true, idx: [] },
  workspaces: { scope: true, idx: [] },
  notifications: { scope: true, idx: [] },
  tasks: { scope: true, idx: ['date', 'projectId'] },
  subtasks: { scope: true, idx: ['taskId'] },
  projects: { scope: true, idx: ['workspaceId'] },
  events: { scope: true, idx: ['date'] },
  expenses: { scope: true, idx: ['date', 'categoryId'] },
  expenseCategories: { scope: true, idx: [] },
  budgets: { scope: true, idx: [] },
  incomes: { scope: true, idx: ['date'] },
  debts: { scope: true, idx: [] },
  debtPayments: { scope: true, idx: ['debtId'] },
  contacts: { scope: true, idx: [] },
  shoppingLists: { scope: true, idx: [] },
  shoppingItems: { scope: true, idx: ['listId'] },
  homeTasks: { scope: true, idx: ['date'] },
  habits: { scope: true, idx: [] },
  habitLogs: { scope: true, idx: ['habitId', 'date'] },
  goals: { scope: true, idx: [] },
  goalSteps: { scope: true, idx: ['goalId'] },
  notes: { scope: true, idx: [] },
  reminders: { scope: true, idx: ['date'] },
  subjects: { scope: true, idx: [] },
  exams: { scope: true, idx: ['date'] },
  assignments: { scope: true, idx: ['dueDate'] },
  studySessions: { scope: true, idx: ['date'] },
  dayReviews: { scope: true, idx: ['date'] },

  /* Phase 3 Stores */
  health_logs: { scope: true, idx: ['date'] },
  routines: { scope: true, idx: ['type'] },
  focus_sessions: { scope: true, idx: ['date', 'taskId'] },
  vault_items: { scope: true, idx: ['expiryDate', 'type'] },
  inbox_items: { scope: true, idx: ['createdAt', 'status'] }
};

export const STORES = Object.keys(STORE_DEFS);

/* ============================================================
   1. Storage Persistence Engine (navigator.storage.persist)
   Protects local data from silent browser eviction
   ============================================================ */

/**
 * Check if persistent storage is already granted
 * @returns {Promise<boolean>}
 */
export async function isStoragePersisted() {
  if (navigator.storage && navigator.storage.persisted) {
    try {
      return await navigator.storage.persisted();
    } catch (err) {
      console.warn('[LifeFlow Storage] Failed to check persisted status:', err);
    }
  }
  return false;
}

/**
 * Request persistent storage from the browser
 * Eviction protection for offline-first data
 * @returns {Promise<{persisted: boolean, quotaMB: number, usageMB: number}>}
 */
export async function requestPersistentStorage() {
  let persisted = false;

  if (navigator.storage && navigator.storage.persist) {
    try {
      const alreadyPersisted = await navigator.storage.persisted();
      if (alreadyPersisted) {
        console.log('[LifeFlow Storage] 🛡️ Storage is already marked as persistent.');
        persisted = true;
      } else {
        persisted = await navigator.storage.persist();
        console.log(`[LifeFlow Storage] 🛡️ Storage persist request result: ${persisted ? 'GRANTED' : 'DENIED'}`);
      }
    } catch (e) {
      console.warn('[LifeFlow Storage] Persistent storage request error:', e);
    }
  } else {
    console.warn('[LifeFlow Storage] navigator.storage.persist() is not supported in this browser.');
  }

  const estimate = await getStorageEstimate();
  return {
    persisted,
    ...estimate
  };
}

/**
 * Get current storage usage and available quota
 * @returns {Promise<{quotaMB: number, usageMB: number, usagePct: number}>}
 */
export async function getStorageEstimate() {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const { quota, usage } = await navigator.storage.estimate();
      const quotaMB = Math.round((quota || 0) / (1024 * 1024));
      const usageMB = Math.round(((usage || 0) / (1024 * 1024)) * 10) / 10;
      const usagePct = quota ? Math.round((usage / quota) * 1000) / 10 : 0;
      return { quotaMB, usageMB, usagePct };
    } catch (err) {
      console.warn('[LifeFlow Storage] Estimate error:', err);
    }
  }
  return { quotaMB: 0, usageMB: 0, usagePct: 0 };
}

/* ============================================================
   2. IndexedDB Database Operations
   ============================================================ */

class DatabaseLayer {
  constructor() {
    this.backend = null; // 'idb' | 'memory'
    this._idb = null;
    this._mem = {};
    this._opened = null;
    this._activeUserId = null;
  }

  setActiveUser(userId) {
    this._activeUserId = userId;
  }

  getActiveUser() {
    return this._activeUserId;
  }

  async open() {
    if (this._opened) return this._opened;

    this._opened = this._openIdb().catch((err) => {
      console.warn('[LifeFlow DB] IndexedDB unavailable, falling back to Memory store:', err);
      this.backend = 'memory';
      for (const s of STORES) this._mem[s] = new Map();
      return 'memory';
    });

    return this._opened;
  }

  _openIdb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      let req;
      try {
        req = window.indexedDB.open(DB_NAME, DB_VERSION);
      } catch (e) {
        reject(e);
        return;
      }

      req.onupgradeneeded = (ev) => {
        const idb = req.result;
        for (const name of STORES) {
          let store;
          if (!idb.objectStoreNames.contains(name)) {
            store = idb.createObjectStore(name, { keyPath: 'id' });
          } else {
            store = ev.target.transaction.objectStore(name);
          }

          const def = STORE_DEFS[name];
          if (def.scope && !store.indexNames.contains('userId')) {
            store.createIndex('userId', 'userId', { unique: false });
          }
          for (const ix of def.idx) {
            if (!store.indexNames.contains(ix)) {
              store.createIndex(ix, ix, { unique: false });
            }
          }
        }
      };

      req.onsuccess = () => {
        const idb = req.result;
        idb.onversionchange = () => {
          try { idb.close(); } catch (e) {}
        };
        this._idb = idb;
        this.backend = 'idb';
        console.log('[LifeFlow DB] IndexedDB opened successfully.');
        resolve('idb');
      };

      req.onerror = () => reject(req.error || new Error('IDB open failed'));
      req.onblocked = () => reject(new Error('IDB blocked by another open tab'));
    });
  }

  _assertReady() {
    if (!this.backend) throw new Error('Database not initialized. Call open() first.');
  }

  _generateId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  /**
   * Save or update record
   */
  async put(store, record, opts = {}) {
    this._assertReady();
    if (!STORE_DEFS[store]) throw new Error(`Unknown store: ${store}`);

    const rec = JSON.parse(JSON.stringify(record));
    const now = new Date().toISOString();
    if (!rec.id) rec.id = this._generateId();
    if (!rec.createdAt) rec.createdAt = now;
    rec.updatedAt = now;

    if (STORE_DEFS[store].scope) {
      const uid = opts.all ? (rec.userId || null) : this._activeUserId;
      if (uid) rec.userId = uid;
    }

    if (this.backend === 'memory') {
      this._mem[store].set(rec.id, rec);
      return rec;
    }

    return new Promise((resolve, reject) => {
      const tx = this._idb.transaction(store, 'readwrite');
      const req = tx.objectStore(store).put(rec);
      req.onsuccess = () => resolve(rec);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Get record by ID
   */
  async get(store, id) {
    this._assertReady();
    if (this.backend === 'memory') {
      const item = this._mem[store].get(id);
      return item ? JSON.parse(JSON.stringify(item)) : null;
    }

    return new Promise((resolve, reject) => {
      const tx = this._idb.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * List records with optional predicate filter
   */
  async list(store, opts = {}) {
    this._assertReady();
    const uid = opts.all ? null : this._activeUserId;

    if (this.backend === 'memory') {
      let items = Array.from(this._mem[store].values());
      if (STORE_DEFS[store].scope && uid) {
        items = items.filter((x) => x.userId === uid);
      }
      if (opts.predicate) items = items.filter(opts.predicate);
      return items.map((x) => JSON.parse(JSON.stringify(x)));
    }

    return new Promise((resolve, reject) => {
      const tx = this._idb.transaction(store, 'readonly');
      const s = tx.objectStore(store);
      const req = (STORE_DEFS[store].scope && uid && s.indexNames.contains('userId'))
        ? s.index('userId').getAll(IDBKeyRange.only(uid))
        : s.getAll();

      req.onsuccess = () => {
        let res = req.result || [];
        if (opts.predicate) res = res.filter(opts.predicate);
        resolve(res);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Delete record by ID
   */
  async delete(store, id) {
    this._assertReady();
    if (this.backend === 'memory') {
      return this._mem[store].delete(id);
    }
    return new Promise((resolve, reject) => {
      const tx = this._idb.transaction(store, 'readwrite');
      const req = tx.objectStore(store).delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Count records in a store
   */
  async count(store) {
    this._assertReady();
    if (this.backend === 'memory') {
      return this._mem[store].size;
    }
    return new Promise((resolve, reject) => {
      const tx = this._idb.transaction(store, 'readonly');
      const req = tx.objectStore(store).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

export const db = new DatabaseLayer();
export default db;
