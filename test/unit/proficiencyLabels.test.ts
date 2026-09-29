import { describe, it, expect } from 'vitest'
import { proficiencyEffectLabel, proficiencyLabels } from '../../shared/utils/item'

describe('proficiencyEffectLabel', () => {
  it('traduit les jetons d\'armure, y compris « toutes les armures » (Guerrier, Paladin)', () => {
    expect(proficiencyEffectLabel({ type: 'proficiency', value: 'light' })).toBe('Armure légère')
    expect(proficiencyEffectLabel({ type: 'proficiency', value: 'shield' })).toBe('Bouclier')
    expect(proficiencyEffectLabel({ type: 'proficiency', value: 'all_armor' })).toBe('Toutes les armures')
  })

  it('traduit les catégories d\'arme et garde le nom d\'une arme précise', () => {
    expect(proficiencyEffectLabel({ type: 'weapon_proficiency', value: 'martial_weapons' })).toBe('Toutes les armes de guerre')
    expect(proficiencyEffectLabel({ type: 'weapon_proficiency', value: 'Épée courte' })).toBe('Épée courte')
  })

  it('garde le nom d\'un outil', () => {
    expect(proficiencyEffectLabel({ type: 'tool_proficiency', value: 'Outils de voleur' })).toBe('Outils de voleur')
  })

  it('ignore ce qui n\'est pas une maîtrise d\'arme, d\'armure ou d\'outil', () => {
    expect(proficiencyEffectLabel({ type: 'saving_throw_proficiency', value: { ability: 'str' } })).toBeNull()
  })
})

describe('proficiencyLabels', () => {
  it('ordonne armures, armes puis outils, catégories avant les armes nommées, quel que soit l\'ordre lu en base', () => {
    expect(proficiencyLabels([
      { type: 'tool_proficiency', value: 'Outils de voleur' },
      { type: 'saving_throw_proficiency', value: { ability: 'dex' } },
      { type: 'weapon_proficiency', value: 'Épée courte' },
      { type: 'weapon_proficiency', value: 'simple_weapons' },
      { type: 'proficiency', value: 'light' },
    ])).toEqual(['Armure légère', 'Toutes les armes simples', 'Épée courte', 'Outils de voleur'])
  })
})
