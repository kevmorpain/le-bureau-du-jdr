export const DEFAULT_POST_LOGIN_REDIRECT = '/characters'

// Transporté par cookie (pas par query) car le `?redirect=` ne survit pas à l'aller-retour OAuth.
export const POST_LOGIN_REDIRECT_COOKIE = 'auth-redirect'

// Garde anti « open redirect » : n'autorise qu'un chemin interne absolu, sinon `fallback`.
// Pure → partagée client (login) et serveur (callbacks OAuth).
export function sanitizeRedirect(
  target: unknown,
  fallback: string = DEFAULT_POST_LOGIN_REDIRECT,
): string {
  if (typeof target !== 'string' || target.length === 0) return fallback
  if (!target.startsWith('/')) return fallback
  // Rejette « //evil.com » et « /\evil.com » (redirections protocol-relative).
  if (target.startsWith('//') || target.startsWith('/\\')) return fallback
  // Pas de caractères de contrôle (anti-injection d'en-tête `Location`).
  if ([...target].some(ch => ch.charCodeAt(0) < 0x20)) return fallback
  return target
}
