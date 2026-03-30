// ===================================================================
// UNDO / REDO
// ===================================================================
const UNDO_MAX = 50;
let undoStack = [];
let redoStack = [];
let _undoTimer = null;

function captureSnapshot(){
  for(const slug in sheetBlocks) syncSheetFromBlocks(slug);
  return JSON.stringify(DATA);
}

function pushUndo(){
  // Debounce: don't push if called too rapidly
  clearTimeout(_undoTimer);
  _undoTimer = setTimeout(()=>{
    const snap = captureSnapshot();
    if(undoStack.length > 0 && undoStack[undoStack.length-1] === snap) return;
    undoStack.push(snap);
    if(undoStack.length > UNDO_MAX) undoStack.shift();
    redoStack = [];
    updateUndoButtons();
  }, 300);
}

function doUndo(){
  if(undoStack.length < 2) return; // need at least current + previous
  const current = undoStack.pop();
  redoStack.push(current);
  const prev = undoStack[undoStack.length - 1];
  DATA = JSON.parse(prev);
  initBlocks();
  rerenderCurrentView();
  updateUndoButtons();
  toast('Undo');
}

function doRedo(){
  if(redoStack.length === 0) return;
  const snap = redoStack.pop();
  undoStack.push(snap);
  DATA = JSON.parse(snap);
  initBlocks();
  rerenderCurrentView();
  updateUndoButtons();
  toast('Redo');
}

function rerenderCurrentView(){
  if(currentView === 'sheets') { renderSheetList(); refreshPreview(); }
  else if(currentView === 'siteinfo') { renderSiteInfo(); refreshPreview(); }
  else { renderSheetEditor(currentView); refreshPreview(currentView); }
}

function updateUndoButtons(){
  const ubtn = document.getElementById('undo-btn');
  const rbtn = document.getElementById('redo-btn');
  if(ubtn) ubtn.disabled = undoStack.length < 2;
  if(rbtn) rbtn.disabled = redoStack.length === 0;
}

// Hook into syncSheetFromBlocks to auto-capture undo snapshots
const _origSyncForUndo = syncSheetFromBlocks;
syncSheetFromBlocks = function(slug){ _origSyncForUndo(slug); pushUndo(); };

// ===================================================================
// UNSAVED CHANGES WARNING
// ===================================================================
window.addEventListener('beforeunload',function(e){
  if(dataLoaded){e.preventDefault();e.returnValue='';}
});

// ===================================================================
// KEYBOARD SHORTCUTS
// ===================================================================
document.addEventListener('keydown',function(e){
  // Ctrl/Cmd+S — Save to GitHub (or export JSON if no token)
  if((e.ctrlKey||e.metaKey)&&e.key==='s'){
    e.preventDefault();
    if(!dataLoaded) return;
    if(ghToken) ghSave(); else exportJSON();
  }
  // Ctrl/Cmd+Z — Undo
  if((e.ctrlKey||e.metaKey)&&e.key==='z'&&!e.shiftKey){
    // Only intercept if not in a contenteditable
    if(document.activeElement&&document.activeElement.getAttribute('contenteditable')==='true') return;
    e.preventDefault();
    doUndo();
  }
  // Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y — Redo
  if((e.ctrlKey||e.metaKey)&&(e.key==='y'||(e.key==='z'&&e.shiftKey))){
    if(document.activeElement&&document.activeElement.getAttribute('contenteditable')==='true') return;
    e.preventDefault();
    doRedo();
  }
  // Ctrl/Cmd+P — Publish (admin)
  if((e.ctrlKey||e.metaKey)&&e.key==='p'&&e.shiftKey){
    e.preventDefault();
    if(dataLoaded) ghPublish();
  }
});

// ===================================================================
// AUTO-SAVE TO LOCALSTORAGE
// ===================================================================
const AUTOSAVE_KEY='chbs-editor-autosave';
let autosaveTimer=null;

function scheduleAutosave(){
  if(autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer=setTimeout(doAutosave,3000);
}

function doAutosave(){
  if(!dataLoaded) return;
  for(const slug in sheetBlocks) syncSheetFromBlocks(slug);
  try{
    localStorage.setItem(AUTOSAVE_KEY,JSON.stringify(DATA));
  }catch(e){/* storage full — silently skip */}
}

// Hook autosave into existing sync points
const _origSync=syncSheetFromBlocks;
syncSheetFromBlocks=function(slug){_origSync(slug);scheduleAutosave()};

// Check for autosaved data (called after password gate opens)
async function checkAutoRecover(){
  // First try GitHub auto-load if token exists
  if(ghToken){
    const loaded=await ghAutoLoad();
    if(loaded)return;
  }
  // Fall back to local auto-recover
  const saved=localStorage.getItem(AUTOSAVE_KEY);
  if(saved){
    try{
      const parsed=JSON.parse(saved);
      if(parsed&&parsed.home&&parsed.sheets&&confirm('Recovered unsaved work from a previous session. Restore it?\n\n(Click Cancel to start fresh)')){
        DATA=parsed;dataLoaded=true;initBlocks();showView('sheets');toast('Restored from auto-save');return;
      }
    }catch(e){/* corrupt data — ignore */}
  }
}

// ===================================================================
// INIT — show welcome screen (no embedded data)
// ===================================================================
function initEditor(){
  initIOListeners();
  setupDropZone();
  if(ghToken) updateGhStatus('connected');
}
