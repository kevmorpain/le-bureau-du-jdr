const SHEET_ID_RE = /^\/api\/character_sheets\/(\d+)(?:\/|$|\?)/

/**
 * Extrait l'id de fiche d'un chemin `/api/character_sheets/<id>/**`.
 * Renvoie `null` pour la route collection (`/api/character_sheets`, sans id)
 * ou tout autre chemin — ce qui détermine si le middleware d'autorisation
 * s'applique. Fonction pure (testée unitairement).
 */
export function sheetIdFromPath(path: string): number | null {
  const match = SHEET_ID_RE.exec(path)
  return match ? Number(match[1]) : null
}
