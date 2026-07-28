import type { SpellcastingType } from '~~/shared/rules/spellcasting'
import type { Die } from '../../schema/classes'

// Faits d'identité des 12 classes du PHB 2014 (cf. rules-engine.md §3, decisions.md D3).
// `subclassLevel` et `spellcastingType` sont aussi backfillés par la migration
// 0080 pour les bases déjà déployées : les deux sources DOIVENT rester d'accord,
// c'est ce que vérifie `test/unit/classesIdentity.test.ts`.
class DnDClass {
  name: string
  hitDice: Die
  spellcastingAbility: string | null
  subclassLevel: number
  spellcastingType: SpellcastingType

  constructor(
    name: string,
    hitDice: Die,
    spellcastingAbility: string | null = null,
    subclassLevel: number = 3,
    spellcastingType: SpellcastingType = 'none',
  ) {
    this.name = name
    this.hitDice = hitDice
    this.spellcastingAbility = spellcastingAbility
    this.subclassLevel = subclassLevel
    this.spellcastingType = spellcastingType
  }
}

const barbarian = new DnDClass('Barbare', '1d12', null, 3)
const bard = new DnDClass('Barde', '1d8', 'cha', 3, 'full')
const cleric = new DnDClass('Clerc', '1d8', 'wis', 1, 'full')
const druid = new DnDClass('Druide', '1d8', 'wis', 2, 'full')
const fighter = new DnDClass('Guerrier', '1d10', null, 3) // Chevalier occulte → surcharge via character_classes
const monk = new DnDClass('Moine', '1d8', null, 3) // Voie des quatre éléments → surcharge via character_classes
const paladin = new DnDClass('Paladin', '1d10', 'cha', 3, 'half')
const ranger = new DnDClass('Rôdeur', '1d10', 'wis', 3, 'half')
const rogue = new DnDClass('Roublard', '1d8', null, 3) // Filou ésotérique → surcharge via character_classes
const sorcerer = new DnDClass('Ensorceleur', '1d6', 'cha', 1, 'full')
const warlock = new DnDClass('Occultiste', '1d8', 'cha', 1, 'pact')
const wizard = new DnDClass('Magicien', '1d6', 'int', 2, 'full')

export const classesData: DnDClass[] = [
  barbarian,
  bard,
  cleric,
  druid,
  fighter,
  monk,
  paladin,
  ranger,
  rogue,
  sorcerer,
  warlock,
  wizard,
]
