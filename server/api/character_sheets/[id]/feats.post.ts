import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import * as srcSchema from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

// Attache un don (feature feature_type='feat') au personnage.
// source: 'asi' (don pris à un palier 4/8/12...) ou 'bonus' (homebrew MJ).
const schemaBody = z.object({
  featureId: z.number().int().positive(),
  source: z.enum(['asi', 'bonus']).default('bonus'),
  classLevel: z.number().int().min(1).max(20).nullable().optional(),
  // Choix résolus du don (ex : caractéristique +1). Optionnel.
  choices: z.object({ ability: z.enum(ABILITY_KEYS).optional() }).nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)
  if (!characterSheetId) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  const result = await readValidatedBody(event, schemaBody.safeParse)
  if (!result.success) throw createError({ statusCode: 422, data: result.error })

  const { featureId, source, classLevel, choices } = result.data

  // Vérifie que la feature existe ET est bien un don.
  const [feat] = await db
    .select({ id: schema.features.id })
    .from(schema.features)
    .where(and(eq(schema.features.id, featureId), eq(schema.features.featureType, 'feat')))
    .limit(1)

  if (!feat) throw createError({ statusCode: 404, statusMessage: 'Don introuvable' })

  // upsert : permet aussi de mettre à jour les choix d'un don déjà possédé
  // (ex : changer la caractéristique +1 d'Observateur).
  await db
    .insert(srcSchema.characterFeatures)
    .values({
      characterSheetId,
      featureId,
      currentUses: 0,
      source,
      classLevel: classLevel ?? null,
      choices: choices ?? null,
    } as any)
    .onConflictDoUpdate({
      target: [srcSchema.characterFeatures.characterSheetId, srcSchema.characterFeatures.featureId],
      set: { choices: choices ?? null },
    })

  setResponseStatus(event, 201)
  return { ok: true }
})
