// ===================================================================
// STATE — global data, state variables, constants, and utilities
// ===================================================================
let DATA = {home:[], sheets:{}};
let dataLoaded = false;

let currentView = 'welcome';
let openBlocks = new Set();
let dragState = null;
let sheetBlocks = {};

// QR preset colors
const QR_COLORS = [
  {name:'Navy', value:'#1b3a5c'},
  {name:'Blue', value:'#2e6494'},
  {name:'Red', value:'#c0392b'},
  {name:'Green', value:'#27ae60'},
  {name:'Orange', value:'#e67e22'},
  {name:'Yellow', value:'#f1c40f'},
  {name:'Purple', value:'#8e44ad'},
  {name:'Teal', value:'#16a085'},
  {name:'Gold', value:'#d4a843'},
  {name:'Dark Gray', value:'#3d3d3d'}
];

function slugify(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function esc(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):''}
function uid(){return 'id_'+Math.random().toString(36).substr(2,9)}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
