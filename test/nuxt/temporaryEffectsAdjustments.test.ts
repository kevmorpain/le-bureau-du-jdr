import { describe, it, expect } from 'vitest'
import type { Effect } from '../../server/db/schema/effects'
import { fixed } from '../../shared/utils/formula'
import { baseScores, mountSheet as mount } from './fixtures/mountSheet'

// Correction à la main des valeurs dérivées (CA, vitesse, initiative, DD de sort) : un effet temporaire saisi
// sur la fiche, sans passer par le modèle d'effets des capacités. Passe par useCharacterSheet pour garder le câblage.

const adjustment = (id: number, effects: Effect[], active = true) => ({ id, name: 'Ajustement', active, effects })
const scores = baseScores(10, 14, 10, 10)
const WIZARD = 7

describe('fiche — ajustements manuels par effets temporaires', () => {
  it('CA : un bonus s\'ajoute et figure au détail ; désactivé, il disparaît', async () => {
    const base = await mount({ scores })
    expect(base.armorClass.value.total).toBe(12)

    const adjusted = await mount({ scores, temporaryEffects: [adjustment(1, [{ type: 'armor_class_bonus', value: { amount: 1 } }])] })
    expect(adjusted.armorClass.value.total).toBe(13)
    expect(adjusted.armorClass.value.detail).toContain('Ajustement +1')

    const off = await mount({ scores, temporaryEffects: [adjustment(1, [{ type: 'armor_class_bonus', value: { amount: 1 } }], false)] })
    expect(off.armorClass.value.total).toBe(12)
  })

  it('initiative : un bonus s\'ajoute au modificateur de DEX', async () => {
    const s = await mount({ scores, temporaryEffects: [adjustment(1, [{ type: 'initiative_bonus', value: { amount: 2 } }])] })
    expect(s.initiativeBonus.value).toBe(2 + 2)
  })

  it('DD de sort : un bonus s\'ajoute au DD de la classe lanceuse', async () => {
    const caster = { scores: baseScores(10, 10, 10, 16), classes: [{ classId: WIZARD, level: 1, spellcastingAbility: 'wis' }] }
    expect((await mount(caster)).spellSaveDC.value).toBe(8 + 2 + 3)

    const adjusted = await mount({ ...caster, temporaryEffects: [adjustment(1, [{ type: 'spell_save_dc_bonus', value: { amount: 1 } }])] })
    expect(adjusted.spellSaveDC.value).toBe(8 + 2 + 3 + 1)
  })

  it('vitesse : un bonus s\'ajoute à la marche et figure au détail', async () => {
    const s = await mount({ scores, temporaryEffects: [adjustment(1, [{ type: 'speed_bonus', value: { amount: fixed(4.5) } }])] })
    expect(s.effectiveSpeed.value).toBe(13.5)
    expect(s.speedDetail.value).toBe('9 m +4.5 m Ajustement')
  })

  it('vitesse : un malus la réduit sans jamais passer sous zéro, désactivé il ne joue plus', async () => {
    const slowed = await mount({ scores, temporaryEffects: [adjustment(1, [{ type: 'speed_bonus', value: { amount: fixed(-3) } }])] })
    expect(slowed.effectiveSpeed.value).toBe(6)

    const stuck = await mount({ scores, temporaryEffects: [adjustment(1, [{ type: 'speed_bonus', value: { amount: fixed(-30) } }])] })
    expect(stuck.effectiveSpeed.value).toBe(0)

    const off = await mount({ scores, temporaryEffects: [adjustment(1, [{ type: 'speed_bonus', value: { amount: fixed(-3) } }], false)] })
    expect(off.effectiveSpeed.value).toBe(9)
  })
})
