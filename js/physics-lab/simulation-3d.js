/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   3D PHYSICAL SIMULATION ENGINE — dark cosmic / particle / glass
   The "3D Physical Simulation" panel in the equation detail view.
   Depends on THREE and _plotState (14-interactive-plot.js) via _params().
   Called from 13-physics-modal.js's showDetail() via buildScene3D().
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