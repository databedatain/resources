// ===================================================================
// VIEWS — sheet management, menus, site info, and view routing
// ===================================================================
function addNewSheet(){const name=prompt('Sheet name:');if(!name)return;const slug=slugify(name);DATA.home.push({sheetName:name,title:name,icon:'📄',status:'live',owner:''});DATA.sheets[slug]={title:name,icon:'📄',status:'live',owner:'',pages:[{blocks:[]}]};sheetBlocks[slug]=[];renderSheetList();toast('Sheet added: '+name)}

function editSheetIcon(slug){
  const entry=DATA.home.find(h=>slugify(h.sheetName)===slug);
  if(!entry)return;
  const icon=prompt('Enter an emoji icon for this sheet:',entry.icon&&!entry.icon.startsWith('<img')?entry.icon:'📄');
  if(icon===null)return;
  entry.icon=icon;
  if(DATA.sheets[slug])DATA.sheets[slug].icon=icon;
  renderSheetEditor(slug);refreshPreview(slug);
}

var STATUSES=['live','in-progress','pending','coming-soon'];
function statusLabel(s){return{'live':'Live','in-progress':'In Progress','pending':'Pending','coming-soon':'Coming Soon'}[s||'live']||'Live'}
function setStatus(idx,newStatus){var e=DATA.home[idx];e.status=newStatus;var slug=slugify(e.sheetName);if(DATA.sheets[slug])DATA.sheets[slug].status=newStatus;renderSheetList();refreshPreview();toast(esc(e.title)+' → '+statusLabel(newStatus))}

function uploadSheetIcon(slug){
  document.getElementById('icon-upload-'+slug).click();
}

function handleSheetIconUpload(ev,slug){
  const file=ev.target.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=function(e){
    const entry=DATA.home.find(h=>slugify(h.sheetName)===slug);
    if(!entry)return;
    const imgTag=`<img src="${e.target.result}" style="width:28px;height:28px;object-fit:contain">`;
    entry.icon=imgTag;
    if(DATA.sheets[slug])DATA.sheets[slug].icon=imgTag;
    renderSheetEditor(slug);refreshPreview(slug);
    toast('Icon updated');
  };
  reader.readAsDataURL(file);
  ev.target.value='';
}

function updateSheetTitle(slug,newTitle){
  const entry=DATA.home.find(h=>slugify(h.sheetName)===slug);
  if(!entry)return;
  entry.title=newTitle;
  if(DATA.sheets[slug])DATA.sheets[slug].title=newTitle;
  refreshPreview(slug);
}
function updateSheetOwner(slug,owner){
  const entry=DATA.home.find(h=>slugify(h.sheetName)===slug);
  if(!entry)return;
  entry.owner=owner;
  if(DATA.sheets[slug])DATA.sheets[slug].owner=owner;
}
function toggleAddMenu(e){e.stopPropagation();document.getElementById('add-menu').classList.toggle('open')}
function closeAddMenu(){const m=document.getElementById('add-menu');if(m)m.classList.remove('open')}
document.addEventListener('click',closeAddMenu);

// ===================================================================
// VIEW MANAGEMENT — site info, navigation, and drop zone
// ===================================================================
function getSiteInfo(){
  if(!DATA.siteInfo)DATA.siteInfo={};
  const d=DATA.siteInfo;
  if(!d.offices)d.offices=[
    {label:'Utica',address:'1002 Oswego St., Utica 13502'},
    {label:'Rome',address:'207 W. Dominick St., Rome 13440'},
    {label:'Herkimer',address:'235 N. Prospect St., Herkimer 13350'}
  ];
  if(!d.hours)d.hours='Mon\u2013Fri 8am \u2013 4:30pm';
  if(!d.phone)d.phone='315-798-8868';
  if(!d.fax)d.fax='315-733-7105';
  if(!d.crisisAddress)d.crisisAddress='1002 Oswego St., Utica 13502';
  if(!d.crisisPhone)d.crisisPhone='315-520-7802';
  if(!d.crisisHours)d.crisisHours='24/7/365';
  if(!d.announcements)d.announcements='Space for news, seasonal updates, new resources, and program highlights.';
  return d;
}

