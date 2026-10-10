import type { KnPersonalGoal } from '../../shared/ker-nethalas/goals'

// Un objectif factice : le contenu du livre n'entre jamais dans les tests.
export const fakeGoal = (key: string, over: Partial<KnPersonalGoal> = {}): KnPersonalGoal => ({
  key,
  name: `Objectif ${key}`,
  objective: 'Objectif factice.',
  target: 10,
  reward: 'Récompense factice.',
  ...over,
})
