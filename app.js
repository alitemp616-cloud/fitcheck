'use strict';

/* ---------- constants ---------- */
const CATS = [
  { id: 'top', label: 'Tops' }, { id: 'bottom', label: 'Bottoms' }, { id: 'shoes', label: 'Shoes' },
  { id: 'outer', label: 'Outerwear' }, { id: 'hat', label: 'Hats' }, { id: 'acc', label: 'Accessories' },
];
const OCCS = [
  { id: 'casual', label: 'Casual' }, { id: 'school', label: 'School' }, { id: 'night', label: 'Night out' },
  { id: 'sport', label: 'Sport' }, { id: 'formal', label: 'Formal' },
];
// n = neutral (pairs with anything); h = hue for non-neutrals
const COLORS = [
  { id: 'black', hex: '#1c1c1e', n: 1 }, { id: 'white', hex: '#fafafa', n: 1 }, { id: 'grey', hex: '#9a9aa0', n: 1 },
  { id: 'beige', hex: '#d8c3a5', n: 1 }, { id: 'brown', hex: '#7a5230', n: 1 }, { id: 'navy', hex: '#1f2a4d', n: 1 },
  { id: 'denim', hex: '#4f6d94', n: 1 }, { id: 'olive', hex: '#6b6b3a', n: 1 },
  { id: 'red', hex: '#d63a3a', h: 0 }, { id: 'orange', hex: '#ee8a2b', h: 30 }, { id: 'yellow', hex: '#f2cf3a', h: 50 },
  { id: 'green', hex: '#3f9a5a', h: 130 }, { id: 'blue', hex: '#2f6fed', h: 220 }, { id: 'purple', hex: '#8a55c8', h: 275 },
  { id: 'pink', hex: '#ec7fb0', h: 330 },
];
const ICON = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  closet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6a2 2 0 1 1 2 2c-1 .5-2 1-2 2v1"/><path d="M12 11L3 17h18z"/></svg>',
  outfits: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/></svg>',
  heartO: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="vertical-align:-3px"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
};

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
const store = {
  get(k, d) { try { const v = localStorage.getItem('fc.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('fc.' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};

/* ---------- IndexedDB ---------- */
const db = (() => {
  let p;
  const open = () => p || (p = new Promise((res, rej) => {
    const r = indexedDB.open('fitcheck', 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore('items', { keyPath: 'id' });
      r.result.createObjectStore('outfits', { keyPath: 'id' });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const tx = async (name, mode, fn) => {
    const d = await open();
    return new Promise((res, rej) => {
      const t = d.transaction(name, mode);
      const req = fn(t.objectStore(name));
      t.oncomplete = () => res(req.result);
      t.onerror = () => rej(t.error);
    });
  };
  return {
    all: n => tx(n, 'readonly', s => s.getAll()),
    put: (n, v) => tx(n, 'readwrite', s => s.put(v)),
    del: (n, id) => tx(n, 'readwrite', s => s.delete(id)),
  };
})();

/* ---------- state ---------- */
const state = {
  tab: 'home', items: [], outfits: [], urls: new Map(),
  filter: 'all', q: '',
  occ: store.get('occ', 'casual'), view: 'flat', look: null, locks: {},
  weather: store.get('weather', null),
  unit: store.get('unit', (navigator.language || '').startsWith('en-US') ? 'F' : 'C'),
  draft: null, flow: null, sheetView: 'flat',
};
const byId = id => state.items.find(i => i.id === id);
const url = item => {
  if (!state.urls.has(item.id)) state.urls.set(item.id, URL.createObjectURL(item.blob));
  return state.urls.get(item.id);
};
const untagged = () => state.items.filter(i => !i.tagged);

/* ---------- colour ---------- */
function guessColor(h, s, l) {
  if (l < 0.18) return 'black';
  if (l > 0.82 && s < 0.25) return 'white';
  if (s < 0.12) return 'grey';
  if (h >= 15 && h < 50 && l < 0.4) return 'brown';
  if (h >= 20 && h < 55 && s < 0.5 && l >= 0.55) return 'beige';
  if (h >= 50 && h < 90 && s < 0.45) return 'olive';
  if (h >= 200 && h < 250 && l < 0.28) return 'navy';
  if (h >= 200 && h < 230 && s < 0.4) return 'denim';
  const hue = COLORS.filter(c => c.h !== undefined)
    .sort((a, b) => hueDiff(a.h, h) - hueDiff(b.h, h))[0];
  return hue.id;
}
const hueDiff = (a, b) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };

function dominantColor(g, w, h) {
  const d = g.getImageData(Math.round(w * .3), Math.round(h * .3), Math.round(w * .4), Math.round(h * .4)).data;
  let r = 0, gr = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 16) {
    if (d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235) continue; // skip white backdrop
    r += d[i]; gr += d[i + 1]; b += d[i + 2]; n++;
  }
  if (!n) return 'white';
  r /= n * 255; gr /= n * 255; b /= n * 255;
  const mx = Math.max(r, gr, b), mn = Math.min(r, gr, b), l = (mx + mn) / 2, dl = mx - mn;
  let s = 0, hh = 0;
  if (dl) {
    s = dl / (1 - Math.abs(2 * l - 1));
    hh = mx === r ? ((gr - b) / dl) % 6 : mx === gr ? (b - r) / dl + 2 : (r - gr) / dl + 4;
    hh = (hh * 60 + 360) % 360;
  }
  return guessColor(hh, s, l);
}

const colorOf = id => COLORS.find(c => c.id === id) || COLORS[2];
function pairScore(a, b) {
  const ca = colorOf(a.color), cb = colorOf(b.color);
  if (ca.n || cb.n) return 1;
  if (ca.id === cb.id) return 0.9;
  const d = hueDiff(ca.h, cb.h);
  return d < 45 ? 0.8 : d > 150 ? 0.6 : 0.25;
}
function lookScore(look) {
  const list = Object.values(look);
  let sum = 0, n = 0;
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) { sum += pairScore(list[i], list[j]); n++; }
  return (n ? sum / n : 1) + list.filter(i => i.fav).length * 0.04;
}

/* ---------- image import ---------- */
async function processImage(file) {
  const src = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    const s = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * s), h = Math.round(img.naturalHeight * s);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    g.drawImage(img, 0, 0, w, h);
    const color = dominantColor(g, w, h);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85));
    return { blob, color };
  } finally { URL.revokeObjectURL(src); }
}

async function addFiles(files) {
  const list = [...files];
  if (!list.length) return;
  let done = 0, failed = 0;
  const paint = () => openSheet(`<div class="busy"><h2>Adding ${list.length} item${list.length > 1 ? 's' : ''}…</h2>
    <p class="muted">${done} of ${list.length}${failed ? ` · ${failed} failed` : ''}</p>
    <div class="bar"><i style="width:${Math.round(done / list.length * 100)}%"></i></div></div>`, true);
  paint();
  for (const f of list) {
    try {
      const { blob, color } = await processImage(f);
      const item = { id: uid(), name: '', brand: '', cat: 'top', color, occ: ['casual', 'school', 'night'],
        fav: false, tagged: false, added: Date.now(), blob };
      await db.put('items', item);
      state.items.push(item);
    } catch { failed++; }
    done++;
    paint();
  }
  closeSheet();
  if (failed) toast(`${failed} photo${failed > 1 ? 's' : ''} couldn't be read`);
  state.tab = 'closet';
  render();
  startTagging();
}

/* ---------- outfit generator ---------- */
const isCold = () => state.weather && state.weather.c < 15.5;

function generate() {
  const tagged = state.items.filter(i => i.tagged);
  const pool = cat => {
    const all = tagged.filter(i => i.cat === cat);
    const m = all.filter(i => i.occ.includes(state.occ));
    return m.length ? m : all;
  };
  const pools = {};
  CATS.forEach(c => { pools[c.id] = pool(c.id); });
  if (!pools.top.length || !pools.bottom.length) return null;
  const pickW = list => {
    const bag = list.flatMap(i => (i.fav ? [i, i] : [i]));
    return rnd(bag);
  };
  const want = {
    top: true, bottom: true,
    shoes: pools.shoes.length > 0,
    outer: isCold() && pools.outer.length > 0,
    hat: pools.hat.length > 0 && state.occ !== 'formal' && Math.random() < 0.4,
    acc: pools.acc.length > 0 && Math.random() < 0.5,
  };
  let best = null, bestScore = -1;
  for (let n = 0; n < 60; n++) {
    const look = {};
    for (const { id } of CATS) {
      const locked = state.locks[id] && byId(state.locks[id]);
      if (locked) look[id] = locked;
      else if (want[id]) look[id] = pickW(pools[id]);
    }
    const sc = lookScore(look) + Math.random() * 0.15;
    if (sc > bestScore) { best = look; bestScore = sc; }
  }
  return best;
}

const lookKey = look => Object.entries(look).sort().map(([k, v]) => k + v.id).join('|');
const outfitLook = o => {
  const look = {};
  for (const [k, id] of Object.entries(o.items)) { const it = byId(id); if (it) look[k] = it; }
  return look;
};
const savedOutfit = look => state.outfits.find(o => lookKey(outfitLook(o)) === lookKey(look));

/* ---------- look rendering ---------- */
const ORDER = ['outer', 'top', 'bottom', 'shoes', 'hat', 'acc'];

function flatHtml(look, interactive, mini) {
  const cells = ORDER.filter(k => look[k]).map(k => {
    const it = look[k];
    const img = `<img src="${url(it)}" alt="${esc(it.name)}">`;
    if (!interactive) return `<div class="cell">${img}</div>`;
    const on = state.locks[k] === it.id;
    return `<button class="cell ${on ? 'locked' : ''}" data-act="lock" data-cat="${k}" aria-label="${on ? 'Unlock' : 'Lock'} ${esc(it.name)}">${img}<span class="lock">${ICON.lock}</span></button>`;
  }).join('');
  return `<div class="flat ${mini ? 'mini' : ''}">${cells}</div>`;
}

function mannequinHtml(look) {
  const img = k => look[k] ? `<img class="m-${k}" src="${url(look[k])}" alt="">` : '';
  const torso = look.outer ? img('outer') : img('top');
  return `<div class="mannequin">
    <svg viewBox="0 0 300 500" fill="#e7e4de"><circle cx="150" cy="52" r="30"/><rect x="138" y="78" width="24" height="22" rx="8"/>
      <rect x="92" y="96" width="116" height="170" rx="34"/><rect x="62" y="104" width="30" height="150" rx="15"/>
      <rect x="208" y="104" width="30" height="150" rx="15"/><rect x="104" y="250" width="42" height="215" rx="18"/>
      <rect x="154" y="250" width="42" height="215" rx="18"/></svg>
    ${img('bottom')}${img('shoes')}${torso}${img('hat')}${img('acc')}</div>`;
}

const lookBlock = (look, view, interactive) => view === 'flat' ? flatHtml(look, interactive) : mannequinHtml(look);
const segHtml = (view, act) => `<div class="seg">
  <button class="${view === 'flat' ? 'on' : ''}" data-act="${act}" data-v="flat">Flat lay</button>
  <button class="${view === 'man' ? 'on' : ''}" data-act="${act}" data-v="man">Mannequin</button></div>`;
const namesHtml = look => `<div class="names">${ORDER.filter(k => look[k]).map(k =>
  `<span><b>${esc(look[k].brand || CATS.find(c => c.id === k).label.replace(/s$/, ''))}</b> · ${esc(look[k].name || 'Untitled')}</span>`).join('')}</div>`;

/* ---------- weather ---------- */
const WX = [[0, '☀️'], [2, '🌤️'], [3, '☁️'], [48, '🌫️'], [57, '🌦️'], [67, '🌧️'], [77, '🌨️'], [82, '🌧️'], [86, '🌨️'], [99, '⛈️']];
const wxIcon = code => (WX.find(([max]) => code <= max) || WX[0])[1];
const showTemp = c => state.unit === 'F' ? Math.round(c * 9 / 5 + 32) + '°F' : Math.round(c) + '°C';

async function fetchWeather(lat, lon) {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
    const j = await r.json();
    state.weather = { c: j.current.temperature_2m, code: j.current.weather_code };
    store.set('weather', state.weather);
    if (state.tab === 'home') render();
  } catch { /* offline: keep cached reading */ }
}
function enableWeather() {
  if (!navigator.geolocation) return toast('Location isn’t available here');
  navigator.geolocation.getCurrentPosition(p => {
    store.set('loc', { lat: p.coords.latitude, lon: p.coords.longitude });
    fetchWeather(p.coords.latitude, p.coords.longitude);
  }, () => toast('Location permission denied'), { timeout: 10000 });
}

