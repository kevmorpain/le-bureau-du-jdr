import { and, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'

export async function deriveWeaponMasteries(db: Db, characterSheetId: number): Promise<string[]> {
  const rows = await db
    .select({ value: schema.characterChoices.selectedValue })
    .from(schema.characterChoices)
    .innerJoin(schema.progression, eq(schema.progression.id, schema.characterChoices.progressionId))
    .where(and(
      eq(schema.characterChoices.characterSheetId, characterSheetId),
      eq(schema.progression.kind, 'weapon_mastery'),
    ))
  return rows.map(r => r.value).filter((v): v is string => typeof v === 'string')
}
