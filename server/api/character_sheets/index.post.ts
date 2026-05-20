import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import { and, eq, inArray, lte, sql } from 'drizzle-orm'
import { z } from 'zod'

// Alignement builder (lowercase) → DB (uppercase)
const ALIGNMENT_MAP: Record<string, string> = {
  lg: 'LG', ng: 'NG', cg: 'CG',
  ln: 'LN', n: 'TN', cn: 'CN',
  le: 'LE', ne: 'NE', ce: 'CE',
}

// ─── Spell slot tables (D&D 5e 2014) ─────────────────────────────────────────

const FULL_SLOTS: number[][] = [
  [2,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],
  [4,3,0,0,0,0,0,0,0],[4,3,2,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],
  [4,3,3,1,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],[4,3,3,3,1,0,0,0,0],
  [4,3,3,3,2,0,0,0,0],[4,3,3,3,2,1,0,0,0],[4,3,3,3,2,1,0,0,0],
  [4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,1,0],
  [4,3,3,3,2,1,1,1,0],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],
  [4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1],
]
const HALF_SLOTS: number[][] = [
  [0,0,0,0,0,0,0,0,0],[2,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],
  [3,0,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],
  [4,3,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],[4,3,2,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],
  [4,3,3,1,0,0,0,0,0],[4,3,3,1,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],
  [4,3,3,2,0,0,0,0,0],[4,3,3,3,1,0,0,0,0],[4,3,3,3,1,0,0,0,0],
  [4,3,3,3,2,0,0,0,0],[4,3,3,3,2,0,0,0,0],
]
const PACT_LEVEL = [1,1,2,2,3,3,4,4,5,5,5,5,5,5,5,5,5,5,5,5]
const PACT_COUNT = [1,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,4,4,4,4]

const CASTER_TYPE: Record<string, 'full' | 'half' | 'pact' | 'none'> = {
  'Barde': 'full', 'Clerc': 'full', 'Druide': 'full', 'Ensorceleur': 'full', 'Magicien': 'full',
  'Paladin': 'half', 'Rôdeur': 'half',
  'Occultiste': 'pact',
}

