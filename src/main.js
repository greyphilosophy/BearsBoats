// src/main.js - Bears Boats Game
// Simple canvas-based 2D boat game with tile map

// === CONFIG ===
const TILE_SIZE = 32;
const MAP_W = 32;
const MAP_H = 24;
const CANVAS_W = MAP_W * TILE_SIZE;
const CANVAS_H = MAP_H * TILE_SIZE;

// Tile type definitions
const TILES = {
  DEEP: 0, SHALLOW: 1, FISHING: 2, CRABBED: 3,
  ISLAND: 4, HARBOR: 5, PLATFORM: 6, STORM: 7, ICE: 8,
};
const TILE_COLORS = {
  [TILES.DEEP]:   '#0a1628',
  [TILES.SHALLOW]: '#1a3a5c',
  [TILES.FISHING]: '#1e4058',
  [TILES.CRABBED]: '#2a3a4c',
  [TILES.ISLAND]:  '#3a5a3a',
  [TILES.HARBOR]:  '#2a4a3a',
  [TILES.PLATFORM]: '#3a4a5a',
  [TILES.STORM]:   '#0a2a48',
  [TILES.ICE]:     '#8a9aaa',
};
const TILE_NAMES = {
  [TILES.DEEP]: 'Deep Ocean', [TILES.SHALLOW]: 'Shallow',
  [TILES.FISHING]: 'Fishing Ground', [TILES.CRABBED]: 'Crabbed',
  [TILES.ISLAND]: 'Island', [TILES.HARBOR]: 'Harbor',
  [TILES.PLATFORM]: 'Platform', [TILES.STORM]: 'Storm', [TILES.ICE]: 'Ice Field',
};

// === GENERATE MAP ===
function generateMap() {
  const map = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(TILES.DEEP));

  // Harbor area around (10, 8)
  for (let y = 6; y <= 10; y++)
    for (let x = 8; x <= 12; x++)
      if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W)
        map[y][x] = TILES.HARBOR;

  // Fishing grounds around (18, 12)
  for (let y = 10; y <= 14; y++)
    for (let x = 16; x <= 20; x++)
      if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W)
        map[y][x] = TILES.FISHING;

  // Crabbeds around (22, 16)
  for (let y = 14; y <= 18; y++)
    for (let x = 20; x <= 24; x++)
      if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W)
        map[y][x] = TILES.CRABBED;

  // Island at (26, 6)
  if (6 < MAP_H && 26 < MAP_W) map[6][26] = TILES.ISLAND;
  if (5 < MAP_H && 26 < MAP_W) map[5][26] = TILES.SHALLOW;
  if (7 < MAP_H && 26 < MAP_W) map[7][26] = TILES.SHALLOW;
  if (6 < MAP_H && 25 < MAP_W) map[6][25] = TILES.SHALLOW;
  if (6 < MAP_H && 27 < MAP_W) map[6][27] = TILES.SHALLOW;

  // Storm area top-right
  for (let y = 0; y <= 2; y++)
    for (let x = 24; x <= 30; x++)
      if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W)
        map[y][x] = TILES.STORM;

  // Ice fields top-left
  for (let y = 0; y <= 2; y++)
    for (let x = 0; x <= 6; x++)
      if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W)
        map[y][x] = TILES.ICE;

  // Lighthouse platform at (14, 3)
  if (3 < MAP_H && 14 < MAP_W) map[3][14] = TILES.PLATFORM;

  return map;
}

// === BOAT CUSTOMIZATION ===
const BOAT_HULLS = {
  sloop:      { name: 'Sloop',      cost: 150, speed: 3, capacity: 4,  slots: 4, emoji: '⛵' },
  schooner:   { name: 'Schooner',   cost: 300, speed: 4, capacity: 8,  slots: 6, emoji: '⛵' },
  brigantine: { name: 'Brigantine', cost: 500, speed: 5, capacity: 12, slots: 8, emoji: '⛵' },
  clipper:    { name: 'Clipper',    cost: 750, speed: 6, capacity: 16, slots: 10, emoji: '⛵' },
  tender:     { name: 'Tender',     cost: 100, speed: 2, capacity: 3,  slots: 3, emoji: '🚤' },
  bark:       { name: 'Bark',       cost: 600, speed: 5, capacity: 14, slots: 8, emoji: '⛵' },
  galleon:    { name: 'Galleon',    cost: 900, speed: 4, capacity: 20, slots: 10, emoji: '🚢' },
};

const BOAT_ENGINES = {
  sail:     { name: 'Wind Sail',    cost: 50,  speedMod: 1.0, fuel: 'Wind',   emoji: '🌬️' },
  steam:    { name: 'Steam Engine', cost: 150, speedMod: 1.2, fuel: 'Coal',   emoji: '🔥' },
  diesel:   { name: 'Diesel',       cost: 300, speedMod: 1.4, fuel: 'Diesel', emoji: '⚙️' },
  electric: { name: 'Electric',     cost: 500, speedMod: 1.3, fuel: 'Battery', emoji: '⚡' },
  wind_sail:{ name: 'Sail Wing',   cost: 400, speedMod: 1.5, fuel: 'Wind',   emoji: '🌀' },
};

