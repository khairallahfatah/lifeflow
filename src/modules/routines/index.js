/* ============================================================
   LifeFlow — Routines Module (الروتين المتسلسل)
   Morning & Evening Habitual Sequences to Beat Decision Fatigue
   ============================================================ */

import { db } from '../../core/db.js';
import driveSync from '../../core/drive-sync.js';
import reminders from '../../core/reminders.js';
import { toast } from '../../ui/toast.js';

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_MORNING_STEPS = [
  { id: 'm1', text: 'أذكار الصباح والاستغفار 🤲', done: false },
  { id: 'm2', text: 'شرب كوب كبير من الماء 💧', done: false },
  { id: 'm3', text: 'ترتيب السرير وتهوية الغرفة 🛏️', done: false },
  { id: 'm4', text: 'قراءة مفيدة لمدة 10 دقائق 📖', done: false },
  { id: 'm5', text: 'تحديد 3 أولويات رئيسية لليوم 🎯', done: false }
];

const DEFAULT_EVENING_STEPS = [
  { id: 'e1', text: 'مراجعة وتقييم إنجازات اليوم 📝', done: false },
  { id: 'e2', text: 'تفريغ العقل من أي مهام عالقة 🧠', done: false },
  { id: 'e3', text: 'تجهيز الملابس وترتيب المكتب للغد 👔', done: false },
  { id: 'e4', text: 'إيقاف الشاشات والأجهزة الإلكترونية 📵', done: false },
  { id: 'e5', text: 'أذكار النوم والاسترخاء 🌙', done: false }
];

export async function getRoutineRecord(type = 'morning') {
  const today = getTodayKey();
  const id = `routine-${type}`;
  let rec = await db.get('routines', id);

  if (!rec) {
    rec = {
      id,
      type, // 'morning' | 'evening'
      title: type === 'morning' ? 'روتين الصباح المشرق ☀️' : 'روتين المساء الهادئ 🌙',
      reminderTime: type === 'morning' ? '06:30' : '22:00',
      reminderActive: false,
      streak: 0,
      lastCompletedDate: null,
      steps: type === 'morning' ? DEFAULT_MORNING_STEPS : DEFAULT_EVENING_STEPS,
      date: today
    };
    await db.put('routines', rec, { all: true });
  }

  // Daily Reset check: If today is a new day, reset checks for the day
  if (rec.date !== today) {
    const wasCompletedYesterday = rec.steps.every(s => s.done);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (wasCompletedYesterday && rec.date === yesterday) {
      rec.streak = (rec.streak || 0) + 1;
    } else if (rec.date !== yesterday) {
      rec.streak = 0; // streak broken
    }

    rec.date = today;
    rec.steps = rec.steps.map(s => ({ ...s, done: false }));
    await db.put('routines', rec, { all: true });
    driveSync.notifyDataChanged();
  }

  return rec;
}

export async function saveRoutineRecord(rec) {
  rec.updatedAt = new Date().toISOString();
  await db.put('routines', rec, { all: true });
  driveSync.notifyDataChanged();
  return rec;
}

/**
 * Toggle reminder for routine
 */
export async function toggleRoutineReminder(type, active) {
  const rec = await getRoutineRecord(type);
  rec.reminderActive = active;
  await saveRoutineRecord(rec);

  const remId = `rem-routine-${type}`;
  if (active) {
    const [h, m] = (rec.reminderTime || '07:00').split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target.getTime() <= Date.now()) {
      target.setDate(target.getDate() + 1);
    }

    await reminders.schedule({
      id: remId,
      title: type === 'morning' ? '☀️ حان موعد روتينك الصباحي!' : '🌙 حان موعد روتينك المسائي!',
      body: type === 'morning' ? 'ابدأ يومك بنشاط وأنجز خطواتك الصباحية.' : 'استعد لنوم هانئ وأنهِ خطواتك المسائية.',
      timestamp: target.getTime(),
      sound: type === 'morning' ? 'bell' : 'chime',
      module: 'routines'
    });
    toast.ok(`تم ضبط تذكير الروتين اليومي الساعة ${rec.reminderTime} ⏰`);
  } else {
    await reminders.cancel(remId);
    toast.info('تم إيقاف تذكير الروتين.');
  }
}

