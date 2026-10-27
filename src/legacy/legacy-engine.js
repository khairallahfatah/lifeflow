/* ===== js/util.js ===== */
/* ============================================================
   LifeFlow — Utilities (DOM-free at load; testable in Node)
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};

  const U = {
    /* ---------- HTML escaping (defense-in-depth; app never injects
       user data as HTML, this is used by the few trusted-icon paths) ---------- */
    esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    /* ---------- ids ---------- */
    uid() {
      try {
        if (root.crypto && typeof root.crypto.randomUUID === 'function') {
          return root.crypto.randomUUID();
        }
      } catch (e) { /* fall through */ }
      return 'id-' + Date.now().toString(36) + '-' +
        Math.random().toString(36).slice(2, 10) +
        Math.random().toString(36).slice(2, 6);
    },

    /* ---------- localStorage safe wrapper (throws in sandboxed iframes) ---------- */
    ls: {
      _ok: null,
      _check() {
        if (U.ls._ok === null) {
          try {
            const k = '__lf_t__';
            root.localStorage.setItem(k, '1');
            root.localStorage.removeItem(k);
            U.ls._ok = true;
          } catch (e) { U.ls._ok = false; }
        }
        return U.ls._ok;
      },
      get(key, fallback) {
        const fb = fallback === undefined ? null : fallback;
        if (!U.ls._check()) return fb;
        try {
          const v = root.localStorage.getItem(key);
          if (v == null) return fb;
          const parsed = JSON.parse(v);
          return parsed == null ? fb : parsed;
        } catch (e) { return fb; }
      },
      set(key, val) {
        if (!U.ls._check()) return false;
        try { root.localStorage.setItem(key, JSON.stringify(val)); return true; }
        catch (e) { return false; }
      },
      remove(key) {
        if (!U.ls._check()) return false;
        try { root.localStorage.removeItem(key); return true; }
        catch (e) { return false; }
      },
    },

    /* ---------- misc ---------- */
    clone(obj) {
      if (obj == null) return obj;
      try { return structuredClone(obj); }
      catch (e) { return JSON.parse(JSON.stringify(obj)); }
    },
    debounce(fn, ms) {
      let t = null;
      return function () {
        const args = arguments, self = this;
        clearTimeout(t);
        t = setTimeout(function () { fn.apply(self, args); }, ms);
      };
    },
    clamp(n, a, b) { return Math.max(a, Math.min(b, n)); },
    hashPick(str, arr) {
      let h = 0;
      const s = String(str);
      for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
      return arr[Math.abs(h) % arr.length];
    },
    pad2(n) { return (n < 10 ? '0' : '') + n; },

    /* ---------- digits ---------- */
    AR_DIGITS: '٠١٢٣٤٥٦٧٨٩',
    FA_DIGITS: '۰۱۲۳۴۵۶۷۸۹',
    normalizeDigits(s) {
      let out = String(s);
      for (let i = 0; i < 10; i++) {
        out = out.split(U.AR_DIGITS[i]).join(String(i))
          .split(U.FA_DIGITS[i]).join(String(i));
      }
      return out;
    },

    /* ---------- dates (local-time; Y-M-D strings are the canonical date format) ---------- */
    ymd(d) {
      return d.getFullYear() + '-' + U.pad2(d.getMonth() + 1) + '-' + U.pad2(d.getDate());
    },
    todayYmd() { return U.ymd(new Date()); },
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
    startOfWeek(d, weekStart) {
      const x = new Date(d.getTime());
      x.setHours(0, 0, 0, 0);
      const diff = (x.getDay() - weekStart + 7) % 7;
      x.setDate(x.getDate() - diff);
      return x;
    },
    isSameDay(a, b) {
      return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    },

    /* ---------- UTF-8 + SHA-256 (pure JS fallback for non-secure contexts) ---------- */
    utf8Bytes(str) {
      if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
      const out = [];
      for (let i = 0; i < str.length; i++) {
        const c = str.codePointAt(i);
        if (c > 0xffff) i++;
        if (c < 0x80) out.push(c);
        else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
        else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
        else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      }
      return new Uint8Array(out);
    },

    _SHA_K: [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ],

    sha256(str) {
      const bytes = U.utf8Bytes(str);
      const l = bytes.length;
      const bitLenHi = Math.floor(l / 0x20000000);
      const bitLenLo = (l << 3) >>> 0;
      const total = ((l + 9 + 63) >> 6) << 6;
      const buf = new Uint8Array(total);
      buf.set(bytes);
      buf[l] = 0x80;
      const dv = new DataView(buf.buffer);
      dv.setUint32(total - 8, bitLenHi);
      dv.setUint32(total - 4, bitLenLo);

      let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
        h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
      const w = new Int32Array(64);
      const K = U._SHA_K;

      for (let off = 0; off < total; off += 64) {
        for (let i = 0; i < 16; i++) w[i] = dv.getInt32(off + i * 4);
        for (let i = 16; i < 64; i++) {
          const a = w[i - 15], b = w[i - 2];
          const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
          const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
          w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }
        let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
        for (let i = 0; i < 64; i++) {
          const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
          const ch = (e & f) ^ (~e & g);
          const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
          const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
          const maj = (a & b) ^ (a & c) ^ (b & c);
          const t2 = (S0 + maj) | 0;
          h = g; g = f; f = e; e = (d + t1) | 0;
          d = c; c = b; b = a; a = (t1 + t2) | 0;
        }
        h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
        h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
      }
      return [h0, h1, h2, h3, h4, h5, h6, h7]
        .map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
    },
  };

  LF.util = U;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/money.js ===== */
/* ============================================================
   LifeFlow — Money (integer minor units; NO floating point math)
   All amounts are stored as integers in the currency's smallest
   unit (e.g. cents). Parsing/formatting only at the edges.
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const U = LF.util;

  /* code: [name_ar, name_en, decimals] */
  const CURRENCIES = {
    YER: ['ريال يمني', 'Yemeni Rial', 2],
    SAR: ['ريال سعودي', 'Saudi Riyal', 2],
    AED: ['درهم إماراتي', 'UAE Dirham', 2],
    QAR: ['ريال قطري', 'Qatari Riyal', 2],
    KWD: ['دينار كويتي', 'Kuwaiti Dinar', 3],
    BHD: ['دينار بحريني', 'Bahraini Dinar', 3],
    OMR: ['ريال عماني', 'Omani Rial', 3],
    JOD: ['دينار أردني', 'Jordanian Dinar', 3],
    EGP: ['جنيه مصري', 'Egyptian Pound', 2],
    SDG: ['جنيه سوداني', 'Sudanese Pound', 2],
    SOS: ['شلن صومالي', 'Somali Shilling', 2],
    DJF: ['فرنك جيبوتي', 'Djiboutian Franc', 0],
    IQD: ['دينار عراقي', 'Iraqi Dinar', 3],
    SYP: ['ليرة سورية', 'Syrian Pound', 2],
    LBP: ['ليرة لبنانية', 'Lebanese Pound', 2],
    LYD: ['دينار ليبي', 'Libyan Dinar', 3],
    TND: ['دينار تونسي', 'Tunisian Dinar', 3],
    DZD: ['دينار جزائري', 'Algerian Dinar', 2],
    MAD: ['درهم مغربي', 'Moroccan Dirham', 2],
    MRU: ['أوقية موريتانية', 'Mauritanian Ouguiya', 2],
    USD: ['دولار أمريكي', 'US Dollar', 2],
    EUR: ['يورو', 'Euro', 2],
    GBP: ['جنيه إسترليني', 'British Pound', 2],
    TRY: ['ليرة تركية', 'Turkish Lira', 2],
    CHF: ['فرنك سويسري', 'Swiss Franc', 2],
    SEK: ['كرونة سويدية', 'Swedish Krona', 2],
    NOK: ['كرونة نرويجية', 'Norwegian Krone', 2],
    CNY: ['يوان صيني', 'Chinese Yuan', 2],
    INR: ['روبية هندية', 'Indian Rupee', 2],
    PKR: ['روبية باكستانية', 'Pakistani Rupee', 2],
    JPY: ['ين ياباني', 'Japanese Yen', 0],
  };

  function decimalsOf(code) {
    const c = CURRENCIES[code];
    return c ? c[2] : 2;
  }

  function nameOf(code, lang) {
    const c = CURRENCIES[code];
    if (!c) return code;
    return lang === 'ar' ? c[0] : c[1];
  }

  function list(lang) {
    return Object.keys(CURRENCIES).map(code => ({
      code,
      name: nameOf(code, lang),
      decimals: CURRENCIES[code][2],
    }));
  }

  /**
   * Parse a user-entered amount into integer minor units.
   * Handles: Arabic-Indic digits, Arabic decimal (٫) and thousands (٬)
   * separators, "," and "." with a thousands heuristic (a separator
   * followed by exactly 3 digits when the currency uses <3 decimals).
   * Negative values are rejected (amounts are positive; direction is
   * expressed by the record type).
   * @returns {{ok:true, value:number}|{ok:false, error:'empty'|'invalid'|'negative'|'precision'}}
   */
  function parse(input, decimals) {
    let s = U.normalizeDigits(String(input == null ? '' : input)).trim();
    s = s.replace(/٫/g, '.');                 // arabic decimal separator -> '.'
    s = s.replace(/[\s\u00a0\u060c_]/g, '');  // spaces, arabic comma, underscores
    s = s.replace(/[^0-9.,\-]/g, '');         // drop currency symbols / letters
    if (s === '' || s === '-' || s === '.' || s === ',') return { ok: false, error: 'empty' };
    if (s.indexOf('-') !== -1) return { ok: false, error: 'negative' };
    if (!/[0-9]/.test(s)) return { ok: false, error: 'invalid' };

    const seps = (s.match(/[.,]/g) || []).length;
    let intPart, fracPart;

    if (seps === 0) {
      intPart = s; fracPart = '';
    } else if (seps >= 2) {
      // "1,234,567" / "1.234.567" -> thousands grouping (when not 3-dec currency)
      const groups = s.split(/[.,]/);
      const allSame = s.indexOf('.') === -1 || s.indexOf(',') === -1;
      const every3 = groups.every((g, i) =>
        i === 0 ? /^[0-9]{1,3}$/.test(g) : /^[0-9]{3}$/.test(g));
      if (allSame && every3 && decimals < 3) {
        intPart = groups.join(''); fracPart = '';
      } else {
        // mixed e.g. "1,234.50": last separator is the decimal point
        const last = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
        const rawInt = s.slice(0, last);
        const rawFrac = s.slice(last + 1);
        // separators inside the integer part must be valid thousands groups
        if (/[.,]/.test(rawInt)) {
          const ig = rawInt.split(/[.,]/);
          const valid = ig.every((g, i) =>
            i === 0 ? /^[0-9]{1,3}$/.test(g) : /^[0-9]{3}$/.test(g));
          if (!valid) return { ok: false, error: 'invalid' };
        }
        if (/[.,]/.test(rawFrac)) return { ok: false, error: 'invalid' };
        intPart = rawInt.replace(/[.,]/g, '');
        fracPart = rawFrac;
        if (fracPart.length > decimals) return { ok: false, error: 'precision' };
      }
    } else { // seps === 1
      const pos = Math.max(s.indexOf('.'), s.indexOf(','));
      const trailing = s.slice(pos + 1);
      intPart = s.slice(0, pos);
      fracPart = trailing;
      // single separator + exactly 3 trailing digits + currency <3 decimals -> thousands
      if (trailing.length === 3 && decimals < 3 && intPart !== '') {
        intPart = intPart + trailing; fracPart = '';
      } else if (fracPart.length > decimals) {
        return { ok: false, error: 'precision' };
      }
    }

    if (intPart === '') intPart = '0';
    if (!/^[0-9]+$/.test(intPart)) return { ok: false, error: 'invalid' };
    if (intPart.length > 15) return { ok: false, error: 'invalid' };

    const fracPadded = fracPart === '' ? ''.padEnd(decimals, '0') : fracPart.padEnd(decimals, '0');
    const value = Number(intPart) * Math.pow(10, decimals) + Number(fracPadded === '' ? '0' : fracPadded);
    if (!Number.isSafeInteger(value)) return { ok: false, error: 'invalid' };
    return { ok: true, value };
  }

  /** Format integer minor units as a localized currency string. */
  function format(minor, opts) {
    opts = opts || {};
    const code = opts.currency || 'YER';
    const lang = opts.lang || 'ar';
    const numerals = opts.numerals === 'arab' ? 'arab' : 'latn';
    const dec = decimalsOf(code);
    const locale = (lang === 'ar' ? 'ar' : 'en') + '-u-nu-' + numerals;
    try {
      const nf = new Intl.NumberFormat(locale, {
        style: 'currency', currency: code,
        minimumFractionDigits: dec, maximumFractionDigits: dec,
      });
      return nf.format(minor / Math.pow(10, dec));
    } catch (e) {
      const sym = code;
      return sym + ' ' + (minor / Math.pow(10, dec)).toFixed(dec);
    }
  }

  LF.money = {
    CURRENCIES,
    decimals: decimalsOf,
    nameOf,
    list,
    parse,
    format,
    add: (a, b) => (a | 0) + (b | 0),
    sub: (a, b) => (a | 0) - (b | 0),
    pct(part, total) {
      if (!total) return null;
      return Math.round((part / total) * 100);
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/i18n.js ===== */
/* ============================================================
   LifeFlow — Localization (Arabic RTL / English LTR)
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};

  const ar = {
    common: {
      appName: 'LifeFlow',
      tagline: 'نظام إدارة حياتك الشخصية',
      save: 'حفظ', saved: 'تم الحفظ', cancel: 'إلغاء', close: 'إغلاق',
      back: 'رجوع', next: 'التالي', confirm: 'تأكيد',
      search: 'بحث', loading: 'جارٍ التحميل…', ok: 'حسنًا',
      name: 'الاسم', currency: 'العملة', language: 'اللغة',
      add: 'إضافة', del: 'حذف', rename: 'إعادة تسمية', active: 'نشط',
      remove: 'إزالة', edit: 'تعديل',
      phase: 'المرحلة {n}', today: 'اليوم', optional: 'اختياري',
      yesDelete: 'نعم، احذف',
    },
    app: {
      offline: 'غير متصل',
      localMode: 'محلي',
      previewShort: 'وضع معاينة',
      previewMode: 'أنت في وضع المعاينة داخل بيئة معزولة: التخزين الدائم غير متاح هنا، لذا لن تُحفظ البيانات بعد الإغلاق. افتح التطبيق من الرابط المباشر أو نزّله ليعمل بالحفظ الكامل.',
      updateReady: 'تحديث جديد جاهز — أعد التحميل للحصول عليه',
      updateNow: 'تحديث',
      installApp: 'تثبيت التطبيق',
      installed: 'تم تثبيت التطبيق بنجاح 🎉',
      toggleTheme: 'تبديل المظهر',
      themeSet: 'المظهر: {theme}',
      errorGeneric: 'حدث خطأ غير متوقع، حاول مرة أخرى',
      routeError: 'حدث خطأ في تحميل الصفحة',
    },
    auth: {
      chooseAccount: 'من حسابك؟',
      signInAs: 'تسجيل الدخول',
      signIn: 'دخول',
      newAccount: 'إنشاء حساب جديد',
      heroSub: 'نظام واحد لتنظيم وقتك، مهامك، مصروفاتك، أهدافك وحياتك اليومية',
      localNote: 'بياناتك محفوظة على جهازك فقط — لا تغادر جهازك أبدًا',
      namePlaceholder: 'اسمك الكامل',
      username: 'المعرّف (username)',
      usernameHint: 'أحرف إنجليزية صغيرة وأرقام (3-20)',
      password: 'كلمة المرور',
      passwordHint: '6 أحرف على الأقل',
      confirmPassword: 'تأكيد كلمة المرور',
      showPassword: 'إظهار / إخفاء كلمة المرور',
      createAccount: 'إنشاء الحساب والبدء',
      oldPassword: 'كلمة المرور الحالية',
      newPassword: 'كلمة المرور الجديدة',
      errName: 'الاسم يجب أن يكون بين حرفين و40 حرفًا',
      errUsername: 'المعرّف: أحرف إنجليزية صغيرة/أرقام/نقطة/شرطة (3-20)',
      errUsernameTaken: 'هذا المعرّف مستخدم بالفعل',
      errPassword: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      errCredentials: 'بيانات الدخول غير صحيحة',
      errOldPassword: 'كلمة المرور الحالية غير صحيحة',
      errMismatch: 'كلمتا المرور غير متطابقتين',
      locked: 'محاولات كثيرة خاطئة — انتظر {sec} ثانية',
      loggedOut: 'تم تسجيل الخروج',
      logout: 'تسجيل الخروج',
    },
    onboarding: {
      welcomeTitle: 'أهلًا {name} 👋',
      welcomeSub: 'لنجهّز LifeFlow على مقاسك — دقيقة واحدة فقط',
      langHint: 'يمكنك تغيير اللغة والمظهر وكل الإعدادات لاحقًا في أي وقت',
      usageTitle: 'كيف ستستخدم LifeFlow؟',
      usageSub: 'اختر ما يناسبك — يمكنك اختيار أكثر من فئة',
      usage_student: 'طالب/طالبة',
      usage_employee: 'موظف/موظفة',
      usage_business: 'صاحب عمل/مشاريع',
      usage_home: 'إدارة المنزل',
      usage_personal: 'استخدام شخصي',
      pickUsage: 'اختر فئة واحدة على الأقل',
      currencyTitle: 'ما عملتك؟',
      currencySub: 'تُستخدم في كل المصروفات والميزانيات والديون',
      prefsTitle: 'تفضيلات العرض',
      prefsSub: 'بداية الأسبوع، تنسيق الوقت، ونظام الأرقام',
      weekStart: 'بداية الأسبوع',
      tf24: '24 ساعة',
      tf12: '12 ساعة (ص/م)',
      numerals: 'نظام الأرقام',
      featuresTitle: 'الميزات',
      featuresSub: 'فعّل ما تحتاجه الآن — يمكنك تشغيل الباقي لاحقًا من الإعدادات',
      feat_budget: 'الميزانية',
      featDesc_budget: 'حدود إنفاق يومية/أسبوعية/شهرية مع تنبيهات',
      feat_habits: 'العادات',
      featDesc_habits: 'متابعة الالتزام اليومي وسلاسل الاستمرار',
      feat_study: 'الدراسة',
      featDesc_study: 'المواد، الواجبات، الاختبارات، جلسات المذاكرة',
      feat_work: 'العمل',
      featDesc_work: 'مهام العمل، الاجتماعات، ساعات العمل',
      feat_home: 'إدارة المنزل',
      featDesc_home: 'مهام المنزل المتكررة، الفواتير، الصيانة',
      timeFormat: 'تنسيق الوقت',
      readyTitle: 'كل شيء جاهز!',
      readySub: 'هذه ملخص إعداداتك:',
      changeLater: 'يمكنك تعديل كل هذا لاحقًا من الإعدادات.',
      startNow: 'ابدأ رحلتك',
      stepOf: 'خطوة {n} من {total}',
      welcomeDone: 'أهلًا بك في LifeFlow! 🎉',
    },
    ws: {
      personal: 'شخصي', university: 'الجامعة', work: 'العمل',
      business: 'الأعمال', home: 'المنزل',
    },
    nav: {
      main: 'الرئيسية',
      dashboard: 'لوحة التحكم', myday: 'يومي', tasks: 'المهام',
      projects: 'المشاريع', calendar: 'التقويم', expenses: 'المصروفات',
      income: 'الدخل', budget: 'الميزانية', debts: 'الديون',
      contacts: 'الأشخاص', shopping: 'المشتريات', home: 'المنزل',
      study: 'الدراسة', work: 'العمل', habits: 'العادات',
      goals: 'الأهداف', notes: 'الملاحظات', reminders: 'التذكيرات',
      analytics: 'التحليلات', reports: 'التقارير', settings: 'الإعدادات',
      soon: 'قريبًا — المراحل القادمة',
    },
    notifications: {
      title: 'الإشعارات',
      empty: 'لا توجد إشعارات بعد',
      new: 'جديد',
    },
    dashboard: {
      gMorning: 'صباح الخير', gNoon: 'نهارك سعيد', gEvening: 'مساء الخير', gNight: 'ليلة هانئة',
      todayLine: 'اليوم: {tasks} مهام · {events} مواعيد · مصروف {spent}',
      noDataYet: 'ستظهر ملخصاتك هنا تلقائيًا فور إضافة مهامك ومواعيدك ومصروفاتك — أضف أول بياناتك في المراحل القادمة القريبة.',
      kTasks: 'مهام اليوم', kDone: 'المكتمل', kEvents: 'مواعيد اليوم',
      kSpent: 'مصروف اليوم', kDueDebts: 'ديون مستحقة', kCompletion: 'نسبة الإنجاز',
      wSummary: 'ملخص اليوم', wStart: 'البداية', wQuick: 'إجراءات سريعة',
      wRoadmap: 'خطة الطريق',
      gsAccount: 'أنشأت حسابك بنجاح',
      gsOnboard: 'أكملت التهيئة الأولى',
      gsCurrency: 'حددت عملتك ({c})',
      gsInstall: 'ثبّت التطبيق على جهازك',
      gsFirstTask: 'أضف أول مهمة',
      gsProgress: '{done} من {total}',
      qaCustomize: 'تخصيص اللوحة',
      qaTheme: 'تبديل المظهر',
      qaBackup: 'نسخة احتياطية',
      wTodayTasks: 'مهام اليوم',
      wFinance: 'المال هذا الشهر',
      wShopping: 'قائمة المشتريات',
      wHome: 'المنزل اليوم',
      wStudy: 'الدراسة',
      wWork: 'العمل',
      wHabits: 'عادات اليوم',
      wGoals: 'الأهداف النشطة',
      allDone: 'أنجزت كل مهام اليوم 🎉',
      noTasksToday: 'لا مهام لهذا اليوم',
      noTasksTodayHint: 'أضف أول مهمة وابدأ إنجاز يومك',
      andMore: 'و{n} مهام أخرى…',
      viewAllTasks: 'عرض كل المهام',
    },
    widgets: { moveUp: 'أعلى', moveDown: 'أسفل' },
    roadmap: {
      done: 'مكتملة',
      p1: 'البنية الأساسية، الحسابات، المظهر، التعريب، PWA، اللوحة',
      p2: 'المهام، المشاريع، التقويم، يومي',
      p3: 'المصروفات، الدخل، الميزانية',
      p4: 'الديون، الدفعات، الأشخاص',
      p5: 'المشتريات، إدارة المنزل',
      p6: 'الدراسة، العمل',
      p7: 'العادات، الأهداف، الملاحظات، التذكيرات',
      p8: 'التحليلات، التقارير، التصدير',
      p9: 'العمل بدون إنترنت، المزامنة، الإشعارات، صقل PWA',
      p10: 'الأمان، الوصولية، الأداء، الفحص النهائي',
    },
    settings: {
      sub: 'ملفك الشخصي، تفضيلاتك، وبياناتك',
      secProfile: 'الملف الشخصي',
      secPrefs: 'التفضيلات',
      secFeatures: 'الميزات الاختيارية',
      featuresSub: 'فعّل ما تحتاجه فقط — الميزات المعطلة تُخفى من كل الواجهة',
      featBudgetHint: 'حدود إنفاق يومية أو شهرية مع تنبيهات الاقتراب من الحد',
      featHomeHint: 'مهام المنزل المتكررة: تنظيف وطبخ وفواتير',
      featStudyHint: 'مواد واختبارات وواجبات وجلسات دراسة',
      featWorkHint: 'مهام العمل والاجتماعات وساعات العمل والعملاء',
      featHabitsHint: 'تتبع يومي بسنِ وسلاسل التزام',
      secDashboard: 'لوحة التحكم',
      secWorkspaces: 'مساحات العمل',
      secData: 'البيانات',
      secAccount: 'الحساب',
      avatarColor: 'لون الصورة الرمزية',
      themeOption: 'المظهر',
      theme_system: 'تلقائي (النظام)', theme_light: 'فاتح', theme_dark: 'داكن',
      accent: 'لون التمييز',
      acc_teal: 'أزرق مخضر', acc_indigo: 'بنفسجي', acc_rose: 'وردي',
      acc_emerald: 'أخضر زمردي', acc_amber: 'كهرماني',
      timeFormat: 'تنسيق الوقت',
      timezone: 'المنطقة الزمنية',
      tzAuto: 'تلقائي',
      dashDesc: 'اختر ما يظهر في لوحة التحكم ورتب الأدوات كما يناسبك.',
      wsDesc: 'مساحات لتنظيم حياتك: شخصي، عمل، دراسة، منزل… (تُفعّل بالكامل في المراحل القادمة)',
      wsAdd: 'مساحة جديدة',
      wsNamePlaceholder: 'اسم المساحة',
      wsNameRequired: 'الاسم مطلوب',
      wsDelete: 'حذف المساحة',
      wsDeleteConfirm: 'سيتم حذف "{name}" نهائيًا. هل أنت متأكد؟',
      wsLastOne: 'لا يمكن حذف المساحة الوحيدة المتبقية',
      exportDesc: 'نزّل نسخة احتياطية كاملة من بياناتك بصيغة JSON. احتفظ بها في مكان آمن — فهي تحتوي بياناتك المالية.',
      exportBtn: 'تصدير نسخة احتياطية',
      exportDone: 'تم تنزيل النسخة الاحتياطية: {f}',
      restoreTitle: 'استعادة نسخة احتياطية',
      restoreDesc: 'استيراد ملف نسخة احتياطية (JSON) — يستبدل بيانات حسابك الحالي بالكامل.',
      restoreBtn: 'استعادة من ملف…',
      restoreInvalid: 'ملف غير صالح — تأكد أنه نسخة احتياطية من LifeFlow.',
      restoreConflict: 'لا يمكن الاستعادة: الملف يحتوي سجلات تخص حسابًا آخر على هذا الجهاز. استعده في نفس الحساب الأصلي، أو على جهاز/رابط آخر. لم يتغير شيء.',
      restoreConfirm: 'الملف يحتوي {n} سجلًا (تصدير {when} — {who}). سيتم استبدال كل بياناتك الحالية بهذا المحتوى. هل أنت متأكد؟',
      restoreGo: 'استبدال بياناتي',
      restoreDone: 'استُعيد {n} سجلًا — سيُعاد تحميل التطبيق…',
      encryptedBackup: 'نسخة احتياطية مشفّرة',
      encryptBackup: 'تشفير النسخة الاحتياطية',
      backupPassword: 'كلمة مرور النسخة الاحتياطية',
      backupPasswordHint: 'استخدم كلمة مرور قوية. لا تُحفظ كلمة المرور داخل LifeFlow.',
      passwordRequired: 'أدخل كلمة مرور للنسخة الاحتياطية.',
      passwordTooShort: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.',
      decryptFailed: 'تعذر فك تشفير النسخة. تحقق من كلمة المرور والملف.',
      driveTitle: 'Google Drive',
      driveDesc: 'احفظ نسخة احتياطية مشفّرة في مجلد بيانات التطبيق الخاص بك في Google Drive. لا تُستخدم السحابة كتخزين رئيسي.',
      driveClientId: 'Google OAuth Client ID',
      driveClientIdHint: 'اختياري. أنشئ OAuth Client من Google Cloud ثم ضع Client ID هنا.',
      driveSaveClient: 'حفظ Client ID',
      driveConnect: 'الاتصال بـ Google Drive',
      driveBackup: 'رفع نسخة إلى Google Drive',
      driveRestore: 'استعادة أحدث نسخة من Google Drive',
      driveConnected: 'متصل بهذه الجلسة',
      driveNeedClient: 'أدخل Google OAuth Client ID أولًا.',
      driveSaved: 'تم حفظ إعداد Google Drive على هذا الجهاز.',
      driveUploaded: 'تم رفع النسخة الاحتياطية المشفّرة إلى Google Drive.',
      driveRestored: 'تم تنزيل النسخة من Google Drive. ستظهر شاشة الاستعادة الآن.',
      driveNone: 'لا توجد نسخة LifeFlow في Google Drive.',
      driveAutoOn:'النسخ الاحتياطي التلقائي مفعّل ✓', driveAutoOff:'النسخ الاحتياطي التلقائي غير مفعّل', driveEnableAuto:'تشغيل النسخ الاحتياطي التلقائي', driveAutoRestore:'استعادة النسخة التلقائية', driveAutoLast:'آخر نسخة تلقائية:',
      secNotifs: 'الإشعارات',
      notifDesc: 'إشعارات النظام تُستخدم للتذكيرات فقط — إشعارات التطبيق الداخلية (الجرس والتنبيهات) تعمل دائمًا بلا إذن.',
      notifStateLabel: 'حالة إذن النظام:',
      notifGranted: 'مفعّل',
      notifDenied: 'محجوب',
      notifDefault: 'غير مطلوب بعد',
      notifUnsupported: 'متصفحك لا يدعم إشعارات النظام — إشعارات التطبيق الداخلية تعمل دائمًا.',
      notifEnable: 'تفعيل إشعارات النظام',
      notifTest: 'إشعار تجريبي',
      notifTestTitle: 'LifeFlow',
      notifTestBody: 'الإشعارات تعمل ✓',
      notifHint: 'تصلك التنبيهات أثناء فتح التطبيق فقط (لا يوجد خادم للإرسال في الخلفية). يمكن سحب الإذن من إعدادات الموقع في أي وقت.',
      notifDeniedHint: 'الإذن محجوب — فعّله من إعدادات الموقع في المتصفح حتى تصل إشعارات التذكيرات.',
      secApp: 'التطبيق',
      version: 'الإصدار:',
      checkUpdate: 'التحقق من التحديثات',
      updChecked: 'تم التحقق — أنت على أحدث إصدار',
      installBtn: 'تثبيت التطبيق',
      runningInstalled: 'يعمل كتطبيق مثبَّت ✓',
      installHint: 'ثبّت التطبيق من قائمة المتصفح (تثبيت / إضافة إلى الشاشة الرئيسية) لاستخدامه كتطبيق مستقل.',
      iosHint: 'على آيفون: زر المشاركة ⬆︎ ثم «إضافة إلى الشاشة الرئيسية».',
      offlineReady: 'العمل بلا إنترنت:',
      swActive: 'جاهز ✓',
      swInactive: 'غير مفعّل (يتطلب HTTPS أو localhost)',
      accountDesc: 'كلمة المرور تُستخدم لفتح حسابك على هذا الجهاز.',
      changePassword: 'تغيير كلمة المرور',
      pwChanged: 'تم تغيير كلمة المرور بنجاح',
      dangerZone: 'منطقة الخطر',
      deleteDesc: 'حذف حسابك وكل بياناتك من هذا الجهاز نهائيًا. لا يمكن التراجع.',
      deleteAccount: 'حذف الحساب نهائيًا',
      deleteWarn: 'سيتم حذف جميع بياناتك: الإعدادات، المهام، المصروفات، الديون وكل شيء — نهائيًا وبدون استعادة.',
      deleteConfirmName: 'اكتب "{name}" للتأكيد',
      errConfirmName: 'الاسم المكتوب غير مطابق',
      accountDeleted: 'تم حذف الحساب وكل البيانات',
      account: 'الحساب',
    },
    tasks: {
      sub: '{n} مهمة',
      showMore: 'عرض {n} مهمة إضافية…',
      new: 'مهمة جديدة',
      edit: 'تعديل المهمة',
      title: 'العنوان',
      desc: 'الوصف',
      date: 'التاريخ',
      time: 'الوقت',
      deadline: 'الموعد النهائي',
      expected: 'المدة المتوقعة (دقيقة)',
      expectedHint: 'اختياري',
      priority: 'الأولوية',
      status: 'الحالة',
      category: 'التصنيف',
      categoryHint: 'اختياري — اكتب أي تصنيف',
      recurrence: 'التكرار',
      notes: 'ملاحظات',
      noProject: 'بدون مشروع',
      noWorkspace: 'بدون مساحة',
      contact: 'شخص مرتبط',
      noContact: 'بدون شخص',
      allPriorities: 'كل الأولويات',
      allProjects: 'كل المشاريع',
      rec_none: 'بدون تكرار',
      rec_daily: 'يوميًا',
      rec_weekly: 'أسبوعيًا',
      rec_monthly: 'شهريًا',
      rec_yearly: 'سنويًا',
      recEvery: 'كل (n)',
      recUntil: 'حتى تاريخ',
      prio_urgent: 'عاجلة',
      prio_high: 'عالية',
      prio_medium: 'متوسطة',
      prio_low: 'منخفضة',
      st_todo: 'لم تبدأ',
      st_doing: 'قيد التنفيذ',
      st_done: 'مكتملة',
      st_deferred: 'مؤجلة',
      st_cancelled: 'ملغاة',
      cat_work: 'عمل',
      cat_study: 'دراسة',
      cat_home: 'منزل',
      cat_personal: 'شخصي',
      cat_health: 'صحة',
      cat_money: 'مالي',
      cat_family: 'عائلة',
      cat_other: 'أخرى',
      subtasks: 'المهام الفرعية',
      noSubtasks: 'لا مهام فرعية — أضف خطوات صغيرة لإنجاز أسرع',
      addSubtask: 'خطوة فرعية جديدة…',
      markDone: 'تمييز كمكتملة',
      errTitle: 'العنوان مطلوب (حرفان على الأقل)',
      errTime: 'صيغة الوقت غير صحيحة',
      errTimeNeedsDate: 'تحديد الوقت يتطلب تاريخًا',
      errDeadline: 'الموعد النهائي لا يمكن أن يسبق التاريخ',
      searchPlaceholder: 'ابحث في المهام…',
      sort: 'الترتيب',
      sortDate: 'بالتاريخ',
      sortPriority: 'بالأولوية',
      sortCreated: 'بالأحدث',
      sortTitle: 'بالعنوان',
      fActive: 'النشطة',
      fToday: 'اليوم',
      fOverdue: 'متأخرة',
      fUpcoming: 'قادمة',
      fDone: 'مكتملة',
      fAll: 'الكل',
      overdueChip: 'متأخرة',
      noDate: 'بلا تاريخ',
      emptyActive: 'لا مهام نشطة',
      emptyToday: 'لا مهام لليوم',
      emptyOverdue: 'لا مهام متأخرة — عمل رائع!',
      emptyUpcoming: 'لا مهام قادمة',
      emptyDone: 'لا مهام مكتملة بعد',
      emptyAll: 'لا مهام إطلاقًا',
      emptyHint: 'أنشئ أول مهمة وسيظهر هنا كل شيء',
      deleteTitle: 'حذف المهمة',
      deleteConfirm: 'سيتم حذف "{title}" نهائيًا مع مهامها الفرعية. هل أنت متأكد؟',
      recNextCreated: 'تم إنشاء التكرار التالي: {date}',
    },
    projects: {
      sub: '{n} مشروع',
      new: 'مشروع جديد',
      edit: 'تعديل المشروع',
      name: 'اسم المشروع',
      desc: 'الوصف',
      startDate: 'تاريخ البداية',
      endDate: 'تاريخ النهاية',
      status: 'الحالة',
      notes: 'ملاحظات المشروع',
      progress: 'نسبة الإنجاز',
      tasks: 'مهام المشروع',
      tasksCount: '{done}/{total} مهمة مكتملة',
      addTask: 'إضافة مهمة للمشروع',
      deleteTitle: 'حذف المشروع',
      deleteConfirm: 'سيتم حذف "{name}" — ستبقى مهامه موجودة بدون مشروع. هل أنت متأكد؟',
      errName: 'الاسم مطلوب (حرفان على الأقل)',
      errDates: 'تاريخ النهاية لا يمكن أن يسبق البداية',
      empty: 'لا مشاريع بعد',
      emptyHint: 'أنشئ مشروعًا لجامعة، عمل، أو هدف شخصي وتتبع تقدمه',
      noTasks: 'لا مهام في هذا المشروع',
      noTasksHint: 'أضف مهامًا وستظهر نسبة الإنجاز تلقائيًا',
      st_active: 'نشط',
      st_onhold: 'معلّق',
      st_done: 'مكتمل',
      st_archived: 'مؤرشف',
    },
    calendar: {
      mDay: 'يوم',
      mWeek: 'أسبوع',
      mMonth: 'شهر',
      prev: 'السابق',
      next: 'التالي',
      more: 'أخرى',
      allDay: 'طوال اليوم',
      noTimeTasks: 'مهام بلا وقت',
      eventsAndTasks: 'الأحداث والمواعيد',
      dayEmpty: 'لا شيء في هذا اليوم',
      dayEmptyHint: 'أضف موعدًا أو حدثًا',
      newEvent: 'حدث / موعد جديد',
      editEvent: 'تعديل الحدث',
      deleteEvent: 'حذف الحدث',
      deleteConfirm: 'سيتم حذف "{title}" نهائيًا (مع كامل سلسلة تكراره إن وجدت). هل أنت متأكد؟',
      evTitle: 'العنوان',
      evType: 'النوع',
      date: 'التاريخ',
      startTime: 'وقت البداية',
      endTime: 'وقت النهاية',
      location: 'المكان',
      errDate: 'التاريخ مطلوب',
      errEndBeforeStart: 'وقت النهاية يجب أن يكون بعد البداية',
      recSeriesNote: 'هذا حدث متكرر — التعديل سيطبق على السلسلة كاملة',
      ev_appointment: 'موعد',
      ev_meeting: 'اجتماع',
      ev_lecture: 'محاضرة',
      ev_exam: 'اختبار',
      ev_occasion: 'مناسبة',
      ev_personal: 'شخصي',
      ev_home: 'منزل',
      ev_other: 'آخر',
    },
    myday: {
      todayTitle: 'يومي',
      dayTitle: 'اليوم المحدد',
      top3: 'أهم 3 أولويات اليوم',
      pickPriority: 'اختر أولوية',
      noCandidates: 'لا مهام متاحة — أضف مهامًا أولًا',
      timeline: 'الخط الزمني',
      noTime: 'بدون وقت محدد',
      review: 'مراجعة اليوم',
      tasksDone: 'مهام: {done}/{total}',
      eventsCount: 'مواعيد: {n}',
      spentToday: 'مصروف اليوم: {amount}',
      accomplished: 'ماذا أنجزت؟',
      deferred: 'ماذا تأجل؟',
      workHours: 'ساعات العمل',
      studyHours: 'ساعات الدراسة',
      rating: 'تقييم اليوم',
      addAt: 'إضافة عند {time}',
    },
    quickadd: {
      title: 'إضافة سريعة',
      task: 'مهمة',
      event: 'موعد / حدث',
      project: 'مشروع',
      expense: 'مصروف',
      income: 'دخل',
      budget: 'ميزانية',
      debt: 'دين',
      contact: 'شخص',
      shopping: 'عنصر مشتريات',
      note: 'ملاحظة',
      goal: 'هدف',
      habit: 'عادة',
      reminder: 'تذكير',
      comingSoon: 'سيُفعَّل في المرحلة {phase}',
    },
    expenses: {
      sub: '{n} مصروف',
      new: 'مصروف جديد',
      edit: 'تعديل المصروف',
      amount: 'المبلغ',
      category: 'التصنيف',
      date: 'التاريخ',
      time: 'الوقت',
      method: 'طريقة الدفع',
      desc: 'الوصف',
      entity: 'شخص / جهة',
      m_cash: 'نقدي',
      m_card: 'بطاقة',
      m_transfer: 'تحويل بنكي',
      m_mobile: 'محفظة إلكترونية',
      m_other: 'أخرى',
      cat_food: 'طعام',
      cat_transport: 'مواصلات',
      cat_home: 'منزل',
      cat_education: 'تعليم',
      cat_work: 'عمل',
      cat_telecom: 'اتصالات',
      cat_health: 'صحة',
      cat_shopping: 'مشتريات',
      cat_bills: 'فواتير',
      cat_fun: 'ترفيه',
      cat_travel: 'سفر',
      cat_family: 'أطفال / عائلة',
      cat_other: 'أخرى',
      allCats: 'كل التصنيفات',
      manageCats: 'التصنيفات',
      newCatPh: 'تصنيف جديد…',
      catHidden: 'مخفي',
      renameCat: 'تعديل اسم التصنيف',
      delCatTitle: 'حذف التصنيف',
      delCatDefault: 'التصنيف «{name}» افتراضي — سيُخفى من القوائم، والمصروفات المسجلة عليه تبقى كما هي.',
      delCatConfirm: 'سيُحذف تصنيف «{name}». المصروفات المسجلة عليه تبقى موجودة. هل أنت متأكد؟',
      catsNote: 'التصنيفات الافتراضية تُخفى عند الحذف ويمكن استعادتها بالتعديل. أما المخصصة فتُحذف نهائيًا.',
      kMonth: 'مصروف هذا الشهر',
      kToday: 'مصروف اليوم',
      kTopCat: 'الأعلى إنفاقًا',
      kAvgDay: 'متوسط يومي',
      empty: 'لا مصروفات بعد',
      emptyHint: 'سجّل أول مصروف — المبالغ تُحسب بدقة دون أخطاء تقريب',
      emptyMonth: 'لا مصروفات في هذا الشهر',
      emptyMonthHint: 'جرّب شهرًا آخر أو أضف مصروفًا جديدًا',
      deleteTitle: 'حذف المصروف',
      deleteConfirm: 'سيُحذف المصروف «{title}» نهائيًا. هل أنت متأكد؟',
      errAmount: 'أدخل مبلغًا صحيحًا أكبر من صفر',
      errAmountNeg: 'المبلغ لا يمكن أن يكون سالبًا',
      errAmountPrec: 'عدد الخانات العشرية أكثر من المسموح للعملة',
      errDate: 'التاريخ مطلوب',
      hasNote: 'ملاحظة',
      otherCat: 'غير مصنف',
      viewAll: 'عرض كل المصروفات',
    },
    income: {
      sub: '{n} إدخال',
      new: 'دخل جديد',
      edit: 'تعديل الدخل',
      source: 'المصدر',
      desc: 'الوصف',
      src_salary: 'راتب',
      src_freelance: 'عمل حر',
      src_project: 'مشروع',
      src_extra: 'دخل إضافي',
      src_gift: 'هدية',
      src_other: 'أخرى',
      kIncome: 'دخل الشهر',
      kExpense: 'مصروف الشهر',
      kNet: 'صافي التدفق',
      netPos: 'دخلك أكبر من مصروفك — أحسنت',
      netNeg: 'مصروفك أكبر من دخلك هذا الشهر',
      compare: 'مقارنة آخر 6 أشهر',
      trendAria: 'شهر {ym}: دخل {inc}، مصروف {exp}',
      empty: 'لا دخول مسجلة',
      emptyHint: 'سجّل دخلك إن أردت — راتبًا أو عملًا حرًا أو أي مصدر آخر',
      deleteTitle: 'حذف الدخل',
      deleteConfirm: 'سيُحذف إدخال الدخل «{title}» نهائيًا. هل أنت متأكد؟',
    },
    budgets: {
      sub: '{n} ميزانية',
      new: 'ميزانية جديدة',
      edit: 'تعديل الميزانية',
      general: 'عام (كل التصنيفات)',
      allCats: 'كل التصنيفات',
      nameLabel: 'اسم الميزانية',
      categoryLabel: 'التصنيف',
      periodLabel: 'الدورة',
      p_daily: 'يومية',
      p_weekly: 'أسبوعية',
      p_monthly: 'شهرية',
      p_yearly: 'سنوية',
      spentOf: 'أُنفق {spent} من {amount}',
      remaining: 'المتبقي: {amount}',
      projected: 'المتوقع بنهاية الشهر: {amount} ({pct}%)',
      warnTitle: 'اقتربت من حد ميزانية «{name}» ({pct}%)',
      overTitle: 'تجاوزت ميزانية «{name}»',
      spentLine: 'المصروف {spent} من {amount}',
      topCats: 'الفئات الأعلى إنفاقًا',
      noCats: 'لا مصروفات هذا الشهر بعد',
      empty: 'لا ميزانيات بعد',
      emptyHint: 'ضع حدًا لإنفاقك — ميزانية عامة أو حسب التصنيف، يومية أو شهرية',
      deleteTitle: 'حذف الميزانية',
      deleteConfirm: 'سيُحذف ميزانية «{name}». هل أنت متأكد؟',
      disabled: 'الميزانيات معطلة',
      disabledHint: 'يمكنك تفعيلها من الإعدادات ← الميزات',
    },
    debts: {
      sub: '{n} دين',
      new: 'دين جديد',
      edit: 'تعديل الدين',
      tabIou: 'ديون عليّ',
      tabOwed: 'ديون لي',
      direction: 'الاتجاه',
      person: 'الشخص / الجهة',
      personHint: 'اكتب اسمًا من أشخاصك ليُربط تلقائيًا',
      amount: 'المبلغ الأصلي',
      date: 'تاريخ الدين',
      dueDate: 'الاستحقاق',
      reason: 'السبب',
      paid: 'المدفوع',
      remaining: 'المتبقي: {amount}',
      paidOff: 'سُدِّد بالكامل ✓',
      noDueDate: 'بدون تاريخ استحقاق',
      payments: 'الدفعات',
      paymentsCount: 'دفعة',
      addPayment: 'إضافة دفعة',
      paymentAmount: 'مبلغ الدفعة',
      paymentDate: 'تاريخ الدفعة',
      paymentNote: 'ملاحظة',
      paymentsEmpty: 'لا دفعات بعد — أضف دفعة عند كل سداد جزئي',
      overpayErr: 'المبلغ أكبر من المتبقي ({amount})',
      st_due: 'مستحق',
      st_partial: 'جزئي',
      st_paid: 'مدفوع',
      st_overdue: 'متأخر',
      kIOwe: 'متبقٍ عليّ',
      kOweMe: 'متبقٍ لي',
      kNet: 'صافي المركز',
      kNetHint: 'ديون لي − ديون عليّ',
      ofTotal: 'من إجمالي {amount}',
      emptyIou: 'لا ديون عليّ',
      emptyIouHint: 'سجّل ما عليك من ديون وتابع سدادها بجزئية وبتاريخ استحقاق',
      emptyOwed: 'لا ديون لك عند أحد',
      emptyOwedHint: 'سجّل ما لك عند الآخرين حتى لا يضيع',
      deleteTitle: 'حذف الدين',
      deleteConfirm: 'سيُحذف دين «{person}» مع كل دفعاته نهائيًا. هل أنت متأكد؟',
      deletePayment: 'حذف الدفعة',
      deletePaymentConfirm: 'سيُحذف سجل الدفعة بمبلغ {amount}. الحالة ستُعاد حسابها تلقائيًا. هل أنت متأكد؟',
      errPerson: 'أدخل اسم الشخص أو الجهة',
    },
    contacts: {
      sub: '{n} شخص',
      new: 'شخص جديد',
      edit: 'تعديل البيانات',
      name: 'الاسم',
      phone: 'الهاتف',
      email: 'البريد الإلكتروني',
      relation: 'صلة القرابة / العلاقة',
      noRelation: 'بدون تحديد',
      rel_family: 'عائلة',
      rel_friend: 'صداقة',
      rel_work: 'عمل',
      rel_client: 'عميل',
      rel_neighbor: 'جيران',
      rel_other: 'أخرى',
      timeline: 'الخط الزمني',
      timelineEmpty: 'لا شيء مرتبط بهذا الشخص بعد — اربطه بدين أو مهمة أو موعد',
      linkedTask: 'مهمة',
      linkedEvent: 'موعد / حدث',
      linkedProject: 'مشروع',
      linkedDebt: 'دين',
      debtOwedToMe: 'دين لي عنده',
      debtIOwe: 'دين عليّ له',
      payment: 'دفعة',
      receivedFrom: 'استلمت من',
      paidTo: 'دفعت إلى',
      owesMe: 'متبقٍ له عندي',
      iOwe: 'متبقٍ عندي له',
      nDebts: '{n} ديون',
      nTasks: '{n} مهام',
      viewAll: 'الأشخاص',
      empty: 'لا أشخاص بعد',
      emptyHint: 'أضف من تعامل معهم ليرتبطوا بديونك ومهامك ومواعيدك',
      notFound: 'الشخص غير موجود',
      deleteTitle: 'حذف الشخص',
      deleteConfirm: 'سيُحذف «{name}» — ما هو مرتبط به من ديون ومهام يبقى موجودًا. هل أنت متأكد؟',
      errName: 'الاسم مطلوب (حرفان على الأقل)',
      errEmail: 'بريد إلكتروني غير صالح',
    },
    shopping: {
      sub: '{n} عنصرًا متبقيًا',
      newList: 'قائمة جديدة',
      renameList: 'تعديل القائمة',
      listName: 'اسم القائمة',
      listType: 'نوع القائمة',
      list: 'القائمة',
      type_grocery: 'بقالة',
      type_home: 'منزل',
      type_study: 'دراسة',
      type_work: 'عمل',
      type_travel: 'سفر',
      type_custom: 'مخصص',
      addItem: 'عنصر جديد',
      editItem: 'تعديل العنصر',
      name: 'اسم العنصر',
      qty: 'الكمية',
      qtyPh: '2 · كيلو · علبتان',
      expected: 'السعر المتوقع',
      actual: 'السعر الفعلي',
      recordActual: 'تسجيل السعر الفعلي',
      purchasedOn: 'تاريخ الشراء',
      markPurchased: 'تم شراؤه',
      addExpense: 'إضافة إلى المصروفات',
      addExpenseHint: 'يُسجَّل مصروف بهذا المبلغ وتاريخ الشراء',
      expenseNote: 'من قائمة: {list}',
      clearPurchased: 'مسح المشتراة',
      clearPurchasedConfirm: 'سيُحذف {n} عنصرًا مشترًى من القائمة. هل أنت متأكد؟',
      deleteList: 'حذف القائمة',
      deleteListConfirm: 'سيُحذف «{name}» مع كل عناصرها. هل أنت متأكد؟',
      deleteItem: 'حذف العنصر',
      deleteItemConfirm: 'سيُحذف «{name}» من القائمة. هل أنت متأكد؟',
      empty: 'القائمة فارغة',
      emptyHint: 'اكتب ما تحتاجه بالأسفل ثم Enter — الكمية والسعر اختياريان',
      noLists: 'لا قوائم بعد',
      statsLine: '{total} عنصر · المشتراة {purchased}',
      expectedTotal: 'الإجمالي المتوقع',
      allBought: 'كل العناصر تم شراؤها 🎉',
      viewAll: 'قائمة المشتريات',
      errName: 'اسم العنصر مطلوب',
      errListName: 'اسم القائمة مطلوب (حرفان على الأقل)',
    },
    home: {
      sub: '{n} مهمة',
      new: 'مهمة منزلية',
      edit: 'تعديل المهمة',
      area: 'المجال',
      allAreas: 'كل المجالات',
      a_cleaning: 'تنظيف',
      a_cooking: 'طبخ',
      a_laundry: 'غسيل',
      a_maintenance: 'صيانة',
      a_bills: 'فواتير',
      a_other: 'أخرى',
      recHint: 'المهام المتكررة تولّد نسختها التالية تلقائيًا عند الإنجاز — مثل «تنظيف المطبخ — كل يوم»',
      needsList: 'قائمة الاحتياجات',
      kToday: 'مهام اليوم',
      kOverdue: 'متأخرة',
      kDoneToday: 'أُنجزت اليوم',
      upcomingEvents: 'مواعيد المنزل القادمة',
      noEvents: 'لا مواعيد منزلية قادمة — تُضاف من التقويم بنوع «منزل»',
      empty: 'لا مهام منزلية',
      emptyHint: 'أضف مهام التنظيف والطبخ والفواتير — المتكرر منها يتجدد تلقائيًا',
      allDoneToday: 'لا مهام منزلية معلقة — أحسنت 🎉',
      viewAll: 'مهام المنزل',
      disabled: 'إدارة المنزل معطلة',
      disabledHint: 'يمكنك تفعيلها من الإعدادات ← الميزات',
      deleteTitle: 'حذف المهمة',
      deleteConfirm: 'سيُحذف «{title}» نهائيًا. هل أنت متأكد؟',
    },
    study: {
      sub: '{n} مادة',
      tOverview: 'نظرة عامة',
      tAssignments: 'الواجبات',
      tSubjects: 'المواد',
      tSessions: 'جلسات الدراسة',
      newSubject: 'مادة جديدة',
      editSubject: 'تعديل المادة',
      subjectName: 'اسم المادة',
      teacher: 'المدرس',
      room: 'القاعة',
      schedule: 'الجدول',
      schedulePh: 'الأحد والثلاثاء 10ص — الثلاثاء 12م',
      subject: 'المادة',
      noSubject: 'بدون مادة',
      newExam: 'اختبار جديد',
      editExam: 'تعديل الاختبار',
      examTitle: 'عنوان الاختبار',
      examTitlePh: 'اختبار الفصل الأول',
      newAssignment: 'واجب جديد',
      editAssignment: 'تعديل الواجب',
      asgTitle: 'المهمة',
      due: 'التسليم',
      logSession: 'تسجيل جلسة',
      editSession: 'تعديل الجلسة',
      duration: 'المدة (دقائق)',
      kHours: 'ساعات هذا الأسبوع',
      kHoursSub: 'آخر 7 أيام',
      kAssignments: 'واجبات مفتوحة',
      kOverdue: 'متأخر: {n}',
      kNextExam: 'أقرب اختبار',
      upcomingExams: 'الاختبارات القادمة',
      noExams: 'لا اختبارات قادمة — ذاكر بهدوء',
      bySubject: 'ساعات الدراسة حسب المادة',
      noSessions: 'لا جلسات بعد — سجّل أول جلسة دراسة',
      noSessionsHint: 'سجّل كل جلسة لتعرف ساعاتك الحقيقية لكل مادة',
      recentSessions: 'أحدث الجلسات',
      noAssignments: 'لا واجبات',
      noAssignmentsHint: 'أضف واجبًا بموعد تسليم وأولوية',
      noSubjects: 'لا مواد بعد',
      noSubjectsHint: 'أضف موادك مع المدرس والقاعة والجدول',
      today: 'اليوم',
      tomorrow: 'غدًا',
      inDays: 'بعد {n} يوم',
      pastDays: 'منذ {n} يوم',
      hourShort: 'س',
      minShort: 'د',
      viewAll: 'الدراسة',
      errSubject: 'اسم المادة مطلوب (حرفان على الأقل)',
      errMinutes: 'أدخل مدة صحيحة بالدقائق',
      deleteSubject: 'حذف المادة',
      deleteSubjectConfirm: 'سيُحذف «{name}» — اختباراتها وواجباتها وجلساتها تبقى كما هي. هل أنت متأكد؟',
      deleteExam: 'حذف الاختبار',
      deleteExamConfirm: 'سيُحذف الاختبار «{name}» نهائيًا. هل أنت متأكد؟',
      deleteAsg: 'حذف الواجب',
      deleteAsgConfirm: 'سيُحذف الواجب «{title}» نهائيًا. هل أنت متأكد؟',
      deleteSession: 'حذف الجلسة',
      deleteSessionConfirm: 'سيُحذف سجل هذه الجلسة. هل أنت متأكد؟',
      disabled: 'الدراسة معطلة',
      disabledHint: 'يمكنك تفعيلها من الإعدادات ← الميزات',
    },
    work: {
      sub: 'مساحة: {ws}',
      newTask: 'مهمة عمل',
      newMeeting: 'اجتماع',
      logHours: 'تسجيل ساعات',
      hoursToday: 'ساعات اليوم',
      hoursHint: 'تُضاف إلى ما سُجّل اليوم (أجزاء مثل 1.5)',
      loggedToday: 'المسجل اليوم',
      resetToday: 'تصفير اليوم',
      resetConfirm: 'سيُصفَّر عدّاد ساعات العمل لليوم. هل أنت متأكد؟',
      kOpenTasks: 'مهام مفتوحة',
      kToday: 'اليوم: {n}',
      kMeetings: 'اجتماعات اليوم',
      kUpcoming: 'القادمة: {n}',
      kHours: 'ساعات هذا الأسبوع',
      kHoursSub: 'من يومياتك',
      kClients: 'عملاء',
      openTasks: 'مهام العمل المفتوحة',
      noTasks: 'لا مهام عمل مفتوحة في مساحة العمل',
      upcomingMeetings: 'الاجتماعات القادمة',
      noMeetings: 'لا اجتماعات قادمة',
      hoursWeek: 'ساعات العمل — آخر 7 أيام',
      clients: 'العملاء',
      noClients: 'لا عملاء — أضفهم من الأشخاص بعلاقة «عميل»',
      viewAll: 'العمل',
      errHours: 'أدخل عدد ساعات صحيحًا (0-24)',
      disabled: 'العمل معطلة',
      disabledHint: 'يمكنك تفعيلها من الإعدادات ← الميزات',
    },
    habits: {
      sub: '{n} عادة',
      new: 'عادة جديدة',
      edit: 'تعديل العادة',
      name: 'اسم العادة',
      schedule: 'التكرار',
      sch_daily: 'يوميًا',
      sch_days: 'أيام محددة',
      sch_weekly: 'أسبوعيًا',
      sch_numeric: 'هدف عددي (n يوميًا)',
      targetLabel: 'الهدف اليومي',
      targetHint: 'مثال: 8 أكواب ماء',
      daysLabel: 'أيام العادة',
      streak: 'سلسلة متصلة',
      adherence: 'نسبة الالتزام',
      adhLine: 'آخر 30 يومًا: {done} من {total}',
      restDay: 'يوم راحة',
      markToday: 'إنجاز اليوم',
      plus: 'زيادة',
      minus: 'نقصان',
      noneToday: 'لا عادات مجدولة اليوم — يوم راحة كامل',
      empty: 'لا عادات بعد',
      emptyHint: 'رياضة، قراءة، شرب الماء… ابدأ بعادة واحدة تلتزم بها',
      viewAll: 'العادات',
      errName: 'اسم العادة مطلوب (حرفان على الأقل)',
      errDays: 'اختر يومًا واحدًا على الأقل',
      errTarget: 'أدخل هدفًا عدديًا صحيحًا (1 فأكثر)',
      deleteTitle: 'حذف العادة',
      deleteConfirm: 'سيُحذف «{name}» مع كل سجلها نهائيًا. هل أنت متأكد؟',
      disabled: 'العادات معطلة',
      disabledHint: 'يمكنك تفعيلها من الإعدادات ← الميزات',
    },
    goals: {
      sub: '{n} هدف',
      new: 'هدف جديد',
      edit: 'تعديل الهدف',
      name: 'اسم الهدف',
      category: 'التصنيف',
      c_personal: 'شخصي',
      c_financial: 'مالي',
      c_study: 'دراسي',
      c_career: 'مهني',
      c_fitness: 'صحة / لياقة',
      c_home: 'منزلي',
      c_project: 'مشروع',
      progress: 'نسبة الإنجاز',
      steps: 'الخطوات',
      stepsHint: 'وجود خطوات يجعل النسبة تُحسب تلقائيًا من إنجازها',
      stepPh: 'خطوة جديدة ثم Enter…',
      fArchived: 'مؤجل / ملغى',
      st_active: 'نشط',
      st_onhold: 'معلق',
      st_done: 'منجز',
      st_cancelled: 'ملغى',
      empty: 'لا أهداف بعد',
      emptyHint: 'حلم كبير؟ قسمه لخطوات وشاهد النسبة ترتفع مع كل إنجاز',
      viewAll: 'الأهداف',
      errName: 'اسم الهدف مطلوب (حرفان على الأقل)',
      deleteTitle: 'حذف الهدف',
      deleteConfirm: 'سيُحذف «{name}» مع خطواته نهائيًا. هل أنت متأكد؟',
    },
    notes: {
      sub: '{n} ملاحظة',
      new: 'ملاحظة جديدة',
      edit: 'تعديل الملاحظة',
      title: 'العنوان',
      titlePh: 'عنوان (اختياري)',
      body: 'النص',
      type: 'النوع',
      allTypes: 'الكل',
      t_general: 'عامة',
      t_work: 'عمل',
      t_study: 'دراسة',
      t_home: 'منزل',
      t_project: 'مشروع',
      t_idea: 'فكرة',
      t_personal: 'شخصية',
      pin: 'تثبيت',
      searchPh: 'ابحث في الملاحظات…',
      empty: 'لا ملاحظات بعد',
      emptyHint: 'فكرة، قائمة، رقم هاتف… كل ما تريد ألا يضيع',
      emptyFiltered: 'لا نتائج مطابقة',
      errEmpty: 'اكتب عنوانًا أو نصًا قبل الحفظ',
      deleteTitle: 'حذف الملاحظة',
      deleteConfirm: 'سيُحذف «{title}» نهائيًا. هل أنت متأكد؟',
    },
    reminders: {
      sub: '{n} تذكير مفتوح',
      subOverdue: '{n} تذكير مستحق الآن!',
      new: 'تذكير جديد',
      edit: 'تعديل التذكير',
      title: 'التذكير',
      linkTo: 'يخص',
      l_none: 'عام',
      l_task: 'مهمة',
      l_bill: 'فاتورة',
      l_debt: 'دين',
      l_shopping: 'شراء',
      l_exam: 'اختبار',
      l_habit: 'عادة',
      l_goal: 'هدف',
      l_event: 'موعد',
      ref: 'مرجع حر',
      refPh: 'مثال: فاتورة الكهرباء',
      tUpcoming: 'القادمة',
      tDone: 'المنجزة',
      markDone: 'تم',
      rescheduled: 'أُعيد جدولته إلى {date}',
      dueAt: '{date} {time}',
      inAppNote: 'تظهر التذكيرات داخل التطبيق دائمًا — ويمكن تفعيل إشعارات النظام إن دعمها متصفحك',
      enableNotif: 'تفعيل إشعارات النظام',
      notifOn: 'فُعِّلت إشعارات النظام',
      notifOff: 'لم تُفعَّل إشعارات النظام — ستبقى التذكيرات داخل التطبيق',
      empty: 'لا تذكيرات قادمة',
      emptyDone: 'لا تذكيرات منجزة',
      emptyHint: 'فاتورة، دفعة دين، موعد… لن يفوتك شيء',
      errTitle: 'اكتب نص التذكير (حرفان على الأقل)',
      deleteTitle: 'حذف التذكير',
      deleteConfirm: 'سيُحذف التذكير «{title}» نهائيًا. هل أنت متأكد؟',
    },
    analytics: {
      money: 'المال',
      time: 'الوقت والمهام',
      netDebts: 'صافي الديون',
      youOwe: 'عليك {a} · لك {b}',
      kTasks: 'مهام الفترة',
      kDoneSub: 'أُنجز منها {n}',
      completion: 'نسبة الإنجاز',
      plannedTime: 'الوقت المخطط',
      actualTime: 'الوقت الفعلي المسجل',
      actualTimeHint: 'جلسات الدراسة + ساعات العمل',
      completions: 'المهام المُنجزة يوميًا (آخر 14 يومًا)',
      examsThisMonth: 'اختبارات الشهر',
      tasksDone: 'مهام منجزة',
      activeProjects: 'مشاريع نشطة',
      homeTasksDone: 'مهام منزلية منجزة',
      itemsBought: 'عناصر مشتراة',
      billsThisMonth: 'فواتير الشهر',
      habitCheckins: 'تسجيلات العادات',
      activeDays: 'أيام نشطة',
    },
    reports: {
      p_today: 'اليوم',
      p_week: 'الأسبوع',
      p_month: 'الشهر',
      p_year: 'السنة',
      printPdf: 'طباعة / PDF',
      csvDone: 'صُدِّر التقرير: {name}',
    },
    search: {
      title: 'البحث الشامل',
      sub: 'بحث واحد في كل بياناتك — أشخاص، ديون، مهام، مواعيد، ملاحظات…',
      ph: 'اكتب حرفين على الأقل… مثل: محمد',
      allTypes: 'الكل',
      helpTitle: 'ابحث في كل شيء',
      helpHint: 'اكتب اسمًا أو كلمة — جهات الاتصال، الديون والدفعات، المهام، المواعيد، الملاحظات، المشاريع، المصروفات، العادات، الأهداف، المشتريات',
      noResults: 'لا نتائج مطابقة',
      noResultsHint: 'جرّب كلمة أقصر أو تحقق من الإملاء',
    },
    insights: {
      overdueTasks: 'لديك {n} مهمة متأخرة',
      tasksLeft: 'باقي {n} مهمة اليوم',
      allDone: 'أنجزت كل مهام اليوم — عمل رائع!',
      eventsToday: 'لديك {n} مواعيد اليوم',
      spentToday: 'مصروف اليوم: {amount}',
      debtDueToday: 'لديك دين مستحق اليوم ({n})',
      debtDueTomorrow: 'لديك دفعة دين مستحقة غدًا ({n})',
      debtDueSoon: '{n} من الديون مستحقة خلال 3 أيام',
      debtOverdue: 'لديك {n} دين متأخر السداد',
      habitsToday: 'عادات اليوم: {done}/{total}',
      examSoon: 'اختبار قريب — بعد {days} أيام',
    },
  };

  const en = {
    common: {
      appName: 'LifeFlow',
      tagline: 'Your personal life management system',
      save: 'Save', saved: 'Saved', cancel: 'Cancel', close: 'Close',
      back: 'Back', next: 'Next', confirm: 'Confirm',
      search: 'Search', loading: 'Loading…', ok: 'OK',
      name: 'Name', currency: 'Currency', language: 'Language',
      add: 'Add', del: 'Delete', rename: 'Rename', active: 'Active',
      remove: 'Remove', edit: 'Edit',
      phase: 'Phase {n}', today: 'Today', optional: 'Optional',
      yesDelete: 'Yes, delete',
    },
    app: {
      offline: 'Offline',
      localMode: 'Local',
      previewShort: 'Preview mode',
      previewMode: 'You are in a sandboxed preview: persistent storage is unavailable here, so data will not survive closing. Open the app from the live link or download it for full persistence.',
      updateReady: 'A new update is ready — reload to get it',
      updateNow: 'Update',
      installApp: 'Install app',
      installed: 'App installed successfully 🎉',
      toggleTheme: 'Toggle theme',
      themeSet: 'Theme: {theme}',
      errorGeneric: 'Something went wrong, please try again',
      routeError: 'Failed to load the page',
    },
    auth: {
      chooseAccount: 'Who is using LifeFlow?',
      signInAs: 'Sign in',
      signIn: 'Sign in',
      newAccount: 'Create a new account',
      heroSub: 'One system for your time, tasks, money, goals and daily life',
      localNote: 'Your data stays on this device only — it never leaves',
      namePlaceholder: 'Your full name',
      username: 'Username',
      usernameHint: 'Lowercase letters and digits (3-20)',
      password: 'Password',
      passwordHint: 'At least 6 characters',
      confirmPassword: 'Confirm password',
      showPassword: 'Show / hide password',
      createAccount: 'Create account & start',
      oldPassword: 'Current password',
      newPassword: 'New password',
      errName: 'Name must be 2-40 characters',
      errUsername: 'Username: lowercase letters/digits/dot/dash (3-20)',
      errUsernameTaken: 'This username is already taken',
      errPassword: 'Password must be at least 6 characters',
      errCredentials: 'Incorrect credentials',
      errOldPassword: 'Current password is incorrect',
      errMismatch: 'Passwords do not match',
      locked: 'Too many attempts — wait {sec}s',
      loggedOut: 'Signed out',
      logout: 'Sign out',
    },
    onboarding: {
      welcomeTitle: 'Welcome {name} 👋',
      welcomeSub: 'Let\u2019s set up LifeFlow your way — takes one minute',
      langHint: 'You can change language, theme and everything later anytime',
      usageTitle: 'How will you use LifeFlow?',
      usageSub: 'Pick what fits you — multiple choices allowed',
      usage_student: 'Student',
      usage_employee: 'Employee',
      usage_business: 'Business owner',
      usage_home: 'Home manager',
      usage_personal: 'Personal use',
      pickUsage: 'Pick at least one',
      currencyTitle: 'What\u2019s your currency?',
      currencySub: 'Used across expenses, budgets and debts',
      prefsTitle: 'Display preferences',
      prefsSub: 'Week start, time format and numerals',
      weekStart: 'Week starts on',
      tf24: '24-hour',
      tf12: '12-hour (AM/PM)',
      numerals: 'Numerals',
      featuresTitle: 'Features',
      featuresSub: 'Enable what you need now — the rest can be switched on later in Settings',
      feat_budget: 'Budget',
      featDesc_budget: 'Daily/weekly/monthly spending limits with alerts',
      feat_habits: 'Habits',
      featDesc_habits: 'Daily tracking, streaks and consistency',
      feat_study: 'Study',
      featDesc_study: 'Subjects, assignments, exams, study sessions',
      feat_work: 'Work',
      featDesc_work: 'Work tasks, meetings, working hours',
      feat_home: 'Home management',
      featDesc_home: 'Recurring chores, bills, maintenance',
      readyTitle: 'All set!',
      readySub: 'Here\u2019s a summary of your setup:',
      changeLater: 'You can change any of this later in Settings.',
      startNow: 'Start your journey',
      stepOf: 'Step {n} of {total}',
      welcomeDone: 'Welcome to LifeFlow! 🎉',
      timeFormat: 'Time format',
    },
    ws: {
      personal: 'Personal', university: 'University', work: 'Work',
      business: 'Business', home: 'Home',
    },
    nav: {
      main: 'Main',
      dashboard: 'Dashboard', myday: 'My Day', tasks: 'Tasks',
      projects: 'Projects', calendar: 'Calendar', expenses: 'Expenses',
      income: 'Income', budget: 'Budget', debts: 'Debts',
      contacts: 'Contacts', shopping: 'Shopping', home: 'Home',
      study: 'Study', work: 'Work', habits: 'Habits',
      goals: 'Goals', notes: 'Notes', reminders: 'Reminders',
      analytics: 'Analytics', reports: 'Reports', settings: 'Settings',
      soon: 'Coming soon — next phases',
    },
    notifications: {
      title: 'Notifications',
      empty: 'No notifications yet',
      new: 'New',
    },
    dashboard: {
      gMorning: 'Good morning', gNoon: 'Good afternoon', gEvening: 'Good evening', gNight: 'Good night',
      todayLine: 'Today: {tasks} tasks · {events} events · spent {spent}',
      noDataYet: 'Your summaries will appear here automatically as soon as you add tasks, events and expenses — coming in the next phases.',
      kTasks: 'Tasks today', kDone: 'Completed', kEvents: 'Events today',
      kSpent: 'Spent today', kDueDebts: 'Debts due', kCompletion: 'Completion',
      wSummary: 'Today\u2019s summary', wStart: 'Getting started', wQuick: 'Quick actions',
      wRoadmap: 'Roadmap',
      gsAccount: 'Account created',
      gsOnboard: 'Onboarding completed',
      gsCurrency: 'Currency set ({c})',
      gsInstall: 'Install the app on your device',
      gsFirstTask: 'Add your first task',
      gsProgress: '{done} of {total}',
      qaCustomize: 'Customize dashboard',
      qaTheme: 'Toggle theme',
      qaBackup: 'Backup',
      wTodayTasks: 'Today\u2019s tasks',
      wFinance: 'This month\u2019s money',
      wShopping: 'Shopping list',
      wHome: 'Home today',
      wStudy: 'Study',
      wWork: 'Work',
      wHabits: 'Today\u2019s habits',
      wGoals: 'Active goals',
      allDone: 'All today\u2019s tasks done 🎉',
      noTasksToday: 'No tasks for today',
      noTasksTodayHint: 'Add your first task and start your day',
      andMore: 'And {n} more…',
      viewAllTasks: 'View all tasks',
    },
    widgets: { moveUp: 'Move up', moveDown: 'Move down' },
    roadmap: {
      done: 'Done',
      p1: 'Core, accounts, theme, localization, PWA, dashboard',
      p2: 'Tasks, projects, calendar, my day',
      p3: 'Expenses, income, budgets',
      p4: 'Debts, payments, contacts',
      p5: 'Shopping, home management',
      p6: 'Study, work',
      p7: 'Habits, goals, notes, reminders',
      p8: 'Analytics, reports, export',
      p9: 'Offline, sync, notifications, PWA polish',
      p10: 'Security, accessibility, performance, final QA',
    },
    settings: {
      sub: 'Your profile, preferences and data',
      secProfile: 'Profile',
      secPrefs: 'Preferences',
      secFeatures: 'Optional features',
      featuresSub: 'Enable only what you need — disabled features are hidden across the app',
      featBudgetHint: 'Daily or monthly spending limits with near-limit alerts',
      featHomeHint: 'Recurring home tasks: cleaning, cooking and bills',
      featStudyHint: 'Subjects, exams, assignments and study sessions',
      featWorkHint: 'Work tasks, meetings, work hours and clients',
      featHabitsHint: 'Daily tracking with streaks and adherence',
      secDashboard: 'Dashboard',
      secWorkspaces: 'Workspaces',
      secData: 'Data',
      secAccount: 'Account',
      avatarColor: 'Avatar color',
      themeOption: 'Theme',
      theme_system: 'Auto (system)', theme_light: 'Light', theme_dark: 'Dark',
      accent: 'Accent color',
      acc_teal: 'Teal', acc_indigo: 'Indigo', acc_rose: 'Rose',
      acc_emerald: 'Emerald', acc_amber: 'Amber',
      timeFormat: 'Time format',
      timezone: 'Timezone',
      tzAuto: 'Auto',
      dashDesc: 'Choose and reorder what appears on your dashboard.',
      wsDesc: 'Spaces to organize your life: personal, work, study, home… (fully activated in upcoming phases)',
      wsAdd: 'New workspace',
      wsNamePlaceholder: 'Workspace name',
      wsNameRequired: 'Name is required',
      wsDelete: 'Delete workspace',
      wsDeleteConfirm: '"{name}" will be permanently deleted. Are you sure?',
      wsLastOne: 'Cannot delete the only remaining workspace',
      exportDesc: 'Download a full backup of your data as JSON. Keep it safe — it contains your financial data.',
      exportBtn: 'Export backup',
      exportDone: 'Backup downloaded: {f}',
      restoreTitle: 'Restore backup',
      restoreDesc: 'Import a backup file (JSON) — completely replaces your current account data.',
      restoreBtn: 'Restore from file…',
      restoreInvalid: 'Invalid file — make sure it is a LifeFlow backup.',
      restoreConflict: 'Cannot restore: the file contains records that belong to another account on this device. Restore it into the original account, or on another device/URL. Nothing was changed.',
      restoreConfirm: 'The file contains {n} records (exported {when} — {who}). ALL your current data will be replaced with this content. Are you sure?',
      restoreGo: 'Replace my data',
      restoreDone: 'Restored {n} records — the app will reload…',
      encryptedBackup: 'Encrypted backup',
      encryptBackup: 'Encrypt backup',
      backupPassword: 'Backup password',
      backupPasswordHint: 'Use a strong password. LifeFlow never stores the password.',
      passwordRequired: 'Enter a backup password.',
      passwordTooShort: 'Backup password must be at least 8 characters.',
      decryptFailed: 'Could not decrypt this backup. Check the password and file.',
      driveTitle: 'Google Drive',
      driveDesc: 'Store an encrypted backup in your Google Drive app-data area. Cloud is not the primary data store.',
      driveClientId: 'Google OAuth Client ID',
      driveClientIdHint: 'Optional. Create an OAuth Client in Google Cloud and paste the Client ID here.',
      driveSaveClient: 'Save Client ID',
      driveConnect: 'Connect Google Drive',
      driveBackup: 'Upload backup to Google Drive',
      driveRestore: 'Restore latest backup from Google Drive',
      driveConnected: 'Connected for this session',
      driveNeedClient: 'Enter a Google OAuth Client ID first.',
      driveSaved: 'Google Drive setting saved on this device.',
      driveUploaded: 'Encrypted backup uploaded to Google Drive.',
      driveRestored: 'Backup downloaded from Google Drive. The restore confirmation is ready.',
      driveNone: 'No LifeFlow backup was found in Google Drive.',
      driveAutoOn:'Automatic backup is enabled ✓', driveAutoOff:'Automatic backup is not enabled', driveEnableAuto:'Enable automatic backup', driveAutoRestore:'Restore automatic backup', driveAutoLast:'Last automatic backup:',
      secNotifs: 'Notifications',
      notifDesc: 'System notifications are used for reminders only — in-app notifications (bell and toasts) always work without permission.',
      notifStateLabel: 'System permission:',
      notifGranted: 'Granted',
      notifDenied: 'Blocked',
      notifDefault: 'Not requested yet',
      notifUnsupported: 'Your browser does not support system notifications — in-app notifications always work.',
      notifEnable: 'Enable system notifications',
      notifTest: 'Test notification',
      notifTestTitle: 'LifeFlow',
      notifTestBody: 'Notifications work ✓',
      notifHint: 'Alerts arrive only while the app is open (there is no server to push in the background). You can revoke permission from site settings at any time.',
      notifDeniedHint: 'Permission is blocked — enable it from the browser site settings to receive reminder notifications.',
      secApp: 'App',
      version: 'Version:',
      checkUpdate: 'Check for updates',
      updChecked: 'Checked — you are on the latest version',
      installBtn: 'Install app',
      runningInstalled: 'Running as an installed app ✓',
      installHint: 'Install the app from your browser menu (Install / Add to Home Screen) to use it standalone.',
      iosHint: 'On iOS: tap the Share button, then "Add to Home Screen".',
      offlineReady: 'Offline-ready:',
      swActive: 'Ready ✓',
      swInactive: 'Not active (requires HTTPS or localhost)',
      accountDesc: 'Your password unlocks your account on this device.',
      changePassword: 'Change password',
      pwChanged: 'Password changed successfully',
      dangerZone: 'Danger zone',
      deleteDesc: 'Permanently delete your account and all its data from this device. This cannot be undone.',
      deleteAccount: 'Delete account permanently',
      deleteWarn: 'All your data will be deleted: settings, tasks, expenses, debts, everything — permanently and unrecoverably.',
      deleteConfirmName: 'Type "{name}" to confirm',
      errConfirmName: 'Name does not match',
      accountDeleted: 'Account and all data deleted',
      account: 'Account',
    },
    tasks: {
      sub: '{n} tasks',
      new: 'New task',
      showMore: 'Show {n} more tasks…',
      edit: 'Edit task',
      title: 'Title',
      desc: 'Description',
      date: 'Date',
      time: 'Time',
      deadline: 'Deadline',
      expected: 'Expected duration (min)',
      expectedHint: 'Optional',
      priority: 'Priority',
      status: 'Status',
      category: 'Category',
      categoryHint: 'Optional — type any category',
      recurrence: 'Repeat',
      notes: 'Notes',
      noProject: 'No project',
      noWorkspace: 'No workspace',
      contact: 'Linked person',
      noContact: 'No person',
      allPriorities: 'All priorities',
      allProjects: 'All projects',
      rec_none: 'No repeat',
      rec_daily: 'Daily',
      rec_weekly: 'Weekly',
      rec_monthly: 'Monthly',
      rec_yearly: 'Yearly',
      recEvery: 'Every (n)',
      recUntil: 'Until date',
      prio_urgent: 'Urgent',
      prio_high: 'High',
      prio_medium: 'Medium',
      prio_low: 'Low',
      st_todo: 'Not started',
      st_doing: 'In progress',
      st_done: 'Completed',
      st_deferred: 'Deferred',
      st_cancelled: 'Cancelled',
      cat_work: 'Work',
      cat_study: 'Study',
      cat_home: 'Home',
      cat_personal: 'Personal',
      cat_health: 'Health',
      cat_money: 'Money',
      cat_family: 'Family',
      cat_other: 'Other',
      subtasks: 'Subtasks',
      noSubtasks: 'No subtasks — add small steps to move faster',
      addSubtask: 'New subtask…',
      markDone: 'Mark as done',
      errTitle: 'Title is required (2+ characters)',
      errTime: 'Invalid time format',
      errTimeNeedsDate: 'Time requires a date',
      errDeadline: 'Deadline cannot be before the date',
      searchPlaceholder: 'Search tasks…',
      sort: 'Sort',
      sortDate: 'By date',
      sortPriority: 'By priority',
      sortCreated: 'Newest',
      sortTitle: 'By title',
      fActive: 'Active',
      fToday: 'Today',
      fOverdue: 'Overdue',
      fUpcoming: 'Upcoming',
      fDone: 'Done',
      fAll: 'All',
      overdueChip: 'Overdue',
      noDate: 'No date',
      emptyActive: 'No active tasks',
      emptyToday: 'No tasks for today',
      emptyOverdue: 'No overdue tasks — great job!',
      emptyUpcoming: 'No upcoming tasks',
      emptyDone: 'No completed tasks yet',
      emptyAll: 'No tasks at all',
      emptyHint: 'Create your first task and everything will show up here',
      deleteTitle: 'Delete task',
      deleteConfirm: '"{title}" will be permanently deleted with its subtasks. Are you sure?',
      recNextCreated: 'Next occurrence created: {date}',
    },
    projects: {
      sub: '{n} projects',
      new: 'New project',
      edit: 'Edit project',
      name: 'Project name',
      desc: 'Description',
      startDate: 'Start date',
      endDate: 'End date',
      status: 'Status',
      notes: 'Project notes',
      progress: 'Progress',
      tasks: 'Project tasks',
      tasksCount: '{done}/{total} tasks done',
      addTask: 'Add task to project',
      deleteTitle: 'Delete project',
      deleteConfirm: '"{name}" will be deleted — its tasks will remain without a project. Are you sure?',
      errName: 'Name is required (2+ characters)',
      errDates: 'End date cannot be before start date',
      empty: 'No projects yet',
      emptyHint: 'Create a project for university, work, or a personal goal and track its progress',
      noTasks: 'No tasks in this project',
      noTasksHint: 'Add tasks and the progress bar will update automatically',
      st_active: 'Active',
      st_onhold: 'On hold',
      st_done: 'Done',
      st_archived: 'Archived',
    },
    calendar: {
      mDay: 'Day',
      mWeek: 'Week',
      mMonth: 'Month',
      prev: 'Previous',
      next: 'Next',
      more: 'more',
      allDay: 'All day',
      noTimeTasks: 'Tasks without time',
      eventsAndTasks: 'Events & appointments',
      dayEmpty: 'Nothing on this day',
      dayEmptyHint: 'Add an appointment or event',
      newEvent: 'New event / appointment',
      editEvent: 'Edit event',
      deleteEvent: 'Delete event',
      deleteConfirm: '"{title}" will be permanently deleted (including its whole recurrence series). Are you sure?',
      evTitle: 'Title',
      evType: 'Type',
      date: 'Date',
      startTime: 'Start time',
      endTime: 'End time',
      location: 'Location',
      errDate: 'Date is required',
      errEndBeforeStart: 'End time must be after start time',
      recSeriesNote: 'This is a recurring event — edits apply to the whole series',
      ev_appointment: 'Appointment',
      ev_meeting: 'Meeting',
      ev_lecture: 'Lecture',
      ev_exam: 'Exam',
      ev_occasion: 'Occasion',
      ev_personal: 'Personal',
      ev_home: 'Home',
      ev_other: 'Other',
    },
    myday: {
      todayTitle: 'My Day',
      dayTitle: 'Selected day',
      top3: 'Top 3 priorities today',
      pickPriority: 'Pick a priority',
      noCandidates: 'No tasks available — add tasks first',
      timeline: 'Timeline',
      noTime: 'Without a set time',
      review: 'Day review',
      tasksDone: 'Tasks: {done}/{total}',
      eventsCount: 'Events: {n}',
      spentToday: 'Spent today: {amount}',
      accomplished: 'What did you accomplish?',
      deferred: 'What was deferred?',
      workHours: 'Work hours',
      studyHours: 'Study hours',
      rating: 'Rate your day',
      addAt: 'Add at {time}',
    },
    quickadd: {
      title: 'Quick add',
      task: 'Task',
      event: 'Event / appointment',
      project: 'Project',
      expense: 'Expense',
      income: 'Income',
      budget: 'Budget',
      debt: 'Debt',
      contact: 'Contact',
      shopping: 'Shopping item',
      note: 'Note',
      goal: 'Goal',
      habit: 'Habit',
      reminder: 'Reminder',
      comingSoon: 'Will be enabled in phase {phase}',
    },
    expenses: {
      sub: '{n} expenses',
      new: 'New expense',
      edit: 'Edit expense',
      amount: 'Amount',
      category: 'Category',
      date: 'Date',
      time: 'Time',
      method: 'Payment method',
      desc: 'Description',
      entity: 'Person / entity',
      m_cash: 'Cash',
      m_card: 'Card',
      m_transfer: 'Bank transfer',
      m_mobile: 'Mobile wallet',
      m_other: 'Other',
      cat_food: 'Food',
      cat_transport: 'Transport',
      cat_home: 'Home',
      cat_education: 'Education',
      cat_work: 'Work',
      cat_telecom: 'Telecom',
      cat_health: 'Health',
      cat_shopping: 'Shopping',
      cat_bills: 'Bills',
      cat_fun: 'Entertainment',
      cat_travel: 'Travel',
      cat_family: 'Kids / family',
      cat_other: 'Other',
      allCats: 'All categories',
      manageCats: 'Categories',
      newCatPh: 'New category…',
      catHidden: 'Hidden',
      renameCat: 'Rename category',
      delCatTitle: 'Delete category',
      delCatDefault: '"{name}" is a default category — it will be hidden from lists. Existing expenses keep their records.',
      delCatConfirm: '"{name}" will be deleted. Expenses already recorded on it remain. Are you sure?',
      catsNote: 'Default categories are hidden when deleted and can be restored by renaming. Custom ones are deleted permanently.',
      kMonth: 'Spent this month',
      kToday: 'Spent today',
      kTopCat: 'Top spending',
      kAvgDay: 'Daily average',
      empty: 'No expenses yet',
      emptyHint: 'Record your first expense — amounts are exact, no rounding errors',
      emptyMonth: 'No expenses this month',
      emptyMonthHint: 'Try another month or add a new expense',
      deleteTitle: 'Delete expense',
      deleteConfirm: 'Expense "{title}" will be permanently deleted. Are you sure?',
      errAmount: 'Enter a valid amount greater than zero',
      errAmountNeg: 'Amount cannot be negative',
      errAmountPrec: 'Too many decimal places for this currency',
      errDate: 'Date is required',
      hasNote: 'Note',
      otherCat: 'Uncategorized',
      viewAll: 'View all expenses',
    },
    income: {
      sub: '{n} entries',
      new: 'New income',
      edit: 'Edit income',
      source: 'Source',
      desc: 'Description',
      src_salary: 'Salary',
      src_freelance: 'Freelance',
      src_project: 'Project',
      src_extra: 'Extra income',
      src_gift: 'Gift',
      src_other: 'Other',
      kIncome: 'Income this month',
      kExpense: 'Expenses this month',
      kNet: 'Net cash flow',
      netPos: 'You earned more than you spent — nice',
      netNeg: 'You spent more than you earned this month',
      compare: 'Last 6 months comparison',
      trendAria: 'Month {ym}: income {inc}, expenses {exp}',
      empty: 'No income recorded',
      emptyHint: 'Track your income if you like — salary, freelance, or any source',
      deleteTitle: 'Delete income',
      deleteConfirm: 'Income entry "{title}" will be permanently deleted. Are you sure?',
    },
    budgets: {
      sub: '{n} budgets',
      new: 'New budget',
      edit: 'Edit budget',
      general: 'General (all categories)',
      allCats: 'All categories',
      nameLabel: 'Budget name',
      categoryLabel: 'Category',
      periodLabel: 'Period',
      p_daily: 'Daily',
      p_weekly: 'Weekly',
      p_monthly: 'Monthly',
      p_yearly: 'Yearly',
      spentOf: 'Spent {spent} of {amount}',
      remaining: 'Remaining: {amount}',
      projected: 'Projected by month end: {amount} ({pct}%)',
      warnTitle: 'Approaching the limit of "{name}" ({pct}%)',
      overTitle: 'You exceeded the budget "{name}"',
      spentLine: 'Spent {spent} of {amount}',
      topCats: 'Top spending categories',
      noCats: 'No expenses this month yet',
      empty: 'No budgets yet',
      emptyHint: 'Set a spending limit — general or per category, daily or monthly',
      deleteTitle: 'Delete budget',
      deleteConfirm: 'Budget "{name}" will be deleted. Are you sure?',
      disabled: 'Budgets are disabled',
      disabledHint: 'You can enable them in Settings → Features',
    },
    debts: {
      sub: '{n} debts',
      new: 'New debt',
      edit: 'Edit debt',
      tabIou: 'I owe',
      tabOwed: 'Owed to me',
      direction: 'Direction',
      person: 'Person / entity',
      personHint: 'Type a contact name to link automatically',
      amount: 'Original amount',
      date: 'Debt date',
      dueDate: 'Due date',
      reason: 'Reason',
      paid: 'Paid',
      remaining: 'Remaining: {amount}',
      paidOff: 'Fully paid ✓',
      noDueDate: 'No due date',
      payments: 'Payments',
      paymentsCount: 'payment(s)',
      addPayment: 'Add payment',
      paymentAmount: 'Payment amount',
      paymentDate: 'Payment date',
      paymentNote: 'Note',
      paymentsEmpty: 'No payments yet — add one for each partial repayment',
      overpayErr: 'Amount exceeds the remaining ({amount})',
      st_due: 'Due',
      st_partial: 'Partial',
      st_paid: 'Paid',
      st_overdue: 'Overdue',
      kIOwe: 'I still owe',
      kOweMe: 'Owed to me',
      kNet: 'Net position',
      kNetHint: 'owed to me − I owe',
      ofTotal: 'of {amount} total',
      emptyIou: 'No debts on you',
      emptyIouHint: 'Record what you owe and track repayments with due dates',
      emptyOwed: 'Nobody owes you',
      emptyOwedHint: 'Record what others owe you so nothing gets lost',
      deleteTitle: 'Delete debt',
      deleteConfirm: 'The debt to "{person}" will be deleted with all its payments. Are you sure?',
      deletePayment: 'Delete payment',
      deletePaymentConfirm: 'The payment record of {amount} will be deleted and the status recalculated. Are you sure?',
      errPerson: 'Enter the person or entity name',
    },
    contacts: {
      sub: '{n} contacts',
      new: 'New contact',
      edit: 'Edit contact',
      name: 'Name',
      phone: 'Phone',
      email: 'Email',
      relation: 'Relation',
      noRelation: 'Not specified',
      rel_family: 'Family',
      rel_friend: 'Friend',
      rel_work: 'Work',
      rel_client: 'Client',
      rel_neighbor: 'Neighbor',
      rel_other: 'Other',
      timeline: 'Timeline',
      timelineEmpty: 'Nothing linked to this person yet — link a debt, task, or appointment',
      linkedTask: 'Task',
      linkedEvent: 'Appointment / event',
      linkedProject: 'Project',
      linkedDebt: 'Debt',
      debtOwedToMe: 'Debt owed to me',
      debtIOwe: 'Debt I owe',
      payment: 'Payment',
      receivedFrom: 'Received from',
      paidTo: 'Paid to',
      owesMe: 'Owes me',
      iOwe: 'I owe them',
      nDebts: '{n} debts',
      nTasks: '{n} tasks',
      viewAll: 'Contacts',
      empty: 'No contacts yet',
      emptyHint: 'Add the people you deal with and they will link to your debts, tasks and appointments',
      notFound: 'Contact not found',
      deleteTitle: 'Delete contact',
      deleteConfirm: '"{name}" will be deleted — linked debts and tasks remain. Are you sure?',
      errName: 'Name is required (2+ characters)',
      errEmail: 'Invalid email address',
    },
    shopping: {
      sub: '{n} items left',
      newList: 'New list',
      renameList: 'Rename list',
      listName: 'List name',
      listType: 'List type',
      list: 'List',
      type_grocery: 'Grocery',
      type_home: 'Home',
      type_study: 'Study',
      type_work: 'Work',
      type_travel: 'Travel',
      type_custom: 'Custom',
      addItem: 'New item',
      editItem: 'Edit item',
      name: 'Item name',
      qty: 'Quantity',
      qtyPh: '2 · kilo · 2 packs',
      expected: 'Expected price',
      actual: 'Actual price',
      recordActual: 'Record actual price',
      purchasedOn: 'Purchase date',
      markPurchased: 'Purchased',
      addExpense: 'Add to expenses',
      addExpenseHint: 'Creates an expense with this amount and date',
      expenseNote: 'From list: {list}',
      clearPurchased: 'Clear purchased',
      clearPurchasedConfirm: '{n} purchased items will be removed from the list. Are you sure?',
      deleteList: 'Delete list',
      deleteListConfirm: '"{name}" will be deleted with all its items. Are you sure?',
      deleteItem: 'Delete item',
      deleteItemConfirm: '"{name}" will be removed from the list. Are you sure?',
      empty: 'The list is empty',
      emptyHint: 'Type what you need below and press Enter — quantity and price are optional',
      noLists: 'No lists yet',
      statsLine: '{total} items · {purchased} purchased',
      expectedTotal: 'Expected total',
      allBought: 'Everything has been purchased 🎉',
      viewAll: 'Shopping list',
      errName: 'Item name is required',
      errListName: 'List name is required (2+ characters)',
    },
    home: {
      sub: '{n} tasks',
      new: 'Home task',
      edit: 'Edit task',
      area: 'Area',
      allAreas: 'All areas',
      a_cleaning: 'Cleaning',
      a_cooking: 'Cooking',
      a_laundry: 'Laundry',
      a_maintenance: 'Maintenance',
      a_bills: 'Bills',
      a_other: 'Other',
      recHint: 'Recurring tasks automatically create their next occurrence when completed — e.g. "Clean the kitchen — daily"',
      needsList: 'Needs list',
      kToday: 'Today\u2019s tasks',
      kOverdue: 'Overdue',
      kDoneToday: 'Done today',
      upcomingEvents: 'Upcoming home appointments',
      noEvents: 'No upcoming home appointments — add them from the calendar with type "Home"',
      empty: 'No home tasks',
      emptyHint: 'Add cleaning, cooking and bills tasks — recurring ones renew automatically',
      allDoneToday: 'No pending home tasks — well done 🎉',
      viewAll: 'Home tasks',
      disabled: 'Home management is disabled',
      disabledHint: 'You can enable it in Settings → Features',
      deleteTitle: 'Delete task',
      deleteConfirm: '"{title}" will be permanently deleted. Are you sure?',
    },
    study: {
      sub: '{n} subjects',
      tOverview: 'Overview',
      tAssignments: 'Assignments',
      tSubjects: 'Subjects',
      tSessions: 'Study sessions',
      newSubject: 'New subject',
      editSubject: 'Edit subject',
      subjectName: 'Subject name',
      teacher: 'Teacher',
      room: 'Room',
      schedule: 'Schedule',
      schedulePh: 'Sun & Tue 10AM — Tue 12PM',
      subject: 'Subject',
      noSubject: 'No subject',
      newExam: 'New exam',
      editExam: 'Edit exam',
      examTitle: 'Exam title',
      examTitlePh: 'Midterm exam',
      newAssignment: 'New assignment',
      editAssignment: 'Edit assignment',
      asgTitle: 'Task',
      due: 'Due',
      logSession: 'Log session',
      editSession: 'Edit session',
      duration: 'Duration (minutes)',
      kHours: 'Hours this week',
      kHoursSub: 'Last 7 days',
      kAssignments: 'Open assignments',
      kOverdue: 'Overdue: {n}',
      kNextExam: 'Next exam',
      upcomingExams: 'Upcoming exams',
      noExams: 'No upcoming exams — study calmly',
      bySubject: 'Study hours by subject',
      noSessions: 'No sessions yet — log your first study session',
      noSessionsHint: 'Log each session to know your real hours per subject',
      recentSessions: 'Recent sessions',
      noAssignments: 'No assignments',
      noAssignmentsHint: 'Add an assignment with a due date and priority',
      noSubjects: 'No subjects yet',
      noSubjectsHint: 'Add your subjects with teacher, room and schedule',
      today: 'Today',
      tomorrow: 'Tomorrow',
      inDays: 'In {n} days',
      pastDays: '{n} days ago',
      hourShort: 'h',
      minShort: 'm',
      viewAll: 'Study',
      errSubject: 'Subject name is required (2+ characters)',
      errMinutes: 'Enter a valid duration in minutes',
      deleteSubject: 'Delete subject',
      deleteSubjectConfirm: '"{name}" will be deleted — its exams, assignments and sessions remain. Are you sure?',
      deleteExam: 'Delete exam',
      deleteExamConfirm: 'Exam "{name}" will be permanently deleted. Are you sure?',
      deleteAsg: 'Delete assignment',
      deleteAsgConfirm: 'Assignment "{title}" will be permanently deleted. Are you sure?',
      deleteSession: 'Delete session',
      deleteSessionConfirm: 'This session record will be deleted. Are you sure?',
      disabled: 'Study is disabled',
      disabledHint: 'You can enable it in Settings → Features',
    },
    work: {
      sub: 'Workspace: {ws}',
      newTask: 'Work task',
      newMeeting: 'Meeting',
      logHours: 'Log hours',
      hoursToday: 'Hours today',
      hoursHint: 'Added to what is already logged today (e.g. 1.5)',
      loggedToday: 'Logged today',
      resetToday: 'Reset today',
      resetConfirm: 'Today\u2019s work hours will be reset to zero. Are you sure?',
      kOpenTasks: 'Open tasks',
      kToday: 'Today: {n}',
      kMeetings: 'Meetings today',
      kUpcoming: 'Upcoming: {n}',
      kHours: 'Hours this week',
      kHoursSub: 'From your day reviews',
      kClients: 'Clients',
      openTasks: 'Open work tasks',
      noTasks: 'No open work tasks in the workspace',
      upcomingMeetings: 'Upcoming meetings',
      noMeetings: 'No upcoming meetings',
      hoursWeek: 'Work hours — last 7 days',
      clients: 'Clients',
      noClients: 'No clients — add them in Contacts with relation "Client"',
      viewAll: 'Work',
      errHours: 'Enter valid hours (0-24)',
      disabled: 'Work is disabled',
      disabledHint: 'You can enable it in Settings → Features',
    },
    habits: {
      sub: '{n} habits',
      new: 'New habit',
      edit: 'Edit habit',
      name: 'Habit name',
      schedule: 'Schedule',
      sch_daily: 'Daily',
      sch_days: 'Specific days',
      sch_weekly: 'Weekly',
      sch_numeric: 'Numeric target (n daily)',
      targetLabel: 'Daily target',
      targetHint: 'e.g. 8 glasses of water',
      daysLabel: 'Habit days',
      streak: 'Streak',
      adherence: 'Adherence',
      adhLine: 'Last 30 days: {done} of {total}',
      restDay: 'Rest day',
      markToday: 'Done today',
      plus: 'Increase',
      minus: 'Decrease',
      noneToday: 'No habits scheduled today — full rest day',
      empty: 'No habits yet',
      emptyHint: 'Exercise, reading, water… start with one habit you can keep',
      viewAll: 'Habits',
      errName: 'Habit name is required (2+ characters)',
      errDays: 'Pick at least one day',
      errTarget: 'Enter a valid numeric target (1 or more)',
      deleteTitle: 'Delete habit',
      deleteConfirm: '"{name}" will be deleted with its whole log. Are you sure?',
      disabled: 'Habits are disabled',
      disabledHint: 'You can enable them in Settings → Features',
    },
    goals: {
      sub: '{n} goals',
      new: 'New goal',
      edit: 'Edit goal',
      name: 'Goal name',
      category: 'Category',
      c_personal: 'Personal',
      c_financial: 'Financial',
      c_study: 'Study',
      c_career: 'Career',
      c_fitness: 'Fitness / health',
      c_home: 'Home',
      c_project: 'Project',
      progress: 'Progress',
      steps: 'Steps',
      stepsHint: 'With steps, progress is computed automatically from them',
      stepPh: 'New step then Enter…',
      fArchived: 'On hold / cancelled',
      st_active: 'Active',
      st_onhold: 'On hold',
      st_done: 'Done',
      st_cancelled: 'Cancelled',
      empty: 'No goals yet',
      emptyHint: 'Big dream? Break it into steps and watch the percentage rise',
      viewAll: 'Goals',
      errName: 'Goal name is required (2+ characters)',
      deleteTitle: 'Delete goal',
      deleteConfirm: '"{name}" will be deleted with its steps. Are you sure?',
    },
    notes: {
      sub: '{n} notes',
      new: 'New note',
      edit: 'Edit note',
      title: 'Title',
      titlePh: 'Title (optional)',
      body: 'Text',
      type: 'Type',
      allTypes: 'All',
      t_general: 'General',
      t_work: 'Work',
      t_study: 'Study',
      t_home: 'Home',
      t_project: 'Project',
      t_idea: 'Idea',
      t_personal: 'Personal',
      pin: 'Pin',
      searchPh: 'Search notes…',
      empty: 'No notes yet',
      emptyHint: 'An idea, a list, a phone number… anything worth keeping',
      emptyFiltered: 'No matching results',
      errEmpty: 'Write a title or some text before saving',
      deleteTitle: 'Delete note',
      deleteConfirm: '"{title}" will be permanently deleted. Are you sure?',
    },
    reminders: {
      sub: '{n} open reminders',
      subOverdue: '{n} reminder(s) due now!',
      new: 'New reminder',
      edit: 'Edit reminder',
      title: 'Reminder',
      linkTo: 'Relates to',
      l_none: 'General',
      l_task: 'Task',
      l_bill: 'Bill',
      l_debt: 'Debt',
      l_shopping: 'Shopping',
      l_exam: 'Exam',
      l_habit: 'Habit',
      l_goal: 'Goal',
      l_event: 'Appointment',
      ref: 'Free reference',
      refPh: 'e.g. electricity bill',
      tUpcoming: 'Upcoming',
      tDone: 'Done',
      markDone: 'Done',
      rescheduled: 'Rescheduled to {date}',
      dueAt: '{date} {time}',
      inAppNote: 'Reminders always appear inside the app — system notifications can be enabled if your browser supports them',
      enableNotif: 'Enable system notifications',
      notifOn: 'System notifications enabled',
      notifOff: 'Not enabled — reminders will stay inside the app',
      empty: 'No upcoming reminders',
      emptyDone: 'No completed reminders',
      emptyHint: 'Bills, debt payments, appointments… nothing slips away',
      errTitle: 'Write the reminder text (2+ characters)',
      deleteTitle: 'Delete reminder',
      deleteConfirm: 'Reminder "{title}" will be permanently deleted. Are you sure?',
    },
    analytics: {
      money: 'Money',
      time: 'Time & tasks',
      netDebts: 'Net debts',
      youOwe: 'You owe {a} · Owed {b}',
      kTasks: 'Tasks in period',
      kDoneSub: '{n} completed',
      completion: 'Completion',
      plannedTime: 'Planned time',
      actualTime: 'Actual logged time',
      actualTimeHint: 'Study sessions + work hours',
      completions: 'Daily completions (last 14 days)',
      examsThisMonth: 'Exams this month',
      tasksDone: 'Tasks done',
      activeProjects: 'Active projects',
      homeTasksDone: 'Home tasks done',
      itemsBought: 'Items purchased',
      billsThisMonth: 'Bills this month',
      habitCheckins: 'Habit check-ins',
      activeDays: 'Active days',
    },
    reports: {
      p_today: 'Today',
      p_week: 'Week',
      p_month: 'Month',
      p_year: 'Year',
      printPdf: 'Print / PDF',
      csvDone: 'Report exported: {name}',
    },
    search: {
      title: 'Global search',
      sub: 'One search across all your data — people, debts, tasks, events, notes…',
      ph: 'Type at least 2 characters… e.g. Ahmed',
      allTypes: 'All',
      helpTitle: 'Search everything',
      helpHint: 'Type a name or word — contacts, debts and payments, tasks, events, notes, projects, expenses, habits, goals, shopping',
      noResults: 'No matching results',
      noResultsHint: 'Try a shorter word or check the spelling',
    },
    insights: {
      overdueTasks: 'You have {n} overdue tasks',
      tasksLeft: '{n} tasks left today',
      allDone: 'All of today\'s tasks are done — great work!',
      eventsToday: 'You have {n} events today',
      spentToday: 'Spent today: {amount}',
      debtDueToday: 'A debt is due today ({n})',
      debtDueTomorrow: 'A debt payment is due tomorrow ({n})',
      debtDueSoon: '{n} debts due within 3 days',
      debtOverdue: 'You have {n} overdue debts',
      habitsToday: 'Today\'s habits: {done}/{total}',
      examSoon: 'Exam coming up — in {days} days',
    },
  };

  const i18n = {
    _dict: { ar, en },

    lang() {
      return (LF.store && LF.store.settings && LF.store.settings.lang) ||
        (LF.util.ls.get('lf.prefs', {}) || {}).lang || 'ar';
    },

    t(key, params) {
      const lang = i18n.lang();
      let val = lookup(i18n._dict[lang], key);
      if (val === undefined) val = lookup(i18n._dict.en, key);
      if (val === undefined) return key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          val = val.split('{' + k + '}').join(String(v));
        }
      }
      return val;
    },

    locale() {
      const s = LF.store && LF.store.settings;
      const lang = (s && s.lang) || 'ar';
      const numerals = (s && s.numerals) === 'arab' ? 'arab' : 'latn';
      return lang + '-u-nu-' + numerals;
    },

    fmtDate(date, preset) {
      const s = LF.store && LF.store.settings;
      const lang = (s && s.lang) || 'ar';
      const locale = i18n.locale();
      const opts = {
        full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
        long: { year: 'numeric', month: 'long', day: 'numeric' },
        medium: { year: 'numeric', month: 'short', day: 'numeric' },
        weekday: { weekday: 'long' },
        dayMonth: { day: 'numeric', month: 'long' },
        monthYear: { month: 'long', year: 'numeric' },
      }[preset] || { year: 'numeric', month: 'long', day: 'numeric' };
      try {
        return new Intl.DateTimeFormat(locale, opts).format(date);
      } catch (e) {
        return LF.util.ymd(date);
      }
    },

    fmtTime(date) {
      const s = LF.store && LF.store.settings;
      const h12 = s && s.timeFormat === '12h';
      try {
        return new Intl.DateTimeFormat(i18n.locale(), {
          hour: 'numeric', minute: '2-digit', hour12: h12,
        }).format(date);
      } catch (e) {
        return LF.util.pad2(date.getHours()) + ':' + LF.util.pad2(date.getMinutes());
      }
    },

    /** weekday name by index 0=Sunday..6=Saturday (2023-01-01 was a Sunday) */
    weekdayName(i) {
      const d = new Date(2023, 0, 1 + (i % 7));
      try {
        return new Intl.DateTimeFormat(i18n.locale(), { weekday: 'long' }).format(d);
      } catch (e) {
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i % 7];
      }
    },

    money(minor) {
      const s = LF.store && LF.store.settings;
      return LF.money.format(minor, {
        currency: s && s.currency, lang: s && s.lang, numerals: s && s.numerals,
      });
    },

    num(n) {
      try {
        return new Intl.NumberFormat(i18n.locale()).format(n);
      } catch (e) {
        return String(n);
      }
    },
  };

  function lookup(obj, key) {
    if (!obj) return undefined;
    const parts = String(key).split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = cur[p];
    }
    return typeof cur === 'string' ? cur : undefined;
  }

  LF.i18n = i18n;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/icons.js ===== */
/* ============================================================
   LifeFlow — Icon registry (inline SVG, stroke style, trusted constants)
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};

  LF.ICONS = {
    logo: '<path d="M12 2.7c3.4 4.2 6.2 7.4 6.2 10.6a6.2 6.2 0 1 1-12.4 0C5.8 10.1 8.6 6.9 12 2.7z"/>',
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    settings: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    'check-circle': '<path d="M21.8 10A10 10 0 1 1 17 3.34"/><path d="m9 11 3 3L22 4"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
    edit: '<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    'list-checks': '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    droplet: '<path d="M12 2.7c3.4 4.2 6.2 7.4 6.2 10.6a6.2 6.2 0 1 1-12.4 0C5.8 10.1 8.6 6.9 12 2.7z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    'wifi-off': '<line x1="2" y1="2" x2="22" y2="22"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M5 12.86a10 10 0 0 1 5.17-2.69"/><path d="M19 12.86a10 10 0 0 0-2.007-1.523"/><path d="M2 8.82a15 15 0 0 1 4.177-2.643"/><path d="M22 8.82a15 15 0 0 0-11.288-3.764"/><path d="M12 20h.01"/>',
    refresh: '<path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    'arrow-up': '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
    'arrow-down': '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 8 11 8a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 1 12s4 8 11 8a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    home: '<path d="m3 10.5 9-7.5 9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    chart: '<path d="M3 3v18h18"/><polyline points="7 14 11 10 14 13 19 7"/>',
    clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
    banknote: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    'credit-card': '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
    'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    folder: '<path d="M4 4h6l2 3h8a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>',
    palette: '<path d="M12 22a10 10 0 1 1 10-10c0 1.66-1.34 3-3 3h-2a2 2 0 0 0-2 2c0 .5.2 1 .5 1.4.3.4.5.9.5 1.4a2.2 2.2 0 0 1-2.2 2.2z"/><circle cx="7.5" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="10.5" cy="7.5" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="7.5" r="1" fill="currentColor" stroke="none"/><circle cx="17.5" cy="11.5" r="1" fill="currentColor" stroke="none"/>',
    'more-h': '<circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/>',
    flame: '<path d="M12 2c1.5 3.5-2 5-2 8a2.5 2.5 0 0 0 5 0c0-.8-.3-1.5-.6-2 2.6 1.2 4.1 3.7 4.1 6A6.5 6.5 0 0 1 5.5 14c0-4.5 4.5-6.5 6.5-12z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>',
    'map-pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/db.js ===== */
/* ============================================================
   LifeFlow — Data Layer
   IndexedDB (primary) with in-memory fallback (sandboxed previews
   / very old browsers). Every user-scoped record carries `userId`
   and ALL queries are scoped to the signed-in user — data isolation
   is enforced here, not only in the UI.
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const U = LF.util;

  const DB_NAME = 'lifeflow';
  const DB_VERSION = 2;

  /* Schema: key = store name; idx = extra indexes. All stores use
     keyPath 'id'. `scope:true` stores are per-user. */
  const STORE_DEFS = {
    users: { scope: false, idx: [] },
    settings: { scope: true, idx: [] },
    workspaces: { scope: true, idx: [] },
    notifications: { scope: true, idx: [] },
    tasks: { scope: true, idx: ['date', 'projectId'] },
    subtasks: { scope: true, idx: ['taskId'] },
    projects: { scope: true, idx: ['workspaceId'] },
    events: { scope: true, idx: ['date'] },
    expenses: { scope: true, idx: ['date', 'categoryId'] },
    expenseCategories: { scope: true, idx: [] },
    budgets: { scope: true, idx: [] },
    incomes: { scope: true, idx: ['date'] },
    debts: { scope: true, idx: [] },
    debtPayments: { scope: true, idx: ['debtId'] },
    contacts: { scope: true, idx: [] },
    shoppingLists: { scope: true, idx: [] },
    shoppingItems: { scope: true, idx: ['listId'] },
    homeTasks: { scope: true, idx: ['date'] },
    habits: { scope: true, idx: [] },
    habitLogs: { scope: true, idx: ['habitId', 'date'] },
    goals: { scope: true, idx: [] },
    goalSteps: { scope: true, idx: ['goalId'] },
    notes: { scope: true, idx: [] },
    reminders: { scope: true, idx: ['date'] },
    subjects: { scope: true, idx: [] },
    exams: { scope: true, idx: ['date'] },
    assignments: { scope: true, idx: ['dueDate'] },
    studySessions: { scope: true, idx: ['date'] },
    dayReviews: { scope: true, idx: ['date'] },
  };
  const STORES = Object.keys(STORE_DEFS);

  const db = {
    backend: null,   // 'idb' | 'memory'
    _idb: null,
    _mem: null,

    open() {
      if (db._opened) return db._opened;
      db._opened = db._openIdb().catch(() => {
        db.backend = 'memory';
        db._mem = {};
        for (const s of STORES) db._mem[s] = new Map();
        return 'memory';
      });
      return db._opened;
    },

    _openIdb() {
      return new Promise((resolve, reject) => {
        if (!root.indexedDB) { reject(new Error('no idb')); return; }
        let req;
        try { req = root.indexedDB.open(DB_NAME, DB_VERSION); }
        catch (e) { reject(e); return; }
        req.onupgradeneeded = (ev) => {
          const idb = req.result;
          for (const name of STORES) {
            let store;
            if (!idb.objectStoreNames.contains(name)) {
              store = idb.createObjectStore(name, { keyPath: 'id' });
            } else {
              store = ev.target.transaction.objectStore(name);
            }
            const def = STORE_DEFS[name];
            if (def.scope && !store.indexNames.contains('userId')) {
              store.createIndex('userId', 'userId', { unique: false });
            }
            for (const ix of def.idx) {
              if (!store.indexNames.contains(ix)) store.createIndex(ix, ix, { unique: false });
            }
          }
        };
        req.onsuccess = () => {
          const idb = req.result;
          idb.onversionchange = () => { try { idb.close(); } catch (e) { /* noop */ } };
          db._idb = idb;
          db.backend = 'idb';
          resolve('idb');
        };
        req.onerror = () => reject(req.error || new Error('idb open failed'));
        req.onblocked = () => reject(new Error('idb blocked'));
      });
    },

    _assertReady() {
      if (!db.backend) throw new Error('db not open');
    },
    _scopeOf(name) { return STORE_DEFS[name] && STORE_DEFS[name].scope; },
    _userId(opts) {
      if (opts && opts.all) return null;
      const auth = LF.auth;
      const uid = auth && auth.currentId ? auth.currentId() : null;
      return uid;
    },

    /* ---------- CRUD ---------- */
    /**
     * put(store, record[, opts])
     * - stamps id / createdAt / updatedAt (+ userId for scoped stores)
     * - opts.all: bypass user scoping (auth internals only)
     */
    async put(store, record, opts) {
      db._assertReady();
      if (!STORE_DEFS[store]) throw new Error('unknown store: ' + store);
      const rec = U.clone(record);
      const now = new Date().toISOString();
      if (!rec.id) rec.id = U.uid();
      if (!rec.createdAt) rec.createdAt = now;
      rec.updatedAt = now;
      const uid = db._userId(opts);
      if (db._scopeOf(store)) {
        if (uid) rec.userId = uid;
        else if (!opts || !opts.all) throw new Error('no signed-in user for scoped put');
        else rec.userId = rec.userId || null;
      }
      if (db.backend === 'memory') {
        db._mem[store].set(rec.id, U.clone(rec));
        if (LF.store && LF.store.emit) LF.store.emit('data:changed',{store});
        return U.clone(rec);
      }
      const idb = db._idb;
      return new Promise((resolve, reject) => {
        const tx = idb.transaction(store, 'readwrite');
        tx.objectStore(store).put(rec);
        tx.oncomplete = () => { const out=U.clone(rec); if(LF.store&&LF.store.emit) LF.store.emit('data:changed',{store}); resolve(out); };
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('tx aborted'));
      });
    },

    async get(store, id, opts) {
      db._assertReady();
      if (!STORE_DEFS[store] || id == null) return null;
      let rec;
      if (db.backend === 'memory') {
        rec = db._mem[store].get(id) || null;
        if (rec) rec = U.clone(rec);
      } else {
        const idb = db._idb;
        rec = await new Promise((resolve, reject) => {
          const tx = idb.transaction(store, 'readonly');
          const rq = tx.objectStore(store).get(id);
          rq.onsuccess = () => resolve(rq.result || null);
          rq.onerror = () => reject(rq.error);
        });
      }
      if (!rec) return null;
      const uid = db._userId(opts);
      if (uid != null && db._scopeOf(store) && rec.userId !== uid) return null;
      return rec;
    },

    /**
     * list(store[, opts]) — always scoped to current user unless opts.all.
     * opts: { all, predicate, sortKey, sortDir (1|-1), limit }
     */
    async list(store, opts) {
      db._assertReady();
      opts = opts || {};
      if (!STORE_DEFS[store]) throw new Error('unknown store: ' + store);
      const uid = db._userId(opts);
      let arr;
      if (db.backend === 'memory') {
        arr = Array.from(db._mem[store].values()).map(r => U.clone(r));
        if (uid != null && db._scopeOf(store)) arr = arr.filter(r => r.userId === uid);
      } else if (uid != null && db._scopeOf(store) && db._idb) {
        arr = await new Promise((resolve, reject) => {
          const tx = db._idb.transaction(store, 'readonly');
          const os = tx.objectStore(store);
          let rq;
          try { rq = os.index('userId').getAll(uid); }
          catch (e) { rq = os.getAll(); }
          rq.onsuccess = () => resolve(rq.result || []);
          rq.onerror = () => reject(rq.error);
        });
        if (db._scopeOf(store) && uid != null) arr = arr.filter(r => r.userId === uid);
      } else {
        arr = await new Promise((resolve, reject) => {
          const tx = db._idb.transaction(store, 'readonly');
          const rq = tx.objectStore(store).getAll();
          rq.onsuccess = () => resolve(rq.result || []);
          rq.onerror = () => reject(rq.error);
        });
        if (uid != null && db._scopeOf(store)) arr = arr.filter(r => r.userId === uid);
      }
      if (opts.predicate) arr = arr.filter(opts.predicate);
      if (opts.sortKey) {
        const dir = opts.sortDir === -1 ? -1 : 1;
        arr.sort((a, b) => {
          const x = a[opts.sortKey], y = b[opts.sortKey];
          if (x == null && y == null) return 0;
          if (x == null) return 1;
          if (y == null) return -1;
          return x < y ? -dir : x > y ? dir : 0;
        });
      }
      if (opts.limit) arr = arr.slice(0, opts.limit);
      return arr;
    },

    async delete(store, id, opts) {
      db._assertReady();
      if (!STORE_DEFS[store]) throw new Error('unknown store: ' + store);
      if (id == null) return false;
      if (db.backend === 'memory') {
        const rec = db._mem[store].get(id);
        if (!rec) return false;
        const uid = db._userId(opts);
        if (uid != null && db._scopeOf(store) && rec.userId !== uid) return false;
        db._mem[store].delete(id);
        if(LF.store&&LF.store.emit) LF.store.emit('data:changed',{store});
        return true;
      }
      const uid = db._userId(opts);
      if (uid != null && db._scopeOf(store)) {
        const rec = await db.get(store, id, opts);
        if (!rec) return false;
      }
      return new Promise((resolve, reject) => {
        const tx = db._idb.transaction(store, 'readwrite');
        tx.objectStore(store).delete(id);
        tx.oncomplete = () => { if(LF.store&&LF.store.emit) LF.store.emit('data:changed',{store}); resolve(true); };
        tx.onerror = () => reject(tx.error);
      });
    },

    async count(store, opts) {
      const arr = await db.list(store, opts);
      return arr.length;
    },

    /** Wipe every record of a user across all scoped stores (account deletion). */
    async deleteAllForUser(userId) {
      db._assertReady();
      for (const store of STORES) {
        if (!db._scopeOf(store)) continue;
        if (db.backend === 'memory') {
          for (const [id, rec] of Array.from(db._mem[store].entries())) {
            if (rec.userId === userId) db._mem[store].delete(id);
          }
        } else {
          const recs = await new Promise((resolve, reject) => {
            const tx = db._idb.transaction(store, 'readonly');
            let rq;
            try { rq = tx.objectStore(store).index('userId').getAll(userId); }
            catch (e) { rq = tx.objectStore(store).getAll(); }
            rq.onsuccess = () => resolve((rq.result || []).filter(r => r.userId === userId));
            rq.onerror = () => reject(rq.error);
          });
          if (!recs.length) continue;
          await new Promise((resolve, reject) => {
            const tx = db._idb.transaction(store, 'readwrite');
            const os = tx.objectStore(store);
            for (const r of recs) os.delete(r.id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });
        }
      }
    },

    /** Full export of the current user's data (scoped stores only). */
    /** delete ALL records of the signed-in user in one scoped store
        (used by backup restore). Returns the number removed. */
    async clearScoped(store, opts) {
      db._assertReady();
      if (!STORE_DEFS[store]) throw new Error('unknown store: ' + store);
      if (!db._scopeOf(store)) throw new Error('store is not user-scoped: ' + store);
      const uid = db._userId(opts);
      if (!uid) throw new Error('no signed-in user for clearScoped');
      const mine = await db.list(store, opts || {});
      for (const r of mine) await db.delete(store, r.id);
      return mine.length;
    },

    async exportUser() {
      const out = {};
      const uid = db._userId({});
      if (!uid) return out;
      for (const store of STORES) {
        if (!db._scopeOf(store)) continue;
        out[store] = await db.list(store, {});
      }
      return out;
    },
  };

  LF.db = db;
  LF.STORES = STORES;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/auth.js ===== */
/* ============================================================
   LifeFlow — Local Authentication
   Accounts live on THIS device only. Passwords are never stored:
   PBKDF2-SHA256 (WebCrypto, 120k iterations) with a per-user random
   salt; pure-JS iterated SHA-256 fallback for non-secure contexts.
   A failed-login lockout throttles brute-force attempts.
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const U = LF.util;

  const PBKDF2_ITER = 120000;
  const FALLBACK_ITER = 12000;
  const LOCK_AFTER = 5;
  const LOCK_MS = 30000;

  const AVATAR_COLORS = ['#0d9488', '#4f46e5', '#e11d48', '#b45309', '#0369a1', '#7c3aed', '#be185d', '#15803d'];

  function bufToHex(buf) {
    const v = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < v.length; i++) s += v[i].toString(16).padStart(2, '0');
    return s;
  }

  function randomSalt() {
    const b = new Uint8Array(16);
    try { root.crypto.getRandomValues(b); }
    catch (e) {
      for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
    }
    return bufToHex(b);
  }

  async function pbkdf2Hash(password, salt, iterations) {
    const enc = new TextEncoder();
    const key = await root.crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await root.crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations },
      key, 256
    );
    return bufToHex(bits);
  }

  function fallbackHash(password, salt, iterations) {
    let h = U.sha256(salt + ':' + password);
    for (let i = 1; i < iterations; i++) h = U.sha256(salt + ':' + h);
    return h;
  }

  async function computeHash(password, salt, iterations, algo) {
    if (algo === 'PBKDF2') {
      try { return await pbkdf2Hash(password, salt, iterations); }
      catch (e) { /* fall through to fallback */ }
    }
    return fallbackHash(password, salt, iterations);
  }

  const auth = {
    _current: null,
    _lock: { fails: 0, until: 0 },

    current() { return auth._current; },
    currentId() { return auth._current ? auth._current.id : null; },

    /** Restore session after db.open(). */
    async init() {
      const sess = U.ls.get('lf.session');
      if (!sess || !sess.uid) return null;
      const user = await LF.db.get('users', sess.uid, { all: true });
      if (!user) { U.ls.remove('lf.session'); return null; }
      auth._current = user;
      return user;
    },

    _setSession(user) {
      auth._current = user;
      U.ls.set('lf.session', { uid: user.id, t: Date.now() });
    },

    /** Public account list (no hash material leaves this module). */
    async accounts() {
      const users = await LF.db.list('users', { all: true, sortKey: 'createdAt', sortDir: 1 });
      return users.map(u => ({
        id: u.id, name: u.name, username: u.username,
        avatarColor: u.avatarColor, googleSub: u.googleSub || null, createdAt: u.createdAt,
      }));
    },

    _validate(name, username, password) {
      const t = (root.LF && LF.i18n && LF.i18n.t) ? (k, p) => LF.i18n.t(k, p) : (k) => k;
      const n = String(name || '').trim();
      const un = String(username || '').trim().toLowerCase();
      const pw = String(password || '');
      if (n.length < 2 || n.length > 40) return { error: 'auth.errName' };
      if (!/^[a-z0-9_.-]{3,20}$/.test(un)) return { error: 'auth.errUsername' };
      if (pw.length < 6 || pw.length > 128) return { error: 'auth.errPassword' };
      return { name: n, username: un, password: pw };
    },

    async usernameTaken(username) {
      const users = await LF.db.list('users', { all: true });
      return users.some(u => u.username === username);
    },

    async register({ name, username, password }) {
      const v = auth._validate(name, username, password);
      if (v.error) throw { code: v.error };
      if (await auth.usernameTaken(v.username)) throw { code: 'auth.errUsernameTaken' };

      const salt = randomSalt();
      let algo = 'PBKDF2', iterations = PBKDF2_ITER, hash;
      try {
        if (!(root.crypto && root.crypto.subtle)) throw new Error('no subtle');
        hash = await pbkdf2Hash(v.password, salt, iterations);
      } catch (e) {
        algo = 'SHA256-ITER'; iterations = FALLBACK_ITER;
        hash = fallbackHash(v.password, salt, iterations);
      }

      const user = {
        id: U.uid(),
        name: v.name,
        username: v.username,
        avatarColor: U.hashPick(v.username, AVATAR_COLORS),
        salt, hash, algo, iterations,
        createdAt: new Date().toISOString(),
      };
      await LF.db.put('users', user, { all: true });
      auth._setSession(user);
      return { id: user.id, name: user.name, username: user.username, avatarColor: user.avatarColor };
    },

    async login(userId, password) {
      const now = Date.now();
      if (auth._lock.until > now) {
        throw { code: 'auth.locked', secs: Math.ceil((auth._lock.until - now) / 1000) };
      }
      const user = await LF.db.get('users', userId, { all: true });
      if (!user) throw { code: 'auth.errCredentials' };
      const hash = await computeHash(String(password || ''), user.salt, user.iterations, user.algo);
      if (hash !== user.hash) {
        auth._lock.fails++;
        if (auth._lock.fails >= LOCK_AFTER) {
          auth._lock.until = now + LOCK_MS;
          auth._lock.fails = 0;
        }
        throw { code: 'auth.errCredentials' };
      }
      auth._lock.fails = 0;
      auth._lock.until = 0;
      auth._setSession(user);
      return { id: user.id, name: user.name, username: user.username, avatarColor: user.avatarColor };
    },

    logout() {
      auth._current = null;
      U.ls.remove('lf.session');
    },

    async changePassword(userId, oldPassword, newPassword) {
      const user = await LF.db.get('users', userId, { all: true });
      if (!user) throw { code: 'auth.errCredentials' };
      const oldHash = await computeHash(String(oldPassword || ''), user.salt, user.iterations, user.algo);
      if (oldHash !== user.hash) throw { code: 'auth.errOldPassword' };
      const npw = String(newPassword || '');
      if (npw.length < 6 || npw.length > 128) throw { code: 'auth.errPassword' };
      const salt = randomSalt();
      let algo = 'PBKDF2', iterations = PBKDF2_ITER, hash;
      try {
        if (!(root.crypto && root.crypto.subtle)) throw new Error('no subtle');
        hash = await pbkdf2Hash(npw, salt, iterations);
      } catch (e) {
        algo = 'SHA256-ITER'; iterations = FALLBACK_ITER;
        hash = fallbackHash(npw, salt, iterations);
      }
      user.salt = salt; user.hash = hash; user.algo = algo; user.iterations = iterations;
      user.updatedAt = new Date().toISOString();
      await LF.db.put('users', user, { all: true });
      if (auth._current && auth._current.id === userId) auth._current = user;
    },

    async deleteAccount(userId, password) {
      const user = await LF.db.get('users', userId, { all: true });
      if (!user) throw { code: 'auth.errCredentials' };
      const hash = await computeHash(String(password || ''), user.salt, user.iterations, user.algo);
      if (hash !== user.hash) throw { code: 'auth.errCredentials' };
      await LF.db.deleteAllForUser(userId);
      await LF.db.delete('users', userId, { all: true });
      if (auth._current && auth._current.id === userId) auth.logout();
    },
  };


  auth.googleSignIn = async function () {
    if (!LF.drive || !LF.drive.signInGoogle) throw {code:'googleIdentity'};
    const profile = await LF.drive.signInGoogle();
    const users = await LF.db.list('users', {all:true});
    let user = users.find(u => u.googleSub === profile.sub);
    if (!user) {
      const base = String(profile.email || profile.name || 'googleuser').toLowerCase()
        .replace(/[^a-z0-9_.-]+/g,'').slice(0,16) || 'googleuser';
      let username = base, n = 1;
      while (users.some(u => u.username === username)) username = (base.slice(0,14)+String(n++)).slice(0,20);
      const salt = randomSalt(), generated = U.uid()+U.uid();
      const hash = await computeHash(generated,salt,PBKDF2_ITER,'PBKDF2');
      user = {id:U.uid(),name:String(profile.name||profile.email||'Google User').slice(0,40),
        username,email:profile.email||'',googleSub:profile.sub,avatarColor:U.hashPick(username,AVATAR_COLORS),
        salt,hash,algo:'PBKDF2',iterations:PBKDF2_ITER,createdAt:new Date().toISOString()};
      await LF.db.put('users',user,{all:true});
    }
    auth._setSession(user);
    return user;
  };

  LF.auth = auth;
  LF.AVATAR_COLORS = AVATAR_COLORS;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/store.js ===== */
/* ============================================================
   LifeFlow — App state: settings, workspaces, event bus, export
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const U = LF.util;

  /* Features that can be toggled in onboarding/settings.
     Core features (tasks, calendar, expenses, debts, contacts,
     shopping, notes, goals, reminders, income) are always on. */
  const TOGGLEABLE = ['budget', 'habits', 'study', 'work', 'home'];

  function defaultSettings(userId) {
    return {
      id: userId,
      userId,
      onboarded: false,
      lang: 'ar',
      currency: 'YER',
      timezone: null,        // null = device timezone
      timeFormat: '24h',    // '24h' | '12h'
      numerals: 'latn',     // 'latn' | 'arab'
      weekStart: 0,         // 0=Sunday, 1=Monday, 6=Saturday
      theme: 'system',      // 'system' | 'light' | 'dark'
      accent: 'teal',
      usageTypes: [],       // student | employee | business | home | personal
      features: { budget: true, habits: true, study: false, work: false, home: false },
      dashboard: { hidden: [], order: [] },
      activeWorkspaceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const store = {
    settings: null,
    workspaces: [],
    user: null,

    /* ---------- event bus ---------- */
    _subs: {},
    on(evt, fn) {
      (store._subs[evt] = store._subs[evt] || []).push(fn);
      return () => {
        store._subs[evt] = (store._subs[evt] || []).filter(f => f !== fn);
      };
    },
    emit(evt, data) {
      (store._subs[evt] || []).forEach(fn => {
        try { fn(data); } catch (e) { /* subscriber errors must not break app */ }
      });
    },

    async loadAll() {
      const uid = LF.auth.currentId();
      if (!uid) throw new Error('not signed in');
      const user = await LF.db.get('users', uid, { all: true });
      if (user) store.user = { id: user.id, name: user.name, username: user.username, avatarColor: user.avatarColor };
      const s = await LF.db.get('settings', uid, { all: true });
      store.settings = s && s.onboarded !== undefined ? s : null;
      if (!store.settings) {
        // pre-onboarding draft: keep in memory until onboarding completes
        store.settings = defaultSettings(uid);
        store._draft = true;
      } else {
        store._draft = false;
      }
      store.workspaces = await LF.db.list('workspaces', { sortKey: 'createdAt', sortDir: 1 });
      store.applyPrefs();
    },

    isDraft() { return !!store._draft; },

    async saveSettings(patch) {
      Object.assign(store.settings, patch, { updatedAt: new Date().toISOString() });
      await LF.db.put('settings', store.settings, { all: true });
      store._draft = false;
      store.applyPrefs();
      store.emit('settings:changed', { patch });
    },

    feature(f) {
      const s = store.settings;
      if (!s) return false;
      if (TOGGLEABLE.indexOf(f) === -1) return true;
      return s.features ? s.features[f] !== false : true;
    },

    /* ---------- workspaces ---------- */
    async addWorkspace(name) {
      const ws = {
        name: String(name || '').trim(),
        createdAt: new Date().toISOString(),
      };
      if (!ws.name) throw { code: 'err.required' };
      const rec = await LF.db.put('workspaces', ws);
      store.workspaces.push(rec);
      store.emit('workspaces:changed');
      return rec;
    },

    async renameWorkspace(id, name) {
      const ws = store.workspaces.find(w => w.id === id);
      if (!ws) return;
      const nn = String(name || '').trim();
      if (!nn) throw { code: 'err.required' };
      ws.name = nn;
      await LF.db.put('workspaces', ws);
      store.emit('workspaces:changed');
    },

    async deleteWorkspace(id) {
      if (store.workspaces.length <= 1) throw { code: 'settings.wsLastOne' };
      await LF.db.delete('workspaces', id);
      store.workspaces = store.workspaces.filter(w => w.id !== id);
      if (store.settings.activeWorkspaceId === id) {
        await store.saveSettings({ activeWorkspaceId: store.workspaces[0].id });
      }
      store.emit('workspaces:changed');
    },

    workspace(id) { return store.workspaces.find(w => w.id === id) || null; },
    activeWorkspace() {
      return store.workspace(store.settings && store.settings.activeWorkspaceId) || store.workspaces[0] || null;
    },

    /* ---------- prefs -> DOM ---------- */
    applyPrefs() {
      const s = store.settings;
      const lang = (s && s.lang) || U.ls.get('lf.prefs', {}).lang || 'ar';
      const theme = (s && s.theme) || U.ls.get('lf.prefs', {}).theme || 'system';
      const accent = (s && s.accent) || U.ls.get('lf.prefs', {}).accent || 'teal';
      store.applyLook({ lang, theme, accent });
    },

    applyLook(prefs) {
      const doc = root.document && root.document.documentElement;
      if (!doc) return;
      if (prefs.lang) {
        doc.setAttribute('lang', prefs.lang);
        doc.setAttribute('dir', prefs.lang === 'ar' ? 'rtl' : 'ltr');
      }
      if (prefs.theme) {
        let t = prefs.theme;
        if (t === 'system') {
          t = root.matchMedia && root.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        doc.setAttribute('data-theme', t);
      }
      if (prefs.accent) doc.setAttribute('data-accent', prefs.accent);
      // mirror for pre-login next boot (tiny prefs only — never app data)
      const cur = U.ls.get('lf.prefs', {}) || {};
      U.ls.set('lf.prefs', {
        lang: prefs.lang || cur.lang,
        theme: prefs.theme || cur.theme,
        accent: prefs.accent || cur.accent,
      });
    },

    onSystemThemeChange() {
      const s = store.settings;
      const theme = (s && s.theme) || U.ls.get('lf.prefs', {}).theme || 'system';
      if (theme === 'system') store.applyLook({ theme: 'system' });
    },
  };

  /* ---------- Data export (backup) ---------- */
  const dataMod = {
    async buildBackup() {
      const uid = LF.auth.currentId();
      if (!uid) throw new Error('not signed in');
      const data = await LF.db.exportUser();
      return {
        app: 'LifeFlow',
        format: 2,
        exportedAt: new Date().toISOString(),
        user: { name: store.user ? store.user.name : '', username: store.user ? store.user.username : '' },
        settings: U.clone(store.settings),
        data,
      };
    },

    async _deriveKey(password, salt) {
      if (!root.crypto || !root.crypto.subtle) throw new Error('cryptoUnsupported');
      const enc = new TextEncoder();
      const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
      return crypto.subtle.deriveKey({ name:'PBKDF2', salt, iterations:210000, hash:'SHA-256' }, base, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']);
    },

    async encryptBackup(backup, password) {
      if (!password || password.length < 8) { const e=new Error('passwordTooShort'); e.code=e.message; throw e; }
      const enc = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await dataMod._deriveKey(password, salt);
      const plain = enc.encode(JSON.stringify(backup));
      const cipher = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv}, key, plain));
      const b64 = x => btoa(String.fromCharCode(...x));
      return { app:'LifeFlow', encrypted:true, format:1, algorithm:'AES-GCM-256', kdf:'PBKDF2-SHA-256', iterations:210000, salt:b64(salt), iv:b64(iv), ciphertext:b64(cipher), exportedAt:backup.exportedAt };
    },

    async decryptBackup(obj, password) {
      try {
        if (!obj || obj.app!=='LifeFlow' || !obj.encrypted || !obj.ciphertext || !obj.salt || !obj.iv) throw new Error('bad');
        const fromB64 = s => Uint8Array.from(atob(s), c=>c.charCodeAt(0));
        const key = await dataMod._deriveKey(password, fromB64(obj.salt));
        const plain = await crypto.subtle.decrypt({name:'AES-GCM',iv:fromB64(obj.iv)}, key, fromB64(obj.ciphertext));
        const backup = JSON.parse(new TextDecoder().decode(plain));
        const v = dataMod.validateBackup(backup);
        if (!v.ok) throw new Error('bad');
        return backup;
      } catch(e) { const err=new Error('decryptFailed'); err.code=err.message; throw err; }
    },

    async downloadEncryptedBackup(password) {
      const backup=await dataMod.buildBackup();
      const enc=await dataMod.encryptBackup(backup,password);
      const d=new Date();
      const fname='lifeflow-backup-encrypted-'+U.ymd(d)+'-'+U.pad2(d.getHours())+U.pad2(d.getMinutes())+'.lfb';
      const blob=new Blob([JSON.stringify(enc)],{type:'application/json'});
      const url=URL.createObjectURL(blob), a=document.createElement('a');
      a.href=url; a.download=fname; document.body.appendChild(a); a.click();
      setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},500);
      return fname;
    },

    /** structural validation of a backup file → {ok, reason?, records, stores} */
    validateBackup(obj) {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, reason: 'invalid' };
      if (obj.app !== 'LifeFlow') return { ok: false, reason: 'notLifeflow' };
      if (obj.format !== 1 && obj.format !== 2) return { ok: false, reason: 'badFormat' };
      if (!obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) {
        return { ok: false, reason: 'noData' };
      }
      const stores = {};
      let records = 0;
      for (const k of Object.keys(obj.data)) {
        if (LF.STORES.indexOf(k) === -1) return { ok: false, reason: 'badStore' };
        if (!Array.isArray(obj.data[k])) return { ok: false, reason: 'badStore' };
        stores[k] = obj.data[k].length;
        records += obj.data[k].length;
      }
      return {
        ok: true, records, stores,
        exportedAt: obj.exportedAt || '',
        user: obj.user || {},
        hasSettings: !!obj.settings,
      };
    },

    /**
     * Restore a validated backup INTO the currently signed-in account:
     * each user-scoped store is cleared then re-filled (records are
     * re-stamped with the current userId), and settings are restored
     * when present. Callers must confirm the replace semantics first.
     */
    async restoreBackup(obj) {
      if(LF.drive)LF.drive.auto.suspend=true;
      const v = dataMod.validateBackup(obj);
      if (!v.ok) { const e = new Error(v.reason); e.code = 'settings.restore_' + v.reason; throw e; }
      const uid = LF.auth.currentId();
      if (!uid) throw new Error('not signed in');
      const fail = (reason) => { const e = new Error(reason); e.code = 'settings.restore_' + reason; if (reason === 'idConflict') e.conflict = true; return e; };

      /* 1) pre-flight — nothing is touched until the whole file is proven safe.
         'settings' is handled separately below (obj.settings), never as a data store. */
      const keys = Object.keys(obj.data).filter(k => k !== 'settings');
      for (const k of keys) {
        if (!LF.db._scopeOf(k)) throw fail('badStore');
        for (const rec of obj.data[k]) {
          if (!rec || typeof rec !== 'object' || Array.isArray(rec)) throw fail('badStore');
          if (rec.id != null) {
            /* ids are global keys: never overwrite a record owned by another account */
            const existing = await LF.db.get(k, rec.id, { all: true });
            if (existing && existing.userId !== uid) throw fail('idConflict');
          }
        }
      }

      /* 2) snapshot so a mid-way failure can be rolled back */
      const scoped = LF.STORES.filter(k => k !== 'settings' && LF.db._scopeOf(k));
      const snapshot = await LF.db.exportUser();
      try {
        /* true replace: EVERY user-scoped store is emptied, not only those in the file */
        for (const k of scoped) await LF.db.clearScoped(k);
        let restored = 0;
        for (const k of keys) {
          for (const rec of obj.data[k]) {
            await LF.db.put(k, rec);
            restored++;
          }
        }
        if (obj.settings) {
          await LF.db.put('settings', Object.assign({}, obj.settings, { id: uid }), { all: true });
        }
        if(LF.drive){LF.drive.auto.suspend=false;LF.drive.scheduleAutoBackup();}
        return { restored, stores: v.stores };
      } catch (err) {
        try {
          for (const k of scoped) await LF.db.clearScoped(k);
          for (const k of scoped) for (const rec of (snapshot[k] || [])) await LF.db.put(k, rec);
        } catch (e2) { /* best effort */ }
        if(LF.drive)LF.drive.auto.suspend=false;
        throw err;
      }
    },

    downloadBackup() {
      return dataMod.buildBackup().then(backup => {
        const d = new Date();
        const fname = 'lifeflow-backup-' + U.ymd(d) + '-' + U.pad2(d.getHours()) + U.pad2(d.getMinutes()) + '.json';
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fname;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 400);
        return fname;
      });
    },
  };

  /* ---------- Google Drive appDataFolder backup (optional) ---------- */
  const drive = {
    token:null, clientId:'', gisPromise:null, googleUser:null,
    auto:{enabled:false,timer:null,busy:false,last:null,suspend:false},
    loadGIS(){
      if(this.gisPromise)return this.gisPromise;
      this.gisPromise=new Promise((resolve,reject)=>{
        if(root.google&&root.google.accounts&&root.google.accounts.oauth2)return resolve();
        const sc=document.createElement('script');sc.src='https://accounts.google.com/gsi/client';sc.async=true;
        sc.onload=()=>resolve();sc.onerror=()=>reject(new Error('gisLoad'));document.head.appendChild(sc);
      });return this.gisPromise;
    },
    getClientId(){return U.ls.get('lf.drive.clientId','')||root.LF_GOOGLE_CLIENT_ID||'';},
    saveClientId(v){this.clientId=String(v||'').trim();U.ls.set('lf.drive.clientId',this.clientId);},
    async connect(opts){
      opts=opts||{};this.clientId=this.getClientId();
      if(!this.clientId){const e=new Error('driveNeedClient');e.code=e.message;throw e;}
      await this.loadGIS();
      const scopes=opts.identity?'openid profile email https://www.googleapis.com/auth/drive.appdata':'https://www.googleapis.com/auth/drive.appdata';
      return new Promise((resolve,reject)=>{
        const c=root.google.accounts.oauth2.initTokenClient({client_id:this.clientId,scope:scopes,
          callback:r=>{if(r.error)reject(r);else{this.token=r.access_token;resolve(r);}}});
        c.requestAccessToken({prompt:this.token?'':'consent'});
      });
    },
    async signInGoogle(){
      await this.connect({identity:true});
      const r=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+this.token}});
      if(!r.ok)throw Object.assign(new Error('googleIdentity'),{code:'googleIdentity'});
      const p=await r.json();if(!p.sub)throw Object.assign(new Error('googleIdentity'),{code:'googleIdentity'});
      this.googleUser=p;return p;
    },
    headers(){if(!this.token)throw new Error('driveNotConnected');return {Authorization:'Bearer '+this.token};},
    async _findFile(name){
      const q=encodeURIComponent("name='"+name+"' and 'appDataFolder' in parents and trashed=false");
      const r=await fetch('https://www.googleapis.com/drive/v3/files?q='+q+'&spaces=appDataFolder&fields=files(id,name,modifiedTime)',{headers:this.headers()});
      if(!r.ok)throw new Error('driveList');const j=await r.json();return j.files&&j.files[0]||null;
    },
    async _uploadText(name,text,mime){
      const b='lf_'+Math.random().toString(16).slice(2);
      const meta=JSON.stringify({name,parents:['appDataFolder'],mimeType:mime||'application/octet-stream'});
      const payload='--'+b+'\\r\\nContent-Type: application/json; charset=UTF-8\\r\\n\\r\\n'+meta+'\\r\\n--'+b+'\\r\\nContent-Type: '+(mime||'application/octet-stream')+'\\r\\n\\r\\n'+text+'\\r\\n--'+b+'--';
      const old=await this._findFile(name);
      const url=old?'https://www.googleapis.com/upload/drive/v3/files/'+old.id+'?uploadType=multipart':'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      const r=await fetch(url,{method:old?'PATCH':'POST',headers:{...this.headers(),'Content-Type':'multipart/related; boundary='+b},body:payload});
      if(!r.ok)throw new Error('driveUpload');return r.json();
    },
    async _downloadText(name){
      const f=await this._findFile(name);if(!f)return null;
      const r=await fetch('https://www.googleapis.com/drive/v3/files/'+f.id+'?alt=media',{headers:this.headers()});
      if(!r.ok)throw new Error('driveDownload');return r.text();
    },
    async _getAutoKey(){
      const raw=await this._downloadText('lifeflow-auto-key.json');
      if(raw){const o=JSON.parse(raw),u=Uint8Array.from(atob(o.key),c=>c.charCodeAt(0));return crypto.subtle.importKey('raw',u,{name:'AES-GCM'},true,['encrypt','decrypt']);}
      const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
      const u=new Uint8Array(await crypto.subtle.exportKey('raw',key));let b='';u.forEach(x=>b+=String.fromCharCode(x));
      await this._uploadText('lifeflow-auto-key.json',JSON.stringify({version:1,key:btoa(b)}),'application/json');return key;
    },
    async _encryptAuto(backup){
      const key=await this._getAutoKey(),iv=crypto.getRandomValues(new Uint8Array(12));
      const plain=new TextEncoder().encode(JSON.stringify(backup));
      const c=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,plain));
      const b64=u=>{let b='';u.forEach(x=>b+=String.fromCharCode(x));return btoa(b);};
      return {format:'LifeFlow-AutoBackup',version:1,encrypted:true,alg:'AES-GCM-256',iv:b64(iv),ciphertext:b64(c)};
    },
    async _decryptAuto(o){
      const key=await this._getAutoKey(),u=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
      const p=await crypto.subtle.decrypt({name:'AES-GCM',iv:u(o.iv)},key,u(o.ciphertext));
      return JSON.parse(new TextDecoder().decode(p));
    },
    async upload(password){await this.connect();const enc=await dataMod.encryptBackup(await dataMod.buildBackup(),password);return this._uploadText('lifeflow-latest.lfb',JSON.stringify(enc),'application/json');},
    async download(){await this.connect();const raw=await this._downloadText('lifeflow-latest.lfb');if(!raw)throw Object.assign(new Error('driveNone'),{code:'driveNone'});return JSON.parse(raw);},
    async autoUpload(){
      if(!this.token||!this.auto.enabled||this.auto.busy||this.auto.suspend||!LF.auth.currentId()||!this.isOnline())return false;
      this.auto.busy=true;
      try{const enc=await this._encryptAuto(await dataMod.buildBackup());await this._uploadText('lifeflow-auto.lfb',JSON.stringify(enc),'application/json');this.auto.last=new Date().toISOString();U.ls.set('lf.drive.autoLast',this.auto.last);return true;}
      catch(e){this.auto.error=e;return false}finally{this.auto.busy=false;}
    },
    scheduleAutoBackup(){if(!this.auto.enabled||!this.token)return;clearTimeout(this.auto.timer);this.auto.timer=setTimeout(()=>this.autoUpload(),2500);},
    async enableAuto(){await this.connect({identity:true});this.auto.enabled=true;U.ls.set('lf.drive.autoEnabled',true);this.auto.last=U.ls.get('lf.drive.autoLast',null);await this.autoUpload();return true;},
    disableAuto(){this.auto.enabled=false;clearTimeout(this.auto.timer);U.ls.set('lf.drive.autoEnabled',false);},
    async restoreAuto(){if(!this.token)await this.connect({identity:true});const raw=await this._downloadText('lifeflow-auto.lfb');if(!raw)throw Object.assign(new Error('driveNone'),{code:'driveNone'});return this._decryptAuto(JSON.parse(raw));},
    isOnline(){return !root.navigator||root.navigator.onLine!==false;}
  };
  LF.drive = drive;

  LF.store = store;
  LF.data = dataMod;
  LF.TOGGLEABLE = TOGGLEABLE;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/ui.js ===== */
/* ============================================================
   LifeFlow — UI kit
   el() builds DOM with createElement + textContent ONLY.
   User data can never become HTML from here — XSS-safe by design.
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};

  const ui = {
    /* ---------- DOM builder ---------- */
    appendChildren(node, children) {
      for (const c of children) {
        if (c == null || c === false) continue;
        if (Array.isArray(c)) { ui.appendChildren(node, c); continue; }
        if (c instanceof Node) node.appendChild(c);
        else node.appendChild(document.createTextNode(String(c)));
      }
    },

    el(tag, attrs) {
      const n = document.createElement(tag);
      attrs = attrs || {};
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') { n.className = v; continue; }
        if (k === 'text') { n.textContent = String(v); continue; }
        if (k === 'on') {
          for (const [ev, fn] of Object.entries(v)) n.addEventListener(ev, fn);
          continue;
        }
        if (k === 'dataset') { for (const [dk, dv] of Object.entries(v)) n.dataset[dk] = dv; continue; }
        if (k === 'style' && typeof v === 'object') { Object.assign(n.style, v); continue; }
        if (k.startsWith('on') && typeof v === 'function') { n.addEventListener(k.slice(2), v); continue; }
        if (v === true) { n.setAttribute(k, ''); continue; }
        n.setAttribute(k, String(v));
      }
      const kids = Array.prototype.slice.call(arguments, 2);
      ui.appendChildren(n, kids);
      return n;
    },

    icon(name, size) {
      const s = size || 18;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', s); svg.setAttribute('height', s);
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true');
      const markup = LF.ICONS[name] || LF.ICONS.info;
      svg.innerHTML = markup; // static registry constants only — never user data
      return svg;
    },

    avatar(user, size) {
      const name = (user && user.name) || '?';
      const initials = name.trim().split(/\s+/).slice(0, 2)
        .map(w => w[0] || '').join('').toUpperCase() || '?';
      return ui.el('span', {
        class: 'avatar' + (size === 'lg' ? ' lg' : ''),
        style: { background: (user && user.avatarColor) || '#0d9488' },
        'aria-hidden': 'true',
      }, initials);
    },

    /* ---------- toast ---------- */
    _toastStack: null,
    toast(msg, opts) {
      opts = opts || {};
      if (!ui._toastStack) {
        ui._toastStack = ui.el('div', { class: 'toast-stack', 'aria-live': 'polite' });
        document.body.appendChild(ui._toastStack);
      }
      const iconName = opts.type === 'ok' ? 'check-circle'
        : opts.type === 'error' ? 'alert'
          : opts.type === 'warn' ? 'alert' : 'info';
      const colorCls = opts.type ? ' ' + opts.type : ' info';
      const t = ui.el('div', { class: 'toast' + colorCls, role: 'status' },
        ui.el('span', { class: 't-icon' }, ui.icon(iconName, 17)),
        ui.el('div', { class: 't-msg' }, msg),
        opts.action ? ui.el('button', {
          class: 'btn soft sm', text: opts.action.label,
          onclick: () => { dismiss(); opts.action.fn && opts.action.fn(); },
        }) : null
      );
      function dismiss() {
        if (t.parentNode) t.parentNode.removeChild(t);
      }
      ui._toastStack.appendChild(t);
      const dur = opts.duration || (opts.type === 'error' ? 5200 : 3400);
      setTimeout(dismiss, dur);
      return { dismiss };
    },

    /* ---------- modal ---------- */
    /**
     * modal({title, body:Node, actions:[{label, class, onClick, keepOpen}],
     *        wide, dismissible=true})
     * returns {close, setBusy}
     */
    modal(opts) {
      opts = opts || {};
      let lastFocus = document.activeElement;
      const overlay = ui.el('div', { class: 'overlay' });
      const bodyWrap = ui.el('div', { class: 'modal-body' });
      if (opts.body instanceof Node) bodyWrap.appendChild(opts.body);

      const modalEl = ui.el('div', {
        class: 'modal' + (opts.wide ? ' wide' : ''),
        role: 'dialog', 'aria-modal': 'true', tabindex: '-1',
      },
        ui.el('div', { class: 'modal-head' },
          ui.el('h3', { text: opts.title || '' }),
          opts.dismissible !== false ? ui.el('button', {
            class: 'icon-btn', 'aria-label': LF.i18n.t('common.close'),
            onclick: close,
          }, ui.icon('x', 17)) : null
        ),
        bodyWrap
      );

      const btns = [];
      const foot = ui.el('div', { class: 'modal-foot' });
      (opts.actions || []).filter(Boolean).forEach(a => {
        const b = ui.el('button', {
          class: 'btn ' + (a.class || 'ghost'), text: a.label,
          onclick: async () => {
            if (a.onClick) {
              const r = a.onClick({ close });
              if (r && typeof r.then === 'function') {
                b.setAttribute('disabled', '');
                try { await r; } finally { b.removeAttribute('disabled'); }
              }
            } else close();
          },
        });
        btns.push(b);
        foot.appendChild(b);
      });
      if (btns.length) modalEl.appendChild(foot);

      overlay.appendChild(modalEl);
      overlay.addEventListener('mousedown', (e) => {
        if (e.target === overlay && opts.dismissible !== false) close();
      });
      document.body.appendChild(overlay);

      function close() {
        if (!overlay.parentNode) return;
        overlay.parentNode.removeChild(overlay);
        document.removeEventListener('keydown', onKey);
        if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { /* noop */ } }
      }
      function onKey(e) {
        if (e.key === 'Escape' && opts.dismissible !== false) { e.preventDefault(); close(); }
        if (e.key === 'Tab') {
          const f = modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (!f.length) return;
          const first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      document.addEventListener('keydown', onKey);
      setTimeout(() => {
        modalEl.focus();
        if (opts.onOpen) opts.onOpen();
      }, 0);

      return {
        close,
        get body() { return bodyWrap; },
        setBusy(b) {
          btns.forEach(x => b ? x.setAttribute('disabled', '') : x.removeAttribute('disabled'));
        },
      };
    },

    confirm(opts) {
      opts = opts || {};
      return new Promise((resolve) => {
        let m = null;
        const body = ui.el('div', {}, opts.message ? ui.el('p', { class: 'muted', text: opts.message }) : null);
        m = ui.modal({
          title: opts.title || LF.i18n.t('common.confirm'),
          body,
          dismissible: true,
          actions: [
            {
              label: opts.cancelLabel || LF.i18n.t('common.cancel'), class: 'ghost',
              onClick: () => { m.close(); resolve(false); },
            },
            {
              label: opts.confirmLabel || LF.i18n.t('common.yesDelete'),
              class: opts.danger === false ? 'primary' : 'danger',
              onClick: () => { m.close(); resolve(true); },
            },
          ],
        });
      });
    },

    /** download a generated file (CSV/JSON/…) — no server needed */
    downloadFile(filename, content, mime) {
      try {
        const blob = new Blob(['\uFEFF' + content], { type: (mime || 'text/plain') + ';charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 0);
        return true;
      } catch (e) { return false; }
    },

    /** prompt for a single text value → Promise<string|null> (null = cancelled) */
    prompt(opts) {
      opts = opts || {};
      return new Promise((resolve) => {
        let m = null;
        const input = ui.el('input', {
          class: 'input', type: 'text', value: opts.value || '',
          maxlength: opts.maxlength || '120', placeholder: opts.placeholder || '',
        });
        const submit = () => { m.close(); resolve(input.value); };
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
        const body = ui.el('div', { class: 'col', style: { gap: '10px' } },
          opts.message ? ui.el('p', { class: 'muted small', text: opts.message }) : null,
          input);
        m = ui.modal({
          title: opts.title || LF.i18n.t('common.edit'),
          body,
          dismissible: true,
          onOpen: () => { input.focus(); input.select(); },
          actions: [
            {
              label: LF.i18n.t('common.cancel'), class: 'ghost',
              onClick: () => { m.close(); resolve(null); },
            },
            { label: LF.i18n.t('common.save'), class: 'primary', onClick: submit },
          ],
        });
      });
    },

    /* ---------- form helpers ---------- */
    field(labelText, control, opts) {
      opts = opts || {};
      return ui.el('div', { class: 'field' },
        labelText ? ui.el('label', { text: labelText, for: opts.for }) : null,
        control,
        opts.hint ? ui.el('div', { class: 'field-hint', text: opts.hint }) : null,
        opts.error ? ui.el('div', { class: 'field-error', text: opts.error }) : null
      );
    },

    switchEl(checked, onChange, label) {
      const sw = ui.el('button', {
        class: 'switch', role: 'switch',
        'aria-checked': checked ? 'true' : 'false',
        'aria-label': label || '',
      });
      sw.addEventListener('click', () => {
        const v = sw.getAttribute('aria-checked') !== 'true';
        sw.setAttribute('aria-checked', v ? 'true' : 'false');
        onChange && onChange(v);
      });
      return sw;
    },

    seg(options, value, onChange) {
      const seg = ui.el('div', { class: 'seg', role: 'group' });
      options.forEach(o => {
        const b = ui.el('button', {
          type: 'button', text: o.label,
          'aria-pressed': o.value === value ? 'true' : 'false',
          onclick: () => {
            seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false'));
            b.setAttribute('aria-pressed', 'true');
            onChange && onChange(o.value);
          },
        });
        seg.appendChild(b);
      });
      return seg;
    },

    empty(iconName, title, desc, actionBtn) {
      return ui.el('div', { class: 'empty' },
        ui.el('div', { class: 'empty-icon' }, ui.icon(iconName || 'info', 24)),
        ui.el('div', { class: 'empty-title', text: title || '' }),
        desc ? ui.el('div', { class: 'empty-desc', text: desc }) : null,
        actionBtn || null
      );
    },

    /* ---------- dropdown ---------- */
    dropdown(anchorBtn, buildPanel, opts) {
      opts = opts || {};
      const wrap = ui.el('div', { class: 'dd-root' });
      anchorBtn.parentNode.insertBefore(wrap, anchorBtn);
      wrap.appendChild(anchorBtn);
      const panel = ui.el('div', {
        class: 'dd' + (opts.up ? ' dd-up' : ''),
        role: 'menu',
      });
      buildPanel(panel, close);
      wrap.appendChild(panel);
      /* fixed anchors (e.g. FAB): dd-root box is zero-size, so position the panel from the anchor rect */
      if (opts.fixed) {
        const r = anchorBtn.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.top = 'auto';
        panel.style.bottom = Math.max(8, window.innerHeight - r.top + 8) + 'px';
        panel.style.insetInlineEnd = Math.max(8, window.innerWidth - Math.max(r.right, r.left + r.width)) + 'px';
      }
      function onDoc(e) {
        if (!wrap.contains(e.target)) close();
      }
      setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
      document.addEventListener('keydown', onKey);
      function onKey(e) { if (e.key === 'Escape') close(); }
      function close() {
        if (panel.parentNode) panel.parentNode.removeChild(panel);
        document.removeEventListener('mousedown', onDoc);
        document.removeEventListener('keydown', onKey);
      }
      return { close };
    },
  };

  LF.ui = ui;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/shell.js ===== */
/* ============================================================
   LifeFlow — App shell (sidebar + topbar + bottom nav)
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const U = LF.util;
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);

  /* Navigation map — phases follow the master plan.
     Items with a hash are live; the rest render as "coming soon". */
  const NAV_ITEMS = [
    { id: 'dashboard', icon: 'dashboard', key: 'nav.dashboard', hash: '#/app/dashboard', phase: 1, mobile: true },
    { id: 'myday', icon: 'clock', key: 'nav.myday', hash: '#/app/myday', phase: 2, mobile: true },
    { id: 'tasks', icon: 'list-checks', key: 'nav.tasks', hash: '#/app/tasks', phase: 2, mobile: true },
    { id: 'projects', icon: 'folder', key: 'nav.projects', hash: '#/app/projects', phase: 2 },
    { id: 'calendar', icon: 'calendar', key: 'nav.calendar', hash: '#/app/calendar', phase: 2, mobile: true },
    { id: 'expenses', icon: 'wallet', key: 'nav.expenses', hash: '#/app/expenses', phase: 3, mobile: true },
    { id: 'income', icon: 'banknote', key: 'nav.income', hash: '#/app/income', phase: 3 },
    { id: 'budget', icon: 'chart', key: 'nav.budget', hash: '#/app/budget', phase: 3, feat: 'budget' },
    { id: 'debts', icon: 'credit-card', key: 'nav.debts', hash: '#/app/debts', phase: 4 },
    { id: 'contacts', icon: 'users', key: 'nav.contacts', hash: '#/app/contacts', phase: 4 },
    { id: 'shopping', icon: 'cart', key: 'nav.shopping', hash: '#/app/shopping', phase: 5 },
    { id: 'home', icon: 'home', key: 'nav.home', hash: '#/app/home', phase: 5, feat: 'home' },
    { id: 'study', icon: 'book', key: 'nav.study', hash: '#/app/study', phase: 6, feat: 'study' },
    { id: 'work', icon: 'briefcase', key: 'nav.work', hash: '#/app/work', phase: 6, feat: 'work' },
    { id: 'habits', icon: 'flame', key: 'nav.habits', hash: '#/app/habits', phase: 7, feat: 'habits' },
    { id: 'goals', icon: 'target', key: 'nav.goals', hash: '#/app/goals', phase: 7 },
    { id: 'notes', icon: 'edit', key: 'nav.notes', hash: '#/app/notes', phase: 7 },
    { id: 'reminders', icon: 'bell', key: 'nav.reminders', hash: '#/app/reminders', phase: 7 },
    { id: 'analytics', icon: 'chart', key: 'nav.analytics', hash: '#/app/analytics', phase: 8 },
    { id: 'reports', icon: 'clipboard', key: 'nav.reports', hash: '#/app/reports', phase: 8 },
    { id: 'settings', icon: 'settings', key: 'nav.settings', hash: '#/app/settings', phase: 1 },
  ];

  /* Live nav = has a hash AND its toggleable feature (if any) is enabled.
     Feature-off items are hidden entirely (progressive disclosure). */
  function navLive() {
    const s = LF.store && LF.store.settings;
    const feat = (s && s.features) || {};
    return NAV_ITEMS.filter(n => n.hash && (!n.feat || feat[n.feat] !== false));
  }

  const shell = {
    _root: null,
    _viewEl: null,
    _unsubs: [],

    isActive(id) {
      return location.hash === (NAV_ITEMS.find(n => n.id === id) || {}).hash;
    },

    brand() {
      return el('div', { class: 'row' },
        el('div', { class: 'logo-mark' }, ic('logo', 22)),
        el('div', { class: 'col', style: { gap: '0' } },
          el('div', { class: 'brand-name', text: 'LifeFlow' }),
          el('div', { class: 'brand-sub', text: LF.i18n.t('common.tagline') })
        )
      );
    },

    navItem(n) {
      if (n.hash) {
        const a = el('a', {
          class: 'nav-item' + (shell.isActive(n.id) ? ' active' : ''),
          href: n.hash, 'aria-current': shell.isActive(n.id) ? 'page' : null,
        }, ic(n.icon, 18), el('span', { text: LF.i18n.t(n.key) }));
        return a;
      }
      return el('div', {
        class: 'nav-item is-soon',
        role: 'link', 'aria-disabled': 'true',
        title: LF.i18n.t('common.phase', { n: n.phase }),
      }, ic(n.icon, 18),
        el('span', { text: LF.i18n.t(n.key) }),
        el('span', { class: 'nav-badge', text: 'M' + n.phase })
      );
    },

    sidenav() {
      const live = navLive();
      const soon = NAV_ITEMS.filter(n => !n.hash);
      const nav = el('nav', { 'aria-label': LF.i18n.t('nav.main') },
        el('div', { class: 'nav-group-label', text: LF.i18n.t('nav.main') }),
        live.map(n => shell.navItem(n)),
        el('details', { class: 'nav-soon' },
          el('summary', { class: 'nav-item is-soon' },
            ic('chevron-right', 15, ),
            el('span', { text: LF.i18n.t('nav.soon') })
          ),
          soon.map(n => shell.navItem(n))
        )
      );
      const foot = el('div', { class: 'sidenav-foot' },
        el('span', { text: 'LifeFlow v1 · ' + LF.i18n.t('app.localMode') }),
        LF.db.backend === 'memory'
          ? el('span', { class: 'badge warn', text: LF.i18n.t('app.previewShort') }) : null
      );
      return el('aside', { class: 'sidenav' },
        el('div', { class: 'brand' }, shell.brand()),
        nav,
        foot
      );
    },

    bottomnav() {
      const items = navLive().filter(n => n.mobile);
      const bn = el('nav', {
        class: 'bottomnav', 'aria-label': LF.i18n.t('nav.main'),
      });
      items.forEach(n => {
        bn.appendChild(el('a', {
          class: 'bn-item' + (shell.isActive(n.id) ? ' active' : ''),
          href: n.hash,
        }, ic(n.icon, 21), el('span', { text: LF.i18n.t(n.key) })));
      });
      return bn;
    },

    async topbar() {
      const t = LF.i18n.t;
      const right = el('div', { class: 'row', style: { gap: '4px' } });

      // offline chip
      if (LF.pwa && !LF.pwa.isOnline()) {
        right.appendChild(el('span', { class: 'badge warn' }, ic('wifi-off', 13), t('app.offline')));
      }

      // global search
      right.appendChild(el('button', {
        class: 'icon-btn', 'aria-label': t('search.title'),
        onclick: () => LF.router.go('#/app/search'),
      }, ic('search', 19)));

      // notifications bell
      const notifs = await LF.db.list('notifications', { sortKey: 'updatedAt', sortDir: -1, limit: 20 });
      const unread = notifs.filter(n => !n.read).length;
      const bellWrap = el('div', { style: { position: 'relative' } });
      const bellBtn = el('button', {
        class: 'icon-btn', 'aria-label': t('notifications.title'),
        'aria-haspopup': 'true',
        onclick: () => shell.notifPanel(bellBtn, notifs),
      }, ic('bell', 19), unread ? el('span', { class: 'dot' }) : null);
      bellWrap.appendChild(bellBtn);
      right.appendChild(bellWrap);

      // account menu
      const avBtn = el('button', {
        class: 'icon-btn', style: { padding: '2px', borderRadius: '50%' },
        'aria-label': t('settings.account'), 'aria-haspopup': 'true',
      }, LF.ui.avatar(LF.store.user, null));
      avBtn.addEventListener('click', () => shell.accountMenu(avBtn));
      right.appendChild(avBtn);

      return el('header', { class: 'topbar' },
        el('a', {
          class: 'brand-mobile', href: '#/app/dashboard',
          style: { color: 'inherit' },
        }, el('div', { class: 'logo-mark' }, ic('logo', 18)), 'LifeFlow'),
        el('div', { class: 'spacer' }),
        right
      );
    },

    notifPanel(anchor, notifs) {
      const t = LF.i18n.t;
      LF.ui.dropdown(anchor, (panel, close) => {
        panel.style.minWidth = '290px';
        panel.appendChild(el('div', { class: 'dd-head' },
          el('div', { class: 'strong', text: t('notifications.title') })
        ));
        if (!notifs.length) {
          panel.appendChild(el('div', { class: 'dd-item', style: { cursor: 'default' } },
            el('span', { class: 'muted small', text: t('notifications.empty') })));
        } else {
          notifs.slice(0, 8).forEach(n => {
            panel.appendChild(el('div', {
              class: 'dd-item', style: { cursor: 'default', display: 'block' },
            },
              el('div', { class: 'row', style: { gap: '7px', marginBottom: '2px' } },
                el('span', { class: 'strong small', text: n.title || '' }),
                !n.read ? el('span', { class: 'badge accent', text: t('notifications.new') }) : null),
              n.body ? el('div', { class: 'muted xs', text: n.body }) : null
            ));
          });
        }
      });
    },

    accountMenu(anchor) {
      const t = LF.i18n.t;
      const s = LF.store.settings || {};
      LF.ui.dropdown(anchor, (panel, close) => {
        panel.appendChild(el('div', { class: 'dd-head row' },
          LF.ui.avatar(LF.store.user, null),
          el('div', { class: 'col', style: { gap: '0', minWidth: '0' } },
            el('div', { class: 'strong small truncate', text: LF.store.user ? LF.store.user.name : '' }),
            el('div', { class: 'muted xs truncate', text: '@' + (LF.store.user ? LF.store.user.username : '') })
          )
        ));

        const themeBtn = el('button', { class: 'dd-item' },
          ic(s.theme === 'dark' ? 'moon' : 'sun', 16), t('app.toggleTheme'));
        themeBtn.addEventListener('click', () => {
          close();
          const cur = (LF.store.settings && LF.store.settings.theme) || 'system';
          const next = cur === 'light' ? 'dark' : cur === 'dark' ? 'system' : 'light';
          if (LF.store.settings) LF.store.saveSettings({ theme: next });
          else LF.store.applyLook({ theme: next });
          LF.ui.toast(t('app.themeSet', { theme: t('settings.theme_' + next) }), { type: 'ok' });
          shell.rerender();
        });
        panel.appendChild(themeBtn);

        if (LF.pwa && LF.pwa.canInstall()) {
          const ib = el('button', { class: 'dd-item' }, ic('download', 16), t('app.installApp'));
          ib.addEventListener('click', () => { close(); LF.pwa.promptInstall(); });
          panel.appendChild(ib);
        }

        const sb = el('button', { class: 'dd-item' }, ic('settings', 16), t('nav.settings'));
        sb.addEventListener('click', () => { close(); LF.router.go('#/app/settings'); });
        panel.appendChild(sb);

        panel.appendChild(el('div', { class: 'dd-sep' }));

        const lb = el('button', { class: 'dd-item danger' }, ic('logout', 16), t('auth.logout'));
        lb.addEventListener('click', async () => {
          close();
          LF.auth.logout();
          LF.store.settings = null; LF.store.workspaces = []; LF.store.user = null;
          shell.destroy();
          LF.router.go('#/login');
          LF.ui.toast(t('auth.loggedOut'), { type: 'ok' });
        });
        panel.appendChild(lb);
      });
    },

    /** Create (if needed) and return the shell; returns the view container. */
    async ensure() {
      if (shell._root && document.body.contains(shell._root)) return shell._viewEl;
      shell.destroy();
      const appRoot = document.getElementById('app');
      appRoot.innerHTML = '';
      shell._viewEl = el('main', { class: 'main', id: 'main', tabindex: '-1' });
      shell._root = el('div', { class: 'app' },
        shell.sidenav(),
        el('div', { class: 'col', style: { minHeight: '100dvh', flex: '1', minWidth: '0' } },
          await shell.topbar(),
          shell._banners(),
          shell._viewEl
        )
      );
      appRoot.appendChild(shell._root);
      document.body.appendChild(shell.bottomnav());
      if (LF.quickadd) LF.quickadd.mount();
      shell._bind();
      return shell._viewEl;
    },

    _banners() {
      const t = LF.i18n.t;
      const wrap = el('div', { class: 'col', style: { gap: '8px', padding: '10px 20px 0', maxWidth: '1040px', marginInline: 'auto', width: '100%' } });
      if (LF.db.backend === 'memory') {
        wrap.appendChild(el('div', { class: 'banner warn', role: 'status' },
          ic('alert', 16),
          el('div', { class: 'grow', text: t('app.previewMode') })
        ));
      }
      return wrap;
    },

    _bind() {
      const mq = root.matchMedia && root.matchMedia('(prefers-color-scheme: dark)');
      if (mq && mq.addEventListener) {
        const fn = () => LF.store.onSystemThemeChange();
        mq.addEventListener('change', fn);
        shell._unsubs.push(() => mq.removeEventListener('change', fn));
      }
    },

    destroy() {
      shell._unsubs.forEach(u => { try { u(); } catch (e) { /* noop */ } });
      shell._unsubs = [];
      if (LF.quickadd) LF.quickadd.unmount();
      if (shell._root && shell._root.parentNode) shell._root.parentNode.removeChild(shell._root);
      const bn = document.querySelector('.bottomnav');
      if (bn && bn.parentNode) bn.parentNode.removeChild(bn);
      shell._root = null; shell._viewEl = null;
    },

    /** Re-render shell + current route (used after lang/theme/feature changes).
        Full rebuild so the sidenav/bottomnav pick up new language + features. */
    async rerender() {
      shell.destroy();
      await LF.router.render();
    },
  };

  LF.shell = shell;
  LF.NAV_ITEMS = NAV_ITEMS;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/router.js ===== */
/* ============================================================
   LifeFlow — Hash router with auth/onboarding guards
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};

  const router = {
    routes: {},
    current: null,

    add(name, fn) { router.routes[name] = fn; return router; },

    parse() {
      const h = location.hash || '#/';
      const clean = h.replace(/^#\/?/, '');
      const parts = clean.split('/').filter(Boolean);
      if (!parts.length) return { name: 'root', parts: [] };
      if (parts[0] === 'login') return { name: 'login', parts };
      if (parts[0] === 'onboarding') return { name: 'onboarding', parts };
      if (parts[0] === 'app') {
        if (parts.length === 1) return { name: 'app', parts };
        return { name: 'app/' + parts[1], parts: parts.slice(2) };
      }
      return { name: 'notfound', parts };
    },

    resolve() {
      const r = router.parse();
      const authed = !!LF.auth.currentId();
      const onboarded = !!(LF.store.settings && LF.store.settings.onboarded);

      if (r.name === 'login') return authed && onboarded ? 'app/dashboard' : r.name;
      if (r.name === 'onboarding') return authed ? r.name : 'login';
      if (r.name === 'root') return authed ? (onboarded ? 'app/dashboard' : 'onboarding') : 'login';
      if (r.name === 'notfound') return authed ? (onboarded ? 'app/dashboard' : 'onboarding') : 'login';
      // app/* routes
      if (!authed) return 'login';
      if (!onboarded && r.name !== 'app/dashboard') return 'onboarding';
      return r.name;
    },

    go(hash) {
      if (location.hash === hash) router.render();
      else location.hash = hash;
    },

    start() {
      root.addEventListener('hashchange', () => router.render());
      router.render();
    },

    async render() {
      const name = router.resolve();
      const fn = router.routes[name] || router.routes['app/dashboard'];
      router.current = name;
      const parsed = router.parse();
      const params = parsed.parts[0] === 'app' ? parsed.parts.slice(2) : [];
      try {
        await fn(params);
      } catch (e) {
        console.error('[LifeFlow] route error:', name, e);
        const msg = (LF.i18n && LF.i18n.t('app.routeError')) || 'Error';
        if (LF.ui) LF.ui.toast(msg, { type: 'error' });
      }
      LF.store.emit('route:changed', name);
    },
  };

  LF.router = router;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/pwa.js ===== */
/* ============================================================
   LifeFlow — PWA: service worker, install prompt, connectivity
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};

  const pwa = {
    _deferred: null,
    _reg: null,

    /** injected by build.py (content hash) — 'dev' in source runs */
    BUILD_VERSION: 'lifeflow-localbackup-20260921',

    init() {
      // connectivity
      root.addEventListener('online', () => LF.store.emit('connectivity', true));
      root.addEventListener('offline', () => LF.store.emit('connectivity', false));

      // install prompt
      root.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        pwa._deferred = e;
        LF.store.emit('can-install', true);
      });
      root.addEventListener('appinstalled', () => {
        pwa._deferred = null;
        LF.store.emit('can-install', false);
        if (LF.ui) LF.ui.toast(LF.i18n.t('app.installed'), { type: 'ok' });
      });

      pwa.registerSW();
    },

    _swAllowed() {
      if (!('serviceWorker' in navigator)) return false;
      const proto = location.protocol;
      const host = location.hostname;
      return proto === 'https:' ||
        host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
    },

    async registerSW() {
      if (!pwa._swAllowed()) return;
      try {
        const reg = await navigator.serviceWorker.register('./sw.js');
        pwa._reg = reg;
        pwa._watchUpdates(reg);
      } catch (e) {
        console.warn('[LifeFlow] SW registration failed:', e);
      }
    },

    _watchUpdates(reg) {
      if (!reg) return;
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' &&
            navigator.serviceWorker.controller && reg.waiting) {
            pwa._notifyUpdate(reg.waiting);
          }
        });
      });
      if (reg.waiting && navigator.serviceWorker.controller) {
        pwa._notifyUpdate(reg.waiting);
      }
    },

    _notified: false,
    _notifyUpdate(waiting) {
      if (pwa._notified) return;
      pwa._notified = true;
      const apply = () => {
        navigator.serviceWorker.addEventListener('controllerchange',
          () => location.reload(), { once: true });
        waiting.postMessage({ type: 'SKIP_WAITING' });
      };
      if (LF.ui && LF.i18n) {
        LF.ui.toast(LF.i18n.t('app.updateReady'), {
          type: 'ok', duration: 60000,
          action: { label: LF.i18n.t('app.updateNow'), fn: apply },
        });
      }
    },

    canInstall() {
      return !!pwa._deferred && !pwa.isStandalone();
    },

    async promptInstall() {
      if (!pwa._deferred) return false;
      pwa._deferred.prompt();
      const res = await pwa._deferred.userChoice;
      pwa._deferred = null;
      return res && res.outcome === 'accepted';
    },

    isStandalone() {
      return root.matchMedia &&
        (root.matchMedia('(display-mode: standalone)').matches ||
          root.matchMedia('(display-mode: minimal-ui)').matches) ||
        root.navigator && root.navigator.standalone === true;
    },

    isOnline() {
      return root.navigator ? root.navigator.onLine !== false : true;
    },

    /** manual update check (settings → app section) */
    async checkUpdate() {
      if (!pwa._reg) return 'unavailable';
      try {
        await pwa._reg.update();
        return 'checked';
      } catch (e) {
        return 'error';
      }
    },
  };

  LF.pwa = pwa;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/sync.js ===== */
/* ============================================================
   LifeFlow — Sync seam (spec #34)
   ------------------------------------------------------------
   The app is local-first: ALL data lives in IndexedDB and every
   feature works fully offline. There is NO backend today, so
   nothing here pretends to sync — this module is the single,
   validated extension point a future backend plugs into.

   Contract for a future adapter:
     adapter.init()  → Promise — connect / auth / handshake
     adapter.push(ops)  → Promise — upload local changes
     adapter.pull(since) → Promise<{changes, cursor}> — server changes
   Conflict policy (documented for implementers):
     per-record last-write-wins by `updatedAt`, server breaks exact
     ties; deletes are tombstoned records (deletedAt), never hard
     drops, so nothing is lost silently.

   When an adapter is registered the app keeps working offline:
   pushes are drained on 'connectivity' events, pulls run on focus
   and on interval. Until then status() reports mode 'local'.
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};

  const sync = {
    adapter: null,
    lastSyncAt: null,

    /** register a backend adapter — validates the contract first */
    async registerAdapter(a) {
      if (!a || typeof a !== 'object') throw new Error('sync: adapter must be an object');
      for (const m of ['init', 'push', 'pull']) {
        if (typeof a[m] !== 'function') throw new Error('sync: adapter missing ' + m + '()');
      }
      await a.init();
      sync.adapter = a;
      return a;
    },

    /** current sync state for UI/diagnostics */
    status() {
      const online = !!(LF.pwa && LF.pwa.isOnline && LF.pwa.isOnline());
      return {
        mode: sync.adapter ? 'ready' : 'local',
        online,
        lastSyncAt: sync.lastSyncAt,
        adapter: sync.adapter ? (sync.adapter.name || 'adapter') : null,
      };
    },

    /** drain + fetch — no-op without an adapter (never blocks the UI) */
    async run() {
      if (!sync.adapter) return { skipped: true };
      const res = await sync.adapter.push([]);   /* full push until ops log exists */
      await sync.adapter.pull(sync.lastSyncAt);
      sync.lastSyncAt = new Date().toISOString();
      return res;
    },
  };

  LF.sync = sync;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/logic.js ===== */
/* ============================================================
   LifeFlow — Pure domain logic (recurrence, calendars, progress)
   No DOM, no db — fully unit-testable in Node.
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const U = LF.util;

  const PRIORITIES = ['urgent', 'high', 'medium', 'low'];
  const PRIORITY_WEIGHT = { urgent: 0, high: 1, medium: 2, low: 3 };
  const TASK_STATUSES = ['todo', 'doing', 'done', 'deferred', 'cancelled'];
  const ACTIVE_STATUSES = ['todo', 'doing', 'deferred'];

  const EVENT_TYPES = ['appointment', 'meeting', 'lecture', 'exam', 'occasion', 'personal', 'home', 'other'];

  /* ---------- time helpers (HH:MM strings) ---------- */
  function validTime(s) {
    if (s == null || s === '') return true; // empty allowed
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(s).trim());
  }
  function timeToMin(s) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    return (+m[1]) * 60 + (+m[2]);
  }
  function minToTime(min) {
    const m = ((Math.round(min) % 1440) + 1440) % 1440;
    return U.pad2(Math.floor(m / 60)) + ':' + U.pad2(m % 60);
  }

  /* ---------- date math on YMD strings ---------- */
  function addMonthsClamped(ymdStr, n) {
    const d = U.fromYmd(ymdStr);
    if (!d) return null;
    const day = d.getDate();
    const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(day, lastDay));
    return U.ymd(target);
  }

  /**
   * Next occurrence date for a recurrence pattern.
   * recur: {type:'daily'|'weekly'|'monthly'|'yearly', every:1..n, until:Ymd|null}
   * Returns next YMD or null when `until` blocks it.
   */
  function nextDate(ymdStr, recur) {
    if (!recur || !recur.type || recur.type === 'none') return null;
    const every = Math.max(1, +recur.every || 1);
    const d = U.fromYmd(ymdStr);
    if (!d) return null;
    let next;
    switch (recur.type) {
      case 'daily':
        next = U.ymd(U.addDays(d, every));
        break;
      case 'weekly':
        next = U.ymd(U.addDays(d, 7 * every));
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
   * Pure: returns a new record object (unsaved) or null.
   */
  function spawnNext(task) {
    if (!task || !task.recurrence || !task.recurrence.type || task.recurrence.type === 'none') return null;
    const base = task.date ? task.date : U.todayYmd();
    const nd = nextDate(base, task.recurrence);
    if (!nd) return null;
    const clone = U.clone(task);
    delete clone.id;
    delete clone.createdAt;
    delete clone.updatedAt;
    clone.date = nd;
    clone.status = 'todo';
    clone.completedAt = null;
    return clone;
  }

  /**
   * Expand events (including recurring ones) into occurrences within [fromYmd..toYmd].
   * Returns [{ev, date}] sorted by date. Iterations capped for safety.
   */
  function expandOccurrences(events, fromYmd, toYmd) {
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

  /* ---------- tasks ---------- */
  function isOverdue(task, todayYmd) {
    const today = todayYmd || U.todayYmd();
    return !!task.date && task.date < today &&
      (task.status === 'todo' || task.status === 'doing');
  }

  function taskBucket(task, todayYmd) {
    const today = todayYmd || U.todayYmd();
    if (task.status === 'done') return 'done';
    if (task.status === 'cancelled') return 'cancelled';
    if (isOverdue(task, today)) return 'overdue';
    if (!task.date) return 'nodate';
    if (task.date === today) return 'today';
    return 'upcoming';
  }

  function subtaskProgress(subtasks) {
    const list = subtasks || [];
    return { done: list.filter(s => s.done).length, total: list.length };
  }

  /** project progress from its tasks (cancelled excluded) */
  function projectProgress(tasks) {
    const list = (tasks || []).filter(t => t.status !== 'cancelled');
    const done = list.filter(t => t.status === 'done').length;
    return { done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
  }

  function sortTasks(tasks, sortBy) {
    const arr = tasks.slice();
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

  /* ---------- calendar grids ---------- */
  /** weekday index order starting from weekStart (0=Sun..6=Sat) */
  function weekDays(weekStart) {
    const out = [];
    for (let i = 0; i < 7; i++) out.push((weekStart + i) % 7);
    return out;
  }

  /** 42-cell month grid (6 weeks) starting at week-start of the 1st */
  function monthGrid(year, month /*0-based*/, weekStart) {
    const first = new Date(year, month, 1);
    const start = U.startOfWeek(first, weekStart);
    const cells = [];
    for (let i = 0; i < 42; i++) {
      cells.push(U.ymd(U.addDays(start, i)));
    }
    return cells;
  }

  /* ---------- money: months & budget periods ---------- */
  function daysInMonth(ymdStr) {
    const p = String(ymdStr || '').split('-').map(Number);
    return new Date(p[0], p[1], 0).getDate();
  }

  function monthBounds(ymdStr) {
    const ym = String(ymdStr || '').slice(0, 7);
    return { ym, from: ym + '-01', to: ym + '-' + U.pad2(daysInMonth(ym + '-01')) };
  }

  /** current period window [from..to] for a budget period, honoring week start */
  function budgetPeriod(period, todayYmdStr, weekStart) {
    const today = todayYmdStr || U.todayYmd();
    switch (period) {
      case 'daily': return { from: today, to: today };
      case 'weekly': {
        const d = U.fromYmd(today);
        const start = U.startOfWeek(d, weekStart == null ? 0 : weekStart);
        return { from: U.ymd(start), to: U.ymd(U.addDays(start, 6)) };
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

  /**
   * Budget status from its expenses (integer minor units).
   * budget: {amount, period, categoryId ('' = all)}
   * → {from, to, spent, remaining, pct, projected, state: ok|warn|over}
   */
  function budgetStatus(budget, expenses, todayYmdStr, weekStart) {
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

  /** group totals per category → [{categoryId, total}] sorted desc */
  function topCategories(expenses, n) {
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

  /** last N months income/expense/net trend (incl. current month) */
  function monthTrend(incomes, expenses, monthsCount, todayYmdStr) {
    const today = todayYmdStr || U.todayYmd();
    const n = monthsCount || 6;
    const y = Number(today.slice(0, 4));
    const m = Number(today.slice(5, 7));
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      let mm = m - i, yy = y;
      while (mm <= 0) { mm += 12; yy -= 1; }
      out.push({ ym: yy + '-' + U.pad2(mm), income: 0, expense: 0, net: 0 });
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

  /**
   * Debt state from its payment log (integer minor units).
   * debt: {amount, dueDate}   payments: [{debtId, amount}]
   * → {paid, remaining, pct, state: due|partial|paid|overdue}
   * Status is always COMPUTED — payments are the single source of truth.
   */
  function debtStatus(debt, payments, todayYmdStr) {
    const today = todayYmdStr || U.todayYmd();
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

  /** shopping list stats from its items (integer minor units) */
  function shoppingStats(items) {
    const list = items || [];
    let expected = 0, actual = 0, purchased = 0;
    for (const it of list) {
      expected += it.expectedPrice || 0;
      if (it.purchased) { purchased++; actual += it.actualPrice || 0; }
    }
    return { count: list.length, purchased, expected, actual, remaining: list.length - purchased };
  }

  /* ---------- study & work ---------- */
  /** sum a minutes field of records dated within [from..to] */
  function sumMinutes(records, fromYmdStr, toYmdStr, field) {
    const f = field || 'minutes';
    let total = 0;
    for (const r of (records || [])) {
      if (!r.date) continue;
      if (r.date < fromYmdStr || r.date > toYmdStr) continue;
      total += r[f] || 0;
    }
    return total;
  }

  /** next upcoming exam → {exam, daysUntil} | null */
  function nextExam(exams, todayYmdStr) {
    const today = todayYmdStr || U.todayYmd();
    let best = null;
    for (const e of (exams || [])) {
      if (!e.date || e.date < today) continue;
      if (!best || e.date < best.date) best = e;
    }
    if (!best) return null;
    const days = Math.round((U.fromYmd(best.date) - U.fromYmd(today)) / 86400000);
    return { exam: best, daysUntil: days };
  }

  /** assignment stats → {open, done, overdue} */
  function assignmentStats(assignments, todayYmdStr) {
    const today = todayYmdStr || U.todayYmd();
    let open = 0, done = 0, overdue = 0;
    for (const a of (assignments || [])) {
      if (a.status === 'done') { done++; continue; }
      open++;
      if (a.dueDate && a.dueDate < today) overdue++;
    }
    return { open, done, overdue };
  }

  /* ---------- habits ---------- */
  const HABIT_TYPES = ['daily', 'days', 'weekly', 'numeric'];

  /** is the habit scheduled on the given weekday (0=Sun..6=Sat)? */
  function habitScheduledOn(habit, dateYmd) {
    const d = U.fromYmd(dateYmd);
    if (!d) return false;
    const wd = d.getDay();
    const sch = (habit.schedule || {}).type || 'daily';
    if (sch === 'daily' || sch === 'numeric') return true;
    if (sch === 'days') return (habit.days || []).indexOf(wd) !== -1;
    if (sch === 'weekly') return true;   // any day counts; adherence is weekly
    return true;
  }

  /** logs for one habit on one date → {value, done} */
  function habitDayValue(habit, logs, dateYmd) {
    let value = 0;
    for (const l of (logs || [])) {
      if (l.habitId !== habit.id || l.date !== dateYmd) continue;
      value += (l.count != null ? l.count : 1);
    }
    const sch = (habit.schedule || {}).type || 'daily';
    const target = sch === 'numeric' ? Math.max(1, habit.target || 1) : 1;
    return { value, done: value >= target, target };
  }

  /** consecutive completed scheduled days ending today (or yesterday) */
  function habitStreak(habit, logs, todayYmdStr) {
    const sch = (habit.schedule || {}).type || 'daily';
    if (sch === 'weekly') {
      /* consecutive weeks (ending this one) with at least one log */
      const logged = new Set((logs || []).filter(l => l.habitId === habit.id).map(l => l.date));
      if (!logged.size) return 0;
      let streak = 0;
      let cursor = U.fromYmd(todayYmdStr);
      /* walk back week by week (week = 7-day block ending cursor) */
      for (let w = 0; w < 520; w++) {
        let hit = false;
        for (let i = 0; i < 7; i++) {
          if (logged.has(U.ymd(cursor))) { hit = true; break; }
          cursor = U.addDays(cursor, -1);
        }
        if (!hit) {
          /* current week not over yet: only break if a FULL week passed without logs */
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
        else if (i === 0 && !skippedToday) { skippedToday = true; /* today may still happen */ }
        else break;
      }
      cursor = U.ymd(U.addDays(U.fromYmd(cursor), -1));
    }
    return streak;
  }

  /** adherence over the last `days` days (default 30) — % of scheduled days done */
  function habitAdherence(habit, logs, todayYmdStr, days) {
    const sch = (habit.schedule || {}).type || 'daily';
    const n = days || 30;
    let scheduled = 0, done = 0;
    let cursor = todayYmdStr;
    for (let i = 0; i < n; i++) {
      if (habitScheduledOn(habit, cursor)) {
        scheduled++;
        if (habitDayValue(habit, logs, cursor).done) done++;
      }
      cursor = U.ymd(U.addDays(U.fromYmd(cursor), -1));
    }
    return { scheduled, done, pct: scheduled ? Math.round((done / scheduled) * 100) : 0 };
  }

  /* ---------- goals ---------- */
  /** progress from steps when they exist, else the manual field */
  function goalProgress(goal, steps) {
    const list = (steps || []).filter(s => s.goalId === goal.id);
    if (list.length) {
      const done = list.filter(s => s.done).length;
      return { pct: Math.round((done / list.length) * 100), fromSteps: true, total: list.length, doneSteps: done };
    }
    return { pct: Math.max(0, Math.min(100, goal.progress || 0)), fromSteps: false, total: 0, doneSteps: 0 };
  }

  /* ---------- reminders ---------- */
  /** is a reminder due? (date passed, or today with time <= now) */
  function reminderDue(reminder, todayYmdStr, nowTime) {
    if (reminder.doneAt) return false;
    if (!reminder.date) return false;
    if (reminder.date < todayYmdStr) return true;
    if (reminder.date > todayYmdStr) return false;
    if (!reminder.time) return true;          // date-only → due all day
    return reminder.time <= (nowTime || '23:59');
  }

  /* ---------- analytics ---------- */
  /**
   * Task stats for a period. A task affects the period when:
   * - completed within it (completedAt, falling back to its date for
   *   records saved as done directly), OR
   * - scheduled within it while open, OR
   * - still open and dated BEFORE the period (carried-over / overdue).
   */
  function taskStats(tasks, fromYmdStr, toYmdStr) {
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

  /** completed tasks per day within [from..to] → [{date, count}] */
  function dailyCompletions(tasks, fromYmdStr, toYmdStr) {
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
      cur = U.ymd(U.addDays(U.fromYmd(cur), 1));
    }
    return out;
  }

  /**
   * Smart daily summary (spec #30) — descriptive insights only.
   * Returns [{ key, tone, icon, params, money }] where `key` is a full
   * i18n key ('insights.*'). Never makes financial decisions — only
   * describes what the data says about today.
   */
  function dailyInsights(input, todayYmdStr) {
    const today = todayYmdStr || U.todayYmd();
    const tomorrow = U.ymd(U.addDays(U.fromYmd(today), 1));
    const in3 = U.ymd(U.addDays(U.fromYmd(today), 3));
    const inp = input || {};
    const out = [];

    /* tasks */
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

    /* events today */
    const evToday = (inp.events || []).filter(e => e.date === today);
    if (evToday.length) out.push({
      key: 'insights.eventsToday', tone: 'info', icon: 'calendar', params: { n: evToday.length },
    });

    /* money spent today (description only — no judgment) */
    const spent = (inp.expenses || [])
      .filter(e => e.date === today)
      .reduce((s, e) => s + (e.amount || 0), 0);
    if (spent > 0) out.push({
      key: 'insights.spentToday', tone: 'info', icon: 'wallet', money: spent,
    });

    /* debts — unpaid via payment log */
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

    /* habits scheduled today */
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

    /* next exam within 7 days */
    const nx = nextExam(inp.exams || [], today);
    if (nx && nx.daysUntil >= 0 && nx.daysUntil <= 7) out.push({
      key: 'insights.examSoon', tone: 'warn', icon: 'book', params: { days: nx.daysUntil },
    });

    return out;
  }

  LF.logic = {
    PRIORITIES, PRIORITY_WEIGHT, TASK_STATUSES, ACTIVE_STATUSES, EVENT_TYPES,
    validTime, timeToMin, minToTime,
    addMonthsClamped, nextDate, spawnNext, expandOccurrences,
    isOverdue, taskBucket, subtaskProgress, projectProgress, sortTasks,
    weekDays, monthGrid,
    daysInMonth, monthBounds, budgetPeriod, budgetStatus, topCategories, monthTrend,
    debtStatus, shoppingStats,
    sumMinutes, nextExam, assignmentStats,
    HABIT_TYPES, habitScheduledOn, habitDayValue, habitStreak, habitAdherence,
    goalProgress, reminderDue,
    taskStats, dailyCompletions, dailyInsights,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/quickadd.js ===== */
/* ============================================================
   LifeFlow — Quick Add (floating action button + menu)
   Enabled types open real modals; future phases listed muted.
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);

  const ITEMS = [
    { id: 'task', icon: 'list-checks', key: 'quickadd.task', phase: 2, run: () => LF.modals.task(null, {}, () => LF.shell.rerender()) },
    { id: 'event', icon: 'calendar', key: 'quickadd.event', phase: 2, run: () => LF.modals.event(null, {}, () => LF.shell.rerender()) },
    { id: 'project', icon: 'folder', key: 'quickadd.project', phase: 2, run: () => LF.modals.project(null, () => LF.shell.rerender()) },
    { id: 'expense', icon: 'wallet', key: 'quickadd.expense', phase: 3, run: () => LF.modals.expense(null, {}, () => LF.shell.rerender()) },
    { id: 'income', icon: 'banknote', key: 'quickadd.income', phase: 3, run: () => LF.modals.income(null, {}, () => LF.shell.rerender()) },
    { id: 'budget', icon: 'chart', key: 'quickadd.budget', phase: 3, feat: 'budget', run: () => LF.modals.budget(null, () => LF.shell.rerender()) },
    { id: 'debt', icon: 'credit-card', key: 'quickadd.debt', phase: 4, run: () => LF.modals.debt(null, 'iou', () => LF.shell.rerender()) },
    { id: 'contact', icon: 'users', key: 'quickadd.contact', phase: 4, run: () => LF.modals.contact(null, () => LF.shell.rerender()) },
    { id: 'shopping', icon: 'cart', key: 'quickadd.shopping', phase: 5, run: () => LF.modals.shoppingItem(null, {}, () => LF.shell.rerender()) },
    { id: 'note', icon: 'edit', key: 'quickadd.note', phase: 7, run: () => LF.modals.note(null, () => LF.shell.rerender()) },
    { id: 'goal', icon: 'target', key: 'quickadd.goal', phase: 7, run: () => LF.modals.goal(null, () => LF.shell.rerender()) },
    { id: 'habit', icon: 'flame', key: 'quickadd.habit', phase: 7, feat: 'habits', run: () => LF.modals.habit(null, () => LF.shell.rerender()) },
    { id: 'reminder', icon: 'bell', key: 'quickadd.reminder', phase: 7, run: () => LF.modals.reminder(null, {}, () => LF.shell.rerender()) },
  ];

  const quickadd = {
    _el: null,

    mount() {
      quickadd.unmount();
      const t = LF.i18n.t;
      const fab = el('button', {
        class: 'fab', 'aria-label': t('quickadd.title'), 'aria-haspopup': 'menu',
      }, ic('plus', 24));
      fab.addEventListener('click', () => quickadd.menu(fab));
      document.body.appendChild(fab);
      quickadd._el = fab;
    },

    unmount() {
      if (quickadd._el && quickadd._el.parentNode) quickadd._el.parentNode.removeChild(quickadd._el);
      quickadd._el = null;
    },

    menu(anchor) {
      const t = LF.i18n.t;
      LF.ui.dropdown(anchor, (panel) => {
        panel.classList.add('dd-qa');
        ITEMS.forEach(item => {
          /* hide items whose toggleable feature is off (progressive disclosure) */
          if (item.feat && !LF.store.feature(item.feat)) return;
          const enabled = typeof item.run === 'function';
          const row = el('button', {
            class: 'dd-item' + (enabled ? '' : ' is-soon'),
            'aria-disabled': enabled ? null : 'true',
          },
            ic(item.icon, 16),
            el('span', { class: 'grow', text: t(item.key) }),
            enabled ? null : el('span', { class: 'badge', text: t('common.phase', { n: item.phase }) })
          );
          if (enabled) row.addEventListener('click', () => item.run());
          else row.addEventListener('click', () =>
            LF.ui.toast(t('quickadd.comingSoon', { phase: item.phase }), { type: 'info' }));
          panel.appendChild(row);
        });
      }, { up: true, fixed: true });
    },
  };

  LF.quickadd = quickadd;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/login.js ===== */
/* ============================================================
   LifeFlow — Login / Register view (local accounts)
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);

  /** forward/back chevrons that adapt to RTL/LTR */
  function chevFwd() { const i = ic('chevron-left', 16); i.classList.add('icon-flip-ltr'); return i; }
  function chevBack() { const i = ic('chevron-left', 15); i.classList.add('icon-flip'); return i; }

  function authLayout() {
    document.getElementById('app').innerHTML = '';
    const wrap = el('div', { class: 'auth-wrap' });
    document.getElementById('app').appendChild(wrap);

    const prefs = LF.util.ls.get('lf.prefs', {}) || {};
    const theme = prefs.theme || 'system';

    const langBtn = el('button', {
      class: 'icon-btn', title: 'العربية / English', 'aria-label': 'Language',
      style: { background: 'var(--surface)', border: '1px solid var(--border)' },
    }, ic('globe', 18));
    langBtn.addEventListener('click', () => {
      const cur = (LF.store.settings && LF.store.settings.lang) || prefs.lang || 'ar';
      const nl = cur === 'ar' ? 'en' : 'ar';
      if (LF.store.settings && !LF.store.isDraft()) LF.store.saveSettings({ lang: nl });
      else LF.store.applyLook({ lang: nl });
      LF.views.login();
    });

    const themeBtn = el('button', {
      class: 'icon-btn', 'aria-label': 'Theme',
      style: { background: 'var(--surface)', border: '1px solid var(--border)' },
    }, ic(theme === 'dark' ? 'moon' : 'sun', 18));
    themeBtn.addEventListener('click', () => {
      const cur = (LF.store.settings && LF.store.settings.theme) || prefs.theme || 'system';
      const next = cur === 'light' ? 'dark' : 'light';
      LF.store.applyLook({ theme: next });
      LF.views.login();
    });

    wrap.appendChild(el('div', { class: 'auth-top' }, langBtn, themeBtn));
    return wrap;
  }

  function logoBlock(subKey) {
    return el('div', { class: 'auth-logo' },
      el('div', { class: 'logo-mark' }, ic('logo', 34)),
      el('h1', { text: 'LifeFlow' }),
      el('div', { class: 'muted small', text: LF.i18n.t(subKey) })
    );
  }

  function busy(btn, on, labelBusy) {
    if (on) {
      btn.setAttribute('disabled', '');
      btn.textContent = '';
      btn.appendChild(el('span', { class: 'spinner' }));
      btn.appendChild(document.createTextNode(' ' + labelBusy));
    } else {
      btn.removeAttribute('disabled');
      btn.textContent = btn.dataset.label || '';
    }
  }

  async function afterAuth() {
    await LF.store.loadAll();
    LF.store.applyPrefs();
    if (LF.store.settings && LF.store.settings.onboarded) {
      LF.router.go('#/app/dashboard');
    } else {
      LF.router.go('#/onboarding');
    }
  }

  const login = {
    async render() {
      const t = LF.i18n.t;
      const wrap = authLayout();
      const accounts = await LF.auth.accounts();

      const card = el('div', { class: 'auth-card' });
      wrap.appendChild(card);
      const googleBtn = el('button',{class:'btn primary',style:{width:'100%',marginBottom:'12px'},type:'button'},
        ic('user',16),'Continue with Google');
      googleBtn.addEventListener('click',async()=>{
        busy(googleBtn,true,t('common.loading'));
        try{ await LF.auth.googleSignIn(); try{await LF.drive.enableAuto();}catch(e){} await afterAuth(); }
        catch(e){ busy(googleBtn,false); LF.ui.toast(e&&e.code==='driveNeedClient'?t('settings.driveNeedClient'):t('app.errorGeneric'),{type:'error'}); }
      });
      card.appendChild(googleBtn);

      if (accounts.length) {
        card.appendChild(logoBlock('auth.chooseAccount'));
        accounts.forEach(acc => {
          const b = el('button', { class: 'account-card', style: { marginBottom: '8px' } },
            LF.ui.avatar(acc, null),
            el('div', { class: 'col grow', style: { gap: '0', minWidth: '0' } },
              el('div', { class: 'strong truncate', text: acc.name }),
              el('div', { class: 'muted xs truncate', text: '@' + acc.username })
            ),
            chevFwd()
          );
          b.addEventListener('click', () => login.passwordStep(card, acc));
          card.appendChild(b);
        });
        const newBtn = el('button', {
          class: 'btn ghost', style: { width: '100%', marginTop: '6px' },
        }, ic('plus', 16), t('auth.newAccount'));
        newBtn.addEventListener('click', () => login._registerForm(card, true));
        card.appendChild(newBtn);
      } else {
        card.appendChild(logoBlock('auth.heroSub'));
        login._registerForm(card, false);
      }

      const note = el('div', {
        class: 'faint xs row center', style: { gap: '6px' },
      }, ic('shield', 13), t('auth.localNote'));
      wrap.appendChild(note);
    },

    passwordStep(card, acc) {
      const t = LF.i18n.t;
      card.innerHTML = '';
      card.appendChild(logoBlock('auth.signInAs'));
      card.appendChild(el('div', {
        class: 'row', style: { gap: '10px', marginBottom: '18px', justifyContent: 'center' },
      }, LF.ui.avatar(acc, null),
        el('div', { class: 'col', style: { gap: '0' } },
          el('div', { class: 'strong', text: acc.name }),
          el('div', { class: 'muted xs', text: '@' + acc.username }))));

      const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });
      const pw = el('input', {
        class: 'input', type: 'password', autocomplete: 'current-password',
        placeholder: t('auth.password'), 'aria-label': t('auth.password'),
      });

      function doLogin(btn) {
        busy(btn, true, t('common.loading'));
        err.style.display = 'none';
        LF.auth.login(acc.id, pw.value).then(() => afterAuth()).catch(e => {
          busy(btn, false);
          const code = e && e.code ? e.code : 'app.errorGeneric';
          err.textContent = code === 'auth.locked'
            ? t('auth.locked', { sec: e.secs }) : t(code);
          err.style.display = '';
          pw.focus();
        });
      }

      const submit = el('button', {
        class: 'btn primary', 'data-label': t('auth.signIn'), type: 'submit',
        style: { width: '100%' },
      }, t('auth.signIn'));
      submit.addEventListener('click', () => doLogin(submit));
      pw.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(submit); });

      card.appendChild(el('form', { on: { submit: (e) => { e.preventDefault(); doLogin(submit); } } },
        LF.ui.field(t('auth.password'), pw),
        err,
        el('div', { style: { height: '12px' } }),
        submit
      ));

      const back = el('button', {
        class: 'btn ghost', style: { width: '100%', marginTop: '10px' },
      }, chevBack(), t('common.back'));
      back.addEventListener('click', () => LF.views.login());
      card.appendChild(back);

      setTimeout(() => pw.focus(), 30);
    },

    _registerForm(card, hasAccounts) {
      const t = LF.i18n.t;
      card.innerHTML = '';
      if (!hasAccounts) card.appendChild(logoBlock('auth.heroSub'));
      else card.appendChild(el('h2', { text: t('auth.newAccount'), style: { marginBottom: '16px' } }));

      const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });
      const name = el('input', {
        class: 'input', autocomplete: 'name',
        placeholder: t('auth.namePlaceholder'), 'aria-label': t('common.name'),
      });
      const username = el('input', {
        class: 'input', autocomplete: 'username', dir: 'ltr',
        placeholder: 'username', 'aria-label': t('auth.username'),
      });
      const pw = el('input', {
        class: 'input', type: 'password', autocomplete: 'new-password',
        placeholder: t('auth.password'), 'aria-label': t('auth.password'),
      });
      const pw2 = el('input', {
        class: 'input', type: 'password', autocomplete: 'new-password',
        placeholder: t('auth.confirmPassword'), 'aria-label': t('auth.confirmPassword'),
      });

      // Username is independent and must be entered manually.
      username.addEventListener('input', () => { username.dataset.touched = '1'; });

      let showPw = false;
      const eyeBtn = el('button', {
        class: 'icon-btn', type: 'button', 'aria-label': t('auth.showPassword'),
      }, ic('eye', 16));
      eyeBtn.addEventListener('click', () => {
        showPw = !showPw;
        pw.type = showPw ? 'text' : 'password';
        pw2.type = showPw ? 'text' : 'password';
        eyeBtn.innerHTML = '';
        eyeBtn.appendChild(ic(showPw ? 'eye-off' : 'eye', 16));
      });

      function doRegister(btn) {
        busy(btn, true, t('common.loading'));
        err.style.display = 'none';
        if (pw.value !== pw2.value) {
          busy(btn, false);
          err.textContent = t('auth.errMismatch');
          err.style.display = '';
          return;
        }
        LF.auth.register({
          name: name.value, username: username.value, password: pw.value,
        }).then(() => afterAuth()).catch(e => {
          busy(btn, false);
          const code = e && e.code ? e.code : 'app.errorGeneric';
          err.textContent = t(code);
          err.style.display = '';
        });
      }

      const submit = el('button', {
        class: 'btn primary lg', 'data-label': t('auth.createAccount'), type: 'submit',
        style: { width: '100%' },
      }, t('auth.createAccount'));
      submit.addEventListener('click', () => doRegister(submit));

      card.appendChild(el('form', { on: { submit: (e) => { e.preventDefault(); doRegister(submit); } } },
        LF.ui.field(t('common.name'), name),
        el('div', { style: { height: '12px' } }),
        LF.ui.field(t('auth.username'), username, { hint: t('auth.usernameHint') }),
        el('div', { style: { height: '12px' } }),
        LF.ui.field(t('auth.password'), el('div', { class: 'row', style: { gap: '0' } }, pw, eyeBtn), { hint: t('auth.passwordHint') }),
        el('div', { style: { height: '12px' } }),
        LF.ui.field(t('auth.confirmPassword'), pw2),
        err,
        el('div', { style: { height: '16px' } }),
        submit
      ));

      if (hasAccounts) {
        const back = el('button', {
          class: 'btn ghost', style: { width: '100%', marginTop: '10px' },
        }, chevBack(), t('common.back'));
        back.addEventListener('click', () => LF.views.login());
        card.appendChild(back);
      }
      setTimeout(() => name.focus(), 30);
    },
  };

  LF.views = LF.views || {};
  LF.views.login = async function () { await login.render(); };
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/onboarding.js ===== */
/* ============================================================
   LifeFlow — Onboarding wizard
   1: welcome+language · 2: usage types · 3: currency ·
   4: preferences · 5: features · 6: done
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);

  const USAGE_TYPES = [
    { id: 'student', icon: 'book' },
    { id: 'employee', icon: 'briefcase' },
    { id: 'business', icon: 'chart' },
    { id: 'home', icon: 'home' },
    { id: 'personal', icon: 'user' },
  ];

  function state() {
    const s = LF.store.settings;
    return {
      lang: s.lang, usageTypes: s.usageTypes.slice(), currency: s.currency,
      weekStart: s.weekStart, timeFormat: s.timeFormat, numerals: s.numerals,
      features: Object.assign({}, s.features),
    };
  }

  let st = null;
  let step = 0;

  function featureDefaultsFor(types) {
    return {
      budget: true,
      habits: true,
      study: types.indexOf('student') !== -1,
      work: types.indexOf('employee') !== -1 || types.indexOf('business') !== -1,
      home: types.indexOf('home') !== -1,
    };
  }

  const wizard = {
    async render() {
      const t = LF.i18n.t;
      if (!st) st = state();
      document.getElementById('app').innerHTML = '';

      const wrap = el('div', { class: 'ob-wrap' });
      const card = el('div', { class: 'ob-card' });
      wrap.appendChild(card);
      document.getElementById('app').appendChild(wrap);

      const TOTAL = 6;
      const dots = el('div', { class: 'ob-dots' });
      for (let i = 0; i < TOTAL; i++) {
        dots.appendChild(el('div', { class: 'ob-dot' + (i === step ? ' on' : '') }));
      }
      card.appendChild(dots);
      const body = el('div', { class: 'ob-body' });
      card.appendChild(body);

      const steps = [wizard.stepWelcome, wizard.stepUsage, wizard.stepCurrency,
        wizard.stepPrefs, wizard.stepFeatures, wizard.stepDone];
      steps[step](body);

      // footer
      const back = el('button', { class: 'btn ghost' }, ic('chevron-right', 15), t('common.back'));
      back.addEventListener('click', () => { step--; wizard.render(); });
      if (step === 0) back.style.visibility = 'hidden';

      let nextLabel = step === TOTAL - 1 ? t('onboarding.startNow') : t('common.next');
      const next = el('button', { class: 'btn primary lg' }, nextLabel, step === TOTAL - 1 ? ic('sparkles', 16) : null);
      next.addEventListener('click', async () => {
        if (step === 1 && !st.usageTypes.length) {
          LF.ui.toast(t('onboarding.pickUsage'), { type: 'warn' });
          return;
        }
        if (step < TOTAL - 1) {
          step++;
          if (step === 2) st.features = featureDefaultsFor(st.usageTypes);
          wizard.render();
        } else {
          await wizard.finish();
        }
      });

      card.appendChild(el('div', { class: 'ob-foot' }, back,
        el('span', { class: 'faint xs', text: t('onboarding.stepOf', { n: step + 1, total: TOTAL }) }),
        next));
    },

    stepWelcome(body) {
      const t = LF.i18n.t;
      body.appendChild(el('h2', { class: 'ob-step-title', text: t('onboarding.welcomeTitle', { name: LF.store.user ? LF.store.user.name : '' }) }));
      body.appendChild(el('div', { class: 'ob-step-sub', text: t('onboarding.welcomeSub') }));

      const seg = LF.ui.seg([
        { value: 'ar', label: 'العربية' },
        { value: 'en', label: 'English' },
      ], st.lang, (v) => {
        st.lang = v;
        LF.store.applyLook({ lang: v });
        wizard.render();
      });
      body.appendChild(el('div', { class: 'row', style: { gap: '14px', marginTop: '14px' } },
        ic('globe', 18), seg));
      body.appendChild(el('div', { class: 'faint xs', style: { marginTop: '12px' }, text: t('onboarding.langHint') }));
    },

    stepUsage(body) {
      const t = LF.i18n.t;
      body.appendChild(el('h2', { class: 'ob-step-title', text: t('onboarding.usageTitle') }));
      body.appendChild(el('div', { class: 'ob-step-sub', text: t('onboarding.usageSub') }));

      const grid = el('div', { class: 'col gap-3', style: { gap: '10px' } });
      USAGE_TYPES.forEach(u => {
        const on = st.usageTypes.indexOf(u.id) !== -1;
        const chip = el('button', {
          class: 'chip', 'aria-pressed': on ? 'true' : 'false',
          style: { justifyContent: 'flex-start', padding: '13px 16px', borderRadius: 'var(--radius-m)' },
        },
          ic(u.icon, 18),
          el('span', { text: t('onboarding.usage_' + u.id) }),
          el('span', { class: 'grow' }),
          on ? ic('check', 16) : null
        );
        chip.addEventListener('click', () => {
          const i = st.usageTypes.indexOf(u.id);
          if (i === -1) st.usageTypes.push(u.id); else st.usageTypes.splice(i, 1);
          wizard.render();
        });
        grid.appendChild(chip);
      });
      body.appendChild(grid);
    },

    stepCurrency(body) {
      const t = LF.i18n.t;
      body.appendChild(el('h2', { class: 'ob-step-title', text: t('onboarding.currencyTitle') }));
      body.appendChild(el('div', { class: 'ob-step-sub', text: t('onboarding.currencySub') }));

      const search = el('input', {
        class: 'input', type: 'search',
        placeholder: t('common.search'), 'aria-label': t('common.search'),
      });
      const list = el('div', { class: 'cur-list', style: { marginTop: '10px' } });

      function draw(filter) {
        list.innerHTML = '';
        const f = (filter || '').trim().toLowerCase();
        LF.money.list(st.lang).filter(c =>
          !f || c.code.toLowerCase().indexOf(f) !== -1 || c.name.toLowerCase().indexOf(f) !== -1
        ).forEach(c => {
          const row = el('button', {
            class: 'cur-row', 'aria-pressed': c.code === st.currency ? 'true' : 'false',
          },
            el('span', { class: 'cur-code', text: c.code }),
            el('span', { class: 'grow', text: c.name }),
            c.code === st.currency ? ic('check', 16) : null
          );
          row.addEventListener('click', () => { st.currency = c.code; wizard.render(); });
          list.appendChild(row);
        });
      }
      search.addEventListener('input', () => draw(search.value));
      body.appendChild(search);
      body.appendChild(list);
      draw('');
    },

    stepPrefs(body) {
      const t = LF.i18n.t;
      body.appendChild(el('h2', { class: 'ob-step-title', text: t('onboarding.prefsTitle') }));
      body.appendChild(el('div', { class: 'ob-step-sub', text: t('onboarding.prefsSub') }));

      const rows = el('div', { class: 'col', style: { gap: '16px' } });

      rows.appendChild(LF.ui.field(t('onboarding.weekStart'), LF.ui.seg([
        { value: 0, label: LF.i18n.weekdayName(0) },
        { value: 6, label: LF.i18n.weekdayName(6) },
        { value: 1, label: LF.i18n.weekdayName(1) },
      ], st.weekStart, v => { st.weekStart = v; })));

      rows.appendChild(LF.ui.field(t('onboarding.timeFormat'), LF.ui.seg([
        { value: '24h', label: t('onboarding.tf24') },
        { value: '12h', label: t('onboarding.tf12') },
      ], st.timeFormat, v => { st.timeFormat = v; })));

      if (st.lang === 'ar') {
        rows.appendChild(LF.ui.field(t('onboarding.numerals'), LF.ui.seg([
          { value: 'latn', label: '123' },
          { value: 'arab', label: '١٢٣' },
        ], st.numerals, v => { st.numerals = v; })));
      }

      body.appendChild(rows);
    },

    stepFeatures(body) {
      const t = LF.i18n.t;
      body.appendChild(el('h2', { class: 'ob-step-title', text: t('onboarding.featuresTitle') }));
      body.appendChild(el('div', { class: 'ob-step-sub', text: t('onboarding.featuresSub') }));

      const defs = [
        { id: 'budget', icon: 'wallet' },
        { id: 'habits', icon: 'flame' },
        { id: 'study', icon: 'book' },
        { id: 'work', icon: 'briefcase' },
        { id: 'home', icon: 'home' },
      ];
      const list = el('div', { class: 'col', style: { gap: '8px' } });
      defs.forEach(f => {
        const row = el('div', {
          class: 'row', style: {
            gap: '12px', padding: '12px 14px',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-m)',
          },
        }, ic(f.icon, 18),
          el('div', { class: 'col grow', style: { gap: '0' } },
            el('span', { class: 'strong small', text: t('onboarding.feat_' + f.id) }),
            el('span', { class: 'faint xs', text: t('onboarding.featDesc_' + f.id) })),
          LF.ui.switchEl(st.features[f.id], v => { st.features[f.id] = v; }, t('onboarding.feat_' + f.id))
        );
        list.appendChild(row);
      });
      body.appendChild(list);
    },

    stepDone(body) {
      const t = LF.i18n.t;
      body.appendChild(el('h2', { class: 'ob-step-title', text: t('onboarding.readyTitle') }));
      body.appendChild(el('div', { class: 'ob-step-sub', text: t('onboarding.readySub') }));

      const summary = el('div', { class: 'col', style: { gap: '8px' } });
      const cur = LF.money.CURRENCIES[st.currency];
      const pairs = [
        [t('onboarding.usageTitle'), st.usageTypes.map(u => t('onboarding.usage_' + u)).join('، ')],
        [t('common.currency'), st.currency + ' — ' + (cur ? (st.lang === 'ar' ? cur[0] : cur[1]) : '')],
        [t('onboarding.weekStart'), LF.i18n.weekdayName(st.weekStart)],
        [t('onboarding.featuresTitle'), Object.keys(st.features).filter(k => st.features[k]).map(k => t('onboarding.feat_' + k)).join('، ')],
      ];
      pairs.forEach(([k, v]) => {
        summary.appendChild(el('div', { class: 'row between', style: { gap: '10px' } },
          el('span', { class: 'muted small', text: k }),
          el('span', { class: 'strong small', text: v, style: { textAlign: 'end' } })));
      });
      body.appendChild(el('div', { class: 'card card-pad' }, summary));
      body.appendChild(el('div', { class: 'faint xs', style: { marginTop: '12px' }, text: t('onboarding.changeLater') }));
    },

    async finish() {
      const t = LF.i18n.t;
      // save settings
      await LF.store.saveSettings({
        lang: st.lang,
        usageTypes: st.usageTypes.slice(),
        currency: st.currency,
        weekStart: st.weekStart,
        timeFormat: st.timeFormat,
        numerals: st.numerals,
        features: Object.assign({}, st.features),
      });
      // default workspaces
      if (!LF.store.workspaces.length) {
        await LF.store.addWorkspace(t('ws.personal'));
        if (st.usageTypes.indexOf('student') !== -1) await LF.store.addWorkspace(t('ws.university'));
        if (st.usageTypes.indexOf('employee') !== -1) await LF.store.addWorkspace(t('ws.work'));
        if (st.usageTypes.indexOf('business') !== -1) await LF.store.addWorkspace(t('ws.business'));
        if (st.usageTypes.indexOf('home') !== -1) await LF.store.addWorkspace(t('ws.home'));
        await LF.store.saveSettings({ activeWorkspaceId: LF.store.workspaces[0].id });
      }
      await LF.store.saveSettings({ onboarded: true });
      st = null; step = 0;
      LF.ui.toast(t('onboarding.welcomeDone'), { type: 'ok' });
      LF.router.go('#/app/dashboard');
    },
  };

  LF.views = LF.views || {};
  LF.views.onboarding = async function () { await wizard.render(); };
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/dashboard.js ===== */
/* ============================================================
   LifeFlow — Dashboard (customizable widgets)
   Data reads are live: widgets light up automatically as later
   phases add data. Cards hide when feature off / no data.
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);

  /* ---------- widget registry ---------- */
  LF.widgets = LF.widgets || {};
  const W = LF.widgets;

  function greeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'dashboard.gMorning';
    if (h >= 12 && h < 15) return 'dashboard.gNoon';
    if (h >= 15 && h < 19) return 'dashboard.gEvening';
    return h >= 19 && h < 24 ? 'dashboard.gEvening' : 'dashboard.gNight';
  }

  function card(labelKey, value, subKey) {
    return el('div', { class: 'kpi' },
      el('div', { class: 'kpi-label', text: LF.i18n.t(labelKey) }),
      el('div', { class: 'kpi-value', text: value }),
      subKey ? el('div', { class: 'kpi-sub', text: LF.i18n.t(subKey) }) : null
    );
  }

  /* Summary of today — computed from live stores (empty in phase 1) */
  W.daySummary = {
    id: 'daySummary', icon: 'sparkles',
    title: 'dashboard.wSummary',
    avail() { return true; },
    async render(body) {
      const t = LF.i18n.t;
      const today = LF.util.todayYmd();

      /* full task list — dailyInsights needs open/overdue across days */
      const [tasks, events, expenses, debts, debtPays, habits, habitLogs, exams] = await Promise.all([
        LF.db.list('tasks', {}),
        LF.db.list('events', { predicate: r => r.date === today }),
        LF.db.list('expenses', { predicate: r => r.date === today }),
        LF.db.list('debts', {}),
        LF.db.list('debtPayments', {}),
        LF.db.list('habits', {}),
        LF.db.list('habitLogs', {}),
        LF.db.list('exams', {}),
      ]);

      const todayTasks = tasks.filter(x => x.date === today && x.status !== 'cancelled');
      const done = todayTasks.filter(x => x.status === 'done').length;
      const spent = expenses.reduce((s, x) => s + (x.amount || 0), 0);
      const anyData = tasks.length || events.length || expenses.length ||
        debts.length || habits.length;

      body.appendChild(el('div', { class: 'muted small', style: { marginBottom: '12px' } },
        t('dashboard.todayLine', {
          tasks: todayTasks.length,
          events: events.length,
          spent: LF.i18n.money(spent),
        })));

      if (!anyData) {
        body.appendChild(el('div', { class: 'banner info' },
          ic('info', 16),
          el('div', { class: 'grow', text: t('dashboard.noDataYet') })));
        return;
      }

      /* smart summary (spec #30) — descriptive suggestions only */
      const insights = LF.logic.dailyInsights({
        tasks, events, expenses, debts, debtPayments: debtPays,
        habits, habitLogs, exams,
      }, today);
      if (insights.length) {
        const list = el('div', { class: 'insight-list' });
        insights.forEach(ins => {
          const p = Object.assign({}, ins.params || {});
          if (ins.money != null) p.amount = LF.i18n.money(ins.money);
          list.appendChild(el('div', { class: 'insight-row ' + (ins.tone || 'info') },
            ic(ins.icon, 15),
            el('span', { text: t(ins.key, p) })));
        });
        body.appendChild(list);
      }

      const grid = el('div', { class: 'kpi-grid' });
      grid.appendChild(card('dashboard.kTasks', String(todayTasks.length)));
      if (todayTasks.length) grid.appendChild(card('dashboard.kDone', done + '/' + todayTasks.length));
      if (events.length) grid.appendChild(card('dashboard.kEvents', String(events.length)));
      if (expenses.length) grid.appendChild(card('dashboard.kSpent', LF.i18n.money(spent)));
      if (debts.length) {
        /* status is computed from the payment log (LF.logic.debtStatus) */
        const due = debts.filter(d => {
          const st = LF.logic.debtStatus(d, debtPays, today);
          return st.state !== 'paid' && d.dueDate && d.dueDate <= today;
        });
        if (due.length) grid.appendChild(card('dashboard.kDueDebts', String(due.length)));
      }
      if (todayTasks.length) {
        const pct = todayTasks.length ? Math.round((done / todayTasks.length) * 100) : 0;
        grid.appendChild(card('dashboard.kCompletion', pct + '%'));
      }
      body.appendChild(grid);
    },
  };

  /* Today's tasks — quick list with complete toggles */
  W.todayTasks = {
    id: 'todayTasks', icon: 'list-checks',
    title: 'dashboard.wTodayTasks',
    avail() { return true; },
    async render(body) {
      const t = LF.i18n.t;
      const today = LF.util.todayYmd();
      const tasks = await LF.db.list('tasks', {});
      const todayList = LF.logic.sortTasks(
        tasks.filter(x => (x.date === today || LF.logic.isOverdue(x, today)) &&
          x.status !== 'cancelled' && x.status !== 'done'), 'priority');

      if (!todayList.length) {
        const anyDone = tasks.some(x => x.date === today && x.status === 'done');
        body.appendChild(LF.ui.empty('check-circle',
          anyDone ? t('dashboard.allDone') : t('dashboard.noTasksToday'),
          anyDone ? '' : t('dashboard.noTasksTodayHint'),
          anyDone ? null : el('button', {
            class: 'btn soft sm',
            onclick: () => LF.modals.task(null, { date: today }, () => LF.shell.rerender()),
          }, LF.ui.icon('plus', 13), t('tasks.new'))));
        return;
      }

      const list = el('div', { class: 'col', style: { gap: '7px' } });
      todayList.slice(0, 6).forEach(x => {
        const cb = el('button', {
          class: 'cbox', role: 'checkbox', 'aria-checked': 'false',
          'aria-label': t('tasks.markDone'),
        }, ic('check', 12));
        cb.addEventListener('click', async () => {
          x.status = 'done';
          x.completedAt = new Date().toISOString();
          await LF.db.put('tasks', x);
          const next = LF.logic.spawnNext(x);
          if (next) {
            await LF.db.put('tasks', next);
            const subs = await LF.db.list('subtasks', { predicate: sb => sb.taskId === x.id });
            for (const sb of subs) await LF.db.put('subtasks', { taskId: next.id, title: sb.title, done: false, position: sb.position });
          }
          LF.shell.rerender();
        });
        list.appendChild(el('div', { class: 'row', style: { gap: '10px' } },
          cb,
          el('span', {
            class: 'grow small truncate',
            style: { cursor: 'pointer' },
            onclick: () => LF.modals.task(x, {}, () => LF.shell.rerender()),
          }, x.title),
          LF.logic.isOverdue(x, today)
            ? el('span', { class: 'mchip danger', text: t('tasks.fOverdue') }) : null,
          el('span', { class: 'p-dot p-' + (x.priority || 'medium') })
        ));
      });
      body.appendChild(list);
      if (todayList.length > 6) {
        body.appendChild(el('div', { class: 'faint xs', style: { marginTop: '6px' }, text: t('dashboard.andMore', { n: todayList.length - 6 }) }));
      }
      const viewAll = el('a', { href: '#/app/tasks', class: 'btn ghost sm' }, t('dashboard.viewAllTasks'));
      const vaIc = ic('chevron-left', 13); vaIc.classList.add('icon-flip');
      viewAll.insertBefore(vaIc, viewAll.firstChild);
      body.appendChild(el('div', { style: { marginTop: '10px' } }, viewAll));
    },
  };

  /* This month's money: spent / income / net + budget bars */
  W.finance = {
    id: 'finance', icon: 'wallet',
    title: 'dashboard.wFinance',
    avail() { return true; },
    async render(body) {
      const t = LF.i18n.t;
      const s = LF.store.settings || {};
      const today = LF.util.todayYmd();
      const b = LF.logic.monthBounds(today);

      const [allExpenses, incomes, budgets, cats] = await Promise.all([
        LF.db.list('expenses', {}),   // all: budgets may span wider than this month
        LF.db.list('incomes', { predicate: r => r.date >= b.from && r.date <= b.to }),
        LF.db.list('budgets', {}),
        LF.db.list('expenseCategories', {}),
      ]);
      const expenses = allExpenses.filter(r => r.date >= b.from && r.date <= b.to);
      const cMap = {};
      cats.forEach(c => { cMap[c.id] = c; });

      const spent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const earned = incomes.reduce((sum, e) => sum + (e.amount || 0), 0);
      const net = earned - spent;

      body.appendChild(el('div', { class: 'kpi-grid', style: { marginBottom: '12px' } },
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('income.kExpense') }),
          el('div', { class: 'kpi-value', text: LF.i18n.money(spent) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('income.kIncome') }),
          el('div', { class: 'kpi-value', text: LF.i18n.money(earned) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('income.kNet') }),
          el('div', { class: 'kpi-value ' + (net >= 0 ? 'pos' : 'neg'), text: (net > 0 ? '+' : '') + LF.i18n.money(net) }))));

      const weekStart = s.weekStart == null ? 0 : s.weekStart;
      const budgetOn = !LF.store.feature || LF.store.feature('budget');
      if (budgetOn) budgets.slice(0, 3).forEach(bd => {
        const st = LF.logic.budgetStatus(bd, expenses, today, weekStart);
        const label = bd.name || (bd.categoryId && cMap[bd.categoryId]
          ? (cMap[bd.categoryId].name || t('expenses.cat_' + (cMap[bd.categoryId].key || 'other')))
          : t('budgets.general'));
        const barColor = st.state === 'over' ? 'var(--danger)' : st.state === 'warn' ? 'var(--warn, #f59e0b)' : 'var(--accent)';
        body.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'center', marginBottom: '8px' } },
          el('span', { class: 'small grow truncate', text: label + ' · ' + t('budgets.p_' + (bd.period || 'monthly')) }),
          el('div', { class: 'progress', style: { maxWidth: '130px', minWidth: '60px' } },
            el('div', { style: { width: Math.min(100, st.pct) + '%', background: barColor } })),
          el('span', {
            class: 'xs num ' + (st.remaining >= 0 ? 'pos' : 'neg'),
            text: t('budgets.remaining', { amount: LF.i18n.money(Math.abs(st.remaining)) }),
          })));
      });

      const viewAll = el('a', { href: '#/app/expenses', class: 'btn ghost sm' }, t('expenses.viewAll'));
      const vaIc = ic('chevron-left', 13); vaIc.classList.add('icon-flip');
      viewAll.insertBefore(vaIc, viewAll.firstChild);
      body.appendChild(el('div', { style: { marginTop: '10px' } }, viewAll));
    },
  };

  /* Shopping list — next unchecked items with quick check-off */
  W.shopping = {
    id: 'shopping', icon: 'cart',
    title: 'dashboard.wShopping',
    avail() { return true; },
    async render(body) {
      const t = LF.i18n.t;
      const [lists, items] = await Promise.all([
        LF.db.list('shoppingLists', {}),
        LF.db.list('shoppingItems', {}),
      ]);
      const openItems = items.filter(i => !i.purchased);
      const activeList = lists.find(l => openItems.some(i => i.listId === l.id)) || lists[0];
      const listItems = openItems.filter(i => activeList && i.listId === activeList.id).slice(0, 6);

      if (!listItems.length) {
        body.appendChild(el('div', { class: 'muted small' }, t('shopping.allBought')));
        const addBtn = el('a', { href: '#/app/shopping', class: 'btn ghost sm', style: { marginTop: '8px' } },
          ic('plus', 13), t('shopping.addItem'));
        body.appendChild(el('div', {}, addBtn));
        return;
      }

      const wrap = el('div', { class: 'col', style: { gap: '6px' } });
      listItems.forEach(item => {
        const cb = el('button', {
          class: 'cbox', role: 'checkbox', 'aria-checked': 'false',
          'aria-label': t('shopping.markPurchased'),
        }, ic('check', 13));
        cb.addEventListener('click', async () => {
          item.purchased = true;
          await LF.db.put('shoppingItems', item);
          body.innerHTML = '';
          await W.shopping.render(body);
        });
        wrap.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'center' } },
          cb,
          el('span', { class: 'small grow truncate', text: item.name }),
          item.expectedPrice != null
            ? el('span', { class: 'xs muted num', text: LF.i18n.money(item.expectedPrice) }) : null));
      });
      body.appendChild(wrap);
      if (openItems.length > listItems.length) {
        body.appendChild(el('div', { class: 'faint xs', style: { marginTop: '6px' },
          text: t('dashboard.andMore', { n: openItems.length - listItems.length }) }));
      }
      const viewAll = el('a', { href: '#/app/shopping', class: 'btn ghost sm' },
        t('shopping.viewAll') + (activeList ? ' · ' + activeList.name : ''));
      const vaIc = ic('chevron-left', 13); vaIc.classList.add('icon-flip');
      viewAll.insertBefore(vaIc, viewAll.firstChild);
      body.appendChild(el('div', { style: { marginTop: '10px' } }, viewAll));
    },
  };

  /* Home today — cleaning/cooking/bills with complete toggles */
  W.home = {
    id: 'home', icon: 'home',
    title: 'dashboard.wHome',
    avail() { return !LF.store.feature || LF.store.feature('home'); },
    async render(body) {
      const t = LF.i18n.t;
      const today = LF.util.todayYmd();
      const tasks = await LF.db.list('homeTasks', {});
      const todayList = tasks.filter(x => x.status !== 'done' && x.status !== 'cancelled' &&
        (!x.date || x.date <= today));
      todayList.sort((a, b) => ((a.date || '9999') + (a.time || '')).localeCompare((b.date || '9999') + (b.time || '')));
      const shown = todayList.slice(0, 6);

      if (!shown.length) {
        body.appendChild(el('div', { class: 'muted small' }, t('home.allDoneToday')));
        return;
      }

      const wrap = el('div', { class: 'col', style: { gap: '6px' } });
      for (const task of shown) {
        const cb = el('button', {
          class: 'cbox', role: 'checkbox', 'aria-checked': 'false',
          'aria-label': t('tasks.markDone'),
        }, ic('check', 13));
        cb.addEventListener('click', async () => {
          task.status = 'done';
          task.completedAt = new Date().toISOString();
          await LF.db.put('homeTasks', task);
          const next = LF.logic.spawnNext(task);
          if (next) await LF.db.put('homeTasks', next);
          body.innerHTML = '';
          await W.home.render(body);
        });
        wrap.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'center' } },
          cb,
          el('span', { class: 'small grow truncate', text: task.title }),
          task.recurrence && task.recurrence.type !== 'none'
            ? el('span', { class: 'xs muted' }, ic('refresh', 11)) : null));
      }
      body.appendChild(wrap);
      const viewAll = el('a', { href: '#/app/home', class: 'btn ghost sm' }, t('home.viewAll'));
      const vaIc = ic('chevron-left', 13); vaIc.classList.add('icon-flip');
      viewAll.insertBefore(vaIc, viewAll.firstChild);
      body.appendChild(el('div', { style: { marginTop: '10px' } }, viewAll));
    },
  };

  /* Study summary — hours this week, next exam, open assignments */
  W.study = {
    id: 'study', icon: 'book',
    title: 'dashboard.wStudy',
    avail() { return !LF.store.feature || LF.store.feature('study'); },
    async render(body) {
      const t = LF.i18n.t;
      const today = LF.util.todayYmd();
      const weekAgo = LF.util.ymd(LF.util.addDays(LF.util.fromYmd(today), -6));
      const [sessions, exams, assignments, subjects] = await Promise.all([
        LF.db.list('studySessions', {}),
        LF.db.list('exams', {}),
        LF.db.list('assignments', {}),
        LF.db.list('subjects', {}),
      ]);
      const fmtMin = (min) => {
        const h = Math.floor(min / 60), mm = min % 60;
        return h ? LF.i18n.num(h) + ' ' + t('study.hourShort') +
          (mm ? ' ' + LF.i18n.num(mm) + ' ' + t('study.minShort') : '') : LF.i18n.num(mm) + ' ' + t('study.minShort');
      };
      const weekMin = LF.logic.sumMinutes(sessions, weekAgo, today);
      const nx = LF.logic.nextExam(exams, today);
      const aSt = LF.logic.assignmentStats(assignments, today);
      const subjName = (id) => ((subjects.find(x => x.id === id) || {}).name) || '';

      body.appendChild(el('div', { class: 'kpi-grid' },
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('study.kHours') }),
          el('div', { class: 'kpi-value', text: fmtMin(weekMin) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('study.kAssignments') }),
          el('div', { class: 'kpi-value', text: LF.i18n.num(aSt.open) })),
        nx ? el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('study.kNextExam') }),
          el('div', { class: 'kpi-value', style: { fontSize: 'var(--fs-l)' },
            text: subjName(nx.exam.subjectId) || '—' }),
          el('div', { class: 'kpi-sub', text: t('study.inDays', { n: nx.daysUntil }) })) : null));
      const viewAll = el('a', { href: '#/app/study', class: 'btn ghost sm' }, t('study.viewAll'));
      const vaIc = ic('chevron-left', 13); vaIc.classList.add('icon-flip');
      viewAll.insertBefore(vaIc, viewAll.firstChild);
      body.appendChild(el('div', { style: { marginTop: '10px' } }, viewAll));
    },
  };

  /* Work summary — open work tasks, today's meetings, week hours */
  W.work = {
    id: 'work', icon: 'briefcase',
    title: 'dashboard.wWork',
    avail() { return !LF.store.feature || LF.store.feature('work'); },
    async render(body) {
      const t = LF.i18n.t;
      const today = LF.util.todayYmd();
      const weekAgo = LF.util.ymd(LF.util.addDays(LF.util.fromYmd(today), -6));
      let wsId = null;
      try { wsId = (await LF.workHelpers.ensureWorkWorkspace()).id; } catch (e) { wsId = null; }
      const [tasks, events, reviews] = await Promise.all([
        wsId ? LF.db.list('tasks', { predicate: x => x.workspaceId === wsId }) : Promise.resolve([]),
        LF.db.list('events', { predicate: e => e.type === 'meeting' }),
        LF.db.list('dayReviews', {}),
      ]);
      const open = tasks.filter(x => x.status !== 'done' && x.status !== 'cancelled');
      const todayMeetings = events.filter(e => e.date === today);
      const weekMin = LF.logic.sumMinutes(reviews, weekAgo, today, 'workMinutes');

      body.appendChild(el('div', { class: 'kpi-grid' },
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('work.kOpenTasks') }),
          el('div', { class: 'kpi-value', text: LF.i18n.num(open.length) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('work.kMeetings') }),
          el('div', { class: 'kpi-value', text: LF.i18n.num(todayMeetings.length) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('work.kHours') }),
          el('div', { class: 'kpi-value', text: LF.i18n.num(Math.round((weekMin / 60) * 10) / 10) + ' ' + t('study.hourShort') }))));
      const viewAll = el('a', { href: '#/app/work', class: 'btn ghost sm' }, t('work.viewAll'));
      const vaIc = ic('chevron-left', 13); vaIc.classList.add('icon-flip');
      viewAll.insertBefore(vaIc, viewAll.firstChild);
      body.appendChild(el('div', { style: { marginTop: '10px' } }, viewAll));
    },
  };

  /* Habits today — quick check-off with streaks */
  W.habits = {
    id: 'habits', icon: 'flame',
    title: 'dashboard.wHabits',
    avail() { return !LF.store.feature || LF.store.feature('habits'); },
    async render(body) {
      const t = LF.i18n.t;
      const today = LF.util.todayYmd();
      const [habits, logs] = await Promise.all([
        LF.db.list('habits', {}),
        LF.db.list('habitLogs', {}),
      ]);
      const todays = habits.filter(h => {
        const sch = (h.schedule || {}).type || 'daily';
        return sch === 'weekly' || LF.logic.habitScheduledOn(h, today);
      });
      if (!todays.length) {
        body.appendChild(el('div', { class: 'muted small' }, t('habits.noneToday')));
        return;
      }
      const wrap = el('div', { class: 'col', style: { gap: '6px' } });
      for (const h of todays.slice(0, 6)) {
        const hLogs = logs.filter(l => l.habitId === h.id);
        const dv = LF.logic.habitDayValue(h, hLogs, today);
        const streak = LF.logic.habitStreak(h, hLogs, today);
        const cb = el('button', {
          class: 'cbox', role: 'checkbox',
          'aria-checked': dv.done ? 'true' : 'false',
          'aria-label': h.name,
        }, ic('check', 13));
        cb.addEventListener('click', async () => {
          if (dv.done) {
            const mine = hLogs.filter(l => l.date === today);
            for (const l of mine) await LF.db.delete('habitLogs', l.id);
          } else {
            await LF.db.put('habitLogs', { habitId: h.id, date: today, count: 1 });
          }
          body.innerHTML = '';
          await W.habits.render(body);
        });
        wrap.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'center' } },
          cb,
          el('span', { class: 'small grow truncate', text: h.name }),
          streak ? el('span', { class: 'xs muted num' }, ic('flame', 11) + ' ' + LF.i18n.num(streak)) : null));
      }
      body.appendChild(wrap);
      const viewAll = el('a', { href: '#/app/habits', class: 'btn ghost sm' }, t('habits.viewAll'));
      const vaIc = ic('chevron-left', 13); vaIc.classList.add('icon-flip');
      viewAll.insertBefore(vaIc, viewAll.firstChild);
      body.appendChild(el('div', { style: { marginTop: '10px' } }, viewAll));
    },
  };

  /* Active goals — progress bars */
  W.goals = {
    id: 'goals', icon: 'target',
    title: 'dashboard.wGoals',
    avail() { return true; },
    async render(body) {
      const t = LF.i18n.t;
      const [goals, steps] = await Promise.all([
        LF.db.list('goals', {}),
        LF.db.list('goalSteps', {}),
      ]);
      const active = goals.filter(g => !g.status || g.status === 'active')
        .sort((a, b) => ((a.deadline || '9999').localeCompare(b.deadline || '9999')))
        .slice(0, 4);
      if (!active.length) {
        body.appendChild(el('div', { class: 'muted small' }, t('goals.empty')));
        return;
      }
      const wrap = el('div', { class: 'col', style: { gap: '10px' } });
      active.forEach(g => {
        const prog = LF.logic.goalProgress(g, steps);
        wrap.appendChild(el('div', {},
          el('div', { class: 'row between', style: { gap: '8px', marginBottom: '4px' } },
            el('span', { class: 'small strong truncate', text: g.name }),
            el('span', { class: 'xs num muted', text: LF.i18n.num(prog.pct) + '%' })),
          el('div', { class: 'progress' },
            el('div', { style: { width: prog.pct + '%' } }))));
      });
      body.appendChild(wrap);
      const viewAll = el('a', { href: '#/app/goals', class: 'btn ghost sm' }, t('goals.viewAll'));
      const vaIc = ic('chevron-left', 13); vaIc.classList.add('icon-flip');
      viewAll.insertBefore(vaIc, viewAll.firstChild);
      body.appendChild(el('div', { style: { marginTop: '10px' } }, viewAll));
    },
  };

  /* Getting started checklist */
  W.gettingStarted = {
    id: 'gettingStarted', icon: 'flag',
    title: 'dashboard.wStart',
    avail() { return true; },
    async render(body) {
      const t = LF.i18n.t;
      const s = LF.store.settings;

      const installed = LF.pwa.isStandalone();
      const tasksCount = await LF.db.count('tasks', {});
      const items = [
        { done: true, label: t('dashboard.gsAccount') },
        { done: true, label: t('dashboard.gsOnboard') },
        { done: true, label: t('dashboard.gsCurrency', { c: s.currency }) },
        { done: installed, label: t('dashboard.gsInstall'), install: !installed },
        { done: tasksCount > 0, label: t('dashboard.gsFirstTask'), task: tasksCount === 0 },
      ];
      const doneN = items.filter(i => i.done).length;

      body.appendChild(el('div', { class: 'progress', style: { marginBottom: '14px' } },
        el('div', { style: { width: Math.round((doneN / items.length) * 100) + '%' } })));
      body.appendChild(el('div', { class: 'faint xs', style: { marginBottom: '10px' }, text: t('dashboard.gsProgress', { done: doneN, total: items.length }) }));

      items.forEach(i => {
        const row = el('div', { class: 'check-item' + (i.done ? ' done' : '') },
          el('div', { class: 'check-ic' }, ic(i.done ? 'check' : (i.task ? 'clock' : 'x'), 13)),
          el('span', { class: 'check-label small', text: i.label }),
          el('span', { class: 'grow' }),
          i.task ? el('button', {
            class: 'btn soft sm',
            onclick: () => LF.modals.task(null, {}, () => LF.shell.rerender()),
          }, ic('plus', 13), t('tasks.new')) : null,
          i.install && LF.pwa.canInstall()
            ? el('button', {
              class: 'btn soft sm', onclick: () => LF.pwa.promptInstall(),
            }, t('app.installApp')) : null
        );
        body.appendChild(row);
      });
    },
  };

  /* Quick actions (only real, working actions) */
  W.quickActions = {
    id: 'quickActions', icon: 'zap',
    title: 'dashboard.wQuick',
    avail() { return true; },
    async render(body) {
      const t = LF.i18n.t;
      const grid = el('div', { class: 'qa-grid' });

      const mk = (icon, label, fn) => {
        const b = el('button', { class: 'qa-btn' },
          el('div', { class: 'qa-ic' }, ic(icon, 17)),
          el('span', { text: label }));
        b.addEventListener('click', fn);
        grid.appendChild(b);
      };

      mk('settings', t('nav.settings'), () => LF.router.go('#/app/settings'));
      mk('palette', t('dashboard.qaCustomize'), () => LF.dashboard.openWidgetManager());
      const cur = (LF.store.settings && LF.store.settings.theme) || 'system';
      mk(cur === 'dark' ? 'sun' : 'moon', t('dashboard.qaTheme'), () => {
        const c = (LF.store.settings && LF.store.settings.theme) || 'system';
        const next = c === 'light' ? 'dark' : 'light';
        LF.store.saveSettings({ theme: next });
        LF.ui.toast(t('app.themeSet', { theme: t('settings.theme_' + next) }), { type: 'ok' });
        LF.shell.rerender();
      });
      mk('database', t('dashboard.qaBackup'), async () => {
        try {
          const fname = await LF.data.downloadBackup();
          LF.ui.toast(t('settings.exportDone', { f: fname }), { type: 'ok' });
        } catch (e) {
          LF.ui.toast(t('app.errorGeneric'), { type: 'error' });
        }
      });
      if (LF.pwa.canInstall()) {
        mk('download', t('app.installApp'), () => LF.pwa.promptInstall());
      }

      body.appendChild(grid);
    },
  };

  /* Roadmap */
  W.roadmap = {
    id: 'roadmap', icon: 'clipboard',
    title: 'dashboard.wRoadmap',
    avail() { return true; },
    async render(body) {
      const t = LF.i18n.t;
      const phases = [
        [1, 'roadmap.p1', true], [2, 'roadmap.p2', true], [3, 'roadmap.p3', true],
        [4, 'roadmap.p4', true], [5, 'roadmap.p5', true], [6, 'roadmap.p6', true],
        [7, 'roadmap.p7', true], [8, 'roadmap.p8', true], [9, 'roadmap.p9', false],
        [10, 'roadmap.p10', false],
      ];
      phases.forEach(([n, key, done]) => {
        body.appendChild(el('div', { class: 'roadmap-item' + (done ? ' done' : '') },
          el('div', { class: 'roadmap-n', text: String(n) }),
          el('span', { class: 'grow', text: t(key) }),
          done ? el('span', { class: 'badge ok', text: t('roadmap.done') }) : null
        ));
      });
    },
  };

  /* ---------- widget manager ---------- */
  function widgetOrder() {
    const order = (LF.store.settings.dashboard && LF.store.settings.dashboard.order) || [];
    const reg = Object.keys(W);
    const out = order.filter(id => reg.indexOf(id) !== -1);
    reg.forEach(id => { if (out.indexOf(id) === -1) out.push(id); });
    return out;
  }

  async function openWidgetManager() {
    const t = LF.i18n.t;
    const s = LF.store.settings;
    const hidden = (s.dashboard && s.dashboard.hidden) || [];
    let order = widgetOrder();

    const body = el('div', { class: 'col', style: { gap: '8px' } });
    function draw() {
      body.innerHTML = '';
      order.forEach((id, i) => {
        const w = W[id];
        const isHidden = hidden.indexOf(id) !== -1;
        const row = el('div', {
          class: 'row', style: {
            gap: '10px', padding: '10px 12px',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-m)',
            opacity: isHidden ? '.55' : '1',
          },
        },
          el('span', { class: 'icon-chip', style: { width: '28px', height: '28px', borderRadius: '8px', background: 'var(--accent-soft)', color: 'var(--accent-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, ic(w.icon, 15)),
          el('div', { class: 'grow' },
            el('div', { class: 'strong small', text: t(w.title) })),
          el('button', {
            class: 'icon-btn', 'aria-label': t('widgets.moveUp'), disabled: i === 0 ? '' : null,
          }, ic('arrow-up', 15)),

          el('button', {
            class: 'icon-btn', 'aria-label': t('widgets.moveDown'),
            disabled: i === order.length - 1 ? '' : null,
          }, ic('arrow-down', 15)),
          LF.ui.switchEl(!isHidden, v => {
            const idx = hidden.indexOf(id);
            if (!v && idx === -1) hidden.push(id);
            if (v && idx !== -1) hidden.splice(idx, 1);
            draw();
          }, t(w.title))
        );
        const [up] = row.querySelectorAll('button');
        up.addEventListener('click', () => {
          if (i === 0) return;
          order.splice(i - 1, 0, order.splice(i, 1)[0]);
          draw();
        });
        const down = row.querySelectorAll('button')[1];
        down.addEventListener('click', () => {
          if (i === order.length - 1) return;
          order.splice(i + 1, 0, order.splice(i, 1)[0]);
          draw();
        });
        body.appendChild(row);
      });
    }
    draw();

    let m = null;
    m = LF.ui.modal({
      title: t('dashboard.qaCustomize'),
      body,
      wide: true,
      actions: [
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', onClick: async () => {
            await LF.store.saveSettings({ dashboard: { hidden, order } });
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            LF.shell.rerender();
          },
        },
      ],
    });
  }

  /* ---------- view ---------- */
  const dashboard = {
    openWidgetManager,

    async render(viewEl) {
      const t = LF.i18n.t;
      const s = LF.store.settings;
      const page = el('div', { class: 'page' });

      // head
      page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '14px' } },
        el('div', { class: 'grow' },
          el('h1', { text: t(greeting()) + '، ' + (LF.store.user ? LF.store.user.name : '') + ' 👋' }),
          el('div', { class: 'page-sub', text: LF.i18n.fmtDate(new Date(), 'full') })
        ),
        el('button', { class: 'btn ghost sm', onclick: () => openWidgetManager() },
          ic('palette', 15), t('dashboard.qaCustomize'))
      ));

      // widgets
      const hidden = (s.dashboard && s.dashboard.hidden) || [];
      const order = widgetOrder();
      const grid = el('div', { class: 'col', style: { gap: '16px' } });
      for (const id of order) {
        const w = W[id];
        if (!w || hidden.indexOf(id) !== -1) continue;
        if (w.avail && !w.avail()) continue;
        const card = el('section', { class: 'card widget', 'aria-label': t(w.title) },
          el('div', { class: 'widget-head' },
            el('div', { class: 'icon-chip' }, ic(w.icon, 16)),
            el('h3', { text: t(w.title) })
          )
        );
        const bodyEl = el('div');
        card.appendChild(bodyEl);
        grid.appendChild(card);
        try { await w.render(bodyEl); }
        catch (e) { console.error('[LifeFlow] widget error:', id, e); }
      }
      page.appendChild(grid);
      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  LF.dashboard = dashboard;
  LF.views = LF.views || {};
  LF.views['app/dashboard'] = async function () {
    const viewEl = await LF.shell.ensure();
    await dashboard.render(viewEl);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/tasks.js ===== */
/* ============================================================
   LifeFlow — Tasks view (CRUD, subtasks, recurrence, filters)
   Also exports reusable modals: LF.modals.task / LF.modals.event
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  /* ---------- shared modals (used by quick-add too) ---------- */
  LF.modals = LF.modals || {};

  const PRIO_CLASS = { urgent: 'danger', high: 'warn', medium: 'info', low: '' };

  async function projectOptions() {
    return LF.db.list('projects', { sortKey: 'name', sortDir: 1 });
  }

  function workspaceOptions() {
    return LF.store.workspaces;
  }

  function optionEl(sel, value, labelKeyOrText, isI18n) {
    const o = el('option', { value, selected: String(value) === String(sel) ? '' : null });
    o.textContent = isI18n ? LF.i18n.t(labelKeyOrText) : labelKeyOrText;
    return o;
  }

  /* ============================================================
     Task modal — create / edit
     prefill: {date, time, projectId}
     onDone: callback after save/delete
     ============================================================ */
  LF.modals.task = async function taskModal(taskIn, prefill, onDone) {
    const t = LF.i18n.t;
    const isNew = !taskIn;
    const task = taskIn ? LF.util.clone(taskIn) : {
      title: '', description: '', date: prefill && prefill.date ? prefill.date : '',
      time: prefill && prefill.time ? prefill.time : '', deadline: '',
      priority: 'medium', status: 'todo', category: '',
      projectId: prefill && prefill.projectId ? prefill.projectId : '',
      workspaceId: prefill && prefill.workspaceId ? prefill.workspaceId : '', contactId: '', recurrence: { type: 'none', every: 1, until: '' },
      expectedMinutes: null, notes: '',
    };
    if (!task.recurrence) task.recurrence = { type: 'none', every: 1, until: '' };

    const [projects, subtasks, contacts] = await Promise.all([
      projectOptions(),
      taskIn ? LF.db.list('subtasks', { predicate: s => s.taskId === taskIn.id }) : Promise.resolve([]),
      LF.db.list('contacts', {}),
    ]);

    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });
    const title = el('input', { class: 'input', maxlength: '120', value: task.title || '' });
    const desc = el('textarea', { class: 'textarea', style: { minHeight: '64px' }, text: task.description || '' });
    const date = el('input', { class: 'input', type: 'date', value: task.date || '' });
    const time = el('input', { class: 'input', type: 'time', value: task.time || '' });
    const deadline = el('input', { class: 'input', type: 'date', value: task.deadline || '' });
    const expected = el('input', {
      class: 'input', type: 'number', min: '0', step: '5',
      value: task.expectedMinutes != null ? task.expectedMinutes : '',
    });
    const category = el('input', {
      class: 'input', list: 'lf-task-cats', value: task.category || '', maxlength: '30',
    });
    const catList = el('datalist', { id: 'lf-task-cats' },
      ['work', 'study', 'home', 'personal', 'health', 'money', 'family', 'other']
        .map(k => el('option', { value: t('tasks.cat_' + k) })));

    const prio = LF.ui.seg(L().PRIORITIES.map(p => ({ value: p, label: t('tasks.prio_' + p) })),
      task.priority, v => { task.priority = v; });

    const status = el('select', { class: 'select' });
    L().TASK_STATUSES.forEach(s => status.appendChild(optionEl(task.status, s, 'tasks.st_' + s, true)));

    const project = el('select', { class: 'select' });
    project.appendChild(optionEl(task.projectId || '', '', 'tasks.noProject', true));
    projects.forEach(p => {
      const o = optionEl(task.projectId, p.id, p.name, false);
      project.appendChild(o);
    });

    const ws = el('select', { class: 'select' });
    ws.appendChild(optionEl(task.workspaceId || '', '', 'tasks.noWorkspace', true));
    workspaceOptions().forEach(w => ws.appendChild(optionEl(task.workspaceId, w.id, w.name, false)));

    const contact = el('select', { class: 'select' });
    contact.appendChild(optionEl(task.contactId || '', '', 'tasks.noContact', true));
    contacts.forEach(c => contact.appendChild(optionEl(task.contactId, c.id, c.name, false)));

    const recType = el('select', { class: 'select' });
    ['none', 'daily', 'weekly', 'monthly', 'yearly'].forEach(r =>
      recType.appendChild(optionEl(task.recurrence.type, r, 'tasks.rec_' + r, true)));
    const recEvery = el('input', { class: 'input', type: 'number', min: '1', max: '365', value: task.recurrence.every || 1, style: { width: '90px' } });
    const recUntil = el('input', { class: 'input', type: 'date', value: task.recurrence.until || '' });
    const recExtra = el('div', { class: 'row', style: { gap: '10px', marginTop: '8px', display: recType.value === 'none' ? 'none' : 'flex' } },
      LF.ui.field(t('tasks.recEvery'), recEvery),
      LF.ui.field(t('tasks.recUntil'), recUntil, { hint: t('common.optional') }));
    recType.addEventListener('change', () => {
      recExtra.style.display = recType.value === 'none' ? 'none' : 'flex';
    });

    /* ----- subtasks editor ----- */
    const subList = el('div', { class: 'col', style: { gap: '6px' } });
    function drawSubs() {
      subList.innerHTML = '';
      subtasks.forEach((s, i) => {
        const row = el('div', { class: 'row', style: { gap: '9px' } },
          cboxEl(s.done, async v => { s.done = v; await LF.db.put('subtasks', s); drawSubs(); }),
          el('span', {
            class: 'grow small truncate', text: s.title,
            style: s.done ? { textDecoration: 'line-through', opacity: '.55' } : null,
          }),
          el('button', {
            class: 'icon-btn', style: { width: '30px', height: '30px' }, 'aria-label': t('common.del'),
            onclick: async () => {
              await LF.db.delete('subtasks', s.id);
              subtasks.splice(i, 1);
              drawSubs();
            },
          }, ic('trash', 14))
        );
        subList.appendChild(row);
      });
      if (!subtasks.length) {
        subList.appendChild(el('div', { class: 'faint xs', text: t('tasks.noSubtasks') }));
      }
    }
    drawSubs();

    const newSub = el('input', { class: 'input', maxlength: '120', placeholder: t('tasks.addSubtask'), 'aria-label': t('tasks.addSubtask') });
    async function addSub() {
      const v = newSub.value.trim();
      if (!v) return;
      const rec = await LF.db.put('subtasks', { taskId: taskIn ? taskIn.id : '__new__', title: v, done: false, position: subtasks.length });
      subtasks.push(rec);
      newSub.value = '';
      drawSubs();
    }
    newSub.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addSub(); } });

    function cboxEl(checked, onChange) {
      const cb = el('button', {
        class: 'cbox', role: 'checkbox', 'aria-checked': checked ? 'true' : 'false',
        'aria-label': t('tasks.markDone'),
      }, ic('check', 13));
      cb.addEventListener('click', () => {
        const v = cb.getAttribute('aria-checked') !== 'true';
        cb.setAttribute('aria-checked', v ? 'true' : 'false');
        onChange(v);
      });
      return cb;
    }

    const notes = el('textarea', { class: 'textarea', style: { minHeight: '56px' }, text: task.notes || '' });

    /* ----- actions ----- */
    async function collect() {
      const titleV = title.value.trim();
      if (titleV.length < 2) throw { field: 'title', msg: t('tasks.errTitle') };
      if (!L().validTime(time.value)) throw { field: 'time', msg: t('tasks.errTime') };
      if (time.value && !date.value) throw { field: 'date', msg: t('tasks.errTimeNeedsDate') };
      if (deadline.value && date.value && deadline.value < date.value) {
        throw { field: 'deadline', msg: t('tasks.errDeadline') };
      }
      return {
        title: titleV,
        description: desc.value.trim(),
        date: date.value || null,
        time: time.value || null,
        deadline: deadline.value || null,
        priority: task.priority,
        status: status.value,
        category: category.value.trim(),
        projectId: project.value || null,
        workspaceId: ws.value || null,
        contactId: contact.value || null,
        recurrence: {
          type: recType.value,
          every: Math.max(1, +recEvery.value || 1),
          until: recUntil.value || null,
        },
        expectedMinutes: expected.value === '' ? null : Math.max(0, +expected.value),
        notes: notes.value.trim(),
      };
    }

    let m = null;
    const body = el('div', { class: 'col', style: { gap: '14px' } },
      LF.ui.field(t('tasks.title'), title),
      LF.ui.field(t('tasks.desc'), desc),
      el('div', { class: 'form-grid' },
        LF.ui.field(t('tasks.date'), date),
        LF.ui.field(t('tasks.time'), time),
        LF.ui.field(t('tasks.deadline'), deadline),
        LF.ui.field(t('tasks.expected'), expected, { hint: t('tasks.expectedHint') })),
      LF.ui.field(t('tasks.priority'), prio),
      el('div', { class: 'form-grid' },
        LF.ui.field(t('tasks.status'), status),
        LF.ui.field(t('tasks.category'), category, { hint: t('tasks.categoryHint') })),
      el('div', { class: 'form-grid' },
        LF.ui.field(t('nav.projects'), project),
        LF.ui.field(t('settings.secWorkspaces'), ws),
        LF.ui.field(t('tasks.contact'), contact, { hint: t('common.optional') })),
      LF.ui.field(t('tasks.recurrence'), recType),
      recExtra,
      el('div', { class: 'card card-pad', style: { background: 'var(--surface-2)', boxShadow: 'none' } },
        el('div', { class: 'strong small', style: { marginBottom: '8px' }, text: t('tasks.subtasks') }),
        subList,
        el('div', { class: 'row', style: { marginTop: '8px' } }, newSub,
          el('button', { class: 'btn soft sm', onclick: addSub }, ic('plus', 14), t('common.add')))),
      LF.ui.field(t('tasks.notes'), notes),
      err,
      catList
    );

    m = LF.ui.modal({
      title: isNew ? t('tasks.new') : t('tasks.edit'),
      body,
      wide: true,
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('tasks.deleteTitle'),
              message: t('tasks.deleteConfirm', { title: taskIn.title }),
            });
            if (!okC) return;
            const subs = await LF.db.list('subtasks', { predicate: s => s.taskId === taskIn.id });
            for (const s of subs) await LF.db.delete('subtasks', s.id);
            await LF.db.delete('tasks', taskIn.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async (api) => {
            try {
              const data = await collect();
              const saved = await LF.db.put('tasks', Object.assign({}, taskIn || {}, data));
              // re-attach subtasks created before the task existed
              for (const s of subtasks) {
                if (s.taskId === '__new__') { s.taskId = saved.id; await LF.db.put('subtasks', s); }
              }
              m.close();
              LF.ui.toast(t('common.saved'), { type: 'ok' });
              onDone && onDone('save', saved);
            } catch (e) {
              err.textContent = (e && e.msg) || t('app.errorGeneric');
              err.style.display = '';
            }
          },
        },
      ].filter(Boolean),
    });
    setTimeout(() => title.focus(), 30);
    return m;
  };

  /* ============================================================
     Event modal — create / edit (calendar/appointments)
     ============================================================ */
  LF.modals.event = async function eventModal(eventIn, prefill, onDone) {
    const t = LF.i18n.t;
    const isNew = !eventIn;
    const ev = eventIn ? LF.util.clone(eventIn) : {
      title: '', type: (prefill && prefill.type) || 'appointment',
      date: prefill && prefill.date ? prefill.date : LF.util.todayYmd(),
      startTime: prefill && prefill.time ? prefill.time : '', endTime: '',
      location: '', notes: '',
      recurrence: { type: 'none', every: 1, until: '' },
      workspaceId: '',
    };
    if (!ev.recurrence) ev.recurrence = { type: 'none', every: 1, until: '' };

    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });
    const title = el('input', { class: 'input', maxlength: '120', value: ev.title || '' });
    const type = el('select', { class: 'select' });
    L().EVENT_TYPES.forEach(tp => type.appendChild(optionEl(ev.type, tp, 'calendar.ev_' + tp, true)));
    const date = el('input', { class: 'input', type: 'date', value: ev.date || '' });
    const st = el('input', { class: 'input', type: 'time', value: ev.startTime || '' });
    const et = el('input', { class: 'input', type: 'time', value: ev.endTime || '' });
    const loc = el('input', { class: 'input', maxlength: '80', value: ev.location || '' });
    const notes = el('textarea', { class: 'textarea', style: { minHeight: '56px' }, text: ev.notes || '' });
    const ws = el('select', { class: 'select' });
    ws.appendChild(optionEl(ev.workspaceId || '', '', 'tasks.noWorkspace', true));
    workspaceOptions().forEach(w => ws.appendChild(optionEl(ev.workspaceId, w.id, w.name, false)));

    const [evContacts] = await Promise.all([LF.db.list('contacts', {})]);
    const evContact = el('select', { class: 'select' });
    evContact.appendChild(optionEl(ev.contactId || '', '', 'tasks.noContact', true));
    evContacts.forEach(c => evContact.appendChild(optionEl(ev.contactId, c.id, c.name, false)));

    const recType = el('select', { class: 'select' });
    ['none', 'daily', 'weekly', 'monthly', 'yearly'].forEach(r =>
      recType.appendChild(optionEl(ev.recurrence.type, r, 'tasks.rec_' + r, true)));
    const recUntil = el('input', { class: 'input', type: 'date', value: ev.recurrence.until || '' });
    const recExtra = el('div', { style: { marginTop: '8px', display: recType.value === 'none' ? 'none' : '' } },
      LF.ui.field(t('tasks.recUntil'), recUntil, { hint: t('common.optional') }));
    recType.addEventListener('change', () => {
      recExtra.style.display = recType.value === 'none' ? 'none' : '';
    });

    let m = null;
    const body = el('div', { class: 'col', style: { gap: '14px' } },
      LF.ui.field(t('calendar.evTitle'), title),
      el('div', { class: 'form-grid' },
        LF.ui.field(t('calendar.evType'), type),
        LF.ui.field(t('calendar.date'), date)),
      el('div', { class: 'form-grid' },
        LF.ui.field(t('calendar.startTime'), st),
        LF.ui.field(t('calendar.endTime'), et, { hint: t('common.optional') })),
      el('div', { class: 'form-grid' },
        LF.ui.field(t('calendar.location'), loc, { hint: t('common.optional') }),
        LF.ui.field(t('settings.secWorkspaces'), ws),
        LF.ui.field(t('tasks.contact'), evContact, { hint: t('common.optional') })),
      LF.ui.field(t('tasks.recurrence'), recType),
      recExtra,
      LF.ui.field(t('tasks.notes'), notes),
      ev.recurrence.type !== 'none' && !isNew
        ? el('div', { class: 'banner info' }, ic('info', 15),
          el('div', { class: 'grow', text: t('calendar.recSeriesNote') })) : null,
      err
    );

    m = LF.ui.modal({
      title: isNew ? t('calendar.newEvent') : t('calendar.editEvent'),
      body,
      wide: true,
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('calendar.deleteEvent'),
              message: t('calendar.deleteConfirm', { title: eventIn.title }),
            });
            if (!okC) return;
            await LF.db.delete('events', eventIn.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            const titleV = title.value.trim();
            if (titleV.length < 2) { err.textContent = t('tasks.errTitle'); err.style.display = ''; return; }
            if (!date.value) { err.textContent = t('calendar.errDate'); err.style.display = ''; return; }
            if (!L().validTime(st.value) || !L().validTime(et.value)) { err.textContent = t('tasks.errTime'); err.style.display = ''; return; }
            if (st.value && et.value && et.value <= st.value) {
              err.textContent = t('calendar.errEndBeforeStart'); err.style.display = ''; return;
            }
            try {
              await LF.db.put('events', Object.assign({}, eventIn || {}, {
                title: titleV,
                type: type.value,
                date: date.value,
                startTime: st.value || null,
                endTime: et.value || null,
                location: loc.value.trim(),
                notes: notes.value.trim(),
                workspaceId: ws.value || null,
                contactId: evContact.value || null,
                recurrence: { type: recType.value, every: 1, until: recUntil.value || null },
              }));
              m.close();
              LF.ui.toast(t('common.saved'), { type: 'ok' });
              onDone && onDone('save');
            } catch (e) {
              err.textContent = t('app.errorGeneric'); err.style.display = '';
            }
          },
        },
      ].filter(Boolean),
    });
    setTimeout(() => title.focus(), 30);
    return m;
  };

  /* ============================================================
     Tasks list view
     ============================================================ */
  const view = {
    filters: { q: '', f: 'active', prio: 'all', project: 'all', sort: 'date' },
    limit: 60,   /* perf #52: render cap + show-more */

    async render(viewEl) {
      const t = LF.i18n.t;
      viewEl = await LF.shell.ensure();
      view._viewEl = viewEl;
      await view.draw();
    },

    async draw() {
      const t = LF.i18n.t;
      const viewEl = view._viewEl;
      const today = LF.util.todayYmd();
      const all = await LF.db.list('tasks', {});

      const [projects, contacts] = await Promise.all([projectOptions(), LF.db.list('contacts', {})]);
      const projName = id => (projects.find(p => p.id === id) || {}).name || '';
      const contactName = id => (contacts.find(c => c.id === id) || {}).name || '';
      const subCounts = {};
      const subs = await LF.db.list('subtasks', {});
      subs.forEach(s => {
        if (!subCounts[s.taskId]) subCounts[s.taskId] = { done: 0, total: 0 };
        subCounts[s.taskId].total++;
        if (s.done) subCounts[s.taskId].done++;
      });

      /* filter pipeline */
      const f = view.filters;
      let list = all.slice();
      const q = f.q.trim().toLowerCase();
      if (q) {
        list = list.filter(x =>
          (x.title || '').toLowerCase().includes(q) ||
          (x.description || '').toLowerCase().includes(q) ||
          (x.category || '').toLowerCase().includes(q));
      }
      if (f.prio !== 'all') list = list.filter(x => x.priority === f.prio);
      if (f.project !== 'all') list = list.filter(x => (x.projectId || '') === f.project);

      const buckets = { active: 'abc', today: 'abc', overdue: 'abc', upcoming: 'abc', done: 'abc', all: 'abc' };
      switch (f.f) {
        case 'today':
          list = list.filter(x => (x.status !== 'done' && x.status !== 'cancelled') &&
            (x.date === today || L().isOverdue(x, today)));
          break;
        case 'overdue':
          list = list.filter(x => L().isOverdue(x, today));
          break;
        case 'upcoming':
          list = list.filter(x => x.date && x.date > today &&
            (x.status === 'todo' || x.status === 'doing' || x.status === 'deferred'));
          break;
        case 'done':
          list = list.filter(x => x.status === 'done');
          break;
        case 'all': break;
        default: // active
          list = list.filter(x => x.status === 'todo' || x.status === 'doing' || x.status === 'deferred');
      }
      list = L().sortTasks(list, f.sort);

      /* page */
      const page = el('div', { class: 'page' });
      page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
        el('div', { class: 'grow' },
          el('h1', { text: t('nav.tasks') }),
          el('div', { class: 'page-sub', text: t('tasks.sub', { n: list.length }) })),
        el('button', { class: 'btn primary', onclick: () => LF.modals.task(null, {}, () => view.draw()) },
          ic('plus', 16), t('tasks.new'))
      ));

      /* toolbar */
      const chips = el('div', { class: 'row wrap', style: { gap: '6px' } });
      [['active', 'tasks.fActive'], ['today', 'tasks.fToday'], ['overdue', 'tasks.fOverdue'],
        ['upcoming', 'tasks.fUpcoming'], ['done', 'tasks.fDone'], ['all', 'tasks.fAll']].forEach(([id, key]) => {
        const c = el('button', { class: 'chip', 'aria-pressed': f.f === id ? 'true' : 'false', text: t(key) });
        c.addEventListener('click', () => { f.f = id; view.draw(); });
        chips.appendChild(c);
      });

      const search = el('input', {
        class: 'input', type: 'search', value: f.q,
        placeholder: t('tasks.searchPlaceholder'), 'aria-label': t('common.search'),
        style: { maxWidth: '260px' },
      });
      search.addEventListener('input', LF.util.debounce(() => { f.q = search.value; view.draw(); }, 250));

      const prioSel = el('select', { class: 'select', style: { width: 'auto' }, 'aria-label': t('tasks.priority') });
      prioSel.appendChild(optionEl(f.prio, 'all', 'tasks.allPriorities', true));
      L().PRIORITIES.forEach(p => prioSel.appendChild(optionEl(f.prio, p, 'tasks.prio_' + p, true)));
      prioSel.addEventListener('change', () => { f.prio = prioSel.value; view.draw(); });

      const projSel = el('select', { class: 'select', style: { width: 'auto' }, 'aria-label': t('nav.projects') });
      projSel.appendChild(optionEl(f.project, 'all', 'tasks.allProjects', true));
      projects.forEach(p => projSel.appendChild(optionEl(f.project, p.id, p.name, false)));
      projSel.addEventListener('change', () => { f.project = projSel.value; view.draw(); });

      const sortSel = el('select', { class: 'select', style: { width: 'auto' }, 'aria-label': t('tasks.sort') });
      [['date', 'tasks.sortDate'], ['priority', 'tasks.sortPriority'], ['created', 'tasks.sortCreated'], ['title', 'tasks.sortTitle']]
        .forEach(([v, key]) => sortSel.appendChild(optionEl(f.sort, v, key, true)));
      sortSel.addEventListener('change', () => { f.sort = sortSel.value; view.draw(); });

      page.appendChild(el('div', { class: 'card card-pad', style: { marginBottom: '16px' } },
        el('div', { class: 'row wrap between', style: { gap: '10px' } }, chips),
        el('div', { class: 'row wrap', style: { gap: '8px', marginTop: '10px' } },
          search, prioSel, projSel, sortSel)));

      /* list */
      if (!list.length) {
        const emptyMsgs = {
          active: ['tasks.emptyActive', ''], today: ['tasks.emptyToday', ''], overdue: ['tasks.emptyOverdue', ''],
          upcoming: ['tasks.emptyUpcoming', ''], done: ['tasks.emptyDone', ''], all: ['tasks.emptyAll', ''],
        };
        const [mk] = emptyMsgs[f.f] || emptyMsgs.active;
        page.appendChild(el('div', { class: 'card' },
          LF.ui.empty('list-checks', t(mk), t('tasks.emptyHint'),
            el('button', { class: 'btn primary', onclick: () => LF.modals.task(null, {}, () => view.draw()) },
              ic('plus', 15), t('tasks.new')))));
      } else {
        const wrap = el('div', { class: 'col', style: { gap: '8px' } });
        const shown = list.slice(0, view.limit);
      shown.forEach(task => wrap.appendChild(taskRow(task, today, projName, contactName, subCounts[task.id], projects)));
      if (list.length > shown.length) {
        wrap.appendChild(el('button', {
          class: 'btn ghost', style: { margin: '10px auto 0', display: 'flex' },
          onclick: () => { view.limit += 60; view.draw(); },
        }, t('tasks.showMore', { n: list.length - shown.length })));
      }
        page.appendChild(wrap);
      }

      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  function taskRow(task, today, projName, contactName, subProg, projects) {
    const t = LF.i18n.t;
    const overdue = L().isOverdue(task, today);
    const done = task.status === 'done';

    const cb = el('button', {
      class: 'cbox', role: 'checkbox',
      'aria-checked': done ? 'true' : 'false',
      'aria-label': t('tasks.markDone'),
    }, ic('check', 13));
    cb.addEventListener('click', async () => {
      await toggleDone(task);
      view.draw();
    });

    const meta = el('div', { class: 'meta' });
    if (task.date) {
      meta.appendChild(el('span', {
        class: 'mchip' + (overdue ? ' danger' : ''),
        text: (overdue ? t('tasks.overdueChip') + ' · ' : '') +
          LF.i18n.fmtDate(LF.util.fromYmd(task.date), 'medium') +
          (task.time ? ' · ' + task.time : ''),
      }));
    } else {
      meta.appendChild(el('span', { class: 'mchip', text: t('tasks.noDate') }));
    }
    if (task.deadline) {
      meta.appendChild(el('span', { class: 'mchip' }, ic('clock', 11),
        t('tasks.deadline') + ': ' + LF.i18n.fmtDate(LF.util.fromYmd(task.deadline), 'medium')));
    }
    if (task.projectId && projName) meta.appendChild(el('span', { class: 'mchip' }, ic('folder', 11), projName));
    if (task.contactId && contactName(task.contactId)) {
      meta.appendChild(el('span', { class: 'mchip' }, ic('user', 11), contactName(task.contactId)));
    }
    if (task.recurrence && task.recurrence.type !== 'none') {
      meta.appendChild(el('span', { class: 'mchip' }, ic('refresh', 11), t('tasks.rec_' + task.recurrence.type)));
    }
    if (subProg && subProg.total) {
      meta.appendChild(el('span', { class: 'mchip' }, ic('list-checks', 11), subProg.done + '/' + subProg.total));
    }
    if (task.category) meta.appendChild(el('span', { class: 'mchip', text: task.category }));
    if (task.status === 'doing') meta.appendChild(el('span', { class: 'badge info', text: t('tasks.st_doing') }));
    if (task.status === 'deferred') meta.appendChild(el('span', { class: 'badge warn', text: t('tasks.st_deferred') }));

    const row = el('div', {
      class: 'task-row' + (done ? ' done' : '') + (overdue ? ' overdue' : ''),
      role: 'button', tabindex: '0',
    },
      cb,
      el('div', { class: 'grow', style: { minWidth: 0 } },
        el('div', { class: 'task-title strong small truncate', text: task.title || '' }),
        meta),
      el('span', {
        class: 'p-dot p-' + (task.priority || 'medium'),
        title: t('tasks.prio_' + (task.priority || 'medium')),
      })
    );
    const open = () => LF.modals.task(task, {}, () => view.draw());
    row.addEventListener('click', (e) => {
      if (cb.contains(e.target) || cb === e.target) return;
      open();
    });
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
    return row;
  }

  async function toggleDone(task) {
    const t = LF.i18n.t;
    if (task.status === 'done') {
      task.status = 'todo';
      task.completedAt = null;
      await LF.db.put('tasks', task);
      return;
    }
    task.status = 'done';
    task.completedAt = new Date().toISOString();
    await LF.db.put('tasks', task);
    const next = L().spawnNext(task);
    if (next) {
      await LF.db.put('tasks', next);
      // copy subtasks (reset) to next occurrence
      const subs = await LF.db.list('subtasks', { predicate: s => s.taskId === task.id });
      for (const s of subs) {
        await LF.db.put('subtasks', { taskId: next.id, title: s.title, done: false, position: s.position });
      }
      LF.ui.toast(t('tasks.recNextCreated', { date: LF.i18n.fmtDate(LF.util.fromYmd(next.date), 'medium') }), { type: 'ok' });
    }
  }

  LF.views = LF.views || {};
  LF.views['app/tasks'] = async function () { await view.render(); };
  LF.tasksView = view;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/projects.js ===== */
/* ============================================================
   LifeFlow — Projects view (cards + detail with live progress)
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  const STATUS_BADGE = { active: 'accent', done: 'ok', onhold: 'warn', archived: '' };
  const PROJECT_COLORS = ['#0d9488', '#4f46e5', '#e11d48', '#b45309', '#0369a1', '#7c3aed', '#be185d', '#15803d'];

  async function projectModal(projectIn, onDone) {
    const t = LF.i18n.t;
    const contacts = await LF.db.list('contacts', {});
    const isNew = !projectIn;
    const p = projectIn ? LF.util.clone(projectIn) : {
      name: '', description: '', startDate: '', endDate: '',
      status: 'active', color: '#0d9488', workspaceId: '', notes: '',
    };

    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });
    const name = el('input', { class: 'input', maxlength: '60', value: p.name || '' });
    const desc = el('textarea', { class: 'textarea', style: { minHeight: '60px' }, text: p.description || '' });
    const sd = el('input', { class: 'input', type: 'date', value: p.startDate || '' });
    const ed = el('input', { class: 'input', type: 'date', value: p.endDate || '' });
    const notes = el('textarea', { class: 'textarea', style: { minHeight: '56px' }, text: p.notes || '' });

    const status = el('select', { class: 'select' });
    ['active', 'onhold', 'done', 'archived'].forEach(s => {
      const o = el('option', { value: s, selected: p.status === s ? '' : null });
      o.textContent = t('projects.st_' + s);
      status.appendChild(o);
    });

    const ws = el('select', { class: 'select' });
    const noneOpt = el('option', { value: '', selected: !p.workspaceId ? '' : null });
    noneOpt.textContent = t('tasks.noWorkspace');
    ws.appendChild(noneOpt);
    LF.store.workspaces.forEach(w => {
      const o = el('option', { value: w.id, selected: p.workspaceId === w.id ? '' : null });
      o.textContent = w.name;
      ws.appendChild(o);
    });

    const contact = el('select', { class: 'select' });
    const noContact = el('option', { value: '', selected: !p.contactId ? '' : null });
    noContact.textContent = t('tasks.noContact');
    contact.appendChild(noContact);
    contacts.forEach(c => {
      const o = el('option', { value: c.id, selected: p.contactId === c.id ? '' : null });
      o.textContent = c.name;
      contact.appendChild(o);
    });

    const colors = el('div', { class: 'row wrap', style: { gap: '9px' } });
    PROJECT_COLORS.forEach(c => {
      const b = el('button', {
        class: 'swatch', 'aria-pressed': p.color === c ? 'true' : 'false',
        'aria-label': c, style: { background: c },
      });
      b.addEventListener('click', () => {
        colors.querySelectorAll('.swatch').forEach(x => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
      });
      colors.appendChild(b);
    });

    let m = null;
    m = LF.ui.modal({
      title: isNew ? t('projects.new') : t('projects.edit'),
      wide: true,
      body: el('div', { class: 'col', style: { gap: '14px' } },
        LF.ui.field(t('projects.name'), name),
        LF.ui.field(t('projects.desc'), desc),
        el('div', { class: 'form-grid' },
          LF.ui.field(t('projects.startDate'), sd, { hint: t('common.optional') }),
          LF.ui.field(t('projects.endDate'), ed, { hint: t('common.optional') })),
        el('div', { class: 'form-grid' },
          LF.ui.field(t('projects.status'), status),
          LF.ui.field(t('settings.secWorkspaces'), ws),
          LF.ui.field(t('tasks.contact'), contact, { hint: t('common.optional') })),
        LF.ui.field(t('settings.avatarColor'), colors),
        LF.ui.field(t('projects.notes'), notes, { hint: t('common.optional') }),
        err),
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('projects.deleteTitle'),
              message: t('projects.deleteConfirm', { name: p.name }),
            });
            if (!okC) return;
            // safe unlink: tasks keep existing without the project
            const ts = await LF.db.list('tasks', { predicate: x => x.projectId === projectIn.id });
            for (const x of ts) { x.projectId = null; await LF.db.put('tasks', x); }
            await LF.db.delete('projects', projectIn.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            const nameV = name.value.trim();
            if (nameV.length < 2) { err.textContent = t('projects.errName'); err.style.display = ''; return; }
            if (sd.value && ed.value && ed.value < sd.value) {
              err.textContent = t('projects.errDates'); err.style.display = ''; return;
            }
            let color = p.color;
            colors.querySelectorAll('.swatch').forEach(x => {
              if (x.getAttribute('aria-pressed') === 'true') color = x.getAttribute('aria-label');
            });
            await LF.db.put('projects', Object.assign({}, projectIn || {}, {
              name: nameV,
              description: desc.value.trim(),
              startDate: sd.value || null,
              endDate: ed.value || null,
              status: status.value,
              color,
              workspaceId: ws.value || null,
              contactId: contact.value || null,
              notes: notes.value.trim(),
            }));
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('save');
          },
        },
      ].filter(Boolean),
    });
    setTimeout(() => name.focus(), 30);
    return m;
  }

  async function drawList(viewEl) {
    const t = LF.i18n.t;
    const projects = await LF.db.list('projects', { sortKey: 'createdAt', sortDir: 1 });
    const allTasks = await LF.db.list('tasks', {});

    const page = el('div', { class: 'page' });
    page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
      el('div', { class: 'grow' },
        el('h1', { text: t('nav.projects') }),
        el('div', { class: 'page-sub', text: t('projects.sub', { n: projects.length }) })),
      el('button', { class: 'btn primary', onclick: () => projectModal(null, () => drawList(viewEl)) },
        ic('plus', 16), t('projects.new'))
    ));

    if (!projects.length) {
      page.appendChild(el('div', { class: 'card' }, LF.ui.empty('folder',
        t('projects.empty'), t('projects.emptyHint'),
        el('button', {
          class: 'btn primary',
          onclick: () => projectModal(null, () => drawList(viewEl)),
        }, ic('plus', 15), t('projects.new')))));
    } else {
      const grid = el('div', { class: 'proj-grid' });
      projects.forEach(p => {
        const tasks = allTasks.filter(x => x.projectId === p.id);
        const prog = L().projectProgress(tasks);
        const dates = [];
        if (p.startDate) dates.push(LF.i18n.fmtDate(LF.util.fromYmd(p.startDate), 'medium'));
        if (p.endDate) dates.push('← ' + LF.i18n.fmtDate(LF.util.fromYmd(p.endDate), 'medium'));
        const card = el('div', {
          class: 'card proj-card', role: 'button', tabindex: '0',
          style: { borderTop: '3px solid ' + (p.color || '#0d9488') },
        },
          el('div', { class: 'row', style: { gap: '8px', alignItems: 'flex-start' } },
            el('div', { class: 'grow' },
              el('div', { class: 'strong', text: p.name, style: { fontSize: 'var(--fs-l)' } }),
              dates.length ? el('div', { class: 'faint xs', style: { marginTop: '3px' }, text: dates.join(' ') }) : null),
            el('span', { class: 'badge ' + (STATUS_BADGE[p.status] || ''), text: t('projects.st_' + p.status) })),
          p.description ? el('div', { class: 'muted small', style: { marginTop: '8px' }, text: p.description }) : null,
          el('div', { class: 'progress', style: { margin: '14px 0 6px' } },
            el('div', { style: { width: prog.pct + '%' } })),
          el('div', { class: 'row between' },
            el('span', { class: 'muted xs', text: t('projects.tasksCount', { done: prog.done, total: prog.total }) }),
            el('span', { class: 'strong small num', text: prog.pct + '%' }))
        );
        const go = () => { LF.router.go('#/app/projects/' + p.id); };
        card.addEventListener('click', go);
        card.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
        grid.appendChild(card);
      });
      page.appendChild(grid);
    }
    viewEl.innerHTML = '';
    viewEl.appendChild(page);
  }

  async function drawDetail(viewEl, id) {
    const t = LF.i18n.t;
    const p = await LF.db.get('projects', id);
    if (!p) { LF.router.go('#/app/projects'); return; }
    const tasks = await L().sortTasks(
      await LF.db.list('tasks', { predicate: x => x.projectId === id }), 'date');
    const prog = L().projectProgress(tasks);

    const page = el('div', { class: 'page' });
    page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
      el('div', { class: 'grow' },
        el('div', { class: 'row', style: { gap: '10px' } },
          el('h1', { text: p.name }),
          el('span', { class: 'badge ' + (STATUS_BADGE[p.status] || ''), text: t('projects.st_' + p.status) })),
        p.startDate || p.endDate ? el('div', {
          class: 'page-sub',
          text: (p.startDate ? LF.i18n.fmtDate(LF.util.fromYmd(p.startDate), 'medium') : '') +
            (p.endDate ? ' ← ' + LF.i18n.fmtDate(LF.util.fromYmd(p.endDate), 'medium') : ''),
        }) : null),
      el('button', { class: 'btn ghost', onclick: () => LF.router.go('#/app/projects') },
        ic('chevron-left', 15), t('common.back')),
      el('button', { class: 'btn ghost', onclick: () => projectModal(p, () => drawDetail(viewEl, id)) },
        ic('edit', 15), t('common.edit'))
    ));

    if (p.description) {
      page.appendChild(el('div', { class: 'card card-pad section' },
        el('div', { class: 'muted', text: p.description })));
    }

    // progress card
    page.appendChild(el('div', { class: 'card card-pad section' },
      el('div', { class: 'row between', style: { marginBottom: '8px' } },
        el('span', { class: 'strong', text: t('projects.progress') }),
        el('span', { class: 'strong num', text: prog.pct + '% (' + prog.done + '/' + prog.total + ')' })),
      el('div', { class: 'progress' }, el('div', { style: { width: prog.pct + '%' } })),
      el('div', { style: { marginTop: '14px' } },
        el('button', {
          class: 'btn soft sm',
          onclick: () => LF.modals.task(null, { projectId: id }, () => drawDetail(viewEl, id)),
        }, ic('plus', 14), t('projects.addTask')))
    ));

    // tasks
    const taskCard = el('div', { class: 'card section' });
    taskCard.appendChild(el('div', { class: 'card-pad', style: { paddingBottom: '6px' } },
      el('div', { class: 'strong', text: t('projects.tasks') })));
    if (!tasks.length) {
      taskCard.appendChild(LF.ui.empty('list-checks', t('projects.noTasks'), t('projects.noTasksHint')));
    } else {
      const listEl = el('div', { class: 'card-pad col', style: { gap: '8px', paddingTop: '4px' } });
      const today = LF.util.todayYmd();
      tasks.forEach(task => {
        const done = task.status === 'done';
        const overdue = L().isOverdue(task, today);
        const row = el('div', { class: 'row', style: { gap: '10px' } },
          el('button', {
            class: 'cbox', role: 'checkbox', 'aria-checked': done ? 'true' : 'false',
            'aria-label': t('tasks.markDone'),
          }, ic('check', 12)),
          el('span', {
            class: 'grow small truncate' + (done ? ' done-text' : ''),
            text: task.title,
          }),
          task.date ? el('span', {
            class: 'mchip' + (overdue ? ' danger' : ''),
            text: LF.i18n.fmtDate(LF.util.fromYmd(task.date), 'medium'),
          }) : null
        );
        row.querySelector('.cbox').addEventListener('click', async () => {
          task.status = done ? 'todo' : 'done';
          task.completedAt = done ? null : new Date().toISOString();
          await LF.db.put('tasks', task);
          drawDetail(viewEl, id);
        });
        listEl.appendChild(row);
      });
      taskCard.appendChild(listEl);
    }
    page.appendChild(taskCard);

    if (p.notes) {
      page.appendChild(el('div', { class: 'card card-pad section' },
        el('div', { class: 'strong small', style: { marginBottom: '6px' }, text: t('projects.notes') }),
        el('div', { class: 'muted small', text: p.notes, style: { whiteSpace: 'pre-wrap' } })));
    }

    viewEl.innerHTML = '';
    viewEl.appendChild(page);
  }

  LF.views = LF.views || {};
  LF.views['app/projects'] = async function (parts) {
    const viewEl = await LF.shell.ensure();
    if (parts && parts[0]) await drawDetail(viewEl, parts[0]);
    else await drawList(viewEl);
  };
  LF.modals = LF.modals || {};
  LF.modals.project = projectModal;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/calendar.js ===== */
/* ============================================================
   LifeFlow — Calendar (month / week / day) with recurring events
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  const TYPE_COLOR = {
    appointment: 'var(--info)', meeting: 'var(--accent)', lecture: 'var(--warn)',
    exam: 'var(--danger)', occasion: 'var(--ok)', personal: 'var(--faint)',
    home: 'var(--ok)', other: 'var(--muted)',
  };

  const state = { mode: 'month', cursor: LF.util.todayYmd() };

  async function loadData() {
    const events = await LF.db.list('events', {});
    const tasks = await LF.db.list('tasks', { predicate: x => x.status !== 'cancelled' });
    return { events, tasks };
  }

  function addEventBtn(date, time) {
    const t = LF.i18n.t;
    const b = el('button', { class: 'btn soft sm' }, ic('plus', 13), t('calendar.newEvent'));
    b.addEventListener('click', () => LF.modals.event(null, { date, time }, () => draw()));
    return b;
  }

  function eventChip(occ, compact) {
    const t = LF.i18n.t;
    const ev = occ.ev;
    const chip = el('div', { class: 'cal-ev', title: ev.title },
      el('span', { class: 'dot', style: { background: TYPE_COLOR[ev.type] || 'var(--muted)' } }),
      el('span', {
        class: 'truncate grow',
        text: (ev.startTime ? ev.startTime + ' ' : '') + ev.title,
      }));
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      LF.modals.event(ev, {}, () => draw());
    });
    return chip;
  }

  function taskChip(task) {
    const t = LF.i18n.t;
    const chip = el('div', { class: 'cal-ev cal-task' + (task.status === 'done' ? ' done' : '') },
      el('button', {
        class: 'cbox sm', role: 'checkbox', 'aria-checked': task.status === 'done' ? 'true' : 'false',
        'aria-label': t('tasks.markDone'),
      }, ic('check', 10)),
      el('span', { class: 'truncate grow', text: (task.time ? task.time + ' ' : '') + task.title }));
    chip.querySelector('.cbox').addEventListener('click', async (e) => {
      e.stopPropagation();
      task.status = task.status === 'done' ? 'todo' : 'done';
      task.completedAt = task.status === 'done' ? new Date().toISOString() : null;
      await LF.db.put('tasks', task);
      const next = L().spawnNext(task);
      if (next && task.status === 'done') {
        await LF.db.put('tasks', next);
        const subs = await LF.db.list('subtasks', { predicate: s => s.taskId === task.id });
        for (const s of subs) await LF.db.put('subtasks', { taskId: next.id, title: s.title, done: false, position: s.position });
        LF.ui.toast(LF.i18n.t('tasks.recNextCreated', { date: LF.i18n.fmtDate(LF.util.fromYmd(next.date), 'medium') }), { type: 'ok' });
      }
      draw();
    });
    chip.addEventListener('click', () => LF.modals.task(task, {}, () => draw()));
    return chip;
  }

  /* ---------- month ---------- */
  function monthView(page, { events, tasks }) {
    const t = LF.i18n.t;
    const ws = LF.store.settings.weekStart;
    const d = LF.util.fromYmd(state.cursor);
    const y = d.getFullYear(), m = d.getMonth();
    const grid = L().monthGrid(y, m, ws);
    const first = grid[0], last = grid[grid.length - 1];
    const occs = L().expandOccurrences(events, first, last);
    const byDate = {};
    occs.forEach(o => (byDate[o.date] = byDate[o.date] || []).push(o));
    const tasksByDate = {};
    tasks.forEach(x => { if (x.date) (tasksByDate[x.date] = tasksByDate[x.date] || []).push(x); });
    const today = LF.util.todayYmd();

    const head = el('div', { class: 'cal-grid cal-dows' });
    L().weekDays(ws).forEach(wd => head.appendChild(el('div', {
      class: 'cal-dow', text: LF.i18n.weekdayName(wd),
    })));

    const gridEl = el('div', { class: 'cal-grid' });
    grid.forEach(ymd => {
      const cellDate = LF.util.fromYmd(ymd);
      const dim = cellDate.getMonth() !== m;
      const evs = (byDate[ymd] || []);
      const tsk = (tasksByDate[ymd] || []);
      const cell = el('div', {
        class: 'cal-cell' + (dim ? ' dim' : '') + (ymd === today ? ' today' : ''),
        role: 'button', tabindex: dim ? '-1' : '0',
        'aria-label': LF.i18n.fmtDate(cellDate, 'full'),
      },
        el('div', { class: 'cal-daynum num', text: String(cellDate.getDate()) }),
        el('div', { class: 'col grow', style: { gap: '2px', overflow: 'hidden' } },
          evs.slice(0, 3).map(o => eventChip(o)),
          tsk.slice(0, 3 - Math.min(evs.length, 3)).map(x => taskChip(x)),
          (evs.length + tsk.length) > 3
            ? el('div', { class: 'cal-more faint', text: '+' + (evs.length + tsk.length - 3) + ' ' + t('calendar.more') })
            : null)
      );
      cell.addEventListener('click', () => {
        state.mode = 'day';
        state.cursor = ymd;
        draw();
      });
      gridEl.appendChild(cell);
    });

    page.appendChild(el('div', { class: 'card card-pad' }, head, gridEl));
  }

  /* ---------- week ---------- */
  function weekView(page, { events, tasks }) {
    const t = LF.i18n.t;
    const ws = LF.store.settings.weekStart;
    const d = LF.util.fromYmd(state.cursor);
    const start = L().weekDays(ws).length ? LF.util.startOfWeek(d, ws) : d;
    const days = [];
    for (let i = 0; i < 7; i++) days.push(LF.util.ymd(LF.util.addDays(start, i)));
    const occs = L().expandOccurrences(events, days[0], days[6]);
    const tasksByDate = {};
    tasks.forEach(x => { if (x.date) (tasksByDate[x.date] = tasksByDate[x.date] || []).push(x); });
    const today = LF.util.todayYmd();

    const wrap = el('div', { class: 'cal-week' });
    days.forEach(ymd => {
      const dd = LF.util.fromYmd(ymd);
      const evs = occs.filter(o => o.date === ymd);
      const tsk = (tasksByDate[ymd] || []).slice().sort((a, b) => (a.time || '99:99') < (b.time || '99:99') ? -1 : 1);
      const col = el('div', { class: 'cal-wday' + (ymd === today ? ' today' : '') },
        el('div', {
          class: 'row between', style: { marginBottom: '8px', cursor: 'pointer' },
        },
          el('span', { class: 'strong small', text: LF.i18n.weekdayName(dd.getDay()) }),
          el('span', { class: 'badge' + (ymd === today ? ' accent' : ''), text: String(dd.getDate()) })),
        el('div', { class: 'col grow', style: { gap: '4px' } },
          evs.map(o => eventChip(o)),
          tsk.map(x => taskChip(x)),
          !evs.length && !tsk.length ? el('div', { class: 'faint xs', text: '—' }) : null),
        addEventBtn(ymd, '')
      );
      col.querySelector('.row').addEventListener('click', () => {
        state.mode = 'day'; state.cursor = ymd; draw();
      });
      wrap.appendChild(col);
    });
    page.appendChild(el('div', { class: 'card card-pad' }, wrap));
  }

  /* ---------- day ---------- */
  function dayView(page, { events, tasks }) {
    const t = LF.i18n.t;
    const ymd = state.cursor;
    const occs = L().expandOccurrences(events, ymd, ymd)
      .filter(o => o.date === ymd)
      .sort((a, b) => ((a.ev.startTime || '99:99') < (b.ev.startTime || '99:99') ? -1 : 1));
    const dayTasks = tasks.filter(x => x.date === ymd)
      .sort((a, b) => ((a.time || '99:99') < (b.time || '99:99') ? -1 : 1));
    const timed = dayTasks.filter(x => x.time);
    const untimed = dayTasks.filter(x => !x.time);

    const card = el('div', { class: 'card card-pad section' });
    card.appendChild(el('div', { class: 'row between', style: { marginBottom: '14px' } },
      el('span', { class: 'strong', text: t('calendar.eventsAndTasks') }),
      addEventBtn(ymd, '')));

    if (!occs.length && !dayTasks.length) {
      card.appendChild(LF.ui.empty('calendar', t('calendar.dayEmpty'), t('calendar.dayEmptyHint')));
    } else {
      occs.forEach(o => {
        const ev = o.ev;
        const isRec = ev.recurrence && ev.recurrence.type !== 'none';
        const openEv = () => LF.modals.event(ev, {}, () => draw());
        const row = el('div', { class: 'tl-row', role: 'button', tabindex: '0', style: { cursor: 'pointer' } },
          el('span', { class: 'tl-time num', text: ev.startTime || t('calendar.allDay') }),
          el('span', { class: 'dot', style: { background: TYPE_COLOR[ev.type] || 'var(--muted)', marginTop: '6px' } }),
          el('div', { class: 'grow', style: { minWidth: 0 } },
            el('div', { class: 'small strong truncate', text: ev.title }),
            el('div', { class: 'faint xs' },
              (ev.endTime ? '→ ' + ev.endTime : '') +
                (ev.location ? ' · ' + ev.location : '') +
                (isRec ? ' · ' + t('tasks.rec_' + ev.recurrence.type) : '') +
                ' · ' + t('calendar.ev_' + ev.type))));
        row.addEventListener('click', openEv);
        row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEv(); } });
        card.appendChild(row);
      });
      timed.forEach(x => {
        card.appendChild(el('div', { class: 'tl-row' },
          el('span', { class: 'tl-time num', text: x.time }),
          taskChip(x)));
      });
      if (untimed.length) {
        card.appendChild(el('div', { class: 'strong small', style: { margin: '14px 0 6px' }, text: t('calendar.noTimeTasks') }));
        untimed.forEach(x => card.appendChild(el('div', { class: 'tl-row' }, taskChip(x))));
      }
    }
    page.appendChild(card);
  }

  /* ---------- shell ---------- */
  async function draw() {
    const t = LF.i18n.t;
    const viewEl = await LF.shell.ensure();
    const { events, tasks } = await loadData();
    const d = LF.util.fromYmd(state.cursor);

    const page = el('div', { class: 'page' });

    // label for current period
    let label;
    if (state.mode === 'month') label = LF.i18n.fmtDate(d, 'monthYear');
    else if (state.mode === 'week') {
      const ws = LF.store.settings.weekStart;
      const start = LF.util.startOfWeek(d, ws);
      const end = LF.util.addDays(start, 6);
      label = LF.i18n.fmtDate(start, 'dayMonth') + ' — ' + LF.i18n.fmtDate(end, 'dayMonth');
    } else label = LF.i18n.fmtDate(d, 'full');

    const modeSeg = LF.ui.seg([
      { value: 'day', label: t('calendar.mDay') },
      { value: 'week', label: t('calendar.mWeek') },
      { value: 'month', label: t('calendar.mMonth') },
    ], state.mode, v => { state.mode = v; draw(); });

    function shift(dir) {
      const dd = LF.util.fromYmd(state.cursor);
      if (state.mode === 'month') {
        const nm = new Date(dd.getFullYear(), dd.getMonth() + dir, 1);
        state.cursor = LF.util.ymd(nm);
      } else if (state.mode === 'week') {
        state.cursor = LF.util.ymd(LF.util.addDays(dd, 7 * dir));
      } else {
        state.cursor = LF.util.ymd(LF.util.addDays(dd, dir));
      }
      draw();
    }

    const prevBtn = el('button', { class: 'icon-btn', 'aria-label': t('calendar.prev'), onclick: () => shift(-1) });
    const prevIc = ic('chevron-right', 17); prevIc.classList.add('icon-flip-ltr');
    prevBtn.appendChild(prevIc);
    const nextBtn = el('button', { class: 'icon-btn', 'aria-label': t('calendar.next'), onclick: () => shift(1) }, ic('chevron-left', 17));

    page.appendChild(el('div', { class: 'page-head row wrap', style: { gap: '10px' } },
      el('h1', { text: t('nav.calendar') }),
      el('span', { class: 'grow' }),
      modeSeg,
      el('div', { class: 'row', style: { gap: '4px' } },
        prevBtn,
        el('button', { class: 'btn ghost sm', onclick: () => { state.cursor = LF.util.todayYmd(); draw(); } }, t('common.today')),
        nextBtn)
    ));
    page.appendChild(el('div', {
      class: 'page-sub', style: { margin: '-14px 0 16px' },
      text: label,
    }));

    if (state.mode === 'month') monthView(page, { events, tasks });
    else if (state.mode === 'week') weekView(page, { events, tasks });
    else dayView(page, { events, tasks });

    viewEl.innerHTML = '';
    viewEl.appendChild(page);
  }

  LF.views = LF.views || {};
  LF.views['app/calendar'] = async function () { await draw(); };
  LF.calendarState = state;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/myday.js ===== */
/* ============================================================
   LifeFlow — My Day (timeline, top-3 priorities, day review)
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  const TYPE_COLOR = {
    appointment: 'var(--info)', meeting: 'var(--accent)', lecture: 'var(--warn)',
    exam: 'var(--danger)', occasion: 'var(--ok)', personal: 'var(--faint)',
    home: 'var(--ok)', other: 'var(--muted)',
  };

  let cursorDate = null; // null = today

  async function getDayReview(date) {
    return (await LF.db.list('dayReviews', { predicate: r => r.date === date }))[0] || null;
  }

  async function saveDayReviewFields(date, patch) {
    const existing = await getDayReview(date);
    const rec = Object.assign({
      id: 'dr-' + date, date,
      topTaskIds: [],
      accomplished: '', deferredNotes: '',
      workMinutes: null, studyMinutes: null,
      reviewNotes: '', rating: null,
    }, existing || {}, patch);
    await LF.db.put('dayReviews', rec);
    return rec;
  }

  async function draw() {
    const t = LF.i18n.t;
    const viewEl = await LF.shell.ensure();
    const today = LF.util.todayYmd();
    const ymd = cursorDate || today;
    const isToday = ymd === today;

    const [events, tasks, expenses, review] = await Promise.all([
      LF.db.list('events', {}),
      LF.db.list('tasks', {}),
      LF.db.list('expenses', { predicate: e => e.date === ymd }),
      getDayReview(ymd),
    ]);

    const occs = L().expandOccurrences(events, ymd, ymd).filter(o => o.date === ymd)
      .sort((a, b) => ((a.ev.startTime || '99:99') < (b.ev.startTime || '99:99') ? -1 : 1));
    const dayTasks = tasks.filter(x => x.date === ymd && x.status !== 'cancelled');
    const timed = dayTasks.filter(x => x.time).sort((a, b) => (a.time < b.time ? -1 : 1));
    const untimed = dayTasks.filter(x => !x.time);
    const spentToday = expenses.reduce((s, e) => s + (e.amount || 0), 0);

    const page = el('div', { class: 'page' });

    /* ----- header ----- */
    const prevD = el('button', { class: 'icon-btn', 'aria-label': t('calendar.prev') });
    const pvIc = ic('chevron-right', 17); pvIc.classList.add('icon-flip-ltr'); prevD.appendChild(pvIc);
    prevD.addEventListener('click', () => { cursorDate = LF.util.ymd(LF.util.addDays(LF.util.fromYmd(ymd), -1)); draw(); });
    const nextD = el('button', { class: 'icon-btn', 'aria-label': t('calendar.next') }, ic('chevron-left', 17));
    nextD.addEventListener('click', () => { cursorDate = LF.util.ymd(LF.util.addDays(LF.util.fromYmd(ymd), 1)); draw(); });

    page.appendChild(el('div', { class: 'page-head row wrap', style: { gap: '10px' } },
      el('div', { class: 'grow' },
        el('h1', { text: isToday ? t('myday.todayTitle') : t('myday.dayTitle') }),
        el('div', { class: 'page-sub', text: LF.i18n.fmtDate(LF.util.fromYmd(ymd), 'full') })),
      prevD,
      !isToday ? el('button', { class: 'btn ghost sm', onclick: () => { cursorDate = null; draw(); } }, t('common.today')) : null,
      nextD,
      el('button', { class: 'btn primary', onclick: () => LF.modals.task(null, { date: ymd }, () => draw()) },
        ic('plus', 15), t('tasks.new')),
      el('button', { class: 'btn ghost', onclick: () => LF.modals.event(null, { date: ymd }, () => draw()) },
        ic('calendar', 15), t('calendar.newEvent'))
    ));

    /* ----- summary line ----- */
    const doneCount = dayTasks.filter(x => x.status === 'done').length;
    page.appendChild(el('div', {
      class: 'card card-pad', style: { marginBottom: '16px' },
    }, el('div', { class: 'row wrap', style: { gap: '14px' } },
      el('span', { class: 'small muted' }, ic('list-checks', 14), ' ' + t('myday.tasksDone', { done: doneCount, total: dayTasks.length })),
      el('span', { class: 'small muted' }, ic('calendar', 14), ' ' + t('myday.eventsCount', { n: occs.length })),
      el('span', { class: 'small muted' }, ic('wallet', 14), ' ' + t('myday.spentToday', { amount: LF.i18n.money(spentToday) }))
    )));

    /* ----- top 3 priorities ----- */
    const topIds = (review && review.topTaskIds) || [];
    const candidates = tasks.filter(x =>
      x.status !== 'done' && x.status !== 'cancelled' &&
      (!x.date || x.date <= today));
    const prioCard = el('div', { class: 'card widget section' },
      el('div', { class: 'widget-head' },
        el('div', { class: 'icon-chip' }, ic('target', 16)),
        el('h3', { text: t('myday.top3') })));

    const slots = el('div', { class: 'col', style: { gap: '8px' } });
    for (let i = 0; i < 3; i++) {
      const taskId = topIds[i];
      const task = taskId ? tasks.find(x => x.id === taskId) : null;
      const slot = el('div', {
        class: 'row', style: {
          gap: '10px', padding: '10px 12px',
          border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-m)',
        },
      },
        el('span', { class: 'badge accent', text: String(i + 1) }),
        task ? el('span', {
          class: 'grow small truncate' + (task.status === 'done' ? ' done-text' : ''),
          text: task.title,
        }) : el('span', { class: 'grow faint small', text: t('myday.pickPriority') }),
        task ? el('button', {
          class: 'icon-btn', style: { width: '30px', height: '30px' }, 'aria-label': t('common.remove'),
          onclick: async () => {
            topIds.splice(i, 1);
            await saveDayReviewFields(ymd, { topTaskIds: topIds.slice() });
            draw();
          },
        }, ic('x', 13)) : el('button', {
          class: 'btn soft sm', onclick: () => pickPriority(i),
        }, ic('plus', 13), t('common.add'))
      );
      if (task) {
        slot.addEventListener('click', (e) => {
          if (e.target.closest('button')) return;
          LF.modals.task(task, {}, () => draw());
        });
      }
      slots.appendChild(slot);
    }
    prioCard.appendChild(slots);
    page.appendChild(prioCard);

    function pickPriority(slotIndex) {
      let m = null;
      const list = el('div', { class: 'col', style: { gap: '6px' } });
      if (!candidates.length) {
        list.appendChild(el('div', { class: 'muted small', text: t('myday.noCandidates') }));
      }
      candidates.forEach(c => {
        const row = el('button', {
          class: 'task-row', style: { width: '100%', textAlign: 'start', cursor: 'pointer', border: '1px solid var(--border)' },
        },
          el('span', { class: 'grow small strong truncate', text: c.title }),
          el('span', {
            class: 'mchip' + (L().isOverdue(c, today) ? ' danger' : ''),
            text: c.date ? LF.i18n.fmtDate(LF.util.fromYmd(c.date), 'medium') : t('tasks.noDate'),
          }));
        row.addEventListener('click', async () => {
          const ids = topIds.filter(x => x !== c.id);
          ids.splice(Math.min(slotIndex, ids.length), 0, c.id);
          await saveDayReviewFields(ymd, { topTaskIds: ids.slice(0, 3) });
          m.close();
          draw();
        });
        list.appendChild(row);
      });
      m = LF.ui.modal({ title: t('myday.pickPriority'), body: list });
    }

    /* ----- timeline ----- */
    const tlCard = el('div', { class: 'card widget section' },
      el('div', { class: 'widget-head' },
        el('div', { class: 'icon-chip' }, ic('clock', 16)),
        el('h3', { text: t('myday.timeline') })));

    const itemsByHour = {};
    occs.forEach(o => {
      const h = o.ev.startTime ? +o.ev.startTime.slice(0, 2) : null;
      if (h != null) (itemsByHour[h] = itemsByHour[h] || []).push({ kind: 'event', occ: o });
      else (itemsByHour.allday = itemsByHour.allday || []).push({ kind: 'event', occ: o });
    });
    timed.forEach(x => (itemsByHour[+x.time.slice(0, 2)] = itemsByHour[+x.time.slice(0, 2)] || []).push({ kind: 'task', task: x }));

    const nowHour = new Date().getHours();
    const tl = el('div', { class: 'timeline' });
    for (let h = 0; h < 24; h++) {
      const items = (itemsByHour[h] || []).sort((a, b) => {
        const at = a.kind === 'event' ? (a.occ.ev.startTime || '99:99') : a.task.time;
        const bt = b.kind === 'event' ? (b.occ.ev.startTime || '99:99') : b.task.time;
        return at < bt ? -1 : 1;
      });
      const row = el('div', { class: 'hour-row' + (h === nowHour && isToday ? ' now' : '') },
        el('div', { class: 'hour-label num', text: LF.util.pad2(h) + ':00' }),
        el('div', { class: 'hour-items' })
      );
      const itemsWrap = row.querySelector('.hour-items');
      if (items.length) {
        items.forEach(it => {
          if (it.kind === 'event') {
            const ev = it.occ.ev;
            itemsWrap.appendChild(el('div', {
              class: 'row', style: { gap: '8px', cursor: 'pointer' },
              onclick: () => LF.modals.event(ev, {}, () => draw()),
            },
              el('span', { class: 'dot', style: { background: TYPE_COLOR[ev.type] || 'var(--muted)' } }),
              el('span', { class: 'small strong truncate', text: ev.title }),
              el('span', { class: 'faint xs' }, (ev.startTime || '') + (ev.endTime ? '→' + ev.endTime : ''))));
          } else {
            const x = it.task;
            const cbx = el('button', {
              class: 'cbox', role: 'checkbox', 'aria-checked': x.status === 'done' ? 'true' : 'false',
              'aria-label': t('tasks.markDone'),
            }, ic('check', 12));
            cbx.addEventListener('click', async () => {
              x.status = x.status === 'done' ? 'todo' : 'done';
              x.completedAt = x.status === 'done' ? new Date().toISOString() : null;
              await LF.db.put('tasks', x);
              draw();
            });
            itemsWrap.appendChild(el('div', { class: 'row', style: { gap: '8px' } },
              cbx,
              el('span', {
                class: 'small truncate' + (x.status === 'done' ? ' done-text' : ''),
                style: { cursor: 'pointer' },
                onclick: () => LF.modals.task(x, {}, () => draw()),
              }, x.title)));
          }
        });
      } else {
        itemsWrap.appendChild(el('button', {
          class: 'hour-add faint', 'aria-label': t('myday.addAt', { time: LF.util.pad2(h) + ':00' }),
          onclick: () => LF.modals.event(null, { date: ymd, time: LF.util.pad2(h) + ':00' }, () => draw()),
        }, ic('plus', 12)));
      }
      tl.appendChild(row);
    }
    tlCard.appendChild(tl);

    // scroll timeline to current hour
    setTimeout(() => {
      const wrap = tlCard.querySelector('.timeline');
      const nowRow = wrap && wrap.querySelector('.hour-row.now');
      if (nowRow) nowRow.scrollIntoView({ block: 'center' });
    }, 60);

    page.appendChild(tlCard);

    /* ----- untimed ----- */
    const allday = (itemsByHour.allday || []);
    if (untimed.length || allday.length) {
      const card = el('div', { class: 'card widget section' },
        el('div', { class: 'widget-head' },
          el('div', { class: 'icon-chip' }, ic('list-checks', 16)),
          el('h3', { text: t('myday.noTime') })));
      const col = el('div', { class: 'col', style: { gap: '7px' } });
      untimed.forEach(x => {
        const cbx = el('button', {
          class: 'cbox', role: 'checkbox', 'aria-checked': x.status === 'done' ? 'true' : 'false',
          'aria-label': t('tasks.markDone'),
        }, ic('check', 12));
        cbx.addEventListener('click', async () => {
          x.status = x.status === 'done' ? 'todo' : 'done';
          x.completedAt = x.status === 'done' ? new Date().toISOString() : null;
          await LF.db.put('tasks', x);
          draw();
        });
        col.appendChild(el('div', { class: 'row', style: { gap: '9px' } },
          cbx,
          el('span', {
            class: 'grow small truncate' + (x.status === 'done' ? ' done-text' : ''),
            style: { cursor: 'pointer' },
            onclick: () => LF.modals.task(x, {}, () => draw()),
          }, x.title)));
      });
      allday.forEach(it => {
        const ev = it.occ.ev;
        col.appendChild(el('div', {
          class: 'row', style: { gap: '9px', cursor: 'pointer' },
          onclick: () => LF.modals.event(ev, {}, () => draw()),
        },
          el('span', { class: 'dot', style: { background: TYPE_COLOR[ev.type] || 'var(--muted)' } }),
          el('span', { class: 'grow small truncate', text: ev.title })));
      });
      card.appendChild(col);
      page.appendChild(card);
    }

    /* ----- day review ----- */
    const rvCard = el('div', { class: 'card widget section' },
      el('div', { class: 'widget-head' },
        el('div', { class: 'icon-chip' }, ic('sparkles', 16)),
        el('h3', { text: t('myday.review') })));

    const acc = el('textarea', { class: 'textarea', style: { minHeight: '56px' }, text: (review && review.accomplished) || '' });
    const def = el('textarea', { class: 'textarea', style: { minHeight: '56px' }, text: (review && review.deferredNotes) || '' });
    const workH = el('input', {
      class: 'input', type: 'number', min: '0', max: '24', step: '0.5',
      value: review && review.workMinutes != null ? review.workMinutes / 60 : '',
    });
    const studyH = el('input', {
      class: 'input', type: 'number', min: '0', max: '24', step: '0.5',
      value: review && review.studyMinutes != null ? review.studyMinutes / 60 : '',
    });
    const rvNotes = el('textarea', { class: 'textarea', style: { minHeight: '56px' }, text: (review && review.reviewNotes) || '' });

    const stars = el('div', { class: 'row', style: { gap: '4px' } });
    let rating = (review && review.rating) || 0;
    function drawStars() {
      stars.innerHTML = '';
      for (let i = 1; i <= 5; i++) {
        const b = el('button', {
          class: 'star' + (i <= rating ? ' on' : ''),
          'aria-label': i + '/5', 'aria-pressed': i <= rating ? 'true' : 'false',
        }, '★');
        b.addEventListener('click', () => { rating = rating === i ? 0 : i; drawStars(); });
        stars.appendChild(b);
      }
    }
    drawStars();

    const saveBtn = el('button', { class: 'btn primary' }, ic('check', 15), t('common.save'));
    saveBtn.addEventListener('click', async () => {
      await saveDayReviewFields(ymd, {
        accomplished: acc.value.trim(),
        deferredNotes: def.value.trim(),
        workMinutes: workH.value === '' ? null : Math.round(+workH.value * 60),
        studyMinutes: studyH.value === '' ? null : Math.round(+studyH.value * 60),
        reviewNotes: rvNotes.value.trim(),
        rating: rating || null,
      });
      LF.ui.toast(t('common.saved'), { type: 'ok' });
    });

    rvCard.appendChild(el('div', { class: 'col', style: { gap: '13px' } },
      LF.ui.field(t('myday.accomplished'), acc),
      LF.ui.field(t('myday.deferred'), def),
      el('div', { class: 'form-grid' },
        LF.ui.field(t('myday.workHours'), workH),
        LF.ui.field(t('myday.studyHours'), studyH)),
      LF.ui.field(t('myday.rating'), stars),
      LF.ui.field(t('tasks.notes'), rvNotes),
      el('div', { class: 'row', style: { justifyContent: 'flex-end' } }, saveBtn)
    ));
    page.appendChild(rvCard);

    viewEl.innerHTML = '';
    viewEl.appendChild(page);
  }

  LF.views = LF.views || {};
  LF.views['app/myday'] = async function () { await draw(); };
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/expenses.js ===== */
/* ============================================================
   LifeFlow — Expenses view (المصروفات)
   Real CRUD over the `expenses` store; integer minor-unit money.
   Includes: month cursor, category filter, day-grouped list,
   expense modal + per-user category manager (seeded defaults).
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  /* Default categories (spec #10) — seeded per user on first open.
     `key` maps to i18n; `name` is an optional user override. */
  const DEFAULT_CATS = [
    'food', 'transport', 'home', 'education', 'work', 'telecom', 'health',
    'shopping', 'bills', 'fun', 'travel', 'family', 'other',
  ];
  const CAT_COLORS = [
    '#e11d48', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4', '#ef4444',
    '#84cc16', '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#64748b',
  ];
  const METHODS = ['cash', 'card', 'transfer', 'mobile', 'other'];

  async function ensureCategories() {
    const existing = await LF.db.list('expenseCategories', {});
    if (existing.length) return existing;
    const uid = (LF.auth.current() || {}).id || 'anon';
    const now = new Date().toISOString();
    for (let i = 0; i < DEFAULT_CATS.length; i++) {
      await LF.db.put('expenseCategories', {
        id: 'ec-' + uid + '-' + DEFAULT_CATS[i],
        key: DEFAULT_CATS[i],
        name: '',
        color: CAT_COLORS[i % CAT_COLORS.length],
        sort: i,
        createdAt: now,
      });
    }
    return LF.db.list('expenseCategories', {});
  }

  function catLabel(c) {
    if (!c) return '';
    if (c.name) return c.name;
    return c.key ? LF.i18n.t('expenses.cat_' + c.key) : '—';
  }

  function catMap(list) {
    const m = {};
    (list || []).forEach(c => { m[c.id] = c; });
    return m;
  }

  /** categories shown in pickers — hidden defaults excluded */
  function visibleCats(list) {
    return (list || []).filter(c => !c.hidden)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }

  function optionEl(sel, value, labelKeyOrText, isI18n) {
    const o = el('option', { value, selected: String(value) === String(sel) ? '' : null });
    o.textContent = isI18n ? LF.i18n.t(labelKeyOrText) : labelKeyOrText;
    return o;
  }

  /* ============================================================
     View
     ============================================================ */
  const view = {
    month: null,     // 'YYYY-MM' cursor — null = current month
    catFilter: 'all',

    async render(viewEl) {
      viewEl = await LF.shell.ensure();
      view._viewEl = viewEl;
      if (!view.month) view.month = LF.util.todayYmd().slice(0, 7);
      await view.draw();
    },

    async draw() {
      const t = LF.i18n.t;
      const viewEl = view._viewEl;
      if (!viewEl) return;

      const [cats, allExpenses] = await Promise.all([
        ensureCategories(),
        LF.db.list('expenses', {}),
      ]);
      const cMap = catMap(cats);
      const today = LF.util.todayYmd();
      const bounds = L().monthBounds(view.month + '-01');

      let list = allExpenses.filter(e => e.date >= bounds.from && e.date <= bounds.to);
      if (view.catFilter !== 'all') list = list.filter(e => (e.categoryId || '') === view.catFilter);
      list.sort((a, b) => (b.date + (b.time || '99')) .localeCompare(a.date + (a.time || '99')));

      const monthTotal = list.reduce((s, e) => s + (e.amount || 0), 0);
      const todayTotal = allExpenses
        .filter(e => e.date === today)
        .reduce((s, e) => s + (e.amount || 0), 0);
      const top = L().topCategories(list, 1)[0];

      /* page */
      const page = el('div', { class: 'page' });

      /* header */
      const headBtns = el('div', { class: 'row', style: { gap: '8px' } },
        el('button', {
          class: 'btn ghost', onclick: () => location.hash = '#/app/income',
          title: t('nav.income'),
        }, ic('banknote', 15), t('nav.income')));
      if (LF.store.settings && LF.store.settings.features &&
        LF.store.settings.features.budget !== false) {
        headBtns.appendChild(el('button', {
          class: 'btn ghost', onclick: () => location.hash = '#/app/budget',
          title: t('nav.budget'),
        }, ic('chart', 15), t('nav.budget')));
      }
      headBtns.appendChild(el('button', {
        class: 'btn primary', onclick: () => LF.modals.expense(null, {}, () => view.draw()),
      }, ic('plus', 16), t('expenses.new')));

      page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
        el('div', { class: 'grow' },
          el('h1', { text: t('nav.expenses') }),
          el('div', { class: 'page-sub', text: t('expenses.sub', { n: list.length }) })),
        headBtns));

      /* KPIs */
      page.appendChild(el('div', { class: 'kpi-grid', style: { marginBottom: '14px' } },
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('expenses.kMonth') }),
          el('div', { class: 'kpi-value', text: LF.i18n.money(monthTotal) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('expenses.kToday') }),
          el('div', { class: 'kpi-value', text: LF.i18n.money(todayTotal) })),
        top ? el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('expenses.kTopCat') }),
          el('div', { class: 'kpi-value', style: { fontSize: 'var(--fs-l)' }, text: catLabel(cMap[top.categoryId]) || t('expenses.otherCat') }),
          el('div', { class: 'kpi-sub', text: LF.i18n.money(top.total) + ' · ' + (L().topCategories(list).length > 1 && monthTotal ? Math.round((top.total / monthTotal) * 100) + '%' : '') })) : null,
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('expenses.kAvgDay') }),
          el('div', { class: 'kpi-value', text: LF.i18n.money(Math.round(monthTotal / (L().daysInMonth(bounds.from) || 1))) }))));

      /* toolbar: month nav + category filter + manage */
      const prevM = el('button', { class: 'icon-btn', 'aria-label': t('calendar.prev') });
      const pmIc = ic('chevron-right', 16); pmIc.classList.add('icon-flip-ltr'); prevM.appendChild(pmIc);
      prevM.addEventListener('click', () => { view.month = L().addMonthsClamped(view.month + '-01', -1).slice(0, 7); view.draw(); });
      const nextM = el('button', { class: 'icon-btn', 'aria-label': t('calendar.next') }, ic('chevron-left', 16));
      nextM.addEventListener('click', () => { view.month = L().addMonthsClamped(view.month + '-01', 1).slice(0, 7); view.draw(); });

      const catSel = el('select', { class: 'select', style: { width: 'auto' }, 'aria-label': t('expenses.category') });
      catSel.appendChild(optionEl(view.catFilter, 'all', 'expenses.allCats', true));
      visibleCats(cats).forEach(c =>
        catSel.appendChild(optionEl(view.catFilter, c.id, catLabel(c), false)));
      catSel.addEventListener('change', () => { view.catFilter = catSel.value; view.draw(); });

      page.appendChild(el('div', { class: 'card card-pad', style: { marginBottom: '14px' } },
        el('div', { class: 'row wrap between', style: { gap: '10px' } },
          el('div', { class: 'row', style: { gap: '8px' } },
            prevM,
            el('button', {
              class: 'btn soft sm', style: { minWidth: '150px' },
              onclick: () => { view.month = today.slice(0, 7); view.draw(); },
            }, el('strong', { text: LF.i18n.fmtDate(LF.util.fromYmd(bounds.from), 'monthYear') })),
            nextM),
          el('div', { class: 'row', style: { gap: '8px' } },
            catSel,
            el('button', {
              class: 'btn ghost sm', onclick: () => manageCategories(() => view.draw()),
            }, ic('settings', 14), t('expenses.manageCats'))))));

      /* list grouped by day */
      if (!list.length) {
        const hasAny = allExpenses.length > 0;
        page.appendChild(el('div', { class: 'card' },
          LF.ui.empty('wallet', hasAny ? t('expenses.emptyMonth') : t('expenses.empty'),
            hasAny ? t('expenses.emptyMonthHint') : t('expenses.emptyHint'),
            el('button', {
              class: 'btn primary',
              onclick: () => LF.modals.expense(null, {}, () => view.draw()),
            }, ic('plus', 15), t('expenses.new')))));
      } else {
        const wrap = el('div', { class: 'col', style: { gap: '10px' } });
        let currentDate = '';
        let dayTotal = 0;
        let dayTotalEl = null;
        list.forEach(e => {
          if (e.date !== currentDate) {
            currentDate = e.date;
            dayTotal = 0;
            dayTotalEl = el('span', { class: 'small muted num', text: '' });
            wrap.appendChild(el('div', { class: 'day-sep row between' },
              el('span', { class: 'strong small', text: LF.i18n.fmtDate(LF.util.fromYmd(currentDate), 'full') }),
              dayTotalEl));
          }
          dayTotal += e.amount || 0;
          if (dayTotalEl) dayTotalEl.textContent = LF.i18n.money(dayTotal);
          wrap.appendChild(expenseRow(e, cMap));
        });
        page.appendChild(wrap);
      }

      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  function expenseRow(e, cMap) {
    const t = LF.i18n.t;
    const cat = cMap[e.categoryId];
    const label = catLabel(cat) || e.categoryLabel || t('expenses.otherCat');
    const color = (cat && cat.color) || 'var(--muted)';

    const meta = el('div', { class: 'meta' });
    meta.appendChild(el('span', { class: 'mchip' },
      el('span', { class: 'cat-dot', style: { background: color } }), label));
    if (e.method) meta.appendChild(el('span', { class: 'mchip', text: t('expenses.m_' + e.method) }));
    if (e.entity) meta.appendChild(el('span', { class: 'mchip' }, ic('users', 11), e.entity));
    if (e.notes) meta.appendChild(el('span', { class: 'mchip' }, ic('info', 11), t('expenses.hasNote')));

    const row = el('div', { class: 'task-row', role: 'button', tabindex: '0' },
      el('div', { class: 'grow', style: { minWidth: 0 } },
        el('div', { class: 'task-title strong small truncate', text: e.title || label }),
        meta),
      el('div', { class: 'col', style: { alignItems: 'flex-end', gap: '2px' } },
        el('span', { class: 'strong num amount', text: LF.i18n.money(e.amount || 0) }),
        el('span', { class: 'xs faint num', text: (e.time || '') + (e.time ? ' · ' : '') +
          LF.i18n.fmtDate(LF.util.fromYmd(e.date), 'dayMonth') })));
    row.addEventListener('click', () => LF.modals.expense(e, {}, () => view.draw()));
    return row;
  }

  /* ============================================================
     Expense modal — create / edit
     prefill: {date, categoryId}
     ============================================================ */
  LF.modals.expense = async function expenseModal(expenseIn, prefill, onDone) {
    const t = LF.i18n.t;
    const isNew = !expenseIn;
    const ex = expenseIn ? LF.util.clone(expenseIn) : {
      title: '', amount: '', categoryId: (prefill && prefill.categoryId) || '',
      date: (prefill && prefill.date) || LF.util.todayYmd(), time: '',
      method: 'cash', entity: '', workspaceId: '', notes: '',
    };

    const cats = await ensureCategories();
    const visCats = visibleCats(cats);
    if (!ex.categoryId && visCats.length) {
      ex.categoryId = visCats[0].id;
    }

    const cur = (LF.store.settings && LF.store.settings.currency) || 'YER';
    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });

    const amount = el('input', {
      class: 'input num', type: 'text', inputMode: 'decimal', dir: 'ltr',
      value: ex.amount !== '' && ex.amount != null ? fmtForInput(ex.amount, cur) : '',
      placeholder: '0' + (LF.money.decimals(cur) ? '.00' : ''),
      style: { maxWidth: '180px' },
    });
    const title = el('input', { class: 'input', maxlength: '120', value: ex.title || '' });
    const date = el('input', { class: 'input', type: 'date', value: ex.date || '' });
    const time = el('input', { class: 'input', type: 'time', value: ex.time || '' });
    const entity = el('input', { class: 'input', maxlength: '60', value: ex.entity || '' });
    const notes = el('textarea', { class: 'textarea', style: { minHeight: '52px' }, text: ex.notes || '' });

    const cat = el('select', { class: 'select' });
    const selCats = visibleCats(cats);
    /* keep an expense on a hidden category editable as-is */
    if (ex.categoryId && !selCats.some(c => c.id === ex.categoryId) && catMap(cats)[ex.categoryId]) {
      selCats.push(catMap(cats)[ex.categoryId]);
    }
    selCats.forEach(c =>
      cat.appendChild(optionEl(ex.categoryId, c.id, catLabel(c), false)));
    cat.addEventListener('change', () => { ex.categoryId = cat.value; });

    const method = el('select', { class: 'select' });
    METHODS.forEach(m => method.appendChild(optionEl(ex.method || 'cash', m, 'expenses.m_' + m, true)));

    const ws = el('select', { class: 'select' });
    ws.appendChild(optionEl(ex.workspaceId || '', '', 'tasks.noWorkspace', true));
    (LF.store.workspaces || []).forEach(w => ws.appendChild(optionEl(ex.workspaceId, w.id, w.name, false)));

    const body = el('div', { class: 'col', style: { gap: '14px' } },
      el('div', { class: 'form-grid' },
        LF.ui.field(t('expenses.amount') + ' (' + cur + ')', amount),
        LF.ui.field(t('expenses.category'), cat)),
      LF.ui.field(t('expenses.desc'), title, { hint: t('common.optional') }),
      el('div', { class: 'form-grid' },
        LF.ui.field(t('expenses.date'), date),
        LF.ui.field(t('expenses.time'), time, { hint: t('common.optional') }),
        LF.ui.field(t('expenses.method'), method),
        LF.ui.field(t('expenses.entity'), entity, { hint: t('common.optional') })),
      el('div', { class: 'form-grid' },
        LF.ui.field(t('settings.secWorkspaces'), ws)),
      LF.ui.field(t('tasks.notes'), notes, { hint: t('common.optional') }),
      err);

    const m = LF.ui.modal({
      title: isNew ? t('expenses.new') : t('expenses.edit'),
      body,
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('expenses.deleteTitle'),
              message: t('expenses.deleteConfirm', { title: ex.title || catLabel(catMap(cats)[ex.categoryId]) }),
            });
            if (!okC) return;
            await LF.db.delete('expenses', ex.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            const parsed = LF.money.parse(amount.value, LF.money.decimals(cur));
            if (!parsed.ok) {
              showErr(err, parsed.error === 'negative' ? 'expenses.errAmountNeg'
                : parsed.error === 'precision' ? 'expenses.errAmountPrec' : 'expenses.errAmount');
              return;
            }
            if (parsed.value <= 0) { showErr(err, 'expenses.errAmount'); return; }
            if (!date.value) { showErr(err, 'expenses.errDate'); return; }
            if (!LF.logic.validTime(time.value)) { showErr(err, 'tasks.errTime'); return; }
            const catRec = catMap(cats)[cat.value];
            await LF.db.put('expenses', {
              id: ex.id, title: title.value.trim(),
              amount: parsed.value,
              categoryId: cat.value,
              categoryLabel: catLabel(catRec),
              date: date.value, time: time.value || '',
              method: method.value, entity: entity.value.trim(),
              workspaceId: ws.value || '', notes: notes.value.trim(),
              createdAt: ex.createdAt,
            });
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone(isNew ? 'new' : 'edit');
          },
        },
      ],
    });
  };

  /** minor units → plain decimal string for the amount input */
  function fmtForInput(minor, cur) {
    const dec = LF.money.decimals(cur);
    const sign = minor < 0 ? '-' : '';
    const abs = Math.abs(minor | 0);
    if (!dec) return sign + String(abs);
    const base = String(abs).padStart(dec + 1, '0');
    return sign + base.slice(0, -dec) + '.' + base.slice(-dec);
  }

  function showErr(err, key) {
    err.textContent = LF.i18n.t(key);
    err.style.display = 'block';
  }

  /* ============================================================
     Category manager — add / rename / delete (spec: user can
     add & modify categories). Defaults: rename or hide; never
     physically removed (existing expenses keep working).
     ============================================================ */
  function manageCategories(onChange) {
    const t = LF.i18n.t;
    const body = el('div', { class: 'col', style: { gap: '8px' } });
    let m = null;

    async function draw() {
      const cats = (await LF.db.list('expenseCategories', {}))
        .sort((a, b) => (a.sort || 0) - (b.sort || 0));
      body.innerHTML = '';

      const nameIn = el('input', { class: 'input', maxlength: '24', placeholder: t('expenses.newCatPh') });
      const addBtn = el('button', {
        class: 'btn soft sm',
        onclick: async () => {
          const name = nameIn.value.trim();
          if (name.length < 2) return;
          await LF.db.put('expenseCategories', {
            id: LF.util.uid(), key: '', name,
            color: CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)],
            sort: (cats.length ? Math.max(...cats.map(c => c.sort || 0)) : 0) + 1,
            createdAt: new Date().toISOString(),
          });
          nameIn.value = '';
          await draw();
          onChange && onChange();
        },
      }, ic('plus', 13), t('common.add'));
      body.appendChild(el('div', { class: 'row', style: { gap: '8px' } }, nameIn, addBtn));

      cats.forEach(c => {
        const isDefault = !!c.key;
        const row = el('div', {
          class: 'row', style: {
            gap: '10px', padding: '8px 10px',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-m)',
            opacity: c.hidden ? '.5' : '1',
          },
        },
          el('span', { class: 'cat-dot', style: { background: c.color || 'var(--muted)' } }),
          el('span', { class: 'grow small strong', text: catLabel(c) }),
          c.hidden ? el('span', { class: 'badge', text: t('expenses.catHidden') }) : null,
          el('button', {
            class: 'btn ghost sm', title: t('common.edit'), 'aria-label': t('common.edit'),
            onclick: async () => {
              const name = await LF.ui.prompt({
                title: t('expenses.renameCat'), value: catLabel(c),
              });
              if (name == null) return;
              const trimmed = name.trim();
              if (trimmed.length < 2) return;
              c.name = trimmed;
              c.hidden = false;
              await LF.db.put('expenseCategories', c);
              await draw();
              onChange && onChange();
            },
          }, ic('edit', 13)),
          el('button', {
            class: 'btn ghost sm danger', title: t('common.del'), 'aria-label': t('common.del'),
            onclick: async () => {
              const okC = await LF.ui.confirm({
                title: t('expenses.delCatTitle'),
                message: isDefault ? t('expenses.delCatDefault', { name: catLabel(c) })
                  : t('expenses.delCatConfirm', { name: catLabel(c) }),
              });
              if (!okC) return;
              if (isDefault) {
                c.hidden = true;
                await LF.db.put('expenseCategories', c);
              } else {
                await LF.db.delete('expenseCategories', c.id);
              }
              await draw();
              onChange && onChange();
            },
          }, ic('trash', 13)));
        body.appendChild(row);
      });

      body.appendChild(el('div', { class: 'xs faint', text: t('expenses.catsNote') }));
    }

    m = LF.ui.modal({
      title: t('expenses.manageCats'),
      body,
      actions: [{ label: t('common.close'), class: 'ghost', onClick: () => m.close() }],
    });
    draw();
  }

  LF.views = LF.views || {};
  LF.views['app/expenses'] = async function () { await view.render(); };
  LF.expensesView = view;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/income.js ===== */
/* ============================================================
   LifeFlow — Income view (الدخل)
   Totals, net cash flow, 6-month comparison (spec #13).
   Never assumes the user has a salary — sources are free choice.
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  const SOURCES = ['salary', 'freelance', 'project', 'extra', 'gift', 'other'];

  function optionEl(sel, value, labelKeyOrText, isI18n) {
    const o = el('option', { value, selected: String(value) === String(sel) ? '' : null });
    o.textContent = isI18n ? LF.i18n.t(labelKeyOrText) : labelKeyOrText;
    return o;
  }

  /* ============================================================
     View
     ============================================================ */
  const view = {
    month: null,

    async render(viewEl) {
      viewEl = await LF.shell.ensure();
      view._viewEl = viewEl;
      if (!view.month) view.month = LF.util.todayYmd().slice(0, 7);
      await view.draw();
    },

    async draw() {
      const t = LF.i18n.t;
      const viewEl = view._viewEl;
      if (!viewEl) return;

      const [incomes, expenses] = await Promise.all([
        LF.db.list('incomes', {}),
        LF.db.list('expenses', {}),
      ]);
      const bounds = L().monthBounds(view.month + '-01');
      const monthInc = incomes.filter(e => e.date >= bounds.from && e.date <= bounds.to);
      const monthExp = expenses.filter(e => e.date >= bounds.from && e.date <= bounds.to);
      const totalInc = monthInc.reduce((s, e) => s + (e.amount || 0), 0);
      const totalExp = monthExp.reduce((s, e) => s + (e.amount || 0), 0);
      const net = totalInc - totalExp;

      const list = monthInc.slice()
        .sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));

      /* page */
      const page = el('div', { class: 'page' });
      page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
        el('div', { class: 'grow' },
          el('h1', { text: t('nav.income') }),
          el('div', { class: 'page-sub', text: t('income.sub', { n: list.length }) })),
        el('div', { class: 'row', style: { gap: '8px' } },
          el('button', {
            class: 'btn ghost', onclick: () => location.hash = '#/app/expenses',
            title: t('nav.expenses'),
          }, ic('wallet', 15), t('nav.expenses')),
          el('button', {
            class: 'btn primary', onclick: () => LF.modals.income(null, {}, () => view.draw()),
          }, ic('plus', 16), t('income.new')))));

      /* KPIs: income / expense / net (spec #13) */
      const netCls = net >= 0 ? 'pos' : 'neg';
      page.appendChild(el('div', { class: 'kpi-grid', style: { marginBottom: '14px' } },
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('income.kIncome') }),
          el('div', { class: 'kpi-value', text: LF.i18n.money(totalInc) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('income.kExpense') }),
          el('div', { class: 'kpi-value', text: LF.i18n.money(totalExp) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('income.kNet') }),
          el('div', { class: 'kpi-value ' + netCls, text: (net > 0 ? '+' : '') + LF.i18n.money(net) }),
          el('div', { class: 'kpi-sub', text: t(net >= 0 ? 'income.netPos' : 'income.netNeg') }))));

      /* month nav */
      const prevM = el('button', { class: 'icon-btn', 'aria-label': t('calendar.prev') });
      const pmIc = ic('chevron-right', 16); pmIc.classList.add('icon-flip-ltr'); prevM.appendChild(pmIc);
      prevM.addEventListener('click', () => { view.month = L().addMonthsClamped(view.month + '-01', -1).slice(0, 7); view.draw(); });
      const nextM = el('button', { class: 'icon-btn', 'aria-label': t('calendar.next') }, ic('chevron-left', 16));
      nextM.addEventListener('click', () => { view.month = L().addMonthsClamped(view.month + '-01', 1).slice(0, 7); view.draw(); });
      const today = LF.util.todayYmd();

      page.appendChild(el('div', { class: 'card card-pad', style: { marginBottom: '14px' } },
        el('div', { class: 'row wrap between', style: { gap: '10px' } },
          el('div', { class: 'row', style: { gap: '8px' } },
            prevM,
            el('button', {
              class: 'btn soft sm', style: { minWidth: '150px' },
              onclick: () => { view.month = today.slice(0, 7); view.draw(); },
            }, el('strong', { text: LF.i18n.fmtDate(LF.util.fromYmd(bounds.from), 'monthYear') })),
            nextM))));

      /* 6-month comparison (spec: مقارنة شهرية) */
      const trend = L().monthTrend(incomes, expenses, 6, today);
      const maxVal = Math.max(1, ...trend.map(r => Math.max(r.income, r.expense)));
      const trendRows = el('div', { class: 'col', style: { gap: '8px' } });
      trend.forEach(r => {
        const rowNet = r.net >= 0 ? 'pos' : 'neg';
        trendRows.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'center' } },
          el('span', { class: 'small muted', style: { minWidth: '86px' }, text: LF.i18n.fmtDate(LF.util.fromYmd(r.ym + '-01'), 'monthYear') }),
          el('div', { class: 'grow trend-bars', role: 'img', 'aria-label': t('income.trendAria', { ym: r.ym, inc: LF.i18n.money(r.income), exp: LF.i18n.money(r.expense) }) },
            el('div', { class: 'trend-bar inc', style: { width: Math.max(2, Math.round((r.income / maxVal) * 100)) + '%' } }),
            el('div', { class: 'trend-bar exp', style: { width: Math.max(2, Math.round((r.expense / maxVal) * 100)) + '%' } })),
          el('span', { class: 'small num ' + rowNet, style: { minWidth: '90px', textAlign: 'end' }, text: (r.net > 0 ? '+' : '') + LF.i18n.money(r.net) })));
      });
      page.appendChild(el('div', { class: 'card card-pad section', style: { marginBottom: '14px' } },
        el('div', { class: 'row between', style: { marginBottom: '10px' } },
          el('div', { class: 'strong small', text: t('income.compare') }),
          el('div', { class: 'row small muted', style: { gap: '12px' } },
            el('span', {}, el('span', { class: 'cat-dot', style: { background: 'var(--ok)' } }), ' ' + t('income.kIncome')),
            el('span', {}, el('span', { class: 'cat-dot', style: { background: 'var(--danger)' } }), ' ' + t('income.kExpense')))),
        trendRows));

      /* list */
      if (!list.length) {
        page.appendChild(el('div', { class: 'card' },
          LF.ui.empty('banknote', t('income.empty'), t('income.emptyHint'),
            el('button', {
              class: 'btn primary',
              onclick: () => LF.modals.income(null, {}, () => view.draw()),
            }, ic('plus', 15), t('income.new')))));
      } else {
        const wrap = el('div', { class: 'col', style: { gap: '8px' } });
        list.forEach(inc => wrap.appendChild(incomeRow(inc)));
        page.appendChild(wrap);
      }

      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  function incomeRow(inc) {
    const t = LF.i18n.t;
    const meta = el('div', { class: 'meta' });
    meta.appendChild(el('span', { class: 'mchip', text: t('income.src_' + (inc.source || 'other')) }));
    meta.appendChild(el('span', { class: 'mchip' },
      ic('calendar', 11), LF.i18n.fmtDate(LF.util.fromYmd(inc.date), 'medium')));
    if (inc.notes) meta.appendChild(el('span', { class: 'mchip' }, ic('info', 11), t('expenses.hasNote')));

    const row = el('div', { class: 'task-row', role: 'button', tabindex: '0' },
      el('div', { class: 'grow', style: { minWidth: 0 } },
        el('div', { class: 'task-title strong small truncate', text: inc.title || t('income.src_' + (inc.source || 'other')) }),
        meta),
      el('span', { class: 'strong num amount pos', text: '+' + LF.i18n.money(inc.amount || 0) }));
    row.addEventListener('click', () => LF.modals.income(inc, {}, () => view.draw()));
    return row;
  }

  /* ============================================================
     Income modal — prefill: {date}
     ============================================================ */
  LF.modals.income = async function incomeModal(incomeIn, prefill, onDone) {
    const t = LF.i18n.t;
    const isNew = !incomeIn;
    const inc = incomeIn ? LF.util.clone(incomeIn) : {
      title: '', source: 'salary', amount: '',
      date: (prefill && prefill.date) || LF.util.todayYmd(), notes: '', workspaceId: '',
    };

    const cur = (LF.store.settings && LF.store.settings.currency) || 'YER';
    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });

    const amount = el('input', {
      class: 'input num', type: 'text', inputMode: 'decimal', dir: 'ltr',
      value: inc.amount !== '' && inc.amount != null ? fmtForInput(inc.amount, cur) : '',
      placeholder: '0' + (LF.money.decimals(cur) ? '.00' : ''),
      style: { maxWidth: '180px' },
    });
    const title = el('input', { class: 'input', maxlength: '120', value: inc.title || '' });
    const source = el('select', { class: 'select' });
    SOURCES.forEach(s => source.appendChild(optionEl(inc.source || 'salary', s, 'income.src_' + s, true)));
    const date = el('input', { class: 'input', type: 'date', value: inc.date || '' });
    const ws = el('select', { class: 'select' });
    ws.appendChild(optionEl(inc.workspaceId || '', '', 'tasks.noWorkspace', true));
    (LF.store.workspaces || []).forEach(w => ws.appendChild(optionEl(inc.workspaceId, w.id, w.name, false)));
    const notes = el('textarea', { class: 'textarea', style: { minHeight: '52px' }, text: inc.notes || '' });

    const body = el('div', { class: 'col', style: { gap: '14px' } },
      el('div', { class: 'form-grid' },
        LF.ui.field(t('expenses.amount') + ' (' + cur + ')', amount),
        LF.ui.field(t('income.source'), source)),
      LF.ui.field(t('income.desc'), title, { hint: t('common.optional') }),
      el('div', { class: 'form-grid' },
        LF.ui.field(t('expenses.date'), date),
        LF.ui.field(t('settings.secWorkspaces'), ws)),
      LF.ui.field(t('tasks.notes'), notes, { hint: t('common.optional') }),
      err);

    function showErr(key) {
      err.textContent = LF.i18n.t(key);
      err.style.display = 'block';
    }

    const m = LF.ui.modal({
      title: isNew ? t('income.new') : t('income.edit'),
      body,
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('income.deleteTitle'),
              message: t('income.deleteConfirm', { title: inc.title || t('income.src_' + (inc.source || 'other')) }),
            });
            if (!okC) return;
            await LF.db.delete('incomes', inc.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            const parsed = LF.money.parse(amount.value, LF.money.decimals(cur));
            if (!parsed.ok || parsed.value <= 0) {
              showErr(parsed.error === 'negative' ? 'expenses.errAmountNeg'
                : parsed.error === 'precision' ? 'expenses.errAmountPrec' : 'expenses.errAmount');
              return;
            }
            if (!date.value) { showErr('expenses.errDate'); return; }
            await LF.db.put('incomes', {
              id: inc.id, title: title.value.trim(), source: source.value,
              amount: parsed.value, date: date.value,
              workspaceId: ws.value || '', notes: notes.value.trim(),
              createdAt: inc.createdAt,
            });
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone(isNew ? 'new' : 'edit');
          },
        },
      ],
    });
  };

  /** minor units → plain decimal string for the amount input */
  function fmtForInput(minor, cur) {
    const dec = LF.money.decimals(cur);
    const sign = minor < 0 ? '-' : '';
    const abs = Math.abs(minor | 0);
    if (!dec) return sign + String(abs);
    const base = String(abs).padStart(dec + 1, '0');
    return sign + base.slice(0, -dec) + '.' + base.slice(-dec);
  }

  LF.views = LF.views || {};
  LF.views['app/income'] = async function () { await view.render(); };
  LF.incomeView = view;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/budgets.js ===== */
/* ============================================================
   LifeFlow — Budgets view (الميزانية)
   Daily / weekly / monthly / yearly + per-category budgets.
   Shows: consumption %, remaining, month-end projection,
   top spending categories, near-limit alerts (spec #11).
   Gated by settings.features.budget (toggleable feature).
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];

  function optionEl(sel, value, labelKeyOrText, isI18n) {
    const o = el('option', { value, selected: String(value) === String(sel) ? '' : null });
    o.textContent = isI18n ? LF.i18n.t(labelKeyOrText) : labelKeyOrText;
    return o;
  }

  function budgetLabel(b, cMap) {
    const t = LF.i18n.t;
    if (b.name) return b.name;
    if (b.categoryId && cMap[b.categoryId]) return catLabelOf(cMap[b.categoryId]);
    return t('budgets.general');
  }
  function catLabelOf(c) {
    if (!c) return '';
    if (c.name) return c.name;
    return c.key ? LF.i18n.t('expenses.cat_' + c.key) : '—';
  }

  /* ============================================================
     View
     ============================================================ */
  const view = {
    async render(viewEl) {
      viewEl = await LF.shell.ensure();
      view._viewEl = viewEl;
      await view.draw();
    },

    async draw() {
      const t = LF.i18n.t;
      const viewEl = view._viewEl;
      if (!viewEl) return;
      const s = LF.store.settings || {};
      if (LF.store.feature && !LF.store.feature('budget')) {
        /* feature disabled — shouldn't be reachable (nav hides it) */
        viewEl.innerHTML = '';
        viewEl.appendChild(el('div', { class: 'page' },
          el('div', { class: 'card' }, LF.ui.empty('chart', t('budgets.disabled'), t('budgets.disabledHint')))));
        return;
      }

      const [budgets, expenses, cats] = await Promise.all([
        LF.db.list('budgets', {}),
        LF.db.list('expenses', {}),
        LF.db.list('expenseCategories', {}),
      ]);
      const cMap = {};
      cats.forEach(c => { cMap[c.id] = c; });

      const today = LF.util.todayYmd();
      const weekStart = s.weekStart == null ? 0 : s.weekStart;
      const monthB = L().monthBounds(today);
      const monthExp = expenses.filter(e => e.date >= monthB.from && e.date <= monthB.to);

      /* statuses */
      const statuses = budgets.map(b => ({ b, st: L().budgetStatus(b, expenses, today, weekStart) }));
      const alerted = statuses.filter(x => x.st.state !== 'ok');

      /* page */
      const page = el('div', { class: 'page' });
      page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
        el('div', { class: 'grow' },
          el('h1', { text: t('nav.budget') }),
          el('div', { class: 'page-sub', text: t('budgets.sub', { n: budgets.length }) })),
        el('div', { class: 'row', style: { gap: '8px' } },
          el('button', {
            class: 'btn ghost', onclick: () => location.hash = '#/app/expenses',
            title: t('nav.expenses'),
          }, ic('wallet', 15), t('nav.expenses')),
          el('button', {
            class: 'btn primary', onclick: () => LF.modals.budget(null, () => view.draw()),
          }, ic('plus', 16), t('budgets.new')))));

      /* near-limit alerts (spec: تنبيهات الاقتراب من الحد) */
      alerted.forEach(({ b, st }) => {
        page.appendChild(el('div', {
          class: 'banner ' + (st.state === 'over' ? 'error' : 'warn'),
          style: { marginBottom: '10px' },
        },
          ic(st.state === 'over' ? 'info' : 'info', 16),
          el('div', { class: 'grow' },
            el('div', { class: 'strong small', text: st.state === 'over' ? t('budgets.overTitle', { name: budgetLabel(b, cMap) }) : t('budgets.warnTitle', { name: budgetLabel(b, cMap), pct: st.pct }) }),
            el('div', { class: 'xs muted', text: t('budgets.spentLine', { spent: LF.i18n.money(st.spent), amount: LF.i18n.money(b.amount || 0) }) }))));
      });

      /* budgets list */
      if (!budgets.length) {
        page.appendChild(el('div', { class: 'card' },
          LF.ui.empty('chart', t('budgets.empty'), t('budgets.emptyHint'),
            el('button', {
              class: 'btn primary',
              onclick: () => LF.modals.budget(null, () => view.draw()),
            }, ic('plus', 15), t('budgets.new')))));
      } else {
        const wrap = el('div', { class: 'col', style: { gap: '10px' } });
        statuses.forEach(({ b, st }) => wrap.appendChild(budgetCard(b, st, cMap)));
        page.appendChild(wrap);
      }

      /* top spending categories this month (spec: الفئات الأعلى إنفاقًا) */
      const top = L().topCategories(monthExp, 5);
      const monthTotal = monthExp.reduce((sum, e) => sum + (e.amount || 0), 0);
      const maxCat = top.length ? Math.max(1, top[0].total) : 1;
      const topCard = el('div', { class: 'card card-pad section' },
        el('div', { class: 'strong small', style: { marginBottom: '10px' },
          text: t('budgets.topCats') + ' — ' + LF.i18n.fmtDate(LF.util.fromYmd(monthB.from), 'monthYear') }));
      if (!top.length) {
        topCard.appendChild(el('div', { class: 'muted small', text: t('budgets.noCats') }));
      } else {
        top.forEach(x => {
          const pct = monthTotal ? Math.round((x.total / monthTotal) * 100) : 0;
          topCard.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'center', marginBottom: '8px' } },
            el('span', { class: 'cat-dot', style: { background: (cMap[x.categoryId] || {}).color || 'var(--muted)' } }),
            el('span', { class: 'small grow truncate', text: catLabelOf(cMap[x.categoryId]) || LF.i18n.t('expenses.otherCat') }),
            el('div', { class: 'progress grow', style: { maxWidth: '160px', minWidth: '80px' } },
              el('div', { style: { width: Math.max(3, Math.round((x.total / maxCat) * 100)) + '%' } })),
            el('span', { class: 'small num', style: { minWidth: '110px', textAlign: 'end' },
              text: LF.i18n.money(x.total) + ' · ' + pct + '%' })));
        });
      }
      page.appendChild(topCard);

      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  function budgetCard(b, st, cMap) {
    const t = LF.i18n.t;
    const pct = Math.min(100, st.pct);
    const barColor = st.state === 'over' ? 'var(--danger)' : st.state === 'warn' ? 'var(--warn, #f59e0b)' : 'var(--accent)';
    const daysLeft = Math.max(0, Math.round((LF.util.fromYmd(st.to) - LF.util.fromYmd(LF.util.todayYmd())) / 86400000));

    const meta = el('div', { class: 'meta' });
    meta.appendChild(el('span', { class: 'mchip', text: t('budgets.p_' + (b.period || 'monthly')) }));
    if (b.categoryId && cMap[b.categoryId]) {
      meta.appendChild(el('span', { class: 'mchip' },
        el('span', { class: 'cat-dot', style: { background: cMap[b.categoryId].color || 'var(--muted)' } }),
        catLabelOf(cMap[b.categoryId])));
    } else {
      meta.appendChild(el('span', { class: 'mchip', text: t('budgets.allCats') }));
    }
    meta.appendChild(el('span', { class: 'mchip' }, ic('calendar', 11),
      LF.i18n.fmtDate(LF.util.fromYmd(st.from), 'dayMonth') + ' → ' +
      LF.i18n.fmtDate(LF.util.fromYmd(st.to), 'dayMonth')));

    const sub = el('div', { class: 'small muted', style: { marginTop: '6px' } });
    sub.appendChild(document.createTextNode(
      t('budgets.spentOf', { spent: LF.i18n.money(st.spent), amount: LF.i18n.money(b.amount || 0) }) + ' · '));
    const remainSpan = el('span', { class: st.remaining >= 0 ? 'pos' : 'neg' },
      t('budgets.remaining', { amount: LF.i18n.money(Math.abs(st.remaining)) }));
    sub.appendChild(remainSpan);
    if (st.projected != null && (b.period === 'monthly' || !b.period) && daysLeft > 0) {
      sub.appendChild(document.createTextNode(' · ' + t('budgets.projected', {
        amount: LF.i18n.money(st.projected),
        pct: b.amount ? Math.round((st.projected / b.amount) * 100) : 0,
      })));
    }

    const card = el('div', {
      class: 'card card-pad task-row', role: 'button', tabindex: '0',
    },
      el('div', { class: 'grow', style: { minWidth: 0 } },
        el('div', { class: 'row between', style: { gap: '8px' } },
          el('div', { class: 'task-title strong small truncate', text: budgetLabel(b, cMap) }),
          el('span', {
            class: 'badge ' + (st.state === 'over' ? 'danger' : st.state === 'warn' ? 'warn' : 'info'),
            text: st.pct + '%',
          })),
        meta,
        el('div', { class: 'progress', style: { marginTop: '8px' } },
          el('div', { style: { width: pct + '%', background: barColor } })),
        sub));
    card.addEventListener('click', () => LF.modals.budget(b, () => view.draw()));
    return card;
  }

  /* ============================================================
     Budget modal — create / edit
     ============================================================ */
  LF.modals.budget = async function budgetModal(budgetIn, onDone) {
    const t = LF.i18n.t;
    const isNew = !budgetIn;
    const b = budgetIn ? LF.util.clone(budgetIn) : {
      name: '', categoryId: '', amount: '', period: 'monthly',
    };

    const cats = (await LF.db.list('expenseCategories', {}))
      .sort((a, b2) => (a.sort || 0) - (b2.sort || 0));
    const cur = (LF.store.settings && LF.store.settings.currency) || 'YER';
    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });

    const name = el('input', { class: 'input', maxlength: '40', value: b.name || '' });
    const amount = el('input', {
      class: 'input num', type: 'text', inputMode: 'decimal', dir: 'ltr',
      value: b.amount !== '' && b.amount != null ? fmtForInput(b.amount, cur) : '',
      placeholder: '0' + (LF.money.decimals(cur) ? '.00' : ''),
      style: { maxWidth: '180px' },
    });
    const cat = el('select', { class: 'select' });
    cat.appendChild(optionEl(b.categoryId || '', '', 'budgets.allCats', true));
    const visCats = cats.filter(c => !c.hidden);
    if (b.categoryId && !visCats.some(c => c.id === b.categoryId) &&
      cats.some(c => c.id === b.categoryId)) {
      visCats.push(cats.find(c => c.id === b.categoryId));
    }
    visCats.forEach(c => cat.appendChild(optionEl(b.categoryId, c.id, catLabelOf(c), false)));
    const period = LF.ui.seg(
      PERIODS.map(p => ({ value: p, label: t('budgets.p_' + p) })),
      b.period || 'monthly', v => { b.period = v; });

    const body = el('div', { class: 'col', style: { gap: '14px' } },
      LF.ui.field(t('budgets.nameLabel'), name, { hint: t('common.optional') }),
      el('div', { class: 'form-grid' },
        LF.ui.field(t('expenses.amount') + ' (' + cur + ')', amount),
        LF.ui.field(t('budgets.categoryLabel'), cat)),
      LF.ui.field(t('budgets.periodLabel'), period),
      err);

    function showErr(key) {
      err.textContent = LF.i18n.t(key);
      err.style.display = 'block';
    }

    const m = LF.ui.modal({
      title: isNew ? t('budgets.new') : t('budgets.edit'),
      body,
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('budgets.deleteTitle'),
              message: t('budgets.deleteConfirm', { name: b.name || t('budgets.general') }),
            });
            if (!okC) return;
            await LF.db.delete('budgets', b.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            const parsed = LF.money.parse(amount.value, LF.money.decimals(cur));
            if (!parsed.ok || parsed.value <= 0) {
              showErr(parsed.error === 'negative' ? 'expenses.errAmountNeg'
                : parsed.error === 'precision' ? 'expenses.errAmountPrec' : 'expenses.errAmount');
              return;
            }
            await LF.db.put('budgets', {
              id: b.id, name: name.value.trim(), categoryId: cat.value || '',
              amount: parsed.value, period: b.period || 'monthly',
              createdAt: b.createdAt,
            });
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone(isNew ? 'new' : 'edit');
          },
        },
      ],
    });
  };

  /** minor units → plain decimal string for the amount input */
  function fmtForInput(minor, cur) {
    const dec = LF.money.decimals(cur);
    const sign = minor < 0 ? '-' : '';
    const abs = Math.abs(minor | 0);
    if (!dec) return sign + String(abs);
    const base = String(abs).padStart(dec + 1, '0');
    return sign + base.slice(0, -dec) + '.' + base.slice(-dec);
  }

  LF.views = LF.views || {};
  LF.views['app/budget'] = async function () { await view.render(); };
  LF.budgetsView = view;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/debts.js ===== */
/* ============================================================
   LifeFlow — Debts view (الديون)
   Two directions: "ديون عليّ" (I owe) / "ديون لي" (owed to me).
   Full payment log per debt (debtPayments store) — partial
   payments never delete the debt; status is always COMPUTED
   from payments: due | partial | paid | overdue (spec #12).
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  const STATE_BADGE = { due: 'info', partial: 'warn', paid: 'ok', overdue: 'danger' };

  function optionEl(sel, value, labelKeyOrText, isI18n) {
    const o = el('option', { value, selected: String(value) === String(sel) ? '' : null });
    o.textContent = isI18n ? LF.i18n.t(labelKeyOrText) : labelKeyOrText;
    return o;
  }

  /** resolve a person name → contactId (exact, case-insensitive) */
  function matchContact(contacts, name) {
    const n = String(name || '').trim().toLowerCase();
    if (!n) return '';
    const hit = contacts.find(c => String(c.name || '').trim().toLowerCase() === n);
    return hit ? hit.id : '';
  }

  /* ============================================================
     View
     ============================================================ */
  const view = {
    tab: 'iou',   // 'iou' = عليّ | 'owed' = لي

    async render(viewEl) {
      viewEl = await LF.shell.ensure();
      view._viewEl = viewEl;
      await view.draw();
    },

    async draw() {
      const t = LF.i18n.t;
      const viewEl = view._viewEl;
      if (!viewEl) return;

      const [debts, payments] = await Promise.all([
        LF.db.list('debts', {}),
        LF.db.list('debtPayments', {}),
      ]);
      const today = LF.util.todayYmd();

      const iou = debts.filter(d => d.direction !== 'owed');   // عليّ
      const owed = debts.filter(d => d.direction === 'owed');  // لي
      const list = (view.tab === 'owed' ? owed : iou).slice()
        .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));

      const sum = (arr, fn) => arr.reduce((s, d) => s + fn(d), 0);
      const remainingOf = d => L().debtStatus(d, payments, today).remaining;
      const totals = {
        iouAmount: sum(iou, d => d.amount | 0),
        iouRemaining: sum(iou, remainingOf),
        owedAmount: sum(owed, d => d.amount | 0),
        owedRemaining: sum(owed, remainingOf),
      };

      /* page */
      const page = el('div', { class: 'page' });
      page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
        el('div', { class: 'grow' },
          el('h1', { text: t('nav.debts') }),
          el('div', { class: 'page-sub', text: t('debts.sub', { n: list.length }) })),
        el('button', {
          class: 'btn primary', onclick: () => LF.modals.debt(null, view.tab, () => view.draw()),
        }, ic('plus', 16), t('debts.new'))));

      /* tabs */
      const tabs = LF.ui.seg([
        { value: 'iou', label: t('debts.tabIou') + ' (' + LF.i18n.num(iou.length) + ')' },
        { value: 'owed', label: t('debts.tabOwed') + ' (' + LF.i18n.num(owed.length) + ')' },
      ], view.tab, v => { view.tab = v; view.draw(); });
      page.appendChild(el('div', { style: { marginBottom: '12px' } }, tabs));

      /* KPIs for the active tab + net position */
      const isIou = view.tab === 'iou';
      const amount = isIou ? totals.iouAmount : totals.owedAmount;
      const remaining = isIou ? totals.iouRemaining : totals.owedRemaining;
      const paid = amount - remaining;
      page.appendChild(el('div', { class: 'kpi-grid', style: { marginBottom: '14px' } },
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: isIou ? t('debts.kIOwe') : t('debts.kOweMe') }),
          el('div', { class: 'kpi-value', text: LF.i18n.money(remaining) }),
          el('div', { class: 'kpi-sub', text: t('debts.ofTotal', { amount: LF.i18n.money(amount) }) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('debts.paid') }),
          el('div', { class: 'kpi-value pos', text: LF.i18n.money(paid) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('debts.kNet') }),
          el('div', { class: 'kpi-value ' + (totals.owedRemaining - totals.iouRemaining >= 0 ? 'pos' : 'neg'),
            text: (totals.owedRemaining - totals.iouRemaining > 0 ? '+' : '') +
              LF.i18n.money(totals.owedRemaining - totals.iouRemaining) }),
          el('div', { class: 'kpi-sub', text: t('debts.kNetHint') }))));

      /* list */
      if (!list.length) {
        page.appendChild(el('div', { class: 'card' },
          LF.ui.empty('credit-card',
            t(isIou ? 'debts.emptyIou' : 'debts.emptyOwed'),
            t(isIou ? 'debts.emptyIouHint' : 'debts.emptyOwedHint'),
            el('button', {
              class: 'btn primary',
              onclick: () => LF.modals.debt(null, view.tab, () => view.draw()),
            }, ic('plus', 15), t('debts.new')))));
      } else {
        const wrap = el('div', { class: 'col', style: { gap: '10px' } });
        list.forEach(d => {
          const pays = payments.filter(p => p.debtId === d.id)
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          wrap.appendChild(debtCard(d, L().debtStatus(d, payments, today), pays.length));
        });
        page.appendChild(wrap);
      }

      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  function debtCard(d, st, paysCount) {
    const t = LF.i18n.t;
    const today = LF.util.todayYmd();

    const meta = el('div', { class: 'meta' });
    meta.appendChild(el('span', { class: 'mchip' }, ic('user', 11), d.person || '—'));
    if (d.dueDate) {
      const overdue = st.state === 'overdue';
      meta.appendChild(el('span', { class: 'mchip' + (overdue ? ' danger' : '') },
        ic('calendar', 11),
        (overdue ? t('debts.st_overdue') + ' · ' : t('debts.dueDate') + ': ') +
        LF.i18n.fmtDate(LF.util.fromYmd(d.dueDate), 'medium')));
    } else {
      meta.appendChild(el('span', { class: 'mchip', text: t('debts.noDueDate') }));
    }
    if (d.reason) meta.appendChild(el('span', { class: 'mchip', text: d.reason }));
    if (paysCount) meta.appendChild(el('span', { class: 'mchip' }, ic('wallet', 11),
      LF.i18n.num(paysCount) + ' ' + t('debts.paymentsCount')));

    const card = el('div', { class: 'card card-pad task-row' },
      el('div', { class: 'grow', style: { minWidth: 0 } },
        el('div', { class: 'row between', style: { gap: '8px' } },
          el('div', { class: 'task-title strong small truncate', text: d.person || '—' }),
          el('span', { class: 'badge ' + STATE_BADGE[st.state], text: t('debts.st_' + st.state) })),
        el('div', { class: 'small muted num', style: { marginTop: '4px' } },
          LF.i18n.money(d.amount || 0) + ' · ' +
          t('debts.paid') + ' ' + LF.i18n.money(st.paid)),
        meta,
        el('div', { class: 'progress', style: { marginTop: '8px' } },
          el('div', { style: { width: st.pct + '%', background: st.state === 'overdue' ? 'var(--danger)' : 'var(--accent)' } })),
        el('div', { class: 'small num ' + (st.remaining > 0 ? 'neg' : 'pos'), style: { marginTop: '6px' } },
          st.remaining > 0
            ? t('debts.remaining', { amount: LF.i18n.money(st.remaining) })
            : t('debts.paidOff'))),
      el('div', { class: 'col', style: { gap: '6px', alignItems: 'stretch' } },
        el('button', {
          class: 'btn soft sm', onclick: (e) => { e.stopPropagation(); paymentsModal(d, () => view.draw()); },
        }, ic('wallet', 13), t('debts.payments')),
        el('button', {
          class: 'btn soft sm', onclick: (e) => { e.stopPropagation(); addPaymentModal(d, () => view.draw()); },
        }, ic('plus', 13), t('debts.addPayment'))));
    card.addEventListener('click', () => LF.modals.debt(d, d.direction || 'iou', () => view.draw()));
    return card;
  }

  /* ============================================================
     Debt modal — direction preset from the active tab
     ============================================================ */
  LF.modals.debt = async function debtModal(debtIn, direction, onDone) {
    const t = LF.i18n.t;
    const isNew = !debtIn;
    const d = debtIn ? LF.util.clone(debtIn) : {
      person: '', amount: '', direction: direction === 'owed' ? 'owed' : 'iou',
      date: LF.util.todayYmd(), dueDate: '', reason: '', notes: '', contactId: '',
    };

    const contacts = await LF.db.list('contacts', {});
    const cur = (LF.store.settings && LF.store.settings.currency) || 'YER';
    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });

    const person = el('input', {
      class: 'input', maxlength: '60', value: d.person || '',
      list: 'lf-debt-contacts',
    });
    const personList = el('datalist', { id: 'lf-debt-contacts' },
      contacts.map(c => el('option', { value: c.name })));
    const amount = el('input', {
      class: 'input num', type: 'text', inputMode: 'decimal', dir: 'ltr',
      value: d.amount !== '' && d.amount != null ? fmtForInput(d.amount, cur) : '',
      placeholder: '0' + (LF.money.decimals(cur) ? '.00' : ''),
      style: { maxWidth: '180px' },
    });
    const date = el('input', { class: 'input', type: 'date', value: d.date || '' });
    const dueDate = el('input', { class: 'input', type: 'date', value: d.dueDate || '' });
    const reason = el('input', { class: 'input', maxlength: '80', value: d.reason || '' });
    const notes = el('textarea', { class: 'textarea', style: { minHeight: '52px' }, text: d.notes || '' });
    const dir = LF.ui.seg([
      { value: 'iou', label: t('debts.tabIou') },
      { value: 'owed', label: t('debts.tabOwed') },
    ], d.direction || 'iou', v => { d.direction = v; });

    function showErr(key) {
      err.textContent = LF.i18n.t(key);
      err.style.display = 'block';
    }

    const m = LF.ui.modal({
      title: isNew ? t('debts.new') : t('debts.edit'),
      body: el('div', { class: 'col', style: { gap: '14px' } },
        LF.ui.field(t('debts.direction'), dir),
        LF.ui.field(t('debts.person'), person, { hint: t('debts.personHint') }),
        el('div', { class: 'form-grid' },
          LF.ui.field(t('debts.amount') + ' (' + cur + ')', amount),
          LF.ui.field(t('debts.date'), date)),
        el('div', { class: 'form-grid' },
          LF.ui.field(t('debts.dueDate'), dueDate, { hint: t('common.optional') }),
          LF.ui.field(t('debts.reason'), reason, { hint: t('common.optional') })),
        LF.ui.field(t('tasks.notes'), notes, { hint: t('common.optional') }),
        err,
        personList),
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('debts.deleteTitle'),
              message: t('debts.deleteConfirm', { person: d.person || '—' }),
            });
            if (!okC) return;
            const pays = await LF.db.list('debtPayments', { predicate: p => p.debtId === debtIn.id });
            for (const p of pays) await LF.db.delete('debtPayments', p.id);
            await LF.db.delete('debts', debtIn.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            const parsed = LF.money.parse(amount.value, LF.money.decimals(cur));
            if (!parsed.ok || parsed.value <= 0) {
              showErr(parsed.error === 'negative' ? 'expenses.errAmountNeg'
                : parsed.error === 'precision' ? 'expenses.errAmountPrec' : 'expenses.errAmount');
              return;
            }
            if (person.value.trim().length < 2) { showErr('debts.errPerson'); return; }
            if (!date.value) { showErr('expenses.errDate'); return; }
            await LF.db.put('debts', {
              id: d.id,
              direction: d.direction || 'iou',
              person: person.value.trim(),
              contactId: matchContact(contacts, person.value),
              amount: parsed.value,
              date: date.value,
              dueDate: dueDate.value || '',
              reason: reason.value.trim(),
              notes: notes.value.trim(),
              createdAt: d.createdAt,
            });
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone(isNew ? 'new' : 'edit');
          },
        },
      ],
    });
  };

  /* ============================================================
     Payments log — full record; partial payment keeps the debt
     ============================================================ */
  function paymentsModal(debt, onChange) {
    const t = LF.i18n.t;
    const body = el('div', { class: 'col', style: { gap: '10px' } });
    let m = null;

    async function draw() {
      const [payments] = await Promise.all([
        LF.db.list('debtPayments', { predicate: p => p.debtId === debt.id }),
      ]);
      payments.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const st = L().debtStatus(debt, payments, LF.util.todayYmd());
      body.innerHTML = '';

      body.appendChild(el('div', { class: 'card card-pad', style: { background: 'var(--surface-2)', boxShadow: 'none' } },
        el('div', { class: 'small muted', text: debt.person || '—' }),
        el('div', { class: 'row between', style: { marginTop: '4px' } },
          el('strong', { class: 'num', text: LF.i18n.money(debt.amount || 0) }),
          el('span', { class: 'badge ' + STATE_BADGE[st.state], text: t('debts.st_' + st.state) })),
        el('div', { class: 'small num', style: { marginTop: '6px' } },
          t('debts.paid') + ': ' + LF.i18n.money(st.paid) + ' · ' +
          t('debts.remaining', { amount: LF.i18n.money(Math.max(0, st.remaining)) }))));

      const addBtn = el('button', {
        class: 'btn primary sm',
        onclick: () => { m.close(); addPaymentModal(debt, onChange); },
      }, ic('plus', 13), t('debts.addPayment'));
      body.appendChild(el('div', {}, addBtn));

      if (!payments.length) {
        body.appendChild(el('div', { class: 'muted small', text: t('debts.paymentsEmpty') }));
        return;
      }
      payments.forEach(p => {
        const row = el('div', { class: 'task-row' },
          el('div', { class: 'grow', style: { minWidth: 0 } },
            el('div', { class: 'small strong num', text: LF.i18n.money(p.amount || 0) }),
            el('div', { class: 'meta' },
              el('span', { class: 'mchip' }, ic('calendar', 11),
                LF.i18n.fmtDate(LF.util.fromYmd(p.date), 'medium')),
              p.note ? el('span', { class: 'mchip', text: p.note }) : null)),
          el('button', {
            class: 'btn ghost sm danger', 'aria-label': t('common.del'),
            onclick: async () => {
              const okC = await LF.ui.confirm({
                title: t('debts.deletePayment'),
                message: t('debts.deletePaymentConfirm', { amount: LF.i18n.money(p.amount || 0) }),
              });
              if (!okC) return;
              await LF.db.delete('debtPayments', p.id);
              await draw();
              onChange && onChange();
            },
          }, ic('trash', 13)));
        body.appendChild(row);
      });
    }

    m = LF.ui.modal({
      title: t('debts.payments'),
      body,
      actions: [{ label: t('common.close'), class: 'ghost', onClick: () => m.close() }],
    });
    draw();
  }

  /* add a single payment — amount capped at remaining */
  function addPaymentModal(debt, onChange) {
    const t = LF.i18n.t;
    const cur = (LF.store.settings && LF.store.settings.currency) || 'YER';
    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });

    (async () => {
      const payments = await LF.db.list('debtPayments', { predicate: p => p.debtId === debt.id });
      const st = L().debtStatus(debt, payments, LF.util.todayYmd());
      const remaining = Math.max(0, st.remaining);

      const amount = el('input', {
        class: 'input num', type: 'text', inputMode: 'decimal', dir: 'ltr',
        placeholder: '0' + (LF.money.decimals(cur) ? '.00' : ''),
        style: { maxWidth: '180px' },
      });
      const date = el('input', { class: 'input', type: 'date', value: LF.util.todayYmd() });
      const note = el('input', { class: 'input', maxlength: '80', value: '' });

      let m = null;
      m = LF.ui.modal({
        title: t('debts.addPayment'),
        body: el('div', { class: 'col', style: { gap: '14px' } },
          el('div', { class: 'small muted' },
            debt.person + ' · ' + t('debts.remaining', { amount: LF.i18n.money(remaining) })),
          el('div', { class: 'form-grid' },
            LF.ui.field(t('debts.paymentAmount') + ' (' + cur + ')', amount),
            LF.ui.field(t('debts.paymentDate'), date)),
          LF.ui.field(t('debts.paymentNote'), note, { hint: t('common.optional') }),
          err),
        actions: [
          { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
          {
            label: t('common.save'), class: 'primary', keepOpen: true,
            onClick: async () => {
              const parsed = LF.money.parse(amount.value, LF.money.decimals(cur));
              if (!parsed.ok || parsed.value <= 0) {
                err.textContent = LF.i18n.t('expenses.errAmount');
                err.style.display = 'block';
                return;
              }
              if (parsed.value > remaining) {
                err.textContent = LF.i18n.t('debts.overpayErr', { amount: LF.i18n.money(remaining) });
                err.style.display = 'block';
                return;
              }
              if (!date.value) {
                err.textContent = LF.i18n.t('expenses.errDate');
                err.style.display = 'block';
                return;
              }
              await LF.db.put('debtPayments', {
                debtId: debt.id, amount: parsed.value,
                date: date.value, note: note.value.trim(),
              });
              m.close();
              LF.ui.toast(t('common.saved'), { type: 'ok' });
              onChange && onChange('payment');
            },
          },
        ],
      });
    })();
  }

  /** minor units → plain decimal string for the amount input */
  function fmtForInput(minor, cur) {
    const dec = LF.money.decimals(cur);
    const sign = minor < 0 ? '-' : '';
    const abs = Math.abs(minor | 0);
    if (!dec) return sign + String(abs);
    const base = String(abs).padStart(dec + 1, '0');
    return sign + base.slice(0, -dec) + '.' + base.slice(-dec);
  }

  LF.views = LF.views || {};
  LF.views['app/debts'] = async function () { await view.render(); };
  LF.debtsView = view;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/contacts.js ===== */
/* ============================================================
   LifeFlow — Contacts view (الأشخاص)
   Unified contacts + per-contact detail page showing a TIMELINE
   of everything linked to them: debts, payments, tasks,
   appointments, projects (spec #19).
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  const RELATIONS = ['family', 'friend', 'work', 'client', 'neighbor', 'other'];
  const AVATAR_COLORS = ['#0d9488', '#e11d48', '#3b82f6', '#f59e0b', '#8b5cf6',
    '#10b981', '#ec4899', '#06b6d4', '#f97316', '#6366f1'];

  /** stable color from a name (so avatars don't change between renders) */
  function colorFor(name) {
    let h = 0;
    for (let i = 0; i < String(name || '').length; i++) h = (h * 31 + String(name).charCodeAt(i)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  }

  function optionEl(sel, value, labelKeyOrText, isI18n) {
    const o = el('option', { value, selected: String(value) === String(sel) ? '' : null });
    o.textContent = isI18n ? LF.i18n.t(labelKeyOrText) : labelKeyOrText;
    return o;
  }

  /* ============================================================
     List
     ============================================================ */
  const view = {
    async render(viewEl) {
      viewEl = await LF.shell.ensure();
      view._viewEl = viewEl;
      await view.draw();
    },

    async draw() {
      const t = LF.i18n.t;
      const viewEl = view._viewEl;
      if (!viewEl) return;

      const [contacts, debts, tasks] = await Promise.all([
        LF.db.list('contacts', {}),
        LF.db.list('debts', {}),
        LF.db.list('tasks', {}),
      ]);

      const list = contacts.slice()
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ar'));

      const page = el('div', { class: 'page' });
      page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
        el('div', { class: 'grow' },
          el('h1', { text: t('nav.contacts') }),
          el('div', { class: 'page-sub', text: t('contacts.sub', { n: list.length }) })),
        el('button', {
          class: 'btn primary', onclick: () => LF.modals.contact(null, () => view.draw()),
        }, ic('plus', 16), t('contacts.new'))));

      if (!list.length) {
        page.appendChild(el('div', { class: 'card' },
          LF.ui.empty('users', t('contacts.empty'), t('contacts.emptyHint'),
            el('button', {
              class: 'btn primary',
              onclick: () => LF.modals.contact(null, () => view.draw()),
            }, ic('plus', 15), t('contacts.new')))));
      } else {
        const grid = el('div', { class: 'contact-grid' });
        list.forEach(c => {
          const debtCount = debts.filter(d => d.contactId === c.id).length;
          const taskCount = tasks.filter(x => x.contactId === c.id).length;
          const links = [];
          if (debtCount) links.push(t('contacts.nDebts', { n: debtCount }));
          if (taskCount) links.push(t('contacts.nTasks', { n: taskCount }));

          const card = el('div', {
            class: 'card card-pad contact-card', role: 'button', tabindex: '0',
          },
            el('div', { class: 'row', style: { gap: '10px', alignItems: 'center' } },
              LF.ui.avatar({ name: c.name, avatarColor: c.avatarColor }, 38),
              el('div', { class: 'grow', style: { minWidth: 0 } },
                el('div', { class: 'strong small truncate', text: c.name || '—' }),
                el('div', { class: 'xs faint' },
                  c.relation ? t('contacts.rel_' + c.relation) : '',
                  c.phone ? (c.relation ? ' · ' : '') + c.phone : ''))),
            links.length ? el('div', { class: 'meta', style: { marginTop: '8px' } },
              links.map(s => el('span', { class: 'mchip' }, ic('link', 11), s))) : null);
          card.addEventListener('click', () => { location.hash = '#/app/contacts/' + c.id; });
          grid.appendChild(card);
        });
        page.appendChild(grid);
      }

      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  /* ============================================================
     Detail page + timeline (#/app/contacts/<id>)
     ============================================================ */
  async function renderDetail(viewEl, id) {
    const t = LF.i18n.t;
    viewEl = await LF.shell.ensure();
    const c = await LF.db.get('contacts', id);
    if (!c) {
      viewEl.innerHTML = '';
      viewEl.appendChild(el('div', { class: 'page' },
        el('div', { class: 'card' }, LF.ui.empty('users', t('contacts.notFound'), ''))));
      return;
    }

    const [tasks, events, debts, payments, projects] = await Promise.all([
      LF.db.list('tasks', { predicate: x => x.contactId === id }),
      LF.db.list('events', { predicate: x => x.contactId === id }),
      LF.db.list('debts', { predicate: x => x.contactId === id }),
      LF.db.list('debtPayments', {}),
      LF.db.list('projects', { predicate: x => x.contactId === id }),
    ]);
    const today = LF.util.todayYmd();

    /* timeline entries: {date, icon, label, sub, hash?} */
    const entries = [];
    tasks.forEach(x => entries.push({
      date: x.date || x.createdAt || '', icon: 'list-checks',
      label: x.title, sub: t('contacts.linkedTask') +
        (x.status === 'done' ? ' · ' + t('tasks.st_done') : ''),
      hash: '#/app/tasks',
    }));
    events.forEach(x => entries.push({
      date: x.date || '', icon: 'calendar',
      label: x.title, sub: t('contacts.linkedEvent') + ' · ' + t('calendar.ev_' + (x.type || 'other')),
      hash: '#/app/calendar',
    }));
    debts.forEach(d => {
      const st = L().debtStatus(d, payments, today);
      entries.push({
        date: d.date || d.createdAt || '', icon: 'credit-card',
        label: (d.direction === 'owed' ? t('contacts.debtOwedToMe') : t('contacts.debtIOwe')) +
          ' · ' + LF.i18n.money(d.amount || 0),
        sub: t('debts.st_' + st.state) +
          (st.remaining > 0 ? ' · ' + t('debts.remaining', { amount: LF.i18n.money(st.remaining) }) : ''),
        hash: '#/app/debts',
      });
      /* payments inherit the contact through their debt */
      payments.filter(p => p.debtId === d.id).forEach(p => entries.push({
        date: p.date || '', icon: 'wallet',
        label: t('contacts.payment') + ' · ' + LF.i18n.money(p.amount || 0),
        sub: (d.direction === 'owed' ? t('contacts.receivedFrom') : t('contacts.paidTo')) +
          ' ' + (d.person || '') + (p.note ? ' · ' + p.note : ''),
        hash: '#/app/debts',
      }));
    });
    projects.forEach(p => entries.push({
      date: p.startDate || p.createdAt || '', icon: 'folder',
      label: p.name, sub: t('contacts.linkedProject') + ' · ' + t('projects.st_' + (p.status || 'active')),
      hash: '#/app/projects/' + p.id,
    }));
    entries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    /* page */
    const page = el('div', { class: 'page' });
    const back = el('button', {
      class: 'btn ghost sm', onclick: () => { location.hash = '#/app/contacts'; },
    });
    const bkIc = ic('chevron-right', 14); bkIc.classList.add('icon-flip-ltr'); back.appendChild(bkIc);
    back.appendChild(document.createTextNode(t('common.back')));

    page.appendChild(el('div', { class: 'row', style: { gap: '8px', marginBottom: '10px' } }, back));
    page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
      el('div', { class: 'row grow', style: { gap: '12px', alignItems: 'center', minWidth: 0 } },
        LF.ui.avatar({ name: c.name, avatarColor: c.avatarColor }, 52),
        el('div', { style: { minWidth: 0 } },
          el('h1', { text: c.name || '—' }),
          el('div', { class: 'page-sub' },
            [c.relation ? t('contacts.rel_' + c.relation) : '', c.phone, c.email]
              .filter(Boolean).join(' · ') || '—'))),
      el('div', { class: 'row', style: { gap: '8px' } },
        el('button', {
          class: 'btn primary', onclick: () => LF.modals.contact(c, () => renderDetail(viewEl, id)),
        }, ic('edit', 15), t('common.edit')))));

    /* quick facts */
    const owedToMe = debts.filter(d => d.direction === 'owed')
      .reduce((s, d) => s + Math.max(0, L().debtStatus(d, payments, today).remaining), 0);
    const iOwe = debts.filter(d => d.direction !== 'owed')
      .reduce((s, d) => s + Math.max(0, L().debtStatus(d, payments, today).remaining), 0);
    if (debts.length) {
      page.appendChild(el('div', { class: 'kpi-grid', style: { marginBottom: '14px' } },
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('contacts.owesMe') }),
          el('div', { class: 'kpi-value ' + (owedToMe > 0 ? 'pos' : ''), text: LF.i18n.money(owedToMe) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('contacts.iOwe') }),
          el('div', { class: 'kpi-value ' + (iOwe > 0 ? 'neg' : ''), text: LF.i18n.money(iOwe) }))));
    }

    /* notes */
    if (c.notes) {
      page.appendChild(el('div', { class: 'card card-pad section', style: { marginBottom: '14px' } },
        el('div', { class: 'strong small', style: { marginBottom: '6px' }, text: t('tasks.notes') }),
        el('div', { class: 'small muted', style: { whiteSpace: 'pre-wrap' }, text: c.notes })));
    }

    /* timeline */
    const tl = el('div', { class: 'card card-pad section' },
      el('div', { class: 'strong small', style: { marginBottom: '10px' }, text: t('contacts.timeline') }));
    if (!entries.length) {
      tl.appendChild(el('div', { class: 'muted small', text: t('contacts.timelineEmpty') }));
    } else {
      entries.forEach(e => {
        tl.appendChild(el('div', {
          class: 'row tl-item', role: e.hash ? 'button' : null,
          tabindex: e.hash ? '0' : null,
          style: { gap: '10px', alignItems: 'center' },
        },
          el('span', { class: 'icon-chip', style: { width: '30px', height: '30px', borderRadius: '9px', background: 'var(--accent-soft)', color: 'var(--accent-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' } }, ic(e.icon, 15)),
          el('div', { class: 'grow', style: { minWidth: 0 } },
            el('div', { class: 'small strong truncate', text: e.label }),
            el('div', { class: 'xs faint', text: e.sub })),
          e.date ? el('span', { class: 'xs muted num', style: { whiteSpace: 'nowrap' },
            text: LF.i18n.fmtDate(LF.util.fromYmd(e.date), 'medium') }) : null));
      });
    }
    page.appendChild(tl);

    viewEl.innerHTML = '';
    viewEl.appendChild(page);
  }

  /* ============================================================
     Contact modal
     ============================================================ */
  LF.modals.contact = async function contactModal(contactIn, onDone) {
    const t = LF.i18n.t;
    const isNew = !contactIn;
    const c = contactIn ? LF.util.clone(contactIn) : {
      name: '', phone: '', email: '', relation: '', notes: '', avatarColor: '',
    };

    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });
    const name = el('input', { class: 'input', maxlength: '60', value: c.name || '' });
    const phone = el('input', { class: 'input', type: 'tel', dir: 'ltr', maxlength: '24', value: c.phone || '' });
    const email = el('input', { class: 'input', type: 'email', dir: 'ltr', maxlength: '80', value: c.email || '' });
    const relation = el('select', { class: 'select' });
    relation.appendChild(optionEl(c.relation || '', '', 'contacts.noRelation', true));
    RELATIONS.forEach(r => relation.appendChild(optionEl(c.relation, r, 'contacts.rel_' + r, true)));
    const notes = el('textarea', { class: 'textarea', style: { minHeight: '56px' }, text: c.notes || '' });

    let m = null;
    m = LF.ui.modal({
      title: isNew ? t('contacts.new') : t('contacts.edit'),
      body: el('div', { class: 'col', style: { gap: '14px' } },
        LF.ui.field(t('contacts.name'), name),
        el('div', { class: 'form-grid' },
          LF.ui.field(t('contacts.phone'), phone, { hint: t('common.optional') }),
          LF.ui.field(t('contacts.email'), email, { hint: t('common.optional') })),
        LF.ui.field(t('contacts.relation'), relation),
        LF.ui.field(t('tasks.notes'), notes, { hint: t('common.optional') }),
        err),
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('contacts.deleteTitle'),
              message: t('contacts.deleteConfirm', { name: c.name }),
            });
            if (!okC) return;
            /* safe unlink: linked records keep working (contactId dangles harmlessly) */
            await LF.db.delete('contacts', contactIn.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            if (name.value.trim().length < 2) {
              err.textContent = t('contacts.errName');
              err.style.display = 'block';
              return;
            }
            if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
              err.textContent = t('contacts.errEmail');
              err.style.display = 'block';
              return;
            }
            await LF.db.put('contacts', {
              id: c.id, name: name.value.trim(),
              phone: phone.value.trim(), email: email.value.trim(),
              relation: relation.value, notes: notes.value.trim(),
              avatarColor: c.avatarColor || colorFor(name.value.trim()),
              createdAt: c.createdAt,
            });
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone(isNew ? 'new' : 'edit');
          },
        },
      ],
    });
    setTimeout(() => name.focus(), 30);
  };

  LF.views = LF.views || {};
  LF.views['app/contacts'] = async function (parts) {
    const viewEl = await LF.shell.ensure();
    if (parts && parts[0]) await renderDetail(viewEl, parts[0]);
    else await view.render();
  };
  LF.contactsView = view;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/shopping.js ===== */
/* ============================================================
   LifeFlow — Shopping / Grocery lists (المشتريات)
   Multiple lists (grocery / home / study / work / travel /
   custom). Items: name, qty, expected price, category,
   purchased, notes. Recording the ACTUAL price can create a
   real expense — only when the user chooses to (spec #14).
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  const LIST_TYPES = ['grocery', 'home', 'study', 'work', 'travel', 'custom'];
  const TYPE_ICON = {
    grocery: 'cart', home: 'home', study: 'book', work: 'briefcase',
    travel: 'plane', custom: 'tag',
  };

  function optionEl(sel, value, labelKeyOrText, isI18n) {
    const o = el('option', { value, selected: String(value) === String(sel) ? '' : null });
    o.textContent = isI18n ? LF.i18n.t(labelKeyOrText) : labelKeyOrText;
    return o;
  }

  function typeIcon(t) { return TYPE_ICON[t] || 'tag'; }

  /** seed the default grocery list on first open */
  async function ensureLists() {
    let lists = await LF.db.list('shoppingLists', {});
    if (!lists.length) {
      await LF.db.put('shoppingLists', {
        name: LF.i18n.t('shopping.type_grocery'), type: 'grocery',
      });
      lists = await LF.db.list('shoppingLists', {});
    }
    return lists.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  }

  /** find or create the home needs list (used by the Home view) */
  async function ensureHomeList() {
    const lists = await LF.db.list('shoppingLists', {});
    const home = lists.find(l => l.type === 'home');
    if (home) return home;
    const created = await LF.db.put('shoppingLists', {
      name: LF.i18n.t('shopping.type_home'), type: 'home',
    });
    return created;
  }

  /* ============================================================
     View
     ============================================================ */
  const view = {
    activeId: null,

    async render(viewEl) {
      viewEl = await LF.shell.ensure();
      view._viewEl = viewEl;
      await view.draw();
    },

    async draw() {
      const t = LF.i18n.t;
      const viewEl = view._viewEl;
      if (!viewEl) return;

      const [lists, items] = await Promise.all([
        ensureLists(),
        LF.db.list('shoppingItems', {}),
      ]);
      if (!view.activeId || !lists.some(l => l.id === view.activeId)) {
        view.activeId = lists.length ? lists[0].id : null;
      }
      const active = lists.find(l => l.id === view.activeId);
      const listItems = items
        .filter(i => i.listId === view.activeId)
        .sort((a, b) => {
          if (!!a.purchased !== !!b.purchased) return a.purchased ? 1 : -1;
          return (a.createdAt || '').localeCompare(b.createdAt || '');
        });
      const st = L().shoppingStats(listItems);

      /* page */
      const page = el('div', { class: 'page' });
      page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
        el('div', { class: 'grow' },
          el('h1', { text: t('nav.shopping') }),
          el('div', { class: 'page-sub', text: t('shopping.sub', { n: st.remaining }) })),
        el('button', {
          class: 'btn primary', onclick: () => LF.modals.shoppingItem(null, { listId: view.activeId }, () => view.draw()),
        }, ic('plus', 16), t('shopping.addItem'))));

      /* list tabs */
      const chips = el('div', { class: 'row wrap', style: { gap: '6px', marginBottom: '14px' } });
      lists.forEach(l => {
        const remaining = items.filter(i => i.listId === l.id && !i.purchased).length;
        const c = el('button', {
          class: 'chip' + (l.id === view.activeId ? ' on' : ''),
          'aria-pressed': l.id === view.activeId ? 'true' : 'false',
        }, ic(typeIcon(l.type), 13), l.name,
          remaining ? el('span', { class: 'chip-count num', text: String(remaining) }) : null);
        c.addEventListener('click', () => { view.activeId = l.id; view.draw(); });
        chips.appendChild(c);
      });
      const addListBtn = el('button', {
        class: 'chip', title: t('shopping.newList'),
        'aria-label': t('shopping.newList'),
      }, ic('plus', 13));
      addListBtn.addEventListener('click', () => LF.modals.shoppingList(null, () => view.draw()));
      chips.appendChild(addListBtn);
      page.appendChild(chips);

      /* active list card */
      if (!active) {
        page.appendChild(el('div', { class: 'card' },
          LF.ui.empty('cart', t('shopping.noLists'), t('shopping.emptyHint'),
            el('button', {
              class: 'btn primary',
              onclick: () => LF.modals.shoppingList(null, () => view.draw()),
            }, ic('plus', 15), t('shopping.newList')))));
      } else {
        page.appendChild(listCard(active, listItems, st));
      }

      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  function listCard(list, items, st) {
    const t = LF.i18n.t;
    const card = el('div', { class: 'card card-pad' });

    /* list head: name + actions */
    const renameBtn = el('button', {
      class: 'icon-btn sm', 'aria-label': t('shopping.renameList'), title: t('shopping.renameList'),
      onclick: () => LF.modals.shoppingList(list, () => view.draw()),
    }, ic('edit', 14));
    const delBtn = el('button', {
      class: 'icon-btn sm danger', 'aria-label': t('common.del'), title: t('common.del'),
      onclick: async () => {
        const okC = await LF.ui.confirm({
          title: t('shopping.deleteList'),
          message: t('shopping.deleteListConfirm', { name: list.name }),
        });
        if (!okC) return;
        const its = await LF.db.list('shoppingItems', { predicate: i => i.listId === list.id });
        for (const i of its) await LF.db.delete('shoppingItems', i.id);
        await LF.db.delete('shoppingLists', list.id);
        if (view.activeId === list.id) view.activeId = null;
        LF.ui.toast(t('common.saved'), { type: 'ok' });
        view.draw();
      },
    }, ic('trash', 14));
    const clearBtn = st.purchased ? el('button', {
      class: 'btn ghost sm', onclick: async () => {
        const okC = await LF.ui.confirm({
          title: t('shopping.clearPurchased'),
          message: t('shopping.clearPurchasedConfirm', { n: st.purchased }),
          danger: false,
        });
        if (!okC) return;
        const done = items.filter(i => i.purchased);
        for (const i of done) await LF.db.delete('shoppingItems', i.id);
        LF.ui.toast(t('common.saved'), { type: 'ok' });
        view.draw();
      },
    }, ic('trash', 13), t('shopping.clearPurchased')) : null;

    card.appendChild(el('div', { class: 'row between', style: { gap: '8px', marginBottom: '12px' } },
      el('div', { class: 'row', style: { gap: '8px', alignItems: 'center', minWidth: 0 } },
        el('span', { class: 'icon-chip', style: { width: '32px', height: '32px', borderRadius: '9px', background: 'var(--accent-soft)', color: 'var(--accent-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' } }, ic(typeIcon(list.type), 16)),
        el('strong', { class: 'truncate', text: list.name })),
      el('div', { class: 'row', style: { gap: '4px' } }, clearBtn, renameBtn, delBtn)));

    /* inline quick add */
    const quick = el('input', {
      class: 'input', placeholder: t('shopping.addItem'), 'aria-label': t('shopping.addItem'),
      style: { marginBottom: '10px' },
    });
    quick.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter') return;
      const name = quick.value.trim();
      if (name.length < 1) return;
      await LF.db.put('shoppingItems', {
        listId: list.id, name, qty: '', expectedPrice: null,
        categoryId: '', purchased: false, notes: '',
      });
      quick.value = '';
      view.draw();
    });
    card.appendChild(quick);

    /* items */
    if (!items.length) {
      card.appendChild(LF.ui.empty('cart', t('shopping.empty'), t('shopping.emptyHint')));
    } else {
      const wrap = el('div', { class: 'col', style: { gap: '6px' } });
      items.forEach(i => wrap.appendChild(itemRow(i)));
      card.appendChild(wrap);
    }

    /* footer stats */
    card.appendChild(el('div', {
      class: 'row wrap between small muted',
      style: { marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)', gap: '8px' },
    },
      el('span', { text: t('shopping.statsLine', {
        total: LF.i18n.num(st.count), purchased: LF.i18n.num(st.purchased),
      }) }),
      el('span', { class: 'num', text: t('shopping.expectedTotal') + ': ' + LF.i18n.money(st.expected) })));

    return card;
  }

  function itemRow(item) {
    const t = LF.i18n.t;

    const cb = el('button', {
      class: 'cbox', role: 'checkbox',
      'aria-checked': item.purchased ? 'true' : 'false',
      'aria-label': t('shopping.markPurchased'),
    }, ic('check', 13));
    cb.addEventListener('click', async (e) => {
      e.stopPropagation();
      item.purchased = !item.purchased;
      if (!item.purchased) item.actualPrice = null;
      await LF.db.put('shoppingItems', item);
      view.draw();
    });

    const meta = el('div', { class: 'meta' });
    if (item.qty) meta.appendChild(el('span', { class: 'mchip num', text: item.qty }));
    if (item.categoryLabel) meta.appendChild(el('span', { class: 'mchip', text: item.categoryLabel }));
    if (item.notes) meta.appendChild(el('span', { class: 'mchip' }, ic('info', 11), t('expenses.hasNote')));

    const priceCol = el('div', { class: 'col', style: { alignItems: 'flex-end', gap: '2px' } });
    if (item.expectedPrice != null) {
      priceCol.appendChild(el('span', { class: 'small num', text: LF.i18n.money(item.expectedPrice) }));
    }
    if (item.purchased && item.actualPrice != null) {
      priceCol.appendChild(el('span', { class: 'xs num pos', text: LF.i18n.money(item.actualPrice) }));
    }

    const row = el('div', { class: 'task-row' + (item.purchased ? ' done' : ''), role: 'button', tabindex: '0' },
      cb,
      el('div', { class: 'grow', style: { minWidth: 0 } },
        el('div', { class: 'task-title strong small truncate', text: item.name }),
        meta),
      priceCol,
      item.purchased && item.actualPrice == null
        ? el('button', {
            class: 'btn ghost sm', title: t('shopping.recordActual'), 'aria-label': t('shopping.recordActual'),
            onclick: (e) => { e.stopPropagation(); LF.modals.purchase(item, () => view.draw()); },
          }, ic('wallet', 13))
        : null);
    row.addEventListener('click', () => LF.modals.shoppingItem(item, {}, () => view.draw()));
    return row;
  }

  /* ============================================================
     Item modal — add / edit  (prefill: {listId})
     ============================================================ */
  LF.modals.shoppingItem = async function shoppingItemModal(itemIn, prefill, onDone) {
    const t = LF.i18n.t;
    const isNew = !itemIn;
    const it = itemIn ? LF.util.clone(itemIn) : {
      name: '', qty: '', expectedPrice: null, categoryId: '',
      listId: (prefill && prefill.listId) || '', purchased: false, notes: '',
    };
    const [lists, cats] = await Promise.all([
      LF.db.list('shoppingLists', {}),
      LF.db.list('expenseCategories', {}),
    ]);
    const cur = (LF.store.settings && LF.store.settings.currency) || 'YER';
    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });

    const name = el('input', { class: 'input', maxlength: '80', value: it.name || '' });
    const qty = el('input', { class: 'input', maxlength: '24', value: it.qty || '', placeholder: t('shopping.qtyPh') });
    const expected = el('input', {
      class: 'input num', type: 'text', inputMode: 'decimal', dir: 'ltr',
      value: it.expectedPrice != null ? fmtForInput(it.expectedPrice, cur) : '',
      placeholder: '0' + (LF.money.decimals(cur) ? '.00' : ''),
      style: { maxWidth: '150px' },
    });
    const cat = el('select', { class: 'select' });
    cat.appendChild(optionEl(it.categoryId || '', '', 'expenses.allCats', true));
    cats.filter(c => !c.hidden).forEach(c =>
      cat.appendChild(optionEl(it.categoryId, c.id,
        c.name || LF.i18n.t('expenses.cat_' + (c.key || 'other')), false)));
    const listSel = el('select', { class: 'select' });
    lists.forEach(l => listSel.appendChild(optionEl(it.listId, l.id, l.name, false)));
    if (!it.listId && lists.length) {
      /* default to current view list */
      const curList = lists.find(l => l.id === (LF.shoppingView && LF.shoppingView.activeId)) || lists[0];
      listSel.value = curList.id;
    }
    const notes = el('textarea', { class: 'textarea', style: { minHeight: '48px' }, text: it.notes || '' });

    let m = null;
    m = LF.ui.modal({
      title: isNew ? t('shopping.addItem') : t('shopping.editItem'),
      body: el('div', { class: 'col', style: { gap: '14px' } },
        LF.ui.field(t('shopping.name'), name),
        el('div', { class: 'form-grid' },
          LF.ui.field(t('shopping.qty'), qty, { hint: t('common.optional') }),
          LF.ui.field(t('shopping.expected') + ' (' + cur + ')', expected, { hint: t('common.optional') })),
        el('div', { class: 'form-grid' },
          LF.ui.field(t('expenses.category'), cat),
          LF.ui.field(t('shopping.list'), listSel)),
        LF.ui.field(t('tasks.notes'), notes, { hint: t('common.optional') }),
        err),
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('shopping.deleteItem'),
              message: t('shopping.deleteItemConfirm', { name: it.name }),
            });
            if (!okC) return;
            await LF.db.delete('shoppingItems', it.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            const nameV = name.value.trim();
            if (nameV.length < 1) {
              err.textContent = t('shopping.errName'); err.style.display = 'block'; return;
            }
            let price = null;
            if (expected.value.trim() !== '') {
              const parsed = LF.money.parse(expected.value, LF.money.decimals(cur));
              if (!parsed.ok) {
                err.textContent = LF.i18n.t('expenses.errAmount'); err.style.display = 'block'; return;
              }
              price = parsed.value;
            }
            const catRec = cats.find(c => c.id === cat.value);
            await LF.db.put('shoppingItems', {
              id: it.id, listId: listSel.value, name: nameV,
              qty: qty.value.trim(), expectedPrice: price,
              categoryId: cat.value || '',
              categoryLabel: catRec ? (catRec.name || LF.i18n.t('expenses.cat_' + (catRec.key || 'other'))) : '',
              purchased: it.purchased || false,
              actualPrice: it.actualPrice != null ? it.actualPrice : null,
              notes: notes.value.trim(),
              createdAt: it.createdAt,
            });
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone(isNew ? 'new' : 'edit');
          },
        },
      ],
    });
    setTimeout(() => name.focus(), 30);
  };

  /* ============================================================
     Purchase modal — actual price + optional expense (spec #14)
     ============================================================ */
  LF.modals.purchase = async function purchaseModal(itemIn, onDone) {
    const t = LF.i18n.t;
    const item = LF.util.clone(itemIn);
    const cats = (await LF.db.list('expenseCategories', {})).filter(c => !c.hidden);
    const cur = (LF.store.settings && LF.store.settings.currency) || 'YER';
    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });

    const actual = el('input', {
      class: 'input num', type: 'text', inputMode: 'decimal', dir: 'ltr',
      value: item.expectedPrice != null ? fmtForInput(item.expectedPrice, cur) : '',
      placeholder: '0' + (LF.money.decimals(cur) ? '.00' : ''),
      style: { maxWidth: '160px' },
    });
    const date = el('input', { class: 'input', type: 'date', value: LF.util.todayYmd() });
    const cat = el('select', { class: 'select' });
    const itemCat = cats.find(c => c.id === item.categoryId);
    cats.forEach(c =>
      cat.appendChild(optionEl(itemCat ? itemCat.id : (cats[0] || {}).id, c.id,
        c.name || LF.i18n.t('expenses.cat_' + (c.key || 'other')), false)));
    const addExpense = LF.ui.switchEl(true, v => { addExpense._v = v; }, t('shopping.addExpense'));
    addExpense._v = true;

    const lists = await LF.db.list('shoppingLists', { predicate: l => l.id === item.listId });
    const listName = lists.length ? lists[0].name : '';

    let m = null;
    m = LF.ui.modal({
      title: t('shopping.recordActual'),
      body: el('div', { class: 'col', style: { gap: '14px' } },
        el('div', { class: 'small muted', text: item.name }),
        el('div', { class: 'form-grid' },
          LF.ui.field(t('shopping.actual') + ' (' + cur + ')', actual),
          LF.ui.field(t('shopping.purchasedOn'), date)),
        LF.ui.field(t('expenses.category'), cat),
        el('div', { class: 'row between', style: { padding: '6px 0' } },
          el('div', {},
            el('div', { class: 'strong small', text: t('shopping.addExpense') }),
            el('div', { class: 'xs faint', text: t('shopping.addExpenseHint') })),
          addExpense),
        err),
      actions: [
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            let price = null;
            if (actual.value.trim() !== '') {
              const parsed = LF.money.parse(actual.value, LF.money.decimals(cur));
              if (!parsed.ok) {
                err.textContent = LF.i18n.t('expenses.errAmount'); err.style.display = 'block'; return;
              }
              price = parsed.value;
            }
            item.purchased = true;
            item.actualPrice = price;
            await LF.db.put('shoppingItems', item);
            /* optional expense link (user choice) */
            if (addExpense._v && price != null && price > 0) {
              const catRec = cats.find(c => c.id === cat.value);
              await LF.db.put('expenses', {
                title: item.name, amount: price,
                categoryId: cat.value || '',
                categoryLabel: catRec ? (catRec.name || LF.i18n.t('expenses.cat_' + (catRec.key || 'other'))) : '',
                date: date.value || LF.util.todayYmd(), time: '',
                method: 'cash', entity: '',
                workspaceId: '',
                notes: listName ? t('shopping.expenseNote', { list: listName }) : '',
              });
            }
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('purchase');
          },
        },
      ],
    });
  };

  /* ============================================================
     List modal — create / rename
     ============================================================ */
  LF.modals.shoppingList = async function shoppingListModal(listIn, onDone) {
    const t = LF.i18n.t;
    const isNew = !listIn;
    const l = listIn ? LF.util.clone(listIn) : { name: '', type: 'custom' };

    const name = el('input', { class: 'input', maxlength: '40', value: l.name || '' });
    const type = el('select', { class: 'select' });
    LIST_TYPES.forEach(tp =>
      type.appendChild(optionEl(l.type, tp, 'shopping.type_' + tp, true)));

    let m = null;
    m = LF.ui.modal({
      title: isNew ? t('shopping.newList') : t('shopping.renameList'),
      body: el('div', { class: 'col', style: { gap: '14px' } },
        LF.ui.field(t('shopping.listName'), name),
        isNew ? LF.ui.field(t('shopping.listType'), type) : null),
      actions: [
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            const nameV = name.value.trim();
            if (nameV.length < 2) { LF.ui.toast(t('shopping.errListName'), { type: 'error' }); return; }
            await LF.db.put('shoppingLists', {
              id: l.id, name: nameV, type: isNew ? type.value : (l.type || 'custom'),
              createdAt: l.createdAt,
            });
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone(isNew ? 'new' : 'edit');
          },
        },
      ],
    });
    setTimeout(() => name.focus(), 30);
  };

  /** minor units → plain decimal string for the amount input */
  function fmtForInput(minor, cur) {
    const dec = LF.money.decimals(cur);
    const sign = minor < 0 ? '-' : '';
    const abs = Math.abs(minor | 0);
    if (!dec) return sign + String(abs);
    const base = String(abs).padStart(dec + 1, '0');
    return sign + base.slice(0, -dec) + '.' + base.slice(-dec);
  }

  LF.views = LF.views || {};
  LF.views['app/shopping'] = async function () { await view.render(); };
  LF.shoppingView = view;
  LF.shoppingHelpers = { ensureLists, ensureHomeList };
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/home.js ===== */
/* ============================================================
   LifeFlow — Home management (إدارة المنزل)
   Optional (toggleable) feature. Cleaning / cooking / laundry /
   maintenance / bills recurring tasks ("تنظيف المطبخ — كل يوم"),
   home appointments (events of type 'home'), and a needs list
   (a home shopping list). For ANYONE managing a home (spec #15).
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  const AREAS = ['cleaning', 'cooking', 'laundry', 'maintenance', 'bills', 'other'];
  const AREA_ICON = {
    cleaning: 'sparkles', cooking: 'clock', laundry: 'refresh',
    maintenance: 'settings', bills: 'wallet', other: 'list-checks',
  };

  function optionEl(sel, value, labelKeyOrText, isI18n) {
    const o = el('option', { value, selected: String(value) === String(sel) ? '' : null });
    o.textContent = isI18n ? LF.i18n.t(labelKeyOrText) : labelKeyOrText;
    return o;
  }

  /* ============================================================
     View
     ============================================================ */
  const view = {
    area: 'all',
    status: 'active',   // active | done | all

    async render(viewEl) {
      viewEl = await LF.shell.ensure();
      view._viewEl = viewEl;
      await view.draw();
    },

    async draw() {
      const t = LF.i18n.t;
      const viewEl = view._viewEl;
      if (!viewEl) return;
      if (LF.store.feature && !LF.store.feature('home')) {
        viewEl.innerHTML = '';
        viewEl.appendChild(el('div', { class: 'page' },
          el('div', { class: 'card' },
            LF.ui.empty('home', t('home.disabled'), t('home.disabledHint')))));
        return;
      }

      const [tasks, events] = await Promise.all([
        LF.db.list('homeTasks', {}),
        LF.db.list('events', { predicate: e => e.type === 'home' }),
      ]);
      const today = LF.util.todayYmd();

      const active = tasks.filter(x => x.status !== 'done' && x.status !== 'cancelled');
      const todayTasks = active.filter(x => x.date === today);
      const overdue = active.filter(x => x.date && x.date < today);
      const doneToday = tasks.filter(x => x.status === 'done' &&
        (x.completedAt || '').slice(0, 10) === today).length;

      /* filtered list */
      let list = tasks;
      if (view.status === 'active') list = list.filter(x => x.status !== 'done' && x.status !== 'cancelled');
      else if (view.status === 'done') list = list.filter(x => x.status === 'done');
      if (view.area !== 'all') list = list.filter(x => (x.area || 'other') === view.area);
      list = list.slice().sort((a, b) =>
        ((a.date || '9999') + (a.time || '')) .localeCompare((b.date || '9999') + (b.time || '')));

      /* page */
      const page = el('div', { class: 'page' });
      page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
        el('div', { class: 'grow' },
          el('h1', { text: t('nav.home') }),
          el('div', { class: 'page-sub', text: t('home.sub', { n: list.length }) })),
        el('div', { class: 'row', style: { gap: '8px' } },
          el('button', {
            class: 'btn ghost', onclick: async () => {
              const homeList = await LF.shoppingHelpers.ensureHomeList();
              LF.router.go('#/app/shopping');
              LF.shoppingView.activeId = homeList.id;
              LF.shoppingView.draw();
            },
          }, ic('cart', 15), t('home.needsList')),
          el('button', {
            class: 'btn primary', onclick: () => LF.modals.homeTask(null, () => view.draw()),
          }, ic('plus', 16), t('home.new')))));

      /* KPIs */
      page.appendChild(el('div', { class: 'kpi-grid', style: { marginBottom: '14px' } },
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('home.kToday') }),
          el('div', { class: 'kpi-value', text: LF.i18n.num(todayTasks.length) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('home.kOverdue') }),
          el('div', { class: 'kpi-value ' + (overdue.length ? 'neg' : ''), text: LF.i18n.num(overdue.length) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('home.kDoneToday') }),
          el('div', { class: 'kpi-value pos', text: LF.i18n.num(doneToday) }))));

      /* area chips + status seg */
      const chips = el('div', { class: 'row wrap', style: { gap: '6px' } });
      [['all', null]].concat(AREAS.map(a => [a, AREA_ICON[a]])).forEach(([id, icon]) => {
        const c = el('button', {
          class: 'chip' + (view.area === id ? ' on' : ''),
          'aria-pressed': view.area === id ? 'true' : 'false',
          text: t(id === 'all' ? 'home.allAreas' : 'home.a_' + id),
        }, icon ? ic(icon, 12) : null);
        c.addEventListener('click', () => { view.area = id; view.draw(); });
        chips.appendChild(c);
      });
      const statusSeg = LF.ui.seg([
        { value: 'active', label: t('tasks.fActive') },
        { value: 'done', label: t('tasks.fDone') },
        { value: 'all', label: t('tasks.fAll') },
      ], view.status, v => { view.status = v; view.draw(); });
      page.appendChild(el('div', { class: 'card card-pad', style: { marginBottom: '14px' } },
        el('div', { class: 'row wrap between', style: { gap: '10px' } }, chips, statusSeg)));

      /* list */
      if (!list.length) {
        page.appendChild(el('div', { class: 'card' },
          LF.ui.empty('home', t('home.empty'), t('home.emptyHint'),
            el('button', {
              class: 'btn primary',
              onclick: () => LF.modals.homeTask(null, () => view.draw()),
            }, ic('plus', 15), t('home.new')))));
      } else {
        const wrap = el('div', { class: 'col', style: { gap: '8px' } });
        list.forEach(task => wrap.appendChild(taskRow(task, today)));
        page.appendChild(wrap);
      }

      /* today's home appointments (events type=home) */
      const upcoming = events
        .filter(e => e.date >= today)
        .sort((a, b) => (a.date + (a.startTime || '')).localeCompare(b.date + (b.startTime || '')))
        .slice(0, 5);
      const evCard = el('div', { class: 'card card-pad section' },
        el('div', { class: 'strong small', style: { marginBottom: '10px' }, text: t('home.upcomingEvents') }));
      if (!upcoming.length) {
        evCard.appendChild(el('div', { class: 'muted small', text: t('home.noEvents') }));
      } else {
        upcoming.forEach(e => {
          evCard.appendChild(el('div', {
            class: 'row', role: 'button', tabindex: '0',
            style: { gap: '10px', alignItems: 'center', padding: '6px 0', cursor: 'pointer' },
            onclick: () => LF.router.go('#/app/calendar'),
          },
            ic('calendar', 15),
            el('div', { class: 'grow', style: { minWidth: 0 } },
              el('div', { class: 'small strong truncate', text: e.title }),
              el('div', { class: 'xs faint', text: LF.i18n.fmtDate(LF.util.fromYmd(e.date), 'medium') +
                (e.startTime ? ' · ' + e.startTime : '') }))));
        });
      }
      page.appendChild(evCard);

      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  function taskRow(task, today) {
    const t = LF.i18n.t;
    const done = task.status === 'done';
    const overdue = !done && task.date && task.date < today;

    const cb = el('button', {
      class: 'cbox', role: 'checkbox',
      'aria-checked': done ? 'true' : 'false',
      'aria-label': t('tasks.markDone'),
    }, ic('check', 13));
    cb.addEventListener('click', async (e) => {
      e.stopPropagation();
      await toggleDone(task);
      view.draw();
    });

    const meta = el('div', { class: 'meta' });
    meta.appendChild(el('span', { class: 'mchip' },
      ic(AREA_ICON[task.area] || 'list-checks', 11), t('home.a_' + (task.area || 'other'))));
    if (task.date) {
      meta.appendChild(el('span', {
        class: 'mchip' + (overdue ? ' danger' : ''),
        text: (overdue ? t('tasks.overdueChip') + ' · ' : '') +
          LF.i18n.fmtDate(LF.util.fromYmd(task.date), 'medium') +
          (task.time ? ' · ' + task.time : ''),
      }));
    } else {
      meta.appendChild(el('span', { class: 'mchip', text: t('tasks.noDate') }));
    }
    if (task.recurrence && task.recurrence.type !== 'none') {
      meta.appendChild(el('span', { class: 'mchip' }, ic('refresh', 11), t('tasks.rec_' + task.recurrence.type)));
    }

    const row = el('div', { class: 'task-row' + (done ? ' done' : '') + (overdue ? ' overdue' : ''), role: 'button', tabindex: '0' },
      cb,
      el('div', { class: 'grow', style: { minWidth: 0 } },
        el('div', { class: 'task-title strong small truncate', text: task.title || '' }),
        meta));
    row.addEventListener('click', () => LF.modals.homeTask(task, () => view.draw()));
    return row;
  }

  /** complete → spawn next occurrence for recurring home tasks */
  async function toggleDone(task) {
    if (task.status === 'done') {
      task.status = 'todo';
      task.completedAt = null;
      await LF.db.put('homeTasks', task);
      return;
    }
    task.status = 'done';
    task.completedAt = new Date().toISOString();
    await LF.db.put('homeTasks', task);
    const next = L().spawnNext(task);
    if (next) {
      await LF.db.put('homeTasks', next);
      LF.ui.toast(LF.i18n.t('tasks.recNextCreated', {
        date: LF.i18n.fmtDate(LF.util.fromYmd(next.date), 'medium'),
      }), { type: 'ok' });
    }
  }

  /* ============================================================
     Home task modal
     ============================================================ */
  LF.modals.homeTask = async function homeTaskModal(taskIn, onDone) {
    const t = LF.i18n.t;
    const isNew = !taskIn;
    const task = taskIn ? LF.util.clone(taskIn) : {
      title: '', area: 'cleaning', date: LF.util.todayYmd(), time: '',
      recurrence: { type: 'none', every: 1, until: null }, notes: '',
    };
    if (!task.recurrence) task.recurrence = { type: 'none', every: 1, until: null };

    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });
    const title = el('input', { class: 'input', maxlength: '120', value: task.title || '' });
    const area = el('select', { class: 'select' });
    AREAS.forEach(a => area.appendChild(optionEl(task.area, a, 'home.a_' + a, true)));
    const date = el('input', { class: 'input', type: 'date', value: task.date || '' });
    const time = el('input', { class: 'input', type: 'time', value: task.time || '' });
    const notes = el('textarea', { class: 'textarea', style: { minHeight: '52px' }, text: task.notes || '' });

    const recType = el('select', { class: 'select' });
    ['none', 'daily', 'weekly', 'monthly', 'yearly'].forEach(r =>
      recType.appendChild(optionEl(task.recurrence.type, r, 'tasks.rec_' + r, true)));
    const recEvery = el('input', { class: 'input', type: 'number', min: '1', max: '365', value: task.recurrence.every || 1, style: { width: '90px' } });
    const recUntil = el('input', { class: 'input', type: 'date', value: task.recurrence.until || '' });
    const recExtra = el('div', { class: 'row', style: { gap: '10px', marginTop: '8px', display: recType.value === 'none' ? 'none' : 'flex' } },
      LF.ui.field(t('tasks.recEvery'), recEvery),
      LF.ui.field(t('tasks.recUntil'), recUntil, { hint: t('common.optional') }));
    recType.addEventListener('change', () => {
      recExtra.style.display = recType.value === 'none' ? 'none' : 'flex';
    });

    let m = null;
    m = LF.ui.modal({
      title: isNew ? t('home.new') : t('home.edit'),
      body: el('div', { class: 'col', style: { gap: '14px' } },
        LF.ui.field(t('tasks.title'), title),
        el('div', { class: 'form-grid' },
          LF.ui.field(t('home.area'), area),
          LF.ui.field(t('expenses.date'), date),
          LF.ui.field(t('expenses.time'), time, { hint: t('common.optional') })),
        LF.ui.field(t('tasks.recurrence'), recType),
        recExtra,
        LF.ui.field(t('tasks.notes'), notes, { hint: t('common.optional') }),
        el('div', { class: 'banner info' }, ic('info', 15),
          el('div', { class: 'grow small', text: t('home.recHint') })),
        err),
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('home.deleteTitle'),
              message: t('home.deleteConfirm', { title: taskIn.title }),
            });
            if (!okC) return;
            await LF.db.delete('homeTasks', taskIn.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            const titleV = title.value.trim();
            if (titleV.length < 2) { err.textContent = t('tasks.errTitle'); err.style.display = 'block'; return; }
            if (!L().validTime(time.value)) { err.textContent = t('tasks.errTime'); err.style.display = 'block'; return; }
            if (time.value && !date.value) { err.textContent = t('tasks.errTimeNeedsDate'); err.style.display = 'block'; return; }
            await LF.db.put('homeTasks', {
              id: task.id, title: titleV, area: area.value,
              date: date.value || null, time: time.value || null,
              recurrence: {
                type: recType.value,
                every: Math.max(1, +recEvery.value || 1),
                until: recUntil.value || null,
              },
              notes: notes.value.trim(),
              status: task.status || 'todo',
              completedAt: task.completedAt || null,
              createdAt: task.createdAt,
            });
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone(isNew ? 'new' : 'edit');
          },
        },
      ],
    });
    setTimeout(() => title.focus(), 30);
  };

  LF.views = LF.views || {};
  LF.views['app/home'] = async function () { await view.render(); };
  LF.homeView = view;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/study.js ===== */
/* ============================================================
   LifeFlow — Study view (الدراسة) — optional feature
   Subjects (name/teacher/schedule/room/notes), exams with
   countdown, assignments (due/status/priority), study sessions
   (subject/minutes/date/notes) + study hours & productivity.
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  function optionEl(sel, value, labelKeyOrText, isI18n) {
    const o = el('option', { value, selected: String(value) === String(sel) ? '' : null });
    o.textContent = isI18n ? LF.i18n.t(labelKeyOrText) : labelKeyOrText;
    return o;
  }

  async function loadSubjects() {
    return (await LF.db.list('subjects', {}))
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ar'));
  }
  function subjName(subjects, id) {
    const s = subjects.find(x => x.id === id);
    return s ? s.name : '';
  }

  /** "3 س 25 د" from minutes (localized) */
  function fmtMinutes(min) {
    const t = LF.i18n.t;
    const h = Math.floor(min / 60), m = min % 60;
    if (h && m) return LF.i18n.num(h) + ' ' + t('study.hourShort') + ' ' + LF.i18n.num(m) + ' ' + t('study.minShort');
    if (h) return LF.i18n.num(h) + ' ' + t('study.hourShort');
    return LF.i18n.num(m) + ' ' + t('study.minShort');
  }

  /** days-until chip label */
  function countdown(dateStr, today) {
    const t = LF.i18n.t;
    const d = Math.round((LF.util.fromYmd(dateStr) - LF.util.fromYmd(today)) / 86400000);
    if (d < 0) return { text: t('study.pastDays', { n: -d }), cls: 'mchip' };
    if (d === 0) return { text: t('study.today'), cls: 'mchip danger' };
    if (d === 1) return { text: t('study.tomorrow'), cls: 'mchip danger' };
    if (d <= 7) return { text: t('study.inDays', { n: d }), cls: 'mchip danger' };
    return { text: t('study.inDays', { n: d }), cls: 'mchip' };
  }

  /* ============================================================
     View
     ============================================================ */
  const view = {
    tab: 'overview',   // overview | subjects | assignments | sessions
    asgFilter: 'open',

    async render(viewEl) {
      viewEl = await LF.shell.ensure();
      view._viewEl = viewEl;
      await view.draw();
    },

    async draw() {
      const t = LF.i18n.t;
      const viewEl = view._viewEl;
      if (!viewEl) return;
      if (LF.store.feature && !LF.store.feature('study')) {
        viewEl.innerHTML = '';
        viewEl.appendChild(el('div', { class: 'page' },
          el('div', { class: 'card' },
            LF.ui.empty('book', t('study.disabled'), t('study.disabledHint')))));
        return;
      }

      const [subjects, exams, assignments, sessions] = await Promise.all([
        loadSubjects(), LF.db.list('exams', {}),
        LF.db.list('assignments', {}), LF.db.list('studySessions', {}),
      ]);
      const today = LF.util.todayYmd();
      const weekAgo = LF.util.ymd(LF.util.addDays(LF.util.fromYmd(today), -6));
      const weekMin = L().sumMinutes(sessions, weekAgo, today);
      const aSt = L().assignmentStats(assignments, today);
      const nx = L().nextExam(exams, today);

      /* page */
      const page = el('div', { class: 'page' });
      page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
        el('div', { class: 'grow' },
          el('h1', { text: t('nav.study') }),
          el('div', { class: 'page-sub', text: t('study.sub', { n: subjects.length }) })),
        el('div', { class: 'row', style: { gap: '8px' } },
          el('button', {
            class: 'btn ghost', onclick: () => LF.modals.studySession(null, {}, () => view.draw()),
          }, ic('clock', 15), t('study.logSession')),
          el('button', {
            class: 'btn primary', onclick: () => LF.modals.subject(null, () => view.draw()),
          }, ic('plus', 16), t('study.newSubject')))));

      /* KPIs */
      page.appendChild(el('div', { class: 'kpi-grid', style: { marginBottom: '14px' } },
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('study.kHours') }),
          el('div', { class: 'kpi-value', text: fmtMinutes(weekMin) }),
          el('div', { class: 'kpi-sub', text: t('study.kHoursSub') })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('study.kAssignments') }),
          el('div', { class: 'kpi-value ' + (aSt.open ? '' : 'pos'), text: LF.i18n.num(aSt.open) }),
          aSt.overdue ? el('div', { class: 'kpi-sub neg', text: t('study.kOverdue', { n: aSt.overdue }) }) : null),
        nx ? el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('study.kNextExam') }),
          el('div', { class: 'kpi-value', style: { fontSize: 'var(--fs-l)' }, text: subjName(subjects, nx.exam.subjectId) || nx.exam.title || '—' }),
          el('div', { class: 'kpi-sub', text: LF.i18n.fmtDate(LF.util.fromYmd(nx.exam.date), 'medium') +
            ' · ' + (nx.daysUntil === 0 ? t('study.today') : t('study.inDays', { n: nx.daysUntil })) }))
          : el('div', { class: 'kpi' },
            el('div', { class: 'kpi-label', text: t('study.kNextExam') }),
            el('div', { class: 'kpi-value', style: { fontSize: 'var(--fs-l)' }, text: '—' }))));

      /* tabs */
      const tabs = LF.ui.seg([
        { value: 'overview', label: t('study.tOverview') },
        { value: 'assignments', label: t('study.tAssignments') + ' (' + LF.i18n.num(aSt.open) + ')' },
        { value: 'subjects', label: t('study.tSubjects') },
        { value: 'sessions', label: t('study.tSessions') },
      ], view.tab, v => { view.tab = v; view.draw(); });
      page.appendChild(el('div', { style: { marginBottom: '14px' } }, tabs));

      /* ----- tab: overview (exams + recent sessions) ----- */
      if (view.tab === 'overview') {
        const upcoming = exams.filter(e => e.date >= today)
          .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
        const examCard = el('div', { class: 'card card-pad section' },
          el('div', { class: 'row between', style: { marginBottom: '10px' } },
            el('div', { class: 'strong small', text: t('study.upcomingExams') }),
            el('button', {
              class: 'btn soft sm', onclick: () => LF.modals.exam(null, {}, () => view.draw()),
            }, ic('plus', 13), t('study.newExam'))));
        if (!upcoming.length) {
          examCard.appendChild(el('div', { class: 'muted small', text: t('study.noExams') }));
        } else {
          upcoming.forEach(e => {
            const cd = countdown(e.date, today);
            const row = el('div', { class: 'task-row', role: 'button', tabindex: '0' },
              el('div', { class: 'grow', style: { minWidth: 0 } },
                el('div', { class: 'task-title strong small truncate',
                  text: subjName(subjects, e.subjectId) || e.title || '—' }),
                el('div', { class: 'meta' },
                  el('span', { class: 'mchip' }, ic('calendar', 11),
                    LF.i18n.fmtDate(LF.util.fromYmd(e.date), 'medium') + (e.time ? ' · ' + e.time : '')),
                  e.location ? el('span', { class: 'mchip' }, ic('map-pin', 11), e.location) : null)),
              el('span', { class: cd.cls, text: cd.text }));
            row.addEventListener('click', () => LF.modals.exam(e, {}, () => view.draw()));
            examCard.appendChild(row);
          });
        }
        page.appendChild(examCard);

        /* per-subject hours (productivity, last 30 days) */
        const monthAgo = LF.util.ymd(LF.util.addDays(LF.util.fromYmd(today), -29));
        const bySubject = new Map();
        sessions.filter(s => s.date >= monthAgo).forEach(s => {
          const k = s.subjectId || '_none';
          bySubject.set(k, (bySubject.get(k) || 0) + (s.minutes || 0));
        });
        const ranked = [];
        bySubject.forEach((min, sid) => ranked.push({ sid, min }));
        ranked.sort((a, b) => b.min - a.min);
        const maxMin = ranked.length ? ranked[0].min : 1;
        const prodCard = el('div', { class: 'card card-pad section' },
          el('div', { class: 'strong small', style: { marginBottom: '10px' }, text: t('study.bySubject') }));
        if (!ranked.length) {
          prodCard.appendChild(el('div', { class: 'muted small', text: t('study.noSessions') }));
        } else {
          ranked.slice(0, 6).forEach(r => {
            prodCard.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'center', marginBottom: '8px' } },
              el('span', { class: 'small grow truncate', text: subjName(subjects, r.sid) || t('study.noSubject') }),
              el('div', { class: 'progress', style: { maxWidth: '150px', minWidth: '70px' } },
                el('div', { style: { width: Math.max(3, Math.round((r.min / maxMin) * 100)) + '%' } })),
              el('span', { class: 'small num', style: { minWidth: '70px', textAlign: 'end' }, text: fmtMinutes(r.min) })));
          });
        }
        page.appendChild(prodCard);
      }

      /* ----- tab: assignments ----- */
      if (view.tab === 'assignments') {
        let list = assignments.slice();
        if (view.asgFilter === 'open') list = list.filter(a => a.status !== 'done');
        else if (view.asgFilter === 'done') list = list.filter(a => a.status === 'done');
        list.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));

        const chips = el('div', { class: 'row wrap', style: { gap: '6px', marginBottom: '12px' } });
        [['open', 'tasks.fActive'], ['done', 'tasks.fDone'], ['all', 'tasks.fAll']].forEach(([id, key]) => {
          const c = el('button', {
            class: 'chip' + (view.asgFilter === id ? ' on' : ''),
            'aria-pressed': view.asgFilter === id ? 'true' : 'false', text: t(key),
          });
          c.addEventListener('click', () => { view.asgFilter = id; view.draw(); });
          chips.appendChild(c);
        });
        const card = el('div', { class: 'card card-pad' });
        card.appendChild(el('div', { class: 'row between', style: { marginBottom: '10px' } },
          chips,
          el('button', {
            class: 'btn soft sm', onclick: () => LF.modals.assignment(null, {}, () => view.draw()),
          }, ic('plus', 13), t('study.newAssignment'))));

        if (!list.length) {
          card.appendChild(LF.ui.empty('book', t('study.noAssignments'), t('study.noAssignmentsHint')));
        } else {
          const wrap = el('div', { class: 'col', style: { gap: '6px' } });
          list.forEach(a => wrap.appendChild(assignmentRow(a, subjects, today)));
          card.appendChild(wrap);
        }
        page.appendChild(card);
      }

      /* ----- tab: subjects ----- */
      if (view.tab === 'subjects') {
        if (!subjects.length) {
          page.appendChild(el('div', { class: 'card' },
            LF.ui.empty('book', t('study.noSubjects'), t('study.noSubjectsHint'),
              el('button', {
                class: 'btn primary',
                onclick: () => LF.modals.subject(null, () => view.draw()),
              }, ic('plus', 15), t('study.newSubject')))));
        } else {
          const grid = el('div', { class: 'contact-grid' });
          subjects.forEach(sub => {
            const c = el('div', {
              class: 'card card-pad contact-card', role: 'button', tabindex: '0',
            },
              el('div', { class: 'strong small truncate', text: sub.name }),
              el('div', { class: 'meta', style: { marginTop: '6px' } },
                sub.teacher ? el('span', { class: 'mchip' }, ic('user', 11), sub.teacher) : null,
                sub.room ? el('span', { class: 'mchip' }, ic('map-pin', 11), sub.room) : null),
              sub.schedule ? el('div', { class: 'xs faint', style: { marginTop: '6px' }, text: sub.schedule }) : null);
            c.addEventListener('click', () => LF.modals.subject(sub, () => view.draw()));
            grid.appendChild(c);
          });
          page.appendChild(grid);
        }
      }

      /* ----- tab: sessions ----- */
      if (view.tab === 'sessions') {
        const recent = sessions.slice()
          .sort((a, b) => ((b.date || '') + (b.time || '')).localeCompare((a.date || '') + (a.time || '')))
          .slice(0, 10);
        const card = el('div', { class: 'card card-pad' },
          el('div', { class: 'row between', style: { marginBottom: '10px' } },
            el('div', { class: 'strong small', text: t('study.recentSessions') }),
            el('button', {
              class: 'btn soft sm', onclick: () => LF.modals.studySession(null, {}, () => view.draw()),
            }, ic('plus', 13), t('study.logSession'))));
        if (!recent.length) {
          card.appendChild(LF.ui.empty('clock', t('study.noSessions'), t('study.noSessionsHint')));
        } else {
          const wrap = el('div', { class: 'col', style: { gap: '6px' } });
          recent.forEach(s => {
            const row = el('div', { class: 'task-row', role: 'button', tabindex: '0' },
              el('div', { class: 'grow', style: { minWidth: 0 } },
                el('div', { class: 'task-title strong small truncate',
                  text: subjName(subjects, s.subjectId) || t('study.noSubject') }),
                el('div', { class: 'meta' },
                  el('span', { class: 'mchip' }, ic('calendar', 11),
                    LF.i18n.fmtDate(LF.util.fromYmd(s.date), 'medium') +
                    (s.time ? ' · ' + s.time : '')),
                  s.notes ? el('span', { class: 'mchip' }, ic('info', 11), s.notes) : null)),
              el('span', { class: 'strong num', text: fmtMinutes(s.minutes || 0) }));
            row.addEventListener('click', () => LF.modals.studySession(s, {}, () => view.draw()));
            wrap.appendChild(row);
          });
          card.appendChild(wrap);
        }
        page.appendChild(card);
      }

      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  function assignmentRow(a, subjects, today) {
    const t = LF.i18n.t;
    const done = a.status === 'done';
    const overdue = !done && a.dueDate && a.dueDate < today;

    const cb = el('button', {
      class: 'cbox', role: 'checkbox',
      'aria-checked': done ? 'true' : 'false',
      'aria-label': t('tasks.markDone'),
    }, ic('check', 13));
    cb.addEventListener('click', async (e) => {
      e.stopPropagation();
      a.status = done ? 'todo' : 'done';
      if (!done) a.completedAt = new Date().toISOString();
      else a.completedAt = null;
      await LF.db.put('assignments', a);
      view.draw();
    });

    const meta = el('div', { class: 'meta' });
    if (a.dueDate) {
      meta.appendChild(el('span', {
        class: 'mchip' + (overdue ? ' danger' : ''),
        text: (overdue ? t('tasks.overdueChip') + ' · ' : t('study.due') + ': ') +
          LF.i18n.fmtDate(LF.util.fromYmd(a.dueDate), 'medium'),
      }));
    }
    if (a.subjectId) meta.appendChild(el('span', { class: 'mchip' }, ic('book', 11), subjName(subjects, a.subjectId) || '—'));

    const row = el('div', { class: 'task-row' + (done ? ' done' : ''), role: 'button', tabindex: '0' },
      cb,
      el('div', { class: 'grow', style: { minWidth: 0 } },
        el('div', { class: 'task-title strong small truncate', text: a.title || '—' }),
        meta),
      el('span', { class: 'p-dot p-' + (a.priority || 'medium'), title: t('tasks.prio_' + (a.priority || 'medium')) }));
    row.addEventListener('click', () => LF.modals.assignment(a, {}, () => view.draw()));
    return row;
  }

  /* ============================================================
     Subject modal
     ============================================================ */
  LF.modals.subject = async function subjectModal(subjectIn, onDone) {
    const t = LF.i18n.t;
    const isNew = !subjectIn;
    const sub = subjectIn ? LF.util.clone(subjectIn) : { name: '', teacher: '', schedule: '', room: '', notes: '' };
    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });

    const name = el('input', { class: 'input', maxlength: '60', value: sub.name || '' });
    const teacher = el('input', { class: 'input', maxlength: '60', value: sub.teacher || '' });
    const room = el('input', { class: 'input', maxlength: '40', value: sub.room || '' });
    const schedule = el('input', {
      class: 'input', maxlength: '120', value: sub.schedule || '',
      placeholder: t('study.schedulePh'),
    });
    const notes = el('textarea', { class: 'textarea', style: { minHeight: '52px' }, text: sub.notes || '' });

    let m = null;
    m = LF.ui.modal({
      title: isNew ? t('study.newSubject') : t('study.editSubject'),
      body: el('div', { class: 'col', style: { gap: '14px' } },
        LF.ui.field(t('study.subjectName'), name),
        el('div', { class: 'form-grid' },
          LF.ui.field(t('study.teacher'), teacher, { hint: t('common.optional') }),
          LF.ui.field(t('study.room'), room, { hint: t('common.optional') })),
        LF.ui.field(t('study.schedule'), schedule, { hint: t('common.optional') }),
        LF.ui.field(t('tasks.notes'), notes, { hint: t('common.optional') }),
        err),
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('study.deleteSubject'),
              message: t('study.deleteSubjectConfirm', { name: sub.name }),
            });
            if (!okC) return;
            /* safe unlink: exams/assignments/sessions keep their records */
            await LF.db.delete('subjects', subjectIn.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            if (name.value.trim().length < 2) {
              err.textContent = t('study.errSubject'); err.style.display = 'block'; return;
            }
            await LF.db.put('subjects', {
              id: sub.id, name: name.value.trim(), teacher: teacher.value.trim(),
              room: room.value.trim(), schedule: schedule.value.trim(),
              notes: notes.value.trim(), createdAt: sub.createdAt,
            });
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone(isNew ? 'new' : 'edit');
          },
        },
      ],
    });
    setTimeout(() => name.focus(), 30);
  };

  /* ============================================================
     Exam modal — prefill: {date}
     ============================================================ */
  LF.modals.exam = async function examModal(examIn, prefill, onDone) {
    const t = LF.i18n.t;
    const isNew = !examIn;
    const ex = examIn ? LF.util.clone(examIn) : {
      subjectId: '', title: '', date: (prefill && prefill.date) || '',
      time: '', location: '', notes: '',
    };
    const subjects = await loadSubjects();
    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });

    const subject = el('select', { class: 'select' });
    subject.appendChild(optionEl(ex.subjectId, '', 'study.noSubject', true));
    subjects.forEach(s => subject.appendChild(optionEl(ex.subjectId, s.id, s.name, false)));
    const title = el('input', { class: 'input', maxlength: '80', value: ex.title || '', placeholder: t('study.examTitlePh') });
    const date = el('input', { class: 'input', type: 'date', value: ex.date || '' });
    const time = el('input', { class: 'input', type: 'time', value: ex.time || '' });
    const loc = el('input', { class: 'input', maxlength: '80', value: ex.location || '' });
    const notes = el('textarea', { class: 'textarea', style: { minHeight: '48px' }, text: ex.notes || '' });

    let m = null;
    m = LF.ui.modal({
      title: isNew ? t('study.newExam') : t('study.editExam'),
      body: el('div', { class: 'col', style: { gap: '14px' } },
        LF.ui.field(t('study.subject'), subject),
        LF.ui.field(t('study.examTitle'), title, { hint: t('common.optional') }),
        el('div', { class: 'form-grid' },
          LF.ui.field(t('expenses.date'), date),
          LF.ui.field(t('expenses.time'), time, { hint: t('common.optional') }),
          LF.ui.field(t('calendar.location'), loc, { hint: t('common.optional') })),
        LF.ui.field(t('tasks.notes'), notes, { hint: t('common.optional') }),
        err),
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('study.deleteExam'),
              message: t('study.deleteExamConfirm', { name: ex.title || '' }),
            });
            if (!okC) return;
            await LF.db.delete('exams', examIn.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            if (!date.value) { err.textContent = t('expenses.errDate'); err.style.display = 'block'; return; }
            if (!L().validTime(time.value)) { err.textContent = t('tasks.errTime'); err.style.display = 'block'; return; }
            await LF.db.put('exams', {
              id: ex.id, subjectId: subject.value || '', title: title.value.trim(),
              date: date.value, time: time.value || '', location: loc.value.trim(),
              notes: notes.value.trim(), createdAt: ex.createdAt,
            });
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone(isNew ? 'new' : 'edit');
          },
        },
      ],
    });
  };

  /* ============================================================
     Assignment modal — prefill: {subjectId, date}
     ============================================================ */
  LF.modals.assignment = async function assignmentModal(asgIn, prefill, onDone) {
    const t = LF.i18n.t;
    const isNew = !asgIn;
    const a = asgIn ? LF.util.clone(asgIn) : {
      subjectId: (prefill && prefill.subjectId) || '', title: '',
      dueDate: (prefill && prefill.date) || '', status: 'todo', priority: 'medium',
    };
    const subjects = await loadSubjects();
    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });

    const subject = el('select', { class: 'select' });
    subject.appendChild(optionEl(a.subjectId, '', 'study.noSubject', true));
    subjects.forEach(s => subject.appendChild(optionEl(a.subjectId, s.id, s.name, false)));
    const title = el('input', { class: 'input', maxlength: '120', value: a.title || '' });
    const due = el('input', { class: 'input', type: 'date', value: a.dueDate || '' });
    const prio = LF.ui.seg(L().PRIORITIES.map(p => ({ value: p, label: t('tasks.prio_' + p) })),
      a.priority || 'medium', v => { a.priority = v; });

    let m = null;
    m = LF.ui.modal({
      title: isNew ? t('study.newAssignment') : t('study.editAssignment'),
      body: el('div', { class: 'col', style: { gap: '14px' } },
        LF.ui.field(t('study.subject'), subject),
        LF.ui.field(t('study.asgTitle'), title),
        el('div', { class: 'form-grid' },
          LF.ui.field(t('study.due'), due),
          LF.ui.field(t('tasks.priority'), prio)),
        err),
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('study.deleteAsg'),
              message: t('study.deleteAsgConfirm', { title: a.title || '' }),
            });
            if (!okC) return;
            await LF.db.delete('assignments', asgIn.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            if (title.value.trim().length < 2) { err.textContent = t('tasks.errTitle'); err.style.display = 'block'; return; }
            await LF.db.put('assignments', {
              id: a.id, subjectId: subject.value || '', title: title.value.trim(),
              dueDate: due.value || null, status: a.status || 'todo',
              priority: a.priority || 'medium', completedAt: a.completedAt || null,
              createdAt: a.createdAt,
            });
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone(isNew ? 'new' : 'edit');
          },
        },
      ],
    });
    setTimeout(() => title.focus(), 30);
  };

  /* ============================================================
     Study session modal — prefill: {subjectId, date}
     ============================================================ */
  LF.modals.studySession = async function sessionModal(sessionIn, prefill, onDone) {
    const t = LF.i18n.t;
    const isNew = !sessionIn;
    const se = sessionIn ? LF.util.clone(sessionIn) : {
      subjectId: (prefill && prefill.subjectId) || '',
      minutes: '', date: (prefill && prefill.date) || LF.util.todayYmd(),
      time: '', notes: '',
    };
    const subjects = await loadSubjects();
    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });

    const subject = el('select', { class: 'select' });
    subject.appendChild(optionEl(se.subjectId, '', 'study.noSubject', true));
    subjects.forEach(s => subject.appendChild(optionEl(se.subjectId, s.id, s.name, false)));
    const minutes = el('input', {
      class: 'input num', type: 'number', min: '5', step: '5',
      value: se.minutes !== '' && se.minutes != null ? se.minutes : '',
      placeholder: '45', style: { maxWidth: '120px' },
    });
    const date = el('input', { class: 'input', type: 'date', value: se.date || '' });
    const time = el('input', { class: 'input', type: 'time', value: se.time || '' });
    const notes = el('input', { class: 'input', maxlength: '80', value: se.notes || '' });

    /* quick duration chips */
    const durChips = el('div', { class: 'row wrap', style: { gap: '6px', marginTop: '6px' } });
    [25, 45, 60, 90, 120].forEach(min => {
      const c = el('button', {
        class: 'chip', type: 'button',
        onclick: () => { minutes.value = String(min); },
      }, LF.i18n.num(min) + ' ' + t('study.minShort'));
      durChips.appendChild(c);
    });

    let m = null;
    m = LF.ui.modal({
      title: isNew ? t('study.logSession') : t('study.editSession'),
      body: el('div', { class: 'col', style: { gap: '14px' } },
        LF.ui.field(t('study.subject'), subject),
        LF.ui.field(t('study.duration'), minutes),
        durChips,
        el('div', { class: 'form-grid' },
          LF.ui.field(t('expenses.date'), date),
          LF.ui.field(t('expenses.time'), time, { hint: t('common.optional') })),
        LF.ui.field(t('tasks.notes'), notes, { hint: t('common.optional') }),
        err),
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('study.deleteSession'),
              message: t('study.deleteSessionConfirm'),
            });
            if (!okC) return;
            await LF.db.delete('studySessions', sessionIn.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            const min = Math.round(+minutes.value || 0);
            if (!min || min < 1) { err.textContent = t('study.errMinutes'); err.style.display = 'block'; return; }
            if (!date.value) { err.textContent = t('expenses.errDate'); err.style.display = 'block'; return; }
            if (!L().validTime(time.value)) { err.textContent = t('tasks.errTime'); err.style.display = 'block'; return; }
            await LF.db.put('studySessions', {
              id: se.id, subjectId: subject.value || '', minutes: min,
              date: date.value, time: time.value || '', notes: notes.value.trim(),
              createdAt: se.createdAt,
            });
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone(isNew ? 'new' : 'edit');
          },
        },
      ],
    });
  };

  LF.views = LF.views || {};
  LF.views['app/study'] = async function () { await view.render(); };
  LF.studyView = view;
  LF.studyHelpers = { loadSubjects, subjName, fmtMinutes };
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/work.js ===== */
/* ============================================================
   LifeFlow — Work view (العمل) — optional feature
   Hub over existing stores: work tasks (tasks in the "work"
   workspace), meetings (events type=meeting), clients (contacts
   rel=client), work hours (dayReviews.workMinutes) with quick
   logging. Creates a Work workspace when needed (spec #17).
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  /**
   * Resolve the "work" workspace: tag an existing one (created by
   * onboarding for employees/business) or create it on demand.
   */
  async function ensureWorkWorkspace() {
    const t = LF.i18n.t;
    const lists = await LF.db.list('workspaces', {});
    let ws = lists.find(w => w.tag === 'work');
    if (ws) return ws;
    /* match seeded names (renamable, hence fuzzy on the known seeds only) */
    const seedNames = [t('ws.work'), t('ws.business')];
    ws = lists.find(w => seedNames.indexOf(w.name) !== -1);
    if (ws) {
      ws.tag = 'work';
      await LF.db.put('workspaces', ws);
      return ws;
    }
    const rec = await LF.db.put('workspaces', { name: t('ws.work'), tag: 'work' });
    LF.store.workspaces.push(rec);
    LF.store.emit('workspaces:changed');
    return rec;
  }

  function fmtMinutes(min) {
    const t = LF.i18n.t;
    const h = Math.floor(min / 60), m = min % 60;
    if (h && m) return LF.i18n.num(h) + ' ' + t('study.hourShort') + ' ' + LF.i18n.num(m) + ' ' + t('study.minShort');
    if (h) return LF.i18n.num(h) + ' ' + t('study.hourShort');
    return LF.i18n.num(m) + ' ' + t('study.minShort');
  }

  /* ============================================================
     View
     ============================================================ */
  const view = {
    async render(viewEl) {
      viewEl = await LF.shell.ensure();
      view._viewEl = viewEl;
      await view.draw();
    },

    async draw() {
      const t = LF.i18n.t;
      const viewEl = view._viewEl;
      if (!viewEl) return;
      if (LF.store.feature && !LF.store.feature('work')) {
        viewEl.innerHTML = '';
        viewEl.appendChild(el('div', { class: 'page' },
          el('div', { class: 'card' },
            LF.ui.empty('briefcase', t('work.disabled'), t('work.disabledHint')))));
        return;
      }

      const ws = await ensureWorkWorkspace();
      const [tasks, events, contacts, reviews] = await Promise.all([
        LF.db.list('tasks', {}),
        LF.db.list('events', { predicate: e => e.type === 'meeting' }),
        LF.db.list('contacts', {}),
        LF.db.list('dayReviews', {}),
      ]);
      const today = LF.util.todayYmd();
      const weekAgo = LF.util.ymd(LF.util.addDays(LF.util.fromYmd(today), -6));

      const workTasks = tasks.filter(x => x.workspaceId === ws.id &&
        x.status !== 'done' && x.status !== 'cancelled');
      const todayWork = workTasks.filter(x => x.date === today || !x.date);
      const meetings = events.filter(e => e.date >= today)
        .sort((a, b) => (a.date + (a.startTime || '')).localeCompare(b.date + (b.startTime || '')));
      const clients = contacts.filter(c => c.relation === 'client');
      const weekMin = L().sumMinutes(reviews, weekAgo, today, 'workMinutes');

      /* page */
      const page = el('div', { class: 'page' });
      page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
        el('div', { class: 'grow' },
          el('h1', { text: t('nav.work') }),
          el('div', { class: 'page-sub', text: t('work.sub', { ws: ws.name }) })),
        el('div', { class: 'row', style: { gap: '8px' } },
          el('button', {
            class: 'btn ghost', onclick: () => LF.modals.workLog(null, () => view.draw()),
          }, ic('clock', 15), t('work.logHours')),
          el('button', {
            class: 'btn primary',
            onclick: () => LF.modals.task(null, { workspaceId: ws.id }, () => view.draw()),
          }, ic('plus', 16), t('work.newTask')))));

      /* KPIs */
      page.appendChild(el('div', { class: 'kpi-grid', style: { marginBottom: '14px' } },
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('work.kOpenTasks') }),
          el('div', { class: 'kpi-value', text: LF.i18n.num(workTasks.length) }),
          el('div', { class: 'kpi-sub', text: t('work.kToday', { n: todayWork.length }) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('work.kMeetings') }),
          el('div', { class: 'kpi-value', text: LF.i18n.num(meetings.filter(e => e.date === today).length) }),
          el('div', { class: 'kpi-sub', text: t('work.kUpcoming', { n: meetings.length }) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('work.kHours') }),
          el('div', { class: 'kpi-value', text: fmtMinutes(weekMin) }),
          el('div', { class: 'kpi-sub', text: t('work.kHoursSub') })),
        clients.length ? el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('work.kClients') }),
          el('div', { class: 'kpi-value', text: LF.i18n.num(clients.length) })) : null));

      /* work tasks */
      const tasksCard = el('div', { class: 'card card-pad section' },
        el('div', { class: 'row between', style: { marginBottom: '10px' } },
          el('div', { class: 'strong small', text: t('work.openTasks') }),
          el('a', {
            href: '#/app/tasks', class: 'btn ghost sm',
          }, t('dashboard.viewAllTasks'))));
      if (!workTasks.length) {
        tasksCard.appendChild(el('div', { class: 'muted small', text: t('work.noTasks') }));
      } else {
        const wrap = el('div', { class: 'col', style: { gap: '6px' } });
        workTasks.sort((a, b) =>
          ((a.date || '9999') + (a.time || '')).localeCompare((b.date || '9999') + (b.time || '')));
        workTasks.slice(0, 6).forEach(task => {
          const overdue = task.date && task.date < today;
          wrap.appendChild(el('div', {
            class: 'task-row', role: 'button', tabindex: '0',
          },
            el('div', { class: 'grow', style: { minWidth: 0 } },
              el('div', { class: 'task-title strong small truncate', text: task.title || '' }),
              el('div', { class: 'meta' },
                task.date ? el('span', { class: 'mchip' + (overdue ? ' danger' : '') },
                  LF.i18n.fmtDate(LF.util.fromYmd(task.date), 'medium') + (task.time ? ' · ' + task.time : ''))
                  : el('span', { class: 'mchip', text: t('tasks.noDate') }),
                el('span', { class: 'p-dot p-' + (task.priority || 'medium') })))));
        });
        tasksCard.appendChild(wrap);
      }
      page.appendChild(tasksCard);

      /* upcoming meetings */
      const meetCard = el('div', { class: 'card card-pad section' },
        el('div', { class: 'row between', style: { marginBottom: '10px' } },
          el('div', { class: 'strong small', text: t('work.upcomingMeetings') }),
          el('button', {
            class: 'btn soft sm',
            onclick: () => LF.modals.event(null, { type: 'meeting' }, () => view.draw()),
          }, ic('plus', 13), t('work.newMeeting'))));
      if (!meetings.length) {
        meetCard.appendChild(el('div', { class: 'muted small', text: t('work.noMeetings') }));
      } else {
        meetings.slice(0, 5).forEach(e => {
          meetCard.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'center', padding: '6px 0' } },
            ic('calendar', 15),
            el('div', { class: 'grow', style: { minWidth: 0 } },
              el('div', { class: 'small strong truncate', text: e.title || '—' }),
              el('div', { class: 'xs faint', text: LF.i18n.fmtDate(LF.util.fromYmd(e.date), 'medium') +
                (e.startTime ? ' · ' + e.startTime : '') +
                (e.location ? ' · ' + e.location : '') }))));
        });
      }
      page.appendChild(meetCard);

      /* work hours this week (from dayReviews) */
      const days = [];
      for (let i = 6; i >= 0; i--) {
        days.push(LF.util.ymd(LF.util.addDays(LF.util.fromYmd(today), -i)));
      }
      const byDay = {};
      reviews.forEach(r => { byDay[r.date] = r.workMinutes || 0; });
      const maxDay = Math.max(1, ...days.map(d => byDay[d] || 0));
      const hoursCard = el('div', { class: 'card card-pad section' },
        el('div', { class: 'row between', style: { marginBottom: '12px' } },
          el('div', { class: 'strong small', text: t('work.hoursWeek') }),
          el('button', {
            class: 'btn soft sm', onclick: () => LF.modals.workLog(null, () => view.draw()),
          }, ic('plus', 13), t('work.logHours'))));
      const bars = el('div', { class: 'row', style: { gap: '8px', alignItems: 'flex-end', height: '90px' } });
      days.forEach(d => {
        const min = byDay[d] || 0;
        bars.appendChild(el('div', {
          class: 'col grow', style: { alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end',
            title: LF.i18n.fmtDate(LF.util.fromYmd(d), 'medium') + ' — ' + fmtMinutes(min) },
          style2: undefined,
        },
          el('span', { class: 'xs faint num', text: min ? LF.i18n.num(Math.round((min / 60) * 10) / 10) : '' }),
          el('div', {
            style: {
              width: '100%', maxWidth: '38px', height: Math.max(3, Math.round((min / maxDay) * 62)) + 'px',
              background: min ? 'var(--accent)' : 'var(--surface-2)',
              borderRadius: '6px 6px 0 0',
            },
          }),
          el('span', { class: 'xs muted', text: LF.i18n.weekdayName(LF.util.fromYmd(d).getDay()) })));
      });
      hoursCard.appendChild(bars);
      page.appendChild(hoursCard);

      /* clients */
      const clientsCard = el('div', { class: 'card card-pad section' },
        el('div', { class: 'row between', style: { marginBottom: '10px' } },
          el('div', { class: 'strong small', text: t('work.clients') }),
          el('a', { href: '#/app/contacts', class: 'btn ghost sm' }, t('contacts.viewAll') || t('common.edit'))));
      if (!clients.length) {
        clientsCard.appendChild(el('div', { class: 'muted small', text: t('work.noClients') }));
      } else {
        const row = el('div', { class: 'row wrap', style: { gap: '8px' } });
        clients.slice(0, 8).forEach(c => {
          row.appendChild(el('a', {
            href: '#/app/contacts/' + c.id,
            class: 'chip', style: { textDecoration: 'none' },
          }, LF.ui.avatar(c, 22), c.name));
        });
        clientsCard.appendChild(row);
      }
      page.appendChild(clientsCard);

      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  /* ============================================================
     Work hours log — merges into today's dayReviews record
     ============================================================ */
  LF.modals.workLog = async function workLogModal(x, onDone) {
    const t = LF.i18n.t;
    const today = LF.util.todayYmd();
    const rec = (await LF.db.list('dayReviews', { predicate: r => r.date === today }))[0];
    const existing = rec ? (rec.workMinutes || 0) : 0;

    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });
    const hours = el('input', {
      class: 'input num', type: 'number', min: '0', step: '0.25',
      value: '', placeholder: '0', style: { maxWidth: '130px' }, dir: 'ltr',
    });
    const info = el('div', { class: 'small muted' },
      t('work.loggedToday') + ': ' + fmtMinutes(existing));

    let m = null;
    m = LF.ui.modal({
      title: t('work.logHours'),
      body: el('div', { class: 'col', style: { gap: '14px' } },
        info,
        LF.ui.field(t('work.hoursToday'), hours, { hint: t('work.hoursHint') }),
        err),
      actions: [
        existing > 0 ? {
          label: t('work.resetToday'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('work.resetToday'), message: t('work.resetConfirm'), danger: false,
            });
            if (!okC) return;
            if (rec) {
              rec.workMinutes = 0;
              await LF.db.put('dayReviews', rec);
            }
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('reset');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            const h = parseFloat(hours.value);
            if (isNaN(h) || h < 0 || h > 24) {
              err.textContent = t('work.errHours'); err.style.display = 'block'; return;
            }
            const addMin = Math.round(h * 60);
            const merged = Object.assign({}, rec || {}, {
              id: (rec && rec.id) || 'dr-' + today,
              date: today,
              workMinutes: existing + addMin,
            });
            await LF.db.put('dayReviews', merged);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('log');
          },
        },
      ].filter(Boolean),
    });
  };

  LF.views = LF.views || {};
  LF.views['app/work'] = async function () { await view.render(); };
  LF.workView = view;
  LF.workHelpers = { ensureWorkWorkspace };
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/habits.js ===== */
/* ============================================================
   LifeFlow — Habits view (العادات) — optional feature
   Schedules: daily / specific days / weekly / numeric target.
   Shows streak, adherence %, and a 30-day day log (spec #20).
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  const HABIT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#e11d48'];

  function optionEl(sel, value, labelKeyOrText, isI18n) {
    const o = el('option', { value, selected: String(value) === String(sel) ? '' : null });
    o.textContent = isI18n ? LF.i18n.t(labelKeyOrText) : labelKeyOrText;
    return o;
  }

  function scheduleLabel(h) {
    const t = LF.i18n.t;
    const sch = (h.schedule || {}).type || 'daily';
    if (sch === 'daily') return t('habits.sch_daily');
    if (sch === 'weekly') return t('habits.sch_weekly');
    if (sch === 'numeric') return t('habits.sch_numeric', { n: h.target || 1 });
    if (sch === 'days' && h.days && h.days.length) {
      return h.days.slice().sort().map(d => LF.i18n.weekdayName(d)).join('، ');
    }
    return t('habits.sch_daily');
  }

  /* ============================================================
     View
     ============================================================ */
  const view = {
    async render(viewEl) {
      viewEl = await LF.shell.ensure();
      view._viewEl = viewEl;
      await view.draw();
    },

    async draw() {
      const t = LF.i18n.t;
      const viewEl = view._viewEl;
      if (!viewEl) return;
      if (LF.store.feature && !LF.store.feature('habits')) {
        viewEl.innerHTML = '';
        viewEl.appendChild(el('div', { class: 'page' },
          el('div', { class: 'card' },
            LF.ui.empty('flame', t('habits.disabled'), t('habits.disabledHint')))));
        return;
      }

      const [habits, logs] = await Promise.all([
        LF.db.list('habits', {}),
        LF.db.list('habitLogs', {}),
      ]);
      const today = LF.util.todayYmd();
      habits.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

      /* page */
      const page = el('div', { class: 'page' });
      page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
        el('div', { class: 'grow' },
          el('h1', { text: t('nav.habits') }),
          el('div', { class: 'page-sub', text: t('habits.sub', { n: habits.length }) })),
        el('button', {
          class: 'btn primary', onclick: () => LF.modals.habit(null, () => view.draw()),
        }, ic('plus', 16), t('habits.new'))));

      if (!habits.length) {
        page.appendChild(el('div', { class: 'card' },
          LF.ui.empty('flame', t('habits.empty'), t('habits.emptyHint'),
            el('button', {
              class: 'btn primary',
              onclick: () => LF.modals.habit(null, () => view.draw()),
            }, ic('plus', 15), t('habits.new')))));
      } else {
        const wrap = el('div', { class: 'col', style: { gap: '10px' } });
        habits.forEach(h => wrap.appendChild(habitCard(h, logs, today)));
        page.appendChild(wrap);
      }

      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  function habitCard(h, logs, today) {
    const t = LF.i18n.t;
    const hLogs = logs.filter(l => l.habitId === h.id);
    const streak = L().habitStreak(h, hLogs, today);
    const adh = L().habitAdherence(h, hLogs, today);
    const todayV = L().habitDayValue(h, hLogs, today);
    const scheduledToday = L().habitScheduledOn(h, today) || (h.schedule || {}).type === 'weekly';

    /* today toggle / counter */
    let action;
    if ((h.schedule || {}).type === 'numeric') {
      action = el('div', { class: 'row', style: { gap: '6px', alignItems: 'center' } },
        el('button', {
          class: 'btn soft sm num', 'aria-label': t('habits.minus'),
          onclick: async () => {
            const last = hLogs.filter(l => l.date === today).sort((a, b) =>
              (b.createdAt || '').localeCompare(a.createdAt || ''))[0];
            if (last) await LF.db.delete('habitLogs', last.id);
            view.draw();
          },
        }, '−'),
        el('span', { class: 'strong small num', style: { minWidth: '52px', textAlign: 'center' },
          text: LF.i18n.num(todayV.value) + '/' + LF.i18n.num(todayV.target) }),
        el('button', {
          class: 'btn soft sm num', 'aria-label': t('habits.plus'),
          onclick: async () => {
            await LF.db.put('habitLogs', { habitId: h.id, date: today, count: 1 });
            view.draw();
          },
        }, '+'));
    } else {
      action = el('button', {
        class: 'cbox' + (todayV.done ? ' on' : ''), role: 'checkbox',
        'aria-checked': todayV.done ? 'true' : 'false',
        'aria-label': t('habits.markToday'),
      }, ic('check', 13));
      action.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (todayV.done) {
          const mine = hLogs.filter(l => l.date === today);
          for (const l of mine) await LF.db.delete('habitLogs', l.id);
        } else {
          await LF.db.put('habitLogs', { habitId: h.id, date: today, count: 1 });
        }
        view.draw();
      });
    }

    /* 30-day day log strip */
    const strip = el('div', { class: 'row', style: { gap: '3px', marginTop: '8px', flexWrap: 'wrap' } });
    for (let i = 29; i >= 0; i--) {
      const d = LF.util.ymd(LF.util.addDays(LF.util.fromYmd(today), -i));
      const scheduled = L().habitScheduledOn(h, d);
      const dv = L().habitDayValue(h, hLogs, d);
      const bg = dv.done ? (h.color || '#10b981') : (scheduled ? 'var(--surface-2)' : 'transparent');
      strip.appendChild(el('span', {
        title: d + (dv.value ? ' · ' + LF.i18n.num(dv.value) : ''),
        style: {
          width: '12px', height: '12px', borderRadius: '3px',
          background: bg,
          border: dv.done ? 'none' : '1px solid var(--border)',
          display: 'inline-block', flex: 'none',
        },
      }));
    }

    const card = el('div', { class: 'card card-pad task-row' },
      el('div', { class: 'grow', style: { minWidth: 0 } },
        el('div', { class: 'row between', style: { gap: '8px' } },
          el('div', { class: 'task-title strong small truncate' },
            el('span', { class: 'cat-dot', style: { background: h.color || '#10b981', marginInlineEnd: '6px' } }),
            document.createTextNode(h.name || '')),
          el('span', { class: 'badge ' + (streak > 0 ? 'ok' : ''), title: t('habits.streak') },
            ic('flame', 12), LF.i18n.num(streak))),
        el('div', { class: 'meta' },
          el('span', { class: 'mchip', text: scheduleLabel(h) }),
          el('span', { class: 'mchip' },
            t('habits.adherence') + ': ' + LF.i18n.num(adh.pct) + '%'),
          !scheduledToday ? el('span', { class: 'mchip', text: t('habits.restDay') }) : null),
        strip,
        el('div', { class: 'xs faint num', style: { marginTop: '4px' },
          text: t('habits.adhLine', { done: LF.i18n.num(adh.done), total: LF.i18n.num(adh.scheduled) }) })),
      action);
    card.addEventListener('click', () => LF.modals.habit(h, () => view.draw()));
    return card;
  }

  /* ============================================================
     Habit modal
     ============================================================ */
  LF.modals.habit = async function habitModal(habitIn, onDone) {
    const t = LF.i18n.t;
    const isNew = !habitIn;
    const h = habitIn ? LF.util.clone(habitIn) : {
      name: '', schedule: { type: 'daily' }, days: [], target: 8,
      color: HABIT_COLORS[0],
    };
    if (!h.schedule) h.schedule = { type: 'daily' };

    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });
    const name = el('input', { class: 'input', maxlength: '60', value: h.name || '' });

    const schType = el('select', { class: 'select' });
    L().HABIT_TYPES.forEach(tp =>
      schType.appendChild(optionEl(h.schedule.type, tp, 'habits.sch_' + tp, true)));

    /* weekday picker (for specific days) */
    const daysWrap = el('div', { class: 'row wrap', style: { gap: '6px', display: h.schedule.type === 'days' ? 'flex' : 'none' } });
    const dayBtns = [];
    for (let d = 0; d < 7; d++) {
      const on = (h.days || []).indexOf(d) !== -1;
      const b = el('button', {
        class: 'chip' + (on ? ' on' : ''), type: 'button',
        'aria-pressed': on ? 'true' : 'false',
        style: { padding: '5px 10px' },
      }, LF.i18n.weekdayName(d));
      b.addEventListener('click', () => {
        const nowOn = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', nowOn ? 'true' : 'false');
        b.classList.toggle('on', nowOn);
      });
      dayBtns.push(b);
      daysWrap.appendChild(b);
    }

    /* numeric target */
    const targetWrap = el('div', { style: { display: h.schedule.type === 'numeric' ? 'block' : 'none' } });
    const target = el('input', { class: 'input num', type: 'number', min: '1', max: '1000', value: h.target || 8, style: { maxWidth: '110px' } });
    targetWrap.appendChild(LF.ui.field(t('habits.targetLabel'), target, { hint: t('habits.targetHint') }));

    schType.addEventListener('change', () => {
      daysWrap.style.display = schType.value === 'days' ? 'flex' : 'none';
      targetWrap.style.display = schType.value === 'numeric' ? 'block' : 'none';
    });

    /* color */
    const colors = el('div', { class: 'row wrap', style: { gap: '9px' } });
    let picked = h.color || HABIT_COLORS[0];
    HABIT_COLORS.forEach(c => {
      const b = el('button', {
        class: 'swatch', 'aria-pressed': picked === c ? 'true' : 'false',
        'aria-label': c, style: { background: c },
      });
      b.addEventListener('click', () => {
        picked = c;
        colors.querySelectorAll('.swatch').forEach(x => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
      });
      colors.appendChild(b);
    });

    let m = null;
    m = LF.ui.modal({
      title: isNew ? t('habits.new') : t('habits.edit'),
      body: el('div', { class: 'col', style: { gap: '14px' } },
        LF.ui.field(t('habits.name'), name),
        LF.ui.field(t('habits.schedule'), schType),
        daysWrap,
        targetWrap,
        LF.ui.field(t('settings.avatarColor'), colors),
        err),
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('habits.deleteTitle'),
              message: t('habits.deleteConfirm', { name: h.name }),
            });
            if (!okC) return;
            const lgs = await LF.db.list('habitLogs', { predicate: x => x.habitId === habitIn.id });
            for (const x of lgs) await LF.db.delete('habitLogs', x.id);
            await LF.db.delete('habits', habitIn.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            const nameV = name.value.trim();
            if (nameV.length < 2) { err.textContent = t('habits.errName'); err.style.display = 'block'; return; }
            const days = [];
            dayBtns.forEach((b, d) => { if (b.getAttribute('aria-pressed') === 'true') days.push(d); });
            if (schType.value === 'days' && !days.length) {
              err.textContent = t('habits.errDays'); err.style.display = 'block'; return;
            }
            if (schType.value === 'numeric' && (!(+target.value > 0))) {
              err.textContent = t('habits.errTarget'); err.style.display = 'block'; return;
            }
            await LF.db.put('habits', {
              id: h.id, name: nameV,
              schedule: { type: schType.value },
              days: schType.value === 'days' ? days : [],
              target: schType.value === 'numeric' ? Math.round(+target.value) : null,
              color: picked, createdAt: h.createdAt,
            });
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone(isNew ? 'new' : 'edit');
          },
        },
      ],
    });
    setTimeout(() => name.focus(), 30);
  };

  LF.views = LF.views || {};
  LF.views['app/habits'] = async function () { await view.render(); };
  LF.habitsView = view;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/goals.js ===== */
/* ============================================================
   LifeFlow — Goals view (الأهداف)
   Flexible categories, steps with auto progress, manual
   progress when no steps, statuses (spec #21).
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  const CATEGORIES = ['personal', 'financial', 'study', 'career', 'fitness', 'home', 'project'];
  const CAT_COLOR = {
    personal: '#8b5cf6', financial: '#10b981', study: '#3b82f6', career: '#f59e0b',
    fitness: '#e11d48', home: '#06b6d4', project: '#ec4899',
  };
  const STATUSES = ['active', 'onhold', 'done', 'cancelled'];

  function optionEl(sel, value, labelKeyOrText, isI18n) {
    const o = el('option', { value, selected: String(value) === String(sel) ? '' : null });
    o.textContent = isI18n ? LF.i18n.t(labelKeyOrText) : labelKeyOrText;
    return o;
  }

  /* ============================================================
     View
     ============================================================ */
  const view = {
    filter: 'active',

    async render(viewEl) {
      viewEl = await LF.shell.ensure();
      view._viewEl = viewEl;
      await view.draw();
    },

    async draw() {
      const t = LF.i18n.t;
      const viewEl = view._viewEl;
      if (!viewEl) return;

      const [goals, steps] = await Promise.all([
        LF.db.list('goals', {}),
        LF.db.list('goalSteps', {}),
      ]);
      const today = LF.util.todayYmd();

      let list = goals.slice();
      if (view.filter === 'active') list = list.filter(g => g.status === 'active' || !g.status);
      else if (view.filter === 'done') list = list.filter(g => g.status === 'done');
      else if (view.filter === 'archived') list = list.filter(g => g.status === 'cancelled' || g.status === 'onhold');
      list.sort((a, b) => ((a.deadline || '9999').localeCompare(b.deadline || '9999')));

      /* page */
      const page = el('div', { class: 'page' });
      page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
        el('div', { class: 'grow' },
          el('h1', { text: t('nav.goals') }),
          el('div', { class: 'page-sub', text: t('goals.sub', { n: list.length }) })),
        el('button', {
          class: 'btn primary', onclick: () => LF.modals.goal(null, () => view.draw()),
        }, ic('plus', 16), t('goals.new'))));

      /* filter chips */
      const chips = el('div', { class: 'row wrap', style: { gap: '6px', marginBottom: '14px' } });
      [['active', 'tasks.fActive'], ['done', 'tasks.fDone'], ['archived', 'goals.fArchived'], ['all', 'tasks.fAll']]
        .forEach(([id, key]) => {
          const c = el('button', {
            class: 'chip' + (view.filter === id ? ' on' : ''),
            'aria-pressed': view.filter === id ? 'true' : 'false', text: t(key),
          });
          c.addEventListener('click', () => { view.filter = id; view.draw(); });
          chips.appendChild(c);
        });
      page.appendChild(chips);

      if (!list.length) {
        page.appendChild(el('div', { class: 'card' },
          LF.ui.empty('target', t('goals.empty'), t('goals.emptyHint'),
            el('button', {
              class: 'btn primary',
              onclick: () => LF.modals.goal(null, () => view.draw()),
            }, ic('plus', 15), t('goals.new')))));
      } else {
        const wrap = el('div', { class: 'col', style: { gap: '10px' } });
        list.forEach(g => wrap.appendChild(goalCard(g, steps, today)));
        page.appendChild(wrap);
      }

      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  function goalCard(g, steps, today) {
    const t = LF.i18n.t;
    const prog = L().goalProgress(g, steps);
    const overdue = g.deadline && g.deadline < today && g.status !== 'done';

    const meta = el('div', { class: 'meta' });
    meta.appendChild(el('span', { class: 'mchip' },
      el('span', { class: 'cat-dot', style: { background: CAT_COLOR[g.category] || 'var(--muted)' } }),
      t('goals.c_' + (g.category || 'personal'))));
    if (g.deadline) {
      meta.appendChild(el('span', { class: 'mchip' + (overdue ? ' danger' : '') },
        ic('calendar', 11),
        (overdue ? t('tasks.overdueChip') + ' · ' : '') +
        LF.i18n.fmtDate(LF.util.fromYmd(g.deadline), 'medium')));
    }
    if (prog.fromSteps) {
      meta.appendChild(el('span', { class: 'mchip' }, ic('list-checks', 11),
        LF.i18n.num(prog.doneSteps) + '/' + LF.i18n.num(prog.total)));
    }
    if (g.status && g.status !== 'active') {
      meta.appendChild(el('span', { class: 'badge ' + (g.status === 'done' ? 'ok' : 'warn'), text: t('goals.st_' + g.status) }));
    }

    const card = el('div', { class: 'card card-pad task-row', role: 'button', tabindex: '0' },
      el('div', { class: 'grow', style: { minWidth: 0 } },
        el('div', { class: 'row between', style: { gap: '8px' } },
          el('div', { class: 'task-title strong small truncate', text: g.name || '' }),
          el('span', { class: 'badge ' + (prog.pct >= 100 ? 'ok' : 'info'), text: LF.i18n.num(prog.pct) + '%' })),
        g.description ? el('div', { class: 'xs faint truncate', style: { marginTop: '2px' }, text: g.description }) : null,
        meta,
        el('div', { class: 'progress', style: { marginTop: '8px' } },
          el('div', { style: { width: prog.pct + '%', background: prog.pct >= 100 ? 'var(--ok)' : (CAT_COLOR[g.category] || 'var(--accent)') } }))));
    card.addEventListener('click', () => LF.modals.goal(g, () => view.draw()));
    return card;
  }

  /* ============================================================
     Goal modal — with steps editor + manual progress slider
     ============================================================ */
  LF.modals.goal = async function goalModal(goalIn, onDone) {
    const t = LF.i18n.t;
    const isNew = !goalIn;
    const g = goalIn ? LF.util.clone(goalIn) : {
      name: '', description: '', category: 'personal', date: LF.util.todayYmd(),
      deadline: '', progress: 0, status: 'active',
    };

    const steps = goalIn
      ? (await LF.db.list('goalSteps', { predicate: s => s.goalId === goalIn.id }))
        .sort((a, b) => (a.position || 0) - (b.position || 0))
      : [];

    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });
    const name = el('input', { class: 'input', maxlength: '80', value: g.name || '' });
    const desc = el('textarea', { class: 'textarea', style: { minHeight: '52px' }, text: g.description || '' });
    const date = el('input', { class: 'input', type: 'date', value: g.date || '' });
    const deadline = el('input', { class: 'input', type: 'date', value: g.deadline || '' });

    const category = el('select', { class: 'select' });
    CATEGORIES.forEach(c => category.appendChild(optionEl(g.category, c, 'goals.c_' + c, true)));

    const status = el('select', { class: 'select' });
    STATUSES.forEach(st => status.appendChild(optionEl(g.status, st, 'goals.st_' + st, true)));

    /* manual progress (used only when no steps) */
    const progWrap = el('div', {});
    const progLabel = el('div', { class: 'small muted', style: { marginBottom: '6px' },
      text: t('goals.progress') + ': ' + LF.i18n.num(L().goalProgress(g, steps).pct) + '%' });
    const progRange = el('input', {
      class: 'input', type: 'range', min: '0', max: '100', step: '5',
      value: L().goalProgress(g, steps).pct, style: { width: '100%' },
    });
    progRange.addEventListener('input', () => {
      progLabel.textContent = t('goals.progress') + ': ' + LF.i18n.num(progRange.value) + '%';
    });
    progWrap.appendChild(progLabel);
    progWrap.appendChild(progRange);

    /* steps editor */
    const stepList = el('div', { class: 'col', style: { gap: '6px' } });
    function drawSteps() {
      stepList.innerHTML = '';
      steps.forEach((s, idx) => {
        const cb = el('button', {
          class: 'cbox' + (s.done ? ' on' : ''), role: 'checkbox',
          'aria-checked': s.done ? 'true' : 'false',
          'aria-label': t('tasks.markDone'),
        }, ic('check', 12));
        cb.addEventListener('click', () => {
          s.done = !s.done;
          if (s.id) s._dirty = true;
          drawSteps();
        });
        stepList.appendChild(el('div', { class: 'row', style: { gap: '8px', alignItems: 'center' } },
          cb,
          el('span', { class: 'small grow' + (s.done ? ' done-text' : ''), text: s.title }),
          el('button', {
            class: 'icon-btn sm danger', 'aria-label': t('common.del'),
            onclick: () => { steps.splice(idx, 1); drawSteps(); },
          }, ic('trash', 12))));
      });
    }
    drawSteps();
    const newStep = el('input', { class: 'input', maxlength: '80', placeholder: t('goals.stepPh') });
    newStep.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const v = newStep.value.trim();
      if (v.length < 1) return;
      steps.push({ title: v, done: false, position: steps.length });
      newStep.value = '';
      drawSteps();
    });

    let m = null;
    m = LF.ui.modal({
      title: isNew ? t('goals.new') : t('goals.edit'),
      wide: true,
      body: el('div', { class: 'col', style: { gap: '14px' } },
        LF.ui.field(t('goals.name'), name),
        LF.ui.field(t('tasks.desc'), desc, { hint: t('common.optional') }),
        el('div', { class: 'form-grid' },
          LF.ui.field(t('goals.category'), category),
          LF.ui.field(t('projects.status'), status),
          LF.ui.field(t('projects.startDate'), date, { hint: t('common.optional') }),
          LF.ui.field(t('projects.endDate'), deadline, { hint: t('common.optional') })),
        el('div', { class: 'card card-pad', style: { background: 'var(--surface-2)', boxShadow: 'none' } },
          el('div', { class: 'strong small', style: { marginBottom: '8px' }, text: t('goals.steps') }),
          el('div', { class: 'xs faint', style: { marginBottom: '8px' }, text: t('goals.stepsHint') }),
          stepList,
          el('div', { class: 'row', style: { marginTop: '8px' } }, newStep)),
        progWrap,
        err),
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('goals.deleteTitle'),
              message: t('goals.deleteConfirm', { name: g.name }),
            });
            if (!okC) return;
            const sts = await LF.db.list('goalSteps', { predicate: s => s.goalId === goalIn.id });
            for (const s of sts) await LF.db.delete('goalSteps', s.id);
            await LF.db.delete('goals', goalIn.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            const nameV = name.value.trim();
            if (nameV.length < 2) { err.textContent = t('goals.errName'); err.style.display = 'block'; return; }
            if (date.value && deadline.value && deadline.value < date.value) {
              err.textContent = t('projects.errDates'); err.style.display = 'block'; return;
            }
            const saved = await LF.db.put('goals', {
              id: g.id, name: nameV, description: desc.value.trim(),
              category: category.value, date: date.value || null,
              deadline: deadline.value || null,
              progress: +progRange.value || 0,
              status: status.value, createdAt: g.createdAt,
            });
            /* persist steps: delete removed, upsert kept */
            const old = await LF.db.list('goalSteps', { predicate: s => s.goalId === saved.id });
            const keptIds = steps.filter(s => s.id).map(s => s.id);
            for (const o of old) {
              if (keptIds.indexOf(o.id) === -1) await LF.db.delete('goalSteps', o.id);
            }
            for (const s of steps) {
              await LF.db.put('goalSteps', {
                id: s.id, goalId: saved.id, title: s.title,
                done: !!s.done, position: steps.indexOf(s),
                createdAt: s.createdAt,
              });
            }
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone(isNew ? 'new' : 'edit');
          },
        },
      ],
    });
    setTimeout(() => name.focus(), 30);
  };

  LF.views = LF.views || {};
  LF.views['app/goals'] = async function () { await view.render(); };
  LF.goalsView = view;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/notes.js ===== */
/* ============================================================
   LifeFlow — Notes view (الملاحظات)
   Quick notes: search, types, pin, edit, delete (spec #22).
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  const TYPES = ['general', 'work', 'study', 'home', 'project', 'idea', 'personal'];
  const TYPE_ICON = {
    general: 'edit', work: 'briefcase', study: 'book', home: 'home',
    project: 'folder', idea: 'flame', personal: 'user',
  };

  /* ============================================================
     View
     ============================================================ */
  const view = {
    q: '',
    type: 'all',

    async render(viewEl) {
      viewEl = await LF.shell.ensure();
      view._viewEl = viewEl;
      await view.draw();
    },

    async draw() {
      const t = LF.i18n.t;
      const viewEl = view._viewEl;
      if (!viewEl) return;

      const notes = await LF.db.list('notes', {});

      let list = notes.slice();
      if (view.type !== 'all') list = list.filter(n => (n.type || 'general') === view.type);
      if (view.q) {
        const q = view.q.toLowerCase();
        list = list.filter(n =>
          (n.title || '').toLowerCase().indexOf(q) !== -1 ||
          (n.body || '').toLowerCase().indexOf(q) !== -1);
      }
      /* pinned first, then newest */
      list.sort((a, b) => {
        const pa = a.pinned ? 1 : 0, pb = b.pinned ? 1 : 0;
        if (pa !== pb) return pb - pa;
        return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '');
      });

      /* page */
      const page = el('div', { class: 'page' });
      page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
        el('div', { class: 'grow' },
          el('h1', { text: t('nav.notes') }),
          el('div', { class: 'page-sub', text: t('notes.sub', { n: list.length }) })),
        el('button', {
          class: 'btn primary', onclick: () => LF.modals.note(null, () => view.draw()),
        }, ic('plus', 16), t('notes.new'))));

      /* toolbar: search + type chips */
      const search = el('input', {
        class: 'input', type: 'search', value: view.q,
        placeholder: t('notes.searchPh'), 'aria-label': t('common.search'),
        style: { maxWidth: '260px' },
      });
      search.addEventListener('input', LF.util.debounce(() => { view.q = search.value; view.draw(); }, 250));

      const chips = el('div', { class: 'row wrap', style: { gap: '6px' } });
      [['all', null]].concat(TYPES.map(tp => [tp, TYPE_ICON[tp]])).forEach(([id, icon]) => {
        const c = el('button', {
          class: 'chip' + (view.type === id ? ' on' : ''),
          'aria-pressed': view.type === id ? 'true' : 'false',
          text: t(id === 'all' ? 'notes.allTypes' : 'notes.t_' + id),
        }, icon ? ic(icon, 12) : null);
        c.addEventListener('click', () => { view.type = id; view.draw(); });
        chips.appendChild(c);
      });
      page.appendChild(el('div', { class: 'card card-pad', style: { marginBottom: '14px' } },
        el('div', { class: 'row wrap between', style: { gap: '10px' } }, chips, search)));

      /* list */
      if (!list.length) {
        const hasAny = notes.length > 0;
        page.appendChild(el('div', { class: 'card' },
          LF.ui.empty('edit', hasAny ? t('notes.emptyFiltered') : t('notes.empty'),
            hasAny ? '' : t('notes.emptyHint'),
            el('button', {
              class: 'btn primary',
              onclick: () => LF.modals.note(null, () => view.draw()),
            }, ic('plus', 15), t('notes.new')))));
      } else {
        const grid = el('div', { class: 'notes-grid' });
        list.forEach(n => grid.appendChild(noteCard(n)));
        page.appendChild(grid);
      }

      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  function noteCard(n) {
    const t = LF.i18n.t;
    const pinBtn = el('button', {
      class: 'icon-btn sm', 'aria-label': t('notes.pin'),
      title: t('notes.pin'), style: n.pinned ? 'color: var(--accent-strong)' : '',
      onclick: async (e) => {
        e.stopPropagation();
        n.pinned = !n.pinned;
        await LF.db.put('notes', n);
        view.draw();
      },
    }, ic('star', 14));

    const card = el('div', {
      class: 'card card-pad note-card', role: 'button', tabindex: '0',
      style: n.pinned ? 'border-color: var(--accent)' : '',
    },
      el('div', { class: 'row between', style: { gap: '6px', marginBottom: '6px' } },
        el('span', { class: 'mchip' }, ic(TYPE_ICON[n.type] || 'edit', 11),
          t('notes.t_' + (n.type || 'general'))),
        pinBtn),
      n.title ? el('div', { class: 'strong small', style: { marginBottom: '4px' }, text: n.title }) : null,
      el('div', { class: 'small muted note-body', text: (n.body || '').slice(0, 220) }),
      el('div', { class: 'xs faint num', style: { marginTop: '8px' },
        text: LF.i18n.fmtDate(LF.util.fromYmd((n.updatedAt || n.createdAt || '').slice(0, 10)), 'medium') }));
    card.addEventListener('click', () => LF.modals.note(n, () => view.draw()));
    return card;
  }

  /* ============================================================
     Note modal
     ============================================================ */
  LF.modals.note = async function noteModal(noteIn, onDone) {
    const t = LF.i18n.t;
    const isNew = !noteIn;
    const n = noteIn ? LF.util.clone(noteIn) : {
      title: '', body: '', type: 'general', pinned: false,
    };

    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });
    const title = el('input', { class: 'input', maxlength: '80', value: n.title || '', placeholder: t('notes.titlePh') });
    const body = el('textarea', {
      class: 'textarea', style: { minHeight: '140px', lineHeight: '1.7' },
      text: n.body || '',
    });
    const type = el('select', { class: 'select' });
    TYPES.forEach(tp => type.appendChild((function (o) {
      o.textContent = t('notes.t_' + tp); return o;
    })(el('option', { value: tp, selected: (n.type || 'general') === tp ? '' : null }))));
    const pinned = LF.ui.switchEl(!!n.pinned, v => { n.pinned = v; }, t('notes.pin'));

    let m = null;
    m = LF.ui.modal({
      title: isNew ? t('notes.new') : t('notes.edit'),
      wide: true,
      body: el('div', { class: 'col', style: { gap: '14px' } },
        LF.ui.field(t('notes.title'), title, { hint: t('common.optional') }),
        LF.ui.field(t('notes.body'), body),
        el('div', { class: 'row between', style: { gap: '10px' } },
          LF.ui.field(t('notes.type'), type),
          el('div', {}, pinned)),
        err),
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('notes.deleteTitle'),
              message: t('notes.deleteConfirm', { title: n.title || n.body.slice(0, 30) }),
            });
            if (!okC) return;
            await LF.db.delete('notes', noteIn.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            if (!title.value.trim() && !body.value.trim()) {
              err.textContent = t('notes.errEmpty'); err.style.display = 'block'; return;
            }
            await LF.db.put('notes', {
              id: n.id, title: title.value.trim(), body: body.value,
              type: type.value, pinned: !!n.pinned,
              createdAt: n.createdAt, updatedAt: new Date().toISOString(),
            });
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone(isNew ? 'new' : 'edit');
          },
        },
      ],
    });
    setTimeout(() => (n.title ? body : title).focus(), 30);
  };

  LF.views = LF.views || {};
  LF.views['app/notes'] = async function () { await view.render(); };
  LF.notesView = view;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/reminders.js ===== */
/* ============================================================
   LifeFlow — Reminders (التذكيرات)
   General reminder system (spec #23): one-shot or recurring,
   linked to anything (task/bill/debt/exam/habit/goal/custom).
   Delivery: in-app toast + bell notification — PWA system
   notification only when the browser supports it; never push-only.
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  const LINK_TYPES = ['none', 'task', 'bill', 'debt', 'shopping', 'exam', 'habit', 'goal', 'event'];

  function optionEl(sel, value, labelKeyOrText, isI18n) {
    const o = el('option', { value, selected: String(value) === String(sel) ? '' : null });
    o.textContent = isI18n ? LF.i18n.t(labelKeyOrText) : labelKeyOrText;
    return o;
  }

  function nowTime() {
    const d = new Date();
    return LF.util.pad2(d.getHours()) + ':' + LF.util.pad2(d.getMinutes());
  }

  /* ============================================================
     Due checker — in-app + system notification (when supported)
     ============================================================ */
  const reminders = {
    _timer: null,

    start() {
      reminders.checkDue();
      if (reminders._timer) clearInterval(reminders._timer);
      reminders._timer = setInterval(() => reminders.checkDue(), 60000);
    },

    stop() {
      if (reminders._timer) clearInterval(reminders._timer);
      reminders._timer = null;
    },

    async checkDue() {
      if (!LF.auth || !LF.auth.currentId()) return;
      const t = LF.i18n.t;
      const today = LF.util.todayYmd();
      let list = [];
      try { list = await LF.db.list('reminders', {}); } catch (e) { return; }
      for (const r of list) {
        if (r.notifiedAt) continue;
        if (!L().reminderDue(r, today, nowTime())) continue;
        r.notifiedAt = new Date().toISOString();
        await LF.db.put('reminders', r);
        /* 1) in-app bell record */
        await LF.db.put('notifications', {
          title: r.title || t('reminders.title'),
          body: t('reminders.dueAt', {
            date: LF.i18n.fmtDate(LF.util.fromYmd(r.date), 'medium'),
            time: r.time || '',
          }),
          read: false,
        });
        /* 2) visible toast */
        LF.ui.toast('🔔 ' + (r.title || t('reminders.title')), { type: 'info' });
        /* 3) system notification — only if supported & permitted */
        await reminders.showSystem('LifeFlow — ' + t('nav.reminders'), {
          body: r.title || t('reminders.title'),
          tag: 'lf-reminder-' + (r.id || ''),
        });
      }
    },

    /** System notification. Prefers the service-worker path (required on Android Chrome,
        where `new Notification()` throws), falls back to the constructor (desktop). */
    async showSystem(title, opts) {
      try {
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
        const o = Object.assign({ icon: './icon-192.png', badge: './icon-192.png' }, opts || {});
        if (root.navigator && navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && reg.showNotification) { await reg.showNotification(title, o); return true; }
        }
        new Notification(title, o);
        return true;
      } catch (e) { return false; }
    },

    /** ask for notification permission (from settings/reminders UI) */
    async requestPermission() {
      try {
        if (typeof Notification === 'undefined') return 'unsupported';
        if (Notification.permission === 'granted') return 'granted';
        return await Notification.requestPermission();
      } catch (e) { return 'unsupported'; }
    },
  };

  /* ============================================================
     View
     ============================================================ */
  const view = {
    tab: 'upcoming',   // upcoming | done

    async render(viewEl) {
      viewEl = await LF.shell.ensure();
      view._viewEl = viewEl;
      await view.draw();
    },

    async draw() {
      const t = LF.i18n.t;
      const viewEl = view._viewEl;
      if (!viewEl) return;

      const list = await LF.db.list('reminders', {});
      const today = LF.util.todayYmd();

      const open = list.filter(r => !r.doneAt);
      const overdue = open.filter(r => r.date < today ||
        (r.date === today && (!r.time || r.time <= nowTime())));
      const upcoming = open.filter(r => r.date > today ||
        (r.date === today && r.time > nowTime()));
      const done = list.filter(r => r.doneAt);

      const shown = (view.tab === 'done' ? done : open).slice()
        .sort((a, b) => (a.date + (a.time || '99')).localeCompare(b.date + (b.time || '99')));

      /* page */
      const page = el('div', { class: 'page' });
      page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
        el('div', { class: 'grow' },
          el('h1', { text: t('nav.reminders') }),
          el('div', { class: 'page-sub', text: overdue.length
            ? t('reminders.subOverdue', { n: LF.i18n.num(overdue.length) })
            : t('reminders.sub', { n: LF.i18n.num(open.length) }) })),
        el('button', {
          class: 'btn primary', onclick: () => LF.modals.reminder(null, {}, () => view.draw()),
        }, ic('plus', 16), t('reminders.new'))));

      /* enable system notifications hint (never push-only) */
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        const en = el('button', {
          class: 'btn ghost sm',
          onclick: async () => {
            const res = await reminders.requestPermission();
            LF.ui.toast(res === 'granted' ? t('reminders.notifOn') : t('reminders.notifOff'),
              { type: res === 'granted' ? 'ok' : 'info' });
            view.draw();
          },
        }, ic('bell', 13), t('reminders.enableNotif'));
        page.appendChild(el('div', { class: 'banner info', style: { marginBottom: '12px' } },
          ic('info', 16),
          el('div', { class: 'grow small', text: t('reminders.inAppNote') }),
          en));
      }

      /* tabs */
      const tabs = LF.ui.seg([
        { value: 'upcoming', label: t('reminders.tUpcoming') + ' (' + LF.i18n.num(upcoming.length) + ')' },
        { value: 'done', label: t('reminders.tDone') + ' (' + LF.i18n.num(done.length) + ')' },
      ], view.tab, v => { view.tab = v; view.draw(); });
      page.appendChild(el('div', { style: { marginBottom: '14px' } }, tabs));

      if (!shown.length) {
        page.appendChild(el('div', { class: 'card' },
          LF.ui.empty('bell', t(view.tab === 'done' ? 'reminders.emptyDone' : 'reminders.empty'),
            t('reminders.emptyHint'),
            view.tab === 'upcoming' ? el('button', {
              class: 'btn primary',
              onclick: () => LF.modals.reminder(null, {}, () => view.draw()),
            }, ic('plus', 15), t('reminders.new')) : null)));
      } else {
        const wrap = el('div', { class: 'col', style: { gap: '8px' } });
        shown.forEach(r => wrap.appendChild(reminderRow(r, today)));
        page.appendChild(wrap);
      }

      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  function reminderRow(r, today) {
    const t = LF.i18n.t;
    const isOverdue = !r.doneAt && r.date < today;

    const meta = el('div', { class: 'meta' });
    meta.appendChild(el('span', {
      class: 'mchip' + (isOverdue ? ' danger' : ''),
    }, ic('calendar', 11),
      (isOverdue ? t('tasks.overdueChip') + ' · ' : '') +
      LF.i18n.fmtDate(LF.util.fromYmd(r.date), 'medium') +
      (r.time ? ' · ' + r.time : '')));
    if (r.linkType && r.linkType !== 'none') {
      meta.appendChild(el('span', { class: 'mchip' }, ic('link', 11), t('reminders.l_' + r.linkType)));
    }
    if (r.recurrence && r.recurrence.type !== 'none') {
      meta.appendChild(el('span', { class: 'mchip' }, ic('refresh', 11), t('tasks.rec_' + r.recurrence.type)));
    }
    if (r.refText) meta.appendChild(el('span', { class: 'mchip', text: r.refText }));

    const doneBtn = el('button', {
      class: 'btn soft sm',
      onclick: async (e) => {
        e.stopPropagation();
        if (r.recurrence && r.recurrence.type !== 'none') {
          const nd = L().nextDate(r.date, r.recurrence);
          if (nd) {
            r.date = nd;
            r.notifiedAt = null;
            await LF.db.put('reminders', r);
            LF.ui.toast(t('reminders.rescheduled', {
              date: LF.i18n.fmtDate(LF.util.fromYmd(nd), 'medium'),
            }), { type: 'ok' });
          } else {
            r.doneAt = new Date().toISOString();
            await LF.db.put('reminders', r);
          }
        } else {
          r.doneAt = new Date().toISOString();
          await LF.db.put('reminders', r);
        }
        view.draw();
      },
    }, ic('check', 13), t('reminders.markDone'));

    const row = el('div', { class: 'task-row' + (r.doneAt ? ' done' : '') + (isOverdue ? ' overdue' : ''), role: 'button', tabindex: '0' },
      el('div', { class: 'grow', style: { minWidth: 0 } },
        el('div', { class: 'task-title strong small truncate', text: r.title || '—' }),
        meta),
      doneBtn);
    row.addEventListener('click', () => LF.modals.reminder(r, {}, () => view.draw()));
    return row;
  }

  /* ============================================================
     Reminder modal — prefill: {date, time, title}
     ============================================================ */
  LF.modals.reminder = async function reminderModal(reminderIn, prefill, onDone) {
    const t = LF.i18n.t;
    const isNew = !reminderIn;
    const r = reminderIn ? LF.util.clone(reminderIn) : {
      title: (prefill && prefill.title) || '',
      date: (prefill && prefill.date) || LF.util.todayYmd(),
      time: (prefill && prefill.time) || '09:00',
      linkType: 'none', refText: '',
      recurrence: { type: 'none', every: 1, until: null },
    };
    if (!r.recurrence) r.recurrence = { type: 'none', every: 1, until: null };

    const err = el('div', { class: 'field-error', role: 'alert', style: { display: 'none' } });
    const title = el('input', { class: 'input', maxlength: '120', value: r.title || '' });
    const date = el('input', { class: 'input', type: 'date', value: r.date || '' });
    const time = el('input', { class: 'input', type: 'time', value: r.time || '' });
    const refText = el('input', {
      class: 'input', maxlength: '80', value: r.refText || '',
      placeholder: t('reminders.refPh'),
    });
    const linkType = el('select', { class: 'select' });
    LINK_TYPES.forEach(lt => linkType.appendChild(optionEl(r.linkType, lt, 'reminders.l_' + lt, true)));

    const recType = el('select', { class: 'select' });
    ['none', 'daily', 'weekly', 'monthly', 'yearly'].forEach(rp =>
      recType.appendChild(optionEl(r.recurrence.type, rp, 'tasks.rec_' + rp, true)));

    let m = null;
    m = LF.ui.modal({
      title: isNew ? t('reminders.new') : t('reminders.edit'),
      body: el('div', { class: 'col', style: { gap: '14px' } },
        LF.ui.field(t('reminders.title'), title),
        el('div', { class: 'form-grid' },
          LF.ui.field(t('expenses.date'), date),
          LF.ui.field(t('expenses.time'), time, { hint: t('common.optional') })),
        el('div', { class: 'form-grid' },
          LF.ui.field(t('reminders.linkTo'), linkType),
          LF.ui.field(t('reminders.ref'), refText, { hint: t('common.optional') })),
        LF.ui.field(t('tasks.recurrence'), recType),
        err),
      actions: [
        !isNew ? {
          label: t('common.del'), class: 'danger-soft', keepOpen: true,
          onClick: async () => {
            const okC = await LF.ui.confirm({
              title: t('reminders.deleteTitle'),
              message: t('reminders.deleteConfirm', { title: r.title || '' }),
            });
            if (!okC) return;
            await LF.db.delete('reminders', reminderIn.id);
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone('delete');
          },
        } : null,
        { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
        {
          label: t('common.save'), class: 'primary', keepOpen: true,
          onClick: async () => {
            if (title.value.trim().length < 2) { err.textContent = t('reminders.errTitle'); err.style.display = 'block'; return; }
            if (!date.value) { err.textContent = t('expenses.errDate'); err.style.display = 'block'; return; }
            if (!L().validTime(time.value)) { err.textContent = t('tasks.errTime'); err.style.display = 'block'; return; }
            await LF.db.put('reminders', {
              id: r.id, title: title.value.trim(),
              date: date.value, time: time.value || '',
              linkType: linkType.value, refText: refText.value.trim(),
              recurrence: { type: recType.value, every: 1, until: null },
              notifiedAt: r.notifiedAt || null,
              doneAt: r.doneAt || null,
              createdAt: r.createdAt,
            });
            m.close();
            LF.ui.toast(t('common.saved'), { type: 'ok' });
            onDone && onDone(isNew ? 'new' : 'edit');
          },
        },
      ],
    });
    setTimeout(() => title.focus(), 30);
  };

  LF.views = LF.views || {};
  LF.views['app/reminders'] = async function () { await view.render(); };
  LF.remindersView = view;
  LF.reminders = reminders;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/analytics.js ===== */
/* ============================================================
   LifeFlow — Analytics (التحليلات)
   Clear, calm charts per domain (spec #24): money, time,
   study, work, home, habits. Month cursor; CSS-only charts.
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  function fmtMin(min) {
    const t = LF.i18n.t;
    const h = Math.floor(min / 60), m = min % 60;
    if (h && m) return LF.i18n.num(h) + ' ' + t('study.hourShort') + ' ' + LF.i18n.num(m) + ' ' + t('study.minShort');
    if (h) return LF.i18n.num(h) + ' ' + t('study.hourShort');
    return LF.i18n.num(m) + ' ' + t('study.minShort');
  }

  /* ============================================================
     View
     ============================================================ */
  const view = {
    month: null,

    async render(viewEl) {
      viewEl = await LF.shell.ensure();
      view._viewEl = viewEl;
      if (!view.month) view.month = LF.util.todayYmd().slice(0, 7);
      await view.draw();
    },

    async draw() {
      const t = LF.i18n.t;
      const viewEl = view._viewEl;
      if (!viewEl) return;

      const bounds = L().monthBounds(view.month + '-01');
      const today = LF.util.todayYmd();
      const weekStart = (LF.store.settings || {}).weekStart == null ? 0 : LF.store.settings.weekStart;

      const [tasks, expenses, incomes, budgets, debts, debtPays, cats, sessions, reviews, homeTasks, lists, shopItems, exams, assignments, habitLogs, projects] =
        await Promise.all([
          LF.db.list('tasks', {}), LF.db.list('expenses', {}), LF.db.list('incomes', {}),
          LF.db.list('budgets', {}), LF.db.list('debts', {}), LF.db.list('debtPayments', {}),
          LF.db.list('expenseCategories', {}), LF.db.list('studySessions', {}),
          LF.db.list('dayReviews', {}), LF.db.list('homeTasks', {}),
          LF.db.list('shoppingLists', {}), LF.db.list('shoppingItems', {}),
          LF.db.list('exams', {}), LF.db.list('assignments', {}),
          LF.db.list('habitLogs', {}), LF.db.list('projects', {}),
        ]);

      const feats = LF.store.feature
        ? { study: LF.store.feature('study'), work: LF.store.feature('work'), home: LF.store.feature('home'), habits: LF.store.feature('habits') }
        : { study: true, work: true, home: true, habits: true };

      const page = el('div', { class: 'page' });

      /* header + month nav */
      const prevM = el('button', { class: 'icon-btn', 'aria-label': t('calendar.prev') });
      const pmIc = ic('chevron-right', 16); pmIc.classList.add('icon-flip-ltr'); prevM.appendChild(pmIc);
      prevM.addEventListener('click', () => { view.month = L().addMonthsClamped(view.month + '-01', -1).slice(0, 7); view.draw(); });
      const nextM = el('button', { class: 'icon-btn', 'aria-label': t('calendar.next') }, ic('chevron-left', 16));
      nextM.addEventListener('click', () => { view.month = L().addMonthsClamped(view.month + '-01', 1).slice(0, 7); view.draw(); });

      page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
        el('div', { class: 'grow' },
          el('h1', { text: t('nav.analytics') }),
          el('div', { class: 'page-sub', text: LF.i18n.fmtDate(LF.util.fromYmd(bounds.from), 'monthYear') })),
        el('div', { class: 'row', style: { gap: '8px' } },
          prevM,
          el('button', {
            class: 'btn soft sm', style: { minWidth: '120px' },
            onclick: () => { view.month = today.slice(0, 7); view.draw(); },
          }, el('strong', { text: LF.i18n.fmtDate(LF.util.fromYmd(bounds.from), 'monthYear') })),
          nextM,
          el('button', {
            class: 'btn ghost', onclick: () => { location.hash = '#/app/reports'; },
            title: t('nav.reports'),
          }, ic('clipboard', 15), t('nav.reports')))));

      /* ============ MONEY ============ */
      const mExp = expenses.filter(e => e.date >= bounds.from && e.date <= bounds.to);
      const mInc = incomes.filter(e => e.date >= bounds.from && e.date <= bounds.to);
      const spent = mExp.reduce((s, e) => s + (e.amount || 0), 0);
      const earned = mInc.reduce((s, e) => s + (e.amount || 0), 0);
      const net = earned - spent;
      const iouLeft = debts.filter(d => d.direction !== 'owed')
        .reduce((s, d) => s + Math.max(0, L().debtStatus(d, debtPays, today).remaining), 0);
      const owedLeft = debts.filter(d => d.direction === 'owed')
        .reduce((s, d) => s + Math.max(0, L().debtStatus(d, debtPays, today).remaining), 0);

      const money = el('div', { class: 'card card-pad section' },
        el('div', { class: 'strong small', style: { marginBottom: '12px' } }, ic('wallet', 14), ' ' + t('analytics.money')));
      money.appendChild(el('div', { class: 'kpi-grid', style: { marginBottom: '12px' } },
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('income.kIncome') }),
          el('div', { class: 'kpi-value pos', text: LF.i18n.money(earned) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('income.kExpense') }),
          el('div', { class: 'kpi-value neg', text: LF.i18n.money(spent) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('income.kNet') }),
          el('div', { class: 'kpi-value ' + (net >= 0 ? 'pos' : 'neg'),
            text: (net > 0 ? '+' : '') + LF.i18n.money(net) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('analytics.netDebts') }),
          el('div', { class: 'kpi-value', style: { fontSize: 'var(--fs-l)' },
            text: (owedLeft - iouLeft >= 0 ? '+' : '') + LF.i18n.money(owedLeft - iouLeft) }),
          el('div', { class: 'kpi-sub', text: t('analytics.youOwe', { a: LF.i18n.money(iouLeft), b: LF.i18n.money(owedLeft) }) }))));

      /* 6-month income vs expense trend */
      const trend = L().monthTrend(incomes, expenses, 6, today);
      const maxV = Math.max(1, ...trend.map(r => Math.max(r.income, r.expense)));
      const tRows = el('div', { class: 'col', style: { gap: '8px' } });
      trend.forEach(r => {
        tRows.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'center' } },
          el('span', { class: 'small muted', style: { minWidth: '86px' }, text: LF.i18n.fmtDate(LF.util.fromYmd(r.ym + '-01'), 'monthYear') }),
          el('div', { class: 'grow trend-bars' },
            el('div', { class: 'trend-bar inc', style: { width: Math.max(2, Math.round((r.income / maxV) * 100)) + '%' } }),
            el('div', { class: 'trend-bar exp', style: { width: Math.max(2, Math.round((r.expense / maxV) * 100)) + '%' } })),
          el('span', { class: 'small num ' + (r.net >= 0 ? 'pos' : 'neg'), style: { minWidth: '90px', textAlign: 'end' },
            text: (r.net > 0 ? '+' : '') + LF.i18n.money(r.net) })));
      });
      money.appendChild(tRows);

      /* top categories this month */
      const cMap = {};
      cats.forEach(c => { cMap[c.id] = c; });
      const top = L().topCategories(mExp, 5);
      if (top.length) {
        const maxCat = top[0].total;
        const totalSpent = spent || 1;
        money.appendChild(el('div', { class: 'strong small', style: { margin: '14px 0 8px' }, text: t('budgets.topCats') }));
        top.forEach(x => {
          const c = cMap[x.categoryId];
          money.appendChild(el('div', { class: 'row', style: { gap: '10px', alignItems: 'center', marginBottom: '7px' } },
            el('span', { class: 'cat-dot', style: { background: (c || {}).color || 'var(--muted)' } }),
            el('span', { class: 'small grow truncate', text: (c && (c.name || t('expenses.cat_' + c.key))) || t('expenses.otherCat') }),
            el('div', { class: 'progress', style: { maxWidth: '150px', minWidth: '70px' } },
              el('div', { style: { width: Math.max(3, Math.round((x.total / maxCat) * 100)) + '%' } })),
            el('span', { class: 'xs num muted', style: { minWidth: '100px', textAlign: 'end' },
              text: LF.i18n.money(x.total) + ' · ' + Math.round((x.total / totalSpent) * 100) + '%' })));
        });
      }
      page.appendChild(money);

      /* ============ TIME / TASKS ============ */
      const ts = L().taskStats(tasks, bounds.from, bounds.to);
      const studyMin = L().sumMinutes(sessions, bounds.from, bounds.to);
      const workMin = L().sumMinutes(reviews, bounds.from, bounds.to, 'workMinutes');
      const actualMin = studyMin + workMin;

      const timeCard = el('div', { class: 'card card-pad section' },
        el('div', { class: 'strong small', style: { marginBottom: '12px' } }, ic('list-checks', 14), ' ' + t('analytics.time')));
      timeCard.appendChild(el('div', { class: 'kpi-grid', style: { marginBottom: '12px' } },
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('analytics.kTasks') }),
          el('div', { class: 'kpi-value', text: LF.i18n.num(ts.total) }),
          el('div', { class: 'kpi-sub', text: t('analytics.kDoneSub', { n: LF.i18n.num(ts.done) }) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('analytics.completion') }),
          el('div', { class: 'kpi-value pos', text: LF.i18n.num(ts.pct) + '%' })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('analytics.plannedTime') }),
          el('div', { class: 'kpi-value', style: { fontSize: 'var(--fs-l)' }, text: fmtMin(ts.plannedMinutes) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('analytics.actualTime') }),
          el('div', { class: 'kpi-value', style: { fontSize: 'var(--fs-l)' }, text: actualMin ? fmtMin(actualMin) : '—' }),
          el('div', { class: 'kpi-sub', text: t('analytics.actualTimeHint') }))));

      /* daily completions — last 14 days ending today (or month end) */
      const chartEnd = today < bounds.to ? today : bounds.to;
      const start14 = (() => {
        const d = LF.util.addDays(LF.util.fromYmd(chartEnd), -13);
        return d < LF.util.fromYmd(bounds.from) ? bounds.from : LF.util.ymd(d);
      })();
      const comps = L().dailyCompletions(tasks, start14, chartEnd);
      const maxComp = Math.max(1, ...comps.map(c => c.count));
      const bars = el('div', { class: 'row', style: { gap: '5px', alignItems: 'flex-end', height: '90px' } });
      comps.forEach(c => {
        bars.appendChild(el('div', {
          class: 'bar-col', title: c.date + ' — ' + LF.i18n.num(c.count),
        },
          el('span', { class: 'xs faint num', text: c.count ? LF.i18n.num(c.count) : '' }),
          el('div', { class: 'vbar' + (c.count ? '' : ' muted'),
            style: { height: Math.max(3, Math.round((c.count / maxComp) * 60)) + 'px' } }),
          el('span', { class: 'xs muted num', text: c.date.slice(8, 10) })));
      });
      timeCard.appendChild(el('div', { class: 'strong small', style: { marginBottom: '10px' }, text: t('analytics.completions') }));
      timeCard.appendChild(bars);
      page.appendChild(timeCard);

      /* ============ STUDY (optional) ============ */
      if (feats.study) {
        const aSt = L().assignmentStats(assignments, today);
        const examsIn = exams.filter(e => e.date >= bounds.from && e.date <= bounds.to);
        const study = el('div', { class: 'card card-pad section' },
          el('div', { class: 'strong small', style: { marginBottom: '12px' } }, ic('book', 14), ' ' + t('nav.study')));
        study.appendChild(el('div', { class: 'kpi-grid' },
          el('div', { class: 'kpi' },
            el('div', { class: 'kpi-label', text: t('study.kHours') }),
            el('div', { class: 'kpi-value', text: fmtMin(studyMin) })),
          el('div', { class: 'kpi' },
            el('div', { class: 'kpi-label', text: t('study.kAssignments') }),
            el('div', { class: 'kpi-value', text: LF.i18n.num(aSt.open) }),
            aSt.overdue ? el('div', { class: 'kpi-sub neg', text: t('study.kOverdue', { n: LF.i18n.num(aSt.overdue) }) }) : null),
          el('div', { class: 'kpi' },
            el('div', { class: 'kpi-label', text: t('analytics.examsThisMonth') }),
            el('div', { class: 'kpi-value', text: LF.i18n.num(examsIn.length) }))));
        page.appendChild(study);
      }

      /* ============ WORK (optional) ============ */
      if (feats.work) {
        let wsId = null;
        try { wsId = (await LF.workHelpers.ensureWorkWorkspace()).id; } catch (e) { /* noop */ }
        const workTasks = tasks.filter(x => x.workspaceId === wsId);
        const wTs = L().taskStats(workTasks, bounds.from, bounds.to);
        const workProjects = projects.filter(p => p.workspaceId === wsId && p.status === 'active');
        const workCard = el('div', { class: 'card card-pad section' },
          el('div', { class: 'strong small', style: { marginBottom: '12px' } }, ic('briefcase', 14), ' ' + t('nav.work')));
        workCard.appendChild(el('div', { class: 'kpi-grid' },
          el('div', { class: 'kpi' },
            el('div', { class: 'kpi-label', text: t('analytics.tasksDone') }),
            el('div', { class: 'kpi-value', text: LF.i18n.num(wTs.done) + '/' + LF.i18n.num(wTs.total) })),
          el('div', { class: 'kpi' },
            el('div', { class: 'kpi-label', text: t('analytics.activeProjects') }),
            el('div', { class: 'kpi-value', text: LF.i18n.num(workProjects.length) })),
          el('div', { class: 'kpi' },
            el('div', { class: 'kpi-label', text: t('work.kHours') }),
            el('div', { class: 'kpi-value', text: fmtMin(workMin) }))));
        page.appendChild(workCard);
      }

      /* ============ HOME (optional) ============ */
      if (feats.home) {
        const hTs = L().taskStats(homeTasks, bounds.from, bounds.to);
        const shopSt = L().shoppingStats(shopItems);
        const billsCat = cats.find(c => c.key === 'bills');
        const billsCount = billsCat ? mExp.filter(e => e.categoryId === billsCat.id).length : 0;
        const billsSum = billsCat ? mExp.filter(e => e.categoryId === billsCat.id)
          .reduce((s, e) => s + (e.amount || 0), 0) : 0;
        const homeCard = el('div', { class: 'card card-pad section' },
          el('div', { class: 'strong small', style: { marginBottom: '12px' } }, ic('home', 14), ' ' + t('nav.home')));
        homeCard.appendChild(el('div', { class: 'kpi-grid' },
          el('div', { class: 'kpi' },
            el('div', { class: 'kpi-label', text: t('analytics.homeTasksDone') }),
            el('div', { class: 'kpi-value', text: LF.i18n.num(hTs.done) + '/' + LF.i18n.num(hTs.total) })),
          el('div', { class: 'kpi' },
            el('div', { class: 'kpi-label', text: t('analytics.itemsBought') }),
            el('div', { class: 'kpi-value', text: LF.i18n.num(shopSt.purchased) })),
          el('div', { class: 'kpi' },
            el('div', { class: 'kpi-label', text: t('analytics.billsThisMonth') }),
            el('div', { class: 'kpi-value', style: { fontSize: 'var(--fs-l)' }, text: LF.i18n.num(billsCount) }),
            billsSum ? el('div', { class: 'kpi-sub', text: LF.i18n.money(billsSum) }) : null)));
        page.appendChild(homeCard);
      }

      /* ============ HABITS (optional) ============ */
      if (feats.habits) {
        const habitLogsInRange = habitLogs.filter(l => l.date >= bounds.from && l.date <= bounds.to);
        const habitsCard = el('div', { class: 'card card-pad section' },
          el('div', { class: 'strong small', style: { marginBottom: '12px' } }, ic('flame', 14), ' ' + t('nav.habits')));
        habitsCard.appendChild(el('div', { class: 'kpi-grid' },
          el('div', { class: 'kpi' },
            el('div', { class: 'kpi-label', text: t('analytics.habitCheckins') }),
            el('div', { class: 'kpi-value', text: LF.i18n.num(habitLogsInRange.length) })),
          el('div', { class: 'kpi' },
            el('div', { class: 'kpi-label', text: t('analytics.activeDays') }),
            el('div', { class: 'kpi-value', text: LF.i18n.num(new Set(habitLogsInRange.map(l => l.date)).size) }))));
        page.appendChild(habitsCard);
      }

      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  LF.views = LF.views || {};
  LF.views['app/analytics'] = async function () { await view.render(); };
  LF.analyticsView = view;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/reports.js ===== */
/* ============================================================
   LifeFlow — Reports (التقارير)
   Today / week / month / year summaries + CSV export +
   print-friendly view (browser print → PDF, spec #25).
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  const PERIODS = [
    { id: 'today', days: 1 },
    { id: 'week', days: 7 },
    { id: 'month', days: 30 },
    { id: 'year', days: 365 },
  ];

  function periodBounds(id) {
    const today = LF.util.todayYmd();
    const d = LF.util.fromYmd(today);
    if (id === 'today') return { from: today, to: today, label: LF.i18n.fmtDate(d, 'full') };
    if (id === 'week') {
      const s = LF.util.startOfWeek(d, (LF.store.settings || {}).weekStart == null ? 0 : LF.store.settings.weekStart);
      return { from: LF.util.ymd(s), to: LF.util.ymd(LF.util.addDays(s, 6)),
        label: LF.i18n.fmtDate(s, 'medium') + ' → ' + LF.i18n.fmtDate(LF.util.addDays(s, 6), 'medium') };
    }
    if (id === 'month') {
      const b = L().monthBounds(today);
      return { from: b.from, to: b.to, label: LF.i18n.fmtDate(LF.util.fromYmd(b.from), 'monthYear') };
    }
    const y = today.slice(0, 4);
    return { from: y + '-01-01', to: y + '-12-31', label: y };
  }

  /* ============================================================
     View
     ============================================================ */
  const view = {
    period: 'month',

    async render(viewEl) {
      viewEl = await LF.shell.ensure();
      view._viewEl = viewEl;
      await view.draw();
    },

    async draw() {
      const t = LF.i18n.t;
      const viewEl = view._viewEl;
      if (!viewEl) return;

      const b = periodBounds(view.period);
      const today = LF.util.todayYmd();

      const [tasks, events, expenses, incomes, sessions, reviews, homeTasks, shopItems, debtPays, assignments] =
        await Promise.all([
          LF.db.list('tasks', {}), LF.db.list('events', {}),
          LF.db.list('expenses', {}), LF.db.list('incomes', {}),
          LF.db.list('studySessions', {}), LF.db.list('dayReviews', {}),
          LF.db.list('homeTasks', {}), LF.db.list('shoppingItems', {}),
          LF.db.list('debtPayments', {}), LF.db.list('assignments', {}),
        ]);

      const inR = (d) => d >= b.from && d <= b.to;
      const rExp = expenses.filter(e => inR(e.date));
      const rInc = incomes.filter(e => inR(e.date));
      const spent = rExp.reduce((s, e) => s + (e.amount || 0), 0);
      const earned = rInc.reduce((s, e) => s + (e.amount || 0), 0);
      const ts = L().taskStats(tasks, b.from, b.to);
      const rEvents = events.filter(e => inR(e.date));
      const studyMin = L().sumMinutes(sessions, b.from, b.to);
      const workMin = L().sumMinutes(reviews, b.from, b.to, 'workMinutes');
      const hTs = L().taskStats(homeTasks, b.from, b.to);
      const bought = shopItems.filter(i => i.purchased && i.actualPrice != null);
      const pays = debtPays.filter(p => inR(p.date));
      const aSt = L().assignmentStats(assignments.filter(a => a.dueDate && inR(a.dueDate)), today);

      /* report rows — used for both display and CSV */
      const rows = [
        [t('analytics.money'), t('income.kIncome'), LF.i18n.num(rInc.length), LF.i18n.money(earned)],
        [t('analytics.money'), t('income.kExpense'), LF.i18n.num(rExp.length), LF.i18n.money(spent)],
        [t('analytics.money'), t('income.kNet'), '', (earned - spent > 0 ? '+' : '') + LF.i18n.money(earned - spent)],
        [t('analytics.time'), t('analytics.kTasks'), LF.i18n.num(ts.total), t('analytics.kDoneSub', { n: LF.i18n.num(ts.done) }) + ' · ' + ts.pct + '%'],
        [t('analytics.time'), t('nav.calendar'), LF.i18n.num(rEvents.length), ''],
        [t('analytics.time'), t('analytics.plannedTime'), '', L().taskStats(tasks, b.from, b.to).plannedMinutes
          ? Math.round(ts.plannedMinutes / 6) / 10 + ' ' + t('study.hourShort') : '—'],
        [t('analytics.time'), t('analytics.actualTime'), '',
          (studyMin + workMin) ? Math.round((studyMin + workMin) / 6) / 10 + ' ' + t('study.hourShort') : '—'],
        [t('nav.home'), t('analytics.homeTasksDone'), LF.i18n.num(hTs.done) + '/' + LF.i18n.num(hTs.total), ''],
        [t('nav.home'), t('analytics.itemsBought'), LF.i18n.num(bought.length),
          bought.length ? LF.i18n.money(bought.reduce((s, i) => s + (i.actualPrice || 0), 0)) : ''],
        [t('nav.study'), t('study.kHours'), '', Math.round(studyMin / 6) / 10 + ' ' + t('study.hourShort')],
        [t('nav.study'), t('study.kAssignments'), LF.i18n.num(aSt.open), aSt.overdue ? t('study.kOverdue', { n: LF.i18n.num(aSt.overdue) }) : ''],
        [t('nav.work'), t('work.kHours'), '', Math.round(workMin / 6) / 10 + ' ' + t('study.hourShort')],
        [t('nav.debts'), t('debts.payments'), LF.i18n.num(pays.length),
          pays.length ? LF.i18n.money(pays.reduce((s, p) => s + (p.amount || 0), 0)) : ''],
      ];

      /* page */
      const page = el('div', { class: 'page' });
      page.appendChild(el('div', { class: 'page-head row', style: { alignItems: 'flex-start', gap: '12px' } },
        el('div', { class: 'grow' },
          el('h1', { text: t('nav.reports') }),
          el('div', { class: 'page-sub', text: b.label })),
        el('div', { class: 'row no-print', style: { gap: '8px' } },
          el('button', {
            class: 'btn ghost', onclick: () => exportCsv(rows, b),
          }, ic('download', 15), 'CSV'),
          el('button', {
            class: 'btn primary', onclick: () => { try { window.print(); } catch (e) { /* noop */ } },
          }, ic('download', 15), t('reports.printPdf')))));

      /* period tabs */
      const tabs = LF.ui.seg(PERIODS.map(p => ({ value: p.id, label: t('reports.p_' + p.id) })),
        view.period, v => { view.period = v; view.draw(); });
      page.appendChild(el('div', { class: 'no-print', style: { marginBottom: '14px' } }, tabs));

      /* printable header (visible only when printing) */
      page.appendChild(el('div', { class: 'print-only', style: { marginBottom: '12px' } },
        el('h2', { text: 'LifeFlow — ' + t('nav.reports') }),
        el('div', { class: 'muted small', text: b.label + ' · ' + new Date().toLocaleString() })));

      /* KPI summary */
      page.appendChild(el('div', { class: 'kpi-grid', style: { marginBottom: '14px' } },
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('income.kNet') }),
          el('div', { class: 'kpi-value ' + (earned - spent >= 0 ? 'pos' : 'neg'),
            text: (earned - spent > 0 ? '+' : '') + LF.i18n.money(earned - spent) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('analytics.completion') }),
          el('div', { class: 'kpi-value', text: ts.pct + '%' }),
          el('div', { class: 'kpi-sub', text: LF.i18n.num(ts.done) + '/' + LF.i18n.num(ts.total) })),
        el('div', { class: 'kpi' },
          el('div', { class: 'kpi-label', text: t('analytics.actualTime') }),
          el('div', { class: 'kpi-value', style: { fontSize: 'var(--fs-l)' },
            text: (studyMin + workMin) ? Math.round((studyMin + workMin) / 6) / 10 + ' ' + t('study.hourShort') : '—' }))));

      /* details table */
      const table = el('div', { class: 'card card-pad section' });
      rows.forEach(([sec, label, count, value]) => {
        table.appendChild(el('div', {
          class: 'row between',
          style: { gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border)' },
        },
          el('span', { class: 'small muted', style: { minWidth: '70px' }, text: sec }),
          el('span', { class: 'small strong grow', text: label }),
          count ? el('span', { class: 'small num muted', text: count }) : null,
          value ? el('span', { class: 'small num', text: value }) : null));
      });
      page.appendChild(table);

      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  function exportCsv(rows, b) {
    const t = LF.i18n.t;
    const lines = [];
    lines.push(['LifeFlow — ' + t('nav.reports'), b.label].join(','));
    lines.push('');
    lines.push(['Section', 'Item', 'Count', 'Value'].join(','));
    rows.forEach(r => {
      lines.push('"' + String(r[0]).replace(/"/g, '""') + '","' +
        String(r[1]).replace(/"/g, '""') + '","' +
        String(r[2]).replace(/"/g, '""') + '","' +
        String(r[3]).replace(/"/g, '""') + '"');
    });
    const name = 'lifeflow-report-' + b.from + '.csv';
    const okD = LF.ui.downloadFile(name, lines.join('\n'), 'text/csv');
    LF.ui.toast(okD ? t('reports.csvDone', { name }) : t('app.errorGeneric'), { type: okD ? 'ok' : 'error' });
  }

  LF.views = LF.views || {};
  LF.views['app/reports'] = async function () { await view.render(); };
  LF.reportsView = view;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/search.js ===== */
/* ============================================================
   LifeFlow — Global search (البحث الشامل)
   One query across the whole system with type filters
   (spec #26): contacts, debts, payments, tasks, events,
   notes, projects, expenses, habits, goals, shopping items.
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);
  const L = () => LF.logic;

  /* type registry: id → {icon, key, search, open} */
  const TYPES = [];

  function has(q, ...fields) {
    for (const f of fields) {
      if (f && String(f).toLowerCase().indexOf(q) !== -1) return true;
    }
    return false;
  }

  function register() {
    const t = LF.i18n.t;

    TYPES.push({
      id: 'contacts', icon: 'users', key: 'nav.contacts',
      async search(q) {
        const list = await LF.db.list('contacts', {});
        return list.filter(c => has(q, c.name, c.phone, c.email, c.notes))
          .map(c => ({
            title: c.name, sub: [c.phone, c.email].filter(Boolean).join(' · ') ||
              (c.relation ? t('contacts.rel_' + c.relation) : ''),
            open: () => { location.hash = '#/app/contacts/' + c.id; },
          }));
      },
    });

    TYPES.push({
      id: 'debts', icon: 'credit-card', key: 'nav.debts',
      async search(q) {
        const [debts, pays] = await Promise.all([
          LF.db.list('debts', {}), LF.db.list('debtPayments', {}),
        ]);
        const today = LF.util.todayYmd();
        return debts.filter(d => has(q, d.person, d.reason, d.notes))
          .map(d => {
            const st = LF.logic.debtStatus(d, pays, today);
            return {
              title: d.person || '—',
              sub: (d.direction === 'owed' ? t('debts.tabOwed') : t('debts.tabIou')) +
                ' · ' + t('debts.remaining', { amount: LF.i18n.money(Math.max(0, st.remaining)) }),
              open: () => { location.hash = '#/app/debts'; },
            };
          });
      },
    });

    TYPES.push({
      id: 'payments', icon: 'wallet', key: 'debts.payments',
      async search(q) {
        const [debts, pays] = await Promise.all([
          LF.db.list('debts', {}), LF.db.list('debtPayments', {}),
        ]);
        const byId = {};
        debts.forEach(d => { byId[d.id] = d; });
        return pays
          .filter(p => {
            const d = byId[p.debtId];
            return has(q, p.note, d && d.person);
          })
          .map(p => {
            const d = byId[p.debtId] || {};
            return {
              title: t('contacts.payment') + ' · ' + LF.i18n.money(p.amount || 0),
              sub: (d.person || '') + (p.note ? ' · ' + p.note : '') + ' · ' + p.date,
              open: () => { location.hash = '#/app/debts'; },
            };
          });
      },
    });

    TYPES.push({
      id: 'tasks', icon: 'list-checks', key: 'nav.tasks',
      async search(q) {
        const list = await LF.db.list('tasks', {});
        return list.filter(x => has(q, x.title, x.description, x.notes, x.category))
          .slice(0, 20).map(x => ({
            title: x.title,
            sub: t('tasks.st_' + (x.status || 'todo')) +
              (x.date ? ' · ' + LF.i18n.fmtDate(LF.util.fromYmd(x.date), 'medium') : ''),
            open: () => { LF.modals.task(x, {}, () => { /* refresh if visible */ }); },
          }));
      },
    });

    TYPES.push({
      id: 'events', icon: 'calendar', key: 'nav.calendar',
      async search(q) {
        const list = await LF.db.list('events', {});
        return list.filter(x => has(q, x.title, x.location, x.notes))
          .slice(0, 20).map(x => ({
            title: x.title,
            sub: t('calendar.ev_' + (x.type || 'other')) + ' · ' +
              LF.i18n.fmtDate(LF.util.fromYmd(x.date), 'medium') +
              (x.startTime ? ' · ' + x.startTime : ''),
            open: () => { LF.modals.event(x, {}, () => {}); },
          }));
      },
    });

    TYPES.push({
      id: 'notes', icon: 'edit', key: 'nav.notes',
      async search(q) {
        const list = await LF.db.list('notes', {});
        return list.filter(n => has(q, n.title, n.body))
          .slice(0, 20).map(n => ({
            title: n.title || (n.body || '').slice(0, 40),
            sub: t('notes.t_' + (n.type || 'general')) + ' · ' + (n.body || '').slice(0, 60),
            open: () => { LF.modals.note(n, () => {}); },
          }));
      },
    });

    TYPES.push({
      id: 'projects', icon: 'folder', key: 'nav.projects',
      async search(q) {
        const list = await LF.db.list('projects', {});
        return list.filter(p => has(q, p.name, p.description, p.notes))
          .map(p => ({
            title: p.name,
            sub: t('projects.st_' + (p.status || 'active')),
            open: () => { location.hash = '#/app/projects/' + p.id; },
          }));
      },
    });

    TYPES.push({
      id: 'expenses', icon: 'wallet', key: 'nav.expenses',
      async search(q) {
        const list = await LF.db.list('expenses', {});
        return list.filter(e => has(q, e.title, e.notes, e.entity, e.categoryLabel))
          .slice(0, 20).map(e => ({
            title: (e.title || e.categoryLabel || '—') + ' — ' + LF.i18n.money(e.amount || 0),
            sub: LF.i18n.fmtDate(LF.util.fromYmd(e.date), 'medium') + (e.entity ? ' · ' + e.entity : ''),
            open: () => { LF.modals.expense(e, {}, () => {}); },
          }));
      },
    });

    TYPES.push({
      id: 'habits', icon: 'flame', key: 'nav.habits',
      async search(q) {
        const list = await LF.db.list('habits', {});
        return list.filter(h => has(q, h.name)).map(h => ({
          title: h.name,
          sub: t('nav.habits'),
          open: () => { LF.modals.habit(h, () => {}); },
        }));
      },
    });

    TYPES.push({
      id: 'goals', icon: 'target', key: 'nav.goals',
      async search(q) {
        const list = await LF.db.list('goals', {});
        return list.filter(g => has(q, g.name, g.description)).map(g => ({
          title: g.name,
          sub: t('goals.c_' + (g.category || 'personal')),
          open: () => { LF.modals.goal(g, () => {}); },
        }));
      },
    });

    TYPES.push({
      id: 'shopping', icon: 'cart', key: 'nav.shopping',
      async search(q) {
        const list = await LF.db.list('shoppingItems', {});
        return list.filter(i => has(q, i.name, i.notes)).slice(0, 20).map(i => ({
          title: i.name + (i.purchased ? ' ✓' : ''),
          sub: t('nav.shopping'),
          open: () => { location.hash = '#/app/shopping'; },
        }));
      },
    });
  }

  /* ============================================================
     View
     ============================================================ */
  const view = {
    q: '',
    type: 'all',
    _results: {},

    async render(viewEl, parts) {
      viewEl = await LF.shell.ensure();
      view._viewEl = viewEl;
      if (!TYPES.length) register();
      /* deep link: #/app/search/<query> from the topbar button */
      if (parts && parts[0] && decodeURIComponent(parts[0]).trim()) {
        view.q = decodeURIComponent(parts[0]);
      }
      await view.draw();
    },

    async draw() {
      const t = LF.i18n.t;
      const viewEl = view._viewEl;
      if (!viewEl) return;

      const page = el('div', { class: 'page' });
      page.appendChild(el('div', { class: 'page-head' },
        el('h1', { text: t('search.title') }),
        el('div', { class: 'page-sub', text: t('search.sub') })));

      /* search box */
      const box = el('input', {
        class: 'input', type: 'search', value: view.q,
        placeholder: t('search.ph'), 'aria-label': t('search.title'),
        style: { fontSize: 'var(--fs-l)', padding: '12px 16px' },
      });
      box.addEventListener('input', LF.util.debounce(() => {
        view.q = box.value;
        view.draw();
      }, 250));
      page.appendChild(el('div', { class: 'card card-pad', style: { marginBottom: '14px' } }, box));

      const q = view.q.trim().toLowerCase();
      if (q.length < 2) {
        page.appendChild(el('div', { class: 'card' },
          LF.ui.empty('search', t('search.helpTitle'), t('search.helpHint'))));
        viewEl.innerHTML = '';
        viewEl.appendChild(page);
        if (box) setTimeout(() => box.focus(), 30);
        return;
      }

      /* search all types in parallel */
      const results = await Promise.all(TYPES.map(async (T) => {
        try { return { T, hits: await T.search(q) }; }
        catch (e) { return { T, hits: [] }; }
      }));

      /* type filter chips with counts */
      const total = results.reduce((s, r) => s + r.hits.length, 0);
      const chips = el('div', { class: 'row wrap', style: { gap: '6px', marginBottom: '14px' } });
      const allChip = el('button', {
        class: 'chip' + (view.type === 'all' ? ' on' : ''),
        'aria-pressed': view.type === 'all' ? 'true' : 'false',
        text: t('search.allTypes') + ' (' + LF.i18n.num(total) + ')',
      });
      allChip.addEventListener('click', () => { view.type = 'all'; view.draw(); });
      chips.appendChild(allChip);
      results.forEach(({ T, hits }) => {
        if (!hits.length) return;
        const c = el('button', {
          class: 'chip' + (view.type === T.id ? ' on' : ''),
          'aria-pressed': view.type === T.id ? 'true' : 'false',
        }, ic(T.icon, 12), t(T.key),
          el('span', { class: 'chip-count num', text: String(hits.length) }));
        c.addEventListener('click', () => { view.type = T.id; view.draw(); });
        chips.appendChild(c);
      });
      page.appendChild(chips);

      /* results */
      if (!total) {
        page.appendChild(el('div', { class: 'card' },
          LF.ui.empty('search', t('search.noResults'), t('search.noResultsHint'))));
      } else {
        const wrap = el('div', { class: 'col', style: { gap: '8px' } });
        results.forEach(({ T, hits }) => {
          if (!hits.length) return;
          if (view.type !== 'all' && view.type !== T.id) return;
          if (view.type === 'all') {
            wrap.appendChild(el('div', { class: 'strong small muted', style: { margin: '8px 0 2px' } },
              ic(T.icon, 13), ' ' + t(T.key)));
          }
          hits.slice(0, view.type === 'all' ? 5 : 30).forEach(h => {
            const row = el('div', {
              class: 'task-row', role: 'button', tabindex: '0',
            },
              el('span', { class: 'icon-chip', style: { width: '30px', height: '30px', borderRadius: '9px', background: 'var(--accent-soft)', color: 'var(--accent-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' } }, ic(T.icon, 15)),
              el('div', { class: 'grow', style: { minWidth: 0 } },
                el('div', { class: 'small strong truncate', text: h.title }),
                h.sub ? el('div', { class: 'xs faint truncate', text: h.sub }) : null));
            row.addEventListener('click', h.open);
            wrap.appendChild(row);
          });
        });
        page.appendChild(wrap);
      }

      viewEl.innerHTML = '';
      viewEl.appendChild(page);
      setTimeout(() => { box.focus(); try { box.setSelectionRange(box.value.length, box.value.length); } catch (e) { /* noop */ } }, 0);
    },
  };

  LF.views = LF.views || {};
  LF.views['app/search'] = async function (parts) { await view.render(null, parts); };
  LF.searchView = view;
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* ===== js/views/settings.js ===== */
/* ============================================================
   LifeFlow — Settings
   profile · preferences · dashboard · workspaces · data · account
   ============================================================ */
(function (root) {
  'use strict';
  const LF = root.LF = root.LF || {};
  const el = function () { return LF.ui.el.apply(null, arguments); };
  const ic = (n, s) => LF.ui.icon(n, s);

  const ACCENTS = ['teal', 'indigo', 'rose', 'emerald', 'amber'];

  function section(iconName, title) {
    const card = el('section', { class: 'card card-pad section' });
    card.appendChild(el('div', { class: 'row', style: { gap: '10px', marginBottom: '16px' } },
      el('div', { class: 'icon-chip', style: { width: '32px', height: '32px', borderRadius: '9px', background: 'var(--accent-soft)', color: 'var(--accent-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, ic(iconName, 16)),
      el('h3', { text: title })));
    return card;
  }

  async function save(patch, toastMsg) {
    await LF.store.saveSettings(patch);
    if (toastMsg !== false) LF.ui.toast(LF.i18n.t('common.saved'), { type: 'ok', duration: 1600 });
  }

  const settings = {
    /* ---------- profile ---------- */
    profile(card) {
      const t = LF.i18n.t;
      const u = LF.store.user;
      const name = el('input', { class: 'input', value: u.name, maxlength: '40' });
      const username = el('input', { class: 'input', value: u.username, dir: 'ltr', maxlength: '20' });
      const err = el('div', { class: 'field-error', style: { display: 'none' }, role: 'alert' });

      const colors = el('div', { class: 'row wrap', style: { gap: '9px' } });
      LF.AVATAR_COLORS.forEach(c => {
        const b = el('button', {
          class: 'swatch', 'aria-pressed': u.avatarColor === c ? 'true' : 'false',
          'aria-label': c, style: { background: c },
        });
        b.addEventListener('click', () => {
          colors.querySelectorAll('.swatch').forEach(x => x.setAttribute('aria-pressed', 'false'));
          b.setAttribute('aria-pressed', 'true');
        });
        colors.appendChild(b);
      });

      const btn = el('button', { class: 'btn primary' }, t('common.save'));
      btn.addEventListener('click', async () => {
        err.style.display = 'none';
        const nn = name.value.trim();
        const un = username.value.trim().toLowerCase();
        if (nn.length < 2 || nn.length > 40) { err.textContent = t('auth.errName'); err.style.display = ''; return; }
        if (!/^[a-z0-9_.-]{3,20}$/.test(un)) { err.textContent = t('auth.errUsername'); err.style.display = ''; return; }
        if (un !== u.username && await LF.auth.usernameTaken(un)) {
          err.textContent = t('auth.errUsernameTaken'); err.style.display = ''; return;
        }
        let picked = null;
        colors.querySelectorAll('.swatch').forEach(x => { if (x.getAttribute('aria-pressed') === 'true') picked = x.getAttribute('aria-label'); });
        btn.setAttribute('disabled', '');
        try {
          const user = await LF.db.get('users', LF.auth.currentId(), { all: true });
          user.name = nn; user.username = un;
          if (picked) user.avatarColor = picked;
          await LF.db.put('users', user, { all: true });
          LF.store.user = { id: user.id, name: user.name, username: user.username, avatarColor: user.avatarColor };
          LF.ui.toast(t('common.saved'), { type: 'ok' });
          LF.shell.rerender();
        } finally { btn.removeAttribute('disabled'); }
      });

      card.appendChild(el('div', { class: 'row', style: { gap: '16px', marginBottom: '18px', alignItems: 'center' } },
        LF.ui.avatar({ name: name.value || '?', avatarColor: u.avatarColor }, 'lg'),
        el('div', { class: 'col', style: { gap: '2px' } },
          el('div', { class: 'strong', text: u.name }),
          el('div', { class: 'muted xs', text: '@' + u.username }))
      ));
      card.appendChild(el('div', { class: 'col', style: { gap: '14px' } },
        LF.ui.field(t('common.name'), name),
        LF.ui.field(t('auth.username'), username, { hint: t('auth.usernameHint') }),
        LF.ui.field(t('settings.avatarColor'), colors),
        err,
        el('div', {}, btn)
      ));
    },

    /* ---------- preferences ---------- */
    preferences(card) {
      const t = LF.i18n.t;
      const s = LF.store.settings;

      const mkSelect = (label, opts, value, onChange) => {
        const sel = el('select', { class: 'select' });
        opts.forEach(o => {
          sel.appendChild(el('option', { value: o.value, selected: o.value === value ? '' : null, text: o.label }));
        });
        sel.addEventListener('change', () => onChange(sel.value));
        return LF.ui.field(label, sel);
      };

      card.appendChild(el('div', { class: 'col', style: { gap: '14px' } }, 
        mkSelect(t('common.language'), [
          { value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' },
        ], s.lang, v => { save({ lang: v }); LF.shell.rerender(); }),

        mkSelect(t('settings.themeOption'), [
          { value: 'system', label: t('settings.theme_system') },
          { value: 'light', label: t('settings.theme_light') },
          { value: 'dark', label: t('settings.theme_dark') },
        ], s.theme, v => { save({ theme: v }); LF.shell.rerender(); }),

        (() => {
          const wrap = el('div', { class: 'field' },
            el('label', { text: t('settings.accent') }),
            el('div', { class: 'row wrap', style: { gap: '9px' } }));
          const row = wrap.querySelector('div');
          ACCENTS.forEach(a => {
            const b = el('button', {
              class: 'swatch', 'aria-pressed': s.accent === a ? 'true' : 'false',
              'aria-label': t('settings.acc_' + a), title: t('settings.acc_' + a),
              style: { background: 'var(--accent)', },
            });
            b.dataset.accent = a;
            b.style.background = ({ teal: '#0d9488', indigo: '#4f46e5', rose: '#e11d48', emerald: '#059669', amber: '#d97706' })[a];
            b.addEventListener('click', () => {
              row.querySelectorAll('.swatch').forEach(x => x.setAttribute('aria-pressed', 'false'));
              b.setAttribute('aria-pressed', 'true');
              save({ accent: a }); LF.shell.rerender();
            });
            row.appendChild(b);
          });
          return wrap;
        })(),

        mkSelect(t('common.currency'),
          LF.money.list(s.lang).map(c => ({ value: c.code, label: c.code + ' — ' + c.name })),
          s.currency, v => save({ currency: v })),

        mkSelect(t('onboarding.weekStart'), [
          { value: '0', label: LF.i18n.weekdayName(0) },
          { value: '6', label: LF.i18n.weekdayName(6) },
          { value: '1', label: LF.i18n.weekdayName(1) },
        ], String(s.weekStart), v => save({ weekStart: +v })),

        mkSelect(t('settings.timeFormat'), [
          { value: '24h', label: t('onboarding.tf24') },
          { value: '12h', label: t('onboarding.tf12') },
        ], s.timeFormat, v => save({ timeFormat: v })),

        s.lang === 'ar' ? mkSelect(t('onboarding.numerals'), [
          { value: 'latn', label: '123' },
          { value: 'arab', label: '١٢٣' },
        ], s.numerals, v => save({ numerals: v })) : null,

        mkSelect(t('settings.timezone'), [
          { value: '', label: t('settings.tzAuto') + tzCurrent() },
        ].concat(tzList().map(z => ({ value: z, label: z }))), s.timezone || '', v => save({ timezone: v || null }))
      ));
    },

    /* ---------- optional features ---------- */
    features(card) {
      const t = LF.i18n.t;
      card.appendChild(el('p', { class: 'muted small', text: t('settings.featuresSub') }));
      /* only live toggleable features are shown — later phases add theirs here */
      const LIVE = [
        { id: 'budget', hint: 'settings.featBudgetHint' },
        { id: 'home', hint: 'settings.featHomeHint' },
        { id: 'study', hint: 'settings.featStudyHint' },
        { id: 'work', hint: 'settings.featWorkHint' },
        { id: 'habits', hint: 'settings.featHabitsHint' },
      ];
      LIVE.forEach(f => {
        card.appendChild(el('div', { class: 'row between', style: { padding: '8px 0' } },
          el('div', {},
            el('div', { class: 'strong small', text: t('onboarding.feat_' + f.id) }),
            el('div', { class: 'xs faint', text: t(f.hint) })),
          LF.ui.switchEl(LF.store.feature(f.id), v => {
            const features = Object.assign({}, LF.store.settings.features, { [f.id]: v });
            LF.store.saveSettings({ features }).then(() => LF.shell.rerender());
          }, t('onboarding.feat_' + f.id))));
      });
    },

    /* ---------- dashboard widgets ---------- */
    dashboardCfg(card) {
      const t = LF.i18n.t;
      card.appendChild(el('p', { class: 'muted small', text: t('settings.dashDesc') }));
      const btn = el('button', { class: 'btn primary' }, ic('palette', 15), t('dashboard.qaCustomize'));
      btn.addEventListener('click', () => LF.dashboard.openWidgetManager());
      card.appendChild(btn);
    },

    /* ---------- workspaces ---------- */
    async workspaces(card) {
      const t = LF.i18n.t;
      card.appendChild(el('p', { class: 'muted small', text: t('settings.wsDesc') }));

      const list = el('div', { class: 'list' });
      async function draw() {
        list.innerHTML = '';
        LF.store.workspaces.forEach(ws => {
          const isActive = LF.store.settings.activeWorkspaceId === ws.id;
          const row = el('div', { class: 'list-row' },
            el('span', { class: 'icon-chip', style: { width: '30px', height: '30px', borderRadius: '8px', background: 'var(--accent-soft)', color: 'var(--accent-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, ic('folder', 14)),
            el('div', { class: 'grow col', style: { gap: '0', minWidth: '0' } },
              el('span', { class: 'strong small truncate', text: ws.name }),
              isActive ? el('span', { class: 'badge accent', text: t('common.active') }) : null),
            el('button', {
              class: 'icon-btn', 'aria-label': t('common.rename'),
              title: t('common.rename'),
            }, ic('edit', 15)),
            LF.store.workspaces.length > 1 ? el('button', {
              class: 'icon-btn', 'aria-label': t('common.del'), title: t('common.del'),
              style: { color: 'var(--danger)' },
            }, ic('trash', 15)) : null
          );
          const [renBtn, delBtn] = row.querySelectorAll('button');
          renBtn.addEventListener('click', async () => {
            let m = null;
            const inp = el('input', { class: 'input', value: ws.name, maxlength: '40' });
            m = LF.ui.modal({
              title: t('common.rename'),
              body: el('div', {}, inp),
              actions: [
                { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
                {
                  label: t('common.save'), class: 'primary', onClick: async () => {
                    try { await LF.store.renameWorkspace(ws.id, inp.value); }
                    catch (e) { LF.ui.toast(t('settings.wsNameRequired'), { type: 'warn' }); return; }
                    m.close(); draw();
                  },
                },
              ],
            });
            setTimeout(() => inp.focus(), 30);
          });
          if (delBtn) {
            delBtn.addEventListener('click', async () => {
              const ok = await LF.ui.confirm({
                title: t('settings.wsDelete'),
                message: t('settings.wsDeleteConfirm', { name: ws.name }),
              });
              if (!ok) return;
              await LF.store.deleteWorkspace(ws.id);
              LF.ui.toast(t('common.saved'), { type: 'ok' });
              draw();
            });
          }
          list.appendChild(row);
        });
      }
      await draw();
      card.appendChild(list);

      const addBtn = el('button', { class: 'btn ghost', style: { marginTop: '12px' } }, ic('plus', 15), t('settings.wsAdd'));
      addBtn.addEventListener('click', async () => {
        let m = null;
        const inp = el('input', { class: 'input', maxlength: '40', placeholder: t('settings.wsNamePlaceholder') });
        m = LF.ui.modal({
          title: t('settings.wsAdd'),
          body: el('div', {}, inp),
          actions: [
            { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
            {
              label: t('common.add'), class: 'primary', onClick: async () => {
                try { await LF.store.addWorkspace(inp.value); }
                catch (e) { LF.ui.toast(t('settings.wsNameRequired'), { type: 'warn' }); return; }
                m.close(); draw();
              },
            },
          ],
        });
        setTimeout(() => inp.focus(), 30);
      });
      card.appendChild(addBtn);
    },

    /* ---------- data ---------- */
    data(card) {
      const t = LF.i18n.t;
      card.appendChild(el('p', { class:'muted small', text:t('settings.exportDesc') }));
      const plainBtn=el('button',{class:'btn primary'},ic('download',15),t('settings.exportBtn'));
      plainBtn.addEventListener('click',async()=>{ plainBtn.disabled=true; try{const f=await LF.data.downloadBackup();LF.ui.toast(t('settings.exportDone',{f}),{type:'ok'});}catch(e){LF.ui.toast(t('app.errorGeneric'),{type:'error'});}finally{plainBtn.disabled=false;} });
      card.appendChild(plainBtn);

      const encCard=el('div',{class:'card',style:{marginTop:'14px',padding:'14px'}});
      encCard.appendChild(el('h4',{style:{margin:'0 0 6px'},text:t('settings.encryptedBackup')}));
      encCard.appendChild(el('p',{class:'muted small',text:t('settings.backupPasswordHint')}));
      const pass=el('input',{class:'input',type:'password',minlength:'8',autocomplete:'new-password',placeholder:t('settings.backupPassword')});
      const encBtn=el('button',{class:'btn ghost',style:{marginTop:'8px'}},ic('lock',15),t('settings.encryptBackup'));
      encBtn.addEventListener('click',async()=>{ if(pass.value.length<8){LF.ui.toast(t('settings.passwordTooShort'),{type:'warn'});return;} encBtn.disabled=true;try{const f=await LF.data.downloadEncryptedBackup(pass.value);LF.ui.toast(t('settings.exportDone',{f}),{type:'ok'});}catch(e){LF.ui.toast(t('app.errorGeneric'),{type:'error'});}finally{encBtn.disabled=false;} });
      encCard.append(pass,encBtn); card.appendChild(encCard);

      card.appendChild(el('h4',{style:{margin:'18px 0 6px'},text:t('settings.restoreTitle')}));
      card.appendChild(el('p',{class:'muted small',text:t('settings.restoreDesc')}));
      const file=el('input',{type:'file',accept:'.json,.lfb,application/json',style:{display:'none'}});
      const handleRestore=async(obj)=>{
        let v=LF.data.validateBackup(obj); if(!v.ok){LF.ui.toast(t('settings.restoreInvalid'),{type:'error'});return;}
        const when=v.exportedAt?LF.i18n.fmtDate(new Date(v.exportedAt),'medium'):'—',who=v.user&&v.user.name?v.user.name:'—';
        const go=await LF.ui.confirm({title:t('settings.restoreTitle'),message:t('settings.restoreConfirm',{n:LF.i18n.num(v.records),when,who}),confirmLabel:t('settings.restoreGo')});
        if(!go)return; try{const r=await LF.data.restoreBackup(obj);LF.ui.toast(t('settings.restoreDone',{n:LF.i18n.num(r.restored)}),{type:'ok'});setTimeout(()=>location.reload(),900);}catch(e){LF.ui.toast((e&&e.conflict)?t('settings.restoreConflict'):t('settings.restoreInvalid'),{type:'error'});}
      };
      file.addEventListener('change',async()=>{const f=file.files&&file.files[0];file.value='';if(!f)return;try{const o=JSON.parse(await f.text());if(o&&o.encrypted){const m=el('div',{},el('p',{class:'muted small',text:t('settings.backupPassword')}));const pw=el('input',{class:'input',type:'password',autocomplete:'current-password'});m.appendChild(pw);let md;md=LF.ui.modal({title:t('settings.encryptedBackup'),body:m,actions:[{label:t('common.cancel'),class:'ghost',onClick:()=>md.close()},{label:t('settings.restoreGo'),class:'primary',onClick:async()=>{try{const dec=await LF.data.decryptBackup(o,pw.value);md.close();await handleRestore(dec);}catch(e){LF.ui.toast(t('settings.decryptFailed'),{type:'error'});}}}]});setTimeout(()=>pw.focus(),30);}else await handleRestore(o);}catch(e){LF.ui.toast(t('settings.restoreInvalid'),{type:'error'});}});
      card.appendChild(file);
      const rbtn=el('button',{class:'btn ghost'},ic('upload',15),t('settings.restoreBtn')); rbtn.addEventListener('click',()=>file.click()); card.appendChild(rbtn);

      const driveCard=el('div',{class:'card',style:{marginTop:'18px',padding:'14px'}});
      driveCard.appendChild(el('h4',{style:{margin:'0 0 6px'},text:t('settings.driveTitle')}));
      driveCard.appendChild(el('p',{class:'muted small',text:t('settings.driveDesc')}));
      const cid=el('input',{class:'input',value:LF.drive.getClientId(),placeholder:t('settings.driveClientId'),autocomplete:'off'});
      driveCard.appendChild(el('label',{class:'small strong',text:t('settings.driveClientId')})); driveCard.appendChild(cid);
      driveCard.appendChild(el('p',{class:'muted small',text:t('settings.driveClientIdHint')}));
      const autoBox=el('div',{class:'banner info',style:{marginTop:'10px'}});
      const autoLast=el('div',{class:'muted small',style:{marginTop:'4px'}});
      const autoBtn=el('button',{class:'btn primary sm',style:{marginTop:'8px'}},t('settings.driveEnableAuto'));
      const autoRestore=el('button',{class:'btn ghost sm',style:{marginTop:'8px'}},t('settings.driveAutoRestore'));
      function drawAuto(){
        autoBox.innerHTML='';
        const on=!!LF.drive.auto.enabled;
        autoBox.appendChild(el('div',{class:'strong',text:on?t('settings.driveAutoOn'):t('settings.driveAutoOff')}));
        const last=LF.drive.auto.last||LF.util.ls.get('lf.drive.autoLast',null);
        autoLast.textContent=last?t('settings.driveAutoLast')+' '+new Date(last).toLocaleString():'';
        autoBtn.textContent=on?t('settings.driveAutoOn'):t('settings.driveEnableAuto');
        autoBtn.disabled=on; autoRestore.disabled=!on;
      }
      autoBtn.addEventListener('click',async()=>{autoBtn.disabled=true;try{await LF.drive.enableAuto();LF.ui.toast(t('settings.driveAutoOn'),{type:'ok'});}catch(e){LF.ui.toast(e.code==='driveNeedClient'?t('settings.driveNeedClient'):t('app.errorGeneric'),{type:'error'});}drawAuto();});
      autoRestore.addEventListener('click',async()=>{autoRestore.disabled=true;try{const o=await LF.drive.restoreAuto();await handleRestore(o);}catch(e){LF.ui.toast(e.code==='driveNone'?t('settings.driveNone'):t('app.errorGeneric'),{type:'error'});}autoRestore.disabled=false;});
      autoBox.appendChild(autoLast); driveCard.append(autoBox,autoBtn,autoRestore); drawAuto();

      const save=el('button',{class:'btn ghost sm'},t('settings.driveSaveClient'));
      save.addEventListener('click',()=>{LF.drive.saveClientId(cid.value);LF.ui.toast(t('settings.driveSaved'),{type:'ok'});});
      const connect=el('button',{class:'btn ghost sm'},t('settings.driveConnect'));
      connect.addEventListener('click',async()=>{try{await LF.drive.enableAuto();LF.ui.toast(t('settings.driveConnected'),{type:'ok'});drawAuto();}catch(e){LF.ui.toast(e.code==='driveNeedClient'?t('settings.driveNeedClient'):t('app.errorGeneric'),{type:'error'});}});
      const dbtn=el('button',{class:'btn primary sm'},t('settings.driveBackup'));
      dbtn.addEventListener('click',async()=>{if(pass.value.length<8){LF.ui.toast(t('settings.passwordTooShort'),{type:'warn'});return;}try{await LF.drive.upload(pass.value);LF.ui.toast(t('settings.driveUploaded'),{type:'ok'});}catch(e){LF.ui.toast(e.code==='driveNeedClient'?t('settings.driveNeedClient'):t('app.errorGeneric'),{type:'error'});}});
      const drbtn=el('button',{class:'btn ghost sm'},t('settings.driveRestore'));
      drbtn.addEventListener('click',async()=>{try{const obj=await LF.drive.download();if(obj&&obj.encrypted){const m=el('div',{},el('p',{class:'muted small',text:t('settings.backupPassword')}));const pw=el('input',{class:'input',type:'password'});m.appendChild(pw);let md;md=LF.ui.modal({title:t('settings.driveRestore'),body:m,actions:[{label:t('common.cancel'),class:'ghost',onClick:()=>md.close()},{label:t('settings.restoreGo'),class:'primary',onClick:async()=>{try{const dec=await LF.data.decryptBackup(obj,pw.value);md.close();await handleRestore(dec);}catch(e){LF.ui.toast(t('settings.decryptFailed'),{type:'error'});}}}]});setTimeout(()=>pw.focus(),30);} }catch(e){LF.ui.toast(e.code==='driveNone'?t('settings.driveNone'):e.code==='driveNeedClient'?t('settings.driveNeedClient'):t('app.errorGeneric'),{type:'error'});}});
      driveCard.append(save,connect,dbtn,drbtn); card.appendChild(driveCard);
    },

    /* ---------- notifications (system permission for reminders) ---------- */
    notifications(card) {
      const t = LF.i18n.t;
      card.appendChild(el('p', { class: 'muted small', text: t('settings.notifDesc') }));

      if (typeof Notification === 'undefined') {
        card.appendChild(el('div', { class: 'banner info' },
          ic('info', 16),
          el('div', { class: 'grow', text: t('settings.notifUnsupported') })));
        return;
      }

      const row = el('div', { class: 'row wrap', style: { gap: '10px', alignItems: 'center' } });
      const hint = el('p', { class: 'muted small' });

      function draw() {
        row.innerHTML = '';
        const perm = Notification.permission;
        row.appendChild(el('span', { class: 'small', text: t('settings.notifStateLabel') }));
        row.appendChild(el('span', {
          class: 'badge ' + (perm === 'granted' ? 'ok' : perm === 'denied' ? 'danger' : 'warn'),
        }, perm === 'granted' ? t('settings.notifGranted')
          : perm === 'denied' ? t('settings.notifDenied') : t('settings.notifDefault')));
        if (perm === 'default') {
          const enable = el('button', { class: 'btn primary sm' }, ic('bell', 14), t('settings.notifEnable'));
          enable.addEventListener('click', async () => {
            try { await Notification.requestPermission(); } catch (e) { /* Safari old */ }
            draw();
          });
          row.appendChild(enable);
        }
        if (perm === 'granted') {
          const test = el('button', { class: 'btn ghost sm' }, ic('bell', 14), t('settings.notifTest'));
          test.addEventListener('click', () => {
            LF.reminders.showSystem(t('settings.notifTestTitle'), { body: t('settings.notifTestBody') });
          });
          row.appendChild(test);
        }
        hint.textContent = perm === 'denied' ? t('settings.notifDeniedHint') : t('settings.notifHint');
      }
      draw();
      card.appendChild(row);
      card.appendChild(hint);
    },

    /* ---------- app / PWA ---------- */
    app(card) {
      const t = LF.i18n.t;

      /* version */
      const ver = LF.pwa.BUILD_VERSION || 'dev';
      card.appendChild(el('div', { class: 'row wrap', style: { gap: '10px', alignItems: 'center' } },
        el('span', { class: 'small', text: t('settings.version') }),
        el('span', { class: 'badge accent', text: ver })));

      const upd = el('button', { class: 'btn ghost sm', style: { marginTop: '10px' } },
        ic('refresh', 14), t('settings.checkUpdate'));
      upd.addEventListener('click', async () => {
        const r = await LF.pwa.checkUpdate();
        if (r === 'checked') LF.ui.toast(t('settings.updChecked'), { type: 'ok' });
        else if (r === 'unavailable') LF.ui.toast(t('settings.swInactive'), { type: 'warn' });
        else LF.ui.toast(t('app.errorGeneric'), { type: 'error' });
      });
      card.appendChild(upd);

      /* install / standalone / iOS hint */
      const box = el('div', { style: { marginTop: '14px' } });
      function drawInstall() {
        box.innerHTML = '';
        if (LF.pwa.isStandalone()) {
          box.appendChild(el('div', { class: 'banner ok' },
            ic('check-circle', 16),
            el('div', { class: 'grow', text: t('settings.runningInstalled') })));
          return;
        }
        if (LF.pwa.canInstall()) {
          const b = el('button', { class: 'btn primary sm' }, ic('download', 14), t('settings.installBtn'));
          b.addEventListener('click', async () => {
            const ok = await LF.pwa.promptInstall();
            if (ok) LF.ui.toast(t('app.installed'), { type: 'ok' });
            drawInstall();
          });
          box.appendChild(b);
          return;
        }
        const ua = navigator.userAgent || '';
        const iosLike = /iphone|ipad|ipod/i.test(ua);
        box.appendChild(el('div', { class: 'banner info' },
          ic('info', 16),
          el('div', { class: 'grow', text: iosLike ? t('settings.iosHint') : t('settings.installHint') })));
      }
      drawInstall();
      LF.store.on('can-install', drawInstall);
      card.appendChild(box);

      /* offline readiness */
      const swOk = ('serviceWorker' in navigator) && LF.pwa._reg;
      card.appendChild(el('div', { class: 'row wrap', style: { gap: '10px', alignItems: 'center', marginTop: '14px' } },
        el('span', { class: 'small', text: t('settings.offlineReady') }),
        el('span', { class: 'badge ' + (swOk ? 'ok' : 'warn') },
          swOk ? t('settings.swActive') : t('settings.swInactive'))));
    },

    /* ---------- account ---------- */
    account(card) {
      const t = LF.i18n.t;
      card.appendChild(el('p', { class: 'muted small', text: t('settings.accountDesc') }));

      const pwBtn = el('button', { class: 'btn ghost', style: { width: '100%', justifyContent: 'flex-start' } },
        ic('key', 15), t('settings.changePassword'));
      pwBtn.addEventListener('click', () => {
        let m = null;
        const err = el('div', { class: 'field-error', style: { display: 'none' }, role: 'alert' });
        const old = el('input', { class: 'input', type: 'password', autocomplete: 'current-password' });
        const nw = el('input', { class: 'input', type: 'password', autocomplete: 'new-password' });
        const nw2 = el('input', { class: 'input', type: 'password', autocomplete: 'new-password' });
        m = LF.ui.modal({
          title: t('settings.changePassword'),
          body: el('div', { class: 'col', style: { gap: '12px' } },
            LF.ui.field(t('auth.oldPassword'), old),
            LF.ui.field(t('auth.newPassword'), nw, { hint: t('auth.passwordHint') }),
            LF.ui.field(t('auth.confirmPassword'), nw2),
            err),
          actions: [
            { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
            {
              label: t('common.save'), class: 'primary', onClick: async () => {
                err.style.display = 'none';
                if (nw.value !== nw2.value) { err.textContent = t('auth.errMismatch'); err.style.display = ''; return; }
                try {
                  await LF.auth.changePassword(LF.auth.currentId(), old.value, nw.value);
                  m.close();
                  LF.ui.toast(t('settings.pwChanged'), { type: 'ok' });
                } catch (e) {
                  err.textContent = t(e && e.code ? e.code : 'app.errorGeneric');
                  err.style.display = '';
                }
              },
            },
          ],
        });
        setTimeout(() => old.focus(), 30);
      });

      const logoutBtn = el('button', { class: 'btn ghost', style: { width: '100%', justifyContent: 'flex-start' } },
        ic('logout', 15), t('auth.logout'));
      logoutBtn.addEventListener('click', () => {
        LF.auth.logout();
        LF.store.settings = null; LF.store.workspaces = []; LF.store.user = null;
        LF.shell.destroy();
        LF.router.go('#/login');
        LF.ui.toast(t('auth.loggedOut'), { type: 'ok' });
      });

      card.appendChild(pwBtn);
      card.appendChild(logoutBtn);

      // danger zone
      const dz = el('div', {
        class: 'card-pad', style: {
          border: '1px solid var(--danger)', borderRadius: 'var(--radius-m)',
          marginTop: '18px', background: 'var(--danger-soft)',
        },
      },
        el('div', { class: 'strong small', style: { color: 'var(--danger)', marginBottom: '6px' }, text: t('settings.dangerZone') }),
        el('p', { class: 'xs', style: { margin: '0 0 10px' }, text: t('settings.deleteDesc') }));
      const delBtn = el('button', { class: 'btn danger-soft', style: { border: '1px solid var(--danger)' } },
        ic('trash', 15), t('settings.deleteAccount'));
      delBtn.addEventListener('click', () => settings.deleteAccountModal());
      dz.appendChild(delBtn);
      card.appendChild(dz);
    },

    deleteAccountModal() {
      const t = LF.i18n.t;
      const u = LF.store.user;
      let m = null;
      const err = el('div', { class: 'field-error', style: { display: 'none' }, role: 'alert' });
      const pw = el('input', { class: 'input', type: 'password', autocomplete: 'current-password' });
      const confirmName = el('input', { class: 'input', placeholder: u.name });
      m = LF.ui.modal({
        title: t('settings.deleteAccount'),
        dismissible: true,
        body: el('div', { class: 'col', style: { gap: '12px' } },
          el('div', { class: 'banner danger' }, ic('alert', 16),
            el('div', { class: 'grow', text: t('settings.deleteWarn') })),
          LF.ui.field(t('auth.password'), pw),
          LF.ui.field(t('settings.deleteConfirmName', { name: u.name }), confirmName),
          err),
        actions: [
          { label: t('common.cancel'), class: 'ghost', onClick: () => m.close() },
          {
            label: t('settings.deleteAccount'), class: 'danger', onClick: async () => {
              err.style.display = 'none';
              if (confirmName.value.trim() !== u.name) {
                err.textContent = t('settings.errConfirmName'); err.style.display = ''; return;
              }
              try {
                await LF.auth.deleteAccount(LF.auth.currentId(), pw.value);
                m.close();
                LF.store.settings = null; LF.store.workspaces = []; LF.store.user = null;
                LF.shell.destroy();
                LF.router.go('#/login');
                LF.ui.toast(t('settings.accountDeleted'), { type: 'ok' });
              } catch (e) {
                err.textContent = t(e && e.code ? e.code : 'app.errorGeneric');
                err.style.display = '';
              }
            },
          },
        ],
      });
      setTimeout(() => pw.focus(), 30);
    },

    /* ---------- page ---------- */
    async render(viewEl) {
      const t = LF.i18n.t;
      const page = el('div', { class: 'page' });
      page.appendChild(el('div', { class: 'page-head' },
        el('h1', { text: t('nav.settings') }),
        el('div', { class: 'page-sub', text: t('settings.sub') })));

      const c1 = section('user', t('settings.secProfile')); settings.profile(c1);
      const c2 = section('settings', t('settings.secPrefs')); settings.preferences(c2);
      const c2b = section('chart', t('settings.secFeatures')); settings.features(c2b);
      const c3 = section('dashboard', t('settings.secDashboard')); settings.dashboardCfg(c3);
      const c4 = section('folder', t('settings.secWorkspaces')); await settings.workspaces(c4);
      const c4b = section('bell', t('settings.secNotifs')); settings.notifications(c4b);
      const c5 = section('database', t('settings.secData')); settings.data(c5);
      const c6 = section('logo', t('settings.secApp')); settings.app(c6);
      const c7 = section('shield', t('settings.secAccount')); settings.account(c7);

      [c1, c2, c2b, c3, c4, c5, c6].forEach(c => page.appendChild(c));
      viewEl.innerHTML = '';
      viewEl.appendChild(page);
    },
  };

  function tzCurrent() {
    try { return ' (' + Intl.DateTimeFormat().resolvedOptions().timeZone + ')'; }
    catch (e) { return ''; }
  }
  function tzList() {
    try {
      if (Intl.supportedValuesOf) return Intl.supportedValuesOf('timeZone');
    } catch (e) { /* noop */ }
    return ['UTC', 'Asia/Aden', 'Asia/Riyadh', 'Africa/Cairo', 'Europe/Istanbul', 'Europe/London', 'Asia/Dubai', 'America/New_York'];
  }

  LF.views = LF.views || {};
  LF.views['app/settings'] = async function () {
    const viewEl = await LF.shell.ensure();
    await settings.render(viewEl);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);

