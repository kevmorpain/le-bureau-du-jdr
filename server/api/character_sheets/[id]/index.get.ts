import { db, schema } from '~~/server/utils/db'
import { and, eq, inArray } from 'drizzle-orm'
import { deriveChosenLineage } from '~~/server/utils/lineageDerivation'
import { deriveAbilityScoreChoices } from '~~/server/utils/abilityScoreDerivation'
import { deriveWeaponMasteries } from '~~/server/utils/weaponMasteryDerivation'
import { deriveBackgroundProficiencies } from '~~/server/utils/backgroundProficiencyDerivation'
import { deriveClassGrants } from '~~/server/utils/classProficiencyDerivation'
import { deriveChoiceProficiencies } from '~~/server/utils/choicePicks'

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
            subclass: true,
          },
        },
        spellSlots: true,
        baseAbilityScores: true,
        abilityScoreImprovements: true,
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

  const inventoryRows = await db
    .select({ inventory: schema.characterInventory, item: schema.items })
    .from(schema.characterInventory)
    .innerJoin(schema.items, eq(schema.characterInventory.itemId, schema.items.id))
    .where(eq(schema.characterInventory.characterSheetId, Number(id)))

  const inventoryItemIds = inventoryRows.map(r => r.item.id)
  const itemEffectsRows = inventoryItemIds.length
    ? await db
        .select({ itemId: schema.itemEffects.itemId, effect: schema.effects })
        .from(schema.itemEffects)
        .innerJoin(schema.effects, eq(schema.itemEffects.effectId, schema.effects.id))
        .where(inArray(schema.itemEffects.itemId, inventoryItemIds))
    : []

  const effectsByItem = new Map<number, typeof schema.effects.$inferSelect[]>()
  for (const link of itemEffectsRows) {
    if (!effectsByItem.has(link.itemId)) effectsByItem.set(link.itemId, [])
    effectsByItem.get(link.itemId)!.push(link.effect)
  }

  const inventoryWithItems = inventoryRows.map(r => ({
    ...r,
    item: { ...r.item, effects: effectsByItem.get(r.item.id) ?? [] },
  }))

  // Lignée choisie (D17) : ses features sont fusionnées dans les traits d'espèce.
  const totalLevel = characterSheet.classes.reduce((sum, c) => sum + c.level, 0)
  const species = characterSheet.species
  let speciesWithLineage = species
  let lineageName: string | null = null
  if (species) {
    const derived = await deriveChosenLineage(db, Number(id), species.id, totalLevel)
    lineageName = derived.lineageName

    // Le point de choix de lignée (« Lignage elfique ») n'est pas un trait à afficher ; un trait qui porte un
    // choix de maîtrise (« Polyvalence ») en est un.
    const baseFeatureIds = species.speciesFeatures
      .map(sf => sf.feature?.id)
      .filter((v): v is number => typeof v === 'number')
    const choicePointIds = baseFeatureIds.length
      ? new Set((await db
          .select({ fid: schema.progression.featureId })
          .from(schema.progression)
          .where(and(inArray(schema.progression.featureId, baseFeatureIds), eq(schema.progression.kind, 'lineage')))).map(r => r.fid))
      : new Set<number>()
    const visibleBaseFeatures = species.speciesFeatures.filter(sf => !choicePointIds.has(sf.feature?.id as number))

    speciesWithLineage = {
      ...species,
      speed: derived.speedOverride ?? species.speed,
      speciesFeatures: [...visibleBaseFeatures, ...(derived.features as typeof species.speciesFeatures)],
    }
  }

  const originAbilityBonuses = await deriveAbilityScoreChoices(db, Number(id))

  const weaponMasteries = await deriveWeaponMasteries(db, Number(id))

  const backgroundEffects = await deriveBackgroundProficiencies(db, characterSheet.backgroundId)

  const { proficiencies: classEffects, savingThrows: classSavingThrowEffects } = await deriveClassGrants(db, characterSheet.classes)

  // Maîtrises choisies (compétences, outils, langues) dérivées des picks en character_choices.
  const choiceEffects = await deriveChoiceProficiencies(db, Number(id))

  // Le propriétaire est le joueur ; on n'expose que `{ id, name }` (ni e-mail ni provider).
  const [owner] = characterSheet.ownerId != null
    ? await db
        .select({ id: schema.users.id, name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.id, characterSheet.ownerId))
    : []

  return {
    ...characterSheet,
    owner: owner ?? null,
    // `lineageName` ajouté ici (littéral frais → pas de contrôle d'excès sur le type de `species`).
    species: speciesWithLineage ? { ...speciesWithLineage, lineageName } : speciesWithLineage,
    inventory: inventoryWithItems,
    originAbilityBonuses,
    weaponMasteries,
    backgroundEffects,
    classEffects,
    classSavingThrowEffects,
    choiceEffects,
  }
})
