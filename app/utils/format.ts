export const formatModifier = (modifier: number | null): string => {
  if (modifier === null) return '-'
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

export const formatRange = (range: number): string => {
  if (range === 0) return 'Personnelle'
  if (range === 1.5) return 'Contact'
  return new Intl.NumberFormat('fr-FR', { style: 'unit', unit: 'meter' }).format(range)
}

export const toSnakeCase = (str: string): string => {
  // Source - https://stackoverflow.com/a
  // Posted by ZPiDER
  // Retrieved 2025-11-17, License - CC BY-SA 4.0

  return str.replace(/(([a-z])(?=[A-Z][a-zA-Z])|([A-Z])(?=[A-Z][a-z]))/g, '$1_').toLowerCase()
}
