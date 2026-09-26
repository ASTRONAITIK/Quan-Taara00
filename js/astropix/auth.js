/* ━━━━━━━━━━━━ AUTH — HYBRID ━━━━━━━━━━━━
   Login/register/logout against either a real backend (if detected) or a
   localStorage-only fallback. Used by ai-chat.js (authToken/authUser/
   useBackend) and by 18-app-init.js which calls checkAuth() on load.
   Note: the original bootstrap (window 'load' handler) has been moved to
   18-app-init.js so it can safely reference every module's init function
   after all scripts are loaded. */
let authToken=null,authUser=null,useBackend=false;
let offGroqKey='';try{offGroqKey=localStorage.getItem('qt_groq_key')||'';}catch{}
function localUsers(){try{return JSON.parse(localStorage.getItem('qt_users')||'{}')}catch{return{}}}
function saveLocalUsers(u){localStorage.setItem('qt_users',JSON.stringify(u));}

async function detectBackend(){try{const r=await fetch('/api/public/auth/me',{signal:AbortSignal.timeout(1800)});await r.json();useBackend=true;}catch{useBackend=false;}}

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