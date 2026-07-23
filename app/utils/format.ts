export const formatModifier = (modifier: number | null): string => {
  if (modifier === null) return '-'
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

// Sentinel de portée « illimitée » (ex. Communication à distance sur le même
// plan). Au-delà de tout rayon de sort réel (le plus long, Clairvoyance, = 1500 m).
export const UNLIMITED_RANGE = 100000

export const formatRange = (range: number): string => {
  if (range === 0) return 'Personnelle'
  if (range === 1.5) return 'Contact'
  if (range >= UNLIMITED_RANGE) return 'Illimitée'
  return new Intl.NumberFormat('fr-FR', { style: 'unit', unit: 'meter' }).format(range)
}

export const toSnakeCase = (str: string): string => {
  // Source - https://stackoverflow.com/a
  // Posted by ZPiDER
  // Retrieved 2025-11-17, License - CC BY-SA 4.0

  return str.replace(/(([a-z])(?=[A-Z][a-zA-Z])|([A-Z])(?=[A-Z][a-z]))/g, '$1_').toLowerCase()
}
