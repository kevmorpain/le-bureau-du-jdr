import { db, schema } from '~~/server/utils/db'
import { useBinding } from '~~/server/utils/bindings'
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
    const bucket = useBinding('BLOB')
    const { objects } = await bucket.list({ prefix: portraitPrefix(Number(id)) })
    if (objects.length) {
      await bucket.delete(objects.map(o => o.key))
    }
  } catch (e) {
    console.error('[character_sheet delete] purge des portraits impossible:', id, e)
  }

  return { success: true }
})
