/* ============================================================
   LifeFlow — Install Manager (PWA Engine)
   Universal Mobile Installation: Android, Chrome & iOS Safari
   Floating Banner, Topbar Trigger & Standalone Mode Guard
   ============================================================ */

import { toast } from './toast.js';

let deferredPrompt = null;
let currentInstallState = 'checking'; // 'standalone' | 'prompt-ready' | 'ios-guide' | 'android-guide' | 'ready'
const stateListeners = new Set();

/**
 * Check if the application is running in standalone (installed native) mode
 */
export function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return (
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) ||
    window.navigator.standalone === true ||
    (typeof document !== 'undefined' && document.referrer && document.referrer.includes('android-app://'))
  );
}

/**
 * Check if the client is on an iOS device (iPhone/iPad/iPod)
 */
export function isIOSDevice() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && !window.MSStream;
}

/**
 * Check if the browser is Safari on iOS
 */
export function isIOSSafari() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return isIOSDevice() && /safari/.test(ua) && !/crios|fxios/.test(ua);
}

/**
 * Check if running on Android
 */
export function isAndroidDevice() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /android/.test(ua);
}

function updateState(newState) {
  currentInstallState = newState;
  stateListeners.forEach((callback) => {
    try { callback(newState); } catch (e) { console.error(e); }
  });
}

/**
 * Show the step-by-step iOS Safari install guide modal
 */
