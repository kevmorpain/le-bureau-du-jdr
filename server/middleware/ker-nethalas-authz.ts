import { eq } from 'drizzle-orm'
import { db, schema } from '~~/server/utils/db'
import { isKnApiPath, knCharacterIdFromPath } from '~~/server/utils/knPaths'

// Default-deny : toute route `/api/ker-nethalas/**` exige une session, y compris celles ajoutées plus tard ;
// celles qui ciblent un survivant exigent en plus d'en être le propriétaire.
export default defineEventHandler(async (event) => {
  if (!isKnApiPath(event.path)) return

  const { user } = await requireUserSession(event)

  const characterId = knCharacterIdFromPath(event.path)
  if (characterId === null) return

  const [row] = await db
    .select({ ownerId: schema.knCharacters.ownerId })
    .from(schema.knCharacters)
    .where(eq(schema.knCharacters.id, characterId))
    .limit(1)

  if (!row) throw createError({ statusCode: 404, statusMessage: 'Character not found' })
  if (row.ownerId !== user.id) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
})