// Deck modules (FTL-style slots)
const DECK_MODULES = {
  galley:    { name: 'Galley',     cost: 80,  emoji: '🍽️', desc: '+Morale' },
  hold:      { name: 'Hold',       cost: 120, emoji: '📦', desc: '+Capacity' },
  cabin:     { name: 'Cabin',      cost: 100, emoji: '🛏️', desc: '+Crew space' },
  mast:      { name: 'Mast',       cost: 150, emoji: '🏗️', desc: '+Speed' },
  net:       { name: 'Fishing Net', cost: 60,  emoji: '🥅', desc: '+Fish yield' },
  pot:       { name: 'Crab Pot',   cost: 90,  emoji: '🦀', desc: '+Crab yield' },
  winch:     { name: 'Winch',      cost: 110, emoji: '🔩', desc: '+Cargo speed' },
  radar:     { name: 'Radar',      cost: 180, emoji: '📡', desc: '+Survey bonus' },
  crane:     { name: 'Crane',      cost: 200, emoji: '🏗️', desc: '+Build speed' },
  life_ring: { name: 'Life Ring',  cost: 70,  emoji: '🔴', desc: '+Rescue rate' },
  winch_tug: { name: 'Tug Winch',  cost: 130, emoji: '🔗', desc: '+Tug power' },
};

// === GAME STATE ===
const state = {
  gold: 500,
  day: 1,
  season: 'Spring',
  boat: {
    name: 'The Polar Fluff',
    hull: 'sloop',
    engine: 'steam',
    x: 10,
    y: 8,
    deck: [
      { slot: 0, module: 'galley' },
      { slot: 1, module: 'hold' },
      { slot: 2, module: 'cabin' },
      { slot: 3, module: 'mast' },
    ],
    // Tracks owned boats (can have multiple)
    fleet: [],
  },
  crew: [
    { name: 'Bear', emoji: '🐻', skill: 'Captain' },
    { name: 'Teddy', emoji: '🧸', skill: 'Engineer' },
    { name: 'Duck', emoji: '🦆', skill: 'Fisher' },
    { name: 'Rabbit', emoji: '🐇', skill: 'Navigator' },
  ],
  platforms: [
    { name: 'Starting Harbor', emoji: '⚓', x: 10, y: 8 },
    { name: 'Fluffy Lighthouse', emoji: '🏮', x: 14, y: 3 },
  ],
  map: null,
  ui: { tab: 'map', showHelp: true, boatSubTab: 'hull' },
  message: 'Welcome to Bears Boats! Click tiles to navigate. Use tabs below.',
};

// === INIT ===
const map = generateMap();
state.map = map;

