import type { Die } from '../../schema/classes'

class DnDClass {
  name: string
  hitDice: Die
  spellcastingAbility: string | null

  constructor(name: string, hitDice: Die, spellcastingAbility: string | null = null) {
    this.name = name
    this.hitDice = hitDice
    this.spellcastingAbility = spellcastingAbility
  }
}

const barbarian = new DnDClass('Barbare', '1d12')
const bard = new DnDClass('Barde', '1d8', 'cha')
const cleric = new DnDClass('Clerc', '1d8', 'wis')
const druid = new DnDClass('Druide', '1d8', 'wis')
const fighter = new DnDClass('Guerrier', '1d10') // Chevalier mystique → surcharge via character_classes
const monk = new DnDClass('Moine', '1d8') // Voie des quatre éléments → surcharge via character_classes
const paladin = new DnDClass('Paladin', '1d10', 'cha')
const ranger = new DnDClass('Rôdeur', '1d10', 'wis')
const rogue = new DnDClass('Roublard', '1d8') // Filou ésotérique → surcharge via character_classes
const sorcerer = new DnDClass('Ensorceleur', '1d6', 'cha')
const warlock = new DnDClass('Occultiste', '1d8', 'cha')
const wizard = new DnDClass('Magicien', '1d6', 'int')

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
