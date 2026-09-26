/* ━━━━━━━━━━━━ AI CHAT ━━━━━━━━━━━━
   The ASTROPIX chat widget UI, history panel, and the network-call chain
   (local brain → server model → Ollama → Groq). Depends on:
   localBrain() (08-astropix-brain.js), authToken/authUser/useBackend and
   offGroqKey (07-auth.js). checkAuth()/doLogin()/doRegister() call
   addMsg()/aimsgs from here, so this file should load before 07-auth.js
   is exercised (i.e. before 18-app-init.js calls checkAuth()). */
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