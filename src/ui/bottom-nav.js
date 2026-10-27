/* ============================================================
   LifeFlow — Mobile Bottom Navigation Bar & All-Apps Mega Drawer
   Thumb-friendly navigation with safe-area support for smartphones
   Displays the 5 primary tabs + Categorized Drawer with all 23+ Life Units
   ============================================================ */

import { openCommandPalette } from './command-palette.js';
import { openSyncModal, openAudioCenterModal } from './sync-indicator.js';
import { isStandaloneMode, triggerInstall } from './install-manager.js';
import { toast } from './toast.js';

let activeView = 'dashboard';
let navigateCallback = null;

// Primary 5 tabs as requested in the prompt
const PRIMARY_NAV_ITEMS = [
  { id: 'dashboard', name: 'الرئيسية', icon: '📊' },
  { id: 'myday', name: 'يومي', icon: '⭐' },
  { id: 'tasks', name: 'المهام', icon: '✔️' },
  { id: 'expenses', name: 'المالية', icon: '💰' },
  { id: 'all-apps', name: 'كل الأقسام', icon: '🗂️' }
];

// All 23+ units organized by life categories
const APP_CATEGORIES = [
  {
    title: '🚀 الإنتاجية وإدارة المهام',
    items: [
      { id: 'dashboard', name: 'لوحة التحكم', icon: '📊', desc: 'نظرة بانورامية والودجات الذكية' },
      { id: 'myday', name: 'يومي (التركيز اليومي)', icon: '⭐', desc: 'جدول اليوم ومراجعة الإنجاز' },
      { id: 'tasks', name: 'المهام والمشاريع', icon: '✔️', desc: 'المهام الفرعية والتكرار والأولويات' },
      { id: 'projects', name: 'المشاريع', icon: '📁', desc: 'إدارة وتتبع مسارات المشاريع' },
      { id: 'calendar', name: 'التقويم والمناسبات', icon: '📅', desc: 'شبكة 42 خلية والمواعيد' },
      { id: 'goals', name: 'الأهداف والخطط', icon: '🎯', desc: 'خطوات التنفيذ ونسب الإنجاز' },
      { id: 'inbox', name: 'صندوق الأفكار السريع', icon: '🧠', desc: 'تفريغ الذهن والتحويل الفوري' }
    ]
  },
  {
    title: '💰 المالية والميزانيات',
    items: [
      { id: 'expenses', name: 'المصروفات اليومية', icon: '💸', desc: 'تتبع المصاريف والبنود والتصنيفات' },
      { id: 'income', name: 'الإيرادات والدخل', icon: '💵', desc: 'سجل الدخل والتدفقات النقدية' },
      { id: 'budget', name: 'الميزانيات والتوقعات', icon: '📊', desc: 'تحديد الميزانيات وحدود الصرف' },
      { id: 'debts', name: 'إدارة الديون والأقساط', icon: '💳', desc: 'الدفعات المجزأة ونسب السداد' },
      { id: 'shopping', name: 'المشتريات والتسوق', icon: '🛒', desc: 'قوائم الشراء والتكلفة التقديرية' }
    ]
  },
  {
    title: '🌿 الصحة ونمط الحياة',
    items: [
      { id: 'health', name: 'الصحة والعافية', icon: '🌿', desc: 'تتبع شرب الماء والمزاج والطاقة والنوم' },
      { id: 'routines', name: 'الروتين اليومي', icon: '⚡', desc: 'روتين الصباح والمساء وسلاسل الالتزام' },
      { id: 'focus', name: 'التركيز الفائق (بومودورو)', icon: '⏱️', desc: 'مؤقت التركيز وأصوات الطبيعة أوفلاين' },
      { id: 'habits', name: 'متتبع العادات', icon: '🔥', desc: 'سلاسل العادات ومعدل الالتزام 30 يوماً' }
    ]
  },
  {
    title: '💼 الدراسة والعمل والمنزل',
    items: [
      { id: 'study', name: 'شؤون الدراسة', icon: '📚', desc: 'المواد والواجبات والعد التنازلي للامتحانات' },
      { id: 'work', name: 'إدارة العمل والورديات', icon: '💼', desc: 'ساعات العمل والمناوبات وسجل الدوام' },
      { id: 'home', name: 'المنزل والمرافق', icon: '🏠', desc: 'غرف المنزل والصيانة والمقتنيات' }
    ]
  },
  {
    title: '🛡️ التوثيق والشخصية والأمان',
    items: [
      { id: 'vault', name: 'خزينة الوثائق المشفرة', icon: '🛡️', desc: 'تشفير AES-256 وتنبيهات الصلاحية' },
      { id: 'notes', name: 'الملاحظات والمسودات', icon: '📝', desc: 'تدوين سريع مع وسوم تصنيف' },
      { id: 'contacts', name: 'جهات الاتصال والمساحات', icon: '👥', desc: 'دليل الأشخاص ومساحات العمل' },
      { id: 'reminders', name: 'التذكيرات والتنبيهات', icon: '🔔', desc: 'محرك الأصوات والتنبيه في الخلفية' }
    ]
  },
  {
    title: '⚙️ التحليلات والنظام',
    items: [
      { id: 'analytics', name: 'التحليلات ومستشار AI', icon: '📈', desc: 'إحصاءات شاملة ونصائح ذكية' },
      { id: 'reports', name: 'التقارير الشاملة والبحث', icon: '📋', desc: 'تصدير التقارير والبحث العميق' },
      { id: 'search', name: 'لوحة الأوامر (Ctrl+K)', icon: '🔍', desc: 'بحث فوري شامل وأوامر سريعة' },
      { id: 'settings', name: 'إعدادات المظهر والأمان', icon: '⚙️', desc: 'الألوان الخمسة، الوضع الليلي وقفل PIN' },
      { id: 'login', name: 'تسجيل الدخول والمزامنة', icon: '👤', desc: 'ربط Google وإدارة المزامنة السحابية' },
      { id: 'theme', name: 'تبديل المظهر (ليلي / نهاري)', icon: '🌓', desc: 'التبديل الفوري للسمة البصرية' }
    ]
  }
];