// === RENDERING ===
function init() {
  const container = document.getElementById('game-container');

  // Create game area
  const gameDiv = document.createElement('div');
  gameDiv.style.cssText = 'width: ' + CANVAS_W + 'px; max-width: 95vw; max-height: 95vh; overflow: auto; background: #0a1628; position: relative;';
  container.appendChild(gameDiv);

  // Canvas for the map
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  canvas.style.cssText = 'display: block; cursor: pointer;';
  gameDiv.appendChild(canvas);

  // UI Panel
  const uiPanel = document.createElement('div');
  uiPanel.id = 'ui-panel';
  uiPanel.style.cssText = 'position: absolute; top: 4px; left: 4px; right: 4px; display: flex; gap: 4px; z-index: 10; pointer-events: none;';
  gameDiv.appendChild(uiPanel);

  // Stats bar
  const statsBar = document.createElement('div');
  statsBar.id = 'stats-bar';
  statsBar.style.cssText = 'background: rgba(10, 22, 40, 0.9); padding: 4px 10px; border-radius: 6px; display: flex; gap: 16px; align-items: center; font-size: 13px;';
  statsBar.innerHTML = `
    <span style="font-size:15px;">🐻</span>
    <strong style="color:#FFD700;">${state.boat.name}</strong>
    <span>💰 <span id="stat-gold">${state.gold}</span></span>
    <span>📅 Day <span id="stat-day">${state.day}</span></span>
    <span>👥 <span id="stat-crew">${state.crew.length}</span> crew</span>
    <span id="stat-weather" style="margin-left:8px;"></span>
  `;
  uiPanel.appendChild(statsBar);

  // Tab buttons
  const tabBar = document.createElement('div');
  tabBar.style.cssText = 'display: flex; gap: 2px;';
  uiPanel.appendChild(tabBar);

  const tabs = [
    { id: 'map', label: '🗺️ Map' },
    { id: 'boat', label: '⛵ Boat' },
    { id: 'crew', label: '🧸 Crew' },
    { id: 'platforms', label: '🏗️ Platforms' },
    { id: 'operations', label: '⚓ Ops' },
    { id: 'quests', label: '📜 Quests' },
  ];

  tabs.forEach(t => {
    const btn = document.createElement('button');
    btn.textContent = t.label;
    btn.id = 'tab-' + t.id;
    btn.style.cssText = 'background: rgba(10, 22, 40, 0.9); color: #e0e0e0; border: 1px solid #2a4a7a; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;';
    btn.addEventListener('click', () => switchTab(t.id));
    if (t.id === state.ui.tab) btn.classList.add('active');
    tabBar.appendChild(btn);
  });

  // Message bar
  const msgBar = document.createElement('div');
  msgBar.id = 'message-bar';
  msgBar.style.cssText = 'background: rgba(10, 22, 40, 0.95); padding: 6px 10px; border-radius: 6px; font-size: 12px; color: #aaddff; margin-top: 4px; max-width: 500px;';
  msgBar.textContent = state.message;
  uiPanel.appendChild(msgBar);

  // Side panel for tab content
  const sidePanel = document.createElement('div');
  sidePanel.id = 'side-panel';
  sidePanel.style.cssText = 'position: absolute; bottom: 8px; right: 8px; background: rgba(10, 22, 40, 0.92); border: 1px solid #2a4a7a; border-radius: 8px; padding: 12px; width: 260px; font-size: 13px; max-height: 400px; overflow-y: auto;';
  gameDiv.appendChild(sidePanel);

  renderMap();
  switchTab('map');

  // Click to navigate
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const tx = Math.floor(cx / TILE_SIZE);
    const ty = Math.floor(cy / TILE_SIZE);

    if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H) {
      moveBoat(tx, ty);
    }
  });

  // Hover info
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const tx = Math.floor(cx / TILE_SIZE);
    const ty = Math.floor(cy / TILE_SIZE);

    if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H) {
      const tile = state.map[ty][tx];
      const tileName = TILE_NAMES[tile] || 'Ocean';
      const color = TILE_COLORS[tile] || '#0a1628';

      // Highlight tile under cursor
      renderMap(tx, ty, '#ffffff88');
    }
  });

  // Restore map on mouse leave
  canvas.addEventListener('mouseleave', () => {
    renderMap();
  });
}

function renderMap(highlightX, highlightY, highlightColor) {
  const canvas = document.querySelector('#game-container canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Clear
  ctx.fillStyle = TILE_COLORS[TILES.DEEP];
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Draw tiles
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const tile = state.map[y][x];
      ctx.fillStyle = TILE_COLORS[tile] || TILE_COLORS[TILES.DEEP];
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

      // Grid lines
      ctx.strokeStyle = 'rgba(42, 74, 122, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  // Draw platforms
  state.platforms.forEach(p => {
    const px = p.x * TILE_SIZE + TILE_SIZE / 2;
    const py = p.y * TILE_SIZE + TILE_SIZE / 2;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(p.emoji || '⚓', px, py + 4);
  });

  // Highlight tile
  if (highlightX !== undefined && highlightColor) {
    ctx.fillStyle = highlightColor;
    ctx.fillRect(highlightX * TILE_SIZE, highlightY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(highlightX * TILE_SIZE, highlightY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }

  // Draw boat
  const bx = state.boat.x * TILE_SIZE + TILE_SIZE / 2;
  const by = state.boat.y * TILE_SIZE + TILE_SIZE / 2;
  ctx.fillStyle = '#FF6B6B';
  ctx.beginPath();
  ctx.arc(bx, by, TILE_SIZE * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🐻', bx, by);

  // Draw wave effects (simple animation)
  const time = Date.now() / 1000;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (state.map[y][x] === TILES.DEEP || state.map[y][x] === TILES.SHALLOW) {
        const wave = Math.sin(time + x * 0.5 + y * 0.3) * 0.5 + 0.5;
        if (wave > 0.7) {
          ctx.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, 2);
        }
        if (wave < 0.3) {
          ctx.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 10, TILE_SIZE - 4, 1);
        }
      }
    }
  }
}

function moveBoat(x, y) {
  state.boat.x = x;
  state.boat.y = y;

  const tile = state.map[y][x];
  const tileName = TILE_NAMES[tile] || 'Ocean';

  // Check for fishing/crabbing
  let result = '';
  if (tile === TILES.FISHING) {
    const fish = Math.floor(Math.random() * 4) + 1;
    const gold = fish * 5;
    state.gold += gold;
    result = `Fished! Caught ${fish} fish for ${gold} gold.`;
  } else if (tile === TILES.CRABBED) {
    const crab = Math.floor(Math.random() * 3) + 1;
    const gold = crab * 8;
    state.gold += gold;
    result = `Crabbing! Caught ${crab} crabs for ${gold} gold.`;
  } else if (tile === TILES.STORM) {
    const cost = Math.floor(Math.random() * 10) + 5;
    state.gold -= cost;
    result = `Storm! Lost ${cost} gold.`;
  } else if (tile === TILES.ISLAND) {
    const find = Math.floor(Math.random() * 20) + 10;
    state.gold += find;
    result = `Island! Found ${find} gold treasure!`;
  }

  state.day++;
  state.season = ['Spring', 'Summer', 'Autumn', 'Winter'][Math.floor((state.day - 1) / 10) % 4];
  state.message = `Moved to ${tileName} at (${x}, ${y})${result ? '. ' + result : ''}`;

  updateStats();
  renderMap();
  switchTab(state.ui.tab);
}

