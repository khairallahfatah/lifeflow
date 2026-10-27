/* ============================================================
   LifeFlow — Sync Indicator & Notification Bell UI Widget
   Google Drive Status, Cloud Controls & Audio Ringtone Center
   ============================================================ */

import auth from '../core/auth.js';
import driveSync from '../core/drive-sync.js';
import reminders from '../core/reminders.js';
import audio from '../core/audio.js';
import instantBackup from '../core/instant-backup.js';
import { toast } from './toast.js';

let containerEl = null;

/**
 * Open the Google Drive Cloud Sync & Instant Backup modal
 */
export function openSyncModal() {
  const existing = document.getElementById('lf-sync-modal');
  if (existing) existing.remove();

  const user = auth.getUser();
  const signedIn = auth.isSignedIn();
  const lastSync = driveSync.getLastSyncAt();
  const formattedDate = lastSync ? new Date(lastSync).toLocaleString('ar-EG') : 'لم تتم المزامنة بعد';

  const overlay = document.createElement('div');
  overlay.id = 'lf-sync-modal';
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  overlay.innerHTML = `
    <div class="modal-content" dir="rtl" style="max-width:480px;border-radius:var(--radius-l);box-shadow:var(--shadow-xl);">
      <div class="modal-header" style="padding-bottom:12px;border-bottom:1px solid var(--border);">
        <div class="row" style="gap:12px;align-items:center;">
          <div class="logo-badge" style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg, #4285F4, #34A853);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(66,133,244,0.25);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>
          </div>
          <div>
            <h3 style="font-size:var(--fs-m);font-weight:700;margin:0;">المزامنة والنسخ الاحتياطي (Cloud & Offline)</h3>
            <div class="muted" style="font-size:var(--fs-xs);margin-top:2px;">حفظ وتشفير آمن بتقنية AES-GCM-256</div>
          </div>
        </div>
        <button class="btn ghost sm" id="lf-sync-modal-close" style="padding:4px 8px;border-radius:50%;font-size:16px;">✕</button>
      </div>

      <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;padding-top:14px;">
        
        <!-- Section 1: Google Cloud Sync Card -->
        <div class="card" style="padding:16px;background:var(--surface-2);border-radius:var(--radius-m);border:1px solid var(--border);">
          ${signedIn && user ? `
            <div class="row between" style="align-items:center;">
              <div class="row" style="gap:12px;align-items:center;">
                ${user.picture ? `<img src="${user.picture}" style="width:44px;height:44px;border-radius:50%;border:2px solid var(--accent);box-shadow:0 2px 8px rgba(0,0,0,0.1);" alt="avatar" />` : `<div class="logo-badge" style="width:44px;height:44px;border-radius:50%;font-size:18px;">${user.name ? user.name[0] : 'G'}</div>`}
                <div>
                  <div class="row" style="gap:8px;align-items:center;">
                    <span class="strong" style="font-size:var(--fs-m);">${user.name || 'حساب Google'}</span>
                    <span class="badge ok" style="font-size:11px;padding:2px 8px;">🟢 متزامن سحابياً</span>
                  </div>
                  <div class="muted" style="font-size:var(--fs-xs);">${user.email}</div>
                </div>
              </div>
              <button class="btn ghost sm" id="btn-google-signout" style="color:var(--danger);font-size:var(--fs-xs);">خروج</button>
            </div>
            
            <div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--border);font-size:var(--fs-xs);color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;">
              <span>🕒 آخر نسخة احتياطية سحابية:</span>
              <strong style="color:var(--text);">${formattedDate}</strong>
            </div>

            <!-- Manual Cloud Actions -->
            <div class="row" style="gap:10px;margin-top:12px;">
              <button class="btn primary sm grow" id="btn-modal-sync-now" style="gap:6px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                مزامنة ورفع الآن
              </button>
              <button class="btn ghost sm grow" id="btn-modal-restore-now" style="gap:6px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                استعادة من السحابة
              </button>
            </div>
          ` : `
            <div class="col" style="gap:12px;">
              <div class="row between" style="align-items:center;">
                <div class="strong" style="font-size:var(--fs-s);color:var(--text);">المزامنة السحابية بحساب Google:</div>
                <span class="badge warn" style="font-size:11px;padding:2px 8px;">غير متصل</span>
              </div>
              
              <p class="muted" style="font-size:var(--fs-xs);margin:0;line-height:1.5;">
                اربط حسابك لحفظ نسخ مشفرة تلقائياً في مساحتك الخاصة على Google Drive (appDataFolder) مجاناً وبدون أي وسيط خارجي.
              </p>

              <div style="font-size:var(--fs-xs);color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;padding:6px 0;">
                <span>🕒 آخر نسخة احتياطية:</span>
                <span class="muted">${formattedDate}</span>
              </div>

              <!-- Big Commercial Google Sign-In Button -->
              <button class="btn" id="btn-google-signin" style="width:100%;padding:12px 16px;background:#4285F4;color:#ffffff;border:none;border-radius:var(--radius-m);font-weight:700;font-size:var(--fs-s);box-shadow:0 4px 12px rgba(66,133,244,0.3);display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;transition:transform 0.15s ease, box-shadow 0.15s ease;">
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#ffffff" d="M12.24 10.285V13.4h6.887C18.2 16.14 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.485 0 2.85.555 3.9 1.455l2.4-2.4C16.89 3.48 14.67 2.6 12.24 2.6 7.05 2.6 2.85 6.8 2.85 12s4.2 9.4 9.39 9.4c5.43 0 9.06-3.825 9.06-9.225 0-.615-.06-1.2-.18-1.74h-8.88z"/></svg>
                <span>تسجيل الدخول وحفظ البيانات بحساب Google</span>
              </button>
            </div>
          `}
        </div>

        <!-- Section 2: Instant Offline Backup & Restore Card -->
        <div class="card" style="padding:16px;background:var(--surface-2);border-radius:var(--radius-m);border:1px solid var(--border);">
          <div class="col" style="gap:10px;">
            <div class="row between" style="align-items:center;">
              <div class="strong" style="font-size:var(--fs-s);color:var(--text);">النسخ الاحتياطي الفوري (بدون حساب):</div>
              <span class="badge" style="background:var(--accent-soft);color:var(--accent);font-size:11px;padding:2px 8px;font-weight:600;">🔒 مشفر محلياً</span>
            </div>
            
            <p class="muted" style="font-size:var(--fs-xs);margin:0;line-height:1.5;">
              تصدير أو استعادة ملف مشفر بالكامل بضغطة زر واحدة لحفظ بياناتك محلياً على جهازك دون إنترنت.
            </p>

            <div class="col" style="gap:8px;margin-top:4px;">
              <button class="btn secondary sm" id="btn-instant-export" style="width:100%;padding:10px 14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;background:var(--surface);border:1px solid var(--border);cursor:pointer;">
                <span style="font-size:16px;">📥</span>
                <span>تصدير نسخة احتياطية مشفرة فوراً (ملف آمن)</span>
              </button>

              <button class="btn ghost sm" id="btn-instant-restore" style="width:100%;padding:10px 14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;border:1px dashed var(--border);cursor:pointer;">
                <span style="font-size:16px;">📤</span>
                <span>استعادة نسخة من ملف</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Security & Privacy Guarantee Footer -->
        <div class="row between" style="padding:4px 6px;font-size:11px;color:var(--text-muted);align-items:center;">
          <div class="row" style="gap:6px;align-items:center;">
            <span>🛡️</span>
            <span>تشفير AES-GCM-256 العسكري الصارم</span>
          </div>
          <div class="row" style="gap:6px;align-items:center;">
            <span>🔒</span>
            <span>خصوصية 100% بدون أي وسيط</span>
          </div>
        </div>

      </div>

      <div class="modal-footer" style="padding-top:12px;border-top:1px solid var(--border);">
        <button class="btn ghost sm" id="lf-sync-footer-close" style="width:100%;">إغلاق النافذة</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const cleanup = () => overlay.remove();
  overlay.querySelector('#lf-sync-modal-close').addEventListener('click', cleanup);
  overlay.querySelector('#lf-sync-footer-close').addEventListener('click', cleanup);

  // Sign In / Out
  const signInBtn = overlay.querySelector('#btn-google-signin');
  if (signInBtn) {
    signInBtn.addEventListener('click', async () => {
      try {
        toast.info('جارٍ الاتصال بحساب Google...');
        await auth.signIn();
        toast.ok('تم تسجيل الدخول بحساب Google بنجاح!');
        cleanup();
        openSyncModal();
      } catch (err) {
        toast.error('فشل تسجيل الدخول: ' + err.message);
      }
    });
  }

  const signOutBtn = overlay.querySelector('#btn-google-signout');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      auth.signOut();
      toast.info('تم إلغاء ربط حساب Google.');
      cleanup();
    });
  }

  // Instant Offline Export & Restore Handlers
  const exportBtn = overlay.querySelector('#btn-instant-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      exportBtn.disabled = true;
      try {
        await instantBackup.exportInstantEncryptedBackup();
      } finally {
        exportBtn.disabled = false;
      }
    });
  }

  const restoreBtn = overlay.querySelector('#btn-instant-restore');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', async () => {
      cleanup();
      await instantBackup.promptAndRestoreFile();
    });
  }

  // Manual Cloud Sync & Restore
  const syncBtn = overlay.querySelector('#btn-modal-sync-now');
  if (syncBtn) {
    syncBtn.addEventListener('click', async () => {
      syncBtn.disabled = true;
      toast.info('جارٍ المزامنة السحابية...');
      const ok = await driveSync.sync();
      syncBtn.disabled = false;
      if (ok) {
        toast.ok('اكتملت المزامنة وحفظ النسخة المشفرة في Google Drive.');
        cleanup();
      } else {
        toast.error('تعذرت المزامنة السحابية. تحقق من الاتصال بالإنترنت.');
      }
    });
  }

  const restoreCloudBtn = overlay.querySelector('#btn-modal-restore-now');
  if (restoreCloudBtn) {
    restoreCloudBtn.addEventListener('click', async () => {
      restoreCloudBtn.disabled = true;
      toast.info('جارٍ فحص واستعادة النسخة السحابية...');
      const ok = await driveSync.autoRestore();
      restoreCloudBtn.disabled = false;
      if (ok) {
        toast.ok('تمت استعادة كافة البيانات السحابية بنجاح!');
        cleanup();
      } else {
        toast.warn('لم يتم العثور على نسخة أحدث في السحابة.');
      }
    });
  }
}

/**
 * Open the Audio & Background Reminders testing center modal
 */
export function openAudioCenterModal() {
  const existing = document.getElementById('lf-audio-modal');
  if (existing) existing.remove();

  const perm = reminders.getPermission();
  const sounds = audio.list();

  const overlay = document.createElement('div');
  overlay.id = 'lf-audio-modal';
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  overlay.innerHTML = `
    <div class="modal-content" dir="rtl" style="max-width:480px;">
      <div class="modal-header">
        <div class="row" style="gap:10px;">
          <div class="logo-badge" style="width:34px;height:34px;border-radius:8px;background:var(--warn-soft);color:var(--warn);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </div>
          <div>
            <h3 style="font-size:var(--fs-m);font-weight:700;">مركز التنبيهات والنغمات الصوتية</h3>
            <div class="muted" style="font-size:var(--fs-xs);">إدارة الإشعارات وتجربة أصوات التنبيه</div>
          </div>
        </div>
        <button class="btn ghost sm" id="lf-audio-modal-close" style="padding:4px 8px;border-radius:50%;">✕</button>
      </div>

      <div class="modal-body">
        <!-- Permission Status Box -->
        <div class="row between" style="padding:12px;background:var(--surface-2);border-radius:var(--radius-m);">
          <div>
            <div class="strong" style="font-size:var(--fs-s);">إذن إشعارات النظام:</div>
            <div class="muted" style="font-size:var(--fs-xs);">مطلوب لإرسال التنبيهات مع اهتزاز ونغمات</div>
          </div>
          <div>
            <span class="badge ${perm === 'granted' ? 'ok' : perm === 'denied' ? 'danger' : 'warn'}">
              ${perm === 'granted' ? 'مفعّل ✔️' : perm === 'denied' ? 'مرفوض ✕' : 'يتطلب إذن'}
            </span>
          </div>
        </div>

        ${perm !== 'granted' ? `
          <button class="btn primary sm" id="btn-request-notif-perm" style="width:100%;">
            تفعيل إذن إشعارات النظام الآن
          </button>
        ` : ''}

        <!-- Sound Testing Gallery -->
        <div class="col" style="gap:8px;margin-top:6px;">
          <label class="strong" style="font-size:var(--fs-s);">تجربة واختيار نغمات التنبيه المتاحة:</label>
          <div class="col" style="gap:8px;">
            ${sounds.map(s => `
              <div class="row between" style="padding:10px 14px;background:var(--surface-2);border-radius:var(--radius-s);border:1px solid var(--border);">
                <div class="row" style="gap:10px;">
                  <span style="font-size:18px;">🎵</span>
                  <span class="strong small">${s.nameAr}</span>
                </div>
                <button class="btn ghost sm btn-play-sound" data-sound="${s.id}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  تشغيل
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Background Notification Test Controls -->
        <div class="col" style="gap:8px;margin-top:10px;padding-top:12px;border-top:1px solid var(--border);">
          <label class="strong" style="font-size:var(--fs-s);">اختبار التنبيهات في الخلفية:</label>
          <div class="row" style="gap:10px;">
            <button class="btn ghost sm grow" id="btn-test-notif-now">
              تنبيه فوري تجريبي
            </button>
            <button class="btn primary sm grow" id="btn-test-notif-delayed">
              تنبيه بعد 5 ثوانٍ ⏱️
            </button>
          </div>
          <div class="muted" style="font-size:11px;">
            💡 اضغط على "تنبيه بعد 5 ثوانٍ" ثم اقفل الشاشة أو بدّل التطبيق لتجربة عمل التنبيه والصوت في الخلفية تماماً!
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn ghost sm" id="lf-audio-footer-close">إغلاق</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const cleanup = () => overlay.remove();
  overlay.querySelector('#lf-audio-modal-close').addEventListener('click', cleanup);
  overlay.querySelector('#lf-audio-footer-close').addEventListener('click', cleanup);

  // Request Permission
  const reqBtn = overlay.querySelector('#btn-request-notif-perm');
  if (reqBtn) {
    reqBtn.addEventListener('click', async () => {
      cleanup();
      await reminders.requestPermission();
      openAudioCenterModal();
    });
  }

  // Play Sound Buttons
  overlay.querySelectorAll('.btn-play-sound').forEach((btn) => {
    btn.addEventListener('click', () => {
      const soundId = btn.getAttribute('data-sound');
      audio.preview(soundId);
    });
  });

  // Test Immediate Notification
  overlay.querySelector('#btn-test-notif-now').addEventListener('click', () => {
    reminders.fire({
      id: 'test-now',
      title: 'تنبيه فوري من LifeFlow',
      body: 'هذا اختبار لصوت التنبيه والاهتزاز الفوري 🚀',
      sound: 'chime',
      module: 'dashboard'
    });
  });

  // Test 5s Delayed Notification for Background Check
  overlay.querySelector('#btn-test-notif-delayed').addEventListener('click', async () => {
    const delayTime = Date.now() + 5000;
    await reminders.schedule({
      title: 'تنبيه خلفية LifeFlow (5 ثوانٍ)',
      body: 'نجح تشغيل التنبيه والصوت أثناء قفل الشاشة أو تشغيل تطبيق آخر! 🎯',
      timestamp: delayTime,
      sound: 'alert',
      module: 'tasks'
    });
    toast.ok('تمت جدولة التنبيه بعد 5 ثوانٍ! يمكنك الآن مغادرة التبويب أو قفل الشاشة لتجربته.');
    cleanup();
  });
}

/**
 * Render the Sync Indicator & Notification Bell Widget in the topbar
 * @param {HTMLElement} parentEl
 */
export function mountSyncIndicator(parentEl) {
  containerEl = document.createElement('div');
  containerEl.className = 'row';
  containerEl.style.gap = '8px';

  containerEl.innerHTML = `
    <!-- Notification Bell Button -->
    <button id="lf-bell-btn" class="btn ghost sm" aria-label="التنبيهات والأصوات" title="مركز التنبيهات والأصوات" style="padding:7px 10px;border-radius:var(--radius-s);">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
      <span id="lf-bell-dot" style="width:7px;height:7px;border-radius:50%;background:var(--accent);display:none;"></span>
    </button>

    <!-- Cloud Sync Status Button -->
    <button id="lf-sync-badge-btn" class="btn ghost sm" aria-label="المزامنة السحابية" title="حالة مزامنة Google Drive" style="padding:6px 12px;border-radius:var(--radius-s);gap:6px;">
      <span id="sync-icon" style="font-size:12px;">☁️</span>
      <span id="sync-label" style="font-size:var(--fs-xs);font-weight:600;">Google Drive</span>
    </button>
  `;

  parentEl.prepend(containerEl);

  // Attach Click Handlers
  containerEl.querySelector('#lf-bell-btn').addEventListener('click', openAudioCenterModal);
  containerEl.querySelector('#lf-sync-badge-btn').addEventListener('click', openSyncModal);

  // Subscribe to driveSync updates
  driveSync.onChange(({ status, isOnline, signedIn }) => {
    const icon = containerEl.querySelector('#sync-icon');
    const label = containerEl.querySelector('#sync-label');
    const btn = containerEl.querySelector('#lf-sync-badge-btn');

    if (!isOnline) {
      icon.textContent = '📴';
      label.textContent = 'أوفلاين';
      btn.style.color = 'var(--text-muted)';
    } else if (!signedIn) {
      icon.textContent = '☁️';
      label.textContent = 'ربط Google';
      btn.style.color = 'var(--accent)';
    } else if (status === 'syncing') {
      icon.textContent = '🔄';
      label.textContent = 'مزامنة...';
      btn.style.color = 'var(--info)';
    } else if (status === 'synced') {
      icon.textContent = '🟢';
      label.textContent = 'متزامن';
      btn.style.color = 'var(--ok)';
    } else if (status === 'error') {
      icon.textContent = '⚠️';
      label.textContent = 'خطأ مزامنة';
      btn.style.color = 'var(--danger)';
    }
  });

  // Subscribe to auth updates to display user image if available
  auth.onChange(({ user, signedIn }) => {
    const label = containerEl.querySelector('#sync-label');
    if (signedIn && user) {
      label.textContent = user.name ? user.name.split(' ')[0] : 'متزامن';
    }
  });
}

export default {
  mount: mountSyncIndicator,
  openSyncModal,
  openAudioModal: openAudioCenterModal
};
