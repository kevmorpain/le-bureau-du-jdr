import { and, eq, inArray, lte, sql } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { z } from 'zod'
import * as schema from '~~/server/db/schema'
import { isPassiveGrant } from '~~/server/utils/features'
import { buildCatalog } from '~~/server/utils/catalog'
import { abilityEnum, savingThrowKey } from '~~/shared/rules/abilities'
import { slotsForLevel } from '~~/shared/rules/spellSlots'
import { resolveChoices } from '~~/shared/rules/resolve'

/**
 * Logique de CRÉATION de personnage extraite du handler (point 5d, volet 2). Objectifs
 * (rules-engine.md §7, decisions.md D14) :
 *  - **autorité serveur** : dériver (emplacements de sorts) et VALIDER les choix (sous-classe∈classe,
 *    manifestation∈groupe & nombre, faveur de pacte légitime, sort d'arcanum légal) au lieu de faire
 *    confiance au client ;
 *  - **atomicité** : les ~10 inserts dépendants passent par un seul `db.batch()` (atomique sur D1,
 *    JAMAIS `db.transaction()` qui rejette BEGIN). ⚠️ Limite D1 : l'insert de la FICHE reste
 *    hors-batch (on a besoin de son id auto-incrément pour tout le reste) ;
 *  - **testabilité** : `db` est INJECTÉ (D1 en prod, libsql en test) → la logique est testable sans
 *    la barrière d'auth `requireUserSession` (qui reste dans le handler mince).
 *
 * Périmètre volet 2 : la CRÉATION. Le level-up et le rest suivront. La dérivation de `maxHp` reste
 * cliente (formule PV front-only aujourd'hui) — chantier séparé.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

/** Erreur de validation métier → le handler la mappe en HTTP 422. */
export class CharacterValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CharacterValidationError'
  }
}

// Alignement builder (lowercase) → DB (uppercase)
const ALIGNMENT_MAP: Record<string, string> = {
  lg: 'LG', ng: 'NG', cg: 'CG',
  ln: 'LN', n: 'TN', cn: 'CN',
  le: 'LE', ne: 'NE', ce: 'CE',
}

// Mapping niveau d'occultiste → source DB pour les sorts d'Arcanum mystique
const ARCANUM_LEVEL_TO_SOURCE: Record<number, 'arcanum_6' | 'arcanum_7' | 'arcanum_8' | 'arcanum_9'> = {
  11: 'arcanum_6',
  13: 'arcanum_7',
  15: 'arcanum_8',
  17: 'arcanum_9',
}

export const createCharacterSchema = z.object({
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
  // Zod dérivé de la source canonique (D6) : les JS de classe sont des clés de
  // caractéristique, transformées en `<carac>_save` à l'insertion (savingThrowKey).
  classSavingThrows: z.array(abilityEnum),
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
  // Bonus ASI répartis (paliers 4/8/12/… selon classe).
  asiBonuses: z
    .array(z.object({
      classLevel: z.number().int().min(1).max(20),
      ability: abilityEnum,
      amount: z.number().int().min(1).max(2),
    }))
    .optional()
    .default([]),
  // Dons choisis par palier d'ASI (source='asi'). featureId = features.id du don.
  asiFeats: z
    .array(z.object({
      classLevel: z.number().int().min(1).max(20),
      featureId: z.number().int().positive(),
      choices: z.object({ ability: abilityEnum.optional() }).nullable().optional(),
    }))
    .optional()
    .default([]),
  // Don bonus hors-palier (homebrew MJ — typiquement attribué au niveau 1).
  bonusFeatureId: z.number().int().positive().nullable().optional(),
  bonusFeatChoices: z.object({ ability: abilityEnum.optional() }).nullable().optional(),
  // Arcanum mystique (Occultiste niv 11/13/15/17) — sort de niv 6/7/8/9 choisi
  arcaneMysteriumSpellId: z.number().int().positive().nullable().optional(),
  // Livre des secrets anciens — 2 sorts rituels niv 1 quand la manifestation est choisie
  bookOfAncientSecretsSpellIds: z.array(z.number().int().positive()).max(2).optional(),
})

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>

