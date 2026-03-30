// ===================================================================
// DATA CLEANUP FOR EXPORT & STANDALONE HTML GENERATOR
// ===================================================================
// ===================================================================
// DATA CLEANUP FOR EXPORT
// ===================================================================
function prepareDataForExport(){
  for(const slug in sheetBlocks)syncSheetFromBlocks(slug);
  for(const slug in DATA.sheets){
    const sheet=DATA.sheets[slug];
    sheet.pages.forEach(pg=>{
      (pg.blocks||[]).forEach(b=>{
        if(b.type==='FAQ' && !b.aHTML) b.aHTML=faqFallbackHTML(b.a);
      });
    });
  }
  for(const slug in DATA.sheets){
    const sheet=DATA.sheets[slug];
    sheet.pages.forEach(pg=>{
      (pg.blocks||[]).forEach(b=>{
        if(b.aHTML){
          b.aHTML=b.aHTML.replace(/\s*contenteditable="[^"]*"/gi,'');
          b.aHTML=b.aHTML.replace(/font-family:[^;"]*(;|(?="))/gi,'');
          b.aHTML=b.aHTML.replace(/font-size:[^;"]*(;|(?="))/gi,'');
        }
        if(b.textHTML){
          b.textHTML=b.textHTML.replace(/\s*contenteditable="[^"]*"/gi,'');
          b.textHTML=b.textHTML.replace(/font-family:[^;"]*(;|(?="))/gi,'');
          b.textHTML=b.textHTML.replace(/font-size:[^;"]*(;|(?="))/gi,'');
        }
        if(b.colLeft){
          b.colLeft=b.colLeft.replace(/\s*contenteditable="[^"]*"/gi,'');
          b.colLeft=b.colLeft.replace(/font-family:[^;"]*(;|(?="))/gi,'');
        }
        if(b.colRight){
          b.colRight=b.colRight.replace(/\s*contenteditable="[^"]*"/gi,'');
          b.colRight=b.colRight.replace(/font-family:[^;"]*(;|(?="))/gi,'');
        }
      });
    });
  }
}

// generatePublishedHTML removed — index.html is now a static shell
// that fetches data/published.json dynamically via js/site.js.
// Publishing only needs to push published.json.

