/* ━━━━━━━━━━━━ EARTH GLOBE ━━━━━━━━━━━━
   The interactive 3D Earth on #globe-cv: procedural textures, drag/zoom/
   click interaction, weather-pin placement, and the render loop.
   Depends on: THREE, VIEW (02-nav.js), fetchWx() (05-weather.js) which is
   called on click, and eoMarkers hover tooltips filled by 06-eonet.js. */
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