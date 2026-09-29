import type { SpellcastingType } from '~~/shared/rules/spellcasting'
import type { MulticlassPrerequisites } from '~~/shared/rules/multiclass'
import type { Die } from '../../schema/classes'

// `subclassLevel` et `spellcastingType` sont aussi backfillés par la migration 0080, `multiclassSkillCount`
// par la 0103, `multiclassPrerequisites` par la 0106 : les deux sources DOIVENT rester d'accord
// (test/unit/classesIdentity.test.ts).
class DnDClass {
  name: string
  hitDice: Die
  spellcastingAbility: string | null
  subclassLevel: number
  spellcastingType: SpellcastingType
  multiclassSkillCount: number
  multiclassPrerequisites: MulticlassPrerequisites

  constructor(
    name: string,
    hitDice: Die,
    spellcastingAbility: string | null = null,
    subclassLevel: number = 3,
    spellcastingType: SpellcastingType = 'none',
    multiclassSkillCount: number = 0,
    multiclassPrerequisites: MulticlassPrerequisites = [],
  ) {
    this.name = name
    this.hitDice = hitDice
    this.spellcastingAbility = spellcastingAbility
    this.subclassLevel = subclassLevel
    this.spellcastingType = spellcastingType
    this.multiclassSkillCount = multiclassSkillCount
    this.multiclassPrerequisites = multiclassPrerequisites
  }
}

const barbarian = new DnDClass('Barbare', '1d12', null, 3, 'none', 0, [{ str: 13 }])
const bard = new DnDClass('Barde', '1d8', 'cha', 3, 'full', 1, [{ cha: 13 }])
const cleric = new DnDClass('Clerc', '1d8', 'wis', 1, 'full', 0, [{ wis: 13 }])
const druid = new DnDClass('Druide', '1d8', 'wis', 2, 'full', 0, [{ wis: 13 }])
const fighter = new DnDClass('Guerrier', '1d10', null, 3, 'none', 0, [{ str: 13 }, { dex: 13 }]) // Chevalier occulte → surcharge via character_classes
const monk = new DnDClass('Moine', '1d8', null, 3, 'none', 0, [{ dex: 13, wis: 13 }]) // Voie des quatre éléments → surcharge via character_classes
const paladin = new DnDClass('Paladin', '1d10', 'cha', 3, 'half', 0, [{ str: 13, cha: 13 }])
const ranger = new DnDClass('Rôdeur', '1d10', 'wis', 3, 'half', 1, [{ dex: 13, wis: 13 }])
const rogue = new DnDClass('Roublard', '1d8', null, 3, 'none', 1, [{ dex: 13 }]) // Filou ésotérique → surcharge via character_classes
const sorcerer = new DnDClass('Ensorceleur', '1d6', 'cha', 1, 'full', 0, [{ cha: 13 }])
const warlock = new DnDClass('Occultiste', '1d8', 'cha', 1, 'pact', 0, [{ cha: 13 }])
const wizard = new DnDClass('Magicien', '1d6', 'int', 2, 'full', 0, [{ int: 13 }])

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
