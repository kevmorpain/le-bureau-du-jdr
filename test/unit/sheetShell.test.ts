import { describe, it, expect } from 'vitest'
import { getSaveState } from '../../app/composables/useSaveState'
import { PHONE_MORE_VIEWS, PHONE_TAB_VIEWS, SHEET_VIEWS, getSheetView, getSheetViewQuery } from '../../app/utils/sheetViews'

const calm = { hasConflict: false, isOnline: true, isSyncing: false, pendingCount: 0, autoSave: 'idle' } as const

describe('getSaveState — un seul état pour l\'indicateur de sauvegarde', () => {
  it('rien en cours : enregistré, que l\'autosave vienne de finir ou non', () => {
    expect(getSaveState(calm)).toBe('saved')
    expect(getSaveState({ ...calm, autoSave: 'saved' })).toBe('saved')
  })

  it('l\'autosave en cours ou en échec', () => {
    expect(getSaveState({ ...calm, autoSave: 'saving' })).toBe('saving')
    expect(getSaveState({ ...calm, autoSave: 'error' })).toBe('failed')
  })

  it('une file en attente l\'emporte sur un échec de l\'autosave, et le rejeu sur la file', () => {
    expect(getSaveState({ ...calm, pendingCount: 3, autoSave: 'error' })).toBe('pending')
    expect(getSaveState({ ...calm, pendingCount: 3, isSyncing: true })).toBe('saving')
  })

  it('hors ligne passe avant la file, le conflit avant tout', () => {
    expect(getSaveState({ ...calm, isOnline: false, pendingCount: 3, isSyncing: true })).toBe('offline')
    expect(getSaveState({ ...calm, hasConflict: true, isOnline: false, pendingCount: 3 })).toBe('conflict')
  })
})

describe('vues de la nouvelle fiche dans l\'adresse', () => {
  it('lit la vue du paramètre, En jeu par défaut et pour une valeur inconnue', () => {
    expect(getSheetView('inventory')).toBe('inventory')
    expect(getSheetView('settings')).toBe('settings')
    expect(getSheetView(undefined)).toBe('play')
    expect(getSheetView('unknown')).toBe('play')
  })

  it('En jeu n\'a pas de paramètre, les autres vues ont le leur', () => {
    expect(getSheetViewQuery('play')).toEqual({})
    expect(getSheetViewQuery('grimoire')).toEqual({ view: 'grimoire' })
  })
})

describe('vues sur téléphone', () => {
  it('quatre onglets, le reste sous « Plus », sans vue oubliée ni doublée', () => {
    expect(PHONE_TAB_VIEWS.map(view => view.key)).toEqual(['play', 'character', 'inventory', 'grimoire'])
    expect(PHONE_MORE_VIEWS.map(view => view.key)).toEqual(['notes', 'settings'])
    expect([...PHONE_TAB_VIEWS, ...PHONE_MORE_VIEWS].map(view => view.key).sort()).toEqual(SHEET_VIEWS.map(view => view.key).sort())
  })
})
