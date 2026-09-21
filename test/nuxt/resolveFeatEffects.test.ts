import { describe, it, expect } from 'vitest'
import type { Effect } from '../../server/db/schema/effects'
import { resolveFeatEffects } from '../../app/composables/useCharacterSheet'
import { blankFixture, mountAbilities, type AbilitiesFixture } from './fixtures/characters'

// Résolution des effets « à choix » d'un don. Cas de référence : Résilient (PHB 2014) — +1 dans une
// caractéristique ET maîtrise du jet de sauvegarde correspondant : les deux effets suivent LE MÊME
// choix, stocké dans `character_features.choices.ability`.

const resilient: Effect[] = [
  { type: 'ability_increase_choice', value: { count: 1, amount: 1 } },
  { type: 'saving_throw_proficiency_choice', value: { count: 1, from: 'all' } },
]

describe('resolveFeatEffects — don Résilient', () => {
  it('résout le +1 ET la maîtrise de JS sur la caractéristique choisie', () => {
    expect(resolveFeatEffects(resilient, { ability: 'con' })).toEqual([
      { type: 'ability_increase', value: { ability: 'con', amount: 1 } },
      { type: 'saving_throw_proficiency', value: { ability: 'con' } },
    ])
  })

  it('n\'accorde rien tant que la caractéristique n\'est pas choisie', () => {
    expect(resolveFeatEffects(resilient, null)).toEqual([])
    expect(resolveFeatEffects(resilient, {})).toEqual([])
  })

  it('ne résout pas un choix multiple : `choices.ability` n\'en porte qu\'un', () => {
    // `count > 1` attend le modèle `character_choices` (rules-engine.md §4).
    const twoSaves: Effect[] = [{ type: 'saving_throw_proficiency_choice', value: { count: 2 } }]
    expect(resolveFeatEffects(twoSaves, { ability: 'con' })).toEqual([])
  })
})

describe('resolveFeatEffects — effets sans choix', () => {
  it('les laisse passer inchangés (Vigilant : initiative +5)', () => {
    const alert: Effect[] = [
      { type: 'initiative_bonus', value: { amount: 5 } },
      { type: 'other', value: { kind: 'cannot_be_surprised_while_conscious' } },
    ]
    expect(resolveFeatEffects(alert, null)).toEqual(alert)
  })

  it('un saving_throw_proficiency déjà résolu passe tel quel', () => {
    const granted: Effect[] = [{ type: 'saving_throw_proficiency', value: { ability: 'wis' } }]
    expect(resolveFeatEffects(granted, null)).toEqual(granted)
  })
})

// Don Doué (« Skilled », PHB 2014) : 3 maîtrises au choix, compétences OU outils dans n'importe quelle
// combinaison. Marqueur `other:{kind:'skilled_choice'}` → une maîtrise par entrée de `choices.skills`/`tools`.
const skilled: Effect[] = [{ type: 'other', value: { kind: 'skilled_choice' } }]

describe('resolveFeatEffects — don Doué', () => {
  it('résout les compétences en skill_proficiency et les outils en tool_proficiency', () => {
    expect(resolveFeatEffects(skilled, { skills: ['perception', 'stealth'], tools: ['Outils de voleur'] })).toEqual([
      { type: 'skill_proficiency', value: { skill: 'perception' } },
      { type: 'skill_proficiency', value: { skill: 'stealth' } },
      { type: 'tool_proficiency', value: 'Outils de voleur' },
    ])
  })

  it('n\'accorde rien tant qu\'aucune maîtrise n\'est choisie', () => {
    expect(resolveFeatEffects(skilled, null)).toEqual([])
    expect(resolveFeatEffects(skilled, {})).toEqual([])
    expect(resolveFeatEffects(skilled, { skills: [], tools: [] })).toEqual([])
  })
})

describe('resolveFeatEffects → useCharacterAbilities (bout en bout)', () => {
  it('Doué : les 3 compétences choisies deviennent maîtrisées', () => {
    const { getEffectiveProficiency } = mountAbilities({
      ...blankFixture,
      featureEffects: resolveFeatEffects(skilled, { skills: ['perception', 'stealth', 'sleight_of_hand'], tools: [] }),
    })
    expect(getEffectiveProficiency('perception')).toBe('proficient')
    expect(getEffectiveProficiency('stealth')).toBe('proficient')
    expect(getEffectiveProficiency('sleight_of_hand')).toBe('proficient')
    expect(getEffectiveProficiency('arcana')).toBe('none')
  })

  it('Résilient (Constitution) : +1 en CON et maîtrise du JS de Constitution', () => {
    const f: AbilitiesFixture = {
      ...blankFixture,
      baseAbilityScores: [{ abilityId: 'con', value: 13 }],
      featureEffects: resolveFeatEffects(resilient, { ability: 'con' }),
      proficiencyBonus: 3,
    }
    const { abilityScores, abilityModifiers, savingThrows } = mountAbilities(f)

    // 13 + 1 = 14 → modificateur +2.
    expect(abilityScores.value.con).toEqual({ base: 13, species: 0, feature: 1, asi: 0, bonus: 1, total: 14 })
    expect(abilityModifiers.value.con).toBe(2)
    expect(savingThrows.value.con).toEqual({ modifier: 5, proficiency: 'proficient' }) // 2 + 3
  })
})
