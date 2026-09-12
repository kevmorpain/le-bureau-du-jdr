import { blob } from 'hub:blob'
import { portraitKeyFromPath } from '~~/server/utils/portraits'

/**
 * Sert un portrait depuis R2. Route **publique** : la clé porte un uuid, elle n'est jamais
 * listée, et rien d'autre que `<sheetId>/<uuid>.<ext>` n'est accepté (`portraitKeyFromPath`
 * refuse toute autre forme, `..` compris).
 *
 * Cache immuable : un remplacement crée une nouvelle clé, donc une nouvelle URL — il n'y a
 * jamais à invalider. C'est aussi ce qui permet au service worker de garder le portrait
 * disponible hors-ligne.
 */
export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  const key = path ? portraitKeyFromPath(decodeURIComponent(path)) : null

  if (!key) {
    throw createError({ statusCode: 404, statusMessage: 'Portrait introuvable' })
  }

  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

  return blob.serve(event, key)
})
