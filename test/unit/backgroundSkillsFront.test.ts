import { describe, it, expect } from 'vitest'
import { BACKGROUNDS } from '../../app/data/character-builder'
import { backgroundsData } from '../../server/db/seeds/data/backgrounds'
import { fixedProficiencies } from '../../shared/rules/backgroundProficiencies'

// Le récapitulatif du builder lit les compétences d'historique dans le blob front ; la fiche les dérive
// du porteur seedé depuis `backgroundsData`. Les deux doivent coïncider, sinon récap ≠ fiche.

const seededBackgrounds = BACKGROUNDS.filter(bg => bg.id !== 'custom')
const sorted = (skills: string[]) => [...skills].sort()

describe('compétences d\'historique — blob front ≡ seed', () => {
  for (const bg of seededBackgrounds) {
    it(`${bg.name} : mêmes compétences fixes que le seed`, () => {
      const seed = backgroundsData.find(s => s.name === bg.dbName)
      expect(seed, `historique « ${bg.dbName} » absent du seed`).toBeDefined()
      expect(sorted(bg.skillProficiencies)).toEqual(sorted(fixedProficiencies(seed!.skillProficiencies ?? [])))
    })
  }
})
