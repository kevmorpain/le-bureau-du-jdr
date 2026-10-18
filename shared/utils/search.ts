// Recherche par nom : sans casse ni accents (« epee » trouve « Épée »).
export const normalizeSearch = (text: string): string =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()

export const matchesSearch = (name: string, query: string): boolean => {
  const needle = normalizeSearch(query)
  return needle === '' || normalizeSearch(name).includes(needle)
}
