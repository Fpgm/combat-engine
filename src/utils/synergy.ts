import { TeamMember } from '../types/game';

export interface ActiveSynergy {
  id: string;
  type: 'role';
  key: string;
  name: string;
  count: number;
  countRequired: number;
  description: string;
  isActive: boolean;
}

export function getRosterSynergies(roster: TeamMember[]): ActiveSynergy[] {
  return [];
}

export function getEntitySynergies(entities: TeamMember[], team: 'blue' | 'red'): ActiveSynergy[] {
  return [];
}
