// ===================================================================
// SAVE / LOAD / IMPORT / EXPORT
// ===================================================================
function exportJSON(){
  for(const slug in sheetBlocks)syncSheetFromBlocks(slug);
  const blob=new Blob([JSON.stringify(DATA,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='chbs-resource-hub-data.json';a.click();toast('JSON saved!');
}

function importJSON(){document.getElementById('json-input').click()}

function initIOListeners(){
  document.getElementById('json-input').addEventListener('change',function(e){
    const file=e.target.files[0];if(!file)return;
    loadJSONFile(file);
    e.target.value='';
  });
  document.getElementById('excel-input').addEventListener('change',function(e){
    const file=e.target.files[0];if(!file)return;
    loadExcelFile(file);
    e.target.value='';
  });
}

function loadJSONFile(file){
  const reader=new FileReader();
  reader.onload=function(ev){
    try{
      DATA=JSON.parse(ev.target.result);
      dataLoaded=true;
      initBlocks();
      showView('sheets');
      toast('Loaded: '+file.name);
    } catch(err){alert('Error: '+err.message)}
  };
  reader.readAsText(file);
}

// ===================================================================
// EXCEL / CSV IMPORT
// ===================================================================
function importExcel(){document.getElementById('excel-input').click()}

function loadExcelFile(file){
  const reader=new FileReader();
  reader.onload=function(ev){
    try{
      const data=new Uint8Array(ev.target.result);
      const wb=XLSX.read(data,{type:'array',codepage:65001});
      // Use first sheet
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(ws,{defval:''});
      processExcelRows(rows);
    } catch(err){alert('Excel import error: '+err.message)}
  };
  reader.readAsArrayBuffer(file);
}

function processExcelRows(rows){
  // Expected columns: Sheet, Type, Question/Title, Content, Name, Services, Phone, Text, Website, Address, City, Hours
  // Normalize column names
  const normalize = h => h.toLowerCase().replace(/[^a-z]/g,'');

  // Group rows by sheet
  const sheetGroups={};
  rows.forEach(row=>{
    const keys=Object.keys(row);
    const get = target => {
      const k=keys.find(k=>normalize(k)===target)||keys.find(k=>normalize(k).includes(target));
      return k?String(row[k]||'').trim():'';
    };
    const sheetName=get('sheet');
    const type=get('type').toUpperCase();
    if(!sheetName)return;
    if(!sheetGroups[sheetName])sheetGroups[sheetName]=[];
    sheetGroups[sheetName].push({
      type,
      questionTitle:get('questiontitle')||get('question')||get('title'),
      content:get('content')||get('answer'),
      name:get('name'),
      services:get('services'),
      phone:get('phone'),
      text:get('text'),
      website:get('website'),
      address:get('address'),
      city:get('city'),
      hours:get('hours'),
      colBreak:get('columnbreak')||get('colbreak')||'0',
      pageBreak:get('pagebreak')||'0'
    });
  });

  const sheetNames=Object.keys(sheetGroups);
  if(sheetNames.length===0){alert('No data found. Make sure your Excel has a "Sheet" column.');return;}

  if(!dataLoaded){DATA={home:[],sheets:{}};dataLoaded=true;}

  let processed=0;
  processNextSheet(0);

  function processNextSheet(i){
    if(i>=sheetNames.length){
      initBlocks();
      showView('sheets');
      toast(`Imported ${processed} sheet(s) from Excel`);
      return;
    }
    const sheetName=sheetNames[i];
    const slug=slugify(sheetName);
    const existing=DATA.sheets[slug];

    if(existing){
      showModal(`Sheet "${sheetName}" already exists`,`What would you like to do with the imported data for this sheet?`,[
        {label:'Replace',cls:'danger',action:()=>{doImportSheet(sheetName,sheetGroups[sheetName],'replace');processed++;dismissModal();processNextSheet(i+1)}},
        {label:'Append',cls:'primary',action:()=>{doImportSheet(sheetName,sheetGroups[sheetName],'append');processed++;dismissModal();processNextSheet(i+1)}},
        {label:'Skip',cls:'',action:()=>{dismissModal();processNextSheet(i+1)}}
      ]);
    } else {
      doImportSheet(sheetName,sheetGroups[sheetName],'replace');
      processed++;
      processNextSheet(i+1);
    }
  }
}

function doImportSheet(sheetName,rows,mode){
  const slug=slugify(sheetName);

  // Build blocks from rows
  const newBlocks=[];
  let currentSection=null;
  let pendingCol=false, pendingPage=false;

  function applyPending(block){
    if(pendingCol){block.newCol=true;pendingCol=false;}
    if(pendingPage){block.newPage=true;pendingPage=false;}
  }

  rows.forEach(row=>{
    switch(row.type){
      case 'FAQ':
        const faqBlock={type:'FAQ',id:uid(),q:row.questionTitle,a:row.content,aHTML:'',spacing:0};
        applyPending(faqBlock);
        newBlocks.push(faqBlock);
        currentSection=null;
        break;
      case 'CALLOUT':
        const callBlock={type:'CALLOUT',id:uid(),title:row.questionTitle,text:row.content,spacing:0};
        applyPending(callBlock);
        newBlocks.push(callBlock);
        currentSection=null;
        break;
      case 'SECTION':
        currentSection={type:'SECTION',id:uid(),title:row.questionTitle,r:[],spacing:0};
        applyPending(currentSection);
        newBlocks.push(currentSection);
        break;
      case 'RESOURCE':
        const res={n:row.name,id:uid()};
        if(row.services)res.s=row.services;
        if(row.phone)res.p=row.phone;
        if(row.text)res.t=row.text;
        if(row.website)res.w=row.website;
        if(row.address)res.a=row.address;
        if(row.city)res.c=row.city;
        if(row.hours)res.h=row.hours;
        if(currentSection){currentSection.r.push(res)}
        else{
          currentSection={type:'SECTION',id:uid(),title:'Resources',r:[res],spacing:0};
          applyPending(currentSection);
          newBlocks.push(currentSection);
        }
        break;
      case 'NOTFINDING':
        const nfBlock={type:'NOTFINDING',id:uid()};
        applyPending(nfBlock);
        newBlocks.push(nfBlock);
        currentSection=null;
        break;
    }
    // Insert layout markers after this row if flagged
    // These set flags on the NEXT content block that gets added
    if(String(row.colBreak)==='1'){pendingCol=true;}
    if(String(row.pageBreak)==='1'){pendingPage=true;}
  });

  // Ensure home entry exists
  if(!DATA.home.find(h=>slugify(h.sheetName)===slug)){
    DATA.home.push({sheetName,title:sheetName,icon:'\u{1F4C4}',status:'live'});
  }

  if(mode==='replace'){
    sheetBlocks[slug]=newBlocks;
  } else {
    // Append
    if(!sheetBlocks[slug])sheetBlocks[slug]=[];
    sheetBlocks[slug]=sheetBlocks[slug].concat(newBlocks);
  }

  // Create sheet data
  const entry=DATA.home.find(h=>slugify(h.sheetName)===slug);
  DATA.sheets[slug]=unflattenBlocks(sheetBlocks[slug],{title:entry.title,icon:entry.icon,status:entry.status});
}

// ===================================================================
// CSV EXPORT
// ===================================================================
function exportCSV(){
  for(const slug in sheetBlocks)syncSheetFromBlocks(slug);

  const csvRows=[['Sheet','Type','Question/Title','Content','Name','Services','Phone','Text','Website','Address','City','Hours','Column Break','Page Break']];

  DATA.home.forEach(entry=>{
    const slug=slugify(entry.sheetName);
    const blocks=sheetBlocks[slug]||[];
    blocks.forEach((b,i)=>{
      // Look ahead: is the NEXT block a COLBREAK or PAGE?
      const nextBlock=blocks[i+1];
      const colBreak=(nextBlock&&nextBlock.type==='COLBREAK')?1:0;
      const pageBreak=(nextBlock&&nextBlock.type==='PAGE')?1:0;
      switch(b.type){
        case 'FAQ':
          csvRows.push([entry.sheetName,'FAQ',b.q,b.a,'','','','','','','','',colBreak,pageBreak]);
          break;
        case 'CALLOUT':
          csvRows.push([entry.sheetName,'CALLOUT',b.title,b.text,'','','','','','','','',colBreak,pageBreak]);
          break;
        case 'SECTION':
          csvRows.push([entry.sheetName,'SECTION',b.title,'','','','','','','','','',colBreak,pageBreak]);
          (b.r||[]).forEach(r=>{
            csvRows.push([entry.sheetName,'RESOURCE','','',(r.n||''),(r.s||''),(r.p||''),(r.t||''),(r.w||''),(r.a||''),(r.c||''),(r.h||''),0,0]);
          });
          break;
        case 'NOTFINDING':
          csvRows.push([entry.sheetName,'NOTFINDING','','','','','','','','','','',colBreak,pageBreak]);
          break;
        // Skip COLBREAK, PAGE, SPACER — represented via the columns on other rows
      }
    });
  });

  const csvContent=csvRows.map(row=>row.map(cell=>'"'+String(cell).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob=new Blob(['\uFEFF'+csvContent],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='chbs-resource-hub-data.csv';a.click();
  toast('CSV exported!');
}

// ===================================================================
// MODAL
// ===================================================================
function showModal(title,message,buttons){
  const root=document.getElementById('modal-root');
  let btns=buttons.map(b=>`<button class="${b.cls}" onclick="(${b.action.toString()})()">${b.label}</button>`).join('');
  root.innerHTML=`<div class="modal-overlay" onclick="dismissModal()"><div class="modal" onclick="event.stopPropagation()"><h3>${title}</h3><p>${message}</p><div class="modal-actions">${btns}</div></div></div>`;
  // Store button actions globally for onclick
  window._modalActions=buttons;
  // Re-render with proper handlers
  root.querySelector('.modal').innerHTML=`<h3>${title}</h3><p>${message}</p><div class="modal-actions"></div>`;
  const actionsDiv=root.querySelector('.modal-actions');
  buttons.forEach(b=>{
    const btn=document.createElement('button');
    btn.className=b.cls;
    btn.textContent=b.label;
    btn.onclick=b.action;
    actionsDiv.appendChild(btn);
  });
}

function dismissModal(){document.getElementById('modal-root').innerHTML=''}
