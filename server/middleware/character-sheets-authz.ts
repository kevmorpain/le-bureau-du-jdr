import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import { eq } from 'drizzle-orm'
import { sheetIdFromPath } from '~~/server/utils/sheetIdFromPath'

// Garde d'autorisation (default-deny) pour tout le sous-arbre
// `/api/character_sheets/<id>/**` : toute route ciblant une fiche précise exige
// une session ET la propriété de la fiche. Les nouvelles routes `[id]` sont donc
// protégées automatiquement, sans intervention. La route collection
// (`/api/character_sheets`, sans id) n'est PAS concernée : elle gère sa propre
// session dans son handler (filtre/owner sur index.get / index.post).
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
