/* ============================================================
   LifeFlow — Domain Logic Engine (Pure Business Logic)
   Recurrence, calendars, budgets, habits, analytics & insights.
   Zero DOM dependencies — 100% Unit Testable & Pure.
   ============================================================ */

/* ---------- Core Utility Helpers ---------- */
export const util = {
  pad2(n) {
    return (n < 10 ? '0' : '') + n;
  },

  ymd(d) {
    return d.getFullYear() + '-' + util.pad2(d.getMonth() + 1) + '-' + util.pad2(d.getDate());
  },

  todayYmd() {
    return util.ymd(new Date());
  },

  fromYmd(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return dt;
  },

  addDays(d, n) {
    const x = new Date(d.getTime());
    x.setDate(x.getDate() + n);
    return x;
  },

  startOfWeek(d, weekStart = 0) {
    const x = new Date(d.getTime());
    x.setHours(0, 0, 0, 0);
    const diff = (x.getDay() - weekStart + 7) % 7;
    x.setDate(x.getDate() - diff);
    return x;
  },

  clone(obj) {
    if (obj == null) return obj;
    try { return structuredClone(obj); }
    catch (e) { return JSON.parse(JSON.stringify(obj)); }
  }
};

/* ---------- Constants ---------- */
export const PRIORITIES = ['urgent', 'high', 'medium', 'low'];
export const PRIORITY_WEIGHT = { urgent: 0, high: 1, medium: 2, low: 3 };
export const TASK_STATUSES = ['todo', 'doing', 'done', 'deferred', 'cancelled'];
export const ACTIVE_STATUSES = ['todo', 'doing', 'deferred'];
export const EVENT_TYPES = ['appointment', 'meeting', 'lecture', 'exam', 'occasion', 'personal', 'home', 'other'];
export const HABIT_TYPES = ['daily', 'days', 'weekly', 'numeric'];

/* ---------- Time Helpers (HH:MM strings) ---------- */
export function validTime(s) {
  if (s == null || s === '') return true;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(s).trim());
}

export function timeToMin(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  return (+m[1]) * 60 + (+m[2]);
}

export function minToTime(min) {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return util.pad2(Math.floor(m / 60)) + ':' + util.pad2(m % 60);
}

/* ---------- Date Math on YMD strings ---------- */
export function addMonthsClamped(ymdStr, n) {
  const d = util.fromYmd(ymdStr);
  if (!d) return null;
  const day = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return util.ymd(target);
}

/**
 * Next occurrence date for a recurrence pattern.
 * recur: { type: 'daily'|'weekly'|'monthly'|'yearly', every: 1..n, until: Ymd|null }
 */
export function nextDate(ymdStr, recur) {
  if (!recur || !recur.type || recur.type === 'none') return null;
  const every = Math.max(1, +recur.every || 1);
  const d = util.fromYmd(ymdStr);
  if (!d) return null;
  let next;
  switch (recur.type) {
    case 'daily':
      next = util.ymd(util.addDays(d, every));
      break;
    case 'weekly':
      next = util.ymd(util.addDays(d, 7 * every));
      break;
    case 'monthly':
      next = addMonthsClamped(ymdStr, every);
      break;
    case 'yearly':
      next = addMonthsClamped(ymdStr, 12 * every);
      break;
    default:
      return null;
  }
  if (recur.until && next > recur.until) return null;
  return next;
}

/**
 * Spawn the next task record when a recurring task completes.
 */
export function spawnNext(task) {
  if (!task || !task.recurrence || !task.recurrence.type || task.recurrence.type === 'none') return null;
  const base = task.date ? task.date : util.todayYmd();
  const nd = nextDate(base, task.recurrence);
  if (!nd) return null;
  const clone = util.clone(task);
  delete clone.id;
  delete clone.createdAt;
  delete clone.updatedAt;
  clone.date = nd;
  clone.status = 'todo';
  clone.completedAt = null;
  return clone;
}

/**
 * Expand events into occurrences within [fromYmd..toYmd].
 */
