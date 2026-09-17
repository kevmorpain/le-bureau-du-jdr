import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import { eq } from 'drizzle-orm'
import { sheetIdFromPath } from '~~/server/utils/sheetIdFromPath'

// Default-deny : toute route `/api/character_sheets/<id>/**` exige une session ET la propriété de la fiche.
// La route collection (sans id) gère sa propre session.
export default defineEventHandler(async (event) => {
  const sheetId = sheetIdFromPath(event.path)
  if (sheetId === null) return

  const { user } = await requireUserSession(event)

  const [row] = await db
    .select({ ownerId: schema.characterSheets.ownerId })
    .from(schema.characterSheets)
    .where(eq(schema.characterSheets.id, sheetId))
    .limit(1)

  if (!row) throw createError({ statusCode: 404, statusMessage: 'Character sheet not found' })
  if (row.ownerId !== user.id) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
})
