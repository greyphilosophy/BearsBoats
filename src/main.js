// src/main.js - Bears Boats Game
// FTL-style boat game with equipment and tile map

import {
  EQUIPMENT_TYPES,
  EQUIPMENT_CATEGORIES,
  calculateEquipmentBonuses,
} from './equipment.js';
import { CREW_TYPES } from './crew.js';

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

// === GAME STATE ===
const state = {
  gold: 500,
  day: 1,
  season: 'Spring',
  boat: {
    name: 'The Polar Fluff',
    hull: 'sloop',
    x: 10,
    y: 8,
    deck: [],
  },
  crew: [],
  nextCrewId: 1,
  payroll: { totalPerDay: 0, lastPaidDay: 0 },
  platforms: [
    { name: 'Starting Harbor', emoji: '⚓', x: 10, y: 8 },
  ],
  map: null,
  ui: { tab: 'map' },
  message: 'Welcome to Bears Boats! Click tiles to navigate.',
  firstCatch: true, // Track if it's the first catch of the day for bait bonus
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
    { id: 'shop', label: '🏪 Shop' },
    { id: 'crew', label: '🧸 Crew' },
    { id: 'platforms', label: '🏗️ Platforms' },
    { id: 'operations', label: '⚓ Ops' },
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
  const equipmentBonuses = calculateEquipmentBonuses(state.boat.deck);
  const crewBonuses = calculateCrewBonuses();

  // Payroll: deduct daily wages for each move (day = 1 trip)
  const totalWages = getCrewPayroll();
  if (totalWages > 0 && state.day > state.payroll.lastPaidDay) {
    const daysSince = state.day - state.payroll.lastPaidDay;
    const cost = totalWages * daysSince;
    state.gold -= cost;
    state.payroll.lastPaidDay = state.day;
    updateMessage(`Payroll: ${cost}g for ${daysSince} day(s).`);
  }

  // Check for fishing/crabbing with equipment + crew bonuses
  let result = '';
  if (tile === TILES.FISHING) {
    let fish = Math.floor(Math.random() * 4) + 1;
    fish = Math.max(1, Math.floor(fish * equipmentBonuses.fishMultiplier * (1 + crewBonuses.fishMultiplier)));
    const gold = fish * 5;
    state.gold += gold;
    result = `Fished! Caught ${fish} fish for ${gold} gold.`;
  } else if (tile === TILES.CRABBED) {
    let crab = Math.floor(Math.random() * 3) + 1;
    crab = Math.max(1, Math.floor(crab * equipmentBonuses.crabMultiplier * (1 + crewBonuses.crabMultiplier)));
    const gold = crab * 8;
    state.gold += gold;
    result = `Crabbing! Caught ${crab} crabs for ${gold} gold.`;
  } else if (tile === TILES.STORM) {
    let cost = Math.floor(Math.random() * 10) + 5;
    cost = Math.max(1, Math.floor(cost * (1 - equipmentBonuses.stormReduction) * (1 - crewBonuses.stormReduction)));
    state.gold -= cost;
    result = `Storm! Lost ${cost} gold.`;
  } else if (tile === TILES.ISLAND) {
    let find = Math.floor(Math.random() * 20) + 10;
    find = Math.max(10, Math.floor(find * (1 + equipmentBonuses.visitBonus) * (1 + crewBonuses.visitBonus)));
    state.gold += find;
    result = `Island! Found ${find} gold treasure!`;
  }

  state.day++;
  state.season = ['Spring', 'Summer', 'Autumn', 'Winter'][Math.floor((state.day - 1) / 10) % 4];
  state.firstCatch = true; // Reset first catch for the new day
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
    case 'shop':
      renderShopPanel(panel);
      break;
  }
}

