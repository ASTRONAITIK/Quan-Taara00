/* ━━━━━━━━━━━━ CURSOR ━━━━━━━━━━━━ */
const $dot=document.getElementById('cur-dot'),
      $ring=document.getElementById('cur-ring');
let _mx=0,_my=0,_rx=0,_ry=0;
document.addEventListener('mousemove',e=>{_mx=e.clientX;_my=e.clientY;$dot.style.left=_mx+'px';$dot.style.top=_my+'px';});
(function cl(){_rx+=(_mx-_rx)*.13;_ry+=(_my-_ry)*.13;$ring.style.left=_rx+'px';$ring.style.top=_ry+'px';requestAnimationFrame(cl)})();
function addHov(el){el.addEventListener('mouseenter',()=>document.body.classList.add('hov'));el.addEventListener('mouseleave',()=>document.body.classList.remove('hov'));}

/* ━━━━━━━━━━━━ VIEW ROUTER ━━━━━━━━━━━━ */
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

/* ━━━━━━━━━━━━ BLACK HOLE BG ━━━━━━━━━━━━ */
(function BH(){
  const cv=document.getElementById('bg-cv');
  const W=window.innerWidth,H=window.innerHeight;
  const rdr=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
  rdr.setPixelRatio(Math.min(devicePixelRatio,2));rdr.setSize(W,H);rdr.setClearColor(0x050308,1);
  const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(60,W/H,.1,4000);
  const _ar=W/H;const _zBase=540;const _z=_ar>1.4?_zBase*Math.min(1.55,_ar/1.4):_zBase;cam.position.set(0,70,_z);cam.lookAt(30,-10,0);
  const mkP=(n,fn,sz,op)=>{
    const g=new THREE.BufferGeometry(),p=new Float32Array(n*3),c=new Float32Array(n*3);
    for(let i=0;i<n;i++)fn(i,p,c);
    g.setAttribute('position',new THREE.BufferAttribute(p,3));
    g.setAttribute('color',new THREE.BufferAttribute(c,3));
    return new THREE.Points(g,new THREE.PointsMaterial({size:sz,vertexColors:true,transparent:true,opacity:op,blending:THREE.AdditiveBlending,sizeAttenuation:true}));
  };
  const stars=mkP(5200,(i,p,c)=>{
    p[i*3]=(Math.random()-.5)*3200;p[i*3+1]=(Math.random()-.5)*2000;p[i*3+2]=(Math.random()-.5)*2000;
    const tint=Math.random();c[i*3]=.58+tint*.42;c[i*3+1]=.68+tint*.28;c[i*3+2]=1;
  },.85,.82);
  sc.add(stars);
  const bh=new THREE.Mesh(new THREE.SphereGeometry(46,64,64),new THREE.MeshBasicMaterial({color:0}));sc.add(bh);
  const ph=new THREE.Mesh(new THREE.TorusGeometry(52,1.2,16,160),new THREE.MeshBasicMaterial({color:0xfff8e0,transparent:true,opacity:.88,blending:THREE.AdditiveBlending}));
  ph.rotation.x=Math.PI*.5;sc.add(ph);
  for(let i=0;i<4;i++){const lt=new THREE.Mesh(new THREE.TorusGeometry(54+i*2.5,.36-i*.06,8,180),new THREE.MeshBasicMaterial({color:0xffe8a0,transparent:true,opacity:.11-i*.022,blending:THREE.AdditiveBlending}));lt.rotation.x=Math.PI*.5+i*.04;sc.add(lt);}
  const dg=new THREE.Group();dg.rotation.x=.4;sc.add(dg);
  const rd=[{m:56,x:78,s:.019,n:2200,r:1,g:.97,b:.88,op:.85,sz:1.6},{m:78,x:108,s:.013,n:2600,r:1,g:.70,b:.22,op:.75,sz:1.3},{m:108,x:148,s:.009,n:2800,r:1,g:.40,b:.07,op:.65,sz:1.2},{m:148,x:200,s:.005,n:2200,r:.8,g:.15,b:.04,op:.5,sz:1.0}];
  const dr=[];
  rd.forEach(d=>{
    const pts=mkP(d.n,(i,p,c)=>{
      const th=Math.random()*Math.PI*2,r=d.m+Math.pow(Math.random(),.7)*(d.x-d.m),y=3.5*Math.exp(-(r-56)/100)+.8;
      p[i*3]=Math.cos(th)*r;p[i*3+1]=(Math.random()-.5)*y;p[i*3+2]=Math.sin(th)*r;
      const dp=.72+.28*Math.sin(th);c[i*3]=d.r*dp;c[i*3+1]=d.g*dp;c[i*3+2]=d.b*dp;
    },d.sz,d.op);
    pts.userData.s=d.s;dg.add(pts);dr.push(pts);
  });
  const ig=mkP(1000,(i,p,c)=>{const t=Math.random()*Math.PI*2,r=47+Math.random()*11;p[i*3]=Math.cos(t)*r;p[i*3+1]=(Math.random()-.5)*2;p[i*3+2]=Math.sin(t)*r;c[i*3]=1;c[i*3+1]=.95;c[i*3+2]=.82;},3.8,.6);dg.add(ig);
  const mkJ=up=>mkP(1600,(i,p,c)=>{const h=55+Math.random()*340,sp=.022+(h-55)/340*.06,phi=Math.random()*Math.PI*2,r=h*Math.tan(sp)*Math.random(),t=h/400;p[i*3]=Math.cos(phi)*r;p[i*3+1]=up?h:-h;p[i*3+2]=Math.sin(phi)*r;c[i*3]=.08+t*.1;c[i*3+1]=.5+(1-t)*.35;c[i*3+2]=1;},2.4,.32);
  const ju=mkJ(true),jd=mkJ(false);sc.add(ju);sc.add(jd);
  dr.forEach(r=>{r.material.userData0=r.material.opacity;});
  const lens=new THREE.Mesh(new THREE.RingGeometry(47,150,128,1),new THREE.MeshBasicMaterial({color:0xffb066,transparent:true,opacity:.12,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false}));
  lens.rotation.x=Math.PI*.5-.32;sc.add(lens);
  const flare=new THREE.Mesh(new THREE.TorusGeometry(57,2.4,10,180),new THREE.MeshBasicMaterial({color:0xffc27d,transparent:true,opacity:.18,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false}));
  flare.rotation.x=Math.PI*.5-.26;sc.add(flare);
  const streakPos=new Float32Array(240*6);
  for(let i=0;i<240;i++){
    const a=Math.random()*Math.PI*2,r=63+Math.random()*76,len=4+Math.random()*18;
    const x=Math.cos(a)*r,z=Math.sin(a)*r;
    streakPos[i*6]=x;streakPos[i*6+1]=(Math.random()-.5)*2;streakPos[i*6+2]=z;
    streakPos[i*6+3]=Math.cos(a)* (r+len);streakPos[i*6+4]=(Math.random()-.5)*2;streakPos[i*6+5]=Math.sin(a)*(r+len);
  }
  const streakGeo=new THREE.BufferGeometry();streakGeo.setAttribute('position',new THREE.BufferAttribute(streakPos,3));
  const streaks=new THREE.LineSegments(streakGeo,new THREE.LineBasicMaterial({color:0xffb066,transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false}));
  streaks.rotation.x=Math.PI*.5-.31;sc.add(streaks);
  const hotRing=mkP(680,(i,p,c)=>{
    const a=Math.random()*Math.PI*2,r=48+Math.random()*8;
    p[i*3]=Math.cos(a)*r;p[i*3+1]=(Math.random()-.5)*1.4;p[i*3+2]=Math.sin(a)*r;
    const hot=.62+.38*Math.sin(a+Math.PI*.25);c[i*3]=1;c[i*3+1]=.28+hot*.56;c[i*3+2]=.06+hot*.24;
  },2.5,.52);
  sc.add(hotRing);
  const halo=new THREE.Mesh(new THREE.SphereGeometry(49.5,48,48),new THREE.MeshBasicMaterial({color:0xff9a4a,transparent:true,opacity:.08,blending:THREE.AdditiveBlending,side:THREE.BackSide,depthWrite:false}));sc.add(halo);
  let cmx=0,cmy=0,crx=0,cry=0;
  document.addEventListener('mousemove',e=>{if(VIEW!=='main')return;cmx=(e.clientX-W/2)*.00032;cmy=(e.clientY-H/2)*.00032;});
  function bhLoop(){
    if(VIEW!=='main'){requestAnimationFrame(bhLoop);return;}
    const t=Date.now()*.001;
    crx+=(cmy-crx)*.006;cry+=(cmx-cry)*.006;
    cam.rotation.x=crx;cam.rotation.y=cry;
    dr.forEach((r,i)=>{r.rotation.y+=r.userData.s*(1+Math.sin(t*.21+i)*.13);r.material.opacity=r.material.userData0*(0.86+Math.sin(t*.7+i*1.3)*.14);});
    stars.rotation.y-=.00011;stars.material.opacity=.62+Math.sin(t*1.8)*.12;
    ig.rotation.y+=.028;ig.material.opacity=.45+Math.abs(Math.sin(t*1.7))*.35;
    const jp=.25+Math.abs(Math.sin(t*.38))*.13;ju.material.opacity=jp;jd.material.opacity=jp;
    ju.rotation.y+=.0016;jd.rotation.y-=.0016;
    ph.material.opacity=.62+Math.sin(t*1.1)*.24;ph.scale.setScalar(1+Math.sin(t*.55)*.012);
    lens.material.opacity=.10+Math.abs(Math.sin(t*.42))*.07;lens.scale.setScalar(1+Math.sin(t*.33)*.02);
    lens.rotation.z+=.0009;
    flare.rotation.z-=.0025;flare.material.opacity=.13+Math.abs(Math.sin(t*1.35))*.13;flare.scale.setScalar(1+Math.sin(t*.8)*.025);
    streaks.rotation.z+=.004;streaks.material.opacity=.09+Math.abs(Math.sin(t*.9))*.16;
    hotRing.rotation.y+=.022;hotRing.material.opacity=.38+Math.abs(Math.sin(t*1.45))*.25;
    halo.material.opacity=.05+Math.abs(Math.sin(t*.52))*.08;
    dg.rotation.z=Math.sin(t*.12)*.03;
    rdr.render(sc,cam);requestAnimationFrame(bhLoop);
  }
  bhLoop();
  window.addEventListener('resize',()=>{const aw=innerWidth,ah=innerHeight,ar=aw/ah;cam.aspect=ar;const z=ar>1.4?_zBase*Math.min(1.55,ar/1.4):_zBase;cam.position.z=z;cam.updateProjectionMatrix();rdr.setSize(aw,ah);});
})();

/* ━━━━━━━━━━━━ EARTH GLOBE ━━━━━━━━━━━━ */
let gScene,gCam,gRdr,earthGrp,earthMesh,cloudMesh;
let gRunning=false,gRafId=null;
let gRotY=0,gRotX=0,gDrag=false;
let gVelY=0,gVelX=0;
const AUTO_SPIN=0.00055;
let gTargZ=2.5,gCurZ=2.5;
let gLastDrag=0;
const eoMarkers=[];
let gInited=false;

