import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import * as srcSchema from '~~/server/db/schema'
import { eq, and, lte, sql } from 'drizzle-orm'
import { z } from 'zod'
import { applyInvocationChanges } from '~~/server/utils/invocations'

const levelUpSchema = z.object({
  classId: z.number().int().positive(),
  isMulticlass: z.boolean(),
  hpGained: z.number().int().min(1),
  subclassId: z.number().int().positive().nullable().optional(),
  fightingStyle: z.string().nullable().optional(),
  expertiseSkills: z.array(z.string()).optional(),
  asiChoice: z.enum(['asi', 'feat']).nullable().optional(),
  asiBonuses: z.record(z.string(), z.number().int().min(0).max(2)).nullable().optional(),
  // featureId = features.id du don pris à ce palier (résolu côté client via /api/feats)
  featureId: z.number().int().positive().nullable().optional(),
  // Choix de caractéristique +1 du don (Observateur/Résilient…) le cas échéant.
  featChoices: z.object({ ability: z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']).optional() }).nullable().optional(),
  newSkills: z.array(z.string()).optional(),
  newCantripIds: z.array(z.number().int()).optional(),
  newSpellIds: z.array(z.number().int()).optional(),
  pactBoon: z.enum(['chain', 'blade', 'tome']).nullable().optional(),
  pactWeaponInventoryId: z.number().int().nullable().optional(),
  pactBoonCantripIds: z.array(z.number().int()).optional(),
  newInvocationIds: z.array(z.number().int().positive()).optional(),
  replacedInvocationId: z.number().int().positive().nullable().optional(),
  // Arcane Mystérieux — sort de niv 6/7/8/9 choisi aux paliers d'occultiste 11/13/15/17.
  arcaneMysteriumSpellId: z.number().int().positive().nullable().optional(),
  // Livre des anciens secrets — 2 sorts rituels niv. 1 quand l'invocation est choisie.
  bookOfAncientSecretsSpellIds: z.array(z.number().int().positive()).max(2).optional(),
})

// Mapping niveau d'occultiste → niveau de sort de l'Arcane Mystérieux + source DB
const ARCANUM_LEVEL_TO_SOURCE: Record<number, 'arcanum_6' | 'arcanum_7' | 'arcanum_8' | 'arcanum_9'> = {
  11: 'arcanum_6',
  13: 'arcanum_7',
  15: 'arcanum_8',
  17: 'arcanum_9',
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

// Caster type by DB class name
const CASTER_TYPE: Record<string, 'full' | 'half' | 'pact' | 'none'> = {
  'Barde': 'full', 'Clerc': 'full', 'Druide': 'full', 'Ensorceleur': 'full', 'Magicien': 'full',
  'Paladin': 'half', 'Rôdeur': 'half',
  'Occultiste': 'pact',
}

function slotsForLevel(type: 'full' | 'half' | 'pact', level: number): number[] {
  const idx = Math.max(0, Math.min(19, level - 1))
  if (type === 'full') return [...FULL_SLOTS[idx]!]
  if (type === 'half') return [...HALF_SLOTS[idx]!]
  // pact
  const row = [0,0,0,0,0,0,0,0,0]
  const sl = PACT_LEVEL[idx]!
  row[sl - 1] = PACT_COUNT[idx]!
  return row
}

function combinedSpellSlots(classes: Array<{ dbName: string, level: number }>) {
  let combined = 0
  let pactLvl = 0
  let hasPact = false
  for (const { dbName, level } of classes) {
    const t = CASTER_TYPE[dbName]
    if (t === 'full') combined += level
    else if (t === 'half' && level >= 2) combined += Math.floor(level / 2)
    else if (t === 'pact') { hasPact = true; pactLvl += level }
  }
  const reg = combined > 0 ? slotsForLevel('full', Math.max(1, Math.min(20, combined))) : null
  const pact = hasPact ? slotsForLevel('pact', Math.max(1, Math.min(20, pactLvl))) : null
  return { regular: reg, pact }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)

  if (!characterSheetId) throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })

  const result = await readValidatedBody(event, levelUpSchema.safeParse)
  if (!result.success) throw createError({ statusCode: 422, data: result.error })

  const d = result.data

  // ── 1. Charge la classe (besoin du hitDice + name pour le caster lookup) ───

  const [cls] = await db
    .select({ id: schema.classes.id, hitDice: schema.classes.hitDice, name: schema.classes.name })
    .from(schema.classes)
    .where(eq(schema.classes.id, d.classId))
    .limit(1)

  if (!cls) throw createError({ statusCode: 404, statusMessage: `Class not found (id=${d.classId})` })

  // ── 2. ID de sous-classe (résolu côté client) ─────────────────────────────

  const subclassId: number | null = d.subclassId ?? null

  // ── 3. Load current class data ────────────────────────────────────────────

  const currentClasses = await db
    .select()
    .from(schema.characterClasses)
    .where(eq(schema.characterClasses.characterSheetId, characterSheetId))

  const existingClass = currentClasses.find(c => c.classId === cls.id)
  const newLevel = d.isMulticlass ? 1 : (existingClass?.level ?? 0) + 1

  // ── 4. Load current character sheet ───────────────────────────────────────

  const [charSheet] = await db
    .select({ maxHp: schema.characterSheets.maxHp, currentHitDie: schema.characterSheets.currentHitDie })
    .from(schema.characterSheets)
    .where(eq(schema.characterSheets.id, characterSheetId))
    .limit(1)

  if (!charSheet) throw createError({ statusCode: 404, statusMessage: 'Character not found' })

  // ── 5. Update character_classes ───────────────────────────────────────────

  await db
    .insert(schema.characterClasses)
    .values({
      characterSheetId,
      classId: cls.id,
      level: newLevel,
      isMain: existingClass?.isMain ?? (currentClasses.length === 0),
      subclassId: subclassId ?? existingClass?.subclassId ?? null,
      pactBoon: d.pactBoon ?? null,
    } as any)
    .onConflictDoUpdate({
      target: [schema.characterClasses.characterSheetId, schema.characterClasses.classId],
      set: {
        level: sql`excluded.level`,
        subclassId: subclassId !== null ? sql`excluded.subclass_id` : schema.characterClasses.subclassId,
        pactBoon: d.pactBoon != null ? sql`excluded.pact_boon` : (schema.characterClasses as any).pactBoon,
      },
    })

  // ── 5b. Features de classe / sous-classe débloquées ──────────────────────

  const newClassFeatures = await db
    .select({ id: schema.features.id })
    .from(schema.features)
    .where(
      and(
        eq(schema.features.classId, cls.id),
        eq(schema.features.featureType, 'class_feature'),
        eq(schema.features.levelRequired, newLevel),
      ),
    )

  // Sous-classe effective :
  //  - quand on pick la sous-classe dans cette montée de niveau (subclassId non nul),
  //    on lie toutes les features ≤ newLevel pour rattraper d'éventuels paliers manqués ;
  //  - sinon (sous-classe déjà attachée au perso), on lie uniquement les features
  //    débloquées au nouveau niveau atteint.
  const effectiveSubclassId = subclassId ?? existingClass?.subclassId ?? null
  const newSubclassFeatures = effectiveSubclassId
    ? await db
        .select({ id: schema.features.id })
        .from(schema.features)
        .where(
          and(
            eq(schema.features.subclassId, effectiveSubclassId),
            eq(schema.features.featureType, 'subclass_feature'),
            subclassId !== null
              ? lte(schema.features.levelRequired, newLevel)
              : eq(schema.features.levelRequired, newLevel),
          ),
        )
    : []

  const newFeatureIds = [...newClassFeatures, ...newSubclassFeatures].map(f => f.id)
  if (newFeatureIds.length) {
    await db
      .insert(schema.characterFeatures)
      .values(newFeatureIds.map(featureId => ({ characterSheetId, featureId, currentUses: 0 })))
      .onConflictDoNothing()
  }

  // ── 6. Update character_sheets (maxHp + currentHitDie) ───────────────────

  // Calculate new hit die type from hitDice string (e.g. '1d10' → '10')
  const hitDieMatch = cls.hitDice?.match(/\d+d(\d+)/)
  const hitDieSides = hitDieMatch?.[1] as ('4'|'6'|'8'|'10'|'12') | undefined

  // Update currentHitDie pool (add 1 to the relevant die)
  const currentHitDie: Array<{die: string, count: number}> = (charSheet.currentHitDie as any) ?? []
  let updatedHitDie = [...currentHitDie]
  if (hitDieSides) {
    const existing = updatedHitDie.find(hd => hd.die === hitDieSides)
    if (existing) {
      updatedHitDie = updatedHitDie.map(hd =>
        hd.die === hitDieSides ? { ...hd, count: hd.count + 1 } : hd,
      )
    } else {
      updatedHitDie.push({ die: hitDieSides, count: 1 })
    }
  }

  await db
    .update(schema.characterSheets)
    .set({
      maxHp: charSheet.maxHp + d.hpGained,
      currentHitDie: updatedHitDie as any,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.characterSheets.id, characterSheetId))

  // ── 7. ASI improvements ───────────────────────────────────────────────────

  if (d.asiChoice === 'asi' && d.asiBonuses) {
    const improvements = Object.entries(d.asiBonuses)
      .filter(([, v]) => v > 0)
      .map(([ability, amount]) => ({
        characterSheetId,
        classId: cls.id,
        classLevel: newLevel,
        ability: ability as any,
        amount,
      }))
    if (improvements.length) {
      await db.insert(schema.characterAbilityScoreImprovements).values(improvements)
    }
  }

  // Don choisi au palier d'ASI (source='asi'). Persisté dans character_features.
  if (d.asiChoice === 'feat' && d.featureId) {
    await db
      .insert(srcSchema.characterFeatures)
      .values({
        characterSheetId,
        featureId: d.featureId,
        currentUses: 0,
        source: 'asi',
        classLevel: newLevel,
        choices: d.featChoices ?? null,
      } as any)
      .onConflictDoNothing()
  }

  // ── 8. New spells ─────────────────────────────────────────────────────────

  const allNewSpellIds = [...(d.newCantripIds ?? []), ...(d.newSpellIds ?? [])]
  if (allNewSpellIds.length) {
    await db
      .insert(schema.characterSpells)
      .values(allNewSpellIds.map(spellId => ({
        characterSheetId,
        spellId,
        isKnown: true,
        isPrepared: false,
      })))
      .onConflictDoNothing()
  }

  // ── 8b. Faveur du Pacte effects ───────────────────────────────────────────

  if (d.pactBoon === 'chain') {
    const [familiarSpell] = await db
      .select({ id: schema.spells.id })
      .from(schema.spells)
      .where(eq(schema.spells.name, 'Appel de familier'))
      .limit(1)
    if (familiarSpell) {
      await db
        .insert(schema.characterSpells)
        .values({ characterSheetId, spellId: familiarSpell.id, isKnown: true, isPrepared: false, source: 'pact_chain' } as any)
        .onConflictDoNothing()
    }
  }
  else if (d.pactBoon === 'tome' && d.pactBoonCantripIds?.length) {
    await db
      .insert(schema.characterSpells)
      .values(d.pactBoonCantripIds.map(spellId => ({
        characterSheetId,
        spellId,
        isKnown: true,
        isPrepared: false,
        source: 'pact_tome' as const,
      })))
      .onConflictDoNothing()
  }
  else if (d.pactBoon === 'blade' && d.pactWeaponInventoryId) {
    await db.batch([
      db.update(srcSchema.characterInventory)
        .set({ isPactWeapon: false })
        .where(eq(srcSchema.characterInventory.characterSheetId, characterSheetId)),
      db.update(srcSchema.characterInventory)
        .set({ isPactWeapon: true })
        .where(and(
          eq(srcSchema.characterInventory.id, d.pactWeaponInventoryId),
          eq(srcSchema.characterInventory.characterSheetId, characterSheetId),
        )),
    ])
  }

  // ── 8c. Manifestations occultes ─────────────────────────────────────────────

  if (d.replacedInvocationId || (d.newInvocationIds && d.newInvocationIds.length)) {
    await applyInvocationChanges(
      characterSheetId,
      d.newInvocationIds ?? [],
      d.replacedInvocationId ?? null,
    )
  }

  // ── 8d. Arcane Mystérieux ──────────────────────────────────────────────────
  // Le sort choisi est inscrit dans characterSpells avec une source `arcanum_*`
  // (utilisée pour afficher un badge sur la fiche). Le compteur 1×/repos long
  // est porté par la feature elle-même (Arcane mystérieux 6e/7e/8e/9e) via
  // `maxUsesFormula` + `rechargeType=long_rest` déjà seedés.

  if (d.arcaneMysteriumSpellId != null) {
    const source = ARCANUM_LEVEL_TO_SOURCE[newLevel]
    if (source) {
      // Si un sort d'Arcanum à ce niveau était déjà choisi, on l'écrase.
      await db
        .delete(srcSchema.characterSpells)
        .where(and(
          eq(srcSchema.characterSpells.characterSheetId, characterSheetId),
          eq(srcSchema.characterSpells.source, source),
        ))
      await db
        .insert(srcSchema.characterSpells)
        .values({
          characterSheetId,
          spellId: d.arcaneMysteriumSpellId,
          isKnown: true,
          isPrepared: false,
          source,
        } as any)
        .onConflictDoNothing()
    }
  }

  // ── 8e. Livre des anciens secrets — sorts rituels ──────────────────────────

  if (d.bookOfAncientSecretsSpellIds && d.bookOfAncientSecretsSpellIds.length) {
    await db
      .insert(srcSchema.characterSpells)
      .values(d.bookOfAncientSecretsSpellIds.map(spellId => ({
        characterSheetId,
        spellId,
        isKnown: true,
        isPrepared: false,
        source: 'book_of_ancient_secrets' as const,
      })))
      .onConflictDoNothing()
  }

  // ── 9. New skills (multiclass proficiencies) ──────────────────────────────

  if (d.newSkills?.length) {
    await db
      .insert(schema.characterSkills)
      .values(d.newSkills.map(skillKey => ({
        characterSheetId,
        skillKey,
        proficiencyLevel: 'proficient' as const,
        source: 'class' as const,
        isOverride: false,
      })))
      .onConflictDoNothing()
  }

  // ── 10. Expertise skills ─────────────────────────────────────────────────

  if (d.expertiseSkills?.length) {
    for (const skillKey of d.expertiseSkills) {
      await db
        .insert(schema.characterSkills)
        .values({
          characterSheetId,
          skillKey,
          proficiencyLevel: 'expert' as const,
          source: 'class' as const,
          isOverride: false,
        })
        .onConflictDoUpdate({
          target: [
            schema.characterSkills.characterSheetId,
            schema.characterSkills.skillKey,
            schema.characterSkills.source,
          ],
          set: { proficiencyLevel: sql`'expert'` },
        })
    }
  }

  // ── 11. Recalculate spell slots ───────────────────────────────────────────

  // Build new classes list after level-up
  const newClassesList = currentClasses
    .filter(c => c.classId !== cls.id)
    .map(c => ({ classId: c.classId, level: c.level }))
  newClassesList.push({ classId: cls.id, level: newLevel })

  // Resolve DB names for each class
  const classIds = newClassesList.map(c => c.classId)
  const classRows = await db
    .select({ id: schema.classes.id, name: schema.classes.name })
    .from(schema.classes)
    .where(sql`${schema.classes.id} IN (${sql.join(classIds.map(i => sql`${i}`), sql`, `)})`)

  const classNameById = new Map(classRows.map(c => [c.id, c.name]))

  const classesForSlots = newClassesList.map(c => ({
    dbName: classNameById.get(c.classId) ?? '',
    level: c.level,
  }))

  const { regular: regSlots, pact: pactSlots } = combinedSpellSlots(classesForSlots)

  // Load existing slots to preserve "used" counts
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
        slotsToUpsert.push({
          characterSheetId,
          slotLevel: i + 1,
          slotType: 'spellcasting',
          total,
          used: Math.min(existing?.used ?? 0, total),
        })
      }
    }
  }

  // ── Pact Magic (Occultiste) ────────────────────────────────────────────────
  // Particularité : tous les emplacements de pacte sont du même niveau, et ce
  // niveau augmente avec le niveau d'occultiste (1→3 = pact slots niv. 2, etc.).
  // Il faut donc supprimer les anciens emplacements de pacte aux autres niveaux
  // avant d'upsert le nouveau niveau, sinon ils s'accumulent.
  let newPactLevel: number | null = null
  if (pactSlots) {
    for (let i = 0; i < 9; i++) {
      const total = pactSlots[i] ?? 0
      if (total > 0) {
        newPactLevel = i + 1
        // Préserve le "used" depuis n'importe quel ancien slot de pacte
        // (le joueur a peut-être dépensé des emplacements avant la montée de niveau)
        const previousPactUsed = existingSlots
          .filter(s => s.slotType === 'pact_magic')
          .reduce((max, s) => Math.max(max, s.used), 0)
        slotsToUpsert.push({
          characterSheetId,
          slotLevel: newPactLevel,
          slotType: 'pact_magic',
          total,
          used: Math.min(previousPactUsed, total),
        })
        break // tous les pact slots sont du même niveau, on s'arrête
      }
    }
  }

  // Supprimer les anciens pact_magic slots qui ne sont plus pertinents
  // (différent niveau, ou plus du tout d'emplacement de pacte si on perd la classe)
  const pactSlotsToDelete = existingSlots.filter(s =>
    s.slotType === 'pact_magic' && s.slotLevel !== newPactLevel,
  )
  if (pactSlotsToDelete.length) {
    for (const s of pactSlotsToDelete) {
      await db
        .delete(schema.characterSpellSlots)
        .where(and(
          eq(schema.characterSpellSlots.characterSheetId, characterSheetId),
          eq(schema.characterSpellSlots.slotLevel, s.slotLevel),
          eq(schema.characterSpellSlots.slotType, 'pact_magic'),
        ))
    }
  }

  if (slotsToUpsert.length) {
    await db
      .insert(schema.characterSpellSlots)
      .values(slotsToUpsert)
      .onConflictDoUpdate({
        target: [
          schema.characterSpellSlots.characterSheetId,
          schema.characterSpellSlots.slotLevel,
          schema.characterSpellSlots.slotType,
        ],
        set: {
          total: sql`excluded.total`,
          used: sql`excluded.used`,
        },
      })
  }

  return { success: true, newLevel, hpGained: d.hpGained }
})