/**
 * Open the All-Apps Mega Drawer / Bottom Sheet
 */
export function openMoreDrawer() {
  const existing = document.getElementById('lf-more-drawer');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'lf-more-drawer';
  overlay.className = 'modal-overlay';
  overlay.style.alignItems = 'flex-end';
  overlay.style.padding = '0';
  overlay.style.zIndex = 'var(--z-modal)';

  overlay.innerHTML = `
    <div class="modal-content col" dir="rtl" style="width:100%;max-width:100%;border-radius:var(--radius-l) var(--radius-l) 0 0;padding:var(--sp-4) var(--sp-4) calc(env(safe-area-inset-bottom, 0px) + 24px);max-height:88vh;overflow-y:auto;background:var(--surface);box-shadow:0 -10px 40px rgba(0,0,0,0.2);">
      
      <!-- Drawer Handle & Header -->
      <div class="center" style="padding-bottom:12px;cursor:pointer;" id="drawer-handle">
        <div style="width:44px;height:5px;border-radius:3px;background:var(--border-strong);"></div>
      </div>

      <div class="row between" style="margin-bottom:14px;align-items:center;">
        <div class="row" style="gap:10px;align-items:center;">
          <div class="logo-badge" style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg, #0d9488, #0f766e);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;">🗂️</div>
          <div>
            <h3 style="font-size:var(--fs-m);font-weight:800;color:var(--text);margin:0;">كافة أقسام LifeFlow الـ 23</h3>
            <div class="muted" style="font-size:var(--fs-xs);margin-top:2px;">Mega Personal Life OS — بنقرة واحدة</div>
          </div>
        </div>
        <button class="btn ghost sm" id="drawer-close" style="padding:4px 10px;border-radius:50%;font-size:16px;">✕</button>
      </div>

      ${!isStandaloneMode() ? `
        <!-- Prominent Install Option at Top of Drawer -->
        <div class="card install-drawer-card" id="btn-drawer-install" style="margin-bottom:16px;padding:14px 16px;background:linear-gradient(135deg, rgba(13,148,136,0.18), rgba(20,184,166,0.08));border:1.5px solid var(--accent);border-radius:var(--radius-m);box-shadow:0 4px 14px rgba(13,148,136,0.18);cursor:pointer;transition:transform 0.15s ease;">
          <div class="row between" style="align-items:center;">
            <div class="row" style="gap:12px;align-items:center;">
              <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg, #0d9488, #0f766e);color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 3px 10px rgba(13,148,136,0.35);flex-shrink:0;">📲</div>
              <div>
                <div class="strong" style="font-size:var(--fs-s);color:var(--text);font-weight:800;">📲 تثبيت التطبيق على الشاشة الرئيسية</div>
                <div class="muted" style="font-size:11.5px;margin-top:2px;">يعمل كتطبيق هاتف أصلي بدون نت ويدعم الإشعارات ⚡</div>
              </div>
            </div>
            <div class="btn primary sm" style="font-weight:700;padding:6px 14px;border-radius:var(--radius-s);white-space:nowrap;pointer-events:none;background:linear-gradient(135deg, #0d9488, #059669);color:#fff;box-shadow:0 2px 8px rgba(13,148,136,0.3);">تثبيت ⊞</div>
          </div>
        </div>
      ` : ''}

      <!-- Categories & Items Grid -->
      <div class="col" style="gap:20px;">
        ${APP_CATEGORIES.map(cat => `
          <div class="category-group col" style="gap:8px;">
            <div style="font-size:var(--fs-xs);font-weight:800;color:var(--accent);letter-spacing:0.3px;padding-right:4px;">
              ${cat.title}
            </div>
            <div class="grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));gap:8px;">
              ${cat.items.map(item => `
                <button class="drawer-item" data-id="${item.id}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-m);text-align:right;cursor:pointer;transition:var(--tr-fast);font-family:inherit;">
                  <span style="font-size:22px;flex-shrink:0;">${item.icon}</span>
                  <div class="col" style="gap:2px;overflow:hidden;">
                    <span style="font-size:var(--fs-xs);font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</span>
                    <span class="muted" style="font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.desc}</span>
                  </div>
                </button>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#drawer-close').addEventListener('click', close);
  overlay.querySelector('#drawer-handle').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  const drawerInstallBtn = overlay.querySelector('#btn-drawer-install');
  if (drawerInstallBtn) {
    drawerInstallBtn.addEventListener('click', () => {
      close();
      triggerInstall();
    });
  }

  overlay.querySelectorAll('.drawer-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-id');
      close();

      if (id === 'search') {
        openCommandPalette();
      } else if (id === 'sync') {
        openSyncModal();
      } else if (id === 'audio') {
        openAudioCenterModal();
      } else if (id === 'theme') {
        const cur = document.documentElement.getAttribute('data-theme') || 'light';
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        const p = JSON.parse(localStorage.getItem('lf.prefs') || '{}');
        p.theme = next;
        localStorage.setItem('lf.prefs', JSON.stringify(p));
        toast.ok(next === 'dark' ? 'تم تفعيل الوضع الليلي 🌙' : 'تم تفعيل الوضع الفاتح ☀️');
      } else if (navigateCallback) {
        navigateCallback(id);
      }
    });
  });
}

/**
 * Mount the Bottom Navigation Bar in the DOM
 * @param {Function} onNavigate 
 */
export function mountBottomNav(onNavigate) {
  navigateCallback = onNavigate;

  const existing = document.getElementById('lf-bottom-nav');
  if (existing) existing.remove();

  const navEl = document.createElement('nav');
  navEl.id = 'lf-bottom-nav';
  navEl.className = 'bottom-nav-bar';
  navEl.setAttribute('role', 'navigation');
  navEl.setAttribute('aria-label', 'التنقل الرئيسي للجوال');

  navEl.innerHTML = `
    <div class="bottom-nav-inner row between" style="width:100%;max-width:600px;margin:0 auto;height:100%;align-items:center;padding:0 8px;">
      ${PRIMARY_NAV_ITEMS.map(item => `
        <button class="bnav-btn ${item.id === activeView ? 'active' : ''}" data-nav="${item.id}" aria-label="${item.name}">
          <span class="bnav-icon">${item.icon}</span>
          <span class="bnav-label">${item.name}</span>
        </button>
      `).join('')}
    </div>
  `;

  document.body.appendChild(navEl);

  // Attach button events
  navEl.querySelectorAll('.bnav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const navId = btn.getAttribute('data-nav');
      if (navId === 'all-apps') {
        openMoreDrawer();
      } else {
        setActive(navId);
        if (navigateCallback) navigateCallback(navId);
      }
    });
  });
}

/**
 * Update the active tab highlight
 * @param {string} viewId 
 */
export function setActive(viewId) {
  activeView = viewId;
  const navEl = document.getElementById('lf-bottom-nav');
  if (!navEl) return;

  navEl.querySelectorAll('.bnav-btn').forEach(btn => {
    const navId = btn.getAttribute('data-nav');
    if (navId === viewId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

export default {
  mount: mountBottomNav,
  setActive,
  update: setActive,
  openMoreDrawer
};

