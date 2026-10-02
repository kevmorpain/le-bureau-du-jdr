import type { AbilityKey } from './abilities'
import type { ClassSlug } from './classSlugs'
import type { SpellcastingType } from './spellcasting'

// Sous-classes lanceuses de sorts du tiers, dont la classe n'incante pas (AideDD : Chevalier occulte du Guerrier,
// Escroc arcanique du Roublard). Elles incantent à partir du niveau 3 de leur classe, avec la liste du Magicien.
// Indexées par nom en base, comme les classes (`CLASS_DB_NAMES`).
export type SubclassCasterSlug = 'eldritch_knight' | 'arcane_trickster'

export interface SubclassCasting {
  slug: SubclassCasterSlug
  classSlug: ClassSlug
  ability: AbilityKey
  type: 'third'
  startsAtLevel: number
  /** Liste dans laquelle puisent les sorts. */
  listClass: ClassSlug
  /** Écoles (noms en base) dont viennent les sorts, hors paliers d'école libre. */
  schools: readonly string[]
}

export const SUBCLASS_CASTING: Record<string, SubclassCasting> = {
  'Chevalier occulte': {
    slug: 'eldritch_knight',
    classSlug: 'fighter',
    ability: 'int',
    type: 'third',
    startsAtLevel: 3,
    listClass: 'wizard',
    schools: ['Abjuration', 'Evocation'],
  },
  'Escroc arcanique': {
    slug: 'arcane_trickster',
    classSlug: 'rogue',
    ability: 'int',
    type: 'third',
    startsAtLevel: 3,
    listClass: 'wizard',
    schools: ['Enchantment', 'Illusion'],
  },
}

export function subclassCastingOf(classSlug: string, subclassName: string | null | undefined): SubclassCasting | null {
  const casting = subclassName ? SUBCLASS_CASTING[subclassName] : undefined
  return casting && casting.classSlug === classSlug ? casting : null
}

/** Clé des tables de sorts connus : celle de la sous-classe lanceuse, sinon celle de la classe. */
export function casterSlugOf(classSlug: string, subclassName: string | null | undefined): string {
  return subclassCastingOf(classSlug, subclassName)?.slug ?? classSlug
}

/** Un guerrier ou un roublard n'incante qu'à travers sa sous-classe. */
export function effectiveCasterType(classType: SpellcastingType, classSlug: string, subclassName: string | null | undefined): SpellcastingType {
  return classType === 'none' && subclassCastingOf(classSlug, subclassName) ? 'third' : classType
}

// AideDD : au niveau 3, un des trois sorts de niveau 1 est de n'importe quelle école ; ceux appris aux niveaux 8, 14
// et 20 le sont aussi. Les autres viennent des écoles de la sous-classe.
const ANY_SCHOOL_LEVELS = [3, 8, 14, 20]

/** Sorts qu'on peut prendre hors des écoles de la sous-classe en passant de `fromLevel` à `toLevel`. */
export function anySchoolSpellsGained(fromLevel: number, toLevel: number): number {
  return ANY_SCHOOL_LEVELS.filter(level => fromLevel < level && level <= toLevel).length
}