export function showIOSInstallModal() {
  const existing = document.getElementById('lf-ios-install-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'lf-ios-install-modal';
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  overlay.innerHTML = `
    <div class="modal-content" dir="rtl" style="max-width:440px;">
      <div class="modal-header">
        <div class="row" style="gap:10px;align-items:center;">
          <div class="logo-badge" style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg, #0d9488, #0f766e);color:#fff;display:flex;align-items:center;justify-content:center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <h3 style="font-size:var(--fs-m);font-weight:700;margin:0;">تثبيت LifeFlow على iPhone / iPad</h3>
            <div class="muted" style="font-size:var(--fs-xs);margin-top:2px;">يعمل بملء الشاشة وبدون اتصال بالإنترنت</div>
          </div>
        </div>
        <button class="btn ghost sm" id="lf-ios-close-btn" aria-label="إغلاق" style="padding:4px 8px;border-radius:50%;font-size:16px;">✕</button>
      </div>

      <div class="modal-body" style="display:flex;flex-direction:column;gap:12px;">
        <div class="ios-step" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface-2);border-radius:var(--radius-s);border:1px solid var(--border);">
          <div class="ios-step-num" style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">1</div>
          <div class="grow">
            <div class="strong" style="font-size:var(--fs-s);">اضغط زر المشاركة (Share)</div>
            <div class="muted" style="font-size:var(--fs-xs);">ابحث عن أيقونة المربع بسهم للأعلى في أسفل شاشة Safari</div>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
        </div>

        <div class="ios-step" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface-2);border-radius:var(--radius-s);border:1px solid var(--border);">
          <div class="ios-step-num" style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">2</div>
          <div class="grow">
            <div class="strong" style="font-size:var(--fs-s);">اختر "إضافة إلى الشاشة الرئيسية"</div>
            <div class="muted" style="font-size:var(--fs-xs);">مرر قائمة الخيارات لأسفل واضغط على (Add to Home Screen)</div>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        </div>

        <div class="ios-step" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface-2);border-radius:var(--radius-s);border:1px solid var(--border);">
          <div class="ios-step-num" style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">3</div>
          <div class="grow">
            <div class="strong" style="font-size:var(--fs-s);">اضغط على "إضافة (Add)"</div>
            <div class="muted" style="font-size:var(--fs-xs);">في الزاوية العلوية ليظهر التطبيق في شاشتك الرئيسية كأي تطبيق أصلي</div>
          </div>
          <span style="font-weight:700;color:var(--accent);font-size:var(--fs-s);">إضافة</span>
        </div>
      </div>

      <div class="modal-footer" style="padding-top:12px;border-top:1px solid var(--border);">
        <button class="btn primary sm" id="lf-ios-ok-btn" style="width:100%;padding:10px;font-weight:700;">فهمت، سأقوم بالتثبيت الآن</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#lf-ios-close-btn').addEventListener('click', close);
  overlay.querySelector('#lf-ios-ok-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}

/**
 * Show the step-by-step Android / Chrome install guide modal
 */
export function showAndroidInstallModal() {
  const existing = document.getElementById('lf-android-install-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'lf-android-install-modal';
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  overlay.innerHTML = `
    <div class="modal-content" dir="rtl" style="max-width:440px;">
      <div class="modal-header">
        <div class="row" style="gap:10px;align-items:center;">
          <div class="logo-badge" style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg, #0d9488, #0f766e);color:#fff;display:flex;align-items:center;justify-content:center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
          </div>
          <div>
            <h3 style="font-size:var(--fs-m);font-weight:700;margin:0;">تثبيت LifeFlow على هاتفك</h3>
            <div class="muted" style="font-size:var(--fs-xs);margin-top:2px;">لتشغيل التطبيق بملء الشاشة وبدون إنترنت</div>
          </div>
        </div>
        <button class="btn ghost sm" id="lf-android-close-btn" aria-label="إغلاق" style="padding:4px 8px;border-radius:50%;font-size:16px;">✕</button>
      </div>

      <div class="modal-body" style="display:flex;flex-direction:column;gap:12px;">
        <div class="ios-step" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface-2);border-radius:var(--radius-s);border:1px solid var(--border);">
          <div class="ios-step-num" style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">1</div>
          <div class="grow">
            <div class="strong" style="font-size:var(--fs-s);">افتح قائمة المتصفح (⋮)</div>
            <div class="muted" style="font-size:var(--fs-xs);">اضغط على الثلاث نقاط في الزاوية العلوية أو السفلية لمتصفح Chrome</div>
          </div>
          <span style="font-size:22px;font-weight:bold;">⋮</span>
        </div>

        <div class="ios-step" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface-2);border-radius:var(--radius-s);border:1px solid var(--border);">
          <div class="ios-step-num" style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">2</div>
          <div class="grow">
            <div class="strong" style="font-size:var(--fs-s);">اختر "تثبيت التطبيق" أو "إضافة للشاشة"</div>
            <div class="muted" style="font-size:var(--fs-xs);">اضغط على خيار (Install App) أو (Add to Home screen)</div>
          </div>
          <span style="font-size:22px;">📲</span>
        </div>

        <div class="ios-step" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface-2);border-radius:var(--radius-s);border:1px solid var(--border);">
          <div class="ios-step-num" style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">3</div>
          <div class="grow">
            <div class="strong" style="font-size:var(--fs-s);">تأكيد التثبيت</div>
            <div class="muted" style="font-size:var(--fs-xs);">اضغط "تثبيت" وسيظهر التطبيق فوراً على شاشتك الرئيسية كأي تطبيق أصلي</div>
          </div>
          <span style="font-weight:700;color:var(--accent);font-size:var(--fs-s);">تثبيت</span>
        </div>
      </div>

      <div class="modal-footer" style="padding-top:12px;border-top:1px solid var(--border);">
        <button class="btn primary sm" id="lf-android-ok-btn" style="width:100%;padding:10px;font-weight:700;">حسناً، فهمت الطريقة</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#lf-android-close-btn').addEventListener('click', close);
  overlay.querySelector('#lf-android-ok-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}

/**
 * Request application installation
 * Automatically detects whether to trigger standard Chrome prompt or step-by-step guides
 */
export async function triggerInstall() {
  if (isStandaloneMode()) {
    toast.info('التطبيق مثبت بالفعل ويعمل كـ تطبيق مستقل.');
    return { outcome: 'already-installed' };
  }

  // 1. If standard beforeinstallprompt is captured (Chrome / Android / Edge)
  if (deferredPrompt) {
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        toast.ok('جارٍ تثبيت تطبيق LifeFlow بنجاح...');
        updateState('standalone');
        hideFloatingInstallBanner();
      } else {
        toast.info('تم إلغاء التثبيت مؤقتاً.');
      }
      deferredPrompt = null;
      return choice;
    } catch (e) {
      console.warn('[Install Prompt Error]', e);
    }
  }

  // 2. iOS Safari
  if (isIOSDevice()) {
    showIOSInstallModal();
    return { outcome: 'ios-guided' };
  }

  // 3. Android or Desktop without active deferredPrompt
  showAndroidInstallModal();
  return { outcome: 'android-guided' };
}

