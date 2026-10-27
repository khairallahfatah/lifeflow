/* ============================================================
   LifeFlow — Background Reminders Engine
   Centralized notification scheduler with audio & SW integration
   ============================================================ */

import { db } from './db.js';
import { playSound } from './audio.js';
import { toast } from '../ui/toast.js';

let checkIntervalId = null;
const listeners = new Set();

/**
 * Check the current permission status for system notifications
 */
export function getNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission; // 'granted' | 'denied' | 'default'
}

/**
 * Show a sleek explanation modal before requesting Notification permission
 */
export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') {
    toast.warn('المتصفح الحالي لا يدعم التنبيهات النظامية.');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    toast.ok('إذن التنبيهات مفعّل مسبقاً.');
    return 'granted';
  }

  return new Promise((resolve) => {
    // Check if modal already exists
    const existing = document.getElementById('lf-notif-perm-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'lf-notif-perm-modal';
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML = `
      <div class="modal-content" dir="rtl">
        <div class="modal-header">
          <div class="row" style="gap:10px;">
            <div class="logo-badge" style="width:34px;height:34px;border-radius:8px;background:var(--accent-soft);color:var(--accent);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </div>
            <div>
              <h3 style="font-size:var(--fs-m);font-weight:700;">تفعيل التنبيهات الذكية والنغمات</h3>
              <div class="muted" style="font-size:var(--fs-xs);">لتذكيرك بمواعيدك المهمة حتى والتطبيق مغلق</div>
            </div>
          </div>
          <button class="btn ghost sm" id="lf-notif-close-btn" style="padding:4px 8px;border-radius:50%;">✕</button>
        </div>

        <div class="modal-body">
          <p class="muted" style="font-size:var(--fs-s);">
            يقوم نظام <strong>LifeFlow</strong> بإرسال تنبيهات خفيفة في المواعيد المحددة بدقة لمساعدتك في:
          </p>
          <div class="col" style="gap:8px;">
            <div class="row" style="font-size:var(--fs-s);">
              <span style="color:var(--ok);">✔️</span>
              <span>تذكيرك بالمهام اليومية والمواعيد الحرجة في وقتها.</span>
            </div>
            <div class="row" style="font-size:var(--fs-s);">
              <span style="color:var(--ok);">✔️</span>
              <span>تنبيهات استحقاق الديون والأقساط المالية.</span>
            </div>
            <div class="row" style="font-size:var(--fs-s);">
              <span style="color:var(--ok);">✔️</span>
              <span>العد التنازلي للامتحانات الجامعية والمحاضرات الدراسية.</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn ghost sm" id="lf-notif-cancel-btn">لاحقاً</button>
          <button class="btn primary sm" id="lf-notif-allow-btn">السماح بالتنبيهات الآن</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cleanup = () => overlay.remove();

    overlay.querySelector('#lf-notif-close-btn').addEventListener('click', () => {
      cleanup();
      resolve(Notification.permission);
    });

    overlay.querySelector('#lf-notif-cancel-btn').addEventListener('click', () => {
      cleanup();
      resolve(Notification.permission);
    });

    overlay.querySelector('#lf-notif-allow-btn').addEventListener('click', async () => {
      cleanup();
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          toast.ok('تم تفعيل التنبيهات بنجاح!');
        } else if (perm === 'denied') {
          toast.warn('تم رفض إذن التنبيهات. يمكنك تغييره من إعدادات المتصفح.');
        }
        resolve(perm);
      } catch (e) {
        resolve(Notification.permission);
      }
    });
  });
}

/**
 * Schedule a new reminder into IndexedDB
 * @param {Object} params - { id, title, body, timestamp, sound, module, data }
 */
export async function scheduleReminder({
  id = null,
  title,
  body = '',
  timestamp, // epoch ms or ISO string
  sound = 'chime',
  module = 'general',
  data = {}
}) {
  const reminderId = id || 'rem-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const targetTime = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();

  const record = {
    id: reminderId,
    title,
    body,
    timestamp: targetTime,
    sound,
    module,
    data,
    status: 'pending',
    date: new Date(targetTime).toISOString().slice(0, 10),
    time: new Date(targetTime).toTimeString().slice(0, 5),
    createdAt: new Date().toISOString()
  };

  await db.put('reminders', record, { all: true });

  // Post message to Service Worker if active
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_REMINDER',
      reminder: record
    });
  }

  notifyListeners();
  return record;
}

/**
 * Cancel an existing reminder
 */
export async function cancelReminder(reminderId) {
  const rec = await db.get('reminders', reminderId);
  if (rec) {
    rec.status = 'cancelled';
    rec.cancelledAt = new Date().toISOString();
    await db.put('reminders', rec, { all: true });
    notifyListeners();
    return true;
  }
  return false;
}

/**
 * Snooze a reminder for N minutes (default 10 min)
 */
export async function snoozeReminder(reminderId, minutes = 10) {
  const rec = await db.get('reminders', reminderId);
  if (rec) {
    const newTimestamp = Date.now() + minutes * 60 * 1000;
    rec.timestamp = newTimestamp;
    rec.status = 'pending';
    rec.date = new Date(newTimestamp).toISOString().slice(0, 10);
    rec.time = new Date(newTimestamp).toTimeString().slice(0, 5);
    rec.snoozedCount = (rec.snoozedCount || 0) + 1;
    await db.put('reminders', rec, { all: true });

    toast.info(`تم تأجيل التنبيه لمدة ${minutes} دقائق.`);
    notifyListeners();
    return rec;
  }
  return null;
}

/**
 * Retrieve all pending reminders sorted by trigger time
 */
export async function getPendingReminders() {
  try {
    const list = await db.list('reminders', {
      all: true,
      predicate: (r) => r.status === 'pending'
    });
    return list.sort((a, b) => a.timestamp - b.timestamp);
  } catch (err) {
    console.warn('[LifeFlow Reminders] List failed:', err);
    return [];
  }
}

/**
 * Fire an immediate notification with sound & vibration
 */
export async function fireNotification(reminder) {
  const { title, body, sound, module, data, id } = reminder;

  // 1. Play Sound in application
  playSound(sound || 'chime');

  // 2. Trigger System Notification via Service Worker or Native Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    const soundPath = `/audio/${sound || 'chime'}.mp3`;
    const notificationOptions = {
      body: body || 'لديك تنبيه في تطبيق LifeFlow',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200, 100, 200],
      sound: soundPath,
      data: {
        reminderId: id,
        module: module || 'general',
        url: `/#view=${module || 'dashboard'}`,
        ...data
      },
      actions: [
        { action: 'done', title: 'تم الإنجاز ✔️' },
        { action: 'snooze', title: 'تأجيل 10 دقائق ⏱️' }
      ]
    };

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, notificationOptions);
          return;
        }
      }
      new Notification(title, notificationOptions);
    } catch (err) {
      console.warn('[LifeFlow Reminders] System notification failed:', err);
      toast.info(`🔔 ${title}: ${body}`);
    }
  } else {
    // In-app Toast fallback
    toast.info(`🔔 ${title}: ${body}`);
  }
}

/**
 * Check due reminders periodically
 */
export async function checkDueReminders() {
  const now = Date.now();
  const pending = await getPendingReminders();

  for (const rem of pending) {
    if (rem.timestamp <= now) {
      rem.status = 'triggered';
      rem.triggeredAt = new Date().toISOString();
      await db.put('reminders', rem, { all: true });

      await fireNotification(rem);
      notifyListeners();
    }
  }
}

/**
 * Start the reminder monitoring loop (runs every 10 seconds in foreground)
 */
export function startReminderWatcher() {
  if (checkIntervalId) clearInterval(checkIntervalId);
  checkIntervalId = setInterval(checkDueReminders, 10000);
  checkDueReminders();
}

/**
 * Register listener for reminder updates
 */
export function onRemindersChanged(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners() {
  listeners.forEach((cb) => {
    try { cb(); } catch (e) { console.error(e); }
  });
}

export default {
  schedule: scheduleReminder,
  cancel: cancelReminder,
  snooze: snoozeReminder,
  getPending: getPendingReminders,
  requestPermission: requestNotificationPermission,
  getPermission: getNotificationPermission,
  startWatcher: startReminderWatcher,
  fire: fireNotification,
  onChange: onRemindersChanged
};
