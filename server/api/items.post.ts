import { db } from 'hub:db'
// hub:db schema cache ne connaît pas item_effects (ajoutée en 0053) → on lit
// les définitions depuis la source pour les nouvelles tables.
import * as schema from '~~/server/db/schema'
import * as srcSchema from '~~/server/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { createItemSchema } from '~~/shared/utils/item'
import { z } from 'zod'

// Le schéma de base de l'item est partagé (cf. shared/utils/item.ts). On l'étend
// ici avec une liste optionnelle d'effets magiques, persistés via item_effects.
const createCustomItemSchema = createItemSchema.extend({
  effects: z
    .array(z.object({ type: z.string(), value: z.any() }))
    .optional()
    .default([]),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createCustomItemSchema.parse)

  const item = await db
    .insert(schema.items)
    .values({
      name: body.name,
      itemType: body.itemType,
      properties: body.properties as typeof schema.items.$inferInsert['properties'],
      description: body.description ?? null,
      maxUses: body.maxUses ?? null,
      rechargeType: body.rechargeType ?? null,
      rechargeDice: body.rechargeDice ?? null,
      isCustom: true,
    } as typeof schema.items.$inferInsert)
    .returning()
    .get()

  if (!item) throw createError({ statusCode: 500, statusMessage: 'Failed to create item' })

  // Pour chaque effet : on réutilise l'effect existant si même (type, value),
  // sinon on l'insère. L'égalité sur la colonne JSON `value` se fait via une
  // comparaison string (sqlite la stocke en text).
  for (const effect of body.effects) {
    const existing = await db
      .select({ id: srcSchema.effects.id })
      .from(srcSchema.effects)
      .where(and(
        eq(srcSchema.effects.type, effect.type as any),
        sql`${srcSchema.effects.value} = ${JSON.stringify(effect.value)}`,
      ))
      .limit(1)
      .get()

    const effectId = existing?.id ?? await db
      .insert(srcSchema.effects)
      .values({ type: effect.type as any, value: effect.value as any })
      .returning()
      .get()
      .then(r => r.id)

    await db
      .insert(srcSchema.itemEffects)
      .values({ itemId: item.id, effectId })
      .onConflictDoNothing()
  }

  return item
})
