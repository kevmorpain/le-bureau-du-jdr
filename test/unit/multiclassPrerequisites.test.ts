import { describe, it, expect } from 'vitest'
import { meetsMulticlassPrerequisites } from '../../shared/rules/multiclass'
import { CLASS_IDENTITY } from '../fixtures/classIdentity'

const prerequisitesOf = (dbName: string) => CLASS_IDENTITY.find(c => c.dbName === dbName)!.multiclassPrerequisites

describe('meetsMulticlassPrerequisites', () => {
  it('Guerrier : Force 13 OU Dextérité 13', () => {
    const fighter = prerequisitesOf('Guerrier')
    expect(meetsMulticlassPrerequisites(fighter, { str: 13, dex: 8 })).toBe(true)
    expect(meetsMulticlassPrerequisites(fighter, { str: 8, dex: 13 })).toBe(true)
    expect(meetsMulticlassPrerequisites(fighter, { str: 12, dex: 12 })).toBe(false)
  })

  it('Moine : Dextérité 13 ET Sagesse 13', () => {
    const monk = prerequisitesOf('Moine')
    expect(meetsMulticlassPrerequisites(monk, { dex: 13, wis: 13 })).toBe(true)
    expect(meetsMulticlassPrerequisites(monk, { dex: 16, wis: 12 })).toBe(false)
  })

  it('une caractéristique inconnue ne satisfait pas le minimum', () => {
    expect(meetsMulticlassPrerequisites(prerequisitesOf('Magicien'), {})).toBe(false)
  })

  it('aucun prérequis : toujours rempli', () => {
    expect(meetsMulticlassPrerequisites([], {})).toBe(true)
  })
})
