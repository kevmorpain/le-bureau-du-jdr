import type { KnCreature } from '../../shared/ker-nethalas/creatures'

// Une créature factice : le contenu du livre n'entre jamais dans les tests.
export const fakeCreature = (patch: Partial<KnCreature> = {}): KnCreature => ({
  key: 'fakeBeast',
  name: 'Bête factice',
  role: 'creature',
  types: ['animal'],
  number: { count: 0, sides: 0, bonus: 1 },
  mind: 40,
  endurance: 30,
  body: 50,
  health: { base: 8, perLevel: 4 },
  hitLocation: { table: 'humanoid', weakSpot: 'head' },
  armor: [{ points: 2, locations: ['chest'] }],
  combatSkill: 50,
  magicResistance: 30,
  spoils: 'Table factice',
  traits: [{ key: 'frightening' }, { key: 'penetrating', value: 2 }],
  actions: [
    { min: 1, max: 3, name: 'Coup', tag: 'physical', text: 'Texte factice.' },
    { min: 4, max: 6, name: 'Sort', tag: 'magical', text: 'Texte factice.' },
  ],
  levelAdaptation: [
    { level: 5, health: 5, damage: { count: 1, sides: 6, bonus: 0 }, armor: { points: 1, locations: 'all', except: ['chest'] } },
    { level: 10, combatSkill: 10, damage: { count: 1, sides: 8, bonus: 0 } },
  ],
  ...patch,
})
