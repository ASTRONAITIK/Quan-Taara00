/* ━━━━━━━━━━━━ EONET LIVE EVENTS ━━━━━━━━━━━━
   Fetches NASA EONET open events and drops markers on the globe.
   Depends on: earthGrp, eoMarkers, ll2xyz() from 04-earth-globe.js. */
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