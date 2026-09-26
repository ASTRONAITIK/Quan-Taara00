/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   INTERACTIVE PLOT ENGINE
   Each formula maps (by name) to a definition: { sliders, fn, xLabel, yLabel,
   xRange, yRange, readout }. fn(x, params) -> y. We render axes, grid,
   the curve, and a moving marker. Sliders update the curve live.
   Called by showDetail() in 13-physics-modal.js via renderInteractivePlot().
   _plotState is also read by 16-scene3d.js's _params() helper so the 3D
   scenes react to the same slider values.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const PLOTS={
  // ─── Kinematics ───
  'Velocity-Time Relation':{
    sliders:[{k:'u',lbl:'u (m/s)',min:0,max:50,step:1,val:5},{k:'a',lbl:'a (m/s²)',min:-10,max:10,step:.5,val:2}],
    xLabel:'time t (s)',yLabel:'velocity v (m/s)',xRange:[0,10],
    fn:(t,p)=>p.u+p.a*t,
    readout:p=>`v(5s) = ${(p.u+p.a*5).toFixed(2)} m/s · slope = a = ${p.a} m/s²`
  },
  'Displacement-Time Relation':{
    sliders:[{k:'u',lbl:'u (m/s)',min:0,max:30,step:1,val:5},{k:'a',lbl:'a (m/s²)',min:-5,max:10,step:.5,val:2}],
    xLabel:'time t (s)',yLabel:'displacement s (m)',xRange:[0,10],
    fn:(t,p)=>p.u*t+0.5*p.a*t*t,
    readout:p=>`s(10s) = ${(p.u*10+0.5*p.a*100).toFixed(1)} m`
  },
  'Velocity-Displacement':{
    sliders:[{k:'u',lbl:'u (m/s)',min:0,max:30,step:1,val:5},{k:'a',lbl:'a (m/s²)',min:-2,max:10,step:.5,val:2}],
    xLabel:'displacement s (m)',yLabel:'v² (m²/s²)',xRange:[0,100],
    fn:(s,p)=>p.u*p.u+2*p.a*s,
    readout:p=>`v at s=50m → ${Math.sqrt(Math.max(0,p.u*p.u+2*p.a*50)).toFixed(2)} m/s`
  },
  'Projectile Range':{
    sliders:[{k:'u',lbl:'u (m/s)',min:5,max:60,step:1,val:25},{k:'g',lbl:'g (m/s²)',min:1,max:25,step:.5,val:9.8}],
    xLabel:'launch angle θ (°)',yLabel:'range R (m)',xRange:[0,90],
    fn:(th,p)=>{const r=th*Math.PI/180;return p.u*p.u*Math.sin(2*r)/p.g;},
    readout:p=>`Max range at θ=45° → ${(p.u*p.u/p.g).toFixed(2)} m`
  },
  'Centripetal Acceleration':{
    sliders:[{k:'r',lbl:'radius r (m)',min:.5,max:20,step:.5,val:5}],
    xLabel:'speed v (m/s)',yLabel:'aₒ (m/s²)',xRange:[0,30],
    fn:(v,p)=>v*v/p.r,
    readout:p=>`At v=10 m/s, r=${p.r}m → aₒ = ${(100/p.r).toFixed(2)} m/s²`
  },
  // ─── Newton & Gravitation ───
  "Newton's Second Law":{
    sliders:[{k:'m',lbl:'mass m (kg)',min:.1,max:50,step:.1,val:5}],
    xLabel:'acceleration a (m/s²)',yLabel:'force F (N)',xRange:[0,20],
    fn:(a,p)=>p.m*a,
    readout:p=>`F = m·a → slope = ${p.m} N per m/s²`
  },
  "Newton's Law of Gravitation":{
    sliders:[{k:'m1',lbl:'m₁ (×10²⁴ kg)',min:.1,max:10,step:.1,val:5.97},{k:'m2',lbl:'m₂ (kg)',min:1,max:1e4,step:1,val:1000}],
    xLabel:'distance r (×10⁶ m)',yLabel:'F (N)',xRange:[1,50],
    fn:(r,p)=>{const G=6.674e-11;return G*(p.m1*1e24)*p.m2/Math.pow(r*1e6,2);},
    readout:p=>`Inverse-square law: F drops as 1/r²`
  },
  'Orbital Velocity':{
    sliders:[{k:'M',lbl:'M (×10²⁴ kg)',min:.1,max:2000,step:1,val:5.97}],
    xLabel:'orbit radius r (×10⁶ m)',yLabel:'v (km/s)',xRange:[1,100],
    fn:(r,p)=>{const G=6.674e-11;return Math.sqrt(G*p.M*1e24/(r*1e6))/1000;},
    readout:p=>`vₒ = √(GM/r) — slower at larger orbits`
  },
  'Escape Velocity':{
    sliders:[{k:'M',lbl:'M (×10²⁴ kg)',min:.01,max:2000,step:1,val:5.97}],
    xLabel:'radius R (×10⁶ m)',yLabel:'vₑ (km/s)',xRange:[.5,100],
    fn:(r,p)=>{const G=6.674e-11;return Math.sqrt(2*G*p.M*1e24/(r*1e6))/1000;},
    readout:p=>`Earth surface: vₑ ≈ 11.2 km/s`
  },
  // ─── Thermo ───
  'First Law':{
    sliders:[{k:'dU',lbl:'ΔU (J)',min:-500,max:500,step:10,val:200}],
    xLabel:'work done W (J)',yLabel:'heat ΔQ (J)',xRange:[-500,500],
    fn:(W,p)=>p.dU+W,readout:p=>`ΔQ = ΔU + W (linear in W)`
  },
  'Second Law':{
    sliders:[{k:'k',lbl:'rate (J/K/s)',min:.1,max:5,step:.1,val:1}],
    xLabel:'time t (s)',yLabel:'entropy S (J/K)',xRange:[0,20],
    fn:(t,p)=>p.k*t,readout:p=>`Entropy monotonically increases`
  },
  'Carnot Efficiency':{
    sliders:[{k:'Th',lbl:'Tₕ (K)',min:300,max:2000,step:10,val:800}],
    xLabel:'cold temp Tₒ (K)',yLabel:'efficiency η',xRange:[100,800],
    fn:(Tc,p)=>1-Tc/p.Th,readout:p=>`η → 1 only as Tₒ → 0`
  },
  'Ideal Gas Law':{
    sliders:[{k:'n',lbl:'n (mol)',min:.1,max:5,step:.1,val:1},{k:'T',lbl:'T (K)',min:100,max:1000,step:10,val:300}],
    xLabel:'volume V (L)',yLabel:'pressure P (kPa)',xRange:[1,50],
    fn:(V,p)=>p.n*8.314*p.T/(V/1000)/1000,readout:p=>`PV = nRT — isotherm hyperbola`
  },
  'Average Kinetic Energy':{
    sliders:[],
    xLabel:'temperature T (K)',yLabel:'K̄ (×10⁻²¹ J)',xRange:[0,1000],
    fn:(T)=>(1.5*1.38e-23*T)*1e21,readout:_=>`K̄ ∝ T (Boltzmann constant)`
  },
  'RMS Speed':{
    sliders:[{k:'M',lbl:'M (g/mol)',min:1,max:100,step:1,val:28}],
    xLabel:'temperature T (K)',yLabel:'v_rms (m/s)',xRange:[100,2000],
    fn:(T,p)=>Math.sqrt(3*8.314*T/(p.M/1000)),readout:p=>`Light gases (low M) move fastest`
  },
  // ─── EM ───
  'Gauss (Electric)':{
    sliders:[{k:'Q',lbl:'charge Q (μC)',min:-10,max:10,step:.5,val:5}],
    xLabel:'distance r (m)',yLabel:'E (kV/m)',xRange:[.1,5],
    fn:(r,p)=>(p.Q*1e-6)/(4*Math.PI*8.854e-12*r*r)/1000,readout:p=>`E ∝ 1/r² for point charge`
  },
  'Gauss (Magnetic)':{
    sliders:[],xLabel:'angle θ (°)',yLabel:'∮B·dA',xRange:[0,360],
    fn:_=>0,readout:_=>`Always zero — no magnetic monopoles`
  },
  "Faraday's Law":{
    sliders:[{k:'B0',lbl:'B₀ (T)',min:.1,max:5,step:.1,val:1},{k:'w',lbl:'ω (rad/s)',min:.5,max:10,step:.5,val:2}],
    xLabel:'time t (s)',yLabel:'EMF (V)',xRange:[0,10],
    fn:(t,p)=>p.B0*p.w*Math.cos(p.w*t),readout:p=>`EMF = -dΦ/dt — sinusoidal`
  },
  'Ampere-Maxwell':{
    sliders:[{k:'I',lbl:'current I (A)',min:.1,max:10,step:.1,val:2}],
    xLabel:'distance r (m)',yLabel:'B (μT)',xRange:[.05,2],
    fn:(r,p)=>(4*Math.PI*1e-7*p.I/(2*Math.PI*r))*1e6,readout:p=>`B ∝ 1/r around current-carrying wire`
  },
  'Speed of Light':{
    sliders:[],xLabel:'medium index n',yLabel:'v (×10⁸ m/s)',xRange:[1,3],
    fn:n=>3/n,readout:_=>`In vacuum n=1 → c ≈ 3×10⁸ m/s`
  },
  // ─── Relativity ───
  'Lorentz Factor':{
    sliders:[],xLabel:'v/c',yLabel:'γ',xRange:[0,.99],
    fn:b=>1/Math.sqrt(1-b*b),readout:_=>`γ → ∞ as v → c`
  },
  'Time Dilation':{
    sliders:[{k:'t0',lbl:'Δt₀ (s)',min:.1,max:10,step:.1,val:1}],
    xLabel:'v/c',yLabel:'Δt (s)',xRange:[0,.99],
    fn:(b,p)=>p.t0/Math.sqrt(1-b*b),readout:p=>`Moving clocks tick slower`
  },
  'Length Contraction':{
    sliders:[{k:'L0',lbl:'L₀ (m)',min:.1,max:10,step:.1,val:1}],
    xLabel:'v/c',yLabel:'L (m)',xRange:[0,.99],
    fn:(b,p)=>p.L0*Math.sqrt(1-b*b),readout:p=>`L → 0 as v → c`
  },
  'Total Energy':{
    sliders:[{k:'m',lbl:'m (kg)',min:.001,max:10,step:.01,val:1}],
    xLabel:'v/c',yLabel:'E (×10¹⁶ J)',xRange:[0,.99],
    fn:(b,p)=>p.m*9e16/Math.sqrt(1-b*b)/1e16,readout:p=>`E = γmc² — diverges at v=c`
  },
  'Energy-Momentum Relation':{
    sliders:[{k:'m',lbl:'m (kg)',min:0,max:5,step:.1,val:1}],
    xLabel:'momentum p (kg·m/s ×10⁸)',yLabel:'E (×10¹⁶ J)',xRange:[0,10],
    fn:(p_,p)=>Math.sqrt((p_*1e8*3e8)**2+(p.m*9e16)**2)/1e16,readout:p=>`Photon (m=0): E = pc`
  },
  // ─── GR / Cosmology ───
  'Einstein Field Equations':{
    sliders:[{k:'T',lbl:'Tμν (×10⁻²⁰)',min:0,max:10,step:.1,val:1}],
    xLabel:'energy density (×10⁻²⁰)',yLabel:'curvature G',xRange:[0,10],
    fn:(T)=>(8*Math.PI*6.674e-11/Math.pow(3e8,4))*T*1e-20*1e44,readout:_=>`Curvature ∝ stress-energy`
  },
  'Schwarzschild Metric':{
    sliders:[{k:'M',lbl:'M (M☉)',min:.1,max:10,step:.1,val:1}],
    xLabel:'r / r_s',yLabel:'gₜₜ',xRange:[1.01,10],
    fn:(r,p)=>1-1/r,readout:p=>`Event horizon at r = r_s = 2GM/c²`
  },
  'Gravitational Time Dilation':{
    sliders:[{k:'M',lbl:'M (M☉)',min:.1,max:10,step:.1,val:1}],
    xLabel:'r / r_s',yLabel:'t / t₀',xRange:[1.01,20],
    fn:(r,p)=>1/Math.sqrt(1-1/r),readout:p=>`Clocks slow near massive bodies`
  },
  'Friedmann Equation':{
    sliders:[{k:'rho',lbl:'ρ (×10⁻²⁷)',min:0,max:20,step:.5,val:9.5},{k:'L',lbl:'Λ (×10⁻³⁵)',min:0,max:5,step:.1,val:1.1}],
    xLabel:'scale factor a',yLabel:'H (km/s/Mpc)',xRange:[.1,3],
    fn:(a,p)=>{const t=(8*Math.PI*6.674e-11/3)*p.rho*1e-27/Math.pow(a,3)+p.L*1e-35/3;return Math.sqrt(Math.max(0,t))*3.086e19;},
    readout:p=>`Λ-dominated era → exponential expansion`
  },
  // ─── Quantum ───
  'Schrödinger Equation':{
    sliders:[{k:'n',lbl:'quantum n',min:1,max:5,step:1,val:1},{k:'L',lbl:'box L (nm)',min:.1,max:5,step:.1,val:1}],
    xLabel:'position x/L',yLabel:'ψ(x)',xRange:[0,1],
    fn:(x,p)=>Math.sqrt(2)*Math.sin(p.n*Math.PI*x),readout:p=>`Particle in a box: n nodes inside`
  },
  'Uncertainty Principle':{
    sliders:[],xLabel:'Δx (×10⁻¹⁰ m)',yLabel:'min Δp (×10⁻²⁵ kg·m/s)',xRange:[.1,10],
    fn:dx=>(1.0546e-34/2/(dx*1e-10))*1e25,readout:_=>`Δx · Δp ≥ ℏ/2 — hyperbolic bound`
  },
  'Hydrogen Energy Levels':{
    sliders:[],xLabel:'principal quantum n',yLabel:'Eₙ (eV)',xRange:[1,10],
    fn:n=>-13.6/(n*n),readout:_=>`Bound states: Eₙ < 0, → 0 as n → ∞`
  },
  'Expectation Value':{
    sliders:[{k:'n',lbl:'state n',min:1,max:5,step:1,val:1}],
    xLabel:'position x/L',yLabel:'|ψ|²',xRange:[0,1],
    fn:(x,p)=>2*Math.pow(Math.sin(p.n*Math.PI*x),2),readout:p=>`⟨x⟩ = L/2 by symmetry`
  },
  // ─── Astro ───
  'Hydrostatic Equilibrium':{
    sliders:[{k:'rho',lbl:'ρ (kg/m³)',min:100,max:1e5,step:100,val:1410},{k:'M',lbl:'M (M☉)',min:.1,max:50,step:.1,val:1}],
    xLabel:'radius r (R☉)',yLabel:'|dP/dr| (Pa/m)',xRange:[.1,2],
    fn:(r,p)=>{const G=6.674e-11,Rs=6.96e8,Ms=1.989e30;return G*p.rho*p.M*Ms/Math.pow(r*Rs,2);},
    readout:p=>`Pressure gradient balances gravity inward`
  },
  'Stefan-Boltzmann Law':{
    sliders:[{k:'R',lbl:'R (R☉)',min:.1,max:100,step:.1,val:1}],
    xLabel:'temperature T (K)',yLabel:'L (L☉)',xRange:[2000,30000],
    fn:(T,p)=>{const Rs=6.96e8,Ls=3.828e26;return 4*Math.PI*Math.pow(p.R*Rs,2)*5.67e-8*Math.pow(T,4)/Ls;},
    readout:p=>`L ∝ T⁴ — small T jump → huge L jump`
  },
  'TOV Equation':{
    sliders:[{k:'M',lbl:'M (M☉)',min:.5,max:3,step:.05,val:1.4}],
    xLabel:'r / r_s',yLabel:'GR/Newtonian ratio',xRange:[1.5,20],
    fn:(r,p)=>1+1/(2*r-1),readout:p=>`GR correction grows near r_s`
  },
  // ─── Cosmology ───
  'Hubble Parameter':{
    sliders:[{k:'H0',lbl:'H₀ (km/s/Mpc)',min:60,max:80,step:.5,val:70}],
    xLabel:'distance d (Mpc)',yLabel:'recession v (km/s)',xRange:[0,500],
    fn:(d,p)=>p.H0*d,readout:p=>`Linear v=H₀d for nearby galaxies`
  },
  'Critical Density':{
    sliders:[],xLabel:'H (km/s/Mpc)',yLabel:'ρ_crit (×10⁻²⁷ kg/m³)',xRange:[40,100],
    fn:H=>{const Hsi=H*1000/3.086e22;return 3*Hsi*Hsi/(8*Math.PI*6.674e-11)*1e27;},
    readout:_=>`Defines flat universe boundary`
  },
  'CMB Temperature Scaling':{
    sliders:[{k:'T0',lbl:'T₀ today (K)',min:1,max:10,step:.1,val:2.725}],
    xLabel:'scale factor a',yLabel:'T (K)',xRange:[.001,1],
    fn:(a,p)=>p.T0/a,readout:p=>`Hot early universe (small a) → cool today`
  },
  // ─── GW ───
  'Gravitational Wave Strain':{
    sliders:[{k:'L',lbl:'arm L (km)',min:.1,max:10,step:.1,val:4}],
    xLabel:'time t (ms)',yLabel:'h (×10⁻²¹)',xRange:[0,200],
    fn:(t,p)=>Math.sin(2*Math.PI*t/40)*Math.exp(-t/100),readout:p=>`Chirp + ringdown waveform`
  },
  'Chirp Mass':{
    sliders:[{k:'m1',lbl:'m₁ (M☉)',min:1,max:50,step:.5,val:30}],
    xLabel:'m₂ (M☉)',yLabel:'ℳ (M☉)',xRange:[1,50],
    fn:(m2,p)=>Math.pow(p.m1*m2,3/5)/Math.pow(p.m1+m2,1/5),readout:p=>`Symmetric: max when m₁=m₂`
  },
  'Peters Formula':{
    sliders:[{k:'m1',lbl:'m₁ (M☉)',min:1,max:50,step:.5,val:30},{k:'m2',lbl:'m₂ (M☉)',min:1,max:50,step:.5,val:30}],
    xLabel:'separation r (×10⁶ m)',yLabel:'log₁₀ |P_GW| (W)',xRange:[1,100],
    fn:(r,p)=>{const G=6.674e-11,c=3e8,Ms=1.989e30,m1=p.m1*Ms,m2=p.m2*Ms;const P=32*Math.pow(G,4)*m1*m1*m2*m2*(m1+m2)/(5*Math.pow(c,5)*Math.pow(r*1e6,5));return Math.log10(P);},
    readout:p=>`Power scales as 1/r⁵ — orbital decay accelerates`
  },
  // ─── Plasma ───
  'MHD Momentum Equation':{
    sliders:[{k:'B',lbl:'B (T)',min:.001,max:1,step:.001,val:.01}],
    xLabel:'current J (A/m²)',yLabel:'J×B force (N/m³)',xRange:[0,1e6],
    fn:(J,p)=>J*p.B,readout:p=>`Lorentz force drives plasma motion`
  },
  'Alfvén Speed':{
    sliders:[{k:'rho',lbl:'ρ (kg/m³)',min:1e-12,max:1e-6,step:1e-9,val:1e-9}],
    xLabel:'B (T)',yLabel:'v_A (km/s)',xRange:[.001,.1],
    fn:(B,p)=>B/Math.sqrt(4*Math.PI*1e-7*p.rho)/1000,readout:p=>`Higher B or lower ρ → faster waves`
  },
  'Plasma Frequency':{
    sliders:[],xLabel:'electron density n (×10¹² m⁻³)',yLabel:'ω_pe (MHz)',xRange:[.01,100],
    fn:n=>Math.sqrt(n*1e12*Math.pow(1.6e-19,2)/(9.11e-31*8.854e-12))/(2*Math.PI*1e6),
    readout:_=>`Below ω_pe, EM waves reflect (ionosphere)`
  }
};