// Kept for backward compat: export a standalone HTML file for offline use
function generateStandaloneHTML(){
  prepareDataForExport();
  const si=getSiteInfo();
  const dj=JSON.stringify(DATA);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>CHBS Resource Hub</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@100;300;400;500;600;700&family=Barlow+Condensed:wght@400;600;700&family=Karla:ital,wght@0,400;0,500;0,700;1,400&display=swap" rel="stylesheet">
<style>
:root{--p1:#5C8BC3;--p1-80:#7DA2CF;--p1-60:#9DB9DB;--p1-40:#BED1E7;--p1-20:#DEE8F3;--p2:#1E4A71;--p2-80:#4B6E8D;--p2-60:#7893AA;--p2-40:#A5B7C6;--p2-20:#D2DBE3;--p3:#758594;--p3-80:#919DA9;--p3-60:#ADB6BF;--p3-40:#C8CED4;--p3-20:#E4E7EA;--p4:#EFB900;--p4-80:#F2C733;--p4-60:#F5D566;--p4-40:#F9E399;--p4-20:#FCF1CC;--sidebar-w:300px;--bd:#1E4A71;--bm:#5C8BC3;--bl:#7DA2CF;--gd:#EFB900;--gl:#F2C733;--wh:#fff;--cr:#1E4A71;--g50:#f5f5f5;--g100:#e8e8e8;--g200:#d0d0d0;--g400:#999;--g500:#6b6b6b;--g700:#3d3d3d;--g900:#1a1a1a}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden}
body{font-family:'Karla',sans-serif;color:#fff;background:var(--p2)}
.page-layout{display:flex;flex-direction:column;height:100vh}
.layout-body{display:flex;flex:1;min-height:0;overflow:hidden}
.crisis-banner{flex-shrink:0;background:var(--p4);color:var(--p2);text-align:center;padding:.35rem 1rem;font-family:'Barlow',sans-serif;font-size:.76rem;font-weight:600}
.crisis-banner a{color:var(--p2);font-weight:700}
.sidebar{width:var(--sidebar-w);flex-shrink:0;background:#152d49;display:flex;flex-direction:column;padding:1.25rem;overflow-y:auto;border-right:1px solid rgba(255,255,255,.06)}
.logo-card{background:#fff;border-radius:10px;padding:1rem;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.15);border-bottom:3px solid var(--p4);flex-shrink:0}
.logo-card img{display:block;max-width:100%;height:auto;object-fit:contain}
.sidebar-title{text-align:center;margin-top:.75rem;flex-shrink:0}
.sidebar-title h1{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:2rem;line-height:1;letter-spacing:-.01em;color:#fff}
.sidebar-title h1 span{color:var(--p4)}
.sidebar-title .sub{font-size:.8rem;opacity:.5;line-height:1.35;margin-top:.2rem}
.sidebar-announcements{margin-top:.6rem;padding:.5rem .65rem;flex-shrink:0;background:rgba(255,255,255,.05);border-radius:8px;border-left:3px solid var(--p4)}
.sidebar-announcements .ann-label{font-family:'Barlow',sans-serif;font-weight:600;font-size:.6rem;letter-spacing:.08em;text-transform:uppercase;color:var(--p4);margin-bottom:.1rem}
.sidebar-announcements p{font-size:.72rem;opacity:.6;line-height:1.4}
.sidebar-sheets{margin-top:.6rem;flex-shrink:0}
.sidebar-sheets .sheets-label{font-family:'Barlow',sans-serif;font-weight:600;font-size:.6rem;letter-spacing:.08em;text-transform:uppercase;color:var(--p4);margin-bottom:.3rem}
.sidebar-sheets a{display:block;padding:.3rem .5rem;margin-bottom:.15rem;font-family:'Barlow',sans-serif;font-size:.75rem;font-weight:500;color:rgba(255,255,255,.6);text-decoration:none;border-radius:5px;transition:all .15s}
.sidebar-sheets a:hover{color:#fff;background:rgba(255,255,255,.06)}
.sidebar-sheets a.active{color:#fff;background:rgba(92,139,195,.2);border-left:2px solid var(--p4);font-weight:600}
.sidebar-spacer{flex:1;min-height:.5rem}
.sidebar-info{font-family:'Barlow',sans-serif;flex-shrink:0;border-top:1px solid rgba(255,255,255,.08);padding-top:.5rem;margin-top:.5rem}
.sidebar-info .info-label{font-weight:600;font-size:.58rem;letter-spacing:.08em;text-transform:uppercase;color:var(--p4);margin-bottom:.1rem;margin-top:.35rem}
.sidebar-info .info-label:first-child{margin-top:0}
.sidebar-info .office-row{display:flex;flex-wrap:wrap;gap:.05rem .8rem}
.sidebar-info .office{font-size:.66rem;opacity:.7;line-height:1.25}
.sidebar-info .office strong{font-weight:600;color:var(--p4-60);font-size:.64rem;margin-right:.15rem}
.sidebar-info .info-value{font-size:.7rem;opacity:.8;line-height:1.3}
.sidebar-info .info-value a{color:#fff;text-decoration:none}
.sidebar-info .phone-main{font-weight:700;font-size:.82rem;color:#fff}
.sidebar-info .crisis-block{border-top:1px solid rgba(255,255,255,.08);padding-top:.3rem;margin-top:.3rem}
.sidebar-info .crisis-head{font-weight:700;color:var(--p4);font-size:.6rem;letter-spacing:.06em;text-transform:uppercase}
.sidebar-info .crisis-detail{font-size:.66rem;opacity:.7;line-height:1.35}
.sidebar-info .crisis-detail a{color:var(--p4-60);text-decoration:none;font-weight:600}
.sidebar-info .crisis-detail b{font-weight:700;color:rgba(255,255,255,.9)}
.main-content{flex:1;min-width:0;background:var(--p2);padding:1rem 1.5rem;display:flex;flex-direction:column;overflow-y:auto}
#home-page{display:none}
#home-page.active{display:flex;flex:1;flex-direction:column;align-items:center;justify-content:center}
.home-search{max-width:820px;width:100%;margin-bottom:.75rem}
.home-search input{width:100%;padding:.55rem 1rem;border:1px solid rgba(255,255,255,.12);border-radius:8px;font-family:'Karla',sans-serif;font-size:.88rem;outline:none;background:rgba(255,255,255,.07);color:#fff;transition:all .2s}
.home-search input:focus{border-color:var(--p4-60);background:rgba(255,255,255,.1);box-shadow:0 0 0 3px rgba(239,185,0,.08)}
.home-search input::placeholder{color:rgba(255,255,255,.3)}
.home-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.6rem;max-width:820px;width:100%}
.home-card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:.7rem .5rem;text-align:center;cursor:pointer;transition:all .25s;text-decoration:none;color:#fff;position:relative;overflow:hidden}
.home-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--p4);transform:scaleX(0);transition:transform .25s}
.home-card:hover{background:rgba(255,255,255,.1);transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.2)}
.home-card:hover::after{transform:scaleX(1)}
.home-card .card-icon{font-size:1.3rem;margin-bottom:.15rem}
.home-card .card-icon img{width:28px;height:28px;object-fit:contain}
.home-card .card-title{font-family:'Barlow',sans-serif;font-weight:600;font-size:.78rem;color:var(--p1-40)}
.home-card.coming-soon{opacity:.45;cursor:default}
.home-card.coming-soon:hover{background:rgba(255,255,255,.06);transform:none;box-shadow:none}
.home-card.coming-soon::after{display:none}
.home-nf,.home-ft,.home-hero,.home-info-bar{display:none}
.home-card.highlighted{border-color:var(--p4);box-shadow:0 0 0 1px var(--p4)}
.no-results{text-align:center;padding:2rem 1rem;color:rgba(255,255,255,.4);font-size:.9rem;grid-column:1/-1;display:none}
.search-results{max-width:820px;width:100%;margin:.5rem auto 0;display:none}
.search-results.active{display:block}
.search-result{display:flex;align-items:center;gap:1rem;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:.65rem 1rem;margin-bottom:.4rem;cursor:pointer;transition:all .15s;text-decoration:none;color:#fff}
.search-result:hover{border-color:rgba(255,255,255,.15);box-shadow:0 2px 8px rgba(0,0,0,.15)}
.search-result .result-info{flex:1;min-width:0}
.search-result .result-name{font-weight:700;font-size:.9rem;color:#fff}
.search-result .result-detail{font-size:.78rem;color:rgba(255,255,255,.5);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.search-result .result-sheet{display:flex;align-items:center;gap:4px;font-size:.7rem;color:var(--p1-40);font-weight:700;background:rgba(92,139,195,.15);padding:4px 10px;border-radius:4px;white-space:nowrap;flex-shrink:0}
.search-result .result-sheet .rs-icon{font-size:.9rem}
.search-count{font-size:.8rem;color:rgba(255,255,255,.4);margin-bottom:.5rem}
#sheet-container{flex:1;display:flex;flex-direction:column}
.screen-view{display:flex;flex-direction:column;flex:1;min-height:0}
.sheet-header{background:rgba(255,255,255,.06);border-radius:8px;padding:.75rem 1.25rem;margin-bottom:1rem;flex-shrink:0;display:flex;align-items:center;justify-content:space-between}
.sheet-header h2{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:1.6rem;letter-spacing:.01em;text-transform:uppercase}
.sheet-header .back-link{color:var(--p1-40);text-decoration:none;font-weight:600;font-size:.85rem;font-family:'Barlow',sans-serif;margin-right:1rem}
.sheet-header .back-link:hover{color:#fff}
.sheet-header .print-btn{padding:.4rem 1rem;border:1px solid rgba(255,255,255,.2);background:transparent;border-radius:6px;color:rgba(255,255,255,.7);font-family:'Barlow',sans-serif;font-weight:600;font-size:.78rem;cursor:pointer;transition:all .15s}
.sheet-header .print-btn:hover{background:rgba(255,255,255,.08);color:#fff}
.sheet-body{flex:1;overflow-y:auto;padding-right:.5rem}
.sheet-body::-webkit-scrollbar{width:5px}
.sheet-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:3px}
.sheet-columns{display:grid;grid-template-columns:1fr 1fr;gap:1rem;align-items:start}
.s-faq{margin-bottom:.75rem}
.s-faq h3{font-family:'Barlow',sans-serif;font-weight:700;font-size:.95rem;color:var(--p4);margin-bottom:.2rem}
.s-faq p{font-size:.84rem;opacity:.75;line-height:1.55}
.s-faq ul,.s-faq ol{font-size:.84rem;opacity:.75;line-height:1.55;padding:0 0 0 1.4em;margin:0 0 .2rem 0}
.s-faq li{margin-bottom:.1rem}
.s-faq .two-col-block{display:grid;grid-template-columns:1fr 1fr;gap:.4rem .75rem;font-size:.84rem;opacity:.75;line-height:1.55}
.s-faq .two-col-block p{font-size:.84rem}
.s-faq .two-col-block ul,.s-faq .two-col-block ol{font-size:.84rem;margin:0 0 .2rem 0;padding:0 0 0 1.4em}
.s-faq .s-section-hdr{font-size:.85rem!important;margin-top:0}
.s-callout{border-left:3px solid var(--p4);background:rgba(255,255,255,.04);padding:.6rem .85rem;border-radius:0 8px 8px 0;margin-bottom:.75rem}
.s-callout h3{font-family:'Barlow',sans-serif;font-weight:700;font-size:.92rem;color:var(--p1-40);margin-bottom:.15rem}
.s-callout p{font-size:.82rem;opacity:.65;line-height:1.5}
.s-callout ul,.s-callout ol{font-size:.82rem;opacity:.65;line-height:1.5;padding:0 0 0 1.4em;margin:0 0 .2rem 0}
.s-callout .two-col-block{display:grid;grid-template-columns:1fr 1fr;gap:.4rem .75rem;font-size:.82rem;opacity:.65;line-height:1.55;margin-top:.4rem}
.s-callout .two-col-block>div{padding:0;margin:0}
.s-section-hdr{background:var(--p1);color:#fff;padding:.35rem .75rem;border-radius:5px;font-family:'Barlow',sans-serif;font-weight:700;font-size:.85rem;text-align:center;margin:.75rem 0 .5rem}
.s-section-hdr:first-child{margin-top:0}
.s-entry{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:.55rem .75rem;margin-bottom:.4rem;transition:all .15s}
.s-entry:hover{border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.06)}
.s-entry .e-name{font-weight:700;font-size:.88rem;color:#fff;line-height:1.3}
.s-entry .e-svc{font-size:.78rem;color:var(--p3-60);font-style:italic;line-height:1.3}
.s-entry .e-hours{font-size:.78rem;color:rgba(255,255,255,.5);line-height:1.3}
.s-entry .e-addr{font-size:.8rem;color:rgba(255,255,255,.55);line-height:1.3}
.s-entry .e-contact{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.2rem;font-size:.8rem;line-height:1.3}
.s-entry .e-phone{color:var(--p4-60);font-weight:600;text-decoration:none}
.s-entry a.e-phone:hover{text-decoration:underline;color:var(--p4)}
.s-entry .e-text{color:rgba(255,255,255,.4)}
.s-entry .e-web{color:var(--p1-60);text-decoration:none;font-weight:600;margin-left:auto}
.ico{width:.9em;height:.9em;vertical-align:-.1em;display:inline-block;flex-shrink:0}
.qr-banner{display:flex;align-items:center;justify-content:space-between;padding:8px 16px;border-radius:6px;margin-bottom:.4rem}
.qr-banner .qr-label{font-weight:700;font-size:.85rem;color:#fff;flex:1;text-align:center}
.qr-banner .qr-img{width:45px;height:45px;flex-shrink:0;border-radius:3px}
.qr-banner .qr-img img{width:100%;height:100%;object-fit:contain}
.not-finding-bar{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);padding:.5rem 1rem;display:flex;align-items:center;gap:10px;border-radius:8px;margin-top:.5rem}
.not-finding-bar h4{font-size:.78rem;font-weight:700;color:var(--p4);display:inline-block;white-space:nowrap;margin:0}
.not-finding-bar p{font-size:.74rem;color:rgba(255,255,255,.5);margin:0}.not-finding-bar a{color:var(--p1-40);text-decoration:none;font-weight:600}
.print-view{display:none}
.skip-link{position:absolute;top:-50px;left:0;background:var(--p2);color:var(--wh);padding:.5rem 1rem;z-index:200;font-weight:700;text-decoration:none;transition:top .15s}.skip-link:focus{top:0}
.nf-footer{flex-shrink:0;background:#0f2236;padding:.45rem 1.5rem;border-top:2px solid var(--p4)}
.nf-footer-inner{max-width:1200px;margin:0 auto;display:flex;align-items:baseline;gap:.35rem;flex-wrap:wrap;font-size:.74rem;line-height:1.7}
.nf-footer-inner .nf-title{font-family:'Barlow',sans-serif;font-weight:700;color:var(--p4);white-space:nowrap}
.nf-footer-inner .nf-text{color:rgba(255,255,255,.55)}
.nf-footer-inner a{color:var(--p1-40);text-decoration:none;font-weight:600}
.nf-footer-inner a:hover{color:#fff;text-decoration:underline}
.nf-footer-inner .sep{color:rgba(255,255,255,.18);margin:0 .1rem}
.nf-footer-inner .nf-phone{color:rgba(255,255,255,.35);font-size:.71rem}
@media(max-width:900px){.layout-body{flex-direction:column}html,body{overflow:auto}.page-layout{height:auto;min-height:100vh}.sidebar{width:100%;height:auto;padding:1rem 1.5rem;border-right:none;border-bottom:1px solid rgba(255,255,255,.06)}.logo-card{max-width:200px;margin:0 auto}.sidebar-title h1{font-size:1.8rem}.sidebar-spacer{display:none}.sidebar-announcements{margin-top:.5rem}.sidebar-info{margin-top:.5rem}.sidebar-info .office-row{gap:.05rem .6rem}.home-grid{grid-template-columns:repeat(2,1fr)}.sheet-columns{grid-template-columns:1fr}#home-page.active{justify-content:flex-start;padding-top:.5rem}}
@media print{body{background:white;overflow:visible;height:auto}
.page-layout{display:block;height:auto}.layout-body{display:block}
.sidebar,.nf-footer,.crisis-banner,.skip-link,.home-search,.no-results,.search-results,#home-page,.sidebar-sheets,.sidebar-announcements,.screen-view{display:none!important}
.print-view{display:block!important}
.main-content{display:block;overflow:visible;padding:0;background:white;color:var(--g900)}
#sheet-container{display:block!important;max-width:none;padding:0;flex:none;overflow:visible}
a{text-decoration:none;color:inherit}
.print-page{margin:0;box-shadow:none;border-radius:0;width:8.5in;min-height:11in;max-height:11in;overflow:hidden!important;page-break-after:always;background:var(--wh);display:flex;flex-direction:column}
.page-header{background:var(--bd);color:var(--wh);text-align:center;padding:.18in .4in .15in;flex-shrink:0;position:relative;border-radius:0;margin-bottom:0}
.page-header::after{content:'';position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--gd),var(--gl),var(--gd))}
.page-header h1{font-weight:900;font-size:22pt;letter-spacing:.04em;text-transform:uppercase;font-family:'Barlow Condensed',sans-serif}
.page-body{flex:1;display:grid;padding:.12in .35in .08in;gap:.18in;overflow:hidden;align-content:start;min-height:0}
.page-body.two-col{grid-template-columns:1fr 1fr}
.page-body.one-col{grid-template-columns:1fr}
.page-footer{background:var(--bd);color:var(--wh);padding:.12in .25in;flex-shrink:0;display:flex;justify-content:space-between;align-items:flex-start;margin-top:.06in;flex-wrap:nowrap;gap:0}
.footer-group{display:flex;gap:.25in;align-items:flex-start;flex-wrap:nowrap}
.footer-col h4{font-size:6.2pt;font-weight:700;color:var(--gd);margin-bottom:0}
.footer-col p{font-size:5.8pt;opacity:.8;line-height:1.25}
.resource-column{overflow:hidden}
.faq-block{margin-bottom:.065in;font-family:'Karla',sans-serif;font-size:7.5pt;line-height:1.32;color:var(--g700)}
.faq-block h3{font-size:8.2pt!important;margin-bottom:0;line-height:1.3;color:var(--bd)}
.faq-block p{font-size:7.5pt;line-height:1.32;margin:0 0 1px 0;color:var(--g700)}
.faq-block ul,.faq-block ol{font-size:7.5pt;line-height:1.32;margin:0 0 1px 0;padding:0 0 0 1.4em}.faq-block li{margin-bottom:0}
.faq-block p,.faq-block li,.faq-block span,.faq-block div:not(.section-hdr):not(.two-col-block),.faq-block b,.faq-block i,.faq-block u,.faq-block strong,.faq-block em{font-size:7.5pt!important;color:var(--g700)}
.faq-block .section-hdr{font-size:8pt!important;color:var(--wh)!important;margin-top:0}
.faq-block .two-col-block{display:grid;grid-template-columns:1fr 1fr;gap:4px 8px;font-size:7.5pt}
.faq-block .two-col-block p{font-size:7.5pt}
.faq-block .two-col-block ul,.faq-block .two-col-block ol{font-size:7.5pt;margin:0 0 1px 0;padding:0 0 0 1.4em}
.chbs-callout{border-left:3px solid var(--gd);border-radius:0;padding:.05in .08in;margin-top:.06in;margin-bottom:6px;font-size:7.2pt;line-height:1.32;box-shadow:none;background:var(--g50)}
.chbs-callout h3{font-size:8.2pt;font-weight:700;color:var(--bd);margin-bottom:0}
.chbs-callout p,.chbs-callout div{font-size:7.2pt;line-height:1.32;color:var(--g700);margin:0;padding:0}
.chbs-callout ul,.chbs-callout ol{font-size:7.2pt;line-height:1.32;margin:0 0 1px 0;padding:0 0 0 1.4em}
.chbs-callout li,.chbs-callout span,.chbs-callout div,.chbs-callout b,.chbs-callout i,.chbs-callout u,.chbs-callout strong,.chbs-callout em{font-size:7.2pt!important;color:var(--g700)}
.chbs-callout .two-col-block{display:grid!important;grid-template-columns:1fr 1fr;gap:4px 8px;font-size:7.2pt;margin-top:4px}
.chbs-callout .two-col-block>div{padding:0;margin:0}
.section-hdr{background:var(--bd);color:var(--wh)!important;padding:2.5px 8px;border-radius:3px;font-weight:700;font-size:8pt!important;margin-bottom:3px;margin-top:7px;text-align:center}
.section-hdr:first-child{margin-top:0}
.res-entry{padding:2px 0;margin:0;background:none;border:none;border-bottom:1px solid var(--g100);border-radius:0;box-shadow:none}.res-entry:last-child{border-bottom:none}.res-entry:hover{background:none;box-shadow:none}
.res-name{font-weight:700;font-size:8pt;color:var(--g900);line-height:1.2}
.res-svc{font-size:7pt;color:var(--g500);font-style:italic;line-height:1.2}
.res-hours{font-size:7pt;color:var(--g500);line-height:1.2}
.res-addr{font-size:7.2pt;color:var(--g700);line-height:1.2}
.res-contact{display:flex;flex-wrap:wrap;gap:5px;align-items:baseline;font-size:7.2pt;line-height:1.2;margin-top:1px}
.res-contact .ph{font-weight:600;color:var(--bd);text-decoration:none}.res-contact .ws{color:var(--bm);text-decoration:none;font-weight:600;margin-left:auto}.res-contact .tx{color:var(--g500)}
.qr-banner{padding:4px 10px;border-radius:4px;margin-bottom:3px}.qr-banner .qr-label{font-size:8pt}.qr-banner .qr-img{width:38px;height:38px}
.not-finding-bar{border-radius:0;padding:.04in .35in;gap:8px;background:var(--g50);border:none;border-top:1px solid var(--g100);margin:0;flex-shrink:0}.not-finding-bar h4{font-size:7pt;color:var(--bd)}.not-finding-bar p{font-size:6.5pt;color:var(--g500)}
.ico{width:.9em;height:.9em;vertical-align:-.1em;display:inline-block;flex-shrink:0}
@page{size:letter;margin:0}}
</style></head><body>
<a class="skip-link" href="#main-content">Skip to content</a>
<div class="page-layout">
<div class="crisis-banner" role="alert">Experiencing a mental health crisis? Call MCAT at <a href="tel:3157326228">315-732-6228</a> for immediate assistance (24/7).</div>
<div class="layout-body">
<aside class="sidebar">
<div class="logo-card"><img src="src/CHBS Logo.png" alt="Community Health &amp; Behavioral Services"></div>
<div class="sidebar-title"><h1>Resource <span>Hub</span></h1><div class="sub">Your guide to local services, support, and resources in the Utica area</div></div>
<div class="sidebar-announcements" id="sidebar-ann"><div class="ann-label">Announcements</div><p>${si.announcements.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p></div>
<div class="sidebar-sheets" id="sheet-nav" style="display:none"><div class="sheets-label">Resources</div></div>
<div class="sidebar-spacer"></div>
<div class="sidebar-info">
<div class="info-label">Offices</div>
<div class="office-row">${si.offices.map(o=>'<div class="office"><strong>'+o.label.replace(/&/g,'&amp;')+'</strong> '+o.address.replace(/&/g,'&amp;')+'</div>').join('')}</div>
<div class="info-label">Hours &amp; Contact</div>
<div class="info-value">${si.hours.replace(/&/g,'&amp;')}<br><span class="phone-main"><a href="tel:${si.phone.replace(/[^0-9]/g,'')}">${si.phone}</a></span> <span style="opacity:.4;font-size:.63rem;margin-left:.2rem">Fax: ${si.fax}</span></div>
<div class="crisis-block"><div class="crisis-head">Crisis Stabilization Center</div><div class="crisis-detail">${si.crisisAddress.replace(/&/g,'&amp;')}<br><b>${si.crisisHours}</b> &#xb7; <a href="tel:${si.crisisPhone.replace(/[^0-9]/g,'')}">${si.crisisPhone}</a></div></div>
</div>
</aside>
<main class="main-content" id="main-content">
<div id="home-page" class="active">
<div class="home-search"><input type="text" id="search-input" placeholder="Search all resources, services, phone numbers..." aria-label="Search resources" oninput="handleSearch()"></div>
<div class="home-grid" id="home-grid"></div>
<div id="search-results" class="search-results" role="region" aria-label="Search results"></div>
<div id="no-results" class="no-results">No resources match your search.</div>
</div>
<div id="sheet-container" role="region" aria-label="Resource details"></div>
</main>
</div>
<footer class="nf-footer"><div class="nf-footer-inner">
<span class="nf-title">Not Finding What You Need?</span>
<span class="nf-text">We&#x2019;re here to support you. Reach out by phone or in person, or try:</span>
<a href="http://211midyork.com">United Way 211</a><span class="sep">&#xb7;</span>
<a href="http://nyconnects.ny.gov">NY Connects</a><span class="nf-phone">1-800-342-9871</span><span class="sep">&#xb7;</span>
<a href="http://oneidacountysoc.com">Oneida County System of Care</a><span class="nf-phone">315-768-3660</span>
</div></footer>
</div>
<script>
var DATA=`+dj+`;
function slugify(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function esc(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):''}
function renderHome(){
  var g=document.getElementById('home-grid');g.innerHTML='';
  DATA.home.forEach(function(e){
    var slug=slugify(e.sheetName),sh=DATA.sheets[slug];
    var has=sh&&sh.pages&&sh.pages.length>0&&sh.pages.some(function(p){return p.blocks&&p.blocks.length>0});
    var st=e.status||'live';
    if(st==='pending'||st==='in-progress')return;
    if(!has&&st!=='coming-soon')return;
    var c=document.createElement('a');c.className='home-card'+(st==='coming-soon'?' coming-soon':'');c.setAttribute('data-sheet',slug);
    if(st!=='coming-soon'&&has){c.href='#/'+slug}else{c.href='#';c.addEventListener('click',function(ev){ev.preventDefault()})}
    c.innerHTML='<div class="card-icon">'+(e.icon||'')+'</div><div class="card-title">'+e.title+'</div>';
    g.appendChild(c);
  });
}
function renderSheetNav(activeSlug){
  var nav=document.getElementById('sheet-nav');
  var html='<div class="sheets-label">Resources</div><a href="#/" style="margin-bottom:.4rem">\\u2190 Back to Hub</a>';
  DATA.home.forEach(function(e){
    var slug=slugify(e.sheetName),sh=DATA.sheets[slug];
    var has=sh&&sh.pages&&sh.pages.length>0&&sh.pages.some(function(p){return p.blocks&&p.blocks.length>0});
    var st=e.status||'live';
    if(st==='pending'||st==='in-progress'||st==='coming-soon')return;
    if(!has)return;
    html+='<a href="#/'+slug+'"'+(slug===activeSlug?' class="active"':'')+'>'+((e.icon&&e.icon.length<10)?e.icon+' ':'')+esc(e.title)+'</a>';
  });
  nav.innerHTML=html;
  nav.style.display='';
}
var SEARCH_INDEX=[];
function buildIndex(){
  var idx=[];
  for(var slug in DATA.sheets){
    var sh=DATA.sheets[slug];
    if(!sh.pages||!sh.pages.length)continue;
    var st='live';var icon='';DATA.home.forEach(function(e){if(slugify(e.sheetName)===slug){icon=e.icon||'';st=e.status||'live'}});
    if(st==='pending'||st==='in-progress')continue;
    var hasContent=sh.pages.some(function(p){return p.blocks&&p.blocks.length>0});
    if(!hasContent)continue;
    idx.push({text:sh.title.toLowerCase(),name:sh.title,detail:'Resource Sheet',sheet:slug,sheetTitle:sh.title,icon:icon,type:'sheet',pri:0});
    sh.pages.forEach(function(pg){
      (pg.blocks||[]).forEach(function(b){
        if(b.type==='FAQ'&&b.q){idx.push({text:(sh.title+' '+b.q+' '+(b.a||'')).toLowerCase(),name:b.q,detail:'',sheet:slug,sheetTitle:sh.title,icon:icon,type:'info',pri:1})}
        if(b.type==='CALLOUT'&&b.title){idx.push({text:(sh.title+' '+b.title+' '+(b.text||'')).toLowerCase(),name:b.title,detail:'',sheet:slug,sheetTitle:sh.title,icon:icon,type:'info',pri:1})}
        if(b.type==='SECTION'){
          (b.r||[]).forEach(function(r){
            idx.push({text:[sh.title,r.n,r.s,r.p,r.a,r.c,r.h,r.w].filter(Boolean).join(' ').toLowerCase(),name:r.n||'',detail:[r.s,r.p,r.a].filter(Boolean).join(' \\u00b7 '),sheet:slug,sheetTitle:sh.title,icon:icon,type:'resource',pri:2})
          })
        }
      })
    })
  }
  return idx;
}
function handleSearch(){
  var q=document.getElementById('search-input').value.trim().toLowerCase();
  var grid=document.getElementById('home-grid');
  var sr=document.getElementById('search-results');
  var nr=document.getElementById('no-results');
  var cards=grid.querySelectorAll('.home-card');
  cards.forEach(function(c){c.classList.remove('highlighted')});
  if(!q){
    sr.className='search-results';sr.innerHTML='';
    nr.style.display='none';
    return;
  }
  var words=q.split(/\\s+/);
  var matches=SEARCH_INDEX.filter(function(item){return words.every(function(w){return item.text.indexOf(w)>-1})});
  matches.sort(function(a,b){return(a.pri||2)-(b.pri||2)});
  var hitSheets={};
  matches.forEach(function(m){hitSheets[m.sheet]=1});
  cards.forEach(function(c){if(hitSheets[c.getAttribute('data-sheet')])c.classList.add('highlighted')});
  var results=[];
  var seen={};
  matches.forEach(function(m){
    if(m.type==='sheet')return;
    var k=m.name+'|'+m.sheet;if(seen[k])return;seen[k]=1;
    results.push(m);
  });
  if(matches.length===0){nr.style.display='block';sr.className='search-results';sr.innerHTML='';return}
  nr.style.display='none';
  var html='';
  results.slice(0,30).forEach(function(m){
    html+='<a class="search-result" href="#/'+m.sheet+'"><div class="result-info"><div class="result-name">'+esc(m.name)+'</div>'+(m.detail?'<div class="result-detail">'+esc(m.detail)+'</div>':'')+'</div><span class="result-sheet"><span class="rs-icon">'+m.icon+'</span>'+esc(m.sheetTitle)+'</span></a>';
  });
  if(results.length>30)html+='<div class="search-count">Showing first 30 of '+results.length+' results.</div>';
  sr.innerHTML=html;sr.className=results.length?'search-results active':'search-results';
}
function showSheet(k){
  if(!DATA.sheets[k])return;
  if(location.hash!=='#/'+k)history.pushState(null,null,'#/'+k);
  document.getElementById('home-page').classList.remove('active');
  document.getElementById('sidebar-ann').style.display='none';
  renderSheetNav(k);
  var sh=DATA.sheets[k],sc=document.getElementById('sheet-container');
  sc.className='';
  var contentHTML=renderSheetContent(sh);
  var printHTML=renderPrintContent(sh);
  sc.innerHTML='<div class="screen-view"><div class="sheet-header"><a class="back-link" href="#/" aria-label="Back to Resource Hub">\\u2190 Back</a><h2>'+esc(sh.title).toUpperCase()+'</h2><button class="print-btn" onclick="window.print()" aria-label="Print or save as PDF">Print / Save PDF</button></div><div class="sheet-body">'+contentHTML+'</div></div><div class="print-view">'+printHTML+'</div>';
  document.querySelector('.main-content').scrollTop=0;
  document.title='CHBS Resource Hub \\u2013 '+sh.title;
}
function goHome(){
  if(location.hash)history.pushState(null,null,location.pathname+location.search);
  document.getElementById('home-page').classList.add('active');
  document.getElementById('sheet-container').innerHTML='';
  document.getElementById('sheet-container').className='';
  document.getElementById('sheet-nav').style.display='none';
  document.getElementById('sidebar-ann').style.display='';
  document.querySelector('.main-content').scrollTop=0;
  document.title='CHBS Resource Hub';
  var si=document.getElementById('search-input');if(si){si.value='';handleSearch()}
}
function rb(b){
  var mb=b.spacing?'margin-bottom:'+b.spacing+'pt':'';
  switch(b.type){
    case 'FAQ':var c=b.aHTML||faqFB(b.a);var tc='';if(b.useTwoCol&&(b.colLeft||b.colRight)){tc='<div class="two-col-block"><div>'+(b.colLeft||'')+'</div><div>'+(b.colRight||'')+'</div></div>'}var qh=b.headerStyle==='banner'?'<div class="s-section-hdr">'+esc(b.q)+'</div>':'<h3>'+esc(b.q)+'</h3>';return '<div class="s-faq" style="'+mb+'">'+qh+c+tc+'</div>';
    case 'CALLOUT':var ct=b.textHTML||('<p>'+esc(b.text).replace(/\\n/g,'<br>')+'</p>');var ctc='';if(b.useTwoCol&&(b.colLeft||b.colRight)){ctc='<div class="two-col-block"><div>'+(b.colLeft||'')+'</div><div>'+(b.colRight||'')+'</div></div>'}return '<div class="s-callout" style="'+mb+'"><h3>'+esc(b.title)+'</h3>'+ct+ctc+'</div>';
    case 'QR':var qh='';(b.items||[]).forEach(function(it){var img=it.imgData?'<div class="qr-img"><img src="'+it.imgData+'"></div>':'';qh+='<div class="qr-banner" style="background:'+(it.bgColor||'#1b3a5c')+'"><span class="qr-label">'+esc(it.label)+'</span>'+img+'</div>'});return '<div style="'+mb+'">'+qh+'</div>';
    case 'SECTION':var s='<div class="s-section-hdr">'+esc(b.title)+'</div>';(b.r||[]).forEach(function(r){s+=renderEntry(r)});return '<div style="'+mb+'">'+s+'</div>';
    default:return '';
  }
}
function renderSheetContent(sh){
  var html='';
  sh.pages.forEach(function(pg){
    var blocks=pg.blocks||[];
    var cols=[[]],nfBlock=false;
    blocks.forEach(function(b){
      if(b.type==='NOTFINDING'){nfBlock=true;return;}
      if(b.newCol&&cols[cols.length-1].length>0){cols.push([]);}
      cols[cols.length-1].push(b);
    });
    if(cols.length>=2){
      html+='<div class="sheet-columns">'+cols.map(function(col){return '<div>'+col.map(rb).join('')+'</div>'}).join('')+'</div>';
    }else{
      html+=cols[0].map(rb).join('');
    }
    if(nfBlock){
      html+='<div class="not-finding-bar"><h4>Not Finding What You Need?</h4><p>Speak with any staff at CHBS, or try: <a href="http://211midyork.org">United Way</a> 211 &middot; <a href="http://nyconnects.ny.gov">NY Connects</a> 1-800-342-9871 &middot; <a href="http://oneidacountysoc.com">Oneida County System of Care</a> 315-768-3660</p></div>';
    }
  });
  return html;
}
function faqFB(text){if(!text)return'';var lines=text.split('\\n'),html='',inL=false;for(var i=0;i<lines.length;i++){var l=lines[i].trim();if(!l){if(inL){html+='</ul>';inL=false}continue}if(inL){if(l.slice(-1)===':'){html+='</ul>';inL=false;html+='<p>'+esc(l)+'</p>'}else{html+='<li>'+esc(l)+'</li>'}}else{var p='';for(var j=i-1;j>=0;j--){if(lines[j].trim()){p=lines[j].trim();break}}if(p.slice(-1)===':'&&l.slice(-1)!==':'){inL=true;html+='<ul><li>'+esc(l)+'</li>'}else{html+='<p>'+esc(l)+'</p>'}}}if(inL)html+='</ul>';return html}
var ICO_PH='<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
var ICO_TX='<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
var ICO_PIN='<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
function phoneLink(p){var digits=p.replace(/[^0-9]/g,'');return digits.length>=10?'<a class="e-phone" href="tel:'+digits+'">'+ICO_PH+' '+esc(p)+'</a>':'<span class="e-phone">'+ICO_PH+' '+esc(p)+'</span>'}
function renderEntry(r){var ct=[];if(r.p)ct.push(phoneLink(r.p));if(r.t)ct.push('<span class="e-text">'+ICO_TX+' '+esc(r.t)+'</span>');if(r.w)ct.push('<a class="e-web" href="'+(r.w.indexOf('http')===0?r.w:'https://'+r.w)+'" target="_blank">'+esc(r.w)+'</a>');var addr=r.a?'<div class="e-addr">'+ICO_PIN+' '+esc(r.a)+(r.c?' | '+esc(r.c):'')+'</div>':'';var hrs=r.h?'<div class="e-hours">'+esc(r.h)+'</div>':'';return '<div class="s-entry"><div class="e-name">'+esc(r.n)+'</div>'+(r.s?'<div class="e-svc">'+esc(r.s)+'</div>':'')+hrs+addr+(ct.length?'<div class="e-contact">'+ct.join(' ')+'</div>':'')+'</div>'}
function pPhoneLink(p){var digits=p.replace(/[^0-9]/g,'');return digits.length>=10?'<a class="ph" href="tel:'+digits+'">'+ICO_PH+' '+esc(p)+'</a>':'<span class="ph">'+ICO_PH+' '+esc(p)+'</span>'}
function pRenderEntry(r){var ct=[];if(r.p)ct.push(pPhoneLink(r.p));if(r.t)ct.push('<span class="tx">'+ICO_TX+' '+esc(r.t)+'</span>');if(r.w)ct.push('<a class="ws" href="'+(r.w.indexOf('http')===0?r.w:'https://'+r.w)+'" target="_blank">'+esc(r.w)+'</a>');var addr=r.a?'<div class="res-addr">'+ICO_PIN+' '+esc(r.a)+(r.c?' | '+esc(r.c):'')+'</div>':'';var hrs=r.h?'<div class="res-hours">'+esc(r.h)+'</div>':'';return '<div class="res-entry"><div class="res-name">'+esc(r.n)+'</div>'+(r.s?'<div class="res-svc">'+esc(r.s)+'</div>':'')+hrs+addr+(ct.length?'<div class="res-contact">'+ct.join(' ')+'</div>':'')+'</div>'}
function prb(b){
  var mb=b.spacing?'margin-bottom:'+b.spacing+'pt':'';
  switch(b.type){
    case 'FAQ':var c=b.aHTML||faqFB(b.a);var tc='';if(b.useTwoCol&&(b.colLeft||b.colRight)){tc='<div class="two-col-block"><div>'+(b.colLeft||'')+'</div><div>'+(b.colRight||'')+'</div></div>'}var qh=b.headerStyle==='banner'?'<div class="section-hdr">'+esc(b.q)+'</div>':'<h3>'+esc(b.q)+'</h3>';return '<div class="faq-block" style="'+mb+'">'+qh+c+tc+'</div>';
    case 'CALLOUT':var ct=b.textHTML||('<p>'+esc(b.text).replace(/\\n/g,'<br>')+'</p>');var ctc='';if(b.useTwoCol&&(b.colLeft||b.colRight)){ctc='<div class="two-col-block"><div>'+(b.colLeft||'')+'</div><div>'+(b.colRight||'')+'</div></div>'}return '<div class="chbs-callout" style="'+mb+'"><h3>'+esc(b.title)+'</h3>'+ct+ctc+'</div>';
    case 'QR':var qh='';(b.items||[]).forEach(function(it){var img=it.imgData?'<div class="qr-img"><img src="'+it.imgData+'"></div>':'';qh+='<div class="qr-banner" style="background:'+(it.bgColor||'#1b3a5c')+'"><span class="qr-label">'+esc(it.label)+'</span>'+img+'</div>'});return '<div style="'+mb+'">'+qh+'</div>';
    case 'SECTION':var s='<div class="section-hdr">'+esc(b.title)+'</div>';(b.r||[]).forEach(function(r){s+=pRenderEntry(r)});return '<div style="'+mb+'">'+s+'</div>';
    default:return '';
  }
}
function renderPrintPage(sh,pg){
  var blocks=pg.blocks||[];
  var cols=[[]],nfBlock=false;
  blocks.forEach(function(b){
    if(b.type==='NOTFINDING'){nfBlock=true;return;}
    if(b.newCol&&cols[cols.length-1].length>0){cols.push([]);}
    cols[cols.length-1].push(b);
  });
  var body='',cls='page-body one-col';
  if(cols.length>=2){cls='page-body two-col';body=cols.map(function(col){return '<div class="resource-column">'+col.map(prb).join('')+'</div>'}).join('')}
  else{body='<div class="resource-column">'+cols[0].map(prb).join('')+'</div>'}
  var nf=nfBlock?'<div class="not-finding-bar"><h4>Not Finding What You Need?</h4><p>Speak with any staff at CHBS, or try: <a href="http://211midyork.org">United Way</a> 211 &middot; <a href="http://nyconnects.ny.gov">NY Connects</a> 1-800-342-9871 &middot; <a href="http://oneidacountysoc.com">Oneida County System of Care</a> 315-768-3660</p></div>':'';
  var si=DATA.siteInfo||{};var offices=si.offices||[];
  var footerOffices=offices.map(function(o){return '<div class="footer-col"><h4>'+esc(o.label)+' Office</h4><p>'+esc(o.address).replace(/,/,'<br>')+'</p></div>'}).join('');
  var ph=si.phone||'315-798-8868';var fx=si.fax||'315-733-7105';
  var cAddr=si.crisisAddress||'1002 Oswego St., Utica 13502';var cPh=si.crisisPhone||'315-520-7802';var cHrs=si.crisisHours||'24/7/365';
  return '<div class="print-page"><div class="page-header"><h1>'+sh.title.toUpperCase()+'</h1></div><div class="'+cls+'">'+body+'</div>'+nf+'<div class="page-footer"><div class="footer-group">'+footerOffices+'<div class="footer-col"><p>Call: <a href="tel:'+ph.replace(/[^0-9]/g,'')+'">'+esc(ph)+'</a><br>Fax: '+esc(fx)+'</p></div></div><div class="footer-group"><div class="footer-col"><h4>Crisis Stabilization Center</h4><p>'+esc(cAddr).replace(/,/,'<br>')+'</p></div><div class="footer-col"><p><b>'+esc(cHrs)+'</b><br>Call: <a href="tel:'+cPh.replace(/[^0-9]/g,'')+'">'+esc(cPh)+'</a></p></div></div></div></div>';
}
function renderPrintContent(sh){
  return sh.pages.map(function(pg){return renderPrintPage(sh,pg)}).join('');
}
renderHome();SEARCH_INDEX=buildIndex();
function handleRoute(){var h=location.hash.replace('#/','');if(h&&DATA.sheets[h]){showSheet(h)}else{goHome()}}
window.addEventListener('popstate',handleRoute);
if(location.hash&&location.hash.length>2)handleRoute();
<`+`/script></body></html>`;
}

function exportHTML(){
  const html=generateStandaloneHTML();
  const blob=new Blob([html],{type:'text/html'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='chbs-resource-hub.html';a.click();
  toast('Standalone HTML exported!');
}
