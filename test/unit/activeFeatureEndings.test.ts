import { describe, it, expect } from 'vitest'
import { endingWhenUnconscious, lapsingWithoutCombat, spellcastingBlockedBy, type OwnerClass, type ResourceFeature } from '../../shared/rules/classResources'
import { barbareFeatures } from '../../server/db/seeds/data/barbare'

// Rage : elle prend fin à l'inconscience, ou faute de combat depuis le tour précédent (sauf Rage persistante, niveau 15) ;
// tant qu'elle dure, on ne lance ni ne maintient de sort.

const BARBARIAN = 1
const WIZARD = 2
const rage = barbareFeatures.find(f => f.name === 'Rage')!
const reckless = barbareFeatures.find(f => f.name === 'Attaque téméraire')!

const feature = (id: number, def: { name: string, meta?: ResourceFeature['meta'], levelRequired?: number | null }, active: boolean): ResourceFeature => ({
  id, name: def.name, featureType: 'class_feature', classId: BARBARIAN, levelRequired: def.levelRequired ?? 1, meta: def.meta ?? null,
  maxUsesFormula: null, rechargeType: null, currentUses: 0, active, effects: [],
})
const features = (active: boolean) => [feature(1, rage, active), feature(2, reckless, active)]
const classes = (barbarianLevel: number): OwnerClass[] => [{ classId: BARBARIAN, level: barbarianLevel }]

describe('Rage — données du seed', () => {
  it('prend fin à l\'inconscience et faute de combat, jusqu\'au niveau 14, et interdit les sorts', () => {
    expect(rage.meta).toMatchObject({ endsWhenUnconscious: true, endsWithoutCombat: true, persistentFromClassLevel: 15, blocksSpellcasting: true })
  })
})

describe('Rage — fin à l\'inconscience', () => {
  it('une rage active y met fin ; une rage inactive, non ; une autre capacité active, non', () => {
    expect(endingWhenUnconscious(features(true), classes(5)).map(f => f.name)).toEqual(['Rage'])
    expect(endingWhenUnconscious(features(false), classes(5))).toEqual([])
  })

  it('même avec Rage persistante : seule l\'inconscience met fin à la rage', () => {
    expect(endingWhenUnconscious(features(true), classes(15)).map(f => f.name)).toEqual(['Rage'])
  })
})

describe('Rage — fin faute de combat', () => {
  it('sans Rage persistante : une rage active est à confirmer à chaque nouveau tour', () => {
    expect(lapsingWithoutCombat(features(true), classes(14)).map(f => f.name)).toEqual(['Rage'])
    expect(lapsingWithoutCombat(features(false), classes(14))).toEqual([])
  })

  it('Rage persistante (niveau 15 de barbare) : plus de question', () => {
    expect(lapsingWithoutCombat(features(true), classes(15))).toEqual([])
    expect(lapsingWithoutCombat(features(true), classes(20))).toEqual([])
  })

  it('en multiclasse, le palier est celui du barbare et non le niveau total', () => {
    const multiclass: OwnerClass[] = [{ classId: BARBARIAN, level: 8 }, { classId: WIZARD, level: 9 }]
    expect(lapsingWithoutCombat(features(true), multiclass).map(f => f.name)).toEqual(['Rage'])
  })

  it('une capacité au-dessus du niveau de sa classe ne produit rien', () => {
    expect(lapsingWithoutCombat([feature(1, { name: 'Rage', meta: rage.meta, levelRequired: 3 }, true)], classes(2))).toEqual([])
  })
})

describe('Rage — sorts interdits', () => {
  it('tant que la rage est active, elle est nommée comme ce qui interdit les sorts', () => {
    expect(spellcastingBlockedBy(features(true), classes(5))).toEqual(['Rage'])
    expect(spellcastingBlockedBy(features(false), classes(5))).toEqual([])
  })
})
