import { useBinding } from '~~/server/utils/bindings'
import { portraitKeyFromPath } from '~~/server/utils/portraits'

// Route publique : clé non devinable (uuid), jamais listée, forme stricte validée par `portraitKeyFromPath`.
// Cache immuable : un remplacement crée une nouvelle clé.
export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  const key = path ? portraitKeyFromPath(decodeURIComponent(path)) : null
  const object = key ? await useBinding('BLOB').get(key) : null

  if (!object) {
    throw createError({ statusCode: 404, statusMessage: 'Portrait introuvable' })
  }

  setHeaders(event, {
    'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
    'Content-Length': object.size,
    'ETag': object.httpEtag,
    'Cache-Control': 'public, max-age=31536000, immutable',
  })

  return object.body
})
