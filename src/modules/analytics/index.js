/* ============================================================
   LifeFlow — Cross-Module Analytics & AI Coach Module
   Sleep, Mood, Focus & Financial Insights + Gemini AI Advisor
   ============================================================ */

import { db } from '../../core/db.js';
import { toast } from '../../ui/toast.js';

const STORAGE_GEMINI_KEY = 'lf.gemini.key';

export function getGeminiApiKey() {
  return localStorage.getItem(STORAGE_GEMINI_KEY) || '';
}

export function setGeminiApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem(STORAGE_GEMINI_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_GEMINI_KEY);
  }
}

/**
 * Gather cross-module data summary for analytics & AI coaching
 */
export async function getCrossModuleSummary() {
  const [healthLogs, focusSessions, tasks, expenses, routines] = await Promise.all([
    db.list('health_logs', { all: true }),
    db.list('focus_sessions', { all: true }),
    db.list('tasks', { all: true }),
    db.list('expenses', { all: true }),
    db.list('routines', { all: true })
  ]);

  // Total Focus minutes
  const totalFocusMin = focusSessions.reduce((acc, s) => acc + (s.minutes || 0), 0);

  // Health stats
  const avgWater = healthLogs.length > 0
    ? Math.round(healthLogs.reduce((acc, h) => acc + (h.waterCurrent || 0), 0) / healthLogs.length)
    : 1500;

  const avgSleep = healthLogs.length > 0
    ? Math.round((healthLogs.reduce((acc, h) => acc + (h.sleepHours || 8), 0) / healthLogs.length) * 10) / 10
    : 7.5;

  // Task stats
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Financial stats
  const totalSpent = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  return {
    totalFocusMin,
    avgWater,
    avgSleep,
    totalTasks,
    doneTasks,
    completionRate,
    totalSpent,
    focusSessionsCount: focusSessions.length,
    healthLogsCount: healthLogs.length,
    routines
  };
}

/**
 * Generate Local Offline Intelligent Insights
 */
export function generateLocalInsights(summary) {
  const tips = [];

  // 1. Sleep & Mood correlation
  if (summary.avgSleep < 6.5) {
    tips.push({
      tone: 'warn',
      icon: '🌙',
      title: 'تنبيه دين النوم (Sleep Debt)',
      text: `معدل نومك الأخير (${summary.avgSleep} ساعات) أقل من المعدل الموصى به (7-8 ساعات). قلة النوم ترفع هرمون التوتر وتقلل كفاءة التركيز بنسبة 30%. جرب تفعيل روتين المساء الليلة للنوم في موعد أبكر.`
    });
  } else {
    tips.push({
      tone: 'ok',
      icon: '✨',
      title: 'استقرار ممتاز في ساعات النوم',
      text: `معدل نومك (${summary.avgSleep} ساعات) مثالي جداً لتجديد الطاقة العصبية ودعم الإنجاز الذهني العالي.`
    });
  }

  // 2. Hydration analysis
  if (summary.avgWater < 2000) {
    tips.push({
      tone: 'info',
      icon: '💧',
      title: 'زيادة ترطيب الجسم مطلوبة',
      text: `معدل شربك للماء يبلغ ${summary.avgWater} مل يومياً. زيادة 500 مل فقط كافية لزيادة نشاطك وطاقتك أثناء جلسات بومودورو.`
    });
  }

  // 3. Deep Focus & Flow State
  if (summary.totalFocusMin >= 50) {
    tips.push({
      tone: 'ok',
      icon: '🎯',
      title: 'ساعات تركيز متميزة',
      text: `حققت ${summary.totalFocusMin} دقيقة تركيز عبر بومودورو! الاستمرار على هذا النمط يضمن إنهاء أهم مشاريعك الأسبوعية في وقت قياسي.`
    });
  } else {
    tips.push({
      tone: 'info',
      icon: '⏱️',
      title: 'فرصة لتعميق التركيز',
      text: `ابدأ جلسة بومودورو واحدة يومياً (25 دقيقة) مع تشغيل أصوات المطر المحيطية لتثبيت عادة التدفق الذهني.`
    });
  }

  // 4. Tasks & Productivity
  if (summary.completionRate >= 60) {
    tips.push({
      tone: 'ok',
      icon: '🚀',
      title: 'معدل إنجاز رائع للمهام',
      text: `أنجزت ${summary.completionRate}% من مهامك المسجلة. أنت في المسار الصحيح تماماً.`
    });
  }

  return tips;
}

/**
 * Ask Google Gemini for an Executive AI Life Coach Assessment
 */