/* Procedural Earth canvas texture — detailed fallback, no CORS required */
function makeProceduralEarth(){
  const W=1536,H=768,cv=document.createElement('canvas');
  cv.width=W;cv.height=H;
  const ctx=cv.getContext('2d');
  const ocean=ctx.createLinearGradient(0,0,0,H);
  ocean.addColorStop(0,'#06172d');ocean.addColorStop(.22,'#0b3154');ocean.addColorStop(.5,'#0b4b70');ocean.addColorStop(.78,'#092c50');ocean.addColorStop(1,'#040f25');
  ctx.fillStyle=ocean;ctx.fillRect(0,0,W,H);
  const oceanGlow=ctx.createRadialGradient(W*.56,H*.43,0,W*.56,H*.43,W*.7);
  oceanGlow.addColorStop(0,'rgba(50,178,211,.18)');oceanGlow.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=oceanGlow;ctx.fillRect(0,0,W,H);
  const land=[
    {tone:'#2d7b57',pts:[[.035,.22],[.08,.15],[.14,.16],[.2,.24],[.19,.31],[.14,.33],[.12,.42],[.08,.46],[.055,.39],[.09,.32],[.035,.29]]},
    {tone:'#1f674d',pts:[[.19,.43],[.24,.45],[.27,.55],[.25,.67],[.21,.76],[.185,.66],[.18,.56]]},
    {tone:'#416f57',pts:[[.39,.2],[.45,.17],[.5,.21],[.51,.29],[.47,.32],[.43,.29],[.4,.34],[.36,.3]]},
    {tone:'#3d7955',pts:[[.45,.32],[.53,.3],[.58,.38],[.56,.5],[.51,.59],[.46,.61],[.42,.53],[.43,.43]]},
    {tone:'#4c805b',pts:[[.49,.17],[.58,.13],[.67,.16],[.75,.2],[.81,.28],[.78,.36],[.69,.34],[.63,.4],[.56,.34],[.51,.28]]},
    {tone:'#2e6d52',pts:[[.7,.48],[.75,.5],[.78,.57],[.75,.63],[.69,.61],[.67,.55]]},
    {tone:'#4c895f',pts:[[.77,.67],[.84,.64],[.88,.69],[.86,.76],[.78,.75],[.74,.7]]},
    {tone:'#527b62',pts:[[.17,.08],[.23,.06],[.25,.12],[.2,.17],[.16,.14]]},
    {tone:'#476f59',pts:[[.29,.42],[.32,.44],[.31,.49],[.28,.48]]},
    {tone:'#376f58',pts:[[.55,.6],[.59,.62],[.61,.67],[.59,.7],[.55,.66]]}
  ];
  const drawLand=(shape)=>{
    ctx.beginPath();
    shape.pts.forEach((p,i)=>{const x=p[0]*W,y=p[1]*H;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
    ctx.closePath();ctx.fillStyle=shape.tone;ctx.fill();
    ctx.strokeStyle='rgba(132,235,171,.32)';ctx.lineWidth=1.25;ctx.stroke();
  };
  land.forEach(drawLand);
  /* Terrain bands make the globe read as a living planet rather than flat blobs. */
  ctx.save();ctx.globalAlpha=.2;ctx.globalCompositeOperation='source-atop';
  land.forEach((shape,index)=>{
    ctx.strokeStyle=index%2?'#c6d875':'#8bcf8c';ctx.lineWidth=3;
    for(let k=0;k<3;k++){
      ctx.beginPath();
      shape.pts.forEach((p,i)=>{const x=(p[0]+.008*k)*W,y=(p[1]+.012*k)*H;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
      ctx.stroke();
    }
  });
  ctx.restore();
  /* Ice shelves and polar glow */
  const ice=ctx.createLinearGradient(0,0,0,H);
  ice.addColorStop(0,'rgba(222,249,255,.92)');ice.addColorStop(.09,'rgba(182,235,248,.18)');ice.addColorStop(.91,'rgba(182,235,248,.08)');ice.addColorStop(1,'rgba(222,249,255,.86)');
  ctx.fillStyle=ice;ctx.fillRect(0,0,W,34);ctx.fillRect(0,H-30,W,30);
  ctx.fillStyle='rgba(212,246,255,.86)';ctx.beginPath();ctx.ellipse(.5*W,.93*H,.36*W,.035*H,0,0,Math.PI*2);ctx.fill();
  /* High-resolution graticule and depth shimmer */
  ctx.strokeStyle='rgba(119,213,255,.09)';ctx.lineWidth=1;
  for(let y=H/16;y<H;y+=H/16){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  for(let x=0;x<W;x+=W/24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let i=0;i<180;i++){
    const x=Math.random()*W,y=H*.15+Math.random()*H*.7;
    ctx.fillStyle=`rgba(149,226,255,${.025+Math.random()*.04})`;ctx.fillRect(x,y,1+Math.random()*3,1+Math.random()*2);
  }
  return new THREE.CanvasTexture(cv);
}

function makeProceduralNightTexture(){
  const W=1536,H=768,cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const ctx=cv.getContext('2d');ctx.clearRect(0,0,W,H);
  const cities=[
    [.105,.3],[.14,.35],[.18,.29],[.205,.42],[.22,.48],[.24,.56],[.27,.59],
    [.44,.29],[.47,.34],[.5,.38],[.53,.3],[.58,.27],[.62,.3],[.67,.32],[.71,.29],
    [.75,.39],[.79,.5],[.81,.58],[.84,.68],[.74,.7],[.58,.55],[.48,.48]
  ];
  cities.forEach(([x,y],i)=>{
    const r=ctx.createRadialGradient(x*W,y*H,0,x*W,y*H,8+i%4*3);
    r.addColorStop(0,'rgba(255,201,123,.95)');r.addColorStop(.2,'rgba(255,129,76,.6)');r.addColorStop(1,'rgba(255,90,48,0)');
    ctx.fillStyle=r;ctx.beginPath();ctx.arc(x*W,y*H,10+i%4*3,0,Math.PI*2);ctx.fill();
  });
  return new THREE.CanvasTexture(cv);
}

function makeCloudTexture(){
  const W=1024,H=512,cv=document.createElement('canvas');
  cv.width=W;cv.height=H;
  const ctx=cv.getContext('2d');ctx.clearRect(0,0,W,H);
  for(let i=0;i<260;i++){
    const x=Math.random()*W,y=H*.12+Math.random()*H*.74,rx=8+Math.random()*44,ry=3+Math.random()*13;
    const g=ctx.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));
    g.addColorStop(0,`rgba(255,255,255,${.16+Math.random()*.32})`);g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,rx,ry,Math.random()*Math.PI,0,Math.PI*2);ctx.fill();
  }
  return new THREE.CanvasTexture(cv);
}

function initGlobe(){
  if(gInited)return;gInited=true;
  const cv=document.getElementById('globe-cv');
  gRdr=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
  gRdr.setPixelRatio(Math.min(devicePixelRatio,2));
  gRdr.setSize(innerWidth,innerHeight);
  gRdr.setClearColor(0x000000,1);
  gScene=new THREE.Scene();
  gCam=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.01,5000);
  gCam.position.z=gCurZ;
  /* Stars */
  const sg=new THREE.BufferGeometry(),sp=new Float32Array(9000);
  for(let i=0;i<9000;i++){const th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1),r=180+Math.random()*120;sp[i*3]=r*Math.sin(ph)*Math.cos(th);sp[i*3+1]=r*Math.sin(ph)*Math.sin(th);sp[i*3+2]=r*Math.cos(ph);}
  sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
  gScene.add(new THREE.Points(sg,new THREE.PointsMaterial({size:.5,color:0xffffff,transparent:true,opacity:.9})));
  /* Earth */
  earthGrp=new THREE.Group();gScene.add(earthGrp);
  const earthGeo=new THREE.SphereGeometry(1,72,72);
  const procTex=makeProceduralEarth();
  const nightTex=makeProceduralNightTexture();
  earthMesh=new THREE.Mesh(earthGeo,new THREE.MeshPhongMaterial({map:procTex,specular:new THREE.Color(.08,.16,.28),shininess:26,bumpScale:.026,emissive:new THREE.Color(0xff7650),emissiveMap:nightTex,emissiveIntensity:.32}));
  earthGrp.add(earthMesh);
  /* Try hi-res texture from unpkg (CORS-enabled CDN) */
  const tl=new THREE.TextureLoader();
  tl.crossOrigin='anonymous';
  tl.load('https://cdn.jsdelivr.net/npm/three-globe@2.31.0/example/img/earth-blue-marble.jpg',
    tex=>{if(tex.colorSpace!==undefined)tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;earthMesh.material.map=tex;earthMesh.material.needsUpdate=true;
      tl.load('https://cdn.jsdelivr.net/npm/three-globe@2.31.0/example/img/earth-night.jpg',n=>{earthMesh.material.emissiveMap=n;earthMesh.material.emissiveIntensity=.72;earthMesh.material.needsUpdate=true;});
      tl.load('https://cdn.jsdelivr.net/npm/three-globe@2.31.0/example/img/earth-topology.png',b=>{earthMesh.material.bumpMap=b;earthMesh.material.needsUpdate=true;});
      tl.load('https://cdn.jsdelivr.net/npm/three-globe@2.31.0/example/img/earth-water.png',s=>{earthMesh.material.specularMap=s;earthMesh.material.needsUpdate=true;});
    },undefined,()=>{}
  );
  /* Clouds */
  const cloudTex=makeCloudTexture();
  cloudMesh=new THREE.Mesh(new THREE.SphereGeometry(1.013,56,56),new THREE.MeshPhongMaterial({map:cloudTex,alphaMap:cloudTex,transparent:true,opacity:.48,depthWrite:false,blending:THREE.AdditiveBlending}));
  earthGrp.add(cloudMesh);
  tl.load('https://cdn.jsdelivr.net/gh/turban/webgl-earth@master/images/fair_clouds_4k.png',ct=>{cloudMesh.material.map=ct;cloudMesh.material.alphaMap=ct;cloudMesh.material.needsUpdate=true;cloudMesh.material.opacity=.34;},undefined,()=>{});
  /* Atmosphere */
  const atmMat=new THREE.ShaderMaterial({
    uniforms:{uPow:{value:3.1},uCol:{value:new THREE.Color(0x3f8dff)}},
    vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float uPow;uniform vec3 uCol;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.0-abs(dot(vN,vV)),uPow);gl_FragColor=vec4(uCol*f*1.6,f*0.95);}',
    side:THREE.BackSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const atmShell=new THREE.Mesh(new THREE.SphereGeometry(1.22,64,64),atmMat);
  gScene.add(atmShell);earthGrp.userData.atm=atmShell;
  const rimMat=new THREE.ShaderMaterial({
    uniforms:{uCol:{value:new THREE.Color(0x9fd8ff)}},
    vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform vec3 uCol;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.0-abs(dot(vN,vV)),6.0);gl_FragColor=vec4(uCol*f,f*0.75);}',
    side:THREE.FrontSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  earthGrp.add(new THREE.Mesh(new THREE.SphereGeometry(1.028,64,64),rimMat));
  /* Lights */
  gScene.add(new THREE.AmbientLight(0x1b2a44,0.9));
  const sun=new THREE.DirectionalLight(0xfff2df,2.5);sun.position.set(5,2.4,4.2);gScene.add(sun);
  const fill=new THREE.DirectionalLight(0x4477cc,0.55);fill.position.set(-6,-2,-3);gScene.add(fill);
  /* Pin */
  pinGrp=new THREE.Group();pinGrp.visible=false;earthGrp.add(pinGrp);
  const pinSph=new THREE.Mesh(new THREE.SphereGeometry(.024,16,16),new THREE.MeshBasicMaterial({color:0xff8c42}));
  pinGrp.add(pinSph);
  pinRing=new THREE.Mesh(new THREE.TorusGeometry(.05,.007,8,32),new THREE.MeshBasicMaterial({color:0xff8c42,transparent:true,opacity:.6,blending:THREE.AdditiveBlending}));
  pinGrp.add(pinRing);

  /* Interaction */
  const ray=new THREE.Raycaster(),m2=new THREE.Vector2();
  let mdx=0,mdy=0,mdt=0;
  document.addEventListener('mousedown',e=>{if(VIEW!=='earth'||e.target.closest('.e-search-wrap,.e-zoom,.e-legend,.wpanel'))return;gDrag=true;mdx=e.clientX;mdy=e.clientY;mdt=Date.now();gVelY=0;gVelX=0;gTargRotY=null;gTargRotX=null;document.body.classList.add('drag');document.getElementById('ehint').style.display='none';});
  document.addEventListener('mousemove',e=>{
    if(!gDrag)return;
    const dx=e.clientX-mdx,dy=e.clientY-mdy;
    gRotY+=dx*.003;gRotX+=dy*.003;gRotX=Math.max(-1.48,Math.min(1.48,gRotX));
    gVelY=dx*.003;gVelX=dy*.003;mdx=e.clientX;mdy=e.clientY;
    /* Hover check for markers */
    m2.x=(e.clientX/innerWidth)*2-1;m2.y=-(e.clientY/innerHeight)*2+1;
    ray.setFromCamera(m2,gCam);
    const mHits=ray.intersectObjects(eoMarkers.map(m=>m.mesh));
    const tt=document.getElementById('ett');
    if(mHits.length){
      const mk=eoMarkers.find(m=>m.mesh===mHits[0].object);
      if(mk){document.getElementById('ett-type').textContent=mk.type;document.getElementById('ett-title').textContent=mk.title;document.getElementById('ett-date').textContent=mk.date;tt.style.left=(e.clientX+14)+'px';tt.style.top=(e.clientY-10)+'px';tt.classList.add('show');}
    }else tt.classList.remove('show');
  });
  document.addEventListener('mouseup',e=>{
    document.body.classList.remove('drag');if(!gDrag)return;gDrag=false;gLastDrag=Date.now();
    const dx=Math.abs(e.clientX-mdx),dy=Math.abs(e.clientY-mdy),dt=Date.now()-mdt;
    if(dx<7&&dy<7&&dt<300)handleClick(e.clientX,e.clientY);
  });
  /* Touch */
  let ltx=0,lty=0,tdx=0,tdy=0,tdt=0;
  document.addEventListener('touchstart',e=>{if(VIEW!=='earth'||e.target.closest('.e-search-wrap,.e-zoom,.e-legend,.wpanel'))return;gDrag=true;ltx=tdx=e.touches[0].clientX;lty=tdy=e.touches[0].clientY;tdt=Date.now();gVelY=0;gVelX=0;},{passive:true});
  cv.addEventListener('touchmove',e=>{if(!gDrag)return;const dx=e.touches[0].clientX-ltx,dy=e.touches[0].clientY-lty;gRotY+=dx*.003;gRotX+=dy*.003;gRotX=Math.max(-1.48,Math.min(1.48,gRotX));gVelY=dx*.003;gVelX=dy*.003;ltx=e.touches[0].clientX;lty=e.touches[0].clientY;gTargRotY=null;gTargRotX=null;},{passive:true});
  cv.addEventListener('touchend',e=>{gDrag=false;gLastDrag=Date.now();const dx=Math.abs(e.changedTouches[0].clientX-tdx),dy=Math.abs(e.changedTouches[0].clientY-tdy),dt=Date.now()-tdt;if(dx<9&&dy<9&&dt<300)handleClick(e.changedTouches[0].clientX,e.changedTouches[0].clientY);});
  /* Scroll zoom */
  document.addEventListener('wheel',e=>{if(VIEW!=='earth')return;gTargZ=Math.max(1.2,Math.min(5.5,gTargZ+e.deltaY*.002));},{passive:true});
  /* Pinch zoom */
  let lastPinch=0;
  cv.addEventListener('touchmove',e=>{if(e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);if(lastPinch)gTargZ=Math.max(1.2,Math.min(5.5,gTargZ-(d-lastPinch)*.01));lastPinch=d;}},{passive:true});
  cv.addEventListener('touchend',()=>{lastPinch=0;});

  function handleClick(cx,cy){
    m2.x=(cx/innerWidth)*2-1;m2.y=-(cy/innerHeight)*2+1;
    ray.setFromCamera(m2,gCam);
    const mh=ray.intersectObjects(eoMarkers.map(m=>m.mesh));
    if(mh.length){const mk=eoMarkers.find(m=>m.mesh===mh[0].object);if(mk){fetchWx(mk.lat,mk.lon,mk.title+' ('+mk.type+')');return;}}
    const eh=ray.intersectObject(earthMesh);
    if(!eh.length)return;
    const pt=eh[0].point.clone().applyQuaternion(earthGrp.quaternion.clone().invert());
    const lat=Math.asin(Math.max(-1,Math.min(1,pt.y)))*180/Math.PI;
    const lon=Math.atan2(pt.x,pt.z)*180/Math.PI;
    fetchWx(lat,lon,null);
  }
  window.addEventListener('resize', function(){
    if (!gRdr || !gCam) return;
    var W = window.innerWidth, H = window.innerHeight;
    gCam.aspect = W / H;
    gCam.updateProjectionMatrix();
    gRdr.setSize(W, H);
  });
}

function ll2xyz(lat,lon,r=1){
  const phi=(90-lat)*Math.PI/180,theta=(lon+180)*Math.PI/180;
  return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta));
}

let pinGrp,pinRing,pinPulse=0;
/* Smooth rotation targets for placePin animation */
let gTargRotY=null,gTargRotX=null;

function placePin(lat,lon){
  if(!pinGrp)return;
  const p=ll2xyz(lat,lon,1.022);
  pinGrp.position.copy(p);pinGrp.lookAt(p.clone().multiplyScalar(3));pinGrp.visible=true;
  /* Target rotation — globeLoop lerps toward it */
  const phi=(90-lat)*Math.PI/180,theta=(lon+180)*Math.PI/180;
  /* Find shortest angular path for Y */
  let targetY=theta-Math.PI;
  let diff=targetY-gRotY;
  diff=((diff+Math.PI)%(Math.PI*2))-Math.PI; // wrap to [-π, π]
  gTargRotY=gRotY+diff;
  gTargRotX=-(phi-Math.PI/2);
  gVelY=0;gVelX=0; // kill inertia so lerp is clean
}

function startGlobe(){gRunning=true;if(!gInited)initGlobe();if(!gRafId)gRafId=requestAnimationFrame(globeLoop);}
function stopGlobe(){gRunning=false;if(gRafId){cancelAnimationFrame(gRafId);gRafId=null;}}
function gzoom(d){gTargZ=Math.max(1.2,Math.min(5.5,gTargZ+d*.35));}

function globeLoop(){
  if(!gRunning)return;gRafId=requestAnimationFrame(globeLoop);
  const t=Date.now()*.001;
  // Auto-spin always runs (user drag adds on top via inertia)
  if(!gDrag){
    // Lerp toward pin target if one is set
    if(gTargRotY!==null){
      const remY=gTargRotY-gRotY, remX=gTargRotX-gRotX;
      gRotY+=remY*.07; gRotX+=remX*.07;
      if(Math.abs(remY)<0.004&&Math.abs(remX)<0.004){gRotY=gTargRotY;gRotX=gTargRotX;gTargRotY=null;gTargRotX=null;}
    } else {
      // Normal inertia + auto-spin
      gRotY += AUTO_SPIN;
      gVelY*=.88; gVelX*=.88;
      gRotY+=gVelY*.13; gRotX+=gVelX*.13;
      if(Math.abs(gVelX)<0.001) gRotX+=(0-gRotX)*.006;
    }
  } else {
    // While dragging: still auto-spin underneath
    gRotY += AUTO_SPIN;
  }
  earthGrp.rotation.set(gRotX,gRotY,0);
  if(cloudMesh)cloudMesh.rotation.y=t*.0018;
  if(earthGrp.userData.atm){
    earthGrp.userData.atm.scale.setScalar(1+Math.sin(t*.42)*.008);
    earthGrp.userData.atm.material.uniforms.uPow.value=3.1+Math.sin(t*.27)*.22;
  }
  gCurZ+=(gTargZ-gCurZ)*.07;gCam.position.z=gCurZ;
  /* Pin pulse */
  pinPulse+=.055;
  if(pinGrp&&pinGrp.visible&&pinRing){pinRing.scale.setScalar(.8+Math.sin(pinPulse)*.34);pinRing.material.opacity=.28+Math.sin(pinPulse)*.26;}
  /* Marker pulse */
  const ps=.88+Math.sin(t*1.9)*.14;
  eoMarkers.forEach(m=>{if(m.ring){m.ring.material.opacity=.38+Math.sin(t*2+m.off)*.24;m.ring.scale.setScalar(ps+m.off*.08);}});
  gRdr.render(gScene,gCam);
}

