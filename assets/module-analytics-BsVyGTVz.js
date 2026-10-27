import{d as g,t as u}from"./core-nlp-CIJjAdH-.js";const f="lf.gemini.key";function k(){return localStorage.getItem(f)||""}function b(e){e&&e.trim()?localStorage.setItem(f,e.trim()):localStorage.removeItem(f)}async function h(){const[e,t,r,o,a]=await Promise.all([g.list("health_logs",{all:!0}),g.list("focus_sessions",{all:!0}),g.list("tasks",{all:!0}),g.list("expenses",{all:!0}),g.list("routines",{all:!0})]),i=t.reduce((n,l)=>n+(l.minutes||0),0),v=e.length>0?Math.round(e.reduce((n,l)=>n+(l.waterCurrent||0),0)/e.length):1500,s=e.length>0?Math.round(e.reduce((n,l)=>n+(l.sleepHours||8),0)/e.length*10)/10:7.5,c=r.length,d=r.filter(n=>n.status==="done").length,p=c>0?Math.round(d/c*100):0,x=o.reduce((n,l)=>n+(l.amount||0),0);return{totalFocusMin:i,avgWater:v,avgSleep:s,totalTasks:c,doneTasks:d,completionRate:p,totalSpent:x,focusSessionsCount:t.length,healthLogsCount:e.length,routines:a}}function m(e){const t=[];return e.avgSleep<6.5?t.push({tone:"warn",icon:"🌙",title:"تنبيه دين النوم (Sleep Debt)",text:`معدل نومك الأخير (${e.avgSleep} ساعات) أقل من المعدل الموصى به (7-8 ساعات). قلة النوم ترفع هرمون التوتر وتقلل كفاءة التركيز بنسبة 30%. جرب تفعيل روتين المساء الليلة للنوم في موعد أبكر.`}):t.push({tone:"ok",icon:"✨",title:"استقرار ممتاز في ساعات النوم",text:`معدل نومك (${e.avgSleep} ساعات) مثالي جداً لتجديد الطاقة العصبية ودعم الإنجاز الذهني العالي.`}),e.avgWater<2e3&&t.push({tone:"info",icon:"💧",title:"زيادة ترطيب الجسم مطلوبة",text:`معدل شربك للماء يبلغ ${e.avgWater} مل يومياً. زيادة 500 مل فقط كافية لزيادة نشاطك وطاقتك أثناء جلسات بومودورو.`}),e.totalFocusMin>=50?t.push({tone:"ok",icon:"🎯",title:"ساعات تركيز متميزة",text:`حققت ${e.totalFocusMin} دقيقة تركيز عبر بومودورو! الاستمرار على هذا النمط يضمن إنهاء أهم مشاريعك الأسبوعية في وقت قياسي.`}):t.push({tone:"info",icon:"⏱️",title:"فرصة لتعميق التركيز",text:"ابدأ جلسة بومودورو واحدة يومياً (25 دقيقة) مع تشغيل أصوات المطر المحيطية لتثبيت عادة التدفق الذهني."}),e.completionRate>=60&&t.push({tone:"ok",icon:"🚀",title:"معدل إنجاز رائع للمهام",text:`أنجزت ${e.completionRate}% من مهامك المسجلة. أنت في المسار الصحيح تماماً.`}),t}async function y(e){const t=k();if(!t)throw new Error("يرجى إدخال مفتاح Gemini API أولاً للاستفادة من التحليل الذكي المتقدم.");const r=`
أنت مستشار ومدرب شخصي عالي الكفاءة للإنتاجية وإدارة الحياة (Executive Life & Productivity Coach).
حلل بيانات المستخدم التالية وقدم تحليلاً ملهماً واحترافياً ومباشراً باللغة العربية بأسلوب راقٍ، يحتوي على 3 نصائح عملية فورية:

- معدل النوم اليومي: ${e.avgSleep} ساعات
- معدل شرب الماء اليومي: ${e.avgWater} مل
- إجمالي دقائق التركيز العميق (بومودورو): ${e.totalFocusMin} دقيقة
- معدل إنجاز المهام: ${e.completionRate}% (${e.doneTasks} من أصل ${e.totalTasks})
- إجمالي المصروفات المالية المسجلة: ${e.totalSpent} ريال

اجعل الرد ملخصاً وبنقاط واضحة ومحفزة.
  `.trim(),o=`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${t}`,a=await fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:r}]}]})});if(!a.ok){const s=await a.json().catch(()=>({}));throw new Error(s.error?s.error.message:`فشل الاتصال بـ Gemini API (${a.status})`)}const i=await a.json();return i.candidates&&i.candidates[0]&&i.candidates[0].content&&i.candidates[0].content.parts[0].text||"لم يتم استلام رد كافٍ من الذكاء الاصطناعي."}async function w(e){const t=await h(),r=m(t);let o=null,a=!1;function i(){e.innerHTML=`
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
              <span class="kpi-val">${t.totalFocusMin} دقيقة</span>
              <span class="kpi-desc">${t.focusSessionsCount} جلسات مسجلة</span>
            </div>
          </div>

          <!-- Sleep Quality KPI -->
          <div class="kpi-card">
            <div class="kpi-icon" style="background:rgba(99, 102, 241, 0.15);color:#6366f1;">
              🌙
            </div>
            <div class="kpi-content">
              <span class="kpi-title">معدل ساعات النوم</span>
              <span class="kpi-val">${t.avgSleep} ساعة / يوم</span>
              <span class="kpi-desc">${t.avgSleep>=7?"كافٍ ومثالي 🟢":"دون المعدل الطبيعي ⚠️"}</span>
            </div>
          </div>

          <!-- Hydration Average KPI -->
          <div class="kpi-card">
            <div class="kpi-icon" style="background:rgba(2, 132, 199, 0.15);color:#0284c7;">
              💧
            </div>
            <div class="kpi-content">
              <span class="kpi-title">متوسط شرب الماء</span>
              <span class="kpi-val">${t.avgWater} مل / يوم</span>
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
              <span class="kpi-val">${t.completionRate}%</span>
              <span class="kpi-desc">${t.doneTasks} من أصل ${t.totalTasks} مهمة</span>
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
            <button class="btn primary sm" id="btn-call-gemini" ${a?"disabled":""} style="background:linear-gradient(135deg, #4f46e5, #7c3aed);gap:8px;">
              ${a?"جارٍ التحليل الذكي... ⏳":"تحليل أدائي بـ Gemini AI 🤖"}
            </button>
          </div>

          <!-- Gemini Result Box (if available) -->
          ${o?`
            <div class="card" style="padding:16px;background:var(--surface-2);border-radius:var(--radius-m);border:1px solid var(--accent);line-height:1.7;white-space:pre-wrap;font-size:var(--fs-s);">
              <div class="row between" style="margin-bottom:8px;">
                <strong style="color:var(--accent);">تقرير المستشار الذكي (Gemini AI):</strong>
                <button class="btn ghost sm" id="btn-clear-gemini" style="padding:2px 8px;font-size:11px;">إغلاق التقرير</button>
              </div>
              ${o}
            </div>
          `:""}

          <!-- Local Offline Smart Insights -->
          <div class="col" style="gap:10px;">
            <span class="strong small muted">رؤى وتحليلات نمط الحياة المباشرة:</span>
            <div class="col" style="gap:10px;">
              ${r.map(s=>`
                <div class="banner ${s.tone}" style="align-items:flex-start;margin-bottom:0;">
                  <span style="font-size:22px;flex:none;margin-top:2px;">${s.icon}</span>
                  <div class="grow col" style="gap:2px;">
                    <strong style="font-size:var(--fs-s);">${s.title}</strong>
                    <div style="font-size:var(--fs-xs);line-height:1.6;">${s.text}</div>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Optional Gemini API Key Box -->
          <div class="row between wrap" style="gap:8px;padding-top:10px;border-top:1px solid var(--border);font-size:11px;">
            <div class="row grow" style="gap:6px;">
              <span class="muted">مفتاح Google Gemini API (اختياري للتحليل العميق):</span>
              <input type="password" id="gemini-api-key" placeholder="AIzaSy..." value="${k()}" dir="ltr" style="font-family:var(--mono);padding:4px 8px;border-radius:6px;border:1px solid var(--border);background:var(--surface);width:160px;font-size:11px;" />
              <button class="btn ghost sm" id="btn-save-gemini-key" style="padding:3px 8px;font-size:11px;">حفظ</button>
            </div>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" class="muted" style="text-decoration:underline;">احصل على مفتاح مجاني من Google AI Studio ↗</a>
          </div>
        </section>
      </div>
    `,v()}function v(){const s=e.querySelector("#btn-save-gemini-key");s&&s.addEventListener("click",()=>{const p=e.querySelector("#gemini-api-key").value.trim();b(p),u.ok("تم حفظ مفتاح Gemini API بنجاح.")});const c=e.querySelector("#btn-call-gemini");c&&c.addEventListener("click",async()=>{if(!k()){u.warn("يرجى حفظ مفتاح Gemini API في الأسفل أولاً، أو استفد من التحليلات المحلية المتاحة مجاناً.");return}a=!0,i();try{o=await y(t),u.ok("تم إصدار تقرير المستشار الذكي بنجاح!")}catch(p){u.error(p.message)}finally{a=!1,i()}});const d=e.querySelector("#btn-clear-gemini");d&&d.addEventListener("click",()=>{o=null,i()})}i()}const S={render:w,getSummary:h};export{S as a};