function switchTab(tabId) {
  state.ui.tab = tabId;

  // Update tab buttons
  document.querySelectorAll('[id^="tab-"]').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById('tab-' + tabId);
  if (activeBtn) activeBtn.classList.add('active');

  // Render side panel content
  const panel = document.getElementById('side-panel');
  if (!panel) return;

  switch (tabId) {
    case 'map':
      renderMapPanel(panel);
      break;
    case 'boat':
      renderBoatPanel(panel);
      break;
    case 'crew':
      renderCrewPanel(panel);
      break;
    case 'platforms':
      renderPlatformsPanel(panel);
      break;
    case 'operations':
      renderOperationsPanel(panel);
      break;
    case 'quests':
      renderQuestsPanel(panel);
      break;
  }
}

function renderMapPanel(panel) {
  const tile = state.map[state.boat.y][state.boat.x];
  const tileName = TILE_NAMES[tile] || 'Ocean';
  panel.innerHTML = `
    <h3 style="margin-bottom:8px; color:#FFD700;">🗺️ Map</h3>
    <div style="margin-bottom:8px;">
      <strong>Location:</strong> ${tileName} (${state.boat.x}, ${state.boat.y})
    </div>
    <div style="margin-bottom:8px;">
      <strong>Day:</strong> ${state.day} (${state.season})
    </div>
    <div style="font-size:11px; color:#aaddff; margin-bottom:8px;">
      Click any tile on the map to sail there!
    </div>
    <div style="font-size:11px;">
      <strong>Legend:</strong><br>
      🔵 Deep Ocean | 🟢 Harbor | 🟣 Fishing<br>
      🟡 Crabbeds | ⚫ Storm | 🧊 Ice<br>
      🏝️ Island | ⚓ Platform
    </div>
  `;
}

