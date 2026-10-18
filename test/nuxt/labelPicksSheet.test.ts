import { describe, it, expect } from 'vitest'
import { baseScores, classFeature, mountSheet } from './fixtures/mountSheet'

// Les ennemis jurés et les terrains choisis se lisent sous la capacité qui porte le choix.

const RANGER = 7
const ENEMY_FEATURE = 70
const TERRAIN_FEATURE = 71
const OTHER_FEATURE = 72

describe('Fiche — choix de libellé sous leur capacité', () => {
  it('chaque capacité porte ses choix, dans l\'ordre où ils ont été faits', async () => {
    const sheet = await mountSheet({
      scores: baseScores(10, 14, 12, 14),
      classes: [{ classId: RANGER, level: 6 }],
      features: [
        classFeature(ENEMY_FEATURE, 'Ennemi juré', RANGER, 1, []),
        classFeature(TERRAIN_FEATURE, 'Explorateur-né', RANGER, 1, []),
        classFeature(OTHER_FEATURE, 'Vigilance primitive', RANGER, 3, []),
      ],
      labelPicks: [
        { featureId: ENEMY_FEATURE, value: 'Dragons' },
        { featureId: TERRAIN_FEATURE, value: 'Forêt' },
        { featureId: ENEMY_FEATURE, value: 'Bêtes' },
      ],
    })

    const picksOf = (name: string) => sheet.allCharacterFeatures.value.find(f => f.name === name)?.picks
    expect(picksOf('Ennemi juré')).toEqual(['Dragons', 'Bêtes'])
    expect(picksOf('Explorateur-né')).toEqual(['Forêt'])
    expect(picksOf('Vigilance primitive')).toEqual([])
  })

  it('une fiche sans choix de libellé n\'affiche rien', async () => {
    const sheet = await mountSheet({
      scores: baseScores(10, 14, 12, 14),
      classes: [{ classId: RANGER, level: 1 }],
      features: [classFeature(ENEMY_FEATURE, 'Ennemi juré', RANGER, 1, [])],
    })

    expect(sheet.allCharacterFeatures.value.find(f => f.name === 'Ennemi juré')?.picks).toEqual([])
  })
})
