/* ━━━━━━━━━━━━ EQUATION ARCHIVE SEARCH ━━━━━━━━━━━━
   The "/" or ⌘K full-text search overlay across every equation in DATA
   (11-physics-data.js). Selecting a result opens the discipline modal and
   jumps straight to that equation's detail panel via openModal()/
   showDetail() (13-physics-modal.js). initEquationSearch() is invoked once
   from 18-app-init.js's window 'load' handler. */
const $eqOverlay=document.getElementById('eqSearchOverlay');
const $eqInput=document.getElementById('eqSearchInput');
const $eqFilters=document.getElementById('eqSearchFilters');
const $eqResults=document.getElementById('eqSearchResults');
const $eqCount=document.getElementById('eqSearchCount');
const $eqSearchClose=document.getElementById('eqSearchClose');
const EQ_RESULTS_BATCH=120;
const eqSearchState={query:'',discipline:'all',visibleCount:EQ_RESULTS_BATCH};
let equationIndex=[],lastEquationMatches=[],eqSearchReady=false;

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
    eqSearchState.visibleCount=EQ_RESULTS_BATCH;
    $eqResults.scrollTop=0;
    renderEquationSearch();
  }));
  $eqInput.addEventListener('input',()=>{
    eqSearchState.query=$eqInput.value;
    eqSearchState.visibleCount=EQ_RESULTS_BATCH;
    $eqResults.scrollTop=0;
    renderEquationSearch();
  });
  $eqResults.addEventListener('scroll',()=>{
    const nearBottom=$eqResults.scrollTop+$eqResults.clientHeight>=$eqResults.scrollHeight-120;
    if(!nearBottom||eqSearchState.visibleCount>=lastEquationMatches.length)return;
    eqSearchState.visibleCount=Math.min(eqSearchState.visibleCount+EQ_RESULTS_BATCH,lastEquationMatches.length);
    renderEquationSearch(true);
  });
  $eqSearchClose.addEventListener('click',closeEquationSearch);
  $eqOverlay.addEventListener('click',e=>{if(e.target===$eqOverlay)closeEquationSearch();});
  eqSearchReady=true;
  renderEquationSearch();
}

function renderEquationSearch(preserveScroll=false){
  if(!eqSearchReady)return;
  const previousScrollTop=preserveScroll?$eqResults.scrollTop:0;
  const terms=eqSearchState.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches=equationIndex.filter(item=>
    (eqSearchState.discipline==='all'||String(item.discipline.id)===eqSearchState.discipline) &&
    terms.every(term=>item.search.includes(term))
  );
  lastEquationMatches=matches;
  $eqCount.textContent=`${matches.length} result${matches.length===1?'':'s'}`;
  if(!matches.length){
    $eqResults.innerHTML=`<div class="eq-search-empty">No equations found${eqSearchState.query.trim()?` for “${eqHtml(eqSearchState.query.trim())}”`:''}. Try another concept, symbol, or discipline.</div>`;
    return;
  }
  const visibleMatches=matches.slice(0,eqSearchState.visibleCount);
  const limitNote=matches.length>visibleMatches.length
    ? `<div class="eq-search-limit">Scroll to load more results · ${visibleMatches.length.toLocaleString()} of ${matches.length.toLocaleString()} shown</div>`
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
  if(preserveScroll)$eqResults.scrollTop=previousScrollTop;
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
