/* ============================================================
   LifeFlow — Install Manager (PWA Engine)
   Handles Standalone Detection, Android/Chrome Prompts & iOS Guide
   ============================================================ */

import { toast } from './toast.js';

let deferredPrompt = null;
let currentInstallState = 'checking'; // 'standalone' | 'prompt-ready' | 'ios-guide' | 'unsupported'
const stateListeners = new Set();

/**
 * Check if the application is running in standalone (installed) mode
 */
export function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Check if the client is on an iOS device (iPhone/iPad/iPod)
 */
export function isIOSDevice() {
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && !window.MSStream;
}

/**
 * Check if the browser is Safari on iOS
 */
export function isIOSSafari() {
  const ua = window.navigator.userAgent.toLowerCase();
  return isIOSDevice() && /safari/.test(ua) && !/crios|fxios/.test(ua);
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
  // Remove any existing modal
  const existing = document.getElementById('lf-ios-install-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'lf-ios-install-modal';
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  overlay.innerHTML = `
    <div class="modal-content" dir="rtl">
      <div class="modal-header">
        <div class="row" style="gap:10px;">
          <div class="logo-badge" style="width:34px;height:34px;border-radius:8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <h3 style="font-size:var(--fs-m);font-weight:700;">تثبيت LifeFlow على iPhone / iPad</h3>
            <div class="muted" style="font-size:var(--fs-xs);">لتشغيل التطبيق بكامل طاقته ودون إنترنت</div>
          </div>
        </div>
        <button class="btn ghost sm" id="lf-ios-close-btn" aria-label="إغلاق" style="padding:4px 8px;border-radius:50%;">✕</button>
      </div>

      <div class="modal-body">
        <div class="ios-step">
          <div class="ios-step-num">1</div>
          <div class="grow">
            <div class="strong" style="font-size:var(--fs-s);">اضغط زر المشاركة (Share)</div>
            <div class="muted" style="font-size:var(--fs-xs);">ابحث عن أيقونة المربع بسهم للأعلى في شريط أدوات سفاري بالأسفل</div>
          </div>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
        </div>

        <div class="ios-step">
          <div class="ios-step-num">2</div>
          <div class="grow">
            <div class="strong" style="font-size:var(--fs-s);">اختر "إضافة إلى الشاشة الرئيسية"</div>
            <div class="muted" style="font-size:var(--fs-xs);">مرر قائمة الخيارات لأسفل واضغط على (Add to Home Screen)</div>
          </div>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        </div>

        <div class="ios-step">
          <div class="ios-step-num">3</div>
          <div class="grow">
            <div class="strong" style="font-size:var(--fs-s);">اضغط على "إضافة (Add)"</div>
            <div class="muted" style="font-size:var(--fs-xs);">في الزاوية العلوية ليظهر التطبيق في شاشتك الرئيسية كأي تطبيق أصلي</div>
          </div>
          <span style="font-weight:700;color:var(--accent);font-size:var(--fs-s);">إضافة</span>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn primary sm" id="lf-ios-ok-btn" style="width:100%;">فهمت، سأقوم بالتثبيت الآن</button>
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
 * Request application installation
 * Automatically detects whether to trigger standard Chrome prompt or iOS guide
 */
export async function triggerInstall() {
  if (isStandaloneMode()) {
    toast.info('التطبيق مثبت بالفعل ويعمل كـ تطبيق مستقل.');
    return { outcome: 'already-installed' };
  }

  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.ok('جارٍ تثبيت تطبيق LifeFlow بنجاح...');
      updateState('standalone');
    } else {
      toast.info('تم إلغاء التثبيت مؤقتاً.');
    }
    deferredPrompt = null;
    return { outcome };
  }

  if (isIOSDevice()) {
    showIOSInstallModal();
    return { outcome: 'ios-guided' };
  }

  toast.info('التثبيت متاح من خلال خيارات المتصفح (⋮) -> تثبيت التطبيق.');
  return { outcome: 'manual-browser' };
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
    return;
  }

  if (isIOSDevice()) {
    console.log('[LifeFlow PWA] iOS device detected.');
    updateState('ios-guide');
  }

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
  isStandalone: isStandaloneMode,
  getState: getInstallState
};
