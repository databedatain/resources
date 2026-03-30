// ===================================================================
// GITHUB API — load/save working.json, publish, token management
// ===================================================================
const GH_REPO = 'databedatain/resources';
const GH_BRANCH = 'main';
const GH_WORKING = 'data/working.json';
const GH_PUBLISHED = 'data/published.json';
const GH_BACKUP_PREFIX = 'data/working.backup';
const PUBLISH_ADMINS = ['databedatain']; // GitHub usernames allowed to publish

let ghToken = localStorage.getItem('chbs-gh-token') || '';
let ghFileSha = {};
let lastSavedJSON = '';
let ghBackups = []; // In-memory stack of previous versions (max 3)

function u8ToB64(s){return btoa(unescape(encodeURIComponent(s)))}
function b64ToU8(b){return decodeURIComponent(escape(atob(b.replace(/\s/g,''))))}

async function sha256(str){
  const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function updateGhStatus(state){
  const el=document.getElementById('gh-status');
  if(!el)return;
  el.className='gh-status '+(state||'');
  const labels={connected:'Connected',loading:'Loading...',error:'Error',saving:'Saving...',publishing:'Publishing...'};
  el.querySelector('.dot');
  el.innerHTML='<span class="dot"></span> '+(labels[state]||'GitHub');
  el.title='GitHub: '+(labels[state]||'Not connected');
}

function toggleGhToken(){
  const row=document.getElementById('gh-token-row');
  if(row.style.display==='none'){
    row.style.display='flex';
    const inp=document.getElementById('gh-token-input');
    if(ghToken)inp.value=ghToken;
    inp.focus();
  } else {
    row.style.display='none';
  }
}

function saveGhToken(){
  const inp=document.getElementById('gh-token-input');
  ghToken=inp.value.trim();
  if(ghToken){
    localStorage.setItem('chbs-gh-token',ghToken);
    updateGhStatus('connected');
    toast('GitHub token saved');
  }
  document.getElementById('gh-token-row').style.display='none';
}

function clearGhToken(){
  ghToken='';
  localStorage.removeItem('chbs-gh-token');
  document.getElementById('gh-token-input').value='';
  document.getElementById('gh-token-row').style.display='none';
  updateGhStatus('');
  toast('GitHub token cleared');
}

async function ghApi(method,path,body){
  const url='https://api.github.com/repos/'+GH_REPO+'/contents/'+path+(method==='GET'?'?ref='+GH_BRANCH:'');
  const opts={method,headers:{'Authorization':'token '+ghToken,'Accept':'application/vnd.github.v3+json'}};
  if(body){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body);}
  const r=await fetch(url,opts);
  if(r.status===404)return null;
  if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.message||('HTTP '+r.status));}
  return r.json();
}

async function ghGetFile(path){
  const f=await ghApi('GET',path);
  if(!f)return null;
  ghFileSha[path]=f.sha;
  return{content:b64ToU8(f.content),sha:f.sha};
}

async function ghPutFile(path,content,msg){
  // Always fetch current SHA before writing to avoid stale SHA errors
  try{
    const existing=await ghApi('GET',path);
    if(existing&&existing.sha)ghFileSha[path]=existing.sha; else delete ghFileSha[path];
  }catch(e){delete ghFileSha[path];}
  const body={message:msg,content:u8ToB64(content),branch:GH_BRANCH};
  if(ghFileSha[path])body.sha=ghFileSha[path];
  const r=await ghApi('PUT',path,body);
  if(r&&r.content)ghFileSha[path]=r.content.sha;
  return r;
}

async function ghGetDir(path){
  return ghApi('GET',path);
}

