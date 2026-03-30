/* ===================================================================
   CHBS Resource Hub — Public Site Logic
   Fetches published.json and renders the entire site dynamically.
   =================================================================== */

(function () {
  'use strict';

  // --- Utility ---
  function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function esc(s) { return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }

  // --- SVG Icons ---
  var ICO_PH = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
  var ICO_TX = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var ICO_PIN = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';

  // --- State ---
  var DATA = null;
  var SEARCH_INDEX = [];

  // =========================================================
  // DATA LOADING
  // =========================================================
  function loadData() {
    var container = document.getElementById('main-content');
    container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div><p>Loading resources\u2026</p></div>';

    fetch('data/published.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (json) {
        DATA = json;
        SEARCH_INDEX = buildIndex();
        renderSidebar();
        renderHome();
        handleRoute();
      })
      .catch(function (err) {
        container.innerHTML = '<div class="load-error"><h2>Unable to load resources</h2><p>' + esc(err.message) + '</p><button onclick="location.reload()">Retry</button></div>';
      });
  }

  // =========================================================
  // SIDEBAR (dynamic from siteInfo)
  // =========================================================
  function renderSidebar() {
    var si = DATA.siteInfo || {};
    var offices = si.offices || [];
    var ann = si.announcements || '';

    // Announcements
    var annEl = document.getElementById('sidebar-ann');
    if (annEl) {
      var annP = annEl.querySelector('p');
      if (annP) annP.textContent = ann;
    }

    // Offices
    var officeEl = document.getElementById('sidebar-offices');
    if (officeEl) {
      officeEl.innerHTML = offices.map(function (o) {
        return '<div class="office"><strong>' + esc(o.label) + '</strong> ' + esc(o.address) + '</div>';
      }).join('');
    }

    // Contact info
    var contactEl = document.getElementById('sidebar-contact');
    if (contactEl) {
      var hours = si.hours || 'Mon\u2013Fri 8am \u2013 4:30pm';
      var phone = si.phone || '315-798-8868';
      var fax = si.fax || '315-733-7105';
      var digits = phone.replace(/[^0-9]/g, '');
      contactEl.innerHTML = esc(hours) + '<br><span class="phone-main"><a href="tel:' + digits + '">' + esc(phone) + '</a></span> <span style="opacity:.4;font-size:.63rem;margin-left:.2rem">Fax: ' + esc(fax) + '</span>';
    }

    // Crisis info
    var crisisEl = document.getElementById('sidebar-crisis');
    if (crisisEl) {
      var cAddr = si.crisisAddress || '1002 Oswego St., Utica 13502';
      var cPhone = si.crisisPhone || '315-520-7802';
      var cHours = si.crisisHours || '24/7/365';
      var cDigits = cPhone.replace(/[^0-9]/g, '');
      crisisEl.innerHTML = esc(cAddr) + '<br><b>' + esc(cHours) + '</b> \u00b7 <a href="tel:' + cDigits + '">' + esc(cPhone) + '</a>';
    }
  }

  // =========================================================
  // HOME PAGE
  // =========================================================
  function renderHome() {
    var g = document.getElementById('home-grid');
    if (!g) return;
    g.innerHTML = '';
    DATA.home.forEach(function (e) {
      var slug = slugify(e.sheetName), sh = DATA.sheets[slug];
      var has = sh && sh.pages && sh.pages.length > 0 && sh.pages.some(function (p) { return p.blocks && p.blocks.length > 0; });
      var st = e.status || 'live';
      if (st === 'pending' || st === 'in-progress') return;
      if (!has && st !== 'coming-soon') return;
      var c = document.createElement('a');
      c.className = 'home-card' + (st === 'coming-soon' ? ' coming-soon' : '');
      c.setAttribute('data-sheet', slug);
      if (st !== 'coming-soon' && has) { c.href = '#/' + slug; }
      else { c.href = '#'; c.addEventListener('click', function (ev) { ev.preventDefault(); }); }
      c.innerHTML = '<div class="card-icon">' + (e.icon || '') + '</div><div class="card-title">' + esc(e.title) + '</div>';
      g.appendChild(c);
    });
  }

  function renderSheetNav(activeSlug) {
    var nav = document.getElementById('sheet-nav');
    var html = '<div class="sheets-label">Resources</div><a href="#/" style="margin-bottom:.4rem">\u2190 Back to Hub</a>';
    DATA.home.forEach(function (e) {
      var slug = slugify(e.sheetName), sh = DATA.sheets[slug];
      var has = sh && sh.pages && sh.pages.length > 0 && sh.pages.some(function (p) { return p.blocks && p.blocks.length > 0; });
      var st = e.status || 'live';
      if (st === 'pending' || st === 'in-progress' || st === 'coming-soon') return;
      if (!has) return;
      html += '<a href="#/' + slug + '"' + (slug === activeSlug ? ' class="active"' : '') + '>' + ((e.icon && e.icon.length < 10) ? e.icon + ' ' : '') + esc(e.title) + '</a>';
    });
    nav.innerHTML = html;
    nav.style.display = '';
  }

  // =========================================================
  // SEARCH
  // =========================================================
  function buildIndex() {
    var idx = [];
    for (var slug in DATA.sheets) {
      var sh = DATA.sheets[slug];
      if (!sh.pages || !sh.pages.length) continue;
      var st = 'live', icon = '';
      DATA.home.forEach(function (e) { if (slugify(e.sheetName) === slug) { icon = e.icon || ''; st = e.status || 'live'; } });
      if (st === 'pending' || st === 'in-progress') continue;
      var hasContent = sh.pages.some(function (p) { return p.blocks && p.blocks.length > 0; });
      if (!hasContent) continue;
      idx.push({ text: sh.title.toLowerCase(), name: sh.title, detail: 'Resource Sheet', sheet: slug, sheetTitle: sh.title, icon: icon, type: 'sheet', pri: 0 });
      sh.pages.forEach(function (pg) {
        (pg.blocks || []).forEach(function (b) {
          if (b.type === 'FAQ' && b.q) { idx.push({ text: (sh.title + ' ' + b.q + ' ' + (b.a || '')).toLowerCase(), name: b.q, detail: '', sheet: slug, sheetTitle: sh.title, icon: icon, type: 'info', pri: 1 }); }
          if (b.type === 'CALLOUT' && b.title) { idx.push({ text: (sh.title + ' ' + b.title + ' ' + (b.text || '')).toLowerCase(), name: b.title, detail: '', sheet: slug, sheetTitle: sh.title, icon: icon, type: 'info', pri: 1 }); }
          if (b.type === 'SECTION') {
            (b.r || []).forEach(function (r) {
              idx.push({ text: [sh.title, r.n, r.s, r.p, r.a, r.c, r.h, r.w].filter(Boolean).join(' ').toLowerCase(), name: r.n || '', detail: [r.s, r.p, r.a].filter(Boolean).join(' \u00b7 '), sheet: slug, sheetTitle: sh.title, icon: icon, type: 'resource', pri: 2 });
            });
          }
        });
      });
    }
    return idx;
  }

  function handleSearch() {
    var q = document.getElementById('search-input').value.trim().toLowerCase();
    var grid = document.getElementById('home-grid');
    var sr = document.getElementById('search-results');
    var nr = document.getElementById('no-results');
    var cards = grid.querySelectorAll('.home-card');
    cards.forEach(function (c) { c.classList.remove('highlighted'); });
    if (!q) {
      sr.className = 'search-results'; sr.innerHTML = '';
      nr.style.display = 'none';
      return;
    }
    var words = q.split(/\s+/);
    var matches = SEARCH_INDEX.filter(function (item) { return words.every(function (w) { return item.text.indexOf(w) > -1; }); });
    matches.sort(function (a, b) { return (a.pri || 2) - (b.pri || 2); });
    var hitSheets = {};
    matches.forEach(function (m) { hitSheets[m.sheet] = 1; });
    cards.forEach(function (c) { if (hitSheets[c.getAttribute('data-sheet')]) c.classList.add('highlighted'); });
    var results = [], seen = {};
    matches.forEach(function (m) {
      if (m.type === 'sheet') return;
      var k = m.name + '|' + m.sheet; if (seen[k]) return; seen[k] = 1;
      results.push(m);
    });
    if (matches.length === 0) { nr.style.display = 'block'; sr.className = 'search-results'; sr.innerHTML = ''; return; }
    nr.style.display = 'none';
    var html = '';
    results.slice(0, 30).forEach(function (m) {
      html += '<a class="search-result" href="#/' + m.sheet + '"><div class="result-info"><div class="result-name">' + esc(m.name) + '</div>' + (m.detail ? '<div class="result-detail">' + esc(m.detail) + '</div>' : '') + '</div><span class="result-sheet"><span class="rs-icon">' + m.icon + '</span>' + esc(m.sheetTitle) + '</span></a>';
    });
    if (results.length > 30) html += '<div class="search-count">Showing first 30 of ' + results.length + ' results.</div>';
    sr.innerHTML = html;
    sr.className = results.length ? 'search-results active' : 'search-results';
  }

  // =========================================================
  // SHEET RENDERING — Screen View
  // =========================================================
  function phoneLink(p) {
    var digits = p.replace(/[^0-9]/g, '');
    return digits.length >= 10 ? '<a class="e-phone" href="tel:' + digits + '">' + ICO_PH + ' ' + esc(p) + '</a>' : '<span class="e-phone">' + ICO_PH + ' ' + esc(p) + '</span>';
  }

  function renderEntry(r) {
    var ct = [];
    if (r.p) ct.push(phoneLink(r.p));
    if (r.t) ct.push('<span class="e-text">' + ICO_TX + ' ' + esc(r.t) + '</span>');
    if (r.w) ct.push('<a class="e-web" href="' + (r.w.indexOf('http') === 0 ? r.w : 'https://' + r.w) + '" target="_blank">' + esc(r.w) + '</a>');
    var addr = r.a ? '<div class="e-addr">' + ICO_PIN + ' ' + esc(r.a) + (r.c ? ' | ' + esc(r.c) : '') + '</div>' : '';
    var hrs = r.h ? '<div class="e-hours">' + esc(r.h) + '</div>' : '';
    return '<div class="s-entry"><div class="e-name">' + esc(r.n) + '</div>' + (r.s ? '<div class="e-svc">' + esc(r.s) + '</div>' : '') + hrs + addr + (ct.length ? '<div class="e-contact">' + ct.join(' ') + '</div>' : '') + '</div>';
  }

  function faqFB(text) {
    if (!text) return '';
    var lines = text.split('\n'), html = '', inL = false;
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i].trim();
      if (!l) { if (inL) { html += '</ul>'; inL = false; } continue; }
      if (inL) {
        if (l.slice(-1) === ':') { html += '</ul>'; inL = false; html += '<p>' + esc(l) + '</p>'; }
        else { html += '<li>' + esc(l) + '</li>'; }
      } else {
        var p = ''; for (var j = i - 1; j >= 0; j--) { if (lines[j].trim()) { p = lines[j].trim(); break; } }
        if (p.slice(-1) === ':' && l.slice(-1) !== ':') { inL = true; html += '<ul><li>' + esc(l) + '</li>'; }
        else { html += '<p>' + esc(l) + '</p>'; }
      }
    }
    if (inL) html += '</ul>';
    return html;
  }

  function rb(b) {
    var mb = b.spacing ? 'margin-bottom:' + b.spacing + 'pt' : '';
    switch (b.type) {
      case 'FAQ':
        var c = b.aHTML || faqFB(b.a);
        var tc = '';
        if (b.useTwoCol && (b.colLeft || b.colRight)) { tc = '<div class="two-col-block"><div>' + (b.colLeft || '') + '</div><div>' + (b.colRight || '') + '</div></div>'; }
        var qh = b.headerStyle === 'banner' ? '<div class="s-section-hdr">' + esc(b.q) + '</div>' : '<h3>' + esc(b.q) + '</h3>';
        return '<div class="s-faq" style="' + mb + '">' + qh + c + tc + '</div>';
      case 'CALLOUT':
        var ct = b.textHTML || ('<p>' + esc(b.text).replace(/\n/g, '<br>') + '</p>');
        var ctc = '';
        if (b.useTwoCol && (b.colLeft || b.colRight)) { ctc = '<div class="two-col-block"><div>' + (b.colLeft || '') + '</div><div>' + (b.colRight || '') + '</div></div>'; }
        return '<div class="s-callout" style="' + mb + '"><h3>' + esc(b.title) + '</h3>' + ct + ctc + '</div>';
      case 'QR':
        var qh2 = '';
        (b.items || []).forEach(function (it) {
          var img = it.imgData ? '<div class="qr-img"><img src="' + it.imgData + '"></div>' : '';
          qh2 += '<div class="qr-banner" style="background:' + (it.bgColor || '#1b3a5c') + '"><span class="qr-label">' + esc(it.label) + '</span>' + img + '</div>';
        });
        return '<div style="' + mb + '">' + qh2 + '</div>';
      case 'SECTION':
        var s = '<div class="s-section-hdr">' + esc(b.title) + '</div>';
        (b.r || []).forEach(function (r) { s += renderEntry(r); });
        return '<div style="' + mb + '">' + s + '</div>';
      default: return '';
    }
  }

  function renderSheetContent(sh) {
    var html = '';
    sh.pages.forEach(function (pg) {
      var blocks = pg.blocks || [];
      var cols = [[]], nfBlock = false;
      blocks.forEach(function (b) {
        if (b.type === 'NOTFINDING') { nfBlock = true; return; }
        if (b.newCol && cols[cols.length - 1].length > 0) { cols.push([]); }
        cols[cols.length - 1].push(b);
      });
      if (cols.length >= 2) {
        html += '<div class="sheet-columns">' + cols.map(function (col) { return '<div>' + col.map(rb).join('') + '</div>'; }).join('') + '</div>';
      } else {
        html += cols[0].map(rb).join('');
      }
      if (nfBlock) {
        html += '<div class="not-finding-bar"><h4>Not Finding What You Need?</h4><p>Speak with any staff at CHBS, or try: <a href="http://211midyork.org">United Way</a> 211 &middot; <a href="http://nyconnects.ny.gov">NY Connects</a> 1-800-342-9871 &middot; <a href="http://oneidacountysoc.com">Oneida County System of Care</a> 315-768-3660</p></div>';
      }
    });
    return html;
  }

  // =========================================================
  // SHEET RENDERING — Print View
  // =========================================================
  function pPhoneLink(p) {
    var digits = p.replace(/[^0-9]/g, '');
    return digits.length >= 10 ? '<a class="ph" href="tel:' + digits + '">' + ICO_PH + ' ' + esc(p) + '</a>' : '<span class="ph">' + ICO_PH + ' ' + esc(p) + '</span>';
  }

  function pRenderEntry(r) {
    var ct = [];
    if (r.p) ct.push(pPhoneLink(r.p));
    if (r.t) ct.push('<span class="tx">' + ICO_TX + ' ' + esc(r.t) + '</span>');
    if (r.w) ct.push('<a class="ws" href="' + (r.w.indexOf('http') === 0 ? r.w : 'https://' + r.w) + '" target="_blank">' + esc(r.w) + '</a>');
    var addr = r.a ? '<div class="res-addr">' + ICO_PIN + ' ' + esc(r.a) + (r.c ? ' | ' + esc(r.c) : '') + '</div>' : '';
    var hrs = r.h ? '<div class="res-hours">' + esc(r.h) + '</div>' : '';
    return '<div class="res-entry"><div class="res-name">' + esc(r.n) + '</div>' + (r.s ? '<div class="res-svc">' + esc(r.s) + '</div>' : '') + hrs + addr + (ct.length ? '<div class="res-contact">' + ct.join(' ') + '</div>' : '') + '</div>';
  }

  function prb(b) {
    var mb = b.spacing ? 'margin-bottom:' + b.spacing + 'pt' : '';
    switch (b.type) {
      case 'FAQ':
        var c = b.aHTML || faqFB(b.a);
        var tc = '';
        if (b.useTwoCol && (b.colLeft || b.colRight)) { tc = '<div class="two-col-block"><div>' + (b.colLeft || '') + '</div><div>' + (b.colRight || '') + '</div></div>'; }
        var qh = b.headerStyle === 'banner' ? '<div class="section-hdr">' + esc(b.q) + '</div>' : '<h3>' + esc(b.q) + '</h3>';
        return '<div class="faq-block" style="' + mb + '">' + qh + c + tc + '</div>';
      case 'CALLOUT':
        var ct = b.textHTML || ('<p>' + esc(b.text).replace(/\n/g, '<br>') + '</p>');
        var ctc = '';
        if (b.useTwoCol && (b.colLeft || b.colRight)) { ctc = '<div class="two-col-block"><div>' + (b.colLeft || '') + '</div><div>' + (b.colRight || '') + '</div></div>'; }
        return '<div class="chbs-callout" style="' + mb + '"><h3>' + esc(b.title) + '</h3>' + ct + ctc + '</div>';
      case 'QR':
        var qh2 = '';
        (b.items || []).forEach(function (it) {
          var img = it.imgData ? '<div class="qr-img"><img src="' + it.imgData + '"></div>' : '';
          qh2 += '<div class="qr-banner" style="background:' + (it.bgColor || '#1b3a5c') + '"><span class="qr-label">' + esc(it.label) + '</span>' + img + '</div>';
        });
        return '<div style="' + mb + '">' + qh2 + '</div>';
      case 'SECTION':
        var s = '<div class="section-hdr">' + esc(b.title) + '</div>';
        (b.r || []).forEach(function (r) { s += pRenderEntry(r); });
        return '<div style="' + mb + '">' + s + '</div>';
      default: return '';
    }
  }

  function renderPrintPage(sh, pg) {
    var blocks = pg.blocks || [];
    var cols = [[]], nfBlock = false;
    blocks.forEach(function (b) {
      if (b.type === 'NOTFINDING') { nfBlock = true; return; }
      if (b.newCol && cols[cols.length - 1].length > 0) { cols.push([]); }
      cols[cols.length - 1].push(b);
    });
    var body = '', cls = 'page-body one-col';
    if (cols.length >= 2) {
      cls = 'page-body two-col';
      body = cols.map(function (col) { return '<div class="resource-column">' + col.map(prb).join('') + '</div>'; }).join('');
    } else {
      body = '<div class="resource-column">' + cols[0].map(prb).join('') + '</div>';
    }
    var nf = nfBlock ? '<div class="not-finding-bar"><h4>Not Finding What You Need?</h4><p>Speak with any staff at CHBS, or try: <a href="http://211midyork.org">United Way</a> 211 &middot; <a href="http://nyconnects.ny.gov">NY Connects</a> 1-800-342-9871 &middot; <a href="http://oneidacountysoc.com">Oneida County System of Care</a> 315-768-3660</p></div>' : '';
    var si = DATA.siteInfo || {};
    var offices = si.offices || [];
    var footerOffices = offices.map(function (o) { return '<div class="footer-col"><h4>' + esc(o.label) + ' Office</h4><p>' + esc(o.address).replace(/,/, '<br>') + '</p></div>'; }).join('');
    var ph = si.phone || '315-798-8868', fx = si.fax || '315-733-7105';
    var cAddr = si.crisisAddress || '1002 Oswego St., Utica 13502', cPh = si.crisisPhone || '315-520-7802', cHrs = si.crisisHours || '24/7/365';
    return '<div class="print-page"><div class="page-header"><h1>' + sh.title.toUpperCase() + '</h1></div><div class="' + cls + '">' + body + '</div>' + nf + '<div class="page-footer"><div class="footer-group">' + footerOffices + '<div class="footer-col"><p>Call: <a href="tel:' + ph.replace(/[^0-9]/g, '') + '">' + esc(ph) + '</a><br>Fax: ' + esc(fx) + '</p></div></div><div class="footer-group"><div class="footer-col"><h4>Crisis Stabilization Center</h4><p>' + esc(cAddr).replace(/,/, '<br>') + '</p></div><div class="footer-col"><p><b>' + esc(cHrs) + '</b><br>Call: <a href="tel:' + cPh.replace(/[^0-9]/g, '') + '">' + esc(cPh) + '</a></p></div></div></div></div>';
  }

  function renderPrintContent(sh) {
    return sh.pages.map(function (pg) { return renderPrintPage(sh, pg); }).join('');
  }

  // =========================================================
  // NAVIGATION
  // =========================================================
  function showSheet(k) {
    if (!DATA.sheets[k]) return;
    if (location.hash !== '#/' + k) history.pushState(null, null, '#/' + k);
    document.getElementById('home-page').classList.remove('active');
    document.getElementById('sidebar-ann').style.display = 'none';
    renderSheetNav(k);
    var sh = DATA.sheets[k], sc = document.getElementById('sheet-container');
    sc.className = '';
    var contentHTML = renderSheetContent(sh);
    var printHTML = renderPrintContent(sh);
    sc.innerHTML = '<div class="screen-view"><div class="sheet-header"><a class="back-link" href="#/" aria-label="Back to Resource Hub">\u2190 Back</a><h2>' + esc(sh.title).toUpperCase() + '</h2><button class="print-btn" onclick="window.print()" aria-label="Print or save as PDF">Print / Save PDF</button></div><div class="sheet-body">' + contentHTML + '</div></div><div class="print-view">' + printHTML + '</div>';
    document.querySelector('.main-content').scrollTop = 0;
    document.title = 'CHBS Resource Hub \u2013 ' + sh.title;
  }

  function goHome() {
    if (location.hash) history.pushState(null, null, location.pathname + location.search);
    document.getElementById('home-page').classList.add('active');
    document.getElementById('sheet-container').innerHTML = '';
    document.getElementById('sheet-container').className = '';
    document.getElementById('sheet-nav').style.display = 'none';
    document.getElementById('sidebar-ann').style.display = '';
    document.querySelector('.main-content').scrollTop = 0;
    document.title = 'CHBS Resource Hub';
    var si = document.getElementById('search-input');
    if (si) { si.value = ''; handleSearch(); }
  }

  function handleRoute() {
    if (!DATA) return;
    var h = location.hash.replace('#/', '');
    if (h && DATA.sheets[h]) { showSheet(h); }
    else { goHome(); }
  }

  // =========================================================
  // INIT
  // =========================================================
  window.addEventListener('popstate', handleRoute);

  // Expose search handler globally for the oninput attribute
  window.handleSearch = handleSearch;

  // Load data on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadData);
  } else {
    loadData();
  }

})();
