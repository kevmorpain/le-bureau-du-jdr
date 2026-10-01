import { describe, it, expect } from 'vitest'
import { BACKGROUNDS } from '../../app/data/character-builder'
import { backgroundsData } from '../../server/db/seeds/data/backgrounds'
import { backgroundChoices, fixedProficiencies } from '../../shared/rules/backgroundProficiencies'
import { TOOL_CATEGORIES } from '../../shared/rules/tools'

// Entrées « au choix » des historiques → points de choix. Marchand de guilde : outils de navigateur OU
// une langue (AideDD, Artisan de guilde, variante), en plus de sa langue au choix.

const MERCHANT_CHOICE = 'Outils de navigateur ou langue au choix'

describe('backgroundChoices — entrées « au choix » des historiques', () => {
  it('reconnaît chaque entrée « au choix » des historiques seedés', () => {
    for (const bg of backgroundsData) expect(() => backgroundChoices(bg), bg.name).not.toThrow()
  })

  it('Marchand de guilde : outils de navigateur ou une langue, plus une langue', () => {
    const merchant = backgroundsData.find(b => b.name === 'Marchand de guilde')!
    expect(backgroundChoices(merchant)).toEqual([
      { kind: 'tool', count: 1, optionSource: { type: 'tools', from: ['Outils de navigateur'], orLanguages: true } },
      { kind: 'language', count: 1, optionSource: { type: 'languages' } },
    ])
  })

  it('Artiste : un instrument de musique au choix', () => {
    const artiste = backgroundsData.find(b => b.name === 'Artiste')!
    expect(backgroundChoices(artiste)).toEqual([
      { kind: 'tool', count: 1, optionSource: { type: 'tools', from: TOOL_CATEGORIES['Instruments de musique'] } },
    ])
  })

  it('refuse une entrée « au choix » inconnue plutôt que de la perdre', () => {
    expect(() => backgroundChoices({ name: 'X', toolProficiencies: ['Arme au choix'] })).toThrow(/non reconnu/)
  })
})

describe('Marchand de guilde', () => {
  const blob = BACKGROUNDS.find(b => b.id === 'guild-merchant')!
  const artisan = BACKGROUNDS.find(b => b.id === 'guild-artisan')!
  const seed = backgroundsData.find(b => b.name === 'Marchand de guilde')!
  const seedArtisan = backgroundsData.find(b => b.name === 'Artisan de guilde')!

  it('existe côté builder et côté seed, résolu par nom', () => {
    expect(blob.dbName).toBe(seed.name)
  })

  it('ne diffère de l\'Artisan de guilde que par les outils et l\'équipement', () => {
    expect(blob.skillProficiencies).toEqual(artisan.skillProficiencies)
    expect(blob.languages).toBe(artisan.languages)
    expect(blob.featureName).toBe(artisan.featureName)
    expect(blob.suggestions).toBe(artisan.suggestions)
    expect(seed.skillProficiencies).toEqual(seedArtisan.skillProficiencies)
    expect(seed.languageProficiencies).toEqual(seedArtisan.languageProficiencies)
    expect(seed.featureName).toBe(seedArtisan.featureName)
    expect(seed.featureDescription).toBe(seedArtisan.featureDescription)
  })

  it('le choix d\'outil est un choix du joueur des deux côtés, jamais une maîtrise fixe dérivée', () => {
    expect(blob.toolProficiencies).toEqual([MERCHANT_CHOICE])
    expect(seed.toolProficiencies).toEqual([MERCHANT_CHOICE])
    expect(fixedProficiencies(seed.toolProficiencies)).toEqual([])
  })

  it('mule et charrette remplacent les outils d\'artisan', () => {
    expect(blob.equipment).toContain('Mule')
    expect(blob.equipment).toContain('Charrette')
    expect(blob.equipment).not.toContain('Outils d\'artisan')
  })
})

describe('historiques du builder ↔ seed', () => {
  it('chaque historique prédéfini du builder a sa ligne seedée (résolution par nom)', () => {
    const seeded = new Set(backgroundsData.map(b => b.name))
    for (const bg of BACKGROUNDS.filter(b => b.dbName)) {
      expect(seeded.has(bg.dbName!), bg.dbName!).toBe(true)
    }
  })
})
