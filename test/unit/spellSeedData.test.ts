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

// Les faits de fiche (attaque, zone, coût) ne se déduisent pas de la prose à l'exécution : un sort qui les porte dans son
// texte sans les déclarer afficherait une fiche muette sur ce que le joueur doit savoir en lançant.
describe('seed sorts — faits de fiche déclarés', () => {
  // Plafonds de taille d'une création ou rayons de détection, pas des zones affectées (AideDD, pages de sort).
  const SIZE_LIMIT_NOT_AREA = [
    'Prestidigitation', 'Image silencieuse', 'Illusion mineure', 'Invocation d\'élémentaire', 'Force fantasmagorique',
    'Druidisme', 'Désintégration', 'Cage de force', 'Contrôle des flammes',
  ]

  it('chaque sort dont le texte décrit une zone chiffrée la déclare, ou figure parmi les plafonds de taille', () => {
    const undeclared = spells
      .filter(s => /\b(cône|sphère|cylindre|cube|carré)\s+(?:de|d')\s*\d/.test(s.description ?? ''))
      .filter(s => !s.areaOfEffect && !SIZE_LIMIT_NOT_AREA.includes(s.name))
      .map(s => s.name)
    expect(undeclared).toEqual([])
  })

  it('chaque composante matérielle chiffrée ou consommée déclare son coût', () => {
    const undeclared = spells
      .filter(s => /\d\s*(?:po|pa)\b|consom/i.test(s.material ?? ''))
      .filter(s => !s.materialCost)
      .map(s => s.name)
    expect(undeclared).toEqual([])
  })

  it('un coût déclaré est chiffré avec son unité, ou seulement consommé', () => {
    for (const s of spells.filter(s => s.materialCost)) {
      const { amount, unit, consumed } = s.materialCost!
      expect(amount === undefined ? consumed === true : unit !== undefined && amount > 0, s.name).toBe(true)
    }
  })

  it('chaque sort qui demande une attaque de sort la déclare', () => {
    const undeclared = spells
      .filter(s => /attaque (?:à distance|au corps à corps) avec un sort|attaque de sort/i.test(s.description ?? ''))
      .filter(s => !s.attackType)
      .map(s => s.name)
    expect(undeclared).toEqual([])
  })

  it('une zone d\'effet a une taille positive, et une hauteur seulement pour le cylindre', () => {
    for (const s of spells.filter(s => s.areaOfEffect)) {
      const { shape, size, height } = s.areaOfEffect!
      expect(size, s.name).toBeGreaterThan(0)
      expect(height !== undefined, s.name).toBe(shape === 'cylinder')
    }
  })
})
