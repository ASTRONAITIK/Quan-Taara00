/* =============================================================================
   Quan-Taara — missing components only
   (present in HTML <script>, absent from the raw standalone JS)

   Drop into your component split as separate modules if you prefer:
     1. auth-hybrid
     2. astropix-ai
     3. simulation-expanded  (replaces / extends the basic sim engine)
     4. equation-search-refined

   Does NOT include: DATA archive, globe, black-hole BG, weather, 3D SCENE_BUILDERS
   (those live in your existing components).
   ============================================================================= */


/* ── 1. AUTH — HYBRID ── */
/* ━━━━━━━━━━━━ AUTH — HYBRID ━━━━━━━━━━━━ */
let authToken=null,authUser=null,useBackend=false;
function localUsers(){try{return JSON.parse(localStorage.getItem('qt_users')||'{}')}catch{return{}}}
function saveLocalUsers(u){localStorage.setItem('qt_users',JSON.stringify(u));}

async function detectBackend(){try{const r=await fetch('/api/public/auth/me',{signal:AbortSignal.timeout(1800)});await r.json();useBackend=true;}catch{useBackend=false;}}

window.addEventListener('load',async()=>{
  document.getElementById('ltxt').textContent='Preparing the observatory…';
  await detectBackend();
  document.getElementById('authSub').textContent=useBackend?'Backend connected · ASTROPIX ready':'Offline mode · local physics guide';
  setTimeout(()=>document.getElementById('loader').classList.add('gone'),500);
  await checkAuth();
  try{initScrolly();}catch(e){console.warn('scrolly',e);}
  try{initEquationSearch();}catch(e){console.warn('equation search',e);}
});

async function checkAuth(){
  if(useBackend){
    const st=localStorage.getItem('qt_token');if(!st){showAuth();return;}
    try{const r=await fetch('/api/public/auth/me',{headers:{Authorization:'Bearer '+st}});if(!r.ok)throw 0;const d=await r.json();authToken=st;authUser=d.username;hideAuth();setNav(d.username);addMsg('Welcome back, '+d.username+'! Ask me anything.','bot');}
    catch{localStorage.removeItem('qt_token');showAuth();}
  }else{
    const s=localStorage.getItem('qt_local_session');
    if(s){authUser=s;authToken='local';hideAuth();setNav(s);addMsg('Welcome back, '+s+'! Offline mode is using ASTROPIX’s local physics guide.','bot');}
    else showAuth();
  }
}
function showAuth(){document.getElementById('authOverlay').classList.remove('hidden');}
function hideAuth(){document.getElementById('authOverlay').classList.add('hidden');}
function setNav(u){document.getElementById('navUser').style.display='flex';document.getElementById('navUname').textContent=u+(useBackend?'':' (offline)');}
function switchTab(t){const il=t==='login';['tabLogin','tabReg'].forEach((id,i)=>document.getElementById(id).classList.toggle('active',il?i===0:i===1));['formLogin','formReg'].forEach((id,i)=>document.getElementById(id).classList.toggle('hidden',il?i===1:i===0));document.getElementById('loginErr').textContent='';document.getElementById('regErr').textContent='';}

async function doLogin(){
  const email=document.getElementById('loginEmail').value.trim(),pass=document.getElementById('loginPass').value;
  const err=document.getElementById('loginErr');err.textContent='';
  if(!email||!pass){err.textContent='Please fill in all fields.';return;}
  const btn=document.getElementById('btnLogin');btn.disabled=true;btn.querySelector('span').textContent='Authenticating…';
  try{
    if(useBackend){const r=await fetch('/api/public/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pass})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Login failed.');localStorage.setItem('qt_token',d.token);authToken=d.token;authUser=d.username;}
    else{const us=localUsers(),k=email.toLowerCase();if(!us[k])throw new Error('No account for that email. Register first.');if(us[k].p!==btoa(pass))throw new Error('Incorrect password.');authUser=us[k].n;authToken='local';localStorage.setItem('qt_local_session',authUser);}
    hideAuth();setNav(authUser);aimsgs.innerHTML='';addMsg('Welcome back, '+authUser+'! The cosmos awaits.','bot');
  }catch(e){err.textContent=e.message||'Login failed.';}
  finally{btn.disabled=false;btn.querySelector('span').textContent='Enter the Interface';}
}
async function doRegister(){
  const username=document.getElementById('regUser').value.trim(),email=document.getElementById('regEmail').value.trim(),pass=document.getElementById('regPass').value;
  const err=document.getElementById('regErr');err.textContent='';
  if(!username||!email||!pass){err.textContent='Please fill in all fields.';return;}
  if(username.length<2){err.textContent='Username must be at least 2 characters.';return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){err.textContent='Please enter a valid email.';return;}
  if(pass.length<6){err.textContent='Password must be at least 6 characters.';return;}
  const btn=document.getElementById('btnRegister');btn.disabled=true;btn.querySelector('span').textContent='Creating…';
  try{
    if(useBackend){const r=await fetch('/api/public/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,email,password:pass})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Registration failed.');localStorage.setItem('qt_token',d.token);authToken=d.token;authUser=d.username;}
    else{const us=localUsers(),k=email.toLowerCase();if(us[k])throw new Error('Account already exists for that email.');us[k]={n:username,p:btoa(pass)};saveLocalUsers(us);authUser=username;authToken='local';localStorage.setItem('qt_local_session',authUser);}
    hideAuth();setNav(authUser);aimsgs.innerHTML='';addMsg('Welcome to Quan-Taara, '+authUser+'!','bot');
  }catch(e){err.textContent=e.message||'Registration failed.';}
  finally{btn.disabled=false;btn.querySelector('span').textContent='Create Account';}
}
function logout(){localStorage.removeItem('qt_token');localStorage.removeItem('qt_local_session');authToken=null;authUser=null;document.getElementById('navUser').style.display='none';aimsgs.innerHTML='';addMsg('Logged out. Sign in to continue.','bot');showAuth();}
document.getElementById('loginPass').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
document.getElementById('regPass').addEventListener('keydown', e=>{if(e.key==='Enter')doRegister();});

/* ━━━━━━━━━━━━ AI CHAT ━━━━━━━━━━━━ */
const aitrig=document.getElementById('aitrig'),aiwin=document.getElementById('aiwin');
const aimsgs=document.getElementById('aimsgs'),aiinp=document.getElementById('aiinp'),aisend=document.getElementById('aisend');
const histPanel=document.getElementById('histPanel');
let histVis=false,convHist=[];

aitrig.addEventListener('click',()=>aiwin.classList.toggle('open'));

function addMsg(txt,type){const d=document.createElement('div');d.className='msg '+type;d.textContent=txt;aimsgs.appendChild(d);aimsgs.scrollTop=aimsgs.scrollHeight;return d;}
function addTag(txt,cls){const t=document.createElement('div');t.className='msg-tag '+cls;t.textContent=txt;aimsgs.appendChild(t);}

function toggleHist(){histVis=!histVis;document.getElementById('aiHBtn').classList.toggle('active',histVis);histPanel.classList.toggle('vis',histVis);aimsgs.style.display=histVis?'none':'flex';if(histVis)loadHist();}
async function loadHist(){
  if(!authToken){histPanel.innerHTML='<div class="hist-empty">Sign in to view history.</div>';return;}
  if(!useBackend){histPanel.innerHTML='<div class="hist-empty">History requires the backend server.</div>';return;}
  histPanel.innerHTML='<div class="hist-empty">Loading…</div>';
  try{const r=await fetch('/api/public/chat',{headers:{Authorization:'Bearer '+authToken}});const logs=await r.json();
    if(!logs.length){histPanel.innerHTML='<div class="hist-empty">No chat history yet.</div>';return;}
    histPanel.innerHTML=logs.map(l=>`<div class="hist-item${l.is_ridiculous?' rid':''}"><div class="hist-q">${l.question.length>80?l.question.slice(0,80)+'…':l.question}</div><div class="hist-meta"><span>${new Date(l.created_at+'Z').toLocaleDateString()}</span>${l.is_ridiculous?'<span class="hist-rtag">⚡ absurd</span>':''}</div></div>`).join('');
  }catch{histPanel.innerHTML='<div class="hist-empty" style="color:rgba(255,100,100,.7)">Failed to load.</div>';}
}


/* ── 2. ASTROPIX AI ── */
/* ━━━━━━━━━━━━ LOCAL ASTROPIX CORE ━━━━━━━━━━━━ */
const localFacts=[
  {keys:['speed of light','how fast is light','speed light'],answer:'Light travels through vacuum at exactly 299,792,458 metres per second. That is the universal speed limit for information.'},
  {keys:['what is gravity','define gravity','gravity'],answer:'Gravity is the curvature of spacetime caused by mass and energy. In Newtonian language, two masses attract with F = Gm₁m₂/r².'},
  {keys:['what is a black hole','black hole','event horizon'],answer:'A black hole is a region where gravity curves spacetime so strongly that crossing its event horizon makes escape impossible, even for light.'},
  {keys:['what is quantum mechanics','define quantum','quantum mechanics'],answer:'Quantum mechanics describes nature at atomic scales. It uses a wavefunction to predict probabilities, with measurement outcomes that are inherently quantised.'},
  {keys:['what is relativity','special relativity','general relativity'],answer:'Relativity says measurements of space and time depend on motion, while gravity is geometry: mass and energy curve spacetime.'},
  {keys:['what is an atom','define atom','atom'],answer:'An atom is the smallest electrically neutral unit of an element: a compact nucleus of protons and neutrons surrounded by quantum electron states.'},
  {keys:['why is the sky blue','sky blue','rayleigh'],answer:'Air scatters short blue wavelengths more strongly than long red wavelengths. From Earth, that scattered blue light arrives from every direction.'},
  {keys:['what is entropy','define entropy','entropy'],answer:'Entropy measures how many microscopic arrangements correspond to a macroscopic state. For an isolated system, the total entropy does not decrease.'},
  {keys:['who are you','what are you','your name'],answer:'I am ASTROPIX, the science guide inside Quan-Taara. I can answer common questions offline and use a model configured on the server for broader tutoring.'}
];
function solveMotionWordProblem(question){
  const q=String(question||'').toLowerCase().replace(/[−–—]/g,'-');
  const number='(-?\\d+(?:\\.\\d+)?)';
  const forceMatch=q.match(new RegExp(number+'\\s*(?:newtons?|n)\\b'));
  const massMatch=q.match(new RegExp(number+'\\s*(?:kilograms?|kg)\\b'));
  if(!forceMatch||!massMatch)return null;
  const force=Number(forceMatch[1]),mass=Number(massMatch[1]);
  if(!Number.isFinite(force)||!Number.isFinite(mass)||mass===0)return null;
  const acceleration=force/mass;
  const accelerationAsked=/\b(acceleration|accelerate|accelerating)\b/.test(q);
  const speedAsked=/\b(speed|velocity|fast|moving)\b/.test(q);
  if(!accelerationAsked&&!speedAsked)return null;
  const timeMatch=q.match(new RegExp('(?:after|for|in|over)\\s+'+number+'\\s*(?:seconds?|secs?|s)\\b'));
  const time=timeMatch?Number(timeMatch[1]):null;
  const rest=/\b(?:from|at)\s+rest\b|\bstarts?\s+from\s+rest\b/.test(q);
  const initialMatch=q.match(new RegExp('(?:initial\\s+(?:speed|velocity)|initial\\s+u|u)\\s*(?:is|=|of)?\\s*'+number+'\\s*(?:m/s|mps|meters?\\s+per\\s+second)\\b'));
  const initial=initialMatch?Number(initialMatch[1]):(rest?0:null);
  const fmt=value=>Number(value.toFixed(8)).toString();
  const lines=[];
  if(accelerationAsked||speedAsked){
    lines.push(`1. Acceleration: a = F_net / m = ${fmt(force)} N / ${fmt(mass)} kg = ${fmt(acceleration)} m/s².`);
  }
  if(speedAsked&&time!==null&&Number.isFinite(time)){
    const u=initial===null?0:initial;
    const velocity=u+acceleration*time;
    lines.push(`2. Speed after ${fmt(time)} s: v = u + at = ${fmt(u)} + (${fmt(acceleration)} × ${fmt(time)}) = ${fmt(velocity)} m/s${initial===null?' (assuming it started from rest).':'.'}`);
  }
  return lines.join('\n');
}
function physicsQuantity(question,units){
  const unitPattern=units.join('|');
  const match=String(question||'').match(new RegExp('(-?\\d+(?:\\.\\d+)?)\\s*(?:'+unitPattern+')\\b','i'));
  return match?Number(match[1]):null;
}
function physicsNumberAfter(question,labels){
  const labelPattern=labels.join('|');
  const match=String(question||'').match(new RegExp('(?:'+labelPattern+')\\s*(?:is|=|of|at|to)?\\s*(-?\\d+(?:\\.\\d+)?)','i'));
  return match?Number(match[1]):null;
}
function solvePhysicsWordProblem(question){
  const q=String(question||'').toLowerCase().replace(/[−–—]/g,'-');
  const fmt=value=>Number(Number(value).toFixed(8)).toString();
  const g=physicsQuantity(q,['m/s\\^?2','m/s2','mps2'])||9.8;

  /* Free fall and projectile motion are kept separate from the force solver:
     their givens often contain no mass, but still have a closed-form model. */
  if(/\bfree[-\s]?fall|dropped|falls?\b|falling\b/.test(q)){
    const h=physicsQuantity(q,['m','meters?','metres?']);
    const t=physicsQuantity(q,['seconds?','secs?','s']);
    const asksTime=/\b(time|how long)\b/.test(q);
    const asksSpeed=/\b(speed|velocity|fast|moving)\b/.test(q);
    const asksDistance=/\b(distance|height|fall)\b/.test(q);
    if(h!==null&&asksTime){
      return `Free-fall model (from rest): h = ½gt²\n1. t = √(2h/g) = √(2 × ${fmt(h)} m / ${fmt(g)} m/s²) = ${fmt(Math.sqrt(2*h/g))} s.`;
    }
    if(t!==null&&(asksSpeed||asksDistance)){
      const lines=[];
      if(asksSpeed)lines.push(`1. Speed: v = gt = ${fmt(g)} × ${fmt(t)} = ${fmt(g*t)} m/s downward.`);
      if(asksDistance)lines.push(`${lines.length+1}. Distance fallen: h = ½gt² = ½ × ${fmt(g)} × ${fmt(t)}² = ${fmt(.5*g*t*t)} m.`);
      return lines.join('\n');
    }
  }
  if(/\bprojectile|launched|launch angle|thrown at\b/.test(q)){
    const u=physicsQuantity(q,['m/s','mps']);
    const angle=physicsQuantity(q,['degrees?','deg']);
    if(u!==null&&angle!==null){
      const radians=angle*Math.PI/180;
      const range=u*u*Math.sin(2*radians)/g;
      const maxHeight=u*u*Math.sin(radians)**2/(2*g);
      const flight=2*u*Math.sin(radians)/g;
      return `Projectile model (level launch and no air resistance):\n1. Flight time: T = 2u sinθ/g = ${fmt(flight)} s.\n2. Range: R = u² sin(2θ)/g = ${fmt(range)} m.\n3. Maximum height: H = u² sin²θ/(2g) = ${fmt(maxHeight)} m.`;
    }
  }

  const mass=physicsQuantity(q,['kilograms?','kg']);
  const speed=physicsQuantity(q,['m/s','mps','km/h']);
  const height=physicsQuantity(q,['meters?','metres?','m']);
  const force=physicsQuantity(q,['newtons?','n']);
  const distance=physicsQuantity(q,['meters?','metres?','m']);
  const time=physicsQuantity(q,['seconds?','secs?','s']);
  const energy=physicsQuantity(q,['joules?','j']);
  const volume=physicsQuantity(q,['m\\^?3','m3','litres?','liters?','l']);
  const current=physicsQuantity(q,['amperes?','amps?','a']);
  const voltage=physicsQuantity(q,['volts?','v']);
  const resistance=physicsQuantity(q,['ohms?','ohm']);
  const wavelength=physicsQuantity(q,['nanometers?','nm','micrometers?','μm','um','meters?','metres?','m']);
  const frequency=physicsQuantity(q,['hertz','hz']);
  const pressure=physicsQuantity(q,['pascals?','pa']);
  const temperature=physicsQuantity(q,['kelvin','k']);
  const moles=physicsQuantity(q,['moles?','mol']);

  if(/\bkinetic energy\b|\benergy of (?:the )?moving\b/.test(q)&&mass!==null&&speed!==null){
    const v=/\bkm\/h\b/.test(q)?speed/3.6:speed;
    return `Kinetic energy:\nEₖ = ½mv² = ½ × ${fmt(mass)} kg × ${fmt(v)}² m²/s² = ${fmt(.5*mass*v*v)} J.`;
  }
  if(/\bpotential energy\b|\bgravitational energy\b/.test(q)&&mass!==null&&height!==null){
    return `Gravitational potential energy:\nEₚ = mgh = ${fmt(mass)} × ${fmt(g)} × ${fmt(height)} = ${fmt(mass*g*height)} J.`;
  }
  if(/\bwork\b/.test(q)&&force!==null&&distance!==null){
    const angle=physicsQuantity(q,['degrees?','deg']);
    const factor=angle===null?1:Math.cos(angle*Math.PI/180);
    return `Work done:\nW = Fd${angle===null?'':' cos θ'} = ${fmt(force)} × ${fmt(distance)}${angle===null?'':` × cos(${fmt(angle)}°)`} = ${fmt(force*distance*factor)} J.`;
  }
  if(/\bpower\b/.test(q)&&energy!==null&&time!==null){
    return `Power:\nP = E/t = ${fmt(energy)} J / ${fmt(time)} s = ${fmt(energy/time)} W.`;
  }
  if(/\bmomentum\b/.test(q)&&mass!==null&&speed!==null){
    const v=/\bkm\/h\b/.test(q)?speed/3.6:speed;
    return `Linear momentum:\np = mv = ${fmt(mass)} kg × ${fmt(v)} m/s = ${fmt(mass*v)} kg·m/s.`;
  }
  if(/\bimpulse\b/.test(q)&&force!==null&&time!==null){
    return `Impulse:\nJ = FΔt = ${fmt(force)} N × ${fmt(time)} s = ${fmt(force*time)} N·s.`;
  }
  if(/\bdensity\b/.test(q)&&mass!==null&&volume!==null){
    const v=/\b(?:litres?|liters?|l)\b/.test(q)?volume/1000:volume;
    return `Density:\nρ = m/V = ${fmt(mass)} kg / ${fmt(v)} m³ = ${fmt(mass/v)} kg/m³.`;
  }
  if(/\bpressure\b/.test(q)&&force!==null){
    const area=physicsQuantity(q,['m\\^?2','m2','square meters?','square metres?']);
    if(area!==null)return `Pressure:\np = F/A = ${fmt(force)} N / ${fmt(area)} m² = ${fmt(force/area)} Pa.`;
  }
  if(/\bohm|resistance|circuit|voltage\b/.test(q)){
    if(voltage!==null&&resistance!==null&&current===null){
      return `Ohm's law:\nI = V/R = ${fmt(voltage)} V / ${fmt(resistance)} Ω = ${fmt(voltage/resistance)} A.`;
    }
    if(current!==null&&resistance!==null&&voltage===null){
      return `Ohm's law:\nV = IR = ${fmt(current)} A × ${fmt(resistance)} Ω = ${fmt(current*resistance)} V.`;
    }
    if(voltage!==null&&current!==null){
      return `Electrical power:\nP = VI = ${fmt(voltage)} V × ${fmt(current)} A = ${fmt(voltage*current)} W.`;
    }
  }
  if(/\bwave speed\b|\bspeed of (?:a )?wave\b|\bwave\b.*\bspeed\b/.test(q)&&wavelength!==null&&frequency!==null){
    let lambda=wavelength;
    if(/\bnm\b/.test(q))lambda*=1e-9;
    else if(/\b(?:μm|um)\b/.test(q))lambda*=1e-6;
    return `Wave relation:\nv = fλ = ${fmt(frequency)} Hz × ${lambda.toExponential(3)} m = ${fmt(frequency*lambda)} m/s.`;
  }
  if(/\bideal gas|gas law|gas pressure\b|\bgas\b.*\bpressure\b|\bpressure\b.*\bgas\b/.test(q)&&moles!==null&&temperature!==null&&volume!==null){
    const v=/\b(?:litres?|liters?|l)\b/.test(q)?volume/1000:volume;
    return `Ideal gas law:\nPV = nRT\nP = nRT/V = ${fmt(moles)} × 8.314 × ${fmt(temperature)} / ${fmt(v)} = ${fmt(moles*8.314*temperature/v)} Pa.`;
  }
  return null;
}
function localBrain(question){
  const q=String(question||'').trim().toLowerCase();
  if(!q)return null;
  const arithmetic=q.match(/^\s*(-?\d+(?:\.\d+)?)\s*([+\-*\/])\s*(-?\d+(?:\.\d+)?)\s*[?]?\s*$/);
  if(arithmetic){
    const a=Number(arithmetic[1]),b=Number(arithmetic[3]),op=arithmetic[2];
    if(op==='/'&&b===0)return 'That operation is undefined because division by zero has no finite result.';
    const value=op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:a/b;
    return `The answer is ${Number(value.toFixed(8))}.`;
  }
  const motionAnswer=solveMotionWordProblem(q);
  if(motionAnswer)return motionAnswer;
  const physicsAnswer=solvePhysicsWordProblem(q);
  if(physicsAnswer)return physicsAnswer;
  if(/^(hi|hello|hey|yo|good morning|good evening)\b/.test(q))return 'Hello, stargazer. Ask me a simple physics or space question and I will explain it clearly.';
  const fact=localFacts.find(item=>item.keys.some(key=>q.includes(key)));
  if(fact)return fact.answer;
  if(q.includes('f = ma')||q.includes('f=ma')||q.includes('newton second law'))return 'Newton’s second law is F = ma: net force equals mass times acceleration. Double the force and acceleration doubles if mass stays fixed.';
  if(q.includes('e = mc')||q.includes('e=mc'))return 'E = mc² says mass is concentrated energy. The c² factor is enormous, so a small amount of mass corresponds to a large amount of energy.';
  return null;
}
function setAiStatus(label,online){
  const status=document.querySelector('.ai-status span'),dot=document.querySelector('.ai-dot');
  if(status)status.textContent=label;
  if(dot)dot.style.background=online?'var(--green)':'var(--orange)';
}
let serverModelState='unknown';
async function askServerModel(question,history){
  if(!useBackend||serverModelState==='offline')return null;
  const r=await fetch('/api/public/ai',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+authToken},body:JSON.stringify({question,history}),signal:AbortSignal.timeout(30000)});
  const d=await r.json().catch(()=>({}));
  if(r.status===503&&d.code==='not_configured'){serverModelState='offline';return null;}
  if(!r.ok)throw new Error(d.error||'The configured model could not answer.');
  const answer=String(d.answer||'').trim();
  if(!answer)throw new Error('The configured model returned an empty answer.');
  serverModelState='online';
  return answer.replace(/\*\*/g,'').replace(/\*/g,'').replace(/#{1,6} /g,'').replace(/`/g,'');
}
async function sendMsg(){
  const txt=aiinp.value.trim();if(!txt)return;
  if(!authToken){showAuth();return;}
  if(histVis)toggleHist();
  addMsg(txt,'usr');aiinp.value='';
  convHist.push({role:'user',content:txt});if(convHist.length>24)convHist.splice(0,2);
  const thinking=addMsg('▍ Consulting the cosmos…','think');
  try{
    let answer=localBrain(txt),source='LOCAL CORE';
    if(answer)setAiStatus('Local core',true);
    if(!answer&&useBackend){
      try{
        answer=await askServerModel(txt,convHist.slice(0,-1));
        if(answer){source='MODEL';setAiStatus('Configured model',true);}
      }catch(e){serverModelState='error';setAiStatus('Model unavailable',false);}
    }
    if(!answer){
      source='LOCAL CORE';
      setAiStatus('Local core',true);
      answer='I can help with core physics offline. For broader tutoring, configure Ollama or an OpenAI-compatible model in the server environment and restart Quan-Taara.';
    }
    const isRid=/\b(why|how|can)\b.*\b(universe|black hole|quantum|space)\b/i.test(txt)&&/[?]/.test(txt);
    if(useBackend){
      const r=await fetch('/api/public/chat',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+authToken},body:JSON.stringify({question:txt,answer,isRidiculous:isRid,history:convHist.slice(0,-1)})});
      const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not save this answer.');
    }
    thinking.remove();addTag(source,'rid');if(isRid)addTag('⚡ Cosmic Absurdity Mode','rid');addMsg(answer,'bot');convHist.push({role:'assistant',content:answer});
  }catch(e){thinking.remove();addMsg('Error: '+(e.message||'Could not complete that request.'),'bot');}
}
aisend.addEventListener('click',sendMsg);
aiinp.addEventListener('keydown',e=>{if(e.key==='Enter')sendMsg();});

