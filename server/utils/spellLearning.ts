import { and, eq, inArray } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'
import { subclassNamesById } from '~~/server/utils/subclassNames'
import { classNameFromSlug, classSlugFromName } from '~~/shared/rules/classSlugs'
import type { Ruleset } from '~~/shared/rules/ruleset'
import type { SpellcastingType } from '~~/shared/rules/spellcasting'
import { maxSpellLevelForLevel } from '~~/shared/rules/spellSlots'
import { anySchoolSpellsGained, casterSlugOf, effectiveCasterType, subclassCastingOf } from '~~/shared/rules/subclassCasting'
import { magicalSecretsGained, spellLearningOf, spellsLearnedOnLevelUp } from '~~/shared/rules/spellsKnown'

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
  /** Un sort connu est échangé : un sort de plus que le niveau n'en accorde, et au moins un. */
  replacing?: boolean
  /** Sous-classe de la classe : Secrets magiques supplémentaires du Collège du savoir, incantation du Chevalier occulte et de l'Escroc arcanique. */
  subclassId?: number | null
}

async function listClassIdOf(db: Db, slug: string, ruleset: Ruleset): Promise<number | null> {
  const name = classNameFromSlug(slug)
  if (!name) return null
  const [row] = await db
    .select({ id: schema.classes.id })
    .from(schema.classes)
    .where(and(eq(schema.classes.name, name), eq(schema.classes.ruleset, ruleset)))
    .limit(1)
  return row?.id ?? null
}

// Bornes hautes seulement, comme les autres choix : le nombre exact est imposé par l'assistant. Les tables
// sont celles du PHB 2014 ; une classe d'une autre édition n'est pas contrôlée.
export async function learnedSpellsError(db: Db, input: LearnedSpellsInput): Promise<string | null> {
  const { cls, fromLevel, toLevel, spellIds } = input
  const slug = classSlugFromName(cls.name)
  if (!slug || cls.ruleset !== '5') return null
  if (!spellIds.length) return input.replacing ? 'Un sort est remplacé sans sort pour le remplacer.' : null

  if (new Set(spellIds).size !== spellIds.length) return 'Un sort est choisi plusieurs fois.'
  const rows = await db
    .select({ id: schema.spells.id, name: schema.spells.name, level: schema.spells.level, school: schema.magicSchools.name })
    .from(schema.spells)
    .innerJoin(schema.magicSchools, eq(schema.magicSchools.id, schema.spells.schoolId))
    .where(inArray(schema.spells.id, spellIds))
  if (rows.length !== spellIds.length) return 'Un sort choisi est introuvable.'

  const known = new Set(input.alreadyKnownIds)
  const duplicate = rows.find(r => known.has(r.id))
  if (duplicate) return `Le sort « ${duplicate.name} » est déjà sur la fiche.`

  const subclassName = (await subclassNamesById(db, [input.subclassId])).get(input.subclassId ?? -1) ?? null
  const casting = subclassCastingOf(slug, subclassName)
  const listClassId = casting ? await listClassIdOf(db, casting.listClass, cls.ruleset) : cls.id
  if (listClassId == null) return `La liste de sorts de la sous-classe est introuvable.`
  const listed = new Set((await db
    .select({ spellId: schema.spellClasses.spellId })
    .from(schema.spellClasses)
    .where(and(
      eq(schema.spellClasses.classId, listClassId),
      eq(schema.spellClasses.ruleset, cls.ruleset),
      inArray(schema.spellClasses.spellId, spellIds),
    ))).map(r => r.spellId))
  const secrets = magicalSecretsGained(slug, fromLevel, toLevel, subclassName)
  const unlisted = rows.filter(r => !listed.has(r.id))
  const outsideList = unlisted.find(r => r.level === 0) ?? unlisted[secrets.anyList + secrets.extra]
  if (outsideList) return `Le sort « ${outsideList.name} » n'est pas dans la liste de la classe ${cls.name}.`

  const tableSlug = casterSlugOf(slug, subclassName)
  const learned = spellsLearnedOnLevelUp(tableSlug, fromLevel, toLevel)
  const cantrips = rows.filter(r => r.level === 0)
  if (cantrips.length > learned.cantrips) {
    return `Trop de sorts mineurs (${cantrips.length} pour ${learned.cantrips} appris au niveau ${toLevel} de la classe).`
  }

  const leveled = rows.filter(r => r.level > 0)
  const preparedAtCreation = input.atCreation && spellLearningOf(tableSlug) === 'prepared'
  const allowed = learned.spells + secrets.extra + (input.replacing ? 1 : 0)
  if (!preparedAtCreation && leveled.length > allowed) {
    return `Trop de sorts (${leveled.length} pour ${allowed} appris au niveau ${toLevel} de la classe).`
  }
  if (input.replacing && !leveled.length) return 'Un sort est remplacé sans sort de niveau 1 ou plus pour le remplacer.'

  if (casting) {
    const outsideSchools = leveled.filter(r => !casting.schools.includes(r.school))
    const freeSchoolSpells = anySchoolSpellsGained(fromLevel, toLevel) + (input.replacing ? 1 : 0)
    const wrongSchool = outsideSchools[freeSchoolSpells]
    if (wrongSchool) return `Le sort « ${wrongSchool.name} » n'est pas d'une école de la sous-classe (hors sorts d'école libre).`
  }

  const type = effectiveCasterType(cls.spellcastingType, slug, subclassName)
  const maxLevel = type === 'none' ? 0 : maxSpellLevelForLevel(type, toLevel)
  const tooHigh = leveled.find(r => r.level > maxLevel)
  if (tooHigh) return `Le sort « ${tooHigh.name} » (niveau ${tooHigh.level}) dépasse le niveau ${maxLevel} accessible à ce niveau de la classe.`
  return null
}

// Barde, Ensorceleur, Occultiste, Rôdeur, Chevalier occulte, Escroc arcanique : en gagnant un niveau dans
// la classe, on peut remplacer un sort connu de la classe par un autre de sa liste. Les sorts mineurs et les sorts
// octroyés par autre chose (pacte, espèce, don) n'en font pas partie.
export async function replacedSpellError(
  db: Db,
  input: { cls: LearnedSpellsInput['cls'], characterSheetId: number, fromLevel: number, replacedSpellId: number, subclassId?: number | null },
): Promise<string | null> {
  const { cls, characterSheetId, fromLevel, replacedSpellId } = input
  const slug = classSlugFromName(cls.name)
  if (cls.ruleset !== '5' || !slug) return null
  const subclassName = (await subclassNamesById(db, [input.subclassId])).get(input.subclassId ?? -1) ?? null
  if (spellLearningOf(casterSlugOf(slug, subclassName)) !== 'known') return `La classe ${cls.name} ne remplace pas ses sorts connus.`
  if (fromLevel < 1) return `Aucun sort de la classe ${cls.name} à remplacer : elle est rejointe à ce niveau.`

  const [row] = await db
    .select({ level: schema.spells.level, source: schema.characterSpells.source, classId: schema.characterSpells.classId })
    .from(schema.characterSpells)
    .innerJoin(schema.spells, eq(schema.spells.id, schema.characterSpells.spellId))
    .where(and(eq(schema.characterSpells.characterSheetId, characterSheetId), eq(schema.characterSpells.spellId, replacedSpellId)))
    .limit(1)
  if (!row) return `Le sort remplacé n'est pas sur la fiche.`
  if (row.level < 1 || row.source != null || (row.classId != null && row.classId !== cls.id)) {
    return `Le sort remplacé n'est pas un sort connu de la classe ${cls.name}.`
  }
  return null
}