let _plotState=null;
function renderInteractivePlot(formula,name){
  const sec=document.getElementById('dp-plot-sec');
  const svg=document.getElementById('plot-svg');
  const ctrls=document.getElementById('plot-controls');
  const ro=document.getElementById('plot-readout');
  const def=PLOTS[name];
  if(!def){
    sec.style.display='none';
    return;
  }
  sec.style.display='';
  // Build slider UI
  ctrls.innerHTML='';
  const params={};
  def.sliders.forEach(s=>{
    params[s.k]=s.val;
    const wrap=document.createElement('div');
    wrap.className='plot-slider';
    wrap.innerHTML=`<div class="plot-slider-hdr"><span class="plot-slider-lbl">${s.lbl}</span><span class="plot-slider-val" id="psv-${s.k}">${s.val}</span></div><input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.val}">`;
    const inp=wrap.querySelector('input');
    inp.addEventListener('input',()=>{
      params[s.k]=parseFloat(inp.value);
      document.getElementById('psv-'+s.k).textContent=parseFloat(inp.value).toFixed(s.step<1?2:0);
      drawPlot(def,params);
    });
    ctrls.appendChild(wrap);
  });
  if(def.sliders.length===0){
    ctrls.innerHTML='<div class="plot-empty">Static relation — no parameters to vary</div>';
  }
  _plotState={def,params};
  drawPlot(def,params);
}

