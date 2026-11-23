import { describe, it, expect } from 'vitest'
import {
  filterPlayCards,
  groupPlayCardsByCost,
  isPlayableFeature,
  toFeatureCard,
  toItemCard,
  toSpellCard,
  toWeaponCard,
} from '../../app/utils/playCards'

const spellCard = (name: string, level: number, castingTime: string, over: Partial<Parameters<typeof toSpellCard>[0]> = {}) => toSpellCard({
  spellId: name.length,
  isArcanum: false,
  hasSlotAvailable: true,
  arcanumUses: null,
  spell: { name, level, castingTime, concentration: false, ritual: false },
  ...over,
})

const feature = (over: Partial<Parameters<typeof toFeatureCard>[0]> = {}) => ({
  id: 1, name: 'Second souffle', actionType: 'bonus_action' as const, rechargeType: 'short_rest' as const, maxUses: 1, currentUses: 0, ...over,
})

describe('projection en cartes', () => {
  it('un tour de magie ne consomme rien et reste disponible', () => {
    const card = spellCard('Décharge occulte', 0, '1 action', { hasSlotAvailable: false })
    expect(card).toMatchObject({ kind: 'spell', cost: 'action', resource: null, isAvailable: true, spellLevel: 0 })
  })

  it('un sort de niveau consomme un emplacement, indisponible sans emplacement', () => {
    const card = spellCard('Maléfice', 1, '1 action bonus', { hasSlotAvailable: false })
    expect(card).toMatchObject({ cost: 'bonus', resource: 'slot', isAvailable: false })
  })

  it('un Arcanum consomme son utilisation quotidienne, pas un emplacement', () => {
    const card = spellCard('Prison mentale', 6, '1 action', { isArcanum: true, hasSlotAvailable: false, arcanumUses: { max: 1, remaining: 1 } })
    expect(card).toMatchObject({ resource: 'arcanum', uses: { max: 1, remaining: 1 }, isAvailable: true })
  })

  it('une capacité compte ce qui reste, pas ce qui est dépensé', () => {
    expect(toFeatureCard(feature({ maxUses: 3, currentUses: 1 }))).toMatchObject({ cost: 'bonus', resource: 'uses', uses: { max: 3, remaining: 2 }, isAvailable: true })
    expect(toFeatureCard(feature({ currentUses: 1 }))).toMatchObject({ uses: { max: 1, remaining: 0 }, isAvailable: false })
    expect(toFeatureCard(feature({ unlimited: true }))).toMatchObject({ uses: null, isAvailable: true })
  })

  it('seules les capacités qui coûtent une action ou ont des utilisations se jouent', () => {
    expect(isPlayableFeature(feature({ maxUses: null }))).toBe(true)
    expect(isPlayableFeature(feature({ actionType: null }))).toBe(true)
    expect(isPlayableFeature(feature({ actionType: null, maxUses: null }))).toBe(false)
    expect(isPlayableFeature(feature({ actionType: 'free', maxUses: null }))).toBe(false)
  })

  it('une arme coûte une action ; sans munition elle n\'est plus disponible', () => {
    const base = { entryId: 4, name: 'Arc court', isRanged: true, maxUses: null, currentUses: 0, rechargeType: null }
    expect(toWeaponCard({ ...base, ammunition: null })).toMatchObject({ cost: 'action', reach: 'ranged', isAvailable: true, resource: null })
    expect(toWeaponCard({ ...base, ammunition: { available: 0 } })).toMatchObject({ resource: 'ammunition', isAvailable: false })
  })

  it('un objet à charges est disponible tant qu\'il en reste', () => {
    const card = toItemCard({ entryId: 7, name: 'Baguette', maxUses: 7, currentUses: 7, rechargeType: 'dawn' })
    expect(card).toMatchObject({ kind: 'item', cost: 'other', resource: 'charges', uses: { max: 7, remaining: 0 }, isAvailable: false })
  })
})

describe('filtres et groupes', () => {
  const cards = [
    spellCard('Décharge occulte', 0, '1 action'),
    spellCard('Maléfice', 1, '1 action bonus', { spell: { name: 'Maléfice', level: 1, castingTime: '1 action bonus', concentration: true, ritual: false } }),
    spellCard('Bouclier', 1, '1 réaction', { hasSlotAvailable: false }),
    toFeatureCard(feature()),
    toWeaponCard({ entryId: 4, name: 'Dague', isRanged: false, ammunition: null, maxUses: null, currentUses: 0, rechargeType: null }),
    toItemCard({ entryId: 7, name: 'Baguette', maxUses: 7, currentUses: 0, rechargeType: 'dawn' }),
  ]
  const names = (list: typeof cards) => list.map(card => card.name)
  const all = { kind: 'all', cost: 'all', facets: [], search: '' } as const

  it('par catégorie, par coût et par recherche', () => {
    expect(names(filterPlayCards(cards, { ...all, kind: 'spell' }))).toEqual(['Décharge occulte', 'Maléfice', 'Bouclier'])
    expect(names(filterPlayCards(cards, { ...all, cost: 'bonus' }))).toEqual(['Maléfice', 'Second souffle'])
    expect(names(filterPlayCards(cards, { ...all, search: 'malef' }))).toEqual(['Maléfice'])
  })

  it('les facettes se cumulent', () => {
    expect(names(filterPlayCards(cards, { ...all, facets: ['available'] }))).not.toContain('Bouclier')
    expect(names(filterPlayCards(cards, { ...all, facets: ['concentration'] }))).toEqual(['Maléfice'])
    expect(names(filterPlayCards(cards, { ...all, facets: ['cantrip'] }))).toEqual(['Décharge occulte'])
    expect(names(filterPlayCards(cards, { ...all, facets: ['melee'] }))).toEqual(['Dague'])
    expect(names(filterPlayCards(cards, { ...all, facets: ['short_rest', 'available'] }))).toEqual(['Second souffle'])
  })

  it('groupés dans l\'ordre action, bonus, réaction, autres ; groupes vides omis', () => {
    expect(groupPlayCardsByCost(cards).map(group => [group.cost, names(group.cards)])).toEqual([
      ['action', ['Décharge occulte', 'Dague']],
      ['bonus', ['Maléfice', 'Second souffle']],
      ['reaction', ['Bouclier']],
      ['other', ['Baguette']],
    ])
    expect(groupPlayCardsByCost([cards[0]!]).map(group => group.cost)).toEqual(['action'])
  })
})
