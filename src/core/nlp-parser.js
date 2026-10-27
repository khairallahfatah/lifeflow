/* ============================================================
   LifeFlow — Arabic Natural Language Parser (NLP Engine)
   100% Offline Local Extraction: Intents, Dates, Times & Amounts
   ============================================================ */

import { db } from './db.js';
import driveSync from './drive-sync.js';
import reminders from './reminders.js';
import { toast } from '../ui/toast.js';

// Weekdays mapping in Arabic
const WEEKDAYS = {
  'الأحد': 0, 'الاحد': 0,
  'الاثنين': 1, 'الإثنين': 1,
  'الثلاثاء': 2,
  'الأربعاء': 3, 'الاربعاء': 3,
  'الخميس': 4,
  'الجمعة': 5,
  'السبت': 6
};

// Expense keywords mapping
const EXPENSE_CATEGORIES = {
  food: ['غداء', 'عشاء', 'فطور', 'قهوة', 'مطعم', 'كافيه', 'وجبة', 'طعام', 'اكل', 'أكل', 'سناك'],
  transport: ['بنزين', 'اوبر', 'أوبر', 'تاكسي', 'كريم', 'مواصلات', 'وقود', 'مواقف'],
  shopping: ['شراء', 'شريت', 'اشتريت', 'تسوق', 'سوبرماركت', 'بقالة', 'ملابس', 'طلب'],
  bills: ['فاتورة', 'كهرباء', 'ماء', 'انترنت', 'نت', 'اشتراك', 'ايجار', 'إيجار', 'سداد']
};

/**
 * Format Date to YYYY-MM-DD
 */
function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get next upcoming date for a weekday index (0 = Sun, 6 = Sat)
 */
function getNextWeekday(targetDayIndex) {
  const now = new Date();
  const currentDay = now.getDay();
  let diff = targetDayIndex - currentDay;
  if (diff <= 0) diff += 7;
  const result = new Date(now.getTime() + diff * 24 * 60 * 60 * 1000);
  return toYMD(result);
}

/**
 * Parse an Arabic text string and extract structured metadata
 * @param {string} input - User raw Arabic text
 * @returns {Object} Extracted intent and fields
 */
