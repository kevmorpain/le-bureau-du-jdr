import type { Die } from '../../schema/classes'

class DnDClass {
  name: string
  hitDice: Die

  constructor(name: string, hitDice: Die) {
    this.name = name
    this.hitDice = hitDice
  }
}

const barbarian = new DnDClass('Barbare', '1d12')
const bard = new DnDClass('Barde', '1d8')
const cleric = new DnDClass('Clerc', '1d8')
const druid = new DnDClass('Druide', '1d8')
const fighter = new DnDClass('Guerrier', '1d10')
const monk = new DnDClass('Moine', '1d8')
const paladin = new DnDClass('Paladin', '1d10')
const ranger = new DnDClass('Rôdeur', '1d10')
const rogue = new DnDClass('Roublard', '1d8')
const sorcerer = new DnDClass('Ensorceleur', '1d6')
const warlock = new DnDClass('Occultiste', '1d8')
const wizard = new DnDClass('Magicien', '1d6')

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