/* ---------- screens ---------- */
function render() {
  const screens = { home: homeHtml, closet: closetHtml, outfits: outfitsHtml };
  const scroll = $('.screen') ? $('.screen').scrollTop : 0;
  $('#app').innerHTML = `<main class="screen">${screens[state.tab]()}</main>${tabbarHtml()}`;
  $('.screen').scrollTop = scroll;
}

function tabbarHtml() {
  const t = (id, label) => `<button class="${state.tab === id ? 'on' : ''}" data-act="tab" data-tab="${id}">${ICON[id]}<span>${label}</span></button>`;
  return `<nav class="tabbar">${t('home', 'Home')}${t('closet', 'Closet')}
    <button class="add" data-act="add" aria-label="Add clothes">${ICON.plus}</button>${t('outfits', 'Outfits')}</nav>`;
}

function homeHtml() {
  const h = new Date().getHours();
  const hello = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const w = state.weather
    ? `<button class="weather" data-act="unit">${wxIcon(state.weather.code)} ${showTemp(state.weather.c)}</button>`
    : `<button class="weather" data-act="weather">☁️ Enable weather</button>`;
  let body;
  if (!state.items.some(i => i.tagged)) {
    body = `<div class="empty"><div class="big">🧺</div><h2>Your closet is empty</h2>
      <p>Add photos of your clothes and I’ll put outfits together for you.</p>
      <button class="btn primary" data-act="add">Add clothes</button></div>`;
  } else {
    const valid = state.look && Object.values(state.look).every(i => byId(i.id));
    if (!valid) state.look = generate();
    if (!state.look) {
      body = `<div class="empty"><div class="big">👕</div><h2>Need a top and a bottom</h2>
        <p>Add at least one top and one bottom to start getting outfit ideas.</p>
        <button class="btn primary" data-act="add">Add clothes</button></div>`;
    } else {
      const look = state.look, saved = !!savedOutfit(look);
      const tip = state.weather ? (isCold() ? 'Chilly out — adding a layer when you have one.' : 'Warm enough to skip the jacket.') : 'Tap a piece to lock it, then shuffle the rest.';
      body = `<div class="card">${segHtml(state.view, 'view')}${lookBlock(look, state.view, true)}${namesHtml(look)}
        <div class="row"><button class="btn primary" data-act="shuffle">${ICON.shuffle} Shuffle</button>
        <button class="btn square ${saved ? 'on' : ''}" data-act="save" aria-label="Save outfit">${saved ? ICON.heart : ICON.heartO}</button></div></div>
        <p class="tip">${tip}</p>`;
    }
  }
  return `<header class="top"><div><p class="eyebrow">${esc(date)}</p><h1>${hello}</h1></div>${w}</header>
    <h2 class="sec" style="margin-top:0">What’s the plan?</h2>
    <div class="chips">${OCCS.map(o => `<button class="chip ${state.occ === o.id ? 'on' : ''}" data-act="occ" data-id="${o.id}">${o.label}</button>`).join('')}</div>
    <div style="height:14px"></div>${body}`;
}

