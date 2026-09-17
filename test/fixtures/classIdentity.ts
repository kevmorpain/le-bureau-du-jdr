import type { SpellcastingType } from '../../shared/rules/spellcasting'

/**
 * Contrat des faits d'identité des 12 classes du PHB 2014 : valeurs vérifiées à la main, pas un
 * snapshot. Trois sources doivent s'y conformer (migration 0080, seed, blob front), vérifiées par
 * trois tests distincts. Source : PHB FR 2014 / https://www.aidedd.org/regles/classes/
 */
export interface ClassIdentity {
  builderId: string
  dbName: string
  subclassLevel: number
  spellcastingType: SpellcastingType
}

export const CLASS_IDENTITY: ClassIdentity[] = [
  { builderId: 'barbarian', dbName: 'Barbare', subclassLevel: 3, spellcastingType: 'none' },
  { builderId: 'bard', dbName: 'Barde', subclassLevel: 3, spellcastingType: 'full' },
  { builderId: 'cleric', dbName: 'Clerc', subclassLevel: 1, spellcastingType: 'full' },
  { builderId: 'druid', dbName: 'Druide', subclassLevel: 2, spellcastingType: 'full' },
  { builderId: 'fighter', dbName: 'Guerrier', subclassLevel: 3, spellcastingType: 'none' },
  { builderId: 'monk', dbName: 'Moine', subclassLevel: 3, spellcastingType: 'none' },
  { builderId: 'paladin', dbName: 'Paladin', subclassLevel: 3, spellcastingType: 'half' },
  { builderId: 'ranger', dbName: 'Rôdeur', subclassLevel: 3, spellcastingType: 'half' },
  { builderId: 'rogue', dbName: 'Roublard', subclassLevel: 3, spellcastingType: 'none' },
  { builderId: 'sorcerer', dbName: 'Ensorceleur', subclassLevel: 1, spellcastingType: 'full' },
  { builderId: 'warlock', dbName: 'Occultiste', subclassLevel: 1, spellcastingType: 'pact' },
  { builderId: 'wizard', dbName: 'Magicien', subclassLevel: 2, spellcastingType: 'full' },
]