/**
 * VALIDATION serveur des choix — CONSERVATRICE (ne rejette que des violations non ambiguës, pour
 * ne jamais recaler une création légitime). Ce que le catalogue/résolution permettent de vérifier
 * aujourd'hui : sous-classe∈classe, manifestation∈groupe & nombre, faveur de pacte légitime, sort
 * d'arcanum légal. Les compétences/sorts « libres » restent front-autoritaires jusqu'au point 6
 * (données non catalogables encore) — documenté, pas une régression.
 */
async function validateChoices(db: Db, d: CreateCharacterInput, classId: number, subclassId: number | null): Promise<void> {
  // V1 — sous-classe ∈ classe
  if (subclassId != null) {
    const [sub] = await db
      .select({ classId: schema.subclasses.classId })
      .from(schema.subclasses)
      .where(eq(schema.subclasses.id, subclassId))
      .limit(1)
    if (!sub) throw new CharacterValidationError(`Sous-classe introuvable (id=${subclassId}).`)
    if (sub.classId !== classId) throw new CharacterValidationError(`La sous-classe (id=${subclassId}) n'appartient pas à la classe (id=${classId}).`)
  }

  const invocationIds = d.invocationIds ?? []
  const needsCatalog = invocationIds.length > 0 || d.pactBoon != null || d.arcaneMysteriumSpellId != null
  if (!needsCatalog) return

  const catalog = await buildCatalog(db, { classIds: [classId] })
  const { choices } = resolveChoices({ classLevels: { [classId]: d.level }, subclassIds: subclassId != null ? [subclassId] : [] }, catalog)

  // V2 + V3 — manifestations occultes : chacune ∈ groupe `invocation`, nombre ≤ table du niveau
  if (invocationIds.length > 0) {
    const invChoice = choices.find(c => c.kind === 'invocations')
    if (!invChoice) throw new CharacterValidationError(`Cette classe ne peut pas choisir de manifestations occultes au niveau ${d.level}.`)
    const inGroup = await db
      .select({ id: schema.features.id })
      .from(schema.features)
      .where(and(eq(schema.features.tag, 'invocation'), inArray(schema.features.id, invocationIds)))
    if (inGroup.length !== invocationIds.length) throw new CharacterValidationError(`Une manifestation choisie est inconnue ou n'est pas une invocation.`)
    if (invocationIds.length > invChoice.count) throw new CharacterValidationError(`Trop de manifestations occultes (${invocationIds.length} pour un maximum de ${invChoice.count}).`)
  }

  // V4 — faveur de pacte : la classe doit y avoir droit à ce niveau
  if (d.pactBoon != null && !choices.some(c => c.kind === 'pact_boon')) {
    throw new CharacterValidationError(`Cette classe ne peut pas choisir de faveur de pacte au niveau ${d.level}.`)
  }

  // V5 — arcanum mystique : le sort doit être un choix légal (sort de la classe ≤ niveau de l'arcanum)
  if (d.arcaneMysteriumSpellId != null) {
    const legal = choices.some(c => c.kind === 'spell' && c.options.some(o => o.spellId === d.arcaneMysteriumSpellId))
    if (!legal) throw new CharacterValidationError(`Le sort d'arcanum mystique (id=${d.arcaneMysteriumSpellId}) n'est pas un choix légal au niveau ${d.level}.`)
  }
}

