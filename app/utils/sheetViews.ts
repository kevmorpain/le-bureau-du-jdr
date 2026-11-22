export const SHEET_VIEWS = [
  { key: 'play', icon: 'nav-play' },
  { key: 'character', icon: 'nav-character' },
  { key: 'inventory', icon: 'nav-inventory' },
  { key: 'grimoire', icon: 'nav-grimoire' },
  { key: 'notes', icon: 'nav-notes' },
  { key: 'settings', icon: 'nav-settings' },
] as const

export type SheetView = typeof SHEET_VIEWS[number]['key']

export const getSheetView = (query: unknown): SheetView =>
  SHEET_VIEWS.find(view => view.key === query)?.key ?? 'play'

export const getSheetViewQuery = (view: SheetView) => (view === 'play' ? {} : { view })

export const getNewSheetPath = (characterId: number) => `/characters/${characterId}/nouvelle`
