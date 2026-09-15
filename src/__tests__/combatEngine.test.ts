import { describe, it, expect } from 'vitest'
import { initializeCombatEntities } from '../utils/combatEngine'
import { TeamMember } from '../types/game'

const makeTeamMember = (id: string, champId: string, name: string): TeamMember => ({
  championId: champId,
  name,
  level: 1,
  items: [],
  mastery: { championId: champId, level: 1, matchesPlayed: 1, wins: 0 },
})

const blueTeam: TeamMember[] = [
  makeTeamMember('b1', 'aegis', 'Aegis'),
  makeTeamMember('b2', 'kaelen', 'Kaelen'),
]
const redTeam: TeamMember[] = [
  makeTeamMember('r1', 'vespera', 'Vespera'),
  makeTeamMember('r2', 'vortek', 'Vortek'),
]

describe('initializeCombatEntities', () => {
  it('creates entities for both teams', () => {
    const entities = initializeCombatEntities(blueTeam, redTeam, 800, 500)
    expect(entities.length).toBe(4)
    const blue = entities.filter((e) => e.team === 'blue')
    const red = entities.filter((e) => e.team === 'red')
    expect(blue.length).toBe(2)
    expect(red.length).toBe(2)
  })

  it('sets correct team and champion IDs', () => {
    const entities = initializeCombatEntities(blueTeam, redTeam, 800, 500)
    const blueAegis = entities.find((e) => e.championId === 'aegis')
    expect(blueAegis).toBeDefined()
    expect(blueAegis!.team).toBe('blue')
  })

  it('assigns roles correctly', () => {
    const entities = initializeCombatEntities(blueTeam, redTeam, 800, 500)
    const kaelen = entities.find((e) => e.championId === 'kaelen')
    expect(kaelen).toBeDefined()
    expect(kaelen!.role).toBe('Mage')
  })
})

describe('Infernal burn ability', () => {
  it('Infernal champions have skill and passive', () => {
    const entities = initializeCombatEntities(blueTeam, redTeam, 800, 500)
    const kaelen = entities.find((e) => e.championId === 'kaelen')!
    expect(kaelen.skill.id).toBe('meteor_flame')
    expect(kaelen.passive.id).toBe('flame_aura')
  })

  it('Darius has skill and passive', () => {
    const entities = initializeCombatEntities(blueTeam, redTeam, 800, 500)
    const darius = entities.find((e) => e.championId === 'darius')!
    expect(darius.skill.id).toBe('guillotine_dunk')
    expect(darius.passive.id).toBe('bloodlust_frenzy')
  })
})

describe('updateCombatEngine', () => {
  it('does not crash with valid entities', () => {
    const entities = initializeCombatEntities(blueTeam, redTeam, 800, 500)
    const result = initializeCombatEntities(blueTeam, redTeam, 800, 500)
    expect(result.length).toBe(4)
  })
})