/* ━━━━━━━━━━━━ EONET LIVE EVENTS ━━━━━━━━━━━━ */
const EO_COLORS={
  wildfires:     {hex:0xff3311,css:'#ff3311',lbl:'Wildfire'},
  severeStorms:  {hex:0x4488ff,css:'#4488ff',lbl:'Severe Storm'},
  volcanoes:     {hex:0xff6600,css:'#ff6600',lbl:'Volcano'},
  seaLakeIce:    {hex:0x88ddff,css:'#88ddff',lbl:'Sea/Ice'},
  earthquakes:   {hex:0xffee00,css:'#ffee00',lbl:'Earthquake'},
  floods:        {hex:0x44bbff,css:'#44bbff',lbl:'Flood'},
  drought:       {hex:0xddbb44,css:'#ddbb44',lbl:'Drought'},
  dustHaze:      {hex:0xccaa77,css:'#ccaa77',lbl:'Dust/Haze'},
};
const EO_DEF={hex:0x999999,css:'#999999',lbl:'Event'};
let eoFetched=false;

async function fetchEonet(){
  if(eoFetched)return;eoFetched=true;
  try{
    const r=await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=200&days=45');
    const d=await r.json();const counts={};
    (d.events||[]).forEach(ev=>{
      const cat=ev.categories?.[0]?.id||'other';
      const geo=ev.geometry?.[ev.geometry.length-1];
      if(!geo||geo.type!=='Point')return;
      const [lon,lat]=geo.coordinates;if(typeof lat!=='number')return;
      const col=EO_COLORS[cat]||EO_DEF;
      counts[cat]=(counts[cat]||0)+1;
      addEoMarker(lat,lon,ev.title,col,cat,geo.date?.slice(0,10)||'');
    });
    buildLegend(counts);
  }catch(e){console.warn('EONET:',e.message);}
}

function addEoMarker(lat,lon,title,col,cat,date){
  if(!earthGrp)return;
  const pos=ll2xyz(lat,lon,1.025);
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(.013,10,10),new THREE.MeshBasicMaterial({color:col.hex}));
  mesh.position.copy(pos);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.026,.005,6,22),new THREE.MeshBasicMaterial({color:col.hex,transparent:true,opacity:.5,blending:THREE.AdditiveBlending}));
  ring.position.copy(pos);ring.lookAt(new THREE.Vector3(0,0,0));
  earthGrp.add(mesh);earthGrp.add(ring);
  eoMarkers.push({mesh,ring,lat,lon,title,type:col.lbl,date,cat,off:Math.random()*Math.PI*2});
}

function buildLegend(counts){
  const b=document.getElementById('eleg-body');b.innerHTML='';
  Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,8).forEach(([cat,cnt])=>{
    const col=EO_COLORS[cat]||EO_DEF;
    const d=document.createElement('div');d.className='e-leg-item';
    d.innerHTML=`<span class="e-leg-dot" style="background:${col.css}"></span>${col.lbl}<span class="e-leg-count">${cnt}</span>`;
    b.appendChild(d);
  });
}

/* ━━━━━━━━━━━━ WMO CODES ━━━━━━━━━━━━ */
const WMO={0:{d:'Clear Sky',e:'☀️'},1:{d:'Mainly Clear',e:'🌤️'},2:{d:'Partly Cloudy',e:'⛅'},3:{d:'Overcast',e:'☁️'},45:{d:'Fog',e:'🌫️'},48:{d:'Icy Fog',e:'🌫️'},51:{d:'Light Drizzle',e:'🌦️'},53:{d:'Moderate Drizzle',e:'🌦️'},55:{d:'Heavy Drizzle',e:'🌧️'},61:{d:'Light Rain',e:'🌧️'},63:{d:'Moderate Rain',e:'🌧️'},65:{d:'Heavy Rain',e:'🌧️'},71:{d:'Light Snow',e:'🌨️'},73:{d:'Moderate Snow',e:'❄️'},75:{d:'Heavy Snow',e:'❄️'},77:{d:'Snow Grains',e:'🌨️'},80:{d:'Rain Showers',e:'🌦️'},81:{d:'Showers',e:'🌧️'},82:{d:'Violent Showers',e:'⛈️'},85:{d:'Snow Showers',e:'🌨️'},95:{d:'Thunderstorm',e:'⛈️'},96:{d:'Thunderstorm+Hail',e:'⛈️'},99:{d:'Thunderstorm+Hail',e:'⛈️'}};
function wmo(c){return WMO[c]||WMO[Math.floor(c/10)*10]||{d:'Unknown',e:'🌡️'};}
function wdir(d){return['N','NE','E','SE','S','SW','W','NW'][Math.round(d/45)%8];}

