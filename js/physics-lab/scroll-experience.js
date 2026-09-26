/* ━━━━━━━━━━━━ SCROLLYTELLING ━━━━━━━━━━━━
   Rail dots, sticky caption, progress bar, section reveal, and parallax
   drift on the main page as the person scrolls. Depends on DATA (from
   11-physics-data.js) for the discipline-card signal labels, VIEW (from
   02-nav.js), and the .pcard elements rendered by 12-physics-render.js.
   Called once from 18-app-init.js's window 'load' handler. */
function initScrolly(){
  const secs=[['hero','Event Horizon'],['disciples','Disciplines'],['tl-sec','Timeline'],['ab-sec','Observatory']];
  const rail=document.getElementById('srail'),cap=document.getElementById('scap');
  const progress=document.getElementById('sprogress'),signal=document.getElementById('ssignal'),signalText=document.getElementById('ssignalText');
  rail.innerHTML=secs.map(()=>'<i></i>').join('');
  const dots=[...rail.children];
  const targets=secs.map(([id])=>document.getElementById(id)||document.querySelector('.'+id));
  const cards=[...document.querySelectorAll('.pcard')];
  const setSignal=(label)=>{
    if(signalText)signalText.textContent=label.toUpperCase();
    if(signal)signal.classList.add('on');
  };
  const io=new IntersectionObserver(es=>{
    es.forEach(e=>{if(e.isIntersecting){
      const i=targets.indexOf(e.target);if(i<0)return;
      dots.forEach((d,k)=>d.classList.toggle('act',k===i));
      cap.textContent=secs[i][1];
      setSignal(secs[i][1]);
      rail.classList.toggle('on',VIEW==='main');cap.classList.toggle('on',VIEW==='main');
      if(progress)progress.style.opacity=VIEW==='main'?'1':'0';
    }});
  },{threshold:.35});
  targets.forEach(t=>t&&io.observe(t));
  const cardIo=new IntersectionObserver(es=>{
    es.forEach(e=>{if(e.isIntersecting){
      const card=e.target,index=cards.indexOf(card),item=DATA[index];
      if(item){
        setSignal(`${String(index+1).padStart(2,'0')} // ${item.title}`);
        document.body.dataset.discipline=item.title;
        card.classList.add('orbit-in');
      }
    }});
  },{threshold:.58});
  cards.forEach(card=>cardIo.observe(card));
  const rio=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');rio.unobserve(e.target);}})},{threshold:.14});
  document.querySelectorAll('#main-view section > *, .pcard, .tl-item').forEach((el,i)=>{
    el.classList.add('reveal','reveal-d'+((i%4)+1));rio.observe(el);
  });
  /* parallax drift on scroll: the page becomes a quiet orbital instrument. */
  let ticking=false;
  window.addEventListener('scroll',()=>{
    if(ticking||VIEW!=='main')return;ticking=true;
    requestAnimationFrame(()=>{
      const y=window.scrollY;
      const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
      if(progress)progress.querySelector('span').style.height=Math.max(8,Math.min(100,(y/max)*100))+'%';
      document.querySelectorAll('#main-view section').forEach((sec,i)=>{
        const r=sec.getBoundingClientRect();
        const p=Math.max(-1,Math.min(1,(r.top+r.height/2-innerHeight/2)/innerHeight));
        sec.style.setProperty('--par',p.toFixed(3));
      });
      cards.forEach(card=>{
        const r=card.getBoundingClientRect(),distance=(r.top+r.height*.5-innerHeight*.5)/innerHeight;
        card.style.setProperty('--orbit-y',(Math.max(-1,Math.min(1,distance))*-8).toFixed(2)+'px');
      });
      const bg=document.getElementById('bg-cv');
      if(bg)bg.style.transform='translateY('+(y*.06).toFixed(1)+'px) scale('+(1+Math.min(y/9000,.06)).toFixed(3)+')';
      ticking=false;
    });
  },{passive:true});
}