export function expandOccurrences(events, fromYmd, toYmd) {
  const out = [];
  for (const ev of events) {
    if (!ev.date) continue;
    const rec = ev.recurrence && ev.recurrence.type && ev.recurrence.type !== 'none' ? ev.recurrence : null;
    if (!rec) {
      if (ev.date >= fromYmd && ev.date <= toYmd) out.push({ ev, date: ev.date });
      continue;
    }
    let cur = ev.date;
    let guard = 0;
    while (cur && cur <= toYmd && guard < 800) {
      guard++;
      if (cur >= fromYmd) out.push({ ev, date: cur });
      cur = nextDate(cur, rec);
    }
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}

/* ---------- Tasks ---------- */
export function isOverdue(task, todayYmd) {
  const today = todayYmd || util.todayYmd();
  return !!task.date && task.date < today &&
    (task.status === 'todo' || task.status === 'doing');
}

export function taskBucket(task, todayYmd) {
  const today = todayYmd || util.todayYmd();
  if (task.status === 'done') return 'done';
  if (task.status === 'cancelled') return 'cancelled';
  if (isOverdue(task, today)) return 'overdue';
  if (!task.date) return 'nodate';
  if (task.date === today) return 'today';
  return 'upcoming';
}

export function subtaskProgress(subtasks) {
  const list = subtasks || [];
  return { done: list.filter(s => s.done).length, total: list.length };
}

export function projectProgress(tasks) {
  const list = (tasks || []).filter(t => t.status !== 'cancelled');
  const done = list.filter(t => t.status === 'done').length;
  return { done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
}

export function sortTasks(tasks, sortBy) {
  const arr = (tasks || []).slice();
  const prio = t => PRIORITY_WEIGHT[t.priority] != null ? PRIORITY_WEIGHT[t.priority] : 2;
  switch (sortBy) {
    case 'priority':
      arr.sort((a, b) => prio(a) - prio(b) || (a.date || '9999') < (b.date || '9999') ? -1
        : (a.date || '9999') > (b.date || '9999') ? 1 : 0);
      break;
    case 'created':
      arr.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      break;
    case 'title':
      arr.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'ar'));
      break;
    case 'date':
    default:
      arr.sort((a, b) => {
        const ad = a.date || '9999-99-99', bd = b.date || '9999-99-99';
        if (ad !== bd) return ad < bd ? -1 : 1;
        const at = a.time || '99:99', bt = b.time || '99:99';
        if (at !== bt) return at < bt ? -1 : 1;
        return prio(a) - prio(b);
      });
      break;
  }
  return arr;
}

/* ---------- Calendar Grids ---------- */
export function weekDays(weekStart) {
  const out = [];
  for (let i = 0; i < 7; i++) out.push((weekStart + i) % 7);
  return out;
}

export function monthGrid(year, month /*0-based*/, weekStart = 0) {
  const first = new Date(year, month, 1);
  const start = util.startOfWeek(first, weekStart);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    cells.push(util.ymd(util.addDays(start, i)));
  }
  return cells;
}

/* ---------- Money: Months & Budget Periods ---------- */
export function daysInMonth(ymdStr) {
  const p = String(ymdStr || '').split('-').map(Number);
  return new Date(p[0], p[1], 0).getDate();
}

export function monthBounds(ymdStr) {
  const ym = String(ymdStr || '').slice(0, 7);
  return { ym, from: ym + '-01', to: ym + '-' + util.pad2(daysInMonth(ym + '-01')) };
}

export function budgetPeriod(period, todayYmdStr, weekStart = 0) {
  const today = todayYmdStr || util.todayYmd();
  switch (period) {
    case 'daily': return { from: today, to: today };
    case 'weekly': {
      const d = util.fromYmd(today);
      const start = util.startOfWeek(d, weekStart == null ? 0 : weekStart);
      return { from: util.ymd(start), to: util.ymd(util.addDays(start, 6)) };
    }
    case 'yearly': {
      const y = today.slice(0, 4);
      return { from: y + '-01-01', to: y + '-12-31' };
    }
    case 'monthly':
    default: {
      const b = monthBounds(today);
      return { from: b.from, to: b.to };
    }
  }
}

export function budgetStatus(budget, expenses, todayYmdStr, weekStart = 0) {
  const p = budgetPeriod(budget.period, todayYmdStr, weekStart);
  const catId = budget.categoryId || '';
  let spent = 0;
  for (const e of (expenses || [])) {
    if (!e.amount) continue;
    if (e.date < p.from || e.date > p.to) continue;
    if (catId && e.categoryId !== catId) continue;
    spent += e.amount;
  }
  const amount = budget.amount | 0;
  const remaining = amount - spent;
  let pct = 0;
  if (amount > 0) pct = Math.min(999, Math.round((spent / amount) * 100));
  else if (spent > 0) pct = 999;
  let projected = null;
  if ((budget.period === 'monthly' || !budget.period) && todayYmdStr) {
    const elapsed = Number(todayYmdStr.slice(8, 10)) || 1;
    const total = daysInMonth(todayYmdStr) || 1;
    projected = Math.round((spent / elapsed) * total);
  }
  let state;
  if (amount > 0) state = spent > amount ? 'over' : (pct >= 80 ? 'warn' : 'ok');
  else state = spent > 0 ? 'over' : 'ok';
  return { from: p.from, to: p.to, spent, remaining, pct, projected, state };
}

