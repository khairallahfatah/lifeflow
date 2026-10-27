/* ============================================================
   LifeFlow — Health & Wellness Module (الصحة والعافية)
   Water Tracker, Mood & Energy, and Sleep Logs
   ============================================================ */

import { db } from '../../core/db.js';
import driveSync from '../../core/drive-sync.js';
import reminders from '../../core/reminders.js';
import { toast } from '../../ui/toast.js';

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function getTodayHealthLog() {
  const today = getTodayKey();
  const logs = await db.list('health_logs', {
    all: true,
    predicate: (r) => r.date === today
  });

  if (logs.length > 0) return logs[0];

  return {
    id: 'health-' + today,
    date: today,
    waterCurrent: 0,
    waterTarget: 2500,
    waterHistory: [],
    waterReminderActive: false,
    mood: null, // 1..5
    moodTags: [],
    moodNote: '',
    sleepBedtime: '23:00',
    sleepWaketime: '07:00',
    sleepHours: 8,
    sleepQuality: 4, // 1..5
    updatedAt: new Date().toISOString()
  };
}

export async function saveHealthLog(log) {
  log.updatedAt = new Date().toISOString();
  await db.put('health_logs', log, { all: true });
  driveSync.notifyDataChanged();
  return log;
}

/**
 * Toggle smart recurring hydration reminders every 2 hours
 */
export async function toggleWaterReminder(active) {
  const today = getTodayKey();
  const log = await getTodayHealthLog();
  log.waterReminderActive = active;
  await saveHealthLog(log);

  if (active) {
    // Schedule 4 gentle reminders during waking hours (10:00, 13:00, 16:00, 19:00)
    const hours = [10, 13, 16, 19];
    const now = new Date();

    for (const h of hours) {
      const remDate = new Date();
      remDate.setHours(h, 0, 0, 0);
      if (remDate.getTime() > now.getTime()) {
        await reminders.schedule({
          id: `water-${today}-${h}`,
          title: '💧 وقت شرب الماء!',
          body: 'حافظ على ترطيب جسمك ونشاطك الذهني. اشرب كوباً من الماء الآن.',
          timestamp: remDate.getTime(),
          sound: 'chime',
          module: 'health'
        });
      }
    }
    toast.ok('تم تفعيل التذكير الدوري الذكي بشرب الماء كل ساعتين! 💧');
  } else {
    // Cancel today's water reminders
    [10, 13, 16, 19].forEach((h) => {
      reminders.cancel(`water-${today}-${h}`);
    });
    toast.info('تم إيقاف تذكير شرب الماء مؤقتاً.');
  }
}

/**
 * Render Health & Wellness View
 */
