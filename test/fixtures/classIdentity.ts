import type { SpellcastingType } from '../../shared/rules/spellcasting'

/**
 * Contrat des **faits d'identité** des 12 classes du PHB 2014 (cf. decisions.md D12 :
 * des valeurs D&D vérifiées à la main, pas un snapshot).
 *
 * Trois sources doivent s'y conformer, et ce sont trois tests distincts qui le
 * vérifient :
 *   1. la migration `0080_classes_identity_columns` (backfill des bases déployées) ;
 *   2. les données de seed `server/db/seeds/data/classes.ts` (bases neuves) ;
 *   3. le front `app/data/character-builder.ts`, qui garde sa copie jusqu'à ce que le
 *      builder lise le catalogue via l'API (point 6 de la roadmap, dnd-5.5.md §3).
 *
 * Source : PHB FR 2014 / https://www.aidedd.org/regles/classes/
 * (niveau d'accès à la sous-classe et progression d'incantation).
 *
 * `builderId` = clé du front (`CLASSES[].id`), `dbName` = `classes.name`.
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