/* ━━━━━━━━━━━━ SCROLLYTELLING ━━━━━━━━━━━━ */
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

/* ━━━━━━━━━━━━ PHYSICS DATA ━━━━━━━━━━━━ */

/* ── 3. EXPANDED SIMULATION ENGINE (specialized draw* scenes + routing) ── */
/* ━━━ Simulation-first animation engine ━━━
   The old stage wrote equation symbols. This stage shows the physical
   mechanism instead: bodies move, fields pulse, packets arrive, and fluids
   flow while the selected relationship is used as the model. */
let _sim2d={raf:null,canvas:null,ctx:null,t0:0,kind:'cosmic'};
function stopEquationSimulation(){
  if(_sim2d.raf)cancelAnimationFrame(_sim2d.raf);
  _sim2d={raf:null,canvas:null,ctx:null,t0:0,kind:'cosmic'};
}
function simulationKind(name,formula,preferred,context={}){
  const q=(String(name||'')+' '+String(formula||'')+' '+String(context.discipline||'')+' '+String(context.concept||'')).toLowerCase();
  if(preferred&&preferred.includes('-'))return preferred;
  const routes=[
    [/velocity.time relation/,'classical-vt'],[/displacement.time relation/,'classical-st'],[/velocity.displacement/,'classical-v2s'],[/projectile/,'classical-projectile'],[/centripetal/,'classical-centripetal'],[/newton.s second law/,'classical-force'],[/law of gravitation/,'classical-gravity'],[/orbital velocity/,'classical-orbit'],[/escape velocity/,'classical-escape'],
    [/relativistic dispersion/,'particle-dispersion'],[/energy.momentum relation/,'relativity-dispersion'],[/relativistic momentum/,'relativity-momentum'],[/total energy|mass.energy/,'relativity-energy'],[/lorentz factor/,'relativity-lorentz'],[/gravitational time dilation/,'gr-clock'],[/time dilation/,'relativity-time'],[/length contraction/,'relativity-length'],
    [/transit depth/,'exo-transit'],[/radial.velocity|rv semi.amplitude/,'exo-rv'],[/habitable.zone|habitable/,'exo-habitable'],[/orbital period/,'exo-orbit'],
    [/drake equation/,'bio-drake'],[/biosignature/,'bio-signature'],[/extremophile|life at the limits/,'bio-limits'],[/liquid.water habitability/,'bio-water'],
    [/galaxy rotation curve/,'dark-rotation'],[/dark.matter lensing|gravitational lensing/,'dark-lensing'],[/dark.energy|accelerated expansion/,'dark-expansion'],[/density parameters|cosmic density budget/,'dark-budget'],
    [/stationary action|principle of stationary action/,'math-action'],[/euler.lagrange/,'math-lagrange'],[/fourier/,'math-fourier'],[/commutator/,'math-commutator'],
    [/continuity equation/,'fluid-continuity'],[/navier.stokes/,'fluid-navier'],[/reynolds number/,'fluid-reynolds'],[/euler flow/,'fluid-euler'],
    [/gauss \(electric\)/,'em-gauss'],[/gauss \(magnetic\)/,'em-magnetic'],[/coulomb/,'em-coulomb'],[/faraday.s law/,'em-induction'],[/ampere.maxwell/,'em-ampere'],[/speed of light/,'em-wave'],
    [/first law/,'thermo-first-law'],[/second law|entropy/,'thermo-entropy'],[/carnot/,'thermo-engine'],[/ideal gas/,'thermo-gas'],[/average kinetic energy/,'thermo-kinetic'],[/kinetic energy|rms speed/,'thermo-maxwell'],
    [/schr.dinger/,'qm-wave'],[/uncertainty/,'qm-uncertainty'],[/hydrogen energy level/,'qm-levels'],[/expectation value/,'qm-expectation'],
    [/hydrostatic equilibrium/,'star-equilibrium'],[/stefan.boltzmann/,'star-luminosity'],[/tov equation/,'star-tov'],
    [/hubble parameter/,'cosmo-hubble'],[/critical density/,'cosmo-density'],[/cmb temperature/,'cosmo-cmb'],
    [/gravitational wave strain/,'gw-strain'],[/chirp mass|binary chirp/,'gw-chirp'],[/peters formula/,'gw-binary'],
    [/mhd momentum/,'plasma-mhd'],[/alfv.n speed/,'plasma-alfven'],[/plasma frequency/,'plasma-frequency'],
    [/21.cm|hydrogen line/,'radio-hydrogen'],[/synchrotron/,'radio-synchrotron'],
    [/magnetopause/,'weather-pressure'],[/kp geomagnetic|geomagnetic activity/,'weather-kp'],
    [/ism rate|rate equations/,'chem-rates'],[/photodissociation/,'chem-photodissociation'],
    [/snell/,'optics-snell'],[/thin.lens/,'optics-lens'],[/diffraction grating/,'optics-diffraction'],[/photon energy/,'optics-photon'],
    [/gauge field lagrangian/,'particle-gauge'],[/collider cross.section/,'particle-cross-section'],[/fine.structure constant/,'particle-coupling'],
    [/newton.s law of gravitation|einstein field equations/,'gr-curvature'],[/schwarzschild/,'gr-metric'],[/gravitational time dilation/,'gr-clock'],[/friedmann/,'gr-expansion']
  ];
  for(const [pattern,kind] of routes)if(pattern.test(q))return kind;
  if(/gravitation|gravitational|\bgravity\b|spacetime|einstein field|schwarzschild/.test(q))return'gravity';
  if(/orbital velocity|escape velocity|centripetal|\borbit\b|hubble|density|friedmann/.test(q))return'orbit';
  if(/mass.?energy|energy.?momentum|total energy|e\s*=\s*mc|mc²/.test(q))return'energy';
  if(/momentum|impulse/.test(q))return'momentum';
  if(/newton.?s second law|acceleration|kinematic|velocity.?time|velocity.?displacement|displacement.?time|projectile/.test(q))return'motion';
  if(preferred)return preferred;
  if(/fluid|navier|continuity|reynolds|mhd|alfv|pressure/.test(q))return'fluid';
  if(/relativ|lorentz|time dilation|mass-energy/.test(q))return'relativity';
  if(/quantum|photon|hydrogen|uncertainty|de broglie|schr.dinger|wavefunction/.test(q))return'quantum';
  if(/lens|snell|diffraction|optics/.test(q))return'optics';
  if(/force|newton|velocity|displacement|projectile|kinematic/.test(q))return'motion';
  if(/gas|heat|entropy|carnot|thermal|stefan/.test(q))return'thermo';
  if(/circuit|ohm|voltage|power|coulomb|gauss|faraday|ampere|field|charge/.test(q))return'field';
  if(/wave|faraday|ampere|speed of light|frequency/.test(q))return'wave';
  if(/star|luminosity|wien|blackbody|stellar/.test(q))return'star';
  return'cosmic';
}
function simCanvasFrame(canvas,ctx){
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
  const w=Math.max(240,rect.width||800),h=Math.max(150,rect.height||310);
  const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
  if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  return{w,h};
}
function simText(ctx,text,x,y,color='rgba(228,238,255,.8)',size=11,align='left'){
  ctx.fillStyle=color;ctx.font=`${size}px "DM Mono",monospace`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(text,x,y);
}
function simArrow(ctx,x1,y1,x2,y2,color,label){
  const a=Math.atan2(y2-y1,x2-x1),head=8;
  ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-head*Math.cos(a-.5),y2-head*Math.sin(a-.5));ctx.lineTo(x2-head*Math.cos(a+.5),y2-head*Math.sin(a+.5));ctx.closePath();ctx.fill();
  if(label)simText(ctx,label,(x1+x2)/2,(y1+y2)/2-12,color,10,'center');
}
const SIM_GUIDES={
  gravity:'Mass curves spacetime; an orbit follows the dip',
  motion:'A force changes an object’s speed and direction',
  force:'A net force changes an object’s acceleration',
  momentum:'Momentum transfers between objects in a collision',
  energy:'Mass and energy are two forms of the same quantity',
  orbit:'A body keeps falling around a central mass',
  expanding:'As space expands, distant galaxies move apart',
  thermo:'Heating makes particles move faster',
  gas:'Particle motion creates pressure in a gas',
  field:'Field strength and direction change around a source',
  circuit:'Voltage drives current through a circuit',
  wave:'Wavelength and frequency combine to set wave speed',
  quantum:'A wave pattern sets where particles may be detected',
  optics:'Light changes direction when it enters a new medium',
  fluid:'Flow lines show transport, speed and turbulence',
  star:'A star’s size and temperature set its output',
  relativity:'Relative motion changes measured space and time',
  cosmic:'Watch the physical system respond over time'
};
function simulationHash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function simulationAnimate(formula,name,preferred,context={}){
  const canvas=document.getElementById('manim-canvas'),cap=document.getElementById('manim-caption');
  if(!canvas||!cap)return;
  stopEquationSimulation();
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const kind=simulationKind(name,formula,preferred,context),seed=simulationHash([formula,name,context.discipline,context.concept].join('|'));
  const fallback={u:2+seed%12,a:.4+(seed%11)*.15,t:2+(seed%7),s:4+seed%18,m:1+seed%9,v:3+seed%19,r:2+seed%10,theta:20+seed%55,beta:.2+(seed%7)*.1,f:2+seed%14,T:250+seed%900};
  const meta={formula,name,context,seed,params:{...fallback,...(context.params||{})}};
  _sim2d={raf:null,canvas,ctx,t0:performance.now(),kind,meta};
  cap.textContent=context.description||SIM_GUIDES[kind]||SIM_GUIDES[kind.split('-')[0]]||'Follow this equation as its physical system changes.';
  cap.classList.add('show');
  const draw=(now)=>{
    if(!_sim2d.canvas)return;
    const t=(now-_sim2d.t0)/1000,{w,h}=simCanvasFrame(canvas,ctx);
    ctx.lineCap='round';ctx.lineJoin='round';
    const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'rgba(30,28,72,.18)');bg.addColorStop(1,'rgba(255,140,66,.03)');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    if(kind.includes('-'))drawCataloguedSimulation(ctx,w,h,t,kind,meta);
    else if(kind==='gravity')drawGravitySimulation(ctx,w,h,t);
    else if(kind==='motion'||kind==='force')drawMotionSimulation(ctx,w,h,t,kind);
    else if(kind==='momentum')drawMomentumSimulation(ctx,w,h,t);
    else if(kind==='energy')drawEnergySimulation(ctx,w,h,t);
    else if(kind==='orbit')drawOrbitSimulation(ctx,w,h,t);
    else if(kind==='expanding')drawExpansionSimulation(ctx,w,h,t);
    else if(kind==='thermo'||kind==='gas')drawThermoSimulation(ctx,w,h,t);
    else if(kind==='field')drawFieldSimulation(ctx,w,h,t);
    else if(kind==='circuit')drawCircuitSimulation(ctx,w,h,t);
    else if(kind==='wave')drawWaveSimulation(ctx,w,h,t);
    else if(kind==='quantum')drawQuantumSimulation(ctx,w,h,t);
    else if(kind==='optics')drawOpticsSimulation(ctx,w,h,t);
    else if(kind==='fluid')drawFluidSimulation(ctx,w,h,t);
    else if(kind==='star')drawStarSimulation(ctx,w,h,t);
    else if(kind==='relativity')drawRelativitySimulation(ctx,w,h,t);
    else drawCosmicSimulation(ctx,w,h,t);
    _sim2d.raf=requestAnimationFrame(draw);
  };
  _sim2d.raf=requestAnimationFrame(draw);
}
function drawGraphScene(ctx,w,h,t,fn,xLabel,yLabel,color='#72d7ff'){
  const L=w*.13,R=w*.94,T=h*.18,B=h*.78,W=R-L,H=B-T;
  ctx.strokeStyle='rgba(180,200,230,.11)';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const y=T+H*i/4;ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(R,y);ctx.stroke();}
  for(let i=0;i<=5;i++){const x=L+W*i/5;ctx.beginPath();ctx.moveTo(x,T);ctx.lineTo(x,B);ctx.stroke();}
  ctx.strokeStyle='rgba(180,210,240,.54)';ctx.beginPath();ctx.moveTo(L,B);ctx.lineTo(R,B);ctx.moveTo(L,T);ctx.lineTo(L,B);ctx.stroke();
  ctx.strokeStyle=color;ctx.lineWidth=2.2;ctx.beginPath();
  for(let i=0;i<=110;i++){const q=i/110,yv=Math.max(0,Math.min(1,fn(q))),x=L+q*W,y=B-yv*H;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
  const q=(t*.13)%1,yv=Math.max(0,Math.min(1,fn(q))),px=L+q*W,py=B-yv*H;
  ctx.fillStyle='#fff0d8';ctx.shadowBlur=9;ctx.shadowColor=color;ctx.beginPath();ctx.arc(px,py,4.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  simText(ctx,xLabel,w*.55,h*.88,'rgba(180,205,235,.72)',9,'center');
  simText(ctx,yLabel,L+3,T-11,'#ffb47a',9,'left');
}
function simGlow(ctx,x,y,r,inner='#fff1bf',middle='#ff9b5a'){
  const g=ctx.createRadialGradient(x-r*.2,y-r*.25,1,x,y,r);g.addColorStop(0,inner);g.addColorStop(.35,middle);g.addColorStop(1,'rgba(255,100,40,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
}
function simDot(ctx,x,y,r,color,glow=false){ctx.fillStyle=color;if(glow){ctx.shadowBlur=10;ctx.shadowColor=color;}ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
function drawCataloguedSimulation(ctx,w,h,t,kind,meta){
  const p=meta.params;
  if(kind.startsWith('classical-'))return drawClassicalScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('exo-'))return drawExoplanetScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('bio-'))return drawAstrobiologyScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('dark-'))return drawDarkUniverseScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('math-'))return drawMathPhysicsScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('fluid-'))return drawFluidScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('em-'))return drawElectromagnetismScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('thermo-'))return drawThermodynamicsScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('relativity-'))return drawRelativityScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('gr-'))return drawGeneralRelativityScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('qm-'))return drawQuantumScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('star-'))return drawStellarScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('cosmo-'))return drawCosmologyScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('gw-'))return drawGravitationalWaveScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('plasma-'))return drawPlasmaScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('radio-'))return drawRadioScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('weather-'))return drawSpaceWeatherScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('chem-'))return drawAstrochemistryScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('optics-'))return drawOpticsCatalogScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('particle-'))return drawParticleScene(ctx,w,h,t,kind,p);
  if(kind.startsWith('classical'))return drawClassicalScene(ctx,w,h,t,kind,p);
  drawGraphScene(ctx,w,h,t,q=>.5+.3*Math.sin(q*Math.PI*2+meta.seed%10),'time / input','response');
}
function drawClassicalScene(ctx,w,h,t,kind,p){
  const u=Number(p.u)||4,a=Number(p.a)||.8,duration=Number(p.t)||5,speed=Number(p.v)||7;
  if(kind==='classical-vt')return drawGraphScene(ctx,w,h,t,q=>(u+a*q*duration)/(u+a*duration+1),'time →','velocity v(t)');
  if(kind==='classical-st')return drawGraphScene(ctx,w,h,t,q=>(u*q*duration+.5*a*q*q*duration*duration)/(u*duration+.5*a*duration*duration+1),'time →','position s(t)','#c49aff');
  if(kind==='classical-v2s')return drawGraphScene(ctx,w,h,t,q=>Math.sqrt(u*u+2*a*q*Number(p.s||12))/(Math.sqrt(u*u+2*a*Number(p.s||12))+1),'distance s →','speed squared','#ffb47a');
  if(kind==='classical-projectile'){
    const ground=h*.75,angle=(Number(p.angle)||45)*Math.PI/180,v=Number(p.u)||12,g=9.8,flight=2*v*Math.sin(angle)/g,phase=(t%5)/5,tt=phase*flight;
    ctx.strokeStyle='rgba(114,215,255,.35)';ctx.beginPath();ctx.moveTo(w*.08,ground);ctx.lineTo(w*.92,ground);ctx.stroke();
    ctx.strokeStyle='rgba(196,154,255,.72)';ctx.lineWidth=2;ctx.beginPath();
    for(let i=0;i<=90;i++){const f=i/90,range=v*Math.cos(angle)*flight,height=v*Math.sin(angle)*(f*flight)-.5*g*Math.pow(f*flight,2),x=w*.12+f*w*.72,y=ground-height/Math.max(1,v*v/(2*g))*h*.52;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
    const x=w*.12+v*Math.cos(angle)*tt/(v*Math.cos(angle)*flight)*w*.72,y=ground-(v*Math.sin(angle)*tt-.5*g*tt*tt)/Math.max(1,v*v/(2*g))*h*.52;
    simDot(ctx,x,y,5,'#ffb47a',true);simArrow(ctx,x,y,x+24*Math.cos(angle),y-24*Math.sin(angle),'#72d7ff','v');simText(ctx,`launch ${Math.round(angle*180/Math.PI)}° · range responds to angle`,w*.5,h*.9,'#c9d9ed',9,'center');return;
  }
  if(kind==='classical-gravity'){
    const cx=w*.5,cy=h*.5,orbit=Math.min(w,h)*(.2+.012*(Number(p.r)||4)),ang=t*.55,mass=Math.max(2,Number(p.m)||6);
    ctx.strokeStyle='rgba(114,215,255,.42)';ctx.setLineDash([4,5]);ctx.beginPath();ctx.ellipse(cx,cy,orbit,orbit*.64,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    const x=cx+Math.cos(ang)*orbit,y=cy+Math.sin(ang)*orbit*.64;simGlow(ctx,cx,cy,Math.min(34,15+mass),'#fff1bf','#ff9b5a');simDot(ctx,cx,cy,Math.min(15,7+mass*.45),'#ffb47a',true);simDot(ctx,x,y,6,'#72d7ff',true);simArrow(ctx,x,y,x+(cx-x)*.48,y+(cy-y)*.48,'#c49aff','F ∝ 1/r²');simText(ctx,'two masses attract · closer separation means stronger force',w*.5,h*.9,'#c9d9ed',8,'center');return;
  }
  if(kind==='classical-orbit'){
    const cx=w*.5,cy=h*.48,r=Math.min(w,h)*(.18+.012*(Number(p.r)||5)),ang=t*(.55+.012*(Number(p.v)||8));ctx.strokeStyle='rgba(114,215,255,.45)';ctx.beginPath();ctx.ellipse(cx,cy,r,r*.67,0,0,Math.PI*2);ctx.stroke();simDot(ctx,cx,cy,9,'#ff9b5a',true);const x=cx+Math.cos(ang)*r,y=cy+Math.sin(ang)*r*.67;simDot(ctx,x,y,5,'#72d7ff',true);simArrow(ctx,x,y,x-Math.sin(ang)*30,y+Math.cos(ang)*22,'#ffb47a','vₒ');simText(ctx,'gravity continually turns tangential velocity inward',w*.5,h*.89,'#c9d9ed',8,'center');return;
  }
  if(kind==='classical-escape'){
    const cx=w*.2,ground=h*.73,phase=(t%6)/6,x=cx+phase*w*.66,y=ground-(Math.exp(-phase*4)*h*.3+phase*h*.08);ctx.strokeStyle='rgba(114,215,255,.42)';ctx.beginPath();for(let i=0;i<=90;i++){const q=i/90,px=cx+q*w*.66,py=ground-(Math.exp(-q*4)*h*.3+q*h*.08);if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();simGlow(ctx,cx,ground-8,30,'#fff1bf','#ff9b5a');simDot(ctx,cx,ground-8,13,'#ffb47a',true);simDot(ctx,x,y,5,'#72d7ff',true);simArrow(ctx,x,y,x+32,y-10,'#c49aff','v ≥ vₑ');simText(ctx,'escape speed leaves no returning orbit',w*.58,h*.89,'#c9d9ed',9,'center');return;
  }
  if(kind==='classical-centripetal'){
    const cx=w*.5,cy=h*.49,r=Math.min(w,h)*.27,ang=t*.85,x=cx+Math.cos(ang)*r,y=cy+Math.sin(ang)*r;
    ctx.strokeStyle='rgba(114,215,255,.65)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();simDot(ctx,cx,cy,7,'#ff9b5a',true);simDot(ctx,x,y,6,'#72d7ff',true);simArrow(ctx,x,y,x+(cx-x)*.47,y+(cy-y)*.47,'#c49aff','aᶜ');simArrow(ctx,x,y,x-Math.sin(ang)*35,y+Math.cos(ang)*35,'#ffb47a','v');simText(ctx,'velocity turns; acceleration points inward',w*.5,h*.9,'#c9d9ed',9,'center');return;
  }
  if(kind==='classical-momentum'){
    const cx=w*.5,floor=h*.7,phase=(t%5)/5,closing=phase<.5,spread=closing?1-phase*2:(phase-.5)*2,gap=24+spread*w*.27,dir=closing?1:-1,left=cx-gap,right=cx+gap;
    ctx.strokeStyle='rgba(114,215,255,.3)';ctx.beginPath();ctx.moveTo(w*.1,floor+18);ctx.lineTo(w*.9,floor+18);ctx.stroke();
    [[left,'#72d7ff',Number(p.m)||3],[right,'#ffb47a',Number(p.mass2)||2]].forEach(([x,c,m],i)=>{ctx.fillStyle=c;ctx.fillRect(x-9-m,floor-22,18+2*m,22);simText(ctx,'m'+(i+1),x,floor-34,c,8,'center');});
    simArrow(ctx,left,floor-50,left+dir*35,floor-50,'#72d7ff','p₁');simArrow(ctx,right,floor-50,right-dir*35,floor-50,'#ffb47a','p₂');simText(ctx,'before collision  →  after collision',w*.5,h*.9,'#c9d9ed',9,'center');return;
  }
  if(kind==='classical-force'){
    const phase=(t%5)/5,x=w*.17+phase*phase*w*.56,y=h*.68,mass=Number(p.m)||4,accel=Number(p.a)||1;
    ctx.strokeStyle='rgba(114,215,255,.32)';ctx.beginPath();ctx.moveTo(w*.08,y+18);ctx.lineTo(w*.92,y+18);ctx.stroke();
    ctx.fillStyle='rgba(114,215,255,.8)';ctx.fillRect(x-20,y-30,40,30);ctx.strokeStyle='#dff7ff';ctx.strokeRect(x-20,y-30,40,30);
    simArrow(ctx,x+23,y-15,x+23+Math.min(90,mass*accel*3),y-15,'#ff9b5a','F = ma');simArrow(ctx,x,y-48,x+22+phase*45,y-48,'#72d7ff','a');simText(ctx,`${mass} kg · acceleration ∝ force / mass`,w*.5,h*.9,'#c9d9ed',9,'center');return;
  }
  simText(ctx,'force changes velocity over time',w*.5,h*.9,'#c9d9ed',9,'center');
}
function drawExoplanetScene(ctx,w,h,t,kind,p){
  const cx=w*.5,cy=h*.43,R=Math.min(42,w*.17),cycle=3+(Number(p.period)||8)*.18,phase=(t%cycle)/cycle;
  if(kind==='exo-transit'){
    simGlow(ctx,cx,cy,R*1.7);simDot(ctx,cx,cy,R,'#ffd58a');
    const px=w*.08+phase*w*.84,py=cy,pr=Math.max(5,R*(.1+.035*Math.sqrt(Number(p.M)||3)));ctx.strokeStyle='rgba(114,215,255,.45)';ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(w*.06,py);ctx.lineTo(w*.94,py);ctx.stroke();ctx.setLineDash([]);simDot(ctx,px,py,pr,'#152139');ctx.strokeStyle='#72d7ff';ctx.beginPath();ctx.arc(px,py,pr,0,Math.PI*2);ctx.stroke();
    const graphY=h*.81;ctx.strokeStyle='rgba(114,215,255,.25)';ctx.beginPath();ctx.moveTo(w*.12,graphY);ctx.lineTo(w*.9,graphY);ctx.stroke();ctx.strokeStyle='#72d7ff';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<=80;i++){const q=i/80,x=w*.12+q*w*.78,dip=Math.exp(-Math.pow((q-phase)*10,2))*.28,y=graphY-dip*h*.45;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();simText(ctx,'planet crossing → light curve dip',w*.5,h*.95,'#c9d9ed',9,'center');return;
  }
  if(kind==='exo-rv'){
    const cycle=3+(Number(p.period)||8)*.18,a=t/cycle*Math.PI*2,wobble=(4+(Number(p.M)||6)*.55)/Math.cbrt(Number(p.period)||8)*Math.sin(a),starX=cx+wobble,orbit=Math.min(70,w*.24),planetX=cx+Math.cos(a)*orbit,planetY=cy+Math.sin(a)*orbit*.58;simGlow(ctx,starX,cy,30);simDot(ctx,starX,cy,19,'#ffd58a');ctx.strokeStyle='rgba(114,215,255,.4)';ctx.beginPath();ctx.ellipse(cx,cy,orbit,orbit*.58,0,0,Math.PI*2);ctx.stroke();simDot(ctx,planetX,planetY,5,'#72d7ff');
    drawGraphScene(ctx,w,h,t,q=>.5+.38*Math.sin(q*Math.PI*2),'orbital phase →','stellar radial velocity','#c49aff');simText(ctx,'star wobbles around the system barycentre',w*.5,h*.96,'#c9d9ed',9,'center');return;
  }
  if(kind==='exo-habitable'){
    const zone=.82+Math.min(20,Number(p.L)||5)*.025;simGlow(ctx,cx,cy,33);simDot(ctx,cx,cy,17,'#ffd58a');ctx.strokeStyle='rgba(86,224,154,.35)';ctx.lineWidth=13;ctx.beginPath();ctx.ellipse(cx,cy,R*zone,R*zone*.5,-.18,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='rgba(210,220,255,.45)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(cx,cy,R*zone,R*zone*.5,-.18,0,Math.PI*2);ctx.stroke();const a=t*.52,px=cx+Math.cos(a)*R*zone,py=cy+Math.sin(a)*R*zone*.5;simDot(ctx,px,py,6,'#72d7ff',true);simText(ctx,`green temperate-flux band · L★ case ${p.L||5}`,w*.5,h*.88,'#c9d9ed',8,'center');return;
  }
  if(kind==='exo-orbit'){
    simGlow(ctx,cx,cy,33);simDot(ctx,cx,cy,17,'#ffd58a');const r1=R*.82,r2=R*1.58;ctx.strokeStyle='rgba(114,215,255,.4)';ctx.beginPath();ctx.ellipse(cx,cy,r1,r1*.62,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='rgba(196,154,255,.42)';ctx.beginPath();ctx.ellipse(cx,cy,r2,r2*.62,0,0,Math.PI*2);ctx.stroke();const a1=t*1.2,a2=t*.48;simDot(ctx,cx+Math.cos(a1)*r1,cy+Math.sin(a1)*r1*.62,5,'#72d7ff',true);simDot(ctx,cx+Math.cos(a2)*r2,cy+Math.sin(a2)*r2*.62,6,'#c49aff',true);simText(ctx,'outer orbit moves more slowly · P² ∝ a³',w*.5,h*.88,'#c9d9ed',8,'center');return;
  }
}
function drawAstrobiologyScene(ctx,w,h,t,kind,p){
  if(kind==='bio-drake'){
    const labels=['stars','planets','habitable','life','intelligent','signal'],factors=[Number(p.stars)/4,Number(p.fp),Number(p.ne)/5,Number(p.fl),Number(p.fi)*7,Number(p.fc),Number(p.life)/18000],L=w*.055,step=w*.145,base=h*.76;
    labels.forEach((label,i)=>{const keep=Math.max(.1,Math.min(1.1,factors[i]||.5))*(.78+.16*Math.sin(t*.5+i)),x=L+i*step;ctx.strokeStyle='rgba(114,215,255,.2)';ctx.strokeRect(x,base-keep*h*.43,step*.62,keep*h*.43);ctx.fillStyle=i<2?'rgba(114,215,255,.8)':'rgba(196,154,255,.75)';ctx.fillRect(x,base-keep*h*.43,step*.62,keep*h*.43);simText(ctx,label,x+step*.31,base+13,'#b9cbe2',7,'center');if(i<labels.length-1)simArrow(ctx,x+step*.63,base-keep*h*.23,x+step*.9,base-keep*h*.23,'#ffb47a');});simText(ctx,`case: ${p.stars} stars/yr · ${p.life} yr signal lifetime`,w*.5,h*.94,'#c9d9ed',8,'center');return;
  }
  if(kind==='bio-signature'){
    const depth=Math.min(.48,(Number(p.depth)||120)/700);drawGraphScene(ctx,w,h,t,q=>.9-depth*Math.exp(-Math.pow((q-.34)*33,2))-depth*.82*Math.exp(-Math.pow((q-.68)*29,2)),'wavelength →','transmitted light','#72d7ff');simText(ctx,'O₂',w*.13+w*.81*.34,h*.38,'#ffb47a',9,'center');simText(ctx,'CH₄',w*.13+w*.81*.68,h*.38,'#c49aff',9,'center');simText(ctx,`paired absorption bands · ${p.depth||120} ppm scale`,w*.5,h*.95,'#c9d9ed',8,'center');return;
  }
  if(kind==='bio-limits'){
    const x0=w*.15,x1=w*.86,y=h*.49,temperature=Number(p.T)||280,center=.33+Math.max(0,Math.min(650,temperature-250))*.00047,width=.19+((Number(p.n)||3)%4)*.018;ctx.fillStyle='rgba(94,180,255,.12)';ctx.fillRect(x0,y-20,x1-x0,40);ctx.fillStyle='rgba(86,224,154,.36)';ctx.fillRect(x0+(center-width/2)*(x1-x0),y-22,width*(x1-x0),44);ctx.strokeStyle='rgba(220,230,255,.55)';ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();const q=center+Math.sin(t*.55)*width*.4,x=x0+q*(x1-x0);simDot(ctx,x,y,7,'#ffb47a',true);simText(ctx,'cold',x0,y+38,'#b9cbe2',9,'center');simText(ctx,'survival window',x0+center*(x1-x0),y+38,'#8ce7b2',9,'center');simText(ctx,`${temperature} K · acidity ${p.n}`,w*.5,h*.9,'#c9d9ed',9,'center');return;
  }
  if(kind==='bio-water'){
    const left=w*.19,right=w*.87,top=h*.2,bottom=h*.73,temp=Number(p.T)||300,pressure=Number(p.P)||5;ctx.strokeStyle='rgba(220,230,255,.48)';ctx.beginPath();ctx.moveTo(left,bottom);ctx.lineTo(right,bottom);ctx.moveTo(left,bottom);ctx.lineTo(left,top);ctx.stroke();ctx.fillStyle='rgba(86,224,154,.2)';ctx.fillRect(left+(right-left)*.27,top+(bottom-top)*.22,(right-left)*.46,(bottom-top)*.55);simText(ctx,'temperature →',w*.56,h*.82,'#b9cbe2',8,'center');simText(ctx,'pressure',left-6,top-10,'#b9cbe2',8,'right');simText(ctx,'liquid water stable',w*.5,h*.43,'#8ce7b2',9,'center');const q=Math.max(.03,Math.min(.97,(temp-200)/950)),x=left+q*(right-left),y=bottom-Math.max(.05,Math.min(.95,pressure/24))*(bottom-top);simDot(ctx,x,y,7,'#ffb47a',true);simText(ctx,`${temp} K · ${pressure} kPa`,w*.5,h*.92,'#c9d9ed',8,'center');return;
  }
  const cx=w*.5,cy=h*.5,R=Math.min(45,w*.2),a=t*.3;simGlow(ctx,cx,cy,R*1.5);simDot(ctx,cx,cy,R,'#4578b7');ctx.strokeStyle='rgba(86,224,154,.7)';ctx.beginPath();ctx.ellipse(cx,cy,R*1.6,R*.9,0,0,Math.PI*2);ctx.stroke();simDot(ctx,cx+Math.cos(a)*R*1.6,cy+Math.sin(a)*R*.9,6,'#8ce7b2',true);simText(ctx,'temperature, pressure and liquid water',w*.5,h*.9,'#c9d9ed',9,'center');
}
function drawDarkUniverseScene(ctx,w,h,t,kind,p){
  if(kind==='dark-rotation'){
    const halo=.65+Math.min(1,(Number(p.M)||6)/15)*.55,fn1=q=>.1+.86*Math.sqrt(.06+q)/(1+q*2),fn2=q=>.23+.5*(1-Math.exp(-q*6))*halo;drawGraphScene(ctx,w,h,t,q=>fn1(q),'galactocentric radius →','orbital speed','#ffb47a');ctx.strokeStyle='#72d7ff';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<=100;i++){const q=i/100,y=h*.78-Math.min(1,fn2(q))*(h*.6),x=w*.13+q*w*.81;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();simText(ctx,`visible matter vs halo mass ${Number(p.M)||6}`,w*.53,h*.13,'#c9d9ed',8,'center');return;
  }
  if(kind==='dark-lensing'){
    const cx=w*.5,cy=h*.49,amp=Math.min(w,h)*(.045+Math.min(1,(Number(p.M)||6)/15)*.06);ctx.strokeStyle='rgba(114,215,255,.35)';ctx.lineWidth=1;
    for(let i=-5;i<=5;i++){
      ctx.beginPath();for(let j=0;j<=70;j++){const q=j/70,x=w*.12+q*w*.76,y=h*.15+i*h*.13,dx=x-cx,dy=y-cy,r2=dx*dx+dy*dy+1800,wx=x+dx*amp*amp/r2,wy=y+dy*amp*amp/r2;if(j===0)ctx.moveTo(wx,wy);else ctx.lineTo(wx,wy);}ctx.stroke();
      ctx.beginPath();for(let j=0;j<=55;j++){const q=j/55,y=h*.15+q*h*.7,x=w*.12+i*w*.075,dx=x-cx,dy=y-cy,r2=dx*dx+dy*dy+1800,wx=x+dx*amp*amp/r2,wy=y+dy*amp*amp/r2;if(j===0)ctx.moveTo(wx,wy);else ctx.lineTo(wx,wy);}ctx.stroke();
    }
    ctx.fillStyle='#02030b';ctx.beginPath();ctx.arc(cx,cy,11,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#c49aff';ctx.beginPath();ctx.ellipse(cx,cy,28,16,0,0,Math.PI*2);ctx.stroke();simText(ctx,'invisible halo bends background light',w*.5,h*.91,'#c9d9ed',9,'center');return;
  }
  if(kind==='dark-budget'){
    const x=w*.14,y=h*.4,total=w*.72,raw=[Number(p.omegaB)||.05,Number(p.omegaDM)||.27,Number(p.omegaDE)||.68],sum=raw.reduce((a,b)=>a+b,0),parts=[[raw[0]/sum,'#72d7ff','baryons'],[raw[1]/sum,'#c49aff','dark matter'],[raw[2]/sum,'#ff9b5a','dark energy']];let xx=x;parts.forEach(([f,c,label])=>{const width=total*f;ctx.fillStyle=c;ctx.globalAlpha=.78;ctx.fillRect(xx,y,width,h*.2);ctx.globalAlpha=1;simText(ctx,label,xx+width/2,y+h*.27,'#dce4f4',8,'center');xx+=width;});simText(ctx,`Ωtotal = ${sum.toFixed(2)}`,w*.5,h*.8,'#ffcf9a',12,'center');simText(ctx,'measured cosmic energy budget',w*.5,h*.92,'#c9d9ed',9,'center');return;
  }
  const cx=w*.5,cy=h*.52,rate=.025+Math.min(1,(Number(p.L)||5)/20)*.045,phase=.5+((t*rate)%1.1);for(let i=0;i<12;i++){const a=i*Math.PI/6,r=(Math.min(w,h)*(.12+i%3*.045))*phase,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.6;simDot(ctx,x,y,i%3===0?5:3,i%3?'#72d7ff':'#ffb47a');}simText(ctx,'cosmic distances accelerate over time',w*.5,h*.9,'#c9d9ed',9,'center');
}
function drawMathPhysicsScene(ctx,w,h,t,kind,p){
  if(kind==='math-fourier'){
    const mid=h*.48,phase=t*1.5,terms=Math.max(2,Math.min(6,Number(p.n)||3)),colors=['rgba(114,215,255,.55)','rgba(196,154,255,.55)','rgba(255,180,120,.55)'];ctx.lineWidth=1.2;
    for(let harmonic=1;harmonic<=terms;harmonic++){ctx.strokeStyle=colors[(harmonic-1)%colors.length];ctx.beginPath();for(let i=0;i<=w;i++){const y=mid+Math.sin(i/w*Math.PI*2*harmonic-phase)*24/(harmonic**.72);if(i===0)ctx.moveTo(i,y);else ctx.lineTo(i,y);}ctx.stroke();}
    ctx.strokeStyle='#f6e4cc';ctx.lineWidth=2.2;ctx.beginPath();for(let i=0;i<=w;i++){let signal=0;for(let harmonic=1;harmonic<=terms;harmonic++)signal+=Math.sin(i/w*Math.PI*2*harmonic-phase)/(harmonic**.72);const y=mid+signal*(28/terms**.42);if(i===0)ctx.moveTo(i,y);else ctx.lineTo(i,y);}ctx.stroke();simText(ctx,`${terms} frequency components combine into one signal`,w*.5,h*.87,'#c9d9ed',9,'center');return;
  }
  if(kind==='math-commutator'){
    const y=h*.5,x1=w*.25,x2=w*.72,ang=t*.7+(Number(p.theta)||45)*Math.PI/240;simArrow(ctx,x1,y,x1+Math.cos(ang)*48,y-Math.sin(ang)*48,'#72d7ff','A then B');simArrow(ctx,x2,y,x2+Math.cos(ang+.7)*48,y-Math.sin(ang+.7)*48,'#ffb47a','B then A');ctx.strokeStyle='rgba(196,154,255,.45)';ctx.strokeRect(x1-44,y-46,88,92);ctx.strokeRect(x2-44,y-46,88,92);simText(ctx,'order changes the final state',w*.5,h*.88,'#c9d9ed',9,'center');return;
  }
  if(kind==='math-action'){
    const x0=w*.12,x1=w*.88,y0=h*.66,y1=h*.35,period=Number(p.t)||5,phase=(t%period)/period,amplitude=10+(Number(p.a)||.8)*8;ctx.strokeStyle='rgba(196,154,255,.3)';ctx.lineWidth=1;
    for(let k=-2;k<=2;k++){ctx.beginPath();for(let i=0;i<=80;i++){const q=i/80,x=x0+q*(x1-x0),y=y0+q*(y1-y0)+Math.sin(q*Math.PI*2)*(k*amplitude+phase*6);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
    ctx.strokeStyle='#ffb47a';ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<=80;i++){const q=i/80,x=x0+q*(x1-x0),y=y0+q*(y1-y0)+Math.sin(q*Math.PI*2)*amplitude*.48;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();const x=x0+phase*(x1-x0),y=y0+phase*(y1-y0)+Math.sin(phase*Math.PI*2)*amplitude*.48;simDot(ctx,x,y,5,'#fff0d8',true);simText(ctx,'nearby paths vary; stationary path is highlighted',w*.5,h*.9,'#c9d9ed',8,'center');return;
  }
  const pivotX=w*.5,pivotY=h*.2,length=Math.min(h*.44,w*.28)*(.75+Math.min(1.25,(Number(p.L)||5)/20)*.28),angle=Math.sin(t*.8)*.62,bobX=pivotX+Math.sin(angle)*length,bobY=pivotY+Math.cos(angle)*length;ctx.strokeStyle='rgba(220,230,255,.6)';ctx.beginPath();ctx.moveTo(pivotX,pivotY);ctx.lineTo(bobX,bobY);ctx.stroke();simDot(ctx,pivotX,pivotY,4,'#c49aff');simDot(ctx,bobX,bobY,10,'#ffb47a',true);ctx.strokeStyle='rgba(114,215,255,.28)';ctx.beginPath();ctx.ellipse(pivotX,pivotY+length,length*.82,length*.14,0,Math.PI,Math.PI*2);ctx.stroke();simText(ctx,'Euler–Lagrange equation predicts the pendulum path',w*.5,h*.9,'#c9d9ed',8,'center');
}
function drawFluidScene(ctx,w,h,t,kind,p){
  if(kind==='fluid-continuity'){
    const left=w*.08,right=w*.92,mid=h*.5,half=h*.25,narrow=half*(.3+Math.min(1.2,Number(p.R)||2)*.12),flow=Number(p.v)||8;ctx.strokeStyle='rgba(114,215,255,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(left,mid-half);ctx.bezierCurveTo(w*.38,mid-half,w*.38,mid-narrow,w*.54,mid-narrow);ctx.lineTo(right,mid-narrow);ctx.moveTo(left,mid+half);ctx.bezierCurveTo(w*.38,mid+half,w*.38,mid+narrow,w*.54,mid+narrow);ctx.lineTo(right,mid+narrow);ctx.stroke();
    for(let row=0;row<5;row++){const y=mid-half+row*half/2;ctx.strokeStyle='rgba(196,154,255,.35)';ctx.beginPath();ctx.moveTo(left,y);ctx.bezierCurveTo(w*.38,y,w*.38,mid+(y<mid?-narrow:narrow),w*.54,mid+(y<mid?-narrow:narrow));ctx.lineTo(right,mid+(y<mid?-narrow:narrow));ctx.stroke();}
    for(let i=0;i<15;i++){const q=((t*(.035+flow*.012+i%3*.018)+i/15)%1),x=left+q*(right-left),widthFactor=x<w*.42?1:Math.min(3,half/narrow);simDot(ctx,x,mid+Math.sin(i*4)*narrow*.65,2.2*widthFactor,i%2?'#72d7ff':'#ffb47a');}simText(ctx,`volume flow stays constant · narrow section speeds up (${flow} m/s)`,w*.5,h*.9,'#c9d9ed',8,'center');return;
  }
  const cx=w*.53,cy=h*.49,r=Math.min(w,h)*.105,rows=7;
  if(kind==='fluid-navier'||kind==='fluid-euler'){
    const flowScale=.55+(Number(p.v)||8)*.045;for(let row=0;row<rows;row++){const y=cy+(row-(rows-1)/2)*h*.09;ctx.strokeStyle=row%2?'rgba(114,215,255,.38)':'rgba(196,154,255,.38)';ctx.lineWidth=1.4;ctx.beginPath();for(let i=0;i<=w;i+=4){const xNorm=(i-cx)/r,deflect=Math.exp(-Math.pow((i-cx)/r,2))*Math.sign(y-cy)*(kind==='fluid-navier'?Math.sin((i-cx)*.035-t*2)*20*flowScale:14);const yy=Math.abs(xNorm)>1?y+deflect:y; if(i===0)ctx.moveTo(i,yy);else ctx.lineTo(i,yy);}ctx.stroke();}
    ctx.fillStyle='#12182a';ctx.strokeStyle='#ffb47a';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    if(kind==='fluid-navier')for(let i=0;i<4;i++){const a=t*1.4+i*Math.PI/2,x=cx+r*1.8+Math.cos(a)*9,y=cy+Math.sin(a)*9;simDot(ctx,x,y,3,'#c49aff');}
    if(kind==='fluid-euler')for(let i=0;i<8;i++){const x=(t*(25+(Number(p.v)||8)*3)+i*w/8)%w,y=cy+(i%2?1:-1)*(h*.11+Math.sin(x*.02)*5);simDot(ctx,x,y,2.5,'#ffb47a',true);}
    simText(ctx,kind==='fluid-navier'?'viscous wake sheds vortices':'ideal flow bends smoothly; no wake',w*.5,h*.9,'#c9d9ed',8,'center');return;
  }
  const high=(Number(p.v)||8)>14;for(let row=0;row<8;row++){const y=25+row*(h-50)/7;ctx.strokeStyle=high?'rgba(196,154,255,.38)':'rgba(114,215,255,.34)';ctx.beginPath();for(let x=0;x<=w;x+=5){const turbulence=high?Math.sin(x*.08+t*3+row*4)*Math.sin(x*.026-row)*12:Math.sin(x*.016-t+row)*2;const yy=y+turbulence;if(x===0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);}ctx.stroke();}for(let i=0;i<10;i++){const x=(t*(22+(Number(p.v)||8)*2)+i*w/10)%w,row=i%8,y=25+row*(h-50)/7+(high?Math.sin(x*.08+t*3+row*4)*Math.sin(x*.026-row)*12:0);simDot(ctx,x,y,2.3,'#ffb47a');}simText(ctx,high?'high Re · eddies emerge':'low Re · smooth laminar layers',w*.5,h*.9,'#c9d9ed',9,'center');
}
function drawElectromagnetismScene(ctx,w,h,t,kind,p){
  if(kind==='em-induction'){
    const cx=w*.5,cy=h*.52,period=Number(p.period)||8,phase=Math.sin(t*2*Math.PI/period),magX=cx+phase*w*.24;ctx.strokeStyle='rgba(114,215,255,.6)';ctx.lineWidth=2;
    for(let i=0;i<8;i++){const x=cx-36+i*10;ctx.beginPath();ctx.ellipse(x,cy,8,38,0,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle='#c49aff';ctx.fillRect(magX-27,cy-11,27,22);ctx.fillStyle='#ff9b5a';ctx.fillRect(magX,cy-11,27,22);simText(ctx,'N',magX-13,cy,'#fff',9,'center');simText(ctx,'S',magX+13,cy,'#fff',9,'center');
    const current=Math.cos(t*2*Math.PI/period);simArrow(ctx,cx,cy-52,cx+current*45,cy-52,'#ffb47a',current>0?'I →':'I ←');simText(ctx,`magnet motion changes coil flux · ${period} s cycle`,w*.5,h*.9,'#c9d9ed',9,'center');return;
  }
  if(kind==='em-circuit'){
    const x0=w*.23,x1=w*.77,y0=h*.25,y1=h*.76;ctx.strokeStyle='rgba(114,215,255,.72)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(w*.43,y0);ctx.moveTo(w*.57,y0);ctx.lineTo(x1,y0);ctx.lineTo(x1,y1);ctx.lineTo(x0,y1);ctx.closePath();ctx.stroke();
    ctx.strokeStyle='#c49aff';ctx.beginPath();ctx.moveTo(w*.43,y0-12);ctx.lineTo(w*.43,y0+12);ctx.moveTo(w*.57,y0-7);ctx.lineTo(w*.57,y0+7);ctx.stroke();
    ctx.strokeStyle='#ffb47a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0,(y0+y1)/2);ctx.lineTo(w*.42,(y0+y1)/2);ctx.lineTo(w*.45,(y0+y1)/2-10);ctx.lineTo(w*.48,(y0+y1)/2+10);ctx.lineTo(w*.51,(y0+y1)/2-10);ctx.lineTo(w*.54,(y0+y1)/2+10);ctx.lineTo(w*.57,(y0+y1)/2);ctx.lineTo(x1,(y0+y1)/2);ctx.stroke();
    for(let i=0;i<6;i++){const q=((t*.16+i/6)%1),per=2*(x1-x0)+(y1-y0),s=q*per;let x,y;if(s<x1-x0){x=x0+s;y=y0;}else if((s-=x1-x0)<y1-y0){x=x1;y=y0+s;}else if((s-=y1-y0)<x1-x0){x=x1-s;y=y1;}else{x=x0;y=y1-(s-(x1-x0));}simDot(ctx,x,y,3,'#fff0d8',true);}simText(ctx,'battery · resistor · charge flow',w*.5,h*.9,'#c9d9ed',9,'center');return;
  }
  if(kind==='em-wave'){
    const cy=h*.46,amp=h*.19,wavelength=Number(p.wavelength)||.7,waveNumber=.055/wavelength,phase=t*2;ctx.strokeStyle='#ff9b5a';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<=w;x++){const y=cy+Math.sin(x*waveNumber-phase)*amp;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
    for(let i=0;i<11;i++){const x=w*.1+i*w*.08,s=Math.sin(x*waveNumber-phase),yy=cy+amp*.72;ctx.strokeStyle='#72d7ff';ctx.fillStyle='#72d7ff';ctx.beginPath();ctx.arc(x,yy,5,0,Math.PI*2);ctx.stroke();if(s>=0){ctx.beginPath();ctx.arc(x,yy,1.6,0,Math.PI*2);ctx.fill();}else{ctx.beginPath();ctx.moveTo(x-2.2,yy-2.2);ctx.lineTo(x+2.2,yy+2.2);ctx.moveTo(x+2.2,yy-2.2);ctx.lineTo(x-2.2,yy+2.2);ctx.stroke();}}
    simArrow(ctx,w*.12,h*.85,w*.87,h*.85,'rgba(220,230,255,.65)','propagation');simText(ctx,`λ ${wavelength} μm · E in-plane · B out of plane`,w*.5,h*.96,'#c9d9ed',8,'center');return;
  }
  const cx=w*.5,cy=h*.5,r=Math.min(w,h)*.29;
  if(kind==='em-ampere'){
    ctx.strokeStyle='rgba(220,230,255,.55)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cx,cy-r*.92);ctx.lineTo(cx,cy+r*.92);ctx.stroke();simArrow(ctx,cx,cy+r*.64,cx,cy-r*.52,'#ffb47a','I');
    for(let ring=1;ring<=4;ring++){const rr=ring*r*.22;ctx.strokeStyle=`rgba(114,215,255,${.66-ring*.1})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,rr,0,Math.PI*2);ctx.stroke();for(let j=0;j<4;j++){const a=t*.35+j*Math.PI/2+ring*.3,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;simArrow(ctx,x,y,x-Math.sin(a)*8,y+Math.cos(a)*8,'#72d7ff');}}
    simText(ctx,'current through wire → circular magnetic field',w*.5,h*.91,'#c9d9ed',8,'center');return;
  }
  if(kind==='em-coulomb'){
    const charge1=Number(p.q1)||2,charge2=Number(p.q2)||3,distance=Number(p.r)||4,gap=w*(.18+Math.min(13,distance)*.012)+Math.sin(t*.7)*w*.018,left=cx-gap,right=cx+gap,force=Math.max(16,Math.min(76,charge1*charge2/(distance*distance)*12));
    simDot(ctx,left,cy,11,'#ff9b5a',true);simDot(ctx,right,cy,11,'#ff9b5a',true);simText(ctx,'+',left,cy,'#fff',11,'center');simText(ctx,'+',right,cy,'#fff',11,'center');simArrow(ctx,left-12,cy,left-force,cy,'#ffb47a','F₁');simArrow(ctx,right+12,cy,right+force,cy,'#72d7ff','F₂');simText(ctx,`q₁=${charge1} μC · q₂=${charge2} μC · r=${distance} m`,w*.5,h*.9,'#c9d9ed',8,'center');return;
  }
  if(kind==='em-magnetic'){
    const barw=w*.14;ctx.fillStyle='rgba(196,154,255,.68)';ctx.fillRect(cx-barw/2,cy-10,barw/2,20);ctx.fillStyle='rgba(255,155,90,.68)';ctx.fillRect(cx,cy-10,barw/2,20);simText(ctx,'S',cx-barw*.25,cy,'#fff',9,'center');simText(ctx,'N',cx+barw*.25,cy,'#fff',9,'center');
    ctx.strokeStyle='rgba(114,215,255,.62)';ctx.lineWidth=1.5;for(let loop=0;loop<5;loop++){const rx=barw*.9+loop*r*.16,ry=r*(.45+loop*.13);ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.stroke();const a=-.4-loop*.06,x=cx+Math.cos(a)*rx,y=cy+Math.sin(a)*ry;simArrow(ctx,x,y,x-Math.sin(a)*10,y+Math.cos(a)*8,'#72d7ff');}
    simText(ctx,'magnetic field lines are closed loops: ∇·B = 0',w*.5,h*.91,'#c9d9ed',8,'center');return;
  }
  if(kind==='em-gauss'){
    ctx.strokeStyle='rgba(196,154,255,.64)';ctx.setLineDash([4,4]);ctx.beginPath();ctx.ellipse(cx,cy,r*.84,r*.58,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);simText(ctx,'Gaussian surface',cx,cy-r*.69,'#c49aff',8,'center');
    const rayCount=8+Math.min(10,Math.round((Number(p.Q)||100)/55));for(let i=0;i<rayCount;i++){const a=i*Math.PI*2/rayCount,x=cx+Math.cos(a)*r*.9,y=cy+Math.sin(a)*r*.62;simArrow(ctx,cx+Math.cos(a)*14,cy+Math.sin(a)*14,x,y,'rgba(255,155,90,.72)');}simDot(ctx,cx,cy,8,'#ffb47a',true);simText(ctx,`outward flux · enclosed charge ${p.Q||100} μC`,w*.5,h*.91,'#c9d9ed',8,'center');return;
  }
  for(let i=0;i<16;i++){const a=i*Math.PI*2/16,rr=r;simArrow(ctx,cx+Math.cos(a)*18,cy+Math.sin(a)*18,cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,'rgba(255,155,90,.58)');}simDot(ctx,cx,cy,9,'#ffb47a',true);simText(ctx,'like charges repel · force weakens as separation grows',w*.5,h*.91,'#c9d9ed',8,'center');
}
function drawThermodynamicsScene(ctx,w,h,t,kind,p){
  if(kind==='thermo-first-law'){
    const input=Number(p.Q)||120,x=w*.16,y=h*.3,total=w*.68,height=h*.26,f=(.5+.35*Math.sin(t*.7));ctx.fillStyle='rgba(255,155,90,.72)';ctx.fillRect(x,y,total*f,height);ctx.fillStyle='rgba(114,215,255,.72)';ctx.fillRect(x+total*f,y,total*(1-f)*.55,height);ctx.fillStyle='rgba(196,154,255,.72)';ctx.fillRect(x+total*f+total*(1-f)*.55,y,total*(1-f)*.45,height);simText(ctx,'heat Q',x+total*.16,y+height+20,'#ffb47a',9,'center');simText(ctx,'stored ΔU',x+total*.63,y+height+20,'#72d7ff',9,'center');simText(ctx,'work W',x+total*.88,y+height+20,'#c49aff',9,'center');simText(ctx,`Q = ΔU + W · input ${input} J`,w*.5,h*.88,'#dce4f4',9,'center');return;
  }
  if(kind==='thermo-engine'){
    const hot=Number(p.Th)||800,cold=Number(p.Tc)||250,efficiency=1-cold/hot;drawGraphScene(ctx,w,h,t,q=>.5+.32*Math.sin(q*Math.PI*2),'volume V →','pressure P','#ffb47a');ctx.strokeStyle='#ff9b5a';ctx.strokeRect(w*.18,h*.23,w*.19,h*.12);ctx.strokeStyle='#72d7ff';ctx.strokeRect(w*.63,h*.23,w*.19,h*.12);simText(ctx,`hot ${hot} K`,w*.275,h*.29,'#ffcf9a',8,'center');simText(ctx,`cold ${cold} K`,w*.725,h*.29,'#a9dcff',8,'center');simText(ctx,`maximum efficiency ${(efficiency*100).toFixed(0)}% · cyclic heat engine`,w*.5,h*.95,'#c9d9ed',8,'center');return;
  }
  if(kind==='thermo-entropy'){
    const split=w*.5,heat=Number(p.Q)||100,temp=Number(p.T)||300,rate=.08+heat/temp*.12;for(let i=0;i<34;i++){const phase=(t*rate+i*.037)%1,clusterX=w*.22,evenX=w*.78,x=clusterX+(evenX-clusterX)*phase+(Math.sin(i*12.9+t)*w*.08),y=h*.23+(i%8)*h*.065;simDot(ctx,x,y,2.5,i%4?'#72d7ff':'#ffb47a');}ctx.strokeStyle='rgba(180,200,230,.3)';ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(split,h*.18);ctx.lineTo(split,h*.76);ctx.stroke();ctx.setLineDash([]);simText(ctx,`ordered energy → dispersed states · ΔS ≈ ${heat}/${temp}`,w*.5,h*.9,'#c9d9ed',8,'center');return;
  }
  if(kind==='thermo-conduction'){
    const left=w*.18,right=w*.82,y=h*.5,thickness=Number(p.L)||5,rate=.75/(.5+thickness*.12);ctx.strokeStyle='rgba(180,200,230,.32)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();for(let i=0;i<14;i++){const x=left+i*(right-left)/13,temp=1-i/14;simDot(ctx,x,y,5,temp>.5?'#ff9b5a':'#72d7ff');if(i<13){const pulse=((t*rate+i*.18)%1);simDot(ctx,x+(right-left)/13*pulse,y,2.3,'#fff0d8');}}simText(ctx,`hot → cold · ${thickness} m wall · thicker slows heat flow`,w*.5,h*.85,'#c9d9ed',8,'center');return;
  }
  if(kind==='thermo-maxwell'){
    drawGraphScene(ctx,w,h,t,q=>Math.min(1,q*q*Math.exp(2.05-3.2*q*q)),'molecular speed →','fraction of molecules','#c49aff');
    for(let i=0;i<10;i++){const q=(i/10+.5)%1,x=w*.14+q*w*.72,y=h*.24+(i%4)*10,phase=t*(.5+q);simDot(ctx,x+Math.sin(phase)*12,y,2.5,i%3?'#72d7ff':'#ffb47a');}simText(ctx,'temperature raises the mean molecular speed',w*.5,h*.95,'#c9d9ed',8,'center');return;
  }
  if(kind==='thermo-kinetic'){
    const temperature=Number(p.T)||300,mean=1.5*1.38e-23*temperature;for(let i=0;i<22;i++){const x=w*.2+((i*43+Math.sin(t*(.5+temperature/900)+i)*18)%(w*.6)),y=h*.22+(i%7)*h*.065;simDot(ctx,x,y,2.5+(temperature/500),i%3?'#72d7ff':'#ff9b5a');}drawGraphScene(ctx,w,h,t,q=>q,'temperature T →','mean kinetic energy','#ffb47a');simText(ctx,`K̄ = 3/2 kT · ${temperature} K → ${mean.toExponential(1)} J`,w*.5,h*.95,'#c9d9ed',8,'center');return;
  }
  const x=w*.18,y=h*.22,bw=w*.64,bh=h*.52,temp=(Number(p.T)||300)/1100,moles=Number(p.n)||2,volume=Number(p.V)||8;ctx.strokeStyle='rgba(114,215,255,.65)';ctx.strokeRect(x,y,bw,bh);ctx.strokeStyle='#c49aff';ctx.beginPath();ctx.moveTo(x+bw*.5,y);ctx.lineTo(x+bw*.5,y+bh*.15);ctx.stroke();ctx.strokeRect(x+bw*.25,y+bh*.14,bw*.5,5);for(let i=0;i<Math.min(40,12+Math.round(moles*3));i++){const px=x+8+((i*47+Math.sin(t*(1+i%3))*18)%Math.max(1,bw-16)),py=y+8+((i*31+Math.cos(t*(1+i%4))*16)%Math.max(1,bh-16));simDot(ctx,px,py,2.3+temp*2,i%3?'#72d7ff':'#ff9b5a');}simText(ctx,`${moles} mol · ${Math.round(Number(p.T)||300)} K · ${volume} L`,w*.5,h*.88,'#c9d9ed',9,'center');
}
function drawRelativityScene(ctx,w,h,t,kind,p){
  if(kind==='relativity-lorentz')return drawGraphScene(ctx,w,h,t,q=>.1+.85*(1/Math.sqrt(1-Math.pow(q*.94,2))-1)/3,'speed v/c →','Lorentz factor γ','#c49aff');
  if(kind==='relativity-time'){
    [[w*.3,'rest clock',1], [w*.7,'moving clock',Math.sqrt(1-Math.pow(Number(p.beta)||.6,2))]].forEach(([x,label,rate])=>{const y=h*.48,r=Math.min(28,h*.19);ctx.strokeStyle='rgba(220,230,255,.65)';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*(r-4),y+Math.sin(a)*(r-4));ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.stroke();}const a=t*rate;ctx.strokeStyle='#ffb47a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7);ctx.stroke();simText(ctx,label,x,y+r+14,'#c9d9ed',8,'center');});simText(ctx,'moving clock accumulates less proper time',w*.5,h*.91,'#c9d9ed',8,'center');return;
  }
  if(kind==='relativity-length'){
    const beta=Math.min(.95,Number(p.beta)||.6),short=1/Math.sqrt(1-beta*beta),y=h*.49;ctx.fillStyle='rgba(114,215,255,.65)';ctx.fillRect(w*.13,y-13,w*.72,26);ctx.fillStyle='rgba(196,154,255,.8)';ctx.fillRect(w*.13,y+35,w*.72/short,15);simText(ctx,'rest length L₀',w*.5,y-26,'#c9d9ed',9,'center');simText(ctx,'moving length L = L₀/γ',w*.13+w*.36/short,y+64,'#c9d9ed',9,'center');simArrow(ctx,w*.18,y+5,w*.8,y+5,'#ffb47a','motion');return;
  }
  if(kind==='relativity-energy')return drawGraphScene(ctx,w,h,t,q=>Math.min(1,.08+.92*(1/Math.sqrt(1-Math.pow(q*.96,2))-1)/5),'speed v/c →','total energy γmc²','#ffb47a');
  if(kind==='relativity-momentum')return drawGraphScene(ctx,w,h,t,q=>Math.min(1,q*.94/Math.sqrt(1-Math.pow(q*.94,2))*.34),'speed v/c →','momentum γmv','#72d7ff');
  if(kind==='relativity-dispersion')return drawGraphScene(ctx,w,h,t,q=>Math.sqrt(.08+.92*q*q),'momentum p →','energy E(p)','#c49aff');
  drawEnergySimulation(ctx,w,h,t);
}
function drawGeneralRelativityScene(ctx,w,h,t,kind,p){
  if(kind==='gr-curvature')return drawGravitySimulation(ctx,w,h,t);
  if(kind==='gr-clock')return drawRelativityScene(ctx,w,h,t,'relativity-time',p);
  if(kind==='gr-expansion'){
    const cx=w*.5,cy=h*.48,matter=Math.max(.2,Number(p.rho)||1),dark=Math.max(1,Number(p.L)||5),scale=.23+((t*(.035+dark*.0018))%1.25);for(let i=0;i<18;i++){const a=i*Math.PI*2/18,r=(Math.min(w,h)*(.12+i%4*.035))*scale,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.65;simDot(ctx,x,y,2.4,i%4?'#72d7ff':'#ffb47a');}simText(ctx,`scale factor expands · matter ρ ${matter} · Λ ${dark}`,w*.5,h*.9,'#c9d9ed',8,'center');return;
  }
  const cx=w*.5,cy=h*.47,r=Math.min(w,h)*.3,rs=r*.48;for(let i=1;i<=5;i++){ctx.strokeStyle=`rgba(114,215,255,${.4-i*.04})`;ctx.beginPath();ctx.ellipse(cx,cy,rs+i*r*.13,rs*.72+i*r*.1,-.15,0,Math.PI*2);ctx.stroke();}ctx.strokeStyle='#ff9b5a';ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(cx,cy,rs,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);simDot(ctx,cx,cy,7,'#14111e');simText(ctx,'event horizon · rₛ = 2GM/c²',w*.5,h*.9,'#c9d9ed',9,'center');
}
function drawQuantumScene(ctx,w,h,t,kind,p){
  if(kind==='qm-uncertainty'){
    const phase=.5+.45*Math.sin(t*.7),sigmaX=10+phase*20*(Number(p.lambda)||1),cx=w*.5,cy=h*.5;ctx.strokeStyle='rgba(180,154,255,.3)';ctx.beginPath();ctx.moveTo(w*.12,cy);ctx.lineTo(w*.88,cy);ctx.stroke();ctx.fillStyle='rgba(196,154,255,.28)';ctx.beginPath();for(let i=0;i<=100;i++){const q=(i/100-.5)*2,x=cx+q*w*.33,y=cy-Math.exp(-Math.pow(q*w*.33/sigmaX,2))*h*.36;if(i===0)ctx.moveTo(x,cy);ctx.lineTo(x,y);}ctx.lineTo(w*.88,cy);ctx.fill();simText(ctx,`Δx ≈ ${Math.round(sigmaX)} · Δp ∝ 1/Δx`,w*.5,h*.89,'#d8c4ff',9,'center');return;
  }
  if(kind==='qm-levels'){
    const x0=w*.27,x1=w*.73;for(let i=1;i<=5;i++){const y=h*.78-i*i*h*.11;ctx.strokeStyle='rgba(114,215,255,.7)';ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();simText(ctx,'n='+i,x0-13,y,'#b9cbe2',8,'right');}const phase=(t%4)/4,y=h*.78-(1+Math.floor(phase*4))**2*h*.11;ctx.strokeStyle='#ffb47a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1+18,y);ctx.lineTo(x1+18,y-h*.17);ctx.stroke();simArrow(ctx,x1+18,y-h*.17,x1+18,y,'#ffb47a','hν');simText(ctx,'discrete states · photon transitions',w*.5,h*.92,'#c9d9ed',8,'center');return;
  }
  if(kind==='qm-photon'){
    const y=h*.48;for(let i=0;i<8;i++){const x=(t*55+i*w/8)%w;simDot(ctx,x,y,3,'#ffb47a',true);}ctx.strokeStyle='rgba(114,215,255,.55)';ctx.beginPath();ctx.moveTo(w*.83,h*.24);ctx.lineTo(w*.83,h*.72);ctx.stroke();simText(ctx,'photons arrive as packets',w*.5,h*.86,'#c9d9ed',9,'center');return;
  }
  if(kind==='qm-expectation'){
    const center=.5+.12*Math.sin(t*.45),spread=.12;drawGraphScene(ctx,w,h,t,q=>.08+.9*Math.exp(-Math.pow((q-center)/spread,2)),'position measurement x →','probability density |ψ|²','#72d7ff');
    const markerX=w*.13+center*w*.81;ctx.strokeStyle='#ffb47a';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(markerX,h*.19);ctx.lineTo(markerX,h*.78);ctx.stroke();ctx.setLineDash([]);simText(ctx,'⟨x⟩ is the probability-weighted mean',w*.5,h*.95,'#c9d9ed',8,'center');return;
  }
  const width=Number(p.lambda)||1.2,center=w*.5,phase=t*2;ctx.strokeStyle='#c49aff';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<=w;x++){const z=(x-center)/(w*.14*width),y=h*.52+Math.sin(x*.045-phase)*Math.exp(-z*z)*h*.24;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();for(let i=0;i<9;i++){const x=(t*42+i*w/9)%w;simDot(ctx,x,h*.78,2.4,'#72d7ff');}simText(ctx,'wavefunction amplitude → probability density',w*.5,h*.9,'#d8c4ff',8,'center');
}
function drawStellarScene(ctx,w,h,t,kind,p){
  if(kind==='star-equilibrium'){
    const cx=w*.5,cy=h*.5,r=Math.min(w,h)*(.22+Math.min(1.2,Number(p.M)||3)*.018);for(let i=1;i<=5;i++){ctx.strokeStyle=`rgba(255,155,90,${.17+i*.035})`;ctx.beginPath();ctx.arc(cx,cy,r*i/5,0,Math.PI*2);ctx.stroke();}for(let i=0;i<10;i++){const a=i*Math.PI/5;simArrow(ctx,cx+Math.cos(a)*r*.84,cy+Math.sin(a)*r*.84,cx+Math.cos(a)*r*.55,cy+Math.sin(a)*r*.55,'#72d7ff','P');simArrow(ctx,cx+Math.cos(a)*r*.55,cy+Math.sin(a)*r*.55,cx+Math.cos(a)*r*.86,cy+Math.sin(a)*r*.86,'#ff9b5a','g');}simText(ctx,'pressure support balances inward gravity',w*.5,h*.9,'#c9d9ed',8,'center');return;
  }
  if(kind==='star-spectrum'){const temp=Number(p.Tstar)||Number(p.T)||5000,peak=.78-Math.min(.58,temp/18000);drawGraphScene(ctx,w,h,t,q=>Math.exp(-Math.pow((q-peak)*4,2))*.9,'wavelength →',`blackbody intensity · ${temp} K`,'#ffb47a');return;}
  if(kind==='star-lifetime'){
    const mass=Number(p.M)||2,fuel=1-((t*(.03+mass*.025))%1),x=w*.18,y=h*.42,bw=w*.64;ctx.strokeStyle='rgba(220,230,255,.45)';ctx.strokeRect(x,y,bw,25);ctx.fillStyle='#ff9b5a';ctx.fillRect(x,y,bw*fuel,25);simGlow(ctx,w*.5,h*.69,35);simDot(ctx,w*.5,h*.69,17,'#ffbd69');simText(ctx,`${mass} M☉ · fuel ${(fuel*100)|0}%`,w*.5,h*.88,'#ffcf9a',9,'center');return;
  }
  if(kind==='star-tov'){
    const peak=Math.min(.78,.62+.06*Math.sin(t*.38));drawGraphScene(ctx,w,h,t,q=>q<peak?q/peak:.9-(q-peak)*1.7,'stellar radius →','stable neutron-star mass','#c49aff');
    simText(ctx,'relativistic pressure support reaches a maximum mass',w*.5,h*.95,'#c9d9ed',8,'center');return;
  }
  if(kind==='star-luminosity'){
    const temp=Number(p.Tstar)||Number(p.T)||6000,radius=Number(p.R)||2,pulse=.82+.18*Math.sin(t*2);simGlow(ctx,w*.5,h*.48,Math.min(105,34+radius*6)*pulse,'#fff4ce','#ff9b5a');simDot(ctx,w*.5,h*.48,Math.min(45,18+radius*2),'#ffcf78',true);
    for(let i=0;i<6;i++){const a=t*.22+i*Math.PI/3,rr=65+(i%3)*10;simArrow(ctx,w*.5+Math.cos(a)*rr,w*.48+Math.sin(a)*rr,w*.5+Math.cos(a)*(rr+13),w*.48+Math.sin(a)*(rr+13),'rgba(255,180,120,.58)');}simText(ctx,`L ∝ R²T⁴ · surface temperature ${temp} K`,w*.5,h*.9,'#ffcf9a',9,'center');return;
  }
  const radius=Math.min(w,h)*(.15+((Number(p.R)||2)%4)*.025),cx=w*.5,cy=h*.5;simGlow(ctx,cx,cy,radius*2.2,'#fff8ce','#ff9b5a');simDot(ctx,cx,cy,radius,'#ffbd69',true);simText(ctx,`surface temperature ${Number(p.T)||5000} K · luminosity ∝ R²T⁴`,w*.5,h*.9,'#ffcf9a',8,'center');
}
function drawCosmologyScene(ctx,w,h,t,kind,p){
  if(kind==='cosmo-hubble')return drawGraphScene(ctx,w,h,t,q=>q,'distance →','recession velocity','#72d7ff');
  if(kind==='cosmo-density'){
    const cx=w*.5,cy=h*.5,r=Math.min(w,h)*.28,ratio=.2+.65*Math.abs(Math.sin(t*.35));ctx.strokeStyle='rgba(114,215,255,.3)';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=ratio>.5?'#ff9b5a':'#c49aff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+ratio*Math.PI*2);ctx.stroke();simText(ctx,ratio>.5?'density above critical':'density below critical',cx,cy,'#f2eadc',9,'center');return;
  }
  if(kind==='cosmo-cmb')return drawGraphScene(ctx,w,h,t,q=>.08+.84*(1-q)*(1+.04*Math.min(8,Number(p.z)||2)),'redshift z →',`CMB temperature · case z=${p.z||2}`,'#c49aff');
  const cx=w*.5,cy=h*.5,lambda=Math.max(1,Number(p.L)||5),scale=.25+((t*(.035+lambda*.0015))%1.2);for(let i=0;i<14;i++){const a=i*Math.PI/7,r=(i%4+2)*10*scale;simDot(ctx,cx+Math.cos(a)*r,cy+Math.sin(a)*r*.7,2.5,i%3?'#72d7ff':'#ffb47a');}simText(ctx,'separations accelerate with dark energy',w*.5,h*.9,'#c9d9ed',9,'center');
}
function drawGravitationalWaveScene(ctx,w,h,t,kind,p){
  if(kind==='gw-strain'){
    const cx=w*.5,cy=h*.5,arm=Math.min(1.4,.65+(Number(p.L)||4)*.035),stretch=Math.sin(t*2)*w*.12*arm;ctx.strokeStyle='rgba(114,215,255,.72)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cx-stretch,cy);ctx.lineTo(cx+stretch,cy);ctx.moveTo(cx,cy-stretch*.65);ctx.lineTo(cx,cy+stretch*.65);ctx.stroke();simDot(ctx,cx,cy,5,'#ffb47a',true);simText(ctx,`${p.L||4} km arms stretch and squeeze with the passing wave`,w*.5,h*.88,'#c9d9ed',8,'center');return;
  }
  if(kind==='gw-chirp'){drawGraphScene(ctx,w,h,t,q=>.08+.9*q*q,'time to merger →',`wave frequency · start ${p.f||6}`,'#c49aff');simText(ctx,'frequency rises as the orbit tightens',w*.5,h*.95,'#c9d9ed',8,'center');return;}
  const cx=w*.5,cy=h*.46,phase=t*1.2,mass=Number(p.M)||5,sep=Math.max(12,Math.min(w,h)*(.28-.08*Math.sin(t*.22)+(mass-5)*.003));for(let i=1;i<=4;i++){ctx.strokeStyle=`rgba(196,154,255,${.3-i*.05})`;ctx.beginPath();ctx.ellipse(cx,cy,sep+i*10,(sep+i*10)*.55,0,0,Math.PI*2);ctx.stroke();}simDot(ctx,cx+Math.cos(phase)*sep,cy+Math.sin(phase)*sep*.55,7,'#ff9b5a',true);simDot(ctx,cx-Math.cos(phase)*sep,cy-Math.sin(phase)*sep*.55,7,'#72d7ff',true);simText(ctx,`${mass} M☉ binary loses orbital energy to gravitational waves`,w*.5,h*.9,'#c9d9ed',8,'center');
}
function drawPlasmaScene(ctx,w,h,t,kind,p){
  if(kind==='plasma-alfven'){
    const mid=h*.5,field=Number(p.B)||.5,density=Number(p.rho)||1,amplitude=h*(.12+Math.min(.16,field/(density+field)*.3)),waveSpeed=.7+Math.sqrt(field/density);ctx.strokeStyle='#72d7ff';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<=w;x++){const y=mid+Math.sin(x*.035-t*waveSpeed)*amplitude;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();for(let x=20;x<w;x+=44){ctx.strokeStyle='rgba(196,154,255,.48)';ctx.beginPath();ctx.moveTo(x,mid-12);ctx.lineTo(x,mid+12);ctx.stroke();}simText(ctx,`Alfvén pulse · B=${field} · ρ=${density}`,w*.5,h*.88,'#c9d9ed',8,'center');return;
  }
  if(kind==='plasma-frequency'){
    const cx=w*.5,cy=h*.5,amplitude=12+Math.min(30,(Number(p.rho)||1)*10),frequency=.8+(Number(p.n)||2)*.18;for(let i=0;i<20;i++){const y=cy+(i-10)*8,x=cx+Math.sin(t*frequency+i*.16)*amplitude;simDot(ctx,x,y,3,i%2?'#72d7ff':'#ffb47a');}simText(ctx,'electrons oscillate against the ion background',w*.5,h*.89,'#c9d9ed',8,'center');return;
  }
  if(kind==='plasma-wind'){
    const cx=w*.76,cy=h*.5,speed=Number(p.v)||8;ctx.strokeStyle='rgba(114,215,255,.55)';for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(0,20+i*(h-40)/6);ctx.bezierCurveTo(w*.4,20+i*(h-40)/6,cx-40,cy+(i-3)*16,cx,cy+(i-3)*30);ctx.stroke();}for(let i=0;i<22;i++){const x=(t*(18+speed*4)+i*31)%w,y=h*.12+(i*37%(h*.76));simDot(ctx,x,y,2,'#ffb47a');}ctx.strokeStyle='#c49aff';ctx.beginPath();ctx.arc(cx,cy,32,0,Math.PI*2);ctx.stroke();simText(ctx,`solar wind · ${speed} m/s · pressure against magnetic obstacle`,w*.5,h*.91,'#c9d9ed',8,'center');return;
  }
  const cx=w*.5,cy=h*.5,tension=Math.max(.5,(Number(p.B)||.5)/(Number(p.rho)||1)),bend=Math.min(48,14+tension*12);for(let i=0;i<7;i++){const y=cy+(i-3)*15;ctx.strokeStyle='rgba(196,154,255,.38)';ctx.beginPath();ctx.moveTo(w*.08,y);ctx.bezierCurveTo(w*.3,y-bend,w*.36,y+bend,w*.5,y);ctx.bezierCurveTo(w*.64,y-bend,w*.7,y+bend,w*.92,y);ctx.stroke();}simText(ctx,'magnetic tension and pressure steer plasma flow',w*.5,h*.9,'#c9d9ed',8,'center');
}
function drawRadioScene(ctx,w,h,t,kind,p){
  if(kind==='radio-hydrogen'){
    const velocity=Number(p.v)||8,center=.5+Math.sin(t*.38)*Math.min(.14,velocity/180),width=.02+Math.min(.018,velocity/1800);drawGraphScene(ctx,w,h,t,q=>.1+.82*Math.exp(-Math.pow((q-center)/width,2)),'frequency →','neutral hydrogen line','#72d7ff');simText(ctx,`21 cm line · Doppler shift for ${velocity} km/s gas`,w*.5,h*.95,'#c9d9ed',8,'center');return;
  }
  if(kind==='radio-pulsar'){
    const base=h*.68;ctx.strokeStyle='rgba(114,215,255,.4)';ctx.beginPath();ctx.moveTo(w*.08,base);ctx.lineTo(w*.92,base);ctx.stroke();for(let i=0;i<8;i++){const x=w*.1+i*w*.11+(t*35%30);ctx.strokeStyle='#ffb47a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,base);ctx.lineTo(x,base-18-(i%2)*7);ctx.stroke();}simText(ctx,'regular radio pulses mark neutron-star rotation',w*.5,h*.88,'#c9d9ed',8,'center');return;
  }
  if(kind==='radio-dish'){
    const spacing=Math.min(w*.34,Math.max(w*.12,(Number(p.L)||8)*w*.012)),wave=Math.max(8,Number(p.lambda)||1);ctx.strokeStyle='#c49aff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(w*.5,h*.72,w*.25,h*.2,0,Math.PI,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(w*.5,h*.72);ctx.lineTo(w*.5,h*.35);ctx.stroke();ctx.strokeStyle='rgba(114,215,255,.5)';for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(w*.5+i*spacing,h*.08);ctx.lineTo(w*.5+i*5,h*.57);ctx.stroke();}simText(ctx,`baseline ${p.L||8} m · wavelength ${wave} m sets resolution`,w*.5,h*.91,'#c9d9ed',8,'center');return;
  }
  if(kind==='radio-synchrotron')return drawGraphScene(ctx,w,h,t,q=>.15+.76*Math.pow(q+.05,-.35),'radio frequency →','emission power','#ffb47a');
  drawGraphScene(ctx,w,h,t,q=>.12+.78*Math.exp(-Math.pow((q-.52)*35,2)),'frequency around 1420 MHz →','hydrogen signal','#72d7ff');
}
function drawSpaceWeatherScene(ctx,w,h,t,kind,p){
  if(kind==='weather-kp'){
    const value=Math.max(1,Math.min(9,Number(p.n)||5)),cx=w*.5,cy=h*.55,r=Math.min(w,h)*.3;ctx.strokeStyle='rgba(220,230,255,.24)';ctx.lineWidth=8;ctx.beginPath();ctx.arc(cx,cy,r,Math.PI,Math.PI*2);ctx.stroke();ctx.strokeStyle=value>=5?'#ff9b5a':'#72d7ff';ctx.lineWidth=8;ctx.beginPath();ctx.arc(cx,cy,Math.max(12,r-2),Math.PI,Math.PI+Math.PI*value/9);ctx.stroke();const a=Math.PI+Math.PI*value/9;simArrow(ctx,cx,cy,cx+Math.cos(a)*r*.75,cy+Math.sin(a)*r*.75,'#ffb47a');simText(ctx,`Kp ${value} / 9`,cx,cy+14,'#f2eadc',14,'center');simText(ctx,value>=5?'geomagnetic storm threshold':'quiet to unsettled conditions',cx,h*.91,'#c9d9ed',8,'center');return;
  }
  if(kind==='weather-aurora'){
    const horizon=h*.68;ctx.strokeStyle='rgba(114,215,255,.35)';ctx.beginPath();ctx.moveTo(w*.08,horizon);ctx.lineTo(w*.92,horizon);ctx.stroke();
    for(let i=0;i<11;i++){const x=w*.12+i*w*.075,phase=t*.8+i*.62,reach=h*(.18+.12*(.5+.5*Math.sin(phase)));ctx.strokeStyle=i%3?'rgba(86,224,154,.48)':'rgba(196,154,255,.62)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,horizon);ctx.bezierCurveTo(x-14,horizon-reach*.45,x+16,horizon-reach*.75,x+Math.sin(phase)*9,horizon-reach);ctx.stroke();}for(let i=0;i<10;i++){const x=(t*36+i*w/10)%w;simDot(ctx,x,h*.17+Math.sin(t+i)*h*.06,2.4,'#ffb47a');}simText(ctx,'field-guided particles excite upper-atmosphere gases',w*.5,h*.9,'#c9d9ed',8,'center');return;
  }
  if(kind==='weather-cme'){
    const front=w*.12+((t*48)%(w*.62)),cy=h*.5,earthX=w*.82,r=Math.min(w,h)*.16,speed=Number(p.v)||9;ctx.strokeStyle='rgba(255,155,90,.48)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(front,cy,h*.27,-Math.PI*.46,Math.PI*.46);ctx.stroke();for(let i=0;i<24;i++){const x=front+((i*17+t*speed*2)%(w*.19)),y=h*.2+(i*31%(h*.6));simDot(ctx,x,y,2.5,i%3?'#ffb47a':'#c49aff');}simGlow(ctx,earthX,cy,r*1.35,'#b5e8ff','#4382ce');simDot(ctx,earthX,cy,r,'#153b73');simText(ctx,'coronal mass ejection travels from Sun toward Earth',w*.5,h*.9,'#c9d9ed',8,'center');return;
  }
  const cx=w*.76,cy=h*.5,r=Math.min(w,h)*.19;simGlow(ctx,cx,cy,r*1.3,'#9bdcff','#4382ce');simDot(ctx,cx,cy,r,'#153b73');const squeeze=.12*Math.sin(t*.8);ctx.strokeStyle='#72d7ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx-w*.18,cy,r*(1.6-squeeze),r*.92,0,Math.PI*.5,Math.PI*1.5);ctx.stroke();for(let i=0;i<7;i++){const x=(t*75+i*w*.15)%w;simDot(ctx,x,h*.18+(i*37%(h*.64)),2.4,'#ffb47a');}simText(ctx,'solar-wind ram pressure compresses the magnetosphere',w*.5,h*.9,'#c9d9ed',8,'center');
}
function drawAstrochemistryScene(ctx,w,h,t,kind,p){
  if(kind==='chem-photodissociation'){
    const edge=w*.42;ctx.fillStyle='rgba(114,215,255,.08)';ctx.fillRect(edge,h*.16,w*.48,h*.58);for(let i=0;i<9;i++){const x=(t*75+i*51)%w,y=h*.2+(i*37%(h*.5));ctx.strokeStyle='#ffb47a';ctx.beginPath();ctx.moveTo(x-7,y-7);ctx.lineTo(x+7,y+7);ctx.moveTo(x+7,y-7);ctx.lineTo(x-7,y+7);ctx.stroke();}for(let i=0;i<20;i++){const x=edge+12+(i*27%(w*.42)),y=h*.2+(i*19%(h*.49));simDot(ctx,x,y,3,'#72d7ff');}simText(ctx,'UV exposed edge  →  shielded molecular cloud',w*.5,h*.9,'#c9d9ed',8,'center');return;
  }
  if(kind==='chem-spectrum')return drawGraphScene(ctx,w,h,t,q=>.82-.48*Math.exp(-Math.pow((q-.3)*40,2))-.35*Math.exp(-Math.pow((q-.72)*32,2)),'frequency →','molecular absorption','#c49aff');
  if(kind==='chem-cloud'){
    for(let i=0;i<27;i++){const angle=i*2.4+t*.08,r=8+(i*19%(Math.min(w,h)*.31)),x=w*.5+Math.cos(angle)*r,y=h*.49+Math.sin(angle)*r*.62;simDot(ctx,x,y,3,i%3?'#72d7ff':'#ffb47a');if(i%4===0){ctx.strokeStyle='rgba(196,154,255,.32)';ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.stroke();}}simText(ctx,'cold dust grains host molecule-building reactions',w*.5,h*.9,'#c9d9ed',8,'center');return;
  }
  drawGraphScene(ctx,w,h,t,q=>.16+.68*(1-Math.exp(-q*(1+Number(p.n||1)*.1))),'reaction time →','molecule abundance','#72d7ff');
}
function drawOpticsCatalogScene(ctx,w,h,t,kind,p){
  if(kind==='optics-snell'){
    const bx=w*.53,by=h*.5;ctx.fillStyle='rgba(114,215,255,.08)';ctx.fillRect(bx,0,w-bx,h);ctx.strokeStyle='rgba(220,230,255,.55)';ctx.beginPath();ctx.moveTo(bx,h*.12);ctx.lineTo(bx,h*.82);ctx.stroke();ctx.strokeStyle='#ffb47a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w*.13,h*.23);ctx.lineTo(bx,by);ctx.lineTo(w*.83,h*.72);ctx.stroke();ctx.strokeStyle='rgba(196,154,255,.55)';ctx.beginPath();ctx.arc(bx,by,38,-.65,0);ctx.stroke();simText(ctx,'ray bends; frequency remains fixed',w*.5,h*.9,'#c9d9ed',8,'center');return;
  }
  if(kind==='optics-lens'){
    const lens=w*.52,cy=h*.5;ctx.strokeStyle='#c49aff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(lens,cy,10,h*.32,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='rgba(255,180,120,.72)';for(let i=-2;i<=2;i++){const y=cy+i*14;ctx.beginPath();ctx.moveTo(w*.14,y-22);ctx.lineTo(lens,cy+i*4);ctx.lineTo(w*.85,cy+i*17);ctx.stroke();}ctx.fillStyle='#ffb47a';ctx.fillRect(w*.14-3,cy-28,6,56);ctx.fillStyle='#72d7ff';ctx.fillRect(w*.85-2,cy-18,4,36);simText(ctx,'object → lens → image',w*.5,h*.9,'#c9d9ed',9,'center');return;
  }
  if(kind==='optics-diffraction'){
    const source=w*.18,screen=w*.83,cy=h*.5;ctx.strokeStyle='rgba(114,215,255,.55)';for(let i=-3;i<=3;i++){const y=cy+i*12;ctx.beginPath();ctx.moveTo(source,y);ctx.lineTo(w*.5,cy);ctx.lineTo(screen,cy+i*22);ctx.stroke();}ctx.strokeStyle='#ffb47a';for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(screen-5,cy+i*22);ctx.lineTo(screen+5,cy+i*22);ctx.stroke();}simText(ctx,'constructive interference selects bright orders',w*.5,h*.9,'#c9d9ed',8,'center');return;
  }
  for(let i=0;i<8;i++){const x=(t*65+i*w/8)%w;simDot(ctx,x,h*.49,3,'#ffcf9a',true);}simText(ctx,'higher frequency photons carry more energy',w*.5,h*.88,'#c9d9ed',9,'center');
}
function drawParticleScene(ctx,w,h,t,kind,p){
  if(kind==='particle-cross-section'){
    const events=Number(p.n)||5,efficiency=Number(p.epsilon)||.5,luminosity=Number(p.L)||8;for(let i=0;i<20;i++){const x=w*.16+i*w*.032,height=(.15+Math.abs(Math.sin(i*2.2+t*.25))*.7)*h*.44*(.45+events*.08)*(.6+efficiency*.4);ctx.fillStyle='rgba(114,215,255,.7)';ctx.fillRect(x,h*.76-height,5,height);}ctx.strokeStyle='#ffb47a';ctx.beginPath();ctx.moveTo(w*.5,h*.72);ctx.lineTo(w*.5,h*.23);ctx.stroke();simText(ctx,`N=${events} · luminosity=${luminosity} · efficiency=${efficiency} → σ`,w*.5,h*.9,'#c9d9ed',8,'center');return;
  }
  if(kind==='particle-gauge'){
    const cx=w*.5,cy=h*.48,coupling=Number(p.alpha)||.7;simDot(ctx,w*.24,cy,6,'#72d7ff',true);simDot(ctx,w*.76,cy,6,'#ffb47a',true);ctx.strokeStyle='#c49aff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w*.24,cy);ctx.bezierCurveTo(w*.4,cy-h*.38,w*.6,cy+h*.38,w*.76,cy);ctx.stroke();const q=(t*(.08+coupling*.2))%1;simDot(ctx,w*.24+q*w*.52,cy+Math.sin(q*Math.PI)*Math.sin(t)*h*.2,5,'#c49aff',true);simText(ctx,`matter exchanges a gauge quantum · coupling g=${coupling}`,w*.5,h*.9,'#c9d9ed',8,'center');return;
  }
  if(kind==='particle-coupling'){
    const cx=w*.5,cy=h*.5;for(let i=1;i<=7;i++){const r=i*18,opacity=Math.min(.85,(Number(p.n)||5)/12);ctx.strokeStyle=`rgba(196,154,255,${opacity/i})`;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();}simText(ctx,'coupling strength sets interaction probability',w*.5,h*.88,'#c9d9ed',8,'center');return;
  }
  drawGraphScene(ctx,w,h,t,q=>Math.sqrt(.04+q*q*.92),'momentum →','total energy','#ffb47a');
}
function drawMotionSimulation(ctx,w,h,t,kind){
  const floor=h*.72,phase=(t%5)/5,x=w*.14+phase*phase*w*.68;
  ctx.strokeStyle='rgba(114,215,255,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(w*.08,floor+18);ctx.lineTo(w*.92,floor+18);ctx.stroke();
  ctx.strokeStyle='rgba(114,215,255,.3)';ctx.setLineDash([4,7]);ctx.beginPath();ctx.moveTo(w*.14,floor-30);ctx.lineTo(w*.82,floor-30);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='rgba(114,215,255,.9)';ctx.fillRect(x-24,floor-30,48,30);
  ctx.strokeStyle='#dff7ff';ctx.strokeRect(x-24,floor-30,48,30);
  ctx.fillStyle='#ff9b5a';ctx.beginPath();ctx.arc(x-13,floor+5,5,0,Math.PI*2);ctx.arc(x+13,floor+5,5,0,Math.PI*2);ctx.fill();
  simArrow(ctx,x+30,floor-16,Math.min(w*.93,x+105),floor-16,'#ff9b5a',kind==='force'?'F = ma':'a = F/m');
  simArrow(ctx,x+30,floor-49,Math.min(w*.93,x+44+phase*62),floor-49,'#72d7ff','v');
  simText(ctx,'frictionless surface',w*.08,h*.88,'rgba(180,205,240,.55)',10);
  simText(ctx,'force → motion',w*.92,h*.12,'#ffb47a',10,'right');
}
function drawOrbitSimulation(ctx,w,h,t){
  const cx=w*.5,cy=h*.53,r=Math.min(w,h)*.29;
  for(let k=0;k<3;k++){ctx.strokeStyle=`rgba(${114+k*35},${215-k*35},255,${.25-k*.05})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(cx,cy,r*(1+k*.18),r*(.52+k*.1),-.18,0,Math.PI*2);ctx.stroke();}
  const glow=ctx.createRadialGradient(cx,cy,2,cx,cy,42);glow.addColorStop(0,'#fff3b0');glow.addColorStop(.3,'#ff9b5a');glow.addColorStop(1,'rgba(255,100,40,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,42,0,Math.PI*2);ctx.fill();
  const a=t*.75,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.52;
  ctx.fillStyle='#72d7ff';ctx.shadowBlur=18;ctx.shadowColor='#72d7ff';ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  simArrow(ctx,x,y,x+Math.sin(a)*35,y-Math.cos(a)*20,'#c49aff','v');
  simText(ctx,'curved path = continuous fall',w*.5,h*.9,'rgba(200,215,255,.7)',10,'center');
}
function drawGravitySimulation(ctx,w,h,t){
  const cx=w*.5,cy=h*.34,spanX=Math.min(w*.37,h*.82),spanY=Math.min(h*.29,w*.15),depth=h*.3;
  const project=(u,v)=>{const radius=Math.hypot(u,v),well=Math.pow(Math.max(0,1-radius/1.22),2);return[cx+u*spanX,cy+v*spanY+well*depth];};
  const gridLine=(fixed,isVertical)=>{
    ctx.beginPath();
    for(let i=0;i<=48;i++){
      const n=-1.25+i*2.5/48,[x,y]=project(isVertical?fixed:n,isVertical?n:fixed);
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.stroke();
  };
  ctx.lineWidth=1;
  for(let i=-5;i<=5;i++){
    const strength=i===0?'rgba(114,215,255,.32)':'rgba(114,215,255,.2)';
    ctx.strokeStyle=strength;gridLine(i*.22,true);gridLine(i*.22,false);
  }
  ctx.strokeStyle='rgba(196,154,255,.62)';ctx.lineWidth=1.4;ctx.beginPath();
  const orbitR=.48;
  for(let i=0;i<=120;i++){
    const a=i/120*Math.PI*2,[x,y]=project(Math.cos(a)*orbitR,Math.sin(a)*orbitR);
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.stroke();
  const [massX,massY]=project(0,0);
  const glow=ctx.createRadialGradient(massX,massY,1,massX,massY,38);
  glow.addColorStop(0,'rgba(255,220,160,.95)');glow.addColorStop(.22,'rgba(255,155,90,.8)');glow.addColorStop(1,'rgba(255,100,40,0)');
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(massX,massY,38,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#1b1224';ctx.strokeStyle='#ffb47a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(massX,massY,9,0,Math.PI*2);ctx.fill();ctx.stroke();
  const angle=t*.65,[bodyX,bodyY]=project(Math.cos(angle)*orbitR,Math.sin(angle)*orbitR);
  ctx.fillStyle='#72d7ff';ctx.shadowBlur=12;ctx.shadowColor='#72d7ff';ctx.beginPath();ctx.arc(bodyX,bodyY,5.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  simArrow(ctx,bodyX,bodyY,bodyX+(massX-bodyX)*.26,bodyY+(massY-bodyY)*.26,'#ff9b5a','gravity');
  simText(ctx,'curved spacetime guides the orbit',w*.5,h*.9,'rgba(200,215,255,.78)',10,'center');
}
function drawMomentumSimulation(ctx,w,h,t){
  const cx=w*.5,floor=h*.69,cycle=(t%5)/5,approach=cycle<.5,progress=approach?1-cycle*2:(cycle-.5)*2,halfGap=28+progress*w*.27;
  const left=cx-halfGap,right=cx+halfGap,direction=approach?1:-1;
  ctx.strokeStyle='rgba(114,215,255,.32)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(w*.1,floor+18);ctx.lineTo(w*.9,floor+18);ctx.stroke();
  [[left,'#72d7ff'],[right,'#ffb47a']].forEach(([x,color])=>{ctx.fillStyle=color;ctx.fillRect(x-19,floor-34,38,34);ctx.strokeStyle='rgba(245,247,255,.8)';ctx.strokeRect(x-19,floor-34,38,34);});
  simArrow(ctx,left,floor-52,left+direction*42,floor-52,'#72d7ff','p₁');
  simArrow(ctx,right,floor-52,right-direction*42,floor-52,'#ffb47a','p₂');
  simText(ctx,'equal and opposite momenta balance',w*.5,h*.9,'rgba(200,215,255,.75)',10,'center');
}
function drawEnergySimulation(ctx,w,h,t){
  const massX=w*.28,cy=h*.5,r=19+Math.sin(t*1.4)*2;
  const glow=ctx.createRadialGradient(massX,cy,2,massX,cy,55);glow.addColorStop(0,'rgba(255,229,177,.95)');glow.addColorStop(.3,'rgba(255,155,90,.72)');glow.addColorStop(1,'rgba(255,100,40,0)');
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(massX,cy,55,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#21142a';ctx.strokeStyle='#ffb47a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(massX,cy,r,0,Math.PI*2);ctx.fill();ctx.stroke();
  simArrow(ctx,massX+34,cy,w*.59,cy,'#c49aff','equivalent energy');
  for(let i=0;i<4;i++){
    const x=w*.61+((t*54+i*46)%(w*.22)),waveW=w*.1;
    ctx.strokeStyle=`rgba(255,155,90,${.35+i*.12})`;ctx.lineWidth=1.5;ctx.beginPath();
    for(let k=0;k<=28;k++){const px=x+k*waveW/28,py=cy+Math.sin(k*.55-t*3+i)*9;if(k===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();
  }
  simText(ctx,'rest mass can be expressed as energy',w*.5,h*.9,'rgba(255,215,180,.8)',10,'center');
}
function drawExpansionSimulation(ctx,w,h,t){
  const cx=w*.5,cy=h*.5,phase=.62+((t*.075)%1.05),points=[];
  for(let i=0;i<12;i++){
    const a=i*Math.PI*2/12+.12,r=(Math.min(w,h)*(.2+(i%3)*.07))*phase;
    points.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r*.72]);
  }
  ctx.strokeStyle='rgba(114,215,255,.2)';ctx.setLineDash([3,7]);
  points.forEach(([x,y])=>{ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(x,y);ctx.stroke();});ctx.setLineDash([]);
  points.forEach(([x,y],i)=>{ctx.fillStyle=i%3?'#72d7ff':'#ffb47a';ctx.beginPath();ctx.arc(x,y,i%3===0?5:3.5,0,Math.PI*2);ctx.fill();});
  simText(ctx,'separations grow as space expands',w*.5,h*.91,'rgba(200,215,255,.75)',10,'center');
}
function drawCircuitSimulation(ctx,w,h,t){
  const y=h*.51,left=w*.2,right=w*.8,top=h*.22,bottom=h*.8;
  ctx.strokeStyle='rgba(114,215,255,.72)';ctx.lineWidth=2.2;ctx.beginPath();
  ctx.moveTo(left,y);ctx.lineTo(left,top);ctx.lineTo(w*.43,top);ctx.moveTo(w*.57,top);ctx.lineTo(right,top);ctx.lineTo(right,bottom);ctx.lineTo(left,bottom);ctx.lineTo(left,y);ctx.stroke();
  ctx.strokeStyle='#ff9b5a';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(w*.47,top-13);ctx.lineTo(w*.47,top+13);ctx.moveTo(w*.53,top-8);ctx.lineTo(w*.53,top+8);ctx.stroke();
  ctx.strokeStyle='#c49aff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(w*.38,y);ctx.lineTo(w*.42,y-12);ctx.lineTo(w*.46,y+12);ctx.lineTo(w*.5,y-12);ctx.lineTo(w*.54,y+12);ctx.lineTo(w*.58,y);ctx.lineTo(right,y);ctx.stroke();
  const phase=t*42;
  let px=left,py=y;
  const path=[[left,y],[left,top],[w*.43,top],[w*.57,top],[right,top],[right,bottom],[left,bottom],[left,y]];
  const lengths=path.slice(1).map((p,i)=>Math.hypot(p[0]-path[i][0],p[1]-path[i][1]));
  let distance=phase%lengths.reduce((a,b)=>a+b,0);
  for(let i=0;i<lengths.length;i++){
    if(distance<=lengths[i]){const a=path[i],b=path[i+1],f=distance/lengths[i];px=a[0]+(b[0]-a[0])*f;py=a[1]+(b[1]-a[1])*f;break;}
    distance-=lengths[i];
  }
  ctx.fillStyle='#ffcf9a';ctx.shadowBlur=12;ctx.shadowColor='#ff9b5a';ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  simText(ctx,'voltage drives charge around a closed path',w*.5,h*.92,'rgba(200,215,255,.75)',10,'center');
}
function drawThermoSimulation(ctx,w,h,t){
  const x=w*.2,y=h*.2,bw=w*.6,bh=h*.56,temp=.5+.5*Math.sin(t*.8);
  ctx.strokeStyle='rgba(114,215,255,.6)';ctx.lineWidth=2;ctx.strokeRect(x,y,bw,bh);
  for(let i=0;i<28;i++){const px=x+18+((i*47+Math.sin(t*(1+i%3))*20)%Math.max(20,bw-36));const py=y+18+((i*31+Math.cos(t*(1+i%4))*18)%Math.max(20,bh-36));const ang=t*(.7+i%4)+i;ctx.fillStyle=i%3?'#72d7ff':'#ff9b5a';ctx.beginPath();ctx.arc(px,py,3+temp*2,0,Math.PI*2);ctx.fill();simArrow(ctx,px,py,px+Math.cos(ang)*10*(.4+temp),py+Math.sin(ang)*10*(.4+temp),i%3?'rgba(114,215,255,.35)':'rgba(255,155,90,.4)');}
  simArrow(ctx,x+bw*.5,y+bh+35,x+bw*.5,y+bh+4,'#ff9b5a','heat in');
  simText(ctx,'temperature changes particle speed',w*.5,h*.91,'rgba(200,215,255,.7)',10,'center');
}
function drawFieldSimulation(ctx,w,h,t){
  const cx=w*.5,cy=h*.52;
  for(let i=0;i<18;i++){const a=i*Math.PI*2/18, pulse=1+Math.sin(t*2-i*.4)*.08;const r1=24,r2=Math.min(w,h)*.36*pulse;simArrow(ctx,cx+Math.cos(a)*r1,cy+Math.sin(a)*r1,cx+Math.cos(a)*r2,cy+Math.sin(a)*r2,'rgba(255,155,90,.58)');}
  const g=ctx.createRadialGradient(cx,cy,2,cx,cy,28);g.addColorStop(0,'#fff1c2');g.addColorStop(.35,'#ff9b5a');g.addColorStop(1,'rgba(255,155,90,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,28,0,Math.PI*2);ctx.fill();
  simText(ctx,'field strength falls with distance',w*.5,h*.9,'rgba(200,215,255,.7)',10,'center');
}
function drawWaveSimulation(ctx,w,h,t){
  const mid=h*.52,amp=Math.min(50,h*.2),freq=1.5;
  ctx.strokeStyle='#72d7ff';ctx.lineWidth=2.4;ctx.beginPath();
  for(let i=0;i<=w;i++){const y=mid+Math.sin(i/w*Math.PI*5*freq-t*3)*amp;if(i)ctx.lineTo(i,y);else ctx.moveTo(i,y);}ctx.stroke();
  for(let i=0;i<14;i++){const x=(i/14*w+t*45)%w,y=mid+Math.sin(x/w*Math.PI*5*freq-t*3)*amp;ctx.fillStyle='#ff9b5a';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();}
  simText(ctx,'crest spacing × oscillation rate = wave speed',w*.5,h*.9,'rgba(200,215,255,.7)',10,'center');
}
function drawQuantumSimulation(ctx,w,h,t){
  const mid=w*.5,base=h*.77;ctx.strokeStyle='rgba(180,154,255,.35)';ctx.beginPath();ctx.moveTo(28,base);ctx.lineTo(w-28,base);ctx.stroke();
  ctx.strokeStyle='#c49aff';ctx.lineWidth=2.2;ctx.beginPath();
  for(let i=0;i<=w-56;i++){const x=i/(w-56)*Math.PI*5;const y=base-Math.pow(Math.sin(x),2)*(h*.48);if(i)ctx.lineTo(28+i,y);else ctx.moveTo(28+i,y);}ctx.stroke();
  for(let i=0;i<7;i++){const x=45+((t*70+i*97)%(w-90));const y=base-10-Math.pow(Math.sin((x-28)/(w-56)*Math.PI*5),2)*(h*.48);ctx.fillStyle='#72d7ff';ctx.shadowBlur=12;ctx.shadowColor='#72d7ff';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
  simText(ctx,'probability amplitude → detection events',w*.5,h*.91,'rgba(220,205,255,.8)',10,'center');
}
function drawOpticsSimulation(ctx,w,h,t){
  const cx=w*.56,cy=h*.5;ctx.strokeStyle='rgba(200,220,255,.35)';ctx.beginPath();ctx.moveTo(24,cy);ctx.lineTo(w-24,cy);ctx.stroke();
  ctx.strokeStyle='#c49aff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx,cy,11,h*.3,0,0,Math.PI*2);ctx.stroke();
  for(let i=-2;i<=2;i++){const y=cy+i*22;ctx.strokeStyle=i===0?'#ff9b5a':'#72d7ff';ctx.beginPath();ctx.moveTo(28,y-35);ctx.lineTo(cx,cy+i*8);ctx.lineTo(w-28,cy+i*4);ctx.stroke();}
  simText(ctx,'ray direction changes; frequency stays fixed',w*.5,h*.91,'rgba(200,215,255,.7)',10,'center');
}
function drawFluidSimulation(ctx,w,h,t){
  for(let row=0;row<7;row++){const y=35+row*(h-70)/6;ctx.strokeStyle='rgba(114,215,255,.28)';ctx.beginPath();for(let i=0;i<=w;i+=5){const yy=y+Math.sin(i*.025-t*2+row)*11;if(i)ctx.lineTo(i,yy);else ctx.moveTo(i,yy);}ctx.stroke();for(let j=0;j<3;j++){const x=(t*70+j*120+row*35)%w,yy=y+Math.sin(x*.025-t*2+row)*11;ctx.fillStyle='#ff9b5a';ctx.beginPath();ctx.arc(x,yy,3,0,Math.PI*2);ctx.fill();}}
  simText(ctx,'streamlines reveal transport and turbulence',w*.5,h*.91,'rgba(200,215,255,.7)',10,'center');
}
function drawStarSimulation(ctx,w,h,t){
  const cx=w*.5,cy=h*.5,r=Math.min(w,h)*.22*(1+.04*Math.sin(t));
  const g=ctx.createRadialGradient(cx-r*.3,cy-r*.35,2,cx,cy,r*1.2);g.addColorStop(0,'#fff9cf');g.addColorStop(.35,'#ffbd69');g.addColorStop(.72,'#ff6d45');g.addColorStop(1,'rgba(255,70,30,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r*1.2,0,Math.PI*2);ctx.fill();
  for(let i=0;i<5;i++){ctx.strokeStyle=`rgba(255,180,100,${.18-i*.025})`;ctx.beginPath();ctx.arc(cx,cy,r*(1.35+i*.17),0,Math.PI*2);ctx.stroke();}
  simText(ctx,'radius and temperature set luminosity',w*.5,h*.91,'rgba(255,215,170,.8)',10,'center');
}
function drawRelativitySimulation(ctx,w,h,t){
  const y=h*.47,slow=w*.28,fast=w*.68,scale=.65+.15*Math.sin(t);
  ctx.strokeStyle='rgba(114,215,255,.28)';ctx.beginPath();ctx.moveTo(30,y);ctx.lineTo(w-30,y);ctx.stroke();
  [[slow,'rest frame',1],[fast,'moving frame',scale]].forEach(([x,label,s])=>{ctx.strokeStyle='#72d7ff';ctx.strokeRect(x-35*s,y-35,70*s,70);ctx.strokeStyle='#ff9b5a';ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2*s);ctx.stroke();simText(ctx,label,x,y+58,'#b9d8ee',10,'center');});
  simText(ctx,'relative motion changes measured intervals',w*.5,h*.9,'rgba(200,215,255,.7)',10,'center');
}
function drawCosmicSimulation(ctx,w,h,t){
  const cx=w*.5,cy=h*.5;
  for(let i=0;i<90;i++){const a=i*.71+t*(.2+i%3*.03),r=15+(i*17%(Math.min(w,h)*.42));ctx.fillStyle=i%5?'rgba(114,215,255,.5)':'rgba(255,155,90,.75)';ctx.beginPath();ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.55,1+(i%3),0,Math.PI*2);ctx.fill();}
  simText(ctx,'parameters become motion, not typography',w*.5,h*.9,'rgba(200,215,255,.7)',10,'center');
}
function manimAnimate(formula,name,preferred,context){simulationAnimate(formula,name,preferred,context);}
function replayManim(){
  const t=document.getElementById('dp-fml').textContent;
  const n=document.getElementById('dp-title').textContent;
  if(t)simulationAnimate(t,n,_sim2d.kind,_sim2d.meta?.context||{});
}
document.getElementById('manim-replay').addEventListener('click',replayManim);

document.getElementById('mclose').addEventListener('click',()=>{$modal.classList.remove('active');document.body.style.overflow='';$dpanel.classList.remove('open');stopEquationSimulation();});
document.getElementById('dp-close').addEventListener('click',()=>{$dpanel.classList.remove('open');document.querySelectorAll('.eq-card').forEach(c=>c.classList.remove('sel'));stopEquationSimulation();});
$modal.addEventListener('click',e=>{if(e.target===$modal){$modal.classList.remove('active');document.body.style.overflow='';$dpanel.classList.remove('open');stopEquationSimulation();}});

/* ━━━━━━━━━━━━ EQUATION ARCHIVE SEARCH ━━━━━━━━━━━━ */
const $eqOverlay=document.getElementById('eqSearchOverlay');
const $eqInput=document.getElementById('eqSearchInput');
const $eqFilters=document.getElementById('eqSearchFilters');
const $eqResults=document.getElementById('eqSearchResults');
const $eqCount=document.getElementById('eqSearchCount');
const $eqSearchClose=document.getElementById('eqSearchClose');
const eqSearchState={query:'',discipline:'all'};
let equationIndex=[],eqSearchReady=false;

function eqHtml(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}


/* ── 4. EQUATION ARCHIVE SEARCH (refined) ── */
function initEquationSearch(){
  if(eqSearchReady||!$eqOverlay)return;
  equationIndex=[];
  DATA.forEach(d=>d.concepts.forEach(c=>c.eqs.forEach((eq,eqNo)=>{
    equationIndex.push({
      discipline:d,
      concept:c,
      eq,
      eqNo,
      search:[d.title,d.field,d.basic,d.tags.join(' '),c.title,c.desc,eq.f,eq.n,eq.x,eq.d].join(' ').toLocaleLowerCase()
    });
  })));
  const filters=[{id:'all',label:'All disciplines'}].concat(DATA.map(d=>({id:String(d.id),label:d.title})));
  $eqFilters.innerHTML=filters.map(f=>`<button class="eq-filter${f.id===eqSearchState.discipline?' active':''}" type="button" data-discipline="${eqHtml(f.id)}">${eqHtml(f.label)}</button>`).join('');
  $eqFilters.querySelectorAll('.eq-filter').forEach(btn=>btn.addEventListener('click',()=>{
    eqSearchState.discipline=btn.dataset.discipline||'all';
    $eqFilters.querySelectorAll('.eq-filter').forEach(b=>b.classList.toggle('active',b===btn));
    renderEquationSearch();
  }));
  $eqInput.addEventListener('input',()=>{eqSearchState.query=$eqInput.value;renderEquationSearch();});
  $eqSearchClose.addEventListener('click',closeEquationSearch);
  $eqOverlay.addEventListener('click',e=>{if(e.target===$eqOverlay)closeEquationSearch();});
  eqSearchReady=true;
  renderEquationSearch();
}

function renderEquationSearch(){
  if(!eqSearchReady)return;
  const terms=eqSearchState.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if(!terms.length&&eqSearchState.discipline==='all'){
    $eqCount.textContent='Ready to explore';
    $eqResults.innerHTML='<div class="eq-search-welcome"><span class="eq-welcome-symbol">∑</span><h3>Start with a concept</h3><p>Search by name, symbol, or idea, or choose a discipline to browse its equations.</p></div>';
    return;
  }
  const matches=equationIndex.filter(item=>
    (eqSearchState.discipline==='all'||String(item.discipline.id)===eqSearchState.discipline) &&
    terms.every(term=>item.search.includes(term))
  );
  $eqCount.textContent=`${matches.length} result${matches.length===1?'':'s'}`;
  if(!matches.length){
    $eqResults.innerHTML=`<div class="eq-search-empty">No equations found${eqSearchState.query.trim()?` for “${eqHtml(eqSearchState.query.trim())}”`:''}. Try another concept, symbol, or discipline.</div>`;
    return;
  }
  const visibleMatches=matches.slice(0,60);
  const limitNote=matches.length>visibleMatches.length
    ? `<div class="eq-search-limit">Showing the first ${visibleMatches.length} matches. Refine your search to explore all ${matches.length.toLocaleString()} results.</div>`
    : '';
  $eqResults.innerHTML=limitNote+visibleMatches.map(item=>{
    const index=equationIndex.indexOf(item);
    return `<button class="eq-result" type="button" data-index="${index}">
      <div class="eq-result-discipline">${eqHtml(item.discipline.title)} · ${eqHtml(item.concept.title)}</div>
      <div class="eq-result-formula">${eqHtml(item.eq.f)}</div>
      <div class="eq-result-name">${eqHtml(item.eq.n)}</div>
      <div class="eq-result-copy">${eqHtml(item.eq.x)}</div>
    </button>`;
  }).join('');
  $eqResults.querySelectorAll('.eq-result').forEach(card=>card.addEventListener('click',()=>{
    const item=equationIndex[Number(card.dataset.index)];
    if(!item)return;
    closeEquationSearch();
    openModal(item.discipline.id);
    requestAnimationFrame(()=>{
      const target=Array.from(document.querySelectorAll('#mbody .eq-card')).find(eqCard=>
        eqCard.querySelector('.eq-name')?.textContent===item.eq.n &&
        eqCard.querySelector('.eq-formula')?.textContent===item.eq.f
      );
      if(target)showDetail(item.eq.f,item.eq.n,item.eq.x,item.eq.d,target,item.eq.sim||'',item.discipline.title,item.concept.title,JSON.stringify(item.eq.params||{}));
    });
  }));
}

function openEquationSearch(){
  if(!eqSearchReady)initEquationSearch();
  if(!$eqOverlay)return;
  $eqOverlay.classList.add('open');
  $eqOverlay.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  window.setTimeout(()=>{$eqInput.focus();$eqInput.select();},80);
}

function closeEquationSearch(){
  if(!$eqOverlay)return;
  $eqOverlay.classList.remove('open');
  $eqOverlay.setAttribute('aria-hidden','true');
  if(document.activeElement===$eqInput)$eqInput.blur();
  if(!$modal.classList.contains('active')&&VIEW!=='earth')document.body.style.overflow='';
}

document.addEventListener('keydown',e=>{
  const tag=(e.target?.tagName||'').toLowerCase();
  const editing=tag==='input'||tag==='textarea'||e.target?.isContentEditable;
  if(e.key==='Escape'&&$eqOverlay?.classList.contains('open')){closeEquationSearch();return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!editing){e.preventDefault();openEquationSearch();return;}
  if(e.key==='/'&&!editing&&!$eqOverlay?.classList.contains('open')){e.preventDefault();openEquationSearch();}
});