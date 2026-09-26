/* ━━━━━━━━━━━━ VIEW ROUTER / NAV ━━━━━━━━━━━━
   Switches between the "main" scrolly page and the "earth" globe view,
   plus the hamburger nav toggle. Calls into the Earth Globe module
   (startGlobe/stopGlobe) and the EONET module (fetchEonet) at click-time,
   so this file just needs to load before the user can click — it does not
   need to load after globe.js/eonet.js. */
let VIEW='main';
/* ── NAV HELPERS ── */
function toggleNav(){const n=document.getElementById('mainNav'),t=document.getElementById('navToggle');const open=!n.classList.contains('open');n.classList.toggle('open',open);t.setAttribute('aria-expanded',open?'true':'false');t.setAttribute('aria-label',open?'Close menu':'Open menu');}
function closeNav(){const n=document.getElementById('mainNav'),t=document.getElementById('navToggle');if(n.classList.contains('open')){n.classList.remove('open');t.setAttribute('aria-expanded','false');t.setAttribute('aria-label','Open menu');}}
document.addEventListener('click',e=>{const n=document.getElementById('mainNav');if(n&&n.classList.contains('open')&&!n.contains(e.target))closeNav();});
function navGo(sectionId) {
  try {
    // If currently on earth view, switch back to main first
    if (VIEW === 'earth') {
      VIEW = 'main';
      stopGlobe();
      document.getElementById('main-view').style.display = 'block';
      document.getElementById('earth-view').classList.remove('active');
      document.getElementById('bg-cv').style.display = 'block';
      document.getElementById('globe-cv').style.display = 'none';
      document.querySelector('.vig').style.removeProperty('opacity');
      document.querySelector('.noise').style.removeProperty('opacity');
      document.body.style.overflow = '';
      document.getElementById('nv-e').classList.remove('active');
      document.getElementById('srail').classList.add('on');document.getElementById('scap').classList.add('on');
      document.getElementById('sprogress').style.opacity='1';
      document.getElementById('ssignal').classList.add('on');
      ['nv-d','nv-t','nv-a','nv-s'].forEach(function(id){
        document.getElementById(id).classList.remove('active');
      });
    }
    // Scroll to section
    setTimeout(function(){
      var el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({behavior:'smooth'});
    }, VIEW === 'earth' ? 120 : 20);
  } catch(e) { console.error('navGo error:', e); }
}

function navEarth() {
  try {
    VIEW = 'earth';
    document.getElementById('main-view').style.display = 'none';
    document.getElementById('earth-view').classList.add('active');
    document.getElementById('bg-cv').style.display = 'none';
    document.getElementById('globe-cv').style.display = 'block';
    document.querySelector('.vig').style.opacity = '0';
    document.querySelector('.noise').style.opacity = '0';
    document.body.style.overflow = 'hidden';
    document.getElementById('nv-e').classList.add('active');
    document.getElementById('srail').classList.remove('on');document.getElementById('scap').classList.remove('on');
    document.getElementById('sprogress').style.opacity='0';
    document.getElementById('ssignal').classList.remove('on');
    ['nv-d','nv-t','nv-a','nv-s'].forEach(function(id){
      document.getElementById(id).classList.remove('active');
    });
    // Sync mobile nav
    startGlobe();
    fetchEonet();
  } catch(e) { console.error('navEarth error:', e); }
}

// Keep showView as alias for any remaining internal calls
function showView(v) { if(v==='earth') navEarth(); else navGo('disciples'); }