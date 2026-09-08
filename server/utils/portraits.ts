/**
 * Portraits de personnage stockés dans R2 (`hub:blob`, bucket `le-bureau-du-jdr-media`).
 *
 * Un seul endroit décrit la forme des clés et l'URL qui les sert, pour que l'upload,
 * la purge et la route de service ne puissent pas diverger :
 *
 *   clé R2 : `portraits/<sheetId>/<uuid>.<ext>`
 *   URL    : `/api/portraits/<sheetId>/<uuid>.<ext>`   (chemin relatif, same-origin)
 *
 * L'URL est **publique** : elle n'est pas devinable (uuid) et n'est jamais listée, ce qui
 * permet de la mettre en cache immuablement (l'uuid change à chaque remplacement) et au
 * service worker de servir le portrait hors-ligne. Aucune énumération n'est exposée.
 *
 * Fonctions pures (testées dans `test/unit/portraits.test.ts`) : elles ne touchent ni au
 * stockage ni à la base.
 */

/** Types d'image acceptés à l'upload → extension de fichier. */
export const PORTRAIT_TYPES: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

/** Taille maximale acceptée par l'endpoint (le client réduit avant d'envoyer). */
export const PORTRAIT_MAX_SIZE = '2MB'

/** Préfixe des clés R2 d'une fiche — sert aussi de filtre de purge. */
export const portraitPrefix = (sheetId: number): string => `portraits/${sheetId}/`

/** `<sheetId>/<uuid>.<ext>` : la partie variable, commune à la clé et à l'URL. */
const PORTRAIT_PATH_RE = /^(\d+)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|png)$/

export const portraitKey = (sheetId: number, uuid: string, ext: string): string =>
  `${portraitPrefix(sheetId)}${uuid}.${ext}`

export const portraitUrlFromKey = (key: string): string => `/api/portraits/${key.replace(/^portraits\//, '')}`

/**
 * Clé R2 correspondant au chemin demandé sur `/api/portraits/**`, ou `null` si le chemin
 * ne respecte pas la forme attendue. C'est le garde-fou anti-traversée : tout ce qui n'est
 * pas exactement `<id>/<uuid>.<ext>` est refusé, `..` compris.
 */
export const portraitKeyFromPath = (path: string): string | null =>
  PORTRAIT_PATH_RE.test(path) ? `portraits/${path}` : null

/**
 * Clé R2 d'un portrait **appartenant à cette fiche**, à partir de la valeur stockée en
 * base. Renvoie `null` pour une URL externe (portrait collé à la main), pour une URL
 * malformée, et pour un portrait qui appartiendrait à une AUTRE fiche — de sorte qu'un
 * remplacement ne puisse jamais supprimer l'objet d'autrui.
 */
export const ownedPortraitKey = (portraitUrl: string | null | undefined, sheetId: number): string | null => {
  const path = (portraitUrl ?? '').trim().replace(/^\/api\/portraits\//, '')
  if (path === (portraitUrl ?? '').trim()) return null // le préfixe n'était pas là → URL externe
  const key = portraitKeyFromPath(path)
  if (!key) return null
  return key.startsWith(portraitPrefix(sheetId)) ? key : null
}
