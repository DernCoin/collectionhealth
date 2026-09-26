const COLLECTIONS_KEY = 'shelf-insight-collections';
const RECORDS_KEY = 'shelf-insight-records';

const starterCollections = [
  { id: 'adult-fiction', name: 'Adult Fiction', code: 'FIC', size: 8420 },
  { id: 'childrens', name: "Children's", code: 'JUV', size: 6150 },
  { id: 'young-adult', name: 'Young Adult', code: 'YA', size: 3280 },
  { id: 'nonfiction', name: 'Nonfiction', code: 'NF', size: 9730 },
  { id: 'media', name: 'Media', code: 'AV', size: 2410 },
];

const monthKeys = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
const patterns = {
  'adult-fiction': [2940, 3120, 3280, 3530, 3710, 3890],
  childrens: [1980, 2250, 2780, 3210, 2980, 3150],
  'young-adult': [960, 1050, 1170, 1260, 1390, 1470],
  nonfiction: [1760, 1690, 1840, 1920, 2010, 2090],
  media: [760, 720, 690, 650, 610, 570],
};

const defaultRecords = monthKeys.flatMap((month) => starterCollections.map((collection) => ({
  id: `${collection.id}-${month}`,
  collectionId: collection.id,
  month,
  checkouts: patterns[collection.id][monthKeys.indexOf(month)],
})));

let collections = load(COLLECTIONS_KEY, starterCollections);
let records = load(RECORDS_KEY, defaultRecords);
let selectedCollection = 'all';
let trendRange = 6;

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function save() {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}
function formatNumber(n) { return new Intl.NumberFormat('en-US').format(n); }
function monthLabel(key, short = false) {
  const date = new Date(`${key}-02T00:00:00`);
  return new Intl.DateTimeFormat('en-US', { month: short ? 'short' : 'long', year: short ? undefined : 'numeric' }).format(date);
}
function currentMonth() { return records.map(r => r.month).sort().at(-1) || new Date().toISOString().slice(0, 7); }
function priorMonth(month) { const d = new Date(`${month}-02`); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); }
function collectionValue(id, month) { return records.find(r => r.collectionId === id && r.month === month)?.checkouts || 0; }
function totalFor(month) { return collections.reduce((sum, c) => sum + collectionValue(c.id, month), 0); }
function delta(now, before) { return before ? ((now - before) / before) * 100 : 0; }
function trendBadge(value) {
  const type = value > 0.05 ? 'up' : value < -0.05 ? 'down' : 'flat';
  const icon = type === 'up' ? '↗' : type === 'down' ? '↘' : '→';
  return `<span class="trend ${type}">${icon} ${Math.abs(value).toFixed(1)}%</span>`;
}