function drawPlot(def,params){
  const svg=document.getElementById('plot-svg');
  const ro=document.getElementById('plot-readout');
  const W=800,H=360,PAD={l:60,r:30,t:24,b:48};
  const plotW=W-PAD.l-PAD.r,plotH=H-PAD.t-PAD.b;
  // Sample
  const N=180;
  const [x0,x1]=def.xRange;
  const xs=[],ys=[];
  for(let i=0;i<=N;i++){
    const x=x0+(x1-x0)*i/N;
    let y;try{y=def.fn(x,params);}catch(e){y=NaN;}
    if(!isFinite(y))y=NaN;
    xs.push(x);ys.push(y);
  }
  const finiteY=ys.filter(v=>isFinite(v));
  let yMin=Math.min(...finiteY),yMax=Math.max(...finiteY);
  if(yMin===yMax){yMin-=1;yMax+=1;}
  const ypad=(yMax-yMin)*0.1;yMin-=ypad;yMax+=ypad;
  if(yMin>0&&yMin<(yMax-yMin)*0.3)yMin=0;
  const sx=v=>PAD.l+((v-x0)/(x1-x0))*plotW;
  const sy=v=>PAD.t+plotH-((v-yMin)/(yMax-yMin))*plotH;

  // Build SVG
  let html=`<defs><linearGradient id="plotGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff8c42" stop-opacity=".6"/><stop offset="100%" stop-color="#ff8c42" stop-opacity="0"/></linearGradient></defs>`;
  // Grid + axes ticks
  const xt=5,yt=5;
  for(let i=0;i<=xt;i++){
    const v=x0+(x1-x0)*i/xt,xp=sx(v);
    html+=`<line class="gridln" x1="${xp}" y1="${PAD.t}" x2="${xp}" y2="${H-PAD.b}"/>`;
    html+=`<text class="gridtxt" x="${xp}" y="${H-PAD.b+14}" text-anchor="middle">${fmt(v)}</text>`;
  }
  for(let i=0;i<=yt;i++){
    const v=yMin+(yMax-yMin)*i/yt,yp=sy(v);
    html+=`<line class="gridln" x1="${PAD.l}" y1="${yp}" x2="${W-PAD.r}" y2="${yp}"/>`;
    html+=`<text class="gridtxt" x="${PAD.l-6}" y="${yp+3}" text-anchor="end">${fmt(v)}</text>`;
  }
  // Axes
  html+=`<line class="ax" x1="${PAD.l}" y1="${H-PAD.b}" x2="${W-PAD.r}" y2="${H-PAD.b}"/>`;
  html+=`<line class="ax" x1="${PAD.l}" y1="${PAD.t}" x2="${PAD.l}" y2="${H-PAD.b}"/>`;
  // Labels
  html+=`<text class="axlabel" x="${PAD.l+plotW/2}" y="${H-8}" text-anchor="middle">${def.xLabel}</text>`;
  html+=`<text class="axlabel" x="${-(PAD.t+plotH/2)}" y="14" text-anchor="middle" transform="rotate(-90)">${def.yLabel}</text>`;
  // Curve path
  let path='',fill='';
  let started=false;
  for(let i=0;i<=N;i++){
    if(!isFinite(ys[i])){started=false;continue;}
    const px=sx(xs[i]),py=sy(ys[i]);
    path+=(started?' L ':'M ')+px.toFixed(1)+' '+py.toFixed(1);
    started=true;
  }
  // Fill area
  const baseY=sy(Math.max(yMin,Math.min(0,yMax)));
  if(path){
    const firstX=sx(xs[0]),lastX=sx(xs[N]);
    fill=`M ${firstX} ${baseY} `+path.slice(2)+` L ${lastX} ${baseY} Z`;
  }
  html+=`<path class="curve-fill" d="${fill}"/>`;
  html+=`<path class="curve" d="${path}"/>`;
  // Marker at midpoint
  const mid=Math.floor(N/2);
  if(isFinite(ys[mid])){
    html+=`<circle class="marker" cx="${sx(xs[mid])}" cy="${sy(ys[mid])}" r="4.5"/>`;
    html+=`<text class="marker-txt" x="${sx(xs[mid])+10}" y="${sy(ys[mid])-8}">(${fmt(xs[mid])}, ${fmt(ys[mid])})</text>`;
  }
  svg.innerHTML=html;
  ro.innerHTML=`<b>↳</b> ${def.readout(params)}`;
}
function fmt(v){
  const a=Math.abs(v);
  if(a===0)return '0';
  if(a<.01||a>=10000)return v.toExponential(1);
  if(a<1)return v.toFixed(3);
  if(a<100)return v.toFixed(2);
  return v.toFixed(0);
}