import { describe, it, expect } from 'vitest'
import { saveStateOf } from '../../app/composables/useSaveState'
import { sheetViewOf, sheetViewQuery } from '../../app/utils/sheetViews'

const calm = { conflict: false, online: true, syncing: false, pending: 0, autoSave: 'idle' } as const

describe('saveStateOf — un seul état pour l\'indicateur de sauvegarde', () => {
  it('rien en cours : enregistré, que l\'autosave vienne de finir ou non', () => {
    expect(saveStateOf(calm)).toBe('saved')
    expect(saveStateOf({ ...calm, autoSave: 'saved' })).toBe('saved')
  })

  it('l\'autosave en cours ou en échec', () => {
    expect(saveStateOf({ ...calm, autoSave: 'saving' })).toBe('saving')
    expect(saveStateOf({ ...calm, autoSave: 'error' })).toBe('failed')
  })

  it('une file en attente l\'emporte sur un échec de l\'autosave, et le rejeu sur la file', () => {
    expect(saveStateOf({ ...calm, pending: 3, autoSave: 'error' })).toBe('pending')
    expect(saveStateOf({ ...calm, pending: 3, syncing: true })).toBe('saving')
  })

  it('hors ligne passe avant la file, le conflit avant tout', () => {
    expect(saveStateOf({ ...calm, online: false, pending: 3, syncing: true })).toBe('offline')
    expect(saveStateOf({ ...calm, conflict: true, online: false, pending: 3 })).toBe('conflict')
  })
})

describe('vues de la nouvelle fiche dans l\'adresse', () => {
  it('lit la vue du paramètre, En jeu par défaut et pour une valeur inconnue', () => {
    expect(sheetViewOf('inventaire')).toBe('inventory')
    expect(sheetViewOf('reglages')).toBe('settings')
    expect(sheetViewOf(undefined)).toBe('play')
    expect(sheetViewOf('nimporte')).toBe('play')
  })

  it('En jeu n\'a pas de paramètre, les autres vues ont le leur', () => {
    expect(sheetViewQuery('play')).toEqual({})
    expect(sheetViewQuery('grimoire')).toEqual({ vue: 'grimoire' })
  })
})