function filteredItems() {
  const q = state.q.trim().toLowerCase();
  return state.items.filter(i => (state.filter === 'all' || i.cat === state.filter) &&
    (!q || `${i.name} ${i.brand} ${i.color}`.toLowerCase().includes(q)))
    .sort((a, b) => b.added - a.added);
}
function gridHtml() {
  const list = filteredItems();
  if (!list.length) return `<div class="empty"><p>${state.items.length ? 'Nothing matches.' : 'No clothes yet — tap + to add some.'}</p></div>`;
  return `<div class="grid">${list.map(i => `<button class="item" data-act="item" data-id="${i.id}">
    <div class="ph"><img src="${url(i)}" alt="" loading="lazy">${i.fav ? '<span class="fav">♥</span>' : ''}
    <span class="dot" style="background:${colorOf(i.color).hex}"></span></div>
    <div class="brand">${esc(i.brand || CATS.find(c => c.id === i.cat).label)}</div>
    <div class="nm">${esc(i.name || 'Untitled')}</div></button>`).join('')}</div>`;
}
function closetHtml() {
  const n = untagged().length;
  return `<header class="top"><div><p class="eyebrow">${state.items.length} item${state.items.length === 1 ? '' : 's'}</p><h1>Closet</h1></div></header>
    <input class="search" id="search" type="search" placeholder="Search name, brand or color" value="${esc(state.q)}">
    <div class="chips">${[{ id: 'all', label: 'All' }, ...CATS].map(c => `<button class="chip ${state.filter === c.id ? 'on' : ''}" data-act="filter" data-id="${c.id}">${c.label}</button>`).join('')}</div>
    ${n ? `<div class="banner"><span>${n} new item${n > 1 ? 's' : ''} need tagging</span><button data-act="tag">Tag now</button></div>` : ''}
    <div id="grid">${gridHtml()}</div>`;
}

