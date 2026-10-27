/* ============================================================
   LifeFlow — Dedicated Login & Account Management Screen
   Local-First Auth, Google Identity Services & Profile Hub
   ============================================================ */

import auth from '../core/auth.js';
import driveSync from '../core/drive-sync.js';
import instantBackup from '../core/instant-backup.js';
import { toast } from './toast.js';

/**
 * Render the dedicated Login & Account Screen into the target container
 * @param {HTMLElement} container 
 * @param {Function} onNavigate 
 */
export async function renderLoginScreen(container, onNavigate = null) {
  const signedIn = auth.isSignedIn();
  const user = auth.getUser();
  const lastSync = driveSync.getLastSyncAt();
  const lastSyncText = lastSync ? new Date(lastSync).toLocaleString('ar-EG') : 'لم تتم المزامنة بعد';

  container.innerHTML = `
    <div class="col center" style="min-height:75vh;padding:var(--sp-4) var(--sp-2);animation:fadeIn 0.25s ease-out;" dir="rtl">
      <div class="card" style="width:100%;max-width:480px;padding:var(--sp-5);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-l);box-shadow:0 12px 36px rgba(0,0,0,0.06);">
        
        <!-- Brand Header -->
        <div class="col center" style="gap:8px;text-align:center;margin-bottom:var(--sp-5);">
          <div class="logo-badge" style="width:58px;height:58px;border-radius:16px;background:linear-gradient(135deg, #0d9488, #0f766e);box-shadow:0 8px 20px rgba(13,148,136,0.3);display:flex;align-items:center;justify-content:center;color:#fff;">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h2 style="font-size:var(--fs-xl);font-weight:800;color:var(--text);margin-top:6px;">LifeFlow</h2>
          <p class="muted" style="font-size:var(--fs-s);margin:0;line-height:1.5;">
            نظام إدارة الحياة الشخصية والإنتاجية<br/>
            <span style="font-weight:600;color:var(--accent);">بياناتك ملكك وحدك • مشفرة ومحلية بالكامل</span>
          </p>
        </div>

        ${signedIn && user ? `
          <!-- Logged In Profile Card -->
          <div class="col" style="gap:16px;">
            <div class="card" style="padding:16px;background:var(--surface-2);border-radius:var(--radius-m);border:1px solid var(--border);">
              <div class="row" style="gap:14px;align-items:center;">
                ${user.picture ? `
                  <img src="${user.picture}" alt="Avatar" style="width:52px;height:52px;border-radius:50%;border:2px solid var(--accent);box-shadow:0 4px 10px rgba(0,0,0,0.1);" />
                ` : `
                  <div class="logo-badge" style="width:52px;height:52px;border-radius:50%;font-size:20px;font-weight:bold;">${user.name ? user.name[0] : 'U'}</div>
                `}
                <div class="grow">
                  <div class="row between" style="align-items:center;">
                    <div style="font-size:var(--fs-m);font-weight:700;color:var(--text);">${user.name || 'مستخدم LifeFlow'}</div>
                    <span class="badge" style="background:#e6f4ea;color:#137333;font-size:11px;padding:3px 8px;border-radius:12px;font-weight:600;">🟢 متصل بالسحابة</span>
                  </div>
                  <div class="muted" style="font-size:var(--fs-xs);margin-top:2px;">${user.email}</div>
                </div>
              </div>

              <div style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--border);font-size:var(--fs-xs);color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;">
                <span>🕒 آخر مزامنة سحابية:</span>
                <strong style="color:var(--text);">${lastSyncText}</strong>
              </div>
            </div>

            <!-- Cloud Actions -->
            <div class="row" style="gap:10px;">
              <button class="btn primary sm grow" id="btn-login-sync-now" style="gap:8px;padding:10px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                مزامنة سحابية الآن
              </button>
              <button class="btn ghost sm grow" id="btn-login-restore" style="gap:8px;padding:10px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                استعادة النسخة
              </button>
            </div>

            <!-- Sign Out Button -->
            <button class="btn ghost sm" id="btn-login-signout" style="width:100%;color:var(--danger);border-color:rgba(239,68,68,0.2);padding:10px;">
              تسجيل الخروج من حساب Google
            </button>
          </div>
        ` : `
          <!-- Sign In State -->
          <div class="col" style="gap:14px;">
            <!-- Google Sign In Button -->
            <button id="btn-login-google" class="btn" style="width:100%;padding:12px 16px;background:#ffffff;color:#3c4043;border:1px solid #dadce0;border-radius:var(--radius-s);font-size:var(--fs-m);font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,0.08);display:flex;align-items:center;justify-content:center;gap:12px;transition:var(--tr-smooth);cursor:pointer;">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>تسجيل الدخول والمزامنة بواسطة Google</span>
            </button>
            <div class="muted" style="font-size:11.5px;text-align:center;line-height:1.4;">
              حفظ واستعادة النسخ الاحتياطية المشفرة في مجلد تطبيقك الخاص (appDataFolder) مجاناً.
            </div>

            <!-- Divider -->
            <div class="row center" style="gap:12px;margin:4px 0;">
              <div style="height:1px;background:var(--border);flex:1;"></div>
              <span class="muted" style="font-size:var(--fs-xs);">أو</span>
              <div style="height:1px;background:var(--border);flex:1;"></div>
            </div>

            <!-- Continue Local Guest Button -->
            <button id="btn-login-local" class="btn ghost" style="width:100%;padding:11px;font-size:var(--fs-s);border-radius:var(--radius-s);font-weight:600;gap:8px;">
              <span>💾</span>
              <span>المتابعة كحساب محلي بدون إنترنت (Local-First)</span>
            </button>
          </div>
        `}

        <!-- Instant Offline Backup & Restore Card -->
        <div class="card" style="margin-top:var(--sp-4);background:var(--surface-2);border-radius:var(--radius-s);padding:14px;border:1px solid var(--border);">
          <div class="col" style="gap:8px;">
            <div class="row between" style="align-items:center;">
              <span class="strong" style="font-size:var(--fs-xs);color:var(--text);">النسخ الاحتياطي الفوري بملف مشفر:</span>
              <span class="badge" style="background:var(--accent-soft);color:var(--accent);font-size:10.5px;padding:2px 6px;">AES-256</span>
            </div>
            <div class="row" style="gap:8px;">
              <button class="btn secondary sm grow" id="btn-login-instant-export" style="gap:6px;font-size:12px;padding:8px;cursor:pointer;">
                <span>📥</span>
                <span>تصدير نسخة مشفرة</span>
              </button>
              <button class="btn ghost sm grow" id="btn-login-instant-restore" style="gap:6px;font-size:12px;padding:8px;border:1px dashed var(--border);cursor:pointer;">
                <span>📤</span>
                <span>استعادة من ملف</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Security & Privacy Guarantee Badges -->
        <div class="col" style="margin-top:var(--sp-5);padding-top:var(--sp-4);border-top:1px solid var(--border);gap:8px;">
          <div class="row" style="gap:10px;align-items:center;">
            <span style="font-size:16px;">🛡️</span>
            <div style="font-size:12px;color:var(--text-muted);line-height:1.4;">
              <strong style="color:var(--text);">تشفير عسكري AES-GCM-256:</strong> حماية كاملة لكافة البيانات والوثائق الحساسة.
            </div>
          </div>
          <div class="row" style="gap:10px;align-items:center;">
            <span style="font-size:16px;">⚡</span>
            <div style="font-size:12px;color:var(--text-muted);line-height:1.4;">
              <strong style="color:var(--text);">أولوية مطلقة للبيانات المحلية:</strong> التطبيق يعمل بالكامل دون الحاجة لشبكة الإنترنت.
            </div>
          </div>
          <div class="row" style="gap:10px;align-items:center;">
            <span style="font-size:16px;">🔒</span>
            <div style="font-size:12px;color:var(--text-muted);line-height:1.4;">
              <strong style="color:var(--text);">انعدام تسريب البيانات (Zero Leak):</strong> لا توجد أي خوادم وسيطة تجمع معلوماتك.
            </div>
          </div>
        </div>

        <!-- Back to App / Dashboard Button -->
        <div style="margin-top:var(--sp-5);">
          <button id="btn-login-go-dashboard" class="btn primary" style="width:100%;padding:12px;font-weight:700;font-size:var(--fs-m);border-radius:var(--radius-s);gap:8px;box-shadow:0 4px 14px rgba(13,148,136,0.25);">
            <span>الانتقال إلى لوحة التحكم الرئيسية</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>

      </div>
    </div>
  `;

  // Attach Event Handlers
  const googleBtn = container.querySelector('#btn-login-google');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      try {
        toast.info('جارٍ الاتصال بحساب Google...');
        await auth.signIn();
        toast.ok('تم تسجيل الدخول بحساب Google بنجاح!');
        renderLoginScreen(container, onNavigate);
      } catch (err) {
        toast.error('فشل تسجيل الدخول: ' + err.message);
      }
    });
  }

  const localBtn = container.querySelector('#btn-login-local');
  if (localBtn) {
    localBtn.addEventListener('click', () => {
      toast.info('أنت تعمل الآن بحساب محلي آمن 100% دون اتصال.');
      if (onNavigate) onNavigate('dashboard');
      else window.location.hash = '#view=dashboard';
    });
  }

  // Instant Export & Restore Handlers
  const instantExportBtn = container.querySelector('#btn-login-instant-export');
  if (instantExportBtn) {
    instantExportBtn.addEventListener('click', async () => {
      instantExportBtn.disabled = true;
      try {
        await instantBackup.exportInstantEncryptedBackup();
      } finally {
        instantExportBtn.disabled = false;
      }
    });
  }

  const instantRestoreBtn = container.querySelector('#btn-login-instant-restore');
  if (instantRestoreBtn) {
    instantRestoreBtn.addEventListener('click', async () => {
      await instantBackup.promptAndRestoreFile();
      renderLoginScreen(container, onNavigate);
    });
  }

  const syncNowBtn = container.querySelector('#btn-login-sync-now');
  if (syncNowBtn) {
    syncNowBtn.addEventListener('click', async () => {
      syncNowBtn.disabled = true;
      syncNowBtn.textContent = 'جاري المزامنة...';
      try {
        await driveSync.syncNow();
        toast.ok('تمت المزامنة السحابية بنجاح!');
        renderLoginScreen(container, onNavigate);
      } catch (e) {
        toast.error('خطأ أثناء المزامنة: ' + e.message);
      } finally {
        syncNowBtn.disabled = false;
      }
    });
  }

  const restoreBtn = container.querySelector('#btn-login-restore');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', async () => {
      if (!confirm('هل تريد استعادة النسخة الاحتياطية من Google Drive واستبدال البيانات الحالية؟')) return;
      try {
        await driveSync.restoreFromDrive();
        toast.ok('تمت استعادة البيانات بنجاح من السحابة!');
        renderLoginScreen(container, onNavigate);
      } catch (e) {
        toast.error('تعذر استعادة البيانات: ' + e.message);
      }
    });
  }

  const signoutBtn = container.querySelector('#btn-login-signout');
  if (signoutBtn) {
    signoutBtn.addEventListener('click', () => {
      auth.signOut();
      toast.info('تم إلغاء ربط الحساب بنجاح.');
      renderLoginScreen(container, onNavigate);
    });
  }

  const goDashBtn = container.querySelector('#btn-login-go-dashboard');
  if (goDashBtn) {
    goDashBtn.addEventListener('click', () => {
      if (onNavigate) onNavigate('dashboard');
      else window.location.hash = '#view=dashboard';
    });
  }
}

export default {
  render: renderLoginScreen
};