function renderBoatPanel(panel) {
  const hull = state.boat.hull;
  const engine = state.boat.engine;
  const boat = state.boat;
  const hullData = BOAT_HULLS[hull];
  const engineData = BOAT_ENGINES[engine];
  if (!hullData || !engineData) {
    panel.innerHTML = '<h3>⛵ Boat</h3><div>No boat data!</div>';
    return;
  }

  const effectiveSpeed = Math.round(hullData.speed * engineData.speedMod * 10) / 10;
  const effectiveCapacity = hullData.capacity;

  // Sub-tab buttons for boat panel
  let subTabs = '';
  ['hull', 'engine', 'deck', 'stats'].forEach(t => {
    const label = { hull: 'Hulls', engine: 'Engines', deck: 'Deck Slots', stats: 'Stats' }[t];
    const active = state.ui.boatSubTab === t ? 'background:#2a4a7a;' : 'background:#1a2a4a;';
    subTabs += `<button onclick="switchBoatSubTab('${t}')" style="margin:1px;padding:3px 8px;cursor:pointer;${active}color:#ddd;border:1px solid #3a5a8a;border-radius:3px;font-size:11px;">${label}</button>`;
  });

  let content = '';
  if (state.ui.boatSubTab === 'hull') {
    content = '<div style="margin-top:6px;"><strong>Available Hulls:</strong>';
    for (const [key, h] of Object.entries(BOAT_HULLS)) {
      const owned = hull === key;
      const canBuy = !owned && state.gold >= h.cost;
      const color = owned ? '#4CAF50' : (canBuy ? '#FFD700' : '#888');
      content += `<div style="margin:4px 0;padding:4px 6px;border:1px solid ${owned ? '#4CAF50' : '#3a5a8a'};border-radius:4px;background:${owned ? 'rgba(76,175,80,0.15)' : 'rgba(10,22,40,0.5)'}">`;
      content += `<span style="color:${color};">${h.emoji} <strong>${h.name}</strong>`;
      content += ` — Speed: ${h.speed}, Capacity: ${h.capacity}, Slots: ${h.slots}</span>`;
      if (owned) {
        content += ` <span style="color:#4CAF50;">✗ OWNED</span>`;
      } else {
        content += ` <span style="color:#aaa;">${h.cost}g</span>`;
        content += `<button onclick="buyBoatHull('${key}')" ${canBuy ? '' : 'style="opacity:0.5;pointer-events:none;"'} style="margin-left:6px;padding:1px 6px;cursor:pointer;background:#2a4a7a;color:#ddd;border:none;border-radius:3px;">Buy</button>`;
      }
      content += `</div>`;
    }
    content += '</div>';
  } else if (state.ui.boatSubTab === 'engine') {
    content = '<div style="margin-top:6px;"><strong>Available Engines:</strong>';
    for (const [key, e] of Object.entries(BOAT_ENGINES)) {
      const owned = engine === key;
      const canBuy = !owned && state.gold >= e.cost;
      content += `<div style="margin:4px 0;padding:4px 6px;border:1px solid ${owned ? '#4CAF50' : '#3a5a8a'};border-radius:4px;background:${owned ? 'rgba(76,175,80,0.15)' : 'rgba(10,22,40,0.5)'}">`;
      content += `<span style="color:${owned ? '#4CAF50' : '#ddd'}">${e.emoji} <strong>${e.name}</strong>`;
      content += ` — ×${e.speedMod} speed, Fuel: ${e.fuel}</span>`;
      if (owned) {
        content += ` <span style="color:#4CAF50;">✗ EQUIPPED</span>`;
      } else {
        content += ` <span style="color:#aaa;">${e.cost}g</span>`;
        content += `<button onclick="buyBoatEngine('${key}')" ${canBuy ? '' : 'style="opacity:0.5;pointer-events:none;"'} style="margin-left:6px;padding:1px 6px;cursor:pointer;background:#2a4a7a;color:#ddd;border:none;border-radius:3px;">Buy</button>`;
      }
      content += `</div>`;
    }
    content += '</div>';
  } else if (state.ui.boatSubTab === 'deck') {
    content = '<div style="margin-top:6px;"><strong>Deck Modules:</strong>';
    content += '<div style="color:#aaddff;font-size:11px;margin-bottom:6px;">Click to install in the next free slot. Each hull has a limited number of deck slots.</div>';
    const freeSlot = boat.deck.length;
    const maxSlots = BOAT_HULLS[boat.hull].slots;
    content += `<div style="color:#FFD700;margin-bottom:8px;">Slots: ${freeSlot}/${maxSlots} free</div>`;
    for (const [key, m] of Object.entries(DECK_MODULES)) {
      const canInstall = state.gold >= m.cost && freeSlot < maxSlots;
      content += `<div style="margin:3px 0;padding:3px 6px;border:1px solid #3a5a8a;border-radius:4px;background:rgba(10,22,40,0.5)">`;
      content += `<span>${m.emoji} <strong>${m.name}</strong> — ${m.desc}</span>`;
      content += ` <span style="color:#aaa;">${m.cost}g</span>`;
      content += `<button onclick="installModule('${key}')" ${canInstall ? '' : 'style="opacity:0.5;pointer-events:none;"'} style="margin-left:6px;padding:1px 6px;cursor:pointer;background:#2a4a7a;color:#ddd;border:none;border-radius:3px;">Install</button>`;
      content += `</div>`;
    }
    // Show current deck layout
    content += '<div style="margin-top:8px;"><strong>Current Deck Layout:</strong>';
    boat.deck.forEach((slot, i) => {
      const md = DECK_MODULES[slot.module];
      content += `<div style="margin:2px 0;padding:2px 6px;background:rgba(76,175,80,0.15);border:1px solid #4CAF50;border-radius:3px;">`;
      content += `Slot ${i}: ${md ? md.emoji + ' ' + md.name : slot.module}`;
      content += ` <button onclick="removeModule(${i})" style="margin-left:4px;padding:0 4px;background:#555;color:#ddd;border:none;border-radius:2px;cursor:pointer;font-size:10px;">Remove (refund 50%)</button>`;
      content += `</div>`;
    });
    content += '</div>';
  } else if (state.ui.boatSubTab === 'stats') {
    content = `<div style="margin-top:6px;">`;
    content += `<div style="padding:6px;border:1px solid #3a5a8a;border-radius:4px;background:rgba(10,22,40,0.7);line-height:1.8;">`;
    content += `<strong style="font-size:14px;color:#FFD700;">${boat.name}</strong>`;
    content += `<div>Hull: ${hullData.emoji} ${hullData.name} (${hullData.cost}g)</div>`;
    content += `<div>Engine: ${engineData.emoji} ${engineData.name} (×${engineData.speedMod} speed)</div>`;
    content += `<div>Effective Speed: <strong>${effectiveSpeed}</strong></div>`;
    content += `<div>Capacity: <strong>${effectiveCapacity}</strong></div>`;
    content += `<div>Deck Slots: ${boat.deck.length}/${maxSlots} (${maxSlots = hullData.slots})</div>`;
    content += `<div>Crew: ${state.crew.length} aboard</div>`;
    content += `</div>`;
    content += '</div>';
  }

  panel.innerHTML = `<h3 style="margin-bottom:4px;color:#FFD700;">⛵ Boat</h3>${subTabs}${content}`;
}

