import { blob, ensureBlob } from 'hub:blob'
import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'uncrypto'
import {
  PORTRAIT_MAX_SIZE,
  PORTRAIT_TYPES,
  ownedPortraitKey,
  portraitKey,
  portraitUrlFromKey,
} from '~~/server/utils/portraits'

// C'est le serveur qui écrit `portraitUrl` : un client qui disparaîtrait entre l'upload et son auto-save
// laisserait sinon un objet orphelin dans le bucket.
export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const sheetId = Number(id)

  const form = await readFormData(event)
  const file = form.get('file')

  if (!(file instanceof File) || file.size === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Aucun fichier reçu' })
  }

  ensureBlob(file, { maxSize: PORTRAIT_MAX_SIZE, types: Object.keys(PORTRAIT_TYPES) })

  const ext = PORTRAIT_TYPES[file.type]
  if (!ext) {
    throw createError({ statusCode: 400, statusMessage: 'Format d\'image non pris en charge' })
  }

  const [current] = await db
    .select({ portraitUrl: schema.characterSheets.portraitUrl })
    .from(schema.characterSheets)
    .where(eq(schema.characterSheets.id, sheetId))
    .limit(1)

  const key = portraitKey(sheetId, randomUUID(), ext)
  await blob.put(key, file, { contentType: file.type })

  const portraitUrl = portraitUrlFromKey(key)
  await db
    .update(schema.characterSheets)
    .set({ portraitUrl, updatedAt: new Date().toISOString() })
    .where(eq(schema.characterSheets.id, sheetId))

  // Purge de l'ancien objet APRÈS l'écriture : si la suppression échoue, on a au pire un
  // objet orphelin, jamais une fiche qui pointe vers un fichier disparu.
  const previousKey = ownedPortraitKey(current?.portraitUrl, sheetId)
  if (previousKey && previousKey !== key) {
    try {
      await blob.del(previousKey)
    } catch (e) {
      console.error('[portrait] suppression de l\'ancien objet impossible:', previousKey, e)
    }
  }

  return { portraitUrl }
})
