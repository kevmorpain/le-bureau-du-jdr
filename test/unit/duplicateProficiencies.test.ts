import { describe, it, expect } from 'vitest'
import { duplicateCount, duplicatedValues, proficiencyDuplicates, replacementsDueAtLevelUp } from '../../shared/rules/duplicateProficiencies'
import type { ResolvedChoice } from '../../shared/rules/resolve'

// Historiques : une même maîtrise reçue de deux sources ouvre le choix d'une autre de même nature.

describe('maîtrises reçues en double', () => {
  it('Roublard Criminel : les outils de voleur viennent de la classe et de l\'historique', () => {
    expect(duplicatedValues(['Outils de voleur'], ['Jeu de cartes', 'Outils de voleur'])).toEqual(['Outils de voleur'])
    expect(duplicateCount(['Outils de voleur'], ['Jeu de cartes', 'Outils de voleur'])).toBe(1)
  })

  it('une maîtrise reçue de trois sources ouvre deux remplacements', () => {
    expect(duplicateCount(['a'], ['a'], ['a'])).toBe(2)
  })

  it('une source qui répète sa propre maîtrise ne crée pas de doublon', () => {
    expect(duplicateCount(['a', 'a'], ['b'])).toBe(0)
    expect(duplicatedValues(['a', 'a'], ['b'])).toEqual([])
  })
})

describe('doublons par source', () => {
  const none = { speciesSkills: [], backgroundSkills: [], classTools: [[]], backgroundTools: [] }

  it('chaque classe est une source : la classe rejointe double l\'historique', () => {
    expect(proficiencyDuplicates({ ...none, classTools: [[], ['Outils de voleur']], backgroundTools: ['Outils de voleur'] })).toEqual({ skills: 0, tools: 1 })
  })

  it('compétences d\'espèce ∩ d\'historique, outils de classe ∩ d\'historique', () => {
    expect(proficiencyDuplicates({ speciesSkills: ['intimidation'], backgroundSkills: ['intimidation'], classTools: [['a']], backgroundTools: ['a'] }))
      .toEqual({ skills: 1, tools: 1 })
  })
})

describe('remplacements dus au level-up', () => {
  const choice = (kind: 'skill' | 'tool', count: number, made = 0): ResolvedChoice => ({
    progressionId: kind === 'skill' ? 1 : 2,
    ownerLevelRequired: 1,
    kind,
    classLevel: 1,
    count,
    made,
    remaining: count - made,
    replaceable: false,
    optionSource: { type: 'tools' },
    options: [],
    global: true,
  })

  it('seul le surplus d\'après est demandé', () => {
    expect(replacementsDueAtLevelUp([choice('tool', 2)], { skills: 0, tools: 1 })).toEqual([expect.objectContaining({ count: 1, remaining: 1, made: 0 })])
  })

  it('un remplacement déjà enregistré compte comme un doublon d\'avant', () => {
    expect(replacementsDueAtLevelUp([choice('tool', 2, 1)], { skills: 0, tools: 1 })).toHaveLength(1)
    expect(replacementsDueAtLevelUp([choice('tool', 1, 1)], { skills: 0, tools: 1 })).toEqual([])
  })

  it('un doublon d\'avant non remplacé n\'est pas redemandé', () => {
    expect(replacementsDueAtLevelUp([choice('tool', 1)], { skills: 0, tools: 1 })).toEqual([])
  })

  it('compétences et outils se comptent chacun de leur côté', () => {
    expect(replacementsDueAtLevelUp([choice('skill', 1), choice('tool', 1)], { skills: 1, tools: 0 }).map(c => c.kind)).toEqual(['tool'])
  })
})