function outfitsHtml() {
  const list = [...state.outfits].sort((a, b) => b.created - a.created)
    .map(o => ({ o, look: outfitLook(o) })).filter(x => Object.keys(x.look).length);
  const head = `<header class="top"><div><p class="eyebrow">${list.length} saved</p><h1>Outfits</h1></div></header>`;
  if (!list.length) return head + `<div class="empty"><div class="big">💾</div><h2>No saved outfits</h2>
    <p>Tap the heart on the Home tab to keep a look you like.</p></div>`;
  return head + `<div class="outfit-grid">${list.map(({ o, look }) => `<button class="outfit-card" data-act="outfit" data-id="${o.id}">
    ${flatHtml(look, false, true)}<div class="lbl">${esc(OCCS.find(x => x.id === o.occ)?.label || '')}</div></button>`).join('')}</div>`;
}

/* ---------- sheets ---------- */
function openSheet(html, bare) {
  $('#sheet-root').innerHTML = `<div class="sheet-bg" ${bare ? '' : 'data-act="close"'}></div>
    <div class="sheet" role="dialog"><div class="grab"></div>${html}</div>`;
}
function closeSheet() { $('#sheet-root').innerHTML = ''; state.draft = null; state.flow = null; }

function itemSheet(item, flow) {
  state.draft = { ...item, occ: [...item.occ] };
  state.flow = flow;
  const d = state.draft;
  openSheet(`<div class="pic"><img src="${url(item)}" alt=""></div>
    ${flow ? `<p class="muted" style="text-align:center">Tagging ${flow.done + 1} of ${flow.total}</p>` : ''}
    <label>Category</label>
    <div class="cats">${CATS.map(c => `<button class="chip ${d.cat === c.id ? 'on' : ''}" data-act="f-cat" data-id="${c.id}">${c.label}</button>`).join('')}</div>
    <label>Name</label><input class="field" id="f-name" placeholder="e.g. Grey hoodie" value="${esc(d.name)}" autocapitalize="sentences">
    <label>Brand</label><input class="field" id="f-brand" placeholder="e.g. Nike" value="${esc(d.brand)}" autocapitalize="words">
    <label>Color</label>
    <div class="swatches">${COLORS.map(c => `<button class="sw ${d.color === c.id ? 'on' : ''}" data-act="f-color" data-id="${c.id}" style="background:${c.hex}" aria-label="${c.id}"></button>`).join('')}</div>
    <label>Good for</label>
    <div class="chips">${OCCS.map(o => `<button class="chip ${d.occ.includes(o.id) ? 'on' : ''}" data-act="f-occ" data-id="${o.id}">${o.label}</button>`).join('')}</div>
    <div class="row" style="margin-top:20px">
      ${flow ? '<button class="btn" data-act="f-skip">Skip rest</button>' : '<button class="btn danger" data-act="f-del">Delete</button>'}
      <button class="btn square ${d.fav ? 'on' : ''}" data-act="f-fav" aria-label="Favorite">${d.fav ? ICON.heart : ICON.heartO}</button>
      <button class="btn primary" data-act="f-save">${flow ? 'Save & next' : 'Save'}</button></div>`);
}

