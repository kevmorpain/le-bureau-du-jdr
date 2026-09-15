import { describe, it, expect } from 'vitest'
import {
  BACKGROUNDS,
  EXTRA_LANGUAGE_OPTION,
  TOOL_CHOICE_MAP,
  chosenToolProficiencies,
  extraLanguagesFromToolChoices,
} from '../../app/data/character-builder'
import { backgroundsData } from '../../server/db/seeds/data/backgrounds'
import { fixedProficiencies } from '../../shared/rules/backgroundProficiencies'

// Choix d'outil « outils OU langue » (Marchand de guilde) : l'option langue ne doit jamais partir
// en maîtrise d'outil, et doit ouvrir un choix de langue supplémentaire.

const MERCHANT_CHOICE = 'Outils de navigateur ou langue au choix'

describe('choix d\'outil « outils de navigateur OU langue »', () => {
  it('propose les deux options', () => {
    expect(TOOL_CHOICE_MAP[MERCHANT_CHOICE]).toEqual(['Outils de navigateur', EXTRA_LANGUAGE_OPTION])
  })

  it('option outils → maîtrise d\'outil, aucune langue en plus', () => {
    const selected = { [MERCHANT_CHOICE]: 'Outils de navigateur' }
    expect(chosenToolProficiencies(selected)).toEqual(['Outils de navigateur'])
    expect(extraLanguagesFromToolChoices(selected)).toBe(0)
  })

  it('option langue → aucune maîtrise d\'outil, une langue en plus', () => {
    const selected = { [MERCHANT_CHOICE]: EXTRA_LANGUAGE_OPTION }
    expect(chosenToolProficiencies(selected)).toEqual([])
    expect(extraLanguagesFromToolChoices(selected)).toBe(1)
  })

  it('laisse passer les choix d\'outils ordinaires et ignore les vides', () => {
    const selected = { 'Un jeu au choix': 'Jeu de cartes', 'Outil d\'artisan au choix': '' }
    expect(chosenToolProficiencies(selected)).toEqual(['Jeu de cartes'])
    expect(extraLanguagesFromToolChoices(selected)).toBe(0)
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