// === EQUIPMENT SHOP ===
function renderShopPanel(panel) {
  const boat = state.boat;
  const hull = BOAT_HULLS[boat.hull];
  const slots = hull ? hull.slots : 0;
  const installed = boat.deck.length;

  // Show ship cutaway first
  panel.innerHTML = '';

  // Cutaway header
  const cutaway = document.createElement('div');
  cutaway.style.cssText = 'background: rgba(10, 22, 40, 0.6); border: 1px solid #2a4a7a; border-radius: 6px; padding: 8px; margin-bottom: 10px;';
  cutaway.innerHTML = `
    <h3 style="margin-bottom:6px;color:#FFD700;font-size:14px;">🚢 ${boat.name}</h3>
    <div style="font-size:11px;color:#aaddff;margin-bottom:4px;">${hull ? hull.emoji + ' ' + hull.name : ''} — ${installed}/${slots} deck slots</div>
  `;
  panel.appendChild(cutaway);

  // Ship layout display
  const layoutDiv = document.createElement('div');
  layoutDiv.style.cssText = 'background: rgba(10, 22, 40, 0.8); border: 1px solid #2a4a7a; border-radius: 6px; padding: 8px; margin-bottom: 10px;';
  layoutDiv.innerHTML = '<div style="font-size:12px;color:#aaddff;margin-bottom:6px;">📋 Deck Layout:</div>';
  if (installed === 0) {
    layoutDiv.innerHTML += '<div style="font-size:11px;color:#888;font-style:italic;">Deck is empty — visit the shop below to install equipment!</div>';
  } else {
    for (let i = 0; i < installed; i++) {
      const slot = boat.deck[i];
      const modKey = slot.module;
      const mod = EQUIPMENT_TYPES[modKey];
      const name = mod ? `${mod.emoji} ${mod.name}` : `📦 ${modKey}`;
      layoutDiv.innerHTML += `<div style="display:flex;align-items:center;margin:2px 0;padding:2px 4px;background:rgba(76,175,80,0.1);border-radius:3px;">
        <span style="color:#aaddff;font-size:11px;">${mod.emoji || '📦'} Slot ${i}: ${name}</span>
        <button onclick="removeEquipment(${i})" style="margin-left:auto;background:#555;color:#ddd;border:none;border-radius:2px;padding:1px 5px;cursor:pointer;font-size:10px;">Remove</button>
      </div>`;
    }
  }
  panel.appendChild(layoutDiv);

  // Equipment shop with categories
  const shopDiv = document.createElement('div');
  shopDiv.style.cssText = 'margin-bottom: 8px;';
  let canInstall = installed < (slots || 1);

  for (const [category, keys] of Object.entries(EQUIPMENT_CATEGORIES)) {
    const catDiv = document.createElement('div');
    catDiv.style.cssText = 'margin-bottom: 8px;';
    catDiv.innerHTML = `<div style="font-size:12px;font-weight:bold;color:#FFD700;">${category}</div>`;
    shopDiv.appendChild(catDiv);

    for (const key of keys) {
      const eq = EQUIPMENT_TYPES[key];
      const owned = boat.deck.some(s => s.module === key);
      const canBuy = state.gold >= eq.cost && canInstall;
      const itemDiv = document.createElement('div');
      itemDiv.style.cssText = `margin:3px 0;padding:4px 6px;border:1px solid #3a5a8a;border-radius:4px;background:rgba(10,22,40,0.5);`;
      itemDiv.innerHTML = `
        <div style="font-size:11px;">${eq.emoji} <strong>${eq.name}</strong> — ${eq.desc}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:3px;">
          <span style="color:orange;font-size:11px;">${eq.cost}g</span>
          ${owned
            ? '<span style="color:#4CAF50;font-size:10px;">✓ INSTALLED</span>'
            : `<button onclick="installEquipment('${key}')" ${canBuy ? '' : 'style="opacity:0.4;pointer-events:none;"'} style="padding:2px 8px;background:#2a4a7a;color:#ddd;border:none;border-radius:3px;cursor:pointer;font-size:10px;">Buy</button>`
          }
        </div>`;
      catDiv.appendChild(itemDiv);
    }
  }
  panel.appendChild(shopDiv);
}

window.installEquipment = function(key) {
  const eq = EQUIPMENT_TYPES[key];
  if (!eq) return;
  const boat = state.boat;
  const hull = BOAT_HULLS[boat.hull];
  if (!hull || boat.deck.length >= hull.slots) {
    updateMessage('No deck slots available!');
    switchTab('shop');
    return;
  }
  if (state.gold >= eq.cost) {
    state.gold -= eq.cost;
    boat.deck.push({ slot: boat.deck.length, module: key });
    updateStats();
    updateMessage(`Installed ${eq.emoji} ${eq.name}!`);
    switchTab('shop');
  } else {
    updateMessage(`Need ${eq.cost}g for ${eq.name}!`);
    switchTab('shop');
  }
};

