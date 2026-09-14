import {
  CombatEntity,
  CombatEvent,
  FloatingText,
  ParticleEffect,
  MatchResult,
  TeamMember,
} from '../types/game';
import { CHAMPIONS } from '../data/champions';
import { ITEMS, TRAIT_SYNERGIES, ROLE_SYNERGIES } from '../data/items';
import { playHitSound, playSkillSound, playKillSound } from './sound';

export function initializeCombatEntities(
  blueRoster: TeamMember[],
  redRoster: TeamMember[],
  arenaWidth = 800,
  arenaHeight = 500
): CombatEntity[] {
  const entities: CombatEntity[] = [];

  // Helper to create entity
  const createEntity = (
    member: TeamMember,
    team: 'blue' | 'red',
    index: number,
    totalCount: number
  ): CombatEntity => {
    const champ = CHAMPIONS.find((c) => c.id === member.championId) || CHAMPIONS[0];
    const item = ITEMS.find((i) => i.id === member.itemId);

    // Grid-based initial placement
    let row = member.gridRow;
    let col = member.gridCol;

    if (row === undefined || col === undefined) {
      if (champ.role === 'Tank' || champ.role === 'Fighter') {
        row = 0; // Frontline
      } else if (champ.role === 'Assassin') {
        row = 1; // Midline
      } else {
        row = 2; // Backline
      }
      col = index % 3;
    }

    let x = 0;
    if (team === 'blue') {
      x = row === 0 ? 280 : row === 1 ? 180 : 80;
    } else {
      x = row === 0 ? arenaWidth - 280 : row === 1 ? arenaWidth - 180 : arenaWidth - 80;
    }
    const y = 120 + (col % 3) * 120;

    // Base stats with optional item additions
    const stats = { ...champ.baseStats };
    if (item && item.bonusStats) {
      if (item.bonusStats.hp) stats.hp += item.bonusStats.hp;
      if (item.bonusStats.attackPower) stats.attackPower += item.bonusStats.attackPower;
      if (item.bonusStats.attackSpeed) stats.attackSpeed += item.bonusStats.attackSpeed;
      if (item.bonusStats.defense) stats.defense += item.bonusStats.defense;
      if (item.bonusStats.attackRange) stats.attackRange += item.bonusStats.attackRange;
      if (item.bonusStats.critRate) stats.critRate += item.bonusStats.critRate;
      if (item.bonusStats.critMult) stats.critMult += item.bonusStats.critMult;
      if (item.bonusStats.skillPower) stats.skillPower += item.bonusStats.skillPower;
    }

    const startEnergy = item?.id === 'rabadon_crown' ? 20 : 0;

    return {
      id: `${team}_${champ.id}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      championId: champ.id,
      name: champ.name,
      team,
      role: champ.role,
      trait: champ.trait,
      color: champ.avatarColor,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: champ.role === 'Tank' ? 22 : champ.role === 'Fighter' ? 19 : 17,
      maxHp: stats.hp,
      currentHp: stats.hp,
      shield: 0,
      attackPower: stats.attackPower,
      attackSpeed: stats.attackSpeed,
      defense: stats.defense,
      moveSpeed: stats.moveSpeed,
      attackRange: stats.attackRange,
      critRate: stats.critRate,
      critMult: stats.critMult,
      skillPower: stats.skillPower,
      energy: startEnergy,
      maxEnergy: 100,
      attackCooldown: 0.5,
      skillCooldown: 0,
      isStunned: 0,
      isInvulnerable: 0,
      isCastingSkill: false,
      castProgress: 0,
      passiveTriggered: false,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      totalHealingDone: 0,
      kills: 0,
      assists: 0,
      item,
      skill: champ.skill,
      passive: champ.passive,
      targetId: null,
    };
  };

  blueRoster.forEach((m, idx) => {
    entities.push(createEntity(m, 'blue', idx, blueRoster.length));
  });

  redRoster.forEach((m, idx) => {
    entities.push(createEntity(m, 'red', idx, redRoster.length));
  });

  // Apply Team Synergies
  applySynergies(entities, 'blue');
  applySynergies(entities, 'red');

  return entities;
}

function applySynergies(entities: CombatEntity[], team: 'blue' | 'red') {
  const teamEntities = entities.filter((e) => e.team === team);

  // Count Traits & Roles
  const traitCounts: Record<string, number> = {};
  const roleCounts: Record<string, number> = {};

  teamEntities.forEach((e) => {
    traitCounts[e.trait] = (traitCounts[e.trait] || 0) + 1;
    roleCounts[e.role] = (roleCounts[e.role] || 0) + 1;
  });

  // Check Trait Bonuses
  Object.entries(traitCounts).forEach(([trait, count]) => {
    const synergy = TRAIT_SYNERGIES[trait as keyof typeof TRAIT_SYNERGIES];
    if (synergy && count >= synergy.countRequired) {
      teamEntities.forEach((e) => {
        if (e.trait === trait) {
          if (synergy.effectType === 'stat_defense_hp') {
            e.defense += synergy.value;
            e.maxHp += 200;
            e.currentHp += 200;
          } else if (synergy.effectType === 'stat_as_ms') {
            e.attackSpeed += 0.25;
            e.moveSpeed *= 1.15;
          } else if (synergy.effectType === 'stat_crit_lifesteal') {
   e.critRate += 0.25;
 } else if (synergy.effectType === 'stat_sp_energy') {
   e.skillPower += synergy.value;
   e.energy += 25;
 } else if (synergy.effectType === 'regen') {
   const regenVal = synergy.value * dt;
   e.currentHp = Math.min(e.maxHp, e.currentHp + regenVal);
   e.totalHealingDone += regenVal;
 }
 }
 if (synergy.effectType === 'start_shield') {
 e.shield += synergy.value;
 }
 });
 }
 });

  // Check Role Bonuses
  Object.entries(roleCounts).forEach(([role, count]) => {
    const synergy = ROLE_SYNERGIES[role as keyof typeof ROLE_SYNERGIES];
    if (synergy && count >= synergy.countRequired) {
      teamEntities.forEach((e) => {
        if (e.role === role) {
          if (synergy.effectType === 'stat_crit_mult') {
            e.critMult += 0.4;
          } else if (synergy.effectType === 'stat_sp') {
            e.skillPower += 45;
          } else if (synergy.effectType === 'stat_range_as') {
            e.attackRange += 100;
            e.attackSpeed += 0.2;
          } else if (synergy.effectType === 'stat_ap_lifesteal') {
            e.attackPower += 20;
          }
        }
      });
    }
  });
}

export function updateCombatEngine(
  entities: CombatEntity[],
  particles: ParticleEffect[],
  floatingTexts: FloatingText[],
  logs: CombatEvent[],
  dt: number, // delta time in seconds
  arenaWidth = 800,
  arenaHeight = 500
): { matchFinished: boolean; winner?: 'blue' | 'red' } {
  // Check Win condition
  const blueAlive = entities.filter((e) => e.team === 'blue' && e.currentHp > 0);
  const redAlive = entities.filter((e) => e.team === 'red' && e.currentHp > 0);

  if (blueAlive.length === 0 && redAlive.length === 0) {
    return { matchFinished: true, winner: 'red' }; // Draw goes to red
  }
  if (blueAlive.length === 0) {
    return { matchFinished: true, winner: 'red' };
  }
  if (redAlive.length === 0) {
    return { matchFinished: true, winner: 'blue' };
  }

  // Update particles & projectiles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.lifetime -= dt;

    if (p.shape === 'missile' || p.shape === 'meteor' || p.shape === 'heal_beam') {
      let tx = p.targetX ?? p.x;
      let ty = p.targetY ?? p.y;
      if (p.targetEntityId) {
        const targetEnt = entities.find((e) => e.id === p.targetEntityId);
        if (targetEnt && targetEnt.currentHp > 0) {
          tx = targetEnt.x;
          ty = targetEnt.y;
        }
      }

      const dx = tx - p.x;
      const dy = ty - p.y;
      const dist = Math.hypot(dx, dy);
      const speed = p.speed || 650;

      if (dist > 12 && p.lifetime > 0.05) {
        const moveStep = Math.min(dist, speed * dt);
        const angle = Math.atan2(dy, dx);
        p.x += Math.cos(angle) * moveStep;
        p.y += Math.sin(angle) * moveStep;

        if (!p.trail) p.trail = [];
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 7) p.trail.shift();
      } else {
        // Impact effect when missile arrives
        if (p.shape === 'meteor') {
          for (let k = 0; k < 10; k++) {
            particles.push({
              id: Math.random().toString(),
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 220,
              vy: (Math.random() - 0.5) * 220,
              radius: Math.random() * 4 + 2,
              color: '#f97316',
              lifetime: 0.35,
              maxLifetime: 0.35,
              shape: 'circle',
            });
          }
        } else {
          for (let k = 0; k < 3; k++) {
            particles.push({
              id: Math.random().toString(),
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 120,
              vy: (Math.random() - 0.5) * 120,
              radius: Math.random() * 2.5 + 1.5,
              color: p.color,
              lifetime: 0.2,
              maxLifetime: 0.2,
              shape: 'circle',
            });
          }
        }
        particles.splice(i, 1);
        continue;
      }
    } else {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    if (p.lifetime <= 0) {
      particles.splice(i, 1);
    }
  }

  // Update floating text
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.lifetime -= dt;
    ft.y += ft.vy * dt;
    if (ft.lifetime <= 0) {
      floatingTexts.splice(i, 1);
    }
  }

  // Process Entities
  entities.forEach((entity) => {
    if (entity.currentHp <= 0) return;

    // Status timers
    if (entity.isStunned > 0) entity.isStunned -= dt;
    if (entity.isInvulnerable > 0) entity.isInvulnerable -= dt;
    if (entity.attackCooldown > 0) entity.attackCooldown -= dt;
    if (entity.skillCooldown > 0) entity.skillCooldown -= dt;

    // Nature / Item Regeneration
    if (entity.passive.id === 'spirit_aura' || entity.passive.id === 'reactive_reboot') {
      const regenVal = 15 * dt;
      entity.currentHp = Math.min(entity.maxHp, entity.currentHp + regenVal);
      entity.totalHealingDone += regenVal;
    }

    // Flame Aura Passive
    if (entity.passive.id === 'flame_aura') {
      const enemies = entities.filter((e) => e.team !== entity.team && e.currentHp > 0);
      enemies.forEach((enemy) => {
        const dx = enemy.x - entity.x;
        const dy = enemy.y - entity.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= 160) {
          const auraDmg = 30 * dt;
          applyDamage(enemy, entity, auraDmg, false, floatingTexts, logs, 'magic', particles);
        }
      });
    }

    if (entity.isStunned > 0) return; // Stunned units cannot move or attack

    // Target Selection
    const enemyTeam = entity.team === 'blue' ? 'red' : 'blue';
    const enemies = entities.filter((e) => e.team === enemyTeam && e.currentHp > 0);

    if (enemies.length === 0) return;

    let target: CombatEntity | null = null;

    // Assassins prioritize lowest HP or squishy marksman/mage
    if (entity.role === 'Assassin') {
      target = enemies.reduce((lowest, curr) => (curr.currentHp < lowest.currentHp ? curr : lowest), enemies[0]);
    } else {
      // Find nearest enemy
      let minDist = Infinity;
      enemies.forEach((enemy) => {
        const d = Math.hypot(enemy.x - entity.x, enemy.y - entity.y);
        if (d < minDist) {
          minDist = d;
          target = enemy;
        }
      });
    }

    if (!target) return;
    entity.targetId = target.id;

    const dx = target.x - entity.x;
    const dy = target.y - entity.y;
    const dist = Math.hypot(dx, dy);

    // Movement toward target if out of range
    if (dist > entity.attackRange) {
      const angle = Math.atan2(dy, dx);
      const moveDist = entity.moveSpeed * dt;
      entity.x += Math.cos(angle) * moveDist;
      entity.y += Math.sin(angle) * moveDist;

      // Keep within arena bounds
      entity.x = Math.max(30, Math.min(arenaWidth - 30, entity.x));
      entity.y = Math.max(30, Math.min(arenaHeight - 30, entity.y));
    }

    // Basic Attack
    if (dist <= entity.attackRange + 15 && entity.attackCooldown <= 0) {
      entity.attackCooldown = 1 / entity.attackSpeed;

      // Roll Crit
      const isCrit = Math.random() < entity.critRate;
      let rawDamage = entity.attackPower * (isCrit ? entity.critMult : 1.0);

      // Passive bonus: Eagle Eye (Nova)
      if (entity.passive.id === 'eagle_eye' && dist > 250) {
        rawDamage *= 1.25;
      }

      // Spawn visual projectile for ranged basic attacks
      if (entity.attackRange > 120) {
        particles.push({
          id: Math.random().toString(),
          x: entity.x,
          y: entity.y,
          vx: 0,
          vy: 0,
          startX: entity.x,
          startY: entity.y,
          targetX: target.x,
          targetY: target.y,
          targetEntityId: target.id,
          radius: isCrit ? 5 : 3.5,
          color: isCrit ? '#facc15' : entity.color,
          accentColor: '#ffffff',
          lifetime: 0.35,
          maxLifetime: 0.35,
          shape: 'missile',
          speed: 800,
          trail: [{ x: entity.x, y: entity.y }],
        });
      }

      // Apply Damage
      applyDamage(target, entity, rawDamage, isCrit, floatingTexts, logs, 'physical', particles);

      // Gain Energy
      entity.energy = Math.min(entity.maxEnergy, entity.energy + 16);
      target.energy = Math.min(target.maxEnergy, target.energy + 6);

      // Lifesteal check
      if (entity.item?.id === 'bloodthirster') {
        const lifesteal = rawDamage * 0.15;
        entity.currentHp = Math.min(entity.maxHp, entity.currentHp + lifesteal);
        entity.totalHealingDone += lifesteal;
      }

      playHitSound(isCrit);
    }

    // Cast Active Skill when Energy is 100!
    if (entity.energy >= entity.maxEnergy && entity.skillCooldown <= 0) {
      entity.energy = Math.max(0, entity.energy - entity.skill.energyCost);
      entity.skillCooldown = entity.skill.cooldown;

      executeSkill(entity, target, entities, floatingTexts, particles, logs);
      playSkillSound(entity.skill.type);
    }
  });

  return { matchFinished: false };
}

function applyDamage(
  target: CombatEntity,
  attacker: CombatEntity,
  rawDmg: number,
  isCrit: boolean,
  floatingTexts: FloatingText[],
  logs: CombatEvent[],
  damageType: 'physical' | 'magic' | 'true',
  particles: ParticleEffect[]
) {
  if (target.currentHp <= 0) return;

  // Invulnerability check
  if (target.isInvulnerable > 0) {
    floatingTexts.push({
      id: Math.random().toString(),
      x: target.x,
      y: target.y - 20,
      text: 'IMMUNE',
      color: '#fbbf24',
      size: 14,
      lifetime: 0.8,
      maxLifetime: 0.8,
      vy: -20,
    });
    return;
  }

  // Armor reduction calculation
  let effectiveArmor = target.defense;
  if (attacker.passive.id === 'crit_shred' && isCrit) {
    effectiveArmor *= 0.6; // Shreds 40%
  }

  let finalDmg = rawDmg;
  if (damageType !== 'true') {
    finalDmg = rawDmg * (100 / (100 + Math.max(0, effectiveArmor)));
  }

  // Fortress Hull passive
  if (target.passive.id === 'fortress_hull') {
    finalDmg *= 0.85;
  }

  // Shield absorber
  if (target.shield > 0) {
    if (target.shield >= finalDmg) {
      target.shield -= finalDmg;
      finalDmg = 0;
    } else {
      finalDmg -= target.shield;
      target.shield = 0;
    }
  }

  target.currentHp -= finalDmg;
  attacker.totalDamageDealt += finalDmg;
  target.totalDamageTaken += finalDmg;

  // Attacker Lifesteal (bloodthirster item)
  if (attacker.item?.id === 'bloodthirster' && finalDmg > 0) {
    const lifesteal = finalDmg * 0.15;
    attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + lifesteal);
    attacker.totalHealingDone += lifesteal;
  }

  // Thorns Passive Reflect
  if (target.passive.id === 'thorns_armor' && damageType === 'physical') {
    const reflected = finalDmg * 0.25;
    attacker.currentHp -= reflected;
  }

  // Floating Damage Text — show actual damage dealt (0 if absorbed)
  const textVal = Math.round(Math.max(0, finalDmg));
  if (textVal > 0) {
    floatingTexts.push({
      id: Math.random().toString(),
      x: target.x + (Math.random() * 20 - 10),
      y: target.y - 20,
      text: isCrit ? `CRIT! ${textVal}` : `${textVal}`,
      color: isCrit ? '#facc15' : damageType === 'magic' ? '#c084fc' : '#ef4444',
      size: isCrit ? 18 : 14,
      lifetime: 0.9,
      maxLifetime: 0.9,
      vy: -25,
    });
  }

  // Spawn hit sparks particles
  for (let i = 0; i < 4; i++) {
    particles.push({
      id: Math.random().toString(),
      x: target.x,
      y: target.y,
      vx: (Math.random() - 0.5) * 120,
      vy: (Math.random() - 0.5) * 120,
      radius: Math.random() * 3 + 2,
      color: isCrit ? '#facc15' : attacker.color,
      lifetime: 0.3,
      maxLifetime: 0.3,
    });
  }

  // Check Undying / Guardian Angel passive on lethal damage
  if (target.currentHp <= 0) {
    if (!target.passiveTriggered && (target.passive.id === 'undying_rage' || target.item?.id === 'guardian_angel')) {
      target.passiveTriggered = true;
      target.currentHp = target.maxHp * 0.35;
      target.isInvulnerable = 3.0;

      floatingTexts.push({
        id: Math.random().toString(),
        x: target.x,
        y: target.y - 30,
        text: 'UNDYING REVIVE!',
        color: '#34d399',
        size: 16,
        lifetime: 1.2,
        maxLifetime: 1.2,
        vy: -30,
      });

      logs.push({
        id: Math.random().toString(),
        timestamp: Date.now(),
        text: `${target.name} triggered Undying Revive!`,
        type: 'passive',
        team: target.team,
      });
      return;
    }

    // Target Defeated!
    target.currentHp = 0;
    attacker.kills += 1;

    playKillSound();

    floatingTexts.push({
      id: Math.random().toString(),
      x: target.x,
      y: target.y - 35,
      text: 'ELIMINATED!',
      color: '#f43f5e',
      size: 18,
      lifetime: 1.2,
      maxLifetime: 1.2,
      vy: -35,
    });

    logs.push({
        id: Math.random().toString(),
        timestamp: Date.now(),
        text: `${attacker.name} [${attacker.team.toUpperCase()}] eliminated ${target.name}!`,
        type: 'kill',
        team: attacker.team,
      });

    // On Kill Passives (Soul Reaper Vespera)
    if (attacker.passive.id === 'soul_reaper') {
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + attacker.maxHp * 0.35);
      attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + 60);
      floatingTexts.push({
        id: Math.random().toString(),
        x: attacker.x,
        y: attacker.y - 25,
        text: 'SOUL STEAL!',
        color: '#c084fc',
        size: 15,
        lifetime: 1.0,
        maxLifetime: 1.0,
        vy: -25,
      });
    }
  }
}

function executeSkill(
  caster: CombatEntity,
  target: CombatEntity,
  allEntities: CombatEntity[],
  floatingTexts: FloatingText[],
  particles: ParticleEffect[],
  logs: CombatEvent[]
) {
  const skill = caster.skill;
  const dmgVal = skill.baseValue + (caster.skillPower * skill.scalingSkillPower);

  // Skill Banner Callout
  floatingTexts.push({
    id: Math.random().toString(),
    x: caster.x,
    y: caster.y - 40,
    text: `${skill.name.toUpperCase()}!`,
    color: '#38bdf8',
    size: 18,
    lifetime: 1.3,
    maxLifetime: 1.3,
    vy: -35,
  });

  logs.push({
    id: Math.random().toString(),
    timestamp: Date.now(),
    text: `${caster.name} activated ${skill.name}!`,
    type: 'skill',
    team: caster.team,
  });

  const enemies = allEntities.filter((e) => e.team !== caster.team && e.currentHp > 0);
  const allies = allEntities.filter((e) => e.team === caster.team && e.currentHp > 0);

  if (skill.type === 'shield') {
    caster.shield += dmgVal;
    // Spawn shield ring particle
    particles.push({
      id: Math.random().toString(),
      x: caster.x,
      y: caster.y,
      vx: 0,
      vy: 0,
      radius: 45,
      color: '#38bdf8',
      lifetime: 0.8,
      maxLifetime: 0.8,
      shape: 'ring',
    });

    // Spawn energy laser beams connecting caster to surrounding taunted enemies
    enemies.forEach((enemy) => {
      const d = Math.hypot(enemy.x - caster.x, enemy.y - caster.y);
      if (d <= (skill.radius || 220)) {
        particles.push({
          id: Math.random().toString(),
          x: enemy.x,
          y: enemy.y,
          vx: 0,
          vy: 0,
          startX: caster.x,
          startY: caster.y,
          targetX: enemy.x,
          targetY: enemy.y,
          radius: 3.5,
          color: '#38bdf8',
          accentColor: '#e0f2fe',
          lifetime: 0.45,
          maxLifetime: 0.45,
          shape: 'laser',
        });
      }
    });
  } else if (skill.type === 'heal') {
    // Heal lowest HP allies
    allies.sort((a, b) => a.currentHp - b.currentHp);
    const toHeal = allies.slice(0, 2);
    toHeal.forEach((ally) => {
      ally.currentHp = Math.min(ally.maxHp, ally.currentHp + dmgVal);
      caster.totalHealingDone += dmgVal;

      floatingTexts.push({
        id: Math.random().toString(),
        x: ally.x,
        y: ally.y - 20,
        text: `+${Math.round(dmgVal)} HEAL`,
        color: '#34d399',
        size: 16,
        lifetime: 1.0,
        maxLifetime: 1.0,
        vy: -25,
      });

      // Heal Beam Projectile from caster to ally
      particles.push({
        id: Math.random().toString(),
        x: caster.x,
        y: caster.y,
        vx: 0,
        vy: 0,
        startX: caster.x,
        startY: caster.y,
        targetX: ally.x,
        targetY: ally.y,
        targetEntityId: ally.id,
        radius: 4,
        color: '#34d399',
        accentColor: '#a7f3d0',
        lifetime: 0.5,
        maxLifetime: 0.5,
        shape: 'heal_beam',
        speed: 700,
        trail: [{ x: caster.x, y: caster.y }],
      });

      // Ring pulse on ally
      particles.push({
        id: Math.random().toString(),
        x: ally.x,
        y: ally.y,
        vx: 0,
        vy: -40,
        radius: 25,
        color: '#34d399',
        lifetime: 0.6,
        maxLifetime: 0.6,
        shape: 'ring',
      });
    });
  } else if (skill.type === 'aoe') {
    // AoE blast around target or caster
    const originX = skill.range > 200 ? target.x : caster.x;
    const originY = skill.range > 200 ? target.y : caster.y;
    const radius = skill.radius || 150;

    // Spawn falling meteor projectile from sky/caster to origin point
    particles.push({
      id: Math.random().toString(),
      x: caster.x,
      y: caster.y - 120,
      vx: 0,
      vy: 0,
      startX: caster.x,
      startY: caster.y - 120,
      targetX: originX,
      targetY: originY,
      radius: 12,
      color: '#f97316',
      accentColor: '#fef08a',
      lifetime: 0.45,
      maxLifetime: 0.45,
      shape: 'meteor',
      speed: 600,
      trail: [{ x: caster.x, y: caster.y - 120 }],
    });

    // Beam connecting sky to ground impact
    particles.push({
      id: Math.random().toString(),
      x: originX,
      y: originY,
      vx: 0,
      vy: 0,
      startX: originX,
      startY: 0,
      targetX: originX,
      targetY: originY,
      radius: 5,
      color: '#dc2626',
      accentColor: '#fde047',
      lifetime: 0.4,
      maxLifetime: 0.4,
      shape: 'beam',
    });

    enemies.forEach((enemy) => {
      const d = Math.hypot(enemy.x - originX, enemy.y - originY);
      if (d <= radius) {
        applyDamage(enemy, caster, dmgVal, true, floatingTexts, logs, 'magic', particles);
      }
    });

    particles.push({
      id: Math.random().toString(),
      x: originX,
      y: originY,
      vx: 0,
      vy: 0,
      radius: radius,
      color: '#f87171',
      lifetime: 0.6,
      maxLifetime: 0.6,
      shape: 'ring',
    });
  } else if (skill.type === 'stun') {
    // Deal damage and stun target/radius
    const radius = skill.radius || 100;

    // Spawn lightning arcs connecting caster to stun target
    particles.push({
      id: Math.random().toString(),
      x: target.x,
      y: target.y,
      vx: 0,
      vy: 0,
      startX: caster.x,
      startY: caster.y,
      targetX: target.x,
      targetY: target.y,
      radius: 4,
      color: '#67e8f9',
      accentColor: '#ffffff',
      lifetime: 0.45,
      maxLifetime: 0.45,
      shape: 'lightning',
    });

    enemies.forEach((enemy) => {
      const d = Math.hypot(enemy.x - target.x, enemy.y - target.y);
      if (d <= radius) {
        enemy.isStunned = skill.duration || 2.0;
        applyDamage(enemy, caster, dmgVal, false, floatingTexts, logs, 'magic', particles);

        floatingTexts.push({
          id: Math.random().toString(),
          x: enemy.x,
          y: enemy.y - 25,
          text: 'STUNNED!',
          color: '#67e8f9',
          size: 15,
          lifetime: 1.0,
          maxLifetime: 1.0,
          vy: -20,
        });
      }
    });
  } else if (skill.type === 'execute') {
    // Don't execute dead targets
    if (target.currentHp <= 0) return;

    const oldX = caster.x;
    const oldY = caster.y;

    // Teleport behind target and deal high damage
    caster.x = target.x - 30;
    caster.y = target.y;

    // Spawn shadow step beam trail between old and new position
    particles.push({
      id: Math.random().toString(),
      x: caster.x,
      y: caster.y,
      vx: 0,
      vy: 0,
      startX: oldX,
      startY: oldY,
      targetX: caster.x,
      targetY: caster.y,
      radius: 6,
      color: '#9333ea',
      accentColor: '#c084fc',
      lifetime: 0.45,
      maxLifetime: 0.45,
      shape: 'beam',
    });

    let finalExecuteDmg = dmgVal;
    if (target.currentHp / target.maxHp < 0.35) {
      finalExecuteDmg *= 2.0; // Double execute damage!
    }

    applyDamage(target, caster, finalExecuteDmg, true, floatingTexts, logs, 'true', particles);
  } else if (skill.type === 'buff') {
    // Invulnerability buff to lowest HP ally
    allies.sort((a, b) => a.currentHp - b.currentHp);
    if (allies.length > 0) {
      const lowestAlly = allies[0];
      lowestAlly.isInvulnerable = skill.duration || 2.0;
      lowestAlly.currentHp = Math.min(lowestAlly.maxHp, lowestAlly.currentHp + dmgVal);

      // Celestial laser beam on ally
      particles.push({
        id: Math.random().toString(),
        x: lowestAlly.x,
        y: lowestAlly.y,
        vx: 0,
        vy: 0,
        startX: caster.x,
        startY: caster.y,
        targetX: lowestAlly.x,
        targetY: lowestAlly.y,
        radius: 5,
        color: '#facc15',
        accentColor: '#fef08a',
        lifetime: 0.5,
        maxLifetime: 0.5,
        shape: 'laser',
      });

      floatingTexts.push({
        id: Math.random().toString(),
        x: lowestAlly.x,
        y: lowestAlly.y - 25,
        text: 'STARLIGHT SHIELD!',
        color: '#fde047',
        size: 16,
        lifetime: 1.2,
        maxLifetime: 1.2,
        vy: -25,
      });
    }
  } else {
    // Standard high single damage - fire high energy laser & plasma missile
    particles.push({
      id: Math.random().toString(),
      x: caster.x,
      y: caster.y,
      vx: 0,
      vy: 0,
      startX: caster.x,
      startY: caster.y,
      targetX: target.x,
      targetY: target.y,
      radius: 5,
      color: caster.color || '#38bdf8',
      accentColor: '#ffffff',
      lifetime: 0.4,
      maxLifetime: 0.4,
      shape: 'laser',
    });

    particles.push({
      id: Math.random().toString(),
      x: caster.x,
      y: caster.y,
      vx: 0,
      vy: 0,
      startX: caster.x,
      startY: caster.y,
      targetX: target.x,
      targetY: target.y,
      targetEntityId: target.id,
      radius: 6,
      color: caster.color || '#38bdf8',
      accentColor: '#ffffff',
      lifetime: 0.35,
      maxLifetime: 0.35,
      shape: 'missile',
      speed: 850,
      trail: [{ x: caster.x, y: caster.y }],
    });

    applyDamage(target, caster, dmgVal, true, floatingTexts, logs, 'magic', particles);
  }
}

export function computePostMatchResult(
  winner: 'blue' | 'red',
  entities: CombatEntity[],
  logs: CombatEvent[],
  duration: number
): MatchResult {
  const blueKills = entities.filter((e) => e.team === 'blue').reduce((acc, e) => acc + e.kills, 0);
  const redKills = entities.filter((e) => e.team === 'red').reduce((acc, e) => acc + e.kills, 0);

  // Calculate MVP entity based on damage + kills + healing
  let mvpId = entities[0]?.id || '';
  let maxScore = -1;

  entities.forEach((e) => {
    const score = e.totalDamageDealt + e.kills * 400 + e.totalHealingDone * 1.2;
    if (score > maxScore) {
      maxScore = score;
      mvpId = e.id;
    }
  });

  return {
    winner,
    blueKills,
    redKills,
    duration,
    mvpEntityId: mvpId,
    entities,
    logs,
  };
}
