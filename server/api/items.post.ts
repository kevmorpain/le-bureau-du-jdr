import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import * as srcSchema from '~~/server/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { createItemSchema } from '~~/shared/utils/item'
import { z } from 'zod'

const createCustomItemSchema = createItemSchema.extend({
  effects: z
    .array(z.object({ type: z.string(), value: z.any() }))
    .optional()
    .default([]),
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

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

  // Réutilise l'effect existant si même (type, value) ; `value` JSON comparé en string (stocké en text).
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
