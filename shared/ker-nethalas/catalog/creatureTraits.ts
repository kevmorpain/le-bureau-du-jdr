// Traits communs à plusieurs créatures. `valued` : le trait porte une valeur (Pénétrant 2, Impitoyable 1).
export const KN_CREATURE_TRAITS = {
  alert: { valued: false },
  frightening: { valued: false },
  horrifying: { valued: false },
  pack: { valued: false },
  penetrating: { valued: true },
  ruthlessness: { valued: true },
  savage: { valued: false },
  swift: { valued: false },
  venomous: { valued: false },
} as const

export type KnCreatureTraitKey = keyof typeof KN_CREATURE_TRAITS

export const KN_CREATURE_TRAIT_KEYS = Object.keys(KN_CREATURE_TRAITS) as [KnCreatureTraitKey, ...KnCreatureTraitKey[]]
