import { describe, it, expect } from 'vitest'
import { choiceOptions } from '../../server/db/schema/effects'
import { ABILITY_KEYS } from '../../shared/rules/abilities'
import { SKILL_KEYS } from '../../shared/rules/skills'

// `from` a été ajouté APRÈS les premiers seeds d'effets « au choix » (Humain
// « Polyvalence » : `{ count: 2 }`, sans `from`). Le contrat d'additivité
// (decisions.md D9/D13) : une valeur seedée sans `from` reste valide et vaut `'all'`.

describe('choiceOptions — résolution du `from` d\'un effet « au choix »', () => {
  it('`from` absent (effet seedé avant l\'enrichissement) ⇒ tout l\'ensemble', () => {
    expect(choiceOptions(undefined, SKILL_KEYS)).toEqual([...SKILL_KEYS])
    expect(choiceOptions(undefined, SKILL_KEYS)).toHaveLength(18)
  })

  it('`from: \'all\'` ⇒ tout l\'ensemble', () => {
    expect(choiceOptions('all', ABILITY_KEYS)).toEqual(['str', 'dex', 'con', 'int', 'wis', 'cha'])
  })

  it('liste explicite ⇒ elle seule', () => {
    expect(choiceOptions(['athletics', 'stealth'], SKILL_KEYS)).toEqual(['athletics', 'stealth'])
    expect(choiceOptions(['str', 'dex'], ABILITY_KEYS)).toEqual(['str', 'dex'])
  })

  it('renvoie une copie : muter le résultat n\'altère pas la const canonique', () => {
    const options = choiceOptions(undefined, ABILITY_KEYS)
    options.push('str')
    expect(ABILITY_KEYS).toHaveLength(6)
  })
})
