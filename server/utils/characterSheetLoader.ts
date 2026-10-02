import { and, eq, inArray } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import { deriveChosenLineage } from '~~/server/utils/lineageDerivation'
import { deriveAbilityScoreChoices } from '~~/server/utils/abilityScoreDerivation'
import { deriveWeaponMasteries } from '~~/server/utils/weaponMasteryDerivation'
import { deriveBackgroundProficiencies } from '~~/server/utils/backgroundProficiencyDerivation'
import { deriveClassGrants } from '~~/server/utils/classProficiencyDerivation'
import { deriveChoiceProficiencies } from '~~/server/utils/choicePicks'
import { sheetHitPoints, type SheetHitPoints } from '~~/shared/rules/hitPoints'
import { inventoryEntriesOf } from '~~/shared/rules/characterEffects'
import type { Db } from '~~/server/utils/db'

// Les relations lues par `.query` ne sont pas typées sur le `Db` générique (schéma `any`) : le chargeur
// renvoie l'objet tel que le GET le sert, que le client type en `CharacterSheet`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loaded = any

/**
 * Fiche et relations dont dérivent les effets (espèce + lignée choisie, capacités, classes, ASI, objets avec
 * leurs effets). Source unique du GET et des écritures serveur qui doivent lire la fiche comme le client :
 * repos, level-up.
 */
export async function loadSheetRelations(db: Db, id: number): Promise<Loaded | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const characterSheet = await (db as any).query.characterSheets.findFirst({
    where: eq(schema.characterSheets.id, id),
    with: {
      species: { with: { speciesFeatures: { with: { feature: { with: { featureEffects: { with: { effect: true } } } } } } } },
      features: { with: { feature: { with: { featureEffects: { with: { effect: true } } } } } },
      classes: { with: { class: true, subclass: true } },
      spellSlots: true,
      baseAbilityScores: true,
      abilityScoreImprovements: true,
      skills: true,
      spells: { with: { spell: true } },
    },
  })
  if (!characterSheet) return null

  const inventoryRows = await db
    .select({ inventory: schema.characterInventory, item: schema.items })
    .from(schema.characterInventory)
    .innerJoin(schema.items, eq(schema.characterInventory.itemId, schema.items.id))
    .where(eq(schema.characterInventory.characterSheetId, id))

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
  const totalLevel = characterSheet.classes.reduce((sum: number, c: { level: number }) => sum + c.level, 0)
  const species = characterSheet.species
  let speciesWithLineage = species
  let lineageName: string | null = null
  if (species) {
    const derived = await deriveChosenLineage(db, id, species.id, totalLevel)
    lineageName = derived.lineageName

    // Le point de choix de lignée (« Lignage elfique ») n'est pas un trait à afficher ; un trait qui porte un
    // choix de maîtrise (« Polyvalence ») en est un.
    const baseFeatureIds = species.speciesFeatures
      .map((sf: { feature?: { id: number } | null }) => sf.feature?.id)
      .filter((v: unknown): v is number => typeof v === 'number')
    const choicePointIds = baseFeatureIds.length
      ? new Set((await db
          .select({ fid: schema.progression.featureId })
          .from(schema.progression)
          .where(and(inArray(schema.progression.featureId, baseFeatureIds), eq(schema.progression.kind, 'lineage')))).map(r => r.fid))
      : new Set<number>()
    const visibleBaseFeatures = species.speciesFeatures.filter((sf: { feature?: { id: number } | null }) => !choicePointIds.has(sf.feature?.id as number))

    speciesWithLineage = {
      ...species,
      speed: derived.speedOverride ?? species.speed,
      speciesFeatures: [...visibleBaseFeatures, ...derived.features],
    }
  }

  return {
    ...characterSheet,
    // `lineageName` ajouté ici (littéral frais → pas de contrôle d'excès sur le type de `species`).
    species: speciesWithLineage ? { ...speciesWithLineage, lineageName } : speciesWithLineage,
    inventory: inventoryWithItems,
  }
}

/** Fiche complète du GET : les relations plus ce que le serveur en dérive pour le client. */
export async function loadCharacterSheet(db: Db, id: number): Promise<Loaded | null> {
  const sheet = await loadSheetRelations(db, id)
  if (!sheet) return null

  const originAbilityBonuses = await deriveAbilityScoreChoices(db, id)

  const weaponMasteries = await deriveWeaponMasteries(db, id)

  const backgroundEffects = await deriveBackgroundProficiencies(db, sheet.backgroundId)

  const { proficiencies: classEffects, savingThrows: classSavingThrowEffects } = await deriveClassGrants(db, sheet.classes)

  // Maîtrises choisies (compétences, outils, langues) dérivées des picks en character_choices.
  const choiceEffects = await deriveChoiceProficiencies(db, id)

  // Le propriétaire est le joueur ; on n'expose que `{ id, name }` (ni e-mail ni provider).
  const [owner] = sheet.ownerId != null
    ? await db
        .select({ id: schema.users.id, name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.id, sheet.ownerId))
    : []

  return {
    ...sheet,
    owner: owner ?? null,
    originAbilityBonuses,
    weaponMasteries,
    backgroundEffects,
    classEffects,
    classSavingThrowEffects,
    choiceEffects,
  }
}

export function sheetHitPointsOf(sheet: Loaded): SheetHitPoints {
  return sheetHitPoints({ ...sheet, inventory: inventoryEntriesOf(sheet.inventory ?? []) })
}
