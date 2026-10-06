const KN_API_RE = /^\/api\/ker-nethalas(?:\/|$|\?)/
const KN_CHARACTER_ID_RE = /^\/api\/ker-nethalas\/characters\/(\d+)(?:\/|$|\?)/

export const isKnApiPath = (path: string): boolean => KN_API_RE.test(path)

export function knCharacterIdFromPath(path: string): number | null {
  const match = KN_CHARACTER_ID_RE.exec(path)
  return match ? Number(match[1]) : null
}

// Strict : un segment non entier (`abc`, `12abc`) n'est pas reconnu par `knCharacterIdFromPath`, donc
// sans contrôle de propriété ; il ne doit jamais atteindre une requête par id. Nitro décode le chemin
// avant les middlewares (vérifié sous Node et workerd) : `%31` est contrôlé comme `1`.
export function parseKnCharacterId(raw: string | undefined): number | null {
  return raw !== undefined && /^\d+$/.test(raw) ? Number(raw) : null
}
