import { describe, it, expect } from 'vitest'
import { multiclassSkillGrant } from '../../shared/rules/multiclass'
import { SKILL_KEYS, type SkillKey } from '../../shared/rules/skills'
import type { Catalog, CatalogProgression } from '../../shared/rules/resolve'

const ROGUE = 4
const BARD = 6
const FIGHTER = 2
const ROGUE_LIST: SkillKey[] = ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight_of_hand', 'stealth']

const classSkillChoice = (progressionId: number, ownerClassId: number, count: number, from: SkillKey[]): CatalogProgression => ({
  progressionId,
  ownerClassId,
  ownerLevelRequired: 1,
  kind: 'skill',
  count: { op: 'fixed', value: count },
  optionSource: { type: 'skills', from },
  replaceable: false,
  options: from.map(value => ({ value })),
})

const catalog: Catalog = {
  progressions: [
    classSkillChoice(1, ROGUE, 4, ROGUE_LIST),
    // `from: 'all'` est développé par buildCatalog : le catalogue porte déjà les 18 options.
    classSkillChoice(2, BARD, 3, [...SKILL_KEYS]),
    classSkillChoice(3, FIGHTER, 2, ['acrobatics', 'athletics']),
  ],
}

describe('multiclassSkillGrant — compétences gagnées en rejoignant une classe (PHB 2014)', () => {
  it('Roublard : 1 compétence (pas les 4 du niveau 1), dans la liste de la classe', () => {
    expect(multiclassSkillGrant(ROGUE, 1, catalog)).toEqual({ count: 1, options: ROGUE_LIST })
  })

  it('Barde : 1 compétence au choix = toute sa liste (`all`)', () => {
    expect(multiclassSkillGrant(BARD, 1, catalog)).toEqual({ count: 1, options: [...SKILL_KEYS] })
  })

  it('classe sans compétence de multiclassage : rien, même si elle a une liste de classe', () => {
    expect(multiclassSkillGrant(FIGHTER, 0, catalog)).toEqual({ count: 0, options: [] })
  })

  it('ne lit que la liste de la classe rejointe', () => {
    expect(multiclassSkillGrant(ROGUE, 1, catalog).options).not.toContain('arcana')
  })

  it('progression `skill` non seedée : nombre dû, mais aucune option (le serveur refuse tout pick)', () => {
    expect(multiclassSkillGrant(ROGUE, 1, { progressions: [] })).toEqual({ count: 1, options: [] })
  })
})