window.removeEquipment = function(slotIndex) {
  const boat = state.boat;
  const slot = boat.deck[slotIndex];
  if (!slot || !slot.module) return;
  const eq = EQUIPMENT_TYPES[slot.module];
  if (eq) {
    state.gold += Math.floor(eq.cost * 0.5);
    updateMessage(`Removed ${eq.emoji} ${eq.name}. +${Math.floor(eq.cost * 0.5)}g refund!`);
  } else {
    updateMessage('Removed equipment.');
  }
  boat.deck.splice(slotIndex, 1);
  updateStats();
  switchTab('shop');
};

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
  const boat = state.boat;
  const hull = BOAT_HULLS[boat.hull];
  if (!hull) {
    panel.innerHTML = '<h3>⛵ Boat</h3><div>No boat data!</div>';
    return;
  }

  panel.innerHTML = `
    <h3 style="margin-bottom:4px;color:#FFD700;">⛵ Boat</h3>
    <div style="margin:8px 0;">
      <strong>${boat.name}</strong> — ${hull.emoji} ${hull.name}
    </div>
    <div style="margin:4px 0;color:#aaddff;font-size:11px;">
      Speed: ${hull.speed} | Capacity: ${hull.capacity} | Slots: ${boat.deck.length}/${hull.slots}
    </div>
  `;
}

function renderCrewPanel(panel) {
  const payroll = state.payroll;
  // Recalculate daily payroll
  let totalWages = 0;
  for (const c of state.crew) {
    const ct = CREW_TYPES[c.type];
    if (ct) totalWages += ct.baseWage;
  }
  payroll.totalPerDay = totalWages;

  // Show stats header
  panel.innerHTML = '';

  // Crew stats summary
  const statsDiv = document.createElement('div');
  statsDiv.style.cssText = 'background: rgba(10, 22, 40, 0.6); border: 1px solid #2a4a7a; border-radius: 6px; padding: 8px; margin-bottom: 10px;';
  statsDiv.innerHTML = `
    <h3 style="margin-bottom:6px;color:#FFD700;font-size:14px;">🧸 Crew</h3>
    <div style="font-size:11px;color:#aaddff;margin-bottom:4px;">${state.crew.length} aboard | Daily payroll: ${totalWages}g</div>
    <div style="font-size:10px;color:#aaa;">Payroll deducted each day when moving</div>
  `;
  panel.appendChild(statsDiv);

  // Current crew list
  const crewDiv = document.createElement('div');
  crewDiv.style.cssText = 'background: rgba(10, 22, 40, 0.8); border: 1px solid #2a4a7a; border-radius: 6px; padding: 8px; margin-bottom: 10px;';
  crewDiv.innerHTML = '<div style="font-size:12px;color:#aaddff;margin-bottom:6px;">📋 Crew Roster:</div>';
  if (state.crew.length === 0) {
    crewDiv.innerHTML += '<div style="font-size:11px;color:#888;font-style:italic;">Crew is empty — hire some crew below!</div>';
  } else {
    for (let i = 0; i < state.crew.length; i++) {
      const c = state.crew[i];
      const ct = CREW_TYPES[c.type];
      const name = ct ? `${ct.emoji} ${ct.name}` : '🐻 Unknown';
      crewDiv.innerHTML += `<div style="display:flex;align-items:center;margin:2px 0;padding:3px 6px;background:rgba(76,175,80,0.1);border-radius:3px;">
        <span style="color:#aaddff;font-size:11px;">${name} — ${c.skill || ct?.skill || 'General'} (wage: ${ct ? ct.baseWage + 'g' : '?'})</span>
        <button onclick="fireCrew(${i})" style="margin-left:auto;background:#555;color:#ddd;border:none;border-radius:2px;padding:1px 5px;cursor:pointer;font-size:10px;">Fire</button>
      </div>`;
      if (ct && ct.desc) {
        crewDiv.innerHTML += `<div style="margin-left:20px;font-size:9px;color:#888;">${ct.desc}</div>`;
      }
    }
  }
  panel.appendChild(crewDiv);

  // Available crew types to hire
  const hireDiv = document.createElement('div');
  hireDiv.style.cssText = 'margin-bottom: 8px;';
  hireDiv.innerHTML = '<div style="font-size:12px;font-weight:bold;color:#FFD700;margin-bottom:6px;">📋 Available Crew:</div>';

  for (const [key, ct] of Object.entries(CREW_TYPES)) {
    const hireCost = ct.baseWage * 10;
    const canHire = state.gold >= hireCost;
    const crewDiv2 = document.createElement('div');
    crewDiv2.style.cssText = 'margin:3px 0;padding:4px 6px;border:1px solid #3a5a8a;border-radius:4px;background:rgba(10,22,40,0.5);';
    crewDiv2.innerHTML = `
      <div style="font-size:11px;">${ct.emoji} <strong>${ct.name}</strong> — ${ct.skill} (${ct.desc})</div>
      <div style="font-size:9px;color:#aaa;margin-top:2px;">Wage: ${ct.baseWage}g/day | Hire cost: ${hireCost}g</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:3px;">
        <span></span>
        <button onclick="hireCrew('${key}')" ${canHire ? '' : 'style="opacity:0.4;pointer-events:none;"'} style="padding:2px 8px;background:#2a4a7a;color:#ddd;border:none;border-radius:3px;cursor:pointer;font-size:10px;">Hire (${hireCost}g)</button>
      </div>`;
    hireDiv.appendChild(crewDiv2);
  }
  panel.appendChild(hireDiv);
}

