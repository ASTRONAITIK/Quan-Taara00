/* ━━━━━━━━━━━━ PHYSICS MODAL ━━━━━━━━━━━━
   The discipline deep-dive modal and its equation detail panel. Depends on
   DATA (11-physics-data.js), renderInteractivePlot() (14-interactive-plot.js),
   manimAnimate() (15-simulation-2d.js), and buildScene3D() (16-scene3d.js).
   The modal-close button wiring lives in 18-app-init.js so it can safely
   reference stopEquationSimulation()/stopScene3D() regardless of load order. */
const $modal=document.getElementById('modal'),$mbody=document.getElementById('mbody'),$dpanel=document.getElementById('dpanel');
function esc(s){return(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n');}

function openModal(id){
  const d=DATA.find(p=>p.id===id);if(!d)return;
  document.getElementById('mtitle').textContent=d.title;
  $mbody.innerHTML=d.concepts.map(c=>`
    <div>
      <div class="concept-lbl">Concept</div>
      <h3 class="concept-title">${c.title}</h3>
      <p class="concept-desc">${c.desc||''}</p>
      <div class="eq-grid">${c.eqs.map(eq=>`<div class="eq-card" onclick="showDetail('${esc(eq.f)}','${esc(eq.n)}','${esc(eq.x)}','${esc(eq.d)}',this,'${esc(eq.sim||'')}')"><div class="eq-formula">${eq.f}</div><div class="eq-name">${eq.n}</div></div>`).join('')}</div>
    </div>`).join('');
  $dpanel.classList.remove('open');$modal.classList.add('active');document.body.style.overflow='hidden';
}

function showDetail(f,n,x,d,el,sim){
  document.querySelectorAll('.eq-card').forEach(c=>c.classList.remove('sel'));el.classList.add('sel');
  document.getElementById('dp-title').textContent=n;
  document.getElementById('dp-fml').textContent=f;
  document.getElementById('dp-exp').textContent=x;
  document.getElementById('dp-drv').textContent=(d||'').replace(/\\n/g,'\n');
  $dpanel.classList.add('open');
  manimAnimate(f,n,sim);
  renderInteractivePlot(f,n);
  buildScene3D(n,f);
}