// Crew system for Bears Boats
// Crew hiring, stats tracking, and payroll

const CREW_TYPES = {
  bear: {
    name: 'Bear', emoji: '🐻', skill: 'Captain',
    baseWage: 5,
    bonuses: { allBonus: 0.05, moraleBonus: 0.10 },
    desc: '+5% everything, +10% morale',
  },
  duck: {
    name: 'Duck', emoji: '🦆', skill: 'Fisher',
    baseWage: 4,
    bonuses: { fishMultiplier: 0.25 },
    desc: '+25% fish yield',
  },
  crabby: {
    name: 'Crabby', emoji: '🦀', skill: 'Crabber',
    baseWage: 5,
    bonuses: { crabMultiplier: 0.30 },
    desc: '+30% crab yield',
  },
  penguin: {
    name: 'Penguin', emoji: '🐧', skill: 'Navigator',
    baseWage: 4,
    bonuses: { stormReduction: 0.20 },
    desc: '+20% storm reduction',
  },
  fox: {
    name: 'Fox', emoji: '🦊', skill: 'Trader',
    baseWage: 6,
    bonuses: { sellBonus: 0.15 },
    desc: '+15% sell bonus at platforms',
  },
  seal: {
    name: 'Seal', emoji: '🦭', skill: 'Rescuer',
    baseWage: 4,
    bonuses: { visitBonus: 0.10 },
    desc: '+10% island/treasure finds',
  },
  cat: {
    name: 'Cat', emoji: '🐱', skill: 'Sailor',
    baseWage: 3,
    bonuses: { speedMultiplier: 0.05 },
    desc: '+5% speed multiplier',
  },
  otter: {
    name: 'Otter', emoji: '🦦', skill: 'Diver',
    baseWage: 5,
    bonuses: { crabMultiplier: 0.15, fishMultiplier: 0.15 },
    desc: '+15% fish and crab yield',
  },
};

export { CREW_TYPES };
