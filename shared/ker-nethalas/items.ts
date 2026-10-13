import { z } from 'zod'
import { KN_PROVISION_KEYS } from './camp'
import {
  KN_ITEM_KINDS,
  KN_ITEM_WEIGHTS,
  knIntegrityDieSchema,
  knIntegrityDown,
  knWeaponStatsSchema,
  type KnItem,
} from './inventory'
import { boundedInt } from './zodHelpers'

const slug = z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/)

// Un objet du catalogue du livre : les caractéristiques que ses exemplaires recopient.
export const knCatalogItemSchema = z.object({
  key: slug,
  name: z.string().trim().min(1).max(100),
  kind: z.enum(KN_ITEM_KINDS),
  weight: z.enum(KN_ITEM_WEIGHTS),
  // Le prix, en pièces.
  value: boundedInt({ min: 0, max: 99999 }),
  weapon: knWeaponStatsSchema.optional(),
  protection: boundedInt({ min: 0, max: 9 }).optional(),
  parry: boundedInt({ min: 0, max: 30 }).optional(),
  maneuverability: boundedInt({ min: 0, max: 30 }).optional(),
  perception: boundedInt({ min: 0, max: 30 }).optional(),
  // Le dé d'Intégrité maximal d'une armure ou d'un bouclier.
  integrity: knIntegrityDieSchema.optional(),
  // À quoi sert l'objet, quand ce n'est pas évident.
  text: z.string().trim().min(1).max(600).optional(),
  // Une provision (Torche, Ration, Huile de lampe…) : l'acheter l'ajoute aux provisions, pas à l'inventaire.
  provision: z.enum(KN_PROVISION_KEYS).optional(),
})

export type KnCatalogItem = z.infer<typeof knCatalogItemSchema>

export const knItemsContentSchema = z.array(knCatalogItemSchema).min(1).max(250).superRefine((items, ctx) => {
  const seen = new Set<string>()
  items.forEach((item, index) => {
    if (seen.has(item.key)) ctx.addIssue({ code: 'custom', path: [index, 'key'], message: `clé en double : ${item.key}` })
    seen.add(item.key)
    if (item.weapon && item.kind !== 'weapon') ctx.addIssue({ code: 'custom', path: [index, 'weapon'], message: 'des statistiques d\'arme sur un objet qui n\'en est pas une' })
    if (item.kind === 'weapon' && !item.weapon) ctx.addIssue({ code: 'custom', path: [index, 'weapon'], message: 'une arme porte ses statistiques' })
  })
})

// Un exemplaire du catalogue : ses caractéristiques recopiées, dans le sac. Une armure ou un bouclier trouvé en butin a une
// Intégrité d'un cran sous son maximum.
export function knItemFromCatalog(entry: KnCatalogItem, id: string, options: { found?: boolean } = {}): KnItem {
  const { key, text, integrity, provision: _provision, ...rest } = entry
  return {
    ...rest,
    id,
    ref: key,
    quantity: 1,
    place: 'bag',
    ...(text ? { note: text } : {}),
    ...(integrity ? { integrity: { max: integrity, current: options.found ? knIntegrityDown(integrity) : integrity } } : {}),
  }
}
