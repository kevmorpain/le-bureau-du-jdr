import { describe, it, expect } from 'vitest'
import { matchesSearch, normalizeSearch } from '../../shared/utils/search'

describe('recherche par nom', () => {
  it('ignore la casse et les accents', () => {
    expect(normalizeSearch('  Épée Longue ')).toBe('epee longue')
    expect(matchesSearch('Épée longue', 'EPEE')).toBe(true)
    expect(matchesSearch('Détection de la magie', 'detection')).toBe(true)
    expect(matchesSearch('Rayon de givre', 'rayon givre')).toBe(false)
  })

  it('trouve une partie du nom, pas seulement son début', () => {
    expect(matchesSearch('Boule de feu', 'feu')).toBe(true)
    expect(matchesSearch('Boule de feu', 'glace')).toBe(false)
  })

  it('une recherche vide ou blanche garde tout', () => {
    expect(matchesSearch('Dague', '')).toBe(true)
    expect(matchesSearch('Dague', '   ')).toBe(true)
  })
})
