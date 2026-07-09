// Skills and XP system for Bears Boats

// Skill definitions
const SKILL_TYPES = {
  fishing: { name: 'Fishing', emoji: '🐟', maxLevel: 10 },
  crabbing: { name: 'Crabbing', emoji: '🦀', maxLevel: 10 },
  navigation: { name: 'Navigation', emoji: '🧭', maxLevel: 10 },
  engineering: { name: 'Engineering', emoji: '⚙️', maxLevel: 10 },
  seamanship: { name: 'Seamanship', emoji: '⛵', maxLevel: 10 },
  trading: { name: 'Trading', emoji: '💰', maxLevel: 10 },
};

// XP needed for next level
function xpForLevel(level) {
  return 5 + (level - 1) * 5;
}

// Create a fresh skill set
function createSkillSet() {
  const skills = {};
  for (const key of Object.keys(SKILL_TYPES)) {
    skills[key] = { level: 1, xp: 0, maxXp: xpForLevel(2) };
  }
  return skills;
}

// Gain XP in a skill, returns true if leveled up
function gainXp(skills, skillKey, amount) {
  if (!skills || !skills[skillKey]) return false;
  const skill = skills[skillKey];
  skill.xp += amount;
  
  let leveled = false;
  while (skill.xp >= skill.maxXp && skill.level < SKILL_TYPES[skillKey].maxLevel) {
    skill.xp -= skill.maxXp;
    skill.level++;
    if (skill.level < SKILL_TYPES[skillKey].maxLevel) {
      skill.maxXp = xpForLevel(skill.level + 1);
    } else {
      skill.maxXp = 9999;
    }
    leveled = true;
  }
  return leveled;
}

// Calculate bonus from skills (e.g., fishing lv.3 gives +10% fish yield)
function skillBonus(skills, skillKey) {
  if (!skills || !skills[skillKey]) return 0;
  return (skills[skillKey].level - 1) * 0.05;
}

// Get all bonuses from a skill set
function getSkillBonuses(skills) {
  const bonuses = {
    fishMultiplier: 1,
    crabMultiplier: 1,
    stormReduction: 0,
    visitBonus: 0,
    speedMultiplier: 0,
    moraleBonus: 0,
  };
  
  // Fishing
  bonuses.fishMultiplier += skillBonus(skills, 'fishing');
  // Crabbing
  bonuses.crabMultiplier += skillBonus(skills, 'crabbing');
  // Navigation
  bonuses.stormReduction += skillBonus(skills, 'navigation');
  // Engineering
  bonuses.visitBonus += skillBonus(skills, 'engineering');
  // Seamanship
  bonuses.speedMultiplier += skillBonus(skills, 'seamanship');
  // Trading
  bonuses.moraleBonus += skillBonus(skills, 'trading');
  
  return bonuses;
}

export { SKILL_TYPES, createSkillSet, gainXp, skillBonus, getSkillBonuses };
