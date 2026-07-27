import type { DamageTypeKey, ConditionKey } from '~~/server/db/schema/effects'

export const damageTypeLabels: Record<DamageTypeKey, string> = {
  acid: 'Acide',
  bludgeoning: 'Contondant',
  cold: 'Froid',
  fire: 'Feu',
  force: 'Force',
  lightning: 'Foudre',
  necrotic: 'Nécrotique',
  piercing: 'Perforant',
  poison: 'Poison',
  psychic: 'Psychique',
  radiant: 'Rayonnant',
  slashing: 'Tranchant',
  thunder: 'Tonnerre',
  draconic_ancestry: 'Ancestral',
}

export const conditionLabels: Record<ConditionKey, string> = {
  blinded: 'Aveuglé',
  charmed: 'Charmé',
  deafened: 'Assourdi',
  exhaustion: 'Épuisé',
  frightened: 'Effrayé',
  grappled: 'Agrippé',
  incapacitated: 'Incapacité',
  invisible: 'Invisible',
  paralyzed: 'Paralysé',
  petrified: 'Pétrifié',
  poisoned: 'Empoisonné',
  prone: 'À terre',
  restrained: 'Entravé',
  stunned: 'Étourdi',
  unconscious: 'Inconscient',
}

export const allConditions: ConditionKey[] = [
  'blinded', 'charmed', 'deafened', 'exhaustion', 'frightened', 'grappled',
  'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned',
  'prone', 'restrained', 'stunned', 'unconscious',
]
