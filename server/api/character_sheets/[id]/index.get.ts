import { db, schema } from 'hub:db'
import * as srcSchema from '~~/server/db/schema'
import { eq, inArray } from 'drizzle-orm'

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

  const enrichedClasses = characterSheet.classes.map((cc) => {
    const subclassId = subclassIdByClassId.get(cc.classId) ?? null
    return {
      ...cc,
      subclassId,
      subclass: subclassId !== null ? (subclassById.get(subclassId) ?? null) : null,
    }
  })

  // Charge ASI séparément (le schéma cached de hub:db n'a pas la relation)
  const abilityScoreImprovements = await db
    .select()
    .from(srcSchema.characterAbilityScoreImprovements)
    .where(eq(srcSchema.characterAbilityScoreImprovements.characterSheetId, Number(id)))

  // Charge l'inventaire avec les items (utilisé notamment pour le Pacte de la Lame)
  const inventoryWithItems = await db
    .select({ inventory: srcSchema.characterInventory, item: srcSchema.items })
    .from(srcSchema.characterInventory)
    .innerJoin(srcSchema.items, eq(srcSchema.characterInventory.itemId, srcSchema.items.id))
    .where(eq(srcSchema.characterInventory.characterSheetId, Number(id)))

  return { ...characterSheet, classes: enrichedClasses, abilityScoreImprovements, inventory: inventoryWithItems }
})