function renderCrewPanel(panel) {
  let html = `<h3 style="margin-bottom:8px; color:#FFD700;">🧸 Crew (${state.crew.length}/4)</h3>`;
  state.crew.forEach((c, i) => {
    html += `<div style="margin:4px 0;">${c.emoji} <strong>${c.name}</strong> — ${c.skill}</div>`;
  });
  html += `<div style="margin-top:8px;">
    <strong>Recruit (costs 20 gold each):</strong><br>
    <button onclick="recruitCrew('fox')" style="margin:2px; padding:2px 6px; cursor:pointer;">🦊 Fox (Trader)</button>
    <button onclick="recruitCrew('penguin')" style="margin:2px; padding:2px 6px; cursor:pointer;">🐧 Penguin (Diver)</button>
    <button onclick="recruitCrew('seal')" style="margin:2px; padding:2px 6px; cursor:pointer;">🦭 Seal (Rescue)</button>
    <button onclick="recruitCrew('cat')" style="margin:2px; padding:2px 6px; cursor:pointer;">🐱 Cat (Sailor)</button>
  </div>`;
  panel.innerHTML = html;
}

function renderPlatformsPanel(panel) {
  let html = `<h3 style="margin-bottom:8px; color:#FFD700;">🏗️ Platforms (${state.platforms.length})</h3>`;
  state.platforms.forEach(p => {
    html += `<div style="margin:4px 0;">${p.emoji} <strong>${p.name}</strong> — (${p.x}, ${p.y})</div>`;
  });
  html += `<div style="margin-top:8px;">
    <strong>Deploy (on current tile):</strong><br>
    <button onclick="deployPlatform('buoy')" style="margin:2px; padding:2px 6px; cursor:pointer;">🔵 Buoy (50g)</button>
    <button onclick="deployPlatform('windmill')" style="margin:2px; padding:2px 6px; cursor:pointer;">🌬️ Windmill (300g)</button>
    <button onclick="deployPlatform('oil_rig')" style="margin:2px; padding:2px 6px; cursor:pointer;">🛢️ Oil Rig (500g)</button>
    <button onclick="deployPlatform('lighthouse')" style="margin:2px; padding:2px 6px; cursor:pointer;">🏮 Lighthouse (200g)</button>
  </div>`;
  panel.innerHTML = html;
}

function renderOperationsPanel(panel) {
  panel.innerHTML = `
    <h3 style="margin-bottom:8px; color:#FFD700;">⚓ Operations</h3>
    <div style="font-size:11px; color:#aaddff; margin-bottom:8px;">
      Navigate to a tile and sail! Each move costs 1 day.
    </div>
    <div><strong>Go to tile:</strong><br>
      <input type="number" id="nav-x" min="0" max="31" value="${state.boat.x}" style="width:40px; margin:2px;">
      <input type="number" id="nav-y" min="0" max="23" value="${state.boat.y}" style="width:40px; margin:2px;">
      <button onclick="navigateTo()" style="margin:2px; padding:4px 8px; cursor:pointer;">Sail</button>
    </div>
    <div style="margin-top:8px; font-size:11px;">
      <strong>Tile Types & Rewards:</strong><br>
      🟣 Fishing — Earn gold from fish<br>
      🟡 Crabbed — Earn gold from crabs<br>
      🟢 Harbor — Safe, no cost<br>
      ⚫ Storm — Lose some gold<br>
      🏝️ Island — Find treasure<br>
      🧊 Ice — Slow, find gems<br>
    </div>
  `;
}

function updateStats() {
  const g = document.getElementById('stat-gold');
  const d = document.getElementById('stat-day');
  if (g) g.textContent = state.gold;
  if (d) d.textContent = state.day;
}

function updateMessage(msg) {
  state.message = msg;
  const mb = document.getElementById('message-bar');
  if (mb) mb.textContent = msg;
}

// === GLOBAL ACTIONS ===
// === BOAT CUSTOMIZATION ACTIONS ===
window.switchBoatSubTab = function(tab) {
  state.ui.boatSubTab = tab;
  switchTab('boat');
};

window.buyBoatHull = function(hullKey) {
  const hull = BOAT_HULLS[hullKey];
  if (!hull) return;
  const boat = state.boat;
  if (boat.hull === hullKey) return;
  if (state.gold >= hull.cost) {
    // Sell old hull for 50% refund
    const oldHull = BOAT_HULLS[boat.hull];
    if (oldHull) {
      state.gold += Math.floor(oldHull.cost * 0.5);
    }
    state.gold -= hull.cost;
    // Resize deck slots
    const oldDeck = boat.deck.slice(0, hull.slots);
    boat.hull = hullKey;
    boat.deck = oldDeck;
    // Fill remaining slots empty
    while (boat.deck.length < hull.slots) {
      boat.deck.push({ slot: boat.deck.length, module: 'empty' });
    }
    updateStats();
    updateMessage(`Upgraded to ${hull.emoji} ${hull.name}! Speed: ${hull.speed}, Capacity: ${hull.capacity}, Slots: ${hull.slots}`);
    switchTab('boat');
  } else {
    updateMessage(`Need ${hull.cost} gold for ${hull.name}!`);
  }
};

