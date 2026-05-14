import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

// Alignement builder (lowercase) → DB (uppercase)
const ALIGNMENT_MAP: Record<string, string> = {
  lg: 'LG', ng: 'NG', cg: 'CG',
  ln: 'LN', n: 'TN', cn: 'CN',
  le: 'LE', ne: 'NE', ce: 'CE',
}

const builderSchema = z.object({
  // Identité
  name: z.string().min(1).max(100),
  alignment: z.string().optional(),
  dragonbornAncestry: z.string().nullable().optional(),
  maxHp: z.number().int().positive(),
  // Résolution par nom
  className: z.string(),
  subclassName: z.string().nullable().optional(),
  level: z.number().int().min(1).max(20),
  speciesDbName: z.string().nullable().optional(),
  backgroundDbName: z.string().nullable().optional(),
  // Traits
  personality: z.string().optional(),
  ideals: z.string().optional(),
  bonds: z.string().optional(),
  flaws: z.string().optional(),
  // Caractéristiques
  abilityScores: z.record(z.string(), z.number().int()),
  // Compétences
  classSkills: z.array(z.string()),
  backgroundSkills: z.array(z.string()),
  // Sorts
  spellIds: z.array(z.number().int()),
  // Équipement
  inventoryItemNames: z.array(z.string()),
})

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, builderSchema.safeParse)
  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error })
  }

  const d = result.data

  // ── Résolutions par nom ──────────────────────────────────────────────────────

  const [cls] = await db
    .select({ id: schema.classes.id })
    .from(schema.classes)
    .where(eq(schema.classes.name, d.className))
    .limit(1)

  if (!cls) throw createError({ statusCode: 400, statusMessage: `Classe introuvable: ${d.className}` })

  let subclassId: number | null = null
  if (d.subclassName) {
    const [sub] = await db
      .select({ id: schema.subclasses.id })
      .from(schema.subclasses)
      .where(eq(schema.subclasses.name, d.subclassName))
      .limit(1)
    subclassId = sub?.id ?? null
  }

  let speciesId: number | null = null
  if (d.speciesDbName) {
    const [sp] = await db
      .select({ id: schema.characterSpecies.id })
      .from(schema.characterSpecies)
      .where(eq(schema.characterSpecies.name, d.speciesDbName))
      .limit(1)
    speciesId = sp?.id ?? null
  }

  let backgroundId: number | null = null
  if (d.backgroundDbName) {
    const [bg] = await db
      .select({ id: schema.backgrounds.id })
      .from(schema.backgrounds)
      .where(eq(schema.backgrounds.name, d.backgroundDbName))
      .limit(1)
    backgroundId = bg?.id ?? null
  }

  // Résolution noms items → IDs (silencieux si non trouvé)
  let itemIds: number[] = []
  if (d.inventoryItemNames.length) {
    const rows = await db
      .select({ id: schema.items.id, name: schema.items.name })
      .from(schema.items)
      .where(inArray(schema.items.name, d.inventoryItemNames))
    const nameToId = Object.fromEntries(rows.map(r => [r.name, r.id]))
    itemIds = d.inventoryItemNames.map(n => nameToId[n]).filter((id): id is number => id != null)
  }

  // ── Insertions séquentielles (D1 : pas de transaction) ──────────────────────

  const sheet = await db
    .insert(schema.characterSheets)
    .values({
      name: d.name,
      speciesId: speciesId ?? undefined,
      backgroundId: backgroundId ?? undefined,
      alignment: (ALIGNMENT_MAP[d.alignment ?? ''] ?? 'TN') as any,
      maxHp: d.maxHp,
      currentHp: d.maxHp,
      dragonbornAncestry: d.dragonbornAncestry ?? null,
      personalityTraits: d.personality ?? '',
      ideals: d.ideals ?? '',
      bonds: d.bonds ?? '',
      flaws: d.flaws ?? '',
    })
    .returning()
    .get()

  const sheetId = sheet.id

  // Classe
  await db.insert(schema.characterClasses).values({
    characterSheetId: sheetId,
    classId: cls.id,
    level: d.level,
    isMain: true,
    subclassId,
  })

  // Caractéristiques
  const abilityEntries = Object.entries(d.abilityScores)
  if (abilityEntries.length) {
    await db.insert(schema.characterAbilityScores).values(
      abilityEntries.map(([key, value]) => ({
        characterSheetId: sheetId,
        abilityId: key,
        value,
      })),
    )
  }

  // Compétences
  const skillRows = [
    ...d.classSkills.map(key => ({ characterSheetId: sheetId, skillKey: key, proficiencyLevel: 'proficient' as const, source: 'class' as const, isOverride: false })),
    ...d.backgroundSkills.map(key => ({ characterSheetId: sheetId, skillKey: key, proficiencyLevel: 'proficient' as const, source: 'background' as const, isOverride: false })),
  ]
  if (skillRows.length) {
    await db.insert(schema.characterSkills).values(skillRows)
  }

  // Sorts
  if (d.spellIds.length) {
    await db.insert(schema.characterSpells).values(
      d.spellIds.map(spellId => ({
        characterSheetId: sheetId,
        spellId,
        isKnown: true,
        isPrepared: true,
      })),
    )
  }

  // Inventaire
  if (itemIds.length) {
    await db.insert(schema.characterInventory).values(
      itemIds.map(itemId => ({ characterSheetId: sheetId, itemId, quantity: 1 })),
    )
  }

  setResponseStatus(event, 201)
  return { id: sheetId }
})
