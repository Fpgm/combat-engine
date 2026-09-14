import { TeamMember, CombatEntity, Trait, Role } from '../types/game';
import { CHAMPIONS } from '../data/champions';
import { TRAIT_SYNERGIES, ROLE_SYNERGIES } from '../data/items';

export interface ActiveSynergy {
  id: string;
  type: 'trait' | 'role';
  key: Trait | Role;
  name: string;
  count: number;
  countRequired: number;
  description: string;
  isActive: boolean;
}

export function getRosterSynergies(roster: TeamMember[]): ActiveSynergy[] {
  const traitCounts: Record<string, number> = {};
  const roleCounts: Record<string, number> = {};

  roster.forEach((member) => {
    const champ = CHAMPIONS.find((c) => c.id === member.championId);
    if (champ) {
      traitCounts[champ.trait] = (traitCounts[champ.trait] || 0) + 1;
      roleCounts[champ.role] = (roleCounts[champ.role] || 0) + 1;
    }
  });

  const list: ActiveSynergy[] = [];

  // Traits
  Object.entries(TRAIT_SYNERGIES).forEach(([traitKey, synergy]) => {
    const count = traitCounts[traitKey] || 0;
    list.push({
      id: `trait_${traitKey}`,
      type: 'trait',
      key: traitKey as Trait,
      name: synergy.name,
      count,
      countRequired: synergy.countRequired,
      description: synergy.description,
      isActive: count >= synergy.countRequired,
    });
  });

  // Roles
  Object.entries(ROLE_SYNERGIES).forEach(([roleKey, synergy]) => {
    const count = roleCounts[roleKey] || 0;
    list.push({
      id: `role_${roleKey}`,
      type: 'role',
      key: roleKey as Role,
      name: synergy.name,
      count,
      countRequired: synergy.countRequired,
      description: synergy.description,
      isActive: count >= synergy.countRequired,
    });
  });

  return list;
}

export function getEntitySynergies(entities: CombatEntity[], team: 'blue' | 'red'): ActiveSynergy[] {
  const teamEntities = entities.filter((e) => e.team === team && e.currentHp > 0);
  const traitCounts: Record<string, number> = {};
  const roleCounts: Record<string, number> = {};

  teamEntities.forEach((entity) => {
    traitCounts[entity.trait] = (traitCounts[entity.trait] || 0) + 1;
    roleCounts[entity.role] = (roleCounts[entity.role] || 0) + 1;
  });

  const list: ActiveSynergy[] = [];

  Object.entries(TRAIT_SYNERGIES).forEach(([traitKey, synergy]) => {
    const count = traitCounts[traitKey] || 0;
    if (count > 0) {
      list.push({
        id: `trait_${traitKey}`,
        type: 'trait',
        key: traitKey as Trait,
        name: synergy.name,
        count,
        countRequired: synergy.countRequired,
        description: synergy.description,
        isActive: count >= synergy.countRequired,
      });
    }
  });

  Object.entries(ROLE_SYNERGIES).forEach(([roleKey, synergy]) => {
    const count = roleCounts[roleKey] || 0;
    if (count > 0) {
      list.push({
        id: `role_${roleKey}`,
        type: 'role',
        key: roleKey as Role,
        name: synergy.name,
        count,
        countRequired: synergy.countRequired,
        description: synergy.description,
        isActive: count >= synergy.countRequired,
      });
    }
  });

  return list;
}
