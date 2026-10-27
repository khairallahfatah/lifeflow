/* ============================================================
   LifeFlow — Main Application Bootstrap & Router
   Phase 4: 100% Mobile-First, Smart Arabic NLP & Command Palette
   ============================================================ */

import './styles/base.css';
import { toast } from './ui/toast.js';
import { initInstallManager, triggerInstall, isStandaloneMode, mountFloatingInstallBanner } from './ui/install-manager.js';
import { db, requestPersistentStorage } from './core/db.js';
import auth from './core/auth.js';
import driveSync from './core/drive-sync.js';
import reminders from './core/reminders.js';
import syncIndicator from './ui/sync-indicator.js';
import bottomNav from './ui/bottom-nav.js';
import commandPalette from './ui/command-palette.js';
import nlpParser from './core/nlp-parser.js';

// Modules
import healthModule from './modules/health/index.js';
import routinesModule from './modules/routines/index.js';
import focusModule from './modules/focus/index.js';
import vaultModule from './modules/vault/index.js';
import inboxModule from './modules/inbox/index.js';
import analyticsModule from './modules/analytics/index.js';
import loginScreen from './ui/login-screen.js';
import { renderLegacyView, initLegacyBridge } from './legacy/bridge.js';

console.log('[LifeFlow] Booting LifeFlow Mega OS: All 23 Units (15 Original + 8 New Modules)...');

const VIEWS = [
  // Primary 12 front-line views (desktop horizontal tabs)
  { id: 'dashboard', name: 'الرئيسية', icon: '📊' },
  { id: 'myday', name: 'يومي', icon: '⭐' },
  { id: 'tasks', name: 'المهام', icon: '✔️' },
  { id: 'expenses', name: 'المالية', icon: '💰' },
  { id: 'calendar', name: 'التقويم', icon: '📅' },
  { id: 'health', name: 'الصحة', icon: '🌿' },
  { id: 'focus', name: 'التركيز', icon: '⏱️' },
  { id: 'routines', name: 'الروتين', icon: '⚡' },
  { id: 'habits', name: 'العادات', icon: '🔥' },
  { id: 'study', name: 'الدراسة', icon: '📚' },
  { id: 'work', name: 'العمل', icon: '💼' },
  { id: 'goals', name: 'الأهداف', icon: '🎯' },

  // Remaining specialized and system views (accessible via drawer)
  { id: 'debts', name: 'إدارة الديون', icon: '💳' },
  { id: 'shopping', name: 'المشتريات والتسوق', icon: '🛒' },
  { id: 'home', name: 'المنزل والمرافق', icon: '🏠' },
  { id: 'vault', name: 'خزينة الوثائق', icon: '🛡️' },
  { id: 'inbox', name: 'صندوق الأفكار', icon: '🧠' },
  { id: 'notes', name: 'الملاحظات والمسودات', icon: '📝' },
  { id: 'reminders', name: 'التنبيهات والأصوات', icon: '🔔' },
  { id: 'analytics', name: 'التحليلات ومستشار AI', icon: '📈' },
  { id: 'reports', name: 'التقارير الشاملة', icon: '📋' },
  { id: 'contacts', name: 'المساحات والأمان', icon: '👥' },
  { id: 'settings', name: 'إعدادات المظهر', icon: '⚙️' },
  { id: 'login', name: 'الحساب والمزامنة', icon: '👤' }
];

let activeViewId = 'dashboard';

/* ---------- Service Worker Registration ---------- */
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const swUrl = new URL('./sw.js', window.location.href).href;
      const reg = await navigator.serviceWorker.register(swUrl);
      console.log('[LifeFlow SW] Registered successfully with scope:', reg.scope);

      navigator.serviceWorker.addEventListener('message', async (event) => {
        if (!event.data) return;

        if (event.data.type === 'REMINDER_DONE') {
          const rec = await db.get('reminders', event.data.reminderId);
          if (rec) {
            rec.status = 'done';
            rec.completedAt = new Date().toISOString();
            await db.put('reminders', rec, { all: true });
            toast.ok(`✔️ تم إنجاز التنبيه: ${rec.title}`);
          }
        }

        if (event.data.type === 'REMINDER_SNOOZE') {
          await reminders.snooze(event.data.reminderId, event.data.minutes || 10);
        }

        if (event.data.type === 'NAVIGATE_TO') {
          const hash = event.data.url.replace('/#', '#');
          window.location.hash = hash;
        }
      });

      return reg;
    } catch (err) {
      console.warn('[LifeFlow SW] Registration error:', err);
    }
  }
  return null;
}

