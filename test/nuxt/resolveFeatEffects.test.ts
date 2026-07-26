import { describe, it, expect } from 'vitest'
import type { Effect } from '../../server/db/schema/effects'
import { resolveFeatEffects } from '../../app/composables/useCharacterSheet'
import { blankFixture, mountAbilities, type AbilitiesFixture } from './fixtures/characters'

// ─────────────────────────────────────────────────────────────────────────────
// Contrat de résolution des effets « à choix » d'un don (cf. decisions.md D12).
//
// Cas de référence : **Résilient** (PHB 2014) — « choisissez une caractéristique :
// +1 dans celle-ci et vous gagnez la maîtrise des jets de sauvegarde correspondants ».
// Les deux effets seedés (server/db/seeds/data/feats.ts) suivent LE MÊME choix, stocké
// dans `character_features.choices.ability`.
// ─────────────────────────────────────────────────────────────────────────────

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

describe('resolveFeatEffects → useCharacterAbilities (bout en bout)', () => {
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
