import { z } from 'zod'

// Ensemble canonique des préférences (D18) : le type et le Zod en dérivent, un nouveau réglage est une clé de plus, pas une migration.
export const PREFERENCES = {
  diceRolls: {
    default: true,
    label: 'Lancer les dés dans l\'application',
    description: 'Désactivé, la fiche n\'affiche que les modificateurs : vous lancez vos dés à la table et saisissez le résultat quand la fiche en a besoin.',
  },
} as const satisfies Record<string, { default: boolean, label: string, description: string }>

export type PreferenceKey = keyof typeof PREFERENCES

export const PREFERENCE_KEYS = Object.keys(PREFERENCES) as PreferenceKey[]

// Clé absente : la fiche n'a pas tranché, elle hérite du compte.
export type Preferences = { [K in PreferenceKey]?: boolean }

export type ResolvedPreferences = { [K in PreferenceKey]: boolean }

export const preferencesSchema = z.object(
  Object.fromEntries(PREFERENCE_KEYS.map(key => [key, z.boolean().optional()])) as { [K in PreferenceKey]: z.ZodOptional<z.ZodBoolean> },
)

type Layer = Preferences | null | undefined

// Héritage live `fiche ?? compte ?? défaut codé` : un défaut de compte modifié se propage aux fiches qui n'ont rien tranché.
export const resolvePreferences = (sheet: Layer, account: Layer): ResolvedPreferences =>
  Object.fromEntries(
    PREFERENCE_KEYS.map(key => [key, sheet?.[key] ?? account?.[key] ?? PREFERENCES[key].default]),
  ) as ResolvedPreferences
