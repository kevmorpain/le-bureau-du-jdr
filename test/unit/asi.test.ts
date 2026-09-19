import { describe, it, expect } from 'vitest'
import { asiLevels, ASI_LEVELS_BY_CLASS, ASI_FEATURE_NAME, asiFeatures } from '../../server/db/seeds/data/asi'

describe('asi — contrat des données', () => {
  it('paliers PHB 2014 : défaut [4,8,12,16,19] ; Guerrier et Roublard en gagnent plus', () => {
    expect(ASI_LEVELS_BY_CLASS.Guerrier).toEqual([4, 6, 8, 12, 14, 16, 19])
    expect(ASI_LEVELS_BY_CLASS.Roublard).toEqual([4, 8, 10, 12, 16, 19])
    // Toute classe hors table → défaut.
    expect(asiLevels('Magicien')).toEqual([4, 8, 12, 16, 19])
    expect(asiLevels('Occultiste')).toEqual([4, 8, 12, 16, 19])
  })

  it('asiFeatures : une feature ASI par palier, porteuse de la progression asi_or_feat (count 1)', () => {
    for (const className of ['Magicien', 'Guerrier', 'Roublard']) {
      const feats = asiFeatures(className)
      expect(feats.map(f => f.levelRequired)).toEqual(asiLevels(className))
      for (const f of feats) {
        expect(f.name).toBe(ASI_FEATURE_NAME)
        expect(f.featureType).toBe('class_feature')
        expect(f.effects).toEqual([{ type: 'asi_or_feat', value: {} }])
        expect(f.progression).toMatchObject({
          kind: 'asi_or_feat',
          count: { op: 'fixed', value: 1 },
          replaceable: false,
        })
        expect(f.progression!.optionSource).toEqual({
          type: 'abilities',
          from: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
          distributions: ['2+1', '1+1+1'],
        })
      }
    }
    // Guerrier : 7 paliers ; Roublard : 6 ; classe par défaut : 5.
    expect(asiFeatures('Guerrier')).toHaveLength(7)
    expect(asiFeatures('Roublard')).toHaveLength(6)
    expect(asiFeatures('Magicien')).toHaveLength(5)
  })
})
