import { and, eq, sql } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as schema from '~~/server/db/schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

export async function resolveExpertiseProgressionId(db: Db, classId: number): Promise<number | null> {
  const [prog] = await db
    .select({ id: schema.progression.id })
    .from(schema.progression)
    .innerJoin(schema.features, eq(schema.features.id, schema.progression.featureId))
    .where(and(eq(schema.progression.kind, 'expertise'), eq(schema.features.classId, classId)))
    .limit(1)
  return prog?.id ?? null
}

// L'upsert ÉLÈVE une maîtrise existante à 'expert' sans jamais la rétrograder. character_choices
// n'est écrit QUE si la progression existe : entre le déploiement et le re-seed prod des
// progressions Roublard/Barde, la compétence reste doublée, sans sa source de décision.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function expertiseWriteStmts(db: Db, characterSheetId: number, progressionId: number | null, skillKeys: string[]): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stmts: any[] = []
  for (const skillKey of skillKeys) {
    stmts.push(db.insert(schema.characterSkills)
      .values({ characterSheetId, skillKey, proficiencyLevel: 'expert' as const, source: 'class' as const, isOverride: false })
      .onConflictDoUpdate({
        target: [schema.characterSkills.characterSheetId, schema.characterSkills.skillKey, schema.characterSkills.source],
        set: { proficiencyLevel: sql`'expert'` },
      }))
    if (progressionId != null) {
      stmts.push(db.insert(schema.characterChoices)
        .values({ characterSheetId, progressionId, selectedValue: skillKey })
        .onConflictDoNothing())
    }
  }
  return stmts
}
