export const SHEET_VIEWS = [
  { key: 'play', icon: 'nav-play' },
  { key: 'character', icon: 'nav-character' },
  { key: 'inventory', icon: 'nav-inventory' },
  { key: 'grimoire', icon: 'nav-grimoire' },
  { key: 'notes', icon: 'nav-notes' },
  { key: 'settings', icon: 'nav-settings' },
] as const

export type SheetView = typeof SHEET_VIEWS[number]['key']

const PHONE_TAB_KEYS: readonly SheetView[] = ['play', 'character', 'inventory', 'grimoire']

export const PHONE_TAB_VIEWS = SHEET_VIEWS.filter(view => PHONE_TAB_KEYS.includes(view.key))

export const PHONE_MORE_VIEWS = SHEET_VIEWS.filter(view => !PHONE_TAB_KEYS.includes(view.key))

export const getSheetView = (query: unknown): SheetView =>
  SHEET_VIEWS.find(view => view.key === query)?.key ?? 'play'

export const getSheetViewQuery = (view: SheetView) => (view === 'play' ? {} : { view })

export const getNewSheetPath = (characterId: number) => `/characters/${characterId}/nouvelle`
