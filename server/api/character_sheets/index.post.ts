import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import * as srcSchema from '~~/server/db/schema'
import { and, eq, lte, sql } from 'drizzle-orm'
import { z } from 'zod'
import { applyInvocationChanges } from '~~/server/utils/invocations'

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
  // Liens vers entités DB (résolus côté client via useBuilderEntities)
  classId: z.number().int().positive(),
  subclassId: z.number().int().positive().nullable().optional(),
  level: z.number().int().min(1).max(20),
  speciesId: z.number().int().positive().nullable().optional(),
  backgroundId: z.number().int().positive().nullable().optional(),
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
  // Équipement — IDs résolus côté client ; les items inconnus sont retombés en texte
  // libre pour ne pas perdre l'info (currency, items custom, etc.).
  inventoryItemIds: z.array(z.number().int().positive()).optional().default([]),
  inventoryItemNamesUnresolved: z.array(z.string()).optional().default([]),
  // Monnaie
  pp: z.number().int().min(0).optional(),
  po: z.number().int().min(0).optional(),
  pe: z.number().int().min(0).optional(),
  pa: z.number().int().min(0).optional(),
  pc: z.number().int().min(0).optional(),
  // Faveur du Pacte (Occultiste niveau ≥ 3)
  pactBoon: z.enum(['chain', 'blade', 'tome']).nullable().optional(),
  pactWeaponItemId: z.number().int().positive().nullable().optional(),
  pactBoonCantripIds: z.array(z.number().int()).optional(),
  // Manifestations occultes (Occultiste niveau ≥ 2)
  invocationIds: z.array(z.number().int().positive()).optional(),
  // Bonus ASI répartis (paliers 4/8/12/… selon classe). Chaque palier doit
  // totaliser 2 points ; on accepte tel quel sans re-vérifier (le builder valide).
  asiBonuses: z
    .array(z.object({
      classLevel: z.number().int().min(1).max(20),
      ability: z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']),
      amount: z.number().int().min(1).max(2),
    }))
    .optional()
    .default([]),
  // Dons choisis par palier d'ASI (source='asi'). featureId = features.id du don.
  asiFeats: z
    .array(z.object({
      classLevel: z.number().int().min(1).max(20),
      featureId: z.number().int().positive(),
      choices: z.object({ ability: z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']).optional() }).nullable().optional(),
    }))
    .optional()
    .default([]),
  // Don bonus hors-palier (homebrew MJ — typiquement attribué au niveau 1).
  // Persisté dans character_features avec source='bonus' et class_level=null.
  bonusFeatureId: z.number().int().positive().nullable().optional(),
  bonusFeatChoices: z.object({ ability: z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']).optional() }).nullable().optional(),
  // Arcanum mystique (Occultiste niv 11/13/15/17) — sort de niv 6/7/8/9 choisi
  arcaneMysteriumSpellId: z.number().int().positive().nullable().optional(),
  // Livre des secrets anciens — 2 sorts rituels niv 1 quand la manifestation est choisie
  bookOfAncientSecretsSpellIds: z.array(z.number().int().positive()).max(2).optional(),
})

// Mapping niveau d'occultiste → source DB pour les sorts d'Arcanum mystique
const ARCANUM_LEVEL_TO_SOURCE: Record<number, 'arcanum_6' | 'arcanum_7' | 'arcanum_8' | 'arcanum_9'> = {
  11: 'arcanum_6',
  13: 'arcanum_7',
  15: 'arcanum_8',
  17: 'arcanum_9',
}

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const result = await readValidatedBody(event, builderSchema.safeParse)
  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error })
  }

  const d = result.data

  // ── Récupération des entités déjà résolues côté client ────────────────────
  // Tout est passé en IDs : on récupère uniquement les rows nécessaires pour
  // les champs dérivés (hitDice de la classe, maîtrises héritées du background).

  const [cls] = await db
    .select({ id: schema.classes.id, name: schema.classes.name, hitDice: schema.classes.hitDice })
    .from(schema.classes)
    .where(eq(schema.classes.id, d.classId))
    .limit(1)

  if (!cls) throw createError({ statusCode: 400, statusMessage: `Classe introuvable (id=${d.classId})` })

  const subclassId: number | null = d.subclassId ?? null
  const speciesId: number | null = d.speciesId ?? null

  // Background — on charge les maîtrises héritées (tools/langues) du preset
  let backgroundId: number | null = d.backgroundId ?? null
  let bgToolProfs: string[] = []
  let bgLangProfs: string[] = []
  if (backgroundId) {
    const [bg] = await db
      .select({
        id: schema.backgrounds.id,
        toolProficiencies: schema.backgrounds.toolProficiencies,
        languageProficiencies: schema.backgrounds.languageProficiencies,
      })
      .from(schema.backgrounds)
      .where(and(
        eq(schema.backgrounds.id, backgroundId),
        sql`${schema.backgrounds.characterSheetId} IS NULL`,
      ))
      .limit(1)
    if (!bg) {
      // Garde-fou : le client a envoyé un id qui ne correspond à aucun preset.
      // On ignore plutôt que de planter, mais on log côté serveur pour repérer.
      console.warn(`[character_sheets POST] backgroundId=${backgroundId} non trouvé en DB (ignoré)`)
      backgroundId = null
    }
    else {
      const isChoice = (s: string) => s.toLowerCase().includes('choix') || s.includes('×')
      bgToolProfs = (bg.toolProficiencies ?? []).filter(p => !isChoice(p))
      bgLangProfs = (bg.languageProficiencies ?? []).filter(p => !isChoice(p))
    }
  }

  const itemIds: number[] = d.inventoryItemIds ?? []
  // Note : si tu veux logger les items que le client n'a pas pu résoudre,
  // ils sont dans d.inventoryItemNamesUnresolved. On les ignore silencieusement
  // côté DB (rien à insérer) mais le client peut afficher un warning.
  if (d.inventoryItemNamesUnresolved?.length) {
    console.warn('[character_sheets POST] items non résolus côté client :', d.inventoryItemNamesUnresolved)
  }

  // ── Hit die ───────────────────────────────────────────────────────────────────

  const hitDieMatch = cls.hitDice?.match(/\d+d(\d+)/)
  const hitDieSides = hitDieMatch?.[1]
  const currentHitDie = hitDieSides ? [{ die: hitDieSides, count: d.level }] : []

  // ── Insertions séquentielles (D1 : pas de transaction) ──────────────────────

  const sheet = await db
    .insert(schema.characterSheets)
    .values({
      ownerId: user.id,
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
    pactBoon: d.pactBoon ?? null,
  } as any)

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

  // Bonus ASI (Ability Score Improvements). On insère les rows tels quels —
  // c'est ce que `useCharacterSheet` lit pour calculer les scores finaux.
  if (d.asiBonuses?.length) {
    await db.insert(schema.characterAbilityScoreImprovements).values(
      d.asiBonuses.map(b => ({
        characterSheetId: sheetId,
        classId: cls.id,
        classLevel: b.classLevel,
        ability: b.ability as any,
        amount: b.amount,
      })),
    )
  }

  // Persistance des dons : asiFeats (source='asi') + bonusFeatureId (source='bonus').
  // Tout passe par character_features (feature_type='feat' côté DB).
  const featRows = [
    ...(d.asiFeats ?? []).map(f => ({
      characterSheetId: sheetId,
      featureId: f.featureId,
      currentUses: 0,
      source: 'asi' as const,
      classLevel: f.classLevel,
      choices: f.choices ?? null,
    })),
    ...(d.bonusFeatureId
      ? [{
          characterSheetId: sheetId,
          featureId: d.bonusFeatureId,
          currentUses: 0,
          source: 'bonus' as const,
          classLevel: null as number | null,
          choices: d.bonusFeatChoices ?? null,
        }]
      : []),
  ]
  if (featRows.length) {
    await db.insert(srcSchema.characterFeatures).values(featRows as any).onConflictDoNothing()
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

  // Faveur du Pacte effects
  if (d.pactBoon === 'chain') {
    const [familiarSpell] = await db
      .select({ id: schema.spells.id })
      .from(schema.spells)
      .where(eq(schema.spells.name, 'Appel de familier'))
      .limit(1)
    if (familiarSpell) {
      await db
        .insert(schema.characterSpells)
        .values({ characterSheetId: sheetId, spellId: familiarSpell.id, isKnown: true, isPrepared: false, source: 'pact_chain' } as any)
        .onConflictDoNothing()
    }
  }
  else if (d.pactBoon === 'tome' && d.pactBoonCantripIds?.length) {
    await db
      .insert(schema.characterSpells)
      .values(d.pactBoonCantripIds.map(spellId => ({
        characterSheetId: sheetId,
        spellId,
        isKnown: true,
        isPrepared: false,
        source: 'pact_tome' as const,
      })))
      .onConflictDoNothing()
  }
  else if (d.pactBoon === 'blade' && d.pactWeaponItemId && itemIds.length) {
    const [inv] = await db
      .select({ invId: srcSchema.characterInventory.id })
      .from(srcSchema.characterInventory)
      .where(and(
        eq(srcSchema.characterInventory.characterSheetId, sheetId),
        eq(srcSchema.characterInventory.itemId, d.pactWeaponItemId),
      ))
      .limit(1)
    if (inv) {
      await db
        .update(srcSchema.characterInventory)
        .set({ isPactWeapon: true })
        .where(eq(srcSchema.characterInventory.id, inv.invId))
    }
  }

  // Manifestations occultes (Occultiste)
  if (d.invocationIds && d.invocationIds.length) {
    await applyInvocationChanges(sheetId, d.invocationIds, null)
  }

  // Arcanum mystique (Occultiste niv 11/13/15/17) — sort 1×/repos long
  if (d.arcaneMysteriumSpellId != null) {
    const source = ARCANUM_LEVEL_TO_SOURCE[d.level]
    if (source) {
      await db
        .insert(srcSchema.characterSpells)
        .values({
          characterSheetId: sheetId,
          spellId: d.arcaneMysteriumSpellId,
          isKnown: true,
          isPrepared: false,
          source,
        } as any)
        .onConflictDoNothing()
    }
  }

  // Livre des secrets anciens (manifestation Tome) — 2 sorts rituels niv 1
  if (d.bookOfAncientSecretsSpellIds && d.bookOfAncientSecretsSpellIds.length) {
    await db
      .insert(srcSchema.characterSpells)
      .values(d.bookOfAncientSecretsSpellIds.map(spellId => ({
        characterSheetId: sheetId,
        spellId,
        isKnown: true,
        isPrepared: false,
        source: 'book_of_ancient_secrets' as const,
      })))
      .onConflictDoNothing()
  }

  setResponseStatus(event, 201)
  return { id: sheetId }
})
