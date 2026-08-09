import { and, eq, inArray, lte, sql } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { z } from 'zod'
import * as schema from '~~/server/db/schema'
import { isPassiveGrant } from '~~/server/utils/features'
import { applyInvocationChanges } from '~~/server/utils/invocations'
import { CharacterValidationError } from '~~/server/utils/characterCreate'
import { abilityEnum } from '~~/shared/rules/abilities'
import { combinedSpellSlots } from '~~/shared/rules/spellSlots'
import type { Ruleset } from '~~/shared/rules/ruleset'

/**
 * Logique de MONTÉE DE NIVEAU extraite du handler (point 5d, volet 3), même patron que
 * `characterCreate` : `db` INJECTÉ (testable libsql sans auth), VALIDATION serveur conservatrice
 * (sous-classe∈classe, manifestation∈groupe) et ~10 écritures rendues atomiques par un seul
 * `db.batch()` (jamais `db.transaction()`). Les changements d'invocations passent par
 * `applyInvocationChanges` (util DI, remplacement + ajouts idempotents) après le batch.
 *
 * maxHp/hpGained restent fournis par le client (formule PV front-only, chantier à part).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

const ARCANUM_LEVEL_TO_SOURCE: Record<number, 'arcanum_6' | 'arcanum_7' | 'arcanum_8' | 'arcanum_9'> = {
  11: 'arcanum_6',
  13: 'arcanum_7',
  15: 'arcanum_8',
  17: 'arcanum_9',
}

export const levelUpSchema = z.object({
  classId: z.number().int().positive(),
  isMulticlass: z.boolean(),
  hpGained: z.number().int().min(1),
  subclassId: z.number().int().positive().nullable().optional(),
  fightingStyle: z.string().nullable().optional(),
  expertiseSkills: z.array(z.string()).optional(),
  asiChoice: z.enum(['asi', 'feat']).nullable().optional(),
  asiBonuses: z.record(z.string(), z.number().int().min(0).max(2)).nullable().optional(),
  featureId: z.number().int().positive().nullable().optional(),
  featChoices: z.object({ ability: abilityEnum.optional() }).nullable().optional(),
  newSkills: z.array(z.string()).optional(),
  newCantripIds: z.array(z.number().int()).optional(),
  newSpellIds: z.array(z.number().int()).optional(),
  pactBoon: z.enum(['chain', 'blade', 'tome']).nullable().optional(),
  pactWeaponInventoryId: z.number().int().nullable().optional(),
  pactBoonCantripIds: z.array(z.number().int()).optional(),
  newInvocationIds: z.array(z.number().int().positive()).optional(),
  replacedInvocationId: z.number().int().positive().nullable().optional(),
  arcaneMysteriumSpellId: z.number().int().positive().nullable().optional(),
  bookOfAncientSecretsSpellIds: z.array(z.number().int().positive()).max(2).optional(),
})

export type LevelUpInput = z.infer<typeof levelUpSchema>

/** Validation serveur CONSERVATRICE (ne rejette que l'illégal non ambigu). */
async function validateLevelUp(db: Db, d: LevelUpInput, classId: number, subclassId: number | null): Promise<void> {
  if (subclassId != null) {
    const [sub] = await db
      .select({ classId: schema.subclasses.classId })
      .from(schema.subclasses)
      .where(eq(schema.subclasses.id, subclassId))
      .limit(1)
    if (!sub) throw new CharacterValidationError(`Sous-classe introuvable (id=${subclassId}).`)
    if (sub.classId !== classId) throw new CharacterValidationError(`La sous-classe (id=${subclassId}) n'appartient pas à la classe (id=${classId}).`)
  }

  const newInv = d.newInvocationIds ?? []
  if (newInv.length) {
    const inGroup = await db
      .select({ id: schema.features.id })
      .from(schema.features)
      .where(and(eq(schema.features.tag, 'invocation'), inArray(schema.features.id, newInv)))
    if (inGroup.length !== newInv.length) throw new CharacterValidationError(`Une manifestation choisie est inconnue ou n'est pas une invocation.`)
  }
}

