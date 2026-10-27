/* ============================================================
   LifeFlow — Command Palette & Universal Global Search
   Desktop (Ctrl+K) & Mobile Fullscreen Instant Search & Commands
   ============================================================ */

import { db } from '../core/db.js';
import { ambientEngine } from '../modules/focus/index.js';
import driveSync from '../core/drive-sync.js';
import { toast } from './toast.js';

let isOpen = false;
let currentQuery = '';

export function isCommandPaletteOpen() {
  return isOpen;
}

const STATIC_COMMANDS = [
  { id: 'cmd-pomodoro', title: 'بدء مؤقت بومودورو (25 دقيقة)', category: 'تركيز', icon: '⏱️', action: () => { window.location.hash = '#view=focus'; } },
  { id: 'cmd-rain', title: 'تشغيل صوت المطر الهادئ', category: 'أصوات', icon: '🌧️', action: () => { ambientEngine.play('rain'); toast.ok('تم تشغيل صوت المطر 🌧️'); } },
  { id: 'cmd-waves', title: 'تشغيل صوت أمواج البحر', category: 'أصوات', icon: '🌊', action: () => { ambientEngine.play('waves'); toast.ok('تم تشغيل أمواج البحر 🌊'); } },
  { id: 'cmd-brown', title: 'تشغيل الضوضاء البنية العميقة', category: 'أصوات', icon: '☕', action: () => { ambientEngine.play('brown'); toast.ok('تم تشغيل الضوضاء البنية ☕'); } },
  { id: 'cmd-stop-audio', title: 'إيقاف الأصوات المحيطية', category: 'أصوات', icon: '⏹️', action: () => { ambientEngine.stop(); toast.info('تم إيقاف الصوت.'); } },
  { id: 'cmd-water', title: 'تسجيل شرب كوب ماء (+250 مل)', category: 'صحة', icon: '💧', action: async () => {
    const today = new Date().toISOString().slice(0, 10);
    const logs = await db.list('health_logs', { all: true, predicate: r => r.date === today });
    const log = logs[0] || { id: 'health-' + today, date: today, waterCurrent: 0, waterTarget: 2500, waterHistory: [] };
    log.waterCurrent += 250;
    log.waterHistory = log.waterHistory || [];
    log.waterHistory.push({ amount: 250, time: new Date().toISOString() });
    await db.put('health_logs', log, { all: true });
    driveSync.notifyDataChanged();
    toast.ok('تمت إضافة 250 مل ماء بنجاح! 💧');
  }},
  { id: 'cmd-sync', title: 'مزامنة سحابية فورية مع Google Drive', category: 'نظام', icon: '☁️', action: () => { driveSync.sync(); toast.info('جارٍ بدء المزامنة السحابية...'); } },
  { id: 'cmd-toggle-theme', title: 'تبديل المظهر (ليلي / نهاري)', category: 'مظهر', icon: '🌓', action: () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    const p = JSON.parse(localStorage.getItem('lf.prefs') || '{}');
    p.theme = next;
    localStorage.setItem('lf.prefs', JSON.stringify(p));
    toast.ok(next === 'dark' ? 'تم تفعيل الوضع الليلي 🌙' : 'تم تفعيل الوضع الفاتح ☀️');
  }},
  { id: 'nav-dashboard', title: 'الانتقال إلى: لوحة التحكم الرئيسية', category: 'تنقل', icon: '📊', action: () => { window.location.hash = '#view=dashboard'; } },
  { id: 'nav-myday', title: 'الانتقال إلى: يومي والتركيز اليومي', category: 'تنقل', icon: '⭐', action: () => { window.location.hash = '#view=myday'; } },
  { id: 'nav-tasks', title: 'الانتقال إلى: المهام والمشاريع', category: 'تنقل', icon: '✔️', action: () => { window.location.hash = '#view=tasks'; } },
  { id: 'nav-projects', title: 'الانتقال إلى: المشاريع', category: 'تنقل', icon: '📁', action: () => { window.location.hash = '#view=projects'; } },
  { id: 'nav-calendar', title: 'الانتقال إلى: التقويم والمناسبات', category: 'تنقل', icon: '📅', action: () => { window.location.hash = '#view=calendar'; } },
  { id: 'nav-goals', title: 'الانتقال إلى: الأهداف والخطط', category: 'تنقل', icon: '🎯', action: () => { window.location.hash = '#view=goals'; } },
  { id: 'nav-expenses', title: 'الانتقال إلى: المصروفات والمالية', category: 'تنقل', icon: '💸', action: () => { window.location.hash = '#view=expenses'; } },
  { id: 'nav-income', title: 'الانتقال إلى: الإيرادات والدخل', category: 'تنقل', icon: '💵', action: () => { window.location.hash = '#view=income'; } },
  { id: 'nav-budget', title: 'الانتقال إلى: الميزانيات والتوقعات', category: 'تنقل', icon: '📊', action: () => { window.location.hash = '#view=budget'; } },
  { id: 'nav-debts', title: 'الانتقال إلى: إدارة الديون والأقساط', category: 'تنقل', icon: '💳', action: () => { window.location.hash = '#view=debts'; } },
  { id: 'nav-shopping', title: 'الانتقال إلى: المشتريات والتسوق', category: 'تنقل', icon: '🛒', action: () => { window.location.hash = '#view=shopping'; } },
  { id: 'nav-health', title: 'الانتقال إلى: الصحة والعافية', category: 'تنقل', icon: '🌿', action: () => { window.location.hash = '#view=health'; } },
  { id: 'nav-routines', title: 'الانتقال إلى: الروتين اليومي', category: 'تنقل', icon: '⚡', action: () => { window.location.hash = '#view=routines'; } },
  { id: 'nav-focus', title: 'الانتقال إلى: التركيز وبومودورو', category: 'تنقل', icon: '⏱️', action: () => { window.location.hash = '#view=focus'; } },
  { id: 'nav-habits', title: 'الانتقال إلى: متتبع العادات', category: 'تنقل', icon: '🔥', action: () => { window.location.hash = '#view=habits'; } },
  { id: 'nav-vault', title: 'الانتقال إلى: خزينة الوثائق المشفرة', category: 'تنقل', icon: '🛡️', action: () => { window.location.hash = '#view=vault'; } },
  { id: 'nav-inbox', title: 'الانتقال إلى: صندوق تفريغ الأفكار', category: 'تنقل', icon: '🧠', action: () => { window.location.hash = '#view=inbox'; } },
  { id: 'nav-study', title: 'الانتقال إلى: شؤون الدراسة والمذاكرة', category: 'تنقل', icon: '📚', action: () => { window.location.hash = '#view=study'; } },
  { id: 'nav-work', title: 'الانتقال إلى: إدارة العمل والورديات', category: 'تنقل', icon: '💼', action: () => { window.location.hash = '#view=work'; } },
  { id: 'nav-home', title: 'الانتقال إلى: إدارة المنزل والمرافق', category: 'تنقل', icon: '🏠', action: () => { window.location.hash = '#view=home'; } },
  { id: 'nav-notes', title: 'الانتقال إلى: الملاحظات والمسودات', category: 'تنقل', icon: '📝', action: () => { window.location.hash = '#view=notes'; } },
  { id: 'nav-reminders', title: 'الانتقال إلى: التذكيرات والتنبيهات', category: 'تنقل', icon: '🔔', action: () => { window.location.hash = '#view=reminders'; } },
  { id: 'nav-reports', title: 'الانتقال إلى: التقارير الشاملة والبحث', category: 'تنقل', icon: '📋', action: () => { window.location.hash = '#view=reports'; } },
  { id: 'nav-contacts', title: 'الانتقال إلى: جهات الاتصال والمساحات', category: 'تنقل', icon: '👥', action: () => { window.location.hash = '#view=contacts'; } },
  { id: 'nav-analytics', title: 'الانتقال إلى: التحليلات ومستشار AI', category: 'تنقل', icon: '📈', action: () => { window.location.hash = '#view=analytics'; } },
  { id: 'nav-settings', title: 'الانتقال إلى: إعدادات المظهر والأمان', category: 'تنقل', icon: '⚙️', action: () => { window.location.hash = '#view=settings'; } },
  { id: 'nav-login', title: 'الانتقال إلى: تسجيل الدخول والمزامنة', category: 'تنقل', icon: '👤', action: () => { window.location.hash = '#view=login'; } }
];

