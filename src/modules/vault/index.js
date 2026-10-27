/* ============================================================
   LifeFlow — Encrypted Document Vault Module (خزينة الوثائق)
   Personal ID/Passport Storage + Expiry Early Warning Engine
   ============================================================ */

import { db } from '../../core/db.js';
import driveSync from '../../core/drive-sync.js';
import reminders from '../../core/reminders.js';
import cryptoEngine from '../../core/crypto.js';
import { toast } from '../../ui/toast.js';

export const DOC_TYPES = [
  { id: 'passport', name: 'جواز سفر', icon: '🛂' },
  { id: 'national_id', name: 'بطاقة الهوية / الإقامة', icon: '🪪' },
  { id: 'license', name: 'رخصة القيادة', icon: '🚗' },
  { id: 'contract', name: 'عقد إيجار / عمل', icon: '📜' },
  { id: 'insurance', name: 'تأمين صحي / مركبة', icon: '🛡️' },
  { id: 'warranty', name: 'شهادة ضمان وفاتورة', icon: '🧾' },
  { id: 'other', name: 'وثيقة أخرى', icon: '📁' }
];

export async function listVaultItems() {
  const items = await db.list('vault_items', { all: true });
  return items.sort((a, b) => {
    if (!a.expiryDate) return 1;
    if (!b.expiryDate) return -1;
    return a.expiryDate.localeCompare(b.expiryDate);
  });
}

/**
 * Schedule automated 30-day and 7-day expiration alert reminders
 */
async function scheduleDocExpiryAlerts(doc) {
  if (!doc.expiryDate) return;

  const expiryTime = new Date(doc.expiryDate + 'T09:00:00').getTime();
  const now = Date.now();

  // 1. Alert 30 days before expiry
  const t30Days = expiryTime - (30 * 24 * 60 * 60 * 1000);
  if (t30Days > now) {
    await reminders.schedule({
      id: `vault-exp30-${doc.id}`,
      title: `⚠️ اقتراب انتهاء ${doc.name}`,
      body: `متبقي 30 يوماً على انتهاء صلاحية ${doc.name} (${doc.expiryDate}). يرجى المبادرة بالتجديد.`,
      timestamp: t30Days,
      sound: 'alert',
      module: 'vault'
    });
  }

  // 2. Alert 7 days before expiry
  const t7Days = expiryTime - (7 * 24 * 60 * 60 * 1000);
  if (t7Days > now) {
    await reminders.schedule({
      id: `vault-exp7-${doc.id}`,
      title: `🚨 تنبيه حرج: انتهاء ${doc.name} خلال أسبوع!`,
      body: `سينتهي مستند ${doc.name} خلال 7 أيام فقط (${doc.expiryDate}).`,
      timestamp: t7Days,
      sound: 'bell',
      module: 'vault'
    });
  }
}

/**
 * Calculate remaining days to expiration & urgency state
 */
export function getExpiryStatus(expiryDateStr) {
  if (!expiryDateStr) return { days: null, state: 'none', label: 'بدون تاريخ انتهاء' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(expiryDateStr + 'T00:00:00');
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: diffDays, state: 'expired', label: `منتهية منذ ${Math.abs(diffDays)} يوم ❌`, badgeClass: 'danger' };
  } else if (diffDays <= 7) {
    return { days: diffDays, state: 'critical', label: `تنتهي خلال ${diffDays} أيام 🚨`, badgeClass: 'danger' };
  } else if (diffDays <= 30) {
    return { days: diffDays, state: 'warning', label: `تنتهي خلال ${diffDays} يوماً ⏱️`, badgeClass: 'warn' };
  } else {
    return { days: diffDays, state: 'valid', label: `سارية (${diffDays} يوماً متبقية) 🟢`, badgeClass: 'ok' };
  }
}

/**
 * Save new or updated document to Vault
 */