export async function askGeminiCoach(summary) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('يرجى إدخال مفتاح Gemini API أولاً للاستفادة من التحليل الذكي المتقدم.');
  }

  const promptText = `
أنت مستشار ومدرب شخصي عالي الكفاءة للإنتاجية وإدارة الحياة (Executive Life & Productivity Coach).
حلل بيانات المستخدم التالية وقدم تحليلاً ملهماً واحترافياً ومباشراً باللغة العربية بأسلوب راقٍ، يحتوي على 3 نصائح عملية فورية:

- معدل النوم اليومي: ${summary.avgSleep} ساعات
- معدل شرب الماء اليومي: ${summary.avgWater} مل
- إجمالي دقائق التركيز العميق (بومودورو): ${summary.totalFocusMin} دقيقة
- معدل إنجاز المهام: ${summary.completionRate}% (${summary.doneTasks} من أصل ${summary.totalTasks})
- إجمالي المصروفات المالية المسجلة: ${summary.totalSpent} ريال

اجعل الرد ملخصاً وبنقاط واضحة ومحفزة.
  `.trim();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }]
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error ? errData.error.message : `فشل الاتصال بـ Gemini API (${res.status})`);
  }

  const json = await res.json();
  const reply = json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0].text;
  return reply || 'لم يتم استلام رد كافٍ من الذكاء الاصطناعي.';
}

/**
 * Render Cross-Module Analytics & AI Coach View
 */
