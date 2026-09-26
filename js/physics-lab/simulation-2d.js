/* ━━━ SIMULATION-FIRST 2D ANIMATION ENGINE ━━━
   Draws the small canvas "Simulation Lab" mechanism sketch per equation
   (bodies moving, fields pulsing, gas particles, etc). Called from
   13-physics-modal.js's showDetail() via manimAnimate(). No dependency on
   other modules besides the #manim-canvas/#manim-caption DOM elements. */
let _sim2d={raf:null,canvas:null,ctx:null,t0:0,kind:'cosmic'};
function stopEquationSimulation(){
  if(_sim2d.raf)cancelAnimationFrame(_sim2d.raf);
  _sim2d={raf:null,canvas:null,ctx:null,t0:0,kind:'cosmic'};
}
function simulationKind(name,formula,preferred){
  if(preferred)return preferred;
  const q=(String(name||'')+' '+String(formula||'')).toLowerCase();
  if(/fluid|navier|continuity|reynolds|mhd|alfv|pressure/.test(q))return'fluid';
  if(/orbit|gravity|escape|hubble|density|schwarzschild|friedmann/.test(q))return'orbit';
  if(/relativ|lorentz|time dilation|mass-energy/.test(q))return'relativity';
  if(/quantum|photon|hydrogen|uncertainty|de broglie|schr.dinger|wavefunction/.test(q))return'quantum';
  if(/lens|snell|diffraction|optics/.test(q))return'optics';
  if(/force|newton|momentum|velocity|displacement|projectile|kinematic/.test(q))return'motion';
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
function simulationAnimate(formula,name,preferred){
  const canvas=document.getElementById('manim-canvas'),cap=document.getElementById('manim-caption');
  if(!canvas||!cap)return;
  stopEquationSimulation();
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const kind=simulationKind(name,formula,preferred);
  _sim2d={raf:null,canvas,ctx,t0:performance.now(),kind};
  cap.textContent=`${kind.toUpperCase()} · ${name||'LIVE MODEL'}`;
  cap.classList.add('show');
  const draw=(now)=>{
    if(!_sim2d.canvas)return;
    const t=(now-_sim2d.t0)/1000,{w,h}=simCanvasFrame(canvas,ctx);
    ctx.lineCap='round';ctx.lineJoin='round';
    const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'rgba(30,28,72,.18)');bg.addColorStop(1,'rgba(255,140,66,.03)');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    if(kind==='motion'||kind==='force')drawMotionSimulation(ctx,w,h,t,kind);
    else if(kind==='orbit'||kind==='expanding')drawOrbitSimulation(ctx,w,h,t);
    else if(kind==='thermo'||kind==='gas')drawThermoSimulation(ctx,w,h,t);
    else if(kind==='field'||kind==='circuit')drawFieldSimulation(ctx,w,h,t);
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
function drawMotionSimulation(ctx,w,h,t,kind){
  const floor=h*.72,phase=(t%5)/5,x=w*.14+phase*w*.68;
  ctx.strokeStyle='rgba(114,215,255,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(w*.08,floor+18);ctx.lineTo(w*.92,floor+18);ctx.stroke();
  ctx.strokeStyle='rgba(114,215,255,.3)';ctx.setLineDash([4,7]);ctx.beginPath();ctx.moveTo(w*.14,floor-30);ctx.lineTo(w*.82,floor-30);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='rgba(114,215,255,.9)';ctx.fillRect(x-24,floor-30,48,30);
  ctx.strokeStyle='#dff7ff';ctx.strokeRect(x-24,floor-30,48,30);
  ctx.fillStyle='#ff9b5a';ctx.beginPath();ctx.arc(x-13,floor+5,5,0,Math.PI*2);ctx.arc(x+13,floor+5,5,0,Math.PI*2);ctx.fill();
  simArrow(ctx,x+30,floor-16,x+105,floor-16,'#ff9b5a',kind==='force'?'F = ma':'a = F/m');
  simArrow(ctx,x+30,floor-49,x+82,floor-49,'#72d7ff','v');
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
function manimAnimate(formula,name,preferred){simulationAnimate(formula,name,preferred);}
function replayManim(){
  const t=document.getElementById('dp-fml').textContent;
  const n=document.getElementById('dp-title').textContent;
  if(t)simulationAnimate(t,n);
}
document.getElementById('manim-replay').addEventListener('click',replayManim);