export function topCategories(expenses, n) {
  const map = new Map();
  for (const e of (expenses || [])) {
    if (!e.amount) continue;
    const k = e.categoryId || '_none';
    map.set(k, (map.get(k) || 0) + e.amount);
  }
  const arr = [];
  map.forEach((total, categoryId) => arr.push({ categoryId, total }));
  arr.sort((a, b) => b.total - a.total);
  return typeof n === 'number' ? arr.slice(0, n) : arr;
}

export function monthTrend(incomes, expenses, monthsCount = 6, todayYmdStr) {
  const today = todayYmdStr || util.todayYmd();
  const n = monthsCount || 6;
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7));
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    let mm = m - i, yy = y;
    while (mm <= 0) { mm += 12; yy -= 1; }
    out.push({ ym: yy + '-' + util.pad2(mm), income: 0, expense: 0, net: 0 });
  }
  const idx = {};
  out.forEach((r, i) => { idx[r.ym] = i; });
  (incomes || []).forEach(e => {
    const i = idx[String(e.date || '').slice(0, 7)];
    if (i != null && e.amount) out[i].income += e.amount;
  });
  (expenses || []).forEach(e => {
    const i = idx[String(e.date || '').slice(0, 7)];
    if (i != null && e.amount) out[i].expense += e.amount;
  });
  out.forEach(r => { r.net = r.income - r.expense; });
  return out;
}

export function debtStatus(debt, payments, todayYmdStr) {
  const today = todayYmdStr || util.todayYmd();
  const paid = (payments || [])
    .filter(p => p.debtId === debt.id)
    .reduce((s, p) => s + (p.amount || 0), 0);
  const amount = debt.amount | 0;
  const remaining = amount - paid;
  let state;
  if (remaining <= 0) state = 'paid';
  else if (debt.dueDate && debt.dueDate < today) state = 'overdue';
  else if (paid > 0) state = 'partial';
  else state = 'due';
  const pct = amount > 0 ? Math.min(100, Math.round((paid / amount) * 100)) : 0;
  return { paid, remaining, pct, state };
}

export function shoppingStats(items) {
  const list = items || [];
  let expected = 0, actual = 0, purchased = 0;
  for (const it of list) {
    expected += it.expectedPrice || 0;
    if (it.purchased) { purchased++; actual += it.actualPrice || 0; }
  }
  return { count: list.length, purchased, expected, actual, remaining: list.length - purchased };
}

/* ---------- Study & Work ---------- */
export function sumMinutes(records, fromYmdStr, toYmdStr, field = 'minutes') {
  let total = 0;
  for (const r of (records || [])) {
    if (!r.date) continue;
    if (r.date < fromYmdStr || r.date > toYmdStr) continue;
    total += r[field] || 0;
  }
  return total;
}

export function nextExam(exams, todayYmdStr) {
  const today = todayYmdStr || util.todayYmd();
  let best = null;
  for (const e of (exams || [])) {
    if (!e.date || e.date < today) continue;
    if (!best || e.date < best.date) best = e;
  }
  if (!best) return null;
  const days = Math.round((util.fromYmd(best.date) - util.fromYmd(today)) / 86400000);
  return { exam: best, daysUntil: days };
}

export function assignmentStats(assignments, todayYmdStr) {
  const today = todayYmdStr || util.todayYmd();
  let open = 0, done = 0, overdue = 0;
  for (const a of (assignments || [])) {
    if (a.status === 'done') { done++; continue; }
    open++;
    if (a.dueDate && a.dueDate < today) overdue++;
  }
  return { open, done, overdue };
}

/* ---------- Habits ---------- */
export function habitScheduledOn(habit, dateYmd) {
  const d = util.fromYmd(dateYmd);
  if (!d) return false;
  const wd = d.getDay();
  const sch = (habit.schedule || {}).type || 'daily';
  if (sch === 'daily' || sch === 'numeric') return true;
  if (sch === 'days') return (habit.days || []).indexOf(wd) !== -1;
  if (sch === 'weekly') return true;
  return true;
}

export function habitDayValue(habit, logs, dateYmd) {
  let value = 0;
  for (const l of (logs || [])) {
    if (l.habitId !== habit.id || l.date !== dateYmd) continue;
    value += (l.count != null ? l.count : 1);
  }
  const sch = (habit.schedule || {}).type || 'daily';
  const target = sch === 'numeric' ? Math.max(1, habit.target || 1) : 1;
  return { value, done: value >= target, target };
}

