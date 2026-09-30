import { and, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { AbilityKey } from '~~/shared/rules/abilities'
import type { Db } from '~~/server/utils/db'

export async function deriveAbilityScoreChoices(db: Db, characterSheetId: number): Promise<Partial<Record<AbilityKey, number>>> {
  const rows = await db
    .select({ payload: schema.characterChoices.payload })
    .from(schema.characterChoices)
    .innerJoin(schema.progression, eq(schema.progression.id, schema.characterChoices.progressionId))
    .where(and(
      eq(schema.characterChoices.characterSheetId, characterSheetId),
      eq(schema.progression.kind, 'ability_scores'),
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
