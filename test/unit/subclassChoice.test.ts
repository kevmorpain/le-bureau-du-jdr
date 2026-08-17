import { describe, it, expect } from 'vitest'
import { subclassChoiceFeature, SUBCLASS_CHOICE_FEATURE_NAMES } from '../../server/db/seeds/data/subclassChoice'
import { CLASS_IDENTITY } from '../fixtures/classIdentity'

// ─────────────────────────────────────────────────────────────────────────────
// Contrat du point de choix de SOUS-CLASSE (F2, « décision → progression »). Comme
// classesIdentity.test.ts pour l'identité, on VERROUILLE la source de données (le helper
// `subclassChoiceFeature`) contre le contrat unique `CLASS_IDENTITY` : chaque classe doit poser
// UNE progression `kind:'subclass'` sur une feature owner, AU MÊME niveau que `classes.subclass_level`.
// Un désalignement (niveau recopié à la main qui dérive, classe oubliée) casse ici.
//
// Env `unit` : le helper n'a aucune dépendance runtime `hub:db` (import de type seul).
// ─────────────────────────────────────────────────────────────────────────────

describe('subclassChoiceFeature — contrat de sous-classe', () => {
  it('couvre EXACTEMENT les 12 classes du contrat (aucune oubliée, aucune en trop)', () => {
    expect(Object.keys(SUBCLASS_CHOICE_FEATURE_NAMES).sort())
      .toEqual(CLASS_IDENTITY.map(c => c.dbName).sort())
  })

  for (const { dbName, subclassLevel } of CLASS_IDENTITY) {
    it(`${dbName} : owner à niv ${subclassLevel} + progression subclass bien formée`, () => {
      const f = subclassChoiceFeature(dbName)

      // Niveau = source unique `classes.subclass_level` (jamais recopié) → doit matcher le contrat.
      expect(f.levelRequired, `${dbName} : niveau d'accès à la sous-classe`).toBe(subclassLevel)
      expect(f.featureType).toBe('class_feature')
      expect(f.name).toBe(SUBCLASS_CHOICE_FEATURE_NAMES[dbName])

      // Progression = décision « quelle sous-classe » : une, parmi les sous-classes de la classe.
      expect(f.progression).toEqual({
        kind: 'subclass',
        count: { op: 'fixed', value: 1 },
        optionSource: { type: 'subclasses' },
        replaceable: false,
      })
    })
  }

  it('classe inconnue → throw fail-fast (plutôt que seeder un orphelin)', () => {
    expect(() => subclassChoiceFeature('Artificier')).toThrow(/classe absente/i)
  })
})
