// ===================================================================
// RENDER — sheet list, sheet editor, block cards, QR items, resource cards
// ===================================================================
function renderSheetList(){
  const el=document.getElementById('editor-body');
  let html='<div class="sheet-list" id="sheet-list">';
  DATA.home.forEach((entry,i)=>{
    const slug=slugify(entry.sheetName), sheet=DATA.sheets[slug];
    const blocks=sheetBlocks[slug]||[];
    const fC=blocks.filter(b=>b.type==='FAQ').length;
    const sC=blocks.filter(b=>b.type==='SECTION').length;
    const rC=blocks.filter(b=>b.type==='SECTION').reduce((s,b)=>(s+(b.r||[]).length),0);
    const qC=blocks.filter(b=>b.type==='QR').length;
    const pC=sheet?sheet.pages.length:0;
    html+=`<div class="sheet-list-item" draggable="true" data-idx="${i}"
      ondragstart="dragSheetStart(event,${i})" ondragover="dragSheetOver(event,${i})"
      ondragleave="dragSheetLeave(event)" ondrop="dragSheetDrop(event,${i})"
      onclick="openSheet('${slug}')">
      <span class="drag-handle" onclick="event.stopPropagation()" title="Drag to reorder">⠿</span>
      <span class="sli-icon">${entry.icon||'📄'}</span>
      <div class="sli-info">
        <div class="sli-title">${esc(entry.title)}</div>
        <div class="sli-meta">${pC} pg · ${fC} FAQ · ${sC} sec · ${rC} res${qC?' · '+qC+' QR':''}${entry.owner?' · <span class="owner-badge">'+esc(entry.owner)+'</span>':''}</div>
      </div>
      <select class="sli-status-select ${entry.status||'live'}" onclick="event.stopPropagation()" onchange="setStatus(${i},this.value)" title="Change status">
        ${STATUSES.map(s=>'<option value="'+s+'"'+(s===(entry.status||'live')?' selected':'')+'>'+statusLabel(s)+'</option>').join('')}
      </select>
    </div>`;
  });
  html+='</div><div style="margin-top:12px;text-align:center"><button class="add-resource-btn" onclick="addNewSheet()" style="max-width:300px;margin:0 auto">+ Add New Sheet</button></div>';
  el.innerHTML=html;
}

// ===================================================================
// RENDER: Sheet Editor
// ===================================================================
function renderSheetEditor(slug){
  const el=document.getElementById('editor-body');
  const entry=DATA.home.find(h=>slugify(h.sheetName)===slug);
  if(!entry){el.innerHTML='<div class="empty-state"><h3>Sheet not found</h3></div>';return;}
  const blocks=sheetBlocks[slug]||[];
  let html=`<div class="sheet-editor-header">
    <button class="back-btn" onclick="showView('sheets')">← Back</button>
    <span style="font-size:1.4rem;cursor:pointer" onclick="editSheetIcon('${slug}')" title="Click to change emoji icon">${entry.icon&&entry.icon.startsWith('<img')?entry.icon:(entry.icon||'📄')}</span>
    <button style="padding:2px 6px;font-size:.68rem;border:1px solid var(--g200);border-radius:3px;background:var(--wh);color:var(--g500);cursor:pointer" onclick="uploadSheetIcon('${slug}')" title="Upload icon image">📎 Icon</button>
    <input type="file" id="icon-upload-${slug}" accept="image/*" style="display:none" onchange="handleSheetIconUpload(event,'${slug}')">
    <h2>${esc(entry.title)}</h2>
    <input type="text" value="${esc(entry.title)}" onchange="updateSheetTitle('${slug}',this.value)" style="padding:3px 8px;border:1px solid var(--g200);border-radius:4px;font-size:.8rem;width:180px" title="Sheet display title">
    <div class="owner-row">
      <label>Owner</label>
      <input type="text" value="${esc(entry.owner||'')}" onchange="updateSheetOwner('${slug}',this.value)" placeholder="Your name" title="Sheet owner/editor name">
    </div>
    <div class="add-menu">
      <button class="add-btn" onclick="toggleAddMenu(event)">+ Add Block</button>
      <div class="dropdown" id="add-menu">
        <button class="dropdown-item" onclick="addBlock('${slug}','FAQ')"><strong>FAQ Question</strong><small>Question &amp; rich-text answer</small></button>
        <button class="dropdown-item" onclick="addBlock('${slug}','CALLOUT')"><strong>Callout Box</strong><small>Highlighted info box</small></button>
        <button class="dropdown-item" onclick="addBlock('${slug}','QR')"><strong>QR / Image Block</strong><small>QR codes or images with labels</small></button>
        <button class="dropdown-item" onclick="addBlock('${slug}','SECTION')"><strong>Resource Section</strong><small>Group of resources with contact info</small></button>
        <button class="dropdown-item" onclick="addBlock('${slug}','NOTFINDING')"><strong>Not Finding Bar</strong><small>"Not finding what you need?" footer</small></button>
      </div>
    </div>
  </div><div class="block-list" id="block-list">`;
  blocks.forEach((block,i)=>{html+=renderBlockCard(slug,block,i)});
  html+='</div>';
  el.innerHTML=html;
  blocks.forEach((block,i)=>{if(block.type==='FAQ'||block.type==='CALLOUT') initRichText(slug,block,i)});
}

