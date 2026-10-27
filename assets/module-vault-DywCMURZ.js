import{d as b,r as u,a as x,t as v}from"./core-nlp-CIJjAdH-.js";const y=[{id:"passport",name:"جواز سفر",icon:"🛂"},{id:"national_id",name:"بطاقة الهوية / الإقامة",icon:"🪪"},{id:"license",name:"رخصة القيادة",icon:"🚗"},{id:"contract",name:"عقد إيجار / عمل",icon:"📜"},{id:"insurance",name:"تأمين صحي / مركبة",icon:"🛡️"},{id:"warranty",name:"شهادة ضمان وفاتورة",icon:"🧾"},{id:"other",name:"وثيقة أخرى",icon:"📁"}];async function p(){return(await b.list("vault_items",{all:!0})).sort((r,n)=>r.expiryDate?n.expiryDate?r.expiryDate.localeCompare(n.expiryDate):-1:1)}async function w(a){if(!a.expiryDate)return;const r=new Date(a.expiryDate+"T09:00:00").getTime(),n=Date.now(),s=r-720*60*60*1e3;s>n&&await u.schedule({id:`vault-exp30-${a.id}`,title:`⚠️ اقتراب انتهاء ${a.name}`,body:`متبقي 30 يوماً على انتهاء صلاحية ${a.name} (${a.expiryDate}). يرجى المبادرة بالتجديد.`,timestamp:s,sound:"alert",module:"vault"});const c=r-10080*60*1e3;c>n&&await u.schedule({id:`vault-exp7-${a.id}`,title:`🚨 تنبيه حرج: انتهاء ${a.name} خلال أسبوع!`,body:`سينتهي مستند ${a.name} خلال 7 أيام فقط (${a.expiryDate}).`,timestamp:c,sound:"bell",module:"vault"})}function m(a){if(!a)return{days:null,state:"none",label:"بدون تاريخ انتهاء"};const r=new Date;r.setHours(0,0,0,0);const n=new Date(a+"T00:00:00"),s=Math.ceil((n-r)/(1e3*60*60*24));return s<0?{days:s,state:"expired",label:`منتهية منذ ${Math.abs(s)} يوم ❌`,badgeClass:"danger"}:s<=7?{days:s,state:"critical",label:`تنتهي خلال ${s} أيام 🚨`,badgeClass:"danger"}:s<=30?{days:s,state:"warning",label:`تنتهي خلال ${s} يوماً ⏱️`,badgeClass:"warn"}:{days:s,state:"valid",label:`سارية (${s} يوماً متبقية) 🟢`,badgeClass:"ok"}}async function g(a){return a.id||(a.id="vault-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,6)),a.updatedAt=new Date().toISOString(),await b.put("vault_items",a,{all:!0}),await w(a),x.notifyDataChanged(),a}async function f(a){return await b.delete("vault_items",a),await u.cancel(`vault-exp30-${a}`),await u.cancel(`vault-exp7-${a}`),x.notifyDataChanged(),!0}async function $(a){let r=await p();function n(l=null){const o=!l,e=l||{id:null,type:"national_id",name:"",docNumber:"",issueDate:"",expiryDate:"",issuer:"",notes:""},t=document.createElement("div");t.className="modal-overlay",t.setAttribute("role","dialog"),t.innerHTML=`
      <div class="modal-content" dir="rtl" style="max-width:520px;">
        <div class="modal-header">
          <h3 style="font-size:var(--fs-m);font-weight:700;">
            ${o?"إضافة وثيقة جديدة للخزينة 🪪":"تعديل بيانات الوثيقة ✏️"}
          </h3>
          <button class="btn ghost sm" id="modal-close-btn" style="padding:4px 8px;border-radius:50%;">✕</button>
        </div>

        <div class="modal-body col" style="gap:var(--sp-3);">
          <div class="row wrap" style="gap:10px;">
            <div class="col grow" style="min-width:140px;gap:4px;">
              <label class="muted xs strong">نوع الوثيقة:</label>
              <select id="v-type" class="input" style="padding:8px;border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);">
                ${y.map(d=>`
                  <option value="${d.id}" ${d.id===e.type?"selected":""}>${d.icon} ${d.name}</option>
                `).join("")}
              </select>
            </div>

            <div class="col grow" style="min-width:180px;gap:4px;">
              <label class="muted xs strong">اسم / مسمى الوثيقة:</label>
              <input type="text" id="v-name" class="input" placeholder="مثال: جواز سفري الخاص" value="${e.name||""}" style="padding:8px;border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);" />
            </div>
          </div>

          <div class="row wrap" style="gap:10px;">
            <div class="col grow" style="min-width:140px;gap:4px;">
              <label class="muted xs strong">رقم الوثيقة:</label>
              <input type="text" id="v-number" class="input" placeholder="رقم الهوية أو الجواز..." value="${e.docNumber||""}" dir="ltr" style="font-family:var(--mono);padding:8px;border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);" />
            </div>

            <div class="col grow" style="min-width:140px;gap:4px;">
              <label class="muted xs strong">جهة الإصدار:</label>
              <input type="text" id="v-issuer" class="input" placeholder="مثال: الجوازات / المرور" value="${e.issuer||""}" style="padding:8px;border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);" />
            </div>
          </div>

          <div class="row wrap" style="gap:10px;">
            <div class="col grow" style="min-width:140px;gap:4px;">
              <label class="muted xs strong">تاريخ الإصدار (اختياري):</label>
              <input type="date" id="v-issue" class="input" value="${e.issueDate||""}" style="padding:8px;font-family:var(--mono);border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);" />
            </div>

            <div class="col grow" style="min-width:140px;gap:4px;">
              <label class="muted xs strong" style="color:var(--accent);">تاريخ الانتهاء (للتنبيه المبكر):</label>
              <input type="date" id="v-expiry" class="input" value="${e.expiryDate||""}" style="padding:8px;font-family:var(--mono);border-radius:var(--radius-s);border:1px solid var(--accent);background:var(--surface);" />
            </div>
          </div>

          <div class="col" style="gap:4px;">
            <label class="muted xs strong">ملاحظات سرية إضافية:</label>
            <textarea id="v-notes" class="input" rows="2" placeholder="مكان حفظ الأصل الورقي، شروط الضمان..." style="padding:8px;border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);">${e.notes||""}</textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn ghost sm" id="modal-cancel-btn">إلغاء</button>
          <button class="btn primary sm" id="modal-save-btn">حفظ في الخزينة المشفرة 🔒</button>
        </div>
      </div>
    `,document.body.appendChild(t);const i=()=>t.remove();t.querySelector("#modal-close-btn").addEventListener("click",i),t.querySelector("#modal-cancel-btn").addEventListener("click",i),t.querySelector("#modal-save-btn").addEventListener("click",async()=>{const d=t.querySelector("#v-name").value.trim();if(!d){v.warn("يرجى إدخال اسم للوثيقة.");return}e.name=d,e.type=t.querySelector("#v-type").value,e.docNumber=t.querySelector("#v-number").value.trim(),e.issuer=t.querySelector("#v-issuer").value.trim(),e.issueDate=t.querySelector("#v-issue").value,e.expiryDate=t.querySelector("#v-expiry").value,e.notes=t.querySelector("#v-notes").value.trim(),await g(e),v.ok("تم حفظ وتأمين الوثيقة بنجاح وجدولة التنبيهات المبكرة!"),i(),r=await p(),s()})}function s(){const l=r.filter(e=>m(e.expiryDate).state==="expired").length,o=r.filter(e=>["critical","warning"].includes(m(e.expiryDate).state)).length;a.innerHTML=`
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
        ${o>0||l>0?`
          <div class="banner ${l>0?"warn":"info"}">
            <span style="font-size:20px;">${l>0?"⚠️":"🔔"}</span>
            <div class="grow">
              <strong>نظام الإنذار المبكر:</strong>
              لديك ${l>0?`<strong style="color:var(--danger);">${l} وثائق منتهية</strong> و `:""}
              ${o} وثيقة تقترب صلاحيتها من الانتهاء خلال 30 يوماً.
            </div>
          </div>
        `:""}

        <!-- Documents Grid -->
        ${r.length===0?`
          <div class="card center col" style="padding:48px 24px;text-align:center;gap:12px;">
            <div style="font-size:48px;">📂</div>
            <h3 style="font-weight:700;">خزينتك فارغة حالياً</h3>
            <p class="muted small" style="max-width:380px;">
              أضف بطاقة الهوية، جواز السفر، عقود الإيجار، أو وثائق التأمين لتأمينها وتلقي تنبيهات مبكرة قبل انتهائها.
            </p>
            <button class="btn primary sm" id="btn-empty-add-doc">+ إضافة أول وثيقة الآن</button>
          </div>
        `:`
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(310px, 1fr));gap:var(--sp-4);">
            ${r.map(e=>{const t=y.find(d=>d.id===e.type)||y[6],i=m(e.expiryDate);return`
                <div class="card col between" style="gap:14px;border-top:4px solid ${i.state==="expired"||i.state==="critical"?"var(--danger)":i.state==="warning"?"var(--warn)":"var(--accent)"};">
                  <div class="col" style="gap:10px;">
                    <div class="row between">
                      <div class="row" style="gap:10px;">
                        <span style="font-size:26px;">${t.icon}</span>
                        <div>
                          <h4 class="strong small">${e.name}</h4>
                          <span class="muted xs">${t.name}</span>
                        </div>
                      </div>
                      <span class="badge ${i.badgeClass||"info"} xs">
                        ${i.label}
                      </span>
                    </div>

                    ${e.docNumber?`
                      <div class="row between" style="padding:6px 10px;background:var(--surface-2);border-radius:var(--radius-s);font-size:var(--fs-xs);">
                        <span class="muted">الرقم:</span>
                        <span class="strong" style="font-family:var(--mono);" dir="ltr">${e.docNumber}</span>
                      </div>
                    `:""}

                    <div class="row between" style="font-size:11px;color:var(--text-muted);">
                      <span>جهة الإصدار: ${e.issuer||"غير محدد"}</span>
                      <span>الانتهاء: ${e.expiryDate||"مفتوح"}</span>
                    </div>

                    ${e.notes?`
                      <p class="muted xs" style="background:var(--surface-2);padding:6px 8px;border-radius:6px;margin:0;">
                        📝 ${e.notes}
                      </p>
                    `:""}
                  </div>

                  <!-- Card Actions -->
                  <div class="row between" style="padding-top:8px;border-top:1px solid var(--border);">
                    <button class="btn ghost sm btn-edit-doc" data-id="${e.id}">
                      تعديل ✏️
                    </button>
                    <button class="btn ghost sm btn-del-doc" data-id="${e.id}" style="color:var(--danger);">
                      حذف 🗑️
                    </button>
                  </div>
                </div>
              `}).join("")}
          </div>
        `}
      </div>
    `,c()}function c(){const l=a.querySelector("#btn-add-doc");l&&l.addEventListener("click",()=>n());const o=a.querySelector("#btn-empty-add-doc");o&&o.addEventListener("click",()=>n()),a.querySelectorAll(".btn-edit-doc").forEach(e=>{e.addEventListener("click",()=>{const t=e.getAttribute("data-id"),i=r.find(d=>d.id===t);i&&n(i)})}),a.querySelectorAll(".btn-del-doc").forEach(e=>{e.addEventListener("click",async()=>{const t=e.getAttribute("data-id");confirm("هل أنت متأكد من حذف هذه الوثيقة من الخزينة؟")&&(await f(t),v.info("تم حذف الوثيقة."),r=await p(),s())})})}s()}const D={render:$,list:p,save:g,delete:f};export{D as v};