function startTagging() {
  const list = untagged();
  if (!list.length) return;
  itemSheet(list[0], { done: 0, total: list.length });
}

async function saveDraft() {
  const d = state.draft;
  if (!d) return;
  const item = { ...d, name: $('#f-name').value.trim(), brand: $('#f-brand').value.trim(), tagged: true };
  await db.put('items', item);
  state.items[state.items.findIndex(i => i.id === item.id)] = item;
  state.look = null;
  const flow = state.flow, next = flow && untagged()[0];
  if (next) itemSheet(next, { done: flow.done + 1, total: flow.total });
  else closeSheet();
  render();
}

async function deleteItem(id) {
  if (!confirm('Delete this item? Saved outfits that use it will be removed too.')) return;
  const hit = state.outfits.filter(o => Object.values(o.items).includes(id));
  await Promise.all([db.del('items', id), ...hit.map(o => db.del('outfits', o.id))]);
  state.outfits = state.outfits.filter(o => !hit.includes(o));
  state.items = state.items.filter(i => i.id !== id);
  URL.revokeObjectURL(state.urls.get(id)); state.urls.delete(id);
  Object.keys(state.locks).forEach(k => { if (state.locks[k] === id) delete state.locks[k]; });
  state.look = null;
  closeSheet(); render();
}

