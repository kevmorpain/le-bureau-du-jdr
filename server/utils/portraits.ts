// clé R2 : `portraits/<sheetId>/<uuid>.<ext>` — URL : `/api/portraits/<sheetId>/<uuid>.<ext>`

export const PORTRAIT_TYPES: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

/** Taille maximale acceptée par l'endpoint (le client réduit avant d'envoyer). */
export const PORTRAIT_MAX_SIZE = '2MB'

/** Sert aussi de filtre de purge. */
export const portraitPrefix = (sheetId: number): string => `portraits/${sheetId}/`

const PORTRAIT_PATH_RE = /^(\d+)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|png)$/

export const portraitKey = (sheetId: number, uuid: string, ext: string): string =>
  `${portraitPrefix(sheetId)}${uuid}.${ext}`

export const portraitUrlFromKey = (key: string): string => `/api/portraits/${key.replace(/^portraits\//, '')}`

/** Garde-fou anti-traversée : tout ce qui n'est pas exactement `<id>/<uuid>.<ext>` est refusé. */
export const portraitKeyFromPath = (path: string): string | null =>
  PORTRAIT_PATH_RE.test(path) ? `portraits/${path}` : null

/** `null` pour une URL externe ou le portrait d'une AUTRE fiche : un remplacement ne supprime jamais l'objet d'autrui. */
export const ownedPortraitKey = (portraitUrl: string | null | undefined, sheetId: number): string | null => {
  const path = (portraitUrl ?? '').trim().replace(/^\/api\/portraits\//, '')
  if (path === (portraitUrl ?? '').trim()) return null // le préfixe n'était pas là → URL externe
  const key = portraitKeyFromPath(path)
  if (!key) return null
  return key.startsWith(portraitPrefix(sheetId)) ? key : null
}
