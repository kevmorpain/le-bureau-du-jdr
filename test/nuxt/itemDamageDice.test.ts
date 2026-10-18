import { describe, it, expect } from 'vitest'
import type { Effect } from '../../server/db/schema/effects'
import { fixed } from '../../shared/utils/formula'
import { baseScores, inventoryEntry as entry, mountSheet as mount } from './fixtures/mountSheet'

// Dés de dégâts supplémentaires portés par un objet (Langue de feu : +2d6 de feu) : ils valent pour l'arme qui les
// porte, pas pour les autres, et seulement tant que l'objet est actif (équipé, lié s'il l'exige).

const longsword = { weapon_category: 'martial_melee', weapon_properties: ['versatile'], damage_dice: '1d8', versatile_damage: '1d10', damage_type: 'slashing' }
const longbow = { weapon_category: 'martial_ranged', weapon_properties: ['two_handed'], damage_dice: '1d8', damage_type: 'piercing', range: { normal: 45, long: 180 } }

const flame: Effect[] = [{
  type: 'weapon_damage_dice',
  value: { name: 'Dégâts supplémentaires', dice: fixed(2), sides: 6, damageType: 'fire', weapons: 'all', limit: 'each_hit' },
}]

const extraDiceOf = (s: Awaited<ReturnType<typeof mount>>, name: string) =>
  s.equippedWeaponStats.value.find(w => w.name === name)!.extraDamageDice

describe('fiche — dés de dégâts supplémentaires d\'un objet', () => {
  const scores = baseScores(14, 10, 10, 10)

  it('l\'arme qui les porte les offre, les autres armes non', async () => {
    const s = await mount({
      scores,
      worn: id => [entry(id, 1, 'Épée de feu', 'weapon', longsword, flame), entry(id, 2, 'Arc long', 'weapon', longbow)],
    })
    expect(extraDiceOf(s, 'Épée de feu')).toEqual([expect.objectContaining({ name: 'Dégâts supplémentaires', count: 2, sides: 6, damageType: 'fire', limit: 'each_hit' })])
    expect(extraDiceOf(s, 'Arc long')).toEqual([])
  })

  it('une arme à distance les porte aussi : « all » ne dépend pas du type d\'arme', async () => {
    const s = await mount({ scores, worn: id => [entry(id, 1, 'Arc de feu', 'weapon', longbow, flame)] })
    expect(extraDiceOf(s, 'Arc de feu')).toHaveLength(1)
  })

  it('sans lien, l\'arme qui en exige un n\'offre rien ; liée, elle les offre', async () => {
    const unattuned = await mount({
      scores,
      worn: id => [entry(id, 1, 'Épée de feu', 'weapon', longsword, flame, { requiresAttunement: true, attuned: false })],
    })
    expect(extraDiceOf(unattuned, 'Épée de feu')).toEqual([])

    const attuned = await mount({
      scores,
      worn: id => [entry(id, 1, 'Épée de feu', 'weapon', longsword, flame, { requiresAttunement: true, attuned: true })],
    })
    expect(extraDiceOf(attuned, 'Épée de feu')).toHaveLength(1)
  })

  it('une arme sans effet n\'offre aucun dé supplémentaire', async () => {
    const s = await mount({ scores, worn: id => [entry(id, 1, 'Épée longue', 'weapon', longsword)] })
    expect(extraDiceOf(s, 'Épée longue')).toEqual([])
  })
})