export function habitStreak(habit, logs, todayYmdStr) {
  const sch = (habit.schedule || {}).type || 'daily';
  if (sch === 'weekly') {
    const logged = new Set((logs || []).filter(l => l.habitId === habit.id).map(l => l.date));
    if (!logged.size) return 0;
    let streak = 0;
    let cursor = util.fromYmd(todayYmdStr);
    for (let w = 0; w < 520; w++) {
      let hit = false;
      for (let i = 0; i < 7; i++) {
        if (logged.has(util.ymd(cursor))) { hit = true; break; }
        cursor = util.addDays(cursor, -1);
      }
      if (!hit) {
        if (w === 0) continue;
        break;
      }
      streak++;
    }
    return streak;
  }
  let streak = 0;
  let cursor = todayYmdStr;
  let skippedToday = false;
  for (let i = 0; i < 730; i++) {
    if (habitScheduledOn(habit, cursor)) {
      const dv = habitDayValue(habit, logs, cursor);
      if (dv.done) streak++;
      else if (i === 0 && !skippedToday) { skippedToday = true; }
      else break;
    }
    cursor = util.ymd(util.addDays(util.fromYmd(cursor), -1));
  }
  return streak;
}

export function habitAdherence(habit, logs, todayYmdStr, days = 30) {
  let scheduled = 0, done = 0;
  let cursor = todayYmdStr;
  for (let i = 0; i < days; i++) {
    if (habitScheduledOn(habit, cursor)) {
      scheduled++;
      if (habitDayValue(habit, logs, cursor).done) done++;
    }
    cursor = util.ymd(util.addDays(util.fromYmd(cursor), -1));
  }
  return { scheduled, done, pct: scheduled ? Math.round((done / scheduled) * 100) : 0 };
}

/* ---------- Goals & Reminders ---------- */
export function goalProgress(goal, steps) {
  const list = (steps || []).filter(s => s.goalId === goal.id);
  if (list.length) {
    const done = list.filter(s => s.done).length;
    return { pct: Math.round((done / list.length) * 100), fromSteps: true, total: list.length, doneSteps: done };
  }
  return { pct: Math.max(0, Math.min(100, goal.progress || 0)), fromSteps: false, total: 0, doneSteps: 0 };
}

export function reminderDue(reminder, todayYmdStr, nowTime = '23:59') {
  if (reminder.doneAt) return false;
  if (!reminder.date) return false;
  if (reminder.date < todayYmdStr) return true;
  if (reminder.date > todayYmdStr) return false;
  if (!reminder.time) return true;
  return reminder.time <= nowTime;
}

/* ---------- Analytics & Insights ---------- */
export function taskStats(tasks, fromYmdStr, toYmdStr) {
  let total = 0, done = 0, overdue = 0, plannedMinutes = 0;
  for (const t of (tasks || [])) {
    if (t.status === 'cancelled') continue;
    const d = t.date || '';
    const doneAt = (t.completedAt || '').slice(0, 10);
    const doneAtEff = t.status === 'done' ? (doneAt || d) : '';
    if (t.status === 'done') {
      if (doneAtEff >= fromYmdStr && doneAtEff <= toYmdStr) {
        total++; done++; plannedMinutes += t.expectedMinutes || 0;
      }
      continue;
    }
    if (d >= fromYmdStr && d <= toYmdStr) { total++; continue; }
    if (d && d < fromYmdStr) { total++; overdue++; }
  }
  return {
    total, done, overdue, plannedMinutes,
    pct: total ? Math.round((done / total) * 100) : 0,
  };
}

export function dailyCompletions(tasks, fromYmdStr, toYmdStr) {
  const map = new Map();
  for (const t of (tasks || [])) {
    if (t.status !== 'done' || !t.completedAt) continue;
    const d = t.completedAt.slice(0, 10);
    if (d < fromYmdStr || d > toYmdStr) continue;
    map.set(d, (map.get(d) || 0) + 1);
  }
  const out = [];
  let cur = fromYmdStr;
  while (cur <= toYmdStr) {
    out.push({ date: cur, count: map.get(cur) || 0 });
    cur = util.ymd(util.addDays(util.fromYmd(cur), 1));
  }
  return out;
}

