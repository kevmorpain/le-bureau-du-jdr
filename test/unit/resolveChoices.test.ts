import { describe, it, expect } from 'vitest'
import { resolveChoices, dueChoices, type CharacterProjection } from '../../shared/rules/resolve'
import {
  warlockCatalog,
  expertiseCatalog,
  WARLOCK_CLASS_ID,
  EXPERTISE_CLASS_ID,
} from '../fixtures/resolveCatalog'

// ─────────────────────────────────────────────────────────────────────────────
// Contrat de résolution des CHOIX (cf. decisions.md D12, rules-engine.md §5).
// Cas de vérité : l'Occultiste seedé au lot 4c — pacte (1 parmi 3) au niveau 3,
// manifestations occultes (table par niveau, échangeables) au niveau 2, arcanums
// mystiques (1 sort) aux niveaux 11/13/15/17. Valeurs PHB FR 2014 vérifiées à la main.
// ─────────────────────────────────────────────────────────────────────────────

const catalog = warlockCatalog()
const INVOCATIONS_PROG_ID = catalog.progressions.find(p => p.kind === 'invocations')!.progressionId

function warlockAt(level: number, extra: Partial<CharacterProjection> = {}): CharacterProjection {
  return { classLevels: { [WARLOCK_CLASS_ID]: level }, ...extra }
}

function invocationsChoiceAt(level: number, extra?: Partial<CharacterProjection>) {
  return resolveChoices(warlockAt(level, extra), catalog).choices.find(c => c.kind === 'invocations')
}

describe('resolveChoices — Occultiste, gating par niveau', () => {
  it('n\'ouvre aucun choix au niveau 1 (pacte L3, manifestations L2, arcanums L11+)', () => {
    const result = resolveChoices(warlockAt(1), catalog)
    expect(result.choices).toEqual([])
    expect(dueChoices(result)).toEqual([])
  })

  it('niveau 2 : ouvre les manifestations (2 parmi 41, échangeables), pas encore le pacte', () => {
    const { choices } = resolveChoices(warlockAt(2), catalog)
    expect(choices.find(c => c.kind === 'pact_boon')).toBeUndefined()

    const invocations = choices.find(c => c.kind === 'invocations')!
    expect(invocations.count).toBe(2)
    expect(invocations.made).toBe(0)
    expect(invocations.remaining).toBe(2)
    expect(invocations.options).toHaveLength(41)
    expect(invocations.replaceable).toBe(true)
  })

  it('niveau 3 : ouvre la faveur de pacte (1 parmi 3, non échangeable)', () => {
    const { choices } = resolveChoices(warlockAt(3), catalog)
    const pact = choices.find(c => c.kind === 'pact_boon')!
    expect(pact.count).toBe(1)
    expect(pact.remaining).toBe(1)
    expect(pact.options).toHaveLength(3)
    expect(pact.replaceable).toBe(false)

    // Les manifestations restent à 2 au niveau 3 (table INVOCATIONS_KNOWN).
    expect(invocationsChoiceAt(3)!.count).toBe(2)
  })

  it('niveau 5 : le nombre de manifestations passe à 3', () => {
    expect(invocationsChoiceAt(5)!.count).toBe(3)
  })

  it('niveau 11 : ouvre l\'arcanum de niveau 6 seulement (pas 7/8/9) ; 5 manifestations', () => {
    const { choices } = resolveChoices(warlockAt(11), catalog)
    const spellChoices = choices.filter(c => c.kind === 'spell')
    expect(spellChoices).toHaveLength(1)
    expect(spellChoices[0]!.ownerLevelRequired).toBe(11)
    expect(spellChoices[0]!.count).toBe(1)
    expect(spellChoices[0]!.options.length).toBeGreaterThan(0)

    expect(invocationsChoiceAt(11)!.count).toBe(5)
  })
})

describe('resolveChoices — multiclasse (count au niveau de la classe propriétaire)', () => {
  it('Occultiste 5 / Guerrier 3 : 3 manifestations (niveau d\'occultiste), pas 4 (niveau total 8)', () => {
    const projection: CharacterProjection = {
      classLevels: { [WARLOCK_CLASS_ID]: 5, 2: 3 },
    }
    const invocations = resolveChoices(projection, catalog).choices.find(c => c.kind === 'invocations')!
    // Niveau d'occultiste 5 → 3 invocations ; le total 8 en donnerait 4 (piège multiclasse).
    expect(invocations.classLevel).toBe(5)
    expect(invocations.count).toBe(3)
  })
})

describe('resolveChoices — picks déjà faits', () => {
  it('déduit les picks enregistrés du restant (`remaining = count - made`)', () => {
    const invocations = invocationsChoiceAt(5, { picks: [{ progressionId: INVOCATIONS_PROG_ID }] })!
    expect(invocations.count).toBe(3)
    expect(invocations.made).toBe(1)
    expect(invocations.remaining).toBe(2)
  })

  it('un choix `replaceable` complété sort des « choix dus » mais reste dans le résultat', () => {
    const picks = Array.from({ length: 3 }, () => ({ progressionId: INVOCATIONS_PROG_ID }))
    const result = resolveChoices(warlockAt(5, { picks }), catalog)

    const invocations = result.choices.find(c => c.kind === 'invocations')!
    expect(invocations.remaining).toBe(0)
    expect(invocations.replaceable).toBe(true)
    // Plus « dû » (remaining 0) mais toujours listé (pour l'échange au level-up).
    expect(dueChoices(result).some(c => c.kind === 'invocations')).toBe(false)
    expect(result.choices.some(c => c.kind === 'invocations')).toBe(true)
  })
})

describe('resolveChoices — proficient_skills résolu live', () => {
  it('l\'expertise propose les compétences DÉJÀ maîtrisées (non pré-résolu par le catalogue)', () => {
    const expertise = expertiseCatalog()
    // Le catalogue ne porte AUCUNE option pour ce point de choix : elles viennent du perso.
    expect(expertise.progressions[0]!.options).toBeUndefined()

    const projection: CharacterProjection = {
      classLevels: { [EXPERTISE_CLASS_ID]: 1 },
      proficientSkills: ['stealth', 'perception'],
    }
    const { choices } = resolveChoices(projection, expertise)
    const choice = choices.find(c => c.kind === 'expertise')!
    expect(choice.count).toBe(2)
    expect(choice.options).toEqual([{ value: 'stealth' }, { value: 'perception' }])
  })

  it('sans compétence maîtrisée, l\'expertise n\'offre aucune option', () => {
    const projection: CharacterProjection = {
      classLevels: { [EXPERTISE_CLASS_ID]: 1 },
      proficientSkills: [],
    }
    const choice = resolveChoices(projection, expertiseCatalog()).choices.find(c => c.kind === 'expertise')!
    expect(choice.options).toEqual([])
  })
})
