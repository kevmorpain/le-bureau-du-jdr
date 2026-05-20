import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import { eq, and, lte, sql } from 'drizzle-orm'
import { z } from 'zod'

const levelUpSchema = z.object({
  classDbName: z.string(),             // e.g. 'Guerrier'
  isMulticlass: z.boolean(),
  hpGained: z.number().int().min(1),
  subclassName: z.string().nullable().optional(),
  fightingStyle: z.string().nullable().optional(),
  expertiseSkills: z.array(z.string()).optional(),
  asiChoice: z.enum(['asi', 'feat']).nullable().optional(),
  asiBonuses: z.record(z.string(), z.number().int().min(0).max(2)).nullable().optional(),
  featId: z.string().nullable().optional(),
  newSkills: z.array(z.string()).optional(),
  newCantripIds: z.array(z.number().int()).optional(),
  newSpellIds: z.array(z.number().int()).optional(),
})

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

  // ── 1. Resolve class by DB name ────────────────────────────────────────────

  const [cls] = await db
    .select({ id: schema.classes.id, hitDice: schema.classes.hitDice, name: schema.classes.name })
    .from(schema.classes)
    .where(eq(schema.classes.name, d.classDbName))
    .limit(1)

  if (!cls) throw createError({ statusCode: 404, statusMessage: `Class not found: ${d.classDbName}` })

  // ── 2. Resolve subclass if needed ──────────────────────────────────────────

  let subclassId: number | null = null
  if (d.subclassName) {
    const [sub] = await db
      .select({ id: schema.subclasses.id })
      .from(schema.subclasses)
      .where(and(
        eq(schema.subclasses.classId, cls.id),
        sql`lower(${schema.subclasses.name}) = lower(${d.subclassName})`,
      ))
      .limit(1)
    subclassId = sub?.id ?? null
  }

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
    })
    .onConflictDoUpdate({
      target: [schema.characterClasses.characterSheetId, schema.characterClasses.classId],
      set: {
        level: sql`excluded.level`,
        subclassId: subclassId !== null ? sql`excluded.subclass_id` : schema.characterClasses.subclassId,
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

  const newSubclassFeatures = subclassId
    ? await db
        .select({ id: schema.features.id })
        .from(schema.features)
        .where(
          and(
            eq(schema.features.subclassId, subclassId),
            eq(schema.features.featureType, 'subclass_feature'),
            lte(schema.features.levelRequired, newLevel),
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

  if (pactSlots) {
    for (let i = 0; i < 9; i++) {
      const total = pactSlots[i] ?? 0
      if (total > 0) {
        const existing = slotsByKey.get(`${i + 1}:pact_magic`)
        slotsToUpsert.push({
          characterSheetId,
          slotLevel: i + 1,
          slotType: 'pact_magic',
          total,
          used: Math.min(existing?.used ?? 0, total),
        })
      }
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
