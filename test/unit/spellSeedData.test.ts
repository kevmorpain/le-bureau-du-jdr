import { describe, it, expect } from 'vitest'
import { spells } from '../../server/db/seeds/data/spells'
import { spellClassMappings } from '../../server/db/seeds/data/spell_class_mappings'
import { nameRulesetKey } from '../../server/db/seeds/lib/rulesetOf'
import { parseDiceNotation } from '../../shared/rules/spellScaling'

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

// La résolution d'une progression prend le palier le plus haut ATTEINT (shared/rules/spellScaling).
// Si la table commençait au-dessus du niveau du sort, le sort n'afficherait et ne jetterait RIEN
// quand il est lancé à son niveau de base.
describe('seed sorts — progressions de montée en puissance', () => {
  const slotTables = spells.flatMap((spell) => {
    const tables: { spell: string, level: number, keys: number[] }[] = []
    for (const damage of spell.damages ?? []) {
      if ('damage_at_slot_level' in damage && damage.damage_at_slot_level) {
        tables.push({ spell: spell.name, level: spell.level, keys: Object.keys(damage.damage_at_slot_level).map(Number) })
      }
    }
    const heal = spell.heal
    if (heal && 'heal_at_slot_level' in heal && heal.heal_at_slot_level) {
      tables.push({ spell: spell.name, level: spell.level, keys: Object.keys(heal.heal_at_slot_level).map(Number) })
    }
    const counts = spell.multiAttack?.count_at_slot_level
    if (counts) {
      tables.push({ spell: spell.name, level: spell.level, keys: Object.keys(counts).map(Number) })
    }
    return tables
  })

  it('chaque table par niveau d\'emplacement commence au niveau du sort (ou en dessous)', () => {
    const tooHigh = slotTables
      .filter(t => Math.min(...t.keys) > Math.max(1, t.level))
      .map(t => `${t.spell} (niv. ${t.level}, table à partir de ${Math.min(...t.keys)})`)
    expect(tooHigh).toEqual([])
  })

  it('chaque valeur est une notation de dés exploitable (jet + fourchette affichée)', () => {
    const unparsable: string[] = []
    for (const spell of spells) {
      for (const damage of spell.damages ?? []) {
        const table = 'damage_at_slot_level' in damage ? damage.damage_at_slot_level : damage.damage_at_character_level
        for (const die of Object.values(table ?? {})) {
          if (!parseDiceNotation(die)) unparsable.push(`${spell.name} — dégâts « ${die} »`)
        }
      }
      const heal = spell.heal
      if (heal) {
        const table = 'heal_at_slot_level' in heal ? heal.heal_at_slot_level : heal.heal_at_character_level
        for (const die of Object.values(table ?? {})) {
          if (!parseDiceNotation(die)) unparsable.push(`${spell.name} — soin « ${die} »`)
        }
      }
    }
    expect(unparsable).toEqual([])
  })
})
