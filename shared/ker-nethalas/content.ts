import type { z } from 'zod'
import { knPotionAgingSchema } from './consumables'
import { knBestiaryContentSchema } from './creatures'
import { knPersonalGoalsContentSchema } from './goals'
import { knItemsContentSchema } from './items'
import { knLootContentSchema } from './loot'
import { knMasteriesContentSchema } from './masteries'
import { KN_EXPLORATION_TABLES, knRollTableSchema } from './tables'

export type KnContentRegistry = Record<string, z.ZodType>

// Un jeu de données par entrée, chargé hors du dépôt : chaque tranche qui apporte du contenu du livre y ajoute le sien.
export const KN_CONTENT_SCHEMAS: KnContentRegistry = {
  masteries: knMasteriesContentSchema,
  personalGoals: knPersonalGoalsContentSchema,
  bestiary: knBestiaryContentSchema,
  items: knItemsContentSchema,
  loot: knLootContentSchema,
  potionAging: knPotionAgingSchema,
  ...Object.fromEntries(Object.entries(KN_EXPLORATION_TABLES).map(([name, { die }]) => [name, knRollTableSchema(die)])),
}

export const KN_CONTENT_NAME_RE = /^[a-z][a-zA-Z0-9]{0,39}$/

// Une ligne D1 ne dépasse pas 2 Mo : on s'arrête avant, plutôt que de laisser la base refuser.
export const KN_CONTENT_MAX_BYTES = 1_500_000
