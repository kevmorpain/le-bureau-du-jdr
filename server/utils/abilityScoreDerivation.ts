import { and, eq } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'
import type { AbilityKey } from '~~/shared/rules/abilities'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

export async function deriveAbilityScoreChoices(db: Db, characterSheetId: number): Promise<Partial<Record<AbilityKey, number>>> {
  const rows = await db
    .select({ payload: srcSchema.characterChoices.payload })
    .from(srcSchema.characterChoices)
    .innerJoin(srcSchema.progression, eq(srcSchema.progression.id, srcSchema.characterChoices.progressionId))
    .where(and(
      eq(srcSchema.characterChoices.characterSheetId, characterSheetId),
      eq(srcSchema.progression.kind, 'ability_scores'),
    ))

  const bonuses: Partial<Record<AbilityKey, number>> = {}
  for (const r of rows) {
    const payload = r.payload as Partial<Record<AbilityKey, number>> | null
    if (!payload) continue
    for (const [ability, amount] of Object.entries(payload) as [AbilityKey, number][]) {
      if (typeof amount === 'number') bonuses[ability] = (bonuses[ability] ?? 0) + amount
    }
  }
  return bonuses
}
