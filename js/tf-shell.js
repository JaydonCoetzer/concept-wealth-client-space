/* ============================================================
   TrustFile sub-app shell  ·  left sidebar
   Used only inside the TrustFile product (more complex,
   subscription + vault). The rest of the site uses topbar.js.
   Page markup:
     <div class="app" id="app"><div class="app-main">
       <div class="app-content"> ...content... </div>
     </div></div>
     <script src="js/tf-shell.js" data-page="home" data-title="Home"></script>
   ============================================================ */
(function () {
  var ADVISOR_CONTACT = 'mailto:mcoetzer@sanlam4u.co.za?subject=Review%20request';
  window.CW_ADVISOR_CONTACT = ADVISOR_CONTACT;

  var I = {
    home:   '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    user:   '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    will:   '<path d="M6 3h9l3 3v15H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    docs:   '<path d="M4 4h9l3 3h4v13H4z"/>',
    people: '<circle cx="8" cy="9" r="3"/><circle cx="17" cy="10" r="2.4"/><path d="M2 20c0-3 3-5 6-5s6 2 6 5"/><path d="M15 20c0-2 2-3.5 4-3.5"/>',
    chat:   '<path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/>',
    estate: '<rect x="5" y="4" width="14" height="16" rx="1.5"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    lock:   '<path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7z"/><path d="M12 11v3"/><circle cx="12" cy="10" r="0"/>',
    tf:     '<rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" stroke="none"/><path d="M8 12l3 3 5-6" stroke="#fff" stroke-width="2"/>'
  };
  function svg(n, extra){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" '+(extra||'')+'>'+I[n]+'</svg>'; }

  var NAV = [
    { id:'home',     sid:'home',     label:'Home',              href:'trustfile.html',             icon:'home' },
    { id:'profile',  sid:'profile',  label:'Profile',           href:'tf-section.html?s=profile',  icon:'user' },
    { id:'my-will',  sid:'will',     label:'My Will',           href:'my-will.html',               icon:'will' },
    { id:'docs',     sid:'documents',label:'Documents',         href:'tf-section.html?s=documents',icon:'docs' },
    { id:'people',   sid:'people',   label:'People & Access',   href:'tf-section.html?s=people',   icon:'people' },
    { id:'messages', sid:'messages', label:'Messages',          href:'tf-section.html?s=messages', icon:'chat' },
    { id:'estate',   sid:'estate',   label:'Estate Costs',      href:'estate_cost_calculator.html',icon:'estate' },
    { id:'security', sid:'security', label:'Security & Privacy',href:'tf-section.html?s=security', icon:'lock' }
  ];

  var el    = document.currentScript;
  var page  = (el && el.getAttribute('data-page')) || '';
  var title = (el && el.getAttribute('data-title')) || '';
  var sParam= new URLSearchParams(location.search).get('s') || '';
  var app   = document.getElementById('app');
  if (!app) return;

  var name = '';
  try { if (window.CWProfile && CWProfile.getProfile()) name = (CWProfile.getProfile().firstName||''); } catch(e){}

  var navHtml = NAV.map(function (n) {
    var active = (n.id===page) || (sParam && n.sid===sParam);
    return '<a href="'+n.href+'" class="'+(active?'active':'')+'">'+svg(n.icon)+'<span>'+n.label+'</span></a>';
  }).join('');

  var sidebar = document.createElement('aside');
  sidebar.className = 'app-sidebar';
  sidebar.innerHTML =
    '<div class="app-sb-brand">'+
      '<div class="tf-logo" style="background:var(--teal-deep)">'+svg('tf')+'</div>'+
      '<div class="tf-brand-name" style="font-size:17px">TrustFile</div>'+
    '</div>'+
    '<nav class="app-nav">'+navHtml+'</nav>'+
    '<div class="app-sb-foot">'+
      '<a href="home.html" class="app-back" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;margin-bottom:8px;">'+
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> Concept Wealth site</a>'+
      '<a href="'+ADVISOR_CONTACT+'" class="tf-btn tf-btn-primary tf-btn-block tf-btn-sm">'+svg('chat')+' Talk to your adviser</a>'+
    '</div>';
  app.insertBefore(sidebar, app.firstChild);

  var main = app.querySelector('.app-main');
  if (main) {
    var topbar = document.createElement('div');
    topbar.className = 'app-topbar';
    topbar.innerHTML =
      '<div style="display:flex;align-items:center;gap:12px;">'+
        '<button class="app-burger" id="burger" aria-label="Menu"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>'+
        '<span class="crumb">TrustFile · '+(title||'')+'</span>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:12px;">'+
        (name ? '<span style="font-size:13px;color:var(--muted);font-weight:600;">'+name+'</span>' : '')+
        '<span class="tf-tag tf-tag-teal">Family plan</span>'+
      '</div>';
    main.insertBefore(topbar, main.firstChild);
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('#burger')) { app.classList.toggle('nav-open'); }
    else if (app.classList.contains('nav-open') && !e.target.closest('.app-sidebar')) { app.classList.remove('nav-open'); }
  });
})();
