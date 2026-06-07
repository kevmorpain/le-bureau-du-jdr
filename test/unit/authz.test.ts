import { describe, it, expect } from 'vitest'
import { sheetIdFromPath } from '../../server/utils/sheetIdFromPath'
import { requiresAuth } from '../../app/utils/requiresAuth'

describe('sheetIdFromPath (garde serveur)', () => {
  it('extrait l\'id des routes ciblant une fiche', () => {
    expect(sheetIdFromPath('/api/character_sheets/12')).toBe(12)
    expect(sheetIdFromPath('/api/character_sheets/12/spells')).toBe(12)
    expect(sheetIdFromPath('/api/character_sheets/12/inventory/3')).toBe(12)
    expect(sheetIdFromPath('/api/character_sheets/12?foo=bar')).toBe(12)
  })

  it('ignore la collection et les chemins hors périmètre (pas de faux positif)', () => {
    expect(sheetIdFromPath('/api/character_sheets')).toBeNull()
    expect(sheetIdFromPath('/api/character_sheets/')).toBeNull()
    expect(sheetIdFromPath('/api/spells')).toBeNull()
    expect(sheetIdFromPath('/characters/12')).toBeNull()
  })
})

describe('requiresAuth (garde de navigation)', () => {
  it('protège la gestion des persos et la création de contenu', () => {
    expect(requiresAuth('/characters')).toBe(true)
    expect(requiresAuth('/characters/12')).toBe(true)
    expect(requiresAuth('/characters/new')).toBe(true)
    expect(requiresAuth('/spells/new')).toBe(true)
  })

  it('laisse le reste public', () => {
    expect(requiresAuth('/')).toBe(false)
    expect(requiresAuth('/login')).toBe(false)
    expect(requiresAuth('/spells')).toBe(false)
    expect(requiresAuth('/spells/spellbook')).toBe(false)
    expect(requiresAuth('/spells/newx')).toBe(false)
  })
})
