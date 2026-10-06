import { describe, it, expect } from 'vitest'
import { sheetIdFromPath } from '../../shared/utils/sheetIdFromPath'
import { requiresAuth } from '../../app/utils/requiresAuth'
import { isKnApiPath, knCharacterIdFromPath, parseKnCharacterId } from '../../server/utils/knPaths'

describe('garde serveur Ker Nethalas', () => {
  it('couvre tout `/api/ker-nethalas`, collection comprise', () => {
    expect(isKnApiPath('/api/ker-nethalas')).toBe(true)
    expect(isKnApiPath('/api/ker-nethalas/characters')).toBe(true)
    expect(isKnApiPath('/api/ker-nethalas/characters/12?x=1')).toBe(true)
    expect(isKnApiPath('/api/ker-nethalas?x=1')).toBe(true)
  })

  it('ne déborde pas sur des préfixes voisins', () => {
    expect(isKnApiPath('/api/ker-nethalasx')).toBe(false)
    expect(isKnApiPath('/api/character_sheets/12')).toBe(false)
    expect(isKnApiPath('/ker-nethalas')).toBe(false)
  })

  it('extrait l\'id des routes ciblant un survivant', () => {
    expect(knCharacterIdFromPath('/api/ker-nethalas/characters/12')).toBe(12)
    expect(knCharacterIdFromPath('/api/ker-nethalas/characters/12/')).toBe(12)
    expect(knCharacterIdFromPath('/api/ker-nethalas/characters/12/runs/3')).toBe(12)
    expect(knCharacterIdFromPath('/api/ker-nethalas/characters/12?foo=bar')).toBe(12)
  })

  it('ignore la collection et les ids qui ne sont pas des entiers purs', () => {
    expect(knCharacterIdFromPath('/api/ker-nethalas/characters')).toBeNull()
    expect(knCharacterIdFromPath('/api/ker-nethalas/characters/')).toBeNull()
    expect(knCharacterIdFromPath('/api/ker-nethalas/characters/12abc')).toBeNull()
    expect(knCharacterIdFromPath('/api/ker-nethalas/characters/%31%32')).toBeNull()
    expect(knCharacterIdFromPath('/api/ker-nethalas/characters/abc')).toBeNull()
  })

  it('refuse côté handler les ids que le middleware ne reconnaît pas', () => {
    expect(parseKnCharacterId('12')).toBe(12)
    expect(parseKnCharacterId('12abc')).toBeNull()
    expect(parseKnCharacterId('%31%32')).toBeNull()
    expect(parseKnCharacterId('-1')).toBeNull()
    expect(parseKnCharacterId('')).toBeNull()
    expect(parseKnCharacterId(undefined)).toBeNull()
  })
})

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
    expect(requiresAuth('/ker-nethalas')).toBe(true)
    expect(requiresAuth('/ker-nethalas/12')).toBe(true)
  })

  it('laisse le reste public', () => {
    expect(requiresAuth('/')).toBe(false)
    expect(requiresAuth('/login')).toBe(false)
    expect(requiresAuth('/mentions-legales')).toBe(false)
    expect(requiresAuth('/confidentialite')).toBe(false)
    expect(requiresAuth('/spells')).toBe(false)
    expect(requiresAuth('/spells/spellbook')).toBe(false)
    expect(requiresAuth('/spells/newx')).toBe(false)
    expect(requiresAuth('/ker-nethalasx')).toBe(false)
  })
})
