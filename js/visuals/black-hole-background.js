/* ━━━━━━━━━━━━ BLACK HOLE BG ━━━━━━━━━━━━
   Self-contained three.js background scene rendered onto #bg-cv. Wrapped in
   its own IIFE exactly like the original, so it needs no globals from other
   modules other than THREE and the VIEW variable (from 02-nav.js) which it
   reads to pause camera drift while the Earth view is active. */
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