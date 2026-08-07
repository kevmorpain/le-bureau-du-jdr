import { describe, it, expect } from 'vitest'
import { resolveChoices, dueChoices, type Catalog, type CatalogProgression } from '../../shared/rules/resolve'

// Lot 2 du chantier lignée (D17) : `resolveChoices` doit OFFRIR le choix de lignée, possédé
// par une ESPÈCE (pas une classe). Gating = possession de l'espèce (pas un niveau de classe),
// dispo dès la création. On teste la généralisation additive de l'owner (le chemin classe
// reste couvert par eligibility.test / resolveCatalog).

const ELF = 3

/** Catalogue minimal : un choix de lignée possédé par l'espèce Elfe, 3 lignées en options. */
function elfLineageCatalog(): Catalog {
  return {
    progressions: [{
      progressionId: 1,
      ownerFeatureId: 500,
      ownerSpeciesId: ELF,
      ownerLevelRequired: 1,
      kind: 'lineage',
      count: { op: 'fixed', value: 1 },
      optionSource: { type: 'lineages' },
      replaceable: false,
      options: [{ lineageId: 10 }, { lineageId: 11 }, { lineageId: 12 }],
    }],
  }
}

describe('resolveChoices — choix de lignée (owner = espèce, D17)', () => {
  it('offre 1 choix parmi les 3 lignées quand le perso a l\'espèce', () => {
    const { choices } = resolveChoices({ classLevels: { 1: 1 }, speciesId: ELF }, elfLineageCatalog())
    expect(choices).toHaveLength(1)
    const c = choices[0]!
    expect(c.kind).toBe('lineage')
    expect(c.ownerSpeciesId).toBe(ELF)
    expect(c.ownerClassId).toBeUndefined()
    expect(c.count).toBe(1)
    expect(c.remaining).toBe(1)
    expect(c.options.map(o => o.lineageId)).toEqual([10, 11, 12])
  })

  it('ne propose rien si le perso a une autre espèce (gating owner)', () => {
    const { choices } = resolveChoices({ classLevels: { 1: 1 }, speciesId: 999 }, elfLineageCatalog())
    expect(choices).toHaveLength(0)
  })

  it('ne propose rien si l\'espèce n\'est pas renseignée', () => {
    const { choices } = resolveChoices({ classLevels: { 1: 1 } }, elfLineageCatalog())
    expect(choices).toHaveLength(0)
  })

  it('remaining tombe à 0 une fois la lignée choisie', () => {
    const { choices } = resolveChoices(
      { classLevels: { 1: 1 }, speciesId: ELF, picks: [{ progressionId: 1 }] },
      elfLineageCatalog(),
    )
    expect(choices[0]!.remaining).toBe(0)
    expect(dueChoices({ choices })).toHaveLength(0)
  })

  it('un owner classe et un owner espèce cohabitent dans le même catalogue', () => {
    const classProg: CatalogProgression = {
      progressionId: 2,
      ownerClassId: 1,
      ownerLevelRequired: 3,
      kind: 'subclass',
      count: { op: 'fixed', value: 1 },
      optionSource: { type: 'subclasses' },
      replaceable: false,
      options: [{ subclassId: 50 }],
    }
    const catalog: Catalog = { progressions: [...elfLineageCatalog().progressions, classProg] }

    // Elfe niv.3 de classe 1 → les DEUX choix sont dus (lignée + sous-classe).
    const both = resolveChoices({ classLevels: { 1: 3 }, speciesId: ELF }, catalog)
    expect(both.choices.map(c => c.kind).sort()).toEqual(['lineage', 'subclass'])

    // Même classe mais niv.2 → sous-classe pas encore débloquée (niv.3), lignée toujours dispo.
    const lvl2 = resolveChoices({ classLevels: { 1: 2 }, speciesId: ELF }, catalog)
    expect(lvl2.choices.map(c => c.kind)).toEqual(['lineage'])
  })
})