async function fetchWx(lat,lon,name){
  openWx();placePin(lat,lon);
  document.getElementById('wpbody').innerHTML='<div class="wp-loading"><div class="wp-loading-ring"></div><div class="wp-loading-txt">Fetching atmosphere</div></div>';
  try{
    const [wx,loc]=await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weathercode,windspeed_10m,winddirection_10m,is_day&hourly=temperature_2m,weathercode,precipitation_probability&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto&forecast_days=7`).then(r=>r.json()),
      name?Promise.resolve(name):revGeo(lat,lon)
    ]);
    renderWx(wx,loc,lat,lon);
  }catch(e){document.getElementById('wpbody').innerHTML=`<div class="wp-loading" style="color:rgba(255,100,100,.7);font-size:14px;text-align:center">${e.message}</div>`;}
}

async function revGeo(lat,lon){
  try{const r=await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);const d=await r.json();const c=d.city||d.locality||d.principalSubdivision||'';if(c)return c+(d.countryName?', '+d.countryName:'');}catch{}
  return `${Math.abs(lat).toFixed(2)}°${lat>=0?'N':'S'} ${Math.abs(lon).toFixed(2)}°${lon>=0?'E':'W'}`;
}

/* G2-continuous weather curves — natural cubic spline with temperature + rain layers */
function smoothCurve(vals,times,rainVals){
  if(!vals||vals.length<3)return '';
  const W=340,H=136,PL=14,PR=14,PT=22,PB=22,GB=H-PB;
  const n=vals.length;
  const X=i=>PL+i*(W-PL-PR)/(n-1);
  const spline=(source,top,bottom)=>{
    const mn=Math.min(...source),mx=Math.max(...source),rng=(mx-mn)||1;
    const Y=v=>top+(1-(v-mn)/rng)*(bottom-top);
    const y=source.map(Y),a=new Array(n).fill(0),l=new Array(n).fill(1),mu=new Array(n).fill(0),z=new Array(n).fill(0),c=new Array(n).fill(0);
    for(let i=1;i<n-1;i++)a[i]=3*(y[i+1]-2*y[i]+y[i-1]);
    for(let i=1;i<n-1;i++){l[i]=4-mu[i-1];mu[i]=1/l[i];z[i]=(a[i]-z[i-1])/l[i];}
    for(let j=n-2;j>=0;j--)c[j]=z[j]-mu[j]*c[j+1];
    let d='M '+X(0).toFixed(1)+' '+y[0].toFixed(1);
    for(let i=0;i<n-1;i++){
      const b=(y[i+1]-y[i])-(2*c[i]+c[i+1])/3;
      const p1y=y[i]+b/3,p2y=y[i]+2*b/3+c[i]/3,step=(X(1)-X(0))/3;
      d+=' C '+(X(i)+step).toFixed(1)+' '+p1y.toFixed(1)+', '+(X(i+1)-step).toFixed(1)+' '+p2y.toFixed(1)+', '+X(i+1).toFixed(1)+' '+y[i+1].toFixed(1);
    }
    return {d,y};
  };
  const temp=spline(vals,PT,GB-8);
  const tempArea=temp.d+' L '+X(n-1).toFixed(1)+' '+GB+' L '+X(0).toFixed(1)+' '+GB+' Z';
  const rain=(rainVals&&rainVals.length===n)?spline(rainVals,PT+7,GB-7):null;
  const rainArea=rain?rain.d+' L '+X(n-1).toFixed(1)+' '+GB+' L '+X(0).toFixed(1)+' '+GB+' Z':'';
  const hh=t=>{const k=new Date(t).getHours();return k===0?'12a':k===12?'12p':k>12?(k-12)+'p':k+'a';};
  const dots=vals.map((v,i)=>i%3===0?`<circle class="cv-dot" cx="${X(i).toFixed(1)}" cy="${temp.y[i].toFixed(1)}" r="2.8"/><text class="cv-lbl" x="${X(i).toFixed(1)}" y="${(temp.y[i]-9).toFixed(1)}" text-anchor="middle">${Math.round(v)}°</text>`:'').join('');
  const rainDots=rain?rainVals.map((v,i)=>i%3===0?`<circle class="cv-rain-dot" cx="${X(i).toFixed(1)}" cy="${rain.y[i].toFixed(1)}" r="2"/><text class="cv-rain-lbl" x="${X(i).toFixed(1)}" y="${(rain.y[i]+13).toFixed(1)}" text-anchor="middle">${Math.round(v)}%</text>`:'').join(''):'';
  const ticks=[0,Math.floor((n-1)/2),n-1].map(i=>`<text class="cv-tick" x="${X(i).toFixed(1)}" y="${H-6}" text-anchor="middle">${hh(times[i])}</text>`).join('');
  return `<div class="wp-curve"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs>
      <linearGradient id="wxg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#72d7ff"/><stop offset="55%" stop-color="#ff9b5a"/><stop offset="100%" stop-color="#c49aff"/></linearGradient>
      <linearGradient id="wxf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(114,215,255,.28)"/><stop offset="100%" stop-color="rgba(114,215,255,0)"/></linearGradient>
      <linearGradient id="wxr" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#c49aff"/><stop offset="100%" stop-color="#72d7ff"/></linearGradient>
      <linearGradient id="wxrf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(196,154,255,.2)"/><stop offset="100%" stop-color="rgba(196,154,255,0)"/></linearGradient>
    </defs>
    <path class="cv-fill" d="${tempArea}"/>${rain?`<path class="cv-rain-fill" d="${rainArea}"/><path class="cv-rain" d="${rain.d}"/>`:''}<path class="cv-line" d="${temp.d}"/>${dots}${rainDots}${ticks}
  </svg></div><div class="wx-legend"><span><i class="wx-temp"></i>Temperature</span>${rain?'<span><i class="wx-rain"></i>Rain probability</span>':''}</div>`;
}

function renderWx(data,loc,lat,lon){
  const c=data.current,dai=data.daily,hr=data.hourly,now=new Date();
  const temp=Math.round(c.temperature_2m),feels=Math.round(c.apparent_temperature);
  const w=wmo(c.weathercode),tz=data.timezone_abbreviation||'';
  const hi=hr.time.findIndex(t=>new Date(t)>now)-1,s=Math.max(0,hi);
  const hhHtml=hr.time.slice(s,s+12).map((t,i)=>{
    const d=new Date(t),hh=d.getHours(),lbl=i===0?'Now':(hh===0?'12a':hh===12?'12p':hh>12?`${hh-12}p`:`${hh}a`);
    return `<div class="wp-hr"><div class="wp-hr-t">${lbl}</div><div class="wp-hr-i">${wmo(hr.weathercode[s+i]).e}</div><div class="wp-hr-v">${Math.round(hr.temperature_2m[s+i])}°</div></div>`;
  }).join('');
  const DN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const fcHtml=dai.time.map((t,i)=>{const d=new Date(t+'T12:00:00'),n=i===0?'Today':DN[d.getDay()],fw=wmo(dai.weathercode[i]);
    return `<div class="wp-day"><div class="wpd-name">${n}</div><div class="wpd-icon">${fw.e}</div><div class="wpd-desc">${fw.d}</div><div class="wpd-rain">${dai.precipitation_probability_max[i]}%</div><div class="wpd-temps"><span class="hi">${Math.round(dai.temperature_2m_max[i])}°</span> <span class="lo">${Math.round(dai.temperature_2m_min[i])}°</span></div></div>`;
  }).join('');
  document.getElementById('wploc').textContent=loc;
  document.getElementById('wpcoords').textContent=`${Math.abs(lat).toFixed(2)}°${lat>=0?'N':'S'} ${Math.abs(lon).toFixed(2)}°${lon>=0?'E':'W'} · ${tz}`;
  document.getElementById('wpbody').innerHTML=`
    <div class="wp-current">
      <div class="wp-temp-row"><div class="wp-temp-num">${temp}</div><div class="wp-temp-unit">°C</div><div class="wp-icon">${w.e}</div></div>
      <div class="wp-desc">${w.d} · Feels like ${feels}°C</div>
      <div class="wp-grid">
        <div class="wp-stat"><div class="wp-stat-lbl">Humidity</div><div class="wp-stat-val">${c.relative_humidity_2m}<span> %</span></div></div>
        <div class="wp-stat"><div class="wp-stat-lbl">Wind</div><div class="wp-stat-val">${Math.round(c.windspeed_10m)}<span> km/h ${wdir(c.winddirection_10m)}</span></div></div>
        <div class="wp-stat"><div class="wp-stat-lbl">Precipitation</div><div class="wp-stat-val">${c.precipitation}<span> mm</span></div></div>
        <div class="wp-stat"><div class="wp-stat-lbl">Updated</div><div class="wp-stat-val" style="font-size:13px">${now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div></div>
      </div>
    </div>
    <div class="wp-hourly"><div class="wp-sec-lbl">Next 12 Hours · G2 Forecast</div>${smoothCurve(hr.temperature_2m.slice(s,s+12),hr.time.slice(s,s+12),hr.precipitation_probability.slice(s,s+12))}<div class="wp-hr-scroll">${hhHtml}</div></div>
    <div class="wp-forecast"><div class="wp-sec-lbl">7-Day Forecast</div>${fcHtml}</div>`;
}

function openWx(){document.getElementById('wpanel').classList.add('open');document.getElementById('ehint').style.display='none';}
function closeWx(){document.getElementById('wpanel').classList.remove('open');document.getElementById('ehint').style.display='';}

/* City search */
const $esinp=document.getElementById('esinp'),$edrop=document.getElementById('edrop');
let sDebounce=null;
$esinp.addEventListener('input',()=>{clearTimeout(sDebounce);const q=$esinp.value.trim();if(q.length<2){$edrop.classList.remove('open');return;}sDebounce=setTimeout(()=>liveSearch(q),360);});
$esinp.addEventListener('keydown',e=>{if(e.key==='Enter')earthSearch();if(e.key==='Escape'){$edrop.classList.remove('open');$esinp.blur();}});
document.addEventListener('click',e=>{if(!e.target.closest('.e-search-wrap'))$edrop.classList.remove('open');});

async function liveSearch(q){
  try{const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`);const d=await r.json();const rs=d.results||[];
    if(!rs.length){$edrop.innerHTML='<div class="e-ditem"><strong style="color:var(--text3)">No results</strong></div>';$edrop.classList.add('open');return;}
    $edrop.innerHTML=rs.map(x=>`<div class="e-ditem" onclick="pickCity(${x.latitude},${x.longitude},'${(x.name+', '+(x.country||'')).replace(/'/g,"\\'")}')"><strong>${x.name}</strong><span>${[x.admin1,x.country].filter(Boolean).join(', ')}</span></div>`).join('');
    $edrop.classList.add('open');
  }catch{$edrop.classList.remove('open');}
}
async function earthSearch(){const q=$esinp.value.trim();if(!q)return;$edrop.classList.remove('open');
  try{const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`);const d=await r.json();const x=d.results?.[0];if(!x){alert('No location found for "'+q+'".');return;}pickCity(x.latitude,x.longitude,x.name+', '+(x.country||''));}catch{alert('Search failed. Check connection.');}
}
function pickCity(lat,lon,name){$edrop.classList.remove('open');$esinp.value=name;fetchWx(lat,lon,name);}
function getGeoLoc(){if(!navigator.geolocation){alert('Geolocation not supported.');return;}navigator.geolocation.getCurrentPosition(p=>fetchWx(p.coords.latitude,p.coords.longitude,null),()=>alert('Location denied. Try searching a city.'),{timeout:10000});}

/* ━━━━━━━━━━━━ AUTH — HYBRID ━━━━━━━━━━━━ */
let authToken=null,authUser=null,useBackend=false;
let offGroqKey='';try{offGroqKey=localStorage.getItem('qt_groq_key')||'';}catch{}
function localUsers(){try{return JSON.parse(localStorage.getItem('qt_users')||'{}')}catch{return{}}}
function saveLocalUsers(u){localStorage.setItem('qt_users',JSON.stringify(u));}

async function detectBackend(){try{const r=await fetch('/api/public/auth/me',{signal:AbortSignal.timeout(1800)});await r.json();useBackend=true;}catch{useBackend=false;}}

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

async function checkAuth(){
  if(useBackend){
    const st=localStorage.getItem('qt_token');if(!st){showAuth();return;}
    try{const r=await fetch('/api/public/auth/me',{headers:{Authorization:'Bearer '+st}});if(!r.ok)throw 0;const d=await r.json();authToken=st;authUser=d.username;hideAuth();setNav(d.username);addMsg('Welcome back, '+d.username+'! Ask me anything.','bot');}
    catch{localStorage.removeItem('qt_token');showAuth();}
  }else{
    const s=localStorage.getItem('qt_local_session');
    if(s){authUser=s;authToken='local';hideAuth();setNav(s);addMsg('Welcome back, '+s+'! (Offline mode — enter Groq key for AI)','bot');}
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

function promptGroqKey(cb){
  const w=document.createElement('div');w.style.cssText='display:flex;flex-direction:column;gap:8px;padding:6px 0';
  w.innerHTML=`<div class="msg bot" style="max-width:100%;margin:0;font-size:13px">No server detected. Paste a free <strong>Groq API key</strong> to enable AI.<br><br>Get one in 30s at <strong>console.groq.com</strong> → API Keys</div><div style="display:flex;gap:7px;padding:0 2px"><input id="gkInp" type="password" placeholder="gsk_..." style="flex:1;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-sm);padding:8px 11px;color:var(--text);font-size:13px;outline:none;"><button style="padding:8px 13px;border-radius:var(--r-sm);background:rgba(255,140,66,.15);border:1.5px solid rgba(255,140,66,.4);color:var(--orange);font-family:var(--font-mono);font-size:.5rem;letter-spacing:.1em;" id="gkSave">SAVE</button></div>`;
  aimsgs.appendChild(w);aimsgs.scrollTop=aimsgs.scrollHeight;
  const inp=document.getElementById('gkInp'),sav=document.getElementById('gkSave');
  function save(){const k=inp.value.trim();if(k.length<10){inp.style.borderColor='rgba(255,100,100,.5)';setTimeout(()=>inp.style.borderColor='',1200);return;}offGroqKey=k;try{localStorage.setItem('qt_groq_key',k);}catch{}w.remove();cb();}
  sav.addEventListener('click',save);inp.addEventListener('keydown',e=>{if(e.key==='Enter')save();});inp.focus();
}

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
  {keys:['who are you','what are you','your name'],answer:'I am ASTROPIX, the local science guide inside Quan-Taara. I can answer common questions offline and can use Ollama or Groq when available.'}
];
let ollamaState='unknown';
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
async function askOllama(question,history){
  if(ollamaState==='offline')return null;
  try{
    const r=await fetch('http://127.0.0.1:11434/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      model:localStorage.getItem('qt_ollama_model')||'llama3.2',stream:false,
      messages:[{role:'system',content:'You are ASTROPIX, a concise and friendly physics mentor. Answer in plain text in under 120 words. If unsure, say so.'},...(history||[]),{role:'user',content:question}]
    }),signal:AbortSignal.timeout(2600)});
    if(!r.ok){ollamaState='offline';return null;}
    const d=await r.json(),answer=d.message?.content?.trim();
    if(!answer){ollamaState='offline';return null;}
    ollamaState='online';return answer.replace(/\*\*/g,'').replace(/\*/g,'').replace(/#{1,6} /g,'').replace(/`/g,'');
  }catch(e){ollamaState='offline';return null;}
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
async function askGroq(question,history){
  if(!offGroqKey)return null;
  const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+offGroqKey},body:JSON.stringify({
    model:'llama-3.3-70b-versatile',temperature:.72,max_tokens:420,
    messages:[{role:'system',content:'You are ASTROPIX, a precise and enthusiastic astrophysics mentor. Use plain text and keep answers under 120 words.'},...(history||[]),{role:'user',content:question}]
  })});
  const d=await r.json();if(d.error)throw new Error(d.error.message);
  return (d.choices?.[0]?.message?.content||'No response.').replace(/\*\*/g,'').replace(/\*/g,'').replace(/#{1,6} /g,'').replace(/`/g,'');
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
      answer=await askOllama(txt,convHist.slice(0,-1));
      if(answer){source='OLLAMA';setAiStatus('Ollama',true);}
    }
    if(!answer&&offGroqKey){
      answer=await askGroq(txt,convHist.slice(0,-1));
      if(answer){source='GROQ';setAiStatus('Groq',true);}
    }
    if(!answer){
      source='LOCAL CORE';
      setAiStatus('Local core',true);
      answer='I can solve common physics questions offline. For broader ML answers, configure QT_AI_BASE_URL/QT_AI_MODEL for the backend, start Ollama locally, or add an optional Groq key through the AI panel.';
    }
    const isRid=/\b(why|how|can)\b.*\b(universe|black hole|quantum|space)\b/i.test(txt)&&/[?]/.test(txt);
    if(useBackend){
      const r=await fetch('/api/public/chat',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+authToken},body:JSON.stringify({question:txt,answer,isRidiculous:isRid,history:convHist.slice(0,-1)})});
      const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not save this answer.');
    }
    thinking.remove();addTag(source,'rid');if(isRid)addTag('⚡ Cosmic Absurdity Mode','rid');addMsg(answer,'bot');convHist.push({role:'assistant',content:answer});
  }catch(e){thinking.remove();const m=e.message||'Error';if(m.includes('401')||m.includes('api_key')){offGroqKey='';localStorage.removeItem('qt_groq_key');addMsg('Groq key rejected — please enter a valid key.','bot');}else addMsg('Error: '+m,'bot');}
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
const DATA=[
{id:1,title:'Classical Mechanics',basic:'Macroscopic motion, forces, energy, and Newtonian laws governing everyday physics.',tags:['Kinematics','Dynamics','Rotation','Gravitation'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'Kinematics',desc:'Equations describing motion — linear, projectile, and circular.',eqs:[
    {f:'v = u + at',n:'Velocity-Time Relation',x:'Final velocity after constant acceleration a over time t.',d:'Foundation of uniformly accelerated motion. Derived from definition a = Δv/Δt.'},
    {f:'s = ut + ½at²',n:'Displacement-Time Relation',x:'Distance covered in time t under constant acceleration.',d:'Integrate v=u+at with respect to t.'},
    {f:'v² = u² + 2as',n:'Velocity-Displacement',x:'Links velocity and displacement without time.',d:'Eliminate t from the two equations above.'},
    {f:'R = u² sin2θ / g',n:'Projectile Range',x:'Horizontal distance for launch angle θ.',d:'Maximum at θ=45°. Combine horizontal and vertical motion equations.'},
    {f:'aₒ = v²/r = ω²r',n:'Centripetal Acceleration',x:'Inward acceleration maintaining circular motion.',d:'Derived from geometry of circular motion; direction always toward center.'},
  ]},
  {title:"Newton's Laws & Gravitation",desc:'Forces governing all macroscopic motion.',eqs:[
    {f:'F = ma',n:"Newton's Second Law",x:'Net force equals mass times acceleration.',d:'The central equation of classical dynamics. F, m, a are vectors.'},
    {f:'F = Gm₁m₂/r²',n:"Newton's Law of Gravitation",x:'Attractive force between two masses.',d:'G = 6.674×10⁻¹¹ N m²/kg². Inverse-square law.'},
    {f:'vₒ = √(GM/r)',n:'Orbital Velocity',x:'Speed for circular orbit at radius r.',d:'Set gravitational force equal to centripetal force; solve for v.'},
    {f:'vₑ = √(2GM/R)',n:'Escape Velocity',x:'Minimum speed to escape a body of mass M and radius R.',d:'Set kinetic energy equal to gravitational potential energy.'},
  ]},
]},
{id:2,title:'Thermodynamics',basic:'Heat, work, entropy, and the statistical nature of energy in physical systems.',tags:['Entropy','Carnot','Kinetic Theory'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'The Four Laws',desc:'Pillars governing energy transfer and the arrow of time.',eqs:[
    {f:'ΔQ = ΔU + W',n:'First Law',x:'Heat added equals internal energy change plus work done.',d:'Energy conservation for thermodynamic systems. No perpetual motion machine of the first kind is possible.'},
    {f:'ΔS ≥ 0',n:'Second Law',x:'Total entropy of an isolated system never decreases.',d:'Defines the direction of time. Clausius inequality: ΔS ≥ δQ/T.'},
    {f:'η = 1 − Tₒ/Tₕ',n:'Carnot Efficiency',x:'Maximum efficiency of any heat engine between Tₒ and Tₕ.',d:'Reversible (Carnot) cycle is the theoretical maximum. All real engines are less efficient.'},
  ]},
  {title:'Kinetic Theory',desc:'Statistical mechanics of gas molecules.',eqs:[
    {f:'PV = nRT',n:'Ideal Gas Law',x:'Pressure, volume, temperature relation for ideal gas.',d:'R = 8.314 J mol⁻¹ K⁻¹. Combines Boyle\'s, Charles\'s, and Avogadro\'s laws.'},
    {f:'K̄ = 3/2 kT',n:'Average Kinetic Energy',x:'Mean translational kinetic energy per molecule.',d:'k = 1.38×10⁻²³ J/K. Temperature is a measure of average kinetic energy.'},
    {f:'v_rms = √(3RT/M)',n:'RMS Speed',x:'Root-mean-square molecular speed.',d:'M is molar mass. Used to estimate molecular speeds in Maxwell-Boltzmann distribution.'},
  ]},
]},
{id:3,title:'Electromagnetism',basic:'Electric and magnetic fields unified by Maxwell into a complete theory of light.',tags:['Maxwell','Induction','Waves'],badge:'badge-physics',field:'Physics',concepts:[
  {title:"Maxwell's Equations",desc:'Four laws that unify all classical electromagnetic phenomena.',eqs:[
    {f:'∇·E = ρ/ε₀',n:'Gauss (Electric)',x:'Charges are sources of electric field.',d:'Integral form: ∮E·dA = Q_enc/ε₀. Coulomb\'s law is a consequence.'},
    {f:'∇·B = 0',n:'Gauss (Magnetic)',x:'No magnetic monopoles exist.',d:'Magnetic field lines always form closed loops.'},
    {f:'∇×E = −∂B/∂t',n:"Faraday's Law",x:'Changing magnetic field induces electric field.',d:'Basis of generators and transformers.'},
    {f:'∇×B = μ₀J + μ₀ε₀∂E/∂t',n:'Ampere-Maxwell',x:'Currents and changing E produce magnetic field.',d:'Displacement current term (μ₀ε₀∂E/∂t) predicted electromagnetic waves.'},
    {f:'c = 1/√(μ₀ε₀)',n:'Speed of Light',x:'Derived from Maxwell\'s equations.',d:'c ≈ 3×10⁸ m/s. Maxwell realised light IS an electromagnetic wave.'},
  ]},
]},
{id:4,title:'Special Relativity',basic:'The physics of high velocities — space, time, and mass fundamentally reimagined.',tags:['Lorentz','Spacetime','Mass-Energy'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'Core Effects',desc:'Measurable consequences of the two postulates of special relativity.',eqs:[
    {f:'γ = 1/√(1−v²/c²)',n:'Lorentz Factor',x:'The fundamental scaling factor of relativistic effects.',d:'γ→1 as v→0 (classical limit). γ→∞ as v→c (unreachable for massive objects).'},
    {f:'Δt = γΔt₀',n:'Time Dilation',x:'Moving clocks tick slower by factor γ.',d:'Confirmed by muon decay, GPS satellite corrections, atomic clock experiments.'},
    {f:'L = L₀/γ',n:'Length Contraction',x:'Moving objects are shorter along direction of motion.',d:'Only in the direction of motion. Perpendicular dimensions unchanged.'},
    {f:'E = γmc²',n:'Total Energy',x:'Relativistic energy including rest energy.',d:'Rest energy E₀=mc². Kinetic energy K=(γ−1)mc².'},
    {f:'E² = (pc)² + (mc²)²',n:'Energy-Momentum Relation',x:'Invariant combining energy and momentum.',d:'For photons (m=0): E=pc. Fundamental relation in particle physics.'},
  ]},
]},
{id:5,title:'General Relativity',basic:'Gravity as spacetime curvature — Einstein\'s geometric description of gravitation.',tags:['Curvature','Black Holes','Cosmology'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'Core Equations',desc:'Geometry curves; matter tells spacetime how to curve; curvature tells matter how to move.',eqs:[
    {f:'Gμν = (8πG/c⁴)Tμν',n:'Einstein Field Equations',x:'Curvature (left) equals matter-energy content (right).',d:'10 coupled nonlinear PDEs. Gμν = Rμν − ½gμνR encodes geometry.'},
    {f:'ds² = (1−2GM/rc²)c²dt² − dr²/(1−2GM/rc²) − r²dΩ²',n:'Schwarzschild Metric',x:'Spacetime geometry outside a spherical mass.',d:'Predicts gravitational time dilation, light bending, black hole event horizon at r_s=2GM/c².'},
    {f:'t = t₀/√(1−2GM/rc²)',n:'Gravitational Time Dilation',x:'Clocks run slower in stronger gravity wells.',d:'GPS clocks gain ~45 μs/day from altitude effect, lose ~7 μs/day from velocity — net +38 μs/day corrected.'},
    {f:'(ȧ/a)² = (8πG/3)ρ − k/a² + Λ/3',n:'Friedmann Equation',x:'Governs the expansion of the universe.',d:'a(t) = cosmic scale factor. k = spatial curvature. Λ = cosmological constant (dark energy).'},
  ]},
]},
{id:6,title:'Quantum Mechanics',basic:'The mathematical framework governing all microscopic physics and atomic structure.',tags:['Wavefunction','Operators','Uncertainty'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'Core Formalism',desc:'Hilbert spaces, wavefunctions, and the measurement problem.',eqs:[
    {f:'iℏ ∂ψ/∂t = Ĥψ',n:'Schrödinger Equation',x:'Time evolution of a quantum state.',d:'The quantum analogue of Newton\'s second law. Ĥ is the Hamiltonian operator.'},
    {f:'ΔxΔp ≥ ℏ/2',n:'Uncertainty Principle',x:'Position and momentum cannot both be precisely defined.',d:'Not a measurement limitation — a fundamental property of quantum states (Robertson inequality).'},
    {f:'Eₙ = −13.6/n² eV',n:'Hydrogen Energy Levels',x:'Quantized energy states of hydrogen atom.',d:'n = 1 is ground state. Transitions produce spectral lines (Balmer, Lyman series).'},
    {f:'⟨A⟩ = ⟨ψ|Â|ψ⟩',n:'Expectation Value',x:'Average measurement result for observable A.',d:'Born rule: probability density |ψ|². Physical observables are Hermitian operators.'},
  ]},
]},
{id:7,title:'Stellar Astrophysics',basic:'The physics of stellar interiors, nuclear burning, and the lives of stars.',tags:['Fusion','Structure','Neutron Stars'],badge:'badge-physics',field:'Astrophysics',concepts:[
  {title:'Stellar Structure',desc:'How stars shine and stay in equilibrium for billions of years.',eqs:[
    {f:'dP/dr = −Gρ(r)M(r)/r²',n:'Hydrostatic Equilibrium',x:'Pressure gradient balances gravity throughout the star.',d:'Combined with equation of state and opacity gives the four stellar structure equations.'},
    {f:'L = 4πR²σT⁴',n:'Stefan-Boltzmann Law',x:'Luminosity depends on surface area and temperature.',d:'σ = 5.67×10⁻⁸ W m⁻² K⁻⁴. A small change in T has huge effect on L.'},
    {f:'dP/dr = −G(ρ+P/c²)(M+4πr³P/c²)/[r(r−2GM/c²)]',n:'TOV Equation',x:'GR hydrostatic equilibrium for dense stars.',d:'Determines maximum neutron star mass (~2 M☉). Compact star stability requires GR.'},
  ]},
]},
{id:8,title:'Cosmology',basic:'The origin, evolution, and large-scale structure of the observable universe.',tags:['CMB','Inflation','Dark Energy'],badge:'badge-physics',field:'Astrophysics',concepts:[
  {title:'Universe Evolution',desc:'From the Big Bang to the present large-scale structure.',eqs:[
    {f:'H = ȧ/a',n:'Hubble Parameter',x:'Rate of cosmic expansion at a given time.',d:'H₀ ≈ 67–73 km/s/Mpc (Hubble tension unresolved). Recession velocity: v = H₀d.'},
    {f:'ρ_crit = 3H²/8πG',n:'Critical Density',x:'Density that makes the universe spatially flat.',d:'ρ_crit ≈ 9.5×10⁻²⁷ kg/m³ today. Ω = ρ/ρ_crit defines geometry.'},
    {f:'T ∝ 1/a',n:'CMB Temperature Scaling',x:'Cosmic microwave background cools as universe expands.',d:'T₀ = 2.725 K today. At recombination (z≈1100): T ≈ 3000 K.'},
  ]},
]},
{id:9,title:'Gravitational Wave Astronomy',basic:'Ripples in spacetime detected by LIGO, Virgo, and KAGRA interferometers.',tags:['LIGO','Chirp Mass','Mergers'],badge:'badge-astro',field:'Astrophysics',concepts:[
  {title:'Detection & Source Physics',desc:'How gravitational waves are generated, propagate, and are measured.',eqs:[
    {f:'h = ΔL/L',n:'Gravitational Wave Strain',x:'Fractional change in interferometer arm length.',d:'GW150914: h~10⁻²¹. Arm length L=4 km → ΔL ~ 4×10⁻¹⁸ m. 1000× smaller than a proton.'},
    {f:'ℳ = (m₁m₂)³/⁵/(m₁+m₂)¹/⁵',n:'Chirp Mass',x:'Primary observable controlling GW frequency evolution.',d:'Extracted from the chirp waveform to <1% accuracy. Determines source distance via luminosity.'},
    {f:'P_GW = −32G⁴m₁²m₂²(m₁+m₂)/(5c⁵r⁵)',n:'Peters Formula',x:'Power radiated as gravitational waves from a circular binary.',d:'Causes orbital decay. Confirmed in Hulse-Taylor pulsar (Nobel Prize 1993).'},
  ]},
]},
{id:10,title:'Plasma Physics & MHD',basic:'Ionized gas — the fourth state of matter governing stars, fusion, and space.',tags:['Alfvén','Tokamak','Solar Wind'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'Magnetohydrodynamics',desc:'The fluid description of electrically conducting plasmas in magnetic fields.',eqs:[
    {f:'ρ(∂v/∂t + v·∇v) = J×B − ∇P',n:'MHD Momentum Equation',x:'Plasma flow driven by magnetic Lorentz and pressure forces.',d:'J×B: magnetic pressure and tension. Foundation of solar physics, fusion confinement, accretion.'},
    {f:'v_A = B/√(μ₀ρ)',n:'Alfvén Speed',x:'Speed of magnetic wave propagating along field lines.',d:'Solar wind v_A ~ 50 km/s. Pulsar magnetospheres: v_A ~ 0.1c.'},
    {f:'ω_pe = √(ne²/mε₀)',n:'Plasma Frequency',x:'Natural electron oscillation frequency.',d:'EM waves below ω_pe cannot propagate — explains ionospheric radio reflection.'},
  ]},
]},
{id:11,title:'Exoplanet Science',basic:'Detection and characterisation of planets around other stars.',tags:['Transit','Radial Velocity','Habitable Zone'],badge:'badge-astro',field:'Astrophysics',concepts:[
  {title:'Detection Methods',desc:'Techniques that revealed thousands of worlds beyond our solar system.',eqs:[
    {f:'δF/F = (Rₚ/R★)²',n:'Transit Depth',x:'Fractional dip in stellar brightness during transit.',d:'Earth-Sun: δF ≈ 84 ppm. Jupiter-Sun: ≈1%. Kepler measured ppm-level photometry.'},
    {f:'K = (2πG/P)^(1/3) mₚ sini/(m★+mₚ)^(2/3)',n:'RV Semi-Amplitude',x:'Stellar Doppler wobble amplitude due to a planet.',d:'Earth induces K ≈ 0.09 m/s on Sun. First exoplanet (51 Peg b, 1995): K = 56 m/s.'},
  ]},
]},
{id:12,title:'Dark Matter & Dark Energy',basic:'The invisible 95% of the universe that drives cosmic structure and expansion.',tags:['Lambda-CDM','WIMP','Omega'],badge:'badge-astro',field:'Astrophysics',concepts:[
  {title:'Evidence & Models',desc:'What we know about what we cannot see.',eqs:[
    {f:'v(r) = √(GM(<r)/r)',n:'Galaxy Rotation Curves',x:'Flat observed curves vs declining prediction imply dark matter halos.',d:'DM density profile: ρ_DM ∝ 1/r² (isothermal). Observed out to 50+ kpc beyond visible disk.'},
    {f:'ρ_Λ = Λc²/8πG',n:'Dark Energy Density',x:'Vacuum energy density from the cosmological constant.',d:'ρ_Λ ≈ 6×10⁻²⁷ kg/m³ — tiny but dominant at cosmic scales. Drives accelerating expansion.'},
    {f:'Ω_total = Ω_m + Ω_r + Ω_Λ ≈ 1.0',n:'Density Parameters',x:'Flat universe: dark matter 27%, dark energy 68%, baryons 5%.',d:'Measured by CMB power spectrum (Planck 2018). Spatial flatness confirmed to 0.4%.'},
  ]},
]},
{id:13,title:'Radio Astronomy',basic:'Exploring the universe through centimetre-to-kilometre wavelength radiation.',tags:['21cm','Synchrotron','Pulsars'],badge:'badge-astro',field:'Astrophysics',concepts:[
  {title:'Emission Mechanisms',desc:'Physical processes producing radio waves across the cosmos.',eqs:[
    {f:'ν₂₁ = 1420.406 MHz',n:'HI 21-cm Line',x:'Hyperfine spin-flip transition of neutral hydrogen.',d:'Most abundant atom in universe. Maps spiral arm structure, traces cosmic gas. Planned SKA surveys.'},
    {f:'P(ν) ∝ ν^(−α) B^(1+α) N₀',n:'Synchrotron Power Law',x:'Relativistic electrons in B fields produce power-law radio spectra.',d:'Spectral index α ≈ 0.5–1. Seen in supernova remnants, AGN jets, radio galaxies.'},
  ]},
]},
{id:14,title:'Space Weather',basic:'Solar storms and their cascading effects on Earth\'s magnetosphere and technology.',tags:['CME','Solar Wind','Kp Index'],badge:'badge-space',field:'Space Science',concepts:[
  {title:'Solar-Earth Connection',desc:'The electromagnetic link between the Sun and Earth.',eqs:[
    {f:'B²/2μ₀ = ½ρv²',n:'Magnetopause Pressure Balance',x:'Earth\'s field pressure balanced by solar wind ram pressure.',d:'Determines magnetopause standoff distance R_MP ≈ 10 R_Earth at solar minimum.'},
    {f:'Kp = 0–9',n:'Kp Geomagnetic Index',x:'Global activity index from 13 sub-auroral stations.',d:'Kp ≥ 5: geomagnetic storm. Kp 8–9: extreme (G4-G5). Carrington 1859: estimated Kp ~ 9+.'},
  ]},
]},
{id:15,title:'Astrobiology',basic:'The scientific search for life\'s origins, limits, and prevalence in the cosmos.',tags:['Drake Equation','Biosignatures','Habitability'],badge:'badge-bio',field:'Astrobiology',concepts:[
  {title:'Life in the Cosmos',desc:'Quantifying the probability and detectability of life.',eqs:[
    {f:'N = R★·fₚ·nₑ·f_l·fᵢ·f_c·L',n:'Drake Equation',x:'Estimate of communicating civilisations in the Milky Way.',d:'R★≈3/yr, fₚ≈1. f_l, fᵢ, f_c, L are deeply uncertain. N ranges from <1 to millions.'},
    {f:'O₂ + CH₄ → disequilibrium',n:'Biosignature Pair',x:'Chemically reactive gases co-existing require biological replenishment.',d:'These react on ~10-year timescales. Detection by JWST transmission spectroscopy is a priority.'},
  ]},
]},
{id:16,title:'Astrochemistry',basic:'Molecular chemistry in interstellar clouds, disks, and planetary atmospheres.',tags:['ISM','Molecules','Dust'],badge:'badge-space',field:'Space Science',concepts:[
  {title:'Interstellar Chemistry',desc:'How complex molecules form in the cold, dark interstellar medium.',eqs:[
    {f:'dNᵢ/dt = Σⱼₖ αⱼₖnⱼnₖ − Nᵢ Σⱼ βᵢⱼnⱼ',n:'ISM Rate Equations',x:'Formation minus destruction rates for chemical species i.',d:'230+ molecules detected in ISM. Grain-surface chemistry dominates in cold dense clouds (T~10K).'},
    {f:'τ = N_H/(σ_pe G₀)',n:'Photodissociation Timescale',x:'UV destroys molecules at cloud edges illuminated by hot stars.',d:'PDR (Photodissociation Region) chemistry: rich surface, protected interior. Self-shielding of H₂ and CO.'},
  ]},
]},
{id:17,title:'Fluid Dynamics',basic:'The motion of liquids and gases, from atmospheric vortices to accretion disks.',tags:['Navier-Stokes','Vortices','Turbulence'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'Flow and Pressure',desc:'Continuum equations that describe how fluids move and exchange energy.',eqs:[
    {f:'∂ρ/∂t + ∇·(ρv) = 0',n:'Continuity Equation',x:'Mass is conserved as fluid flows through space.',d:'For an incompressible fluid, this reduces to ∇·v = 0. It is the starting point for every flow field.'},
    {f:'ρ(∂v/∂t + v·∇v) = −∇p + μ∇²v + f',n:'Navier-Stokes Equation',x:'Momentum balance for a viscous fluid.',d:'The nonlinear advection term v·∇v is responsible for much of the richness of turbulence.'},
    {f:'Re = ρvL/μ',n:'Reynolds Number',x:'Ratio of inertial to viscous forces.',d:'Low Re flows are smooth and laminar; high Re flows tend toward chaotic turbulence.'},
    {f:'∂v/∂t + (v·∇)v = −∇Φ',n:'Euler Flow',x:'Ideal, inviscid fluid motion under a potential force.',d:'Set viscosity to zero in Navier-Stokes. This approximation is useful for large-scale astrophysical flows.'},
  ]},
]},
{id:18,title:'Optics & Photonics',basic:'Light as a wave, a ray, and a quantum of the electromagnetic field.',tags:['Interference','Lenses','Photons'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'Light and Vision',desc:'The equations behind imaging, colour, diffraction, and optical instruments.',eqs:[
    {f:'n₁ sinθ₁ = n₂ sinθ₂',n:"Snell's Law",x:'Refraction at the boundary between two transparent media.',d:'Light bends because its phase velocity changes between media. Total internal reflection follows when θ exceeds the critical angle.'},
    {f:'1/f = 1/u + 1/v',n:'Thin Lens Equation',x:'Relates focal length to object and image distances.',d:'The sign convention identifies real and virtual images. Magnification is m = −v/u.'},
    {f:'d sinθ = mλ',n:'Diffraction Grating',x:'Bright interference maxima from a periodic array of slits.',d:'Higher orders and smaller wavelengths spread farther from the central maximum.'},
    {f:'E = hν = hc/λ',n:'Photon Energy',x:'Energy carried by one quantum of electromagnetic radiation.',d:'Shorter-wavelength photons carry more energy. This links spectroscopy to atomic structure.'},
  ]},
]},
{id:19,title:'Particle Physics',basic:'The fields, symmetries, and collisions that build the Standard Model.',tags:['Quarks','Gauge Fields','Collider'],badge:'badge-space',field:'Frontier Physics',concepts:[
  {title:'The Standard Model',desc:'A compact map of the particles and interactions visible to modern detectors.',eqs:[
    {f:'E² = p²c² + m²c⁴',n:'Relativistic Dispersion',x:'Energy, momentum, and rest mass for any particle.',d:'For a massless particle E = pc. For a particle at rest p = 0, the relation becomes E = mc².'},
    {f:'L = −¼Fᵃ_μνFᵃ^μν + ψ̄(iγᵘDᵤ − m)ψ',n:'Gauge Field Lagrangian',x:'A compact expression for fields, matter, and their coupling.',d:'The Lagrangian encodes the Standard Model symmetries and produces equations of motion through the action principle.'},
    {f:'σ = N/(L·ε)',n:'Collider Cross-Section',x:'Converts detected event counts into an interaction probability.',d:'N is the background-subtracted event yield, L the integrated luminosity, and ε the total detection efficiency.'},
    {f:'α = e²/(4πε₀ℏc) ≈ 1/137',n:'Fine-Structure Constant',x:'Dimensionless strength of electromagnetic interactions.',d:'Its small value makes perturbative quantum electrodynamics extraordinarily accurate.'},
  ]},
]},
{id:20,title:'Mathematical Physics',basic:'The structures and symmetries that let physics turn intuition into prediction.',tags:['Lagrangian','Fourier','Symmetry'],badge:'badge-physics',field:'Physics',concepts:[
  {title:'Principles and Transforms',desc:'Reusable mathematical languages shared by mechanics, waves, and fields.',eqs:[
    {f:'δS = 0',n:'Principle of Stationary Action',x:'Physical paths make the action stationary under small variations.',d:'With S = ∫L dt, this produces the Euler-Lagrange equations and unifies many areas of physics.'},
    {f:'d/dt(∂L/∂q̇) − ∂L/∂q = 0',n:'Euler-Lagrange Equation',x:'The equation of motion for a generalized coordinate q.',d:'Choose a Lagrangian L = T − V and the correct coordinates; the resulting equation respects constraints naturally.'},
    {f:'F(k) = ∫ f(x)e^(−ikx) dx',n:'Fourier Transform',x:'Decomposes a signal into its spatial or temporal frequencies.',d:'The same wave can be understood as a localized pulse in x or a spectrum in k. Both descriptions are equivalent.'},
    {f:'[A,B] = AB − BA',n:'Commutator',x:'Measures whether two operations can be performed in either order.',d:'Non-zero commutators are the algebraic heart of quantum uncertainty and angular momentum.'},
  ]},
]},
];

