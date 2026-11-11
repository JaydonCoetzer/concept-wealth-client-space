/* ============================================================
   Shared calculator helpers  ·  Concept Wealth client space
   Formatting, input parsing, and profile-save, so each
   calculator page stays small and consistent.
   ============================================================ */
var CW = (function () {
  function pAmt(s){ if(typeof s!=='string') return +s||0; var n=parseFloat(s.replace(/[^\d.-]/g,'')); return isNaN(n)?0:n; }
  function fmtR(v){ if(v==null||isNaN(v)||!isFinite(v)) return 'R 0'; var n=Math.round(Math.abs(v)); var s=n.toLocaleString('en-ZA').replace(/,/g,' '); return (v<0?'-R ':'R ')+s; }
  function fmtPct(v,d){ if(d==null)d=1; if(v==null||isNaN(v)) return '0%'; return v.toFixed(d).replace('.',',')+'%'; }
  function gA(id){ var e=document.getElementById(id); return e?pAmt(e.value):0; }
  function gN(id){ var e=document.getElementById(id); return e?(parseFloat(e.value)||0):0; }
  function gV(id){ var e=document.getElementById(id); return e?e.value:''; }
  function fmtField(el){ var v=pAmt(el.value); el.value = v ? v.toLocaleString('en-ZA').replace(/,/g,' ') : (el.value===''?'':'0'); }

  // Wire inputs + the Calculate button. Results update ONLY when the user
  // clicks Calculate (id="calcBtn") or presses Enter — not on every keystroke.
  // Changing an input marks the Calculate button so it is clear an update is due.
  function bind(ids, cb, moneyIds){
    moneyIds = moneyIds || [];
    var btn = document.getElementById('calcBtn');
    function run(){ cb(); if(btn) btn.classList.remove('dirty'); }
    function dirty(){ if(btn) btn.classList.add('dirty'); }
    ids.forEach(function(id){
      var el=document.getElementById(id); if(!el) return;
      if(moneyIds.indexOf(id)>-1) el.addEventListener('blur', function(){ fmtField(el); });
      el.addEventListener('input', dirty);
      el.addEventListener('change', dirty);
      el.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); run(); } });
    });
    if(btn) btn.addEventListener('click', run);
    cb(); // show an initial result for the default inputs
    return run;
  }

  // Save to the client profile (prompts for name/email if none yet).
  function save(id, payload){
    function write(){ if(window.CWProfile) CWProfile.saveResult(id, payload); if(window.CWProfile&&CWProfile.showToast) CWProfile.showToast('Saved to your profile','success'); }
    if(window.CWProfile && CWProfile.getProfile && CWProfile.getProfile()) write();
    else if(window.CWProfile && CWProfile.showSavePrompt) CWProfile.showSavePrompt(write);
    else write();
  }

  return { pAmt:pAmt, fmtR:fmtR, fmtPct:fmtPct, gA:gA, gN:gN, gV:gV, fmtField:fmtField, bind:bind, save:save };
})();
