import { db, schema } from 'hub:db'
import * as srcSchema from '~~/server/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { deriveChosenLineage } from '~~/server/utils/lineageDerivation'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  const characterSheet = await db
    .query
    .characterSheets
    .findFirst({
      where: eq(schema.characterSheets.id, Number(id)),
      with: {
        species: {
          with: {
            speciesFeatures: {
              with: {
                feature: {
                  with: {
                    featureEffects: {
                      with: {
                        effect: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        features: {
          with: {
            feature: {
              with: {
                featureEffects: {
                  with: {
                    effect: true,
                  },
                },
              },
            },
          },
        },
        classes: {
          with: {
            class: true,
          },
        },
        spellSlots: true,
        baseAbilityScores: true,
        skills: true,
        spells: {
          with: {
            spell: true,
          },
        },
      },
    })

  if (!characterSheet) {
    throw createError({ statusCode: 404, statusMessage: 'Character sheet not found' })
  }

  // Charge subclasses séparément (le schéma cached de hub:db n'a pas la relation subclass)
  // + enrichit chaque classe avec subclassId + subclass via SQL raw
  const classesWithSubclass = await db
    .select()
    .from(srcSchema.characterClasses)
    .where(eq(srcSchema.characterClasses.characterSheetId, Number(id)))
  const subclassIds = classesWithSubclass
    .map(c => c.subclassId)
    .filter((v): v is number => v !== null && v !== undefined)
  const subclasses = subclassIds.length
    ? await db
        .select()
        .from(srcSchema.subclasses)
        .where(inArray(srcSchema.subclasses.id, subclassIds))
    : []
  const subclassById = new Map(subclasses.map(s => [s.id, s]))
  const subclassIdByClassId = new Map(classesWithSubclass.map(c => [c.classId, c.subclassId]))
  const pactBoonByClassId = new Map(classesWithSubclass.map(c => [c.classId, (c as any).pactBoon ?? null]))

  const enrichedClasses = characterSheet.classes.map((cc) => {
    const subclassId = subclassIdByClassId.get(cc.classId) ?? null
    return {
      ...cc,
      subclassId,
      subclass: subclassId !== null ? (subclassById.get(subclassId) ?? null) : null,
      pactBoon: pactBoonByClassId.get(cc.classId) ?? null,
    }
  })

  // Charge ASI séparément (le schéma cached de hub:db n'a pas la relation)
  const abilityScoreImprovements = await db
    .select()
    .from(srcSchema.characterAbilityScoreImprovements)
    .where(eq(srcSchema.characterAbilityScoreImprovements.characterSheetId, Number(id)))

  // Enrichit chaque character_feature avec source/classLevel/choices (colonnes
  // ajoutées en 0053 que le schéma cached de hub:db ne connaît pas).
  const charFeatureMeta = await db
    .select({
      featureId: srcSchema.characterFeatures.featureId,
      source: srcSchema.characterFeatures.source,
      classLevel: srcSchema.characterFeatures.classLevel,
      choices: srcSchema.characterFeatures.choices,
    })
    .from(srcSchema.characterFeatures)
    .where(eq(srcSchema.characterFeatures.characterSheetId, Number(id)))
  const featureMetaById = new Map(charFeatureMeta.map(m => [m.featureId, m]))
  const enrichedFeatures = characterSheet.features.map((cf) => {
    const meta = featureMetaById.get(cf.featureId)
    return {
      ...cf,
      source: meta?.source ?? null,
      classLevel: meta?.classLevel ?? null,
      choices: meta?.choices ?? null,
    }
  })


  // Charge l'inventaire avec les items + leurs effets magiques (item_effects).
  // Hub:db ne connaît pas item_effects (ajoutée en 0053) → utiliser srcSchema.
  const inventoryRows = await db
    .select({ inventory: srcSchema.characterInventory, item: srcSchema.items })
    .from(srcSchema.characterInventory)
    .innerJoin(srcSchema.items, eq(srcSchema.characterInventory.itemId, srcSchema.items.id))
    .where(eq(srcSchema.characterInventory.characterSheetId, Number(id)))

  const inventoryItemIds = inventoryRows.map(r => r.item.id)
  const itemEffectsRows = inventoryItemIds.length
    ? await db
        .select({ itemId: srcSchema.itemEffects.itemId, effect: srcSchema.effects })
        .from(srcSchema.itemEffects)
        .innerJoin(srcSchema.effects, eq(srcSchema.itemEffects.effectId, srcSchema.effects.id))
        .where(inArray(srcSchema.itemEffects.itemId, inventoryItemIds))
    : []

  const effectsByItem = new Map<number, typeof srcSchema.effects.$inferSelect[]>()
  for (const link of itemEffectsRows) {
    if (!effectsByItem.has(link.itemId)) effectsByItem.set(link.itemId, [])
    effectsByItem.get(link.itemId)!.push(link.effect)
  }

  const inventoryWithItems = inventoryRows.map(r => ({
    ...r,
    item: { ...r.item, effects: effectsByItem.get(r.item.id) ?? [] },
  }))

  // ─── Lignée choisie (D17) : fusionner ses features dans les traits d'espèce ──────────────
  // `character_choices`/`species_lineages`/`features.lineage_id` hors relations hub:db → util
  // `.select()` injecté (patron subclasses/ASI/items). No-op tant que le perso n'a pas de
  // lignée (selected_lineage_id NULL) → toutes les fiches existantes sont inchangées.
  const totalLevel = characterSheet.classes.reduce((sum, c) => sum + ((c as { level?: number }).level ?? 0), 0)
  const species = characterSheet.species
  let speciesWithLineage = species
  // Nom de la lignée choisie (ex. « Drow ») → affichage fiche (en-tête + badges de features).
  let lineageName: string | null = null
  if (species) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const derived = await deriveChosenLineage(db as any, Number(id), species.id, totalLevel)
    lineageName = derived.lineageName
    speciesWithLineage = {
      ...species,
      speed: derived.speedOverride ?? species.speed,
      speciesFeatures: [...species.speciesFeatures, ...(derived.features as typeof species.speciesFeatures)],
    }
  }

  return {
    ...characterSheet,
    // `lineageName` ajouté ici (littéral frais → pas de contrôle d'excès sur le type de `species`).
    species: speciesWithLineage ? { ...speciesWithLineage, lineageName } : speciesWithLineage,
    features: enrichedFeatures,
    classes: enrichedClasses,
    abilityScoreImprovements,
    inventory: inventoryWithItems,
  }
})
