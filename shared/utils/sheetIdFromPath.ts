const SHEET_ID_RE = /^\/api\/character_sheets\/(\d+)(?:\/|$|\?)/

export function sheetIdFromPath(path: string): number | null {
  const match = SHEET_ID_RE.exec(path)
  return match ? Number(match[1]) : null
}