export function parseArabicIntent(input) {
  if (!input || !input.trim()) return null;

  let text = input.trim();
  const chips = [];
  let detectedType = 'task'; // 'expense' | 'task' | 'event' | 'health' | 'inbox'
  let amount = null;
  let category = null;
  let date = null;
  let time = null;
  let priority = null;

  // 1. Detect Hydration Quick Command
  if (/^شرب(?:ت)?\s*(?:كوب|علبة|ماء|كاس)?/i.test(text) || text === 'ماء' || text === 'كوب ماء') {
    return {
      rawText: text,
      cleanTitle: 'شرب ماء',
      type: 'health',
      action: 'water',
      amount: text.includes('علبة') ? 500 : 250,
      chips: [{ label: text.includes('علبة') ? '+500 مل ماء 🍶' : '+250 مل ماء 🥛', color: 'info' }]
    };
  }

  // 2. Extract Money Amount (e.g., بـ 45 ريال / 50 ر.س / 100 دولار / 45.50)
  const amountMatch = text.match(/(?:بـ?|بقيمة|مبلغ)?\s*(\d+(?:\.\d+)?)\s*(?:ريال|ر\.س|رسم|جنيه|درهم|دولار|\$)?/i);
  if (amountMatch && (text.includes('ريال') || text.includes('ر.س') || text.includes('بـ') || text.includes('دفعت') || text.includes('صرفت') || text.includes('اشتريت') || text.includes('شريت') || text.includes('فاتورة'))) {
    amount = parseFloat(amountMatch[1]);
    detectedType = 'expense';
    chips.push({ label: `مصروف ${amount} ر.س 💰`, color: 'warn' });
    text = text.replace(amountMatch[0], ' ');
  }

  // 3. Extract Date References
  const today = new Date();
  if (/(?:^|[^\p{L}\p{N}])(?:اليوم|الليلة)(?:[^\p{L}\p{N}]|$)/iu.test(text)) {
    date = toYMD(today);
    chips.push({ label: 'اليوم 📅', color: 'accent' });
    text = text.replace(/(?:^|[^\p{L}\p{N}])(?:اليوم|الليلة)(?:[^\p{L}\p{N}]|$)/iu, ' ');
  } else if (/(?:^|[^\p{L}\p{N}])(?:بكرة|غدا|غداً|باكر)(?:[^\p{L}\p{N}]|$)/iu.test(text)) {
    const tmrw = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    date = toYMD(tmrw);
    chips.push({ label: 'غداً 📅', color: 'accent' });
    text = text.replace(/(?:^|[^\p{L}\p{N}])(?:بكرة|غدا|غداً|باكر)(?:[^\p{L}\p{N}]|$)/iu, ' ');
  } else if (/(?:^|[^\p{L}\p{N}])(?:بعد بكرة|بعد غد)(?:[^\p{L}\p{N}]|$)/iu.test(text)) {
    const afterTmrw = new Date(today.getTime() + 48 * 60 * 60 * 1000);
    date = toYMD(afterTmrw);
    chips.push({ label: 'بعد غد 📅', color: 'accent' });
    text = text.replace(/(?:^|[^\p{L}\p{N}])(?:بعد بكرة|بعد غد)(?:[^\p{L}\p{N}]|$)/iu, ' ');
  } else if (/(?:^|[^\p{L}\p{N}])(?:أمس|امس|البارحة)(?:[^\p{L}\p{N}]|$)/iu.test(text)) {
    const yest = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    date = toYMD(yest);
    chips.push({ label: 'أمس 📅', color: 'accent' });
    text = text.replace(/(?:^|[^\p{L}\p{N}])(?:أمس|امس|البارحة)(?:[^\p{L}\p{N}]|$)/iu, ' ');
  } else {
    // Check weekday names
    for (const [dayName, dayIdx] of Object.entries(WEEKDAYS)) {
      const reg = new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:يوم\\s*)?${dayName}(?:[^\\p{L}\\p{N}]|$)`, 'iu');
      if (reg.test(text)) {
        date = getNextWeekday(dayIdx);
        chips.push({ label: `${dayName} 📅`, color: 'accent' });
        text = text.replace(reg, ' ');
        break;
      }
    }
  }

  // 4. Extract Time References (e.g. الساعة 3 عصراً / 4:30 م / 9 صباحاً)
  const timeMatch = text.match(/(?:الساعة|الساعه)?\s*(\d{1,2})(?::(\d{2}))?\s*(صباحا|صباحاً|عصرا|عصراً|مساء|مساءً|م|ص|ظهر|ظهراً)?/i);
  if (timeMatch && timeMatch[1]) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? timeMatch[2].padStart(2, '0') : '00';
    const period = timeMatch[3] ? timeMatch[3].toLowerCase() : '';

    if (period.includes('عصر') || period.includes('مساء') || period === 'م') {
      if (hours < 12) hours += 12;
    } else if (period.includes('ظهر')) {
      if (hours < 12) hours = 12;
    } else if (period.includes('ص')) {
      if (hours === 12) hours = 0;
    }

    if (hours >= 0 && hours <= 23) {
      time = `${String(hours).padStart(2, '0')}:${minutes}`;
      chips.push({ label: `الساعة ${time} ⏰`, color: 'info' });
      text = text.replace(timeMatch[0], ' ');

      // If time exists without amount, likely an appointment or task
      if (!amount && detectedType !== 'expense') {
        detectedType = 'event';
      }
    }
  }

  // 5. Extract Priority
  if (/(?:^|[^\p{L}\p{N}])(?:عاجل|حرج|قصوى|ضروري جدا)(?:[^\p{L}\p{N}]|$)/iu.test(text)) {
    priority = 'urgent';
    chips.push({ label: 'أولوية: عاجل 🚨', color: 'danger' });
    text = text.replace(/(?:^|[^\p{L}\p{N}])(?:عاجل|حرج|قصوى|ضروري جدا)(?:[^\p{L}\p{N}]|$)/iu, ' ');
  } else if (/(?:^|[^\p{L}\p{N}])(?:مهم|ضروري)(?:[^\p{L}\p{N}]|$)/iu.test(text)) {
    priority = 'high';
    chips.push({ label: 'أولوية: مرتفعة ⚡', color: 'warn' });
    text = text.replace(/(?:^|[^\p{L}\p{N}])(?:مهم|ضروري)(?:[^\p{L}\p{N}]|$)/iu, ' ');
  }

  // 6. Detect Expense Categories
  if (detectedType === 'expense') {
    for (const [catKey, keywords] of Object.entries(EXPENSE_CATEGORIES)) {
      if (keywords.some(k => input.includes(k))) {
        category = catKey;
        chips.push({ label: `فئة: ${catKey} 🏷️`, color: 'ghost' });
        break;
      }
    }
    if (!category) category = 'general';
  }

  // 7. Event Keyword Override
  if (/(?:^|[^\p{L}\p{N}])(?:موعد|اجتماع|لقاء|جلسة|طبيب|دكتور|عيادة|محاضرة|كشف)(?:[^\p{L}\p{N}]|$)/iu.test(input) && !amount) {
    detectedType = 'event';
    chips.push({ label: 'موعد في التقويم 📆', color: 'ok' });
  }

  // Clean title
  let cleanTitle = text.replace(/\s+/g, ' ').trim();
  if (!cleanTitle) cleanTitle = input.trim();

  // Primary Chip
  if (detectedType === 'task') {
    chips.unshift({ label: 'مهمة عمل ✔️', color: 'ok' });
  } else if (detectedType === 'expense') {
    chips.unshift({ label: 'مصروف 💰', color: 'warn' });
  } else if (detectedType === 'event') {
    chips.unshift({ label: 'موعد 📅', color: 'info' });
  }

  return {
    rawText: input,
    cleanTitle,
    type: detectedType,
    amount,
    category,
    date: date || toYMD(today),
    time,
    priority: priority || 'medium',
    chips
  };
}

/**
 * Execute and commit the parsed intent to IndexedDB automatically
 * @param {Object} parsed - Result of parseArabicIntent
 */
export async function executeParsedIntent(parsed) {
  if (!parsed) return false;

  const today = toYMD(new Date());

  if (parsed.type === 'health' && parsed.action === 'water') {
    // Add Water
    const logs = await db.list('health_logs', { all: true, predicate: r => r.date === today });
    const log = logs[0] || {
      id: 'health-' + today,
      date: today,
      waterCurrent: 0,
      waterTarget: 2500,
      waterHistory: []
    };
    log.waterCurrent += (parsed.amount || 250);
    log.waterHistory = log.waterHistory || [];
    log.waterHistory.push({ amount: parsed.amount || 250, time: new Date().toISOString() });
    await db.put('health_logs', log, { all: true });
    driveSync.notifyDataChanged();
    toast.ok(`💧 تم تسجيل إضافة ${parsed.amount || 250} مل ماء بنجاح!`);
    return { type: 'health', record: log };
  }

  if (parsed.type === 'expense') {
    // Add Expense
    const expense = {
      id: 'exp-' + Date.now().toString(36),
      title: parsed.cleanTitle,
      amount: parsed.amount || 0,
      categoryId: parsed.category || 'general',
      date: parsed.date || today,
      createdAt: new Date().toISOString()
    };
    await db.put('expenses', expense, { all: true });
    driveSync.notifyDataChanged();
    toast.ok(`💰 تم حفظ المصروف بنجاح (${parsed.amount} ر.س)!`);
    return { type: 'expense', record: expense };
  }

  if (parsed.type === 'event') {
    // Add Calendar Event
    const event = {
      id: 'ev-' + Date.now().toString(36),
      title: parsed.cleanTitle,
      date: parsed.date || today,
      time: parsed.time || '10:00',
      type: 'appointment',
      createdAt: new Date().toISOString()
    };
    await db.put('events', event, { all: true });

    // Schedule background reminder if date & time are valid
    if (parsed.date && parsed.time) {
      const targetTime = new Date(`${parsed.date}T${parsed.time}:00`).getTime();
      if (targetTime > Date.now()) {
        await reminders.schedule({
          title: `📅 موعد: ${parsed.cleanTitle}`,
          body: `حان موعد ${parsed.cleanTitle} الآن.`,
          timestamp: targetTime,
          sound: 'bell',
          module: 'calendar'
        });
      }
    }

    driveSync.notifyDataChanged();
    toast.ok(`📅 تم إدراج الموعد في التقويم وتعيين التذكير!`);
    return { type: 'event', record: event };
  }

  // Default: Add Task
  const task = {
    id: 'task-' + Date.now().toString(36),
    title: parsed.cleanTitle,
    priority: parsed.priority || 'medium',
    date: parsed.date || today,
    time: parsed.time || null,
    status: 'todo',
    createdAt: new Date().toISOString()
  };
  await db.put('tasks', task, { all: true });

  if (parsed.date && parsed.time) {
    const targetTime = new Date(`${parsed.date}T${parsed.time}:00`).getTime();
    if (targetTime > Date.now()) {
      await reminders.schedule({
        title: `✔️ مهمة: ${parsed.cleanTitle}`,
        body: `تذكير بمهمتك المجدولة.`,
        timestamp: targetTime,
        sound: 'chime',
        module: 'tasks'
      });
    }
  }

  driveSync.notifyDataChanged();
  toast.ok(`✔️ تمت إضافة المهمة "${parsed.cleanTitle}" بنجاح!`);
  return { type: 'task', record: task };
}

export default {
  parse: parseArabicIntent,
  execute: executeParsedIntent
};