window.hireCrew = function(type) {
  const ct = CREW_TYPES[type];
  if (!ct) return;
  const hireCost = ct.baseWage * 10;
  if (state.gold >= hireCost) {
    state.gold -= hireCost;
    state.crew.push({
      id: state.nextCrewId++,
      type: type,
      name: ct.name,
      emoji: ct.emoji,
      skill: ct.skill,
    });
    updateStats();
    updateMessage(`Hired ${ct.emoji} ${ct.name} as ${ct.skill}!`);
    switchTab('crew');
  } else {
    updateMessage(`Need ${hireCost}g to hire ${ct.name}!`);
    switchTab('crew');
  }
};

window.fireCrew = function(index) {
  if (index < state.crew.length) {
    const c = state.crew[index];
    const ct = CREW_TYPES[c.type];
    state.crew.splice(index, 1);
    if (ct) {
      const refund = Math.floor(ct.baseWage * 5);
      state.gold += refund;
      updateMessage(`Fired ${c.emoji} ${c.name}. +${refund}g severance!`);
    } else {
      updateMessage('Crew member fired.');
    }
    updateStats();
    switchTab('crew');
  }
};

function renderPlatformsPanel(panel) {
  panel.innerHTML = `
    <h3 style="margin-bottom:8px; color:#FFD700;">🏗️ Platforms (${state.platforms.length})</h3>
    ${state.platforms.map(p => `<div style="margin:4px 0;">${p.emoji} <strong>${p.name}</strong> — (${p.x}, ${p.y})</div>`).join('')}
  `;
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
      🧊 Ice — Slow, find gems
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

// === CREW SYSTEM ===
function calculateCrewBonuses() {
  const bonuses = {
    fishMultiplier: 0,
    crabMultiplier: 0,
    stormReduction: 0,
    visitBonus: 0,
  };
  for (const c of state.crew) {
    const ct = CREW_TYPES[c.type];
    if (!ct || !ct.bonuses) continue;
    for (const [key, val] of Object.entries(ct.bonuses)) {
      if (key === 'allBonus') {
        bonuses.fishMultiplier += val;
        bonuses.crabMultiplier += val;
        bonuses.visitBonus += val;
        continue;
      }
      if (key === 'moraleBonus') continue;
      if (bonuses[key] !== undefined) {
        bonuses[key] += val;
      }
    }
  }
  return bonuses;
}

function getCrewPayroll() {
  let total = 0;
  for (const c of state.crew) {
    const ct = CREW_TYPES[c.type];
    if (ct) total += ct.baseWage;
  }
  return total;
}

// === GLOBAL ACTIONS ===
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

// === END GAME ===
// Start
document.addEventListener('DOMContentLoaded', () => {
  init();
  animate();
});
