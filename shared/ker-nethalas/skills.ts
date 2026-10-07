export const KN_SKILL_KEYS = [
  'acrobatics',
  'athletics',
  'bladedWeapons',
  'bludgeoningWeapons',
  'dodge',
  'medicine',
  'perception',
  'reason',
  'scavenge',
  'shaftedWeapons',
  'stealth',
  'thievery',
  'unarmedCombat',
] as const

export type KnSkillKey = (typeof KN_SKILL_KEYS)[number]

export const KN_RESISTANCE_KEYS = ['endurance', 'resolve', 'spellward'] as const

export type KnResistanceKey = (typeof KN_RESISTANCE_KEYS)[number]

// Les compétences d'arme (« weapon Skills ») sont ces quatre-là, Combat à mains nues compris.
export const KN_WEAPON_SKILL_KEYS = ['bladedWeapons', 'bludgeoningWeapons', 'shaftedWeapons', 'unarmedCombat'] as const

// Le livre ne définit pas « non-combat Skill » : ici, tout ce qui n'est ni compétence d'arme ni Esquive.
export const KN_NON_COMBAT_SKILL_KEYS = KN_SKILL_KEYS.filter(
  key => key !== 'dodge' && !(KN_WEAPON_SKILL_KEYS as readonly string[]).includes(key),
)

// Scores de départ imprimés entre parenthèses sur la fiche vierge ; les autres partent de 0.
export const KN_SKILL_STARTING_SCORES: Record<KnSkillKey, number> = {
  acrobatics: 10,
  athletics: 10,
  bladedWeapons: 0,
  bludgeoningWeapons: 0,
  dodge: 10,
  medicine: 0,
  perception: 20,
  reason: 0,
  scavenge: 0,
  shaftedWeapons: 0,
  stealth: 0,
  thievery: 0,
  unarmedCombat: 0,
}
