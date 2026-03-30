// ===================================================================
// RICH TEXT — contenteditable editor, paste handling, formatting
// ===================================================================
function textToHTML(text){
  if(!text) return '';
  const lines = text.split('\n');
  let html='', inList=false;
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();
    if(!line){if(inList){html+='</ul>';inList=false;}continue;}
    if(inList){
      if(line.endsWith(':')){html+='</ul>';inList=false;html+=`<p>${esc(line)}</p>`;}
      else{html+=`<li>${esc(line)}</li>`;}
    } else {
      let prev='';
      for(let j=i-1;j>=0;j--){if(lines[j].trim()){prev=lines[j].trim();break;}}
      if(prev.endsWith(':') && !line.endsWith(':')){inList=true;html+='<ul>';html+=`<li>${esc(line)}</li>`;}
      else{html+=`<p>${esc(line)}</p>`;}
    }
  }
  if(inList) html+='</ul>';
  return html;
}

function htmlToText(html){
  const div=document.createElement('div');div.innerHTML=html;
  let text='';
  function walk(node){
    if(node.nodeType===3){text+=node.textContent;return;}
    if(node.nodeType!==1)return;
    const tag=node.tagName.toLowerCase();
    if(tag==='br'){text+='\n';return;}
    if(tag==='li'){walkC(node);text+='\n';return;}
    if(tag==='ul'||tag==='ol'){walkC(node);return;}
    if(tag==='p'||tag==='div'){walkC(node);text+='\n';return;}
    walkC(node);
  }
  function walkC(n){for(const c of n.childNodes)walk(c)}
  walk(div);
  return text.replace(/\n+$/,'');
}

function initRichText(slug,block,idx){
  const editor=document.getElementById('rt-editor-'+block.id);
  if(!editor) return;
  if(block.type==='CALLOUT'){
    if(block.textHTML){editor.innerHTML=block.textHTML;}
    else{editor.innerHTML=textToHTML(block.text||'');}
  } else {
    if(block.aHTML){editor.innerHTML=block.aHTML;}
    else{editor.innerHTML=textToHTML(block.a||'');}
  }
  // Intercept paste: keep structure (bold, italic, lists) but strip fonts/sizes/colors
  if(!editor._pasteHandled){attachPasteHandler(editor);editor._pasteHandled=true;}
  // Init two-column editors if present
  if((block.type==='FAQ'||block.type==='CALLOUT') && block.useTwoCol){
    const leftEd=document.getElementById('rt-col-left-'+block.id);
    const rightEd=document.getElementById('rt-col-right-'+block.id);
    if(leftEd&&!leftEd._pasteHandled){leftEd.innerHTML=block.colLeft||'';attachPasteHandler(leftEd);leftEd._pasteHandled=true;}
    if(rightEd&&!rightEd._pasteHandled){rightEd.innerHTML=block.colRight||'';attachPasteHandler(rightEd);rightEd._pasteHandled=true;}
  }
}

function attachPasteHandler(editor){
  editor.addEventListener('paste',function(e){
    e.preventDefault();
    const html=e.clipboardData.getData('text/html');
    const plain=e.clipboardData.getData('text/plain');
    let clean='';
    if(html){clean=stripPastedStyles(html);}
    else{clean=esc(plain).replace(/\n/g,'<br>');}
    document.execCommand('insertHTML',false,clean);
  });
}

// Strip font-family, font-size, color from pasted HTML but keep structural tags
function stripPastedStyles(html){
  const div=document.createElement('div');
  div.innerHTML=html;
  // Remove all font tags, unwrap their children
  div.querySelectorAll('font').forEach(f=>{
    const frag=document.createDocumentFragment();
    while(f.firstChild) frag.appendChild(f.firstChild);
    f.parentNode.replaceChild(frag,f);
  });
  // Strip style attributes that set font/size/color, keep structural ones
  div.querySelectorAll('[style]').forEach(el=>{
    const s=el.style;
    s.removeProperty('font-family');
    s.removeProperty('font-size');
    s.removeProperty('color');
    s.removeProperty('background-color');
    s.removeProperty('background');
    s.removeProperty('line-height');
    s.removeProperty('letter-spacing');
    if(!el.getAttribute('style').trim()) el.removeAttribute('style');
  });
  // Remove class attributes (Word/Google Docs add tons)
  div.querySelectorAll('[class]').forEach(el=>{
    // Keep our own classes
    if(!el.className.includes('two-col-block')&&!el.className.includes('fill-line')) el.removeAttribute('class');
  });
  // Remove spans that are now empty wrappers
  div.querySelectorAll('span').forEach(sp=>{
    if(!sp.getAttribute('style')&&!sp.getAttribute('class')){
      const frag=document.createDocumentFragment();
      while(sp.firstChild) frag.appendChild(sp.firstChild);
      sp.parentNode.replaceChild(frag,sp);
    }
  });
  return div.innerHTML;
}

