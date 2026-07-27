import { describe, it, expect } from 'vitest'
import { routeMemoryAction, parseStoredRoute, LAST_ROUTE_MAX_AGE_MS } from '../../app/utils/lastRoute'

const NOW = 1_700_000_000_000

describe('routeMemoryAction (quoi mémoriser)', () => {
  it('mémorise les pages de contenu, query comprise', () => {
    expect(routeMemoryAction('/characters/12')).toBe('save')
    expect(routeMemoryAction('/characters/12/level-up')).toBe('save')
    expect(routeMemoryAction('/characters/new')).toBe('save')
    expect(routeMemoryAction('/spells?level=3')).toBe('save')
    expect(routeMemoryAction('/spells/spellbook#feu')).toBe('save')
  })

  it('efface la mémoire quand on retourne volontairement à l\'accueil', () => {
    expect(routeMemoryAction('/')).toBe('clear')
    expect(routeMemoryAction('/?foo=bar')).toBe('clear')
  })

  it('ignore les pages transitoires du parcours de connexion', () => {
    expect(routeMemoryAction('/login')).toBe('ignore')
    expect(routeMemoryAction('/login?error=oauth')).toBe('ignore')
    expect(routeMemoryAction('/auth/discord')).toBe('ignore')
  })

  it('ne confond pas un préfixe transitoire avec un segment plus long', () => {
    expect(routeMemoryAction('/logins')).toBe('save')
  })
})

describe('parseStoredRoute (relecture de la mémoire)', () => {
  const stored = (path: string, at = NOW) => JSON.stringify({ path, at })

  it('restaure une route récente', () => {
    expect(parseStoredRoute(stored('/characters/12'), NOW)).toBe('/characters/12')
    expect(parseStoredRoute(stored('/spells?level=3'), NOW)).toBe('/spells?level=3')
  })

  it('restaure encore juste avant l\'expiration, plus après', () => {
    const almost = NOW - LAST_ROUTE_MAX_AGE_MS
    expect(parseStoredRoute(stored('/characters/12', almost), NOW)).toBe('/characters/12')
    expect(parseStoredRoute(stored('/characters/12', almost - 1), NOW)).toBeNull()
  })

  it('ignore une entrée absente, illisible ou mal formée', () => {
    expect(parseStoredRoute(null, NOW)).toBeNull()
    expect(parseStoredRoute('', NOW)).toBeNull()
    expect(parseStoredRoute('pas du json', NOW)).toBeNull()
    expect(parseStoredRoute('"/characters/12"', NOW)).toBeNull()
    expect(parseStoredRoute(JSON.stringify({ path: '/characters/12' }), NOW)).toBeNull()
    expect(parseStoredRoute(JSON.stringify({ at: NOW }), NOW)).toBeNull()
    expect(parseStoredRoute(JSON.stringify({ path: '/characters/12', at: 'hier' }), NOW)).toBeNull()
  })

  it('refuse toute cible qui n\'est pas un chemin interne', () => {
    expect(parseStoredRoute(stored('//evil.example/x'), NOW)).toBeNull()
    expect(parseStoredRoute(stored('https://evil.example/x'), NOW)).toBeNull()
    expect(parseStoredRoute(stored('characters/12'), NOW)).toBeNull()
  })

  it('refuse les routes non restaurables', () => {
    expect(parseStoredRoute(stored('/'), NOW)).toBeNull()
    expect(parseStoredRoute(stored('/login'), NOW)).toBeNull()
  })
})
