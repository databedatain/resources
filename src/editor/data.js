// ===================================================================
// DATA — flatten/unflatten pages <-> flat block list, init, sync
// ===================================================================
function flattenSheet(sheet){
  const blocks = [];
  if(!sheet.pages) return blocks;
  sheet.pages.forEach((pg, pi) => {
    // New format: pg.blocks is an ordered array
    if(pg.blocks){
      const pgBlocks = pg.blocks.map(b => ({...b, id:uid(), r:b.r?(b.r.map(r=>({...r,id:uid()}))):undefined, items:b.items?(b.items.map(it=>({...it,id:uid()}))):undefined}));
      // Mark first block of page 2+ as newPage
      if(pi > 0 && pgBlocks.length > 0) pgBlocks[0].newPage = true;
      blocks.push(...pgBlocks);
    } else {
      // Legacy format migration
      const legacyBlocks = [];
      (pg.faq||[]).forEach(f => legacyBlocks.push({type:'FAQ', id:uid(), q:f.q, a:f.a, aHTML:f.aHTML||'', spacing:f.spacing||0}));
      if(pg.callout) legacyBlocks.push({type:'CALLOUT', id:uid(), title:pg.callout.title, text:pg.callout.text, spacing:pg.callout.spacing||0});
      (pg.qrBlocks||[]).forEach(qb => legacyBlocks.push({type:'QR', id:uid(), items:(qb.items||[]).map(it=>({...it,id:uid()})), spacing:qb.spacing||0}));
      (pg.sections||[]).forEach(sec => legacyBlocks.push({type:'SECTION', id:uid(), title:sec.title, r:(sec.r||[]).map(r=>({...r,id:uid()})), spacing:sec.spacing||0}));
      if(pg.L && pg.L.length>0){
        // Mark first L section as newCol
        pg.L.forEach((sec,si) => {
          const b = {type:'SECTION', id:uid(), title:sec.title, r:(sec.r||[]).map(r=>({...r,id:uid()})), spacing:sec.spacing||0};
          if(si===0) b.newCol = true;
          legacyBlocks.push(b);
        });
      }
      if(pg.R && pg.R.length>0){
        pg.R.forEach((sec,si) => {
          const b = {type:'SECTION', id:uid(), title:sec.title, r:(sec.r||[]).map(r=>({...r,id:uid()})), spacing:sec.spacing||0};
          if(si===0) b.newCol = true;
          legacyBlocks.push(b);
        });
      }
      if(pg.nf) legacyBlocks.push({type:'NOTFINDING', id:uid()});
      // Mark first block of page 2+ as newPage
      if(pi > 0 && legacyBlocks.length > 0) legacyBlocks[0].newPage = true;
      blocks.push(...legacyBlocks);
    }
  });
  return blocks;
}

function unflattenBlocks(blocks, sheetMeta){
  const sheet = {title:sheetMeta.title, icon:sheetMeta.icon, status:sheetMeta.status||'live', owner:sheetMeta.owner||'', comments:sheetMeta.comments||'', pages:[]};
  let currentPage = {blocks:[]};
  blocks.forEach(b => {
    // If this block has newPage flag and current page has content, start new page
    if(b.newPage && currentPage.blocks.length>0){
      sheet.pages.push(currentPage);
      currentPage = {blocks:[]};
    }
    // Skip old PAGE/COLBREAK/SPACER block types (legacy)
    if(b.type==='PAGE'||b.type==='COLBREAK'||b.type==='SPACER') return;
    // Strip ids from nested data for clean serialization
    const clean = {...b};
    delete clean.id;
    if(clean.r) clean.r = clean.r.map(r=>{const c={...r};delete c.id;return c});
    if(clean.items) clean.items = clean.items.map(it=>{const c={...it};delete c.id;return c});
    currentPage.blocks.push(clean);
  });
  if(currentPage.blocks.length>0) sheet.pages.push(currentPage);
  return sheet;
}

function initBlocks(){
  sheetBlocks={};
  for(const [slug,sheet] of Object.entries(DATA.sheets)) sheetBlocks[slug]=flattenSheet(sheet);
  // Capture initial state for undo
  undoStack = [JSON.stringify(DATA)];
  redoStack = [];
  updateUndoButtons();
}

function syncSheetFromBlocks(slug){
  const entry=DATA.home.find(h=>slugify(h.sheetName)===slug);
  if(!entry)return;
  DATA.sheets[slug]=unflattenBlocks(sheetBlocks[slug]||[],{title:entry.title,icon:entry.icon,status:entry.status,owner:entry.owner,comments:entry.comments});
}