/**
 * Garde de COHÉRENCE d'ÉDITION du level-up (défense en profondeur, Lot A) : toute aptitude/don
 * (feat d'ASI, nouvelles manifestations) et tout sort référencés doivent partager le `ruleset`
 * de la fiche. La classe est vérifiée par l'appelant. No-op tant que tout est en '5'.
 */
async function validateLevelUpRulesetCoherence(db: Db, d: LevelUpInput, ruleset: Ruleset): Promise<void> {
  const featureIds = [
    ...(d.featureId != null ? [d.featureId] : []),
    ...(d.newInvocationIds ?? []),
  ]
  if (featureIds.length) {
    const rows = await db
      .select({ id: schema.features.id, ruleset: schema.features.ruleset })
      .from(schema.features)
      .where(inArray(schema.features.id, featureIds))
    const bad = rows.find(r => r.ruleset !== ruleset)
    if (bad) throw new CharacterValidationError(`Une aptitude/un don référencé (id=${bad.id}, éd. ${bad.ruleset}) est incompatible avec l'édition de la fiche (${ruleset}).`)
  }

  const spellIds = [
    ...(d.newCantripIds ?? []),
    ...(d.newSpellIds ?? []),
    ...(d.pactBoonCantripIds ?? []),
    ...(d.arcaneMysteriumSpellId != null ? [d.arcaneMysteriumSpellId] : []),
    ...(d.bookOfAncientSecretsSpellIds ?? []),
  ]
  if (spellIds.length) {
    const rows = await db
      .select({ id: schema.spells.id, ruleset: schema.spells.ruleset })
      .from(schema.spells)
      .where(inArray(schema.spells.id, spellIds))
    const bad = rows.find(r => r.ruleset !== ruleset)
    if (bad) throw new CharacterValidationError(`Un sort référencé (id=${bad.id}, éd. ${bad.ruleset}) est incompatible avec l'édition de la fiche (${ruleset}).`)
  }
}