export async function renderHealthView(container) {
  let log = await getTodayHealthLog();

  function calcSleepDuration(bed, wake) {
    if (!bed || !wake) return 8;
    const [bH, bM] = bed.split(':').map(Number);
    const [wH, wM] = wake.split(':').map(Number);
    let min = (wH * 60 + wM) - (bH * 60 + bM);
    if (min < 0) min += 24 * 60;
    return Math.round((min / 60) * 10) / 10;
  }

  function render() {
    const waterPct = Math.min(100, Math.round((log.waterCurrent / log.waterTarget) * 100));
    const MOODS = [
      { level: 5, emoji: '🤩', label: 'ممتاز' },
      { level: 4, emoji: '😊', label: 'جيد' },
      { level: 3, emoji: '😐', label: 'محايد' },
      { level: 2, emoji: '😫', label: 'مجهد' },
      { level: 1, emoji: '😴', label: 'متعب' }
    ];

    const AVAILABLE_TAGS = ['العمل', 'الرياضة', 'النوم', 'العائلة', 'الدراسة', 'الطعام', 'التأمل'];

    container.innerHTML = `
      <div class="col" style="gap:var(--sp-5);">
        <!-- View Title -->
        <div class="row between">
          <div>
            <h2 style="font-size:var(--fs-xl);font-weight:800;">الصحة والعافية الشخصية 🌿</h2>
            <p class="muted small" style="margin-top:2px;">تتبع ترطيب الجسم، جودة النوم، ومقياس الطاقة والمزاج اليومي</p>
          </div>
          <span class="badge ok">${new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:var(--sp-4);">
          <!-- 1. Water Tracker Card -->
          <div class="card col" style="gap:var(--sp-4);">
            <div class="row between">
              <div class="row" style="gap:10px;">
                <div class="logo-badge" style="width:36px;height:36px;border-radius:10px;background:rgba(2, 132, 199, 0.15);color:#0284c7;">
                  💧
                </div>
                <div>
                  <h3 style="font-size:var(--fs-m);font-weight:700;">متتبع شرب الماء</h3>
                  <div class="muted xs">الهدف: ${log.waterTarget} مل</div>
                </div>
              </div>
              <button id="btn-water-reminder" class="btn sm ${log.waterReminderActive ? 'primary' : 'ghost'}" title="تفعيل تذكير دوري كل ساعتين">
                🔔 ${log.waterReminderActive ? 'التذكير نشط' : 'تفعيل التذكير'}
              </button>
            </div>

            <!-- Water Gauge Graphic -->
            <div style="display:flex;align-items:center;justify-content:center;padding:16px 0;">
              <div class="water-tank-wrapper" style="position:relative;width:150px;height:150px;border-radius:50%;border:4px solid #bae6fd;background:#f0f9ff;overflow:hidden;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 8px rgba(2,132,199,0.15);">
                <!-- Animated Water Fill -->
                <div class="water-wave" style="position:absolute;bottom:0;width:100%;height:${waterPct}%;background:linear-gradient(180deg, #38bdf8, #0284c7);transition:height 0.4s cubic-bezier(0.16, 1, 0.3, 1);"></div>
                <!-- Content text -->
                <div style="position:relative;z-index:2;text-align:center;">
                  <div style="font-size:24px;font-weight:800;color:${waterPct > 55 ? '#ffffff' : '#0369a1'};">${log.waterCurrent}</div>
                  <div style="font-size:11px;font-weight:600;color:${waterPct > 55 ? 'rgba(255,255,255,0.85)' : '#0284c7'};">من ${log.waterTarget} مل (${waterPct}%)</div>
                </div>
              </div>
            </div>

            <!-- Quick Add Controls -->
            <div class="row wrap" style="gap:8px;justify-content:center;">
              <button class="btn ghost sm" id="btn-add-water-250">
                <span>🥛</span> +250 مل
              </button>
              <button class="btn ghost sm" id="btn-add-water-500">
                <span>🍶</span> +500 مل
              </button>
              <button class="btn ghost sm" id="btn-water-undo" ${log.waterCurrent === 0 ? 'disabled' : ''}>
                <span>↩️</span> تراجع
              </button>
            </div>
          </div>

          <!-- 2. Mood & Energy Tracker Card -->
          <div class="card col" style="gap:var(--sp-4);">
            <div class="row" style="gap:10px;">
              <div class="logo-badge" style="width:36px;height:36px;border-radius:10px;background:rgba(217, 119, 6, 0.15);color:#d97706;">
                ✨
              </div>
              <div>
                <h3 style="font-size:var(--fs-m);font-weight:700;">المزاج ومستوى الطاقة</h3>
                <div class="muted xs">كيف تشعر اليوم؟</div>
              </div>
            </div>

            <!-- Mood Emojis Grid -->
            <div class="row between" style="padding:4px 0;">
              ${MOODS.map(m => `
                <button class="mood-btn btn ghost sm col center ${log.mood === m.level ? 'primary' : ''}" data-level="${m.level}" style="flex:1;padding:8px 4px;gap:4px;border-radius:var(--radius-m);${log.mood === m.level ? 'background:var(--accent);color:#fff;' : ''}">
                  <span style="font-size:22px;">${m.emoji}</span>
                  <span style="font-size:11px;font-weight:700;">${m.label}</span>
                </button>
              `).join('')}
            </div>

            <!-- Mood Tags -->
            <div class="col" style="gap:6px;">
              <span class="muted xs strong">ما الذي أثر على مزاجك؟</span>
              <div class="row wrap" style="gap:6px;">
                ${AVAILABLE_TAGS.map(tag => {
                  const active = (log.moodTags || []).includes(tag);
                  return `
                    <button class="btn sm tag-btn ${active ? 'primary' : 'ghost'}" data-tag="${tag}" style="padding:4px 10px;border-radius:var(--radius-pill);font-size:12px;">
                      ${tag}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Mood Quick Note -->
            <input type="text" id="input-mood-note" class="input" placeholder="اكتب خاطرة سريعة عن يومك..." value="${log.moodNote || ''}" style="padding:8px 12px;font-size:var(--fs-s);border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);" />
          </div>
        </div>

        <!-- 3. Sleep Tracker Card -->
        <div class="card col" style="gap:var(--sp-4);">
          <div class="row between">
            <div class="row" style="gap:10px;">
              <div class="logo-badge" style="width:36px;height:36px;border-radius:10px;background:rgba(99, 102, 241, 0.15);color:#6366f1;">
                🌙
              </div>
              <div>
                <h3 style="font-size:var(--fs-m);font-weight:700;">مسجل ساعات وجودة النوم</h3>
                <div class="muted xs">حساب تلقائي لمدى كفاية الراحة الجسدية</div>
              </div>
            </div>
            <span class="badge accent" id="sleep-duration-badge" style="font-size:var(--fs-s);padding:5px 12px;">
              ${log.sleepHours} ساعات نوم
            </span>
          </div>

          <div class="row wrap" style="gap:var(--sp-4);">
            <div class="col grow" style="min-width:140px;gap:4px;">
              <label class="muted xs strong">وقت الخلود للنوم:</label>
              <input type="time" id="sleep-bedtime" class="input" value="${log.sleepBedtime || '23:00'}" style="padding:8px;font-family:var(--mono);border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);" />
            </div>

            <div class="col grow" style="min-width:140px;gap:4px;">
              <label class="muted xs strong">وقت الاستيقاظ:</label>
              <input type="time" id="sleep-waketime" class="input" value="${log.sleepWaketime || '07:00'}" style="padding:8px;font-family:var(--mono);border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);" />
            </div>

            <div class="col grow" style="min-width:180px;gap:4px;">
              <label class="muted xs strong">تقييم جودة النوم:</label>
              <div class="row" style="gap:6px;height:38px;align-items:center;">
                ${[1, 2, 3, 4, 5].map(star => `
                  <button class="sleep-star-btn" data-star="${star}" style="background:none;border:none;cursor:pointer;font-size:22px;color:${star <= log.sleepQuality ? '#f59e0b' : 'var(--border-strong)'};">
                    ★
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // Water buttons
    container.querySelector('#btn-add-water-250').addEventListener('click', async () => {
      log.waterCurrent += 250;
      log.waterHistory.push({ amount: 250, time: new Date().toISOString() });
      await saveHealthLog(log);
      toast.ok('تمت إضافة 250 مل ماء 🥛');
      render();
    });

    container.querySelector('#btn-add-water-500').addEventListener('click', async () => {
      log.waterCurrent += 500;
      log.waterHistory.push({ amount: 500, time: new Date().toISOString() });
      await saveHealthLog(log);
      toast.ok('تمت إضافة 500 مل ماء 🍶');
      render();
    });

    const undoBtn = container.querySelector('#btn-water-undo');
    if (undoBtn) {
      undoBtn.addEventListener('click', async () => {
        if (log.waterHistory.length > 0) {
          const last = log.waterHistory.pop();
          log.waterCurrent = Math.max(0, log.waterCurrent - last.amount);
          await saveHealthLog(log);
          toast.info('تم التراجع عن آخر كمية ماء.');
          render();
        }
      });
    }

    container.querySelector('#btn-water-reminder').addEventListener('click', async () => {
      await toggleWaterReminder(!log.waterReminderActive);
      render();
    });

    // Mood level selection
    container.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const lvl = Number(btn.getAttribute('data-level'));
        log.mood = lvl;
        await saveHealthLog(log);
        render();
      });
    });

    // Mood tags
    container.querySelectorAll('.tag-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const tag = btn.getAttribute('data-tag');
        log.moodTags = log.moodTags || [];
        if (log.moodTags.includes(tag)) {
          log.moodTags = log.moodTags.filter(t => t !== tag);
        } else {
          log.moodTags.push(tag);
        }
        await saveHealthLog(log);
        render();
      });
    });

    // Mood note
    const noteInput = container.querySelector('#input-mood-note');
    noteInput.addEventListener('change', async () => {
      log.moodNote = noteInput.value.trim();
      await saveHealthLog(log);
    });

    // Sleep inputs
    const bedInput = container.querySelector('#sleep-bedtime');
    const wakeInput = container.querySelector('#sleep-waketime');

    const updateSleep = async () => {
      log.sleepBedtime = bedInput.value;
      log.sleepWaketime = wakeInput.value;
      log.sleepHours = calcSleepDuration(log.sleepBedtime, log.sleepWaketime);
      await saveHealthLog(log);
      const badge = container.querySelector('#sleep-duration-badge');
      if (badge) badge.textContent = `${log.sleepHours} ساعات نوم`;
    };

    bedInput.addEventListener('change', updateSleep);
    wakeInput.addEventListener('change', updateSleep);

    container.querySelectorAll('.sleep-star-btn').forEach(starBtn => {
      starBtn.addEventListener('click', async () => {
        log.sleepQuality = Number(starBtn.getAttribute('data-star'));
        await saveHealthLog(log);
        render();
      });
    });
  }

  render();
}

export default {
  render: renderHealthView,
  getToday: getTodayHealthLog,
  save: saveHealthLog,
  toggleWaterReminder
};
