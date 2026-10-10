import type { KnMastery } from '../../shared/ker-nethalas/masteries'

// Une Maîtrise factice : le contenu du livre n'entre jamais dans les tests.
export const fakeMastery = (key: string, over: Partial<KnMastery> = {}): KnMastery => ({
  key,
  name: `Maîtrise ${key}`,
  summary: 'Résumé factice.',
  feature: { name: 'Trait factice', text: 'Effet factice.' },
  abilities: [1, 2, 3, 4, 5].map(tier => ({
    tier,
    name: `Aptitude ${tier}`,
    action: tier === 3 ? 'Passif' : '1 Action Standard',
    magical: tier % 2 === 1,
    sustained: tier === 2,
    cost: tier === 3 ? '' : `${tier + 3} Éther`,
    aether: tier === 3 ? null : tier + 3,
    text: `Effet factice du palier ${tier}.`,
  })),
  training: [1, 2, 3, 4, 5, 6].map(roll => ({ name: `Lieu ${roll}`, text: `Entraînement factice ${roll}.` })),
  ...over,
})
