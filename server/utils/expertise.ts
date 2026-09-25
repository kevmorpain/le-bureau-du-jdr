import { and, eq, sql } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { z } from 'zod'
import * as schema from '~~/server/db/schema'
import { buildCatalog } from '~~/server/utils/catalog'
import { resolveChoices } from '~~/shared/rules/resolve'
import { skillEnum } from '~~/shared/rules/skills'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

export const expertiseSkillsSchema = z.array(skillEnum)
  .refine(skills => new Set(skills).size === skills.length, 'Compétence d\'expertise en double')

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
