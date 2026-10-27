import{t as c,d as g,S as oe,a as b,b as k,r as S,c as ae,p as Se,e as Le,n as _}from"./core-nlp-CIJjAdH-.js";import{c as q}from"./core-crypto-DYLi8Ihy.js";import{v as re}from"./module-vault-DywCMURZ.js";import{a as Ee}from"./module-analytics-BsVyGTVz.js";import{i as $e,r as Ae}from"./core-legacy-views-BT7ujz04.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const r of a.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function i(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(o){if(o.ep)return;o.ep=!0;const a=i(o);fetch(o.href,a)}})();let T=null,de="checking";const le=new Set;function H(){return typeof window>"u"?!1:window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches||window.matchMedia&&window.matchMedia("(display-mode: fullscreen)").matches||window.navigator.standalone===!0||typeof document<"u"&&document.referrer&&document.referrer.includes("android-app://")}function ze(){if(typeof window>"u")return!1;const t=window.navigator.userAgent.toLowerCase();return/iphone|ipad|ipod/.test(t)&&!window.MSStream}function D(t){de=t,le.forEach(e=>{try{e(t)}catch(i){console.error(i)}})}function Ce(){const t=document.getElementById("lf-ios-install-modal");t&&t.remove();const e=document.createElement("div");e.id="lf-ios-install-modal",e.className="modal-overlay",e.setAttribute("role","dialog"),e.setAttribute("aria-modal","true"),e.innerHTML=`
    <div class="modal-content" dir="rtl" style="max-width:440px;">
      <div class="modal-header">
        <div class="row" style="gap:10px;align-items:center;">
          <div class="logo-badge" style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg, #0d9488, #0f766e);color:#fff;display:flex;align-items:center;justify-content:center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <h3 style="font-size:var(--fs-m);font-weight:700;margin:0;">تثبيت LifeFlow على iPhone / iPad</h3>
            <div class="muted" style="font-size:var(--fs-xs);margin-top:2px;">يعمل بملء الشاشة وبدون اتصال بالإنترنت</div>
          </div>
        </div>
        <button class="btn ghost sm" id="lf-ios-close-btn" aria-label="إغلاق" style="padding:4px 8px;border-radius:50%;font-size:16px;">✕</button>
      </div>

      <div class="modal-body" style="display:flex;flex-direction:column;gap:12px;">
        <div class="ios-step" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface-2);border-radius:var(--radius-s);border:1px solid var(--border);">
          <div class="ios-step-num" style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">1</div>
          <div class="grow">
            <div class="strong" style="font-size:var(--fs-s);">اضغط زر المشاركة (Share)</div>
            <div class="muted" style="font-size:var(--fs-xs);">ابحث عن أيقونة المربع بسهم للأعلى في أسفل شاشة Safari</div>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
        </div>

        <div class="ios-step" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface-2);border-radius:var(--radius-s);border:1px solid var(--border);">
          <div class="ios-step-num" style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">2</div>
          <div class="grow">
            <div class="strong" style="font-size:var(--fs-s);">اختر "إضافة إلى الشاشة الرئيسية"</div>
            <div class="muted" style="font-size:var(--fs-xs);">مرر قائمة الخيارات لأسفل واضغط على (Add to Home Screen)</div>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        </div>

        <div class="ios-step" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface-2);border-radius:var(--radius-s);border:1px solid var(--border);">
          <div class="ios-step-num" style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">3</div>
          <div class="grow">
            <div class="strong" style="font-size:var(--fs-s);">اضغط على "إضافة (Add)"</div>
            <div class="muted" style="font-size:var(--fs-xs);">في الزاوية العلوية ليظهر التطبيق في شاشتك الرئيسية كأي تطبيق أصلي</div>
          </div>
          <span style="font-weight:700;color:var(--accent);font-size:var(--fs-s);">إضافة</span>
        </div>
      </div>

      <div class="modal-footer" style="padding-top:12px;border-top:1px solid var(--border);">
        <button class="btn primary sm" id="lf-ios-ok-btn" style="width:100%;padding:10px;font-weight:700;">فهمت، سأقوم بالتثبيت الآن</button>
      </div>
    </div>
  `,document.body.appendChild(e);const i=()=>e.remove();e.querySelector("#lf-ios-close-btn").addEventListener("click",i),e.querySelector("#lf-ios-ok-btn").addEventListener("click",i),e.addEventListener("click",s=>{s.target===e&&i()})}function Ie(){const t=document.getElementById("lf-android-install-modal");t&&t.remove();const e=document.createElement("div");e.id="lf-android-install-modal",e.className="modal-overlay",e.setAttribute("role","dialog"),e.setAttribute("aria-modal","true"),e.innerHTML=`
    <div class="modal-content" dir="rtl" style="max-width:440px;">
      <div class="modal-header">
        <div class="row" style="gap:10px;align-items:center;">
          <div class="logo-badge" style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg, #0d9488, #0f766e);color:#fff;display:flex;align-items:center;justify-content:center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
          </div>
          <div>
            <h3 style="font-size:var(--fs-m);font-weight:700;margin:0;">تثبيت LifeFlow على هاتفك</h3>
            <div class="muted" style="font-size:var(--fs-xs);margin-top:2px;">لتشغيل التطبيق بملء الشاشة وبدون إنترنت</div>
          </div>
        </div>
        <button class="btn ghost sm" id="lf-android-close-btn" aria-label="إغلاق" style="padding:4px 8px;border-radius:50%;font-size:16px;">✕</button>
      </div>

      <div class="modal-body" style="display:flex;flex-direction:column;gap:12px;">
        <div class="ios-step" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface-2);border-radius:var(--radius-s);border:1px solid var(--border);">
          <div class="ios-step-num" style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">1</div>
          <div class="grow">
            <div class="strong" style="font-size:var(--fs-s);">افتح قائمة المتصفح (⋮)</div>
            <div class="muted" style="font-size:var(--fs-xs);">اضغط على الثلاث نقاط في الزاوية العلوية أو السفلية لمتصفح Chrome</div>
          </div>
          <span style="font-size:22px;font-weight:bold;">⋮</span>
        </div>

        <div class="ios-step" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface-2);border-radius:var(--radius-s);border:1px solid var(--border);">
          <div class="ios-step-num" style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">2</div>
          <div class="grow">
            <div class="strong" style="font-size:var(--fs-s);">اختر "تثبيت التطبيق" أو "إضافة للشاشة"</div>
            <div class="muted" style="font-size:var(--fs-xs);">اضغط على خيار (Install App) أو (Add to Home screen)</div>
          </div>
          <span style="font-size:22px;">📲</span>
        </div>

        <div class="ios-step" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface-2);border-radius:var(--radius-s);border:1px solid var(--border);">
          <div class="ios-step-num" style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">3</div>
          <div class="grow">
            <div class="strong" style="font-size:var(--fs-s);">تأكيد التثبيت</div>
            <div class="muted" style="font-size:var(--fs-xs);">اضغط "تثبيت" وسيظهر التطبيق فوراً على شاشتك الرئيسية كأي تطبيق أصلي</div>
          </div>
          <span style="font-weight:700;color:var(--accent);font-size:var(--fs-s);">تثبيت</span>
        </div>
      </div>

      <div class="modal-footer" style="padding-top:12px;border-top:1px solid var(--border);">
        <button class="btn primary sm" id="lf-android-ok-btn" style="width:100%;padding:10px;font-weight:700;">حسناً، فهمت الطريقة</button>
      </div>
    </div>
  `,document.body.appendChild(e);const i=()=>e.remove();e.querySelector("#lf-android-close-btn").addEventListener("click",i),e.querySelector("#lf-android-ok-btn").addEventListener("click",i),e.addEventListener("click",s=>{s.target===e&&i()})}async function R(){if(H())return c.info("التطبيق مثبت بالفعل ويعمل كـ تطبيق مستقل."),{outcome:"already-installed"};if(T)try{T.prompt();const t=await T.userChoice;return t&&t.outcome==="accepted"?(c.ok("جارٍ تثبيت تطبيق LifeFlow بنجاح..."),D("standalone"),Q()):c.info("تم إلغاء التثبيت مؤقتاً."),T=null,t}catch(t){console.warn("[Install Prompt Error]",t)}return ze()?(Ce(),{outcome:"ios-guided"}):(Ie(),{outcome:"android-guided"})}function Be(){if(H()||typeof sessionStorage<"u"&&sessionStorage.getItem("lf_install_banner_dismissed")==="true"||document.getElementById("lf-install-banner"))return;const t=document.createElement("div");t.id="lf-install-banner",t.className="install-banner",t.setAttribute("dir","rtl"),t.innerHTML=`
    <div class="install-banner-content">
      <div class="row" style="gap:10px;align-items:center;">
        <div class="banner-badge">📲</div>
        <div class="col" style="gap:2px;">
          <strong style="font-size:12.5px;color:var(--text);">ثبّت LifeFlow على هاتفك ليعمل بدون نت ⚡</strong>
          <span class="muted" style="font-size:11px;">تطبيق أصلي سريع • بدون استهلاك باقة الإنترنت</span>
        </div>
      </div>
      <div class="row" style="gap:8px;align-items:center;">
        <button class="btn primary sm" id="btn-banner-install" style="font-weight:700;padding:6px 14px;box-shadow:0 2px 8px rgba(13,148,136,0.3);white-space:nowrap;">تثبيت الآن</button>
        <button class="btn ghost sm" id="btn-banner-dismiss" style="padding:4px 8px;border-radius:50%;color:var(--text-muted);" title="إغلاق">✕</button>
      </div>
    </div>
  `,document.body.appendChild(t),t.querySelector("#btn-banner-install").addEventListener("click",()=>{R()}),t.querySelector("#btn-banner-dismiss").addEventListener("click",()=>{t.classList.add("hide"),setTimeout(()=>t.remove(),250),sessionStorage.setItem("lf_install_banner_dismissed","true")})}function Q(){const t=document.getElementById("lf-install-banner");t&&t.remove()}function Te(t={}){if(t.onStateChange&&le.add(t.onStateChange),H()){console.log("[LifeFlow PWA] Running in Standalone mode."),D("standalone"),Q();return}if(D("ready"),window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),T=e,console.log("[LifeFlow PWA] captured beforeinstallprompt event."),D("prompt-ready")}),window.addEventListener("appinstalled",()=>{T=null,console.log("[LifeFlow PWA] App successfully installed!"),c.ok("مبارك! تم تثبيت LifeFlow على جهازك بنجاح."),D("standalone"),Q();const e=document.getElementById("pwa-install-btn");e&&(e.style.display="none")}),t.triggerBtnId){const e=document.getElementById(t.triggerBtnId);e&&e.addEventListener("click",()=>R())}t.onStateChange&&t.onStateChange(de)}const ce="LifeFlow-Instant-Vault-AES256-Key-2026-ZeroFriction";async function pe(){await g.open();const t={app:"LifeFlow",format:"LifeFlow-FullBackup",version:2,exportedAt:new Date().toISOString(),stores:{},legacy:null,prefs:{}};for(const e of oe)try{t.stores[e]=await g.list(e,{all:!0})}catch{t.stores[e]=[]}if(typeof window<"u"&&window.LF&&window.LF.db&&typeof window.LF.db.exportUser=="function")try{const e=await window.LF.db.exportUser();t.legacy={data:e,settings:window.LF.store?window.LF.store.settings:{}}}catch(e){console.warn("[Instant Backup] Legacy dump skipped:",e)}if(typeof localStorage<"u")try{t.prefs={theme:localStorage.getItem("lf.theme")||localStorage.getItem("lf.prefs"),activeWorkspace:localStorage.getItem("lf.activeWorkspace")}}catch{}return t}async function Me(){try{c.info("جارٍ تجهيز وتشفير النسخة الاحتياطية...");const t=await pe(),e=await q.encrypt(t,ce);let i=0;for(const u of Object.keys(t.stores))i+=(t.stores[u]||[]).length;const s=new Date,o=s.toISOString().slice(0,10),a=`${String(s.getHours()).padStart(2,"0")}${String(s.getMinutes()).padStart(2,"0")}`,r=`lifeflow-backup-encrypted-${o}-${a}.lfb`,n=JSON.stringify(e,null,2),d=new Blob([n],{type:"application/octet-stream;charset=utf-8"}),p=URL.createObjectURL(d),l=document.createElement("a");return l.href=p,l.download=r,document.body.appendChild(l),l.click(),l.remove(),setTimeout(()=>URL.revokeObjectURL(p),1e3),c.ok(`تم تنزيل النسخة المشفرة بنجاح (${i} سجل) 📥`),{success:!0,filename:r,totalRecords:i}}catch(t){throw console.error("[Instant Backup Error]",t),c.error("فشل تصدير النسخة الاحتياطية: "+t.message),t}}async function ue(t,e=""){let i=typeof t=="string"?JSON.parse(t):t,s=i;if(i.encrypted&&i.ciphertext){let a=null;try{a=await q.decrypt(i,ce)}catch{if(e)a=await q.decrypt(i,e);else if(typeof window<"u"&&window.LF&&window.LF.data&&window.LF.data.decryptBackup)try{a=await window.LF.data.decryptBackup(i,e||"lifeflow")}catch{const d=prompt("هذه النسخة محمية بكلمة مرور خاصة. يرجى إدخال كلمة المرور:");if(!d)throw new Error("تم إلغاء عملية الاستعادة.");a=await q.decrypt(i,d)}else{const n=prompt("هذه النسخة محمية بكلمة مرور خاصة. يرجى إدخال كلمة المرور:");if(!n)throw new Error("تم إلغاء عملية الاستعادة.");a=await q.decrypt(i,n)}}s=a}await g.open();let o=0;if(s.stores)for(const a of Object.keys(s.stores)){if(!oe.includes(a))continue;const r=s.stores[a]||[];for(const n of r)await g.put(a,n,{all:!0}),o++}if(s.legacy&&typeof window<"u"&&window.LF&&window.LF.data&&window.LF.data.restoreBackup)try{await window.LF.data.restoreBackup(s.legacy)}catch(a){console.warn("[Instant Restore] Legacy restore error:",a)}else if(s.data&&typeof window<"u"&&window.LF&&window.LF.data&&window.LF.data.restoreBackup)try{await window.LF.data.restoreBackup(s)}catch(a){console.warn("[Instant Restore] Monolith backup restore error:",a)}return b.notifyDataChanged(),typeof localStorage<"u"&&localStorage.setItem("lf.sync.lastSyncAt",new Date().toISOString()),{success:!0,restoredCount:o}}function Ne(){return new Promise(t=>{const e=document.createElement("input");e.type="file",e.accept=".lfb,.json,application/json,text/plain",e.style.display="none",e.onchange=async i=>{const s=i.target.files&&i.target.files[0];if(!s){t(!1);return}c.info("جارٍ قراءة واستعادة ملف النسخة الاحتياطية...");try{const o=await s.text(),a=await ue(o);if(c.ok(`تمت استعادة كافة البيانات بنجاح (${a.restoredCount} سجل)! 🚀`),typeof window<"u"&&window.LF&&window.LF.router&&typeof window.LF.router.go=="function"){const r=window.LF.router.current||"dashboard";window.LF.router.go(r)}else typeof window<"u"&&window.location&&setTimeout(()=>window.location.reload(),1200);t(!0)}catch(o){console.error("[Instant Restore File Error]",o),c.error("فشل استعادة الملف: "+o.message),t(!1)}finally{e.remove()}},document.body.appendChild(e),e.click()})}const P={exportInstantEncryptedBackup:Me,restoreFromBackupData:ue,promptAndRestoreFile:Ne,collectFullBackupPayload:pe};let w=null;function j(){const t=document.getElementById("lf-sync-modal");t&&t.remove();const e=k.getUser(),i=k.isSignedIn(),s=b.getLastSyncAt(),o=s?new Date(s).toLocaleString("ar-EG"):"لم تتم المزامنة بعد",a=document.createElement("div");a.id="lf-sync-modal",a.className="modal-overlay",a.setAttribute("role","dialog"),a.setAttribute("aria-modal","true"),a.innerHTML=`
    <div class="modal-content" dir="rtl" style="max-width:480px;border-radius:var(--radius-l);box-shadow:var(--shadow-xl);">
      <div class="modal-header" style="padding-bottom:12px;border-bottom:1px solid var(--border);">
        <div class="row" style="gap:12px;align-items:center;">
          <div class="logo-badge" style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg, #4285F4, #34A853);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(66,133,244,0.25);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>
          </div>
          <div>
            <h3 style="font-size:var(--fs-m);font-weight:700;margin:0;">المزامنة والنسخ الاحتياطي (Cloud & Offline)</h3>
            <div class="muted" style="font-size:var(--fs-xs);margin-top:2px;">حفظ وتشفير آمن بتقنية AES-GCM-256</div>
          </div>
        </div>
        <button class="btn ghost sm" id="lf-sync-modal-close" style="padding:4px 8px;border-radius:50%;font-size:16px;">✕</button>
      </div>

      <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;padding-top:14px;">
        
        <!-- Section 1: Google Cloud Sync Card -->
        <div class="card" style="padding:16px;background:var(--surface-2);border-radius:var(--radius-m);border:1px solid var(--border);">
          ${i&&e?`
            <div class="row between" style="align-items:center;">
              <div class="row" style="gap:12px;align-items:center;">
                ${e.picture?`<img src="${e.picture}" style="width:44px;height:44px;border-radius:50%;border:2px solid var(--accent);box-shadow:0 2px 8px rgba(0,0,0,0.1);" alt="avatar" />`:`<div class="logo-badge" style="width:44px;height:44px;border-radius:50%;font-size:18px;">${e.name?e.name[0]:"G"}</div>`}
                <div>
                  <div class="row" style="gap:8px;align-items:center;">
                    <span class="strong" style="font-size:var(--fs-m);">${e.name||"حساب Google"}</span>
                    <span class="badge ok" style="font-size:11px;padding:2px 8px;">🟢 متزامن سحابياً</span>
                  </div>
                  <div class="muted" style="font-size:var(--fs-xs);">${e.email}</div>
                </div>
              </div>
              <button class="btn ghost sm" id="btn-google-signout" style="color:var(--danger);font-size:var(--fs-xs);">خروج</button>
            </div>
            
            <div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--border);font-size:var(--fs-xs);color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;">
              <span>🕒 آخر نسخة احتياطية سحابية:</span>
              <strong style="color:var(--text);">${o}</strong>
            </div>

            <!-- Manual Cloud Actions -->
            <div class="row" style="gap:10px;margin-top:12px;">
              <button class="btn primary sm grow" id="btn-modal-sync-now" style="gap:6px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                مزامنة ورفع الآن
              </button>
              <button class="btn ghost sm grow" id="btn-modal-restore-now" style="gap:6px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                استعادة من السحابة
              </button>
            </div>
          `:`
            <div class="col" style="gap:12px;">
              <div class="row between" style="align-items:center;">
                <div class="strong" style="font-size:var(--fs-s);color:var(--text);">المزامنة السحابية بحساب Google:</div>
                <span class="badge warn" style="font-size:11px;padding:2px 8px;">غير متصل</span>
              </div>
              
              <p class="muted" style="font-size:var(--fs-xs);margin:0;line-height:1.5;">
                اربط حسابك لحفظ نسخ مشفرة تلقائياً في مساحتك الخاصة على Google Drive (appDataFolder) مجاناً وبدون أي وسيط خارجي.
              </p>

              <div style="font-size:var(--fs-xs);color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;padding:6px 0;">
                <span>🕒 آخر نسخة احتياطية:</span>
                <span class="muted">${o}</span>
              </div>

              <!-- Big Commercial Google Sign-In Button -->
              <button class="btn" id="btn-google-signin" style="width:100%;padding:12px 16px;background:#4285F4;color:#ffffff;border:none;border-radius:var(--radius-m);font-weight:700;font-size:var(--fs-s);box-shadow:0 4px 12px rgba(66,133,244,0.3);display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;transition:transform 0.15s ease, box-shadow 0.15s ease;">
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#ffffff" d="M12.24 10.285V13.4h6.887C18.2 16.14 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.485 0 2.85.555 3.9 1.455l2.4-2.4C16.89 3.48 14.67 2.6 12.24 2.6 7.05 2.6 2.85 6.8 2.85 12s4.2 9.4 9.39 9.4c5.43 0 9.06-3.825 9.06-9.225 0-.615-.06-1.2-.18-1.74h-8.88z"/></svg>
                <span>تسجيل الدخول وحفظ البيانات بحساب Google</span>
              </button>
            </div>
          `}
        </div>

        <!-- Section 2: Instant Offline Backup & Restore Card -->
        <div class="card" style="padding:16px;background:var(--surface-2);border-radius:var(--radius-m);border:1px solid var(--border);">
          <div class="col" style="gap:10px;">
            <div class="row between" style="align-items:center;">
              <div class="strong" style="font-size:var(--fs-s);color:var(--text);">النسخ الاحتياطي الفوري (بدون حساب):</div>
              <span class="badge" style="background:var(--accent-soft);color:var(--accent);font-size:11px;padding:2px 8px;font-weight:600;">🔒 مشفر محلياً</span>
            </div>
            
            <p class="muted" style="font-size:var(--fs-xs);margin:0;line-height:1.5;">
              تصدير أو استعادة ملف مشفر بالكامل بضغطة زر واحدة لحفظ بياناتك محلياً على جهازك دون إنترنت.
            </p>

            <div class="col" style="gap:8px;margin-top:4px;">
              <button class="btn secondary sm" id="btn-instant-export" style="width:100%;padding:10px 14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;background:var(--surface);border:1px solid var(--border);cursor:pointer;">
                <span style="font-size:16px;">📥</span>
                <span>تصدير نسخة احتياطية مشفرة فوراً (ملف آمن)</span>
              </button>

              <button class="btn ghost sm" id="btn-instant-restore" style="width:100%;padding:10px 14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;border:1px dashed var(--border);cursor:pointer;">
                <span style="font-size:16px;">📤</span>
                <span>استعادة نسخة من ملف</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Security & Privacy Guarantee Footer -->
        <div class="row between" style="padding:4px 6px;font-size:11px;color:var(--text-muted);align-items:center;">
          <div class="row" style="gap:6px;align-items:center;">
            <span>🛡️</span>
            <span>تشفير AES-GCM-256 العسكري الصارم</span>
          </div>
          <div class="row" style="gap:6px;align-items:center;">
            <span>🔒</span>
            <span>خصوصية 100% بدون أي وسيط</span>
          </div>
        </div>

      </div>

      <div class="modal-footer" style="padding-top:12px;border-top:1px solid var(--border);">
        <button class="btn ghost sm" id="lf-sync-footer-close" style="width:100%;">إغلاق النافذة</button>
      </div>
    </div>
  `,document.body.appendChild(a);const r=()=>a.remove();a.querySelector("#lf-sync-modal-close").addEventListener("click",r),a.querySelector("#lf-sync-footer-close").addEventListener("click",r);const n=a.querySelector("#btn-google-signin");n&&n.addEventListener("click",async()=>{try{c.info("جارٍ الاتصال بحساب Google..."),await k.signIn(),c.ok("تم تسجيل الدخول بحساب Google بنجاح!"),r(),j()}catch(m){c.error("فشل تسجيل الدخول: "+m.message)}});const d=a.querySelector("#btn-google-signout");d&&d.addEventListener("click",()=>{k.signOut(),c.info("تم إلغاء ربط حساب Google."),r()});const p=a.querySelector("#btn-instant-export");p&&p.addEventListener("click",async()=>{p.disabled=!0;try{await P.exportInstantEncryptedBackup()}finally{p.disabled=!1}});const l=a.querySelector("#btn-instant-restore");l&&l.addEventListener("click",async()=>{r(),await P.promptAndRestoreFile()});const u=a.querySelector("#btn-modal-sync-now");u&&u.addEventListener("click",async()=>{u.disabled=!0,c.info("جارٍ المزامنة السحابية...");const m=await b.sync();u.disabled=!1,m?(c.ok("اكتملت المزامنة وحفظ النسخة المشفرة في Google Drive."),r()):c.error("تعذرت المزامنة السحابية. تحقق من الاتصال بالإنترنت.")});const v=a.querySelector("#btn-modal-restore-now");v&&v.addEventListener("click",async()=>{v.disabled=!0,c.info("جارٍ فحص واستعادة النسخة السحابية...");const m=await b.autoRestore();v.disabled=!1,m?(c.ok("تمت استعادة كافة البيانات السحابية بنجاح!"),r()):c.warn("لم يتم العثور على نسخة أحدث في السحابة.")})}function G(){const t=document.getElementById("lf-audio-modal");t&&t.remove();const e=S.getPermission(),i=ae.list(),s=document.createElement("div");s.id="lf-audio-modal",s.className="modal-overlay",s.setAttribute("role","dialog"),s.setAttribute("aria-modal","true"),s.innerHTML=`
    <div class="modal-content" dir="rtl" style="max-width:480px;">
      <div class="modal-header">
        <div class="row" style="gap:10px;">
          <div class="logo-badge" style="width:34px;height:34px;border-radius:8px;background:var(--warn-soft);color:var(--warn);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </div>
          <div>
            <h3 style="font-size:var(--fs-m);font-weight:700;">مركز التنبيهات والنغمات الصوتية</h3>
            <div class="muted" style="font-size:var(--fs-xs);">إدارة الإشعارات وتجربة أصوات التنبيه</div>
          </div>
        </div>
        <button class="btn ghost sm" id="lf-audio-modal-close" style="padding:4px 8px;border-radius:50%;">✕</button>
      </div>

      <div class="modal-body">
        <!-- Permission Status Box -->
        <div class="row between" style="padding:12px;background:var(--surface-2);border-radius:var(--radius-m);">
          <div>
            <div class="strong" style="font-size:var(--fs-s);">إذن إشعارات النظام:</div>
            <div class="muted" style="font-size:var(--fs-xs);">مطلوب لإرسال التنبيهات مع اهتزاز ونغمات</div>
          </div>
          <div>
            <span class="badge ${e==="granted"?"ok":e==="denied"?"danger":"warn"}">
              ${e==="granted"?"مفعّل ✔️":e==="denied"?"مرفوض ✕":"يتطلب إذن"}
            </span>
          </div>
        </div>

        ${e!=="granted"?`
          <button class="btn primary sm" id="btn-request-notif-perm" style="width:100%;">
            تفعيل إذن إشعارات النظام الآن
          </button>
        `:""}

        <!-- Sound Testing Gallery -->
        <div class="col" style="gap:8px;margin-top:6px;">
          <label class="strong" style="font-size:var(--fs-s);">تجربة واختيار نغمات التنبيه المتاحة:</label>
          <div class="col" style="gap:8px;">
            ${i.map(r=>`
              <div class="row between" style="padding:10px 14px;background:var(--surface-2);border-radius:var(--radius-s);border:1px solid var(--border);">
                <div class="row" style="gap:10px;">
                  <span style="font-size:18px;">🎵</span>
                  <span class="strong small">${r.nameAr}</span>
                </div>
                <button class="btn ghost sm btn-play-sound" data-sound="${r.id}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  تشغيل
                </button>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Background Notification Test Controls -->
        <div class="col" style="gap:8px;margin-top:10px;padding-top:12px;border-top:1px solid var(--border);">
          <label class="strong" style="font-size:var(--fs-s);">اختبار التنبيهات في الخلفية:</label>
          <div class="row" style="gap:10px;">
            <button class="btn ghost sm grow" id="btn-test-notif-now">
              تنبيه فوري تجريبي
            </button>
            <button class="btn primary sm grow" id="btn-test-notif-delayed">
              تنبيه بعد 5 ثوانٍ ⏱️
            </button>
          </div>
          <div class="muted" style="font-size:11px;">
            💡 اضغط على "تنبيه بعد 5 ثوانٍ" ثم اقفل الشاشة أو بدّل التطبيق لتجربة عمل التنبيه والصوت في الخلفية تماماً!
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn ghost sm" id="lf-audio-footer-close">إغلاق</button>
      </div>
    </div>
  `,document.body.appendChild(s);const o=()=>s.remove();s.querySelector("#lf-audio-modal-close").addEventListener("click",o),s.querySelector("#lf-audio-footer-close").addEventListener("click",o);const a=s.querySelector("#btn-request-notif-perm");a&&a.addEventListener("click",async()=>{o(),await S.requestPermission(),G()}),s.querySelectorAll(".btn-play-sound").forEach(r=>{r.addEventListener("click",()=>{const n=r.getAttribute("data-sound");ae.preview(n)})}),s.querySelector("#btn-test-notif-now").addEventListener("click",()=>{S.fire({id:"test-now",title:"تنبيه فوري من LifeFlow",body:"هذا اختبار لصوت التنبيه والاهتزاز الفوري 🚀",sound:"chime",module:"dashboard"})}),s.querySelector("#btn-test-notif-delayed").addEventListener("click",async()=>{const r=Date.now()+5e3;await S.schedule({title:"تنبيه خلفية LifeFlow (5 ثوانٍ)",body:"نجح تشغيل التنبيه والصوت أثناء قفل الشاشة أو تشغيل تطبيق آخر! 🎯",timestamp:r,sound:"alert",module:"tasks"}),c.ok("تمت جدولة التنبيه بعد 5 ثوانٍ! يمكنك الآن مغادرة التبويب أو قفل الشاشة لتجربته."),o()})}function qe(t){w=document.createElement("div"),w.className="row",w.style.gap="8px",w.innerHTML=`
    <!-- Notification Bell Button -->
    <button id="lf-bell-btn" class="btn ghost sm" aria-label="التنبيهات والأصوات" title="مركز التنبيهات والأصوات" style="padding:7px 10px;border-radius:var(--radius-s);">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
      <span id="lf-bell-dot" style="width:7px;height:7px;border-radius:50%;background:var(--accent);display:none;"></span>
    </button>

    <!-- Cloud Sync Status Button -->
    <button id="lf-sync-badge-btn" class="btn ghost sm" aria-label="المزامنة السحابية" title="حالة مزامنة Google Drive" style="padding:6px 12px;border-radius:var(--radius-s);gap:6px;">
      <span id="sync-icon" style="font-size:12px;">☁️</span>
      <span id="sync-label" style="font-size:var(--fs-xs);font-weight:600;">Google Drive</span>
    </button>
  `,t.prepend(w),w.querySelector("#lf-bell-btn").addEventListener("click",G),w.querySelector("#lf-sync-badge-btn").addEventListener("click",j),b.onChange(({status:e,isOnline:i,signedIn:s})=>{const o=w.querySelector("#sync-icon"),a=w.querySelector("#sync-label"),r=w.querySelector("#lf-sync-badge-btn");i?s?e==="syncing"?(o.textContent="🔄",a.textContent="مزامنة...",r.style.color="var(--info)"):e==="synced"?(o.textContent="🟢",a.textContent="متزامن",r.style.color="var(--ok)"):e==="error"&&(o.textContent="⚠️",a.textContent="خطأ مزامنة",r.style.color="var(--danger)"):(o.textContent="☁️",a.textContent="ربط Google",r.style.color="var(--accent)"):(o.textContent="📴",a.textContent="أوفلاين",r.style.color="var(--text-muted)")}),k.onChange(({user:e,signedIn:i})=>{const s=w.querySelector("#sync-label");i&&e&&(s.textContent=e.name?e.name.split(" ")[0]:"متزامن")})}const De={mount:qe,openSyncModal:j,openAudioModal:G};class Fe{constructor(){this.ctx=null,this.activeType=null,this.gainNode=null,this.noiseNode=null,this.lfoNode=null,this.filterNode=null,this.volume=.5}_initContext(){if(!this.ctx){const e=window.AudioContext||window.webkitAudioContext;this.ctx=new e}this.ctx.state==="suspended"&&this.ctx.resume()}_createNoiseBuffer(e="white"){const i=this.ctx.sampleRate*2,s=this.ctx.createBuffer(1,i,this.ctx.sampleRate),o=s.getChannelData(0);let a=0;for(let r=0;r<i;r++){const n=Math.random()*2-1;e==="brown"?(o[r]=(a+.02*n)/1.02,a=o[r],o[r]*=3.5):e==="pink"?(o[r]=a*.95+n*.05,a=o[r],o[r]*=3):o[r]=n*.5}return s}play(e="rain"){if(this._initContext(),this.stop(),this.activeType=e,this.gainNode=this.ctx.createGain(),this.gainNode.gain.setValueAtTime(this.volume,this.ctx.currentTime),this.gainNode.connect(this.ctx.destination),e==="rain"){const i=this._createNoiseBuffer("pink");this.noiseNode=this.ctx.createBufferSource(),this.noiseNode.buffer=i,this.noiseNode.loop=!0,this.filterNode=this.ctx.createBiquadFilter(),this.filterNode.type="lowpass",this.filterNode.frequency.setValueAtTime(1e3,this.ctx.currentTime),this.noiseNode.connect(this.filterNode),this.filterNode.connect(this.gainNode),this.noiseNode.start()}else if(e==="brown"){const i=this._createNoiseBuffer("brown");this.noiseNode=this.ctx.createBufferSource(),this.noiseNode.buffer=i,this.noiseNode.loop=!0,this.filterNode=this.ctx.createBiquadFilter(),this.filterNode.type="lowpass",this.filterNode.frequency.setValueAtTime(450,this.ctx.currentTime),this.noiseNode.connect(this.filterNode),this.filterNode.connect(this.gainNode),this.noiseNode.start()}else if(e==="waves"){const i=this._createNoiseBuffer("pink");this.noiseNode=this.ctx.createBufferSource(),this.noiseNode.buffer=i,this.noiseNode.loop=!0,this.filterNode=this.ctx.createBiquadFilter(),this.filterNode.type="lowpass",this.filterNode.frequency.setValueAtTime(600,this.ctx.currentTime);const s=this.ctx.createOscillator(),o=this.ctx.createGain();s.frequency.setValueAtTime(.12,this.ctx.currentTime),o.gain.setValueAtTime(this.volume*.8,this.ctx.currentTime),s.connect(o.gain),this.noiseNode.connect(this.filterNode),this.filterNode.connect(this.gainNode),this.noiseNode.start(),s.start(),this.lfoNode=s}}stop(){if(this.noiseNode){try{this.noiseNode.stop()}catch{}this.noiseNode.disconnect(),this.noiseNode=null}if(this.lfoNode){try{this.lfoNode.stop()}catch{}this.lfoNode.disconnect(),this.lfoNode=null}this.activeType=null}setVolume(e){this.volume=Math.max(0,Math.min(1,e)),this.gainNode&&this.ctx&&this.gainNode.gain.setValueAtTime(this.volume,this.ctx.currentTime)}isPlaying(e){return this.activeType===e}}const y=new Fe,I={focus:{name:"جلسة تركيز",duration:1500,sound:"bell"},short:{name:"استراحة قصيرة",duration:300,sound:"chime"},long:{name:"استراحة طويلة",duration:900,sound:"alert"}};let x="focus",A=I.focus.duration,C=!1,W=null,V=null;async function Oe(){const t=new Date().toISOString().slice(0,10);return g.list("focus_sessions",{all:!0,predicate:e=>e.date===t})}async function ve(t,e=null){const i=new Date().toISOString().slice(0,10),s={id:"foc-"+Date.now().toString(36),date:i,minutes:t,taskId:e,mode:x,completedAt:new Date().toISOString()};return await g.put("focus_sessions",s,{all:!0}),b.notifyDataChanged(),s}async function He(t){const e=await Oe(),i=await g.list("tasks",{all:!0,predicate:l=>l.status!=="done"&&l.status!=="cancelled"}),s=e.reduce((l,u)=>l+(u.minutes||0),0);function o(l){const u=Math.floor(l/60),v=l%60;return`${u<10?"0":""}${u}:${v<10?"0":""}${v}`}function a(){I[x].duration,t.innerHTML=`
      <div class="col" style="gap:var(--sp-5);">
        <!-- Title & Metrics -->
        <div class="row between wrap" style="gap:12px;">
          <div>
            <h2 style="font-size:var(--fs-xl);font-weight:800;">مؤقت بومودورو وبيئة التركيز الفائق ⏱️</h2>
            <p class="muted small" style="margin-top:2px;">تقنية بومودورو لإنجاز المهام الكبرى بدون تشتت مع أصوات محيطية مريحة</p>
          </div>

          <div class="row" style="gap:8px;">
            <span class="badge ok">🎯 إجمالي اليوم: ${s} دقيقة تركيز</span>
            <span class="badge accent">${e.length} جلسات مكتملة</span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:var(--sp-4);">
          <!-- 1. Pomodoro Dial Card -->
          <div class="card col center" style="gap:var(--sp-4);padding:var(--sp-6) var(--sp-4);">
            <!-- Modes Switcher -->
            <div class="row" style="background:var(--surface-2);padding:4px;border-radius:var(--radius-pill);border:1px solid var(--border);">
              <button class="btn sm ${x==="focus"?"primary":"ghost"} mode-btn" data-mode="focus" style="border-radius:var(--radius-pill);font-size:12px;">
                🎯 تركيز (25 د)
              </button>
              <button class="btn sm ${x==="short"?"primary":"ghost"} mode-btn" data-mode="short" style="border-radius:var(--radius-pill);font-size:12px;">
                ☕ استراحة (5 د)
              </button>
              <button class="btn sm ${x==="long"?"primary":"ghost"} mode-btn" data-mode="long" style="border-radius:var(--radius-pill);font-size:12px;">
                🌴 راحة طويلة (15 د)
              </button>
            </div>

            <!-- Big Timer Counter with Circular Glow -->
            <div style="position:relative;width:210px;height:210px;border-radius:50%;border:8px solid var(--surface-3);border-top-color:var(--accent);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:var(--shadow-md);margin:10px 0;">
              <span id="timer-display" style="font-family:var(--mono);font-size:46px;font-weight:800;letter-spacing:-0.03em;color:var(--text);">
                ${o(A)}
              </span>
              <span class="muted xs" style="font-weight:600;margin-top:-4px;">${I[x].name}</span>
            </div>

            <!-- Link Session with a Task -->
            <div class="col" style="width:100%;max-width:320px;gap:6px;">
              <label class="muted xs strong">ربط الجلسة بمهمة:</label>
              <select id="select-focus-task" class="input" style="padding:8px 12px;font-size:var(--fs-s);border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);">
                <option value="">-- بدون ربط بمهمة محددة --</option>
                ${i.map(l=>`
                  <option value="${l.id}" ${l.id===V?"selected":""}>${l.title}</option>
                `).join("")}
              </select>
            </div>

            <!-- Timer Action Buttons -->
            <div class="row" style="gap:12px;margin-top:6px;">
              <button class="btn primary" id="btn-toggle-timer" style="padding:10px 32px;font-size:var(--fs-l);">
                ${C?"إيقاف مؤقت ⏸️":"ابدأ التركيز ▶️"}
              </button>
              <button class="btn ghost" id="btn-reset-timer" title="إعادة ضبط المؤقت">
                إعادة ضبط ↺
              </button>
            </div>
          </div>

          <!-- 2. Ambient Sound Generator Card (Web Audio API) -->
          <div class="card col" style="gap:var(--sp-4);">
            <div class="row between">
              <div class="row" style="gap:10px;">
                <div class="logo-badge" style="width:36px;height:36px;border-radius:10px;background:rgba(13, 148, 136, 0.15);color:var(--accent);">
                  🎧
                </div>
                <div>
                  <h3 style="font-size:var(--fs-m);font-weight:700;">أصوات التركيز المحيطية</h3>
                  <div class="muted xs">توليد نقي بـ Web Audio API (بدون إنترنت وبدون تحميل)</div>
                </div>
              </div>
              <button class="btn ghost sm" id="btn-stop-all-ambient" style="color:var(--danger);" ${y.activeType?"":"disabled"}>
                إيقاف الصوت ⏹️
              </button>
            </div>

            <p class="muted xs">
              تشغيل ترددات مهدئة تعزل الضوضاء الخارجية من حولك وتساعد دماغك على الدخول في حالة التدفق الذهني العميق (Flow State).
            </p>

            <!-- Sound Buttons List -->
            <div class="col" style="gap:10px;">
              <!-- Rain -->
              <div class="row between" style="padding:12px 14px;background:var(--surface-2);border-radius:var(--radius-m);border:1px solid ${y.isPlaying("rain")?"var(--accent)":"var(--border)"};">
                <div class="row" style="gap:10px;">
                  <span style="font-size:22px;">🌧️</span>
                  <div>
                    <div class="strong small">صوت المطر الهادئ (Rain Noise)</div>
                    <div class="muted xs">تلطيف الذهن وإزالة التوتر</div>
                  </div>
                </div>
                <button class="btn sm ${y.isPlaying("rain")?"primary":"ghost"} btn-toggle-ambient" data-type="rain">
                  ${y.isPlaying("rain")?"نشط 🔊":"تشغيل ▶️"}
                </button>
              </div>

              <!-- Ocean Waves -->
              <div class="row between" style="padding:12px 14px;background:var(--surface-2);border-radius:var(--radius-m);border:1px solid ${y.isPlaying("waves")?"var(--accent)":"var(--border)"};">
                <div class="row" style="gap:10px;">
                  <span style="font-size:22px;">🌊</span>
                  <div>
                    <div class="strong small">أمواج البحر الترددية (Ocean Waves)</div>
                    <div class="muted xs">تدرج صوتي انسيابي متناغم</div>
                  </div>
                </div>
                <button class="btn sm ${y.isPlaying("waves")?"primary":"ghost"} btn-toggle-ambient" data-type="waves">
                  ${y.isPlaying("waves")?"نشط 🔊":"تشغيل ▶️"}
                </button>
              </div>

              <!-- Brown Noise -->
              <div class="row between" style="padding:12px 14px;background:var(--surface-2);border-radius:var(--radius-m);border:1px solid ${y.isPlaying("brown")?"var(--accent)":"var(--border)"};">
                <div class="row" style="gap:10px;">
                  <span style="font-size:22px;">☕</span>
                  <div>
                    <div class="strong small">الضوضاء البنية العميقة (Brown Noise)</div>
                    <div class="muted xs">حجب تام لأصوات البيئة المشتتة</div>
                  </div>
                </div>
                <button class="btn sm ${y.isPlaying("brown")?"primary":"ghost"} btn-toggle-ambient" data-type="brown">
                  ${y.isPlaying("brown")?"نشط 🔊":"تشغيل ▶️"}
                </button>
              </div>
            </div>

            <!-- Volume Slider -->
            <div class="row between" style="margin-top:6px;gap:12px;">
              <span class="muted xs strong">درجة الصوت:</span>
              <input type="range" id="ambient-volume" min="0" max="1" step="0.05" value="${y.volume}" class="grow" style="accent-color:var(--accent);" />
            </div>
          </div>
        </div>
      </div>
    `,p()}function r(){C||(C=!0,W=setInterval(async()=>{if(A>0){A--;const l=t.querySelector("#timer-display");l&&(l.textContent=o(A))}else clearInterval(W),C=!1,await d()},1e3))}function n(){C=!1,clearInterval(W)}async function d(){const l=I[x];Se(l.sound),x==="focus"?(await ve(25,V),c.ok("🎉 أحسنت! أنهيت جلسة تركيز كاملة (25 دقيقة). خذ استراحة الآن!")):c.info("انتهى وقت الاستراحة! حان وقت التركيز في مهمتك التالية."),S.fire({id:"pomodoro-finished",title:"🎯 انتهت جلسة التركيز في LifeFlow!",body:x==="focus"?"أنهيت 25 دقيقة تركيز بنجاح. استمتع باستراحة قصيرة.":"انتهت الاستراحة. استعد لمواصلة الإنجاز.",sound:l.sound,module:"focus"}),A=l.duration,a()}function p(){t.querySelectorAll(".mode-btn").forEach(v=>{v.addEventListener("click",()=>{n(),x=v.getAttribute("data-mode"),A=I[x].duration,a()})}),t.querySelector("#btn-toggle-timer").addEventListener("click",()=>{C?n():r(),a()}),t.querySelector("#btn-reset-timer").addEventListener("click",()=>{n(),A=I[x].duration,a()});const l=t.querySelector("#select-focus-task");l&&l.addEventListener("change",v=>{V=v.target.value||null}),t.querySelectorAll(".btn-toggle-ambient").forEach(v=>{v.addEventListener("click",()=>{const m=v.getAttribute("data-type");y.isPlaying(m)?y.stop():y.play(m),a()})}),t.querySelector("#btn-stop-all-ambient").addEventListener("click",()=>{y.stop(),a()});const u=t.querySelector("#ambient-volume");u&&u.addEventListener("input",v=>{y.setVolume(parseFloat(v.target.value))})}a()}const Pe={render:He,ambient:y,record:ve};let N=!1;function Re(){return N}const U=[{id:"cmd-pomodoro",title:"بدء مؤقت بومودورو (25 دقيقة)",category:"تركيز",icon:"⏱️",action:()=>{window.location.hash="#view=focus"}},{id:"cmd-rain",title:"تشغيل صوت المطر الهادئ",category:"أصوات",icon:"🌧️",action:()=>{y.play("rain"),c.ok("تم تشغيل صوت المطر 🌧️")}},{id:"cmd-waves",title:"تشغيل صوت أمواج البحر",category:"أصوات",icon:"🌊",action:()=>{y.play("waves"),c.ok("تم تشغيل أمواج البحر 🌊")}},{id:"cmd-brown",title:"تشغيل الضوضاء البنية العميقة",category:"أصوات",icon:"☕",action:()=>{y.play("brown"),c.ok("تم تشغيل الضوضاء البنية ☕")}},{id:"cmd-stop-audio",title:"إيقاف الأصوات المحيطية",category:"أصوات",icon:"⏹️",action:()=>{y.stop(),c.info("تم إيقاف الصوت.")}},{id:"cmd-water",title:"تسجيل شرب كوب ماء (+250 مل)",category:"صحة",icon:"💧",action:async()=>{const t=new Date().toISOString().slice(0,10),i=(await g.list("health_logs",{all:!0,predicate:s=>s.date===t}))[0]||{id:"health-"+t,date:t,waterCurrent:0,waterTarget:2500,waterHistory:[]};i.waterCurrent+=250,i.waterHistory=i.waterHistory||[],i.waterHistory.push({amount:250,time:new Date().toISOString()}),await g.put("health_logs",i,{all:!0}),b.notifyDataChanged(),c.ok("تمت إضافة 250 مل ماء بنجاح! 💧")}},{id:"cmd-sync",title:"مزامنة سحابية فورية مع Google Drive",category:"نظام",icon:"☁️",action:()=>{b.sync(),c.info("جارٍ بدء المزامنة السحابية...")}},{id:"cmd-toggle-theme",title:"تبديل المظهر (ليلي / نهاري)",category:"مظهر",icon:"🌓",action:()=>{const e=(document.documentElement.getAttribute("data-theme")||"light")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",e);const i=JSON.parse(localStorage.getItem("lf.prefs")||"{}");i.theme=e,localStorage.setItem("lf.prefs",JSON.stringify(i)),c.ok(e==="dark"?"تم تفعيل الوضع الليلي 🌙":"تم تفعيل الوضع الفاتح ☀️")}},{id:"nav-dashboard",title:"الانتقال إلى: لوحة التحكم الرئيسية",category:"تنقل",icon:"📊",action:()=>{window.location.hash="#view=dashboard"}},{id:"nav-myday",title:"الانتقال إلى: يومي والتركيز اليومي",category:"تنقل",icon:"⭐",action:()=>{window.location.hash="#view=myday"}},{id:"nav-tasks",title:"الانتقال إلى: المهام والمشاريع",category:"تنقل",icon:"✔️",action:()=>{window.location.hash="#view=tasks"}},{id:"nav-projects",title:"الانتقال إلى: المشاريع",category:"تنقل",icon:"📁",action:()=>{window.location.hash="#view=projects"}},{id:"nav-calendar",title:"الانتقال إلى: التقويم والمناسبات",category:"تنقل",icon:"📅",action:()=>{window.location.hash="#view=calendar"}},{id:"nav-goals",title:"الانتقال إلى: الأهداف والخطط",category:"تنقل",icon:"🎯",action:()=>{window.location.hash="#view=goals"}},{id:"nav-expenses",title:"الانتقال إلى: المصروفات والمالية",category:"تنقل",icon:"💸",action:()=>{window.location.hash="#view=expenses"}},{id:"nav-income",title:"الانتقال إلى: الإيرادات والدخل",category:"تنقل",icon:"💵",action:()=>{window.location.hash="#view=income"}},{id:"nav-budget",title:"الانتقال إلى: الميزانيات والتوقعات",category:"تنقل",icon:"📊",action:()=>{window.location.hash="#view=budget"}},{id:"nav-debts",title:"الانتقال إلى: إدارة الديون والأقساط",category:"تنقل",icon:"💳",action:()=>{window.location.hash="#view=debts"}},{id:"nav-shopping",title:"الانتقال إلى: المشتريات والتسوق",category:"تنقل",icon:"🛒",action:()=>{window.location.hash="#view=shopping"}},{id:"nav-health",title:"الانتقال إلى: الصحة والعافية",category:"تنقل",icon:"🌿",action:()=>{window.location.hash="#view=health"}},{id:"nav-routines",title:"الانتقال إلى: الروتين اليومي",category:"تنقل",icon:"⚡",action:()=>{window.location.hash="#view=routines"}},{id:"nav-focus",title:"الانتقال إلى: التركيز وبومودورو",category:"تنقل",icon:"⏱️",action:()=>{window.location.hash="#view=focus"}},{id:"nav-habits",title:"الانتقال إلى: متتبع العادات",category:"تنقل",icon:"🔥",action:()=>{window.location.hash="#view=habits"}},{id:"nav-vault",title:"الانتقال إلى: خزينة الوثائق المشفرة",category:"تنقل",icon:"🛡️",action:()=>{window.location.hash="#view=vault"}},{id:"nav-inbox",title:"الانتقال إلى: صندوق تفريغ الأفكار",category:"تنقل",icon:"🧠",action:()=>{window.location.hash="#view=inbox"}},{id:"nav-study",title:"الانتقال إلى: شؤون الدراسة والمذاكرة",category:"تنقل",icon:"📚",action:()=>{window.location.hash="#view=study"}},{id:"nav-work",title:"الانتقال إلى: إدارة العمل والورديات",category:"تنقل",icon:"💼",action:()=>{window.location.hash="#view=work"}},{id:"nav-home",title:"الانتقال إلى: إدارة المنزل والمرافق",category:"تنقل",icon:"🏠",action:()=>{window.location.hash="#view=home"}},{id:"nav-notes",title:"الانتقال إلى: الملاحظات والمسودات",category:"تنقل",icon:"📝",action:()=>{window.location.hash="#view=notes"}},{id:"nav-reminders",title:"الانتقال إلى: التذكيرات والتنبيهات",category:"تنقل",icon:"🔔",action:()=>{window.location.hash="#view=reminders"}},{id:"nav-reports",title:"الانتقال إلى: التقارير الشاملة والبحث",category:"تنقل",icon:"📋",action:()=>{window.location.hash="#view=reports"}},{id:"nav-contacts",title:"الانتقال إلى: جهات الاتصال والمساحات",category:"تنقل",icon:"👥",action:()=>{window.location.hash="#view=contacts"}},{id:"nav-analytics",title:"الانتقال إلى: التحليلات ومستشار AI",category:"تنقل",icon:"📈",action:()=>{window.location.hash="#view=analytics"}},{id:"nav-settings",title:"الانتقال إلى: إعدادات المظهر والأمان",category:"تنقل",icon:"⚙️",action:()=>{window.location.hash="#view=settings"}},{id:"nav-login",title:"الانتقال إلى: تسجيل الدخول والمزامنة",category:"تنقل",icon:"👤",action:()=>{window.location.hash="#view=login"}}];async function je(t){if(!t||!t.trim())return[];const e=t.trim().toLowerCase(),[i,s,o,a]=await Promise.all([g.list("tasks",{all:!0}),g.list("expenses",{all:!0}),g.list("vault_items",{all:!0}),g.list("inbox_items",{all:!0})]),r=[];return i.forEach(n=>{(n.title&&n.title.toLowerCase().includes(e)||n.notes&&n.notes.toLowerCase().includes(e))&&r.push({id:"t-"+n.id,title:n.title,sub:`مهمة • ${n.date||"بدون تاريخ"} • ${n.priority||"عادي"}`,icon:"✔️",action:()=>{window.location.hash="#view=dashboard"}})}),s.forEach(n=>{(n.title&&n.title.toLowerCase().includes(e)||n.categoryId&&n.categoryId.toLowerCase().includes(e))&&r.push({id:"e-"+n.id,title:n.title,sub:`مصروف • ${n.amount||0} ر.س • ${n.date||""}`,icon:"💰",action:()=>{window.location.hash="#view=dashboard"}})}),o.forEach(n=>{(n.name&&n.name.toLowerCase().includes(e)||n.docNumber&&n.docNumber.toLowerCase().includes(e))&&r.push({id:"v-"+n.id,title:n.name,sub:`وثيقة بالخزينة • رقم: ${n.docNumber||"غير مسجل"} • انتهاء: ${n.expiryDate||""}`,icon:"🛡️",action:()=>{window.location.hash="#view=vault"}})}),a.forEach(n=>{n.text&&n.text.toLowerCase().includes(e)&&r.push({id:"i-"+n.id,title:n.text,sub:`فكرة بصندوق الوارد • ${new Date(n.createdAt).toLocaleDateString("ar-EG")}`,icon:"🧠",action:()=>{window.location.hash="#view=inbox"}})}),r}function X(){if(N)return;N=!0;const t=document.getElementById("lf-cmd-palette");t&&t.remove();const e=document.createElement("div");e.id="lf-cmd-palette",e.className="modal-overlay",e.style.alignItems="flex-start",e.style.paddingTop="10vh",e.style.background="rgba(10, 20, 18, 0.65)",e.style.backdropFilter="blur(10px)",e.innerHTML=`
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
  `,document.body.appendChild(e);const i=e.querySelector("#cmd-input"),s=e.querySelector("#cmd-results");let o=0,a=[];const r=()=>{N=!1,e.remove()};e.querySelector("#cmd-close").addEventListener("click",r),e.addEventListener("click",d=>{d.target===e&&r()});const n=async(d="")=>{s.innerHTML="";const p=d.trim().toLowerCase();if(!p)a=U,s.innerHTML=`
        <div class="muted xs strong" style="padding:6px 10px;">أوامر وإجراءات سريعة:</div>
        ${U.map((l,u)=>`
          <div class="row between cmd-item ${u===o?"selected":""}" data-idx="${u}" style="padding:10px 14px;border-radius:var(--radius-m);cursor:pointer;background:${u===o?"var(--accent-soft)":"transparent"};color:${u===o?"var(--accent)":"var(--text)"};">
            <div class="row" style="gap:10px;">
              <span style="font-size:18px;">${l.icon}</span>
              <span class="strong small">${l.title}</span>
            </div>
            <span class="badge ghost xs">${l.category}</span>
          </div>
        `).join("")}
      `;else{const l=U.filter(v=>v.title.toLowerCase().includes(p)),u=await je(p);if(a=[...l,...u],a.length===0){s.innerHTML=`
          <div class="center col" style="padding:32px 16px;text-align:center;gap:6px;">
            <span style="font-size:28px;">🔍</span>
            <div class="strong small">لا توجد نتائج مطابقة لـ "${d}"</div>
            <div class="muted xs">جرّب كلمة بحث مختلفة أو استخدم صندوق الأفكار السريع.</div>
          </div>
        `;return}s.innerHTML=`
        ${l.length>0?`
          <div class="muted xs strong" style="padding:6px 10px;">أوامر النظام:</div>
          ${l.map((v,m)=>`
            <div class="row between cmd-item ${m===o?"selected":""}" data-idx="${m}" style="padding:10px 14px;border-radius:var(--radius-m);cursor:pointer;background:${m===o?"var(--accent-soft)":"transparent"};">
              <div class="row" style="gap:10px;">
                <span style="font-size:18px;">${v.icon}</span>
                <span class="strong small">${v.title}</span>
              </div>
              <span class="badge ghost xs">${v.category}</span>
            </div>
          `).join("")}
        `:""}

        ${u.length>0?`
          <div class="muted xs strong" style="padding:10px 10px 6px;">نتائج البحث في بياناتك:</div>
          ${u.map((v,m)=>{const f=l.length+m;return`
              <div class="row between cmd-item ${f===o?"selected":""}" data-idx="${f}" style="padding:10px 14px;border-radius:var(--radius-m);cursor:pointer;background:${f===o?"var(--accent-soft)":"transparent"};">
                <div class="row" style="gap:10px;">
                  <span style="font-size:18px;">${v.icon}</span>
                  <div>
                    <div class="strong small">${v.title}</div>
                    <div class="muted xs">${v.sub}</div>
                  </div>
                </div>
                <span class="muted xs">فتح ➔</span>
              </div>
            `}).join("")}
        `:""}
      `}s.querySelectorAll(".cmd-item").forEach(l=>{l.addEventListener("click",()=>{const u=Number(l.getAttribute("data-idx"));a[u]&&a[u].action&&(a[u].action(),r())})})};i.addEventListener("input",()=>{o=0,n(i.value)}),i.addEventListener("keydown",d=>{d.key==="ArrowDown"?(d.preventDefault(),o=Math.min(a.length-1,o+1),n(i.value)):d.key==="ArrowUp"?(d.preventDefault(),o=Math.max(0,o-1),n(i.value)):d.key==="Enter"?(d.preventDefault(),a[o]&&a[o].action&&(a[o].action(),r())):d.key==="Escape"&&r()}),n(),setTimeout(()=>i.focus(),40)}function Ge(){window.addEventListener("keydown",t=>{if((t.ctrlKey||t.metaKey)&&(t.key==="k"||t.key==="K"))if(t.preventDefault(),N){const e=document.getElementById("lf-cmd-palette");e&&e.remove(),N=!1}else X()})}const J={open:X,init:Ge,isOpen:Re};let ge="dashboard",O=null;const _e=[{id:"dashboard",name:"الرئيسية",icon:"📊"},{id:"myday",name:"يومي",icon:"⭐"},{id:"tasks",name:"المهام",icon:"✔️"},{id:"expenses",name:"المالية",icon:"💰"},{id:"all-apps",name:"كل الأقسام",icon:"🗂️"}],We=[{title:"🚀 الإنتاجية وإدارة المهام",items:[{id:"dashboard",name:"لوحة التحكم",icon:"📊",desc:"نظرة بانورامية والودجات الذكية"},{id:"myday",name:"يومي (التركيز اليومي)",icon:"⭐",desc:"جدول اليوم ومراجعة الإنجاز"},{id:"tasks",name:"المهام والمشاريع",icon:"✔️",desc:"المهام الفرعية والتكرار والأولويات"},{id:"projects",name:"المشاريع",icon:"📁",desc:"إدارة وتتبع مسارات المشاريع"},{id:"calendar",name:"التقويم والمناسبات",icon:"📅",desc:"شبكة 42 خلية والمواعيد"},{id:"goals",name:"الأهداف والخطط",icon:"🎯",desc:"خطوات التنفيذ ونسب الإنجاز"},{id:"inbox",name:"صندوق الأفكار السريع",icon:"🧠",desc:"تفريغ الذهن والتحويل الفوري"}]},{title:"💰 المالية والميزانيات",items:[{id:"expenses",name:"المصروفات اليومية",icon:"💸",desc:"تتبع المصاريف والبنود والتصنيفات"},{id:"income",name:"الإيرادات والدخل",icon:"💵",desc:"سجل الدخل والتدفقات النقدية"},{id:"budget",name:"الميزانيات والتوقعات",icon:"📊",desc:"تحديد الميزانيات وحدود الصرف"},{id:"debts",name:"إدارة الديون والأقساط",icon:"💳",desc:"الدفعات المجزأة ونسب السداد"},{id:"shopping",name:"المشتريات والتسوق",icon:"🛒",desc:"قوائم الشراء والتكلفة التقديرية"}]},{title:"🌿 الصحة ونمط الحياة",items:[{id:"health",name:"الصحة والعافية",icon:"🌿",desc:"تتبع شرب الماء والمزاج والطاقة والنوم"},{id:"routines",name:"الروتين اليومي",icon:"⚡",desc:"روتين الصباح والمساء وسلاسل الالتزام"},{id:"focus",name:"التركيز الفائق (بومودورو)",icon:"⏱️",desc:"مؤقت التركيز وأصوات الطبيعة أوفلاين"},{id:"habits",name:"متتبع العادات",icon:"🔥",desc:"سلاسل العادات ومعدل الالتزام 30 يوماً"}]},{title:"💼 الدراسة والعمل والمنزل",items:[{id:"study",name:"شؤون الدراسة",icon:"📚",desc:"المواد والواجبات والعد التنازلي للامتحانات"},{id:"work",name:"إدارة العمل والورديات",icon:"💼",desc:"ساعات العمل والمناوبات وسجل الدوام"},{id:"home",name:"المنزل والمرافق",icon:"🏠",desc:"غرف المنزل والصيانة والمقتنيات"}]},{title:"🛡️ التوثيق والشخصية والأمان",items:[{id:"vault",name:"خزينة الوثائق المشفرة",icon:"🛡️",desc:"تشفير AES-256 وتنبيهات الصلاحية"},{id:"notes",name:"الملاحظات والمسودات",icon:"📝",desc:"تدوين سريع مع وسوم تصنيف"},{id:"contacts",name:"جهات الاتصال والمساحات",icon:"👥",desc:"دليل الأشخاص ومساحات العمل"},{id:"reminders",name:"التذكيرات والتنبيهات",icon:"🔔",desc:"محرك الأصوات والتنبيه في الخلفية"}]},{title:"⚙️ التحليلات والنظام",items:[{id:"analytics",name:"التحليلات ومستشار AI",icon:"📈",desc:"إحصاءات شاملة ونصائح ذكية"},{id:"reports",name:"التقارير الشاملة والبحث",icon:"📋",desc:"تصدير التقارير والبحث العميق"},{id:"search",name:"لوحة الأوامر (Ctrl+K)",icon:"🔍",desc:"بحث فوري شامل وأوامر سريعة"},{id:"settings",name:"إعدادات المظهر والأمان",icon:"⚙️",desc:"الألوان الخمسة، الوضع الليلي وقفل PIN"},{id:"login",name:"تسجيل الدخول والمزامنة",icon:"👤",desc:"ربط Google وإدارة المزامنة السحابية"},{id:"theme",name:"تبديل المظهر (ليلي / نهاري)",icon:"🌓",desc:"التبديل الفوري للسمة البصرية"}]}];function fe(){const t=document.getElementById("lf-more-drawer");t&&t.remove();const e=document.createElement("div");e.id="lf-more-drawer",e.className="modal-overlay",e.style.alignItems="flex-end",e.style.padding="0",e.style.zIndex="var(--z-modal)",e.innerHTML=`
    <div class="modal-content col" dir="rtl" style="width:100%;max-width:100%;border-radius:var(--radius-l) var(--radius-l) 0 0;padding:var(--sp-4) var(--sp-4) calc(env(safe-area-inset-bottom, 0px) + 24px);max-height:88vh;overflow-y:auto;background:var(--surface);box-shadow:0 -10px 40px rgba(0,0,0,0.2);">
      
      <!-- Drawer Handle & Header -->
      <div class="center" style="padding-bottom:12px;cursor:pointer;" id="drawer-handle">
        <div style="width:44px;height:5px;border-radius:3px;background:var(--border-strong);"></div>
      </div>

      <div class="row between" style="margin-bottom:14px;align-items:center;">
        <div class="row" style="gap:10px;align-items:center;">
          <div class="logo-badge" style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg, #0d9488, #0f766e);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;">🗂️</div>
          <div>
            <h3 style="font-size:var(--fs-m);font-weight:800;color:var(--text);margin:0;">كافة أقسام LifeFlow الـ 23</h3>
            <div class="muted" style="font-size:var(--fs-xs);margin-top:2px;">Mega Personal Life OS — بنقرة واحدة</div>
          </div>
        </div>
        <button class="btn ghost sm" id="drawer-close" style="padding:4px 10px;border-radius:50%;font-size:16px;">✕</button>
      </div>

      ${H()?"":`
        <!-- Prominent Install Option at Top of Drawer -->
        <div class="card install-drawer-card" style="margin-bottom:16px;padding:12px 14px;background:linear-gradient(135deg, rgba(13,148,136,0.12), rgba(20,184,166,0.06));border:1.5px solid var(--accent);border-radius:var(--radius-m);box-shadow:0 4px 12px rgba(13,148,136,0.1);">
          <div class="row between" style="align-items:center;">
            <div class="row" style="gap:10px;align-items:center;">
              <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg, #0d9488, #0f766e);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(13,148,136,0.3);flex-shrink:0;">📲</div>
              <div>
                <div class="strong" style="font-size:var(--fs-s);color:var(--text);">تثبيت LifeFlow على الهاتف</div>
                <div class="muted" style="font-size:11px;">يعمل كتطبيق أصلي في وضع عدم الاتصال (Offline)</div>
              </div>
            </div>
            <button class="btn primary sm" id="btn-drawer-install" style="font-weight:700;padding:7px 16px;border-radius:var(--radius-s);white-space:nowrap;cursor:pointer;flex-shrink:0;">تثبيت الآن</button>
          </div>
        </div>
      `}

      <!-- Categories & Items Grid -->
      <div class="col" style="gap:20px;">
        ${We.map(o=>`
          <div class="category-group col" style="gap:8px;">
            <div style="font-size:var(--fs-xs);font-weight:800;color:var(--accent);letter-spacing:0.3px;padding-right:4px;">
              ${o.title}
            </div>
            <div class="grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));gap:8px;">
              ${o.items.map(a=>`
                <button class="drawer-item" data-id="${a.id}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-m);text-align:right;cursor:pointer;transition:var(--tr-fast);font-family:inherit;">
                  <span style="font-size:22px;flex-shrink:0;">${a.icon}</span>
                  <div class="col" style="gap:2px;overflow:hidden;">
                    <span style="font-size:var(--fs-xs);font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.name}</span>
                    <span class="muted" style="font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.desc}</span>
                  </div>
                </button>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>

    </div>
  `,document.body.appendChild(e);const i=()=>e.remove();e.querySelector("#drawer-close").addEventListener("click",i),e.querySelector("#drawer-handle").addEventListener("click",i),e.addEventListener("click",o=>{o.target===e&&i()});const s=e.querySelector("#btn-drawer-install");s&&s.addEventListener("click",()=>{i(),R()}),e.querySelectorAll(".drawer-item").forEach(o=>{o.addEventListener("click",()=>{const a=o.getAttribute("data-id");if(i(),a==="search")X();else if(a==="sync")j();else if(a==="audio")G();else if(a==="theme"){const n=(document.documentElement.getAttribute("data-theme")||"light")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",n);const d=JSON.parse(localStorage.getItem("lf.prefs")||"{}");d.theme=n,localStorage.setItem("lf.prefs",JSON.stringify(d)),c.ok(n==="dark"?"تم تفعيل الوضع الليلي 🌙":"تم تفعيل الوضع الفاتح ☀️")}else O&&O(a)})})}function Ve(t){O=t;const e=document.getElementById("lf-bottom-nav");e&&e.remove();const i=document.createElement("nav");i.id="lf-bottom-nav",i.className="bottom-nav-bar",i.setAttribute("role","navigation"),i.setAttribute("aria-label","التنقل الرئيسي للجوال"),i.innerHTML=`
    <div class="bottom-nav-inner row between" style="width:100%;max-width:600px;margin:0 auto;height:100%;align-items:center;padding:0 8px;">
      ${_e.map(s=>`
        <button class="bnav-btn ${s.id===ge?"active":""}" data-nav="${s.id}" aria-label="${s.name}">
          <span class="bnav-icon">${s.icon}</span>
          <span class="bnav-label">${s.name}</span>
        </button>
      `).join("")}
    </div>
  `,document.body.appendChild(i),i.querySelectorAll(".bnav-btn").forEach(s=>{s.addEventListener("click",()=>{const o=s.getAttribute("data-nav");o==="all-apps"?fe():(Z(o),O&&O(o))})})}function Z(t){ge=t;const e=document.getElementById("lf-bottom-nav");e&&e.querySelectorAll(".bnav-btn").forEach(i=>{i.getAttribute("data-nav")===t?i.classList.add("active"):i.classList.remove("active")})}const z={mount:Ve,setActive:Z,update:Z,openMoreDrawer:fe};function me(){return new Date().toISOString().slice(0,10)}async function ee(){const t=me(),e=await g.list("health_logs",{all:!0,predicate:i=>i.date===t});return e.length>0?e[0]:{id:"health-"+t,date:t,waterCurrent:0,waterTarget:2500,waterHistory:[],waterReminderActive:!1,mood:null,moodTags:[],moodNote:"",sleepBedtime:"23:00",sleepWaketime:"07:00",sleepHours:8,sleepQuality:4,updatedAt:new Date().toISOString()}}async function L(t){return t.updatedAt=new Date().toISOString(),await g.put("health_logs",t,{all:!0}),b.notifyDataChanged(),t}async function ye(t){const e=me(),i=await ee();if(i.waterReminderActive=t,await L(i),t){const s=[10,13,16,19],o=new Date;for(const a of s){const r=new Date;r.setHours(a,0,0,0),r.getTime()>o.getTime()&&await S.schedule({id:`water-${e}-${a}`,title:"💧 وقت شرب الماء!",body:"حافظ على ترطيب جسمك ونشاطك الذهني. اشرب كوباً من الماء الآن.",timestamp:r.getTime(),sound:"chime",module:"health"})}c.ok("تم تفعيل التذكير الدوري الذكي بشرب الماء كل ساعتين! 💧")}else[10,13,16,19].forEach(s=>{S.cancel(`water-${e}-${s}`)}),c.info("تم إيقاف تذكير شرب الماء مؤقتاً.")}async function Ue(t){let e=await ee();function i(a,r){if(!a||!r)return 8;const[n,d]=a.split(":").map(Number),[p,l]=r.split(":").map(Number);let u=p*60+l-(n*60+d);return u<0&&(u+=1440),Math.round(u/60*10)/10}function s(){const a=Math.min(100,Math.round(e.waterCurrent/e.waterTarget*100)),r=[{level:5,emoji:"🤩",label:"ممتاز"},{level:4,emoji:"😊",label:"جيد"},{level:3,emoji:"😐",label:"محايد"},{level:2,emoji:"😫",label:"مجهد"},{level:1,emoji:"😴",label:"متعب"}],n=["العمل","الرياضة","النوم","العائلة","الدراسة","الطعام","التأمل"];t.innerHTML=`
      <div class="col" style="gap:var(--sp-5);">
        <!-- View Title -->
        <div class="row between">
          <div>
            <h2 style="font-size:var(--fs-xl);font-weight:800;">الصحة والعافية الشخصية 🌿</h2>
            <p class="muted small" style="margin-top:2px;">تتبع ترطيب الجسم، جودة النوم، ومقياس الطاقة والمزاج اليومي</p>
          </div>
          <span class="badge ok">${new Date().toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"short"})}</span>
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
                  <div class="muted xs">الهدف: ${e.waterTarget} مل</div>
                </div>
              </div>
              <button id="btn-water-reminder" class="btn sm ${e.waterReminderActive?"primary":"ghost"}" title="تفعيل تذكير دوري كل ساعتين">
                🔔 ${e.waterReminderActive?"التذكير نشط":"تفعيل التذكير"}
              </button>
            </div>

            <!-- Water Gauge Graphic -->
            <div style="display:flex;align-items:center;justify-content:center;padding:16px 0;">
              <div class="water-tank-wrapper" style="position:relative;width:150px;height:150px;border-radius:50%;border:4px solid #bae6fd;background:#f0f9ff;overflow:hidden;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 8px rgba(2,132,199,0.15);">
                <!-- Animated Water Fill -->
                <div class="water-wave" style="position:absolute;bottom:0;width:100%;height:${a}%;background:linear-gradient(180deg, #38bdf8, #0284c7);transition:height 0.4s cubic-bezier(0.16, 1, 0.3, 1);"></div>
                <!-- Content text -->
                <div style="position:relative;z-index:2;text-align:center;">
                  <div style="font-size:24px;font-weight:800;color:${a>55?"#ffffff":"#0369a1"};">${e.waterCurrent}</div>
                  <div style="font-size:11px;font-weight:600;color:${a>55?"rgba(255,255,255,0.85)":"#0284c7"};">من ${e.waterTarget} مل (${a}%)</div>
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
              <button class="btn ghost sm" id="btn-water-undo" ${e.waterCurrent===0?"disabled":""}>
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
              ${r.map(d=>`
                <button class="mood-btn btn ghost sm col center ${e.mood===d.level?"primary":""}" data-level="${d.level}" style="flex:1;padding:8px 4px;gap:4px;border-radius:var(--radius-m);${e.mood===d.level?"background:var(--accent);color:#fff;":""}">
                  <span style="font-size:22px;">${d.emoji}</span>
                  <span style="font-size:11px;font-weight:700;">${d.label}</span>
                </button>
              `).join("")}
            </div>

            <!-- Mood Tags -->
            <div class="col" style="gap:6px;">
              <span class="muted xs strong">ما الذي أثر على مزاجك؟</span>
              <div class="row wrap" style="gap:6px;">
                ${n.map(d=>`
                    <button class="btn sm tag-btn ${(e.moodTags||[]).includes(d)?"primary":"ghost"}" data-tag="${d}" style="padding:4px 10px;border-radius:var(--radius-pill);font-size:12px;">
                      ${d}
                    </button>
                  `).join("")}
              </div>
            </div>

            <!-- Mood Quick Note -->
            <input type="text" id="input-mood-note" class="input" placeholder="اكتب خاطرة سريعة عن يومك..." value="${e.moodNote||""}" style="padding:8px 12px;font-size:var(--fs-s);border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);" />
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
              ${e.sleepHours} ساعات نوم
            </span>
          </div>

          <div class="row wrap" style="gap:var(--sp-4);">
            <div class="col grow" style="min-width:140px;gap:4px;">
              <label class="muted xs strong">وقت الخلود للنوم:</label>
              <input type="time" id="sleep-bedtime" class="input" value="${e.sleepBedtime||"23:00"}" style="padding:8px;font-family:var(--mono);border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);" />
            </div>

            <div class="col grow" style="min-width:140px;gap:4px;">
              <label class="muted xs strong">وقت الاستيقاظ:</label>
              <input type="time" id="sleep-waketime" class="input" value="${e.sleepWaketime||"07:00"}" style="padding:8px;font-family:var(--mono);border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);" />
            </div>

            <div class="col grow" style="min-width:180px;gap:4px;">
              <label class="muted xs strong">تقييم جودة النوم:</label>
              <div class="row" style="gap:6px;height:38px;align-items:center;">
                ${[1,2,3,4,5].map(d=>`
                  <button class="sleep-star-btn" data-star="${d}" style="background:none;border:none;cursor:pointer;font-size:22px;color:${d<=e.sleepQuality?"#f59e0b":"var(--border-strong)"};">
                    ★
                  </button>
                `).join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
    `,o()}function o(){t.querySelector("#btn-add-water-250").addEventListener("click",async()=>{e.waterCurrent+=250,e.waterHistory.push({amount:250,time:new Date().toISOString()}),await L(e),c.ok("تمت إضافة 250 مل ماء 🥛"),s()}),t.querySelector("#btn-add-water-500").addEventListener("click",async()=>{e.waterCurrent+=500,e.waterHistory.push({amount:500,time:new Date().toISOString()}),await L(e),c.ok("تمت إضافة 500 مل ماء 🍶"),s()});const a=t.querySelector("#btn-water-undo");a&&a.addEventListener("click",async()=>{if(e.waterHistory.length>0){const l=e.waterHistory.pop();e.waterCurrent=Math.max(0,e.waterCurrent-l.amount),await L(e),c.info("تم التراجع عن آخر كمية ماء."),s()}}),t.querySelector("#btn-water-reminder").addEventListener("click",async()=>{await ye(!e.waterReminderActive),s()}),t.querySelectorAll(".mood-btn").forEach(l=>{l.addEventListener("click",async()=>{const u=Number(l.getAttribute("data-level"));e.mood=u,await L(e),s()})}),t.querySelectorAll(".tag-btn").forEach(l=>{l.addEventListener("click",async()=>{const u=l.getAttribute("data-tag");e.moodTags=e.moodTags||[],e.moodTags.includes(u)?e.moodTags=e.moodTags.filter(v=>v!==u):e.moodTags.push(u),await L(e),s()})});const r=t.querySelector("#input-mood-note");r.addEventListener("change",async()=>{e.moodNote=r.value.trim(),await L(e)});const n=t.querySelector("#sleep-bedtime"),d=t.querySelector("#sleep-waketime"),p=async()=>{e.sleepBedtime=n.value,e.sleepWaketime=d.value,e.sleepHours=i(e.sleepBedtime,e.sleepWaketime),await L(e);const l=t.querySelector("#sleep-duration-badge");l&&(l.textContent=`${e.sleepHours} ساعات نوم`)};n.addEventListener("change",p),d.addEventListener("change",p),t.querySelectorAll(".sleep-star-btn").forEach(l=>{l.addEventListener("click",async()=>{e.sleepQuality=Number(l.getAttribute("data-star")),await L(e),s()})})}s()}const be={render:Ue,getToday:ee,save:L,toggleWaterReminder:ye};function Ke(){return new Date().toISOString().slice(0,10)}const Qe=[{id:"m1",text:"أذكار الصباح والاستغفار 🤲",done:!1},{id:"m2",text:"شرب كوب كبير من الماء 💧",done:!1},{id:"m3",text:"ترتيب السرير وتهوية الغرفة 🛏️",done:!1},{id:"m4",text:"قراءة مفيدة لمدة 10 دقائق 📖",done:!1},{id:"m5",text:"تحديد 3 أولويات رئيسية لليوم 🎯",done:!1}],Je=[{id:"e1",text:"مراجعة وتقييم إنجازات اليوم 📝",done:!1},{id:"e2",text:"تفريغ العقل من أي مهام عالقة 🧠",done:!1},{id:"e3",text:"تجهيز الملابس وترتيب المكتب للغد 👔",done:!1},{id:"e4",text:"إيقاف الشاشات والأجهزة الإلكترونية 📵",done:!1},{id:"e5",text:"أذكار النوم والاسترخاء 🌙",done:!1}];async function te(t="morning"){const e=Ke(),i=`routine-${t}`;let s=await g.get("routines",i);if(s||(s={id:i,type:t,title:t==="morning"?"روتين الصباح المشرق ☀️":"روتين المساء الهادئ 🌙",reminderTime:t==="morning"?"06:30":"22:00",reminderActive:!1,streak:0,lastCompletedDate:null,steps:t==="morning"?Qe:Je,date:e},await g.put("routines",s,{all:!0})),s.date!==e){const o=s.steps.every(r=>r.done),a=new Date(Date.now()-864e5).toISOString().slice(0,10);o&&s.date===a?s.streak=(s.streak||0)+1:s.date!==a&&(s.streak=0),s.date=e,s.steps=s.steps.map(r=>({...r,done:!1})),await g.put("routines",s,{all:!0}),b.notifyDataChanged()}return s}async function M(t){return t.updatedAt=new Date().toISOString(),await g.put("routines",t,{all:!0}),b.notifyDataChanged(),t}async function ie(t,e){const i=await te(t);i.reminderActive=e,await M(i);const s=`rem-routine-${t}`;if(e){const[o,a]=(i.reminderTime||"07:00").split(":").map(Number),r=new Date;r.setHours(o,a,0,0),r.getTime()<=Date.now()&&r.setDate(r.getDate()+1),await S.schedule({id:s,title:t==="morning"?"☀️ حان موعد روتينك الصباحي!":"🌙 حان موعد روتينك المسائي!",body:t==="morning"?"ابدأ يومك بنشاط وأنجز خطواتك الصباحية.":"استعد لنوم هانئ وأنهِ خطواتك المسائية.",timestamp:r.getTime(),sound:t==="morning"?"bell":"chime",module:"routines"}),c.ok(`تم ضبط تذكير الروتين اليومي الساعة ${i.reminderTime} ⏰`)}else await S.cancel(s),c.info("تم إيقاف تذكير الروتين.")}async function Ze(t){let e="morning";async function i(){const o=await te(e),a=o.steps.length,r=o.steps.filter(p=>p.done).length,n=a>0?Math.round(r/a*100):0,d=n===100;t.innerHTML=`
      <div class="col" style="gap:var(--sp-5);">
        <!-- Title & Switcher -->
        <div class="row between wrap" style="gap:12px;">
          <div>
            <h2 style="font-size:var(--fs-xl);font-weight:800;">الروتين اليومي المتسلسل ⚡</h2>
            <p class="muted small" style="margin-top:2px;">خطوات بسيطة يومية تقلل إجهاد اتخاذ القرار وتضاعف الإنتاجية</p>
          </div>

          <!-- Routine Type Tabs -->
          <div class="row" style="background:var(--surface-2);padding:4px;border-radius:var(--radius-pill);border:1px solid var(--border);">
            <button class="btn sm ${e==="morning"?"primary":"ghost"}" id="tab-morning" style="border-radius:var(--radius-pill);padding:6px 16px;">
              ☀️ روتين الصباح
            </button>
            <button class="btn sm ${e==="evening"?"primary":"ghost"}" id="tab-evening" style="border-radius:var(--radius-pill);padding:6px 16px;">
              🌙 روتين المساء
            </button>
          </div>
        </div>

        <!-- Routine Progress Card -->
        <div class="card col" style="gap:var(--sp-4);background:linear-gradient(135deg, var(--surface) 60%, ${e==="morning"?"rgba(245, 158, 11, 0.08)":"rgba(99, 102, 241, 0.08)"});">
          <div class="row between">
            <div class="row" style="gap:12px;">
              <div class="logo-badge" style="width:44px;height:44px;font-size:22px;border-radius:12px;background:${e==="morning"?"rgba(245, 158, 11, 0.2)":"rgba(99, 102, 241, 0.2)"};color:${e==="morning"?"#d97706":"#6366f1"};">
                ${e==="morning"?"☀️":"🌙"}
              </div>
              <div>
                <h3 style="font-size:var(--fs-l);font-weight:800;">${o.title}</h3>
                <div class="row" style="gap:8px;margin-top:2px;">
                  <span class="badge accent">🔥 سلسلة الالتزام: ${o.streak||0} أيام متتالية</span>
                  <span class="badge ok">${r} من ${a} خطوات</span>
                </div>
              </div>
            </div>

            <div class="row" style="gap:8px;">
              <input type="time" id="routine-time-input" class="input" value="${o.reminderTime||"07:00"}" style="padding:6px 10px;font-family:var(--mono);border-radius:var(--radius-s);font-size:var(--fs-xs);border:1px solid var(--border);" />
              <button class="btn sm ${o.reminderActive?"primary":"ghost"}" id="btn-routine-reminder" title="تفعيل تذكير يومي">
                🔔 ${o.reminderActive?"منبه نشط":"تفعيل"}
              </button>
            </div>
          </div>

          <!-- Progress Bar -->
          <div style="width:100%;height:10px;background:var(--surface-3);border-radius:var(--radius-pill);overflow:hidden;">
            <div style="width:${n}%;height:100%;background:${d?"var(--ok)":"var(--accent)"};border-radius:var(--radius-pill);transition:width 0.3s ease;"></div>
          </div>

          ${d?`
            <div class="banner ok" style="animation:slideUp 0.3s ease;">
              <span style="font-size:20px;">🎉</span>
              <div class="grow">
                <strong>رائع جداً!</strong> لقد أكملت كامل خطوات روتينك بنجاح اليوم. حافظ على هذا الالتزام غداً!
              </div>
            </div>
          `:""}
        </div>

        <!-- Sequential Checklist Steps -->
        <div class="card col" style="gap:var(--sp-3);">
          <div class="row between" style="margin-bottom:4px;">
            <span class="strong small muted">خطوات الروتين بالترتيب:</span>
            <span class="xs faint">اضغط على أي خطوة لإتمامها</span>
          </div>

          <div class="col" id="routine-steps-list" style="gap:8px;">
            ${o.steps.map((p,l)=>`
              <div class="row between routine-step-row" data-id="${p.id}" style="padding:12px 14px;background:var(--surface-2);border-radius:var(--radius-m);border:1px solid ${p.done?"rgba(13, 115, 80, 0.25)":"var(--border)"};cursor:pointer;transition:all var(--tr-fast);">
                <div class="row" style="gap:12px;">
                  <div class="step-check center" style="width:24px;height:24px;border-radius:6px;border:2px solid ${p.done?"var(--ok)":"var(--border-strong)"};background:${p.done?"var(--ok)":"transparent"};color:#fff;font-size:13px;font-weight:800;">
                    ${p.done?"✓":""}
                  </div>
                  <span class="step-num faint xs num">${l+1}.</span>
                  <span class="step-text strong small" style="text-decoration:${p.done?"line-through":"none"};color:${p.done?"var(--text-muted)":"var(--text)"};">
                    ${p.text}
                  </span>
                </div>
                <button class="icon-btn btn-del-step" data-id="${p.id}" style="color:var(--text-faint);background:none;border:none;cursor:pointer;padding:4px;" title="حذف الخطوة">
                  ✕
                </button>
              </div>
            `).join("")}
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
    `,s(o)}function s(o){t.querySelector("#tab-morning").addEventListener("click",()=>{e="morning",i()}),t.querySelector("#tab-evening").addEventListener("click",()=>{e="evening",i()}),t.querySelector("#btn-routine-reminder").addEventListener("click",async()=>{await ie(e,!o.reminderActive),i()}),t.querySelector("#routine-time-input").addEventListener("change",async r=>{o.reminderTime=r.target.value,await M(o),o.reminderActive&&await ie(e,!0)}),t.querySelectorAll(".routine-step-row").forEach(r=>{r.addEventListener("click",async n=>{if(n.target.closest(".btn-del-step"))return;const d=r.getAttribute("data-id"),p=o.steps.find(l=>l.id===d);p&&(p.done=!p.done,await M(o),o.steps.every(l=>l.done)&&c.ok("🎉 مبارك! أتممت الروتين كاملاً اليوم!"),i())})}),t.querySelectorAll(".btn-del-step").forEach(r=>{r.addEventListener("click",async n=>{n.stopPropagation();const d=r.getAttribute("data-id");o.steps=o.steps.filter(p=>p.id!==d),await M(o),i()})});const a=async()=>{const n=t.querySelector("#new-step-text").value.trim();n&&(o.steps.push({id:"s-"+Date.now().toString(36),text:n,done:!1}),await M(o),i())};t.querySelector("#btn-add-step").addEventListener("click",a),t.querySelector("#new-step-text").addEventListener("keydown",r=>{r.key==="Enter"&&a()})}await i()}const he={render:Ze,getRecord:te,save:M};async function $(){return(await g.list("inbox_items",{all:!0,predicate:e=>e.status!=="archived"})).sort((e,i)=>i.createdAt.localeCompare(e.createdAt))}async function xe(t){if(!t||!t.trim())return null;const e={id:"inbox-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,6),text:t.trim(),status:"inbox",createdAt:new Date().toISOString()};return await g.put("inbox_items",e,{all:!0}),b.notifyDataChanged(),e}async function we(t){return await g.delete("inbox_items",t),b.notifyDataChanged(),!0}async function F(t,e,i={}){const s=await g.get("inbox_items",t);if(!s)return!1;const o=new Date().toISOString().slice(0,10);if(e==="task"){const a={id:"task-"+Date.now().toString(36),title:s.text,priority:i.priority||"medium",date:i.date||o,status:"todo",createdAt:new Date().toISOString()};await g.put("tasks",a,{all:!0}),c.ok("✔️ تم تحويل الفكرة إلى مهمة عمل في قائمة المهام!")}else if(e==="expense"){const a={id:"exp-"+Date.now().toString(36),title:s.text,amount:i.amount||0,categoryId:i.categoryId||"general",date:o,createdAt:new Date().toISOString()};await g.put("expenses",a,{all:!0}),c.ok(`💰 تم تحويل الفكرة إلى مصروف بقيمة ${a.amount} في سجل المصروفات!`)}else if(e==="event"){const a={id:"ev-"+Date.now().toString(36),title:s.text,date:i.date||o,time:i.time||"10:00",type:"appointment",createdAt:new Date().toISOString()};await g.put("events",a,{all:!0}),c.ok("📅 تم إدراج الفكرة كموعد في التقويم!")}else if(e==="note"){const a={id:"note-"+Date.now().toString(36),title:s.text.slice(0,40),body:s.text,createdAt:new Date().toISOString()};await g.put("notes",a,{all:!0}),c.ok("📝 تم حفظ الفكرة كملاحظة دائمة في دفتر الملاحظات!")}return s.status="converted",s.convertedTo=e,s.convertedAt=new Date().toISOString(),await g.put("inbox_items",s,{all:!0}),b.notifyDataChanged(),!0}async function Ye(t){let e=await $();function i(a){const r=document.createElement("div");r.className="modal-overlay",r.innerHTML=`
      <div class="modal-content" dir="rtl" style="max-width:400px;">
        <div class="modal-header">
          <h3 style="font-size:var(--fs-m);font-weight:700;">تحويل إلى مصروف مالي 💰</h3>
          <button class="btn ghost sm" id="exp-close" style="padding:4px 8px;border-radius:50%;">✕</button>
        </div>
        <div class="modal-body col" style="gap:12px;">
          <div class="muted small">الفكرة: <strong>${a.text}</strong></div>
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
    `,document.body.appendChild(r);const n=()=>r.remove();r.querySelector("#exp-close").addEventListener("click",n),r.querySelector("#exp-cancel").addEventListener("click",n),r.querySelector("#exp-confirm").addEventListener("click",async()=>{const d=parseFloat(r.querySelector("#exp-amount").value)||0;n(),await F(a.id,"expense",{amount:d}),e=await $(),s()})}function s(){const a=e.filter(n=>n.status==="inbox"),r=e.filter(n=>n.status==="converted");t.innerHTML=`
      <div class="col" style="gap:var(--sp-5);">
        <!-- Title & Subtitle -->
        <div class="row between wrap" style="gap:12px;">
          <div>
            <h2 style="font-size:var(--fs-xl);font-weight:800;">صندوق تفريغ الأفكار السريع 🧠</h2>
            <p class="muted small" style="margin-top:2px;">فرّغ أي فكرة تخطر ببالك في ثوانٍ، وعالجها لاحقاً بنقرة واحدة</p>
          </div>
          <span class="badge accent">${a.length} أفكار بانتظار المعالجة</span>
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

          ${a.length===0?`
            <div class="card center col" style="padding:36px 16px;text-align:center;gap:8px;">
              <div style="font-size:36px;">🍃</div>
              <h4 class="strong small">ذهنك صافٍ تماماً!</h4>
              <p class="muted xs">لا توجد أفكار عالقة في صندوق الوارد. استخدم الشريط أعلاه لتفريغ أي فكرة جديدة.</p>
            </div>
          `:`
            <div class="col" style="gap:10px;">
              ${a.map(n=>`
                <div class="card col" style="gap:10px;padding:14px 16px;">
                  <div class="row between">
                    <span class="strong" style="font-size:var(--fs-m);">${n.text}</span>
                    <button class="icon-btn btn-del-inbox" data-id="${n.id}" title="حذف" style="background:none;border:none;cursor:pointer;color:var(--text-faint);padding:4px;">
                      ✕
                    </button>
                  </div>

                  <!-- 1-Click Action Conversion Buttons -->
                  <div class="row wrap" style="gap:8px;padding-top:8px;border-top:1px solid var(--border);">
                    <span class="muted xs" style="align-self:center;">تحويل إلى:</span>
                    <button class="btn ghost sm btn-conv-task" data-id="${n.id}" style="font-size:12px;">
                      ✔️ مهمة عمل
                    </button>
                    <button class="btn ghost sm btn-conv-expense" data-id="${n.id}" style="font-size:12px;">
                      💰 مصروف مالي
                    </button>
                    <button class="btn ghost sm btn-conv-event" data-id="${n.id}" style="font-size:12px;">
                      📅 موعد بالتقويم
                    </button>
                    <button class="btn ghost sm btn-conv-note" data-id="${n.id}" style="font-size:12px;">
                      📝 ملاحظة دائمة
                    </button>
                  </div>
                </div>
              `).join("")}
            </div>
          `}
        </div>

        <!-- Processed / Converted Items Archive -->
        ${r.length>0?`
          <div class="col" style="gap:var(--sp-2);margin-top:var(--sp-4);">
            <div class="row between">
              <span class="muted xs strong">أفكار تمت معالجتها ونقلها (${r.length}):</span>
            </div>
            <div class="col" style="gap:6px;">
              ${r.slice(0,5).map(n=>`
                <div class="row between" style="padding:8px 12px;background:var(--surface-2);border-radius:var(--radius-s);font-size:var(--fs-xs);opacity:0.75;">
                  <span class="truncate" style="text-decoration:line-through;">${n.text}</span>
                  <span class="badge ok xs">تم النقل إلى ${n.convertedTo}</span>
                </div>
              `).join("")}
            </div>
          </div>
        `:""}
      </div>
    `,o()}function o(){const a=t.querySelector("#rapid-inbox-input"),r=async()=>{const n=a.value.trim();n&&(await xe(n),a.value="",c.ok("⚡ تم تفريغ الفكرة بنجاح في صندوق الوارد!"),e=await $(),s())};t.querySelector("#btn-rapid-save").addEventListener("click",r),a.addEventListener("keydown",n=>{n.key==="Enter"&&r()}),t.querySelectorAll(".btn-del-inbox").forEach(n=>{n.addEventListener("click",async()=>{const d=n.getAttribute("data-id");await we(d),c.info("تم حذف العنصر."),e=await $(),s()})}),t.querySelectorAll(".btn-conv-task").forEach(n=>{n.addEventListener("click",async()=>{const d=n.getAttribute("data-id");await F(d,"task"),e=await $(),s()})}),t.querySelectorAll(".btn-conv-expense").forEach(n=>{n.addEventListener("click",()=>{const d=n.getAttribute("data-id"),p=e.find(l=>l.id===d);p&&i(p)})}),t.querySelectorAll(".btn-conv-event").forEach(n=>{n.addEventListener("click",async()=>{const d=n.getAttribute("data-id");await F(d,"event"),e=await $(),s()})}),t.querySelectorAll(".btn-conv-note").forEach(n=>{n.addEventListener("click",async()=>{const d=n.getAttribute("data-id");await F(d,"note"),e=await $(),s()})})}s()}const Xe={render:Ye,add:xe,list:$,convert:F,delete:we};async function B(t,e=null){const i=k.isSignedIn(),s=k.getUser(),o=b.getLastSyncAt(),a=o?new Date(o).toLocaleString("ar-EG"):"لم تتم المزامنة بعد";t.innerHTML=`
    <div class="col center" style="min-height:75vh;padding:var(--sp-4) var(--sp-2);animation:fadeIn 0.25s ease-out;" dir="rtl">
      <div class="card" style="width:100%;max-width:480px;padding:var(--sp-5);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-l);box-shadow:0 12px 36px rgba(0,0,0,0.06);">
        
        <!-- Brand Header -->
        <div class="col center" style="gap:8px;text-align:center;margin-bottom:var(--sp-5);">
          <div class="logo-badge" style="width:58px;height:58px;border-radius:16px;background:linear-gradient(135deg, #0d9488, #0f766e);box-shadow:0 8px 20px rgba(13,148,136,0.3);display:flex;align-items:center;justify-content:center;color:#fff;">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h2 style="font-size:var(--fs-xl);font-weight:800;color:var(--text);margin-top:6px;">LifeFlow</h2>
          <p class="muted" style="font-size:var(--fs-s);margin:0;line-height:1.5;">
            نظام إدارة الحياة الشخصية والإنتاجية<br/>
            <span style="font-weight:600;color:var(--accent);">بياناتك ملكك وحدك • مشفرة ومحلية بالكامل</span>
          </p>
        </div>

        ${i&&s?`
          <!-- Logged In Profile Card -->
          <div class="col" style="gap:16px;">
            <div class="card" style="padding:16px;background:var(--surface-2);border-radius:var(--radius-m);border:1px solid var(--border);">
              <div class="row" style="gap:14px;align-items:center;">
                ${s.picture?`
                  <img src="${s.picture}" alt="Avatar" style="width:52px;height:52px;border-radius:50%;border:2px solid var(--accent);box-shadow:0 4px 10px rgba(0,0,0,0.1);" />
                `:`
                  <div class="logo-badge" style="width:52px;height:52px;border-radius:50%;font-size:20px;font-weight:bold;">${s.name?s.name[0]:"U"}</div>
                `}
                <div class="grow">
                  <div class="row between" style="align-items:center;">
                    <div style="font-size:var(--fs-m);font-weight:700;color:var(--text);">${s.name||"مستخدم LifeFlow"}</div>
                    <span class="badge" style="background:#e6f4ea;color:#137333;font-size:11px;padding:3px 8px;border-radius:12px;font-weight:600;">🟢 متصل بالسحابة</span>
                  </div>
                  <div class="muted" style="font-size:var(--fs-xs);margin-top:2px;">${s.email}</div>
                </div>
              </div>

              <div style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--border);font-size:var(--fs-xs);color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;">
                <span>🕒 آخر مزامنة سحابية:</span>
                <strong style="color:var(--text);">${a}</strong>
              </div>
            </div>

            <!-- Cloud Actions -->
            <div class="row" style="gap:10px;">
              <button class="btn primary sm grow" id="btn-login-sync-now" style="gap:8px;padding:10px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                مزامنة سحابية الآن
              </button>
              <button class="btn ghost sm grow" id="btn-login-restore" style="gap:8px;padding:10px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                استعادة النسخة
              </button>
            </div>

            <!-- Sign Out Button -->
            <button class="btn ghost sm" id="btn-login-signout" style="width:100%;color:var(--danger);border-color:rgba(239,68,68,0.2);padding:10px;">
              تسجيل الخروج من حساب Google
            </button>
          </div>
        `:`
          <!-- Sign In State -->
          <div class="col" style="gap:14px;">
            <!-- Google Sign In Button -->
            <button id="btn-login-google" class="btn" style="width:100%;padding:12px 16px;background:#ffffff;color:#3c4043;border:1px solid #dadce0;border-radius:var(--radius-s);font-size:var(--fs-m);font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,0.08);display:flex;align-items:center;justify-content:center;gap:12px;transition:var(--tr-smooth);cursor:pointer;">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>تسجيل الدخول والمزامنة بواسطة Google</span>
            </button>
            <div class="muted" style="font-size:11.5px;text-align:center;line-height:1.4;">
              حفظ واستعادة النسخ الاحتياطية المشفرة في مجلد تطبيقك الخاص (appDataFolder) مجاناً.
            </div>

            <!-- Divider -->
            <div class="row center" style="gap:12px;margin:4px 0;">
              <div style="height:1px;background:var(--border);flex:1;"></div>
              <span class="muted" style="font-size:var(--fs-xs);">أو</span>
              <div style="height:1px;background:var(--border);flex:1;"></div>
            </div>

            <!-- Continue Local Guest Button -->
            <button id="btn-login-local" class="btn ghost" style="width:100%;padding:11px;font-size:var(--fs-s);border-radius:var(--radius-s);font-weight:600;gap:8px;">
              <span>💾</span>
              <span>المتابعة كحساب محلي بدون إنترنت (Local-First)</span>
            </button>
          </div>
        `}

        <!-- Instant Offline Backup & Restore Card -->
        <div class="card" style="margin-top:var(--sp-4);background:var(--surface-2);border-radius:var(--radius-s);padding:14px;border:1px solid var(--border);">
          <div class="col" style="gap:8px;">
            <div class="row between" style="align-items:center;">
              <span class="strong" style="font-size:var(--fs-xs);color:var(--text);">النسخ الاحتياطي الفوري بملف مشفر:</span>
              <span class="badge" style="background:var(--accent-soft);color:var(--accent);font-size:10.5px;padding:2px 6px;">AES-256</span>
            </div>
            <div class="row" style="gap:8px;">
              <button class="btn secondary sm grow" id="btn-login-instant-export" style="gap:6px;font-size:12px;padding:8px;cursor:pointer;">
                <span>📥</span>
                <span>تصدير نسخة مشفرة</span>
              </button>
              <button class="btn ghost sm grow" id="btn-login-instant-restore" style="gap:6px;font-size:12px;padding:8px;border:1px dashed var(--border);cursor:pointer;">
                <span>📤</span>
                <span>استعادة من ملف</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Security & Privacy Guarantee Badges -->
        <div class="col" style="margin-top:var(--sp-5);padding-top:var(--sp-4);border-top:1px solid var(--border);gap:8px;">
          <div class="row" style="gap:10px;align-items:center;">
            <span style="font-size:16px;">🛡️</span>
            <div style="font-size:12px;color:var(--text-muted);line-height:1.4;">
              <strong style="color:var(--text);">تشفير عسكري AES-GCM-256:</strong> حماية كاملة لكافة البيانات والوثائق الحساسة.
            </div>
          </div>
          <div class="row" style="gap:10px;align-items:center;">
            <span style="font-size:16px;">⚡</span>
            <div style="font-size:12px;color:var(--text-muted);line-height:1.4;">
              <strong style="color:var(--text);">أولوية مطلقة للبيانات المحلية:</strong> التطبيق يعمل بالكامل دون الحاجة لشبكة الإنترنت.
            </div>
          </div>
          <div class="row" style="gap:10px;align-items:center;">
            <span style="font-size:16px;">🔒</span>
            <div style="font-size:12px;color:var(--text-muted);line-height:1.4;">
              <strong style="color:var(--text);">انعدام تسريب البيانات (Zero Leak):</strong> لا توجد أي خوادم وسيطة تجمع معلوماتك.
            </div>
          </div>
        </div>

        <!-- Back to App / Dashboard Button -->
        <div style="margin-top:var(--sp-5);">
          <button id="btn-login-go-dashboard" class="btn primary" style="width:100%;padding:12px;font-weight:700;font-size:var(--fs-m);border-radius:var(--radius-s);gap:8px;box-shadow:0 4px 14px rgba(13,148,136,0.25);">
            <span>الانتقال إلى لوحة التحكم الرئيسية</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>

      </div>
    </div>
  `;const r=t.querySelector("#btn-login-google");r&&r.addEventListener("click",async()=>{try{c.info("جارٍ الاتصال بحساب Google..."),await k.signIn(),c.ok("تم تسجيل الدخول بحساب Google بنجاح!"),B(t,e)}catch(f){c.error("فشل تسجيل الدخول: "+f.message)}});const n=t.querySelector("#btn-login-local");n&&n.addEventListener("click",()=>{c.info("أنت تعمل الآن بحساب محلي آمن 100% دون اتصال."),e?e("dashboard"):window.location.hash="#view=dashboard"});const d=t.querySelector("#btn-login-instant-export");d&&d.addEventListener("click",async()=>{d.disabled=!0;try{await P.exportInstantEncryptedBackup()}finally{d.disabled=!1}});const p=t.querySelector("#btn-login-instant-restore");p&&p.addEventListener("click",async()=>{await P.promptAndRestoreFile(),B(t,e)});const l=t.querySelector("#btn-login-sync-now");l&&l.addEventListener("click",async()=>{l.disabled=!0,l.textContent="جاري المزامنة...";try{await b.syncNow(),c.ok("تمت المزامنة السحابية بنجاح!"),B(t,e)}catch(f){c.error("خطأ أثناء المزامنة: "+f.message)}finally{l.disabled=!1}});const u=t.querySelector("#btn-login-restore");u&&u.addEventListener("click",async()=>{if(confirm("هل تريد استعادة النسخة الاحتياطية من Google Drive واستبدال البيانات الحالية؟"))try{await b.restoreFromDrive(),c.ok("تمت استعادة البيانات بنجاح من السحابة!"),B(t,e)}catch(f){c.error("تعذر استعادة البيانات: "+f.message)}});const v=t.querySelector("#btn-login-signout");v&&v.addEventListener("click",()=>{k.signOut(),c.info("تم إلغاء ربط الحساب بنجاح."),B(t,e)});const m=t.querySelector("#btn-login-go-dashboard");m&&m.addEventListener("click",()=>{e?e("dashboard"):window.location.hash="#view=dashboard"})}const et={render:B};console.log("[LifeFlow] Booting LifeFlow Mega OS: All 23 Units (15 Original + 8 New Modules)...");const tt=[{id:"dashboard",name:"الرئيسية",icon:"📊"},{id:"myday",name:"يومي",icon:"⭐"},{id:"tasks",name:"المهام",icon:"✔️"},{id:"expenses",name:"المالية",icon:"💰"},{id:"calendar",name:"التقويم",icon:"📅"},{id:"health",name:"الصحة",icon:"🌿"},{id:"focus",name:"التركيز",icon:"⏱️"},{id:"routines",name:"الروتين",icon:"⚡"},{id:"habits",name:"العادات",icon:"🔥"},{id:"study",name:"الدراسة",icon:"📚"},{id:"work",name:"العمل",icon:"💼"},{id:"goals",name:"الأهداف",icon:"🎯"},{id:"debts",name:"إدارة الديون",icon:"💳"},{id:"shopping",name:"المشتريات والتسوق",icon:"🛒"},{id:"home",name:"المنزل والمرافق",icon:"🏠"},{id:"vault",name:"خزينة الوثائق",icon:"🛡️"},{id:"inbox",name:"صندوق الأفكار",icon:"🧠"},{id:"notes",name:"الملاحظات والمسودات",icon:"📝"},{id:"reminders",name:"التنبيهات والأصوات",icon:"🔔"},{id:"analytics",name:"التحليلات ومستشار AI",icon:"📈"},{id:"reports",name:"التقارير الشاملة",icon:"📋"},{id:"contacts",name:"المساحات والأمان",icon:"👥"},{id:"settings",name:"إعدادات المظهر",icon:"⚙️"},{id:"login",name:"الحساب والمزامنة",icon:"👤"}];let Y="dashboard";async function st(){if("serviceWorker"in navigator)try{const t=new URL("./sw.js",window.location.href).href,e=await navigator.serviceWorker.register(t);return console.log("[LifeFlow SW] Registered successfully with scope:",e.scope),navigator.serviceWorker.addEventListener("message",async i=>{if(i.data){if(i.data.type==="REMINDER_DONE"){const s=await g.get("reminders",i.data.reminderId);s&&(s.status="done",s.completedAt=new Date().toISOString(),await g.put("reminders",s,{all:!0}),c.ok(`✔️ تم إنجاز التنبيه: ${s.title}`))}if(i.data.type==="REMINDER_SNOOZE"&&await S.snooze(i.data.reminderId,i.data.minutes||10),i.data.type==="NAVIGATE_TO"){const s=i.data.url.replace("/#","#");window.location.hash=s}}}),e}catch(t){console.warn("[LifeFlow SW] Registration error:",t)}return null}async function ke(t){const e=await be.getToday(),i=await he.getRecord("morning"),s=await g.list("focus_sessions",{all:!0,predicate:f=>f.date===new Date().toISOString().slice(0,10)}),o=await re.list(),a=s.reduce((f,h)=>f+(h.minutes||0),0),r=Math.round(e.waterCurrent/e.waterTarget*100);t.innerHTML=`
    <div class="col" style="gap:var(--sp-4);">
      <!-- 1. Smart Arabic NLP Quick-Add Bar -->
      <div class="nlp-quick-add" id="nlp-quick-add-box">
        <div class="row" style="gap:10px;align-items:center;">
          <span style="font-size:22px;flex:none;">✨</span>
          <input type="text" id="nlp-input" class="grow" placeholder="جرّب: 'غداء مع أحمد بـ 45 ريال بكرة 3 عصراً' أو 'شراء شاحن عاجل'..." style="border:none;outline:none;background:transparent;font-size:var(--fs-m);font-family:inherit;color:var(--text);" />
          <button class="btn primary sm" id="btn-nlp-submit" style="padding:7px 16px;flex:none;">
            إضافة ذكية ⚡
          </button>
        </div>

        <!-- Live Extracted Chips Badges -->
        <div class="nlp-chips-container" id="nlp-chips-preview">
          <span class="faint xs">اكتب أي جملة باللغة العربية وسيتعرف النظام آلياً على النوع، المبلغ، والتاريخ</span>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="kpi-grid">
        <!-- Water KPI -->
        <div class="kpi-card nav-shortcut" data-target="health" style="cursor:pointer;">
          <div class="kpi-icon" style="background:rgba(2, 132, 199, 0.15);color:#0284c7;">
            💧
          </div>
          <div class="kpi-content">
            <span class="kpi-title">ترطيب الجسم (الماء)</span>
            <span class="kpi-val">${e.waterCurrent} / ${e.waterTarget} مل</span>
            <span class="kpi-desc">${r}% من الهدف اليومي</span>
          </div>
        </div>

        <!-- Focus KPI -->
        <div class="kpi-card nav-shortcut" data-target="focus" style="cursor:pointer;">
          <div class="kpi-icon" style="background:rgba(13, 148, 136, 0.15);color:var(--accent);">
            ⏱️
          </div>
          <div class="kpi-content">
            <span class="kpi-title">التركيز وبومودورو</span>
            <span class="kpi-val">${a} دقيقة</span>
            <span class="kpi-desc">${s.length} جلسات تركيز اليوم</span>
          </div>
        </div>

        <!-- Routines KPI -->
        <div class="kpi-card nav-shortcut" data-target="routines" style="cursor:pointer;">
          <div class="kpi-icon" style="background:rgba(245, 158, 11, 0.15);color:#d97706;">
            🔥
          </div>
          <div class="kpi-content">
            <span class="kpi-title">سلسلة الروتين اليومي</span>
            <span class="kpi-val">${i.streak||0} أيام متتالية</span>
            <span class="kpi-desc">${i.steps.filter(f=>f.done).length}/${i.steps.length} خطوات منجزة</span>
          </div>
        </div>

        <!-- Vault KPI -->
        <div class="kpi-card nav-shortcut" data-target="vault" style="cursor:pointer;">
          <div class="kpi-icon" style="background:rgba(99, 102, 241, 0.15);color:#6366f1;">
            🛡️
          </div>
          <div class="kpi-content">
            <span class="kpi-title">خزينة الوثائق</span>
            <span class="kpi-val">${o.length} وثائق مؤمنة</span>
            <span class="kpi-desc">إنذار مبكر لانتهاء الصلاحية</span>
          </div>
        </div>
      </div>

      <!-- Quick Launchpad for Modules -->
      <section class="card col" style="gap:var(--sp-4);">
        <div class="row between">
          <div>
            <h3 style="font-size:var(--fs-l);font-weight:700;">أقسام LifeFlow الذكية</h3>
            <p class="muted xs" style="margin-top:2px;">انقر للدخول المباشر إلى أي قسم</p>
          </div>
          <button class="btn ghost sm" id="btn-open-cmd-pal">
            🔍 بحث وأوامر (Ctrl+K)
          </button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:var(--sp-3);">
          <div class="card col between nav-shortcut" data-target="health" style="padding:14px;background:var(--surface-2);cursor:pointer;">
            <div class="row" style="gap:10px;">
              <span style="font-size:24px;">🌿</span>
              <div>
                <h4 class="strong small">الصحة والعافية</h4>
                <div class="muted xs">شرب الماء، النوم، ومقياس المزاج</div>
              </div>
            </div>
            <span class="btn ghost sm" style="margin-top:8px;width:100%;">فتح متتبع الصحة ➔</span>
          </div>

          <div class="card col between nav-shortcut" data-target="routines" style="padding:14px;background:var(--surface-2);cursor:pointer;">
            <div class="row" style="gap:10px;">
              <span style="font-size:24px;">⚡</span>
              <div>
                <h4 class="strong small">الروتين المتسلسل</h4>
                <div class="muted xs">روتين الصباح والمساء لمحاربة التردد</div>
              </div>
            </div>
            <span class="btn ghost sm" style="margin-top:8px;width:100%;">فتح الروتينات ➔</span>
          </div>

          <div class="card col between nav-shortcut" data-target="focus" style="padding:14px;background:var(--surface-2);cursor:pointer;">
            <div class="row" style="gap:10px;">
              <span style="font-size:24px;">⏱️</span>
              <div>
                <h4 class="strong small">مؤقت بومودورو والأصوات</h4>
                <div class="muted xs">جلسات 25 دقيقة + أصوات مطر وبحر دون إنترنت</div>
              </div>
            </div>
            <span class="btn ghost sm" style="margin-top:8px;width:100%;">بدء جلسة تركيز ➔</span>
          </div>

          <div class="card col between nav-shortcut" data-target="inbox" style="padding:14px;background:var(--surface-2);cursor:pointer;">
            <div class="row" style="gap:10px;">
              <span style="font-size:24px;">🧠</span>
              <div>
                <h4 class="strong small">صندوق تفريغ الأفكار</h4>
                <div class="muted xs">تفريغ فوري والتحويل لمهمة أو مصروف</div>
              </div>
            </div>
            <span class="btn ghost sm" style="margin-top:8px;width:100%;">تفريغ فكرة الآن ➔</span>
          </div>

          <div class="card col between nav-shortcut" data-target="analytics" style="padding:14px;background:var(--surface-2);cursor:pointer;">
            <div class="row" style="gap:10px;">
              <span style="font-size:24px;">📈</span>
              <div>
                <h4 class="strong small">التحليلات والمستشار الذكي</h4>
                <div class="muted xs">تقارير النوم والإنجاز وذكاء اصطناعي</div>
              </div>
            </div>
            <span class="btn ghost sm" style="margin-top:8px;width:100%;">عرض التحليلات ➔</span>
          </div>

          <div class="card col between nav-shortcut" data-target="vault" style="padding:14px;background:var(--surface-2);cursor:pointer;">
            <div class="row" style="gap:10px;">
              <span style="font-size:24px;">🛡️</span>
              <div>
                <h4 class="strong small">خزينة الوثائق</h4>
                <div class="muted xs">حفظ الهويات والجوازات وتنبيهات الانتهاء</div>
              </div>
            </div>
            <span class="btn ghost sm" style="margin-top:8px;width:100%;">فتح الخزينة ➔</span>
          </div>
        </div>
      </section>
    </div>
  `,t.querySelectorAll(".nav-shortcut").forEach(f=>{f.addEventListener("click",()=>{const h=f.getAttribute("data-target");E(h)})});const n=t.querySelector("#btn-open-cmd-pal");n&&n.addEventListener("click",J.open);const d=t.querySelector("#nlp-input"),p=t.querySelector("#nlp-chips-preview"),l=t.querySelector("#btn-nlp-submit"),u=()=>{const f=d.value.trim();if(!f)return p.innerHTML='<span class="faint xs">اكتب أي جملة باللغة العربية وسيتعرف النظام آلياً على النوع، المبلغ، والتاريخ</span>',null;const h=_.parse(f);return h&&h.chips&&h.chips.length>0?(p.innerHTML=h.chips.map(se=>`
        <span class="badge ${se.color||"accent"} xs">
          ${se.label}
        </span>
      `).join(""),h):(p.innerHTML='<span class="badge ok xs">مهمة عمل ✔️</span>',h)};d.addEventListener("input",u);const v=async()=>{const f=d.value.trim();if(!f)return;const h=_.parse(f);await _.execute(h),d.value="",u(),ke(t)};l.addEventListener("click",v),d.addEventListener("keydown",f=>{f.key==="Enter"&&v()});const m=window.LF;if(m&&m.dashboard&&typeof m.dashboard.render=="function"){const f=document.createElement("div");f.id="legacy-dashboard-widgets",f.style.marginTop="var(--sp-4)",t.appendChild(f);try{await m.dashboard.render(f)}catch(h){console.warn("[LifeFlow] Legacy widgets warning on dashboard:",h)}}}let K=0;async function E(t,e=[]){t||(t="dashboard"),t==="budgets"&&(t="budget"),t==="root"&&(t="dashboard"),Y=t;const i=`#view=${t}`;if(window.location.hash!==i&&window.location.hash!==`#/app/${t}`&&window.location.hash!==`#app/${t}`&&window.location.hash!==`#${t}`)try{history.pushState(null,"",i)}catch{window.location.hash=i}document.querySelectorAll(".nav-tab[data-view]").forEach(a=>{a.getAttribute("data-view")===t?a.classList.add("active"):a.classList.remove("active")}),z&&(typeof z.setActive=="function"?z.setActive(t):typeof z.update=="function"&&z.update(t));const s=document.getElementById("view-container");if(!s){console.warn("[LifeFlow Router] #view-container not found in DOM");return}s.style.display="block",s.innerHTML='<div class="center" style="padding:60px 20px;"><span class="muted">جارٍ تحميل القسم...</span></div>';const o=++K;try{switch(t){case"dashboard":await ke(s);break;case"health":await be.render(s);break;case"routines":await he.render(s);break;case"focus":await Pe.render(s);break;case"vault":await re.render(s);break;case"inbox":await Xe.render(s);break;case"analytics":await Ee.render(s);break;case"login":await et.render(s,E);break;case"myday":case"tasks":case"projects":case"calendar":case"expenses":case"income":case"budget":case"debts":case"habits":case"goals":case"study":case"work":case"home":case"shopping":case"notes":case"reminders":case"reports":case"search":case"contacts":case"settings":default:await Ae(t,s,e);break}if(o!==K)return;window.scrollTo({top:0,behavior:"instant"})}catch(a){if(o!==K)return;console.error(`[LifeFlow Router] Render view error for "${t}":`,a),s.innerHTML=`
      <div class="card danger center" style="padding:32px;margin:24px auto;max-width:560px;">
        <h4 style="margin-bottom:8px;">تعذر عرض قسم "${t}"</h4>
        <p class="muted xs" style="margin-bottom:16px;">${a.message||"حدث خطأ في تحميل بيانات القسم"}</p>
        <button class="btn secondary sm" id="retry-view-btn">إعادة المحاولة 🔄</button>
      </div>
    `;const r=s.querySelector("#retry-view-btn");r&&r.addEventListener("click",()=>E(t,e))}}function at(t){if(!t||t==="#"||t==="#/")return{viewId:"dashboard",params:[]};const e=t.replace(/^#\/?/,"");if(e.startsWith("view=")){const o=e.slice(5).split("/").filter(Boolean);return{viewId:o[0]||"dashboard",params:o.slice(1)}}if(e.startsWith("app/")){const o=e.slice(4).split("/").filter(Boolean);return{viewId:o[0]||"dashboard",params:o.slice(1)}}const i=e.split("/").filter(Boolean);return{viewId:i[0]||"dashboard",params:i.slice(1)}}function ne(){const{viewId:t,params:e}=at(window.location.hash);E(t,e)}async function it(){const t=document.getElementById("app");if(!t)return;t.innerHTML=`
    <div class="app-container">
      <!-- Topbar Header -->
      <header class="topbar">
        <div class="brand-wrapper">
          <div class="logo-badge" style="cursor:pointer;" id="brand-home-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div style="cursor:pointer;" id="brand-title-btn">
            <h1 class="brand-title">LifeFlow</h1>
            <div class="brand-sub">نظام إدارة الحياة الشخصية • متوافق مع الجوال 100%</div>
          </div>
        </div>

        <!-- Topbar Controls (Search Icon + Sync Indicator + Bell + Install) -->
        <div class="row" id="topbar-controls">
          <!-- Mobile & Desktop Command Palette Trigger -->
          <button id="lf-search-btn" class="btn ghost sm" aria-label="البحث والأوامر" title="بحث سريع (Ctrl+K)" style="padding:7px 10px;border-radius:var(--radius-s);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>

          <!-- Account & Login Button -->
          <button id="lf-account-btn" class="btn ghost sm" aria-label="تسجيل الدخول وإدارة الحساب" title="تسجيل الدخول وإدارة الحساب" style="padding:6px 10px;border-radius:var(--radius-s);gap:6px;">
            <span id="lf-account-icon">👤</span>
            <span id="lf-account-name" class="hide-xs" style="font-size:var(--fs-xs);font-weight:600;">تسجيل الدخول</span>
          </button>

          <!-- PWA Install Button (Always visible on mobile/browser unless standalone) -->
          <button id="pwa-install-btn" class="btn primary sm" aria-label="تثبيت التطبيق" title="تثبيت التطبيق على جهازك" style="display:none;gap:6px;padding:6px 12px;font-size:var(--fs-xs);font-weight:700;border-radius:var(--radius-s);background:linear-gradient(135deg, #0d9488, #0f766e);box-shadow:0 2px 8px rgba(13,148,136,0.3);color:#fff;cursor:pointer;">
            <span>📲</span>
            <span class="install-label">تثبيت التطبيق</span>
          </button>
        </div>
      </header>

      <!-- Desktop Horizontal Navigation Bar (Hidden on Mobile) -->
      <nav class="nav-bar" id="app-nav-bar" role="navigation" style="overflow-x:auto;white-space:nowrap;padding:4px 8px;">
        ${tt.slice(0,12).map(n=>`
          <button class="nav-tab ${n.id===Y?"active":""}" data-view="${n.id}">
            <span>${n.icon}</span>
            <span>${n.name}</span>
          </button>
        `).join("")}
        <button class="nav-tab" id="btn-desktop-all-apps" style="background:var(--accent-soft);color:var(--accent);font-weight:700;">
          <span>🗂️</span>
          <span>كل الأقسام الـ 23 ▾</span>
        </button>
      </nav>

      <!-- Dynamic View Container -->
      <main id="view-container">
        <!-- Rendered by Router -->
      </main>
    </div>
  `,window.renderActiveRoute=()=>E(Y),await $e();const e=document.getElementById("topbar-controls");De.mount(e),document.getElementById("lf-search-btn").addEventListener("click",J.open);const i=document.getElementById("brand-home-btn");i&&i.addEventListener("click",()=>E("dashboard"));const s=document.getElementById("brand-title-btn");s&&s.addEventListener("click",()=>E("dashboard"));const o=document.getElementById("lf-account-btn");o&&(o.addEventListener("click",()=>E("login")),k.onChange(({user:n,signedIn:d})=>{const p=document.getElementById("lf-account-name"),l=document.getElementById("lf-account-icon");p&&l&&(d&&n?(p.textContent=n.name?n.name.split(" ")[0]:"حسابي",l.textContent="🟢"):(p.textContent="تسجيل الدخول",l.textContent="👤"))})),z.mount(n=>{E(n)}),J.init(),await g.open(),await Le(),k.init(),b.init(),S.startWatcher(),document.querySelectorAll(".nav-tab[data-view]").forEach(n=>{n.addEventListener("click",()=>{const d=n.getAttribute("data-view");d&&E(d)})});const a=document.getElementById("btn-desktop-all-apps");a&&a.addEventListener("click",()=>{z.openMoreDrawer()});const r=document.getElementById("pwa-install-btn");r&&(H()?r.style.display="none":r.style.display="inline-flex",r.addEventListener("click",()=>{R()})),Te({onStateChange:n=>{r&&(n==="standalone"?r.style.display="none":r.style.display="inline-flex")}}),Be(),window.addEventListener("hashchange",ne),ne()}st();document.addEventListener("DOMContentLoaded",it);
