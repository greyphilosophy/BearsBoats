// Equipment system for Bears Boats
// Different types of equipment for ships, like FTL deck slots

// Equipment types with actual gameplay effects
const EQUIPMENT_TYPES = {
  // ─── Fishing ───
  net: {
    name: 'Fishing Net',
    emoji: '🥅',
    type: 'fishing',
    cost: 60,
    desc: '+25% fish yield per net',
    effect: { fishMultiplier: 1.25 },
  },
  pot: {
    name: 'Crab Pot',
    emoji: '🦀',
    type: 'fishing',
    cost: 90,
    desc: '+30% crab yield per pot',
    effect: { crabMultiplier: 1.30 },
  },
  trawl: {
    name: 'Trawl Net',
    emoji: '🕸️',
    type: 'fishing',
    cost: 140,
    desc: 'Combined +15% fish and crab',
    effect: { fishMultiplier: 1.15, crabMultiplier: 1.15 },
  },
  bait: {
    name: 'Bait Locker',
    emoji: '🐟',
    type: 'fishing',
    cost: 80,
    desc: '+20% bonus to first catch each day',
    effect: { firstCatchBonus: 0.20 },
  },
  // ─── Cargo ───
  hold: {
    name: 'Cargo Hold',
    emoji: '📦',
    type: 'cargo',
    cost: 120,
    desc: '+50 gold storage capacity',
    effect: { cargoCapacity: 50 },
  },
  crane: {
    name: 'Crane',
    emoji: '🏗️',
    type: 'cargo',
    cost: 200,
    desc: '+20% sell bonus at platforms',
    effect: { sellBonus: 0.20 },
  },
  winch: {
    name: 'Winch',
    emoji: '🔩',
    type: 'cargo',
    cost: 110,
    desc: '+10% cargo per tile visited',
    effect: { visitBonus: 0.10 },
  },
  // ─── Power ───
  engine: {
    name: 'Engine Upgrade',
    emoji: '⚙️',
    type: 'power',
    cost: 150,
    desc: '+1 speed to base hull speed',
    effect: { speedBonus: 1 },
  },
  battery: {
    name: 'Battery Bank',
    emoji: '🔋',
    type: 'power',
    cost: 180,
    desc: '+10% fuel efficiency',
    effect: { fuelEfficiency: 0.10 },
  },
  // ─── Defense ───
  anchor: {
    name: 'Anchor',
    emoji: '⚓',
    type: 'defense',
    cost: 130,
    desc: 'Reduces storm damage by 25%',
    effect: { stormReduction: 0.25 },
  },
  hull_plating: {
    name: 'Hull Plating',
    emoji: '🛡️',
    type: 'defense',
    cost: 220,
    desc: 'Reduces ice slowdown',
    effect: { iceReduction: 0.30 },
  },
  // ─── Utility ───
  galley: {
    name: 'Galley',
    emoji: '🍽️',
    type: 'utility',
    cost: 80,
    desc: '+10% morale (crew bonus)',
    effect: { moraleBonus: 0.10 },
  },
  cabin: {
    name: 'Cabin',
    emoji: '🛏️',
    type: 'utility',
    cost: 100,
    desc: '+1 crew slot',
    effect: { crewSlot: 1 },
  },
  radar: {
    name: 'Radar',
    emoji: '📡',
    type: 'utility',
    cost: 180,
    desc: '+15% encounter bonus',
    effect: { encounterBonus: 0.15 },
  },
  mast: {
    name: 'Mast',
    emoji: '🏗️',
    type: 'utility',
    cost: 150,
    desc: '+5% speed multiplier',
    effect: { speedMultiplier: 0.05 },
  },
};

// All equipment grouped by type for the shop
const EQUIPMENT_CATEGORIES = {
  '🐟 Fishing': ['net', 'pot', 'trawl', 'bait'],
  '📦 Cargo': ['hold', 'crane', 'winch'],
  '⚡ Power': ['engine', 'battery'],
  '🛡️ Defense': ['anchor', 'hull_plating'],
  '🔧 Utility': ['galley', 'cabin', 'radar', 'mast'],
};

// Calculate equipment bonuses from installed modules
function calculateEquipmentBonuses(deck) {
  const bonuses = {
    fishMultiplier: 1.0,
    crabMultiplier: 1.0,
    firstCatchBonus: 0,
    cargoCapacity: 0,
    sellBonus: 0,
    visitBonus: 0,
    speedBonus: 0,
    fuelEfficiency: 0,
    stormReduction: 0,
    iceReduction: 0,
    moraleBonus: 0,
    crewSlot: 0,
    encounterBonus: 0,
    speedMultiplier: 0,
  };

  deck.forEach(slot => {
    if (!slot || !slot.module) return;
    const eq = EQUIPMENT_TYPES[slot.module];
    if (!eq || !eq.effect) return;

    for (const [key, val] of Object.entries(eq.effect)) {
      if (bonuses[key] !== undefined) {
        bonuses[key] += val;
      }
    }
  });

  return bonuses;
}

export { EQUIPMENT_TYPES, EQUIPMENT_CATEGORIES, calculateEquipmentBonuses };
