/* ━━━━━━━━━━━━ COSMIC DISPATCH — LIVE SPACE NEWS ━━━━━━━━━━━━ */
const DISPATCH_ENDPOINTS={
  articles:'https://api.spaceflightnewsapi.net/v4/articles/?limit=12&ordering=-published_at',
  blogs:'https://api.spaceflightnewsapi.net/v4/blogs/?limit=12&ordering=-published_at',
  reports:'https://api.spaceflightnewsapi.net/v4/reports/?limit=12&ordering=-published_at'
};
let dispatchType='articles',dispatchCache={},dispatchReady=false;

function initDispatch(){
  if(dispatchReady)return;
  document.querySelectorAll('.dispatch-filter').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(btn.dataset.type===dispatchType)return;
      document.querySelectorAll('.dispatch-filter').forEach(b=>b.classList.toggle('active',b===btn));
      dispatchType=btn.dataset.type;
      loadDispatch();
    });
  });
  document.getElementById('dispatchClose').addEventListener('click',closeDispatch);
  document.getElementById('dispatchOverlay').addEventListener('click',e=>{
    if(e.target.id==='dispatchOverlay')closeDispatch();
  });
  dispatchReady=true;
}

function openDispatch(){
  initDispatch();
  const overlay=document.getElementById('dispatchOverlay');
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  if(!dispatchCache[dispatchType])loadDispatch();
}

function closeDispatch(){
  const overlay=document.getElementById('dispatchOverlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden','true');
  const modalOpen=document.getElementById('modal')?.classList.contains('active');
  const eqOpen=document.getElementById('eqSearchOverlay')?.classList.contains('open');
  if(!modalOpen&&!eqOpen&&typeof VIEW!=='undefined'&&VIEW!=='earth')document.body.style.overflow='';
}

function dispatchTimeAgo(iso){
  const diffMs=Date.now()-new Date(iso).getTime();
  const mins=Math.floor(diffMs/60000);
  if(mins<1)return 'just now';
  if(mins<60)return mins+'m ago';
  const hrs=Math.floor(mins/60);
  if(hrs<24)return hrs+'h ago';
  const days=Math.floor(hrs/24);
  if(days<30)return days+'d ago';
  return new Date(iso).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
}

async function loadDispatch(){
  const body=document.getElementById('dispatchBody');
  if(dispatchCache[dispatchType]){renderDispatch(dispatchCache[dispatchType]);return;}
  body.innerHTML='<div class="dispatch-loading"><div class="dispatch-ring"></div><div>Tuning into mission control…</div></div>';
  try{
    const r=await fetch(DISPATCH_ENDPOINTS[dispatchType],{signal:AbortSignal.timeout(9000)});
    if(!r.ok)throw new Error('bad response');
    const d=await r.json();
    dispatchCache[dispatchType]=d.results||[];
    renderDispatch(dispatchCache[dispatchType]);
  }catch(e){
    body.innerHTML='<div class="dispatch-empty">Signal lost — could not reach the feed. Try again shortly.</div>';
  }
}

function renderDispatch(items){
  const body=document.getElementById('dispatchBody');
  const esc=typeof eqHtml==='function'?eqHtml:(v)=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  if(!items.length){body.innerHTML='<div class="dispatch-empty">Nothing came through on this channel yet.</div>';return;}
  body.innerHTML=items.map(item=>{
    const summary=(item.summary||'').slice(0,150);
    const truncated=item.summary&&item.summary.length>150?'…':'';
    return `<a class="dispatch-card" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">
      ${item.image_url?`<div class="dispatch-thumb" style="background-image:url('${esc(item.image_url)}')"></div>`:'<div class="dispatch-thumb dispatch-thumb-empty">✦</div>'}
      <div class="dispatch-card-body">
        <div class="dispatch-meta"><span class="dispatch-site">${esc(item.news_site||'Unknown source')}</span><span class="dispatch-dot">·</span><span class="dispatch-time">${esc(dispatchTimeAgo(item.published_at))}</span></div>
        <div class="dispatch-title-txt">${esc(item.title)}</div>
        <div class="dispatch-summary">${esc(summary)}${truncated}</div>
      </div>
    </a>`;
  }).join('');
}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&document.getElementById('dispatchOverlay')?.classList.contains('open'))closeDispatch();
});