import { describe, it, expect } from 'vitest'
import {
  isOptionEligible,
  resolveChoices,
  type CharacterProjection,
  type Catalog,
  type ResolvedOption,
} from '../../shared/rules/resolve'

// ─────────────────────────────────────────────────────────────────────────────
// Contrat d'ÉLIGIBILITÉ des options (lot 5b — clôt la limite #1 de resolve.ts).
// Cas de vérité : les 4 prérequis d'invocation que `InvocationPicker.vue`
// `isSelectable()` applique aujourd'hui côté front (niveau propre, pacte, sort connu,
// invocation connue), + les prérequis de dons (minAbilityScore / armure / incantation).
// `resolveChoices` doit n'exposer QUE les options sélectionnables, pas l'appartenance brute.
// ─────────────────────────────────────────────────────────────────────────────

const OWNER_LEVEL = 5
const noState: CharacterProjection = { classLevels: {} }

describe('isOptionEligible — prérequis d\'invocation', () => {
  it('sans prérequis ni levelRequired : toujours éligible', () => {
    expect(isOptionEligible({ featureId: 1 }, OWNER_LEVEL, noState)).toBe(true)
  })

  it('levelRequired comparé au niveau de la classe PROPRIÉTAIRE', () => {
    expect(isOptionEligible({ featureId: 1, levelRequired: 7 }, 5, noState)).toBe(false)
    expect(isOptionEligible({ featureId: 1, levelRequired: 5 }, 5, noState)).toBe(true)
  })

  it('requiredPactBoon : éligible seulement si le pacte correspond', () => {
    const opt: ResolvedOption = { featureId: 1, prerequisites: { requiredPactBoon: 'blade' } }
    expect(isOptionEligible(opt, OWNER_LEVEL, { classLevels: {}, pactBoon: 'blade' })).toBe(true)
    expect(isOptionEligible(opt, OWNER_LEVEL, { classLevels: {}, pactBoon: 'tome' })).toBe(false)
    expect(isOptionEligible(opt, OWNER_LEVEL, { classLevels: {}, pactBoon: null })).toBe(false)
  })

  it('requiredSpellName : éligible seulement si le sort est connu', () => {
    const opt: ResolvedOption = { featureId: 1, prerequisites: { requiredSpellName: 'Décharge occulte' } }
    expect(isOptionEligible(opt, OWNER_LEVEL, { classLevels: {}, knownSpellNames: ['Décharge occulte'] })).toBe(true)
    expect(isOptionEligible(opt, OWNER_LEVEL, { classLevels: {}, knownSpellNames: [] })).toBe(false)
  })

  it('requiredInvocationName : éligible seulement si l\'invocation requise est connue', () => {
    const opt: ResolvedOption = { featureId: 1, prerequisites: { requiredInvocationName: 'Regard de deux esprits' } }
    expect(isOptionEligible(opt, OWNER_LEVEL, { classLevels: {}, knownInvocationNames: ['Regard de deux esprits'] })).toBe(true)
    expect(isOptionEligible(opt, OWNER_LEVEL, { classLevels: {}, knownInvocationNames: [] })).toBe(false)
  })
})

describe('isOptionEligible — prérequis de dons', () => {
  it('minAbilityScore : au moins une des caractéristiques atteint le seuil', () => {
    const opt: ResolvedOption = { featureId: 1, prerequisites: { minAbilityScore: { abilities: ['int', 'wis'], score: 13 } } }
    expect(isOptionEligible(opt, 1, { classLevels: {}, abilityScores: { wis: 13 } })).toBe(true)
    expect(isOptionEligible(opt, 1, { classLevels: {}, abilityScores: { int: 12, wis: 12 } })).toBe(false)
    expect(isOptionEligible(opt, 1, noState)).toBe(false)
  })

  it('requiredArmorProficiency', () => {
    const opt: ResolvedOption = { featureId: 1, prerequisites: { requiredArmorProficiency: 'heavy' } }
    expect(isOptionEligible(opt, 1, { classLevels: {}, armorProficiencies: ['light', 'medium', 'heavy'] })).toBe(true)
    expect(isOptionEligible(opt, 1, { classLevels: {}, armorProficiencies: ['medium'] })).toBe(false)
  })

  it('requiresSpellcasting', () => {
    const opt: ResolvedOption = { featureId: 1, prerequisites: { requiresSpellcasting: true } }
    expect(isOptionEligible(opt, 1, { classLevels: {}, hasSpellcasting: true })).toBe(true)
    expect(isOptionEligible(opt, 1, { classLevels: {}, hasSpellcasting: false })).toBe(false)
  })
})

// ── resolveChoices n'expose que les options ÉLIGIBLES ──────────────────────────

const WARLOCK = 1

function invocationCatalog(options: ResolvedOption[]): Catalog {
  return {
    progressions: [{
      progressionId: 1,
      ownerClassId: WARLOCK,
      ownerLevelRequired: 2,
      kind: 'invocations',
      count: { op: 'fixed', value: 3 },
      optionSource: { type: 'feature_group', group: 'invocation' },
      replaceable: true,
      options,
    }],
  }
}

describe('resolveChoices — filtrage d\'éligibilité des options', () => {
  it('n\'expose que les invocations sélectionnables (niveau + pacte), pas l\'appartenance brute', () => {
    const options: ResolvedOption[] = [
      { featureId: 10 }, // toujours ok
      { featureId: 11, levelRequired: 7 }, // bloquée (occultiste niv. 5)
      { featureId: 12, prerequisites: { requiredPactBoon: 'blade' } }, // ok (pacte Lame)
      { featureId: 13, prerequisites: { requiredPactBoon: 'tome' } }, // bloquée (pas Tome)
    ]
    const projection: CharacterProjection = { classLevels: { [WARLOCK]: 5 }, pactBoon: 'blade' }
    const choice = resolveChoices(projection, invocationCatalog(options)).choices[0]!
    expect(choice.options.map(o => o.featureId)).toEqual([10, 12])
    // Le count/remaining ne dépendent PAS du filtre d'options.
    expect(choice.count).toBe(3)
    expect(choice.remaining).toBe(3)
  })
})

// ── Gating par sous-classe (ownerSubclassId) — clôt la limite #2 de resolve.ts ──

describe('resolveChoices — gating par sous-classe (ownerSubclassId)', () => {
  const catalog: Catalog = {
    progressions: [{
      progressionId: 1,
      ownerClassId: 5,
      ownerSubclassId: 42,
      ownerLevelRequired: 3,
      kind: 'metamagic',
      count: { op: 'fixed', value: 2 },
      optionSource: { type: 'feature_group', group: 'metamagic' },
      replaceable: false,
      options: [{ featureId: 1 }, { featureId: 2 }],
    }],
  }

  it('absent si le perso a la classe mais pas la sous-classe propriétaire', () => {
    expect(resolveChoices({ classLevels: { 5: 3 } }, catalog).choices).toEqual([])
  })

  it('présent dès que le perso possède la sous-classe', () => {
    expect(resolveChoices({ classLevels: { 5: 3 }, subclassIds: [42] }, catalog).choices).toHaveLength(1)
  })
})