/**
 * Mount floating lightweight install banner at bottom
 */
export function mountFloatingInstallBanner() {
  if (isStandaloneMode()) return;
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('lf_install_banner_dismissed') === 'true') return;
  if (document.getElementById('lf-install-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'lf-install-banner';
  banner.className = 'install-banner';
  banner.setAttribute('dir', 'rtl');

  banner.innerHTML = `
    <div class="install-banner-content">
      <div class="row" style="gap:10px;align-items:center;">
        <div class="banner-badge">📲</div>
        <div class="col" style="gap:2px;">
          <strong style="font-size:12.5px;color:var(--text);">ثبّت LifeFlow على هاتفك ليعمل بدون نت ⚡</strong>
          <span class="muted" style="font-size:11px;">تطبيق أصلي سريع • بدون استهلاك باقة الإنترنت</span>
        </div>
      </div>
      <div class="row" style="gap:8px;align-items:center;">
        <button class="btn primary sm" id="btn-banner-install" style="font-weight:700;padding:6px 14px;box-shadow:0 2px 8px rgba(13,148,136,0.3);white-space:nowrap;">تثبيت الآن</button>
        <button class="btn ghost sm" id="btn-banner-dismiss" style="padding:4px 8px;border-radius:50%;color:var(--text-muted);" title="إغلاق">✕</button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  banner.querySelector('#btn-banner-install').addEventListener('click', () => {
    triggerInstall();
  });

  banner.querySelector('#btn-banner-dismiss').addEventListener('click', () => {
    banner.classList.add('hide');
    setTimeout(() => banner.remove(), 250);
    sessionStorage.setItem('lf_install_banner_dismissed', 'true');
  });
}

export function hideFloatingInstallBanner() {
  const b = document.getElementById('lf-install-banner');
  if (b) b.remove();
}

/**
 * Initialize the Install Manager and attach lifecycle listeners
 * @param {Object} options - { onStateChange: (state) => void, triggerBtnId: string }
 */
export function initInstallManager(options = {}) {
  if (options.onStateChange) {
    stateListeners.add(options.onStateChange);
  }

  // 1. Initial State Check
  if (isStandaloneMode()) {
    console.log('[LifeFlow PWA] Running in Standalone mode.');
    updateState('standalone');
    hideFloatingInstallBanner();
    return;
  }

  updateState('ready');

  // 2. Intercept Chrome/Android beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[LifeFlow PWA] captured beforeinstallprompt event.');
    updateState('prompt-ready');
  });

  // 3. Listen to appinstalled event
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    console.log('[LifeFlow PWA] App successfully installed!');
    toast.ok('مبارك! تم تثبيت LifeFlow على جهازك بنجاح.');
    updateState('standalone');
    hideFloatingInstallBanner();
    const topInstallBtn = document.getElementById('pwa-install-btn');
    if (topInstallBtn) topInstallBtn.style.display = 'none';
  });

  // 4. Attach click listener if trigger selector provided
  if (options.triggerBtnId) {
    const btn = document.getElementById(options.triggerBtnId);
    if (btn) {
      btn.addEventListener('click', () => triggerInstall());
    }
  }

  // Initial trigger to subscriber
  if (options.onStateChange) {
    options.onStateChange(currentInstallState);
  }
}

export function getInstallState() {
  return currentInstallState;
}

export default {
  init: initInstallManager,
  trigger: triggerInstall,
  showIOSModal: showIOSInstallModal,
  showAndroidModal: showAndroidInstallModal,
  isStandalone: isStandaloneMode,
  getState: getInstallState,
  mountBanner: mountFloatingInstallBanner,
  hideBanner: hideFloatingInstallBanner
};
