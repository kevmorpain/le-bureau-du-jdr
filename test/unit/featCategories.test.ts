import { describe, it, expect } from 'vitest'
import { FEAT_CATEGORIES, featCategoryEnum } from '../../shared/rules/featCategories'

// C2 — la catégorie de don a une source de vérité unique (la const), dont la colonne
// `features.feat_category` et le Zod dérivent (contrat D6, comme featureTags / ruleset).

describe('featCategories — const canonique', () => {
  it('l\'ensemble et l\'ordre du contrat 2024', () => {
    expect([...FEAT_CATEGORIES]).toEqual(['origin', 'general', 'fighting_style', 'epic_boon'])
  })

  it('featCategoryEnum valide chaque valeur et rejette l\'inconnu', () => {
    for (const c of FEAT_CATEGORIES) expect(featCategoryEnum.parse(c)).toBe(c)
    expect(featCategoryEnum.safeParse('origine').success).toBe(false) // FR, pas la clé machine
    expect(featCategoryEnum.safeParse('').success).toBe(false)
  })
})