function outfitSheet(id) {
  const o = state.outfits.find(x => x.id === id);
  if (!o) return;
  const look = outfitLook(o);
  openSheet(`${segHtml(state.sheetView, 'sview')}<div id="osheet" data-id="${id}">${lookBlock(look, state.sheetView, false)}</div>${namesHtml(look)}
    <div class="row"><button class="btn danger" data-act="o-del" data-id="${id}">Remove</button>
    <button class="btn primary" data-act="o-use" data-id="${id}">Wear this</button></div>`);
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- events ---------- */
const actions = {
  tab: el => { state.tab = el.dataset.tab; render(); },
  add: () => $('#file').click(),
  occ: el => { state.occ = el.dataset.id; store.set('occ', state.occ); state.look = generate(); render(); },
  view: el => { state.view = el.dataset.v; render(); },
  shuffle: () => { state.look = generate(); render(); },
  lock: el => {
    const k = el.dataset.cat, id = state.look[k].id;
    if (state.locks[k] === id) delete state.locks[k]; else state.locks[k] = id;
    render();
  },
  save: async () => {
    const ex = savedOutfit(state.look);
    if (ex) { await db.del('outfits', ex.id); state.outfits = state.outfits.filter(o => o !== ex); toast('Removed from saved'); }
    else {
      const o = { id: uid(), occ: state.occ, created: Date.now(), items: Object.fromEntries(Object.entries(state.look).map(([k, v]) => [k, v.id])) };
      await db.put('outfits', o); state.outfits.push(o); toast('Saved to Outfits');
    }
    render();
  },
  unit: () => { state.unit = state.unit === 'F' ? 'C' : 'F'; store.set('unit', state.unit); render(); },
  weather: enableWeather,
  filter: el => { state.filter = el.dataset.id; render(); },
  item: el => itemSheet(byId(el.dataset.id), null),
  tag: startTagging,
  outfit: el => outfitSheet(el.dataset.id),
  sview: el => { state.sheetView = el.dataset.v; outfitSheet($('#osheet').dataset.id); },
  'o-del': async el => {
    await db.del('outfits', el.dataset.id);
    state.outfits = state.outfits.filter(o => o.id !== el.dataset.id);
    closeSheet(); render();
  },
  'o-use': el => {
    state.look = outfitLook(state.outfits.find(o => o.id === el.dataset.id));
    state.tab = 'home'; closeSheet(); render();
  },
  close: closeSheet,
  'f-cat': el => {
    state.draft.cat = el.dataset.id;
    el.parentNode.querySelectorAll('.chip').forEach(b => b.classList.toggle('on', b === el));
  },
  'f-color': el => {
    state.draft.color = el.dataset.id;
    el.parentNode.querySelectorAll('.sw').forEach(b => b.classList.toggle('on', b === el));
  },
  'f-occ': el => {
    const o = state.draft.occ, i = o.indexOf(el.dataset.id);
    if (i >= 0) o.splice(i, 1); else o.push(el.dataset.id);
    el.classList.toggle('on', i < 0);
  },
  'f-fav': el => {
    state.draft.fav = !state.draft.fav;
    el.classList.toggle('on', state.draft.fav);
    el.innerHTML = state.draft.fav ? ICON.heart : ICON.heartO;
  },
  'f-save': saveDraft,
  'f-del': () => deleteItem(state.draft.id),
  'f-skip': async () => {
    // keep the remaining photos as untagged defaults so nothing is lost
    for (const i of untagged()) { i.tagged = true; await db.put('items', i); }
    closeSheet(); state.look = null; render();
  },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && actions[el.dataset.act]) actions[el.dataset.act](el);
});
document.addEventListener('input', e => {
  if (e.target.id === 'search') { state.q = e.target.value; $('#grid').innerHTML = gridHtml(); }
});
$('#file').addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });

/* ---------- demo data (open the app with ?demo=300, or ?demo=clear) ---------- */
function demoBlob(cat, hex) {
  const c = document.createElement('canvas');
  c.width = 300; c.height = 340;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 300, 340);
  g.fillStyle = hex;
  const shapes = {
    top: () => { g.fillRect(75, 70, 150, 170); g.fillRect(30, 70, 55, 90); g.fillRect(215, 70, 55, 90); },
    outer: () => { g.fillRect(70, 55, 160, 220); g.fillRect(25, 55, 55, 150); g.fillRect(220, 55, 55, 150); },
    bottom: () => { g.fillRect(90, 50, 120, 50); g.fillRect(90, 100, 52, 200); g.fillRect(158, 100, 52, 200); },
    shoes: () => { g.fillRect(40, 170, 220, 70); g.fillRect(40, 140, 80, 40); },
    hat: () => { g.beginPath(); g.arc(150, 200, 80, Math.PI, 0); g.fill(); g.fillRect(150, 195, 110, 14); },
    acc: () => { g.beginPath(); g.arc(150, 170, 60, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(150, 170, 38, 0, 7); g.fill(); },
  };
  shapes[cat]();
  return new Promise(r => c.toBlob(r, 'image/jpeg', 0.8));
}

async function loadDemo(n) {
  const weights = { top: 5, bottom: 4, shoes: 3, outer: 2, hat: 1, acc: 1 };
  const cats = Object.entries(weights).flatMap(([k, w]) => Array(w).fill(k));
  const names = { top: ['Tee', 'Hoodie', 'Shirt', 'Sweater'], bottom: ['Jeans', 'Cargos', 'Shorts', 'Chinos'],
    shoes: ['Sneakers', 'Boots', 'Loafers'], outer: ['Jacket', 'Coat', 'Bomber'], hat: ['Cap', 'Beanie'], acc: ['Watch', 'Belt', 'Chain'] };
  const brands = ['Nike', 'Zara', 'Carhartt', 'Uniqlo', 'Levi’s', 'Adidas', 'Stüssy', 'H&M'];
  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    const cat = rnd(cats), col = rnd(COLORS);
    const item = { id: uid(), name: `${col.id[0].toUpperCase()}${col.id.slice(1)} ${rnd(names[cat])}`, brand: rnd(brands), cat, color: col.id,
      occ: OCCS.filter(() => Math.random() < 0.55).map(o => o.id).concat('casual').filter((v, j, a) => a.indexOf(v) === j),
      fav: Math.random() < 0.08, tagged: true, demo: true, added: Date.now() - i, blob: await demoBlob(cat, col.hex) };
    await db.put('items', item);
    state.items.push(item);
  }
  return Math.round(performance.now() - t0);
}

async function clearDemo() {
  const gone = state.items.filter(i => i.demo);
  await Promise.all(gone.map(i => db.del('items', i.id)));
  const ids = new Set(gone.map(i => i.id));
  state.items = state.items.filter(i => !ids.has(i.id));
  for (const o of state.outfits.filter(o => Object.values(o.items).some(id => ids.has(id)))) await db.del('outfits', o.id);
  state.outfits = state.outfits.filter(o => !Object.values(o.items).some(id => ids.has(id)));
  state.look = null;
}

/* ---------- boot ---------- */
(async function init() {
  try {
    [state.items, state.outfits] = await Promise.all([db.all('items'), db.all('outfits')]);
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  } catch { toast('Storage unavailable — items won’t be kept'); }
  const demo = new URLSearchParams(location.search).get('demo');
  if (demo) {
    history.replaceState(null, '', location.pathname);
    if (demo === 'clear') { await clearDemo(); toast('Demo items removed'); }
    else if (+demo > 0) { const ms = await loadDemo(Math.min(+demo, 1000)); toast(`Added ${Math.min(+demo, 1000)} demo items (${ms} ms)`); }
  }
  render();
  const loc = store.get('loc', null);
  if (loc) fetchWeather(loc.lat, loc.lon);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