function renderBlockCard(slug,block,idx){
  const isOpen=openBlocks.has(block.id);
  let title='', typeClass=block.type.toLowerCase();
  switch(block.type){
    case 'FAQ': title=block.q||'(untitled question)'; break;
    case 'CALLOUT': title=block.title||'(untitled callout)'; break;
    case 'SECTION': title=(block.title||'(untitled)')+` (${(block.r||[]).length} resources)`; break;
    case 'QR': title=`QR/Image Block (${(block.items||[]).length} items)`; typeClass='qr'; break;
    case 'NOTFINDING': title='"Not Finding?" Bar'; break;
  }
  let bodyHTML='';
  
  if(block.type==='FAQ'){
    const twoColChecked=block.useTwoCol?'checked':'';
    let twoColEditors='';
    if(block.useTwoCol){
      twoColEditors=`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px">
        <div>
          <label style="font-size:.72rem;font-weight:600;color:var(--g400)">LEFT COLUMN</label>
          <div class="rt-toolbar">
            <button onmousedown="event.preventDefault();rtCmdCol('bold','rt-col-left-${block.id}')" title="Bold"><b>B</b></button>
            <button onmousedown="event.preventDefault();rtCmdCol('italic','rt-col-left-${block.id}')" title="Italic"><i>I</i></button>
            <button onmousedown="event.preventDefault();rtCmdCol('underline','rt-col-left-${block.id}')" title="Underline"><u>U</u></button>
            <div class="sep"></div>
            <button onmousedown="event.preventDefault();rtCmdCol('insertUnorderedList','rt-col-left-${block.id}')" title="Bullet List">• List</button>
            <button onmousedown="event.preventDefault();rtCmdCol('insertOrderedList','rt-col-left-${block.id}')" title="Numbered List">1. List</button>
            <div class="sep"></div>
            <button onmousedown="event.preventDefault();rtCmdCol('indent','rt-col-left-${block.id}')" title="Indent">→ In</button>
            <button onmousedown="event.preventDefault();rtCmdCol('outdent','rt-col-left-${block.id}')" title="Outdent">← Out</button>
          </div>
          <div class="rt-editor" id="rt-col-left-${block.id}" contenteditable="true"
            oninput="updateColText('${slug}',${idx},'colLeft','rt-col-left-${block.id}')" style="min-height:60px;border-radius:0 0 4px 4px"></div>
        </div>
        <div>
          <label style="font-size:.72rem;font-weight:600;color:var(--g400)">RIGHT COLUMN</label>
          <div class="rt-toolbar">
            <button onmousedown="event.preventDefault();rtCmdCol('bold','rt-col-right-${block.id}')" title="Bold"><b>B</b></button>
            <button onmousedown="event.preventDefault();rtCmdCol('italic','rt-col-right-${block.id}')" title="Italic"><i>I</i></button>
            <button onmousedown="event.preventDefault();rtCmdCol('underline','rt-col-right-${block.id}')" title="Underline"><u>U</u></button>
            <div class="sep"></div>
            <button onmousedown="event.preventDefault();rtCmdCol('insertUnorderedList','rt-col-right-${block.id}')" title="Bullet List">• List</button>
            <button onmousedown="event.preventDefault();rtCmdCol('insertOrderedList','rt-col-right-${block.id}')" title="Numbered List">1. List</button>
            <div class="sep"></div>
            <button onmousedown="event.preventDefault();rtCmdCol('indent','rt-col-right-${block.id}')" title="Indent">→ In</button>
            <button onmousedown="event.preventDefault();rtCmdCol('outdent','rt-col-right-${block.id}')" title="Outdent">← Out</button>
          </div>
          <div class="rt-editor" id="rt-col-right-${block.id}" contenteditable="true"
            oninput="updateColText('${slug}',${idx},'colRight','rt-col-right-${block.id}')" style="min-height:60px;border-radius:0 0 4px 4px"></div>
        </div>
      </div>`;
    }
    bodyHTML=`
      <div class="field-row"><label>Question</label><input type="text" value="${esc(block.q)}" onchange="updateBlock('${slug}',${idx},'q',this.value)"><select onchange="updateBlock('${slug}',${idx},'headerStyle',this.value)" style="flex:none;width:90px;margin-left:4px"><option value="default" ${block.headerStyle!=='banner'?'selected':''}>Bold</option><option value="banner" ${block.headerStyle==='banner'?'selected':''}>Banner</option></select></div>
      <div style="margin-bottom:4px"><label style="font-size:.75rem;font-weight:600;color:var(--g500)">Answer</label></div>
      <div class="rt-toolbar" id="rt-toolbar-${block.id}">
        <button onmousedown="event.preventDefault();rtCmd('bold','${block.id}')" title="Bold"><b>B</b></button>
        <button onmousedown="event.preventDefault();rtCmd('italic','${block.id}')" title="Italic"><i>I</i></button>
        <button onmousedown="event.preventDefault();rtCmd('underline','${block.id}')" title="Underline"><u>U</u></button>
        <div class="sep"></div>
        <button onmousedown="event.preventDefault();rtCmd('insertUnorderedList','${block.id}')" title="Bullet List">• List</button>
        <button onmousedown="event.preventDefault();rtCmd('insertOrderedList','${block.id}')" title="Numbered List">1. List</button>
        <div class="sep"></div>
        <button onmousedown="event.preventDefault();rtCmd('indent','${block.id}')" title="Indent">→ In</button>
        <button onmousedown="event.preventDefault();rtCmd('outdent','${block.id}')" title="Outdent">← Out</button>
        <div class="sep"></div>
        <button onmousedown="event.preventDefault();clearFormatting('${block.id}')" title="Clear Formatting">✕ Clear</button>
      </div>
      <div class="rt-editor" id="rt-editor-${block.id}" contenteditable="true"
        oninput="updateRichText('${slug}',${idx},'${block.id}')"></div>
      <label style="font-size:.75rem;display:flex;align-items:center;gap:4px;cursor:pointer;color:var(--g500);margin-top:6px"><input type="checkbox" ${twoColChecked} onchange="insertTwoCol('${slug}',${idx},'${block.id}')"> Two-Column Section</label>
      ${twoColEditors}`;
  } else if(block.type==='CALLOUT'){
    const twoColChecked=block.useTwoCol?'checked':'';
    let twoColEditors='';
    if(block.useTwoCol){
      twoColEditors=`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px">
        <div>
          <label style="font-size:.72rem;font-weight:600;color:var(--g400)">LEFT COLUMN</label>
          <div class="rt-toolbar">
            <button onmousedown="event.preventDefault();rtCmdCol('bold','rt-col-left-${block.id}')" title="Bold"><b>B</b></button>
            <button onmousedown="event.preventDefault();rtCmdCol('italic','rt-col-left-${block.id}')" title="Italic"><i>I</i></button>
            <button onmousedown="event.preventDefault();rtCmdCol('underline','rt-col-left-${block.id}')" title="Underline"><u>U</u></button>
            <div class="sep"></div>
            <button onmousedown="event.preventDefault();rtCmdCol('insertUnorderedList','rt-col-left-${block.id}')" title="Bullet List">• List</button>
            <button onmousedown="event.preventDefault();rtCmdCol('indent','rt-col-left-${block.id}')" title="Indent">→ In</button>
            <button onmousedown="event.preventDefault();rtCmdCol('outdent','rt-col-left-${block.id}')" title="Outdent">← Out</button>
          </div>
          <div class="rt-editor" id="rt-col-left-${block.id}" contenteditable="true"
            oninput="updateColText('${slug}',${idx},'colLeft','rt-col-left-${block.id}')" style="min-height:60px;border-radius:0 0 4px 4px"></div>
        </div>
        <div>
          <label style="font-size:.72rem;font-weight:600;color:var(--g400)">RIGHT COLUMN</label>
          <div class="rt-toolbar">
            <button onmousedown="event.preventDefault();rtCmdCol('bold','rt-col-right-${block.id}')" title="Bold"><b>B</b></button>
            <button onmousedown="event.preventDefault();rtCmdCol('italic','rt-col-right-${block.id}')" title="Italic"><i>I</i></button>
            <button onmousedown="event.preventDefault();rtCmdCol('underline','rt-col-right-${block.id}')" title="Underline"><u>U</u></button>
            <div class="sep"></div>
            <button onmousedown="event.preventDefault();rtCmdCol('insertUnorderedList','rt-col-right-${block.id}')" title="Bullet List">• List</button>
            <button onmousedown="event.preventDefault();rtCmdCol('indent','rt-col-right-${block.id}')" title="Indent">→ In</button>
            <button onmousedown="event.preventDefault();rtCmdCol('outdent','rt-col-right-${block.id}')" title="Outdent">← Out</button>
          </div>
          <div class="rt-editor" id="rt-col-right-${block.id}" contenteditable="true"
            oninput="updateColText('${slug}',${idx},'colRight','rt-col-right-${block.id}')" style="min-height:60px;border-radius:0 0 4px 4px"></div>
        </div>
      </div>`;
    }
    bodyHTML=`
      <div class="field-row"><label>Title</label><input type="text" value="${esc(block.title)}" onchange="updateBlock('${slug}',${idx},'title',this.value)"></div>
      <div style="margin-bottom:4px"><label style="font-size:.75rem;font-weight:600;color:var(--g500)">Text</label></div>
      <div class="rt-toolbar" id="rt-toolbar-${block.id}">
        <button onmousedown="event.preventDefault();rtCmd('bold','${block.id}')" title="Bold"><b>B</b></button>
        <button onmousedown="event.preventDefault();rtCmd('italic','${block.id}')" title="Italic"><i>I</i></button>
        <button onmousedown="event.preventDefault();rtCmd('underline','${block.id}')" title="Underline"><u>U</u></button>
        <div class="sep"></div>
        <button onmousedown="event.preventDefault();rtCmd('insertUnorderedList','${block.id}')" title="Bullet List">• List</button>
        <button onmousedown="event.preventDefault();rtCmd('insertOrderedList','${block.id}')" title="Numbered List">1. List</button>
        <div class="sep"></div>
        <button onmousedown="event.preventDefault();rtCmd('indent','${block.id}')" title="Indent">→ In</button>
        <button onmousedown="event.preventDefault();rtCmd('outdent','${block.id}')" title="Outdent">← Out</button>
        <div class="sep"></div>
        <button onmousedown="event.preventDefault();clearFormatting('${block.id}')" title="Clear Formatting">✕ Clear</button>
      </div>
      <div class="rt-editor" id="rt-editor-${block.id}" contenteditable="true"
        oninput="updateCalloutRichText('${slug}',${idx},'${block.id}')"></div>
      <label style="font-size:.75rem;display:flex;align-items:center;gap:4px;cursor:pointer;color:var(--g500);margin-top:6px"><input type="checkbox" ${twoColChecked} onchange="toggleTwoCol('${slug}',${idx})"> Two-Column Section</label>
      ${twoColEditors}`;
  } else if(block.type==='QR'){
    bodyHTML=`<div class="qr-items-list" id="qr-items-${block.id}">`;
    (block.items||[]).forEach((item,ii)=>{
      bodyHTML+=renderQRItemCard(slug,idx,block.id,item,ii);
    });
    bodyHTML+=`</div><button class="add-resource-btn" onclick="addQRItem('${slug}',${idx})">+ Add QR/Image Item</button>`;
  } else if(block.type==='SECTION'){
    bodyHTML=`<div class="field-row"><label>Title</label><input type="text" value="${esc(block.title)}" onchange="updateBlock('${slug}',${idx},'title',this.value)"></div>
      <div id="res-list-${block.id}">`;
    (block.r||[]).forEach((r,ri)=>{bodyHTML+=renderResCard(slug,idx,block.id,r,ri)});
    bodyHTML+=`</div><button class="add-resource-btn" onclick="addResource('${slug}',${idx})">+ Add Resource</button>`;
  } else if(block.type==='NOTFINDING'){
    bodyHTML=`<div style="font-size:.78rem;color:var(--g500);padding:4px 0">Shows the "Not Finding What You Need?" bar.</div>`;
  }

  return `<div class="block-card" data-block-idx="${idx}"
    ondragover="dragBlockOver(event,${idx})"
    ondragleave="dragBlockLeave(event)" ondrop="dragBlockDrop(event,'${slug}',${idx})">
    <div class="block-header" onclick="toggleBlock('${block.id}','${slug}')">
      <span class="bh-drag" draggable="true" ondragstart="dragBlockStart(event,'${slug}',${idx})" onclick="event.stopPropagation()" title="Drag to reorder">⠿</span>
      <span class="bh-type ${typeClass}">${block.type}</span>
      <span class="bh-title">${esc(title)}</span>
      <span class="bh-controls" onclick="event.stopPropagation()">
        <label title="Start New Column"><input type="checkbox" ${block.newCol?'checked':''} onchange="updateBlock('${slug}',${idx},'newCol',this.checked)"> Col</label>
        <label title="Start New Page"><input type="checkbox" ${block.newPage?'checked':''} onchange="updateBlock('${slug}',${idx},'newPage',this.checked)"> Pg</label>
        <span class="bh-spacer-ctl" title="Space after (pt)">+<input type="number" value="${block.spacing||0}" min="0" max="100" step="1" onchange="updateBlock('${slug}',${idx},'spacing',parseFloat(this.value)||0)">pt</span>
      </span>
      <span class="bh-toggle ${isOpen?'open':''}">▶</span>
      <button class="bh-delete" onclick="event.stopPropagation();deleteBlock('${slug}',${idx})" title="Delete">✕</button>
    </div>
    <div class="block-body ${isOpen?'open':''}" id="block-body-${block.id}">${bodyHTML}</div>
  </div>`;
}

