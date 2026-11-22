export const SHEET_VIEWS = [
  { key: 'play', slug: 'en-jeu', icon: 'nav-play' },
  { key: 'character', slug: 'personnage', icon: 'nav-character' },
  { key: 'inventory', slug: 'inventaire', icon: 'nav-inventory' },
  { key: 'grimoire', slug: 'grimoire', icon: 'nav-grimoire' },
  { key: 'notes', slug: 'notes', icon: 'nav-notes' },
  { key: 'settings', slug: 'reglages', icon: 'nav-settings' },
] as const

export type SheetView = typeof SHEET_VIEWS[number]['key']

export const sheetViewOf = (slug: unknown): SheetView =>
  SHEET_VIEWS.find(view => view.slug === slug)?.key ?? 'play'

// La vue par défaut n'a pas de paramètre : l'adresse de la fiche reste courte.
export const sheetViewQuery = (view: SheetView) =>
  view === 'play' ? {} : { vue: SHEET_VIEWS.find(entry => entry.key === view)!.slug }

export const newSheetPath = (characterId: number) => `/characters/${characterId}/nouvelle`
