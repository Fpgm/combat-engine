export type Role = 'Tank' | 'Fighter' | 'Assassin' | 'Mage' | 'Marksman' | 'Support';

export type Trait = 'Infernal' | 'Ironclad' | 'Shadow' | 'Mystic' | 'Cyber' | 'Nature' | 'Celestial';

export interface Skill {
  id: string;
  name: string;
  description: string;
  energyCost: number;
  cooldown: number; // in seconds
  icon: string;
  type: 'damage' | 'heal' | 'shield' | 'stun' | 'buff' | 'aoe' | 'execute';
  baseValue: number;
  scalingSkillPower: number; // multiplier
  range: number;
  radius?: number; // for AoE
  duration?: number; // for shield/stun/buff
}

export interface Passive {
  id: string;
  name: string;
  description: string;
  trigger: 'always' | 'onHit' | 'onLowHp' | 'onLethal' | 'onKill' | 'aura' | 'onCrit';
  icon: string;
}

export interface ChampionStats {
  hp: number;
  attackPower: number;
  attackSpeed: number; // attacks per second
  defense: number; // armor
  moveSpeed: number; // speed in pixels/sec
  attackRange: number; // in pixels (e.g., 50 melee, 250 ranged)
  critRate: number; // 0 to 1
  critMult: number; // e.g. 1.5 or 2.0
  skillPower: number; // scales spell damage
}

export interface Champion {
  id: string;
  name: string;
  title: string;
  role: Role;
  trait: Trait;
  avatarColor: string; // Tailwind color or hex
  accentColor: string;
  baseStats: ChampionStats;
  skill: Skill;
  passive: Passive;
  lore: string;
  avatarIcon: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  bonusStats: Partial<ChampionStats>;
  specialEffect?: string;
}

export interface ChampionMastery {
  championId: string;
  level: number; // 1 to 5
  matchesPlayed: number;
  wins: number;
}

export interface TeamMember {
  championId: string;
  itemId?: string;
  gridRow?: number; // 0 = Frontline, 1 = Midline, 2 = Backline
  gridCol?: number; // 0 = Top, 1 = Center, 2 = Bottom
}

export interface RivalTeam {
  id: string;
  name: string;
  tag: string;
  logoColor: string;
  rating: number;
  preferredRoles: Role[];
  championPool: string[]; // Champion IDs
  wins: number;
  losses: number;
  points: number;
}

export interface DraftState {
  phase: 'ban' | 'pick' | 'items' | 'ready';
  banCount: number;
  picksPerTeam: number; // 3, 4, or 5
  bannedChampionIds: string[];
  blueTeamPicks: TeamMember[]; // Player team
  redTeamPicks: TeamMember[]; // AI or Opponent team
  currentTurn: 'blue' | 'red';
  turnTimeLeft: number;
  history: string[];
}

export interface CombatEntity {
  id: string;
  championId: string;
  name: string;
  team: 'blue' | 'red';
  role: Role;
  trait: Trait;
  color: string;
  
  // Position & Movement
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  
  // Dynamic Stats during fight
  maxHp: number;
  currentHp: number;
  shield: number;
  attackPower: number;
  attackSpeed: number;
  defense: number;
  moveSpeed: number;
  attackRange: number;
  critRate: number;
  critMult: number;
  skillPower: number;
  
  energy: number;
  maxEnergy: number;
  
  // Cooldowns & Status
  attackCooldown: number;
  skillCooldown: number;
  isStunned: number; // duration remaining
  isInvulnerable: number;
  isCastingSkill: boolean;
  castProgress: number; // 0 to 1
  
  // Passive triggers tracking
  passiveTriggered: boolean; // e.g. revive or rage
  
  // Stats tracking for post-match
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalHealingDone: number;
  kills: number;
  assists: number;

  // Equipment item equipped
  item?: Item;
  skill: Skill;
  passive: Passive;
  targetId: string | null;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  lifetime: number; // remaining in seconds
  maxLifetime: number;
  vy: number;
}

export interface ParticleEffect {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  lifetime: number;
  maxLifetime: number;
  shape?: 'circle' | 'ring' | 'star' | 'beam' | 'meteor' | 'missile' | 'laser' | 'lightning' | 'heal_beam';
  startX?: number;
  startY?: number;
  targetX?: number;
  targetY?: number;
  targetEntityId?: string;
  speed?: number;
  trail?: { x: number; y: number }[];
  accentColor?: string;
}

export interface CombatEvent {
  id: string;
  timestamp: number;
  text: string;
  type: 'kill' | 'skill' | 'passive' | 'crit' | 'item';
  team?: 'blue' | 'red';
}

export interface MatchResult {
  winner: 'blue' | 'red';
  blueKills: number;
  redKills: number;
  duration: number; // seconds
  mvpEntityId: string;
  entities: CombatEntity[];
  logs: CombatEvent[];
}

export interface PlayerManagerProfile {
  teamName: string;
  teamTag: string;
  funds: number;
  trophies: number;
  division: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master';
  divisionPoints: number; // LP 0-100
  unlockedItems: string[];
  masteries: Record<string, ChampionMastery>; // championId -> mastery
}

export interface ActiveMatchConfig {
  blueTeamName: string;
  redTeamName: string;
  blueRoster: TeamMember[];
  redRoster: TeamMember[];
  teamSize: number;
}