function render() {
  const month = currentMonth();
  const previous = priorMonth(month);
  const totalCheckouts = totalFor(month);
  const previousCheckouts = totalFor(previous);
  const totalItems = collections.reduce((sum, c) => sum + c.size, 0);
  const yearlyTurnover = totalItems ? (totalCheckouts * 12) / totalItems : 0;

  document.querySelector('#app').innerHTML = `
    <header class="topbar">
      <a class="brand" href="#" aria-label="Shelf Insight home"><span class="logo">S</span><span>Shelf Insight</span></a>
      <nav><a class="nav-link active" href="#app">Overview</a><a class="nav-link" href="#collections">Collections</a></nav>
      <div class="header-actions"><button class="icon-btn" aria-label="Notifications">○<span class="notification"></span></button><div class="avatar">ML</div><div class="user"><strong>Marian Lewis</strong><span>Head Librarian</span></div></div>
    </header>
    <main>
      <section class="hero">
        <div><p class="eyebrow">COLLECTION HEALTH</p><h1>Good morning, Marian.</h1><p class="subhead">Here’s how your collections are performing this month.</p></div>
        <button class="primary" id="add-data"><span>＋</span> Add monthly data</button>
      </section>
      <section class="metrics" aria-label="Key metrics">
        ${metric('Monthly checkouts', formatNumber(totalCheckouts), '↗', `${Math.abs(delta(totalCheckouts, previousCheckouts)).toFixed(1)}%`, 'vs. last month', 'positive')}
        ${metric('Total collection', formatNumber(totalItems), '▤', '', `${collections.length} active collections`, '')}
        ${metric('Annualized turnover', yearlyTurnover.toFixed(1), '↻', '', 'checkouts per item', '')}
        ${metric('Strongest growth', strongestGrowth(month, previous).name, '↗', `+${strongestGrowth(month, previous).growth.toFixed(1)}%`, 'vs. last month', 'positive')}
      </section>
      <section class="dashboard-grid">
        <article class="panel trend-panel">
          <div class="panel-heading"><div><h2>Circulation trend</h2><p>Monthly checkouts across all collections</p></div><select id="range"><option value="6" ${trendRange===6?'selected':''}>Last 6 months</option><option value="12" ${trendRange===12?'selected':''}>Last 12 months</option></select></div>
          ${renderChart()}
        </article>
        <article class="panel health-panel">
          <div class="panel-heading"><div><h2>Collection health</h2><p>Current month turnover</p></div><button class="more" aria-label="More options">•••</button></div>
          <div class="health-list">${collections.slice().sort((a,b) => collectionValue(b.id,month)/b.size - collectionValue(a.id,month)/a.size).map((c,i) => healthRow(c, month, i)).join('')}</div>
          <p class="health-note"><span>i</span> Turnover is annualized based on this month's circulation.</p>
        </article>
      </section>
      <section class="panel collections-panel" id="collections">
        <div class="panel-heading table-heading"><div><h2>Collection performance</h2><p>Detailed view for ${monthLabel(month)}</p></div><div class="table-actions"><label class="search">⌕ <input id="search" placeholder="Search collections" /></label><button class="outline" id="manage">Manage collections</button></div></div>
        <div class="table-wrap"><table><thead><tr><th>COLLECTION</th><th>ITEMS</th><th>CHECKOUTS</th><th>TURNOVER</th><th>VS. LAST MONTH</th><th>TREND</th></tr></thead><tbody id="collection-rows">${renderRows('')}</tbody></table></div>
      </section>
      <footer><span>Data last updated ${monthLabel(month)} 30, 2026</span><span>© 2026 Shelf Insight · <a href="#">Help & support</a></span></footer>
    </main>
    ${modalMarkup()}
  `;
  bindEvents();
}