function slotsForLevel(type: 'full' | 'half' | 'pact', level: number): number[] {
  const idx = Math.max(0, Math.min(19, level - 1))
  if (type === 'full') return [...FULL_SLOTS[idx]!]
  if (type === 'half') return [...HALF_SLOTS[idx]!]
  const row = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  const sl = PACT_LEVEL[idx]!
  row[sl - 1] = PACT_COUNT[idx]!
  return row
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

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
  customBackgroundName: z.string().nullable().optional(),
  // Traits
  personality: z.string().optional(),
  ideals: z.string().optional(),
  bonds: z.string().optional(),
  flaws: z.string().optional(),
  // Caractéristiques
  abilityScores: z.record(z.string(), z.number().int()),
  // Compétences & maîtrises de classe
  classSkills: z.array(z.string()),
  classSavingThrows: z.array(z.string()),
  armorProficiencyKeys: z.array(z.string()).optional().default([]),
  weaponProficiencyKeys: z.array(z.string()).optional().default([]),
  toolProficiencyChoices: z.array(z.string()).optional().default([]),
  backgroundSkills: z.array(z.string()),
  // Langues choisies par l'utilisateur
  selectedLanguages: z.array(z.string()).optional().default([]),
  // Sorts
  spellIds: z.array(z.number().int()),
  // Équipement
  inventoryItemNames: z.array(z.string()),
  // Monnaie
  pp: z.number().int().min(0).optional(),
  po: z.number().int().min(0).optional(),
  pe: z.number().int().min(0).optional(),
  pa: z.number().int().min(0).optional(),
  pc: z.number().int().min(0).optional(),
})

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, builderSchema.safeParse)
  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error })
  }

  const d = result.data

  // ── Résolutions par nom ──────────────────────────────────────────────────────

  const [cls] = await db
    .select({ id: schema.classes.id, name: schema.classes.name, hitDice: schema.classes.hitDice })
    .from(schema.classes)
    .where(eq(schema.classes.name, d.className))
    .limit(1)

  if (!cls) throw createError({ statusCode: 400, statusMessage: `Classe introuvable: ${d.className}` })

  let subclassId: number | null = null
  if (d.subclassName) {
    const [sub] = await db
      .select({ id: schema.subclasses.id })
      .from(schema.subclasses)
      .where(sql`lower(${schema.subclasses.name}) = lower(${d.subclassName})`)
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

  // Background (preset) — résolution + récupération des maîtrises
  let backgroundId: number | null = null
  let bgToolProfs: string[] = []
  let bgLangProfs: string[] = []
  if (d.backgroundDbName) {
    const [bg] = await db
      .select({
        id: schema.backgrounds.id,
        toolProficiencies: schema.backgrounds.toolProficiencies,
        languageProficiencies: schema.backgrounds.languageProficiencies,
      })
      .from(schema.backgrounds)
      .where(and(
        eq(schema.backgrounds.name, d.backgroundDbName),
        sql`${schema.backgrounds.characterSheetId} IS NULL`,
      ))
      .limit(1)
    backgroundId = bg?.id ?? null
    // Exclure les entrées "choix" — elles sont gérées par selectedLanguages / UI
    const isChoice = (s: string) => s.toLowerCase().includes('choix') || s.includes('×')
    bgToolProfs = (bg?.toolProficiencies ?? []).filter(p => !isChoice(p))
    bgLangProfs = (bg?.languageProficiencies ?? []).filter(p => !isChoice(p))
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

  // ── Hit die ───────────────────────────────────────────────────────────────────

  const hitDieMatch = cls.hitDice?.match(/\d+d(\d+)/)
  const hitDieSides = hitDieMatch?.[1]
  const currentHitDie = hitDieSides ? [{ die: hitDieSides, count: d.level }] : []

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
      currentHitDie: currentHitDie as any,
      dragonbornAncestry: d.dragonbornAncestry ?? null,
      personalityTraits: d.personality ?? '',
      ideals: d.ideals ?? '',
      bonds: d.bonds ?? '',
      flaws: d.flaws ?? '',
      pp: d.pp ?? 0,
      po: d.po ?? 0,
      pe: d.pe ?? 0,
      pa: d.pa ?? 0,
      pc: d.pc ?? 0,
    })
    .returning()
    .get()

  const sheetId = sheet.id

  // Background personnalisé — créer + lier au personnage
  if (d.customBackgroundName) {
    const customBg = await db
      .insert(schema.backgrounds)
      .values({ name: d.customBackgroundName, characterSheetId: sheetId })
      .returning()
      .get()
    await db
      .update(schema.characterSheets)
      .set({ backgroundId: customBg.id })
      .where(eq(schema.characterSheets.id, sheetId))
  }

  // Classe
  await db.insert(schema.characterClasses).values({
    characterSheetId: sheetId,
    classId: cls.id,
    level: d.level,
    isMain: true,
    subclassId,
  })

  // Features de classe et sous-classe
  const classFeatureRows = await db
    .select({ id: schema.features.id })
    .from(schema.features)
    .where(and(
      eq(schema.features.classId, cls.id),
      eq(schema.features.featureType, 'class_feature'),
      lte(schema.features.levelRequired, d.level),
    ))

  const subclassFeatureRows = subclassId
    ? await db
        .select({ id: schema.features.id })
        .from(schema.features)
        .where(and(
          eq(schema.features.subclassId, subclassId),
          eq(schema.features.featureType, 'subclass_feature'),
          lte(schema.features.levelRequired, d.level),
        ))
    : []

  const allFeatureIds = [...classFeatureRows, ...subclassFeatureRows].map(f => f.id)
  if (allFeatureIds.length) {
    await db.insert(schema.characterFeatures).values(
      allFeatureIds.map(featureId => ({ characterSheetId: sheetId, featureId, currentUses: 0 })),
    )
  }

  // Caractéristiques
  const abilityEntries = Object.entries(d.abilityScores)
  if (abilityEntries.length) {
    await db.insert(schema.characterAbilityScores).values(
      abilityEntries.map(([key, value]) => ({ characterSheetId: sheetId, abilityId: key, value })),
    )
  }

  // Compétences + JDS de classe
  const skillRows = [
    ...d.classSkills.map(key => ({ characterSheetId: sheetId, skillKey: key, proficiencyLevel: 'proficient' as const, source: 'class' as const, isOverride: false })),
    ...d.classSavingThrows.map(key => ({ characterSheetId: sheetId, skillKey: `${key}_save`, proficiencyLevel: 'proficient' as const, source: 'class' as const, isOverride: false })),
    ...d.backgroundSkills.map(key => ({ characterSheetId: sheetId, skillKey: key, proficiencyLevel: 'proficient' as const, source: 'background' as const, isOverride: false })),
  ]
  if (skillRows.length) {
    await db.insert(schema.characterSkills).values(skillRows)
  }

  // Maîtrises d'armures, d'armes, outils et langues
  const proficiencyRows = [
    ...d.armorProficiencyKeys.map(value => ({ characterSheetId: sheetId, proficiencyType: 'armor' as const, value, action: 'grant' as const })),
    ...d.weaponProficiencyKeys.map(value => ({ characterSheetId: sheetId, proficiencyType: 'weapon' as const, value, action: 'grant' as const })),
    ...bgToolProfs.map(value => ({ characterSheetId: sheetId, proficiencyType: 'tool' as const, value, action: 'grant' as const })),
    ...d.toolProficiencyChoices.map(value => ({ characterSheetId: sheetId, proficiencyType: 'tool' as const, value, action: 'grant' as const })),
    ...bgLangProfs.map(value => ({ characterSheetId: sheetId, proficiencyType: 'language' as const, value, action: 'grant' as const })),
    ...d.selectedLanguages.map(value => ({ characterSheetId: sheetId, proficiencyType: 'language' as const, value, action: 'grant' as const })),
  ]
  if (proficiencyRows.length) {
    await db.insert(schema.characterProficiencyOverrides).values(proficiencyRows)
  }

  // Emplacements de sorts
  const casterType = CASTER_TYPE[cls.name] ?? 'none'
  if (casterType !== 'none') {
    const slots = slotsForLevel(casterType, d.level)
    const slotType = casterType === 'pact' ? 'pact_magic' : 'spellcasting'
    const slotRows = slots
      .map((total, i) => ({ characterSheetId: sheetId, slotLevel: i + 1, slotType: slotType as any, total, used: 0 }))
      .filter(r => r.total > 0)
    if (slotRows.length) {
      await db.insert(schema.characterSpellSlots).values(slotRows)
    }
  }

  // Sorts
  if (d.spellIds.length) {
    await db.insert(schema.characterSpells).values(
      d.spellIds.map(spellId => ({ characterSheetId: sheetId, spellId, isKnown: true, isPrepared: true })),
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
