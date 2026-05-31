import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

/**
 * Met à jour `character_sheets.updatedAt`. À appeler après toute mutation de sous-ressource
 * pour fiabiliser le garde-fou anti-écrasement de la synchro hors-ligne : la fiche est ainsi
 * « touchée » quel que soit le champ modifié, ce qui permet de détecter une édition faite
 * depuis un autre appareil pendant qu'une tablette accumulait des modifs hors-ligne.
 */
export async function touchCharacterSheet(characterSheetId: number): Promise<void> {
  if (!Number.isFinite(characterSheetId)) return
  await db
    .update(schema.characterSheets)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(schema.characterSheets.id, characterSheetId))
}