window.buyBoatEngine = function(engineKey) {
  const engine = BOAT_ENGINES[engineKey];
  if (!engine) return;
  if (state.gold >= engine.cost) {
    // Sell old engine for 50% refund
    const oldEngine = BOAT_ENGINES[state.boat.engine];
    if (oldEngine) {
      state.gold += Math.floor(oldEngine.cost * 0.5);
    }
    state.gold -= engine.cost;
    state.boat.engine = engineKey;
    updateStats();
    updateMessage(`Equipped ${engine.emoji} ${engine.name}!`);
    switchTab('boat');
  } else {
    updateMessage(`Need ${engine.cost} gold for ${engine.name}!`);
  }
};

window.installModule = function(moduleKey) {
  const mod = DECK_MODULES[moduleKey];
  if (!mod) return;
  const boat = state.boat;
  const hull = BOAT_HULLS[boat.hull];
  if (!hull || boat.deck.length >= hull.slots) return;
  if (state.gold >= mod.cost) {
    state.gold -= mod.cost;
    boat.deck.push({ slot: boat.deck.length, module: moduleKey });
    updateStats();
    updateMessage(`Installed ${mod.emoji} ${mod.name}!`);
    switchTab('boat');
  } else {
    updateMessage(`Need ${mod.cost} gold for ${mod.name}!`);
  }
};

window.removeModule = function(slotIndex) {
  const boat = state.boat;
  if (slotIndex < boat.deck.length) {
    const removed = boat.deck[slotIndex];
    if (removed && removed.module !== 'empty') {
      const mod = DECK_MODULES[removed.module];
      if (mod) {
        // 50% refund
        state.gold += Math.floor(mod.cost * 0.5);
        updateMessage(`Removed ${mod.emoji} ${mod.name}. Got ${Math.floor(mod.cost * 0.5)}g refund.`);
      }
    }
    boat.deck.splice(slotIndex, 1);
    updateStats();
    switchTab('boat');
  }
};

window.renameBoat = function() {
  const n = prompt('Boat name:', state.boat.name);
  if (n) {
    state.boat.name = n;
    updateMessage(`Renamed boat to "${n}"!`);
    switchTab('boat');
  }
};

window.renameBoat = function() {
  const n = prompt('Boat name:', state.boat.name);
  if (n) {
    state.boat.name = n;
    updateMessage(`Renamed boat to "${n}"!`);
    switchTab(state.ui.tab);
  }
};

window.recruitCrew = function(type) {
  const crewMap = {
    fox: { name: 'Fox', emoji: '🦊', skill: 'Trader' },
    penguin: { name: 'Penguin', emoji: '🐧', skill: 'Diver' },
    seal: { name: 'Seal', emoji: '🦭', skill: 'Rescue' },
    cat: { name: 'Cat', emoji: '🐱', skill: 'Sailor' },
  };
  const c = crewMap[type];
  if (!c) return;
  if (state.gold >= 20) {
    state.gold -= 20;
    state.crew.push(c);
    updateStats();
    updateMessage(`${c.emoji} ${c.name} joined the crew! (${state.crew.length} crew)`);
    switchTab(state.ui.tab);
  } else {
    updateMessage('Not enough gold! Need 20 gold per recruit.');
  }
};

window.deployPlatform = function(type) {
  const platformMap = {
    buoy: { name: 'Buoy', emoji: '🔵', cost: 50 },
    windmill: { name: 'Windmill', emoji: '🌬️', cost: 300 },
    oil_rig: { name: 'Oil Rig', emoji: '🛢️', cost: 500 },
    lighthouse: { name: 'Lighthouse', emoji: '🏮', cost: 200 },
  };
  const p = platformMap[type];
  if (!p) return;
  if (state.gold >= p.cost) {
    state.gold -= p.cost;
    state.platforms.push({
      name: p.name + ' ' + state.platforms.length,
      emoji: p.emoji,
      x: state.boat.x,
      y: state.boat.y,
    });
    updateStats();
    updateMessage(`Deployed ${p.emoji} ${p.name}!`);
    renderMap();
    switchTab(state.ui.tab);
  } else {
    updateMessage(`Need ${p.cost} gold for ${p.name}!`);
  }
};

window.navigateTo = function() {
  const xi = document.getElementById('nav-x');
  const yi = document.getElementById('nav-y');
  if (!xi || !yi) return;
  const x = parseInt(xi.value);
  const y = parseInt(yi.value);
  if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) {
    moveBoat(x, y);
  }
};

// === FUN FEATURES ===
// Weather system
const WEATHER_TYPES = [
  { name: 'Sunny', emoji: '☀️', overlay: 'rgba(255,255,255,0.06)' },
  { name: 'Foggy', emoji: '🌫️', overlay: 'rgba(200,200,210,0.25)' },
  { name: 'Stormy', emoji: '⛅', overlay: 'rgba(150,150,200,0.15)' },
  { name: 'Aurora', emoji: '🌌', overlay: 'rgba(136,255,136,0.12)' },
  { name: 'Snowy', emoji: '❄️', overlay: 'rgba(255,255,255,0.2)' },
  { name: 'Calm', emoji: '🌅', overlay: 'rgba(136,170,221,0.1)' },
];
let weatherIdx = 0;