/* Expand the hand-curated core into a searchable applied atlas. These are
   parameterised worked cases, not blank placeholders: every entry carries a
   domain, a concrete formula, a use case, and an explanation. */
const EQUATION_EXPANSION_SETS={
  mechanics:{
    concept:'Applied Mechanics Lab',
    desc:'Worked motion, force, momentum, and energy cases with changing physical parameters.',
    families:[
      {sim:'motion',make:i=>{const u=2+(i%10)*2,a=.5+(i%8)*.5,t=1+(i%6);return {f:`v = ${u} + (${a})t`,n:`Constant Acceleration Case ${i+1}`,x:`A body starts at ${u} m/s and accelerates at ${a} m/s² for ${t} s.`,d:`Use v = u + at. Substituting u=${u} m/s, a=${a} m/s², and t=${t} s gives the final velocity. The same relationship powers the live motion simulation.`};}},
      {sim:'motion',make:i=>{const u=1+(i%7),a=1+(i%5),t=2+(i%7);return {f:`s = (${u})t + ½(${a})t²`,n:`Displacement Case ${i+1}`,x:`Find displacement after ${t} s from u=${u} m/s with a=${a} m/s².`,d:`The first term is the distance carried by the initial velocity; the second is the extra distance accumulated through acceleration.`};}},
      {sim:'force',make:i=>{const m=2+(i%9)*2,a=1+(i%6);return {f:`F = (${m} kg)(${a} m/s²)`,n:`Net Force Case ${i+1}`,x:`A ${m} kg body accelerates at ${a} m/s².`,d:`Newton's second law converts the motion into a net force: F = ma. The simulation draws the force arrow and the resulting acceleration.`};}},
      {sim:'orbit',make:i=>{const m=1+(i%8),v=3+(i%9);return {f:`p = (${m} kg)(${v} m/s)`,n:`Momentum Case ${i+1}`,x:`Linear momentum for mass ${m} kg moving at ${v} m/s.`,d:`Momentum is mass multiplied by velocity. It is conserved when the net external impulse on a system is zero.`};}}
    ]
  },
  thermo:{
    concept:'Applied Thermodynamics Lab',
    desc:'Concrete thermal, gas, entropy, and efficiency cases for intuition and calculation.',
    families:[
      {sim:'gas',make:i=>{const n=1+(i%4),T=250+(i%8)*50,V=10+(i%6)*5;return {f:`P = (${n})R(${T})/(${V})`,n:`Ideal Gas Case ${i+1}`,x:`Pressure for ${n} mol at ${T} K in ${V} L.`,d:`The ideal gas law links microscopic thermal motion to macroscopic pressure. Increasing T or n raises P; increasing V lowers it.`};}},
      {sim:'thermo',make:i=>{const m=1+(i%6),c=420+(i%5)*80,dT=10+(i%7)*10;return {f:`Q = (${m})(${c})(${dT})`,n:`Heating Case ${i+1}`,x:`Heat ${m} kg with specific heat ${c} J/(kg K) through ${dT} K.`,d:`Q = mcΔT counts the energy stored as random microscopic motion. The simulation shows particles moving faster as temperature rises.`};}},
      {sim:'thermo',make:i=>{const Th=500+(i%7)*100,Tc=200+(i%5)*40;return {f:`η = 1 − ${Tc}/${Th}`,n:`Carnot Engine Case ${i+1}`,x:`Ideal efficiency between ${Th} K and ${Tc} K reservoirs.`,d:`Carnot efficiency is a thermodynamic ceiling. No heat engine between these temperatures can exceed it.`};}},
      {sim:'thermo',make:i=>{const Q=100+(i%8)*50,T=250+(i%6)*50;return {f:`ΔS = ${Q}/${T}`,n:`Entropy Transfer Case ${i+1}`,x:`Reversible heat transfer of ${Q} J at ${T} K.`,d:`For reversible transfer, entropy change is heat divided by absolute temperature. Entropy tracks energy dispersal, not simply energy amount.`};}}
    ]
  },
  electromagnetism:{
    concept:'Applied Electromagnetism Lab',
    desc:'Field, circuit, power, and wave cases showing how electromagnetic quantities respond.',
    families:[
      {sim:'field',make:i=>{const q1=2+(i%6),q2=1+(i%5),r=1+(i%7);return {f:`F = k(${q1} μC)(${q2} μC)/(${r} m)²`,n:`Coulomb Field Case ${i+1}`,x:`Electrostatic force between charges ${q1} μC and ${q2} μC separated by ${r} m.`,d:`The inverse-square law makes nearby charges dominate. Field arrows in the simulation grow denser and brighter near the source.`};}},
      {sim:'circuit',make:i=>{const R=2+(i%8),I=1+(i%6);return {f:`V = (${I} A)(${R} Ω)`,n:`Ohmic Circuit Case ${i+1}`,x:`Voltage across a ${R} Ω resistor carrying ${I} A.`,d:`Ohm's law describes a linear resistor. The live circuit view couples current, voltage, and dissipated power.`};}},
      {sim:'circuit',make:i=>{const V=5+(i%8)*5,I=1+(i%5);return {f:`P = (${V} V)(${I} A)`,n:`Electrical Power Case ${i+1}`,x:`Power delivered at ${V} V and ${I} A.`,d:`P = VI measures the rate at which electrical energy is transferred. It is also I²R or V²/R for a resistor.`};}},
      {sim:'wave',make:i=>{const lambda=.25+(i%8)*.25,f=2+(i%7);return {f:`c = (${lambda} m)(${f} Hz)`,n:`Wave Speed Case ${i+1}`,x:`A wave with wavelength ${lambda} m and frequency ${f} Hz.`,d:`Wave speed is wavelength multiplied by frequency. The animated crest spacing and oscillation rate update together.`};}}
    ]
  },
  relativity:{
    concept:'Applied Relativity Lab',
    desc:'Visual cases for time, length, energy, and momentum at high speed.',
    families:[
      {sim:'relativity',make:i=>{const beta=.1+(i%8)*.1;return {f:`γ = 1/√(1−${beta}²)`,n:`Lorentz Factor Case ${i+1}`,x:`Time and length effects at v = ${beta}c.`,d:`The Lorentz factor grows nonlinearly as velocity approaches c. The simulation shows a clock slowing and a moving rod contracting.`};}},
      {sim:'relativity',make:i=>{const m=.5+(i%8)*.5;return {f:`E = (${m} kg)c²`,n:`Mass-Energy Case ${i+1}`,x:`Rest energy equivalent of ${m} kg of mass.`,d:`Mass and energy are two descriptions of the same conserved quantity. The scene converts a compact mass core into an expanding energy field.`};}},
      {sim:'relativity',make:i=>{const m=1+(i%7),beta=.1+(i%7)*.1;return {f:`p = γ(${m} kg)(${beta}c)`,n:`Relativistic Momentum Case ${i+1}`,x:`Momentum of a ${m} kg object at ${beta}c.`,d:`Unlike classical momentum, relativistic momentum keeps increasing sharply near the speed limit.`};}},
      {sim:'relativity',make:i=>{const t=1+(i%8);return {f:`Δt = γ(${t} s)`,n:`Time Dilation Case ${i+1}`,x:`A proper time interval of ${t} s measured by a moving clock.`,d:`An observer moving relative to the clock measures a longer interval. The result is not a visual illusion; it is a spacetime measurement.`};}}
    ]
  },
  quantum:{
    concept:'Applied Quantum Lab',
    desc:'Wave, photon, uncertainty, and bound-state cases with visual probability dynamics.',
    families:[
      {sim:'quantum',make:i=>{const f=4+(i%8),h=6.626e-34;return {f:`E = h(${f} × 10¹⁴ Hz)`,n:`Photon Energy Case ${i+1}`,x:`Energy of light at frequency ${f} × 10¹⁴ Hz.`,d:`Photon energy is proportional to frequency. The simulation shows discrete packets arriving at a detector rather than a continuous classical stream.`};}},
      {sim:'quantum',make:i=>{const p=1+(i%8);return {f:`λ = h/(${p} × 10⁻²⁴ kg m/s)`,n:`Matter Wave Case ${i+1}`,x:`de Broglie wavelength for momentum ${p} × 10⁻²⁴ kg m/s.`,d:`Every moving object has a matter wavelength, but it becomes visible only when the momentum is small enough.`};}},
      {sim:'quantum',make:i=>{const dx=.2+(i%8)*.2;return {f:`Δp ≥ ℏ/(2 × ${dx} nm)`,n:`Uncertainty Case ${i+1}`,x:`Minimum momentum spread when position spread is ${dx} nm.`,d:`Sharper localisation requires a wider momentum distribution. The wave packet visibly narrows and broadens in the simulation.`};}},
      {sim:'quantum',make:i=>{const n=1+(i%7);return {f:`Eₙ = −13.6/${n}² eV`,n:`Hydrogen Level Case ${i+1}`,x:`Bound-state energy for principal quantum number n=${n}.`,d:`Allowed atomic energies are discrete. Transitions happen when a photon supplies exactly the gap between two levels.`};}}
    ]
  },
  gravity:{
    concept:'Applied Gravity & Cosmology Lab',
    desc:'Orbital, escape, expansion, and density cases across planetary and cosmic scales.',
    families:[
      {sim:'orbit',make:i=>{const M=1+(i%8),r=1+(i%7);return {f:`F = G(${M} M☉)m/(${r} AU)²`,n:`Gravity Field Case ${i+1}`,x:`Gravitational pull at ${r} AU from a ${M} solar-mass body.`,d:`Gravity weakens with the square of distance. The orbit simulation turns this gradient into curved trajectories.`};}},
      {sim:'orbit',make:i=>{const M=1+(i%9),r=1+(i%8);return {f:`v = √(G(${M} M☉)/(${r} AU))`,n:`Orbital Velocity Case ${i+1}`,x:`Circular speed at ${r} AU around ${M} solar masses.`,d:`Circular orbit speed falls with radius and rises with central mass. The moving body continuously falls while missing the central object.`};}},
      {sim:'expanding',make:i=>{const H=65+(i%8)*2,d=10+(i%7)*10;return {f:`v = (${H} km/s/Mpc)(${d} Mpc)`,n:`Hubble Flow Case ${i+1}`,x:`Recession speed at ${d} Mpc for H₀=${H} km/s/Mpc.`,d:`On very large scales, space itself expands and carries distant galaxies apart. The expanding grid visualises the scale factor.`};}},
      {sim:'expanding',make:i=>{const H=60+(i%7)*3;return {f:`ρc = 3(${H})²/(8πG)`,n:`Critical Density Case ${i+1}`,x:`Density threshold for H₀=${H} km/s/Mpc.`,d:`Critical density separates open, flat, and closed expansion in simple cosmological models.`};}}
    ]
  },
  stellar:{
    concept:'Applied Stellar Physics Lab',
    desc:'Radiation, spectra, stellar lifetimes, and compact-object cases.',
    families:[
      {sim:'star',make:i=>{const R=1+(i%7)*.5,T=3000+(i%8)*1000;return {f:`L = 4π(${R}R☉)²σ(${T}K)⁴`,n:`Stellar Luminosity Case ${i+1}`,x:`Luminosity for radius ${R} R☉ and surface temperature ${T} K.`,d:`A star can be bright because it is large, hot, or both. The star simulation maps temperature to colour and radius to area.`};}},
      {sim:'star',make:i=>{const L=1+(i%8),d=1+(i%7)*2;return {f:`F = (${L}L☉)/(4π(${d} pc)²)`,n:`Inverse-Square Brightness Case ${i+1}`,x:`Observed flux from luminosity ${L} L☉ at ${d} pc.`,d:`The same luminosity looks dimmer as it spreads over larger spherical shells. This is why distance must be calibrated in astronomy.`};}},
      {sim:'star',make:i=>{const T=3000+(i%8)*1000;return {f:`λmax = 2.898×10⁻³/${T}`,n:`Wien Peak Case ${i+1}`,x:`Peak wavelength for a ${T} K blackbody.`,d:`Hotter surfaces peak at shorter, bluer wavelengths; cooler surfaces peak at longer, redder wavelengths.`};}},
      {sim:'star',make:i=>{const M=.5+(i%8)*.5;return {f:`tMS ≈ 10¹⁰(${M})⁻²⋅⁵ yr`,n:`Main-Sequence Lifetime Case ${i+1}`,x:`Approximate lifetime for a ${M} M☉ star.`,d:`Massive stars burn fuel rapidly and die young; low-mass stars trade brilliance for longevity.`};}}
    ]
  },
  waves:{
    concept:'Applied Waves & Optics Lab',
    desc:'Interference, refraction, diffraction, and oscillation cases.',
    families:[
      {sim:'optics',make:i=>{const n1=1,n2=1.2+(i%6)*.1;return {f:`sin θ₂ = (${n1}/${n2}) sin θ₁`,n:`Refraction Case ${i+1}`,x:`Light enters a medium with refractive index ${n2}.`,d:`Snell's law follows from matching the wave phase along a boundary. The ray simulation bends while conserving frequency.`};}},
      {sim:'optics',make:i=>{const d=.5+(i%7)*.5,m=1+(i%4),lambda=.4+(i%6)*.1;return {f:`sin θ = (${m}×${lambda})/${d}`,n:`Diffraction Grating Case ${i+1}`,x:`Order ${m} maximum for spacing ${d} μm and wavelength ${lambda} μm.`,d:`Periodic slits interfere constructively only at selected angles. Higher orders separate colours more strongly.`};}},
      {sim:'wave',make:i=>{const A=.5+(i%6)*.25,f=1+(i%8);return {f:`y = (${A}) sin(2π(${f})t)`,n:`Oscillator Case ${i+1}`,x:`Amplitude ${A} and frequency ${f} Hz.`,d:`Amplitude controls the size of the displacement; frequency controls how quickly the cycle repeats.`};}},
      {sim:'wave',make:i=>{const A=1+(i%5),I=A*A;return {f:`I ∝ (${A})² = ${I}`,n:`Wave Intensity Case ${i+1}`,x:`Relative intensity for amplitude ${A}.`,d:`Wave intensity scales with amplitude squared, so doubling amplitude quadruples transported energy.`};}}
    ]
  },
  plasma:{
    concept:'Applied Plasma & Fluid Lab',
    desc:'Flow, magnetic pressure, waves, and transport cases in conducting fluids.',
    families:[
      {sim:'fluid',make:i=>{const rho=1+(i%6),v=2+(i%7),L=1+(i%5),mu=.5+(i%4)*.25;return {f:`Re = (${rho})(${v})(${L})/${mu}`,n:`Reynolds Flow Case ${i+1}`,x:`Flow with ρ=${rho}, v=${v}, L=${L}, and μ=${mu} in consistent units.`,d:`Reynolds number compares inertial and viscous effects. Low values make smooth streamlines; high values invite eddies.`};}},
      {sim:'field',make:i=>{const B=.01+(i%7)*.01,rho=1+(i%5);return {f:`vA = ${B}/√(μ₀(${rho}))`,n:`Alfvén Wave Case ${i+1}`,x:`Magnetic wave for field ${B} T and density scale ${rho}.`,d:`Magnetic tension acts like an elastic restoring force. The field-line simulation carries a transverse pulse.`};}},
      {sim:'fluid',make:i=>{const v=2+(i%7),rho=1+(i%6);return {f:`q = ½(${rho})(${v})²`,n:`Dynamic Pressure Case ${i+1}`,x:`Flow pressure for density ${rho} and speed ${v}.`,d:`Moving fluid carries kinetic pressure. It rises quadratically with speed, which is why fast winds are powerful.`};}},
      {sim:'fluid',make:i=>{const area=1+(i%5),v=2+(i%6);return {f:`Q = (${area})(${v})`,n:`Continuity Flow Case ${i+1}`,x:`Volume flow through area ${area} at speed ${v}.`,d:`For incompressible flow, the same volume rate must cross every section: narrowing a pipe increases speed.`};}}
    ]
  }
};
const EQUATION_EXPANSION_KEY={1:'mechanics',2:'thermo',3:'electromagnetism',4:'relativity',5:'relativity',6:'quantum',7:'stellar',8:'gravity',9:'gravity',10:'plasma',11:'stellar',12:'gravity',13:'waves',14:'plasma',15:'stellar',16:'plasma',17:'plasma',18:'waves',19:'quantum',20:'quantum'};
function expandEquationCatalogue(){
  DATA.forEach(d=>{
    const set=EQUATION_EXPANSION_SETS[EQUATION_EXPANSION_KEY[d.id]]||EQUATION_EXPANSION_SETS.mechanics;
    if(!set||d.concepts.some(c=>c.title===set.concept))return;
    const current=d.concepts.reduce((sum,c)=>sum+c.eqs.length,0);
    const need=Math.max(56-current,0),eqs=[];
    for(let i=0;i<need;i++){
      const family=set.families[i%set.families.length];
      const generated=family.make(i);
      eqs.push({...generated,source:'applied-catalogue',sim:family.sim||generated.sim||'cosmic'});
    }
    d.concepts.push({title:set.concept,desc:set.desc,eqs});
  });
}
expandEquationCatalogue();
const equationTotal=()=>DATA.reduce((sum,d)=>sum+d.concepts.reduce((n,c)=>n+c.eqs.length,0),0);
document.getElementById('disciplineCount').textContent=DATA.length;
document.getElementById('equationCount').textContent=equationTotal().toLocaleString()+'+';

