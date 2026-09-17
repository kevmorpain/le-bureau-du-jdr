import { describe, it, expect } from 'vitest'
import { CLASSES } from '../../app/data/character-builder'
import { CLASS_IDENTITY } from '../fixtures/classIdentity'
import { resolveChoices, dueChoices, type Catalog } from '../../shared/rules/resolve'

// Faits d'identité de classe, côté FRONT. Le niveau et les options de sous-classe viennent désormais
// du catalogue : on vérifie ici la dérivation par la formule EXACTE des composables, verrouillée
// contre `CLASS_IDENTITY`. Le TYPE d'incantation, lui, reste une copie front (emplacements de sorts
// front-driven) qui ne doit pas diverger de la base.

// 1. Sous-classe : dérivation catalogue-driven (F2 tranche 3)

const CLASS_DB_ID = 1

/** Catalogue minimal d'un choix de sous-classe débloqué à `subclassLevel`, avec ses options. */
function subclassCatalog(subclassLevel: number, subclassIds: number[]): Catalog {
  return {
    progressions: [{
      progressionId: 1,
      ownerClassId: CLASS_DB_ID,
      ownerLevelRequired: subclassLevel,
      kind: 'subclass',
      count: { op: 'fixed', value: 1 },
      optionSource: { type: 'subclasses' },
      replaceable: false,
      options: subclassIds.map(id => ({ subclassId: id })),
    }],
  }
}

// Formule EXACTE des composables (useCharacterBuilder / useLevelUp), miroir de needsPactBoon :
//   catalogChoices = resolveChoices({classLevels:{[id]: L}}, catalog).choices
//   needsSubclass  = catalogChoices.some(c => c.kind === 'subclass')
const choicesAt = (catalog: Catalog, level: number, picks: Array<{ progressionId: number }> = []) =>
  resolveChoices({ classLevels: { [CLASS_DB_ID]: level }, picks }, catalog).choices
const needsSubclassAt = (catalog: Catalog, level: number) =>
  choicesAt(catalog, level).some(c => c.kind === 'subclass')

describe('sous-classe — dérivation catalogue-driven (F2 tranche 3)', () => {
  for (const { builderId, subclassLevel } of CLASS_IDENTITY) {
    it(`${builderId} : le choix de sous-classe est dû À partir du niveau ${subclassLevel}, pas avant`, () => {
      const catalog = subclassCatalog(subclassLevel, [10, 11])
      for (let L = 1; L <= 20; L++) {
        expect(needsSubclassAt(catalog, L), `${builderId} niveau ${L}`).toBe(L >= subclassLevel)
      }
    })
  }

  it('au niveau d\'accès, les options résolues sont les sous-classes de la classe', () => {
    const catalog = subclassCatalog(3, [10, 11, 12])
    const sub = choicesAt(catalog, 3).find(c => c.kind === 'subclass')
    expect(sub).toBeDefined()
    expect(sub!.count).toBe(1)
    expect(sub!.options.map(o => o.subclassId).sort((a, b) => a! - b!)).toEqual([10, 11, 12])
  })

  it('pick déjà fait (présent en character_choices) → le choix n\'est plus dû', () => {
    // Tranche 2 : le serveur écrit le pick en `character_choices` ; `dueChoices` s'en sert
    // (via projection.picks) pour ne pas re-demander la sous-classe.
    const catalog = subclassCatalog(3, [10, 11])
    const notPicked = dueChoices({ choices: choicesAt(catalog, 3) })
    expect(notPicked.map(c => c.kind)).toContain('subclass')

    const picked = dueChoices({ choices: choicesAt(catalog, 3, [{ progressionId: 1 }]) })
    expect(picked.map(c => c.kind)).not.toContain('subclass')
  })
})

// 2. Type d'incantation : copie front (emplacements de sorts front-driven)

describe('type d\'incantation — copie du builder', () => {
  it('couvre exactement les 12 classes du contrat', () => {
    expect(CLASSES.map(c => c.id).sort()).toEqual(CLASS_IDENTITY.map(c => c.builderId).sort())
  })

  it('type d\'incantation identique à la base', () => {
    const byBuilderId = new Map(CLASSES.map(c => [c.id, c]))

    for (const expected of CLASS_IDENTITY) {
      const cls = byBuilderId.get(expected.builderId)
      expect(cls, `classe ${expected.builderId} absente du builder`).toBeDefined()
      // Côté front, « pas d'incantation » s'écrit `spellcasting: null`.
      expect(cls!.spellcasting?.type ?? 'none', expected.builderId).toBe(expected.spellcastingType)
    }
  })
})
