/* ━━━━━━━━━━━━ WEATHER PANEL ━━━━━━━━━━━━
   WMO weather-code lookup, Open-Meteo forecast fetch/render, and the
   city-search box used on the Earth view. Depends on placePin() from
   04-earth-globe.js (called by fetchWx to drop the marker). */
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