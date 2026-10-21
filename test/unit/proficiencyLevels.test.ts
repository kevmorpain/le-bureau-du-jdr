import { describe, expect, it } from 'vitest'
import type { Effect } from '~~/server/db/schema/effects'
import { proficiencyLevels } from '~~/shared/rules/proficiencyLevels'
import { proficiencyOverrideDeleteSchema, proficiencyOverrideSchema } from '~~/shared/utils/proficiency_overrides'

const proficient = (skill: string): Effect => ({ type: 'skill_proficiency', value: { skill } } as Effect)
const expertise = (skill: string): Effect => ({ type: 'skill_expertise', value: { skill } } as Effect)
const save = (ability: string): Effect => ({ type: 'saving_throw_proficiency', value: { ability } } as Effect)
const override = (proficiencyType: string, value: string, action: string) => ({ proficiencyType, value, action })

describe('proficiencyLevels', () => {
  it('lit les compétences, l\'expertise et les jets de sauvegarde dérivés', () => {
    const levels = proficiencyLevels([proficient('stealth'), expertise('stealth'), proficient('arcana'), save('dex')], [])
    expect(Object.fromEntries(levels)).toEqual({ stealth: 'expert', arcana: 'proficient', dex_save: 'proficient' })
  })

  it('un ajout manuel élève sans jamais abaisser', () => {
    const levels = proficiencyLevels([expertise('stealth')], [
      override('skill', 'stealth', 'grant'),
      override('skill', 'insight', 'expertise'),
      override('saving_throw', 'wis', 'grant'),
    ])
    expect(Object.fromEntries(levels)).toEqual({ stealth: 'expert', insight: 'expert', wis_save: 'proficient' })
  })

  it('un retrait manuel l\'emporte sur ce que les règles accordent', () => {
    const levels = proficiencyLevels([proficient('arcana'), save('int')], [
      override('skill', 'arcana', 'revoke'),
      override('saving_throw', 'int', 'revoke'),
    ])
    expect(levels.size).toBe(0)
  })

  it('ignore les ajouts d\'autres types de maîtrise', () => {
    expect(proficiencyLevels([], [override('tool', 'Luth', 'grant'), override('weapon', 'longsword', 'grant')]).size).toBe(0)
  })
})

describe('schéma des ajouts manuels', () => {
  it('valide la valeur selon le type : compétence, caractéristique, ou texte libre', () => {
    expect(proficiencyOverrideSchema.safeParse(override('skill', 'sleight_of_hand', 'expertise')).success).toBe(true)
    expect(proficiencyOverrideSchema.safeParse(override('skill', 'sleightOfHand', 'grant')).success).toBe(false)
    expect(proficiencyOverrideSchema.safeParse(override('saving_throw', 'cha', 'grant')).success).toBe(true)
    expect(proficiencyOverrideSchema.safeParse(override('saving_throw', 'cha_save', 'grant')).success).toBe(false)
    expect(proficiencyOverrideSchema.safeParse(override('tool', 'Outils de voleur', 'revoke')).success).toBe(true)
  })

  it('l\'expertise ne vaut que pour les compétences et les jets de sauvegarde', () => {
    expect(proficiencyOverrideSchema.safeParse(override('tool', 'Luth', 'expertise')).success).toBe(false)
  })

  it('la suppression vise un type connu', () => {
    expect(proficiencyOverrideDeleteSchema.safeParse({ proficiencyType: 'skill', value: 'arcana' }).success).toBe(true)
    expect(proficiencyOverrideDeleteSchema.safeParse({ proficiencyType: 'feat', value: 'x' }).success).toBe(false)
  })
})
