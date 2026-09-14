import { Item, Trait, Role } from '../types/game';

export const ITEMS: Item[] = [
  {
    id: 'infinity_edge',
    name: 'Infinity Blade',
    description: '+25% Crit Rate, +0.5 Crit Multiplier, +15 Attack Power',
    icon: 'Sword',
    cost: 300,
    bonusStats: {
      critRate: 0.25,
      critMult: 0.5,
      attackPower: 15,
    },
  },
  {
    id: 'warmog_heart',
    name: "Warmog's Titan Armor",
    description: '+400 Max Health, +20 Defense',
    icon: 'Shield',
    cost: 300,
    bonusStats: {
      hp: 400,
      defense: 20,
    },
  },
  {
    id: 'bloodthirster',
    name: 'Vampiric Scythe',
    description: '+25 Attack Power, +15% Lifesteal on basic attacks',
    icon: 'Skull',
    cost: 280,
    bonusStats: {
      attackPower: 25,
    },
    specialEffect: '15% Lifesteal on physical damage',
  },
  {
    id: 'rabadon_crown',
    name: "Archmage's Crown",
    description: '+50 Skill Power, +20 Starting Energy',
    icon: 'Wand2',
    cost: 320,
    bonusStats: {
      skillPower: 50,
    },
    specialEffect: '+20 Energy at match start',
  },
  {
    id: 'rapidfire_cannon',
    name: 'Hyper-Velocity Rifle',
    description: '+30% Attack Speed, +80 Attack Range',
    icon: 'Crosshair',
    cost: 290,
    bonusStats: {
      attackSpeed: 0.3,
      attackRange: 80,
    },
  },
  {
    id: 'guardian_angel',
    name: 'Aegis of Rebirth',
    description: '+200 HP, Revives champion once with 30% HP upon death',
    icon: 'Sparkles',
    cost: 350,
    bonusStats: {
      hp: 200,
    },
    specialEffect: 'Revives once with 30% HP on lethal damage',
  },
  {
    id: 'frozen_heart',
    name: 'Glacial Barrier',
    description: '+35 Defense, Reduces surrounding enemy Attack Speed by 20%',
    icon: 'Snowflake',
    cost: 310,
    bonusStats: {
      defense: 35,
    },
    specialEffect: 'Aura: -20% Enemy Attack Speed within 200px',
  },
];

export interface SynergyBonus {
  name: string;
  countRequired: number;
  description: string;
  effectType: string;
  value: number;
}

export const TRAIT_SYNERGIES: Record<Trait, SynergyBonus> = {
  Infernal: {
    name: 'Infernal Burn',
    countRequired: 2,
    description: 'Infernal units ignite targets dealing 50 damage over 3s',
    effectType: 'burn',
    value: 50,
  },
  Ironclad: {
    name: 'Iron Armor',
    countRequired: 2,
    description: 'Ironclad units gain +30 Defense & +200 Max HP',
    effectType: 'stat_defense_hp',
    value: 30,
  },
  Cyber: {
    name: 'Cyber Overdrive',
    countRequired: 2,
    description: 'Cyber units gain +25% Attack Speed & +15% Move Speed',
    effectType: 'stat_as_ms',
    value: 0.25,
  },
  Shadow: {
    name: 'Shadow Lethality',
    countRequired: 2,
    description: 'Shadow units gain +25% Crit Chance & 15% Lifesteal',
    effectType: 'stat_crit_lifesteal',
    value: 0.25,
  },
  Mystic: {
    name: 'Mystic Surge',
    countRequired: 2,
    description: 'Mystic units gain +40 Skill Power & +25 Starting Energy',
    effectType: 'stat_sp_energy',
    value: 40,
  },
  Nature: {
    name: 'Nature Regeneration',
    countRequired: 2,
    description: 'Nature units regenerate 20 HP per second continuously',
    effectType: 'regen',
    value: 20,
  },
  Celestial: {
    name: 'Celestial Barrier',
    countRequired: 2,
    description: 'All team units start battle with 180 Barrier Shield',
    effectType: 'start_shield',
    value: 180,
  },
};

export const ROLE_SYNERGIES: Record<Role, SynergyBonus> = {
  Tank: {
    name: 'Frontline Colossus',
    countRequired: 2,
    description: 'Tanks take 15% less incoming damage from all sources',
    effectType: 'damage_reduction',
    value: 0.15,
  },
  Fighter: {
    name: 'Brawler Might',
    countRequired: 2,
    description: 'Fighters gain +20 Attack Power & +15% Lifesteal',
    effectType: 'stat_ap_lifesteal',
    value: 20,
  },
  Assassin: {
    name: 'Lethal Precision',
    countRequired: 2,
    description: 'Assassins gain +40% Critical Damage Multiplier',
    effectType: 'stat_crit_mult',
    value: 0.4,
  },
  Mage: {
    name: 'Arcane Mastery',
    countRequired: 2,
    description: 'Mages gain +45 Skill Power & 20% Cooldown Reduction',
    effectType: 'stat_sp',
    value: 45,
  },
  Marksman: {
    name: 'Sniper Focus',
    countRequired: 2,
    description: 'Marksmen gain +100 Attack Range & +20% Attack Speed',
    effectType: 'stat_range_as',
    value: 100,
  },
  Support: {
    name: 'Aura Blessing',
    countRequired: 2,
    description: 'Boosts entire team Max HP by +120 & Healing by +25%',
    effectType: 'team_hp_heal',
    value: 120,
  },
};
