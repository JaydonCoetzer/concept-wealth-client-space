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

  // Attach live-calc to a list of ids; money ids also format on blur.
  function bind(ids, cb, moneyIds){
    moneyIds = moneyIds || [];
    ids.forEach(function(id){
      var el=document.getElementById(id); if(!el) return;
      var ev = (el.tagName==='SELECT') ? 'change' : 'input';
      el.addEventListener(ev, cb);
      if(moneyIds.indexOf(id)>-1) el.addEventListener('blur', function(){ fmtField(el); });
    });
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