const TL=[
  {yr:'1687',t:'Classical Mechanics',d:'Newton\'s Principia unifies terrestrial and celestial motion under universal gravitation.'},
  {yr:'1865',t:'Electromagnetism',d:'Maxwell unifies electricity, magnetism, and optics — predicting electromagnetic waves.'},
  {yr:'1905',t:'Special Relativity',d:'Einstein\'s miracle year: E=mc² and the end of absolute space and time.'},
  {yr:'1915',t:'General Relativity',d:'Gravity becomes geometry — spacetime curvature replaces Newton\'s force.'},
  {yr:'1925',t:'Quantum Mechanics',d:'Heisenberg, Schrödinger, and Dirac complete the quantum framework.'},
  {yr:'1929',t:'Expanding Universe',d:'Hubble discovers galaxies recede proportional to distance — the universe had a beginning.'},
  {yr:'1965',t:'CMB Discovery',d:'Penzias & Wilson detect the cosmic microwave background, relic of the Big Bang.'},
  {yr:'1995',t:'First Exoplanet',d:'Mayor & Queloz discover 51 Peg b — a giant planet orbiting a Sun-like star (Nobel 2019).'},
  {yr:'1998',t:'Accelerating Universe',d:'Type Ia supernovae reveal dark energy driving cosmic acceleration (Nobel 2011).'},
  {yr:'2016',t:'Gravitational Waves',d:'LIGO detects GW150914 — two merging black holes 1.3 billion light-years away.'},
  {yr:'2019',t:'Black Hole Image',d:'Event Horizon Telescope images M87* — first direct photograph of a black hole shadow.'},
  {yr:'2022',t:'JWST First Light',d:'James Webb images galaxies less than 300 million years after the Big Bang.'},
];