// --- Load from GitHub ---
async function ghLoad(){
  if(!ghToken){toggleGhToken();toast('Enter a GitHub token first');return;}
  updateGhStatus('loading');
  try{
    // Cache SHAs from data directory
    try{
      const dir=await ghGetDir('data');
      if(Array.isArray(dir))dir.forEach(f=>{ghFileSha['data/'+f.name]=f.sha;});
    }catch(e){}
    const file=await ghGetFile(GH_WORKING);
    if(!file){
      updateGhStatus('connected');
      toast('No working.json found on GitHub. Starting fresh.');
      return;
    }
    DATA=JSON.parse(file.content);
    lastSavedJSON=file.content;
    dataLoaded=true;
    initBlocks();
    showView('sheets');
    updateGhStatus('connected');
    toast('Loaded from GitHub');
  }catch(err){
    updateGhStatus('error');
    alert('GitHub load error: '+err.message);
  }
}

// --- Save to GitHub with backup rotation ---
async function ghSave(){
  if(!ghToken){toggleGhToken();toast('Enter a GitHub token first');return;}
  for(const slug in sheetBlocks)syncSheetFromBlocks(slug);
  const newContent=JSON.stringify(DATA,null,2);
  updateGhStatus('saving');
  try{
    // Push previous version onto backup stack
    if(lastSavedJSON){
      ghBackups.unshift(lastSavedJSON);
      if(ghBackups.length>3)ghBackups=ghBackups.slice(0,3);
    }
    // Save working.json
    await ghPutFile(GH_WORKING,newContent,'Update working.json');
    // Save backup files (up to 3)
    for(let i=0;i<ghBackups.length;i++){
      const bkPath=GH_BACKUP_PREFIX+'.'+(i+1)+'.json';
      await ghPutFile(bkPath,ghBackups[i],'Backup '+(i+1));
    }
    lastSavedJSON=newContent;
    updateGhStatus('connected');
    toast('Saved to GitHub ('+ghBackups.length+' backup'+(ghBackups.length!==1?'s':'')+')');
  }catch(err){
    updateGhStatus('error');
    alert('GitHub save error: '+err.message);
  }
}

// --- Publish: admin promotes working → published.json (site loads it dynamically) ---
async function ghPublish(){
  if(!ghToken){toggleGhToken();toast('Enter a GitHub token first');return;}
  if(!dataLoaded){toast('Load data first');return;}
  // Check GitHub identity against allowed publishers
  try{
    const resp=await fetch('https://api.github.com/user',{headers:{'Authorization':'token '+ghToken,'Accept':'application/vnd.github.v3+json'}});
    if(!resp.ok)throw new Error('Could not verify identity');
    const user=await resp.json();
    if(PUBLISH_ADMINS.length>0&&!PUBLISH_ADMINS.includes(user.login)){
      alert('Publishing is restricted. Your GitHub account ('+user.login+') is not authorized to publish.');
      return;
    }
    if(!confirm('Publish working data to the live site as '+user.login+'?'))return;
  }catch(err){
    alert('Could not verify GitHub identity: '+err.message);
    return;
  }
  for(const slug in sheetBlocks)syncSheetFromBlocks(slug);
  prepareDataForExport();
  const content=JSON.stringify(DATA,null,2);
  updateGhStatus('publishing');
  try{
    // Save to published.json — the live site fetches this dynamically
    await ghPutFile(GH_PUBLISHED,content,'Promote working to published');
    // Also save working.json
    await ghPutFile(GH_WORKING,content,'Sync working.json on publish');
    lastSavedJSON=content;
    updateGhStatus('connected');
    toast('Published successfully!');
  }catch(err){
    updateGhStatus('error');
    alert('Publish error: '+err.message);
  }
}

// Auto-load on startup if token exists
async function ghAutoLoad(){
  if(!ghToken)return false;
  updateGhStatus('loading');
  try{
    try{
      const dir=await ghGetDir('data');
      if(Array.isArray(dir))dir.forEach(f=>{ghFileSha['data/'+f.name]=f.sha;});
    }catch(e){}
    const file=await ghGetFile(GH_WORKING);
    if(file){
      DATA=JSON.parse(file.content);
      lastSavedJSON=file.content;
      dataLoaded=true;
      initBlocks();
      showView('sheets');
      updateGhStatus('connected');
      toast('Auto-loaded from GitHub');
      return true;
    }
    updateGhStatus('connected');
    return false;
  }catch(err){
    updateGhStatus('error');
    return false;
  }
}
