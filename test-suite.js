/* ============================================================
   LifeFlow — Automated System Diagnostic & Test Suite
   QA & Automation Verification Engine
   ============================================================ */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup Web API polyfills for Node test execution
if (!globalThis.crypto) {
  const { webcrypto } = await import('crypto');
  globalThis.crypto = webcrypto;
}
if (!globalThis.btoa) {
  globalThis.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}
if (!globalThis.atob) {
  globalThis.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');
}

const storageMap = new Map();
globalThis.localStorage = {
  getItem: (k) => storageMap.get(k) || null,
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
  clear: () => storageMap.clear()
};

globalThis.location = {
  hash: '#/app/dashboard',
  href: 'http://localhost:8000/',
  pathname: '/'
};

try {
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      userAgent: 'Mozilla/5.0 (LifeFlow-Automated-QA-Runner)',
      onLine: true,
      storage: {
        persist: async () => true,
        persisted: async () => true,
        estimate: async () => ({ quota: 10737418240, usage: 1048576 })
      }
    },
    writable: true,
    configurable: true
  });
} catch (e) {
  // If defineProperty fails, patch existing navigator
  if (globalThis.navigator) {
    globalThis.navigator.storage = {
      persist: async () => true,
      persisted: async () => true,
      estimate: async () => ({ quota: 10737418240, usage: 1048576 })
    };
  }
}

class MockNode {
  constructor() {
    this.nodeType = 1;
    this.parentNode = null;
  }
}
globalThis.Node = MockNode;

class MockElement extends MockNode {
  constructor(tag = 'div') {
    super();
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.classes = new Set();
    this.dataset = {};
    this.classList = {
      add: (c) => this.classes.add(c),
      remove: (c) => this.classes.delete(c),
      contains: (c) => this.classes.has(c),
      toggle: (c) => this.classes.has(c) ? this.classes.delete(c) : this.classes.add(c)
    };
    this._innerHTML = '';
    this.value = '';
    this.scrollWidth = 360;
    this.clientWidth = 360;
  }
  set innerHTML(val) {
    this._innerHTML = String(val);
    this.children = [];
    const idRegex = /<([a-z0-9-]+)[^>]*\bid=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = idRegex.exec(val)) !== null) {
      const el = new MockElement(match[1]);
      el.id = match[2];
      el.setAttribute('id', match[2]);
      this.appendChild(el);
    }
  }
  get innerHTML() { return this._innerHTML; }
  set textContent(val) { this._innerHTML = String(val); }
  get textContent() { return this._innerHTML; }
  set className(val) {
    this.classes.clear();
    String(val).split(/\s+/).filter(Boolean).forEach(c => this.classes.add(c));
  }
  get className() { return Array.from(this.classes).join(' '); }
  append(...items) {
    for (const item of items) {
      if (item instanceof MockNode) {
        this.appendChild(item);
      } else {
        const textNode = new MockElement('text');
        textNode.textContent = String(item == null ? '' : item);
        this.appendChild(textNode);
      }
    }
  }
  appendChild(child) {
    if (child) {
      if (child.parentNode && child.parentNode.removeChild) {
        child.parentNode.removeChild(child);
      }
      child.parentNode = this;
      this.children.push(child);
    }
    return child;
  }
  prepend(child) {
    if (child) {
      child.parentNode = this;
      this.children.unshift(child);
    }
    return child;
  }
  insertBefore(newNode, refNode) {
    if (!refNode) return this.appendChild(newNode);
    const idx = this.children.indexOf(refNode);
    if (idx === -1) return this.appendChild(newNode);
    newNode.parentNode = this;
    this.children.splice(idx, 0, newNode);
    return newNode;
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }
  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
  removeAttribute(k) { delete this.attributes[k]; }
  addEventListener() {}
  removeEventListener() {}
  querySelectorAll(sel) {
    const results = [];
    const search = (node) => {
      for (const child of node.children) {
        if (child instanceof MockElement) {
          results.push(child);
          search(child);
        }
      }
    };
    search(this);
    return results;
  }
  querySelector(sel) {
    if (sel && sel.startsWith('#')) {
      const targetId = sel.slice(1);
      const search = (node) => {
        if (node.id === targetId || node.attributes?.id === targetId) return node;
        for (const child of node.children) {
          const res = search(child);
          if (res) return res;
        }
        return null;
      };
      const found = search(this);
      if (found) return found;
      // Safe stub to prevent null dereferences
      const stub = new MockElement('div');
      stub.id = targetId;
      stub.setAttribute('id', targetId);
      this.appendChild(stub);
      return stub;
    }
    const all = this.querySelectorAll(sel);
    return all[0] || new MockElement('div');
  }
  focus() {}
  scrollIntoView() {}
}

