import { describe, it, expect } from 'vitest'
import { CLASSES } from '../../app/data/character-builder'
import { CLASS_IDENTITY } from '../fixtures/classIdentity'

// La table `classes` porte désormais le niveau de sous-classe et le type d'incantation
// (migration 0080). Le front garde sa copie dans `app/data/character-builder.ts`
// jusqu'à ce que le builder lise le catalogue via l'API (point 6 de la roadmap,
// dnd-5.5.md §3) — d'ici là, ce test interdit à la copie de diverger de la base.
// Quand le builder lira la classe depuis l'API, ce test disparaîtra avec la copie.

describe('faits d\'identité de classe — copie du builder', () => {
  it('couvre exactement les 12 classes du contrat', () => {
    expect(CLASSES.map(c => c.id).sort()).toEqual(CLASS_IDENTITY.map(c => c.builderId).sort())
  })

  it('niveau de sous-classe et type d\'incantation identiques à la base', () => {
    const byBuilderId = new Map(CLASSES.map(c => [c.id, c]))

    for (const expected of CLASS_IDENTITY) {
      const cls = byBuilderId.get(expected.builderId)
      expect(cls, `classe ${expected.builderId} absente du builder`).toBeDefined()
      expect({
        dbName: cls!.dbName,
        subclassLevel: cls!.subclassLevel,
        // Côté front, « pas d'incantation » s'écrit `spellcasting: null`.
        spellcastingType: cls!.spellcasting?.type ?? 'none',
      }, expected.builderId).toEqual({
        dbName: expected.dbName,
        subclassLevel: expected.subclassLevel,
        spellcastingType: expected.spellcastingType,
      })
    }
  })
})
