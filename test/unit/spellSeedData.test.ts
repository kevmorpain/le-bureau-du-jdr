import { describe, it, expect } from 'vitest'
import { spells } from '../../server/db/seeds/data/spells'
import { spellClassMappings } from '../../server/db/seeds/data/spell_class_mappings'
import { nameRulesetKey } from '../../server/db/seeds/lib/rulesetOf'

// Le seed lie sorts et classes par NOM : un nom de mapping sans sort correspondant est ignoré en
// silence, et un sort déclaré deux fois produit un doublon en base ou des resyncs contradictoires.
describe('seed sorts — cohérence des données', () => {
  it('chaque sort du mapping sort↔classe existe dans spells.ts', () => {
    const spellNames = new Set(spells.map(s => s.name))
    const orphans = spellClassMappings.map(m => m.spellName).filter(name => !spellNames.has(name))
    expect(orphans).toEqual([])
  })

  it('aucun sort n\'est déclaré deux fois pour une même édition', () => {
    const keys = spells.map(s => nameRulesetKey(s))
    expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual([])
  })
})
