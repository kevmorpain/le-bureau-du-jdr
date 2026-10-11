import type { KnRollTable } from '../../shared/ker-nethalas/tables'

// Une table factice : le contenu du livre n'entre jamais dans les tests. Par défaut une seule plage couvre tout le dé.
export const fakeTable = (die: number, ranges: [number, number][] = [[1, die]]): KnRollTable => ({
  die,
  entries: ranges.map(([min, max]) => ({ min, max, text: `Résultat ${min === max ? min : `${min}-${max}`}.` })),
})