/**
 * Perform live fuzzy search across all stores
 */
async function searchAllStores(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();

  const [tasks, expenses, vault, inbox] = await Promise.all([
    db.list('tasks', { all: true }),
    db.list('expenses', { all: true }),
    db.list('vault_items', { all: true }),
    db.list('inbox_items', { all: true })
  ]);

  const results = [];

  tasks.forEach(t => {
    if ((t.title && t.title.toLowerCase().includes(q)) || (t.notes && t.notes.toLowerCase().includes(q))) {
      results.push({
        id: 't-' + t.id,
        title: t.title,
        sub: `مهمة • ${t.date || 'بدون تاريخ'} • ${t.priority || 'عادي'}`,
        icon: '✔️',
        action: () => { window.location.hash = '#view=dashboard'; }
      });
    }
  });

  expenses.forEach(e => {
    if ((e.title && e.title.toLowerCase().includes(q)) || (e.categoryId && e.categoryId.toLowerCase().includes(q))) {
      results.push({
        id: 'e-' + e.id,
        title: e.title,
        sub: `مصروف • ${e.amount || 0} ر.س • ${e.date || ''}`,
        icon: '💰',
        action: () => { window.location.hash = '#view=dashboard'; }
      });
    }
  });

  vault.forEach(v => {
    if ((v.name && v.name.toLowerCase().includes(q)) || (v.docNumber && v.docNumber.toLowerCase().includes(q))) {
      results.push({
        id: 'v-' + v.id,
        title: v.name,
        sub: `وثيقة بالخزينة • رقم: ${v.docNumber || 'غير مسجل'} • انتهاء: ${v.expiryDate || ''}`,
        icon: '🛡️',
        action: () => { window.location.hash = '#view=vault'; }
      });
    }
  });

  inbox.forEach(i => {
    if (i.text && i.text.toLowerCase().includes(q)) {
      results.push({
        id: 'i-' + i.id,
        title: i.text,
        sub: `فكرة بصندوق الوارد • ${new Date(i.createdAt).toLocaleDateString('ar-EG')}`,
        icon: '🧠',
        action: () => { window.location.hash = '#view=inbox'; }
      });
    }
  });

  return results;
}

