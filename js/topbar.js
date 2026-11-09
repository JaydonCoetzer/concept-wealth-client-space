/* ============================================================
   Main-site top menu bar  ·  Concept Wealth
   Horizontal nav for the public/main site. TrustFile is one
   destination that opens into its own left-sidebar app.
   Page: <script src="js/topbar.js" data-page="dashboard"></script>
   ============================================================ */
(function () {
  var ADVISOR_CONTACT = 'mailto:mcoetzer@sanlam4u.co.za?subject=Review%20request'; // OPEN DECISION
  window.CW_ADVISOR_CONTACT = ADVISOR_CONTACT;

  var el   = document.currentScript;
  var page = (el && el.getAttribute('data-page')) || '';

  var NAV = [
    { id:'dashboard',  label:'Dashboard',   href:'dashboard.html' },
    { id:'profile',    label:'Profile',     href:'profile.html' },
    { id:'tools',      label:'Calculators', href:'tools.html' },
    { id:'resources',  label:'Resources',   dd:[
        { label:'Weekly market update', sub:'Where markets moved this week', href:'resources.html#market' },
        { label:'Articles',             sub:'Money reading worth your time',  href:'resources.html#articles' },
        { label:'Guides',               sub:'Plain-English how-tos',          href:'resources.html#guides' }
    ]},
    { id:'trustfile',  label:'TrustFile',   href:'trustfile.html' },
    { id:'about',      label:'About',       href:'about.html' }
  ];

  function shield(){ return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7z"/><path d="M9 12l2 2 4-4"/></svg>'; }
  function chev(){ return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="6 9 12 15 18 9"/></svg>'; }

  var navHtml = NAV.map(function (n) {
    if (n.dd) {
      return '<div class="has-dd" data-dd><button class="dd-toggle'+(n.id===page?' active':'')+'">'+n.label+' '+chev()+'</button>'+
        '<div class="tf-dd">'+ n.dd.map(function(d){ return '<a href="'+d.href+'">'+d.label+'<small>'+d.sub+'</small></a>'; }).join('') +'</div></div>';
    }
    return '<a href="'+n.href+'"'+(n.id===page?' class="active"':'')+'>'+n.label+'</a>';
  }).join('');

  var bar = document.createElement('div');
  bar.className = 'tf-topbar';
  bar.innerHTML =
    '<div class="tf-brand">'+
      '<div class="tf-logo">'+shield()+'</div>'+
      '<div><div class="tf-brand-name">Concept Wealth</div><div class="tf-brand-sub">Woodhill BlueStar</div></div>'+
    '</div>'+
    '<nav class="tf-nav">'+navHtml+'</nav>'+
    '<div class="tf-topbar-actions">'+
      '<a href="'+ADVISOR_CONTACT+'" class="tf-btn tf-btn-primary tf-btn-sm">Talk to an adviser</a>'+
      '<button class="tf-burger" id="tfBurger" aria-label="Menu"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>'+
    '</div>';
  document.body.insertBefore(bar, document.body.firstChild);

  // interactions
  document.addEventListener('click', function (e) {
    if (e.target.closest('#tfBurger')) { bar.classList.toggle('open'); return; }
    var ddBtn = e.target.closest('.has-dd .dd-toggle');
    var openDd = bar.querySelector('.has-dd.open');
    if (ddBtn) {
      var parent = ddBtn.closest('.has-dd');
      if (openDd && openDd !== parent) openDd.classList.remove('open');
      parent.classList.toggle('open');
      e.preventDefault();
    } else if (!e.target.closest('.tf-dd') && openDd) {
      openDd.classList.remove('open');
    }
  });
})();