// ===================================================================
// QR ITEM rendering
// ===================================================================
function renderQRItemCard(slug,blockIdx,blockId,item,ii){
  const colorOptions = QR_COLORS.map(c=>`<option value="${c.value}" ${item.bgColor===c.value?'selected':''}>${c.name}</option>`).join('');
  const preview = item.imgData ? `<img class="qr-img-preview" src="${item.imgData}" alt="QR">` : '';
  return `<div class="qr-item-card">
    <div class="qr-item-header">
      <span>Item ${ii+1}</span>
      <button onclick="deleteQRItem('${slug}',${blockIdx},${ii})" title="Delete">✕</button>
    </div>
    <div class="qr-item-fields">
      <div class="rf full"><label>Label</label><input value="${esc(item.label||'')}" onchange="updateQRItem('${slug}',${blockIdx},${ii},'label',this.value)"></div>
      <div class="rf"><label>Color</label><select onchange="updateQRItem('${slug}',${blockIdx},${ii},'bgColor',this.value)">${colorOptions}</select></div>
      <div class="rf"><label>Image</label><input type="file" accept="image/*" onchange="loadQRImage(event,'${slug}',${blockIdx},${ii})"></div>
      <div class="rf full">${preview}</div>
    </div>
  </div>`;
}

function addQRItem(slug,blockIdx){
  if(!sheetBlocks[slug][blockIdx].items) sheetBlocks[slug][blockIdx].items=[];
  sheetBlocks[slug][blockIdx].items.push({label:'Scan to Learn More',bgColor:'#1b3a5c',imgData:'',id:uid()});
  syncSheetFromBlocks(slug);renderSheetEditor(slug);refreshPreview(slug);
}

