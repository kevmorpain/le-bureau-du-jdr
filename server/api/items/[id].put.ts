import { db } from 'hub:db'
// hub:db schema cache ne connaît pas item_effects (ajoutée en 0053) → on lit
// les définitions depuis la source pour ces tables.
import * as schema from '~~/server/db/schema'
import * as srcSchema from '~~/server/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { createItemSchema } from '~~/shared/utils/item'
import { z } from 'zod'

// Même schéma que la création, étendu avec les effets magiques (item_effects).
const updateCustomItemSchema = createItemSchema.extend({
  effects: z
    .array(z.object({ type: z.string(), value: z.any() }))
    .optional()
    .default([]),
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const { id } = getRouterParams(event)
  const itemId = Number(id)
  if (!itemId) throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })

  const body = await readValidatedBody(event, updateCustomItemSchema.parse)

  const existing = await db
    .select({ id: schema.items.id, isCustom: schema.items.isCustom })
    .from(schema.items)
    .where(eq(schema.items.id, itemId))
    .get()

  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Item not found' })
  // Seuls les objets custom sont éditables : les objets de seed sont du contenu
  // canonique partagé par toutes les fiches.
  if (!existing.isCustom) {
    throw createError({ statusCode: 403, statusMessage: 'Only custom items can be edited' })
  }

  await db
    .update(schema.items)
    .set({
      name: body.name,
      itemType: body.itemType,
      properties: body.properties as typeof schema.items.$inferInsert['properties'],
      description: body.description ?? null,
      maxUses: body.maxUses ?? null,
      rechargeType: body.rechargeType ?? null,
      rechargeDice: body.rechargeDice ?? null,
    } as Partial<typeof schema.items.$inferInsert>)
    .where(eq(schema.items.id, itemId))

  // Reconstruit les effets magiques : on efface les liens existants puis on
  // réinsère depuis le payload (statements séquentiels — pas de db.transaction()
  // sur Cloudflare D1).
  await db.delete(srcSchema.itemEffects).where(eq(srcSchema.itemEffects.itemId, itemId))

  for (const effect of body.effects) {
    // Réutilise l'effect existant si même (type, value), sinon on l'insère.
    const existingEffect = await db
      .select({ id: srcSchema.effects.id })
      .from(srcSchema.effects)
      .where(and(
        eq(srcSchema.effects.type, effect.type as any),
        sql`${srcSchema.effects.value} = ${JSON.stringify(effect.value)}`,
      ))
      .limit(1)
      .get()

    const effectId = existingEffect?.id ?? await db
      .insert(srcSchema.effects)
      .values({ type: effect.type as any, value: effect.value as any })
      .returning()
      .get()
      .then(r => r.id)

    await db
      .insert(srcSchema.itemEffects)
      .values({ itemId, effectId })
      .onConflictDoNothing()
  }

  const updated = await db
    .select()
    .from(schema.items)
    .where(eq(schema.items.id, itemId))
    .get()

  return updated
})
