import { and, eq, inArray } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'
import { classSlugFromName } from '~~/shared/rules/classSlugs'
import type { Ruleset } from '~~/shared/rules/ruleset'
import type { SpellcastingType } from '~~/shared/rules/spellcasting'
import { maxSpellLevelForLevel } from '~~/shared/rules/spellSlots'
import { spellLearningOf, spellsLearnedOnLevelUp } from '~~/shared/rules/spellsKnown'

export interface LearnedSpellsInput {
  cls: { id: number, name: string, ruleset: Ruleset, spellcastingType: SpellcastingType }
  /** Niveau DANS la classe avant et après (0 à la création et au multiclassage vers la classe). */
  fromLevel: number
  toLevel: number
  /** Sorts mineurs et sorts confondus : la nature se lit sur le niveau du sort. */
  spellIds: number[]
  alreadyKnownIds: number[]
  /** Le builder range les sorts préparés d'un Clerc, Druide ou Paladin dans la même liste que les sorts appris. */
  atCreation?: boolean
}

// Bornes hautes seulement, comme les autres choix : le nombre exact est imposé par l'assistant. Les tables
// sont celles du PHB 2014 ; une classe d'une autre édition n'est pas contrôlée.
export async function learnedSpellsError(db: Db, input: LearnedSpellsInput): Promise<string | null> {
  const { cls, fromLevel, toLevel, spellIds } = input
  const slug = classSlugFromName(cls.name)
  if (!spellIds.length || !slug || cls.ruleset !== '5') return null

  if (new Set(spellIds).size !== spellIds.length) return 'Un sort est choisi plusieurs fois.'
  const rows = await db
    .select({ id: schema.spells.id, name: schema.spells.name, level: schema.spells.level })
    .from(schema.spells)
    .where(inArray(schema.spells.id, spellIds))
  if (rows.length !== spellIds.length) return 'Un sort choisi est introuvable.'

  const known = new Set(input.alreadyKnownIds)
  const duplicate = rows.find(r => known.has(r.id))
  if (duplicate) return `Le sort « ${duplicate.name} » est déjà sur la fiche.`

  const listed = new Set((await db
    .select({ spellId: schema.spellClasses.spellId })
    .from(schema.spellClasses)
    .where(and(
      eq(schema.spellClasses.classId, cls.id),
      eq(schema.spellClasses.ruleset, cls.ruleset),
      inArray(schema.spellClasses.spellId, spellIds),
    ))).map(r => r.spellId))
  const unlisted = rows.find(r => !listed.has(r.id))
  if (unlisted) return `Le sort « ${unlisted.name} » n'est pas dans la liste de la classe ${cls.name}.`

  const learned = spellsLearnedOnLevelUp(slug, fromLevel, toLevel)
  const cantrips = rows.filter(r => r.level === 0)
  if (cantrips.length > learned.cantrips) {
    return `Trop de sorts mineurs (${cantrips.length} pour ${learned.cantrips} appris au niveau ${toLevel} de la classe).`
  }

  const leveled = rows.filter(r => r.level > 0)
  const preparedAtCreation = input.atCreation && spellLearningOf(slug) === 'prepared'
  if (!preparedAtCreation && leveled.length > learned.spells) {
    return `Trop de sorts (${leveled.length} pour ${learned.spells} appris au niveau ${toLevel} de la classe).`
  }

  const maxLevel = cls.spellcastingType === 'none' ? 0 : maxSpellLevelForLevel(cls.spellcastingType, toLevel)
  const tooHigh = leveled.find(r => r.level > maxLevel)
  if (tooHigh) return `Le sort « ${tooHigh.name} » (niveau ${tooHigh.level}) dépasse le niveau ${maxLevel} accessible à ce niveau de la classe.`
  return null
}