export function dailyInsights(input, todayYmdStr) {
  const today = todayYmdStr || util.todayYmd();
  const tomorrow = util.ymd(util.addDays(util.fromYmd(today), 1));
  const in3 = util.ymd(util.addDays(util.fromYmd(today), 3));
  const inp = input || {};
  const out = [];

  /* Tasks */
  const tasks = inp.tasks || [];
  const open = tasks.filter(x => x.status !== 'done' && x.status !== 'cancelled');
  const overdueTasks = open.filter(x => x.date && x.date < today);
  const todayAll = tasks.filter(x => x.date === today && x.status !== 'cancelled');
  const todayDone = todayAll.filter(x => x.status === 'done');
  const todayOpen = todayAll.filter(x => x.status !== 'done');
  if (overdueTasks.length) out.push({
    key: 'insights.overdueTasks', tone: 'warn', icon: 'alert', params: { n: overdueTasks.length },
  });
  if (todayOpen.length) out.push({
    key: 'insights.tasksLeft', tone: 'info', icon: 'list-checks', params: { n: todayOpen.length },
  });
  if (todayAll.length && !todayOpen.length) out.push({
    key: 'insights.allDone', tone: 'ok', icon: 'check-circle',
  });

  /* Events Today */
  const evToday = (inp.events || []).filter(e => e.date === today);
  if (evToday.length) out.push({
    key: 'insights.eventsToday', tone: 'info', icon: 'calendar', params: { n: evToday.length },
  });

  /* Money Spent */
  const spent = (inp.expenses || [])
    .filter(e => e.date === today)
    .reduce((s, e) => s + (e.amount || 0), 0);
  if (spent > 0) out.push({
    key: 'insights.spentToday', tone: 'info', icon: 'wallet', money: spent,
  });

  /* Debts */
  const pays = inp.debtPayments || [];
  const unpaid = (inp.debts || []).filter(d => debtStatus(d, pays, today).state !== 'paid');
  const dueToday = unpaid.filter(d => d.dueDate === today);
  const dueTmrw = unpaid.filter(d => d.dueDate === tomorrow);
  const dueSoon = unpaid.filter(d => d.dueDate && d.dueDate > tomorrow && d.dueDate <= in3);
  const overDue = unpaid.filter(d => d.dueDate && d.dueDate < today);
  if (dueToday.length) out.push({
    key: 'insights.debtDueToday', tone: 'warn', icon: 'credit-card', params: { n: dueToday.length },
  });
  if (dueTmrw.length) out.push({
    key: 'insights.debtDueTomorrow', tone: 'warn', icon: 'credit-card', params: { n: dueTmrw.length },
  });
  if (dueSoon.length) out.push({
    key: 'insights.debtDueSoon', tone: 'info', icon: 'credit-card', params: { n: dueSoon.length },
  });
  if (overDue.length) out.push({
    key: 'insights.debtOverdue', tone: 'danger', icon: 'credit-card', params: { n: overDue.length },
  });

  /* Habits */
  const habits = inp.habits || [];
  const logs = inp.habitLogs || [];
  const scheduledToday = habits.filter(h =>
    ((h.schedule || {}).type || 'daily') === 'weekly' || habitScheduledOn(h, today));
  if (scheduledToday.length) {
    const doneN = scheduledToday.filter(h => habitDayValue(h, logs, today).done).length;
    out.push({
      key: 'insights.habitsToday', tone: doneN === scheduledToday.length ? 'ok' : 'info',
      icon: 'flame', params: { done: doneN, total: scheduledToday.length },
    });
  }

  /* Exams within 7 days */
  const nx = nextExam(inp.exams || [], today);
  if (nx && nx.daysUntil >= 0 && nx.daysUntil <= 7) out.push({
    key: 'insights.examSoon', tone: 'warn', icon: 'book', params: { days: nx.daysUntil },
  });

  return out;
}

export default {
  util,
  PRIORITIES,
  PRIORITY_WEIGHT,
  TASK_STATUSES,
  ACTIVE_STATUSES,
  EVENT_TYPES,
  HABIT_TYPES,
  validTime,
  timeToMin,
  minToTime,
  addMonthsClamped,
  nextDate,
  spawnNext,
  expandOccurrences,
  isOverdue,
  taskBucket,
  subtaskProgress,
  projectProgress,
  sortTasks,
  weekDays,
  monthGrid,
  daysInMonth,
  monthBounds,
  budgetPeriod,
  budgetStatus,
  topCategories,
  monthTrend,
  debtStatus,
  shoppingStats,
  sumMinutes,
  nextExam,
  assignmentStats,
  habitScheduledOn,
  habitDayValue,
  habitStreak,
  habitAdherence,
  goalProgress,
  reminderDue,
  taskStats,
  dailyCompletions,
  dailyInsights
};
