import { and, eq } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as schema from '~~/server/db/schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

/** Progression `skill` (choix de compétences) de la classe, si seedée. Créée par migration 0099 en prod. */
export async function resolveClassSkillProgressionId(db: Db, classId: number): Promise<number | null> {
  const [prog] = await db
    .select({ id: schema.progression.id })
    .from(schema.progression)
    .innerJoin(schema.features, eq(schema.features.id, schema.progression.featureId))
    .where(and(eq(schema.progression.kind, 'skill'), eq(schema.features.classId, classId)))
    .limit(1)
  return prog?.id ?? null
}

// Pur dérivé : le pick n'est stocké QU'EN `character_choices` (la maîtrise 'proficient' est dérivée
// à la lecture, cf. deriveClassSkills). Pas de matérialisation character_skills — la progression est
// garantie par la migration 0099, donc `progressionId` est non-null hors base de test non seedée.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function classSkillChoiceWriteStmts(db: Db, characterSheetId: number, progressionId: number, skillKeys: string[]): any[] {
  return skillKeys.map(skillKey =>
    db.insert(schema.characterChoices)
      .values({ characterSheetId, progressionId, selectedValue: skillKey })
      .onConflictDoNothing())
}
