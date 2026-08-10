import { and, eq, inArray, lte, sql } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { z } from 'zod'
import * as schema from '~~/server/db/schema'
import { isPassiveGrant } from '~~/server/utils/features'
import { buildCatalog } from '~~/server/utils/catalog'
import { abilityEnum, savingThrowKey } from '~~/shared/rules/abilities'
import { slotsForLevel } from '~~/shared/rules/spellSlots'
import { resolveChoices } from '~~/shared/rules/resolve'
import { isValidAbilityDistribution } from '~~/shared/rules/composite'
import type { Ruleset } from '~~/shared/rules/ruleset'
import type { AbilityKey } from '~~/shared/rules/abilities'

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
  // Lignée choisie (sous-race 2014 / lignée 2024, cf. D17) — une `species_lineages.id`. La fiche
  // en dérive les traits via un `character_choices.selected_lineage_id` (résolu côté client).
  selectedLineageId: z.number().int().positive().nullable().optional(),
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
  // Arcanums mystiques (Occultiste niv 11/13/15/17) — un sort de niv 6/7/8/9 par palier
  // débloqué (cumulatif à la création d'un perso de haut niveau).
  arcaneMysteria: z.array(z.object({
    spellLevel: z.number().int().min(6).max(9),
    spellId: z.number().int().positive(),
  })).optional(),
  // Livre des secrets anciens — 2 sorts rituels niv 1 quand la manifestation est choisie
  bookOfAncientSecretsSpellIds: z.array(z.number().int().positive()).max(2).optional(),
  // Choix composites de caractéristiques (triade d'origine 2024) — répartition {str:2,dex:1}
  // enregistrée en `character_choices.payload`. Chaque pick réfère la progression `ability_scores`
  // dont il doit respecter la distribution (validé serveur via isValidAbilityDistribution, C1).
  // Vide pour tout parcours 2014 → no-op (aucune progression `ability_scores` n'y existe).
  abilityScoreChoices: z
    .array(z.object({
      progressionId: z.number().int().positive(),
      payload: z.record(abilityEnum, z.number().int().min(1).max(2)),
    }))
    .optional()
    .default([]),
})

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>

/**
 * Garde de COHÉRENCE d'ÉDITION (défense en profondeur, Lot A). L'UI filtrée n'expose jamais
 * un mélange, mais une requête FORGÉE pourrait poser une entité 5.5 sur une fiche 2014. On
 * exige que toute entité datée référencée (espèce, historique global, aptitudes/dons, sorts)
 * partage le `ruleset` de la CLASSE — l'ancre (`classId` obligatoire), estampillée sur la fiche.
 * Sous-classe omise : `subclasses` n'a pas de `ruleset` (parent-gated, déjà validée ∈ classe).
 * No-op tant que tout est en '5'. Historique homebrew (per-fiche) ignoré (créé ici même).
 */
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
  ]
  if (featureIds.length) {
    const rows = await db
      .select({ id: schema.features.id, ruleset: schema.features.ruleset })
      .from(schema.features)
      .where(inArray(schema.features.id, featureIds))
    const bad = rows.find(r => r.ruleset !== ruleset)
    if (bad) throw new CharacterValidationError(`Une aptitude/un don référencé (id=${bad.id}, éd. ${bad.ruleset}) est incompatible avec l'édition de la fiche (${ruleset}).`)
  }

  // Sorts : datés par édition depuis 0089 (description/effets divergents) → même contrainte.
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

  // V6 — lignée (D17) : la lignée choisie doit appartenir à l'espèce de base du perso
  // (symétrique de sous-classe∈classe). La progression est dérivée à l'écriture.
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

  // V7 — triade d'origine 2024 (`ability_scores`) : chaque pick doit référer une progression
  // `ability_scores` et respecter SA distribution (validateur pur C1). Résolu directement par la
  // progression (indépendant du catalogue). Vide en 2014 → boucle no-op.
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

  const invocationIds = d.invocationIds ?? []
  const needsCatalog = invocationIds.length > 0 || d.pactBoon != null || (d.arcaneMysteria?.length ?? 0) > 0
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

  // V5 — arcanums mystiques : chaque sort doit être un choix légal du palier correspondant,
  // c.-à-d. un point de choix `spell` de MÊME maxLevel réellement débloqué au niveau du perso
  // (matcher par maxLevel évite d'accepter un arcanum niv. 9 pour un occultiste 13).
  for (const arc of d.arcaneMysteria ?? []) {
    const legal = choices.some(c =>
      c.kind === 'spell'
      && c.optionSource.type === 'spells'
      && c.optionSource.maxLevel === arc.spellLevel
      && c.options.some(o => o.spellId === arc.spellId))
    if (!legal) throw new CharacterValidationError(`Le sort d'arcanum mystique de niveau ${arc.spellLevel} (id=${arc.spellId}) n'est pas un choix légal au niveau ${d.level}.`)
  }
}

export async function createCharacter(db: Db, d: CreateCharacterInput, ownerId: number): Promise<{ id: number }> {
  // ── 1. Lectures des entités résolues côté client ────────────────────────────
  const [cls] = await db
    .select({ id: schema.classes.id, hitDice: schema.classes.hitDice, spellcastingType: schema.classes.spellcastingType, ruleset: schema.classes.ruleset })
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
  // Édition figée par la CLASSE (ancre), estampillée sur la fiche + garde de cohérence.
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

  // Choix de lignée (D17) : on rattache le pick à la progression `kind:'lineage'` portée par une
  // `species_feature` de l'espèce de base, pour que la fiche dérive la lignée (cf. lineageDerivation).
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

  // ── 4. Insert de la fiche (HORS batch — id auto-incrément) ───────────────────
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

  // Choix de lignée (D17) → character_choices : la fiche dérive la lignée via selected_lineage_id.
  if (d.selectedLineageId != null && lineageProgressionId != null) {
    stmts.push(db.insert(schema.characterChoices).values({
      characterSheetId: sheetId,
      progressionId: lineageProgressionId,
      selectedLineageId: d.selectedLineageId,
    }))
  }

  // Triade d'origine 2024 (`ability_scores`) → character_choices.payload : la fiche dérive
  // l'augmentation de caractéristiques via `deriveAbilityScoreChoices`. No-op en 2014.
  if (d.abilityScoreChoices?.length) {
    stmts.push(db.insert(schema.characterChoices).values(
      d.abilityScoreChoices.map(asc => ({
        characterSheetId: sheetId,
        progressionId: asc.progressionId,
        payload: asc.payload as Partial<Record<AbilityKey, number>>,
      })),
    ))
  }

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

  // Arcanums mystiques — un sort 1×/repos long par palier débloqué (source arcanum_*)
  for (const arc of d.arcaneMysteria ?? []) {
    const source = ARCANUM_SPELL_LEVEL_TO_SOURCE[arc.spellLevel]
    if (source) {
      stmts.push(db.insert(schema.characterSpells)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .values({ characterSheetId: sheetId, spellId: arc.spellId, isKnown: true, isPrepared: false, source } as any)
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
