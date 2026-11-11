/* ============================================================
   Main-site top menu bar  ·  Concept Wealth
   Home · Dashboard · Calculators · Resources(link+dropdown) ·
   TrustFile · About. Profile lives in the top-right account link.
   Page: <script src="js/topbar.js" data-page="home"></script>
   ============================================================ */
(function () {
  var ADVISOR_CONTACT = 'mailto:mcoetzer@sanlam4u.co.za?subject=Review%20request'; // OPEN DECISION
  window.CW_ADVISOR_CONTACT = ADVISOR_CONTACT;

  var el   = document.currentScript;
  var page = (el && el.getAttribute('data-page')) || '';

  var NAV = [
    { id:'home',      label:'Home',        href:'home.html' },
    { id:'dashboard', label:'Dashboard',   href:'dashboard.html' },
    { id:'tools',     label:'Calculators', href:'tools.html' },
    { id:'resources', label:'Resources',   href:'resources.html', dd:[
        { label:'All resources',        sub:'Everything in one place',        href:'resources.html' },
        { label:'Weekly market update', sub:'Where markets moved this week',  href:'resources.html#market' },
        { label:'Articles',             sub:'Money reading worth your time',  href:'resources.html#articles' },
        { label:'Guides',               sub:'Plain-English how-tos',          href:'resources.html#guides' }
    ]},
    { id:'trustfile', label:'TrustFile',   href:'trustfile.html' },
    { id:'about',     label:'About',       href:'about.html' }
  ];

  function shield(){ return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7z"/><path d="M9 12l2 2 4-4"/></svg>'; }
  function chev(){ return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="margin-left:2px;"><polyline points="6 9 12 15 18 9"/></svg>'; }

  var navHtml = NAV.map(function (n) {
    if (n.dd) {
      return '<div class="has-dd"><a href="'+n.href+'" class="dd-link'+(n.id===page?' active':'')+'">'+n.label+chev()+'</a>'+
        '<div class="tf-dd">'+ n.dd.map(function(d){ return '<a href="'+d.href+'">'+d.label+'<small>'+d.sub+'</small></a>'; }).join('') +'</div></div>';
    }
    return '<a href="'+n.href+'"'+(n.id===page?' class="active"':'')+'>'+n.label+'</a>';
  }).join('');

  // account (top-right) — profile lives here
  var name='';
  try { if (window.CWProfile && CWProfile.getProfile()) name = (CWProfile.getProfile().firstName||''); } catch(e){}
  var account = name
    ? '<a href="profile.html" class="tf-acct">Hi, '+name+'</a>'
    : '<a href="profile.html" class="tf-acct">Sign in</a>';

  var bar = document.createElement('div');
  bar.className = 'tf-topbar';
  bar.innerHTML =
    '<a href="home.html" class="tf-brand" style="text-decoration:none;">'+
      '<div class="tf-logo">'+shield()+'</div>'+
      '<div><div class="tf-brand-name">Concept Wealth</div><div class="tf-brand-sub">Woodhill BlueStar</div></div>'+
    '</a>'+
    '<nav class="tf-nav">'+navHtml+'</nav>'+
    '<div class="tf-topbar-actions">'+
      account+
      '<a href="'+ADVISOR_CONTACT+'" class="tf-btn tf-btn-primary tf-btn-sm">Talk to an adviser</a>'+
      '<button class="tf-burger" id="tfBurger" aria-label="Menu"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>'+
    '</div>';
  document.body.insertBefore(bar, document.body.firstChild);

  document.addEventListener('click', function (e) {
    if (e.target.closest('#tfBurger')) { bar.classList.toggle('open'); }
  });
})();