/* ---------- Dashboard (Home) View Renderer ---------- */
async function renderDashboardView(container) {
  const todayHealth = await healthModule.getToday();
  const morningRoutine = await routinesModule.getRecord('morning');
  const todayFocus = await db.list('focus_sessions', { all: true, predicate: s => s.date === new Date().toISOString().slice(0, 10) });
  const vaultItems = await vaultModule.list();

  const totalFocusMin = todayFocus.reduce((acc, s) => acc + (s.minutes || 0), 0);
  const waterPct = Math.round((todayHealth.waterCurrent / todayHealth.waterTarget) * 100);

  container.innerHTML = `
    <div class="col" style="gap:var(--sp-4);">
      <!-- 1. Smart Arabic NLP Quick-Add Bar -->
      <div class="nlp-quick-add" id="nlp-quick-add-box">
        <div class="row" style="gap:10px;align-items:center;">
          <span style="font-size:22px;flex:none;">✨</span>
          <input type="text" id="nlp-input" class="grow" placeholder="جرّب: 'غداء مع أحمد بـ 45 ريال بكرة 3 عصراً' أو 'شراء شاحن عاجل'..." style="border:none;outline:none;background:transparent;font-size:var(--fs-m);font-family:inherit;color:var(--text);" />
          <button class="btn primary sm" id="btn-nlp-submit" style="padding:7px 16px;flex:none;">
            إضافة ذكية ⚡
          </button>
        </div>

        <!-- Live Extracted Chips Badges -->
        <div class="nlp-chips-container" id="nlp-chips-preview">
          <span class="faint xs">اكتب أي جملة باللغة العربية وسيتعرف النظام آلياً على النوع، المبلغ، والتاريخ</span>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="kpi-grid">
        <!-- Water KPI -->
        <div class="kpi-card nav-shortcut" data-target="health" style="cursor:pointer;">
          <div class="kpi-icon" style="background:rgba(2, 132, 199, 0.15);color:#0284c7;">
            💧
          </div>
          <div class="kpi-content">
            <span class="kpi-title">ترطيب الجسم (الماء)</span>
            <span class="kpi-val">${todayHealth.waterCurrent} / ${todayHealth.waterTarget} مل</span>
            <span class="kpi-desc">${waterPct}% من الهدف اليومي</span>
          </div>
        </div>

        <!-- Focus KPI -->
        <div class="kpi-card nav-shortcut" data-target="focus" style="cursor:pointer;">
          <div class="kpi-icon" style="background:rgba(13, 148, 136, 0.15);color:var(--accent);">
            ⏱️
          </div>
          <div class="kpi-content">
            <span class="kpi-title">التركيز وبومودورو</span>
            <span class="kpi-val">${totalFocusMin} دقيقة</span>
            <span class="kpi-desc">${todayFocus.length} جلسات تركيز اليوم</span>
          </div>
        </div>

        <!-- Routines KPI -->
        <div class="kpi-card nav-shortcut" data-target="routines" style="cursor:pointer;">
          <div class="kpi-icon" style="background:rgba(245, 158, 11, 0.15);color:#d97706;">
            🔥
          </div>
          <div class="kpi-content">
            <span class="kpi-title">سلسلة الروتين اليومي</span>
            <span class="kpi-val">${morningRoutine.streak || 0} أيام متتالية</span>
            <span class="kpi-desc">${morningRoutine.steps.filter(s => s.done).length}/${morningRoutine.steps.length} خطوات منجزة</span>
          </div>
        </div>

        <!-- Vault KPI -->
        <div class="kpi-card nav-shortcut" data-target="vault" style="cursor:pointer;">
          <div class="kpi-icon" style="background:rgba(99, 102, 241, 0.15);color:#6366f1;">
            🛡️
          </div>
          <div class="kpi-content">
            <span class="kpi-title">خزينة الوثائق</span>
            <span class="kpi-val">${vaultItems.length} وثائق مؤمنة</span>
            <span class="kpi-desc">إنذار مبكر لانتهاء الصلاحية</span>
          </div>
        </div>
      </div>

      <!-- Quick Launchpad for Modules -->
      <section class="card col" style="gap:var(--sp-4);">
        <div class="row between">
          <div>
            <h3 style="font-size:var(--fs-l);font-weight:700;">أقسام LifeFlow الذكية</h3>
            <p class="muted xs" style="margin-top:2px;">انقر للدخول المباشر إلى أي قسم</p>
          </div>
          <button class="btn ghost sm" id="btn-open-cmd-pal">
            🔍 بحث وأوامر (Ctrl+K)
          </button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:var(--sp-3);">
          <div class="card col between nav-shortcut" data-target="health" style="padding:14px;background:var(--surface-2);cursor:pointer;">
            <div class="row" style="gap:10px;">
              <span style="font-size:24px;">🌿</span>
              <div>
                <h4 class="strong small">الصحة والعافية</h4>
                <div class="muted xs">شرب الماء، النوم، ومقياس المزاج</div>
              </div>
            </div>
            <span class="btn ghost sm" style="margin-top:8px;width:100%;">فتح متتبع الصحة ➔</span>
          </div>

          <div class="card col between nav-shortcut" data-target="routines" style="padding:14px;background:var(--surface-2);cursor:pointer;">
            <div class="row" style="gap:10px;">
              <span style="font-size:24px;">⚡</span>
              <div>
                <h4 class="strong small">الروتين المتسلسل</h4>
                <div class="muted xs">روتين الصباح والمساء لمحاربة التردد</div>
              </div>
            </div>
            <span class="btn ghost sm" style="margin-top:8px;width:100%;">فتح الروتينات ➔</span>
          </div>

          <div class="card col between nav-shortcut" data-target="focus" style="padding:14px;background:var(--surface-2);cursor:pointer;">
            <div class="row" style="gap:10px;">
              <span style="font-size:24px;">⏱️</span>
              <div>
                <h4 class="strong small">مؤقت بومودورو والأصوات</h4>
                <div class="muted xs">جلسات 25 دقيقة + أصوات مطر وبحر دون إنترنت</div>
              </div>
            </div>
            <span class="btn ghost sm" style="margin-top:8px;width:100%;">بدء جلسة تركيز ➔</span>
          </div>

          <div class="card col between nav-shortcut" data-target="inbox" style="padding:14px;background:var(--surface-2);cursor:pointer;">
            <div class="row" style="gap:10px;">
              <span style="font-size:24px;">🧠</span>
              <div>
                <h4 class="strong small">صندوق تفريغ الأفكار</h4>
                <div class="muted xs">تفريغ فوري والتحويل لمهمة أو مصروف</div>
              </div>
            </div>
            <span class="btn ghost sm" style="margin-top:8px;width:100%;">تفريغ فكرة الآن ➔</span>
          </div>

          <div class="card col between nav-shortcut" data-target="analytics" style="padding:14px;background:var(--surface-2);cursor:pointer;">
            <div class="row" style="gap:10px;">
              <span style="font-size:24px;">📈</span>
              <div>
                <h4 class="strong small">التحليلات والمستشار الذكي</h4>
                <div class="muted xs">تقارير النوم والإنجاز وذكاء اصطناعي</div>
              </div>
            </div>
            <span class="btn ghost sm" style="margin-top:8px;width:100%;">عرض التحليلات ➔</span>
          </div>

          <div class="card col between nav-shortcut" data-target="vault" style="padding:14px;background:var(--surface-2);cursor:pointer;">
            <div class="row" style="gap:10px;">
              <span style="font-size:24px;">🛡️</span>
              <div>
                <h4 class="strong small">خزينة الوثائق</h4>
                <div class="muted xs">حفظ الهويات والجوازات وتنبيهات الانتهاء</div>
              </div>
            </div>
            <span class="btn ghost sm" style="margin-top:8px;width:100%;">فتح الخزينة ➔</span>
          </div>
        </div>
      </section>
    </div>
  `;

  // Attach shortcut clicks
  container.querySelectorAll('.nav-shortcut').forEach(card => {
    card.addEventListener('click', () => {
      const target = card.getAttribute('data-target');
      navigateTo(target);
    });
  });

  const cmdBtn = container.querySelector('#btn-open-cmd-pal');
  if (cmdBtn) cmdBtn.addEventListener('click', commandPalette.open);

  // Attach NLP Live Input & Submission
  const nlpInput = container.querySelector('#nlp-input');
  const chipsPreview = container.querySelector('#nlp-chips-preview');
  const nlpSubmitBtn = container.querySelector('#btn-nlp-submit');

  const updateNlpPreview = () => {
    const text = nlpInput.value.trim();
    if (!text) {
      chipsPreview.innerHTML = '<span class="faint xs">اكتب أي جملة باللغة العربية وسيتعرف النظام آلياً على النوع، المبلغ، والتاريخ</span>';
      return null;
    }

    const parsed = nlpParser.parse(text);
    if (parsed && parsed.chips && parsed.chips.length > 0) {
      chipsPreview.innerHTML = parsed.chips.map(c => `
        <span class="badge ${c.color || 'accent'} xs">
          ${c.label}
        </span>
      `).join('');
      return parsed;
    }
    chipsPreview.innerHTML = '<span class="badge ok xs">مهمة عمل ✔️</span>';
    return parsed;
  };

  nlpInput.addEventListener('input', updateNlpPreview);

  const handleNlpSubmit = async () => {
    const text = nlpInput.value.trim();
    if (!text) return;

    const parsed = nlpParser.parse(text);
    await nlpParser.execute(parsed);
    nlpInput.value = '';
    updateNlpPreview();
    // Refresh dashboard stats
    renderDashboardView(container);
  };

  nlpSubmitBtn.addEventListener('click', handleNlpSubmit);
  nlpInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleNlpSubmit();
  });

  // 3. Mount Legacy Monolithic Dashboard Widgets (Tasks today, Budget health, Habits chain, etc.)
  const LF = window.LF;
  if (LF && LF.dashboard && typeof LF.dashboard.render === 'function') {
    const legacyWidgetsBox = document.createElement('div');
    legacyWidgetsBox.id = 'legacy-dashboard-widgets';
    legacyWidgetsBox.style.marginTop = 'var(--sp-4)';
    container.appendChild(legacyWidgetsBox);
    try {
      await LF.dashboard.render(legacyWidgetsBox);
    } catch (e) {
      console.warn('[LifeFlow] Legacy widgets warning on dashboard:', e);
    }
  }
}