/**
 * Render Routines Module
 */
export async function renderRoutinesView(container) {
  let activeTab = 'morning';

  async function render() {
    const rec = await getRoutineRecord(activeTab);
    const totalSteps = rec.steps.length;
    const doneSteps = rec.steps.filter(s => s.done).length;
    const progressPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
    const isCompleted = progressPct === 100;

    container.innerHTML = `
      <div class="col" style="gap:var(--sp-5);">
        <!-- Title & Switcher -->
        <div class="row between wrap" style="gap:12px;">
          <div>
            <h2 style="font-size:var(--fs-xl);font-weight:800;">الروتين اليومي المتسلسل ⚡</h2>
            <p class="muted small" style="margin-top:2px;">خطوات بسيطة يومية تقلل إجهاد اتخاذ القرار وتضاعف الإنتاجية</p>
          </div>

          <!-- Routine Type Tabs -->
          <div class="row" style="background:var(--surface-2);padding:4px;border-radius:var(--radius-pill);border:1px solid var(--border);">
            <button class="btn sm ${activeTab === 'morning' ? 'primary' : 'ghost'}" id="tab-morning" style="border-radius:var(--radius-pill);padding:6px 16px;">
              ☀️ روتين الصباح
            </button>
            <button class="btn sm ${activeTab === 'evening' ? 'primary' : 'ghost'}" id="tab-evening" style="border-radius:var(--radius-pill);padding:6px 16px;">
              🌙 روتين المساء
            </button>
          </div>
        </div>

        <!-- Routine Progress Card -->
        <div class="card col" style="gap:var(--sp-4);background:linear-gradient(135deg, var(--surface) 60%, ${activeTab === 'morning' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(99, 102, 241, 0.08)'});">
          <div class="row between">
            <div class="row" style="gap:12px;">
              <div class="logo-badge" style="width:44px;height:44px;font-size:22px;border-radius:12px;background:${activeTab === 'morning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)'};color:${activeTab === 'morning' ? '#d97706' : '#6366f1'};">
                ${activeTab === 'morning' ? '☀️' : '🌙'}
              </div>
              <div>
                <h3 style="font-size:var(--fs-l);font-weight:800;">${rec.title}</h3>
                <div class="row" style="gap:8px;margin-top:2px;">
                  <span class="badge accent">🔥 سلسلة الالتزام: ${rec.streak || 0} أيام متتالية</span>
                  <span class="badge ok">${doneSteps} من ${totalSteps} خطوات</span>
                </div>
              </div>
            </div>

            <div class="row" style="gap:8px;">
              <input type="time" id="routine-time-input" class="input" value="${rec.reminderTime || '07:00'}" style="padding:6px 10px;font-family:var(--mono);border-radius:var(--radius-s);font-size:var(--fs-xs);border:1px solid var(--border);" />
              <button class="btn sm ${rec.reminderActive ? 'primary' : 'ghost'}" id="btn-routine-reminder" title="تفعيل تذكير يومي">
                🔔 ${rec.reminderActive ? 'منبه نشط' : 'تفعيل'}
              </button>
            </div>
          </div>

          <!-- Progress Bar -->
          <div style="width:100%;height:10px;background:var(--surface-3);border-radius:var(--radius-pill);overflow:hidden;">
            <div style="width:${progressPct}%;height:100%;background:${isCompleted ? 'var(--ok)' : 'var(--accent)'};border-radius:var(--radius-pill);transition:width 0.3s ease;"></div>
          </div>

          ${isCompleted ? `
            <div class="banner ok" style="animation:slideUp 0.3s ease;">
              <span style="font-size:20px;">🎉</span>
              <div class="grow">
                <strong>رائع جداً!</strong> لقد أكملت كامل خطوات روتينك بنجاح اليوم. حافظ على هذا الالتزام غداً!
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Sequential Checklist Steps -->
        <div class="card col" style="gap:var(--sp-3);">
          <div class="row between" style="margin-bottom:4px;">
            <span class="strong small muted">خطوات الروتين بالترتيب:</span>
            <span class="xs faint">اضغط على أي خطوة لإتمامها</span>
          </div>

          <div class="col" id="routine-steps-list" style="gap:8px;">
            ${rec.steps.map((step, idx) => `
              <div class="row between routine-step-row" data-id="${step.id}" style="padding:12px 14px;background:var(--surface-2);border-radius:var(--radius-m);border:1px solid ${step.done ? 'rgba(13, 115, 80, 0.25)' : 'var(--border)'};cursor:pointer;transition:all var(--tr-fast);">
                <div class="row" style="gap:12px;">
                  <div class="step-check center" style="width:24px;height:24px;border-radius:6px;border:2px solid ${step.done ? 'var(--ok)' : 'var(--border-strong)'};background:${step.done ? 'var(--ok)' : 'transparent'};color:#fff;font-size:13px;font-weight:800;">
                    ${step.done ? '✓' : ''}
                  </div>
                  <span class="step-num faint xs num">${idx + 1}.</span>
                  <span class="step-text strong small" style="text-decoration:${step.done ? 'line-through' : 'none'};color:${step.done ? 'var(--text-muted)' : 'var(--text)'};">
                    ${step.text}
                  </span>
                </div>
                <button class="icon-btn btn-del-step" data-id="${step.id}" style="color:var(--text-faint);background:none;border:none;cursor:pointer;padding:4px;" title="حذف الخطوة">
                  ✕
                </button>
              </div>
            `).join('')}
          </div>

          <!-- Add Custom Step Input -->
          <div class="row" style="margin-top:8px;gap:8px;">
            <input type="text" id="new-step-text" class="input grow" placeholder="أضف خطوة جديدة لروتينك..." style="padding:9px 14px;border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);font-size:var(--fs-s);" />
            <button class="btn primary sm" id="btn-add-step">
              + إضافة
            </button>
          </div>
        </div>
      </div>
    `;

    attachEvents(rec);
  }

  function attachEvents(rec) {
    // Tab switching
    container.querySelector('#tab-morning').addEventListener('click', () => {
      activeTab = 'morning';
      render();
    });
    container.querySelector('#tab-evening').addEventListener('click', () => {
      activeTab = 'evening';
      render();
    });

    // Toggle reminder
    container.querySelector('#btn-routine-reminder').addEventListener('click', async () => {
      await toggleRoutineReminder(activeTab, !rec.reminderActive);
      render();
    });

    container.querySelector('#routine-time-input').addEventListener('change', async (e) => {
      rec.reminderTime = e.target.value;
      await saveRoutineRecord(rec);
      if (rec.reminderActive) {
        await toggleRoutineReminder(activeTab, true);
      }
    });

    // Step Click Toggle
    container.querySelectorAll('.routine-step-row').forEach(row => {
      row.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-del-step')) return;
        const stepId = row.getAttribute('data-id');
        const step = rec.steps.find(s => s.id === stepId);
        if (step) {
          step.done = !step.done;
          await saveRoutineRecord(rec);
          if (rec.steps.every(s => s.done)) {
            toast.ok('🎉 مبارك! أتممت الروتين كاملاً اليوم!');
          }
          render();
        }
      });
    });

    // Delete Step
    container.querySelectorAll('.btn-del-step').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const stepId = btn.getAttribute('data-id');
        rec.steps = rec.steps.filter(s => s.id !== stepId);
        await saveRoutineRecord(rec);
        render();
      });
    });

    // Add Step
    const addStep = async () => {
      const input = container.querySelector('#new-step-text');
      const text = input.value.trim();
      if (!text) return;
      rec.steps.push({
        id: 's-' + Date.now().toString(36),
        text,
        done: false
      });
      await saveRoutineRecord(rec);
      render();
    };

    container.querySelector('#btn-add-step').addEventListener('click', addStep);
    container.querySelector('#new-step-text').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addStep();
    });
  }

  await render();
}

export default {
  render: renderRoutinesView,
  getRecord: getRoutineRecord,
  save: saveRoutineRecord
};
