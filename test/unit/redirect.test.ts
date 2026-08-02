import { describe, it, expect } from 'vitest'
import { sanitizeRedirect, DEFAULT_POST_LOGIN_REDIRECT } from '../../shared/utils/redirect'

describe('sanitizeRedirect (garde anti open-redirect)', () => {
  it('laisse passer un chemin interne absolu', () => {
    expect(sanitizeRedirect('/characters/new')).toBe('/characters/new')
    expect(sanitizeRedirect('/characters/12?foo=bar')).toBe('/characters/12?foo=bar')
    expect(sanitizeRedirect('/spells')).toBe('/spells')
  })

  it('retombe sur le défaut pour une destination externe ou protocol-relative', () => {
    expect(sanitizeRedirect('//evil.com')).toBe(DEFAULT_POST_LOGIN_REDIRECT)
    expect(sanitizeRedirect('/\\evil.com')).toBe(DEFAULT_POST_LOGIN_REDIRECT)
    expect(sanitizeRedirect('https://evil.com')).toBe(DEFAULT_POST_LOGIN_REDIRECT)
    expect(sanitizeRedirect('javascript:alert(1)')).toBe(DEFAULT_POST_LOGIN_REDIRECT)
  })

  it('retombe sur le défaut pour une valeur vide, non-string ou avec caractères de contrôle', () => {
    expect(sanitizeRedirect('')).toBe(DEFAULT_POST_LOGIN_REDIRECT)
    expect(sanitizeRedirect(undefined)).toBe(DEFAULT_POST_LOGIN_REDIRECT)
    expect(sanitizeRedirect(['/a', '/b'])).toBe(DEFAULT_POST_LOGIN_REDIRECT)
    expect(sanitizeRedirect('/characters\nSet-Cookie: x=1')).toBe(DEFAULT_POST_LOGIN_REDIRECT)
  })

  it('respecte un fallback personnalisé', () => {
    expect(sanitizeRedirect('//evil.com', '/')).toBe('/')
  })
})