function metric(label, value, icon, change, note, type) {
  return `<article class="metric-card"><div class="metric-top"><span>${label}</span><span class="metric-icon ${type}">${icon}</span></div><strong class="metric-value">${value}</strong><p>${change ? `<b class="${type}">${change}</b> ` : ''}${note}</p></article>`;
}
function strongestGrowth(month, previous) {
  return collections.map(c => ({ name: c.name, growth: delta(collectionValue(c.id,month),collectionValue(c.id,previous)) })).sort((a,b)=>b.growth-a.growth)[0] || {name:'—',growth:0};
}
function healthRow(c, month, index) {
  const turnover = c.size ? collectionValue(c.id, month) * 12 / c.size : 0;
  const widths = [92,78,64,45,28];
  return `<div class="health-row"><div><span class="dot dot-${index}"></span><strong>${c.name}</strong><span>${c.code}</span></div><strong>${turnover.toFixed(1)}</strong><div class="progress"><i class="fill-${index}" style="width:${Math.min(100,widths[index]||25)}%"></i></div></div>`;
}
function renderChart() {
  const months = [...new Set(records.map(r=>r.month))].sort().slice(-trendRange);
  const values = months.map(totalFor); const max = Math.max(...values, 1); const min = Math.min(...values, 0) * .88;
  const points = values.map((v,i) => `${44 + i*(656/Math.max(1,months.length-1))},${190-(v-min)/(max-min||1)*130}`).join(' ');
  const area = `44,205 ${points} 700,205`;
  return `<div class="chart"><svg viewBox="0 0 744 235" role="img" aria-label="Monthly checkout line chart"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#287c69" stop-opacity=".22"/><stop offset="1" stop-color="#287c69" stop-opacity="0"/></linearGradient></defs>${[35,75,115,155,195].map(y=>`<line x1="44" y1="${y}" x2="710" y2="${y}"/>`).join('')}<polygon points="${area}" fill="url(#area)"/><polyline points="${points}"/><g>${values.map((v,i)=>`<circle cx="${44+i*(656/Math.max(1,months.length-1))}" cy="${190-(v-min)/(max-min||1)*130}" r="4"/>`).join('')}</g></svg><div class="chart-labels">${months.map(m=>`<span>${monthLabel(m,true)}</span>`).join('')}</div></div>`;
}
function sparkline(c) {
  const vals = records.filter(r=>r.collectionId===c.id).sort((a,b)=>a.month.localeCompare(b.month)).slice(-6).map(r=>r.checkouts);
  const min=Math.min(...vals), max=Math.max(...vals); const pts=vals.map((v,i)=>`${i*13},${22-(v-min)/(max-min||1)*18}`).join(' ');
  const up=(vals.at(-1)||0)>=(vals[0]||0);
  return `<svg class="spark ${up?'spark-up':'spark-down'}" viewBox="0 0 66 26"><polyline points="${pts}"/></svg>`;
}
function renderRows(query) {
  const month=currentMonth(), previous=priorMonth(month);
  return collections.filter(c=>c.name.toLowerCase().includes(query.toLowerCase())).map(c=>{
    const now=collectionValue(c.id,month), change=delta(now,collectionValue(c.id,previous));
    return `<tr><td><span class="collection-icon">${c.code.slice(0,1)}</span><div><strong>${c.name}</strong><span>${c.code}</span></div></td><td>${formatNumber(c.size)}</td><td><strong>${formatNumber(now)}</strong></td><td><strong>${c.size?(now*12/c.size).toFixed(1):'0.0'}</strong></td><td>${trendBadge(change)}</td><td>${sparkline(c)}</td></tr>`;
  }).join('') || `<tr><td colspan="6" class="empty">No collections match your search.</td></tr>`;
}
function modalMarkup() {
  const next = currentMonth();
  return `<div class="modal-backdrop" id="modal" hidden><form class="modal" id="data-form"><button type="button" class="close" aria-label="Close">×</button><p class="eyebrow">MONTHLY REPORTING</p><h2>Add monthly data</h2><p>Enter circulation for a collection. Existing entries for the same month will be updated.</p><label>Collection<select name="collectionId" required>${collections.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></label><div class="form-grid"><label>Month<input type="month" name="month" value="${next}" required></label><label>Checkouts<input type="number" name="checkouts" min="0" placeholder="0" required></label></div><label class="checkbox"><input type="checkbox" id="update-size"> Update collection size too</label><label id="size-field" hidden>Current number of items<input type="number" name="size" min="0" placeholder="0"></label><div class="modal-actions"><button type="button" class="outline cancel">Cancel</button><button class="primary">Save monthly data</button></div></form></div>`;
}
function bindEvents() {
  const modal=document.querySelector('#modal');
  document.querySelector('#add-data').onclick=()=>{modal.hidden=false; document.body.classList.add('modal-open');};
  document.querySelectorAll('.close,.cancel').forEach(b=>b.onclick=()=>{modal.hidden=true;document.body.classList.remove('modal-open');});
  modal.onclick=e=>{if(e.target===modal){modal.hidden=true;document.body.classList.remove('modal-open');}};
  document.querySelector('#update-size').onchange=e=>document.querySelector('#size-field').hidden=!e.target.checked;
  document.querySelector('#range').onchange=e=>{trendRange=Number(e.target.value);render();};
  document.querySelector('#search').oninput=e=>document.querySelector('#collection-rows').innerHTML=renderRows(e.target.value);
  document.querySelector('#manage').onclick=()=>{
    const name=prompt('Collection name (for example, Large Print)'); if(!name) return;
    const code=prompt('Short collection code', name.slice(0,3).toUpperCase()); if(!code) return;
    const size=Number(prompt('Current number of items', '0')); if(!Number.isFinite(size)||size<0) return;
    const base=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')||'collection';
    let id=base, suffix=2; while(collections.some(c=>c.id===id)) id=`${base}-${suffix++}`;
    collections.push({id,name:name.trim(),code:code.trim().toUpperCase(),size}); save(); render();
  };
  document.querySelector('#data-form').onsubmit=e=>{
    e.preventDefault(); const data=new FormData(e.target); const collectionId=data.get('collectionId'), month=data.get('month');
    const existing=records.find(r=>r.collectionId===collectionId&&r.month===month);
    if(existing) existing.checkouts=Number(data.get('checkouts')); else records.push({id:`${collectionId}-${month}`,collectionId,month,checkouts:Number(data.get('checkouts'))});
    if(document.querySelector('#update-size').checked && data.get('size')) collections.find(c=>c.id===collectionId).size=Number(data.get('size'));
    save(); render();
  };
}

render();
