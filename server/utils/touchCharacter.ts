import type { H3Event } from 'h3'
import { setResponseHeader } from 'h3'
import { db, schema } from '~~/server/utils/db'
import { eq } from 'drizzle-orm'
import { SHEET_VERSION_HEADER } from '~~/shared/utils/sheetVersion'

/**
 * Nouvelle valeur de `character_sheets.updated_at`, annoncée au client dans la réponse : sans elle, il
 * ne reconnaît pas sa propre écriture et prend la suivante pour un changement venu d'un autre appareil.
 * Toute écriture de cette colonne passe par ici.
 */
export function stampSheetVersion(event: H3Event): string {
  const version = new Date().toISOString()
  setResponseHeader(event, SHEET_VERSION_HEADER, version)
  return version
}

/** À appeler après toute mutation de sous-ressource : fiabilise le garde-fou anti-écrasement de la synchro hors-ligne. */
export async function touchCharacterSheet(event: H3Event, characterSheetId: number): Promise<void> {
  if (!Number.isFinite(characterSheetId)) return
  await db
    .update(schema.characterSheets)
    .set({ updatedAt: stampSheetVersion(event) })
    .where(eq(schema.characterSheets.id, characterSheetId))
}
