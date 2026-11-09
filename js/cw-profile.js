/**
 * ─────────────────────────────────────────────────────────
 *  Concept Wealth Woodhill — Client Profile System  v1.0
 * ─────────────────────────────────────────────────────────
 *
 *  Works in two modes:
 *    1. localStorage only  — always works, data stays on this device
 *    2. localStorage + Firebase — activates when firebase-config.js
 *       contains a real API key; data syncs to your Firestore
 *
 *  Public API:
 *    CWProfile.getProfile()                   → profile object or null
 *    CWProfile.createProfile(name, email, phone)
 *    CWProfile.clearProfile()
 *    CWProfile.saveResult(calcId, {inputs, results, summary})
 *    CWProfile.getResult(calcId)              → saved data or null
 *    CWProfile.getAllResults()                → { calcId: {...}, ... }
 *    CWProfile.isCompleted(calcId)            → bool
 *    CWProfile.getCompletionCount()           → number
 *    CWProfile.showSavePrompt(calcId, fn)     → shows modal, calls fn on profile ready
 */

(function (global) {
  'use strict';

  // ── Storage keys ────────────────────────────────────────────────────
  const KEY_PROFILE  = 'cw_profile';
  const KEY_RESULTS  = 'cw_results';
  const KEY_DEVICE   = 'cw_device';
  const KEY_SHARED   = 'cw_shared';   // cross-calculator shared fields

  // ── Calculator metadata (for display) ───────────────────────────────
  const CALC_META = {
    retirement_simple:  { label: 'Retirement (Quick)',    file: 'retirement_calculator_simple.html' },
    retirement:         { label: 'Advanced Retirement',   file: 'retirement_calculator.html' },
    income_tax:         { label: 'Income Tax',            file: 'income_tax_calculator.html' },
    budget:             { label: 'Budget Planner',        file: 'budget_planner.html' },
    net_worth:          { label: 'Net Worth',             file: 'net_worth_calculator.html' },
    savings:            { label: 'Savings Calculator',    file: 'savings_calculator.html' },
    life_cover:         { label: 'Risk Cover',             file: 'life_cover_calculator.html' },
    loan:               { label: 'Loan Repayment',        file: 'loan_repayment_calculator.html' },
    investment_tax:     { label: 'Investment Tax',        file: 'investment_tax_calculator.html' },
    edusave:            { label: 'Education Savings',     file: 'edusave_calculator.html' },
    fee_growth:         { label: 'RA Fee Comparator',     file: 'fee_growth_comparison_calculator.html' },
  };

  // ── Helpers ──────────────────────────────────────────────────────────
  function uid() {
    return 'cw' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
  }

  function emailKey(email) {
    return email.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 60);
  }

  function getDeviceId() {
    let id = localStorage.getItem(KEY_DEVICE);
    if (!id) { id = uid(); localStorage.setItem(KEY_DEVICE, id); }
    return id;
  }

  function fmt(n) {
    if (!n && n !== 0) return '';
    return 'R ' + Math.round(n).toLocaleString('en-ZA');
  }

  // ── Firebase ─────────────────────────────────────────────────────────
  let db = null;

  function tryInitFirebase() {
    try {
      if (
        typeof CW_FIREBASE_CONFIG === 'undefined' ||
        !CW_FIREBASE_CONFIG.apiKey ||
        CW_FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY' ||
        typeof firebase === 'undefined'
      ) return;

      if (!firebase.apps.length) {
        firebase.initializeApp(CW_FIREBASE_CONFIG);
      }
      db = firebase.firestore();
    } catch (e) {
      // Firebase unavailable — local only
    }
  }

  function fbMerge(docId, data) {
    if (!db || !docId) return;
    try { db.collection('clients').doc(docId).set(data, { merge: true }); } catch (_) {}
  }

  function fbUpdateCalc(docId, calcId, calcData) {
    if (!db || !docId) return;
    try {
      const upd = {};
      upd['calculators.' + calcId] = calcData;
      upd['profile.lastUpdated']   = new Date().toISOString();
      db.collection('clients').doc(docId).update(upd).catch(function() {
        // Doc may not exist yet — use set merge instead
        const fallback = { calculators: {}, profile: { lastUpdated: new Date().toISOString() } };
        fallback.calculators[calcId] = calcData;
        fbMerge(docId, fallback);
      });
    } catch (_) {}
  }

  // ── Profile ──────────────────────────────────────────────────────────
  function getProfile() {
    try { return JSON.parse(localStorage.getItem(KEY_PROFILE)); } catch (_) { return null; }
  }

  function saveProfileLocal(p) {
    localStorage.setItem(KEY_PROFILE, JSON.stringify(p));
  }

  function createProfile(firstName, email, phone) {
    const p = {
      firstName : firstName.trim(),
      email     : email.trim().toLowerCase(),
      phone     : (phone || '').trim(),
      docId     : emailKey(email),
      createdAt : new Date().toISOString(),
    };
    saveProfileLocal(p);

    fbMerge(p.docId, {
      profile: {
        firstName  : p.firstName,
        email      : p.email,
        phone      : p.phone,
        createdAt  : p.createdAt,
        lastUpdated: p.createdAt,
        deviceId   : getDeviceId(),
      }
    });

    return p;
  }

  function clearProfile() {
    localStorage.removeItem(KEY_PROFILE);
    localStorage.removeItem(KEY_RESULTS);
    localStorage.removeItem(KEY_SHARED);
  }

  // ── Shared profile data (flows between calculators) ─────────────────
  //
  //  Stored fields:
  //    firstName, age, retirementAge, grossMonthly, grossAnnual,
  //    raMonthly, currentRetirementFund, retMonthlyContrib,
  //    riskProfile, escalation, incomeTarget, ageGroup
  //
  function getSharedData() {
    try { return JSON.parse(localStorage.getItem(KEY_SHARED)) || {}; } catch (_) { return {}; }
  }

  function mergeShared(fields) {
    var current = getSharedData();
    Object.keys(fields).forEach(function(k) {
      if (fields[k] !== undefined && fields[k] !== null && fields[k] !== '' && !isNaN(fields[k]) || typeof fields[k] === 'string') {
        current[k] = fields[k];
      }
    });
    try { localStorage.setItem(KEY_SHARED, JSON.stringify(current)); } catch (_) {}
  }

  // Called automatically from saveResult — extracts key fields into shared store
  function _extractShared(calcId, inputs) {
    if (!inputs) return;
    var shared = {};

    if (calcId === 'income_tax') {
      var ga = parseFloat(inputs.gross);
      if (ga > 0) { shared.grossAnnual = ga; shared.grossMonthly = +(ga / 12).toFixed(2); }
      if (inputs.ra !== undefined && inputs.ra !== '') shared.raMonthly = parseFloat(inputs.ra) || 0;
      if (inputs.ageGroup) shared.ageGroup = inputs.ageGroup;
    }

    if (calcId === 'retirement' || calcId === 'retirement_simple') {
      var age     = parseFloat(inputs.currentAge || inputs.age);
      var retAge  = parseFloat(inputs.retAge || inputs.retirementAge);
      var salary  = parseFloat(inputs.salary);
      var fund    = parseFloat(inputs.quickBalance || inputs.currentFund);
      var contrib = parseFloat(inputs.quickContrib || inputs.monthlyContrib);
      var esc     = parseFloat(inputs.quickEsc !== undefined ? inputs.quickEsc : inputs.escalation);
      var itgt    = parseFloat(inputs.incomeTarget);

      if (age > 0)    shared.age = age;
      if (retAge > 0) shared.retirementAge = retAge;
      if (salary > 0) { shared.grossMonthly = salary; shared.grossAnnual = +(salary * 12).toFixed(2); }
      if (!isNaN(fund) && fund >= 0)    shared.currentRetirementFund = fund;
      if (contrib > 0)                  shared.retMonthlyContrib = contrib;
      if (inputs.riskProfile)           shared.riskProfile = inputs.riskProfile;
      if (!isNaN(esc))                  shared.escalation = esc;
      if (itgt > 0)                     shared.incomeTarget = itgt;
    }

    if (calcId === 'life_cover') {
      var lcSalary = parseFloat(inputs.monthlyIncome || inputs.salary || inputs.grossMonthly);
      if (lcSalary > 0) shared.grossMonthly = lcSalary;
      var lcAge = parseFloat(inputs.age || inputs.currentAge);
      if (lcAge > 0) shared.age = lcAge;
    }

    if (Object.keys(shared).length > 0) mergeShared(shared);
  }

  // Pre-fill DOM inputs from shared data.
  //
  // fieldMap  — { 'html-input-id': 'sharedKey', ... }
  // callbacks — { 'sharedKey': function(value){...}, ... }  for non-input fields
  //
  // Returns number of fields pre-filled.
  function prefillFromShared(fieldMap, callbacks) {
    var shared = getSharedData();
    if (!shared || !Object.keys(shared).length) return 0;

    var count = 0;

    if (fieldMap) {
      Object.keys(fieldMap).forEach(function(inputId) {
        var sharedKey = fieldMap[inputId];
        var val = shared[sharedKey];
        if (val === undefined || val === null || val === '') return;
        var el = document.getElementById(inputId);
        if (!el || el.tagName !== 'INPUT') return;
        el.value = val;
        count++;
        // Subtle green flash to signal auto-fill
        el.style.transition = 'background-color .2s';
        el.style.backgroundColor = '#f0fdf4';
        setTimeout(function() { el.style.backgroundColor = ''; }, 1800);
      });
    }

    if (callbacks) {
      Object.keys(callbacks).forEach(function(sharedKey) {
        var val = shared[sharedKey];
        if (val === undefined || val === null) return;
        try { callbacks[sharedKey](val); count++; } catch (_) {}
      });
    }

    if (count > 0) {
      showToast('Fields pre-filled from your saved profile ✓', 'success');
    }

    return count;
  }

  // ── Calculator results ───────────────────────────────────────────────
  function getAllResults() {
    try { return JSON.parse(localStorage.getItem(KEY_RESULTS)) || {}; } catch (_) { return {}; }
  }

  function getResult(calcId) {
    return getAllResults()[calcId] || null;
  }

  function isCompleted(calcId) {
    const r = getResult(calcId);
    return !!(r && r.completed);
  }

  function getCompletionCount() {
    return Object.values(getAllResults()).filter(function(r) { return r && r.completed; }).length;
  }

  function saveResult(calcId, payload) {
    const record = {
      completed : true,
      savedAt   : new Date().toISOString(),
      summary   : payload.summary || '',
      inputs    : payload.inputs  || {},
      results   : payload.results || {},
    };

    const all = getAllResults();
    all[calcId] = record;
    localStorage.setItem(KEY_RESULTS, JSON.stringify(all));

    // Extract key fields into shared cross-calculator store
    _extractShared(calcId, payload.inputs);

    const profile = getProfile();
    if (profile) {
      fbUpdateCalc(profile.docId, calcId, record);
    }

    // Dispatch event so index.html badges can update without reload
    try {
      window.dispatchEvent(new CustomEvent('cw:saved', { detail: { calcId: calcId, record: record } }));
    } catch (_) {}

    return record;
  }

  // ── Save prompt (modal) ──────────────────────────────────────────────
  //
  // Usage in a calculator:
  //   CWProfile.showSavePrompt(function(profile) {
  //     CWProfile.saveResult('income_tax', { inputs, results, summary });
  //     showToast('Saved to your profile ✓');
  //   });

  function showSavePrompt(onReady) {
    // If profile already exists, call onReady immediately
    const existing = getProfile();
    if (existing && existing.email) {
      if (typeof onReady === 'function') onReady(existing);
      return;
    }

    // Inject modal if not already present
    if (!document.getElementById('cw-profile-modal')) {
      _injectModalHTML();
      _injectModalCSS();
    }

    // Store callback
    _pendingCallback = onReady;
    document.getElementById('cw-profile-modal').style.display = 'flex';
    setTimeout(function() {
      const el = document.getElementById('cw-pm-name');
      if (el) el.focus();
    }, 80);
  }

  var _pendingCallback = null;

  function _submitModal() {
    const firstName = (document.getElementById('cw-pm-name').value  || '').trim();
    const email     = (document.getElementById('cw-pm-email').value || '').trim();
    const phone     = (document.getElementById('cw-pm-phone').value || '').trim();
    const errEl     = document.getElementById('cw-pm-err');

    if (!firstName) { errEl.textContent = 'Please enter your first name.'; return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEl.textContent = 'Please enter a valid email address.'; return;
    }
    errEl.textContent = '';

    const profile = createProfile(firstName, email, phone);
    document.getElementById('cw-profile-modal').style.display = 'none';

    if (typeof _pendingCallback === 'function') {
      _pendingCallback(profile);
      _pendingCallback = null;
    }

    // Dispatch profile-created event
    try { window.dispatchEvent(new CustomEvent('cw:profile-created', { detail: profile })); } catch(_) {}
  }

  function _closeModal() {
    const el = document.getElementById('cw-profile-modal');
    if (el) el.style.display = 'none';
    _pendingCallback = null;
  }

  function _injectModalHTML() {
    const div = document.createElement('div');
    div.innerHTML = [
      '<div id="cw-profile-modal" class="cw-modal-bd" style="display:none">',
      '  <div class="cw-modal-card">',
      '    <div class="cw-modal-hex">',
      '      <svg width="36" height="36" viewBox="0 0 34 34" fill="none">',
      '        <polygon points="17,2 31,10 31,24 17,32 3,24 3,10" fill="rgba(58,120,201,0.12)" stroke="#3a78c9" stroke-width="1.5"/>',
      '        <circle cx="17" cy="17" r="4.5" fill="#3a78c9"/>',
      '      </svg>',
      '    </div>',
      '    <div class="cw-modal-title">Save your progress</div>',
      '    <div class="cw-modal-sub">Enter your details once — your results will be saved every time you use a calculator, and your adviser can review your financial picture.</div>',
      '    <div class="cw-modal-inputs">',
      '      <input id="cw-pm-name"  type="text"  placeholder="First name *" class="cw-pm-input" autocomplete="given-name">',
      '      <input id="cw-pm-email" type="email" placeholder="Email address *" class="cw-pm-input" autocomplete="email">',
      '      <input id="cw-pm-phone" type="tel"   placeholder="Phone number (optional)" class="cw-pm-input" autocomplete="tel">',
      '    </div>',
      '    <div id="cw-pm-err" class="cw-pm-err"></div>',
      '    <button onclick="CWProfile._submit()" class="cw-pm-btn">Create my profile &rarr;</button>',
      '    <button onclick="CWProfile._close()" class="cw-pm-skip">Skip for now</button>',
      '    <p class="cw-pm-note">Your information is only shared with Concept Wealth Woodhill and is never sold to third parties.</p>',
      '  </div>',
      '</div>',
    ].join('');
    document.body.appendChild(div.firstElementChild);
  }

  function _injectModalCSS() {
    if (document.getElementById('cw-modal-style')) return;
    const style = document.createElement('style');
    style.id = 'cw-modal-style';
    style.textContent = [
      '.cw-modal-bd{position:fixed;inset:0;background:rgba(15,23,42,0.55);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;}',
      '.cw-modal-card{background:rgba(255,255,255,0.96);border-radius:18px;padding:32px 28px 24px;max-width:400px;width:100%;box-shadow:0 24px 64px rgba(58,120,201,0.18),0 2px 8px rgba(0,0,0,0.06);text-align:center;}',
      '.cw-modal-hex{margin:0 auto 14px;}',
      '.cw-modal-title{font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;margin-bottom:8px;}',
      '.cw-modal-sub{font-size:13px;color:#475569;line-height:1.55;margin-bottom:20px;}',
      '.cw-modal-inputs{display:flex;flex-direction:column;gap:10px;margin-bottom:6px;}',
      '.cw-pm-input{width:100%;padding:10px 14px;border-radius:9px;border:1.5px solid rgba(100,116,139,0.20);font-size:14px;font-weight:500;color:#0f172a;font-family:inherit;outline:none;background:#f8fafc;transition:border-color .15s;}',
      '.cw-pm-input:focus{border-color:#3a78c9;background:#fff;}',
      '.cw-pm-err{font-size:12px;color:#dc2626;min-height:16px;margin-bottom:6px;text-align:left;}',
      '.cw-pm-btn{width:100%;padding:12px;border-radius:10px;background:linear-gradient(135deg,#3a78c9,#5b5fc7);color:#fff;font-size:15px;font-weight:700;border:none;cursor:pointer;font-family:inherit;letter-spacing:-0.01em;margin-bottom:8px;transition:opacity .15s;}',
      '.cw-pm-btn:hover{opacity:.9;}',
      '.cw-pm-skip{background:none;border:none;font-size:13px;color:#94a3b8;cursor:pointer;font-family:inherit;padding:4px;}',
      '.cw-pm-skip:hover{color:#475569;}',
      '.cw-pm-note{font-size:11px;color:#94a3b8;margin-top:10px;line-height:1.5;}',
    ].join('');
    document.head.appendChild(style);
  }

  // ── Toast notification ───────────────────────────────────────────────
  function showToast(message, type) {
    // type: 'success' | 'info' | 'error'
    if (!document.getElementById('cw-toast-style')) {
      const s = document.createElement('style');
      s.id = 'cw-toast-style';
      s.textContent = [
        '#cw-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(8px);',
        'background:rgba(15,23,42,0.92);color:#fff;padding:11px 20px;border-radius:10px;',
        'font-size:13px;font-weight:600;font-family:inherit;',
        'box-shadow:0 8px 24px rgba(0,0,0,0.20);opacity:0;',
        'transition:opacity .25s,transform .25s;z-index:99999;white-space:nowrap;pointer-events:none;}',
        '#cw-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}',
        '#cw-toast.cw-t-success{background:linear-gradient(135deg,#16a34a,#15803d);}',
        '#cw-toast.cw-t-error{background:linear-gradient(135deg,#dc2626,#b91c1c);}',
      ].join('');
      document.head.appendChild(s);
    }

    let toast = document.getElementById('cw-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cw-toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className   = 'show' + (type === 'success' ? ' cw-t-success' : type === 'error' ? ' cw-t-error' : '');

    clearTimeout(toast._timer);
    toast._timer = setTimeout(function() {
      toast.className = toast.className.replace(/\bshow\b/g, '').trim();
    }, 3000);
  }

  // ── Public surface ───────────────────────────────────────────────────
  global.CWProfile = {
    // Profile
    getProfile        : getProfile,
    createProfile     : createProfile,
    clearProfile      : clearProfile,
    // Results
    saveResult        : saveResult,
    getResult         : getResult,
    getSavedResult    : getResult,   // alias for backwards compat
    getAllResults      : getAllResults,
    isCompleted       : isCompleted,
    getCompletionCount: getCompletionCount,
    // Shared cross-calculator data
    getSharedData     : getSharedData,
    mergeShared       : mergeShared,
    prefillFromShared : prefillFromShared,
    // UI helpers
    showSavePrompt    : showSavePrompt,
    showToast         : showToast,
    // Modal internals (called by inline onclick)
    _submit           : _submitModal,
    _close            : _closeModal,
    // Metadata
    CALC_META         : CALC_META,
    fmt               : fmt,
  };

  // Auto-init Firebase once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInitFirebase);
  } else {
    tryInitFirebase();
  }

}(window));
