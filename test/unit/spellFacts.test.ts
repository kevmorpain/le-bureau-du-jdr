import { describe, it, expect } from 'vitest'
import { areaLabel, spellFacts } from '../../app/utils/spellFacts'

const base = { concentration: false, ritual: false }
const ctx = { abilityLabel: (a: string) => ({ dex: 'Dextérité', wis: 'Sagesse' } as Record<string, string>)[a] ?? a }

describe('areaLabel', () => {
  it('dit la dimension qui définit chaque forme', () => {
    expect(areaLabel({ shape: 'sphere', size: 6 })).toBe('Sphère de 6 m de rayon')
    expect(areaLabel({ shape: 'cone', size: 9 })).toBe('Cône de 9 m')
    expect(areaLabel({ shape: 'cube', size: 12 })).toBe('Cube de 12 m d\'arête')
    expect(areaLabel({ shape: 'square', size: 6 })).toBe('Carré de 6 m d\'arête')
    expect(areaLabel({ shape: 'emanation', size: 4.5 })).toBe('Émanation de 4,5 m de rayon')
    expect(areaLabel({ shape: 'cylinder', size: 3, height: 6 })).toBe('Cylindre de 3 m de rayon, 6 m de haut')
  })
})

describe('spellFacts', () => {
  it('Boule de feu : JdS avec le DD et la zone', () => {
    const facts = spellFacts({ ...base, dc: { ability: 'dex' }, areaOfEffect: { shape: 'sphere', size: 6 } }, { ...ctx, saveDc: 15 })
    expect(facts.map(f => f.label)).toEqual(['DD 15 · JdS de Dextérité', 'Sphère de 6 m de rayon'])
  })

  it('attaque à distance : bonus et rappel du désavantage à 1,50 m ; au corps à corps : pas de rappel', () => {
    const ranged = spellFacts({ ...base, attackType: 'ranged' }, { ...ctx, attackBonus: 7 })[0]!
    expect(ranged.label).toBe('Attaque de sort à distance (+7)')
    expect(ranged.hint).toContain('1,50 m')
    const melee = spellFacts({ ...base, attackType: 'melee' }, ctx)[0]!
    expect(melee.label).toBe('Attaque de sort au corps à corps')
    expect(melee.hint).toBeUndefined()
  })

  it('composante chiffrée et consommée : montant, unité, consommation et règle du focaliseur', () => {
    const [cost] = spellFacts({ ...base, materialCost: { amount: 100, unit: 'po', consumed: true } }, ctx)
    expect(cost!.label).toBe('Composante · 100 po min. · consommée')
    expect(cost!.hint).toContain('focaliseur')
    expect(spellFacts({ ...base, materialCost: { consumed: true } }, ctx)[0]!.label).toBe('Composante · consommée')
  })

  it('sans DD ni bonus calculés, n\'invente pas de chiffre', () => {
    expect(spellFacts({ ...base, dc: { ability: 'wis' } }, ctx)[0]!.label).toBe('JdS de Sagesse')
  })

  it('concentration et rituel en texte, un sort sans fait ne produit rien', () => {
    expect(spellFacts({ concentration: true, ritual: true }, ctx).map(f => f.label)).toEqual(['Concentration', 'Rituel'])
    expect(spellFacts(base, ctx)).toEqual([])
  })
})