/* ━━━━━━━━━━━━ RENDER PHYSICS ━━━━━━━━━━━━ */
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

/* ━━━━━━━━━━━━ PHYSICS MODAL ━━━━━━━━━━━━ */
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

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   INTERACTIVE PLOT ENGINE
   Each formula maps (by name) to a definition: { sliders, fn, xLabel, yLabel,
   xRange, yRange, readout }. fn(x, params) -> y. We render axes, grid,
   the curve, and a moving marker. Sliders update the curve live.
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

/* ━━━ Simulation-first animation engine ━━━
   The old stage wrote equation symbols. This stage shows the physical
   mechanism instead: bodies move, fields pulse, packets arrive, and fluids
   flow while the selected relationship is used as the model. */
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

document.getElementById('mclose').addEventListener('click',()=>{$modal.classList.remove('active');document.body.style.overflow='';$dpanel.classList.remove('open');stopEquationSimulation();});
document.getElementById('dp-close').addEventListener('click',()=>{$dpanel.classList.remove('open');document.querySelectorAll('.eq-card').forEach(c=>c.classList.remove('sel'));stopEquationSimulation();});
$modal.addEventListener('click',e=>{if(e.target===$modal){$modal.classList.remove('active');document.body.style.overflow='';$dpanel.classList.remove('open');stopScene3D();stopEquationSimulation();}});
document.getElementById('mclose').addEventListener('click',()=>stopScene3D(),{capture:true});
document.getElementById('dp-close').addEventListener('click',()=>stopScene3D(),{capture:true});

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
  const matches=equationIndex.filter(item=>
    (eqSearchState.discipline==='all'||String(item.discipline.id)===eqSearchState.discipline) &&
    terms.every(term=>item.search.includes(term))
  );
  $eqCount.textContent=`${matches.length} result${matches.length===1?'':'s'}`;
  if(!matches.length){
    $eqResults.innerHTML=`<div class="eq-search-empty">No equations found${eqSearchState.query.trim()?` for “${eqHtml(eqSearchState.query.trim())}”`:''}. Try another concept, symbol, or discipline.</div>`;
    return;
  }
  const visibleMatches=matches.slice(0,240);
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
      if(target)showDetail(item.eq.f,item.eq.n,item.eq.x,item.eq.d,target,item.eq.sim||'');
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

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   3D PHYSICAL SIMULATION ENGINE — dark cosmic / particle / glass
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
let _s3={raf:null,renderer:null,scene:null,cam:null,update:null,ro:null,canvas:null,t0:0};
function stopScene3D(){
  if(_s3.raf)cancelAnimationFrame(_s3.raf);
  if(_s3.ro)_s3.ro.disconnect();
  if(_s3.renderer){_s3.renderer.dispose();}
  if(_s3.scene){_s3.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m.dispose();}});}
  _s3={raf:null,renderer:null,scene:null,cam:null,update:null,ro:null,canvas:null,t0:0};
}
function _starfield(n,radius,sz){
  const g=new THREE.BufferGeometry(),p=new Float32Array(n*3),c=new Float32Array(n*3);
  for(let i=0;i<n;i++){const r=radius*(0.4+Math.random()*0.6),u=Math.random()*2-1,th=Math.random()*Math.PI*2,s=Math.sqrt(1-u*u);
    p[i*3]=r*s*Math.cos(th);p[i*3+1]=r*u;p[i*3+2]=r*s*Math.sin(th);
    const tint=Math.random();c[i*3]=0.7+tint*0.3;c[i*3+1]=0.75+Math.random()*0.25;c[i*3+2]=1;}
  g.setAttribute('position',new THREE.BufferAttribute(p,3));
  g.setAttribute('color',new THREE.BufferAttribute(c,3));
  return new THREE.Points(g,new THREE.PointsMaterial({size:sz,vertexColors:true,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,sizeAttenuation:true,depthWrite:false}));
}
function _glowSphere(r,color,opacity=0.18,layers=4){
  const g=new THREE.Group();
  for(let i=0;i<layers;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(r*(1+i*0.18),32,32),
      new THREE.MeshBasicMaterial({color,transparent:true,opacity:opacity*(1-i/layers),blending:THREE.AdditiveBlending,depthWrite:false}));
    g.add(m);
  }
  return g;
}
function _params(){return (window._plotState&&window._plotState.params)||{};}

