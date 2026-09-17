import { and, eq } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

export async function deriveWeaponMasteries(db: Db, characterSheetId: number): Promise<string[]> {
  const rows = await db
    .select({ value: srcSchema.characterChoices.selectedValue })
    .from(srcSchema.characterChoices)
    .innerJoin(srcSchema.progression, eq(srcSchema.progression.id, srcSchema.characterChoices.progressionId))
    .where(and(
      eq(srcSchema.characterChoices.characterSheetId, characterSheetId),
      eq(srcSchema.progression.kind, 'weapon_mastery'),
    ))
  return rows.map(r => r.value).filter((v): v is string => typeof v === 'string')
}
