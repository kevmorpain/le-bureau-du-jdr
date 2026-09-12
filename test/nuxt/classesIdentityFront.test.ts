import { describe, it, expect } from 'vitest'
import { CLASSES } from '../../app/data/character-builder'
import { CLASS_IDENTITY } from '../fixtures/classIdentity'
import { resolveChoices, dueChoices, type Catalog } from '../../shared/rules/resolve'

// Faits d'identité de classe — côté FRONT.
//
// Deux faits d'identité pilotent le wizard : le NIVEAU d'accès à la sous-classe et le TYPE
// d'incantation. Depuis F2 tranche 3, le builder et le level-up lisent le niveau/les options de
// sous-classe DANS LE CATALOGUE (`/api/catalog/classes` + `/api/catalog/progressions` →
// `resolveChoices`) au lieu du blob `app/data/character-builder.ts` (les champs `subclassLevel`
// et `subclasses[]` en ont été retirés). Le TYPE d'incantation, lui, pilote encore les
// emplacements de sorts côté front depuis le blob (`spellcasting.type`) → il y reste verrouillé.
//
// Ce test suit donc les deux sources :
//   1. la DÉRIVATION catalogue-driven de la sous-classe (formule exacte des composables) doit
//      rendre le choix DÛ au bon niveau, avec les bonnes options, et le considérer satisfait une
//      fois le pick fait — le tout verrouillé contre `CLASS_IDENTITY` (la source de vérité) ;
//   2. la copie front du TYPE d'incantation ne doit pas diverger de la base.
// (Que la BASE porte bien `subclass_level == CLASS_IDENTITY` est verrouillé par
// `classesIdentity.test.ts` — seed + migration — et `subclassChoice.test.ts` — owner du choix.)
//
// Env `nuxt` : le blob importe l'alias `~~` (résolu par Nuxt Test Utils).

// ─── 1. Sous-classe : dérivation catalogue-driven (F2 tranche 3) ───────────────

// Projection mono-classe : un id de classe DB arbitraire, propriétaire du point de choix.
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

// ─── 2. Type d'incantation : copie front (emplacements de sorts front-driven) ──

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
