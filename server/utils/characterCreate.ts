import { and, eq, inArray, lte, sql } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { z } from 'zod'
import * as schema from '~~/server/db/schema'
import { isPassiveGrant } from '~~/server/utils/features'
import { buildCatalog } from '~~/server/utils/catalog'
import { resolveFightingStylePick } from '~~/server/utils/fightingStyle'
import { resolveExpertiseProgressionId, expertiseWriteStmts } from '~~/server/utils/expertise'
import { abilityEnum, savingThrowKey } from '~~/shared/rules/abilities'
import { slotsForLevel } from '~~/shared/rules/spellSlots'
import { resolveChoices } from '~~/shared/rules/resolve'
import { isValidAbilityDistribution } from '~~/shared/rules/composite'
import type { Ruleset } from '~~/shared/rules/ruleset'
import type { AbilityKey } from '~~/shared/rules/abilities'
import { alignmentCodeFromBuilderId } from '~~/shared/rules/alignments'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

export class CharacterValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CharacterValidationError'
  }
}

// Mapping niveau de SORT d'arcanum (6/7/8/9) → source DB. À la création, chaque arcanum
// débloqué porte son propre niveau de sort (contrairement au level-up, mono-palier, qui
// mappe le niveau d'occultiste atteint).
const ARCANUM_SPELL_LEVEL_TO_SOURCE: Record<number, 'arcanum_6' | 'arcanum_7' | 'arcanum_8' | 'arcanum_9'> = {
  6: 'arcanum_6',
  7: 'arcanum_7',
  8: 'arcanum_8',
  9: 'arcanum_9',
}

export const createCharacterSchema = z.object({
  name: z.string().min(1).max(100),
  alignment: z.string().optional(),
  dragonbornAncestry: z.string().nullable().optional(),
  maxHp: z.number().int().positive(),
  classId: z.number().int().positive(),
  subclassId: z.number().int().positive().nullable().optional(),
  fightingStyle: z.string().nullable().optional(),
  expertiseSkills: z.array(z.string()).optional().default([]),
  level: z.number().int().min(1).max(20),
  speciesId: z.number().int().positive().nullable().optional(),
  selectedLineageId: z.number().int().positive().nullable().optional(),
  backgroundId: z.number().int().positive().nullable().optional(),
  customBackgroundName: z.string().nullable().optional(),
  personality: z.string().optional(),
  ideals: z.string().optional(),
  bonds: z.string().optional(),
  flaws: z.string().optional(),
  age: z.string().max(50).optional(),
  height: z.string().max(50).optional(),
  weight: z.string().max(50).optional(),
  eyes: z.string().max(50).optional(),
  hair: z.string().max(50).optional(),
  skin: z.string().max(50).optional(),
  deity: z.string().max(100).optional(),
  backstory: z.string().max(10000).optional(),
  allies: z.string().max(5000).optional(),
  portraitUrl: z.string().max(2000).optional(),
  abilityScores: z.record(z.string(), z.number().int()),
  classSkills: z.array(z.string()),
  classSavingThrows: z.array(abilityEnum),
  armorProficiencyKeys: z.array(z.string()).optional().default([]),
  weaponProficiencyKeys: z.array(z.string()).optional().default([]),
  toolProficiencyChoices: z.array(z.string()).optional().default([]),
  backgroundSkills: z.array(z.string()),
  selectedLanguages: z.array(z.string()).optional().default([]),
  spellIds: z.array(z.number().int()),
  // Items non résolus côté client : conservés en texte libre.
  inventoryItemIds: z.array(z.number().int().positive()).optional().default([]),
  inventoryItemNamesUnresolved: z.array(z.string()).optional().default([]),
  pp: z.number().int().min(0).optional(),
  po: z.number().int().min(0).optional(),
  pe: z.number().int().min(0).optional(),
  pa: z.number().int().min(0).optional(),
  pc: z.number().int().min(0).optional(),
  pactBoon: z.enum(['chain', 'blade', 'tome']).nullable().optional(),
  pactWeaponItemId: z.number().int().positive().nullable().optional(),
  pactBoonCantripIds: z.array(z.number().int()).optional(),
  invocationIds: z.array(z.number().int().positive()).optional(),
  metamagicIds: z.array(z.number().int().positive()).optional(),
  asiBonuses: z
    .array(z.object({
      classLevel: z.number().int().min(1).max(20),
      ability: abilityEnum,
      amount: z.number().int().min(1).max(2),
    }))
    .optional()
    .default([]),
  asiFeats: z
    .array(z.object({
      classLevel: z.number().int().min(1).max(20),
      featureId: z.number().int().positive(),
      choices: z.object({ ability: abilityEnum.optional(), spellId: z.number().int().positive().optional() }).nullable().optional(),
    }))
    .optional()
    .default([]),
  // Don bonus hors palier (homebrew MJ).
  bonusFeatureId: z.number().int().positive().nullable().optional(),
  bonusFeatChoices: z.object({ ability: abilityEnum.optional(), spellId: z.number().int().positive().optional() }).nullable().optional(),
  // Cumulatif à la création d'un perso de haut niveau : un sort par palier débloqué.
  arcaneMysteria: z.array(z.object({
    spellLevel: z.number().int().min(6).max(9),
    spellId: z.number().int().positive(),
  })).optional(),
  bookOfAncientSecretsSpellIds: z.array(z.number().int().positive()).max(2).optional(),
  abilityScoreChoices: z
    .array(z.object({
      progressionId: z.number().int().positive(),
      payload: z.record(abilityEnum, z.number().int().min(1).max(2)),
    }))
    .optional()
    .default([]),
  weaponMasteryChoices: z
    .array(z.object({
      progressionId: z.number().int().positive(),
      weapons: z.array(z.string().min(1)).min(1),
    }))
    .optional()
    .default([]),
})

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>

