import type { SpellcastingType } from '../../shared/rules/spellcasting'
import type { MulticlassPrerequisites } from '../../shared/rules/multiclass'

/**
 * Contrat des faits d'identité des 12 classes du PHB 2014 : valeurs vérifiées à la main, pas un
 * snapshot. Sources à s'y conformer : migrations 0080 / 0103 / 0106, seed, blob front (niveau de sous-classe).
 * Source : PHB FR 2014 / https://www.aidedd.org/regles/classes/ ; compétences et prérequis de multiclassage :
 * https://www.aidedd.org/regles/personnalisation/multiclassage/
 */
export interface ClassIdentity {
  builderId: string
  dbName: string
  subclassLevel: number
  spellcastingType: SpellcastingType
  multiclassSkillCount: number
  multiclassPrerequisites: MulticlassPrerequisites
}

export const CLASS_IDENTITY: ClassIdentity[] = [
  { builderId: 'barbarian', dbName: 'Barbare', subclassLevel: 3, spellcastingType: 'none', multiclassSkillCount: 0, multiclassPrerequisites: [{ str: 13 }] },
  { builderId: 'bard', dbName: 'Barde', subclassLevel: 3, spellcastingType: 'full', multiclassSkillCount: 1, multiclassPrerequisites: [{ cha: 13 }] },
  { builderId: 'cleric', dbName: 'Clerc', subclassLevel: 1, spellcastingType: 'full', multiclassSkillCount: 0, multiclassPrerequisites: [{ wis: 13 }] },
  { builderId: 'druid', dbName: 'Druide', subclassLevel: 2, spellcastingType: 'full', multiclassSkillCount: 0, multiclassPrerequisites: [{ wis: 13 }] },
  { builderId: 'fighter', dbName: 'Guerrier', subclassLevel: 3, spellcastingType: 'none', multiclassSkillCount: 0, multiclassPrerequisites: [{ str: 13 }, { dex: 13 }] },
  { builderId: 'monk', dbName: 'Moine', subclassLevel: 3, spellcastingType: 'none', multiclassSkillCount: 0, multiclassPrerequisites: [{ dex: 13, wis: 13 }] },
  { builderId: 'paladin', dbName: 'Paladin', subclassLevel: 3, spellcastingType: 'half', multiclassSkillCount: 0, multiclassPrerequisites: [{ str: 13, cha: 13 }] },
  { builderId: 'ranger', dbName: 'Rôdeur', subclassLevel: 3, spellcastingType: 'half', multiclassSkillCount: 1, multiclassPrerequisites: [{ dex: 13, wis: 13 }] },
  { builderId: 'rogue', dbName: 'Roublard', subclassLevel: 3, spellcastingType: 'none', multiclassSkillCount: 1, multiclassPrerequisites: [{ dex: 13 }] },
  { builderId: 'sorcerer', dbName: 'Ensorceleur', subclassLevel: 1, spellcastingType: 'full', multiclassSkillCount: 0, multiclassPrerequisites: [{ cha: 13 }] },
  { builderId: 'warlock', dbName: 'Occultiste', subclassLevel: 1, spellcastingType: 'pact', multiclassSkillCount: 0, multiclassPrerequisites: [{ cha: 13 }] },
  { builderId: 'wizard', dbName: 'Magicien', subclassLevel: 2, spellcastingType: 'full', multiclassSkillCount: 0, multiclassPrerequisites: [{ int: 13 }] },
]