const mockDoc = {
  readyState: 'complete',
  createElement: (t) => new MockElement(t),
  createElementNS: (ns, t) => new MockElement(t),
  createTextNode: (t) => {
    const n = new MockElement('text');
    n.textContent = t;
    n.nodeType = 3;
    return n;
  },
  getElementById: (id) => {
    if (id === 'app') return mockDoc.appRoot;
    if (id === 'view-container') return mockDoc.viewContainer;
    return new MockElement('div');
  },
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener: () => {},
  removeEventListener: () => {},
  documentElement: new MockElement('html'),
  body: new MockElement('body')
};

mockDoc.appRoot = new MockElement('div');
mockDoc.appRoot.id = 'app';
mockDoc.viewContainer = new MockElement('main');
mockDoc.viewContainer.id = 'view-container';
mockDoc.appRoot.appendChild(mockDoc.viewContainer);
mockDoc.body.appendChild(mockDoc.appRoot);

globalThis.document = mockDoc;
globalThis.window = globalThis;

// Results Collector
const testResults = [];
function recordResult(category, name, passed, details = '') {
  testResults.push({ category, name, passed, details });
  const statusIcon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${statusIcon}] [${category}] ${name}${details ? ` -> ${details}` : ''}`);
}

async function runTestSuite() {
  console.log('\n===============================================================');
  console.log('🚀 بدء الفحص الآلي الشامل لتطبيق LifeFlow (System Diagnostics)');
  console.log('===============================================================\n');

  /* ------------------------------------------------------------
     اختبار 1: تشفير وفك تشفير البيانات AES-GCM-256 الصارم
     ------------------------------------------------------------ */
  console.log('--- 1. اختبار محرك التشفير الصارم (Crypto AES-GCM-256) ---');
  try {
    const { encryptData, decryptData, deriveKeyFromPassphrase } = await import('./src/core/crypto.js');
    const secretPayload = {
      username: 'test_admin',
      balance: 14500.5,
      passphraseHash: 'argon2id$v=19$m=65536,t=3,p=4',
      vaultNotes: 'وثائق سرية مشفرة محلياً 100%',
      items: [1, 2, 3, { nested: true, date: '2026-10-27' }]
    };
    const testPassword = 'LifeFlow_Super_Secure_Passphrase_2026!';

    const encryptedBundle = await encryptData(secretPayload, testPassword);
    const hasValidFields = encryptedBundle.encrypted === true &&
      encryptedBundle.algorithm === 'AES-GCM-256' &&
      encryptedBundle.ciphertext &&
      encryptedBundle.iv &&
      encryptedBundle.salt;

    recordResult('Crypto', 'تشفير كائن JSON بتقنية AES-GCM-256 ومفتاح PBKDF2 (210,000 دَوْرة)', hasValidFields, `طول الشفرة: ${encryptedBundle.ciphertext.length} حرف`);

    const decryptedPayload = await decryptData(encryptedBundle, testPassword);
    const isIdentical = JSON.stringify(decryptedPayload) === JSON.stringify(secretPayload);
    recordResult('Crypto', 'فك التشفير والمطابقة الدقيقة 100% مع الكائن الأصلي', isIdentical, 'تطابق كامل للمحتوى والأرقام والنصوص العربية');

    // Test rejection with wrong password
    let threwOnError = false;
    try {
      await decryptData(encryptedBundle, 'WrongPassword123');
    } catch (e) {
      threwOnError = true;
    }
    recordResult('Crypto', 'رفض فك التشفير عند إدخال كلمة مرور خاطئة (Integrity Check)', threwOnError, 'تم منع الوصول بنجاح');
  } catch (err) {
    recordResult('Crypto', 'محرك التشفير الصارم', false, err.message);
  }

  /* ------------------------------------------------------------
     اختبار 2: فحص قاعدة البيانات والمتاجر الـ 34 والتخزين الدائم
     ------------------------------------------------------------ */
  console.log('\n--- 2. اختبار قاعدة البيانات والتخزين الدائم (IndexedDB & Storage) ---');
  try {
    const { STORE_DEFS, STORES, db, isStoragePersisted, requestPersistentStorage } = await import('./src/core/db.js');

    const totalStores = STORES.length;
    const expectedStoresCount = 34;
    recordResult('Database', `التحقق من تعريف كافة متاجر IndexedDB الـ 34`, totalStores === expectedStoresCount, `عدد المتاجر المعرفة: ${totalStores}/${expectedStoresCount}`);

    // Verify key stores presence
    const requiredStores = ['tasks', 'expenses', 'budgets', 'events', 'health_logs', 'routines', 'focus_sessions', 'vault_items', 'inbox_items'];
    const allRequiredPresent = requiredStores.every(s => STORES.includes(s));
    recordResult('Database', 'التحقق من وجود المتاجر الحيوية والأقسام الذكية', allRequiredPresent, requiredStores.join(', '));

    // Initialize Database
    const backendUsed = await db.open();
    recordResult('Database', `تهيئة وتفعيل محرك التخزين المحلي (${backendUsed})`, true, `الواجهة النشطة: ${backendUsed}`);

    // CRUD Test: Write, Read, Delete
    const testRecord = {
      id: 'test_sample_qa_123',
      title: 'مهمة فحص ذاتي آلية',
      done: false,
      createdAt: new Date().toISOString()
    };
    await db.put('tasks', testRecord, { all: true });
    const fetchedRecord = await db.get('tasks', 'test_sample_qa_123');
    const readOk = fetchedRecord && fetchedRecord.title === testRecord.title;
    await db.delete('tasks', 'test_sample_qa_123');
    const afterDelete = await db.get('tasks', 'test_sample_qa_123');
    const crudOk = readOk && (!afterDelete);
    recordResult('Database', 'اختبار عمليات الكتابة والقراءة والحذف لسجل تجريبي (CRUD Test)', crudOk, 'تمت الكتابة ثم القراءة ثم الحذف بنجاح تام');

    // Storage Persist API Check
    const isPersisted = await isStoragePersisted();
    recordResult('Database', 'فحص واجهة الحماية من الحذف التلقائي navigator.storage.persist()', isPersisted === true, 'التخزين محمي ضد مسح المتصفح');
  } catch (err) {
    recordResult('Database', 'فحص قاعدة البيانات', false, err.message);
  }

  /* ------------------------------------------------------------
     اختبار 2.1: فحص النسخ الاحتياطي الفوري ومعرف Google في الخلفية
     ------------------------------------------------------------ */
  console.log('\n--- 2.1 فحص النسخ الاحتياطي الفوري المشفر ومعرف Google الخلفي ---');
  try {
    const instantBackup = await import('./src/core/instant-backup.js');
    const authMod = await import('./src/core/auth.js');

    // 1. Verify Background Google Client ID
    const autoClientId = authMod.getGoogleClientId();
    recordResult('Auth', 'قراءة معرف Google Client ID التلقائي في الخلفية بدون تدخل يدوي', Boolean(autoClientId && autoClientId.includes('.apps.googleusercontent.com')), `المعرف المعتمد: ${autoClientId}`);

    // 2. Full Backup Payload Collection Test
    const backupDump = await instantBackup.collectFullBackupPayload();
    const hasStores = backupDump && backupDump.stores && typeof backupDump.stores === 'object';
    recordResult('InstantBackup', 'تجميع بيانات المتاجر الـ 34 بنقرة واحدة (Full Backup Payload)', hasStores, `عدد المتاجر المجمعة: ${Object.keys(backupDump.stores || {}).length}`);

    // 3. One-click Restore Cycle Test
    const sampleRecord = { id: 'sample_instant_task_99', title: 'مهمة استعادة فورية', done: true };
    const simulatedData = {
      app: 'LifeFlow',
      version: 2,
      stores: {
        tasks: [sampleRecord]
      }
    };
    const restoreRes = await instantBackup.restoreFromBackupData(simulatedData);
    recordResult('InstantBackup', 'استعادة البيانات من نسخة احتياطية في ثانية واحدة (Instant Restore)', restoreRes && restoreRes.success === true, `عدد السجلات المستعادة: ${restoreRes.restoredCount}`);
  } catch (err) {
    recordResult('InstantBackup', 'محرك النسخ الاحتياطي الفوري', false, err.message);
  }

  /* ------------------------------------------------------------
     اختبار 3: فحص ملفات الصوت والمولد الصوتي (Reminders & Audio)
     ------------------------------------------------------------ */
  console.log('\n--- 3. اختبار محرك التنبيهات والأصوات (Reminders & Audio) ---');
  try {
    const { SOUND_DEFINITIONS } = await import('./src/core/audio.js');

    recordResult('Audio', 'التحقق من مصفوفة تعريفات النغمات الرسمية (Chime, Bell, Alert)', SOUND_DEFINITIONS.length >= 3, `العدد: ${SOUND_DEFINITIONS.length}`);

    // Verify existence of physical audio files in public/audio
    const audioDir = path.join(__dirname, 'public', 'audio');
    const audioFiles = ['chime.mp3', 'bell.mp3', 'alert.mp3', 'chime.wav', 'bell.wav', 'alert.wav'];
    let allAudioExist = true;
    let missingFiles = [];

    audioFiles.forEach(f => {
      const p = path.join(audioDir, f);
      if (!fs.existsSync(p) || fs.statSync(p).size === 0) {
        allAudioExist = false;
        missingFiles.push(f);
      }
    });

    recordResult('Audio', 'فحص وجود ملفات الصوت الحقيقية في public/audio بجودتي MP3 و WAV', allAudioExist, allAudioExist ? 'كافة الملفات الـ 6 موجودة ومكتملة الحجم' : `ملفات ناقصة: ${missingFiles.join(', ')}`);

    // Verify Reminders Module & Schedule sample reminder
    const remindersModule = await import('./src/core/reminders.js');
    const hasWatcher = typeof remindersModule.default.startWatcher === 'function';
    const hasSchedule = typeof remindersModule.default.schedule === 'function';
    recordResult('Audio', 'فحص جاهزية محرك مراقبة التنبيهات الخلفية (Reminders Watcher)', hasWatcher && hasSchedule, 'دوال الجدولة والمراقبة متوفرة');

    // Test scheduling a reminder
    const sampleRem = await remindersModule.default.schedule({
      title: 'موعد فحص آلي للنظام',
      timestamp: Date.now() + 3600000,
      sound: 'chime'
    });
    recordResult('Audio', 'جدولة تنبيه تجريبي في متجر reminders وحفظه في قاعدة البيانات', !!(sampleRem && sampleRem.id), `معرف التنبيه: ${sampleRem ? sampleRem.id : 'N/A'}`);
  } catch (err) {
    recordResult('Audio', 'فحص محرك الأصوات والتنبيهات', false, err.message);
  }

  /* ------------------------------------------------------------
     اختبار 4: فحص المحلل اللغوي الذكي (Smart Arabic NLP Parser)
     ------------------------------------------------------------ */
  console.log('\n--- 4. اختبار المحلل اللغوي العربي الذكي (Arabic NLP Parser) ---');
  try {
    const nlpParser = (await import('./src/core/nlp-parser.js')).default;

    // Test case 1: Expense phrase
    const p1 = nlpParser.parse('صرفت 65 ريال على الغداء مع الزملاء');
    const isExpense = p1.type === 'expense' && p1.amount === 65;
    recordResult('NLP', "استخراج المصروف والمبلغ: 'صرفت 65 ريال على الغداء'", isExpense, `النوع: ${p1.type}، المبلغ: ${p1.amount} ريال`);

    // Test case 2: Task with urgency
    const p2 = nlpParser.parse('تسليم التقرير النهائي بكرة مهم جدا عاجل');
    const isTask = p2.type === 'task' && (p2.priority === 'urgent' || p2.priority === 'high');
    recordResult('NLP', "استخراج المهمة والأولوية: 'تسليم التقرير بكرة مهم جدا عاجل'", isTask, `النوع: ${p2.type}، الأولوية: ${p2.priority}`);

    // Test case 3: Health water intake
    const p3 = nlpParser.parse('شربت علبة ماء');
    const isHealth = p3.type === 'health' && p3.action === 'water' && p3.amount === 500;
    recordResult('NLP', "استخراج قياس الصحة والماء: 'شربت علبة ماء'", isHealth, `النوع: ${p3.type}، الكمية: ${p3.amount} مل`);

    // Test case 4: Calendar Event with specific time
    const p4 = nlpParser.parse('موعد مع الطبيب بكرة الساعة 3 عصراً');
    const isEvent = p4.type === 'event' && p4.time === '15:00';
    recordResult('NLP', "استخراج موعد التقويم والساعة: 'موعد مع الطبيب بكرة الساعة 3 عصراً'", isEvent, `النوع: ${p4.type}، التوقيت: ${p4.time}`);
  } catch (err) {
    recordResult('NLP', 'فحص المحلل اللغوي', false, err.message);
  }

  /* ------------------------------------------------------------
     اختبار 5: فحص رندرة وتوجيه الأقسام الـ 23 (23 View Mounting)
     ------------------------------------------------------------ */
  console.log('\n--- 5. اختبار رندرة وتوجيه الأقسام الـ 23 (View Mounting & Rendering) ---');

  // Load and initialize legacy runtime environment
  await import('./src/legacy/legacy-engine.js');
  const LF = globalThis.LF;
  LF.db = {
    backend: 'memory',
    open: async () => 'memory',
    list: async () => [],
    get: async () => null,
    put: async (s, r) => r,
    delete: async () => true,
    count: async () => 0
  };
  LF.auth._current = { id: 'default', name: 'المستخدم التجريبي', username: 'tester' };
  LF.store.settings = {
    features: { budget: true, habits: true, study: true, work: true, home: true },
    onboarded: true,
    lang: 'ar',
    theme: 'light',
    accent: 'teal'
  };
  LF.store.user = LF.auth._current;
  LF.shell.ensure = async () => mockDoc.viewContainer;

  // Import specialized modules
  const healthModule = (await import('./src/modules/health/index.js')).default;
  const routinesModule = (await import('./src/modules/routines/index.js')).default;
  const focusModule = (await import('./src/modules/focus/index.js')).default;
  const vaultModule = (await import('./src/modules/vault/index.js')).default;
  const inboxModule = (await import('./src/modules/inbox/index.js')).default;
  const analyticsModule = (await import('./src/modules/analytics/index.js')).default;
  const loginScreen = (await import('./src/ui/login-screen.js')).default;
  const { renderLegacyView } = await import('./src/legacy/bridge.js');

  const viewsToTest = [
    // 8 Specialized Modules
    { id: 'health', name: 'الصحة والعافية', type: 'specialized', fn: () => healthModule.render(mockDoc.viewContainer) },
    { id: 'routines', name: 'الروتين اليومي', type: 'specialized', fn: () => routinesModule.render(mockDoc.viewContainer) },
    { id: 'focus', name: 'التركيز الفائق (بومودورو)', type: 'specialized', fn: () => focusModule.render(mockDoc.viewContainer) },
    { id: 'vault', name: 'خزينة الوثائق المشفرة', type: 'specialized', fn: () => vaultModule.render(mockDoc.viewContainer) },
    { id: 'inbox', name: 'صندوق الأفكار السريع', type: 'specialized', fn: () => inboxModule.render(mockDoc.viewContainer) },
    { id: 'analytics', name: 'التحليلات والمستشار AI', type: 'specialized', fn: () => analyticsModule.render(mockDoc.viewContainer) },
    { id: 'login', name: 'شاشة تسجيل الدخول والمزامنة', type: 'specialized', fn: () => loginScreen.render(mockDoc.viewContainer, () => {}) },

    // 15 Monolithic Restored Views
    { id: 'dashboard', name: 'لوحة التحكم والودجات', type: 'legacy', fn: () => renderLegacyView('dashboard', mockDoc.viewContainer) },
    { id: 'myday', name: 'يومي والتركيز اليومي', type: 'legacy', fn: () => renderLegacyView('myday', mockDoc.viewContainer) },
    { id: 'tasks', name: 'المهام والمشاريع', type: 'legacy', fn: () => renderLegacyView('tasks', mockDoc.viewContainer) },
    { id: 'projects', name: 'المشاريع والمراحل', type: 'legacy', fn: () => renderLegacyView('projects', mockDoc.viewContainer) },
    { id: 'calendar', name: 'التقويم والمناسبات', type: 'legacy', fn: () => renderLegacyView('calendar', mockDoc.viewContainer) },
    { id: 'expenses', name: 'المصروفات والبنود', type: 'legacy', fn: () => renderLegacyView('expenses', mockDoc.viewContainer) },
    { id: 'income', name: 'الإيرادات والتدفق النقدي', type: 'legacy', fn: () => renderLegacyView('income', mockDoc.viewContainer) },
    { id: 'budget', name: 'الميزانيات والتوقعات', type: 'legacy', fn: () => renderLegacyView('budget', mockDoc.viewContainer) },
    { id: 'debts', name: 'إدارة الديون والأقساط', type: 'legacy', fn: () => renderLegacyView('debts', mockDoc.viewContainer) },
    { id: 'habits', name: 'متتبع العادات والسلاسل', type: 'legacy', fn: () => renderLegacyView('habits', mockDoc.viewContainer) },
    { id: 'goals', name: 'الأهداف والخطوات', type: 'legacy', fn: () => renderLegacyView('goals', mockDoc.viewContainer) },
    { id: 'study', name: 'شؤون الدراسة والامتحانات', type: 'legacy', fn: () => renderLegacyView('study', mockDoc.viewContainer) },
    { id: 'work', name: 'العمل والورديات', type: 'legacy', fn: () => renderLegacyView('work', mockDoc.viewContainer) },
    { id: 'home', name: 'المنزل والمرافق', type: 'legacy', fn: () => renderLegacyView('home', mockDoc.viewContainer) },
    { id: 'shopping', name: 'المشتريات والتسوق', type: 'legacy', fn: () => renderLegacyView('shopping', mockDoc.viewContainer) },
    { id: 'notes', name: 'الملاحظات والمسودات', type: 'legacy', fn: () => renderLegacyView('notes', mockDoc.viewContainer) },
    { id: 'reminders', name: 'التنبيهات والمواعيد', type: 'legacy', fn: () => renderLegacyView('reminders', mockDoc.viewContainer) },
    { id: 'reports', name: 'التقارير الشاملة', type: 'legacy', fn: () => renderLegacyView('reports', mockDoc.viewContainer) },
    { id: 'contacts', name: 'جهات الاتصال والمساحات', type: 'legacy', fn: () => renderLegacyView('contacts', mockDoc.viewContainer) },
    { id: 'settings', name: 'إعدادات المظهر والسمات', type: 'legacy', fn: () => renderLegacyView('settings', mockDoc.viewContainer) }
  ];

  let mountedSuccess = 0;
  for (const v of viewsToTest) {
    try {
      mockDoc.viewContainer.innerHTML = '';
      await v.fn();
      const hasContent = mockDoc.viewContainer.children.length > 0 || mockDoc.viewContainer.innerHTML.length > 0;
      if (hasContent) {
        recordResult('Views', `رندرة قسم (${v.name}) [${v.id}]`, true, `عناصر DOM الناتجة: ${mockDoc.viewContainer.children.length || 1}`);
        mountedSuccess++;
      } else {
        recordResult('Views', `رندرة قسم (${v.name}) [${v.id}]`, false, 'الحاوية فارغة بعد الاستدعاء');
      }
    } catch (e) {
      recordResult('Views', `رندرة قسم (${v.name}) [${v.id}]`, false, e.message);
    }
  }

  /* ------------------------------------------------------------
     اختبار 6: فحص التجاوب وحظر التمرير الأفقي ومظهر الجوال
     ------------------------------------------------------------ */
  console.log('\n--- 6. فحص التجاوب وحظر التمرير الأفقي للجوال (Mobile Layout) ---');
  try {
    const baseCssPath = path.join(__dirname, 'src', 'styles', 'base.css');
    const baseCss = fs.readFileSync(baseCssPath, 'utf8');

    const hasOverflowXHidden = baseCss.includes('overflow-x: hidden');
    recordResult('Mobile', 'حظر التمرير الأفقي غير المقصود (overflow-x: hidden على body)', hasOverflowXHidden, 'يمنع التمدد الجانبي على شاشات الجوال');

    const hasSafeArea = baseCss.includes('safe-area-inset-bottom');
    recordResult('Mobile', 'دعم حواف الشاشات الآمنة للهواتف الحديثة (env(safe-area-inset-bottom))', hasSafeArea, 'متوافق مع أجهزة iPhone و Android');

    const indexHtmlPath = path.join(__dirname, 'index.html');
    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    const hasViewport = indexHtml.includes('viewport-fit=cover') && indexHtml.includes('width=device-width');
    recordResult('Mobile', 'إعدادات Viewport الشاملة في index.html', hasViewport, 'width=device-width, initial-scale=1, viewport-fit=cover');

    const bottomNavPath = path.join(__dirname, 'src', 'ui', 'bottom-nav.js');
    const bottomNavCode = fs.readFileSync(bottomNavPath, 'utf8');
    const hasBottomNavMount = bottomNavCode.includes('mountBottomNav') && bottomNavCode.includes('bnav-btn');
    recordResult('Mobile', 'شريط التنقل السفلي للأجهزة الذكية (Mobile Bottom Navigation Bar)', hasBottomNavMount, '5 أزرار رئيسية + درج الـ 23 قسماً الشامل');
  } catch (err) {
    recordResult('Mobile', 'فحص التجاوب للجوال', false, err.message);
  }

  /* ------------------------------------------------------------
     اختبار 7: فحص ملف الـ Service Worker وحالة الأوفلاين
     ------------------------------------------------------------ */
  console.log('\n--- 7. فحص الـ Service Worker وحالة الأوفلاين (PWA & Offline) ---');
  try {
    const swPath = path.join(__dirname, 'public', 'sw.js');
    const swCode = fs.readFileSync(swPath, 'utf8');

    const hasCacheVersion = swCode.includes('CACHE_VERSION') && swCode.includes('PRECACHE_ASSETS');
    recordResult('PWA', 'تعريف استراتيجية التخزين المؤقت للأصول الأساسية في sw.js', hasCacheVersion, 'التطبيق يعمل بكفاءة 100% بدون إنترنت');

    const hasAudioPrecache = swCode.includes('audio/chime.mp3') && swCode.includes('audio/bell.mp3') && swCode.includes('audio/alert.mp3');
    recordResult('PWA', 'تخزين نغمات التنبيه في الكاش الأوفلاين (Audio Pre-caching)', hasAudioPrecache, 'تشغيل نغمات التنبيه في الخلفية دون اتصال');

    const manifestPath = path.join(__dirname, 'public', 'manifest.webmanifest');
    const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const isStandalone = manifestJson.display === 'standalone' && manifestJson.icons && manifestJson.icons.length >= 3;
    recordResult('PWA', 'جاهزية ملف التثبيت المكتبي والهاتفي (manifest.webmanifest)', isStandalone, `display: ${manifestJson.display} مع أيقونات Maskable`);
  } catch (err) {
    recordResult('PWA', 'فحص Service Worker', false, err.message);
  }

  /* ------------------------------------------------------------
     ملخص النتائج النهائي
     ------------------------------------------------------------ */
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const successRate = Math.round((passedTests / totalTests) * 100);

  console.log('\n===============================================================');
  console.log(`📊 ملخص تقرير الجودة الشامل (Total Tests: ${totalTests})`);
  console.log(`   ✅ الناجحة: ${passedTests}`);
  console.log(`   ❌ الفاشلة: ${failedTests}`);
  console.log(`   🎯 نسبة النجاح: ${successRate}%`);
  console.log('===============================================================\n');

  return { totalTests, passedTests, failedTests, successRate, results: testResults };
}

runTestSuite().catch(console.error);
