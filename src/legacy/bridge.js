/* ============================================================
   LifeFlow — Legacy Engine Bridge
   Connects all 15 original monolithic views to modern LifeFlow router,
   maintains data isolation, reactive events & Google Drive silent sync.
   ============================================================ */

import './legacy-engine.js';
import driveSync from '../core/drive-sync.js';

let initialized = false;
let initPromise = null;

export async function initLegacyBridge() {
  if (initialized) return window.LF;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const LF = window.LF;
    if (!LF) {
      console.error('[LifeFlow Bridge] window.LF not initialized');
      return null;
    }

    // 1. Open IndexedDB
    try {
      if (LF.db && LF.db.open) {
        await LF.db.open();
      }
    } catch (dbErr) {
      console.warn('[LifeFlow Bridge] DB open warning:', dbErr);
    }

    // 2. Ensure default user session if no user is signed in locally
    try {
      const currentId = LF.auth.currentId ? LF.auth.currentId() : null;
      if (!currentId) {
        const existingUsers = (await LF.db.list('users', { all: true })) || [];
        let defaultUser = existingUsers.find(u => u.username === 'user' || u.id === 'default') || existingUsers[0];
        if (!defaultUser) {
          defaultUser = {
            id: 'default',
            username: 'user',
            name: 'المستخدم',
            avatarColor: '#0d9488',
            createdAt: new Date().toISOString()
          };
          await LF.db.put('users', defaultUser, { all: true });
        }
        LF.auth._current = defaultUser;
        if (LF.util && LF.util.ls) {
          LF.util.ls.set('lf.session', { uid: defaultUser.id, t: Date.now() });
        }
      }

      // 3. Ensure all toggleable features are enabled by default (budget, habits, study, work, home)
      if (LF.store && LF.store.loadAll) {
        await LF.store.loadAll();
      }

      if (LF.store && LF.store.settings) {
        let changed = false;
        if (!LF.store.settings.features) {
          LF.store.settings.features = {};
          changed = true;
        }
        const features = ['budget', 'habits', 'study', 'work', 'home'];
        features.forEach(f => {
          if (LF.store.settings.features[f] === undefined) {
            LF.store.settings.features[f] = true;
            changed = true;
          }
        });
        if (!LF.store.settings.onboarded) {
          LF.store.settings.onboarded = true;
          changed = true;
        }
        if (changed) {
          await LF.db.put('settings', LF.store.settings);
        }
      }
    } catch (authErr) {
      console.warn('[LifeFlow Bridge] Session setup warning:', authErr);
    }

    // 4. Hook LF.store data:changed to driveSync.notifyDataChanged()
    if (LF.store && LF.store.on) {
      LF.store.on('data:changed', () => {
        driveSync.notifyDataChanged();
      });
    }

    // 5. Connect LF.shell.ensure to #view-container and protect #app
    if (LF.shell) {
      LF.shell.ensure = async function () {
        let container = document.getElementById('view-container');
        if (!container) {
          container = document.createElement('main');
          container.id = 'view-container';
          const app = document.getElementById('app') || document.body;
          app.appendChild(container);
        }
        container.style.display = 'block';
        return container;
      };

      // Guard against clearing outer app shell
      LF.shell.destroy = function () {
        // Clean inner elements if needed, never wipe outer #app
        const container = document.getElementById('view-container');
        if (container) container.innerHTML = '';
      };

      LF.shell.rerender = function () {
        if (typeof window.renderActiveRoute === 'function') {
          window.renderActiveRoute();
        }
      };
    }

    // Register all legacy views to LF.router
    if (LF.router && LF.views) {
      Object.entries(LF.views).forEach(([name, fn]) => {
        LF.router.add(name, fn);
      });
      LF.router.render = async function () {
        if (typeof window.renderActiveRoute === 'function') {
          window.renderActiveRoute();
        }
      };
    }

    // 6. Mount floating quickadd menu safely
    if (LF.quickadd && LF.quickadd.mount) {
      try {
        LF.quickadd.mount();
      } catch (e) {
        console.warn('[LifeFlow Bridge] Quickadd mount warning:', e);
      }
    }

    initialized = true;
    return LF;
  })();

  return initPromise;
}

/**
 * Render any legacy view into the view container
 * @param {string} viewId 
 * @param {HTMLElement} container 
 * @param {Array} params 
 */
export async function renderLegacyView(viewId, container, params = []) {
  const LF = await initLegacyBridge();
  if (!LF || !LF.views) {
    throw new Error('محرك LifeFlow الأصلي غير متاح');
  }

  // Normalize view route name
  let routeName = viewId;
  if (!routeName.startsWith('app/') && routeName !== 'login' && routeName !== 'onboarding') {
    // Check aliases
    if (routeName === 'budget' || routeName === 'budgets') routeName = 'app/budget';
    else routeName = `app/${viewId}`;
  }

  const renderFn = LF.views[routeName] || LF.views[viewId];
  if (typeof renderFn !== 'function') {
    console.warn(`[LifeFlow Bridge] View "${viewId}" (${routeName}) not found.`);
    container.innerHTML = `<div class="card danger center" style="padding:40px;margin:20px;">القسم المطلوب "${viewId}" غير متوفر.</div>`;
    return;
  }

  try {
    container.innerHTML = '';
    await renderFn(params);
  } catch (err) {
    console.error(`[LifeFlow Bridge] Error rendering view "${viewId}":`, err);
    container.innerHTML = `
      <div class="card danger center" style="padding:32px;margin:20px auto;max-width:560px;">
        <h4 style="margin-bottom:8px;">تعذر عرض قسم "${viewId}"</h4>
        <p class="muted xs" style="margin-bottom:16px;">${err.message || 'خطأ في تشغيل واجهة القسم'}</p>
        <button class="btn secondary sm" id="btn-legacy-retry">إعادة المحاولة 🔄</button>
      </div>
    `;
    const retry = container.querySelector('#btn-legacy-retry');
    if (retry) {
      retry.addEventListener('click', () => {
        if (typeof window.renderActiveRoute === 'function') window.renderActiveRoute();
      });
    }
  }
}

export default {
  init: initLegacyBridge,
  render: renderLegacyView
};

