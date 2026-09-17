// Reprise de navigation en PWA installée : quand la tablette manque de mémoire, l'OS tue le
// processus et relance l'app à froid sur « / » (le `start_url` du manifeste). Aucune API web
// n'empêche cette éviction — d'où la mémorisation de la dernière route consultée.

const STORAGE_KEY = 'bjdr:last-route'

/** Au-delà de ce délai, la partie est finie : on repart de l'accueil. */
export const LAST_ROUTE_MAX_AGE_MS = 24 * 60 * 60 * 1000

/** Pages transitoires : ni mémorisées, ni effaçantes (le login est un aller-retour). */
const TRANSIENT_PREFIXES = ['/login', '/auth']

export type RouteMemoryAction = 'save' | 'clear' | 'ignore'

/**
 * Ce qu'il faut faire de la mémoire de navigation quand on arrive sur `fullPath`. Aller
 * volontairement à l'accueil l'efface : sinon le prochain démarrage ramènerait sur la fiche que
 * l'utilisateur venait de quitter.
 */
export function routeMemoryAction(fullPath: string): RouteMemoryAction {
  const path = fullPath.split(/[?#]/)[0] ?? fullPath
  if (path === '/') return 'clear'
  if (TRANSIENT_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/'))) return 'ignore'
  return 'save'
}

/** Renvoie `null` si l'entrée est illisible, périmée ou non restaurable. Fonction pure. */
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

export function readLastRoute(): string | null {
  try {
    return parseStoredRoute(localStorage.getItem(STORAGE_KEY), Date.now())
  } catch {
    return null
  }
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false

  // iOS/iPadOS n'expose pas `display-mode` sur les anciennes versions.
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) return true

  return ['standalone', 'fullscreen', 'minimal-ui']
    .some(mode => window.matchMedia(`(display-mode: ${mode})`).matches)
}