// Random encounters
const ENCOUNTERS = [
  { text: '🦆 A duck in a barrel gives you coins!', gold: 15 },
  { text: '🐋 Whale song boosts morale!', gold: 0 },
  { text: '🪙 Treasure floating on the surface!', gold: 50 },
  { text: '🦀 A giant crab pinches the mast!', gold: -10 },
  { text: '🧸 A lost teddy bear joins the crew!', gold: 20 },
  { text: '🐦 Seagulls steal from the galley!', gold: -15 },
  { text: '🧜 A mermaid offers a pearl!', gold: 30 },
  { text: '🍀 Lucky clover day!', gold: 25 },
  { text: '🌊 Smooth sailing — nothing happens!', gold: 0 },
  { text: '⭐ A shooting star grants wishes!', gold: 40 },
];

// Quests
const QUESTS = [
  { name: 'First Catch', emoji: '🐟', desc: 'Visit fishing ground (tiles 16-20, 10-14)', reward: 25, done: false },
  { name: 'Crab Hunter', emoji: '🦀', desc: 'Visit crabbed area (tiles 20-24, 14-18)', reward: 35, done: false },
  { name: 'Island Explorer', emoji: '🏝️', desc: 'Land on the island at (26, 6)', reward: 30, done: false },
  { name: 'Storm Braver', emoji: '🌪️', desc: 'Sail through the storm zone (top-right)', reward: 40, done: false },
  { name: 'Ice Breaker', emoji: '🧊', desc: 'Sail through the ice fields (top-left)', reward: 35, done: false },
  { name: 'Golden Pocket', emoji: '💰', desc: 'Reach 500 gold total', reward: 50, done: false },
];

function tryEncounter() {
  if (Math.random() < 0.25) {
    const e = ENCOUNTERS[Math.floor(Math.random() * ENCOUNTERS.length)];
    state.gold += e.gold;
    return e;
  }
  return null;
}

function checkQuests() {
  const bx = state.boat.x, by = state.boat.y;
  if (!QUESTS[0].done && bx >= 16 && bx <= 20 && by >= 10 && by <= 14) {
    QUESTS[0].done = true; state.gold += 25;
    return { msg: '🐟 Quest complete: First Catch! +25g' };
  }
  if (!QUESTS[1].done && bx >= 20 && bx <= 24 && by >= 14 && by <= 18) {
    QUESTS[1].done = true; state.gold += 35;
    return { msg: '🦀 Quest complete: Crab Hunter! +35g' };
  }
  if (!QUESTS[2].done && state.map[by] && state.map[by][bx] === TILES.ISLAND) {
    QUESTS[2].done = true; state.gold += 30;
    return { msg: '🏝️ Quest complete: Island Explorer! +30g' };
  }
  if (!QUESTS[3].done && bx >= 24 && bx <= 30 && by <= 2) {
    QUESTS[3].done = true; state.gold += 40;
    return { msg: '🌪️ Quest complete: Storm Braver! +40g' };
  }
  if (!QUESTS[4].done && bx <= 6 && by <= 2) {
    QUESTS[4].done = true; state.gold += 35;
    return { msg: '🧊 Quest complete: Ice Breaker! +35g' };
  }
  if (!QUESTS[5].done && state.gold >= 500) {
    QUESTS[5].done = true; state.gold += 50;
    return { msg: '💰 Quest complete: Golden Pocket! +50g' };
  }
  return null;
}

function renderQuestsPanel(panel) {
  let html = '<h3 style="margin-bottom:8px; color:#FFD700;">📜 Quests</h3>';
  let completed = 0;
  QUESTS.forEach(q => {
    if (q.done) completed++;
    const statusColor = q.done ? '#4CAF50' : '#aaa';
    const statusText = q.done ? '✅ Done' : '🔵 Active';
    html += `<div style="margin:6px 0;padding:6px 8px;border:1px solid ${q.done ? '#4CAF50' : '#3a5a8a'};border-radius:4px;background:${q.done ? 'rgba(76,175,80,0.15)' : 'rgba(10,22,40,0.5)'}">`;
    html += `<span style="color:${statusColor};">${q.emoji} <strong>${q.name}</strong> — ${q.desc}<br>`;
    html += `<span style="font-size:10px;color:${statusColor}">Reward: ${q.reward}g | ${statusText}</span></span>`;
    html += '</div>';
  });
  html += `<div style="margin-top:10px;color:#aaddff;font-size:11px;">Completed: ${completed}/${QUESTS.length}</div>`;
  panel.innerHTML = html;
}

// === END FUN FEATURES ===

// === ANIMATION LOOP ===
function animate() {
  renderMap();
  requestAnimationFrame(animate);
}

// === START ===
document.addEventListener('DOMContentLoaded', () => {
  init();
  animate();
});
