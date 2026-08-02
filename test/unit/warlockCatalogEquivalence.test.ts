import { describe, it, expect } from 'vitest'
import { resolveChoices } from '../../shared/rules/resolve'
import { warlockCatalog, WARLOCK_CLASS_ID } from '../fixtures/resolveCatalog'

// ─────────────────────────────────────────────────────────────────────────────
// Contrat d'ÉQUIVALENCE (lot 6b) : la dérivation catalogue-driven que le front va adopter
// (builder + level-up lisent `/api/catalog/progressions` puis `resolveChoices`) doit rendre
// EXACTEMENT les mêmes valeurs que les tables Occultiste aujourd'hui codées en dur dans
// useCharacterBuilder / useLevelUp (WARLOCK_INVOCATIONS_KNOWN, ARCANUM_SPELL_LEVEL_BY_LEVEL,
// `classId==='warlock' && level>=3`). On verrouille l'équivalence sur les 20 niveaux avant de
// débrancher les tables — filet de sécurité en l'absence de vérif visuelle du wizard.
//
// La dérivation front (identique dans les deux composables) :
//   choicesAt(L)          = resolveChoices({classLevels:{[warlockId]: L}}, catalog).choices
//   needsPactBoon(L)      = choicesAt(L).some(c => c.kind === 'pact_boon')           // « unlocked » ⟺ L≥3
//   invocationsCount(L)   = choicesAt(L).find(c => c.kind === 'invocations')?.count ?? 0
//   arcanumSpellLevel(L)  = choicesAt(L).find(c => c.kind === 'spell' && c.ownerLevelRequired === L)
//                             .optionSource.maxLevel                                 // arcanum débloqué À ce niveau
// ─────────────────────────────────────────────────────────────────────────────

// Tables « golden » = copies EXACTES de celles aujourd'hui dans les composables front.
const WARLOCK_INVOCATIONS_KNOWN = [0, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8]
const ARCANUM_SPELL_LEVEL_BY_LEVEL: Record<number, number> = { 11: 6, 13: 7, 15: 8, 17: 9 }

const catalog = warlockCatalog()
const choicesAt = (level: number) =>
  resolveChoices({ classLevels: { [WARLOCK_CLASS_ID]: level } }, catalog).choices

describe('6b — équivalence catalogue-driven ⟺ tables Occultiste codées en dur', () => {
  it('needsPactBoon(L) == (L >= 3) pour L = 1..20', () => {
    for (let L = 1; L <= 20; L++) {
      const pactDue = choicesAt(L).some(c => c.kind === 'pact_boon')
      expect(pactDue, `niveau ${L}`).toBe(L >= 3)
    }
  })

  it('invocationsCount(L) == WARLOCK_INVOCATIONS_KNOWN[L-1] pour L = 1..20', () => {
    for (let L = 1; L <= 20; L++) {
      const count = choicesAt(L).find(c => c.kind === 'invocations')?.count ?? 0
      expect(count, `niveau ${L}`).toBe(WARLOCK_INVOCATIONS_KNOWN[L - 1])
    }
  })

  it('arcanumSpellLevel(L) == ARCANUM_SPELL_LEVEL_BY_LEVEL[L] (null hors 11/13/15/17) pour L = 1..20', () => {
    for (let L = 1; L <= 20; L++) {
      const spellChoice = choicesAt(L).find(c => c.kind === 'spell' && c.ownerLevelRequired === L)
      const maxLevel = spellChoice && spellChoice.optionSource.type === 'spells'
        ? spellChoice.optionSource.maxLevel ?? null
        : null
      expect(maxLevel, `niveau ${L}`).toBe(ARCANUM_SPELL_LEVEL_BY_LEVEL[L] ?? null)
    }
  })
})