function deleteQRItem(slug,blockIdx,ii){
  sheetBlocks[slug][blockIdx].items.splice(ii,1);
  syncSheetFromBlocks(slug);renderSheetEditor(slug);refreshPreview(slug);
}

function updateQRItem(slug,blockIdx,ii,field,value){
  sheetBlocks[slug][blockIdx].items[ii][field]=value;
  syncSheetFromBlocks(slug);refreshPreview(slug);
  // Re-render to update color preview
  if(field==='bgColor') renderSheetEditor(slug);
}

function loadQRImage(ev,slug,blockIdx,ii){
  const file=ev.target.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=function(e){
    sheetBlocks[slug][blockIdx].items[ii].imgData=e.target.result;
    syncSheetFromBlocks(slug);renderSheetEditor(slug);refreshPreview(slug);
  };
  reader.readAsDataURL(file);
}

// ===================================================================
// RESOURCE CARD rendering
// ===================================================================
function renderResCard(slug,blockIdx,blockId,r,ri){
  const isOpen=openBlocks.has('res_'+blockIdx+'_'+ri);
  // Build move-to options from all SECTION blocks in this sheet
  const sections=sheetBlocks[slug].map((b,i)=>({idx:i,title:b.title,type:b.type})).filter(b=>b.type==='SECTION'&&b.idx!==blockIdx);
  const moveOpts=sections.map(s=>`<option value="${s.idx}">${esc(s.title)}</option>`).join('');
  const moveBtn=moveOpts?`<select onchange="moveResource('${slug}',${blockIdx},${ri},parseInt(this.value));this.selectedIndex=0" style="flex:none;padding:1px 4px;font-size:.68rem;border:1px solid var(--g200);border-radius:3px;color:var(--g500);background:var(--wh)"><option value="">Move to…</option>${moveOpts}</select>`:'';
  return `<div class="res-card" data-res-idx="${ri}"
    ondragover="dragResOver(event,${ri})"
    ondragleave="dragResLeave(event)" ondrop="dragResDrop(event,'${slug}',${blockIdx},${ri})">
    <div class="res-card-header" onclick="toggleResCard(${blockIdx},${ri},'${slug}')" style="cursor:pointer">
      <span class="rc-drag" draggable="true" ondragstart="dragResStart(event,'${slug}',${blockIdx},${ri})" onclick="event.stopPropagation()" title="Drag to reorder">⠿</span>
      <span class="rc-name">${esc(r.n||'(unnamed)')}</span>
      ${moveBtn ? '<span onclick="event.stopPropagation()">'+moveBtn+'</span>' : ''}
      <span class="bh-toggle ${isOpen?'open':''}">▶</span>
      <button class="rc-delete" onclick="event.stopPropagation();deleteResource('${slug}',${blockIdx},${ri})" title="Delete">✕</button>
    </div>
    <div class="res-fields" style="display:${isOpen?'grid':'none'}">
      <div class="rf full"><label>Name</label><input value="${esc(r.n||'')}" oninput="updateRes('${slug}',${blockIdx},${ri},'n',this.value)"></div>
      <div class="rf full"><label>Services</label><input value="${esc(r.s||'')}" oninput="updateRes('${slug}',${blockIdx},${ri},'s',this.value)"></div>
      <div class="rf"><label>Hours</label><input value="${esc(r.h||'')}" oninput="updateRes('${slug}',${blockIdx},${ri},'h',this.value)"></div>
      <div class="rf"><label>Phone</label><input value="${esc(r.p||'')}" oninput="updateRes('${slug}',${blockIdx},${ri},'p',this.value)"></div>
      <div class="rf"><label>Address</label><input value="${esc(r.a||'')}" oninput="updateRes('${slug}',${blockIdx},${ri},'a',this.value)"></div>
      <div class="rf"><label>City</label><input value="${esc(r.c||'')}" oninput="updateRes('${slug}',${blockIdx},${ri},'c',this.value)"></div>
      <div class="rf"><label>Text #</label><input value="${esc(r.t||'')}" oninput="updateRes('${slug}',${blockIdx},${ri},'t',this.value)"></div>
      <div class="rf"><label>Website</label><input value="${esc(r.w||'')}" oninput="updateRes('${slug}',${blockIdx},${ri},'w',this.value)"></div>
    </div>
  </div>`;
}

function toggleResCard(blockIdx,ri,slug){
  const key='res_'+blockIdx+'_'+ri;
  const isOpen=openBlocks.has(key);
  if(isOpen) openBlocks.delete(key); else openBlocks.add(key);
  // Toggle directly in DOM without full re-render
  const resCards=document.querySelectorAll(`.res-card[data-res-idx="${ri}"]`);
  const blockEl=document.querySelector(`.block-card[data-block-idx="${blockIdx}"]`);
  if(blockEl){
    const fields=blockEl.querySelectorAll(`.res-card[data-res-idx="${ri}"] .res-fields`);
    const arrow=blockEl.querySelectorAll(`.res-card[data-res-idx="${ri}"] .bh-toggle`);
    fields.forEach(f=>f.style.display=isOpen?'none':'grid');
    arrow.forEach(a=>a.classList.toggle('open',!isOpen));
  } else {
    renderSheetEditor(slug);
  }
}
