// ===================================================================
// BLOCK OPERATIONS — block CRUD, resource CRUD, and drag-and-drop
// ===================================================================
function toggleBlock(blockId,slug){
  const isOpen=openBlocks.has(blockId);
  if(isOpen) openBlocks.delete(blockId); else openBlocks.add(blockId);
  const body=document.getElementById('block-body-'+blockId);
  if(body){
    body.classList.toggle('open',!isOpen);
    // Toggle the arrow indicator
    const card=body.closest('.block-card');
    if(card){const arrow=card.querySelector('.bh-toggle');if(arrow)arrow.classList.toggle('open',!isOpen);}
    // Init rich text editors when opening FAQ/CALLOUT blocks
    if(!isOpen){
      const blocks=sheetBlocks[slug]||[];
      const idx=blocks.findIndex(b=>b.id===blockId);
      if(idx>=0&&(blocks[idx].type==='FAQ'||blocks[idx].type==='CALLOUT'))initRichText(slug,blocks[idx],idx);
    }
  } else {
    renderSheetEditor(slug);
  }
}

function updateBlock(slug,idx,field,value){
  sheetBlocks[slug][idx][field]=value;
  syncSheetFromBlocks(slug);
  refreshPreview(slug);
}

function addBlock(slug,type){
  closeAddMenu();
  const block={type,id:uid(),spacing:0};
  switch(type){
    case 'FAQ':block.q='New Question';block.a='';block.aHTML='';break;
    case 'CALLOUT':block.title='Callout Title';block.text='';block.textHTML='';break;
    case 'SECTION':block.title='New Section';block.r=[];break;
    case 'QR':block.items=[];break;
  }
  sheetBlocks[slug].push(block);
  openBlocks.add(block.id);
  syncSheetFromBlocks(slug);
  renderSheetEditor(slug);
  refreshPreview(slug);
}

function deleteBlock(slug,idx){
  if(!confirm('Delete this block?'))return;
  openBlocks.delete(sheetBlocks[slug][idx].id);
  sheetBlocks[slug].splice(idx,1);
  syncSheetFromBlocks(slug);renderSheetEditor(slug);refreshPreview(slug);
}

function addResource(slug,blockIdx){
  sheetBlocks[slug][blockIdx].r.push({n:'New Resource',id:uid()});
  syncSheetFromBlocks(slug);renderSheetEditor(slug);refreshPreview(slug);
}

function deleteResource(slug,blockIdx,resIdx){
  sheetBlocks[slug][blockIdx].r.splice(resIdx,1);
  syncSheetFromBlocks(slug);renderSheetEditor(slug);refreshPreview(slug);
}

function moveResource(slug,fromBlockIdx,resIdx,toBlockIdx){
  const res=sheetBlocks[slug][fromBlockIdx].r.splice(resIdx,1)[0];
  sheetBlocks[slug][toBlockIdx].r.push(res);
  syncSheetFromBlocks(slug);renderSheetEditor(slug);refreshPreview(slug);
  toast('Moved to '+sheetBlocks[slug][toBlockIdx].title);
}

let _resPreviewTimer=null;
function updateRes(slug,blockIdx,resIdx,field,value){
  sheetBlocks[slug][blockIdx].r[resIdx][field]=value;
  syncSheetFromBlocks(slug);
  clearTimeout(_resPreviewTimer);
  _resPreviewTimer=setTimeout(()=>refreshPreview(slug),200);
}

// ===================================================================
// DRAG & DROP — Sheets
// ===================================================================
function dragSheetStart(e,idx){dragState={type:'sheet',idx};e.dataTransfer.effectAllowed='move';e.target.closest('.sheet-list-item').classList.add('dragging')}
function dragSheetOver(e,idx){e.preventDefault();if(!dragState||dragState.type!=='sheet')return;document.querySelectorAll('.sheet-list-item').forEach(el=>el.classList.remove('drag-over-above','drag-over-below'));const r=e.target.closest('.sheet-list-item').getBoundingClientRect();if(e.clientY<r.top+r.height/2)e.target.closest('.sheet-list-item').classList.add('drag-over-above');else e.target.closest('.sheet-list-item').classList.add('drag-over-below')}
function dragSheetLeave(e){e.target.closest('.sheet-list-item')?.classList.remove('drag-over-above','drag-over-below')}
function dragSheetDrop(e,toIdx){e.preventDefault();document.querySelectorAll('.sheet-list-item').forEach(el=>el.classList.remove('dragging','drag-over-above','drag-over-below'));if(!dragState||dragState.type!=='sheet')return;const f=dragState.idx;dragState=null;if(f===toIdx)return;const item=DATA.home.splice(f,1)[0];DATA.home.splice(toIdx,0,item);renderSheetList()}

// DRAG — Blocks
function dragBlockStart(e,slug,idx){dragState={type:'block',slug,idx};e.dataTransfer.effectAllowed='move';e.target.closest('.block-card').classList.add('dragging')}
function dragBlockOver(e,idx){e.preventDefault();if(!dragState||dragState.type!=='block')return;document.querySelectorAll('.block-card').forEach(el=>el.classList.remove('drag-over-above','drag-over-below'));const c=e.target.closest('.block-card');if(!c)return;const r=c.getBoundingClientRect();if(e.clientY<r.top+r.height/2)c.classList.add('drag-over-above');else c.classList.add('drag-over-below')}
function dragBlockLeave(e){e.target.closest('.block-card')?.classList.remove('drag-over-above','drag-over-below')}
function dragBlockDrop(e,slug,toIdx){e.preventDefault();document.querySelectorAll('.block-card').forEach(el=>el.classList.remove('dragging','drag-over-above','drag-over-below'));if(!dragState||dragState.type!=='block'||dragState.slug!==slug)return;const f=dragState.idx;dragState=null;if(f===toIdx)return;const item=sheetBlocks[slug].splice(f,1)[0];sheetBlocks[slug].splice(toIdx,0,item);syncSheetFromBlocks(slug);renderSheetEditor(slug);refreshPreview(slug)}

// DRAG — Resources
function dragResStart(e,slug,bi,ri){dragState={type:'res',slug,blockIdx:bi,resIdx:ri};e.dataTransfer.effectAllowed='move';e.target.closest('.res-card').classList.add('dragging');e.stopPropagation()}
function dragResOver(e,ri){e.preventDefault();e.stopPropagation();if(!dragState||dragState.type!=='res')return;document.querySelectorAll('.res-card').forEach(el=>el.classList.remove('drag-over-above','drag-over-below'));const c=e.target.closest('.res-card');if(!c)return;const r=c.getBoundingClientRect();if(e.clientY<r.top+r.height/2)c.classList.add('drag-over-above');else c.classList.add('drag-over-below')}
function dragResLeave(e){e.target.closest('.res-card')?.classList.remove('drag-over-above','drag-over-below')}
function dragResDrop(e,slug,bi,toIdx){e.preventDefault();e.stopPropagation();document.querySelectorAll('.res-card').forEach(el=>el.classList.remove('dragging','drag-over-above','drag-over-below'));if(!dragState||dragState.type!=='res'||dragState.slug!==slug||dragState.blockIdx!==bi)return;const f=dragState.resIdx;dragState=null;if(f===toIdx)return;const item=sheetBlocks[slug][bi].r.splice(f,1)[0];sheetBlocks[slug][bi].r.splice(toIdx,0,item);syncSheetFromBlocks(slug);renderSheetEditor(slug);refreshPreview(slug)}