/**
 * Open the Command Palette Dialog
 */
export function openCommandPalette() {
  if (isOpen) return;
  isOpen = true;

  // Remove existing
  const old = document.getElementById('lf-cmd-palette');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'lf-cmd-palette';
  overlay.className = 'modal-overlay';
  overlay.style.alignItems = 'flex-start';
  overlay.style.paddingTop = '10vh';
  overlay.style.background = 'rgba(10, 20, 18, 0.65)';
  overlay.style.backdropFilter = 'blur(10px)';

  overlay.innerHTML = `
    <div class="modal-content col" dir="rtl" style="max-width:580px;border-radius:var(--radius-l);box-shadow:var(--shadow-lg);padding:0;overflow:hidden;background:var(--surface);">
      <!-- Search Input Header -->
      <div class="row" style="padding:14px 18px;border-bottom:1px solid var(--border);gap:12px;align-items:center;">
        <span style="font-size:20px;color:var(--text-muted);flex:none;">🔍</span>
        <input type="text" id="cmd-input" class="grow" placeholder="ابحث في المهام، المصروفات، الوثائق، أو اختر أمراً سريعاً..." autofocus style="border:none;outline:none;background:transparent;font-size:var(--fs-m);font-family:inherit;color:var(--text);" />
        <button class="btn ghost sm" id="cmd-close" style="padding:4px 8px;border-radius:var(--radius-s);font-size:12px;">Esc</button>
      </div>

      <!-- Results & Commands List -->
      <div id="cmd-results" style="max-height:60vh;overflow-y:auto;padding:8px;">
        <!-- Injected dynamically -->
      </div>

      <!-- Palette Footer -->
      <div class="row between" style="padding:8px 18px;background:var(--surface-2);border-top:1px solid var(--border);font-size:11px;color:var(--text-faint);">
        <div class="row" style="gap:6px;">
          <span>↑↓ للتنقل</span>
          <span>•</span>
          <span>Enter للتنفيذ</span>
        </div>
        <span>LifeFlow Command Palette ⚡</span>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const input = overlay.querySelector('#cmd-input');
  const resultsContainer = overlay.querySelector('#cmd-results');
  let selectedIndex = 0;
  let itemsList = [];

  const close = () => {
    isOpen = false;
    overlay.remove();
  };

  overlay.querySelector('#cmd-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  const renderList = async (query = '') => {
    resultsContainer.innerHTML = '';
    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
      // Show default commands
      itemsList = STATIC_COMMANDS;
      resultsContainer.innerHTML = `
        <div class="muted xs strong" style="padding:6px 10px;">أوامر وإجراءات سريعة:</div>
        ${STATIC_COMMANDS.map((cmd, i) => `
          <div class="row between cmd-item ${i === selectedIndex ? 'selected' : ''}" data-idx="${i}" style="padding:10px 14px;border-radius:var(--radius-m);cursor:pointer;background:${i === selectedIndex ? 'var(--accent-soft)' : 'transparent'};color:${i === selectedIndex ? 'var(--accent)' : 'var(--text)'};">
            <div class="row" style="gap:10px;">
              <span style="font-size:18px;">${cmd.icon}</span>
              <span class="strong small">${cmd.title}</span>
            </div>
            <span class="badge ghost xs">${cmd.category}</span>
          </div>
        `).join('')}
      `;
    } else {
      // Filter commands + search database
      const filteredCommands = STATIC_COMMANDS.filter(c => c.title.toLowerCase().includes(trimmed));
      const dbResults = await searchAllStores(trimmed);

      itemsList = [...filteredCommands, ...dbResults];

      if (itemsList.length === 0) {
        resultsContainer.innerHTML = `
          <div class="center col" style="padding:32px 16px;text-align:center;gap:6px;">
            <span style="font-size:28px;">🔍</span>
            <div class="strong small">لا توجد نتائج مطابقة لـ "${query}"</div>
            <div class="muted xs">جرّب كلمة بحث مختلفة أو استخدم صندوق الأفكار السريع.</div>
          </div>
        `;
        return;
      }

      resultsContainer.innerHTML = `
        ${filteredCommands.length > 0 ? `
          <div class="muted xs strong" style="padding:6px 10px;">أوامر النظام:</div>
          ${filteredCommands.map((cmd, i) => `
            <div class="row between cmd-item ${i === selectedIndex ? 'selected' : ''}" data-idx="${i}" style="padding:10px 14px;border-radius:var(--radius-m);cursor:pointer;background:${i === selectedIndex ? 'var(--accent-soft)' : 'transparent'};">
              <div class="row" style="gap:10px;">
                <span style="font-size:18px;">${cmd.icon}</span>
                <span class="strong small">${cmd.title}</span>
              </div>
              <span class="badge ghost xs">${cmd.category}</span>
            </div>
          `).join('')}
        ` : ''}

        ${dbResults.length > 0 ? `
          <div class="muted xs strong" style="padding:10px 10px 6px;">نتائج البحث في بياناتك:</div>
          ${dbResults.map((res, i) => {
            const actualIdx = filteredCommands.length + i;
            return `
              <div class="row between cmd-item ${actualIdx === selectedIndex ? 'selected' : ''}" data-idx="${actualIdx}" style="padding:10px 14px;border-radius:var(--radius-m);cursor:pointer;background:${actualIdx === selectedIndex ? 'var(--accent-soft)' : 'transparent'};">
                <div class="row" style="gap:10px;">
                  <span style="font-size:18px;">${res.icon}</span>
                  <div>
                    <div class="strong small">${res.title}</div>
                    <div class="muted xs">${res.sub}</div>
                  </div>
                </div>
                <span class="muted xs">فتح ➔</span>
              </div>
            `;
          }).join('')}
        ` : ''}
      `;
    }

    // Attach click handlers
    resultsContainer.querySelectorAll('.cmd-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = Number(el.getAttribute('data-idx'));
        if (itemsList[idx] && itemsList[idx].action) {
          itemsList[idx].action();
          close();
        }
      });
    });
  };

  input.addEventListener('input', () => {
    selectedIndex = 0;
    renderList(input.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(itemsList.length - 1, selectedIndex + 1);
      renderList(input.value);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(0, selectedIndex - 1);
      renderList(input.value);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (itemsList[selectedIndex] && itemsList[selectedIndex].action) {
        itemsList[selectedIndex].action();
        close();
      }
    } else if (e.key === 'Escape') {
      close();
    }
  });

  renderList();
  setTimeout(() => input.focus(), 40);
}

/**
 * Initialize Desktop Shortcut (Ctrl+K / Cmd+K)
 */
export function initCommandPaletteShortcuts() {
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (isOpen) {
        const modal = document.getElementById('lf-cmd-palette');
        if (modal) modal.remove();
        isOpen = false;
      } else {
        openCommandPalette();
      }
    }
  });
}

export default {
  open: openCommandPalette,
  init: initCommandPaletteShortcuts,
  isOpen: isCommandPaletteOpen
};
