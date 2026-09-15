import { Item } from '../types/game';

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