function renderSiteInfo(){
  const el=document.getElementById('editor-body');
  const d=getSiteInfo();
  let officesHTML='';
  d.offices.forEach((o,i)=>{
    officesHTML+=`<div style="display:flex;gap:6px;margin-bottom:6px;align-items:center">
      <input type="text" value="${esc(o.label)}" placeholder="Label" style="width:80px;padding:5px 8px;border:1px solid var(--g200);border-radius:4px;font-size:.82rem" onchange="DATA.siteInfo.offices[${i}].label=this.value">
      <input type="text" value="${esc(o.address)}" placeholder="Address" style="flex:1;padding:5px 8px;border:1px solid var(--g200);border-radius:4px;font-size:.82rem" onchange="DATA.siteInfo.offices[${i}].address=this.value">
      <button onclick="DATA.siteInfo.offices.splice(${i},1);renderSiteInfo()" style="padding:3px 8px;border:1px solid var(--danger);border-radius:4px;background:var(--danger-light);color:var(--danger);font-size:.75rem;cursor:pointer">\u00d7</button>
    </div>`;
  });
  el.innerHTML=`<div style="max-width:600px">
    <h2 style="font-size:1.1rem;color:var(--bd);margin-bottom:1rem;border-bottom:1px solid var(--g200);padding-bottom:.5rem">Site Info</h2>

    <label style="font-weight:700;font-size:.82rem;color:var(--g700);display:block;margin-bottom:4px">Announcements</label>
    <textarea id="si-announcements" rows="3" style="width:100%;padding:8px;border:1px solid var(--g200);border-radius:6px;font-size:.85rem;font-family:inherit;resize:vertical;margin-bottom:1rem" onchange="DATA.siteInfo.announcements=this.value">${esc(d.announcements)}</textarea>

    <label style="font-weight:700;font-size:.82rem;color:var(--g700);display:block;margin-bottom:4px">Offices</label>
    <div id="si-offices">${officesHTML}</div>
    <button onclick="DATA.siteInfo.offices.push({label:'',address:''});renderSiteInfo()" style="padding:4px 12px;border:1px solid var(--accent);border-radius:4px;background:var(--accent-light);color:var(--accent);font-size:.78rem;font-weight:600;cursor:pointer;margin-bottom:1rem">+ Add Office</button>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1rem">
      <div>
        <label style="font-weight:700;font-size:.82rem;color:var(--g700);display:block;margin-bottom:4px">Hours</label>
        <input type="text" value="${esc(d.hours)}" style="width:100%;padding:6px 8px;border:1px solid var(--g200);border-radius:4px;font-size:.85rem" onchange="DATA.siteInfo.hours=this.value">
      </div>
      <div>
        <label style="font-weight:700;font-size:.82rem;color:var(--g700);display:block;margin-bottom:4px">Phone</label>
        <input type="text" value="${esc(d.phone)}" style="width:100%;padding:6px 8px;border:1px solid var(--g200);border-radius:4px;font-size:.85rem" onchange="DATA.siteInfo.phone=this.value">
      </div>
      <div>
        <label style="font-weight:700;font-size:.82rem;color:var(--g700);display:block;margin-bottom:4px">Fax</label>
        <input type="text" value="${esc(d.fax)}" style="width:100%;padding:6px 8px;border:1px solid var(--g200);border-radius:4px;font-size:.85rem" onchange="DATA.siteInfo.fax=this.value">
      </div>
    </div>

    <label style="font-weight:700;font-size:.82rem;color:var(--g700);display:block;margin-bottom:4px;margin-top:.5rem;border-top:1px solid var(--g200);padding-top:.75rem">Crisis Stabilization Center</label>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1rem">
      <div>
        <label style="font-size:.75rem;color:var(--g500);display:block;margin-bottom:2px">Address</label>
        <input type="text" value="${esc(d.crisisAddress)}" style="width:100%;padding:6px 8px;border:1px solid var(--g200);border-radius:4px;font-size:.85rem" onchange="DATA.siteInfo.crisisAddress=this.value">
      </div>
      <div>
        <label style="font-size:.75rem;color:var(--g500);display:block;margin-bottom:2px">Phone</label>
        <input type="text" value="${esc(d.crisisPhone)}" style="width:100%;padding:6px 8px;border:1px solid var(--g200);border-radius:4px;font-size:.85rem" onchange="DATA.siteInfo.crisisPhone=this.value">
      </div>
      <div>
        <label style="font-size:.75rem;color:var(--g500);display:block;margin-bottom:2px">Hours</label>
        <input type="text" value="${esc(d.crisisHours)}" style="width:100%;padding:6px 8px;border:1px solid var(--g200);border-radius:4px;font-size:.85rem" onchange="DATA.siteInfo.crisisHours=this.value">
      </div>
    </div>
  </div>`;
}

function showView(view){
  currentView=view;
  document.querySelectorAll('.top-bar .nav-btn').forEach(b=>b.classList.remove('active'));
  var navId=view==='siteinfo'?'nav-siteinfo':'nav-sheets';
  var nb=document.getElementById(navId);if(nb)nb.classList.add('active');
  var sr=document.getElementById('submit-reminder');if(sr)sr.style.display=dataLoaded?'':'none';
  if(view==='sheets'&&dataLoaded){renderSheetList();refreshPreview()}
  else if(view==='siteinfo'&&dataLoaded){renderSiteInfo();refreshPreview()}
  else if(view==='welcome'){
    document.getElementById('editor-body').innerHTML=`<div class="welcome-screen"><h2>CHBS Resource Hub Editor</h2><p>Load your data to get started.</p><div class="welcome-actions"><button class="welcome-btn primary" onclick="ghLoad()">Load from GitHub</button><button class="welcome-btn" onclick="importJSON()">Import Local JSON File</button><button class="welcome-btn" onclick="importExcel()">Import from Excel/CSV</button><button class="welcome-btn" onclick="startEmpty()">Start Empty</button></div><div class="drop-zone" id="drop-zone">Drop a .json, .xlsx, or .csv file here</div></div>`;
    setupDropZone();
  }
}
function openSheet(slug){currentView=slug;renderSheetEditor(slug);refreshPreview(slug)}
function startEmpty(){if(dataLoaded&&!confirm('This will discard all current data. Continue?'))return;DATA={home:[],sheets:{}};dataLoaded=true;initBlocks();showView('sheets');toast('Started with empty project')}

function setupDropZone(){
  const dz=document.getElementById('drop-zone');
  if(!dz)return;
  ['dragenter','dragover'].forEach(e=>dz.addEventListener(e,ev=>{ev.preventDefault();dz.classList.add('drag-over')}));
  ['dragleave','drop'].forEach(e=>dz.addEventListener(e,ev=>{ev.preventDefault();dz.classList.remove('drag-over')}));
  dz.addEventListener('drop',ev=>{
    const file=ev.dataTransfer.files[0];
    if(!file)return;
    if(file.name.endsWith('.json'))loadJSONFile(file);
    else if(file.name.endsWith('.xlsx')||file.name.endsWith('.xls')||file.name.endsWith('.csv'))loadExcelFile(file);
    else alert('Please drop a .json, .xlsx, or .csv file.');
  });
}