export async function renderAnalyticsView(container) {
  const summary = await getCrossModuleSummary();
  const localTips = generateLocalInsights(summary);
  let geminiResult = null;
  let isCallingGemini = false;

  function render() {
    container.innerHTML = `
      <div class="col" style="gap:var(--sp-5);">
        <!-- Title & Subtitle -->
        <div class="row between wrap" style="gap:12px;">
          <div>
            <h2 style="font-size:var(--fs-xl);font-weight:800;">التحليلات الحياتية ومستشار الذكاء الاصطناعي 📈</h2>
            <p class="muted small" style="margin-top:2px;">رؤى شاملة تتقاطع بين النوم، التركيز، شرب الماء، والإنجاز اليومي</p>
          </div>
          <span class="badge accent">تحليلات متكاملة</span>
        </div>

        <!-- Metric Cards Grid -->
        <div class="kpi-grid">
          <!-- Focus Hours KPI -->
          <div class="kpi-card">
            <div class="kpi-icon" style="background:rgba(13, 148, 136, 0.15);color:var(--accent);">
              ⏱️
            </div>
            <div class="kpi-content">
              <span class="kpi-title">التركيز وبومودورو</span>
              <span class="kpi-val">${summary.totalFocusMin} دقيقة</span>
              <span class="kpi-desc">${summary.focusSessionsCount} جلسات مسجلة</span>
            </div>
          </div>

          <!-- Sleep Quality KPI -->
          <div class="kpi-card">
            <div class="kpi-icon" style="background:rgba(99, 102, 241, 0.15);color:#6366f1;">
              🌙
            </div>
            <div class="kpi-content">
              <span class="kpi-title">معدل ساعات النوم</span>
              <span class="kpi-val">${summary.avgSleep} ساعة / يوم</span>
              <span class="kpi-desc">${summary.avgSleep >= 7 ? 'كافٍ ومثالي 🟢' : 'دون المعدل الطبيعي ⚠️'}</span>
            </div>
          </div>

          <!-- Hydration Average KPI -->
          <div class="kpi-card">
            <div class="kpi-icon" style="background:rgba(2, 132, 199, 0.15);color:#0284c7;">
              💧
            </div>
            <div class="kpi-content">
              <span class="kpi-title">متوسط شرب الماء</span>
              <span class="kpi-val">${summary.avgWater} مل / يوم</span>
              <span class="kpi-desc">الهدف: 2500 مل</span>
            </div>
          </div>

          <!-- Tasks Completion KPI -->
          <div class="kpi-card">
            <div class="kpi-icon" style="background:rgba(13, 115, 80, 0.15);color:var(--ok);">
              🚀
            </div>
            <div class="kpi-content">
              <span class="kpi-title">نسبة إنجاز المهام</span>
              <span class="kpi-val">${summary.completionRate}%</span>
              <span class="kpi-desc">${summary.doneTasks} من أصل ${summary.totalTasks} مهمة</span>
            </div>
          </div>
        </div>

        <!-- AI Coach Section -->
        <section class="card col" style="gap:var(--sp-4);background:linear-gradient(135deg, var(--surface) 75%, rgba(99, 102, 241, 0.08));border:1.5px solid rgba(99, 102, 241, 0.2);">
          <div class="row between wrap" style="gap:10px;">
            <div class="row" style="gap:12px;">
              <div class="logo-badge" style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg, #6366f1, #4f46e5);color:#fff;font-size:20px;">
                🤖
              </div>
              <div>
                <h3 style="font-size:var(--fs-l);font-weight:800;">المستشار الشخصي الذكي (LifeFlow Coach)</h3>
                <div class="muted xs">توصيات مخصصة لتحسين جودة يومك وأدائك الذهني</div>
              </div>
            </div>

            <!-- Gemini Trigger Button -->
            <button class="btn primary sm" id="btn-call-gemini" ${isCallingGemini ? 'disabled' : ''} style="background:linear-gradient(135deg, #4f46e5, #7c3aed);gap:8px;">
              ${isCallingGemini ? 'جارٍ التحليل الذكي... ⏳' : 'تحليل أدائي بـ Gemini AI 🤖'}
            </button>
          </div>

          <!-- Gemini Result Box (if available) -->
          ${geminiResult ? `
            <div class="card" style="padding:16px;background:var(--surface-2);border-radius:var(--radius-m);border:1px solid var(--accent);line-height:1.7;white-space:pre-wrap;font-size:var(--fs-s);">
              <div class="row between" style="margin-bottom:8px;">
                <strong style="color:var(--accent);">تقرير المستشار الذكي (Gemini AI):</strong>
                <button class="btn ghost sm" id="btn-clear-gemini" style="padding:2px 8px;font-size:11px;">إغلاق التقرير</button>
              </div>
              ${geminiResult}
            </div>
          ` : ''}

          <!-- Local Offline Smart Insights -->
          <div class="col" style="gap:10px;">
            <span class="strong small muted">رؤى وتحليلات نمط الحياة المباشرة:</span>
            <div class="col" style="gap:10px;">
              ${localTips.map(tip => `
                <div class="banner ${tip.tone}" style="align-items:flex-start;margin-bottom:0;">
                  <span style="font-size:22px;flex:none;margin-top:2px;">${tip.icon}</span>
                  <div class="grow col" style="gap:2px;">
                    <strong style="font-size:var(--fs-s);">${tip.title}</strong>
                    <div style="font-size:var(--fs-xs);line-height:1.6;">${tip.text}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Optional Gemini API Key Box -->
          <div class="row between wrap" style="gap:8px;padding-top:10px;border-top:1px solid var(--border);font-size:11px;">
            <div class="row grow" style="gap:6px;">
              <span class="muted">مفتاح Google Gemini API (اختياري للتحليل العميق):</span>
              <input type="password" id="gemini-api-key" placeholder="AIzaSy..." value="${getGeminiApiKey()}" dir="ltr" style="font-family:var(--mono);padding:4px 8px;border-radius:6px;border:1px solid var(--border);background:var(--surface);width:160px;font-size:11px;" />
              <button class="btn ghost sm" id="btn-save-gemini-key" style="padding:3px 8px;font-size:11px;">حفظ</button>
            </div>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" class="muted" style="text-decoration:underline;">احصل على مفتاح مجاني من Google AI Studio ↗</a>
          </div>
        </section>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // Save Gemini Key
    const saveKeyBtn = container.querySelector('#btn-save-gemini-key');
    if (saveKeyBtn) {
      saveKeyBtn.addEventListener('click', () => {
        const val = container.querySelector('#gemini-api-key').value.trim();
        setGeminiApiKey(val);
        toast.ok('تم حفظ مفتاح Gemini API بنجاح.');
      });
    }

    // Call Gemini AI
    const geminiBtn = container.querySelector('#btn-call-gemini');
    if (geminiBtn) {
      geminiBtn.addEventListener('click', async () => {
        if (!getGeminiApiKey()) {
          toast.warn('يرجى حفظ مفتاح Gemini API في الأسفل أولاً، أو استفد من التحليلات المحلية المتاحة مجاناً.');
          return;
        }

        isCallingGemini = true;
        render();

        try {
          geminiResult = await askGeminiCoach(summary);
          toast.ok('تم إصدار تقرير المستشار الذكي بنجاح!');
        } catch (err) {
          toast.error(err.message);
        } finally {
          isCallingGemini = false;
          render();
        }
      });
    }

    const clearGeminiBtn = container.querySelector('#btn-clear-gemini');
    if (clearGeminiBtn) {
      clearGeminiBtn.addEventListener('click', () => {
        geminiResult = null;
        render();
      });
    }
  }

  render();
}

export default {
  render: renderAnalyticsView,
  getSummary: getCrossModuleSummary
};