function updateRichText(slug,idx,blockId){
  const editor=document.getElementById('rt-editor-'+blockId);
  if(!editor) return;
  const block=sheetBlocks[slug][idx];
  block.aHTML=editor.innerHTML;
  block.a=htmlToText(editor.innerHTML);
  syncSheetFromBlocks(slug);
  refreshPreview(slug);
}

function updateColText(slug,idx,field,editorId){
  const editor=document.getElementById(editorId);
  if(!editor) return;
  const block=sheetBlocks[slug][idx];
  block[field]=editor.innerHTML;
  syncSheetFromBlocks(slug);
  refreshPreview(slug);
}

function updateCalloutRichText(slug,idx,blockId){
  const editor=document.getElementById('rt-editor-'+blockId);
  if(!editor) return;
  const block=sheetBlocks[slug][idx];
  block.textHTML=editor.innerHTML;
  block.text=htmlToText(editor.innerHTML);
  syncSheetFromBlocks(slug);
  refreshPreview(slug);
}

function rtCmd(cmd,blockId){
  const editor=document.getElementById('rt-editor-'+blockId);
  editor.focus();
  document.execCommand(cmd,false,null);
}

function rtCmdCol(cmd,editorId){
  const editor=document.getElementById(editorId);
  editor.focus();
  document.execCommand(cmd,false,null);
}

function insertCheckbox(editorId){
  const editor=document.getElementById(editorId);
  editor.focus();
  document.execCommand('insertHTML',false,'\u2610 ');
}

function insertLine(editorId){
  const editor=document.getElementById(editorId);
  editor.focus();
  const sel=window.getSelection();
  if(!sel.rangeCount) return;
  const range=sel.getRangeAt(0);
  range.deleteContents();
  // Create the line span with inline styles (no class dependency)
  const span=document.createElement('span');
  span.style.cssText='display:inline-block;border-bottom:1px solid #888;flex:1;min-width:1in;height:.2in';
  span.innerHTML='\u00a0';
  range.insertNode(span);
  // Move cursor after the span
  range.setStartAfter(span);range.collapse(true);
  sel.removeAllRanges();sel.addRange(range);
  // Make the parent block a flex row so the line fills remaining space
  let parent=span.parentElement;
  if(parent){
    if(parent===editor){
      // Text is directly in editor — wrap line content in a <p>
      const p=document.createElement('p');
      let sib=span;
      while(sib.previousSibling){
        const prev=sib.previousSibling;
        if(prev.nodeType===1&&['P','DIV','UL','OL','H3','HR','BR'].includes(prev.tagName)) break;
        sib=prev;
      }
      const nodes=[];
      let cur=sib;
      while(cur){
        const next=cur.nextSibling;
        nodes.push(cur);
        if(cur===span) break;
        cur=next;
      }
      if(nodes.length){
        editor.insertBefore(p,nodes[0]);
        nodes.forEach(n=>p.appendChild(n));
      }
      parent=p;
    }
    parent.style.display='flex';
    parent.style.alignItems='baseline';
    parent.style.flexWrap='wrap';
    parent.style.gap='0 4px';
  }
  // Trigger input so data syncs
  editor.dispatchEvent(new Event('input',{bubbles:true}));
}

function clearFormatting(blockId){
  const editor=document.getElementById('rt-editor-'+blockId);
  editor.focus();
  document.execCommand('removeFormat',false,null);
  // Also strip font tags and inline styles from the whole editor
  editor.innerHTML=stripPastedStyles(editor.innerHTML);
}

function insertTwoCol(slug,idx,blockId){
  toggleTwoCol(slug,idx);
}

function toggleTwoCol(slug,idx){
  const block=sheetBlocks[slug][idx];
  block.useTwoCol=!block.useTwoCol;
  if(block.useTwoCol && !block.colLeft) block.colLeft='';
  if(block.useTwoCol && !block.colRight) block.colRight='';
  syncSheetFromBlocks(slug);
  renderSheetEditor(slug);
  refreshPreview(slug);
}
