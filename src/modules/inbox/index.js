/* ============================================================
   LifeFlow — Quick Brain Dump Inbox Module (تفريغ الأفكار)
   Ultra-fast Capture + One-Click Conversion to Task/Expense/Event/Note
   ============================================================ */

import { db } from '../../core/db.js';
import driveSync from '../../core/drive-sync.js';
import { toast } from '../../ui/toast.js';

export async function listInboxItems() {
  const items = await db.list('inbox_items', {
    all: true,
    predicate: (i) => i.status !== 'archived'
  });
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addInboxItem(text) {
  if (!text || !text.trim()) return null;
  const item = {
    id: 'inbox-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    text: text.trim(),
    status: 'inbox', // 'inbox' | 'converted' | 'archived'
    createdAt: new Date().toISOString()
  };
  await db.put('inbox_items', item, { all: true });
  driveSync.notifyDataChanged();
  return item;
}

export async function deleteInboxItem(id) {
  await db.delete('inbox_items', id);
  driveSync.notifyDataChanged();
  return true;
}

/**
 * 1-Click Convert an Inbox Thought into a Real Application Entity
 */
export async function convertInboxItem(id, targetType, extraData = {}) {
  const item = await db.get('inbox_items', id);
  if (!item) return false;

  const today = new Date().toISOString().slice(0, 10);

  if (targetType === 'task') {
    // ➔ Convert to Task
    const task = {
      id: 'task-' + Date.now().toString(36),
      title: item.text,
      priority: extraData.priority || 'medium',
      date: extraData.date || today,
      status: 'todo',
      createdAt: new Date().toISOString()
    };
    await db.put('tasks', task, { all: true });
    toast.ok('✔️ تم تحويل الفكرة إلى مهمة عمل في قائمة المهام!');
  } else if (targetType === 'expense') {
    // ➔ Convert to Expense
    const expense = {
      id: 'exp-' + Date.now().toString(36),
      title: item.text,
      amount: extraData.amount || 0,
      categoryId: extraData.categoryId || 'general',
      date: today,
      createdAt: new Date().toISOString()
    };
    await db.put('expenses', expense, { all: true });
    toast.ok(`💰 تم تحويل الفكرة إلى مصروف بقيمة ${expense.amount} في سجل المصروفات!`);
  } else if (targetType === 'event') {
    // ➔ Convert to Calendar Event
    const event = {
      id: 'ev-' + Date.now().toString(36),
      title: item.text,
      date: extraData.date || today,
      time: extraData.time || '10:00',
      type: 'appointment',
      createdAt: new Date().toISOString()
    };
    await db.put('events', event, { all: true });
    toast.ok('📅 تم إدراج الفكرة كموعد في التقويم!');
  } else if (targetType === 'note') {
    // ➔ Convert to Note
    const note = {
      id: 'note-' + Date.now().toString(36),
      title: item.text.slice(0, 40),
      body: item.text,
      createdAt: new Date().toISOString()
    };
    await db.put('notes', note, { all: true });
    toast.ok('📝 تم حفظ الفكرة كملاحظة دائمة في دفتر الملاحظات!');
  }

  // Update inbox item status
  item.status = 'converted';
  item.convertedTo = targetType;
  item.convertedAt = new Date().toISOString();
  await db.put('inbox_items', item, { all: true });

  driveSync.notifyDataChanged();
  return true;
}

/**
 * Render Brain Dump Inbox View
 */
export async function renderInboxView(container) {
  let items = await listInboxItems();

  function openExpenseConvertModal(item) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content" dir="rtl" style="max-width:400px;">
        <div class="modal-header">
          <h3 style="font-size:var(--fs-m);font-weight:700;">تحويل إلى مصروف مالي 💰</h3>
          <button class="btn ghost sm" id="exp-close" style="padding:4px 8px;border-radius:50%;">✕</button>
        </div>
        <div class="modal-body col" style="gap:12px;">
          <div class="muted small">الفكرة: <strong>${item.text}</strong></div>
          <div class="col" style="gap:4px;">
            <label class="muted xs strong">المبلغ المصروف:</label>
            <input type="number" id="exp-amount" class="input" placeholder="0.00" autofocus style="padding:10px;font-size:18px;font-weight:700;font-family:var(--mono);" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn ghost sm" id="exp-cancel">إلغاء</button>
          <button class="btn primary sm" id="exp-confirm">تأكيد وتسجيل المصروف</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#exp-close').addEventListener('click', close);
    overlay.querySelector('#exp-cancel').addEventListener('click', close);

    overlay.querySelector('#exp-confirm').addEventListener('click', async () => {
      const amount = parseFloat(overlay.querySelector('#exp-amount').value) || 0;
      close();
      await convertInboxItem(item.id, 'expense', { amount });
      items = await listInboxItems();
      render();
    });
  }

  function render() {
    const pendingItems = items.filter(i => i.status === 'inbox');
    const convertedItems = items.filter(i => i.status === 'converted');

    container.innerHTML = `
      <div class="col" style="gap:var(--sp-5);">
        <!-- Title & Subtitle -->
        <div class="row between wrap" style="gap:12px;">
          <div>
            <h2 style="font-size:var(--fs-xl);font-weight:800;">صندوق تفريغ الأفكار السريع 🧠</h2>
            <p class="muted small" style="margin-top:2px;">فرّغ أي فكرة تخطر ببالك في ثوانٍ، وعالجها لاحقاً بنقرة واحدة</p>
          </div>
          <span class="badge accent">${pendingItems.length} أفكار بانتظار المعالجة</span>
        </div>

        <!-- Rapid Capture Input Bar -->
        <div class="card" style="padding:var(--sp-4);background:linear-gradient(135deg, var(--surface) 80%, rgba(13, 148, 136, 0.08));border:2px solid var(--accent-soft);">
          <div class="row" style="gap:10px;">
            <div style="font-size:24px;flex:none;">💡</div>
            <input type="text" id="rapid-inbox-input" class="input grow" placeholder="اكتب أي فكرة أو مهمة أو خاطر طارئ ثم اضغط Enter..." autofocus style="padding:12px 16px;border-radius:var(--radius-s);font-size:var(--fs-m);border:1px solid var(--border);background:var(--surface);" />
            <button class="btn primary" id="btn-rapid-save" style="padding:10px 24px;">
              حفظ الخاطر ⚡
            </button>
          </div>
        </div>

        <!-- Pending Items Section -->
        <div class="col" style="gap:var(--sp-3);">
          <div class="row between">
            <span class="strong small muted">الأفكار المحفوظة للمعالجة:</span>
            <span class="xs faint">حوّل الفكرة بنقرة واحدة إلى المكان المناسب</span>
          </div>

          ${pendingItems.length === 0 ? `
            <div class="card center col" style="padding:36px 16px;text-align:center;gap:8px;">
              <div style="font-size:36px;">🍃</div>
              <h4 class="strong small">ذهنك صافٍ تماماً!</h4>
              <p class="muted xs">لا توجد أفكار عالقة في صندوق الوارد. استخدم الشريط أعلاه لتفريغ أي فكرة جديدة.</p>
            </div>
          ` : `
            <div class="col" style="gap:10px;">
              ${pendingItems.map(item => `
                <div class="card col" style="gap:10px;padding:14px 16px;">
                  <div class="row between">
                    <span class="strong" style="font-size:var(--fs-m);">${item.text}</span>
                    <button class="icon-btn btn-del-inbox" data-id="${item.id}" title="حذف" style="background:none;border:none;cursor:pointer;color:var(--text-faint);padding:4px;">
                      ✕
                    </button>
                  </div>

                  <!-- 1-Click Action Conversion Buttons -->
                  <div class="row wrap" style="gap:8px;padding-top:8px;border-top:1px solid var(--border);">
                    <span class="muted xs" style="align-self:center;">تحويل إلى:</span>
                    <button class="btn ghost sm btn-conv-task" data-id="${item.id}" style="font-size:12px;">
                      ✔️ مهمة عمل
                    </button>
                    <button class="btn ghost sm btn-conv-expense" data-id="${item.id}" style="font-size:12px;">
                      💰 مصروف مالي
                    </button>
                    <button class="btn ghost sm btn-conv-event" data-id="${item.id}" style="font-size:12px;">
                      📅 موعد بالتقويم
                    </button>
                    <button class="btn ghost sm btn-conv-note" data-id="${item.id}" style="font-size:12px;">
                      📝 ملاحظة دائمة
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Processed / Converted Items Archive -->
        ${convertedItems.length > 0 ? `
          <div class="col" style="gap:var(--sp-2);margin-top:var(--sp-4);">
            <div class="row between">
              <span class="muted xs strong">أفكار تمت معالجتها ونقلها (${convertedItems.length}):</span>
            </div>
            <div class="col" style="gap:6px;">
              ${convertedItems.slice(0, 5).map(item => `
                <div class="row between" style="padding:8px 12px;background:var(--surface-2);border-radius:var(--radius-s);font-size:var(--fs-xs);opacity:0.75;">
                  <span class="truncate" style="text-decoration:line-through;">${item.text}</span>
                  <span class="badge ok xs">تم النقل إلى ${item.convertedTo}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const input = container.querySelector('#rapid-inbox-input');

    const handleSave = async () => {
      const text = input.value.trim();
      if (!text) return;
      await addInboxItem(text);
      input.value = '';
      toast.ok('⚡ تم تفريغ الفكرة بنجاح في صندوق الوارد!');
      items = await listInboxItems();
      render();
    };

    container.querySelector('#btn-rapid-save').addEventListener('click', handleSave);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSave();
    });

    // Delete
    container.querySelectorAll('.btn-del-inbox').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await deleteInboxItem(id);
        toast.info('تم حذف العنصر.');
        items = await listInboxItems();
        render();
      });
    });

    // Convert to Task
    container.querySelectorAll('.btn-conv-task').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await convertInboxItem(id, 'task');
        items = await listInboxItems();
        render();
      });
    });

    // Convert to Expense
    container.querySelectorAll('.btn-conv-expense').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = items.find(i => i.id === id);
        if (item) openExpenseConvertModal(item);
      });
    });

    // Convert to Event
    container.querySelectorAll('.btn-conv-event').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await convertInboxItem(id, 'event');
        items = await listInboxItems();
        render();
      });
    });

    // Convert to Note
    container.querySelectorAll('.btn-conv-note').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await convertInboxItem(id, 'note');
        items = await listInboxItems();
        render();
      });
    });
  }

  render();
}

export default {
  render: renderInboxView,
  add: addInboxItem,
  list: listInboxItems,
  convert: convertInboxItem,
  delete: deleteInboxItem
};
