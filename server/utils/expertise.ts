import { and, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import { buildCatalog } from '~~/server/utils/catalog'
import { resolveChoices } from '~~/shared/rules/resolve'
import type { Db } from '~~/server/utils/db'

// Le count est CUMULATIF : seul le delta niveau précédent → `newLevel` est dû. Même projection que le
// level-up front (useCatalog.choicesForClassLevel), niveau 0 inclus pour une classe multiclassée.
export async function expertiseGainedAtLevel(db: Db, classId: number, newLevel: number): Promise<number> {
  const catalog = await buildCatalog(db, { classIds: [classId] })
  const countAt = (level: number) =>
    resolveChoices({ classLevels: { [classId]: level } }, catalog).choices.find(c => c.kind === 'expertise')?.count ?? 0
  return Math.max(0, countAt(newLevel) - countAt(newLevel - 1))
}

export async function resolveExpertiseProgressionId(db: Db, classId: number): Promise<number | null> {
  const [prog] = await db
    .select({ id: schema.progression.id })
    .from(schema.progression)
    .innerJoin(schema.features, eq(schema.features.id, schema.progression.featureId))
    .where(and(eq(schema.progression.kind, 'expertise'), eq(schema.features.classId, classId)))
    .limit(1)
  return prog?.id ?? null
}

// Le choix seul est stocké : l'expertise en est dérivée à la lecture (deriveChoiceProficiencies).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function expertiseWriteStmts(db: Db, characterSheetId: number, progressionId: number, skillKeys: string[]): any[] {
  return skillKeys.map(skillKey => db.insert(schema.characterChoices)
    .values({ characterSheetId, progressionId, selectedValue: skillKey })
    .onConflictDoNothing())
}
