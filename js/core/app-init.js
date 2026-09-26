/* ━━━━━━━━━━━━ REMAINING COMPONENTS ━━━━━━━━━━━━
   Code that was still present only in Quan-Taara00/Mainscript.js after the
   01–17 split: app startup and modal cleanup listeners. Load this after
   01–17. */

/* ── Application startup ── */
window.addEventListener('load',async()=>{
  document.getElementById('ltxt').textContent='Detecting server…';
  await detectBackend();
  document.getElementById('authSub').textContent=useBackend?'Cloud account service connected ✓':'Offline mode — local auth, Groq AI';
  setTimeout(()=>document.getElementById('loader').classList.add('gone'),500);
  document.querySelectorAll('a,button,.pcard,.eq-card,input').forEach(addHov);
  await checkAuth();
  try{initScrolly();}catch(e){console.warn('scrolly',e);}
  try{initEquationSearch();}catch(e){console.warn('equation search',e);}
});

/* ── Modal and simulation cleanup ── */
document.getElementById('mclose').addEventListener('click',()=>{$modal.classList.remove('active');document.body.style.overflow='';$dpanel.classList.remove('open');stopEquationSimulation();});
document.getElementById('dp-close').addEventListener('click',()=>{$dpanel.classList.remove('open');document.querySelectorAll('.eq-card').forEach(c=>c.classList.remove('sel'));stopEquationSimulation();});
$modal.addEventListener('click',e=>{if(e.target===$modal){$modal.classList.remove('active');document.body.style.overflow='';$dpanel.classList.remove('open');stopScene3D();stopEquationSimulation();}});
document.getElementById('mclose').addEventListener('click',()=>stopScene3D(),{capture:true});
document.getElementById('dp-close').addEventListener('click',()=>stopScene3D(),{capture:true});
