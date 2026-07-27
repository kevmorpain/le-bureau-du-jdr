// Reprise de navigation en PWA installée.
//
// Une PWA en mode standalone est un processus comme un autre : quand la tablette
// manque de mémoire (Chrome, Discord… ouverts à côté), l'OS le tue en arrière-plan.
// Au retour, il n'y a rien à réveiller — le système relance l'app à froid sur le
// `start_url` du manifeste, c'est-à-dire « / ». D'où le retour à l'accueil au lieu
// de la fiche qu'on regardait.
//
// Aucune API web ne permet d'empêcher cette éviction. On mémorise donc la dernière
// route consultée pour y revenir soi-même au démarrage à froid.

const STORAGE_KEY = 'bjdr:last-route'

/** Au-delà de ce délai, la partie est finie : on repart de l'accueil. */
export const LAST_ROUTE_MAX_AGE_MS = 24 * 60 * 60 * 1000

/** Pages transitoires : ni mémorisées, ni effaçantes (le login est un aller-retour). */
const TRANSIENT_PREFIXES = ['/login', '/auth']

export type RouteMemoryAction = 'save' | 'clear' | 'ignore'

/**
 * Ce qu'il faut faire de la mémoire de navigation quand on arrive sur `fullPath`.
 * Aller volontairement à l'accueil efface la mémoire — sinon le prochain démarrage
 * ramènerait sur la fiche que l'utilisateur venait justement de quitter.
 * Fonction pure (testée unitairement).
 */
export function routeMemoryAction(fullPath: string): RouteMemoryAction {
  const path = fullPath.split(/[?#]/)[0] ?? fullPath
  if (path === '/') return 'clear'
  if (TRANSIENT_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/'))) return 'ignore'
  return 'save'
}

/**
 * Relit une entrée sérialisée et renvoie la route à restaurer, ou `null` si elle est
 * illisible, périmée ou non restaurable. Fonction pure (testée unitairement).
 */
export function parseStoredRoute(
  raw: string | null,
  now: number,
  maxAge: number = LAST_ROUTE_MAX_AGE_MS,
): string | null {
  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const { path, at } = parsed as { path?: unknown, at?: unknown }

  if (typeof path !== 'string' || typeof at !== 'number' || !Number.isFinite(at)) return null
  // Chemin interne uniquement : `//host` serait interprété comme une URL absolue.
  if (!path.startsWith('/') || path.startsWith('//')) return null
  if (routeMemoryAction(path) !== 'save') return null
  if (now - at > maxAge) return null

  return path
}

/** Mémorise (ou oublie) la route courante. Silencieux si le stockage est indisponible. */
export function saveLastRoute(fullPath: string): void {
  const action = routeMemoryAction(fullPath)
  if (action === 'ignore') return

  try {
    if (action === 'clear') {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ path: fullPath, at: Date.now() }))
  } catch {
    // Navigation privée, quota plein : la reprise est un confort, pas une fonctionnalité critique.
  }
}

/** Dernière route consultée si elle est encore valable, sinon `null`. */
export function readLastRoute(): string | null {
  try {
    return parseStoredRoute(localStorage.getItem(STORAGE_KEY), Date.now())
  } catch {
    return null
  }
}

/** Vrai si l'app tourne en PWA installée plutôt que dans un onglet de navigateur. */
export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false

  // iOS/iPadOS n'expose pas `display-mode` sur les anciennes versions.
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) return true

  return ['standalone', 'fullscreen', 'minimal-ui']
    .some(mode => window.matchMedia(`(display-mode: ${mode})`).matches)
}