// Défense en profondeur : une requête forgée pourrait poser une entité 5.5 sur une fiche 2014. La classe sert d'ancre.
async function validateRulesetCoherence(db: Db, d: CreateCharacterInput, ruleset: Ruleset): Promise<void> {
  if (d.speciesId != null) {
    const [sp] = await db
      .select({ ruleset: schema.characterSpecies.ruleset })
      .from(schema.characterSpecies)
      .where(eq(schema.characterSpecies.id, d.speciesId))
      .limit(1)
    if (sp && sp.ruleset !== ruleset) throw new CharacterValidationError(`L'espèce (id=${d.speciesId}, éd. ${sp.ruleset}) est incompatible avec l'édition de la fiche (${ruleset}).`)
  }

  if (d.backgroundId != null) {
    const [bg] = await db
      .select({ ruleset: schema.backgrounds.ruleset })
      .from(schema.backgrounds)
      .where(eq(schema.backgrounds.id, d.backgroundId))
      .limit(1)
    if (bg && bg.ruleset !== ruleset) throw new CharacterValidationError(`L'historique (id=${d.backgroundId}, éd. ${bg.ruleset}) est incompatible avec l'édition de la fiche (${ruleset}).`)
  }

  const featureIds = [
    ...(d.asiFeats ?? []).map(f => f.featureId),
    ...(d.bonusFeatureId != null ? [d.bonusFeatureId] : []),
    ...(d.invocationIds ?? []),
    ...(d.metamagicIds ?? []),
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
    ...d.spellIds,
    ...(d.pactBoonCantripIds ?? []),
    ...(d.arcaneMysteria ?? []).map(a => a.spellId),
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

// Conservatrice : ne rejette que les violations non ambiguës, pour ne jamais recaler une création légitime.
async function validateChoices(db: Db, d: CreateCharacterInput, classId: number, subclassId: number | null): Promise<void> {
  if (subclassId != null) {
    const [sub] = await db
      .select({ classId: schema.subclasses.classId })
      .from(schema.subclasses)
      .where(eq(schema.subclasses.id, subclassId))
      .limit(1)
    if (!sub) throw new CharacterValidationError(`Sous-classe introuvable (id=${subclassId}).`)
    if (sub.classId !== classId) throw new CharacterValidationError(`La sous-classe (id=${subclassId}) n'appartient pas à la classe (id=${classId}).`)
  }

  if (d.selectedLineageId != null) {
    if (d.speciesId == null) throw new CharacterValidationError(`Une lignée (id=${d.selectedLineageId}) est choisie sans espèce.`)
    const [lin] = await db
      .select({ speciesId: schema.speciesLineages.speciesId })
      .from(schema.speciesLineages)
      .where(eq(schema.speciesLineages.id, d.selectedLineageId))
      .limit(1)
    if (!lin) throw new CharacterValidationError(`Lignée introuvable (id=${d.selectedLineageId}).`)
    if (lin.speciesId !== d.speciesId) throw new CharacterValidationError(`La lignée (id=${d.selectedLineageId}) n'appartient pas à l'espèce (id=${d.speciesId}).`)
  }

  for (const asc of d.abilityScoreChoices ?? []) {
    const [prog] = await db
      .select({ kind: schema.progression.kind, optionSource: schema.progression.optionSource })
      .from(schema.progression)
      .where(eq(schema.progression.id, asc.progressionId))
      .limit(1)
    if (!prog || prog.kind !== 'ability_scores') throw new CharacterValidationError(`Le point de choix de caractéristiques (id=${asc.progressionId}) est inconnu ou n'est pas une triade.`)
    const source = prog.optionSource as { type: string, from?: AbilityKey[], distributions?: readonly ('2+1' | '1+1+1')[] }
    if (source.type !== 'abilities' || !source.from || !source.distributions) throw new CharacterValidationError(`Le point de choix (id=${asc.progressionId}) n'offre pas de répartition de caractéristiques.`)
    const check = isValidAbilityDistribution(asc.payload as Partial<Record<AbilityKey, number>>, { from: source.from, distributions: source.distributions })
    if (!check.ok) throw new CharacterValidationError(check.reason ?? `Répartition de caractéristiques invalide (progression id=${asc.progressionId}).`)
  }

  // Le nombre et la maîtrise réelle des armes restent front-autoritaires.
  for (const wm of d.weaponMasteryChoices ?? []) {
    const [prog] = await db
      .select({ kind: schema.progression.kind })
      .from(schema.progression)
      .where(eq(schema.progression.id, wm.progressionId))
      .limit(1)
    if (!prog || prog.kind !== 'weapon_mastery') throw new CharacterValidationError(`Le point de choix de maîtrise d'armes (id=${wm.progressionId}) est inconnu ou n'est pas une maîtrise d'armes.`)
  }

  const invocationIds = d.invocationIds ?? []
  const metamagicIds = d.metamagicIds ?? []
  const expertiseSkills = d.expertiseSkills ?? []
  const needsCatalog = invocationIds.length > 0 || metamagicIds.length > 0 || d.pactBoon != null || (d.arcaneMysteria?.length ?? 0) > 0 || expertiseSkills.length > 0
  if (!needsCatalog) return

  const catalog = await buildCatalog(db, { classIds: [classId] })
  const { choices } = resolveChoices({ classLevels: { [classId]: d.level }, subclassIds: subclassId != null ? [subclassId] : [] }, catalog)

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

  if (metamagicIds.length > 0) {
    const mmChoice = choices.find(c => c.kind === 'metamagic')
    if (!mmChoice) throw new CharacterValidationError(`Cette classe ne peut pas choisir d'options de métamagie au niveau ${d.level}.`)
    const inGroup = await db
      .select({ id: schema.features.id })
      .from(schema.features)
      .where(and(eq(schema.features.tag, 'metamagic'), inArray(schema.features.id, metamagicIds)))
    if (inGroup.length !== metamagicIds.length) throw new CharacterValidationError(`Une option de métamagie choisie est inconnue ou n'est pas une métamagie.`)
    if (metamagicIds.length > mmChoice.count) throw new CharacterValidationError(`Trop d'options de métamagie (${metamagicIds.length} pour un maximum de ${mmChoice.count}).`)
  }

  if (d.pactBoon != null && !choices.some(c => c.kind === 'pact_boon')) {
    throw new CharacterValidationError(`Cette classe ne peut pas choisir de faveur de pacte au niveau ${d.level}.`)
  }

  // Matcher par maxLevel évite d'accepter un arcanum niv. 9 pour un occultiste 13.
  for (const arc of d.arcaneMysteria ?? []) {
    const legal = choices.some(c =>
      c.kind === 'spell'
      && c.optionSource.type === 'spells'
      && c.optionSource.maxLevel === arc.spellLevel
      && c.options.some(o => o.spellId === arc.spellId))
    if (!legal) throw new CharacterValidationError(`Le sort d'arcanum mystique de niveau ${arc.spellLevel} (id=${arc.spellId}) n'est pas un choix légal au niveau ${d.level}.`)
  }

  // L'appartenance des compétences reste front-autoritaire : le set maîtrisé (octrois d'espèce
  // inclus) n'est pas connu ici. On ne borne donc qu'au total cumulatif dû.
  if (expertiseSkills.length > 0) {
    const expChoice = choices.find(c => c.kind === 'expertise')
    if (!expChoice) throw new CharacterValidationError(`Cette classe ne peut pas choisir d'expertise au niveau ${d.level}.`)
    if (expertiseSkills.length > expChoice.count) throw new CharacterValidationError(`Trop de compétences d'expertise (${expertiseSkills.length} pour un maximum de ${expChoice.count}).`)
  }
}

export async function createCharacter(db: Db, d: CreateCharacterInput, ownerId: number): Promise<{ id: number }> {
  // 1. Lectures des entités résolues côté client
  const [cls] = await db
    .select({ id: schema.classes.id, hitDice: schema.classes.hitDice, spellcastingType: schema.classes.spellcastingType, ruleset: schema.classes.ruleset })
    .from(schema.classes)
    .where(eq(schema.classes.id, d.classId))
    .limit(1)
  if (!cls) throw new CharacterValidationError(`Classe introuvable (id=${d.classId}).`)

  const subclassId: number | null = d.subclassId ?? null
  const speciesId: number | null = d.speciesId ?? null

  // Les maîtrises fixes de l'historique sont dérivées par la fiche, pas matérialisées ici.
  let backgroundId: number | null = d.backgroundId ?? null
  if (backgroundId) {
    const [bg] = await db
      .select({ id: schema.backgrounds.id })
      .from(schema.backgrounds)
      .where(and(eq(schema.backgrounds.id, backgroundId), sql`${schema.backgrounds.characterSheetId} IS NULL`))
      .limit(1)
    if (!bg) {
      console.warn(`[createCharacter] backgroundId=${backgroundId} non trouvé en DB (ignoré)`)
      backgroundId = null
    }
  }

  const itemIds: number[] = d.inventoryItemIds ?? []
  if (d.inventoryItemNamesUnresolved?.length) {
    console.warn('[createCharacter] items non résolus côté client :', d.inventoryItemNamesUnresolved)
  }

  // 2. Validation serveur (autorité) — AVANT toute écriture
  const ruleset: Ruleset = cls.ruleset
  await validateRulesetCoherence(db, d, ruleset)
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

  let familiarSpellId: number | null = null
  if (d.pactBoon === 'chain') {
    const [familiar] = await db
      .select({ id: schema.spells.id })
      .from(schema.spells)
      .where(eq(schema.spells.name, 'Appel de familier'))
      .limit(1)
    familiarSpellId = familiar?.id ?? null
  }

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

  // Sorts innés d'espèce (+ lignée) matérialisés en `character_spells`, sinon ils restent en prose.
  // Nom → id filtré par `ruleset` : deux éditions peuvent partager un nom.
  let speciesGrantSpellIds: number[] = []
  if (speciesId != null) {
    const baseFeatureRows = await db
      .select({ featureId: schema.speciesFeatures.featureId })
      .from(schema.speciesFeatures)
      .where(eq(schema.speciesFeatures.speciesId, speciesId))
    const lineageFeatureRows = d.selectedLineageId != null
      ? await db
          .select({ id: schema.features.id })
          .from(schema.features)
          .where(eq(schema.features.lineageId, d.selectedLineageId))
      : []
    const featureIds = [...baseFeatureRows.map(r => r.featureId), ...lineageFeatureRows.map(r => r.id)]
    if (featureIds.length) {
      const grants = await db
        .select({ value: schema.effects.value })
        .from(schema.featureEffects)
        .innerJoin(schema.effects, eq(schema.featureEffects.effectId, schema.effects.id))
        .where(and(inArray(schema.featureEffects.featureId, featureIds), eq(schema.effects.type, 'spell_grant')))
      const spellNames = grants
        .map(r => r.value as { spellName?: string, unlockLevel?: number } | null)
        .filter((v): v is { spellName: string, unlockLevel?: number } =>
          typeof v?.spellName === 'string' && (v.unlockLevel ?? 0) <= d.level)
        .map(v => v.spellName)
      if (spellNames.length) {
        const spellRows = await db
          .select({ id: schema.spells.id })
          .from(schema.spells)
          .where(and(inArray(schema.spells.name, spellNames), eq(schema.spells.ruleset, ruleset)))
        speciesGrantSpellIds = spellRows.map(s => s.id)
      }
    }
  }

  let lineageProgressionId: number | null = null
  if (d.selectedLineageId != null && speciesId != null) {
    const [prog] = await db
      .select({ id: schema.progression.id })
      .from(schema.progression)
      .innerJoin(schema.speciesFeatures, eq(schema.speciesFeatures.featureId, schema.progression.featureId))
      .where(and(eq(schema.progression.kind, 'lineage'), eq(schema.speciesFeatures.speciesId, speciesId)))
      .limit(1)
    if (!prog) throw new CharacterValidationError(`L'espèce (id=${speciesId}) n'a pas de point de choix de lignée — structure non seedée ?`)
    lineageProgressionId = prog.id
  }

  // `character_choices` est la source de la décision ; `character_classes.subclass_id` reste écrit (projection).
  let subclassProgressionId: number | null = null
  if (subclassId != null) {
    const [prog] = await db
      .select({ id: schema.progression.id })
      .from(schema.progression)
      .innerJoin(schema.features, eq(schema.features.id, schema.progression.featureId))
      .where(and(eq(schema.progression.kind, 'subclass'), eq(schema.features.classId, cls.id)))
      .limit(1)
    subclassProgressionId = prog?.id ?? null
  }

  const fightingStylePick = d.fightingStyle
    ? await resolveFightingStylePick(db, cls.id, d.fightingStyle, d.level)
    : null

  const expertiseProgressionId = d.expertiseSkills?.length
    ? await resolveExpertiseProgressionId(db, cls.id)
    : null

  // 4. Insert de la fiche (HORS batch — id auto-incrément)
  const hitDieMatch = cls.hitDice?.match(/\d+d(\d+)/)
  const hitDieSides = hitDieMatch?.[1]
  const currentHitDie = hitDieSides ? [{ die: hitDieSides, count: d.level }] : []

  const [sheet] = await db
    .insert(schema.characterSheets)
    .values({
      ownerId,
      name: d.name,
      ruleset,
      speciesId: speciesId ?? undefined,
      backgroundId: backgroundId ?? undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      alignment: alignmentCodeFromBuilderId(d.alignment) as any,
      maxHp: d.maxHp,
      currentHp: d.maxHp,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentHitDie: currentHitDie as any,
      dragonbornAncestry: d.dragonbornAncestry ?? null,
      personalityTraits: d.personality ?? '',
      ideals: d.ideals ?? '',
      bonds: d.bonds ?? '',
      flaws: d.flaws ?? '',
      age: d.age ?? '',
      height: d.height ?? '',
      weight: d.weight ?? '',
      eyes: d.eyes ?? '',
      hair: d.hair ?? '',
      skin: d.skin ?? '',
      deity: d.deity ?? '',
      backstory: d.backstory ?? '',
      allies: d.allies ?? '',
      portraitUrl: d.portraitUrl ?? '',
      pp: d.pp ?? 0,
      po: d.po ?? 0,
      pe: d.pe ?? 0,
      pa: d.pa ?? 0,
      pc: d.pc ?? 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .returning()
  const sheetId = sheet!.id

  // Hors batch : son id est requis pour la liaison.
  let customBackgroundId: number | null = null
  if (d.customBackgroundName) {
    const [customBg] = await db
      .insert(schema.backgrounds)
      .values({ name: d.customBackgroundName, characterSheetId: sheetId })
      .returning()
    customBackgroundId = customBg!.id
  }

  // 5. Écritures dépendantes — un seul db.batch() atomique
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stmts: any[] = []

  if (customBackgroundId != null) {
    stmts.push(db.update(schema.characterSheets).set({ backgroundId: customBackgroundId }).where(eq(schema.characterSheets.id, sheetId)))
  }

  stmts.push(db.insert(schema.characterClasses).values({
    characterSheetId: sheetId,
    classId: cls.id,
    level: d.level,
    isMain: true,
    subclassId,
    pactBoon: d.pactBoon ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any))

  if (d.selectedLineageId != null && lineageProgressionId != null) {
    stmts.push(db.insert(schema.characterChoices).values({
      characterSheetId: sheetId,
      progressionId: lineageProgressionId,
      selectedLineageId: d.selectedLineageId,
    }))
  }

  if (subclassId != null && subclassProgressionId != null) {
    stmts.push(db.insert(schema.characterChoices).values({
      characterSheetId: sheetId,
      progressionId: subclassProgressionId,
      selectedSubclassId: subclassId,
    }).onConflictDoNothing())
  }

  if (fightingStylePick) {
    stmts.push(db.insert(schema.characterChoices).values({
      characterSheetId: sheetId,
      progressionId: fightingStylePick.progressionId,
      selectedFeatureId: fightingStylePick.featureId,
    }).onConflictDoNothing())
    stmts.push(db.insert(schema.characterFeatures)
      .values({ characterSheetId: sheetId, featureId: fightingStylePick.featureId, currentUses: 0 })
      .onConflictDoNothing())
  }

  if (d.abilityScoreChoices?.length) {
    stmts.push(db.insert(schema.characterChoices).values(
      d.abilityScoreChoices.map(asc => ({
        characterSheetId: sheetId,
        progressionId: asc.progressionId,
        payload: asc.payload as Partial<Record<AbilityKey, number>>,
      })),
    ))
  }

  if (d.weaponMasteryChoices?.length) {
    const wmRows = d.weaponMasteryChoices.flatMap(wm =>
      wm.weapons.map(weapon => ({ characterSheetId: sheetId, progressionId: wm.progressionId, selectedValue: weapon })),
    )
    if (wmRows.length) stmts.push(db.insert(schema.characterChoices).values(wmRows).onConflictDoNothing())
  }

  if (passiveFeatureIds.length) {
    stmts.push(db.insert(schema.characterFeatures).values(
      passiveFeatureIds.map(featureId => ({ characterSheetId: sheetId, featureId, currentUses: 0 })),
    ))
  }

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

  // Faveur des fées (dons marqués `other:{kind:'fey_touched_spells'}`) : octroie Foulée brumeuse
  // (fixe) + le sort de niveau 1 choisi (choices.spellId) comme sorts connus (source 'feat').
  const feyFeatEntries = [
    ...(d.asiFeats ?? []).map(f => ({ featureId: f.featureId, spellId: f.choices?.spellId })),
    ...(d.bonusFeatureId ? [{ featureId: d.bonusFeatureId, spellId: d.bonusFeatChoices?.spellId }] : []),
  ]
  if (feyFeatEntries.length) {
    const markers = await db
      .select({ featureId: schema.featureEffects.featureId, value: schema.effects.value })
      .from(schema.featureEffects)
      .innerJoin(schema.effects, eq(schema.featureEffects.effectId, schema.effects.id))
      .where(and(
        inArray(schema.featureEffects.featureId, feyFeatEntries.map(f => f.featureId)),
        eq(schema.effects.type, 'other'),
      ))
    const feyFeatIds = new Set(
      markers.filter(m => (m.value as { kind?: string } | null)?.kind === 'fey_touched_spells').map(m => m.featureId),
    )
    if (feyFeatIds.size) {
      const featSpellIds = new Set<number>()
      const [mistyStep] = await db
        .select({ id: schema.spells.id })
        .from(schema.spells)
        .where(eq(schema.spells.name, 'Foulée brumeuse'))
        .limit(1)
      if (mistyStep) featSpellIds.add(mistyStep.id)
      for (const entry of feyFeatEntries) {
        if (feyFeatIds.has(entry.featureId) && entry.spellId != null) featSpellIds.add(entry.spellId)
      }
      if (featSpellIds.size) {
        stmts.push(db.insert(schema.characterSpells)
          .values([...featSpellIds].map(spellId => ({ characterSheetId: sheetId, spellId, isKnown: true, isPrepared: false, source: 'feat' as const })))
          .onConflictDoNothing())
      }
    }
  }

  const abilityEntries = Object.entries(d.abilityScores)
  if (abilityEntries.length) {
    stmts.push(db.insert(schema.characterAbilityScores).values(
      abilityEntries.map(([key, value]) => ({ characterSheetId: sheetId, abilityId: key, value })),
    ))
  }

  const skillRows = [
    ...d.classSkills.map(key => ({ characterSheetId: sheetId, skillKey: key, proficiencyLevel: 'proficient' as const, source: 'class' as const, isOverride: false })),
    ...d.classSavingThrows.map(key => ({ characterSheetId: sheetId, skillKey: savingThrowKey(key), proficiencyLevel: 'proficient' as const, source: 'class' as const, isOverride: false })),
    ...d.backgroundSkills.map(key => ({ characterSheetId: sheetId, skillKey: key, proficiencyLevel: 'proficient' as const, source: 'background' as const, isOverride: false })),
  ]
  if (skillRows.length) {
    stmts.push(db.insert(schema.characterSkills).values(skillRows))
  }

  // Après skillRows dans le batch : l'upsert 'expert' élève la compétence de classe insérée juste
  // avant en 'proficient' (dépendance d'ordre).
  if (d.expertiseSkills?.length) {
    stmts.push(...expertiseWriteStmts(db, sheetId, expertiseProgressionId, d.expertiseSkills))
  }

  // Seuls les outils/langues choisis sont stockés ; les maîtrises de base sont dérivées par la fiche.
  // `armorProficiencyKeys` / `weaponProficiencyKeys` sont vestigiaux (acceptés, ignorés).
  const proficiencyRows = [
    ...d.toolProficiencyChoices.map(value => ({ characterSheetId: sheetId, proficiencyType: 'tool' as const, value, action: 'grant' as const })),
    ...d.selectedLanguages.map(value => ({ characterSheetId: sheetId, proficiencyType: 'language' as const, value, action: 'grant' as const })),
  ]
  if (proficiencyRows.length) {
    stmts.push(db.insert(schema.characterProficiencyOverrides).values(proficiencyRows))
  }

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

  if (d.spellIds.length) {
    stmts.push(db.insert(schema.characterSpells).values(
      d.spellIds.map(spellId => ({ characterSheetId: sheetId, spellId, isKnown: true, isPrepared: true })),
    ))
  }

  // isPactWeapon posé à l'insert pour éviter un read+update.
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

  if (speciesGrantSpellIds.length) {
    stmts.push(db.insert(schema.characterSpells)
      .values(speciesGrantSpellIds.map(spellId => ({ characterSheetId: sheetId, spellId, isKnown: true, isPrepared: false, source: 'species' as const })))
      .onConflictDoNothing())
  }

  if (d.metamagicIds?.length) {
    stmts.push(db.insert(schema.characterFeatures)
      .values(d.metamagicIds.map(featureId => ({ characterSheetId: sheetId, featureId, currentUses: 0 })))
      .onConflictDoNothing())
  }

  for (const arc of d.arcaneMysteria ?? []) {
    const source = ARCANUM_SPELL_LEVEL_TO_SOURCE[arc.spellLevel]
    if (source) {
      stmts.push(db.insert(schema.characterSpells)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .values({ characterSheetId: sheetId, spellId: arc.spellId, isKnown: true, isPrepared: false, source } as any)
        .onConflictDoNothing())
    }
  }

  if (d.bookOfAncientSecretsSpellIds?.length) {
    stmts.push(db.insert(schema.characterSpells)
      .values(d.bookOfAncientSecretsSpellIds.map(spellId => ({ characterSheetId: sheetId, spellId, isKnown: true, isPrepared: false, source: 'book_of_ancient_secrets' as const })))
      .onConflictDoNothing())
  }

  if (stmts.length) {
    // `.batch()` n'est pas sur `BaseSQLiteDatabase` (il vit sur les drivers d1/libsql) → cast.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).batch(stmts as [any, ...any[]])
  }

  return { id: sheetId }
}
