// ===================================================================
// PREVIEW RENDERER — live preview for home page and sheet pages
// ===================================================================
function refreshPreview(slug){
  if(!slug&&currentView!=='sheets'&&currentView!=='welcome')slug=currentView;
  const pc=document.getElementById('preview-content');
  if(!dataLoaded){pc.innerHTML='<div class="empty-state"><h3>Load data to see preview</h3></div>';return;}
  if(!slug||slug==='sheets'){pc.innerHTML=renderHomePreview();return;}
  const sheet=DATA.sheets[slug];
  if(!sheet||!sheet.pages||sheet.pages.length===0){pc.innerHTML='<div class="empty-state"><h3>No content yet</h3></div>';return;}
  pc.innerHTML=sheet.pages.map((pg,i)=>renderPagePreview(sheet,pg,i)).join('');
}

function renderHomePreview(){
  let cards='';
  DATA.home.forEach(entry=>{
    const slug=slugify(entry.sheetName),sheet=DATA.sheets[slug];
    const has=sheet&&sheet.pages&&sheet.pages.length>0;
    const st=entry.status||'live';
    if(st==='pending'||st==='in-progress')return;
    if(!has&&st!=='coming-soon')return;
    cards+=`<div class="home-card${st==='coming-soon'?' coming-soon':''}"><div class="card-icon">${entry.icon||'📄'}</div><div class="card-title">${esc(entry.title)}</div></div>`;
  });
  return `<div class="home-preview-page"><div class="home-hero"><div class="org-name">Community Health &amp; Behavioral Services</div><h1>Resource Hub</h1><p class="subtitle">Your guide to local services, support, and resources in the Utica area</p></div><div class="home-grid">${cards}</div></div>`;
}

function renderPagePreview(sheet,pg,idx){
  const blocks = pg.blocks || [];
  // Split blocks into columns at newCol flags, extract NOTFINDING
  let cols=[[]], nfBlock=false;
  blocks.forEach(b=>{
    if(b.type==='NOTFINDING'){nfBlock=true;return;}
    if(b.newCol&&cols[cols.length-1].length>0){cols.push([]);}
    cols[cols.length-1].push(b);
  });

  function renderBlock(b){
    const mb=b.spacing?`margin-bottom:${b.spacing}pt`:'';
    switch(b.type){
      case 'FAQ':{
        const content=b.aHTML||faqFallbackHTML(b.a);
        let twoCol='';
        if(b.useTwoCol&&(b.colLeft||b.colRight)){
          twoCol=`<div class="two-col-block"><div>${b.colLeft||''}</div><div>${b.colRight||''}</div></div>`;
        }
        const qHeader=b.headerStyle==='banner'?`<div class="section-hdr">${esc(b.q)}</div>`:`<h3>${esc(b.q)}</h3>`;
        return `<div class="faq-block" style="${mb}">${qHeader}${content}${twoCol}</div>`;
      }
      case 'CALLOUT':{
        const ctContent=b.textHTML||`<p>${esc(b.text).replace(/\n/g,'<br>')}</p>`;
        let twoCol='';
        if(b.useTwoCol&&(b.colLeft||b.colRight)){
          twoCol=`<div class="two-col-block"><div>${b.colLeft||''}</div><div>${b.colRight||''}</div></div>`;
        }
        return `<div class="chbs-callout" style="${mb}"><h3>${esc(b.title)}</h3>${ctContent}${twoCol}</div>`;
      }
      case 'QR':{
        let qh='';
        (b.items||[]).forEach(it=>{
          const imgTag=it.imgData?`<div class="qr-img"><img src="${it.imgData}"></div>`:'';
          qh+=`<div class="qr-banner" style="background:${it.bgColor||'#1b3a5c'}"><span class="qr-label">${esc(it.label)}</span>${imgTag}</div>`;
        });
        return `<div style="${mb}">${qh}</div>`;
      }
      case 'SECTION':{
        let s=`<div class="section-hdr">${esc(b.title)}</div>`;
        (b.r||[]).forEach(r=>{s+=renderEntryPreview(r)});
        return `<div style="${mb}">${s}</div>`;
      }
      default: return '';
    }
  }

  let body='', cls='page-body one-col';
  if(cols.length>=2){
    cls='page-body two-col';
    body=cols.map(col=>`<div class="resource-column">${col.map(renderBlock).join('')}</div>`).join('');
  } else {
    body=`<div class="resource-column">${cols[0].map(renderBlock).join('')}</div>`;
  }

  const nf=nfBlock?`<div class="not-finding-bar"><h4>Not Finding What You Need?</h4><p>Speak with any staff at CHBS, or try: <a>United Way 211</a> · <a>NY Connects</a> 1-800-342-9871 · <a>Oneida County System of Care</a> 315-768-3660</p></div>`:'';
  return `<div class="print-page"><div class="page-header"><h1>${(sheet.title||'').toUpperCase()}</h1></div><div class="${cls}">${body}</div>${nf}<div class="page-footer"><div class="footer-group"><div class="footer-col"><h4>Utica Office</h4><p>1002 Oswego St.<br>Utica, NY 13502</p></div><div class="footer-col"><h4>Rome Office</h4><p>207 W. Dominick St.<br>Rome, NY 13440</p></div><div class="footer-col"><h4>Herkimer Office</h4><p>235 N. Prospect St.<br>Herkimer, NY 13350</p></div><div class="footer-col"><p>Call: 315-798-8868<br>Fax: 315-733-7105</p></div></div><div class="footer-group"><div class="footer-col"><h4>Crisis Stabilization Center</h4><p>1002 Oswego St.<br>Utica NY, 13502</p></div><div class="footer-col"><p><b>24/7/365</b><br>Call: 315-520-7802</p></div></div></div></div>`;
}

function faqFallbackHTML(text){
  if(!text)return'';
  const lines=text.split('\n');let html='',inList=false;
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();
    if(!line){if(inList){html+='</ul>';inList=false;}continue;}
    if(inList){
      if(line.endsWith(':')){html+='</ul>';inList=false;html+=`<p>${esc(line)}</p>`}
      else{html+=`<li>${esc(line)}</li>`}
    } else {
      let prev='';for(let j=i-1;j>=0;j--){if(lines[j].trim()){prev=lines[j].trim();break;}}
      if(prev.endsWith(':')&&!line.endsWith(':')){inList=true;html+='<ul>';html+=`<li>${esc(line)}</li>`}
      else{html+=`<p>${esc(line)}</p>`}
    }
  }
  if(inList)html+='</ul>';
  return html;
}

// renderSecsPreview removed — flat block renderer handles all block types inline

function renderEntryPreview(r){
  let ct=[];
  if(r.p)ct.push(`<span class="ph"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> ${esc(r.p)}</span>`);
  if(r.t)ct.push(`<span class="tx"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ${esc(r.t)}</span>`);
  if(r.w)ct.push(`<a class="ws">${esc(r.w)}</a>`);
  let addr=r.a?`<div class="res-addr"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${esc(r.a)}${r.c?' | '+esc(r.c):''}</div>`:'';
  let hrs=r.h?`<div class="res-hours">${esc(r.h)}</div>`:'';
  return `<div class="res-entry"><div class="res-name">${esc(r.n)}</div>${r.s?`<div class="res-svc">${esc(r.s)}</div>`:''}${hrs}${addr}${ct.length?`<div class="res-contact">${ct.join(' ')}</div>`:''}</div>`;
}
