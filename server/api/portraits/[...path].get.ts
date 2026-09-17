import { blob } from 'hub:blob'
import { portraitKeyFromPath } from '~~/server/utils/portraits'

// Route publique : clé non devinable (uuid), jamais listée, forme stricte validée par `portraitKeyFromPath`.
// Cache immuable : un remplacement crée une nouvelle clé.
export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  const key = path ? portraitKeyFromPath(decodeURIComponent(path)) : null

  if (!key) {
    throw createError({ statusCode: 404, statusMessage: 'Portrait introuvable' })
  }

  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

  return blob.serve(event, key)
})