/* Per-formula scene builders. Each returns {update(t,p,scrub)} */
const SCENE_BUILDERS={
  // ── Spacetime curvature: E=mc², gravitation, EFE, Schwarzschild ──
  spacetime:(scene,cam)=>{
    cam.position.set(0,3.6,7);cam.lookAt(0,0,0);
    const N=44,size=12;
    const geo=new THREE.PlaneGeometry(size,size,N,N);geo.rotateX(-Math.PI/2);
    const mat=new THREE.MeshBasicMaterial({color:0x60c8f8,wireframe:true,transparent:true,opacity:.55});
    const sheet=new THREE.Mesh(geo,mat);scene.add(sheet);
    const glow=_glowSphere(0.55,0xff8c42,0.28,5);scene.add(glow);
    const core=new THREE.Mesh(new THREE.SphereGeometry(0.32,32,32),new THREE.MeshBasicMaterial({color:0xffd9a8}));scene.add(core);
    // Orbiting particles
    const pts=_starfield(800,18,0.05);scene.add(pts);
    return {update:(t,p)=>{
      const M=Math.max(0.1,(p.m??p.M??p.M0??1));
      const pos=geo.attributes.position;
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),z=pos.getZ(i);
        const r=Math.sqrt(x*x+z*z)+0.4;
        const y=-M*1.6/r + Math.sin(r*1.2-t*1.5)*0.04;
        pos.setY(i,y);
      }
      pos.needsUpdate=true;
      glow.scale.setScalar(0.6+M*0.18);
      sheet.rotation.y=t*0.05;
      pts.rotation.y=t*0.02;
    }};
  },
  // ── Length contraction / Lorentz / time dilation / total energy ──
  rocket:(scene,cam)=>{
    cam.position.set(0,1.4,6);cam.lookAt(0,0,0);
    scene.add(_starfield(1500,40,0.08));
    const body=new THREE.Group();scene.add(body);
    const hull=new THREE.Mesh(new THREE.CapsuleGeometry?new THREE.CapsuleGeometry(0.45,2.2,12,24):new THREE.CylinderGeometry(0.45,0.45,2.6,24),
      new THREE.MeshBasicMaterial({color:0xc9d8ff}));
    hull.rotation.z=Math.PI/2;body.add(hull);
    const nose=new THREE.Mesh(new THREE.ConeGeometry(0.45,0.9,24),new THREE.MeshBasicMaterial({color:0xff8c42}));
    nose.rotation.z=-Math.PI/2;nose.position.x=1.7;body.add(nose);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.6,0.04,12,64),new THREE.MeshBasicMaterial({color:0x60c8f8,transparent:true,opacity:.7,blending:THREE.AdditiveBlending}));
    ring.rotation.y=Math.PI/2;body.add(ring);
    // Trail particles
    const tg=new THREE.BufferGeometry(),tp=new Float32Array(900);
    for(let i=0;i<300;i++){tp[i*3]=-Math.random()*8-1;tp[i*3+1]=(Math.random()-.5)*0.4;tp[i*3+2]=(Math.random()-.5)*0.4;}
    tg.setAttribute('position',new THREE.BufferAttribute(tp,3));
    const trail=new THREE.Points(tg,new THREE.PointsMaterial({size:0.08,color:0xff8c42,transparent:true,opacity:.7,blending:THREE.AdditiveBlending}));
    body.add(trail);
    return {update:(t,p,scrub)=>{
      let beta = p['v/c']??p.beta??p.v??scrub;
      beta=Math.min(0.99,Math.max(0,beta||0.5));
      const gamma=1/Math.sqrt(1-beta*beta);
      body.scale.x=Math.max(0.05,1-beta*0.92);
      ring.scale.set(1,1+beta*0.2,1+beta*0.2);
      const tpos=tg.attributes.position;
      for(let i=0;i<300;i++){tpos.array[i*3]-=0.04*(0.4+beta*4);if(tpos.array[i*3]<-9)tpos.array[i*3]=-1;}
      tpos.needsUpdate=true;
      body.position.y=Math.sin(t*0.6)*0.08;
      body.rotation.y=t*0.05;
      // chromatic shift via material color
      const r=Math.min(1,0.78+beta*0.4),g=Math.max(0.3,0.85-beta*0.5),b=Math.max(0.2,1-beta*0.7);
      hull.material.color.setRGB(r,g,b);
    }};
  },
  // ── Quantum wavefunction ──
  wavefn:(scene,cam)=>{
    cam.position.set(0,3,6);cam.lookAt(0,0.3,0);
    const N=60,size=8;
    const geo=new THREE.PlaneGeometry(size,size,N,N);geo.rotateX(-Math.PI/2);
    const colors=new Float32Array(geo.attributes.position.count*3);
    geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
    const mat=new THREE.MeshBasicMaterial({vertexColors:true,wireframe:true,transparent:true,opacity:.85});
    const surf=new THREE.Mesh(geo,mat);scene.add(surf);
    scene.add(_starfield(700,24,0.05));
    return {update:(t,p)=>{
      const n=Math.max(1,Math.round(p.n||1)),L=Math.max(0.3,p.L||1);
      const pos=geo.attributes.position;
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),z=pos.getZ(i);
        const u=(x+size/2)/size,v=(z+size/2)/size;
        const psi=Math.sin(n*Math.PI*u)*Math.sin(n*Math.PI*v)*Math.cos(t*1.5);
        const y=psi*1.2;
        pos.setY(i,y);
        const a=Math.abs(psi);
        colors[i*3]=0.6+a*0.4;colors[i*3+1]=0.3+a*0.3;colors[i*3+2]=1-a*0.2;
      }
      pos.needsUpdate=true;geo.attributes.color.needsUpdate=true;
      surf.rotation.y=t*0.1;
    }};
  },
  // ── Hydrogen orbital cloud ──
  orbital:(scene,cam)=>{
    cam.position.set(0,0,5.5);cam.lookAt(0,0,0);
    scene.add(_starfield(500,18,0.04));
    const N=4000;const g=new THREE.BufferGeometry(),p=new Float32Array(N*3),c=new Float32Array(N*3);
    g.setAttribute('position',new THREE.BufferAttribute(p,3));
    g.setAttribute('color',new THREE.BufferAttribute(c,3));
    const cloud=new THREE.Points(g,new THREE.PointsMaterial({size:0.04,vertexColors:true,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));
    scene.add(cloud);
    const nucleus=_glowSphere(0.18,0xff8c42,0.5,4);scene.add(nucleus);
    let lastN=-1;
    function rebuild(n){
      for(let i=0;i<N;i++){
        const r=n*n*0.18*(0.5+Math.random()*0.7);
        const u=Math.random()*2-1,th=Math.random()*Math.PI*2,s=Math.sqrt(1-u*u);
        p[i*3]=r*s*Math.cos(th);p[i*3+1]=r*u;p[i*3+2]=r*s*Math.sin(th);
        const t=Math.random();c[i*3]=0.5+t*0.5;c[i*3+1]=0.4+t*0.3;c[i*3+2]=1;
      }
      g.attributes.position.needsUpdate=true;g.attributes.color.needsUpdate=true;
    }
    return {update:(t,p,scrub)=>{
      const n=Math.max(1,Math.round(p.n||(1+scrub*4)));
      if(n!==lastN){rebuild(n);lastN=n;}
      cloud.rotation.y=t*0.15;cloud.rotation.x=Math.sin(t*0.3)*0.3;
    }};
  },
  // ── Gas particles in box (thermo) ──
  gasbox:(scene,cam)=>{
    cam.position.set(4,3,5);cam.lookAt(0,0,0);
    const box=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(4,4,4)),
      new THREE.LineBasicMaterial({color:0x60c8f8,transparent:true,opacity:.5}));
    scene.add(box);
    scene.add(_starfield(300,30,0.04));
    const N=400;const geo=new THREE.BufferGeometry(),pos=new Float32Array(N*3),col=new Float32Array(N*3),vel=new Float32Array(N*3);
    for(let i=0;i<N;i++){pos[i*3]=(Math.random()-.5)*3.6;pos[i*3+1]=(Math.random()-.5)*3.6;pos[i*3+2]=(Math.random()-.5)*3.6;
      vel[i*3]=(Math.random()-.5)*.04;vel[i*3+1]=(Math.random()-.5)*.04;vel[i*3+2]=(Math.random()-.5)*.04;
      col[i*3]=1;col[i*3+1]=.5;col[i*3+2]=.3;}
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const pts=new THREE.Points(geo,new THREE.PointsMaterial({size:0.08,vertexColors:true,transparent:true,opacity:.95,blending:THREE.AdditiveBlending}));
    scene.add(pts);
    return {update:(t,p)=>{
      const T=Math.max(50,p.T||300),V=Math.max(0.4,(p.V||10)/10);
      const speed=0.02+T/600*0.08;
      const half=2*Math.cbrt(V);
      box.scale.setScalar(Math.cbrt(V));
      for(let i=0;i<N;i++){
        for(let k=0;k<3;k++){
          pos[i*3+k]+=vel[i*3+k]*speed*60/30;
          if(Math.abs(pos[i*3+k])>half){pos[i*3+k]=Math.sign(pos[i*3+k])*half;vel[i*3+k]*=-1;}
        }
        const v=Math.hypot(vel[i*3],vel[i*3+1],vel[i*3+2])/0.04;
        col[i*3]=Math.min(1,.4+T/800);col[i*3+1]=.5;col[i*3+2]=Math.max(.2,1-T/1500);
      }
      geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;
      scene.rotation.y=Math.sin(t*0.2)*0.3;
    }};
  },
  // ── EM wave (orthogonal E and B) ──
  emwave:(scene,cam)=>{
    cam.position.set(0,2.5,7);cam.lookAt(0,0,0);
    scene.add(_starfield(500,30,0.05));
    const N=160;
    const eG=new THREE.BufferGeometry(),eP=new Float32Array(N*3);eG.setAttribute('position',new THREE.BufferAttribute(eP,3));
    const bG=new THREE.BufferGeometry(),bP=new Float32Array(N*3);bG.setAttribute('position',new THREE.BufferAttribute(bP,3));
    const eL=new THREE.Line(eG,new THREE.LineBasicMaterial({color:0xff8c42,transparent:true,opacity:.95}));
    const bL=new THREE.Line(bG,new THREE.LineBasicMaterial({color:0x60c8f8,transparent:true,opacity:.95}));
    scene.add(eL);scene.add(bL);
    const axis=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-5,0,0),new THREE.Vector3(5,0,0)]),
      new THREE.LineBasicMaterial({color:0xb47cff,transparent:true,opacity:.4}));scene.add(axis);
    return {update:(t,p)=>{
      const w=Math.max(0.5,p.w||p.B0||1.5);
      for(let i=0;i<N;i++){
        const x=-5+10*i/N;
        const phase=x*1.4-t*w*1.2;
        const a=Math.sin(phase)*1.1;
        eP[i*3]=x;eP[i*3+1]=a;eP[i*3+2]=0;
        bP[i*3]=x;bP[i*3+1]=0;bP[i*3+2]=a;
      }
      eG.attributes.position.needsUpdate=true;
      bG.attributes.position.needsUpdate=true;
      scene.rotation.y=Math.sin(t*0.2)*0.4;
    }};
  },
  // ── Radial point-charge field ──
  efield:(scene,cam)=>{
    cam.position.set(0,2,6);cam.lookAt(0,0,0);
    scene.add(_starfield(400,25,0.04));
    const core=_glowSphere(0.3,0xff8c42,0.4,5);scene.add(core);
    const arrows=new THREE.Group();scene.add(arrows);
    const lines=[];
    for(let i=0;i<24;i++){
      const u=Math.random()*2-1,th=Math.random()*Math.PI*2,s=Math.sqrt(1-u*u);
      const dir=new THREE.Vector3(s*Math.cos(th),u,s*Math.sin(th));
      const g=new THREE.BufferGeometry().setFromPoints([dir.clone().multiplyScalar(0.4),dir.clone().multiplyScalar(2.5)]);
      const ln=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xff8c42,transparent:true,opacity:.6}));
      arrows.add(ln);lines.push({dir,ln});
    }
    return {update:(t,p)=>{
      const Q=p.Q??1;const sign=Q>=0?1:-1;
      core.scale.setScalar(0.6+Math.abs(Q)*0.05);
      lines.forEach((L,i)=>{
        const pulse=0.4+0.6*Math.abs(Math.sin(t*1.5-i*0.3));
        L.ln.material.opacity=0.25+pulse*0.5;
        L.ln.material.color.setHex(sign>0?0xff8c42:0x60c8f8);
      });
      arrows.rotation.y=t*0.08;
    }};
  },
  // ── Expanding universe / Friedmann ──
  expanding:(scene,cam)=>{
    cam.position.set(0,0,8);cam.lookAt(0,0,0);
    const N=2500;const g=new THREE.BufferGeometry(),p=new Float32Array(N*3),c=new Float32Array(N*3),base=new Float32Array(N*3);
    for(let i=0;i<N;i++){
      const r=0.5+Math.random()*4,u=Math.random()*2-1,th=Math.random()*Math.PI*2,s=Math.sqrt(1-u*u);
      const x=r*s*Math.cos(th),y=r*u,z=r*s*Math.sin(th);
      base[i*3]=x;base[i*3+1]=y;base[i*3+2]=z;
      const tint=Math.random();c[i*3]=0.7+tint*0.3;c[i*3+1]=0.5;c[i*3+2]=1;
    }
    g.setAttribute('position',new THREE.BufferAttribute(p,3));
    g.setAttribute('color',new THREE.BufferAttribute(c,3));
    const pts=new THREE.Points(g,new THREE.PointsMaterial({size:0.05,vertexColors:true,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));
    scene.add(pts);
    return {update:(t,p,scrub)=>{
      const a=0.6+(scrub*1.6)+(p.L||0)*0.2;
      for(let i=0;i<N;i++){p[i*3]=base[i*3]*a;p[i*3+1]=base[i*3+1]*a;p[i*3+2]=base[i*3+2]*a;}
      g.attributes.position.needsUpdate=true;
      pts.rotation.y=t*0.04;
    }};
  },
  // ── Binary inspiral + GW ripples ──
  binary:(scene,cam)=>{
    cam.position.set(0,4,6.5);cam.lookAt(0,0,0);
    scene.add(_starfield(700,26,0.05));
    const a=_glowSphere(0.28,0xff8c42,0.5,4),b=_glowSphere(0.28,0x60c8f8,0.5,4);
    scene.add(a);scene.add(b);
    const N=80,size=14;
    const geo=new THREE.PlaneGeometry(size,size,N,N);geo.rotateX(-Math.PI/2);
    const sheet=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xb47cff,wireframe:true,transparent:true,opacity:.35}));
    sheet.position.y=-0.4;scene.add(sheet);
    return {update:(t,p)=>{
      const sep=Math.max(0.6,2.2-Math.sin(t*0.3)*1.4);
      a.position.set(Math.cos(t*1.2)*sep,0,Math.sin(t*1.2)*sep);
      b.position.set(-Math.cos(t*1.2)*sep,0,-Math.sin(t*1.2)*sep);
      const pos=geo.attributes.position;
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),z=pos.getZ(i);
        const r=Math.sqrt(x*x+z*z);
        pos.setY(i,Math.sin(r*1.2-t*3)*0.18*Math.exp(-r*0.12));
      }
      pos.needsUpdate=true;
    }};
  },
  // ── Generic cosmic field (default) ──
  cosmic:(scene,cam)=>{
    cam.position.set(0,1.6,6);cam.lookAt(0,0,0);
    scene.add(_starfield(2000,30,0.06));
    const torus=new THREE.Mesh(new THREE.TorusKnotGeometry(1.1,0.32,180,24),
      new THREE.MeshBasicMaterial({color:0xb47cff,wireframe:true,transparent:true,opacity:.6}));
    scene.add(torus);
    const glow=_glowSphere(1.5,0x60c8f8,0.08,5);scene.add(glow);
    return {update:(t,p,scrub)=>{
      torus.rotation.x=t*0.4;torus.rotation.y=t*0.3;
      torus.scale.setScalar(1+Math.sin(t*0.6)*0.08+(scrub-0.5)*0.4);
    }};
  },
  // ── Pendulum / centripetal / circular orbit ──
  orbit:(scene,cam)=>{
    cam.position.set(0,3,6);cam.lookAt(0,0,0);
    scene.add(_starfield(500,28,0.05));
    const center=_glowSphere(0.35,0xff8c42,0.4,4);scene.add(center);
    const sat=new THREE.Mesh(new THREE.SphereGeometry(0.14,20,20),new THREE.MeshBasicMaterial({color:0x60c8f8}));
    scene.add(sat);
    const trailG=new THREE.BufferGeometry();const trailN=200;const tp=new Float32Array(trailN*3);
    trailG.setAttribute('position',new THREE.BufferAttribute(tp,3));
    const trail=new THREE.Line(trailG,new THREE.LineBasicMaterial({color:0x60c8f8,transparent:true,opacity:.5}));
    scene.add(trail);
    let trailIdx=0;
    return {update:(t,p,scrub)=>{
      const r=Math.max(0.8,(p.r||p.M||1.5)*0.4+1.2);
      const w=1+(scrub||0)*1.5;
      const x=Math.cos(t*w)*r,z=Math.sin(t*w)*r;
      sat.position.set(x,0,z);
      tp[trailIdx*3]=x;tp[trailIdx*3+1]=0;tp[trailIdx*3+2]=z;
      trailIdx=(trailIdx+1)%trailN;trailG.attributes.position.needsUpdate=true;
      trail.geometry.setDrawRange(0,trailN);
    }};
  }
};

const SCENE_MAP={
  // mass-energy & relativity
  'Mass-Energy Equivalence':'spacetime','Total Energy':'rocket','Lorentz Factor':'rocket',
  'Time Dilation':'rocket','Length Contraction':'rocket','Energy-Momentum Relation':'rocket',
  // gravity & cosmology
  "Newton's Law of Gravitation":'spacetime','Einstein Field Equations':'spacetime',
  'Schwarzschild Metric':'spacetime','Gravitational Time Dilation':'spacetime',
  'Friedmann Equation':'expanding','Hubble Law':'expanding','Peters Formula':'binary',
  'Orbital Velocity':'orbit','Escape Velocity':'orbit','Centripetal Acceleration':'orbit',
  // quantum
  'Schrödinger Equation':'wavefn','Expectation Value':'wavefn','Uncertainty Principle':'wavefn',
  'Hydrogen Energy Levels':'orbital',
  // EM
  "Faraday's Law":'emwave','Ampere-Maxwell':'emwave','Speed of Light':'emwave',
  'Gauss (Electric)':'efield','Gauss (Magnetic)':'efield',
  // thermo
  'Ideal Gas Law':'gasbox','Average Kinetic Energy':'gasbox','RMS Speed':'gasbox',
  'First Law':'gasbox','Second Law':'gasbox','Carnot Efficiency':'gasbox',
  // kinematics / Newton — orbit looks great
  "Newton's Second Law":'orbit','Velocity-Time Relation':'orbit','Displacement-Time Relation':'orbit',
  'Velocity-Displacement':'orbit','Projectile Range':'orbit',
  // astro
  'Hydrostatic Equilibrium':'spacetime','Stefan-Boltzmann Law':'cosmic','Chandrasekhar Limit':'cosmic'
};

function buildScene3D(name,formula){
  stopScene3D();
  const canvas=document.getElementById('scene3d-canvas');
  if(!canvas||!window.THREE)return;
  const stage=canvas.parentElement;
  const W=stage.clientWidth||800,H=stage.clientHeight||440;
  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  }catch(error){
    document.getElementById('scene3d-label').textContent='3D SIMULATION UNAVAILABLE · 2D MODEL ACTIVE';
    console.warn('3D simulation unavailable',error);
    return;
  }
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
  renderer.setSize(W,H,false);
  renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(55,W/H,0.1,500);
  const key=SCENE_MAP[name]||'cosmic';
  const builder=SCENE_BUILDERS[key]||SCENE_BUILDERS.cosmic;
  const handle=builder(scene,cam);
  document.getElementById('scene3d-label').textContent=key.toUpperCase()+' · '+name;
  _s3.renderer=renderer;_s3.scene=scene;_s3.cam=cam;_s3.canvas=canvas;_s3.update=handle.update;_s3.t0=performance.now();
  // resize
  _s3.ro=new ResizeObserver(()=>{const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;cam.aspect=w/h;cam.updateProjectionMatrix();renderer.setSize(w,h,false);});
  _s3.ro.observe(stage);
  let scrubT=0;
  const loop=()=>{
    _s3.raf=requestAnimationFrame(loop);
    const t=(performance.now()-_s3.t0)/1000;
    scrubT=(Math.sin(t*0.3)+1)/2; // 0..1 oscillation for auto-scrub
    try{handle.update(t,_params(),scrubT);}catch(e){}
    cam.position.x=Math.cos(t*0.05)*cam.position.length()*0.04+cam.position.x*0.96;
    renderer.render(scene,cam);
  };
  loop();
}