export async function characterLevelUp(db: Db, characterSheetId: number, d: LevelUpInput): Promise<{ success: true, newLevel: number, hpGained: number }> {
  // ── 1. Classe (hitDice pour les PV) ─────────────────────────────────────────
  const [cls] = await db
    .select({ id: schema.classes.id, hitDice: schema.classes.hitDice, ruleset: schema.classes.ruleset })
    .from(schema.classes)
    .where(eq(schema.classes.id, d.classId))
    .limit(1)
  if (!cls) throw new CharacterValidationError(`Classe introuvable (id=${d.classId}).`)

  const subclassId: number | null = d.subclassId ?? null

  // ── 2. État courant (classes + fiche) ───────────────────────────────────────
  const currentClasses = await db
    .select()
    .from(schema.characterClasses)
    .where(eq(schema.characterClasses.characterSheetId, characterSheetId))
  const existingClass = currentClasses.find(c => c.classId === cls.id)
  const newLevel = d.isMulticlass ? 1 : (existingClass?.level ?? 0) + 1

  const [charSheet] = await db
    .select({ maxHp: schema.characterSheets.maxHp, currentHitDie: schema.characterSheets.currentHitDie, ruleset: schema.characterSheets.ruleset })
    .from(schema.characterSheets)
    .where(eq(schema.characterSheets.id, characterSheetId))
    .limit(1)
  if (!charSheet) throw new CharacterValidationError('Personnage introuvable.')

  // ── 3. Validation serveur (avant écritures) ─────────────────────────────────
  // Cohérence d'édition (défense en profondeur, Lot A) : la classe montée et toute entité
  // datée référencée doivent partager le `ruleset` FIGÉ de la fiche. No-op tant que tout='5'.
  const ruleset: Ruleset = charSheet.ruleset
  if (cls.ruleset !== ruleset) throw new CharacterValidationError(`La classe (id=${cls.id}, éd. ${cls.ruleset}) est incompatible avec l'édition de la fiche (${ruleset}).`)
  await validateLevelUpRulesetCoherence(db, d, ruleset)
  await validateLevelUp(db, d, cls.id, subclassId)

  // ── 4. Lectures dépendantes (features débloquées, familier, slots) ───────────
  const newClassFeatures = await db
    .select({ id: schema.features.id })
    .from(schema.features)
    .where(and(
      eq(schema.features.classId, cls.id),
      eq(schema.features.featureType, 'class_feature'),
      eq(schema.features.levelRequired, newLevel),
      isPassiveGrant(),
    ))

  const effectiveSubclassId = subclassId ?? existingClass?.subclassId ?? null
  const newSubclassFeatures = effectiveSubclassId
    ? await db
        .select({ id: schema.features.id })
        .from(schema.features)
        .where(and(
          eq(schema.features.subclassId, effectiveSubclassId),
          eq(schema.features.featureType, 'subclass_feature'),
          subclassId !== null ? lte(schema.features.levelRequired, newLevel) : eq(schema.features.levelRequired, newLevel),
          isPassiveGrant(),
        ))
    : []
  const newFeatureIds = [...newClassFeatures, ...newSubclassFeatures].map(f => f.id)

  let familiarSpellId: number | null = null
  if (d.pactBoon === 'chain') {
    const [familiar] = await db
      .select({ id: schema.spells.id })
      .from(schema.spells)
      .where(eq(schema.spells.name, 'Appel de familier'))
      .limit(1)
    familiarSpellId = familiar?.id ?? null
  }

  // Recalcul des emplacements de sorts (dérivés serveur)
  const newClassesList = currentClasses
    .filter(c => c.classId !== cls.id)
    .map(c => ({ classId: c.classId, level: c.level }))
  newClassesList.push({ classId: cls.id, level: newLevel })

  const classRows = await db
    .select({ id: schema.classes.id, spellcastingType: schema.classes.spellcastingType })
    .from(schema.classes)
    .where(inArray(schema.classes.id, newClassesList.map(c => c.classId)))
  const casterTypeById = new Map(classRows.map(c => [c.id, c.spellcastingType]))
  const classesForSlots = newClassesList.map(c => ({ casterType: casterTypeById.get(c.classId) ?? 'none', level: c.level }))
  const { regular: regSlots, pact: pactSlots } = combinedSpellSlots(classesForSlots)

  const existingSlots = await db
    .select()
    .from(schema.characterSpellSlots)
    .where(eq(schema.characterSpellSlots.characterSheetId, characterSheetId))
  const slotsByKey = new Map(existingSlots.map(s => [`${s.slotLevel}:${s.slotType}`, s]))

  const slotsToUpsert: Array<{ characterSheetId: number, slotLevel: number, slotType: 'spellcasting' | 'pact_magic', total: number, used: number }> = []
  if (regSlots) {
    for (let i = 0; i < 9; i++) {
      const total = regSlots[i] ?? 0
      if (total > 0) {
        const existing = slotsByKey.get(`${i + 1}:spellcasting`)
        slotsToUpsert.push({ characterSheetId, slotLevel: i + 1, slotType: 'spellcasting', total, used: Math.min(existing?.used ?? 0, total) })
      }
    }
  }
  let newPactLevel: number | null = null
  if (pactSlots) {
    for (let i = 0; i < 9; i++) {
      const total = pactSlots[i] ?? 0
      if (total > 0) {
        newPactLevel = i + 1
        const previousPactUsed = existingSlots.filter(s => s.slotType === 'pact_magic').reduce((max, s) => Math.max(max, s.used), 0)
        slotsToUpsert.push({ characterSheetId, slotLevel: newPactLevel, slotType: 'pact_magic', total, used: Math.min(previousPactUsed, total) })
        break
      }
    }
  }
  const pactSlotsToDelete = existingSlots.filter(s => s.slotType === 'pact_magic' && s.slotLevel !== newPactLevel)

  // Dé de vie mis à jour (+1 sur le dé de la classe qui monte)
  const hitDieMatch = cls.hitDice?.match(/\d+d(\d+)/)
  const hitDieSides = hitDieMatch?.[1] as ('4' | '6' | '8' | '10' | '12') | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentHitDie: Array<{ die: string, count: number }> = (charSheet.currentHitDie as any) ?? []
  let updatedHitDie = [...currentHitDie]
  if (hitDieSides) {
    const existing = updatedHitDie.find(hd => hd.die === hitDieSides)
    if (existing) updatedHitDie = updatedHitDie.map(hd => hd.die === hitDieSides ? { ...hd, count: hd.count + 1 } : hd)
    else updatedHitDie.push({ die: hitDieSides, count: 1 })
  }

  // ── 5. Écritures dépendantes — un seul db.batch() atomique ───────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stmts: any[] = []

  // Classe (insert nouvelle classe en multiclasse, sinon bump du niveau via conflit)
  stmts.push(db
    .insert(schema.characterClasses)
    .values({
      characterSheetId,
      classId: cls.id,
      level: newLevel,
      isMain: existingClass?.isMain ?? (currentClasses.length === 0),
      subclassId: subclassId ?? existingClass?.subclassId ?? null,
      pactBoon: d.pactBoon ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .onConflictDoUpdate({
      target: [schema.characterClasses.characterSheetId, schema.characterClasses.classId],
      set: {
        level: sql`excluded.level`,
        subclassId: subclassId !== null ? sql`excluded.subclass_id` : schema.characterClasses.subclassId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pactBoon: d.pactBoon != null ? sql`excluded.pact_boon` : (schema.characterClasses as any).pactBoon,
      },
    }))

  if (newFeatureIds.length) {
    stmts.push(db.insert(schema.characterFeatures)
      .values(newFeatureIds.map(featureId => ({ characterSheetId, featureId, currentUses: 0 })))
      .onConflictDoNothing())
  }

  stmts.push(db.update(schema.characterSheets)
    .set({ maxHp: charSheet.maxHp + d.hpGained, currentHitDie: updatedHitDie as unknown as typeof charSheet.currentHitDie, updatedAt: new Date().toISOString() })
    .where(eq(schema.characterSheets.id, characterSheetId)))

  if (d.asiChoice === 'asi' && d.asiBonuses) {
    const improvements = Object.entries(d.asiBonuses)
      .filter(([, v]) => v > 0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(([ability, amount]) => ({ characterSheetId, classId: cls.id, classLevel: newLevel, ability: ability as any, amount }))
    if (improvements.length) stmts.push(db.insert(schema.characterAbilityScoreImprovements).values(improvements))
  }

  if (d.asiChoice === 'feat' && d.featureId) {
    stmts.push(db.insert(schema.characterFeatures)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .values({ characterSheetId, featureId: d.featureId, currentUses: 0, source: 'asi', classLevel: newLevel, choices: d.featChoices ?? null } as any)
      .onConflictDoNothing())
  }

  const allNewSpellIds = [...(d.newCantripIds ?? []), ...(d.newSpellIds ?? [])]
  if (allNewSpellIds.length) {
    stmts.push(db.insert(schema.characterSpells)
      .values(allNewSpellIds.map(spellId => ({ characterSheetId, spellId, isKnown: true, isPrepared: false })))
      .onConflictDoNothing())
  }

  // Faveur du Pacte
  if (d.pactBoon === 'chain' && familiarSpellId != null) {
    stmts.push(db.insert(schema.characterSpells)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .values({ characterSheetId, spellId: familiarSpellId, isKnown: true, isPrepared: false, source: 'pact_chain' } as any)
      .onConflictDoNothing())
  }
  else if (d.pactBoon === 'tome' && d.pactBoonCantripIds?.length) {
    stmts.push(db.insert(schema.characterSpells)
      .values(d.pactBoonCantripIds.map(spellId => ({ characterSheetId, spellId, isKnown: true, isPrepared: false, source: 'pact_tome' as const })))
      .onConflictDoNothing())
  }
  else if (d.pactBoon === 'blade' && d.pactWeaponInventoryId) {
    stmts.push(db.update(schema.characterInventory).set({ isPactWeapon: false }).where(eq(schema.characterInventory.characterSheetId, characterSheetId)))
    stmts.push(db.update(schema.characterInventory).set({ isPactWeapon: true }).where(and(
      eq(schema.characterInventory.id, d.pactWeaponInventoryId),
      eq(schema.characterInventory.characterSheetId, characterSheetId),
    )))
  }

  // Arcane Mystérieux — écrase le sort du même palier s'il existe
  if (d.arcaneMysteriumSpellId != null) {
    const source = ARCANUM_LEVEL_TO_SOURCE[newLevel]
    if (source) {
      stmts.push(db.delete(schema.characterSpells).where(and(
        eq(schema.characterSpells.characterSheetId, characterSheetId),
        eq(schema.characterSpells.source, source),
      )))
      stmts.push(db.insert(schema.characterSpells)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .values({ characterSheetId, spellId: d.arcaneMysteriumSpellId, isKnown: true, isPrepared: false, source } as any)
        .onConflictDoNothing())
    }
  }

  if (d.bookOfAncientSecretsSpellIds?.length) {
    stmts.push(db.insert(schema.characterSpells)
      .values(d.bookOfAncientSecretsSpellIds.map(spellId => ({ characterSheetId, spellId, isKnown: true, isPrepared: false, source: 'book_of_ancient_secrets' as const })))
      .onConflictDoNothing())
  }

  if (d.newSkills?.length) {
    stmts.push(db.insert(schema.characterSkills)
      .values(d.newSkills.map(skillKey => ({ characterSheetId, skillKey, proficiencyLevel: 'proficient' as const, source: 'class' as const, isOverride: false })))
      .onConflictDoNothing())
  }

  if (d.expertiseSkills?.length) {
    for (const skillKey of d.expertiseSkills) {
      stmts.push(db.insert(schema.characterSkills)
        .values({ characterSheetId, skillKey, proficiencyLevel: 'expert' as const, source: 'class' as const, isOverride: false })
        .onConflictDoUpdate({
          target: [schema.characterSkills.characterSheetId, schema.characterSkills.skillKey, schema.characterSkills.source],
          set: { proficiencyLevel: sql`'expert'` },
        }))
    }
  }

  // Emplacements de sorts : supprimer les anciens pact_magic périmés, upsert les nouveaux
  for (const s of pactSlotsToDelete) {
    stmts.push(db.delete(schema.characterSpellSlots).where(and(
      eq(schema.characterSpellSlots.characterSheetId, characterSheetId),
      eq(schema.characterSpellSlots.slotLevel, s.slotLevel),
      eq(schema.characterSpellSlots.slotType, 'pact_magic'),
    )))
  }
  if (slotsToUpsert.length) {
    stmts.push(db.insert(schema.characterSpellSlots)
      .values(slotsToUpsert)
      .onConflictDoUpdate({
        target: [schema.characterSpellSlots.characterSheetId, schema.characterSpellSlots.slotLevel, schema.characterSpellSlots.slotType],
        set: { total: sql`excluded.total`, used: sql`excluded.used` },
      }))
  }

  // db.batch() = atomique sur D1 (JAMAIS db.transaction()).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).batch(stmts as [any, ...any[]])

  // ── 6. Manifestations occultes (remplacement + ajouts) — util DI, idempotent ──
  if (d.replacedInvocationId || (d.newInvocationIds && d.newInvocationIds.length)) {
    await applyInvocationChanges(db, characterSheetId, d.newInvocationIds ?? [], d.replacedInvocationId ?? null)
  }

  return { success: true, newLevel, hpGained: d.hpGained }
}