/* ---------- Navigation & Router Engine ---------- */
let currentNavToken = 0;

async function navigateTo(viewId, params = []) {
  if (!viewId) viewId = 'dashboard';

  // Normalize aliases
  if (viewId === 'budgets') viewId = 'budget';
  if (viewId === 'root') viewId = 'dashboard';

  activeViewId = viewId;
  const targetHash = `#view=${viewId}`;

  // Update URL hash cleanly without re-triggering recursive loops
  if (window.location.hash !== targetHash &&
      window.location.hash !== `#/app/${viewId}` &&
      window.location.hash !== `#app/${viewId}` &&
      window.location.hash !== `#${viewId}`) {
    try {
      history.pushState(null, '', targetHash);
    } catch (e) {
      window.location.hash = targetHash;
    }
  }

  // Update desktop tabs visual state
  document.querySelectorAll('.nav-tab[data-view]').forEach(tab => {
    if (tab.getAttribute('data-view') === viewId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Update mobile bottom nav state
  if (bottomNav) {
    if (typeof bottomNav.setActive === 'function') bottomNav.setActive(viewId);
    else if (typeof bottomNav.update === 'function') bottomNav.update(viewId);
  }

  const viewContainer = document.getElementById('view-container');
  if (!viewContainer) {
    console.warn('[LifeFlow Router] #view-container not found in DOM');
    return;
  }

  // Ensure container is always visible
  viewContainer.style.display = 'block';

  // Loading state
  viewContainer.innerHTML = '<div class="center" style="padding:60px 20px;"><span class="muted">جارٍ تحميل القسم...</span></div>';

  const thisToken = ++currentNavToken;

  try {
    switch (viewId) {
      case 'dashboard':
        await renderDashboardView(viewContainer);
        break;

      // 8 Smart Lifestyle & Specialized Modules
      case 'health':
        await healthModule.render(viewContainer);
        break;
      case 'routines':
        await routinesModule.render(viewContainer);
        break;
      case 'focus':
        await focusModule.render(viewContainer);
        break;
      case 'vault':
        await vaultModule.render(viewContainer);
        break;
      case 'inbox':
        await inboxModule.render(viewContainer);
        break;
      case 'analytics':
        await analyticsModule.render(viewContainer);
        break;
      case 'login':
        await loginScreen.render(viewContainer, navigateTo);
        break;

      // 15 Original Legacy Views (Restored from Monolith)
      case 'myday':
      case 'tasks':
      case 'projects':
      case 'calendar':
      case 'expenses':
      case 'income':
      case 'budget':
      case 'debts':
      case 'habits':
      case 'goals':
      case 'study':
      case 'work':
      case 'home':
      case 'shopping':
      case 'notes':
      case 'reminders':
      case 'reports':
      case 'search':
      case 'contacts':
      case 'settings':
      default:
        await renderLegacyView(viewId, viewContainer, params);
        break;
    }

    if (thisToken !== currentNavToken) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
  } catch (err) {
    if (thisToken !== currentNavToken) return;
    console.error(`[LifeFlow Router] Render view error for "${viewId}":`, err);
    viewContainer.innerHTML = `
      <div class="card danger center" style="padding:32px;margin:24px auto;max-width:560px;">
        <h4 style="margin-bottom:8px;">تعذر عرض قسم "${viewId}"</h4>
        <p class="muted xs" style="margin-bottom:16px;">${err.message || 'حدث خطأ في تحميل بيانات القسم'}</p>
        <button class="btn secondary sm" id="retry-view-btn">إعادة المحاولة 🔄</button>
      </div>
    `;
    const retryBtn = viewContainer.querySelector('#retry-view-btn');
    if (retryBtn) retryBtn.addEventListener('click', () => navigateTo(viewId, params));
  }
}

function parseHash(hash) {
  if (!hash || hash === '#' || hash === '#/') return { viewId: 'dashboard', params: [] };
  const clean = hash.replace(/^#\/?/, '');

  if (clean.startsWith('view=')) {
    const raw = clean.slice(5);
    const parts = raw.split('/').filter(Boolean);
    return { viewId: parts[0] || 'dashboard', params: parts.slice(1) };
  }

  if (clean.startsWith('app/')) {
    const raw = clean.slice(4);
    const parts = raw.split('/').filter(Boolean);
    return { viewId: parts[0] || 'dashboard', params: parts.slice(1) };
  }

  const parts = clean.split('/').filter(Boolean);
  return { viewId: parts[0] || 'dashboard', params: parts.slice(1) };
}

function handleHashChange() {
  const { viewId, params } = parseHash(window.location.hash);
  navigateTo(viewId, params);
}

/* ---------- App Initialization ---------- */
async function initApp() {
  const root = document.getElementById('app');
  if (!root) return;

  root.innerHTML = `
    <div class="app-container">
      <!-- Topbar Header -->
      <header class="topbar">
        <div class="brand-wrapper">
          <div class="logo-badge" style="cursor:pointer;" id="brand-home-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div style="cursor:pointer;" id="brand-title-btn">
            <h1 class="brand-title">LifeFlow</h1>
            <div class="brand-sub">نظام إدارة الحياة الشخصية • متوافق مع الجوال 100%</div>
          </div>
        </div>

        <!-- Topbar Controls (Search Icon + Sync Indicator + Bell + Install) -->
        <div class="row" id="topbar-controls">
          <!-- Mobile & Desktop Command Palette Trigger -->
          <button id="lf-search-btn" class="btn ghost sm" aria-label="البحث والأوامر" title="بحث سريع (Ctrl+K)" style="padding:7px 10px;border-radius:var(--radius-s);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>

          <!-- Account & Login Button -->
          <button id="lf-account-btn" class="btn ghost sm" aria-label="تسجيل الدخول وإدارة الحساب" title="تسجيل الدخول وإدارة الحساب" style="padding:6px 10px;border-radius:var(--radius-s);gap:6px;">
            <span id="lf-account-icon">👤</span>
            <span id="lf-account-name" class="hide-xs" style="font-size:var(--fs-xs);font-weight:600;">تسجيل الدخول</span>
          </button>

          <!-- PWA Install Button (Always visible on mobile/browser unless standalone) -->
          <button id="pwa-install-btn" class="btn primary sm" aria-label="تثبيت التطبيق" title="تثبيت التطبيق على جهازك" style="display:none;gap:6px;padding:6px 12px;font-size:var(--fs-xs);font-weight:700;border-radius:var(--radius-s);background:linear-gradient(135deg, #0d9488, #0f766e);box-shadow:0 2px 8px rgba(13,148,136,0.3);color:#fff;cursor:pointer;">
            <span>📲</span>
            <span class="install-label">تثبيت التطبيق</span>
          </button>
        </div>
      </header>

      <!-- Desktop Horizontal Navigation Bar (Hidden on Mobile) -->
      <nav class="nav-bar" id="app-nav-bar" role="navigation" style="overflow-x:auto;white-space:nowrap;padding:4px 8px;">
        ${VIEWS.slice(0, 12).map(v => `
          <button class="nav-tab ${v.id === activeViewId ? 'active' : ''}" data-view="${v.id}">
            <span>${v.icon}</span>
            <span>${v.name}</span>
          </button>
        `).join('')}
        <button class="nav-tab" id="btn-desktop-all-apps" style="background:var(--accent-soft);color:var(--accent);font-weight:700;">
          <span>🗂️</span>
          <span>كل الأقسام الـ 23 ▾</span>
        </button>
      </nav>

      <!-- Dynamic View Container -->
      <main id="view-container">
        <!-- Rendered by Router -->
      </main>
    </div>
  `;

  // Set global rerender function for modals and legacy events
  window.renderActiveRoute = () => navigateTo(activeViewId);

  // Initialize Legacy Bridge
  await initLegacyBridge();

  // 1. Mount Topbar Widgets (Google Drive Sync + Audio Bell)
  const controlsEl = document.getElementById('topbar-controls');
  syncIndicator.mount(controlsEl);

  // Search Button click
  document.getElementById('lf-search-btn').addEventListener('click', commandPalette.open);

  // Brand Logo & Title clicks -> Go Home (Dashboard)
  const brandHomeBtn = document.getElementById('brand-home-btn');
  if (brandHomeBtn) brandHomeBtn.addEventListener('click', () => navigateTo('dashboard'));
  const brandTitleBtn = document.getElementById('brand-title-btn');
  if (brandTitleBtn) brandTitleBtn.addEventListener('click', () => navigateTo('dashboard'));

  // Account / Login Button click
  const accountBtn = document.getElementById('lf-account-btn');
  if (accountBtn) {
    accountBtn.addEventListener('click', () => navigateTo('login'));
    auth.onChange(({ user, signedIn }) => {
      const nameEl = document.getElementById('lf-account-name');
      const iconEl = document.getElementById('lf-account-icon');
      if (nameEl && iconEl) {
        if (signedIn && user) {
          nameEl.textContent = user.name ? user.name.split(' ')[0] : 'حسابي';
          iconEl.textContent = '🟢';
        } else {
          nameEl.textContent = 'تسجيل الدخول';
          iconEl.textContent = '👤';
        }
      }
    });
  }

  // 2. Mount Mobile Bottom Navigation Bar (< 768px)
  bottomNav.mount((selectedViewId) => {
    navigateTo(selectedViewId);
  });

  // 3. Initialize Command Palette Shortcuts (Ctrl+K)
  commandPalette.init();

  // 4. Initialize Database & Storage
  await db.open();
  await requestPersistentStorage();

  // 5. Initialize Auth, Cloud Sync, and Background Reminders Watcher
  auth.init();
  driveSync.init();
  reminders.startWatcher();

  // 6. Attach Desktop Navigation Tab Clicks
  document.querySelectorAll('.nav-tab[data-view]').forEach(tab => {
    tab.addEventListener('click', () => {
      const viewId = tab.getAttribute('data-view');
      if (viewId) navigateTo(viewId);
    });
  });

  // Desktop "All Apps" button click
  const allAppsBtn = document.getElementById('btn-desktop-all-apps');
  if (allAppsBtn) {
    allAppsBtn.addEventListener('click', () => {
      bottomNav.openMoreDrawer();
    });
  }

  // 7. PWA Install Manager Setup & Topbar Install Trigger
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    if (!isStandaloneMode()) {
      installBtn.style.display = 'inline-flex';
    } else {
      installBtn.style.display = 'none';
    }
    installBtn.addEventListener('click', () => {
      triggerInstall();
    });
  }

  initInstallManager({
    onStateChange: (state) => {
      if (installBtn) {
        if (state === 'standalone') {
          installBtn.style.display = 'none';
        } else {
          installBtn.style.display = 'inline-flex';
        }
      }
    }
  });

  // Mount floating mobile install banner (automatically guarded against standalone)
  mountFloatingInstallBanner();

  // 8. Listen to Hash Routing
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();
}

// Register Service Worker and Boot
registerServiceWorker();
document.addEventListener('DOMContentLoaded', initApp);
