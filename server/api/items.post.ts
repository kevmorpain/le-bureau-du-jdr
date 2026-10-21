import { db, schema } from '~~/server/utils/db'
import { effectIdFor } from '~~/server/utils/effectRows'
import type { Effect } from '~~/server/db/schema/effects'
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

  for (const effect of body.effects) {
    const effectId = await effectIdFor(db, effect as Effect)
    await db
      .insert(schema.itemEffects)
      .values({ itemId: item.id, effectId })
      .onConflictDoNothing()
  }

  return item
})