export async function createCharacter(db: Db, d: CreateCharacterInput, ownerId: number): Promise<{ id: number }> {
  // ── 1. Lectures des entités résolues côté client ────────────────────────────
  const [cls] = await db
    .select({ id: schema.classes.id, hitDice: schema.classes.hitDice, spellcastingType: schema.classes.spellcastingType })
    .from(schema.classes)
    .where(eq(schema.classes.id, d.classId))
    .limit(1)
  if (!cls) throw new CharacterValidationError(`Classe introuvable (id=${d.classId}).`)

  const subclassId: number | null = d.subclassId ?? null
  const speciesId: number | null = d.speciesId ?? null

  // Background preset — maîtrises héritées (outils / langues)
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
      .where(and(eq(schema.backgrounds.id, backgroundId), sql`${schema.backgrounds.characterSheetId} IS NULL`))
      .limit(1)
    if (!bg) {
      console.warn(`[createCharacter] backgroundId=${backgroundId} non trouvé en DB (ignoré)`)
      backgroundId = null
    }
    else {
      const isChoice = (s: string) => s.toLowerCase().includes('choix') || s.includes('×')
      bgToolProfs = (bg.toolProficiencies ?? []).filter(p => !isChoice(p))
      bgLangProfs = (bg.languageProficiencies ?? []).filter(p => !isChoice(p))
    }
  }

  const itemIds: number[] = d.inventoryItemIds ?? []
  if (d.inventoryItemNamesUnresolved?.length) {
    console.warn('[createCharacter] items non résolus côté client :', d.inventoryItemNamesUnresolved)
  }

  // ── 2. Validation serveur (autorité) — AVANT toute écriture ──────────────────
  await validateChoices(db, d, cls.id, subclassId)

  // ── 3. Lectures dépendantes (features passifs, sorts octroyés) — avant le batch ──
  const classFeatureRows = await db
    .select({ id: schema.features.id })
    .from(schema.features)
    .where(and(
      eq(schema.features.classId, cls.id),
      eq(schema.features.featureType, 'class_feature'),
      lte(schema.features.levelRequired, d.level),
      isPassiveGrant(),
    ))
  const subclassFeatureRows = subclassId
    ? await db
        .select({ id: schema.features.id })
        .from(schema.features)
        .where(and(
          eq(schema.features.subclassId, subclassId),
          eq(schema.features.featureType, 'subclass_feature'),
          lte(schema.features.levelRequired, d.level),
          isPassiveGrant(),
        ))
    : []
  const passiveFeatureIds = [...classFeatureRows, ...subclassFeatureRows].map(f => f.id)

  // Pacte de la Chaîne : sort « Appel de familier »
  let familiarSpellId: number | null = null
  if (d.pactBoon === 'chain') {
    const [familiar] = await db
      .select({ id: schema.spells.id })
      .from(schema.spells)
      .where(eq(schema.spells.name, 'Appel de familier'))
      .limit(1)
    familiarSpellId = familiar?.id ?? null
  }

  // Manifestations : sorts octroyés (spell_grant → nom → id) à matérialiser
  let invocationGrantSpellIds: number[] = []
  if (d.invocationIds?.length) {
    const grants = await db
      .select({ value: schema.effects.value })
      .from(schema.featureEffects)
      .innerJoin(schema.effects, eq(schema.featureEffects.effectId, schema.effects.id))
      .where(and(inArray(schema.featureEffects.featureId, d.invocationIds), eq(schema.effects.type, 'spell_grant')))
    const spellNames = grants
      .map(r => (r.value as { spellName?: string } | null)?.spellName)
      .filter((n): n is string => typeof n === 'string')
    if (spellNames.length) {
      const spellRows = await db
        .select({ id: schema.spells.id })
        .from(schema.spells)
        .where(inArray(schema.spells.name, spellNames))
      invocationGrantSpellIds = spellRows.map(s => s.id)
    }
  }

  // ── 4. Insert de la fiche (HORS batch — id auto-incrément) ───────────────────
  const hitDieMatch = cls.hitDice?.match(/\d+d(\d+)/)
  const hitDieSides = hitDieMatch?.[1]
  const currentHitDie = hitDieSides ? [{ die: hitDieSides, count: d.level }] : []

  const [sheet] = await db
    .insert(schema.characterSheets)
    .values({
      ownerId,
      name: d.name,
      speciesId: speciesId ?? undefined,
      backgroundId: backgroundId ?? undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      alignment: (ALIGNMENT_MAP[d.alignment ?? ''] ?? 'TN') as any,
      maxHp: d.maxHp,
      currentHp: d.maxHp,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .returning()
  const sheetId = sheet!.id

  // Background personnalisé — insert (hors batch pour son id), la liaison va dans le batch
  let customBackgroundId: number | null = null
  if (d.customBackgroundName) {
    const [customBg] = await db
      .insert(schema.backgrounds)
      .values({ name: d.customBackgroundName, characterSheetId: sheetId })
      .returning()
    customBackgroundId = customBg!.id
  }

  // ── 5. Écritures dépendantes — un seul db.batch() atomique ───────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stmts: any[] = []

  if (customBackgroundId != null) {
    stmts.push(db.update(schema.characterSheets).set({ backgroundId: customBackgroundId }).where(eq(schema.characterSheets.id, sheetId)))
  }

  // Classe
  stmts.push(db.insert(schema.characterClasses).values({
    characterSheetId: sheetId,
    classId: cls.id,
    level: d.level,
    isMain: true,
    subclassId,
    pactBoon: d.pactBoon ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any))

  // Features passifs (classe + sous-classe)
  if (passiveFeatureIds.length) {
    stmts.push(db.insert(schema.characterFeatures).values(
      passiveFeatureIds.map(featureId => ({ characterSheetId: sheetId, featureId, currentUses: 0 })),
    ))
  }

  // Bonus ASI
  if (d.asiBonuses?.length) {
    stmts.push(db.insert(schema.characterAbilityScoreImprovements).values(
      d.asiBonuses.map(b => ({
        characterSheetId: sheetId,
        classId: cls.id,
        classLevel: b.classLevel,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ability: b.ability as any,
        amount: b.amount,
      })),
    ))
  }

  // Dons (asiFeats source='asi' + bonusFeatureId source='bonus')
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stmts.push(db.insert(schema.characterFeatures).values(featRows as any).onConflictDoNothing())
  }

  // Caractéristiques
  const abilityEntries = Object.entries(d.abilityScores)
  if (abilityEntries.length) {
    stmts.push(db.insert(schema.characterAbilityScores).values(
      abilityEntries.map(([key, value]) => ({ characterSheetId: sheetId, abilityId: key, value })),
    ))
  }

  // Compétences + JDS de classe + compétences d'historique
  const skillRows = [
    ...d.classSkills.map(key => ({ characterSheetId: sheetId, skillKey: key, proficiencyLevel: 'proficient' as const, source: 'class' as const, isOverride: false })),
    ...d.classSavingThrows.map(key => ({ characterSheetId: sheetId, skillKey: savingThrowKey(key), proficiencyLevel: 'proficient' as const, source: 'class' as const, isOverride: false })),
    ...d.backgroundSkills.map(key => ({ characterSheetId: sheetId, skillKey: key, proficiencyLevel: 'proficient' as const, source: 'background' as const, isOverride: false })),
  ]
  if (skillRows.length) {
    stmts.push(db.insert(schema.characterSkills).values(skillRows))
  }

  // Maîtrises (armures / armes / outils / langues)
  const proficiencyRows = [
    ...d.armorProficiencyKeys.map(value => ({ characterSheetId: sheetId, proficiencyType: 'armor' as const, value, action: 'grant' as const })),
    ...d.weaponProficiencyKeys.map(value => ({ characterSheetId: sheetId, proficiencyType: 'weapon' as const, value, action: 'grant' as const })),
    ...bgToolProfs.map(value => ({ characterSheetId: sheetId, proficiencyType: 'tool' as const, value, action: 'grant' as const })),
    ...d.toolProficiencyChoices.map(value => ({ characterSheetId: sheetId, proficiencyType: 'tool' as const, value, action: 'grant' as const })),
    ...bgLangProfs.map(value => ({ characterSheetId: sheetId, proficiencyType: 'language' as const, value, action: 'grant' as const })),
    ...d.selectedLanguages.map(value => ({ characterSheetId: sheetId, proficiencyType: 'language' as const, value, action: 'grant' as const })),
  ]
  if (proficiencyRows.length) {
    stmts.push(db.insert(schema.characterProficiencyOverrides).values(proficiencyRows))
  }

  // Emplacements de sorts (DÉRIVÉS serveur, cf. shared/rules/spellSlots.ts)
  const casterType = cls.spellcastingType
  if (casterType !== 'none') {
    const slots = slotsForLevel(casterType, d.level)
    const slotType = casterType === 'pact' ? 'pact_magic' : 'spellcasting'
    const slotRows = slots
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((total, i) => ({ characterSheetId: sheetId, slotLevel: i + 1, slotType: slotType as any, total, used: 0 }))
      .filter(r => r.total > 0)
    if (slotRows.length) {
      stmts.push(db.insert(schema.characterSpellSlots).values(slotRows))
    }
  }

  // Sorts connus
  if (d.spellIds.length) {
    stmts.push(db.insert(schema.characterSpells).values(
      d.spellIds.map(spellId => ({ characterSheetId: sheetId, spellId, isKnown: true, isPrepared: true })),
    ))
  }

  // Inventaire (isPactWeapon posé À L'INSERT pour le pacte de la Lame — évite un read+update)
  if (itemIds.length) {
    stmts.push(db.insert(schema.characterInventory).values(
      itemIds.map(itemId => ({
        characterSheetId: sheetId,
        itemId,
        quantity: 1,
        isPactWeapon: d.pactBoon === 'blade' && d.pactWeaponItemId === itemId,
      })),
    ))
  }

  // Faveur du Pacte — sorts associés
  if (d.pactBoon === 'chain' && familiarSpellId != null) {
    stmts.push(db.insert(schema.characterSpells)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .values({ characterSheetId: sheetId, spellId: familiarSpellId, isKnown: true, isPrepared: false, source: 'pact_chain' } as any)
      .onConflictDoNothing())
  }
  else if (d.pactBoon === 'tome' && d.pactBoonCantripIds?.length) {
    stmts.push(db.insert(schema.characterSpells)
      .values(d.pactBoonCantripIds.map(spellId => ({ characterSheetId: sheetId, spellId, isKnown: true, isPrepared: false, source: 'pact_tome' as const })))
      .onConflictDoNothing())
  }

  // Manifestations occultes — features + sorts octroyés (materialisés dans le batch)
  if (d.invocationIds?.length) {
    stmts.push(db.insert(schema.characterFeatures)
      .values(d.invocationIds.map(featureId => ({ characterSheetId: sheetId, featureId, currentUses: 0 })))
      .onConflictDoNothing())
    if (invocationGrantSpellIds.length) {
      stmts.push(db.insert(schema.characterSpells)
        .values(invocationGrantSpellIds.map(spellId => ({ characterSheetId: sheetId, spellId, isKnown: true, isPrepared: false, source: 'invocation' as const })))
        .onConflictDoNothing())
    }
  }

  // Arcanum mystique — sort 1×/repos long (source arcanum_*)
  if (d.arcaneMysteriumSpellId != null) {
    const source = ARCANUM_LEVEL_TO_SOURCE[d.level]
    if (source) {
      stmts.push(db.insert(schema.characterSpells)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .values({ characterSheetId: sheetId, spellId: d.arcaneMysteriumSpellId, isKnown: true, isPrepared: false, source } as any)
        .onConflictDoNothing())
    }
  }

  // Livre des secrets anciens — 2 sorts rituels niv. 1
  if (d.bookOfAncientSecretsSpellIds?.length) {
    stmts.push(db.insert(schema.characterSpells)
      .values(d.bookOfAncientSecretsSpellIds.map(spellId => ({ characterSheetId: sheetId, spellId, isKnown: true, isPrepared: false, source: 'book_of_ancient_secrets' as const })))
      .onConflictDoNothing())
  }

  if (stmts.length) {
    // db.batch() = atomique sur D1 (JAMAIS db.transaction() qui rejette BEGIN). `.batch()` n'est
    // pas sur le type de base `BaseSQLiteDatabase` (il vit sur les classes driver d1/libsql) → cast.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).batch(stmts as [any, ...any[]])
  }

  return { id: sheetId }
}