export async function saveVaultItem(item) {
  if (!item.id) {
    item.id = 'vault-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  }

  item.updatedAt = new Date().toISOString();
  await db.put('vault_items', item, { all: true });

  // Schedule automatic early warning notifications
  await scheduleDocExpiryAlerts(item);

  driveSync.notifyDataChanged();
  return item;
}

/**
 * Delete a document from Vault
 */
export async function deleteVaultItem(id) {
  await db.delete('vault_items', id);
  await reminders.cancel(`vault-exp30-${id}`);
  await reminders.cancel(`vault-exp7-${id}`);
  driveSync.notifyDataChanged();
  return true;
}

/**
 * Render Document Vault View
 */
export async function renderVaultView(container) {
  let items = await listVaultItems();

  function openEditModal(existingItem = null) {
    const isNew = !existingItem;
    const item = existingItem || {
      id: null,
      type: 'national_id',
      name: '',
      docNumber: '',
      issueDate: '',
      expiryDate: '',
      issuer: '',
      notes: ''
    };

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');

    overlay.innerHTML = `
      <div class="modal-content" dir="rtl" style="max-width:520px;">
        <div class="modal-header">
          <h3 style="font-size:var(--fs-m);font-weight:700;">
            ${isNew ? 'إضافة وثيقة جديدة للخزينة 🪪' : 'تعديل بيانات الوثيقة ✏️'}
          </h3>
          <button class="btn ghost sm" id="modal-close-btn" style="padding:4px 8px;border-radius:50%;">✕</button>
        </div>

        <div class="modal-body col" style="gap:var(--sp-3);">
          <div class="row wrap" style="gap:10px;">
            <div class="col grow" style="min-width:140px;gap:4px;">
              <label class="muted xs strong">نوع الوثيقة:</label>
              <select id="v-type" class="input" style="padding:8px;border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);">
                ${DOC_TYPES.map(t => `
                  <option value="${t.id}" ${t.id === item.type ? 'selected' : ''}>${t.icon} ${t.name}</option>
                `).join('')}
              </select>
            </div>

            <div class="col grow" style="min-width:180px;gap:4px;">
              <label class="muted xs strong">اسم / مسمى الوثيقة:</label>
              <input type="text" id="v-name" class="input" placeholder="مثال: جواز سفري الخاص" value="${item.name || ''}" style="padding:8px;border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);" />
            </div>
          </div>

          <div class="row wrap" style="gap:10px;">
            <div class="col grow" style="min-width:140px;gap:4px;">
              <label class="muted xs strong">رقم الوثيقة:</label>
              <input type="text" id="v-number" class="input" placeholder="رقم الهوية أو الجواز..." value="${item.docNumber || ''}" dir="ltr" style="font-family:var(--mono);padding:8px;border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);" />
            </div>

            <div class="col grow" style="min-width:140px;gap:4px;">
              <label class="muted xs strong">جهة الإصدار:</label>
              <input type="text" id="v-issuer" class="input" placeholder="مثال: الجوازات / المرور" value="${item.issuer || ''}" style="padding:8px;border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);" />
            </div>
          </div>

          <div class="row wrap" style="gap:10px;">
            <div class="col grow" style="min-width:140px;gap:4px;">
              <label class="muted xs strong">تاريخ الإصدار (اختياري):</label>
              <input type="date" id="v-issue" class="input" value="${item.issueDate || ''}" style="padding:8px;font-family:var(--mono);border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);" />
            </div>

            <div class="col grow" style="min-width:140px;gap:4px;">
              <label class="muted xs strong" style="color:var(--accent);">تاريخ الانتهاء (للتنبيه المبكر):</label>
              <input type="date" id="v-expiry" class="input" value="${item.expiryDate || ''}" style="padding:8px;font-family:var(--mono);border-radius:var(--radius-s);border:1px solid var(--accent);background:var(--surface);" />
            </div>
          </div>

          <div class="col" style="gap:4px;">
            <label class="muted xs strong">ملاحظات سرية إضافية:</label>
            <textarea id="v-notes" class="input" rows="2" placeholder="مكان حفظ الأصل الورقي، شروط الضمان..." style="padding:8px;border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);">${item.notes || ''}</textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn ghost sm" id="modal-cancel-btn">إلغاء</button>
          <button class="btn primary sm" id="modal-save-btn">حفظ في الخزينة المشفرة 🔒</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#modal-close-btn').addEventListener('click', close);
    overlay.querySelector('#modal-cancel-btn').addEventListener('click', close);

    overlay.querySelector('#modal-save-btn').addEventListener('click', async () => {
      const name = overlay.querySelector('#v-name').value.trim();
      if (!name) {
        toast.warn('يرجى إدخال اسم للوثيقة.');
        return;
      }

      item.name = name;
      item.type = overlay.querySelector('#v-type').value;
      item.docNumber = overlay.querySelector('#v-number').value.trim();
      item.issuer = overlay.querySelector('#v-issuer').value.trim();
      item.issueDate = overlay.querySelector('#v-issue').value;
      item.expiryDate = overlay.querySelector('#v-expiry').value;
      item.notes = overlay.querySelector('#v-notes').value.trim();

      await saveVaultItem(item);
      toast.ok('تم حفظ وتأمين الوثيقة بنجاح وجدولة التنبيهات المبكرة!');
      close();
      items = await listVaultItems();
      render();
    });
  }

  function render() {
    const expiredCount = items.filter(it => getExpiryStatus(it.expiryDate).state === 'expired').length;
    const warningCount = items.filter(it => ['critical', 'warning'].includes(getExpiryStatus(it.expiryDate).state)).length;

    container.innerHTML = `
      <div class="col" style="gap:var(--sp-5);">
        <!-- Title & Add Button -->
        <div class="row between wrap" style="gap:12px;">
          <div>
            <h2 style="font-size:var(--fs-xl);font-weight:800;">خزينة الوثائق والمستندات المشفرة 🛡️</h2>
            <p class="muted small" style="margin-top:2px;">حفظ المستندات الرسمية مع نظام إنذار مبكر تلقائي قبل انتهاء الصلاحية</p>
          </div>

          <button class="btn primary sm" id="btn-add-doc">
            + إضافة وثيقة جديدة
          </button>
        </div>

        <!-- Metrics & Early Warning Alert Banner -->
        ${warningCount > 0 || expiredCount > 0 ? `
          <div class="banner ${expiredCount > 0 ? 'warn' : 'info'}">
            <span style="font-size:20px;">${expiredCount > 0 ? '⚠️' : '🔔'}</span>
            <div class="grow">
              <strong>نظام الإنذار المبكر:</strong>
              لديك ${expiredCount > 0 ? `<strong style="color:var(--danger);">${expiredCount} وثائق منتهية</strong> و ` : ''}
              ${warningCount} وثيقة تقترب صلاحيتها من الانتهاء خلال 30 يوماً.
            </div>
          </div>
        ` : ''}

        <!-- Documents Grid -->
        ${items.length === 0 ? `
          <div class="card center col" style="padding:48px 24px;text-align:center;gap:12px;">
            <div style="font-size:48px;">📂</div>
            <h3 style="font-weight:700;">خزينتك فارغة حالياً</h3>
            <p class="muted small" style="max-width:380px;">
              أضف بطاقة الهوية، جواز السفر، عقود الإيجار، أو وثائق التأمين لتأمينها وتلقي تنبيهات مبكرة قبل انتهائها.
            </p>
            <button class="btn primary sm" id="btn-empty-add-doc">+ إضافة أول وثيقة الآن</button>
          </div>
        ` : `
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(310px, 1fr));gap:var(--sp-4);">
            ${items.map(doc => {
              const typeDef = DOC_TYPES.find(t => t.id === doc.type) || DOC_TYPES[6];
              const expiryInfo = getExpiryStatus(doc.expiryDate);

              return `
                <div class="card col between" style="gap:14px;border-top:4px solid ${expiryInfo.state === 'expired' || expiryInfo.state === 'critical' ? 'var(--danger)' : expiryInfo.state === 'warning' ? 'var(--warn)' : 'var(--accent)'};">
                  <div class="col" style="gap:10px;">
                    <div class="row between">
                      <div class="row" style="gap:10px;">
                        <span style="font-size:26px;">${typeDef.icon}</span>
                        <div>
                          <h4 class="strong small">${doc.name}</h4>
                          <span class="muted xs">${typeDef.name}</span>
                        </div>
                      </div>
                      <span class="badge ${expiryInfo.badgeClass || 'info'} xs">
                        ${expiryInfo.label}
                      </span>
                    </div>

                    ${doc.docNumber ? `
                      <div class="row between" style="padding:6px 10px;background:var(--surface-2);border-radius:var(--radius-s);font-size:var(--fs-xs);">
                        <span class="muted">الرقم:</span>
                        <span class="strong" style="font-family:var(--mono);" dir="ltr">${doc.docNumber}</span>
                      </div>
                    ` : ''}

                    <div class="row between" style="font-size:11px;color:var(--text-muted);">
                      <span>جهة الإصدار: ${doc.issuer || 'غير محدد'}</span>
                      <span>الانتهاء: ${doc.expiryDate || 'مفتوح'}</span>
                    </div>

                    ${doc.notes ? `
                      <p class="muted xs" style="background:var(--surface-2);padding:6px 8px;border-radius:6px;margin:0;">
                        📝 ${doc.notes}
                      </p>
                    ` : ''}
                  </div>

                  <!-- Card Actions -->
                  <div class="row between" style="padding-top:8px;border-top:1px solid var(--border);">
                    <button class="btn ghost sm btn-edit-doc" data-id="${doc.id}">
                      تعديل ✏️
                    </button>
                    <button class="btn ghost sm btn-del-doc" data-id="${doc.id}" style="color:var(--danger);">
                      حذف 🗑️
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const addBtn = container.querySelector('#btn-add-doc');
    if (addBtn) addBtn.addEventListener('click', () => openEditModal());

    const emptyAddBtn = container.querySelector('#btn-empty-add-doc');
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', () => openEditModal());

    container.querySelectorAll('.btn-edit-doc').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const doc = items.find(d => d.id === id);
        if (doc) openEditModal(doc);
      });
    });

    container.querySelectorAll('.btn-del-doc').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('هل أنت متأكد من حذف هذه الوثيقة من الخزينة؟')) {
          await deleteVaultItem(id);
          toast.info('تم حذف الوثيقة.');
          items = await listVaultItems();
          render();
        }
      });
    });
  }

  render();
}

export default {
  render: renderVaultView,
  list: listVaultItems,
  save: saveVaultItem,
  delete: deleteVaultItem
};
