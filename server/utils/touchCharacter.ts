import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

/** À appeler après toute mutation de sous-ressource : fiabilise le garde-fou anti-écrasement de la synchro hors-ligne. */
export async function touchCharacterSheet(characterSheetId: number): Promise<void> {
  if (!Number.isFinite(characterSheetId)) return
  await db
    .update(schema.characterSheets)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(schema.characterSheets.id, characterSheetId))
}
