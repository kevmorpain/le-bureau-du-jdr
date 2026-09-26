import type { SpellcastingType } from '../../shared/rules/spellcasting'

/**
 * Contrat des faits d'identité des 12 classes du PHB 2014 : valeurs vérifiées à la main, pas un
 * snapshot. Sources à s'y conformer : migrations 0080 / 0103, seed, blob front (niveau de sous-classe).
 * Source : PHB FR 2014 / https://www.aidedd.org/regles/classes/ ; compétences de multiclassage :
 * https://www.aidedd.org/regles/personnalisation/multiclassage/
 */
export interface ClassIdentity {
  builderId: string
  dbName: string
  subclassLevel: number
  spellcastingType: SpellcastingType
  multiclassSkillCount: number
}

export const CLASS_IDENTITY: ClassIdentity[] = [
  { builderId: 'barbarian', dbName: 'Barbare', subclassLevel: 3, spellcastingType: 'none', multiclassSkillCount: 0 },
  { builderId: 'bard', dbName: 'Barde', subclassLevel: 3, spellcastingType: 'full', multiclassSkillCount: 1 },
  { builderId: 'cleric', dbName: 'Clerc', subclassLevel: 1, spellcastingType: 'full', multiclassSkillCount: 0 },
  { builderId: 'druid', dbName: 'Druide', subclassLevel: 2, spellcastingType: 'full', multiclassSkillCount: 0 },
  { builderId: 'fighter', dbName: 'Guerrier', subclassLevel: 3, spellcastingType: 'none', multiclassSkillCount: 0 },
  { builderId: 'monk', dbName: 'Moine', subclassLevel: 3, spellcastingType: 'none', multiclassSkillCount: 0 },
  { builderId: 'paladin', dbName: 'Paladin', subclassLevel: 3, spellcastingType: 'half', multiclassSkillCount: 0 },
  { builderId: 'ranger', dbName: 'Rôdeur', subclassLevel: 3, spellcastingType: 'half', multiclassSkillCount: 1 },
  { builderId: 'rogue', dbName: 'Roublard', subclassLevel: 3, spellcastingType: 'none', multiclassSkillCount: 1 },
  { builderId: 'sorcerer', dbName: 'Ensorceleur', subclassLevel: 1, spellcastingType: 'full', multiclassSkillCount: 0 },
  { builderId: 'warlock', dbName: 'Occultiste', subclassLevel: 1, spellcastingType: 'pact', multiclassSkillCount: 0 },
  { builderId: 'wizard', dbName: 'Magicien', subclassLevel: 2, spellcastingType: 'full', multiclassSkillCount: 0 },
]
