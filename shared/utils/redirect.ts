// Destination par défaut après connexion (l'espace personnages).
export const DEFAULT_POST_LOGIN_REDIRECT = '/characters'

// Nom du cookie qui transporte la destination voulue à travers l'aller-retour
// OAuth : le paramètre `?redirect=` de `/login` ne survit pas au round-trip vers
// le provider (le callback revient sur l'URI enregistrée, sans notre query), on
// le persiste donc côté navigateur le temps du flux.
export const POST_LOGIN_REDIRECT_COOKIE = 'auth-redirect'

/**
 * Garde anti-« open redirect ». On ne renvoie l'utilisateur QUE vers un chemin
 * interne absolu ; toute autre valeur retombe sur `fallback`. Fonction pure,
 * utilisée côté client (page login) ET serveur (callbacks OAuth) — d'où sa place
 * dans `shared/`.
 */
export function sanitizeRedirect(
  target: unknown,
  fallback: string = DEFAULT_POST_LOGIN_REDIRECT,
): string {
  if (typeof target !== 'string' || target.length === 0) return fallback
  // Chemin interne absolu uniquement : un seul « / » en tête.
  if (!target.startsWith('/')) return fallback
  // Rejette « //evil.com » et « /\evil.com » (redirections protocol-relative).
  if (target.startsWith('//') || target.startsWith('/\\')) return fallback
  // Pas de caractères de contrôle (anti-injection d'en-tête sur `Location`).
  if ([...target].some(ch => ch.charCodeAt(0) < 0x20)) return fallback
  return target
}
