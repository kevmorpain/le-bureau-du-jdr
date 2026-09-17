import { db, schema } from 'hub:db'
import { blob } from 'hub:blob'
import { portraitPrefix } from '~~/server/utils/portraits'

export default defineEventHandler(async (event) => {
  // Autorisation assurée par le middleware `character-sheets-authz`.
  const { id } = getRouterParams(event)

  // Les tables enfants sont en `onDelete: 'cascade'`.
  await db
    .delete(schema.characterSheets)
    .where(eq(schema.characterSheets.id, Number(id)))

  // R2 n'a pas de cascade. Purge après le DELETE : un échec ne doit pas bloquer la suppression.
  try {
    const { blobs } = await blob.list({ prefix: portraitPrefix(Number(id)) })
    if (blobs.length) {
      await blob.del(blobs.map(b => b.pathname))
    }
  } catch (e) {
    console.error('[character_sheet delete] purge des portraits impossible:', id, e)
  }

  return { success: true }
})
