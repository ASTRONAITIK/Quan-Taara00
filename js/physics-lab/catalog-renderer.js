/* ━━━━━━━━━━━━ RENDER PHYSICS ━━━━━━━━━━━━
   Builds the discipline card grid (#pgrid) and the discovery timeline
   (#tl) from DATA/TL (11-physics-data.js). Card clicks call openModal(),
   defined in 13-physics-modal.js — a forward reference that's fine since
   it only runs later, on click. Depends on addHov() from 01-cursor.js. */
const $pgrid=document.getElementById('pgrid');
DATA.forEach(item=>{
  const c=document.createElement('div');c.className='pcard';
  c.innerHTML=`<div class="orbit"></div><span class="pcard-badge ${item.badge}">${item.field}</span><div class="pcard-id"><span>${item.title.toUpperCase()}</span><span class="pcard-num">${String(item.id).padStart(2,'0')}</span></div><h3 class="pcard-title">${item.title}</h3><p class="pcard-desc">${item.basic}</p><div class="pcard-tags">${item.tags.map(t=>`<span class="pcard-tag">${t}</span>`).join('')}</div><div class="pcard-go"><span>Explore Equations</span><div class="go-arr"></div></div>`;
  c.addEventListener('mousemove',e=>{const r=c.getBoundingClientRect();c.style.transform=`perspective(900px) rotateX(${((e.clientY-r.top)/r.height-.5)*7}deg) rotateY(${(.5-(e.clientX-r.left)/r.width)*7}deg) translateY(-3px)`;});
  c.addEventListener('mouseleave',()=>{c.style.transform='';});
  c.addEventListener('click',()=>openModal(item.id));addHov(c);
  $pgrid.appendChild(c);
});

const $tl=document.getElementById('tl');
TL.forEach(item=>{const d=document.createElement('div');d.className='t-item';d.innerHTML=`<div class="t-node"></div><div class="t-year">${item.yr}</div><div class="t-title">${item.t}</div><p class="t-desc">${item.d}</p>`;$tl.appendChild(d);});
new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('vis');}),{threshold:.15}).observe.bind(null,...$tl.children);
document.querySelectorAll('.t-item').forEach(el=>new IntersectionObserver(en=>en.forEach(e=>{if(e.isIntersecting)e.target.classList.add('vis');}),{threshold:.15}).observe(el));