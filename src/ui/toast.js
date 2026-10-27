/* ============================================================
   LifeFlow — Toast Notification System
   Clean, accessible, auto-dismissing toast alerts
   ============================================================ */

let container = null;

function ensureContainer() {
  if (!container || !document.body.contains(container)) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }
  return container;
}

const ICONS = {
  ok: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--ok)"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--info)"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  warn: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--warn)"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--danger)"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
};

/**
 * Display a toast alert
 * @param {string} message - Text to display
 * @param {Object} options - { type: 'ok'|'info'|'warn'|'error', duration: number }
 */
export function showToast(message, options = {}) {
  const c = ensureContainer();
  const type = options.type || 'info';
  const duration = options.duration !== undefined ? options.duration : 3200;

  const toastEl = document.createElement('div');
  toastEl.className = `toast ${type}`;
  toastEl.setAttribute('role', 'status');

  const iconMarkup = ICONS[type] || ICONS.info;
  toastEl.innerHTML = `
    <span class="toast-icon">${iconMarkup}</span>
    <span class="toast-msg grow">${message}</span>
  `;

  c.appendChild(toastEl);

  let removed = false;
  const dismiss = () => {
    if (removed) return;
    removed = true;
    toastEl.classList.add('removing');
    toastEl.addEventListener('animationend', () => {
      toastEl.remove();
    }, { once: true });
  };

  toastEl.addEventListener('click', dismiss);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }

  return { dismiss };
}

export const toast = {
  show: showToast,
  ok: (msg, dur) => showToast(msg, { type: 'ok', duration: dur }),
  info: (msg, dur) => showToast(msg, { type: 'info', duration: dur }),
  warn: (msg, dur) => showToast(msg, { type: 'warn', duration: dur }),
  error: (msg, dur) => showToast(msg, { type: 'error', duration: dur })
};

export default toast;
