import { and, eq } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as schema from '~~/server/db/schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

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
